import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const drawModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-draw.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const surfacePreparationSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-surface-preparation.mjs"
  ),
  "utf8"
);

function createPreparedSurface(overrides = {}) {
  const canvas =
    overrides.canvas ??
    {
      className: overrides.canvasClassName ?? "custom-25d-map-canvas"
    };

  return Object.freeze({
    schemaId: "GROWGO_CUSTOM_25D_ONE_FRAME_SURFACE_PREPARATION_RESULT_001",
    preparationStatus: overrides.preparationStatus ?? "prepared",
    reasonCode: overrides.reasonCode ?? "SURFACE_PREPARED",
    paneName: overrides.paneName ?? "custom25DMapPane",
    paneIdentityValidated: overrides.paneIdentityValidated ?? true,
    canvasClassName: overrides.surfaceCanvasClassName ?? "custom-25d-map-canvas",
    canvasCreated: overrides.canvasCreated ?? true,
    canvasAppended: overrides.canvasAppended ?? true,
    cleanupRequired: overrides.cleanupRequired ?? true,
    lifecycleRegistrationRequired:
      overrides.lifecycleRegistrationRequired ?? true,
    drawRequested: overrides.drawRequested ?? false,
    listenerAdded: overrides.listenerAdded ?? false,
    retentionWritten: overrides.retentionWritten ?? false,
    ownedSurface:
      overrides.ownedSurface ??
      Object.freeze({
        canvas,
        pane: { dataset: { owner: "custom25DMapPane" } },
        paneOwned: false
      })
  });
}

function createEnvironment(overrides = {}) {
  const calls = {
    draw: 0
  };

  const surface = overrides.surface ?? createPreparedSurface(overrides.surfaceOverrides);
  const canvas = overrides.canvas ?? surface.ownedSurface?.canvas ?? { className: "custom-25d-map-canvas" };

  const drawOperation =
    overrides.drawOperation ??
    ((input) => {
      calls.draw += 1;
      if (overrides.returnFailure) {
        return { ok: false, reasonCode: overrides.returnFailure };
      }
      if (overrides.throwOnDraw) {
        throw overrides.throwOnDraw;
      }
      return { ok: true, frameId: "FAKE_FRAME_001", input };
    });

  const helper = drawModule.createDeveloperOnlyCustom25DOneFrameDraw({
    drawOperation,
    expectedCanvasClassName:
      overrides.expectedCanvasClassName ?? "custom-25d-map-canvas"
  });

  return {
    calls,
    surface,
    canvas,
    helper
  };
}

test("module import has no side effects, initial state is idle, and source lock remains anchored to the live draw path", () => {
  assert.equal(
    typeof drawModule.createDeveloperOnlyCustom25DOneFrameDraw,
    "function"
  );
  assert.equal(
    typeof drawModule.inspectGrowGoCustom25DOneFrameDrawSourceLock,
    "function"
  );

  const inspection = drawModule.inspectGrowGoCustom25DOneFrameDrawSourceLock({
    scriptSource
  });

  assert.equal(inspection.ok, true);
  assert.equal(inspection.classification, "ONE_FRAME_DRAW_HELPER_READY");
  assert.equal(inspection.discoveredDrawDependencies.drawEntry, "drawCustom25DMapCanvas");
  assert.equal(inspection.discoveredDrawDependencies.globalMapDependency, true);
  assert.equal(inspection.discoveredDrawDependencies.canvasContextDependency, "2d");
  assert.equal(
    inspection.discoveredDrawDependencies.topLeftDependency,
    "map.latLngToLayerPoint(bounds.getNorthWest())"
  );

  const env = createEnvironment();
  const statusA = env.helper.getDrawStatus();
  const statusB = env.helper.getDrawStatus();

  assert.equal(statusA.drawState, "idle");
  assert.equal(statusA.drawAttemptCount, 0);
  assert.equal(statusA.completedFrameCount, 0);
  assert.equal(statusA.drawCompleted, false);
  assert.equal(statusA.drawFailed, false);
  assert.equal(statusA.permanentlyClosed, false);
  assert.equal(statusA.mapReferenceRetained, false);
  assert.equal(statusA.canvasReferenceRetained, false);
  assert.equal(statusA, statusB);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyCustom25DOneFrameDraw/
  );
});

test("one valid fake draw succeeds, attempts exactly one draw, completes one frame, requires cleanup, and permanently closes", () => {
  const env = createEnvironment();

  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });
  const status = env.helper.getDrawStatus();

  assert.equal(result.outcome, "drawn");
  assert.equal(result.reasonCode, "FRAME_DRAWN");
  assert.equal(result.surfaceValidated, true);
  assert.equal(result.canvasIdentityValidated, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.drawCompleted, true);
  assert.equal(result.drawFailed, false);
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.lifecycleCleanupRequired, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.secondDrawBlocked, false);
  assert.equal(env.calls.draw, 1);
  assert.equal(status.drawAttemptCount, 1);
  assert.equal(status.completedFrameCount, 1);
  assert.equal(status.permanentlyClosed, true);
});

test("second draw attempt is blocked after one successful draw", () => {
  const env = createEnvironment();

  const first = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });
  const second = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(first.reasonCode, "FRAME_DRAWN");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "DRAW_HELPER_CLOSED");
  assert.equal(second.secondDrawBlocked, true);
  assert.equal(second.drawAttemptCount, 1);
  assert.equal(second.completedFrameCount, 1);
  assert.equal(env.calls.draw, 1);
});

test("every invalid surface or canvas case fails before draw", () => {
  const cases = [
    {
      label: "missing surface",
      args: { surface: null, canvas: { className: "custom-25d-map-canvas" } },
      reasonCode: "INVALID_SURFACE_DESCRIPTOR"
    },
    {
      label: "unsuccessful preparation",
      args: {
        surface: createPreparedSurface({ preparationStatus: "failed" }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "UNSUCCESSFUL_SURFACE_PREPARATION"
    },
    {
      label: "invalid pane identity",
      args: {
        surface: createPreparedSurface({ paneIdentityValidated: false }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "INVALID_PANE_IDENTITY"
    },
    {
      label: "canvas not created",
      args: {
        surface: createPreparedSurface({ canvasCreated: false }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "CANVAS_NOT_CREATED"
    },
    {
      label: "canvas not appended",
      args: {
        surface: createPreparedSurface({ canvasAppended: false }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "CANVAS_NOT_APPENDED"
    },
    {
      label: "cleanup false",
      args: {
        surface: createPreparedSurface({ cleanupRequired: false }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "CLEANUP_REQUIRED_FALSE"
    },
    {
      label: "listener added",
      args: {
        surface: createPreparedSurface({ listenerAdded: true }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "LISTENER_ALREADY_ADDED"
    },
    {
      label: "retention written",
      args: {
        surface: createPreparedSurface({ retentionWritten: true }),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "RETENTION_ALREADY_WRITTEN"
    },
    {
      label: "missing canvas",
      args: {
        surface: createPreparedSurface(),
        canvas: null
      },
      reasonCode: "MISSING_CANVAS"
    },
    {
      label: "canvas identity mismatch",
      args: {
        surface: createPreparedSurface(),
        canvas: { className: "custom-25d-map-canvas" }
      },
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    },
    {
      label: "incorrect canvas class",
      args: (() => {
        const surface = createPreparedSurface({
          canvas: { className: "wrong-class" }
        });
        return {
          surface,
          canvas: surface.ownedSurface.canvas
        };
      })(),
      reasonCode: "INCORRECT_CANVAS_CLASS_NAME"
    },
    {
      label: "missing draw operation",
      helperFactory: () =>
        drawModule.createDeveloperOnlyCustom25DOneFrameDraw({
          expectedCanvasClassName: "custom-25d-map-canvas"
        }),
      args: (() => {
        const surface = createPreparedSurface();
        return { surface, canvas: surface.ownedSurface.canvas };
      })(),
      reasonCode: "DRAW_OPERATION_MISSING"
    }
  ];

  for (const entry of cases) {
    const helper =
      entry.helperFactory?.() ?? createEnvironment().helper;
    const result = helper.drawPreparedSurface(entry.args);
    assert.equal(result.reasonCode, entry.reasonCode, entry.label);
    assert.equal(result.drawAttemptCount, 0, entry.label);
    assert.equal(result.completedFrameCount, 0, entry.label);
    assert.equal(result.permanentlyClosed, true, entry.label);
  }
});

test("returned draw failure closes the helper and completes zero frames", () => {
  const env = createEnvironment({
    returnFailure: "FAKE_DRAW_FAILED"
  });

  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "FAKE_DRAW_FAILED");
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.drawFailed, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.lifecycleCleanupRequired, true);
  assert.equal(env.calls.draw, 1);
});

test("thrown draw exception fails closed with a precise reason and completes zero frames", () => {
  const env = createEnvironment({
    throwOnDraw: new Error("draw exception")
  });

  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "DRAW_EXCEPTION");
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.drawFailed, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.cleanupRequired, true);
  assert.equal(env.calls.draw, 1);
});

test("status inspection has no side effects and results are deeply immutable", () => {
  const env = createEnvironment();
  const statusA = env.helper.getDrawStatus();
  const statusB = env.helper.getDrawStatus();

  assert.equal(statusA, statusB);
  assert.equal(env.calls.draw, 0);

  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);
  assert.throws(() => {
    result.drawState = "mutated";
  });
});

test("no map or canvas reference is retained after completion, and no real renderer or browser-facing hooks are introduced", () => {
  const env = createEnvironment();
  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });
  const status = env.helper.getDrawStatus();
  const moduleSource = fs.readFileSync(
    path.join(
      repoRoot,
      "client",
      "developer-only-growgo-custom25d-one-frame-draw.mjs"
    ),
    "utf8"
  );

  assert.equal(result.mapReferenceRetained, false);
  assert.equal(result.canvasReferenceRetained, false);
  assert.equal(status.mapReferenceRetained, false);
  assert.equal(status.canvasReferenceRetained, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);

  assert.doesNotMatch(moduleSource, /\bdrawCustom25DMapCanvas\([^)]*\);/);
  assert.doesNotMatch(moduleSource, /\binitCustom25DMapExperiment\(\);/);
  assert.doesNotMatch(moduleSource, /custom25DMapLayer\s*=/);
  assert.doesNotMatch(moduleSource, /\.on\(/);
});

test("all four canonical safety flags remain false and the surface helper stays disconnected", () => {
  const env = createEnvironment();
  const result = env.helper.drawPreparedSurface({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.match(
    surfacePreparationSource,
    /createDeveloperOnlyCustom25DOneFrameSurfacePreparation/
  );
});
