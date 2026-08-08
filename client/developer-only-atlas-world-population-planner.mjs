import {
  createDeveloperOnlyAtlasMultiAssetPlacementProvider,
  createDeveloperOnlyAtlasAssetBatch,
  resolveDeveloperOnlyAtlasMultiAssetPlacement
} from "./developer-only-atlas-multi-asset-placement-provider.mjs";
import {
  createDeveloperOnlyAtlasSpatialRuleRegistry,
  getDeveloperOnlyAtlasSpatialRuleRegistryStatus,
  resolveDeveloperOnlyAtlasSpatialRuleByAssetId
} from "./developer-only-atlas-spatial-rule-registry.mjs";
import {
  createDeveloperOnlyAtlasPopulationRecipeRegistry,
  getDeveloperOnlyAtlasPopulationRecipeRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRecipeForFeature
} from "./developer-only-atlas-population-recipe-registry.mjs";
import {
  createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSpatialDistribution
} from "./developer-only-atlas-population-spatial-distribution-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry,
  getDeveloperOnlyAtlasPopulationRelationshipRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRelationshipPlacements
} from "./developer-only-atlas-population-relationship-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry,
  getDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationContextualWorldFill
} from "./developer-only-atlas-population-contextual-world-fill-rules.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_POPULATION_PLANNER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_POPULATION_PLAN_001";

const DEFAULT_FEATURE_BUDGET = Object.freeze({
  maximumCandidateFeatures: 64,
  maximumCommands: 24,
  maximumVegetationCommands: 18,
  maximumBuildingCommands: 4
});
const APPROVED_PLAN_REGIONS = new Set([
  "BELLARINE",
  "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
]);
const APPROVED_PLAN_PACKAGES = new Set([
  "ATLAS_DEVELOPER_PACKAGE",
  "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
]);
const APPROVED_PLAN_RECIPES = new Set([
  "TREE_EUCALYPTUS_RECIPE_001",
  "TREE_BOTTLEBRUSH_RECIPE_001",
  "SHRUB_COASTAL_LOW_RECIPE_001",
  "SPORTS_OVAL_RECIPE_001",
  "RECREATION_AREA_RECIPE_001",
  "BUILDING_CIVIC_SPORTS_PAVILION_001",
  "COASTAL_LOCATION_RECIPE_001",
  "PARK_PUBLIC_GREEN_RECIPE_001",
  "COASTAL_GREEN_RECIPE_001",
  "BUILDING_CIVIC_RECIPE_001",
  "BUILDING_GENERIC_RECIPE_001"
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

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype
  );
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
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
    .padStart(8, "0")}`;
}

function distance(a, b) {
  const dx = Number(a.longitude) - Number(b.longitude);
  const dy = Number(a.latitude) - Number(b.latitude);
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

function validateCoordinate(coordinate) {
  const latitude = Number(coordinate?.latitude);
  const longitude = Number(coordinate?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error("INVALID_FEATURE_COORDINATE"), {
      reasonCode: "INVALID_FEATURE_COORDINATE"
    });
  }
  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function validateFeature(feature = {}) {
  const featureId = sanitizeString(feature.featureId);
  const featureClass = sanitizeString(feature.featureClass);
  const deterministicFeatureIdentity =
    sanitizeString(feature.deterministicFeatureIdentity) ?? featureId;

  if (!featureId) {
    throw Object.assign(new Error("MISSING_FEATURE_ID"), {
      reasonCode: "MISSING_FEATURE_ID"
    });
  }
  if (!featureClass) {
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  return deepFreeze({
    featureId,
    featureClass,
    coordinate: validateCoordinate(feature.coordinate ?? feature.centroid),
    orientationHint:
      feature.orientationHint == null ? null : Number(feature.orientationHint),
    area:
      feature.area == null || !Number.isFinite(Number(feature.area))
        ? null
        : Number(feature.area),
    footprintScalars: feature.footprintScalars
      ? deepFreeze({
          width:
            feature.footprintScalars.width == null
              ? null
              : Number(feature.footprintScalars.width),
          height:
            feature.footprintScalars.height == null
              ? null
              : Number(feature.footprintScalars.height)
        })
      : null,
    deterministicFeatureIdentity,
    sourceClassification: sanitizeString(feature.sourceClassification)
  });
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    spatialRuleRegistryVersion: state.spatialRuleRegistryVersion,
    registeredRuleCount: state.registeredRuleCount,
    distributionRuleVersion: state.distributionRuleVersion,
    registeredDistributionRuleCount: state.registeredDistributionRuleCount,
    distributionRuleId: state.distributionRuleId,
    relationshipRuleVersion: state.relationshipRuleVersion,
    registeredRelationshipRuleCount: state.registeredRelationshipRuleCount,
    relationshipRuleId: state.relationshipRuleId,
    contextualWorldFillVersion: state.contextualWorldFillVersion,
    registeredContextRuleCount: state.registeredContextRuleCount,
    contextRuleId: state.contextRuleId,
    worldFillCategory: state.worldFillCategory,
    generatedSubRecipeCount: state.generatedSubRecipeCount,
    childPlacementCount: state.childPlacementCount,
    contextReason: state.contextReason,
    nearestFeatureId: state.nearestFeatureId,
    nearestRoadId: state.nearestRoadId,
    boundaryDistance: state.boundaryDistance,
    orientationDecision: state.orientationDecision,
    placementReason: state.placementReason,
    densityTier: state.densityTier,
    matchedRecipeId: state.matchedRecipeId,
    matchedFeatureClass: state.matchedFeatureClass,
    generatedCommandCount: state.generatedCommandCount,
    generatedPlacementCount: state.generatedPlacementCount,
    rejectedRecipeCount: state.rejectedRecipeCount,
    populationPlanId: state.populationPlanId,
    candidateFeatureCount: state.candidateFeatureCount,
    acceptedPlacementCount: state.acceptedPlacementCount,
    rejectedPlacementCount: state.rejectedPlacementCount,
    rejectionReasons: deepFreeze([...state.rejectionReasons]),
    vegetationPlacementCount: state.vegetationPlacementCount,
    buildingPlacementCount: state.buildingPlacementCount,
    budgetLimit: deepFreeze({ ...state.budgetLimit }),
    budgetTruncated: state.budgetTruncated,
    lastRejectedReason: state.lastRejectedReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function createRejectedCandidate({
  assetId,
  featureId,
  featureClass,
  reasonCode
}) {
  return deepFreeze({
    assetId,
    featureId,
    featureClass,
    reasonCode
  });
}

function normalizeBudget(budget = {}) {
  return deepFreeze({
    maximumCandidateFeatures: Number(
      budget.maximumCandidateFeatures ?? DEFAULT_FEATURE_BUDGET.maximumCandidateFeatures
    ),
    maximumCommands: Number(
      budget.maximumCommands ?? DEFAULT_FEATURE_BUDGET.maximumCommands
    ),
    maximumVegetationCommands: Number(
      budget.maximumVegetationCommands ??
        DEFAULT_FEATURE_BUDGET.maximumVegetationCommands
    ),
    maximumBuildingCommands: Number(
      budget.maximumBuildingCommands ??
        DEFAULT_FEATURE_BUDGET.maximumBuildingCommands
    )
  });
}

function featureEligibleForRule(feature, rule, context) {
  if (
    !rule.regionConstraints.approvedRegions.includes(context.regionId) ||
    !rule.regionConstraints.approvedPackages.includes(context.packageId) ||
    !rule.regionConstraints.approvedRecipeIds.includes(context.recipeId)
  ) {
    return "CONTEXT_NOT_APPROVED";
  }

  if (rule.prohibitedFeatureClasses.includes(feature.featureClass)) {
    return "PROHIBITED_FEATURE_CLASS";
  }

  if (!rule.allowedFeatureClasses.includes(feature.featureClass)) {
    return "UNSUPPORTED_FEATURE_CLASS";
  }

  if (rule.assetCategory === "building") {
    const width = feature.footprintScalars?.width ?? 0;
    const height = feature.footprintScalars?.height ?? 0;
    if (
      feature.featureClass === "building_footprint" &&
      (width < 20 || height < 10)
    ) {
      return "BUILDING_FOOTPRINT_TOO_SMALL";
    }
  }

  return null;
}

function sortCandidates(left, right) {
  const byFeature = left.feature.featureId.localeCompare(right.feature.featureId);
  if (byFeature !== 0) {
    return byFeature;
  }
  const byAsset = left.assetId.localeCompare(right.assetId);
  if (byAsset !== 0) {
    return byAsset;
  }
  return left.candidateIndex - right.candidateIndex;
}

function enforceSpacing(candidate, accepted, rule) {
  const candidateAssetCategory = rule.assetCategory;
  const candidateIsShrub = candidate.assetId === "SHRUB_COASTAL_LOW_001";

  for (const placement of accepted) {
    if (placement.assetCategory !== candidateAssetCategory) {
      continue;
    }
    if (
      placement.assetCategory === "building" &&
      placement.featureId === candidate.feature.featureId
    ) {
      return "DUPLICATE_BUILDING_FEATURE";
    }
    const placedIsShrub = placement.assetId === "SHRUB_COASTAL_LOW_001";
    if (
      candidateAssetCategory === "vegetation" &&
      candidateIsShrub !== placedIsShrub
    ) {
      continue;
    }
    const measured = distance(candidate.coordinate, placement.coordinate);
    if (measured < rule.minimumSpacing) {
      return "MINIMUM_SPACING_BLOCKED";
    }
  }
  return null;
}

function enforceExclusion(candidate, features, rule) {
  const exclusionEntries = Object.entries(rule.exclusionRadiusRules ?? {});
  if (exclusionEntries.length === 0) {
    return null;
  }

  for (const feature of features) {
    if (feature.featureId === candidate.feature.featureId) {
      continue;
    }

    const radius = rule.exclusionRadiusRules?.[feature.featureClass];
    if (!Number.isFinite(Number(radius)) || Number(radius) <= 0) {
      continue;
    }

    if (distance(candidate.coordinate, feature.coordinate) < Number(radius)) {
      return "EXCLUSION_RADIUS_BLOCKED";
    }
  }

  return null;
}

export function createDeveloperOnlyAtlasWorldPopulationPlanner({
  spatialRuleRegistry = createDeveloperOnlyAtlasSpatialRuleRegistry(),
  placementProvider = createDeveloperOnlyAtlasMultiAssetPlacementProvider(),
  populationRecipeRegistry = createDeveloperOnlyAtlasPopulationRecipeRegistry(),
  populationSpatialDistributionRuleRegistry =
    createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry(),
  populationRelationshipRuleRegistry =
    createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry(),
  populationContextualWorldFillRuleRegistry =
    createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry()
} = {}) {
  const registryStatus = getDeveloperOnlyAtlasSpatialRuleRegistryStatus(
    spatialRuleRegistry
  );
  const populationRecipeRegistryStatus =
    getDeveloperOnlyAtlasPopulationRecipeRegistryStatus(populationRecipeRegistry);
  const distributionRegistryStatus =
    getDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistryStatus(
      populationSpatialDistributionRuleRegistry
    );
  const relationshipRegistryStatus =
    getDeveloperOnlyAtlasPopulationRelationshipRuleRegistryStatus(
      populationRelationshipRuleRegistry
    );
  const contextualWorldFillRegistryStatus =
    getDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistryStatus(
      populationContextualWorldFillRuleRegistry
    );

  const state = {
    spatialRuleRegistryVersion: registryStatus.spatialRuleRegistryVersion,
    registeredRuleCount: registryStatus.registeredRuleCount,
    distributionRuleVersion: distributionRegistryStatus.distributionVersion,
    registeredDistributionRuleCount:
      distributionRegistryStatus.registeredDistributionRuleCount,
    distributionRuleId: distributionRegistryStatus.distributionRuleId,
    relationshipRuleVersion: relationshipRegistryStatus.relationshipRuleVersion,
    registeredRelationshipRuleCount:
      relationshipRegistryStatus.registeredRelationshipRuleCount,
    relationshipRuleId: relationshipRegistryStatus.relationshipRuleId,
    contextualWorldFillVersion:
      contextualWorldFillRegistryStatus.contextualWorldFillVersion,
    registeredContextRuleCount:
      contextualWorldFillRegistryStatus.registeredContextRuleCount,
    contextRuleId: contextualWorldFillRegistryStatus.contextRuleId,
    worldFillCategory: contextualWorldFillRegistryStatus.worldFillCategory,
    generatedSubRecipeCount:
      contextualWorldFillRegistryStatus.generatedSubRecipeCount,
    childPlacementCount:
      contextualWorldFillRegistryStatus.childPlacementCount,
    contextReason: contextualWorldFillRegistryStatus.contextReason,
    nearestFeatureId: relationshipRegistryStatus.nearestFeatureId,
    nearestRoadId: relationshipRegistryStatus.nearestRoadId,
    boundaryDistance: relationshipRegistryStatus.boundaryDistance,
    orientationDecision: relationshipRegistryStatus.orientationDecision,
    placementReason: relationshipRegistryStatus.placementReason,
    densityTier: distributionRegistryStatus.densityTier,
    matchedRecipeId: populationRecipeRegistryStatus.matchedRecipeId,
    matchedFeatureClass: populationRecipeRegistryStatus.matchedFeatureClass,
    generatedCommandCount: populationRecipeRegistryStatus.generatedCommandCount,
    generatedPlacementCount:
      distributionRegistryStatus.generatedPlacementCount,
    rejectedRecipeCount: populationRecipeRegistryStatus.rejectedRecipeCount,
    populationPlanId: null,
    candidateFeatureCount: 0,
    acceptedPlacementCount: 0,
    rejectedPlacementCount: 0,
    rejectionReasons: [],
    vegetationPlacementCount: 0,
    buildingPlacementCount: 0,
    budgetLimit: DEFAULT_FEATURE_BUDGET,
    budgetTruncated: false,
    lastRejectedReason: null,
    lastFailureReason: null
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasWorldPopulationPlanner: true,
    __state: state,
    __internal: {
      spatialRuleRegistry,
      populationRecipeRegistry,
      populationSpatialDistributionRuleRegistry,
      populationRelationshipRuleRegistry,
      populationContextualWorldFillRuleRegistry,
      placementProvider,
      lastPlan: null
    }
  });
}

function requirePlanner(planner) {
  if (
    !planner?.__growgoDeveloperOnlyAtlasWorldPopulationPlanner ||
    !planner.__state ||
    !planner.__internal
  ) {
    throw Object.assign(new Error("ATLAS_WORLD_POPULATION_PLANNER_UNAVAILABLE"), {
      reasonCode: "ATLAS_WORLD_POPULATION_PLANNER_UNAVAILABLE"
    });
  }
  return planner;
}

export function createDeveloperOnlyAtlasWorldPopulationPlan(planner, input = {}) {
  requirePlanner(planner);
  const state = planner.__state;
  const internal = planner.__internal;

  const regionId = sanitizeString(input.regionId);
  const packageId = sanitizeString(input.packageId);
  const recipeId = sanitizeString(input.recipeId);
  const selectorSeed = sanitizeString(input.selectorSeed);
  const viewportOrTileId =
    sanitizeString(input.viewportId) ??
    sanitizeString(input.tileId) ??
    sanitizeString(input.viewportOrTileIdentity);
  const budget = normalizeBudget(input.performanceBudget);

  if (!regionId || !APPROVED_PLAN_REGIONS.has(regionId)) {
    state.lastFailureReason = "INVALID_REGION_ID";
    throw Object.assign(new Error("INVALID_REGION_ID"), {
      reasonCode: "INVALID_REGION_ID"
    });
  }
  if (!packageId || !APPROVED_PLAN_PACKAGES.has(packageId)) {
    state.lastFailureReason = "INVALID_PACKAGE_ID";
    throw Object.assign(new Error("INVALID_PACKAGE_ID"), {
      reasonCode: "INVALID_PACKAGE_ID"
    });
  }
  if (!recipeId || !APPROVED_PLAN_RECIPES.has(recipeId)) {
    state.lastFailureReason = "INVALID_RECIPE_ID";
    throw Object.assign(new Error("INVALID_RECIPE_ID"), {
      reasonCode: "INVALID_RECIPE_ID"
    });
  }
  if (!selectorSeed) {
    state.lastFailureReason = "MISSING_SELECTOR_SEED";
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }

  const features = Array.isArray(input.features) ? input.features.map(validateFeature) : [];
  state.candidateFeatureCount = Math.min(
    features.length,
    budget.maximumCandidateFeatures
  );
  state.acceptedPlacementCount = 0;
  state.rejectedPlacementCount = 0;
  state.generatedCommandCount = 0;
  state.generatedPlacementCount = 0;
  state.rejectedRecipeCount = 0;
  state.matchedRecipeId = null;
  state.matchedFeatureClass = null;
  state.distributionRuleId = null;
  state.relationshipRuleId = null;
  state.contextRuleId = null;
  state.worldFillCategory = null;
  state.generatedSubRecipeCount = 0;
  state.childPlacementCount = 0;
  state.contextReason = null;
  state.nearestFeatureId = null;
  state.nearestRoadId = null;
  state.boundaryDistance = null;
  state.orientationDecision = null;
  state.placementReason = null;
  state.densityTier = null;
  state.vegetationPlacementCount = 0;
  state.buildingPlacementCount = 0;
  state.budgetLimit = budget;
  state.budgetTruncated = features.length > budget.maximumCandidateFeatures;
  state.lastRejectedReason = null;
  state.lastFailureReason = null;
  state.rejectionReasons = [];

  const truncatedFeatures = [...features]
    .sort((left, right) => left.featureId.localeCompare(right.featureId))
    .slice(0, budget.maximumCandidateFeatures);

  const candidateEntries = [];
  const rejectedCandidates = [];
  const resolvedFeatureRecipes = [];
  const relationshipDecisions = [];
  const contextualWorldFillDecisions = [];
  const relationshipContext =
    input.relationshipContext && typeof input.relationshipContext === "object"
      ? input.relationshipContext
      : { roadWays: [] };

  for (const feature of truncatedFeatures) {
    const recipeResolution = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(
      internal.populationRecipeRegistry,
      {
        featureClass: feature.featureClass,
        regionId,
        packageId,
        contextRecipeId: recipeId
      }
    );

    if (!recipeResolution.matched) {
      state.rejectedRecipeCount += 1;
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: null,
          featureId: feature.featureId,
          featureClass: feature.featureClass,
          reasonCode: recipeResolution.reasonCode
        })
      );
      continue;
    }

    state.matchedRecipeId = recipeResolution.matchedRecipeId;
    state.matchedFeatureClass = recipeResolution.matchedFeatureClass;

    const distributionResolution =
      resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
        internal.populationSpatialDistributionRuleRegistry,
        {
          matchedRecipeId: recipeResolution.matchedRecipeId,
          feature,
          selectorSeed,
          assetCommands: recipeResolution.assetCommands
        }
      );

    const relationshipResolution =
      resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
        internal.populationRelationshipRuleRegistry,
        {
          matchedRecipeId: recipeResolution.matchedRecipeId,
          feature,
          selectorSeed,
          placements: distributionResolution.placements,
          relationshipContext: {
            roadWays: relationshipContext.roadWays,
            adjacentFeatures: truncatedFeatures
          }
        }
      );

    const contextualWorldFillResolution =
      resolveDeveloperOnlyAtlasPopulationContextualWorldFill(
        internal.populationContextualWorldFillRuleRegistry,
        {
          feature,
          selectorSeed,
          placements: relationshipResolution.placements
        }
      );

    state.distributionRuleId = distributionResolution.distributionRuleId;
    state.relationshipRuleId = relationshipResolution.relationshipRuleId;
    state.contextRuleId = contextualWorldFillResolution.contextRuleId;
    state.worldFillCategory = contextualWorldFillResolution.worldFillCategory;
    state.generatedSubRecipeCount +=
      contextualWorldFillResolution.generatedSubRecipeCount;
    state.childPlacementCount +=
      contextualWorldFillResolution.childPlacementCount;
    state.contextReason = contextualWorldFillResolution.contextReason;
    state.nearestFeatureId =
      relationshipResolution.featureDiagnostics.nearestFeatureId;
    state.nearestRoadId = relationshipResolution.featureDiagnostics.nearestRoadId;
    state.boundaryDistance =
      relationshipResolution.featureDiagnostics.boundaryDistance;
    state.orientationDecision =
      relationshipResolution.featureDiagnostics.orientationDecision;
    state.placementReason =
      relationshipResolution.featureDiagnostics.placementReason;
    state.densityTier = distributionResolution.densityTier;
    state.generatedPlacementCount += distributionResolution.generatedPlacementCount;

    relationshipDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        matchedRecipeId: recipeResolution.matchedRecipeId,
        relationshipRuleId: relationshipResolution.relationshipRuleId,
        nearestFeatureId:
          relationshipResolution.featureDiagnostics.nearestFeatureId,
        nearestRoadId: relationshipResolution.featureDiagnostics.nearestRoadId,
        boundaryDistance:
          relationshipResolution.featureDiagnostics.boundaryDistance,
        orientationDecision:
          relationshipResolution.featureDiagnostics.orientationDecision,
        placementReason:
          relationshipResolution.featureDiagnostics.placementReason
      })
    );
    contextualWorldFillDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        contextRuleId: contextualWorldFillResolution.contextRuleId,
        worldFillCategory: contextualWorldFillResolution.worldFillCategory,
        generatedSubRecipeCount:
          contextualWorldFillResolution.generatedSubRecipeCount,
        childPlacementCount: contextualWorldFillResolution.childPlacementCount,
        contextReason: contextualWorldFillResolution.contextReason
      })
    );

    if (recipeResolution.generatedCommandCount === 0) {
      resolvedFeatureRecipes.push(
        deepFreeze({
          featureId: feature.featureId,
          matchedFeatureClass: recipeResolution.matchedFeatureClass,
          matchedRecipeId: recipeResolution.matchedRecipeId,
          distributionRuleId: distributionResolution.distributionRuleId,
          relationshipRuleId: relationshipResolution.relationshipRuleId,
          contextRuleId: contextualWorldFillResolution.contextRuleId,
          worldFillCategory: contextualWorldFillResolution.worldFillCategory,
          generatedSubRecipeCount:
            contextualWorldFillResolution.generatedSubRecipeCount,
          childPlacementCount:
            contextualWorldFillResolution.childPlacementCount,
          contextReason: contextualWorldFillResolution.contextReason,
          nearestFeatureId:
            relationshipResolution.featureDiagnostics.nearestFeatureId,
          nearestRoadId: relationshipResolution.featureDiagnostics.nearestRoadId,
          boundaryDistance:
            relationshipResolution.featureDiagnostics.boundaryDistance,
          orientationDecision:
            relationshipResolution.featureDiagnostics.orientationDecision,
          placementReason:
            relationshipResolution.featureDiagnostics.placementReason,
          densityTier: distributionResolution.densityTier,
          generatedPlacementCount: distributionResolution.generatedPlacementCount,
          rejectedPlacementCount: distributionResolution.rejectedPlacementCount,
          rejectionReasons: deepFreeze([
            ...distributionResolution.rejectionReasons
          ]),
          generatedCommandCount: 0
        })
      );
      continue;
    }

    resolvedFeatureRecipes.push(
        deepFreeze({
          featureId: feature.featureId,
          matchedFeatureClass: recipeResolution.matchedFeatureClass,
          matchedRecipeId: recipeResolution.matchedRecipeId,
          distributionRuleId: distributionResolution.distributionRuleId,
          relationshipRuleId: relationshipResolution.relationshipRuleId,
          contextRuleId: contextualWorldFillResolution.contextRuleId,
          worldFillCategory: contextualWorldFillResolution.worldFillCategory,
          generatedSubRecipeCount:
            contextualWorldFillResolution.generatedSubRecipeCount,
          childPlacementCount:
            contextualWorldFillResolution.childPlacementCount,
          contextReason: contextualWorldFillResolution.contextReason,
          nearestFeatureId:
            relationshipResolution.featureDiagnostics.nearestFeatureId,
          nearestRoadId: relationshipResolution.featureDiagnostics.nearestRoadId,
          boundaryDistance:
            relationshipResolution.featureDiagnostics.boundaryDistance,
          orientationDecision:
            relationshipResolution.featureDiagnostics.orientationDecision,
          placementReason:
            relationshipResolution.featureDiagnostics.placementReason,
          densityTier: distributionResolution.densityTier,
          generatedPlacementCount: distributionResolution.generatedPlacementCount,
          rejectedPlacementCount: distributionResolution.rejectedPlacementCount,
          rejectionReasons: deepFreeze([
            ...distributionResolution.rejectionReasons
          ]),
          generatedCommandCount: recipeResolution.generatedCommandCount
        })
      );

    for (const rejectedPlacement of relationshipResolution.rejectedPlacements) {
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: rejectedPlacement.assetId,
          featureId: feature.featureId,
          featureClass: feature.featureClass,
          reasonCode: rejectedPlacement.reasonCode
        })
      );
    }

    for (const placement of contextualWorldFillResolution.placements) {
      const assetId = placement.assetId;
      const assetCommand = recipeResolution.assetCommands.find(
        (entry) => entry.assetId === assetId
      ) ??
      (assetId === "SHRUB_COASTAL_LOW_001"
        ? {
            assetId: "SHRUB_COASTAL_LOW_001",
            assetVersion: "v002"
          }
        : null);
      if (!assetCommand) {
        rejectedCandidates.push(
          createRejectedCandidate({
            assetId,
            featureId: feature.featureId,
            featureClass: feature.featureClass,
            reasonCode: "DISTRIBUTION_ASSET_COMMAND_MISMATCH"
          })
        );
        continue;
      }
      const rule = resolveDeveloperOnlyAtlasSpatialRuleByAssetId(
        internal.spatialRuleRegistry,
        assetId
      );
      const rejection = featureEligibleForRule(feature, rule, {
        regionId,
        packageId,
        recipeId
      });
      if (rejection) {
        rejectedCandidates.push(
          createRejectedCandidate({
            assetId,
            featureId: feature.featureId,
            featureClass: feature.featureClass,
            reasonCode: rejection
          })
        );
        continue;
      }

      candidateEntries.push({
        assetId,
        assetCommand,
        rule,
        feature,
        matchedRecipeId: recipeResolution.matchedRecipeId,
        distributionRuleId: distributionResolution.distributionRuleId,
        relationshipRuleId: relationshipResolution.relationshipRuleId,
        contextRuleId: contextualWorldFillResolution.contextRuleId,
        worldFillCategory: contextualWorldFillResolution.worldFillCategory,
        contextReason: contextualWorldFillResolution.contextReason,
        densityTier: distributionResolution.densityTier,
        candidateIndex: placement.candidateIndex,
        coordinate: placement.coordinate,
        orientationHintOverride: placement.orientationHintOverride ?? null,
        relationshipDiagnostics: placement.relationshipDiagnostics ?? null
      });
    }
  }

  candidateEntries.sort(sortCandidates);

  const acceptedPlacements = [];
  let vegetationCount = 0;
  let buildingCount = 0;

  for (const candidate of candidateEntries) {
    const exclusionFailure = enforceExclusion(
      candidate,
      truncatedFeatures,
      candidate.rule
    );
    if (exclusionFailure) {
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: candidate.assetId,
          featureId: candidate.feature.featureId,
          featureClass: candidate.feature.featureClass,
          reasonCode: exclusionFailure
        })
      );
      continue;
    }

    const spacingFailure = enforceSpacing(
      candidate,
      acceptedPlacements,
      candidate.rule
    );
    if (spacingFailure) {
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: candidate.assetId,
          featureId: candidate.feature.featureId,
          featureClass: candidate.feature.featureClass,
          reasonCode: spacingFailure
        })
      );
      continue;
    }

    if (
      candidate.rule.assetCategory === "vegetation" &&
      vegetationCount >= budget.maximumVegetationCommands
    ) {
      state.budgetTruncated = true;
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: candidate.assetId,
          featureId: candidate.feature.featureId,
          featureClass: candidate.feature.featureClass,
          reasonCode: "VEGETATION_BUDGET_EXCEEDED"
        })
      );
      continue;
    }

    if (
      candidate.rule.assetCategory === "building" &&
      buildingCount >= budget.maximumBuildingCommands
    ) {
      state.budgetTruncated = true;
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: candidate.assetId,
          featureId: candidate.feature.featureId,
          featureClass: candidate.feature.featureClass,
          reasonCode: "BUILDING_BUDGET_EXCEEDED"
        })
      );
      continue;
    }

    if (acceptedPlacements.length >= budget.maximumCommands) {
      state.budgetTruncated = true;
      rejectedCandidates.push(
        createRejectedCandidate({
          assetId: candidate.assetId,
          featureId: candidate.feature.featureId,
          featureClass: candidate.feature.featureClass,
          reasonCode: "COMMAND_BUDGET_EXCEEDED"
        })
      );
      continue;
    }

      const placementInput = {
        assetId: candidate.assetId,
        version: candidate.assetCommand.assetVersion,
        coordinate: candidate.coordinate,
        regionId,
        packageId,
        recipeId: candidate.matchedRecipeId,
        selectorSeed: `${selectorSeed}:${candidate.feature.deterministicFeatureIdentity}:${candidate.assetId}:${candidate.candidateIndex}`,
        rotationOverride: candidate.orientationHintOverride
      };

    const resolved = resolveDeveloperOnlyAtlasMultiAssetPlacement(
      internal.placementProvider,
      placementInput
    );

    acceptedPlacements.push(
      deepFreeze({
        ...resolved,
        featureId: candidate.feature.featureId,
        featureClass: candidate.feature.featureClass,
        coordinate: candidate.coordinate,
        matchedRecipeId: candidate.matchedRecipeId,
        distributionRuleId: candidate.distributionRuleId,
        relationshipRuleId: candidate.relationshipRuleId,
        contextRuleId: candidate.contextRuleId,
        worldFillCategory: candidate.worldFillCategory,
        contextReason: candidate.contextReason,
        nearestFeatureId:
          candidate.relationshipDiagnostics?.nearestFeatureId ?? null,
        nearestRoadId: candidate.relationshipDiagnostics?.nearestRoadId ?? null,
        boundaryDistance:
          candidate.relationshipDiagnostics?.boundaryDistance ?? null,
        orientationDecision:
          candidate.relationshipDiagnostics?.orientationDecision ?? null,
        placementReason:
          candidate.relationshipDiagnostics?.placementReason ?? null,
        densityTier: candidate.densityTier
      })
    );

    if (candidate.rule.assetCategory === "vegetation") {
      vegetationCount += 1;
    } else if (candidate.rule.assetCategory === "building") {
      buildingCount += 1;
    }
  }

  const batch = createDeveloperOnlyAtlasAssetBatch(
    internal.placementProvider,
    acceptedPlacements.map((placement) => ({
      assetId: placement.assetId,
      version: placement.assetVersion,
      coordinate: placement.coordinate,
      regionId,
      packageId,
      recipeId: placement.recipeId,
      selectorSeed: placement.selectorSeed,
      rotationOverride: placement.orientationDecision
    }))
  );

  const populationPlanId = `ATLAS_POPULATION_PLAN_${hashString(
    stableSerialize({
      regionId,
      packageId,
      recipeId,
      selectorSeed,
      viewportOrTileId,
      commands: batch.commands
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  state.populationPlanId = populationPlanId;
  state.acceptedPlacementCount = acceptedPlacements.length;
  state.generatedCommandCount = acceptedPlacements.length;
  state.rejectedPlacementCount = rejectedCandidates.length;
  state.rejectionReasons = deepFreeze(
    Array.from(new Set(rejectedCandidates.map((candidate) => candidate.reasonCode)))
  );
  state.vegetationPlacementCount = vegetationCount;
  state.buildingPlacementCount = buildingCount;
  state.lastRejectedReason =
    rejectedCandidates[rejectedCandidates.length - 1]?.reasonCode ?? null;

  const plan = deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    populationPlanId,
    regionId,
    packageId,
    recipeId,
    selectorSeed,
    viewportOrTileId,
    commands: batch.commands,
    resolvedFeatureRecipes: deepFreeze(resolvedFeatureRecipes),
    relationshipDecisions: deepFreeze(relationshipDecisions),
    contextualWorldFillDecisions: deepFreeze(contextualWorldFillDecisions),
    rejectedCandidates: deepFreeze(rejectedCandidates)
  });

  internal.lastPlan = plan;
  return plan;
}

export function getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner) {
  if (
    !planner?.__growgoDeveloperOnlyAtlasWorldPopulationPlanner ||
    !planner.__state
  ) {
    return freezeStatus({
      spatialRuleRegistryVersion: null,
      registeredRuleCount: 0,
      matchedRecipeId: null,
      matchedFeatureClass: null,
      generatedCommandCount: 0,
      generatedPlacementCount: 0,
      rejectedRecipeCount: 0,
      distributionRuleVersion: null,
      registeredDistributionRuleCount: 0,
      distributionRuleId: null,
      relationshipRuleVersion: null,
      registeredRelationshipRuleCount: 0,
      relationshipRuleId: null,
      contextualWorldFillVersion: null,
      registeredContextRuleCount: 0,
      contextRuleId: null,
      worldFillCategory: null,
      generatedSubRecipeCount: 0,
      childPlacementCount: 0,
      contextReason: null,
      nearestFeatureId: null,
      nearestRoadId: null,
      boundaryDistance: null,
      orientationDecision: null,
      placementReason: null,
      densityTier: null,
      populationPlanId: null,
      candidateFeatureCount: 0,
      acceptedPlacementCount: 0,
      rejectedPlacementCount: 0,
      rejectionReasons: [],
      vegetationPlacementCount: 0,
      buildingPlacementCount: 0,
      budgetLimit: DEFAULT_FEATURE_BUDGET,
      budgetTruncated: false,
      lastRejectedReason: null,
      lastFailureReason: "ATLAS_WORLD_POPULATION_PLANNER_UNAVAILABLE"
    });
  }

  return freezeStatus(planner.__state);
}
