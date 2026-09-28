import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("persistent inventory keeps crop seeds, harvests, and crafted ingredients together", async () => {
  const catalog = await import(path.join(repoRoot, "functions/lib/domain/market/marketCatalog.js"));

  const inventory = catalog.readMarketInventory({
    items: {
      cocoa_bean_seed: 3,
      wheat: 6,
      dough: 2,
      energy_drink: 1,
      chocolate_cake: 1,
      bingles_scarecrow: 1
    }
  });

  assert.equal(inventory.cocoa_bean_seed, 3);
  assert.equal(inventory.wheat, 6);
  assert.equal(inventory.dough, 2);
  assert.equal(inventory.energy_drink, 1);
  assert.equal(inventory.chocolate_cake, 1);
  assert.equal(inventory.bingles_scarecrow, 1);
  assert.equal(inventory.sugar, 0);
});

test("server crafting definitions mirror the restored Level 1–9 recipe chain", async () => {
  const crafting = await import(path.join(repoRoot, "functions/lib/domain/crafting/craftingCatalog.js"));

  assert.deepEqual(crafting.getCraftingRecipe("flour").ingredients, { wheat: 2 });
  assert.deepEqual(crafting.getCraftingRecipe("sugar").ingredients, { sugar_cane: 2 });
  assert.deepEqual(crafting.getCraftingRecipe("energy_bar").ingredients, {
    sugar: 1,
    wheat: 1
  });
  assert.equal(crafting.getCraftingRecipe("energy_bar").level, 3);
  assert.deepEqual(crafting.getCraftingRecipe("sweet_corn_snack").ingredients, {
    corn_meal: 1,
    sugar: 1
  });
  assert.equal(crafting.getCraftingRecipe("energy_bar").craftingXp, 75);
});

test("advanced cocoa recipes consume the harvested cocoa beans item", async () => {
  const crafting = await import(path.join(repoRoot, "functions/lib/domain/crafting/craftingCatalog.js"));

  assert.deepEqual(crafting.getCraftingRecipe("chocolate_brownies").ingredients, {
    flour: 1,
    sugar: 1,
    cocoa_beans: 1
  });
  assert.deepEqual(crafting.getCraftingRecipe("chocolate_cake").ingredients, {
    flour: 1,
    sugar: 1,
    cocoa_beans: 1,
    egg: 1,
    milk: 1
  });
});
