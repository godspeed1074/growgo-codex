import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const runtimeValidationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-runtime-scene-validation.mjs"
  )
);
const handoffModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-renderer-handoff.mjs"
  )
);
const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-street-scene-composition.mjs"
  )
);
const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-environment-preview.mjs"
  )
);
const natureResolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "nature-environment-recipe-resolver.mjs"
  )
);

function createDirectWorldObjects() {
  return {
    schemaId: "GROWGO_WORLD_OBJECTS_001",
    objects: [
      {
        objectId: "PARK_COASTAL_001",
        sourceReference: { sourceFeatureId: "park_001", provider: "fixture-provider" },
        realWorldType: "PARK",
        growgoClassification: "PARK",
        geometryReference: [
          [145.10, -38.31],
          [145.11, -38.31],
          [145.11, -38.32],
          [145.10, -38.32]
        ],
        presentationReference: "PARK_COASTAL_001_PRESENTATION",
        gameplayTags: ["exploration", "nature"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "GREENSPACE_SUBURBAN_001",
        sourceReference: { sourceFeatureId: "greenspace_001", provider: "fixture-provider" },
        realWorldType: "PARK",
        growgoClassification: "PARK",
        geometryReference: [
          [145.20, -38.40],
          [145.21, -38.40],
          [145.21, -38.41],
          [145.20, -38.41]
        ],
        presentationReference: "GREENSPACE_SUBURBAN_001_PRESENTATION",
        gameplayTags: ["exploration", "nature"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "BEACH_EDGE_001",
        sourceReference: { sourceFeatureId: "beach_001", provider: "fixture-provider" },
        realWorldType: "BEACH",
        growgoClassification: "NATURAL_FEATURE",
        geometryReference: [
          [145.30, -38.50],
          [145.32, -38.50],
          [145.32, -38.51],
          [145.30, -38.51]
        ],
        presentationReference: "BEACH_EDGE_001_PRESENTATION",
        gameplayTags: ["exploration", "nature", "coastal"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "HOUSE_RESIDENTIAL_001",
        sourceReference: { sourceFeatureId: "house_001", provider: "fixture-provider" },
        realWorldType: "HOUSE",
        growgoClassification: "RESIDENTIAL",
        geometryReference: [
          [145.40, -38.60],
          [145.405, -38.60],
          [145.405, -38.605],
          [145.40, -38.605]
        ],
        presentationReference: "HOUSE_RESIDENTIAL_001_PRESENTATION",
        gameplayTags: ["residential", "neighbourhood"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "BAKERY_COMMERCIAL_001",
        sourceReference: { sourceFeatureId: "bakery_001", provider: "fixture-provider" },
        realWorldType: "BAKERY",
        growgoClassification: "BUSINESS",
        geometryReference: [
          [145.50, -38.70],
          [145.505, -38.70],
          [145.505, -38.705],
          [145.50, -38.705]
        ],
        presentationReference: "BAKERY_COMMERCIAL_001_PRESENTATION",
        gameplayTags: ["business", "food", "town_centre"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "CAFE_STREET_001",
        sourceReference: { sourceFeatureId: "cafe_001", provider: "fixture-provider" },
        realWorldType: "CAFE",
        growgoClassification: "BUSINESS",
        geometryReference: [
          [145.60, -38.80],
          [145.605, -38.80],
          [145.605, -38.805],
          [145.60, -38.805]
        ],
        presentationReference: "CAFE_STREET_001_PRESENTATION",
        gameplayTags: ["business", "pedestrian", "street_frontage"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "TOWN_ROUTE_001",
        sourceReference: { sourceFeatureId: "route_001", provider: "fixture-provider" },
        realWorldType: "TRANSPORT_ROUTE",
        growgoClassification: "TRANSPORT",
        geometryReference: [
          [145.495, -38.695],
          [145.615, -38.815]
        ],
        presentationReference: "TOWN_ROUTE_001_PRESENTATION",
        gameplayTags: ["transport", "street_network"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "LIGHTHOUSE_COASTAL_001",
        sourceReference: { sourceFeatureId: "lighthouse_001", provider: "fixture-provider" },
        realWorldType: "LIGHTHOUSE",
        growgoClassification: "LANDMARK",
        geometryReference: [
          [145.33, -38.49],
          [145.331, -38.491]
        ],
        presentationReference: "LIGHTHOUSE_COASTAL_001_PRESENTATION",
        gameplayTags: ["landmark", "coastal", "achievement"],
        questCompatibility: "QUEST_SUPPORTED"
      }
    ]
  };
}

function createDirectRelationships() {
  return {
    schemaId: "ATLAS_OBJECT_RELATIONSHIPS_001",
    entries: [
      {
        relationshipId: "HOUSE_RESIDENTIAL_001_TO_TOWN_ROUTE_001_NEARBY",
        fromObjectId: "HOUSE_RESIDENTIAL_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "nearby",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "HOUSE_RESIDENTIAL_001_TO_GREENSPACE_SUBURBAN_001_NEARBY",
        fromObjectId: "HOUSE_RESIDENTIAL_001",
        toObjectId: "GREENSPACE_SUBURBAN_001",
        relationshipType: "nearby",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "GREENSPACE_SUBURBAN_001_TO_TOWN_ROUTE_001_CONNECTED",
        fromObjectId: "GREENSPACE_SUBURBAN_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "connected",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "BAKERY_COMMERCIAL_001_TO_TOWN_ROUTE_001_SERVED",
        fromObjectId: "BAKERY_COMMERCIAL_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "served_by_road",
        relationshipDomain: "TRANSPORT"
      },
      {
        relationshipId: "BAKERY_COMMERCIAL_001_TO_GREENSPACE_SUBURBAN_001_AREA",
        fromObjectId: "BAKERY_COMMERCIAL_001",
        toObjectId: "GREENSPACE_SUBURBAN_001",
        relationshipType: "business_area",
        relationshipDomain: "COMMERCIAL"
      },
      {
        relationshipId: "CAFE_STREET_001_TO_TOWN_ROUTE_001_SERVED",
        fromObjectId: "CAFE_STREET_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "served_by_road",
        relationshipDomain: "TRANSPORT"
      },
      {
        relationshipId: "BEACH_EDGE_001_TO_TOWN_ROUTE_001_CONNECTED",
        fromObjectId: "BEACH_EDGE_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "connected",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "BEACH_EDGE_001_TO_LIGHTHOUSE_COASTAL_001_WATERFRONT",
        fromObjectId: "BEACH_EDGE_001",
        toObjectId: "LIGHTHOUSE_COASTAL_001",
        relationshipType: "waterfront_relationship",
        relationshipDomain: "NATURAL"
      },
      {
        relationshipId: "LIGHTHOUSE_COASTAL_001_TO_TOWN_ROUTE_001_REACHABLE",
        fromObjectId: "LIGHTHOUSE_COASTAL_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "reachable",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "PARK_COASTAL_001_TO_TOWN_ROUTE_001_CONNECTED",
        fromObjectId: "PARK_COASTAL_001",
        toObjectId: "TOWN_ROUTE_001",
        relationshipType: "connected",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "PARK_COASTAL_001_TO_BEACH_EDGE_001_WATERFRONT",
        fromObjectId: "PARK_COASTAL_001",
        toObjectId: "BEACH_EDGE_001",
        relationshipType: "waterfront_relationship",
        relationshipDomain: "NATURAL"
      }
    ]
  };
}

function createNatureResolver() {
  return natureResolverModule.createNatureEnvironmentRecipeResolver(
    createDirectWorldObjects(),
    {
      biomeMetadataByObjectId: {
        PARK_COASTAL_001: ["COASTAL", "FORESHORE_PARKLAND"],
        GREENSPACE_SUBURBAN_001: ["SUBURBAN_GARDEN", "URBAN_STREET"],
        BEACH_EDGE_001: ["COASTAL", "BEACH_EDGE"]
      },
      environmentClassificationByObjectId: {
        PARK_COASTAL_001: "COASTAL_PARK",
        GREENSPACE_SUBURBAN_001: "SUBURBAN_GARDEN",
        BEACH_EDGE_001: "BEACH"
      }
    }
  );
}

function createHandoffLayer() {
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectWorldObjects(),
    createDirectRelationships(),
    createNatureResolver()
  );
  const sceneLayer = sceneModule.createAtlasStreetSceneCompositionLayer(
    createDirectWorldObjects(),
    createDirectRelationships(),
    previewLayer
  );
  return handoffModule.createAtlasRendererHandoffLayer(sceneLayer);
}

test("suburban scene validation passes completeness and layer checks", () => {
  const validationLayer = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    createHandoffLayer()
  );
  const suburban = validationLayer.sceneResults.find(
    (entry) => entry.sceneType === "SUBURBAN_STREET_SCENE"
  );

  assert.ok(suburban);
  assert.equal(suburban.objectCompleteness.valid, true);
  assert.equal(suburban.layerValidity.valid, true);
  assert.equal(suburban.spatialValidity.valid, true);
});

test("town street validation passes runtime scene checks", () => {
  const validationLayer = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    createHandoffLayer()
  );
  const town = validationLayer.sceneResults.find(
    (entry) => entry.sceneType === "TOWN_MAIN_STREET_SCENE"
  );

  assert.ok(town);
  assert.equal(town.validationStatus, "PASS");
  assert.equal(town.performanceValidity.lodAssigned, true);
});

test("coastal scene validation preserves geometry and renderer readiness", () => {
  const validationLayer = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    createHandoffLayer()
  );
  const coastal = validationLayer.sceneResults.find(
    (entry) => entry.sceneType === "COASTAL_STREET_SCENE"
  );

  assert.ok(coastal);
  assert.equal(coastal.spatialValidity.valid, true);
  assert.equal(coastal.performanceValidity.valid, true);
});

test("missing asset handling produces warning validation result", () => {
  const handoffLayer = createHandoffLayer();
  const mutated = structuredClone(handoffLayer);
  mutated.renderInstructions.entries[0].instructions[0].assetReference = "";

  const validationLayer = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    mutated.renderInstructions
  );
  const firstScene = validationLayer.sceneResults[0];

  assert.equal(firstScene.validationStatus, "WARN");
  assert.equal(firstScene.objectCompleteness.valid, false);
  assert.ok(firstScene.warnings.includes("object_completeness_warning"));
});

test("same inputs produce deterministic runtime validation output", () => {
  const first = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    createHandoffLayer()
  );
  const second = runtimeValidationModule.createAtlasRuntimeSceneValidationLayer(
    createHandoffLayer()
  );

  assert.deepEqual(first, second);
  assert.equal(first.summary.deterministicOutput, true);
});
