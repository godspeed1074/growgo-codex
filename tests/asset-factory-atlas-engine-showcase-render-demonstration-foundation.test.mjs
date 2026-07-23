import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const renderDemoModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-showcase-render-demonstration-foundation.mjs"
  )
);

test("Atlas Engine showcase render demonstration foundation validates a deterministic passive showcase render package", () => {
  const result =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseRenderDemonstration.showcaseRenderRequest.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasShowcaseRenderDemonstration.showcaseRenderRequest.renderMode,
    "day_showcase"
  );
  assert.equal(
    result.atlasShowcaseRenderDemonstration.showcaseRenderRequest.rendererPayload.length,
    11
  );
});

test("Atlas Engine showcase render demonstration applies deterministic camera selection rules", () => {
  const result =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseRenderDemonstration.cameraSelectionRules.rule,
    "scenic_viewpoint"
  );
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.cameraSelectionRules.focusTarget.assetId,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.cameraSelectionRules.scenicViewpoint.assetId,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.cameraSelectionRules.explorationView.assetId,
    "string"
  );
});

test("same location and seed produce identical deterministic Atlas showcase render output", () => {
  const first =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();
  const second =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasShowcaseRenderDemonstration,
    second.atlasShowcaseRenderDemonstration
  );
});

test("Atlas Engine showcase render demonstration provides the final human-readable demo summary", () => {
  const result =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.finalDemoSummary.location,
    "string"
  );
  assert.equal(
    result.atlasShowcaseRenderDemonstration.finalDemoSummary.experienceTheme,
    "Coastal Explorer"
  );
  assert.equal(
    Array.isArray(result.atlasShowcaseRenderDemonstration.finalDemoSummary.structures),
    true
  );
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.finalDemoSummary.camera.profile,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseRenderDemonstration.finalDemoSummary.rendererStatus
      .compatibilityVerified,
    "boolean"
  );
});

test("Atlas Engine showcase render demonstration remains passive and exposes no live runtime handles", () => {
  const result =
    renderDemoModule.validateAtlasEngineShowcaseRenderDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseRenderDemonstration.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasShowcaseRenderDemonstration.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasShowcaseRenderDemonstration.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseRenderDemonstration,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseRenderDemonstration.showcaseRenderRequest,
      "realMapAttachment"
    ),
    false
  );
});
