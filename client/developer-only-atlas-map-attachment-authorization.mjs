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
const REQUIRED_CONFIRMATION = "AUTHORIZE_ATLAS_ONE_SESSION";

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function buildOperationResult(operation, outcome, reasonCode, authorizationStatus, extra = {}) {
  return deepFreeze({
    schemaId: "ATLAS_MAP_ATTACHMENT_AUTHORIZATION_OPERATION_RESULT_001",
    operation,
    outcome,
    reasonCode,
    authorizationStatus,
    ...extra
  });
}

export function createControlledOneSessionDeveloperMapAttachmentAuthorization(options = {}) {
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
  const getSafetyFlags =
    options.getSafetyFlags ??
    (() => ({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }));
  let sessionCounter = 0;
  let activeSession = null;
  let currentAttachmentState = options.initialAttachmentState === true;

  function buildAuthorizationStatus() {
    const hostname = getHostname();
    const localDevelopmentHost = isLocalDevelopmentHost(hostname);
    const safetyFlags = deepFreeze({ ...getSafetyFlags() });
    const authorizationActive = !!activeSession;
    const canonicalMapAttachmentAllowed = safetyFlags.mapAttachmentAllowed === true;
    const effectiveMapAttachmentAllowed =
      authorizationActive && localDevelopmentHost && !canonicalMapAttachmentAllowed;

    return deepFreeze({
      schemaId: "ATLAS_MAP_ATTACHMENT_AUTHORIZATION_STATUS_001",
      authorizationActive,
      authorizationSource: authorizationActive ? activeSession.source : "canonical",
      localDevelopmentHost,
      confirmationAccepted: authorizationActive ? activeSession.confirmationAccepted : false,
      sessionId: authorizationActive ? activeSession.sessionId : null,
      successfulAttachmentConsumed: authorizationActive
        ? activeSession.successfulAttachmentConsumed
        : false,
      currentAttachmentState,
      canonicalMapAttachmentAllowed,
      effectiveMapAttachmentAllowed,
      attachAllowed: effectiveMapAttachmentAllowed,
      automaticAuthorization: false,
      persistentAuthorization: false,
      storageUsed: false,
      safetyFlags
    });
  }

  function readAttachmentAuthorizationStateForController() {
    const status = buildAuthorizationStatus();
    return deepFreeze({
      source: status.authorizationSource,
      mapAttachmentAllowed: status.effectiveMapAttachmentAllowed
    });
  }

  function authorizeAtlasMapAttachmentSession(input = {}) {
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

    if (activeSession) {
      return buildOperationResult(
        "authorize",
        "noop",
        "ALREADY_AUTHORIZED",
        buildAuthorizationStatus()
      );
    }

    sessionCounter += 1;
    activeSession = {
      source: "developer-one-session-local",
      confirmationAccepted: true,
      successfulAttachmentConsumed: false,
      sessionId: `ATLAS_ONE_SESSION_${String(sessionCounter).padStart(3, "0")}`
    };

    return buildOperationResult(
      "authorize",
      "authorized",
      "AUTHORIZED_ONE_SESSION",
      buildAuthorizationStatus()
    );
  }

  function consumeSuccessfulAttachment() {
    if (activeSession) {
      activeSession.successfulAttachmentConsumed = true;
      currentAttachmentState = true;
    }
    return buildAuthorizationStatus();
  }

  function revokeAtlasMapAttachmentSession() {
    if (!activeSession) {
      currentAttachmentState = false;
      return buildOperationResult(
        "revoke",
        "noop",
        "ALREADY_REVOKED",
        buildAuthorizationStatus()
      );
    }

    activeSession = null;
    currentAttachmentState = false;
    return buildOperationResult(
      "revoke",
      "revoked",
      "REVOKED",
      buildAuthorizationStatus()
    );
  }

  function getAtlasMapAttachmentAuthorizationStatus() {
    return buildAuthorizationStatus();
  }

  return deepFreeze({
    authorizeAtlasMapAttachmentSession,
    revokeAtlasMapAttachmentSession,
    getAtlasMapAttachmentAuthorizationStatus,
    readAttachmentAuthorizationStateForController,
    consumeSuccessfulAttachment,
    requiredConfirmation: REQUIRED_CONFIRMATION,
    localDevelopmentHosts: [...LOCAL_DEVELOPMENT_HOSTS]
  });
}

export function installControlledOneSessionDeveloperMapAttachmentAuthorization(options = {}) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const authorization = options.authorization;
  const controller = options.controller;

  if (!globalObject || !authorization || !controller) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.authorizeAtlasMapAttachmentSession = (input) =>
    authorization.authorizeAtlasMapAttachmentSession(input);

  namespace.revokeAtlasMapAttachmentSession = () => {
    const currentAttachmentStatus = controller.getAtlasMapAttachmentStatus();
    const detachedActiveAttachment =
      currentAttachmentStatus.attached === true
        ? controller.detachAtlasMapDiagnostic()
        : null;
    const revokeResult = authorization.revokeAtlasMapAttachmentSession();

    return deepFreeze({
      ...revokeResult,
      detachedActiveAttachment,
      attachmentStatus: controller.getAtlasMapAttachmentStatus()
    });
  };

  namespace.getAtlasMapAttachmentAuthorizationStatus =
    authorization.getAtlasMapAttachmentAuthorizationStatus;

  namespace.attachAtlasMapDiagnostic = () => {
    const result = controller.attachAtlasMapDiagnostic();
    if (result.outcome === "attached") {
      authorization.consumeSuccessfulAttachment();
    }

    return deepFreeze({
      ...result,
      status: controller.getAtlasMapAttachmentStatus()
    });
  };

  namespace.detachAtlasMapDiagnostic = () => {
    const result = controller.detachAtlasMapDiagnostic();
    authorization.revokeAtlasMapAttachmentSession();

    return deepFreeze({
      ...result,
      status: controller.getAtlasMapAttachmentStatus()
    });
  };

  return namespace;
}
