import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getTestCaptureRangeAllowedNameKey, isTestCaptureRangeAccountIdentity } from "../domain/players/testCaptureRangeAccess";
import { TEST_UNLIMITED_CAPTURE_RANGE_DURATION_MILLISECONDS } from "../domain/players/playerBuffs";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";

const TEST_CAPTURE_RANGE_HISTORY_SUBCOLLECTION = "testCaptureRangeHistory" as const;
const TEST_CAPTURE_RANGE_LIVE_PROJECT_ID = "growgo-development" as const;
const PRIVATE_ALPHA_CAPTURE_ENABLED_ENV = "GROWGO_PRIVATE_ALPHA_CAPTURE_ENABLED" as const;

export async function toggleTestCaptureRangeHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);

  const payload = asObject(request.data, "test capture range request");
  assertAllowedKeys(payload, ["deviceId", "enabled"], "test capture range request");
  if (typeof payload.enabled !== "boolean") {
    throw new HttpsError("invalid-argument", "Choose whether test capture range should be enabled.");
  }

  const actualProjectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
  if (
    runtimeConfig.projectId !== TEST_CAPTURE_RANGE_LIVE_PROJECT_ID ||
    (!process.env.FIRESTORE_EMULATOR_HOST && actualProjectId !== TEST_CAPTURE_RANGE_LIVE_PROJECT_ID)
  ) {
    throw new HttpsError("failed-precondition", "Test capture range is not available in this GrowGo environment.");
  }
  if (process.env[PRIVATE_ALPHA_CAPTURE_ENABLED_ENV] !== "true") {
    throw new HttpsError("failed-precondition", "Test capture range is unavailable while pin capture is offline.");
  }

  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const now = Timestamp.now();
  const expiresAt = payload.enabled
    ? Timestamp.fromMillis(now.toMillis() + TEST_UNLIMITED_CAPTURE_RANGE_DURATION_MILLISECONDS)
    : null;

  const result = await db.runTransaction(async (transaction) => {
    const playerSnapshot = await transaction.get(playerRef);
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before using this test control.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete || !player.displayName) {
      throw new HttpsError("failed-precondition", "Complete your GrowGo profile before using this test control.");
    }

    const nameKey = getTestCaptureRangeAllowedNameKey(player.displayName);
    if (!nameKey) {
      throw new HttpsError("permission-denied", "This test control is only available to Rubberlips and Obi-Cal.");
    }
    const reservedNameSnapshot = await transaction.get(db.collection("playerNames").doc(nameKey));
    if (!isTestCaptureRangeAccountIdentity({
      displayName: player.displayName,
      authenticatedUid: authContext.uid,
      reservedUid: reservedNameSnapshot.data()?.uid
    })) {
      throw new HttpsError("permission-denied", "This GrowGo account is not eligible for the test control.");
    }

    transaction.update(playerRef, {
      testUnlimitedCaptureRangeExpiresAt: expiresAt,
      updatedAt: now
    });
    transaction.set(playerRef.collection(TEST_CAPTURE_RANGE_HISTORY_SUBCOLLECTION).doc(), {
      schemaVersion: 1,
      kind: "test-unlimited-capture-range",
      actorUid: authContext.uid,
      enabled: payload.enabled,
      expiresAt,
      createdAt: now
    });

    return { displayName: player.displayName };
  });

  return {
    ok: true,
    displayName: result.displayName,
    enabled: payload.enabled,
    expiresAt: expiresAt?.toDate().toISOString() ?? null
  };
}

export const toggleTestCaptureRange = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  toggleTestCaptureRangeHandler
);
