import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetRegistryModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-registry.mjs")
);

test("house lookup returns onboarded residential suburban asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_RESIDENTIAL_SUBURBAN_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FAMILY_BUILDING_RESIDENTIAL_HOUSE");
  assert.equal(asset.recipeId, "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001");
  assert.deepEqual(asset.lodRules, ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]);
});

test("shop lookup returns onboarded commercial small shop asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_SMALL_SHOP_001");

  assert.ok(asset);
  assert.equal(asset.assetType, "SMALL_SHOP");
  assert.equal(asset.recipeId, "BUILDING_SHOP_GENERAL_RECIPE_001");
  assert.equal(asset.atlasCompatibility.atlasCompatible, true);
});

test("recipe lookup resolves shop recipe to onboarded asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetByRecipeId("BUILDING_SHOP_GENERAL_RECIPE_001");

  assert.ok(asset);
  assert.equal(asset.assetId, "BUILDING_COMMERCIAL_SMALL_SHOP_001");
});

test("atlas assignment resolution resolves residential recipe deterministically", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const resolved = registryLayer.resolveAssetForAtlasAssignment({
    objectId: "HOUSE_settle_house_001",
    objectType: "HOUSE",
    recipeId: "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001"
  });

  assert.ok(resolved);
  assert.equal(resolved.assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
});

test("invalid asset handling rejects duplicate asset ids", () => {
  assert.throws(
    () =>
      assetRegistryModule.createAssetFactoryRegistryLayer([
        ...assetRegistryModule.onboardedExistingAssetRecords,
        assetRegistryModule.onboardedExistingAssetRecords[0]
      ]),
    /already exists/i
  );
});

test("same inputs produce deterministic same registry output", () => {
  const first = assetRegistryModule.createAssetFactoryRegistryLayer();
  const second = assetRegistryModule.createAssetFactoryRegistryLayer();

  assert.deepEqual(first.records, second.records);
  assert.equal(
    first.validation.deterministicRegistryHash,
    second.validation.deterministicRegistryHash
  );
});

test("explicit asset registry validation passes contract checks", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const validation =
    assetRegistryModule.validateAssetFactoryRegistryLayer(registryLayer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.uniqueIds,
    true
  );
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.recipeExists,
    true
  );
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.atlasCompatibilityValid,
    true
  );
});
