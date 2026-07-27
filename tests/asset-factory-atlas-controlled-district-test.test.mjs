import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const districtTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-district-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_DISTRICT_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "TOWN_MAIN_STREET_SCENE",
        commands: [
          createCommand("BLOCK_A_ROAD_001", "COLLECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 20, sceneId, { x: 0, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("BLOCK_B_ROAD_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 21, sceneId, { x: 20, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("BLOCK_CONNECTOR_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 22, sceneId, { x: 10, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("DISTRICT_INTERSECTION_001", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 23, sceneId, { x: 10, y: 0, z: 5 }, "MAT_ROAD_STANDARD_001"),
          createCommand("DISTRICT_SIDEWALK_001", "SIDEWALK_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 24, sceneId, { x: 5, y: 0, z: 1 }, "MAT_PATH_STANDARD_001"),
          createCommand("BLOCK_A_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 30, sceneId, { x: 2, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("BLOCK_A_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 31, sceneId, { x: 6, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("BLOCK_B_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 32, sceneId, { x: 22, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("BLOCK_B_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 33, sceneId, { x: 26, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("BLOCK_A_SHOP_001", "BAKERY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 34, sceneId, { x: 8, y: 0, z: 7 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("BLOCK_B_SHOP_001", "CAFE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 35, sceneId, { x: 28, y: 0, z: 7 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("DISTRICT_CIVIC_001", "LIBRARY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 36, sceneId, { x: 14, y: 0, z: 16 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("DISTRICT_GREEN_CORRIDOR_001", "GREEN_CORRIDOR", "PARK_TREATMENT_001", "GROUND_LAYER", 40, sceneId, { x: 12, y: 0, z: 18 }, "MAT_PARK_GROUND_001"),
          createCommand("DISTRICT_PARK_001", "PARK", "PARK_TREATMENT_001", "GROUND_LAYER", 41, sceneId, { x: 24, y: 0, z: 16 }, "MAT_PARK_GROUND_001"),
          createCommand("BLOCK_A_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 42, sceneId, { x: 4, y: 0, z: 14 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("BLOCK_B_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 43, sceneId, { x: 24, y: 0, z: 14 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("DISTRICT_LANDMARK_001", "LANDMARK_LOOKOUT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 44, sceneId, { x: 16, y: 0, z: 22 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("DISTRICT_BENCH_001", "BENCH", "BENCH_PARK_001", "DETAIL_LAYER", 50, sceneId, { x: 13, y: 0, z: 19 }, "MAT_BENCH_PARK_001")
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 18,
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

test("district creation produces a connected multi-block scene", () => {
  const result = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.blockCount, 2);
  assert.equal(result.objectCount, 18);
  assert.deepEqual(result.sceneCategories, [
    "civic",
    "commercial",
    "connectorRoad",
    "detail",
    "intersection",
    "landmark",
    "localRoad",
    "nature",
    "park",
    "residential",
    "sidewalk"
  ]);
});

test("block grouping validates district composition", () => {
  const result = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.relationshipSummary.connectorRoad, 1);
  assert.equal(result.relationshipSummary.localRoad, 2);
  assert.equal(result.relationshipSummary.intersection, 1);
  assert.equal(result.relationshipSummary.sidewalk, 1);
  assert.equal(result.relationshipSummary.residential, 4);
  assert.equal(result.relationshipSummary.commercial, 2);
  assert.equal(result.relationshipSummary.park, 2);
  assert.equal(result.relationshipSummary.nature, 2);
  assert.equal(result.relationshipSummary.civic, 1);
  assert.equal(result.relationshipSummary.landmark, 1);
  assert.equal(result.relationshipSummary.detail, 1);
});

test("relationship validation preserves district structure", () => {
  const result = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.blockGroupingValid, true);
  assert.equal(result.validation.roadHierarchyValid, true);
  assert.equal(result.validation.districtGroupingValid, true);
  assert.equal(result.validation.objectRelationshipsValid, true);
  assert.equal(result.validation.relationshipsPreserved, true);
  assert.equal(result.validation.commandsValid, true);
});

test("cleanup succeeds", () => {
  const result = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = districtTestModule.createAtlasControlledDistrictTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});
