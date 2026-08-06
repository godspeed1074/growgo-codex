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
  cancelQueuedPersistentRedraw,
  createControlledPersistentAtlasSchedulerListenerContract,
  getPersistentSchedulerListenerStatus,
  invalidatePersistentSchedulerListenerContract,
  registerApprovedPersistentListeners,
  removeApprovedPersistentListeners,
  requestPersistentRedraw
} from "../client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_60_PERSISTENT_SCHEDULER_LISTENER_CONTRACT.md"
);

function createHarness({
  hostname = "127.0.0.1",
  readinessApproved = true,
  readinessReasonCode = "READINESS_APPROVED",
  lifecycleMatches = true,
  lifecycleReasonCode = "LIFECYCLE_OWNER_MISMATCH",
  failRegisterEvent = null,
  forbiddenEventOverride = null,
  failRemoveEvent = null,
  schedulerUnavailable = false,
  cancellerUnavailable = false,
  mismatchedUnavailable = false,
  permissionDeniedReason = null,
  drawFailure = false,
  manualScheduler = true
} = {}) {
  const queuedCallbacks = [];
  const authIdentity = {
    sessionId: "SESSION_001",
    mapIdentityId: "MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_001"
  };
  const contractIdentity = {
    schedulerOwnerId: "SCHEDULER_OWNER_A",
    listenerOwnerId: "LISTENER_OWNER_A",
    mapIdentityId: "MAP_001",
    sessionId: "SESSION_001",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  };

  let attached = false;
  let contract = null;
  let triggerFollowUpDuringFirstDraw = false;

  const metrics = {
    registeredEvents: [],
    removedEvents: [],
    removedCallbacks: [],
    scheduleCount: 0,
    cancelCount: 0,
    drawCount: 0,
    drawReasons: [],
    listenerCallbackIdentities: {}
  };

  const authorization = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => hostname,
    identityProvider: () => ({
      ...authIdentity
    }),
    readinessProvider: () => ({
      approved: readinessApproved,
      reasonCode: readinessReasonCode
    }),
    controllerAttachmentStateProvider: () => ({
      attached
    }),
    lifecycleOwnerStateProvider: () => ({
      matches: lifecycleMatches,
      reasonCode: lifecycleReasonCode
    }),
    nowProvider: () => "2026-08-06T12:00:00.000Z",
    createSessionId: () => {
      return authIdentity.sessionId;
    }
  });

  const frameScheduler = mismatchedUnavailable
    ? undefined
    : schedulerUnavailable
      ? undefined
      : (callback) => {
          metrics.scheduleCount += 1;
          if (manualScheduler) {
            queuedCallbacks.push(callback);
          } else {
            callback();
          }
          return { kind: "fake-frame-handle", id: metrics.scheduleCount };
        };

  const frameCanceller = mismatchedUnavailable
    ? undefined
    : cancellerUnavailable
      ? undefined
      : () => {
          metrics.cancelCount += 1;
        };

  contract = createControlledPersistentAtlasSchedulerListenerContract({
    frameScheduler,
    frameCanceller,
    redrawPermissionProvider: () => {
      if (permissionDeniedReason) {
        return {
          allowed: false,
          reasonCode: permissionDeniedReason
        };
      }
      const result = validatePersistentRedrawPermission(authorization);
      return {
        allowed: result.outcome === "allowed",
        reasonCode: result.reasonCode
      };
    },
    listenerRegistrar: (eventName, callback) => {
      metrics.registeredEvents.push(eventName);
      metrics.listenerCallbackIdentities[eventName] = callback;
      if (failRegisterEvent === eventName) {
        throw Object.assign(new Error("PARTIAL_LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "PARTIAL_LISTENER_REGISTRATION_FAILED"
        });
      }
      return {
        eventName: forbiddenEventOverride ?? eventName,
        registrationId: `${eventName}_registration`
      };
    },
    listenerRemover: (registration, callback) => {
      const eventName = registration?.eventName ?? "unknown";
      metrics.removedEvents.push(eventName);
      metrics.removedCallbacks.push(callback);
      if (failRemoveEvent === eventName) {
        throw Object.assign(new Error("LISTENER_REMOVAL_FAILED"), {
          reasonCode: "LISTENER_REMOVAL_FAILED"
        });
      }
    },
    identityProvider: () => ({ ...contractIdentity }),
    drawExecutor: ({ reason }) => {
      metrics.drawCount += 1;
      metrics.drawReasons.push(reason);
      if (drawFailure) {
        throw Object.assign(new Error("DRAW_EXECUTION_FAILED"), {
          reasonCode: "DRAW_EXECUTION_FAILED"
        });
      }
      if (triggerFollowUpDuringFirstDraw && metrics.drawCount === 1) {
        requestPersistentRedraw(contract, { reason: "follow_up_redraw" });
      }
    }
  });

  return {
    contract,
    authorization,
    identity: contractIdentity,
    authIdentity,
    metrics,
    authorize() {
      return authorizePersistentAtlasSession(authorization, {
        confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
      });
    },
    consumeAttach() {
      return consumePersistentAttachPermission(authorization);
    },
    setAttached(next) {
      attached = next;
    },
    setIdentity(overrides) {
      Object.assign(contractIdentity, overrides);
    },
    setAuthorizationIdentity(overrides) {
      Object.assign(authIdentity, overrides);
    },
    setReadiness(nextApproved, nextReason = "READINESS_APPROVED") {
      readinessApproved = nextApproved;
      readinessReasonCode = nextReason;
    },
    enableFollowUpDuringFirstDraw() {
      triggerFollowUpDuringFirstDraw = true;
    },
    flushOne() {
      const callback = queuedCallbacks.shift();
      if (callback) {
        callback();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queuedCallbacks.length > 0 && remaining > 0) {
        remaining -= 1;
        const callback = queuedCallbacks.shift();
        callback();
      }
    }
  };
}

function readyHarness(options = {}) {
  const harness = createHarness(options);
  harness.authorize();
  harness.consumeAttach();
  harness.setAttached(true);
  const registered = registerApprovedPersistentListeners(harness.contract, {
    schedulerOwnerId: harness.identity.schedulerOwnerId,
    listenerOwnerId: harness.identity.listenerOwnerId,
    mapIdentityId: harness.identity.mapIdentityId,
    sessionId: harness.identity.sessionId,
    lifecycleOwnerId: harness.identity.lifecycleOwnerId
  });
  return { harness, registered };
}

test("initial inactive state is frozen serializable and keeps all canonical safety flags false", () => {
  const harness = createHarness();
  const status = getPersistentSchedulerListenerStatus(harness.contract);

  assert.equal(status.schemaId, "GROWGO_CONTROLLED_PERSISTENT_ATLAS_SCHEDULER_LISTENER_STATUS_001");
  assert.equal(status.state, "inactive");
  assert.equal(status.ready, false);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.frameQueued, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("exact three approved listeners register and forbidden event override is rejected", () => {
  const { harness, registered } = readyHarness();

  assert.equal(registered.outcome, "registered");
  assert.deepEqual(harness.metrics.registeredEvents, ["moveend", "zoomend", "resize"]);
  assert.equal(getPersistentSchedulerListenerStatus(harness.contract).ownedListenerCount, 3);

  const forbidden = createHarness({ forbiddenEventOverride: "move" });
  forbidden.authorize();
  forbidden.consumeAttach();
  forbidden.setAttached(true);
  const result = registerApprovedPersistentListeners(forbidden.contract, {
    schedulerOwnerId: forbidden.identity.schedulerOwnerId,
    listenerOwnerId: forbidden.identity.listenerOwnerId,
    mapIdentityId: forbidden.identity.mapIdentityId,
    sessionId: forbidden.identity.sessionId,
    lifecycleOwnerId: forbidden.identity.lifecycleOwnerId
  });
  assert.equal(result.reasonCode, "INVALID_EVENT_NAME");
});

test("duplicate registration is blocked and partial registration rolls back", () => {
  const { harness } = readyHarness();
  const duplicate = registerApprovedPersistentListeners(harness.contract, {
    schedulerOwnerId: harness.identity.schedulerOwnerId,
    listenerOwnerId: harness.identity.listenerOwnerId,
    mapIdentityId: harness.identity.mapIdentityId,
    sessionId: harness.identity.sessionId,
    lifecycleOwnerId: harness.identity.lifecycleOwnerId
  });
  assert.equal(duplicate.reasonCode, "DUPLICATE_LISTENER_REGISTRATION");

  const partial = createHarness({ failRegisterEvent: "zoomend" });
  partial.authorize();
  partial.consumeAttach();
  partial.setAttached(true);
  const result = registerApprovedPersistentListeners(partial.contract, {
    schedulerOwnerId: partial.identity.schedulerOwnerId,
    listenerOwnerId: partial.identity.listenerOwnerId,
    mapIdentityId: partial.identity.mapIdentityId,
    sessionId: partial.identity.sessionId,
    lifecycleOwnerId: partial.identity.lifecycleOwnerId
  });
  assert.equal(result.reasonCode, "PARTIAL_LISTENER_REGISTRATION_FAILED");
  assert.deepEqual(partial.metrics.removedEvents, ["moveend"]);
});

test("exact callback identities are removed and repeated removal is harmless", () => {
  const { harness } = readyHarness();
  const first = removeApprovedPersistentListeners(harness.contract);
  const second = removeApprovedPersistentListeners(harness.contract);

  assert.equal(first.outcome, "removed");
  assert.deepEqual(harness.metrics.removedEvents.sort(), ["moveend", "resize", "zoomend"]);
  assert.equal(
    harness.metrics.removedCallbacks.includes(
      harness.metrics.listenerCallbackIdentities.moveend
    ),
    true
  );
  assert.equal(second.outcome, "removed");
});

test("one redraw request queues one frame and multiple requests coalesce", () => {
  const { harness } = readyHarness();
  const first = requestPersistentRedraw(harness.contract, { reason: "initial_attach" });
  const second = requestPersistentRedraw(harness.contract, { reason: "moveend" });
  const third = requestPersistentRedraw(harness.contract, { reason: "zoomend" });

  assert.equal(first.outcome, "queued");
  assert.equal(second.outcome, "coalesced");
  assert.equal(third.outcome, "coalesced");
  assert.equal(harness.metrics.scheduleCount, 1);
  assert.equal(
    getPersistentSchedulerListenerStatus(harness.contract).redrawCoalescedCount,
    2
  );
});

test("redraw while drawing sets one follow-up redraw and only one follow-up frame is scheduled", () => {
  const { harness } = readyHarness();
  harness.enableFollowUpDuringFirstDraw();
  requestPersistentRedraw(harness.contract, { reason: "initial_attach" });
  harness.flushOne();

  const statusAfterFirst = getPersistentSchedulerListenerStatus(harness.contract);
  assert.equal(statusAfterFirst.followUpRedrawPending, false);
  assert.equal(statusAfterFirst.drawCompletedCount, 1);
  assert.equal(harness.metrics.scheduleCount, 2);

  harness.flushOne();
  const finalStatus = getPersistentSchedulerListenerStatus(harness.contract);
  assert.equal(finalStatus.drawCompletedCount, 2);
  assert.equal(finalStatus.parallelDrawDetected, false);
  assert.equal(finalStatus.recursiveDrawDetected, false);
});

test("stale callback is ignored after invalidation and queued frame is cancelled during detach", () => {
  const { harness } = readyHarness();
  requestPersistentRedraw(harness.contract, { reason: "initial_attach" });
  invalidatePersistentSchedulerListenerContract(harness.contract, {
    reasonCode: "CONTRACT_INVALIDATED"
  });
  harness.flushOne();

  const invalidatedStatus = getPersistentSchedulerListenerStatus(harness.contract);
  assert.equal(invalidatedStatus.staleCallbackIgnoredCount, 1);
  assert.equal(invalidatedStatus.invalidated, true);

  const active = readyHarness();
  requestPersistentRedraw(active.harness.contract, { reason: "initial_attach" });
  const cancelled = cancelQueuedPersistentRedraw(active.harness.contract);
  assert.equal(cancelled.outcome, "cancelled");
  assert.equal(active.harness.metrics.cancelCount, 1);
});

test("scheduler unavailable, canceller unavailable, and mismatch all fail closed", () => {
  const schedulerMissing = createHarness({ schedulerUnavailable: true });
  schedulerMissing.authorize();
  schedulerMissing.consumeAttach();
  schedulerMissing.setAttached(true);
  const schedulerMissingResult = registerApprovedPersistentListeners(
    schedulerMissing.contract,
    {
      schedulerOwnerId: schedulerMissing.identity.schedulerOwnerId,
      listenerOwnerId: schedulerMissing.identity.listenerOwnerId,
      mapIdentityId: schedulerMissing.identity.mapIdentityId,
      sessionId: schedulerMissing.identity.sessionId,
      lifecycleOwnerId: schedulerMissing.identity.lifecycleOwnerId
    }
  );
  assert.equal(schedulerMissingResult.reasonCode, "SCHEDULER_UNAVAILABLE");

  const cancellerMissing = createHarness({ cancellerUnavailable: true });
  cancellerMissing.authorize();
  cancellerMissing.consumeAttach();
  cancellerMissing.setAttached(true);
  const cancellerMissingResult = registerApprovedPersistentListeners(
    cancellerMissing.contract,
    {
      schedulerOwnerId: cancellerMissing.identity.schedulerOwnerId,
      listenerOwnerId: cancellerMissing.identity.listenerOwnerId,
      mapIdentityId: cancellerMissing.identity.mapIdentityId,
      sessionId: cancellerMissing.identity.sessionId,
      lifecycleOwnerId: cancellerMissing.identity.lifecycleOwnerId
    }
  );
  assert.equal(cancellerMissingResult.reasonCode, "CANCELLER_UNAVAILABLE");

  const mismatch = createHarness({ mismatchedUnavailable: true });
  mismatch.authorize();
  mismatch.consumeAttach();
  mismatch.setAttached(true);
  const mismatchResult = registerApprovedPersistentListeners(mismatch.contract, {
    schedulerOwnerId: mismatch.identity.schedulerOwnerId,
    listenerOwnerId: mismatch.identity.listenerOwnerId,
    mapIdentityId: mismatch.identity.mapIdentityId,
    sessionId: mismatch.identity.sessionId,
    lifecycleOwnerId: mismatch.identity.lifecycleOwnerId
  });
  assert.equal(mismatchResult.reasonCode, "SCHEDULER_CANCELLER_MISMATCH");
});

test("redraw permission denial, stale map identity, stale session, and draw failure are proven", () => {
  const denied = readyHarness({ permissionDeniedReason: "REDRAW_PERMISSION_DENIED" });
  const deniedResult = requestPersistentRedraw(denied.harness.contract, {
    reason: "manual_redraw"
  });
  assert.equal(deniedResult.reasonCode, "REDRAW_PERMISSION_DENIED");

  const staleMap = readyHarness();
  staleMap.harness.setIdentity({ mapIdentityId: "MAP_002" });
  const staleMapResult = requestPersistentRedraw(staleMap.harness.contract, {
    reason: "manual_redraw"
  });
  assert.equal(staleMapResult.reasonCode, "STALE_MAP_IDENTITY");

  const staleSession = readyHarness({ permissionDeniedReason: "STALE_SESSION" });
  const staleSessionResult = requestPersistentRedraw(staleSession.harness.contract, {
    reason: "manual_redraw"
  });
  assert.equal(staleSessionResult.reasonCode, "STALE_SESSION");

  const drawFailureHarness = readyHarness({ drawFailure: true });
  requestPersistentRedraw(drawFailureHarness.harness.contract, {
    reason: "initial_attach"
  });
  drawFailureHarness.harness.flushOne();
  assert.equal(
    getPersistentSchedulerListenerStatus(drawFailureHarness.harness.contract)
      .lastFailureReason,
    "DRAW_EXECUTION_FAILED"
  );
});

test("listener removal failure is reported, status is immutable/serializable, and no raw refs are exposed", () => {
  const { harness } = readyHarness({ failRemoveEvent: "zoomend" });
  const removed = removeApprovedPersistentListeners(harness.contract);

  assert.equal(removed.reasonCode, "LISTENER_REMOVAL_FAILED");

  const status = getPersistentSchedulerListenerStatus(harness.contract);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("listenerCallbacks" in status, false);
  assert.equal("listenerRegistrations" in status, false);
  assert.equal("queuedFrameHandle" in status, false);
});

test("module uses no timers, no polling, no real browser/map access, no window exposure, and session doc exists", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bsetTimeout\b/);
  assert.doesNotMatch(source, /\bsetInterval\b/);
  assert.doesNotMatch(source, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(source, /\bcancelAnimationFrame\b/);
  assert.doesNotMatch(source, /\baddEventListener\b/);
  assert.doesNotMatch(source, /\bLeaflet\b/);
  assert.ok(fs.existsSync(sessionDocPath));
});

test("integration proof with injected fakes only covers authorize consume register coalesce draw follow-up detach cleanup and zero ownership", () => {
  const { harness } = readyHarness();
  requestPersistentRedraw(harness.contract, { reason: "initial_attach" });
  requestPersistentRedraw(harness.contract, { reason: "moveend" });
  requestPersistentRedraw(harness.contract, { reason: "zoomend" });
  requestPersistentRedraw(harness.contract, { reason: "resize" });
  harness.enableFollowUpDuringFirstDraw();
  harness.flushOne();
  harness.flushOne();
  cancelQueuedPersistentRedraw(harness.contract);
  removeApprovedPersistentListeners(harness.contract);

  const status = getPersistentSchedulerListenerStatus(harness.contract);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.frameQueued, false);
  assert.equal(status.frameHandlePresent, false);
  assert.equal(status.drawCompletedCount >= 1, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
});
