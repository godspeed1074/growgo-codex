import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const regionPackageBuilderModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "region-package-builder.mjs")
);
const runtimeReaderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-runtime-reader.mjs"
  )
);
const atlasPresentationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-presentation-runtime.mjs"
  )
);
const classificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "growgo-object-classification.mjs"
  )
);
const spatialValidationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-world-object-validation.mjs"
  )
);

function createClassificationLayer() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  const runtimeReader =
    runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
  const atlasLayer = atlasPresentationModule.createAtlasPresentationRuntimeLayer(
    runtimeReader
  );
  return classificationModule.createGrowgoObjectClassificationLayer(atlasLayer);
}

function createSpatialValidation() {
  return spatialValidationModule.createAtlasWorldObjectSpatialValidation(
    createClassificationLayer()
  );
}

test("park boundary validation confirms area and valid polygon geometry", () => {
  const validation = createSpatialValidation();
  const park = validation.results.find((result) => result.growgoClassification === "PARK");

  assert.ok(park);
  assert.equal(park.geometryChecks.areaExists, true);
  assert.ok(park.geometryChecks.area > 0);
  assert.equal(park.relationshipChecks.insideCorrectArea, true);
});

test("business placement validation confirms proximity to supporting transport route", () => {
  const validation = createSpatialValidation();
  const business = validation.results.find((result) => result.realWorldType === "CAFE");

  assert.ok(business);
  assert.equal(business.relationshipChecks.supportingRoadRelationshipValid, true);
  assert.ok(business.relationshipChecks.distanceToNearestTransport <= 0.3);
});

test("landmark validation confirms coordinate validity and network reachability", () => {
  const validation = createSpatialValidation();
  const landmark = validation.results.find((result) => result.realWorldType === "LIGHTHOUSE");

  assert.ok(landmark);
  assert.equal(landmark.geometryChecks.coordinateValidity, true);
  assert.equal(landmark.relationshipChecks.reachableFromNetwork, true);
});

test("road relationship validation confirms connected transport geometry", () => {
  const validation = createSpatialValidation();
  const transport = validation.results.find(
    (result) => result.growgoClassification === "TRANSPORT"
  );

  assert.ok(transport);
  assert.equal(transport.geometryChecks.connectedGeometry, true);
  assert.equal(transport.geometryChecks.hierarchyValid, true);
  assert.equal(transport.relationshipChecks.nearbyObjectRelationshipValid, true);
});

test("same world object input produces deterministic spatial validation output", () => {
  const classificationLayer = createClassificationLayer();
  const first = spatialValidationModule.createAtlasWorldObjectSpatialValidation(
    classificationLayer
  );
  const second = spatialValidationModule.createAtlasWorldObjectSpatialValidation(
    classificationLayer
  );

  assert.deepEqual(first, second);
  assert.equal(first.summary.deterministicOutput, true);
});

test("explicit spatial validation contract passes", () => {
  const validation = createSpatialValidation();
  const checked =
    spatialValidationModule.validateAtlasWorldObjectSpatialValidation(validation);

  assert.equal(checked.ok, true);
  assert.ok(checked.atlasWorldObjectSpatialValidation.summary.totalObjects > 0);
});
