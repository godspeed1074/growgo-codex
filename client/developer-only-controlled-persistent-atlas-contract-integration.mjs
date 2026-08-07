import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  authorizePersistentAtlasSession,
  consumePersistentAttachPermission,
  createControlledPersistentAtlasAuthorization,
  getPersistentAtlasAuthorizationStatus,
  invalidatePersistentAtlasSession,
  revokePersistentAtlasSession,
  validatePersistentRedrawPermission
} from "./developer-only-controlled-persistent-atlas-authorization.mjs";
import {
  createControlledPersistentAtlasController,
  getPersistentAtlasControllerStatus
} from "./developer-only-controlled-persistent-atlas-controller.mjs";
import {
  createControlledPersistentAtlasLiveAdapter,
  createPersistentControllerDependencies,
  getPersistentLiveAdapterStatus
} from "./developer-only-controlled-persistent-atlas-live-adapter.mjs";
import {
  acquirePersistentSurface,
  createControlledPersistentAtlasRetainedSurfaceWrapper,
  getPersistentSurfaceWrapperStatus,
  releasePersistentSurface,
  reusePersistentSurface,
  validatePersistentSurface
} from "./developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs";
import {
  cancelQueuedPersistentRedraw,
  createControlledPersistentAtlasSchedulerListenerContract,
  getPersistentSchedulerListenerStatus,
  invalidatePersistentSchedulerListenerContract,
  registerApprovedPersistentListeners,
  removeApprovedPersistentListeners,
  requestPersistentRedraw
} from "./developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTRACT_INTEGRATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTRACT_INTEGRATION_RESULT_001";
const FIRST_DRAW_TRACE_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_FIRST_DRAW_TRACE_001";

const ATTACH_CONFIRMATION = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const DETACH_CONFIRMATION = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW_CONFIRMATION = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";
const ONE_FRAME_CONFIRMATION = "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME";

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

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
  return {
    mapIdentityId:
      identity?.mapIdentityId ?? identity?.mapIdentity ?? null,
    sessionId: identity?.sessionId ?? null,
    regionId: identity?.regionId ?? null,
    packageId: identity?.packageId ?? null,
    packageVersion: identity?.packageVersion ?? null,
    packageFingerprint: identity?.packageFingerprint ?? null,
    recipeId: identity?.recipeId ?? null,
    recipeVersion: identity?.recipeVersion ?? null,
    selectorSeed: identity?.selectorSeed ?? null
  };
}

function toAdapterIdentity(identity = {}) {
  const sanitized = sanitizeIdentity(identity);
  return {
    mapIdentity: sanitized.mapIdentityId,
    sessionId: sanitized.sessionId,
    regionId: sanitized.regionId,
    packageId: sanitized.packageId,
    packageVersion: sanitized.packageVersion,
    packageFingerprint: sanitized.packageFingerprint,
    recipeId: sanitized.recipeId,
    recipeVersion: sanitized.recipeVersion,
    selectorSeed: sanitized.selectorSeed
  };
}

function detectIdentityDrift(currentIdentity, boundIdentity) {
  if (!currentIdentity || !boundIdentity) {
    return null;
  }

  if (currentIdentity.mapIdentityId !== boundIdentity.mapIdentityId) {
    return "STALE_MAP_IDENTITY";
  }

  if (currentIdentity.sessionId !== boundIdentity.sessionId) {
    return "STALE_SESSION";
  }

  if (
    currentIdentity.regionId !== boundIdentity.regionId ||
    currentIdentity.packageId !== boundIdentity.packageId ||
    currentIdentity.packageVersion !== boundIdentity.packageVersion ||
    currentIdentity.packageFingerprint !== boundIdentity.packageFingerprint ||
    currentIdentity.recipeId !== boundIdentity.recipeId ||
    currentIdentity.recipeVersion !== boundIdentity.recipeVersion ||
    currentIdentity.selectorSeed !== boundIdentity.selectorSeed
  ) {
    return "STALE_REGION_PACKAGE_RECIPE_IDENTITY";
  }

  return null;
}

function sanitizeTraceStack(error) {
  if (typeof error?.stack !== "string" || !error.stack.trim()) {
    return null;
  }

  return error.stack
    .split("\n")
    .slice(0, 12)
    .map((line) => line.trim())
    .join("\n");
}

function createFirstDrawTraceState() {
  return {
    schemaId: FIRST_DRAW_TRACE_SCHEMA_ID,
    traceActive: false,
    traceCompleted: false,
    phase: "persistent_first_draw",
    step: null,
    stepAttemptCount: 0,
    stepCompletedCount: 0,
    timestamp: null,
    sessionId: null,
    mapIdentityId: null,
    snapshotId: null,
    snapshotGenerationId: null,
    lifecycleOwnerId: null,
    surfaceOwnerId: null,
    canvasIdentityId: null,
    redrawReason: null,
    thrownErrorName: null,
    thrownErrorMessage: null,
    thrownErrorStack: null,
    normalizedReasonCode: null,
    originatingFailureReason: null,
    cleanupStarted: false,
    cleanupCompleted: false,
    cleanupFailureReasons: []
  };
}

function cloneFirstDrawTrace(trace) {
  return {
    ...createFirstDrawTraceState(),
    ...trace,
    cleanupFailureReasons: [...(trace?.cleanupFailureReasons ?? [])],
    canonicalSafetyFlags: canonicalSafetyFlags()
  };
}

function cloneStatus(state) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    integrationState: state.integrationState,
    ready: state.ready,
    attached: state.attached,
    drawing: state.drawing,
    redrawQueued: state.redrawQueued,
    followUpPending: state.followUpPending,
    detaching: state.detaching,
    revoked: state.revoked,
    invalidated: state.invalidated,
    failedClosed: state.failedClosed,
    authorizationState: state.authorizationState,
    attachPermissionConsumed: state.attachPermissionConsumed,
    redrawPermissionAllowed: state.redrawPermissionAllowed,
    controllerState: state.controllerState,
    schedulerState: state.schedulerState,
    retainedSurfaceState: state.retainedSurfaceState,
    adapterReady: state.adapterReady,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    ownedListenerCount: state.ownedListenerCount,
    queuedFrameCount: state.queuedFrameCount,
    authorizationAttemptCount: state.authorizationAttemptCount,
    attachAttemptCount: state.attachAttemptCount,
    attachCompletedCount: state.attachCompletedCount,
    redrawRequestCount: state.redrawRequestCount,
    redrawCompletedCount: state.redrawCompletedCount,
    redrawCoalescedCount: state.redrawCoalescedCount,
    snapshotCompletedCount: state.snapshotCompletedCount,
    drawCompletedCount: state.drawCompletedCount,
    detachAttemptCount: state.detachAttemptCount,
    detachCompletedCount: state.detachCompletedCount,
    cleanupAttemptCount: state.cleanupAttemptCount,
    cleanupCompleted: state.cleanupCompleted,
    lastRequestedRedrawReason: state.lastRequestedRedrawReason,
    lastCompletedRedrawReason: state.lastCompletedRedrawReason,
    lastFailureReason: state.lastFailureReason,
    cleanupFailureReasons: [...state.cleanupFailureReasons],
    referencesReleased: state.referencesReleased,
    windowAccessDetected: false,
    documentAccessDetected: false,
    realMapAccessDetected: false,
    realCanvasAccessDetected: false,
    realListenerAccessDetected: false,
    realSchedulerAccessDetected: false,
    realRendererAccessDetected: false,
    canonicalSafetyFlags: canonicalSafetyFlags()
  };
}

function buildResult(operation, outcome, reasonCode, state, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    status: deepFreeze(cloneStatus(state)),
    ...extra
  });
}

export function createControlledPersistentAtlasContractIntegration({
  hostnameProvider = () => "127.0.0.1",
  rawMapProvider = { resolveRawMap() { throw Object.assign(new Error("RAW_MAP_PROVIDER_UNAVAILABLE"), { reasonCode: "RAW_MAP_PROVIDER_UNAVAILABLE" }); } },
  readinessProvider = { getPersistentAttachmentReadiness() { throw Object.assign(new Error("READINESS_PROVIDER_UNAVAILABLE"), { reasonCode: "READINESS_PROVIDER_UNAVAILABLE" }); } },
  identitySnapshotProvider = { getPersistentAttachmentIdentity() { throw Object.assign(new Error("IDENTITY_SNAPSHOT_PROVIDER_UNAVAILABLE"), { reasonCode: "IDENTITY_SNAPSHOT_PROVIDER_UNAVAILABLE" }); } },
  retainedSurfaceProvider = { preparePersistentSurface() { throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), { reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE" }); } },
  retainedLifecycleOwnerProvider = { createLifecycleOwner() { throw Object.assign(new Error("RETAINED_LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), { reasonCode: "RETAINED_LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE" }); } },
  frameSnapshotProvider = { createPersistentSnapshot() { throw Object.assign(new Error("FRAME_SNAPSHOT_PROVIDER_UNAVAILABLE"), { reasonCode: "FRAME_SNAPSHOT_PROVIDER_UNAVAILABLE" }); } },
  frameDrawProvider = { drawPersistentFrame() { throw Object.assign(new Error("FRAME_DRAW_PROVIDER_UNAVAILABLE"), { reasonCode: "FRAME_DRAW_PROVIDER_UNAVAILABLE" }); } },
  animationFrameScheduler = () => { throw Object.assign(new Error("ANIMATION_FRAME_SCHEDULER_UNAVAILABLE"), { reasonCode: "ANIMATION_FRAME_SCHEDULER_UNAVAILABLE" }); },
  animationFrameCanceller = () => { throw Object.assign(new Error("ANIMATION_FRAME_CANCELLER_UNAVAILABLE"), { reasonCode: "ANIMATION_FRAME_CANCELLER_UNAVAILABLE" }); },
  approvedListenerRegistrar = () => { throw Object.assign(new Error("APPROVED_LISTENER_REGISTRAR_UNAVAILABLE"), { reasonCode: "APPROVED_LISTENER_REGISTRAR_UNAVAILABLE" }); },
  approvedListenerRemover = () => { throw Object.assign(new Error("APPROVED_LISTENER_REMOVER_UNAVAILABLE"), { reasonCode: "APPROVED_LISTENER_REMOVER_UNAVAILABLE" }); },
  retainedCleanupProvider = { cleanupPersistentAttachment() { return { cleanupCompleted: true }; } },
  canvasRemovalProvider = () => {},
  paneRemovalProvider = () => {},
  referenceReleaseProvider = () => {},
  lifecycleOwnerReleaseProvider = () => {},
  lifecycleTranslationProvider = ({ identity }) => ({
    surfaceOwnerId: `SURFACE_OWNER_${identity?.sessionId ?? "UNKNOWN"}`,
    lifecycleOwnerId: "LIFECYCLE_OWNER_A"
  })
} = {}) {
  const internal = {
    attached: false,
    currentMap: null,
    currentIdentity: null,
    currentLifecycleOwnerId: null,
    currentLifecycleOwner: null,
    currentSurfaceSnapshot: null,
    integrationState: "inactive",
    attachInProgress: false,
    detachInProgress: false,
    cleanupStarted: false,
    firstDrawTrace: createFirstDrawTraceState(),
    shadowController: null,
    syncDepth: 0
  };

  const state = {
    integrationState: "inactive",
    ready: false,
    attached: false,
    drawing: false,
    redrawQueued: false,
    followUpPending: false,
    detaching: false,
    revoked: false,
    invalidated: false,
    failedClosed: false,
    authorizationState: "inactive",
    attachPermissionConsumed: false,
    redrawPermissionAllowed: false,
    controllerState: "detached",
    schedulerState: "inactive",
    retainedSurfaceState: "empty",
    adapterReady: false,
    sessionId: null,
    mapIdentityId: null,
    lifecycleOwnerId: null,
    regionId: null,
    packageId: null,
    packageVersion: null,
    packageFingerprint: null,
    recipeId: null,
    recipeVersion: null,
    selectorSeed: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    ownedListenerCount: 0,
    queuedFrameCount: 0,
    authorizationAttemptCount: 0,
    attachAttemptCount: 0,
    attachCompletedCount: 0,
    redrawRequestCount: 0,
    redrawCompletedCount: 0,
    redrawCoalescedCount: 0,
    snapshotCompletedCount: 0,
    drawCompletedCount: 0,
    detachAttemptCount: 0,
    detachCompletedCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    lastRequestedRedrawReason: null,
    lastCompletedRedrawReason: null,
    lastFailureReason: null,
    cleanupFailureReasons: [],
    referencesReleased: true
  };

  function resetControlledPersistentAtlasFirstDrawTrace(
    reasonCode = "MANUAL_RESET"
  ) {
    internal.firstDrawTrace = {
      ...createFirstDrawTraceState(),
      normalizedReasonCode: reasonCode
    };

    return getControlledPersistentAtlasFirstDrawTrace();
  }

  function updateControlledPersistentAtlasFirstDrawTrace(step, patch = {}) {
    const previous = internal.firstDrawTrace ?? createFirstDrawTraceState();
    const normalizedReasonCode =
      patch.normalizedReasonCode ??
      previous.normalizedReasonCode ??
      null;

    internal.firstDrawTrace = {
      ...previous,
      traceActive: true,
      phase: patch.phase ?? previous.phase ?? "persistent_first_draw",
      step,
      stepAttemptCount: previous.stepAttemptCount + 1,
      stepCompletedCount:
        patch.completed === false
          ? previous.stepCompletedCount
          : previous.stepCompletedCount + 1,
      timestamp: new Date("2026-08-06T00:00:00.000Z").toISOString(),
      sessionId:
        patch.sessionId ?? internal.currentIdentity?.sessionId ?? previous.sessionId,
      mapIdentityId:
        patch.mapIdentityId ??
        internal.currentIdentity?.mapIdentityId ??
        previous.mapIdentityId,
      snapshotId: patch.snapshotId ?? previous.snapshotId,
      snapshotGenerationId:
        patch.snapshotGenerationId ?? previous.snapshotGenerationId,
      lifecycleOwnerId:
        patch.lifecycleOwnerId ??
        internal.currentLifecycleOwnerId ??
        previous.lifecycleOwnerId,
      surfaceOwnerId: patch.surfaceOwnerId ?? previous.surfaceOwnerId,
      canvasIdentityId: patch.canvasIdentityId ?? previous.canvasIdentityId,
      redrawReason:
        patch.redrawReason ?? state.lastRequestedRedrawReason ?? previous.redrawReason,
      thrownErrorName: patch.thrownErrorName ?? previous.thrownErrorName,
      thrownErrorMessage:
        patch.thrownErrorMessage ?? previous.thrownErrorMessage,
      thrownErrorStack: patch.thrownErrorStack ?? previous.thrownErrorStack,
      normalizedReasonCode,
      originatingFailureReason:
        previous.originatingFailureReason ??
        patch.originatingFailureReason ??
        (patch.thrownErrorName ? normalizedReasonCode : null),
      cleanupStarted:
        patch.cleanupStarted ?? previous.cleanupStarted ?? false,
      cleanupCompleted:
        patch.cleanupCompleted ?? previous.cleanupCompleted ?? false,
      cleanupFailureReasons:
        patch.cleanupFailureReasons != null
          ? [...patch.cleanupFailureReasons]
          : [...(previous.cleanupFailureReasons ?? [])],
      traceCompleted: patch.traceCompleted ?? previous.traceCompleted ?? false
    };
  }

  function captureFirstDrawError(step, error, fallbackReason) {
    updateControlledPersistentAtlasFirstDrawTrace(step, {
      completed: false,
      thrownErrorName: error?.name ?? "Error",
      thrownErrorMessage: error?.message ?? String(error),
      thrownErrorStack: sanitizeTraceStack(error),
      normalizedReasonCode: toReasonCode(error, fallbackReason),
      originatingFailureReason: toReasonCode(error, fallbackReason)
    });
  }

  function getControlledPersistentAtlasFirstDrawTrace() {
    return deepFreeze(cloneFirstDrawTrace(internal.firstDrawTrace));
  }

  const authorization = createControlledPersistentAtlasAuthorization({
    hostnameProvider,
    identityProvider: () => ({ ...sanitizeIdentity(identitySnapshotProvider.getPersistentAttachmentIdentity({ map: internal.currentMap })) }),
    readinessProvider: (...args) => readinessProvider.getPersistentAttachmentReadiness(...args),
    controllerAttachmentStateProvider: () => ({ attached: internal.attached }),
    lifecycleOwnerStateProvider: () => ({
      matches:
        internal.currentLifecycleOwnerId == null ||
        getPersistentSurfaceWrapperStatus(wrapper).lifecycleOwnerId === internal.currentLifecycleOwnerId,
      reasonCode: "LIFECYCLE_OWNER_MISMATCH"
    }),
    createSessionId: () => sanitizeIdentity(identitySnapshotProvider.getPersistentAttachmentIdentity({ map: internal.currentMap })).sessionId,
    nowProvider: () => new Date("2026-08-06T00:00:00.000Z").toISOString()
  });

  const instrumentedFrameSnapshotProvider = {
    createPersistentSnapshot(args) {
      const snapshot = frameSnapshotProvider.createPersistentSnapshot(args);
      updateControlledPersistentAtlasFirstDrawTrace("snapshot_created", {
        snapshotId: snapshot?.snapshotId ?? null,
        snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
        redrawReason: args?.reason ?? null,
        completed: true
      });
      updateControlledPersistentAtlasFirstDrawTrace("snapshot_validated", {
        snapshotId: snapshot?.snapshotId ?? null,
        snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
        redrawReason: args?.reason ?? null,
        normalizedReasonCode: "SNAPSHOT_VALIDATED"
      });
      return snapshot;
    }
  };

  const instrumentedFrameDrawProvider = {
    drawPersistentFrame(args) {
      updateControlledPersistentAtlasFirstDrawTrace("draw_provider_entered", {
        snapshotId: args?.snapshot?.snapshotId ?? null,
        snapshotGenerationId: args?.snapshot?.snapshotGenerationId ?? null,
        redrawReason: args?.reason ?? args?.snapshot?.redrawReason ?? null
      });

      try {
        const result = frameDrawProvider.drawPersistentFrame(args);
        updateControlledPersistentAtlasFirstDrawTrace("draw_provider_completed", {
          snapshotId: args?.snapshot?.snapshotId ?? null,
          snapshotGenerationId: args?.snapshot?.snapshotGenerationId ?? null,
          redrawReason: args?.reason ?? args?.snapshot?.redrawReason ?? null,
          normalizedReasonCode:
            result?.reasonCode ?? "PERSISTENT_DRAW_PROVIDER_COMPLETED"
        });
        return result;
      } catch (error) {
        captureFirstDrawError("draw_provider_entered", error, "DRAW_PROVIDER_FAILED");
        throw error;
      }
    }
  };

  const adapter = createControlledPersistentAtlasLiveAdapter({
    rawMapProvider,
    readinessProvider,
    authorizationStatusProvider: {
      getPersistentAuthorizationStatus() {
        const authStatus = getPersistentAtlasAuthorizationStatus(authorization);
        return {
          localDevelopment: LOCAL_DEVELOPMENT_HOSTS.has(String(hostnameProvider()).trim()),
          sessionId: authStatus.sessionId,
          authorizedIdentity: toAdapterIdentity(authStatus.boundIdentity)
        };
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity(args) {
        return toAdapterIdentity(
          identitySnapshotProvider.getPersistentAttachmentIdentity(args)
        );
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness(args) {
        const readiness = readinessProvider.getPersistentAttachmentReadiness(args) ?? {};
        return {
          ...readiness,
          identity: toAdapterIdentity(readiness.identity)
        };
      }
    },
    retainedSurfaceProvider,
    retainedLifecycleOwnerProvider,
    frameSnapshotProvider: instrumentedFrameSnapshotProvider,
    frameDrawProvider: instrumentedFrameDrawProvider,
    animationFrameScheduler,
    animationFrameCanceller,
    approvedListenerRegistrar,
    approvedListenerRemover,
    retainedCleanupProvider
  });

  const wrapper = createControlledPersistentAtlasRetainedSurfaceWrapper({
    oneFrameSurfaceProvider({ operation, identity }) {
      if (operation === "acquire") {
        const surface = retainedSurfaceProvider.preparePersistentSurface({
          map: internal.currentMap,
          identity,
          lifecycleOwner: internal.currentLifecycleOwner
        });
        internal.currentSurfaceSnapshot = surface;
        return surface;
      }
      return internal.currentSurfaceSnapshot;
    },
    lifecycleOwnerProvider({ operation, identity }) {
      if (operation === "acquire") {
        const result = retainedLifecycleOwnerProvider.createLifecycleOwner({
          map: internal.currentMap,
          identity
        });
        internal.currentLifecycleOwner =
          result?.lifecycleOwner ?? result?.owner ?? result;
        return {
          lifecycleOwner: internal.currentLifecycleOwner,
          lifecycleOwnerId:
            result?.lifecycleOwnerId ??
            result?.ownerId ??
            internal.currentLifecycleOwner?.ownerId ??
            internal.currentLifecycleOwner?.id ??
            "LIFECYCLE_OWNER_A"
        };
      }
      if (operation === "validate") {
        return {
          matches: true
        };
      }
      lifecycleOwnerReleaseProvider({
        lifecycleOwner: internal.currentLifecycleOwner,
        lifecycleOwnerId: internal.currentLifecycleOwnerId
      });
      internal.currentLifecycleOwner = null;
      return { released: true };
    },
    lifecycleTranslationProvider({ identity }) {
      return lifecycleTranslationProvider({
        identity,
        lifecycleOwner: internal.currentLifecycleOwner
      });
    },
    paneRemovalProvider(payload) {
      paneRemovalProvider(payload);
    },
    canvasRemovalProvider(payload) {
      canvasRemovalProvider(payload);
    },
    listenerCleanupProvider() {
      return removeApprovedPersistentListeners(scheduler);
    },
    queuedFrameCancellationProvider() {
      return cancelQueuedPersistentRedraw(scheduler);
    },
    referenceReleaseProvider(payload) {
      updateControlledPersistentAtlasFirstDrawTrace("cleanup_handoff_started", {
        cleanupStarted: true
      });
      referenceReleaseProvider(payload);
      const cleanupResult = retainedCleanupProvider.cleanupPersistentAttachment(payload) ?? {};
      updateControlledPersistentAtlasFirstDrawTrace("cleanup_handoff_completed", {
        cleanupStarted: true,
        cleanupCompleted: cleanupResult.cleanupCompleted === true,
        cleanupFailureReasons: cleanupResult.cleanupFailureReasons ?? [],
        normalizedReasonCode:
          cleanupResult.reasonCode ??
          "CONTROLLED_PERSISTENT_ATLAS_CLEANUP_COMPLETED",
        traceCompleted: true
      });
      if (cleanupResult.cleanupCompleted === false) {
        throw Object.assign(new Error(cleanupResult.reasonCode ?? "REFERENCE_RELEASE_FAILED"), {
          reasonCode: cleanupResult.reasonCode ?? "REFERENCE_RELEASE_FAILED"
        });
      }
    },
    identityProvider() {
      return sanitizeIdentity(identitySnapshotProvider.getPersistentAttachmentIdentity({ map: internal.currentMap }));
    }
  });

  const scheduler = createControlledPersistentAtlasSchedulerListenerContract({
    frameScheduler(callback) {
      let runningSynchronously = true;
      let deferred = false;
      const handle = adapter.scheduleFrame(() => {
        if (runningSynchronously) {
          deferred = true;
          return;
        }
        callback();
      });
      runningSynchronously = false;
      if (deferred) {
        callback();
      }
      return handle;
    },
    frameCanceller(handle) {
      return adapter.cancelFrame(handle);
    },
    redrawPermissionProvider() {
      const result = validatePersistentRedrawPermission(authorization);
      return {
        allowed: result.outcome === "allowed",
        reasonCode: result.reasonCode
      };
    },
    listenerRegistrar(eventName, callback) {
      return adapter.__registerApprovedListener(eventName, callback);
    },
    listenerRemover(registration) {
      return adapter.removeApprovedListeners([registration]);
    },
    identityProvider() {
      return {
        schedulerOwnerId: "SCHEDULER_OWNER_A",
        listenerOwnerId: "LISTENER_OWNER_A",
        mapIdentityId: internal.currentIdentity?.mapIdentityId ?? state.mapIdentityId,
        sessionId: internal.currentIdentity?.sessionId ?? state.sessionId,
        lifecycleOwnerId: internal.currentLifecycleOwnerId ?? state.lifecycleOwnerId
      };
    },
    stepTraceRecorder(patch = {}) {
      updateControlledPersistentAtlasFirstDrawTrace(patch.step, patch);
    },
    drawExecutor({ reason }) {
      const validation = validatePersistentSurface(wrapper);
      if (validation.outcome !== "valid") {
        throw Object.assign(new Error(validation.reasonCode), {
          reasonCode: validation.reasonCode
        });
      }
      updateControlledPersistentAtlasFirstDrawTrace("surface_validated", {
        redrawReason: reason,
        lifecycleOwnerId:
          getPersistentSurfaceWrapperStatus(wrapper).lifecycleOwnerId ?? null,
        surfaceOwnerId:
          getPersistentSurfaceWrapperStatus(wrapper).surfaceOwnerId ?? null,
        canvasIdentityId:
          getPersistentSurfaceWrapperStatus(wrapper).canvasIdentityId ?? null
      });
      const reused = reusePersistentSurface(wrapper);
      if (reused.outcome !== "reused") {
        throw Object.assign(new Error(reused.reasonCode), {
          reasonCode: reused.reasonCode
        });
      }
      updateControlledPersistentAtlasFirstDrawTrace("lifecycle_validated", {
        redrawReason: reason,
        lifecycleOwnerId:
          getPersistentSurfaceWrapperStatus(wrapper).lifecycleOwnerId ?? null,
        surfaceOwnerId:
          getPersistentSurfaceWrapperStatus(wrapper).surfaceOwnerId ?? null,
        canvasIdentityId:
          getPersistentSurfaceWrapperStatus(wrapper).canvasIdentityId ?? null
      });
      const snapshot = adapter.createFrameSnapshot({
        map: internal.currentMap,
        identity: internal.currentIdentity,
        reason
      });
      state.snapshotCompletedCount += 1;
      adapter.drawFrame({
        map: internal.currentMap,
        identity: internal.currentIdentity,
        snapshot,
        reason
      });
      state.drawCompletedCount += 1;
      state.lastCompletedRedrawReason = reason;
    }
  });

  try {
    internal.shadowController = createControlledPersistentAtlasController(
      createPersistentControllerDependencies(adapter)
    );
  } catch {
    internal.shadowController = null;
  }

  function syncState() {
    if (internal.syncDepth > 4) {
      return;
    }
    internal.syncDepth += 1;
    const authStatus = getPersistentAtlasAuthorizationStatus(authorization);
    const schedulerStatus = getPersistentSchedulerListenerStatus(scheduler);
    const wrapperStatus = getPersistentSurfaceWrapperStatus(wrapper);
    const adapterStatus = getPersistentLiveAdapterStatus(adapter);
    const controllerStatus = internal.shadowController
      ? getPersistentAtlasControllerStatus(internal.shadowController)
      : null;

    state.authorizationState = authStatus.authorizationState;
    state.attached = internal.attached;
    state.attachPermissionConsumed = authStatus.attachPermissionConsumed;
    state.redrawPermissionAllowed = authStatus.redrawPermissionAllowed;
    state.schedulerState = schedulerStatus.state;
    state.retainedSurfaceState = wrapperStatus.state;
    state.adapterReady = adapterStatus.adapterReady;
    state.ownedCanvasCount = wrapperStatus.ownedCanvasCount;
    state.ownedPaneCount = wrapperStatus.ownedPaneCount;
    state.ownedListenerCount = schedulerStatus.ownedListenerCount;
    state.queuedFrameCount = schedulerStatus.frameQueued ? 1 : 0;
    state.drawing = schedulerStatus.drawing;
    state.redrawQueued = schedulerStatus.frameQueued;
    state.followUpPending = schedulerStatus.followUpRedrawPending;
    state.redrawCompletedCount = schedulerStatus.drawCompletedCount;
    state.redrawCoalescedCount = schedulerStatus.redrawCoalescedCount;
    state.cleanupFailureReasons = wrapperStatus.cleanupFailureReasons;
    state.referencesReleased = wrapperStatus.referencesReleased;
    state.detaching = internal.detachInProgress;
    state.lifecycleOwnerId = wrapperStatus.lifecycleOwnerId;
    state.cleanupCompleted = wrapperStatus.cleanupCompleted;
    state.redrawRequestCount = schedulerStatus.redrawRequestCount;
    state.controllerState =
      controllerStatus?.lifecycleState ??
      (internal.attached ? "attached" : "detached");

    state.revoked = authStatus.authorizationState === "revoked";
    state.invalidated =
      authStatus.authorizationState === "invalidated" || schedulerStatus.invalidated;
    state.failedClosed =
      schedulerStatus.failedClosed || wrapperStatus.failedClosed || adapterStatus.adapterReady !== true;

    if (internal.currentIdentity) {
      state.sessionId = internal.currentIdentity.sessionId;
      state.mapIdentityId = internal.currentIdentity.mapIdentityId;
      state.regionId = internal.currentIdentity.regionId;
      state.packageId = internal.currentIdentity.packageId;
      state.packageVersion = internal.currentIdentity.packageVersion;
      state.packageFingerprint = internal.currentIdentity.packageFingerprint;
      state.recipeId = internal.currentIdentity.recipeId;
      state.recipeVersion = internal.currentIdentity.recipeVersion;
      state.selectorSeed = internal.currentIdentity.selectorSeed;
    }

    state.ready =
      internal.attached &&
      schedulerStatus.state === "ready" &&
      wrapperStatus.state === "ready" &&
      authStatus.redrawPermissionAllowed === true;

    const invalidationReason =
      authStatus.invalidationReasonCode ??
      schedulerStatus.lastFailureReason ??
      authStatus.lastFailureReason ??
      state.lastFailureReason ??
      "AUTHORIZATION_INVALIDATED";

    if (
      (schedulerStatus.failedClosed || schedulerStatus.invalidated) &&
      internal.attached &&
      !internal.detachInProgress
    ) {
      if (
        schedulerStatus.lastFailureReason &&
        !internal.firstDrawTrace.originatingFailureReason
      ) {
        updateControlledPersistentAtlasFirstDrawTrace(
          internal.firstDrawTrace.step ?? "draw_provider_entered",
          {
            completed: false,
            normalizedReasonCode: schedulerStatus.lastFailureReason,
            originatingFailureReason: schedulerStatus.lastFailureReason
          }
        );
      }
      internal.detachInProgress = true;
      state.cleanupAttemptCount += 1;
      releasePersistentSurface(wrapper, {
        reasonCode: schedulerStatus.lastFailureReason ?? schedulerStatus.state
      });
      internal.attached = false;
      internal.detachInProgress = false;
      internal.currentMap = null;
      internal.currentIdentity = null;
      internal.currentLifecycleOwner = null;
      internal.currentLifecycleOwnerId = null;
      internal.currentSurfaceSnapshot = null;
      internal.syncDepth -= 1;
      syncState();
      return;
    }

    if (state.invalidated && internal.attached && !internal.detachInProgress) {
      performInvalidationCleanup(invalidationReason);
      internal.syncDepth -= 1;
      syncState();
      return;
    }

    if (state.invalidated) {
      state.lastFailureReason = invalidationReason;
    }

    if (state.failedClosed) {
      state.integrationState = "failed_closed";
    } else if (internal.detachInProgress) {
      state.integrationState = "detaching";
    } else if (state.invalidated) {
      state.integrationState = "invalidated";
    } else if (state.revoked) {
      state.integrationState = "revoked";
    } else if (schedulerStatus.drawing) {
      state.integrationState = "drawing";
    } else if (schedulerStatus.followUpRedrawPending) {
      state.integrationState = "follow_up_pending";
    } else if (schedulerStatus.frameQueued) {
      state.integrationState = "redraw_queued";
    } else if (internal.attachInProgress) {
      state.integrationState = "attaching";
    } else if (internal.attached) {
      state.integrationState = "attached_idle";
    } else if (authStatus.authorizationActive) {
      state.integrationState = "authorized";
    } else {
      state.integrationState = "inactive";
    }
    internal.syncDepth -= 1;
  }

  function failAndCleanup(reasonCode) {
    state.lastFailureReason = reasonCode;
    if (!internal.firstDrawTrace.originatingFailureReason) {
      updateControlledPersistentAtlasFirstDrawTrace(
        internal.firstDrawTrace.step ?? "draw_provider_entered",
        {
          completed: false,
          normalizedReasonCode: reasonCode,
          originatingFailureReason: reasonCode
        }
      );
    }
    if (internal.attached || getPersistentSurfaceWrapperStatus(wrapper).retained) {
      internal.detachInProgress = true;
      state.cleanupAttemptCount += 1;
      releasePersistentSurface(wrapper, { reasonCode });
      internal.attached = false;
      internal.detachInProgress = false;
    }
    internal.currentMap = null;
    internal.currentIdentity = null;
    internal.currentLifecycleOwner = null;
    internal.currentLifecycleOwnerId = null;
    internal.currentSurfaceSnapshot = null;
    syncState();
  }

  function performInvalidationCleanup(reasonCode) {
    state.lastFailureReason = reasonCode;
    if (internal.attached || getPersistentSurfaceWrapperStatus(wrapper).retained) {
      internal.detachInProgress = true;
      state.cleanupAttemptCount += 1;
      releasePersistentSurface(wrapper, { reasonCode });
      internal.attached = false;
      internal.detachInProgress = false;
    }
    internal.currentMap = null;
    internal.currentIdentity = null;
    internal.currentLifecycleOwner = null;
    internal.currentLifecycleOwnerId = null;
    internal.currentSurfaceSnapshot = null;
  }

  function authorizeIntegratedPersistentAtlas({ confirmation } = {}) {
    state.authorizationAttemptCount += 1;
    if (confirmation === ONE_FRAME_CONFIRMATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      syncState();
      return buildResult(
        "authorizeIntegratedPersistentAtlas",
        "blocked",
        "INVALID_CONFIRMATION",
        state
      );
    }
    const result = authorizePersistentAtlasSession(authorization, { confirmation });
    if (result.outcome !== "authorized") {
      state.lastFailureReason = result.reasonCode;
    }
    syncState();
    return buildResult(
      "authorizeIntegratedPersistentAtlas",
      result.outcome,
      result.reasonCode,
      state
    );
  }

  function attachIntegratedPersistentAtlas({ confirmation } = {}) {
    state.attachAttemptCount += 1;
    resetControlledPersistentAtlasFirstDrawTrace("ATTACH_SEQUENCE_STARTED");
    if (confirmation !== ATTACH_CONFIRMATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      syncState();
      return buildResult(
        "attachIntegratedPersistentAtlas",
        "blocked",
        "INVALID_CONFIRMATION",
        state
      );
    }
    if (internal.attached || internal.attachInProgress) {
      state.lastFailureReason = "DUPLICATE_ATTACH";
      syncState();
      return buildResult(
        "attachIntegratedPersistentAtlas",
        "blocked",
        "DUPLICATE_ATTACH",
        state
      );
    }
    internal.attachInProgress = true;
    const consumed = consumePersistentAttachPermission(authorization);
    if (consumed.outcome !== "consumed") {
      internal.attachInProgress = false;
      state.lastFailureReason = consumed.reasonCode;
      syncState();
      return buildResult(
        "attachIntegratedPersistentAtlas",
        "blocked",
        consumed.reasonCode,
        state
      );
    }
    try {
      const { map } = adapter.resolveMap();
      const authorizationStatus = adapter.resolveAuthorization();
      const identity = sanitizeIdentity(adapter.resolveIdentity({ map }));
      const readiness = adapter.resolveReadiness({ map });
      if (
        identity.sessionId !== authorizationStatus.sessionId ||
        identity.sessionId !== readiness.identity.sessionId
      ) {
        throw Object.assign(new Error("IDENTITY_MISMATCH"), { reasonCode: "IDENTITY_MISMATCH" });
      }
      internal.currentMap = map;
      internal.currentIdentity = identity;
      const acquired = acquirePersistentSurface(wrapper);
      if (acquired.outcome !== "acquired") {
        throw Object.assign(new Error(acquired.reasonCode), { reasonCode: acquired.reasonCode });
      }
      const validated = validatePersistentSurface(wrapper);
      if (validated.outcome !== "valid") {
        throw Object.assign(new Error(validated.reasonCode), { reasonCode: validated.reasonCode });
      }
      internal.currentLifecycleOwnerId =
        getPersistentSurfaceWrapperStatus(wrapper).lifecycleOwnerId;
      registerApprovedPersistentListeners(scheduler, {
        schedulerOwnerId: "SCHEDULER_OWNER_A",
        listenerOwnerId: "LISTENER_OWNER_A",
        mapIdentityId: identity.mapIdentityId,
        sessionId: identity.sessionId,
        lifecycleOwnerId: internal.currentLifecycleOwnerId
      });
      internal.attached = true;
      const initialRedraw = requestPersistentRedraw(scheduler, { reason: "initial_attach" });
      if (initialRedraw.outcome === "blocked" || initialRedraw.outcome === "failed_closed") {
        throw Object.assign(new Error(initialRedraw.reasonCode), {
          reasonCode: initialRedraw.reasonCode
        });
      }
      state.attachCompletedCount += 1;
      internal.attachInProgress = false;
      syncState();
      return buildResult(
        "attachIntegratedPersistentAtlas",
        "attached",
        "ATTACH_COMPLETED",
        state
      );
    } catch (error) {
      internal.attachInProgress = false;
      state.lastFailureReason = toReasonCode(error, "ATTACH_FAILED");
      failAndCleanup(state.lastFailureReason);
      return buildResult(
        "attachIntegratedPersistentAtlas",
        "failed_closed",
        state.lastFailureReason,
        state
      );
    }
  }

  function requestIntegratedPersistentAtlasRedraw({ confirmation, reason } = {}) {
    state.redrawRequestCount += 1;
    state.lastRequestedRedrawReason = reason ?? null;
    if (confirmation !== REDRAW_CONFIRMATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      syncState();
      return buildResult(
        "requestIntegratedPersistentAtlasRedraw",
        "blocked",
        "INVALID_CONFIRMATION",
        state
      );
    }
    if (!internal.attached) {
      state.lastFailureReason = "REDRAW_WHILE_DETACHED";
      syncState();
      return buildResult(
        "requestIntegratedPersistentAtlasRedraw",
        "blocked",
        "REDRAW_WHILE_DETACHED",
        state
      );
    }
    const driftReason = detectIdentityDrift(
      sanitizeIdentity(identitySnapshotProvider.getPersistentAttachmentIdentity({
        map: internal.currentMap
      })),
      internal.currentIdentity
    );
    if (driftReason) {
      invalidateIntegratedPersistentAtlas({ reasonCode: driftReason });
      syncState();
      return buildResult(
        "requestIntegratedPersistentAtlasRedraw",
        "blocked",
        driftReason,
        state
      );
    }
    const result = requestPersistentRedraw(scheduler, { reason });
    syncState();
    state.redrawCoalescedCount =
      getPersistentSchedulerListenerStatus(scheduler).redrawCoalescedCount;
    state.redrawCompletedCount =
      getPersistentSchedulerListenerStatus(scheduler).drawCompletedCount;
    state.snapshotCompletedCount = Math.max(
      state.snapshotCompletedCount,
      state.drawCompletedCount
    );
    if (result.outcome === "blocked" || result.outcome === "failed_closed") {
      state.lastFailureReason = result.reasonCode;
      if (result.reasonCode !== "REDRAW_WHILE_DETACHED") {
        failAndCleanup(result.reasonCode);
      }
    }
    syncState();
    return buildResult(
      "requestIntegratedPersistentAtlasRedraw",
      result.outcome,
      result.reasonCode,
      state
    );
  }

  function detachIntegratedPersistentAtlas({ confirmation } = {}) {
    state.detachAttemptCount += 1;
    if (confirmation !== DETACH_CONFIRMATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      syncState();
      return buildResult(
        "detachIntegratedPersistentAtlas",
        "blocked",
        "INVALID_CONFIRMATION",
        state
      );
    }
    internal.detachInProgress = true;
    state.cleanupAttemptCount += 1;
    const released = releasePersistentSurface(wrapper, { reasonCode: "DETACH_REQUESTED" });
    internal.attached = false;
    internal.currentMap = null;
    internal.currentIdentity = null;
    internal.currentLifecycleOwner = null;
    internal.currentLifecycleOwnerId = null;
    internal.currentSurfaceSnapshot = null;
    if (released.outcome === "released") {
      state.detachCompletedCount += 1;
    } else {
      state.lastFailureReason = released.reasonCode;
    }
    internal.detachInProgress = false;
    syncState();
    return buildResult(
      "detachIntegratedPersistentAtlas",
      released.outcome,
      released.reasonCode,
      state
    );
  }

  function revokeIntegratedPersistentAtlas() {
    const revoked = revokePersistentAtlasSession(authorization);
    performInvalidationCleanup("AUTHORIZATION_REVOKED");
    syncState();
    return buildResult(
      "revokeIntegratedPersistentAtlas",
      revoked.outcome,
      revoked.reasonCode,
      state
    );
  }

  function invalidateIntegratedPersistentAtlas({ reasonCode } = {}) {
    const invalidated = invalidatePersistentAtlasSession(authorization, { reasonCode });
    invalidatePersistentSchedulerListenerContract(scheduler, { reasonCode });
    performInvalidationCleanup(reasonCode ?? "AUTHORIZATION_INVALIDATED");
    syncState();
    return buildResult(
      "invalidateIntegratedPersistentAtlas",
      invalidated.outcome,
      invalidated.reasonCode,
      state
    );
  }

  function getIntegratedPersistentAtlasStatus() {
    syncState();
    return deepFreeze(cloneStatus(state));
  }

  function getIntegratedPersistentAtlasFirstDrawTrace() {
    syncState();
    return getControlledPersistentAtlasFirstDrawTrace();
  }

  syncState();

  return {
    authorizeIntegratedPersistentAtlas,
    attachIntegratedPersistentAtlas,
    requestIntegratedPersistentAtlasRedraw,
    detachIntegratedPersistentAtlas,
    revokeIntegratedPersistentAtlas,
    invalidateIntegratedPersistentAtlas,
    getIntegratedPersistentAtlasStatus,
    getIntegratedPersistentAtlasFirstDrawTrace,
    resetIntegratedPersistentAtlasFirstDrawTrace:
      resetControlledPersistentAtlasFirstDrawTrace
  };
}

export function authorizeIntegratedPersistentAtlas(integration, ...args) {
  return integration.authorizeIntegratedPersistentAtlas(...args);
}

export function attachIntegratedPersistentAtlas(integration, ...args) {
  return integration.attachIntegratedPersistentAtlas(...args);
}

export function requestIntegratedPersistentAtlasRedraw(integration, ...args) {
  return integration.requestIntegratedPersistentAtlasRedraw(...args);
}

export function detachIntegratedPersistentAtlas(integration, ...args) {
  return integration.detachIntegratedPersistentAtlas(...args);
}

export function revokeIntegratedPersistentAtlas(integration, ...args) {
  return integration.revokeIntegratedPersistentAtlas(...args);
}

export function invalidateIntegratedPersistentAtlas(integration, ...args) {
  return integration.invalidateIntegratedPersistentAtlas(...args);
}

export function getIntegratedPersistentAtlasStatus(integration, ...args) {
  return integration.getIntegratedPersistentAtlasStatus(...args);
}

export function getIntegratedPersistentAtlasFirstDrawTrace(integration, ...args) {
  return integration.getIntegratedPersistentAtlasFirstDrawTrace(...args);
}
