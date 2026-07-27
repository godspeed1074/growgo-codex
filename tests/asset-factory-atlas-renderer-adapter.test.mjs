import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const adapterModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-renderer-adapter.mjs"
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

test("object command creation produces deterministic create commands from atlas instructions", () => {
  const layer = adapterModule.createAtlasRendererAdapterLayer(createHandoffLayer());
  const suburban = layer.renderCommands.entries.find(
    (entry) => entry.sceneType === "SUBURBAN_STREET_SCENE"
  );

  assert.ok(suburban);
  assert.ok(suburban.commands.length > 0);
  assert.ok(
    suburban.commands.every((command) => command.commandType === "CREATE_OBJECT_COMMAND")
  );
});

test("layer preservation keeps renderer command layers aligned to atlas handoff", () => {
  const layer = adapterModule.createAtlasRendererAdapterLayer(createHandoffLayer());
  const coastal = layer.renderCommands.entries.find(
    (entry) => entry.sceneType === "COASTAL_STREET_SCENE"
  );
  const beachCommand = coastal.commands.find((entry) => entry.objectId === "BEACH_EDGE_001");
  const lighthouseCommand = coastal.commands.find(
    (entry) => entry.objectId === "LIGHTHOUSE_COASTAL_001"
  );

  assert.ok(beachCommand);
  assert.ok(lighthouseCommand);
  assert.equal(beachCommand.renderLayer, "GROUND_LAYER");
  assert.equal(lighthouseCommand.renderLayer, "OBJECT_LAYER");
});

test("LOD preservation keeps command LOD equal to atlas handoff LOD", () => {
  const handoff = createHandoffLayer();
  const layer = adapterModule.createAtlasRendererAdapterLayer(handoff);
  const handoffInstruction = handoff.renderInstructions.entries
    .flatMap((entry) => entry.instructions)
    .find((entry) => entry.objectId === "HOUSE_RESIDENTIAL_001");
  const command = layer.renderCommands.entries
    .flatMap((entry) => entry.commands)
    .find((entry) => entry.objectId === "HOUSE_RESIDENTIAL_001");

  assert.ok(handoffInstruction);
  assert.ok(command);
  assert.equal(command.lod, handoffInstruction.lodLevel);
});

test("invalid input handling rejects incomplete direct atlas render instructions", () => {
  const invalidInstructions = structuredClone(createHandoffLayer().renderInstructions);
  invalidInstructions.entries[0].instructions[0].assetReference = "";

  assert.throws(
    () => adapterModule.createAtlasRendererAdapterLayer(invalidInstructions),
    /assetReference is required|must be true|incomplete/i
  );
});

test("same inputs produce deterministic same renderer adapter output", () => {
  const first = adapterModule.createAtlasRendererAdapterLayer(createHandoffLayer());
  const second = adapterModule.createAtlasRendererAdapterLayer(createHandoffLayer());

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicConversion, true);
});
