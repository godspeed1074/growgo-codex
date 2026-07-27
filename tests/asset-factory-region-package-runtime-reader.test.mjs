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
const runtimeReaderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-runtime-reader.mjs"
  )
);

function createRuntimeReader() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  return runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
}

test("runtime reader loads validated region package and exposes runtime collections", () => {
  const reader = createRuntimeReader();

  assert.equal(reader.schemaId, "REGION_PACKAGE_RUNTIME_READER_001");
  assert.equal(reader.validation.validationPassed, true);
  assert.equal(
    reader.runtimeCollections.runtimeRoadObjects.schemaId,
    "RUNTIME_ROAD_OBJECTS_001"
  );
});

test("runtime reader extracts road objects with provenance and deterministic tags", () => {
  const reader = createRuntimeReader();
  const road = reader.runtimeCollections.runtimeRoadObjects.objects.find(
    (object) => object.objectType === "ROAD"
  );

  assert.ok(road);
  assert.equal(road.sourceReference.provider, "fixture-provider");
  assert.ok(road.gameplayCompatibilityTags.includes("transport"));
  assert.ok(road.geometry.type === "LineString");
});

test("runtime reader extracts park objects with exploration-friendly tags", () => {
  const reader = createRuntimeReader();
  const park = reader.runtimeCollections.runtimeNaturalFeatureObjects.objects.find(
    (object) => object.objectType === "PARK"
  );

  assert.ok(park);
  assert.ok(park.gameplayCompatibilityTags.includes("nature"));
  assert.ok(park.gameplayCompatibilityTags.includes("exploration"));
  assert.ok(park.gameplayCompatibilityTags.includes("quest_candidate"));
});

test("runtime reader extracts business objects from service POIs", () => {
  const reader = createRuntimeReader();
  const business = reader.runtimeCollections.runtimePoiObjects.objects.find(
    (object) => object.objectType === "SERVICE"
  );

  assert.ok(business);
  assert.ok(business.gameplayCompatibilityTags.includes("business"));
  assert.ok(business.gameplayCompatibilityTags.includes("service"));
  assert.ok(business.gameplayCompatibilityTags.includes("cafe"));
});

test("runtime reader extracts landmark objects with interpretation traceability", () => {
  const reader = createRuntimeReader();
  const landmark = reader.runtimeCollections.runtimePoiObjects.objects.find(
    (object) => object.objectType === "LANDMARK"
  );

  assert.ok(landmark);
  assert.equal(
    landmark.interpretationMetadata.classificationResult,
    "COASTAL"
  );
  assert.ok(
    landmark.interpretationMetadata.matchedGameplayRules.includes(
      "DISCOVERY_AND_QUEST_CANDIDATE"
    )
  );
});

test("runtime reader preserves provenance on building reference objects", () => {
  const reader = createRuntimeReader();
  const buildingReference =
    reader.runtimeCollections.runtimeBuildingReferenceObjects.objects.find(
      (object) => object.objectType === "CAFE"
    );

  assert.ok(buildingReference);
  assert.equal(buildingReference.sourceReference.sourceFeatureId, "poi_coast_003");
  assert.equal(buildingReference.sourceReference.provider, "fixture-provider");
  assert.ok(
    buildingReference.gameplayCompatibilityTags.includes("building_reference")
  );
});

test("same import package produces deterministic same runtime reader output", () => {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);

  const first = runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
  const second = runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicReading, true);
});

test("explicit runtime reader validation passes contract checks", () => {
  const reader = createRuntimeReader();
  const validation = runtimeReaderModule.validateRegionPackageRuntimeReader(reader);

  assert.equal(validation.ok, true);
  assert.equal(validation.runtimeReader.validation.packageVersionValid, true);
  assert.equal(validation.runtimeReader.validation.provenancePreserved, true);
  assert.equal(validation.runtimeReader.validation.interpretationMetadataAvailable, true);
});
