import { createHash } from "node:crypto";

import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import { GROWGO_CAPTURE_RADIUS_METRES } from "../domain/pins/basePinTypes";
import {
  SHARED_BASE_PIN_STATES_COLLECTION,
  assertSharedCropSeedId,
  readSharedBasePinState,
  serializeSharedBasePinState,
  serializeSharedBasePinStateForStorage,
  sharedWorldDocumentId,
  type SharedCropSeedId,
  type SharedBasePinState
} from "../domain/world/sharedWorld";
import {
  CROP_STAGE_MILLISECONDS,
  isCropHarvestActive
} from "../domain/world/cropLifecycle";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../domain/market/marketCatalog";
import { isAlbertParkGrandPrixCircuitSpecialPin } from "../domain/routes/albertParkGrandPrixCircuit";
import { isGreatOceanRoadSpecialPin } from "../domain/routes/greatOceanRoad";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireString
} from "../validation/requestValidation";

const BASE_PIN_PURCHASE_COST = 100;
const MAX_LOCATION_ACCURACY_METRES = 100;
type WorldBasePinAction = "purchase" | "plant" | "miracle-grow" | "set-replant" | "harvest";

interface WorldBasePinRequest {
  action: WorldBasePinAction;
  pinId: string;
  latitude?: number;
  longitude?: number;
  accuracyMetres?: number;
  seedId?: string;
  replantEnabled?: boolean;
  deviceId?: string;
}

export function validateWorldBasePinRequest(
  request: CallableRequest<unknown>
): WorldBasePinRequest {
  const payload = asObject(request.data, "mutateWorldBasePin payload");
  assertAllowedKeys(
    payload,
    ["action", "pinId", "latitude", "longitude", "accuracyMetres", "seedId", "replantEnabled", "deviceId"],
    "mutateWorldBasePin payload"
  );

  const action = requireString(payload.action, "action", 1, 32) as WorldBasePinAction;
  if (!["purchase", "plant", "miracle-grow", "set-replant", "harvest"].includes(action)) {
    throw new HttpsError("invalid-argument", "This base-pin action is not available.");
  }

  const input: WorldBasePinRequest = {
    action,
    pinId: requireString(payload.pinId, "pinId", 1, 128),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };

  if (action === "purchase") {
    input.latitude = requireFiniteNumber(payload.latitude, "latitude", -90, 90);
    input.longitude = requireFiniteNumber(payload.longitude, "longitude", -180, 180);
    input.accuracyMetres = requireFiniteNumber(
      payload.accuracyMetres,
      "accuracyMetres",
      0,
      10_000
    );
  }
  if (action === "plant") {
    input.seedId = requireString(payload.seedId, "seedId", 1, 64);
    assertSharedCropSeedId(input.seedId);
  }
  if (action === "set-replant") {
    if (typeof payload.replantEnabled !== "boolean") {
      throw new HttpsError("invalid-argument", "replantEnabled must be true or false.");
    }
    input.replantEnabled = payload.replantEnabled;
  }

  return input;
}

export async function mutateWorldBasePinHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  const input = validateWorldBasePinRequest(request);
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });

  if (
    isAlbertParkGrandPrixCircuitSpecialPin(input.pinId) ||
    isGreatOceanRoadSpecialPin(input.pinId)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Road-trip pins are special captures and cannot be purchased or planted."
    );
  }

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const classificationRef = db.collection("authoritativeWaterPinStates").doc(input.pinId);
  const stateRef = db
    .collection(SHARED_BASE_PIN_STATES_COLLECTION)
    .doc(sharedWorldDocumentId(input.pinId));
  const inventoryRef = db.collection("playerMarketInventories").doc(authContext.uid);
  const captureRef = db
    .collection("playerCaptureStates")
    .doc(authContext.uid)
    .collection("pins")
    .doc(hashValue(input.pinId));
  const harvestRef = db
    .collection("sharedBasePinHarvests")
    .doc(sharedWorldDocumentId(input.pinId))
    .collection("players")
    .doc(authContext.uid);
  const now = new Date();

  const result = await db.runTransaction(async (transaction) => {
    const [
      playerSnapshot,
      classificationSnapshot,
      stateSnapshot,
      inventorySnapshot,
      captureSnapshot,
      harvestSnapshot
    ] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(classificationRef),
      transaction.get(stateRef),
      transaction.get(inventoryRef),
      transaction.get(captureRef),
      transaction.get(harvestRef)
    ]);
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile first.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your player profile first.");
    }

    const classification = classificationSnapshot.data();
    if (
      !classificationSnapshot.exists ||
      classification?.pinId !== input.pinId ||
      classification?.type !== "base" ||
      !Number.isFinite(classification?.latitude) ||
      !Number.isFinite(classification?.longitude)
    ) {
      throw new HttpsError("failed-precondition", "Refresh the map before changing this base pin.");
    }

    const existing = readSharedBasePinState(stateSnapshot.data());

    if (input.action === "purchase") {
      if (input.accuracyMetres! > MAX_LOCATION_ACCURACY_METRES) {
        throw new HttpsError("failed-precondition", "Your location accuracy is too low to buy this pin.");
      }
      const distance = calculateHaversineDistanceMetres(
        { latitude: input.latitude!, longitude: input.longitude! },
        { latitude: Number(classification.latitude), longitude: Number(classification.longitude) }
      );
      if (distance > GROWGO_CAPTURE_RADIUS_METRES) {
        throw new HttpsError("failed-precondition", "You are too far away to buy this pin.");
      }
      if (existing) {
        throw new HttpsError("already-exists", "This base pin has already been purchased.");
      }
      if (player.coins < BASE_PIN_PURCHASE_COST) {
        throw new HttpsError("failed-precondition", "You need 100 coins to buy this base pin.");
      }

      const nextPlayer = { ...player, coins: player.coins - BASE_PIN_PURCHASE_COST, updatedAt: now };
      const state: SharedBasePinState = {
        pinId: input.pinId,
        latitude: Number(classification.latitude),
        longitude: Number(classification.longitude),
        ownerUid: authContext.uid,
        ownerName: player.displayName ?? "GrowGo Player",
        ownerAvatarUrl: player.avatarUrl,
        ownedAt: now,
        level: 1,
        replantEnabled: false,
        plant: null,
        updatedAt: now
      };
      transaction.update(playerRef, { coins: nextPlayer.coins, updatedAt: Timestamp.fromDate(now) });
      transaction.create(stateRef, serializeSharedBasePinStateForStorage(state));
      return { player: serializePlayerSnapshot(nextPlayer), pin: serializeSharedBasePinState(state, authContext.uid) };
    }

    if (!existing) {
      throw new HttpsError("failed-precondition", "Buy this base pin before changing it.");
    }
    if (input.action !== "harvest" && existing.ownerUid !== authContext.uid) {
      throw new HttpsError("permission-denied", "Only the owner can change this base pin.");
    }

    const inventory = readMarketInventory(inventorySnapshot.data());
    const writeInventory = (items: Record<string, number>) => {
      transaction.set(inventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items,
        updatedAt: Timestamp.fromDate(now),
        ...(inventorySnapshot.exists ? {} : { initializedAt: Timestamp.fromDate(now), import: "world-action-v1" })
      });
    };

    if (input.action === "harvest") {
      if (!existing.plant || !isCropHarvestActive(existing.plant, now)) {
        throw new HttpsError("failed-precondition", "This crop is not ready to harvest yet.");
      }
      const today = now.toISOString().slice(0, 10);
      if (captureSnapshot.data()?.captureDay !== today) {
        throw new HttpsError("failed-precondition", "Capture this pin before collecting its crop.");
      }
      const previousHarvest = harvestSnapshot.data();
      if (previousHarvest?.harvestDay === today) {
        // Keep the daily lockout for legacy/other-crop receipts, but only
        // acknowledge this displayed crop when its identity is proven.
        const matchesCurrentCrop = previousHarvest.pinId === input.pinId &&
          previousHarvest.cropPlantedAt instanceof Timestamp &&
          previousHarvest.cropPlantedAt.isEqual(Timestamp.fromDate(existing.plant.plantedAt));
        throw new HttpsError("already-exists", "You have already collected this crop today.",
          matchesCurrentCrop ? {
            reason: "crop-already-harvested",
            pinId: input.pinId,
            harvestDay: today,
            cropPlantedAt: existing.plant.plantedAt.toISOString()
          } : undefined);
      }

      const harvestItemId = getHarvestItemId(existing.plant.seedId);
      const nextInventory = {
        ...inventory,
        [harvestItemId]: Math.min(10_000, Number(inventory[harvestItemId] || 0) + 1)
      };
      // Replanting happens only when the full seven-day harvest window ends.
      // Daily harvests must never restart the crop early.
      const nextState = existing;
      const autoReplanted = false;
      // Nearby responses are keyed by the player's document revision. Harvest
      // changes the player's map state even though it awards no XP or coins.
      const updatedAt = new Date(Math.max(now.getTime(), player.updatedAt.getTime() + 1));
      transaction.update(playerRef, { updatedAt: Timestamp.fromDate(updatedAt) });
      writeInventory(nextInventory);
      transaction.set(harvestRef, {
        schemaVersion: 1,
        pinId: input.pinId,
        harvestDay: today,
        harvestedAt: Timestamp.fromDate(now),
        cropPlantedAt: Timestamp.fromDate(existing.plant.plantedAt)
      });
      return {
        player: serializePlayerSnapshot({ ...player, updatedAt }),
        inventory: { items: nextInventory },
        pin: serializeSharedBasePinState(nextState, authContext.uid),
        harvest: { itemId: harvestItemId, harvestDay: today, autoReplanted }
      };
    }

    let nextState: SharedBasePinState = { ...existing, updatedAt: now };
    if (input.action === "plant") {
      if (existing.plant) {
        throw new HttpsError("failed-precondition", "Harvest or clear the current crop before planting another seed.");
      }
      if (Number(inventory[input.seedId!] || 0) < 1) {
        throw new HttpsError("failed-precondition", "You do not have that seed available.");
      }
      nextState = {
        ...nextState,
        plant: {
          seedId: input.seedId as SharedCropSeedId,
          plantedAt: now,
          miracleGrownAt: null
        }
      };
      writeInventory({
        ...inventory,
        [input.seedId!]: Number(inventory[input.seedId!] || 0) - 1
      });
    } else if (input.action === "miracle-grow") {
      if (!existing.plant) {
        throw new HttpsError("failed-precondition", "Plant a seed before using Miracle Grow.");
      }
      if (isCropHarvestActive(existing.plant, now)) {
        throw new HttpsError("failed-precondition", "This crop is already ready to harvest.");
      }
      if (Number(inventory.miracle_grow || 0) < 1) {
        throw new HttpsError("failed-precondition", "You do not have any Miracle Grow available.");
      }
      nextState = {
        ...nextState,
        plant: {
          ...existing.plant,
          plantedAt: new Date(now.getTime() - (CROP_STAGE_MILLISECONDS * 3)),
          miracleGrownAt: now
        }
      };
      writeInventory({
        ...inventory,
        miracle_grow: Number(inventory.miracle_grow || 0) - 1
      });
    } else {
      nextState = { ...nextState, replantEnabled: input.replantEnabled === true };
    }
    transaction.set(stateRef, serializeSharedBasePinStateForStorage(nextState));
    return {
      player: serializePlayerSnapshot(player),
      ...(input.action === "plant" || input.action === "miracle-grow"
        ? { inventory: { items: readNextInventory(inventory, input) } }
        : {}),
      pin: serializeSharedBasePinState(nextState, authContext.uid)
    };
  });

  return { ok: true, ...result };
}

export const mutateWorldBasePin = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  mutateWorldBasePinHandler
);

function getHarvestItemId(seedId: SharedCropSeedId): string {
  return {
    wheat_seed: "wheat",
    corn_seed: "corn",
    sugar_cane_seed: "sugar_cane",
    tomato_seed: "tomato",
    cocoa_bean_seed: "cocoa_beans"
  }[seedId];
}

function readNextInventory(inventory: Record<string, number>, input: WorldBasePinRequest) {
  if (input.action === "plant" && input.seedId) {
    return { ...inventory, [input.seedId]: Number(inventory[input.seedId] || 0) - 1 };
  }
  if (input.action === "miracle-grow") {
    return { ...inventory, miracle_grow: Number(inventory.miracle_grow || 0) - 1 };
  }
  return inventory;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
