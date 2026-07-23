import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const previewMountModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-manual-browser-visible-preview-mount.mjs"
  )
);

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function buildPreviewMountOptions() {
  const foundation =
    previewMountModule.atlasEngineFirstManualBrowserVisiblePreviewMountFoundationDefinition;
  const locationRequest = foundation.locationRequest;
  const lightingMode = "day_showcase";
  const drawSessionId = `${foundation.drawSessionId}_${stableNumericHash(
    `ATLAS_FIRST_CONTROLLED_CANVAS_DRAW_001_${stableNumericHash(
      `ATLAS_CONTROLLED_VISUAL_DEMO_ACTIVATION_001_${stableNumericHash(
        `ATLAS_CONTROLLED_PREVIEW_DISPLAY_001_${stableNumericHash(
          `ATLAS_FIRST_VISUAL_SCENE_CAPTURE_001::${lightingMode}::capture`
        )}::${lightingMode}::activation`
      )}::${lightingMode}::capture`
    )}::${lightingMode}::draw`
  )}`;
  const drawResultId = `${foundation.drawResultId}_${stableNumericHash(
    `${drawSessionId}::${lightingMode}::visible-capture`
  )}`;

  return {
    validateAtlasEngineFirstVisibleCanvasDrawResultFoundation: () => ({
      ok: true,
      atlasFirstVisibleCanvasDrawResult: {
        captureId: drawResultId,
        drawSessionId,
        canvasResult: {
          exists: true,
          width: 1280,
          height: 720,
          pixelRatio: 1,
          lightingMode,
          drawCommandCount: 4,
          drawCommandsExecuted: true
        },
        frameResult: {
          frameProduced: true,
          visibleState: "verified-visible",
          objectCount: foundation.expectedSceneObjectCount,
          includedAssetIds: [
            "LIGHTHOUSE_ISLAND_ROCKY_001",
            "BUILDING_HOUSE_SMALL_COASTAL_001",
            "ROAD_STRAIGHT_SMALL_001",
            "TREE_EUCALYPTUS_001"
          ],
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
          deterministicOutput: true
        },
        verificationState: {
          currentState: "verified",
          cleanupSuccessful: true
        }
      }
    })
  };
}

test("Atlas first manual browser visible preview mount validates a deterministic preview mount package", () => {
  const result =
    previewMountModule.validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      undefined,
      buildPreviewMountOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.previewMountId.startsWith(
      "ATLAS_FIRST_MANUAL_BROWSER_VISIBLE_PREVIEW_MOUNT_001_"
    ),
    true
  );
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.canvasElement.exists,
    true
  );
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.displayResult.frameDisplayed,
    true
  );
});

test("Atlas first manual browser visible preview mount exposes approved states and placeholder objects", () => {
  const result =
    previewMountModule.validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      undefined,
      buildPreviewMountOptions()
    );

  assert.equal(result.ok, true);
  assert.deepEqual(
    previewMountModule.atlasEngineFirstManualBrowserVisiblePreviewMountStates,
    [
      "created",
      "preparing",
      "mounted",
      "displaying",
      "verified",
      "unmounted",
      "closed",
      "failed"
    ]
  );
  assert.deepEqual(
    result.atlasFirstManualBrowserVisiblePreviewMount.displayResult
      .placeholderObjects,
    [
      "LIGHTHOUSE_PLACEHOLDER",
      "HOUSE_PLACEHOLDER",
      "ROAD_PLACEHOLDER",
      "TREE_PLACEHOLDER"
    ]
  );
});

test("same draw result produces identical deterministic preview mount output", () => {
  const options = buildPreviewMountOptions();
  const first =
    previewMountModule.validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      undefined,
      options
    );
  const second =
    previewMountModule.validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      undefined,
      options
    );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasFirstManualBrowserVisiblePreviewMount,
    second.atlasFirstManualBrowserVisiblePreviewMount
  );
});

test("Atlas first manual browser visible preview mount session stays manual-only and rejects duplicate mount", () => {
  const creation =
    previewMountModule.createAtlasEngineFirstManualBrowserVisiblePreviewMountSession(
      undefined,
      { manual: true, isolated: true, ...buildPreviewMountOptions() }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasFirstManualBrowserVisiblePreviewMountSession.currentMountState(),
    "created"
  );

  const mount =
    creation.atlasFirstManualBrowserVisiblePreviewMountSession.startPreviewMount(
      { manualPreviewStart: true }
    );
  assert.equal(mount.ok, true);
  assert.equal(mount.previewMountResult.mountState, "verified");
  assert.equal(mount.previewMountResult.liveMapAttached, false);

  const duplicate =
    creation.atlasFirstManualBrowserVisiblePreviewMountSession.startPreviewMount(
      { manualPreviewStart: true }
    );
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_preview_mount_prevented");

  const cleanup =
    creation.atlasFirstManualBrowserVisiblePreviewMountSession.unmountPreview();
  assert.equal(cleanup.ok, true);
  assert.equal(
    cleanup.cleanupStatus,
    "atlas-first-manual-browser-visible-preview-mount-session-closed"
  );
});

test("Atlas first manual browser visible preview mount remains passive and exposes no live runtime handles", () => {
  const result =
    previewMountModule.validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      undefined,
      buildPreviewMountOptions()
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.metadata.passiveOnly,
    true
  );
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.metadata.gpsConnected,
    false
  );
  assert.equal(
    result.atlasFirstManualBrowserVisiblePreviewMount.metadata.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasFirstManualBrowserVisiblePreviewMount,
      "runtimeWorld"
    ),
    false
  );
});
