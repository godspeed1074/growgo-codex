import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const regionPackageBuilderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-builder.mjs"
  )
);
const regionPackageTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-region-package-test.mjs"
  )
);

function createRegionImportPackage() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  return regionPackageBuilderModule.createGrowgoRegionImportPackage(
    sourceAdapterLayer
  );
}

test("package loading consumes prepared region package and exposes package identity", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );

  assert.equal(result.schemaId, "ATLAS_REGION_PACKAGE_TEST_RESULT_001");
  assert.equal(result.packageIdentity.regionId, "fixture-coastal-region");
  assert.equal(result.packageIdentity.classificationResult, "COASTAL");
  assert.equal(result.validation.validationPassedOverall, true);
});

test("object extraction flows from runtime package into classified world objects", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );

  assert.equal(result.objectCount.runtimeRoadObjects, 5);
  assert.equal(result.objectCount.runtimePoiObjects, 4);
  assert.equal(result.objectCount.runtimeNaturalFeatureObjects, 4);
  assert.ok(result.objectCount.totalWorldObjects > 0);
});

test("classification flow records valid world object categories", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );

  assert.equal(result.classifications.byClassification.BUSINESS, 1);
  assert.equal(result.classifications.byClassification.LANDMARK, 3);
  assert.equal(result.classifications.byClassification.NATURAL_FEATURE, 2);
  assert.equal(result.classifications.byClassification.PARK, 2);
  assert.equal(result.classifications.byClassification.TRANSPORT, 1);
});

test("asset assignment records valid recipe mapping for consumed package objects", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );

  assert.equal(result.assetAssignments.assignmentCount, result.objectCount.totalWorldObjects);
  assert.ok(
    result.assetAssignments.byRecipe.RECIPE_LANDMARK_LIGHTHOUSE_001 >= 1
  );
  assert.ok(
    result.assetAssignments.byRecipe.RECIPE_BUILDING_CAFE_COASTAL_001 >= 1
  );
});

test("scene composition produces non-empty real-world style scene summaries", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );

  assert.equal(result.sceneSummary.sceneCount, 2);
  assert.deepEqual(
    result.sceneSummary.sceneEntries.map((entry) => entry.sceneType),
    [
      "COASTAL_STREET_SCENE",
      "TOWN_MAIN_STREET_SCENE"
    ]
  );
});

test("same region package produces deterministic same atlas consumption result", () => {
  const regionImportPackage = createRegionImportPackage();

  const first = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    regionImportPackage
  );
  const second = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    regionImportPackage
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("explicit region package test validation passes contract checks", () => {
  const result = regionPackageTestModule.createAtlasRegionPackageConsumptionTest(
    createRegionImportPackage()
  );
  const validation =
    regionPackageTestModule.validateAtlasRegionPackageConsumptionTest(result);

  assert.equal(validation.ok, true);
  assert.equal(validation.atlasRegionPackageTestResult.validation.provenancePreserved, true);
  assert.equal(validation.atlasRegionPackageTestResult.validation.geometryPreserved, true);
  assert.equal(
    validation.atlasRegionPackageTestResult.validation.objectClassificationsValid,
    true
  );
  assert.equal(validation.atlasRegionPackageTestResult.validation.assetAssignmentsValid, true);
  assert.equal(validation.atlasRegionPackageTestResult.validation.sceneCompositionValid, true);
});
