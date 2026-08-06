import {
  getPersistentAtlasAuthorizationStatus,
  consumePersistentAttachPermission,
  validatePersistentRedrawPermission,
  revokePersistentAtlasSession,
  invalidatePersistentAtlasSession
} from "./developer-only-controlled-persistent-atlas-authorization.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_AUTHORIZATION_PROVIDER_STATUS_001";
const SNAPSHOT_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_AUTHORIZATION_PROVIDER_SNAPSHOT_001";
const PERSISTENT_AUTHORIZATION_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_AUTHORIZATION_STATUS_001";
const ONE_FRAME_AUTHORIZATION_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001";
const ONE_FRAME_CONFIRMATION =
  "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION";

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

function isFunction(value) {
  return typeof value === "function";
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
    regionId: identity?.regionId ?? null,
    packageId: identity?.packageId ?? null,
    packageVersion: identity?.packageVersion ?? null,
    packageFingerprint: identity?.packageFingerprint ?? null,
    recipeId: identity?.recipeId ?? null,
    recipeVersion: identity?.recipeVersion ?? null,
    selectorSeed: identity?.selectorSeed ?? null
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    providerReady: state.providerReady,
    authorizationResolved: state.authorizationResolved,
    authorizationState: state.authorizationState,
    authorizationActive: state.authorizationActive,
    attachPermissionConsumed: state.attachPermissionConsumed,
    redrawPermissionAllowed: state.redrawPermissionAllowed,
    detachRequired: state.detachRequired,
    sessionId: state.sessionId,
    authorizationSource: state.authorizationSource,
    authorizationCreatedAt: state.authorizationCreatedAt,
    revoked: state.revoked,
    invalidated: state.invalidated,
    expired: state.expired,
    invalidationReasonCode: state.invalidationReasonCode,
    mapIdentityId: state.mapIdentityId,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed,
    lifecycleOwnerId: state.lifecycleOwnerId,
    resolveAttemptCount: state.resolveAttemptCount,
    resolveCompletedCount: state.resolveCompletedCount,
    attachConsumeAttemptCount: state.attachConsumeAttemptCount,
    attachConsumeCompletedCount: state.attachConsumeCompletedCount,
    redrawValidationAttemptCount: state.redrawValidationAttemptCount,
    redrawValidationCompletedCount: state.redrawValidationCompletedCount,
    revokeAttemptCount: state.revokeAttemptCount,
    revokeCompletedCount: state.revokeCompletedCount,
    invalidateAttemptCount: state.invalidateAttemptCount,
    invalidateCompletedCount: state.invalidateCompletedCount,
    oneFrameAuthorizationDetected: state.oneFrameAuthorizationDetected,
    oneFrameAuthorizationAccepted: false,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function updateStateFromPersistentStatus(state, status, lifecycleOwnerId = null) {
  const identity = sanitizeIdentity(status?.boundIdentity ?? {});
  state.authorizationState = status?.authorizationState ?? "inactive";
  state.authorizationActive = status?.authorizationActive === true;
  state.attachPermissionConsumed = status?.attachPermissionConsumed === true;
  state.redrawPermissionAllowed = status?.redrawPermissionAllowed === true;
  state.sessionId = status?.sessionId == null ? null : String(status.sessionId);
  state.authorizationSource =
    status?.authorizationSource == null ? null : String(status.authorizationSource);
  state.authorizationCreatedAt =
    status?.authorizationCreatedAt == null
      ? null
      : String(status.authorizationCreatedAt);
  state.revoked = status?.revoked === true;
  state.invalidated = status?.invalidated === true;
  state.expired = status?.expired === true;
  state.invalidationReasonCode =
    status?.invalidationReasonCode == null
      ? null
      : String(status.invalidationReasonCode);
  state.mapIdentityId =
    identity.mapIdentityId == null ? null : String(identity.mapIdentityId);
  state.regionId = identity.regionId == null ? null : String(identity.regionId);
  state.packageId = identity.packageId == null ? null : String(identity.packageId);
  state.packageVersion =
    identity.packageVersion == null ? null : String(identity.packageVersion);
  state.packageFingerprint =
    identity.packageFingerprint == null
      ? null
      : String(identity.packageFingerprint);
  state.recipeId = identity.recipeId == null ? null : String(identity.recipeId);
  state.recipeVersion =
    identity.recipeVersion == null ? null : String(identity.recipeVersion);
  state.selectorSeed =
    identity.selectorSeed == null ? null : String(identity.selectorSeed);
  state.lifecycleOwnerId =
    lifecycleOwnerId == null ? null : String(lifecycleOwnerId);
  state.detachRequired = state.revoked || state.invalidated;
}

function buildSnapshot(state) {
  return deepFreeze({
    schemaId: SNAPSHOT_SCHEMA_ID,
    authorizationState: state.authorizationState,
    authorizationActive: state.authorizationActive,
    attachPermissionConsumed: state.attachPermissionConsumed,
    redrawPermissionAllowed: state.redrawPermissionAllowed,
    detachRequired: state.detachRequired,
    sessionId: state.sessionId,
    authorizationSource: state.authorizationSource,
    authorizationCreatedAt: state.authorizationCreatedAt,
    revoked: state.revoked,
    invalidated: state.invalidated,
    expired: state.expired,
    invalidationReasonCode: state.invalidationReasonCode,
    mapIdentityId: state.mapIdentityId,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed,
    lifecycleOwnerId: state.lifecycleOwnerId
  });
}

function throwReason(state, reasonCode, extra = {}) {
  state.lastFailureReason = reasonCode;
  throw Object.assign(new Error(reasonCode), { reasonCode, ...extra });
}

function assertNotOneFrameInput(state, { confirmation = null, authorizationStatus = null } = {}) {
  if (confirmation === ONE_FRAME_CONFIRMATION) {
    state.oneFrameAuthorizationDetected = true;
    throwReason(state, "ONE_FRAME_AUTHORIZATION_REJECTED");
  }

  if (authorizationStatus?.schemaId === ONE_FRAME_AUTHORIZATION_SCHEMA_ID) {
    state.oneFrameAuthorizationDetected = true;
    throwReason(state, "ONE_FRAME_AUTHORIZATION_REJECTED");
  }
}

function readContractStatus(provider, options = {}) {
  const state = provider.__state;
  const contract = provider.__contract;

  assertNotOneFrameInput(state, options);

  const contractLooksValid =
    contract &&
    isFunction(contract.getPersistentAtlasAuthorizationStatus) &&
    isFunction(contract.consumePersistentAttachPermission) &&
    isFunction(contract.validatePersistentRedrawPermission) &&
    isFunction(contract.revokePersistentAtlasSession) &&
    isFunction(contract.invalidatePersistentAtlasSession);

  state.providerReady = contractLooksValid;

  if (!contractLooksValid) {
    throwReason(state, "AUTHORIZATION_PROVIDER_UNAVAILABLE");
  }

  let status;
  try {
    status = getPersistentAtlasAuthorizationStatus(contract);
  } catch (error) {
    throwReason(state, toReasonCode(error, "PERSISTENT_AUTHORIZATION_UNAVAILABLE"));
  }

  if (status?.schemaId === ONE_FRAME_AUTHORIZATION_SCHEMA_ID) {
    state.oneFrameAuthorizationDetected = true;
    throwReason(state, "ONE_FRAME_AUTHORIZATION_REJECTED");
  }

  if (status?.schemaId !== PERSISTENT_AUTHORIZATION_SCHEMA_ID) {
    throwReason(state, "PERSISTENT_AUTHORIZATION_UNAVAILABLE");
  }

  updateStateFromPersistentStatus(state, status, options.lifecycleOwnerId ?? null);
  return status;
}

function compareSession(state, status, sessionId) {
  if (sessionId != null && String(sessionId) !== String(status.sessionId ?? "")) {
    throwReason(state, "SESSION_IDENTITY_MISMATCH");
  }
}

function compareIdentity(state, expectedIdentity) {
  if (!expectedIdentity) {
    return;
  }

  const normalized = sanitizeIdentity(expectedIdentity);
  const bound = sanitizeIdentity({
    mapIdentityId: state.mapIdentityId,
    regionId: state.regionId,
    packageId: state.packageId,
    packageVersion: state.packageVersion,
    packageFingerprint: state.packageFingerprint,
    recipeId: state.recipeId,
    recipeVersion: state.recipeVersion,
    selectorSeed: state.selectorSeed
  });

  if (
    normalized.mapIdentityId != null &&
    String(normalized.mapIdentityId) !== String(bound.mapIdentityId ?? "")
  ) {
    throwReason(state, "MAP_IDENTITY_MISMATCH");
  }

  const identityFields = [
    "regionId",
    "packageId",
    "packageVersion",
    "packageFingerprint",
    "recipeId",
    "recipeVersion"
  ];

  for (const field of identityFields) {
    if (
      normalized[field] != null &&
      String(normalized[field]) !== String(bound[field] ?? "")
    ) {
      if (field === "regionId") {
        throwReason(state, "READINESS_IDENTITY_MISMATCH");
      }

      if (
        field === "packageId" ||
        field === "packageVersion" ||
        field === "packageFingerprint"
      ) {
        throwReason(state, "READINESS_IDENTITY_MISMATCH");
      }

      throwReason(state, "READINESS_IDENTITY_MISMATCH");
    }
  }

  if (
    normalized.selectorSeed != null &&
    String(normalized.selectorSeed) !== String(bound.selectorSeed ?? "")
  ) {
    throwReason(state, "READINESS_IDENTITY_MISMATCH");
  }
}

function compareReadiness(state, readinessSnapshot) {
  if (!readinessSnapshot) {
    return;
  }

  compareIdentity(state, readinessSnapshot);
}

export function createPersistentAtlasAuthorizationProvider({
  persistentAuthorizationContract = unavailable("AUTHORIZATION_PROVIDER_UNAVAILABLE")
} = {}) {
  const state = {
    providerReady: false,
    authorizationResolved: false,
    authorizationState: "inactive",
    authorizationActive: false,
    attachPermissionConsumed: false,
    redrawPermissionAllowed: false,
    detachRequired: false,
    sessionId: null,
    authorizationSource: null,
    authorizationCreatedAt: null,
    revoked: false,
    invalidated: false,
    expired: false,
    invalidationReasonCode: null,
    mapIdentityId: null,
    regionId: null,
    packageId: null,
    packageVersion: null,
    packageFingerprint: null,
    recipeId: null,
    recipeVersion: null,
    selectorSeed: null,
    lifecycleOwnerId: null,
    resolveAttemptCount: 0,
    resolveCompletedCount: 0,
    attachConsumeAttemptCount: 0,
    attachConsumeCompletedCount: 0,
    redrawValidationAttemptCount: 0,
    redrawValidationCompletedCount: 0,
    revokeAttemptCount: 0,
    revokeCompletedCount: 0,
    invalidateAttemptCount: 0,
    invalidateCompletedCount: 0,
    oneFrameAuthorizationDetected: false,
    lastFailureReason: null
  };

  return Object.freeze({
    __growgoPersistentAtlasAuthorizationProvider: true,
    __contract: persistentAuthorizationContract,
    __state: state
  });
}

export function resolvePersistentAtlasAuthorization(
  provider,
  {
    sessionId = null,
    identity = null,
    lifecycleOwnerId = null,
    confirmation = null,
    authorizationStatus = null
  } = {}
) {
  const state = provider?.__state;
  if (!state) {
    throw Object.assign(new Error("AUTHORIZATION_PROVIDER_UNAVAILABLE"), {
      reasonCode: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  state.resolveAttemptCount += 1;
  const status = readContractStatus(provider, {
    confirmation,
    authorizationStatus,
    lifecycleOwnerId
  });

  if (status.authorizationActive !== true) {
    const reasonCode =
      status.revoked === true
        ? "AUTHORIZATION_REVOKED"
        : status.invalidated === true
          ? status.invalidationReasonCode ?? "AUTHORIZATION_INVALIDATED"
          : status.expired === true
            ? "AUTHORIZATION_EXPIRED"
            : "AUTHORIZATION_INACTIVE";
    throwReason(state, reasonCode);
  }

  compareSession(state, status, sessionId);
  compareIdentity(state, identity);

  state.authorizationResolved = true;
  state.resolveCompletedCount += 1;
  state.lastFailureReason = null;
  return buildSnapshot(state);
}

export function consumePersistentAtlasAttachPermission(
  provider,
  {
    sessionId = null,
    identity = null,
    confirmation = null,
    authorizationStatus = null
  } = {}
) {
  const state = provider?.__state;
  if (!state) {
    throw Object.assign(new Error("AUTHORIZATION_PROVIDER_UNAVAILABLE"), {
      reasonCode: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  state.attachConsumeAttemptCount += 1;
  resolvePersistentAtlasAuthorization(provider, {
    sessionId,
    identity,
    confirmation,
    authorizationStatus
  });

  let result;
  try {
    result = consumePersistentAttachPermission(provider.__contract);
  } catch (error) {
    throwReason(state, toReasonCode(error, "PERSISTENT_AUTHORIZATION_UNAVAILABLE"));
  }

  const nextStatus = readContractStatus(provider);

  if (result?.outcome !== "consumed") {
    const reasonCode =
      result?.reasonCode ??
      nextStatus?.invalidationReasonCode ??
      nextStatus?.lastFailureReason ??
      "PERSISTENT_AUTHORIZATION_UNAVAILABLE";
    throwReason(state, reasonCode);
  }

  state.authorizationResolved = true;
  state.attachConsumeCompletedCount += 1;
  state.lastFailureReason = null;
  return buildSnapshot(state);
}

export function validatePersistentAtlasRedrawAuthorization(
  provider,
  {
    sessionId = null,
    identity = null,
    readinessSnapshot = null,
    controllerAttached = true,
    lifecycleOwnerId = null,
    lifecycleOwnerMatches = true,
    confirmation = null,
    authorizationStatus = null
  } = {}
) {
  const state = provider?.__state;
  if (!state) {
    throw Object.assign(new Error("AUTHORIZATION_PROVIDER_UNAVAILABLE"), {
      reasonCode: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  state.redrawValidationAttemptCount += 1;
  resolvePersistentAtlasAuthorization(provider, {
    sessionId,
    identity,
    lifecycleOwnerId,
    confirmation,
    authorizationStatus
  });

  if (state.attachPermissionConsumed !== true) {
    throwReason(state, "REDRAW_PERMISSION_DENIED");
  }

  if (controllerAttached !== true) {
    throwReason(state, "REDRAW_PERMISSION_DENIED");
  }

  compareReadiness(state, readinessSnapshot);

  if (lifecycleOwnerMatches === false) {
    invalidatePersistentAtlasAuthorization(provider, {
      reasonCode: "LIFECYCLE_OWNER_MISMATCH"
    });
    throwReason(state, "LIFECYCLE_OWNER_MISMATCH");
  }

  if (
    lifecycleOwnerId != null &&
    state.lifecycleOwnerId != null &&
    String(lifecycleOwnerId) !== String(state.lifecycleOwnerId)
  ) {
    invalidatePersistentAtlasAuthorization(provider, {
      reasonCode: "LIFECYCLE_OWNER_MISMATCH"
    });
    throwReason(state, "LIFECYCLE_OWNER_MISMATCH");
  }

  let result;
  try {
    result = validatePersistentRedrawPermission(provider.__contract);
  } catch (error) {
    throwReason(state, toReasonCode(error, "REDRAW_PERMISSION_DENIED"));
  }

  readContractStatus(provider, { lifecycleOwnerId });

  if (result?.outcome !== "allowed") {
    const reasonCode =
      result?.reasonCode ??
      state.invalidationReasonCode ??
      state.lastFailureReason ??
      "REDRAW_PERMISSION_DENIED";
    throwReason(state, reasonCode);
  }

  state.redrawValidationCompletedCount += 1;
  state.lastFailureReason = null;
  return buildSnapshot(state);
}

export function revokePersistentAtlasAuthorization(provider) {
  const state = provider?.__state;
  if (!state || !provider?.__contract) {
    throw Object.assign(new Error("AUTHORIZATION_PROVIDER_UNAVAILABLE"), {
      reasonCode: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  state.revokeAttemptCount += 1;
  let result;
  try {
    result = revokePersistentAtlasSession(provider.__contract);
  } catch (error) {
    throwReason(state, toReasonCode(error, "AUTHORIZATION_REVOKED"));
  }

  readContractStatus(provider);
  state.detachRequired = true;
  state.revokeCompletedCount += 1;
  state.lastFailureReason = null;
  return deepFreeze({
    reasonCode: result?.reasonCode ?? "AUTHORIZATION_REVOKED",
    detachRequired: true,
    snapshot: buildSnapshot(state)
  });
}

export function invalidatePersistentAtlasAuthorization(
  provider,
  {
    reasonCode = "AUTHORIZATION_INVALIDATED"
  } = {}
) {
  const state = provider?.__state;
  if (!state || !provider?.__contract) {
    throw Object.assign(new Error("AUTHORIZATION_PROVIDER_UNAVAILABLE"), {
      reasonCode: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  state.invalidateAttemptCount += 1;
  let result;
  try {
    result = invalidatePersistentAtlasSession(provider.__contract, { reasonCode });
  } catch (error) {
    throwReason(state, toReasonCode(error, "AUTHORIZATION_INVALIDATED"));
  }

  readContractStatus(provider);
  state.detachRequired = true;
  state.invalidateCompletedCount += 1;
  state.lastFailureReason = null;
  return deepFreeze({
    reasonCode: result?.reasonCode ?? "AUTHORIZATION_INVALIDATED",
    invalidationReasonCode:
      result?.invalidationReasonCode ?? reasonCode,
    detachRequired: true,
    snapshot: buildSnapshot(state)
  });
}

export function getPersistentAtlasAuthorizationProviderStatus(provider) {
  const state = provider?.__state;

  if (!state) {
    return freezeStatus({
      providerReady: false,
      authorizationResolved: false,
      authorizationState: "inactive",
      authorizationActive: false,
      attachPermissionConsumed: false,
      redrawPermissionAllowed: false,
      detachRequired: false,
      sessionId: null,
      authorizationSource: null,
      authorizationCreatedAt: null,
      revoked: false,
      invalidated: false,
      expired: false,
      invalidationReasonCode: null,
      mapIdentityId: null,
      regionId: null,
      packageId: null,
      packageVersion: null,
      packageFingerprint: null,
      recipeId: null,
      recipeVersion: null,
      selectorSeed: null,
      lifecycleOwnerId: null,
      resolveAttemptCount: 0,
      resolveCompletedCount: 0,
      attachConsumeAttemptCount: 0,
      attachConsumeCompletedCount: 0,
      redrawValidationAttemptCount: 0,
      redrawValidationCompletedCount: 0,
      revokeAttemptCount: 0,
      revokeCompletedCount: 0,
      invalidateAttemptCount: 0,
      invalidateCompletedCount: 0,
      oneFrameAuthorizationDetected: false,
      lastFailureReason: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    });
  }

  return freezeStatus(state);
}
