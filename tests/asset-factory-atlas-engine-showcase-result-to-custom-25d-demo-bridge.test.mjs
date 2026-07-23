import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const bridgeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-showcase-result-to-custom-25d-demo-bridge.mjs"
  )
);

test("Atlas Engine showcase result to Custom 2.5D demo bridge validates a deterministic passive renderer request", () => {
  const result =
    bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.atlasResultId.startsWith(
      "ATLAS_SHOWCASE_OUTPUT_PACKAGE_001_"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.previewSceneId.startsWith(
      "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.rendererPayload.length,
    11
  );
});

test("Atlas Engine showcase result to Custom 2.5D demo bridge supports the approved showcase preview modes and demo assets", () => {
  const result =
    bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge();

  assert.equal(result.ok, true);
  assert.deepEqual(
    bridgeModule.atlasEngineShowcaseResultToCustom25DDemoBridgePreviewModes,
    ["day_showcase", "sunset_showcase", "night_showcase"]
  );
  assert.deepEqual(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState
      .demoObjectAssetIds.includes("LIGHTHOUSE_ISLAND_ROCKY_001"),
    true
  );
  assert.deepEqual(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState
      .demoObjectAssetIds.includes("BUILDING_HOUSE_SMALL_COASTAL_001"),
    true
  );
  assert.deepEqual(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState
      .demoObjectAssetIds.includes("ROAD_STRAIGHT_SMALL_001"),
    true
  );
  assert.deepEqual(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState
      .demoObjectAssetIds.includes("TREE_EUCALYPTUS_001"),
    true
  );
});

test("same Atlas result produces identical deterministic Custom 2.5D demo bridge output", () => {
  const first =
    bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge();
  const second =
    bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasShowcaseResultToCustom25DDemoBridge,
    second.atlasShowcaseResultToCustom25DDemoBridge
  );
});

test("Atlas Engine showcase result to Custom 2.5D demo bridge session stays manual-only and prevents duplicate render activation", () => {
  const creation =
    bridgeModule.createAtlasEngineShowcaseResultToCustom25DDemoBridgeSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.custom25dDemoBridgeSession.currentSessionState(),
    "prepared"
  );

  const activation =
    creation.custom25dDemoBridgeSession.startManualRender({
      manualRenderAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.renderActivation.sessionState, "verified");
  assert.equal(activation.renderActivation.realMapAttached, false);

  const duplicate =
    creation.custom25dDemoBridgeSession.startManualRender({
      manualRenderAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_render_prevented");
});

test("Atlas Engine showcase result to Custom 2.5D demo bridge remains passive and exposes no live runtime handles", () => {
  const result =
    bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.compatibility
      .externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseResultToCustom25DDemoBridge,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseResultToCustom25DDemoBridge,
      "realMapAttachment"
    ),
    false
  );
});
