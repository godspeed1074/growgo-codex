import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
import {
  SHARED_BASE_PIN_STATES_COLLECTION,
  assertSharedCropSeedId,
  serializeSharedBasePinState,
  sharedWorldDocumentId,
  type SharedBasePinState,
  type SharedCropSeedId
} from "../domain/world/sharedWorld";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireIsoTimestamp,
  requireString
} from "../validation/requestValidation";

const MAX_LEGACY_RECOVERY_PINS = 25;
const RECOVERY_COLLECTION = "legacyBasePinOwnershipRecoveries";
const LEGACY_BASE_PIN_RECOVERY_ENABLED = false;

interface LegacyPinClaim {
  pinId: string;
  level: number;
  replantEnabled: boolean;
  plant: {
    seedId: SharedCropSeedId;
    plantedAt: Date;
    miracleGrownAt: Date | null;
  } | null;
}

interface LegacyRecoveryRequest {
  pins: LegacyPinClaim[];
  deviceId: string | undefined;
}

export function validateLegacyRecoveryRequest(
  request: CallableRequest<unknown>
): LegacyRecoveryRequest {
  const payload = asObject(request.data, "recoverLegacyBasePinOwnership payload");
  assertAllowedKeys(
    payload,
    ["pins", "deviceId"],
    "recoverLegacyBasePinOwnership payload"
  );
  if (!Array.isArray(payload.pins) || payload.pins.length > MAX_LEGACY_RECOVERY_PINS) {
    throw new HttpsError(
      "invalid-argument",
      `pins must contain no more than ${MAX_LEGACY_RECOVERY_PINS} base pins.`
    );
  }

  const seen = new Set<string>();
  const pins = payload.pins.map((value, index) => {
    const claim = asObject(value, `pins[${index}]`);
    assertAllowedKeys(
      claim,
      ["pinId", "level", "replantEnabled", "plant"],
      `pins[${index}]`
    );
    const pinId = requireString(claim.pinId, `pins[${index}].pinId`, 1, 128);
    if (seen.has(pinId)) {
      throw new HttpsError("invalid-argument", "A base pin may only be recovered once.");
    }
    seen.add(pinId);
    const level = Number.isSafeInteger(claim.level) && Number(claim.level) >= 1 && Number(claim.level) <= 10
      ? Number(claim.level)
      : 1;
    const replantEnabled = claim.replantEnabled === true;
    let plant: LegacyPinClaim["plant"] = null;
    if (claim.plant !== null && claim.plant !== undefined) {
      const plantInput = asObject(claim.plant, `pins[${index}].plant`);
      assertAllowedKeys(
        plantInput,
        ["seedId", "plantedAt", "miracleGrownAt"],
        `pins[${index}].plant`
      );
      const seedId = requireString(plantInput.seedId, `pins[${index}].plant.seedId`, 1, 64);
      assertSharedCropSeedId(seedId);
      const plantedAt = new Date(requireIsoTimestamp(
        plantInput.plantedAt,
        `pins[${index}].plant.plantedAt`
      ));
      const miracleGrownAt = plantInput.miracleGrownAt === null || plantInput.miracleGrownAt === undefined
        ? null
        : new Date(requireIsoTimestamp(
          plantInput.miracleGrownAt,
          `pins[${index}].plant.miracleGrownAt`
        ));
      plant = { seedId, plantedAt, miracleGrownAt };
    }
    return { pinId, level, replantEnabled, plant };
  });

  return {
    pins,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

export async function recoverLegacyBasePinOwnershipHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);

  // All alpha ownership is now server-authoritative. Retiring this one-time
  // device migration closes the path that could preserve obsolete local mock
  // pin data as a real ownership claim.
  if (!LEGACY_BASE_PIN_RECOVERY_ENABLED) {
    return { ok: true, recoveredPins: [] };
  }

  const input = validateLegacyRecoveryRequest(request);
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const recoveryRef = db.collection(RECOVERY_COLLECTION).doc(authContext.uid);
  const now = new Date();
  const recoveredPins = await db.runTransaction(async (transaction) => {
    const playerSnapshot = await transaction.get(playerRef);
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile first.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your player profile first.");
    }
    const recoverySnapshot = await transaction.get(recoveryRef);
    if (recoverySnapshot.exists) {
      return [];
    }

    const refs = input.pins.flatMap((claim) => [
      db.collection("authoritativeWaterPinStates").doc(claim.pinId),
      db.collection(SHARED_BASE_PIN_STATES_COLLECTION).doc(sharedWorldDocumentId(claim.pinId))
    ]);
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    const restored: Array<{ pinId: string; state: ReturnType<typeof serializeSharedBasePinState> }> = [];

    input.pins.forEach((claim, index) => {
      const classificationSnapshot = snapshots[index * 2];
      const stateSnapshot = snapshots[(index * 2) + 1];
      const classification = classificationSnapshot.data();
      if (
        !classificationSnapshot.exists ||
        classification?.pinId !== claim.pinId ||
        classification?.type !== "base" ||
        !Number.isFinite(classification?.latitude) ||
        !Number.isFinite(classification?.longitude) ||
        stateSnapshot.exists
      ) return;

      const state: SharedBasePinState = {
        pinId: claim.pinId,
        latitude: Number(classification.latitude),
        longitude: Number(classification.longitude),
        ownerUid: authContext.uid,
        ownerName: player.displayName || "GrowGo player",
        ownerAvatarUrl: player.avatarUrl,
        ownedAt: now,
        level: claim.level,
        replantEnabled: claim.replantEnabled,
        plant: claim.plant,
        updatedAt: now
      };
      transaction.create(stateSnapshot.ref, serializeStateForStorage(state));
      restored.push({
        pinId: claim.pinId,
        state: serializeSharedBasePinState(state, authContext.uid)
      });
    });
    transaction.create(recoveryRef, {
      schemaVersion: 1,
      completedAt: Timestamp.fromDate(now),
      requestedCount: input.pins.length,
      recoveredCount: restored.length
    });
    return restored;
  });

  return { ok: true, recoveredPins };
}

export const recoverLegacyBasePinOwnership = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  recoverLegacyBasePinOwnershipHandler
);

function serializeStateForStorage(state: SharedBasePinState) {
  return {
    schemaVersion: 1,
    pinId: state.pinId,
    latitude: state.latitude,
    longitude: state.longitude,
    ownerUid: state.ownerUid,
    ownerName: state.ownerName,
    ownerAvatarUrl: state.ownerAvatarUrl,
    ownedAt: Timestamp.fromDate(state.ownedAt),
    level: state.level,
    replantEnabled: state.replantEnabled,
    plant: state.plant
      ? {
          seedId: state.plant.seedId,
          plantedAt: Timestamp.fromDate(state.plant.plantedAt),
          miracleGrownAt: state.plant.miracleGrownAt
            ? Timestamp.fromDate(state.plant.miracleGrownAt)
            : null
        }
      : null,
    updatedAt: Timestamp.fromDate(state.updatedAt)
  };
}
