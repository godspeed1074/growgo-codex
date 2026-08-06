const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_CLEANUP_PROVIDER_STATUS_001";

const CLEANUP_MODES = new Set([
  "detach",
  "revoke",
  "invalidate",
  "attach_failure",
  "redraw_failure",
  "identity_drift",
  "readiness_drift",
  "startup_abort",
  "manual_cleanup"
]);

const CLEANUP_STEPS = [
  "redraw_block",
  "frame_cancel",
  "listener_remove",
  "draw_state_release",
  "snapshot_release",
  "canvas_release",
  "pane_release",
  "lifecycle_owner_release",
  "authorization_close",
  "map_identity_release",
  "session_identity_release",
  "reference_release",
  "completion_validation"
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

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function sanitizeIdentityBundle(bundle = {}) {
  return {
    cleanupOwnerId: sanitizeString(bundle.cleanupOwnerId),
    sessionId: sanitizeString(bundle.sessionId),
    mapIdentityId: sanitizeString(bundle.mapIdentityId),
    lifecycleOwnerId: sanitizeString(bundle.lifecycleOwnerId),
    lifecycleGenerationId: sanitizeString(bundle.lifecycleGenerationId),
    surfaceOwnerId: sanitizeString(bundle.surfaceOwnerId),
    schedulerOwnerId: sanitizeString(bundle.schedulerOwnerId),
    listenerOwnerId: sanitizeString(bundle.listenerOwnerId),
    authorizationSessionId: sanitizeString(bundle.authorizationSessionId),
    queuedFrameCount: Number(bundle.queuedFrameCount ?? 0),
    ownedListenerCount: Number(bundle.ownedListenerCount ?? 0),
    drawReferenceCount: Number(bundle.drawReferenceCount ?? 0),
    snapshotReferenceCount: Number(bundle.snapshotReferenceCount ?? 0),
    ownedCanvasCount: Number(bundle.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(bundle.ownedPaneCount ?? 0),
    ownedLifecycleOwnerCount: Number(bundle.ownedLifecycleOwnerCount ?? 0),
    mapReferenceCount: Number(bundle.mapReferenceCount ?? 0),
    sessionReferenceCount: Number(bundle.sessionReferenceCount ?? 0),
    referencesReleased: bundle.referencesReleased === true,
    authorizationClosed: bundle.authorizationClosed === true
  };
}

function identityComplete(identity) {
  return [
    "cleanupOwnerId",
    "sessionId",
    "mapIdentityId",
    "lifecycleOwnerId",
    "lifecycleGenerationId",
    "surfaceOwnerId",
    "schedulerOwnerId",
    "listenerOwnerId",
    "authorizationSessionId"
  ].every((key) => identity[key] != null && identity[key] !== "");
}

function initialStepCounts() {
  return {
    redrawBlockAttemptCount: 0,
    redrawBlockCompletedCount: 0,
    frameCancelAttemptCount: 0,
    frameCancelCompletedCount: 0,
    listenerRemovalAttemptCount: 0,
    listenerRemovalCompletedCount: 0,
    drawStateReleaseAttemptCount: 0,
    drawStateReleaseCompletedCount: 0,
    snapshotReleaseAttemptCount: 0,
    snapshotReleaseCompletedCount: 0,
    canvasReleaseAttemptCount: 0,
    canvasReleaseCompletedCount: 0,
    paneReleaseAttemptCount: 0,
    paneReleaseCompletedCount: 0,
    lifecycleOwnerReleaseAttemptCount: 0,
    lifecycleOwnerReleaseCompletedCount: 0,
    authorizationCloseAttemptCount: 0,
    authorizationCloseCompletedCount: 0,
    mapIdentityReleaseAttemptCount: 0,
    mapIdentityReleaseCompletedCount: 0,
    sessionIdentityReleaseAttemptCount: 0,
    sessionIdentityReleaseCompletedCount: 0,
    referenceReleaseAttemptCount: 0,
    referenceReleaseCompletedCount: 0
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    providerReady: state.providerReady,
    cleanupPrepared: state.cleanupPrepared,
    cleanupInProgress: state.cleanupInProgress,
    cleanupPartial: state.cleanupPartial,
    cleanupComplete: state.cleanupComplete,
    failedClosed: state.failedClosed,
    cleanupMode: state.cleanupMode,
    cleanupOwnerId: state.cleanupOwnerId,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    lifecycleGenerationId: state.lifecycleGenerationId,
    surfaceOwnerId: state.surfaceOwnerId,
    schedulerOwnerId: state.schedulerOwnerId,
    listenerOwnerId: state.listenerOwnerId,
    authorizationSessionId: state.authorizationSessionId,
    originatingFailureReason: state.originatingFailureReason,
    lastFailureReason: state.lastFailureReason,
    cleanupFailureReasons: [...state.cleanupFailureReasons],
    currentCleanupStep: state.currentCleanupStep,
    completedCleanupSteps: [...state.completedCleanupSteps],
    incompleteCleanupSteps: [...state.incompleteCleanupSteps],
    cleanupPrepareAttemptCount: state.cleanupPrepareAttemptCount,
    cleanupPrepareCompletedCount: state.cleanupPrepareCompletedCount,
    cleanupExecuteAttemptCount: state.cleanupExecuteAttemptCount,
    cleanupExecuteCompletedCount: state.cleanupExecuteCompletedCount,
    cleanupResumeAttemptCount: state.cleanupResumeAttemptCount,
    cleanupResumeCompletedCount: state.cleanupResumeCompletedCount,
    cleanupValidationAttemptCount: state.cleanupValidationAttemptCount,
    cleanupValidationCompletedCount: state.cleanupValidationCompletedCount,
    ...initialStepCounts(),
    ...state.stepCounts,
    queuedFrameCount: state.queuedFrameCount,
    ownedListenerCount: state.ownedListenerCount,
    drawReferenceCount: state.drawReferenceCount,
    snapshotReferenceCount: state.snapshotReferenceCount,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    ownedLifecycleOwnerCount: state.ownedLifecycleOwnerCount,
    mapReferenceCount: state.mapReferenceCount,
    sessionReferenceCount: state.sessionReferenceCount,
    referencesReleased: state.referencesReleased,
    zeroOwnershipVerified: state.zeroOwnershipVerified,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function setState(state, next) {
  state.state = next;
  state.cleanupPrepared = next !== "idle" && next !== "unavailable";
  state.cleanupInProgress = next === "cleanup_in_progress";
  state.cleanupPartial = next === "cleanup_partial";
  state.cleanupComplete = next === "cleanup_complete";
  state.failedClosed = next === "failed_closed";
}

function recordCounts(state, identity) {
  state.queuedFrameCount = identity.queuedFrameCount;
  state.ownedListenerCount = identity.ownedListenerCount;
  state.drawReferenceCount = identity.drawReferenceCount;
  state.snapshotReferenceCount = identity.snapshotReferenceCount;
  state.ownedCanvasCount = identity.ownedCanvasCount;
  state.ownedPaneCount = identity.ownedPaneCount;
  state.ownedLifecycleOwnerCount = identity.ownedLifecycleOwnerCount;
  state.mapReferenceCount = identity.mapReferenceCount;
  state.sessionReferenceCount = identity.sessionReferenceCount;
  state.referencesReleased = identity.referencesReleased;
}

function bindIdentity(state, identity) {
  state.cleanupOwnerId = identity.cleanupOwnerId;
  state.sessionId = identity.sessionId;
  state.mapIdentityId = identity.mapIdentityId;
  state.lifecycleOwnerId = identity.lifecycleOwnerId;
  state.lifecycleGenerationId = identity.lifecycleGenerationId;
  state.surfaceOwnerId = identity.surfaceOwnerId;
  state.schedulerOwnerId = identity.schedulerOwnerId;
  state.listenerOwnerId = identity.listenerOwnerId;
  state.authorizationSessionId = identity.authorizationSessionId;
  recordCounts(state, identity);
}

function mismatchReason(expected, current) {
  if (current.cleanupOwnerId !== expected.cleanupOwnerId) {
    return "CLEANUP_OWNER_MISMATCH";
  }
  if (current.sessionId !== expected.sessionId) {
    return "SESSION_IDENTITY_MISMATCH";
  }
  if (current.mapIdentityId !== expected.mapIdentityId) {
    return "MAP_IDENTITY_MISMATCH";
  }
  if (current.lifecycleOwnerId !== expected.lifecycleOwnerId) {
    return "LIFECYCLE_OWNER_MISMATCH";
  }
  if (current.surfaceOwnerId !== expected.surfaceOwnerId) {
    return "SURFACE_OWNER_MISMATCH";
  }
  if (current.schedulerOwnerId !== expected.schedulerOwnerId) {
    return "SCHEDULER_OWNER_MISMATCH";
  }
  if (current.listenerOwnerId !== expected.listenerOwnerId) {
    return "LISTENER_OWNER_MISMATCH";
  }
  return null;
}

function createPersistentAtlasCleanupProvider({
  redrawBlockProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  frameCancellationProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  listenerRemovalProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  drawStateReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  snapshotReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  retainedSurfaceReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  lifecycleOwnerReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  authorizationInvalidationProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  mapIdentityReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  sessionIdentityReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  referenceReleaseProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  cleanupIdentityProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE"),
  timeProvider = unavailable("CLEANUP_PROVIDER_UNAVAILABLE")
} = {}) {
  const state = {
    state: "idle",
    providerReady: false,
    cleanupPrepared: false,
    cleanupInProgress: false,
    cleanupPartial: false,
    cleanupComplete: false,
    failedClosed: false,
    cleanupMode: null,
    cleanupOwnerId: null,
    sessionId: null,
    mapIdentityId: null,
    lifecycleOwnerId: null,
    lifecycleGenerationId: null,
    surfaceOwnerId: null,
    schedulerOwnerId: null,
    listenerOwnerId: null,
    authorizationSessionId: null,
    originatingFailureReason: null,
    lastFailureReason: null,
    cleanupFailureReasons: [],
    currentCleanupStep: null,
    completedCleanupSteps: [],
    incompleteCleanupSteps: [...CLEANUP_STEPS],
    cleanupPrepareAttemptCount: 0,
    cleanupPrepareCompletedCount: 0,
    cleanupExecuteAttemptCount: 0,
    cleanupExecuteCompletedCount: 0,
    cleanupResumeAttemptCount: 0,
    cleanupResumeCompletedCount: 0,
    cleanupValidationAttemptCount: 0,
    cleanupValidationCompletedCount: 0,
    stepCounts: initialStepCounts(),
    queuedFrameCount: 0,
    ownedListenerCount: 0,
    drawReferenceCount: 0,
    snapshotReferenceCount: 0,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    ownedLifecycleOwnerCount: 0,
    mapReferenceCount: 0,
    sessionReferenceCount: 0,
    referencesReleased: false,
    zeroOwnershipVerified: false
  };

  const internal = {
    identity: null,
    inProgress: false,
    completed: Object.fromEntries(CLEANUP_STEPS.map((step) => [step, false]))
  };

  return Object.freeze({
    __growgoPersistentAtlasCleanupProvider: true,
    __state: state,
    __internal: internal,
    __deps: {
      redrawBlockProvider,
      frameCancellationProvider,
      listenerRemovalProvider,
      drawStateReleaseProvider,
      snapshotReleaseProvider,
      retainedSurfaceReleaseProvider,
      lifecycleOwnerReleaseProvider,
      authorizationInvalidationProvider,
      mapIdentityReleaseProvider,
      sessionIdentityReleaseProvider,
      referenceReleaseProvider,
      cleanupIdentityProvider,
      timeProvider
    }
  });
}

function readDeps(provider) {
  const deps = provider.__deps;
  const ok = Object.values(deps).every(isAvailableFunction);
  provider.__state.providerReady = ok;
  if (!ok) {
    throw Object.assign(new Error("CLEANUP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "CLEANUP_PROVIDER_UNAVAILABLE"
    });
  }
  return deps;
}

function refreshIdentity(provider, operation) {
  const deps = provider.__deps;
  const raw = deps.cleanupIdentityProvider({ operation });
  const identity = sanitizeIdentityBundle(raw);
  if (!identityComplete(identity)) {
    throw Object.assign(new Error("CLEANUP_IDENTITY_INCOMPLETE"), {
      reasonCode: "CLEANUP_IDENTITY_INCOMPLETE"
    });
  }
  return identity;
}

export function preparePersistentAtlasCleanup(
  provider,
  { cleanupMode, originatingFailureReason = null } = {}
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("CLEANUP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "CLEANUP_PROVIDER_UNAVAILABLE"
    });
  }

  state.cleanupPrepareAttemptCount += 1;
  readDeps(provider);

  if (!CLEANUP_MODES.has(cleanupMode)) {
    state.lastFailureReason = "INVALID_CLEANUP_MODE";
    throw Object.assign(new Error("INVALID_CLEANUP_MODE"), {
      reasonCode: "INVALID_CLEANUP_MODE"
    });
  }

  if (internal.inProgress) {
    state.lastFailureReason = "CLEANUP_ALREADY_IN_PROGRESS";
    throw Object.assign(new Error("CLEANUP_ALREADY_IN_PROGRESS"), {
      reasonCode: "CLEANUP_ALREADY_IN_PROGRESS"
    });
  }

  const identity = refreshIdentity(provider, "prepare");
  if (internal.identity) {
    const mismatch = mismatchReason(internal.identity, identity);
    if (mismatch) {
      state.lastFailureReason = mismatch;
      throw Object.assign(new Error(mismatch), { reasonCode: mismatch });
    }
  }

  internal.identity = identity;
  internal.inProgress = true;
  state.cleanupMode = cleanupMode;
  state.originatingFailureReason =
    sanitizeString(originatingFailureReason) ?? null;
  state.cleanupFailureReasons = [];
  state.lastFailureReason = null;
  bindIdentity(state, identity);
  setState(state, "preparing");
  state.cleanupPrepareCompletedCount += 1;
  return freezeStatus(state);
}

function stepMeta(step) {
  return {
    redraw_block: ["redrawBlockAttemptCount", "redrawBlockCompletedCount", "REDRAW_BLOCK_FAILED"],
    frame_cancel: ["frameCancelAttemptCount", "frameCancelCompletedCount", "FRAME_CANCELLATION_FAILED"],
    listener_remove: ["listenerRemovalAttemptCount", "listenerRemovalCompletedCount", "LISTENER_REMOVAL_FAILED"],
    draw_state_release: ["drawStateReleaseAttemptCount", "drawStateReleaseCompletedCount", "DRAW_STATE_RELEASE_FAILED"],
    snapshot_release: ["snapshotReleaseAttemptCount", "snapshotReleaseCompletedCount", "SNAPSHOT_RELEASE_FAILED"],
    canvas_release: ["canvasReleaseAttemptCount", "canvasReleaseCompletedCount", "CANVAS_RELEASE_FAILED"],
    pane_release: ["paneReleaseAttemptCount", "paneReleaseCompletedCount", "PANE_RELEASE_FAILED"],
    lifecycle_owner_release: ["lifecycleOwnerReleaseAttemptCount", "lifecycleOwnerReleaseCompletedCount", "LIFECYCLE_OWNER_RELEASE_FAILED"],
    authorization_close: ["authorizationCloseAttemptCount", "authorizationCloseCompletedCount", "AUTHORIZATION_CLOSE_FAILED"],
    map_identity_release: ["mapIdentityReleaseAttemptCount", "mapIdentityReleaseCompletedCount", "MAP_IDENTITY_RELEASE_FAILED"],
    session_identity_release: ["sessionIdentityReleaseAttemptCount", "sessionIdentityReleaseCompletedCount", "SESSION_IDENTITY_RELEASE_FAILED"],
    reference_release: ["referenceReleaseAttemptCount", "referenceReleaseCompletedCount", "REFERENCE_RELEASE_FAILED"],
    completion_validation: [null, null, "CLEANUP_INCOMPLETE"]
  }[step];
}

function performStep(provider, step) {
  const { __state: state, __internal: internal, __deps: deps } = provider;
  const [attemptKey, completedKey, fallbackReason] = stepMeta(step);
  state.currentCleanupStep = step;
  if (attemptKey) {
    state.stepCounts[attemptKey] += 1;
  }
  try {
    switch (step) {
      case "redraw_block":
        deps.redrawBlockProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "frame_cancel":
        deps.frameCancellationProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "listener_remove":
        deps.listenerRemovalProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "draw_state_release":
        deps.drawStateReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "snapshot_release":
        deps.snapshotReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "canvas_release":
        deps.retainedSurfaceReleaseProvider({ identity: internal.identity, target: "canvas", mode: state.cleanupMode });
        break;
      case "pane_release":
        deps.retainedSurfaceReleaseProvider({ identity: internal.identity, target: "pane", mode: state.cleanupMode });
        break;
      case "lifecycle_owner_release":
        deps.lifecycleOwnerReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "authorization_close":
        deps.authorizationInvalidationProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "map_identity_release":
        deps.mapIdentityReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "session_identity_release":
        deps.sessionIdentityReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "reference_release":
        deps.referenceReleaseProvider({ identity: internal.identity, mode: state.cleanupMode });
        break;
      case "completion_validation":
        validatePersistentAtlasCleanupCompletion(provider);
        break;
    }
    if (completedKey) {
      state.stepCounts[completedKey] += 1;
    }
    internal.completed[step] = true;
    if (!state.completedCleanupSteps.includes(step)) {
      state.completedCleanupSteps.push(step);
    }
    state.incompleteCleanupSteps = CLEANUP_STEPS.filter((name) => !internal.completed[name]);
  } catch (error) {
    const reason = toReasonCode(error, fallbackReason);
    if (!state.cleanupFailureReasons.includes(reason)) {
      state.cleanupFailureReasons.push(reason);
    }
    state.lastFailureReason = reason;
  } finally {
    try {
      const identity = refreshIdentity(provider, `after_${step}`);
      const mismatch = mismatchReason(internal.identity, identity);
      if (mismatch) {
        if (!state.cleanupFailureReasons.includes(mismatch)) {
          state.cleanupFailureReasons.push(mismatch);
        }
        state.lastFailureReason = mismatch;
      }
      bindIdentity(state, identity);
    } catch (error) {
      const reason = toReasonCode(error, "CLEANUP_IDENTITY_INCOMPLETE");
      if (!state.cleanupFailureReasons.includes(reason)) {
        state.cleanupFailureReasons.push(reason);
      }
      state.lastFailureReason = reason;
    }
  }
}

function runCleanup(provider, mode) {
  const state = provider.__state;
  const internal = provider.__internal;
  readDeps(provider);
  if (!internal.identity) {
    throw Object.assign(new Error("CLEANUP_IDENTITY_INCOMPLETE"), {
      reasonCode: "CLEANUP_IDENTITY_INCOMPLETE"
    });
  }
  state.cleanupMode = mode;
  setState(state, "cleanup_in_progress");
  for (const step of CLEANUP_STEPS) {
    if (internal.completed[step]) {
      continue;
    }
    performStep(provider, step);
  }
  const zeroOwnership =
    state.queuedFrameCount === 0 &&
    state.ownedListenerCount === 0 &&
    state.drawReferenceCount === 0 &&
    state.snapshotReferenceCount === 0 &&
    state.ownedCanvasCount === 0 &&
    state.ownedPaneCount === 0 &&
    state.ownedLifecycleOwnerCount === 0 &&
    state.mapReferenceCount === 0 &&
    state.sessionReferenceCount === 0 &&
    state.referencesReleased === true;
  state.zeroOwnershipVerified = zeroOwnership;
  if (!zeroOwnership && !state.cleanupFailureReasons.includes("CLEANUP_OWNERSHIP_REMAINS")) {
    state.cleanupFailureReasons.push("CLEANUP_OWNERSHIP_REMAINS");
  }
  const allStepsCompleted = CLEANUP_STEPS.every((name) => internal.completed[name]);
  if (!allStepsCompleted || !zeroOwnership) {
    state.incompleteCleanupSteps = CLEANUP_STEPS.filter((name) => !internal.completed[name]);
    if (!internal.completed.completion_validation && !state.incompleteCleanupSteps.includes("completion_validation")) {
      state.incompleteCleanupSteps.push("completion_validation");
    }
    setState(state, "cleanup_partial");
    return freezeStatus(state);
  }
  internal.inProgress = false;
  setState(state, "cleanup_complete");
  return freezeStatus(state);
}

export function executePersistentAtlasCleanup(provider) {
  const state = provider?.__state;
  if (!state) {
    throw Object.assign(new Error("CLEANUP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "CLEANUP_PROVIDER_UNAVAILABLE"
    });
  }
  state.cleanupExecuteAttemptCount += 1;
  const result = runCleanup(provider, state.cleanupMode);
  state.cleanupExecuteCompletedCount += 1;
  return result;
}

export function resumePersistentAtlasCleanup(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("CLEANUP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "CLEANUP_PROVIDER_UNAVAILABLE"
    });
  }
  state.cleanupResumeAttemptCount += 1;
  const identity = refreshIdentity(provider, "resume");
  const mismatch = internal.identity ? mismatchReason(internal.identity, identity) : null;
  if (mismatch) {
    state.lastFailureReason = mismatch;
    throw Object.assign(new Error(mismatch), { reasonCode: mismatch });
  }
  bindIdentity(state, identity);
  internal.inProgress = true;
  const result = runCleanup(provider, state.cleanupMode);
  state.cleanupResumeCompletedCount += 1;
  return result;
}

export function validatePersistentAtlasCleanupCompletion(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("CLEANUP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "CLEANUP_PROVIDER_UNAVAILABLE"
    });
  }
  state.cleanupValidationAttemptCount += 1;
  const identity = refreshIdentity(provider, "validate_completion");
  const mismatch = internal.identity ? mismatchReason(internal.identity, identity) : null;
  if (mismatch) {
    state.lastFailureReason = mismatch;
    throw Object.assign(new Error(mismatch), { reasonCode: mismatch });
  }
  bindIdentity(state, identity);
  const zeroOwnership =
    identity.queuedFrameCount === 0 &&
    identity.ownedListenerCount === 0 &&
    identity.drawReferenceCount === 0 &&
    identity.snapshotReferenceCount === 0 &&
    identity.ownedCanvasCount === 0 &&
    identity.ownedPaneCount === 0 &&
    identity.ownedLifecycleOwnerCount === 0 &&
    identity.mapReferenceCount === 0 &&
    identity.sessionReferenceCount === 0 &&
    identity.referencesReleased === true;
  if (!zeroOwnership) {
    state.zeroOwnershipVerified = false;
    state.lastFailureReason = "CLEANUP_OWNERSHIP_REMAINS";
    throw Object.assign(new Error("CLEANUP_OWNERSHIP_REMAINS"), {
      reasonCode: "CLEANUP_OWNERSHIP_REMAINS"
    });
  }
  state.zeroOwnershipVerified = true;
  state.cleanupValidationCompletedCount += 1;
  state.lastFailureReason = null;
  return freezeStatus(state);
}

export function getPersistentAtlasCleanupStatus(provider) {
  const state = provider?.__state;
  if (!state) {
    return freezeStatus({
      state: "unavailable",
      providerReady: false,
      cleanupPrepared: false,
      cleanupInProgress: false,
      cleanupPartial: false,
      cleanupComplete: false,
      failedClosed: true,
      cleanupMode: null,
      cleanupOwnerId: null,
      sessionId: null,
      mapIdentityId: null,
      lifecycleOwnerId: null,
      lifecycleGenerationId: null,
      surfaceOwnerId: null,
      schedulerOwnerId: null,
      listenerOwnerId: null,
      authorizationSessionId: null,
      originatingFailureReason: null,
      lastFailureReason: "CLEANUP_PROVIDER_UNAVAILABLE",
      cleanupFailureReasons: [],
      currentCleanupStep: null,
      completedCleanupSteps: [],
      incompleteCleanupSteps: [...CLEANUP_STEPS],
      cleanupPrepareAttemptCount: 0,
      cleanupPrepareCompletedCount: 0,
      cleanupExecuteAttemptCount: 0,
      cleanupExecuteCompletedCount: 0,
      cleanupResumeAttemptCount: 0,
      cleanupResumeCompletedCount: 0,
      cleanupValidationAttemptCount: 0,
      cleanupValidationCompletedCount: 0,
      stepCounts: initialStepCounts(),
      queuedFrameCount: 0,
      ownedListenerCount: 0,
      drawReferenceCount: 0,
      snapshotReferenceCount: 0,
      ownedCanvasCount: 0,
      ownedPaneCount: 0,
      ownedLifecycleOwnerCount: 0,
      mapReferenceCount: 0,
      sessionReferenceCount: 0,
      referencesReleased: false,
      zeroOwnershipVerified: false
    });
  }
  return freezeStatus(state);
}

export { createPersistentAtlasCleanupProvider };
