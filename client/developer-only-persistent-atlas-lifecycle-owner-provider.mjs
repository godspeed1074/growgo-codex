const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_LIFECYCLE_OWNER_PROVIDER_STATUS_001";

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

const FORBIDDEN_TRANSLATION_KEYS = new Set([
  "map",
  "canvas",
  "pane",
  "domNode",
  "element",
  "listener",
  "listeners",
  "callback",
  "callbacks",
  "scheduler",
  "schedulerHandle",
  "animationFrameHandle",
  "renderer",
  "rendererState",
  "window",
  "document"
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

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
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
    lifecycleOwnerId: state.lifecycleOwnerId,
    lifecycleGenerationId: state.lifecycleGenerationId,
    surfaceOwnerId: state.surfaceOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    lifecycleOwnerPresent: state.lifecycleOwnerPresent,
    lifecycleTranslationPresent: state.lifecycleTranslationPresent,
    ownedLifecycleOwnerCount: state.ownedLifecycleOwnerCount,
    acquisitionAttemptCount: state.acquisitionAttemptCount,
    acquisitionCompletedCount: state.acquisitionCompletedCount,
    translationAttemptCount: state.translationAttemptCount,
    translationCompletedCount: state.translationCompletedCount,
    validationAttemptCount: state.validationAttemptCount,
    validationCompletedCount: state.validationCompletedCount,
    reuseAttemptCount: state.reuseAttemptCount,
    reuseCompletedCount: state.reuseCompletedCount,
    releaseAttemptCount: state.releaseAttemptCount,
    releaseCompletedCount: state.releaseCompletedCount,
    lifecycleReleaseAttemptCount: state.lifecycleReleaseAttemptCount,
    lifecycleReleaseCompletedCount: state.lifecycleReleaseCompletedCount,
    referenceReleaseAttemptCount: state.referenceReleaseAttemptCount,
    referenceReleaseCompletedCount: state.referenceReleaseCompletedCount,
    rawBrowserReferenceDetected: state.rawBrowserReferenceDetected,
    cycleSafeTranslationUsed: state.cycleSafeTranslationUsed,
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

function buildExposedSummary(state) {
  return deepFreeze({
    lifecycleOwnerId: state.lifecycleOwnerId,
    lifecycleGenerationId: state.lifecycleGenerationId,
    surfaceOwnerId: state.surfaceOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    ownedLifecycleOwnerCount: state.ownedLifecycleOwnerCount
  });
}

function syncState(provider) {
  const state = provider.__state;
  const internal = provider.__internal;
  state.lifecycleOwnerPresent = !!internal.lifecycleOwner;
  state.lifecycleTranslationPresent = !!internal.translation;
  state.ownedLifecycleOwnerCount = internal.lifecycleOwner ? 1 : 0;
  state.retained = state.ownedLifecycleOwnerCount === 1;
  state.referencesReleased =
    internal.lifecycleOwner == null &&
    internal.translation == null &&
    internal.releaseProgress.lifecycleReleased === true &&
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
  state.lifecycleOwnerId = null;
  state.lifecycleGenerationId = null;
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
    state.lastFailureReason = "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE";
    throw Object.assign(new Error("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
    });
  }

  return deps;
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

function normalizeOwnerCollection(result) {
  if (Array.isArray(result)) {
    return result.filter(Boolean);
  }
  if (Array.isArray(result?.lifecycleOwners)) {
    return result.lifecycleOwners.filter(Boolean);
  }
  if (result?.lifecycleOwner != null) {
    return [result.lifecycleOwner];
  }
  if (result == null) {
    return [];
  }
  return [result];
}

function resolveOwnerMetadata(ownerResult, owner) {
  if (ownerResult && ownerResult.lifecycleOwner === owner) {
    return ownerResult;
  }
  return ownerResult ?? {};
}

function translationHasForbiddenReference(value, seen = new WeakSet()) {
  if (value == null) {
    return false;
  }

  const valueType = typeof value;
  if (valueType === "function" || valueType === "symbol") {
    return true;
  }

  if (valueType !== "object") {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) => translationHasForbiddenReference(entry, seen));
  }

  if (!isPlainObject(value)) {
    return true;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_TRANSLATION_KEYS.has(key)) {
      return true;
    }
    if (translationHasForbiddenReference(nested, seen)) {
      return true;
    }
  }

  return false;
}

function sanitizeTranslation(translation) {
  if (!isPlainObject(translation)) {
    throw Object.assign(new Error("INVALID_LIFECYCLE_TRANSLATION"), {
      reasonCode: "INVALID_LIFECYCLE_TRANSLATION"
    });
  }

  if (translationHasForbiddenReference(translation)) {
    throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
      reasonCode: "RAW_BROWSER_REFERENCE_DETECTED"
    });
  }

  return deepFreeze(JSON.parse(JSON.stringify(translation)));
}

function bindIdentityAndOwner(provider, identity, metadata, translation) {
  const state = provider.__state;
  const internal = provider.__internal;
  const sanitizedIdentity = sanitizeIdentity(identity);
  const lifecycleOwnerId = metadata?.lifecycleOwnerId ?? translation?.lifecycleOwnerId;
  const lifecycleGenerationId =
    metadata?.lifecycleGenerationId ?? translation?.lifecycleGenerationId;
  const surfaceOwnerId = metadata?.surfaceOwnerId ?? translation?.surfaceOwnerId;

  internal.boundIdentity = sanitizedIdentity;

  state.lifecycleOwnerId =
    lifecycleOwnerId == null ? null : String(lifecycleOwnerId);
  state.lifecycleGenerationId =
    lifecycleGenerationId == null ? null : String(lifecycleGenerationId);
  state.surfaceOwnerId =
    surfaceOwnerId == null ? null : String(surfaceOwnerId);
  state.mapIdentityId = sanitizedIdentity.mapIdentityId;
  state.sessionId = sanitizedIdentity.sessionId;
  state.boundRegionId = sanitizedIdentity.regionId;
  state.boundPackageId = sanitizedIdentity.packageId;
  state.boundPackageVersion = sanitizedIdentity.packageVersion;
  state.boundPackageFingerprint = sanitizedIdentity.packageFingerprint;
  state.boundRecipeId = sanitizedIdentity.recipeId;
  state.boundRecipeVersion = sanitizedIdentity.recipeVersion;
  state.boundSelectorSeed = sanitizedIdentity.selectorSeed;
}

function validateTranslationIdentity(state, translation) {
  const translationLifecycleOwnerId =
    translation?.lifecycleOwnerId == null ? null : String(translation.lifecycleOwnerId);
  const translationLifecycleGenerationId =
    translation?.lifecycleGenerationId == null
      ? null
      : String(translation.lifecycleGenerationId);
  const translationSurfaceOwnerId =
    translation?.surfaceOwnerId == null ? null : String(translation.surfaceOwnerId);

  if (
    translationLifecycleOwnerId !== state.lifecycleOwnerId ||
    translationLifecycleGenerationId !== state.lifecycleGenerationId ||
    translationSurfaceOwnerId !== state.surfaceOwnerId
  ) {
    throw Object.assign(new Error("LIFECYCLE_TRANSLATION_IDENTITY_MISMATCH"), {
      reasonCode: "LIFECYCLE_TRANSLATION_IDENTITY_MISMATCH"
    });
  }
}

export function createPersistentAtlasLifecycleOwnerProvider({
  oneFrameLifecycleOwnerProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"),
  lifecycleTranslationProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"),
  lifecycleIdentityProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"),
  lifecycleReleaseProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"),
  referenceReleaseProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"),
  mapIdentityProvider = unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE")
} = {}) {
  const state = {
    state: "empty",
    providerReady: false,
    retained: false,
    ready: false,
    releaseInProgress: false,
    released: false,
    failedClosed: false,
    lifecycleOwnerId: null,
    lifecycleGenerationId: null,
    surfaceOwnerId: null,
    mapIdentityId: null,
    sessionId: null,
    lifecycleOwnerPresent: false,
    lifecycleTranslationPresent: false,
    ownedLifecycleOwnerCount: 0,
    acquisitionAttemptCount: 0,
    acquisitionCompletedCount: 0,
    translationAttemptCount: 0,
    translationCompletedCount: 0,
    validationAttemptCount: 0,
    validationCompletedCount: 0,
    reuseAttemptCount: 0,
    reuseCompletedCount: 0,
    releaseAttemptCount: 0,
    releaseCompletedCount: 0,
    lifecycleReleaseAttemptCount: 0,
    lifecycleReleaseCompletedCount: 0,
    referenceReleaseAttemptCount: 0,
    referenceReleaseCompletedCount: 0,
    rawBrowserReferenceDetected: false,
    cycleSafeTranslationUsed: false,
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
    lifecycleOwner: null,
    translation: null,
    boundIdentity: null,
    releaseProgress: {
      lifecycleReleased: false,
      referencesReleased: false
    }
  };

  return Object.freeze({
    __growgoPersistentAtlasLifecycleOwnerProvider: true,
    __state: state,
    __internal: internal,
    __deps: {
      oneFrameLifecycleOwnerProvider,
      lifecycleTranslationProvider,
      lifecycleIdentityProvider,
      lifecycleReleaseProvider,
      referenceReleaseProvider,
      mapIdentityProvider
    }
  });
}

export function acquirePersistentAtlasLifecycleOwner(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
    });
  }

  state.acquisitionAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "LIFECYCLE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("LIFECYCLE_RELEASE_IN_PROGRESS"), {
      reasonCode: "LIFECYCLE_RELEASE_IN_PROGRESS"
    });
  }

  if (state.retained || internal.lifecycleOwner) {
    state.lastFailureReason = "DUPLICATE_LIFECYCLE_OWNER_ACQUISITION";
    throw Object.assign(new Error("DUPLICATE_LIFECYCLE_OWNER_ACQUISITION"), {
      reasonCode: "DUPLICATE_LIFECYCLE_OWNER_ACQUISITION"
    });
  }

  const deps = readDeps(provider, [
    "oneFrameLifecycleOwnerProvider",
    "lifecycleTranslationProvider",
    "lifecycleIdentityProvider",
    "mapIdentityProvider",
    "lifecycleReleaseProvider",
    "referenceReleaseProvider"
  ]);

  setState(provider, "acquiring");
  state.cleanupCompleted = false;
  state.cleanupFailed = false;
  state.cleanupFailureReasons = [];
  state.rawBrowserReferenceDetected = false;

  try {
    const identity = sanitizeIdentity(deps.mapIdentityProvider());
    if (!identityComplete(identity)) {
      throw Object.assign(new Error("LIFECYCLE_OWNER_ACQUISITION_FAILED"), {
        reasonCode: "LIFECYCLE_OWNER_ACQUISITION_FAILED"
      });
    }

    const ownerResult = deps.oneFrameLifecycleOwnerProvider({ identity });
    const owners = normalizeOwnerCollection(ownerResult);

    if (owners.length === 0) {
      throw Object.assign(new Error("MISSING_LIFECYCLE_OWNER"), {
        reasonCode: "MISSING_LIFECYCLE_OWNER"
      });
    }

    if (owners.length > 1) {
      throw Object.assign(new Error("DUPLICATE_LIFECYCLE_OWNER"), {
        reasonCode: "DUPLICATE_LIFECYCLE_OWNER"
      });
    }

    const owner = owners[0];
    if (!owner || typeof owner !== "object") {
      throw Object.assign(new Error("INVALID_LIFECYCLE_OWNER_SHAPE"), {
        reasonCode: "INVALID_LIFECYCLE_OWNER_SHAPE"
      });
    }

    const metadata = {
      ...resolveOwnerMetadata(ownerResult, owner),
      ...(deps.lifecycleIdentityProvider(owner) ?? {})
    };

    const lifecycleOwnerId =
      metadata.lifecycleOwnerId == null ? null : String(metadata.lifecycleOwnerId);
    const lifecycleGenerationId =
      metadata.lifecycleGenerationId == null
        ? null
        : String(metadata.lifecycleGenerationId);
    const surfaceOwnerId =
      metadata.surfaceOwnerId == null ? null : String(metadata.surfaceOwnerId);

    if (!lifecycleOwnerId || !lifecycleGenerationId || !surfaceOwnerId) {
      throw Object.assign(new Error("INVALID_LIFECYCLE_OWNER_SHAPE"), {
        reasonCode: "INVALID_LIFECYCLE_OWNER_SHAPE"
      });
    }

    state.translationAttemptCount += 1;
    const translated = deps.lifecycleTranslationProvider({
      lifecycleOwner: owner,
      identity,
      metadata: deepFreeze({
        lifecycleOwnerId,
        lifecycleGenerationId,
        surfaceOwnerId
      })
    });
    const sanitizedTranslation = sanitizeTranslation(translated);
    validateTranslationIdentity(
      {
        lifecycleOwnerId,
        lifecycleGenerationId,
        surfaceOwnerId
      },
      sanitizedTranslation
    );

    internal.lifecycleOwner = owner;
    internal.translation = sanitizedTranslation;
    internal.releaseProgress = {
      lifecycleReleased: false,
      referencesReleased: false
    };

    bindIdentityAndOwner(provider, identity, metadata, sanitizedTranslation);
    state.translationCompletedCount += 1;
    state.acquisitionCompletedCount += 1;
    state.cycleSafeTranslationUsed = true;
    state.lastFailureReason = null;
    setState(provider, "retained");
    return buildExposedSummary(state);
  } catch (error) {
    const reasonCode = toReasonCode(
      error,
      "LIFECYCLE_OWNER_ACQUISITION_FAILED"
    );
    state.rawBrowserReferenceDetected =
      reasonCode === "RAW_BROWSER_REFERENCE_DETECTED";
    state.lastFailureReason = reasonCode;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
}

export function validatePersistentAtlasLifecycleOwner(
  provider,
  expectedIdentity = null
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
    });
  }

  state.validationAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "LIFECYCLE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("LIFECYCLE_RELEASE_IN_PROGRESS"), {
      reasonCode: "LIFECYCLE_RELEASE_IN_PROGRESS"
    });
  }

  if (state.failedClosed) {
    state.lastFailureReason = "LIFECYCLE_OWNER_FAILED_CLOSED";
    throw Object.assign(new Error("LIFECYCLE_OWNER_FAILED_CLOSED"), {
      reasonCode: "LIFECYCLE_OWNER_FAILED_CLOSED"
    });
  }

  if (!state.retained || !internal.lifecycleOwner || !internal.translation) {
    state.lastFailureReason = "INVALID_LIFECYCLE_OWNER_SHAPE";
    throw Object.assign(new Error("INVALID_LIFECYCLE_OWNER_SHAPE"), {
      reasonCode: "INVALID_LIFECYCLE_OWNER_SHAPE"
    });
  }

  const deps = readDeps(provider, [
    "lifecycleTranslationProvider",
    "lifecycleIdentityProvider",
    "mapIdentityProvider"
  ]);

  setState(provider, "validating");

  const currentIdentity = sanitizeIdentity(deps.mapIdentityProvider());
  const mismatchReason = classifyIdentityMismatch(internal.boundIdentity, currentIdentity);
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

  const ownerIdentity = deps.lifecycleIdentityProvider(internal.lifecycleOwner) ?? {};
  const lifecycleOwnerId =
    ownerIdentity.lifecycleOwnerId == null ? null : String(ownerIdentity.lifecycleOwnerId);
  const lifecycleGenerationId =
    ownerIdentity.lifecycleGenerationId == null
      ? null
      : String(ownerIdentity.lifecycleGenerationId);
  const surfaceOwnerId =
    ownerIdentity.surfaceOwnerId == null ? null : String(ownerIdentity.surfaceOwnerId);

  if (!lifecycleOwnerId) {
    state.lastFailureReason = "MISSING_LIFECYCLE_OWNER";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("MISSING_LIFECYCLE_OWNER"), {
      reasonCode: "MISSING_LIFECYCLE_OWNER"
    });
  }

  if (lifecycleOwnerId !== state.lifecycleOwnerId) {
    state.lastFailureReason = "LIFECYCLE_OWNER_ID_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("LIFECYCLE_OWNER_ID_MISMATCH"), {
      reasonCode: "LIFECYCLE_OWNER_ID_MISMATCH"
    });
  }

  if (lifecycleGenerationId !== state.lifecycleGenerationId) {
    state.lastFailureReason = "LIFECYCLE_GENERATION_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("LIFECYCLE_GENERATION_MISMATCH"), {
      reasonCode: "LIFECYCLE_GENERATION_MISMATCH"
    });
  }

  if (surfaceOwnerId !== state.surfaceOwnerId) {
    state.lastFailureReason = "SURFACE_OWNER_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SURFACE_OWNER_MISMATCH"), {
      reasonCode: "SURFACE_OWNER_MISMATCH"
    });
  }

  state.translationAttemptCount += 1;
  try {
    const translated = deps.lifecycleTranslationProvider({
      lifecycleOwner: internal.lifecycleOwner,
      identity: currentIdentity,
      metadata: deepFreeze({
        lifecycleOwnerId: state.lifecycleOwnerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      })
    });
    const sanitizedTranslation = sanitizeTranslation(translated);
    validateTranslationIdentity(state, sanitizedTranslation);
    internal.translation = sanitizedTranslation;
    state.translationCompletedCount += 1;
    state.cycleSafeTranslationUsed = true;
  } catch (error) {
    const reasonCode = toReasonCode(error, "LIFECYCLE_TRANSLATION_UNAVAILABLE");
    state.rawBrowserReferenceDetected =
      reasonCode === "RAW_BROWSER_REFERENCE_DETECTED";
    state.lastFailureReason = reasonCode;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }

  state.validationCompletedCount += 1;
  state.lastFailureReason = null;
  setState(provider, "ready");
  return buildExposedSummary(state);
}

export function reusePersistentAtlasLifecycleOwner(provider, expectedIdentity = null) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
    });
  }

  state.reuseAttemptCount += 1;

  if (state.releaseInProgress) {
    state.lastFailureReason = "LIFECYCLE_RELEASE_IN_PROGRESS";
    throw Object.assign(new Error("LIFECYCLE_RELEASE_IN_PROGRESS"), {
      reasonCode: "LIFECYCLE_RELEASE_IN_PROGRESS"
    });
  }

  validatePersistentAtlasLifecycleOwner(provider, expectedIdentity);
  state.reuseCompletedCount += 1;
  state.lastFailureReason = null;
  setState(provider, "ready");
  return buildExposedSummary(state);
}

export function releasePersistentAtlasLifecycleOwner(provider) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
    });
  }

  state.releaseAttemptCount += 1;

  if (
    state.released &&
    !internal.lifecycleOwner &&
    !internal.translation &&
    internal.releaseProgress.lifecycleReleased &&
    internal.releaseProgress.referencesReleased
  ) {
    state.lastFailureReason = null;
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  }

  const deps = readDeps(provider, [
    "lifecycleReleaseProvider",
    "referenceReleaseProvider"
  ]);

  setState(provider, "releasing");
  const failures = [];

  if (!internal.releaseProgress.lifecycleReleased && internal.lifecycleOwner) {
    state.lifecycleReleaseAttemptCount += 1;
    try {
      deps.lifecycleReleaseProvider({
        lifecycleOwnerId: state.lifecycleOwnerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      });
      internal.releaseProgress.lifecycleReleased = true;
      state.lifecycleReleaseCompletedCount += 1;
      internal.lifecycleOwner = null;
      internal.translation = null;
    } catch (error) {
      failures.push(toReasonCode(error, "LIFECYCLE_OWNER_RELEASE_FAILED"));
    }
  }

  if (!internal.releaseProgress.referencesReleased) {
    state.referenceReleaseAttemptCount += 1;
    try {
      deps.referenceReleaseProvider({
        lifecycleOwnerId: state.lifecycleOwnerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId,
        mapIdentityId: state.mapIdentityId,
        sessionId: state.sessionId
      });
      internal.releaseProgress.referencesReleased = true;
      state.referenceReleaseCompletedCount += 1;
    } catch (error) {
      failures.push(toReasonCode(error, "REFERENCE_RELEASE_FAILED"));
    }
  }

  syncState(provider);
  state.cleanupFailureReasons = [...new Set(failures)];
  state.cleanupFailed = failures.length > 0;
  state.cleanupCompleted =
    failures.length === 0 &&
    internal.releaseProgress.lifecycleReleased &&
    internal.releaseProgress.referencesReleased;

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
    failures.length > 0 ? failures[0] : "LIFECYCLE_RELEASE_INCOMPLETE";

  if (failures.length > 0) {
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason,
      cleanupFailureReasons: [...state.cleanupFailureReasons]
    });
  }

  throw Object.assign(new Error("LIFECYCLE_RELEASE_INCOMPLETE"), {
    reasonCode: "LIFECYCLE_RELEASE_INCOMPLETE"
  });
}

export function getPersistentAtlasLifecycleOwnerStatus(provider) {
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
      lifecycleOwnerId: null,
      lifecycleGenerationId: null,
      surfaceOwnerId: null,
      mapIdentityId: null,
      sessionId: null,
      lifecycleOwnerPresent: false,
      lifecycleTranslationPresent: false,
      ownedLifecycleOwnerCount: 0,
      acquisitionAttemptCount: 0,
      acquisitionCompletedCount: 0,
      translationAttemptCount: 0,
      translationCompletedCount: 0,
      validationAttemptCount: 0,
      validationCompletedCount: 0,
      reuseAttemptCount: 0,
      reuseCompletedCount: 0,
      releaseAttemptCount: 0,
      releaseCompletedCount: 0,
      lifecycleReleaseAttemptCount: 0,
      lifecycleReleaseCompletedCount: 0,
      referenceReleaseAttemptCount: 0,
      referenceReleaseCompletedCount: 0,
      rawBrowserReferenceDetected: false,
      cycleSafeTranslationUsed: false,
      cleanupCompleted: false,
      cleanupFailed: false,
      cleanupFailureReasons: [],
      referencesReleased: false,
      lastFailureReason: "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE",
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
