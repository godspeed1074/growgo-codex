function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}

const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const REQUIRED_CONFIRMATION = "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION";
const REQUIRED_SCHEMA_ID = "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001";
const REQUIRED_DIAGNOSTIC_STATUS = "resolved";
const REQUIRED_REASON_CODE = "RESOLVED";
const REQUIRED_HANDOFF_STATUS = "ready_for_future_renderer_attachment";

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function defaultSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function buildOperationResult(operation, outcome, reasonCode, authorizationStatus, extra = {}) {
  return deepFreeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_OPERATION_RESULT_001",
    operation,
    outcome,
    reasonCode,
    authorizationStatus,
    ...extra
  });
}

function normalizeReadiness(readiness) {
  if (!readiness || typeof readiness !== "object") {
    return {
      ok: false,
      reasonCode: "MISSING_READINESS_RESULT",
      snapshot: null,
      safetyFlags: defaultSafetyFlags()
    };
  }

  const safetyFlags = deepFreeze({
    runtimeExecutionEnabled:
      readiness?.safetyFlagSnapshot?.runtimeExecutionEnabled ?? false,
    mapAttachmentAllowed:
      readiness?.safetyFlagSnapshot?.mapAttachmentAllowed ?? false,
    automaticRendererExecutionAllowed:
      readiness?.safetyFlagSnapshot?.automaticRendererExecutionAllowed ?? false,
    lifecycleExecutionEnabled:
      readiness?.safetyFlagSnapshot?.lifecycleExecutionEnabled ?? false
  });

  if (readiness.schemaId !== REQUIRED_SCHEMA_ID) {
    return {
      ok: false,
      reasonCode: "INVALID_READINESS_RESULT",
      snapshot: null,
      safetyFlags
    };
  }

  if (readiness.diagnosticStatus === "blocked") {
    return {
      ok: false,
      reasonCode: readiness.reasonCode ?? "INVALID_READINESS_RESULT",
      snapshot: null,
      safetyFlags
    };
  }

  if (
    readiness.diagnosticStatus !== REQUIRED_DIAGNOSTIC_STATUS ||
    readiness.reasonCode !== REQUIRED_REASON_CODE ||
    readiness.rendererHandoffStatus !== REQUIRED_HANDOFF_STATUS
  ) {
    const blockedHandoffReason =
      readiness?.rendererHandoffStatus === "blocked"
        ? readiness?.rendererHandoff?.reasonCode ?? readiness?.reasonCode ?? "INVALID_READINESS_RESULT"
        : null;
    return {
      ok: false,
      reasonCode: blockedHandoffReason ?? "INVALID_READINESS_RESULT",
      snapshot: null,
      safetyFlags
    };
  }

  if (readiness.rendererConsumerAvailable !== true) {
    return {
      ok: false,
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE",
      snapshot: null,
      safetyFlags
    };
  }

  if (readiness.rendererIdentityValidated !== true) {
    return {
      ok: false,
      reasonCode: "RENDERER_IDENTITY_MISMATCH",
      snapshot: null,
      safetyFlags
    };
  }

  const regionId = readiness?.resolvedRegion?.regionId ?? null;
  const packageId = readiness?.resolvedPackage?.packageId ?? null;
  const packageVersion = readiness?.resolvedPackage?.packageVersion ?? null;
  const packageFingerprint = readiness?.resolvedPackage?.packageFingerprint ?? null;
  const recipeId = readiness?.resolvedRecipe?.recipeId ?? null;
  const recipeVersion = readiness?.resolvedRecipe?.selectedVersion ?? null;
  const selectorSeed = readiness?.selectorSeed ?? null;

  if (
    !regionId ||
    !packageId ||
    !packageVersion ||
    !packageFingerprint ||
    !recipeId ||
    !recipeVersion ||
    !selectorSeed
  ) {
    return {
      ok: false,
      reasonCode: "INVALID_READINESS_RESULT",
      snapshot: null,
      safetyFlags
    };
  }

  return {
    ok: true,
    reasonCode: "READINESS_VALID",
    safetyFlags,
    snapshot: deepFreeze({
      regionId,
      packageId,
      packageVersion,
      packageFingerprint,
      recipeId,
      recipeVersion,
      selectorSeed,
      rendererConsumerAvailable: true,
      rendererIdentityValidated: true
    })
  };
}

function compareAuthorizationToReadiness(activeSession, normalizedReadiness) {
  if (!activeSession || !normalizedReadiness?.ok || !normalizedReadiness.snapshot) {
    return {
      matches: false,
      reasonCode: normalizedReadiness?.reasonCode ?? "MISSING_READINESS_RESULT"
    };
  }

  const current = normalizedReadiness.snapshot;

  if (current.regionId !== activeSession.boundRegionId) {
    return {
      matches: false,
      reasonCode: "REGION_ID_DRIFTED"
    };
  }

  if (current.packageId !== activeSession.boundPackageId) {
    return {
      matches: false,
      reasonCode: "PACKAGE_ID_DRIFTED"
    };
  }

  if (current.packageVersion !== activeSession.boundPackageVersion) {
    return {
      matches: false,
      reasonCode: "PACKAGE_VERSION_DRIFTED"
    };
  }

  if (current.packageFingerprint !== activeSession.boundPackageFingerprint) {
    return {
      matches: false,
      reasonCode: "PACKAGE_FINGERPRINT_DRIFTED"
    };
  }

  if (current.recipeId !== activeSession.boundRecipeId) {
    return {
      matches: false,
      reasonCode: "RECIPE_ID_DRIFTED"
    };
  }

  if (current.recipeVersion !== activeSession.boundRecipeVersion) {
    return {
      matches: false,
      reasonCode: "RECIPE_VERSION_DRIFTED"
    };
  }

  if (current.selectorSeed !== activeSession.boundSelectorSeed) {
    return {
      matches: false,
      reasonCode: "SELECTOR_SEED_DRIFTED"
    };
  }

  if (current.rendererConsumerAvailable !== true) {
    return {
      matches: false,
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE"
    };
  }

  if (current.rendererIdentityValidated !== true) {
    return {
      matches: false,
      reasonCode: "RENDERER_IDENTITY_MISMATCH"
    };
  }

  return {
    matches: true,
    reasonCode: "READINESS_MATCHED"
  };
}

function latchAuthorizationInvalidation(activeSession, normalizedReadiness, readinessComparison) {
  if (!activeSession || activeSession.authorizationConsumed === true) {
    return;
  }

  if (activeSession.authorizationInvalidated === true) {
    return;
  }

  const shouldInvalidate =
    !normalizedReadiness?.ok || readinessComparison?.matches !== true;

  if (!shouldInvalidate) {
    return;
  }

  const invalidationReasonCode =
    readinessComparison?.reasonCode ??
    normalizedReadiness?.reasonCode ??
    "INVALID_READINESS_RESULT";

  activeSession.authorizationInvalidated = true;
  activeSession.invalidationReasonCode = invalidationReasonCode;
  activeSession.invalidatedAtReadinessReasonCode = invalidationReasonCode;
}

export function createControlledOneSessionDeveloperRendererHandoffAuthorization(
  options = {}
) {
  const getHostname =
    options.getHostname ??
    (() => {
      if (
        typeof globalThis !== "undefined" &&
        globalThis?.location &&
        typeof globalThis.location.hostname === "string"
      ) {
        return globalThis.location.hostname;
      }
      return "";
    });
  const getCurrentReadiness = options.getCurrentReadiness ?? (() => null);
  const createSessionId =
    options.createSessionId ??
    (({ counter }) =>
      `ATLAS_RENDERER_HANDOFF_ONE_SESSION_${String(counter).padStart(3, "0")}`);

  let sessionCounter = 0;
  let activeSession = null;
  let authorizationRevoked = false;

  function buildAuthorizationStatus() {
    const hostname = getHostname();
    const localDevelopmentHost = isLocalDevelopmentHost(hostname);
    const readiness = getCurrentReadiness();
    const normalizedReadiness = normalizeReadiness(readiness);
    const safetyFlags = normalizedReadiness.safetyFlags ?? defaultSafetyFlags();
    const rawReadinessComparison = compareAuthorizationToReadiness(
      activeSession,
      normalizedReadiness
    );
    latchAuthorizationInvalidation(
      activeSession,
      normalizedReadiness,
      rawReadinessComparison
    );
    const readinessComparison =
      activeSession?.authorizationInvalidated === true
        ? {
            matches: false,
            reasonCode:
              activeSession.invalidationReasonCode ??
              rawReadinessComparison.reasonCode
          }
        : rawReadinessComparison;
    const authorizationActive =
      !!activeSession &&
      activeSession.authorizationConsumed !== true &&
      authorizationRevoked !== true;
    const currentReadinessMatchesAuthorization =
      authorizationActive && readinessComparison.matches === true;
    const permissionAllowed =
      authorizationActive &&
      localDevelopmentHost &&
      currentReadinessMatchesAuthorization &&
      safetyFlags.runtimeExecutionEnabled === false &&
      safetyFlags.mapAttachmentAllowed === false &&
      safetyFlags.automaticRendererExecutionAllowed === false &&
      safetyFlags.lifecycleExecutionEnabled === false;

    return deepFreeze({
      schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
      authorizationActive,
      authorizationSource: authorizationActive
        ? activeSession.authorizationSource
        : "canonical",
      localDevelopmentHost,
      confirmationAccepted: authorizationActive
        ? activeSession.confirmationAccepted
        : false,
      sessionId: activeSession?.sessionId ?? null,
      authorizationConsumed: activeSession?.authorizationConsumed ?? false,
      authorizationInvalidated: activeSession?.authorizationInvalidated ?? false,
      invalidationReasonCode: activeSession?.invalidationReasonCode ?? null,
      invalidatedAtReadinessReasonCode:
        activeSession?.invalidatedAtReadinessReasonCode ?? null,
      authorizationRevoked,
      approvedReadinessBound: !!activeSession,
      currentReadinessMatchesAuthorization,
      currentReadinessReasonCode: readinessComparison.reasonCode,
      boundRegionId: activeSession?.boundRegionId ?? null,
      boundPackageId: activeSession?.boundPackageId ?? null,
      boundPackageVersion: activeSession?.boundPackageVersion ?? null,
      boundPackageFingerprint: activeSession?.boundPackageFingerprint ?? null,
      boundRecipeId: activeSession?.boundRecipeId ?? null,
      boundRecipeVersion: activeSession?.boundRecipeVersion ?? null,
      boundSelectorSeed: activeSession?.boundSelectorSeed ?? null,
      rendererConsumerAvailable: normalizedReadiness.snapshot?.rendererConsumerAvailable ?? false,
      rendererIdentityValidated: normalizedReadiness.snapshot?.rendererIdentityValidated ?? false,
      canonicalRuntimeExecutionEnabled: safetyFlags.runtimeExecutionEnabled,
      canonicalMapAttachmentAllowed: safetyFlags.mapAttachmentAllowed,
      canonicalAutomaticRendererExecutionAllowed:
        safetyFlags.automaticRendererExecutionAllowed,
      canonicalLifecycleExecutionEnabled: safetyFlags.lifecycleExecutionEnabled,
      rendererInitializationAllowed: permissionAllowed,
      rendererAttachmentAllowed: permissionAllowed,
      drawAllowed: permissionAllowed,
      automaticAuthorization: false,
      automaticInvocation: false,
      persistentAuthorization: false,
      storageUsed: false,
      rendererInitialized: false,
      rendererAttached: false,
      drawRequested: false,
      canvasCreated: false,
      webglContextCreated: false,
      overlayCreated: false,
      listenerAdded: false,
      networkRequested: false,
      assetDownloadRequested: false
    });
  }

  function authorizeAtlasRendererHandoffSession(input = {}) {
    const hostname = getHostname();
    const localDevelopmentHost = isLocalDevelopmentHost(hostname);

    if (!localDevelopmentHost) {
      return buildOperationResult(
        "authorize",
        "blocked",
        "LOCAL_DEVELOPMENT_HOST_REQUIRED",
        buildAuthorizationStatus()
      );
    }

    if (input?.confirmation == null) {
      return buildOperationResult(
        "authorize",
        "blocked",
        "MISSING_CONFIRMATION",
        buildAuthorizationStatus()
      );
    }

    if (input.confirmation !== REQUIRED_CONFIRMATION) {
      return buildOperationResult(
        "authorize",
        "blocked",
        "INVALID_CONFIRMATION",
        buildAuthorizationStatus()
      );
    }

    if (activeSession && activeSession.authorizationConsumed !== true) {
      return buildOperationResult(
        "authorize",
        "noop",
        "ALREADY_AUTHORIZED",
        buildAuthorizationStatus()
      );
    }

    const normalizedReadiness = normalizeReadiness(getCurrentReadiness());
    if (!normalizedReadiness.ok || !normalizedReadiness.snapshot) {
      return buildOperationResult(
        "authorize",
        "blocked",
        normalizedReadiness.reasonCode,
        buildAuthorizationStatus()
      );
    }

    sessionCounter += 1;
    const sessionId = createSessionId({ counter: sessionCounter });
    activeSession = {
      authorizationSource: "developer-one-session-renderer-handoff-local",
      confirmationAccepted: true,
      sessionId,
      authorizationConsumed: false,
      authorizationInvalidated: false,
      invalidationReasonCode: null,
      invalidatedAtReadinessReasonCode: null,
      boundRegionId: normalizedReadiness.snapshot.regionId,
      boundPackageId: normalizedReadiness.snapshot.packageId,
      boundPackageVersion: normalizedReadiness.snapshot.packageVersion,
      boundPackageFingerprint: normalizedReadiness.snapshot.packageFingerprint,
      boundRecipeId: normalizedReadiness.snapshot.recipeId,
      boundRecipeVersion: normalizedReadiness.snapshot.recipeVersion,
      boundSelectorSeed: normalizedReadiness.snapshot.selectorSeed
    };
    authorizationRevoked = false;

    return buildOperationResult(
      "authorize",
      "authorized",
      "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION",
      buildAuthorizationStatus()
    );
  }

  function revokeAtlasRendererHandoffSession() {
    if (!activeSession && authorizationRevoked) {
      return buildOperationResult(
        "revoke",
        "noop",
        "ALREADY_REVOKED",
        buildAuthorizationStatus()
      );
    }

    if (!activeSession) {
      authorizationRevoked = true;
      return buildOperationResult(
        "revoke",
        "noop",
        "ALREADY_REVOKED",
        buildAuthorizationStatus()
      );
    }

    activeSession = null;
    authorizationRevoked = true;

    return buildOperationResult(
      "revoke",
      "revoked",
      "REVOKED",
      buildAuthorizationStatus()
    );
  }

  function consumeAuthorizedRendererHandoffAttempt() {
    if (!activeSession) {
      return buildOperationResult(
        "consume",
        "blocked",
        "AUTHORIZATION_NOT_ACTIVE",
        buildAuthorizationStatus()
      );
    }

    if (activeSession.authorizationConsumed === true) {
      return buildOperationResult(
        "consume",
        "blocked",
        "AUTHORIZATION_ALREADY_CONSUMED",
        buildAuthorizationStatus()
      );
    }

    if (activeSession.authorizationInvalidated === true) {
      return buildOperationResult(
        "consume",
        "blocked",
        activeSession.invalidationReasonCode ?? "AUTHORIZATION_INVALIDATED",
        buildAuthorizationStatus()
      );
    }

    if (authorizationRevoked === true) {
      return buildOperationResult(
        "consume",
        "blocked",
        "AUTHORIZATION_REVOKED",
        buildAuthorizationStatus()
      );
    }

    const normalizedReadiness = normalizeReadiness(getCurrentReadiness());
    const readinessComparison = compareAuthorizationToReadiness(
      activeSession,
      normalizedReadiness
    );
    latchAuthorizationInvalidation(
      activeSession,
      normalizedReadiness,
      readinessComparison
    );

    if (activeSession.authorizationInvalidated === true) {
      return buildOperationResult(
        "consume",
        "blocked",
        activeSession.invalidationReasonCode ?? "AUTHORIZATION_INVALIDATED",
        buildAuthorizationStatus()
      );
    }

    if (!normalizedReadiness.ok) {
      return buildOperationResult(
        "consume",
        "blocked",
        normalizedReadiness.reasonCode,
        buildAuthorizationStatus()
      );
    }

    if (!readinessComparison.matches) {
      return buildOperationResult(
        "consume",
        "blocked",
        readinessComparison.reasonCode,
        buildAuthorizationStatus()
      );
    }

    activeSession.authorizationConsumed = true;

    return buildOperationResult(
      "consume",
      "consumed",
      "AUTHORIZED_RENDERER_HANDOFF_READY_FOR_FUTURE_ATTEMPT",
      buildAuthorizationStatus()
    );
  }

  function getAtlasRendererHandoffAuthorizationStatus() {
    return buildAuthorizationStatus();
  }

  return deepFreeze({
    authorizeAtlasRendererHandoffSession,
    revokeAtlasRendererHandoffSession,
    getAtlasRendererHandoffAuthorizationStatus,
    consumeAuthorizedRendererHandoffAttempt,
    requiredConfirmation: REQUIRED_CONFIRMATION,
    localDevelopmentHosts: [...LOCAL_DEVELOPMENT_HOSTS]
  });
}

export function installControlledOneSessionDeveloperRendererHandoffAuthorization(
  options = {}
) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const authorization = options.authorization;

  if (!globalObject || !authorization) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.authorizeAtlasRendererHandoffSession = (input) =>
    authorization.authorizeAtlasRendererHandoffSession(input);

  namespace.revokeAtlasRendererHandoffSession = () =>
    authorization.revokeAtlasRendererHandoffSession();

  namespace.getAtlasRendererHandoffAuthorizationStatus =
    authorization.getAtlasRendererHandoffAuthorizationStatus;

  return namespace;
}
