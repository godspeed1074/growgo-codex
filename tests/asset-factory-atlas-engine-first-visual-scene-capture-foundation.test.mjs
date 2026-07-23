import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const captureModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-visual-scene-capture-foundation.mjs"
  )
);

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function buildSceneObjects() {
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
    objectId: `${assetId}_${String(index + 1).padStart(3, "0")}`,
    assetId,
    category,
    lodProfile: index < 4 ? "close" : "gameplay",
    placementData: { anchor: `anchor-${index + 1}` },
    visibilityState: index < 6 ? "visible" : "cached",
    transformData: { orientation: "north", x: index, y: index * 2 }
  }));
}

function buildCaptureOptions() {
  const foundation =
    captureModule.atlasEngineFirstVisualSceneCaptureFoundationDefinition;
  const locationRequest = foundation.locationRequest;
  const lightingMode = "day_showcase";
  const resultId = `${foundation.resultId}_${stableNumericHash(
    `${locationRequest.locationId}::${locationRequest.worldSeed}::${lightingMode}::output-package`
  )}`;
  const renderExecutionId = `${foundation.renderExecutionId}_${stableNumericHash(
    `${resultId}::${lightingMode}::render-execution`
  )}`;
  const previewId = `${foundation.previewId}_${stableNumericHash(
    `${renderExecutionId}::${lightingMode}::visual-preview`
  )}`;
  const displaySessionId = `${foundation.displaySessionId}_${stableNumericHash(
    `${previewId}::${lightingMode}::display`
  )}`;
  const activationId = `${foundation.activationId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::activation`
  )}`;

  return {
    validateAtlasEngineControlledVisualDemoActivationFoundation: () => ({
      ok: true,
      atlasControlledVisualDemoActivation: {
        activationId,
        displaySessionId,
        verificationId: `${foundation.verificationId}_${stableNumericHash(
          `${displaySessionId}::${lightingMode}::verification`
        )}`,
        displayResult: {
          previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
          sceneObjects: buildSceneObjects(),
          cameraVerification: {
            profileValid: true,
            focusTargetValid: true,
            orientationValid: true,
            zoomValid: true,
            profile: "coastal-overlook",
            focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
            orientation: "south-east",
            zoom: 1.22
          },
          lightingVerification: {
            lightingProfileValid: true,
            currentMode: lightingMode,
            supportedModes: ["day_showcase", "sunset_showcase", "night_showcase"],
            appearanceProfiles: [
              "DAY_COASTAL_LIGHTHOUSE",
              "SUNSET_COASTAL_LIGHTHOUSE",
              "NIGHT_COASTAL_LIGHTHOUSE"
            ]
          },
          renderVerification: {
            rendererPayloadValid: true,
            rendererProfile: "custom-2.5d-passive",
            objectCount: 11,
            verifiedAssetIds: [
              "LIGHTHOUSE_ISLAND_ROCKY_001",
              "BUILDING_HOUSE_SMALL_COASTAL_001",
              "ROAD_STRAIGHT_SMALL_001",
              "TREE_EUCALYPTUS_001"
            ]
          },
          displayState: "verified"
        }
      }
    })
  };
}

test("Atlas first visual scene capture validates a deterministic passive capture package", () => {
  const result =
    captureModule.validateAtlasEngineFirstVisualSceneCaptureFoundation(
      undefined,
      buildCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstVisualSceneCapture.captureId.startsWith(
      "ATLAS_FIRST_VISUAL_SCENE_CAPTURE_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.captureState.currentState,
    "verified"
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.captureSummary.objectCount,
    11
  );
});

test("Atlas first visual scene capture exposes approved capture states and demo objects", () => {
  const result =
    captureModule.validateAtlasEngineFirstVisualSceneCaptureFoundation(
      undefined,
      buildCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(captureModule.atlasEngineFirstVisualSceneCaptureStates, [
    "created",
    "preparing",
    "drawing",
    "captured",
    "verified",
    "closed",
    "failed"
  ]);
  assert.equal(
    result.atlasFirstVisualSceneCapture.verificationResult.verifiedAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.verificationResult.verifiedAssetIds.includes(
      "BUILDING_HOUSE_SMALL_COASTAL_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.verificationResult.verifiedAssetIds.includes(
      "ROAD_STRAIGHT_SMALL_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.verificationResult.verifiedAssetIds.includes(
      "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("same activation input produces identical deterministic capture output", () => {
  const options = buildCaptureOptions();
  const first =
    captureModule.validateAtlasEngineFirstVisualSceneCaptureFoundation(
      undefined,
      options
    );
  const second =
    captureModule.validateAtlasEngineFirstVisualSceneCaptureFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstVisualSceneCapture,
    second.atlasFirstVisualSceneCapture
  );
});

test("Atlas first visual scene capture session stays manual-only and rejects duplicate capture", () => {
  const creation =
    captureModule.createAtlasEngineFirstVisualSceneCaptureSession(undefined, {
      manual: true,
      isolated: true,
      ...buildCaptureOptions()
    });

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasFirstVisualSceneCaptureSession.currentCaptureState(),
    "created"
  );

  const activation =
    creation.atlasFirstVisualSceneCaptureSession.startCapture({
      manualCaptureAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.captureResult.captureState, "verified");
  assert.equal(activation.captureResult.realMapAttached, false);

  const duplicate =
    creation.atlasFirstVisualSceneCaptureSession.startCapture({
      manualCaptureAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_capture_prevented");
});

test("Atlas first visual scene capture remains passive and exposes no live runtime handles", () => {
  const result =
    captureModule.validateAtlasEngineFirstVisualSceneCaptureFoundation(
      undefined,
      buildCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstVisualSceneCapture.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstVisualSceneCapture.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstVisualSceneCapture,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstVisualSceneCapture,
      "realMapAttachment"
    ),
    false
  );
});
