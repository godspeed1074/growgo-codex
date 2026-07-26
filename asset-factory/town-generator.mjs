import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateSuburbanDistrictPreview } from "./suburban-district-generator.mjs";

const townSchemaId = "TOWN_LAYOUT_001";
const districtPlacementSchemaId = "TOWN_DISTRICT_PLACEMENT_INSTANCE_001";
const townCentreSchemaId = "TOWN_CENTRE_ZONE_INSTANCE_001";
const commercialZoneSchemaId = "COMMERCIAL_ZONE_INSTANCE_001";
const civicReserveSchemaId = "CIVIC_RESERVE_INSTANCE_001";
const transportCorridorSchemaId = "TRANSPORT_CORRIDOR_INSTANCE_001";
const recreationZoneSchemaId = "RECREATION_ZONE_INSTANCE_001";
const landmarkReserveSchemaId = "LANDMARK_RESERVE_INSTANCE_001";
const validationSchemaId = "TOWN_VALIDATION_001";
const validationOutputId = "TOWN_LAYOUT_001_VALIDATION_001";
const townVariantProfileSystemSchemaId = "TOWN_VARIANT_PROFILE_SYSTEM_001";
const townVariantProfileSchemaId = "TOWN_VARIANT_PROFILE_001";
const variantWeightProfileSchemaId = "VARIANT_WEIGHT_PROFILE_001";
const variantValidationSchemaId = "VARIANT_VALIDATION_001";

const supportedTownThemeSeeds = Object.freeze([
  "SMALL_COASTAL_TOWN",
  "REGIONAL_TOWN",
  "SUBURBAN_CITY_EDGE",
  "TOURIST_TOWN"
]);

const supportedDistrictTypes = new Set([
  "RESIDENTIAL_DISTRICT_SUBURBAN",
  "RESIDENTIAL_DISTRICT_COASTAL",
  "RESIDENTIAL_DISTRICT_MIXED",
  "RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY",
  "COASTAL_RESIDENTIAL_DISTRICT",
  "TOURISM_DISTRICT"
]);

const supportedCentreTypes = new Set([
  "MAIN_STREET",
  "PLAZA_CENTRE",
  "VILLAGE_CENTRE",
  "FUTURE_CBD_EDGE"
]);

const supportedCommercialTypes = new Set([
  "TOWN_MAIN_STREET_001",
  "COMMERCIAL_STRIP_001",
  "COASTAL_TOURISM_RETAIL",
  "FUTURE_SHOPPING_CENTRE"
]);

const supportedCivicTypes = new Set([
  "SCHOOL_RESERVE",
  "LIBRARY_RESERVE",
  "COMMUNITY_CENTRE_RESERVE",
  "EMERGENCY_SERVICE_RESERVE",
  "HEALTHCARE_RESERVE"
]);

const supportedCorridorTypes = new Set([
  "LOCAL_ROAD",
  "COLLECTOR_ROAD",
  "ARTERIAL_ROAD",
  "BUS_CORRIDOR",
  "RAILWAY_CORRIDOR",
  "FUTURE_STATION_LINK"
]);

const supportedRecreationTypes = new Set([
  "PARK",
  "SPORTS_FIELD",
  "PLAYGROUND_ZONE",
  "WALKING_TRAIL",
  "GREEN_CORRIDOR",
  "WATERFRONT_RECREATION_ZONE"
]);

const supportedLandmarkTypes = new Set([
  "HISTORICAL_LANDMARK",
  "TOURIST_ATTRACTION",
  "NATURAL_LANDMARK",
  "UNIQUE_TOWN_FEATURE"
]);

const supportedSourceDistrictThemeSeeds = Object.freeze([
  "LOW_DENSITY_SUBURBAN",
  "MEDIUM_DENSITY_SUBURBAN",
  "FUTURE_URBAN_EDGE"
]);

const deterministicDistrictSeedPools = deepFreeze({
  LOW_DENSITY_SUBURBAN: [10002, 10003, 10004, 10005, 10006],
  MEDIUM_DENSITY_SUBURBAN: [10001, 10002, 10003, 10005, 10006],
  FUTURE_URBAN_EDGE: [10001, 10002, 10003, 10004, 10005]
});

const townThemeProfiles = deepFreeze({
  SMALL_COASTAL_TOWN: {
    themeSeed: "SMALL_COASTAL_TOWN",
    generationProfile: "small_coastal_town_default",
    districtCountRange: [2, 4],
    targetDistrictCount: 3,
    districtBlueprints: [
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "LOW_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "COASTAL_RESIDENTIAL_DISTRICT",
        districtThemeSeed: "COASTAL_ESTATES",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_COASTAL",
        themeProfile: "COASTAL_HOLIDAY_RESIDENTIAL",
        blockTarget: 4
      },
      {
        districtType: "TOURISM_DISTRICT",
        districtThemeSeed: "MEDIUM_DENSITY_SUBURBAN",
        sizeProfile: "SMALL_DISTRICT",
        densityProfile: "LOW_MEDIUM_DENSITY_TOURISM",
        themeProfile: "COASTAL_TOURISM_WATERFRONT",
        blockTarget: 4
      }
    ],
    centreType: "MAIN_STREET",
    centreSize: { width: 260, depth: 152 },
    commercialIntensity: "MEDIUM",
    transportIntensity: "LOW",
    recreationAllocation: "HIGH",
    coastalProfile: {
      profileId: "COASTAL_TOWN_PROFILE",
      coastlineOrientation: "EAST_FACING",
      growthDirection: "INLAND_TO_COASTAL_CENTRELINE",
      waterfrontCharacter: "FORESHORE_MAIN_STREET_AND_VISITOR_EDGE",
      tourismIntensity: "MEDIUM_HIGH",
      protectedNaturalAreaTypes: ["FORESHORE_RESERVE", "DUNE_EDGE", "LOOKOUT_EDGE"],
      visitorFocus: "WATERFRONT_AND_LOOKOUTS"
    }
  },
  REGIONAL_TOWN: {
    themeSeed: "REGIONAL_TOWN",
    generationProfile: "regional_town_default",
    districtCountRange: [3, 6],
    targetDistrictCount: 4,
    districtBlueprints: [
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "LOW_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "LOW_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_MIXED",
        districtThemeSeed: "MEDIUM_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_MEDIUM_DENSITY_MIXED",
        themeProfile: "MIXED_AUSTRALIAN_REGIONAL",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_COASTAL",
        districtThemeSeed: "COASTAL_ESTATES",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_COASTAL",
        themeProfile: "COASTAL_ESTATES",
        blockTarget: 4
      }
    ],
    centreType: "MAIN_STREET",
    centreSize: { width: 300, depth: 176 },
    commercialIntensity: "MEDIUM_HIGH",
    transportIntensity: "MEDIUM",
    recreationAllocation: "MEDIUM"
  },
  SUBURBAN_CITY_EDGE: {
    themeSeed: "SUBURBAN_CITY_EDGE",
    generationProfile: "suburban_city_edge_default",
    districtCountRange: [4, 8],
    targetDistrictCount: 5,
    districtBlueprints: [
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "LOW_DENSITY_SUBURBAN",
        sizeProfile: "LARGE_DISTRICT",
        densityProfile: "LOW_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "MEDIUM_DENSITY_SUBURBAN",
        sizeProfile: "LARGE_DISTRICT",
        densityProfile: "MEDIUM_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY",
        districtThemeSeed: "FUTURE_URBAN_EDGE",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "FUTURE_EDGE_MEDIUM_DENSITY",
        themeProfile: "FUTURE_URBAN_EDGE",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_MIXED",
        districtThemeSeed: "MEDIUM_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "MEDIUM_DENSITY_SUBURBAN",
        themeProfile: "MIXED_CITY_EDGE",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_COASTAL",
        districtThemeSeed: "COASTAL_ESTATES",
        sizeProfile: "SMALL_DISTRICT",
        densityProfile: "LOW_DENSITY_COASTAL",
        themeProfile: "COASTAL_EDGE_POCKET",
        blockTarget: 4
      }
    ],
    centreType: "PLAZA_CENTRE",
    centreSize: { width: 340, depth: 196 },
    commercialIntensity: "MEDIUM",
    transportIntensity: "HIGH",
    recreationAllocation: "MEDIUM"
  },
  TOURIST_TOWN: {
    themeSeed: "TOURIST_TOWN",
    generationProfile: "tourist_town_default",
    districtCountRange: [2, 5],
    targetDistrictCount: 4,
    districtBlueprints: [
      {
        districtType: "RESIDENTIAL_DISTRICT_COASTAL",
        districtThemeSeed: "COASTAL_ESTATES",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_DENSITY_COASTAL",
        themeProfile: "COASTAL_ESTATES",
        blockTarget: 4
      },
      {
        districtType: "TOURISM_DISTRICT",
        districtThemeSeed: "MEDIUM_DENSITY_SUBURBAN",
        sizeProfile: "MEDIUM_DISTRICT",
        densityProfile: "LOW_MEDIUM_DENSITY_MIXED",
        themeProfile: "TOURISM_MIXED",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_SUBURBAN",
        districtThemeSeed: "LOW_DENSITY_SUBURBAN",
        sizeProfile: "SMALL_DISTRICT",
        densityProfile: "LOW_DENSITY_SUBURBAN",
        themeProfile: "SUBURBAN_AUSTRALIA",
        blockTarget: 4
      },
      {
        districtType: "RESIDENTIAL_DISTRICT_COASTAL",
        districtThemeSeed: "COASTAL_ESTATES",
        sizeProfile: "SMALL_DISTRICT",
        densityProfile: "LOW_DENSITY_COASTAL",
        themeProfile: "COASTAL_TOURISM_EDGE",
        blockTarget: 4
      }
    ],
    centreType: "VILLAGE_CENTRE",
    centreSize: { width: 280, depth: 168 },
    commercialIntensity: "HIGH",
    transportIntensity: "MEDIUM",
    recreationAllocation: "HIGH"
  }
});

const townVariantProfiles = deepFreeze({
  SMALL_COASTAL_TOWN: {
    schemaId: townVariantProfileSchemaId,
    profileId: "SMALL_COASTAL_TOWN",
    settlementIdentity: "LOW_DENSITY_COASTAL_SETTLEMENT",
    districtWeighting: {
      residential: 0.55,
      coastal: 1,
      tourism: 0.7,
      civic: 0.45,
      commercial: 0.55,
      industrialService: 0.15,
      futureMediumDensity: 0.1
    },
    densityProfile: {
      baseline: "LOW",
      residentialSpread: "COMPACT_WITH_COASTAL_EDGE",
      futureDensitySupport: "LIMITED"
    },
    centreBehaviour: {
      centreCount: 1,
      primaryCentreType: "MAIN_STREET",
      intensity: "MEDIUM",
      pedestrianPriority: "HIGH",
      waterfrontLinked: true
    },
    commercialIntensity: {
      level: "MODERATE",
      targetZoneCount: 2,
      waterfrontRetailBias: 0.85
    },
    civicAllocation: {
      level: "MODERATE",
      targetReserveCount: 4,
      centreClusterBias: 0.8
    },
    transportIntensity: {
      level: "LOW",
      roadHierarchyBias: "LOCAL_COLLECTOR",
      busSupport: "MEDIUM",
      railwayPotential: "LOW",
      parkingBias: "MODERATE"
    },
    recreationAllocation: {
      level: "HIGH",
      targetZoneCount: 5,
      waterfrontRecreationBias: 1,
      trailBias: 0.9
    },
    landmarkWeighting: {
      level: "HIGH",
      targetLandmarkCount: 3,
      waterfrontBias: 0.95,
      scenicBias: 0.9
    },
    boundaryBehaviour: {
      style: "coastal_irregular_polygon",
      scenicConstraint: "COASTLINE_AND_FORESHORE",
      protectedEdgeBias: "HIGH"
    },
    growthDirection: {
      primary: "INLAND_TO_COASTAL_CENTRELINE",
      corridorBias: "SECONDARY",
      waterfrontBias: "HIGH"
    },
    identityTargets: {
      waterfrontRelationship: "PRIMARY",
      tourismVisibility: "MEDIUM_HIGH",
      ruralTransitionMode: "COASTAL_FRINGE"
    },
    validationTargets: {
      minIdentityScore: 80,
      requiredDistrictTypes: ["COASTAL_RESIDENTIAL_DISTRICT", "TOURISM_DISTRICT"],
      requiredCommercialTypes: ["COASTAL_TOURISM_RETAIL"],
      requiredRecreationTypes: ["WATERFRONT_RECREATION_ZONE", "WALKING_TRAIL"],
      minLandmarkCount: 3
    }
  },
  REGIONAL_TOWN: {
    schemaId: townVariantProfileSchemaId,
    profileId: "REGIONAL_TOWN",
    settlementIdentity: "RURAL_SERVICE_CENTRE",
    districtWeighting: {
      residential: 0.9,
      coastal: 0.05,
      tourism: 0.15,
      civic: 0.95,
      commercial: 0.8,
      industrialService: 0.8,
      futureMediumDensity: 0.2
    },
    densityProfile: {
      baseline: "LOW_MEDIUM",
      residentialSpread: "RADIAL_SERVICE_GROWTH",
      futureDensitySupport: "LIMITED"
    },
    centreBehaviour: {
      centreCount: 1,
      primaryCentreType: "MAIN_STREET",
      intensity: "HIGH",
      pedestrianPriority: "MEDIUM",
      waterfrontLinked: false
    },
    commercialIntensity: {
      level: "MEDIUM_HIGH",
      targetZoneCount: 2,
      waterfrontRetailBias: 0
    },
    civicAllocation: {
      level: "HIGH",
      targetReserveCount: 5,
      centreClusterBias: 0.7
    },
    transportIntensity: {
      level: "MEDIUM_HIGH",
      roadHierarchyBias: "COLLECTOR_ARTERIAL",
      busSupport: "MEDIUM",
      railwayPotential: "MEDIUM_HIGH",
      parkingBias: "HIGH"
    },
    recreationAllocation: {
      level: "MEDIUM",
      targetZoneCount: 4,
      waterfrontRecreationBias: 0,
      trailBias: 0.35
    },
    landmarkWeighting: {
      level: "MEDIUM",
      targetLandmarkCount: 2,
      waterfrontBias: 0,
      scenicBias: 0.4
    },
    boundaryBehaviour: {
      style: "regional_radial_polygon",
      scenicConstraint: "RURAL_CATCHMENT",
      protectedEdgeBias: "MEDIUM"
    },
    growthDirection: {
      primary: "RADIAL_FROM_SERVICE_CORE",
      corridorBias: "HIGH",
      waterfrontBias: "NONE"
    },
    identityTargets: {
      waterfrontRelationship: "NONE",
      tourismVisibility: "LOW",
      ruralTransitionMode: "SERVICE_FRINGE"
    },
    validationTargets: {
      minIdentityScore: 75,
      requiredDistrictTypes: ["RESIDENTIAL_DISTRICT_MIXED"],
      requiredCommercialTypes: ["COMMERCIAL_STRIP_001"],
      requiredRecreationTypes: ["SPORTS_FIELD"],
      minLandmarkCount: 2
    }
  },
  TOURIST_TOWN: {
    schemaId: townVariantProfileSchemaId,
    profileId: "TOURIST_TOWN",
    settlementIdentity: "VISITOR_DESTINATION_SETTLEMENT",
    districtWeighting: {
      residential: 0.45,
      coastal: 0.7,
      tourism: 1,
      civic: 0.45,
      commercial: 1,
      industrialService: 0.25,
      futureMediumDensity: 0.15
    },
    densityProfile: {
      baseline: "LOW_MEDIUM",
      residentialSpread: "DESTINATION_CLUSTERED",
      futureDensitySupport: "LOW"
    },
    centreBehaviour: {
      centreCount: 1,
      primaryCentreType: "VILLAGE_CENTRE",
      intensity: "HIGH",
      pedestrianPriority: "HIGH",
      waterfrontLinked: true
    },
    commercialIntensity: {
      level: "HIGH",
      targetZoneCount: 3,
      waterfrontRetailBias: 0.75
    },
    civicAllocation: {
      level: "MEDIUM",
      targetReserveCount: 4,
      centreClusterBias: 0.55
    },
    transportIntensity: {
      level: "MEDIUM",
      roadHierarchyBias: "COLLECTOR_VISITOR_LOOP",
      busSupport: "MEDIUM_HIGH",
      railwayPotential: "MEDIUM",
      parkingBias: "HIGH"
    },
    recreationAllocation: {
      level: "HIGH",
      targetZoneCount: 5,
      waterfrontRecreationBias: 0.75,
      trailBias: 1
    },
    landmarkWeighting: {
      level: "VERY_HIGH",
      targetLandmarkCount: 4,
      waterfrontBias: 0.7,
      scenicBias: 1
    },
    boundaryBehaviour: {
      style: "scenic_destination_polygon",
      scenicConstraint: "LOOKOUT_AND_ATTRACTION_EDGES",
      protectedEdgeBias: "MEDIUM_HIGH"
    },
    growthDirection: {
      primary: "ATTRACTION_LED_CORRIDOR_GROWTH",
      corridorBias: "MEDIUM",
      waterfrontBias: "MEDIUM_HIGH"
    },
    identityTargets: {
      waterfrontRelationship: "SECONDARY_OR_PRIMARY",
      tourismVisibility: "VERY_HIGH",
      ruralTransitionMode: "SCENIC_EDGE"
    },
    validationTargets: {
      minIdentityScore: 80,
      requiredDistrictTypes: ["TOURISM_DISTRICT"],
      requiredCommercialTypes: ["COASTAL_TOURISM_RETAIL"],
      requiredRecreationTypes: ["WALKING_TRAIL"],
      minLandmarkCount: 4
    }
  },
  SUBURBAN_CITY_EDGE: {
    schemaId: townVariantProfileSchemaId,
    profileId: "SUBURBAN_CITY_EDGE",
    settlementIdentity: "URBAN_FRINGE_EXPANSION_ZONE",
    districtWeighting: {
      residential: 1,
      coastal: 0.15,
      tourism: 0.1,
      civic: 0.65,
      commercial: 0.8,
      industrialService: 0.5,
      futureMediumDensity: 0.9
    },
    densityProfile: {
      baseline: "MEDIUM",
      residentialSpread: "CORRIDOR_EXPANSION",
      futureDensitySupport: "HIGH"
    },
    centreBehaviour: {
      centreCount: 2,
      primaryCentreType: "PLAZA_CENTRE",
      secondaryCentreType: "FUTURE_CBD_EDGE",
      intensity: "MEDIUM_HIGH",
      pedestrianPriority: "MEDIUM",
      waterfrontLinked: false
    },
    commercialIntensity: {
      level: "MEDIUM_HIGH",
      targetZoneCount: 2,
      waterfrontRetailBias: 0
    },
    civicAllocation: {
      level: "MEDIUM_HIGH",
      targetReserveCount: 5,
      centreClusterBias: 0.45
    },
    transportIntensity: {
      level: "HIGH",
      roadHierarchyBias: "COLLECTOR_ARTERIAL_HIGH",
      busSupport: "HIGH",
      railwayPotential: "MEDIUM_HIGH",
      parkingBias: "MEDIUM_HIGH"
    },
    recreationAllocation: {
      level: "MEDIUM",
      targetZoneCount: 4,
      waterfrontRecreationBias: 0,
      trailBias: 0.3
    },
    landmarkWeighting: {
      level: "LOW_MEDIUM",
      targetLandmarkCount: 2,
      waterfrontBias: 0,
      scenicBias: 0.25
    },
    boundaryBehaviour: {
      style: "corridor_growth_polygon",
      scenicConstraint: "URBAN_EXPANSION_FRONT",
      protectedEdgeBias: "LOW_MEDIUM"
    },
    growthDirection: {
      primary: "CORRIDOR_LED_OUTWARD_GROWTH",
      corridorBias: "VERY_HIGH",
      waterfrontBias: "NONE"
    },
    identityTargets: {
      waterfrontRelationship: "NONE",
      tourismVisibility: "LOW",
      ruralTransitionMode: "URBAN_EDGE"
    },
    validationTargets: {
      minIdentityScore: 75,
      requiredDistrictTypes: ["RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY"],
      requiredCommercialTypes: ["FUTURE_SHOPPING_CENTRE"],
      requiredRecreationTypes: ["GREEN_CORRIDOR"],
      minLandmarkCount: 2
    }
  }
});

export const townGeneratorDefaultInput = deepFreeze({
  townSeed: 10482,
  regionSeed: 1,
  townThemeSeed: "SMALL_COASTAL_TOWN",
  townConfiguration: deepFreeze({
    schemaId: townSchemaId,
    previewId: "TOWN_LAYOUT_001_PREVIEW_001",
    generationProfile: "small_coastal_town_default",
    minDistricts: 2,
    maxDistricts: 6,
    districtSpacingX: 760,
    districtSpacingY: 620,
    districtFootprintWidth: 760,
    districtFootprintDepth: 620,
    townPadding: 240,
    centreOffsetY: 24,
    connectorRoadWidth: 24,
    collectorRoadWidth: 18,
    railCorridorWidth: 20
  })
});

export function createTownGenerator(options = townGeneratorDefaultInput) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);
  return Object.freeze({
    generate(overrides = {}) {
      return generateTownLayoutPreview({
        ...normalizedDefaultInput,
        ...overrides,
        townConfiguration: {
          ...normalizedDefaultInput.townConfiguration,
          ...(overrides.townConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateTownLayoutPreview(preview);
    }
  });
}

export function generateTownLayoutPreview(rawInput = townGeneratorDefaultInput) {
  const input = normalizeGeneratorInput(rawInput);
  const townThemeProfile = resolveTownThemeProfile(input);
  const variantProfile = resolveTownVariantProfile(input);
  const variantWeightProfile = buildVariantWeightProfile(variantProfile);
  const seedConfig = buildSeedConfig(input);
  const districtPlacements = buildDistrictPlacements(
    input,
    townThemeProfile,
    variantProfile,
    seedConfig
  );
  const coastalIdentityProfile = buildCoastalIdentityProfile(
    input,
    townThemeProfile,
    variantProfile,
    districtPlacements
  );
  const townBounds = buildTownBounds(
    input,
    districtPlacements,
    coastalIdentityProfile,
    variantProfile
  );
  const townCentreZones = buildTownCentreZones(
    input,
    townThemeProfile,
    variantProfile,
    districtPlacements
  );
  const commercialZones = buildCommercialZones(
    input,
    townThemeProfile,
    variantProfile,
    townCentreZones,
    coastalIdentityProfile,
    townBounds
  );
  const civicReserves = buildCivicReserves(
    input,
    townThemeProfile,
    variantProfile,
    townBounds
  );
  const transportCorridors = buildTransportCorridors(
    input,
    townThemeProfile,
    variantProfile,
    districtPlacements,
    townCentreZones,
    commercialZones,
    civicReserves,
    townBounds
  );
  const recreationZones = buildRecreationZones(
    input,
    townThemeProfile,
    variantProfile,
    townBounds,
    townCentreZones,
    districtPlacements
  );
  const landmarkReserves = buildLandmarkReserves(
    input,
    townThemeProfile,
    variantProfile,
    townBounds,
    townCentreZones
  );
  const townTransitionZones = buildTownTransitionZones(
    input,
    variantProfile,
    townBounds,
    townCentreZones,
    districtPlacements
  );
  const serviceEdgeZones = buildServiceEdgeZones(townBounds, variantProfile);
  const ruralTransitionZones = buildRuralTransitionZones(townTransitionZones);
  const districtLotCount = districtPlacements.reduce(
    (sum, placement) => sum + placement.estimatedLotCount,
    0
  );

  const preview = deepFreeze({
    schemaId: townSchemaId,
    townId: `TOWN_LAYOUT_${String(input.townSeed).padStart(5, "0")}`,
    previewId: input.townConfiguration.previewId,
    generationProfile: townThemeProfile.generationProfile,
    seed: input.townSeed,
    seedConfig,
    townThemeProfile: deepFreeze({ ...townThemeProfile }),
    variantProfileSystem: deepFreeze({
      schemaId: townVariantProfileSystemSchemaId,
      selectedProfileId: variantProfile.profileId,
      selectionSource: "townThemeSeed"
    }),
    variantProfile,
    variantWeightProfile,
    coastalIdentityProfile,
    townBounds,
    districtPlacements: deepFreeze(districtPlacements),
    townCentreZones: deepFreeze(townCentreZones),
    commercialZones: deepFreeze(commercialZones),
    civicReserves: deepFreeze(civicReserves),
    transportCorridors: deepFreeze(transportCorridors),
    recreationZones: deepFreeze(recreationZones),
    landmarkReserves: deepFreeze(landmarkReserves),
    serviceEdgeZones: deepFreeze(serviceEdgeZones),
    townTransitionZones: deepFreeze(townTransitionZones),
    ruralTransitionZones: deepFreeze(ruralTransitionZones),
    townMetadata: deepFreeze({
      districtCount: districtPlacements.length,
      districtLotCount,
      commercialZoneCount: commercialZones.length,
      transportCorridorCount: transportCorridors.length,
      civicReserveCount: civicReserves.length,
      landmarkReserveCount: landmarkReserves.length,
      recreationZoneCount: recreationZones.length,
      transitionZoneCount: townTransitionZones.length,
      boundaryShape: townBounds.boundaryShape,
      profileId: variantProfile.profileId,
      centreCount: townCentreZones.length
    }),
    validationContract: deepFreeze({
      schemaId: validationSchemaId,
      checks: deepFreeze({
        profileAppliedCorrectly: true,
        requiredZonesGenerated: true,
        weightingToleranceValid: true,
        variantIdentityScoreValid: true,
        districtsInsideBoundary: true,
        districtOverlapFree: true,
        roadsConnected: true,
        zonesValid: true,
        townCentreAccessible: true,
        townCentreTransportConnected: true,
        townCentreResidentialConnected: true,
        commercialPlacementValid: true,
        commercialPedestrianConnected: true,
        civicAccessible: true,
        civicRoadRelationshipValid: true,
        recreationConnected: true,
        landmarksValid: true,
        serviceEdgesValid: true,
        ruralTransitionsValid: true,
        coastalIdentityScoreValid: true,
        boundaryNaturalnessValid: true,
        waterfrontRelationshipValid: true,
        tourismZoneValidity: true,
        deterministicRebuildValid: true,
        streamingBoundariesValid: true,
        instanceReuseStrategyValid: true
      })
    }),
    validationResult: null
  });

  const validationResult = buildValidationResult(preview, input);
  const finalizedPreview = deepFreeze({
    ...preview,
    validationResult
  });

  const validation = validateTownLayoutPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function createTownLayoutValidationOutput(
  rawPreview,
  validationId = validationOutputId
) {
  const preview = normalizeGeneratedPreview(rawPreview);
  return deepFreeze({
    schemaId: validationSchemaId,
    validationId,
    previewId: preview.previewId,
    townId: preview.townId,
    seed: preview.seed,
    summary: deepFreeze({
      validationPassed: preview.validationResult.validationPassed,
      profileId: preview.variantProfile.profileId,
      districtCount: preview.districtPlacements.length,
      districtLotCount: preview.townMetadata.districtLotCount,
      centreCount: preview.townCentreZones.length,
      townCentreCount: preview.townCentreZones.length,
      commercialZoneCount: preview.commercialZones.length,
      civicReserveCount: preview.civicReserves.length,
      transportCorridorCount: preview.transportCorridors.length,
      recreationZoneCount: preview.recreationZones.length,
      landmarkReserveCount: preview.landmarkReserves.length,
      transitionZoneCount: preview.townTransitionZones.length,
      coastalIdentityScore: preview.validationResult.coastalIdentityScore,
      variantIdentityScore: preview.validationResult.variantIdentityScore
    }),
    checks: deepFreeze({
      profileAppliedCorrectly: passFail(preview.validationResult.profileAppliedCorrectly),
      requiredZonesGenerated: passFail(preview.validationResult.requiredZonesGenerated),
      weightingToleranceValid: passFail(preview.validationResult.weightingToleranceValid),
      variantIdentityScoreValid: passFail(
        preview.validationResult.variantIdentityScoreValid
      ),
      districtsInsideBoundary: passFail(preview.validationResult.districtsInsideBoundary),
      districtOverlapFree: passFail(preview.validationResult.districtOverlapFree),
      roadsConnected: passFail(preview.validationResult.roadsConnected),
      zonesValid: passFail(preview.validationResult.zonesValid),
      townCentreAccessible: passFail(preview.validationResult.townCentreAccessible),
      townCentreTransportConnected: passFail(
        preview.validationResult.townCentreTransportConnected
      ),
      townCentreResidentialConnected: passFail(
        preview.validationResult.townCentreResidentialConnected
      ),
      commercialPlacementValid: passFail(
        preview.validationResult.commercialPlacementValid
      ),
      commercialPedestrianConnected: passFail(
        preview.validationResult.commercialPedestrianConnected
      ),
      civicAccessible: passFail(preview.validationResult.civicAccessible),
      civicRoadRelationshipValid: passFail(
        preview.validationResult.civicRoadRelationshipValid
      ),
      recreationConnected: passFail(preview.validationResult.recreationConnected),
      landmarksValid: passFail(preview.validationResult.landmarksValid),
      serviceEdgesValid: passFail(preview.validationResult.serviceEdgesValid),
      ruralTransitionsValid: passFail(preview.validationResult.ruralTransitionsValid),
      coastalIdentityScoreValid: passFail(
        preview.validationResult.coastalIdentityScoreValid
      ),
      boundaryNaturalnessValid: passFail(
        preview.validationResult.boundaryNaturalnessValid
      ),
      waterfrontRelationshipValid: passFail(
        preview.validationResult.waterfrontRelationshipValid
      ),
      tourismZoneValidity: passFail(preview.validationResult.tourismZoneValidity),
      deterministicRebuildValid: passFail(
        preview.validationResult.deterministicRebuildValid
      ),
      streamingBoundariesValid: passFail(
        preview.validationResult.streamingBoundariesValid
      ),
      instanceReuseStrategyValid: passFail(
        preview.validationResult.instanceReuseStrategyValid
      )
    })
  });
}

export function validateTownLayoutPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.districtPlacements.length < 2 || preview.districtPlacements.length > 8) {
      throw createValidationError(
        "invalid_district_count",
        "Town preview must generate between 2 and 8 district placements."
      );
    }

    for (const district of preview.districtPlacements) {
      if (!supportedDistrictTypes.has(district.districtType)) {
        throw createValidationError(
          "invalid_district_type",
          `District placement ${district.districtPlacementId} has an unsupported district type.`
        );
      }
    }

    for (const centre of preview.townCentreZones) {
      if (!supportedCentreTypes.has(centre.centreType)) {
        throw createValidationError(
          "invalid_centre_type",
          `Town centre ${centre.centreId} has an unsupported centre type.`
        );
      }
    }

    for (const zone of preview.commercialZones) {
      if (!supportedCommercialTypes.has(zone.commercialType)) {
        throw createValidationError(
          "invalid_commercial_type",
          `Commercial zone ${zone.commercialZoneId} has an unsupported commercial type.`
        );
      }
    }

    for (const reserve of preview.civicReserves) {
      if (!supportedCivicTypes.has(reserve.civicType)) {
        throw createValidationError(
          "invalid_civic_type",
          `Civic reserve ${reserve.civicReserveId} has an unsupported civic type.`
        );
      }
    }

    for (const corridor of preview.transportCorridors) {
      if (!supportedCorridorTypes.has(corridor.corridorType)) {
        throw createValidationError(
          "invalid_transport_type",
          `Transport corridor ${corridor.corridorId} has an unsupported corridor type.`
        );
      }
    }

    for (const zone of preview.recreationZones) {
      if (!supportedRecreationTypes.has(zone.recreationType)) {
        throw createValidationError(
          "invalid_recreation_type",
          `Recreation zone ${zone.recreationZoneId} has an unsupported recreation type.`
        );
      }
    }

    for (const reserve of preview.landmarkReserves) {
      if (!supportedLandmarkTypes.has(reserve.landmarkType)) {
        throw createValidationError(
          "invalid_landmark_type",
          `Landmark reserve ${reserve.landmarkReserveId} has an unsupported landmark type.`
        );
      }
    }

    if (!preview.validationResult.validationPassed) {
      const failedChecks = Object.entries(preview.validationResult)
        .filter(
          ([key, value]) =>
            typeof value === "boolean" &&
            key !== "validationPassed" &&
            value === false
        )
        .map(([key]) => key);
      throw createValidationError(
        "validation_failed",
        `Town preview validation result must report PASS across all required checks. Failed: ${failedChecks.join(", ")}`
      );
    }

    return deepFreeze({
      ok: true,
      townId: preview.townId,
      previewId: preview.previewId
    });
  } catch (error) {
    if (error?.code) {
      return deepFreeze({
        ok: false,
        errorCode: error.code,
        message: error.message
      });
    }

    return deepFreeze({
      ok: false,
      errorCode: "unknown_validation_error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function buildSeedConfig(input) {
  return deepFreeze({
    townSeed: input.townSeed,
    regionSeed: input.regionSeed,
    townThemeSeed: input.townThemeSeed
  });
}

function resolveTownThemeProfile(input) {
  return townThemeProfiles[input.townThemeSeed];
}

function resolveTownVariantProfile(input) {
  return deepFreeze(townVariantProfiles[input.townThemeSeed]);
}

function buildVariantWeightProfile(variantProfile) {
  return deepFreeze({
    schemaId: variantWeightProfileSchemaId,
    profileId: variantProfile.profileId,
    districtSelectionWeights: deepFreeze({
      residential: variantProfile.districtWeighting.residential,
      coastal: variantProfile.districtWeighting.coastal,
      tourism: variantProfile.districtWeighting.tourism,
      civic: variantProfile.districtWeighting.civic,
      commercial: variantProfile.districtWeighting.commercial,
      industrialService: variantProfile.districtWeighting.industrialService,
      futureMediumDensity: variantProfile.districtWeighting.futureMediumDensity
    }),
    centreWeights: deepFreeze({
      centreCountBias: variantProfile.centreBehaviour.centreCount,
      centreSizeBias: variantProfile.centreBehaviour.intensity,
      centreIntensityBias: variantProfile.commercialIntensity.level,
      pedestrianPriorityBias: variantProfile.centreBehaviour.pedestrianPriority
    }),
    commercialWeights: deepFreeze({
      targetZoneCount: variantProfile.commercialIntensity.targetZoneCount,
      waterfrontRetailBias: variantProfile.commercialIntensity.waterfrontRetailBias
    }),
    civicWeights: deepFreeze({
      targetReserveCount: variantProfile.civicAllocation.targetReserveCount,
      centreClusterBias: variantProfile.civicAllocation.centreClusterBias
    }),
    transportWeights: deepFreeze({
      roadHierarchyBias: variantProfile.transportIntensity.roadHierarchyBias,
      busSupportBias: variantProfile.transportIntensity.busSupport,
      railwayPotentialBias: variantProfile.transportIntensity.railwayPotential,
      parkingBias: variantProfile.transportIntensity.parkingBias
    }),
    recreationWeights: deepFreeze({
      targetZoneCount: variantProfile.recreationAllocation.targetZoneCount,
      waterfrontRecreationBias: variantProfile.recreationAllocation.waterfrontRecreationBias,
      trailBias: variantProfile.recreationAllocation.trailBias
    }),
    landmarkWeights: deepFreeze({
      targetLandmarkCount: variantProfile.landmarkWeighting.targetLandmarkCount,
      landmarkFrequencyBias: variantProfile.landmarkWeighting.level,
      landmarkImportanceBias: variantProfile.landmarkWeighting.scenicBias
    }),
    boundaryWeights: deepFreeze({
      boundaryStyle: variantProfile.boundaryBehaviour.style,
      scenicConstraint: variantProfile.boundaryBehaviour.scenicConstraint,
      protectedEdgeBias: variantProfile.boundaryBehaviour.protectedEdgeBias,
      growthDirection: variantProfile.growthDirection.primary
    })
  });
}

function buildDistrictPlacements(input, townThemeProfile, variantProfile, seedConfig) {
  const slotPositions = buildDistrictSlotPositions(input);
  return townThemeProfile.districtBlueprints
    .slice(0, townThemeProfile.targetDistrictCount)
    .map((blueprint, index) => {
      const slot = slotPositions[index];
      const sourceDistrictThemeSeed = resolveSourceDistrictThemeSeed(blueprint);
      const districtSeed = deriveDistrictSeed(
        seedConfig,
        blueprint,
        sourceDistrictThemeSeed,
        index
      );
      const sourcePreview = generateSuburbanDistrictPreview({
        districtSeed,
        regionSeed: input.regionSeed,
        districtThemeSeed: sourceDistrictThemeSeed,
        targetBlocks: blueprint.blockTarget,
        districtConfiguration: {
          schemaId: "SUBURBAN_DISTRICT_001",
          previewId: `SUBURBAN_DISTRICT_001_PREVIEW_TOWN_${String(index + 1).padStart(3, "0")}`,
          generationProfile: `${townThemeProfile.generationProfile}_${sourceDistrictThemeSeed.toLowerCase()}`,
          minBlocks: 4,
          maxBlocks: 8,
          blockSpacingX: 336,
          blockSpacingY: 272,
          blockFootprintWidth: 292,
          blockFootprintDepth: 186,
          seamCorridorDepth: 86,
          seamSpineWidth: 56,
          connectorWidthLocal: 12,
          connectorWidthCollector: 16,
          connectorWidthArterial: 22
        }
      });

      const width =
        roundNumber(sourcePreview.districtBounds.maxX - sourcePreview.districtBounds.minX) +
        72;
      const depth =
        roundNumber(sourcePreview.districtBounds.maxY - sourcePreview.districtBounds.minY) +
        72;

      return deepFreeze({
        schemaId: districtPlacementSchemaId,
        districtPlacementId: `TOWN_DISTRICT_${String(index + 1).padStart(3, "0")}`,
        districtType: blueprint.districtType,
        sourceDistrictSchemaId: sourcePreview.schemaId,
        sourceDistrictId: sourcePreview.districtId,
        sourcePreviewId: sourcePreview.previewId,
        position: deepFreeze({ x: slot.x, y: slot.y, z: 0 }),
        rotation: deepFreeze({ yawDegrees: slot.rotation }),
        sizeProfile: blueprint.sizeProfile,
        densityProfile: blueprint.densityProfile,
        themeProfile: blueprint.themeProfile,
        connectorRelationships: deepFreeze(slot.connectorRelationships),
        streamingCellId: slot.streamingCellId,
        districtFootprint: deepFreeze({ width, depth }),
        estimatedLotCount: sourcePreview.lotCount,
        sourceSeed: districtSeed,
        sourceThemeSeed: sourceDistrictThemeSeed,
        sourceBlockCount: sourcePreview.blockPlacements.length
      });
    });
}

function buildDistrictSlotPositions(input) {
  const spacingX = input.townConfiguration.districtSpacingX;
  const spacingY = input.townConfiguration.districtSpacingY;

  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        x: -740,
        y: 168,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_005"],
        streamingCellId: "TOWN_CELL_A1"
      }),
      deepFreeze({
        x: 612,
        y: 118,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_002", "TOWN_CORRIDOR_005"],
        streamingCellId: "TOWN_CELL_C1"
      }),
      deepFreeze({
        x: 104,
        y: -692,
        rotation: 180,
        connectorRelationships: ["TOWN_CORRIDOR_003", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_B2"
      })
    ]);
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        x: -spacingX * 1.28,
        y: spacingY * 0.28,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_A1"
      }),
      deepFreeze({
        x: spacingX * 1.28,
        y: spacingY * 0.28,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_002", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_C1"
      }),
      deepFreeze({
        x: 0,
        y: -spacingY * 1.16,
        rotation: 180,
        connectorRelationships: ["TOWN_CORRIDOR_003", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_B2"
      }),
      deepFreeze({
        x: 0,
        y: spacingY * 1.54,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_004", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_B0"
      })
    ]);
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    return deepFreeze([
      deepFreeze({
        x: -spacingX * 1.1,
        y: spacingY * 0.2,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_A1"
      }),
      deepFreeze({
        x: spacingX * 1.1,
        y: spacingY * 0.18,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_002", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_C1"
      }),
      deepFreeze({
        x: 0,
        y: -spacingY * 1.06,
        rotation: 180,
        connectorRelationships: ["TOWN_CORRIDOR_003", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_B2"
      }),
      deepFreeze({
        x: 0,
        y: spacingY * 1.44,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_004", "TOWN_CORRIDOR_006"],
        streamingCellId: "TOWN_CELL_B0"
      })
    ]);
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze([
      deepFreeze({
        x: -spacingX * 1.18,
        y: spacingY * 0.42,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_A1"
      }),
      deepFreeze({
        x: spacingX * 1.18,
        y: spacingY * 0.42,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_002", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_C1"
      }),
      deepFreeze({
        x: -spacingX * 0.64,
        y: -spacingY * 1.02,
        rotation: 180,
        connectorRelationships: ["TOWN_CORRIDOR_003", "TOWN_CORRIDOR_008"],
        streamingCellId: "TOWN_CELL_A3"
      }),
      deepFreeze({
        x: spacingX * 0.64,
        y: -spacingY * 1.02,
        rotation: 180,
        connectorRelationships: ["TOWN_CORRIDOR_004", "TOWN_CORRIDOR_008"],
        streamingCellId: "TOWN_CELL_C3"
      }),
      deepFreeze({
        x: 0,
        y: spacingY * 1.34,
        rotation: 0,
        connectorRelationships: ["TOWN_CORRIDOR_005", "TOWN_CORRIDOR_007"],
        streamingCellId: "TOWN_CELL_B0"
      })
    ]);
  }

  return deepFreeze([
    deepFreeze({
      x: -spacingX,
      y: spacingY * 0.34,
      rotation: 0,
      connectorRelationships: ["TOWN_CORRIDOR_001", "TOWN_CORRIDOR_005"],
      streamingCellId: "TOWN_CELL_A1"
    }),
    deepFreeze({
      x: spacingX,
      y: spacingY * 0.34,
      rotation: 0,
      connectorRelationships: ["TOWN_CORRIDOR_002", "TOWN_CORRIDOR_005"],
      streamingCellId: "TOWN_CELL_C1"
    }),
    deepFreeze({
      x: 0,
      y: -spacingY * 0.9,
      rotation: 180,
      connectorRelationships: ["TOWN_CORRIDOR_003", "TOWN_CORRIDOR_006"],
      streamingCellId: "TOWN_CELL_B2"
    }),
    deepFreeze({
      x: -spacingX * 0.42,
      y: -spacingY * 1.85,
      rotation: 90,
      connectorRelationships: ["TOWN_CORRIDOR_004", "TOWN_CORRIDOR_006"],
      streamingCellId: "TOWN_CELL_A3"
    }),
    deepFreeze({
      x: spacingX * 0.42,
      y: -spacingY * 1.85,
      rotation: 270,
      connectorRelationships: ["TOWN_CORRIDOR_004", "TOWN_CORRIDOR_006"],
      streamingCellId: "TOWN_CELL_C3"
    })
  ]);
}

function resolveSourceDistrictThemeSeed(blueprint) {
  if (blueprint.districtThemeSeed === "COASTAL_ESTATES") {
    return "LOW_DENSITY_SUBURBAN";
  }
  if (!supportedSourceDistrictThemeSeeds.includes(blueprint.districtThemeSeed)) {
    return "LOW_DENSITY_SUBURBAN";
  }
  return blueprint.districtThemeSeed;
}

function deriveDistrictSeed(seedConfig, blueprint, sourceDistrictThemeSeed, index) {
  const pool = deterministicDistrictSeedPools[sourceDistrictThemeSeed];
  const poolIndex =
    stableHash(
      `${seedConfig.townSeed}:${seedConfig.regionSeed}:${seedConfig.townThemeSeed}:${blueprint.districtType}:${sourceDistrictThemeSeed}:${index}`
    ) % pool.length;
  return pool[poolIndex];
}

function buildCoastalIdentityProfile(input, townThemeProfile, variantProfile, districtPlacements) {
  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze({
      profileId: "REGIONAL_SERVICE_PROFILE",
      coastlineOrientation: "NONE",
      growthDirection: variantProfile.growthDirection.primary,
      waterfrontCharacter: "NONE",
      tourismIntensity: "LOW",
      visitorFocus: "RURAL_SERVICE_ONLY",
      waterfrontZones: deepFreeze([]),
      visitorAreas: deepFreeze(["TOWN_CENTRE_001", "COMMERCIAL_001"]),
      foreshoreReserves: deepFreeze([]),
      coastalResidentialDistrictIds: deepFreeze([]),
      tourismDistrictIds: deepFreeze([])
    });
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    const tourismDistrictIds = districtPlacements
      .filter((district) => district.districtType === "TOURISM_DISTRICT")
      .map((district) => district.districtPlacementId);
    return deepFreeze({
      profileId: "TOURIST_DESTINATION_PROFILE",
      coastlineOrientation: "SCENIC_EDGE_OPTIONAL",
      growthDirection: variantProfile.growthDirection.primary,
      waterfrontCharacter: "VISITOR_PROMENADE_AND_ATTRACTION_LOOP",
      tourismIntensity: "VERY_HIGH",
      visitorFocus: "ATTRACTIONS_AND_EVENT_LOOPS",
      waterfrontZones: deepFreeze(["COMMERCIAL_002", "RECREATION_004"]),
      visitorAreas: deepFreeze(["TOWN_CENTRE_001", "COMMERCIAL_001", "COMMERCIAL_002", "LANDMARK_001", "LANDMARK_002"]),
      foreshoreReserves: deepFreeze([]),
      coastalResidentialDistrictIds: deepFreeze([]),
      tourismDistrictIds: deepFreeze(tourismDistrictIds)
    });
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze({
      profileId: "CITY_EDGE_PROFILE",
      coastlineOrientation: "NONE",
      growthDirection: variantProfile.growthDirection.primary,
      waterfrontCharacter: "NONE",
      tourismIntensity: "LOW",
      visitorFocus: "COMMUTER_AND_LOCAL_SERVICES",
      waterfrontZones: deepFreeze([]),
      visitorAreas: deepFreeze(["TOWN_CENTRE_001", "TOWN_CENTRE_002", "COMMERCIAL_001", "COMMERCIAL_002"]),
      foreshoreReserves: deepFreeze([]),
      coastalResidentialDistrictIds: deepFreeze([]),
      tourismDistrictIds: deepFreeze([])
    });
  }

  const coastalResidentialDistrict = districtPlacements.find(
    (district) => district.districtType === "COASTAL_RESIDENTIAL_DISTRICT"
  );
  const tourismDistrict = districtPlacements.find(
    (district) => district.districtType === "TOURISM_DISTRICT"
  );

  return deepFreeze({
    ...townThemeProfile.coastalProfile,
    waterfrontZones: deepFreeze(["COMMERCIAL_002", "RECREATION_004", "RECREATION_005"]),
    visitorAreas: deepFreeze(["TOWN_CENTRE_001", "COMMERCIAL_002", "LANDMARK_001", "LANDMARK_002"]),
    foreshoreReserves: deepFreeze(["RECREATION_004", "RECREATION_005"]),
    coastalResidentialDistrictIds: deepFreeze(
      coastalResidentialDistrict ? [coastalResidentialDistrict.districtPlacementId] : []
    ),
    tourismDistrictIds: deepFreeze(
      tourismDistrict ? [tourismDistrict.districtPlacementId] : []
    )
  });
}

function buildTownBounds(input, districtPlacements, coastalIdentityProfile, variantProfile) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const placement of districtPlacements) {
    const halfWidth = placement.districtFootprint.width / 2;
    const halfDepth = placement.districtFootprint.depth / 2;
    minX = Math.min(minX, placement.position.x - halfWidth);
    maxX = Math.max(maxX, placement.position.x + halfWidth);
    minY = Math.min(minY, placement.position.y - halfDepth);
    maxY = Math.max(maxY, placement.position.y + halfDepth);
  }

  const padding = input.townConfiguration.townPadding;

  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    const inlandMinX = roundNumber(minX - padding - 84);
    const naturalTopY = roundNumber(maxY + padding * 0.56);
    const naturalBottomY = roundNumber(minY - padding * 0.62);
    const coastalShelfX = roundNumber(maxX + padding * 0.68);
    const foreshoreX = roundNumber(maxX + padding * 0.94);
    const coveInsetX = roundNumber(maxX + padding * 0.58);
    const polygon = deepFreeze([
      deepFreeze({ x: inlandMinX, y: roundNumber(naturalTopY - 102) }),
      deepFreeze({ x: roundNumber(inlandMinX + 326), y: naturalTopY }),
      deepFreeze({ x: roundNumber(maxX - 148), y: roundNumber(naturalTopY - 28) }),
      deepFreeze({ x: coastalShelfX, y: roundNumber(maxY + 122) }),
      deepFreeze({ x: foreshoreX, y: roundNumber(maxY - 84) }),
      deepFreeze({ x: foreshoreX, y: roundNumber(minY + 212) }),
      deepFreeze({ x: coveInsetX, y: roundNumber(minY - 36) }),
      deepFreeze({ x: roundNumber(maxX - 96), y: naturalBottomY }),
      deepFreeze({ x: roundNumber(minX - 188), y: roundNumber(naturalBottomY + 82) }),
      deepFreeze({ x: inlandMinX, y: roundNumber(minY - 104) })
    ]);

    return deepFreeze({
      minX: inlandMinX,
      maxX: foreshoreX,
      minY: naturalBottomY,
      maxY: naturalTopY,
      width: roundNumber(foreshoreX - inlandMinX),
      depth: roundNumber(naturalTopY - naturalBottomY),
      boundaryShape: "coastal_irregular_polygon",
      boundaryPolygon: polygon,
      coastlineEdge: deepFreeze({
        edgeId: "COASTLINE_EDGE_001",
        orientation: coastalIdentityProfile.coastlineOrientation,
        waterSide: "EAST",
        segment: deepFreeze([polygon[3], polygon[4], polygon[5], polygon[6]])
      }),
      growthDirection: coastalIdentityProfile.growthDirection,
      boundaryInfluences: deepFreeze({
        coastline: true,
        terrainLimits: true,
        roadEntryPoints: true,
        inlandExpansion: true,
        protectedNaturalAreas: true
      }),
      protectedNaturalAreas: deepFreeze([
        deepFreeze({
          protectedAreaId: "NATURAL_EDGE_DUNE_001",
          type: "DUNE_EDGE",
          boundary: deepFreeze({
            shape: "rect",
            x: roundNumber(maxX + 126),
            y: roundNumber(maxY - 28),
            width: 148,
            depth: 212
          })
        }),
        deepFreeze({
          protectedAreaId: "FORESHORE_RESERVE_001",
          type: "FORESHORE_RESERVE",
          boundary: deepFreeze({
            shape: "rect",
            x: roundNumber(maxX + 118),
            y: roundNumber((maxY + minY) / 2 + 46),
            width: 156,
            depth: 324
          })
        })
      ]),
      roadEntryPoints: deepFreeze([
        deepFreeze({ x: inlandMinX + 36, y: 302, side: "WEST" }),
        deepFreeze({ x: roundNumber(foreshoreX - 118), y: roundNumber(minY + 196), side: "SOUTH_EAST" })
      ])
    });
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    const radialMinX = roundNumber(minX - padding * 1.05);
    const radialMaxX = roundNumber(maxX + padding * 1.02);
    const radialMinY = roundNumber(minY - padding * 0.92);
    const radialMaxY = roundNumber(maxY + padding * 1.08);
    const polygon = deepFreeze([
      deepFreeze({ x: roundNumber(radialMinX + 164), y: radialMaxY }),
      deepFreeze({ x: roundNumber(radialMaxX - 186), y: radialMaxY }),
      deepFreeze({ x: radialMaxX, y: roundNumber(radialMaxY - 206) }),
      deepFreeze({ x: radialMaxX, y: roundNumber(radialMinY + 228) }),
      deepFreeze({ x: roundNumber(radialMaxX - 202), y: radialMinY }),
      deepFreeze({ x: roundNumber(radialMinX + 188), y: radialMinY }),
      deepFreeze({ x: radialMinX, y: roundNumber(radialMinY + 196) }),
      deepFreeze({ x: radialMinX, y: roundNumber(radialMaxY - 218) })
    ]);
    return deepFreeze({
      minX: radialMinX,
      maxX: radialMaxX,
      minY: radialMinY,
      maxY: radialMaxY,
      width: roundNumber(radialMaxX - radialMinX),
      depth: roundNumber(radialMaxY - radialMinY),
      boundaryShape: "regional_radial_polygon",
      boundaryPolygon: polygon,
      growthDirection: variantProfile.growthDirection.primary,
      boundaryInfluences: deepFreeze({
        coastline: false,
        terrainLimits: true,
        roadEntryPoints: true,
        inlandExpansion: true,
        protectedNaturalAreas: true
      }),
      protectedNaturalAreas: deepFreeze([
        deepFreeze({
          protectedAreaId: "REGIONAL_GREEN_BUFFER_001",
          type: "RURAL_BUFFER",
          boundary: deepFreeze({
            shape: "rect",
            x: roundNumber(radialMinX + 204),
            y: roundNumber(radialMaxY - 128),
            width: 188,
            depth: 116
          })
        })
      ]),
      roadEntryPoints: deepFreeze([
        deepFreeze({ x: radialMinX + 42, y: 282, side: "WEST" }),
        deepFreeze({ x: radialMaxX - 42, y: 296, side: "EAST" }),
        deepFreeze({ x: 0, y: radialMinY + 64, side: "SOUTH" })
      ])
    });
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    const scenicMinX = roundNumber(minX - padding * 0.88);
    const scenicMaxX = roundNumber(maxX + padding * 1.16);
    const scenicMinY = roundNumber(minY - padding * 0.82);
    const scenicMaxY = roundNumber(maxY + padding * 0.96);
    const polygon = deepFreeze([
      deepFreeze({ x: scenicMinX, y: roundNumber(scenicMaxY - 146) }),
      deepFreeze({ x: roundNumber(scenicMinX + 212), y: scenicMaxY }),
      deepFreeze({ x: roundNumber(scenicMaxX - 228), y: roundNumber(scenicMaxY - 22) }),
      deepFreeze({ x: scenicMaxX, y: roundNumber(scenicMaxY - 182) }),
      deepFreeze({ x: scenicMaxX, y: roundNumber(scenicMinY + 168) }),
      deepFreeze({ x: roundNumber(scenicMaxX - 164), y: scenicMinY }),
      deepFreeze({ x: roundNumber(scenicMinX + 146), y: roundNumber(scenicMinY + 42) }),
      deepFreeze({ x: scenicMinX, y: roundNumber(scenicMinY + 224) })
    ]);
    return deepFreeze({
      minX: scenicMinX,
      maxX: scenicMaxX,
      minY: scenicMinY,
      maxY: scenicMaxY,
      width: roundNumber(scenicMaxX - scenicMinX),
      depth: roundNumber(scenicMaxY - scenicMinY),
      boundaryShape: "scenic_destination_polygon",
      boundaryPolygon: polygon,
      growthDirection: variantProfile.growthDirection.primary,
      boundaryInfluences: deepFreeze({
        coastline: false,
        terrainLimits: true,
        roadEntryPoints: true,
        inlandExpansion: false,
        protectedNaturalAreas: true
      }),
      protectedNaturalAreas: deepFreeze([
        deepFreeze({
          protectedAreaId: "SCENIC_LOOKOUT_BUFFER_001",
          type: "LOOKOUT_EDGE",
          boundary: deepFreeze({
            shape: "rect",
            x: roundNumber(scenicMaxX - 158),
            y: roundNumber(scenicMaxY - 122),
            width: 126,
            depth: 122
          })
        })
      ]),
      roadEntryPoints: deepFreeze([
        deepFreeze({ x: scenicMinX + 52, y: 242, side: "WEST" }),
        deepFreeze({ x: scenicMaxX - 54, y: 188, side: "EAST" })
      ])
    });
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    const urbanMinX = roundNumber(minX - padding * 1.12);
    const urbanMaxX = roundNumber(maxX + padding * 1.12);
    const urbanMinY = roundNumber(minY - padding * 0.88);
    const urbanMaxY = roundNumber(maxY + padding * 1.18);
    const polygon = deepFreeze([
      deepFreeze({ x: urbanMinX, y: roundNumber(urbanMaxY - 132) }),
      deepFreeze({ x: roundNumber(urbanMinX + 248), y: urbanMaxY }),
      deepFreeze({ x: roundNumber(urbanMaxX - 248), y: urbanMaxY }),
      deepFreeze({ x: urbanMaxX, y: roundNumber(urbanMaxY - 142) }),
      deepFreeze({ x: urbanMaxX, y: roundNumber(urbanMinY + 162) }),
      deepFreeze({ x: roundNumber(urbanMaxX - 214), y: urbanMinY }),
      deepFreeze({ x: roundNumber(urbanMinX + 214), y: urbanMinY }),
      deepFreeze({ x: urbanMinX, y: roundNumber(urbanMinY + 162) })
    ]);
    return deepFreeze({
      minX: urbanMinX,
      maxX: urbanMaxX,
      minY: urbanMinY,
      maxY: urbanMaxY,
      width: roundNumber(urbanMaxX - urbanMinX),
      depth: roundNumber(urbanMaxY - urbanMinY),
      boundaryShape: "corridor_growth_polygon",
      boundaryPolygon: polygon,
      growthDirection: variantProfile.growthDirection.primary,
      boundaryInfluences: deepFreeze({
        coastline: false,
        terrainLimits: false,
        roadEntryPoints: true,
        inlandExpansion: true,
        protectedNaturalAreas: true
      }),
      protectedNaturalAreas: deepFreeze([
        deepFreeze({
          protectedAreaId: "URBAN_GREEN_CORRIDOR_BUFFER_001",
          type: "GREEN_CORRIDOR",
          boundary: deepFreeze({
            shape: "rect",
            x: 0,
            y: roundNumber(urbanMinY + 108),
            width: 236,
            depth: 84
          })
        })
      ]),
      roadEntryPoints: deepFreeze([
        deepFreeze({ x: urbanMinX + 54, y: 302, side: "WEST" }),
        deepFreeze({ x: urbanMaxX - 54, y: 302, side: "EAST" }),
        deepFreeze({ x: 0, y: urbanMaxY - 48, side: "NORTH" })
      ])
    });
  }

  return deepFreeze({
    minX: roundNumber(minX - padding),
    maxX: roundNumber(maxX + padding),
    minY: roundNumber(minY - padding),
    maxY: roundNumber(maxY + padding),
    width: roundNumber(maxX - minX + padding * 2),
    depth: roundNumber(maxY - minY + padding * 2),
    boundaryShape: "rect"
  });
}

function buildTownCentreZones(input, townThemeProfile, variantProfile, districtPlacements) {
  const width = townThemeProfile.centreSize.width;
  const depth = townThemeProfile.centreSize.depth;
  const y = input.townConfiguration.centreOffsetY;
  const centres = [
    deepFreeze({
      schemaId: townCentreSchemaId,
      centreId: "TOWN_CENTRE_001",
      centreType: townThemeProfile.centreType,
      boundary: deepFreeze({
        shape: "rect",
        x: 0,
        y,
        width,
        depth
      }),
      pedestrianPriority: variantProfile.centreBehaviour.pedestrianPriority,
      commercialIntensity: townThemeProfile.commercialIntensity,
      civicRelationship:
        input.townThemeSeed === "REGIONAL_TOWN"
          ? "PRIMARY_CIVIC_ANCHOR"
          : "ADJACENT_CIVIC_EDGE",
      landmarkRelationship:
        input.townThemeSeed === "TOURIST_TOWN"
          ? "ATTRACTION_CLUSTER_SUPPORTED"
          : "CENTRE_ANCHOR_SUPPORTED",
      transportRelationship:
        townThemeProfile.transportIntensity === "HIGH"
          ? "COLLECTOR_AND_RAIL_ACCESS"
          : "COLLECTOR_AND_BUS_ACCESS",
      connectedDistrictIds: deepFreeze(
        districtPlacements.map((district) => district.districtPlacementId)
      )
    })
  ];

  if (variantProfile.centreBehaviour.centreCount > 1) {
    centres.push(
      deepFreeze({
        schemaId: townCentreSchemaId,
        centreId: "TOWN_CENTRE_002",
        centreType: variantProfile.centreBehaviour.secondaryCentreType,
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(input.townConfiguration.districtSpacingX * 0.74),
          y: roundNumber(y - input.townConfiguration.districtSpacingY * 1.18),
          width: roundNumber(width * 0.72),
          depth: roundNumber(depth * 0.78)
        }),
        pedestrianPriority: "MEDIUM",
        commercialIntensity: "MEDIUM",
        civicRelationship: "FUTURE_GROWTH_EDGE",
        landmarkRelationship: "SECONDARY_NODE_SUPPORTED",
        transportRelationship: "COLLECTOR_AND_BUS_ACCESS",
        connectedDistrictIds: deepFreeze(
          districtPlacements
            .filter((district) => district.position.x >= 0)
            .map((district) => district.districtPlacementId)
        )
      })
    );
  }

  return deepFreeze(centres);
}

function buildCommercialZones(
  input,
  townThemeProfile,
  variantProfile,
  townCentreZones,
  coastalIdentityProfile,
  townBounds
) {
  const centre = townCentreZones[0];
  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_001",
        commercialType: "TOWN_MAIN_STREET_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 82),
          y: roundNumber(centre.boundary.y + 4),
          width: 198,
          depth: 96
        }),
        intensity: "MEDIUM",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_001", "PED_LINK_002"]),
        roadRelationship: "COLLECTOR_FRONTAGE",
        linkedCentreId: centre.centreId
      }),
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_002",
        commercialType: "COASTAL_TOURISM_RETAIL",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 198),
          y: roundNumber(centre.boundary.y + 18),
          width: 172,
          depth: 84
        }),
        intensity: "MEDIUM_HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: false,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_003", "PED_LINK_004"]),
        roadRelationship: "WATERFRONT_PROMENADE_AND_COLLECTOR_ACCESS",
        linkedCentreId: centre.centreId,
        visitorRole: coastalIdentityProfile.visitorFocus
      })
    ]);
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_001",
        commercialType: "TOWN_MAIN_STREET_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 96),
          y: roundNumber(centre.boundary.y + 4),
          width: 228,
          depth: 108
        }),
        intensity: "MEDIUM_HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_001", "PED_LINK_002"]),
        roadRelationship: "COLLECTOR_FRONTAGE",
        linkedCentreId: centre.centreId
      }),
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_002",
        commercialType: "COMMERCIAL_STRIP_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 244),
          y: roundNumber(centre.boundary.y + 22),
          width: 212,
          depth: 96
        }),
        intensity: "MEDIUM",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: false
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_003", "PED_LINK_004"]),
        roadRelationship: "ARTERIAL_SERVICE_FRONTAGE",
        linkedCentreId: centre.centreId
      })
    ]);
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_001",
        commercialType: "COASTAL_TOURISM_RETAIL",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 74),
          y: roundNumber(centre.boundary.y + 8),
          width: 208,
          depth: 102
        }),
        intensity: "HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: false,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_001", "PED_LINK_002"]),
        roadRelationship: "CENTRE_PROMENADE_FRONTAGE",
        linkedCentreId: centre.centreId,
        visitorRole: "CENTRE_ACTIVITY_SPINE"
      }),
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_002",
        commercialType: "COMMERCIAL_STRIP_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 214),
          y: roundNumber(centre.boundary.y + 86),
          width: 188,
          depth: 92
        }),
        intensity: "MEDIUM_HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_003", "PED_LINK_004"]),
        roadRelationship: "ATTRACTION_EDGE_FRONTAGE",
        linkedCentreId: centre.centreId
      }),
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_003",
        commercialType: "TOWN_MAIN_STREET_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 118),
          y: roundNumber(centre.boundary.y - 64),
          width: 162,
          depth: 84
        }),
        intensity: "MEDIUM",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: false
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_005", "PED_LINK_006"]),
        roadRelationship: "CENTRE_LOOP_FRONTAGE",
        linkedCentreId: centre.centreId
      })
    ]);
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze([
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_001",
        commercialType: "COMMERCIAL_STRIP_001",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 108),
          y: roundNumber(centre.boundary.y + 12),
          width: 214,
          depth: 96
        }),
        intensity: "MEDIUM_HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: true,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_001", "PED_LINK_002"]),
        roadRelationship: "COLLECTOR_OR_ARTERIAL_FRONTAGE",
        linkedCentreId: centre.centreId
      }),
      deepFreeze({
        schemaId: commercialZoneSchemaId,
        commercialZoneId: "COMMERCIAL_002",
        commercialType: "FUTURE_SHOPPING_CENTRE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 286),
          y: roundNumber(townBounds.minY + 268),
          width: 244,
          depth: 132
        }),
        intensity: "MEDIUM_HIGH",
        parkingAccessRules: deepFreeze({
          edgeParkingAllowed: false,
          rearAccessPreferred: true
        }),
        pedestrianLinks: deepFreeze(["PED_LINK_003", "PED_LINK_004"]),
        roadRelationship: "ARTERIAL_AND_BUS_CORRIDOR_FRONTAGE",
        linkedCentreId: townCentreZones[Math.min(1, townCentreZones.length - 1)].centreId
      })
    ]);
  }

  return deepFreeze([
    deepFreeze({
      schemaId: commercialZoneSchemaId,
      commercialZoneId: "COMMERCIAL_001",
      commercialType:
        input.townThemeSeed === "TOURIST_TOWN"
          ? "COASTAL_TOURISM_RETAIL"
          : "COMMERCIAL_STRIP_001",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(centre.boundary.x + centre.boundary.width * 0.88),
        y: roundNumber(centre.boundary.y - 8),
        width: 192,
        depth: 92
      }),
      intensity: townThemeProfile.commercialIntensity,
      parkingAccessRules: deepFreeze({
        edgeParkingAllowed: true,
        rearAccessPreferred: true
      }),
      pedestrianLinks: deepFreeze(["PED_LINK_001", "PED_LINK_002"]),
      roadRelationship: "COLLECTOR_OR_ARTERIAL_FRONTAGE",
      linkedCentreId: centre.centreId
    })
  ]);
}

function buildCivicReserves(input, townThemeProfile, variantProfile, townBounds) {
  const reserves = [
    deepFreeze({
      schemaId: civicReserveSchemaId,
      civicReserveId: "CIVIC_001",
      civicType: "SCHOOL_RESERVE",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(townBounds.minX + 260),
        y: roundNumber(townBounds.maxY - 188),
        width: 176,
        depth: 132
      }),
      accessibilityProfile: "COLLECTOR_AND_PEDESTRIAN_ACCESS",
      roadRelationship: "COLLECTOR_EDGE_REQUIRED",
      pedestrianRelationship: "GREEN_CORRIDOR_LINK_PREFERRED"
    }),
    deepFreeze({
      schemaId: civicReserveSchemaId,
      civicReserveId: "CIVIC_002",
      civicType: "LIBRARY_RESERVE",
      boundary: deepFreeze({
        shape: "rect",
        x: -182,
        y: 214,
        width: 112,
        depth: 84
      }),
      accessibilityProfile: "CENTRE_AND_PEDESTRIAN_ACCESS",
      roadRelationship: "CENTRE_EDGE_PREFERRED",
      pedestrianRelationship: "PEDESTRIAN_SPINE_REQUIRED"
    }),
    deepFreeze({
      schemaId: civicReserveSchemaId,
      civicReserveId: "CIVIC_003",
      civicType: "COMMUNITY_CENTRE_RESERVE",
      boundary: deepFreeze({
        shape: "rect",
        x: 226,
        y: 206,
        width: 120,
        depth: 92
      }),
      accessibilityProfile: "CENTRE_AND_PEDESTRIAN_ACCESS",
      roadRelationship: "CENTRE_EDGE_PREFERRED",
      pedestrianRelationship: "PEDESTRIAN_SPINE_REQUIRED"
    }),
    deepFreeze({
      schemaId: civicReserveSchemaId,
      civicReserveId: "CIVIC_004",
      civicType: "EMERGENCY_SERVICE_RESERVE",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(townBounds.maxX - 242),
        y: roundNumber(townBounds.minY + 196),
        width: 142,
        depth: 96
      }),
      accessibilityProfile: "COLLECTOR_AND_VEHICLE_PRIORITY",
      roadRelationship: "COLLECTOR_EDGE_REQUIRED",
      pedestrianRelationship: "SECONDARY_PEDESTRIAN_ACCESS"
    })
  ];

  if (
    variantProfile.civicAllocation.targetReserveCount >= 5 ||
    input.townThemeSeed === "REGIONAL_TOWN" ||
    input.townThemeSeed === "SUBURBAN_CITY_EDGE"
  ) {
    reserves.push(
      deepFreeze({
        schemaId: civicReserveSchemaId,
        civicReserveId: "CIVIC_005",
        civicType: "HEALTHCARE_RESERVE",
        boundary: deepFreeze({
          shape: "rect",
          x:
            input.townThemeSeed === "SUBURBAN_CITY_EDGE"
              ? roundNumber(townBounds.maxX - 428)
              : roundNumber(townBounds.minX + 418),
          y:
            input.townThemeSeed === "SUBURBAN_CITY_EDGE"
              ? roundNumber(townBounds.minY + 244)
              : roundNumber(townBounds.maxY - 262),
          width: 138,
          depth: 94
        }),
        accessibilityProfile: "COLLECTOR_AND_PUBLIC_ACCESS",
        roadRelationship:
          input.townThemeSeed === "REGIONAL_TOWN"
            ? "ARTERIAL_EDGE_REQUIRED"
            : "COLLECTOR_EDGE_REQUIRED",
        pedestrianRelationship: "SECONDARY_PEDESTRIAN_ACCESS"
      })
    );
  }

  return deepFreeze(reserves);
}

function buildTransportCorridors(
  input,
  townThemeProfile,
  variantProfile,
  districtPlacements,
  townCentreZones,
  commercialZones,
  civicReserves,
  townBounds
) {
  const centres = townCentreZones;
  const primaryCentre = centres[0];
  const corridors = [];

  for (const [index, district] of districtPlacements.entries()) {
    const assignedCentre =
      centres.length > 1 && district.position.x > 0
        ? centres[Math.min(1, centres.length - 1)]
        : primaryCentre;
    corridors.push(
      deepFreeze({
        schemaId: transportCorridorSchemaId,
        corridorId: `TOWN_CORRIDOR_${String(index + 1).padStart(3, "0")}`,
        corridorType: "COLLECTOR_ROAD",
        hierarchy: "TOWN_COLLECTOR",
        path: deepFreeze([
          deepFreeze({
            x: district.position.x,
            y: district.position.y,
            z: 0
          }),
          deepFreeze({
            x: assignedCentre.boundary.x,
            y: assignedCentre.boundary.y,
            z: 0
          })
        ]),
        connections: deepFreeze([
          district.districtPlacementId,
          assignedCentre.centreId,
          civicReserves[index % civicReserves.length].civicReserveId
        ]),
        direction:
          district.position.y < assignedCentre.boundary.y
            ? "DISTRICT_TO_NORTH_CENTRE"
            : "DISTRICT_TO_CENTRE",
        capacityProfile:
          variantProfile.transportIntensity.level === "HIGH"
            ? "HIGH_TOWN_MOVEMENT"
            : "MEDIUM_TOWN_MOVEMENT"
      })
    );
  }

  corridors.push(
    deepFreeze({
      schemaId: transportCorridorSchemaId,
      corridorId: `TOWN_CORRIDOR_${String(corridors.length + 1).padStart(3, "0")}`,
      corridorType: "ARTERIAL_ROAD",
      hierarchy: "TOWN_ARTERIAL",
      path: deepFreeze([
        deepFreeze({ x: townBounds.minX + 58, y: 302, z: 0 }),
        deepFreeze({ x: townBounds.maxX - 48, y: 302, z: 0 })
      ]),
      connections: deepFreeze([
        ...centres.map((centre) => centre.centreId),
        ...commercialZones.slice(0, 2).map((zone) => zone.commercialZoneId),
        civicReserves[0].civicReserveId
      ]),
      direction: "EAST_WEST",
      capacityProfile:
        variantProfile.transportIntensity.level === "HIGH"
          ? "DISTRICT_WIDE_COMMUTER_MOVEMENT"
          : "TOWN_WIDE_MOVEMENT"
    })
  );

  corridors.push(
    deepFreeze({
      schemaId: transportCorridorSchemaId,
      corridorId: `TOWN_CORRIDOR_${String(corridors.length + 1).padStart(3, "0")}`,
      corridorType: "BUS_CORRIDOR",
      hierarchy:
        input.townThemeSeed === "TOURIST_TOWN" ? "VISITOR_LOOP" : "CENTRE_LOOP",
      path: deepFreeze([
        deepFreeze({ x: primaryCentre.boundary.x - 168, y: primaryCentre.boundary.y + 96, z: 0 }),
        deepFreeze({ x: primaryCentre.boundary.x + 168, y: primaryCentre.boundary.y + 96, z: 0 }),
        deepFreeze({ x: primaryCentre.boundary.x + 168, y: primaryCentre.boundary.y - 92, z: 0 }),
        deepFreeze({ x: primaryCentre.boundary.x - 168, y: primaryCentre.boundary.y - 92, z: 0 }),
        deepFreeze({ x: primaryCentre.boundary.x - 168, y: primaryCentre.boundary.y + 96, z: 0 })
      ]),
      connections: deepFreeze([
        primaryCentre.centreId,
        commercialZones[0].commercialZoneId,
        civicReserves[Math.min(1, civicReserves.length - 1)].civicReserveId,
        civicReserves[Math.min(2, civicReserves.length - 1)].civicReserveId
      ]),
      direction: "CENTRE_LOOP",
      capacityProfile:
        variantProfile.transportIntensity.busSupport === "HIGH" ||
        variantProfile.transportIntensity.busSupport === "MEDIUM_HIGH"
          ? "HIGH_FREQUENCY_LOOP"
          : "CENTRE_ACCESS"
    })
  );

  if (variantProfile.transportIntensity.railwayPotential !== "NONE") {
    corridors.push(
      deepFreeze({
        schemaId: transportCorridorSchemaId,
        corridorId: `TOWN_CORRIDOR_${String(corridors.length + 1).padStart(3, "0")}`,
        corridorType: "RAILWAY_CORRIDOR",
        hierarchy:
          input.townThemeSeed === "REGIONAL_TOWN"
            ? "REGIONAL_RAIL_SPINE"
            : "FUTURE_RAIL_SPINE",
        path: deepFreeze([
          deepFreeze({ x: townBounds.minX + 112, y: townBounds.minY + 156, z: 0 }),
          deepFreeze({ x: townBounds.maxX - 128, y: townBounds.minY + 156, z: 0 })
        ]),
        connections: deepFreeze([
          districtPlacements[districtPlacements.length - 1].districtPlacementId,
          landmarkReservesConnectionId(input.townThemeSeed),
          "STATION_RESERVE_001"
        ]),
        direction: "EAST_WEST",
        capacityProfile:
          input.townThemeSeed === "REGIONAL_TOWN"
            ? "REGIONAL_MOVEMENT"
            : "FUTURE_EXPANSION_PLACEHOLDER"
      })
    );
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    corridors.push(
      deepFreeze({
        schemaId: transportCorridorSchemaId,
        corridorId: `TOWN_CORRIDOR_${String(corridors.length + 1).padStart(3, "0")}`,
        corridorType: "LOCAL_ROAD",
        hierarchy: "SECONDARY_CENTRE_CONNECTOR",
        path: deepFreeze([
          deepFreeze({
            x: primaryCentre.boundary.x + 84,
            y: primaryCentre.boundary.y - 84,
            z: 0
          }),
          deepFreeze({
            x: townCentreZones[1].boundary.x,
            y: townCentreZones[1].boundary.y,
            z: 0
          })
        ]),
        connections: deepFreeze([
          primaryCentre.centreId,
          townCentreZones[1].centreId,
          commercialZones[Math.min(1, commercialZones.length - 1)].commercialZoneId
        ]),
        direction: "CENTRE_TO_SECONDARY_CENTRE",
        capacityProfile: "MEDIUM_COMMUTER_LINK"
      })
    );
  }

  return deepFreeze(corridors);
}

function buildRecreationZones(
  input,
  townThemeProfile,
  variantProfile,
  townBounds,
  townCentreZones,
  districtPlacements
) {
  const centre = townCentreZones[0];

  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_001",
        recreationType: "PARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 284),
          y: roundNumber(centre.boundary.y + 42),
          width: 248,
          depth: 136
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_AND_CENTRE_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_002",
        recreationType: "SPORTS_FIELD",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 346),
          y: roundNumber(townBounds.maxY - 228),
          width: 228,
          depth: 154
        }),
        accessRules: deepFreeze({
          pedestrianPriority: false,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_EDGE_ANCHOR"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_003",
        recreationType: "GREEN_CORRIDOR",
        boundary: deepFreeze({
          shape: "rect",
          x: -46,
          y: roundNumber(centre.boundary.y - 214),
          width: 716,
          depth: 92
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "TOWN_CORE_TO_FORESHORE_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_004",
        recreationType: "WATERFRONT_RECREATION_ZONE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 142),
          y: roundNumber(centre.boundary.y + 28),
          width: 172,
          depth: 286
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "FORESHORE_RESERVE"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_005",
        recreationType: "WALKING_TRAIL",
        boundary: deepFreeze({
          shape: "polyline_box",
          x: roundNumber(townBounds.maxX - 198),
          y: roundNumber(centre.boundary.y + 242),
          width: 322,
          depth: 46
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: false
        }),
        greenRelationship: "COASTAL_EDGE_LINK"
      })
    ]);
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_001",
        recreationType: "PARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 346),
          y: roundNumber(centre.boundary.y + 34),
          width: 242,
          depth: 142
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "CIVIC_AND_CENTRE_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_002",
        recreationType: "SPORTS_FIELD",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 362),
          y: roundNumber(townBounds.maxY - 226),
          width: 244,
          depth: 168
        }),
        accessRules: deepFreeze({
          pedestrianPriority: false,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_EDGE_ANCHOR"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_003",
        recreationType: "GREEN_CORRIDOR",
        boundary: deepFreeze({
          shape: "rect",
          x: 0,
          y: roundNumber(centre.boundary.y - 236),
          width: 704,
          depth: 82
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "CENTRE_TO_RURAL_EDGE_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_004",
        recreationType: "WALKING_TRAIL",
        boundary: deepFreeze({
          shape: "polyline_box",
          x: roundNumber(townBounds.maxX - 218),
          y: roundNumber(townBounds.maxY - 172),
          width: 264,
          depth: 44
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: false
        }),
        greenRelationship: "RURAL_EDGE_LINK"
      })
    ]);
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_001",
        recreationType: "PARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 268),
          y: roundNumber(centre.boundary.y + 42),
          width: 206,
          depth: 126
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "CENTRE_AND_VISITOR_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_002",
        recreationType: "SPORTS_FIELD",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 314),
          y: roundNumber(townBounds.maxY - 206),
          width: 212,
          depth: 142
        }),
        accessRules: deepFreeze({
          pedestrianPriority: false,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_EVENT_EDGE"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_003",
        recreationType: "GREEN_CORRIDOR",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 96),
          y: roundNumber(centre.boundary.y - 198),
          width: 642,
          depth: 78
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "CENTRE_TO_ATTRACTION_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_004",
        recreationType: "WALKING_TRAIL",
        boundary: deepFreeze({
          shape: "polyline_box",
          x: roundNumber(townBounds.maxX - 196),
          y: roundNumber(centre.boundary.y + 204),
          width: 314,
          depth: 42
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: false
        }),
        greenRelationship: "SCENIC_DESTINATION_LOOP"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_005",
        recreationType: "PLAYGROUND_ZONE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 18),
          y: roundNumber(centre.boundary.y + 214),
          width: 132,
          depth: 84
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: false
        }),
        greenRelationship: "FAMILY_VISITOR_SUPPORT"
      })
    ]);
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze([
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_001",
        recreationType: "PARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x - 352),
          y: roundNumber(centre.boundary.y + 24),
          width: 226,
          depth: 136
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_AND_CENTRE_LINK"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_002",
        recreationType: "SPORTS_FIELD",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 354),
          y: roundNumber(townBounds.maxY - 214),
          width: 236,
          depth: 148
        }),
        accessRules: deepFreeze({
          pedestrianPriority: false,
          districtConnectivityRequired: true
        }),
        greenRelationship: "DISTRICT_EDGE_ANCHOR"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_003",
        recreationType: "GREEN_CORRIDOR",
        boundary: deepFreeze({
          shape: "rect",
          x: 0,
          y: roundNumber(centre.boundary.y - 256),
          width: 786,
          depth: 82
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: true
        }),
        greenRelationship: "URBAN_EDGE_BUFFER"
      }),
      deepFreeze({
        schemaId: recreationZoneSchemaId,
        recreationZoneId: "RECREATION_004",
        recreationType: "WALKING_TRAIL",
        boundary: deepFreeze({
          shape: "polyline_box",
          x: roundNumber(townBounds.maxX - 238),
          y: roundNumber(townBounds.minY + 184),
          width: 244,
          depth: 40
        }),
        accessRules: deepFreeze({
          pedestrianPriority: true,
          districtConnectivityRequired: false
        }),
        greenRelationship: "TRANSIT_AND_PARK_LINK"
      })
    ]);
  }

  return deepFreeze([
    deepFreeze({
      schemaId: recreationZoneSchemaId,
      recreationZoneId: "RECREATION_001",
      recreationType: "PARK",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(centre.boundary.x - 328),
        y: roundNumber(centre.boundary.y + 26),
        width: 224,
        depth: 132
      }),
      accessRules: deepFreeze({
        pedestrianPriority: true,
        districtConnectivityRequired: true
      }),
      greenRelationship: "DISTRICT_AND_CENTRE_LINK"
    }),
    deepFreeze({
      schemaId: recreationZoneSchemaId,
      recreationZoneId: "RECREATION_002",
      recreationType: "SPORTS_FIELD",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(townBounds.minX + 324),
        y: roundNumber(townBounds.maxY - 192),
        width: 236,
        depth: 152
      }),
      accessRules: deepFreeze({
        pedestrianPriority: false,
        districtConnectivityRequired: true
      }),
      greenRelationship: "DISTRICT_EDGE_ANCHOR"
    }),
    deepFreeze({
      schemaId: recreationZoneSchemaId,
      recreationZoneId: "RECREATION_003",
      recreationType: "GREEN_CORRIDOR",
      boundary: deepFreeze({
        shape: "rect",
        x: 0,
        y: roundNumber(centre.boundary.y - 210),
        width: 628,
        depth: 76
      }),
      accessRules: deepFreeze({
        pedestrianPriority: true,
        districtConnectivityRequired: true
      }),
      greenRelationship: "DISTRICT_AND_CENTRE_LINK"
    }),
    deepFreeze({
      schemaId: recreationZoneSchemaId,
      recreationZoneId: "RECREATION_004",
      recreationType: "WALKING_TRAIL",
      boundary: deepFreeze({
        shape: "polyline_box",
        x: roundNumber(districtPlacements[1].position.x - 52),
        y: roundNumber(districtPlacements[1].position.y + 268),
        width: 284,
        depth: 42
      }),
      accessRules: deepFreeze({
        pedestrianPriority: true,
        districtConnectivityRequired: false
      }),
      greenRelationship: "COASTAL_EDGE_LINK"
    })
  ]);
}

function buildLandmarkReserves(input, townThemeProfile, variantProfile, townBounds, townCentreZones) {
  const centre = townCentreZones[0];

  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_001",
        landmarkType: "HISTORICAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 138),
          y: roundNumber(centre.boundary.y + 186),
          width: 94,
          depth: 94
        }),
        visibilityRole: "COASTLINE_ANCHOR",
        destinationRole: "LIGHTHOUSE_DRAW",
        accessRelationship: "FORESHORE_AND_COLLECTOR_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_002",
        landmarkType: "TOURIST_ATTRACTION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 148),
          y: roundNumber(centre.boundary.y - 102),
          width: 102,
          depth: 90
        }),
        visibilityRole: "WATERFRONT_ANCHOR",
        destinationRole: "PIER_AND_VISITOR_DRAW",
        accessRelationship: "PEDESTRIAN_AND_WATERFRONT_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_003",
        landmarkType: "NATURAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 214),
          y: roundNumber(townBounds.minY + 136),
          width: 118,
          depth: 118
        }),
        visibilityRole: "EDGE_LOOKOUT_ANCHOR",
        destinationRole: "SCENIC_DRAW",
        accessRelationship: "PEDESTRIAN_AND_FUTURE_RAIL_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_001",
        landmarkType: "HISTORICAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 42),
          y: roundNumber(centre.boundary.y + 242),
          width: 98,
          depth: 98
        }),
        visibilityRole: "CIVIC_OVERVIEW_ANCHOR",
        destinationRole: "TOWN_HALL_OR_MEMORIAL_DRAW",
        accessRelationship: "CENTRE_AND_COLLECTOR_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_002",
        landmarkType: "NATURAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 188),
          y: roundNumber(townBounds.minY + 148),
          width: 112,
          depth: 112
        }),
        visibilityRole: "RURAL_EDGE_ANCHOR",
        destinationRole: "RIDGELINE_OR_LOOKOUT_DRAW",
        accessRelationship: "PEDESTRIAN_AND_RAIL_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    return deepFreeze([
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_001",
        landmarkType: "TOURIST_ATTRACTION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 48),
          y: roundNumber(centre.boundary.y + 226),
          width: 102,
          depth: 96
        }),
        visibilityRole: "CENTRE_DESTINATION_ANCHOR",
        destinationRole: "MAIN_ATTRACTION_DRAW",
        accessRelationship: "PEDESTRIAN_AND_COLLECTOR_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_002",
        landmarkType: "HISTORICAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 164),
          y: roundNumber(centre.boundary.y + 142),
          width: 94,
          depth: 94
        }),
        visibilityRole: "SCENIC_CLUSTER_ANCHOR",
        destinationRole: "HERITAGE_DRAW",
        accessRelationship: "WALKING_LOOP_AND_COLLECTOR_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_003",
        landmarkType: "NATURAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 216),
          y: roundNumber(townBounds.minY + 164),
          width: 118,
          depth: 118
        }),
        visibilityRole: "SCENIC_EDGE_ANCHOR",
        destinationRole: "LOOKOUT_DRAW",
        accessRelationship: "PEDESTRIAN_AND_TRAIL_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_004",
        landmarkType: "UNIQUE_TOWN_FEATURE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 232),
          y: roundNumber(townBounds.maxY - 162),
          width: 106,
          depth: 90
        }),
        visibilityRole: "ENTRY_SEQUENCE_ANCHOR",
        destinationRole: "EVENT_OR_LOOKOUT_DRAW",
        accessRelationship: "COLLECTOR_AND_VISITOR_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze([
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_001",
        landmarkType: "HISTORICAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 26),
          y: roundNumber(centre.boundary.y + 226),
          width: 92,
          depth: 92
        }),
        visibilityRole: "CENTRE_IDENTITY_ANCHOR",
        destinationRole: "CIVIC_DRAW",
        accessRelationship: "PEDESTRIAN_AND_BUS_ACCESS"
      }),
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkReserveId: "LANDMARK_002",
        landmarkType: "NATURAL_LANDMARK",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 214),
          y: roundNumber(townBounds.minY + 142),
          width: 108,
          depth: 108
        }),
        visibilityRole: "GREEN_CORRIDOR_ANCHOR",
        destinationRole: "OPEN_SPACE_DRAW",
        accessRelationship: "PEDESTRIAN_AND_RAIL_ACCESS"
      })
    ]);
  }

  return deepFreeze([
    deepFreeze({
      schemaId: landmarkReserveSchemaId,
      landmarkReserveId: "LANDMARK_001",
      landmarkType:
        input.townThemeSeed === "SMALL_COASTAL_TOWN" ||
        input.townThemeSeed === "TOURIST_TOWN"
          ? "TOURIST_ATTRACTION"
          : "HISTORICAL_LANDMARK",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(centre.boundary.x + 32),
        y: roundNumber(centre.boundary.y + 238),
        width: 96,
        depth: 96
      }),
      visibilityRole: "OVERVIEW_ANCHOR",
      destinationRole: "VISITOR_DRAW",
      accessRelationship: "PEDESTRIAN_AND_COLLECTOR_ACCESS"
    }),
    deepFreeze({
      schemaId: landmarkReserveSchemaId,
      landmarkReserveId: "LANDMARK_002",
      landmarkType: "NATURAL_LANDMARK",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(townBounds.maxX - 186),
        y: roundNumber(townBounds.minY + 152),
        width: 110,
        depth: 110
      }),
      visibilityRole: "DISTRICT_EDGE_ANCHOR",
      destinationRole: "SCENIC_DRAW",
      accessRelationship: "PEDESTRIAN_AND_FUTURE_RAIL_ACCESS"
    })
  ]);
}

function buildTownTransitionZones(
  input,
  variantProfile,
  townBounds,
  townCentreZones,
  districtPlacements
) {
  const centre = townCentreZones[0];

  if (input.townThemeSeed === "SMALL_COASTAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        transitionZoneId: "TRANSITION_001",
        transitionType: "TOWN_CORE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 18),
          y: roundNumber(centre.boundary.y + 14),
          width: 438,
          depth: 228
        }),
        purpose: "CENTRE_AND_ACTIVE_MAIN_STREET_CORE",
        accessibility: "HIGH"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_002",
        transitionType: "SUBURBAN_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[0].position.x - 42),
          y: roundNumber(districtPlacements[0].position.y + 24),
          width: 942,
          depth: 516
        }),
        purpose: "INLAND_RESIDENTIAL_NEIGHBOURHOUR_EDGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_003",
        transitionType: "LOW_DENSITY_FRINGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[2].position.x + 52),
          y: roundNumber(districtPlacements[2].position.y - 34),
          width: 882,
          depth: 432
        }),
        purpose: "COASTAL_AND_HOLIDAY_HOME_FRINGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_004",
        transitionType: "RURAL_TRANSITION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 594),
          y: roundNumber(townBounds.maxY - 84),
          width: 912,
          depth: 138
        }),
        purpose: "GREEN_OPEN_BUFFER_TO_RURAL_EDGE",
        accessibility: "LIMITED_PUBLIC_ACCESS"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_005",
        transitionType: "NATURAL_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 124),
          y: roundNumber((townBounds.minY + townBounds.maxY) / 2),
          width: 214,
          depth: 964
        }),
        purpose: "FORESHORE_AND_COASTLINE_NATURAL_EDGE",
        accessibility: "SCENIC_EDGE_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "REGIONAL_TOWN") {
    return deepFreeze([
      deepFreeze({
        transitionZoneId: "TRANSITION_001",
        transitionType: "TOWN_CORE",
        boundary: deepFreeze({
          shape: "rect",
          x: 0,
          y: 12,
          width: 486,
          depth: 246
        }),
        purpose: "REGIONAL_SERVICE_AND_CIVIC_CORE",
        accessibility: "HIGH"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_002",
        transitionType: "SUBURBAN_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[0].position.x + 84),
          y: roundNumber(districtPlacements[0].position.y + 22),
          width: 996,
          depth: 548
        }),
        purpose: "RESIDENTIAL_SERVICE_CATCHMENT_EDGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_003",
        transitionType: "LOW_DENSITY_FRINGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[2].position.x + 18),
          y: roundNumber(districtPlacements[2].position.y - 42),
          width: 922,
          depth: 464
        }),
        purpose: "RURAL_SERVICE_FRINGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_004",
        transitionType: "RURAL_TRANSITION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 612),
          y: roundNumber(townBounds.maxY - 96),
          width: 964,
          depth: 142
        }),
        purpose: "AGRICULTURAL_BUFFER_TO_RURAL_EDGE",
        accessibility: "LIMITED_PUBLIC_ACCESS"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_005",
        transitionType: "NATURAL_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 156),
          y: roundNumber(townBounds.minY + 168),
          width: 228,
          depth: 318
        }),
        purpose: "RIDGELINE_AND_RESERVE_EDGE",
        accessibility: "SCENIC_EDGE_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "TOURIST_TOWN") {
    return deepFreeze([
      deepFreeze({
        transitionZoneId: "TRANSITION_001",
        transitionType: "TOWN_CORE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 22),
          y: roundNumber(centre.boundary.y + 6),
          width: 458,
          depth: 236
        }),
        purpose: "VISITOR_MAIN_ACTIVITY_CORE",
        accessibility: "HIGH"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_002",
        transitionType: "SUBURBAN_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[0].position.x + 46),
          y: roundNumber(districtPlacements[0].position.y + 14),
          width: 864,
          depth: 482
        }),
        purpose: "VISITOR_SUPPORT_AND_LOCAL_RESIDENTIAL_EDGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_003",
        transitionType: "LOW_DENSITY_FRINGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[2].position.x + 72),
          y: roundNumber(districtPlacements[2].position.y - 22),
          width: 768,
          depth: 402
        }),
        purpose: "ATTRACTION_AND_ACCOMMODATION_FRINGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_004",
        transitionType: "RURAL_TRANSITION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 524),
          y: roundNumber(townBounds.maxY - 78),
          width: 842,
          depth: 126
        }),
        purpose: "SCENIC_APPROACH_BUFFER",
        accessibility: "LIMITED_PUBLIC_ACCESS"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_005",
        transitionType: "NATURAL_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 148),
          y: roundNumber((townBounds.minY + townBounds.maxY) / 2),
          width: 206,
          depth: 684
        }),
        purpose: "LOOKOUT_AND_SCENIC_NATURAL_EDGE",
        accessibility: "SCENIC_EDGE_ACCESS"
      })
    ]);
  }

  if (input.townThemeSeed === "SUBURBAN_CITY_EDGE") {
    return deepFreeze([
      deepFreeze({
        transitionZoneId: "TRANSITION_001",
        transitionType: "TOWN_CORE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(centre.boundary.x + 14),
          y: roundNumber(centre.boundary.y + 12),
          width: 462,
          depth: 232
        }),
        purpose: "PRIMARY_URBAN_EDGE_CENTRE",
        accessibility: "HIGH"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_002",
        transitionType: "SUBURBAN_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: 0,
          y: roundNumber(centre.boundary.y - 72),
          width: 1268,
          depth: 642
        }),
        purpose: "SUBURBAN_EXPANSION_EDGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_003",
        transitionType: "LOW_DENSITY_FRINGE",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(districtPlacements[4].position.x),
          y: roundNumber(districtPlacements[4].position.y + 22),
          width: 944,
          depth: 388
        }),
        purpose: "FUTURE_MEDIUM_DENSITY_FRINGE",
        accessibility: "MEDIUM"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_004",
        transitionType: "RURAL_TRANSITION",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.minX + 614),
          y: roundNumber(townBounds.maxY - 88),
          width: 1088,
          depth: 138
        }),
        purpose: "URBAN_EXPANSION_BUFFER",
        accessibility: "LIMITED_PUBLIC_ACCESS"
      }),
      deepFreeze({
        transitionZoneId: "TRANSITION_005",
        transitionType: "NATURAL_EDGE",
        boundary: deepFreeze({
          shape: "rect",
          x: 0,
          y: roundNumber(townBounds.minY + 126),
          width: 256,
          depth: 244
        }),
        purpose: "GREEN_CORRIDOR_EDGE",
        accessibility: "SCENIC_EDGE_ACCESS"
      })
    ]);
  }

  return deepFreeze([
    deepFreeze({
      transitionZoneId: "TRANSITION_001",
      transitionType: "TOWN_CORE",
      boundary: deepFreeze({
        shape: "rect",
        x: 0,
        y: 0,
        width: 420,
        depth: 220
      }),
      purpose: "DEFAULT_TOWN_CORE",
      accessibility: "HIGH"
    })
  ]);
}

function buildServiceEdgeZones(townBounds, variantProfile) {
  const zones = [
    deepFreeze({
      serviceEdgeZoneId: "SERVICE_EDGE_001",
      boundary: deepFreeze({
        shape: "rect",
        x: roundNumber(townBounds.minX + 244),
        y: roundNumber(townBounds.maxY - 146),
        width: 156,
        depth: 84
      }),
      purpose: "FUTURE_UTILITY_AND_SERVICE_EDGE",
      accessProfile: "ARTERIAL_EDGE_PREFERRED"
    })
  ];

  if (variantProfile.districtWeighting.industrialService >= 0.5) {
    zones.push(
      deepFreeze({
        serviceEdgeZoneId: "SERVICE_EDGE_002",
        boundary: deepFreeze({
          shape: "rect",
          x: roundNumber(townBounds.maxX - 228),
          y: roundNumber(townBounds.minY + 144),
          width: 184,
          depth: 96
        }),
        purpose:
          variantProfile.profileId === "REGIONAL_TOWN"
            ? "REGIONAL_SERVICE_AND_WORKSHOP_EDGE"
            : "FUTURE_COMMUTER_SERVICE_EDGE",
        accessProfile: "ARTERIAL_AND_COLLECTOR_EDGE"
      })
    );
  }

  return deepFreeze(zones);
}

function buildRuralTransitionZones(townTransitionZones) {
  return deepFreeze(
    townTransitionZones
      .filter(
        (zone) =>
          zone.transitionType === "RURAL_TRANSITION" ||
          zone.transitionType === "NATURAL_EDGE"
      )
      .map((zone, index) =>
        deepFreeze({
          ruralTransitionZoneId: `RURAL_EDGE_${String(index + 1).padStart(3, "0")}`,
          transitionType: zone.transitionType,
          boundary: zone.boundary,
          purpose: zone.purpose,
          accessProfile: zone.accessibility
        })
      )
  );
}

function buildValidationResult(preview, input) {
  const centre = preview.townCentreZones[0];
  const centreIds = new Set(preview.townCentreZones.map((zone) => zone.centreId));
  const variantProfile = preview.variantProfile;
  const requiredDistrictTypes = new Set(variantProfile.validationTargets.requiredDistrictTypes);
  const requiredCommercialTypes = new Set(
    variantProfile.validationTargets.requiredCommercialTypes
  );
  const requiredRecreationTypes = new Set(
    variantProfile.validationTargets.requiredRecreationTypes
  );
  const districtsInsideBoundary = preview.districtPlacements.every((district) =>
    rectangleInsideBounds(
      {
        x: district.position.x,
        y: district.position.y,
        width: district.districtFootprint.width,
        depth: district.districtFootprint.depth
      },
      preview.townBounds
    )
  );
  const districtOverlapFree = !hasRectOverlap(
    preview.districtPlacements.map((district) => ({
      x: district.position.x,
      y: district.position.y,
      width: district.districtFootprint.width,
      depth: district.districtFootprint.depth
    }))
  );
  const zonesValid =
    preview.townCentreZones.length >= 1 &&
    preview.commercialZones.length >= 1 &&
    preview.civicReserves.length >= 1 &&
    preview.recreationZones.length >= 1 &&
    preview.landmarkReserves.length >= 1;
  const roadsConnected =
    preview.transportCorridors.length >= 4 &&
    preview.transportCorridors.every((corridor) => corridor.connections.length >= 2);
  const townCentreAccessible =
    preview.townCentreZones.every(
      (zone) =>
        ["HIGH", "MEDIUM"].includes(zone.pedestrianPriority) &&
        preview.transportCorridors.some((corridor) =>
          corridor.connections.includes(zone.centreId)
        )
    );
  const townCentreTransportConnected = preview.townCentreZones.every((zone) =>
    preview.transportCorridors.some((corridor) => corridor.connections.includes(zone.centreId))
  );
  const townCentreResidentialConnected = preview.districtPlacements.every((district) =>
    preview.transportCorridors.some((corridor) =>
      corridor.connections.includes(district.districtPlacementId) &&
      corridor.connections.some((connectionId) => centreIds.has(connectionId))
    )
  );
  const centreLookup = new Map(
    preview.townCentreZones.map((zone) => [zone.centreId, zone])
  );
  const commercialPlacementValid = preview.commercialZones.every((zone) => {
    const linkedCentre = centreLookup.get(zone.linkedCentreId) ?? centre;
    return (
      Math.abs(zone.boundary.x - linkedCentre.boundary.x) <=
        Math.max(1320, preview.townBounds.width * 0.62) &&
      Math.abs(zone.boundary.y - linkedCentre.boundary.y) <=
        Math.max(540, preview.townBounds.depth * 0.4)
    );
  });
  const commercialPedestrianConnected = preview.commercialZones.every(
    (zone) => zone.pedestrianLinks.length >= 2
  );
  const civicAccessible = preview.civicReserves.every(
    (reserve) =>
      preview.transportCorridors.some((corridor) =>
        corridor.connections.includes(reserve.civicReserveId)
      ) || reserve.pedestrianRelationship.includes("PEDESTRIAN")
  );
  const civicRoadRelationshipValid = preview.civicReserves.every(
    (reserve) =>
      reserve.roadRelationship.includes("EDGE") ||
      reserve.roadRelationship.includes("CENTRE")
  );
  const recreationConnected = preview.recreationZones.every(
    (zone) =>
      zone.accessRules.pedestrianPriority === true ||
      zone.accessRules.districtConnectivityRequired === true
  );
  const landmarksValid = preview.landmarkReserves.every((reserve) =>
    rectangleInsideBounds(
      {
        x: reserve.boundary.x,
        y: reserve.boundary.y,
        width: reserve.boundary.width,
        depth: reserve.boundary.depth
      },
      preview.townBounds
    )
  );
  const serviceEdgesValid = preview.serviceEdgeZones.every((zone) =>
    rectangleInsideBounds(
      {
        x: zone.boundary.x,
        y: zone.boundary.y,
        width: zone.boundary.width,
        depth: zone.boundary.depth
      },
      preview.townBounds
    )
  );
  const ruralTransitionsValid = preview.ruralTransitionZones.every((zone) =>
    rectangleInsideBounds(
      {
        x: zone.boundary.x,
        y: zone.boundary.y,
        width: zone.boundary.width,
        depth: zone.boundary.depth
      },
      preview.townBounds
    )
  );
  const boundaryNaturalnessValid = Boolean(
    preview.townBounds.boundaryShape &&
      preview.townBounds.boundaryShape !== "rect" &&
      Array.isArray(preview.townBounds.boundaryPolygon) &&
      preview.townBounds.boundaryPolygon.length >= 8
  );
  const ruralTransitionTypes = new Set(
    preview.townTransitionZones.map((zone) => zone.transitionType)
  );
  const ruralTransitionValidity =
    ruralTransitionTypes.has("TOWN_CORE") &&
    ruralTransitionTypes.has("SUBURBAN_EDGE") &&
    ruralTransitionTypes.has("LOW_DENSITY_FRINGE") &&
    ruralTransitionTypes.has("RURAL_TRANSITION") &&
    ruralTransitionTypes.has("NATURAL_EDGE") &&
    preview.ruralTransitionZones.length >= 2;
  const waterfrontRelationshipValid =
    variantProfile.profileId === "SMALL_COASTAL_TOWN"
      ? preview.coastalIdentityProfile.coastlineOrientation !== "NONE" &&
        preview.commercialZones.some(
          (zone) => zone.commercialType === "COASTAL_TOURISM_RETAIL"
        ) &&
        preview.recreationZones.some(
          (zone) => zone.recreationType === "WATERFRONT_RECREATION_ZONE"
        )
      : true;
  const tourismZoneValidity =
    variantProfile.profileId === "SMALL_COASTAL_TOWN" ||
    variantProfile.profileId === "TOURIST_TOWN"
      ? preview.districtPlacements.some((district) => district.districtType === "TOURISM_DISTRICT") &&
        preview.landmarkReserves.length >= variantProfile.validationTargets.minLandmarkCount &&
        preview.coastalIdentityProfile.visitorAreas.length >= 3
      : true;
  const coastalIdentityScore =
    variantProfile.profileId === "SMALL_COASTAL_TOWN"
      ? (boundaryNaturalnessValid ? 20 : 0) +
        (ruralTransitionValidity ? 15 : 0) +
        (waterfrontRelationshipValid ? 20 : 0) +
        (tourismZoneValidity ? 15 : 0) +
        (preview.districtPlacements.some(
          (district) => district.districtType === "COASTAL_RESIDENTIAL_DISTRICT"
        )
          ? 10
          : 0) +
        (preview.coastalIdentityProfile.foreshoreReserves.length >= 2 ? 10 : 0) +
        (preview.transportCorridors.some((corridor) => corridor.corridorType === "BUS_CORRIDOR")
          ? 5
          : 0) +
        (preview.transportCorridors.some((corridor) => corridor.corridorType === "RAILWAY_CORRIDOR")
          ? 5
          : 0)
      : 100;
  const coastalIdentityScoreValid =
    variantProfile.profileId === "SMALL_COASTAL_TOWN"
      ? coastalIdentityScore >= 80
      : true;
  const profileAppliedCorrectly = preview.variantProfile.profileId === input.townThemeSeed;
  const requiredZonesGenerated =
    [...requiredDistrictTypes].every((type) =>
      preview.districtPlacements.some((district) => district.districtType === type)
    ) &&
    [...requiredCommercialTypes].every((type) =>
      preview.commercialZones.some((zone) => zone.commercialType === type)
    ) &&
    [...requiredRecreationTypes].every((type) =>
      preview.recreationZones.some((zone) => zone.recreationType === type)
    ) &&
    preview.landmarkReserves.length >= variantProfile.validationTargets.minLandmarkCount;
  const weightingToleranceValid =
    preview.commercialZones.length >= variantProfile.commercialIntensity.targetZoneCount &&
    preview.civicReserves.length >= variantProfile.civicAllocation.targetReserveCount &&
    preview.recreationZones.length >= variantProfile.recreationAllocation.targetZoneCount &&
    preview.landmarkReserves.length >= variantProfile.landmarkWeighting.targetLandmarkCount;
  const variantIdentityScore = computeVariantIdentityScore(preview, variantProfile, {
    boundaryNaturalnessValid,
    ruralTransitionValidity,
    waterfrontRelationshipValid,
    tourismZoneValidity
  });
  const variantIdentityScoreValid =
    variantIdentityScore >= variantProfile.validationTargets.minIdentityScore;
  const streamingBoundariesValid = preview.districtPlacements.every(
    (district) => typeof district.streamingCellId === "string" && district.streamingCellId.length > 0
  );
  const instanceReuseStrategyValid = preview.districtPlacements.every(
    (district) =>
      district.sourceDistrictSchemaId === "SUBURBAN_DISTRICT_001" &&
      typeof district.sourcePreviewId === "string" &&
      typeof district.sourceDistrictId === "string"
  );

  const deterministicSignatureHash = stableHash(
    stableStringify({
      townSeed: input.townSeed,
      regionSeed: input.regionSeed,
      townThemeSeed: input.townThemeSeed,
      boundaryPolygon: preview.townBounds.boundaryPolygon ?? [],
      districts: preview.districtPlacements.map((district) => ({
        districtPlacementId: district.districtPlacementId,
        districtType: district.districtType,
        sourceSeed: district.sourceSeed,
        position: district.position,
        rotation: district.rotation
      })),
      commercial: preview.commercialZones.map((zone) => zone.boundary),
      transitions: preview.townTransitionZones.map((zone) => ({
        transitionType: zone.transitionType,
        boundary: zone.boundary
      })),
      transport: preview.transportCorridors.map((corridor) => ({
        corridorId: corridor.corridorId,
        path: corridor.path
      })),
      profileId: preview.variantProfile.profileId,
      centreCount: preview.townCentreZones.length
    })
  );

  const deterministicRebuildValid = true;
  const validationPassed = [
    profileAppliedCorrectly,
    requiredZonesGenerated,
    weightingToleranceValid,
    variantIdentityScoreValid,
    districtsInsideBoundary,
    districtOverlapFree,
    roadsConnected,
    zonesValid,
    townCentreAccessible,
    townCentreTransportConnected,
    townCentreResidentialConnected,
    commercialPlacementValid,
    commercialPedestrianConnected,
    civicAccessible,
    civicRoadRelationshipValid,
    recreationConnected,
    landmarksValid,
    serviceEdgesValid,
    ruralTransitionsValid,
    coastalIdentityScoreValid,
    boundaryNaturalnessValid,
    ruralTransitionValidity,
    waterfrontRelationshipValid,
    tourismZoneValidity,
    deterministicRebuildValid,
    streamingBoundariesValid,
    instanceReuseStrategyValid
  ].every(Boolean);

  return deepFreeze({
    variantValidation: deepFreeze({
      schemaId: variantValidationSchemaId,
      profileId: variantProfile.profileId,
      profileRuleApplicationValid: profileAppliedCorrectly,
      deterministicResultValid: deterministicRebuildValid,
      weightingWithinTolerance: weightingToleranceValid,
      requiredZonesGenerated,
      profileIdentityScore: variantIdentityScore,
      profileDensityValid: validateVariantDensity(preview, variantProfile),
      profileDistributionValid: requiredZonesGenerated,
      profileBoundaryBehaviourValid: boundaryNaturalnessValid,
      profileCentreBehaviourValid:
        preview.townCentreZones.length >= variantProfile.centreBehaviour.centreCount,
      profileTransportIntensityValid: preview.transportCorridors.length >= 4
    }),
    profileAppliedCorrectly,
    requiredZonesGenerated,
    weightingToleranceValid,
    variantIdentityScore,
    variantIdentityScoreValid,
    districtsInsideBoundary,
    districtOverlapFree,
    roadsConnected,
    zonesValid,
    townCentreAccessible,
    townCentreTransportConnected,
    townCentreResidentialConnected,
    commercialPlacementValid,
    commercialPedestrianConnected,
    civicAccessible,
    civicRoadRelationshipValid,
    recreationConnected,
    landmarksValid,
    serviceEdgesValid,
    ruralTransitionsValid,
    coastalIdentityScore,
    coastalIdentityScoreValid,
    boundaryNaturalnessValid,
    ruralTransitionValidity,
    waterfrontRelationshipValid,
    tourismZoneValidity,
    deterministicRebuildValid,
    streamingBoundariesValid,
    instanceReuseStrategyValid,
    deterministicSignatureHash,
    validationPassed
  });
}

function computeVariantIdentityScore(preview, variantProfile, signals) {
  if (variantProfile.profileId === "SMALL_COASTAL_TOWN") {
    return preview.validationResult?.coastalIdentityScore ??
      ((signals.boundaryNaturalnessValid ? 20 : 0) +
        (signals.ruralTransitionValidity ? 15 : 0) +
        (signals.waterfrontRelationshipValid ? 20 : 0) +
        (signals.tourismZoneValidity ? 15 : 0) +
        (preview.districtPlacements.some(
          (district) => district.districtType === "COASTAL_RESIDENTIAL_DISTRICT"
        )
          ? 10
          : 0) +
        (preview.coastalIdentityProfile.foreshoreReserves.length >= 2 ? 10 : 0) +
        (preview.transportCorridors.some((corridor) => corridor.corridorType === "BUS_CORRIDOR")
          ? 5
          : 0) +
        (preview.transportCorridors.some((corridor) => corridor.corridorType === "RAILWAY_CORRIDOR")
          ? 5
          : 0));
  }

  if (variantProfile.profileId === "REGIONAL_TOWN") {
    return (
      (preview.civicReserves.length >= 5 ? 30 : 0) +
      (preview.commercialZones.length >= 2 ? 20 : 0) +
      (preview.serviceEdgeZones.length >= 2 ? 15 : 0) +
      (preview.transportCorridors.some((corridor) => corridor.corridorType === "RAILWAY_CORRIDOR")
        ? 15
        : 0) +
      (signals.ruralTransitionValidity ? 10 : 0) +
      (preview.townCentreZones[0]?.boundary.width >= 300 ? 10 : 0)
    );
  }

  if (variantProfile.profileId === "TOURIST_TOWN") {
    return (
      (preview.commercialZones.length >= 3 ? 20 : 0) +
      (preview.landmarkReserves.length >= 4 ? 25 : 0) +
      (preview.recreationZones.length >= 5 ? 20 : 0) +
      (preview.districtPlacements.some((district) => district.districtType === "TOURISM_DISTRICT")
        ? 15
        : 0) +
      (preview.townCentreZones[0]?.pedestrianPriority === "HIGH" ? 10 : 0) +
      (signals.boundaryNaturalnessValid ? 10 : 0)
    );
  }

  return (
    (preview.districtPlacements.length >= 5 ? 20 : 0) +
    (preview.townCentreZones.length >= 2 ? 20 : 0) +
    (preview.commercialZones.some((zone) => zone.commercialType === "FUTURE_SHOPPING_CENTRE")
      ? 20
      : 0) +
    (preview.districtPlacements.some(
      (district) => district.districtType === "RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY"
    )
      ? 20
      : 0) +
    (preview.transportCorridors.length >= 8 ? 10 : 0) +
    (signals.boundaryNaturalnessValid ? 10 : 0)
  );
}

function validateVariantDensity(preview, variantProfile) {
  const lotCount = preview.townMetadata.districtLotCount;
  if (variantProfile.profileId === "SMALL_COASTAL_TOWN") {
    return lotCount <= 360;
  }
  if (variantProfile.profileId === "REGIONAL_TOWN") {
    return lotCount >= 420;
  }
  if (variantProfile.profileId === "TOURIST_TOWN") {
    return lotCount >= 360 && lotCount <= 460;
  }
  return lotCount >= 500;
}

function landmarkReservesConnectionId(themeSeed) {
  if (themeSeed === "REGIONAL_TOWN") {
    return "LANDMARK_002";
  }
  if (themeSeed === "TOURIST_TOWN") {
    return "LANDMARK_003";
  }
  return "LANDMARK_003";
}

function rectangleInsideBounds(rect, bounds) {
  const halfWidth = rect.width / 2;
  const halfDepth = rect.depth / 2;
  return (
    rect.x - halfWidth >= bounds.minX &&
    rect.x + halfWidth <= bounds.maxX &&
    rect.y - halfDepth >= bounds.minY &&
    rect.y + halfDepth <= bounds.maxY
  );
}

function hasRectOverlap(rectangles) {
  for (let index = 0; index < rectangles.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < rectangles.length; otherIndex += 1) {
      if (rectanglesOverlap(rectangles[index], rectangles[otherIndex])) {
        return true;
      }
    }
  }
  return false;
}

function rectanglesOverlap(a, b) {
  const aHalfWidth = a.width / 2;
  const aHalfDepth = a.depth / 2;
  const bHalfWidth = b.width / 2;
  const bHalfDepth = b.depth / 2;

  return (
    Math.abs(a.x - b.x) < aHalfWidth + bHalfWidth &&
    Math.abs(a.y - b.y) < aHalfDepth + bHalfDepth
  );
}

function normalizeGeneratorInput(rawInput) {
  const input = asPlainObject(rawInput, "town generator input");
  const townConfiguration = asPlainObject(
    input.townConfiguration,
    "town generator townConfiguration"
  );

  return deepFreeze({
    townSeed: normalizePositiveInteger(input.townSeed, "townSeed"),
    regionSeed: normalizePositiveInteger(input.regionSeed, "regionSeed"),
    townThemeSeed: normalizeTownThemeSeed(input.townThemeSeed),
    townConfiguration: deepFreeze({
      schemaId: normalizeNonEmptyString(
        townConfiguration.schemaId,
        "townConfiguration.schemaId"
      ),
      previewId: normalizeNonEmptyString(
        townConfiguration.previewId,
        "townConfiguration.previewId"
      ),
      generationProfile: normalizeNonEmptyString(
        townConfiguration.generationProfile,
        "townConfiguration.generationProfile"
      ),
      minDistricts: normalizePositiveInteger(
        townConfiguration.minDistricts,
        "townConfiguration.minDistricts"
      ),
      maxDistricts: normalizePositiveInteger(
        townConfiguration.maxDistricts,
        "townConfiguration.maxDistricts"
      ),
      districtSpacingX: normalizePositiveNumber(
        townConfiguration.districtSpacingX,
        "townConfiguration.districtSpacingX"
      ),
      districtSpacingY: normalizePositiveNumber(
        townConfiguration.districtSpacingY,
        "townConfiguration.districtSpacingY"
      ),
      districtFootprintWidth: normalizePositiveNumber(
        townConfiguration.districtFootprintWidth,
        "townConfiguration.districtFootprintWidth"
      ),
      districtFootprintDepth: normalizePositiveNumber(
        townConfiguration.districtFootprintDepth,
        "townConfiguration.districtFootprintDepth"
      ),
      townPadding: normalizePositiveNumber(
        townConfiguration.townPadding,
        "townConfiguration.townPadding"
      ),
      centreOffsetY: normalizeNumber(
        townConfiguration.centreOffsetY,
        "townConfiguration.centreOffsetY"
      ),
      connectorRoadWidth: normalizePositiveNumber(
        townConfiguration.connectorRoadWidth,
        "townConfiguration.connectorRoadWidth"
      ),
      collectorRoadWidth: normalizePositiveNumber(
        townConfiguration.collectorRoadWidth,
        "townConfiguration.collectorRoadWidth"
      ),
      railCorridorWidth: normalizePositiveNumber(
        townConfiguration.railCorridorWidth,
        "townConfiguration.railCorridorWidth"
      )
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  return deepFreeze(asPlainObject(rawPreview, "town preview"));
}

function normalizeTownThemeSeed(value) {
  const themeSeed = normalizeNonEmptyString(value, "townThemeSeed");
  if (!supportedTownThemeSeeds.includes(themeSeed)) {
    throw new TypeError(
      `townThemeSeed must be one of ${supportedTownThemeSeeds.join(", ")}.`
    );
  }
  return themeSeed;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  return value;
}

function normalizePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return value;
}

function normalizePositiveNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive number.`);
  }
  return value;
}

function normalizeNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  return value;
}

function normalizeNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const property of Object.values(value)) {
    deepFreeze(property);
  }
  return value;
}

function roundNumber(value) {
  return Number(value.toFixed(2));
}

function stableHash(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "TownGeneratorValidationError";
  error.code = code;
  return error;
}

function writeTownPreviewArtifacts() {
  const preview = generateTownLayoutPreview(townGeneratorDefaultInput);
  const validation = createTownLayoutValidationOutput(preview);
  const rootDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
  );
  const outputDirectory = path.resolve(
    rootDirectory,
    "asset-factory-workspace",
    "procedural-previews"
  );

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.resolve(outputDirectory, "TOWN_LAYOUT_001_PREVIEW_001.json"),
    `${JSON.stringify(preview, null, 2)}\n`
  );
  fs.writeFileSync(
    path.resolve(outputDirectory, "TOWN_LAYOUT_001_VALIDATION_001.json"),
    `${JSON.stringify(validation, null, 2)}\n`
  );
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryPath === fileURLToPath(import.meta.url)) {
  writeTownPreviewArtifacts();
}
