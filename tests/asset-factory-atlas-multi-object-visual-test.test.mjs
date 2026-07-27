import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const multiObjectVisualTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-multi-object-visual-test.mjs"
  )
);

function createDirectRenderCommands() {
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001",
        sceneType: "SUBURBAN_STREET_SCENE",
        commands: [
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "ROAD_OBJECT_001",
            objectType: "TRANSPORT_ROUTE",
            assetReference: "ROAD_STRAIGHT_SMALL_001",
            transform: {
              transformId: "ROAD_OBJECT_001_TRANSFORM_00",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ROAD_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ROAD_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "ROAD_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_ROAD_STANDARD_001",
            layerOrdering: 20,
            sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001"
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "BUILDING_OBJECT_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "BUILDING_OBJECT_001_TRANSFORM_00",
              position: { x: 4, y: 0, z: 6 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "BUILDING_OBJECT_001_GEOMETRY",
              sourceFootprintId: "BUILDING_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001"
          },
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "NATURE_OBJECT_001",
            objectType: "TREE",
            assetReference: "TREE_EUCALYPTUS_001",
            transform: {
              transformId: "NATURE_OBJECT_001_TRANSFORM_00",
              position: { x: 8, y: 0, z: 4 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "NATURE_OBJECT_001_GEOMETRY",
              sourceFootprintId: "NATURE_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "NATURE_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_TREE_EUCALYPTUS_001",
            layerOrdering: 40,
            sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001"
          }
        ],
        updateCommands: [
          {
            commandType: "UPDATE_OBJECT_COMMAND",
            objectId: "ROAD_OBJECT_001",
            objectType: "TRANSPORT_ROUTE",
            assetReference: "ROAD_STRAIGHT_SMALL_001",
            transform: {
              transformId: "ROAD_OBJECT_001_TRANSFORM_00",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ROAD_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ROAD_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "ROAD_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_ROAD_STANDARD_001",
            layerOrdering: 20,
            sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001"
          }
        ],
        cleanupCommands: [
          {
            commandType: "REMOVE_OBJECT_COMMAND",
            objectId: "ROAD_OBJECT_001",
            objectType: "TRANSPORT_ROUTE",
            assetReference: "ROAD_STRAIGHT_SMALL_001",
            transform: {
              transformId: "ROAD_OBJECT_001_TRANSFORM_00",
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ROAD_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ROAD_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "ROAD_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_ROAD_STANDARD_001",
            layerOrdering: 20,
            sceneId: "CONTROLLED_MULTI_OBJECT_SOURCE_SCENE_001"
          }
        ],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 3,
          cleanupSupported: true
        }
      }
    ]
  };
}

test("multi-object command flow accepts road building and nature commands", () => {
  const result = multiObjectVisualTestModule.createAtlasMultiObjectVisualTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.objectCount, 3);
  assert.equal(result.commandCount, 3);
  assert.deepEqual(
    result.objectsTested.map((entry) => entry.objectId),
    ["ROAD_OBJECT_001", "BUILDING_OBJECT_001", "NATURE_OBJECT_001"]
  );
});

test("layer ordering is preserved", () => {
  const result = multiObjectVisualTestModule.createAtlasMultiObjectVisualTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(
    result.objectsTested.map((entry) => entry.layerOrdering),
    [20, 30, 40]
  );
  assert.deepEqual(result.layerSummary, {
    NATURE_LAYER: 1,
    OBJECT_LAYER: 1,
    ROAD_LAYER: 1
  });
  assert.equal(result.validation.layerOrderingPreserved, true);
});

test("cleanup succeeds", () => {
  const result = multiObjectVisualTestModule.createAtlasMultiObjectVisualTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
  assert.equal(result.validation.cleanupCompleted, true);
});

test("deterministic result", () => {
  const first = multiObjectVisualTestModule.createAtlasMultiObjectVisualTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = multiObjectVisualTestModule.createAtlasMultiObjectVisualTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicResult, true);
});
