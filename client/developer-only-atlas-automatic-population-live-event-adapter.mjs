import {
  requestAutomaticViewportPopulationRefresh,
  runQueuedAutomaticViewportPopulationRefresh,
  invalidateAutomaticViewportPopulationController,
  getAutomaticViewportPopulationControllerStatus
} from "./developer-only-atlas-automatic-population-controller.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_STATUS_001";

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = [
  "move",
  "drag",
  "mousemove",
  "touchmove",
  "wheel",
  "zoom",
  "zoomstart",
  "timer",
  "polling",
  "startup"
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

function sanitizeString(value) {
  return value == null ? null : String(value);
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

function validateMapShape(map) {
  return Boolean(map && typeof map.on === "function" && typeof map.off === "function");
}

function normalizeAtlasIdentity(identity = {}) {
  return {
    mapIdentityId: sanitizeString(identity.mapIdentityId),
    regionId: sanitizeString(identity.regionId),
    packageId: sanitizeString(identity.packageId),
    recipeId: sanitizeString(identity.recipeId),
    selectorSeed: sanitizeString(identity.selectorSeed),
    sessionId: sanitizeString(identity.sessionId)
  };
}

function normalizeViewportIdentity(viewport = {}) {
  return {
    viewportIdentity: sanitizeString(
      viewport.viewportIdentity ?? viewport.viewportOrTileId
    ),
    featureSourceGenerationId: sanitizeString(
      viewport.featureSourceGenerationId ?? viewport.sourceGenerationId
    )
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    adapterReady: state.adapterReady,
    state: state.state,
    enabled: state.enabled,
    listenerOwnerId: state.listenerOwnerId,
    boundMapIdentityId: state.boundMapIdentityId,
    boundSessionId: state.boundSessionId,
    moveendRegistered: state.moveendRegistered,
    zoomendRegistered: state.zoomendRegistered,
    resizeRegistered: state.resizeRegistered,
    ownedListenerCount: state.ownedListenerCount,
    enableAttemptCount: state.enableAttemptCount,
    enableCompletedCount: state.enableCompletedCount,
    disableAttemptCount: state.disableAttemptCount,
    disableCompletedCount: state.disableCompletedCount,
    eventReceivedCount: state.eventReceivedCount,
    eventForwardedCount: state.eventForwardedCount,
    eventRejectedCount: state.eventRejectedCount,
    refreshExecutionRequestedCount: state.refreshExecutionRequestedCount,
    refreshExecutionStartedCount: state.refreshExecutionStartedCount,
    refreshExecutionCompletedCount: state.refreshExecutionCompletedCount,
    executionBlockedCount: state.executionBlockedCount,
    moveendReceivedCount: state.moveendReceivedCount,
    zoomendReceivedCount: state.zoomendReceivedCount,
    resizeReceivedCount: state.resizeReceivedCount,
    staleMapDetected: state.staleMapDetected,
    readinessBlockedDetected: state.readinessBlockedDetected,
    identityMismatchDetected: state.identityMismatchDetected,
    lastEventReason: state.lastEventReason,
    lastExecutionReason: state.lastExecutionReason,
    lastFailureReason: state.lastFailureReason,
    referencesReleased: state.referencesReleased,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function assertAdapter(adapter) {
  if (
    !adapter?.__growgoDeveloperOnlyAtlasAutomaticPopulationLiveEventAdapter ||
    !adapter.__state ||
    !adapter.__internal ||
    !adapter.__deps
  ) {
    throw Object.assign(
      new Error("AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"),
      { reasonCode: "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE" }
    );
  }
  return adapter;
}

function validateDependencies(adapter) {
  const state = adapter.__state;
  const deps = adapter.__deps;
  const ready =
    isAvailableFunction(deps.mapProvider) &&
    deps.controller != null &&
    isAvailableFunction(deps.listenerRegistrar) &&
    isAvailableFunction(deps.listenerRemover) &&
    isAvailableFunction(deps.viewportIdentityProvider) &&
    isAvailableFunction(deps.readinessProvider) &&
    isAvailableFunction(deps.atlasIdentityProvider);
  state.adapterReady = ready;
  if (!ready) {
    state.lastFailureReason = "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE";
    throw Object.assign(
      new Error("AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"),
      { reasonCode: "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE" }
    );
  }
  return deps;
}

function syncListenerState(adapter) {
  const state = adapter.__state;
  const regs = adapter.__internal.registrations;
  state.moveendRegistered = Boolean(regs.moveend);
  state.zoomendRegistered = Boolean(regs.zoomend);
  state.resizeRegistered = Boolean(regs.resize);
  state.ownedListenerCount = APPROVED_EVENTS.reduce(
    (count, name) => count + (regs[name] ? 1 : 0),
    0
  );
}

function clearBindings(adapter) {
  const state = adapter.__state;
  const internal = adapter.__internal;
  internal.boundMap = null;
  internal.boundAtlasIdentity = null;
  internal.callbacks = { moveend: null, zoomend: null, resize: null };
  internal.registrations = { moveend: null, zoomend: null, resize: null };
  state.listenerOwnerId = null;
  state.boundMapIdentityId = null;
  state.boundSessionId = null;
  state.referencesReleased = true;
  syncListenerState(adapter);
}

function getCurrentMapAndIdentity(adapter) {
  const deps = validateDependencies(adapter);
  const map = deps.mapProvider();
  if (!validateMapShape(map)) {
    throw Object.assign(new Error("MAP_UNAVAILABLE"), {
      reasonCode: "MAP_UNAVAILABLE"
    });
  }
  const identity = normalizeAtlasIdentity(deps.atlasIdentityProvider());
  if (
    !identity.mapIdentityId ||
    !identity.regionId ||
    !identity.packageId ||
    !identity.recipeId ||
    !identity.selectorSeed
  ) {
    throw Object.assign(new Error("ATLAS_IDENTITY_UNAVAILABLE"), {
      reasonCode: "ATLAS_IDENTITY_UNAVAILABLE"
    });
  }
  return { map, identity, deps };
}

function recordEventReceipt(state, eventName) {
  state.eventReceivedCount += 1;
  state.lastEventReason = eventName;
  if (eventName === "moveend") {
    state.moveendReceivedCount += 1;
  } else if (eventName === "zoomend") {
    state.zoomendReceivedCount += 1;
  } else if (eventName === "resize") {
    state.resizeReceivedCount += 1;
  }
}

function maybeInvalidateController(adapter, reasonCode) {
  if (
    [
      "REGION_OUT_OF_SCOPE",
      "READINESS_BLOCKED",
      "MAP_IDENTITY_MISMATCH",
      "REGION_IDENTITY_MISMATCH",
      "PACKAGE_IDENTITY_MISMATCH",
      "RECIPE_IDENTITY_MISMATCH",
      "SELECTOR_SEED_MISMATCH"
    ].includes(reasonCode)
  ) {
    invalidateAutomaticViewportPopulationController(
      adapter.__deps.controller,
      reasonCode
    );
  }
}

function scheduleQueuedRefreshExecution(adapter, eventName) {
  const internal = adapter.__internal;
  const state = adapter.__state;

  if (internal.executionMicrotaskScheduled === true) {
    state.lastExecutionReason = `coalesced_${eventName}`;
    return freezeStatus(state);
  }

  internal.executionMicrotaskScheduled = true;
  state.refreshExecutionRequestedCount += 1;
  state.lastExecutionReason = `scheduled_${eventName}`;

  queueMicrotask(() => {
    internal.executionMicrotaskScheduled = false;
    maybeRunQueuedRefreshExecution(adapter, eventName);
  });

  return freezeStatus(state);
}

function maybeRunQueuedRefreshExecution(adapter, eventName) {
  const state = adapter.__state;
  const controllerStatus = getAutomaticViewportPopulationControllerStatus(
    adapter.__deps.controller
  );

  if (
    controllerStatus.automaticPopulationEnabled !== true ||
    state.enabled !== true ||
    state.state !== "enabled"
  ) {
    state.executionBlockedCount += 1;
    state.lastExecutionReason = "AUTOMATIC_POPULATION_DISABLED";
    return freezeStatus(state);
  }

  if (controllerStatus.state === "invalidated") {
    state.executionBlockedCount += 1;
    state.lastExecutionReason =
      controllerStatus.invalidationReason ?? "AUTOMATIC_POPULATION_INVALIDATED";
    return freezeStatus(state);
  }

  if (!controllerStatus.queuedViewportGenerationId) {
    state.executionBlockedCount += 1;
    state.lastExecutionReason = "NO_QUEUED_REFRESH";
    return freezeStatus(state);
  }

  if (controllerStatus.activeViewportGenerationId) {
    state.executionBlockedCount += 1;
    state.lastExecutionReason = "ACTIVE_REFRESH_IN_PROGRESS";
    return freezeStatus(state);
  }

  state.refreshExecutionStartedCount += 1;
  state.lastExecutionReason = `execute_${eventName}`;
  const result = runQueuedAutomaticViewportPopulationRefresh(adapter.__deps.controller);
  if (result?.outcome === "completed") {
    state.refreshExecutionCompletedCount += 1;
    state.lastExecutionReason = result.reasonCode ?? "AUTOMATIC_POPULATION_REFRESH_COMPLETED";
    return freezeStatus(state);
  }

  if (
    result?.outcome === "discarded" ||
    result?.outcome === "failed_closed" ||
    result?.outcome === "blocked" ||
    result?.outcome === "coalesced" ||
    result?.outcome === "skipped"
  ) {
    if (result?.outcome !== "blocked" || result?.reasonCode !== "NO_QUEUED_REFRESH") {
      state.refreshExecutionStartedCount += 1;
    }
    state.executionBlockedCount += 1;
    state.lastExecutionReason =
      sanitizeString(result?.reasonCode) ??
      "AUTOMATIC_POPULATION_REFRESH_EXECUTION_BLOCKED";
  }

  return freezeStatus(state);
}

function handleApprovedEvent(adapter, eventName, eventObject) {
  const state = adapter.__state;
  const internal = adapter.__internal;
  try {
    if (state.enabled !== true || state.state !== "enabled") {
      state.eventRejectedCount += 1;
      state.lastFailureReason = "ADAPTER_DISABLED";
      return freezeStatus(state);
    }

    recordEventReceipt(state, eventName);

    const { map, identity, deps } = getCurrentMapAndIdentity(adapter);
    if (map !== internal.boundMap || identity.mapIdentityId !== state.boundMapIdentityId) {
      state.staleMapDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "MAP_IDENTITY_MISMATCH";
      state.state = "failed_closed";
      maybeInvalidateController(adapter, "MAP_IDENTITY_MISMATCH");
      return freezeStatus(state);
    }

    if (identity.sessionId !== state.boundSessionId) {
      state.identityMismatchDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "SESSION_IDENTITY_MISMATCH";
      state.state = "failed_closed";
      return freezeStatus(state);
    }

    const viewportIdentity = normalizeViewportIdentity(
      deps.viewportIdentityProvider({ eventName, eventObject })
    );
    if (!viewportIdentity.viewportIdentity) {
      throw Object.assign(new Error("VIEWPORT_IDENTITY_UNAVAILABLE"), {
        reasonCode: "VIEWPORT_IDENTITY_UNAVAILABLE"
      });
    }

    const readiness = deps.readinessProvider({
      eventName,
      eventObject,
      viewportIdentity,
      atlasIdentity: identity
    });
    if (readiness?.approved === false) {
      const reasonCode =
        sanitizeString(readiness.reasonCode) ?? "READINESS_BLOCKED";
      state.readinessBlockedDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = reasonCode;
      maybeInvalidateController(adapter, reasonCode);
      return freezeStatus(state);
    }

    const currentIdentity = normalizeAtlasIdentity(deps.atlasIdentityProvider());
    if (currentIdentity.mapIdentityId !== state.boundMapIdentityId) {
      state.staleMapDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "MAP_IDENTITY_MISMATCH";
      maybeInvalidateController(adapter, "MAP_IDENTITY_MISMATCH");
      return freezeStatus(state);
    }
    const boundIdentity = internal.boundAtlasIdentity ?? identity;
    if (currentIdentity.regionId !== boundIdentity.regionId) {
      state.identityMismatchDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "REGION_IDENTITY_MISMATCH";
      maybeInvalidateController(adapter, "REGION_IDENTITY_MISMATCH");
      return freezeStatus(state);
    }
    if (currentIdentity.packageId !== boundIdentity.packageId) {
      state.identityMismatchDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "PACKAGE_IDENTITY_MISMATCH";
      maybeInvalidateController(adapter, "PACKAGE_IDENTITY_MISMATCH");
      return freezeStatus(state);
    }
    if (currentIdentity.recipeId !== boundIdentity.recipeId) {
      state.identityMismatchDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "RECIPE_IDENTITY_MISMATCH";
      maybeInvalidateController(adapter, "RECIPE_IDENTITY_MISMATCH");
      return freezeStatus(state);
    }
    if (currentIdentity.selectorSeed !== boundIdentity.selectorSeed) {
      state.identityMismatchDetected = true;
      state.eventRejectedCount += 1;
      state.lastFailureReason = "SELECTOR_SEED_MISMATCH";
      maybeInvalidateController(adapter, "SELECTOR_SEED_MISMATCH");
      return freezeStatus(state);
    }

    const requestResult = requestAutomaticViewportPopulationRefresh(
      adapter.__deps.controller,
      {
      eventName,
      viewportIdentity: viewportIdentity.viewportIdentity,
      featureSourceGenerationId: viewportIdentity.featureSourceGenerationId,
      mapIdentityId: identity.mapIdentityId,
      regionId: identity.regionId,
      packageId: identity.packageId,
      recipeId: identity.recipeId,
      selectorSeed: identity.selectorSeed
      }
    );
    state.eventForwardedCount += 1;
    state.lastFailureReason = null;

  if (
      requestResult?.outcome === "queued" ||
      requestResult?.reasonCode === "QUEUED_REFRESH_REPLACED"
    ) {
      return scheduleQueuedRefreshExecution(adapter, eventName);
    }

    return freezeStatus(state);
  } catch (error) {
    state.eventRejectedCount += 1;
    state.lastFailureReason = toReasonCode(
      error,
      "AUTOMATIC_POPULATION_EVENT_FORWARD_FAILED"
    );
    if (state.lastFailureReason === "MAP_UNAVAILABLE") {
      state.staleMapDetected = true;
    }
    maybeInvalidateController(adapter, state.lastFailureReason);
    return freezeStatus(state);
  }
}

export function createAtlasAutomaticPopulationLiveEventAdapter({
  mapProvider = unavailable("AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"),
  controller = null,
  listenerRegistrar = unavailable(
    "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
  ),
  listenerRemover = unavailable(
    "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
  ),
  viewportIdentityProvider = unavailable(
    "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
  ),
  readinessProvider = unavailable(
    "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
  ),
  atlasIdentityProvider = unavailable(
    "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
  )
} = {}) {
  const state = {
    adapterReady: false,
    state: "disabled",
    enabled: false,
    listenerOwnerId: null,
    boundMapIdentityId: null,
    boundSessionId: null,
    moveendRegistered: false,
    zoomendRegistered: false,
    resizeRegistered: false,
    ownedListenerCount: 0,
    enableAttemptCount: 0,
    enableCompletedCount: 0,
    disableAttemptCount: 0,
    disableCompletedCount: 0,
    eventReceivedCount: 0,
    eventForwardedCount: 0,
    eventRejectedCount: 0,
    refreshExecutionRequestedCount: 0,
    refreshExecutionStartedCount: 0,
    refreshExecutionCompletedCount: 0,
    executionBlockedCount: 0,
    moveendReceivedCount: 0,
    zoomendReceivedCount: 0,
    resizeReceivedCount: 0,
    staleMapDetected: false,
    readinessBlockedDetected: false,
    identityMismatchDetected: false,
    lastEventReason: null,
    lastExecutionReason: null,
    lastFailureReason: null,
    referencesReleased: true
  };

  const internal = {
    boundMap: null,
    boundAtlasIdentity: null,
    registrations: { moveend: null, zoomend: null, resize: null },
    callbacks: { moveend: null, zoomend: null, resize: null }
    ,
    executionMicrotaskScheduled: false
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAutomaticPopulationLiveEventAdapter: true,
    __state: state,
    __internal: internal,
    __deps: {
      mapProvider,
      controller,
      listenerRegistrar,
      listenerRemover,
      viewportIdentityProvider,
      readinessProvider,
      atlasIdentityProvider
    }
  });
}

export function enableAtlasAutomaticPopulationLiveEventAdapter(adapter) {
  assertAdapter(adapter);
  const state = adapter.__state;
  const internal = adapter.__internal;
  state.enableAttemptCount += 1;
  try {
    const { map, identity, deps } = getCurrentMapAndIdentity(adapter);
    if (state.enabled === true || state.ownedListenerCount > 0) {
      state.lastFailureReason = "ADAPTER_ALREADY_ENABLED";
      throw Object.assign(new Error("ADAPTER_ALREADY_ENABLED"), {
        reasonCode: "ADAPTER_ALREADY_ENABLED"
      });
    }

    if (!getAutomaticViewportPopulationControllerStatus(deps.controller)) {
      throw Object.assign(new Error("AUTOMATIC_POPULATION_CONTROLLER_UNAVAILABLE"), {
        reasonCode: "AUTOMATIC_POPULATION_CONTROLLER_UNAVAILABLE"
      });
    }

    internal.boundMap = map;
    internal.boundAtlasIdentity = identity;
    state.boundMapIdentityId = identity.mapIdentityId;
    state.boundSessionId = identity.sessionId;
    state.listenerOwnerId = `ATLAS_AUTO_EVENT_LISTENER_OWNER_${identity.mapIdentityId}`;
    state.referencesReleased = false;

    for (const eventName of APPROVED_EVENTS) {
      const callback = (eventObject) =>
        handleApprovedEvent(adapter, eventName, eventObject);
      internal.callbacks[eventName] = callback;
      internal.registrations[eventName] = deps.listenerRegistrar(
        map,
        eventName,
        callback
      );
    }

    state.enabled = true;
    state.state = "enabled";
    state.enableCompletedCount += 1;
    state.lastFailureReason = null;
    syncListenerState(adapter);
    return freezeStatus(state);
  } catch (error) {
    const deps = adapter.__deps;
    for (const eventName of APPROVED_EVENTS) {
      if (internal.registrations[eventName]) {
        try {
          deps.listenerRemover(
            internal.boundMap,
            eventName,
            internal.callbacks[eventName]
          );
        } catch {
          // keep narrow: registration rollback best effort only
        }
      }
    }
    clearBindings(adapter);
    state.enabled = false;
    state.state = "failed_closed";
    state.lastFailureReason = toReasonCode(
      error,
      "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_ENABLE_FAILED"
    );
    return freezeStatus(state);
  }
}

export function disableAtlasAutomaticPopulationLiveEventAdapter(adapter) {
  assertAdapter(adapter);
  const state = adapter.__state;
  const internal = adapter.__internal;
  state.disableAttemptCount += 1;
  try {
    validateDependencies(adapter);
    for (const eventName of APPROVED_EVENTS) {
      if (internal.registrations[eventName]) {
        adapter.__deps.listenerRemover(
          internal.boundMap,
          eventName,
          internal.callbacks[eventName]
        );
      }
    }
    clearBindings(adapter);
    state.enabled = false;
    state.state = "disabled";
    state.disableCompletedCount += 1;
    state.lastFailureReason = null;
    return freezeStatus(state);
  } catch (error) {
    clearBindings(adapter);
    state.enabled = false;
    state.state = "disabled";
    state.disableCompletedCount += 1;
    state.lastFailureReason = toReasonCode(
      error,
      "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_DISABLE_FAILED"
    );
    return freezeStatus(state);
  }
}

export function validateAtlasAutomaticPopulationLiveEventAdapter(adapter) {
  assertAdapter(adapter);
  try {
    const { map, identity } = getCurrentMapAndIdentity(adapter);
    const controllerStatus = getAutomaticViewportPopulationControllerStatus(
      adapter.__deps.controller
    );
    const valid =
      validateMapShape(map) &&
      Boolean(identity.mapIdentityId) &&
      controllerStatus.schemaId != null;
    return deepFreeze({
      valid,
      reasonCode: valid ? "ADAPTER_VALID" : "ADAPTER_INVALID",
      status: getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter)
    });
  } catch (error) {
    return deepFreeze({
      valid: false,
      reasonCode: toReasonCode(
        error,
        "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE"
      ),
      status: getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter)
    });
  }
}

export function getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter) {
  if (!adapter?.__growgoDeveloperOnlyAtlasAutomaticPopulationLiveEventAdapter) {
    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      adapterReady: false,
      state: "disabled",
      enabled: false,
      listenerOwnerId: null,
      boundMapIdentityId: null,
      boundSessionId: null,
      moveendRegistered: false,
      zoomendRegistered: false,
      resizeRegistered: false,
      ownedListenerCount: 0,
      enableAttemptCount: 0,
      enableCompletedCount: 0,
      disableAttemptCount: 0,
      disableCompletedCount: 0,
      eventReceivedCount: 0,
      eventForwardedCount: 0,
      eventRejectedCount: 0,
      refreshExecutionRequestedCount: 0,
      refreshExecutionStartedCount: 0,
      refreshExecutionCompletedCount: 0,
      executionBlockedCount: 0,
      moveendReceivedCount: 0,
      zoomendReceivedCount: 0,
      resizeReceivedCount: 0,
      staleMapDetected: false,
      readinessBlockedDetected: false,
      identityMismatchDetected: false,
      lastEventReason: null,
      lastExecutionReason: null,
      lastFailureReason: "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE",
      referencesReleased: true,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  adapter.__state.adapterReady =
    isAvailableFunction(adapter.__deps.mapProvider) &&
    adapter.__deps.controller != null &&
    isAvailableFunction(adapter.__deps.listenerRegistrar) &&
    isAvailableFunction(adapter.__deps.listenerRemover) &&
    isAvailableFunction(adapter.__deps.viewportIdentityProvider) &&
    isAvailableFunction(adapter.__deps.readinessProvider) &&
    isAvailableFunction(adapter.__deps.atlasIdentityProvider);
  syncListenerState(adapter);
  return freezeStatus(adapter.__state);
}
