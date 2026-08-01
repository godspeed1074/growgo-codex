import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createFakeEnvironment(overrides = {}) {
  const calls = {
    off: [],
    removeCanvas: [],
    removePane: [],
    retentionReset: 0
  };

  const map = {
    off(eventNames, listener) {
      calls.off.push({ eventNames, listener });
      if (overrides.throwOnOff) {
        throw overrides.throwOnOff;
      }
    }
  };

  const pane = {
    childElementCount: overrides.paneChildElementCount ?? 0,
    dataset: { owner: "custom25DMapPane" }
  };

  const canvas = { id: "owned-canvas" };
  const unrelatedCanvas = { id: "unrelated-canvas" };
  const listener = function ownedRedraw() {};
  const unrelatedListener = function unrelatedListener() {};
  const redrawCallback = function redrawCallback() {};

  const retentionTarget = { current: { canvas, redraw: redrawCallback } };

  const removeCanvas = (canvasArg) => {
    calls.removeCanvas.push(canvasArg);
    if (overrides.throwOnRemoveCanvas) {
      throw overrides.throwOnRemoveCanvas;
    }
  };

  const removePaneIfEmpty = (paneArg, paneNameArg) => {
    calls.removePane.push({ paneArg, paneNameArg });
    if (overrides.throwOnRemovePane) {
      throw overrides.throwOnRemovePane;
    }

    return {
      ok: true,
      removed: paneArg.childElementCount === 0
    };
  };

  const clearRetentionSlot = () => {
    calls.retentionReset += 1;
    if (overrides.throwOnRetentionReset) {
      throw overrides.throwOnRetentionReset;
    }
    retentionTarget.current = null;
  };

  const bundle = {
    map,
    pane,
    paneName: overrides.paneName ?? "custom25DMapPane",
    canvas: overrides.canvas ?? canvas,
    listener: overrides.listener ?? listener,
    redrawCallback: overrides.redrawCallback ?? redrawCallback,
    listenerEventNames: overrides.listenerEventNames ?? "moveend zoomend",
    retentionSlotName: overrides.retentionSlotName ?? "custom25DMapLayer",
    clearRetentionSlot:
      overrides.clearRetentionSlot ?? clearRetentionSlot,
    paneOwnershipProven: overrides.paneOwnershipProven ?? true
  };

  return {
    calls,
    map,
    pane,
    canvas,
    unrelatedCanvas,
    listener,
    unrelatedListener,
    redrawCallback,
    retentionTarget,
    removeCanvas,
    removePaneIfEmpty,
    bundle
  };
}

test("lifecycle-owner factory exists module import has no side effects and source lock resolves to initialization extraction", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DRendererOwnershipSource,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DRendererOwnershipSource({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "REQUIRES_RENDERER_INITIALIZATION_EXTRACTION"
  );
  assert.equal(inspection.ownershipPoints.initializationFunction, "initCustom25DMapExperiment");
  assert.equal(inspection.ownershipPoints.drawFunction, "drawCustom25DMapCanvas");
  assert.equal(inspection.ownershipPoints.retentionSlot, "custom25DMapLayer");
  assert.equal(inspection.ownershipPoints.paneName, "custom25DMapPane");
  assert.equal(
    inspection.ownershipPoints.eventRegistration,
    'map.on("moveend zoomend", redraw);'
  );
  assert.equal(inspection.ownershipPoints.existingCleanupBehavior, "no_verified_matching_cleanup_owner");
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /registerOwnedResources|disposeOwnedResources|getLifecycleOwnerStatus/
  );
});

test("initial state owns nothing and status inspection has no side effects", () => {
  const env = createFakeEnvironment();
  const owner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: env.removeCanvas,
      removePaneIfEmpty: env.removePaneIfEmpty
    });

  const statusA = owner.getLifecycleOwnerStatus();
  const statusB = owner.getLifecycleOwnerStatus();

  assert.equal(statusA.lifecycleState, "idle");
  assert.equal(statusA.ownershipRegistered, false);
  assert.equal(statusA.disposed, false);
  assert.equal(statusA.cleanupCompleted, false);
  assert.equal(statusA.cleanupFailed, false);
  assert.equal(statusA.mapRetained, false);
  assert.equal(statusA.paneRetained, false);
  assert.equal(statusA.canvasRetained, false);
  assert.equal(statusA.listenerRetained, false);
  assert.equal(statusA.redrawCallbackRetained, false);
  assert.deepEqual(statusA.listenerEventNames, []);
  assert.equal(statusA, statusB);
  assert.deepEqual(env.calls, {
    off: [],
    removeCanvas: [],
    removePane: [],
    retentionReset: 0
  });
});

test("valid fake ownership registration succeeds and second registration is blocked", () => {
  const env = createFakeEnvironment();
  const owner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: env.removeCanvas,
      removePaneIfEmpty: env.removePaneIfEmpty
    });

  const first = owner.registerOwnedResources(env.bundle);
  const second = owner.registerOwnedResources(env.bundle);

  assert.equal(first.outcome, "registered");
  assert.equal(first.status.lifecycleState, "registered");
  assert.equal(first.status.ownershipRegistered, true);
  assert.equal(first.status.mapRetained, true);
  assert.equal(first.status.paneRetained, true);
  assert.equal(first.status.canvasRetained, true);
  assert.equal(first.status.listenerRetained, true);
  assert.equal(first.status.redrawCallbackRetained, true);
  assert.deepEqual(first.status.listenerEventNames, ["moveend zoomend"]);
  assert.equal(second.reasonCode, "OWNERSHIP_ALREADY_REGISTERED");
});

test("missing map missing canvas missing listener unexpected event names and retention mismatch all fail closed", () => {
  const base = createFakeEnvironment();

  const missingMapOwner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: base.removeCanvas,
      removePaneIfEmpty: base.removePaneIfEmpty
    });
  const missingMap = missingMapOwner.registerOwnedResources({
    ...base.bundle,
    map: null
  });

  const missingCanvasOwner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: base.removeCanvas,
      removePaneIfEmpty: base.removePaneIfEmpty
    });
  const missingCanvas = missingCanvasOwner.registerOwnedResources({
    ...base.bundle,
    canvas: null
  });

  const missingListenerOwner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: base.removeCanvas,
      removePaneIfEmpty: base.removePaneIfEmpty
    });
  const missingListener = missingListenerOwner.registerOwnedResources({
    ...base.bundle,
    listener: null
  });

  const badEventsOwner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: base.removeCanvas,
      removePaneIfEmpty: base.removePaneIfEmpty
    });
  const badEvents = badEventsOwner.registerOwnedResources({
    ...base.bundle,
    listenerEventNames: ["moveend", "zoomend"]
  });

  const badRetentionOwner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: base.removeCanvas,
      removePaneIfEmpty: base.removePaneIfEmpty
    });
  const badRetention = badRetentionOwner.registerOwnedResources({
    ...base.bundle,
    retentionSlotName: "wrongSlot"
  });

  assert.equal(missingMap.reasonCode, "MAP_OFF_REQUIRED");
  assert.equal(missingCanvas.reasonCode, "CANVAS_REQUIRED");
  assert.equal(missingListener.reasonCode, "LISTENER_REQUIRED");
  assert.equal(badEvents.reasonCode, "UNEXPECTED_EVENT_NAMES");
  assert.equal(badRetention.reasonCode, "RETENTION_SLOT_IDENTITY_MISMATCH");
  assert.equal(missingMap.status.disposed, true);
  assert.equal(badRetention.status.cleanupFailed, true);
});

test("cleanup removes exact owned resources preserves unrelated resources and clears retained references", () => {
  const env = createFakeEnvironment();
  const owner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: env.removeCanvas,
      removePaneIfEmpty: env.removePaneIfEmpty
    });

  owner.registerOwnedResources(env.bundle);
  const dispose = owner.disposeOwnedResources();
  const after = owner.getLifecycleOwnerStatus();

  assert.equal(env.calls.off.length, 1);
  assert.equal(env.calls.off[0].eventNames, "moveend zoomend");
  assert.equal(env.calls.off[0].listener, env.listener);
  assert.notEqual(env.calls.off[0].listener, env.unrelatedListener);
  assert.deepEqual(env.calls.removeCanvas, [env.canvas]);
  assert.notDeepEqual(env.calls.removeCanvas, [env.unrelatedCanvas]);
  assert.equal(env.calls.removePane.length, 1);
  assert.equal(env.calls.removePane[0].paneArg, env.pane);
  assert.equal(env.calls.removePane[0].paneNameArg, "custom25DMapPane");
  assert.equal(env.calls.retentionReset, 1);
  assert.equal(env.retentionTarget.current, null);
  assert.equal(dispose.outcome, "disposed");
  assert.equal(dispose.status.cleanupCompleted, true);
  assert.equal(dispose.status.disposed, true);
  assert.equal(dispose.status.mapRetained, false);
  assert.equal(dispose.status.paneRetained, false);
  assert.equal(dispose.status.canvasRetained, false);
  assert.equal(dispose.status.listenerRetained, false);
  assert.equal(dispose.status.redrawCallbackRetained, false);
  assert.deepEqual(dispose.status.listenerEventNames, []);
  assert.equal(after.lifecycleState, "disposed");
  assert.equal(after.unrelatedResourcesPreserved, true);
});

test("non-empty pane is preserved repeated cleanup is safe and use after disposal is blocked", () => {
  const env = createFakeEnvironment({ paneChildElementCount: 2 });
  const owner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: env.removeCanvas,
      removePaneIfEmpty: env.removePaneIfEmpty
    });

  owner.registerOwnedResources(env.bundle);
  const firstDispose = owner.disposeOwnedResources();
  const secondDispose = owner.disposeOwnedResources();
  const postDisposeRegister = owner.registerOwnedResources(env.bundle);

  assert.equal(env.calls.removePane.length, 1);
  assert.equal(env.calls.removePane[0].paneArg.childElementCount, 2);
  assert.equal(firstDispose.outcome, "disposed");
  assert.equal(secondDispose.reasonCode, "ALREADY_DISPOSED");
  assert.equal(postDisposeRegister.reasonCode, "LIFECYCLE_OWNER_DISPOSED");
});

test("cleanup failure paths report precisely and continue safely", () => {
  const envListener = createFakeEnvironment({
    throwOnOff: Object.assign(new Error("off failed"), {
      reasonCode: "LISTENER_REMOVAL_FAILED"
    })
  });
  const ownerListener =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: envListener.removeCanvas,
      removePaneIfEmpty: envListener.removePaneIfEmpty
    });
  ownerListener.registerOwnedResources(envListener.bundle);
  const listenerFailure = ownerListener.disposeOwnedResources();

  const envCanvas = createFakeEnvironment({
    throwOnRemoveCanvas: Object.assign(new Error("canvas failed"), {
      reasonCode: "CANVAS_REMOVAL_FAILED"
    })
  });
  const ownerCanvas =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: envCanvas.removeCanvas,
      removePaneIfEmpty: envCanvas.removePaneIfEmpty
    });
  ownerCanvas.registerOwnedResources(envCanvas.bundle);
  const canvasFailure = ownerCanvas.disposeOwnedResources();

  const envReset = createFakeEnvironment({
    throwOnRetentionReset: Object.assign(new Error("reset failed"), {
      reasonCode: "RETENTION_RESET_FAILED"
    })
  });
  const ownerReset =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: envReset.removeCanvas,
      removePaneIfEmpty: envReset.removePaneIfEmpty
    });
  ownerReset.registerOwnedResources(envReset.bundle);
  const resetFailure = ownerReset.disposeOwnedResources();

  assert.equal(listenerFailure.outcome, "failed_closed");
  assert.equal(listenerFailure.status.cleanupFailed, true);
  assert.match(
    listenerFailure.status.cleanupFailureReasons.join(","),
    /LISTENER_REMOVAL_FAILED/
  );
  assert.equal(envListener.calls.removeCanvas.length, 1);
  assert.equal(envListener.calls.retentionReset, 1);

  assert.equal(canvasFailure.outcome, "failed_closed");
  assert.match(
    canvasFailure.status.cleanupFailureReasons.join(","),
    /CANVAS_REMOVAL_FAILED/
  );
  assert.equal(envCanvas.calls.off.length, 1);
  assert.equal(envCanvas.calls.retentionReset, 1);

  assert.equal(resetFailure.outcome, "failed_closed");
  assert.match(
    resetFailure.status.cleanupFailureReasons.join(","),
    /RETENTION_RESET_FAILED/
  );
  assert.equal(envReset.calls.off.length, 1);
  assert.equal(envReset.calls.removeCanvas.length, 1);
});

test("results are deeply immutable and no live renderer behavior is introduced", () => {
  const env = createFakeEnvironment();
  const owner =
    moduleUnderTest.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas: env.removeCanvas,
      removePaneIfEmpty: env.removePaneIfEmpty
    });

  const status = owner.getLifecycleOwnerStatus();

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlagSnapshot), true);
  assert.throws(() => {
    status.lifecycleState = "mutated";
  }, /read only|Cannot assign|object is not extensible/i);

  assert.equal(status.realRendererInvoked, false);
  assert.equal(status.realCanvasCreated, false);
  assert.equal(status.realPaneCreated, false);
  assert.equal(status.realListenerAdded, false);
  assert.equal(status.realDrawRequested, false);
  assert.equal(status.automaticInvocation, false);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /developer-only-growgo-custom25d-renderer-lifecycle-owner/
  );
  assert.deepEqual(status.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});
