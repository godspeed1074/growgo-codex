const STATUS_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_READINESS_PROVIDER_STATUS_001";
const SNAPSHOT_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_READINESS_SNAPSHOT_001";

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

function normalizeIdentity(readiness) {
  return {
    regionId: readiness?.resolvedRegion?.regionId ?? null,
    packageId: readiness?.resolvedPackage?.packageId ?? null,
    packageVersion: readiness?.resolvedPackage?.packageVersion ?? null,
    packageFingerprint: readiness?.resolvedPackage?.packageFingerprint ?? null,
    recipeId: readiness?.resolvedRecipe?.recipeId ?? null,
    recipeVersion:
      readiness?.resolvedRecipe?.recipeVersion ??
      readiness?.resolvedRecipe?.selectedVersion ??
      null,
    selectorSeed: readiness?.selectorSeed ?? null
  };
}

function identityComplete(identity) {
  return Object.values(identity).every((value) => value != null && String(value).trim() !== "");
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    providerReady: state.providerReady,
    readinessResolved: state.readinessResolved,
    readinessApproved: state.readinessApproved,
    readinessValid: state.readinessValid,
    readinessDriftDetected: state.readinessDriftDetected,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed,
    lastBlockedReason: state.lastBlockedReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function createSnapshot(readiness, identity) {
  return deepFreeze({
    schemaId: SNAPSHOT_SCHEMA_ID,
    approved: true,
    reasonCode: readiness?.reasonCode ?? "READINESS_APPROVED",
    regionId: String(identity.regionId),
    packageId: String(identity.packageId),
    packageVersion: String(identity.packageVersion),
    packageFingerprint: String(identity.packageFingerprint),
    recipeId: String(identity.recipeId),
    recipeVersion: String(identity.recipeVersion),
    selectorSeed: String(identity.selectorSeed),
    identitySource: "atlas_renderer_handoff_readiness"
  });
}

function compareSnapshots(left, right) {
  for (const key of [
    "regionId",
    "packageId",
    "packageVersion",
    "packageFingerprint",
    "recipeId",
    "recipeVersion",
    "selectorSeed"
  ]) {
    if (left?.[key] !== right?.[key]) {
      return key;
    }
  }

  return null;
}

export function createPersistentAtlasReadinessProvider({
  handoffReadinessProvider = unavailable("READINESS_PROVIDER_UNAVAILABLE")
} = {}) {
  const state = {
    providerReady: isAvailableFunction(handoffReadinessProvider),
    readinessResolved: false,
    readinessApproved: false,
    readinessValid: false,
    readinessDriftDetected: false,
    regionId: null,
    packageId: null,
    packageVersion: null,
    packageFingerprint: null,
    recipeId: null,
    recipeVersion: null,
    selectorSeed: null,
    lastBlockedReason: null,
    lastFailureReason: null
  };

  return Object.freeze({
    __growgoPersistentAtlasReadinessProvider: true,
    __provider: handoffReadinessProvider,
    __state: state
  });
}

export function resolvePersistentAtlasReadiness(provider) {
  const state = provider?.__state;
  const readinessProvider = provider?.__provider;

  if (!state || !isAvailableFunction(readinessProvider)) {
    if (state) {
      state.providerReady = false;
      state.lastFailureReason = "READINESS_PROVIDER_UNAVAILABLE";
    }
    throw Object.assign(new Error("READINESS_PROVIDER_UNAVAILABLE"), {
      reasonCode: "READINESS_PROVIDER_UNAVAILABLE"
    });
  }

  state.providerReady = true;
  state.readinessDriftDetected = false;

  let readiness;
  try {
    readiness = readinessProvider();
  } catch (error) {
    const reasonCode = toReasonCode(error, "READINESS_PROVIDER_UNAVAILABLE");
    state.lastFailureReason = reasonCode;
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }

  if (!readiness || typeof readiness !== "object") {
    state.lastFailureReason = "INVALID_READINESS_SHAPE";
    throw Object.assign(new Error("INVALID_READINESS_SHAPE"), {
      reasonCode: "INVALID_READINESS_SHAPE"
    });
  }

  const blockedReason =
    readiness?.reasonCode ??
    readiness?.rendererHandoff?.reasonCode ??
    "READINESS_BLOCKED";

  const approved =
    readiness?.diagnosticStatus === "approved" &&
    readiness?.rendererHandoffStatus === "ready_for_future_renderer_attachment" &&
    readiness?.rendererConsumerAvailable === true &&
    readiness?.rendererIdentityValidated === true;

  if (!approved) {
    state.readinessResolved = true;
    state.readinessApproved = false;
    state.readinessValid = false;
    state.lastBlockedReason = blockedReason;
    state.lastFailureReason = blockedReason;
    throw Object.assign(new Error(blockedReason), {
      reasonCode: blockedReason
    });
  }

  const identity = normalizeIdentity(readiness);
  if (!identityComplete(identity)) {
    state.readinessResolved = true;
    state.readinessApproved = true;
    state.readinessValid = false;
    state.lastFailureReason = "READINESS_IDENTITY_INCOMPLETE";
    throw Object.assign(new Error("READINESS_IDENTITY_INCOMPLETE"), {
      reasonCode: "READINESS_IDENTITY_INCOMPLETE"
    });
  }

  const snapshot = createSnapshot(readiness, identity);

  state.readinessResolved = true;
  state.readinessApproved = true;
  state.readinessValid = true;
  state.regionId = snapshot.regionId;
  state.packageId = snapshot.packageId;
  state.packageVersion = snapshot.packageVersion;
  state.packageFingerprint = snapshot.packageFingerprint;
  state.recipeId = snapshot.recipeId;
  state.recipeVersion = snapshot.recipeVersion;
  state.selectorSeed = snapshot.selectorSeed;
  state.lastBlockedReason = null;
  state.lastFailureReason = null;

  return snapshot;
}

export function validatePersistentAtlasReadiness(
  provider,
  {
    expectedSnapshot = null
  } = {}
) {
  const snapshot = resolvePersistentAtlasReadiness(provider);
  const state = provider?.__state;

  if (expectedSnapshot) {
    const mismatchField = compareSnapshots(snapshot, expectedSnapshot);
    if (mismatchField) {
      state.readinessValid = false;
      state.readinessDriftDetected = true;
      state.lastFailureReason = "READINESS_DRIFT_DETECTED";
      throw Object.assign(new Error("READINESS_DRIFT_DETECTED"), {
        reasonCode: "READINESS_DRIFT_DETECTED",
        mismatchField
      });
    }
  }

  state.readinessValid = true;
  state.readinessDriftDetected = false;
  state.lastFailureReason = null;
  return snapshot;
}

export function getPersistentAtlasReadinessStatus(provider) {
  const state = provider?.__state;

  if (!state) {
    return freezeStatus({
      providerReady: false,
      readinessResolved: false,
      readinessApproved: false,
      readinessValid: false,
      readinessDriftDetected: false,
      regionId: null,
      packageId: null,
      packageVersion: null,
      packageFingerprint: null,
      recipeId: null,
      recipeVersion: null,
      selectorSeed: null,
      lastBlockedReason: null,
      lastFailureReason: "READINESS_PROVIDER_UNAVAILABLE"
    });
  }

  return freezeStatus(state);
}
