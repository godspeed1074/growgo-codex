import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const townBlockTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-town-block-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_TOWN_BLOCK_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "TOWN_MAIN_STREET_SCENE",
        commands: [
          createCommand("ROAD_NORTH_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 20, sceneId, { x: 0, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("ROAD_EAST_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 21, sceneId, { x: 10, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("INTERSECTION_001", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 22, sceneId, { x: 5, y: 0, z: 5 }, "MAT_ROAD_STANDARD_001"),
          createCommand("SIDEWALK_001", "SIDEWALK_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 23, sceneId, { x: 2, y: 0, z: 1 }, "MAT_PATH_STANDARD_001"),
          createCommand("HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 30, sceneId, { x: 2, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 31, sceneId, { x: 6, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("HOUSE_003", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 32, sceneId, { x: 10, y: 0, z: 8 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("SHOP_001", "BAKERY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 33, sceneId, { x: 14, y: 0, z: 7 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("SHOP_002", "CAFE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 34, sceneId, { x: 18, y: 0, z: 7 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("PARK_001", "PARK", "PARK_TREATMENT_001", "GROUND_LAYER", 40, sceneId, { x: 8, y: 0, z: 14 }, "MAT_PARK_GROUND_001"),
          createCommand("TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 41, sceneId, { x: 6, y: 0, z: 13 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("TREE_002", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 42, sceneId, { x: 10, y: 0, z: 13 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("BENCH_001", "BENCH", "BENCH_PARK_001", "DETAIL_LAYER", 50, sceneId, { x: 9, y: 0, z: 15 }, "MAT_BENCH_PARK_001")
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 13,
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

test("town block creation groups the expected scene contents", () => {
  const result = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.objectCount, 13);
  assert.deepEqual(result.sceneCategories, [
    "commercial",
    "detail",
    "intersection",
    "nature",
    "park",
    "residential",
    "road",
    "sidewalk"
  ]);
});

test("category validation confirms town block relationships", () => {
  const result = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.relationshipSummary.road, 2);
  assert.equal(result.relationshipSummary.intersection, 1);
  assert.equal(result.relationshipSummary.sidewalk, 1);
  assert.equal(result.relationshipSummary.residential, 3);
  assert.equal(result.relationshipSummary.commercial, 2);
  assert.equal(result.relationshipSummary.park, 1);
  assert.equal(result.relationshipSummary.nature, 2);
  assert.equal(result.relationshipSummary.detail, 1);
});

test("relationship validation preserves ordering and references", () => {
  const result = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.roadRelationshipsValid, true);
  assert.equal(result.validation.buildingPlacementReferencesValid, true);
  assert.equal(result.validation.parkRelationshipsValid, true);
  assert.equal(result.validation.relationshipsPreserved, true);
  assert.equal(result.validation.commandsValid, true);
});

test("cleanup succeeds", () => {
  const result = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = townBlockTestModule.createAtlasControlledTownBlockTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicResult, true);
});
