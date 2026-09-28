import { createHash } from "node:crypto";
import { createMarketSetupGuard } from "../domain/market/marketSetupGuard";

import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  MARKET_MAX_LISTING_QUANTITY,
  MARKET_MAX_PURCHASE_QUANTITY,
  getMarketCatalogItem,
  getMarketPriceRange,
  marketCatalog,
  normalizeImportedMarketInventory,
  readMarketInventory
} from "../domain/market/marketCatalog";
import {
  getCraftingLevelForXp,
  getCraftingRecipe
} from "../domain/crafting/craftingCatalog";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireRequestId, requireString } from "../validation/requestValidation";

const MARKET_LISTINGS_COLLECTION = "marketplaceListings";
const MARKET_INVENTORIES_COLLECTION = "playerMarketInventories";
const MARKET_PRICE_STATS_COLLECTION = "marketplacePriceStats";
const MARKET_REQUESTS_COLLECTION = "marketplaceRequests";
const MARKET_SYSTEM_COLLECTION = "marketplaceSystem";
const MARKET_DEFAULTS_ID = "defaults-v1";
const MARKET_WHEAT_RESTOCK_ID = "npc-wheat-restock-20260906-v1";
const MARKET_WHEAT_RESTOCK_QUANTITY = 100;
const MARKET_WHEAT_LISTING_ID = "npc-wheat-20";
const STARTER_ENERGY_BAR_REWARD_ID = "starter-energy-bar-completion-v1";
const STARTER_ENERGY_BAR_REWARD = Object.freeze({
  coins: 200,
  wheat_seed: 2,
  sugar_cane_seed: 2
});

interface MarketRequestContext {
  uid: string;
  deviceId?: string;
}

function inventoryRef(uid: string) {
  return getAdminFirestore().collection(MARKET_INVENTORIES_COLLECTION).doc(uid);
}

async function requireMarketContext(request: CallableRequest<unknown>, label: string, keys: readonly string[]) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, [...keys, "deviceId"], label);
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : undefined;
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });
  return { payload, context: { uid: authContext.uid, deviceId } satisfies MarketRequestContext };
}

const ensureMarketplaceSeeded = createMarketSetupGuard(verifyMarketplaceSetup);

async function verifyMarketplaceSetup(): Promise<boolean> {
  const db = getAdminFirestore();
  const markerRef = db.collection(MARKET_SYSTEM_COLLECTION).doc(MARKET_DEFAULTS_ID);
  const wheatRestockRef = db.collection(MARKET_SYSTEM_COLLECTION).doc(MARKET_WHEAT_RESTOCK_ID);
  const wheatListingRef = db.collection(MARKET_LISTINGS_COLLECTION).doc(MARKET_WHEAT_LISTING_ID);

  return db.runTransaction(async (transaction) => {
    const [markerSnapshot, wheatRestockSnapshot, wheatListingSnapshot] = await Promise.all([
      transaction.get(markerRef),
      transaction.get(wheatRestockRef),
      transaction.get(wheatListingRef)
    ]);

    const now = Timestamp.now();
    if (!markerSnapshot.exists) {
      transaction.create(markerRef, {
        schemaVersion: 1,
        seededAt: now
      });

      for (const item of marketCatalog) {
        const listingRef = db.collection(MARKET_LISTINGS_COLLECTION).doc(`npc-${item.id}-${item.referencePrice}`);
        const statsRef = db.collection(MARKET_PRICE_STATS_COLLECTION).doc(item.id);
        transaction.create(listingRef, {
          schemaVersion: 1,
          itemId: item.id,
          price: item.referencePrice,
          quantity: item.npcQuantity,
          sellerUid: "npc",
          sellerName: "GrowGo Market",
          status: "active",
          createdAt: now,
          updatedAt: now
        });
        transaction.create(statsRef, {
          schemaVersion: 1,
          referencePrice: item.referencePrice,
          lastSalePrice: null,
          updatedAt: now
        });
      }
      // Preserve the existing two-stage setup: restock runs on the next call.
      return false;
    }

    // The live alpha market was already seeded at 50 wheat. Apply this one
    // operator-approved +100 restock once, preserving any amount players had
    // already bought rather than replacing the remaining stock.
    if (wheatRestockSnapshot.exists) return true;
    if (wheatListingSnapshot.exists) {
      const currentQuantity = Number(wheatListingSnapshot.data()?.quantity);
      transaction.update(wheatListingRef, {
        quantity: Math.max(0, Number.isSafeInteger(currentQuantity) ? currentQuantity : 0) + MARKET_WHEAT_RESTOCK_QUANTITY,
        updatedAt: now
      });
    } else {
      transaction.create(wheatListingRef, {
        schemaVersion: 1,
        itemId: "wheat",
        price: 20,
        quantity: MARKET_WHEAT_RESTOCK_QUANTITY,
        sellerUid: "npc",
        sellerName: "GrowGo Market",
        status: "active",
        createdAt: now,
        updatedAt: now
      });
    }
    transaction.create(wheatRestockRef, {
      schemaVersion: 1,
      itemId: "wheat",
      quantityAdded: MARKET_WHEAT_RESTOCK_QUANTITY,
      appliedAt: now
    });
    return true;
  });
}

function requirePositiveInteger(value: unknown, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new HttpsError("invalid-argument", `${label} must be a whole number between 1 and ${maximum}.`);
  }
  return Number(value);
}

function requirePrice(value: unknown): number {
  return requirePositiveInteger(value, "price", 1_000_000);
}

function requireCompletedPlayer(snapshot: FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before using the Market.");
  }
  const player = readStoredPlayerDocument(snapshot.data());
  if (!player.profileComplete) {
    throw new HttpsError("failed-precondition", "Complete your GrowGo profile before using the Market.");
  }
  return player;
}

function makeInventoryDocument(items: Record<string, number>, now: Timestamp) {
  return {
    schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
    items,
    updatedAt: now
  };
}

function serializeInventory(data: unknown) {
  return { items: readMarketInventory(data) };
}

function serializeListing(data: FirebaseFirestore.DocumentData, uid: string) {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
  return {
    id: String(data.id),
    itemId: String(data.itemId),
    price: Number(data.price),
    quantity: Number(data.quantity),
    createdAt,
    sellerId: data.sellerUid === uid ? "player" : data.sellerUid === "npc" ? "npc" : "market-player",
    sellerName: data.sellerUid === uid ? "You" : data.sellerUid === "npc" ? "GrowGo Market" : "GrowGo Player",
    isOwnListing: data.sellerUid === uid
  };
}

async function listActiveMarketplaceListings(uid: string) {
  const snapshot = await getAdminFirestore()
    .collection(MARKET_LISTINGS_COLLECTION)
    .where("status", "==", "active")
    .limit(500)
    .get();

  return snapshot.docs
    .map((document) => serializeListing({ ...document.data(), id: document.id }, uid))
    .filter((listing) => (
      Number.isSafeInteger(listing.price) && listing.price > 0 &&
      Number.isSafeInteger(listing.quantity) && listing.quantity > 0
    ))
    .sort((left, right) => left.price - right.price || left.createdAt - right.createdAt);
}

function getMarketRequestRef(uid: string, requestId: string) {
  return getAdminFirestore()
    .collection(MARKET_REQUESTS_COLLECTION)
    .doc(hashValue(`${uid}|${requestId}`));
}

function hashValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function initializeMarketInventoryHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "initializeMarketInventory payload",
    ["inventory"]
  );
  const importedInventory = normalizeImportedMarketInventory(payload.inventory);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(playerInventoryRef)
    ]);
    requireCompletedPlayer(playerSnapshot);

    if (!inventorySnapshot.exists) {
      const now = Timestamp.now();
      transaction.create(playerInventoryRef, {
        ...makeInventoryDocument(importedInventory, now),
        initializedAt: now,
        import: "alpha-client-inventory-v2",
        alphaInventoryMigrationV2: true
      });
      return { ok: true, initializedNow: true, migratedNow: true, inventory: { items: importedInventory } };
    }

    // Older alpha builds changed seed, crop, and craft quantities only in the
    // browser. Preserve that existing play once while moving every player to
    // the shared server bag. This marker prevents a later reload from being
    // able to import arbitrary browser quantities again.
    const existingData = inventorySnapshot.data();
    if (existingData?.alphaInventoryMigrationV2 !== true) {
      const existingInventory = readMarketInventory(existingData);
      const mergedInventory = Object.fromEntries(
        Object.keys(existingInventory).map((itemId) => [
          itemId,
          Math.max(Number(existingInventory[itemId] || 0), Number(importedInventory[itemId] || 0))
        ])
      );
      const now = Timestamp.now();
      transaction.set(playerInventoryRef, {
        ...makeInventoryDocument(mergedInventory, now),
        alphaInventoryMigrationV2: true,
        migratedAt: now,
        import: "alpha-client-inventory-v2"
      }, { merge: true });
      return { ok: true, initializedNow: false, migratedNow: true, inventory: { items: mergedInventory } };
    }

    return {
      ok: true,
      initializedNow: false,
      migratedNow: false,
      inventory: serializeInventory(inventorySnapshot.data())
    };
  });
}

export async function getMarketplaceSnapshotHandler(request: CallableRequest<unknown>) {
  const { context } = await requireMarketContext(request, "getMarketplaceSnapshot payload", []);
  await ensureMarketplaceSeeded();

  const [playerSnapshot, inventorySnapshot, listings] = await Promise.all([
    getPlayerDocumentRef(context.uid).get(),
    inventoryRef(context.uid).get(),
    listActiveMarketplaceListings(context.uid)
  ]);
  const player = requireCompletedPlayer(playerSnapshot);

  return {
    ok: true,
    player: serializePlayerSnapshot(player),
    inventory: serializeInventory(inventorySnapshot.data()),
    listings
  };
}

export async function createMarketplaceListingHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "createMarketplaceListing payload",
    ["requestId", "itemId", "quantity", "price"]
  );
  await ensureMarketplaceSeeded();

  const requestId = requireRequestId(payload.requestId);
  const itemId = requireString(payload.itemId, "itemId", 1, 64);
  const item = getMarketCatalogItem(itemId);
  const quantity = requirePositiveInteger(payload.quantity, "quantity", MARKET_MAX_LISTING_QUANTITY);
  const price = requirePrice(payload.price);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);
  const marketRequestRef = getMarketRequestRef(context.uid, requestId);
  const listingRef = db.collection(MARKET_LISTINGS_COLLECTION).doc(hashValue(`listing|${context.uid}|${requestId}`));
  const priceStatsRef = db.collection(MARKET_PRICE_STATS_COLLECTION).doc(item.id);
  const fingerprint = JSON.stringify({ action: "create", itemId, quantity, price });

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, playerSnapshot, inventorySnapshot, priceStatsSnapshot] = await Promise.all([
      transaction.get(marketRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef),
      transaction.get(priceStatsRef)
    ]);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This market request has already been used for another action.");
      }
      return stored.response;
    }

    const player = requireCompletedPlayer(playerSnapshot);
    if (!inventorySnapshot.exists) {
      throw new HttpsError("failed-precondition", "Reconnect before listing an item on the Market.");
    }
    const inventory = readMarketInventory(inventorySnapshot.data());
    if (inventory[item.id] < quantity) {
      throw new HttpsError("failed-precondition", "You do not have enough of this item to list.");
    }
    const referencePrice = Number(priceStatsSnapshot.data()?.referencePrice ?? item.referencePrice);
    const range = getMarketPriceRange(referencePrice);
    if (price < range.min || price > range.max) {
      throw new HttpsError("failed-precondition", `Price must be between ${range.min} and ${range.max} coins.`);
    }

    const now = Timestamp.now();
    const nextInventory = { ...inventory, [item.id]: inventory[item.id] - quantity };
    const listing = {
      id: listingRef.id,
      itemId: item.id,
      price,
      quantity,
      sellerUid: context.uid,
      sellerName: player.displayName ?? "GrowGo Player",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    const response = {
      ok: true,
      listing: serializeListing(listing, context.uid),
      inventory: { items: nextInventory },
      player: serializePlayerSnapshot(player)
    };

    transaction.set(playerInventoryRef, makeInventoryDocument(nextInventory, now));
    transaction.create(listingRef, { schemaVersion: 1, ...listing });
    transaction.create(marketRequestRef, { schemaVersion: 1, fingerprint, response, createdAt: now });
    return response;
  });
}

export async function cancelMarketplaceListingHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "cancelMarketplaceListing payload",
    ["requestId", "listingId"]
  );
  const requestId = requireRequestId(payload.requestId);
  const listingId = requireString(payload.listingId, "listingId", 1, 128);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);
  const listingRef = db.collection(MARKET_LISTINGS_COLLECTION).doc(listingId);
  const marketRequestRef = getMarketRequestRef(context.uid, requestId);
  const fingerprint = JSON.stringify({ action: "cancel", listingId });

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, playerSnapshot, inventorySnapshot, listingSnapshot] = await Promise.all([
      transaction.get(marketRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef),
      transaction.get(listingRef)
    ]);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This market request has already been used for another action.");
      }
      return stored.response;
    }
    const player = requireCompletedPlayer(playerSnapshot);
    if (!inventorySnapshot.exists || !listingSnapshot.exists) {
      throw new HttpsError("not-found", "This listing is no longer active.");
    }
    const listing = listingSnapshot.data();
    if (listing?.status !== "active" || listing?.sellerUid !== context.uid) {
      throw new HttpsError("permission-denied", "Only the seller can cancel this active listing.");
    }
    const item = getMarketCatalogItem(String(listing.itemId));
    const remainingQuantity = requirePositiveInteger(listing.quantity, "listing quantity", MARKET_MAX_LISTING_QUANTITY);
    const inventory = readMarketInventory(inventorySnapshot.data());
    const now = Timestamp.now();
    const nextInventory = {
      ...inventory,
      [item.id]: Math.min(10_000, inventory[item.id] + remainingQuantity)
    };
    const response = {
      ok: true,
      cancelledQuantity: remainingQuantity,
      inventory: { items: nextInventory },
      player: serializePlayerSnapshot(player)
    };
    transaction.set(playerInventoryRef, makeInventoryDocument(nextInventory, now));
    transaction.update(listingRef, { status: "cancelled", quantity: 0, updatedAt: now });
    transaction.create(marketRequestRef, { schemaVersion: 1, fingerprint, response, createdAt: now });
    return response;
  });
}

export async function purchaseMarketplaceListingHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "purchaseMarketplaceListing payload",
    ["requestId", "itemId", "price", "quantity"]
  );
  await ensureMarketplaceSeeded();

  const requestId = requireRequestId(payload.requestId);
  const itemId = requireString(payload.itemId, "itemId", 1, 64);
  const item = getMarketCatalogItem(itemId);
  const price = requirePrice(payload.price);
  const quantity = requirePositiveInteger(payload.quantity, "quantity", MARKET_MAX_PURCHASE_QUANTITY);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);
  const marketRequestRef = getMarketRequestRef(context.uid, requestId);
  const priceStatsRef = db.collection(MARKET_PRICE_STATS_COLLECTION).doc(item.id);
  const fingerprint = JSON.stringify({ action: "purchase", itemId, price, quantity });

  return db.runTransaction(async (transaction) => {
    const listingQuery = db.collection(MARKET_LISTINGS_COLLECTION)
      .where("itemId", "==", item.id)
      .where("price", "==", price)
      .where("status", "==", "active")
      .limit(500);
    const [requestSnapshot, buyerSnapshot, buyerInventorySnapshot, listingQuerySnapshot] = await Promise.all([
      transaction.get(marketRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef),
      transaction.get(listingQuery)
    ]);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This market request has already been used for another action.");
      }
      return stored.response;
    }

    const buyer = requireCompletedPlayer(buyerSnapshot);
    const buyerInventory = readMarketInventory(buyerInventorySnapshot.data());
    const totalCost = quantity * price;
    if (buyer.coins < totalCost) {
      throw new HttpsError("failed-precondition", "You do not have enough coins for this purchase.");
    }
    const candidates = listingQuerySnapshot.docs
      .map((document) => ({ ref: document.ref, data: document.data() }))
      .filter((entry) => entry.data.sellerUid !== context.uid && Number(entry.data.quantity) > 0)
      .sort((left, right) => {
        const leftCreated = left.data.createdAt instanceof Timestamp ? left.data.createdAt.toMillis() : 0;
        const rightCreated = right.data.createdAt instanceof Timestamp ? right.data.createdAt.toMillis() : 0;
        return leftCreated - rightCreated;
      });
    const available = candidates.reduce((total, entry) => total + Number(entry.data.quantity), 0);
    if (available < quantity) {
      throw new HttpsError("failed-precondition", `Only ${Math.max(0, available)} are still available at this price.`);
    }

    let remaining = quantity;
    const fills: Array<{ ref: FirebaseFirestore.DocumentReference; quantity: number; sellerUid: string }> = [];
    for (const candidate of candidates) {
      if (remaining <= 0) break;
      const filled = Math.min(remaining, Number(candidate.data.quantity));
      fills.push({ ref: candidate.ref, quantity: filled, sellerUid: String(candidate.data.sellerUid) });
      remaining -= filled;
    }
    const sellerUids = [...new Set(fills.map((fill) => fill.sellerUid).filter((uid) => uid !== "npc"))];
    const sellerSnapshots = await Promise.all(sellerUids.map((uid) => transaction.get(getPlayerDocumentRef(uid))));
    const sellers = new Map(sellerSnapshots.map((snapshot) => [snapshot.ref.id, snapshot]));
    const now = Timestamp.now();
    const nextBuyer = { ...buyer, coins: buyer.coins - totalCost, updatedAt: now.toDate() };
    const nextBuyerInventory = {
      ...buyerInventory,
      [item.id]: Math.min(10_000, buyerInventory[item.id] + quantity)
    };
    const sellerPayouts = new Map<string, number>();
    for (const fill of fills) {
      if (fill.sellerUid !== "npc") {
        sellerPayouts.set(fill.sellerUid, (sellerPayouts.get(fill.sellerUid) ?? 0) + fill.quantity * price);
      }
    }
    const response = {
      ok: true,
      purchase: { itemId: item.id, quantity, price, totalCost },
      inventory: { items: nextBuyerInventory },
      player: serializePlayerSnapshot(nextBuyer)
    };

    transaction.update(playerRef, { coins: nextBuyer.coins, updatedAt: now });
    transaction.set(playerInventoryRef, makeInventoryDocument(nextBuyerInventory, now));
    for (const fill of fills) {
      const listing = listingQuerySnapshot.docs.find((document) => document.ref.path === fill.ref.path)?.data();
      const nextQuantity = Number(listing?.quantity) - fill.quantity;
      transaction.update(fill.ref, {
        quantity: Math.max(0, nextQuantity),
        status: nextQuantity > 0 ? "active" : "sold",
        updatedAt: now
      });
    }
    for (const [sellerUid, payout] of sellerPayouts.entries()) {
      const sellerSnapshot = sellers.get(sellerUid);
      if (!sellerSnapshot?.exists) continue;
      const seller = requireCompletedPlayer(sellerSnapshot);
      transaction.update(getPlayerDocumentRef(sellerUid), {
        coins: seller.coins + payout,
        updatedAt: now
      });
    }
    transaction.set(priceStatsRef, {
      schemaVersion: 1,
      referencePrice: price,
      lastSalePrice: price,
      updatedAt: now
    }, { merge: true });
    transaction.create(marketRequestRef, { schemaVersion: 1, fingerprint, response, createdAt: now });
    return response;
  });
}

// The tutorial's level-two recipe is server-backed with the marketplace. That
// means the Energy Bar can be crafted, listed, and bought without falling
// back to browser-only inventory.
export async function craftEnergyBarHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "craftEnergyBar payload",
    ["requestId"]
  );
  const requestId = requireRequestId(payload.requestId);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);
  const marketRequestRef = getMarketRequestRef(context.uid, requestId);
  const fingerprint = JSON.stringify({ action: "craft-energy-bar" });

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, playerSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(marketRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef)
    ]);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This market request has already been used for another action.");
      }
      return stored.response;
    }

    const player = requireCompletedPlayer(playerSnapshot);
    if (!inventorySnapshot.exists) {
      throw new HttpsError("failed-precondition", "Reconnect before crafting this item.");
    }
    if (player.craftingLevel < 2) {
      throw new HttpsError(
        "failed-precondition",
        "This recipe requires crafting level 2."
      );
    }
    const inventory = readMarketInventory(inventorySnapshot.data());
    if (inventory.flour < 1 || inventory.sugar < 1) {
      throw new HttpsError("failed-precondition", "You need one Flour and one Sugar to make an Energy Bar.");
    }
    const now = Timestamp.now();
    const nextInventory = {
      ...inventory,
      flour: inventory.flour - 1,
      sugar: inventory.sugar - 1,
      energy_bar: Math.min(10_000, inventory.energy_bar + 1)
    };
    const response = {
      ok: true,
      craftedItemId: "energy_bar",
      inventory: { items: nextInventory },
      player: serializePlayerSnapshot(player)
    };
    transaction.set(playerInventoryRef, makeInventoryDocument(nextInventory, now));
    transaction.create(marketRequestRef, { schemaVersion: 1, fingerprint, response, createdAt: now });
    return response;
  });
}

/**
 * Crafting and the Market use the same inventory document. This endpoint is
 * intentionally generic so every established recipe consumes and creates
 * items inside one transaction instead of leaving a browser-only copy behind.
 */
export async function craftRecipeHandler(request: CallableRequest<unknown>) {
  const { payload, context } = await requireMarketContext(
    request,
    "craftRecipe payload",
    ["requestId", "recipeId"]
  );
  const requestId = requireRequestId(payload.requestId);
  const recipeId = requireString(payload.recipeId, "recipeId", 1, 64);
  const recipe = getCraftingRecipe(recipeId);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(context.uid);
  const playerInventoryRef = inventoryRef(context.uid);
  const marketRequestRef = getMarketRequestRef(context.uid, requestId);
  const starterRewardRef = db
    .collection("playerRewardGrants")
    .doc(context.uid)
    .collection("rewards")
    .doc(STARTER_ENERGY_BAR_REWARD_ID);
  const fingerprint = JSON.stringify({ action: "craft", recipeId });

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, playerSnapshot, inventorySnapshot, starterRewardSnapshot] = await Promise.all([
      transaction.get(marketRequestRef),
      transaction.get(playerRef),
      transaction.get(playerInventoryRef),
      transaction.get(starterRewardRef)
    ]);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError("already-exists", "This crafting request has already been used for another action.");
      }
      return stored.response;
    }

    const player = requireCompletedPlayer(playerSnapshot);
    if (!inventorySnapshot.exists) {
      throw new HttpsError("failed-precondition", "Reconnect before crafting this item.");
    }
    if (player.craftingLevel < recipe.level) {
      throw new HttpsError(
        "failed-precondition",
        `This recipe requires crafting level ${recipe.level}.`
      );
    }
    const inventory = readMarketInventory(inventorySnapshot.data());
    for (const [itemId, quantity] of Object.entries(recipe.ingredients)) {
      if (Number(inventory[itemId] ?? 0) < quantity) {
        throw new HttpsError("failed-precondition", "You do not have all of the required ingredients.");
      }
    }

    const nextInventory = { ...inventory };
    for (const [itemId, quantity] of Object.entries(recipe.ingredients)) {
      nextInventory[itemId] = Number(nextInventory[itemId] || 0) - quantity;
    }
    nextInventory[recipe.id] = Math.min(10_000, Number(nextInventory[recipe.id] || 0) + 1);

    const awardStarterReward = recipe.id === "energy_bar" && !starterRewardSnapshot.exists;
    if (awardStarterReward) {
      nextInventory.wheat_seed = Math.min(10_000, nextInventory.wheat_seed + STARTER_ENERGY_BAR_REWARD.wheat_seed);
      nextInventory.sugar_cane_seed = Math.min(10_000, nextInventory.sugar_cane_seed + STARTER_ENERGY_BAR_REWARD.sugar_cane_seed);
    }

    const now = Timestamp.now();
    const nextCraftingXp = player.craftingXp + recipe.craftingXp;
    const nextCraftingLevel = getCraftingLevelForXp(nextCraftingXp);
    const nextPlayer = {
      ...player,
      craftingXp: nextCraftingXp,
      craftingLevel: nextCraftingLevel,
      coins: player.coins + (awardStarterReward ? STARTER_ENERGY_BAR_REWARD.coins : 0),
      updatedAt: now.toDate()
    };
    const response = {
      ok: true,
      craftedItemId: recipe.id,
      crafting: {
        level: nextCraftingLevel,
        xp: nextCraftingXp,
        xpAwarded: recipe.craftingXp
      },
      starterReward: awardStarterReward
        ? { ...STARTER_ENERGY_BAR_REWARD, grantedNow: true }
        : null,
      inventory: { items: nextInventory },
      player: serializePlayerSnapshot(nextPlayer)
    };

    transaction.update(playerRef, {
      craftingXp: nextCraftingXp,
      craftingLevel: nextCraftingLevel,
      coins: nextPlayer.coins,
      updatedAt: now
    });
    transaction.set(playerInventoryRef, makeInventoryDocument(nextInventory, now));
    if (awardStarterReward) {
      transaction.create(starterRewardRef, {
        schemaVersion: 1,
        rewardId: STARTER_ENERGY_BAR_REWARD_ID,
        rewards: STARTER_ENERGY_BAR_REWARD,
        grantedAt: now
      });
    }
    transaction.create(marketRequestRef, { schemaVersion: 1, fingerprint, response, createdAt: now });
    return response;
  });
}

export const initializeMarketInventory = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  initializeMarketInventoryHandler
);
export const getMarketplaceSnapshot = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getMarketplaceSnapshotHandler
);
export const createMarketplaceListing = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  createMarketplaceListingHandler
);
export const cancelMarketplaceListing = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  cancelMarketplaceListingHandler
);
export const purchaseMarketplaceListing = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  purchaseMarketplaceListingHandler
);
export const craftEnergyBar = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  craftEnergyBarHandler
);
export const craftRecipe = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  craftRecipeHandler
);
