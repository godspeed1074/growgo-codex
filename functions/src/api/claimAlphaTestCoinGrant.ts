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
  readStoredPlayerDocument,
  serializePlayerSnapshot
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

const ALPHA_TEST_COIN_GRANT_ID = "alpha-test-coins-v1" as const;
const ALPHA_TEST_COIN_AMOUNT = 1000;

/**
 * A one-time, server-authoritative balance top-up for the closed alpha. Its
 * receipt is stored separately from the player balance to make retries safe.
 */
export async function claimAlphaTestCoinGrantHandler(
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

  const payload = asObject(request.data, "claimAlphaTestCoinGrant payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaTestCoinGrant payload");
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
    .doc(ALPHA_TEST_COIN_GRANT_ID);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef)
    ]);

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    let updatedPlayer = player;
    if (claimedNow) {
      const now = new Date();
      updatedPlayer = {
        ...player,
        coins: player.coins + ALPHA_TEST_COIN_AMOUNT,
        updatedAt: now
      };
      transaction.update(playerRef, {
        coins: updatedPlayer.coins,
        updatedAt: Timestamp.fromDate(now)
      });
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_TEST_COIN_GRANT_ID,
        rewards: { coins: ALPHA_TEST_COIN_AMOUNT },
        grantedAt: Timestamp.fromDate(now)
      });
    }

    return {
      ok: true,
      claimId: ALPHA_TEST_COIN_GRANT_ID,
      claimedNow,
      coinsGranted: claimedNow ? ALPHA_TEST_COIN_AMOUNT : 0,
      player: serializePlayerSnapshot(updatedPlayer)
    };
  });
}

export const claimAlphaTestCoinGrant = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaTestCoinGrantHandler
);
