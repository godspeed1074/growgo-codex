const STATUS_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_IDENTITY_PROVIDER_STATUS_001";
const IDENTITY_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_IDENTITY_SNAPSHOT_001";

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

function normalizeSnapshotInput(input = {}) {
  const readiness = input.readinessSnapshot ?? input.readiness ?? {};
  return {
    sessionId: input.sessionId == null ? null : String(input.sessionId),
    mapIdentityId: input.mapIdentityId == null ? null : String(input.mapIdentityId),
    regionId: readiness?.regionId == null ? null : String(readiness.regionId),
    packageId: readiness?.packageId == null ? null : String(readiness.packageId),
    packageVersion:
      readiness?.packageVersion == null ? null : String(readiness.packageVersion),
    packageFingerprint:
      readiness?.packageFingerprint == null
        ? null
        : String(readiness.packageFingerprint),
    recipeId: readiness?.recipeId == null ? null : String(readiness.recipeId),
    recipeVersion:
      readiness?.recipeVersion == null ? null : String(readiness.recipeVersion),
    selectorSeed: readiness?.selectorSeed == null ? null : String(readiness.selectorSeed),
    lifecycleOwnerId:
      input.lifecycleOwnerId == null ? null : String(input.lifecycleOwnerId),
    identityCreatedAt:
      input.identityCreatedAt == null ? null : String(input.identityCreatedAt),
    identitySource:
      input.identitySource == null ? null : String(input.identitySource)
  };
}

function isCompleteIdentity(snapshot) {
  return [
    "sessionId",
    "mapIdentityId",
    "regionId",
    "packageId",
    "packageVersion",
    "packageFingerprint",
    "recipeId",
    "recipeVersion",
    "selectorSeed",
    "identityCreatedAt",
    "identitySource"
  ].every((key) => snapshot[key] != null && snapshot[key] !== "");
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    providerReady: state.providerReady,
    identityCreated: state.identityCreated,
    identityValid: state.identityValid,
    lastMismatchField: state.lastMismatchField,
    lastFailureReason: state.lastFailureReason,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed,
    lifecycleOwnerId: state.lifecycleOwnerId,
    identityCreatedAt: state.identityCreatedAt,
    identitySource: state.identitySource,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createPersistentAtlasIdentitySnapshotProvider({
  identitySourceProvider = unavailable("IDENTITY_SOURCE_UNAVAILABLE"),
  nowProvider = () => new Date().toISOString(),
  identitySource = "persistent_atlas_map_readiness_binding"
} = {}) {
  const state = {
    providerReady: isAvailableFunction(identitySourceProvider),
    identityCreated: false,
    identityValid: false,
    lastMismatchField: null,
    lastFailureReason: null,
    sessionId: null,
    mapIdentityId: null,
    regionId: null,
    packageId: null,
    packageVersion: null,
    packageFingerprint: null,
    recipeId: null,
    recipeVersion: null,
    selectorSeed: null,
    lifecycleOwnerId: null,
    identityCreatedAt: null,
    identitySource: null
  };

  return Object.freeze({
    __growgoPersistentAtlasIdentityProvider: true,
    __identitySourceProvider: identitySourceProvider,
    __nowProvider: nowProvider,
    __identitySource: identitySource,
    __state: state
  });
}

export function createPersistentAtlasIdentitySnapshot(
  provider,
  overrideInput = null
) {
  const state = provider?.__state;

  if (!state) {
    throw Object.assign(new Error("IDENTITY_SOURCE_UNAVAILABLE"), {
      reasonCode: "IDENTITY_SOURCE_UNAVAILABLE"
    });
  }

  let sourceInput = overrideInput;
  if (sourceInput == null) {
    const sourceProvider = provider.__identitySourceProvider;
    state.providerReady = isAvailableFunction(sourceProvider);
    if (!state.providerReady) {
      state.lastFailureReason = "IDENTITY_SOURCE_UNAVAILABLE";
      throw Object.assign(new Error("IDENTITY_SOURCE_UNAVAILABLE"), {
        reasonCode: "IDENTITY_SOURCE_UNAVAILABLE"
      });
    }

    try {
      sourceInput = sourceProvider();
    } catch (error) {
      const reasonCode = toReasonCode(error, "IDENTITY_SOURCE_UNAVAILABLE");
      state.lastFailureReason = reasonCode;
      throw Object.assign(new Error(reasonCode), { reasonCode });
    }
  }

  const normalized = normalizeSnapshotInput({
    ...sourceInput,
    identityCreatedAt:
      sourceInput?.identityCreatedAt ?? provider.__nowProvider(),
    identitySource:
      sourceInput?.identitySource ?? provider.__identitySource
  });

  if (!isCompleteIdentity(normalized)) {
    state.identityCreated = false;
    state.identityValid = false;
    state.lastFailureReason = "IDENTITY_INCOMPLETE";
    throw Object.assign(new Error("IDENTITY_INCOMPLETE"), {
      reasonCode: "IDENTITY_INCOMPLETE"
    });
  }

  const snapshot = deepFreeze({
    schemaId: IDENTITY_SCHEMA_ID,
    sessionId: normalized.sessionId,
    mapIdentityId: normalized.mapIdentityId,
    regionId: normalized.regionId,
    packageId: normalized.packageId,
    packageVersion: normalized.packageVersion,
    packageFingerprint: normalized.packageFingerprint,
    recipeId: normalized.recipeId,
    recipeVersion: normalized.recipeVersion,
    selectorSeed: normalized.selectorSeed,
    lifecycleOwnerId: normalized.lifecycleOwnerId,
    identityCreatedAt: normalized.identityCreatedAt,
    identitySource: normalized.identitySource
  });

  state.identityCreated = true;
  state.identityValid = true;
  state.lastMismatchField = null;
  state.lastFailureReason = null;
  state.sessionId = snapshot.sessionId;
  state.mapIdentityId = snapshot.mapIdentityId;
  state.regionId = snapshot.regionId;
  state.packageId = snapshot.packageId;
  state.packageVersion = snapshot.packageVersion;
  state.packageFingerprint = snapshot.packageFingerprint;
  state.recipeId = snapshot.recipeId;
  state.recipeVersion = snapshot.recipeVersion;
  state.selectorSeed = snapshot.selectorSeed;
  state.lifecycleOwnerId = snapshot.lifecycleOwnerId;
  state.identityCreatedAt = snapshot.identityCreatedAt;
  state.identitySource = snapshot.identitySource;

  return snapshot;
}

export function comparePersistentAtlasIdentity(provider, leftInput, rightInput) {
  const state = provider?.__state;
  const left = normalizeSnapshotInput(leftInput);
  const right = normalizeSnapshotInput(rightInput);

  const comparisonOrder = [
    ["mapIdentityId", "MAP_IDENTITY_MISMATCH"],
    ["sessionId", "SESSION_IDENTITY_MISMATCH"],
    ["regionId", "REGION_IDENTITY_MISMATCH"],
    ["packageId", "PACKAGE_IDENTITY_MISMATCH"],
    ["packageVersion", "PACKAGE_IDENTITY_MISMATCH"],
    ["packageFingerprint", "PACKAGE_IDENTITY_MISMATCH"],
    ["recipeId", "RECIPE_IDENTITY_MISMATCH"],
    ["recipeVersion", "RECIPE_IDENTITY_MISMATCH"],
    ["selectorSeed", "SELECTOR_SEED_MISMATCH"]
  ];

  for (const [field, reasonCode] of comparisonOrder) {
    if (left[field] !== right[field]) {
      if (state) {
        state.lastMismatchField = field;
        state.lastFailureReason = reasonCode;
        state.identityValid = false;
      }

      return deepFreeze({
        matches: false,
        mismatchField: field,
        reasonCode
      });
    }
  }

  if (state) {
    state.lastMismatchField = null;
    state.lastFailureReason = null;
    state.identityValid = true;
  }

  return deepFreeze({
    matches: true,
    mismatchField: null,
    reasonCode: null
  });
}

export function getPersistentAtlasIdentityProviderStatus(provider) {
  const state = provider?.__state;

  if (!state) {
    return freezeStatus({
      providerReady: false,
      identityCreated: false,
      identityValid: false,
      lastMismatchField: null,
      lastFailureReason: "IDENTITY_SOURCE_UNAVAILABLE",
      sessionId: null,
      mapIdentityId: null,
      regionId: null,
      packageId: null,
      packageVersion: null,
      packageFingerprint: null,
      recipeId: null,
      recipeVersion: null,
      selectorSeed: null,
      lifecycleOwnerId: null,
      identityCreatedAt: null,
      identitySource: null
    });
  }

  return freezeStatus(state);
}
