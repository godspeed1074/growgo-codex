const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_FAKE_RUNTIME_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_FAKE_RUNTIME_RESULT_001";
const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const IDENTITY_KEYS = [
  "mapIdentity",
  "regionId",
  "packageId",
  "packageVersion",
  "packageFingerprint",
  "recipeId",
  "recipeVersion",
  "selectorSeed",
  "sessionId"
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
  const sanitized = {};

  for (const key of IDENTITY_KEYS) {
    const value = identity?.[key];
    sanitized[key] = value == null ? null : String(value);
  }

  return sanitized;
}

function identitiesEqual(left, right) {
  const a = sanitizeIdentity(left);
  const b = sanitizeIdentity(right);

  return IDENTITY_KEYS.every((key) => a[key] === b[key]);
}

function buildDefaultIdentity(overrides = {}) {
  return sanitizeIdentity({
    mapIdentity: "FAKE_MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "FAKE_PACKAGE_FINGERPRINT_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "FAKE_SELECTOR_SEED_001",
    sessionId: null,
    ...overrides
  });
}

function cloneStatusData(state) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    lifecycleState: state.lifecycleState,
    attached: state.attached,
    authorizationActive: state.authorizationActive,
    authorizationConsumed: state.authorizationConsumed,
    sessionId: state.sessionId,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    ownedListenerCount: state.ownedListenerCount,
    redrawRequestedCount: state.redrawRequestedCount,
    redrawCompletedCount: state.redrawCompletedCount,
    redrawCoalescedCount: state.redrawCoalescedCount,
    animationFrameScheduleCount: state.animationFrameScheduleCount,
    snapshotAttemptCount: state.snapshotAttemptCount,
    snapshotCompletedCount: state.snapshotCompletedCount,
    drawAttemptCount: state.drawAttemptCount,
    drawCompletedCount: state.drawCompletedCount,
    attachAttemptCount: state.attachAttemptCount,
    attachCompletedCount: state.attachCompletedCount,
    detachAttemptCount: state.detachAttemptCount,
    detachCompletedCount: state.detachCompletedCount,
    cleanupAttemptCount: state.cleanupAttemptCount,
    cleanupCompleted: state.cleanupCompleted,
    cleanupFailed: state.cleanupFailed,
    cleanupFailureReasons: [...state.cleanupFailureReasons],
    referencesReleased: state.referencesReleased,
    lastDrawReason: state.lastDrawReason,
    lastFailureReason: state.lastFailureReason,
    boundIdentity: state.boundIdentity
      ? { ...sanitizeIdentity(state.boundIdentity) }
      : null,
    canonicalSafetyFlags: canonicalSafetyFlags()
  };
}

function freezeStatus(state) {
  return deepFreeze(cloneStatusData(state));
}

function buildResult({
  operation,
  outcome,
  reasonCode,
  state,
  transitionPath,
  extra = {}
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    transitionPath: [...transitionPath],
    status: freezeStatus(state),
    ...extra
  });
}

export function createControlledPersistentAtlasFakeRuntime({
  getCurrentIdentity = () => buildDefaultIdentity(),
  createSessionId = (() => {
    let counter = 0;
    return () => {
      counter += 1;
      return `PERSISTENT_ATLAS_FAKE_SESSION_${String(counter).padStart(3, "0")}`;
    };
  })(),
  createPane = () => ({ kind: "fake-pane" }),
  destroyPane = () => {},
  createCanvas = () => ({ kind: "fake-canvas" }),
  destroyCanvas = () => {},
  createLifecycleOwner = () => ({ kind: "fake-lifecycle-owner" }),
  releaseLifecycleOwner = () => {},
  registerListener = (event, handler) => ({ event, handler }),
  unregisterListener = () => {},
  scheduleAnimationFrame = (callback) => {
    callback();
    return { kind: "fake-animation-frame" };
  },
  cancelAnimationFrame = () => {},
  createSnapshot = ({ reason }) => ({ kind: "fake-snapshot", reason }),
  drawFrame = ({ reason }) => ({ kind: "fake-draw-result", reason })
} = {}) {
  const internal = {
    pane: null,
    canvas: null,
    lifecycleOwner: null,
    listeners: [],
    schedulerToken: null,
    queuedDrawReason: null,
    pendingFollowupReason: null,
    drawing: false,
    activeTransitionTrace: null
  };

  const state = {
    lifecycleState: "detached",
    attached: false,
    authorizationActive: false,
    authorizationConsumed: false,
    sessionId: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    ownedListenerCount: 0,
    redrawRequestedCount: 0,
    redrawCompletedCount: 0,
    redrawCoalescedCount: 0,
    animationFrameScheduleCount: 0,
    snapshotAttemptCount: 0,
    snapshotCompletedCount: 0,
    drawAttemptCount: 0,
    drawCompletedCount: 0,
    attachAttemptCount: 0,
    attachCompletedCount: 0,
    detachAttemptCount: 0,
    detachCompletedCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: true,
    lastDrawReason: null,
    lastFailureReason: null,
    boundIdentity: null,
    authorizedIdentity: null
  };

  function captureTransition(trace, nextState) {
    if (state.lifecycleState !== nextState) {
      state.lifecycleState = nextState;
      trace.push(nextState);
    }
  }

  function getStatusSnapshot() {
    return freezeStatus(state);
  }

  function clearOwnedCounts() {
    state.ownedCanvasCount = 0;
    state.ownedPaneCount = 0;
    state.ownedListenerCount = 0;
  }

  function resetInternalReferences() {
    internal.pane = null;
    internal.canvas = null;
    internal.lifecycleOwner = null;
    internal.listeners = [];
    internal.schedulerToken = null;
    internal.queuedDrawReason = null;
      internal.pendingFollowupReason = null;
      internal.drawing = false;
      internal.activeTransitionTrace = null;
      state.boundIdentity = null;
  }

  function cleanupOwnedResources(trace, reasonCode) {
    state.cleanupAttemptCount += 1;
    state.cleanupCompleted = false;
    state.cleanupFailed = false;
    state.cleanupFailureReasons = [];

    try {
      if (internal.schedulerToken) {
        cancelAnimationFrame(internal.schedulerToken);
        internal.schedulerToken = null;
      }

      for (const listener of [...internal.listeners]) {
        unregisterListener(listener);
      }

      internal.listeners = [];

      if (internal.canvas) {
        destroyCanvas(internal.canvas);
      }

      if (internal.pane) {
        destroyPane(internal.pane);
      }

      if (internal.lifecycleOwner) {
        releaseLifecycleOwner(internal.lifecycleOwner);
      }

      state.cleanupCompleted = true;
      state.referencesReleased = true;
      clearOwnedCounts();
      resetInternalReferences();
      state.attached = false;
      state.authorizationActive = false;
      state.authorizationConsumed = false;
      state.sessionId = null;
      state.authorizedIdentity = null;

      if (reasonCode === "NORMAL_DETACH") {
        captureTransition(trace, "detached");
      }

      return true;
    } catch (error) {
      state.cleanupFailed = true;
      state.cleanupCompleted = false;
      state.referencesReleased = false;
      state.cleanupFailureReasons = [toReasonCode(error, "CLEANUP_FAILED")];
      state.lastFailureReason = reasonCode;
      clearOwnedCounts();
      state.attached = false;
      state.authorizationActive = false;
      state.authorizationConsumed = false;
      state.sessionId = null;
      state.authorizedIdentity = null;
      state.boundIdentity = null;
      return false;
    }
  }

  function failClosed(operation, reasonCode, trace, extra = {}) {
    state.lastFailureReason = reasonCode;
    captureTransition(trace, "failed_closed");
    cleanupOwnedResources(trace, reasonCode);

    return buildResult({
      operation,
      outcome: "failed_closed",
      reasonCode,
      state,
      transitionPath: trace,
      extra
    });
  }

  function resolveCurrentIdentity(sessionId = null) {
    const raw = getCurrentIdentity();
    return buildDefaultIdentity({
      ...raw,
      sessionId: sessionId ?? raw?.sessionId ?? null
    });
  }

  function identityDriftDetected() {
    if (!state.boundIdentity) {
      return false;
    }

    const current = resolveCurrentIdentity(state.boundIdentity.sessionId);
    return !identitiesEqual(current, state.boundIdentity);
  }

  function queueRedraw(reason, trace) {
    state.redrawRequestedCount += 1;

    if (internal.drawing === true) {
      state.redrawCoalescedCount += 1;
      internal.pendingFollowupReason = reason;
      return {
        queued: false,
        coalesced: true
      };
    }

    if (internal.schedulerToken) {
      state.redrawCoalescedCount += 1;
      return {
        queued: false,
        coalesced: true
      };
    }

    internal.queuedDrawReason = reason;
    captureTransition(trace, "redraw_queued");
    state.animationFrameScheduleCount += 1;
    internal.activeTransitionTrace = trace;

    try {
      internal.schedulerToken = scheduleAnimationFrame(() => {
        runScheduledDraw(reason);
      });
    } catch (error) {
      throw Object.assign(error, {
        reasonCode: toReasonCode(error, "ANIMATION_FRAME_SCHEDULING_FAILED")
      });
    }

    return {
      queued: true,
      coalesced: false
    };
  }

  function runScheduledDraw(initialReason) {
    if (!state.attached || !state.boundIdentity) {
      internal.schedulerToken = null;
      internal.queuedDrawReason = null;
      internal.pendingFollowupReason = null;
      return;
    }

    const trace = internal.activeTransitionTrace ?? [state.lifecycleState];
    const reason = internal.queuedDrawReason ?? initialReason ?? "unknown";

    internal.schedulerToken = null;
    internal.queuedDrawReason = null;
    internal.activeTransitionTrace = null;

    if (identityDriftDetected()) {
      failClosed("requestPersistentAtlasRedraw", "IDENTITY_DRIFT_DETECTED", trace);
      return;
    }

    captureTransition(trace, "drawing");
    internal.drawing = true;

    try {
      state.snapshotAttemptCount += 1;
      const snapshot = createSnapshot({
        reason,
        identity: sanitizeIdentity(state.boundIdentity)
      });
      state.snapshotCompletedCount += 1;

      state.drawAttemptCount += 1;
      drawFrame({
        reason,
        snapshot,
        identity: sanitizeIdentity(state.boundIdentity)
      });
      state.drawCompletedCount += 1;
      state.redrawCompletedCount += 1;
      state.lastDrawReason = reason;
    } catch (error) {
      internal.drawing = false;
      failClosed(
        "requestPersistentAtlasRedraw",
        toReasonCode(error, "DRAW_FAILED"),
        trace
      );
      return;
    }

    internal.drawing = false;

    if (internal.pendingFollowupReason) {
      const followupReason = internal.pendingFollowupReason;
      internal.pendingFollowupReason = null;

      try {
        queueRedraw(followupReason, trace);
      } catch (error) {
        failClosed(
          "requestPersistentAtlasRedraw",
          toReasonCode(error, "ANIMATION_FRAME_SCHEDULING_FAILED"),
          trace
        );
      }

      return;
    }

    captureTransition(trace, "attached_idle");
  }

  function authorizePersistentSession() {
    const trace = [state.lifecycleState];

    if (state.authorizationActive && state.sessionId) {
      return buildResult({
        operation: "authorizePersistentSession",
        outcome: "already_authorized",
        reasonCode: "SESSION_ALREADY_AUTHORIZED",
        state,
        transitionPath: trace
      });
    }

    captureTransition(trace, "authorizing");

    const sessionId = createSessionId();
    const authorizedIdentity = resolveCurrentIdentity(sessionId);

    state.authorizationActive = true;
    state.authorizationConsumed = false;
    state.sessionId = sessionId;
    state.authorizedIdentity = authorizedIdentity;
    state.referencesReleased = true;
    captureTransition(trace, "detached");

    return buildResult({
      operation: "authorizePersistentSession",
      outcome: "authorized",
      reasonCode: "PERSISTENT_SESSION_AUTHORIZED",
      state,
      transitionPath: trace
    });
  }

  function attachPersistentAtlas() {
    const trace = [state.lifecycleState];
    state.attachAttemptCount += 1;

    if (state.attached) {
      return buildResult({
        operation: "attachPersistentAtlas",
        outcome: "blocked",
        reasonCode: "ALREADY_ATTACHED",
        state,
        transitionPath: trace
      });
    }

    if (
      !state.authorizationActive ||
      state.authorizationConsumed ||
      !state.sessionId ||
      !state.authorizedIdentity
    ) {
      return failClosed("attachPersistentAtlas", "STALE_OR_MISSING_SESSION", trace);
    }

    const currentIdentity = resolveCurrentIdentity(state.sessionId);
    if (!identitiesEqual(currentIdentity, state.authorizedIdentity)) {
      return failClosed("attachPersistentAtlas", "IDENTITY_DRIFT_DETECTED", trace);
    }

    captureTransition(trace, "attaching");

    try {
      internal.pane = createPane({
        identity: sanitizeIdentity(currentIdentity)
      });
      state.ownedPaneCount = 1;

      internal.canvas = createCanvas({
        identity: sanitizeIdentity(currentIdentity)
      });
      state.ownedCanvasCount = 1;

      internal.lifecycleOwner = createLifecycleOwner({
        identity: sanitizeIdentity(currentIdentity)
      });

      for (const eventName of APPROVED_EVENTS) {
        const listener = registerListener(eventName, () => {
          requestPersistentAtlasRedraw(eventName);
        });
        internal.listeners.push(listener);
      }

      state.ownedListenerCount = internal.listeners.length;
      state.boundIdentity = sanitizeIdentity(currentIdentity);
      state.attached = true;
      state.authorizationConsumed = true;
      state.authorizationActive = false;
      state.attachCompletedCount += 1;
      state.referencesReleased = false;

      queueRedraw("initial_attach", trace);
    } catch (error) {
      return failClosed(
        "attachPersistentAtlas",
        toReasonCode(error, "ATTACH_FAILED"),
        trace
      );
    }

    return buildResult({
      operation: "attachPersistentAtlas",
      outcome: "attached",
      reasonCode: "PERSISTENT_ATTACHMENT_ATTACHED",
      state,
      transitionPath: trace
    });
  }

  function requestPersistentAtlasRedraw(reason = "manual_redraw") {
    const trace = [state.lifecycleState];

    if (!state.attached || !state.boundIdentity) {
      return buildResult({
        operation: "requestPersistentAtlasRedraw",
        outcome: "blocked",
        reasonCode: "NOT_ATTACHED",
        state,
        transitionPath: trace
      });
    }

    if (identityDriftDetected()) {
      return failClosed(
        "requestPersistentAtlasRedraw",
        "IDENTITY_DRIFT_DETECTED",
        trace
      );
    }

    try {
      const queued = queueRedraw(reason, trace);

      return buildResult({
        operation: "requestPersistentAtlasRedraw",
        outcome: queued.coalesced ? "coalesced" : "queued",
        reasonCode: queued.coalesced
          ? "REDRAW_REQUEST_COALESCED"
          : "REDRAW_REQUEST_QUEUED",
        state,
        transitionPath: trace
      });
    } catch (error) {
      return failClosed(
        "requestPersistentAtlasRedraw",
        toReasonCode(error, "ANIMATION_FRAME_SCHEDULING_FAILED"),
        trace
      );
    }
  }

  function detachPersistentAtlas() {
    const trace = [state.lifecycleState];
    state.detachAttemptCount += 1;

    if (!state.attached && state.lifecycleState === "detached") {
      state.detachCompletedCount += 1;
      return buildResult({
        operation: "detachPersistentAtlas",
        outcome: "already_detached",
        reasonCode: "ALREADY_DETACHED",
        state,
        transitionPath: trace
      });
    }

    captureTransition(trace, "detaching");

    const cleaned = cleanupOwnedResources(trace, "NORMAL_DETACH");
    state.detachCompletedCount += 1;

    return buildResult({
      operation: "detachPersistentAtlas",
      outcome: cleaned ? "detached" : "failed_closed",
      reasonCode: cleaned ? "DETACHED" : "CLEANUP_FAILED",
      state,
      transitionPath: trace
    });
  }

  const api = {
    authorizePersistentSession,
    attachPersistentAtlas,
    requestPersistentAtlasRedraw,
    detachPersistentAtlas,
    getPersistentAtlasStatus: getStatusSnapshot
  };

  return deepFreeze({
    ...api
  });
}

export function authorizePersistentSession(runtime, ...args) {
  return runtime.authorizePersistentSession(...args);
}

export function attachPersistentAtlas(runtime, ...args) {
  return runtime.attachPersistentAtlas(...args);
}

export function requestPersistentAtlasRedraw(runtime, ...args) {
  return runtime.requestPersistentAtlasRedraw(...args);
}

export function detachPersistentAtlas(runtime, ...args) {
  return runtime.detachPersistentAtlas(...args);
}

export function getPersistentAtlasStatus(runtime, ...args) {
  return runtime.getPersistentAtlasStatus(...args);
}
