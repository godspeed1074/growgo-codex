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

function buildBridgeValidationOptions() {
  const foundation =
    bridgeModule.atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition;
  const locationRequest = foundation.locationRequest;
  const renderMode = "day_showcase";
  const showcaseId = `${foundation.showcaseId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}`
  )}`;
  const executionId = `${foundation.executionId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}::${renderMode}::execution`
  )}`;
  const resultId = `${foundation.resultId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}::${renderMode}::output-package`
  )}`;
  const rendererPayload = buildRendererPayload();

  return {
    validateAtlasEngineShowcaseOutputPackageFoundation: () => ({
      ok: true,
      atlasShowcaseOutputPackage: {
        resultId,
        executionId,
        showcaseId,
        worldSummary: {
          biome: "coastal",
          terrain: "coastal",
          qualityProfile: "WORLD_QUALITY_PROFILE_COASTAL_001",
          generatedCounts: {
            landmarks: 1,
            structures: 2,
            environment: 8
          }
        },
        presentationSummary: {
          renderMode,
          cameraProfile: "coastal-overlook",
          focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
          zoom: 1.22,
          orientation: "south-east"
        },
        metadata: {
          sourceTrace: {
            previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789"
          }
        }
      }
    }),
    validateAtlasEnginePreviewRendererIntegrationFoundation: () => ({
      ok: true,
      atlasPreviewRendererIntegration: {
        rendererRequest: {
          rendererProfile: "custom-2.5d-passive",
          rendererPayload
        },
        verificationResult: {
          verifiedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ],
          rendererVerificationCompatible: true
        }
      }
    }),
    validateSyntheticWorldToCustom25DPassiveRendererBridge: () => ({
      ok: true,
      custom25DRendererSceneConsumer: {
        rendererPayloads: [
          { rendererAssetReference: { assetId: "LIGHTHOUSE_ISLAND_ROCKY_001" } },
          {
            rendererAssetReference: {
              assetId: "BUILDING_HOUSE_SMALL_COASTAL_001"
            }
          },
          { rendererAssetReference: { assetId: "ROAD_STRAIGHT_SMALL_001" } },
          { rendererAssetReference: { assetId: "TREE_EUCALYPTUS_001" } }
        ]
      }
    })
  };
}

test("Atlas Engine showcase result to Custom 2.5D demo bridge validates a deterministic passive renderer request", () => {
  const result = bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    undefined,
    buildBridgeValidationOptions()
  );

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
  const result = bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    undefined,
    buildBridgeValidationOptions()
  );

  assert.equal(result.ok, true);
  assert.deepEqual(
    bridgeModule.atlasEngineShowcaseResultToCustom25DDemoBridgePreviewModes,
    ["day_showcase", "sunset_showcase", "night_showcase"]
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState.demoObjectAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState.demoObjectAssetIds.includes(
      "BUILDING_HOUSE_SMALL_COASTAL_001"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState.demoObjectAssetIds.includes(
      "ROAD_STRAIGHT_SMALL_001"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseResultToCustom25DDemoBridge.verificationState.demoObjectAssetIds.includes(
      "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("same Atlas result produces identical deterministic Custom 2.5D demo bridge output", () => {
  const options = buildBridgeValidationOptions();
  const first = bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    undefined,
    options
  );
  const second = bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    undefined,
    options
  );

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
      { manual: true, isolated: true, ...buildBridgeValidationOptions() }
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
  const result = bridgeModule.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    undefined,
    buildBridgeValidationOptions()
  );

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
