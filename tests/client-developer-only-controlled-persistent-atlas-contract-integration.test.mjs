import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  attachIntegratedPersistentAtlas,
  authorizeIntegratedPersistentAtlas,
  createControlledPersistentAtlasContractIntegration,
  detachIntegratedPersistentAtlas,
  getIntegratedPersistentAtlasStatus,
  invalidateIntegratedPersistentAtlas,
  requestIntegratedPersistentAtlasRedraw,
  revokeIntegratedPersistentAtlas
} from "../client/developer-only-controlled-persistent-atlas-contract-integration.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-contract-integration.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_62_PERSISTENT_LIVE_ADAPTER_CONTRACT_INTEGRATION.md"
);

const AUTHORIZE = "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
const ATTACH = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";
const DETACH = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const ONE_FRAME = "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME";

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
  manualScheduler = false,
  hostname = "127.0.0.1",
  readinessApproved = true,
  readinessReasonCode = "READINESS_APPROVED",
  readinessIdentityOverrides = {},
  identityOverrides = {},
  failRawMap = false,
  failSurface = false,
  failListenerEvent = null,
  forbiddenListenerEvent = null,
  failScheduler = false,
  failSnapshot = false,
  mutableSnapshot = false,
  failDraw = false,
  failReferenceRelease = false,
  failCanvasRemoval = false,
  failPaneRemoval = false,
  failLifecycleRelease = false,
  followUpDuringFirstDraw = false
} = {}) {
  const identity = createIdentity(identityOverrides);
  const readinessState = {
    approved: readinessApproved,
    reasonCode: readinessReasonCode
  };
  const map = { kind: "fake-map" };
  const canvas = { kind: "fake-canvas" };
  const pane = { kind: "fake-pane" };
  const lifecycleOwner = { kind: "fake-lifecycle-owner", ownerId: "LIFECYCLE_OWNER_A" };
  const lifecycleState = {
    surfaceLifecycleOwnerId: "LIFECYCLE_OWNER_A"
  };
  const queued = [];
  let integration;
  let followUpConsumed = false;

  const metrics = {
    registeredEvents: [],
    removedEvents: [],
    scheduleCount: 0,
    cancelCount: 0,
    surfaceCalls: 0,
    lifecycleAcquireCalls: 0,
    snapshotCalls: 0,
    drawCalls: 0,
    cleanupOrder: [],
    cleanupCalls: 0
  };

  integration = createControlledPersistentAtlasContractIntegration({
    hostnameProvider: () => hostname,
    rawMapProvider: {
      resolveRawMap() {
        if (failRawMap) {
          throw Object.assign(new Error("RAW_MAP_PROVIDER_FAILED"), {
            reasonCode: "RAW_MAP_PROVIDER_FAILED"
          });
        }
        return {
          map,
          mapIdentityId: identity.mapIdentityId
        };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        return {
          approved: readinessState.approved,
          reasonCode: readinessState.reasonCode,
          identity: {
            ...identity,
            ...readinessIdentityOverrides
          }
        };
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity() {
        return { ...identity };
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface() {
        metrics.surfaceCalls += 1;
        if (failSurface) {
          throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_FAILED"), {
            reasonCode: "RETAINED_SURFACE_PROVIDER_FAILED"
          });
        }
        return {
          canvas,
          pane,
          surfaceOwnerId: "SURFACE_OWNER_A",
          lifecycleOwnerId: lifecycleState.surfaceLifecycleOwnerId
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner() {
        metrics.lifecycleAcquireCalls += 1;
        return {
          lifecycleOwner,
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ reason }) {
        metrics.snapshotCalls += 1;
        if (failSnapshot) {
          throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
            reasonCode: "SNAPSHOT_PROVIDER_FAILED"
          });
        }
        const snapshot = {
          kind: "fake-snapshot",
          reason
        };
        return mutableSnapshot ? snapshot : Object.freeze(snapshot);
      }
    },
    frameDrawProvider: {
      drawPersistentFrame() {
        metrics.drawCalls += 1;
        if (failDraw) {
          throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
            reasonCode: "DRAW_PROVIDER_FAILED"
          });
        }
        if (followUpDuringFirstDraw && !followUpConsumed) {
          followUpConsumed = true;
          requestIntegratedPersistentAtlasRedraw(integration, {
            confirmation: REDRAW,
            reason: "moveend"
          });
        }
      }
    },
    animationFrameScheduler(callback) {
      if (failScheduler) {
        throw Object.assign(new Error("ANIMATION_FRAME_SCHEDULER_FAILED"), {
          reasonCode: "ANIMATION_FRAME_SCHEDULER_FAILED"
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
    animationFrameCanceller() {
      metrics.cancelCount += 1;
      metrics.cleanupOrder.push("cancel");
    },
    approvedListenerRegistrar(eventName, callback) {
      const actualEvent = forbiddenListenerEvent ?? eventName;
      if (failListenerEvent === actualEvent) {
        throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "LISTENER_REGISTRATION_FAILED"
        });
      }
      metrics.registeredEvents.push(actualEvent);
      return {
        eventName: actualEvent,
        callback
      };
    },
    approvedListenerRemover(registration) {
      metrics.removedEvents.push(registration?.eventName ?? "unknown");
      metrics.cleanupOrder.push("listeners");
    },
    retainedCleanupProvider: {
      cleanupPersistentAttachment() {
        metrics.cleanupCalls += 1;
        if (failReferenceRelease) {
          return {
            cleanupCompleted: false,
            reasonCode: "REFERENCE_RELEASE_FAILED"
          };
        }
        return {
          cleanupCompleted: true
        };
      }
    },
    referenceReleaseProvider() {
      metrics.cleanupOrder.push("refs");
      if (failReferenceRelease) {
        throw Object.assign(new Error("REFERENCE_RELEASE_FAILED"), {
          reasonCode: "REFERENCE_RELEASE_FAILED"
        });
      }
    },
    canvasRemovalProvider() {
      metrics.cleanupOrder.push("canvas");
      if (failCanvasRemoval) {
        throw Object.assign(new Error("CANVAS_REMOVAL_FAILED"), {
          reasonCode: "CANVAS_REMOVAL_FAILED"
        });
      }
    },
    paneRemovalProvider() {
      metrics.cleanupOrder.push("pane");
      if (failPaneRemoval) {
        throw Object.assign(new Error("PANE_REMOVAL_FAILED"), {
          reasonCode: "PANE_REMOVAL_FAILED"
        });
      }
    },
    lifecycleOwnerReleaseProvider() {
      metrics.cleanupOrder.push("lifecycle");
      if (failLifecycleRelease) {
        throw Object.assign(new Error("LIFECYCLE_OWNER_RELEASE_FAILED"), {
          reasonCode: "LIFECYCLE_OWNER_RELEASE_FAILED"
        });
      }
    },
    lifecycleTranslationProvider() {
      return {
        surfaceOwnerId: "SURFACE_OWNER_A",
        lifecycleOwnerId: "LIFECYCLE_OWNER_A"
      };
    }
  });

  return {
    integration,
    identity,
    metrics,
    setIdentity(overrides) {
      Object.assign(identity, overrides);
    },
    setReadiness(overrides) {
      Object.assign(readinessState, overrides);
    },
    setSurfaceLifecycleOwnerId(nextOwnerId) {
      lifecycleState.surfaceLifecycleOwnerId = nextOwnerId;
    },
    flushOne() {
      const callback = queued.shift();
      if (callback) {
        callback();
      }
    },
    flushAll(limit = 20) {
      let remaining = limit;
      while (queued.length > 0 && remaining > 0) {
        remaining -= 1;
        queued.shift()();
      }
    },
    queuedCount() {
      return queued.length;
    }
  };
}

function authorizeAndAttach(harness, { flushInitial = true } = {}) {
  const authorized = authorizeIntegratedPersistentAtlas(harness.integration, {
    confirmation: AUTHORIZE
  });
  const attached = attachIntegratedPersistentAtlas(harness.integration, {
    confirmation: ATTACH
  });
  if (flushInitial) {
    harness.flushAll();
  }
  return { authorized, attached };
}

test("1. initial integrated state has zero ownership", () => {
  const harness = createHarness();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.integrationState, "inactive");
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
});

test("2. persistent authorization succeeds", () => {
  const harness = createHarness();
  const result = authorizeIntegratedPersistentAtlas(harness.integration, {
    confirmation: AUTHORIZE
  });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(result.outcome, "authorized");
  assert.equal(status.integrationState, "authorized");
  assert.equal(status.authorizationState, "active");
});

test("3. one-frame authorization cannot substitute", () => {
  const harness = createHarness();
  const result = authorizeIntegratedPersistentAtlas(harness.integration, {
    confirmation: ONE_FRAME
  });
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "INVALID_CONFIRMATION");
});

test("4. attach permission is consumed once", () => {
  const harness = createHarness();
  authorizeIntegratedPersistentAtlas(harness.integration, { confirmation: AUTHORIZE });
  attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  const second = attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.attachPermissionConsumed, true);
  assert.equal(second.reasonCode, "DUPLICATE_ATTACH");
});

test("5. integrated attach succeeds", () => {
  const harness = createHarness();
  const { attached } = authorizeAndAttach(harness);
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(attached.outcome, "attached");
  assert.equal(status.attached, true);
  assert.equal(status.adapterReady, true);
});

test("6. exactly one Canvas is retained", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).ownedCanvasCount, 1);
});

test("7. at most one pane is retained", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).ownedPaneCount, 1);
});

test("8. one lifecycle owner only", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  assert.equal(harness.metrics.lifecycleAcquireCalls, 1);
});

test("9. exact three approved listeners register", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  assert.deepEqual(harness.metrics.registeredEvents.sort(), ["moveend", "resize", "zoomend"]);
});

test("10. one initial redraw is queued", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(harness.queuedCount(), 1);
  assert.equal(status.redrawQueued, true);
});

test("11. initial snapshot and draw complete", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.snapshotCompletedCount, 1);
  assert.equal(status.drawCompletedCount, 1);
});

test("12. same Canvas is reused across redraws", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  harness.flushOne();
  assert.equal(harness.metrics.surfaceCalls, 1);
});

test("13. same lifecycle owner is reused across redraws", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "zoomend"
  });
  harness.flushOne();
  assert.equal(harness.metrics.lifecycleAcquireCalls, 1);
});

test("14. event burst coalesces", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "zoomend"
  });
  requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "resize"
  });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(harness.queuedCount(), 1);
  assert.equal(status.redrawCoalescedCount, 2);
});

test("15. redraw during drawing creates one follow-up", () => {
  const harness = createHarness({
    manualScheduler: true,
    followUpDuringFirstDraw: true
  });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  assert.equal(harness.queuedCount(), 1);
  harness.flushOne();
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).drawCompletedCount, 2);
});

test("16. no recursion occurs during follow-up redraw", () => {
  const harness = createHarness({
    manualScheduler: true,
    followUpDuringFirstDraw: true
  });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushAll();
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).failedClosed, false);
});

test("17. no parallel draw occurs", () => {
  const harness = createHarness({
    manualScheduler: true,
    followUpDuringFirstDraw: true
  });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushAll();
  assert.equal(harness.metrics.drawCalls, 2);
});

test("18. detach cleanup order is enforced", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  const result = detachIntegratedPersistentAtlas(harness.integration, {
    confirmation: DETACH
  });
  assert.equal(result.outcome, "released");
  assert.deepEqual(harness.metrics.cleanupOrder, [
    "cancel",
    "listeners",
    "listeners",
    "listeners",
    "refs",
    "canvas",
    "pane",
    "lifecycle"
  ]);
});

test("19. zero ownership after detach", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
});

test("20. repeated detach is harmless", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  const first = detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  const second = detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  assert.equal(first.outcome, "released");
  assert.equal(second.outcome, "released");
});

test("21. revoke triggers redraw denial and cleanup", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  revokeIntegratedPersistentAtlas(harness.integration);
  const redraw = requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(redraw.outcome, "blocked");
  assert.equal(status.ownedCanvasCount, 0);
});

test("22. invalidation triggers cleanup", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  invalidateIntegratedPersistentAtlas(harness.integration, {
    reasonCode: "IDENTITY_MISMATCH"
  });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.attached, false);
  assert.equal(status.cleanupCompleted, true);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.lastFailureReason, "IDENTITY_MISMATCH");
});

test("23. stale callback after detach is ignored", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  harness.flushOne();
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).drawCompletedCount, 0);
});

test("24. identity drift fails closed", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  harness.setIdentity({ mapIdentityId: "MAP_002" });
  const result = requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  assert.equal(result.reasonCode, "STALE_MAP_IDENTITY");
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.queuedFrameCount, 0);
  assert.equal(status.cleanupCompleted, true);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.lastFailureReason, "STALE_MAP_IDENTITY");
});

test("24a. readiness invalidation while attached triggers cleanup and preserves reason", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  harness.setReadiness({
    approved: false,
    reasonCode: "REGION_OUT_OF_SCOPE"
  });

  const result = requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });

  assert.equal(result.reasonCode, "READINESS_BLOCKED");
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.authorizationState, "invalidated");
  assert.equal(status.redrawPermissionAllowed, false);
  assert.equal(status.attached, false);
  assert.equal(status.integrationState, "invalidated");
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.queuedFrameCount, 0);
  assert.equal(status.cleanupCompleted, true);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.lastFailureReason, "REGION_OUT_OF_SCOPE");
});

test("24b. package drift while attached triggers cleanup and preserves reason", () => {
  const harness = createHarness({ manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  harness.setIdentity({ packageFingerprint: "PKG_FP_002" });

  const result = requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });

  assert.equal(result.reasonCode, "STALE_REGION_PACKAGE_RECIPE_IDENTITY");
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.cleanupCompleted, true);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.lastFailureReason, "STALE_REGION_PACKAGE_RECIPE_IDENTITY");
});

test("24c. lifecycle drift while attached triggers cleanup and preserves reason", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  const result = invalidateIntegratedPersistentAtlas(harness.integration, {
    reasonCode: "LIFECYCLE_OWNER_MISMATCH"
  });

  assert.equal(result.reasonCode, "AUTHORIZATION_INVALIDATED");
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.cleanupCompleted, true);
  assert.equal(status.referencesReleased, true);
  assert.equal(status.lastFailureReason, "LIFECYCLE_OWNER_MISMATCH");
});

test("24d. repeated invalidation is harmless and detached invalidation creates no resources", () => {
  const harness = createHarness();
  invalidateIntegratedPersistentAtlas(harness.integration, {
    reasonCode: "MANUAL_INVALIDATION"
  });
  invalidateIntegratedPersistentAtlas(harness.integration, {
    reasonCode: "MANUAL_INVALIDATION"
  });

  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.invalidated, true);
  assert.equal(status.attached, false);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.referencesReleased, true);
  assert.equal(harness.metrics.surfaceCalls, 0);
  assert.equal(harness.metrics.lifecycleAcquireCalls, 0);
  assert.equal(harness.metrics.snapshotCalls, 0);
  assert.equal(harness.metrics.drawCalls, 0);
});

test("25. authorization failure fails closed", () => {
  const harness = createHarness({ hostname: "example.com" });
  const result = authorizeIntegratedPersistentAtlas(harness.integration, {
    confirmation: AUTHORIZE
  });
  assert.equal(result.outcome, "blocked");
  assert.equal(getIntegratedPersistentAtlasStatus(harness.integration).attached, false);
});

test("26. surface failure fails closed", () => {
  const harness = createHarness({ failSurface: true });
  authorizeIntegratedPersistentAtlas(harness.integration, { confirmation: AUTHORIZE });
  const result = attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  assert.equal(result.outcome, "failed_closed");
});

test("27. listener failure rolls back", () => {
  const harness = createHarness({ failListenerEvent: "moveend" });
  authorizeIntegratedPersistentAtlas(harness.integration, { confirmation: AUTHORIZE });
  const result = attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(status.ownedListenerCount, 0);
});

test("28. scheduler failure cleans up", () => {
  const harness = createHarness({ failScheduler: true });
  authorizeIntegratedPersistentAtlas(harness.integration, { confirmation: AUTHORIZE });
  const result = attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(status.ownedCanvasCount, 0);
});

test("29. snapshot failure cleans up", () => {
  const harness = createHarness({ failSnapshot: true, manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.failedClosed, true);
});

test("30. draw failure cleans up", () => {
  const harness = createHarness({ failDraw: true, manualScheduler: true });
  authorizeAndAttach(harness, { flushInitial: false });
  harness.flushOne();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.failedClosed, true);
});

test("31. cleanup failures are reported separately", () => {
  const harness = createHarness({
    failCanvasRemoval: true,
    failPaneRemoval: true,
    failReferenceRelease: true
  });
  authorizeAndAttach(harness);
  detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.deepEqual([...status.cleanupFailureReasons].sort(), [
    "CANVAS_REMOVAL_FAILED",
    "PANE_REMOVAL_FAILED",
    "REFERENCE_RELEASE_FAILED"
  ]);
});

test("32. duplicate attach is blocked", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  const result = attachIntegratedPersistentAtlas(harness.integration, { confirmation: ATTACH });
  assert.equal(result.reasonCode, "DUPLICATE_ATTACH");
});

test("33. redraw after detach is blocked", () => {
  const harness = createHarness();
  authorizeAndAttach(harness);
  detachIntegratedPersistentAtlas(harness.integration, { confirmation: DETACH });
  const result = requestIntegratedPersistentAtlasRedraw(harness.integration, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  assert.equal(result.reasonCode, "REDRAW_WHILE_DETACHED");
});

test("34. diagnostics are immutable and serializable", () => {
  const harness = createHarness();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("35. diagnostics expose no raw references", () => {
  const harness = createHarness();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("lifecycleOwner" in status, false);
});

test("36. module uses no window or document access", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bdocument\b/);
});

test("37. no real map canvas listener scheduler or renderer access is reported", () => {
  const harness = createHarness();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.windowAccessDetected, false);
  assert.equal(status.documentAccessDetected, false);
  assert.equal(status.realMapAccessDetected, false);
  assert.equal(status.realCanvasAccessDetected, false);
  assert.equal(status.realListenerAccessDetected, false);
  assert.equal(status.realSchedulerAccessDetected, false);
  assert.equal(status.realRendererAccessDetected, false);
});

test("38. canonical safety flags remain false and session documentation exists", () => {
  const harness = createHarness();
  const status = getIntegratedPersistentAtlasStatus(harness.integration);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.ok(fs.existsSync(sessionDocPath));
});
