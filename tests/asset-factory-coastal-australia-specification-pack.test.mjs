import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const specificationPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-australia-asset-specification-pack.mjs"
  )
);

test("coastal australia asset specification pack validates successfully for approved coastal assets", () => {
  const context =
    specificationPackModule.buildCoastalAustraliaAssetSpecificationPackContext();
  const result =
    specificationPackModule.validateCoastalAustraliaAssetSpecificationPack(
      specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition,
      context
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.normalizedPack.packId,
    "COASTAL_AUSTRALIA_ASSET_PACK_001"
  );
  assert.equal(result.normalizedPack.assetSpecifications.length, 4);
  assert.equal(
    result.normalizedPack.assetSpecifications[0].orientationSupport.allowedOrientations.length,
    4
  );
});

test("coastal australia specification validation enforces required fields and supported orientation rules", () => {
  const context =
    specificationPackModule.buildCoastalAustraliaAssetSpecificationPackContext();
  const missingMetadata = structuredClone(
    specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition
  );
  delete missingMetadata.metadata;

  const invalidOrientation = structuredClone(
    specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition
  );
  invalidOrientation.assetSpecifications[0].orientationSupport.allowedOrientations =
    ["north", "seaward"];

  const missingMetadataResult =
    specificationPackModule.validateCoastalAustraliaAssetSpecificationPack(
      missingMetadata,
      context
    );
  const invalidOrientationResult =
    specificationPackModule.validateCoastalAustraliaAssetSpecificationPack(
      invalidOrientation,
      context
    );

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(invalidOrientationResult.ok, false);
  assert.equal(invalidOrientationResult.errorCode, "invalid_orientation");
});

test("coastal australia specification pack rejects missing components and placement coverage safely", () => {
  const context =
    specificationPackModule.buildCoastalAustraliaAssetSpecificationPackContext();
  const missingComponentLibrary = {
    ...context.componentLibrary,
    findComponentById(componentId) {
      if (componentId === "BAKERY_SIGN_BOARD_001") {
        return null;
      }

      return context.componentLibrary.findComponentById(componentId);
    }
  };

  const missingComponentResult =
    specificationPackModule.validateCoastalAustraliaAssetSpecificationPack(
      specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition,
      {
        ...context,
        componentLibrary: missingComponentLibrary
      }
    );

  const missingPlacementRuleRegistry = {
    ...context.placementRuleRegistry,
    findPlacementRuleById(placementRuleId) {
      if (placementRuleId === "PLACEMENT_BUILDING_PLOT_001") {
        return null;
      }

      return context.placementRuleRegistry.findPlacementRuleById(placementRuleId);
    }
  };

  const missingPlacementRuleResult =
    specificationPackModule.validateCoastalAustraliaAssetSpecificationPack(
      specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition,
      {
        ...context,
        placementRuleRegistry: missingPlacementRuleRegistry
      }
    );

  assert.equal(missingComponentResult.ok, false);
  assert.equal(missingComponentResult.errorCode, "missing_component_reference");
  assert.equal(missingPlacementRuleResult.ok, false);
  assert.equal(missingPlacementRuleResult.errorCode, "missing_placement_rule");
});

test("coastal australia specification pack remains data-driven and renderer-independent", () => {
  const context =
    specificationPackModule.buildCoastalAustraliaAssetSpecificationPackContext();
  const pack =
    specificationPackModule.createCoastalAustraliaAssetSpecificationPack(
      specificationPackModule.coastalAustraliaAssetSpecificationPackDefinition,
      context
    );

  assert.equal(Object.isFrozen(pack), true);
  assert.equal(
    pack.metadata.packRole,
    "coastal_australia_modular_specifications"
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.metadata, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(pack.assetSpecifications[0], "blenderFile"),
    false
  );
});
