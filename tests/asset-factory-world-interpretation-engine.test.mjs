import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-interpretation-engine.mjs"
  )
);

function createDefinition(overrides = {}) {
  return {
    ...moduleUnderTest.worldInterpretationEngineDefinition,
    ...overrides,
    sourceDataReferences: {
      ...moduleUnderTest.worldInterpretationEngineDefinition.sourceDataReferences,
      ...(overrides.sourceDataReferences ?? {})
    }
  };
}

function clone(value) {
  return structuredClone(value);
}

test("coastal classification is deterministic and explainable", () => {
  const interpretation = moduleUnderTest.createWorldInterpretationLayer(
    moduleUnderTest.worldInterpretationEngineDefinition
  );

  assert.equal(interpretation.schemaId, "WORLD_INTERPRETATION_LAYER_001");
  assert.equal(interpretation.classificationResults.primaryWorldType, "COASTAL");
  assert.equal(
    interpretation.selectedEnvironmentProfile.profileId,
    "AUSTRALIAN_COASTAL_WORLD"
  );
  assert.ok(
    interpretation.classificationResults.reasons.includes("near coastline")
  );
  assert.ok(
    interpretation.classificationResults.sourceEvidence.some(
      (evidence) => evidence.classificationType === "COASTAL"
    )
  );
  assert.equal(interpretation.validationState.validationPassed, true);
});

test("rural classification resolves to outback interpretation", () => {
  const definition = clone(createDefinition());
  definition.sourceDataReferences.geographyInput.coastlineFeatures = [];
  definition.sourceDataReferences.geographyInput.elevationBands = [
    { sourceId: "ELEVATION_010", averageMeters: 120, maxMeters: 180 }
  ];
  definition.sourceDataReferences.roadNetworkInput.roadHierarchy = {
    roadDensity: 0.24,
    transportIntensity: 0.18,
    averageRoadDistanceKm: 12
  };
  definition.sourceDataReferences.roadNetworkInput.trailSegments = [];
  definition.sourceDataReferences.roadNetworkInput.pathSegments = [];
  definition.sourceDataReferences.settlementInput.settlementDensity = 0.22;
  definition.sourceDataReferences.settlementInput.cityRecords = [];
  definition.sourceDataReferences.settlementInput.townRecords = [
    { sourceId: "TOWN_010", name: "Rural Town" }
  ];
  definition.sourceDataReferences.settlementInput.suburbRecords = [];
  definition.sourceDataReferences.settlementInput.villageRecords = [
    { sourceId: "VILLAGE_010", name: "Village" }
  ];
  definition.sourceDataReferences.poiInput.landmarkRecords = [];
  definition.sourceDataReferences.poiInput.attractionRecords = [];
  definition.sourceDataReferences.poiInput.serviceRecords = [
    { sourceId: "SERVICE_010", poiType: "GENERAL_STORE" }
  ];
  definition.sourceDataReferences.poiInput.culturalLocationRecords = [];
  definition.sourceDataReferences.naturalFeatureInput.beachFeatures = [];

  const interpretation = moduleUnderTest.createWorldInterpretationLayer(definition);

  assert.equal(interpretation.classificationResults.primaryWorldType, "RURAL");
  assert.equal(
    interpretation.selectedEnvironmentProfile.profileId,
    "AUSTRALIAN_OUTBACK_WORLD"
  );
  assert.ok(
    interpretation.classificationResults.reasons.includes("small settlement pattern")
  );
});

test("mountain classification resolves to alpine interpretation", () => {
  const definition = clone(createDefinition());
  definition.sourceDataReferences.geographyInput.coastlineFeatures = [];
  definition.sourceDataReferences.geographyInput.elevationBands = [
    { sourceId: "ELEVATION_020", averageMeters: 1200, maxMeters: 1650 }
  ];
  definition.sourceDataReferences.naturalFeatureInput.forestFeatures = [
    { sourceId: "FOREST_020", featureType: "ALPINE_FOREST" }
  ];
  definition.sourceDataReferences.roadNetworkInput.trailSegments = [
    { sourceId: "TRAIL_020", trailType: "MOUNTAIN_WALK" }
  ];
  definition.sourceDataReferences.roadNetworkInput.pathSegments = [];
  definition.sourceDataReferences.roadNetworkInput.roadHierarchy = {
    roadDensity: 0.28,
    transportIntensity: 0.22,
    averageRoadDistanceKm: 16
  };
  definition.sourceDataReferences.settlementInput.settlementDensity = 0.18;
  definition.sourceDataReferences.naturalFeatureInput.beachFeatures = [];

  const interpretation = moduleUnderTest.createWorldInterpretationLayer(definition);

  assert.equal(interpretation.classificationResults.primaryWorldType, "MOUNTAIN");
  assert.equal(interpretation.selectedEnvironmentProfile.profileId, "ALPINE_WORLD");
  assert.ok(
    interpretation.classificationResults.reasons.includes("high elevation detected")
  );
});

test("tourism classification resolves to tourism archipelago interpretation", () => {
  const definition = clone(createDefinition());
  definition.sourceDataReferences.geographyInput.coastlineFeatures = [
    { sourceId: "COAST_030", distanceMeters: 700, featureType: "COASTLINE" }
  ];
  definition.sourceDataReferences.roadNetworkInput.roadHierarchy = {
    roadDensity: 0.48,
    transportIntensity: 0.55,
    averageRoadDistanceKm: 8
  };
  definition.sourceDataReferences.poiInput.landmarkRecords = [
    { sourceId: "LANDMARK_030", poiType: "LIGHTHOUSE" },
    { sourceId: "LANDMARK_031", poiType: "LOOKOUT" }
  ];
  definition.sourceDataReferences.poiInput.attractionRecords = [
    { sourceId: "ATTRACTION_030", poiType: "BEACH" },
    { sourceId: "ATTRACTION_031", poiType: "PIER" },
    { sourceId: "ATTRACTION_032", poiType: "ISLAND_TOUR" }
  ];
  definition.sourceDataReferences.poiInput.culturalLocationRecords = [
    { sourceId: "CULTURE_030", poiType: "MUSEUM" }
  ];
  definition.sourceDataReferences.naturalFeatureInput.beachFeatures = [
    { sourceId: "BEACH_030", featureType: "TOURIST_BEACH" }
  ];
  definition.sourceDataReferences.settlementInput.settlementDensity = 0.4;
  definition.sourceDataReferences.settlementInput.townRecords = [
    { sourceId: "TOWN_030", name: "Island Hub" }
  ];
  definition.sourceDataReferences.settlementInput.suburbRecords = [];

  const interpretation = moduleUnderTest.createWorldInterpretationLayer(definition);

  assert.equal(interpretation.classificationResults.primaryWorldType, "TOURISM");
  assert.equal(
    interpretation.selectedEnvironmentProfile.profileId,
    "TOURISM_ARCHIPELAGO_WORLD"
  );
  assert.ok(
    interpretation.classificationResults.reasons.includes("attraction density detected")
  );
});

test("urban classification resolves to metropolitan expansion interpretation", () => {
  const definition = clone(createDefinition());
  definition.sourceDataReferences.geographyInput.coastlineFeatures = [];
  definition.sourceDataReferences.geographyInput.elevationBands = [
    { sourceId: "ELEVATION_040", averageMeters: 55, maxMeters: 90 }
  ];
  definition.sourceDataReferences.roadNetworkInput.roadHierarchy = {
    roadDensity: 0.9,
    transportIntensity: 0.88,
    averageRoadDistanceKm: 4
  };
  definition.sourceDataReferences.settlementInput.cityRecords = [
    { sourceId: "CITY_040", name: "Metro" }
  ];
  definition.sourceDataReferences.settlementInput.townRecords = [];
  definition.sourceDataReferences.settlementInput.suburbRecords = [
    { sourceId: "SUBURB_040", name: "Inner" },
    { sourceId: "SUBURB_041", name: "Outer" }
  ];
  definition.sourceDataReferences.settlementInput.settlementDensity = 0.89;
  definition.sourceDataReferences.poiInput.landmarkRecords = [
    { sourceId: "LANDMARK_040", poiType: "TOWER" }
  ];
  definition.sourceDataReferences.poiInput.attractionRecords = [];
  definition.sourceDataReferences.naturalFeatureInput.beachFeatures = [];
  definition.sourceDataReferences.roadNetworkInput.trailSegments = [];
  definition.sourceDataReferences.roadNetworkInput.pathSegments = [];

  const interpretation = moduleUnderTest.createWorldInterpretationLayer(definition);

  assert.equal(interpretation.classificationResults.primaryWorldType, "URBAN");
  assert.equal(
    interpretation.selectedEnvironmentProfile.profileId,
    "METROPOLITAN_EXPANSION_WORLD"
  );
  assert.ok(
    interpretation.classificationResults.reasons.includes("high settlement density")
  );
});

test("same input produces deterministic same output", () => {
  const first = moduleUnderTest.createWorldInterpretationLayer(
    moduleUnderTest.worldInterpretationEngineDefinition
  );
  const second = moduleUnderTest.createWorldInterpretationLayer(
    moduleUnderTest.worldInterpretationEngineDefinition
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationState.deterministicOutputValid, true);
});

test("gameplay and Atlas rules preserve source traceability", () => {
  const interpretation = moduleUnderTest.createWorldInterpretationLayer(
    moduleUnderTest.worldInterpretationEngineDefinition
  );

  assert.ok(
    interpretation.gameplayWeighting.some(
      (rule) =>
        rule.interpretedGameplayType === "COASTAL_EXPLORATION_OPPORTUNITY" &&
        rule.sourceFeatureRefs.includes("BEACH_001")
    )
  );
  assert.ok(
    interpretation.gameplayWeighting.some(
      (rule) =>
        rule.interpretedGameplayType === "DISCOVERY_AND_QUEST_CANDIDATE" &&
        rule.sourceFeatureRefs.includes("LANDMARK_001")
    )
  );
  assert.ok(
    interpretation.atlasPresentationRules.some(
      (rule) =>
        rule.presentationCategory === "ROAD_PRESENTATION" &&
        rule.sourceFeatureRefs.includes("ROAD_001")
    )
  );
  assert.ok(
    interpretation.atlasPresentationRules.some(
      (rule) =>
        rule.presentationCategory === "WATERFRONT_PRESENTATION" &&
        rule.sourceFeatureRefs.includes("COAST_001")
    )
  );
  assert.equal(interpretation.validationState.gameplayTraceabilityValid, true);
  assert.equal(interpretation.validationState.presentationTraceabilityValid, true);
});
