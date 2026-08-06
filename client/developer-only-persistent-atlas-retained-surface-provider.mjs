const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_RETAINED_SURFACE_PROVIDER_STATUS_001";

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

function identityComplete(identity) {
  return IDENTITY_KEYS.every((key) => identity[key] != null && identity[key] !== "");
}

function normalizeCollection(primary, collection) {
  if (Array.isArray(collection)) {
    return collection.filter(Boolean);
  }
  if (Array.isArray(primary)) {
    return primary.filter(Boolean);
  }
  if (primary == null) {
    return [];
  }
  return [primary];
}

function resolveCanvasCollection(provider, surface) {
  return normalizeCollection(
    provider.__deps.canvasProvider(surface),
    surface?.canvases
  );
}

function resolvePaneCollection(provider, surface) {
  return normalizeCollection(provider.__deps.paneProvider(surface), surface?.panes);
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    providerReady: state.providerReady,
    retained: state.retained,
    ready: state.ready,
    releaseInProgress: state.releaseInProgress,
    released: state.released,
    failedClosed: state.failedClosed,
    surfaceOwnerId: state.surfaceOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount,
    canvasIdentityPresent: state.canvasIdentityPresent,
    paneIdentityPresent: state.paneIdentityPresent,
    acquisitionAttemptCount: state.acquisitionAttemptCount,
    acquisitionCompletedCount: state.acquisitionCompletedCount,
    validationAttemptCount: state.validationAttemptCount,
    validationCompletedCount: state.validationCompletedCount,
    reuseAttemptCount: state.reuseAttemptCount,
    reuseCompletedCount: state.reuseCompletedCount,
    releaseAttemptCount: state.releaseAttemptCount,
    releaseCompletedCount: state.releaseCompletedCount,
    canvasRemovalAttemptCount: state.canvasRemovalAttemptCount,
    canvasRemovalCompletedCount: state.canvasRemovalCompletedCount,
    paneRemovalAttemptCount: state.paneRemovalAttemptCount,
    paneRemovalCompletedCount: state.paneRemovalCompletedCount,
    referenceReleaseAttemptCount: state.referenceReleaseAttemptCount,
    referenceReleaseCompletedCount: state.referenceReleaseCompletedCount,
    cleanupCompleted: state.cleanupCompleted,
    cleanupFailed: state.cleanupFailed,
    cleanupFailureReasons: [...state.cleanupFailureReasons],
    referencesReleased: state.referencesReleased,
    lastFailureReason: state.lastFailureReason,
    boundRegionId: state.boundRegionId,
    boundPackageId: state.boundPackageId,
    boundPackageVersion: state.boundPackageVersion,
    boundPackageFingerprint: state.boundPackageFingerprint,
    boundRecipeId: state.boundRecipeId,
    boundRecipeVersion: state.boundRecipeVersion,
    boundSelectorSeed: state.boundSelectorSeed,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildExposedSurfaceSummary(state) {
  return deepFreeze({
    surfaceOwnerId: state.surfaceOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    ownedCanvasCount: state.ownedCanvasCount,
    ownedPaneCount: state.ownedPaneCount
  });
}

export function createPersistentAtlasRetainedSurfaceProvider({
  oneFrameSurfaceProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  paneProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  canvasProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  surfaceIdentityProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  mapIdentityProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  removalProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"),
  referenceReleaseProvider = unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE")
} = {}) {
  const tokenMaps = {
    canvas: new WeakMap(),
    pane: new WeakMap()
  };
  const counters = {
    canvas: 0,
    pane: 0,
    surfaceOwner: 0
  };

  const state = {
    state: "empty",
    providerReady: false,
    retained: false,
    ready: false,
    releaseInProgress: false,
    released: false,
    failedClosed: false,
    surfaceOwnerId: null,
    mapIdentityId: null,
    sessionId: null,
    ownedCanvasCount: 0,
    ownedPaneCount: 0,
    canvasIdentityPresent: false,
    paneIdentityPresent: false,
    acquisitionAttemptCount: 0,
    acquisitionCompletedCount: 0,
    validationAttemptCount: 0,
    validationCompletedCount: 0,
    reuseAttemptCount: 0,
    reuseCompletedCount: 0,
    releaseAttemptCount: 0,
    releaseCompletedCount: 0,
    canvasRemovalAttemptCount: 0,
    canvasRemovalCompletedCount: 0,
    paneRemovalAttemptCount: 0,
    paneRemovalCompletedCount: 0,
    referenceReleaseAttemptCount: 0,
    referenceReleaseCompletedCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: true,
    lastFailureReason: null,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null
  };

  const internal = {
    surface: null,
    canvas: null,
    pane: null,
    canvasToken: null,
    paneToken: null,
    boundIdentity: null,
    releaseProgress: {
      referencesReleased: false,
      canvasRemoved: false,
      paneRemoved: false
    }
  };

  function nextToken(kind, value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    if (tokenMaps[kind].has(value)) {
      return tokenMaps[kind].get(value);
    }
    counters[kind] += 1;
    const token = `${kind.toUpperCase()}_${String(counters[kind]).padStart(3, "0")}`;
    tokenMaps[kind].set(value, token);
    return token;
  }

  function nextSurfaceOwnerId() {
    counters.surfaceOwner += 1;
    return `PERSISTENT_SURFACE_OWNER_${String(counters.surfaceOwner).padStart(3, "0")}`;
  }

  return Object.freeze({
    __growgoPersistentAtlasRetainedSurfaceProvider: true,
    __state: state,
    __internal: internal,
    __deps: {
      oneFrameSurfaceProvider,
      paneProvider,
      canvasProvider,
      surfaceIdentityProvider,
      mapIdentityProvider,
      removalProvider,
      referenceReleaseProvider
    },
    __nextToken: nextToken,
    __nextSurfaceOwnerId: nextSurfaceOwnerId
  });
}

function syncState(provider) {
  const state = provider.__state;
  const internal = provider.__internal;
  state.ownedCanvasCount = internal.canvas ? 1 : 0;
  state.ownedPaneCount = internal.pane ? 1 : 0;
  state.canvasIdentityPresent = !!internal.canvasToken;
  state.paneIdentityPresent = !!internal.paneToken;
  state.retained = state.ownedCanvasCount === 1;
  state.referencesReleased =
    internal.surface == null &&
    internal.canvas == null &&
    internal.pane == null &&
    internal.releaseProgress.referencesReleased === true;
}

function setState(provider, next) {
  const state = provider.__state;
  state.state = next;
  state.ready = next === "ready";
  state.releaseInProgress = next === "releasing";
  state.released = next === "released";
  state.failedClosed = next === "failed_closed";
  syncState(provider);
}

function clearBindings(provider) {
  const state = provider.__state;
  const internal = provider.__internal;
  internal.boundIdentity = null;
  state.surfaceOwnerId = null;
  state.mapIdentityId = null;
  state.sessionId = null;
  state.boundRegionId = null;
  state.boundPackageId = null;
  state.boundPackageVersion = null;
  state.boundPackageFingerprint = null;
  state.boundRecipeId = null;
  state.boundRecipeVersion = null;
  state.boundSelectorSeed = null;
}

function readDeps(provider, required = []) {
  const state = provider.__state;
  const deps = provider.__deps;
  const availability = required.every((name) => isAvailableFunction(deps[name]));
  state.providerReady = availability;
  if (!availability) {
    state.lastFailureReason = "RETAINED_SURFACE_PROVIDER_UNAVAILABLE";
    throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
    });
  }
  return deps;
}

function bindIdentity(provider, identity, surfaceIdentity) {
  const state = provider.__state;
  const internal = provider.__internal;
  const sanitized = sanitizeIdentity(identity);
  internal.boundIdentity = sanitized;
  state.surfaceOwnerId =
    surfaceIdentity?.surfaceOwnerId == null
      ? provider.__nextSurfaceOwnerId()
      : String(surfaceIdentity.surfaceOwnerId);
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

function classifyIdentityMismatch(bound, current) {
  if (current.mapIdentityId !== bound.mapIdentityId) {
    return "MAP_IDENTITY_MISMATCH";
  }
  if (current.sessionId !== bound.sessionId) {
    return "SESSION_IDENTITY_MISMATCH";
  }
  if (current.regionId !== bound.regionId) {
    return "REGION_IDENTITY_MISMATCH";
  }
  if (
    current.packageId !== bound.packageId ||
    current.packageVersion !== bound.packageVersion ||
    current.packageFingerprint !== bound.packageFingerprint
  ) {
    return "PACKAGE_IDENTITY_MISMATCH";
  }
  if (
    current.recipeId !== bound.recipeId ||
    current.recipeVersion !== bound.recipeVersion
  ) {
    return "RECIPE_IDENTITY_MISMATCH";
  }
  if (current.selectorSeed !== bound.selectorSeed) {
    return "SELECTOR_SEED_MISMATCH";
  }
  return null;
}

function normalizeSurfaceResult(provider, surface) {
  const canvases = resolveCanvasCollection(provider, surface);
  const panes = resolvePaneCollection(provider, surface);

  if (canvases.length === 0) {
    throw Object.assign(new Error("MISSING_CANVAS"), {
      reasonCode: "MISSING_CANVAS"
    });
  }
  if (canvases.length > 1) {
    throw Object.assign(new Error("DUPLICATE_CANVAS"), {
      reasonCode: "DUPLICATE_CANVAS"
    });
  }
  if (panes.length > 1) {
    throw Object.assign(new Error("DUPLICATE_PANE"), {
      reasonCode: "DUPLICATE_PANE"
    });
  }

  return {
    canvas: canvases[0],
    pane: panes[0] ?? null,
    canvasToken: provider.__nextToken("canvas", canvases[0]),
    paneToken: panes[0] ? provider.__nextToken("pane", panes[0]) : null
  };
}

export function acquirePersistentAtlasRetainedSurface(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
    });
  }

  state.acquisitionAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "SURFACE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("SURFACE_RELEASE_IN_PROGRESS"), {
      reasonCode: "SURFACE_RELEASE_IN_PROGRESS"
    });
  }

  if (state.retained || internal.surface || internal.canvas) {
    state.lastFailureReason = "DUPLICATE_SURFACE_ACQUISITION";
    throw Object.assign(new Error("DUPLICATE_SURFACE_ACQUISITION"), {
      reasonCode: "DUPLICATE_SURFACE_ACQUISITION"
    });
  }

  const deps = readDeps(provider, [
    "oneFrameSurfaceProvider",
    "paneProvider",
    "canvasProvider",
    "surfaceIdentityProvider",
    "mapIdentityProvider",
    "removalProvider",
    "referenceReleaseProvider"
  ]);

  setState(provider, "acquiring");
  state.cleanupCompleted = false;
  state.cleanupFailed = false;
  state.cleanupFailureReasons = [];

  try {
    const identity = sanitizeIdentity(deps.mapIdentityProvider());
    if (!identityComplete(identity)) {
      throw Object.assign(new Error("SURFACE_ACQUISITION_FAILED"), {
        reasonCode: "SURFACE_ACQUISITION_FAILED"
      });
    }

    const surface = deps.oneFrameSurfaceProvider({
      identity
    });

    if (!surface || typeof surface !== "object") {
      throw Object.assign(new Error("INVALID_SURFACE_SHAPE"), {
        reasonCode: "INVALID_SURFACE_SHAPE"
      });
    }

    const normalized = normalizeSurfaceResult(provider, surface);
    const surfaceIdentity = deps.surfaceIdentityProvider(surface) ?? {};

    internal.surface = surface;
    internal.canvas = normalized.canvas;
    internal.pane = normalized.pane;
    internal.canvasToken = normalized.canvasToken;
    internal.paneToken = normalized.paneToken;
    internal.releaseProgress = {
      referencesReleased: false,
      canvasRemoved: false,
      paneRemoved: normalized.pane == null
    };

    bindIdentity(provider, identity, surfaceIdentity);
    state.acquisitionCompletedCount += 1;
    state.lastFailureReason = null;
    setState(provider, "retained");
    return buildExposedSurfaceSummary(state);
  } catch (error) {
    state.lastFailureReason = toReasonCode(error, "SURFACE_ACQUISITION_FAILED");
    setState(provider, "failed_closed");
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason
    });
  }
}

export function validatePersistentAtlasRetainedSurface(provider, expectedIdentity = null) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
    });
  }

  state.validationAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "SURFACE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("SURFACE_RELEASE_IN_PROGRESS"), {
      reasonCode: "SURFACE_RELEASE_IN_PROGRESS"
    });
  }

  if (state.failedClosed) {
    state.lastFailureReason = "RETAINED_SURFACE_FAILED_CLOSED";
    throw Object.assign(new Error("RETAINED_SURFACE_FAILED_CLOSED"), {
      reasonCode: "RETAINED_SURFACE_FAILED_CLOSED"
    });
  }

  if (!state.retained || !internal.canvas) {
    state.lastFailureReason = "INVALID_SURFACE_SHAPE";
    throw Object.assign(new Error("INVALID_SURFACE_SHAPE"), {
      reasonCode: "INVALID_SURFACE_SHAPE"
    });
  }

  const deps = readDeps(provider, [
    "surfaceIdentityProvider",
    "mapIdentityProvider"
  ]);

  setState(provider, "validating");

  const currentIdentity = sanitizeIdentity(deps.mapIdentityProvider());
  const boundIdentity = internal.boundIdentity;
  const mismatchReason = classifyIdentityMismatch(boundIdentity, currentIdentity);
  if (mismatchReason) {
    state.lastFailureReason = mismatchReason;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(mismatchReason), { reasonCode: mismatchReason });
  }

  if (expectedIdentity) {
    const expectedMismatch = classifyIdentityMismatch(
      sanitizeIdentity(expectedIdentity),
      currentIdentity
    );
    if (expectedMismatch) {
      state.lastFailureReason = expectedMismatch;
      setState(provider, "failed_closed");
      throw Object.assign(new Error(expectedMismatch), {
        reasonCode: expectedMismatch
      });
    }
  }

  const currentSurfaceIdentity = deps.surfaceIdentityProvider(internal.surface) ?? {};
  const currentSurfaceOwnerId =
    currentSurfaceIdentity.surfaceOwnerId == null
      ? null
      : String(currentSurfaceIdentity.surfaceOwnerId);
  if (currentSurfaceOwnerId !== state.surfaceOwnerId) {
    state.lastFailureReason = "SURFACE_OWNER_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SURFACE_OWNER_MISMATCH"), {
      reasonCode: "SURFACE_OWNER_MISMATCH"
    });
  }

  const canvases = resolveCanvasCollection(provider, internal.surface);
  if (canvases.length === 0) {
    state.lastFailureReason = "CANVAS_MISSING";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("CANVAS_MISSING"), {
      reasonCode: "CANVAS_MISSING"
    });
  }
  if (canvases.length > 1) {
    state.lastFailureReason = "CANVAS_IDENTITY_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("CANVAS_IDENTITY_MISMATCH"), {
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    });
  }
  const canvas = canvases[0];
  const currentCanvasToken = provider.__nextToken("canvas", canvas);
  if (currentCanvasToken !== internal.canvasToken) {
    state.lastFailureReason = "CANVAS_IDENTITY_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("CANVAS_IDENTITY_MISMATCH"), {
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    });
  }

  if (internal.pane) {
    const panes = resolvePaneCollection(provider, internal.surface);
    if (panes.length === 0) {
      state.lastFailureReason = "PANE_MISSING";
      setState(provider, "failed_closed");
      throw Object.assign(new Error("PANE_MISSING"), {
        reasonCode: "PANE_MISSING"
      });
    }
    if (panes.length > 1) {
      state.lastFailureReason = "PANE_IDENTITY_MISMATCH";
      setState(provider, "failed_closed");
      throw Object.assign(new Error("PANE_IDENTITY_MISMATCH"), {
        reasonCode: "PANE_IDENTITY_MISMATCH"
      });
    }
    const pane = panes[0];
    const currentPaneToken = provider.__nextToken("pane", pane);
    if (currentPaneToken !== internal.paneToken) {
      state.lastFailureReason = "PANE_IDENTITY_MISMATCH";
      setState(provider, "failed_closed");
      throw Object.assign(new Error("PANE_IDENTITY_MISMATCH"), {
        reasonCode: "PANE_IDENTITY_MISMATCH"
      });
    }
  }

  state.validationCompletedCount += 1;
  state.lastFailureReason = null;
  setState(provider, "ready");
  return buildExposedSurfaceSummary(state);
}

export function reusePersistentAtlasRetainedSurface(provider, expectedIdentity = null) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
    });
  }

  state.reuseAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "SURFACE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("SURFACE_RELEASE_IN_PROGRESS"), {
      reasonCode: "SURFACE_RELEASE_IN_PROGRESS"
    });
  }

  validatePersistentAtlasRetainedSurface(provider, expectedIdentity);
  state.reuseCompletedCount += 1;
  state.lastFailureReason = null;
  setState(provider, "ready");
  return buildExposedSurfaceSummary(state);
}

export function releasePersistentAtlasRetainedSurface(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("RETAINED_SURFACE_PROVIDER_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
    });
  }

  state.releaseAttemptCount += 1;

  if (state.released && !internal.canvas && !internal.pane && internal.releaseProgress.referencesReleased) {
    state.lastFailureReason = null;
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  }

  const deps = readDeps(provider, [
    "removalProvider",
    "referenceReleaseProvider"
  ]);

  setState(provider, "releasing");
  const failures = [];

  if (!internal.releaseProgress.referencesReleased) {
    state.referenceReleaseAttemptCount += 1;
    try {
      deps.referenceReleaseProvider({
        surfaceOwnerId: state.surfaceOwnerId,
        mapIdentityId: state.mapIdentityId,
        sessionId: state.sessionId
      });
      internal.releaseProgress.referencesReleased = true;
      state.referenceReleaseCompletedCount += 1;
      internal.surface = null;
    } catch (error) {
      failures.push(toReasonCode(error, "REFERENCE_RELEASE_FAILED"));
    }
  }

  if (internal.canvas && !internal.releaseProgress.canvasRemoved) {
    state.canvasRemovalAttemptCount += 1;
    try {
      deps.removalProvider({
        kind: "canvas",
        ownerId: state.surfaceOwnerId
      });
      internal.releaseProgress.canvasRemoved = true;
      state.canvasRemovalCompletedCount += 1;
      internal.canvas = null;
      internal.canvasToken = null;
    } catch (error) {
      failures.push(toReasonCode(error, "CANVAS_REMOVAL_FAILED"));
    }
  }

  if (internal.pane && !internal.releaseProgress.paneRemoved) {
    state.paneRemovalAttemptCount += 1;
    try {
      deps.removalProvider({
        kind: "pane",
        ownerId: state.surfaceOwnerId
      });
      internal.releaseProgress.paneRemoved = true;
      state.paneRemovalCompletedCount += 1;
      internal.pane = null;
      internal.paneToken = null;
    } catch (error) {
      failures.push(toReasonCode(error, "PANE_REMOVAL_FAILED"));
    }
  }

  syncState(provider);
  state.cleanupFailureReasons = [...new Set(failures)];
  state.cleanupFailed = failures.length > 0;
  state.cleanupCompleted =
    failures.length === 0 &&
    internal.releaseProgress.referencesReleased &&
    internal.releaseProgress.canvasRemoved &&
    internal.releaseProgress.paneRemoved;

  if (state.cleanupCompleted) {
    clearBindings(provider);
    state.releaseCompletedCount += 1;
    state.lastFailureReason = null;
    setState(provider, "released");
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  }

  state.lastFailureReason =
    failures.length > 0 ? failures[0] : "SURFACE_RELEASE_INCOMPLETE";
  if (failures.length > 0) {
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason,
      cleanupFailureReasons: [...state.cleanupFailureReasons]
    });
  }

  throw Object.assign(new Error("SURFACE_RELEASE_INCOMPLETE"), {
    reasonCode: "SURFACE_RELEASE_INCOMPLETE"
  });
}

export function getPersistentAtlasRetainedSurfaceStatus(provider) {
  const state = provider?.__state;
  if (!state) {
    return freezeStatus({
      state: "unavailable",
      providerReady: false,
      retained: false,
      ready: false,
      releaseInProgress: false,
      released: false,
      failedClosed: true,
      surfaceOwnerId: null,
      mapIdentityId: null,
      sessionId: null,
      ownedCanvasCount: 0,
      ownedPaneCount: 0,
      canvasIdentityPresent: false,
      paneIdentityPresent: false,
      acquisitionAttemptCount: 0,
      acquisitionCompletedCount: 0,
      validationAttemptCount: 0,
      validationCompletedCount: 0,
      reuseAttemptCount: 0,
      reuseCompletedCount: 0,
      releaseAttemptCount: 0,
      releaseCompletedCount: 0,
      canvasRemovalAttemptCount: 0,
      canvasRemovalCompletedCount: 0,
      paneRemovalAttemptCount: 0,
      paneRemovalCompletedCount: 0,
      referenceReleaseAttemptCount: 0,
      referenceReleaseCompletedCount: 0,
      cleanupCompleted: false,
      cleanupFailed: false,
      cleanupFailureReasons: [],
      referencesReleased: false,
      lastFailureReason: "RETAINED_SURFACE_PROVIDER_UNAVAILABLE",
      boundRegionId: null,
      boundPackageId: null,
      boundPackageVersion: null,
      boundPackageFingerprint: null,
      boundRecipeId: null,
      boundRecipeVersion: null,
      boundSelectorSeed: null
    });
  }

  syncState(provider);
  return freezeStatus(state);
}
