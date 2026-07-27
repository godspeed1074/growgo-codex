import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const packPriorityModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-pack-priority.mjs")
);

test("pack lookup returns civic pack with explicit civic recipe dependencies", () => {
  const system = packPriorityModule.createAssetFactoryPackPrioritySystem();
  const civicPack = system.getPackById("CIVIC_PACK_001");

  assert.ok(civicPack);
  assert.ok(civicPack.recipeDependencies.includes("SCHOOL_RECIPE_001"));
  assert.ok(civicPack.recipeDependencies.includes("SPORTS_OVAL_RECIPE_001"));
  assert.equal(civicPack.coverageSummary.unmetRecipeCount, 0);
});

test("priority ordering stays deterministic and sorted by Atlas demand pressure", () => {
  const system = packPriorityModule.createAssetFactoryPackPrioritySystem();
  const orderedPackIds = system.listPacksByPriority().map((pack) => pack.packId);

  assert.deepEqual(orderedPackIds, [
    "CIVIC_PACK_001",
    "ROAD_AND_STREET_PACK_001",
    "COMMERCIAL_PACK_001",
    "RESIDENTIAL_PACK_001",
    "TRANSPORT_PACK_001"
  ]);
});

test("recipe dependency validation recognises known Atlas demand recipes", () => {
  const system = packPriorityModule.createAssetFactoryPackPrioritySystem();
  const validation = packPriorityModule.validateAssetFactoryPackPrioritySystem(system);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryPackPrioritySystem.validation.recipeLinksValid,
    true
  );
  assert.ok(
    validation.assetFactoryPackPrioritySystem.knownRecipeIds.includes(
      "INDUSTRIAL_BUILDING_RECIPE_001"
    )
  );
});

test("same inputs produce deterministic same pack priority output", () => {
  const first = packPriorityModule.createAssetFactoryPackPrioritySystem();
  const second = packPriorityModule.createAssetFactoryPackPrioritySystem();

  assert.deepEqual(first.packs, second.packs);
  assert.equal(
    first.validation.deterministicPriorityHash,
    second.validation.deterministicPriorityHash
  );
});

test("explicit pack priority validation passes contract checks", () => {
  const system = packPriorityModule.createAssetFactoryPackPrioritySystem();
  const validation = packPriorityModule.validateAssetFactoryPackPrioritySystem(system);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryPackPrioritySystem.validation.uniquePackIds,
    true
  );
  assert.equal(
    validation.assetFactoryPackPrioritySystem.validation.prioritiesDeterministic,
    true
  );
  assert.equal(
    validation.assetFactoryPackPrioritySystem.validation.validationPassed,
    true
  );
});
