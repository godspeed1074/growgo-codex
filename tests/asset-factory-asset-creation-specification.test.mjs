import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const specificationModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-creation-specification.mjs")
);

test("specification creation builds first-pass residential specification", () => {
  const layer = specificationModule.createAssetCreationSpecificationLayer();
  const specification = layer.getSpecificationByAssetId("BUILDING_RESIDENTIAL_SUBURBAN_001");

  assert.ok(specification);
  assert.equal(specification.recipeId, "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001");
  assert.deepEqual(specification.variants, ["suburban", "coastal", "rural"]);
  assert.equal(specification.creationRequest.state, "APPROVED");
});

test("specification creation builds first-pass civic school specification from registered asset", () => {
  const layer = specificationModule.createAssetCreationSpecificationLayer();
  const specification = layer.getSpecificationByAssetId("BUILDING_CIVIC_SCHOOL_PRIMARY_001");

  assert.ok(specification);
  assert.equal(specification.specificationLabel, "BUILDING_CIVIC_SCHOOL_001");
  assert.ok(specification.specification.footprintCompatibility.includes("CAMPUS_FOOTPRINT"));
  assert.equal(specification.validation.assetRegistered, true);
});

test("missing asset handling rejects unknown specification targets", () => {
  assert.throws(
    () =>
      specificationModule.createAssetCreationSpecification({
        assetId: "MISSING_ASSET_001"
      }),
    /No first-pass specification definition exists/
  );
});

test("recipe validation keeps specification aligned with registered asset recipe", () => {
  const layer = specificationModule.createAssetCreationSpecificationLayer();
  const specification = layer.getSpecificationByAssetId("GROUND_BEACH_SAND_001");

  assert.equal(specification.recipeId, "BEACH_ENVIRONMENT_RECIPE_001");
  assert.equal(specification.validation.recipeExists, true);
  assert.ok(
    specification.specification.materialRules.includes("shared sand base material")
  );
});

test("same inputs produce deterministic same specification output", () => {
  const first = specificationModule.createAssetCreationSpecificationLayer();
  const second = specificationModule.createAssetCreationSpecificationLayer();

  assert.deepEqual(first.specifications, second.specifications);
  assert.equal(
    first.validation.deterministicSpecificationHash,
    second.validation.deterministicSpecificationHash
  );
});

test("explicit specification validation passes contract checks", () => {
  const layer = specificationModule.createAssetCreationSpecificationLayer();
  const specification = layer.getSpecificationByAssetId("TREE_EUCALYPTUS_001");
  const validation = specificationModule.validateAssetCreationSpecification(specification);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetCreationSpecification.validation.validationPassed, true);
});
