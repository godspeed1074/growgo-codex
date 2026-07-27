import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const coverageModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-object-coverage-test.mjs"
  )
);

function createCoveragePresentationObjects() {
  return {
    schemaId: "RUNTIME_ATLAS_PRESENTATION_OBJECTS_001",
    roadPresentations: [
      road("ROAD_MAIN_001", "ROAD", [[145.0, -38.0], [145.2, -38.0]]),
      road("TRANSPORT_ROUTE_001", "TRANSPORT_ROUTE", [[145.0, -38.01], [145.2, -38.01]])
    ],
    buildingPresentations: [
      building("LIBRARY_001", "LIBRARY", polygon(145.01, -38.005)),
      building("SCHOOL_001", "SCHOOL", polygon(145.02, -38.005)),
      building("COMMUNITY_001", "COMMUNITY_BUILDING", polygon(145.03, -38.005)),
      building("BAKERY_001", "BAKERY", polygon(145.04, -38.005)),
      building("CAFE_001", "CAFE", polygon(145.05, -38.005)),
      building("PETROL_001", "PETROL_STATION", polygon(145.06, -38.005)),
      building("SHOP_001", "SHOP", polygon(145.07, -38.005)),
      building("WAREHOUSE_001", "WAREHOUSE", polygon(145.08, -38.005)),
      building("INDUSTRIAL_001", "INDUSTRIAL_BUILDING", polygon(145.09, -38.005)),
      building("RAILWAY_001", "RAILWAY_STATION", polygon(145.10, -38.005)),
      building("FERRY_001", "FERRY_TERMINAL", polygon(145.11, -38.005)),
      building("BUSSTOP_001", "BUS_STOP", polygon(145.12, -38.005))
    ],
    parkPresentations: [
      park("BEACH_001", "BEACH", polygon(145.01, -38.02)),
      park("RESERVE_001", "RESERVE", polygon(145.03, -38.02)),
      park("FOREST_001", "FOREST", polygon(145.05, -38.02)),
      park("OVAL_001", "OVAL", polygon(145.07, -38.02)),
      park("RECREATION_001", "RECREATION_AREA", polygon(145.09, -38.02))
    ],
    poiPresentations: []
  };
}

function road(id, roadType, geometryReference) {
  return {
    presentationId: id,
    presentationType: "ROAD_PRESENTATION",
    roadType,
    assetReference: "ATLAS_ROAD_STANDARD_001",
    geometryReference,
    sourceReference: {
      sourceFeatureId: id.toLowerCase(),
      provider: "fixture-provider"
    },
    presentationRule: "ATLAS_RULE_ROAD_001",
    styleProfile: "GROWGO_PAPERCUT_2_5D",
    geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
  };
}

function building(id, buildingType, footprintReference) {
  return {
    presentationId: id,
    presentationType: "BUILDING_PRESENTATION",
    buildingType,
    assetRecipe: `RECIPE_BUILDING_${buildingType}_PRESENTATION_001`,
    footprintReference,
    sourceReference: {
      sourceFeatureId: id.toLowerCase(),
      provider: "fixture-provider"
    },
    interpretationMetadata: {
      classificationResult: "MIXED",
      matchedGameplayRules: ["COVERAGE_TEST"]
    },
    presentationRule: "ATLAS_RULE_BUILDING_001",
    styleProfile: "GROWGO_PAPERCUT_2_5D",
    geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
  };
}

function park(id, naturalFeatureType, realBoundary) {
  return {
    presentationId: id,
    presentationType: "NATURAL_FEATURE_PRESENTATION",
    naturalFeatureType,
    realBoundary,
    treatmentStyle: "GROWGO_PARK_TREATMENT_STANDARD_001",
    sourceReference: {
      sourceFeatureId: id.toLowerCase(),
      provider: "fixture-provider"
    },
    gameplayCompatibilityTags: ["exploration", "coverage_test"],
    presentationRule: "ATLAS_RULE_GREEN_SPACE_001",
    styleProfile: "GROWGO_PAPERCUT_2_5D",
    geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
  };
}

function polygon(x, y) {
  return [
    [x, y],
    [x + 0.005, y],
    [x + 0.005, y - 0.005],
    [x, y - 0.005]
  ];
}

function createCoverageLayer() {
  return coverageModule.createAtlasObjectCoverageTestLayer(
    createCoveragePresentationObjects(),
    {
      biomeMetadataByObjectId: {
        OVAL_001_OBJECT: ["SUBURBAN_PARKLAND"],
        RECREATION_001_OBJECT: ["SUBURBAN_PARKLAND"],
        BEACH_001_OBJECT: ["COASTAL", "BEACH_EDGE"],
        RESERVE_001_OBJECT: ["COASTAL", "FORESHORE_PARKLAND"],
        FOREST_001_OBJECT: ["FOREST_EDGE", "TEMPERATE_FOREST_EDGE"]
      },
      environmentClassificationByObjectId: {
        OVAL_001_OBJECT: "SUBURBAN_GARDEN",
        RECREATION_001_OBJECT: "SUBURBAN_GARDEN",
        BEACH_001_OBJECT: "BEACH",
        RESERVE_001_OBJECT: "COASTAL_PARK",
        FOREST_001_OBJECT: "FOREST"
      }
    }
  );
}

test("civic objects are classified and assigned compatible recipes", () => {
  const layer = createCoverageLayer();
  const school = layer.results.entries.find((entry) => entry.objectType === "SCHOOL");
  const library = layer.results.entries.find((entry) => entry.objectType === "LIBRARY");
  const community = layer.results.entries.find(
    (entry) => entry.objectType === "COMMUNITY_BUILDING"
  );

  assert.equal(school.classificationResult, "BUSINESS");
  assert.ok(school.assetRecipe.includes("SCHOOL"));
  assert.equal(library.classificationResult, "BUSINESS");
  assert.ok(library.assetRecipe.includes("LIBRARY"));
  assert.equal(community.classificationResult, "BUSINESS");
  assert.ok(community.assetRecipe.includes("COMMUNITY"));
});

test("transport objects are classified and assigned transport recipes", () => {
  const layer = createCoverageLayer();
  const railway = layer.results.entries.find(
    (entry) => entry.objectType === "RAILWAY_STATION"
  );
  const ferry = layer.results.entries.find(
    (entry) => entry.objectType === "FERRY_TERMINAL"
  );
  const busStop = layer.results.entries.find((entry) => entry.objectType === "BUS_STOP");

  assert.equal(railway.classificationResult, "TRANSPORT");
  assert.ok(railway.assetRecipe.includes("RAILWAY_STATION"));
  assert.equal(ferry.classificationResult, "TRANSPORT");
  assert.ok(ferry.assetRecipe.includes("FERRY_TERMINAL"));
  assert.equal(busStop.classificationResult, "TRANSPORT");
  assert.ok(busStop.assetRecipe.includes("BUS_STOP"));
});

test("natural and sports objects remain preview compatible", () => {
  const layer = createCoverageLayer();
  const beach = layer.results.entries.find((entry) => entry.objectType === "BEACH");
  const reserve = layer.results.entries.find((entry) => entry.objectType === "RESERVE");
  const forest = layer.results.entries.find((entry) => entry.objectType === "FOREST");
  const oval = layer.results.entries.find((entry) => entry.objectType === "OVAL");

  assert.equal(beach.classificationResult, "NATURAL_FEATURE");
  assert.equal(reserve.classificationResult, "PARK");
  assert.equal(forest.classificationResult, "NATURAL_FEATURE");
  assert.equal(oval.classificationResult, "PARK");
  assert.equal(beach.previewCompatibility, true);
  assert.equal(oval.previewCompatibility, true);
});

test("commercial and industrial objects receive compatible recipes", () => {
  const layer = createCoverageLayer();
  const bakery = layer.results.entries.find((entry) => entry.objectType === "BAKERY");
  const petrol = layer.results.entries.find(
    (entry) => entry.objectType === "PETROL_STATION"
  );
  const warehouse = layer.results.entries.find((entry) => entry.objectType === "WAREHOUSE");
  const industrial = layer.results.entries.find(
    (entry) => entry.objectType === "INDUSTRIAL_BUILDING"
  );

  assert.ok(bakery.assetRecipe.includes("BAKERY"));
  assert.ok(petrol.assetRecipe.includes("FUEL_STATION"));
  assert.ok(warehouse.assetRecipe.includes("WAREHOUSE"));
  assert.ok(industrial.assetRecipe.includes("INDUSTRIAL"));
});

test("same coverage input produces deterministic same output", () => {
  const first = createCoverageLayer();
  const second = createCoverageLayer();

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("explicit coverage validation passes contract checks", () => {
  const layer = createCoverageLayer();
  const validation = coverageModule.validateAtlasObjectCoverageTestLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(validation.atlasObjectCoverageTestLayer.validation.classificationValid, true);
  assert.equal(validation.atlasObjectCoverageTestLayer.validation.provenancePreserved, true);
  assert.equal(validation.atlasObjectCoverageTestLayer.validation.geometryPreserved, true);
  assert.equal(validation.atlasObjectCoverageTestLayer.validation.recipeCompatible, true);
});
