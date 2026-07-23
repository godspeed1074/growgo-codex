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

const validationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-asset-to-custom-25d-passive-renderer-validation.mjs"
  )
);

test("real asset to Custom 2.5D passive renderer validation accepts BUILDING_HOUSE_SMALL_COASTAL_001", () => {
  const context =
    validationModule.buildRealAssetToCustom25DPassiveRendererValidationContext();
  const result = validationModule.validateRealAssetToCustom25DPassiveRenderer(
    validationModule.realAssetToCustom25DPassiveRendererValidationDefinition,
    context
  );

  assert.equal(result.ok, true);
  assert.equal(
    result.custom25DValidation.rendererFacingOutput.rendererAssetReference.assetId,
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  assert.equal(
    result.custom25DValidation.rendererFacingOutput.rendererAssetReference.recipeId,
    "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001"
  );
  assert.equal(
    result.custom25DValidation.rendererFacingOutput.metadata.adapterProfile,
    "custom-2.5d-passive"
  );
  assert.equal(result.custom25DValidation.compatibility.lodMetadataVerified, true);
  assert.equal(
    result.custom25DValidation.compatibility.mobilePerformanceMetadataVerified,
    true
  );
});

test("real asset to Custom 2.5D passive renderer validation is deterministic for the same asset, location, and seed", () => {
  const context =
    validationModule.buildRealAssetToCustom25DPassiveRendererValidationContext();
  const first = validationModule.validateRealAssetToCustom25DPassiveRenderer(
    validationModule.realAssetToCustom25DPassiveRendererValidationDefinition,
    context
  );
  const second = validationModule.validateRealAssetToCustom25DPassiveRenderer(
    validationModule.realAssetToCustom25DPassiveRendererValidationDefinition,
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.custom25DValidation.rendererFacingOutput,
    second.custom25DValidation.rendererFacingOutput
  );
});

test("real asset to Custom 2.5D passive renderer validation reports safe failures for invalid metadata and remains passive", () => {
  const context =
    validationModule.buildRealAssetToCustom25DPassiveRendererValidationContext();
  const pipelineResult = pipelineModule.validateRealAssetSpecificationPipeline(
    pipelineModule.realAssetSpecificationPipelineValidationDefinition,
    context
  );

  assert.equal(pipelineResult.ok, true);

  assert.throws(
    () =>
      validationModule.validateCustom25DPassiveRendererCompatibility({
        ...pipelineResult.pipelineResult,
        specification: {
          ...pipelineResult.pipelineResult.specification,
          lodRequirements: {
            profile: "",
            lodLevels: []
          }
        }
      }),
    (error) => error?.code === "invalid_lod_metadata"
  );

  assert.throws(
    () =>
      validationModule.validateCustom25DPassiveRendererCompatibility({
        ...pipelineResult.pipelineResult,
        specification: {
          ...pipelineResult.pipelineResult.specification,
          mobilePerformanceRequirements: {
            storageBudget: "",
            ramBudget: "low",
            gpuBudget: "low",
            batchingFriendly: true
          }
        }
      }),
    (error) => error?.code === "invalid_mobile_performance_metadata"
  );

  const success = validationModule.validateRealAssetToCustom25DPassiveRenderer(
    validationModule.realAssetToCustom25DPassiveRendererValidationDefinition,
    context
  );

  assert.equal(success.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      success.custom25DValidation.rendererFacingOutput,
      "canvas"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      success.custom25DValidation.rendererFacingOutput.rendererAssetReference,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.custom25DValidation, "runtimeRenderer"),
    false
  );
});
