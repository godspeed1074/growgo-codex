import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";

export const PLAYER_MODERATION_COLLECTION = "playerModeration" as const;
export const PLAYER_MODERATION_SCHEMA_VERSION = 1 as const;

export type PlayerRestrictionStatus = "active" | "suspended" | "banned";

export interface StoredPlayerRestriction {
  status: PlayerRestrictionStatus;
  reason: string | null;
  suspendedUntil: Date | null;
  updatedAt: Date | null;
}

export function getPlayerModerationRef(uid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection(PLAYER_MODERATION_COLLECTION).doc(uid);
}

/**
 * The same document also holds non-restriction moderation signals, including
 * confirmed abusive-report counts. Older records therefore remain readable
 * and are treated as an active account unless they explicitly carry a valid
 * suspension or ban state.
 */
export function readStoredPlayerRestriction(data: DocumentData | undefined): StoredPlayerRestriction {
  if (!data || typeof data !== "object") {
    return { status: "active", reason: null, suspendedUntil: null, updatedAt: null };
  }

  const status = data.status === "suspended" || data.status === "banned"
    ? data.status
    : "active";
  const reason = typeof data.reason === "string" && data.reason.trim().length > 0
    ? data.reason.trim()
    : null;
  const suspendedUntil = asOptionalDate(data.suspendedUntil);
  const updatedAt = asOptionalDate(data.updatedAt);

  return { status, reason, suspendedUntil, updatedAt };
}

export async function requirePlayerAccountIsActive(uid: string): Promise<void> {
  const ref = getPlayerModerationRef(uid);
  const snapshot = await ref.get();
  const restriction = readStoredPlayerRestriction(snapshot.data());

  if (restriction.status === "banned") {
    throw new HttpsError(
      "permission-denied",
      "This GrowGo account has been permanently restricted. Check your email for details."
    );
  }

  if (restriction.status !== "suspended") return;

  const now = new Date();
  if (restriction.suspendedUntil && restriction.suspendedUntil.getTime() > now.getTime()) {
    throw new HttpsError(
      "permission-denied",
      `This GrowGo account is suspended until ${restriction.suspendedUntil.toLocaleString("en-AU", { timeZone: "UTC", timeZoneName: "short" })}. Check your email for details.`
    );
  }

  // A completed temporary suspension quietly returns the player to active
  // status. The moderation history itself remains append-only.
  await ref.set({
    schemaVersion: PLAYER_MODERATION_SCHEMA_VERSION,
    status: "active" as const,
    reason: null,
    suspendedUntil: null,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

function asOptionalDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  return null;
}
