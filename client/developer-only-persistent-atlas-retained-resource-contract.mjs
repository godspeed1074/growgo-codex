const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_RETAINED_RESOURCE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_RETAINED_RESOURCE_RESULT_001";

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];

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
  return () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
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

function normalizeId(value, fallback = null) {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized || fallback;
}

function buildDefaultIds() {
  let surfaceCounter = 0;
  let lifecycleCounter = 0;

  return {
    nextSurfaceOwnerId() {
      surfaceCounter += 1;
      return `RETAINED_SURFACE_OWNER_${String(surfaceCounter).padStart(3, "0")}`;
    },
    nextLifecycleOwnerId() {
      lifecycleCounter += 1;
      return `RETAINED_LIFECYCLE_OWNER_${String(lifecycleCounter).padStart(3, "0")}`;
    }
  };
}

function defaultDependencies() {
  return {
    createPane: unavailable("CREATE_PANE_UNAVAILABLE"),
    createCanvas: unavailable("CREATE_CANVAS_UNAVAILABLE"),
    createLifecycleOwner: unavailable("CREATE_LIFECYCLE_OWNER_UNAVAILABLE"),
    registerListener: unavailable("REGISTER_LISTENER_UNAVAILABLE"),
    unregisterListener: unavailable("UNREGISTER_LISTENER_UNAVAILABLE"),
    scheduleFrame: unavailable("SCHEDULE_FRAME_UNAVAILABLE"),
    cancelFrame: unavailable("CANCEL_FRAME_UNAVAILABLE"),
    removeCanvas: unavailable("REMOVE_CANVAS_UNAVAILABLE"),
    removePane: unavailable("REMOVE_PANE_UNAVAILABLE"),
    releaseLifecycleOwner: unavailable("RELEASE_LIFECYCLE_OWNER_UNAVAILABLE")
  };
}

function cloneStatus(state) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    ready: state.ready,
    releaseInProgress: state.releaseInProgress,
    failedClosed: state.failedClosed,
    surfaceOwnerId: state.surfaceOwnerId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    mapIdentityId: state.mapIdentityId,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    ownedListenerCount: state.ownedListenerCount,
    queuedFrameCount: state.queuedFrameCount,
    moveendListenerRegistered: state.moveendListenerRegistered,
    zoomendListenerRegistered: state.zoomendListenerRegistered,
    resizeListenerRegistered: state.resizeListenerRegistered,
    surfaceAcquireAttemptCount: state.surfaceAcquireAttemptCount,
    surfaceAcquireCompletedCount: state.surfaceAcquireCompletedCount,
    listenerRegisterAttemptCount: state.listenerRegisterAttemptCount,
    listenerRegisterCompletedCount: state.listenerRegisterCompletedCount,
    redrawQueueAttemptCount: state.redrawQueueAttemptCount,
    redrawQueueCompletedCount: state.redrawQueueCompletedCount,
    redrawCoalescedCount: state.redrawCoalescedCount,
    frameCancelAttemptCount: state.frameCancelAttemptCount,
    frameCancelCompletedCount: state.frameCancelCompletedCount,
    cleanupAttemptCount: state.cleanupAttemptCount,
    cleanupCompleted: state.cleanupCompleted,
    cleanupFailed: state.cleanupFailed,
    cleanupFailureReasons: [...state.cleanupFailureReasons],
    referencesReleased: state.referencesReleased,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  };
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
    status: deepFreeze(cloneStatus(state)),
    ...extra
  });
}

export function createPersistentAtlasRetainedResourceContract(
  dependencies = {}
) {
  const deps = { ...defaultDependencies(), ...dependencies };
  const ids = buildDefaultIds();

  const internal = {
    pane: null,
    canvas: null,
    lifecycleOwner: null,
    drawReference: null,
    snapshotReference: null,
    listeners: {
      moveend: null,
      zoomend: null,
      resize: null
    },
    queuedFrameHandle: null,
    queuedFrameToken: 0,
    activeGeneration: 0,
    mutationBlocked: false
  };

  const state = {
    state: "empty",
    ready: false,
    releaseInProgress: false,
    failedClosed: false,
    surfaceOwnerId: null,
    lifecycleOwnerId: null,
    mapIdentityId: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    ownedListenerCount: 0,
    queuedFrameCount: 0,
    moveendListenerRegistered: false,
    zoomendListenerRegistered: false,
    resizeListenerRegistered: false,
    surfaceAcquireAttemptCount: 0,
    surfaceAcquireCompletedCount: 0,
    listenerRegisterAttemptCount: 0,
    listenerRegisterCompletedCount: 0,
    redrawQueueAttemptCount: 0,
    redrawQueueCompletedCount: 0,
    redrawCoalescedCount: 0,
    frameCancelAttemptCount: 0,
    frameCancelCompletedCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: true,
    lastFailureReason: null
  };

  function refreshFlags() {
    state.ready = state.state === "ready";
    state.releaseInProgress = state.state === "releasing";
    state.failedClosed = state.state === "failed_closed";
  }

  function setState(nextState, trace) {
    if (state.state !== nextState) {
      state.state = nextState;
      trace?.push(nextState);
      refreshFlags();
    }
  }

  function recalculateOwnedCounts() {
    state.ownedCanvasCount = internal.canvas ? 1 : 0;
    state.ownedPaneCount = internal.pane ? 1 : 0;
    state.ownedListenerCount = APPROVED_EVENTS.reduce(
      (count, eventName) => count + (internal.listeners[eventName] ? 1 : 0),
      0
    );
    state.queuedFrameCount = internal.queuedFrameHandle ? 1 : 0;
    state.moveendListenerRegistered = !!internal.listeners.moveend;
    state.zoomendListenerRegistered = !!internal.listeners.zoomend;
    state.resizeListenerRegistered = !!internal.listeners.resize;
    state.referencesReleased =
      !internal.drawReference && !internal.snapshotReference;
  }

  function getRetainedResourceStatus() {
    recalculateOwnedCounts();
    return deepFreeze(cloneStatus(state));
  }

  function canMutate() {
    return !state.failedClosed && !internal.mutationBlocked;
  }

  function resetReleaseFlags() {
    state.cleanupCompleted = false;
    state.cleanupFailed = false;
    state.cleanupFailureReasons = [];
  }

  function addCleanupFailure(reasonCode) {
    if (!state.cleanupFailureReasons.includes(reasonCode)) {
      state.cleanupFailureReasons.push(reasonCode);
    }
    state.cleanupFailed = true;
  }

  function finalizeCleanupState({
    trace,
    failureClosed = false
  }) {
    recalculateOwnedCounts();

    const unresolvedResourceCount =
      state.ownedCanvasCount +
      state.ownedPaneCount +
      state.ownedListenerCount +
      state.queuedFrameCount +
      (internal.lifecycleOwner ? 1 : 0);

    if (failureClosed || state.cleanupFailed || unresolvedResourceCount > 0) {
      setState("failed_closed", trace);
      internal.mutationBlocked = true;
      state.cleanupCompleted = false;
    } else {
      state.surfaceOwnerId = null;
      state.lifecycleOwnerId = null;
      state.mapIdentityId = null;
      state.lastFailureReason = null;
      setState("released", trace);
      internal.mutationBlocked = false;
      state.cleanupCompleted = true;
      state.cleanupFailed = false;
      state.cleanupFailureReasons = [];
    }
  }

  function releaseRetainedResources({
    reasonCode = "RELEASE_COMPLETED",
    failureClosed = false,
    operation = "releaseRetainedResources",
    trace = []
  } = {}) {
    state.cleanupAttemptCount += 1;
    resetReleaseFlags();
    internal.mutationBlocked = true;
    setState("releasing", trace);

    const cleanupSteps = [];

    const performStep = (stepName, fn) => {
      cleanupSteps.push(stepName);
      try {
        fn();
      } catch (error) {
        addCleanupFailure(toReasonCode(error, `${stepName}_FAILED`));
      }
      recalculateOwnedCounts();
    };

    performStep("block_new_redraw_requests", () => {});

    performStep("cancel_queued_frame", () => {
      if (!internal.queuedFrameHandle) {
        return;
      }
      state.frameCancelAttemptCount += 1;
      deps.cancelFrame(internal.queuedFrameHandle, {
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      state.frameCancelCompletedCount += 1;
      internal.queuedFrameHandle = null;
      internal.queuedFrameToken = 0;
    });

    for (const eventName of APPROVED_EVENTS) {
      performStep(`remove_${eventName}_listener`, () => {
        const registration = internal.listeners[eventName];
        if (!registration) {
          return;
        }
        deps.unregisterListener(eventName, registration, {
          surfaceOwnerId: state.surfaceOwnerId,
          lifecycleOwnerId: state.lifecycleOwnerId,
          mapIdentityId: state.mapIdentityId
        });
        internal.listeners[eventName] = null;
      });
    }

    performStep("release_draw_references", () => {
      internal.drawReference = null;
    });

    performStep("release_snapshot_references", () => {
      internal.snapshotReference = null;
    });

    performStep("remove_canvas", () => {
      if (!internal.canvas) {
        return;
      }
      deps.removeCanvas(internal.canvas, {
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      internal.canvas = null;
    });

    performStep("remove_owned_pane", () => {
      if (!internal.pane) {
        return;
      }
      deps.removePane(internal.pane, {
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      internal.pane = null;
    });

    performStep("release_lifecycle_owner", () => {
      if (!internal.lifecycleOwner) {
        return;
      }
      deps.releaseLifecycleOwner(internal.lifecycleOwner, {
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      internal.lifecycleOwner = null;
    });

    performStep("clear_map_and_identity_references", () => {
      if (state.cleanupFailed) {
        return;
      }
      state.surfaceOwnerId = null;
      state.lifecycleOwnerId = null;
      state.mapIdentityId = null;
    });

    performStep("return_detached", () => {
      if (!state.cleanupFailed) {
        state.lastFailureReason = null;
      }
    });

    finalizeCleanupState({ trace, failureClosed });

    const finalReasonCode = state.cleanupFailed
      ? state.cleanupFailureReasons[0] ?? reasonCode
      : reasonCode;

    return buildResult({
      operation,
      outcome:
        state.state === "released" ? "released" : failureClosed ? "failed_closed" : "blocked",
      reasonCode: finalReasonCode,
      state,
      transitionPath: trace,
      extra: {
        cleanupSteps,
        cleanupFailureReasons: [...state.cleanupFailureReasons]
      }
    });
  }

  function failClosed({
    operation,
    trace,
    reasonCode
  }) {
    state.lastFailureReason = reasonCode;
    return releaseRetainedResources({
      reasonCode,
      failureClosed: true,
      operation,
      trace
    });
  }

  function acquireRetainedSurface({
    surfaceOwnerId,
    lifecycleOwnerId,
    mapIdentityId
  } = {}) {
    const trace = [state.state];
    state.surfaceAcquireAttemptCount += 1;

    if (!canMutate()) {
      return buildResult({
        operation: "acquireRetainedSurface",
        outcome: "blocked",
        reasonCode: "FAILED_CLOSED",
        state,
        transitionPath: trace
      });
    }

    if (!["empty", "released"].includes(state.state)) {
      return buildResult({
        operation: "acquireRetainedSurface",
        outcome: "blocked",
        reasonCode: "SECOND_SURFACE_REQUEST_BLOCKED",
        state,
        transitionPath: trace
      });
    }

    const nextSurfaceOwnerId = normalizeId(
      surfaceOwnerId,
      ids.nextSurfaceOwnerId()
    );
    const nextLifecycleOwnerId = normalizeId(
      lifecycleOwnerId,
      ids.nextLifecycleOwnerId()
    );
    const nextMapIdentityId = normalizeId(mapIdentityId, "FAKE_MAP_001");

    state.surfaceOwnerId = nextSurfaceOwnerId;
    state.lifecycleOwnerId = nextLifecycleOwnerId;
    state.mapIdentityId = nextMapIdentityId;
    internal.activeGeneration += 1;
    internal.mutationBlocked = false;
    resetReleaseFlags();

    setState("acquiring_surface", trace);

    try {
      internal.pane = deps.createPane({
        surfaceOwnerId: nextSurfaceOwnerId,
        lifecycleOwnerId: nextLifecycleOwnerId,
        mapIdentityId: nextMapIdentityId
      });
      internal.canvas = deps.createCanvas({
        surfaceOwnerId: nextSurfaceOwnerId,
        lifecycleOwnerId: nextLifecycleOwnerId,
        mapIdentityId: nextMapIdentityId
      });
      internal.lifecycleOwner = deps.createLifecycleOwner({
        surfaceOwnerId: nextSurfaceOwnerId,
        lifecycleOwnerId: nextLifecycleOwnerId,
        mapIdentityId: nextMapIdentityId
      });
      internal.drawReference = {
        surfaceOwnerId: nextSurfaceOwnerId,
        lifecycleOwnerId: nextLifecycleOwnerId
      };
      internal.snapshotReference = {
        mapIdentityId: nextMapIdentityId
      };
      state.surfaceAcquireCompletedCount += 1;
      setState("surface_retained", trace);
      recalculateOwnedCounts();

      return buildResult({
        operation: "acquireRetainedSurface",
        outcome: "acquired",
        reasonCode: "RETAINED_SURFACE_ACQUIRED",
        state,
        transitionPath: trace
      });
    } catch (error) {
      return failClosed({
        operation: "acquireRetainedSurface",
        trace,
        reasonCode: toReasonCode(error, "RETAINED_SURFACE_ACQUIRE_FAILED")
      });
    }
  }

  function registerRetainedListeners() {
    const trace = [state.state];
    state.listenerRegisterAttemptCount += 1;

    if (!canMutate()) {
      return buildResult({
        operation: "registerRetainedListeners",
        outcome: "blocked",
        reasonCode: "FAILED_CLOSED",
        state,
        transitionPath: trace
      });
    }

    if (state.ownedListenerCount > 0) {
      return buildResult({
        operation: "registerRetainedListeners",
        outcome: "blocked",
        reasonCode: "DUPLICATE_LISTENER_REGISTRATION_BLOCKED",
        state,
        transitionPath: trace
      });
    }

    if (state.state !== "surface_retained") {
      return buildResult({
        operation: "registerRetainedListeners",
        outcome: "blocked",
        reasonCode: "SURFACE_NOT_RETAINED",
        state,
        transitionPath: trace
      });
    }

    setState("registering_listeners", trace);

    try {
      for (const eventName of APPROVED_EVENTS) {
        internal.listeners[eventName] = deps.registerListener(eventName, {
          eventName,
          surfaceOwnerId: state.surfaceOwnerId,
          lifecycleOwnerId: state.lifecycleOwnerId,
          mapIdentityId: state.mapIdentityId
        });
      }
      state.listenerRegisterCompletedCount += 1;
      setState("ready", trace);
      recalculateOwnedCounts();

      return buildResult({
        operation: "registerRetainedListeners",
        outcome: "registered",
        reasonCode: "RETAINED_LISTENERS_REGISTERED",
        state,
        transitionPath: trace
      });
    } catch (error) {
      return failClosed({
        operation: "registerRetainedListeners",
        trace,
        reasonCode: toReasonCode(error, "LISTENER_REGISTRATION_FAILED")
      });
    }
  }

  function queueRetainedRedraw({
    reason = "manual_request",
    mapIdentityId,
    lifecycleOwnerId
  } = {}) {
    const trace = [state.state];
    state.redrawQueueAttemptCount += 1;

    if (!canMutate()) {
      return buildResult({
        operation: "queueRetainedRedraw",
        outcome: "blocked",
        reasonCode: "FAILED_CLOSED",
        state,
        transitionPath: trace
      });
    }

    if (state.state !== "ready" && state.state !== "redraw_queued") {
      return buildResult({
        operation: "queueRetainedRedraw",
        outcome: "blocked",
        reasonCode: "RETAINED_RESOURCES_NOT_READY",
        state,
        transitionPath: trace
      });
    }

    const normalizedMapIdentityId = normalizeId(
      mapIdentityId,
      state.mapIdentityId
    );
    const normalizedLifecycleOwnerId = normalizeId(
      lifecycleOwnerId,
      state.lifecycleOwnerId
    );

    if (normalizedMapIdentityId !== state.mapIdentityId) {
      return failClosed({
        operation: "queueRetainedRedraw",
        trace,
        reasonCode: "STALE_MAP_IDENTITY"
      });
    }

    if (normalizedLifecycleOwnerId !== state.lifecycleOwnerId) {
      return failClosed({
        operation: "queueRetainedRedraw",
        trace,
        reasonCode: "STALE_LIFECYCLE_OWNER"
      });
    }

    if (internal.queuedFrameHandle) {
      state.redrawCoalescedCount += 1;
      recalculateOwnedCounts();
      return buildResult({
        operation: "queueRetainedRedraw",
        outcome: "coalesced",
        reasonCode: "REDRAW_ALREADY_QUEUED",
        state,
        transitionPath: trace
      });
    }

    try {
      const generation = internal.activeGeneration;
      const token = internal.queuedFrameToken + 1;
      internal.queuedFrameToken = token;
      setState("redraw_queued", trace);
      internal.queuedFrameHandle = deps.scheduleFrame(() => {
        const stillCurrent =
          generation === internal.activeGeneration &&
          token === internal.queuedFrameToken &&
          state.state !== "released" &&
          state.state !== "failed_closed" &&
          !state.releaseInProgress;

        if (!stillCurrent) {
          return;
        }

        internal.queuedFrameHandle = null;
        internal.queuedFrameToken = 0;
        state.redrawQueueCompletedCount += 1;
        setState("ready", []);
        recalculateOwnedCounts();
      }, {
        reason,
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      setState("redraw_queued", trace);
      recalculateOwnedCounts();

      return buildResult({
        operation: "queueRetainedRedraw",
        outcome: "queued",
        reasonCode: "RETAINED_REDRAW_QUEUED",
        state,
        transitionPath: trace
      });
    } catch (error) {
      return failClosed({
        operation: "queueRetainedRedraw",
        trace,
        reasonCode: toReasonCode(error, "REDRAW_SCHEDULER_FAILED")
      });
    }
  }

  function cancelQueuedRetainedRedraw() {
    const trace = [state.state];

    if (!canMutate()) {
      return buildResult({
        operation: "cancelQueuedRetainedRedraw",
        outcome: "blocked",
        reasonCode: "FAILED_CLOSED",
        state,
        transitionPath: trace
      });
    }

    if (!internal.queuedFrameHandle) {
      return buildResult({
        operation: "cancelQueuedRetainedRedraw",
        outcome: "idle",
        reasonCode: "NO_QUEUED_REDRAW",
        state,
        transitionPath: trace
      });
    }

    try {
      state.frameCancelAttemptCount += 1;
      deps.cancelFrame(internal.queuedFrameHandle, {
        surfaceOwnerId: state.surfaceOwnerId,
        lifecycleOwnerId: state.lifecycleOwnerId,
        mapIdentityId: state.mapIdentityId
      });
      state.frameCancelCompletedCount += 1;
      internal.queuedFrameHandle = null;
      internal.queuedFrameToken = 0;
      setState("ready", trace);
      recalculateOwnedCounts();

      return buildResult({
        operation: "cancelQueuedRetainedRedraw",
        outcome: "cancelled",
        reasonCode: "QUEUED_REDRAW_CANCELLED",
        state,
        transitionPath: trace
      });
    } catch (error) {
      return failClosed({
        operation: "cancelQueuedRetainedRedraw",
        trace,
        reasonCode: toReasonCode(error, "REDRAW_CANCEL_FAILED")
      });
    }
  }

  const contract = {
    acquireRetainedSurface,
    registerRetainedListeners,
    queueRetainedRedraw,
    cancelQueuedRetainedRedraw,
    releaseRetainedResources,
    getRetainedResourceStatus
  };

  refreshFlags();
  recalculateOwnedCounts();

  return contract;
}

export function acquireRetainedSurface(contract, ...args) {
  return contract.acquireRetainedSurface(...args);
}

export function registerRetainedListeners(contract, ...args) {
  return contract.registerRetainedListeners(...args);
}

export function queueRetainedRedraw(contract, ...args) {
  return contract.queueRetainedRedraw(...args);
}

export function cancelQueuedRetainedRedraw(contract, ...args) {
  return contract.cancelQueuedRetainedRedraw(...args);
}

export function releaseRetainedResources(contract, ...args) {
  return contract.releaseRetainedResources(...args);
}

export function getRetainedResourceStatus(contract, ...args) {
  return contract.getRetainedResourceStatus(...args);
}
