import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const pipelineModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-pipeline.mjs"
  )
);
const surfacePreparationModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-surface-preparation.mjs"
  )
);
const drawModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-draw.mjs"
  )
);
const lifecycleOwnerModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  )
);

const pipelineSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-pipeline.mjs"
  ),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");

function createEnvironment(overrides = {}) {
  const order = [];
  const calls = {
    paneLookup: [],
    paneCreate: [],
    canvasCreate: [],
    canvasAppend: [],
    sizeReads: 0,
    positionReads: 0,
    sizeApplications: [],
    positionApplications: [],
    off: [],
    removeCanvas: [],
    removePane: [],
    draw: []
  };

  const map = overrides.map ?? {
    id: "fake-map",
    off(eventNames, listener) {
      calls.off.push({ eventNames, listener });
      order.push("listener-removed");
      if (overrides.throwOnOff) {
        throw overrides.throwOnOff;
      }
    }
  };

  const existingPane =
    overrides.existingPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0
    };
  const createdPane =
    overrides.createdPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0
    };
  const canvas =
    overrides.canvas ??
    {
      className: "custom-25d-map-canvas"
    };

  const paneLookup = (mapArg, paneNameArg) => {
    calls.paneLookup.push({ mapArg, paneNameArg });
    order.push("pane-lookup");
    if (overrides.throwOnPaneLookup) {
      throw overrides.throwOnPaneLookup;
    }
    return overrides.lookupResult === undefined ? existingPane : overrides.lookupResult;
  };

  const paneCreate = (mapArg, paneNameArg) => {
    calls.paneCreate.push({ mapArg, paneNameArg });
    order.push("pane-create");
    if (overrides.throwOnPaneCreate) {
      throw overrides.throwOnPaneCreate;
    }
    return createdPane;
  };

  const canvasCreate = (classNameArg, paneArg, mapArg) => {
    calls.canvasCreate.push({ classNameArg, paneArg, mapArg });
    order.push("canvas-create");
    if (overrides.throwOnCanvasCreate) {
      throw overrides.throwOnCanvasCreate;
    }
    return overrides.canvasResult ?? canvas;
  };

  const canvasAppend = (paneArg, canvasArg) => {
    calls.canvasAppend.push({ paneArg, canvasArg });
    order.push("canvas-append");
    if (overrides.throwOnAppend) {
      throw overrides.throwOnAppend;
    }
  };

  const mapSizeProvider = () => {
    calls.sizeReads += 1;
    order.push("size-read");
    if (overrides.throwOnSizeRead) {
      throw overrides.throwOnSizeRead;
    }
    return overrides.sizeResult ?? { width: 640, height: 360 };
  };

  const mapTopLeftProvider = () => {
    calls.positionReads += 1;
    order.push("position-read");
    if (overrides.throwOnPositionRead) {
      throw overrides.throwOnPositionRead;
    }
    return overrides.positionResult ?? { x: 12, y: 34 };
  };

  const applyCanvasSize = (canvasArg, sizeArg) => {
    calls.sizeApplications.push({ canvasArg, sizeArg });
    order.push("size-apply");
    canvasArg.width = sizeArg.width;
    canvasArg.height = sizeArg.height;
  };

  const applyCanvasPosition = (canvasArg, positionArg) => {
    calls.positionApplications.push({ canvasArg, positionArg });
    order.push("position-apply");
    canvasArg.intendedPosition = { x: positionArg.x, y: positionArg.y };
  };

  const surfacePreparation =
    overrides.surfacePreparation ??
    surfacePreparationModule.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      paneLookup,
      paneCreate,
      canvasCreate,
      canvasAppend,
      canvasRemove() {},
      mapSizeProvider,
      mapTopLeftProvider,
      applyCanvasSize,
      applyCanvasPosition
    });

  const removeCanvas = (canvasArg) => {
    calls.removeCanvas.push(canvasArg);
    order.push("canvas-removed");
    if (overrides.throwOnRemoveCanvas) {
      throw overrides.throwOnRemoveCanvas;
    }
  };

  const removePaneIfEmpty = (paneArg, paneNameArg) => {
    calls.removePane.push({ paneArg, paneNameArg });
    order.push("pane-remove-check");
    if (overrides.throwOnRemovePane) {
      throw overrides.throwOnRemovePane;
    }

    return { ok: true, removed: paneArg.childElementCount === 0 };
  };

  const lifecycleOwnerFactory =
    overrides.lifecycleOwnerFactory ??
    (() =>
      lifecycleOwnerModule.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner(
        {
          expectedPaneName: "custom25DMapPane",
          expectedRetentionSlot: "custom25DMapLayer",
          removeCanvas,
          removePaneIfEmpty
        }
      ));

  const drawHelperFactory =
    overrides.drawHelperFactory ??
    (() => {
      order.push("draw-helper-created");
      return drawModule.createDeveloperOnlyCustom25DOneFrameDraw({
        drawOperation(input) {
          calls.draw.push(input);
          order.push("draw");
          if (overrides.throwOnDraw) {
            throw overrides.throwOnDraw;
          }
          if (overrides.drawFailureReason) {
            return { ok: false, reasonCode: overrides.drawFailureReason };
          }
          return { ok: true, frameId: "FRAME_001" };
        }
      });
    });

  const pipeline =
    pipelineModule.createDeveloperOnlyGrowGoCustom25DOneFramePipeline({
      surfacePreparation,
      drawHelperFactory,
      lifecycleOwnerFactory,
      pipelineIdGenerator: () => overrides.pipelineId ?? "PIPELINE_TEST_001"
    });

  return {
    order,
    calls,
    map,
    existingPane,
    createdPane,
    canvas,
    surfacePreparation,
    pipeline
  };
}

function createRegistrationFailureOwner({
  reasonCode = "OWNERSHIP_REGISTRATION_FAILED",
  rollbackFailure
} = {}) {
  const calls = {
    register: 0,
    rollback: 0
  };

  const owner = {
    registerOwnedResources() {
      calls.register += 1;
      return Object.freeze({
        outcome: "failed_closed",
        reasonCode
      });
    },
    rollbackUnregisteredSurface() {
      calls.rollback += 1;
      if (rollbackFailure) {
        throw rollbackFailure;
      }
      return Object.freeze({
        status: Object.freeze({
          cleanupCompleted: true,
          cleanupFailed: false,
          cleanupFailureReasons: Object.freeze([]),
          listenerRemovalAttemptCount: 0,
          canvasRemovalAttemptCount: 1,
          paneRemovalAttemptCount: 0,
          retentionResetAttemptCount: 1,
          unrelatedResourcesPreserved: true
        })
      });
    },
    disposeOwnedResources() {
      throw new Error("dispose should not run on registration failure");
    },
    getLifecycleOwnerStatus() {
      return Object.freeze({
        lifecycleState: "idle"
      });
    }
  };

  return { owner, calls };
}

test("module import has no side effects, factory exists, initial state is idle, and source remains passive", () => {
  assert.equal(
    typeof pipelineModule.createDeveloperOnlyGrowGoCustom25DOneFramePipeline,
    "function"
  );

  const env = createEnvironment();
  const statusA = env.pipeline.getPipelineStatus();
  const statusB = env.pipeline.getPipelineStatus();

  assert.equal(statusA.pipelineState, "idle");
  assert.equal(statusA.executionAttemptCount, 0);
  assert.equal(statusA.surfacePreparationAttemptCount, 0);
  assert.equal(statusA.lifecycleRegistrationAttemptCount, 0);
  assert.equal(statusA.drawAttemptCount, 0);
  assert.equal(statusA.cleanupAttemptCount, 0);
  assert.equal(statusA.realRendererInvoked, false);
  assert.equal(statusA.realDrawFunctionCalled, false);
  assert.equal(statusA.realCanvasCreated, false);
  assert.equal(statusA.realPaneCreated, false);
  assert.equal(statusA.realWebglContextCreated, false);
  assert.equal(statusA.realOverlayCreated, false);
  assert.equal(statusA.realListenerAdded, false);
  assert.equal(statusA.automaticInvocation, false);
  assert.equal(statusA, statusB);
  assert.deepEqual(env.calls, {
    paneLookup: [],
    paneCreate: [],
    canvasCreate: [],
    canvasAppend: [],
    sizeReads: 0,
    positionReads: 0,
    sizeApplications: [],
    positionApplications: [],
    off: [],
    removeCanvas: [],
    removePane: [],
    draw: []
  });

  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.doesNotMatch(pipelineSource, /initCustom25DMapExperiment\(/);
  assert.doesNotMatch(pipelineSource, /drawCustom25DMapCanvas\(/);
  assert.doesNotMatch(pipelineSource, /custom25DMapLayer\s*=/);
  assert.doesNotMatch(pipelineSource, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(pipelineSource, /\.on\(/);
  assert.doesNotMatch(pipelineSource, /setTimeout|setInterval|fetch\(/);
});

test("successful passive pipeline prepares one surface, registers ownership, draws one frame, cleans up once, releases references, and blocks reuse", () => {
  const env = createEnvironment({
    lookupResult: null,
    pipelineId: "PIPELINE_SUCCESS_001"
  });

  const result = env.pipeline.executeOneFramePipeline({ map: env.map });
  const status = env.pipeline.getPipelineStatus();
  const secondExecution = env.pipeline.executeOneFramePipeline({ map: env.map });
  const secondFrame = env.pipeline.requestSecondFrame();

  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "PIPELINE_COMPLETED");
  assert.equal(result.pipelineId, "PIPELINE_SUCCESS_001");
  assert.equal(result.pipelineState, "disposed");
  assert.equal(result.executionAttemptCount, 1);
  assert.equal(result.surfacePreparationAttemptCount, 1);
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.lifecycleRegistrationAttemptCount, 1);
  assert.equal(result.lifecycleOwnershipRegistered, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.drawCompleted, true);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.cleanupFailed, false);
  assert.deepEqual(result.cleanupFailureReasons, []);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.secondExecutionBlocked, false);
  assert.equal(result.paneReused, false);
  assert.equal(result.paneCreated, true);
  assert.equal(result.canvasCreated, true);
  assert.equal(result.canvasAppended, true);
  assert.equal(result.canvasRemoved, true);
  assert.equal(result.listenerRemoved, true);
  assert.equal(result.retentionReset, true);
  assert.equal(result.unrelatedResourcesPreserved, true);
  assert.equal(result.mapReferenceRetained, false);
  assert.equal(result.canvasReferenceRetained, false);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.realListenerAdded, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.cleanupFailureReasons), true);
  assert.throws(() => {
    result.pipelineState = "mutated";
  });

  assert.equal(env.calls.canvasCreate.length, 1);
  assert.equal(env.calls.off.length, 1);
  assert.equal(env.calls.removeCanvas.length, 1);
  assert.equal(env.calls.removePane.length, 1);
  assert.equal(env.calls.draw.length, 1);
  assert.equal(env.order.indexOf("draw"), env.order.lastIndexOf("draw"));
  assert.ok(
    env.order.indexOf("draw") > env.order.indexOf("draw-helper-created")
  );
  assert.ok(
    env.order.indexOf("draw") > env.order.indexOf("canvas-create")
  );
  assert.ok(
    env.order.indexOf("canvas-removed") > env.order.indexOf("draw")
  );
  assert.equal(status.pipelineState, "disposed");
  assert.equal(status.permanentlyClosed, true);
  assert.equal(status.mapReferenceRetained, false);
  assert.equal(status.canvasReferenceRetained, false);

  assert.equal(secondExecution.outcome, "blocked");
  assert.equal(secondExecution.reasonCode, "PIPELINE_ALREADY_CLOSED");
  assert.equal(secondExecution.secondExecutionBlocked, true);
  assert.equal(secondFrame.outcome, "blocked");
  assert.equal(secondFrame.reasonCode, "SECOND_FRAME_BLOCKED");
  assert.equal(secondFrame.secondExecutionBlocked, true);
});

test("missing dependencies, invalid surface descriptor, missing canvas, and canvas class mismatch all fail closed without real draw", () => {
  const missingSurface =
    pipelineModule.createDeveloperOnlyGrowGoCustom25DOneFramePipeline({
      drawHelperFactory: () => ({}),
      lifecycleOwnerFactory: () => ({})
    });
  const missingLifecycle =
    pipelineModule.createDeveloperOnlyGrowGoCustom25DOneFramePipeline({
      surfacePreparation: { prepareOneFrameSurface() {} },
      drawHelperFactory: () => ({})
    });
  const missingDraw =
    pipelineModule.createDeveloperOnlyGrowGoCustom25DOneFramePipeline({
      surfacePreparation: { prepareOneFrameSurface() {} },
      lifecycleOwnerFactory: () => ({})
    });
  const invalidSurface = createEnvironment({
    surfacePreparation: {
      prepareOneFrameSurface() {
        return Object.freeze({
          reasonCode: "SURFACE_DESCRIPTOR_BAD"
        });
      }
    }
  }).pipeline;
  const missingCanvas = createEnvironment({
    surfacePreparation: {
      prepareOneFrameSurface() {
        return Object.freeze({
          preparationStatus: "prepared",
          reasonCode: "SURFACE_PREPARED",
          paneReused: true,
          paneCreated: false,
          canvasCreated: true,
          canvasAppended: true,
          canvasClassName: "custom-25d-map-canvas",
          ownedSurface: Object.freeze({
            pane: {}
          })
        });
      }
    }
  }).pipeline;
  const mismatchedCanvas = createEnvironment({
    surfacePreparation: {
      prepareOneFrameSurface() {
        return Object.freeze({
          preparationStatus: "prepared",
          reasonCode: "SURFACE_PREPARED",
          paneReused: true,
          paneCreated: false,
          canvasCreated: true,
          canvasAppended: true,
          canvasClassName: "wrong-canvas",
          ownedSurface: Object.freeze({
            pane: {},
            canvas: {}
          })
        });
      }
    }
  }).pipeline;

  assert.equal(
    missingSurface.executeOneFramePipeline({}).reasonCode,
    "MISSING_SURFACE_PREPARATION_DEPENDENCY"
  );
  assert.equal(
    missingLifecycle.executeOneFramePipeline({}).reasonCode,
    "MISSING_LIFECYCLE_OWNER_FACTORY"
  );
  assert.equal(
    missingDraw.executeOneFramePipeline({}).reasonCode,
    "MISSING_DRAW_HELPER_FACTORY"
  );
  assert.equal(
    invalidSurface.executeOneFramePipeline({ map: { off() {} } }).reasonCode,
    "SURFACE_DESCRIPTOR_BAD"
  );
  assert.equal(
    missingCanvas.executeOneFramePipeline({ map: { off() {} } }).reasonCode,
    "BLOCKED_BY_SURFACE_DRAW_CONTRACT_MISMATCH"
  );
  assert.equal(
    mismatchedCanvas.executeOneFramePipeline({ map: { off() {} } }).reasonCode,
    "BLOCKED_BY_SURFACE_DRAW_CONTRACT_MISMATCH"
  );
});

test("surface failure and surface exception prevent ownership registration and draw, then permanently close", () => {
  const returnedFailureEnv = createEnvironment({
    surfacePreparation: {
      prepareOneFrameSurface() {
        return Object.freeze({
          preparationStatus: "failed",
          reasonCode: "SURFACE_PREPARATION_FAILED",
          paneReused: false,
          paneCreated: false,
          canvasCreated: false,
          canvasAppended: false
        });
      }
    }
  });
  const thrownFailureEnv = createEnvironment({
    surfacePreparation: {
      prepareOneFrameSurface() {
        throw Object.assign(new Error("surface explosion"), {
          reasonCode: "SURFACE_PREPARATION_EXCEPTION"
        });
      }
    }
  });

  const returnedFailure = returnedFailureEnv.pipeline.executeOneFramePipeline({
    map: returnedFailureEnv.map
  });
  const thrownFailure = thrownFailureEnv.pipeline.executeOneFramePipeline({
    map: thrownFailureEnv.map
  });

  assert.equal(returnedFailure.outcome, "failed_closed");
  assert.equal(returnedFailure.reasonCode, "SURFACE_PREPARATION_FAILED");
  assert.equal(returnedFailure.lifecycleRegistrationAttemptCount, 0);
  assert.equal(returnedFailure.drawAttemptCount, 0);
  assert.equal(returnedFailure.cleanupAttemptCount, 0);
  assert.equal(thrownFailure.outcome, "failed_closed");
  assert.equal(thrownFailure.reasonCode, "SURFACE_PREPARATION_EXCEPTION");
  assert.equal(thrownFailure.lifecycleRegistrationAttemptCount, 0);
  assert.equal(thrownFailure.drawAttemptCount, 0);
  assert.equal(thrownFailure.cleanupAttemptCount, 0);
});

test("lifecycle registration failure prevents draw and triggers rollback cleanup", () => {
  const registrationFailure = createRegistrationFailureOwner({
    reasonCode: "OWNERSHIP_REGISTRATION_FAILED"
  });
  const env = createEnvironment({
    lifecycleOwnerFactory: () => registrationFailure.owner
  });

  const result = env.pipeline.executeOneFramePipeline({ map: env.map });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "OWNERSHIP_REGISTRATION_FAILED");
  assert.equal(result.drawAttemptCount, 0);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.canvasRemoved, true);
  assert.equal(result.retentionReset, true);
  assert.equal(result.listenerRemoved, false);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(registrationFailure.calls.register, 1);
  assert.equal(registrationFailure.calls.rollback, 1);
});

test("draw returned failure and draw exception both trigger exact cleanup and close the pipeline", () => {
  const returnedFailureEnv = createEnvironment({
    drawFailureReason: "FAKE_DRAW_RETURNED_FAILURE"
  });
  const thrownFailureEnv = createEnvironment({
    throwOnDraw: Object.assign(new Error("draw exploded"), {
      reasonCode: "DRAW_EXCEPTION"
    })
  });

  const returnedFailure = returnedFailureEnv.pipeline.executeOneFramePipeline({
    map: returnedFailureEnv.map
  });
  const thrownFailure = thrownFailureEnv.pipeline.executeOneFramePipeline({
    map: thrownFailureEnv.map
  });

  assert.equal(returnedFailure.outcome, "failed_closed");
  assert.equal(returnedFailure.reasonCode, "FAKE_DRAW_RETURNED_FAILURE");
  assert.equal(returnedFailure.drawAttemptCount, 1);
  assert.equal(returnedFailure.completedFrameCount, 0);
  assert.equal(returnedFailure.cleanupAttemptCount, 1);
  assert.equal(returnedFailure.canvasRemoved, true);
  assert.equal(returnedFailure.listenerRemoved, true);
  assert.equal(returnedFailure.retentionReset, true);

  assert.equal(thrownFailure.outcome, "failed_closed");
  assert.equal(thrownFailure.reasonCode, "DRAW_EXCEPTION");
  assert.equal(thrownFailure.drawAttemptCount, 1);
  assert.equal(thrownFailure.completedFrameCount, 0);
  assert.equal(thrownFailure.cleanupAttemptCount, 1);
  assert.equal(thrownFailure.canvasRemoved, true);
  assert.equal(thrownFailure.listenerRemoved, true);
  assert.equal(thrownFailure.retentionReset, true);
});

test("cleanup failure is reported precisely, safe cleanup continues, references clear, and the pipeline stays permanently closed", () => {
  const env = createEnvironment({
    lookupResult: null,
    throwOnRemoveCanvas: Object.assign(new Error("remove failed"), {
      reasonCode: "CANVAS_REMOVAL_FAILED"
    })
  });

  const result = env.pipeline.executeOneFramePipeline({ map: env.map });
  const status = env.pipeline.getPipelineStatus();

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CANVAS_REMOVAL_FAILED");
  assert.equal(result.pipelineState, "disposed");
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, false);
  assert.equal(result.cleanupFailed, true);
  assert.deepEqual(result.cleanupFailureReasons, ["CANVAS_REMOVAL_FAILED"]);
  assert.equal(result.listenerRemoved, true);
  assert.equal(result.canvasRemoved, true);
  assert.equal(result.retentionReset, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(status.mapReferenceRetained, false);
  assert.equal(status.canvasReferenceRetained, false);
  assert.equal(env.calls.off.length, 1);
  assert.equal(env.calls.removeCanvas.length, 1);
  assert.equal(env.calls.removePane.length, 1);
  assert.equal(
    env.pipeline.executeOneFramePipeline({ map: env.map }).reasonCode,
    "PIPELINE_ALREADY_CLOSED"
  );
});
