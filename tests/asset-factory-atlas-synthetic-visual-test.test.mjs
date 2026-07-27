import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const syntheticVisualTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-synthetic-visual-test.mjs"
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
        sceneId: "SYNTHETIC_SCENE_001",
        sceneType: "SUBURBAN_STREET_SCENE",
        commands: [
          {
            commandType: "CREATE_OBJECT_COMMAND",
            objectId: "ATLAS_TEST_OBJECT_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "ATLAS_TEST_OBJECT_001_TRANSFORM_00",
              position: { x: 12, y: 0, z: 24 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ATLAS_TEST_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ATLAS_TEST_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SYNTHETIC_SCENE_001"
          }
        ],
        updateCommands: [
          {
            commandType: "UPDATE_OBJECT_COMMAND",
            objectId: "ATLAS_TEST_OBJECT_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "ATLAS_TEST_OBJECT_001_TRANSFORM_00",
              position: { x: 12, y: 0, z: 24 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ATLAS_TEST_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ATLAS_TEST_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SYNTHETIC_SCENE_001"
          }
        ],
        cleanupCommands: [
          {
            commandType: "REMOVE_OBJECT_COMMAND",
            objectId: "ATLAS_TEST_OBJECT_001",
            objectType: "HOUSE",
            assetReference: "BUILDING_RESIDENTIAL_SUBURBAN_001",
            transform: {
              transformId: "ATLAS_TEST_OBJECT_001_TRANSFORM_00",
              position: { x: 12, y: 0, z: 24 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            geometryReference: {
              geometryId: "ATLAS_TEST_OBJECT_001_GEOMETRY",
              sourceFootprintId: "ATLAS_TEST_OBJECT_001_FOOTPRINT"
            },
            renderLayer: "OBJECT_LAYER",
            lod: "LOD_NEAR",
            materialReference: "MAT_SUBURBAN_HOUSE_001",
            layerOrdering: 30,
            sceneId: "SYNTHETIC_SCENE_001"
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
      lifecycleOwnerId: "ATLAS_SYNTHETIC_VISUAL_TEAM",
      ...options
    }
  );
}

test("blocked without authorization", () => {
  const activationLayer = createActivationLayer();

  assert.throws(
    () => syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer),
    /requires all activation gates to pass|authorization/i
  );
});

test("succeeds with authorization", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const result =
    syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer);

  assert.equal(result.outputStatus.outputStatus, "VERIFIED_SYNTHETIC_VISUAL");
  assert.equal(result.validation.authorizationPassed, true);
  assert.equal(result.syntheticScene.sceneId, "SYNTHETIC_VISUAL_TEST_SCENE_001");
});

test("output validation preserves command and object identity", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const result =
    syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer);

  assert.equal(result.objectIdentity.sourceObjectId, "ATLAS_TEST_OBJECT_001");
  assert.equal(result.commandIdentity.commandType, "CREATE_OBJECT_COMMAND");
  assert.equal(result.validation.renderCommandValid, true);
  assert.equal(result.validation.transformPreserved, true);
});

test("cleanup succeeds", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const result =
    syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer);

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
  assert.equal(result.validation.cleanupCompleted, true);
});

test("deterministic result", () => {
  const activationLayer = createActivationLayer({
    rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST"
  });
  const first =
    syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer);
  const second =
    syntheticVisualTestModule.createAtlasSyntheticVisualTest(activationLayer);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});
