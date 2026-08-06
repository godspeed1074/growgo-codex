const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_ANIMATION_FRAME_WRAPPER_STATUS_001";

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

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
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

function sanitizeIdentity(identity = {}) {
  return {
    schedulerOwnerId:
      identity?.schedulerOwnerId == null ? null : String(identity.schedulerOwnerId),
    cancellerOwnerId:
      identity?.cancellerOwnerId == null ? null : String(identity.cancellerOwnerId)
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    wrapperReady: state.wrapperReady,
    schedulerAvailable: state.schedulerAvailable,
    cancellerAvailable: state.cancellerAvailable,
    schedulerOwnerId: state.schedulerOwnerId,
    cancellerOwnerId: state.cancellerOwnerId,
    generationId: state.generationId,
    frameQueued: state.frameQueued,
    frameHandlePresent: state.frameHandlePresent,
    callbackExecuting: state.callbackExecuting,
    callbackExecuted: state.callbackExecuted,
    invalidated: state.invalidated,
    staleCallbackIgnoredCount: state.staleCallbackIgnoredCount,
    scheduleAttemptCount: state.scheduleAttemptCount,
    scheduleCompletedCount: state.scheduleCompletedCount,
    cancelAttemptCount: state.cancelAttemptCount,
    cancelCompletedCount: state.cancelCompletedCount,
    callbackAttemptCount: state.callbackAttemptCount,
    callbackCompletedCount: state.callbackCompletedCount,
    timerFallbackDetected: false,
    pollingDetected: false,
    windowAccessDetected: false,
    globalAccessDetected: false,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createPersistentAtlasAnimationFrameWrapper({
  requestAnimationFrameProvider = unavailable("FRAME_SCHEDULER_UNAVAILABLE"),
  cancelAnimationFrameProvider = unavailable("FRAME_CANCELLER_UNAVAILABLE"),
  generationProvider = unavailable("FRAME_WRAPPER_INVALIDATED"),
  identityProvider = unavailable("SCHEDULER_CANCELLER_MISMATCH")
} = {}) {
  const state = {
    wrapperReady: false,
    schedulerAvailable: isAvailableFunction(requestAnimationFrameProvider),
    cancellerAvailable: isAvailableFunction(cancelAnimationFrameProvider),
    schedulerOwnerId: null,
    cancellerOwnerId: null,
    generationId: null,
    frameQueued: false,
    frameHandlePresent: false,
    callbackExecuting: false,
    callbackExecuted: false,
    invalidated: false,
    staleCallbackIgnoredCount: 0,
    scheduleAttemptCount: 0,
    scheduleCompletedCount: 0,
    cancelAttemptCount: 0,
    cancelCompletedCount: 0,
    callbackAttemptCount: 0,
    callbackCompletedCount: 0,
    lastFailureReason: null
  };

  const internal = {
    activeHandle: null,
    callbackHasExecuted: false,
    localGenerationToken: 0,
    scheduledGenerationId: null,
    scheduledCallback: null
  };

  return Object.freeze({
    __growgoPersistentAtlasAnimationFrameWrapper: true,
    __state: state,
    __internal: internal,
    __requestAnimationFrameProvider: requestAnimationFrameProvider,
    __cancelAnimationFrameProvider: cancelAnimationFrameProvider,
    __generationProvider: generationProvider,
    __identityProvider: identityProvider
  });
}

function assertWrapper(wrapper) {
  const state = wrapper?.__state;
  if (!state) {
    throw Object.assign(new Error("FRAME_WRAPPER_INVALIDATED"), {
      reasonCode: "FRAME_WRAPPER_INVALIDATED"
    });
  }

  return state;
}

function readDependencies(wrapper) {
  const state = assertWrapper(wrapper);
  state.schedulerAvailable = isAvailableFunction(wrapper.__requestAnimationFrameProvider);
  state.cancellerAvailable = isAvailableFunction(wrapper.__cancelAnimationFrameProvider);
  const generationAvailable = isAvailableFunction(wrapper.__generationProvider);
  const identityAvailable = isAvailableFunction(wrapper.__identityProvider);
  state.wrapperReady =
    state.schedulerAvailable &&
    state.cancellerAvailable &&
    generationAvailable &&
    identityAvailable;

  if (!state.schedulerAvailable) {
    state.lastFailureReason = "FRAME_SCHEDULER_UNAVAILABLE";
    throw Object.assign(new Error("FRAME_SCHEDULER_UNAVAILABLE"), {
      reasonCode: "FRAME_SCHEDULER_UNAVAILABLE"
    });
  }

  if (!state.cancellerAvailable) {
    state.lastFailureReason = "FRAME_CANCELLER_UNAVAILABLE";
    throw Object.assign(new Error("FRAME_CANCELLER_UNAVAILABLE"), {
      reasonCode: "FRAME_CANCELLER_UNAVAILABLE"
    });
  }

  if (!generationAvailable || !identityAvailable) {
    state.lastFailureReason = "FRAME_WRAPPER_INVALIDATED";
    throw Object.assign(new Error("FRAME_WRAPPER_INVALIDATED"), {
      reasonCode: "FRAME_WRAPPER_INVALIDATED"
    });
  }

  const identity = sanitizeIdentity(wrapper.__identityProvider());
  state.schedulerOwnerId = identity.schedulerOwnerId;
  state.cancellerOwnerId = identity.cancellerOwnerId;

  if (
    !state.schedulerOwnerId ||
    !state.cancellerOwnerId ||
    state.schedulerOwnerId !== state.cancellerOwnerId
  ) {
    state.lastFailureReason = "SCHEDULER_CANCELLER_MISMATCH";
    throw Object.assign(new Error("SCHEDULER_CANCELLER_MISMATCH"), {
      reasonCode: "SCHEDULER_CANCELLER_MISMATCH"
    });
  }

  state.generationId = String(wrapper.__generationProvider());
  return state;
}

export function schedulePersistentAtlasFrame(wrapper, callback) {
  const state = readDependencies(wrapper);
  const internal = wrapper.__internal;
  state.scheduleAttemptCount += 1;

  if (state.invalidated) {
    state.lastFailureReason = "FRAME_WRAPPER_INVALIDATED";
    throw Object.assign(new Error("FRAME_WRAPPER_INVALIDATED"), {
      reasonCode: "FRAME_WRAPPER_INVALIDATED"
    });
  }

  if (typeof callback !== "function") {
    state.lastFailureReason = "INVALID_FRAME_CALLBACK";
    throw Object.assign(new Error("INVALID_FRAME_CALLBACK"), {
      reasonCode: "INVALID_FRAME_CALLBACK"
    });
  }

  if (state.frameQueued) {
    state.lastFailureReason = "FRAME_ALREADY_QUEUED";
    throw Object.assign(new Error("FRAME_ALREADY_QUEUED"), {
      reasonCode: "FRAME_ALREADY_QUEUED"
    });
  }

  if (state.callbackExecuting) {
    state.lastFailureReason = "FRAME_ALREADY_QUEUED";
    throw Object.assign(new Error("FRAME_ALREADY_QUEUED"), {
      reasonCode: "FRAME_ALREADY_QUEUED"
    });
  }

  internal.localGenerationToken += 1;
  const localToken = internal.localGenerationToken;
  const scheduledGenerationId = state.generationId;
  internal.callbackHasExecuted = false;
  internal.scheduledGenerationId = scheduledGenerationId;

  const wrappedCallback = () => {
    state.callbackAttemptCount += 1;

    if (state.invalidated) {
      state.staleCallbackIgnoredCount += 1;
      state.lastFailureReason = "STALE_FRAME_GENERATION";
      return;
    }

    const latestGenerationId = String(wrapper.__generationProvider());
    state.generationId = latestGenerationId;

    if (
      localToken !== internal.localGenerationToken ||
      scheduledGenerationId !== latestGenerationId
    ) {
      state.staleCallbackIgnoredCount += 1;
      state.lastFailureReason = "STALE_FRAME_GENERATION";
      state.frameQueued = false;
      state.frameHandlePresent = false;
      internal.activeHandle = null;
      return;
    }

    if (internal.callbackHasExecuted) {
      state.lastFailureReason = "FRAME_CALLBACK_ALREADY_EXECUTED";
      return;
    }

    if (state.callbackExecuting) {
      state.lastFailureReason = "FRAME_ALREADY_QUEUED";
      return;
    }

    state.frameQueued = false;
    state.frameHandlePresent = false;
    internal.activeHandle = null;
    state.callbackExecuting = true;

    try {
      callback({
        generationId: latestGenerationId
      });
      internal.callbackHasExecuted = true;
      state.callbackExecuted = true;
      state.callbackCompletedCount += 1;
      state.lastFailureReason = null;
    } finally {
      state.callbackExecuting = false;
    }
  };

  try {
    const handle = wrapper.__requestAnimationFrameProvider(wrappedCallback);
    internal.activeHandle = handle;
    internal.scheduledCallback = wrappedCallback;
    state.frameQueued = true;
    state.frameHandlePresent = true;
    state.scheduleCompletedCount += 1;
    state.lastFailureReason = null;
    return deepFreeze({
      generationId: state.generationId,
      schedulerOwnerId: state.schedulerOwnerId
    });
  } catch (error) {
    state.lastFailureReason = toReasonCode(error, "FRAME_SCHEDULE_FAILED");
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason
    });
  }
}

export function cancelPersistentAtlasFrame(wrapper) {
  const state = readDependencies(wrapper);
  const internal = wrapper.__internal;
  state.cancelAttemptCount += 1;

  if (!state.frameQueued || !state.frameHandlePresent) {
    state.lastFailureReason = null;
    return deepFreeze({
      cancelled: false,
      reasonCode: "FRAME_ALREADY_QUEUED"
    });
  }

  try {
    wrapper.__cancelAnimationFrameProvider(internal.activeHandle);
    internal.localGenerationToken += 1;
    internal.activeHandle = null;
    internal.scheduledCallback = null;
    state.frameQueued = false;
    state.frameHandlePresent = false;
    state.cancelCompletedCount += 1;
    state.lastFailureReason = null;
    return deepFreeze({
      cancelled: true,
      reasonCode: "FRAME_CANCELLED"
    });
  } catch (error) {
    state.lastFailureReason = toReasonCode(error, "FRAME_CANCEL_FAILED");
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason
    });
  }
}

export function invalidatePersistentAtlasFrameGeneration(wrapper) {
  const state = assertWrapper(wrapper);
  const internal = wrapper.__internal;
  readDependencies(wrapper);
  internal.localGenerationToken += 1;
  state.invalidated = true;
  state.frameQueued = false;
  state.frameHandlePresent = false;
  internal.activeHandle = null;
  internal.scheduledCallback = null;
  state.lastFailureReason = "FRAME_WRAPPER_INVALIDATED";
  return deepFreeze({
    invalidated: true,
    reasonCode: "FRAME_WRAPPER_INVALIDATED"
  });
}

export function getPersistentAtlasAnimationFrameStatus(wrapper) {
  const state = wrapper?.__state;

  if (!state) {
    return freezeStatus({
      wrapperReady: false,
      schedulerAvailable: false,
      cancellerAvailable: false,
      schedulerOwnerId: null,
      cancellerOwnerId: null,
      generationId: null,
      frameQueued: false,
      frameHandlePresent: false,
      callbackExecuting: false,
      callbackExecuted: false,
      invalidated: true,
      staleCallbackIgnoredCount: 0,
      scheduleAttemptCount: 0,
      scheduleCompletedCount: 0,
      cancelAttemptCount: 0,
      cancelCompletedCount: 0,
      callbackAttemptCount: 0,
      callbackCompletedCount: 0,
      lastFailureReason: "FRAME_WRAPPER_INVALIDATED"
    });
  }

  return freezeStatus(state);
}
