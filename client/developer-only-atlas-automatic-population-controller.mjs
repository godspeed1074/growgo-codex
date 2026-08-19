import { selectVisibleAtlasChunks, diffAtlasChunkSets } from "./developer-only-atlas-chunk-identity.mjs";
import { prioritizeAtlasActiveChunks } from "./developer-only-atlas-active-chunk-policy.mjs";
import {
  getAtlasChunkPopulationReconcilerStatus,
  reconcileAtlasChunkPopulation,
  releaseAtlasChunkPopulation
} from "./developer-only-atlas-chunk-population-reconciler.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_AUTOMATIC_POPULATION_CONTROLLER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_AUTOMATIC_POPULATION_CONTROLLER_RESULT_001";

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = [
  "move",
  "drag",
  "mousemove",
  "touchmove",
  "wheel",
  "timer",
  "polling",
  "startup"
];

const DEFAULT_BUDGETS = Object.freeze({
  maxSourceFeaturesPerViewport: 64,
  maxNormalizedFeatures: 48,
  maxPopulationCommands: 24,
  maxVegetationInstances: 18,
  maxBuildingInstances: 6,
  maxAutomaticRefreshesPerCompletedViewportGeneration: 1
});

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

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`.toUpperCase();
}

function clonePlain(value) {
  if (value == null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function normalizeAtlasIdentity(identity = {}) {
  return {
    mapIdentityId: sanitizeString(identity.mapIdentityId),
    regionId: sanitizeString(identity.regionId),
    packageId: sanitizeString(identity.packageId),
    recipeId: sanitizeString(identity.recipeId),
    selectorSeed: sanitizeString(identity.selectorSeed)
  };
}

function normalizeViewportIdentity(value = {}) {
  return {
    viewportIdentity: sanitizeString(
      value.viewportIdentity ?? value.viewportOrTileId
    ),
    featureSourceGenerationId: sanitizeString(value.featureSourceGenerationId ?? value.sourceGenerationId),
    bounds: value?.bounds ?? null,
    zoom: value?.zoom == null ? null : Number(value.zoom)
  };
}

function normalizeBudget(input = {}) {
  return deepFreeze({
    maxSourceFeaturesPerViewport: Number(
      input.maxSourceFeaturesPerViewport ??
        DEFAULT_BUDGETS.maxSourceFeaturesPerViewport
    ),
    maxNormalizedFeatures: Number(
      input.maxNormalizedFeatures ?? DEFAULT_BUDGETS.maxNormalizedFeatures
    ),
    maxPopulationCommands: Number(
      input.maxPopulationCommands ?? DEFAULT_BUDGETS.maxPopulationCommands
    ),
    maxVegetationInstances: Number(
      input.maxVegetationInstances ?? DEFAULT_BUDGETS.maxVegetationInstances
    ),
    maxBuildingInstances: Number(
      input.maxBuildingInstances ?? DEFAULT_BUDGETS.maxBuildingInstances
    ),
    maxAutomaticRefreshesPerCompletedViewportGeneration: Number(
      input.maxAutomaticRefreshesPerCompletedViewportGeneration ??
        DEFAULT_BUDGETS.maxAutomaticRefreshesPerCompletedViewportGeneration
    )
  });
}

function validateDependencyAvailability(deps) {
  return (
    isAvailableFunction(deps.viewportIdentityProvider) &&
    isAvailableFunction(deps.atlasIdentityProvider) &&
    isAvailableFunction(deps.readinessProvider) &&
    isAvailableFunction(deps.liveFeatureAdapter) &&
    isAvailableFunction(deps.populationPlanner) &&
    isAvailableFunction(deps.populationDrawIntegration) &&
    isAvailableFunction(deps.populationReferenceReleaseProvider)
  );
}

function createGeneration({ triggerReason, viewportIdentity, atlasIdentity }) {
  const seed = {
    triggerReason,
    viewportIdentity: viewportIdentity.viewportIdentity,
    mapIdentityId: atlasIdentity.mapIdentityId,
    regionId: atlasIdentity.regionId,
    packageId: atlasIdentity.packageId,
    recipeId: atlasIdentity.recipeId,
    selectorSeed: atlasIdentity.selectorSeed
  };
  return deepFreeze({
    ...seed,
    viewportGenerationId: `ATLAS_AUTO_VIEWPORT_GENERATION_${hashString(
      stableSerialize(seed)
    ).slice(0, 16)}`,
    featureSourceGenerationId: viewportIdentity.featureSourceGenerationId
  });
}

function buildResult(operation, outcome, reasonCode, controller, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    status: getAutomaticViewportPopulationControllerStatus(controller),
    ...extra
  });
}

function ensureController(controller) {
  if (
    !controller?.__growgoDeveloperOnlyAtlasAutomaticPopulationController ||
    !controller.__state ||
    !controller.__deps ||
    !controller.__internal
  ) {
    throw Object.assign(
      new Error("AUTOMATIC_POPULATION_CONTROLLER_UNAVAILABLE"),
      { reasonCode: "AUTOMATIC_POPULATION_CONTROLLER_UNAVAILABLE" }
    );
  }
  return controller;
}

function clearGenerationState(state, internal) {
  state.currentViewportIdentity = null;
  state.currentViewportGenerationId = null;
  state.queuedViewportGenerationId = null;
  state.activeViewportGenerationId = null;
  state.followUpViewportGenerationId = null;
  state.followUpRefreshPending = false;
  state.lastTriggerReason = null;
  internal.queuedGeneration = null;
  internal.activeGeneration = null;
  internal.followUpGeneration = null;
  internal.relevantChunks = [];
  state.currentRelevantChunkIds = [];
  state.chunksAdded = [];
  state.chunksRetained = [];
  state.chunksRemoved = [];
  state.requestedRelevantChunkIds = [];
  state.chunksEvictedByCap = [];
}

function reconcileChunkOwnedPopulation(controller, generation) {
  const reconciler = controller.__deps.chunkPopulationReconciler;
  if (!reconciler) return null;
  const result = reconcileAtlasChunkPopulation(reconciler, {
    chunks: controller.__internal.relevantChunks,
    identity: {
      mapIdentityId: generation.mapIdentityId,
      regionId: generation.regionId,
      packageId: generation.packageId,
      recipeId: generation.recipeId,
      selectorSeed: generation.selectorSeed
    }
  });
  if (result.outcome !== "reconciled") {
    throw Object.assign(new Error(result.reasonCode), { reasonCode: result.reasonCode });
  }
  const ownership = result.status;
  controller.__state.chunkOwnedPopulationReferenceCount = ownership.populationReferenceCount;
  controller.__state.activeChunkPopulationIds = ownership.activePopulationIds;
  return result;
}

function releaseChunkOwnedPopulation(controller) {
  const reconciler = controller.__deps.chunkPopulationReconciler;
  if (!reconciler) return null;
  const result = releaseAtlasChunkPopulation(reconciler);
  const ownership = getAtlasChunkPopulationReconcilerStatus(reconciler);
  controller.__state.chunkOwnedPopulationReferenceCount = ownership.populationReferenceCount;
  controller.__state.activeChunkPopulationIds = ownership.activePopulationIds;
  if (result.outcome !== "released") {
    appendCleanupFailure(controller.__state, result.reasonCode);
  }
  return result;
}

function resolveChunkDiagnostics(controller, viewportIdentity) {
  if (!viewportIdentity?.bounds) return null;
  const selector = isAvailableFunction(controller.__deps.chunkSelector) ? controller.__deps.chunkSelector : selectVisibleAtlasChunks;
  const selection = selector({ bounds: viewportIdentity.bounds, zoom: viewportIdentity.zoom });
  const pressure = prioritizeAtlasActiveChunks({
    chunks: selection?.chunks ?? [],
    viewportBounds: viewportIdentity.bounds,
    maxActiveChunks: controller.__deps.maxActiveChunks
  });
  const diff = diffAtlasChunkSets(controller.__internal.relevantChunks, pressure.activeChunks);
  controller.__internal.relevantChunks = [...pressure.activeChunks];
  controller.__state.requestedRelevantChunkIds = [...pressure.requestedChunkIds];
  controller.__state.currentRelevantChunkIds = [...pressure.activeChunkIds];
  controller.__state.chunksAdded = [...diff.addedChunkIds];
  controller.__state.chunksRetained = [...diff.retainedChunkIds];
  controller.__state.chunksRemoved = [...diff.removedChunkIds];
  controller.__state.chunksEvictedByCap = [...pressure.evictedChunkIds];
  return deepFreeze({ selection, pressure, diff });
}

function clearActiveGeneration(state, internal) {
  internal.activeGeneration = null;
  state.activeViewportGenerationId = null;
}

function clearPopulationReferences(state, internal) {
  state.currentPopulationPlanId = null;
  state.currentBatchId = null;
  state.currentCommandCount = 0;
  state.populationReferenceCount = 0;
  state.sourceFeatureCount = 0;
  state.normalizedFeatureCount = 0;
  state.referencesReleased = true;
  internal.currentPopulation = null;
  internal.currentFeatureSourceGenerationId = null;
}

function appendCleanupFailure(state, reasonCode) {
  const normalized = sanitizeString(reasonCode);
  if (!normalized) {
    return;
  }
  if (!state.cleanupFailureReasons.includes(normalized)) {
    state.cleanupFailureReasons = [...state.cleanupFailureReasons, normalized];
  }
}

function releaseControllerOwnedPopulationReferences(
  controller,
  operationName,
  preserveCurrentPopulation = false
) {
  const state = controller.__state;
  const deps = controller.__deps;
  const internal = controller.__internal;
  if (!internal.currentPopulation) {
    state.referencesReleased = true;
    return buildResult(
      operationName,
      operationName === "disableAutomaticViewportPopulation"
        ? "disabled"
        : "invalidated",
      operationName === "disableAutomaticViewportPopulation"
        ? "AUTOMATIC_POPULATION_DISABLED"
        : state.invalidationReason ?? "AUTOMATIC_INVALIDATED",
      controller
    );
  }

  const releaseResult = deps.populationReferenceReleaseProvider({
    currentPopulation: clonePlain(internal.currentPopulation),
    scope: "automatic_population_controller"
  });
  if (releaseResult?.released !== true) {
    appendCleanupFailure(
      state,
      sanitizeString(releaseResult?.reasonCode) ??
        "POPULATION_REFERENCE_RELEASE_FAILED"
    );
    state.referencesReleased = false;
  } else {
    state.referencesReleased = true;
    if (!preserveCurrentPopulation) {
      clearPopulationReferences(state, internal);
    }
  }
  return null;
}

function resolveViewportIdentity(controller, eventName) {
  const result = controller.__deps.viewportIdentityProvider({ eventName });
  const normalized = normalizeViewportIdentity(result);
  if (!normalized.viewportIdentity) {
    throw Object.assign(new Error("VIEWPORT_IDENTITY_UNAVAILABLE"), {
      reasonCode: "VIEWPORT_IDENTITY_UNAVAILABLE"
    });
  }
  return normalized;
}

function resolveAtlasIdentity(controller, payload) {
  const result = controller.__deps.atlasIdentityProvider(payload);
  const normalized = normalizeAtlasIdentity(result);
  if (
    !normalized.mapIdentityId ||
    !normalized.regionId ||
    !normalized.packageId ||
    !normalized.recipeId ||
    !normalized.selectorSeed
  ) {
    throw Object.assign(new Error("ATLAS_IDENTITY_UNAVAILABLE"), {
      reasonCode: "ATLAS_IDENTITY_UNAVAILABLE"
    });
  }
  return normalized;
}

function assertGenerationIdentityStillMatches(controller, generation, phase) {
  const currentIdentity = resolveAtlasIdentity(controller, { phase, generation });
  if (currentIdentity.mapIdentityId !== generation.mapIdentityId) {
    throw Object.assign(new Error("MAP_IDENTITY_MISMATCH"), {
      reasonCode: "MAP_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.regionId !== generation.regionId) {
    throw Object.assign(new Error("REGION_IDENTITY_MISMATCH"), {
      reasonCode: "REGION_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.packageId !== generation.packageId) {
    throw Object.assign(new Error("PACKAGE_IDENTITY_MISMATCH"), {
      reasonCode: "PACKAGE_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.recipeId !== generation.recipeId) {
    throw Object.assign(new Error("RECIPE_IDENTITY_MISMATCH"), {
      reasonCode: "RECIPE_IDENTITY_MISMATCH"
    });
  }
  if (currentIdentity.selectorSeed !== generation.selectorSeed) {
    throw Object.assign(new Error("SELECTOR_SEED_MISMATCH"), {
      reasonCode: "SELECTOR_SEED_MISMATCH"
    });
  }
}

function validateReadiness(controller, payload) {
  const readiness = controller.__deps.readinessProvider(payload);
  if (readiness?.approved === false) {
    throw Object.assign(
      new Error(sanitizeString(readiness.reasonCode) ?? "READINESS_BLOCKED"),
      {
        reasonCode:
          sanitizeString(readiness.reasonCode) ?? "READINESS_BLOCKED"
      }
    );
  }
  return readiness;
}

function maybeInvalidateForReason(controller, reasonCode) {
  if (
    [
      "MAP_IDENTITY_MISMATCH",
      "REGION_IDENTITY_MISMATCH",
      "PACKAGE_IDENTITY_MISMATCH",
      "RECIPE_IDENTITY_MISMATCH",
      "SELECTOR_SEED_MISMATCH",
      "READINESS_BLOCKED",
      "REGION_OUT_OF_SCOPE"
    ].includes(reasonCode)
  ) {
    return invalidateAutomaticViewportPopulationController(controller, reasonCode);
  }
  return null;
}

function countCommandsByCategory(commands, category) {
  return commands.filter(
    (command) => sanitizeString(command.assetCategory) === category
  ).length;
}

export function createAtlasAutomaticPopulationController({
  viewportIdentityProvider = unavailable("VIEWPORT_IDENTITY_PROVIDER_UNAVAILABLE"),
  atlasIdentityProvider = unavailable("ATLAS_IDENTITY_PROVIDER_UNAVAILABLE"),
  readinessProvider = unavailable("READINESS_PROVIDER_UNAVAILABLE"),
  liveFeatureAdapter = unavailable("LIVE_FEATURE_ADAPTER_UNAVAILABLE"),
  populationPlanner = unavailable("POPULATION_PLANNER_UNAVAILABLE"),
  populationDrawIntegration = unavailable(
    "POPULATION_DRAW_INTEGRATION_UNAVAILABLE"
  ),
  populationReferenceReleaseProvider = unavailable(
    "POPULATION_REFERENCE_RELEASE_PROVIDER_UNAVAILABLE"
  ),
  chunkSelector = null,
  chunkPopulationReconciler = null,
  maxActiveChunks = undefined,
  budgets = DEFAULT_BUDGETS
} = {}) {
  const state = {
    automaticPopulationEnabled: false,
    state: "disabled",
    controllerReady: false,
    currentViewportIdentity: null,
    currentViewportGenerationId: null,
    queuedViewportGenerationId: null,
    activeViewportGenerationId: null,
    followUpViewportGenerationId: null,
    followUpRefreshPending: false,
    refreshRequestedCount: 0,
    refreshQueuedCount: 0,
    refreshStartedCount: 0,
    refreshCompletedCount: 0,
    refreshCoalescedCount: 0,
    staleRefreshDiscardedCount: 0,
    skippedUnchangedViewportCount: 0,
    currentPopulationPlanId: null,
    currentBatchId: null,
    currentCommandCount: 0,
    populationReferenceCount: 0,
    sourceFeatureCount: 0,
    normalizedFeatureCount: 0,
    lastTriggerReason: null,
    lastFailureReason: null,
    invalidationReason: null,
    cleanupFailureReasons: [],
    referencesReleased: true,
    recursiveRefreshDetected: false,
    parallelFeatureReadDetected: false,
    parallelPlanningDetected: false,
    parallelSubmissionDetected: false,
    parallelDrawDetected: false,
    currentRelevantChunkIds: [],
    chunksAdded: [],
    chunksRetained: [],
    chunksRemoved: [],
    requestedRelevantChunkIds: [],
    chunksEvictedByCap: [],
    chunkOwnedPopulationReferenceCount: 0,
    activeChunkPopulationIds: []
  };

  const internal = {
    budgets: normalizeBudget(budgets),
    queuedGeneration: null,
    activeGeneration: null,
    followUpGeneration: null,
    currentPopulation: null,
    currentFeatureSourceGenerationId: null,
    activeRunId: 0,
    nextRunId: 0,
    featureReadActive: false,
    planningActive: false,
    submissionActive: false,
    drawActive: false,
    lastCompletedViewportGenerationId: null,
    lastCompletedViewportIdentity: null,
    relevantChunks: []
  };

  const deps = {
    viewportIdentityProvider,
    atlasIdentityProvider,
    readinessProvider,
    liveFeatureAdapter,
    populationPlanner,
    populationDrawIntegration,
    populationReferenceReleaseProvider,
    chunkSelector,
    chunkPopulationReconciler,
    maxActiveChunks
  };

  state.controllerReady = validateDependencyAvailability(deps);

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAutomaticPopulationController: true,
    __state: state,
    __internal: internal,
    __deps: deps
  });
}

export function getAutomaticViewportPopulationControllerStatus(controller) {
  if (!controller?.__growgoDeveloperOnlyAtlasAutomaticPopulationController) {
    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      automaticPopulationEnabled: false,
      state: "disabled",
      controllerReady: false,
      currentViewportIdentity: null,
      currentViewportGenerationId: null,
      queuedViewportGenerationId: null,
      activeViewportGenerationId: null,
      followUpViewportGenerationId: null,
      followUpRefreshPending: false,
      refreshRequestedCount: 0,
      refreshQueuedCount: 0,
      refreshStartedCount: 0,
      refreshCompletedCount: 0,
      refreshCoalescedCount: 0,
      staleRefreshDiscardedCount: 0,
      skippedUnchangedViewportCount: 0,
      currentPopulationPlanId: null,
      currentBatchId: null,
      currentCommandCount: 0,
      populationReferenceCount: 0,
      sourceFeatureCount: 0,
      normalizedFeatureCount: 0,
      lastTriggerReason: null,
      lastFailureReason: "AUTOMATIC_POPULATION_CONTROLLER_UNAVAILABLE",
      invalidationReason: null,
      cleanupFailureReasons: deepFreeze([]),
      referencesReleased: true,
      recursiveRefreshDetected: false,
      parallelFeatureReadDetected: false,
      parallelPlanningDetected: false,
      parallelSubmissionDetected: false,
      parallelDrawDetected: false,
      currentRelevantChunkIds: deepFreeze([]),
      chunksAdded: deepFreeze([]),
      chunksRetained: deepFreeze([]),
      chunksRemoved: deepFreeze([]),
      requestedRelevantChunkIds: deepFreeze([]),
      chunksEvictedByCap: deepFreeze([]),
      chunkOwnedPopulationReferenceCount: 0,
      activeChunkPopulationIds: deepFreeze([]),
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const state = controller.__state;
  state.controllerReady = validateDependencyAvailability(controller.__deps);
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    automaticPopulationEnabled: state.automaticPopulationEnabled,
    state: state.state,
    controllerReady: state.controllerReady,
    currentViewportIdentity: state.currentViewportIdentity,
    currentViewportGenerationId: state.currentViewportGenerationId,
    queuedViewportGenerationId: state.queuedViewportGenerationId,
    activeViewportGenerationId: state.activeViewportGenerationId,
    followUpViewportGenerationId: state.followUpViewportGenerationId,
    followUpRefreshPending: state.followUpRefreshPending,
    refreshRequestedCount: state.refreshRequestedCount,
    refreshQueuedCount: state.refreshQueuedCount,
    refreshStartedCount: state.refreshStartedCount,
    refreshCompletedCount: state.refreshCompletedCount,
    refreshCoalescedCount: state.refreshCoalescedCount,
    staleRefreshDiscardedCount: state.staleRefreshDiscardedCount,
    skippedUnchangedViewportCount: state.skippedUnchangedViewportCount,
    currentPopulationPlanId: state.currentPopulationPlanId,
    currentBatchId: state.currentBatchId,
    currentCommandCount: state.currentCommandCount,
    populationReferenceCount: state.populationReferenceCount,
    sourceFeatureCount: state.sourceFeatureCount,
    normalizedFeatureCount: state.normalizedFeatureCount,
    lastTriggerReason: state.lastTriggerReason,
    lastFailureReason: state.lastFailureReason,
    invalidationReason: state.invalidationReason,
    cleanupFailureReasons: deepFreeze([...state.cleanupFailureReasons]),
    referencesReleased: state.referencesReleased,
    recursiveRefreshDetected: state.recursiveRefreshDetected,
    parallelFeatureReadDetected: state.parallelFeatureReadDetected,
    parallelPlanningDetected: state.parallelPlanningDetected,
    parallelSubmissionDetected: state.parallelSubmissionDetected,
    parallelDrawDetected: state.parallelDrawDetected,
    currentRelevantChunkIds: deepFreeze([...state.currentRelevantChunkIds]),
    chunksAdded: deepFreeze([...state.chunksAdded]),
    chunksRetained: deepFreeze([...state.chunksRetained]),
    chunksRemoved: deepFreeze([...state.chunksRemoved]),
    requestedRelevantChunkIds: deepFreeze([...state.requestedRelevantChunkIds]),
    chunksEvictedByCap: deepFreeze([...state.chunksEvictedByCap]),
    chunkOwnedPopulationReferenceCount: state.chunkOwnedPopulationReferenceCount,
    activeChunkPopulationIds: deepFreeze([...state.activeChunkPopulationIds]),
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function enableAutomaticViewportPopulation(controller) {
  ensureController(controller);
  const state = controller.__state;
  state.controllerReady = validateDependencyAvailability(controller.__deps);
  if (!state.controllerReady) {
    state.state = "failed_closed";
    state.lastFailureReason = "AUTOMATIC_POPULATION_CONTROLLER_DEPENDENCIES_UNAVAILABLE";
    return buildResult(
      "enableAutomaticViewportPopulation",
      "failed_closed",
      "AUTOMATIC_POPULATION_CONTROLLER_DEPENDENCIES_UNAVAILABLE",
      controller
    );
  }
  state.automaticPopulationEnabled = true;
  state.state = "attached_idle";
  state.lastFailureReason = null;
  state.invalidationReason = null;
  state.cleanupFailureReasons = [];
  return buildResult(
    "enableAutomaticViewportPopulation",
    "enabled",
    "AUTOMATIC_POPULATION_ENABLED",
    controller
  );
}

export function disableAutomaticViewportPopulation(controller) {
  ensureController(controller);
  const state = controller.__state;
  const internal = controller.__internal;
  state.automaticPopulationEnabled = false;
  state.state = "cleanup_pending";
  clearGenerationState(state, internal);
  releaseChunkOwnedPopulation(controller);
  releaseControllerOwnedPopulationReferences(
    controller,
    "disableAutomaticViewportPopulation"
  );
  state.state = "disabled";
  return buildResult(
    "disableAutomaticViewportPopulation",
    "disabled",
    "AUTOMATIC_POPULATION_DISABLED",
    controller
  );
}

export function invalidateAutomaticViewportPopulationController(
  controller,
  reasonCode
) {
  ensureController(controller);
  const state = controller.__state;
  const internal = controller.__internal;
  const normalizedReason =
    sanitizeString(reasonCode) ?? "AUTOMATIC_POPULATION_INVALIDATED";
  state.automaticPopulationEnabled = false;
  state.state = "invalidated";
  state.invalidationReason = normalizedReason;
  state.lastFailureReason = normalizedReason;
  clearGenerationState(state, internal);
  releaseChunkOwnedPopulation(controller);
  releaseControllerOwnedPopulationReferences(
    controller,
    "invalidateAutomaticViewportPopulationController"
  );
  state.state = "invalidated";
  return buildResult(
    "invalidateAutomaticViewportPopulationController",
    "invalidated",
    normalizedReason,
    controller
  );
}

export function requestAutomaticViewportPopulationRefresh(
  controller,
  input = {}
) {
  ensureController(controller);
  const state = controller.__state;
  const internal = controller.__internal;
  const eventName = sanitizeString(input.eventName ?? input.triggerReason ?? input);

  if (state.automaticPopulationEnabled !== true || state.state === "disabled") {
    return buildResult(
      "requestAutomaticViewportPopulationRefresh",
      "blocked",
      "AUTOMATIC_POPULATION_DISABLED",
      controller
    );
  }

  if (state.state === "invalidated") {
    return buildResult(
      "requestAutomaticViewportPopulationRefresh",
      "blocked",
      state.invalidationReason ?? "AUTOMATIC_POPULATION_INVALIDATED",
      controller
    );
  }

  if (!APPROVED_EVENTS.includes(eventName)) {
    return buildResult(
      "requestAutomaticViewportPopulationRefresh",
      "blocked",
      FORBIDDEN_EVENTS.includes(eventName) ? "FORBIDDEN_EVENT" : "INVALID_EVENT",
      controller
    );
  }

  try {
    state.controllerReady = validateDependencyAvailability(controller.__deps);
    if (!state.controllerReady) {
      throw Object.assign(
        new Error("AUTOMATIC_POPULATION_CONTROLLER_DEPENDENCIES_UNAVAILABLE"),
        {
          reasonCode:
            "AUTOMATIC_POPULATION_CONTROLLER_DEPENDENCIES_UNAVAILABLE"
        }
      );
    }

    const viewportIdentity = resolveViewportIdentity(controller, eventName);
    const atlasIdentity = resolveAtlasIdentity(controller, {
      eventName,
      viewportIdentity
    });
    validateReadiness(controller, { eventName, viewportIdentity, atlasIdentity });

    const generation = createGeneration({
      triggerReason: eventName,
      viewportIdentity,
      atlasIdentity
    });
    // Diagnostics-only foundation: this never loads, unloads, or renders a chunk.
    const chunkDiagnostics = resolveChunkDiagnostics(controller, viewportIdentity);

    state.refreshRequestedCount += 1;
    state.lastTriggerReason = generation.triggerReason;

    const viewportUnchanged =
      state.currentViewportIdentity === generation.viewportIdentity &&
      state.currentViewportGenerationId === generation.viewportGenerationId;
    const featureSourceUnchanged =
      generation.featureSourceGenerationId == null ||
      generation.featureSourceGenerationId ===
        controller.__internal.currentFeatureSourceGenerationId;

    if (
      viewportUnchanged &&
      featureSourceUnchanged &&
      !internal.queuedGeneration &&
      !internal.activeGeneration
    ) {
      state.skippedUnchangedViewportCount += 1;
      state.state = "attached_idle";
      return buildResult(
        "requestAutomaticViewportPopulationRefresh",
        "skipped",
        "UNCHANGED_VIEWPORT",
        controller,
        { generation, chunkDiagnostics }
      );
    }

    state.state = "viewport_change_detected";

    if (internal.activeGeneration) {
      internal.followUpGeneration = generation;
      state.followUpViewportGenerationId = generation.viewportGenerationId;
      state.followUpRefreshPending = true;
      state.refreshCoalescedCount += 1;
      return buildResult(
        "requestAutomaticViewportPopulationRefresh",
        "coalesced",
        "FOLLOW_UP_REFRESH_QUEUED",
        controller,
        { generation, chunkDiagnostics }
      );
    }

    if (internal.queuedGeneration) {
      internal.queuedGeneration = generation;
      state.queuedViewportGenerationId = generation.viewportGenerationId;
      state.refreshCoalescedCount += 1;
      state.state = "population_queued";
      return buildResult(
        "requestAutomaticViewportPopulationRefresh",
        "coalesced",
        "QUEUED_REFRESH_REPLACED",
        controller,
        { generation, chunkDiagnostics }
      );
    }

    internal.queuedGeneration = generation;
    state.queuedViewportGenerationId = generation.viewportGenerationId;
    state.refreshQueuedCount += 1;
    state.state = "population_queued";
    return buildResult(
      "requestAutomaticViewportPopulationRefresh",
      "queued",
      "VIEWPORT_REFRESH_QUEUED",
      controller,
      { generation, chunkDiagnostics }
    );
  } catch (error) {
    const reasonCode = toReasonCode(error, "VIEWPORT_REFRESH_REQUEST_FAILED");
    state.lastFailureReason = reasonCode;
    const invalidated = maybeInvalidateForReason(controller, reasonCode);
    if (invalidated) {
      return invalidated;
    }
    state.state = "failed_closed";
    return buildResult(
      "requestAutomaticViewportPopulationRefresh",
      "failed_closed",
      reasonCode,
      controller
    );
  }
}

export function runQueuedAutomaticViewportPopulationRefresh(controller) {
  ensureController(controller);
  const state = controller.__state;
  const internal = controller.__internal;
  const deps = controller.__deps;

  if (state.automaticPopulationEnabled !== true) {
    return buildResult(
      "runQueuedAutomaticViewportPopulationRefresh",
      "blocked",
      "AUTOMATIC_POPULATION_DISABLED",
      controller
    );
  }

  if (internal.activeGeneration) {
    state.recursiveRefreshDetected = true;
    return buildResult(
      "runQueuedAutomaticViewportPopulationRefresh",
      "blocked",
      "ACTIVE_REFRESH_IN_PROGRESS",
      controller
    );
  }

  if (!internal.queuedGeneration) {
    return buildResult(
      "runQueuedAutomaticViewportPopulationRefresh",
      "blocked",
      "NO_QUEUED_REFRESH",
      controller
    );
  }

  const generation = internal.queuedGeneration;
  internal.queuedGeneration = null;
  state.queuedViewportGenerationId = null;
  internal.activeGeneration = generation;
  state.activeViewportGenerationId = generation.viewportGenerationId;
  state.refreshStartedCount += 1;
  internal.nextRunId += 1;
  internal.activeRunId = internal.nextRunId;
  const runId = internal.activeRunId;

  try {
    assertGenerationIdentityStillMatches(controller, generation, "run");
    validateReadiness(controller, { phase: "run", generation });

    if (internal.featureReadActive) {
      state.parallelFeatureReadDetected = true;
      throw Object.assign(new Error("PARALLEL_FEATURE_READ_DETECTED"), {
        reasonCode: "PARALLEL_FEATURE_READ_DETECTED"
      });
    }

    internal.featureReadActive = true;
    state.state = "reading_features";
    const featureResult = deps.liveFeatureAdapter({
      generation,
      budgets: clonePlain(internal.budgets)
    });
    internal.featureReadActive = false;

    if (
      sanitizeString(featureResult?.viewportGenerationId) &&
      sanitizeString(featureResult.viewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_AFTER_FEATURE_READ",
        controller
      );
    }

    const sourceFeatures = Array.isArray(featureResult?.sourceFeatures)
      ? featureResult.sourceFeatures
      : [];
    const normalizedFeatures = Array.isArray(featureResult?.normalizedFeatures)
      ? featureResult.normalizedFeatures
      : [];
    const sourceFeatureCount = Number(
      featureResult?.sourceFeatureCount ?? sourceFeatures.length
    );
    const normalizedFeatureCount = Number(
      featureResult?.normalizedFeatureCount ?? normalizedFeatures.length
    );
    const featureSourceGenerationId =
      sanitizeString(
        featureResult?.featureSourceGenerationId ??
          featureResult?.normalizedFeatureSourceGenerationId
      ) ?? generation.featureSourceGenerationId;

    state.sourceFeatureCount = sourceFeatureCount;
    state.normalizedFeatureCount = normalizedFeatureCount;

    if (sourceFeatureCount > internal.budgets.maxSourceFeaturesPerViewport) {
      throw Object.assign(new Error("SOURCE_FEATURE_BUDGET_EXCEEDED"), {
        reasonCode: "SOURCE_FEATURE_BUDGET_EXCEEDED"
      });
    }

    if (normalizedFeatureCount > internal.budgets.maxNormalizedFeatures) {
      throw Object.assign(new Error("NORMALIZED_FEATURE_BUDGET_EXCEEDED"), {
        reasonCode: "NORMALIZED_FEATURE_BUDGET_EXCEEDED"
      });
    }

    if (
      sanitizeString(featureResult?.normalizedViewportGenerationId) &&
      sanitizeString(featureResult.normalizedViewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_AFTER_NORMALIZATION",
        controller
      );
    }

    if (
      internal.lastCompletedViewportGenerationId === generation.viewportGenerationId &&
      (featureSourceGenerationId == null ||
        featureSourceGenerationId === internal.currentFeatureSourceGenerationId)
    ) {
      state.skippedUnchangedViewportCount += 1;
      clearActiveGeneration(state, internal);
      state.state = "attached_idle";
      if (internal.followUpGeneration) {
        internal.queuedGeneration = internal.followUpGeneration;
        state.queuedViewportGenerationId =
          internal.followUpGeneration.viewportGenerationId;
        state.followUpViewportGenerationId = null;
        state.followUpRefreshPending = false;
        internal.followUpGeneration = null;
        state.state = "population_queued";
      }
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "skipped",
        "UNCHANGED_VIEWPORT",
        controller
      );
    }

    if (internal.planningActive) {
      state.parallelPlanningDetected = true;
      throw Object.assign(new Error("PARALLEL_PLANNING_DETECTED"), {
        reasonCode: "PARALLEL_PLANNING_DETECTED"
      });
    }

    internal.planningActive = true;
    state.state = "planning";
    const plan = deps.populationPlanner({
      generation,
      featureResult,
      budgets: clonePlain(internal.budgets)
    });
    internal.planningActive = false;

    if (
      sanitizeString(plan?.viewportGenerationId) &&
      sanitizeString(plan.viewportGenerationId) !== generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_AFTER_PLANNING",
        controller
      );
    }

    if (
      sanitizeString(plan?.preSubmissionViewportGenerationId) &&
      sanitizeString(plan.preSubmissionViewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_BEFORE_SUBMISSION",
        controller
      );
    }

    const commands = Array.isArray(plan?.commands) ? plan.commands : [];
    const vegetationCount = countCommandsByCategory(commands, "vegetation");
    const buildingCount = countCommandsByCategory(commands, "building");

    if (commands.length > internal.budgets.maxPopulationCommands) {
      throw Object.assign(new Error("POPULATION_COMMAND_BUDGET_EXCEEDED"), {
        reasonCode: "POPULATION_COMMAND_BUDGET_EXCEEDED"
      });
    }
    if (vegetationCount > internal.budgets.maxVegetationInstances) {
      throw Object.assign(new Error("VEGETATION_BUDGET_EXCEEDED"), {
        reasonCode: "VEGETATION_BUDGET_EXCEEDED"
      });
    }
    if (buildingCount > internal.budgets.maxBuildingInstances) {
      throw Object.assign(new Error("BUILDING_BUDGET_EXCEEDED"), {
        reasonCode: "BUILDING_BUDGET_EXCEEDED"
      });
    }

    const instanceIds = new Set();
    for (const command of commands) {
      const instanceId = sanitizeString(command?.instanceId);
      if (!instanceId) {
        throw Object.assign(new Error("INVALID_INSTANCE_ID"), {
          reasonCode: "INVALID_INSTANCE_ID"
        });
      }
      if (instanceIds.has(instanceId)) {
        throw Object.assign(new Error("DUPLICATE_INSTANCE_ID"), {
          reasonCode: "DUPLICATE_INSTANCE_ID"
        });
      }
      instanceIds.add(instanceId);
    }

    if (runId !== internal.activeRunId) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_BEFORE_SUBMISSION",
        controller
      );
    }

    if (internal.submissionActive) {
      state.parallelSubmissionDetected = true;
      throw Object.assign(new Error("PARALLEL_SUBMISSION_DETECTED"), {
        reasonCode: "PARALLEL_SUBMISSION_DETECTED"
      });
    }

    const chunkPopulation = reconcileChunkOwnedPopulation(controller, generation);

    internal.submissionActive = true;
    state.state = "submitting";
    const integrationResult = deps.populationDrawIntegration({
      generation,
      plan,
      currentPopulation: clonePlain(internal.currentPopulation),
      chunkPopulation: clonePlain(chunkPopulation),
      redrawReason: generation.triggerReason
    });
    internal.submissionActive = false;

    const submissionResult = integrationResult?.submission ?? integrationResult;

    if (
      sanitizeString(submissionResult?.viewportGenerationId) &&
      sanitizeString(submissionResult.viewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_AFTER_SUBMISSION",
        controller
      );
    }

    if (internal.drawActive) {
      state.parallelDrawDetected = true;
      throw Object.assign(new Error("PARALLEL_DRAW_DETECTED"), {
        reasonCode: "PARALLEL_DRAW_DETECTED"
      });
    }

    internal.drawActive = true;
    state.state = "drawing";
    const drawResult = integrationResult?.draw ?? integrationResult;
    internal.drawActive = false;

    if (
      sanitizeString(drawResult?.viewportGenerationId) &&
      sanitizeString(drawResult.viewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportPopulationRefresh",
        "discarded",
        "STALE_AFTER_DRAW",
        controller
      );
    }

    if (drawResult?.drawCompleted !== true) {
      throw Object.assign(new Error("DRAW_FAILED"), {
        reasonCode: sanitizeString(drawResult?.reasonCode) ?? "DRAW_FAILED"
      });
    }

    state.state = "replacing_population";
    const previousPopulation = internal.currentPopulation;
    const nextPopulation = deepFreeze({
      planId:
        sanitizeString(plan.populationPlanId) ??
        `PLAN_${generation.viewportGenerationId}`,
      batchId:
        sanitizeString(submissionResult?.batchId) ??
        sanitizeString(drawResult?.batchId) ??
        `BATCH_${generation.viewportGenerationId}`,
      commandCount: commands.length,
      generationId: generation.viewportGenerationId,
      viewportIdentity: generation.viewportIdentity,
      instanceIds: [...instanceIds]
    });

    internal.currentPopulation = nextPopulation;
    state.currentViewportIdentity = generation.viewportIdentity;
    state.currentViewportGenerationId = generation.viewportGenerationId;
    state.currentPopulationPlanId = nextPopulation.planId;
    state.currentBatchId = nextPopulation.batchId;
    state.currentCommandCount = nextPopulation.commandCount;
    state.populationReferenceCount = nextPopulation.commandCount > 0 ? 2 : 0;
    state.referencesReleased = false;

    if (previousPopulation) {
      const releaseResult = deps.populationReferenceReleaseProvider({
        previousPopulation: clonePlain(previousPopulation),
        nextPopulation: clonePlain(nextPopulation),
        scope: "automatic_population_controller"
      });
      if (releaseResult?.released !== true) {
        appendCleanupFailure(
          state,
          sanitizeString(releaseResult?.reasonCode) ??
            "POPULATION_REFERENCE_RELEASE_FAILED"
        );
        state.lastFailureReason =
          sanitizeString(releaseResult?.reasonCode) ??
          "POPULATION_REFERENCE_RELEASE_FAILED";
        state.state = "failed_closed";
        clearActiveGeneration(state, internal);
        return buildResult(
          "runQueuedAutomaticViewportPopulationRefresh",
          "failed_closed",
          state.lastFailureReason,
          controller
        );
      }
    }

    internal.currentFeatureSourceGenerationId = featureSourceGenerationId;
    internal.lastCompletedViewportGenerationId = generation.viewportGenerationId;
    internal.lastCompletedViewportIdentity = generation.viewportIdentity;
    state.refreshCompletedCount += 1;
    state.lastFailureReason = null;
    state.cleanupFailureReasons = [];
    state.state = "attached_idle";
    clearActiveGeneration(state, internal);

    if (internal.followUpGeneration) {
      internal.queuedGeneration = internal.followUpGeneration;
      state.queuedViewportGenerationId =
        internal.followUpGeneration.viewportGenerationId;
      internal.followUpGeneration = null;
      state.followUpViewportGenerationId = null;
      state.followUpRefreshPending = false;
      state.state = "population_queued";
    }

    return buildResult(
      "runQueuedAutomaticViewportPopulationRefresh",
      "completed",
      "AUTOMATIC_POPULATION_REFRESH_COMPLETED",
      controller
    );
  } catch (error) {
    internal.featureReadActive = false;
    internal.planningActive = false;
    internal.submissionActive = false;
    internal.drawActive = false;
    clearActiveGeneration(state, internal);
    state.lastFailureReason = toReasonCode(
      error,
      "AUTOMATIC_VIEWPORT_POPULATION_REFRESH_FAILED"
    );
    const invalidated = maybeInvalidateForReason(
      controller,
      state.lastFailureReason
    );
    if (invalidated) {
      return invalidated;
    }
    state.state = "failed_closed";
    if (internal.followUpGeneration) {
      internal.queuedGeneration = internal.followUpGeneration;
      state.queuedViewportGenerationId =
        internal.followUpGeneration.viewportGenerationId;
      internal.followUpGeneration = null;
      state.followUpViewportGenerationId = null;
      state.followUpRefreshPending = false;
      state.state = "population_queued";
    }
    return buildResult(
      "runQueuedAutomaticViewportPopulationRefresh",
      "failed_closed",
      state.lastFailureReason,
      controller
    );
  }
}
