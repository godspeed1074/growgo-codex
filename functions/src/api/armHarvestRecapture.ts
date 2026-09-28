import { createHash } from "node:crypto";
import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireDevelopmentBackendOperationalSafeguardAccess
} from "../config/developmentBackendOperationalSafeguards";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";
import {
  requireDevelopmentBackendCapabilityAccess
} from "../security/developmentBackendCapabilityGuard";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireString
} from "../validation/requestValidation";

export async function armHarvestRecaptureHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const payload = asObject(request.data, "armHarvestRecapture payload");
  assertAllowedKeys(payload, ["deviceId", "pinId"], "armHarvestRecapture payload");
  const pinId = requireString(payload.pinId, "pinId", 1, 128);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  const now = new Date();
  const captureDay = now.toISOString().slice(0, 10);
  const pinKey = createHash("sha256").update(pinId, "utf8").digest("hex");
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const captureRef = db
    .collection("playerCaptureStates")
    .doc(authContext.uid)
    .collection("pins")
    .doc(pinKey);
  const overrideRef = db
    .collection("playerHarvestRecaptureOverrides")
    .doc(authContext.uid)
    .collection("pins")
    .doc(pinKey);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, captureSnapshot, overrideSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(captureRef),
      transaction.get(overrideRef)
    ]);

    if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before reopening a harvest.");
    }

    const capture = captureSnapshot.data();
    if (!captureSnapshot.exists || capture?.pinId !== pinId || capture?.captureDay !== captureDay) {
      throw new HttpsError("failed-precondition", "Capture this pin before reopening its harvest today.");
    }

    const existingOverride = overrideSnapshot.data();
    if (existingOverride?.captureDay === captureDay && existingOverride?.used === true) {
      throw new HttpsError("already-exists", "This crop has already been reopened today.");
    }

    transaction.set(overrideRef, {
      schemaVersion: 1,
      pinId,
      captureDay,
      armedAt: Timestamp.fromDate(now),
      used: false
    });

    return { ok: true, armed: true, pinId };
  });
}

export const armHarvestRecapture = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  armHarvestRecaptureHandler
);
