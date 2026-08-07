const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_AUTOMATIC_POPULATION_FAKE_RUNTIME_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_AUTOMATIC_POPULATION_FAKE_RUNTIME_RESULT_001";

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

const ALLOWED_STATES = new Set([
  "disabled",
  "attached_idle",
  "viewport_change_detected",
  "population_queued",
  "reading_features",
  "planning",
  "submitting",
  "drawing",
  "replacing_population",
  "cleanup_pending",
  "invalidated",
  "failed_closed"
]);

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

function normalizeIdentity(identity = {}) {
  return {
    mapIdentityId: sanitizeString(identity.mapIdentityId),
    regionId: sanitizeString(identity.regionId),
    packageId: sanitizeString(identity.packageId),
    recipeId: sanitizeString(identity.recipeId),
    selectorSeed: sanitizeString(identity.selectorSeed)
  };
}

function normalizeEventInput(event = {}) {
  return {
    eventName: sanitizeString(event.eventName ?? event.triggerReason),
    viewportIdentity: sanitizeString(event.viewportIdentity),
    mapIdentityId: sanitizeString(event.mapIdentityId),
    regionId: sanitizeString(event.regionId),
    packageId: sanitizeString(event.packageId),
    recipeId: sanitizeString(event.recipeId),
    selectorSeed: sanitizeString(event.selectorSeed),
    featureFingerprint: sanitizeString(event.featureFingerprint)
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

function createGeneration(input) {
  const normalized = normalizeEventInput(input);
  const triggerReason = normalized.eventName;
  const generationSeed = {
    viewportIdentity: normalized.viewportIdentity,
    mapIdentityId: normalized.mapIdentityId,
    regionId: normalized.regionId,
    packageId: normalized.packageId,
    recipeId: normalized.recipeId,
    selectorSeed: normalized.selectorSeed,
    triggerReason
  };
  return deepFreeze({
    ...generationSeed,
    viewportGenerationId: `ATLAS_AUTO_VIEWPORT_GENERATION_${hashString(
      stableSerialize(generationSeed)
    ).slice(0, 16)}`,
    featureFingerprint:
      normalized.featureFingerprint ??
      `FEATURES_${hashString(stableSerialize(generationSeed)).slice(0, 12)}`
  });
}

function buildResult(operation, outcome, reasonCode, runtime, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    status: getAutomaticPopulationFakeRuntimeStatus(runtime),
    ...extra
  });
}

function clearGenerationState(state) {
  state.currentViewportIdentity = null;
  state.currentViewportGenerationId = null;
  state.queuedViewportGenerationId = null;
  state.activeViewportGenerationId = null;
  state.followUpRefreshPending = false;
  state.lastTriggerReason = null;
}

function clearPopulationReferences(state, internal) {
  state.currentPopulationPlanId = null;
  state.currentBatchId = null;
  state.currentCommandCount = 0;
  state.sourceFeatureCount = 0;
  state.normalizedFeatureCount = 0;
  state.populationReferenceCount = 0;
  state.referencesReleased = true;
  internal.currentPopulation = null;
}

function clearActiveGeneration(state, internal) {
  internal.activeGeneration = null;
  state.activeViewportGenerationId = null;
}

function ensureRuntime(runtime) {
  if (
    !runtime?.__growgoDeveloperOnlyAtlasAutomaticPopulationFakeRuntime ||
    !runtime.__state ||
    !runtime.__deps ||
    !runtime.__internal
  ) {
    throw Object.assign(
      new Error("AUTOMATIC_POPULATION_FAKE_RUNTIME_UNAVAILABLE"),
      { reasonCode: "AUTOMATIC_POPULATION_FAKE_RUNTIME_UNAVAILABLE" }
    );
  }
  return runtime;
}

export function createAtlasAutomaticPopulationFakeRuntime({
  featureSourceProvider = () => {
    throw Object.assign(new Error("FEATURE_SOURCE_UNAVAILABLE"), {
      reasonCode: "FEATURE_SOURCE_UNAVAILABLE"
    });
  },
  planner = () => {
    throw Object.assign(new Error("PLANNER_UNAVAILABLE"), {
      reasonCode: "PLANNER_UNAVAILABLE"
    });
  },
  submission = () => {
    throw Object.assign(new Error("SUBMISSION_UNAVAILABLE"), {
      reasonCode: "SUBMISSION_UNAVAILABLE"
    });
  },
  draw = () => ({ drawCompleted: true }),
  releasePopulationReferences = () => ({ released: true }),
  readinessProvider = () => ({ approved: true, reasonCode: "READINESS_APPROVED" }),
  identityProvider = () =>
    normalizeIdentity({
      mapIdentityId: "MAP_A",
      regionId: "REGION_A",
      packageId: "PACKAGE_A",
      recipeId: "RECIPE_A",
      selectorSeed: "SEED_A"
    }),
  timeProvider = () => new Date().toISOString(),
  budgets = DEFAULT_BUDGETS
} = {}) {
  const state = {
    automaticPopulationEnabled: false,
    state: "disabled",
    currentViewportIdentity: null,
    currentViewportGenerationId: null,
    queuedViewportGenerationId: null,
    activeViewportGenerationId: null,
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
    sourceFeatureCount: 0,
    normalizedFeatureCount: 0,
    lastTriggerReason: null,
    lastFailureReason: null,
    invalidationReason: null,
    populationReferenceCount: 0,
    referencesReleased: true,
    recursiveRefreshDetected: false,
    parallelPlanningDetected: false,
    parallelSubmissionDetected: false,
    parallelDrawDetected: false
  };

  const internal = {
    budgets: normalizeBudget(budgets),
    queuedGeneration: null,
    activeGeneration: null,
    followUpGeneration: null,
    currentPopulation: null,
    currentFeatureFingerprint: null,
    planningActive: false,
    submissionActive: false,
    drawActive: false,
    activeRunId: 0,
    nextRunId: 0,
    lastCompletedGenerationId: null,
    lastCompletedViewportIdentity: null
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAutomaticPopulationFakeRuntime: true,
    __state: state,
    __deps: {
      featureSourceProvider,
      planner,
      submission,
      draw,
      releasePopulationReferences,
      readinessProvider,
      identityProvider,
      timeProvider
    },
    __internal: internal
  });
}

export function getAutomaticPopulationFakeRuntimeStatus(runtime) {
  if (!runtime?.__growgoDeveloperOnlyAtlasAutomaticPopulationFakeRuntime) {
    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      automaticPopulationEnabled: false,
      state: "disabled",
      currentViewportIdentity: null,
      currentViewportGenerationId: null,
      queuedViewportGenerationId: null,
      activeViewportGenerationId: null,
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
      sourceFeatureCount: 0,
      normalizedFeatureCount: 0,
      lastTriggerReason: null,
      lastFailureReason: "AUTOMATIC_POPULATION_FAKE_RUNTIME_UNAVAILABLE",
      invalidationReason: null,
      populationReferenceCount: 0,
      referencesReleased: true,
      recursiveRefreshDetected: false,
      parallelPlanningDetected: false,
      parallelSubmissionDetected: false,
      parallelDrawDetected: false,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const state = runtime.__state;
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    automaticPopulationEnabled: state.automaticPopulationEnabled,
    state: state.state,
    currentViewportIdentity: state.currentViewportIdentity,
    currentViewportGenerationId: state.currentViewportGenerationId,
    queuedViewportGenerationId: state.queuedViewportGenerationId,
    activeViewportGenerationId: state.activeViewportGenerationId,
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
    sourceFeatureCount: state.sourceFeatureCount,
    normalizedFeatureCount: state.normalizedFeatureCount,
    lastTriggerReason: state.lastTriggerReason,
    lastFailureReason: state.lastFailureReason,
    invalidationReason: state.invalidationReason,
    populationReferenceCount: state.populationReferenceCount,
    referencesReleased: state.referencesReleased,
    recursiveRefreshDetected: state.recursiveRefreshDetected,
    parallelPlanningDetected: state.parallelPlanningDetected,
    parallelSubmissionDetected: state.parallelSubmissionDetected,
    parallelDrawDetected: state.parallelDrawDetected,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function enableAutomaticPopulationFakeRuntime(runtime) {
  ensureRuntime(runtime);
  const state = runtime.__state;
  state.automaticPopulationEnabled = true;
  state.state = "attached_idle";
  state.lastFailureReason = null;
  state.invalidationReason = null;
  return buildResult(
    "enableAutomaticPopulationFakeRuntime",
    "enabled",
    "AUTOMATIC_POPULATION_ENABLED",
    runtime
  );
}

export function disableAutomaticPopulationFakeRuntime(runtime) {
  ensureRuntime(runtime);
  const state = runtime.__state;
  const internal = runtime.__internal;
  state.state = "cleanup_pending";
  internal.queuedGeneration = null;
  internal.activeGeneration = null;
  internal.followUpGeneration = null;
  clearGenerationState(state);
  clearPopulationReferences(state, internal);
  state.automaticPopulationEnabled = false;
  state.state = "disabled";
  return buildResult(
    "disableAutomaticPopulationFakeRuntime",
    "disabled",
    "AUTOMATIC_POPULATION_DISABLED",
    runtime
  );
}

export function invalidateAutomaticViewportPopulation(runtime, reasonCode) {
  ensureRuntime(runtime);
  const state = runtime.__state;
  const internal = runtime.__internal;
  const normalizedReason = sanitizeString(reasonCode) ?? "AUTOMATIC_INVALIDATED";
  state.automaticPopulationEnabled = false;
  state.state = "invalidated";
  state.invalidationReason = normalizedReason;
  state.lastFailureReason = normalizedReason;
  internal.queuedGeneration = null;
  internal.activeGeneration = null;
  internal.followUpGeneration = null;
  clearGenerationState(state);
  clearPopulationReferences(state, internal);
  return buildResult(
    "invalidateAutomaticViewportPopulation",
    "invalidated",
    normalizedReason,
    runtime
  );
}

export function requestAutomaticViewportRefresh(runtime, eventInput = {}) {
  ensureRuntime(runtime);
  const state = runtime.__state;
  const internal = runtime.__internal;

  if (state.automaticPopulationEnabled !== true || state.state === "disabled") {
    return buildResult(
      "requestAutomaticViewportRefresh",
      "blocked",
      "AUTOMATIC_POPULATION_DISABLED",
      runtime
    );
  }

  if (state.state === "invalidated") {
    return buildResult(
      "requestAutomaticViewportRefresh",
      "blocked",
      state.invalidationReason ?? "AUTOMATIC_INVALIDATED",
      runtime
    );
  }

  const normalizedEvent = normalizeEventInput(eventInput);
  if (!APPROVED_EVENTS.includes(normalizedEvent.eventName)) {
    const reasonCode = FORBIDDEN_EVENTS.includes(normalizedEvent.eventName)
      ? "FORBIDDEN_EVENT"
      : "INVALID_EVENT";
    return buildResult(
      "requestAutomaticViewportRefresh",
      "blocked",
      reasonCode,
      runtime
    );
  }

  const currentIdentity = normalizeIdentity(runtime.__deps.identityProvider());
  if (
    currentIdentity.mapIdentityId !== normalizedEvent.mapIdentityId ||
    currentIdentity.regionId !== normalizedEvent.regionId ||
    currentIdentity.packageId !== normalizedEvent.packageId ||
    currentIdentity.recipeId !== normalizedEvent.recipeId ||
    currentIdentity.selectorSeed !== normalizedEvent.selectorSeed
  ) {
    return invalidateAutomaticViewportPopulation(
      runtime,
      currentIdentity.mapIdentityId !== normalizedEvent.mapIdentityId
        ? "MAP_IDENTITY_MISMATCH"
        : currentIdentity.regionId !== normalizedEvent.regionId
          ? "REGION_IDENTITY_MISMATCH"
          : currentIdentity.packageId !== normalizedEvent.packageId
            ? "PACKAGE_IDENTITY_MISMATCH"
            : currentIdentity.recipeId !== normalizedEvent.recipeId
              ? "RECIPE_IDENTITY_MISMATCH"
              : "SELECTOR_SEED_MISMATCH"
    );
  }

  const generation = createGeneration(normalizedEvent);
  state.refreshRequestedCount += 1;
  state.lastTriggerReason = generation.triggerReason;

  if (
    state.currentViewportGenerationId === generation.viewportGenerationId &&
    internal.currentFeatureFingerprint === generation.featureFingerprint &&
    !internal.queuedGeneration &&
    !internal.activeGeneration
  ) {
    state.skippedUnchangedViewportCount += 1;
    state.state = "attached_idle";
    return buildResult(
      "requestAutomaticViewportRefresh",
      "skipped",
      "UNCHANGED_VIEWPORT",
      runtime,
      {
        generation
      }
    );
  }

  state.state = "viewport_change_detected";

  if (internal.activeGeneration) {
    state.refreshCoalescedCount += 1;
    state.followUpRefreshPending = true;
    internal.followUpGeneration = generation;
    return buildResult(
      "requestAutomaticViewportRefresh",
      "coalesced",
      "FOLLOW_UP_REFRESH_QUEUED",
      runtime,
      { generation }
    );
  }

  if (internal.queuedGeneration) {
    state.refreshCoalescedCount += 1;
    internal.queuedGeneration = generation;
    state.queuedViewportGenerationId = generation.viewportGenerationId;
    state.followUpRefreshPending = false;
    state.state = "population_queued";
    return buildResult(
      "requestAutomaticViewportRefresh",
      "coalesced",
      "QUEUED_REFRESH_REPLACED",
      runtime,
      { generation }
    );
  }

  internal.queuedGeneration = generation;
  state.queuedViewportGenerationId = generation.viewportGenerationId;
  state.refreshQueuedCount += 1;
  state.state = "population_queued";

  return buildResult(
    "requestAutomaticViewportRefresh",
    "queued",
    "VIEWPORT_REFRESH_QUEUED",
    runtime,
    { generation }
  );
}

export function runQueuedAutomaticViewportRefresh(runtime) {
  ensureRuntime(runtime);
  const state = runtime.__state;
  const deps = runtime.__deps;
  const internal = runtime.__internal;

  if (state.automaticPopulationEnabled !== true) {
    return buildResult(
      "runQueuedAutomaticViewportRefresh",
      "blocked",
      "AUTOMATIC_POPULATION_DISABLED",
      runtime
    );
  }

  if (internal.activeGeneration) {
    state.recursiveRefreshDetected = true;
    return buildResult(
      "runQueuedAutomaticViewportRefresh",
      "blocked",
      "ACTIVE_REFRESH_IN_PROGRESS",
      runtime
    );
  }

  if (!internal.queuedGeneration) {
    return buildResult(
      "runQueuedAutomaticViewportRefresh",
      "blocked",
      "NO_QUEUED_REFRESH",
      runtime
    );
  }

  const generation = internal.queuedGeneration;
  internal.queuedGeneration = null;
  state.queuedViewportGenerationId = null;
  internal.activeGeneration = generation;
  state.activeViewportGenerationId = generation.viewportGenerationId;
  state.refreshStartedCount += 1;
  internal.nextRunId += 1;
  const runId = internal.nextRunId;
  internal.activeRunId = runId;

  try {
    state.state = "reading_features";
    const readiness = deps.readinessProvider(generation);
    if (readiness?.approved === false) {
      return invalidateAutomaticViewportPopulation(
        runtime,
        sanitizeString(readiness.reasonCode) ?? "READINESS_BLOCKED"
      );
    }

    const featureResult = deps.featureSourceProvider(generation);
    if (
      sanitizeString(featureResult?.viewportGenerationId) &&
      sanitizeString(featureResult.viewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_VIEWPORT",
        runtime
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
    const featureFingerprint =
      sanitizeString(featureResult?.featureFingerprint) ??
      generation.featureFingerprint;

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

    state.sourceFeatureCount = sourceFeatureCount;
    state.normalizedFeatureCount = normalizedFeatureCount;

    if (
      internal.lastCompletedViewportIdentity === generation.viewportIdentity &&
      internal.currentFeatureFingerprint === featureFingerprint
    ) {
      state.skippedUnchangedViewportCount += 1;
      state.state = "attached_idle";
      clearActiveGeneration(state, internal);
      if (internal.followUpGeneration) {
        internal.queuedGeneration = internal.followUpGeneration;
        state.queuedViewportGenerationId =
          internal.followUpGeneration.viewportGenerationId;
        state.followUpRefreshPending = false;
        internal.followUpGeneration = null;
        state.state = "population_queued";
      }
      return buildResult(
        "runQueuedAutomaticViewportRefresh",
        "skipped",
        "UNCHANGED_VIEWPORT",
        runtime
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
    const plan = deps.planner({
      generation,
      featureResult,
      budgets: internal.budgets
    });
    internal.planningActive = false;

    const commands = Array.isArray(plan?.commands) ? plan.commands : [];
    const vegetationCount = commands.filter(
      (command) => sanitizeString(command.assetCategory) === "vegetation"
    ).length;
    const buildingCount = commands.filter(
      (command) => sanitizeString(command.assetCategory) === "building"
    ).length;

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
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_PLAN_RESULT",
        runtime
      );
    }

    if (internal.submissionActive) {
      state.parallelSubmissionDetected = true;
      throw Object.assign(new Error("PARALLEL_SUBMISSION_DETECTED"), {
        reasonCode: "PARALLEL_SUBMISSION_DETECTED"
      });
    }

    internal.submissionActive = true;
    state.state = "submitting";
    const submissionResult = deps.submission({
      generation,
      plan,
      currentPopulation: clonePlain(internal.currentPopulation)
    });
    internal.submissionActive = false;

    if (
      sanitizeString(submissionResult?.viewportGenerationId) &&
      sanitizeString(submissionResult.viewportGenerationId) !==
        generation.viewportGenerationId
    ) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_SUBMISSION_RESULT",
        runtime
      );
    }

    if (runId !== internal.activeRunId) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_SUBMISSION_RESULT",
        runtime
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
    const drawResult = deps.draw({
      generation,
      plan,
      batch: submissionResult,
      currentPopulation: clonePlain(internal.currentPopulation)
    });
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
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_DRAW_RESULT",
        runtime
      );
    }

    if (runId !== internal.activeRunId) {
      state.staleRefreshDiscardedCount += 1;
      clearActiveGeneration(state, internal);
      state.state = internal.followUpGeneration ? "population_queued" : "attached_idle";
      return buildResult(
        "runQueuedAutomaticViewportRefresh",
        "discarded",
        "STALE_DRAW_RESULT",
        runtime
      );
    }

    state.state = "replacing_population";
    const previousPopulation = internal.currentPopulation;
    internal.currentPopulation = deepFreeze({
      planId: sanitizeString(plan.populationPlanId),
      batchId:
        sanitizeString(submissionResult?.batchId) ??
        sanitizeString(drawResult?.batchId),
      commandCount: commands.length,
      generationId: generation.viewportGenerationId,
      viewportIdentity: generation.viewportIdentity,
      commandInstanceIds: [...instanceIds]
    });

    state.currentViewportIdentity = generation.viewportIdentity;
    state.currentViewportGenerationId = generation.viewportGenerationId;
    state.currentPopulationPlanId = internal.currentPopulation.planId;
    state.currentBatchId = internal.currentPopulation.batchId;
    state.currentCommandCount = internal.currentPopulation.commandCount;
    state.populationReferenceCount = commands.length > 0 ? 2 : 0;
    state.referencesReleased = false;

    if (previousPopulation) {
      const releaseResult = deps.releasePopulationReferences({
        previousPopulation,
        nextPopulation: clonePlain(internal.currentPopulation)
      });
      if (releaseResult?.released !== true) {
        throw Object.assign(new Error("POPULATION_REFERENCE_RELEASE_FAILED"), {
          reasonCode: "POPULATION_REFERENCE_RELEASE_FAILED"
        });
      }
    }

    state.populationReferenceCount = internal.currentPopulation.commandCount > 0 ? 2 : 0;
    state.referencesReleased = false;
    internal.currentFeatureFingerprint = featureFingerprint;
    internal.lastCompletedGenerationId = generation.viewportGenerationId;
    internal.lastCompletedViewportIdentity = generation.viewportIdentity;
    state.refreshCompletedCount += 1;
    state.lastFailureReason = null;
    state.state = "attached_idle";

    clearActiveGeneration(state, internal);

    if (internal.followUpGeneration) {
      internal.queuedGeneration = internal.followUpGeneration;
      state.queuedViewportGenerationId = internal.followUpGeneration.viewportGenerationId;
      state.followUpRefreshPending = false;
      internal.followUpGeneration = null;
      state.state = "population_queued";
    }

    return buildResult(
      "runQueuedAutomaticViewportRefresh",
      "completed",
      "AUTOMATIC_REFRESH_COMPLETED",
      runtime
    );
  } catch (error) {
    internal.planningActive = false;
    internal.submissionActive = false;
    internal.drawActive = false;
    clearActiveGeneration(state, internal);
    state.lastFailureReason = toReasonCode(error, "AUTOMATIC_REFRESH_FAILED");
    if (
      [
        "MAP_IDENTITY_MISMATCH",
        "REGION_IDENTITY_MISMATCH",
        "PACKAGE_IDENTITY_MISMATCH",
        "RECIPE_IDENTITY_MISMATCH",
        "SELECTOR_SEED_MISMATCH",
        "READINESS_BLOCKED"
      ].includes(state.lastFailureReason)
    ) {
      return invalidateAutomaticViewportPopulation(runtime, state.lastFailureReason);
    }

    state.state = "failed_closed";
    if (internal.followUpGeneration) {
      internal.queuedGeneration = internal.followUpGeneration;
      state.queuedViewportGenerationId = internal.followUpGeneration.viewportGenerationId;
      state.followUpRefreshPending = false;
      internal.followUpGeneration = null;
    }
    return buildResult(
      "runQueuedAutomaticViewportRefresh",
      "failed_closed",
      state.lastFailureReason,
      runtime
    );
  }
}
