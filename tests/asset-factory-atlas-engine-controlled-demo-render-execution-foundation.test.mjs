import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const renderExecutionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-controlled-demo-render-execution-foundation.mjs"
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

function buildBridgeStubOptions() {
  const foundation =
    renderExecutionModule.atlasEngineControlledDemoRenderExecutionFoundationDefinition;
  const locationRequest = foundation.locationRequest;
  const renderMode = "day_showcase";
  const resultId = `${foundation.resultId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}::${renderMode}::output-package`
  )}`;
  const bridgeHash = `ATLAS_SHOWCASE_RESULT_TO_CUSTOM_25D_DEMO_BRIDGE_001_${stableNumericHash(
    `${resultId}::${renderMode}::bridge`
  )}`;

  return {
    validateAtlasEngineShowcaseResultToCustom25DDemoBridge: () => ({
      ok: true,
      atlasShowcaseResultToCustom25DDemoBridge: {
        atlasResultId: resultId,
        previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
        rendererPayload: buildRendererPayload(),
        cameraProfile: "coastal-overlook",
        renderMode,
        verificationState: {
          rendererVerificationCompatible: true,
          rendererPayloadCompatibilityValid: true,
          demoObjectAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ]
        },
        bridgeRequest: {
          focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
          zoom: 1.22,
          orientation: "south-east"
        },
        deterministicVerification: {
          bridgeHash
        }
      }
    })
  };
}

test("Atlas Engine controlled demo render execution foundation validates a deterministic passive render execution package", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation(
      undefined,
      buildBridgeStubOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledDemoRenderExecution.atlasResultId.startsWith(
      "ATLAS_SHOWCASE_OUTPUT_PACKAGE_001_"
    ),
    true
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.renderState.currentState,
    "completed"
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.verificationResult
      .verifiedRendererPayloadCount,
    11
  );
});

test("Atlas Engine controlled demo render execution exposes the approved render states and render summary", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation(
      undefined,
      buildBridgeStubOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(
    renderExecutionModule.atlasEngineControlledDemoRenderExecutionStates,
    ["created", "preparing", "executing", "verified", "completed", "failed", "closed"]
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.location,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.scene,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.camera.profile,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.mode,
    "string"
  );
});

test("same Atlas result produces identical deterministic controlled demo render execution output", () => {
  const options = buildBridgeStubOptions();
  const first =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation(
      undefined,
      options
    );
  const second =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasControlledDemoRenderExecution,
    second.atlasControlledDemoRenderExecution
  );
});

test("Atlas Engine controlled demo render execution session stays manual-only and rejects duplicate render execution", () => {
  const creation =
    renderExecutionModule.createAtlasEngineControlledDemoRenderExecutionSession(
      undefined,
      { manual: true, isolated: true, ...buildBridgeStubOptions() }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasControlledDemoRenderSession.currentRenderState(),
    "created"
  );

  const activation =
    creation.atlasControlledDemoRenderSession.startRenderExecution({
      manualRenderExecutionAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.renderActivation.renderState, "completed");
  assert.equal(activation.renderActivation.realMapAttached, false);

  const duplicate =
    creation.atlasControlledDemoRenderSession.startRenderExecution({
      manualRenderExecutionAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_render_execution_prevented");
});

test("Atlas Engine controlled demo render execution remains passive and exposes no live runtime handles", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation(
      undefined,
      buildBridgeStubOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledDemoRenderExecution,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledDemoRenderExecution,
      "realMapAttachment"
    ),
    false
  );
});
