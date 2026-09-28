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

const ALPHA_SEED_BUNDLE_ID = "alpha-seed-bundle-v1" as const;
const ALPHA_SEED_BUNDLE_REWARD = Object.freeze({
  corn_seed: 5,
  sugar_cane_seed: 5
});

export async function claimAlphaSeedBundleHandler(
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

  const payload = asObject(request.data, "claimAlphaSeedBundle payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaSeedBundle payload");
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
    .doc(ALPHA_SEED_BUNDLE_ID);
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
        corn_seed: Math.min(10_000, inventory.corn_seed + ALPHA_SEED_BUNDLE_REWARD.corn_seed),
        sugar_cane_seed: Math.min(10_000, inventory.sugar_cane_seed + ALPHA_SEED_BUNDLE_REWARD.sugar_cane_seed)
      }
      : inventory;
    if (claimedNow) {
      const now = Timestamp.now();
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_SEED_BUNDLE_ID,
        rewards: ALPHA_SEED_BUNDLE_REWARD,
        grantedAt: now
      });
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextInventory,
        updatedAt: now,
        ...(inventorySnapshot.exists ? {} : { initializedAt: now, import: "alpha-seed-reward-v2" })
      });
    }

    return {
      ok: true,
      claimId: ALPHA_SEED_BUNDLE_ID,
      claimedNow,
      rewards: ALPHA_SEED_BUNDLE_REWARD,
      inventory: { items: nextInventory }
    };
  });
}

export const claimAlphaSeedBundle = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaSeedBundleHandler
);
