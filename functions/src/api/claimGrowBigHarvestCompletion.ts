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
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
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
  assertAllowedKeys
} from "../validation/requestValidation";

const GROW_BIG_HARVEST_COMPLETION_ID = "grow-big-harvest-completion-v1" as const;

export async function claimGrowBigHarvestCompletionHandler(
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

  const payload = asObject(request.data, "claimGrowBigHarvestCompletion payload");
  assertAllowedKeys(payload, ["deviceId"], "claimGrowBigHarvestCompletion payload");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const rewardRef = db
    .collection("playerRewardGrants")
    .doc(authContext.uid)
    .collection("rewards")
    .doc(GROW_BIG_HARVEST_COMPLETION_ID);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef)
    ]);

    if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    if (claimedNow) {
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: GROW_BIG_HARVEST_COMPLETION_ID,
        questId: "bingles-grow-and-harvest",
        reward: "energy-bar-recipe",
        grantedAt: Timestamp.now()
      });
    }

    return {
      ok: true,
      claimId: GROW_BIG_HARVEST_COMPLETION_ID,
      claimedNow,
      questId: "bingles-grow-and-harvest",
      reward: "energy-bar-recipe"
    };
  });
}

export const claimGrowBigHarvestCompletion = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimGrowBigHarvestCompletionHandler
);
