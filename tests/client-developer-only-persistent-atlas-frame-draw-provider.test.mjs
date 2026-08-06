import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasFrameDrawProvider,
  drawPersistentAtlasFrame,
  getPersistentAtlasFrameDrawStatus,
  invalidatePersistentAtlasDrawProvider,
  releasePersistentAtlasDrawState,
  validatePersistentAtlasDrawInputs
} from "../client/developer-only-persistent-atlas-frame-draw-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-frame-draw-provider.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createFrozenSnapshot(overrides = {}) {
  return Object.freeze({
    schemaId: "GROWGO_PERSISTENT_ATLAS_FRAME_SNAPSHOT_001",
    snapshotId: "SNAP_001",
    snapshotGenerationId: "SNAP_GEN_001",
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    lifecycleGenerationId: "GEN_A",
    surfaceOwnerId: "SURFACE_OWNER_A",
    regionId: "BELLARINE",
    packageId: "atlas-bellarine",
    packageVersion: "2026.08.06",
    packageFingerprint: "fingerprint-a",
    recipeId: "coastal-default",
    recipeVersion: "recipe-v001",
    selectorSeed: "seed-a",
    redrawReason: "initial_attach",
    snapshotCreatedAt: "2026-08-06T12:00:00.000Z",
    viewportWidth: 640,
    viewportHeight: 360,
    pixelRatio: 2,
    zoom: 14,
    centerLatitude: -38.15,
    centerLongitude: 144.6,
    pixelOriginX: 100,
    pixelOriginY: 200,
    canvasLayerPositionX: 12.4,
    canvasLayerPositionY: 34.6,
    projectedViewportBounds: Object.freeze({
      northWestLatitude: -38.2,
      northWestLongitude: 144.5,
      southEastLatitude: -38.1,
      southEastLongitude: 144.7
    }),
    scalarPayload: Object.freeze({
      viewportLabel: "atlas-main"
    }),
    ...overrides
  });
}

function createHarness({
  snapshotValidator = null,
  retainedSurfaceValidator = null,
  lifecycleOwnerValidator = null,
  authorizationValidator = null,
  drawProvider = null,
  mutableDrawStateProvider = null,
  canvasPositionAdapter = null,
  drawStateReleaseProvider = null
} = {}) {
  const calls = {
    draw: 0,
    mutableState: 0,
    position: 0,
    release: 0
  };

  const canvas = {
    id: "canvas-a",
    className: "custom-25d-map-canvas",
    style: { transform: "" }
  };
  const pane = { id: "pane-a" };
  const snapshot = createFrozenSnapshot();
  const lifecycleOwner = { id: "lifecycle-a" };
  const authorization = { token: "AUTH_A" };

  const provider = createPersistentAtlasFrameDrawProvider({
    snapshotValidator:
      snapshotValidator ??
      (({ snapshot: inputSnapshot, drawGenerationId }) => ({
        ok: true,
        snapshotId: inputSnapshot.snapshotId,
        snapshotGenerationId: inputSnapshot.snapshotGenerationId,
        sessionId: inputSnapshot.sessionId,
        mapIdentityId: inputSnapshot.mapIdentityId,
        lifecycleOwnerId: inputSnapshot.lifecycleOwnerId,
        lifecycleGenerationId: inputSnapshot.lifecycleGenerationId,
        surfaceOwnerId: inputSnapshot.surfaceOwnerId,
        drawGenerationId
      })),
    retainedSurfaceValidator:
      retainedSurfaceValidator ??
      (() => ({
        ok: true,
        canvasIdentityId: "CANVAS_A",
        paneIdentityId: "PANE_A",
        canvas,
        pane,
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      })),
    lifecycleOwnerValidator:
      lifecycleOwnerValidator ??
      (() => ({
        ok: true,
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      })),
    authorizationValidator:
      authorizationValidator ??
      (({ drawGenerationId, redrawReason }) => ({
        ok: true,
        authorized: true,
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        drawGenerationId,
        redrawReason
      })),
    snapshotAwareDrawProvider:
      drawProvider ??
      (({ canvas: drawCanvas, snapshot, mutableDrawState }) => {
        calls.draw += 1;
        drawCanvas.drawn = true;
        mutableDrawState.wasUsed = true;
        return { reasonCode: "FRAME_DRAW_COMPLETED" };
      }),
    mutableDrawStateProvider:
      mutableDrawStateProvider ??
      (({ snapshotScalars, drawGenerationId, redrawReason }) => {
        calls.mutableState += 1;
        return {
          snapshotScalars,
          drawGenerationId,
          redrawReason,
          canvasLayerPosition: {
            x: snapshotScalars.canvasLayerPosition.x,
            y: snapshotScalars.canvasLayerPosition.y
          }
        };
      }),
    canvasPositionAdapter:
      canvasPositionAdapter ??
      (({ canvas: drawCanvas, mutableCanvasLayerPosition }) => {
        calls.position += 1;
        drawCanvas.position = {
          x: mutableCanvasLayerPosition.x,
          y: mutableCanvasLayerPosition.y
        };
        return { positionAdapterPath: "direct_leaflet_position" };
      }),
    drawStateReleaseProvider:
      drawStateReleaseProvider ??
      (() => {
        calls.release += 1;
      }),
    timeProvider: (() => {
      const timestamps = [
        "2026-08-06T12:00:00.000Z",
        "2026-08-06T12:00:00.010Z",
        "2026-08-06T12:00:00.020Z",
        "2026-08-06T12:00:00.030Z"
      ];
      let index = 0;
      return () => timestamps[Math.min(index++, timestamps.length - 1)];
    })()
  });

  return {
    provider,
    calls,
    canvas,
    pane,
    snapshot,
    lifecycleOwner,
    authorization,
    retainedSurface: { canvas, pane },
    drawGenerationId: "DRAW_GEN_001"
  };
}

test("1. defaults unavailable", () => {
  const provider = createPersistentAtlasFrameDrawProvider();
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(provider, {
        snapshot: createFrozenSnapshot(),
        retainedSurface: {},
        lifecycleOwner: {},
        authorization: {},
        drawGenerationId: "DRAW_GEN_001"
      }),
    (error) => error.reasonCode === "DRAW_PROVIDER_UNAVAILABLE"
  );
});

test("2. wrong dependency types rejected", () => {
  const provider = createPersistentAtlasFrameDrawProvider({
    snapshotValidator: 1,
    retainedSurfaceValidator: 2,
    lifecycleOwnerValidator: 3,
    authorizationValidator: 4,
    snapshotAwareDrawProvider: 5,
    mutableDrawStateProvider: 6,
    canvasPositionAdapter: 7,
    drawStateReleaseProvider: 8,
    timeProvider: 9
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(provider, {
        snapshot: createFrozenSnapshot(),
        retainedSurface: {},
        lifecycleOwner: {},
        authorization: {},
        drawGenerationId: "DRAW_GEN_001"
      }),
    (error) => error.reasonCode === "DRAW_PROVIDER_UNAVAILABLE"
  );
});

test("3. valid draw inputs accepted", () => {
  const harness = createHarness();
  const result = validatePersistentAtlasDrawInputs(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(result.redrawReason, "initial_attach");
});

test("4. unknown redraw reason rejected", () => {
  const harness = createHarness();
  const snapshot = createFrozenSnapshot({ redrawReason: "nope" });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "INVALID_REDRAW_REASON"
  );
});

test("5. unfrozen snapshot rejected", () => {
  const harness = createHarness();
  const snapshot = { ...createFrozenSnapshot() };
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "INVALID_DRAW_INPUT"
  );
});

test("6. released snapshot rejected", () => {
  const harness = createHarness({
    snapshotValidator: () => ({
      ok: false,
      reasonCode: "SNAPSHOT_RELEASED"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "SNAPSHOT_RELEASED"
  );
});

test("7. reused snapshot rejected", () => {
  const harness = createHarness({
    snapshotValidator: () => ({
      ok: false,
      reasonCode: "SNAPSHOT_REUSE_DETECTED"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "SNAPSHOT_REUSE_DETECTED"
  );
});

test("8. snapshot identity mismatch rejected", () => {
  const harness = createHarness({
    snapshotValidator: ({ snapshot }) => ({
      ok: true,
      sessionId: snapshot.sessionId,
      mapIdentityId: "MAP_B"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "SNAPSHOT_IDENTITY_MISMATCH"
  );
});

test("9. Canvas mismatch rejected", () => {
  const harness = createHarness({
    retainedSurfaceValidator: () => ({
      ok: true,
      canvasIdentityId: null
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "CANVAS_IDENTITY_MISMATCH"
  );
});

test("10. pane mismatch rejected", () => {
  const harness = createHarness({
    retainedSurfaceValidator: () => ({
      ok: false,
      reasonCode: "PANE_IDENTITY_MISMATCH"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "PANE_IDENTITY_MISMATCH"
  );
});

test("11. lifecycle mismatch rejected", () => {
  const harness = createHarness({
    lifecycleOwnerValidator: () => ({
      ok: false,
      reasonCode: "LIFECYCLE_VALIDATION_FAILED"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "LIFECYCLE_VALIDATION_FAILED"
  );
});

test("12. authorization denial rejected", () => {
  const harness = createHarness({
    authorizationValidator: () => ({
      ok: false,
      reasonCode: "AUTHORIZATION_DENIED"
    })
  });
  assert.throws(
    () =>
      validatePersistentAtlasDrawInputs(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "AUTHORIZATION_DENIED"
  );
});

test("13. initial draw completes", () => {
  const harness = createHarness();
  const result = drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(result.drawCompleted, true);
  assert.equal(result.drawReason, "initial_attach");
});

test("14. draw provider called exactly once", () => {
  const harness = createHarness();
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(harness.calls.draw, 1);
});

test("15. snapshot remains unchanged", () => {
  const harness = createHarness();
  const before = JSON.stringify(harness.snapshot);
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(JSON.stringify(harness.snapshot), before);
});

test("16. mutable scalar copies created", () => {
  let mutableRef;
  const harness = createHarness({
    mutableDrawStateProvider: ({ snapshotScalars }) => {
      mutableRef = snapshotScalars;
      return {
        snapshotScalars,
        canvasLayerPosition: {
          x: snapshotScalars.canvasLayerPosition.x,
          y: snapshotScalars.canvasLayerPosition.y
        }
      };
    }
  });
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.notEqual(mutableRef.canvasLayerPosition, harness.snapshot.scalarPayload);
  assert.deepEqual(mutableRef.canvasLayerPosition, { x: 12.4, y: 34.6 });
});

test("17. Leaflet-shaped position not passed frozen", () => {
  let positionRef;
  const harness = createHarness({
    canvasPositionAdapter: ({ mutableCanvasLayerPosition }) => {
      positionRef = mutableCanvasLayerPosition;
      return { positionAdapterPath: "direct_leaflet_position" };
    }
  });
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(Object.isFrozen(positionRef), false);
});

test("18. readonly Canvas-position fallback succeeds", () => {
  const harness = createHarness({
    canvasPositionAdapter: ({ canvas, mutableCanvasLayerPosition }) => {
      canvas.style.transform = `translate3d(${mutableCanvasLayerPosition.x}px, ${mutableCanvasLayerPosition.y}px, 0px)`;
      return {
        reasonCode: "READONLY_CANVAS_POSITION_FALLBACK_USED",
        positionAdapterPath: "readonly_canvas_position_fallback"
      };
    }
  });
  const result = drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(result.drawCompleted, true);
  assert.match(harness.canvas.style.transform, /translate3d/);
});

test("19. fallback path recorded", () => {
  const harness = createHarness({
    canvasPositionAdapter: () => ({
      reasonCode: "READONLY_CANVAS_POSITION_FALLBACK_USED",
      positionAdapterPath: "readonly_canvas_position_fallback"
    })
  });
  const result = drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(result.positionAdapterPath, "readonly_canvas_position_fallback");
});

test("20. same Canvas reused sequentially", () => {
  const harness = createHarness();
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  const secondSnapshot = createFrozenSnapshot({
    snapshotId: "SNAP_002",
    snapshotGenerationId: "SNAP_GEN_002",
    redrawReason: "moveend"
  });
  const result = drawPersistentAtlasFrame(harness.provider, {
    snapshot: secondSnapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: "DRAW_GEN_002"
  });
  assert.equal(result.drawCompleted, true);
  assert.equal(harness.canvas.id, "canvas-a");
});

test("21. second draw while drawing rejected", () => {
  let nestedError = null;
  const harness = createHarness({
    drawProvider: () => {
      try {
        drawPersistentAtlasFrame(harness.provider, {
          snapshot: harness.snapshot,
          retainedSurface: harness.retainedSurface,
          lifecycleOwner: harness.lifecycleOwner,
          authorization: harness.authorization,
          drawGenerationId: harness.drawGenerationId
        });
      } catch (error) {
        nestedError = error;
      }
      return { reasonCode: "FRAME_DRAW_COMPLETED" };
    }
  });
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.ok(nestedError);
});

test("22. recursion rejected", () => {
  let nestedReason = null;
  const harness = createHarness({
    drawProvider: () => {
      try {
        validatePersistentAtlasDrawInputs(harness.provider, {
          snapshot: harness.snapshot,
          retainedSurface: harness.retainedSurface,
          lifecycleOwner: harness.lifecycleOwner,
          authorization: harness.authorization,
          drawGenerationId: harness.drawGenerationId
        });
      } catch (error) {
        nestedReason = error.reasonCode;
      }
      return { reasonCode: "FRAME_DRAW_COMPLETED" };
    }
  });
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(nestedReason, "RECURSIVE_DRAW_DETECTED");
});

test("23. parallel draw rejected", () => {
  const harness = createHarness();
  harness.provider.__internal.isDrawing = true;
  assert.throws(
    () =>
      drawPersistentAtlasFrame(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "DRAW_ALREADY_IN_PROGRESS"
  );
});

test("24. draw failure reported", () => {
  const harness = createHarness({
    drawProvider: () => {
      throw Object.assign(new Error("DRAW_EXECUTION_FAILED"), {
        reasonCode: "DRAW_EXECUTION_FAILED"
      });
    }
  });
  assert.throws(
    () =>
      drawPersistentAtlasFrame(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "DRAW_EXECUTION_FAILED"
  );
});

test("25. mutable state released after success", () => {
  const harness = createHarness();
  drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(harness.calls.release, 1);
});

test("26. mutable state released after failure", () => {
  const harness = createHarness({
    drawProvider: () => {
      throw Object.assign(new Error("DRAW_EXECUTION_FAILED"), {
        reasonCode: "DRAW_EXECUTION_FAILED"
      });
    }
  });
  try {
    drawPersistentAtlasFrame(harness.provider, {
      snapshot: harness.snapshot,
      retainedSurface: harness.retainedSurface,
      lifecycleOwner: harness.lifecycleOwner,
      authorization: harness.authorization,
      drawGenerationId: harness.drawGenerationId
    });
  } catch {}
  assert.equal(harness.calls.release, 1);
});

test("27. repeated draw-state release harmless", () => {
  const harness = createHarness();
  const first = releasePersistentAtlasDrawState(harness.provider);
  const second = releasePersistentAtlasDrawState(harness.provider);
  assert.equal(first.released, true);
  assert.equal(second.released, true);
});

test("28. draw-state release failure reported", () => {
  const harness = createHarness({
    mutableDrawStateProvider: () => ({ canvasLayerPosition: { x: 1, y: 2 } }),
    drawStateReleaseProvider: () => {
      throw Object.assign(new Error("DRAW_STATE_RELEASE_FAILED"), {
        reasonCode: "DRAW_STATE_RELEASE_FAILED"
      });
    }
  });
  try {
    drawPersistentAtlasFrame(harness.provider, {
      snapshot: harness.snapshot,
      retainedSurface: harness.retainedSurface,
      lifecycleOwner: harness.lifecycleOwner,
      authorization: harness.authorization,
      drawGenerationId: harness.drawGenerationId
    });
  } catch {}
  const status = getPersistentAtlasFrameDrawStatus(harness.provider);
  assert.equal(status.lastFailureReason, "DRAW_STATE_RELEASE_FAILED");
});

test("29. invalidation blocks future draw", () => {
  const harness = createHarness();
  invalidatePersistentAtlasDrawProvider(harness.provider, "DRAW_PROVIDER_INVALIDATED");
  assert.throws(
    () =>
      drawPersistentAtlasFrame(harness.provider, {
        snapshot: harness.snapshot,
        retainedSurface: harness.retainedSurface,
        lifecycleOwner: harness.lifecycleOwner,
        authorization: harness.authorization,
        drawGenerationId: harness.drawGenerationId
      }),
    (error) => error.reasonCode === "DRAW_PROVIDER_INVALIDATED"
  );
});

test("30. result frozen and serializable", () => {
  const harness = createHarness();
  const result = drawPersistentAtlasFrame(harness.provider, {
    snapshot: harness.snapshot,
    retainedSurface: harness.retainedSurface,
    lifecycleOwner: harness.lifecycleOwner,
    authorization: harness.authorization,
    drawGenerationId: harness.drawGenerationId
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(typeof JSON.stringify(result), "string");
});

test("31. status frozen and serializable", () => {
  const harness = createHarness();
  const status = getPersistentAtlasFrameDrawStatus(harness.provider);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("32. no raw references exposed", () => {
  const harness = createHarness();
  const status = getPersistentAtlasFrameDrawStatus(harness.provider);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("map" in status, false);
  assert.equal("mutableDrawState" in status, false);
});

test("33. no snapshot ownership release", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /releasePersistentAtlasFrameSnapshot/);
});

test("34. no Canvas/pane/lifecycle cleanup", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /releasePersistentAtlasLifecycleOwner/);
  assert.doesNotMatch(source, /releasePersistentAtlasRetainedSurface/);
});

test("35. no scheduler/listener/controller connection", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /\.on\(/);
  assert.doesNotMatch(source, /createControlledPersistentAtlasController/);
});

test("36. no window/document/global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\./);
  assert.doesNotMatch(source, /\bdocument\./);
  assert.doesNotMatch(source, /\bglobalThis\b(?!["'])/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
});

test("37. no live startup or automatic rendering", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-frame-draw-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-frame-draw-provider/);
});

test("38. all four canonical safety flags remain false", () => {
  const harness = createHarness();
  const status = getPersistentAtlasFrameDrawStatus(harness.provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
