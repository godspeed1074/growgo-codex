import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetProductionSpecificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-production-specification.mjs"
  )
);

test("batch conversion builds civic batch production specification", () => {
  const layer = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();

  assert.equal(layer.specification.batchId, "CIVIC_LOCATION_BATCH_001");
  assert.deepEqual(layer.specification.assetList, [
    "BUILDING_CIVIC_SPORTS_PAVILION_001",
    "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
    "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
    "PARK_TREATMENT_GREENERY_SET_001",
    "RESIDENTIAL_DETAIL_GARDEN_SET_001"
  ]);
  assert.equal(layer.specification.summary.foundationAssetCount, 2);
});

test("dependency ordering keeps foundation assets before supporting and detail assets", () => {
  const layer = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();

  assert.deepEqual(layer.specification.creationOrder, {
    FOUNDATION_ASSETS: [
      "BUILDING_CIVIC_SPORTS_PAVILION_001",
      "BUILDING_CIVIC_SCHOOL_PRIMARY_001"
    ],
    SUPPORTING_ASSETS: [
      "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
      "PARK_TREATMENT_GREENERY_SET_001"
    ],
    DETAIL_ASSETS: ["RESIDENTIAL_DETAIL_GARDEN_SET_001"]
  });

  const detailSpec = layer.getAssetSpecification("RESIDENTIAL_DETAIL_GARDEN_SET_001");
  assert.deepEqual(detailSpec.dependencyTargets, [
    "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
    "PARK_TREATMENT_GREENERY_SET_001"
  ]);
});

test("specification completeness preserves recipe, variants, lods, and budgets", () => {
  const layer = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();
  const schoolSpec = layer.getAssetSpecification("BUILDING_CIVIC_SCHOOL_PRIMARY_001");
  const pavilionSpec = layer.getAssetSpecification("BUILDING_CIVIC_SPORTS_PAVILION_001");

  assert.equal(schoolSpec.specificationLabel, "BUILDING_CIVIC_SCHOOL_001");
  assert.equal(schoolSpec.recipeId, "SCHOOL_RECIPE_001");
  assert.deepEqual(schoolSpec.variants, [
    "primary_school",
    "secondary_school",
    "small_rural_school"
  ]);
  assert.equal(pavilionSpec.performanceBudget.materialBudget, "shared_civic_material");
  assert.ok(
    pavilionSpec.specification.civicUsage.includes("sports-ground anchor")
  );
});

test("tampered creation ordering fails validation", () => {
  const layer = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();
  const tampered = structuredClone(layer.specification);

  tampered.assetSpecifications[4].creationOrder = 10;

  const validation =
    assetProductionSpecificationModule.validateAssetProductionSpecification(tampered);

  assert.equal(validation.ok, false);
  assert.match(validation.message, /deterministicOrdering/i);
});

test("same inputs produce deterministic same production specification", () => {
  const first = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();
  const second = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();

  assert.deepEqual(first.specification, second.specification);
  assert.equal(
    first.validation.deterministicSpecificationHash,
    second.validation.deterministicSpecificationHash
  );
});

test("explicit production specification validation passes contract checks", () => {
  const layer = assetProductionSpecificationModule.createAssetProductionSpecificationLayer();
  const validation =
    assetProductionSpecificationModule.validateAssetProductionSpecification(
      layer.specification
    );

  assert.equal(validation.ok, true);
  assert.equal(validation.assetProductionSpecification.validation.assetsExist, true);
  assert.equal(validation.assetProductionSpecification.validation.batchValid, true);
  assert.equal(validation.assetProductionSpecification.validation.dependenciesValid, true);
  assert.equal(
    validation.assetProductionSpecification.validation.specificationsComplete,
    true
  );
});
