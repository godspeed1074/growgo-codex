import {
  createDeveloperOnlyAtlasWorldPopulationPlan,
  createDeveloperOnlyAtlasWorldPopulationPlanner
} from "./developer-only-atlas-world-population-planner.mjs";
import {
  submitAtlasPopulationPlanForDraw,
  validateAtlasPopulationPlanForDraw,
  getAtlasPopulationDrawIntegrationStatus
} from "./developer-only-atlas-population-draw-integration.mjs";
import {
  createDeveloperOnlyAtlasLiveFeatureInputAdapter,
  extractDeveloperOnlyAtlasLiveViewportFeatures,
  getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus,
  updateDeveloperOnlyAtlasLiveFeatureInputAdapterSubmissionState
} from "./developer-only-atlas-live-feature-input-adapter.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_VIEWPORT_POPULATION_PREVIEW_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_VIEWPORT_POPULATION_PREVIEW_RESULT_001";

export const PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION =
  "PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION";
export const CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW =
  "CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW";

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

function sanitizeString(value) {
  return value == null ? null : String(value);
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
    drawing: safe.drawing === true,
    redrawQueued: safe.redrawQueued === true,
    redrawPermissionAllowed: safe.redrawPermissionAllowed === true,
    cleanupCompleted: safe.cleanupCompleted === true,
    cleanupInProgress: safe.cleanupInProgress === true,
    failedClosed: safe.failedClosed === true,
    sessionId: sanitizeString(safe.sessionId),
    mapIdentityId: sanitizeString(safe.mapIdentityId),
    regionId: sanitizeString(safe.regionId),
    packageId: sanitizeString(safe.packageId),
    recipeId: sanitizeString(safe.recipeId),
    selectorSeed: sanitizeString(safe.selectorSeed),
    lifecycleOwnerId: sanitizeString(safe.lifecycleOwnerId),
    retainedSurfaceState: sanitizeString(safe.retainedSurfaceState),
    ownedCanvasCount: Number(safe.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(safe.ownedPaneCount ?? 0),
    ownedListenerCount: Number(safe.ownedListenerCount ?? 0),
    previewReferenceCount: Number(safe.previewReferenceCount ?? 0),
    lastFailureReason: sanitizeString(safe.lastFailureReason)
  });
}

function buildClearPlan(status, viewportIdentity) {
  return deepFreeze({
    schemaId: "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_POPULATION_PLAN_001",
    populationPlanId: `ATLAS_CURRENT_VIEWPORT_POPULATION_CLEAR_${sanitizeString(
      status.sessionId ?? "UNKNOWN"
    )}`,
    regionId: sanitizeString(status.regionId),
    packageId: sanitizeString(status.packageId),
    recipeId: sanitizeString(status.recipeId),
    selectorSeed: sanitizeString(status.selectorSeed),
    viewportOrTileId:
      sanitizeString(viewportIdentity) ?? "ATLAS_CURRENT_VIEWPORT_CLEAR_001",
    commands: deepFreeze([]),
    rejectedCandidates: deepFreeze([])
  });
}

function assertPreviewPreconditions(status) {
  if (status.attached !== true) {
    throw Object.assign(new Error("PERSISTENT_ATLAS_NOT_ATTACHED"), {
      reasonCode: "PERSISTENT_ATLAS_NOT_ATTACHED"
    });
  }
  if (status.integrationState !== "attached_idle") {
    throw Object.assign(new Error("PERSISTENT_ATLAS_NOT_IDLE"), {
      reasonCode: "PERSISTENT_ATLAS_NOT_IDLE"
    });
  }
  if (status.redrawPermissionAllowed !== true) {
    throw Object.assign(new Error("PERSISTENT_REDRAW_NOT_ALLOWED"), {
      reasonCode: "PERSISTENT_REDRAW_NOT_ALLOWED"
    });
  }
  if (!status.sessionId || !status.mapIdentityId) {
    throw Object.assign(new Error("PERSISTENT_IDENTITY_UNAVAILABLE"), {
      reasonCode: "PERSISTENT_IDENTITY_UNAVAILABLE"
    });
  }
  if (!status.regionId) {
    throw Object.assign(new Error("INVALID_REGION_ID"), {
      reasonCode: "INVALID_REGION_ID"
    });
  }
  if (!status.packageId) {
    throw Object.assign(new Error("INVALID_PACKAGE_ID"), {
      reasonCode: "INVALID_PACKAGE_ID"
    });
  }
  if (!status.recipeId) {
    throw Object.assign(new Error("INVALID_RECIPE_ID"), {
      reasonCode: "INVALID_RECIPE_ID"
    });
  }
  if (!status.selectorSeed) {
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }
  if (!status.lifecycleOwnerId) {
    throw Object.assign(new Error("LIFECYCLE_OWNER_UNAVAILABLE"), {
      reasonCode: "LIFECYCLE_OWNER_UNAVAILABLE"
    });
  }
  if (status.ownedCanvasCount !== 1 || status.ownedPaneCount !== 1) {
    throw Object.assign(new Error("RETAINED_SURFACE_UNAVAILABLE"), {
      reasonCode: "RETAINED_SURFACE_UNAVAILABLE"
    });
  }
  if (status.ownedListenerCount < 1) {
    throw Object.assign(new Error("PERSISTENT_LISTENERS_UNAVAILABLE"), {
      reasonCode: "PERSISTENT_LISTENERS_UNAVAILABLE"
    });
  }
  if (status.cleanupInProgress === true) {
    throw Object.assign(new Error("PERSISTENT_CLEANUP_IN_PROGRESS"), {
      reasonCode: "PERSISTENT_CLEANUP_IN_PROGRESS"
    });
  }
}

function buildStatus(state, adapterStatus) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    previewAvailable: state.previewAvailable,
    previewActive: state.previewActive,
    viewportIdentity: adapterStatus.viewportIdentity,
    sourceFeatureCount: adapterStatus.sourceFeatureCount,
    normalizedFeatureCount: adapterStatus.normalizedFeatureCount,
    rejectedFeatureCount: adapterStatus.rejectedFeatureCount,
    unsupportedFeatureCount: adapterStatus.unsupportedFeatureCount,
    truncatedFeatureCount: adapterStatus.truncatedFeatureCount,
    classificationCounts: deepFreeze({ ...adapterStatus.classificationCounts }),
    adapterReady: adapterStatus.adapterReady,
    featureSourceAvailable: adapterStatus.featureSourceAvailable,
    populationPlanId: state.populationPlanId,
    batchId: state.batchId,
    plannedCommandCount: state.plannedCommandCount,
    submittedCommandCount: state.submittedCommandCount,
    drawCompleted: state.drawCompleted,
    previewClearCompleted: state.previewClearCompleted,
    previewReferenceCount: state.previewReferenceCount,
    currentAssetIds: deepFreeze([...state.currentAssetIds]),
    currentInstanceIds: deepFreeze([...state.currentInstanceIds]),
    lastFailureReason: state.lastFailureReason ?? adapterStatus.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult({ command, outcome, reasonCode, state, adapterStatus }) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    command,
    outcome,
    reasonCode,
    previewStatus: buildStatus(state, adapterStatus),
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasControlledViewportPopulationPreview({
  hostnameProvider = () => "",
  persistentStatusProvider = () => null,
  liveFeatureInputAdapter = createDeveloperOnlyAtlasLiveFeatureInputAdapter(),
  populationPlanner = createDeveloperOnlyAtlasWorldPopulationPlanner(),
  populationDrawIntegration = null
} = {}) {
  const state = {
    previewAvailable: false,
    previewActive: false,
    populationPlanId: null,
    batchId: null,
    plannedCommandCount: 0,
    submittedCommandCount: 0,
    drawCompleted: false,
    previewClearCompleted: false,
    previewReferenceCount: 0,
    currentAssetIds: [],
    currentInstanceIds: [],
    lastFailureReason: null
  };

  function isAvailable() {
    return (
      isLocalDevelopmentHost(hostnameProvider?.()) &&
      !!populationDrawIntegration
    );
  }

  function readPersistentStatus() {
    return sanitizePersistentStatus(persistentStatusProvider?.());
  }

  function refreshAvailability() {
    const drawStatus = getAtlasPopulationDrawIntegrationStatus(
      populationDrawIntegration
    );
    state.previewAvailable =
      isAvailable() && drawStatus.integrationReady === true;
  }

  function getAtlasLiveFeatureInputAdapterStatusForPreview() {
    return getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus(
      liveFeatureInputAdapter
    );
  }

  function getAtlasCurrentViewportPopulationPreviewStatus() {
    refreshAvailability();
    return buildStatus(state, getAtlasLiveFeatureInputAdapterStatusForPreview());
  }

  function previewAtlasCurrentViewportPopulation({
    confirmation,
    budget
  } = {}) {
    refreshAvailability();
    if (state.previewAvailable !== true) {
      state.lastFailureReason = isLocalDevelopmentHost(hostnameProvider?.())
        ? "PREVIEW_UNAVAILABLE"
        : "NON_LOCAL_DEVELOPMENT_HOST";
      return buildResult({
        command: "previewAtlasCurrentViewportPopulation",
        outcome: "blocked",
        reasonCode: state.lastFailureReason,
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }

    if (confirmation !== PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      return buildResult({
        command: "previewAtlasCurrentViewportPopulation",
        outcome: "blocked",
        reasonCode: "INVALID_CONFIRMATION",
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }

    try {
      const persistentStatus = readPersistentStatus();
      assertPreviewPreconditions(persistentStatus);
      const extraction = extractDeveloperOnlyAtlasLiveViewportFeatures(
        liveFeatureInputAdapter,
        { budget }
      );
      const performanceBudget = {
        maximumCandidateFeatures: extraction.budget.maxNormalizedFeatures,
        maximumCommands: extraction.budget.maxPopulationCommands,
        maximumVegetationCommands: extraction.budget.maxPopulationCommands,
        maximumBuildingCommands: extraction.budget.maxPopulationCommands
      };
      const plan = createDeveloperOnlyAtlasWorldPopulationPlan(populationPlanner, {
        regionId: persistentStatus.regionId,
        packageId: persistentStatus.packageId,
        recipeId: persistentStatus.recipeId,
        selectorSeed: persistentStatus.selectorSeed,
        viewportId: extraction.viewportIdentity,
        performanceBudget,
        features: extraction.plannerFeatures
      });

      const batch = validateAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        plan
      );

      const drawResult = submitAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        {
          plan,
          redrawReason: "manual_redraw"
        }
      );

      if (
        !drawResult ||
        drawResult.outcome === "blocked" ||
        drawResult.outcome === "failed_closed"
      ) {
        throw Object.assign(
          new Error(drawResult?.reasonCode ?? "DRAW_INTEGRATION_FAILED"),
          {
            reasonCode: drawResult?.reasonCode ?? "DRAW_INTEGRATION_FAILED"
          }
        );
      }

      updateDeveloperOnlyAtlasLiveFeatureInputAdapterSubmissionState(
        liveFeatureInputAdapter,
        {
          populationPlanId: plan.populationPlanId,
          batchId: batch.batchId,
          submittedCommandCount: batch.commands.length
        }
      );

      state.previewActive = true;
      state.populationPlanId = plan.populationPlanId;
      state.batchId = batch.batchId;
      state.plannedCommandCount = plan.commands.length;
      state.submittedCommandCount = batch.commands.length;
      state.drawCompleted = true;
      state.previewClearCompleted = false;
      state.previewReferenceCount = batch.commands.length;
      state.currentAssetIds = [...new Set(plan.commands.map((command) => command.assetId))];
      state.currentInstanceIds = plan.commands.map((command) => command.instanceId);
      state.lastFailureReason = null;

      return buildResult({
        command: "previewAtlasCurrentViewportPopulation",
        outcome: "completed",
        reasonCode: "PREVIEW_SUBMITTED",
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    } catch (error) {
      state.previewActive = false;
      state.lastFailureReason = toReasonCode(
        error,
        "CURRENT_VIEWPORT_PREVIEW_FAILED"
      );
      return buildResult({
        command: "previewAtlasCurrentViewportPopulation",
        outcome: "failed_closed",
        reasonCode: state.lastFailureReason,
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }
  }

  function clearAtlasCurrentViewportPopulationPreview({ confirmation } = {}) {
    refreshAvailability();
    if (state.previewAvailable !== true) {
      state.lastFailureReason = isLocalDevelopmentHost(hostnameProvider?.())
        ? "PREVIEW_UNAVAILABLE"
        : "NON_LOCAL_DEVELOPMENT_HOST";
      return buildResult({
        command: "clearAtlasCurrentViewportPopulationPreview",
        outcome: "blocked",
        reasonCode: state.lastFailureReason,
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }

    if (
      confirmation !==
      CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW
    ) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      return buildResult({
        command: "clearAtlasCurrentViewportPopulationPreview",
        outcome: "blocked",
        reasonCode: "INVALID_CONFIRMATION",
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }

    try {
      const persistentStatus = readPersistentStatus();
      assertPreviewPreconditions(persistentStatus);
      const adapterStatus = getAtlasLiveFeatureInputAdapterStatusForPreview();
      const clearPlan = buildClearPlan(
        persistentStatus,
        adapterStatus.viewportIdentity
      );

      const batch = validateAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        clearPlan
      );
      const drawResult = submitAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        {
          plan: clearPlan,
          redrawReason: "manual_redraw"
        }
      );

      if (
        !drawResult ||
        drawResult.outcome === "blocked" ||
        drawResult.outcome === "failed_closed"
      ) {
        throw Object.assign(
          new Error(drawResult?.reasonCode ?? "PREVIEW_CLEAR_FAILED"),
          {
            reasonCode: drawResult?.reasonCode ?? "PREVIEW_CLEAR_FAILED"
          }
        );
      }

      updateDeveloperOnlyAtlasLiveFeatureInputAdapterSubmissionState(
        liveFeatureInputAdapter,
        {
          populationPlanId: clearPlan.populationPlanId,
          batchId: batch.batchId,
          submittedCommandCount: 0
        }
      );

      state.previewActive = false;
      state.populationPlanId = clearPlan.populationPlanId;
      state.batchId = batch.batchId;
      state.plannedCommandCount = 0;
      state.submittedCommandCount = 0;
      state.drawCompleted = true;
      state.previewClearCompleted = true;
      state.previewReferenceCount = 0;
      state.currentAssetIds = [];
      state.currentInstanceIds = [];
      state.lastFailureReason = null;

      return buildResult({
        command: "clearAtlasCurrentViewportPopulationPreview",
        outcome: "completed",
        reasonCode: "PREVIEW_CLEARED",
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    } catch (error) {
      state.lastFailureReason = toReasonCode(error, "PREVIEW_CLEAR_FAILED");
      return buildResult({
        command: "clearAtlasCurrentViewportPopulationPreview",
        outcome: "failed_closed",
        reasonCode: state.lastFailureReason,
        state,
        adapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview()
      });
    }
  }

  return deepFreeze({
    getAtlasCurrentViewportPopulationPreviewStatus,
    getAtlasLiveFeatureInputAdapterStatus: getAtlasLiveFeatureInputAdapterStatusForPreview,
    previewAtlasCurrentViewportPopulation,
    clearAtlasCurrentViewportPopulationPreview
  });
}

export function installDeveloperOnlyAtlasControlledViewportPopulationPreview({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  preview
} = {}) {
  if (
    !globalObject ||
    !preview ||
    typeof preview.getAtlasCurrentViewportPopulationPreviewStatus !==
      "function" ||
    typeof preview.getAtlasLiveFeatureInputAdapterStatus !== "function" ||
    typeof preview.previewAtlasCurrentViewportPopulation !== "function" ||
    typeof preview.clearAtlasCurrentViewportPopulationPreview !== "function"
  ) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.previewAtlasCurrentViewportPopulation = (input) =>
    preview.previewAtlasCurrentViewportPopulation(input);
  namespace.clearAtlasCurrentViewportPopulationPreview = (input) =>
    preview.clearAtlasCurrentViewportPopulationPreview(input);
  namespace.getAtlasCurrentViewportPopulationPreviewStatus = () =>
    preview.getAtlasCurrentViewportPopulationPreviewStatus();
  namespace.getAtlasLiveFeatureInputAdapterStatus = () =>
    preview.getAtlasLiveFeatureInputAdapterStatus();

  return namespace;
}
