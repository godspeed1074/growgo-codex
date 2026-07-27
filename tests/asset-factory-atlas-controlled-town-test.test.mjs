import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const townTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-town-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_TOWN_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "TOWN_MAIN_STREET_SCENE",
        commands: [
          createCommand("DISTRICT_A_ROAD_001", "COLLECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 20, sceneId, { x: 0, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("DISTRICT_B_ROAD_001", "COLLECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 21, sceneId, { x: 25, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("DISTRICT_C_ROAD_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 22, sceneId, { x: 50, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_CONNECTOR_001", "CONNECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 23, sceneId, { x: 20, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_INTERSECTION_001", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 24, sceneId, { x: 30, y: 0, z: 8 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_INTERSECTION_002", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 25, sceneId, { x: 45, y: 0, z: 8 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_SIDEWALK_001", "SIDEWALK_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 26, sceneId, { x: 10, y: 0, z: 2 }, "MAT_PATH_STANDARD_001"),
          createCommand("TOWN_TRANSPORT_001", "BUS_STATION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 27, sceneId, { x: 35, y: 0, z: 14 }, "MAT_ROAD_STANDARD_001"),

          createCommand("DISTRICT_A_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 30, sceneId, { x: 2, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("DISTRICT_A_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 31, sceneId, { x: 6, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("DISTRICT_B_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 32, sceneId, { x: 28, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("DISTRICT_B_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 33, sceneId, { x: 32, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("DISTRICT_C_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 34, sceneId, { x: 52, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("DISTRICT_C_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 35, sceneId, { x: 56, y: 0, z: 10 }, "MAT_SUBURBAN_HOUSE_001"),

          createCommand("DISTRICT_A_SHOP_001", "BAKERY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 36, sceneId, { x: 12, y: 0, z: 8 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("DISTRICT_B_SHOP_001", "CAFE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 37, sceneId, { x: 36, y: 0, z: 8 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("TOWN_CENTRE_PLAZA_001", "TOWN_CENTRE_PLAZA", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 38, sceneId, { x: 40, y: 0, z: 18 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("TOWN_CIVIC_001", "LIBRARY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 39, sceneId, { x: 44, y: 0, z: 18 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("TOWN_LANDMARK_001", "LANDMARK_MONUMENT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 40, sceneId, { x: 48, y: 0, z: 18 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("TOWN_GREENSPACE_001", "GREEN_CORRIDOR", "PARK_TREATMENT_001", "GROUND_LAYER", 41, sceneId, { x: 20, y: 0, z: 22 }, "MAT_PARK_GROUND_001"),
          createCommand("TOWN_PARK_001", "PARK", "PARK_TREATMENT_001", "GROUND_LAYER", 42, sceneId, { x: 50, y: 0, z: 22 }, "MAT_PARK_GROUND_001"),
          createCommand("TOWN_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 43, sceneId, { x: 18, y: 0, z: 24 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("TOWN_TREE_002", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 44, sceneId, { x: 52, y: 0, z: 24 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("TOWN_BENCH_001", "BENCH", "BENCH_PARK_001", "DETAIL_LAYER", 50, sceneId, { x: 42, y: 0, z: 20 }, "MAT_BENCH_PARK_001")
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 24,
          cleanupSupported: true
        }
      }
    ]
  };
}

function createCommand(objectId, objectType, assetReference, renderLayer, layerOrdering, sceneId, position, materialReference) {
  return {
    commandType: "CREATE_OBJECT_COMMAND",
    objectId,
    objectType,
    assetReference,
    transform: {
      transformId: `${objectId}_TRANSFORM_00`,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    geometryReference: {
      geometryId: `${objectId}_GEOMETRY`,
      sourceFootprintId: `${objectId}_FOOTPRINT`
    },
    renderLayer,
    lod: "LOD_NEAR",
    materialReference,
    layerOrdering,
    sceneId
  };
}

test("town creation produces a connected multi-district scene", () => {
  const result = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.districtCount, 3);
  assert.equal(result.objectCount, 24);
  assert.deepEqual(result.sceneCategories, [
    "civic",
    "commercial",
    "connectorRoad",
    "detail",
    "greenSpace",
    "intersection",
    "landmark",
    "localRoad",
    "nature",
    "residential",
    "sidewalk",
    "townCentre",
    "transport"
  ]);
});

test("district grouping validates town composition", () => {
  const result = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.relationshipSummary.connectorRoad, 1);
  assert.equal(result.relationshipSummary.localRoad, 3);
  assert.equal(result.relationshipSummary.intersection, 2);
  assert.equal(result.relationshipSummary.sidewalk, 1);
  assert.equal(result.relationshipSummary.transport, 1);
  assert.equal(result.relationshipSummary.residential, 6);
  assert.equal(result.relationshipSummary.commercial, 2);
  assert.equal(result.relationshipSummary.townCentre, 1);
  assert.equal(result.relationshipSummary.greenSpace, 2);
  assert.equal(result.relationshipSummary.nature, 2);
  assert.equal(result.relationshipSummary.civic, 1);
  assert.equal(result.relationshipSummary.landmark, 1);
  assert.equal(result.relationshipSummary.detail, 1);
});

test("town centre validation preserves relationships", () => {
  const result = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.districtGroupingValid, true);
  assert.equal(result.validation.townCentreConnectionsValid, true);
  assert.equal(result.validation.roadHierarchyValid, true);
  assert.equal(result.validation.commercialPlacementValid, true);
  assert.equal(result.validation.greenSpaceRelationshipsValid, true);
  assert.equal(result.validation.transportLinksValid, true);
});

test("relationship validation preserves source structure", () => {
  const result = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.assetReferencesValid, true);
  assert.equal(result.validation.layerOrderingValid, true);
  assert.equal(result.validation.relationshipsPreserved, true);
  assert.equal(result.validation.commandsValid, true);
});

test("cleanup succeeds", () => {
  const result = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = townTestModule.createAtlasControlledTownTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});
