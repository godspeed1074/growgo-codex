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

const ALPHA_BINGLES_SCARECROW_TEST_KIT_ID = "alpha-bingles-scarecrow-test-kit-v1" as const;
const ALPHA_BINGLES_SCARECROW_TEST_REWARD = Object.freeze({
  bingles_scarecrow: 1
});
const ALPHA_BINGLES_SCARECROW_TESTER_NAME = "rubberlips" as const;

/**
 * Makes the approved animated Bingles scarecrow available to Rubberlips for
 * alpha testing. The test reward is bound to the exact permanent profile name
 * and is idempotent, so reloads cannot duplicate it.
 */
export async function claimAlphaBinglesScarecrowTestKitHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "alpha_reward_grant",
    uid: authContext.uid
  });
  const payload = asObject(request.data, "claimAlphaBinglesScarecrowTestKit payload");
  assertAllowedKeys(payload, ["deviceId"], "claimAlphaBinglesScarecrowTestKit payload");
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
    .doc(ALPHA_BINGLES_SCARECROW_TEST_KIT_ID);
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

    const normalizedName = String(player.displayName || "").trim().toLocaleLowerCase("en-AU");
    if (normalizedName !== ALPHA_BINGLES_SCARECROW_TESTER_NAME) {
      return {
        ok: true,
        eligible: false,
        claimedNow: false,
        rewards: {}
      };
    }

    const claimedNow = !rewardSnapshot.exists;
    const inventory = readMarketInventory(inventorySnapshot.data());
    const repairedNow = !claimedNow && inventory.bingles_scarecrow < 1;
    const nextInventory = claimedNow || repairedNow
      ? {
        ...inventory,
        // This is a one-item test kit. A previous partial grant may have
        // recorded the reward without persisting the inventory quantity, so
        // repair a zero count to exactly one rather than issuing a duplicate.
        bingles_scarecrow: claimedNow
          ? Math.min(
              10_000,
              inventory.bingles_scarecrow + ALPHA_BINGLES_SCARECROW_TEST_REWARD.bingles_scarecrow
            )
          : 1
      }
      : inventory;

    if (claimedNow || repairedNow) {
      const now = Timestamp.now();
      if (claimedNow) {
        transaction.create(rewardRef, {
          schemaVersion: 1,
          rewardId: ALPHA_BINGLES_SCARECROW_TEST_KIT_ID,
          rewards: ALPHA_BINGLES_SCARECROW_TEST_REWARD,
          grantedAt: now
        });
      }
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextInventory,
        updatedAt: now,
        ...(inventorySnapshot.exists ? {} : { initializedAt: now, import: "alpha-bingles-scarecrow-test-v1" })
      });
    }

    return {
      ok: true,
      eligible: true,
      claimId: ALPHA_BINGLES_SCARECROW_TEST_KIT_ID,
      claimedNow,
      repairedNow,
      rewards: ALPHA_BINGLES_SCARECROW_TEST_REWARD,
      inventory: { items: nextInventory }
    };
  });
}

export const claimAlphaBinglesScarecrowTestKit = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaBinglesScarecrowTestKitHandler
);
