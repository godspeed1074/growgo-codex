import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const displayModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-controlled-preview-display-foundation.mjs"
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

function buildDisplayOptions() {
  const foundation =
    displayModule.atlasEngineControlledPreviewDisplayFoundationDefinition;
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

  return {
    validateAtlasEngineFirstVisualPreviewOutputFoundation: () => ({
      ok: true,
      atlasFirstVisualPreviewOutput: {
        previewId,
        renderExecutionId,
        sceneObjects: buildSceneObjects(),
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
        renderStatus: {
          currentState: "verified"
        },
        verificationResult: {
          verifiedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ],
          verifiedRendererPayloadCount: 11
        },
        metadata: {
          resultId,
          executionId: `${foundation.executionId}_${stableNumericHash(
            `${locationRequest.locationId}::${locationRequest.worldSeed}::${lightingMode}::execution`
          )}`,
          showcaseId: `${foundation.showcaseId}_${stableNumericHash(
            `${locationRequest.locationId}::${locationRequest.worldSeed}`
          )}`,
          rendererProfile: "custom-2.5d-passive",
          previewSceneId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789"
        }
      }
    })
  };
}

test("Atlas Engine controlled preview display validates a deterministic passive display session", () => {
  const result =
    displayModule.validateAtlasEngineControlledPreviewDisplayFoundation(
      undefined,
      buildDisplayOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledPreviewDisplay.displaySessionId.startsWith(
      "ATLAS_CONTROLLED_PREVIEW_DISPLAY_001_"
    ),
    true
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.displayState.currentState,
    "verified"
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.verificationResult
      .verifiedRendererPayloadCount,
    11
  );
});

test("Atlas Engine controlled preview display exposes approved display states and demo objects", () => {
  const result =
    displayModule.validateAtlasEngineControlledPreviewDisplayFoundation(
      undefined,
      buildDisplayOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(displayModule.atlasEngineControlledPreviewDisplayStates, [
    "created",
    "preparing",
    "displaying",
    "verified",
    "hidden",
    "closed",
    "failed"
  ]);
  assert.equal(
    result.atlasControlledPreviewDisplay.verificationResult.verifiedAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.verificationResult.verifiedAssetIds.includes(
      "BUILDING_HOUSE_SMALL_COASTAL_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.verificationResult.verifiedAssetIds.includes(
      "ROAD_STRAIGHT_SMALL_001"
    ),
    true
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.verificationResult.verifiedAssetIds.includes(
      "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("same preview input produces identical deterministic display output", () => {
  const options = buildDisplayOptions();
  const first =
    displayModule.validateAtlasEngineControlledPreviewDisplayFoundation(
      undefined,
      options
    );
  const second =
    displayModule.validateAtlasEngineControlledPreviewDisplayFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasControlledPreviewDisplay,
    second.atlasControlledPreviewDisplay
  );
});

test("Atlas Engine controlled preview display session stays manual-only, can hide, and prevents duplicate display activation", () => {
  const creation =
    displayModule.createAtlasEngineControlledPreviewDisplaySession(undefined, {
      manual: true,
      isolated: true,
      ...buildDisplayOptions()
    });

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasControlledPreviewDisplaySession.currentDisplayState(),
    "created"
  );

  const activation =
    creation.atlasControlledPreviewDisplaySession.showDisplay({
      manualDisplayAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.displayActivation.displayState, "verified");
  assert.equal(activation.displayActivation.realMapAttached, false);

  const duplicate =
    creation.atlasControlledPreviewDisplaySession.showDisplay({
      manualDisplayAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_display_prevented");

  const hidden = creation.atlasControlledPreviewDisplaySession.hideDisplay();
  assert.equal(hidden.ok, true);
  assert.equal(hidden.displayHidden.displayState, "hidden");
});

test("Atlas Engine controlled preview display remains passive and exposes no live runtime handles", () => {
  const result =
    displayModule.validateAtlasEngineControlledPreviewDisplayFoundation(
      undefined,
      buildDisplayOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledPreviewDisplay.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasControlledPreviewDisplay.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledPreviewDisplay,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledPreviewDisplay,
      "realMapAttachment"
    ),
    false
  );
});
