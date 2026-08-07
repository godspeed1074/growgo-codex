import {
  enableAutomaticViewportPopulation,
  disableAutomaticViewportPopulation,
  getAutomaticViewportPopulationControllerStatus
} from "./developer-only-atlas-automatic-population-controller.mjs";
import {
  enableAtlasAutomaticPopulationLiveEventAdapter,
  disableAtlasAutomaticPopulationLiveEventAdapter,
  validateAtlasAutomaticPopulationLiveEventAdapter,
  getAtlasAutomaticPopulationLiveEventAdapterStatus
} from "./developer-only-atlas-automatic-population-live-event-adapter.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_AUTOMATIC_ATLAS_POPULATION_TOGGLE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CONTROLLED_AUTOMATIC_ATLAS_POPULATION_TOGGLE_RESULT_001";

export const ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION =
  "ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION";
export const DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION =
  "DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION";
export const AUTOMATIC_POPULATION_DISABLE_POLICY =
  "RETAIN_LAST_AUTOMATIC_POPULATION_ON_DISABLE";

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

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
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

function sanitizePersistentStatus(status) {
  const safe = sanitizePlainObject(status) ?? {};
  return deepFreeze({
    integrationState: safe.integrationState ?? "inactive",
    attached: safe.attached === true,
    redrawPermissionAllowed: safe.redrawPermissionAllowed === true,
    authorizationState: safe.authorizationState ?? "inactive",
    attachPermissionConsumed: safe.attachPermissionConsumed === true,
    invalidated: safe.invalidated === true,
    revoked: safe.revoked === true,
    failedClosed: safe.failedClosed === true,
    retainedSurfaceState: sanitizeString(safe.retainedSurfaceState) ?? "empty",
    lifecycleOwnerId: sanitizeString(safe.lifecycleOwnerId),
    mapIdentityId: sanitizeString(safe.mapIdentityId),
    regionId: sanitizeString(safe.regionId),
    packageId: sanitizeString(safe.packageId),
    recipeId: sanitizeString(safe.recipeId),
    selectorSeed: sanitizeString(safe.selectorSeed),
    sessionId: sanitizeString(safe.sessionId),
    ownedCanvasCount: Number(safe.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(safe.ownedPaneCount ?? 0),
    ownedListenerCount: Number(safe.ownedListenerCount ?? 0),
    lastFailureReason: sanitizeString(safe.lastFailureReason)
  });
}

function freezeResult(command, outcome, reasonCode, status, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    command,
    outcome,
    reasonCode,
    automaticPopulationEnabled: status.automaticPopulationEnabled,
    controllerState: status.controllerState,
    adapterState: status.adapterState,
    ownedAutomaticListenerCount: status.ownedAutomaticListenerCount,
    currentViewportGenerationId: status.currentViewportGenerationId,
    currentPopulationPlanId: status.currentPopulationPlanId,
    currentBatchId: status.currentBatchId,
    populationReferenceCount: status.populationReferenceCount,
    cleanupCompleted: extra.cleanupCompleted === true,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function detectPersistentInvalidationReason(persistentStatus) {
  if (persistentStatus.attached !== true) {
    return "PERSISTENT_ATLAS_NOT_ATTACHED";
  }
  if (persistentStatus.revoked === true) {
    return "PERSISTENT_ATLAS_REVOKED";
  }
  if (persistentStatus.authorizationState === "expired") {
    return "PERSISTENT_ATLAS_EXPIRED";
  }
  if (persistentStatus.invalidated === true) {
    return persistentStatus.lastFailureReason ?? "PERSISTENT_ATLAS_INVALIDATED";
  }
  if (persistentStatus.failedClosed === true) {
    return persistentStatus.lastFailureReason ?? "PERSISTENT_ATLAS_FAILED_CLOSED";
  }
  return null;
}

function hasEligiblePersistentAuthorizationState(persistentStatus) {
  return (
    persistentStatus.authorizationState === "active" ||
    persistentStatus.authorizationState === "authorized" ||
    persistentStatus.authorizationState === "attach_permission_consumed"
  );
}

function detectPersistentEnableBlockReason(persistentStatus) {
  if (persistentStatus.revoked === true) {
    return "PERSISTENT_ATLAS_REVOKED";
  }

  if (persistentStatus.authorizationState === "expired") {
    return "PERSISTENT_ATLAS_EXPIRED";
  }

  if (persistentStatus.invalidated === true) {
    return persistentStatus.lastFailureReason ?? "PERSISTENT_ATLAS_INVALIDATED";
  }

  if (persistentStatus.failedClosed === true) {
    return persistentStatus.lastFailureReason ?? "PERSISTENT_ATLAS_FAILED_CLOSED";
  }

  if (!hasEligiblePersistentAuthorizationState(persistentStatus)) {
    return "PERSISTENT_ATLAS_UNAUTHORIZED";
  }

  if (!persistentStatus.sessionId) {
    return "PERSISTENT_ATLAS_UNAUTHORIZED";
  }

  if (
    persistentStatus.authorizationState === "attach_permission_consumed" &&
    persistentStatus.attachPermissionConsumed !== true
  ) {
    return "PERSISTENT_ATLAS_UNAUTHORIZED";
  }

  if (
    persistentStatus.attached !== true ||
    persistentStatus.integrationState !== "attached_idle"
  ) {
    return "PERSISTENT_ATLAS_NOT_ATTACHED";
  }

  if (persistentStatus.redrawPermissionAllowed !== true) {
    return "PERSISTENT_ATLAS_REDRAW_NOT_ALLOWED";
  }

  if (
    persistentStatus.retainedSurfaceState === "releasing" ||
    persistentStatus.retainedSurfaceState === "empty"
  ) {
    return "PERSISTENT_SURFACE_OR_LIFECYCLE_UNAVAILABLE";
  }

  if (
    !persistentStatus.lifecycleOwnerId ||
    persistentStatus.ownedCanvasCount < 1 ||
    persistentStatus.ownedPaneCount < 1
  ) {
    return "PERSISTENT_SURFACE_OR_LIFECYCLE_UNAVAILABLE";
  }

  if (
    !persistentStatus.mapIdentityId ||
    !persistentStatus.regionId ||
    !persistentStatus.packageId ||
    !persistentStatus.recipeId ||
    !persistentStatus.selectorSeed
  ) {
    return "PERSISTENT_ATLAS_IDENTITY_MISMATCH";
  }

  return null;
}

export function createDeveloperOnlyControlledAutomaticAtlasPopulationToggle({
  hostnameProvider = () => "",
  persistentStatusProvider = () => null,
  readinessValidationProvider = () => ({
    approved: true,
    reasonCode: "READINESS_APPROVED"
  }),
  controller = null,
  liveEventAdapter = null,
  drawReasonTraceProvider = () => null,
  drawReasonTraceResetter = () => null
} = {}) {
  const state = {
    commandAvailable: false,
    automaticPopulationEnabled: false,
    state: "disabled",
    lastCommand: null,
    lastCommandOutcome: null,
    lastCommandReasonCode: null,
    lastFailureReason: null,
    invalidationReason: null,
    startupInvocationPrevented: true,
    automaticStartupPopulationDetected: false,
    timersDetected: false,
    pollingDetected: false
  };

  function readPersistentStatus() {
    return sanitizePersistentStatus(persistentStatusProvider?.() ?? null);
  }

  function readControllerStatus() {
    return getAutomaticViewportPopulationControllerStatus(controller);
  }

  function readAdapterStatus() {
    return getAtlasAutomaticPopulationLiveEventAdapterStatus(liveEventAdapter);
  }

  function readDrawReasonTrace() {
    return deepFreeze(sanitizePlainObject(drawReasonTraceProvider?.() ?? null) ?? {});
  }

  function resetDrawReasonTrace(reasonCode = null) {
    return deepFreeze(
      sanitizePlainObject(drawReasonTraceResetter?.(reasonCode) ?? null) ?? {}
    );
  }

  function syncDriftIfNeeded() {
    const persistentStatus = readPersistentStatus();
    const driftReason = detectPersistentInvalidationReason(persistentStatus);
    if (!state.automaticPopulationEnabled || !driftReason) {
      return driftReason;
    }

    disableAtlasAutomaticPopulationLiveEventAdapter(liveEventAdapter);
    disableAutomaticViewportPopulation(controller);
    state.automaticPopulationEnabled = false;
    state.state = "invalidated";
    state.invalidationReason = driftReason;
    state.lastFailureReason = driftReason;
    state.lastCommand = "automaticPopulationDriftSync";
    state.lastCommandOutcome = "invalidated";
    state.lastCommandReasonCode = driftReason;
    return driftReason;
  }

  function readStatus() {
    const hostname = String(hostnameProvider?.() ?? "").trim();
    const localDevelopmentEligible = isLocalDevelopmentHost(hostname);
    state.commandAvailable = localDevelopmentEligible;

    syncDriftIfNeeded();

    const persistentStatus = readPersistentStatus();
    const controllerStatus = readControllerStatus();
    const adapterStatus = readAdapterStatus();

    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      commandAvailable: localDevelopmentEligible,
      localDevelopmentEligible,
      automaticPopulationEnabled: state.automaticPopulationEnabled,
      state: state.state,
      controllerState: controllerStatus.state,
      adapterState: adapterStatus.state,
      listenerOwnerId: adapterStatus.listenerOwnerId,
      ownedAutomaticListenerCount: adapterStatus.ownedListenerCount,
      currentViewportIdentity: controllerStatus.currentViewportIdentity,
      currentViewportGenerationId: controllerStatus.currentViewportGenerationId,
      queuedViewportGenerationId: controllerStatus.queuedViewportGenerationId,
      activeViewportGenerationId: controllerStatus.activeViewportGenerationId,
      followUpRefreshPending: controllerStatus.followUpRefreshPending,
      currentPopulationPlanId: controllerStatus.currentPopulationPlanId,
      currentBatchId: controllerStatus.currentBatchId,
      currentCommandCount: controllerStatus.currentCommandCount,
      populationReferenceCount: controllerStatus.populationReferenceCount,
      refreshRequestedCount: controllerStatus.refreshRequestedCount,
      refreshQueuedCount: controllerStatus.refreshQueuedCount,
      refreshStartedCount: controllerStatus.refreshStartedCount,
      refreshCompletedCount: controllerStatus.refreshCompletedCount,
      refreshCoalescedCount: controllerStatus.refreshCoalescedCount,
      staleRefreshDiscardedCount: controllerStatus.staleRefreshDiscardedCount,
      skippedUnchangedViewportCount:
        controllerStatus.skippedUnchangedViewportCount,
      lastCommand: state.lastCommand,
      lastCommandOutcome: state.lastCommandOutcome,
      lastCommandReasonCode: state.lastCommandReasonCode,
      lastTriggerReason: controllerStatus.lastTriggerReason,
      lastFailureReason:
        state.lastFailureReason ??
        controllerStatus.lastFailureReason ??
        adapterStatus.lastFailureReason,
      invalidationReason: state.invalidationReason,
      startupInvocationPrevented: state.startupInvocationPrevented,
      automaticStartupPopulationDetected: state.automaticStartupPopulationDetected,
      timersDetected: state.timersDetected,
      pollingDetected: state.pollingDetected,
      controllerStatus: deepFreeze(sanitizePlainObject(controllerStatus) ?? {}),
      adapterStatus: deepFreeze(sanitizePlainObject(adapterStatus) ?? {}),
      persistentStatus: deepFreeze(sanitizePlainObject(persistentStatus) ?? {}),
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  function blocked(command, reasonCode) {
    state.lastCommand = command;
    state.lastCommandOutcome = "blocked";
    state.lastCommandReasonCode = reasonCode;
    state.lastFailureReason = reasonCode;
    const status = readStatus();
    return freezeResult(command, "blocked", reasonCode, status);
  }

  function assertLocal(command) {
    const hostname = String(hostnameProvider?.() ?? "").trim();
    if (!isLocalDevelopmentHost(hostname)) {
      return blocked(command, "NON_LOCAL_DEVELOPMENT_HOST");
    }
    return null;
  }

  function enableControlledAutomaticAtlasPopulation({ confirmation } = {}) {
    const command = "enableControlledAutomaticAtlasPopulation";
    if (confirmation !== ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION) {
      return blocked(command, "INVALID_CONFIRMATION");
    }
    const localBlock = assertLocal(command);
    if (localBlock) {
      return localBlock;
    }

    const persistentStatus = readPersistentStatus();
    const controllerStatus = readControllerStatus();
    const adapterValidation =
      validateAtlasAutomaticPopulationLiveEventAdapter(liveEventAdapter);
    const readiness = readinessValidationProvider?.() ?? {
      approved: false,
      reasonCode: "READINESS_BLOCKED"
    };

    if (state.automaticPopulationEnabled === true) {
      return blocked(command, "AUTOMATIC_POPULATION_ALREADY_ENABLED");
    }
    const persistentBlockReason =
      detectPersistentEnableBlockReason(persistentStatus);
    if (persistentBlockReason) {
      return blocked(command, persistentBlockReason);
    }
    if (readiness?.approved !== true) {
      return blocked(
        command,
        sanitizeString(readiness?.reasonCode) ?? "READINESS_BLOCKED"
      );
    }
    if (controllerStatus.schemaId == null) {
      return blocked(command, "AUTOMATIC_POPULATION_CONTROLLER_INVALID");
    }
    if (adapterValidation.valid !== true) {
      return blocked(command, adapterValidation.reasonCode);
    }

    const controllerEnable = enableAutomaticViewportPopulation(controller);
    if (controllerEnable.outcome !== "enabled") {
      return blocked(
        command,
        controllerEnable.reasonCode ?? "AUTOMATIC_POPULATION_CONTROLLER_ENABLE_FAILED"
      );
    }

    const adapterEnable = enableAtlasAutomaticPopulationLiveEventAdapter(
      liveEventAdapter
    );
    if (adapterEnable.enabled !== true) {
      disableAutomaticViewportPopulation(controller);
      return blocked(
        command,
        adapterEnable.lastFailureReason ??
          "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_ENABLE_FAILED"
      );
    }

    state.automaticPopulationEnabled = true;
    state.state = "enabled_idle";
    state.lastCommand = command;
    state.lastCommandOutcome = "enabled";
    state.lastCommandReasonCode = "AUTOMATIC_POPULATION_ENABLED";
    state.lastFailureReason = null;
    state.invalidationReason = null;
    const status = readStatus();
    return freezeResult(
      command,
      "enabled",
      "AUTOMATIC_POPULATION_ENABLED",
      status
    );
  }

  function disableControlledAutomaticAtlasPopulation({ confirmation } = {}) {
    const command = "disableControlledAutomaticAtlasPopulation";
    if (confirmation !== DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION) {
      return blocked(command, "INVALID_CONFIRMATION");
    }
    const localBlock = assertLocal(command);
    if (localBlock) {
      return localBlock;
    }

    disableAtlasAutomaticPopulationLiveEventAdapter(liveEventAdapter);
    disableAutomaticViewportPopulation(controller);
    state.automaticPopulationEnabled = false;
    state.state = "disabled";
    state.lastCommand = command;
    state.lastCommandOutcome = "disabled";
    state.lastCommandReasonCode = "AUTOMATIC_POPULATION_DISABLED";
    state.lastFailureReason = null;
    const status = readStatus();
    return freezeResult(
      command,
      "disabled",
      "AUTOMATIC_POPULATION_DISABLED",
      status,
      { cleanupCompleted: true }
    );
  }

  return deepFreeze({
    isLocalDevelopmentEligible() {
      return isLocalDevelopmentHost(hostnameProvider?.());
    },
    getControlledAutomaticAtlasPopulationStatus: readStatus,
    getAtlasAutomaticPopulationLiveEventAdapterStatus: readAdapterStatus,
    getAtlasPopulationDrawReasonTrace: readDrawReasonTrace,
    resetAtlasPopulationDrawReasonTrace: resetDrawReasonTrace,
    enableControlledAutomaticAtlasPopulation,
    disableControlledAutomaticAtlasPopulation
  });
}

export function installDeveloperOnlyControlledAutomaticAtlasPopulationToggle({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  toggle
} = {}) {
  if (
    !globalObject ||
    !toggle ||
    typeof toggle.getControlledAutomaticAtlasPopulationStatus !== "function" ||
    typeof toggle.getAtlasAutomaticPopulationLiveEventAdapterStatus !== "function" ||
    typeof toggle.getAtlasPopulationDrawReasonTrace !== "function" ||
    typeof toggle.resetAtlasPopulationDrawReasonTrace !== "function" ||
    typeof toggle.enableControlledAutomaticAtlasPopulation !== "function" ||
    typeof toggle.disableControlledAutomaticAtlasPopulation !== "function"
  ) {
    return null;
  }

  if (toggle.isLocalDevelopmentEligible?.() !== true) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.enableControlledAutomaticAtlasPopulation = (input) =>
    toggle.enableControlledAutomaticAtlasPopulation(input);
  namespace.disableControlledAutomaticAtlasPopulation = (input) =>
    toggle.disableControlledAutomaticAtlasPopulation(input);
  namespace.getControlledAutomaticAtlasPopulationStatus = () =>
    toggle.getControlledAutomaticAtlasPopulationStatus();
  namespace.getAtlasAutomaticPopulationLiveEventAdapterStatus = () =>
    toggle.getAtlasAutomaticPopulationLiveEventAdapterStatus();
  namespace.getAtlasPopulationDrawReasonTrace = () =>
    toggle.getAtlasPopulationDrawReasonTrace();
  namespace.resetAtlasPopulationDrawReasonTrace = (reasonCode) =>
    toggle.resetAtlasPopulationDrawReasonTrace(reasonCode);

  return namespace;
}
