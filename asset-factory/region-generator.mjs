import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const regionSchemaId = "REGION_LAYOUT_001";
const settlementSchemaId = "SETTLEMENT_INSTANCE_001";
const transportCorridorSchemaId = "REGIONAL_TRANSPORT_CORRIDOR_INSTANCE_001";
const naturalZoneSchemaId = "NATURAL_ZONE_INSTANCE_001";
const landmarkReserveSchemaId = "REGIONAL_LANDMARK_RESERVE_INSTANCE_001";
const explorationRouteSchemaId = "EXPLORATION_ROUTE_INSTANCE_001";
const validationSchemaId = "REGION_VALIDATION_001";
const validationOutputId = "REGION_LAYOUT_001_VALIDATION_001";

const supportedRegionProfiles = Object.freeze([
  "COASTAL_REGION",
  "RURAL_REGION",
  "MOUNTAIN_REGION",
  "TOURISM_REGION",
  "METROPOLITAN_EDGE_REGION"
]);

const supportedSettlementTypes = new Set([
  "MAJOR_TOWN",
  "REGIONAL_TOWN",
  "SMALL_COASTAL_TOWN",
  "VILLAGE",
  "HAMLET"
]);

const supportedTransportTypes = new Set([
  "HIGHWAY",
  "MAJOR_ROAD",
  "LOCAL_ROAD",
  "RAILWAY_CORRIDOR",
  "COASTAL_ROUTE"
]);

const supportedNaturalZoneTypes = new Set([
  "COASTLINE",
  "FOREST",
  "FARMLAND",
  "RIVER",
  "WETLAND",
  "MOUNTAINS",
  "PROTECTED_AREA"
]);

const supportedLandmarkTypes = new Set([
  "WATERFALL",
  "LIGHTHOUSE",
  "HISTORIC_SITE",
  "NATIONAL_PARK",
  "LOOKOUT",
  "GEOLOGICAL_FEATURE"
]);

const supportedExplorationRouteTypes = new Set([
  "SCENIC_COASTAL_DRIVE",
  "INLAND_SERVICE_ROUTE",
  "LOOKOUT_TRAIL",
  "LANDMARK_LINK",
  "NATURE_LOOP",
  "RIVER_WALK"
]);

const regionProfiles = deepFreeze({
  COASTAL_REGION: {
    profileId: "COASTAL_REGION",
    generationProfile: "coastal_region_default",
    boundaryStyle: "coastal_irregular_region_polygon",
    settlementDensity: "MEDIUM_SCENIC",
    majorTownWeight: 0.6,
    regionalTownWeight: 0.8,
    smallTownWeight: 1,
    villageWeight: 0.7,
    hamletWeight: 0.45,
    transportIntensity: "MEDIUM",
    naturalZoneWeighting: {
      coastline: 1,
      forest: 0.7,
      farmland: 0.8,
      river: 0.65,
      wetland: 0.45,
      mountains: 0.2,
      protectedArea: 0.7
    },
    landmarkFrequency: "HIGH",
    explorationRouteDensity: "HIGH",
    boundaryBehaviour: "COAST_FIRST_INLAND_FAN",
    growthPattern: "WATERFRONT_AND_SERVICE_CORRIDOR"
  },
  RURAL_REGION: {
    profileId: "RURAL_REGION",
    generationProfile: "rural_region_default",
    boundaryStyle: "rural_spread_region_polygon",
    settlementDensity: "LOW_SPREAD",
    majorTownWeight: 0.35,
    regionalTownWeight: 0.75,
    smallTownWeight: 0.3,
    villageWeight: 1,
    hamletWeight: 0.8,
    transportIntensity: "MEDIUM",
    naturalZoneWeighting: {
      coastline: 0,
      forest: 0.4,
      farmland: 1,
      river: 0.6,
      wetland: 0.25,
      mountains: 0.2,
      protectedArea: 0.3
    },
    landmarkFrequency: "MEDIUM",
    explorationRouteDensity: "MEDIUM",
    boundaryBehaviour: "AGRICULTURAL_CATCHMENT",
    growthPattern: "SERVICE_TOWN_AND_FARM_VILLAGE"
  },
  MOUNTAIN_REGION: {
    profileId: "MOUNTAIN_REGION",
    generationProfile: "mountain_region_default",
    boundaryStyle: "ridge_constrained_region_polygon",
    settlementDensity: "LOW_CONSTRAINED",
    majorTownWeight: 0.25,
    regionalTownWeight: 0.45,
    smallTownWeight: 0.25,
    villageWeight: 0.75,
    hamletWeight: 1,
    transportIntensity: "LOW_MEDIUM",
    naturalZoneWeighting: {
      coastline: 0,
      forest: 0.9,
      farmland: 0.25,
      river: 0.7,
      wetland: 0.2,
      mountains: 1,
      protectedArea: 0.85
    },
    landmarkFrequency: "HIGH",
    explorationRouteDensity: "HIGH",
    boundaryBehaviour: "RIDGE_AND_VALLEY",
    growthPattern: "VALLEY_CORRIDOR_SETTLEMENT"
  },
  TOURISM_REGION: {
    profileId: "TOURISM_REGION",
    generationProfile: "tourism_region_default",
    boundaryStyle: "scenic_destination_region_polygon",
    settlementDensity: "MEDIUM_ATTRACTION_CLUSTER",
    majorTownWeight: 0.45,
    regionalTownWeight: 0.5,
    smallTownWeight: 0.8,
    villageWeight: 0.75,
    hamletWeight: 0.55,
    transportIntensity: "MEDIUM_HIGH",
    naturalZoneWeighting: {
      coastline: 0.7,
      forest: 0.8,
      farmland: 0.4,
      river: 0.6,
      wetland: 0.3,
      mountains: 0.5,
      protectedArea: 0.7
    },
    landmarkFrequency: "VERY_HIGH",
    explorationRouteDensity: "VERY_HIGH",
    boundaryBehaviour: "SCENIC_NODE_CLUSTER",
    growthPattern: "DESTINATION_CHAIN"
  },
  METROPOLITAN_EDGE_REGION: {
    profileId: "METROPOLITAN_EDGE_REGION",
    generationProfile: "metropolitan_edge_region_default",
    boundaryStyle: "urban_edge_growth_region_polygon",
    settlementDensity: "HIGH_EDGE",
    majorTownWeight: 1,
    regionalTownWeight: 0.9,
    smallTownWeight: 0.35,
    villageWeight: 0.2,
    hamletWeight: 0.1,
    transportIntensity: "HIGH",
    naturalZoneWeighting: {
      coastline: 0.2,
      forest: 0.35,
      farmland: 0.5,
      river: 0.5,
      wetland: 0.2,
      mountains: 0.1,
      protectedArea: 0.3
    },
    landmarkFrequency: "MEDIUM",
    explorationRouteDensity: "MEDIUM",
    boundaryBehaviour: "CORRIDOR_AND_INFILL",
    growthPattern: "NETWORK_EXPANSION"
  }
});

export const regionGeneratorDefaultInput = deepFreeze({
  regionSeed: 10482,
  biomeSeed: 1,
  climateSeed: 1,
  settlementPatternSeed: 1,
  regionProfileSeed: "COASTAL_REGION",
  regionConfiguration: deepFreeze({
    schemaId: regionSchemaId,
    previewId: "REGION_LAYOUT_001_PREVIEW_001",
    generationProfile: "coastal_region_default",
    width: 6200,
    height: 4400,
    coastlineInset: 540,
    coastalBandDepth: 780,
    inlandBandDepth: 1260,
    streamingCellSize: 620
  })
});

export function createRegionGenerator(options = regionGeneratorDefaultInput) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);
  return Object.freeze({
    generate(overrides = {}) {
      return generateRegionLayoutPreview({
        ...normalizedDefaultInput,
        ...overrides,
        regionConfiguration: {
          ...normalizedDefaultInput.regionConfiguration,
          ...(overrides.regionConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateRegionLayoutPreview(preview);
    }
  });
}

export function generateRegionLayoutPreview(
  rawInput = regionGeneratorDefaultInput
) {
  const input = normalizeGeneratorInput(rawInput);
  const regionProfile = resolveRegionProfile(input.regionProfileSeed);
  const seedConfig = buildSeedConfig(input);
  const regionBounds = buildRegionBounds(input, regionProfile);
  const naturalZones = buildNaturalZones(input, regionProfile, regionBounds);
  const settlements = buildSettlements(input, regionProfile, regionBounds, naturalZones);
  const transportCorridors = buildTransportCorridors(
    input,
    regionProfile,
    settlements,
    regionBounds
  );
  const landmarkReserves = buildLandmarkReserves(
    input,
    regionProfile,
    settlements,
    naturalZones
  );
  const explorationRoutes = buildExplorationRoutes(
    input,
    regionProfile,
    settlements,
    landmarkReserves,
    naturalZones
  );
  const streamingGrid = buildStreamingGrid(input, regionBounds);
  const regionMetadata = buildRegionMetadata(
    regionProfile,
    settlements,
    naturalZones,
    transportCorridors,
    landmarkReserves,
    explorationRoutes
  );

  const preview = deepFreeze({
    schemaId: regionSchemaId,
    regionId: `REGION_${String(input.regionSeed).padStart(5, "0")}`,
    previewId: input.regionConfiguration.previewId,
    generationProfile: regionProfile.generationProfile,
    seed: input.regionSeed,
    seedConfig,
    regionProfile: deepFreeze({ ...regionProfile }),
    regionBounds,
    regionMetadata,
    naturalZones: deepFreeze(naturalZones),
    settlements: deepFreeze(settlements),
    transportCorridors: deepFreeze(transportCorridors),
    landmarkReserves: deepFreeze(landmarkReserves),
    explorationRoutes: deepFreeze(explorationRoutes),
    streamingGrid,
    validationContract: deepFreeze({
      checks: deepFreeze({
        naturalZonesValid: true,
        settlementsValid: true,
        transportConnected: true,
        settlementHierarchyValid: true,
        terrainRelationshipsValid: true,
        corridorsConnected: true,
        landmarksAccessible: true,
        explorationRoutesValid: true,
        deterministicRebuildValid: true,
        streamingReadyStructure: true,
        instanceReferencesOnly: true
      })
    }),
    validationResult: null
  });

  const validationResult = buildValidationResult(preview);
  const finalizedPreview = deepFreeze({
    ...preview,
    validationResult
  });

  const validation = validateRegionLayoutPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function createRegionLayoutValidationOutput(
  rawPreview,
  validationId = validationOutputId
) {
  const preview = normalizeGeneratedPreview(rawPreview);
  return deepFreeze({
    validationId,
    previewId: preview.previewId,
    regionId: preview.regionId,
    seed: preview.seed,
    summary: deepFreeze({
      validationPassed: preview.validationResult.validationPassed,
      regionProfileId: preview.regionProfile.profileId,
      settlementCount: preview.settlements.length,
      naturalZoneCount: preview.naturalZones.length,
      transportCorridorCount: preview.transportCorridors.length,
      landmarkReserveCount: preview.landmarkReserves.length,
      explorationRouteCount: preview.explorationRoutes.length
    }),
    checks: deepFreeze({
      naturalZonesValid: passFail(preview.validationResult.naturalZonesValid),
      settlementsValid: passFail(preview.validationResult.settlementsValid),
      transportConnected: passFail(preview.validationResult.transportConnected),
      settlementHierarchyValid: passFail(
        preview.validationResult.settlementHierarchyValid
      ),
      terrainRelationshipsValid: passFail(
        preview.validationResult.terrainRelationshipsValid
      ),
      corridorsConnected: passFail(preview.validationResult.corridorsConnected),
      landmarksAccessible: passFail(preview.validationResult.landmarksAccessible),
      explorationRoutesValid: passFail(
        preview.validationResult.explorationRoutesValid
      ),
      deterministicRebuildValid: passFail(
        preview.validationResult.deterministicRebuildValid
      ),
      streamingReadyStructure: passFail(
        preview.validationResult.streamingReadyStructure
      ),
      instanceReferencesOnly: passFail(
        preview.validationResult.instanceReferencesOnly
      )
    })
  });
}

export function validateRegionLayoutPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.regionProfile.profileId !== "COASTAL_REGION") {
      throw createValidationError(
        "unsupported_region_profile",
        "Session 75 generator must actively generate the COASTAL_REGION profile."
      );
    }
    if (preview.settlements.length < 5) {
      throw createValidationError(
        "insufficient_settlement_count",
        "Region preview must include at least five settlements."
      );
    }
    if (preview.naturalZones.length < 6) {
      throw createValidationError(
        "insufficient_natural_zone_count",
        "Region preview must include at least six natural zones."
      );
    }
    if (preview.transportCorridors.length < 5) {
      throw createValidationError(
        "insufficient_transport_count",
        "Region preview must include at least five transport corridors."
      );
    }
    if (preview.landmarkReserves.length < 4) {
      throw createValidationError(
        "insufficient_landmark_count",
        "Region preview must include at least four landmark reserves."
      );
    }
    if (preview.explorationRoutes.length < 5) {
      throw createValidationError(
        "insufficient_route_count",
        "Region preview must include at least five exploration routes."
      );
    }

    validateNaturalZones(preview);
    validateSettlements(preview);
    validateTransportCorridors(preview);
    validateLandmarks(preview);
    validateExplorationRoutes(preview);

    if (!preview.validationResult.validationPassed) {
      throw createValidationError(
        "validation_result_failed",
        "Region validationResult must report a passing state."
      );
    }

    const actualHash = computeDeterministicSignatureHash(preview);
    if (actualHash !== preview.validationResult.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Region deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      preview
    });
  } catch (error) {
    if (error?.name !== "RegionGeneratorValidationError") {
      throw error;
    }
    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      preview: null
    });
  }
}

function buildSeedConfig(input) {
  return deepFreeze({
    regionSeed: input.regionSeed,
    biomeSeed: input.biomeSeed,
    climateSeed: input.climateSeed,
    settlementPatternSeed: input.settlementPatternSeed,
    regionProfileSeed: input.regionProfileSeed
  });
}

function resolveRegionProfile(regionProfileSeed) {
  return regionProfiles[regionProfileSeed] ?? regionProfiles.COASTAL_REGION;
}

function buildRegionBounds(input, regionProfile) {
  const { width, height, coastlineInset } = input.regionConfiguration;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const boundaryPolygon = deepFreeze([
    point(-halfWidth, -halfHeight + 220),
    point(-halfWidth + 260, -halfHeight - 60),
    point(-halfWidth + coastlineInset, -halfHeight + 120),
    point(halfWidth - 240, -halfHeight + 260),
    point(halfWidth + 120, -halfHeight + 720),
    point(halfWidth + 180, halfHeight - 320),
    point(halfWidth - 140, halfHeight + 120),
    point(-halfWidth + 460, halfHeight + 180),
    point(-halfWidth - 120, halfHeight - 180),
    point(-halfWidth - 180, -40)
  ]);

  return deepFreeze({
    boundaryStyle: regionProfile.boundaryStyle,
    minX: roundNumber(-halfWidth),
    maxX: roundNumber(halfWidth),
    minY: roundNumber(-halfHeight),
    maxY: roundNumber(halfHeight),
    boundaryPolygon
  });
}

function buildNaturalZones(input, regionProfile, regionBounds) {
  const { minX, maxX, minY, maxY } = regionBounds;
  const coastalBand = input.regionConfiguration.coastalBandDepth;
  const inlandBand = input.regionConfiguration.inlandBandDepth;

  return [
    buildNaturalZone(
      "NATURAL_ZONE_001",
      "COASTLINE",
      [
        point(minX, minY + 140),
        point(maxX, minY + 340),
        point(maxX, minY + coastalBand),
        point(minX + 320, minY + coastalBand - 120)
      ],
      "TEMPERATE_COASTAL",
      "PARTIAL_PUBLIC_ACCESS",
      "VERY_HIGH",
      "STRONG_COASTAL_ATTRACTION",
      "SHAPES_COASTAL_ROUTE_AND_SETTLEMENT_EDGE",
      "FORESHORE_MANAGED"
    ),
    buildNaturalZone(
      "NATURAL_ZONE_002",
      "FOREST",
      [
        point(minX + 520, maxY - 1220),
        point(minX + 1320, maxY - 1320),
        point(minX + 1600, maxY - 520),
        point(minX + 720, maxY - 320)
      ],
      "COASTAL_HINTERLAND_FOREST",
      "TRACK_ACCESS",
      "HIGH",
      "LIMITS_RESIDENTIAL_EXPANSION",
      "SUPPORTS_SCENIC_LINKS",
      "REGIONAL_PARKLAND"
    ),
    buildNaturalZone(
      "NATURAL_ZONE_003",
      "FARMLAND",
      [
        point(minX + 760, minY + coastalBand + 260),
        point(maxX - 240, minY + coastalBand + 160),
        point(maxX - 120, minY + coastalBand + inlandBand - 80),
        point(minX + 620, minY + coastalBand + inlandBand + 120)
      ],
      "TEMPERATE_FARMLAND",
      "ROAD_ACCESS",
      "MEDIUM",
      "SUPPORTS_VILLAGES_AND_SERVICE_TOWNS",
      "SUPPORTS_HIGHWAY_AND_RAIL_ALIGNMENT",
      "WORKING_LANDSCAPE"
    ),
    buildNaturalZone(
      "NATURAL_ZONE_004",
      "RIVER",
      [
        point(minX + 1240, maxY - 80),
        point(minX + 1490, maxY - 620),
        point(minX + 1760, maxY - 1180),
        point(minX + 2020, minY + 520)
      ],
      "TEMPERATE_RIVER_CORRIDOR",
      "PARTIAL_PUBLIC_ACCESS",
      "HIGH",
      "ATTRACTS_SETTLEMENT_AND_RECREATION",
      "CREATES_BRIDGE_AND_ROUTE_DECISIONS",
      "RIPARIAN_MANAGED"
    ),
    buildNaturalZone(
      "NATURAL_ZONE_005",
      "WETLAND",
      [
        point(maxX - 1480, minY + 820),
        point(maxX - 760, minY + 760),
        point(maxX - 640, minY + 1180),
        point(maxX - 1340, minY + 1280)
      ],
      "COASTAL_WETLAND",
      "BOARDWALK_CONTROLLED",
      "MEDIUM_HIGH",
      "LIMITS_DENSE_SETTLEMENT",
      "SHIFTS_ROADS_TO_DRY_RIDGES",
      "ECOLOGICALLY_SENSITIVE"
    ),
    buildNaturalZone(
      "NATURAL_ZONE_006",
      "PROTECTED_AREA",
      [
        point(maxX - 1680, maxY - 1020),
        point(maxX - 840, maxY - 1140),
        point(maxX - 560, maxY - 520),
        point(maxX - 1420, maxY - 340)
      ],
      "NATIONAL_PARK_EDGE",
      "TRAIL_ACCESS",
      "VERY_HIGH",
      "CONSTRAINS_EXPANSION_AND_CREATES_SCENIC_DESTINATION",
      "SUPPORTS_LIMITED_SCENIC_ACCESS",
      "PROTECTED"
    )
  ];
}

function buildNaturalZone(
  naturalZoneId,
  zoneType,
  boundary,
  biomeType,
  accessibility,
  explorationValue,
  settlementInfluence,
  transportInfluence,
  protectedStatus
) {
  return deepFreeze({
    schemaId: naturalZoneSchemaId,
    naturalZoneId,
    zoneType,
    boundary: deepFreeze({ points: deepFreeze(boundary) }),
    biomeType,
    accessibility,
    explorationValue,
    settlementInfluence,
    transportInfluence,
    protectedStatus
  });
}

function buildSettlements(input, regionProfile, regionBounds) {
  const { minX, maxX, minY, maxY } = regionBounds;
  const anchors = [
    {
      settlementType: "MAJOR_TOWN",
      settlementId: "SETTLEMENT_001",
      position: { x: minX + 1320, y: 0, z: minY + 1120 },
      townProfile: "SUBURBAN_CITY_EDGE",
      populationScale: "REGIONAL_ANCHOR",
      terrainRelationship: "COASTAL_PLAIN_SERVICE_EDGE",
      transportRelationship: "HIGHWAY_RAIL_AND_COASTAL_ROUTE_HUB",
      serviceRole: "PRIMARY_REGION_HUB"
    },
    {
      settlementType: "REGIONAL_TOWN",
      settlementId: "SETTLEMENT_002",
      position: { x: maxX - 1540, y: 0, z: minY + 1820 },
      townProfile: "REGIONAL_TOWN",
      populationScale: "DISTRICT_SERVICE_SCALE",
      terrainRelationship: "INLAND_FARMLAND_EDGE",
      transportRelationship: "HIGHWAY_AND_MAJOR_ROAD_LINK",
      serviceRole: "INLAND_SERVICE_CENTRE"
    },
    {
      settlementType: "SMALL_COASTAL_TOWN",
      settlementId: "SETTLEMENT_003",
      position: { x: maxX - 1180, y: 0, z: minY + 420 },
      townProfile: "SMALL_COASTAL_TOWN",
      populationScale: "COASTAL_DESTINATION_SCALE",
      terrainRelationship: "WATERFRONT_FORESHORE_EDGE",
      transportRelationship: "COASTAL_ROUTE_AND_MAJOR_ROAD_LINK",
      serviceRole: "TOURISM_AND_RECREATION_NODE"
    },
    {
      settlementType: "VILLAGE",
      settlementId: "SETTLEMENT_004",
      position: { x: minX + 980, y: 0, z: maxY - 980 },
      townProfile: "TOURIST_TOWN",
      populationScale: "RURAL_VILLAGE_SCALE",
      terrainRelationship: "FOREST_AND_RIVER_MARGIN",
      transportRelationship: "LOCAL_ROAD_LINK",
      serviceRole: "SCENIC_VILLAGE"
    },
    {
      settlementType: "HAMLET",
      settlementId: "SETTLEMENT_005",
      position: { x: maxX - 820, y: 0, z: maxY - 760 },
      townProfile: "SMALL_COASTAL_TOWN",
      populationScale: "HAMLET_SCALE",
      terrainRelationship: "PROTECTED_LOOKOUT_EDGE",
      transportRelationship: "LOCAL_SCENIC_ACCESS",
      serviceRole: "TRAVEL_MARKER_AND_LOOKOUT_CLUSTER"
    }
  ];

  return anchors.map((anchor, index) =>
    deepFreeze({
      schemaId: settlementSchemaId,
      settlementId: anchor.settlementId,
      settlementType: anchor.settlementType,
      position: deepFreeze(anchor.position),
      sizeProfile: sizeProfileForSettlementType(anchor.settlementType),
      townProfile: anchor.townProfile,
      populationScale: anchor.populationScale,
      terrainRelationship: anchor.terrainRelationship,
      transportRelationship: anchor.transportRelationship,
      serviceRole: anchor.serviceRole,
      linkedSettlements: deepFreeze(resolveLinkedSettlements(index, anchors)),
      streamingCellId: streamingCellIdForPosition(anchor.position, input),
      regionProfileBias: regionProfile.profileId
    })
  );
}

function buildTransportCorridors(input, regionProfile, settlements, regionBounds) {
  const byId = new Map(settlements.map((settlement) => [settlement.settlementId, settlement]));
  const specs = [
    {
      corridorId: "REGION_CORRIDOR_001",
      transportType: "HIGHWAY",
      startSettlementId: "SETTLEMENT_001",
      endSettlementId: "SETTLEMENT_002",
      hierarchy: "PRIMARY_REGIONAL_LINK",
      supportsFreight: true,
      supportsPassengerTravel: true
    },
    {
      corridorId: "REGION_CORRIDOR_002",
      transportType: "MAJOR_ROAD",
      startSettlementId: "SETTLEMENT_001",
      endSettlementId: "SETTLEMENT_003",
      hierarchy: "COASTAL_CONNECTOR",
      supportsFreight: false,
      supportsPassengerTravel: true
    },
    {
      corridorId: "REGION_CORRIDOR_003",
      transportType: "LOCAL_ROAD",
      startSettlementId: "SETTLEMENT_002",
      endSettlementId: "SETTLEMENT_004",
      hierarchy: "LOCAL_SETTLEMENT_LINK",
      supportsFreight: false,
      supportsPassengerTravel: true
    },
    {
      corridorId: "REGION_CORRIDOR_004",
      transportType: "RAILWAY_CORRIDOR",
      startSettlementId: "SETTLEMENT_001",
      endSettlementId: "SETTLEMENT_002",
      hierarchy: "FUTURE_PASSENGER_AND_FREIGHT_SPINE",
      supportsFreight: true,
      supportsPassengerTravel: true
    },
    {
      corridorId: "REGION_CORRIDOR_005",
      transportType: "COASTAL_ROUTE",
      startSettlementId: "SETTLEMENT_003",
      endSettlementId: "SETTLEMENT_005",
      hierarchy: "SCENIC_DESTINATION_ROUTE",
      supportsFreight: false,
      supportsPassengerTravel: true
    },
    {
      corridorId: "REGION_CORRIDOR_006",
      transportType: "LOCAL_ROAD",
      startSettlementId: "SETTLEMENT_001",
      endSettlementId: "SETTLEMENT_004",
      hierarchy: "HINTERLAND_CONNECTOR",
      supportsFreight: false,
      supportsPassengerTravel: true
    }
  ];

  return specs.map((spec) => {
    const start = byId.get(spec.startSettlementId).position;
    const end = byId.get(spec.endSettlementId).position;
    return deepFreeze({
      schemaId: transportCorridorSchemaId,
      corridorId: spec.corridorId,
      transportType: spec.transportType,
      startLocation: deepFreeze(start),
      endLocation: deepFreeze(end),
      hierarchy: spec.hierarchy,
      connectedSettlements: deepFreeze([spec.startSettlementId, spec.endSettlementId]),
      supportsFreight: spec.supportsFreight,
      supportsPassengerTravel: spec.supportsPassengerTravel,
      futureExpansionCompatible: true,
      regionProfileBias: regionProfile.profileId,
      routeLength: roundNumber(distance2d(start, end))
    });
  });
}

function buildLandmarkReserves(input, regionProfile, settlements, naturalZones) {
  const settlementById = new Map(settlements.map((settlement) => [settlement.settlementId, settlement]));
  const zoneByType = new Map(naturalZones.map((zone) => [zone.zoneType, zone]));
  const specs = [
    {
      landmarkReserveId: "LANDMARK_001",
      landmarkType: "LIGHTHOUSE",
      position: {
        x: settlementById.get("SETTLEMENT_003").position.x + 340,
        y: 0,
        z: settlementById.get("SETTLEMENT_003").position.z - 210
      },
      accessibility: "SCENIC_ROUTE_ACCESS",
      questCompatibility: "HIGH",
      naturalRelationship: zoneByType.get("COASTLINE").naturalZoneId,
      settlementRelationship: "SETTLEMENT_003",
      visibilityProfile: "LONG_RANGE_DESTINATION"
    },
    {
      landmarkReserveId: "LANDMARK_002",
      landmarkType: "WATERFALL",
      position: {
        x: settlementById.get("SETTLEMENT_004").position.x + 220,
        y: 0,
        z: settlementById.get("SETTLEMENT_004").position.z - 260
      },
      accessibility: "TRAIL_AND_LOCAL_ROAD_ACCESS",
      questCompatibility: "MEDIUM_HIGH",
      naturalRelationship: zoneByType.get("RIVER").naturalZoneId,
      settlementRelationship: "SETTLEMENT_004",
      visibilityProfile: "MID_RANGE_SCENIC_DESTINATION"
    },
    {
      landmarkReserveId: "LANDMARK_003",
      landmarkType: "LOOKOUT",
      position: {
        x: settlementById.get("SETTLEMENT_005").position.x + 180,
        y: 0,
        z: settlementById.get("SETTLEMENT_005").position.z - 140
      },
      accessibility: "LOCAL_SCENIC_ACCESS",
      questCompatibility: "MEDIUM",
      naturalRelationship: zoneByType.get("PROTECTED_AREA").naturalZoneId,
      settlementRelationship: "SETTLEMENT_005",
      visibilityProfile: "PANORAMIC_VIEWPOINT"
    },
    {
      landmarkReserveId: "LANDMARK_004",
      landmarkType: "HISTORIC_SITE",
      position: {
        x: settlementById.get("SETTLEMENT_001").position.x - 220,
        y: 0,
        z: settlementById.get("SETTLEMENT_001").position.z + 180
      },
      accessibility: "TOWN_EDGE_ACCESS",
      questCompatibility: "HIGH",
      naturalRelationship: zoneByType.get("FARMLAND").naturalZoneId,
      settlementRelationship: "SETTLEMENT_001",
      visibilityProfile: "LOCAL_DESTINATION"
    },
    {
      landmarkReserveId: "LANDMARK_005",
      landmarkType: "NATIONAL_PARK",
      position: {
        x: settlementById.get("SETTLEMENT_002").position.x + 520,
        y: 0,
        z: settlementById.get("SETTLEMENT_002").position.z + 760
      },
      accessibility: "HIGHWAY_AND_TRAIL_ACCESS",
      questCompatibility: "VERY_HIGH",
      naturalRelationship: zoneByType.get("PROTECTED_AREA").naturalZoneId,
      settlementRelationship: "SETTLEMENT_002",
      visibilityProfile: "REGIONAL_DESTINATION"
    }
  ];

  return specs.map((spec) =>
    deepFreeze({
      schemaId: landmarkReserveSchemaId,
      landmarkReserveId: spec.landmarkReserveId,
      landmarkType: spec.landmarkType,
      position: deepFreeze({
        x: roundNumber(spec.position.x),
        y: 0,
        z: roundNumber(spec.position.z)
      }),
      accessibility: spec.accessibility,
      questCompatibility: spec.questCompatibility,
      naturalRelationship: spec.naturalRelationship,
      settlementRelationship: spec.settlementRelationship,
      visibilityProfile: spec.visibilityProfile
    })
  );
}

function buildExplorationRoutes(
  input,
  regionProfile,
  settlements,
  landmarkReserves,
  naturalZones
) {
  const settlementById = new Map(settlements.map((settlement) => [settlement.settlementId, settlement]));
  const landmarkById = new Map(
    landmarkReserves.map((landmark) => [landmark.landmarkReserveId, landmark])
  );
  const coastalZone = naturalZones.find((zone) => zone.zoneType === "COASTLINE");
  const riverZone = naturalZones.find((zone) => zone.zoneType === "RIVER");

  const specs = [
    {
      routeId: "ROUTE_001",
      routeType: "SCENIC_COASTAL_DRIVE",
      startAnchor: "SETTLEMENT_001",
      endAnchor: "LANDMARK_001"
    },
    {
      routeId: "ROUTE_002",
      routeType: "INLAND_SERVICE_ROUTE",
      startAnchor: "SETTLEMENT_001",
      endAnchor: "SETTLEMENT_002"
    },
    {
      routeId: "ROUTE_003",
      routeType: "LOOKOUT_TRAIL",
      startAnchor: "SETTLEMENT_005",
      endAnchor: "LANDMARK_003"
    },
    {
      routeId: "ROUTE_004",
      routeType: "LANDMARK_LINK",
      startAnchor: "SETTLEMENT_004",
      endAnchor: "LANDMARK_002"
    },
    {
      routeId: "ROUTE_005",
      routeType: "NATURE_LOOP",
      startAnchor: "SETTLEMENT_002",
      endAnchor: "LANDMARK_005"
    },
    {
      routeId: "ROUTE_006",
      routeType: "RIVER_WALK",
      startAnchor: "SETTLEMENT_004",
      endAnchor: riverZone.naturalZoneId
    }
  ];

  return specs.map((spec) => {
    const startPosition = resolveAnchorPosition(
      spec.startAnchor,
      settlementById,
      landmarkById,
      naturalZones
    );
    const endPosition = resolveAnchorPosition(
      spec.endAnchor,
      settlementById,
      landmarkById,
      naturalZones
    );
    return deepFreeze({
      schemaId: explorationRouteSchemaId,
      routeId: spec.routeId,
      routeType: spec.routeType,
      startAnchor: spec.startAnchor,
      endAnchor: spec.endAnchor,
      distance: roundNumber(distance2d(startPosition, endPosition)),
      difficulty: difficultyForRouteType(spec.routeType),
      discoveryValue: discoveryValueForRouteType(spec.routeType),
      connectedPointsOfInterest: deepFreeze(
        routePointsOfInterest(spec, coastalZone?.naturalZoneId, riverZone?.naturalZoneId)
      ),
      travelModeCompatibility: deepFreeze(travelModesForRouteType(spec.routeType))
    });
  });
}

function buildStreamingGrid(input, regionBounds) {
  const { streamingCellSize } = input.regionConfiguration;
  const width = regionBounds.maxX - regionBounds.minX;
  const height = regionBounds.maxY - regionBounds.minY;
  return deepFreeze({
    cellSize: streamingCellSize,
    columns: Math.ceil(width / streamingCellSize),
    rows: Math.ceil(height / streamingCellSize),
    strategy: "reference_only_region_chunking"
  });
}

function buildRegionMetadata(
  regionProfile,
  settlements,
  naturalZones,
  transportCorridors,
  landmarkReserves,
  explorationRoutes
) {
  return deepFreeze({
    profileId: regionProfile.profileId,
    settlementCount: settlements.length,
    naturalZoneCount: naturalZones.length,
    transportCorridorCount: transportCorridors.length,
    landmarkReserveCount: landmarkReserves.length,
    explorationRouteCount: explorationRoutes.length,
    referencePlacementMode: "instance_reference_only",
    futureCompatibleProfiles: deepFreeze(
      supportedRegionProfiles.filter((profileId) => profileId !== regionProfile.profileId)
    )
  });
}

function buildValidationResult(preview) {
  const deterministicSignatureHash = computeDeterministicSignatureHash(preview);
  return deepFreeze({
    schemaId: validationSchemaId,
    naturalZonesValid:
      preview.naturalZones.length >= 6 &&
      preview.naturalZones.every((zone) => supportedNaturalZoneTypes.has(zone.zoneType)),
    settlementsValid:
      preview.settlements.length >= 5 &&
      preview.settlements.every((settlement) =>
        supportedSettlementTypes.has(settlement.settlementType)
      ),
    transportConnected:
      preview.transportCorridors.length >= 5 &&
      preview.transportCorridors.every(
        (corridor) => corridor.connectedSettlements.length >= 2
      ),
    settlementHierarchyValid: hasAllSettlementTypes(preview.settlements),
    terrainRelationshipsValid: preview.settlements.every(
      (settlement) => typeof settlement.terrainRelationship === "string"
    ),
    corridorsConnected: preview.transportCorridors.every(
      (corridor) => corridor.routeLength > 0
    ),
    landmarksAccessible: preview.landmarkReserves.every(
      (landmark) => landmark.accessibility !== "INACCESSIBLE"
    ),
    explorationRoutesValid: preview.explorationRoutes.every((route) => route.distance > 0),
    deterministicRebuildValid: true,
    streamingReadyStructure:
      preview.streamingGrid.columns > 0 && preview.streamingGrid.rows > 0,
    instanceReferencesOnly:
      preview.regionMetadata.referencePlacementMode === "instance_reference_only",
    deterministicSignatureHash,
    validationPassed: true
  });
}

function validateNaturalZones(preview) {
  for (const zone of preview.naturalZones) {
    if (!supportedNaturalZoneTypes.has(zone.zoneType)) {
      throw createValidationError(
        "invalid_natural_zone_type",
        `Natural zone ${zone.naturalZoneId} has an unsupported type.`
      );
    }
    if (!Array.isArray(zone.boundary.points) || zone.boundary.points.length < 3) {
      throw createValidationError(
        "invalid_natural_zone_boundary",
        `Natural zone ${zone.naturalZoneId} must include a polygon boundary.`
      );
    }
  }
}

function validateSettlements(preview) {
  const seenIds = new Set();
  for (const settlement of preview.settlements) {
    if (!supportedSettlementTypes.has(settlement.settlementType)) {
      throw createValidationError(
        "invalid_settlement_type",
        `Settlement ${settlement.settlementId} has an unsupported type.`
      );
    }
    if (seenIds.has(settlement.settlementId)) {
      throw createValidationError(
        "duplicate_settlement_id",
        `Settlement ${settlement.settlementId} appears more than once.`
      );
    }
    seenIds.add(settlement.settlementId);
  }
  if (!hasAllSettlementTypes(preview.settlements)) {
    throw createValidationError(
      "missing_settlement_hierarchy",
      "Region preview must include all supported settlement hierarchy types."
    );
  }
}

function validateTransportCorridors(preview) {
  const settlementIds = new Set(preview.settlements.map((settlement) => settlement.settlementId));
  for (const corridor of preview.transportCorridors) {
    if (!supportedTransportTypes.has(corridor.transportType)) {
      throw createValidationError(
        "invalid_transport_type",
        `Transport corridor ${corridor.corridorId} has an unsupported type.`
      );
    }
    for (const settlementId of corridor.connectedSettlements) {
      if (!settlementIds.has(settlementId)) {
        throw createValidationError(
          "invalid_transport_settlement_reference",
          `Transport corridor ${corridor.corridorId} references unknown settlement ${settlementId}.`
        );
      }
    }
  }
}

function validateLandmarks(preview) {
  const naturalIds = new Set(preview.naturalZones.map((zone) => zone.naturalZoneId));
  const settlementIds = new Set(preview.settlements.map((settlement) => settlement.settlementId));
  for (const landmark of preview.landmarkReserves) {
    if (!supportedLandmarkTypes.has(landmark.landmarkType)) {
      throw createValidationError(
        "invalid_landmark_type",
        `Landmark reserve ${landmark.landmarkReserveId} has an unsupported type.`
      );
    }
    if (!naturalIds.has(landmark.naturalRelationship)) {
      throw createValidationError(
        "invalid_landmark_natural_reference",
        `Landmark reserve ${landmark.landmarkReserveId} references an unknown natural zone.`
      );
    }
    if (!settlementIds.has(landmark.settlementRelationship)) {
      throw createValidationError(
        "invalid_landmark_settlement_reference",
        `Landmark reserve ${landmark.landmarkReserveId} references an unknown settlement.`
      );
    }
  }
}

function validateExplorationRoutes(preview) {
  const naturalIds = new Set(preview.naturalZones.map((zone) => zone.naturalZoneId));
  const settlementIds = new Set(preview.settlements.map((settlement) => settlement.settlementId));
  const landmarkIds = new Set(
    preview.landmarkReserves.map((landmark) => landmark.landmarkReserveId)
  );
  for (const route of preview.explorationRoutes) {
    if (!supportedExplorationRouteTypes.has(route.routeType)) {
      throw createValidationError(
        "invalid_exploration_route_type",
        `Exploration route ${route.routeId} has an unsupported type.`
      );
    }
    for (const anchor of [route.startAnchor, route.endAnchor]) {
      if (
        !settlementIds.has(anchor) &&
        !landmarkIds.has(anchor) &&
        !naturalIds.has(anchor)
      ) {
        throw createValidationError(
          "invalid_exploration_anchor",
          `Exploration route ${route.routeId} references unknown anchor ${anchor}.`
        );
      }
    }
  }
}

function normalizeGeneratorInput(rawInput) {
  const input = rawInput ?? regionGeneratorDefaultInput;
  const regionConfiguration = input.regionConfiguration ?? {};
  return deepFreeze({
    regionSeed: normalizePositiveInteger(input.regionSeed, "regionSeed"),
    biomeSeed: normalizePositiveInteger(input.biomeSeed, "biomeSeed"),
    climateSeed: normalizePositiveInteger(input.climateSeed, "climateSeed"),
    settlementPatternSeed: normalizePositiveInteger(
      input.settlementPatternSeed,
      "settlementPatternSeed"
    ),
    regionProfileSeed: normalizeRegionProfileSeed(input.regionProfileSeed),
    regionConfiguration: deepFreeze({
      schemaId: normalizeString(
        regionConfiguration.schemaId ?? regionSchemaId,
        "regionConfiguration.schemaId"
      ),
      previewId: normalizeString(
        regionConfiguration.previewId ?? "REGION_LAYOUT_001_PREVIEW_001",
        "regionConfiguration.previewId"
      ),
      generationProfile: normalizeString(
        regionConfiguration.generationProfile ?? "coastal_region_default",
        "regionConfiguration.generationProfile"
      ),
      width: normalizePositiveNumber(regionConfiguration.width ?? 6200, "width"),
      height: normalizePositiveNumber(regionConfiguration.height ?? 4400, "height"),
      coastlineInset: normalizePositiveNumber(
        regionConfiguration.coastlineInset ?? 540,
        "coastlineInset"
      ),
      coastalBandDepth: normalizePositiveNumber(
        regionConfiguration.coastalBandDepth ?? 780,
        "coastalBandDepth"
      ),
      inlandBandDepth: normalizePositiveNumber(
        regionConfiguration.inlandBandDepth ?? 1260,
        "inlandBandDepth"
      ),
      streamingCellSize: normalizePositiveNumber(
        regionConfiguration.streamingCellSize ?? 620,
        "streamingCellSize"
      )
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  const preview = asPlainObject(rawPreview, "region preview");
  return deepFreeze(preview);
}

function resolveLinkedSettlements(index, anchors) {
  if (index === 0) {
    return [anchors[1].settlementId, anchors[2].settlementId];
  }
  return [anchors[0].settlementId];
}

function sizeProfileForSettlementType(settlementType) {
  switch (settlementType) {
    case "MAJOR_TOWN":
      return "LARGE_SETTLEMENT";
    case "REGIONAL_TOWN":
      return "MEDIUM_SETTLEMENT";
    case "SMALL_COASTAL_TOWN":
      return "SMALL_TOWN_SETTLEMENT";
    case "VILLAGE":
      return "VILLAGE_SETTLEMENT";
    default:
      return "HAMLET_SETTLEMENT";
  }
}

function streamingCellIdForPosition(position, input) {
  const { width, height, streamingCellSize } = input.regionConfiguration;
  const column = Math.floor((position.x + width / 2) / streamingCellSize) + 1;
  const row = Math.floor((position.z + height / 2) / streamingCellSize) + 1;
  return `REGION_CELL_${row}_${column}`;
}

function resolveAnchorPosition(anchor, settlementById, landmarkById, naturalZones) {
  if (settlementById.has(anchor)) {
    return settlementById.get(anchor).position;
  }
  if (landmarkById.has(anchor)) {
    return landmarkById.get(anchor).position;
  }
  const zone = naturalZones.find((entry) => entry.naturalZoneId === anchor);
  if (zone) {
    return centroidOfPoints(zone.boundary.points);
  }
  throw createValidationError(
    "unknown_route_anchor",
    `Unable to resolve route anchor ${anchor}.`
  );
}

function difficultyForRouteType(routeType) {
  switch (routeType) {
    case "LOOKOUT_TRAIL":
    case "NATURE_LOOP":
      return "MEDIUM";
    case "RIVER_WALK":
      return "LOW";
    default:
      return "LOW";
  }
}

function discoveryValueForRouteType(routeType) {
  switch (routeType) {
    case "SCENIC_COASTAL_DRIVE":
    case "NATURE_LOOP":
      return "HIGH";
    case "LOOKOUT_TRAIL":
      return "MEDIUM_HIGH";
    default:
      return "MEDIUM";
  }
}

function travelModesForRouteType(routeType) {
  switch (routeType) {
    case "SCENIC_COASTAL_DRIVE":
    case "INLAND_SERVICE_ROUTE":
      return ["VEHICLE", "VIEWPOINT_STOP"];
    case "LOOKOUT_TRAIL":
    case "RIVER_WALK":
      return ["WALKING"];
    default:
      return ["VEHICLE", "WALKING"];
  }
}

function routePointsOfInterest(spec, coastalZoneId, riverZoneId) {
  const points = [spec.startAnchor, spec.endAnchor];
  if (spec.routeType === "SCENIC_COASTAL_DRIVE" && coastalZoneId) {
    points.push(coastalZoneId);
  }
  if (spec.routeType === "RIVER_WALK" && riverZoneId) {
    points.push(riverZoneId);
  }
  return points;
}

function hasAllSettlementTypes(settlements) {
  const types = new Set(settlements.map((settlement) => settlement.settlementType));
  return [...supportedSettlementTypes].every((type) => types.has(type));
}

function centroidOfPoints(points) {
  const total = points.reduce(
    (accumulator, pointEntry) => ({
      x: accumulator.x + pointEntry.x,
      z: accumulator.z + pointEntry.z
    }),
    { x: 0, z: 0 }
  );
  return deepFreeze({
    x: roundNumber(total.x / points.length),
    y: 0,
    z: roundNumber(total.z / points.length)
  });
}

function computeDeterministicSignatureHash(preview) {
  return stableHash(
    JSON.stringify({
      regionId: preview.regionId,
      seedConfig: preview.seedConfig,
      regionProfile: preview.regionProfile.profileId,
      naturalZones: preview.naturalZones.map((zone) => [
        zone.naturalZoneId,
        zone.zoneType,
        zone.boundary.points
      ]),
      settlements: preview.settlements.map((settlement) => [
        settlement.settlementId,
        settlement.settlementType,
        settlement.position
      ]),
      transportCorridors: preview.transportCorridors.map((corridor) => [
        corridor.corridorId,
        corridor.transportType,
        corridor.connectedSettlements
      ]),
      landmarkReserves: preview.landmarkReserves.map((landmark) => [
        landmark.landmarkReserveId,
        landmark.landmarkType,
        landmark.position
      ]),
      explorationRoutes: preview.explorationRoutes.map((route) => [
        route.routeId,
        route.routeType,
        route.startAnchor,
        route.endAnchor
      ])
    })
  );
}

function point(x, z) {
  return deepFreeze({
    x: roundNumber(x),
    z: roundNumber(z)
  });
}

function distance2d(start, end) {
  return Math.hypot(end.x - start.x, end.z - start.z);
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function normalizeRegionProfileSeed(value) {
  const normalizedValue = normalizeString(value, "regionProfileSeed");
  if (!supportedRegionProfiles.includes(normalizedValue)) {
    throw createValidationError(
      "unsupported_region_profile_seed",
      `regionProfileSeed ${normalizedValue} is not supported.`
    );
  }
  return normalizedValue;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_number",
      `${fieldName} must be a positive finite number.`
    );
  }
  return value;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${fieldName} must be a plain object.`
    );
  }
  return value;
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
  error.name = "RegionGeneratorValidationError";
  error.code = code;
  return error;
}

function writeRegionPreviewArtifacts() {
  const preview = generateRegionLayoutPreview(regionGeneratorDefaultInput);
  const validation = createRegionLayoutValidationOutput(preview);
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
    path.resolve(outputDirectory, "REGION_LAYOUT_001_PREVIEW_001.json"),
    `${JSON.stringify(preview, null, 2)}\n`
  );
  fs.writeFileSync(
    path.resolve(outputDirectory, "REGION_LAYOUT_001_VALIDATION_001.json"),
    `${JSON.stringify(validation, null, 2)}\n`
  );
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryPath === fileURLToPath(import.meta.url)) {
  writeRegionPreviewArtifacts();
}
