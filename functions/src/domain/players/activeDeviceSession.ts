import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";
import { requirePlayerAccountIsActive } from "./playerModeration";

export const ACTIVE_DEVICE_SESSION_ENV =
  "GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED" as const;
export const DEVICE_TRANSFER_MAX_AUTH_AGE_SECONDS = 10 * 60;
export const DEVICE_ACTIVITY_WRITE_INTERVAL_MS = 60_000;

interface StoredActiveDeviceSession {
  schemaVersion: 1;
  deviceHash: string;
  activatedAt: Date;
  lastSeenAt: Date;
}

interface DeviceSessionRequestContext {
  uid: string;
  deviceId: string | undefined;
}

export function isActiveDeviceSessionEnforced(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[ACTIVE_DEVICE_SESSION_ENV] === "true";
}

export function getPlayerSessionDocumentRef(uid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection("playerSessions").doc(uid);
}

export function requireDeviceId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{22,128}$/.test(value)) {
    throw new HttpsError(
      "invalid-argument",
      "This device could not be verified. Please update GrowGo and try again."
    );
  }

  return value;
}

export function hashDeviceId(deviceId: string): string {
  return createHash("sha256").update(deviceId, "utf8").digest("hex");
}

export async function establishActiveDeviceSessionIfEnabled(
  params: DeviceSessionRequestContext & {
    env?: Readonly<Record<string, string | undefined>>;
  }
): Promise<{ enforced: boolean }> {
  // This check intentionally happens even when the one-device session switch
  // is off. A restriction must still take effect immediately across every
  // normal bootstrap and gameplay path.
  await requirePlayerAccountIsActive(params.uid);

  if (!isActiveDeviceSessionEnforced(params.env)) {
    return { enforced: false };
  }

  const deviceHash = hashDeviceId(requireDeviceId(params.deviceId));
  const sessionRef = getPlayerSessionDocumentRef(params.uid);

  await getAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(sessionRef);
    const now = Timestamp.now();

    if (!snapshot.exists) {
      transaction.create(sessionRef, {
        schemaVersion: 1,
        deviceHash,
        activatedAt: now,
        lastSeenAt: now
      });
      return;
    }

    const session = readStoredActiveDeviceSession(snapshot.data());
    if (session.deviceHash !== deviceHash) {
      throw new HttpsError(
        "failed-precondition",
        "This account is active on another device. Use Move Account to This Device after signing in again."
      );
    }

    transaction.update(sessionRef, { lastSeenAt: now });
  });

  return { enforced: true };
}

export async function requireActiveDeviceSessionIfEnabled(
  params: DeviceSessionRequestContext & {
    env?: Readonly<Record<string, string | undefined>>;
  }
): Promise<{ enforced: boolean }> {
  return verifyDeviceSession(params, true);
}

/**
 * Confirms the one-device rule without updating the session's activity time.
 *
 * This is deliberately separate from requireActiveDeviceSessionIfEnabled:
 * a map view is a read-only operation and can happen many times while a
 * player pans around. It must retain the same account and device checks,
 * without turning every harmless map refresh into a Firestore write.
 */
export async function verifyActiveDeviceSessionIfEnabled(
  params: DeviceSessionRequestContext & {
    env?: Readonly<Record<string, string | undefined>>;
  }
): Promise<{ enforced: boolean }> {
  return verifyDeviceSession(params, false);
}

async function verifyDeviceSession(
  params: DeviceSessionRequestContext & { env?: Readonly<Record<string, string | undefined>> },
  recordActivity: boolean
): Promise<{ enforced: boolean }> {
  // Every server-authoritative game action already passes through this gate.
  // Keeping the account-status check here prevents a currently open game from
  // continuing after a staff suspension or ban.
  await requirePlayerAccountIsActive(params.uid);

  if (!isActiveDeviceSessionEnforced(params.env)) {
    return { enforced: false };
  }

  const deviceHash = hashDeviceId(requireDeviceId(params.deviceId));
  const sessionRef = getPlayerSessionDocumentRef(params.uid);
  const snapshot = await sessionRef.get();

  if (!snapshot.exists) {
    throw new HttpsError(
      "failed-precondition",
      "This device has not started an active GrowGo session. Please sign in again."
    );
  }

  const session = readStoredActiveDeviceSession(snapshot.data());
  if (session.deviceHash !== deviceHash) {
    throw new HttpsError(
      "failed-precondition",
      "This account is active on another device. Use Move Account to This Device after signing in again."
    );
  }

  const now = Timestamp.now();
  const age = now.toMillis() - session.lastSeenAt.getTime();
  if (recordActivity && (age >= DEVICE_ACTIVITY_WRITE_INTERVAL_MS || age < 0)) {
    // Reuse the verified read. A precondition prevents concurrent requests from
    // repeatedly writing or overwriting a newly transferred device's activity.
    try {
      await sessionRef.update({ lastSeenAt: now }, { lastUpdateTime: snapshot.updateTime! });
    } catch (error) {
      if ((error as { code?: unknown })?.code !== 9) throw error;
      // Another action changed the session: recheck fresh authority without
      // another activity write. Never cache authorization or ignore a transfer.
      return verifyDeviceSession(params, false);
    }
  }
  return { enforced: true };
}

export async function transferActiveDeviceSession(params: {
  uid: string;
  deviceId: unknown;
  authTimeSeconds: unknown;
  env?: Readonly<Record<string, string | undefined>>;
}): Promise<{ enforced: boolean; transferred: boolean }> {
  if (!isActiveDeviceSessionEnforced(params.env)) {
    return { enforced: false, transferred: false };
  }

  const authTimeSeconds = Number(params.authTimeSeconds);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(authTimeSeconds) ||
    authTimeSeconds <= 0 ||
    nowSeconds - authTimeSeconds > DEVICE_TRANSFER_MAX_AUTH_AGE_SECONDS
  ) {
    throw new HttpsError(
      "failed-precondition",
      "For your security, sign in with Google again before moving your account."
    );
  }

  const sessionRef = getPlayerSessionDocumentRef(params.uid);
  const now = Timestamp.now();
  await sessionRef.set({
    schemaVersion: 1,
    deviceHash: hashDeviceId(requireDeviceId(params.deviceId)),
    activatedAt: now,
    lastSeenAt: now
  });

  return { enforced: true, transferred: true };
}

function readStoredActiveDeviceSession(data: DocumentData | undefined): StoredActiveDeviceSession {
  if (!data || typeof data !== "object" || data.schemaVersion !== 1) {
    throw new HttpsError("internal", "Stored device session is invalid.");
  }

  if (typeof data.deviceHash !== "string" || !/^[a-f0-9]{64}$/.test(data.deviceHash)) {
    throw new HttpsError("internal", "Stored device session is invalid.");
  }

  const activatedAt = asDate(data.activatedAt);
  const lastSeenAt = asDate(data.lastSeenAt);

  return {
    schemaVersion: 1,
    deviceHash: data.deviceHash,
    activatedAt,
    lastSeenAt
  };
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  throw new HttpsError("internal", "Stored device session is invalid.");
}
