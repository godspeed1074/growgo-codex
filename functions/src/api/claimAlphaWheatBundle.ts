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

const ALPHA_WHEAT_BUNDLE_ID = "alpha-wheat-bundle-v1" as const;
const ALPHA_WHEAT_BUNDLE_REWARD = Object.freeze({
  wheat: 5
});

/** Gives each completed alpha account a one-time supply of harvested Wheat. */
export async function claimAlphaWheatBundleHandler(
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

  const payload = asObject(request.data, "claimAlphaWheatBundle payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaWheatBundle payload");
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
    .doc(ALPHA_WHEAT_BUNDLE_ID);
  const inventoryRef = db.collection("playerMarketInventories").doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef),
      transaction.get(inventoryRef)
    ]);

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    const inventory = readMarketInventory(inventorySnapshot.data());
    const nextInventory = claimedNow
      ? {
        ...inventory,
        wheat: Math.min(10_000, inventory.wheat + ALPHA_WHEAT_BUNDLE_REWARD.wheat)
      }
      : inventory;

    if (claimedNow) {
      const now = Timestamp.now();
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_WHEAT_BUNDLE_ID,
        rewards: ALPHA_WHEAT_BUNDLE_REWARD,
        grantedAt: now
      });
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextInventory,
        updatedAt: now,
        ...(inventorySnapshot.exists ? {} : { initializedAt: now, import: "alpha-wheat-reward-v1" })
      });
    }

    return {
      ok: true,
      claimId: ALPHA_WHEAT_BUNDLE_ID,
      claimedNow,
      rewards: ALPHA_WHEAT_BUNDLE_REWARD,
      inventory: { items: nextInventory }
    };
  });
}

export const claimAlphaWheatBundle = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaWheatBundleHandler
);
