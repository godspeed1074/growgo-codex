import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const verificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-scene-verification-foundation.mjs"
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

function buildVerificationOptions() {
  const foundation =
    verificationModule.atlasEngineFirstSceneVerificationFoundationDefinition;
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

  return {
    validateAtlasEngineControlledPreviewDisplayFoundation: () => ({
      ok: true,
      atlasControlledPreviewDisplay: {
        displaySessionId,
        previewId,
        renderExecutionId,
        sceneData: {
          previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
          rendererProfile: "custom-2.5d-passive",
          sceneObjects: buildSceneObjects(),
          objectCount: 11,
          duplicateSessionsPrevented: true
        },
        cameraState: {
          profile: "coastal-overlook",
          focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
          orientation: "south-east",
          zoom: 1.22,
          viewpoint:
            "coastal-overlook:LIGHTHOUSE_ISLAND_ROCKY_001:south-east:1.22"
        },
        lightingState: {
          currentMode: lightingMode,
          supportedModes: ["day_showcase", "sunset_showcase", "night_showcase"],
          appearanceProfiles: [
            "DAY_COASTAL_LIGHTHOUSE",
            "SUNSET_COASTAL_LIGHTHOUSE",
            "NIGHT_COASTAL_LIGHTHOUSE"
          ]
        },
        verificationResult: {
          verifiedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ]
        }
      }
    })
  };
}

test("Atlas Engine first scene verification validates a deterministic passive verification package", () => {
  const result =
    verificationModule.validateAtlasEngineFirstSceneVerificationFoundation(
      undefined,
      buildVerificationOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstSceneVerification.verificationId.startsWith(
      "ATLAS_FIRST_SCENE_VERIFICATION_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstSceneVerification.resultState.currentState,
    "validated"
  );
  assert.equal(
    result.atlasFirstSceneVerification.renderVerification.objectCount,
    11
  );
});

test("Atlas Engine first scene verification exposes approved verification states and demo objects", () => {
  const result =
    verificationModule.validateAtlasEngineFirstSceneVerificationFoundation(
      undefined,
      buildVerificationOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(verificationModule.atlasEngineFirstSceneVerificationStates, [
    "created",
    "checking",
    "validated",
    "failed",
    "closed"
  ]);
  assert.equal(
    result.atlasFirstSceneVerification.renderVerification.verifiedAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstSceneVerification.renderVerification.verifiedAssetIds.includes(
      "BUILDING_HOUSE_SMALL_COASTAL_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstSceneVerification.renderVerification.verifiedAssetIds.includes(
      "ROAD_STRAIGHT_SMALL_001"
    ),
    true
  );
  assert.equal(
    result.atlasFirstSceneVerification.renderVerification.verifiedAssetIds.includes(
      "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("same display session produces identical deterministic verification output", () => {
  const options = buildVerificationOptions();
  const first =
    verificationModule.validateAtlasEngineFirstSceneVerificationFoundation(
      undefined,
      options
    );
  const second =
    verificationModule.validateAtlasEngineFirstSceneVerificationFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstSceneVerification,
    second.atlasFirstSceneVerification
  );
});

test("Atlas Engine first scene verification session stays manual-only and rejects duplicate verification activation", () => {
  const creation =
    verificationModule.createAtlasEngineFirstSceneVerificationSession(undefined, {
      manual: true,
      isolated: true,
      ...buildVerificationOptions()
    });

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasFirstSceneVerificationSession.currentVerificationState(),
    "created"
  );

  const activation =
    creation.atlasFirstSceneVerificationSession.startVerification({
      manualVerificationAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(
    activation.verificationActivation.resultState.currentState,
    "validated"
  );
  assert.equal(activation.verificationActivation.realMapAttached, false);

  const duplicate =
    creation.atlasFirstSceneVerificationSession.startVerification({
      manualVerificationAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_verification_prevented");
});

test("Atlas Engine first scene verification remains passive and exposes no live runtime handles", () => {
  const result =
    verificationModule.validateAtlasEngineFirstSceneVerificationFoundation(
      undefined,
      buildVerificationOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstSceneVerification.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasFirstSceneVerification.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstSceneVerification.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstSceneVerification,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstSceneVerification,
      "realMapAttachment"
    ),
    false
  );
});
