const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_SCHEDULER_LISTENER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_SCHEDULER_LISTENER_RESULT_001";

const APPROVED_REASONS = [
  "initial_attach",
  "moveend",
  "zoomend",
  "resize",
  "manual_redraw",
  "follow_up_redraw"
];

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = [
  "move",
  "drag",
  "mousemove",
  "touchmove",
  "wheel"
];

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }

  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  return fn;
}

function isFunction(value) {
  return typeof value === "function";
}

function isAvailableFunction(value) {
  return isFunction(value) && value.__growgoUnavailable !== true;
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }

  return fallback;
}

function sanitizeBinding(binding = {}) {
  return {
    schedulerOwnerId:
      binding?.schedulerOwnerId == null ? null : String(binding.schedulerOwnerId),
    listenerOwnerId:
      binding?.listenerOwnerId == null ? null : String(binding.listenerOwnerId),
    mapIdentityId:
      binding?.mapIdentityId == null ? null : String(binding.mapIdentityId),
    sessionId: binding?.sessionId == null ? null : String(binding.sessionId),
    lifecycleOwnerId:
      binding?.lifecycleOwnerId == null ? null : String(binding.lifecycleOwnerId)
  };
}

function bindingMatches(left, right) {
  const a = sanitizeBinding(left);
  const b = sanitizeBinding(right);
  return (
    a.schedulerOwnerId === b.schedulerOwnerId &&
    a.listenerOwnerId === b.listenerOwnerId &&
    a.mapIdentityId === b.mapIdentityId &&
    a.sessionId === b.sessionId &&
    a.lifecycleOwnerId === b.lifecycleOwnerId
  );
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    ready: state.ready,
    invalidated: state.invalidated,
    failedClosed: state.failedClosed,
    schedulerOwnerId: state.schedulerOwnerId,
    listenerOwnerId: state.listenerOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    moveendListenerRegistered: state.moveendListenerRegistered,
    zoomendListenerRegistered: state.zoomendListenerRegistered,
    resizeListenerRegistered: state.resizeListenerRegistered,
    ownedListenerCount: state.ownedListenerCount,
    frameQueued: state.frameQueued,
    frameHandlePresent: state.frameHandlePresent,
    drawing: state.drawing,
    followUpRedrawPending: state.followUpRedrawPending,
    listenerRegisterAttemptCount: state.listenerRegisterAttemptCount,
    listenerRegisterCompletedCount: state.listenerRegisterCompletedCount,
    listenerRemoveAttemptCount: state.listenerRemoveAttemptCount,
    listenerRemoveCompletedCount: state.listenerRemoveCompletedCount,
    redrawRequestCount: state.redrawRequestCount,
    redrawQueuedCount: state.redrawQueuedCount,
    redrawCoalescedCount: state.redrawCoalescedCount,
    redrawRejectedCount: state.redrawRejectedCount,
    frameScheduleAttemptCount: state.frameScheduleAttemptCount,
    frameScheduleCompletedCount: state.frameScheduleCompletedCount,
    frameCancelAttemptCount: state.frameCancelAttemptCount,
    frameCancelCompletedCount: state.frameCancelCompletedCount,
    drawAttemptCount: state.drawAttemptCount,
    drawCompletedCount: state.drawCompletedCount,
    followUpRedrawCount: state.followUpRedrawCount,
    staleCallbackIgnoredCount: state.staleCallbackIgnoredCount,
    lastRequestedReason: state.lastRequestedReason,
    lastCompletedReason: state.lastCompletedReason,
    lastFailureReason: state.lastFailureReason,
    forbiddenListenerDetected: state.forbiddenListenerDetected,
    timerFallbackDetected: false,
    pollingDetected: false,
    recursiveDrawDetected: state.recursiveDrawDetected,
    parallelDrawDetected: state.parallelDrawDetected,
    staleCallbackDetected: state.staleCallbackDetected,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult({
  operation,
  outcome,
  reasonCode,
  state,
  extra = {}
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    status: freezeStatus(state),
    ...extra
  });
}

export function createControlledPersistentAtlasSchedulerListenerContract({
  frameScheduler = unavailable("SCHEDULER_UNAVAILABLE"),
  frameCanceller = unavailable("CANCELLER_UNAVAILABLE"),
  redrawPermissionProvider = unavailable("REDRAW_PERMISSION_DENIED"),
  listenerRegistrar = unavailable("PERSISTENT_LISTENER_REGISTRAR_UNAVAILABLE"),
  listenerRemover = unavailable("PERSISTENT_LISTENER_REMOVER_UNAVAILABLE"),
  identityProvider = unavailable("STALE_SESSION"),
  drawExecutor = unavailable("DRAW_EXECUTION_FAILED")
} = {}) {
  const internal = {
    listenerCallbacks: {
      moveend: null,
      zoomend: null,
      resize: null
    },
    listenerRegistrations: {
      moveend: null,
      zoomend: null,
      resize: null
    },
    queuedFrameHandle: null,
    queuedFrameToken: 0,
    drawingGeneration: 0,
    followUpReason: null
  };

  const state = {
    state: "inactive",
    ready: false,
    invalidated: false,
    failedClosed: false,
    schedulerOwnerId: null,
    listenerOwnerId: null,
    mapIdentityId: null,
    sessionId: null,
    lifecycleOwnerId: null,
    moveendListenerRegistered: false,
    zoomendListenerRegistered: false,
    resizeListenerRegistered: false,
    ownedListenerCount: 0,
    frameQueued: false,
    frameHandlePresent: false,
    drawing: false,
    followUpRedrawPending: false,
    listenerRegisterAttemptCount: 0,
    listenerRegisterCompletedCount: 0,
    listenerRemoveAttemptCount: 0,
    listenerRemoveCompletedCount: 0,
    redrawRequestCount: 0,
    redrawQueuedCount: 0,
    redrawCoalescedCount: 0,
    redrawRejectedCount: 0,
    frameScheduleAttemptCount: 0,
    frameScheduleCompletedCount: 0,
    frameCancelAttemptCount: 0,
    frameCancelCompletedCount: 0,
    drawAttemptCount: 0,
    drawCompletedCount: 0,
    followUpRedrawCount: 0,
    staleCallbackIgnoredCount: 0,
    lastRequestedReason: null,
    lastCompletedReason: null,
    lastFailureReason: null,
    forbiddenListenerDetected: false,
    recursiveDrawDetected: false,
    parallelDrawDetected: false,
    staleCallbackDetected: false
  };

  function syncStateFlags() {
    state.ready = state.state === "ready";
    state.moveendListenerRegistered = !!internal.listenerRegistrations.moveend;
    state.zoomendListenerRegistered = !!internal.listenerRegistrations.zoomend;
    state.resizeListenerRegistered = !!internal.listenerRegistrations.resize;
    state.ownedListenerCount = APPROVED_EVENTS.reduce(
      (count, eventName) => count + (internal.listenerRegistrations[eventName] ? 1 : 0),
      0
    );
    state.frameQueued = !!internal.queuedFrameHandle;
    state.frameHandlePresent = !!internal.queuedFrameHandle;
  }

  function setState(nextState) {
    state.state = nextState;
    syncStateFlags();
  }

  function setFailure(reasonCode, failedClosed = false) {
    state.lastFailureReason = reasonCode;
    if (failedClosed) {
      state.failedClosed = true;
      setState("failed_closed");
    }
    return reasonCode;
  }

  function getCurrentBinding() {
    return sanitizeBinding({
      schedulerOwnerId: state.schedulerOwnerId,
      listenerOwnerId: state.listenerOwnerId,
      mapIdentityId: state.mapIdentityId,
      sessionId: state.sessionId,
      lifecycleOwnerId: state.lifecycleOwnerId
    });
  }

  function validateSchedulerDependencies() {
    const schedulerAvailable = isAvailableFunction(frameScheduler);
    const cancellerAvailable = isAvailableFunction(frameCanceller);

    if (!schedulerAvailable && !cancellerAvailable) {
      throw Object.assign(new Error("SCHEDULER_CANCELLER_MISMATCH"), {
        reasonCode: "SCHEDULER_CANCELLER_MISMATCH"
      });
    }

    if (!schedulerAvailable) {
      throw Object.assign(new Error("SCHEDULER_UNAVAILABLE"), {
        reasonCode: "SCHEDULER_UNAVAILABLE"
      });
    }

    if (!cancellerAvailable) {
      throw Object.assign(new Error("CANCELLER_UNAVAILABLE"), {
        reasonCode: "CANCELLER_UNAVAILABLE"
      });
    }
  }

  function invalidatePersistentSchedulerListenerContract({ reasonCode }) {
    internal.queuedFrameToken += 1;
    internal.queuedFrameHandle = null;
    internal.followUpReason = null;
    state.invalidated = true;
    state.lastFailureReason = reasonCode ?? "CONTRACT_INVALIDATED";
    setState("invalidated");

    return buildResult({
      operation: "invalidatePersistentSchedulerListenerContract",
      outcome: "invalidated",
      reasonCode: "CONTRACT_INVALIDATED",
      state,
      extra: {
        invalidationReasonCode: reasonCode ?? "CONTRACT_INVALIDATED"
      }
    });
  }

  function checkPermissionAndIdentity() {
    const permission = redrawPermissionProvider() ?? {};

    if (permission.allowed !== true) {
      const reason = permission.reasonCode ?? "REDRAW_PERMISSION_DENIED";
      if (reason === "STALE_SESSION") {
        invalidatePersistentSchedulerListenerContract({ reasonCode: "STALE_SESSION" });
      }
      throw Object.assign(new Error(reason), { reasonCode: reason });
    }

    const currentIdentity = sanitizeBinding(identityProvider() ?? {});
    if (!bindingMatches(currentIdentity, getCurrentBinding())) {
      if (currentIdentity.mapIdentityId !== state.mapIdentityId) {
        invalidatePersistentSchedulerListenerContract({ reasonCode: "STALE_MAP_IDENTITY" });
        throw Object.assign(new Error("STALE_MAP_IDENTITY"), {
          reasonCode: "STALE_MAP_IDENTITY"
        });
      }

      invalidatePersistentSchedulerListenerContract({ reasonCode: "STALE_SESSION" });
      throw Object.assign(new Error("STALE_SESSION"), {
        reasonCode: "STALE_SESSION"
      });
    }

    return permission;
  }

  function scheduleFrameForReason(reason) {
    validateSchedulerDependencies();
    state.frameScheduleAttemptCount += 1;
    internal.queuedFrameToken += 1;
    const token = internal.queuedFrameToken;
    const callback = () => runQueuedPersistentRedraw({ token });
    internal.queuedFrameHandle = frameScheduler(callback);
    state.frameScheduleCompletedCount += 1;
    state.redrawQueuedCount += 1;
    setState("redraw_queued");
    return token;
  }

  function requestPersistentRedraw({ reason } = {}) {
    state.redrawRequestCount += 1;
    state.lastRequestedReason = reason ?? null;

    if (!APPROVED_REASONS.includes(reason)) {
      state.redrawRejectedCount += 1;
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "blocked",
        reasonCode: setFailure("REDRAW_PERMISSION_DENIED"),
        state
      });
    }

    if (state.failedClosed || state.invalidated || state.state === "invalidated") {
      state.redrawRejectedCount += 1;
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "blocked",
        reasonCode: setFailure("CONTRACT_INVALIDATED"),
        state
      });
    }

    if (!["ready", "redraw_queued", "drawing", "follow_up_pending"].includes(state.state)) {
      state.redrawRejectedCount += 1;
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "blocked",
        reasonCode: setFailure("REDRAW_WHILE_DETACHED"),
        state
      });
    }

    try {
      checkPermissionAndIdentity();
    } catch (error) {
      state.redrawRejectedCount += 1;
      const reasonCode = toReasonCode(error, "REDRAW_PERMISSION_DENIED");
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "blocked",
        reasonCode: setFailure(reasonCode),
        state
      });
    }

    if (state.drawing) {
      if (!state.followUpRedrawPending) {
        state.followUpRedrawPending = true;
        internal.followUpReason = "follow_up_redraw";
        state.followUpRedrawCount += 1;
        setState("follow_up_pending");
      } else {
        state.redrawCoalescedCount += 1;
      }

      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "coalesced",
        reasonCode: "DRAW_ALREADY_IN_PROGRESS",
        state
      });
    }

    if (internal.queuedFrameHandle) {
      state.redrawCoalescedCount += 1;
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "coalesced",
        reasonCode: "REDRAW_ALREADY_QUEUED",
        state
      });
    }

    try {
      const token = scheduleFrameForReason(reason);
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "queued",
        reasonCode: "REDRAW_ALREADY_QUEUED",
        state,
        extra: {
          queuedFrameToken: token
        }
      });
    } catch (error) {
      const reasonCode = toReasonCode(error, "SCHEDULER_UNAVAILABLE");
      return buildResult({
        operation: "requestPersistentRedraw",
        outcome: "failed_closed",
        reasonCode: setFailure(reasonCode, true),
        state
      });
    }
  }

  function runQueuedPersistentRedraw({ token } = {}) {
    if (!internal.queuedFrameHandle || token !== internal.queuedFrameToken) {
      state.staleCallbackDetected = true;
      state.staleCallbackIgnoredCount += 1;
      return buildResult({
        operation: "runQueuedPersistentRedraw",
        outcome: "ignored",
        reasonCode: "STALE_FRAME_CALLBACK",
        state
      });
    }

    if (state.invalidated || state.failedClosed || state.state === "inactive") {
      internal.queuedFrameHandle = null;
      state.staleCallbackDetected = true;
      state.staleCallbackIgnoredCount += 1;
      syncStateFlags();
      return buildResult({
        operation: "runQueuedPersistentRedraw",
        outcome: "ignored",
        reasonCode: "STALE_FRAME_CALLBACK",
        state
      });
    }

    if (state.drawing) {
      state.recursiveDrawDetected = true;
      state.parallelDrawDetected = true;
      return buildResult({
        operation: "runQueuedPersistentRedraw",
        outcome: "failed_closed",
        reasonCode: setFailure("DRAW_ALREADY_IN_PROGRESS", true),
        state
      });
    }

    try {
      checkPermissionAndIdentity();
    } catch (error) {
      internal.queuedFrameHandle = null;
      syncStateFlags();
      const reasonCode = toReasonCode(error, "REDRAW_PERMISSION_DENIED");
      return buildResult({
        operation: "runQueuedPersistentRedraw",
        outcome: "blocked",
        reasonCode: setFailure(reasonCode),
        state
      });
    }

    internal.queuedFrameHandle = null;
    syncStateFlags();
    state.drawing = true;
    setState("drawing");
    state.drawAttemptCount += 1;

    try {
      drawExecutor({
        reason: state.lastRequestedReason,
        binding: getCurrentBinding(),
        requestPersistentRedraw
      });
      state.drawCompletedCount += 1;
      state.lastCompletedReason = state.lastRequestedReason;
    } catch (error) {
      state.drawing = false;
      return buildResult({
        operation: "runQueuedPersistentRedraw",
        outcome: "failed_closed",
        reasonCode: setFailure(
          toReasonCode(error, "DRAW_EXECUTION_FAILED"),
          true
        ),
        state
      });
    }

    state.drawing = false;

    if (state.followUpRedrawPending && internal.followUpReason) {
      state.followUpRedrawPending = false;
      const reason = internal.followUpReason;
      internal.followUpReason = null;
      try {
        scheduleFrameForReason(reason);
      } catch (error) {
        return buildResult({
          operation: "runQueuedPersistentRedraw",
          outcome: "failed_closed",
          reasonCode: setFailure(
            toReasonCode(error, "SCHEDULER_UNAVAILABLE"),
            true
          ),
          state
        });
      }
    } else {
      setState("ready");
    }

    return buildResult({
      operation: "runQueuedPersistentRedraw",
      outcome: "drawn",
      reasonCode: "follow_up_redraw" === state.lastCompletedReason
        ? "DRAW_ALREADY_IN_PROGRESS"
        : "REDRAW_ALREADY_QUEUED",
      state
    });
  }

  function cancelQueuedPersistentRedraw() {
    if (!internal.queuedFrameHandle) {
      return buildResult({
        operation: "cancelQueuedPersistentRedraw",
        outcome: "idle",
        reasonCode: "REDRAW_WHILE_DETACHED",
        state
      });
    }

    try {
      validateSchedulerDependencies();
      state.frameCancelAttemptCount += 1;
      frameCanceller(internal.queuedFrameHandle);
      state.frameCancelCompletedCount += 1;
      internal.queuedFrameHandle = null;
      internal.queuedFrameToken += 1;
      syncStateFlags();
      if (!state.invalidated && !state.failedClosed) {
        setState("ready");
      }

      return buildResult({
        operation: "cancelQueuedPersistentRedraw",
        outcome: "cancelled",
        reasonCode: "REDRAW_ALREADY_QUEUED",
        state
      });
    } catch (error) {
      return buildResult({
        operation: "cancelQueuedPersistentRedraw",
        outcome: "failed_closed",
        reasonCode: setFailure(
          toReasonCode(error, "CANCELLER_UNAVAILABLE"),
          true
        ),
        state
      });
    }
  }

  function registerApprovedPersistentListeners(binding = {}) {
    state.listenerRegisterAttemptCount += 1;

    if (state.failedClosed || state.invalidated) {
      return buildResult({
        operation: "registerApprovedPersistentListeners",
        outcome: "blocked",
        reasonCode: setFailure("CONTRACT_INVALIDATED"),
        state
      });
    }

    if (state.ownedListenerCount > 0) {
      return buildResult({
        operation: "registerApprovedPersistentListeners",
        outcome: "blocked",
        reasonCode: setFailure("DUPLICATE_LISTENER_REGISTRATION"),
        state
      });
    }

    try {
      validateSchedulerDependencies();
      const sanitizedBinding = sanitizeBinding(binding);
      state.schedulerOwnerId = sanitizedBinding.schedulerOwnerId;
      state.listenerOwnerId = sanitizedBinding.listenerOwnerId;
      state.mapIdentityId = sanitizedBinding.mapIdentityId;
      state.sessionId = sanitizedBinding.sessionId;
      state.lifecycleOwnerId = sanitizedBinding.lifecycleOwnerId;

      setState("registering_listeners");

      for (const eventName of APPROVED_EVENTS) {
        if (FORBIDDEN_EVENTS.includes(eventName)) {
          state.forbiddenListenerDetected = true;
          throw Object.assign(new Error("INVALID_EVENT_NAME"), {
            reasonCode: "INVALID_EVENT_NAME"
          });
        }

        const callback = () => requestPersistentRedraw({ reason: eventName });
        const registration = listenerRegistrar(eventName, callback, sanitizedBinding);
        const actualEventName = String(registration?.eventName ?? eventName);

        if (
          !APPROVED_EVENTS.includes(actualEventName) ||
          FORBIDDEN_EVENTS.includes(actualEventName)
        ) {
          state.forbiddenListenerDetected = true;
          throw Object.assign(new Error("INVALID_EVENT_NAME"), {
            reasonCode: "INVALID_EVENT_NAME"
          });
        }

        internal.listenerCallbacks[eventName] = callback;
        internal.listenerRegistrations[eventName] = registration ?? {
          eventName: actualEventName
        };
      }

      state.listenerRegisterCompletedCount += 1;
      setState("ready");

      return buildResult({
        operation: "registerApprovedPersistentListeners",
        outcome: "registered",
        reasonCode: "REDRAW_ALREADY_QUEUED",
        state
      });
    } catch (error) {
      const failures = [];
      for (const eventName of APPROVED_EVENTS) {
        const registration = internal.listenerRegistrations[eventName];
        if (!registration) {
          continue;
        }

        try {
          listenerRemover(registration, internal.listenerCallbacks[eventName]);
        } catch (removalError) {
          failures.push(toReasonCode(removalError, "LISTENER_REMOVAL_FAILED"));
        }

        internal.listenerRegistrations[eventName] = null;
        internal.listenerCallbacks[eventName] = null;
      }

      syncStateFlags();

      return buildResult({
        operation: "registerApprovedPersistentListeners",
        outcome: "failed_closed",
        reasonCode: setFailure(
          failures.length > 0
            ? failures[0]
            : toReasonCode(error, "PARTIAL_LISTENER_REGISTRATION_FAILED"),
          true
        ),
        state
      });
    }
  }

  function removeApprovedPersistentListeners() {
    state.listenerRemoveAttemptCount += 1;
    setState("removing_listeners");

    const failures = [];

    if (internal.queuedFrameHandle) {
      const cancelResult = cancelQueuedPersistentRedraw();
      if (cancelResult.outcome === "failed_closed") {
        failures.push(cancelResult.reasonCode);
      }
    }

    for (const eventName of APPROVED_EVENTS) {
      const registration = internal.listenerRegistrations[eventName];
      if (!registration) {
        continue;
      }

      try {
        listenerRemover(registration, internal.listenerCallbacks[eventName]);
        state.listenerRemoveCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "LISTENER_REMOVAL_FAILED"));
      }

      internal.listenerRegistrations[eventName] = null;
      internal.listenerCallbacks[eventName] = null;
    }

    syncStateFlags();

    if (failures.length > 0) {
      return buildResult({
        operation: "removeApprovedPersistentListeners",
        outcome: "failed_closed",
        reasonCode: setFailure(failures[0], true),
        state,
        extra: {
          removalFailureReasons: failures
        }
      });
    }

    if (!state.invalidated && !state.failedClosed) {
      setState("inactive");
    }

    return buildResult({
      operation: "removeApprovedPersistentListeners",
      outcome: "removed",
      reasonCode: "REDRAW_WHILE_DETACHED",
      state
    });
  }

  function getPersistentSchedulerListenerStatus() {
    syncStateFlags();
    return freezeStatus(state);
  }

  syncStateFlags();

  return {
    registerApprovedPersistentListeners,
    removeApprovedPersistentListeners,
    requestPersistentRedraw,
    runQueuedPersistentRedraw,
    cancelQueuedPersistentRedraw,
    invalidatePersistentSchedulerListenerContract,
    getPersistentSchedulerListenerStatus
  };
}

export function registerApprovedPersistentListeners(contract, ...args) {
  return contract.registerApprovedPersistentListeners(...args);
}

export function removeApprovedPersistentListeners(contract, ...args) {
  return contract.removeApprovedPersistentListeners(...args);
}

export function requestPersistentRedraw(contract, ...args) {
  return contract.requestPersistentRedraw(...args);
}

export function runQueuedPersistentRedraw(contract, ...args) {
  return contract.runQueuedPersistentRedraw(...args);
}

export function cancelQueuedPersistentRedraw(contract, ...args) {
  return contract.cancelQueuedPersistentRedraw(...args);
}

export function invalidatePersistentSchedulerListenerContract(contract, ...args) {
  return contract.invalidatePersistentSchedulerListenerContract(...args);
}

export function getPersistentSchedulerListenerStatus(contract, ...args) {
  return contract.getPersistentSchedulerListenerStatus(...args);
}
