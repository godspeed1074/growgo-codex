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
import { getAdminFirestore } from "../firebaseAdmin";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { MARKET_INVENTORY_SCHEMA_VERSION, readMarketInventory } from "../domain/market/marketCatalog";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import {
  requireAuthenticated,
  requireAppCheckIfEnabled
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";

const ALPHA_BATTERED_FISH_BUNDLE_ID = "alpha-battered-fish-bundle-v1" as const;
const ALPHA_BATTERED_FISH_BUNDLE_REWARD = Object.freeze({
  battered_fish: 5
});

/**
 * Adds five Battered Fish to every completed alpha account exactly once. The
 * signed-in client claims the server-owned bundle on its next map load, so
 * the inventory update remains safe to retry and cannot be duplicated.
 */
export async function claimAlphaBatteredFishBundleHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const payload = asObject(request.data, "claimAlphaBatteredFishBundle payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaBatteredFishBundle payload");
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
    .doc(ALPHA_BATTERED_FISH_BUNDLE_ID);
  const inventoryRef = db.collection("playerMarketInventories").doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef),
      transaction.get(inventoryRef)
    ]);

    if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    const currentItems = readMarketInventory(inventorySnapshot.data());
    const nextItems = claimedNow
      ? {
        ...currentItems,
        battered_fish: Math.min(
          10_000,
          currentItems.battered_fish + ALPHA_BATTERED_FISH_BUNDLE_REWARD.battered_fish
        )
      }
      : currentItems;

    if (claimedNow) {
      const now = Timestamp.now();
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_BATTERED_FISH_BUNDLE_ID,
        rewards: ALPHA_BATTERED_FISH_BUNDLE_REWARD,
        grantedAt: now
      });
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextItems,
        updatedAt: now,
        ...(inventorySnapshot.exists ? {} : { initializedAt: now, import: "alpha-reward-grant-v1" })
      });
    }

    return {
      ok: true,
      claimId: ALPHA_BATTERED_FISH_BUNDLE_ID,
      claimedNow,
      rewards: ALPHA_BATTERED_FISH_BUNDLE_REWARD,
      inventory: { items: nextItems }
    };
  });
}

export const claimAlphaBatteredFishBundle = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaBatteredFishBundleHandler
);
