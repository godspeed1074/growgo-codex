import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const drawModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-controlled-canvas-draw-test.mjs"
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

function buildDrawOptions() {
  const foundation =
    drawModule.atlasEngineFirstControlledCanvasDrawFoundationDefinition;
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
  const captureId = `${foundation.captureId}_${stableNumericHash(
    `${activationId}::${lightingMode}::capture`
  )}`;

  return {
    validateAtlasEngineFirstVisualSceneCaptureFoundation: () => ({
      ok: true,
      atlasFirstVisualSceneCapture: {
        captureId,
        activationId,
        displaySessionId,
        sceneResult: {
          previewSceneId:
            "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001_0123456789",
          sceneObjects: buildSceneObjects(),
          visibleState: "verified-visible",
          objectCount: 11
        },
        captureState: {
          currentState: "verified"
        },
        verificationResult: {
          activationSessionValid: true,
          displaySessionValid: true,
          sceneObjectsValid: true,
          cameraStateValid: true,
          lightingStateValid: true,
          rendererOutputValid: true,
          verifiedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ]
        },
        captureSummary: {
          visibleState: "verified-visible",
          objectCount: 11,
          cameraResult: {
            profile: "coastal-overlook",
            focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
            orientation: "south-east",
            zoom: 1.22
          },
          lightingResult: {
            currentMode: lightingMode,
            appearanceProfiles: [
              "DAY_COASTAL_LIGHTHOUSE",
              "SUNSET_COASTAL_LIGHTHOUSE",
              "NIGHT_COASTAL_LIGHTHOUSE"
            ]
          },
          rendererResult: {
            rendererProfile: "custom-2.5d-passive",
            payloadValid: true
          }
        },
        metadata: {
          verificationId: `${foundation.verificationId}_${stableNumericHash(
            `${displaySessionId}::${lightingMode}::verification`
          )}`
        }
      }
    })
  };
}

test("Atlas first controlled canvas draw validates a deterministic passive draw package", () => {
  const result =
    drawModule.validateAtlasEngineFirstControlledCanvasDrawFoundation(
      undefined,
      buildDrawOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstControlledCanvasDraw.drawSessionId.startsWith(
      "ATLAS_FIRST_CONTROLLED_CANVAS_DRAW_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstControlledCanvasDraw.drawResult.objectCount,
    11
  );
  assert.equal(
    result.atlasFirstControlledCanvasDraw.canvasState.currentState,
    "verified"
  );
});

test("Atlas first controlled canvas draw exposes approved draw states and commands", () => {
  const result =
    drawModule.validateAtlasEngineFirstControlledCanvasDrawFoundation(
      undefined,
      buildDrawOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(drawModule.atlasEngineFirstControlledCanvasDrawStates, [
    "created",
    "preparing",
    "drawing",
    "drawn",
    "verified",
    "closed",
    "failed"
  ]);
  assert.deepEqual(
    result.atlasFirstControlledCanvasDraw.drawCommands.map(
      (drawCommand) => drawCommand.kind
    ),
    ["lighthouse-silhouette", "house-silhouette", "road-path", "tree"]
  );
});

test("same activation input produces identical deterministic draw output", () => {
  const options = buildDrawOptions();
  const first = drawModule.validateAtlasEngineFirstControlledCanvasDrawFoundation(
    undefined,
    options
  );
  const second = drawModule.validateAtlasEngineFirstControlledCanvasDrawFoundation(
    undefined,
    options
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstControlledCanvasDraw,
    second.atlasFirstControlledCanvasDraw
  );
});

test("Atlas first controlled canvas draw session stays manual-only and rejects duplicate draw", () => {
  const creation = drawModule.createAtlasEngineFirstControlledCanvasDrawSession(
    undefined,
    { manual: true, isolated: true, ...buildDrawOptions() }
  );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasFirstControlledCanvasDrawSession.currentDrawState(),
    "created"
  );

  const activation =
    creation.atlasFirstControlledCanvasDrawSession.startDraw({
      manualDrawAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.drawActivation.drawState, "verified");
  assert.equal(activation.drawActivation.liveMapAttached, false);

  const duplicate =
    creation.atlasFirstControlledCanvasDrawSession.startDraw({
      manualDrawAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_draw_session_prevented");

  const cleanup =
    creation.atlasFirstControlledCanvasDrawSession.clearCanvas();
  assert.equal(cleanup.ok, true);
  assert.equal(
    cleanup.cleanupStatus,
    "atlas-first-controlled-canvas-draw-session-closed"
  );
});

test("Atlas first controlled canvas draw remains passive and exposes no live runtime handles", () => {
  const result =
    drawModule.validateAtlasEngineFirstControlledCanvasDrawFoundation(
      undefined,
      buildDrawOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstControlledCanvasDraw.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasFirstControlledCanvasDraw.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstControlledCanvasDraw.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstControlledCanvasDraw,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstControlledCanvasDraw,
      "realMapAttachment"
    ),
    false
  );
});
