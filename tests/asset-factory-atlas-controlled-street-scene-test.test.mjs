import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const streetSceneTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-street-scene-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_STREET_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "SUBURBAN_STREET_SCENE",
        commands: [
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "ROAD_MAIN_001",
            objectType: "TRANSPORT_ROUTE",
            assetReference: "ROAD_STRAIGHT_SMALL_001",
            transform: {
              transformId: "ROAD_MAIN_001_TRANSFORM_00",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ROAD_MAIN_001_GEOMETRY",
              sourceFootprintId: "ROAD_MAIN_001_FOOTPRINT"
            },
            renderLayer: "ROAD_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_ROAD_STANDARD_001",
            layerOrdering: 20,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "SIDEWALK_REF_001",
            objectType: "SIDEWALK_PATH",
            assetReference: "PATH_STANDARD_001",
            transform: {
              transformId: "SIDEWALK_REF_001_TRANSFORM_00",
              position: { x: 1, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "SIDEWALK_REF_001_GEOMETRY",
              sourceFootprintId: "SIDEWALK_REF_001_FOOTPRINT"
            },
            renderLayer: "ROAD_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_PATH_STANDARD_001",
            layerOrdering: 21,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "HOUSE_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_001_TRANSFORM_00",
              position: { x: 4, y: 0, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_001_GEOMETRY",
              sourceFootprintId: "HOUSE_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "HOUSE_002",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_002_TRANSFORM_00",
              position: { x: 8, y: 0, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_002_GEOMETRY",
              sourceFootprintId: "HOUSE_002_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 31,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "HOUSE_003",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_003_TRANSFORM_00",
              position: { x: 12, y: 0, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_003_GEOMETRY",
              sourceFootprintId: "HOUSE_003_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 32,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "SHOP_001",
            objectType: "BAKERY",
            assetReference: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
            transform: {
              transformId: "SHOP_001_TRANSFORM_00",
              position: { x: 16, y: 0, z: 5 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "SHOP_001_GEOMETRY",
              sourceFootprintId: "SHOP_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_COMMERCIAL_SHOP_001",
            layerOrdering: 33,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "TREE_001",
            objectType: "TREE",
            assetReference: "TREE_EUCALYPTUS_001",
            transform: {
              transformId: "TREE_001_TRANSFORM_00",
              position: { x: 3, y: 0, z: 2 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "TREE_001_GEOMETRY",
              sourceFootprintId: "TREE_001_FOOTPRINT"
            },
            renderLayer: "NATURE_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_TREE_EUCALYPTUS_001",
            layerOrdering: 40,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "TREE_002",
            objectType: "TREE",
            assetReference: "TREE_EUCALYPTUS_001",
            transform: {
              transformId: "TREE_002_TRANSFORM_00",
              position: { x: 14, y: 0, z: 2 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "TREE_002_GEOMETRY",
              sourceFootprintId: "TREE_002_FOOTPRINT"
            },
            renderLayer: "NATURE_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_TREE_EUCALYPTUS_001",
            layerOrdering: 41,
            sceneId
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "BENCH_001",
            objectType: "BENCH",
            assetReference: "BENCH_PARK_001",
            transform: {
              transformId: "BENCH_001_TRANSFORM_00",
              position: { x: 10, y: 0, z: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "BENCH_001_GEOMETRY",
              sourceFootprintId: "BENCH_001_FOOTPRINT"
            },
            renderLayer: "DETAIL_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_BENCH_PARK_001",
            layerOrdering: 50,
            sceneId
          }
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 9,
          cleanupSupported: true
        }
      }
    ]
  };
}

test("street scene creation groups the expected objects", () => {
  const result = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.objectCount, 9);
  assert.equal(result.sceneRelationshipSummary.road, 1);
  assert.equal(result.sceneRelationshipSummary.sidewalk, 1);
  assert.equal(result.sceneRelationshipSummary.residential, 3);
  assert.equal(result.sceneRelationshipSummary.commercial, 1);
  assert.equal(result.sceneRelationshipSummary.nature, 2);
  assert.equal(result.sceneRelationshipSummary.detail, 1);
});

test("object count validation accounts for every street object", () => {
  const result = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.allObjectsAccountedFor, true);
  assert.equal(result.objectsTested.length, 9);
});

test("layer validation preserves street scene ordering", () => {
  const result = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(result.layerSummary, {
    DETAIL_LAYER: 1,
    NATURE_LAYER: 2,
    OBJECT_LAYER: 4,
    ROAD_LAYER: 2
  });
  assert.equal(result.validation.layerOrderingValid, true);
  assert.equal(result.validation.commandOrderingValid, true);
});

test("cleanup succeeds", () => {
  const result = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = streetSceneTestModule.createAtlasControlledStreetSceneTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicResult, true);
});
