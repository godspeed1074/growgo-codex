import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const bridgeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-pipeline-renderer-bridge.mjs"
  )
);

test("world pipeline renderer bridge validates passive renderer handoff outputs for streamed world instances", () => {
  const result = bridgeModule.validateWorldPipelineRendererBridge();

  assert.equal(result.ok, true);
  assert.equal(
    result.worldPipelineRendererBridge.rendererHandoffOutputs.length,
    3
  );
  assert.equal(
    result.worldPipelineRendererBridge.rendererHandoffOutputs[0].rendererAssetReference.assetId,
    "BUILDING_BAKERY_SMALL_001"
  );
});

test("same world seed, location, and asset produce identical renderer bridge payloads", () => {
  const first = bridgeModule.buildPassiveWorldPipelineRendererBridge();
  const second = bridgeModule.buildPassiveWorldPipelineRendererBridge();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.bridge.rendererHandoffOutputs,
    second.bridge.rendererHandoffOutputs
  );
});

test("world pipeline renderer bridge rejects invalid lod and visibility state safely", () => {
  const invalidLod = bridgeModule.validateWorldPipelineRendererBridge({
    ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition,
    bridgeInputs: [
      {
        ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition.bridgeInputs[0],
        lodProfile: "distantSilhouette"
      },
      ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition.bridgeInputs.slice(1)
    ]
  });

  const invalidVisibility = bridgeModule.validateWorldPipelineRendererBridge({
    ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition,
    bridgeInputs: [
      {
        ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition.bridgeInputs[0],
        visibilityState: "fading"
      },
      ...bridgeModule.worldPipelineRendererBridgeFoundationDefinition.bridgeInputs.slice(1)
    ]
  });

  assert.equal(invalidLod.ok, false);
  assert.equal(invalidLod.errorCode, "invalid_lod_profile");
  assert.equal(invalidVisibility.ok, false);
  assert.equal(invalidVisibility.errorCode, "invalid_visibility_state");
});

test("world pipeline renderer bridge remains passive and activates no rendering runtime", () => {
  const result = bridgeModule.validateWorldPipelineRendererBridge();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldPipelineRendererBridge,
      "canvas"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldPipelineRendererBridge.rendererHandoffOutputs[0],
      "mesh"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.worldPipelineRendererBridge.rendererHandoffOutputs[0].passiveRendererPayload,
      "worldInstance"
    ),
    false
  );
});
