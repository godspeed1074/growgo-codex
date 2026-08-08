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
import {
  createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry,
  getDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern
} from "./developer-only-atlas-population-neighborhood-pattern-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry,
  getDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationDistrictComposition
} from "./developer-only-atlas-population-district-composition-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry,
  getDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationCorridorConnectivity
} from "./developer-only-atlas-population-corridor-connectivity-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry,
  getDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationParcelFrontageLot
} from "./developer-only-atlas-population-parcel-frontage-lot-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry,
  getDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationStreetscapeVergeEdge
} from "./developer-only-atlas-population-streetscape-verge-edge-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry,
  getDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFraming
} from "./developer-only-atlas-population-open-space-landmark-framing-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry,
  getDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationBiomeLocalCharacter
} from "./developer-only-atlas-population-biome-local-character-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry,
  getDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSeasonalEnvironment
} from "./developer-only-atlas-population-seasonal-environment-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesion
} from "./developer-only-atlas-population-settlement-identity-style-cohesion-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry,
  getDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesion
} from "./developer-only-atlas-population-asset-family-material-cohesion-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry,
  getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationModularAssetBinding
} from "./developer-only-atlas-population-modular-asset-binding-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry,
  getDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency
} from "./developer-only-atlas-population-micro-cluster-adjacency-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSupportingComposition
} from "./developer-only-atlas-population-supporting-composition-rules.mjs";

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
    neighborhoodPatternVersion: state.neighborhoodPatternVersion,
    registeredNeighborhoodPatternCount: state.registeredNeighborhoodPatternCount,
    neighborhoodPatternId: state.neighborhoodPatternId,
    patternCategory: state.patternCategory,
    patternSeed: state.patternSeed,
    generatedContextCount: state.generatedContextCount,
    patternDecisionReason: state.patternDecisionReason,
    districtCompositionVersion: state.districtCompositionVersion,
    registeredDistrictRuleCount: state.registeredDistrictRuleCount,
    districtId: state.districtId,
    districtType: state.districtType,
    settlementPatternId: state.settlementPatternId,
    districtTransitionReason: state.districtTransitionReason,
    compositionSeed: state.compositionSeed,
    corridorConnectivityVersion: state.corridorConnectivityVersion,
    registeredCorridorRuleCount: state.registeredCorridorRuleCount,
    corridorId: state.corridorId,
    corridorType: state.corridorType,
    connectedDistrictIds: deepFreeze([...(state.connectedDistrictIds ?? [])]),
    connectivityReason: state.connectivityReason,
    movementPriority: state.movementPriority,
    parcelFrontageLotVersion: state.parcelFrontageLotVersion,
    registeredParcelRuleCount: state.registeredParcelRuleCount,
    parcelPatternId: state.parcelPatternId,
    lotType: state.lotType,
    frontageDirection: state.frontageDirection,
    frontageRoadId: state.frontageRoadId,
    setbackDistance: state.setbackDistance,
    boundaryPattern: state.boundaryPattern,
    streetscapeVersion: state.streetscapeVersion,
    registeredStreetscapeRuleCount: state.registeredStreetscapeRuleCount,
    streetscapeProfileId: state.streetscapeProfileId,
    vergeType: state.vergeType,
    edgeConditionType: state.edgeConditionType,
    streetFurnitureProfile: state.streetFurnitureProfile,
    streetscapeReason: state.streetscapeReason,
    openSpaceLandmarkFramingVersion: state.openSpaceLandmarkFramingVersion,
    registeredLandmarkFramingRuleCount: state.registeredLandmarkFramingRuleCount,
    landmarkFramingRuleId: state.landmarkFramingRuleId,
    foregroundType: state.foregroundType,
    approachDirection: state.approachDirection,
    openSpaceRatio: state.openSpaceRatio,
    visibilityReason: state.visibilityReason,
    biomeLocalCharacterVersion: state.biomeLocalCharacterVersion,
    registeredBiomeRuleCount: state.registeredBiomeRuleCount,
    biomeProfileId: state.biomeProfileId,
    localCharacterProfileId: state.localCharacterProfileId,
    blendWeights: deepFreeze({ ...(state.blendWeights ?? {}) }),
    characterReason: state.characterReason,
    regionalStyleSeed: state.regionalStyleSeed,
    seasonalEnvironmentVersion: state.seasonalEnvironmentVersion,
    registeredSeasonRuleCount: state.registeredSeasonRuleCount,
    seasonProfileId: state.seasonProfileId,
    environmentStateId: state.environmentStateId,
    seasonalBlendWeights: deepFreeze({ ...(state.seasonalBlendWeights ?? {}) }),
    environmentReason: state.environmentReason,
    seasonSeed: state.seasonSeed,
    settlementIdentityStyleCohesionVersion:
      state.settlementIdentityStyleCohesionVersion,
    registeredSettlementIdentityRuleCount:
      state.registeredSettlementIdentityRuleCount,
    settlementIdentityId: state.settlementIdentityId,
    styleProfileId: state.styleProfileId,
    paletteProfileId: state.paletteProfileId,
    architecturalInfluence: state.architecturalInfluence,
    cohesionReason: state.cohesionReason,
    assetFamilyMaterialCohesionVersion:
      state.assetFamilyMaterialCohesionVersion,
    registeredAssetFamilyRuleCount: state.registeredAssetFamilyRuleCount,
    assetFamilyId: state.assetFamilyId,
    materialFamilyId: state.materialFamilyId,
    styleCompatibilityReason: state.styleCompatibilityReason,
    assetSelectionSeed: state.assetSelectionSeed,
    modularAssetBindingVersion: state.modularAssetBindingVersion,
    registeredModularBindingRuleCount: state.registeredModularBindingRuleCount,
    selectedAssetId: state.selectedAssetId,
    assetVariantId: state.assetVariantId,
    variantSelectionReason: state.variantSelectionReason,
    materialAssignmentId: state.materialAssignmentId,
    lodProfileId: state.lodProfileId,
    microClusterAdjacencyVersion: state.microClusterAdjacencyVersion,
    registeredMicroClusterRuleCount: state.registeredMicroClusterRuleCount,
    microClusterId: state.microClusterId,
    clusterType: state.clusterType,
    childAssetCount: state.childAssetCount,
    adjacencyReason: state.adjacencyReason,
    variationSeed: state.variationSeed,
    supportingCompositionVersion: state.supportingCompositionVersion,
    registeredSupportingCompositionRuleCount:
      state.registeredSupportingCompositionRuleCount,
    supportingPropProfileId: state.supportingPropProfileId,
    boundaryCompositionId: state.boundaryCompositionId,
    entryCompositionId: state.entryCompositionId,
    propDensityTier: state.propDensityTier,
    compositionReason: state.compositionReason,
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
    createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry(),
  populationNeighborhoodPatternRuleRegistry =
    createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry(),
  populationDistrictCompositionRuleRegistry =
    createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry(),
  populationCorridorConnectivityRuleRegistry =
    createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry(),
  populationParcelFrontageLotRuleRegistry =
    createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry(),
  populationStreetscapeVergeEdgeRuleRegistry =
    createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry(),
  populationOpenSpaceLandmarkFramingRuleRegistry =
    createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry(),
  populationBiomeLocalCharacterRuleRegistry =
    createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry(),
  populationSeasonalEnvironmentRuleRegistry =
    createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry(),
  populationSettlementIdentityStyleCohesionRuleRegistry =
    createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry(),
  populationAssetFamilyMaterialCohesionRuleRegistry =
    createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry(),
  populationModularAssetBindingRuleRegistry =
    createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry(),
  populationMicroClusterAdjacencyRuleRegistry =
    createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry(),
  populationSupportingCompositionRuleRegistry =
    createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry()
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
  const neighborhoodPatternRegistryStatus =
    getDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistryStatus(
      populationNeighborhoodPatternRuleRegistry
    );
  const districtCompositionRegistryStatus =
    getDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistryStatus(
      populationDistrictCompositionRuleRegistry
    );
  const corridorConnectivityRegistryStatus =
    getDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistryStatus(
      populationCorridorConnectivityRuleRegistry
    );
  const parcelFrontageLotRegistryStatus =
    getDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistryStatus(
      populationParcelFrontageLotRuleRegistry
    );
  const streetscapeRegistryStatus =
    getDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistryStatus(
      populationStreetscapeVergeEdgeRuleRegistry
    );
  const openSpaceLandmarkFramingRegistryStatus =
    getDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistryStatus(
      populationOpenSpaceLandmarkFramingRuleRegistry
    );
  const biomeLocalCharacterRegistryStatus =
    getDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistryStatus(
      populationBiomeLocalCharacterRuleRegistry
    );
  const seasonalEnvironmentRegistryStatus =
    getDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistryStatus(
      populationSeasonalEnvironmentRuleRegistry
    );
  const settlementIdentityStyleCohesionRegistryStatus =
    getDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistryStatus(
      populationSettlementIdentityStyleCohesionRuleRegistry
    );
  const assetFamilyMaterialCohesionRegistryStatus =
    getDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistryStatus(
      populationAssetFamilyMaterialCohesionRuleRegistry
    );
  const modularAssetBindingRegistryStatus =
    getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus(
      populationModularAssetBindingRuleRegistry
    );
  const microClusterAdjacencyRegistryStatus =
    getDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistryStatus(
      populationMicroClusterAdjacencyRuleRegistry
    );
  const supportingCompositionRegistryStatus =
    getDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistryStatus(
      populationSupportingCompositionRuleRegistry
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
    neighborhoodPatternVersion:
      neighborhoodPatternRegistryStatus.neighborhoodPatternVersion,
    registeredNeighborhoodPatternCount:
      neighborhoodPatternRegistryStatus.registeredNeighborhoodPatternCount,
    neighborhoodPatternId:
      neighborhoodPatternRegistryStatus.neighborhoodPatternId,
    patternCategory: neighborhoodPatternRegistryStatus.patternCategory,
    patternSeed: neighborhoodPatternRegistryStatus.patternSeed,
    generatedContextCount:
      neighborhoodPatternRegistryStatus.generatedContextCount,
    patternDecisionReason:
      neighborhoodPatternRegistryStatus.patternDecisionReason,
    districtCompositionVersion:
      districtCompositionRegistryStatus.districtCompositionVersion,
    registeredDistrictRuleCount:
      districtCompositionRegistryStatus.registeredDistrictRuleCount,
    districtId: districtCompositionRegistryStatus.districtId,
    districtType: districtCompositionRegistryStatus.districtType,
    settlementPatternId:
      districtCompositionRegistryStatus.settlementPatternId,
    districtTransitionReason:
      districtCompositionRegistryStatus.districtTransitionReason,
    compositionSeed: districtCompositionRegistryStatus.compositionSeed,
    corridorConnectivityVersion:
      corridorConnectivityRegistryStatus.corridorConnectivityVersion,
    registeredCorridorRuleCount:
      corridorConnectivityRegistryStatus.registeredCorridorRuleCount,
    corridorId: corridorConnectivityRegistryStatus.corridorId,
    corridorType: corridorConnectivityRegistryStatus.corridorType,
    connectedDistrictIds:
      corridorConnectivityRegistryStatus.connectedDistrictIds,
    connectivityReason:
      corridorConnectivityRegistryStatus.connectivityReason,
    movementPriority: corridorConnectivityRegistryStatus.movementPriority,
    parcelFrontageLotVersion:
      parcelFrontageLotRegistryStatus.parcelFrontageLotVersion,
    registeredParcelRuleCount:
      parcelFrontageLotRegistryStatus.registeredParcelRuleCount,
    parcelPatternId: parcelFrontageLotRegistryStatus.parcelPatternId,
    lotType: parcelFrontageLotRegistryStatus.lotType,
    frontageDirection: parcelFrontageLotRegistryStatus.frontageDirection,
    frontageRoadId: parcelFrontageLotRegistryStatus.frontageRoadId,
    setbackDistance: parcelFrontageLotRegistryStatus.setbackDistance,
    boundaryPattern: parcelFrontageLotRegistryStatus.boundaryPattern,
    streetscapeVersion: streetscapeRegistryStatus.streetscapeVersion,
    registeredStreetscapeRuleCount:
      streetscapeRegistryStatus.registeredStreetscapeRuleCount,
    streetscapeProfileId: streetscapeRegistryStatus.streetscapeProfileId,
    vergeType: streetscapeRegistryStatus.vergeType,
    edgeConditionType: streetscapeRegistryStatus.edgeConditionType,
    streetFurnitureProfile: streetscapeRegistryStatus.streetFurnitureProfile,
    streetscapeReason: streetscapeRegistryStatus.streetscapeReason,
    openSpaceLandmarkFramingVersion:
      openSpaceLandmarkFramingRegistryStatus.openSpaceLandmarkFramingVersion,
    registeredLandmarkFramingRuleCount:
      openSpaceLandmarkFramingRegistryStatus.registeredLandmarkFramingRuleCount,
    landmarkFramingRuleId:
      openSpaceLandmarkFramingRegistryStatus.landmarkFramingRuleId,
    foregroundType: openSpaceLandmarkFramingRegistryStatus.foregroundType,
    approachDirection: openSpaceLandmarkFramingRegistryStatus.approachDirection,
    openSpaceRatio: openSpaceLandmarkFramingRegistryStatus.openSpaceRatio,
    visibilityReason: openSpaceLandmarkFramingRegistryStatus.visibilityReason,
    biomeLocalCharacterVersion:
      biomeLocalCharacterRegistryStatus.biomeLocalCharacterVersion,
    registeredBiomeRuleCount:
      biomeLocalCharacterRegistryStatus.registeredBiomeRuleCount,
    biomeProfileId: biomeLocalCharacterRegistryStatus.biomeProfileId,
    localCharacterProfileId:
      biomeLocalCharacterRegistryStatus.localCharacterProfileId,
    blendWeights: biomeLocalCharacterRegistryStatus.blendWeights,
    characterReason: biomeLocalCharacterRegistryStatus.characterReason,
    regionalStyleSeed: biomeLocalCharacterRegistryStatus.regionalStyleSeed,
    seasonalEnvironmentVersion:
      seasonalEnvironmentRegistryStatus.seasonalEnvironmentVersion,
    registeredSeasonRuleCount:
      seasonalEnvironmentRegistryStatus.registeredSeasonRuleCount,
    seasonProfileId: seasonalEnvironmentRegistryStatus.seasonProfileId,
    environmentStateId: seasonalEnvironmentRegistryStatus.environmentStateId,
    seasonalBlendWeights:
      seasonalEnvironmentRegistryStatus.seasonalBlendWeights,
    environmentReason: seasonalEnvironmentRegistryStatus.environmentReason,
    seasonSeed: seasonalEnvironmentRegistryStatus.seasonSeed,
    settlementIdentityStyleCohesionVersion:
      settlementIdentityStyleCohesionRegistryStatus
        .settlementIdentityStyleCohesionVersion,
    registeredSettlementIdentityRuleCount:
      settlementIdentityStyleCohesionRegistryStatus
        .registeredSettlementIdentityRuleCount,
    settlementIdentityId:
      settlementIdentityStyleCohesionRegistryStatus.settlementIdentityId,
    styleProfileId:
      settlementIdentityStyleCohesionRegistryStatus.styleProfileId,
    paletteProfileId:
      settlementIdentityStyleCohesionRegistryStatus.paletteProfileId,
    architecturalInfluence:
      settlementIdentityStyleCohesionRegistryStatus.architecturalInfluence,
    cohesionReason:
      settlementIdentityStyleCohesionRegistryStatus.cohesionReason,
    assetFamilyMaterialCohesionVersion:
      assetFamilyMaterialCohesionRegistryStatus
        .assetFamilyMaterialCohesionVersion,
    registeredAssetFamilyRuleCount:
      assetFamilyMaterialCohesionRegistryStatus.registeredAssetFamilyRuleCount,
    assetFamilyId: assetFamilyMaterialCohesionRegistryStatus.assetFamilyId,
    materialFamilyId:
      assetFamilyMaterialCohesionRegistryStatus.materialFamilyId,
    styleCompatibilityReason:
      assetFamilyMaterialCohesionRegistryStatus.styleCompatibilityReason,
    assetSelectionSeed:
      assetFamilyMaterialCohesionRegistryStatus.assetSelectionSeed,
    modularAssetBindingVersion:
      modularAssetBindingRegistryStatus.modularAssetBindingVersion,
    registeredModularBindingRuleCount:
      modularAssetBindingRegistryStatus.registeredModularBindingRuleCount,
    selectedAssetId: modularAssetBindingRegistryStatus.selectedAssetId,
    assetVariantId: modularAssetBindingRegistryStatus.assetVariantId,
    variantSelectionReason:
      modularAssetBindingRegistryStatus.variantSelectionReason,
    materialAssignmentId:
      modularAssetBindingRegistryStatus.materialAssignmentId,
    lodProfileId: modularAssetBindingRegistryStatus.lodProfileId,
    microClusterAdjacencyVersion:
      microClusterAdjacencyRegistryStatus.microClusterAdjacencyVersion,
    registeredMicroClusterRuleCount:
      microClusterAdjacencyRegistryStatus.registeredMicroClusterRuleCount,
    microClusterId: microClusterAdjacencyRegistryStatus.microClusterId,
    clusterType: microClusterAdjacencyRegistryStatus.clusterType,
    childAssetCount: microClusterAdjacencyRegistryStatus.childAssetCount,
    adjacencyReason: microClusterAdjacencyRegistryStatus.adjacencyReason,
    variationSeed: microClusterAdjacencyRegistryStatus.variationSeed,
    supportingCompositionVersion:
      supportingCompositionRegistryStatus.supportingCompositionVersion,
    registeredSupportingCompositionRuleCount:
      supportingCompositionRegistryStatus
        .registeredSupportingCompositionRuleCount,
    supportingPropProfileId:
      supportingCompositionRegistryStatus.supportingPropProfileId,
    boundaryCompositionId:
      supportingCompositionRegistryStatus.boundaryCompositionId,
    entryCompositionId:
      supportingCompositionRegistryStatus.entryCompositionId,
    propDensityTier: supportingCompositionRegistryStatus.propDensityTier,
    compositionReason: supportingCompositionRegistryStatus.compositionReason,
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
      populationNeighborhoodPatternRuleRegistry,
      populationDistrictCompositionRuleRegistry,
      populationCorridorConnectivityRuleRegistry,
      populationParcelFrontageLotRuleRegistry,
      populationStreetscapeVergeEdgeRuleRegistry,
      populationOpenSpaceLandmarkFramingRuleRegistry,
      populationBiomeLocalCharacterRuleRegistry,
      populationSeasonalEnvironmentRuleRegistry,
      populationSettlementIdentityStyleCohesionRuleRegistry,
      populationAssetFamilyMaterialCohesionRuleRegistry,
      populationModularAssetBindingRuleRegistry,
      populationMicroClusterAdjacencyRuleRegistry,
      populationSupportingCompositionRuleRegistry,
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
  state.neighborhoodPatternId = null;
  state.patternCategory = null;
  state.patternSeed = null;
  state.generatedContextCount = 0;
  state.patternDecisionReason = null;
  state.districtId = null;
  state.districtType = null;
  state.settlementPatternId = null;
  state.districtTransitionReason = null;
  state.compositionSeed = null;
  state.corridorId = null;
  state.corridorType = null;
  state.connectedDistrictIds = [];
  state.connectivityReason = null;
  state.movementPriority = null;
  state.parcelPatternId = null;
  state.lotType = null;
  state.frontageDirection = null;
  state.frontageRoadId = null;
  state.setbackDistance = null;
  state.boundaryPattern = null;
  state.streetscapeProfileId = null;
  state.vergeType = null;
  state.edgeConditionType = null;
  state.streetFurnitureProfile = null;
  state.streetscapeReason = null;
  state.landmarkFramingRuleId = null;
  state.foregroundType = null;
  state.approachDirection = null;
  state.openSpaceRatio = null;
  state.visibilityReason = null;
  state.biomeProfileId = null;
  state.localCharacterProfileId = null;
  state.blendWeights = null;
  state.characterReason = null;
  state.regionalStyleSeed = null;
  state.seasonProfileId = null;
  state.environmentStateId = null;
  state.seasonalBlendWeights = null;
  state.environmentReason = null;
  state.seasonSeed = null;
  state.settlementIdentityId = null;
  state.styleProfileId = null;
  state.paletteProfileId = null;
  state.architecturalInfluence = null;
  state.cohesionReason = null;
  state.assetFamilyId = null;
  state.materialFamilyId = null;
  state.styleCompatibilityReason = null;
  state.assetSelectionSeed = null;
  state.selectedAssetId = null;
  state.assetVariantId = null;
  state.variantSelectionReason = null;
  state.materialAssignmentId = null;
  state.lodProfileId = null;
  state.microClusterId = null;
  state.clusterType = null;
  state.childAssetCount = 0;
  state.adjacencyReason = null;
  state.variationSeed = null;
  state.supportingPropProfileId = null;
  state.boundaryCompositionId = null;
  state.entryCompositionId = null;
  state.propDensityTier = null;
  state.compositionReason = null;
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
  const neighborhoodPatternDecisions = [];
  const districtCompositionDecisions = [];
  const corridorConnectivityDecisions = [];
  const parcelFrontageLotDecisions = [];
  const streetscapeDecisions = [];
  const openSpaceLandmarkFramingDecisions = [];
  const biomeLocalCharacterDecisions = [];
  const seasonalEnvironmentDecisions = [];
  const settlementIdentityStyleCohesionDecisions = [];
  const assetFamilyMaterialCohesionDecisions = [];
  const modularAssetBindingDecisions = [];
  const microClusterAdjacencyDecisions = [];
  const supportingCompositionDecisions = [];
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
    const neighborhoodPatternResolution =
      resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(
        internal.populationNeighborhoodPatternRuleRegistry,
        {
          feature,
          selectorSeed,
          worldFillCategory: contextualWorldFillResolution.worldFillCategory,
          contextualWorldFillResolution
        }
      );
    const districtCompositionResolution =
      resolveDeveloperOnlyAtlasPopulationDistrictComposition(
        internal.populationDistrictCompositionRuleRegistry,
        {
          feature,
          selectorSeed,
          worldFillCategory: contextualWorldFillResolution.worldFillCategory,
          neighborhoodPatternId:
            neighborhoodPatternResolution.neighborhoodPatternId,
          patternCategory: neighborhoodPatternResolution.patternCategory
        }
      );
    const corridorConnectivityResolution =
      resolveDeveloperOnlyAtlasPopulationCorridorConnectivity(
        internal.populationCorridorConnectivityRuleRegistry,
        {
          feature,
          selectorSeed,
          districtId: districtCompositionResolution.districtId,
          districtType: districtCompositionResolution.districtType,
          districtTransitionReason:
            districtCompositionResolution.districtTransitionReason,
          worldFillCategory: contextualWorldFillResolution.worldFillCategory,
          relationshipContext
        }
      );
    const parcelFrontageLotResolution =
      resolveDeveloperOnlyAtlasPopulationParcelFrontageLot(
        internal.populationParcelFrontageLotRuleRegistry,
        {
          feature,
          districtType: districtCompositionResolution.districtType,
          neighborhoodPatternId:
            neighborhoodPatternResolution.neighborhoodPatternId,
          corridorType: corridorConnectivityResolution.corridorType,
          relationshipDiagnostics: {
            ...relationshipResolution.featureDiagnostics,
            connectedDistrictIds:
              corridorConnectivityResolution.connectedDistrictIds
          },
          orientationHint: feature.orientationHint
        }
      );
    const streetscapeResolution =
      resolveDeveloperOnlyAtlasPopulationStreetscapeVergeEdge(
        internal.populationStreetscapeVergeEdgeRuleRegistry,
        {
          districtType: districtCompositionResolution.districtType,
          corridorType: corridorConnectivityResolution.corridorType,
          parcelPatternId: parcelFrontageLotResolution.parcelPatternId
        }
      );
    const openSpaceLandmarkFramingResolution =
      resolveDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFraming(
        internal.populationOpenSpaceLandmarkFramingRuleRegistry,
        {
          featureClass: feature.featureClass,
          sourceClassification: feature.sourceClassification,
          districtType: districtCompositionResolution.districtType,
          parcelPatternId: parcelFrontageLotResolution.parcelPatternId
        }
      );
    const biomeLocalCharacterResolution =
      resolveDeveloperOnlyAtlasPopulationBiomeLocalCharacter(
        internal.populationBiomeLocalCharacterRuleRegistry,
        {
          featureClass: feature.featureClass,
          sourceClassification: feature.sourceClassification,
          districtType: districtCompositionResolution.districtType,
          vergeType: streetscapeResolution.vergeType,
          foregroundType: openSpaceLandmarkFramingResolution.foregroundType,
          selectorSeed,
          deterministicFeatureIdentity: feature.deterministicFeatureIdentity
        }
      );
    const seasonalEnvironmentResolution =
      resolveDeveloperOnlyAtlasPopulationSeasonalEnvironment(
        internal.populationSeasonalEnvironmentRuleRegistry,
        {
          seasonKey: input.seasonKey,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          blendWeights: biomeLocalCharacterResolution.blendWeights,
          districtType: districtCompositionResolution.districtType,
          featureClass: feature.featureClass,
          selectorSeed,
          deterministicFeatureIdentity: feature.deterministicFeatureIdentity
        }
      );
    const settlementIdentityStyleCohesionResolution =
      resolveDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesion(
        internal.populationSettlementIdentityStyleCohesionRuleRegistry,
        {
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          localCharacterProfileId:
            biomeLocalCharacterResolution.localCharacterProfileId,
          districtType: districtCompositionResolution.districtType
        }
      );
    const assetFamilyMaterialCohesionResolution =
      resolveDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesion(
        internal.populationAssetFamilyMaterialCohesionRuleRegistry,
        {
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          localCharacterProfileId:
            biomeLocalCharacterResolution.localCharacterProfileId,
          featureClass: feature.featureClass,
          paletteProfileId:
            settlementIdentityStyleCohesionResolution.paletteProfileId
        }
      );
    const primaryModularAssetId =
      contextualWorldFillResolution.placements[0]?.assetId ??
      recipeResolution.assetCommands[0]?.assetId ??
      null;
    const modularAssetBindingResolution =
      assetFamilyMaterialCohesionResolution.matched && primaryModularAssetId
      ? resolveDeveloperOnlyAtlasPopulationModularAssetBinding(
          internal.populationModularAssetBindingRuleRegistry,
          {
            assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
            selectedAssetId: primaryModularAssetId,
            featureClass: feature.featureClass,
            materialFamilyId:
              assetFamilyMaterialCohesionResolution.materialFamilyId,
            paletteProfileId:
              settlementIdentityStyleCohesionResolution.paletteProfileId,
            selectorSeed,
            deterministicFeatureIdentity: feature.deterministicFeatureIdentity,
            coordinate: feature.coordinate,
            candidateIndex: 0,
            densityTier: distributionResolution.densityTier,
            districtType: districtCompositionResolution.districtType,
            lotType: parcelFrontageLotResolution.lotType
          }
        )
      : {
          matched: false,
          selectedAssetId: null,
          assetVariantId: null,
          variantSelectionReason: null,
          materialAssignmentId: null,
          lodProfileId: null
        };
    const microClusterAdjacencyResolution =
      modularAssetBindingResolution.matched
        ? resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency(
            internal.populationMicroClusterAdjacencyRuleRegistry,
            {
              featureClass: feature.featureClass,
              districtType: districtCompositionResolution.districtType,
              assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
              selectedAssetId: modularAssetBindingResolution.selectedAssetId,
              selectorSeed,
              deterministicFeatureIdentity:
                feature.deterministicFeatureIdentity,
              coordinate: feature.coordinate,
              candidateIndex: 0,
              budgetRemaining:
                budget.maximumCommands - state.acceptedPlacementCount
            }
          )
        : {
            matched: false,
            microClusterId: null,
            clusterType: null,
            childAssetCount: 0,
            adjacencyReason: null,
            variationSeed: null,
            childAssetIds: deepFreeze([])
          };
    const supportingCompositionResolution =
      microClusterAdjacencyResolution.matched
        ? resolveDeveloperOnlyAtlasPopulationSupportingComposition(
            internal.populationSupportingCompositionRuleRegistry,
            {
              districtType: districtCompositionResolution.districtType,
              clusterType: microClusterAdjacencyResolution.clusterType,
              featureClass: feature.featureClass
            }
          )
        : {
            matched: false,
            supportingPropProfileId: null,
            boundaryCompositionId: null,
            entryCompositionId: null,
            propDensityTier: null,
            compositionReason: null
          };

    state.distributionRuleId = distributionResolution.distributionRuleId;
    state.relationshipRuleId = relationshipResolution.relationshipRuleId;
    state.contextRuleId = contextualWorldFillResolution.contextRuleId;
    state.worldFillCategory = contextualWorldFillResolution.worldFillCategory;
    state.generatedSubRecipeCount +=
      contextualWorldFillResolution.generatedSubRecipeCount;
    state.childPlacementCount +=
      contextualWorldFillResolution.childPlacementCount;
    state.contextReason = contextualWorldFillResolution.contextReason;
    state.neighborhoodPatternId =
      neighborhoodPatternResolution.neighborhoodPatternId;
    state.patternCategory = neighborhoodPatternResolution.patternCategory;
    state.patternSeed = neighborhoodPatternResolution.patternSeed;
    state.generatedContextCount +=
      neighborhoodPatternResolution.generatedContextCount;
    state.patternDecisionReason =
      neighborhoodPatternResolution.patternDecisionReason;
    state.districtId = districtCompositionResolution.districtId;
    state.districtType = districtCompositionResolution.districtType;
    state.settlementPatternId =
      districtCompositionResolution.settlementPatternId;
    state.districtTransitionReason =
      districtCompositionResolution.districtTransitionReason;
    state.compositionSeed = districtCompositionResolution.compositionSeed;
    state.corridorId = corridorConnectivityResolution.corridorId;
    state.corridorType = corridorConnectivityResolution.corridorType;
    state.connectedDistrictIds =
      corridorConnectivityResolution.connectedDistrictIds;
    state.connectivityReason =
      corridorConnectivityResolution.connectivityReason;
    state.movementPriority = corridorConnectivityResolution.movementPriority;
    state.parcelPatternId = parcelFrontageLotResolution.parcelPatternId;
    state.lotType = parcelFrontageLotResolution.lotType;
    state.frontageDirection = parcelFrontageLotResolution.frontageDirection;
    state.frontageRoadId = parcelFrontageLotResolution.frontageRoadId;
    state.setbackDistance = parcelFrontageLotResolution.setbackDistance;
    state.boundaryPattern = parcelFrontageLotResolution.boundaryPattern;
    state.streetscapeProfileId = streetscapeResolution.streetscapeProfileId;
    state.vergeType = streetscapeResolution.vergeType;
    state.edgeConditionType = streetscapeResolution.edgeConditionType;
    state.streetFurnitureProfile =
      streetscapeResolution.streetFurnitureProfile;
    state.streetscapeReason = streetscapeResolution.streetscapeReason;
    state.landmarkFramingRuleId =
      openSpaceLandmarkFramingResolution.landmarkFramingRuleId;
    state.foregroundType = openSpaceLandmarkFramingResolution.foregroundType;
    state.approachDirection =
      openSpaceLandmarkFramingResolution.approachDirection;
    state.openSpaceRatio = openSpaceLandmarkFramingResolution.openSpaceRatio;
    state.visibilityReason = openSpaceLandmarkFramingResolution.visibilityReason;
    state.biomeProfileId = biomeLocalCharacterResolution.biomeProfileId;
    state.localCharacterProfileId =
      biomeLocalCharacterResolution.localCharacterProfileId;
    state.blendWeights = biomeLocalCharacterResolution.blendWeights;
    state.characterReason = biomeLocalCharacterResolution.characterReason;
    state.regionalStyleSeed = biomeLocalCharacterResolution.regionalStyleSeed;
    state.seasonProfileId = seasonalEnvironmentResolution.seasonProfileId;
    state.environmentStateId = seasonalEnvironmentResolution.environmentStateId;
    state.seasonalBlendWeights =
      seasonalEnvironmentResolution.seasonalBlendWeights;
    state.environmentReason = seasonalEnvironmentResolution.environmentReason;
    state.seasonSeed = seasonalEnvironmentResolution.seasonSeed;
    state.settlementIdentityId =
      settlementIdentityStyleCohesionResolution.settlementIdentityId;
    state.styleProfileId =
      settlementIdentityStyleCohesionResolution.styleProfileId;
    state.paletteProfileId =
      settlementIdentityStyleCohesionResolution.paletteProfileId;
    state.architecturalInfluence =
      settlementIdentityStyleCohesionResolution.architecturalInfluence;
    state.cohesionReason =
      settlementIdentityStyleCohesionResolution.cohesionReason;
    state.assetFamilyId = assetFamilyMaterialCohesionResolution.assetFamilyId;
    state.materialFamilyId =
      assetFamilyMaterialCohesionResolution.materialFamilyId;
    state.styleCompatibilityReason =
      assetFamilyMaterialCohesionResolution.styleCompatibilityReason;
    state.assetSelectionSeed =
      assetFamilyMaterialCohesionResolution.assetSelectionSeed;
    state.selectedAssetId = modularAssetBindingResolution.selectedAssetId;
    state.assetVariantId = modularAssetBindingResolution.assetVariantId;
    state.variantSelectionReason =
      modularAssetBindingResolution.variantSelectionReason;
    state.materialAssignmentId =
      modularAssetBindingResolution.materialAssignmentId;
    state.lodProfileId = modularAssetBindingResolution.lodProfileId;
    state.microClusterId = microClusterAdjacencyResolution.microClusterId;
    state.clusterType = microClusterAdjacencyResolution.clusterType;
    state.childAssetCount = microClusterAdjacencyResolution.childAssetCount;
    state.adjacencyReason = microClusterAdjacencyResolution.adjacencyReason;
    state.variationSeed = microClusterAdjacencyResolution.variationSeed;
    state.supportingPropProfileId =
      supportingCompositionResolution.supportingPropProfileId;
    state.boundaryCompositionId =
      supportingCompositionResolution.boundaryCompositionId;
    state.entryCompositionId =
      supportingCompositionResolution.entryCompositionId;
    state.propDensityTier = supportingCompositionResolution.propDensityTier;
    state.compositionReason = supportingCompositionResolution.compositionReason;
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
    neighborhoodPatternDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        neighborhoodPatternId:
          neighborhoodPatternResolution.neighborhoodPatternId,
        patternCategory: neighborhoodPatternResolution.patternCategory,
        patternSeed: neighborhoodPatternResolution.patternSeed,
        generatedContextCount:
          neighborhoodPatternResolution.generatedContextCount,
        patternDecisionReason:
          neighborhoodPatternResolution.patternDecisionReason
      })
    );
    districtCompositionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        districtId: districtCompositionResolution.districtId,
        districtType: districtCompositionResolution.districtType,
        settlementPatternId:
          districtCompositionResolution.settlementPatternId,
        districtTransitionReason:
          districtCompositionResolution.districtTransitionReason,
        compositionSeed: districtCompositionResolution.compositionSeed
      })
    );
    corridorConnectivityDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        corridorId: corridorConnectivityResolution.corridorId,
        corridorType: corridorConnectivityResolution.corridorType,
        connectedDistrictIds:
          corridorConnectivityResolution.connectedDistrictIds,
        connectivityReason:
          corridorConnectivityResolution.connectivityReason,
        movementPriority: corridorConnectivityResolution.movementPriority
      })
    );
    parcelFrontageLotDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        parcelPatternId: parcelFrontageLotResolution.parcelPatternId,
        lotType: parcelFrontageLotResolution.lotType,
        frontageDirection: parcelFrontageLotResolution.frontageDirection,
        frontageRoadId: parcelFrontageLotResolution.frontageRoadId,
        setbackDistance: parcelFrontageLotResolution.setbackDistance,
        boundaryPattern: parcelFrontageLotResolution.boundaryPattern
      })
    );
    streetscapeDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        streetscapeProfileId: streetscapeResolution.streetscapeProfileId,
        vergeType: streetscapeResolution.vergeType,
        edgeConditionType: streetscapeResolution.edgeConditionType,
        streetFurnitureProfile:
          streetscapeResolution.streetFurnitureProfile,
        streetscapeReason: streetscapeResolution.streetscapeReason
      })
    );
    openSpaceLandmarkFramingDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        landmarkFramingRuleId:
          openSpaceLandmarkFramingResolution.landmarkFramingRuleId,
        foregroundType: openSpaceLandmarkFramingResolution.foregroundType,
        approachDirection: openSpaceLandmarkFramingResolution.approachDirection,
        openSpaceRatio: openSpaceLandmarkFramingResolution.openSpaceRatio,
        visibilityReason: openSpaceLandmarkFramingResolution.visibilityReason
      })
    );
    biomeLocalCharacterDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
        localCharacterProfileId:
          biomeLocalCharacterResolution.localCharacterProfileId,
        blendWeights: biomeLocalCharacterResolution.blendWeights,
        characterReason: biomeLocalCharacterResolution.characterReason,
        regionalStyleSeed: biomeLocalCharacterResolution.regionalStyleSeed
      })
    );
    seasonalEnvironmentDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
        environmentStateId: seasonalEnvironmentResolution.environmentStateId,
        seasonalBlendWeights:
          seasonalEnvironmentResolution.seasonalBlendWeights,
        environmentReason: seasonalEnvironmentResolution.environmentReason,
        seasonSeed: seasonalEnvironmentResolution.seasonSeed
      })
    );
    settlementIdentityStyleCohesionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        settlementIdentityId:
          settlementIdentityStyleCohesionResolution.settlementIdentityId,
        styleProfileId:
          settlementIdentityStyleCohesionResolution.styleProfileId,
        paletteProfileId:
          settlementIdentityStyleCohesionResolution.paletteProfileId,
        architecturalInfluence:
          settlementIdentityStyleCohesionResolution.architecturalInfluence,
        cohesionReason:
          settlementIdentityStyleCohesionResolution.cohesionReason
      })
    );
    assetFamilyMaterialCohesionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
        materialFamilyId:
          assetFamilyMaterialCohesionResolution.materialFamilyId,
        paletteProfileId:
          assetFamilyMaterialCohesionResolution.paletteProfileId,
        styleCompatibilityReason:
          assetFamilyMaterialCohesionResolution.styleCompatibilityReason,
        assetSelectionSeed:
          assetFamilyMaterialCohesionResolution.assetSelectionSeed
      })
    );
    modularAssetBindingDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        selectedAssetId: modularAssetBindingResolution.selectedAssetId,
        assetVariantId: modularAssetBindingResolution.assetVariantId,
        variantSelectionReason:
          modularAssetBindingResolution.variantSelectionReason,
        materialAssignmentId:
          modularAssetBindingResolution.materialAssignmentId,
        lodProfileId: modularAssetBindingResolution.lodProfileId
      })
    );
    microClusterAdjacencyDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        microClusterId: microClusterAdjacencyResolution.microClusterId,
        clusterType: microClusterAdjacencyResolution.clusterType,
        childAssetCount: microClusterAdjacencyResolution.childAssetCount,
        adjacencyReason: microClusterAdjacencyResolution.adjacencyReason,
        variationSeed: microClusterAdjacencyResolution.variationSeed
      })
    );
    supportingCompositionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        supportingPropProfileId:
          supportingCompositionResolution.supportingPropProfileId,
        boundaryCompositionId:
          supportingCompositionResolution.boundaryCompositionId,
        entryCompositionId:
          supportingCompositionResolution.entryCompositionId,
        propDensityTier: supportingCompositionResolution.propDensityTier,
        compositionReason: supportingCompositionResolution.compositionReason
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
          neighborhoodPatternId:
            neighborhoodPatternResolution.neighborhoodPatternId,
          patternCategory: neighborhoodPatternResolution.patternCategory,
          patternSeed: neighborhoodPatternResolution.patternSeed,
          generatedContextCount:
            neighborhoodPatternResolution.generatedContextCount,
          patternDecisionReason:
            neighborhoodPatternResolution.patternDecisionReason,
          districtId: districtCompositionResolution.districtId,
          districtType: districtCompositionResolution.districtType,
          settlementPatternId:
            districtCompositionResolution.settlementPatternId,
          districtTransitionReason:
            districtCompositionResolution.districtTransitionReason,
          compositionSeed: districtCompositionResolution.compositionSeed,
          corridorId: corridorConnectivityResolution.corridorId,
          corridorType: corridorConnectivityResolution.corridorType,
          connectedDistrictIds:
            corridorConnectivityResolution.connectedDistrictIds,
          connectivityReason:
            corridorConnectivityResolution.connectivityReason,
          movementPriority:
            corridorConnectivityResolution.movementPriority,
          parcelPatternId: parcelFrontageLotResolution.parcelPatternId,
          lotType: parcelFrontageLotResolution.lotType,
          frontageDirection: parcelFrontageLotResolution.frontageDirection,
          frontageRoadId: parcelFrontageLotResolution.frontageRoadId,
          setbackDistance: parcelFrontageLotResolution.setbackDistance,
          boundaryPattern: parcelFrontageLotResolution.boundaryPattern,
          streetscapeProfileId: streetscapeResolution.streetscapeProfileId,
          vergeType: streetscapeResolution.vergeType,
          edgeConditionType: streetscapeResolution.edgeConditionType,
          streetFurnitureProfile:
            streetscapeResolution.streetFurnitureProfile,
          streetscapeReason: streetscapeResolution.streetscapeReason,
          landmarkFramingRuleId:
            openSpaceLandmarkFramingResolution.landmarkFramingRuleId,
          foregroundType: openSpaceLandmarkFramingResolution.foregroundType,
          approachDirection:
            openSpaceLandmarkFramingResolution.approachDirection,
          openSpaceRatio: openSpaceLandmarkFramingResolution.openSpaceRatio,
          visibilityReason: openSpaceLandmarkFramingResolution.visibilityReason,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          localCharacterProfileId:
            biomeLocalCharacterResolution.localCharacterProfileId,
          blendWeights: biomeLocalCharacterResolution.blendWeights,
          characterReason: biomeLocalCharacterResolution.characterReason,
          regionalStyleSeed: biomeLocalCharacterResolution.regionalStyleSeed,
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
          environmentStateId: seasonalEnvironmentResolution.environmentStateId,
          seasonalBlendWeights:
            seasonalEnvironmentResolution.seasonalBlendWeights,
          environmentReason: seasonalEnvironmentResolution.environmentReason,
          seasonSeed: seasonalEnvironmentResolution.seasonSeed,
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId,
          styleProfileId:
            settlementIdentityStyleCohesionResolution.styleProfileId,
          paletteProfileId:
            settlementIdentityStyleCohesionResolution.paletteProfileId,
          architecturalInfluence:
            settlementIdentityStyleCohesionResolution.architecturalInfluence,
          cohesionReason:
            settlementIdentityStyleCohesionResolution.cohesionReason,
          assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
          materialFamilyId:
            assetFamilyMaterialCohesionResolution.materialFamilyId,
          styleCompatibilityReason:
            assetFamilyMaterialCohesionResolution.styleCompatibilityReason,
          assetSelectionSeed:
            assetFamilyMaterialCohesionResolution.assetSelectionSeed,
          selectedAssetId: modularAssetBindingResolution.selectedAssetId,
          assetVariantId: modularAssetBindingResolution.assetVariantId,
          variantSelectionReason:
            modularAssetBindingResolution.variantSelectionReason,
          materialAssignmentId:
            modularAssetBindingResolution.materialAssignmentId,
          lodProfileId: modularAssetBindingResolution.lodProfileId,
          microClusterId: microClusterAdjacencyResolution.microClusterId,
          clusterType: microClusterAdjacencyResolution.clusterType,
          childAssetCount: microClusterAdjacencyResolution.childAssetCount,
          adjacencyReason: microClusterAdjacencyResolution.adjacencyReason,
          variationSeed: microClusterAdjacencyResolution.variationSeed,
          supportingPropProfileId:
            supportingCompositionResolution.supportingPropProfileId,
          boundaryCompositionId:
            supportingCompositionResolution.boundaryCompositionId,
          entryCompositionId:
            supportingCompositionResolution.entryCompositionId,
          propDensityTier: supportingCompositionResolution.propDensityTier,
          compositionReason: supportingCompositionResolution.compositionReason,
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
          neighborhoodPatternId:
            neighborhoodPatternResolution.neighborhoodPatternId,
          patternCategory: neighborhoodPatternResolution.patternCategory,
          patternSeed: neighborhoodPatternResolution.patternSeed,
          generatedContextCount:
            neighborhoodPatternResolution.generatedContextCount,
          patternDecisionReason:
            neighborhoodPatternResolution.patternDecisionReason,
          districtId: districtCompositionResolution.districtId,
          districtType: districtCompositionResolution.districtType,
          settlementPatternId:
            districtCompositionResolution.settlementPatternId,
          districtTransitionReason:
            districtCompositionResolution.districtTransitionReason,
          compositionSeed: districtCompositionResolution.compositionSeed,
          corridorId: corridorConnectivityResolution.corridorId,
          corridorType: corridorConnectivityResolution.corridorType,
          connectedDistrictIds:
            corridorConnectivityResolution.connectedDistrictIds,
          connectivityReason:
            corridorConnectivityResolution.connectivityReason,
          movementPriority:
            corridorConnectivityResolution.movementPriority,
          parcelPatternId: parcelFrontageLotResolution.parcelPatternId,
          lotType: parcelFrontageLotResolution.lotType,
          frontageDirection: parcelFrontageLotResolution.frontageDirection,
          frontageRoadId: parcelFrontageLotResolution.frontageRoadId,
          setbackDistance: parcelFrontageLotResolution.setbackDistance,
          boundaryPattern: parcelFrontageLotResolution.boundaryPattern,
          streetscapeProfileId: streetscapeResolution.streetscapeProfileId,
          vergeType: streetscapeResolution.vergeType,
          edgeConditionType: streetscapeResolution.edgeConditionType,
          streetFurnitureProfile:
            streetscapeResolution.streetFurnitureProfile,
          streetscapeReason: streetscapeResolution.streetscapeReason,
          landmarkFramingRuleId:
            openSpaceLandmarkFramingResolution.landmarkFramingRuleId,
          foregroundType: openSpaceLandmarkFramingResolution.foregroundType,
          approachDirection:
            openSpaceLandmarkFramingResolution.approachDirection,
          openSpaceRatio: openSpaceLandmarkFramingResolution.openSpaceRatio,
          visibilityReason: openSpaceLandmarkFramingResolution.visibilityReason,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          localCharacterProfileId:
            biomeLocalCharacterResolution.localCharacterProfileId,
          blendWeights: biomeLocalCharacterResolution.blendWeights,
          characterReason: biomeLocalCharacterResolution.characterReason,
          regionalStyleSeed: biomeLocalCharacterResolution.regionalStyleSeed,
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
          environmentStateId: seasonalEnvironmentResolution.environmentStateId,
          seasonalBlendWeights:
            seasonalEnvironmentResolution.seasonalBlendWeights,
          environmentReason: seasonalEnvironmentResolution.environmentReason,
          seasonSeed: seasonalEnvironmentResolution.seasonSeed,
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId,
          styleProfileId:
            settlementIdentityStyleCohesionResolution.styleProfileId,
          paletteProfileId:
            settlementIdentityStyleCohesionResolution.paletteProfileId,
          architecturalInfluence:
            settlementIdentityStyleCohesionResolution.architecturalInfluence,
          cohesionReason:
            settlementIdentityStyleCohesionResolution.cohesionReason,
          assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
          materialFamilyId:
            assetFamilyMaterialCohesionResolution.materialFamilyId,
          styleCompatibilityReason:
            assetFamilyMaterialCohesionResolution.styleCompatibilityReason,
          assetSelectionSeed:
            assetFamilyMaterialCohesionResolution.assetSelectionSeed,
          selectedAssetId: modularAssetBindingResolution.selectedAssetId,
          assetVariantId: modularAssetBindingResolution.assetVariantId,
          variantSelectionReason:
            modularAssetBindingResolution.variantSelectionReason,
          materialAssignmentId:
            modularAssetBindingResolution.materialAssignmentId,
          lodProfileId: modularAssetBindingResolution.lodProfileId,
          microClusterId: microClusterAdjacencyResolution.microClusterId,
          clusterType: microClusterAdjacencyResolution.clusterType,
          childAssetCount: microClusterAdjacencyResolution.childAssetCount,
          adjacencyReason: microClusterAdjacencyResolution.adjacencyReason,
          variationSeed: microClusterAdjacencyResolution.variationSeed,
          supportingPropProfileId:
            supportingCompositionResolution.supportingPropProfileId,
          boundaryCompositionId:
            supportingCompositionResolution.boundaryCompositionId,
          entryCompositionId:
            supportingCompositionResolution.entryCompositionId,
          propDensityTier: supportingCompositionResolution.propDensityTier,
          compositionReason: supportingCompositionResolution.compositionReason,
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
        neighborhoodPatternId:
          neighborhoodPatternResolution.neighborhoodPatternId,
        patternCategory: neighborhoodPatternResolution.patternCategory,
        patternSeed: neighborhoodPatternResolution.patternSeed,
        patternDecisionReason:
          neighborhoodPatternResolution.patternDecisionReason,
        districtId: districtCompositionResolution.districtId,
        districtType: districtCompositionResolution.districtType,
        settlementPatternId:
          districtCompositionResolution.settlementPatternId,
        districtTransitionReason:
          districtCompositionResolution.districtTransitionReason,
        compositionSeed: districtCompositionResolution.compositionSeed,
        corridorId: corridorConnectivityResolution.corridorId,
        corridorType: corridorConnectivityResolution.corridorType,
        connectedDistrictIds:
          corridorConnectivityResolution.connectedDistrictIds,
        connectivityReason:
          corridorConnectivityResolution.connectivityReason,
        movementPriority:
          corridorConnectivityResolution.movementPriority,
        parcelPatternId: parcelFrontageLotResolution.parcelPatternId,
        lotType: parcelFrontageLotResolution.lotType,
        frontageDirection: parcelFrontageLotResolution.frontageDirection,
        frontageRoadId: parcelFrontageLotResolution.frontageRoadId,
        setbackDistance: parcelFrontageLotResolution.setbackDistance,
        boundaryPattern: parcelFrontageLotResolution.boundaryPattern,
        streetscapeProfileId: streetscapeResolution.streetscapeProfileId,
        vergeType: streetscapeResolution.vergeType,
        edgeConditionType: streetscapeResolution.edgeConditionType,
        streetFurnitureProfile:
          streetscapeResolution.streetFurnitureProfile,
        streetscapeReason: streetscapeResolution.streetscapeReason,
        landmarkFramingRuleId:
          openSpaceLandmarkFramingResolution.landmarkFramingRuleId,
        foregroundType: openSpaceLandmarkFramingResolution.foregroundType,
        approachDirection:
          openSpaceLandmarkFramingResolution.approachDirection,
        openSpaceRatio: openSpaceLandmarkFramingResolution.openSpaceRatio,
        visibilityReason: openSpaceLandmarkFramingResolution.visibilityReason,
        biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
        localCharacterProfileId:
          biomeLocalCharacterResolution.localCharacterProfileId,
        blendWeights: biomeLocalCharacterResolution.blendWeights,
        characterReason: biomeLocalCharacterResolution.characterReason,
        regionalStyleSeed: biomeLocalCharacterResolution.regionalStyleSeed,
        seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
        environmentStateId: seasonalEnvironmentResolution.environmentStateId,
        seasonalBlendWeights:
          seasonalEnvironmentResolution.seasonalBlendWeights,
        environmentReason: seasonalEnvironmentResolution.environmentReason,
        seasonSeed: seasonalEnvironmentResolution.seasonSeed,
        settlementIdentityId:
          settlementIdentityStyleCohesionResolution.settlementIdentityId,
        styleProfileId:
          settlementIdentityStyleCohesionResolution.styleProfileId,
        paletteProfileId:
          settlementIdentityStyleCohesionResolution.paletteProfileId,
        architecturalInfluence:
          settlementIdentityStyleCohesionResolution.architecturalInfluence,
        cohesionReason:
          settlementIdentityStyleCohesionResolution.cohesionReason,
        assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
        materialFamilyId:
          assetFamilyMaterialCohesionResolution.materialFamilyId,
        styleCompatibilityReason:
          assetFamilyMaterialCohesionResolution.styleCompatibilityReason,
        assetSelectionSeed:
          assetFamilyMaterialCohesionResolution.assetSelectionSeed,
        selectedAssetId: null,
        assetVariantId: null,
        variantSelectionReason: null,
        materialAssignmentId: null,
        lodProfileId: null,
        microClusterId: null,
        clusterType: null,
        childAssetCount: 0,
        adjacencyReason: null,
        variationSeed: null,
        supportingPropProfileId: null,
        boundaryCompositionId: null,
        entryCompositionId: null,
        propDensityTier: null,
        compositionReason: null,
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
    const modularCandidateBindingResolution =
      candidate.assetFamilyId &&
      candidate.materialFamilyId &&
      candidate.assetId
        ? resolveDeveloperOnlyAtlasPopulationModularAssetBinding(
            internal.populationModularAssetBindingRuleRegistry,
            {
              assetFamilyId: candidate.assetFamilyId,
              selectedAssetId: candidate.assetId,
              featureClass: candidate.feature.featureClass,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId,
              selectorSeed,
              deterministicFeatureIdentity:
                candidate.feature.deterministicFeatureIdentity,
              coordinate: candidate.coordinate,
              candidateIndex: candidate.candidateIndex,
              densityTier: candidate.densityTier,
              districtType: candidate.districtType,
              lotType: candidate.lotType
            }
          )
        : {
            matched: false,
            selectedAssetId: null,
            assetVariantId: null,
            variantSelectionReason: null,
            materialAssignmentId: null,
            lodProfileId: null
          };
    const microClusterCandidateResolution =
      modularCandidateBindingResolution.matched
        ? resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency(
            internal.populationMicroClusterAdjacencyRuleRegistry,
            {
              featureClass: candidate.feature.featureClass,
              districtType: candidate.districtType,
              assetFamilyId: candidate.assetFamilyId,
              selectedAssetId: modularCandidateBindingResolution.selectedAssetId,
              selectorSeed,
              deterministicFeatureIdentity:
                candidate.feature.deterministicFeatureIdentity,
              coordinate: candidate.coordinate,
              candidateIndex: candidate.candidateIndex,
              budgetRemaining:
                budget.maximumCommands - acceptedPlacements.length
            }
          )
        : {
            matched: false,
            microClusterId: null,
            clusterType: null,
            childAssetCount: 0,
            adjacencyReason: null,
            variationSeed: null,
            childAssetIds: deepFreeze([])
          };
    const supportingCompositionCandidateResolution =
      microClusterCandidateResolution.matched
        ? resolveDeveloperOnlyAtlasPopulationSupportingComposition(
            internal.populationSupportingCompositionRuleRegistry,
            {
              districtType: candidate.districtType,
              clusterType: microClusterCandidateResolution.clusterType,
              featureClass: candidate.feature.featureClass
            }
          )
        : {
            matched: false,
            supportingPropProfileId: null,
            boundaryCompositionId: null,
            entryCompositionId: null,
            propDensityTier: null,
            compositionReason: null
          };

    if (modularCandidateBindingResolution.matched) {
      state.selectedAssetId = modularCandidateBindingResolution.selectedAssetId;
      state.assetVariantId = modularCandidateBindingResolution.assetVariantId;
      state.variantSelectionReason =
        modularCandidateBindingResolution.variantSelectionReason;
      state.materialAssignmentId =
        modularCandidateBindingResolution.materialAssignmentId;
      state.lodProfileId = modularCandidateBindingResolution.lodProfileId;
      state.microClusterId = microClusterCandidateResolution.microClusterId;
      state.clusterType = microClusterCandidateResolution.clusterType;
      state.childAssetCount = microClusterCandidateResolution.childAssetCount;
      state.adjacencyReason = microClusterCandidateResolution.adjacencyReason;
      state.variationSeed = microClusterCandidateResolution.variationSeed;
      state.supportingPropProfileId =
        supportingCompositionCandidateResolution.supportingPropProfileId;
      state.boundaryCompositionId =
        supportingCompositionCandidateResolution.boundaryCompositionId;
      state.entryCompositionId =
        supportingCompositionCandidateResolution.entryCompositionId;
      state.propDensityTier =
        supportingCompositionCandidateResolution.propDensityTier;
      state.compositionReason =
        supportingCompositionCandidateResolution.compositionReason;
    }

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
        neighborhoodPatternId: candidate.neighborhoodPatternId,
        patternCategory: candidate.patternCategory,
        patternSeed: candidate.patternSeed,
        patternDecisionReason: candidate.patternDecisionReason,
        districtId: candidate.districtId,
        districtType: candidate.districtType,
        settlementPatternId: candidate.settlementPatternId,
        districtTransitionReason: candidate.districtTransitionReason,
        compositionSeed: candidate.compositionSeed,
        corridorId: candidate.corridorId,
        corridorType: candidate.corridorType,
        connectedDistrictIds: candidate.connectedDistrictIds,
        connectivityReason: candidate.connectivityReason,
        movementPriority: candidate.movementPriority,
        parcelPatternId: candidate.parcelPatternId,
        lotType: candidate.lotType,
        frontageDirection: candidate.frontageDirection,
        frontageRoadId: candidate.frontageRoadId,
        setbackDistance: candidate.setbackDistance,
        boundaryPattern: candidate.boundaryPattern,
        streetscapeProfileId: candidate.streetscapeProfileId,
        vergeType: candidate.vergeType,
        edgeConditionType: candidate.edgeConditionType,
        streetFurnitureProfile: candidate.streetFurnitureProfile,
        streetscapeReason: candidate.streetscapeReason,
        landmarkFramingRuleId: candidate.landmarkFramingRuleId,
        foregroundType: candidate.foregroundType,
        approachDirection: candidate.approachDirection,
        openSpaceRatio: candidate.openSpaceRatio,
        visibilityReason: candidate.visibilityReason,
        biomeProfileId: candidate.biomeProfileId,
        localCharacterProfileId: candidate.localCharacterProfileId,
        blendWeights: candidate.blendWeights,
        characterReason: candidate.characterReason,
        regionalStyleSeed: candidate.regionalStyleSeed,
        seasonProfileId: candidate.seasonProfileId,
        environmentStateId: candidate.environmentStateId,
        seasonalBlendWeights: candidate.seasonalBlendWeights,
        environmentReason: candidate.environmentReason,
        seasonSeed: candidate.seasonSeed,
        settlementIdentityId: candidate.settlementIdentityId,
        styleProfileId: candidate.styleProfileId,
        paletteProfileId: candidate.paletteProfileId,
        architecturalInfluence: candidate.architecturalInfluence,
        cohesionReason: candidate.cohesionReason,
        assetFamilyId: candidate.assetFamilyId,
        materialFamilyId: candidate.materialFamilyId,
        styleCompatibilityReason: candidate.styleCompatibilityReason,
        assetSelectionSeed: candidate.assetSelectionSeed,
        selectedAssetId: modularCandidateBindingResolution.selectedAssetId,
        assetVariantId: modularCandidateBindingResolution.assetVariantId,
        variantSelectionReason:
          modularCandidateBindingResolution.variantSelectionReason,
        materialAssignmentId:
          modularCandidateBindingResolution.materialAssignmentId,
        lodProfileId: modularCandidateBindingResolution.lodProfileId,
        microClusterId: microClusterCandidateResolution.microClusterId,
        clusterType: microClusterCandidateResolution.clusterType,
        childAssetCount: microClusterCandidateResolution.childAssetCount,
        adjacencyReason: microClusterCandidateResolution.adjacencyReason,
        variationSeed: microClusterCandidateResolution.variationSeed,
        supportingPropProfileId:
          supportingCompositionCandidateResolution.supportingPropProfileId,
        boundaryCompositionId:
          supportingCompositionCandidateResolution.boundaryCompositionId,
        entryCompositionId:
          supportingCompositionCandidateResolution.entryCompositionId,
        propDensityTier: supportingCompositionCandidateResolution.propDensityTier,
        compositionReason:
          supportingCompositionCandidateResolution.compositionReason,
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
    neighborhoodPatternDecisions: deepFreeze(neighborhoodPatternDecisions),
    districtCompositionDecisions: deepFreeze(districtCompositionDecisions),
    corridorConnectivityDecisions: deepFreeze(corridorConnectivityDecisions),
    parcelFrontageLotDecisions: deepFreeze(parcelFrontageLotDecisions),
    streetscapeDecisions: deepFreeze(streetscapeDecisions),
    openSpaceLandmarkFramingDecisions: deepFreeze(
      openSpaceLandmarkFramingDecisions
    ),
    biomeLocalCharacterDecisions: deepFreeze(biomeLocalCharacterDecisions),
    seasonalEnvironmentDecisions: deepFreeze(seasonalEnvironmentDecisions),
    settlementIdentityStyleCohesionDecisions: deepFreeze(
      settlementIdentityStyleCohesionDecisions
    ),
    assetFamilyMaterialCohesionDecisions: deepFreeze(
      assetFamilyMaterialCohesionDecisions
    ),
    modularAssetBindingDecisions: deepFreeze(modularAssetBindingDecisions),
    microClusterAdjacencyDecisions: deepFreeze(microClusterAdjacencyDecisions),
    supportingCompositionDecisions: deepFreeze(supportingCompositionDecisions),
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
      neighborhoodPatternVersion: null,
      registeredNeighborhoodPatternCount: 0,
      neighborhoodPatternId: null,
      patternCategory: null,
      patternSeed: null,
      generatedContextCount: 0,
      patternDecisionReason: null,
      districtCompositionVersion: null,
      registeredDistrictRuleCount: 0,
      districtId: null,
      districtType: null,
      settlementPatternId: null,
      districtTransitionReason: null,
      compositionSeed: null,
      corridorConnectivityVersion: null,
      registeredCorridorRuleCount: 0,
      corridorId: null,
      corridorType: null,
      connectedDistrictIds: [],
      connectivityReason: null,
      movementPriority: null,
      parcelFrontageLotVersion: null,
      registeredParcelRuleCount: 0,
      parcelPatternId: null,
      lotType: null,
      frontageDirection: null,
      frontageRoadId: null,
      setbackDistance: null,
      boundaryPattern: null,
      streetscapeVersion: null,
      registeredStreetscapeRuleCount: 0,
      streetscapeProfileId: null,
      vergeType: null,
      edgeConditionType: null,
      streetFurnitureProfile: null,
      streetscapeReason: null,
      openSpaceLandmarkFramingVersion: null,
      registeredLandmarkFramingRuleCount: 0,
      landmarkFramingRuleId: null,
      foregroundType: null,
      approachDirection: null,
      openSpaceRatio: null,
      visibilityReason: null,
      biomeLocalCharacterVersion: null,
      registeredBiomeRuleCount: 0,
      biomeProfileId: null,
      localCharacterProfileId: null,
      blendWeights: {},
      characterReason: null,
      regionalStyleSeed: null,
      seasonalEnvironmentVersion: null,
      registeredSeasonRuleCount: 0,
      seasonProfileId: null,
      environmentStateId: null,
      seasonalBlendWeights: {},
      environmentReason: null,
      seasonSeed: null,
      settlementIdentityStyleCohesionVersion: null,
      registeredSettlementIdentityRuleCount: 0,
      settlementIdentityId: null,
      styleProfileId: null,
      paletteProfileId: null,
      architecturalInfluence: null,
      cohesionReason: null,
      assetFamilyMaterialCohesionVersion: null,
      registeredAssetFamilyRuleCount: 0,
      assetFamilyId: null,
      materialFamilyId: null,
      styleCompatibilityReason: null,
      assetSelectionSeed: null,
      modularAssetBindingVersion: null,
      registeredModularBindingRuleCount: 0,
      selectedAssetId: null,
      assetVariantId: null,
      variantSelectionReason: null,
      materialAssignmentId: null,
      lodProfileId: null,
      microClusterAdjacencyVersion: null,
      registeredMicroClusterRuleCount: 0,
      microClusterId: null,
      clusterType: null,
      childAssetCount: 0,
      adjacencyReason: null,
      variationSeed: null,
      supportingCompositionVersion: null,
      registeredSupportingCompositionRuleCount: 0,
      supportingPropProfileId: null,
      boundaryCompositionId: null,
      entryCompositionId: null,
      propDensityTier: null,
      compositionReason: null,
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
