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

test("tree lookup returns nature pack tree asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TREE_EUCALYPTUS_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "TREE_ASSET_FAMILY_001");
  assert.equal(asset.assetType, "COASTAL_TREE");
  assert.ok(asset.biomeCompatibility.includes("COASTAL"));
});

test("vegetation lookup returns nature pack vegetation asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUSH_NATIVE_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "VEGETATION_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001");
});

test("terrain feature lookup returns coastal terrain feature asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("ROCK_COASTAL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "TERRAIN_FEATURE_ASSET_FAMILY_001");
  assert.ok(asset.biomeCompatibility.includes("CLIFF_EDGE"));
});

test("recipe lookup resolves shop recipe to onboarded asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetByRecipeId("BUILDING_SHOP_GENERAL_RECIPE_001");

  assert.ok(asset);
  assert.equal(asset.assetId, "BUILDING_COMMERCIAL_SMALL_SHOP_001");
});

test("recipe lookup resolves nature pack recipe through nature asset pack", () => {
  const naturePack = assetRegistryModule.createNatureAssetPack();
  const recipe = naturePack.getRecipe("RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "COASTAL_ENVIRONMENT_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("TREE_ASSET_FAMILY_001"));
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

test("deterministic nature asset pack output stays stable", () => {
  const first = assetRegistryModule.createNatureAssetPack();
  const second = assetRegistryModule.createNatureAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicNaturePackHash,
    second.validation.deterministicNaturePackHash
  );
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

test("explicit nature asset pack validation passes contract checks", () => {
  const naturePack = assetRegistryModule.createNatureAssetPack();
  const validation = assetRegistryModule.validateNatureAssetPack(naturePack);

  assert.equal(validation.ok, true);
  assert.equal(validation.natureAssetPack.validation.uniqueIds, true);
  assert.equal(validation.natureAssetPack.validation.recipesExist, true);
  assert.equal(
    validation.natureAssetPack.validation.biomeCompatibilityValid,
    true
  );
});
