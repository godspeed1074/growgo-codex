const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_MANUAL_COMMAND_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_MANUAL_COMMAND_RESULT_001";
const MODULE_VERSION_TAG = "atlas21174";
const MODULE_SOURCE_TAG =
  "client/developer-only-controlled-persistent-atlas-manual-command.mjs";
const MODULE_LOAD_TIMESTAMP = "2026-08-06T00:00:00.000Z";

export const AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION =
  "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
export const ATTACH_CONTROLLED_PERSISTENT_ATLAS =
  "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
export const REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW =
  "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";
export const DETACH_CONTROLLED_PERSISTENT_ATLAS =
  "DETACH_CONTROLLED_PERSISTENT_ATLAS";
export const REVOKE_CONTROLLED_PERSISTENT_ATLAS =
  "REVOKE_CONTROLLED_PERSISTENT_ATLAS";
export const INVALIDATE_CONTROLLED_PERSISTENT_ATLAS =
  "INVALIDATE_CONTROLLED_PERSISTENT_ATLAS";

export const CONTROLLED_PERSISTENT_ATLAS_INVALIDATION_REASONS = Object.freeze([
  "MANUAL_INVALIDATION",
  "MAP_IDENTITY_DRIFT",
  "READINESS_DRIFT",
  "PACKAGE_IDENTITY_DRIFT",
  "RECIPE_IDENTITY_DRIFT",
  "SELECTOR_SEED_DRIFT",
  "LIFECYCLE_OWNER_DRIFT",
  "SESSION_STALE"
]);

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
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

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function sanitizePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function deriveCleanupState(status) {
  if (status?.cleanupFailed === true) {
    return "failed";
  }

  if (status?.cleanupCompleted === true) {
    return "completed";
  }

  if (status?.detaching === true) {
    return "in_progress";
  }

  return "idle";
}

function deriveLifecycleState(status) {
  if (typeof status?.controllerState === "string" && status.controllerState) {
    return status.controllerState;
  }

  if (status?.attached === true) {
    return "attached_idle";
  }

  return "detached";
}

function sanitizeIntegrationStatus(status) {
  const safe = sanitizePlainObject(status) ?? {};

  return deepFreeze({
    schemaId:
      safe.schemaId ??
      "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTRACT_INTEGRATION_STATUS_001",
    integrationState: safe.integrationState ?? "inactive",
    ready: safe.ready === true,
    attached: safe.attached === true,
    drawing: safe.drawing === true,
    redrawQueued: safe.redrawQueued === true,
    followUpPending: safe.followUpPending === true,
    detaching: safe.detaching === true,
    revoked: safe.revoked === true,
    invalidated: safe.invalidated === true,
    failedClosed: safe.failedClosed === true,
    authorizationState: safe.authorizationState ?? "inactive",
    attachPermissionConsumed: safe.attachPermissionConsumed === true,
    redrawPermissionAllowed: safe.redrawPermissionAllowed === true,
    controllerState: safe.controllerState ?? "detached",
    schedulerState: safe.schedulerState ?? "inactive",
    retainedSurfaceState: safe.retainedSurfaceState ?? "empty",
    adapterReady: safe.adapterReady === true,
    sessionId: safe.sessionId ?? null,
    mapIdentityId: safe.mapIdentityId ?? null,
    lifecycleOwnerId: safe.lifecycleOwnerId ?? null,
    regionId: safe.regionId ?? null,
    packageId: safe.packageId ?? null,
    packageVersion: safe.packageVersion ?? null,
    packageFingerprint: safe.packageFingerprint ?? null,
    recipeId: safe.recipeId ?? null,
    recipeVersion: safe.recipeVersion ?? null,
    selectorSeed: safe.selectorSeed ?? null,
    ownedCanvasCount: Number(safe.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(safe.ownedPaneCount ?? 0),
    ownedListenerCount: Number(safe.ownedListenerCount ?? 0),
    queuedFrameCount: Number(safe.queuedFrameCount ?? 0),
    authorizationAttemptCount: Number(safe.authorizationAttemptCount ?? 0),
    attachAttemptCount: Number(safe.attachAttemptCount ?? 0),
    attachCompletedCount: Number(safe.attachCompletedCount ?? 0),
    redrawRequestCount: Number(safe.redrawRequestCount ?? 0),
    redrawCompletedCount: Number(safe.redrawCompletedCount ?? 0),
    redrawCoalescedCount: Number(safe.redrawCoalescedCount ?? 0),
    snapshotCompletedCount: Number(safe.snapshotCompletedCount ?? 0),
    drawCompletedCount: Number(safe.drawCompletedCount ?? 0),
    detachAttemptCount: Number(safe.detachAttemptCount ?? 0),
    detachCompletedCount: Number(safe.detachCompletedCount ?? 0),
    cleanupAttemptCount: Number(safe.cleanupAttemptCount ?? 0),
    cleanupCompleted: safe.cleanupCompleted === true,
    lastRequestedRedrawReason: safe.lastRequestedRedrawReason ?? null,
    lastCompletedRedrawReason: safe.lastCompletedRedrawReason ?? null,
    lastFailureReason: safe.lastFailureReason ?? null,
    cleanupFailureReasons: Array.isArray(safe.cleanupFailureReasons)
      ? [...safe.cleanupFailureReasons]
      : [],
    referencesReleased: safe.referencesReleased === true,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function toResult(command, outcome, reasonCode, status, extra = {}) {
  const integration = sanitizeIntegrationStatus(status?.integrationStatus);

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    command,
    outcome,
    reasonCode,
    commandState: status?.commandState ?? "idle",
    sessionId: integration.sessionId,
    integrationState: integration.integrationState,
    authorizationState: integration.authorizationState,
    controllerState: integration.controllerState,
    schedulerState: integration.schedulerState,
    retainedSurfaceState: integration.retainedSurfaceState,
    lifecycleState: deriveLifecycleState(integration),
    cleanupState: deriveCleanupState(integration),
    attached: integration.attached,
    redrawQueued: integration.redrawQueued,
    drawing: integration.drawing,
    detachRequired:
      extra.detachRequired === true ||
      integration.failedClosed === true ||
      integration.invalidated === true ||
      integration.revoked === true,
    ownedCanvasCount: integration.ownedCanvasCount,
    ownedPaneCount: integration.ownedPaneCount,
    ownedListenerCount: integration.ownedListenerCount,
    queuedFrameCount: integration.queuedFrameCount,
    completedFrameCount: integration.redrawCompletedCount,
    drawCompletedCount: integration.drawCompletedCount,
    cleanupCompleted: integration.cleanupCompleted,
    cleanupFailureReasons: [...integration.cleanupFailureReasons],
    referencesReleased: integration.referencesReleased,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyControlledPersistentAtlasManualCommand({
  hostnameProvider = () => "",
  integrationProvider = () => null,
  compositionStatusProvider = () => null,
  nowProvider = () => MODULE_LOAD_TIMESTAMP
} = {}) {
  let lastCommand = null;
  let lastCommandOutcome = null;
  let lastCommandReasonCode = null;

  function getIntegration() {
    return integrationProvider?.() ?? null;
  }

  function readIntegrationStatus() {
    const integration = getIntegration();
    const status =
      integration &&
      typeof integration.getIntegratedPersistentAtlasStatus === "function"
        ? integration.getIntegratedPersistentAtlasStatus()
        : null;

    return sanitizeIntegrationStatus(status);
  }

  function readCompositionStatus() {
    return deepFreeze(
      sanitizePlainObject(compositionStatusProvider?.()) ?? {
        schemaId: "GROWGO_CONTROLLED_PERSISTENT_ATLAS_COMPOSITION_STATUS_UNAVAILABLE",
        state: "unavailable"
      }
    );
  }

  function readStatus() {
    const hostname = String(hostnameProvider?.() ?? "").trim();
    const localDevelopmentEligible = isLocalDevelopmentHost(hostname);
    const integrationStatus = readIntegrationStatus();
    const compositionStatus = readCompositionStatus();

    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      commandAvailable: localDevelopmentEligible,
      localDevelopmentEligible,
      hostname: hostname || null,
      runtimeIdentity: deepFreeze({
        moduleVersionTag: MODULE_VERSION_TAG,
        moduleSourceTag: MODULE_SOURCE_TAG,
        moduleLoadTimestamp: MODULE_LOAD_TIMESTAMP,
        statusReadAt: String(nowProvider?.() ?? MODULE_LOAD_TIMESTAMP)
      }),
      authorizationStatus: deepFreeze({
        authorizationState: integrationStatus.authorizationState,
        attachPermissionConsumed: integrationStatus.attachPermissionConsumed,
        redrawPermissionAllowed: integrationStatus.redrawPermissionAllowed,
        sessionId: integrationStatus.sessionId
      }),
      controllerStatus: deepFreeze({
        controllerState: integrationStatus.controllerState,
        attached: integrationStatus.attached,
        drawing: integrationStatus.drawing,
        redrawQueued: integrationStatus.redrawQueued
      }),
      compositionStatus,
      schedulerListenerStatus: deepFreeze({
        schedulerState: integrationStatus.schedulerState,
        ownedListenerCount: integrationStatus.ownedListenerCount,
        queuedFrameCount: integrationStatus.queuedFrameCount,
        redrawCompletedCount: integrationStatus.redrawCompletedCount,
        redrawCoalescedCount: integrationStatus.redrawCoalescedCount
      }),
      retainedSurfaceStatus: deepFreeze({
        retainedSurfaceState: integrationStatus.retainedSurfaceState,
        ownedCanvasCount: integrationStatus.ownedCanvasCount,
        ownedPaneCount: integrationStatus.ownedPaneCount
      }),
      lifecycleOwnerStatus: deepFreeze({
        lifecycleState: deriveLifecycleState(integrationStatus),
        lifecycleOwnerId: integrationStatus.lifecycleOwnerId,
        attached: integrationStatus.attached
      }),
      snapshotStatus: deepFreeze({
        snapshotCompletedCount: integrationStatus.snapshotCompletedCount
      }),
      drawStatus: deepFreeze({
        drawCompletedCount: integrationStatus.drawCompletedCount,
        drawing: integrationStatus.drawing,
        lastCompletedRedrawReason: integrationStatus.lastCompletedRedrawReason
      }),
      cleanupStatus: deepFreeze({
        cleanupState: deriveCleanupState(integrationStatus),
        cleanupAttemptCount: integrationStatus.cleanupAttemptCount,
        cleanupCompleted: integrationStatus.cleanupCompleted,
        cleanupFailureReasons: [...integrationStatus.cleanupFailureReasons],
        referencesReleased: integrationStatus.referencesReleased
      }),
      mapReadinessIdentityStatus: deepFreeze({
        mapIdentityId: integrationStatus.mapIdentityId,
        regionId: integrationStatus.regionId,
        packageId: integrationStatus.packageId,
        packageVersion: integrationStatus.packageVersion,
        packageFingerprint: integrationStatus.packageFingerprint,
        recipeId: integrationStatus.recipeId,
        recipeVersion: integrationStatus.recipeVersion,
        selectorSeed: integrationStatus.selectorSeed,
        sessionId: integrationStatus.sessionId
      }),
      integrationStatus,
      lastCommand,
      lastCommandOutcome,
      lastCommandReasonCode,
      lastFailure: integrationStatus.lastFailureReason,
      cleanupFailures: [...integrationStatus.cleanupFailureReasons],
      driftStatus:
        integrationStatus.invalidated === true
          ? integrationStatus.lastFailureReason
          : null,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  function blockedResult(command, reasonCode) {
    const status = readStatus();
    lastCommand = command;
    lastCommandOutcome = "blocked";
    lastCommandReasonCode = reasonCode;

    return toResult(command, "blocked", reasonCode, {
      commandState: "blocked",
      integrationStatus: status.integrationStatus
    });
  }

  function runCommand(command, handler, extra = {}) {
    const hostname = String(hostnameProvider?.() ?? "").trim();
    if (!isLocalDevelopmentHost(hostname)) {
      return blockedResult(command, "NON_LOCAL_DEVELOPMENT_HOST");
    }

    const integration = getIntegration();
    if (!integration) {
      return blockedResult(command, "PERSISTENT_COMMAND_UNAVAILABLE");
    }

    const result = handler(integration);
    const integrationStatus = sanitizeIntegrationStatus(
      result?.status ?? integration.getIntegratedPersistentAtlasStatus?.()
    );
    const outcome = result?.outcome ?? "blocked";
    const reasonCode = result?.reasonCode ?? "PERSISTENT_COMMAND_UNAVAILABLE";

    lastCommand = command;
    lastCommandOutcome = outcome;
    lastCommandReasonCode = reasonCode;

    return toResult(
      command,
      outcome,
      reasonCode,
      {
        commandState:
          outcome === "authorized" ||
          outcome === "attached" ||
          outcome === "queued" ||
          outcome === "coalesced" ||
          outcome === "released" ||
          outcome === "revoked" ||
          outcome === "invalidated"
            ? "completed"
            : outcome,
        integrationStatus
      },
      extra
    );
  }

  function authorizeControlledPersistentAtlas({ confirmation } = {}) {
    return runCommand(
      "authorizeControlledPersistentAtlas",
      (integration) =>
        integration.authorizeIntegratedPersistentAtlas({ confirmation })
    );
  }

  function attachControlledPersistentAtlas({ confirmation } = {}) {
    return runCommand(
      "attachControlledPersistentAtlas",
      (integration) =>
        integration.attachIntegratedPersistentAtlas({ confirmation })
    );
  }

  function requestControlledPersistentAtlasRedraw({
    confirmation,
    reason = "manual_redraw"
  } = {}) {
    return runCommand(
      "requestControlledPersistentAtlasRedraw",
      (integration) =>
        integration.requestIntegratedPersistentAtlasRedraw({
          confirmation,
          reason
        })
    );
  }

  function detachControlledPersistentAtlas({ confirmation } = {}) {
    return runCommand(
      "detachControlledPersistentAtlas",
      (integration) =>
        integration.detachIntegratedPersistentAtlas({ confirmation })
    );
  }

  function revokeControlledPersistentAtlas({ confirmation } = {}) {
    if (confirmation !== REVOKE_CONTROLLED_PERSISTENT_ATLAS) {
      return blockedResult(
        "revokeControlledPersistentAtlas",
        "INVALID_CONFIRMATION"
      );
    }

    return runCommand(
      "revokeControlledPersistentAtlas",
      (integration) => integration.revokeIntegratedPersistentAtlas(),
      { detachRequired: true }
    );
  }

  function invalidateControlledPersistentAtlas({
    confirmation,
    reasonCode = "MANUAL_INVALIDATION"
  } = {}) {
    if (confirmation !== INVALIDATE_CONTROLLED_PERSISTENT_ATLAS) {
      return blockedResult(
        "invalidateControlledPersistentAtlas",
        "INVALID_CONFIRMATION"
      );
    }

    if (!CONTROLLED_PERSISTENT_ATLAS_INVALIDATION_REASONS.includes(reasonCode)) {
      return blockedResult(
        "invalidateControlledPersistentAtlas",
        "INVALID_INVALIDATION_REASON"
      );
    }

    return runCommand(
      "invalidateControlledPersistentAtlas",
      (integration) => integration.invalidateIntegratedPersistentAtlas({ reasonCode }),
      { detachRequired: true }
    );
  }

  return deepFreeze({
    isLocalDevelopmentEligible() {
      return isLocalDevelopmentHost(hostnameProvider?.());
    },
    getControlledPersistentAtlasStatus: readStatus,
    authorizeControlledPersistentAtlas,
    attachControlledPersistentAtlas,
    requestControlledPersistentAtlasRedraw,
    detachControlledPersistentAtlas,
    revokeControlledPersistentAtlas,
    invalidateControlledPersistentAtlas
  });
}

export function installDeveloperOnlyControlledPersistentAtlasManualCommand({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  command
} = {}) {
  if (
    !globalObject ||
    !command ||
    typeof command.getControlledPersistentAtlasStatus !== "function" ||
    typeof command.authorizeControlledPersistentAtlas !== "function"
  ) {
    return null;
  }

  if (command.isLocalDevelopmentEligible?.() !== true) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.authorizeControlledPersistentAtlas = (input) =>
    command.authorizeControlledPersistentAtlas(input);
  namespace.attachControlledPersistentAtlas = (input) =>
    command.attachControlledPersistentAtlas(input);
  namespace.requestControlledPersistentAtlasRedraw = (input) =>
    command.requestControlledPersistentAtlasRedraw(input);
  namespace.getControlledPersistentAtlasStatus = () =>
    command.getControlledPersistentAtlasStatus();
  namespace.detachControlledPersistentAtlas = (input) =>
    command.detachControlledPersistentAtlas(input);
  namespace.revokeControlledPersistentAtlas = (input) =>
    command.revokeControlledPersistentAtlas(input);
  namespace.invalidateControlledPersistentAtlas = (input) =>
    command.invalidateControlledPersistentAtlas(input);

  return namespace;
}
