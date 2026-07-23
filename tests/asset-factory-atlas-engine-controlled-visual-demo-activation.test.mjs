import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const activationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-controlled-visual-demo-activation.mjs"
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

function buildActivationOptions() {
  const foundation =
    activationModule.atlasEngineControlledVisualDemoActivationFoundationDefinition;
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
  const verificationId = `${foundation.verificationId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::verification`
  )}`;

  return {
    validateAtlasEngineFirstSceneVerificationFoundation: () => ({
      ok: true,
      atlasFirstSceneVerification: {
        verificationId,
        displaySessionId,
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
        resultState: {
          currentState: "validated"
        },
        metadata: {
          previewId,
          renderExecutionId,
          previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789"
        }
      }
    })
  };
}

test("Atlas controlled visual demo activation validates a deterministic passive activation package", () => {
  const result =
    activationModule.validateAtlasEngineControlledVisualDemoActivationFoundation(
      undefined,
      buildActivationOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledVisualDemoActivation.activationId.startsWith(
      "ATLAS_CONTROLLED_VISUAL_DEMO_ACTIVATION_001_"
    ),
    true
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.activationState.currentState,
    "verified"
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.displayResult.renderVerification.objectCount,
    11
  );
});

test("Atlas controlled visual demo activation exposes approved activation states and demo objects", () => {
  const result =
    activationModule.validateAtlasEngineControlledVisualDemoActivationFoundation(
      undefined,
      buildActivationOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(
    activationModule.atlasEngineControlledVisualDemoActivationStates,
    ["requested", "authorizing", "activated", "displaying", "verified", "closed", "failed"]
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.displayResult.renderVerification.verifiedAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.displayResult.renderVerification.verifiedAssetIds.includes(
      "BUILDING_HOUSE_SMALL_COASTAL_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.displayResult.renderVerification.verifiedAssetIds.includes(
      "ROAD_STRAIGHT_SMALL_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.displayResult.renderVerification.verifiedAssetIds.includes(
      "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("same verified scene produces identical deterministic activation output", () => {
  const options = buildActivationOptions();
  const first =
    activationModule.validateAtlasEngineControlledVisualDemoActivationFoundation(
      undefined,
      options
    );
  const second =
    activationModule.validateAtlasEngineControlledVisualDemoActivationFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasControlledVisualDemoActivation,
    second.atlasControlledVisualDemoActivation
  );
});

test("Atlas controlled visual demo activation session requires manualStart and rejects duplicate activation", () => {
  const creation =
    activationModule.createAtlasEngineControlledVisualDemoActivationSession(
      undefined,
      { manual: true, isolated: true, ...buildActivationOptions() }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasControlledVisualDemoActivationSession.currentActivationState(),
    "requested"
  );

  const activation =
    creation.atlasControlledVisualDemoActivationSession.startActivation({
      manualStart: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.activationResult.activationState, "verified");
  assert.equal(activation.activationResult.realMapAttached, false);

  const duplicate =
    creation.atlasControlledVisualDemoActivationSession.startActivation({
      manualStart: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_activation_prevented");
});

test("Atlas controlled visual demo activation remains passive and exposes no live runtime handles", () => {
  const result =
    activationModule.validateAtlasEngineControlledVisualDemoActivationFoundation(
      undefined,
      buildActivationOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledVisualDemoActivation.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasControlledVisualDemoActivation.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledVisualDemoActivation,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledVisualDemoActivation,
      "realMapAttachment"
    ),
    false
  );
});
