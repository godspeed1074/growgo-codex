const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTROLLER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTROLLER_RESULT_001";

const AUTHORIZE_CONFIRMATION =
  "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
const ATTACH_CONFIRMATION = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const DETACH_CONFIRMATION = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW_CONFIRMATION = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = ["move", "drag", "mousemove", "touchmove"];
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    lifecycleState: state.lifecycleState,
    attached: state.attached,
    authorizationActive: state.authorizationActive,
    authorizationConsumed: state.authorizationConsumed,
    authorizationInvalidated: state.authorizationInvalidated,
    sessionId: state.sessionId,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    ownedListenerCount: state.ownedListenerCount,
    lifecycleOwnerPresent: state.lifecycleOwnerPresent,
    animationFrameQueued: state.animationFrameQueued,
    drawing: state.drawing,
    followUpRedrawPending: state.followUpRedrawPending,
    redrawRequestedCount: state.redrawRequestedCount,
    redrawCompletedCount: state.redrawCompletedCount,
    redrawCoalescedCount: state.redrawCoalescedCount,
    animationFrameScheduleCount: state.animationFrameScheduleCount,
    animationFrameCancelCount: state.animationFrameCancelCount,
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
    boundIdentity: state.boundIdentity ? { ...sanitizeIdentity(state.boundIdentity) } : null,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult(operation, outcome, reasonCode, state, transitionPath, extra = {}) {
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

function createUnavailableDependencySet() {
  const unavailable = (reasonCode) => () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };

  return {
    mapProvider: { getMap: unavailable("MAP_PROVIDER_UNAVAILABLE") },
    readinessProvider: {
      getPersistentAttachmentReadiness: unavailable("READINESS_PROVIDER_UNAVAILABLE")
    },
    authorizationProvider: {
      isLocalDevelopment: () => false,
      createPersistentSession: unavailable("AUTHORIZATION_PROVIDER_UNAVAILABLE")
    },
    identityProvider: {
      getPersistentAttachmentIdentity: unavailable("IDENTITY_PROVIDER_UNAVAILABLE")
    },
    surfaceProvider: {
      preparePersistentSurface: unavailable("SURFACE_PROVIDER_UNAVAILABLE")
    },
    lifecycleOwnerProvider: {
      createLifecycleOwner: unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE")
    },
    snapshotProvider: {
      createPersistentSnapshot: unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE")
    },
    drawProvider: {
      drawPersistentFrame: unavailable("DRAW_PROVIDER_UNAVAILABLE")
    },
    animationFrameScheduler: {
      schedule: unavailable("ANIMATION_FRAME_SCHEDULER_UNAVAILABLE"),
      cancel: () => {}
    },
    listenerRegistrar: unavailable("LISTENER_REGISTRAR_UNAVAILABLE"),
    listenerRemover: () => {},
    cleanupProvider: {
      cleanupPersistentAttachment: () => ({ cleanupCompleted: true })
    }
  };
}

export function createControlledPersistentAtlasController(dependencies = {}) {
  const provided = createUnavailableDependencySet();
  const deps = {
    ...provided,
    ...dependencies,
    mapProvider: { ...provided.mapProvider, ...(dependencies.mapProvider ?? {}) },
    readinessProvider: {
      ...provided.readinessProvider,
      ...(dependencies.readinessProvider ?? {})
    },
    authorizationProvider: {
      ...provided.authorizationProvider,
      ...(dependencies.authorizationProvider ?? {})
    },
    identityProvider: {
      ...provided.identityProvider,
      ...(dependencies.identityProvider ?? {})
    },
    surfaceProvider: {
      ...provided.surfaceProvider,
      ...(dependencies.surfaceProvider ?? {})
    },
    lifecycleOwnerProvider: {
      ...provided.lifecycleOwnerProvider,
      ...(dependencies.lifecycleOwnerProvider ?? {})
    },
    snapshotProvider: {
      ...provided.snapshotProvider,
      ...(dependencies.snapshotProvider ?? {})
    },
    drawProvider: {
      ...provided.drawProvider,
      ...(dependencies.drawProvider ?? {})
    },
    animationFrameScheduler: {
      ...provided.animationFrameScheduler,
      ...(dependencies.animationFrameScheduler ?? {})
    },
    cleanupProvider: {
      ...provided.cleanupProvider,
      ...(dependencies.cleanupProvider ?? {})
    }
  };

  const internal = {
    session: null,
    map: null,
    identity: null,
    pane: null,
    canvas: null,
    listenerRegistrations: [],
    lifecycleOwner: null,
    queuedAnimationFrameHandle: null,
    pendingRedrawReason: null,
    queuedDrawReason: null,
    drawing: false,
    cleanupOwner: null,
    activeTransitionTrace: null
  };

  const state = {
    lifecycleState: "detached",
    attached: false,
    authorizationActive: false,
    authorizationConsumed: false,
    authorizationInvalidated: false,
    sessionId: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    ownedListenerCount: 0,
    lifecycleOwnerPresent: false,
    animationFrameQueued: false,
    drawing: false,
    followUpRedrawPending: false,
    redrawRequestedCount: 0,
    redrawCompletedCount: 0,
    redrawCoalescedCount: 0,
    animationFrameScheduleCount: 0,
    animationFrameCancelCount: 0,
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
    boundIdentity: null
  };

  function captureTransition(trace, nextState) {
    if (state.lifecycleState !== nextState) {
      state.lifecycleState = nextState;
      trace.push(nextState);
    }
  }

  function getStatus() {
    return freezeStatus(state);
  }

  function invalidateAuthorization(reasonCode) {
    state.authorizationActive = false;
    state.authorizationConsumed = false;
    state.authorizationInvalidated = true;
    state.sessionId = null;
    internal.session = null;
    state.lastFailureReason = reasonCode;
  }

  function clearOwnedCounts() {
    state.ownedCanvasCount = 0;
    state.ownedPaneCount = 0;
    state.ownedListenerCount = 0;
    state.lifecycleOwnerPresent = false;
    state.animationFrameQueued = false;
    state.drawing = false;
    state.followUpRedrawPending = false;
  }

  function clearInternal() {
    internal.session = null;
    internal.map = null;
    internal.identity = null;
    internal.pane = null;
    internal.canvas = null;
    internal.listenerRegistrations = [];
    internal.lifecycleOwner = null;
    internal.queuedAnimationFrameHandle = null;
    internal.pendingRedrawReason = null;
    internal.queuedDrawReason = null;
    internal.drawing = false;
    internal.cleanupOwner = null;
    internal.activeTransitionTrace = null;
    state.boundIdentity = null;
  }

  function currentIdentitySnapshot() {
    const map = deps.mapProvider.getMap();
    return sanitizeIdentity(
      deps.identityProvider.getPersistentAttachmentIdentity({ map })
    );
  }

  function identityDriftDetected() {
    if (!state.boundIdentity) {
      return false;
    }

    try {
      return !identitiesEqual(currentIdentitySnapshot(), state.boundIdentity);
    } catch {
      return true;
    }
  }

  function attemptCleanup(trace, reasonCode) {
    state.cleanupAttemptCount += 1;
    state.cleanupCompleted = false;
    state.cleanupFailed = false;
    state.cleanupFailureReasons = [];

    try {
      if (internal.queuedAnimationFrameHandle) {
        deps.animationFrameScheduler.cancel(internal.queuedAnimationFrameHandle);
        internal.queuedAnimationFrameHandle = null;
        state.animationFrameCancelCount += 1;
      }

      for (const registration of [...internal.listenerRegistrations]) {
        deps.listenerRemover(registration);
      }

      internal.listenerRegistrations = [];

      const cleanupResult =
        deps.cleanupProvider.cleanupPersistentAttachment({
          map: internal.map,
          identity: internal.identity,
          pane: internal.pane,
          canvas: internal.canvas,
          lifecycleOwner: internal.lifecycleOwner,
          cleanupOwner: internal.cleanupOwner,
          session: internal.session
        }) ?? {};

      if (cleanupResult.cleanupCompleted === false) {
        throw Object.assign(new Error("CLEANUP_FAILED"), {
          reasonCode: cleanupResult.reasonCode ?? "CLEANUP_FAILED"
        });
      }

      clearOwnedCounts();
      clearInternal();
      state.attached = false;
      if (reasonCode === "DETACHED") {
        state.authorizationActive = false;
        state.authorizationConsumed = false;
        state.authorizationInvalidated = false;
        state.sessionId = null;
      }
      state.cleanupCompleted = true;
      state.referencesReleased = true;
      if (reasonCode === "DETACHED") {
        captureTransition(trace, "detached");
      }
      return true;
    } catch (error) {
      clearOwnedCounts();
      clearInternal();
      state.attached = false;
      invalidateAuthorization(reasonCode);
      state.cleanupFailed = true;
      state.cleanupCompleted = false;
      state.referencesReleased = false;
      state.cleanupFailureReasons = [toReasonCode(error, "CLEANUP_FAILED")];
      return false;
    }
  }

  function failClosed(operation, reasonCode, trace, extra = {}) {
    state.lastFailureReason = reasonCode;
    captureTransition(trace, "failed_closed");
    attemptCleanup(trace, reasonCode);
    return buildResult(operation, "failed_closed", reasonCode, state, trace, extra);
  }

  function ensureMutable(operation, trace) {
    if (state.lifecycleState === "failed_closed") {
      return buildResult(operation, "blocked", "FAILED_CLOSED", state, trace);
    }

    return null;
  }

  function enqueueRedraw(reason, trace) {
    state.redrawRequestedCount += 1;

    if (internal.drawing) {
      state.redrawCoalescedCount += 1;
      internal.pendingRedrawReason = reason;
      state.followUpRedrawPending = true;
      return { outcome: "coalesced", reasonCode: "REDRAW_REQUEST_COALESCED" };
    }

    if (internal.queuedAnimationFrameHandle) {
      state.redrawCoalescedCount += 1;
      return { outcome: "coalesced", reasonCode: "REDRAW_REQUEST_COALESCED" };
    }

    internal.queuedDrawReason = reason;
    state.animationFrameQueued = true;
    captureTransition(trace, "redraw_queued");
    state.animationFrameScheduleCount += 1;
    internal.activeTransitionTrace = trace;

    internal.queuedAnimationFrameHandle = deps.animationFrameScheduler.schedule(() => {
      runQueuedFrame(reason);
    });

    return { outcome: "queued", reasonCode: "REDRAW_REQUEST_QUEUED" };
  }

  function runQueuedFrame(initialReason) {
    if (!state.attached || !state.boundIdentity) {
      internal.queuedAnimationFrameHandle = null;
      state.animationFrameQueued = false;
      return;
    }

    const trace = internal.activeTransitionTrace ?? [state.lifecycleState];
    internal.activeTransitionTrace = null;
    internal.queuedAnimationFrameHandle = null;
    state.animationFrameQueued = false;
    const reason = internal.queuedDrawReason ?? initialReason ?? "manual";
    internal.queuedDrawReason = null;

    if (identityDriftDetected()) {
      failClosed("requestPersistentAtlasRedraw", "IDENTITY_DRIFT_DETECTED", trace);
      return;
    }

    captureTransition(trace, "drawing");
    internal.drawing = true;
    state.drawing = true;

    try {
      state.snapshotAttemptCount += 1;
      const snapshot = deps.snapshotProvider.createPersistentSnapshot({
        map: internal.map,
        identity: { ...state.boundIdentity },
        reason
      });
      state.snapshotCompletedCount += 1;

      state.drawAttemptCount += 1;
      deps.drawProvider.drawPersistentFrame({
        map: internal.map,
        identity: { ...state.boundIdentity },
        pane: internal.pane,
        canvas: internal.canvas,
        lifecycleOwner: internal.lifecycleOwner,
        snapshot,
        reason
      });
      state.drawCompletedCount += 1;
      state.redrawCompletedCount += 1;
      state.lastDrawReason = reason;
    } catch (error) {
      internal.drawing = false;
      state.drawing = false;
      failClosed(
        "requestPersistentAtlasRedraw",
        toReasonCode(error, "DRAW_FAILED"),
        trace
      );
      return;
    }

    internal.drawing = false;
    state.drawing = false;

    if (internal.pendingRedrawReason) {
      const followupReason = internal.pendingRedrawReason;
      internal.pendingRedrawReason = null;
      state.followUpRedrawPending = false;
      try {
        enqueueRedraw(followupReason, trace);
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

  function authorizePersistentAtlasSession({ confirmation } = {}) {
    const trace = [state.lifecycleState];
    const blocked = ensureMutable("authorizePersistentAtlasSession", trace);
    if (blocked) {
      return blocked;
    }

    if (confirmation !== AUTHORIZE_CONFIRMATION) {
      return buildResult(
        "authorizePersistentAtlasSession",
        "blocked",
        "CONFIRMATION_REQUIRED",
        state,
        trace
      );
    }

    if (deps.authorizationProvider.isLocalDevelopment() !== true) {
      return buildResult(
        "authorizePersistentAtlasSession",
        "blocked",
        "LOCAL_DEVELOPMENT_ONLY",
        state,
        trace
      );
    }

    if (state.authorizationActive && state.sessionId) {
      return buildResult(
        "authorizePersistentAtlasSession",
        "already_authorized",
        "SESSION_ALREADY_AUTHORIZED",
        state,
        trace
      );
    }

    captureTransition(trace, "authorizing");

    try {
      const session = deps.authorizationProvider.createPersistentSession({
        confirmation
      });

      state.authorizationActive = true;
      state.authorizationConsumed = false;
      state.authorizationInvalidated = false;
      state.sessionId = String(session.sessionId);
      internal.session = session;
      captureTransition(trace, "detached");
      return buildResult(
        "authorizePersistentAtlasSession",
        "authorized",
        "PERSISTENT_SESSION_AUTHORIZED",
        state,
        trace
      );
    } catch (error) {
      return failClosed(
        "authorizePersistentAtlasSession",
        toReasonCode(error, "AUTHORIZATION_FAILED"),
        trace
      );
    }
  }

  function attachPersistentAtlas({ confirmation } = {}) {
    const trace = [state.lifecycleState];
    state.attachAttemptCount += 1;
    const blocked = ensureMutable("attachPersistentAtlas", trace);
    if (blocked) {
      return blocked;
    }

    if (confirmation !== ATTACH_CONFIRMATION) {
      return buildResult(
        "attachPersistentAtlas",
        "blocked",
        "CONFIRMATION_REQUIRED",
        state,
        trace
      );
    }

    if (state.attached) {
      return buildResult(
        "attachPersistentAtlas",
        "blocked",
        "ALREADY_ATTACHED",
        state,
        trace
      );
    }

    if (!state.authorizationActive || state.authorizationConsumed || !internal.session) {
      return buildResult(
        "attachPersistentAtlas",
        "blocked",
        "STALE_OR_MISSING_AUTHORIZATION",
        state,
        trace
      );
    }

    captureTransition(trace, "attaching");

    try {
      const map = deps.mapProvider.getMap();
      const readiness = deps.readinessProvider.getPersistentAttachmentReadiness({ map });
      if (readiness?.approved !== true) {
        throw Object.assign(new Error("READINESS_REJECTED"), {
          reasonCode: readiness?.reasonCode ?? "READINESS_REJECTED"
        });
      }

      const identity = sanitizeIdentity(
        deps.identityProvider.getPersistentAttachmentIdentity({ map })
      );
      const authorizedIdentity = sanitizeIdentity(
        internal.session.authorizedIdentity ?? { ...identity, sessionId: state.sessionId }
      );
      const readinessIdentity = sanitizeIdentity(
        readiness?.identity ?? { ...identity, sessionId: state.sessionId }
      );

      if (!identitiesEqual(identity, authorizedIdentity) || !identitiesEqual(identity, readinessIdentity)) {
        throw Object.assign(new Error("IDENTITY_MISMATCH"), {
          reasonCode: "IDENTITY_MISMATCH"
        });
      }

      internal.map = map;
      internal.identity = identity;
      state.boundIdentity = identity;

      internal.lifecycleOwner = deps.lifecycleOwnerProvider.createLifecycleOwner({
        map,
        identity
      });
      state.lifecycleOwnerPresent = true;

      const surface = deps.surfaceProvider.preparePersistentSurface({
        map,
        identity,
        lifecycleOwner: internal.lifecycleOwner
      });
      internal.pane = surface?.pane ?? null;
      internal.canvas = surface?.canvas ?? null;
      internal.cleanupOwner = surface?.cleanupOwner ?? internal.lifecycleOwner;

      state.ownedPaneCount = internal.pane ? 1 : 0;
      state.ownedCanvasCount = internal.canvas ? 1 : 0;

      for (const eventName of APPROVED_EVENTS) {
        if (FORBIDDEN_EVENTS.includes(eventName)) {
          throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
            reasonCode: "FORBIDDEN_LISTENER_EVENT"
          });
        }

        const registration = deps.listenerRegistrar(eventName, () => {
          requestPersistentAtlasRedraw({
            confirmation: REDRAW_CONFIRMATION,
            reason: eventName
          });
        });

        const registeredEventName =
          typeof registration?.eventName === "string" && registration.eventName
            ? registration.eventName
            : eventName;

        if (
          !APPROVED_EVENTS.includes(registeredEventName) ||
          FORBIDDEN_EVENTS.includes(registeredEventName)
        ) {
          throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
            reasonCode: "FORBIDDEN_LISTENER_EVENT"
          });
        }

        internal.listenerRegistrations.push(registration);
      }

      state.ownedListenerCount = internal.listenerRegistrations.length;
      state.attached = true;
      state.authorizationConsumed = true;
      state.authorizationActive = false;
      state.attachCompletedCount += 1;
      state.referencesReleased = false;

      const queueResult = enqueueRedraw("initial_attach", trace);

      return buildResult(
        "attachPersistentAtlas",
        "attached",
        "PERSISTENT_ATTACHMENT_ATTACHED",
        state,
        trace,
        { initialRedraw: queueResult.reasonCode }
      );
    } catch (error) {
      invalidateAuthorization(toReasonCode(error, "ATTACH_FAILED"));
      return failClosed(
        "attachPersistentAtlas",
        toReasonCode(error, "ATTACH_FAILED"),
        trace
      );
    }
  }

  function requestPersistentAtlasRedraw({ confirmation, reason = "manual_redraw" } = {}) {
    const trace = [state.lifecycleState];
    const blocked = ensureMutable("requestPersistentAtlasRedraw", trace);
    if (blocked) {
      return blocked;
    }

    if (confirmation !== REDRAW_CONFIRMATION) {
      return buildResult(
        "requestPersistentAtlasRedraw",
        "blocked",
        "CONFIRMATION_REQUIRED",
        state,
        trace
      );
    }

    if (!state.attached || !state.boundIdentity) {
      return buildResult(
        "requestPersistentAtlasRedraw",
        "blocked",
        "NOT_ATTACHED",
        state,
        trace
      );
    }

    if (identityDriftDetected()) {
      invalidateAuthorization("IDENTITY_DRIFT_DETECTED");
      return failClosed(
        "requestPersistentAtlasRedraw",
        "IDENTITY_DRIFT_DETECTED",
        trace
      );
    }

    try {
      const queued = enqueueRedraw(reason, trace);
      return buildResult(
        "requestPersistentAtlasRedraw",
        queued.outcome,
        queued.reasonCode,
        state,
        trace
      );
    } catch (error) {
      invalidateAuthorization(toReasonCode(error, "ANIMATION_FRAME_SCHEDULING_FAILED"));
      return failClosed(
        "requestPersistentAtlasRedraw",
        toReasonCode(error, "ANIMATION_FRAME_SCHEDULING_FAILED"),
        trace
      );
    }
  }

  function detachPersistentAtlas({ confirmation } = {}) {
    const trace = [state.lifecycleState];
    state.detachAttemptCount += 1;
    const blocked = ensureMutable("detachPersistentAtlas", trace);
    if (blocked) {
      return blocked;
    }

    if (confirmation !== DETACH_CONFIRMATION) {
      return buildResult(
        "detachPersistentAtlas",
        "blocked",
        "CONFIRMATION_REQUIRED",
        state,
        trace
      );
    }

    if (!state.attached && state.lifecycleState === "detached") {
      state.detachCompletedCount += 1;
      return buildResult(
        "detachPersistentAtlas",
        "already_detached",
        "ALREADY_DETACHED",
        state,
        trace
      );
    }

    captureTransition(trace, "detaching");
    const cleaned = attemptCleanup(trace, "DETACHED");
    state.detachCompletedCount += 1;
    return buildResult(
      "detachPersistentAtlas",
      cleaned ? "detached" : "failed_closed",
      cleaned ? "DETACHED" : "CLEANUP_FAILED",
      state,
      trace
    );
  }

  return deepFreeze({
    authorizePersistentAtlasSession,
    attachPersistentAtlas,
    requestPersistentAtlasRedraw,
    detachPersistentAtlas,
    getPersistentAtlasControllerStatus: getStatus
  });
}

export function authorizePersistentAtlasSession(controller, args) {
  return controller.authorizePersistentAtlasSession(args);
}

export function attachPersistentAtlas(controller, args) {
  return controller.attachPersistentAtlas(args);
}

export function requestPersistentAtlasRedraw(controller, args) {
  return controller.requestPersistentAtlasRedraw(args);
}

export function detachPersistentAtlas(controller, args) {
  return controller.detachPersistentAtlas(args);
}

export function getPersistentAtlasControllerStatus(controller) {
  return controller.getPersistentAtlasControllerStatus();
}
