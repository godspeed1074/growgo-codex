import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  authorizePersistentAtlasSession,
  consumePersistentAttachPermission,
  createControlledPersistentAtlasAuthorization,
  validatePersistentRedrawPermission
} from "../client/developer-only-controlled-persistent-atlas-authorization.mjs";
import {
  createControlledPersistentAtlasSchedulerListenerContract,
  registerApprovedPersistentListeners,
  requestPersistentRedraw,
  removeApprovedPersistentListeners,
  cancelQueuedPersistentRedraw
} from "../client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs";
import {
  acquirePersistentSurface,
  createControlledPersistentAtlasRetainedSurfaceWrapper,
  getPersistentSurfaceWrapperStatus,
  releasePersistentSurface,
  reusePersistentSurface,
  validatePersistentSurface
} from "../client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_61_RETAINED_SURFACE_CLEANUP_LIVE_WRAPPER_CONTRACT.md"
);

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_001",
    sessionId: "SESSION_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_001",
    ...overrides
  };
}

function createHarness({
  withPane = true,
  failSurfaceAcquire = null,
  failLifecycleAcquire = null,
  failTranslation = null,
  lifecycleMismatch = false,
  missingCanvasOnInspect = false,
  duplicateCanvasOnInspect = false,
  duplicatePaneOnInspect = false,
  replacedCanvasOnInspect = false,
  failCancel = false,
  failListeners = false,
  failRefs = false,
  failCanvasRemoval = false,
  failPaneRemoval = false,
  failLifecycleRelease = false
} = {}) {
  const identity = createIdentity();
  const events = [];
  const metrics = {
    surfaceAcquireCalls: 0,
    surfaceInspectCalls: 0,
    lifecycleAcquireCalls: 0,
    lifecycleValidateCalls: 0,
    lifecycleReleaseCalls: 0,
    translationCalls: 0
  };

  const refs = {
    canvas: { kind: "fake-canvas" },
    pane: withPane ? { kind: "fake-pane" } : null,
    lifecycleOwner: { kind: "fake-lifecycle-owner" }
  };

  let inspectCanvas = refs.canvas;
  let inspectPane = refs.pane;
  const failureState = {
    failCancel,
    failListeners,
    failRefs,
    failCanvasRemoval,
    failPaneRemoval,
    failLifecycleRelease
  };

  const wrapper = createControlledPersistentAtlasRetainedSurfaceWrapper({
    oneFrameSurfaceProvider({ operation }) {
      if (operation === "acquire") {
        metrics.surfaceAcquireCalls += 1;
        if (failSurfaceAcquire) {
          throw Object.assign(new Error(failSurfaceAcquire), {
            reasonCode: failSurfaceAcquire
          });
        }
        return {
          canvas: refs.canvas,
          pane: refs.pane
        };
      }

      metrics.surfaceInspectCalls += 1;
      if (missingCanvasOnInspect) {
        return {
          pane: inspectPane
        };
      }

      if (duplicateCanvasOnInspect) {
        return {
          canvases: [inspectCanvas, { kind: "duplicate-canvas" }],
          pane: inspectPane
        };
      }

      if (duplicatePaneOnInspect) {
        return {
          canvas: inspectCanvas,
          panes: [inspectPane, { kind: "duplicate-pane" }]
        };
      }

      if (replacedCanvasOnInspect) {
        return {
          canvas: { kind: "replacement-canvas" },
          pane: inspectPane
        };
      }

      return {
        canvas: inspectCanvas,
        pane: inspectPane
      };
    },
    lifecycleOwnerProvider({ operation }) {
      if (operation === "acquire") {
        metrics.lifecycleAcquireCalls += 1;
        if (failLifecycleAcquire) {
          throw Object.assign(new Error(failLifecycleAcquire), {
            reasonCode: failLifecycleAcquire
          });
        }
        return {
          lifecycleOwner: refs.lifecycleOwner,
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }

      if (operation === "validate") {
        metrics.lifecycleValidateCalls += 1;
        return {
          matches: lifecycleMismatch === false
        };
      }

      metrics.lifecycleReleaseCalls += 1;
      events.push("lifecycle");
      if (failureState.failLifecycleRelease) {
        throw Object.assign(new Error("LIFECYCLE_OWNER_RELEASE_FAILED"), {
          reasonCode: "LIFECYCLE_OWNER_RELEASE_FAILED"
        });
      }
      return {
        released: true
      };
    },
    lifecycleTranslationProvider() {
      metrics.translationCalls += 1;
      if (failTranslation) {
        throw Object.assign(new Error(failTranslation), {
          reasonCode: failTranslation
        });
      }
      return {
        surfaceOwnerId: "SURFACE_OWNER_A",
        lifecycleOwnerId: "LIFECYCLE_OWNER_A"
      };
    },
    queuedFrameCancellationProvider() {
      events.push("cancel");
      if (failureState.failCancel) {
        throw Object.assign(new Error("QUEUED_FRAME_CANCELLATION_FAILED"), {
          reasonCode: "QUEUED_FRAME_CANCELLATION_FAILED"
        });
      }
    },
    listenerCleanupProvider() {
      events.push("listeners");
      if (failureState.failListeners) {
        throw Object.assign(new Error("LISTENER_CLEANUP_FAILED"), {
          reasonCode: "LISTENER_CLEANUP_FAILED"
        });
      }
    },
    referenceReleaseProvider() {
      events.push("refs");
      if (failureState.failRefs) {
        throw Object.assign(new Error("REFERENCE_RELEASE_FAILED"), {
          reasonCode: "REFERENCE_RELEASE_FAILED"
        });
      }
    },
    canvasRemovalProvider() {
      events.push("canvas");
      if (failureState.failCanvasRemoval) {
        throw Object.assign(new Error("CANVAS_REMOVAL_FAILED"), {
          reasonCode: "CANVAS_REMOVAL_FAILED"
        });
      }
    },
    paneRemovalProvider() {
      events.push("pane");
      if (failureState.failPaneRemoval) {
        throw Object.assign(new Error("PANE_REMOVAL_FAILED"), {
          reasonCode: "PANE_REMOVAL_FAILED"
        });
      }
    },
    identityProvider() {
      return { ...identity };
    }
  });

  return {
    wrapper,
    identity,
    refs,
    events,
    metrics,
    setIdentity(overrides) {
      Object.assign(identity, overrides);
    },
    replaceInspectCanvas(nextCanvas = { kind: "replacement-canvas" }) {
      inspectCanvas = nextCanvas;
    },
    replaceInspectPane(nextPane = { kind: "replacement-pane" }) {
      inspectPane = nextPane;
    },
    setCleanupFailures(overrides) {
      Object.assign(failureState, overrides);
    }
  };
}

function acquireReadyHarness(options = {}) {
  const harness = createHarness(options);
  const acquired = acquirePersistentSurface(harness.wrapper);
  const validated = validatePersistentSurface(harness.wrapper);
  return { harness, acquired, validated };
}

test("1. initial empty state is frozen serializable and keeps canonical safety flags false", () => {
  const harness = createHarness();
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);

  assert.equal(status.schemaId, "GROWGO_CONTROLLED_PERSISTENT_ATLAS_RETAINED_SURFACE_WRAPPER_STATUS_001");
  assert.equal(status.state, "empty");
  assert.equal(status.ready, false);
  assert.equal(status.retained, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
});

test("2. unavailable seams fail closed", () => {
  const wrapper = createControlledPersistentAtlasRetainedSurfaceWrapper();
  const result = acquirePersistentSurface(wrapper);

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "SURFACE_PROVIDER_UNAVAILABLE");
});

test("3. successful acquisition binds one retained surface and one lifecycle owner", () => {
  const harness = createHarness();
  const result = acquirePersistentSurface(harness.wrapper);
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);

  assert.equal(result.outcome, "acquired");
  assert.equal(status.state, "retained");
  assert.equal(status.ownedCanvasCount, 1);
  assert.equal(status.ownedPaneCount, 1);
  assert.equal(status.lifecycleOwnerPresent, true);
  assert.equal(status.acquisitionCompletedCount, 1);
});

test("4. acquisition enforces exactly one Canvas", () => {
  const harness = createHarness();
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "INVALID_SURFACE_SHAPE");

  const duplicate = createControlledPersistentAtlasRetainedSurfaceWrapper({
    oneFrameSurfaceProvider() {
      return {
        canvases: [{ kind: "a" }, { kind: "b" }]
      };
    },
    lifecycleOwnerProvider() {
      return { lifecycleOwner: { kind: "owner" } };
    },
    lifecycleTranslationProvider() {
      return {};
    },
    identityProvider() {
      return createIdentity();
    }
  });
  const duplicateResult = acquirePersistentSurface(duplicate);
  assert.equal(duplicateResult.reasonCode, "DUPLICATE_CANVAS");
});

test("5. acquisition allows at most one pane", () => {
  const wrapper = createControlledPersistentAtlasRetainedSurfaceWrapper({
    oneFrameSurfaceProvider() {
      return {
        canvas: { kind: "canvas" },
        panes: [{ kind: "a" }, { kind: "b" }]
      };
    },
    lifecycleOwnerProvider() {
      return { lifecycleOwner: { kind: "owner" } };
    },
    lifecycleTranslationProvider() {
      return {};
    },
    identityProvider() {
      return createIdentity();
    }
  });
  const result = acquirePersistentSurface(wrapper);
  assert.equal(result.reasonCode, "DUPLICATE_PANE");
});

test("6. acquisition requires one lifecycle owner", () => {
  const harness = createHarness({ failLifecycleAcquire: "LIFECYCLE_OWNER_UNAVAILABLE" });
  const result = acquirePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "LIFECYCLE_OWNER_UNAVAILABLE");
});

test("7. duplicate acquisition is blocked", () => {
  const { harness } = acquireReadyHarness();
  const second = acquirePersistentSurface(harness.wrapper);
  assert.equal(second.reasonCode, "DUPLICATE_ACQUISITION");
});

test("8. same retained surface is reused across redraw calls", () => {
  const { harness } = acquireReadyHarness();
  const reused = reusePersistentSurface(harness.wrapper);
  assert.equal(reused.outcome, "reused");
  assert.equal(getPersistentSurfaceWrapperStatus(harness.wrapper).reuseCompletedCount, 1);
});

test("9. Canvas identity remains stable across reuse", () => {
  const { harness, acquired } = acquireReadyHarness();
  const reused = reusePersistentSurface(harness.wrapper);
  assert.equal(reused.canvasToken, acquired.canvasToken);
});

test("10. lifecycle owner identity remains stable across reuse", () => {
  const { harness, acquired } = acquireReadyHarness();
  const reused = reusePersistentSurface(harness.wrapper);
  assert.equal(reused.lifecycleOwnerToken, acquired.lifecycleOwnerToken);
});

test("11. validation succeeds on matching identity", () => {
  const harness = createHarness();
  acquirePersistentSurface(harness.wrapper);
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.outcome, "valid");
  assert.equal(getPersistentSurfaceWrapperStatus(harness.wrapper).ready, true);
});

test("12. map identity drift is rejected", () => {
  const { harness } = acquireReadyHarness();
  harness.setIdentity({ mapIdentityId: "MAP_002" });
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "MAP_IDENTITY_MISMATCH");
});

test("13. session drift is rejected", () => {
  const { harness } = acquireReadyHarness();
  harness.setIdentity({ sessionId: "SESSION_002" });
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "SESSION_MISMATCH");
});

test("14. region/package/recipe drift is rejected", () => {
  const { harness } = acquireReadyHarness();
  harness.setIdentity({ recipeVersion: "2" });
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "REGION_IDENTITY_MISMATCH");
});

test("15. missing Canvas on validation is rejected", () => {
  const harness = createHarness({ missingCanvasOnInspect: true });
  acquirePersistentSurface(harness.wrapper);
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "MISSING_CANVAS");
});

test("16. duplicate Canvas on validation is rejected", () => {
  const harness = createHarness({ duplicateCanvasOnInspect: true });
  acquirePersistentSurface(harness.wrapper);
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "DUPLICATE_CANVAS");
});

test("17. duplicate pane on validation is rejected", () => {
  const harness = createHarness({ duplicatePaneOnInspect: true });
  acquirePersistentSurface(harness.wrapper);
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "DUPLICATE_PANE");
});

test("18. lifecycle owner mismatch is rejected", () => {
  const harness = createHarness({ lifecycleMismatch: true });
  acquirePersistentSurface(harness.wrapper);
  const result = validatePersistentSurface(harness.wrapper);
  assert.equal(result.reasonCode, "LIFECYCLE_OWNER_MISMATCH");
});

test("19. release order is enforced", () => {
  const { harness } = acquireReadyHarness();
  const released = releasePersistentSurface(harness.wrapper);
  assert.equal(released.outcome, "released");
  assert.deepEqual(harness.events, [
    "cancel",
    "listeners",
    "refs",
    "canvas",
    "pane",
    "lifecycle"
  ]);
});

test("20. queued frame cancellation occurs before resource removal", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  assert.ok(harness.events.indexOf("cancel") < harness.events.indexOf("canvas"));
});

test("21. listeners are removed before Canvas removal", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  assert.ok(harness.events.indexOf("listeners") < harness.events.indexOf("canvas"));
});

test("22. Canvas is removed before pane removal", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  assert.ok(harness.events.indexOf("canvas") < harness.events.indexOf("pane"));
});

test("23. pane is removed before lifecycle owner release", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  assert.ok(harness.events.indexOf("pane") < harness.events.indexOf("lifecycle"));
});

test("24. lifecycle owner is released before identity refs are cleared", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);
  assert.equal(status.surfaceOwnerId, null);
  assert.equal(status.lifecycleOwnerId, null);
});

test("25. repeated release is harmless", () => {
  const { harness } = acquireReadyHarness();
  const first = releasePersistentSurface(harness.wrapper);
  const second = releasePersistentSurface(harness.wrapper);

  assert.equal(first.outcome, "released");
  assert.equal(second.outcome, "released");
});

test("26. partial cleanup resumes safely", () => {
  const harness = createHarness({ failCanvasRemoval: true });
  acquirePersistentSurface(harness.wrapper);
  validatePersistentSurface(harness.wrapper);

  const first = releasePersistentSurface(harness.wrapper);
  assert.equal(first.reasonCode, "CANVAS_REMOVAL_FAILED");
  harness.setCleanupFailures({ failCanvasRemoval: false });
  const second = releasePersistentSurface(harness.wrapper);
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);
  assert.equal(second.outcome, "released");
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.released, true);
});

test("27. cleanup failures are collected while cleanup continues", () => {
  const { harness } = acquireReadyHarness({
    failCancel: true,
    failListeners: true,
    failCanvasRemoval: true
  });
  const result = releasePersistentSurface(harness.wrapper);
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);

  assert.equal(result.outcome, "failed_closed");
  assert.deepEqual([...status.cleanupFailureReasons].sort(), [
    "CANVAS_REMOVAL_FAILED",
    "LISTENER_CLEANUP_FAILED",
    "QUEUED_FRAME_CANCELLATION_FAILED"
  ]);
  assert.ok(harness.events.includes("refs"));
});

test("28. successful release leaves zero ownership", () => {
  const { harness } = acquireReadyHarness();
  releasePersistentSurface(harness.wrapper);
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);

  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.lifecycleOwnerPresent, false);
  assert.equal(status.released, true);
});

test("29. status is immutable and serializable", () => {
  const { harness } = acquireReadyHarness();
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("30. status exposes no raw references", () => {
  const { harness } = acquireReadyHarness();
  const status = getPersistentSurfaceWrapperStatus(harness.wrapper);
  assert.equal("surface" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("lifecycleOwner" in status, false);
});

test("31. module uses no real browser map or DOM access", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bdocument\b/);
  assert.doesNotMatch(source, /\bLeaflet\b/);
  assert.doesNotMatch(source, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(source, /\bgetGrowGoMap\b/);
});

test("32. module exposes nothing on window", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b/);
});

test("33. fake-only integration proof covers auth scheduler redraw release and zero ownership", () => {
  const identity = createIdentity();
  let attached = false;
  const queued = [];
  const cleanupEvents = [];
  const authorization = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => "127.0.0.1",
    identityProvider: () => ({ ...identity }),
    readinessProvider: () => ({
      approved: true,
      reasonCode: "READINESS_APPROVED"
    }),
    controllerAttachmentStateProvider: () => ({
      attached
    }),
    lifecycleOwnerStateProvider: () => ({
      matches: true
    }),
    createSessionId: () => identity.sessionId,
    nowProvider: () => "2026-08-06T12:00:00.000Z"
  });

  const scheduler = createControlledPersistentAtlasSchedulerListenerContract({
    frameScheduler(callback) {
      queued.push(callback);
      return { kind: "frame-handle", id: queued.length };
    },
    frameCanceller() {
      cleanupEvents.push("cancel");
    },
    redrawPermissionProvider() {
      const result = validatePersistentRedrawPermission(authorization);
      return {
        allowed: result.outcome === "allowed",
        reasonCode: result.reasonCode
      };
    },
    listenerRegistrar(eventName) {
      return { eventName };
    },
    listenerRemover() {
      cleanupEvents.push("listeners");
    },
    identityProvider() {
      return {
        schedulerOwnerId: "SCHEDULER_OWNER_A",
        listenerOwnerId: "LISTENER_OWNER_A",
        mapIdentityId: identity.mapIdentityId,
        sessionId: identity.sessionId,
        lifecycleOwnerId: "LIFECYCLE_OWNER_A"
      };
    },
    drawExecutor() {}
  });

  const canvas = { kind: "retained-canvas" };
  const pane = { kind: "retained-pane" };
  const lifecycleOwner = { kind: "retained-owner" };
  const wrapper = createControlledPersistentAtlasRetainedSurfaceWrapper({
    oneFrameSurfaceProvider() {
      return {
        canvas,
        pane
      };
    },
    lifecycleOwnerProvider({ operation }) {
      if (operation === "acquire") {
        return {
          lifecycleOwner,
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }

      if (operation === "validate") {
        return {
          matches: true
        };
      }

      cleanupEvents.push("lifecycle");
      return {
        released: true
      };
    },
    lifecycleTranslationProvider() {
      return {
        surfaceOwnerId: "SURFACE_OWNER_A",
        lifecycleOwnerId: "LIFECYCLE_OWNER_A"
      };
    },
    queuedFrameCancellationProvider() {
      cancelQueuedPersistentRedraw(scheduler);
    },
    listenerCleanupProvider() {
      removeApprovedPersistentListeners(scheduler);
    },
    referenceReleaseProvider() {
      cleanupEvents.push("refs");
    },
    canvasRemovalProvider() {
      cleanupEvents.push("canvas");
    },
    paneRemovalProvider() {
      cleanupEvents.push("pane");
    },
    identityProvider() {
      return { ...identity };
    }
  });

  const authorized = authorizePersistentAtlasSession(authorization, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  assert.equal(authorized.outcome, "authorized");

  const consumed = consumePersistentAttachPermission(authorization);
  assert.equal(consumed.outcome, "consumed");

  attached = true;

  const acquired = acquirePersistentSurface(wrapper);
  const validated = validatePersistentSurface(wrapper);
  const reused = reusePersistentSurface(wrapper);
  assert.equal(acquired.outcome, "acquired");
  assert.equal(validated.outcome, "valid");
  assert.equal(reused.outcome, "reused");
  assert.equal(acquired.canvasToken, reused.canvasToken);
  assert.equal(acquired.lifecycleOwnerToken, reused.lifecycleOwnerToken);

  const listeners = registerApprovedPersistentListeners(scheduler, {
    schedulerOwnerId: "SCHEDULER_OWNER_A",
    listenerOwnerId: "LISTENER_OWNER_A",
    mapIdentityId: identity.mapIdentityId,
    sessionId: identity.sessionId,
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  });
  assert.equal(listeners.outcome, "registered");

  const queuedRedraw = requestPersistentRedraw(scheduler, {
    reason: "manual_redraw"
  });
  assert.equal(queuedRedraw.outcome, "queued");

  const released = releasePersistentSurface(wrapper);
  const finalStatus = getPersistentSurfaceWrapperStatus(wrapper);

  assert.equal(released.outcome, "released");
  assert.equal(finalStatus.ownedCanvasCount, 0);
  assert.equal(finalStatus.ownedPaneCount, 0);
  assert.equal(finalStatus.lifecycleOwnerPresent, false);
  assert.equal(finalStatus.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(finalStatus.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(finalStatus.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(finalStatus.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.ok(fs.existsSync(sessionDocPath));
});
