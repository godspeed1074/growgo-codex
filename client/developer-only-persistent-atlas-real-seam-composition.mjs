import {
  createPersistentAtlasMapProvider,
  resolvePersistentAtlasMap,
  getPersistentAtlasMapProviderStatus
} from "./developer-only-persistent-atlas-map-provider.mjs";
import {
  createPersistentAtlasReadinessProvider,
  resolvePersistentAtlasReadiness,
  getPersistentAtlasReadinessStatus
} from "./developer-only-persistent-atlas-readiness-provider.mjs";
import {
  createPersistentAtlasIdentitySnapshotProvider,
  createPersistentAtlasIdentitySnapshot,
  comparePersistentAtlasIdentity,
  getPersistentAtlasIdentityProviderStatus
} from "./developer-only-persistent-atlas-identity-provider.mjs";
import {
  createPersistentAtlasAuthorizationProvider,
  resolvePersistentAtlasAuthorization,
  consumePersistentAtlasAttachPermission,
  validatePersistentAtlasRedrawAuthorization,
  getPersistentAtlasAuthorizationProviderStatus
} from "./developer-only-persistent-atlas-authorization-provider.mjs";
import {
  createPersistentAtlasAnimationFrameWrapper,
  schedulePersistentAtlasFrame,
  cancelPersistentAtlasFrame,
  getPersistentAtlasAnimationFrameStatus
} from "./developer-only-persistent-atlas-animation-frame-wrapper.mjs";
import {
  createPersistentAtlasListenerWrapper,
  registerPersistentAtlasListeners,
  removePersistentAtlasListeners,
  getPersistentAtlasListenerStatus
} from "./developer-only-persistent-atlas-listener-wrapper.mjs";
import {
  createPersistentAtlasRetainedSurfaceProvider,
  acquirePersistentAtlasRetainedSurface,
  validatePersistentAtlasRetainedSurface,
  reusePersistentAtlasRetainedSurface,
  releasePersistentAtlasRetainedSurface,
  getPersistentAtlasRetainedSurfaceStatus
} from "./developer-only-persistent-atlas-retained-surface-provider.mjs";
import {
  createPersistentAtlasLifecycleOwnerProvider,
  acquirePersistentAtlasLifecycleOwner,
  validatePersistentAtlasLifecycleOwner,
  reusePersistentAtlasLifecycleOwner,
  releasePersistentAtlasLifecycleOwner,
  getPersistentAtlasLifecycleOwnerStatus
} from "./developer-only-persistent-atlas-lifecycle-owner-provider.mjs";
import {
  createPersistentAtlasFrameSnapshotProvider,
  createPersistentAtlasFrameSnapshot,
  validatePersistentAtlasFrameSnapshot,
  releasePersistentAtlasFrameSnapshot,
  getPersistentAtlasFrameSnapshotStatus
} from "./developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createPersistentAtlasFrameDrawProvider,
  drawPersistentAtlasFrame,
  releasePersistentAtlasDrawState,
  getPersistentAtlasFrameDrawStatus
} from "./developer-only-persistent-atlas-frame-draw-provider.mjs";
import {
  createPersistentAtlasCleanupProvider,
  preparePersistentAtlasCleanup,
  executePersistentAtlasCleanup,
  resumePersistentAtlasCleanup,
  getPersistentAtlasCleanupStatus
} from "./developer-only-persistent-atlas-cleanup-provider.mjs";

const STATUS_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_REAL_SEAM_COMPOSITION_STATUS_001";
const EXPORTED_DEPENDENCY_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_REAL_SEAM_DEPENDENCIES_001";
const REQUIRED_ROOT_SEAMS = [
  "mapBridgeProvider",
  "readinessBridgeProvider",
  "persistentAuthorizationContract",
  "browserFrameScheduler",
  "browserFrameCanceller",
  "listenerRegistrar",
  "listenerRemover",
  "oneFrameSurfaceProvider",
  "lifecycleOwnerProvider",
  "lifecycleTranslationProvider",
  "oneFrameSnapshotProvider",
  "snapshotAwareDrawProvider",
  "surfaceRemovalProvider",
  "surfaceReferenceReleaseProvider",
  "lifecycleIdentityProvider",
  "lifecycleReleaseProvider",
  "lifecycleReferenceReleaseProvider",
  "snapshotReleaseProvider",
  "mutableDrawStateProvider",
  "canvasPositionAdapter",
  "drawStateReleaseProvider",
  "authorizationInvalidationProvider",
  "mapIdentityReleaseProvider",
  "sessionIdentityReleaseProvider",
  "referenceReleaseProvider",
  "timeProvider"
];

let compositionCounter = 0;

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
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text ? text : null;
}

function safeStatus(read, fallback = {}) {
  try {
    return read() ?? fallback;
  } catch {
    return fallback;
  }
}

function buildDefaultRoots() {
  return {
    mapBridgeProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    readinessBridgeProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    persistentAuthorizationContract: null,
    browserFrameScheduler: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    browserFrameCanceller: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    listenerRegistrar: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    listenerRemover: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    oneFrameSurfaceProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    lifecycleOwnerProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    lifecycleTranslationProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    oneFrameSnapshotProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    snapshotAwareDrawProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    surfaceIdentityProvider: (surface) => ({ surfaceOwnerId: surface?.surfaceOwnerId ?? null }),
    surfaceRemovalProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    surfaceReferenceReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    lifecycleIdentityProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    lifecycleReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    lifecycleReferenceReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    snapshotReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    mutableDrawStateProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    canvasPositionAdapter: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    drawStateReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    redrawBlockProvider: () => ({ blocked: true }),
    authorizationInvalidationProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    mapIdentityReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    sessionIdentityReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    referenceReleaseProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    timeProvider: unavailable("REAL_SEAM_COMPOSITION_UNAVAILABLE"),
    schedulerPairIdentityProvider: null,
    listenerPairIdentityProvider: null,
    cleanupIdentitySeedProvider: null
  };
}

function initialState(compositionId) {
  return {
    state: "unavailable",
    compositionId,
    compositionReady: false,
    compositionValid: false,
    dependenciesExported: false,
    released: false,
    failedClosed: false,
    mapWrapperReady: false,
    readinessWrapperReady: false,
    identityWrapperReady: false,
    authorizationWrapperReady: false,
    schedulerWrapperReady: false,
    listenerWrapperReady: false,
    surfaceWrapperReady: false,
    lifecycleWrapperReady: false,
    snapshotWrapperReady: false,
    drawWrapperReady: false,
    cleanupWrapperReady: false,
    sessionId: null,
    mapIdentityId: null,
    lifecycleOwnerId: null,
    surfaceOwnerId: null,
    schedulerOwnerId: null,
    listenerOwnerId: null,
    cleanupOwnerId: null,
    createAttemptCount: 1,
    createCompletedCount: 0,
    validationAttemptCount: 0,
    validationCompletedCount: 0,
    dependencyExportAttemptCount: 0,
    dependencyExportCompletedCount: 0,
    releaseAttemptCount: 0,
    releaseCompletedCount: 0,
    rootSeamUnavailableCount: 0,
    wrapperMismatchDetected: false,
    identityMismatchDetected: false,
    lastMismatchField: null,
    lastFailureReason: null,
    referencesReleased: true,
    windowAccessDetected: false,
    documentAccessDetected: false,
    globalAccessDetected: false,
    realMapResourceCreated: false,
    realCanvasResourceCreated: false,
    realListenerRegistered: false,
    realFrameScheduled: false,
    realRendererInvoked: false,
    wrapperInstanceCount: 0
  };
}

function createInternal(compositionId, roots) {
  return {
    roots,
    wrappers: null,
    exportedDependencies: null,
    mapResult: null,
    readinessSnapshot: null,
    identitySourceInput: null,
    identitySnapshot: null,
    authorizationSnapshot: null,
    currentSnapshot: null,
    currentSurfaceSummary: null,
    currentLifecycleSummary: null,
    currentDrawResult: null,
    redrawBlocked: false,
    schedulerGenerationId: `${compositionId}_GEN_001`,
    schedulerOwnerId: `${compositionId}_SCHEDULER_OWNER`,
    cancellerOwnerId: `${compositionId}_SCHEDULER_OWNER`,
    listenerOwnerId: `${compositionId}_LISTENER_OWNER`,
    cleanupOwnerId: `${compositionId}_CLEANUP_OWNER`,
    released: false
  };
}

function makeStatus(composition) {
  const state = composition?.__state ?? initialState("PERSISTENT_ATLAS_COMPOSITION_NONE");
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    compositionId: state.compositionId,
    compositionReady: state.compositionReady,
    compositionValid: state.compositionValid,
    dependenciesExported: state.dependenciesExported,
    released: state.released,
    failedClosed: state.failedClosed,
    mapWrapperReady: state.mapWrapperReady,
    readinessWrapperReady: state.readinessWrapperReady,
    identityWrapperReady: state.identityWrapperReady,
    authorizationWrapperReady: state.authorizationWrapperReady,
    schedulerWrapperReady: state.schedulerWrapperReady,
    listenerWrapperReady: state.listenerWrapperReady,
    surfaceWrapperReady: state.surfaceWrapperReady,
    lifecycleWrapperReady: state.lifecycleWrapperReady,
    snapshotWrapperReady: state.snapshotWrapperReady,
    drawWrapperReady: state.drawWrapperReady,
    cleanupWrapperReady: state.cleanupWrapperReady,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    surfaceOwnerId: state.surfaceOwnerId,
    schedulerOwnerId: state.schedulerOwnerId,
    listenerOwnerId: state.listenerOwnerId,
    cleanupOwnerId: state.cleanupOwnerId,
    createAttemptCount: state.createAttemptCount,
    createCompletedCount: state.createCompletedCount,
    validationAttemptCount: state.validationAttemptCount,
    validationCompletedCount: state.validationCompletedCount,
    dependencyExportAttemptCount: state.dependencyExportAttemptCount,
    dependencyExportCompletedCount: state.dependencyExportCompletedCount,
    releaseAttemptCount: state.releaseAttemptCount,
    releaseCompletedCount: state.releaseCompletedCount,
    rootSeamUnavailableCount: state.rootSeamUnavailableCount,
    wrapperMismatchDetected: state.wrapperMismatchDetected,
    identityMismatchDetected: state.identityMismatchDetected,
    lastMismatchField: state.lastMismatchField,
    lastFailureReason: state.lastFailureReason,
    referencesReleased: state.referencesReleased,
    windowAccessDetected: state.windowAccessDetected,
    documentAccessDetected: state.documentAccessDetected,
    globalAccessDetected: state.globalAccessDetected,
    realMapResourceCreated: state.realMapResourceCreated,
    realCanvasResourceCreated: state.realCanvasResourceCreated,
    realListenerRegistered: state.realListenerRegistered,
    realFrameScheduled: state.realFrameScheduled,
    realRendererInvoked: state.realRendererInvoked,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function mergeRoots(input = {}) {
  return { ...buildDefaultRoots(), ...input };
}

function assertComposition(composition) {
  if (!composition?.__internal || !composition?.__state) {
    throw Object.assign(new Error("REAL_SEAM_COMPOSITION_UNAVAILABLE"), {
      reasonCode: "REAL_SEAM_COMPOSITION_UNAVAILABLE"
    });
  }
}

function syncStatusFromWrappers(composition) {
  const state = composition.__state;
  const wrappers = composition.__internal.wrappers;
  if (!wrappers) {
    return;
  }
  const mapStatus = safeStatus(() => getPersistentAtlasMapProviderStatus(wrappers.map));
  const readinessStatus = safeStatus(() => getPersistentAtlasReadinessStatus(wrappers.readiness));
  const identityStatus = safeStatus(() => getPersistentAtlasIdentityProviderStatus(wrappers.identity));
  const authStatus = safeStatus(() => getPersistentAtlasAuthorizationProviderStatus(wrappers.authorization));
  const frameStatus = safeStatus(() => getPersistentAtlasAnimationFrameStatus(wrappers.scheduler));
  const listenerStatus = safeStatus(() => getPersistentAtlasListenerStatus(wrappers.listener));
  const surfaceStatus = safeStatus(() => getPersistentAtlasRetainedSurfaceStatus(wrappers.surface));
  const lifecycleStatus = safeStatus(() => getPersistentAtlasLifecycleOwnerStatus(wrappers.lifecycle));
  const snapshotStatus = safeStatus(() => getPersistentAtlasFrameSnapshotStatus(wrappers.snapshot));
  const drawStatus = safeStatus(() => getPersistentAtlasFrameDrawStatus(wrappers.draw));
  const cleanupStatus = safeStatus(() => getPersistentAtlasCleanupStatus(wrappers.cleanup));

  state.mapWrapperReady = mapStatus.providerReady === true;
  state.readinessWrapperReady = readinessStatus.providerReady === true;
  state.identityWrapperReady = identityStatus.providerReady === true || identityStatus.identityCreated === true;
  state.authorizationWrapperReady = authStatus.providerReady === true;
  state.schedulerWrapperReady = frameStatus.wrapperReady === true || frameStatus.schedulerAvailable === true;
  state.listenerWrapperReady = listenerStatus.wrapperReady === true || listenerStatus.lastFailureReason !== "LISTENER_WRAPPER_UNAVAILABLE";
  state.surfaceWrapperReady = surfaceStatus.providerReady === true || surfaceStatus.retained === true;
  state.lifecycleWrapperReady = lifecycleStatus.providerReady === true || lifecycleStatus.retained === true;
  state.snapshotWrapperReady = snapshotStatus.providerReady === true || snapshotStatus.snapshotPresent === true;
  state.drawWrapperReady = drawStatus.providerReady === true || drawStatus.drawAttemptCount >= 0;
  state.cleanupWrapperReady = cleanupStatus.providerReady === true || cleanupStatus.cleanupPrepareAttemptCount >= 0;
  state.lifecycleOwnerId = lifecycleStatus.lifecycleOwnerId ?? state.lifecycleOwnerId;
  state.surfaceOwnerId = surfaceStatus.surfaceOwnerId ?? state.surfaceOwnerId;
  state.sessionId = authStatus.sessionId ?? state.sessionId;
  state.mapIdentityId = mapStatus.mapIdentityId ?? state.mapIdentityId;
  state.schedulerOwnerId = frameStatus.schedulerOwnerId ?? state.schedulerOwnerId;
  state.listenerOwnerId = listenerStatus.listenerOwnerId ?? state.listenerOwnerId;
  state.cleanupOwnerId = cleanupStatus.cleanupOwnerId ?? state.cleanupOwnerId;
  state.realCanvasResourceCreated = surfaceStatus.ownedCanvasCount > 0;
  state.realListenerRegistered = listenerStatus.ownedListenerCount > 0;
  state.realFrameScheduled = frameStatus.scheduleCompletedCount > 0;
  state.realRendererInvoked = drawStatus.drawCompletedCount > 0 || drawStatus.drawAttemptCount > 0;
  state.referencesReleased = cleanupStatus.referencesReleased ?? state.referencesReleased;
}

function failClosed(composition, reasonCode, mismatchField = null) {
  const state = composition.__state;
  state.failedClosed = true;
  state.compositionValid = false;
  state.compositionReady = false;
  state.lastFailureReason = reasonCode;
  state.lastMismatchField = mismatchField;
  state.identityMismatchDetected = mismatchField != null;
  state.state = "invalid";
  syncStatusFromWrappers(composition);
  throw Object.assign(new Error(reasonCode), { reasonCode, mismatchField });
}

function compareField(composition, field, leftValue, rightValue, reasonCode) {
  if (
    sanitizeString(leftValue) != null &&
    sanitizeString(rightValue) != null &&
    sanitizeString(leftValue) !== sanitizeString(rightValue)
  ) {
    composition.__state.identityMismatchDetected = true;
    failClosed(composition, reasonCode, field);
  }
}

function validateRootSeams(roots) {
  const problems = [];
  for (const name of REQUIRED_ROOT_SEAMS) {
    const value = roots[name];
    if (name === "persistentAuthorizationContract") {
      const ok =
        value &&
        typeof value.getPersistentAtlasAuthorizationStatus === "function" &&
        typeof value.consumePersistentAttachPermission === "function" &&
        typeof value.validatePersistentRedrawPermission === "function" &&
        typeof value.revokePersistentAtlasSession === "function" &&
        typeof value.invalidatePersistentAtlasSession === "function";
      if (!ok) {
        problems.push(name);
      }
      continue;
    }
    if (!isAvailableFunction(value)) {
      problems.push(name);
    }
  }
  return problems;
}

function schedulerPair(composition) {
  const pair = composition.__internal.roots.schedulerPairIdentityProvider?.() ?? {};
  return {
    schedulerOwnerId: sanitizeString(pair.schedulerOwnerId) ?? composition.__internal.schedulerOwnerId,
    cancellerOwnerId: sanitizeString(pair.cancellerOwnerId) ?? composition.__internal.cancellerOwnerId
  };
}

function listenerPair(composition) {
  const pair = composition.__internal.roots.listenerPairIdentityProvider?.() ?? {};
  return {
    listenerRegistrarOwnerId:
      sanitizeString(pair.listenerRegistrarOwnerId) ?? composition.__internal.listenerOwnerId,
    listenerRemoverOwnerId:
      sanitizeString(pair.listenerRemoverOwnerId) ?? composition.__internal.listenerOwnerId
  };
}

function cleanupIdentity(composition) {
  const state = composition.__state;
  const internal = composition.__internal;
  const frameStatus = safeStatus(() => getPersistentAtlasAnimationFrameStatus(internal.wrappers.scheduler));
  const listenerStatus = safeStatus(() => getPersistentAtlasListenerStatus(internal.wrappers.listener));
  const surfaceStatus = safeStatus(() => getPersistentAtlasRetainedSurfaceStatus(internal.wrappers.surface));
  const lifecycleStatus = safeStatus(() => getPersistentAtlasLifecycleOwnerStatus(internal.wrappers.lifecycle));
  const snapshotStatus = safeStatus(() => getPersistentAtlasFrameSnapshotStatus(internal.wrappers.snapshot));
  const drawStatus = safeStatus(() => getPersistentAtlasFrameDrawStatus(internal.wrappers.draw));
  const authStatus = safeStatus(() => getPersistentAtlasAuthorizationProviderStatus(internal.wrappers.authorization));
  const extra = internal.roots.cleanupIdentitySeedProvider?.() ?? {};

  return {
    cleanupOwnerId: internal.cleanupOwnerId,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId:
      lifecycleStatus.lifecycleOwnerId ??
      state.lifecycleOwnerId ??
      internal.currentLifecycleSummary?.lifecycleOwnerId ??
      null,
    lifecycleGenerationId:
      lifecycleStatus.lifecycleGenerationId ??
      internal.currentLifecycleSummary?.lifecycleGenerationId ??
      null,
    surfaceOwnerId:
      surfaceStatus.surfaceOwnerId ??
      state.surfaceOwnerId ??
      internal.currentSurfaceSummary?.surfaceOwnerId ??
      internal.currentLifecycleSummary?.surfaceOwnerId ??
      null,
    schedulerOwnerId: internal.schedulerOwnerId,
    listenerOwnerId: internal.listenerOwnerId,
    authorizationSessionId: authStatus.sessionId ?? state.sessionId,
    queuedFrameCount: frameStatus.frameQueued ? 1 : 0,
    ownedListenerCount: listenerStatus.ownedListenerCount ?? 0,
    drawReferenceCount: drawStatus.referencesReleased === false ? 1 : 0,
    snapshotReferenceCount: snapshotStatus.snapshotPresent ? 1 : 0,
    ownedCanvasCount: surfaceStatus.ownedCanvasCount ?? 0,
    ownedPaneCount: surfaceStatus.ownedPaneCount ?? 0,
    ownedLifecycleOwnerCount: lifecycleStatus.ownedLifecycleOwnerCount ?? 0,
    mapReferenceCount: state.mapIdentityId ? 1 : 0,
    sessionReferenceCount: state.sessionId ? 1 : 0,
    referencesReleased: state.referencesReleased,
    ...extra
  };
}

function createWrappers(composition) {
  const roots = composition.__internal.roots;
  const internal = composition.__internal;
  const wrappers = {
    map: createPersistentAtlasMapProvider({
      realMapBridgeProvider: roots.mapBridgeProvider
    }),
    readiness: createPersistentAtlasReadinessProvider({
      handoffReadinessProvider: roots.readinessBridgeProvider
    }),
    identity: createPersistentAtlasIdentitySnapshotProvider({
      identitySourceProvider() {
        if (!internal.identitySourceInput) {
          throw Object.assign(new Error("IDENTITY_SOURCE_UNAVAILABLE"), {
            reasonCode: "IDENTITY_SOURCE_UNAVAILABLE"
          });
        }
        return internal.identitySourceInput;
      },
      nowProvider: roots.timeProvider,
      identitySource: "persistent_atlas_real_seam_composition"
    }),
    authorization: createPersistentAtlasAuthorizationProvider({
      persistentAuthorizationContract: roots.persistentAuthorizationContract
    }),
    scheduler: createPersistentAtlasAnimationFrameWrapper({
      requestAnimationFrameProvider: roots.browserFrameScheduler,
      cancelAnimationFrameProvider: roots.browserFrameCanceller,
      generationProvider: () => internal.schedulerGenerationId,
      identityProvider: () => schedulerPair(composition)
    }),
    listener: createPersistentAtlasListenerWrapper({
      mapProvider: () => internal.mapResult?.map ?? null,
      listenerRegistrar: roots.listenerRegistrar,
      listenerRemover: roots.listenerRemover,
      identityProvider: () => ({
        mapIdentityId: composition.__state.mapIdentityId,
        sessionId: composition.__state.sessionId,
        listenerOwnerId: internal.listenerOwnerId
      })
    }),
    surface: createPersistentAtlasRetainedSurfaceProvider({
      oneFrameSurfaceProvider: roots.oneFrameSurfaceProvider,
      paneProvider: (surface) => surface?.pane ?? surface?.panes ?? null,
      canvasProvider: (surface) => surface?.canvas ?? surface?.canvases ?? null,
      surfaceIdentityProvider: roots.surfaceIdentityProvider,
      mapIdentityProvider: () => internal.identitySnapshot ?? internal.identitySourceInput ?? {},
      removalProvider: roots.surfaceRemovalProvider,
      referenceReleaseProvider: roots.surfaceReferenceReleaseProvider
    }),
    lifecycle: createPersistentAtlasLifecycleOwnerProvider({
      oneFrameLifecycleOwnerProvider: roots.lifecycleOwnerProvider,
      lifecycleTranslationProvider: roots.lifecycleTranslationProvider,
      lifecycleIdentityProvider: roots.lifecycleIdentityProvider,
      lifecycleReleaseProvider: roots.lifecycleReleaseProvider,
      referenceReleaseProvider: roots.lifecycleReferenceReleaseProvider,
      mapIdentityProvider: () => internal.identitySnapshot ?? internal.identitySourceInput ?? {}
    }),
    snapshot: createPersistentAtlasFrameSnapshotProvider({
      oneFrameSnapshotProvider: roots.oneFrameSnapshotProvider,
      mapProvider: () => internal.mapResult ?? resolvePersistentAtlasMap(wrappers.map),
      readinessProvider: () => ({ diagnosticStatus: "approved", ...(internal.readinessSnapshot ?? resolvePersistentAtlasReadiness(wrappers.readiness)) }),
      identityProvider: () => internal.identitySnapshot ?? createPersistentAtlasIdentitySnapshot(wrappers.identity),
      lifecycleIdentityProvider: () => validatePersistentAtlasLifecycleOwner(wrappers.lifecycle),
      snapshotReleaseProvider: roots.snapshotReleaseProvider,
      timeProvider: roots.timeProvider
    }),
    draw: createPersistentAtlasFrameDrawProvider({
      snapshotValidator: ({ snapshot, drawGenerationId }) => ({
        ...validatePersistentAtlasFrameSnapshot(wrappers.snapshot, snapshot),
        drawGenerationId
      }),
      retainedSurfaceValidator: () => ({
        ...validatePersistentAtlasRetainedSurface(wrappers.surface),
        canvasIdentityId: wrappers.surface.__internal.canvasToken,
        paneIdentityId: wrappers.surface.__internal.paneToken,
        canvas: wrappers.surface.__internal.canvas,
        pane: wrappers.surface.__internal.pane
      }),
      lifecycleOwnerValidator: () => validatePersistentAtlasLifecycleOwner(wrappers.lifecycle),
      authorizationValidator: ({ drawGenerationId, redrawReason }) => ({
        ...validatePersistentAtlasRedrawAuthorization(wrappers.authorization, {
          sessionId: composition.__state.sessionId,
          identity: internal.identitySnapshot,
          readinessSnapshot: internal.readinessSnapshot,
          controllerAttached: true,
          lifecycleOwnerId: composition.__state.lifecycleOwnerId
        }),
        drawGenerationId,
        redrawReason
      }),
      snapshotAwareDrawProvider: roots.snapshotAwareDrawProvider,
      mutableDrawStateProvider: roots.mutableDrawStateProvider,
      canvasPositionAdapter: roots.canvasPositionAdapter,
      drawStateReleaseProvider: roots.drawStateReleaseProvider,
      timeProvider: roots.timeProvider
    }),
    cleanup: createPersistentAtlasCleanupProvider({
      redrawBlockProvider: roots.redrawBlockProvider,
      frameCancellationProvider: () => cancelPersistentAtlasFrame(wrappers.scheduler),
      listenerRemovalProvider: () => removePersistentAtlasListeners(wrappers.listener),
      drawStateReleaseProvider: () => releasePersistentAtlasDrawState(wrappers.draw, { reason: "cleanup" }),
      snapshotReleaseProvider: () => {
        if (internal.currentSnapshot) {
          releasePersistentAtlasFrameSnapshot(wrappers.snapshot, internal.currentSnapshot);
          internal.currentSnapshot = null;
        }
      },
      retainedSurfaceReleaseProvider: ({ target }) => releasePersistentAtlasRetainedSurface(wrappers.surface, { target }),
      lifecycleOwnerReleaseProvider: () => releasePersistentAtlasLifecycleOwner(wrappers.lifecycle),
      authorizationInvalidationProvider: roots.authorizationInvalidationProvider,
      mapIdentityReleaseProvider: roots.mapIdentityReleaseProvider,
      sessionIdentityReleaseProvider: roots.sessionIdentityReleaseProvider,
      referenceReleaseProvider: roots.referenceReleaseProvider,
      cleanupIdentityProvider: () => cleanupIdentity(composition),
      timeProvider: roots.timeProvider
    })
  };
  internal.wrappers = wrappers;
  composition.__state.wrapperInstanceCount = 11;
}

export function createPersistentAtlasRealSeamComposition(input = {}) {
  compositionCounter += 1;
  const compositionId = `PERSISTENT_ATLAS_COMPOSITION_${String(compositionCounter).padStart(3, "0")}`;
  const roots = mergeRoots(input);
  const composition = Object.freeze({
    __growgoPersistentAtlasRealSeamComposition: true,
    __internal: createInternal(compositionId, roots),
    __state: initialState(compositionId)
  });
  const state = composition.__state;
  state.state = "creating";
  state.schedulerOwnerId = composition.__internal.schedulerOwnerId;
  state.listenerOwnerId = composition.__internal.listenerOwnerId;
  state.cleanupOwnerId = composition.__internal.cleanupOwnerId;
  try {
    const problems = validateRootSeams(roots);
    state.rootSeamUnavailableCount = problems.length;
    if (problems.length > 0) {
      state.state = "unavailable";
      state.lastFailureReason = "INVALID_ROOT_SEAM";
      return composition;
    }
    createWrappers(composition);
    state.createCompletedCount += 1;
    state.state = "composed";
    state.referencesReleased = true;
    syncStatusFromWrappers(composition);
  } catch (error) {
    state.state = "failed_closed";
    state.failedClosed = true;
    state.lastFailureReason = "WRAPPER_CREATION_FAILED";
  }
  return composition;
}

export function validatePersistentAtlasRealSeamComposition(composition) {
  assertComposition(composition);
  const state = composition.__state;
  const internal = composition.__internal;
  if (state.released || internal.released) {
    failClosed(composition, "DEPENDENCY_EXPORT_BLOCKED");
  }
  state.validationAttemptCount += 1;
  state.state = "validating";
  try {
    const schedulerIds = schedulerPair(composition);
    if (schedulerIds.schedulerOwnerId !== schedulerIds.cancellerOwnerId) {
      state.wrapperMismatchDetected = true;
      failClosed(composition, "SCHEDULER_CANCELLER_MISMATCH");
    }
    const listenerIds = listenerPair(composition);
    if (listenerIds.listenerRegistrarOwnerId !== listenerIds.listenerRemoverOwnerId) {
      state.wrapperMismatchDetected = true;
      failClosed(composition, "LISTENER_PAIR_MISMATCH");
    }
    if (!isAvailableFunction(internal.roots.referenceReleaseProvider)) {
      state.wrapperMismatchDetected = true;
      failClosed(composition, "CLEANUP_SEAM_INCOMPLETE");
    }

    const mapResult = resolvePersistentAtlasMap(internal.wrappers.map, {
      expectedMapIdentityId: state.mapIdentityId,
      storedMapReference: internal.mapResult?.map ?? null
    });
    const readiness = resolvePersistentAtlasReadiness(internal.wrappers.readiness);
    const authorization = resolvePersistentAtlasAuthorization(internal.wrappers.authorization, {
      lifecycleOwnerId: state.lifecycleOwnerId
    });

    internal.mapResult = mapResult;
    internal.readinessSnapshot = readiness;
    internal.authorizationSnapshot = authorization;

    internal.identitySourceInput = {
      sessionId: authorization.sessionId,
      mapIdentityId: mapResult.mapIdentityId,
      readinessSnapshot: readiness,
      lifecycleOwnerId: state.lifecycleOwnerId
    };

    const identity = createPersistentAtlasIdentitySnapshot(internal.wrappers.identity);
    internal.identitySnapshot = identity;

    compareField(composition, "sessionId", identity.sessionId, authorization.sessionId, "SESSION_IDENTITY_MISMATCH");
    compareField(composition, "mapIdentityId", identity.mapIdentityId, authorization.mapIdentityId, "MAP_IDENTITY_MISMATCH");
    compareField(composition, "regionId", identity.regionId, readiness.regionId, "REGION_IDENTITY_MISMATCH");
    compareField(composition, "packageId", identity.packageId, readiness.packageId, "PACKAGE_IDENTITY_MISMATCH");
    compareField(composition, "packageVersion", identity.packageVersion, readiness.packageVersion, "PACKAGE_IDENTITY_MISMATCH");
    compareField(composition, "packageFingerprint", identity.packageFingerprint, readiness.packageFingerprint, "PACKAGE_IDENTITY_MISMATCH");
    compareField(composition, "recipeId", identity.recipeId, readiness.recipeId, "RECIPE_IDENTITY_MISMATCH");
    compareField(composition, "recipeVersion", identity.recipeVersion, readiness.recipeVersion, "RECIPE_IDENTITY_MISMATCH");
    compareField(composition, "selectorSeed", identity.selectorSeed, readiness.selectorSeed, "SELECTOR_SEED_MISMATCH");
    compareField(composition, "mapIdentityId", identity.mapIdentityId, mapResult.mapIdentityId, "MAP_IDENTITY_MISMATCH");
    if (state.surfaceOwnerId && state.lifecycleOwnerId) {
      compareField(composition, "surfaceOwnerId", state.surfaceOwnerId, safeStatus(() => getPersistentAtlasLifecycleOwnerStatus(internal.wrappers.lifecycle)).surfaceOwnerId, "SURFACE_OWNER_MISMATCH");
    }

    state.sessionId = identity.sessionId;
    state.mapIdentityId = identity.mapIdentityId;
    state.compositionReady = true;
    state.compositionValid = true;
    state.identityMismatchDetected = false;
    state.lastMismatchField = null;
    state.lastFailureReason = null;
    state.validationCompletedCount += 1;
    state.state = "ready";
    syncStatusFromWrappers(composition);
    return makeStatus(composition);
  } catch (error) {
    if (!state.failedClosed) {
      state.compositionValid = false;
      state.compositionReady = false;
      state.lastFailureReason = toReasonCode(error, "COMPOSITION_FAILED_CLOSED");
      state.failedClosed = true;
      state.state = "failed_closed";
    }
    syncStatusFromWrappers(composition);
    throw Object.assign(new Error(state.lastFailureReason), { reasonCode: state.lastFailureReason });
  }
}

function guardDependencies(composition) {
  assertComposition(composition);
  if (composition.__state.released || composition.__internal.released) {
    throw Object.assign(new Error("DEPENDENCY_EXPORT_BLOCKED"), {
      reasonCode: "DEPENDENCY_EXPORT_BLOCKED"
    });
  }
  if (!composition.__state.compositionValid) {
    throw Object.assign(new Error("DEPENDENCY_EXPORT_BLOCKED"), {
      reasonCode: "DEPENDENCY_EXPORT_BLOCKED"
    });
  }
}

function freezeExported(value) {
  return deepFreeze({
    schemaId: EXPORTED_DEPENDENCY_SCHEMA_ID,
    ...value
  });
}

export function createPersistentAtlasControllerDependenciesFromRealSeams(composition) {
  assertComposition(composition);
  const state = composition.__state;
  const internal = composition.__internal;
  state.dependencyExportAttemptCount += 1;
  if (!state.compositionValid) {
    validatePersistentAtlasRealSeamComposition(composition);
  }
  guardDependencies(composition);
  if (internal.exportedDependencies) {
    state.dependencyExportCompletedCount += 1;
    state.dependenciesExported = true;
    return internal.exportedDependencies;
  }
  const wrappers = internal.wrappers;

  const exported = freezeExported({
    resolveMap() {
      guardDependencies(composition);
      const mapResult = resolvePersistentAtlasMap(wrappers.map, {
        expectedMapIdentityId: state.mapIdentityId,
        storedMapReference: internal.mapResult?.map ?? null
      });
      internal.mapResult = mapResult;
      state.mapIdentityId = mapResult.mapIdentityId;
      return deepFreeze({
        mapResolved: true,
        mapIdentityId: mapResult.mapIdentityId
      });
    },
    resolveReadiness() {
      guardDependencies(composition);
      internal.readinessSnapshot = resolvePersistentAtlasReadiness(wrappers.readiness);
      return internal.readinessSnapshot;
    },
    resolveAuthorization() {
      guardDependencies(composition);
      internal.authorizationSnapshot = resolvePersistentAtlasAuthorization(wrappers.authorization, {
        sessionId: state.sessionId,
        identity: internal.identitySnapshot,
        lifecycleOwnerId: state.lifecycleOwnerId
      });
      state.sessionId = internal.authorizationSnapshot.sessionId;
      return internal.authorizationSnapshot;
    },
    consumeAttachPermission() {
      guardDependencies(composition);
      internal.authorizationSnapshot = consumePersistentAtlasAttachPermission(wrappers.authorization, {
        sessionId: state.sessionId,
        identity: internal.identitySnapshot
      });
      state.sessionId = internal.authorizationSnapshot.sessionId;
      return internal.authorizationSnapshot;
    },
    validateRedrawAuthorization() {
      guardDependencies(composition);
      return validatePersistentAtlasRedrawAuthorization(wrappers.authorization, {
        sessionId: state.sessionId,
        identity: internal.identitySnapshot,
        readinessSnapshot: internal.readinessSnapshot,
        controllerAttached: true,
        lifecycleOwnerId: state.lifecycleOwnerId
      });
    },
    createIdentitySnapshot() {
      guardDependencies(composition);
      if (!internal.authorizationSnapshot) {
        internal.authorizationSnapshot = resolvePersistentAtlasAuthorization(wrappers.authorization, {
          lifecycleOwnerId: state.lifecycleOwnerId
        });
      }
      if (!internal.mapResult) {
        internal.mapResult = resolvePersistentAtlasMap(wrappers.map);
      }
      if (!internal.readinessSnapshot) {
        internal.readinessSnapshot = resolvePersistentAtlasReadiness(wrappers.readiness);
      }
      internal.identitySourceInput = {
        sessionId: internal.authorizationSnapshot.sessionId,
        mapIdentityId: internal.mapResult.mapIdentityId,
        readinessSnapshot: internal.readinessSnapshot,
        lifecycleOwnerId: state.lifecycleOwnerId
      };
      internal.identitySnapshot = createPersistentAtlasIdentitySnapshot(wrappers.identity);
      state.sessionId = internal.identitySnapshot.sessionId;
      state.mapIdentityId = internal.identitySnapshot.mapIdentityId;
      return internal.identitySnapshot;
    },
    acquireSurface() {
      guardDependencies(composition);
      internal.currentSurfaceSummary = acquirePersistentAtlasRetainedSurface(wrappers.surface);
      syncStatusFromWrappers(composition);
      return internal.currentSurfaceSummary;
    },
    validateSurface() {
      guardDependencies(composition);
      internal.currentSurfaceSummary = validatePersistentAtlasRetainedSurface(wrappers.surface, internal.identitySnapshot);
      syncStatusFromWrappers(composition);
      return internal.currentSurfaceSummary;
    },
    reuseSurface() {
      guardDependencies(composition);
      internal.currentSurfaceSummary = reusePersistentAtlasRetainedSurface(wrappers.surface, internal.identitySnapshot);
      syncStatusFromWrappers(composition);
      return internal.currentSurfaceSummary;
    },
    acquireLifecycleOwner() {
      guardDependencies(composition);
      internal.currentLifecycleSummary = acquirePersistentAtlasLifecycleOwner(wrappers.lifecycle);
      state.lifecycleOwnerId = internal.currentLifecycleSummary.lifecycleOwnerId;
      syncStatusFromWrappers(composition);
      return internal.currentLifecycleSummary;
    },
    validateLifecycleOwner() {
      guardDependencies(composition);
      internal.currentLifecycleSummary = validatePersistentAtlasLifecycleOwner(wrappers.lifecycle, internal.identitySnapshot);
      state.lifecycleOwnerId = internal.currentLifecycleSummary.lifecycleOwnerId;
      syncStatusFromWrappers(composition);
      return internal.currentLifecycleSummary;
    },
    createSnapshot({ redrawReason } = {}) {
      guardDependencies(composition);
      internal.currentSnapshot = createPersistentAtlasFrameSnapshot(wrappers.snapshot, { redrawReason });
      syncStatusFromWrappers(composition);
      return deepFreeze({
        snapshotId: internal.currentSnapshot.snapshotId,
        snapshotGenerationId: internal.currentSnapshot.snapshotGenerationId,
        redrawReason: internal.currentSnapshot.redrawReason,
        sessionId: internal.currentSnapshot.sessionId,
        mapIdentityId: internal.currentSnapshot.mapIdentityId,
        lifecycleOwnerId: internal.currentSnapshot.lifecycleOwnerId,
        surfaceOwnerId: internal.currentSnapshot.surfaceOwnerId
      });
    },
    validateSnapshot() {
      guardDependencies(composition);
      return validatePersistentAtlasFrameSnapshot(wrappers.snapshot, internal.currentSnapshot);
    },
    drawFrame({ drawGenerationId } = {}) {
      guardDependencies(composition);
      const retainedSurface = {
        canvas: wrappers.surface.__internal.canvas,
        pane: wrappers.surface.__internal.pane
      };
      const lifecycleOwner = wrappers.lifecycle.__internal.lifecycleOwner;
      internal.currentDrawResult = drawPersistentAtlasFrame(wrappers.draw, {
        snapshot: internal.currentSnapshot,
        retainedSurface,
        lifecycleOwner,
        authorization: internal.authorizationSnapshot,
        drawGenerationId
      });
      syncStatusFromWrappers(composition);
      return internal.currentDrawResult;
    },
    scheduleFrame(callback) {
      guardDependencies(composition);
      const handle = schedulePersistentAtlasFrame(wrappers.scheduler, callback);
      syncStatusFromWrappers(composition);
      return handle;
    },
    cancelFrame() {
      guardDependencies(composition);
      cancelPersistentAtlasFrame(wrappers.scheduler);
      syncStatusFromWrappers(composition);
      return makeStatus(composition);
    },
    registerListeners(eventCallbacks) {
      guardDependencies(composition);
      const result = registerPersistentAtlasListeners(wrappers.listener, {
        eventCallbacks,
        identity: {
          mapIdentityId: state.mapIdentityId,
          sessionId: state.sessionId,
          listenerOwnerId: internal.listenerOwnerId
        }
      });
      syncStatusFromWrappers(composition);
      return result;
    },
    removeListeners() {
      guardDependencies(composition);
      const result = removePersistentAtlasListeners(wrappers.listener, {
        mapIdentityId: state.mapIdentityId,
        sessionId: state.sessionId,
        listenerOwnerId: internal.listenerOwnerId
      });
      syncStatusFromWrappers(composition);
      return result;
    },
    prepareCleanup({ cleanupMode = "detach", originatingFailureReason = null } = {}) {
      guardDependencies(composition);
      const result = preparePersistentAtlasCleanup(wrappers.cleanup, {
        cleanupMode,
        originatingFailureReason
      });
      syncStatusFromWrappers(composition);
      return result;
    },
    executeCleanup() {
      guardDependencies(composition);
      const result = executePersistentAtlasCleanup(wrappers.cleanup);
      syncStatusFromWrappers(composition);
      return result;
    },
    resumeCleanup() {
      guardDependencies(composition);
      const result = resumePersistentAtlasCleanup(wrappers.cleanup);
      syncStatusFromWrappers(composition);
      return result;
    },
    getReadOnlyStatus() {
      return makeStatus(composition);
    }
  });

  internal.exportedDependencies = exported;
  state.dependenciesExported = true;
  state.dependencyExportCompletedCount += 1;
  return exported;
}

export function releasePersistentAtlasRealSeamComposition(composition) {
  assertComposition(composition);
  const state = composition.__state;
  const internal = composition.__internal;
  state.releaseAttemptCount += 1;
  if (state.released || internal.released) {
    return makeStatus(composition);
  }
  state.state = "releasing";
  try {
    if (internal.currentSnapshot) {
      try {
        releasePersistentAtlasFrameSnapshot(internal.wrappers.snapshot, internal.currentSnapshot);
      } catch {}
      internal.currentSnapshot = null;
    }
    try {
      releasePersistentAtlasDrawState(internal.wrappers.draw, { reason: "composition_release" });
    } catch {}
    try {
      releasePersistentAtlasRetainedSurface(internal.wrappers.surface);
    } catch {}
    try {
      releasePersistentAtlasLifecycleOwner(internal.wrappers.lifecycle);
    } catch {}
    internal.mapResult = null;
    internal.readinessSnapshot = null;
    internal.identitySourceInput = null;
    internal.identitySnapshot = null;
    internal.authorizationSnapshot = null;
    internal.currentSurfaceSummary = null;
    internal.currentLifecycleSummary = null;
    internal.currentDrawResult = null;
    internal.exportedDependencies = null;
    internal.released = true;
    state.referencesReleased = true;
    state.released = true;
    state.compositionReady = false;
    state.compositionValid = false;
    state.dependenciesExported = false;
    state.releaseCompletedCount += 1;
    state.state = "released";
    syncStatusFromWrappers(composition);
    return makeStatus(composition);
  } catch (error) {
    state.failedClosed = true;
    state.state = "failed_closed";
    state.lastFailureReason = "COMPOSITION_RELEASE_FAILED";
    throw Object.assign(new Error("COMPOSITION_RELEASE_FAILED"), {
      reasonCode: "COMPOSITION_RELEASE_FAILED"
    });
  }
}

export function getPersistentAtlasRealSeamCompositionStatus(composition) {
  if (!composition) {
    return makeStatus(null);
  }
  syncStatusFromWrappers(composition);
  return makeStatus(composition);
}
