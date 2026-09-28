import { HttpsError } from "firebase-functions/v2/https";

export interface MarketCatalogItem {
  id: string;
  referencePrice: number;
  npcQuantity: number;
}

/**
 * A player has one persistent item bag.  The Market is only one consumer of
 * that bag, so its trade catalogue must not decide which crafted or quest
 * items survive a reload.  Items with no market entry are still stored safely
 * and can be used by crafting or gameplay.
 */
export const inventoryItemIds = Object.freeze([
  "wheat_seed", "corn_seed", "sugar_cane_seed", "tomato_seed", "cocoa_bean_seed",
  "wheat", "sugar_cane", "corn", "miracle_grow", "water", "fish", "salmon",
  "milk", "cocoa_beans", "egg", "tomato", "flour", "sugar", "bread",
  "corn_meal", "purified_water", "energy_bar", "sweet_corn_snack", "battered_fish",
  "dinosaur_card", "planet_card", "land_of_oz_card", "paper_scarecrow_skin",
  // Account-bound alpha test item. It is deliberately absent from the market
  // catalogue, so it can be carried safely without becoming tradable.
  "bingles_scarecrow",
  "golden_pin_skin", "dough", "energy_drink", "chocolate_energy_drink", "fairy_bread", "battered_trout",
  "egg_tomato_sandwich", "omelette", "cream_of_tomato_soup", "spaghetti_marinara",
  "pancakes", "chocolate_brownies", "chocolate_croissant", "chocolate_cake",
  "baked_salmon", "cream", "pasta", "butter", "cocoa", "buttered_corn",
  "milk_chocolate_bar", "sugar_syrup", "chocolate_milk"
] as const);

export type InventoryItemId = (typeof inventoryItemIds)[number];

// This is deliberately server-side. A browser may suggest a price, but it may
// only list an item that the marketplace recognises and within its server
// price band.
export const marketCatalog = Object.freeze([
  { id: "wheat_seed", referencePrice: 8, npcQuantity: 100 },
  { id: "corn_seed", referencePrice: 8, npcQuantity: 100 },
  { id: "sugar_cane_seed", referencePrice: 8, npcQuantity: 100 },
  { id: "tomato_seed", referencePrice: 18, npcQuantity: 0 },
  { id: "cocoa_bean_seed", referencePrice: 20, npcQuantity: 0 },
  { id: "wheat", referencePrice: 20, npcQuantity: 150 },
  { id: "sugar_cane", referencePrice: 20, npcQuantity: 40 },
  { id: "corn", referencePrice: 21, npcQuantity: 35 },
  // Available only for alpha/beta market testing. It has no NPC supply, so
  // every listing comes from a player reward grant or player inventory.
  { id: "miracle_grow", referencePrice: 20, npcQuantity: 0 },
  { id: "water", referencePrice: 19, npcQuantity: 80 },
  { id: "fish", referencePrice: 22, npcQuantity: 18 },
  { id: "salmon", referencePrice: 60, npcQuantity: 8 },
  { id: "milk", referencePrice: 52, npcQuantity: 12 },
  { id: "cocoa_beans", referencePrice: 60, npcQuantity: 10 },
  { id: "tomato", referencePrice: 60, npcQuantity: 10 },
  { id: "flour", referencePrice: 50, npcQuantity: 20 },
  { id: "sugar", referencePrice: 50, npcQuantity: 20 },
  { id: "bread", referencePrice: 53, npcQuantity: 10 },
  { id: "corn_meal", referencePrice: 42, npcQuantity: 0 },
  { id: "purified_water", referencePrice: 35, npcQuantity: 0 },
  { id: "energy_bar", referencePrice: 55, npcQuantity: 8 },
  { id: "sweet_corn_snack", referencePrice: 70, npcQuantity: 8 },
  { id: "battered_fish", referencePrice: 85, npcQuantity: 6 },
  // Advanced craftables have no NPC stock. They become tradable only when a
  // player has actually made or found one.
  { id: "dough", referencePrice: 40, npcQuantity: 0 },
  { id: "energy_drink", referencePrice: 110, npcQuantity: 0 },
  { id: "chocolate_energy_drink", referencePrice: 135, npcQuantity: 0 },
  { id: "fairy_bread", referencePrice: 65, npcQuantity: 0 },
  { id: "battered_trout", referencePrice: 105, npcQuantity: 0 },
  { id: "egg_tomato_sandwich", referencePrice: 140, npcQuantity: 0 },
  { id: "omelette", referencePrice: 145, npcQuantity: 0 },
  { id: "cream_of_tomato_soup", referencePrice: 150, npcQuantity: 0 },
  { id: "spaghetti_marinara", referencePrice: 155, npcQuantity: 0 },
  { id: "pancakes", referencePrice: 160, npcQuantity: 0 },
  { id: "chocolate_brownies", referencePrice: 170, npcQuantity: 0 },
  { id: "chocolate_croissant", referencePrice: 180, npcQuantity: 0 },
  { id: "chocolate_cake", referencePrice: 200, npcQuantity: 0 },
  { id: "baked_salmon", referencePrice: 190, npcQuantity: 0 },
  { id: "cream", referencePrice: 45, npcQuantity: 0 },
  { id: "pasta", referencePrice: 45, npcQuantity: 0 },
  { id: "butter", referencePrice: 45, npcQuantity: 0 },
  { id: "cocoa", referencePrice: 50, npcQuantity: 0 },
  { id: "buttered_corn", referencePrice: 95, npcQuantity: 0 },
  { id: "milk_chocolate_bar", referencePrice: 105, npcQuantity: 0 },
  { id: "sugar_syrup", referencePrice: 55, npcQuantity: 0 },
  // Legacy alpha item retained so already-crafted Chocolate Milk never
  // disappears from a player's inventory or market listings.
  { id: "chocolate_milk", referencePrice: 90, npcQuantity: 0 },
  { id: "dinosaur_card", referencePrice: 100, npcQuantity: 5 },
  { id: "planet_card", referencePrice: 105, npcQuantity: 3 },
  { id: "land_of_oz_card", referencePrice: 150, npcQuantity: 2 },
  { id: "paper_scarecrow_skin", referencePrice: 1000, npcQuantity: 2 },
  { id: "golden_pin_skin", referencePrice: 2000, npcQuantity: 1 }
] satisfies readonly MarketCatalogItem[]);

const catalogById = new Map(marketCatalog.map((item) => [item.id, item]));

export const MARKET_INVENTORY_SCHEMA_VERSION = 1 as const;
export const MARKET_MAX_ITEM_QUANTITY = 10_000 as const;
export const MARKET_MAX_LISTING_QUANTITY = 10_000 as const;
export const MARKET_MAX_PURCHASE_QUANTITY = 10 as const;

export function getMarketCatalogItem(itemId: string): MarketCatalogItem {
  const item = catalogById.get(itemId);
  if (!item) {
    throw new HttpsError("invalid-argument", "This item cannot be traded on the Market.");
  }
  return item;
}

export function isMarketCatalogItem(itemId: string): boolean {
  return catalogById.has(itemId);
}

export function getMarketPriceRange(referencePrice: number) {
  const normalized = Math.max(1, Math.round(referencePrice));
  return {
    min: Math.max(1, Math.round(normalized * 0.95)),
    max: Math.max(1, Math.round(normalized * 1.05))
  };
}

export function readMarketInventory(value: unknown): Record<string, number> {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const storedItems = data.items && typeof data.items === "object" && !Array.isArray(data.items)
    ? data.items as Record<string, unknown>
    : {};
  const items: Record<string, number> = {};

  for (const itemId of inventoryItemIds) {
    const quantity = storedItems[itemId];
    items[itemId] = Number.isSafeInteger(quantity) && Number(quantity) >= 0
      ? Math.min(Number(quantity), MARKET_MAX_ITEM_QUANTITY)
      : 0;
  }

  return items;
}

export function normalizeImportedMarketInventory(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "inventory must be an object.");
  }

  const source = value as Record<string, unknown>;
  const items: Record<string, number> = {};
  for (const itemId of inventoryItemIds) {
    const quantity = source[itemId];
    if (quantity === undefined) {
      items[itemId] = 0;
      continue;
    }
    if (!Number.isSafeInteger(quantity) || Number(quantity) < 0 || Number(quantity) > MARKET_MAX_ITEM_QUANTITY) {
      throw new HttpsError("invalid-argument", `inventory.${itemId} is invalid.`);
    }
    items[itemId] = Number(quantity);
  }
  return items;
}
