import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  acquireRetainedSurface,
  cancelQueuedRetainedRedraw,
  createPersistentAtlasRetainedResourceContract,
  getRetainedResourceStatus,
  queueRetainedRedraw,
  registerRetainedListeners,
  releaseRetainedResources
} from "../client/developer-only-persistent-atlas-retained-resource-contract.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-persistent-atlas-retained-resource-contract.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_56_RETAINED_RESOURCE_CLEANUP_CONTRACT.md"
);

function createHarness({
  manualScheduler = false,
  createPaneReturnsNull = false,
  failCreateCanvas = false,
  failCreatePane = false,
  failCreateLifecycleOwner = false,
  failRegisterEvent = null,
  failSchedule = false,
  failCancel = false,
  failUnregisterEvent = null,
  failRemoveCanvas = false,
  failRemovePane = false,
  failReleaseLifecycleOwner = false
} = {}) {
  const queuedCallbacks = [];
  const metrics = {
    createPaneCalls: 0,
    createCanvasCalls: 0,
    createLifecycleOwnerCalls: 0,
    registerEvents: [],
    unregisterEvents: [],
    scheduleCount: 0,
    cancelCount: 0,
    removeCanvasCount: 0,
    removePaneCount: 0,
    releaseLifecycleOwnerCount: 0,
    cleanupOrder: [],
    queueCallbackRuns: 0
  };

  const contract = createPersistentAtlasRetainedResourceContract({
    createPane(context) {
      metrics.createPaneCalls += 1;
      if (failCreatePane) {
        throw Object.assign(new Error("CREATE_PANE_FAILED"), {
          reasonCode: "CREATE_PANE_FAILED"
        });
      }
      return createPaneReturnsNull
        ? null
        : {
            kind: "fake-pane",
            ownerId: context.surfaceOwnerId
          };
    },
    createCanvas(context) {
      metrics.createCanvasCalls += 1;
      if (failCreateCanvas) {
        throw Object.assign(new Error("CREATE_CANVAS_FAILED"), {
          reasonCode: "CREATE_CANVAS_FAILED"
        });
      }
      return {
        kind: "fake-canvas",
        ownerId: context.surfaceOwnerId
      };
    },
    createLifecycleOwner(context) {
      metrics.createLifecycleOwnerCalls += 1;
      if (failCreateLifecycleOwner) {
        throw Object.assign(new Error("CREATE_LIFECYCLE_OWNER_FAILED"), {
          reasonCode: "CREATE_LIFECYCLE_OWNER_FAILED"
        });
      }
      return {
        kind: "fake-lifecycle-owner",
        ownerId: context.lifecycleOwnerId
      };
    },
    registerListener(eventName, context) {
      metrics.registerEvents.push(eventName);
      if (failRegisterEvent === eventName) {
        throw Object.assign(new Error(`${eventName.toUpperCase()}_REGISTER_FAILED`), {
          reasonCode: `${eventName.toUpperCase()}_REGISTER_FAILED`
        });
      }
      return {
        kind: "fake-listener-registration",
        eventName,
        mapIdentityId: context.mapIdentityId
      };
    },
    unregisterListener(eventName) {
      metrics.cleanupOrder.push(`remove_${eventName}_listener`);
      metrics.unregisterEvents.push(eventName);
      if (failUnregisterEvent === eventName) {
        throw Object.assign(new Error(`${eventName.toUpperCase()}_UNREGISTER_FAILED`), {
          reasonCode: `${eventName.toUpperCase()}_UNREGISTER_FAILED`
        });
      }
    },
    scheduleFrame(callback) {
      metrics.scheduleCount += 1;
      if (failSchedule) {
        throw Object.assign(new Error("SCHEDULE_FRAME_FAILED"), {
          reasonCode: "SCHEDULE_FRAME_FAILED"
        });
      }
      if (manualScheduler) {
        queuedCallbacks.push(callback);
      } else {
        metrics.queueCallbackRuns += 1;
        callback();
      }
      return {
        kind: "fake-frame-handle",
        id: metrics.scheduleCount
      };
    },
    cancelFrame() {
      metrics.cleanupOrder.push("cancel_queued_frame");
      metrics.cancelCount += 1;
      if (failCancel) {
        throw Object.assign(new Error("CANCEL_FRAME_FAILED"), {
          reasonCode: "CANCEL_FRAME_FAILED"
        });
      }
    },
    removeCanvas() {
      metrics.cleanupOrder.push("remove_canvas");
      metrics.removeCanvasCount += 1;
      if (failRemoveCanvas) {
        throw Object.assign(new Error("REMOVE_CANVAS_FAILED"), {
          reasonCode: "REMOVE_CANVAS_FAILED"
        });
      }
    },
    removePane() {
      metrics.cleanupOrder.push("remove_owned_pane");
      metrics.removePaneCount += 1;
      if (failRemovePane) {
        throw Object.assign(new Error("REMOVE_PANE_FAILED"), {
          reasonCode: "REMOVE_PANE_FAILED"
        });
      }
    },
    releaseLifecycleOwner() {
      metrics.cleanupOrder.push("release_lifecycle_owner");
      metrics.releaseLifecycleOwnerCount += 1;
      if (failReleaseLifecycleOwner) {
        throw Object.assign(new Error("RELEASE_LIFECYCLE_OWNER_FAILED"), {
          reasonCode: "RELEASE_LIFECYCLE_OWNER_FAILED"
        });
      }
    }
  });

  return {
    contract,
    metrics,
    flushOne() {
      const callback = queuedCallbacks.shift();
      if (callback) {
        metrics.queueCallbackRuns += 1;
        callback();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queuedCallbacks.length && remaining > 0) {
        remaining -= 1;
        const callback = queuedCallbacks.shift();
        metrics.queueCallbackRuns += 1;
        callback();
      }
    }
  };
}

function acquireReadyContract(options = {}) {
  const harness = createHarness(options);
  const { contract } = harness;
  const acquire = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });
  const listeners = registerRetainedListeners(contract);
  return { harness, contract, acquire, listeners };
}

test("initial empty state is frozen serializable and keeps all canonical safety flags false", () => {
  const { contract } = createHarness();
  const status = getRetainedResourceStatus(contract);

  assert.equal(status.schemaId, "GROWGO_PERSISTENT_ATLAS_RETAINED_RESOURCE_STATUS_001");
  assert.equal(status.state, "empty");
  assert.equal(status.ready, false);
  assert.equal(status.failedClosed, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.queuedFrameCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("acquire one retained surface creates exactly one canvas and stores explicit owner ids", () => {
  const { contract, metrics } = createHarness();
  const result = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  assert.equal(result.outcome, "acquired");
  assert.equal(result.reasonCode, "RETAINED_SURFACE_ACQUIRED");
  assert.equal(metrics.createCanvasCalls, 1);
  assert.equal(metrics.createPaneCalls, 1);
  assert.equal(metrics.createLifecycleOwnerCalls, 1);
  assert.equal(result.status.state, "surface_retained");
  assert.equal(result.status.surfaceOwnerId, "SURFACE_OWNER_A");
  assert.equal(result.status.lifecycleOwnerId, "LIFECYCLE_OWNER_A");
  assert.equal(result.status.mapIdentityId, "MAP_A");
  assert.equal(result.status.ownedCanvasCount, 1);
  assert.equal(result.status.ownedPaneCount, 1);
  assert.equal(result.status.referencesReleased, false);
});

test("second acquire is blocked and does not create a second canvas", () => {
  const { contract, metrics } = createHarness();
  acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  const second = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_B",
    lifecycleOwnerId: "LIFECYCLE_OWNER_B",
    mapIdentityId: "MAP_B"
  });

  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "SECOND_SURFACE_REQUEST_BLOCKED");
  assert.equal(metrics.createCanvasCalls, 1);
});

test("pane ownership stays at one maximum when a pane is created", () => {
  const { contract } = createHarness();
  acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });
  const status = getRetainedResourceStatus(contract);

  assert.equal(status.ownedPaneCount, 1);
});

test("surface contract supports zero additional pane creation while still keeping one retained canvas", () => {
  const { contract } = createHarness({ createPaneReturnsNull: true });
  const result = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  assert.equal(result.outcome, "acquired");
  assert.equal(result.status.ownedCanvasCount, 1);
  assert.equal(result.status.ownedPaneCount, 0);
});

test("registering listeners installs exactly moveend zoomend and resize once", () => {
  const { contract, metrics } = createHarness();
  acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  const result = registerRetainedListeners(contract);

  assert.equal(result.outcome, "registered");
  assert.deepEqual(metrics.registerEvents, ["moveend", "zoomend", "resize"]);
  assert.equal(result.status.ownedListenerCount, 3);
  assert.equal(result.status.moveendListenerRegistered, true);
  assert.equal(result.status.zoomendListenerRegistered, true);
  assert.equal(result.status.resizeListenerRegistered, true);
  assert.equal(result.status.state, "ready");
});

test("duplicate listener registration is blocked", () => {
  const { contract } = createHarness();
  acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });
  registerRetainedListeners(contract);

  const duplicate = registerRetainedListeners(contract);

  assert.equal(duplicate.outcome, "blocked");
  assert.equal(duplicate.reasonCode, "DUPLICATE_LISTENER_REGISTRATION_BLOCKED");
});

test("listener registration failure after partial success rolls back and fails closed", () => {
  const { contract, metrics } = createHarness({ failRegisterEvent: "zoomend" });
  acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  const result = registerRetainedListeners(contract);

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "ZOOMEND_REGISTER_FAILED");
  assert.deepEqual(metrics.registerEvents, ["moveend", "zoomend"]);
  assert.deepEqual(metrics.unregisterEvents, ["moveend"]);
  assert.equal(result.status.failedClosed, true);
});

test("queue one retained redraw schedules exactly one frame", () => {
  const { harness, contract } = acquireReadyContract({ manualScheduler: true });
  const queued = queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  assert.equal(queued.outcome, "queued");
  assert.equal(harness.metrics.scheduleCount, 1);
  assert.equal(queued.status.state, "redraw_queued");
  assert.equal(queued.status.queuedFrameCount, 1);
});

test("repeated redraw requests coalesce into one queued frame", () => {
  const { harness, contract } = acquireReadyContract({ manualScheduler: true });
  const first = queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });
  const second = queueRetainedRedraw(contract, {
    reason: "zoomend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  assert.equal(first.outcome, "queued");
  assert.equal(second.outcome, "coalesced");
  assert.equal(harness.metrics.scheduleCount, 1);
  assert.equal(second.status.redrawCoalescedCount, 1);
});

test("manual cancellation clears one queued redraw and returns to ready", () => {
  const { contract } = acquireReadyContract({ manualScheduler: true });
  queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  const cancelled = cancelQueuedRetainedRedraw(contract);

  assert.equal(cancelled.outcome, "cancelled");
  assert.equal(cancelled.reasonCode, "QUEUED_REDRAW_CANCELLED");
  assert.equal(cancelled.status.state, "ready");
  assert.equal(cancelled.status.queuedFrameCount, 0);
});

test("release cancels one queued frame and preserves explicit cleanup order", () => {
  const { contract } = acquireReadyContract({ manualScheduler: true });
  queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  const released = releaseRetainedResources(contract);

  assert.equal(released.outcome, "released");
  assert.deepEqual(released.cleanupSteps, [
    "block_new_redraw_requests",
    "cancel_queued_frame",
    "remove_moveend_listener",
    "remove_zoomend_listener",
    "remove_resize_listener",
    "release_draw_references",
    "release_snapshot_references",
    "remove_canvas",
    "remove_owned_pane",
    "release_lifecycle_owner",
    "clear_map_and_identity_references",
    "return_detached"
  ]);
  assert.equal(released.status.state, "released");
  assert.equal(released.status.queuedFrameCount, 0);
});

test("stale queued callback is ignored after release", () => {
  const { harness, contract } = acquireReadyContract({ manualScheduler: true });
  queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });
  releaseRetainedResources(contract);
  harness.flushAll();

  const status = getRetainedResourceStatus(contract);
  assert.equal(status.state, "released");
  assert.equal(status.redrawQueueCompletedCount, 0);
  assert.equal(status.queuedFrameCount, 0);
});

test("repeated release is harmless", () => {
  const { contract } = acquireReadyContract();
  const first = releaseRetainedResources(contract);
  const second = releaseRetainedResources(contract);

  assert.equal(first.outcome, "released");
  assert.equal(second.outcome, "released");
  assert.equal(second.status.state, "released");
  assert.equal(second.status.ownedCanvasCount, 0);
});

test("successful release leaves zero owned resources and all references released", () => {
  const { contract } = acquireReadyContract();
  releaseRetainedResources(contract);
  const status = getRetainedResourceStatus(contract);

  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.queuedFrameCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.surfaceOwnerId, null);
  assert.equal(status.lifecycleOwnerId, null);
  assert.equal(status.mapIdentityId, null);
});

test("canvas acquisition failure fails closed and attempts cleanup", () => {
  const { contract } = createHarness({ failCreateCanvas: true });
  const result = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CREATE_CANVAS_FAILED");
  assert.equal(result.status.failedClosed, true);
});

test("pane acquisition failure fails closed", () => {
  const { contract } = createHarness({ failCreatePane: true });
  const result = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CREATE_PANE_FAILED");
});

test("lifecycle-owner acquisition failure fails closed", () => {
  const { contract } = createHarness({ failCreateLifecycleOwner: true });
  const result = acquireRetainedSurface(contract, {
    surfaceOwnerId: "SURFACE_OWNER_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    mapIdentityId: "MAP_A"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CREATE_LIFECYCLE_OWNER_FAILED");
});

test("scheduler failure fails closed and attempts cleanup", () => {
  const { contract } = acquireReadyContract({ failSchedule: true });
  const result = queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "SCHEDULE_FRAME_FAILED");
  assert.equal(result.status.failedClosed, true);
});

test("cancellation failure is recorded and contract fails closed", () => {
  const { contract } = acquireReadyContract({
    manualScheduler: true,
    failCancel: true
  });
  queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  const result = cancelQueuedRetainedRedraw(contract);

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "CANCEL_FRAME_FAILED");
  assert.equal(result.status.failedClosed, true);
});

test("listener removal failure is recorded during cleanup", () => {
  const { contract } = acquireReadyContract({ failUnregisterEvent: "zoomend" });
  const result = releaseRetainedResources(contract);

  assert.equal(result.status.cleanupFailed, true);
  assert.match(result.cleanupFailureReasons.join(","), /ZOOMEND_UNREGISTER_FAILED/);
  assert.equal(result.status.failedClosed, true);
});

test("canvas removal failure is recorded during cleanup", () => {
  const { contract } = acquireReadyContract({ failRemoveCanvas: true });
  const result = releaseRetainedResources(contract);

  assert.equal(result.status.cleanupFailed, true);
  assert.match(result.cleanupFailureReasons.join(","), /REMOVE_CANVAS_FAILED/);
});

test("pane removal failure is recorded during cleanup", () => {
  const { contract } = acquireReadyContract({ failRemovePane: true });
  const result = releaseRetainedResources(contract);

  assert.equal(result.status.cleanupFailed, true);
  assert.match(result.cleanupFailureReasons.join(","), /REMOVE_PANE_FAILED/);
});

test("lifecycle-owner release failure is recorded during cleanup", () => {
  const { contract } = acquireReadyContract({ failReleaseLifecycleOwner: true });
  const result = releaseRetainedResources(contract);

  assert.equal(result.status.cleanupFailed, true);
  assert.match(
    result.cleanupFailureReasons.join(","),
    /RELEASE_LIFECYCLE_OWNER_FAILED/
  );
});

test("stale map identity fails closed before redraw execution", () => {
  const { contract } = acquireReadyContract();
  const result = queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_B",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "STALE_MAP_IDENTITY");
  assert.equal(result.status.failedClosed, true);
});

test("stale lifecycle owner fails closed before redraw execution", () => {
  const { contract } = acquireReadyContract();
  const result = queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_B"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "STALE_LIFECYCLE_OWNER");
  assert.equal(result.status.failedClosed, true);
});

test("successful async queued callback completes and returns the contract to ready", () => {
  const { harness, contract } = acquireReadyContract({ manualScheduler: true });
  queueRetainedRedraw(contract, {
    reason: "moveend",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });
  harness.flushOne();

  const status = getRetainedResourceStatus(contract);
  assert.equal(status.state, "ready");
  assert.equal(status.redrawQueueCompletedCount, 1);
  assert.equal(status.queuedFrameCount, 0);
});

test("status stays immutable and serializable after successful acquisition and listener registration", () => {
  const { contract } = acquireReadyContract();
  const status = getRetainedResourceStatus(contract);

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("listeners" in status, false);
});

test("forbidden listeners are absent and only approved listeners are ever registered", () => {
  const { metrics } = acquireReadyContract().harness;
  assert.equal(metrics.registerEvents.includes("move"), false);
  assert.equal(metrics.registerEvents.includes("drag"), false);
  assert.equal(metrics.registerEvents.includes("mousemove"), false);
  assert.equal(metrics.registerEvents.includes("touchmove"), false);
});

test("module stays disconnected from real browser seams and session document exists", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bdocument\b/);
  assert.doesNotMatch(source, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(source, /\baddEventListener\b/);
  assert.doesNotMatch(source, /\bLeaflet\b/);
  assert.ok(fs.existsSync(sessionDocPath));
});

test("all canonical safety flags remain false in ready and released states", () => {
  const { contract } = acquireReadyContract();
  const readyStatus = getRetainedResourceStatus(contract);
  releaseRetainedResources(contract);
  const releasedStatus = getRetainedResourceStatus(contract);

  for (const status of [readyStatus, releasedStatus]) {
    assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
    assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
    assert.equal(
      status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
      false
    );
    assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  }
});
