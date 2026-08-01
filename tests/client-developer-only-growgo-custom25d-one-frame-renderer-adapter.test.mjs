import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createFakeOps({
  initializeResult = { ok: true, surfaceToken: Object.freeze({ fakeSurface: true }) },
  drawResult = { ok: true },
  disposeResult = { ok: true },
  throwOnInitialize = null,
  throwOnDraw = null,
  throwOnDispose = null
} = {}) {
  const counts = {
    initialize: 0,
    draw: 0,
    dispose: 0
  };

  return {
    counts,
    initializeOneFrameSurface() {
      counts.initialize += 1;
      if (throwOnInitialize) {
        throw throwOnInitialize;
      }
      return initializeResult;
    },
    drawOneFrame() {
      counts.draw += 1;
      if (throwOnDraw) {
        throw throwOnDraw;
      }
      return drawResult;
    },
    disposeOneFrameSurface() {
      counts.dispose += 1;
      if (throwOnDispose) {
        throw throwOnDispose;
      }
      return disposeResult;
    }
  };
}

test("adapter factory exists and module import has no side effects", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.validateGrowGoCustom25DRendererSourceLock,
    "function"
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /developer-only-growgo-custom25d-one-frame-renderer-adapter/
  );
});

test("passive identity descriptor matches discovered renderer owner and source lock classification", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();
  const sourceLock = moduleUnderTest.validateGrowGoCustom25DRendererSourceLock({
    scriptSource,
    identity
  });

  assert.equal(identity.schemaId, "GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_ADAPTER_IDENTITY_001");
  assert.equal(identity.rendererOwnerFile, "script.js");
  assert.equal(identity.rendererInitializationEntry, "initCustom25DMapExperiment");
  assert.equal(identity.rendererDrawEntry, "drawCustom25DMapCanvas");
  assert.equal(identity.rendererRetentionSlot, "custom25DMapLayer");
  assert.equal(identity.expectedCanvasOwnership, "custom25DMapLayer.canvas");
  assert.equal(identity.expectedLeafletPaneOwnership, "custom25DMapPane");
  assert.equal(identity.supportsOneFrameAdapter, false);
  assert.equal(identity.adapterConnectionStatus, "passive_disconnected");
  assert.equal(sourceLock.ok, true);
  assert.equal(sourceLock.classification, "BLOCKED_BY_MISSING_CLEANUP");
  assert.equal(sourceLock.checks.initializationFunctionFound, true);
  assert.equal(sourceLock.checks.drawFunctionFound, true);
  assert.equal(sourceLock.checks.retentionSlotFound, true);
  assert.equal(sourceLock.checks.paneCreationFound, true);
  assert.equal(sourceLock.checks.canvasCreationFound, true);
  assert.equal(sourceLock.checks.listenerRegistrationFound, true);
  assert.equal(sourceLock.checks.immediateDrawFound, true);
  assert.equal(sourceLock.checks.explicitCleanupFunctionFound, false);
  assert.equal(sourceLock.checks.explicitListenerRemovalFound, false);
  assert.equal(sourceLock.checks.explicitCanvasRemovalFound, false);
  assert.equal(sourceLock.checks.explicitRetentionResetFound, false);
});

test("missing identity and identity mismatch fail closed", () => {
  const ops = createFakeOps();
  const missing = moduleUnderTest
    .createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
      initializeOneFrameSurface: ops.initializeOneFrameSurface,
      drawOneFrame: ops.drawOneFrame,
      disposeOneFrameSurface: ops.disposeOneFrameSurface
    })
    .validateIdentity();

  const mismatchOps = createFakeOps();
  const mismatch = moduleUnderTest
    .createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
      identity: Object.freeze({
        ...moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor(),
        rendererDrawEntry: "wrongDraw"
      }),
      initializeOneFrameSurface: mismatchOps.initializeOneFrameSurface,
      drawOneFrame: mismatchOps.drawOneFrame,
      disposeOneFrameSurface: mismatchOps.disposeOneFrameSurface
    })
    .validateIdentity();

  assert.equal(missing.outcome, "failed_closed");
  assert.equal(missing.reasonCode, "MISSING_IDENTITY");
  assert.equal(mismatch.outcome, "failed_closed");
  assert.equal(mismatch.reasonCode, "IDENTITY_MISMATCH");
});

test("missing initialize draw and dispose capabilities fail closed", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();

  const missingInit = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    drawOneFrame() {
      return { ok: true };
    },
    disposeOneFrameSurface() {
      return { ok: true };
    }
  });
  missingInit.validateIdentity();
  const initResult = missingInit.initializeForOneFrame();

  const missingDraw = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface() {
      return { ok: true };
    },
    disposeOneFrameSurface() {
      return { ok: true };
    }
  });
  missingDraw.validateIdentity();
  missingDraw.initializeForOneFrame();
  const drawResult = missingDraw.drawExactlyOneFrame();

  const missingDispose = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface() {
      return { ok: true };
    },
    drawOneFrame() {
      return { ok: true };
    }
  });
  missingDispose.validateIdentity();
  missingDispose.initializeForOneFrame();
  missingDispose.drawExactlyOneFrame();
  const disposeResult = missingDispose.disposeAfterOneFrame();

  assert.equal(initResult.reasonCode, "INITIALIZE_CAPABILITY_MISSING");
  assert.equal(drawResult.reasonCode, "DRAW_CAPABILITY_MISSING");
  assert.equal(disposeResult.reasonCode, "DISPOSE_CAPABILITY_MISSING");
});

test("initial adapter status is idle and status inspection has no side effects", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();
  const ops = createFakeOps();
  const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: ops.initializeOneFrameSurface,
    drawOneFrame: ops.drawOneFrame,
    disposeOneFrameSurface: ops.disposeOneFrameSurface
  });

  const statusA = adapter.getAdapterStatus();
  const statusB = adapter.getAdapterStatus();

  assert.equal(statusA.adapterState, "idle");
  assert.equal(statusA.identityValidated, false);
  assert.equal(statusA.initialized, false);
  assert.equal(statusA.drawCompleted, false);
  assert.equal(statusA.liveMapRetained, false);
  assert.equal(statusA.liveCanvasRetained, false);
  assert.equal(statusA.realRendererInvoked, false);
  assert.equal(statusA.realCanvasCreated, false);
  assert.equal(statusA.realWebglContextCreated, false);
  assert.equal(statusA.realOverlayCreated, false);
  assert.equal(statusA.mapListenerAdded, false);
  assert.equal(statusA.networkRequested, false);
  assert.equal(statusA.assetDownloadRequested, false);
  assert.equal(statusA.automaticInvocation, false);
  assert.equal(statusA.browserCommandExposed, false);
  assert.equal(statusA, statusB);
  assert.deepEqual(ops.counts, { initialize: 0, draw: 0, dispose: 0 });
});

test("fake initialization succeeds once draw before initialization is blocked fake draw succeeds once and second draw is blocked", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();
  const ops = createFakeOps();
  const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: ops.initializeOneFrameSurface,
    drawOneFrame: ops.drawOneFrame,
    disposeOneFrameSurface: ops.disposeOneFrameSurface
  });

  adapter.validateIdentity();
  const drawBeforeInit = adapter.drawExactlyOneFrame();
  const initResult = adapter.initializeForOneFrame();
  const secondInit = adapter.initializeForOneFrame();
  const drawResult = adapter.drawExactlyOneFrame();
  const secondDraw = adapter.drawExactlyOneFrame();

  assert.equal(drawBeforeInit.reasonCode, "INITIALIZATION_REQUIRED");
  assert.equal(initResult.outcome, "initialized");
  assert.equal(initResult.status.initializationAttemptCount, 1);
  assert.equal(secondInit.reasonCode, "INITIALIZATION_ALREADY_COMPLETED");
  assert.equal(drawResult.outcome, "drawn");
  assert.equal(drawResult.status.drawAttemptCount, 1);
  assert.equal(drawResult.status.completedFrameCount, 1);
  assert.equal(secondDraw.reasonCode, "SECOND_DRAW_BLOCKED");
  assert.deepEqual(ops.counts, { initialize: 1, draw: 1, dispose: 0 });
});

test("fake disposal succeeds once repeated disposal is safe and use after disposal is blocked", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();
  const ops = createFakeOps();
  const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: ops.initializeOneFrameSurface,
    drawOneFrame: ops.drawOneFrame,
    disposeOneFrameSurface: ops.disposeOneFrameSurface
  });

  adapter.validateIdentity();
  adapter.initializeForOneFrame();
  adapter.drawExactlyOneFrame();
  const firstDispose = adapter.disposeAfterOneFrame();
  const secondDispose = adapter.disposeAfterOneFrame();
  const drawAfterDispose = adapter.drawExactlyOneFrame();

  assert.equal(firstDispose.outcome, "disposed");
  assert.equal(firstDispose.status.cleanupCompleted, true);
  assert.equal(firstDispose.status.initialized, false);
  assert.equal(firstDispose.status.closed, true);
  assert.equal(secondDispose.reasonCode, "ALREADY_DISPOSED");
  assert.equal(drawAfterDispose.reasonCode, "ADAPTER_CLOSED");
  assert.deepEqual(ops.counts, { initialize: 1, draw: 1, dispose: 1 });
});

test("initialization draw and disposal exceptions fail closed and cleanup remains required after draw failure", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();

  const initThrowOps = createFakeOps({
    throwOnInitialize: Object.assign(new Error("init exploded"), {
      reasonCode: "INITIALIZATION_EXCEPTION"
    })
  });
  const initAdapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: initThrowOps.initializeOneFrameSurface,
    drawOneFrame: initThrowOps.drawOneFrame,
    disposeOneFrameSurface: initThrowOps.disposeOneFrameSurface
  });
  initAdapter.validateIdentity();
  const initFailure = initAdapter.initializeForOneFrame();

  const drawThrowOps = createFakeOps({
    throwOnDraw: Object.assign(new Error("draw exploded"), {
      reasonCode: "DRAW_EXCEPTION"
    })
  });
  const drawAdapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: drawThrowOps.initializeOneFrameSurface,
    drawOneFrame: drawThrowOps.drawOneFrame,
    disposeOneFrameSurface: drawThrowOps.disposeOneFrameSurface
  });
  drawAdapter.validateIdentity();
  drawAdapter.initializeForOneFrame();
  const drawFailure = drawAdapter.drawExactlyOneFrame();

  const disposeThrowOps = createFakeOps({
    throwOnDispose: Object.assign(new Error("dispose exploded"), {
      reasonCode: "DISPOSAL_EXCEPTION"
    })
  });
  const disposeAdapter =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
      identity,
      initializeOneFrameSurface: disposeThrowOps.initializeOneFrameSurface,
      drawOneFrame: disposeThrowOps.drawOneFrame,
      disposeOneFrameSurface: disposeThrowOps.disposeOneFrameSurface
    });
  disposeAdapter.validateIdentity();
  disposeAdapter.initializeForOneFrame();
  disposeAdapter.drawExactlyOneFrame();
  const disposeFailure = disposeAdapter.disposeAfterOneFrame();

  assert.equal(initFailure.reasonCode, "INITIALIZATION_EXCEPTION");
  assert.equal(initFailure.status.closed, true);
  assert.equal(drawFailure.reasonCode, "DRAW_EXCEPTION");
  assert.equal(drawFailure.status.cleanupRequired, true);
  assert.equal(drawFailure.status.closed, true);
  assert.equal(disposeFailure.reasonCode, "DISPOSAL_EXCEPTION");
  assert.equal(disposeFailure.status.cleanupCompleted, false);
  assert.equal(disposeFailure.status.closed, true);
});

test("results are deeply immutable and passive adapter stays disconnected from the live renderer", () => {
  const identity =
    moduleUnderTest.createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor();
  const ops = createFakeOps();
  const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
    identity,
    initializeOneFrameSurface: ops.initializeOneFrameSurface,
    drawOneFrame: ops.drawOneFrame,
    disposeOneFrameSurface: ops.disposeOneFrameSurface
  });

  const identityResult = adapter.validateIdentity();

  assert.equal(Object.isFrozen(identityResult), true);
  assert.equal(Object.isFrozen(identityResult.status), true);
  assert.equal(Object.isFrozen(identityResult.status.canonicalSafetyFlagSnapshot), true);
  assert.throws(() => {
    identityResult.status.adapterState = "mutated";
  }, /read only|Cannot assign|object is not extensible/i);

  assert.doesNotMatch(scriptSource, /function disposeCustom25DMapExperiment/);
  assert.doesNotMatch(scriptSource, /function cleanupCustom25DMapExperiment/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /getAdapterStatus|initializeForOneFrame|drawExactlyOneFrame|disposeAfterOneFrame/
  );
  assert.equal(identityResult.status.realRendererInvoked, false);
  assert.equal(identityResult.status.realCanvasCreated, false);
  assert.equal(identityResult.status.realWebglContextCreated, false);
  assert.equal(identityResult.status.realOverlayCreated, false);
  assert.equal(identityResult.status.mapListenerAdded, false);
  assert.equal(identityResult.status.pollingOrTimerAdded, false);
  assert.equal(identityResult.status.networkRequested, false);
  assert.equal(identityResult.status.assetDownloadRequested, false);
  assert.deepEqual(identityResult.status.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});
