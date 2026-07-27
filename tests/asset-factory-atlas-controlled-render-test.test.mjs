import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const controlledRenderTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-render-test.mjs"
  )
);
const activationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-renderer-activation.mjs"
  )
);

function createDirectRenderCommands() {
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId: "SUBURBAN_STREET_SCENE_001",
        sceneType: "SUBURBAN_STREET_SCENE",
        commands: [
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "HOUSE_TEST_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_TEST_001_TRANSFORM_00",
              position: { x: 10, y: 0, z: 20 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_TEST_001_GEOMETRY",
              sourceFootprintId: "HOUSE_TEST_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SUBURBAN_STREET_SCENE_001"
          }
        ],
        updateCommands: [
          {
            commandType: "UPDATE_OBJECT_COMMAND",
            objectId: "HOUSE_TEST_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_TEST_001_TRANSFORM_00",
              position: { x: 10, y: 0, z: 20 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_TEST_001_GEOMETRY",
              sourceFootprintId: "HOUSE_TEST_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SUBURBAN_STREET_SCENE_001"
          }
        ],
        cleanupCommands: [
          {
            commandType: "REMOVE_OBJECT_COMMAND",
            objectId: "HOUSE_TEST_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "HOUSE_TEST_001_TRANSFORM_00",
              position: { x: 10, y: 0, z: 20 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "HOUSE_TEST_001_GEOMETRY",
              sourceFootprintId: "HOUSE_TEST_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SUBURBAN_STREET_SCENE_001"
          }
        ],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 1,
          cleanupSupported: true
        }
      }
    ]
  };
}

function createActivationLayer(options = {}) {
  return activationModule.createAtlasControlledRendererActivationLayer(
    createDirectRenderCommands(),
    {
      lifecycleOwnerId: "ATLAS_CONTROLLED_RENDER_TEAM",
      ...options
    }
  );
}

test("blocked without authorization", () => {
  const activationLayer = createActivationLayer();

  assert.throws(
    () =>
      controlledRenderTestModule.createAtlasControlledRenderTest(activationLayer),
    /requires all activation gates to pass|authorization/i
  );
});

test("succeeds with all gates", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const result =
    controlledRenderTestModule.createAtlasControlledRenderTest(activationLayer);

  assert.equal(result.execution.executionStatus, "EXECUTED");
  assert.equal(result.validation.executionRequiredAuthorization, true);
  assert.equal(result.execution.worldObjectsDrawn, false);
  assert.equal(result.testedObject.testSceneId, "CONTROLLED_RENDERER_TEST_SCENE_001");
});

test("cleanup works", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const result =
    controlledRenderTestModule.createAtlasControlledRenderTest(activationLayer);

  assert.equal(result.cleanupResult.cleanupRequired, true);
  assert.equal(result.cleanupResult.cleanupCompleted, true);
  assert.equal(result.cleanupResult.sourceStateRestored, true);
  assert.equal(result.validation.cleanupCompleted, true);
});

test("deterministic result", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const first =
    controlledRenderTestModule.createAtlasControlledRenderTest(activationLayer);
  const second =
    controlledRenderTestModule.createAtlasControlledRenderTest(activationLayer);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicResult, true);
});
