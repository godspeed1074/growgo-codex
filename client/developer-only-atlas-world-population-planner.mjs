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
import {
  createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry,
  getDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent
} from "./developer-only-atlas-population-special-site-accent-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry,
  getDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming
} from "./developer-only-atlas-population-view-corridor-destination-framing-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry,
  getDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance
} from "./developer-only-atlas-population-route-memory-wayfinding-guidance-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks
} from "./developer-only-atlas-population-place-memory-narrative-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks
} from "./developer-only-atlas-population-seasonal-story-memory-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks
} from "./developer-only-atlas-population-activity-social-rhythm-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks
} from "./developer-only-atlas-population-civic-routine-gathering-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks
} from "./developer-only-atlas-population-local-economy-service-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks
} from "./developer-only-atlas-population-local-mobility-access-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks
} from "./developer-only-atlas-population-place-liveness-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks
} from "./developer-only-atlas-population-weekly-routine-recurrence-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks
} from "./developer-only-atlas-population-tradition-event-cycle-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks
} from "./developer-only-atlas-population-festival-quest-narrative-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks
} from "./developer-only-atlas-population-exploration-progression-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks
} from "./developer-only-atlas-population-regional-expedition-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks
} from "./developer-only-atlas-population-world-exploration-cohesion-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks
} from "./developer-only-atlas-population-signature-route-legacy-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks
} from "./developer-only-atlas-population-world-wonder-discovery-memory-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks
} from "./developer-only-atlas-population-world-legacy-discovery-cohesion-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasAssetWorldValidationFoundation,
  getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus,
  resolveDeveloperOnlyAtlasAssetWorldValidationFoundation
} from "./developer-only-atlas-asset-world-validation-foundation.mjs";
import {
  createDeveloperOnlyAtlasAssetCompatibilityWorldPackages,
  getDeveloperOnlyAtlasAssetCompatibilityWorldPackagesStatus,
  resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage
} from "./developer-only-atlas-asset-compatibility-world-packages.mjs";
import {
  createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles,
  getDeveloperOnlyAtlasAssetBiomeSettlementPackageProfilesStatus,
  resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile
} from "./developer-only-atlas-asset-biome-settlement-package-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldThemeStyleBundles,
  getDeveloperOnlyAtlasWorldThemeStyleBundlesStatus,
  resolveDeveloperOnlyAtlasWorldThemeStyleBundle
} from "./developer-only-atlas-world-theme-style-bundles.mjs";
import {
  createDeveloperOnlyAtlasThemeSubprofileRules,
  getDeveloperOnlyAtlasThemeSubprofileRulesStatus,
  resolveDeveloperOnlyAtlasThemeSubprofile
} from "./developer-only-atlas-theme-subprofile-rules.mjs";
import {
  createDeveloperOnlyAtlasModularBibleStyleBridge,
  getDeveloperOnlyAtlasModularBibleStyleBridgeStatus,
  resolveDeveloperOnlyAtlasModularBibleStyleBridge
} from "./developer-only-atlas-modular-bible-style-bridge.mjs";
import {
  createDeveloperOnlyAtlasComponentAssemblyRuleProfiles,
  getDeveloperOnlyAtlasComponentAssemblyRuleProfilesStatus,
  resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile
} from "./developer-only-atlas-component-assembly-rule-profiles.mjs";
import {
  createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles,
  getDeveloperOnlyAtlasVariantStructuralCompatibilityProfilesStatus,
  resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile
} from "./developer-only-atlas-variant-structural-compatibility-profiles.mjs";
import {
  createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles,
  getDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfilesStatus,
  resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile
} from "./developer-only-atlas-material-palette-finish-compatibility-profiles.mjs";
import {
  createDeveloperOnlyAtlasMaterialThemeBundles,
  getDeveloperOnlyAtlasMaterialThemeBundlesStatus,
  resolveDeveloperOnlyAtlasMaterialThemeBundle
} from "./developer-only-atlas-material-theme-bundles.mjs";
import {
  createDeveloperOnlyAtlasMaterialSlotResolution,
  getDeveloperOnlyAtlasMaterialSlotResolutionStatus,
  resolveDeveloperOnlyAtlasMaterialSlotSet
} from "./developer-only-atlas-material-slot-resolution.mjs";
import {
  createDeveloperOnlyAtlasComponentSurfaceMapping,
  getDeveloperOnlyAtlasComponentSurfaceMappingStatus,
  resolveDeveloperOnlyAtlasComponentSurfaceMapping
} from "./developer-only-atlas-component-surface-mapping.mjs";
import {
  createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation,
  getDeveloperOnlyAtlasAttachmentMetadataGlbPreparationStatus,
  resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation
} from "./developer-only-atlas-attachment-metadata-glb-preparation.mjs";

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

function deriveAtlasAssetValidationPlacementIntent(assetFamilyId) {
  switch (sanitizeString(assetFamilyId)) {
    case "ASSET_FAMILY_VEGETATION_COASTAL_001":
      return "vegetation_coastal_cluster";
    case "ASSET_FAMILY_CIVIC_HERITAGE_001":
      return "civic_landmark_anchor";
    case "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001":
      return "residential_placeholder_mass";
    case "ASSET_FAMILY_COMMERCIAL_URBAN_001":
      return "commercial_frontage_anchor";
    default:
      return null;
  }
}

function deriveAtlasWorldPackageCategory({ assetFamilyId, featureClass }) {
  switch (sanitizeString(assetFamilyId)) {
    case "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001":
      return "residential";
    case "ASSET_FAMILY_COMMERCIAL_URBAN_001":
      return "commercial";
    case "ASSET_FAMILY_CIVIC_HERITAGE_001":
      return "civic";
    case "ASSET_FAMILY_VEGETATION_COASTAL_001":
      return sanitizeString(featureClass) === "park" ? "park" : "coastal";
    default:
      return null;
  }
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
    specialSiteAccentVersion: state.specialSiteAccentVersion,
    registeredSpecialSiteAccentRuleCount:
      state.registeredSpecialSiteAccentRuleCount,
    specialSiteType: state.specialSiteType,
    landmarkAccentProfileId: state.landmarkAccentProfileId,
    cornerLotAccentId: state.cornerLotAccentId,
    visibilityPriority: state.visibilityPriority,
    specialSiteReason: state.specialSiteReason,
    destinationFramingVersion: state.destinationFramingVersion,
    registeredDestinationFramingRuleCount:
      state.registeredDestinationFramingRuleCount,
    viewCorridorId: state.viewCorridorId,
    approachSequenceId: state.approachSequenceId,
    destinationFrameProfileId: state.destinationFrameProfileId,
    arrivalReason: state.arrivalReason,
    routeGuidanceVersion: state.routeGuidanceVersion,
    registeredRouteGuidanceRuleCount: state.registeredRouteGuidanceRuleCount,
    routeMemoryId: state.routeMemoryId,
    wayfindingProfileId: state.wayfindingProfileId,
    explorationRouteType: state.explorationRouteType,
    guidanceReason: state.guidanceReason,
    routePriority: state.routePriority,
    placeMemoryVersion: state.placeMemoryVersion,
    registeredPlaceMemoryRuleCount: state.registeredPlaceMemoryRuleCount,
    placeMemoryId: state.placeMemoryId,
    storyCategory: state.storyCategory,
    localNarrativeProfileId: state.localNarrativeProfileId,
    discoveryImportance: state.discoveryImportance,
    storyReason: state.storyReason,
    seasonalStoryMemoryVersion: state.seasonalStoryMemoryVersion,
    registeredSeasonalStoryMemoryRuleCount:
      state.registeredSeasonalStoryMemoryRuleCount,
    memoryStateId: state.memoryStateId,
    seasonalStoryProfileId: state.seasonalStoryProfileId,
    eventHookProfileId: state.eventHookProfileId,
    returnVisitCategory: state.returnVisitCategory,
    storyEvolutionReason: state.storyEvolutionReason,
    activitySocialRhythmVersion: state.activitySocialRhythmVersion,
    registeredActivitySocialRhythmRuleCount:
      state.registeredActivitySocialRhythmRuleCount,
    activityProfileId: state.activityProfileId,
    socialRhythmId: state.socialRhythmId,
    timeContextProfile: state.timeContextProfile,
    activityReason: state.activityReason,
    communityImportance: state.communityImportance,
    civicRoutineGatheringVersion: state.civicRoutineGatheringVersion,
    registeredCivicRoutineRuleCount: state.registeredCivicRoutineRuleCount,
    civicRoutineProfileId: state.civicRoutineProfileId,
    gatheringPatternId: state.gatheringPatternId,
    temporalUseProfile: state.temporalUseProfile,
    communityRole: state.communityRole,
    routineReason: state.routineReason,
    localEconomyServiceVersion: state.localEconomyServiceVersion,
    registeredLocalEconomyServiceRuleCount:
      state.registeredLocalEconomyServiceRuleCount,
    serviceRoleId: state.serviceRoleId,
    economyProfileId: state.economyProfileId,
    marketCycleProfileId: state.marketCycleProfileId,
    serviceImportance: state.serviceImportance,
    economyReason: state.economyReason,
    localMobilityAccessVersion: state.localMobilityAccessVersion,
    registeredLocalMobilityAccessRuleCount:
      state.registeredLocalMobilityAccessRuleCount,
    mobilityProfileId: state.mobilityProfileId,
    accessPatternId: state.accessPatternId,
    flowPriority: state.flowPriority,
    movementReason: state.movementReason,
    accessibilityProfile: state.accessibilityProfile,
    placeLivenessVersion: state.placeLivenessVersion,
    registeredPlaceLivenessRuleCount: state.registeredPlaceLivenessRuleCount,
    occupancyProfileId: state.occupancyProfileId,
    timePresenceProfile: state.timePresenceProfile,
    livenessCategory: state.livenessCategory,
    peakActivityWindow: state.peakActivityWindow,
    presenceReason: state.presenceReason,
    weeklyRoutineRecurrenceVersion: state.weeklyRoutineRecurrenceVersion,
    registeredWeeklyRoutineRuleCount: state.registeredWeeklyRoutineRuleCount,
    weeklyRoutineProfileId: state.weeklyRoutineProfileId,
    recurrencePatternId: state.recurrencePatternId,
    communityCadenceId: state.communityCadenceId,
    eventFrequency: state.eventFrequency,
    recurrenceReason: state.recurrenceReason,
    traditionEventCycleVersion: state.traditionEventCycleVersion,
    registeredTraditionRuleCount: state.registeredTraditionRuleCount,
    traditionProfileId: state.traditionProfileId,
    seasonalEventCycleId: state.seasonalEventCycleId,
    communityTraditionId: state.communityTraditionId,
    eventImportance: state.eventImportance,
    traditionReason: state.traditionReason,
    festivalQuestNarrativeVersion: state.festivalQuestNarrativeVersion,
    registeredNarrativeRuleCount: state.registeredNarrativeRuleCount,
    festivalProfileId: state.festivalProfileId,
    questNarrativeProfileId: state.questNarrativeProfileId,
    seasonalDestinationProfileId: state.seasonalDestinationProfileId,
    achievementHookProfileId: state.achievementHookProfileId,
    narrativeReason: state.narrativeReason,
    explorationProgressionVersion: state.explorationProgressionVersion,
    registeredExplorationRuleCount: state.registeredExplorationRuleCount,
    campaignProfileId: state.campaignProfileId,
    destinationChainId: state.destinationChainId,
    rewardArcProfileId: state.rewardArcProfileId,
    progressionTier: state.progressionTier,
    explorationReason: state.explorationReason,
    regionalExpeditionVersion: state.regionalExpeditionVersion,
    registeredExpeditionRuleCount: state.registeredExpeditionRuleCount,
    expeditionProfileId: state.expeditionProfileId,
    campaignNetworkId: state.campaignNetworkId,
    completionArcId: state.completionArcId,
    regionalIdentityId: state.regionalIdentityId,
    expeditionReason: state.expeditionReason,
    worldExplorationCohesionVersion: state.worldExplorationCohesionVersion,
    registeredWorldExplorationRuleCount:
      state.registeredWorldExplorationRuleCount,
    worldJourneyProfileId: state.worldJourneyProfileId,
    metaCollectionId: state.metaCollectionId,
    crossRegionCampaignId: state.crossRegionCampaignId,
    explorationTier: state.explorationTier,
    worldCohesionReason: state.worldCohesionReason,
    signatureRouteLegacyVersion: state.signatureRouteLegacyVersion,
    registeredSignatureRouteLegacyRuleCount:
      state.registeredSignatureRouteLegacyRuleCount,
    signatureRouteProfileId: state.signatureRouteProfileId,
    legacyDestinationId: state.legacyDestinationId,
    mythologyProfileId: state.mythologyProfileId,
    globalJourneyTier: state.globalJourneyTier,
    legacyReason: state.legacyReason,
    worldWonderDiscoveryMemoryVersion: state.worldWonderDiscoveryMemoryVersion,
    registeredWorldWonderRuleCount: state.registeredWorldWonderRuleCount,
    worldWonderProfileId: state.worldWonderProfileId,
    epicDestinationId: state.epicDestinationId,
    discoveryMemoryTier: state.discoveryMemoryTier,
    generationMemoryProfileId: state.generationMemoryProfileId,
    wonderReason: state.wonderReason,
    worldLegacyDiscoveryCohesionVersion:
      state.worldLegacyDiscoveryCohesionVersion,
    registeredWorldLegacyRuleCount: state.registeredWorldLegacyRuleCount,
    worldLegacyProfileId: state.worldLegacyProfileId,
    discoveryCohesionId: state.discoveryCohesionId,
    legacyTier: state.legacyTier,
    memoryCategory: state.memoryCategory,
    legacyReason: state.legacyReason,
    atlasAssetWorldValidationVersion:
      state.atlasAssetWorldValidationVersion,
    registeredAtlasAssetValidationRuleCount:
      state.registeredAtlasAssetValidationRuleCount,
    atlasAssetPackageId: state.atlasAssetPackageId,
    assetValidationStatus: state.assetValidationStatus,
    bindingValidationReason: state.bindingValidationReason,
    placementValidationStatus: state.placementValidationStatus,
    rendererHandoffReadiness: state.rendererHandoffReadiness,
    atlasAssetCompatibilityWorldPackagesVersion:
      state.atlasAssetCompatibilityWorldPackagesVersion,
    registeredWorldPackageRuleCount: state.registeredWorldPackageRuleCount,
    worldPackageId: state.worldPackageId,
    packageValidationStatus: state.packageValidationStatus,
    compatibleAssetCount: state.compatibleAssetCount,
    blockedAssetCount: state.blockedAssetCount,
    packageReason: state.packageReason,
    atlasAssetBiomeSettlementPackageProfilesVersion:
      state.atlasAssetBiomeSettlementPackageProfilesVersion,
    registeredPackageProfileRuleCount:
      state.registeredPackageProfileRuleCount,
    settlementPackageProfileId: state.settlementPackageProfileId,
    biomePackageProfileId: state.biomePackageProfileId,
    resolvedWorldPackageId: state.resolvedWorldPackageId,
    profileCompatibilityStatus: state.profileCompatibilityStatus,
    packageSelectionReason: state.packageSelectionReason,
    atlasWorldThemeStyleBundlesVersion:
      state.atlasWorldThemeStyleBundlesVersion,
    registeredThemeBundleRuleCount: state.registeredThemeBundleRuleCount,
    worldThemeProfileId: state.worldThemeProfileId,
    regionalStyleBundleId: state.regionalStyleBundleId,
    visualCohesionScore: state.visualCohesionScore,
    themeCompatibilityStatus: state.themeCompatibilityStatus,
    themeSelectionReason: state.themeSelectionReason,
    atlasThemeSubprofileRulesVersion: state.atlasThemeSubprofileRulesVersion,
    registeredThemeSubprofileRuleCount:
      state.registeredThemeSubprofileRuleCount,
    architectureStyleProfileId: state.architectureStyleProfileId,
    vegetationStyleProfileId: state.vegetationStyleProfileId,
    streetscapeStyleProfileId: state.streetscapeStyleProfileId,
    themeSubprofileCompatibility: state.themeSubprofileCompatibility,
    styleSubprofileReason: state.styleSubprofileReason,
    atlasModularBibleStyleBridgeVersion:
      state.atlasModularBibleStyleBridgeVersion,
    registeredStyleBridgeRuleCount: state.registeredStyleBridgeRuleCount,
    modularBibleFamilyId: state.modularBibleFamilyId,
    componentRecipeId: state.componentRecipeId,
    assetAssemblyProfileId: state.assetAssemblyProfileId,
    styleBridgeStatus: state.styleBridgeStatus,
    bridgeReason: state.bridgeReason,
    componentCompatibilityStatus: state.componentCompatibilityStatus,
    assemblyRuleProfileId: state.assemblyRuleProfileId,
    requiredComponentCount: state.requiredComponentCount,
    validatedComponentCount: state.validatedComponentCount,
    assemblyReason: state.assemblyReason,
    assetVariantEnvelopeId: state.assetVariantEnvelopeId,
    structuralCompatibilityStatus: state.structuralCompatibilityStatus,
    selectedVariantProfileId: state.selectedVariantProfileId,
    variantConstraintReason: state.variantConstraintReason,
    variantSelectionSeed: state.variantSelectionSeed,
    materialCompatibilityStatus: state.materialCompatibilityStatus,
    paletteCompatibilityStatus: state.paletteCompatibilityStatus,
    finishProfileId: state.finishProfileId,
    resolvedMaterialProfileId: state.resolvedMaterialProfileId,
    materialReason: state.materialReason,
    materialThemeBundleId: state.materialThemeBundleId,
    resolvedFinishSetId: state.resolvedFinishSetId,
    resolvedPaletteSetId: state.resolvedPaletteSetId,
    materialBundleCompatibilityStatus:
      state.materialBundleCompatibilityStatus,
    materialBundleReason: state.materialBundleReason,
    materialSlotSetId: state.materialSlotSetId,
    resolvedSlotCount: state.resolvedSlotCount,
    assignedMaterialCount: state.assignedMaterialCount,
    slotCompatibilityStatus: state.slotCompatibilityStatus,
    slotResolutionReason: state.slotResolutionReason,
    surfaceMappingProfileId: state.surfaceMappingProfileId,
    componentAnchorSetId: state.componentAnchorSetId,
    resolvedAnchorCount: state.resolvedAnchorCount,
    mappedComponentCount: state.mappedComponentCount,
    surfaceMappingReason: state.surfaceMappingReason,
    atlasAttachmentMetadataGlbPreparationVersion:
      state.atlasAttachmentMetadataGlbPreparationVersion,
    registeredAttachmentMetadataRuleCount:
      state.registeredAttachmentMetadataRuleCount,
    attachmentMetadataProfileId: state.attachmentMetadataProfileId,
    glbPreparationProfileId: state.glbPreparationProfileId,
    socketMetadataCount: state.socketMetadataCount,
    componentMetadataCount: state.componentMetadataCount,
    attachmentMetadataReason: state.attachmentMetadataReason,
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
    createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry(),
  populationSpecialSiteAccentRuleRegistry =
    createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry(),
  populationViewCorridorDestinationFramingRuleRegistry =
    createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry(),
  populationRouteMemoryWayfindingGuidanceRuleRegistry =
    createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry(),
  populationPlaceMemoryNarrativeHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry(),
  populationSeasonalStoryMemoryHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry(),
  populationActivitySocialRhythmHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry(),
  populationCivicRoutineGatheringHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry(),
  populationLocalEconomyServiceHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry(),
  populationLocalMobilityAccessHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry(),
  populationPlaceLivenessHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry(),
  populationWeeklyRoutineRecurrenceHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry(),
  populationTraditionEventCycleHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry(),
  populationFestivalQuestNarrativeHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry(),
  populationExplorationProgressionHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry(),
  populationRegionalExpeditionHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry(),
  populationWorldExplorationCohesionHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry(),
  populationSignatureRouteLegacyHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry(),
  populationWorldWonderDiscoveryMemoryHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry(),
  populationWorldLegacyDiscoveryCohesionHooksRuleRegistry =
    createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry(),
  atlasAssetWorldValidationFoundation =
    createDeveloperOnlyAtlasAssetWorldValidationFoundation(),
  atlasAssetCompatibilityWorldPackages =
    createDeveloperOnlyAtlasAssetCompatibilityWorldPackages(),
  atlasAssetBiomeSettlementPackageProfiles =
    createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles(),
  atlasWorldThemeStyleBundles =
    createDeveloperOnlyAtlasWorldThemeStyleBundles(),
  atlasThemeSubprofileRules =
    createDeveloperOnlyAtlasThemeSubprofileRules(),
  atlasModularBibleStyleBridge =
    createDeveloperOnlyAtlasModularBibleStyleBridge(),
  atlasComponentAssemblyRuleProfiles =
    createDeveloperOnlyAtlasComponentAssemblyRuleProfiles(),
  atlasVariantStructuralCompatibilityProfiles =
    createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles(),
  atlasMaterialPaletteFinishCompatibilityProfiles =
    createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles(),
  atlasMaterialThemeBundles =
    createDeveloperOnlyAtlasMaterialThemeBundles(),
  atlasMaterialSlotResolution =
    createDeveloperOnlyAtlasMaterialSlotResolution(),
  atlasComponentSurfaceMapping =
    createDeveloperOnlyAtlasComponentSurfaceMapping(),
  atlasAttachmentMetadataGlbPreparation =
    createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation()
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
  const specialSiteAccentRegistryStatus =
    getDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistryStatus(
      populationSpecialSiteAccentRuleRegistry
    );
  const destinationFramingRegistryStatus =
    getDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistryStatus(
      populationViewCorridorDestinationFramingRuleRegistry
    );
  const routeGuidanceRegistryStatus =
    getDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistryStatus(
      populationRouteMemoryWayfindingGuidanceRuleRegistry
    );
  const placeMemoryRegistryStatus =
    getDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistryStatus(
      populationPlaceMemoryNarrativeHooksRuleRegistry
    );
  const seasonalStoryMemoryRegistryStatus =
    getDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistryStatus(
      populationSeasonalStoryMemoryHooksRuleRegistry
    );
  const activitySocialRhythmRegistryStatus =
    getDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistryStatus(
      populationActivitySocialRhythmHooksRuleRegistry
    );
  const civicRoutineGatheringRegistryStatus =
    getDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistryStatus(
      populationCivicRoutineGatheringHooksRuleRegistry
    );
  const localEconomyServiceRegistryStatus =
    getDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistryStatus(
      populationLocalEconomyServiceHooksRuleRegistry
    );
  const localMobilityAccessRegistryStatus =
    getDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistryStatus(
      populationLocalMobilityAccessHooksRuleRegistry
    );
  const placeLivenessRegistryStatus =
    getDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistryStatus(
      populationPlaceLivenessHooksRuleRegistry
    );
  const weeklyRoutineRecurrenceRegistryStatus =
    getDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistryStatus(
      populationWeeklyRoutineRecurrenceHooksRuleRegistry
    );
  const traditionEventCycleRegistryStatus =
    getDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistryStatus(
      populationTraditionEventCycleHooksRuleRegistry
    );
  const festivalQuestNarrativeRegistryStatus =
    getDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistryStatus(
      populationFestivalQuestNarrativeHooksRuleRegistry
    );
  const explorationProgressionRegistryStatus =
    getDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistryStatus(
      populationExplorationProgressionHooksRuleRegistry
    );
  const regionalExpeditionRegistryStatus =
    getDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistryStatus(
      populationRegionalExpeditionHooksRuleRegistry
    );
  const worldExplorationCohesionRegistryStatus =
    getDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistryStatus(
      populationWorldExplorationCohesionHooksRuleRegistry
    );
  const signatureRouteLegacyRegistryStatus =
    getDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistryStatus(
      populationSignatureRouteLegacyHooksRuleRegistry
    );
  const worldWonderDiscoveryMemoryRegistryStatus =
    getDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistryStatus(
      populationWorldWonderDiscoveryMemoryHooksRuleRegistry
    );
  const worldLegacyDiscoveryCohesionRegistryStatus =
    getDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistryStatus(
      populationWorldLegacyDiscoveryCohesionHooksRuleRegistry
    );
  const atlasAssetWorldValidationStatus =
    getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus(
      atlasAssetWorldValidationFoundation
    );
  const atlasAssetCompatibilityWorldPackagesStatus =
    getDeveloperOnlyAtlasAssetCompatibilityWorldPackagesStatus(
      atlasAssetCompatibilityWorldPackages
    );
  const atlasAssetBiomeSettlementPackageProfilesStatus =
    getDeveloperOnlyAtlasAssetBiomeSettlementPackageProfilesStatus(
      atlasAssetBiomeSettlementPackageProfiles
    );
  const atlasWorldThemeStyleBundlesStatus =
    getDeveloperOnlyAtlasWorldThemeStyleBundlesStatus(
      atlasWorldThemeStyleBundles
    );
  const atlasThemeSubprofileRulesStatus =
    getDeveloperOnlyAtlasThemeSubprofileRulesStatus(
      atlasThemeSubprofileRules
    );
  const atlasModularBibleStyleBridgeStatus =
    getDeveloperOnlyAtlasModularBibleStyleBridgeStatus(
      atlasModularBibleStyleBridge
    );
  const atlasComponentAssemblyRuleProfilesStatus =
    getDeveloperOnlyAtlasComponentAssemblyRuleProfilesStatus(
      atlasComponentAssemblyRuleProfiles
    );
  const atlasVariantStructuralCompatibilityProfilesStatus =
    getDeveloperOnlyAtlasVariantStructuralCompatibilityProfilesStatus(
      atlasVariantStructuralCompatibilityProfiles
    );
  const atlasMaterialPaletteFinishCompatibilityProfilesStatus =
    getDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfilesStatus(
      atlasMaterialPaletteFinishCompatibilityProfiles
    );
  const atlasMaterialThemeBundlesStatus =
    getDeveloperOnlyAtlasMaterialThemeBundlesStatus(
      atlasMaterialThemeBundles
    );
  const atlasMaterialSlotResolutionStatus =
    getDeveloperOnlyAtlasMaterialSlotResolutionStatus(
      atlasMaterialSlotResolution
    );
  const atlasComponentSurfaceMappingStatus =
    getDeveloperOnlyAtlasComponentSurfaceMappingStatus(
      atlasComponentSurfaceMapping
    );
  const atlasAttachmentMetadataGlbPreparationStatus =
    getDeveloperOnlyAtlasAttachmentMetadataGlbPreparationStatus(
      atlasAttachmentMetadataGlbPreparation
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
    specialSiteAccentVersion:
      specialSiteAccentRegistryStatus.specialSiteAccentVersion,
    registeredSpecialSiteAccentRuleCount:
      specialSiteAccentRegistryStatus.registeredSpecialSiteAccentRuleCount,
    specialSiteType: specialSiteAccentRegistryStatus.specialSiteType,
    landmarkAccentProfileId:
      specialSiteAccentRegistryStatus.landmarkAccentProfileId,
    cornerLotAccentId: specialSiteAccentRegistryStatus.cornerLotAccentId,
    visibilityPriority: specialSiteAccentRegistryStatus.visibilityPriority,
    specialSiteReason: specialSiteAccentRegistryStatus.specialSiteReason,
    destinationFramingVersion:
      destinationFramingRegistryStatus.destinationFramingVersion,
    registeredDestinationFramingRuleCount:
      destinationFramingRegistryStatus.registeredDestinationFramingRuleCount,
    viewCorridorId: destinationFramingRegistryStatus.viewCorridorId,
    approachSequenceId: destinationFramingRegistryStatus.approachSequenceId,
    destinationFrameProfileId:
      destinationFramingRegistryStatus.destinationFrameProfileId,
    arrivalReason: destinationFramingRegistryStatus.arrivalReason,
    routeGuidanceVersion: routeGuidanceRegistryStatus.routeGuidanceVersion,
    registeredRouteGuidanceRuleCount:
      routeGuidanceRegistryStatus.registeredRouteGuidanceRuleCount,
    routeMemoryId: routeGuidanceRegistryStatus.routeMemoryId,
    wayfindingProfileId: routeGuidanceRegistryStatus.wayfindingProfileId,
    explorationRouteType:
      routeGuidanceRegistryStatus.explorationRouteType,
    guidanceReason: routeGuidanceRegistryStatus.guidanceReason,
    routePriority: routeGuidanceRegistryStatus.routePriority,
    placeMemoryVersion: placeMemoryRegistryStatus.placeMemoryVersion,
    registeredPlaceMemoryRuleCount:
      placeMemoryRegistryStatus.registeredPlaceMemoryRuleCount,
    placeMemoryId: placeMemoryRegistryStatus.placeMemoryId,
    storyCategory: placeMemoryRegistryStatus.storyCategory,
    localNarrativeProfileId:
      placeMemoryRegistryStatus.localNarrativeProfileId,
    discoveryImportance: placeMemoryRegistryStatus.discoveryImportance,
    storyReason: placeMemoryRegistryStatus.storyReason,
    seasonalStoryMemoryVersion:
      seasonalStoryMemoryRegistryStatus.seasonalStoryMemoryVersion,
    registeredSeasonalStoryMemoryRuleCount:
      seasonalStoryMemoryRegistryStatus
        .registeredSeasonalStoryMemoryRuleCount,
    memoryStateId: seasonalStoryMemoryRegistryStatus.memoryStateId,
    seasonalStoryProfileId:
      seasonalStoryMemoryRegistryStatus.seasonalStoryProfileId,
    eventHookProfileId:
      seasonalStoryMemoryRegistryStatus.eventHookProfileId,
    returnVisitCategory:
      seasonalStoryMemoryRegistryStatus.returnVisitCategory,
    storyEvolutionReason:
      seasonalStoryMemoryRegistryStatus.storyEvolutionReason,
    activitySocialRhythmVersion:
      activitySocialRhythmRegistryStatus.activitySocialRhythmVersion,
    registeredActivitySocialRhythmRuleCount:
      activitySocialRhythmRegistryStatus
        .registeredActivitySocialRhythmRuleCount,
    activityProfileId: activitySocialRhythmRegistryStatus.activityProfileId,
    socialRhythmId: activitySocialRhythmRegistryStatus.socialRhythmId,
    timeContextProfile:
      activitySocialRhythmRegistryStatus.timeContextProfile,
    activityReason: activitySocialRhythmRegistryStatus.activityReason,
    communityImportance:
      activitySocialRhythmRegistryStatus.communityImportance,
    civicRoutineGatheringVersion:
      civicRoutineGatheringRegistryStatus.civicRoutineGatheringVersion,
    registeredCivicRoutineRuleCount:
      civicRoutineGatheringRegistryStatus.registeredCivicRoutineRuleCount,
    civicRoutineProfileId:
      civicRoutineGatheringRegistryStatus.civicRoutineProfileId,
    gatheringPatternId:
      civicRoutineGatheringRegistryStatus.gatheringPatternId,
    temporalUseProfile:
      civicRoutineGatheringRegistryStatus.temporalUseProfile,
    communityRole: civicRoutineGatheringRegistryStatus.communityRole,
    routineReason: civicRoutineGatheringRegistryStatus.routineReason,
    localEconomyServiceVersion:
      localEconomyServiceRegistryStatus.localEconomyServiceVersion,
    registeredLocalEconomyServiceRuleCount:
      localEconomyServiceRegistryStatus.registeredLocalEconomyServiceRuleCount,
    serviceRoleId: localEconomyServiceRegistryStatus.serviceRoleId,
    economyProfileId: localEconomyServiceRegistryStatus.economyProfileId,
    marketCycleProfileId:
      localEconomyServiceRegistryStatus.marketCycleProfileId,
    serviceImportance: localEconomyServiceRegistryStatus.serviceImportance,
    economyReason: localEconomyServiceRegistryStatus.economyReason,
    localMobilityAccessVersion:
      localMobilityAccessRegistryStatus.localMobilityAccessVersion,
    registeredLocalMobilityAccessRuleCount:
      localMobilityAccessRegistryStatus
        .registeredLocalMobilityAccessRuleCount,
    mobilityProfileId: localMobilityAccessRegistryStatus.mobilityProfileId,
    accessPatternId: localMobilityAccessRegistryStatus.accessPatternId,
    flowPriority: localMobilityAccessRegistryStatus.flowPriority,
    movementReason: localMobilityAccessRegistryStatus.movementReason,
    accessibilityProfile:
      localMobilityAccessRegistryStatus.accessibilityProfile,
    placeLivenessVersion: placeLivenessRegistryStatus.placeLivenessVersion,
    registeredPlaceLivenessRuleCount:
      placeLivenessRegistryStatus.registeredPlaceLivenessRuleCount,
    occupancyProfileId: placeLivenessRegistryStatus.occupancyProfileId,
    timePresenceProfile: placeLivenessRegistryStatus.timePresenceProfile,
    livenessCategory: placeLivenessRegistryStatus.livenessCategory,
    peakActivityWindow: placeLivenessRegistryStatus.peakActivityWindow,
    presenceReason: placeLivenessRegistryStatus.presenceReason,
    weeklyRoutineRecurrenceVersion:
      weeklyRoutineRecurrenceRegistryStatus.weeklyRoutineRecurrenceVersion,
    registeredWeeklyRoutineRuleCount:
      weeklyRoutineRecurrenceRegistryStatus.registeredWeeklyRoutineRuleCount,
    weeklyRoutineProfileId:
      weeklyRoutineRecurrenceRegistryStatus.weeklyRoutineProfileId,
    recurrencePatternId:
      weeklyRoutineRecurrenceRegistryStatus.recurrencePatternId,
    communityCadenceId:
      weeklyRoutineRecurrenceRegistryStatus.communityCadenceId,
    eventFrequency: weeklyRoutineRecurrenceRegistryStatus.eventFrequency,
    recurrenceReason: weeklyRoutineRecurrenceRegistryStatus.recurrenceReason,
    traditionEventCycleVersion:
      traditionEventCycleRegistryStatus.traditionEventCycleVersion,
    registeredTraditionRuleCount:
      traditionEventCycleRegistryStatus.registeredTraditionRuleCount,
    traditionProfileId: traditionEventCycleRegistryStatus.traditionProfileId,
    seasonalEventCycleId:
      traditionEventCycleRegistryStatus.seasonalEventCycleId,
    communityTraditionId:
      traditionEventCycleRegistryStatus.communityTraditionId,
    eventImportance: traditionEventCycleRegistryStatus.eventImportance,
    traditionReason: traditionEventCycleRegistryStatus.traditionReason,
    festivalQuestNarrativeVersion:
      festivalQuestNarrativeRegistryStatus.festivalQuestNarrativeVersion,
    registeredNarrativeRuleCount:
      festivalQuestNarrativeRegistryStatus.registeredNarrativeRuleCount,
    festivalProfileId:
      festivalQuestNarrativeRegistryStatus.festivalProfileId,
    questNarrativeProfileId:
      festivalQuestNarrativeRegistryStatus.questNarrativeProfileId,
    seasonalDestinationProfileId:
      festivalQuestNarrativeRegistryStatus.seasonalDestinationProfileId,
    achievementHookProfileId:
      festivalQuestNarrativeRegistryStatus.achievementHookProfileId,
    narrativeReason: festivalQuestNarrativeRegistryStatus.narrativeReason,
    explorationProgressionVersion:
      explorationProgressionRegistryStatus.explorationProgressionVersion,
    registeredExplorationRuleCount:
      explorationProgressionRegistryStatus.registeredExplorationRuleCount,
    campaignProfileId: explorationProgressionRegistryStatus.campaignProfileId,
    destinationChainId:
      explorationProgressionRegistryStatus.destinationChainId,
    rewardArcProfileId:
      explorationProgressionRegistryStatus.rewardArcProfileId,
    progressionTier: explorationProgressionRegistryStatus.progressionTier,
    explorationReason: explorationProgressionRegistryStatus.explorationReason,
    regionalExpeditionVersion:
      regionalExpeditionRegistryStatus.regionalExpeditionVersion,
    registeredExpeditionRuleCount:
      regionalExpeditionRegistryStatus.registeredExpeditionRuleCount,
    expeditionProfileId: regionalExpeditionRegistryStatus.expeditionProfileId,
    campaignNetworkId: regionalExpeditionRegistryStatus.campaignNetworkId,
    completionArcId: regionalExpeditionRegistryStatus.completionArcId,
    regionalIdentityId: regionalExpeditionRegistryStatus.regionalIdentityId,
    expeditionReason: regionalExpeditionRegistryStatus.expeditionReason,
    worldExplorationCohesionVersion:
      worldExplorationCohesionRegistryStatus.worldExplorationCohesionVersion,
    registeredWorldExplorationRuleCount:
      worldExplorationCohesionRegistryStatus.registeredWorldExplorationRuleCount,
    worldJourneyProfileId:
      worldExplorationCohesionRegistryStatus.worldJourneyProfileId,
    metaCollectionId: worldExplorationCohesionRegistryStatus.metaCollectionId,
    crossRegionCampaignId:
      worldExplorationCohesionRegistryStatus.crossRegionCampaignId,
    explorationTier: worldExplorationCohesionRegistryStatus.explorationTier,
    worldCohesionReason:
      worldExplorationCohesionRegistryStatus.worldCohesionReason,
    signatureRouteLegacyVersion:
      signatureRouteLegacyRegistryStatus.signatureRouteLegacyVersion,
    registeredSignatureRouteLegacyRuleCount:
      signatureRouteLegacyRegistryStatus
        .registeredSignatureRouteLegacyRuleCount,
    signatureRouteProfileId:
      signatureRouteLegacyRegistryStatus.signatureRouteProfileId,
    legacyDestinationId:
      signatureRouteLegacyRegistryStatus.legacyDestinationId,
    mythologyProfileId: signatureRouteLegacyRegistryStatus.mythologyProfileId,
    globalJourneyTier: signatureRouteLegacyRegistryStatus.globalJourneyTier,
    legacyReason: signatureRouteLegacyRegistryStatus.legacyReason,
    worldWonderDiscoveryMemoryVersion:
      worldWonderDiscoveryMemoryRegistryStatus
        .worldWonderDiscoveryMemoryVersion,
    registeredWorldWonderRuleCount:
      worldWonderDiscoveryMemoryRegistryStatus.registeredWorldWonderRuleCount,
    worldWonderProfileId:
      worldWonderDiscoveryMemoryRegistryStatus.worldWonderProfileId,
    epicDestinationId:
      worldWonderDiscoveryMemoryRegistryStatus.epicDestinationId,
    discoveryMemoryTier:
      worldWonderDiscoveryMemoryRegistryStatus.discoveryMemoryTier,
    generationMemoryProfileId:
      worldWonderDiscoveryMemoryRegistryStatus.generationMemoryProfileId,
    wonderReason: worldWonderDiscoveryMemoryRegistryStatus.wonderReason,
    worldLegacyDiscoveryCohesionVersion:
      worldLegacyDiscoveryCohesionRegistryStatus
        .worldLegacyDiscoveryCohesionVersion,
    registeredWorldLegacyRuleCount:
      worldLegacyDiscoveryCohesionRegistryStatus.registeredWorldLegacyRuleCount,
    worldLegacyProfileId:
      worldLegacyDiscoveryCohesionRegistryStatus.worldLegacyProfileId,
    discoveryCohesionId:
      worldLegacyDiscoveryCohesionRegistryStatus.discoveryCohesionId,
    legacyTier: worldLegacyDiscoveryCohesionRegistryStatus.legacyTier,
    memoryCategory: worldLegacyDiscoveryCohesionRegistryStatus.memoryCategory,
    legacyReason: worldLegacyDiscoveryCohesionRegistryStatus.legacyReason,
    atlasAssetWorldValidationVersion:
      atlasAssetWorldValidationStatus.atlasAssetWorldValidationVersion,
    registeredAtlasAssetValidationRuleCount:
      atlasAssetWorldValidationStatus.registeredAtlasAssetValidationRuleCount,
    atlasAssetPackageId: atlasAssetWorldValidationStatus.atlasAssetPackageId,
    assetValidationStatus: atlasAssetWorldValidationStatus.assetValidationStatus,
    bindingValidationReason:
      atlasAssetWorldValidationStatus.bindingValidationReason,
    placementValidationStatus:
      atlasAssetWorldValidationStatus.placementValidationStatus,
    rendererHandoffReadiness:
      atlasAssetWorldValidationStatus.rendererHandoffReadiness,
    atlasAssetCompatibilityWorldPackagesVersion:
      atlasAssetCompatibilityWorldPackagesStatus
        .atlasAssetCompatibilityWorldPackagesVersion,
    registeredWorldPackageRuleCount:
      atlasAssetCompatibilityWorldPackagesStatus
        .registeredWorldPackageRuleCount,
    worldPackageId: atlasAssetCompatibilityWorldPackagesStatus.worldPackageId,
    packageValidationStatus:
      atlasAssetCompatibilityWorldPackagesStatus.packageValidationStatus,
    compatibleAssetCount:
      atlasAssetCompatibilityWorldPackagesStatus.compatibleAssetCount,
    blockedAssetCount:
      atlasAssetCompatibilityWorldPackagesStatus.blockedAssetCount,
    packageReason: atlasAssetCompatibilityWorldPackagesStatus.packageReason,
    atlasAssetBiomeSettlementPackageProfilesVersion:
      atlasAssetBiomeSettlementPackageProfilesStatus
        .atlasAssetBiomeSettlementPackageProfilesVersion,
    registeredPackageProfileRuleCount:
      atlasAssetBiomeSettlementPackageProfilesStatus
        .registeredPackageProfileRuleCount,
    settlementPackageProfileId:
      atlasAssetBiomeSettlementPackageProfilesStatus
        .settlementPackageProfileId,
    biomePackageProfileId:
      atlasAssetBiomeSettlementPackageProfilesStatus.biomePackageProfileId,
    resolvedWorldPackageId:
      atlasAssetBiomeSettlementPackageProfilesStatus.resolvedWorldPackageId,
    profileCompatibilityStatus:
      atlasAssetBiomeSettlementPackageProfilesStatus
        .profileCompatibilityStatus,
    packageSelectionReason:
      atlasAssetBiomeSettlementPackageProfilesStatus.packageSelectionReason,
    atlasWorldThemeStyleBundlesVersion:
      atlasWorldThemeStyleBundlesStatus.atlasWorldThemeStyleBundlesVersion,
    registeredThemeBundleRuleCount:
      atlasWorldThemeStyleBundlesStatus.registeredThemeBundleRuleCount,
    worldThemeProfileId: atlasWorldThemeStyleBundlesStatus.worldThemeProfileId,
    regionalStyleBundleId:
      atlasWorldThemeStyleBundlesStatus.regionalStyleBundleId,
    visualCohesionScore:
      atlasWorldThemeStyleBundlesStatus.visualCohesionScore,
    themeCompatibilityStatus:
      atlasWorldThemeStyleBundlesStatus.themeCompatibilityStatus,
    themeSelectionReason:
      atlasWorldThemeStyleBundlesStatus.themeSelectionReason,
    atlasThemeSubprofileRulesVersion:
      atlasThemeSubprofileRulesStatus.atlasThemeSubprofileRulesVersion,
    registeredThemeSubprofileRuleCount:
      atlasThemeSubprofileRulesStatus.registeredThemeSubprofileRuleCount,
    architectureStyleProfileId:
      atlasThemeSubprofileRulesStatus.architectureStyleProfileId,
    vegetationStyleProfileId:
      atlasThemeSubprofileRulesStatus.vegetationStyleProfileId,
    streetscapeStyleProfileId:
      atlasThemeSubprofileRulesStatus.streetscapeStyleProfileId,
    themeSubprofileCompatibility:
      atlasThemeSubprofileRulesStatus.themeSubprofileCompatibility,
    styleSubprofileReason:
      atlasThemeSubprofileRulesStatus.styleSubprofileReason,
    atlasModularBibleStyleBridgeVersion:
      atlasModularBibleStyleBridgeStatus.atlasModularBibleStyleBridgeVersion,
    registeredStyleBridgeRuleCount:
      atlasModularBibleStyleBridgeStatus.registeredStyleBridgeRuleCount,
    modularBibleFamilyId:
      atlasModularBibleStyleBridgeStatus.modularBibleFamilyId,
    componentRecipeId: atlasModularBibleStyleBridgeStatus.componentRecipeId,
    assetAssemblyProfileId:
      atlasModularBibleStyleBridgeStatus.assetAssemblyProfileId,
    styleBridgeStatus: atlasModularBibleStyleBridgeStatus.styleBridgeStatus,
    bridgeReason: atlasModularBibleStyleBridgeStatus.bridgeReason,
    atlasComponentAssemblyRuleProfilesVersion:
      atlasComponentAssemblyRuleProfilesStatus
        .atlasComponentAssemblyRuleProfilesVersion,
    registeredComponentAssemblyRuleCount:
      atlasComponentAssemblyRuleProfilesStatus
        .registeredComponentAssemblyRuleCount,
    componentCompatibilityStatus:
      atlasComponentAssemblyRuleProfilesStatus.componentCompatibilityStatus,
    assemblyRuleProfileId:
      atlasComponentAssemblyRuleProfilesStatus.assemblyRuleProfileId,
    requiredComponentCount:
      atlasComponentAssemblyRuleProfilesStatus.requiredComponentCount,
    validatedComponentCount:
      atlasComponentAssemblyRuleProfilesStatus.validatedComponentCount,
    assemblyReason: atlasComponentAssemblyRuleProfilesStatus.assemblyReason,
    atlasVariantStructuralCompatibilityProfilesVersion:
      atlasVariantStructuralCompatibilityProfilesStatus
        .atlasVariantStructuralCompatibilityProfilesVersion,
    registeredVariantCompatibilityRuleCount:
      atlasVariantStructuralCompatibilityProfilesStatus
        .registeredVariantCompatibilityRuleCount,
    assetVariantEnvelopeId:
      atlasVariantStructuralCompatibilityProfilesStatus.assetVariantEnvelopeId,
    structuralCompatibilityStatus:
      atlasVariantStructuralCompatibilityProfilesStatus
        .structuralCompatibilityStatus,
    selectedVariantProfileId:
      atlasVariantStructuralCompatibilityProfilesStatus
        .selectedVariantProfileId,
    variantConstraintReason:
      atlasVariantStructuralCompatibilityProfilesStatus.variantConstraintReason,
    variantSelectionSeed:
      atlasVariantStructuralCompatibilityProfilesStatus.variantSelectionSeed,
    atlasMaterialPaletteFinishCompatibilityProfilesVersion:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus
        .atlasMaterialPaletteFinishCompatibilityProfilesVersion,
    registeredMaterialCompatibilityRuleCount:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus
        .registeredMaterialCompatibilityRuleCount,
    materialCompatibilityStatus:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus
        .materialCompatibilityStatus,
    paletteCompatibilityStatus:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus
        .paletteCompatibilityStatus,
    finishProfileId:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus.finishProfileId,
    resolvedMaterialProfileId:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus
        .resolvedMaterialProfileId,
    materialReason:
      atlasMaterialPaletteFinishCompatibilityProfilesStatus.materialReason,
    atlasMaterialThemeBundlesVersion:
      atlasMaterialThemeBundlesStatus.atlasMaterialThemeBundlesVersion,
    registeredMaterialThemeBundleRuleCount:
      atlasMaterialThemeBundlesStatus.registeredMaterialThemeBundleRuleCount,
    materialThemeBundleId: atlasMaterialThemeBundlesStatus.materialThemeBundleId,
    resolvedFinishSetId: atlasMaterialThemeBundlesStatus.resolvedFinishSetId,
    resolvedPaletteSetId: atlasMaterialThemeBundlesStatus.resolvedPaletteSetId,
    materialBundleCompatibilityStatus:
      atlasMaterialThemeBundlesStatus.materialBundleCompatibilityStatus,
    materialBundleReason: atlasMaterialThemeBundlesStatus.materialBundleReason,
    atlasMaterialSlotResolutionVersion:
      atlasMaterialSlotResolutionStatus.atlasMaterialSlotResolutionVersion,
    registeredMaterialSlotRuleCount:
      atlasMaterialSlotResolutionStatus.registeredMaterialSlotRuleCount,
    materialSlotSetId: atlasMaterialSlotResolutionStatus.materialSlotSetId,
    resolvedSlotCount: atlasMaterialSlotResolutionStatus.resolvedSlotCount,
    assignedMaterialCount:
      atlasMaterialSlotResolutionStatus.assignedMaterialCount,
    slotCompatibilityStatus:
      atlasMaterialSlotResolutionStatus.slotCompatibilityStatus,
    slotResolutionReason: atlasMaterialSlotResolutionStatus.slotResolutionReason,
    atlasComponentSurfaceMappingVersion:
      atlasComponentSurfaceMappingStatus.atlasComponentSurfaceMappingVersion,
    registeredComponentSurfaceMappingRuleCount:
      atlasComponentSurfaceMappingStatus
        .registeredComponentSurfaceMappingRuleCount,
    surfaceMappingProfileId:
      atlasComponentSurfaceMappingStatus.surfaceMappingProfileId,
    componentAnchorSetId:
      atlasComponentSurfaceMappingStatus.componentAnchorSetId,
    resolvedAnchorCount: atlasComponentSurfaceMappingStatus.resolvedAnchorCount,
    mappedComponentCount: atlasComponentSurfaceMappingStatus.mappedComponentCount,
    surfaceMappingReason: atlasComponentSurfaceMappingStatus.surfaceMappingReason,
    atlasAttachmentMetadataGlbPreparationVersion:
      atlasAttachmentMetadataGlbPreparationStatus
        .atlasAttachmentMetadataGlbPreparationVersion,
    registeredAttachmentMetadataRuleCount:
      atlasAttachmentMetadataGlbPreparationStatus
        .registeredAttachmentMetadataRuleCount,
    attachmentMetadataProfileId:
      atlasAttachmentMetadataGlbPreparationStatus
        .attachmentMetadataProfileId,
    glbPreparationProfileId:
      atlasAttachmentMetadataGlbPreparationStatus.glbPreparationProfileId,
    socketMetadataCount:
      atlasAttachmentMetadataGlbPreparationStatus.socketMetadataCount,
    componentMetadataCount:
      atlasAttachmentMetadataGlbPreparationStatus.componentMetadataCount,
    attachmentMetadataReason:
      atlasAttachmentMetadataGlbPreparationStatus.attachmentMetadataReason,
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
      populationSpecialSiteAccentRuleRegistry,
      populationViewCorridorDestinationFramingRuleRegistry,
      populationRouteMemoryWayfindingGuidanceRuleRegistry,
      populationPlaceMemoryNarrativeHooksRuleRegistry,
      populationSeasonalStoryMemoryHooksRuleRegistry,
      populationActivitySocialRhythmHooksRuleRegistry,
      populationCivicRoutineGatheringHooksRuleRegistry,
      populationLocalEconomyServiceHooksRuleRegistry,
      populationLocalMobilityAccessHooksRuleRegistry,
      populationPlaceLivenessHooksRuleRegistry,
      populationWeeklyRoutineRecurrenceHooksRuleRegistry,
      populationTraditionEventCycleHooksRuleRegistry,
      populationFestivalQuestNarrativeHooksRuleRegistry,
      populationExplorationProgressionHooksRuleRegistry,
      populationRegionalExpeditionHooksRuleRegistry,
      populationWorldExplorationCohesionHooksRuleRegistry,
      populationSignatureRouteLegacyHooksRuleRegistry,
      populationWorldWonderDiscoveryMemoryHooksRuleRegistry,
      populationWorldLegacyDiscoveryCohesionHooksRuleRegistry,
      atlasAssetWorldValidationFoundation,
      atlasAssetCompatibilityWorldPackages,
      atlasAssetBiomeSettlementPackageProfiles,
      atlasWorldThemeStyleBundles,
      atlasThemeSubprofileRules,
      atlasModularBibleStyleBridge,
      atlasComponentAssemblyRuleProfiles,
      atlasVariantStructuralCompatibilityProfiles,
      atlasMaterialPaletteFinishCompatibilityProfiles,
      atlasMaterialThemeBundles,
      atlasMaterialSlotResolution,
      atlasComponentSurfaceMapping,
      atlasAttachmentMetadataGlbPreparation,
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
  state.specialSiteType = null;
  state.landmarkAccentProfileId = null;
  state.cornerLotAccentId = null;
  state.visibilityPriority = null;
  state.specialSiteReason = null;
  state.viewCorridorId = null;
  state.approachSequenceId = null;
  state.destinationFrameProfileId = null;
  state.arrivalReason = null;
  state.routeMemoryId = null;
  state.wayfindingProfileId = null;
  state.explorationRouteType = null;
  state.guidanceReason = null;
  state.routePriority = null;
  state.placeMemoryId = null;
  state.storyCategory = null;
  state.localNarrativeProfileId = null;
  state.discoveryImportance = null;
  state.storyReason = null;
  state.memoryStateId = null;
  state.seasonalStoryProfileId = null;
  state.eventHookProfileId = null;
  state.returnVisitCategory = null;
  state.storyEvolutionReason = null;
  state.activityProfileId = null;
  state.socialRhythmId = null;
  state.timeContextProfile = null;
  state.activityReason = null;
  state.communityImportance = null;
  state.civicRoutineProfileId = null;
  state.gatheringPatternId = null;
  state.temporalUseProfile = null;
  state.communityRole = null;
  state.routineReason = null;
  state.serviceRoleId = null;
  state.economyProfileId = null;
  state.marketCycleProfileId = null;
  state.serviceImportance = null;
  state.economyReason = null;
  state.mobilityProfileId = null;
  state.accessPatternId = null;
  state.flowPriority = null;
  state.movementReason = null;
  state.accessibilityProfile = null;
  state.occupancyProfileId = null;
  state.timePresenceProfile = null;
  state.livenessCategory = null;
  state.peakActivityWindow = null;
  state.presenceReason = null;
  state.weeklyRoutineProfileId = null;
  state.recurrencePatternId = null;
  state.communityCadenceId = null;
  state.eventFrequency = null;
  state.recurrenceReason = null;
  state.traditionProfileId = null;
  state.seasonalEventCycleId = null;
  state.communityTraditionId = null;
  state.eventImportance = null;
  state.traditionReason = null;
  state.festivalProfileId = null;
  state.questNarrativeProfileId = null;
  state.seasonalDestinationProfileId = null;
  state.achievementHookProfileId = null;
  state.narrativeReason = null;
  state.campaignProfileId = null;
  state.destinationChainId = null;
  state.rewardArcProfileId = null;
  state.progressionTier = null;
  state.explorationReason = null;
  state.expeditionProfileId = null;
  state.campaignNetworkId = null;
  state.completionArcId = null;
  state.regionalIdentityId = null;
  state.expeditionReason = null;
  state.worldJourneyProfileId = null;
  state.metaCollectionId = null;
  state.crossRegionCampaignId = null;
  state.explorationTier = null;
  state.worldCohesionReason = null;
  state.signatureRouteProfileId = null;
  state.legacyDestinationId = null;
  state.mythologyProfileId = null;
  state.globalJourneyTier = null;
  state.legacyReason = null;
  state.worldWonderProfileId = null;
  state.epicDestinationId = null;
  state.discoveryMemoryTier = null;
  state.generationMemoryProfileId = null;
  state.wonderReason = null;
  state.worldLegacyProfileId = null;
  state.discoveryCohesionId = null;
  state.legacyTier = null;
  state.memoryCategory = null;
  state.legacyReason = null;
  state.atlasAssetPackageId = null;
  state.assetValidationStatus = null;
  state.bindingValidationReason = null;
  state.placementValidationStatus = null;
  state.rendererHandoffReadiness = null;
  state.worldPackageId = null;
  state.packageValidationStatus = null;
  state.compatibleAssetCount = 0;
  state.blockedAssetCount = 0;
  state.packageReason = null;
  state.settlementPackageProfileId = null;
  state.biomePackageProfileId = null;
  state.resolvedWorldPackageId = null;
  state.profileCompatibilityStatus = null;
  state.packageSelectionReason = null;
  state.worldThemeProfileId = null;
  state.regionalStyleBundleId = null;
  state.visualCohesionScore = null;
  state.themeCompatibilityStatus = null;
  state.themeSelectionReason = null;
  state.architectureStyleProfileId = null;
  state.vegetationStyleProfileId = null;
  state.streetscapeStyleProfileId = null;
  state.themeSubprofileCompatibility = null;
  state.styleSubprofileReason = null;
  state.modularBibleFamilyId = null;
  state.componentRecipeId = null;
  state.assetAssemblyProfileId = null;
  state.styleBridgeStatus = null;
  state.bridgeReason = null;
  state.componentCompatibilityStatus = null;
  state.assemblyRuleProfileId = null;
  state.requiredComponentCount = 0;
  state.validatedComponentCount = 0;
  state.assemblyReason = null;
  state.assetVariantEnvelopeId = null;
  state.structuralCompatibilityStatus = null;
  state.selectedVariantProfileId = null;
  state.variantConstraintReason = null;
  state.variantSelectionSeed = null;
  state.materialCompatibilityStatus = null;
  state.paletteCompatibilityStatus = null;
  state.finishProfileId = null;
  state.resolvedMaterialProfileId = null;
  state.materialReason = null;
  state.materialThemeBundleId = null;
  state.resolvedFinishSetId = null;
  state.resolvedPaletteSetId = null;
  state.materialBundleCompatibilityStatus = null;
  state.materialBundleReason = null;
  state.materialSlotSetId = null;
  state.resolvedSlotCount = 0;
  state.assignedMaterialCount = 0;
  state.slotCompatibilityStatus = null;
  state.slotResolutionReason = null;
  state.surfaceMappingProfileId = null;
  state.componentAnchorSetId = null;
  state.resolvedAnchorCount = 0;
  state.mappedComponentCount = 0;
  state.surfaceMappingReason = null;
  state.attachmentMetadataProfileId = null;
  state.glbPreparationProfileId = null;
  state.socketMetadataCount = 0;
  state.componentMetadataCount = 0;
  state.attachmentMetadataReason = null;
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
  const assetWorldValidationDecisions = [];
  const worldPackageValidationDecisions = [];
  const packageProfileDecisions = [];
  const worldThemeBundleDecisions = [];
  const themeSubprofileDecisions = [];
  const modularBibleStyleBridgeDecisions = [];
  const componentAssemblyRuleDecisions = [];
  const variantStructuralCompatibilityDecisions = [];
  const materialPaletteFinishCompatibilityDecisions = [];
  const materialThemeBundleDecisions = [];
  const materialSlotResolutionDecisions = [];
  const componentSurfaceMappingDecisions = [];
  const attachmentMetadataDecisions = [];
  const microClusterAdjacencyDecisions = [];
  const supportingCompositionDecisions = [];
  const specialSiteAccentDecisions = [];
  const destinationFramingDecisions = [];
  const routeGuidanceDecisions = [];
  const placeMemoryDecisions = [];
  const seasonalStoryMemoryDecisions = [];
  const activitySocialRhythmDecisions = [];
  const civicRoutineGatheringDecisions = [];
  const localEconomyServiceDecisions = [];
  const localMobilityAccessDecisions = [];
  const placeLivenessDecisions = [];
  const weeklyRoutineRecurrenceDecisions = [];
  const traditionEventCycleDecisions = [];
  const festivalQuestNarrativeDecisions = [];
  const explorationProgressionDecisions = [];
  const regionalExpeditionDecisions = [];
  const worldExplorationCohesionDecisions = [];
  const signatureRouteLegacyDecisions = [];
  const worldWonderDiscoveryMemoryDecisions = [];
  const worldLegacyDiscoveryCohesionDecisions = [];
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
    const variantStructuralCompatibilityResolution =
      modularAssetBindingResolution.assetVariantId
        ? resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile(
            internal.atlasVariantStructuralCompatibilityProfiles,
            {
              assetVariantId: modularAssetBindingResolution.assetVariantId,
              lotType: parcelFrontageLotResolution.lotType,
              districtType: districtCompositionResolution.districtType,
              streetscapeProfileId: streetscapeResolution.streetscapeProfileId,
              settlementIdentityId:
                settlementIdentityStyleCohesionResolution.settlementIdentityId,
              densityTier: distributionResolution.densityTier
            }
          )
        : {
            matched: false,
            assetVariantEnvelopeId: null,
            structuralCompatibilityStatus: "blocked",
            selectedVariantProfileId: null,
            variantConstraintReason:
              "VARIANT_STRUCTURAL_COMPATIBILITY_UNAVAILABLE",
            variantSelectionSeed: null
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
    const specialSiteAccentResolution =
      resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent(
        internal.populationSpecialSiteAccentRuleRegistry,
        {
          featureClass: feature.featureClass,
          districtType: districtCompositionResolution.districtType,
          lotType: parcelFrontageLotResolution.lotType,
          sourceClassification: feature.sourceClassification
        }
      );
    const destinationFramingResolution =
      resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming(
        internal.populationViewCorridorDestinationFramingRuleRegistry,
        {
          featureClass: feature.featureClass,
          districtType: districtCompositionResolution.districtType,
          sourceClassification: feature.sourceClassification,
          specialSiteType: specialSiteAccentResolution.specialSiteType
        }
      );
    const routeGuidanceResolution =
      resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance(
        internal.populationRouteMemoryWayfindingGuidanceRuleRegistry,
        {
          featureClass: feature.featureClass,
          districtType: districtCompositionResolution.districtType,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          destinationFrameProfileId:
            destinationFramingResolution.destinationFrameProfileId
        }
      );
    const placeMemoryResolution =
      resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks(
        internal.populationPlaceMemoryNarrativeHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          explorationRouteType: routeGuidanceResolution.explorationRouteType,
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId
        }
      );
    const seasonalStoryMemoryResolution =
      resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks(
        internal.populationSeasonalStoryMemoryHooksRuleRegistry,
        {
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
          biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
          storyCategory: placeMemoryResolution.storyCategory
        }
      );
    const activitySocialRhythmResolution =
      resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks(
        internal.populationActivitySocialRhythmHooksRuleRegistry,
        {
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId,
          placeMemoryId: placeMemoryResolution.placeMemoryId,
          seasonalStoryProfileId:
            seasonalStoryMemoryResolution.seasonalStoryProfileId,
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId,
          returnVisitCategory:
            seasonalStoryMemoryResolution.returnVisitCategory
        }
      );
    const civicRoutineGatheringResolution =
      resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks(
        internal.populationCivicRoutineGatheringHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          activityProfileId: activitySocialRhythmResolution.activityProfileId,
          socialRhythmId: activitySocialRhythmResolution.socialRhythmId,
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId
        }
      );
    const localEconomyServiceResolution =
      resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks(
        internal.populationLocalEconomyServiceHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          communityRole: civicRoutineGatheringResolution.communityRole,
          civicRoutineProfileId:
            civicRoutineGatheringResolution.civicRoutineProfileId,
          activityProfileId: activitySocialRhythmResolution.activityProfileId,
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId
        }
      );
    const localMobilityAccessResolution =
      resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks(
        internal.populationLocalMobilityAccessHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          serviceRoleId: localEconomyServiceResolution.serviceRoleId,
          communityRole: civicRoutineGatheringResolution.communityRole,
          civicRoutineProfileId:
            civicRoutineGatheringResolution.civicRoutineProfileId
        }
      );
    const placeLivenessResolution =
      resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks(
        internal.populationPlaceLivenessHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          mobilityProfileId: localMobilityAccessResolution.mobilityProfileId,
          accessPatternId: localMobilityAccessResolution.accessPatternId,
          serviceRoleId: localEconomyServiceResolution.serviceRoleId,
          communityRole: civicRoutineGatheringResolution.communityRole
        }
      );
    const weeklyRoutineRecurrenceResolution =
      resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks(
        internal.populationWeeklyRoutineRecurrenceHooksRuleRegistry,
        {
          featureClass: feature.featureClass,
          livenessCategory: placeLivenessResolution.livenessCategory,
          occupancyProfileId: placeLivenessResolution.occupancyProfileId,
          serviceRoleId: localEconomyServiceResolution.serviceRoleId,
          communityRole: civicRoutineGatheringResolution.communityRole
        }
      );
    const traditionEventCycleResolution =
      resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks(
        internal.populationTraditionEventCycleHooksRuleRegistry,
        {
          settlementIdentityId:
            settlementIdentityStyleCohesionResolution.settlementIdentityId,
          storyCategory: placeMemoryResolution.storyCategory,
          recurrencePatternId:
            weeklyRoutineRecurrenceResolution.recurrencePatternId,
          communityCadenceId:
            weeklyRoutineRecurrenceResolution.communityCadenceId,
          seasonProfileId: seasonalEnvironmentResolution.seasonProfileId
        }
      );
    const festivalQuestNarrativeResolution =
      resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks(
        internal.populationFestivalQuestNarrativeHooksRuleRegistry,
        {
          destinationFrameProfileId:
            destinationFramingResolution.destinationFrameProfileId,
          routeMemoryId: routeGuidanceResolution.routeMemoryId,
          placeMemoryId: placeMemoryResolution.placeMemoryId,
          recurrencePatternId:
            weeklyRoutineRecurrenceResolution.recurrencePatternId,
          traditionProfileId: traditionEventCycleResolution.traditionProfileId
        }
      );
    const explorationProgressionResolution =
      resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks(
        internal.populationExplorationProgressionHooksRuleRegistry,
        {
          seasonalDestinationProfileId:
            festivalQuestNarrativeResolution.seasonalDestinationProfileId,
          routePriority: routeGuidanceResolution.routePriority,
          achievementHookProfileId:
            festivalQuestNarrativeResolution.achievementHookProfileId,
          questNarrativeProfileId:
            festivalQuestNarrativeResolution.questNarrativeProfileId
        }
      );
    const regionalExpeditionResolution =
      resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks(
        internal.populationRegionalExpeditionHooksRuleRegistry,
        {
          campaignProfileId: explorationProgressionResolution.campaignProfileId,
          destinationChainId: explorationProgressionResolution.destinationChainId,
          progressionTier: explorationProgressionResolution.progressionTier,
          districtType: districtCompositionResolution.districtType,
          regionId
        }
      );
    const worldExplorationCohesionResolution =
      resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks(
        internal.populationWorldExplorationCohesionHooksRuleRegistry,
        {
          expeditionProfileId: regionalExpeditionResolution.expeditionProfileId,
          campaignNetworkId: regionalExpeditionResolution.campaignNetworkId,
          progressionTier: explorationProgressionResolution.progressionTier,
          regionalIdentityId: regionalExpeditionResolution.regionalIdentityId
        }
      );
    const signatureRouteLegacyResolution =
      resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks(
        internal.populationSignatureRouteLegacyHooksRuleRegistry,
        {
          worldJourneyProfileId:
            worldExplorationCohesionResolution.worldJourneyProfileId,
          routeMemoryId: routeGuidanceResolution.routeMemoryId,
          placeMemoryId: placeMemoryResolution.placeMemoryId,
          regionalIdentityId: regionalExpeditionResolution.regionalIdentityId
        }
      );
    const worldWonderDiscoveryMemoryResolution =
      resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks(
        internal.populationWorldWonderDiscoveryMemoryHooksRuleRegistry,
        {
          signatureRouteProfileId:
            signatureRouteLegacyResolution.signatureRouteProfileId,
          worldJourneyProfileId:
            worldExplorationCohesionResolution.worldJourneyProfileId,
          legacyDestinationId:
            signatureRouteLegacyResolution.legacyDestinationId,
          placeMemoryId: placeMemoryResolution.placeMemoryId
        }
      );
    const worldLegacyDiscoveryCohesionResolution =
      resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks(
        internal.populationWorldLegacyDiscoveryCohesionHooksRuleRegistry,
        {
          worldWonderProfileId:
            worldWonderDiscoveryMemoryResolution.worldWonderProfileId,
          signatureRouteProfileId:
            signatureRouteLegacyResolution.signatureRouteProfileId,
          metaCollectionId: worldExplorationCohesionResolution.metaCollectionId,
          generationMemoryProfileId:
            worldWonderDiscoveryMemoryResolution.generationMemoryProfileId
        }
      );
    const assetValidationPlacementIntent =
      deriveAtlasAssetValidationPlacementIntent(
        assetFamilyMaterialCohesionResolution.assetFamilyId
      );
    const assetWorldValidationResolution =
      modularAssetBindingResolution.matched && assetValidationPlacementIntent
        ? resolveDeveloperOnlyAtlasAssetWorldValidationFoundation(
            internal.atlasAssetWorldValidationFoundation,
            {
              assetFamilyId:
                assetFamilyMaterialCohesionResolution.assetFamilyId,
              selectedAssetId: modularAssetBindingResolution.selectedAssetId,
              assetVariantId: modularAssetBindingResolution.assetVariantId,
              materialFamilyId:
                assetFamilyMaterialCohesionResolution.materialFamilyId,
              paletteProfileId:
                settlementIdentityStyleCohesionResolution.paletteProfileId,
              lodProfileId: modularAssetBindingResolution.lodProfileId,
              placementIntent: assetValidationPlacementIntent,
              coordinate: feature.coordinate
            }
          )
        : deepFreeze({
            atlasAssetPackageId: null,
            assetValidationStatus: "not_validated",
            bindingValidationReason:
              modularAssetBindingResolution.matched
                ? "PLACEMENT_INTENT_UNAVAILABLE"
                : "MODULAR_BINDING_UNAVAILABLE",
            placementValidationStatus: "not_validated",
            rendererHandoffReadiness: "blocked"
          });
    const worldPackageCategory = deriveAtlasWorldPackageCategory({
      assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
      featureClass: feature.featureClass
    });
    const worldPackageValidationResolution =
      modularAssetBindingResolution.matched &&
      worldPackageCategory &&
      assetWorldValidationResolution.atlasAssetPackageId
        ? resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage(
            internal.atlasAssetCompatibilityWorldPackages,
            {
              packageCategory: worldPackageCategory,
              atlasAssetPackageId:
                assetWorldValidationResolution.atlasAssetPackageId,
              assetFamilyId:
                assetFamilyMaterialCohesionResolution.assetFamilyId,
              selectedAssetId: modularAssetBindingResolution.selectedAssetId,
              assetVariantId: modularAssetBindingResolution.assetVariantId,
              materialFamilyId:
                assetFamilyMaterialCohesionResolution.materialFamilyId,
              paletteProfileId:
                settlementIdentityStyleCohesionResolution.paletteProfileId,
              biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
              settlementIdentityId:
                settlementIdentityStyleCohesionResolution.settlementIdentityId,
              childAssetIds: microClusterAdjacencyResolution.childAssetIds
            }
          )
        : deepFreeze({
            worldPackageId: null,
            packageValidationStatus: "blocked",
            compatibleAssetCount: 0,
            blockedAssetCount: 0,
            packageReason:
              worldPackageCategory == null
                ? "WORLD_PACKAGE_CATEGORY_UNAVAILABLE"
                : "ASSET_WORLD_VALIDATION_UNAVAILABLE"
          });
    const packageProfileResolution =
      worldPackageValidationResolution.worldPackageId &&
      worldPackageCategory
        ? resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile(
            internal.atlasAssetBiomeSettlementPackageProfiles,
            {
              settlementIdentityId:
                settlementIdentityStyleCohesionResolution.settlementIdentityId,
              biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
              worldPackageCategory,
              worldPackageId: worldPackageValidationResolution.worldPackageId
            }
          )
        : deepFreeze({
            settlementPackageProfileId: null,
            biomePackageProfileId: null,
            resolvedWorldPackageId: null,
            profileCompatibilityStatus: "blocked",
            packageSelectionReason: "WORLD_PACKAGE_PROFILE_UNAVAILABLE"
          });
    const themeBundleResolution =
      packageProfileResolution.resolvedWorldPackageId &&
      worldPackageCategory
        ? resolveDeveloperOnlyAtlasWorldThemeStyleBundle(
            internal.atlasWorldThemeStyleBundles,
            {
              settlementPackageProfileId:
                packageProfileResolution.settlementPackageProfileId,
              biomePackageProfileId:
                packageProfileResolution.biomePackageProfileId,
              worldPackageCategory,
              resolvedWorldPackageId:
                packageProfileResolution.resolvedWorldPackageId
            }
          )
        : deepFreeze({
            worldThemeProfileId: null,
            regionalStyleBundleId: null,
            visualCohesionScore: null,
            themeCompatibilityStatus: "blocked",
            themeSelectionReason: "THEME_BUNDLE_UNAVAILABLE"
          });
    const themeSubprofileResolution =
      themeBundleResolution.worldThemeProfileId &&
      assetFamilyMaterialCohesionResolution.assetFamilyId
        ? resolveDeveloperOnlyAtlasThemeSubprofile(
            internal.atlasThemeSubprofileRules,
            {
              worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
              assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId
            }
          )
        : deepFreeze({
            architectureStyleProfileId: null,
            vegetationStyleProfileId: null,
            streetscapeStyleProfileId: null,
            themeSubprofileCompatibility: "blocked",
            styleSubprofileReason: "THEME_SUBPROFILE_UNAVAILABLE"
          });
    const modularBibleStyleBridgeResolution =
      themeSubprofileResolution.architectureStyleProfileId &&
      assetFamilyMaterialCohesionResolution.assetFamilyId &&
      assetFamilyMaterialCohesionResolution.materialFamilyId &&
      assetFamilyMaterialCohesionResolution.paletteProfileId
        ? resolveDeveloperOnlyAtlasModularBibleStyleBridge(
            internal.atlasModularBibleStyleBridge,
            {
              worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
              assetFamilyId: assetFamilyMaterialCohesionResolution.assetFamilyId,
              architectureStyleProfileId:
                themeSubprofileResolution.architectureStyleProfileId,
              vegetationStyleProfileId:
                themeSubprofileResolution.vegetationStyleProfileId,
              streetscapeStyleProfileId:
                themeSubprofileResolution.streetscapeStyleProfileId,
              materialFamilyId:
                assetFamilyMaterialCohesionResolution.materialFamilyId,
              paletteProfileId:
                assetFamilyMaterialCohesionResolution.paletteProfileId
            }
          )
        : deepFreeze({
            modularBibleFamilyId: null,
            componentRecipeId: null,
            assetAssemblyProfileId: null,
            styleBridgeStatus: "blocked",
            bridgeReason: "MODULAR_BIBLE_STYLE_BRIDGE_UNAVAILABLE"
          });
    const materialPaletteFinishCompatibilityResolution =
      modularAssetBindingResolution.assetVariantId &&
      assetFamilyMaterialCohesionResolution.materialFamilyId &&
      settlementIdentityStyleCohesionResolution.paletteProfileId &&
      themeBundleResolution.worldThemeProfileId
        ? resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile(
            internal.atlasMaterialPaletteFinishCompatibilityProfiles,
            {
              assetVariantId: modularAssetBindingResolution.assetVariantId,
              materialFamilyId:
                assetFamilyMaterialCohesionResolution.materialFamilyId,
              paletteProfileId:
                settlementIdentityStyleCohesionResolution.paletteProfileId,
              worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
              settlementIdentityId:
                settlementIdentityStyleCohesionResolution.settlementIdentityId,
              biomeProfileId: biomeLocalCharacterResolution.biomeProfileId
            }
          )
        : {
            matched: false,
            materialCompatibilityStatus: "blocked",
            paletteCompatibilityStatus: "blocked",
            finishProfileId: null,
            resolvedMaterialProfileId: null,
            materialReason: "MATERIAL_PALETTE_FINISH_COMPATIBILITY_UNAVAILABLE"
          };
    const materialThemeBundleResolution =
      themeBundleResolution.worldThemeProfileId &&
      settlementIdentityStyleCohesionResolution.settlementIdentityId &&
      biomeLocalCharacterResolution.biomeProfileId &&
      assetFamilyMaterialCohesionResolution.materialFamilyId &&
      settlementIdentityStyleCohesionResolution.paletteProfileId &&
      materialPaletteFinishCompatibilityResolution.finishProfileId &&
      materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId
        ? resolveDeveloperOnlyAtlasMaterialThemeBundle(
            internal.atlasMaterialThemeBundles,
            {
              worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
              settlementIdentityId:
                settlementIdentityStyleCohesionResolution.settlementIdentityId,
              biomeProfileId: biomeLocalCharacterResolution.biomeProfileId,
              materialFamilyId:
                assetFamilyMaterialCohesionResolution.materialFamilyId,
              paletteProfileId:
                settlementIdentityStyleCohesionResolution.paletteProfileId,
              finishProfileId:
                materialPaletteFinishCompatibilityResolution.finishProfileId,
              resolvedMaterialProfileId:
                materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId
            }
          )
        : {
            matched: false,
            materialThemeBundleId: null,
            resolvedFinishSetId: null,
            resolvedPaletteSetId: null,
            materialBundleCompatibilityStatus: "blocked",
            materialBundleReason: "MATERIAL_THEME_BUNDLE_UNAVAILABLE"
          };
    const materialSlotResolution =
      modularAssetBindingResolution.assetVariantId &&
      materialThemeBundleResolution.materialThemeBundleId &&
      materialPaletteFinishCompatibilityResolution.finishProfileId &&
      materialThemeBundleResolution.resolvedFinishSetId
        ? resolveDeveloperOnlyAtlasMaterialSlotSet(
            internal.atlasMaterialSlotResolution,
            {
              assetVariantId: modularAssetBindingResolution.assetVariantId,
              materialThemeBundleId:
                materialThemeBundleResolution.materialThemeBundleId,
              finishProfileId:
                materialPaletteFinishCompatibilityResolution.finishProfileId,
              resolvedFinishSetId:
                materialThemeBundleResolution.resolvedFinishSetId
            }
          )
        : {
            matched: false,
            materialSlotSetId: null,
            resolvedSlotCount: 0,
            assignedMaterialCount: 0,
            slotCompatibilityStatus: "blocked",
            slotResolutionReason: "MATERIAL_SLOT_RESOLUTION_UNAVAILABLE"
          };
    const componentAssemblyRuleResolution =
      modularBibleStyleBridgeResolution.modularBibleFamilyId &&
      modularBibleStyleBridgeResolution.componentRecipeId &&
      modularBibleStyleBridgeResolution.assetAssemblyProfileId &&
      biomeLocalCharacterResolution.biomeProfileId
        ? resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile(
            internal.atlasComponentAssemblyRuleProfiles,
            {
              modularBibleFamilyId:
                modularBibleStyleBridgeResolution.modularBibleFamilyId,
              componentRecipeId:
                modularBibleStyleBridgeResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeResolution.assetAssemblyProfileId,
              featureClass: feature.featureClass,
              biomeProfileId: biomeLocalCharacterResolution.biomeProfileId
            }
          )
        : deepFreeze({
            componentCompatibilityStatus: "blocked",
            assemblyRuleProfileId: null,
            requiredComponentCount: 0,
            validatedComponentCount: 0,
            assemblyReason: "COMPONENT_ASSEMBLY_RULE_UNAVAILABLE"
          });
    const componentSurfaceMappingResolution =
      modularBibleStyleBridgeResolution.componentRecipeId &&
      modularBibleStyleBridgeResolution.assetAssemblyProfileId &&
      materialSlotResolution.materialSlotSetId &&
      componentAssemblyRuleResolution.componentCompatibilityStatus
        ? resolveDeveloperOnlyAtlasComponentSurfaceMapping(
            internal.atlasComponentSurfaceMapping,
            {
              componentRecipeId:
                modularBibleStyleBridgeResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeResolution.assetAssemblyProfileId,
              materialSlotSetId: materialSlotResolution.materialSlotSetId,
              slotCompatibilityStatus:
                materialSlotResolution.slotCompatibilityStatus
            }
          )
        : {
            matched: false,
            surfaceMappingProfileId: null,
            componentAnchorSetId: null,
            resolvedAnchorCount: 0,
            mappedComponentCount: 0,
            surfaceMappingReason: "COMPONENT_SURFACE_MAPPING_UNAVAILABLE"
          };
    const attachmentMetadataResolution =
      componentSurfaceMappingResolution.surfaceMappingProfileId &&
      componentSurfaceMappingResolution.componentAnchorSetId &&
      modularBibleStyleBridgeResolution.componentRecipeId &&
      modularBibleStyleBridgeResolution.assetAssemblyProfileId
        ? resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation(
            internal.atlasAttachmentMetadataGlbPreparation,
            {
              surfaceMappingProfileId:
                componentSurfaceMappingResolution.surfaceMappingProfileId,
              componentAnchorSetId:
                componentSurfaceMappingResolution.componentAnchorSetId,
              componentRecipeId:
                modularBibleStyleBridgeResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeResolution.assetAssemblyProfileId
            }
          )
        : {
            matched: false,
            attachmentMetadataProfileId: null,
            glbPreparationProfileId: null,
            socketMetadataCount: 0,
            componentMetadataCount: 0,
            attachmentMetadataReason:
              "ATTACHMENT_METADATA_GLB_PREPARATION_UNAVAILABLE"
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
    state.assetVariantEnvelopeId =
      variantStructuralCompatibilityResolution.assetVariantEnvelopeId;
    state.structuralCompatibilityStatus =
      variantStructuralCompatibilityResolution.structuralCompatibilityStatus;
    state.selectedVariantProfileId =
      variantStructuralCompatibilityResolution.selectedVariantProfileId;
    state.variantConstraintReason =
      variantStructuralCompatibilityResolution.variantConstraintReason;
    state.variantSelectionSeed =
      variantStructuralCompatibilityResolution.variantSelectionSeed;
    state.materialCompatibilityStatus =
      materialPaletteFinishCompatibilityResolution.materialCompatibilityStatus;
    state.paletteCompatibilityStatus =
      materialPaletteFinishCompatibilityResolution.paletteCompatibilityStatus;
    state.finishProfileId =
      materialPaletteFinishCompatibilityResolution.finishProfileId;
    state.resolvedMaterialProfileId =
      materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId;
    state.materialReason =
      materialPaletteFinishCompatibilityResolution.materialReason;
    state.materialThemeBundleId =
      materialThemeBundleResolution.materialThemeBundleId;
    state.resolvedFinishSetId =
      materialThemeBundleResolution.resolvedFinishSetId;
    state.resolvedPaletteSetId =
      materialThemeBundleResolution.resolvedPaletteSetId;
    state.materialBundleCompatibilityStatus =
      materialThemeBundleResolution.materialBundleCompatibilityStatus;
    state.materialBundleReason =
      materialThemeBundleResolution.materialBundleReason;
    state.materialSlotSetId = materialSlotResolution.materialSlotSetId;
    state.resolvedSlotCount = materialSlotResolution.resolvedSlotCount;
    state.assignedMaterialCount = materialSlotResolution.assignedMaterialCount;
    state.slotCompatibilityStatus =
      materialSlotResolution.slotCompatibilityStatus;
    state.slotResolutionReason = materialSlotResolution.slotResolutionReason;
    state.surfaceMappingProfileId =
      componentSurfaceMappingResolution.surfaceMappingProfileId;
    state.componentAnchorSetId =
      componentSurfaceMappingResolution.componentAnchorSetId;
    state.resolvedAnchorCount =
      componentSurfaceMappingResolution.resolvedAnchorCount;
    state.mappedComponentCount =
      componentSurfaceMappingResolution.mappedComponentCount;
    state.surfaceMappingReason =
      componentSurfaceMappingResolution.surfaceMappingReason;
    state.attachmentMetadataProfileId =
      attachmentMetadataResolution.attachmentMetadataProfileId;
    state.glbPreparationProfileId =
      attachmentMetadataResolution.glbPreparationProfileId;
    state.socketMetadataCount = attachmentMetadataResolution.socketMetadataCount;
    state.componentMetadataCount =
      attachmentMetadataResolution.componentMetadataCount;
    state.attachmentMetadataReason =
      attachmentMetadataResolution.attachmentMetadataReason;
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
    state.specialSiteType = specialSiteAccentResolution.specialSiteType;
    state.landmarkAccentProfileId =
      specialSiteAccentResolution.landmarkAccentProfileId;
    state.cornerLotAccentId = specialSiteAccentResolution.cornerLotAccentId;
    state.visibilityPriority = specialSiteAccentResolution.visibilityPriority;
    state.specialSiteReason = specialSiteAccentResolution.specialSiteReason;
    state.viewCorridorId = destinationFramingResolution.viewCorridorId;
    state.approachSequenceId = destinationFramingResolution.approachSequenceId;
    state.destinationFrameProfileId =
      destinationFramingResolution.destinationFrameProfileId;
    state.arrivalReason = destinationFramingResolution.arrivalReason;
    state.routeMemoryId = routeGuidanceResolution.routeMemoryId;
    state.wayfindingProfileId = routeGuidanceResolution.wayfindingProfileId;
    state.explorationRouteType =
      routeGuidanceResolution.explorationRouteType;
    state.guidanceReason = routeGuidanceResolution.guidanceReason;
    state.routePriority = routeGuidanceResolution.routePriority;
    state.placeMemoryId = placeMemoryResolution.placeMemoryId;
    state.storyCategory = placeMemoryResolution.storyCategory;
    state.localNarrativeProfileId =
      placeMemoryResolution.localNarrativeProfileId;
    state.discoveryImportance = placeMemoryResolution.discoveryImportance;
    state.storyReason = placeMemoryResolution.storyReason;
    state.memoryStateId = seasonalStoryMemoryResolution.memoryStateId;
    state.seasonalStoryProfileId =
      seasonalStoryMemoryResolution.seasonalStoryProfileId;
    state.eventHookProfileId = seasonalStoryMemoryResolution.eventHookProfileId;
    state.returnVisitCategory =
      seasonalStoryMemoryResolution.returnVisitCategory;
    state.storyEvolutionReason =
      seasonalStoryMemoryResolution.storyEvolutionReason;
    state.activityProfileId = activitySocialRhythmResolution.activityProfileId;
    state.socialRhythmId = activitySocialRhythmResolution.socialRhythmId;
    state.timeContextProfile = activitySocialRhythmResolution.timeContextProfile;
    state.activityReason = activitySocialRhythmResolution.activityReason;
    state.communityImportance =
      activitySocialRhythmResolution.communityImportance;
    state.civicRoutineProfileId =
      civicRoutineGatheringResolution.civicRoutineProfileId;
    state.gatheringPatternId =
      civicRoutineGatheringResolution.gatheringPatternId;
    state.temporalUseProfile =
      civicRoutineGatheringResolution.temporalUseProfile;
    state.communityRole = civicRoutineGatheringResolution.communityRole;
    state.routineReason = civicRoutineGatheringResolution.routineReason;
    state.serviceRoleId = localEconomyServiceResolution.serviceRoleId;
    state.economyProfileId = localEconomyServiceResolution.economyProfileId;
    state.marketCycleProfileId =
      localEconomyServiceResolution.marketCycleProfileId;
    state.serviceImportance = localEconomyServiceResolution.serviceImportance;
    state.economyReason = localEconomyServiceResolution.economyReason;
    state.mobilityProfileId = localMobilityAccessResolution.mobilityProfileId;
    state.accessPatternId = localMobilityAccessResolution.accessPatternId;
    state.flowPriority = localMobilityAccessResolution.flowPriority;
    state.movementReason = localMobilityAccessResolution.movementReason;
    state.accessibilityProfile =
      localMobilityAccessResolution.accessibilityProfile;
    state.occupancyProfileId = placeLivenessResolution.occupancyProfileId;
    state.timePresenceProfile = placeLivenessResolution.timePresenceProfile;
    state.livenessCategory = placeLivenessResolution.livenessCategory;
    state.peakActivityWindow = placeLivenessResolution.peakActivityWindow;
    state.presenceReason = placeLivenessResolution.presenceReason;
    state.weeklyRoutineProfileId =
      weeklyRoutineRecurrenceResolution.weeklyRoutineProfileId;
    state.recurrencePatternId =
      weeklyRoutineRecurrenceResolution.recurrencePatternId;
    state.communityCadenceId =
      weeklyRoutineRecurrenceResolution.communityCadenceId;
    state.eventFrequency = weeklyRoutineRecurrenceResolution.eventFrequency;
    state.recurrenceReason = weeklyRoutineRecurrenceResolution.recurrenceReason;
    state.traditionProfileId = traditionEventCycleResolution.traditionProfileId;
    state.seasonalEventCycleId =
      traditionEventCycleResolution.seasonalEventCycleId;
    state.communityTraditionId =
      traditionEventCycleResolution.communityTraditionId;
    state.eventImportance = traditionEventCycleResolution.eventImportance;
    state.traditionReason = traditionEventCycleResolution.traditionReason;
    state.festivalProfileId = festivalQuestNarrativeResolution.festivalProfileId;
    state.questNarrativeProfileId =
      festivalQuestNarrativeResolution.questNarrativeProfileId;
    state.seasonalDestinationProfileId =
      festivalQuestNarrativeResolution.seasonalDestinationProfileId;
    state.achievementHookProfileId =
      festivalQuestNarrativeResolution.achievementHookProfileId;
    state.narrativeReason = festivalQuestNarrativeResolution.narrativeReason;
    state.campaignProfileId = explorationProgressionResolution.campaignProfileId;
    state.destinationChainId =
      explorationProgressionResolution.destinationChainId;
    state.rewardArcProfileId =
      explorationProgressionResolution.rewardArcProfileId;
    state.progressionTier = explorationProgressionResolution.progressionTier;
    state.explorationReason =
      explorationProgressionResolution.explorationReason;
    state.expeditionProfileId = regionalExpeditionResolution.expeditionProfileId;
    state.campaignNetworkId = regionalExpeditionResolution.campaignNetworkId;
    state.completionArcId = regionalExpeditionResolution.completionArcId;
    state.regionalIdentityId = regionalExpeditionResolution.regionalIdentityId;
    state.expeditionReason = regionalExpeditionResolution.expeditionReason;
    state.worldJourneyProfileId =
      worldExplorationCohesionResolution.worldJourneyProfileId;
    state.metaCollectionId = worldExplorationCohesionResolution.metaCollectionId;
    state.crossRegionCampaignId =
      worldExplorationCohesionResolution.crossRegionCampaignId;
    state.explorationTier = worldExplorationCohesionResolution.explorationTier;
    state.worldCohesionReason =
      worldExplorationCohesionResolution.worldCohesionReason;
    state.signatureRouteProfileId =
      signatureRouteLegacyResolution.signatureRouteProfileId;
    state.legacyDestinationId =
      signatureRouteLegacyResolution.legacyDestinationId;
    state.mythologyProfileId = signatureRouteLegacyResolution.mythologyProfileId;
    state.globalJourneyTier = signatureRouteLegacyResolution.globalJourneyTier;
    state.legacyReason = signatureRouteLegacyResolution.legacyReason;
    state.worldWonderProfileId =
      worldWonderDiscoveryMemoryResolution.worldWonderProfileId;
    state.epicDestinationId =
      worldWonderDiscoveryMemoryResolution.epicDestinationId;
    state.discoveryMemoryTier =
      worldWonderDiscoveryMemoryResolution.discoveryMemoryTier;
    state.generationMemoryProfileId =
      worldWonderDiscoveryMemoryResolution.generationMemoryProfileId;
    state.wonderReason = worldWonderDiscoveryMemoryResolution.wonderReason;
    state.worldLegacyProfileId =
      worldLegacyDiscoveryCohesionResolution.worldLegacyProfileId;
    state.discoveryCohesionId =
      worldLegacyDiscoveryCohesionResolution.discoveryCohesionId;
    state.legacyTier = worldLegacyDiscoveryCohesionResolution.legacyTier;
    state.memoryCategory =
      worldLegacyDiscoveryCohesionResolution.memoryCategory;
    state.legacyReason = worldLegacyDiscoveryCohesionResolution.legacyReason;
    state.atlasAssetPackageId =
      assetWorldValidationResolution.atlasAssetPackageId;
    state.assetValidationStatus =
      assetWorldValidationResolution.assetValidationStatus;
    state.bindingValidationReason =
      assetWorldValidationResolution.bindingValidationReason;
    state.placementValidationStatus =
      assetWorldValidationResolution.placementValidationStatus;
    state.rendererHandoffReadiness =
      assetWorldValidationResolution.rendererHandoffReadiness;
    state.worldPackageId = worldPackageValidationResolution.worldPackageId;
    state.packageValidationStatus =
      worldPackageValidationResolution.packageValidationStatus;
    state.compatibleAssetCount =
      worldPackageValidationResolution.compatibleAssetCount;
    state.blockedAssetCount =
      worldPackageValidationResolution.blockedAssetCount;
    state.packageReason = worldPackageValidationResolution.packageReason;
    state.settlementPackageProfileId =
      packageProfileResolution.settlementPackageProfileId;
    state.biomePackageProfileId = packageProfileResolution.biomePackageProfileId;
    state.resolvedWorldPackageId = packageProfileResolution.resolvedWorldPackageId;
    state.profileCompatibilityStatus =
      packageProfileResolution.profileCompatibilityStatus;
    state.packageSelectionReason = packageProfileResolution.packageSelectionReason;
    state.worldThemeProfileId = themeBundleResolution.worldThemeProfileId;
    state.regionalStyleBundleId = themeBundleResolution.regionalStyleBundleId;
    state.visualCohesionScore = themeBundleResolution.visualCohesionScore;
    state.themeCompatibilityStatus =
      themeBundleResolution.themeCompatibilityStatus;
    state.themeSelectionReason = themeBundleResolution.themeSelectionReason;
    state.architectureStyleProfileId =
      themeSubprofileResolution.architectureStyleProfileId;
    state.vegetationStyleProfileId =
      themeSubprofileResolution.vegetationStyleProfileId;
    state.streetscapeStyleProfileId =
      themeSubprofileResolution.streetscapeStyleProfileId;
    state.themeSubprofileCompatibility =
      themeSubprofileResolution.themeSubprofileCompatibility;
    state.styleSubprofileReason =
      themeSubprofileResolution.styleSubprofileReason;
    state.modularBibleFamilyId =
      modularBibleStyleBridgeResolution.modularBibleFamilyId;
    state.componentRecipeId =
      modularBibleStyleBridgeResolution.componentRecipeId;
    state.assetAssemblyProfileId =
      modularBibleStyleBridgeResolution.assetAssemblyProfileId;
    state.styleBridgeStatus =
      modularBibleStyleBridgeResolution.styleBridgeStatus;
    state.bridgeReason = modularBibleStyleBridgeResolution.bridgeReason;
    state.componentCompatibilityStatus =
      componentAssemblyRuleResolution.componentCompatibilityStatus;
    state.assemblyRuleProfileId =
      componentAssemblyRuleResolution.assemblyRuleProfileId;
    state.requiredComponentCount =
      componentAssemblyRuleResolution.requiredComponentCount;
    state.validatedComponentCount =
      componentAssemblyRuleResolution.validatedComponentCount;
    state.assemblyReason = componentAssemblyRuleResolution.assemblyReason;
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
    variantStructuralCompatibilityDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        assetVariantEnvelopeId:
          variantStructuralCompatibilityResolution.assetVariantEnvelopeId,
        structuralCompatibilityStatus:
          variantStructuralCompatibilityResolution.structuralCompatibilityStatus,
        selectedVariantProfileId:
          variantStructuralCompatibilityResolution.selectedVariantProfileId,
        variantConstraintReason:
          variantStructuralCompatibilityResolution.variantConstraintReason,
        variantSelectionSeed:
          variantStructuralCompatibilityResolution.variantSelectionSeed
      })
    );
    assetWorldValidationDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        atlasAssetPackageId: assetWorldValidationResolution.atlasAssetPackageId,
        assetValidationStatus:
          assetWorldValidationResolution.assetValidationStatus,
        bindingValidationReason:
          assetWorldValidationResolution.bindingValidationReason,
        placementValidationStatus:
          assetWorldValidationResolution.placementValidationStatus,
        rendererHandoffReadiness:
          assetWorldValidationResolution.rendererHandoffReadiness
      })
    );
    worldPackageValidationDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        worldPackageId: worldPackageValidationResolution.worldPackageId,
        packageValidationStatus:
          worldPackageValidationResolution.packageValidationStatus,
        compatibleAssetCount:
          worldPackageValidationResolution.compatibleAssetCount,
        blockedAssetCount:
          worldPackageValidationResolution.blockedAssetCount,
        packageReason: worldPackageValidationResolution.packageReason
      })
    );
    packageProfileDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        settlementPackageProfileId:
          packageProfileResolution.settlementPackageProfileId,
        biomePackageProfileId: packageProfileResolution.biomePackageProfileId,
        resolvedWorldPackageId: packageProfileResolution.resolvedWorldPackageId,
        profileCompatibilityStatus:
          packageProfileResolution.profileCompatibilityStatus,
        packageSelectionReason:
          packageProfileResolution.packageSelectionReason
      })
    );
    worldThemeBundleDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
        regionalStyleBundleId: themeBundleResolution.regionalStyleBundleId,
        visualCohesionScore: themeBundleResolution.visualCohesionScore,
        themeCompatibilityStatus:
          themeBundleResolution.themeCompatibilityStatus,
        themeSelectionReason: themeBundleResolution.themeSelectionReason
      })
    );
    themeSubprofileDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        architectureStyleProfileId:
          themeSubprofileResolution.architectureStyleProfileId,
        vegetationStyleProfileId:
          themeSubprofileResolution.vegetationStyleProfileId,
        streetscapeStyleProfileId:
          themeSubprofileResolution.streetscapeStyleProfileId,
        themeSubprofileCompatibility:
          themeSubprofileResolution.themeSubprofileCompatibility,
        styleSubprofileReason:
          themeSubprofileResolution.styleSubprofileReason
      })
    );
    modularBibleStyleBridgeDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        modularBibleFamilyId:
          modularBibleStyleBridgeResolution.modularBibleFamilyId,
        componentRecipeId: modularBibleStyleBridgeResolution.componentRecipeId,
        assetAssemblyProfileId:
          modularBibleStyleBridgeResolution.assetAssemblyProfileId,
        styleBridgeStatus:
          modularBibleStyleBridgeResolution.styleBridgeStatus,
        bridgeReason: modularBibleStyleBridgeResolution.bridgeReason
      })
    );
    componentAssemblyRuleDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        componentCompatibilityStatus:
          componentAssemblyRuleResolution.componentCompatibilityStatus,
        assemblyRuleProfileId:
          componentAssemblyRuleResolution.assemblyRuleProfileId,
        requiredComponentCount:
          componentAssemblyRuleResolution.requiredComponentCount,
        validatedComponentCount:
          componentAssemblyRuleResolution.validatedComponentCount,
        assemblyReason: componentAssemblyRuleResolution.assemblyReason
      })
    );
    materialPaletteFinishCompatibilityDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        materialCompatibilityStatus:
          materialPaletteFinishCompatibilityResolution.materialCompatibilityStatus,
        paletteCompatibilityStatus:
          materialPaletteFinishCompatibilityResolution.paletteCompatibilityStatus,
        finishProfileId:
          materialPaletteFinishCompatibilityResolution.finishProfileId,
        resolvedMaterialProfileId:
          materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId,
        materialReason:
          materialPaletteFinishCompatibilityResolution.materialReason
      })
    );
    materialThemeBundleDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        materialThemeBundleId: materialThemeBundleResolution.materialThemeBundleId,
        resolvedFinishSetId: materialThemeBundleResolution.resolvedFinishSetId,
        resolvedPaletteSetId: materialThemeBundleResolution.resolvedPaletteSetId,
        materialBundleCompatibilityStatus:
          materialThemeBundleResolution.materialBundleCompatibilityStatus,
        materialBundleReason: materialThemeBundleResolution.materialBundleReason
      })
    );
    materialSlotResolutionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        materialSlotSetId: materialSlotResolution.materialSlotSetId,
        resolvedSlotCount: materialSlotResolution.resolvedSlotCount,
        assignedMaterialCount: materialSlotResolution.assignedMaterialCount,
        slotCompatibilityStatus: materialSlotResolution.slotCompatibilityStatus,
        slotResolutionReason: materialSlotResolution.slotResolutionReason
      })
    );
    componentSurfaceMappingDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        surfaceMappingProfileId:
          componentSurfaceMappingResolution.surfaceMappingProfileId,
        componentAnchorSetId:
          componentSurfaceMappingResolution.componentAnchorSetId,
        resolvedAnchorCount:
          componentSurfaceMappingResolution.resolvedAnchorCount,
        mappedComponentCount:
          componentSurfaceMappingResolution.mappedComponentCount,
        surfaceMappingReason: componentSurfaceMappingResolution.surfaceMappingReason
      })
    );
    attachmentMetadataDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        attachmentMetadataProfileId:
          attachmentMetadataResolution.attachmentMetadataProfileId,
        glbPreparationProfileId:
          attachmentMetadataResolution.glbPreparationProfileId,
        socketMetadataCount: attachmentMetadataResolution.socketMetadataCount,
        componentMetadataCount:
          attachmentMetadataResolution.componentMetadataCount,
        attachmentMetadataReason:
          attachmentMetadataResolution.attachmentMetadataReason
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
    specialSiteAccentDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        specialSiteType: specialSiteAccentResolution.specialSiteType,
        landmarkAccentProfileId:
          specialSiteAccentResolution.landmarkAccentProfileId,
        cornerLotAccentId: specialSiteAccentResolution.cornerLotAccentId,
        visibilityPriority: specialSiteAccentResolution.visibilityPriority,
        specialSiteReason: specialSiteAccentResolution.specialSiteReason
      })
    );
    destinationFramingDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        viewCorridorId: destinationFramingResolution.viewCorridorId,
        approachSequenceId: destinationFramingResolution.approachSequenceId,
        destinationFrameProfileId:
          destinationFramingResolution.destinationFrameProfileId,
        arrivalReason: destinationFramingResolution.arrivalReason,
        visibilityPriority: destinationFramingResolution.visibilityPriority
      })
    );
    routeGuidanceDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        routeMemoryId: routeGuidanceResolution.routeMemoryId,
        wayfindingProfileId: routeGuidanceResolution.wayfindingProfileId,
        explorationRouteType: routeGuidanceResolution.explorationRouteType,
        guidanceReason: routeGuidanceResolution.guidanceReason,
        routePriority: routeGuidanceResolution.routePriority
      })
    );
    placeMemoryDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        placeMemoryId: placeMemoryResolution.placeMemoryId,
        storyCategory: placeMemoryResolution.storyCategory,
        localNarrativeProfileId:
          placeMemoryResolution.localNarrativeProfileId,
        discoveryImportance: placeMemoryResolution.discoveryImportance,
        storyReason: placeMemoryResolution.storyReason
      })
    );
    seasonalStoryMemoryDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        memoryStateId: seasonalStoryMemoryResolution.memoryStateId,
        seasonalStoryProfileId:
          seasonalStoryMemoryResolution.seasonalStoryProfileId,
        eventHookProfileId: seasonalStoryMemoryResolution.eventHookProfileId,
        returnVisitCategory:
          seasonalStoryMemoryResolution.returnVisitCategory,
        storyEvolutionReason:
          seasonalStoryMemoryResolution.storyEvolutionReason
      })
    );
    activitySocialRhythmDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        activityProfileId: activitySocialRhythmResolution.activityProfileId,
        socialRhythmId: activitySocialRhythmResolution.socialRhythmId,
        timeContextProfile: activitySocialRhythmResolution.timeContextProfile,
        activityReason: activitySocialRhythmResolution.activityReason,
        communityImportance: activitySocialRhythmResolution.communityImportance
      })
    );
    civicRoutineGatheringDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        civicRoutineProfileId:
          civicRoutineGatheringResolution.civicRoutineProfileId,
        gatheringPatternId:
          civicRoutineGatheringResolution.gatheringPatternId,
        temporalUseProfile: civicRoutineGatheringResolution.temporalUseProfile,
        communityRole: civicRoutineGatheringResolution.communityRole,
        routineReason: civicRoutineGatheringResolution.routineReason
      })
    );
    localEconomyServiceDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        serviceRoleId: localEconomyServiceResolution.serviceRoleId,
        economyProfileId: localEconomyServiceResolution.economyProfileId,
        marketCycleProfileId:
          localEconomyServiceResolution.marketCycleProfileId,
        serviceImportance: localEconomyServiceResolution.serviceImportance,
        economyReason: localEconomyServiceResolution.economyReason
      })
    );
    localMobilityAccessDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        mobilityProfileId: localMobilityAccessResolution.mobilityProfileId,
        accessPatternId: localMobilityAccessResolution.accessPatternId,
        flowPriority: localMobilityAccessResolution.flowPriority,
        movementReason: localMobilityAccessResolution.movementReason,
        accessibilityProfile:
          localMobilityAccessResolution.accessibilityProfile
      })
    );
    placeLivenessDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        occupancyProfileId: placeLivenessResolution.occupancyProfileId,
        timePresenceProfile: placeLivenessResolution.timePresenceProfile,
        livenessCategory: placeLivenessResolution.livenessCategory,
        peakActivityWindow: placeLivenessResolution.peakActivityWindow,
        presenceReason: placeLivenessResolution.presenceReason
      })
    );
    weeklyRoutineRecurrenceDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        weeklyRoutineProfileId:
          weeklyRoutineRecurrenceResolution.weeklyRoutineProfileId,
        recurrencePatternId:
          weeklyRoutineRecurrenceResolution.recurrencePatternId,
        communityCadenceId:
          weeklyRoutineRecurrenceResolution.communityCadenceId,
        eventFrequency: weeklyRoutineRecurrenceResolution.eventFrequency,
        recurrenceReason: weeklyRoutineRecurrenceResolution.recurrenceReason
      })
    );
    traditionEventCycleDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        traditionProfileId: traditionEventCycleResolution.traditionProfileId,
        seasonalEventCycleId:
          traditionEventCycleResolution.seasonalEventCycleId,
        communityTraditionId:
          traditionEventCycleResolution.communityTraditionId,
        eventImportance: traditionEventCycleResolution.eventImportance,
        traditionReason: traditionEventCycleResolution.traditionReason
      })
    );
    festivalQuestNarrativeDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        festivalProfileId: festivalQuestNarrativeResolution.festivalProfileId,
        questNarrativeProfileId:
          festivalQuestNarrativeResolution.questNarrativeProfileId,
        seasonalDestinationProfileId:
          festivalQuestNarrativeResolution.seasonalDestinationProfileId,
        achievementHookProfileId:
          festivalQuestNarrativeResolution.achievementHookProfileId,
        narrativeReason: festivalQuestNarrativeResolution.narrativeReason
      })
    );
    explorationProgressionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        campaignProfileId: explorationProgressionResolution.campaignProfileId,
        destinationChainId: explorationProgressionResolution.destinationChainId,
        rewardArcProfileId: explorationProgressionResolution.rewardArcProfileId,
        progressionTier: explorationProgressionResolution.progressionTier,
        explorationReason: explorationProgressionResolution.explorationReason
      })
    );
    regionalExpeditionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        expeditionProfileId: regionalExpeditionResolution.expeditionProfileId,
        campaignNetworkId: regionalExpeditionResolution.campaignNetworkId,
        completionArcId: regionalExpeditionResolution.completionArcId,
        regionalIdentityId: regionalExpeditionResolution.regionalIdentityId,
        expeditionReason: regionalExpeditionResolution.expeditionReason
      })
    );
    worldExplorationCohesionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        worldJourneyProfileId:
          worldExplorationCohesionResolution.worldJourneyProfileId,
        metaCollectionId: worldExplorationCohesionResolution.metaCollectionId,
        crossRegionCampaignId:
          worldExplorationCohesionResolution.crossRegionCampaignId,
        explorationTier: worldExplorationCohesionResolution.explorationTier,
        worldCohesionReason:
          worldExplorationCohesionResolution.worldCohesionReason
      })
    );
    signatureRouteLegacyDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        signatureRouteProfileId:
          signatureRouteLegacyResolution.signatureRouteProfileId,
        legacyDestinationId:
          signatureRouteLegacyResolution.legacyDestinationId,
        mythologyProfileId: signatureRouteLegacyResolution.mythologyProfileId,
        globalJourneyTier: signatureRouteLegacyResolution.globalJourneyTier,
        legacyReason: signatureRouteLegacyResolution.legacyReason
      })
    );
    worldWonderDiscoveryMemoryDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        worldWonderProfileId:
          worldWonderDiscoveryMemoryResolution.worldWonderProfileId,
        epicDestinationId:
          worldWonderDiscoveryMemoryResolution.epicDestinationId,
        discoveryMemoryTier:
          worldWonderDiscoveryMemoryResolution.discoveryMemoryTier,
        generationMemoryProfileId:
          worldWonderDiscoveryMemoryResolution.generationMemoryProfileId,
        wonderReason: worldWonderDiscoveryMemoryResolution.wonderReason
      })
    );
    worldLegacyDiscoveryCohesionDecisions.push(
      deepFreeze({
        featureId: feature.featureId,
        worldLegacyProfileId:
          worldLegacyDiscoveryCohesionResolution.worldLegacyProfileId,
        discoveryCohesionId:
          worldLegacyDiscoveryCohesionResolution.discoveryCohesionId,
        legacyTier: worldLegacyDiscoveryCohesionResolution.legacyTier,
        memoryCategory: worldLegacyDiscoveryCohesionResolution.memoryCategory,
        legacyReason: worldLegacyDiscoveryCohesionResolution.legacyReason
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
          assetVariantEnvelopeId:
            variantStructuralCompatibilityResolution.assetVariantEnvelopeId,
          structuralCompatibilityStatus:
            variantStructuralCompatibilityResolution.structuralCompatibilityStatus,
          selectedVariantProfileId:
            variantStructuralCompatibilityResolution.selectedVariantProfileId,
          variantConstraintReason:
            variantStructuralCompatibilityResolution.variantConstraintReason,
          variantSelectionSeed:
            variantStructuralCompatibilityResolution.variantSelectionSeed,
          materialCompatibilityStatus:
            materialPaletteFinishCompatibilityResolution.materialCompatibilityStatus,
          paletteCompatibilityStatus:
            materialPaletteFinishCompatibilityResolution.paletteCompatibilityStatus,
          finishProfileId:
            materialPaletteFinishCompatibilityResolution.finishProfileId,
          resolvedMaterialProfileId:
            materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId,
          materialReason:
            materialPaletteFinishCompatibilityResolution.materialReason,
          materialThemeBundleId:
            materialThemeBundleResolution.materialThemeBundleId,
          resolvedFinishSetId:
            materialThemeBundleResolution.resolvedFinishSetId,
          resolvedPaletteSetId:
            materialThemeBundleResolution.resolvedPaletteSetId,
          materialBundleCompatibilityStatus:
            materialThemeBundleResolution.materialBundleCompatibilityStatus,
          materialBundleReason:
            materialThemeBundleResolution.materialBundleReason,
          materialSlotSetId: materialSlotResolution.materialSlotSetId,
          resolvedSlotCount: materialSlotResolution.resolvedSlotCount,
          assignedMaterialCount: materialSlotResolution.assignedMaterialCount,
          slotCompatibilityStatus: materialSlotResolution.slotCompatibilityStatus,
          slotResolutionReason: materialSlotResolution.slotResolutionReason,
          surfaceMappingProfileId:
            componentSurfaceMappingResolution.surfaceMappingProfileId,
          componentAnchorSetId:
            componentSurfaceMappingResolution.componentAnchorSetId,
          resolvedAnchorCount:
            componentSurfaceMappingResolution.resolvedAnchorCount,
          mappedComponentCount:
            componentSurfaceMappingResolution.mappedComponentCount,
          surfaceMappingReason:
            componentSurfaceMappingResolution.surfaceMappingReason,
          attachmentMetadataProfileId:
            attachmentMetadataResolution.attachmentMetadataProfileId,
          glbPreparationProfileId:
            attachmentMetadataResolution.glbPreparationProfileId,
          socketMetadataCount: attachmentMetadataResolution.socketMetadataCount,
          componentMetadataCount:
            attachmentMetadataResolution.componentMetadataCount,
          attachmentMetadataReason:
            attachmentMetadataResolution.attachmentMetadataReason,
          materialAssignmentId:
            modularAssetBindingResolution.materialAssignmentId,
          lodProfileId: modularAssetBindingResolution.lodProfileId,
          atlasAssetPackageId:
            assetWorldValidationResolution.atlasAssetPackageId,
          assetValidationStatus:
            assetWorldValidationResolution.assetValidationStatus,
          bindingValidationReason:
            assetWorldValidationResolution.bindingValidationReason,
          placementValidationStatus:
            assetWorldValidationResolution.placementValidationStatus,
          rendererHandoffReadiness:
            assetWorldValidationResolution.rendererHandoffReadiness,
          worldPackageId: worldPackageValidationResolution.worldPackageId,
          packageValidationStatus:
            worldPackageValidationResolution.packageValidationStatus,
          compatibleAssetCount:
            worldPackageValidationResolution.compatibleAssetCount,
          blockedAssetCount:
            worldPackageValidationResolution.blockedAssetCount,
          packageReason: worldPackageValidationResolution.packageReason,
          settlementPackageProfileId:
            packageProfileResolution.settlementPackageProfileId,
          biomePackageProfileId:
            packageProfileResolution.biomePackageProfileId,
          resolvedWorldPackageId:
            packageProfileResolution.resolvedWorldPackageId,
          profileCompatibilityStatus:
            packageProfileResolution.profileCompatibilityStatus,
          packageSelectionReason:
            packageProfileResolution.packageSelectionReason,
          worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
          regionalStyleBundleId: themeBundleResolution.regionalStyleBundleId,
          visualCohesionScore: themeBundleResolution.visualCohesionScore,
          themeCompatibilityStatus:
            themeBundleResolution.themeCompatibilityStatus,
          themeSelectionReason: themeBundleResolution.themeSelectionReason,
          architectureStyleProfileId:
            themeSubprofileResolution.architectureStyleProfileId,
          vegetationStyleProfileId:
            themeSubprofileResolution.vegetationStyleProfileId,
          streetscapeStyleProfileId:
            themeSubprofileResolution.streetscapeStyleProfileId,
          themeSubprofileCompatibility:
            themeSubprofileResolution.themeSubprofileCompatibility,
          styleSubprofileReason:
            themeSubprofileResolution.styleSubprofileReason,
          modularBibleFamilyId:
            modularBibleStyleBridgeResolution.modularBibleFamilyId,
          componentRecipeId:
            modularBibleStyleBridgeResolution.componentRecipeId,
          assetAssemblyProfileId:
            modularBibleStyleBridgeResolution.assetAssemblyProfileId,
          styleBridgeStatus:
            modularBibleStyleBridgeResolution.styleBridgeStatus,
          bridgeReason: modularBibleStyleBridgeResolution.bridgeReason,
          componentCompatibilityStatus:
            componentAssemblyRuleResolution.componentCompatibilityStatus,
          assemblyRuleProfileId:
            componentAssemblyRuleResolution.assemblyRuleProfileId,
          requiredComponentCount:
            componentAssemblyRuleResolution.requiredComponentCount,
          validatedComponentCount:
            componentAssemblyRuleResolution.validatedComponentCount,
          assemblyReason: componentAssemblyRuleResolution.assemblyReason,
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
          specialSiteType: specialSiteAccentResolution.specialSiteType,
          landmarkAccentProfileId:
            specialSiteAccentResolution.landmarkAccentProfileId,
          cornerLotAccentId: specialSiteAccentResolution.cornerLotAccentId,
          visibilityPriority: specialSiteAccentResolution.visibilityPriority,
          specialSiteReason: specialSiteAccentResolution.specialSiteReason,
          viewCorridorId: destinationFramingResolution.viewCorridorId,
          approachSequenceId: destinationFramingResolution.approachSequenceId,
          destinationFrameProfileId:
            destinationFramingResolution.destinationFrameProfileId,
          arrivalReason: destinationFramingResolution.arrivalReason,
          routeMemoryId: routeGuidanceResolution.routeMemoryId,
          wayfindingProfileId: routeGuidanceResolution.wayfindingProfileId,
          explorationRouteType: routeGuidanceResolution.explorationRouteType,
          guidanceReason: routeGuidanceResolution.guidanceReason,
          routePriority: routeGuidanceResolution.routePriority,
          placeMemoryId: placeMemoryResolution.placeMemoryId,
          storyCategory: placeMemoryResolution.storyCategory,
          localNarrativeProfileId:
            placeMemoryResolution.localNarrativeProfileId,
          discoveryImportance: placeMemoryResolution.discoveryImportance,
          storyReason: placeMemoryResolution.storyReason,
          memoryStateId: seasonalStoryMemoryResolution.memoryStateId,
          seasonalStoryProfileId:
            seasonalStoryMemoryResolution.seasonalStoryProfileId,
          eventHookProfileId:
            seasonalStoryMemoryResolution.eventHookProfileId,
          returnVisitCategory:
            seasonalStoryMemoryResolution.returnVisitCategory,
          storyEvolutionReason:
            seasonalStoryMemoryResolution.storyEvolutionReason,
          activityProfileId: activitySocialRhythmResolution.activityProfileId,
          socialRhythmId: activitySocialRhythmResolution.socialRhythmId,
          timeContextProfile: activitySocialRhythmResolution.timeContextProfile,
          activityReason: activitySocialRhythmResolution.activityReason,
          communityImportance: activitySocialRhythmResolution.communityImportance,
          civicRoutineProfileId:
            civicRoutineGatheringResolution.civicRoutineProfileId,
          gatheringPatternId:
            civicRoutineGatheringResolution.gatheringPatternId,
          temporalUseProfile:
            civicRoutineGatheringResolution.temporalUseProfile,
          communityRole: civicRoutineGatheringResolution.communityRole,
          routineReason: civicRoutineGatheringResolution.routineReason,
          serviceRoleId: localEconomyServiceResolution.serviceRoleId,
          economyProfileId: localEconomyServiceResolution.economyProfileId,
          marketCycleProfileId:
            localEconomyServiceResolution.marketCycleProfileId,
          serviceImportance: localEconomyServiceResolution.serviceImportance,
          economyReason: localEconomyServiceResolution.economyReason,
          mobilityProfileId: localMobilityAccessResolution.mobilityProfileId,
          accessPatternId: localMobilityAccessResolution.accessPatternId,
          flowPriority: localMobilityAccessResolution.flowPriority,
          movementReason: localMobilityAccessResolution.movementReason,
          accessibilityProfile:
            localMobilityAccessResolution.accessibilityProfile,
          occupancyProfileId: placeLivenessResolution.occupancyProfileId,
          timePresenceProfile: placeLivenessResolution.timePresenceProfile,
          livenessCategory: placeLivenessResolution.livenessCategory,
          peakActivityWindow: placeLivenessResolution.peakActivityWindow,
          presenceReason: placeLivenessResolution.presenceReason,
          weeklyRoutineProfileId:
            weeklyRoutineRecurrenceResolution.weeklyRoutineProfileId,
          recurrencePatternId:
            weeklyRoutineRecurrenceResolution.recurrencePatternId,
          communityCadenceId:
            weeklyRoutineRecurrenceResolution.communityCadenceId,
          eventFrequency: weeklyRoutineRecurrenceResolution.eventFrequency,
          recurrenceReason: weeklyRoutineRecurrenceResolution.recurrenceReason,
          traditionProfileId: traditionEventCycleResolution.traditionProfileId,
          seasonalEventCycleId:
            traditionEventCycleResolution.seasonalEventCycleId,
          communityTraditionId:
            traditionEventCycleResolution.communityTraditionId,
          eventImportance: traditionEventCycleResolution.eventImportance,
          traditionReason: traditionEventCycleResolution.traditionReason,
          festivalProfileId: festivalQuestNarrativeResolution.festivalProfileId,
          questNarrativeProfileId:
            festivalQuestNarrativeResolution.questNarrativeProfileId,
          seasonalDestinationProfileId:
            festivalQuestNarrativeResolution.seasonalDestinationProfileId,
          achievementHookProfileId:
            festivalQuestNarrativeResolution.achievementHookProfileId,
          narrativeReason: festivalQuestNarrativeResolution.narrativeReason,
          campaignProfileId: explorationProgressionResolution.campaignProfileId,
          destinationChainId:
            explorationProgressionResolution.destinationChainId,
          rewardArcProfileId:
            explorationProgressionResolution.rewardArcProfileId,
          progressionTier: explorationProgressionResolution.progressionTier,
          explorationReason: explorationProgressionResolution.explorationReason,
          expeditionProfileId: regionalExpeditionResolution.expeditionProfileId,
          campaignNetworkId: regionalExpeditionResolution.campaignNetworkId,
          completionArcId: regionalExpeditionResolution.completionArcId,
          regionalIdentityId: regionalExpeditionResolution.regionalIdentityId,
          expeditionReason: regionalExpeditionResolution.expeditionReason,
          worldJourneyProfileId:
            worldExplorationCohesionResolution.worldJourneyProfileId,
          metaCollectionId: worldExplorationCohesionResolution.metaCollectionId,
          crossRegionCampaignId:
            worldExplorationCohesionResolution.crossRegionCampaignId,
          explorationTier: worldExplorationCohesionResolution.explorationTier,
          worldCohesionReason:
            worldExplorationCohesionResolution.worldCohesionReason,
          signatureRouteProfileId:
            signatureRouteLegacyResolution.signatureRouteProfileId,
          legacyDestinationId:
            signatureRouteLegacyResolution.legacyDestinationId,
          mythologyProfileId:
            signatureRouteLegacyResolution.mythologyProfileId,
          globalJourneyTier: signatureRouteLegacyResolution.globalJourneyTier,
          legacyReason: signatureRouteLegacyResolution.legacyReason,
          worldWonderProfileId:
            worldWonderDiscoveryMemoryResolution.worldWonderProfileId,
          epicDestinationId:
            worldWonderDiscoveryMemoryResolution.epicDestinationId,
          discoveryMemoryTier:
            worldWonderDiscoveryMemoryResolution.discoveryMemoryTier,
          generationMemoryProfileId:
            worldWonderDiscoveryMemoryResolution.generationMemoryProfileId,
          wonderReason: worldWonderDiscoveryMemoryResolution.wonderReason,
          worldLegacyProfileId:
            worldLegacyDiscoveryCohesionResolution.worldLegacyProfileId,
          discoveryCohesionId:
            worldLegacyDiscoveryCohesionResolution.discoveryCohesionId,
          legacyTier: worldLegacyDiscoveryCohesionResolution.legacyTier,
          memoryCategory:
            worldLegacyDiscoveryCohesionResolution.memoryCategory,
          legacyReason: worldLegacyDiscoveryCohesionResolution.legacyReason,
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
          assetVariantEnvelopeId:
            variantStructuralCompatibilityResolution.assetVariantEnvelopeId,
          structuralCompatibilityStatus:
            variantStructuralCompatibilityResolution.structuralCompatibilityStatus,
          selectedVariantProfileId:
            variantStructuralCompatibilityResolution.selectedVariantProfileId,
          variantConstraintReason:
            variantStructuralCompatibilityResolution.variantConstraintReason,
          variantSelectionSeed:
            variantStructuralCompatibilityResolution.variantSelectionSeed,
          materialCompatibilityStatus:
            materialPaletteFinishCompatibilityResolution.materialCompatibilityStatus,
          paletteCompatibilityStatus:
            materialPaletteFinishCompatibilityResolution.paletteCompatibilityStatus,
          finishProfileId:
            materialPaletteFinishCompatibilityResolution.finishProfileId,
          resolvedMaterialProfileId:
            materialPaletteFinishCompatibilityResolution.resolvedMaterialProfileId,
          materialReason:
            materialPaletteFinishCompatibilityResolution.materialReason,
          materialThemeBundleId:
            materialThemeBundleResolution.materialThemeBundleId,
          resolvedFinishSetId:
            materialThemeBundleResolution.resolvedFinishSetId,
          resolvedPaletteSetId:
            materialThemeBundleResolution.resolvedPaletteSetId,
          materialBundleCompatibilityStatus:
            materialThemeBundleResolution.materialBundleCompatibilityStatus,
          materialBundleReason:
            materialThemeBundleResolution.materialBundleReason,
          materialSlotSetId: materialSlotResolution.materialSlotSetId,
          resolvedSlotCount: materialSlotResolution.resolvedSlotCount,
          assignedMaterialCount: materialSlotResolution.assignedMaterialCount,
          slotCompatibilityStatus: materialSlotResolution.slotCompatibilityStatus,
          slotResolutionReason: materialSlotResolution.slotResolutionReason,
          surfaceMappingProfileId:
            componentSurfaceMappingResolution.surfaceMappingProfileId,
          componentAnchorSetId:
            componentSurfaceMappingResolution.componentAnchorSetId,
          resolvedAnchorCount:
            componentSurfaceMappingResolution.resolvedAnchorCount,
          mappedComponentCount:
            componentSurfaceMappingResolution.mappedComponentCount,
          surfaceMappingReason:
            componentSurfaceMappingResolution.surfaceMappingReason,
          attachmentMetadataProfileId:
            attachmentMetadataResolution.attachmentMetadataProfileId,
          glbPreparationProfileId:
            attachmentMetadataResolution.glbPreparationProfileId,
          socketMetadataCount: attachmentMetadataResolution.socketMetadataCount,
          componentMetadataCount:
            attachmentMetadataResolution.componentMetadataCount,
          attachmentMetadataReason:
            attachmentMetadataResolution.attachmentMetadataReason,
          materialAssignmentId:
            modularAssetBindingResolution.materialAssignmentId,
          lodProfileId: modularAssetBindingResolution.lodProfileId,
          atlasAssetPackageId:
            assetWorldValidationResolution.atlasAssetPackageId,
          assetValidationStatus:
            assetWorldValidationResolution.assetValidationStatus,
          bindingValidationReason:
            assetWorldValidationResolution.bindingValidationReason,
          placementValidationStatus:
            assetWorldValidationResolution.placementValidationStatus,
          rendererHandoffReadiness:
            assetWorldValidationResolution.rendererHandoffReadiness,
          worldPackageId: worldPackageValidationResolution.worldPackageId,
          packageValidationStatus:
            worldPackageValidationResolution.packageValidationStatus,
          compatibleAssetCount:
            worldPackageValidationResolution.compatibleAssetCount,
          blockedAssetCount:
            worldPackageValidationResolution.blockedAssetCount,
          packageReason: worldPackageValidationResolution.packageReason,
          settlementPackageProfileId:
            packageProfileResolution.settlementPackageProfileId,
          biomePackageProfileId:
            packageProfileResolution.biomePackageProfileId,
          resolvedWorldPackageId:
            packageProfileResolution.resolvedWorldPackageId,
          profileCompatibilityStatus:
            packageProfileResolution.profileCompatibilityStatus,
          packageSelectionReason:
            packageProfileResolution.packageSelectionReason,
          worldThemeProfileId: themeBundleResolution.worldThemeProfileId,
          regionalStyleBundleId: themeBundleResolution.regionalStyleBundleId,
          visualCohesionScore: themeBundleResolution.visualCohesionScore,
          themeCompatibilityStatus:
            themeBundleResolution.themeCompatibilityStatus,
          themeSelectionReason: themeBundleResolution.themeSelectionReason,
          architectureStyleProfileId:
            themeSubprofileResolution.architectureStyleProfileId,
          vegetationStyleProfileId:
            themeSubprofileResolution.vegetationStyleProfileId,
          streetscapeStyleProfileId:
            themeSubprofileResolution.streetscapeStyleProfileId,
          themeSubprofileCompatibility:
            themeSubprofileResolution.themeSubprofileCompatibility,
          styleSubprofileReason:
            themeSubprofileResolution.styleSubprofileReason,
          modularBibleFamilyId:
            modularBibleStyleBridgeResolution.modularBibleFamilyId,
          componentRecipeId:
            modularBibleStyleBridgeResolution.componentRecipeId,
          assetAssemblyProfileId:
            modularBibleStyleBridgeResolution.assetAssemblyProfileId,
          styleBridgeStatus:
            modularBibleStyleBridgeResolution.styleBridgeStatus,
          bridgeReason: modularBibleStyleBridgeResolution.bridgeReason,
          componentCompatibilityStatus:
            componentAssemblyRuleResolution.componentCompatibilityStatus,
          assemblyRuleProfileId:
            componentAssemblyRuleResolution.assemblyRuleProfileId,
          requiredComponentCount:
            componentAssemblyRuleResolution.requiredComponentCount,
          validatedComponentCount:
            componentAssemblyRuleResolution.validatedComponentCount,
          assemblyReason: componentAssemblyRuleResolution.assemblyReason,
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
          specialSiteType: specialSiteAccentResolution.specialSiteType,
          landmarkAccentProfileId:
            specialSiteAccentResolution.landmarkAccentProfileId,
          cornerLotAccentId: specialSiteAccentResolution.cornerLotAccentId,
          visibilityPriority: specialSiteAccentResolution.visibilityPriority,
          specialSiteReason: specialSiteAccentResolution.specialSiteReason,
          viewCorridorId: destinationFramingResolution.viewCorridorId,
          approachSequenceId: destinationFramingResolution.approachSequenceId,
          destinationFrameProfileId:
            destinationFramingResolution.destinationFrameProfileId,
          arrivalReason: destinationFramingResolution.arrivalReason,
          routeMemoryId: routeGuidanceResolution.routeMemoryId,
          wayfindingProfileId: routeGuidanceResolution.wayfindingProfileId,
          explorationRouteType: routeGuidanceResolution.explorationRouteType,
          guidanceReason: routeGuidanceResolution.guidanceReason,
          routePriority: routeGuidanceResolution.routePriority,
          placeMemoryId: placeMemoryResolution.placeMemoryId,
          storyCategory: placeMemoryResolution.storyCategory,
          localNarrativeProfileId:
            placeMemoryResolution.localNarrativeProfileId,
          discoveryImportance: placeMemoryResolution.discoveryImportance,
          storyReason: placeMemoryResolution.storyReason,
          memoryStateId: seasonalStoryMemoryResolution.memoryStateId,
          seasonalStoryProfileId:
            seasonalStoryMemoryResolution.seasonalStoryProfileId,
          eventHookProfileId:
            seasonalStoryMemoryResolution.eventHookProfileId,
          returnVisitCategory:
            seasonalStoryMemoryResolution.returnVisitCategory,
          storyEvolutionReason:
            seasonalStoryMemoryResolution.storyEvolutionReason,
          activityProfileId: activitySocialRhythmResolution.activityProfileId,
          socialRhythmId: activitySocialRhythmResolution.socialRhythmId,
          timeContextProfile: activitySocialRhythmResolution.timeContextProfile,
          activityReason: activitySocialRhythmResolution.activityReason,
          communityImportance: activitySocialRhythmResolution.communityImportance,
          civicRoutineProfileId:
            civicRoutineGatheringResolution.civicRoutineProfileId,
          gatheringPatternId:
            civicRoutineGatheringResolution.gatheringPatternId,
          temporalUseProfile:
            civicRoutineGatheringResolution.temporalUseProfile,
          communityRole: civicRoutineGatheringResolution.communityRole,
          routineReason: civicRoutineGatheringResolution.routineReason,
          serviceRoleId: localEconomyServiceResolution.serviceRoleId,
          economyProfileId: localEconomyServiceResolution.economyProfileId,
          marketCycleProfileId:
            localEconomyServiceResolution.marketCycleProfileId,
          serviceImportance: localEconomyServiceResolution.serviceImportance,
          economyReason: localEconomyServiceResolution.economyReason,
          mobilityProfileId: localMobilityAccessResolution.mobilityProfileId,
          accessPatternId: localMobilityAccessResolution.accessPatternId,
          flowPriority: localMobilityAccessResolution.flowPriority,
          movementReason: localMobilityAccessResolution.movementReason,
          accessibilityProfile:
            localMobilityAccessResolution.accessibilityProfile,
          occupancyProfileId: placeLivenessResolution.occupancyProfileId,
          timePresenceProfile: placeLivenessResolution.timePresenceProfile,
          livenessCategory: placeLivenessResolution.livenessCategory,
          peakActivityWindow: placeLivenessResolution.peakActivityWindow,
          presenceReason: placeLivenessResolution.presenceReason,
          weeklyRoutineProfileId:
            weeklyRoutineRecurrenceResolution.weeklyRoutineProfileId,
          recurrencePatternId:
            weeklyRoutineRecurrenceResolution.recurrencePatternId,
          communityCadenceId:
            weeklyRoutineRecurrenceResolution.communityCadenceId,
          eventFrequency: weeklyRoutineRecurrenceResolution.eventFrequency,
          recurrenceReason: weeklyRoutineRecurrenceResolution.recurrenceReason,
          traditionProfileId: traditionEventCycleResolution.traditionProfileId,
          seasonalEventCycleId:
            traditionEventCycleResolution.seasonalEventCycleId,
          communityTraditionId:
            traditionEventCycleResolution.communityTraditionId,
          eventImportance: traditionEventCycleResolution.eventImportance,
          traditionReason: traditionEventCycleResolution.traditionReason,
          festivalProfileId: festivalQuestNarrativeResolution.festivalProfileId,
          questNarrativeProfileId:
            festivalQuestNarrativeResolution.questNarrativeProfileId,
          seasonalDestinationProfileId:
            festivalQuestNarrativeResolution.seasonalDestinationProfileId,
          achievementHookProfileId:
            festivalQuestNarrativeResolution.achievementHookProfileId,
          narrativeReason: festivalQuestNarrativeResolution.narrativeReason,
          campaignProfileId: explorationProgressionResolution.campaignProfileId,
          destinationChainId:
            explorationProgressionResolution.destinationChainId,
          rewardArcProfileId:
            explorationProgressionResolution.rewardArcProfileId,
          progressionTier: explorationProgressionResolution.progressionTier,
          explorationReason: explorationProgressionResolution.explorationReason,
          expeditionProfileId: regionalExpeditionResolution.expeditionProfileId,
          campaignNetworkId: regionalExpeditionResolution.campaignNetworkId,
          completionArcId: regionalExpeditionResolution.completionArcId,
          regionalIdentityId: regionalExpeditionResolution.regionalIdentityId,
          expeditionReason: regionalExpeditionResolution.expeditionReason,
          worldJourneyProfileId:
            worldExplorationCohesionResolution.worldJourneyProfileId,
          metaCollectionId: worldExplorationCohesionResolution.metaCollectionId,
          crossRegionCampaignId:
            worldExplorationCohesionResolution.crossRegionCampaignId,
          explorationTier: worldExplorationCohesionResolution.explorationTier,
          worldCohesionReason:
            worldExplorationCohesionResolution.worldCohesionReason,
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
        atlasAssetPackageId: null,
        assetValidationStatus: "not_validated",
        bindingValidationReason: "PENDING_ASSET_WORLD_VALIDATION",
        placementValidationStatus: "not_validated",
        rendererHandoffReadiness: "blocked",
        worldPackageId: null,
        packageValidationStatus: "blocked",
        compatibleAssetCount: 0,
        blockedAssetCount: 0,
        packageReason: "PENDING_WORLD_PACKAGE_VALIDATION",
        settlementPackageProfileId: null,
        biomePackageProfileId: null,
        resolvedWorldPackageId: null,
        profileCompatibilityStatus: "blocked",
        packageSelectionReason: "PENDING_PACKAGE_PROFILE_SELECTION",
        worldThemeProfileId: null,
        regionalStyleBundleId: null,
        visualCohesionScore: null,
        themeCompatibilityStatus: "blocked",
        themeSelectionReason: "PENDING_THEME_BUNDLE_SELECTION",
        architectureStyleProfileId: null,
        vegetationStyleProfileId: null,
        streetscapeStyleProfileId: null,
        themeSubprofileCompatibility: "blocked",
        styleSubprofileReason: "PENDING_THEME_SUBPROFILE_SELECTION",
        modularBibleFamilyId: null,
        componentRecipeId: null,
        assetAssemblyProfileId: null,
        styleBridgeStatus: "blocked",
        bridgeReason: "PENDING_MODULAR_BIBLE_STYLE_BRIDGE",
        componentCompatibilityStatus: "blocked",
        assemblyRuleProfileId: null,
        requiredComponentCount: 0,
        validatedComponentCount: 0,
        assemblyReason: "PENDING_COMPONENT_ASSEMBLY_RULE",
        assetVariantEnvelopeId: null,
        structuralCompatibilityStatus: "blocked",
        selectedVariantProfileId: null,
        variantConstraintReason:
          "PENDING_VARIANT_STRUCTURAL_COMPATIBILITY",
        variantSelectionSeed: null,
        materialCompatibilityStatus: "blocked",
        paletteCompatibilityStatus: "blocked",
        finishProfileId: null,
        resolvedMaterialProfileId: null,
        materialReason: "PENDING_MATERIAL_PALETTE_FINISH_COMPATIBILITY",
        materialThemeBundleId: null,
        resolvedFinishSetId: null,
        resolvedPaletteSetId: null,
        materialBundleCompatibilityStatus: "blocked",
        materialBundleReason: "PENDING_MATERIAL_THEME_BUNDLE",
        materialSlotSetId: null,
        resolvedSlotCount: 0,
        assignedMaterialCount: 0,
        slotCompatibilityStatus: "blocked",
        slotResolutionReason: "PENDING_MATERIAL_SLOT_RESOLUTION",
        surfaceMappingProfileId: null,
        componentAnchorSetId: null,
        resolvedAnchorCount: 0,
        mappedComponentCount: 0,
        surfaceMappingReason: "PENDING_COMPONENT_SURFACE_MAPPING",
        attachmentMetadataProfileId: null,
        glbPreparationProfileId: null,
        socketMetadataCount: 0,
        componentMetadataCount: 0,
        attachmentMetadataReason:
          "PENDING_ATTACHMENT_METADATA_GLB_PREPARATION",
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
        specialSiteType: null,
        landmarkAccentProfileId: null,
        cornerLotAccentId: null,
        visibilityPriority: null,
        specialSiteReason: null,
        viewCorridorId: null,
        approachSequenceId: null,
        destinationFrameProfileId: null,
        arrivalReason: null,
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
    const variantStructuralCompatibilityCandidateResolution =
      modularCandidateBindingResolution.assetVariantId
        ? resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile(
            internal.atlasVariantStructuralCompatibilityProfiles,
            {
              assetVariantId: modularCandidateBindingResolution.assetVariantId,
              lotType: candidate.lotType,
              districtType: candidate.districtType,
              streetscapeProfileId: candidate.streetscapeProfileId,
              settlementIdentityId: candidate.settlementIdentityId,
              densityTier: candidate.densityTier
            }
          )
        : {
            matched: false,
            assetVariantEnvelopeId: null,
            structuralCompatibilityStatus: "blocked",
            selectedVariantProfileId: null,
            variantConstraintReason:
              "VARIANT_STRUCTURAL_COMPATIBILITY_UNAVAILABLE",
            variantSelectionSeed: null
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
    const specialSiteAccentCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent(
        internal.populationSpecialSiteAccentRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          districtType: candidate.districtType,
          lotType: candidate.lotType,
          sourceClassification: candidate.feature.sourceClassification
        }
      );
    const destinationFramingCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming(
        internal.populationViewCorridorDestinationFramingRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          districtType: candidate.districtType,
          sourceClassification: candidate.feature.sourceClassification,
          specialSiteType: specialSiteAccentCandidateResolution.specialSiteType
        }
      );
    const routeGuidanceCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance(
        internal.populationRouteMemoryWayfindingGuidanceRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          districtType: candidate.districtType,
          biomeProfileId: candidate.biomeProfileId,
          destinationFrameProfileId:
            destinationFramingCandidateResolution.destinationFrameProfileId
        }
      );
    const placeMemoryCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks(
        internal.populationPlaceMemoryNarrativeHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          explorationRouteType:
            routeGuidanceCandidateResolution.explorationRouteType,
          settlementIdentityId: candidate.settlementIdentityId
        }
      );
    const seasonalStoryMemoryCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks(
        internal.populationSeasonalStoryMemoryHooksRuleRegistry,
        {
          seasonProfileId: candidate.seasonProfileId,
          biomeProfileId: candidate.biomeProfileId,
          storyCategory: placeMemoryCandidateResolution.storyCategory
        }
      );
    const activitySocialRhythmCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks(
        internal.populationActivitySocialRhythmHooksRuleRegistry,
        {
          settlementIdentityId: candidate.settlementIdentityId,
          placeMemoryId: placeMemoryCandidateResolution.placeMemoryId,
          seasonalStoryProfileId:
            seasonalStoryMemoryCandidateResolution.seasonalStoryProfileId,
          seasonProfileId: candidate.seasonProfileId,
          returnVisitCategory:
            seasonalStoryMemoryCandidateResolution.returnVisitCategory
        }
      );
    const civicRoutineGatheringCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks(
        internal.populationCivicRoutineGatheringHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          activityProfileId:
            activitySocialRhythmCandidateResolution.activityProfileId,
          socialRhythmId:
            activitySocialRhythmCandidateResolution.socialRhythmId,
          seasonProfileId: candidate.seasonProfileId
        }
      );
    const localEconomyServiceCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks(
        internal.populationLocalEconomyServiceHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          communityRole:
            civicRoutineGatheringCandidateResolution.communityRole,
          civicRoutineProfileId:
            civicRoutineGatheringCandidateResolution.civicRoutineProfileId,
          activityProfileId:
            activitySocialRhythmCandidateResolution.activityProfileId,
          settlementIdentityId: candidate.settlementIdentityId
        }
      );
    const localMobilityAccessCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks(
        internal.populationLocalMobilityAccessHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          serviceRoleId: localEconomyServiceCandidateResolution.serviceRoleId,
          communityRole:
            civicRoutineGatheringCandidateResolution.communityRole,
          civicRoutineProfileId:
            civicRoutineGatheringCandidateResolution.civicRoutineProfileId
        }
      );
    const placeLivenessCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks(
        internal.populationPlaceLivenessHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          mobilityProfileId:
            localMobilityAccessCandidateResolution.mobilityProfileId,
          accessPatternId:
            localMobilityAccessCandidateResolution.accessPatternId,
          serviceRoleId: localEconomyServiceCandidateResolution.serviceRoleId,
          communityRole:
            civicRoutineGatheringCandidateResolution.communityRole
        }
      );
    const weeklyRoutineRecurrenceCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks(
        internal.populationWeeklyRoutineRecurrenceHooksRuleRegistry,
        {
          featureClass: candidate.feature.featureClass,
          livenessCategory: placeLivenessCandidateResolution.livenessCategory,
          occupancyProfileId:
            placeLivenessCandidateResolution.occupancyProfileId,
          serviceRoleId: localEconomyServiceCandidateResolution.serviceRoleId,
          communityRole:
            civicRoutineGatheringCandidateResolution.communityRole
        }
      );
    const traditionEventCycleCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks(
        internal.populationTraditionEventCycleHooksRuleRegistry,
        {
          settlementIdentityId: candidate.settlementIdentityId,
          storyCategory: placeMemoryCandidateResolution.storyCategory,
          recurrencePatternId:
            weeklyRoutineRecurrenceCandidateResolution.recurrencePatternId,
          communityCadenceId:
            weeklyRoutineRecurrenceCandidateResolution.communityCadenceId,
          seasonProfileId: candidate.seasonProfileId
        }
      );
    const festivalQuestNarrativeCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks(
        internal.populationFestivalQuestNarrativeHooksRuleRegistry,
        {
          destinationFrameProfileId:
            destinationFramingCandidateResolution.destinationFrameProfileId,
          routeMemoryId: routeGuidanceCandidateResolution.routeMemoryId,
          placeMemoryId: placeMemoryCandidateResolution.placeMemoryId,
          recurrencePatternId:
            weeklyRoutineRecurrenceCandidateResolution.recurrencePatternId,
          traditionProfileId:
            traditionEventCycleCandidateResolution.traditionProfileId
        }
      );
    const explorationProgressionCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks(
        internal.populationExplorationProgressionHooksRuleRegistry,
        {
          seasonalDestinationProfileId:
            festivalQuestNarrativeCandidateResolution.seasonalDestinationProfileId,
          routePriority: routeGuidanceCandidateResolution.routePriority,
          achievementHookProfileId:
            festivalQuestNarrativeCandidateResolution.achievementHookProfileId,
          questNarrativeProfileId:
            festivalQuestNarrativeCandidateResolution.questNarrativeProfileId
        }
      );
    const regionalExpeditionCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks(
        internal.populationRegionalExpeditionHooksRuleRegistry,
        {
          campaignProfileId:
            explorationProgressionCandidateResolution.campaignProfileId,
          destinationChainId:
            explorationProgressionCandidateResolution.destinationChainId,
          progressionTier:
            explorationProgressionCandidateResolution.progressionTier,
          districtType: candidate.districtType,
          regionId
        }
      );
    const worldExplorationCohesionCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks(
        internal.populationWorldExplorationCohesionHooksRuleRegistry,
        {
          expeditionProfileId:
            regionalExpeditionCandidateResolution.expeditionProfileId,
          campaignNetworkId:
            regionalExpeditionCandidateResolution.campaignNetworkId,
          progressionTier:
            explorationProgressionCandidateResolution.progressionTier,
          regionalIdentityId:
            regionalExpeditionCandidateResolution.regionalIdentityId
        }
      );
    const signatureRouteLegacyCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks(
        internal.populationSignatureRouteLegacyHooksRuleRegistry,
        {
          worldJourneyProfileId:
            worldExplorationCohesionCandidateResolution.worldJourneyProfileId,
          routeMemoryId: routeGuidanceCandidateResolution.routeMemoryId,
          placeMemoryId: placeMemoryCandidateResolution.placeMemoryId,
          regionalIdentityId:
            regionalExpeditionCandidateResolution.regionalIdentityId
        }
      );
    const worldWonderDiscoveryMemoryCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks(
        internal.populationWorldWonderDiscoveryMemoryHooksRuleRegistry,
        {
          signatureRouteProfileId:
            signatureRouteLegacyCandidateResolution.signatureRouteProfileId,
          worldJourneyProfileId:
            worldExplorationCohesionCandidateResolution.worldJourneyProfileId,
          legacyDestinationId:
            signatureRouteLegacyCandidateResolution.legacyDestinationId,
          placeMemoryId: placeMemoryCandidateResolution.placeMemoryId
        }
      );
    const worldLegacyDiscoveryCohesionCandidateResolution =
      resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks(
        internal.populationWorldLegacyDiscoveryCohesionHooksRuleRegistry,
        {
          worldWonderProfileId:
            worldWonderDiscoveryMemoryCandidateResolution.worldWonderProfileId,
          signatureRouteProfileId:
            signatureRouteLegacyCandidateResolution.signatureRouteProfileId,
          metaCollectionId:
            worldExplorationCohesionCandidateResolution.metaCollectionId,
          generationMemoryProfileId:
            worldWonderDiscoveryMemoryCandidateResolution.generationMemoryProfileId
        }
      );
    const candidateAssetValidationPlacementIntent =
      deriveAtlasAssetValidationPlacementIntent(candidate.assetFamilyId);
    const assetWorldValidationCandidateResolution =
      modularCandidateBindingResolution.matched &&
      candidateAssetValidationPlacementIntent
        ? resolveDeveloperOnlyAtlasAssetWorldValidationFoundation(
            internal.atlasAssetWorldValidationFoundation,
            {
              assetFamilyId: candidate.assetFamilyId,
              selectedAssetId: modularCandidateBindingResolution.selectedAssetId,
              assetVariantId: modularCandidateBindingResolution.assetVariantId,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId,
              lodProfileId: modularCandidateBindingResolution.lodProfileId,
              placementIntent: candidateAssetValidationPlacementIntent,
              coordinate: candidate.coordinate
            }
          )
        : deepFreeze({
            atlasAssetPackageId: null,
            assetValidationStatus: "not_validated",
            bindingValidationReason:
              modularCandidateBindingResolution.matched
                ? "PLACEMENT_INTENT_UNAVAILABLE"
                : "MODULAR_BINDING_UNAVAILABLE",
            placementValidationStatus: "not_validated",
            rendererHandoffReadiness: "blocked"
          });
    const candidateWorldPackageCategory = deriveAtlasWorldPackageCategory({
      assetFamilyId: candidate.assetFamilyId,
      featureClass: candidate.feature.featureClass
    });
    const worldPackageValidationCandidateResolution =
      modularCandidateBindingResolution.matched &&
      candidateWorldPackageCategory &&
      assetWorldValidationCandidateResolution.atlasAssetPackageId
        ? resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage(
            internal.atlasAssetCompatibilityWorldPackages,
            {
              packageCategory: candidateWorldPackageCategory,
              atlasAssetPackageId:
                assetWorldValidationCandidateResolution.atlasAssetPackageId,
              assetFamilyId: candidate.assetFamilyId,
              selectedAssetId: modularCandidateBindingResolution.selectedAssetId,
              assetVariantId: modularCandidateBindingResolution.assetVariantId,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId,
              biomeProfileId: candidate.biomeProfileId,
              settlementIdentityId: candidate.settlementIdentityId,
              childAssetIds: microClusterCandidateResolution.childAssetIds
            }
          )
        : deepFreeze({
            worldPackageId: null,
            packageValidationStatus: "blocked",
            compatibleAssetCount: 0,
            blockedAssetCount: 0,
            packageReason:
              candidateWorldPackageCategory == null
                ? "WORLD_PACKAGE_CATEGORY_UNAVAILABLE"
                : "ASSET_WORLD_VALIDATION_UNAVAILABLE"
          });
    const packageProfileCandidateResolution =
      worldPackageValidationCandidateResolution.worldPackageId &&
      candidateWorldPackageCategory
        ? resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile(
            internal.atlasAssetBiomeSettlementPackageProfiles,
            {
              settlementIdentityId: candidate.settlementIdentityId,
              biomeProfileId: candidate.biomeProfileId,
              worldPackageCategory: candidateWorldPackageCategory,
              worldPackageId: worldPackageValidationCandidateResolution.worldPackageId
            }
          )
        : deepFreeze({
            settlementPackageProfileId: null,
            biomePackageProfileId: null,
            resolvedWorldPackageId: null,
            profileCompatibilityStatus: "blocked",
            packageSelectionReason: "WORLD_PACKAGE_PROFILE_UNAVAILABLE"
          });
    const themeBundleCandidateResolution =
      packageProfileCandidateResolution.resolvedWorldPackageId &&
      candidateWorldPackageCategory
        ? resolveDeveloperOnlyAtlasWorldThemeStyleBundle(
            internal.atlasWorldThemeStyleBundles,
            {
              settlementPackageProfileId:
                packageProfileCandidateResolution.settlementPackageProfileId,
              biomePackageProfileId:
                packageProfileCandidateResolution.biomePackageProfileId,
              worldPackageCategory: candidateWorldPackageCategory,
              resolvedWorldPackageId:
                packageProfileCandidateResolution.resolvedWorldPackageId
            }
          )
        : deepFreeze({
            worldThemeProfileId: null,
            regionalStyleBundleId: null,
            visualCohesionScore: null,
            themeCompatibilityStatus: "blocked",
            themeSelectionReason: "THEME_BUNDLE_UNAVAILABLE"
          });
    const themeSubprofileCandidateResolution =
      themeBundleCandidateResolution.worldThemeProfileId &&
      candidate.assetFamilyId
        ? resolveDeveloperOnlyAtlasThemeSubprofile(
            internal.atlasThemeSubprofileRules,
            {
              worldThemeProfileId:
                themeBundleCandidateResolution.worldThemeProfileId,
              assetFamilyId: candidate.assetFamilyId
            }
          )
        : deepFreeze({
            architectureStyleProfileId: null,
            vegetationStyleProfileId: null,
            streetscapeStyleProfileId: null,
            themeSubprofileCompatibility: "blocked",
            styleSubprofileReason: "THEME_SUBPROFILE_UNAVAILABLE"
          });
    const modularBibleStyleBridgeCandidateResolution =
      themeSubprofileCandidateResolution.architectureStyleProfileId &&
      candidate.assetFamilyId &&
      candidate.materialFamilyId &&
      candidate.paletteProfileId
        ? resolveDeveloperOnlyAtlasModularBibleStyleBridge(
            internal.atlasModularBibleStyleBridge,
            {
              worldThemeProfileId:
                themeBundleCandidateResolution.worldThemeProfileId,
              assetFamilyId: candidate.assetFamilyId,
              architectureStyleProfileId:
                themeSubprofileCandidateResolution.architectureStyleProfileId,
              vegetationStyleProfileId:
                themeSubprofileCandidateResolution.vegetationStyleProfileId,
              streetscapeStyleProfileId:
                themeSubprofileCandidateResolution.streetscapeStyleProfileId,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId
            }
          )
        : deepFreeze({
            modularBibleFamilyId: null,
            componentRecipeId: null,
            assetAssemblyProfileId: null,
            styleBridgeStatus: "blocked",
            bridgeReason: "MODULAR_BIBLE_STYLE_BRIDGE_UNAVAILABLE"
          });
    const materialPaletteFinishCompatibilityCandidateResolution =
      modularCandidateBindingResolution.assetVariantId &&
      candidate.materialFamilyId &&
      candidate.paletteProfileId &&
      themeBundleCandidateResolution.worldThemeProfileId
        ? resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile(
            internal.atlasMaterialPaletteFinishCompatibilityProfiles,
            {
              assetVariantId: modularCandidateBindingResolution.assetVariantId,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId,
              worldThemeProfileId:
                themeBundleCandidateResolution.worldThemeProfileId,
              settlementIdentityId: candidate.settlementIdentityId,
              biomeProfileId: candidate.biomeProfileId
            }
          )
        : {
            matched: false,
            materialCompatibilityStatus: "blocked",
            paletteCompatibilityStatus: "blocked",
            finishProfileId: null,
            resolvedMaterialProfileId: null,
            materialReason: "MATERIAL_PALETTE_FINISH_COMPATIBILITY_UNAVAILABLE"
          };
    const materialThemeBundleCandidateResolution =
      themeBundleCandidateResolution.worldThemeProfileId &&
      candidate.settlementIdentityId &&
      candidate.biomeProfileId &&
      candidate.materialFamilyId &&
      candidate.paletteProfileId &&
      materialPaletteFinishCompatibilityCandidateResolution.finishProfileId &&
      materialPaletteFinishCompatibilityCandidateResolution.resolvedMaterialProfileId
        ? resolveDeveloperOnlyAtlasMaterialThemeBundle(
            internal.atlasMaterialThemeBundles,
            {
              worldThemeProfileId:
                themeBundleCandidateResolution.worldThemeProfileId,
              settlementIdentityId: candidate.settlementIdentityId,
              biomeProfileId: candidate.biomeProfileId,
              materialFamilyId: candidate.materialFamilyId,
              paletteProfileId: candidate.paletteProfileId,
              finishProfileId:
                materialPaletteFinishCompatibilityCandidateResolution.finishProfileId,
              resolvedMaterialProfileId:
                materialPaletteFinishCompatibilityCandidateResolution.resolvedMaterialProfileId
            }
          )
        : {
            matched: false,
            materialThemeBundleId: null,
            resolvedFinishSetId: null,
            resolvedPaletteSetId: null,
            materialBundleCompatibilityStatus: "blocked",
            materialBundleReason: "MATERIAL_THEME_BUNDLE_UNAVAILABLE"
          };
    const materialSlotCandidateResolution =
      modularCandidateBindingResolution.assetVariantId &&
      materialThemeBundleCandidateResolution.materialThemeBundleId &&
      materialPaletteFinishCompatibilityCandidateResolution.finishProfileId &&
      materialThemeBundleCandidateResolution.resolvedFinishSetId
        ? resolveDeveloperOnlyAtlasMaterialSlotSet(
            internal.atlasMaterialSlotResolution,
            {
              assetVariantId: modularCandidateBindingResolution.assetVariantId,
              materialThemeBundleId:
                materialThemeBundleCandidateResolution.materialThemeBundleId,
              finishProfileId:
                materialPaletteFinishCompatibilityCandidateResolution.finishProfileId,
              resolvedFinishSetId:
                materialThemeBundleCandidateResolution.resolvedFinishSetId
            }
          )
        : {
            matched: false,
            materialSlotSetId: null,
            resolvedSlotCount: 0,
            assignedMaterialCount: 0,
            slotCompatibilityStatus: "blocked",
            slotResolutionReason: "MATERIAL_SLOT_RESOLUTION_UNAVAILABLE"
          };
    const componentAssemblyRuleCandidateResolution =
      modularBibleStyleBridgeCandidateResolution.modularBibleFamilyId &&
      modularBibleStyleBridgeCandidateResolution.componentRecipeId &&
      modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId &&
      candidate.biomeProfileId
        ? resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile(
            internal.atlasComponentAssemblyRuleProfiles,
            {
              modularBibleFamilyId:
                modularBibleStyleBridgeCandidateResolution.modularBibleFamilyId,
              componentRecipeId:
                modularBibleStyleBridgeCandidateResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId,
              featureClass: candidate.featureClass,
              biomeProfileId: candidate.biomeProfileId
            }
          )
        : deepFreeze({
            componentCompatibilityStatus: "blocked",
            assemblyRuleProfileId: null,
            requiredComponentCount: 0,
            validatedComponentCount: 0,
            assemblyReason: "COMPONENT_ASSEMBLY_RULE_UNAVAILABLE"
          });
    const componentSurfaceMappingCandidateResolution =
      modularBibleStyleBridgeCandidateResolution.componentRecipeId &&
      modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId &&
      materialSlotCandidateResolution.materialSlotSetId &&
      componentAssemblyRuleCandidateResolution.componentCompatibilityStatus
        ? resolveDeveloperOnlyAtlasComponentSurfaceMapping(
            internal.atlasComponentSurfaceMapping,
            {
              componentRecipeId:
                modularBibleStyleBridgeCandidateResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId,
              materialSlotSetId:
                materialSlotCandidateResolution.materialSlotSetId,
              slotCompatibilityStatus:
                materialSlotCandidateResolution.slotCompatibilityStatus
            }
          )
        : {
            matched: false,
            surfaceMappingProfileId: null,
            componentAnchorSetId: null,
            resolvedAnchorCount: 0,
            mappedComponentCount: 0,
            surfaceMappingReason: "COMPONENT_SURFACE_MAPPING_UNAVAILABLE"
          };
    const attachmentMetadataCandidateResolution =
      componentSurfaceMappingCandidateResolution.surfaceMappingProfileId &&
      componentSurfaceMappingCandidateResolution.componentAnchorSetId &&
      modularBibleStyleBridgeCandidateResolution.componentRecipeId &&
      modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId
        ? resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation(
            internal.atlasAttachmentMetadataGlbPreparation,
            {
              surfaceMappingProfileId:
                componentSurfaceMappingCandidateResolution.surfaceMappingProfileId,
              componentAnchorSetId:
                componentSurfaceMappingCandidateResolution.componentAnchorSetId,
              componentRecipeId:
                modularBibleStyleBridgeCandidateResolution.componentRecipeId,
              assetAssemblyProfileId:
                modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId
            }
          )
        : {
            matched: false,
            attachmentMetadataProfileId: null,
            glbPreparationProfileId: null,
            socketMetadataCount: 0,
            componentMetadataCount: 0,
            attachmentMetadataReason:
              "ATTACHMENT_METADATA_GLB_PREPARATION_UNAVAILABLE"
          };

    if (modularCandidateBindingResolution.matched) {
      state.selectedAssetId = modularCandidateBindingResolution.selectedAssetId;
      state.assetVariantId = modularCandidateBindingResolution.assetVariantId;
      state.variantSelectionReason =
        modularCandidateBindingResolution.variantSelectionReason;
      state.assetVariantEnvelopeId =
        variantStructuralCompatibilityCandidateResolution.assetVariantEnvelopeId;
      state.structuralCompatibilityStatus =
        variantStructuralCompatibilityCandidateResolution.structuralCompatibilityStatus;
      state.selectedVariantProfileId =
        variantStructuralCompatibilityCandidateResolution.selectedVariantProfileId;
      state.variantConstraintReason =
        variantStructuralCompatibilityCandidateResolution.variantConstraintReason;
      state.variantSelectionSeed =
        variantStructuralCompatibilityCandidateResolution.variantSelectionSeed;
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
      state.specialSiteType = specialSiteAccentCandidateResolution.specialSiteType;
      state.landmarkAccentProfileId =
        specialSiteAccentCandidateResolution.landmarkAccentProfileId;
      state.cornerLotAccentId =
        specialSiteAccentCandidateResolution.cornerLotAccentId;
      state.visibilityPriority =
        specialSiteAccentCandidateResolution.visibilityPriority;
      state.specialSiteReason =
        specialSiteAccentCandidateResolution.specialSiteReason;
      state.viewCorridorId = destinationFramingCandidateResolution.viewCorridorId;
      state.approachSequenceId =
        destinationFramingCandidateResolution.approachSequenceId;
      state.destinationFrameProfileId =
        destinationFramingCandidateResolution.destinationFrameProfileId;
      state.arrivalReason = destinationFramingCandidateResolution.arrivalReason;
      state.routeMemoryId = routeGuidanceCandidateResolution.routeMemoryId;
      state.wayfindingProfileId =
        routeGuidanceCandidateResolution.wayfindingProfileId;
      state.explorationRouteType =
        routeGuidanceCandidateResolution.explorationRouteType;
      state.guidanceReason = routeGuidanceCandidateResolution.guidanceReason;
      state.routePriority = routeGuidanceCandidateResolution.routePriority;
      state.placeMemoryId = placeMemoryCandidateResolution.placeMemoryId;
      state.storyCategory = placeMemoryCandidateResolution.storyCategory;
      state.localNarrativeProfileId =
        placeMemoryCandidateResolution.localNarrativeProfileId;
      state.discoveryImportance =
        placeMemoryCandidateResolution.discoveryImportance;
      state.storyReason = placeMemoryCandidateResolution.storyReason;
      state.memoryStateId = seasonalStoryMemoryCandidateResolution.memoryStateId;
      state.seasonalStoryProfileId =
        seasonalStoryMemoryCandidateResolution.seasonalStoryProfileId;
      state.eventHookProfileId =
        seasonalStoryMemoryCandidateResolution.eventHookProfileId;
      state.returnVisitCategory =
        seasonalStoryMemoryCandidateResolution.returnVisitCategory;
      state.storyEvolutionReason =
        seasonalStoryMemoryCandidateResolution.storyEvolutionReason;
      state.activityProfileId =
        activitySocialRhythmCandidateResolution.activityProfileId;
      state.socialRhythmId =
        activitySocialRhythmCandidateResolution.socialRhythmId;
      state.timeContextProfile =
        activitySocialRhythmCandidateResolution.timeContextProfile;
      state.activityReason =
        activitySocialRhythmCandidateResolution.activityReason;
      state.communityImportance =
        activitySocialRhythmCandidateResolution.communityImportance;
      state.civicRoutineProfileId =
        civicRoutineGatheringCandidateResolution.civicRoutineProfileId;
      state.gatheringPatternId =
        civicRoutineGatheringCandidateResolution.gatheringPatternId;
      state.temporalUseProfile =
        civicRoutineGatheringCandidateResolution.temporalUseProfile;
      state.communityRole =
        civicRoutineGatheringCandidateResolution.communityRole;
      state.routineReason = civicRoutineGatheringCandidateResolution.routineReason;
      state.serviceRoleId = localEconomyServiceCandidateResolution.serviceRoleId;
      state.economyProfileId =
        localEconomyServiceCandidateResolution.economyProfileId;
      state.marketCycleProfileId =
        localEconomyServiceCandidateResolution.marketCycleProfileId;
      state.serviceImportance =
        localEconomyServiceCandidateResolution.serviceImportance;
      state.economyReason =
        localEconomyServiceCandidateResolution.economyReason;
      state.mobilityProfileId =
        localMobilityAccessCandidateResolution.mobilityProfileId;
      state.accessPatternId =
        localMobilityAccessCandidateResolution.accessPatternId;
      state.flowPriority =
        localMobilityAccessCandidateResolution.flowPriority;
      state.movementReason =
        localMobilityAccessCandidateResolution.movementReason;
      state.accessibilityProfile =
        localMobilityAccessCandidateResolution.accessibilityProfile;
      state.occupancyProfileId =
        placeLivenessCandidateResolution.occupancyProfileId;
      state.timePresenceProfile =
        placeLivenessCandidateResolution.timePresenceProfile;
      state.livenessCategory =
        placeLivenessCandidateResolution.livenessCategory;
      state.peakActivityWindow =
        placeLivenessCandidateResolution.peakActivityWindow;
      state.presenceReason = placeLivenessCandidateResolution.presenceReason;
      state.weeklyRoutineProfileId =
        weeklyRoutineRecurrenceCandidateResolution.weeklyRoutineProfileId;
      state.recurrencePatternId =
        weeklyRoutineRecurrenceCandidateResolution.recurrencePatternId;
      state.communityCadenceId =
        weeklyRoutineRecurrenceCandidateResolution.communityCadenceId;
      state.eventFrequency =
        weeklyRoutineRecurrenceCandidateResolution.eventFrequency;
      state.recurrenceReason =
        weeklyRoutineRecurrenceCandidateResolution.recurrenceReason;
      state.traditionProfileId =
        traditionEventCycleCandidateResolution.traditionProfileId;
      state.seasonalEventCycleId =
        traditionEventCycleCandidateResolution.seasonalEventCycleId;
      state.communityTraditionId =
        traditionEventCycleCandidateResolution.communityTraditionId;
      state.eventImportance =
        traditionEventCycleCandidateResolution.eventImportance;
      state.traditionReason =
        traditionEventCycleCandidateResolution.traditionReason;
      state.festivalProfileId =
        festivalQuestNarrativeCandidateResolution.festivalProfileId;
      state.questNarrativeProfileId =
        festivalQuestNarrativeCandidateResolution.questNarrativeProfileId;
      state.seasonalDestinationProfileId =
        festivalQuestNarrativeCandidateResolution.seasonalDestinationProfileId;
      state.achievementHookProfileId =
        festivalQuestNarrativeCandidateResolution.achievementHookProfileId;
      state.narrativeReason =
        festivalQuestNarrativeCandidateResolution.narrativeReason;
      state.campaignProfileId =
        explorationProgressionCandidateResolution.campaignProfileId;
      state.destinationChainId =
        explorationProgressionCandidateResolution.destinationChainId;
      state.rewardArcProfileId =
        explorationProgressionCandidateResolution.rewardArcProfileId;
      state.progressionTier =
        explorationProgressionCandidateResolution.progressionTier;
      state.explorationReason =
        explorationProgressionCandidateResolution.explorationReason;
      state.expeditionProfileId =
        regionalExpeditionCandidateResolution.expeditionProfileId;
      state.campaignNetworkId =
        regionalExpeditionCandidateResolution.campaignNetworkId;
      state.completionArcId =
        regionalExpeditionCandidateResolution.completionArcId;
      state.regionalIdentityId =
        regionalExpeditionCandidateResolution.regionalIdentityId;
      state.expeditionReason =
        regionalExpeditionCandidateResolution.expeditionReason;
      state.worldJourneyProfileId =
        worldExplorationCohesionCandidateResolution.worldJourneyProfileId;
      state.metaCollectionId =
        worldExplorationCohesionCandidateResolution.metaCollectionId;
      state.crossRegionCampaignId =
        worldExplorationCohesionCandidateResolution.crossRegionCampaignId;
      state.explorationTier =
        worldExplorationCohesionCandidateResolution.explorationTier;
      state.worldCohesionReason =
        worldExplorationCohesionCandidateResolution.worldCohesionReason;
      state.signatureRouteProfileId =
        signatureRouteLegacyCandidateResolution.signatureRouteProfileId;
      state.legacyDestinationId =
        signatureRouteLegacyCandidateResolution.legacyDestinationId;
      state.mythologyProfileId =
        signatureRouteLegacyCandidateResolution.mythologyProfileId;
      state.globalJourneyTier =
        signatureRouteLegacyCandidateResolution.globalJourneyTier;
      state.legacyReason = signatureRouteLegacyCandidateResolution.legacyReason;
      state.worldWonderProfileId =
        worldWonderDiscoveryMemoryCandidateResolution.worldWonderProfileId;
      state.epicDestinationId =
        worldWonderDiscoveryMemoryCandidateResolution.epicDestinationId;
      state.discoveryMemoryTier =
        worldWonderDiscoveryMemoryCandidateResolution.discoveryMemoryTier;
      state.generationMemoryProfileId =
        worldWonderDiscoveryMemoryCandidateResolution.generationMemoryProfileId;
      state.wonderReason =
        worldWonderDiscoveryMemoryCandidateResolution.wonderReason;
      state.worldLegacyProfileId =
        worldLegacyDiscoveryCohesionCandidateResolution.worldLegacyProfileId;
      state.discoveryCohesionId =
        worldLegacyDiscoveryCohesionCandidateResolution.discoveryCohesionId;
      state.legacyTier =
        worldLegacyDiscoveryCohesionCandidateResolution.legacyTier;
      state.memoryCategory =
        worldLegacyDiscoveryCohesionCandidateResolution.memoryCategory;
      state.legacyReason =
        worldLegacyDiscoveryCohesionCandidateResolution.legacyReason;
      state.atlasAssetPackageId =
        assetWorldValidationCandidateResolution.atlasAssetPackageId;
      state.assetValidationStatus =
        assetWorldValidationCandidateResolution.assetValidationStatus;
      state.bindingValidationReason =
        assetWorldValidationCandidateResolution.bindingValidationReason;
      state.placementValidationStatus =
        assetWorldValidationCandidateResolution.placementValidationStatus;
      state.rendererHandoffReadiness =
        assetWorldValidationCandidateResolution.rendererHandoffReadiness;
      state.worldPackageId =
        worldPackageValidationCandidateResolution.worldPackageId;
      state.packageValidationStatus =
        worldPackageValidationCandidateResolution.packageValidationStatus;
      state.compatibleAssetCount =
        worldPackageValidationCandidateResolution.compatibleAssetCount;
      state.blockedAssetCount =
        worldPackageValidationCandidateResolution.blockedAssetCount;
      state.packageReason =
        worldPackageValidationCandidateResolution.packageReason;
      state.settlementPackageProfileId =
        packageProfileCandidateResolution.settlementPackageProfileId;
      state.biomePackageProfileId =
        packageProfileCandidateResolution.biomePackageProfileId;
      state.resolvedWorldPackageId =
        packageProfileCandidateResolution.resolvedWorldPackageId;
      state.profileCompatibilityStatus =
        packageProfileCandidateResolution.profileCompatibilityStatus;
      state.packageSelectionReason =
        packageProfileCandidateResolution.packageSelectionReason;
      state.worldThemeProfileId =
        themeBundleCandidateResolution.worldThemeProfileId;
      state.regionalStyleBundleId =
        themeBundleCandidateResolution.regionalStyleBundleId;
      state.visualCohesionScore =
        themeBundleCandidateResolution.visualCohesionScore;
      state.themeCompatibilityStatus =
        themeBundleCandidateResolution.themeCompatibilityStatus;
      state.themeSelectionReason =
        themeBundleCandidateResolution.themeSelectionReason;
      state.architectureStyleProfileId =
        themeSubprofileCandidateResolution.architectureStyleProfileId;
      state.vegetationStyleProfileId =
        themeSubprofileCandidateResolution.vegetationStyleProfileId;
      state.streetscapeStyleProfileId =
        themeSubprofileCandidateResolution.streetscapeStyleProfileId;
      state.themeSubprofileCompatibility =
        themeSubprofileCandidateResolution.themeSubprofileCompatibility;
      state.styleSubprofileReason =
        themeSubprofileCandidateResolution.styleSubprofileReason;
      state.modularBibleFamilyId =
        modularBibleStyleBridgeCandidateResolution.modularBibleFamilyId;
      state.componentRecipeId =
        modularBibleStyleBridgeCandidateResolution.componentRecipeId;
      state.assetAssemblyProfileId =
        modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId;
      state.styleBridgeStatus =
        modularBibleStyleBridgeCandidateResolution.styleBridgeStatus;
      state.bridgeReason =
        modularBibleStyleBridgeCandidateResolution.bridgeReason;
      state.componentCompatibilityStatus =
        componentAssemblyRuleCandidateResolution.componentCompatibilityStatus;
      state.assemblyRuleProfileId =
        componentAssemblyRuleCandidateResolution.assemblyRuleProfileId;
      state.requiredComponentCount =
        componentAssemblyRuleCandidateResolution.requiredComponentCount;
      state.validatedComponentCount =
        componentAssemblyRuleCandidateResolution.validatedComponentCount;
      state.assemblyReason =
        componentAssemblyRuleCandidateResolution.assemblyReason;
      state.materialCompatibilityStatus =
        materialPaletteFinishCompatibilityCandidateResolution.materialCompatibilityStatus;
      state.paletteCompatibilityStatus =
        materialPaletteFinishCompatibilityCandidateResolution.paletteCompatibilityStatus;
      state.finishProfileId =
        materialPaletteFinishCompatibilityCandidateResolution.finishProfileId;
      state.resolvedMaterialProfileId =
        materialPaletteFinishCompatibilityCandidateResolution.resolvedMaterialProfileId;
      state.materialReason =
        materialPaletteFinishCompatibilityCandidateResolution.materialReason;
      state.materialThemeBundleId =
        materialThemeBundleCandidateResolution.materialThemeBundleId;
      state.resolvedFinishSetId =
        materialThemeBundleCandidateResolution.resolvedFinishSetId;
      state.resolvedPaletteSetId =
        materialThemeBundleCandidateResolution.resolvedPaletteSetId;
      state.materialBundleCompatibilityStatus =
        materialThemeBundleCandidateResolution.materialBundleCompatibilityStatus;
      state.materialBundleReason =
        materialThemeBundleCandidateResolution.materialBundleReason;
      state.materialSlotSetId =
        materialSlotCandidateResolution.materialSlotSetId;
      state.resolvedSlotCount =
        materialSlotCandidateResolution.resolvedSlotCount;
      state.assignedMaterialCount =
        materialSlotCandidateResolution.assignedMaterialCount;
      state.slotCompatibilityStatus =
        materialSlotCandidateResolution.slotCompatibilityStatus;
      state.slotResolutionReason =
        materialSlotCandidateResolution.slotResolutionReason;
      state.surfaceMappingProfileId =
        componentSurfaceMappingCandidateResolution.surfaceMappingProfileId;
      state.componentAnchorSetId =
        componentSurfaceMappingCandidateResolution.componentAnchorSetId;
      state.resolvedAnchorCount =
        componentSurfaceMappingCandidateResolution.resolvedAnchorCount;
      state.mappedComponentCount =
        componentSurfaceMappingCandidateResolution.mappedComponentCount;
      state.surfaceMappingReason =
        componentSurfaceMappingCandidateResolution.surfaceMappingReason;
      state.attachmentMetadataProfileId =
        attachmentMetadataCandidateResolution.attachmentMetadataProfileId;
      state.glbPreparationProfileId =
        attachmentMetadataCandidateResolution.glbPreparationProfileId;
      state.socketMetadataCount =
        attachmentMetadataCandidateResolution.socketMetadataCount;
      state.componentMetadataCount =
        attachmentMetadataCandidateResolution.componentMetadataCount;
      state.attachmentMetadataReason =
        attachmentMetadataCandidateResolution.attachmentMetadataReason;
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
        assetVariantEnvelopeId:
          variantStructuralCompatibilityCandidateResolution.assetVariantEnvelopeId,
        structuralCompatibilityStatus:
          variantStructuralCompatibilityCandidateResolution.structuralCompatibilityStatus,
        selectedVariantProfileId:
          variantStructuralCompatibilityCandidateResolution.selectedVariantProfileId,
        variantConstraintReason:
          variantStructuralCompatibilityCandidateResolution.variantConstraintReason,
        variantSelectionSeed:
          variantStructuralCompatibilityCandidateResolution.variantSelectionSeed,
        materialCompatibilityStatus:
          materialPaletteFinishCompatibilityCandidateResolution.materialCompatibilityStatus,
        paletteCompatibilityStatus:
          materialPaletteFinishCompatibilityCandidateResolution.paletteCompatibilityStatus,
        finishProfileId:
          materialPaletteFinishCompatibilityCandidateResolution.finishProfileId,
        resolvedMaterialProfileId:
          materialPaletteFinishCompatibilityCandidateResolution.resolvedMaterialProfileId,
        materialReason:
          materialPaletteFinishCompatibilityCandidateResolution.materialReason,
        materialThemeBundleId:
          materialThemeBundleCandidateResolution.materialThemeBundleId,
        resolvedFinishSetId:
          materialThemeBundleCandidateResolution.resolvedFinishSetId,
        resolvedPaletteSetId:
          materialThemeBundleCandidateResolution.resolvedPaletteSetId,
        materialBundleCompatibilityStatus:
          materialThemeBundleCandidateResolution.materialBundleCompatibilityStatus,
        materialBundleReason:
          materialThemeBundleCandidateResolution.materialBundleReason,
        materialSlotSetId: materialSlotCandidateResolution.materialSlotSetId,
        resolvedSlotCount: materialSlotCandidateResolution.resolvedSlotCount,
        assignedMaterialCount:
          materialSlotCandidateResolution.assignedMaterialCount,
        slotCompatibilityStatus:
          materialSlotCandidateResolution.slotCompatibilityStatus,
        slotResolutionReason:
          materialSlotCandidateResolution.slotResolutionReason,
        surfaceMappingProfileId:
          componentSurfaceMappingCandidateResolution.surfaceMappingProfileId,
        componentAnchorSetId:
          componentSurfaceMappingCandidateResolution.componentAnchorSetId,
        resolvedAnchorCount:
          componentSurfaceMappingCandidateResolution.resolvedAnchorCount,
        mappedComponentCount:
          componentSurfaceMappingCandidateResolution.mappedComponentCount,
        surfaceMappingReason:
          componentSurfaceMappingCandidateResolution.surfaceMappingReason,
        attachmentMetadataProfileId:
          attachmentMetadataCandidateResolution.attachmentMetadataProfileId,
        glbPreparationProfileId:
          attachmentMetadataCandidateResolution.glbPreparationProfileId,
        socketMetadataCount:
          attachmentMetadataCandidateResolution.socketMetadataCount,
        componentMetadataCount:
          attachmentMetadataCandidateResolution.componentMetadataCount,
        attachmentMetadataReason:
          attachmentMetadataCandidateResolution.attachmentMetadataReason,
        materialAssignmentId:
          modularCandidateBindingResolution.materialAssignmentId,
        lodProfileId: modularCandidateBindingResolution.lodProfileId,
        atlasAssetPackageId:
          assetWorldValidationCandidateResolution.atlasAssetPackageId,
        assetValidationStatus:
          assetWorldValidationCandidateResolution.assetValidationStatus,
        bindingValidationReason:
          assetWorldValidationCandidateResolution.bindingValidationReason,
        placementValidationStatus:
          assetWorldValidationCandidateResolution.placementValidationStatus,
        rendererHandoffReadiness:
          assetWorldValidationCandidateResolution.rendererHandoffReadiness,
        worldPackageId: worldPackageValidationCandidateResolution.worldPackageId,
        packageValidationStatus:
          worldPackageValidationCandidateResolution.packageValidationStatus,
        compatibleAssetCount:
          worldPackageValidationCandidateResolution.compatibleAssetCount,
        blockedAssetCount:
          worldPackageValidationCandidateResolution.blockedAssetCount,
        packageReason: worldPackageValidationCandidateResolution.packageReason,
        settlementPackageProfileId:
          packageProfileCandidateResolution.settlementPackageProfileId,
        biomePackageProfileId:
          packageProfileCandidateResolution.biomePackageProfileId,
        resolvedWorldPackageId:
          packageProfileCandidateResolution.resolvedWorldPackageId,
        profileCompatibilityStatus:
          packageProfileCandidateResolution.profileCompatibilityStatus,
        packageSelectionReason:
          packageProfileCandidateResolution.packageSelectionReason,
        worldThemeProfileId:
          themeBundleCandidateResolution.worldThemeProfileId,
        regionalStyleBundleId:
          themeBundleCandidateResolution.regionalStyleBundleId,
        visualCohesionScore:
          themeBundleCandidateResolution.visualCohesionScore,
        themeCompatibilityStatus:
          themeBundleCandidateResolution.themeCompatibilityStatus,
        themeSelectionReason:
          themeBundleCandidateResolution.themeSelectionReason,
        architectureStyleProfileId:
          themeSubprofileCandidateResolution.architectureStyleProfileId,
        vegetationStyleProfileId:
          themeSubprofileCandidateResolution.vegetationStyleProfileId,
        streetscapeStyleProfileId:
          themeSubprofileCandidateResolution.streetscapeStyleProfileId,
        themeSubprofileCompatibility:
          themeSubprofileCandidateResolution.themeSubprofileCompatibility,
        styleSubprofileReason:
          themeSubprofileCandidateResolution.styleSubprofileReason,
        modularBibleFamilyId:
          modularBibleStyleBridgeCandidateResolution.modularBibleFamilyId,
        componentRecipeId:
          modularBibleStyleBridgeCandidateResolution.componentRecipeId,
        assetAssemblyProfileId:
          modularBibleStyleBridgeCandidateResolution.assetAssemblyProfileId,
        styleBridgeStatus:
          modularBibleStyleBridgeCandidateResolution.styleBridgeStatus,
        bridgeReason: modularBibleStyleBridgeCandidateResolution.bridgeReason,
        componentCompatibilityStatus:
          componentAssemblyRuleCandidateResolution.componentCompatibilityStatus,
        assemblyRuleProfileId:
          componentAssemblyRuleCandidateResolution.assemblyRuleProfileId,
        requiredComponentCount:
          componentAssemblyRuleCandidateResolution.requiredComponentCount,
        validatedComponentCount:
          componentAssemblyRuleCandidateResolution.validatedComponentCount,
        assemblyReason: componentAssemblyRuleCandidateResolution.assemblyReason,
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
        specialSiteType: specialSiteAccentCandidateResolution.specialSiteType,
        landmarkAccentProfileId:
          specialSiteAccentCandidateResolution.landmarkAccentProfileId,
        cornerLotAccentId:
          specialSiteAccentCandidateResolution.cornerLotAccentId,
        visibilityPriority:
          specialSiteAccentCandidateResolution.visibilityPriority,
        specialSiteReason:
          specialSiteAccentCandidateResolution.specialSiteReason,
        viewCorridorId: destinationFramingCandidateResolution.viewCorridorId,
        approachSequenceId:
          destinationFramingCandidateResolution.approachSequenceId,
        destinationFrameProfileId:
          destinationFramingCandidateResolution.destinationFrameProfileId,
        arrivalReason: destinationFramingCandidateResolution.arrivalReason,
        routeMemoryId: routeGuidanceCandidateResolution.routeMemoryId,
        wayfindingProfileId:
          routeGuidanceCandidateResolution.wayfindingProfileId,
        explorationRouteType:
          routeGuidanceCandidateResolution.explorationRouteType,
        guidanceReason: routeGuidanceCandidateResolution.guidanceReason,
        routePriority: routeGuidanceCandidateResolution.routePriority,
        placeMemoryId: placeMemoryCandidateResolution.placeMemoryId,
        storyCategory: placeMemoryCandidateResolution.storyCategory,
        localNarrativeProfileId:
          placeMemoryCandidateResolution.localNarrativeProfileId,
        discoveryImportance:
          placeMemoryCandidateResolution.discoveryImportance,
        storyReason: placeMemoryCandidateResolution.storyReason,
        memoryStateId: seasonalStoryMemoryCandidateResolution.memoryStateId,
        seasonalStoryProfileId:
          seasonalStoryMemoryCandidateResolution.seasonalStoryProfileId,
        eventHookProfileId:
          seasonalStoryMemoryCandidateResolution.eventHookProfileId,
        returnVisitCategory:
          seasonalStoryMemoryCandidateResolution.returnVisitCategory,
        storyEvolutionReason:
          seasonalStoryMemoryCandidateResolution.storyEvolutionReason,
        activityProfileId:
          activitySocialRhythmCandidateResolution.activityProfileId,
        socialRhythmId:
          activitySocialRhythmCandidateResolution.socialRhythmId,
        timeContextProfile:
          activitySocialRhythmCandidateResolution.timeContextProfile,
        activityReason:
          activitySocialRhythmCandidateResolution.activityReason,
        communityImportance:
          activitySocialRhythmCandidateResolution.communityImportance,
        civicRoutineProfileId:
          civicRoutineGatheringCandidateResolution.civicRoutineProfileId,
        gatheringPatternId:
          civicRoutineGatheringCandidateResolution.gatheringPatternId,
        temporalUseProfile:
          civicRoutineGatheringCandidateResolution.temporalUseProfile,
        communityRole:
          civicRoutineGatheringCandidateResolution.communityRole,
        routineReason: civicRoutineGatheringCandidateResolution.routineReason,
        serviceRoleId: localEconomyServiceCandidateResolution.serviceRoleId,
        economyProfileId:
          localEconomyServiceCandidateResolution.economyProfileId,
        marketCycleProfileId:
          localEconomyServiceCandidateResolution.marketCycleProfileId,
        serviceImportance:
          localEconomyServiceCandidateResolution.serviceImportance,
        economyReason: localEconomyServiceCandidateResolution.economyReason,
        mobilityProfileId:
          localMobilityAccessCandidateResolution.mobilityProfileId,
        accessPatternId:
          localMobilityAccessCandidateResolution.accessPatternId,
        flowPriority:
          localMobilityAccessCandidateResolution.flowPriority,
        movementReason:
          localMobilityAccessCandidateResolution.movementReason,
        accessibilityProfile:
          localMobilityAccessCandidateResolution.accessibilityProfile,
        occupancyProfileId:
          placeLivenessCandidateResolution.occupancyProfileId,
        timePresenceProfile:
          placeLivenessCandidateResolution.timePresenceProfile,
        livenessCategory:
          placeLivenessCandidateResolution.livenessCategory,
        peakActivityWindow:
          placeLivenessCandidateResolution.peakActivityWindow,
        presenceReason: placeLivenessCandidateResolution.presenceReason,
        weeklyRoutineProfileId:
          weeklyRoutineRecurrenceCandidateResolution.weeklyRoutineProfileId,
        recurrencePatternId:
          weeklyRoutineRecurrenceCandidateResolution.recurrencePatternId,
        communityCadenceId:
          weeklyRoutineRecurrenceCandidateResolution.communityCadenceId,
        eventFrequency:
          weeklyRoutineRecurrenceCandidateResolution.eventFrequency,
        recurrenceReason:
          weeklyRoutineRecurrenceCandidateResolution.recurrenceReason,
        traditionProfileId:
          traditionEventCycleCandidateResolution.traditionProfileId,
        seasonalEventCycleId:
          traditionEventCycleCandidateResolution.seasonalEventCycleId,
        communityTraditionId:
          traditionEventCycleCandidateResolution.communityTraditionId,
        eventImportance:
          traditionEventCycleCandidateResolution.eventImportance,
        traditionReason:
          traditionEventCycleCandidateResolution.traditionReason,
        festivalProfileId:
          festivalQuestNarrativeCandidateResolution.festivalProfileId,
        questNarrativeProfileId:
          festivalQuestNarrativeCandidateResolution.questNarrativeProfileId,
        seasonalDestinationProfileId:
          festivalQuestNarrativeCandidateResolution.seasonalDestinationProfileId,
        achievementHookProfileId:
          festivalQuestNarrativeCandidateResolution.achievementHookProfileId,
        narrativeReason:
          festivalQuestNarrativeCandidateResolution.narrativeReason,
        campaignProfileId:
          explorationProgressionCandidateResolution.campaignProfileId,
        destinationChainId:
          explorationProgressionCandidateResolution.destinationChainId,
        rewardArcProfileId:
          explorationProgressionCandidateResolution.rewardArcProfileId,
        progressionTier:
          explorationProgressionCandidateResolution.progressionTier,
        explorationReason:
          explorationProgressionCandidateResolution.explorationReason,
        expeditionProfileId:
          regionalExpeditionCandidateResolution.expeditionProfileId,
        campaignNetworkId:
          regionalExpeditionCandidateResolution.campaignNetworkId,
        completionArcId:
          regionalExpeditionCandidateResolution.completionArcId,
        regionalIdentityId:
          regionalExpeditionCandidateResolution.regionalIdentityId,
        expeditionReason:
          regionalExpeditionCandidateResolution.expeditionReason,
        worldJourneyProfileId:
          worldExplorationCohesionCandidateResolution.worldJourneyProfileId,
        metaCollectionId:
          worldExplorationCohesionCandidateResolution.metaCollectionId,
        crossRegionCampaignId:
          worldExplorationCohesionCandidateResolution.crossRegionCampaignId,
        explorationTier:
          worldExplorationCohesionCandidateResolution.explorationTier,
        worldCohesionReason:
          worldExplorationCohesionCandidateResolution.worldCohesionReason,
        signatureRouteProfileId:
          signatureRouteLegacyCandidateResolution.signatureRouteProfileId,
        legacyDestinationId:
          signatureRouteLegacyCandidateResolution.legacyDestinationId,
        mythologyProfileId:
          signatureRouteLegacyCandidateResolution.mythologyProfileId,
        globalJourneyTier:
          signatureRouteLegacyCandidateResolution.globalJourneyTier,
        legacyReason: signatureRouteLegacyCandidateResolution.legacyReason,
        worldWonderProfileId:
          worldWonderDiscoveryMemoryCandidateResolution.worldWonderProfileId,
        epicDestinationId:
          worldWonderDiscoveryMemoryCandidateResolution.epicDestinationId,
        discoveryMemoryTier:
          worldWonderDiscoveryMemoryCandidateResolution.discoveryMemoryTier,
        generationMemoryProfileId:
          worldWonderDiscoveryMemoryCandidateResolution.generationMemoryProfileId,
        wonderReason: worldWonderDiscoveryMemoryCandidateResolution.wonderReason,
        worldLegacyProfileId:
          worldLegacyDiscoveryCohesionCandidateResolution.worldLegacyProfileId,
        discoveryCohesionId:
          worldLegacyDiscoveryCohesionCandidateResolution.discoveryCohesionId,
        legacyTier:
          worldLegacyDiscoveryCohesionCandidateResolution.legacyTier,
        memoryCategory:
          worldLegacyDiscoveryCohesionCandidateResolution.memoryCategory,
        legacyReason:
          worldLegacyDiscoveryCohesionCandidateResolution.legacyReason,
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
    assetWorldValidationDecisions: deepFreeze(assetWorldValidationDecisions),
    worldPackageValidationDecisions: deepFreeze(
      worldPackageValidationDecisions
    ),
    packageProfileDecisions: deepFreeze(packageProfileDecisions),
    worldThemeBundleDecisions: deepFreeze(worldThemeBundleDecisions),
    themeSubprofileDecisions: deepFreeze(themeSubprofileDecisions),
    modularBibleStyleBridgeDecisions: deepFreeze(
      modularBibleStyleBridgeDecisions
    ),
    componentAssemblyRuleDecisions: deepFreeze(componentAssemblyRuleDecisions),
    variantStructuralCompatibilityDecisions: deepFreeze(
      variantStructuralCompatibilityDecisions
    ),
    microClusterAdjacencyDecisions: deepFreeze(microClusterAdjacencyDecisions),
    supportingCompositionDecisions: deepFreeze(supportingCompositionDecisions),
    specialSiteAccentDecisions: deepFreeze(specialSiteAccentDecisions),
    destinationFramingDecisions: deepFreeze(destinationFramingDecisions),
    routeGuidanceDecisions: deepFreeze(routeGuidanceDecisions),
    placeMemoryDecisions: deepFreeze(placeMemoryDecisions),
    seasonalStoryMemoryDecisions: deepFreeze(seasonalStoryMemoryDecisions),
    activitySocialRhythmDecisions: deepFreeze(activitySocialRhythmDecisions),
    civicRoutineGatheringDecisions: deepFreeze(civicRoutineGatheringDecisions),
    localEconomyServiceDecisions: deepFreeze(localEconomyServiceDecisions),
    localMobilityAccessDecisions: deepFreeze(localMobilityAccessDecisions),
    placeLivenessDecisions: deepFreeze(placeLivenessDecisions),
    weeklyRoutineRecurrenceDecisions: deepFreeze(
      weeklyRoutineRecurrenceDecisions
    ),
    traditionEventCycleDecisions: deepFreeze(traditionEventCycleDecisions),
    festivalQuestNarrativeDecisions: deepFreeze(
      festivalQuestNarrativeDecisions
    ),
    explorationProgressionDecisions: deepFreeze(
      explorationProgressionDecisions
    ),
    regionalExpeditionDecisions: deepFreeze(regionalExpeditionDecisions),
    worldExplorationCohesionDecisions: deepFreeze(
      worldExplorationCohesionDecisions
    ),
    signatureRouteLegacyDecisions: deepFreeze(signatureRouteLegacyDecisions),
    worldWonderDiscoveryMemoryDecisions: deepFreeze(
      worldWonderDiscoveryMemoryDecisions
    ),
    worldLegacyDiscoveryCohesionDecisions: deepFreeze(
      worldLegacyDiscoveryCohesionDecisions
    ),
    materialPaletteFinishCompatibilityDecisions: deepFreeze(
      materialPaletteFinishCompatibilityDecisions
    ),
    materialThemeBundleDecisions: deepFreeze(materialThemeBundleDecisions),
    materialSlotResolutionDecisions: deepFreeze(materialSlotResolutionDecisions),
    componentSurfaceMappingDecisions: deepFreeze(componentSurfaceMappingDecisions),
    attachmentMetadataDecisions: deepFreeze(attachmentMetadataDecisions),
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
      atlasAssetWorldValidationVersion: null,
      registeredAtlasAssetValidationRuleCount: 0,
      atlasAssetPackageId: null,
      assetValidationStatus: null,
      bindingValidationReason: null,
      placementValidationStatus: null,
      rendererHandoffReadiness: null,
      atlasAssetCompatibilityWorldPackagesVersion: null,
      registeredWorldPackageRuleCount: 0,
      worldPackageId: null,
      packageValidationStatus: null,
      compatibleAssetCount: 0,
      blockedAssetCount: 0,
      packageReason: null,
      atlasAssetBiomeSettlementPackageProfilesVersion: null,
      registeredPackageProfileRuleCount: 0,
      settlementPackageProfileId: null,
      biomePackageProfileId: null,
      resolvedWorldPackageId: null,
      profileCompatibilityStatus: null,
      packageSelectionReason: null,
      atlasWorldThemeStyleBundlesVersion: null,
      registeredThemeBundleRuleCount: 0,
      worldThemeProfileId: null,
      regionalStyleBundleId: null,
      visualCohesionScore: null,
      themeCompatibilityStatus: null,
      themeSelectionReason: null,
      atlasThemeSubprofileRulesVersion: null,
      registeredThemeSubprofileRuleCount: 0,
      architectureStyleProfileId: null,
      vegetationStyleProfileId: null,
      streetscapeStyleProfileId: null,
      themeSubprofileCompatibility: null,
      styleSubprofileReason: null,
      atlasModularBibleStyleBridgeVersion: null,
      registeredStyleBridgeRuleCount: 0,
      modularBibleFamilyId: null,
      componentRecipeId: null,
      assetAssemblyProfileId: null,
      styleBridgeStatus: null,
      bridgeReason: null,
      atlasComponentAssemblyRuleProfilesVersion: null,
      registeredComponentAssemblyRuleCount: 0,
      componentCompatibilityStatus: null,
      assemblyRuleProfileId: null,
      requiredComponentCount: 0,
      validatedComponentCount: 0,
      assemblyReason: null,
      atlasVariantStructuralCompatibilityProfilesVersion: null,
      registeredVariantCompatibilityRuleCount: 0,
      assetVariantEnvelopeId: null,
      structuralCompatibilityStatus: null,
      selectedVariantProfileId: null,
      variantConstraintReason: null,
      variantSelectionSeed: null,
      atlasMaterialPaletteFinishCompatibilityProfilesVersion: null,
      registeredMaterialCompatibilityRuleCount: 0,
      materialCompatibilityStatus: null,
      paletteCompatibilityStatus: null,
      finishProfileId: null,
      resolvedMaterialProfileId: null,
      materialReason: null,
      atlasMaterialThemeBundlesVersion: null,
      registeredMaterialThemeBundleRuleCount: 0,
      materialThemeBundleId: null,
      resolvedFinishSetId: null,
      resolvedPaletteSetId: null,
      materialBundleCompatibilityStatus: null,
      materialBundleReason: null,
      atlasMaterialSlotResolutionVersion: null,
      registeredMaterialSlotRuleCount: 0,
      materialSlotSetId: null,
      resolvedSlotCount: 0,
      assignedMaterialCount: 0,
      slotCompatibilityStatus: null,
      slotResolutionReason: null,
      atlasComponentSurfaceMappingVersion: null,
      registeredComponentSurfaceMappingRuleCount: 0,
      surfaceMappingProfileId: null,
      componentAnchorSetId: null,
      resolvedAnchorCount: 0,
      mappedComponentCount: 0,
      surfaceMappingReason: null,
      atlasAttachmentMetadataGlbPreparationVersion: null,
      registeredAttachmentMetadataRuleCount: 0,
      attachmentMetadataProfileId: null,
      glbPreparationProfileId: null,
      socketMetadataCount: 0,
      componentMetadataCount: 0,
      attachmentMetadataReason: null,
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
      specialSiteAccentVersion: null,
      registeredSpecialSiteAccentRuleCount: 0,
      specialSiteType: null,
      landmarkAccentProfileId: null,
      cornerLotAccentId: null,
      visibilityPriority: null,
      specialSiteReason: null,
      destinationFramingVersion: null,
      registeredDestinationFramingRuleCount: 0,
      viewCorridorId: null,
      approachSequenceId: null,
      destinationFrameProfileId: null,
      arrivalReason: null,
      routeGuidanceVersion: null,
      registeredRouteGuidanceRuleCount: 0,
      routeMemoryId: null,
      wayfindingProfileId: null,
      explorationRouteType: null,
      guidanceReason: null,
      routePriority: null,
      placeMemoryVersion: null,
      registeredPlaceMemoryRuleCount: 0,
      placeMemoryId: null,
      storyCategory: null,
      localNarrativeProfileId: null,
      discoveryImportance: null,
      storyReason: null,
      seasonalStoryMemoryVersion: null,
      registeredSeasonalStoryMemoryRuleCount: 0,
      memoryStateId: null,
      seasonalStoryProfileId: null,
      eventHookProfileId: null,
      returnVisitCategory: null,
      storyEvolutionReason: null,
      activitySocialRhythmVersion: null,
      registeredActivitySocialRhythmRuleCount: 0,
      activityProfileId: null,
      socialRhythmId: null,
      timeContextProfile: null,
      activityReason: null,
      communityImportance: null,
      civicRoutineGatheringVersion: null,
      registeredCivicRoutineRuleCount: 0,
      civicRoutineProfileId: null,
      gatheringPatternId: null,
      temporalUseProfile: null,
      communityRole: null,
      routineReason: null,
      localEconomyServiceVersion: null,
      registeredLocalEconomyServiceRuleCount: 0,
      serviceRoleId: null,
      economyProfileId: null,
      marketCycleProfileId: null,
      serviceImportance: null,
      economyReason: null,
      localMobilityAccessVersion: null,
      registeredLocalMobilityAccessRuleCount: 0,
      mobilityProfileId: null,
      accessPatternId: null,
      flowPriority: null,
      movementReason: null,
      accessibilityProfile: null,
      placeLivenessVersion: null,
      registeredPlaceLivenessRuleCount: 0,
      occupancyProfileId: null,
      timePresenceProfile: null,
      livenessCategory: null,
      peakActivityWindow: null,
      presenceReason: null,
      weeklyRoutineRecurrenceVersion: null,
      registeredWeeklyRoutineRuleCount: 0,
      weeklyRoutineProfileId: null,
      recurrencePatternId: null,
      communityCadenceId: null,
      eventFrequency: null,
      recurrenceReason: null,
      traditionEventCycleVersion: null,
      registeredTraditionRuleCount: 0,
      traditionProfileId: null,
      seasonalEventCycleId: null,
      communityTraditionId: null,
      eventImportance: null,
      traditionReason: null,
      festivalQuestNarrativeVersion: null,
      registeredNarrativeRuleCount: 0,
      festivalProfileId: null,
      questNarrativeProfileId: null,
      seasonalDestinationProfileId: null,
      achievementHookProfileId: null,
      narrativeReason: null,
      explorationProgressionVersion: null,
      registeredExplorationRuleCount: 0,
      campaignProfileId: null,
      destinationChainId: null,
      rewardArcProfileId: null,
      progressionTier: null,
      explorationReason: null,
      regionalExpeditionVersion: null,
      registeredExpeditionRuleCount: 0,
      expeditionProfileId: null,
      campaignNetworkId: null,
      completionArcId: null,
      regionalIdentityId: null,
      expeditionReason: null,
      worldExplorationCohesionVersion: null,
      registeredWorldExplorationRuleCount: 0,
      worldJourneyProfileId: null,
      metaCollectionId: null,
      crossRegionCampaignId: null,
      explorationTier: null,
      worldCohesionReason: null,
      signatureRouteLegacyVersion: null,
      registeredSignatureRouteLegacyRuleCount: 0,
      signatureRouteProfileId: null,
      legacyDestinationId: null,
      mythologyProfileId: null,
      globalJourneyTier: null,
      legacyReason: null,
      worldWonderDiscoveryMemoryVersion: null,
      registeredWorldWonderRuleCount: 0,
      worldWonderProfileId: null,
      epicDestinationId: null,
      discoveryMemoryTier: null,
      generationMemoryProfileId: null,
      wonderReason: null,
      worldLegacyDiscoveryCohesionVersion: null,
      registeredWorldLegacyRuleCount: 0,
      worldLegacyProfileId: null,
      discoveryCohesionId: null,
      legacyTier: null,
      memoryCategory: null,
      legacyReason: null,
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
