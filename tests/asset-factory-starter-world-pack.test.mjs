import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const starterWorldPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "starter-world-asset-pack.mjs"
  )
);

test("starter world asset pack validates successfully with approved grouped starter content", () => {
  const context = starterWorldPackModule.buildStarterWorldAssetPackContext();
  const result = starterWorldPackModule.validateStarterWorldAssetPack(
    starterWorldPackModule.starterWorldAssetPackDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.normalizedPack.packId, "STARTER_WORLD_ASSET_PACK_001");
  assert.equal(
    result.normalizedPack.assetFamilyGroups.residential.length,
    3
  );
  assert.equal(
    result.normalizedPack.assetFamilyGroups.decoration.includes("BENCH_PARK_001"),
    true
  );
});

test("starter world asset pack enforces required fields and valid versioning", () => {
  const context = starterWorldPackModule.buildStarterWorldAssetPackContext();
  const missingMetadata = structuredClone(
    starterWorldPackModule.starterWorldAssetPackDefinition
  );
  delete missingMetadata.metadata;

  const invalidVersion = {
    ...starterWorldPackModule.starterWorldAssetPackDefinition,
    version: "version-one"
  };

  const missingMetadataResult =
    starterWorldPackModule.validateStarterWorldAssetPack(
      missingMetadata,
      context
    );
  const invalidVersionResult =
    starterWorldPackModule.validateStarterWorldAssetPack(
      invalidVersion,
      context
    );

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(invalidVersionResult.ok, false);
  assert.equal(invalidVersionResult.errorCode, "invalid_version");
});

test("starter world asset pack rejects missing manifests, components, and placement coverage safely", () => {
  const context = starterWorldPackModule.buildStarterWorldAssetPackContext();
  const missingManifestRegistry = {
    ...context.manifestRegistry,
    findManifestByAssetId(assetId) {
      if (assetId === "BUILDING_HOUSE_WEATHERBOARD_001") {
        return null;
      }

      return context.manifestRegistry.findManifestByAssetId(assetId);
    }
  };

  const missingManifestResult =
    starterWorldPackModule.validateStarterWorldAssetPack(
      starterWorldPackModule.starterWorldAssetPackDefinition,
      {
        ...context,
        manifestRegistry: missingManifestRegistry
      }
    );

  const unavailableComponentLibrary = {
    ...context.componentLibrary,
    isComponentAvailable(componentId) {
      if (componentId === "BENCH_PARK_SEAT_001") {
        return false;
      }

      return context.componentLibrary.isComponentAvailable(componentId);
    }
  };

  const unavailableComponentResult =
    starterWorldPackModule.validateStarterWorldAssetPack(
      starterWorldPackModule.starterWorldAssetPackDefinition,
      {
        ...context,
        componentLibrary: unavailableComponentLibrary
      }
    );

  const missingPlacementCoverageRegistry = {
    ...context.placementRuleRegistry,
    listPlacementRules() {
      return context.placementRuleRegistry
        .listPlacementRules()
        .filter(
          (rule) =>
            !rule.compatibilityRules.allowedAssetIds.includes("FOOTPATH_SMALL_001")
        );
    }
  };

  const missingPlacementCoverageResult =
    starterWorldPackModule.validateStarterWorldAssetPack(
      starterWorldPackModule.starterWorldAssetPackDefinition,
      {
        ...context,
        placementRuleRegistry: missingPlacementCoverageRegistry
      }
    );

  assert.equal(missingManifestResult.ok, false);
  assert.equal(missingManifestResult.errorCode, "missing_manifest_reference");
  assert.equal(unavailableComponentResult.ok, false);
  assert.equal(
    unavailableComponentResult.errorCode,
    "unavailable_component_reference"
  );
  assert.equal(missingPlacementCoverageResult.ok, false);
  assert.equal(
    missingPlacementCoverageResult.errorCode,
    "missing_placement_rule"
  );
});

test("starter world asset pack remains data-driven and renderer-independent", () => {
  const context = starterWorldPackModule.buildStarterWorldAssetPackContext();
  const pack = starterWorldPackModule.createStarterWorldAssetPack(
    starterWorldPackModule.starterWorldAssetPackDefinition,
    context
  );

  assert.equal(Object.isFrozen(pack), true);
  assert.equal(pack.metadata.packRole, "starter_world_catalogue");
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.metadata, "rendererAttachment"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.assetFamilyGroups, "runtimeWorld"),
    false
  );
});
