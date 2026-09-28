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
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../domain/market/marketCatalog";
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

// A new grant id lets every existing alpha profile claim this additional
// five-item testing bundle exactly once, without duplicating the earlier one.
const ALPHA_MIRACLE_GROW_BUNDLE_ID = "alpha-miracle-grow-bundle-v3" as const;
const ALPHA_MIRACLE_GROW_BUNDLE_REWARD = Object.freeze({
  miracle_grow: 5
});

/**
 * Issues the alpha-wide Miracle Grow reward exactly once to each completed
 * alpha profile. The client keeps a matching delivery receipt before adding
 * the items to its active inventory, so a reload cannot duplicate the grant.
 */
export async function claimAlphaMiracleGrowBundleHandler(
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

  const payload = asObject(request.data, "claimAlphaMiracleGrowBundle payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaMiracleGrowBundle payload");
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
    .doc(ALPHA_MIRACLE_GROW_BUNDLE_ID);
  const marketInventoryRef = db
    .collection("playerMarketInventories")
    .doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot, marketInventorySnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef),
      transaction.get(marketInventoryRef)
    ]);

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    const currentMarketItems = readMarketInventory(marketInventorySnapshot.data());
    const nextMarketItems = claimedNow
      ? {
        ...currentMarketItems,
        miracle_grow: Math.min(
          10_000,
          currentMarketItems.miracle_grow + ALPHA_MIRACLE_GROW_BUNDLE_REWARD.miracle_grow
        )
      }
      : currentMarketItems;

    if (claimedNow) {
      const now = Timestamp.now();
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_MIRACLE_GROW_BUNDLE_ID,
        rewards: ALPHA_MIRACLE_GROW_BUNDLE_REWARD,
        grantedAt: now
      });
      transaction.set(marketInventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextMarketItems,
        updatedAt: now,
        ...(marketInventorySnapshot.exists ? {} : { initializedAt: now, import: "alpha-reward-grant-v1" })
      });
    }

    return {
      ok: true,
      claimId: ALPHA_MIRACLE_GROW_BUNDLE_ID,
      claimedNow,
      rewards: ALPHA_MIRACLE_GROW_BUNDLE_REWARD,
      inventory: { items: nextMarketItems }
    };
  });
}

export const claimAlphaMiracleGrowBundle = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaMiracleGrowBundleHandler
);
