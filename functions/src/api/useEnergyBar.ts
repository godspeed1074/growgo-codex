import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import {
  createPlayerFoodBuff,
  getActivePlayerFoodBuff,
  type FoodBuffItemId
} from "../domain/players/playerBuffs";
import {
  getFoodBuffDurationMultiplier,
  readOfficialEventSchedule
} from "../domain/events/officialEvents";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../domain/market/marketCatalog";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireRequestId
} from "../validation/requestValidation";

const PLAYER_CONSUMABLE_REQUESTS = "playerConsumableRequests";
const PLAYER_MARKET_INVENTORIES = "playerMarketInventories";

function inventoryRef(uid: string) {
  return getAdminFirestore().collection(PLAYER_MARKET_INVENTORIES).doc(uid);
}

const foodBuffLabels: Readonly<Record<FoodBuffItemId, string>> = Object.freeze({
  energy_bar: "Energy Bar",
  sweet_corn_snack: "Sweet Corn Snack",
  battered_fish: "Battered Fish",
  buttered_corn: "Buttered Corn",
  milk_chocolate_bar: "Milk Chocolate Bar",
  fairy_bread: "Fairy Bread",
  energy_drink: "Energy Drink",
  chocolate_energy_drink: "Chocolate Energy Drink",
  battered_trout: "Battered Trout"
});

function readFoodBuffItemId(value: unknown): FoodBuffItemId {
  if (value === undefined) return "energy_bar";
  if (
    value === "energy_bar" ||
    value === "sweet_corn_snack" ||
    value === "battered_fish" ||
    value === "buttered_corn" ||
    value === "milk_chocolate_bar" ||
    value === "fairy_bread" ||
    value === "energy_drink" ||
    value === "chocolate_energy_drink" ||
    value === "battered_trout"
  ) {
    return value;
  }
  throw new HttpsError("invalid-argument", "That food item does not have an active buff.");
}

/**
 * Uses one server-owned food item and activates exactly one five-minute food
 * buff. Replacing an existing buff is always an explicit confirmation.
 */
export async function useFoodHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);

  const payload = asObject(request.data, "useFood payload");
  assertAllowedKeys(
    payload,
    ["requestId", "itemId", "replaceActiveBuff", "deviceId"],
    "useFood payload"
  );
  const requestId = requireRequestId(payload.requestId);
  const itemId = readFoodBuffItemId(payload.itemId);
  const replaceActiveBuff = payload.replaceActiveBuff === true;
  if (payload.replaceActiveBuff !== undefined && typeof payload.replaceActiveBuff !== "boolean") {
    throw new HttpsError("invalid-argument", "replaceActiveBuff must be true or false.");
  }
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : undefined;
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const playerInventoryRef = inventoryRef(authContext.uid);
  const consumableRequestRef = db
    .collection(PLAYER_CONSUMABLE_REQUESTS)
    .doc(authContext.uid)
    .collection("requests")
    .doc(requestId);
  const fingerprint = JSON.stringify({ action: "use-food", itemId, replaceActiveBuff });
  const officialEvents = await readOfficialEventSchedule(db, new Date());

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, playerSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(consumableRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef)
    ]);

    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This food request has already been used for another action.");
      }
      return stored.response;
    }

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before using food.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your player profile before using food.");
    }
    if (!inventorySnapshot.exists) {
      throw new HttpsError("failed-precondition", "Reconnect before using food.");
    }

    const inventory = readMarketInventory(inventorySnapshot.data());
    if (inventory[itemId] < 1) {
      throw new HttpsError(
        "failed-precondition",
        `You need ${foodBuffLabels[itemId]} to use this buff.`
      );
    }

    const now = new Date();
    const currentBuff = getActivePlayerFoodBuff(player, now);
    if (currentBuff && !replaceActiveBuff) {
      throw new HttpsError(
        "failed-precondition",
        "A food buff is already active. Confirm replacement to use this food."
      );
    }

    const durationMultiplier = getFoodBuffDurationMultiplier(officialEvents, now);
    const activeBuff = createPlayerFoodBuff(itemId, now, durationMultiplier);
    const nextInventory = {
      ...inventory,
      [itemId]: inventory[itemId] - 1
    };
    const nextPlayer = {
      ...player,
      activeBuff,
      updatedAt: now
    };
    const timestamp = Timestamp.fromDate(now);
    const response = {
      ok: true,
      usedItemId: itemId,
      replacedActiveBuff: Boolean(currentBuff),
      durationMultiplier,
      activeBuff: {
        type: activeBuff.type,
        sourceItemId: activeBuff.sourceItemId,
        xpMultiplier: activeBuff.xpMultiplier,
        coinBonus: activeBuff.coinBonus,
        radiusMultiplier: activeBuff.radiusMultiplier,
        pointsMultiplier: activeBuff.pointsMultiplier,
        autoCapture: activeBuff.autoCapture,
        activatedAt: activeBuff.activatedAt.toISOString(),
        expiresAt: activeBuff.expiresAt.toISOString()
      },
      inventory: { items: nextInventory },
      player: serializePlayerSnapshot(nextPlayer)
    };

    transaction.update(playerRef, {
      activeBuff,
      updatedAt: timestamp
    });
    transaction.set(playerInventoryRef, {
      schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
      items: nextInventory,
      updatedAt: timestamp
    }, { merge: true });
    transaction.create(consumableRequestRef, {
      schemaVersion: 1,
      fingerprint,
      response,
      createdAt: timestamp
    });

    return response;
  });
}

export const useEnergyBarHandler = useFoodHandler;

const callableOptions = {
  region: runtimeConfig.region,
  enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
};

export const useFood = onCall(callableOptions, useFoodHandler);

// Kept for existing alpha clients while they receive the update. Omitting
// itemId continues to activate an Energy Bar exactly as before.
export const useEnergyBar = onCall(callableOptions, useFoodHandler);
