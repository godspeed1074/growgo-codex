import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const pipelineModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-asset-specification-pipeline-validation.mjs"
  )
);

test("real asset specification pipeline validates the full passive chain for BUILDING_HOUSE_SMALL_COASTAL_001", () => {
  const context = pipelineModule.buildRealAssetSpecificationPipelineValidationContext();
  const result = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.pipelineResult.specification.assetId, "BUILDING_HOUSE_SMALL_COASTAL_001");
  assert.equal(result.pipelineResult.manifest.assetId, "BUILDING_HOUSE_SMALL_COASTAL_001");
  assert.equal(
    result.pipelineResult.recipe.recipeId,
    "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001"
  );
  assert.equal(
    result.pipelineResult.rendererPayload.rendererAssetReference.assetId,
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
});

test("real asset specification pipeline is deterministic for the same asset, location, and seed", () => {
  const context = pipelineModule.buildRealAssetSpecificationPipelineValidationContext();
  const first = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    context
  );
  const second = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.pipelineResult.rendererPayload, second.pipelineResult.rendererPayload);
});

test("real asset specification pipeline fails safely for missing specification, missing components, and missing manifests", () => {
  const context = pipelineModule.buildRealAssetSpecificationPipelineValidationContext();

  const missingSpecification = pipelineModule.validateRealAssetSpecificationPipeline(
    {
      ...pipelineModule.realAssetSpecificationPipelineValidationDefinition,
      assetId: "BUILDING_HOUSE_UNKNOWN_001"
    },
    context
  );

  const missingComponentLibrary = {
    ...context,
    componentLibrary: {
      ...context.componentLibrary,
      findComponentById(componentId) {
        if (componentId === "COASTAL_HOUSE_WINDOW_SHUTTER_001") {
          return null;
        }

        return context.componentLibrary.findComponentById(componentId);
      }
    }
  };

  const missingComponent = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    missingComponentLibrary
  );

  const missingManifestRegistry = {
    ...context,
    manifestRegistry: {
      ...context.manifestRegistry,
      findManifestByAssetId(assetId) {
        if (assetId === "BUILDING_HOUSE_SMALL_COASTAL_001") {
          return null;
        }

        return context.manifestRegistry.findManifestByAssetId(assetId);
      }
    }
  };

  const missingManifest = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    missingManifestRegistry
  );

  assert.equal(missingSpecification.ok, false);
  assert.equal(missingSpecification.errorCode, "missing_asset_specification");
  assert.equal(missingComponent.ok, false);
  assert.equal(missingComponent.errorCode, "missing_component_reference");
  assert.equal(missingManifest.ok, false);
  assert.equal(missingManifest.errorCode, "missing_manifest_reference");
});

test("real asset specification pipeline remains passive and non-rendering", () => {
  const context = pipelineModule.buildRealAssetSpecificationPipelineValidationContext();
  const result = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.pipelineResult.rendererPayload, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.pipelineResult.rendererPayload.rendererAssetReference,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.pipelineResult, "runtimeRenderer"),
    false
  );
});
