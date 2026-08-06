const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_AUTHORIZATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_AUTHORIZATION_RESULT_001";

export const AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION =
  "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

const IDENTITY_KEYS = [
  "sessionId",
  "mapIdentityId",
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

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function sanitizeIdentity(identity = {}) {
  const sanitized = {};

  for (const key of IDENTITY_KEYS) {
    const value = identity?.[key];
    sanitized[key] = value == null ? null : String(value);
  }

  return sanitized;
}

function hasMissingIdentity(identity) {
  const normalized = sanitizeIdentity(identity);
  return IDENTITY_KEYS.some((key) => normalized[key] == null);
}

function identitiesEqual(left, right) {
  const a = sanitizeIdentity(left);
  const b = sanitizeIdentity(right);
  return IDENTITY_KEYS.every((key) => a[key] === b[key]);
}

let persistentAtlasAuthorizationSessionCounter = 0;
function createDefaultSessionIdFactory() {
  return () => {
    persistentAtlasAuthorizationSessionCounter += 1;
    return `PERSISTENT_ATLAS_SESSION_${String(
      persistentAtlasAuthorizationSessionCounter
    ).padStart(3, "0")}`;
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    authorizationState: state.authorizationState,
    authorizationActive: state.authorizationActive,
    attachPermissionConsumed: state.attachPermissionConsumed,
    redrawPermissionAllowed: state.redrawPermissionAllowed,
    localDevelopmentHost: state.localDevelopmentHost,
    confirmationAccepted: state.confirmationAccepted,
    automaticAuthorization: false,
    persistentStorageUsed: false,
    sessionId: state.sessionId,
    authorizationSource: state.authorizationSource,
    authorizationCreatedAt: state.authorizationCreatedAt,
    expiryPolicyPresent: state.expiryPolicyPresent,
    expired: state.expired,
    revoked: state.revoked,
    invalidated: state.invalidated,
    invalidationReasonCode: state.invalidationReasonCode,
    boundIdentity: state.boundIdentity ? { ...sanitizeIdentity(state.boundIdentity) } : null,
    currentIdentityMatchesBoundIdentity: state.currentIdentityMatchesBoundIdentity,
    attachConsumeAttemptCount: state.attachConsumeAttemptCount,
    attachConsumeCompletedCount: state.attachConsumeCompletedCount,
    redrawValidationAttemptCount: state.redrawValidationAttemptCount,
    redrawValidationCompletedCount: state.redrawValidationCompletedCount,
    revokeAttemptCount: state.revokeAttemptCount,
    invalidateAttemptCount: state.invalidateAttemptCount,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
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
    authorizationStatus: freezeStatus(state),
    ...extra
  });
}

export function createControlledPersistentAtlasAuthorization({
  hostnameProvider = () => "",
  identityProvider = () => null,
  readinessProvider = () => ({ approved: true, reasonCode: "READINESS_APPROVED" }),
  controllerAttachmentStateProvider = () => ({ attached: false }),
  lifecycleOwnerStateProvider = () => ({ matches: true }),
  nowProvider = () => new Date().toISOString(),
  createSessionId = createDefaultSessionIdFactory(),
  expiryPolicy = null,
  authorizationSource = "developer_only_controlled_persistent_atlas"
} = {}) {
  const state = {
    authorizationState: "inactive",
    authorizationActive: false,
    attachPermissionConsumed: false,
    redrawPermissionAllowed: false,
    localDevelopmentHost: false,
    confirmationAccepted: false,
    sessionId: null,
    authorizationSource,
    authorizationCreatedAt: null,
    expiryPolicyPresent: typeof expiryPolicy === "function",
    expired: false,
    revoked: false,
    invalidated: false,
    invalidationReasonCode: null,
    boundIdentity: null,
    currentIdentityMatchesBoundIdentity: false,
    attachConsumeAttemptCount: 0,
    attachConsumeCompletedCount: 0,
    redrawValidationAttemptCount: 0,
    redrawValidationCompletedCount: 0,
    revokeAttemptCount: 0,
    invalidateAttemptCount: 0,
    lastFailureReason: null
  };

  function updateDerivedFlags() {
    state.redrawPermissionAllowed =
      state.authorizationActive &&
      state.attachPermissionConsumed &&
      state.authorizationState === "attach_permission_consumed" &&
      state.expired === false &&
      state.revoked === false &&
      state.invalidated === false &&
      state.currentIdentityMatchesBoundIdentity === true;
  }

  function setFailure(reasonCode) {
    state.lastFailureReason = reasonCode;
    updateDerivedFlags();
    return reasonCode;
  }

  function markExpiredIfNeeded() {
    if (state.expired === true) {
      state.authorizationState = "expired";
      state.authorizationActive = false;
      state.lastFailureReason = "AUTHORIZATION_EXPIRED";
      updateDerivedFlags();
      return true;
    }

    if (!state.authorizationActive || typeof expiryPolicy !== "function") {
      return false;
    }

    const expired = expiryPolicy({
      sessionId: state.sessionId,
      authorizationCreatedAt: state.authorizationCreatedAt,
      boundIdentity: state.boundIdentity ? { ...sanitizeIdentity(state.boundIdentity) } : null
    }) === true;

    state.expired = expired;
    if (expired) {
      state.authorizationState = "expired";
      state.authorizationActive = false;
      setFailure("AUTHORIZATION_EXPIRED");
    }

    return expired;
  }

  function refreshIdentityMatch(currentIdentity = null) {
    if (!state.boundIdentity) {
      state.currentIdentityMatchesBoundIdentity = false;
      return false;
    }

    const identity = sanitizeIdentity(currentIdentity ?? identityProvider());
    const matches = identitiesEqual(identity, state.boundIdentity);
    state.currentIdentityMatchesBoundIdentity = matches;
    return matches;
  }

  function getStatus() {
    markExpiredIfNeeded();
    refreshIdentityMatch();
    updateDerivedFlags();
    return freezeStatus(state);
  }

  function authorizePersistentAtlasSession({ confirmation } = {}) {
    state.localDevelopmentHost = isLocalDevelopmentHost(hostnameProvider());

    if (confirmation !== AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION) {
      return buildResult({
        operation: "authorizePersistentAtlasSession",
        outcome: "blocked",
        reasonCode: setFailure("INVALID_CONFIRMATION"),
        state
      });
    }

    if (!state.localDevelopmentHost) {
      return buildResult({
        operation: "authorizePersistentAtlasSession",
        outcome: "blocked",
        reasonCode: setFailure("NON_LOCAL_DEVELOPMENT_HOST"),
        state
      });
    }

    if (state.authorizationActive) {
      return buildResult({
        operation: "authorizePersistentAtlasSession",
        outcome: "blocked",
        reasonCode: setFailure("AUTHORIZATION_ALREADY_ACTIVE"),
        state
      });
    }

    const identity = sanitizeIdentity(identityProvider());
    if (hasMissingIdentity(identity)) {
      return buildResult({
        operation: "authorizePersistentAtlasSession",
        outcome: "failed_closed",
        reasonCode: setFailure("PERSISTENT_AUTHORIZATION_UNAVAILABLE"),
        state
      });
    }

    state.authorizationState = "authorizing";
    state.confirmationAccepted = true;

    const sessionId = String(createSessionId());
    const authorizationCreatedAt = String(nowProvider());

    state.sessionId = sessionId;
    state.authorizationCreatedAt = authorizationCreatedAt;
    state.boundIdentity = deepFreeze({
      ...identity
    });
    state.authorizationActive = true;
    state.attachPermissionConsumed = false;
    state.revoked = false;
    state.invalidated = false;
    state.expired = false;
    state.invalidationReasonCode = null;
    state.authorizationState = "active";
    state.currentIdentityMatchesBoundIdentity = true;
    state.lastFailureReason = null;
    updateDerivedFlags();

    return buildResult({
      operation: "authorizePersistentAtlasSession",
      outcome: "authorized",
      reasonCode: "AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION",
      state
    });
  }

  function consumePersistentAttachPermission() {
    state.attachConsumeAttemptCount += 1;
    markExpiredIfNeeded();

    if (!state.authorizationActive || !state.boundIdentity) {
      return buildResult({
        operation: "consumePersistentAttachPermission",
        outcome: "blocked",
        reasonCode: setFailure(
          state.authorizationState === "expired"
            ? "AUTHORIZATION_EXPIRED"
            : "PERSISTENT_AUTHORIZATION_UNAVAILABLE"
        ),
        state
      });
    }

    if (state.attachPermissionConsumed) {
      return buildResult({
        operation: "consumePersistentAttachPermission",
        outcome: "blocked",
        reasonCode: setFailure("ATTACH_PERMISSION_ALREADY_CONSUMED"),
        state
      });
    }

    refreshIdentityMatch();
    if (!state.currentIdentityMatchesBoundIdentity) {
      invalidatePersistentAtlasSession({ reasonCode: "IDENTITY_MISMATCH" });
      return buildResult({
        operation: "consumePersistentAttachPermission",
        outcome: "blocked",
        reasonCode: setFailure("IDENTITY_MISMATCH"),
        state
      });
    }

    state.attachPermissionConsumed = true;
    state.attachConsumeCompletedCount += 1;
    state.authorizationState = "attach_permission_consumed";
    updateDerivedFlags();

    return buildResult({
      operation: "consumePersistentAttachPermission",
      outcome: "consumed",
      reasonCode: "ATTACH_PERMISSION_CONSUMED",
      state
    });
  }

  function revokePersistentAtlasSession() {
    state.revokeAttemptCount += 1;
    state.revoked = true;
    state.authorizationActive = false;
    state.authorizationState = "revoked";
    state.invalidationReasonCode = null;
    updateDerivedFlags();

    return buildResult({
      operation: "revokePersistentAtlasSession",
      outcome: "revoked",
      reasonCode: setFailure("AUTHORIZATION_REVOKED"),
      state,
      extra: {
        detachRequiredByCaller: true
      }
    });
  }

  function invalidatePersistentAtlasSession({ reasonCode } = {}) {
    state.invalidateAttemptCount += 1;
    state.invalidated = true;
    state.authorizationActive = false;
    state.authorizationState = "invalidated";
    state.invalidationReasonCode = reasonCode ?? "AUTHORIZATION_INVALIDATED";
    updateDerivedFlags();

    return buildResult({
      operation: "invalidatePersistentAtlasSession",
      outcome: "invalidated",
      reasonCode: setFailure("AUTHORIZATION_INVALIDATED"),
      state,
      extra: {
        invalidationReasonCode: state.invalidationReasonCode,
        detachRequiredByCaller: true
      }
    });
  }

  function validatePersistentRedrawPermission() {
    state.redrawValidationAttemptCount += 1;
    markExpiredIfNeeded();

    if (!state.authorizationActive || !state.boundIdentity) {
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure(
          state.authorizationState === "revoked"
            ? "AUTHORIZATION_REVOKED"
            : state.authorizationState === "invalidated"
              ? "AUTHORIZATION_INVALIDATED"
              : state.authorizationState === "expired"
                ? "AUTHORIZATION_EXPIRED"
                : "PERSISTENT_AUTHORIZATION_UNAVAILABLE"
        ),
        state
      });
    }

    if (!state.attachPermissionConsumed) {
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure("ATTACH_PERMISSION_ALREADY_CONSUMED"),
        state
      });
    }

    const controllerState = controllerAttachmentStateProvider() ?? {};
    if (controllerState.attached !== true) {
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure("STALE_SESSION"),
        state
      });
    }

    const readiness = readinessProvider() ?? {};
    if (readiness.approved !== true) {
      invalidatePersistentAtlasSession({
        reasonCode: readiness.reasonCode ?? "READINESS_BLOCKED"
      });
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure("READINESS_BLOCKED"),
        state
      });
    }

    const lifecycleState = lifecycleOwnerStateProvider() ?? {};
    if (lifecycleState.matches === false) {
      invalidatePersistentAtlasSession({
        reasonCode: lifecycleState.reasonCode ?? "LIFECYCLE_OWNER_MISMATCH"
      });
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure(
          lifecycleState.reasonCode ?? "IDENTITY_MISMATCH"
        ),
        state
      });
    }

    const currentIdentity = sanitizeIdentity(identityProvider());
    if (hasMissingIdentity(currentIdentity)) {
      invalidatePersistentAtlasSession({ reasonCode: "IDENTITY_MISMATCH" });
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure("IDENTITY_MISMATCH"),
        state
      });
    }

    refreshIdentityMatch(currentIdentity);
    if (!state.currentIdentityMatchesBoundIdentity) {
      const driftReason = "IDENTITY_MISMATCH";

      invalidatePersistentAtlasSession({ reasonCode: driftReason });
      return buildResult({
        operation: "validatePersistentRedrawPermission",
        outcome: "blocked",
        reasonCode: setFailure(driftReason),
        state
      });
    }

    state.redrawValidationCompletedCount += 1;
    updateDerivedFlags();

    return buildResult({
      operation: "validatePersistentRedrawPermission",
      outcome: "allowed",
      reasonCode: "ATTACH_PERMISSION_CONSUMED",
      state
    });
  }

  const contract = {
    authorizePersistentAtlasSession,
    revokePersistentAtlasSession,
    invalidatePersistentAtlasSession,
    consumePersistentAttachPermission,
    validatePersistentRedrawPermission,
    getPersistentAtlasAuthorizationStatus: getStatus
  };

  return contract;
}

export function authorizePersistentAtlasSession(contract, ...args) {
  return contract.authorizePersistentAtlasSession(...args);
}

export function revokePersistentAtlasSession(contract, ...args) {
  return contract.revokePersistentAtlasSession(...args);
}

export function invalidatePersistentAtlasSession(contract, ...args) {
  return contract.invalidatePersistentAtlasSession(...args);
}

export function consumePersistentAttachPermission(contract, ...args) {
  return contract.consumePersistentAttachPermission(...args);
}

export function validatePersistentRedrawPermission(contract, ...args) {
  return contract.validatePersistentRedrawPermission(...args);
}

export function getPersistentAtlasAuthorizationStatus(contract, ...args) {
  return contract.getPersistentAtlasAuthorizationStatus(...args);
}
