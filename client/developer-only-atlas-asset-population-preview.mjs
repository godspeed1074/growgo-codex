import {
  createDeveloperOnlyAtlasWorldPopulationPlan,
  createDeveloperOnlyAtlasWorldPopulationPlanner
} from "./developer-only-atlas-world-population-planner.mjs";
import {
  submitAtlasPopulationPlanForDraw,
  validateAtlasPopulationPlanForDraw,
  getAtlasPopulationDrawIntegrationStatus
} from "./developer-only-atlas-population-draw-integration.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_POPULATION_PREVIEW_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_POPULATION_PREVIEW_RESULT_001";

export const PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION =
  "PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION";
export const CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW =
  "CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW";
export const ATLAS_POPULATION_PREVIEW_BELLARINE_001 =
  "ATLAS_POPULATION_PREVIEW_BELLARINE_001";

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
    failedClosed: safe.failedClosed === true,
    cleanupCompleted: safe.cleanupCompleted === true,
    detaching: safe.detaching === true,
    revoked: safe.revoked === true,
    invalidated: safe.invalidated === true,
    expired: safe.expired === true,
    authorizationState: safe.authorizationState ?? "inactive",
    attachPermissionConsumed: safe.attachPermissionConsumed === true,
    redrawPermissionAllowed: safe.redrawPermissionAllowed === true,
    mapIdentityId: safe.mapIdentityId ?? null,
    regionId: safe.regionId ?? null,
    packageId: safe.packageId ?? null,
    packageVersion: safe.packageVersion ?? null,
    packageFingerprint: safe.packageFingerprint ?? null,
    recipeId: safe.recipeId ?? null,
    recipeVersion: safe.recipeVersion ?? null,
    selectorSeed: safe.selectorSeed ?? null,
    sessionId: safe.sessionId ?? null,
    retainedSurfaceState: safe.retainedSurfaceState ?? "empty",
    lifecycleOwnerId: safe.lifecycleOwnerId ?? null,
    ownedCanvasCount: Number(safe.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(safe.ownedPaneCount ?? 0),
    ownedListenerCount: Number(safe.ownedListenerCount ?? 0),
    cleanupAttemptCount: Number(safe.cleanupAttemptCount ?? 0),
    lastFailureReason: safe.lastFailureReason ?? null
  });
}

function hasRequiredPersistentIdentity(status) {
  return [
    status.mapIdentityId,
    status.regionId,
    status.packageId,
    status.recipeId,
    status.selectorSeed,
    status.sessionId
  ].every((value) => typeof value === "string" && value.trim().length > 0);
}

function resolveInvalidationReason(status) {
  const reason = sanitizeString(status.lastFailureReason);
  if (
    reason === "ATLAS_IDENTITY_MISMATCH" ||
    reason === "ATLAS_READINESS_BLOCKED"
  ) {
    return reason;
  }
  return "ATLAS_INVALIDATED";
}

function makeFeature({
  featureId,
  featureClass,
  latitude,
  longitude,
  area,
  width,
  height,
  orientationHint = null
}) {
  return deepFreeze({
    featureId,
    featureClass,
    coordinate: deepFreeze({
      latitude,
      longitude
    }),
    area,
    footprintScalars: deepFreeze({
      width,
      height
    }),
    orientationHint,
    deterministicFeatureIdentity: featureId
  });
}

function resolveBuiltInFixture(fixtureId) {
  if (fixtureId !== ATLAS_POPULATION_PREVIEW_BELLARINE_001) {
    throw Object.assign(new Error("UNKNOWN_PREVIEW_FIXTURE"), {
      reasonCode: "UNKNOWN_PREVIEW_FIXTURE"
    });
  }

  return deepFreeze({
    fixtureId,
    regionId: "BELLARINE",
    recipeId: "RECREATION_AREA_RECIPE_001",
    viewportId: "ATLAS_PREVIEW_VIEWPORT_BELLARINE_001",
    features: deepFreeze([
      makeFeature({
        featureId: "preview-park-001",
        featureClass: "park",
        latitude: -38.1264,
        longitude: 144.6134,
        area: 160,
        width: 45,
        height: 25
      }),
      makeFeature({
        featureId: "preview-coastal-001",
        featureClass: "coastal_green",
        latitude: -38.1253,
        longitude: 144.6141,
        area: 180,
        width: 40,
        height: 20
      }),
      makeFeature({
        featureId: "preview-vegetation-001",
        featureClass: "vegetation_area",
        latitude: -38.1248,
        longitude: 144.6125,
        area: 220,
        width: 48,
        height: 24
      }),
      makeFeature({
        featureId: "preview-sports-001",
        featureClass: "sports_ground",
        latitude: -38.1272,
        longitude: 144.6152,
        area: 420,
        width: 60,
        height: 30,
        orientationHint: 90
      })
    ])
  });
}

function buildClearPlan(persistentStatus, selectorSeed) {
  return deepFreeze({
    schemaId: "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_POPULATION_PLAN_001",
    populationPlanId: `ATLAS_POPULATION_PLAN_CLEAR_${sanitizeString(
      persistentStatus.sessionId ?? "UNKNOWN"
    )}`,
    regionId: sanitizeString(persistentStatus.regionId),
    packageId: sanitizeString(persistentStatus.packageId),
    recipeId: sanitizeString(persistentStatus.recipeId),
    selectorSeed,
    viewportOrTileId: "ATLAS_PREVIEW_CLEAR_VIEWPORT_001",
    commands: deepFreeze([]),
    rejectedCandidates: deepFreeze([])
  });
}

function buildStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    previewAvailable: state.previewAvailable,
    previewActive: state.previewActive,
    previewFixtureId: state.previewFixtureId,
    populationPlanId: state.populationPlanId,
    batchId: state.batchId,
    plannedCommandCount: state.plannedCommandCount,
    submittedCommandCount: state.submittedCommandCount,
    drawCompleted: state.drawCompleted,
    lastPreviewReason: state.lastPreviewReason,
    previewClearCompleted: state.previewClearCompleted,
    previewReferenceCount: state.previewReferenceCount,
    currentAssetIds: deepFreeze([...state.currentAssetIds]),
    currentInstanceIds: deepFreeze([...state.currentInstanceIds]),
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult({
  command,
  outcome,
  reasonCode,
  state
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    command,
    outcome,
    reasonCode,
    previewStatus: buildStatus(state),
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function assertPreviewPreconditions(status) {
  if (status.revoked === true || status.authorizationState === "revoked") {
    throw Object.assign(new Error("ATLAS_REVOKED"), {
      reasonCode: "ATLAS_REVOKED"
    });
  }
  if (status.expired === true || status.authorizationState === "expired") {
    throw Object.assign(new Error("ATLAS_EXPIRED"), {
      reasonCode: "ATLAS_EXPIRED"
    });
  }
  if (status.invalidated === true || status.authorizationState === "invalidated") {
    throw Object.assign(new Error(resolveInvalidationReason(status)), {
      reasonCode: resolveInvalidationReason(status)
    });
  }
  if (
    status.authorizationState !== "active" &&
    status.authorizationState !== "attach_permission_consumed"
  ) {
    throw Object.assign(new Error("ATLAS_NOT_AUTHORIZED"), {
      reasonCode: "ATLAS_NOT_AUTHORIZED"
    });
  }
  if (
    status.authorizationState === "attach_permission_consumed" &&
    status.attachPermissionConsumed !== true
  ) {
    throw Object.assign(new Error("ATLAS_NOT_AUTHORIZED"), {
      reasonCode: "ATLAS_NOT_AUTHORIZED"
    });
  }
  if (status.attached !== true) {
    throw Object.assign(new Error("ATLAS_NOT_ATTACHED"), {
      reasonCode: "ATLAS_NOT_ATTACHED"
    });
  }
  if (status.integrationState !== "attached_idle") {
    throw Object.assign(new Error("ATLAS_NOT_ATTACHED"), {
      reasonCode: "ATLAS_NOT_ATTACHED"
    });
  }
  if (status.redrawPermissionAllowed !== true) {
    const reasonCode =
      sanitizeString(status.lastFailureReason) === "ATLAS_IDENTITY_MISMATCH"
        ? "ATLAS_IDENTITY_MISMATCH"
        : sanitizeString(status.lastFailureReason) === "ATLAS_READINESS_BLOCKED"
          ? "ATLAS_READINESS_BLOCKED"
          : "ATLAS_REDRAW_NOT_ALLOWED";
    throw Object.assign(new Error(reasonCode), {
      reasonCode
    });
  }
  if (status.detaching === true || status.cleanupCompleted === true) {
    throw Object.assign(new Error("ATLAS_NOT_ATTACHED"), {
      reasonCode: "ATLAS_NOT_ATTACHED"
    });
  }
  if (!hasRequiredPersistentIdentity(status)) {
    throw Object.assign(new Error("ATLAS_IDENTITY_MISMATCH"), {
      reasonCode: "ATLAS_IDENTITY_MISMATCH"
    });
  }
  if (status.retainedSurfaceState !== "ready") {
    throw Object.assign(new Error("ATLAS_NOT_ATTACHED"), {
      reasonCode: "ATLAS_NOT_ATTACHED"
    });
  }
  if (
    typeof status.lifecycleOwnerId !== "string" ||
    status.lifecycleOwnerId.trim().length === 0
  ) {
    throw Object.assign(new Error("ATLAS_IDENTITY_MISMATCH"), {
      reasonCode: "ATLAS_IDENTITY_MISMATCH"
    });
  }
  if (status.ownedCanvasCount !== 1) {
    throw Object.assign(new Error("INVALID_CANVAS_OWNERSHIP"), {
      reasonCode: "INVALID_CANVAS_OWNERSHIP"
    });
  }
  if (status.ownedPaneCount !== 1) {
    throw Object.assign(new Error("INVALID_PANE_OWNERSHIP"), {
      reasonCode: "INVALID_PANE_OWNERSHIP"
    });
  }
  if (status.ownedListenerCount !== 3) {
    throw Object.assign(new Error("INVALID_LISTENER_OWNERSHIP"), {
      reasonCode: "INVALID_LISTENER_OWNERSHIP"
    });
  }
  if (status.failedClosed === true) {
    throw Object.assign(new Error("FAILED_CLOSED"), {
      reasonCode: "FAILED_CLOSED"
    });
  }
}

export function createDeveloperOnlyAtlasAssetPopulationPreview({
  hostnameProvider = () => "",
  persistentStatusProvider = () => null,
  populationPlanner = createDeveloperOnlyAtlasWorldPopulationPlanner(),
  populationDrawIntegration = null,
  previewFixtureResolver = resolveBuiltInFixture,
  allowSelectorSeedOverride = false
} = {}) {
  const state = {
    previewAvailable: false,
    previewActive: false,
    previewFixtureId: null,
    populationPlanId: null,
    batchId: null,
    plannedCommandCount: 0,
    submittedCommandCount: 0,
    drawCompleted: false,
    lastPreviewReason: null,
    previewClearCompleted: false,
    previewReferenceCount: 0,
    currentAssetIds: [],
    currentInstanceIds: [],
    lastFailureReason: null,
    activeSelectorSeed: null
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

  function readDrawIntegrationStatus() {
    return getAtlasPopulationDrawIntegrationStatus(populationDrawIntegration);
  }

  function refreshAvailability() {
    const drawStatus = readDrawIntegrationStatus();
    state.previewAvailable =
      isAvailable() &&
      drawStatus.integrationReady === true;
  }

  function getAtlasAssetPopulationPreviewStatus() {
    refreshAvailability();
    return buildStatus(state);
  }

  function previewAtlasAssetPopulation({
    confirmation,
    previewFixtureId = ATLAS_POPULATION_PREVIEW_BELLARINE_001,
    selectorSeed
  } = {}) {
    refreshAvailability();
    if (state.previewAvailable !== true) {
      state.lastFailureReason = isLocalDevelopmentHost(hostnameProvider?.())
        ? "PREVIEW_UNAVAILABLE"
        : "NON_LOCAL_DEVELOPMENT_HOST";
      return buildResult({
        command: "previewAtlasAssetPopulation",
        outcome: "blocked",
        reasonCode: state.lastFailureReason,
        state
      });
    }

    if (confirmation !== PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      return buildResult({
        command: "previewAtlasAssetPopulation",
        outcome: "blocked",
        reasonCode: "INVALID_CONFIRMATION",
        state
      });
    }

    if (selectorSeed != null && allowSelectorSeedOverride !== true) {
      state.lastFailureReason = "SELECTOR_SEED_OVERRIDE_NOT_ALLOWED";
      return buildResult({
        command: "previewAtlasAssetPopulation",
        outcome: "blocked",
        reasonCode: "SELECTOR_SEED_OVERRIDE_NOT_ALLOWED",
        state
      });
    }

    try {
      const persistentStatus = readPersistentStatus();
      assertPreviewPreconditions(persistentStatus);
      const fixture = previewFixtureResolver(previewFixtureId);
      const resolvedSelectorSeed =
        sanitizeString(selectorSeed) ??
        sanitizeString(persistentStatus.selectorSeed) ??
        "ATLAS_PREVIEW_SELECTOR_SEED_001";

      if (
        state.previewActive === true &&
        state.previewFixtureId === fixture.fixtureId &&
        state.activeSelectorSeed === resolvedSelectorSeed
      ) {
        state.lastFailureReason = null;
        state.lastPreviewReason = "preview_reused";
        return buildResult({
          command: "previewAtlasAssetPopulation",
          outcome: "reused",
          reasonCode: "PREVIEW_ALREADY_ACTIVE",
          state
        });
      }

      const plan = createDeveloperOnlyAtlasWorldPopulationPlan(populationPlanner, {
        regionId: sanitizeString(persistentStatus.regionId),
        packageId: sanitizeString(persistentStatus.packageId),
        recipeId: sanitizeString(persistentStatus.recipeId),
        selectorSeed: resolvedSelectorSeed,
        viewportId: fixture.viewportId,
        features: fixture.features
      });

      const batch = validateAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        plan
      );

      submitAtlasPopulationPlanForDraw(populationDrawIntegration, {
        plan,
        redrawReason: "manual_redraw"
      });

      state.previewActive = true;
      state.previewFixtureId = fixture.fixtureId;
      state.populationPlanId = plan.populationPlanId;
      state.batchId = batch.batchId;
      state.plannedCommandCount = plan.commands.length;
      state.submittedCommandCount = batch.commands.length;
      state.drawCompleted = true;
      state.lastPreviewReason = "preview_submitted";
      state.previewClearCompleted = false;
      state.previewReferenceCount = 1;
      state.currentAssetIds = [...new Set(plan.commands.map((command) => command.assetId))];
      state.currentInstanceIds = plan.commands.map((command) => command.instanceId);
      state.lastFailureReason = null;
      state.activeSelectorSeed = resolvedSelectorSeed;

      return buildResult({
        command: "previewAtlasAssetPopulation",
        outcome: "completed",
        reasonCode: "PREVIEW_SUBMITTED",
        state
      });
    } catch (error) {
      state.lastFailureReason = toReasonCode(error, "PREVIEW_SUBMISSION_FAILED");
      return buildResult({
        command: "previewAtlasAssetPopulation",
        outcome: "failed_closed",
        reasonCode: state.lastFailureReason,
        state
      });
    }
  }

  function clearAtlasAssetPopulationPreview({ confirmation } = {}) {
    refreshAvailability();
    if (state.previewAvailable !== true) {
      state.lastFailureReason = isLocalDevelopmentHost(hostnameProvider?.())
        ? "PREVIEW_UNAVAILABLE"
        : "NON_LOCAL_DEVELOPMENT_HOST";
      return buildResult({
        command: "clearAtlasAssetPopulationPreview",
        outcome: "blocked",
        reasonCode: state.lastFailureReason,
        state
      });
    }

    if (confirmation !== CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW) {
      state.lastFailureReason = "INVALID_CONFIRMATION";
      return buildResult({
        command: "clearAtlasAssetPopulationPreview",
        outcome: "blocked",
        reasonCode: "INVALID_CONFIRMATION",
        state
      });
    }

    try {
      const persistentStatus = readPersistentStatus();
      assertPreviewPreconditions(persistentStatus);
      const clearPlan = buildClearPlan(
        persistentStatus,
        sanitizeString(persistentStatus.selectorSeed) ??
          state.activeSelectorSeed ??
          "ATLAS_PREVIEW_SELECTOR_SEED_001"
      );

      const batch = validateAtlasPopulationPlanForDraw(
        populationDrawIntegration,
        clearPlan
      );

      submitAtlasPopulationPlanForDraw(populationDrawIntegration, {
        plan: clearPlan,
        redrawReason: "manual_redraw"
      });

      state.previewActive = false;
      state.previewFixtureId = null;
      state.populationPlanId = clearPlan.populationPlanId;
      state.batchId = batch.batchId;
      state.plannedCommandCount = 0;
      state.submittedCommandCount = 0;
      state.drawCompleted = true;
      state.lastPreviewReason = "preview_cleared";
      state.previewClearCompleted = true;
      state.previewReferenceCount = 0;
      state.currentAssetIds = [];
      state.currentInstanceIds = [];
      state.lastFailureReason = null;
      state.activeSelectorSeed = null;

      return buildResult({
        command: "clearAtlasAssetPopulationPreview",
        outcome: "completed",
        reasonCode: "PREVIEW_CLEARED",
        state
      });
    } catch (error) {
      state.lastFailureReason = toReasonCode(error, "PREVIEW_CLEAR_FAILED");
      return buildResult({
        command: "clearAtlasAssetPopulationPreview",
        outcome: "failed_closed",
        reasonCode: state.lastFailureReason,
        state
      });
    }
  }

  return deepFreeze({
    getAtlasAssetPopulationPreviewStatus,
    previewAtlasAssetPopulation,
    clearAtlasAssetPopulationPreview
  });
}

export function installDeveloperOnlyAtlasAssetPopulationPreview({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  preview
} = {}) {
  if (
    !globalObject ||
    !preview ||
    typeof preview.getAtlasAssetPopulationPreviewStatus !== "function" ||
    typeof preview.previewAtlasAssetPopulation !== "function" ||
    typeof preview.clearAtlasAssetPopulationPreview !== "function"
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

  namespace.previewAtlasAssetPopulation = (input) =>
    preview.previewAtlasAssetPopulation(input);
  namespace.getAtlasAssetPopulationPreviewStatus = () =>
    preview.getAtlasAssetPopulationPreviewStatus();
  namespace.clearAtlasAssetPopulationPreview = (input) =>
    preview.clearAtlasAssetPopulationPreview(input);

  return namespace;
}
