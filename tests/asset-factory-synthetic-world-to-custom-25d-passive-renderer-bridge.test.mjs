import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const syntheticWorldModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-world-scene-consumer.mjs"
  )
);

const bridgeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-world-to-custom-25d-passive-renderer-bridge.mjs"
  )
);

test("synthetic world to Custom 2.5D passive renderer bridge accepts the core synthetic scene objects", () => {
  const result = bridgeModule.validateSyntheticWorldToCustom25DPassiveRendererBridge();

  assert.equal(result.ok, true);
  assert.equal(
    result.custom25DRendererSceneConsumer.worldId,
    "SYNTHETIC_COASTAL_WORLD_SCENE_001"
  );
  assert.deepEqual(
    result.custom25DRendererSceneConsumer.rendererPayloads.map(
      (entry) => entry.rendererAssetReference.assetId
    ),
    [
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});

test("same world seed, location, and assets produce identical Custom 2.5D renderer scene payloads", () => {
  const first = bridgeModule.validateSyntheticWorldToCustom25DPassiveRendererBridge();
  const second = bridgeModule.validateSyntheticWorldToCustom25DPassiveRendererBridge();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.custom25DRendererSceneConsumer.rendererPayloads,
    second.custom25DRendererSceneConsumer.rendererPayloads
  );
  assert.deepEqual(
    first.custom25DRendererSceneConsumer.lodProfiles,
    second.custom25DRendererSceneConsumer.lodProfiles
  );
  assert.deepEqual(
    first.custom25DRendererSceneConsumer.visibilityStates,
    second.custom25DRendererSceneConsumer.visibilityStates
  );
});

test("synthetic world to Custom 2.5D passive renderer bridge rejects mismatched transform and visibility data safely", () => {
  const syntheticWorldResult = syntheticWorldModule.validateSyntheticWorldSceneConsumer();

  assert.equal(syntheticWorldResult.ok, true);

  assert.throws(
    () =>
      bridgeModule.validateSyntheticWorldCustom25DPassiveRendererScene({
        ...syntheticWorldResult.syntheticWorldScene,
        bridgeResult: {
          ...syntheticWorldResult.syntheticWorldScene.bridgeResult,
          rendererHandoffOutputs:
            syntheticWorldResult.syntheticWorldScene.bridgeResult.rendererHandoffOutputs.map(
              (entry) =>
                entry.rendererAssetReference.assetId === "ROAD_STRAIGHT_SMALL_001"
                  ? {
                      ...entry,
                      transformData: {
                        ...entry.transformData,
                        position: {
                          ...entry.transformData.position,
                          x: entry.transformData.position.x + 1
                        }
                      }
                    }
                  : entry
            )
        }
      }),
    (error) => error?.code === "transform_position_mismatch"
  );

  assert.throws(
    () =>
      bridgeModule.validateSyntheticWorldCustom25DPassiveRendererScene({
        ...syntheticWorldResult.syntheticWorldScene,
        bridgeResult: {
          ...syntheticWorldResult.syntheticWorldScene.bridgeResult,
          rendererHandoffOutputs:
            syntheticWorldResult.syntheticWorldScene.bridgeResult.rendererHandoffOutputs.map(
              (entry) =>
                entry.rendererAssetReference.assetId === "TREE_EUCALYPTUS_001"
                  ? {
                      ...entry,
                      visibilityMetadata: {
                        ...entry.visibilityMetadata,
                        visibilityState: "loading"
                      }
                    }
                  : entry
            )
        }
      }),
    (error) => error?.code === "visibility_state_mismatch"
  );
});

test("synthetic world to Custom 2.5D passive renderer bridge remains passive and creates no runtime renderer objects", () => {
  const result = bridgeModule.validateSyntheticWorldToCustom25DPassiveRendererBridge();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.custom25DRendererSceneConsumer, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.custom25DRendererSceneConsumer.rendererPayloads[0],
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.custom25DRendererSceneConsumer,
      "runtimeRenderer"
    ),
    false
  );
});
