import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const coreWorldPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "core-world-asset-pack.mjs"
  )
);

test("core world asset factory layers build successfully from the seed pack definitions", () => {
  const {
    assetRegistry,
    recipeRegistry,
    componentLibrary,
    manifestRegistry
  } = coreWorldPackModule.buildCoreWorldAssetFactoryLayers();

  assert.equal(assetRegistry.hasAsset("TERRAIN_GRASS_001"), true);
  assert.equal(assetRegistry.hasAsset("BUILDING_SHOP_SMALL_001"), true);
  assert.equal(recipeRegistry.hasRecipe("ROAD_INTERSECTION_RECIPE_001"), true);
  assert.equal(componentLibrary.hasComponent("SHOP_WINDOW_DISPLAY_001"), true);
  assert.equal(manifestRegistry.hasManifest("TREE_BASIC_001"), true);
});

test("core world asset pack validates successfully against the seed registries", () => {
  const layers = coreWorldPackModule.buildCoreWorldAssetFactoryLayers();
  const result = coreWorldPackModule.validateCoreWorldAssetPack(
    coreWorldPackModule.coreWorldAssetPackDefinition,
    layers
  );

  assert.equal(result.ok, true);
  assert.equal(result.normalizedPack.packId, "CORE_WORLD_PACK_001");
  assert.equal(result.normalizedPack.status, "validated");
  assert.equal(result.normalizedPack.assetReferences.length, 14);
});

test("core world asset pack enforces required fields, versions, and unique asset references", () => {
  const layers = coreWorldPackModule.buildCoreWorldAssetFactoryLayers();
  const missingMetadata = structuredClone(
    coreWorldPackModule.coreWorldAssetPackDefinition
  );
  delete missingMetadata.metadata;

  const invalidVersion = {
    ...coreWorldPackModule.coreWorldAssetPackDefinition,
    version: "v1"
  };

  const duplicateAssetReference = {
    ...coreWorldPackModule.coreWorldAssetPackDefinition,
    assetReferences: ["TERRAIN_GRASS_001", "TERRAIN_GRASS_001"]
  };

  const missingMetadataResult = coreWorldPackModule.validateCoreWorldAssetPack(
    missingMetadata,
    layers
  );
  const invalidVersionResult = coreWorldPackModule.validateCoreWorldAssetPack(
    invalidVersion,
    layers
  );
  const duplicateReferenceResult =
    coreWorldPackModule.validateCoreWorldAssetPack(
      duplicateAssetReference,
      layers
    );

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(invalidVersionResult.ok, false);
  assert.equal(invalidVersionResult.errorCode, "invalid_version");
  assert.equal(duplicateReferenceResult.ok, false);
  assert.equal(duplicateReferenceResult.errorCode, "duplicate_asset_reference");
});

test("core world asset pack rejects missing manifests, recipes, and unavailable components", () => {
  const {
    assetRegistry,
    recipeRegistry,
    componentLibrary
  } = coreWorldPackModule.buildCoreWorldAssetFactoryLayers();

  const missingManifestRegistry = {
    findManifestByAssetId() {
      return null;
    },
    isManifestAvailable() {
      return false;
    }
  };

  const missingManifestResult = coreWorldPackModule.validateCoreWorldAssetPack(
    coreWorldPackModule.coreWorldAssetPackDefinition,
    {
      assetRegistry,
      recipeRegistry,
      componentLibrary,
      manifestRegistry: missingManifestRegistry
    }
  );

  const layersWithBlockedComponent =
    coreWorldPackModule.buildCoreWorldAssetFactoryLayers();
  const blockedComponentLibrary = {
    ...layersWithBlockedComponent.componentLibrary,
    isComponentAvailable(componentId) {
      if (componentId === "SIGN_BOARD_BASIC_001") {
        return false;
      }

      return layersWithBlockedComponent.componentLibrary.isComponentAvailable(
        componentId
      );
    }
  };

  const blockedComponentResult = coreWorldPackModule.validateCoreWorldAssetPack(
    coreWorldPackModule.coreWorldAssetPackDefinition,
    {
      assetRegistry: layersWithBlockedComponent.assetRegistry,
      recipeRegistry: layersWithBlockedComponent.recipeRegistry,
      manifestRegistry: layersWithBlockedComponent.manifestRegistry,
      componentLibrary: blockedComponentLibrary
    }
  );

  assert.equal(missingManifestResult.ok, false);
  assert.equal(missingManifestResult.errorCode, "missing_manifest_reference");
  assert.equal(blockedComponentResult.ok, false);
  assert.equal(blockedComponentResult.errorCode, "unavailable_component_reference");
});

test("core world asset pack stays data-oriented and renderer-independent", () => {
  const pack = coreWorldPackModule.createCoreWorldAssetPack(
    coreWorldPackModule.coreWorldAssetPackDefinition,
    coreWorldPackModule.buildCoreWorldAssetFactoryLayers()
  );

  assert.equal(Object.isFrozen(pack), true);
  assert.equal(pack.metadata.packRole, "seed_core_world_content");
  assert.equal(
    pack.assetReferences.includes("BUILDING_HOUSE_SMALL_001"),
    true
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.metadata, "rendererAttachment"),
    false
  );
});
