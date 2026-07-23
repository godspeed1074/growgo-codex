import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const presentationLayerModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-world-preview-presentation-layer-foundation.mjs"
  )
);

test("Atlas Engine world preview presentation layer foundation validates a deterministic passive preview scene package", () => {
  const result =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.rendererPreviewData.payloadCount,
    11
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.metadata.previewCameraMetadata
      .cameraProfile,
    "coastal-overlook"
  );
});

test("Atlas Engine world preview presentation layer organizes scene objects into landmarks, structures, and environment", () => {
  const result =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.sceneObjects.landmarks.length,
    0
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.sceneObjects.structures.length,
    3
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.sceneObjects.environment.length,
    8
  );
});

test("same location and seed produce identical deterministic Atlas presentation output", () => {
  const first =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();
  const second =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasWorldPreviewPresentationLayer,
    second.atlasWorldPreviewPresentationLayer
  );
});

test("Atlas Engine world preview presentation layer improves the demo summary with showcase and focus presentation data", () => {
  const result =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();

  assert.equal(result.ok, true);
  assert.deepEqual(
    Object.keys(result.atlasWorldPreviewPresentationLayer.demoSummaryPresentation),
    [
      "location",
      "biome",
      "worldQualityProfile",
      "showcaseLocations",
      "previewFocusSelection"
    ]
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.metadata.presentationQualityRules
      .showcaseLocations.length,
    3
  );
  assert.equal(
    typeof result.atlasWorldPreviewPresentationLayer.metadata
      .presentationQualityRules.previewFocusSelection.assetId,
    "string"
  );
});

test("Atlas Engine world preview presentation layer remains passive and exposes no live runtime handles", () => {
  const result =
    presentationLayerModule.validateAtlasEngineWorldPreviewPresentationLayerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasWorldPreviewPresentationLayer.compatibility
      .externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasWorldPreviewPresentationLayer,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasWorldPreviewPresentationLayer.rendererPreviewData,
      "realMapAttachment"
    ),
    false
  );
});
