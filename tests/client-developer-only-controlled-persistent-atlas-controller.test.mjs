import test from "node:test";
import assert from "node:assert/strict";

import {
  attachPersistentAtlas,
  authorizePersistentAtlasSession,
  createControlledPersistentAtlasController,
  detachPersistentAtlas,
  getPersistentAtlasControllerStatus,
  requestPersistentAtlasRedraw
} from "../client/developer-only-controlled-persistent-atlas-controller.mjs";

const AUTHORIZE = "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
const ATTACH = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const DETACH = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";

function createHarness({
  localDevelopment = true,
  readinessApproved = true,
  identityOverrides = {},
  sessionIdentityOverrides = {},
  readinessIdentityOverrides = {},
  manualScheduler = false,
  failReadiness = false,
  failSnapshot = false,
  failDraw = false,
  failScheduler = false,
  failListenerEvent = null,
  failCleanup = false,
  failSurface = false,
  failLifecycleOwner = false,
  duringDrawRedrawReasons = [],
  forbiddenListenerInjection = false
} = {}) {
  const identity = {
    mapIdentity: "FAKE_MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_001",
    sessionId: "SESSION_001",
    ...identityOverrides
  };

  const metrics = {
    mapGets: 0,
    readinessGets: 0,
    identityGets: 0,
    sessions: 0,
    lifecycleOwners: 0,
    surfaces: 0,
    listenerEvents: [],
    listenerRemovals: 0,
    scheduleCount: 0,
    cancelCount: 0,
    snapshots: 0,
    draws: 0,
    cleanupCount: 0
  };

  let burstConsumed = false;
  const queued = [];
  const map = { kind: "fake-map" };
  let controller;

  controller = createControlledPersistentAtlasController({
    mapProvider: {
      getMap() {
        metrics.mapGets += 1;
        return map;
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        metrics.readinessGets += 1;
        if (failReadiness) {
          throw Object.assign(new Error("READINESS_PROVIDER_FAILED"), {
            reasonCode: "READINESS_PROVIDER_FAILED"
          });
        }
        return {
          approved: readinessApproved,
          reasonCode: readinessApproved ? "READINESS_APPROVED" : "READINESS_REJECTED",
          identity: { ...identity, ...readinessIdentityOverrides }
        };
      }
    },
    authorizationProvider: {
      isLocalDevelopment() {
        return localDevelopment;
      },
      createPersistentSession() {
        metrics.sessions += 1;
        return {
          sessionId: "SESSION_001",
          authorizedIdentity: {
            ...identity,
            ...sessionIdentityOverrides,
            sessionId: "SESSION_001"
          }
        };
      }
    },
    identityProvider: {
      getPersistentAttachmentIdentity() {
        metrics.identityGets += 1;
        return { ...identity };
      }
    },
    lifecycleOwnerProvider: {
      createLifecycleOwner() {
        metrics.lifecycleOwners += 1;
        if (failLifecycleOwner) {
          throw Object.assign(new Error("LIFECYCLE_OWNER_FAILED"), {
            reasonCode: "LIFECYCLE_OWNER_FAILED"
          });
        }
        return { kind: "fake-lifecycle-owner" };
      }
    },
    surfaceProvider: {
      preparePersistentSurface() {
        metrics.surfaces += 1;
        if (failSurface) {
          throw Object.assign(new Error("SURFACE_PREPARATION_FAILED"), {
            reasonCode: "SURFACE_PREPARATION_FAILED"
          });
        }
        return {
          pane: { kind: "fake-pane" },
          canvas: { kind: "fake-canvas" },
          cleanupOwner: { kind: "fake-cleanup-owner" }
        };
      }
    },
    listenerRegistrar(eventName) {
      const finalEvent = forbiddenListenerInjection ? "move" : eventName;
      if (failListenerEvent === finalEvent) {
        throw Object.assign(new Error(`${finalEvent.toUpperCase()}_LISTENER_FAILED`), {
          reasonCode: `${finalEvent.toUpperCase()}_LISTENER_FAILED`
        });
      }
      metrics.listenerEvents.push(finalEvent);
      return { eventName: finalEvent };
    },
    listenerRemover() {
      metrics.listenerRemovals += 1;
    },
    animationFrameScheduler: {
      schedule(callback) {
        if (failScheduler) {
          throw Object.assign(new Error("ANIMATION_FRAME_SCHEDULING_FAILED"), {
            reasonCode: "ANIMATION_FRAME_SCHEDULING_FAILED"
          });
        }
        metrics.scheduleCount += 1;
        if (manualScheduler) {
          queued.push(callback);
        } else {
          callback();
        }
        return { kind: "frame-handle", id: metrics.scheduleCount };
      },
      cancel() {
        metrics.cancelCount += 1;
      }
    },
    snapshotProvider: {
      createPersistentSnapshot() {
        metrics.snapshots += 1;
        if (failSnapshot) {
          throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
            reasonCode: "SNAPSHOT_PROVIDER_FAILED"
          });
        }
        return { kind: "fake-snapshot" };
      }
    },
    drawProvider: {
      drawPersistentFrame() {
        metrics.draws += 1;
        if (failDraw) {
          throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
            reasonCode: "DRAW_PROVIDER_FAILED"
          });
        }
        if (!burstConsumed) {
          burstConsumed = true;
          for (const reason of duringDrawRedrawReasons) {
            controller.requestPersistentAtlasRedraw({
              confirmation: REDRAW,
              reason
            });
          }
        }
      }
    },
    cleanupProvider: {
      cleanupPersistentAttachment() {
        metrics.cleanupCount += 1;
        if (failCleanup) {
          return {
            cleanupCompleted: false,
            reasonCode: "CLEANUP_PROVIDER_FAILED"
          };
        }
        return { cleanupCompleted: true };
      }
    }
  });

  return {
    controller,
    metrics,
    identity,
    mutateIdentity(overrides) {
      Object.assign(identity, overrides);
    },
    flushOne() {
      const callback = queued.shift();
      if (callback) {
        callback();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queued.length && remaining > 0) {
        remaining -= 1;
        queued.shift()();
      }
    }
  };
}

test("default controller is detached and default dependencies fail closed", () => {
  const controller = createControlledPersistentAtlasController();
  const status = getPersistentAtlasControllerStatus(controller);
  const auth = authorizePersistentAtlasSession(controller, {
    confirmation: AUTHORIZE
  });

  assert.equal(status.lifecycleState, "detached");
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(auth.outcome, "blocked");
  assert.equal(auth.reasonCode, "LOCAL_DEVELOPMENT_ONLY");
});

test("authorization requires exact confirmation and local development", () => {
  const blocked = createHarness({ localDevelopment: false });
  const blockedResult = authorizePersistentAtlasSession(blocked.controller, {
    confirmation: AUTHORIZE
  });
  assert.equal(blockedResult.outcome, "blocked");
  assert.equal(blockedResult.reasonCode, "LOCAL_DEVELOPMENT_ONLY");

  const harness = createHarness();
  const wrong = authorizePersistentAtlasSession(harness.controller, {
    confirmation: "WRONG"
  });
  const ok = authorizePersistentAtlasSession(harness.controller, {
    confirmation: AUTHORIZE
  });

  assert.equal(wrong.outcome, "blocked");
  assert.equal(wrong.reasonCode, "CONFIRMATION_REQUIRED");
  assert.equal(ok.outcome, "authorized");
  assert.equal(ok.status.authorizationActive, true);
  assert.equal(ok.status.sessionId, "SESSION_001");
});

test("attach requires authorization readiness and identity match", () => {
  const noAuth = createHarness();
  const noAuthAttach = attachPersistentAtlas(noAuth.controller, {
    confirmation: ATTACH
  });
  assert.equal(noAuthAttach.outcome, "blocked");
  assert.equal(noAuthAttach.reasonCode, "STALE_OR_MISSING_AUTHORIZATION");

  const noReadiness = createHarness({ readinessApproved: false });
  authorizePersistentAtlasSession(noReadiness.controller, { confirmation: AUTHORIZE });
  const noReadinessAttach = attachPersistentAtlas(noReadiness.controller, {
    confirmation: ATTACH
  });
  assert.equal(noReadinessAttach.outcome, "failed_closed");
  assert.equal(noReadinessAttach.reasonCode, "READINESS_REJECTED");

  const mismatch = createHarness({
    sessionIdentityOverrides: { packageFingerprint: "DIFFERENT" }
  });
  authorizePersistentAtlasSession(mismatch.controller, { confirmation: AUTHORIZE });
  const mismatchAttach = attachPersistentAtlas(mismatch.controller, {
    confirmation: ATTACH
  });
  assert.equal(mismatchAttach.outcome, "failed_closed");
  assert.equal(mismatchAttach.reasonCode, "IDENTITY_MISMATCH");
});

test("successful attach creates one ownership set one approved listener set and one initial redraw", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
  const attach = attachPersistentAtlas(harness.controller, {
    confirmation: ATTACH
  });
  const status = getPersistentAtlasControllerStatus(harness.controller);

  assert.equal(attach.outcome, "attached");
  assert.deepEqual(attach.transitionPath, [
    "detached",
    "attaching",
    "redraw_queued",
    "drawing",
    "attached_idle"
  ]);
  assert.equal(status.attached, true);
  assert.equal(status.ownedCanvasCount, 1);
  assert.equal(status.ownedPaneCount, 1);
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(status.lifecycleOwnerPresent, true);
  assert.equal(status.redrawRequestedCount, 1);
  assert.equal(status.redrawCompletedCount, 1);
  assert.equal(status.animationFrameScheduleCount, 1);
  assert.equal(status.snapshotAttemptCount, 1);
  assert.equal(status.drawAttemptCount, 1);
  assert.deepEqual(harness.metrics.listenerEvents.sort(), [
    "moveend",
    "resize",
    "zoomend"
  ]);
});

test("duplicate attach is blocked and forbidden listeners are rejected", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
  attachPersistentAtlas(harness.controller, { confirmation: ATTACH });
  const duplicate = attachPersistentAtlas(harness.controller, {
    confirmation: ATTACH
  });
  assert.equal(duplicate.outcome, "blocked");
  assert.equal(duplicate.reasonCode, "ALREADY_ATTACHED");

  const forbidden = createHarness({ forbiddenListenerInjection: true });
  authorizePersistentAtlasSession(forbidden.controller, { confirmation: AUTHORIZE });
  const forbiddenAttach = attachPersistentAtlas(forbidden.controller, {
    confirmation: ATTACH
  });
  assert.equal(forbiddenAttach.outcome, "failed_closed");
  assert.equal(forbiddenAttach.reasonCode, "FORBIDDEN_LISTENER_EVENT");
});

test("redraw requests coalesce while queued and while drawing only one follow-up redraw is scheduled", () => {
  const queuedHarness = createHarness({ manualScheduler: true });
  authorizePersistentAtlasSession(queuedHarness.controller, {
    confirmation: AUTHORIZE
  });
  attachPersistentAtlas(queuedHarness.controller, { confirmation: ATTACH });
  requestPersistentAtlasRedraw(queuedHarness.controller, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  requestPersistentAtlasRedraw(queuedHarness.controller, {
    confirmation: REDRAW,
    reason: "zoomend"
  });
  queuedHarness.flushAll();
  const queuedStatus = getPersistentAtlasControllerStatus(queuedHarness.controller);
  assert.equal(queuedStatus.animationFrameScheduleCount, 1);
  assert.equal(queuedStatus.redrawCompletedCount, 1);
  assert.ok(queuedStatus.redrawCoalescedCount >= 2);

  const drawingHarness = createHarness({
    duringDrawRedrawReasons: ["moveend", "zoomend", "resize"]
  });
  authorizePersistentAtlasSession(drawingHarness.controller, {
    confirmation: AUTHORIZE
  });
  attachPersistentAtlas(drawingHarness.controller, { confirmation: ATTACH });
  const drawingStatus = getPersistentAtlasControllerStatus(drawingHarness.controller);
  assert.equal(drawingStatus.redrawCompletedCount, 2);
  assert.equal(drawingStatus.animationFrameScheduleCount, 2);
  assert.equal(drawingStatus.lifecycleState, "attached_idle");
});

test("detach clears ownership and repeated detach is harmless", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
  attachPersistentAtlas(harness.controller, { confirmation: ATTACH });
  const first = detachPersistentAtlas(harness.controller, { confirmation: DETACH });
  const second = detachPersistentAtlas(harness.controller, { confirmation: DETACH });
  const status = getPersistentAtlasControllerStatus(harness.controller);

  assert.equal(first.outcome, "detached");
  assert.equal(second.outcome, "already_detached");
  assert.equal(status.lifecycleState, "detached");
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(harness.metrics.cleanupCount, 1);
  assert.equal(harness.metrics.listenerRemovals, 3);
});

test("stale authorization is blocked and identity drift fails closed before frame execution", () => {
  const stale = createHarness({
    sessionIdentityOverrides: { recipeVersion: "999" }
  });
  authorizePersistentAtlasSession(stale.controller, { confirmation: AUTHORIZE });
  const staleAttach = attachPersistentAtlas(stale.controller, { confirmation: ATTACH });
  assert.equal(staleAttach.outcome, "failed_closed");
  assert.equal(staleAttach.status.authorizationInvalidated, true);

  const drift = createHarness({ manualScheduler: true });
  authorizePersistentAtlasSession(drift.controller, { confirmation: AUTHORIZE });
  attachPersistentAtlas(drift.controller, { confirmation: ATTACH });
  drift.mutateIdentity({ packageVersion: "2" });
  drift.flushAll();
  const status = getPersistentAtlasControllerStatus(drift.controller);
  assert.equal(status.lifecycleState, "failed_closed");
  assert.equal(status.lastFailureReason, "IDENTITY_DRIFT_DETECTED");
});

test("snapshot draw scheduler and listener failures fail closed with cleanup", () => {
  for (const [options, reasonCode] of [
    [{ failSnapshot: true }, "SNAPSHOT_PROVIDER_FAILED"],
    [{ failDraw: true }, "DRAW_PROVIDER_FAILED"],
    [{ failScheduler: true }, "ANIMATION_FRAME_SCHEDULING_FAILED"],
    [{ failListenerEvent: "zoomend" }, "ZOOMEND_LISTENER_FAILED"]
  ]) {
    const harness = createHarness(options);
    authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
    const attach = attachPersistentAtlas(harness.controller, { confirmation: ATTACH });
    const status = getPersistentAtlasControllerStatus(harness.controller);
    assert.equal(
      attach.outcome === "attached" ? status.lifecycleState : attach.outcome,
      attach.outcome === "attached" ? "failed_closed" : "failed_closed"
    );
    assert.equal(
      attach.outcome === "attached" ? status.lastFailureReason : attach.reasonCode,
      reasonCode
    );
    assert.equal(
      attach.outcome === "attached" ? status.ownedCanvasCount : attach.status.ownedCanvasCount,
      0
    );
  }
});

test("cleanup failure is reported and no mutation continues after failed_closed", () => {
  const harness = createHarness({ failCleanup: true, failSurface: true });
  authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
  const attach = attachPersistentAtlas(harness.controller, { confirmation: ATTACH });
  assert.equal(attach.outcome, "failed_closed");
  assert.equal(attach.status.cleanupFailed, true);
  assert.deepEqual(attach.status.cleanupFailureReasons, ["CLEANUP_PROVIDER_FAILED"]);

  const redraw = requestPersistentAtlasRedraw(harness.controller, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  const detach = detachPersistentAtlas(harness.controller, { confirmation: DETACH });
  assert.equal(redraw.outcome, "blocked");
  assert.equal(redraw.reasonCode, "FAILED_CLOSED");
  assert.equal(detach.outcome, "blocked");
  assert.equal(detach.reasonCode, "FAILED_CLOSED");
});

test("status is deeply immutable serializable and contains no raw object references or window exposure", async () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.controller, { confirmation: AUTHORIZE });
  attachPersistentAtlas(harness.controller, { confirmation: ATTACH });
  const status = getPersistentAtlasControllerStatus(harness.controller);

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.boundIdentity), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("listeners" in status, false);
  assert.equal("window" in globalThis, false);
  assert.equal(
    globalThis.GrowGoDeveloperDiagnostics?.getPersistentAtlasControllerStatus,
    undefined
  );
});
