const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_RETAINED_SURFACE_WRAPPER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_RETAINED_SURFACE_WRAPPER_RESULT_001";

const IDENTITY_KEYS = [
  "mapIdentityId",
  "sessionId",
  "regionId",
  "packageId",
  "packageVersion",
  "packageFingerprint",
  "recipeId",
  "recipeVersion",
  "selectorSeed"
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

function sanitizeIdentity(identity = {}) {
  const sanitized = {};

  for (const key of IDENTITY_KEYS) {
    const value = identity?.[key];
    sanitized[key] = value == null ? null : String(value);
  }

  return sanitized;
}

function identityHasMissingFields(identity) {
  const sanitized = sanitizeIdentity(identity);
  return IDENTITY_KEYS.some((key) => sanitized[key] == null);
}

function identitiesEqual(left, right, keys) {
  return keys.every((key) => left?.[key] === right?.[key]);
}

function normalizeCollection(primary, collection) {
  if (Array.isArray(collection)) {
    return collection.filter(Boolean);
  }

  if (primary == null) {
    return [];
  }

  return [primary];
}

function cloneStatus(state) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    ready: state.ready,
    retained: state.retained,
    releaseInProgress: state.releaseInProgress,
    released: state.released,
    failedClosed: state.failedClosed,
    surfaceOwnerId: state.surfaceOwnerId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    boundRegionId: state.boundRegionId,
    boundPackageId: state.boundPackageId,
    boundPackageVersion: state.boundPackageVersion,
    boundPackageFingerprint: state.boundPackageFingerprint,
    boundRecipeId: state.boundRecipeId,
    boundRecipeVersion: state.boundRecipeVersion,
    boundSelectorSeed: state.boundSelectorSeed,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    lifecycleOwnerPresent: state.lifecycleOwnerPresent,
    acquisitionAttemptCount: state.acquisitionAttemptCount,
    acquisitionCompletedCount: state.acquisitionCompletedCount,
    validationAttemptCount: state.validationAttemptCount,
    validationCompletedCount: state.validationCompletedCount,
    reuseAttemptCount: state.reuseAttemptCount,
    reuseCompletedCount: state.reuseCompletedCount,
    releaseAttemptCount: state.releaseAttemptCount,
    releaseCompletedCount: state.releaseCompletedCount,
    frameCancelAttemptCount: state.frameCancelAttemptCount,
    frameCancelCompletedCount: state.frameCancelCompletedCount,
    listenerCleanupAttemptCount: state.listenerCleanupAttemptCount,
    listenerCleanupCompletedCount: state.listenerCleanupCompletedCount,
    canvasRemovalAttemptCount: state.canvasRemovalAttemptCount,
    canvasRemovalCompletedCount: state.canvasRemovalCompletedCount,
    paneRemovalAttemptCount: state.paneRemovalAttemptCount,
    paneRemovalCompletedCount: state.paneRemovalCompletedCount,
    lifecycleOwnerReleaseAttemptCount: state.lifecycleOwnerReleaseAttemptCount,
    lifecycleOwnerReleaseCompletedCount: state.lifecycleOwnerReleaseCompletedCount,
    referenceReleaseAttemptCount: state.referenceReleaseAttemptCount,
    referenceReleaseCompletedCount: state.referenceReleaseCompletedCount,
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
  extra = {}
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    status: deepFreeze(cloneStatus(state)),
    ...extra
  });
}

export function createControlledPersistentAtlasRetainedSurfaceWrapper({
  oneFrameSurfaceProvider = unavailable("SURFACE_PROVIDER_UNAVAILABLE"),
  lifecycleOwnerProvider = unavailable("LIFECYCLE_OWNER_UNAVAILABLE"),
  lifecycleTranslationProvider = unavailable("WRAPPER_FAILED_CLOSED"),
  paneRemovalProvider = unavailable("PANE_REMOVAL_FAILED"),
  canvasRemovalProvider = unavailable("CANVAS_REMOVAL_FAILED"),
  listenerCleanupProvider = unavailable("LISTENER_CLEANUP_FAILED"),
  queuedFrameCancellationProvider = unavailable("QUEUED_FRAME_CANCELLATION_FAILED"),
  referenceReleaseProvider = unavailable("REFERENCE_RELEASE_FAILED"),
  identityProvider = unavailable("WRAPPER_FAILED_CLOSED")
} = {}) {
  const tokenMaps = {
    canvas: new WeakMap(),
    pane: new WeakMap(),
    lifecycleOwner: new WeakMap()
  };
  const tokenCounters = {
    canvas: 0,
    pane: 0,
    lifecycleOwner: 0,
    surfaceOwner: 0
  };

  const internal = {
    surface: null,
    canvas: null,
    pane: null,
    lifecycleOwner: null,
    translation: null,
    boundIdentity: null,
    listenerCleanupComplete: false,
    frameCancellationComplete: false,
    referenceReleaseComplete: false
  };

  const state = {
    state: "empty",
    ready: false,
    retained: false,
    releaseInProgress: false,
    released: false,
    failedClosed: false,
    surfaceOwnerId: null,
    lifecycleOwnerId: null,
    mapIdentityId: null,
    sessionId: null,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    lifecycleOwnerPresent: false,
    acquisitionAttemptCount: 0,
    acquisitionCompletedCount: 0,
    validationAttemptCount: 0,
    validationCompletedCount: 0,
    reuseAttemptCount: 0,
    reuseCompletedCount: 0,
    releaseAttemptCount: 0,
    releaseCompletedCount: 0,
    frameCancelAttemptCount: 0,
    frameCancelCompletedCount: 0,
    listenerCleanupAttemptCount: 0,
    listenerCleanupCompletedCount: 0,
    canvasRemovalAttemptCount: 0,
    canvasRemovalCompletedCount: 0,
    paneRemovalAttemptCount: 0,
    paneRemovalCompletedCount: 0,
    lifecycleOwnerReleaseAttemptCount: 0,
    lifecycleOwnerReleaseCompletedCount: 0,
    referenceReleaseAttemptCount: 0,
    referenceReleaseCompletedCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: true,
    lastFailureReason: null
  };

  function updateOwnershipState() {
    state.ownedCanvasCount = internal.canvas ? 1 : 0;
    state.ownedPaneCount = internal.pane ? 1 : 0;
    state.lifecycleOwnerPresent = !!internal.lifecycleOwner;
    state.referencesReleased =
      !internal.surface &&
      !internal.translation &&
      !internal.canvas &&
      !internal.pane &&
      !internal.lifecycleOwner;
    state.retained = state.ownedCanvasCount === 1 || state.ownedPaneCount === 1;
  }

  function setState(nextState) {
    state.state = nextState;
    state.ready = nextState === "ready";
    state.releaseInProgress = nextState === "releasing";
    state.released = nextState === "released";
    state.failedClosed = nextState === "failed_closed";
    updateOwnershipState();
  }

  function setFailure(reasonCode, failedClosed = false) {
    state.lastFailureReason = reasonCode;
    if (failedClosed) {
      setState("failed_closed");
    }
    return reasonCode;
  }

  function getToken(kind, value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    const map = tokenMaps[kind];
    if (map.has(value)) {
      return map.get(value);
    }

    tokenCounters[kind] += 1;
    const token = `${kind.toUpperCase()}_${String(tokenCounters[kind]).padStart(3, "0")}`;
    map.set(value, token);
    return token;
  }

  function nextSurfaceOwnerId() {
    tokenCounters.surfaceOwner += 1;
    return `PERSISTENT_SURFACE_OWNER_${String(tokenCounters.surfaceOwner).padStart(3, "0")}`;
  }

  function getStatus() {
    updateOwnershipState();
    return deepFreeze(cloneStatus(state));
  }

  function validateRequiredSeams(seams) {
    for (const [name, fn, reasonCode] of seams) {
      if (!isAvailableFunction(fn)) {
        throw Object.assign(new Error(reasonCode), {
          reasonCode,
          seamName: name
        });
      }
    }
  }

  function bindIdentity(identity) {
    const sanitized = sanitizeIdentity(identity);
    internal.boundIdentity = sanitized;
    state.mapIdentityId = sanitized.mapIdentityId;
    state.sessionId = sanitized.sessionId;
    state.boundRegionId = sanitized.regionId;
    state.boundPackageId = sanitized.packageId;
    state.boundPackageVersion = sanitized.packageVersion;
    state.boundPackageFingerprint = sanitized.packageFingerprint;
    state.boundRecipeId = sanitized.recipeId;
    state.boundRecipeVersion = sanitized.recipeVersion;
    state.boundSelectorSeed = sanitized.selectorSeed;
  }

  function clearIdentity() {
    internal.boundIdentity = null;
    state.mapIdentityId = null;
    state.sessionId = null;
    state.boundRegionId = null;
    state.boundPackageId = null;
    state.boundPackageVersion = null;
    state.boundPackageFingerprint = null;
    state.boundRecipeId = null;
    state.boundRecipeVersion = null;
    state.boundSelectorSeed = null;
    state.surfaceOwnerId = null;
    state.lifecycleOwnerId = null;
  }

  function normalizeSurface(surface) {
    if (!surface || typeof surface !== "object") {
      return {
        ok: false,
        reasonCode: "INVALID_SURFACE_SHAPE"
      };
    }

    const canvases = normalizeCollection(surface.canvas, surface.canvases);
    const panes = normalizeCollection(surface.pane, surface.panes);

    if (canvases.length === 0) {
      return {
        ok: false,
        reasonCode: "MISSING_CANVAS"
      };
    }

    if (canvases.length > 1) {
      return {
        ok: false,
        reasonCode: "DUPLICATE_CANVAS"
      };
    }

    if (panes.length > 1) {
      return {
        ok: false,
        reasonCode: "DUPLICATE_PANE"
      };
    }

    return {
      ok: true,
      canvas: canvases[0],
      pane: panes[0] ?? null,
      canvasToken: getToken("canvas", canvases[0]),
      paneToken: panes[0] ? getToken("pane", panes[0]) : null
    };
  }

  function classifyIdentityMismatch(currentIdentity) {
    if (currentIdentity.mapIdentityId !== internal.boundIdentity.mapIdentityId) {
      return "MAP_IDENTITY_MISMATCH";
    }

    if (currentIdentity.sessionId !== internal.boundIdentity.sessionId) {
      return "SESSION_MISMATCH";
    }

    if (
      !identitiesEqual(currentIdentity, internal.boundIdentity, [
        "regionId",
        "packageId",
        "packageVersion",
        "packageFingerprint",
        "recipeId",
        "recipeVersion",
        "selectorSeed"
      ])
    ) {
      return "REGION_IDENTITY_MISMATCH";
    }

    return null;
  }

  function performReleaseCleanup({ releaseReasonCode = null } = {}) {
    const failures = [];

    if (!internal.frameCancellationComplete) {
      state.frameCancelAttemptCount += 1;
      try {
        queuedFrameCancellationProvider({
          operation: "release",
          reasonCode: releaseReasonCode,
          surfaceOwnerId: state.surfaceOwnerId,
          lifecycleOwnerId: state.lifecycleOwnerId
        });
        internal.frameCancellationComplete = true;
        state.frameCancelCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "QUEUED_FRAME_CANCELLATION_FAILED"));
      }
    }

    if (!internal.listenerCleanupComplete) {
      state.listenerCleanupAttemptCount += 1;
      try {
        listenerCleanupProvider({
          operation: "release",
          reasonCode: releaseReasonCode,
          surfaceOwnerId: state.surfaceOwnerId,
          lifecycleOwnerId: state.lifecycleOwnerId
        });
        internal.listenerCleanupComplete = true;
        state.listenerCleanupCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "LISTENER_CLEANUP_FAILED"));
      }
    }

    if (!internal.referenceReleaseComplete) {
      state.referenceReleaseAttemptCount += 1;
      try {
        referenceReleaseProvider({
          operation: "release",
          reasonCode: releaseReasonCode,
          surfaceOwnerId: state.surfaceOwnerId,
          lifecycleOwnerId: state.lifecycleOwnerId
        });
        internal.surface = null;
        internal.translation = null;
        internal.referenceReleaseComplete = true;
        state.referenceReleaseCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "REFERENCE_RELEASE_FAILED"));
      }
    }

    if (internal.canvas) {
      state.canvasRemovalAttemptCount += 1;
      try {
        canvasRemovalProvider({
          operation: "release",
          canvas: internal.canvas,
          canvasToken: getToken("canvas", internal.canvas),
          reasonCode: releaseReasonCode
        });
        internal.canvas = null;
        state.canvasRemovalCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "CANVAS_REMOVAL_FAILED"));
      }
    }

    if (internal.pane) {
      state.paneRemovalAttemptCount += 1;
      try {
        paneRemovalProvider({
          operation: "release",
          pane: internal.pane,
          paneToken: getToken("pane", internal.pane),
          reasonCode: releaseReasonCode
        });
        internal.pane = null;
        state.paneRemovalCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "PANE_REMOVAL_FAILED"));
      }
    }

    if (internal.lifecycleOwner) {
      state.lifecycleOwnerReleaseAttemptCount += 1;
      try {
        lifecycleOwnerProvider({
          operation: "release",
          lifecycleOwner: internal.lifecycleOwner,
          lifecycleOwnerId: state.lifecycleOwnerId,
          reasonCode: releaseReasonCode
        });
        internal.lifecycleOwner = null;
        state.lifecycleOwnerReleaseCompletedCount += 1;
      } catch (error) {
        failures.push(toReasonCode(error, "LIFECYCLE_OWNER_RELEASE_FAILED"));
      }
    }

    if (!internal.canvas && !internal.pane && !internal.lifecycleOwner) {
      clearIdentity();
    }

    updateOwnershipState();
    state.cleanupFailureReasons = [...new Set(failures)];
    state.cleanupFailed = failures.length > 0;
    state.cleanupCompleted = failures.length === 0 && !state.retained && !state.lifecycleOwnerPresent;

    if (state.cleanupCompleted) {
      setState("released");
      state.releaseCompletedCount += 1;
      state.lastFailureReason = null;
      return {
        outcome: "released",
        reasonCode: "RELEASED"
      };
    }

    if (failures.length > 0) {
      setFailure(failures[0], true);
      return {
        outcome: "failed_closed",
        reasonCode: failures[0]
      };
    }

    setFailure("CLEANUP_INCOMPLETE", true);
    return {
      outcome: "failed_closed",
      reasonCode: "CLEANUP_INCOMPLETE"
    };
  }

  function acquirePersistentSurface({ surfaceOwnerId = null } = {}) {
    state.acquisitionAttemptCount += 1;

    if (state.releaseInProgress) {
      return buildResult({
        operation: "acquirePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("RELEASE_ALREADY_IN_PROGRESS"),
        state
      });
    }

    if (state.retained || internal.canvas || internal.lifecycleOwner) {
      return buildResult({
        operation: "acquirePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("DUPLICATE_ACQUISITION"),
        state
      });
    }

    try {
      validateRequiredSeams([
        ["oneFrameSurfaceProvider", oneFrameSurfaceProvider, "SURFACE_PROVIDER_UNAVAILABLE"],
        ["lifecycleOwnerProvider", lifecycleOwnerProvider, "LIFECYCLE_OWNER_UNAVAILABLE"],
        ["lifecycleTranslationProvider", lifecycleTranslationProvider, "WRAPPER_FAILED_CLOSED"],
        ["identityProvider", identityProvider, "WRAPPER_FAILED_CLOSED"]
      ]);
    } catch (error) {
      return buildResult({
        operation: "acquirePersistentSurface",
        outcome: "failed_closed",
        reasonCode: setFailure(toReasonCode(error, "WRAPPER_FAILED_CLOSED"), true),
        state
      });
    }

    setState("acquiring");
    state.cleanupCompleted = false;
    state.cleanupFailed = false;
    state.cleanupFailureReasons = [];

    try {
      const identity = sanitizeIdentity(identityProvider());
      if (identityHasMissingFields(identity)) {
        throw Object.assign(new Error("WRAPPER_FAILED_CLOSED"), {
          reasonCode: "WRAPPER_FAILED_CLOSED"
        });
      }

      const surface = oneFrameSurfaceProvider({
        operation: "acquire",
        identity
      });
      const normalizedSurface = normalizeSurface(surface);
      if (!normalizedSurface.ok) {
        throw Object.assign(new Error(normalizedSurface.reasonCode), {
          reasonCode: normalizedSurface.reasonCode
        });
      }

      const lifecycleOwnerResult = lifecycleOwnerProvider({
        operation: "acquire",
        identity,
        surface
      });
      const lifecycleOwner =
        lifecycleOwnerResult?.lifecycleOwner ?? lifecycleOwnerResult ?? null;

      if (!lifecycleOwner || typeof lifecycleOwner !== "object") {
        throw Object.assign(new Error("LIFECYCLE_OWNER_UNAVAILABLE"), {
          reasonCode: "LIFECYCLE_OWNER_UNAVAILABLE"
        });
      }

      const translation = lifecycleTranslationProvider({
        operation: "translate",
        identity,
        surface,
        lifecycleOwner
      });

      internal.surface = surface;
      internal.canvas = normalizedSurface.canvas;
      internal.pane = normalizedSurface.pane;
      internal.lifecycleOwner = lifecycleOwner;
      internal.translation = translation ?? null;
      internal.listenerCleanupComplete = false;
      internal.frameCancellationComplete = false;
      internal.referenceReleaseComplete = false;

      bindIdentity(identity);
      state.surfaceOwnerId =
        surfaceOwnerId ??
        translation?.surfaceOwnerId ??
        nextSurfaceOwnerId();
      state.lifecycleOwnerId =
        lifecycleOwnerResult?.lifecycleOwnerId ??
        translation?.lifecycleOwnerId ??
        getToken("lifecycleOwner", lifecycleOwner);

      state.acquisitionCompletedCount += 1;
      setState("retained");

      return buildResult({
        operation: "acquirePersistentSurface",
        outcome: "acquired",
        reasonCode: "SURFACE_ACQUIRED",
        state,
        extra: {
          canvasToken: normalizedSurface.canvasToken,
          paneToken: normalizedSurface.paneToken,
          lifecycleOwnerToken: getToken("lifecycleOwner", lifecycleOwner)
        }
      });
    } catch (error) {
      const reasonCode = toReasonCode(error, "SURFACE_ACQUISITION_FAILED");
      setFailure(reasonCode, true);
      return buildResult({
        operation: "acquirePersistentSurface",
        outcome: "failed_closed",
        reasonCode,
        state
      });
    }
  }

  function validatePersistentSurface() {
    state.validationAttemptCount += 1;

    if (state.releaseInProgress) {
      return buildResult({
        operation: "validatePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("RELEASE_ALREADY_IN_PROGRESS"),
        state
      });
    }

    if (state.failedClosed) {
      return buildResult({
        operation: "validatePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("WRAPPER_FAILED_CLOSED"),
        state
      });
    }

    if (!internal.canvas || !internal.lifecycleOwner || !internal.boundIdentity) {
      return buildResult({
        operation: "validatePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("INVALID_SURFACE_SHAPE"),
        state
      });
    }

    setState("validating");

    try {
      validateRequiredSeams([
        ["oneFrameSurfaceProvider", oneFrameSurfaceProvider, "SURFACE_PROVIDER_UNAVAILABLE"],
        ["lifecycleOwnerProvider", lifecycleOwnerProvider, "LIFECYCLE_OWNER_UNAVAILABLE"],
        ["identityProvider", identityProvider, "WRAPPER_FAILED_CLOSED"]
      ]);

      const currentIdentity = sanitizeIdentity(identityProvider());
      const identityReason = classifyIdentityMismatch(currentIdentity);
      if (identityReason) {
        throw Object.assign(new Error(identityReason), {
          reasonCode: identityReason
        });
      }

      const inspectedSurface =
        oneFrameSurfaceProvider({
          operation: "inspect",
          identity: currentIdentity,
          retainedSurface: internal.surface,
          retainedCanvas: internal.canvas,
          retainedPane: internal.pane
        }) ?? internal.surface;

      const normalizedSurface = normalizeSurface(inspectedSurface);
      if (!normalizedSurface.ok) {
        throw Object.assign(new Error(normalizedSurface.reasonCode), {
          reasonCode: normalizedSurface.reasonCode
        });
      }

      if (getToken("canvas", normalizedSurface.canvas) !== getToken("canvas", internal.canvas)) {
        throw Object.assign(new Error("DUPLICATE_CANVAS"), {
          reasonCode: "DUPLICATE_CANVAS"
        });
      }

      if (
        internal.pane &&
        normalizedSurface.pane &&
        getToken("pane", normalizedSurface.pane) !== getToken("pane", internal.pane)
      ) {
        throw Object.assign(new Error("DUPLICATE_PANE"), {
          reasonCode: "DUPLICATE_PANE"
        });
      }

      const lifecycleValidation =
        lifecycleOwnerProvider({
          operation: "validate",
          identity: currentIdentity,
          lifecycleOwner: internal.lifecycleOwner,
          lifecycleOwnerId: state.lifecycleOwnerId,
          translation: internal.translation
        }) ?? { matches: true };

      if (lifecycleValidation?.matches === false) {
        throw Object.assign(new Error("LIFECYCLE_OWNER_MISMATCH"), {
          reasonCode: "LIFECYCLE_OWNER_MISMATCH"
        });
      }

      state.validationCompletedCount += 1;
      setState("ready");

      return buildResult({
        operation: "validatePersistentSurface",
        outcome: "valid",
        reasonCode: "SURFACE_VALIDATED",
        state,
        extra: {
          canvasToken: getToken("canvas", internal.canvas),
          paneToken: internal.pane ? getToken("pane", internal.pane) : null,
          lifecycleOwnerToken: getToken("lifecycleOwner", internal.lifecycleOwner)
        }
      });
    } catch (error) {
      const reasonCode = toReasonCode(error, "WRAPPER_FAILED_CLOSED");
      setFailure(reasonCode, true);
      return buildResult({
        operation: "validatePersistentSurface",
        outcome: "failed_closed",
        reasonCode,
        state
      });
    }
  }

  function reusePersistentSurface() {
    state.reuseAttemptCount += 1;

    if (state.releaseInProgress) {
      return buildResult({
        operation: "reusePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("RELEASE_ALREADY_IN_PROGRESS"),
        state
      });
    }

    if (state.failedClosed) {
      return buildResult({
        operation: "reusePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("WRAPPER_FAILED_CLOSED"),
        state
      });
    }

    if (!internal.canvas || !internal.lifecycleOwner) {
      return buildResult({
        operation: "reusePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("INVALID_SURFACE_SHAPE"),
        state
      });
    }

    if (state.state === "retained") {
      const validation = validatePersistentSurface();
      if (validation.outcome !== "valid") {
        return validation;
      }
    }

    state.reuseCompletedCount += 1;
    setState("ready");

    return buildResult({
      operation: "reusePersistentSurface",
      outcome: "reused",
      reasonCode: "SURFACE_REUSED",
      state,
      extra: {
        canvasToken: getToken("canvas", internal.canvas),
        paneToken: internal.pane ? getToken("pane", internal.pane) : null,
        lifecycleOwnerToken: getToken("lifecycleOwner", internal.lifecycleOwner)
      }
    });
  }

  function releasePersistentSurface({ reasonCode = null } = {}) {
    state.releaseAttemptCount += 1;

    if (state.releaseInProgress) {
      return buildResult({
        operation: "releasePersistentSurface",
        outcome: "blocked",
        reasonCode: setFailure("RELEASE_ALREADY_IN_PROGRESS"),
        state
      });
    }

    if (!internal.canvas && !internal.pane && !internal.lifecycleOwner && state.released) {
      return buildResult({
        operation: "releasePersistentSurface",
        outcome: "released",
        reasonCode: "RELEASED",
        state
      });
    }

    setState("releasing");
    const result = performReleaseCleanup({
      releaseReasonCode: reasonCode
    });

    return buildResult({
      operation: "releasePersistentSurface",
      outcome: result.outcome,
      reasonCode: result.reasonCode,
      state
    });
  }

  return {
    acquirePersistentSurface,
    validatePersistentSurface,
    reusePersistentSurface,
    releasePersistentSurface,
    getPersistentSurfaceWrapperStatus: getStatus
  };
}

export function acquirePersistentSurface(wrapper, ...args) {
  return wrapper.acquirePersistentSurface(...args);
}

export function validatePersistentSurface(wrapper, ...args) {
  return wrapper.validatePersistentSurface(...args);
}

export function reusePersistentSurface(wrapper, ...args) {
  return wrapper.reusePersistentSurface(...args);
}

export function releasePersistentSurface(wrapper, ...args) {
  return wrapper.releasePersistentSurface(...args);
}

export function getPersistentSurfaceWrapperStatus(wrapper, ...args) {
  return wrapper.getPersistentSurfaceWrapperStatus(...args);
}
