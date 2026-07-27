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
const atlasPresentationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-presentation-runtime.mjs"
  )
);

function createAtlasLayer() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  const runtimeReader =
    runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
  return atlasPresentationModule.createAtlasPresentationRuntimeLayer(runtimeReader);
}

test("atlas presentation runtime creates validated presentation layer", () => {
  const layer = createAtlasLayer();

  assert.equal(layer.schemaId, "ATLAS_PRESENTATION_RUNTIME_LAYER_001");
  assert.equal(
    layer.presentationObjects.schemaId,
    "RUNTIME_ATLAS_PRESENTATION_OBJECTS_001"
  );
  assert.equal(layer.validation.validationPassed, true);
});

test("road presentation preserves source geometry and maps Atlas road asset", () => {
  const layer = createAtlasLayer();
  const road = layer.presentationObjects.roadPresentations.find(
    (presentation) => presentation.roadType === "ROAD"
  );

  assert.ok(road);
  assert.equal(road.assetReference, "ATLAS_ROAD_STANDARD_001");
  assert.equal(road.geometryReference.type, "LineString");
  assert.equal(road.geometryPreservationMode, "SOURCE_GEOMETRY_PRESERVED");
});

test("park presentation preserves real boundary and applies GrowGo treatment style", () => {
  const layer = createAtlasLayer();
  const park = layer.presentationObjects.parkPresentations.find(
    (presentation) => presentation.naturalFeatureType === "PARK"
  );

  assert.ok(park);
  assert.equal(park.treatmentStyle, "GROWGO_PARK_TREATMENT_STANDARD_001");
  assert.ok(Array.isArray(park.realBoundary));
  assert.equal(park.presentationRule, "ATLAS_RULE_GREEN_SPACE_001");
});

test("business presentation preserves type and maps asset recipe", () => {
  const layer = createAtlasLayer();
  const building = layer.presentationObjects.buildingPresentations.find(
    (presentation) => presentation.buildingType === "CAFE"
  );

  assert.ok(building);
  assert.equal(
    building.assetRecipe,
    "RECIPE_BUILDING_SERVICE_CAFE_PRESENTATION_001"
  );
  assert.deepEqual(building.footprintReference, [145.09, -38.32]);
});

test("landmark presentation maps POI rules deterministically", () => {
  const layer = createAtlasLayer();
  const landmark = layer.presentationObjects.poiPresentations.find(
    (presentation) => presentation.poiType === "LANDMARK"
  );

  assert.ok(landmark);
  assert.equal(landmark.presentationRule, "ATLAS_RULE_LANDMARK_001");
  assert.equal(landmark.visualTreatment, "LANDMARK_FOCAL_PRESENTATION");
});

test("same runtime reader produces deterministic same atlas presentation output", () => {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  const runtimeReader =
    runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);

  const first = atlasPresentationModule.createAtlasPresentationRuntimeLayer(runtimeReader);
  const second = atlasPresentationModule.createAtlasPresentationRuntimeLayer(runtimeReader);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("explicit atlas presentation validation passes contract checks", () => {
  const layer = createAtlasLayer();
  const validation =
    atlasPresentationModule.validateAtlasPresentationRuntimeLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.atlasPresentationRuntimeLayer.validation.sourceGeometryPreserved,
    true
  );
  assert.equal(
    validation.atlasPresentationRuntimeLayer.validation.assetReferencesValid,
    true
  );
  assert.equal(
    validation.atlasPresentationRuntimeLayer.validation.provenanceMaintained,
    true
  );
});
