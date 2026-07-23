import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-visual-preview-output-foundation.mjs"
  )
);

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function buildRendererPayload() {
  const assets = [
    ["LIGHTHOUSE_ISLAND_ROCKY_001", "landmarks"],
    ["BUILDING_HOUSE_SMALL_COASTAL_001", "buildings"],
    ["ROAD_STRAIGHT_SMALL_001", "roads"],
    ["TREE_EUCALYPTUS_001", "nature"],
    ["TRAIL_PATH_SMALL_001", "roads"],
    ["BENCH_PARK_001", "decorations"],
    ["GRASS_PATCH_001", "nature"],
    ["BUSH_NATIVE_001", "nature"],
    ["ROCK_COASTAL_001", "nature"],
    ["FENCE_WOOD_001", "decorations"],
    ["TREE_EUCALYPTUS_001", "nature"]
  ];

  return assets.map(([assetId, category], index) => ({
    rendererAssetReference: { assetId, category },
    passiveRendererPayload: {
      metadata: {
        adapterProfile: "custom-2.5d-passive",
        lodProfile: index < 4 ? "close" : "gameplay"
      },
      placementData: { anchor: `anchor-${index + 1}` },
      transformData: { orientation: "north", x: index, y: index * 2 },
      visibilityState: index < 6 ? "visible" : "cached"
    }
  }));
}

function buildPreviewOptions() {
  const foundation =
    previewModule.atlasEngineFirstVisualPreviewOutputFoundationDefinition;
  const locationRequest = foundation.locationRequest;
  const renderMode = "day_showcase";
  const resultId = `${foundation.resultId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}::${renderMode}::output-package`
  )}`;
  const renderExecutionId = `${foundation.renderExecutionId}_${stableNumericHash(
    `${resultId}::${renderMode}::render-execution`
  )}`;

  return {
    validateAtlasEngineControlledDemoRenderExecutionFoundation: () => ({
      ok: true,
      atlasControlledDemoRenderExecution: {
        renderExecutionId,
        atlasResultId: resultId,
        renderSummary: {
          location: `${locationRequest.region} (${locationRequest.environmentType})`,
          scene: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
          camera: {
            profile: "coastal-overlook",
            focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
            orientation: "south-east",
            zoom: 1.22
          },
          mode: renderMode
        }
      }
    }),
    validateAtlasEngineShowcaseResultToCustom25DDemoBridge: () => ({
      ok: true,
      atlasShowcaseResultToCustom25DDemoBridge: {
        atlasResultId: resultId,
        previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
        rendererPayload: buildRendererPayload(),
        cameraProfile: "coastal-overlook",
        renderMode,
        verificationState: {
          rendererPayloadCompatibilityValid: true,
          demoObjectAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ]
        },
        bridgeRequest: {
          rendererProfile: "custom-2.5d-passive",
          focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
          zoom: 1.22,
          orientation: "south-east"
        }
      }
    })
  };
}

test("Atlas Engine first visual preview output foundation validates a deterministic passive visual preview result", () => {
  const result =
    previewModule.validateAtlasEngineFirstVisualPreviewOutputFoundation(
      undefined,
      buildPreviewOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstVisualPreviewOutput.renderExecutionId.startsWith(
      "ATLAS_CONTROLLED_DEMO_RENDER_EXECUTION_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisualPreviewOutput.renderStatus.currentState,
    "verified"
  );
  assert.equal(
    result.atlasFirstVisualPreviewOutput.verificationResult
      .verifiedRendererPayloadCount,
    11
  );
});

test("Atlas Engine first visual preview output exposes approved lifecycle and lighting modes", () => {
  const result =
    previewModule.validateAtlasEngineFirstVisualPreviewOutputFoundation(
      undefined,
      buildPreviewOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(
    previewModule.atlasEngineFirstVisualPreviewOutputLifecycleStates,
    ["created", "loading", "rendering", "display_ready", "verified", "closed", "failed"]
  );
  assert.deepEqual(
    previewModule.atlasEngineFirstVisualPreviewOutputLightingModes,
    ["day_showcase", "sunset_showcase", "night_showcase"]
  );
  assert.equal(
    typeof result.atlasFirstVisualPreviewOutput.cameraState.profile,
    "string"
  );
  assert.equal(
    typeof result.atlasFirstVisualPreviewOutput.cameraState.viewpoint,
    "string"
  );
});

test("same render execution produces identical deterministic visual preview output", () => {
  const options = buildPreviewOptions();
  const first =
    previewModule.validateAtlasEngineFirstVisualPreviewOutputFoundation(
      undefined,
      options
    );
  const second =
    previewModule.validateAtlasEngineFirstVisualPreviewOutputFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstVisualPreviewOutput,
    second.atlasFirstVisualPreviewOutput
  );
});

test("Atlas Engine first visual preview output session stays manual-only and rejects duplicate preview activation", () => {
  const creation =
    previewModule.createAtlasEngineFirstVisualPreviewOutputSession(undefined, {
      manual: true,
      isolated: true,
      ...buildPreviewOptions()
    });

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasVisualPreviewSession.currentPreviewState(),
    "created"
  );

  const activation = creation.atlasVisualPreviewSession.showPreview({
    manualPreviewAuthorized: true
  });
  assert.equal(activation.ok, true);
  assert.equal(activation.previewDisplay.renderStatus.currentState, "verified");
  assert.equal(activation.previewDisplay.realMapAttached, false);

  const duplicate = creation.atlasVisualPreviewSession.showPreview({
    manualPreviewAuthorized: true
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_preview_prevented");
});

test("Atlas Engine first visual preview output remains passive and exposes no live runtime handles", () => {
  const result =
    previewModule.validateAtlasEngineFirstVisualPreviewOutputFoundation(
      undefined,
      buildPreviewOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(result.atlasFirstVisualPreviewOutput.metadata.passiveOnly, true);
  assert.equal(
    result.atlasFirstVisualPreviewOutput.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstVisualPreviewOutput.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstVisualPreviewOutput,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstVisualPreviewOutput,
      "realMapAttachment"
    ),
    false
  );
});
