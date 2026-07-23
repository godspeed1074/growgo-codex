import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const visibleCaptureModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-visible-canvas-draw-result-foundation.mjs"
  )
);

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function buildVisibleCaptureOptions() {
  const foundation =
    visibleCaptureModule.atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition;
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
  const drawCaptureId = `${foundation.captureId.replace(
    "ATLAS_FIRST_VISIBLE_CANVAS_DRAW_RESULT_001",
    "ATLAS_FIRST_CONTROLLED_CANVAS_DRAW_001"
  )}_${stableNumericHash(`${activationId}::${lightingMode}::capture`)}`;
  const drawSessionId = `${foundation.drawSessionId}_${stableNumericHash(
    `${drawCaptureId}::${lightingMode}::draw`
  )}`;

  return {
    validateAtlasEngineFirstControlledCanvasDrawFoundation: () => ({
      ok: true,
      atlasFirstControlledCanvasDraw: {
        drawSessionId,
        captureId: drawCaptureId,
        canvasState: {
          width: 1280,
          height: 720,
          pixelRatio: 1,
          currentState: "verified",
          lightingMode,
          clearedBeforeDraw: true,
          liveRuntimeAttached: false
        },
        drawCommands: [
          {
            commandId: `${drawCaptureId}_LIGHTHOUSE_001`,
            kind: "lighthouse-silhouette",
            assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
            outputDeterministic: true
          },
          {
            commandId: `${drawCaptureId}_HOUSE_001`,
            kind: "house-silhouette",
            assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
            outputDeterministic: true
          },
          {
            commandId: `${drawCaptureId}_ROAD_001`,
            kind: "road-path",
            assetId: "ROAD_STRAIGHT_SMALL_001",
            outputDeterministic: true
          },
          {
            commandId: `${drawCaptureId}_TREE_001`,
            kind: "tree",
            assetId: "TREE_EUCALYPTUS_001",
            outputDeterministic: true
          }
        ],
        drawResult: {
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
          },
          outputDeterministic: true,
          drawnCommandCount: 4
        },
        verificationResult: {
          verifiedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ]
        },
        metadata: {
          activationId,
          displaySessionId,
          verificationId: `${foundation.verificationId}_${stableNumericHash(
            `${displaySessionId}::${lightingMode}::verification`
          )}`
        }
      }
    })
  };
}

test("Atlas first visible canvas draw result validates a deterministic visible frame capture", () => {
  const result =
    visibleCaptureModule.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      undefined,
      buildVisibleCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.captureId.startsWith(
      "ATLAS_FIRST_VISIBLE_CANVAS_DRAW_RESULT_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.canvasResult.exists,
    true
  );
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.frameResult.frameProduced,
    true
  );
});

test("Atlas first visible canvas draw result exposes approved states and expected objects", () => {
  const result =
    visibleCaptureModule.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      undefined,
      buildVisibleCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(
    visibleCaptureModule.atlasEngineFirstVisibleCanvasDrawResultStates,
    ["created", "capturing", "captured", "verified", "closed", "failed"]
  );
  assert.deepEqual(
    result.atlasFirstVisibleCanvasDrawResult.frameResult.includedAssetIds,
    [
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});

test("same draw session produces identical deterministic visible capture output", () => {
  const options = buildVisibleCaptureOptions();
  const first =
    visibleCaptureModule.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      undefined,
      options
    );
  const second =
    visibleCaptureModule.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstVisibleCanvasDrawResult,
    second.atlasFirstVisibleCanvasDrawResult
  );
});

test("Atlas first visible canvas draw result session stays manual-only and rejects duplicate capture", () => {
  const creation =
    visibleCaptureModule.createAtlasEngineFirstVisibleCanvasDrawResultSession(
      undefined,
      { manual: true, isolated: true, ...buildVisibleCaptureOptions() }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasFirstVisibleCanvasDrawResultSession.currentCaptureState(),
    "created"
  );

  const capture =
    creation.atlasFirstVisibleCanvasDrawResultSession.captureFrame({
      manualCaptureAuthorized: true
    });
  assert.equal(capture.ok, true);
  assert.equal(capture.visibleCaptureResult.captureState, "verified");
  assert.equal(capture.visibleCaptureResult.liveMapAttached, false);

  const duplicate =
    creation.atlasFirstVisibleCanvasDrawResultSession.captureFrame({
      manualCaptureAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_visible_capture_prevented");

  const cleanup =
    creation.atlasFirstVisibleCanvasDrawResultSession.closeCapture();
  assert.equal(cleanup.ok, true);
  assert.equal(
    cleanup.cleanupStatus,
    "atlas-first-visible-canvas-draw-result-session-closed"
  );
});

test("Atlas first visible canvas draw result remains passive and exposes no live runtime handles", () => {
  const result =
    visibleCaptureModule.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      undefined,
      buildVisibleCaptureOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstVisibleCanvasDrawResult.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstVisibleCanvasDrawResult,
      "runtimeWorld"
    ),
    false
  );
});
