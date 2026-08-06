import test from "node:test";
import assert from "node:assert/strict";

import {
  attachPersistentAtlas,
  authorizePersistentSession,
  createControlledPersistentAtlasFakeRuntime,
  detachPersistentAtlas,
  getPersistentAtlasStatus,
  requestPersistentAtlasRedraw
} from "../client/developer-only-controlled-persistent-atlas-fake-runtime.mjs";

function createFakeEnvironment({
  identityOverrides = {},
  manualScheduler = false,
  failCreateCanvas = false,
  failCreatePane = false,
  failRegisterListenerEvent = null,
  failSnapshot = false,
  failDraw = false,
  failScheduler = false,
  failCleanupAt = null,
  drawRequestsDuringDraw = []
} = {}) {
  const currentIdentity = {
    mapIdentity: "FAKE_MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "FAKE_PACKAGE_FINGERPRINT_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "FAKE_SELECTOR_SEED_001",
    ...identityOverrides
  };

  const metrics = {
    canvasCreates: 0,
    paneCreates: 0,
    lifecycleOwnerCreates: 0,
    listenerRegistrations: [],
    listenerUnregistrations: 0,
    snapshotCreates: 0,
    draws: 0,
    drawReasons: [],
    scheduledFrames: 0,
    cleanupCanvas: 0,
    cleanupPane: 0,
    cleanupOwner: 0
  };

  const queuedFrames = [];
  let runtime = null;
  let drawBurstConsumed = false;

  const options = {
    getCurrentIdentity: () => ({ ...currentIdentity }),
    createSessionId: (() => {
      let count = 0;
      return () => {
        count += 1;
        return `FAKE_SESSION_${count}`;
      };
    })(),
    createPane: () => {
      if (failCreatePane) {
        throw new Error("PANE_CREATION_FAILED");
      }

      metrics.paneCreates += 1;
      return { kind: "fake-pane" };
    },
    destroyPane: () => {
      metrics.cleanupPane += 1;
      if (failCleanupAt === "pane") {
        throw new Error("PANE_CLEANUP_FAILED");
      }
    },
    createCanvas: () => {
      if (failCreateCanvas) {
        throw new Error("CANVAS_CREATION_FAILED");
      }

      metrics.canvasCreates += 1;
      return { kind: "fake-canvas" };
    },
    destroyCanvas: () => {
      metrics.cleanupCanvas += 1;
      if (failCleanupAt === "canvas") {
        throw new Error("CANVAS_CLEANUP_FAILED");
      }
    },
    createLifecycleOwner: () => {
      metrics.lifecycleOwnerCreates += 1;
      return { kind: "fake-lifecycle-owner" };
    },
    releaseLifecycleOwner: () => {
      metrics.cleanupOwner += 1;
      if (failCleanupAt === "owner") {
        throw new Error("OWNER_CLEANUP_FAILED");
      }
    },
    registerListener: (eventName, handler) => {
      if (failRegisterListenerEvent === eventName) {
        throw new Error(`${eventName.toUpperCase()}_LISTENER_FAILED`);
      }

      metrics.listenerRegistrations.push(eventName);
      return { eventName, handler };
    },
    unregisterListener: () => {
      metrics.listenerUnregistrations += 1;
    },
    scheduleAnimationFrame: (callback) => {
      if (failScheduler) {
        throw new Error("ANIMATION_FRAME_SCHEDULING_FAILED");
      }

      metrics.scheduledFrames += 1;

      if (manualScheduler) {
        queuedFrames.push(callback);
      } else {
        callback();
      }

      return { kind: "fake-frame-token", index: metrics.scheduledFrames };
    },
    cancelAnimationFrame: () => {},
    createSnapshot: ({ reason }) => {
      if (failSnapshot) {
        throw new Error("SNAPSHOT_FAILED");
      }

      metrics.snapshotCreates += 1;
      return { kind: "fake-snapshot", reason };
    },
    drawFrame: ({ reason }) => {
      if (failDraw) {
        throw new Error("DRAW_FAILED");
      }

      metrics.draws += 1;
      metrics.drawReasons.push(reason);

      if (!drawBurstConsumed) {
        drawBurstConsumed = true;
        for (const redrawReason of drawRequestsDuringDraw) {
          runtime.requestPersistentAtlasRedraw(redrawReason);
        }
      }

      return { kind: "fake-draw-result", reason };
    }
  };

  runtime = createControlledPersistentAtlasFakeRuntime(options);

  return {
    runtime,
    metrics,
    currentIdentity,
    flushNextFrame() {
      const callback = queuedFrames.shift();
      if (callback) {
        callback();
      }
    },
    flushAllFrames(limit = 10) {
      let remaining = limit;
      while (queuedFrames.length > 0 && remaining > 0) {
        remaining -= 1;
        const callback = queuedFrames.shift();
        callback();
      }
    },
    mutateIdentity(overrides) {
      Object.assign(currentIdentity, overrides);
    }
  };
}

test("initial detached state is frozen serializable and keeps all canonical flags false", () => {
  const { runtime } = createFakeEnvironment();
  const status = getPersistentAtlasStatus(runtime);

  assert.equal(status.schemaId, "GROWGO_CONTROLLED_PERSISTENT_ATLAS_FAKE_RUNTIME_STATUS_001");
  assert.equal(status.lifecycleState, "detached");
  assert.equal(status.attached, false);
  assert.equal(status.authorizationActive, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("authorization creates one persistent fake session and repeated authorization does not create a duplicate session", () => {
  const { runtime } = createFakeEnvironment();

  const first = authorizePersistentSession(runtime);
  const second = authorizePersistentSession(runtime);

  assert.equal(first.outcome, "authorized");
  assert.deepEqual(first.transitionPath, ["detached", "authorizing", "detached"]);
  assert.equal(first.status.authorizationActive, true);
  assert.equal(first.status.authorizationConsumed, false);
  assert.equal(first.status.sessionId, "FAKE_SESSION_1");
  assert.equal(second.outcome, "already_authorized");
  assert.equal(second.status.sessionId, "FAKE_SESSION_1");
});

test("successful attach creates one canvas one pane one listener set and one initial redraw", () => {
  const { runtime, metrics } = createFakeEnvironment();

  authorizePersistentSession(runtime);
  const attach = attachPersistentAtlas(runtime);
  const status = getPersistentAtlasStatus(runtime);

  assert.equal(attach.outcome, "attached");
  assert.deepEqual(attach.transitionPath, [
    "detached",
    "attaching",
    "redraw_queued",
    "drawing",
    "attached_idle"
  ]);
  assert.equal(metrics.canvasCreates, 1);
  assert.equal(metrics.paneCreates, 1);
  assert.equal(metrics.lifecycleOwnerCreates, 1);
  assert.deepEqual(metrics.listenerRegistrations.sort(), ["moveend", "resize", "zoomend"]);
  assert.equal(metrics.snapshotCreates, 1);
  assert.equal(metrics.draws, 1);
  assert.equal(status.attached, true);
  assert.equal(status.lifecycleState, "attached_idle");
  assert.equal(status.authorizationActive, false);
  assert.equal(status.authorizationConsumed, true);
  assert.equal(status.ownedCanvasCount, 1);
  assert.equal(status.ownedPaneCount, 1);
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(status.redrawRequestedCount, 1);
  assert.equal(status.redrawCompletedCount, 1);
  assert.equal(status.animationFrameScheduleCount, 1);
  assert.equal(status.snapshotAttemptCount, 1);
  assert.equal(status.snapshotCompletedCount, 1);
  assert.equal(status.drawAttemptCount, 1);
  assert.equal(status.drawCompletedCount, 1);
  assert.equal(status.lastDrawReason, "initial_attach");
});

test("moveend zoomend and resize fired before one scheduled frame coalesce into one redraw", () => {
  const env = createFakeEnvironment({ manualScheduler: true });
  const { runtime, metrics } = env;

  authorizePersistentSession(runtime);
  attachPersistentAtlas(runtime);

  let status = getPersistentAtlasStatus(runtime);
  assert.equal(status.lifecycleState, "redraw_queued");

  requestPersistentAtlasRedraw(runtime, "moveend");
  requestPersistentAtlasRedraw(runtime, "zoomend");
  requestPersistentAtlasRedraw(runtime, "resize");
  env.flushAllFrames();

  status = getPersistentAtlasStatus(runtime);
  assert.equal(metrics.scheduledFrames, 1);
  assert.equal(metrics.snapshotCreates, 1);
  assert.equal(metrics.draws, 1);
  assert.equal(status.redrawRequestedCount, 4);
  assert.equal(status.redrawCompletedCount, 1);
  assert.ok(status.redrawCoalescedCount >= 3);
  assert.equal(status.lifecycleState, "attached_idle");
});

test("redraw while drawing is coalesced into at most one follow-up redraw with no recursion or parallel draw", () => {
  const env = createFakeEnvironment({
    drawRequestsDuringDraw: ["moveend", "zoomend", "resize"]
  });
  const { runtime, metrics } = env;

  authorizePersistentSession(runtime);
  attachPersistentAtlas(runtime);

  const status = getPersistentAtlasStatus(runtime);

  assert.equal(metrics.scheduledFrames, 2);
  assert.equal(metrics.draws, 2);
  assert.equal(metrics.drawReasons[0], "initial_attach");
  assert.deepEqual(
    new Set(["moveend", "zoomend", "resize"]).has(metrics.drawReasons[1]),
    true
  );
  assert.ok(status.redrawCoalescedCount >= 2);
  assert.equal(status.redrawCompletedCount, 2);
  assert.equal(status.lifecycleState, "attached_idle");
});

test("duplicate attach is blocked and does not create another canvas or listener set", () => {
  const { runtime, metrics } = createFakeEnvironment();

  authorizePersistentSession(runtime);
  const first = attachPersistentAtlas(runtime);
  const second = attachPersistentAtlas(runtime);

  assert.equal(first.outcome, "attached");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "ALREADY_ATTACHED");
  assert.equal(metrics.canvasCreates, 1);
  assert.equal(metrics.paneCreates, 1);
  assert.equal(metrics.listenerRegistrations.length, 3);
});

test("repeated detach is harmless and deterministic", () => {
  const { runtime, metrics } = createFakeEnvironment();

  authorizePersistentSession(runtime);
  attachPersistentAtlas(runtime);
  const first = detachPersistentAtlas(runtime);
  const second = detachPersistentAtlas(runtime);
  const status = getPersistentAtlasStatus(runtime);

  assert.equal(first.outcome, "detached");
  assert.deepEqual(first.transitionPath, ["attached_idle", "detaching", "detached"]);
  assert.equal(second.outcome, "already_detached");
  assert.equal(status.lifecycleState, "detached");
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(metrics.cleanupCanvas, 1);
  assert.equal(metrics.cleanupPane, 1);
  assert.equal(metrics.cleanupOwner, 1);
  assert.equal(metrics.listenerUnregistrations, 3);
});

test("stale session and identity drift both fail closed and clean ownership", () => {
  const stale = createFakeEnvironment();
  authorizePersistentSession(stale.runtime);
  stale.mutateIdentity({ packageFingerprint: "DRIFTED" });
  const staleAttach = attachPersistentAtlas(stale.runtime);

  assert.equal(staleAttach.outcome, "failed_closed");
  assert.equal(staleAttach.reasonCode, "IDENTITY_DRIFT_DETECTED");
  assert.equal(staleAttach.status.ownedCanvasCount, 0);
  assert.equal(staleAttach.status.referencesReleased, true);

  const drift = createFakeEnvironment({ manualScheduler: true });
  authorizePersistentSession(drift.runtime);
  attachPersistentAtlas(drift.runtime);
  drift.mutateIdentity({ recipeVersion: "2" });
  const redraw = requestPersistentAtlasRedraw(drift.runtime, "moveend");

  assert.equal(redraw.outcome, "failed_closed");
  assert.equal(redraw.reasonCode, "IDENTITY_DRIFT_DETECTED");
  assert.equal(redraw.status.attached, false);
  assert.equal(redraw.status.ownedListenerCount, 0);
});

test("canvas pane and listener failures fail closed without leaking owned resources", () => {
  const canvasEnv = createFakeEnvironment({ failCreateCanvas: true });
  authorizePersistentSession(canvasEnv.runtime);
  const canvasResult = attachPersistentAtlas(canvasEnv.runtime);
  assert.equal(canvasResult.outcome, "failed_closed");
  assert.equal(canvasResult.reasonCode, "CANVAS_CREATION_FAILED");
  assert.equal(canvasResult.status.ownedCanvasCount, 0);
  assert.equal(canvasResult.status.ownedPaneCount, 0);

  const paneEnv = createFakeEnvironment({ failCreatePane: true });
  authorizePersistentSession(paneEnv.runtime);
  const paneResult = attachPersistentAtlas(paneEnv.runtime);
  assert.equal(paneResult.outcome, "failed_closed");
  assert.equal(paneResult.reasonCode, "PANE_CREATION_FAILED");
  assert.equal(paneResult.status.referencesReleased, true);

  const listenerEnv = createFakeEnvironment({ failRegisterListenerEvent: "zoomend" });
  authorizePersistentSession(listenerEnv.runtime);
  const listenerResult = attachPersistentAtlas(listenerEnv.runtime);
  assert.equal(listenerResult.outcome, "failed_closed");
  assert.equal(listenerResult.reasonCode, "ZOOMEND_LISTENER_FAILED");
  assert.equal(listenerResult.status.ownedListenerCount, 0);
  assert.equal(listenerResult.status.referencesReleased, true);
});

test("snapshot draw and scheduler failures fail closed and clean up deterministically", () => {
  const snapshotEnv = createFakeEnvironment({ failSnapshot: true });
  authorizePersistentSession(snapshotEnv.runtime);
  const snapshotResult = attachPersistentAtlas(snapshotEnv.runtime);
  assert.equal(snapshotResult.outcome, "attached");
  const snapshotStatus = getPersistentAtlasStatus(snapshotEnv.runtime);
  assert.equal(snapshotStatus.lifecycleState, "failed_closed");
  assert.equal(snapshotStatus.lastFailureReason, "SNAPSHOT_FAILED");
  assert.equal(snapshotStatus.attached, false);

  const drawEnv = createFakeEnvironment({ failDraw: true });
  authorizePersistentSession(drawEnv.runtime);
  attachPersistentAtlas(drawEnv.runtime);
  const drawStatus = getPersistentAtlasStatus(drawEnv.runtime);
  assert.equal(drawStatus.lifecycleState, "failed_closed");
  assert.equal(drawStatus.lastFailureReason, "DRAW_FAILED");
  assert.equal(drawStatus.attached, false);

  const schedulerEnv = createFakeEnvironment({ failScheduler: true });
  authorizePersistentSession(schedulerEnv.runtime);
  const schedulerResult = attachPersistentAtlas(schedulerEnv.runtime);
  assert.equal(schedulerResult.outcome, "failed_closed");
  assert.equal(
    schedulerResult.reasonCode,
    "ANIMATION_FRAME_SCHEDULING_FAILED"
  );
  assert.equal(schedulerResult.status.attached, false);
});

test("cleanup failure is reported explicitly and redraw after detach is blocked", () => {
  const env = createFakeEnvironment({ failCleanupAt: "canvas" });
  authorizePersistentSession(env.runtime);
  attachPersistentAtlas(env.runtime);
  const detach = detachPersistentAtlas(env.runtime);

  assert.equal(detach.outcome, "failed_closed");
  assert.equal(detach.reasonCode, "CLEANUP_FAILED");
  assert.equal(detach.status.cleanupFailed, true);
  assert.deepEqual(detach.status.cleanupFailureReasons, ["CANVAS_CLEANUP_FAILED"]);
  assert.equal(detach.status.referencesReleased, false);

  const redrawAfterDetach = requestPersistentAtlasRedraw(env.runtime, "moveend");
  assert.equal(redrawAfterDetach.outcome, "blocked");
  assert.equal(redrawAfterDetach.reasonCode, "NOT_ATTACHED");
});

test("diagnostics remain immutable serializable and free of raw fake references while no forbidden listeners are registered", () => {
  const { runtime, metrics } = createFakeEnvironment();
  authorizePersistentSession(runtime);
  attachPersistentAtlas(runtime);

  const status = getPersistentAtlasStatus(runtime);

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.boundIdentity), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.deepEqual(metrics.listenerRegistrations.sort(), ["moveend", "resize", "zoomend"]);
  assert.equal(metrics.listenerRegistrations.includes("move"), false);
  assert.equal(metrics.listenerRegistrations.includes("drag"), false);
  assert.equal(metrics.listenerRegistrations.includes("mousemove"), false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("listeners" in status, false);
});
