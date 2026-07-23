import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const starterPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "starter-asset-manifest-pack.mjs"
  )
);

test("starter asset factory layers build successfully with approved starter content", () => {
  const layers = starterPackModule.buildStarterAssetFactoryLayers();

  assert.equal(layers.assetRegistry.hasAsset("BUILDING_BAKERY_SMALL_001"), true);
  assert.equal(
    layers.recipeRegistry.hasRecipe("TREE_EUCALYPTUS_RECIPE_001"),
    true
  );
  assert.equal(
    layers.componentLibrary.hasComponent("LAMP_POST_POLE_001"),
    true
  );
  assert.equal(layers.manifestRegistry.hasManifest("FENCE_WOOD_001"), true);
  assert.equal(
    layers.placementRuleRegistry.listPlacementRules().length > 0,
    true
  );
});

test("starter asset pack validates successfully against approved dependencies and placement rules", () => {
  const layers = starterPackModule.buildStarterAssetFactoryLayers();
  const result = starterPackModule.validateStarterAssetPack(
    starterPackModule.starterAssetPackDefinition,
    layers
  );

  assert.equal(result.ok, true);
  assert.equal(result.normalizedPack.packId, "STARTER_ASSET_PACK_001");
  assert.equal(result.normalizedPack.assetReferences.length, 15);
});

test("starter asset pack enforces required fields, versions, and placement rule coverage", () => {
  const layers = starterPackModule.buildStarterAssetFactoryLayers();
  const missingMetadata = structuredClone(
    starterPackModule.starterAssetPackDefinition
  );
  delete missingMetadata.metadata;

  const invalidVersion = {
    ...starterPackModule.starterAssetPackDefinition,
    version: "v1"
  };

  const placementRuleRegistry = {
    ...layers.placementRuleRegistry,
    listPlacementRules() {
      return layers.placementRuleRegistry
        .listPlacementRules()
        .filter(
          (rule) =>
            !rule.compatibilityRules.allowedAssetIds.includes(
              "BUILDING_BAKERY_SMALL_001"
            )
        );
    }
  };

  const missingMetadataResult = starterPackModule.validateStarterAssetPack(
    missingMetadata,
    layers
  );
  const invalidVersionResult = starterPackModule.validateStarterAssetPack(
    invalidVersion,
    layers
  );
  const missingPlacementRuleResult = starterPackModule.validateStarterAssetPack(
    starterPackModule.starterAssetPackDefinition,
    {
      ...layers,
      placementRuleRegistry
    }
  );

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(invalidVersionResult.ok, false);
  assert.equal(invalidVersionResult.errorCode, "invalid_version");
  assert.equal(missingPlacementRuleResult.ok, false);
  assert.equal(missingPlacementRuleResult.errorCode, "missing_placement_rule");
});

test("starter asset pack rejects missing recipes and unavailable components safely", () => {
  const layers = starterPackModule.buildStarterAssetFactoryLayers();
  const recipeRegistry = {
    ...layers.recipeRegistry,
    findRecipeById(recipeId) {
      if (recipeId === "BUILDING_GAS_STATION_SMALL_RECIPE_001") {
        return null;
      }

      return layers.recipeRegistry.findRecipeById(recipeId);
    }
  };

  const missingRecipeResult = starterPackModule.validateStarterAssetPack(
    starterPackModule.starterAssetPackDefinition,
    {
      ...layers,
      recipeRegistry
    }
  );

  const blockedComponentLibrary = {
    ...layers.componentLibrary,
    isComponentAvailable(componentId) {
      if (componentId === "BAKERY_SIGN_BOARD_001") {
        return false;
      }

      return layers.componentLibrary.isComponentAvailable(componentId);
    }
  };

  const blockedComponentResult = starterPackModule.validateStarterAssetPack(
    starterPackModule.starterAssetPackDefinition,
    {
      ...layers,
      componentLibrary: blockedComponentLibrary
    }
  );

  assert.equal(missingRecipeResult.ok, false);
  assert.equal(missingRecipeResult.errorCode, "missing_recipe_reference");
  assert.equal(blockedComponentResult.ok, false);
  assert.equal(blockedComponentResult.errorCode, "unavailable_component_reference");
});

test("starter asset pack remains data-driven and renderer-independent", () => {
  const pack = starterPackModule.createStarterAssetPack(
    starterPackModule.starterAssetPackDefinition,
    starterPackModule.buildStarterAssetFactoryLayers()
  );

  assert.equal(Object.isFrozen(pack), true);
  assert.equal(pack.metadata.packRole, "starter_asset_catalogue");
  assert.equal(pack.assetReferences.includes("TREE_PINE_001"), true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.metadata, "rendererAttachment"),
    false
  );
});
