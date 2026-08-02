import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-draw-operation.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const surfaceOperationsSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-surface-operations.mjs"
  ),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createSurface(overrides = {}) {
  const canvas =
    Object.prototype.hasOwnProperty.call(overrides, "canvas")
      ? overrides.canvas
      : {
          className: overrides.canvasClassName ?? "custom-25d-map-canvas",
          width: overrides.width ?? 640,
          height: overrides.height ?? 360,
          style: {
            width: overrides.styleWidth ?? "640px",
            height: overrides.styleHeight ?? "360px"
          },
          position: overrides.position ?? { x: 12, y: 34 }
        };

  return Object.freeze({
    schemaId: "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001",
    map: overrides.map ?? { id: "fake-map" },
    pane: overrides.pane ?? { dataset: { owner: "custom25DMapPane" } },
    canvas,
    paneName: overrides.paneName ?? "custom25DMapPane",
    canvasClassName:
      overrides.surfaceCanvasClassName ?? "custom-25d-map-canvas",
    paneReused: overrides.paneReused ?? true,
    paneCreated: overrides.paneCreated ?? false,
    paneOwnedByOperation: overrides.paneOwnedByOperation ?? false,
    canvasOwnedByOperation: overrides.canvasOwnedByOperation ?? true,
    canvasAppended: overrides.canvasAppended ?? true,
    cssWidth: overrides.cssWidth ?? "640px",
    cssHeight: overrides.cssHeight ?? "360px",
    backingWidth: overrides.backingWidth ?? 1280,
    backingHeight: overrides.backingHeight ?? 720,
    devicePixelRatio: overrides.devicePixelRatio ?? 2,
    canvasPosition: overrides.canvasPosition ?? Object.freeze({ x: 12, y: 34 }),
    cleanupRequired: overrides.cleanupRequired ?? true,
    rollbackAvailable: overrides.rollbackAvailable ?? true,
    listenerAdded: overrides.listenerAdded ?? false,
    retentionWritten: overrides.retentionWritten ?? false,
    drawRequested: overrides.drawRequested ?? false,
    automaticInvocation: overrides.automaticInvocation ?? false
  });
}

function createEnvironment(overrides = {}) {
  const calls = {
    provider: 0,
    draw: 0
  };

  const surface =
    Object.prototype.hasOwnProperty.call(overrides, "surface")
      ? overrides.surface
      : createSurface(overrides.surfaceOverrides);
  const canvas =
    Object.prototype.hasOwnProperty.call(overrides, "canvas")
      ? overrides.canvas
      : surface?.canvas;

  const drawResultFactory =
    overrides.drawResultFactory ??
    ((input) => {
      calls.draw += 1;
      if (overrides.returnFailure) {
        return {
          ok: false,
          reasonCode: overrides.returnFailure,
          ...overrides.failureFlags
        };
      }
      if (overrides.throwOnDraw) {
        throw overrides.throwOnDraw;
      }
      if (typeof overrides.mutateCanvas === "function") {
        overrides.mutateCanvas(input.canvas);
      }
      return {
        ok: true,
        frameId: "FAKE_LIVE_FRAME_001",
        ...overrides.successFlags
      };
    });

  const drawFunctionProvider =
    overrides.drawFunctionProvider ??
    (() => {
      calls.provider += 1;
      if (overrides.throwOnProvider) {
        throw overrides.throwOnProvider;
      }
      if (overrides.returnNonFunction) {
        return overrides.returnNonFunction;
      }
      return drawResultFactory;
    });

  const operation =
    moduleUnderTest.createGrowGoCustom25DLiveOneFrameDrawOperation({
      expectedCanvasClassName:
        overrides.expectedCanvasClassName ?? "custom-25d-map-canvas",
      drawFunctionProvider:
        overrides.omitProvider === true ? undefined : drawFunctionProvider,
      operationIdGenerator:
        overrides.operationIdGenerator ?? (() => "LIVE_DRAW_OPERATION_001")
    });

  return {
    calls,
    surface,
    canvas,
    operation
  };
}

test("module import has no side effects, factory exists, initial status is idle, and source lock stays anchored to the live draw path", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DLiveOneFrameDrawOperation,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DLiveOneFrameDrawOperationSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DLiveOneFrameDrawOperationSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(inspection.classification, "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY");
  assert.equal(inspection.discoveredDrawDependencies.globalMapDependency, true);
  assert.equal(inspection.discoveredDrawDependencies.canvasContextDependency, "2d");
  assert.equal(
    inspection.discoveredDrawDependencies.pixelRatioBehavior,
    "window.devicePixelRatio || 1"
  );
  assert.match(
    inspection.discoveredDrawDependencies.resizingBehavior,
    /canvas\.width/
  );
  assert.match(
    inspection.discoveredDrawDependencies.positioningBehavior,
    /L\.DomUtil\.setPosition/
  );

  const env = createEnvironment();
  const statusA = env.operation.getDrawOperationStatus();
  const statusB = env.operation.getDrawOperationStatus();

  assert.equal(statusA.drawState, "idle");
  assert.equal(statusA.drawAttemptCount, 0);
  assert.equal(statusA.completedFrameCount, 0);
  assert.equal(statusA.permanentlyClosed, false);
  assert.equal(statusA.automaticInvocation, false);
  assert.equal(statusA, statusB);
  assert.equal(Object.isFrozen(statusA), true);
  assert.equal(
    Object.isFrozen(statusA.canonicalSafetyFlagSnapshot),
    true
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createGrowGoCustom25DLiveOneFrameDrawOperation/
  );
});

test("one valid prepared fake surface and exact canvas produce exactly one fake draw, one completed frame, required cleanup, and permanent closure", () => {
  const env = createEnvironment();

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });
  const status = env.operation.getDrawOperationStatus();

  assert.equal(result.schemaId, "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_DRAW_OPERATION_RESULT_001");
  assert.equal(result.operationId, "LIVE_DRAW_OPERATION_001");
  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
  assert.equal(result.surfaceValidated, true);
  assert.equal(result.surfaceSchemaValidated, true);
  assert.equal(result.canvasIdentityValidated, true);
  assert.equal(result.canvasClassValidated, true);
  assert.equal(result.drawFunctionAvailable, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.drawCompleted, true);
  assert.equal(result.drawFailed, false);
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.lifecycleCleanupRequired, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.secondDrawBlocked, false);
  assert.equal(result.mapReferenceRetained, false);
  assert.equal(result.canvasReferenceRetained, false);
  assert.equal(env.calls.provider, 1);
  assert.equal(env.calls.draw, 1);
  assert.equal(status.drawState, "completed");
  assert.equal(status.completedFrameCount, 1);
  assert.equal(status.permanentlyClosed, true);
});

test("second draw attempt is blocked after the one allowed draw", () => {
  const env = createEnvironment();

  const first = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });
  const second = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(first.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "DRAW_OPERATION_ALREADY_CLOSED");
  assert.equal(second.secondDrawBlocked, true);
  assert.equal(second.drawAttemptCount, 1);
  assert.equal(second.completedFrameCount, 1);
  assert.equal(env.calls.provider, 1);
  assert.equal(env.calls.draw, 1);
});

test("every invalid surface or canvas case blocks before drawing", () => {
  const cases = [
    {
      label: "missing surface",
      surface: null,
      canvas: { className: "custom-25d-map-canvas" },
      reasonCode: "INVALID_SURFACE_SCHEMA"
    },
    {
      label: "incorrect pane name",
      surface: createSurface({ paneName: "wrongPane" }),
      reasonCode: "INCORRECT_PANE_NAME"
    },
    {
      label: "incorrect canvas class in descriptor",
      surface: createSurface({ surfaceCanvasClassName: "wrong-class" }),
      reasonCode: "INCORRECT_CANVAS_CLASS_NAME"
    },
    {
      label: "canvas not created",
      surface: createSurface({ canvasOwnedByOperation: false }),
      reasonCode: "CANVAS_NOT_CREATED"
    },
    {
      label: "canvas not appended",
      surface: createSurface({ canvasAppended: false }),
      reasonCode: "CANVAS_NOT_APPENDED"
    },
    {
      label: "cleanup required false",
      surface: createSurface({ cleanupRequired: false }),
      reasonCode: "CLEANUP_REQUIRED_FALSE"
    },
    {
      label: "rollback unavailable",
      surface: createSurface({ rollbackAvailable: false }),
      reasonCode: "ROLLBACK_AVAILABLE_FALSE"
    },
    {
      label: "listener already added",
      surface: createSurface({ listenerAdded: true }),
      reasonCode: "LISTENER_ALREADY_ADDED"
    },
    {
      label: "retention written",
      surface: createSurface({ retentionWritten: true }),
      reasonCode: "RETENTION_ALREADY_WRITTEN"
    },
    {
      label: "draw already requested",
      surface: createSurface({ drawRequested: true }),
      reasonCode: "DRAW_ALREADY_REQUESTED"
    },
    {
      label: "missing surface canvas",
      surface: createSurface({ canvas: null }),
      reasonCode: "MISSING_SURFACE_CANVAS"
    },
    {
      label: "missing canvas argument",
      surface: createSurface(),
      canvas: null,
      reasonCode: "MISSING_CANVAS"
    },
    {
      label: "canvas identity mismatch",
      surface: createSurface(),
      canvas: { className: "custom-25d-map-canvas" },
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    },
    {
      label: "canvas class mismatch",
      surface: (() => {
        const canvas = { className: "wrong-class", style: {} };
        return createSurface({ canvas });
      })(),
      reasonCode: "CANVAS_CLASS_MISMATCH"
    }
  ];

  for (const entry of cases) {
    const env = createEnvironment({
      surface: entry.surface,
      canvas:
        Object.prototype.hasOwnProperty.call(entry, "canvas")
          ? entry.canvas
          : entry.surface?.canvas
    });

    const result = env.operation.drawPreparedSurfaceExactlyOnce({
      surface: env.surface,
      canvas: env.canvas
    });

    assert.equal(result.outcome, "blocked", entry.label);
    assert.equal(result.reasonCode, entry.reasonCode, entry.label);
    assert.equal(result.drawAttemptCount, 0, entry.label);
    assert.equal(result.completedFrameCount, 0, entry.label);
    assert.equal(result.permanentlyClosed, true, entry.label);
    assert.equal(env.calls.provider, 0, entry.label);
    assert.equal(env.calls.draw, 0, entry.label);
  }
});

test("missing draw-function provider and provider returning non-function both block before drawing", () => {
  const missingProviderEnv = createEnvironment({ omitProvider: true });
  const missingProviderResult =
    missingProviderEnv.operation.drawPreparedSurfaceExactlyOnce({
      surface: missingProviderEnv.surface,
      canvas: missingProviderEnv.canvas
    });

  assert.equal(missingProviderResult.outcome, "blocked");
  assert.equal(missingProviderResult.reasonCode, "DRAW_FUNCTION_PROVIDER_MISSING");
  assert.equal(missingProviderResult.drawFunctionAvailable, false);
  assert.equal(missingProviderEnv.calls.draw, 0);

  const nonFunctionEnv = createEnvironment({ returnNonFunction: "not-a-function" });
  const nonFunctionResult =
    nonFunctionEnv.operation.drawPreparedSurfaceExactlyOnce({
      surface: nonFunctionEnv.surface,
      canvas: nonFunctionEnv.canvas
    });

  assert.equal(nonFunctionResult.outcome, "blocked");
  assert.equal(nonFunctionResult.reasonCode, "DRAW_FUNCTION_UNAVAILABLE");
  assert.equal(nonFunctionResult.drawAttemptCount, 0);
  assert.equal(nonFunctionEnv.calls.provider, 1);
  assert.equal(nonFunctionEnv.calls.draw, 0);
});

test("provider exceptions fail closed before drawing and preserve a precise reason", () => {
  const env = createEnvironment({
    throwOnProvider: Object.assign(new Error("provider exploded"), {
      reasonCode: "DRAW_PROVIDER_EXPLODED"
    })
  });

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "DRAW_PROVIDER_EXPLODED");
  assert.equal(result.drawAttemptCount, 0);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.drawFailed, false);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.cleanupRequired, true);
  assert.equal(env.calls.provider, 1);
  assert.equal(env.calls.draw, 0);
});

test("returned draw failure closes the operation, completes zero frames, requires cleanup, and allows no retry", () => {
  const env = createEnvironment({
    returnFailure: "FAKE_DRAW_FAILED",
    failureFlags: {
      realDrawFunctionCalled: true
    }
  });

  const first = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });
  const second = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(first.outcome, "failed_closed");
  assert.equal(first.reasonCode, "FAKE_DRAW_FAILED");
  assert.equal(first.drawAttemptCount, 1);
  assert.equal(first.completedFrameCount, 0);
  assert.equal(first.drawFailed, true);
  assert.equal(first.drawCompleted, false);
  assert.equal(first.cleanupRequired, true);
  assert.equal(first.lifecycleCleanupRequired, true);
  assert.equal(first.permanentlyClosed, true);
  assert.equal(first.realDrawFunctionCalled, true);
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "DRAW_OPERATION_ALREADY_CLOSED");
  assert.equal(env.calls.provider, 1);
  assert.equal(env.calls.draw, 1);
});

test("thrown draw exceptions fail closed, preserve a precise reason, complete zero frames, and release references", () => {
  const env = createEnvironment({
    throwOnDraw: Object.assign(new Error("draw crash"), {
      reasonCode: "DRAW_CRASH"
    })
  });

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "DRAW_CRASH");
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.drawFailed, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.mapReferenceRetained, false);
  assert.equal(result.canvasReferenceRetained, false);
  assert.equal(env.calls.provider, 1);
  assert.equal(env.calls.draw, 1);
});

test("canvas resize and position mutation are observed and reported instead of being hidden", () => {
  const env = createEnvironment({
    mutateCanvas(canvas) {
      canvas.width = 1024;
      canvas.height = 512;
      canvas.style.width = "512px";
      canvas.style.height = "256px";
      canvas.position = { x: 44, y: 55 };
    }
  });

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(result.outcome, "completed");
  assert.equal(result.canvasResizeObserved, true);
  assert.equal(result.canvasPositionMutationObserved, true);
});

test("status inspection has no side effects, public results are deeply immutable, and no browser-facing activation interface is exposed", () => {
  const env = createEnvironment();
  const statusA = env.operation.getDrawOperationStatus();
  const statusB = env.operation.getDrawOperationStatus();

  assert.equal(statusA, statusB);
  assert.equal(env.calls.provider, 0);
  assert.equal(env.calls.draw, 0);

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(
    Object.isFrozen(result.canonicalSafetyFlagSnapshot),
    true
  );
  assert.throws(() => {
    result.drawState = "mutated";
  });

  const moduleSource = fs.readFileSync(
    path.join(
      repoRoot,
      "client",
      "growgo-custom25d-live-one-frame-draw-operation.mjs"
    ),
    "utf8"
  );

  assert.doesNotMatch(moduleSource, /\bdrawCustom25DMapCanvas\([^)]*\);/);
  assert.doesNotMatch(moduleSource, /\binitCustom25DMapExperiment\(\);/);
  assert.doesNotMatch(moduleSource, /custom25DMapLayer\s*=\s*\{/);
  assert.doesNotMatch(moduleSource, /\bwindow\.GrowGoDeveloperDiagnostics\b/);
  assert.doesNotMatch(moduleSource, /\.on\(/);
  assert.doesNotMatch(moduleSource, /setInterval|setTimeout/);
});

test("all four canonical safety flags remain false, no real renderer or live resources are touched, and Phase 211.26 stays disconnected", () => {
  const env = createEnvironment({
    successFlags: {
      realRendererInvoked: false,
      realDrawFunctionCalled: false,
      realCanvasCreated: false,
      realPaneCreated: false,
      realWebglContextCreated: false,
      realOverlayCreated: false,
      listenerAdded: false,
      retentionWritten: false,
      networkRequested: false,
      assetDownloadRequested: false
    }
  });

  const result = env.operation.drawPreparedSurfaceExactlyOnce({
    surface: env.surface,
    canvas: env.canvas
  });

  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);

  assert.match(
    surfaceOperationsSource,
    /createGrowGoCustom25DLiveOneFrameSurfaceOperations/
  );
});
