import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "lightweight-asset-build-specification.mjs"
  )
);

test("lightweight asset build specification validates the first real coastal house build profile", () => {
  const context = moduleUnderTest.buildLightweightAssetBuildSpecificationContext();
  const result = moduleUnderTest.validateLightweightAssetBuildSpecification(
    moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
    { validationContext: context }
  );

  assert.equal(result.ok, true);
  assert.equal(
    result.buildSpecification.specification.assetId,
    "BUILDING_HOUSE_SMALL_COASTAL_001"
  );
  assert.equal(
    result.buildSpecification.specification.recipeId,
    "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001"
  );
  assert.equal(result.buildSpecification.specification.componentMapping.length, 4);
  assert.equal(
    result.buildSpecification.compatibility.rendererCompatibilityVerified,
    true
  );
});

test("lightweight asset build specification remains deterministic for the same asset pipeline inputs", () => {
  const context = moduleUnderTest.buildLightweightAssetBuildSpecificationContext();
  const first = moduleUnderTest.validateLightweightAssetBuildSpecification(
    moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
    { validationContext: context }
  );
  const second = moduleUnderTest.validateLightweightAssetBuildSpecification(
    moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
    { validationContext: context }
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.buildSpecification.rendererValidation.rendererFacingOutput,
    second.buildSpecification.rendererValidation.rendererFacingOutput
  );
});

test("lightweight asset build specification fails safely for missing component mappings and invalid polygon budget ordering", () => {
  const context = moduleUnderTest.buildLightweightAssetBuildSpecificationContext();

  const missingComponentMapping =
    moduleUnderTest.validateLightweightAssetBuildSpecification(
      {
        ...moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
        componentMapping:
          moduleUnderTest.lightweightAssetBuildSpecificationDefinition.componentMapping.slice(
            0,
            3
          )
      },
      { validationContext: context }
    );

  const invalidPolygonBudgetOrder =
    moduleUnderTest.validateLightweightAssetBuildSpecification(
      {
        ...moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
        geometrySpecification: {
          ...moduleUnderTest.lightweightAssetBuildSpecificationDefinition.geometrySpecification,
          polygonBudgets: {
            close: 120,
            gameplay: 180,
            map: 72,
            distantSilhouette: 24
          }
        }
      },
      { validationContext: context }
    );

  assert.equal(missingComponentMapping.ok, false);
  assert.equal(missingComponentMapping.errorCode, "component_mapping_incomplete");
  assert.equal(invalidPolygonBudgetOrder.ok, false);
  assert.equal(invalidPolygonBudgetOrder.errorCode, "invalid_polygon_budget_order");
});

test("lightweight asset build specification fails safely for renderer profile mismatch and remains passive", () => {
  const context = moduleUnderTest.buildLightweightAssetBuildSpecificationContext();

  const rendererProfileMismatch =
    moduleUnderTest.validateLightweightAssetBuildSpecification(
      moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
      {
        validationContext: context,
        validateCustom25DPassiveRenderer() {
          return {
            ok: true,
            custom25DValidation: {
              recipe: {
                recipeId: "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001"
              },
              compatibility: {
                rendererProfile: "custom-3d-live",
                passiveConsumerCompatibilityVerified: true
              },
              rendererFacingOutput: {
                rendererAssetReference: {
                  assetId: "BUILDING_HOUSE_SMALL_COASTAL_001"
                }
              }
            }
          };
        }
      }
    );

  const success = moduleUnderTest.validateLightweightAssetBuildSpecification(
    moduleUnderTest.lightweightAssetBuildSpecificationDefinition,
    { validationContext: context }
  );

  assert.equal(rendererProfileMismatch.ok, false);
  assert.equal(rendererProfileMismatch.errorCode, "renderer_profile_mismatch");
  assert.equal(success.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.buildSpecification, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      success.buildSpecification.rendererValidation.rendererFacingOutput,
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.buildSpecification, "runtimeRenderer"),
    false
  );
});
