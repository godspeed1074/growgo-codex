import test from "node:test";
import assert from "node:assert/strict";

import {
  createControlledPersistentAtlasAdapterComposition,
  createPersistentControllerFromComposition,
  getPersistentAdapterCompositionStatus
} from "../client/developer-only-controlled-persistent-atlas-adapter-composition.mjs";
import {
  attachPersistentAtlas,
  authorizePersistentAtlasSession,
  detachPersistentAtlas,
  getPersistentAtlasControllerStatus,
  requestPersistentAtlasRedraw
} from "../client/developer-only-controlled-persistent-atlas-controller.mjs";

const AUTHORIZE = "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
const ATTACH = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const DETACH = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";

function createCompleteFakeSeams({
  manualScheduler = false,
  identityOverrides = {},
  sessionIdentityOverrides = {},
  readinessIdentityOverrides = {},
  readinessApproved = true,
  listenerEventOverride = null,
  failSnapshot = false,
  failDraw = false,
  failCleanup = false,
  failScheduler = false,
  failReadiness = false
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
    schedules: 0,
    cancels: 0,
    draws: 0,
    snapshots: 0,
    cleanups: 0,
    listeners: [],
    listenerRemovals: 0,
    lifecycleOwners: 0,
    surfaces: 0
  };

  const queue = [];
  let burstConsumed = false;
  let controller;

  const seams = {
    mapProvider: {
      getMap() {
        return { kind: "fake-map" };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        if (failReadiness) {
          throw Object.assign(new Error("READINESS_PROVIDER_FAILED"), {
            reasonCode: "READINESS_PROVIDER_FAILED"
          });
        }
        return {
          approved: readinessApproved,
          reasonCode: readinessApproved ? "READINESS_APPROVED" : "READINESS_BLOCKED",
          identity: { ...identity, ...readinessIdentityOverrides }
        };
      }
    },
    authorizationProvider: {
      isLocalDevelopment() {
        return true;
      },
      createPersistentSession() {
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
        return { ...identity };
      }
    },
    surfaceProvider: {
      preparePersistentSurface() {
        metrics.surfaces += 1;
        return {
          pane: { kind: "fake-pane" },
          canvas: { kind: "fake-canvas" },
          cleanupOwner: { kind: "fake-cleanup-owner" }
        };
      }
    },
    lifecycleOwnerProvider: {
      createLifecycleOwner() {
        metrics.lifecycleOwners += 1;
        return { kind: "fake-lifecycle-owner" };
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
        if (!burstConsumed && manualScheduler === false) {
          burstConsumed = true;
          controller.requestPersistentAtlasRedraw({
            confirmation: REDRAW,
            reason: "moveend"
          });
          controller.requestPersistentAtlasRedraw({
            confirmation: REDRAW,
            reason: "zoomend"
          });
        }
      }
    },
    animationFrameScheduler(callback) {
      if (failScheduler) {
        throw Object.assign(new Error("ANIMATION_FRAME_SCHEDULING_FAILED"), {
          reasonCode: "ANIMATION_FRAME_SCHEDULING_FAILED"
        });
      }
      metrics.schedules += 1;
      if (manualScheduler) {
        queue.push(callback);
      } else {
        callback();
      }
      return { kind: "fake-frame", id: metrics.schedules };
    },
    animationFrameCanceller() {
      metrics.cancels += 1;
    },
    listenerRegistrar(eventName) {
      const actual = listenerEventOverride ?? eventName;
      metrics.listeners.push(actual);
      return { eventName: actual };
    },
    listenerRemover() {
      metrics.listenerRemovals += 1;
    },
    cleanupProvider: {
      cleanupPersistentAttachment() {
        metrics.cleanups += 1;
        if (failCleanup) {
          return {
            cleanupCompleted: false,
            reasonCode: "CLEANUP_PROVIDER_FAILED"
          };
        }
        return { cleanupCompleted: true };
      }
    }
  };

  return {
    seams,
    metrics,
    identity,
    setController(value) {
      controller = value;
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queue.length > 0 && remaining > 0) {
        remaining -= 1;
        queue.shift()();
      }
    },
    mutateIdentity(overrides) {
      Object.assign(identity, overrides);
    }
  };
}

test("composition defaults unavailable and status is immutable serializable with no global lookup flags", () => {
  const composition = createControlledPersistentAtlasAdapterComposition();
  const status = getPersistentAdapterCompositionStatus(composition);

  assert.equal(status.compositionReady, false);
  assert.equal(status.controllerCreated, false);
  assert.equal(status.forbiddenGlobalLookupDetected, false);
  assert.equal(status.windowAccessDetected, false);
  assert.equal(status.realMapAccessDetected, false);
  assert.equal(status.realCanvasAccessDetected, false);
  assert.equal(status.realListenerAccessDetected, false);
  assert.equal(status.realRendererAccessDetected, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.throws(() => createPersistentControllerFromComposition(composition));
});

test("partial dependency sets and wrong dependency types keep composition not ready", () => {
  const partial = createControlledPersistentAtlasAdapterComposition({
    mapProvider: { getMap() {} }
  });
  assert.equal(
    getPersistentAdapterCompositionStatus(partial).compositionReady,
    false
  );

  const wrong = createControlledPersistentAtlasAdapterComposition({
    mapProvider: { getMap: true },
    readinessProvider: { getPersistentAttachmentReadiness: true },
    authorizationProvider: { isLocalDevelopment: true, createPersistentSession: true }
  });
  const status = getPersistentAdapterCompositionStatus(wrong);
  assert.equal(status.compositionReady, false);
  assert.match(status.lastFailureReason, /_INVALID$/);
});

test("complete fake seam set makes composition ready and controller can be created once", () => {
  const harness = createCompleteFakeSeams();
  const composition = createControlledPersistentAtlasAdapterComposition(harness.seams);
  const status = getPersistentAdapterCompositionStatus(composition);
  assert.equal(status.compositionReady, true);

  const first = createPersistentControllerFromComposition(composition);
  const second = createPersistentControllerFromComposition(composition);
  harness.setController(first);

  assert.equal(first, second);
  assert.equal(getPersistentAdapterCompositionStatus(composition).controllerCreated, true);
  assert.equal(getPersistentAtlasControllerStatus(first).lifecycleState, "detached");
});

test("controller composed from fakes proves authorization attach redraw coalescing detach and cleanup", () => {
  const harness = createCompleteFakeSeams({ manualScheduler: true });
  const composition = createControlledPersistentAtlasAdapterComposition(harness.seams);
  const controller = createPersistentControllerFromComposition(composition);
  harness.setController(controller);

  const auth = authorizePersistentAtlasSession(controller, { confirmation: AUTHORIZE });
  const attach = attachPersistentAtlas(controller, { confirmation: ATTACH });
  requestPersistentAtlasRedraw(controller, { confirmation: REDRAW, reason: "moveend" });
  requestPersistentAtlasRedraw(controller, { confirmation: REDRAW, reason: "zoomend" });
  harness.flushAll();
  const detach = detachPersistentAtlas(controller, { confirmation: DETACH });
  const status = getPersistentAtlasControllerStatus(controller);

  assert.equal(auth.outcome, "authorized");
  assert.equal(attach.outcome, "attached");
  assert.equal(detach.outcome, "detached");
  assert.equal(status.lifecycleState, "detached");
  assert.equal(harness.metrics.schedules, 1);
  assert.equal(harness.metrics.snapshots, 1);
  assert.equal(harness.metrics.draws, 1);
  assert.equal(harness.metrics.cleanups, 1);
  assert.deepEqual(harness.metrics.listeners.sort(), ["moveend", "resize", "zoomend"]);
});

test("forbidden listener names stale provider outputs and scheduler/canceller mismatches fail closed", () => {
  const forbiddenHarness = createCompleteFakeSeams({ listenerEventOverride: "move" });
  const forbiddenComposition = createControlledPersistentAtlasAdapterComposition(
    forbiddenHarness.seams
  );
  const forbiddenController = createPersistentControllerFromComposition(
    forbiddenComposition
  );
  forbiddenHarness.setController(forbiddenController);
  authorizePersistentAtlasSession(forbiddenController, { confirmation: AUTHORIZE });
  const forbiddenAttach = attachPersistentAtlas(forbiddenController, {
    confirmation: ATTACH
  });
  assert.equal(forbiddenAttach.outcome, "failed_closed");
  assert.equal(forbiddenAttach.reasonCode, "FORBIDDEN_LISTENER_EVENT");

  const staleHarness = createCompleteFakeSeams({
    readinessIdentityOverrides: { packageFingerprint: "DIFFERENT" }
  });
  const staleComposition = createControlledPersistentAtlasAdapterComposition(
    staleHarness.seams
  );
  const staleController = createPersistentControllerFromComposition(staleComposition);
  staleHarness.setController(staleController);
  authorizePersistentAtlasSession(staleController, { confirmation: AUTHORIZE });
  const staleAttach = attachPersistentAtlas(staleController, { confirmation: ATTACH });
  assert.equal(staleAttach.outcome, "failed_closed");
  assert.equal(staleAttach.reasonCode, "IDENTITY_MISMATCH");

  const mismatchComposition = createControlledPersistentAtlasAdapterComposition({
    ...createCompleteFakeSeams().seams,
    animationFrameCanceller: null
  });
  assert.equal(
    getPersistentAdapterCompositionStatus(mismatchComposition).compositionReady,
    false
  );
});

test("snapshot draw cleanup and identity drift failures fail closed through composed seams", () => {
  for (const [options, expected] of [
    [{ failSnapshot: true }, "SNAPSHOT_PROVIDER_FAILED"],
    [{ failDraw: true }, "DRAW_PROVIDER_FAILED"]
  ]) {
    const harness = createCompleteFakeSeams(options);
    const composition = createControlledPersistentAtlasAdapterComposition(harness.seams);
    const controller = createPersistentControllerFromComposition(composition);
    harness.setController(controller);
    authorizePersistentAtlasSession(controller, { confirmation: AUTHORIZE });
    const attach = attachPersistentAtlas(controller, { confirmation: ATTACH });
    const status = getPersistentAtlasControllerStatus(controller);

    assert.equal(attach.outcome, "attached");
    assert.equal(status.lifecycleState, "failed_closed");
    assert.equal(status.lastFailureReason, expected);
  }

  const cleanupHarness = createCompleteFakeSeams({ failCleanup: true });
  const cleanupComposition = createControlledPersistentAtlasAdapterComposition(
    cleanupHarness.seams
  );
  const cleanupController =
    createPersistentControllerFromComposition(cleanupComposition);
  cleanupHarness.setController(cleanupController);
  authorizePersistentAtlasSession(cleanupController, { confirmation: AUTHORIZE });
  attachPersistentAtlas(cleanupController, { confirmation: ATTACH });
  const cleanupDetach = detachPersistentAtlas(cleanupController, {
    confirmation: DETACH
  });
  assert.equal(cleanupDetach.outcome, "failed_closed");
  assert.equal(cleanupDetach.status.cleanupFailed, true);
  assert.deepEqual(cleanupDetach.status.cleanupFailureReasons, [
    "CLEANUP_PROVIDER_FAILED"
  ]);

  const driftHarness = createCompleteFakeSeams({ manualScheduler: true });
  const driftComposition = createControlledPersistentAtlasAdapterComposition(
    driftHarness.seams
  );
  const driftController = createPersistentControllerFromComposition(driftComposition);
  driftHarness.setController(driftController);
  authorizePersistentAtlasSession(driftController, { confirmation: AUTHORIZE });
  attachPersistentAtlas(driftController, { confirmation: ATTACH });
  driftHarness.mutateIdentity({ packageVersion: "2" });
  driftHarness.flushAll();
  const driftStatus = getPersistentAtlasControllerStatus(driftController);
  assert.equal(driftStatus.lifecycleState, "failed_closed");
  assert.equal(driftStatus.lastFailureReason, "IDENTITY_DRIFT_DETECTED");
});

test("all composition and controller diagnostics remain immutable serializable and no window exposure occurs", () => {
  const harness = createCompleteFakeSeams();
  const composition = createControlledPersistentAtlasAdapterComposition(harness.seams);
  const controller = createPersistentControllerFromComposition(composition);
  harness.setController(controller);
  authorizePersistentAtlasSession(controller, { confirmation: AUTHORIZE });
  attachPersistentAtlas(controller, { confirmation: ATTACH });

  const compositionStatus = getPersistentAdapterCompositionStatus(composition);
  const controllerStatus = getPersistentAtlasControllerStatus(controller);

  assert.equal(Object.isFrozen(compositionStatus), true);
  assert.equal(Object.isFrozen(controllerStatus), true);
  assert.doesNotThrow(() => JSON.stringify(compositionStatus));
  assert.doesNotThrow(() => JSON.stringify(controllerStatus));
  assert.equal(
    globalThis.GrowGoDeveloperDiagnostics?.getPersistentAdapterCompositionStatus,
    undefined
  );
  assert.equal(
    globalThis.GrowGoDeveloperDiagnostics?.createPersistentControllerFromComposition,
    undefined
  );
});
