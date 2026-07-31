const DEFAULT_SCOPE_SOURCE = "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001";

const DEFAULT_SELECTOR_CONTEXT = Object.freeze({
  worldContextId: "WORLD_CONTEXT_DEFAULT_001",
  environment: "DEVELOPMENT_ONLY",
  biomeProfile: "COASTAL_RESERVE_TRAIL",
  routeMode: "pedestrian_exploration",
  archetype: "RESERVE_LOOP",
  desiredFeatures: ["shoreline_transition", "loop_destination"],
  seed: "LOCATION_RECIPE_SELECTOR_001:DEFAULT"
});

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

function hashHex(...parts) {
  const source = parts.map((part) => String(part)).join("|");
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeArray(values) {
  return [...new Set((values ?? []).map(normalizeToken).filter(Boolean))].sort();
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

function contextToDeterministicKey(context) {
  return hashHex(
    context.worldContextId,
    context.environment,
    context.biomeProfile,
    context.routeMode,
    context.archetype,
    ...(context.desiredFeatures ?? []),
    context.seed,
    context.selectorVersion ?? "LOCATION_RECIPE_SELECTOR_001"
  );
}

function calculateRecipeSelectionScore(context, metadata, specification) {
  const biomeProfile = normalizeToken(context.biomeProfile);
  const desiredFeatures = normalizeArray(context.desiredFeatures);
  const routeMode = normalizeToken(context.routeMode);
  const archetype = normalizeToken(context.archetype);
  const environment = normalizeToken(context.environment);
  const selectorVersion = normalizeToken(
    context.selectorVersion ?? specification.selectorId
  );

  const biomeTags = metadata.biomeTags;
  const supportedArchetypes = metadata.supportedArchetypes;
  const capabilities = metadata.selectionCapabilities;

  const checks = {
    approvedRecipe: metadata.approvalStatus === "approved",
    approvedLifecycle:
      specification.selectionRules.approvedLifecycleStates.includes(
        metadata.lifecycleStatus
      ),
    requiredEnvironment:
      environment === normalizeToken(metadata.environmentRequirements.requiredEnvironment),
    versionCompatibility:
      selectorVersion === specification.selectorId &&
      normalizeToken(metadata.versionCompatibility.requiredWorkflowVersion) ===
        normalizeToken(specification.workflowVersion)
  };

  const eligible =
    checks.approvedRecipe &&
    checks.approvedLifecycle &&
    checks.requiredEnvironment &&
    checks.versionCompatibility &&
    !metadata.disallowedBiomeTags.includes(biomeProfile);

  const componentScores = {
    biomeMatch: biomeTags.includes(biomeProfile)
      ? 40
      : biomeProfile.includes(metadata.biomeFamily) || metadata.biomeFamily.includes(biomeProfile)
        ? 20
        : 0,
    environmentMatch: checks.requiredEnvironment ? 20 : 0,
    archetypeMatch: supportedArchetypes.includes(archetype) ? 15 : 0,
    featureMatch:
      desiredFeatures.length === 0
        ? 0
        : Math.round(
            (desiredFeatures.filter((feature) => capabilities.includes(feature)).length /
              desiredFeatures.length) *
              15
          ),
    versionCompatibility: checks.versionCompatibility ? 10 : 0
  };

  if (routeMode.includes("PEDESTRIAN")) {
    componentScores.featureMatch = Math.min(
      15,
      componentScores.featureMatch +
        (metadata.routeSignals.some((signal) => signal.includes("PEDESTRIAN")) ? 2 : 0)
    );
  }

  const totalScore = Object.values(componentScores).reduce((sum, value) => sum + value, 0);
  const tieBreak = hashHex(contextToDeterministicKey(context), metadata.recipeId);

  return deepFreeze({
    recipeId: metadata.recipeId,
    eligible,
    checks,
    componentScores,
    totalScore,
    tieBreak
  });
}

function selectLocationRecipe(context, library, specification) {
  const normalizedContext = deepFreeze({
    ...DEFAULT_SELECTOR_CONTEXT,
    ...context,
    desiredFeatures: normalizeArray(
      context?.desiredFeatures ?? DEFAULT_SELECTOR_CONTEXT.desiredFeatures
    )
  });

  const scoredCandidates = library.map((metadata) =>
    calculateRecipeSelectionScore(normalizedContext, metadata, specification)
  );
  const eligibleCandidates = scoredCandidates
    .filter((candidate) => candidate.eligible)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      return left.tieBreak.localeCompare(right.tieBreak);
    });

  const selectedCandidate = eligibleCandidates[0] ?? null;
  const minimumConfidence = specification.selectionRules.fallbackPolicy.minimumConfidence;

  if (!selectedCandidate || selectedCandidate.totalScore < minimumConfidence) {
    return deepFreeze({
      context: normalizedContext,
      selectedRecipeId: null,
      confidenceScore: 0,
      fallbackApplied: false,
      blocked: true,
      reason: "unsupported_context_or_no_approved_recipe_match",
      scoredCandidates
    });
  }

  const topMetadata = library.find(
    (metadata) => metadata.recipeId === selectedCandidate.recipeId
  );
  const fallbackApplied =
    selectedCandidate.componentScores.biomeMatch < 40 &&
    selectedCandidate.totalScore >= minimumConfidence;

  return deepFreeze({
    context: normalizedContext,
    selectedRecipeId: selectedCandidate.recipeId,
    selectedVersion: topMetadata.version,
    confidenceScore: selectedCandidate.totalScore,
    fallbackApplied,
    blocked: false,
    reason: fallbackApplied ? "approved_recipe_fallback_selected" : "direct_match",
    scoredCandidates
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

export function createDeveloperOnlyAtlasMapAdapterCore(options = {}) {
  const scope = options.approvedScope;
  const safetyFlags = deepFreeze({
    ...(options.safetyFlags ?? {})
  });
  const approvedRepresentativePackage =
    options.approvedRepresentativePackage ?? null;
  const selectorFoundation = options.selectorFoundation;
  const scopeSource = options.scopeSource ?? DEFAULT_SCOPE_SOURCE;
  const bridgeState = deepFreeze({
    liveMapGetterImplemented: false,
    liveMapInvocationPerformed: false,
    listenersAttached: false,
    mapMutated: false,
    rendererAttached: false,
    domMutated: false,
    ...(options.bridgeStateOverride ?? {})
  });

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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
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
        bridgeState,
        scopeSource
      });
    }

    return buildResolvedDiagnostic({
      latitude,
      longitude,
      pkg: approvedRepresentativePackage,
      recipeSelection,
      scope,
      safetyFlags,
      bridgeState,
      scopeSource
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
