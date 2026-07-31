import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  buildAtlasRegionalPackagePlanning
} from "../asset-factory/atlas-regional-package-planning.mjs";
import {
  buildLocationRecipeSelectorFoundation,
  selectLocationRecipe
} from "../asset-factory/location-recipe-selector-foundation.mjs";

const OPERATOR_DECISION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001/record/atlas-developer-alpha-runtime-enablement-operator-decision-record.json";
const OPERATOR_DECISION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001/validation/atlas-developer-alpha-runtime-enablement-operator-decision-validation.json";
const CONTROLLED_RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/validation/atlas-developer-alpha-controlled-runtime-validation.json";

const DEFAULT_CWD = path.resolve(import.meta.dirname, "..");
const DEFAULT_SCOPE_SOURCE = "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001";

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

function readJson(cwd, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(cwd, relativePath), "utf8"));
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeBucket(value) {
  return Number(Number(value).toFixed(2));
}

function validateLatitude(latitude) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function validateLongitude(longitude) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function loadApprovedScope(cwd) {
  const operatorDecisionRecord = readJson(cwd, OPERATOR_DECISION_RECORD_PATH);
  const operatorDecisionValidation = readJson(cwd, OPERATOR_DECISION_VALIDATION_PATH);
  const controlledRuntimeValidation = readJson(cwd, CONTROLLED_RUNTIME_VALIDATION_PATH);

  return deepFreeze({
    decisionRecord: operatorDecisionRecord,
    decisionValidation: operatorDecisionValidation,
    controlledRuntimeValidation,
    approvedScope: {
      regionId: operatorDecisionRecord.scopeConfirmation.regionId,
      packageId: operatorDecisionRecord.scopeConfirmation.packageId,
      recipeId: operatorDecisionRecord.scopeConfirmation.recipeId,
      internalDeveloperOnly:
        operatorDecisionRecord.scopeConfirmation.internalDeveloperOnly
    },
    safetyFlags: {
      runtimeExecutionEnabled: controlledRuntimeValidation.runtimeExecutionEnabled,
      mapAttachmentAllowed: controlledRuntimeValidation.mapAttachmentAllowed,
      automaticRendererExecutionAllowed:
        controlledRuntimeValidation.automaticRendererExecutionAllowed,
      lifecycleExecutionEnabled: false
    }
  });
}

function buildSelectorContext(pkg, latitude, longitude, selectorId) {
  const latBucket = normalizeBucket(latitude);
  const lngBucket = normalizeBucket(longitude);

  return deepFreeze({
    worldContextId: `ATLAS_MAP_DIAGNOSTIC_${normalizeToken(pkg.regionId)}_${String(
      latBucket
    ).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}`,
    environment: "DEVELOPMENT_ONLY",
    biomeProfile: pkg.primaryBiomeHint,
    routeMode: "pedestrian_exploration",
    archetype: pkg.archetypeHint,
    desiredFeatures:
      pkg.expectedRecipeId === "COASTAL_LOCATION_RECIPE_001"
        ? ["SHORELINE_TRANSITION", "WET_CROSSING", "LOOP_ROUTE"]
        : ["CANOPY_ENCLOSURE", "CLEARING_DESTINATION", "LOOP_ROUTE"],
    seed: hashHex(
      pkg.regionId,
      pkg.packageVersion,
      latBucket,
      lngBucket,
      pkg.primaryBiomeHint,
      pkg.archetypeHint,
      selectorId
    ),
    selectorVersion: selectorId
  });
}

function findApprovedRepresentativePackage(scope, regionalPlanning) {
  return (
    regionalPlanning.specification.representativePackages.find(
      (pkg) =>
        pkg.regionId === scope.regionId &&
        pkg.packageId === scope.packageId
    ) ?? null
  );
}

function buildBlockedDiagnostic({
  latitude,
  longitude,
  latBucket,
  lngBucket,
  reasonCode,
  scope,
  safetyFlags,
  bridgeState,
  scopeSource = DEFAULT_SCOPE_SOURCE
}) {
  return deepFreeze({
    schemaId: "ATLAS_MAP_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode,
    coordinate: {
      latitude,
      longitude,
      latBucket,
      lngBucket
    },
    approvedScope: {
      ...scope,
      scopeSource
    },
    resolvedRegion: null,
    resolvedPackage: null,
    resolvedRecipe: null,
    safetyFlags,
    executionBoundaries: bridgeState,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_DIAGNOSTIC_RESULT_001",
      "blocked",
      reasonCode,
      latitude,
      longitude,
      latBucket,
      lngBucket,
      scope.regionId,
      scope.packageId,
      scope.recipeId
    )
  });
}

function buildResolvedDiagnostic({
  latitude,
  longitude,
  pkg,
  recipeSelection,
  scope,
  safetyFlags,
  bridgeState,
  scopeSource = DEFAULT_SCOPE_SOURCE
}) {
  const latBucket = normalizeBucket(latitude);
  const lngBucket = normalizeBucket(longitude);

  return deepFreeze({
    schemaId: "ATLAS_MAP_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    coordinate: {
      latitude,
      longitude,
      latBucket,
      lngBucket
    },
    approvedScope: {
      ...scope,
      scopeSource
    },
    resolvedRegion: {
      regionId: pkg.regionId,
      environmentProfile: pkg.environmentProfile
    },
    resolvedPackage: {
      packageId: pkg.packageId,
      packageVersion: pkg.packageVersion,
      packageFingerprint: pkg.packageFingerprint
    },
    resolvedRecipe: {
      recipeId: recipeSelection.selectedRecipeId,
      selectedVersion: recipeSelection.selectedVersion,
      confidenceScore: recipeSelection.confidenceScore,
      fallbackApplied: recipeSelection.fallbackApplied
    },
    selectorSeed: pkg.selectorSeed,
    safetyFlags,
    executionBoundaries: bridgeState,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_DIAGNOSTIC_RESULT_001",
      "resolved",
      latitude,
      longitude,
      latBucket,
      lngBucket,
      pkg.regionId,
      pkg.packageId,
      pkg.packageVersion,
      recipeSelection.selectedRecipeId,
      recipeSelection.selectedVersion,
      pkg.packageFingerprint
    )
  });
}

export function createDeveloperOnlyAtlasMapAdapter(options = {}) {
  const cwd = options.cwd ?? DEFAULT_CWD;
  const scopeBundle = options.scopeBundle ?? loadApprovedScope(cwd);
  const scope =
    options.approvedScopeOverride ?? scopeBundle.approvedScope;
  const safetyFlags = deepFreeze({
    ...scopeBundle.safetyFlags,
    ...(options.safetyFlagsOverride ?? {})
  });
  const regionalPlanning =
    options.regionalPlanningOverride ?? buildAtlasRegionalPackagePlanning({ cwd });
  const selectorFoundation =
    options.selectorFoundationOverride ??
    buildLocationRecipeSelectorFoundation({ cwd });

  const bridgeState = deepFreeze({
    liveMapGetterImplemented: false,
    liveMapInvocationPerformed: false,
    listenersAttached: false,
    mapMutated: false,
    rendererAttached: false,
    domMutated: false
  });

  const approvedRepresentativePackage =
    findApprovedRepresentativePackage(scope, regionalPlanning);

  function getAtlasMapDiagnostic({ latitude, longitude }) {
    const latBucket = Number.isFinite(latitude) ? normalizeBucket(latitude) : null;
    const lngBucket = Number.isFinite(longitude) ? normalizeBucket(longitude) : null;

    if (!validateLatitude(latitude)) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "INVALID_LATITUDE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    if (!validateLongitude(longitude)) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "INVALID_LONGITUDE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    if (
      safetyFlags.runtimeExecutionEnabled !== false ||
      safetyFlags.mapAttachmentAllowed !== false ||
      safetyFlags.automaticRendererExecutionAllowed !== false ||
      safetyFlags.lifecycleExecutionEnabled !== false
    ) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "SAFETY_FLAGS_NOT_BLOCKED",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    if (!approvedRepresentativePackage) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "UNSUPPORTED_PACKAGE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    if (
      latBucket !== normalizeBucket(approvedRepresentativePackage.latBucket) ||
      lngBucket !== normalizeBucket(approvedRepresentativePackage.lngBucket)
    ) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "REGION_OUT_OF_SCOPE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    if (approvedRepresentativePackage.expectedRecipeId !== scope.recipeId) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "UNSUPPORTED_RECIPE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    const selectorContext = buildSelectorContext(
      approvedRepresentativePackage,
      latitude,
      longitude,
      selectorFoundation.specification.selectorId
    );
    const recipeSelection = selectLocationRecipe(
      selectorContext,
      selectorFoundation.recipeMetadataRecords,
      selectorFoundation.specification
    );

    if (
      recipeSelection.blocked ||
      recipeSelection.selectedRecipeId !== scope.recipeId
    ) {
      return buildBlockedDiagnostic({
        latitude,
        longitude,
        latBucket,
        lngBucket,
        reasonCode: "UNSUPPORTED_RECIPE",
        scope,
        safetyFlags,
        bridgeState
      });
    }

    return buildResolvedDiagnostic({
      latitude,
      longitude,
      pkg: approvedRepresentativePackage,
      recipeSelection,
      scope,
      safetyFlags,
      bridgeState
    });
  }

  return deepFreeze({
    getAtlasMapDiagnostic,
    getApprovedScope() {
      return deepFreeze({ ...scope });
    },
    getSafetyFlags() {
      return safetyFlags;
    },
    getBridgeState() {
      return bridgeState;
    }
  });
}

export function getAtlasMapDiagnostic(input, options = {}) {
  return createDeveloperOnlyAtlasMapAdapter(options).getAtlasMapDiagnostic(input);
}
