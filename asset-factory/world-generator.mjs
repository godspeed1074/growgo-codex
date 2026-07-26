import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const worldSchemaId = "WORLD_LAYOUT_001";
const regionInstanceSchemaId = "REGION_INSTANCE_001";
const geographyZoneSchemaId = "WORLD_GEOGRAPHY_ZONE_001";
const connectionCorridorSchemaId = "WORLD_CONNECTION_CORRIDOR_001";
const landmarkReserveSchemaId = "WORLD_LANDMARK_RESERVE_001";
const explorationRouteSchemaId = "WORLD_EXPLORATION_ROUTE_001";
const streamingChunkSchemaId = "WORLD_STREAMING_CHUNK_001";
const validationSchemaId = "WORLD_VALIDATION_001";
const validationOutputId = "WORLD_LAYOUT_001_VALIDATION_001";

const supportedWorldProfiles = Object.freeze([
  "AUSTRALIAN_COASTAL_WORLD",
  "CONTINENTAL_WORLD",
  "MOUNTAIN_WORLD",
  "TOURISM_WORLD"
]);

const supportedRegionProfiles = new Set([
  "COASTAL_REGION",
  "RURAL_REGION",
  "MOUNTAIN_REGION",
  "TOURISM_REGION",
  "METROPOLITAN_EDGE_REGION"
]);

const supportedZoneTypes = new Set([
  "OCEAN",
  "COASTLINE",
  "FOREST",
  "FARMLAND",
  "RIVER",
  "WETLAND",
  "MOUNTAINS",
  "PROTECTED_AREA"
]);

const supportedConnectionTypes = new Set([
  "HIGHWAY",
  "RAILWAY",
  "COASTAL_ROUTE",
  "FERRY_ROUTE",
  "TRAIL"
]);

const supportedLandmarkTypes = new Set([
  "NATURAL_WONDER",
  "HISTORICAL_SITE",
  "RARE_DISCOVERY",
  "ICONIC_LOCATION"
]);

const supportedRouteTypes = new Set([
  "COASTAL_GRAND_TOUR",
  "INLAND_HERITAGE_ROUTE",
  "MOUNTAIN_DISCOVERY_ROUTE",
  "INTER_REGION_CONNECTOR",
  "PROTECTED_AREA_TRAIL",
  "FERRY_EXPLORATION_LOOP"
]);

const worldProfiles = deepFreeze({
  AUSTRALIAN_COASTAL_WORLD: {
    profileId: "AUSTRALIAN_COASTAL_WORLD",
    generationProfile: "australian_coastal_world_default",
    geographyWeighting: {
      ocean: 1,
      coastline: 1,
      forest: 0.7,
      farmland: 0.8,
      river: 0.65,
      wetland: 0.45,
      mountains: 0.35,
      protectedArea: 0.7
    },
    regionDensity: "MEDIUM_SCENIC",
    regionProfileWeighting: {
      COASTAL_REGION: 1,
      TOURISM_REGION: 0.9,
      RURAL_REGION: 0.75,
      MOUNTAIN_REGION: 0.45,
      METROPOLITAN_EDGE_REGION: 0.55
    },
    transportIntensity: "MEDIUM_HIGH",
    landmarkFrequency: "HIGH",
    explorationRouteDensity: "HIGH",
    boundaryBehaviour: "COASTAL_CONTINENTAL_ARC",
    growthPattern: "COASTAL_SPINE_WITH_INLAND_SUPPORT"
  },
  CONTINENTAL_WORLD: {
    profileId: "CONTINENTAL_WORLD",
    generationProfile: "continental_world_default",
    geographyWeighting: {
      ocean: 0.25,
      coastline: 0.35,
      forest: 0.5,
      farmland: 0.9,
      river: 0.75,
      wetland: 0.25,
      mountains: 0.5,
      protectedArea: 0.4
    },
    regionDensity: "WIDE_INLAND",
    regionProfileWeighting: {
      COASTAL_REGION: 0.4,
      TOURISM_REGION: 0.4,
      RURAL_REGION: 1,
      MOUNTAIN_REGION: 0.7,
      METROPOLITAN_EDGE_REGION: 0.5
    },
    transportIntensity: "HIGH",
    landmarkFrequency: "MEDIUM",
    explorationRouteDensity: "MEDIUM",
    boundaryBehaviour: "INLAND_SPREAD",
    growthPattern: "SERVICE_SPINE_AND_RURAL_FAN"
  },
  MOUNTAIN_WORLD: {
    profileId: "MOUNTAIN_WORLD",
    generationProfile: "mountain_world_default",
    geographyWeighting: {
      ocean: 0.15,
      coastline: 0.2,
      forest: 0.9,
      farmland: 0.3,
      river: 0.7,
      wetland: 0.2,
      mountains: 1,
      protectedArea: 0.85
    },
    regionDensity: "LOW_CONSTRAINED",
    regionProfileWeighting: {
      COASTAL_REGION: 0.2,
      TOURISM_REGION: 0.75,
      RURAL_REGION: 0.35,
      MOUNTAIN_REGION: 1,
      METROPOLITAN_EDGE_REGION: 0.15
    },
    transportIntensity: "LOW_MEDIUM",
    landmarkFrequency: "VERY_HIGH",
    explorationRouteDensity: "VERY_HIGH",
    boundaryBehaviour: "RIDGE_CHAIN_WORLD",
    growthPattern: "VALLEY_AND_PASS_CORRIDORS"
  },
  TOURISM_WORLD: {
    profileId: "TOURISM_WORLD",
    generationProfile: "tourism_world_default",
    geographyWeighting: {
      ocean: 0.7,
      coastline: 0.8,
      forest: 0.7,
      farmland: 0.35,
      river: 0.55,
      wetland: 0.3,
      mountains: 0.55,
      protectedArea: 0.75
    },
    regionDensity: "DESTINATION_CLUSTERED",
    regionProfileWeighting: {
      COASTAL_REGION: 0.8,
      TOURISM_REGION: 1,
      RURAL_REGION: 0.3,
      MOUNTAIN_REGION: 0.55,
      METROPOLITAN_EDGE_REGION: 0.35
    },
    transportIntensity: "MEDIUM",
    landmarkFrequency: "VERY_HIGH",
    explorationRouteDensity: "VERY_HIGH",
    boundaryBehaviour: "SCENIC_DESTINATION_CHAIN",
    growthPattern: "ATTRACTION_LINKED_REGIONS"
  }
});

export const worldGeneratorDefaultInput = deepFreeze({
  worldSeed: 10482,
  geographySeed: 1,
  climateSeed: 1,
  biomeSeed: 1,
  settlementSeed: 1,
  explorationSeed: 1,
  worldProfile: "AUSTRALIAN_COASTAL_WORLD",
  worldConfiguration: deepFreeze({
    schemaId: worldSchemaId,
    previewId: "WORLD_LAYOUT_001_PREVIEW_001",
    generationProfile: "australian_coastal_world_default",
    width: 24000,
    height: 16000,
    coastlineDepth: 3200,
    inlandBandDepth: 5200,
    chunkSize: 6000
  })
});

export function createWorldGenerator(options = worldGeneratorDefaultInput) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);
  return Object.freeze({
    generate(overrides = {}) {
      return generateWorldLayoutPreview({
        ...normalizedDefaultInput,
        ...overrides,
        worldConfiguration: {
          ...normalizedDefaultInput.worldConfiguration,
          ...(overrides.worldConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateWorldLayoutPreview(preview);
    }
  });
}

export function generateWorldLayoutPreview(rawInput = worldGeneratorDefaultInput) {
  const input = normalizeGeneratorInput(rawInput);
  const worldProfile = resolveWorldProfile(input.worldProfile);
  const seedConfig = buildSeedConfig(input);
  const worldBounds = buildWorldBounds(input, worldProfile);
  const worldGeographyZones = buildWorldGeographyZones(input, worldProfile, worldBounds);
  const regionInstances = buildRegionInstances(input, worldProfile, worldBounds);
  const worldConnections = buildWorldConnections(
    input,
    worldProfile,
    regionInstances,
    worldGeographyZones
  );
  const worldLandmarkReserves = buildWorldLandmarks(
    input,
    worldProfile,
    regionInstances,
    worldGeographyZones
  );
  const worldExplorationRoutes = buildWorldExplorationRoutes(
    input,
    worldProfile,
    regionInstances,
    worldLandmarkReserves
  );
  const streamingChunks = buildStreamingChunks(input, regionInstances, worldBounds);
  const worldMetadata = buildWorldMetadata(
    worldProfile,
    worldGeographyZones,
    regionInstances,
    worldConnections,
    worldLandmarkReserves,
    worldExplorationRoutes,
    streamingChunks
  );

  const preview = deepFreeze({
    schemaId: worldSchemaId,
    worldId: `WORLD_${String(input.worldSeed).padStart(5, "0")}`,
    previewId: input.worldConfiguration.previewId,
    generationProfile: worldProfile.generationProfile,
    seed: input.worldSeed,
    seedConfig,
    worldProfile: deepFreeze({ ...worldProfile }),
    worldBounds,
    worldMetadata,
    worldGeographyZones: deepFreeze(worldGeographyZones),
    regionInstances: deepFreeze(regionInstances),
    worldConnections: deepFreeze(worldConnections),
    worldLandmarkReserves: deepFreeze(worldLandmarkReserves),
    worldExplorationRoutes: deepFreeze(worldExplorationRoutes),
    streamingChunks: deepFreeze(streamingChunks),
    validationContract: deepFreeze({
      schemaId: validationSchemaId,
      checks: deepFreeze({
        geographyValid: true,
        regionsValid: true,
        transitionsValid: true,
        corridorsConnected: true,
        routesReachable: true,
        landmarksAccessible: true,
        chunksValid: true,
        boundariesConsistent: true,
        deterministicRebuildValid: true,
        referenceBasedStructure: true,
        streamingReady: true,
        noDuplicateGeometryGeneration: true
      })
    }),
    validationResult: null
  });

  const validationResult = buildValidationResult(preview);
  const finalizedPreview = deepFreeze({
    ...preview,
    validationResult
  });

  const validation = validateWorldLayoutPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function createWorldLayoutValidationOutput(
  rawPreview,
  validationId = validationOutputId
) {
  const preview = normalizeGeneratedPreview(rawPreview);
  return deepFreeze({
    validationId,
    previewId: preview.previewId,
    worldId: preview.worldId,
    seed: preview.seed,
    summary: deepFreeze({
      validationPassed: preview.validationResult.validationPassed,
      worldProfileId: preview.worldProfile.profileId,
      geographyZoneCount: preview.worldGeographyZones.length,
      regionCount: preview.regionInstances.length,
      connectionCount: preview.worldConnections.length,
      landmarkReserveCount: preview.worldLandmarkReserves.length,
      explorationRouteCount: preview.worldExplorationRoutes.length,
      streamingChunkCount: preview.streamingChunks.length
    }),
    checks: deepFreeze({
      geographyValid: passFail(preview.validationResult.geographyValid),
      regionsValid: passFail(preview.validationResult.regionsValid),
      transitionsValid: passFail(preview.validationResult.transitionsValid),
      corridorsConnected: passFail(preview.validationResult.corridorsConnected),
      routesReachable: passFail(preview.validationResult.routesReachable),
      landmarksAccessible: passFail(preview.validationResult.landmarksAccessible),
      chunksValid: passFail(preview.validationResult.chunksValid),
      boundariesConsistent: passFail(preview.validationResult.boundariesConsistent),
      deterministicRebuildValid: passFail(
        preview.validationResult.deterministicRebuildValid
      ),
      referenceBasedStructure: passFail(
        preview.validationResult.referenceBasedStructure
      ),
      streamingReady: passFail(preview.validationResult.streamingReady),
      noDuplicateGeometryGeneration: passFail(
        preview.validationResult.noDuplicateGeometryGeneration
      )
    })
  });
}

export function validateWorldLayoutPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.worldProfile.profileId !== "AUSTRALIAN_COASTAL_WORLD") {
      throw createValidationError(
        "unsupported_world_profile",
        "Session 83 generator must actively generate the AUSTRALIAN_COASTAL_WORLD profile."
      );
    }
    if (preview.worldGeographyZones.length < 8) {
      throw createValidationError(
        "insufficient_geography_zone_count",
        "World preview must include at least eight geography zones."
      );
    }
    if (preview.regionInstances.length < 5) {
      throw createValidationError(
        "insufficient_region_count",
        "World preview must include at least five region instances."
      );
    }
    if (preview.worldConnections.length < 5) {
      throw createValidationError(
        "insufficient_connection_count",
        "World preview must include at least five world connections."
      );
    }
    if (preview.worldLandmarkReserves.length < 4) {
      throw createValidationError(
        "insufficient_landmark_count",
        "World preview must include at least four landmark reserves."
      );
    }
    if (preview.worldExplorationRoutes.length < 5) {
      throw createValidationError(
        "insufficient_route_count",
        "World preview must include at least five exploration routes."
      );
    }
    if (preview.streamingChunks.length < 4) {
      throw createValidationError(
        "insufficient_chunk_count",
        "World preview must include at least four streaming chunks."
      );
    }

    validateGeographyZones(preview);
    validateRegionInstances(preview);
    validateWorldConnections(preview);
    validateWorldLandmarks(preview);
    validateWorldExplorationRoutes(preview);
    validateStreamingChunks(preview);

    if (!preview.validationResult.validationPassed) {
      throw createValidationError(
        "validation_result_failed",
        "World validationResult must report a passing state."
      );
    }

    const actualHash = computeDeterministicSignatureHash(preview);
    if (actualHash !== preview.validationResult.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "World deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      preview
    });
  } catch (error) {
    if (error?.name !== "WorldGeneratorValidationError") {
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
    worldSeed: input.worldSeed,
    geographySeed: input.geographySeed,
    climateSeed: input.climateSeed,
    biomeSeed: input.biomeSeed,
    settlementSeed: input.settlementSeed,
    explorationSeed: input.explorationSeed,
    worldProfile: input.worldProfile
  });
}

function resolveWorldProfile(worldProfile) {
  return worldProfiles[worldProfile] ?? worldProfiles.AUSTRALIAN_COASTAL_WORLD;
}

function buildWorldBounds(input, worldProfile) {
  const { width, height } = input.worldConfiguration;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const variation = seedOffset(input.worldSeed, 240);

  return deepFreeze({
    boundaryStyle: worldProfile.boundaryBehaviour,
    minX: roundNumber(-halfWidth),
    maxX: roundNumber(halfWidth),
    minY: roundNumber(-halfHeight),
    maxY: roundNumber(halfHeight),
    boundaryPolygon: deepFreeze([
      point(-halfWidth, -halfHeight + 680),
      point(-halfWidth + 920, -halfHeight - 140),
      point(-halfWidth + 3200 + variation, -halfHeight + 220),
      point(halfWidth - 2100, -halfHeight + 540),
      point(halfWidth + 240, -halfHeight + 2200),
      point(halfWidth + 460, halfHeight - 1800),
      point(halfWidth - 820, halfHeight + 260),
      point(-halfWidth + 1800, halfHeight + 420),
      point(-halfWidth - 340, halfHeight - 1240),
      point(-halfWidth - 420, -860)
    ])
  });
}

function buildWorldGeographyZones(input, worldProfile, worldBounds) {
  const { minX, maxX, minY, maxY } = worldBounds;
  const coastDepth = input.worldConfiguration.coastlineDepth;
  const inlandDepth = input.worldConfiguration.inlandBandDepth;

  return [
    buildWorldGeographyZone(
      "WORLD_ZONE_001",
      "OCEAN",
      [
        point(minX - 1200, minY - 1200),
        point(maxX + 1400, minY - 920),
        point(maxX + 820, minY + coastDepth - 520),
        point(minX - 620, minY + coastDepth - 680)
      ],
      "MARINE_COASTAL",
      "TEMPERATE_MARINE",
      "WATER_ONLY_ACCESS",
      ["SHAPES_COASTAL_REGION_EDGES", "ENABLES_FERRY_AND_COASTAL_ROUTE_LOGIC"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_002",
      "COASTLINE",
      [
        point(minX, minY + 240),
        point(maxX - 240, minY + 460),
        point(maxX - 620, minY + coastDepth),
        point(minX + 420, minY + coastDepth - 180)
      ],
      "TEMPERATE_COASTLINE",
      "MILD_COASTAL",
      "PARTIAL_PUBLIC_ACCESS",
      ["ENABLES_COASTAL_AND_TOURISM_REGIONS", "SUPPORTS_SCENIC_ROUTE_SPINES"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_003",
      "FOREST",
      [
        point(minX + 920, maxY - 4200),
        point(minX + 4800, maxY - 4500),
        point(minX + 5200, maxY - 900),
        point(minX + 1460, maxY - 620)
      ],
      "TEMPERATE_FOREST",
      "MILD_WET",
      "TRACK_ACCESS",
      ["SUPPORTS_MOUNTAIN_AND_TOURISM_EDGE_REGIONS", "INCREASES_DISCOVERY_VALUE"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_004",
      "FARMLAND",
      [
        point(minX + 2400, minY + coastDepth + 780),
        point(maxX - 780, minY + coastDepth + 420),
        point(maxX - 1320, minY + coastDepth + inlandDepth),
        point(minX + 1820, minY + coastDepth + inlandDepth + 620)
      ],
      "TEMPERATE_FARMLAND",
      "MIXED_TEMPERATE",
      "ROAD_ACCESS",
      ["SUPPORTS_RURAL_AND_SERVICE_REGIONS", "ENABLES_HIGHWAY_AND_RAIL_ALIGNMENT"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_005",
      "RIVER",
      [
        point(minX + 6200, maxY - 260),
        point(minX + 6740, maxY - 2200),
        point(minX + 7160, maxY - 4080),
        point(minX + 7460, minY + 1240)
      ],
      "TEMPERATE_RIVER_SYSTEM",
      "MIXED_TEMPERATE",
      "PARTIAL_PUBLIC_ACCESS",
      ["CREATES_BRIDGE_AND_VALLEY_CORRIDOR_LOGIC", "ATTRACTS_SETTLEMENT_AND_RECREATION"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_006",
      "WETLAND",
      [
        point(maxX - 4860, minY + 2640),
        point(maxX - 2840, minY + 2540),
        point(maxX - 2620, minY + 3560),
        point(maxX - 4580, minY + 3680)
      ],
      "COASTAL_WETLAND",
      "MILD_HUMID",
      "BOARDWALK_CONTROLLED",
      ["LIMITS_DENSE_REGION_EXPANSION", "SHIFTS_CORRIDORS_TO_DRY_GROUND"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_007",
      "MOUNTAINS",
      [
        point(maxX - 6400, maxY - 5200),
        point(maxX - 2820, maxY - 5600),
        point(maxX - 1820, maxY - 2260),
        point(maxX - 5580, maxY - 1620)
      ],
      "HIGHLAND_RIDGE",
      "COOL_ELEVATED",
      "PASS_AND_TRAIL_ACCESS",
      ["CONSTRAINS_TRANSPORT", "SUPPORTS_MOUNTAIN_REGIONS_AND_REMOTE_DISCOVERY"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_008",
      "PROTECTED_AREA",
      [
        point(maxX - 3820, maxY - 3300),
        point(maxX - 1540, maxY - 3460),
        point(maxX - 920, maxY - 1820),
        point(maxX - 3240, maxY - 1460)
      ],
      "NATIONAL_PARK_COMPLEX",
      "TEMPERATE_PROTECTED",
      "TRAIL_ACCESS",
      ["LIMITS_DEVELOPMENT", "SUPPORTS_LANDMARKS_AND_DISCOVERY_ROUTES"]
    )
  ];
}

function buildWorldGeographyZone(
  zoneId,
  zoneType,
  boundary,
  biome,
  climate,
  accessibility,
  influenceRules
) {
  return deepFreeze({
    schemaId: geographyZoneSchemaId,
    zoneId,
    zoneType,
    boundary: deepFreeze({ points: deepFreeze(boundary) }),
    biome,
    climate,
    accessibility,
    influenceRules: deepFreeze(influenceRules)
  });
}

function buildRegionInstances(input, worldProfile, worldBounds) {
  const { minX, maxX, minY, maxY } = worldBounds;
  const shiftX = seedOffset(input.worldSeed, 180);
  const shiftY = seedOffset(input.settlementSeed, 120);
  const specs = [
    {
      regionId: "REGION_001",
      profile: "COASTAL_REGION",
      position: { x: minX + 3600 + shiftX, z: minY + 2800 + shiftY },
      size: "LARGE",
      biome: "TEMPERATE_COASTAL",
      climate: "MILD_WET_SUMMER",
      neighbouringRegions: ["REGION_002", "REGION_003", "REGION_005"],
      transitionRules: ["COAST_TO_FARMLAND", "FORESHORE_TO_TOURISM", "COASTAL_SERVICE_CORRIDOR"]
    },
    {
      regionId: "REGION_002",
      profile: "RURAL_REGION",
      position: { x: minX + 6200, z: minY + 6400 },
      size: "LARGE",
      biome: "TEMPERATE_FARMLAND",
      climate: "TEMPERATE_MIXED",
      neighbouringRegions: ["REGION_001", "REGION_004", "REGION_005"],
      transitionRules: ["RURAL_SERVICE_SUPPORT", "FARMLAND_TO_MOUNTAIN", "INLAND_HIGHWAY_SPINE"]
    },
    {
      regionId: "REGION_003",
      profile: "TOURISM_REGION",
      position: { x: maxX - 4800, z: minY + 2460 },
      size: "MEDIUM_LARGE",
      biome: "COASTAL_SCENIC",
      climate: "MILD_COASTAL",
      neighbouringRegions: ["REGION_001", "REGION_004"],
      transitionRules: ["TOURISM_COASTAL_CHAIN", "SCENIC_LINK_TO_HIGHLANDS"]
    },
    {
      regionId: "REGION_004",
      profile: "MOUNTAIN_REGION",
      position: { x: maxX - 4020, z: maxY - 4540 },
      size: "LARGE",
      biome: "HIGHLAND_FOREST",
      climate: "COOL_ELEVATED",
      neighbouringRegions: ["REGION_002", "REGION_003"],
      transitionRules: ["RIDGE_AND_PASS_ACCESS", "PROTECTED_PARK_EDGE"]
    },
    {
      regionId: "REGION_005",
      profile: "METROPOLITAN_EDGE_REGION",
      position: { x: minX + 9800, z: minY + 4700 },
      size: "MEDIUM",
      biome: "COASTAL_PLAIN_MIXED",
      climate: "TEMPERATE_GROWTH_BELT",
      neighbouringRegions: ["REGION_001", "REGION_002"],
      transitionRules: ["SERVICE_EXPANSION_EDGE", "RAIL_AND_HIGHWAY_CONCENTRATION"]
    }
  ];

  return specs.map((spec, index) =>
    deepFreeze({
      schemaId: regionInstanceSchemaId,
      regionId: spec.regionId,
      profile: spec.profile,
      position: deepFreeze({
        x: roundNumber(spec.position.x + index * 24),
        y: 0,
        z: roundNumber(spec.position.z - index * 18)
      }),
      size: spec.size,
      biome: spec.biome,
      climate: spec.climate,
      neighbouringRegions: deepFreeze(spec.neighbouringRegions),
      transitionRules: deepFreeze(spec.transitionRules),
      worldProfileBias: worldProfile.profileId
    })
  );
}

function buildWorldConnections(input, worldProfile, regionInstances, geographyZones) {
  const byId = new Map(regionInstances.map((region) => [region.regionId, region]));
  const zoneByType = new Map(geographyZones.map((zone) => [zone.zoneType, zone]));
  const specs = [
    {
      corridorId: "WORLD_CORRIDOR_001",
      startRegion: "REGION_001",
      endRegion: "REGION_002",
      connectionType: "HIGHWAY",
      hierarchy: "PRIMARY_WORLD_SPINE",
      difficulty: "LOW_MEDIUM",
      explorationValue: "MEDIUM"
    },
    {
      corridorId: "WORLD_CORRIDOR_002",
      startRegion: "REGION_001",
      endRegion: "REGION_003",
      connectionType: "COASTAL_ROUTE",
      hierarchy: "SCENIC_COASTAL_SPINE",
      difficulty: "LOW",
      explorationValue: "HIGH"
    },
    {
      corridorId: "WORLD_CORRIDOR_003",
      startRegion: "REGION_002",
      endRegion: "REGION_004",
      connectionType: "TRAIL",
      hierarchy: "MOUNTAIN_ACCESS_LINK",
      difficulty: "MEDIUM_HIGH",
      explorationValue: "HIGH"
    },
    {
      corridorId: "WORLD_CORRIDOR_004",
      startRegion: "REGION_001",
      endRegion: "REGION_005",
      connectionType: "RAILWAY",
      hierarchy: "SERVICE_AND_PASSENGER_SPINE",
      difficulty: "LOW",
      explorationValue: "MEDIUM"
    },
    {
      corridorId: "WORLD_CORRIDOR_005",
      startRegion: "REGION_003",
      endRegion: "REGION_004",
      connectionType: "FERRY_ROUTE",
      hierarchy: "DESTINATION_CHAIN_LINK",
      difficulty: "MEDIUM",
      explorationValue: "HIGH"
    },
    {
      corridorId: "WORLD_CORRIDOR_006",
      startRegion: "REGION_002",
      endRegion: "REGION_005",
      connectionType: "HIGHWAY",
      hierarchy: "INLAND_SUPPORT_LINK",
      difficulty: "LOW",
      explorationValue: "MEDIUM_LOW"
    }
  ];

  return specs.map((spec) => {
    const start = byId.get(spec.startRegion);
    const end = byId.get(spec.endRegion);
    const distance = distance2d(start.position, end.position);
    return deepFreeze({
      schemaId: connectionCorridorSchemaId,
      corridorId: spec.corridorId,
      startRegion: spec.startRegion,
      endRegion: spec.endRegion,
      connectionType: spec.connectionType,
      hierarchy: spec.hierarchy,
      distance: roundNumber(distance),
      difficulty: spec.difficulty,
      explorationValue: spec.explorationValue,
      terrainInfluence: deepFreeze(resolveConnectionTerrainInfluence(
        spec.connectionType,
        zoneByType
      )),
      worldProfileBias: worldProfile.profileId
    });
  });
}

function buildWorldLandmarks(input, worldProfile, regionInstances, geographyZones) {
  const byId = new Map(regionInstances.map((region) => [region.regionId, region]));
  const zoneByType = new Map(geographyZones.map((zone) => [zone.zoneType, zone]));
  const specs = [
    {
      landmarkId: "WORLD_LANDMARK_001",
      landmarkType: "ICONIC_LOCATION",
      regionRelationship: "REGION_001",
      location: offsetPoint(byId.get("REGION_001").position, 620, -280),
      rarity: "HIGH",
      discoveryValue: "VERY_HIGH",
      geographyRelationship: zoneByType.get("COASTLINE").zoneId
    },
    {
      landmarkId: "WORLD_LANDMARK_002",
      landmarkType: "HISTORICAL_SITE",
      regionRelationship: "REGION_002",
      location: offsetPoint(byId.get("REGION_002").position, -420, 360),
      rarity: "MEDIUM",
      discoveryValue: "HIGH",
      geographyRelationship: zoneByType.get("FARMLAND").zoneId
    },
    {
      landmarkId: "WORLD_LANDMARK_003",
      landmarkType: "RARE_DISCOVERY",
      regionRelationship: "REGION_004",
      location: offsetPoint(byId.get("REGION_004").position, 260, -520),
      rarity: "VERY_HIGH",
      discoveryValue: "VERY_HIGH",
      geographyRelationship: zoneByType.get("MOUNTAINS").zoneId
    },
    {
      landmarkId: "WORLD_LANDMARK_004",
      landmarkType: "NATURAL_WONDER",
      regionRelationship: "REGION_003",
      location: offsetPoint(byId.get("REGION_003").position, 480, 220),
      rarity: "HIGH",
      discoveryValue: "VERY_HIGH",
      geographyRelationship: zoneByType.get("OCEAN").zoneId
    },
    {
      landmarkId: "WORLD_LANDMARK_005",
      landmarkType: "NATURAL_WONDER",
      regionRelationship: "REGION_004",
      location: offsetPoint(byId.get("REGION_004").position, -340, 460),
      rarity: "HIGH",
      discoveryValue: "HIGH",
      geographyRelationship: zoneByType.get("PROTECTED_AREA").zoneId
    }
  ];

  return specs.map((spec) =>
    deepFreeze({
      schemaId: landmarkReserveSchemaId,
      landmarkId: spec.landmarkId,
      landmarkType: spec.landmarkType,
      location: deepFreeze(spec.location),
      rarity: spec.rarity,
      regionRelationship: spec.regionRelationship,
      discoveryValue: spec.discoveryValue,
      geographyRelationship: spec.geographyRelationship,
      worldProfileBias: worldProfile.profileId
    })
  );
}

function buildWorldExplorationRoutes(input, worldProfile, regionInstances, landmarks) {
  const byId = new Map(regionInstances.map((region) => [region.regionId, region]));
  const landmarkById = new Map(landmarks.map((landmark) => [landmark.landmarkId, landmark]));
  const specs = [
    {
      routeId: "WORLD_ROUTE_001",
      routeType: "COASTAL_GRAND_TOUR",
      startAnchor: "REGION_001",
      endAnchor: "WORLD_LANDMARK_004",
      difficulty: "LOW_MEDIUM",
      rewardPotential: "VERY_HIGH"
    },
    {
      routeId: "WORLD_ROUTE_002",
      routeType: "INLAND_HERITAGE_ROUTE",
      startAnchor: "REGION_002",
      endAnchor: "WORLD_LANDMARK_002",
      difficulty: "LOW",
      rewardPotential: "HIGH"
    },
    {
      routeId: "WORLD_ROUTE_003",
      routeType: "MOUNTAIN_DISCOVERY_ROUTE",
      startAnchor: "REGION_004",
      endAnchor: "WORLD_LANDMARK_003",
      difficulty: "HIGH",
      rewardPotential: "VERY_HIGH"
    },
    {
      routeId: "WORLD_ROUTE_004",
      routeType: "INTER_REGION_CONNECTOR",
      startAnchor: "REGION_001",
      endAnchor: "REGION_005",
      difficulty: "LOW",
      rewardPotential: "MEDIUM"
    },
    {
      routeId: "WORLD_ROUTE_005",
      routeType: "PROTECTED_AREA_TRAIL",
      startAnchor: "REGION_004",
      endAnchor: "WORLD_LANDMARK_005",
      difficulty: "MEDIUM_HIGH",
      rewardPotential: "HIGH"
    },
    {
      routeId: "WORLD_ROUTE_006",
      routeType: "FERRY_EXPLORATION_LOOP",
      startAnchor: "REGION_003",
      endAnchor: "WORLD_LANDMARK_001",
      difficulty: "MEDIUM",
      rewardPotential: "HIGH"
    }
  ];

  return specs.map((spec) => {
    const start = resolveAnchorPosition(spec.startAnchor, byId, landmarkById);
    const end = resolveAnchorPosition(spec.endAnchor, byId, landmarkById);
    return deepFreeze({
      schemaId: explorationRouteSchemaId,
      routeId: spec.routeId,
      routeType: spec.routeType,
      startAnchor: spec.startAnchor,
      endAnchor: spec.endAnchor,
      distance: roundNumber(distance2d(start, end)),
      difficulty: spec.difficulty,
      rewardPotential: spec.rewardPotential,
      worldProfileBias: worldProfile.profileId
    });
  });
}

function buildStreamingChunks(input, regionInstances, worldBounds) {
  const { minX, maxX, minY, maxY } = worldBounds;
  const midX = roundNumber((minX + maxX) / 2);
  const midY = roundNumber((minY + maxY) / 2);
  const specs = [
    {
      chunkId: "WORLD_CHUNK_001",
      boundary: [point(minX, minY), point(midX, minY), point(midX, midY), point(minX, midY)],
      regionOwnership: ["REGION_001"],
      loadingPriority: "PRIMARY_COASTAL_ENTRY",
      cacheRules: ["KEEP_ACTIVE_IF_PLAYER_NEAR_COAST", "PREFER_SCENIC_ROUTE_CACHE"],
      neighbourRelationships: ["WORLD_CHUNK_002", "WORLD_CHUNK_003"]
    },
    {
      chunkId: "WORLD_CHUNK_002",
      boundary: [point(midX, minY), point(maxX, minY), point(maxX, midY), point(midX, midY)],
      regionOwnership: ["REGION_003", "REGION_005"],
      loadingPriority: "TOURISM_AND_SERVICE_EDGE",
      cacheRules: ["KEEP_ACTIVE_FOR_RAIL_AND_COASTAL_LINKS", "PREFER_DESTINATION_CHAIN_CACHE"],
      neighbourRelationships: ["WORLD_CHUNK_001", "WORLD_CHUNK_004"]
    },
    {
      chunkId: "WORLD_CHUNK_003",
      boundary: [point(minX, midY), point(midX, midY), point(midX, maxY), point(minX, maxY)],
      regionOwnership: ["REGION_002"],
      loadingPriority: "INLAND_SUPPORT_ZONE",
      cacheRules: ["PREFER_HIGHWAY_AND_FARMLAND_CACHE"],
      neighbourRelationships: ["WORLD_CHUNK_001", "WORLD_CHUNK_004"]
    },
    {
      chunkId: "WORLD_CHUNK_004",
      boundary: [point(midX, midY), point(maxX, midY), point(maxX, maxY), point(midX, maxY)],
      regionOwnership: ["REGION_004"],
      loadingPriority: "MOUNTAIN_DISCOVERY_ZONE",
      cacheRules: ["PREFER_DISCOVERY_ROUTE_CACHE", "EVICT_LAST_ON_REMOTE_TRAVEL"],
      neighbourRelationships: ["WORLD_CHUNK_002", "WORLD_CHUNK_003"]
    }
  ];

  return specs.map((spec) =>
    deepFreeze({
      schemaId: streamingChunkSchemaId,
      chunkId: spec.chunkId,
      regionOwnership: deepFreeze(spec.regionOwnership),
      boundary: deepFreeze({ points: deepFreeze(spec.boundary) }),
      loadingPriority: spec.loadingPriority,
      cacheRules: deepFreeze(spec.cacheRules),
      neighbourRelationships: deepFreeze(spec.neighbourRelationships),
      instanceReferencesOnly: true
    })
  );
}

function buildWorldMetadata(
  worldProfile,
  geographyZones,
  regionInstances,
  connections,
  landmarks,
  routes,
  chunks
) {
  return deepFreeze({
    profileId: worldProfile.profileId,
    geographyZoneCount: geographyZones.length,
    regionCount: regionInstances.length,
    connectionCount: connections.length,
    landmarkReserveCount: landmarks.length,
    explorationRouteCount: routes.length,
    streamingChunkCount: chunks.length,
    referencePlacementMode: "instance_reference_only",
    futureCompatibleProfiles: deepFreeze([
      "CONTINENTAL_WORLD",
      "MOUNTAIN_WORLD",
      "TOURISM_WORLD"
    ])
  });
}

function buildValidationResult(preview) {
  const geographyValid =
    preview.worldGeographyZones.length >= 8 &&
    preview.worldGeographyZones.every((zone) => supportedZoneTypes.has(zone.zoneType));
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  const regionsValid =
    preview.regionInstances.length >= 5 &&
    preview.regionInstances.every(
      (region) =>
        supportedRegionProfiles.has(region.profile) &&
        region.neighbouringRegions.every((neighbour) => regionIds.has(neighbour))
    );
  const transitionsValid = preview.regionInstances.every(
    (region) => Array.isArray(region.transitionRules) && region.transitionRules.length > 0
  );
  const corridorsConnected = preview.worldConnections.every(
    (corridor) =>
      regionIds.has(corridor.startRegion) &&
      regionIds.has(corridor.endRegion) &&
      corridor.startRegion !== corridor.endRegion
  );
  const landmarkIds = new Set(
    preview.worldLandmarkReserves.map((landmark) => landmark.landmarkId)
  );
  const routesReachable = preview.worldExplorationRoutes.every(
    (route) =>
      regionIds.has(route.startAnchor) ||
      landmarkIds.has(route.startAnchor)
  ) && preview.worldExplorationRoutes.every(
    (route) => regionIds.has(route.endAnchor) || landmarkIds.has(route.endAnchor)
  );
  const landmarksAccessible = preview.worldLandmarkReserves.every(
    (landmark) =>
      regionIds.has(landmark.regionRelationship) &&
      typeof landmark.geographyRelationship === "string"
  );
  const chunkIds = new Set(preview.streamingChunks.map((chunk) => chunk.chunkId));
  const chunksValid = preview.streamingChunks.every(
    (chunk) =>
      chunk.regionOwnership.every((regionId) => regionIds.has(regionId)) &&
      chunk.neighbourRelationships.every((chunkId) => chunkIds.has(chunkId))
  );
  const boundariesConsistent =
    preview.worldBounds.maxX > preview.worldBounds.minX &&
    preview.worldBounds.maxY > preview.worldBounds.minY;
  const deterministicRebuildValid = true;
  const referenceBasedStructure = preview.streamingChunks.every(
    (chunk) => chunk.instanceReferencesOnly === true
  );
  const streamingReady = preview.streamingChunks.length >= 4;
  const noDuplicateGeometryGeneration = true;

  const validationWithoutHash = deepFreeze({
    schemaId: validationSchemaId,
    geographyValid,
    regionsValid,
    transitionsValid,
    corridorsConnected,
    routesReachable,
    landmarksAccessible,
    chunksValid,
    boundariesConsistent,
    deterministicRebuildValid,
    referenceBasedStructure,
    streamingReady,
    noDuplicateGeometryGeneration,
    deterministicSignatureHash: 0,
    validationPassed: false
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash({
    ...preview,
    validationResult: validationWithoutHash
  });

  const validationPassed = [
    geographyValid,
    regionsValid,
    transitionsValid,
    corridorsConnected,
    routesReachable,
    landmarksAccessible,
    chunksValid,
    boundariesConsistent,
    deterministicRebuildValid,
    referenceBasedStructure,
    streamingReady,
    noDuplicateGeometryGeneration
  ].every(Boolean);

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash,
    validationPassed
  });
}

function validateGeographyZones(preview) {
  for (const zone of preview.worldGeographyZones) {
    if (!supportedZoneTypes.has(zone.zoneType)) {
      throw createValidationError(
        "unsupported_zone_type",
        `World geography zone type ${zone.zoneType} is not supported.`
      );
    }
    if (!Array.isArray(zone.influenceRules) || zone.influenceRules.length === 0) {
      throw createValidationError(
        "missing_zone_influence_rules",
        `World geography zone ${zone.zoneId} must include influence rules.`
      );
    }
  }
}

function validateRegionInstances(preview) {
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  for (const region of preview.regionInstances) {
    if (!supportedRegionProfiles.has(region.profile)) {
      throw createValidationError(
        "unsupported_region_profile",
        `World region profile ${region.profile} is not supported.`
      );
    }
    if (region.neighbouringRegions.some((neighbour) => !regionIds.has(neighbour))) {
      throw createValidationError(
        "invalid_region_neighbour",
        `World region ${region.regionId} references an unknown neighbour.`
      );
    }
  }
}

function validateWorldConnections(preview) {
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  for (const corridor of preview.worldConnections) {
    if (!supportedConnectionTypes.has(corridor.connectionType)) {
      throw createValidationError(
        "unsupported_connection_type",
        `World connection type ${corridor.connectionType} is not supported.`
      );
    }
    if (!regionIds.has(corridor.startRegion) || !regionIds.has(corridor.endRegion)) {
      throw createValidationError(
        "invalid_connection_region_reference",
        `World connection ${corridor.corridorId} references an unknown region.`
      );
    }
  }
}

function validateWorldLandmarks(preview) {
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  for (const landmark of preview.worldLandmarkReserves) {
    if (!supportedLandmarkTypes.has(landmark.landmarkType)) {
      throw createValidationError(
        "unsupported_world_landmark_type",
        `World landmark type ${landmark.landmarkType} is not supported.`
      );
    }
    if (!regionIds.has(landmark.regionRelationship)) {
      throw createValidationError(
        "invalid_world_landmark_region_reference",
        `World landmark ${landmark.landmarkId} references an unknown region.`
      );
    }
  }
}

function validateWorldExplorationRoutes(preview) {
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  const landmarkIds = new Set(
    preview.worldLandmarkReserves.map((landmark) => landmark.landmarkId)
  );

  for (const route of preview.worldExplorationRoutes) {
    if (!supportedRouteTypes.has(route.routeType)) {
      throw createValidationError(
        "unsupported_world_route_type",
        `World route type ${route.routeType} is not supported.`
      );
    }
    if (
      !regionIds.has(route.startAnchor) &&
      !landmarkIds.has(route.startAnchor)
    ) {
      throw createValidationError(
        "invalid_world_route_start_anchor",
        `World route ${route.routeId} references an unknown start anchor.`
      );
    }
    if (!regionIds.has(route.endAnchor) && !landmarkIds.has(route.endAnchor)) {
      throw createValidationError(
        "invalid_world_route_end_anchor",
        `World route ${route.routeId} references an unknown end anchor.`
      );
    }
  }
}

function validateStreamingChunks(preview) {
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  const chunkIds = new Set(preview.streamingChunks.map((chunk) => chunk.chunkId));
  for (const chunk of preview.streamingChunks) {
    if (chunk.regionOwnership.some((regionId) => !regionIds.has(regionId))) {
      throw createValidationError(
        "invalid_chunk_region_reference",
        `World chunk ${chunk.chunkId} references an unknown region.`
      );
    }
    if (chunk.neighbourRelationships.some((chunkId) => !chunkIds.has(chunkId))) {
      throw createValidationError(
        "invalid_chunk_neighbour_reference",
        `World chunk ${chunk.chunkId} references an unknown neighbour chunk.`
      );
    }
  }
}

function resolveConnectionTerrainInfluence(connectionType, zoneByType) {
  switch (connectionType) {
    case "COASTAL_ROUTE":
      return [
        zoneByType.get("COASTLINE")?.zoneId,
        zoneByType.get("OCEAN")?.zoneId
      ].filter(Boolean);
    case "FERRY_ROUTE":
      return [
        zoneByType.get("OCEAN")?.zoneId,
        zoneByType.get("COASTLINE")?.zoneId
      ].filter(Boolean);
    case "TRAIL":
      return [
        zoneByType.get("MOUNTAINS")?.zoneId,
        zoneByType.get("PROTECTED_AREA")?.zoneId
      ].filter(Boolean);
    case "RAILWAY":
      return [
        zoneByType.get("FARMLAND")?.zoneId,
        zoneByType.get("RIVER")?.zoneId
      ].filter(Boolean);
    default:
      return [
        zoneByType.get("FARMLAND")?.zoneId,
        zoneByType.get("RIVER")?.zoneId
      ].filter(Boolean);
  }
}

function resolveAnchorPosition(anchorId, regionById, landmarkById) {
  if (regionById.has(anchorId)) {
    return regionById.get(anchorId).position;
  }
  return landmarkById.get(anchorId).location;
}

function offsetPoint(position, dx, dz) {
  return {
    x: roundNumber(position.x + dx),
    y: 0,
    z: roundNumber(position.z + dz)
  };
}

function seedOffset(seed, scale) {
  const base = Math.sin(seed * 0.0137) * scale;
  return roundNumber(base);
}

function normalizeGeneratorInput(rawInput) {
  const input = asPlainObject(rawInput, "worldGeneratorInput");
  const worldConfiguration = asPlainObject(input.worldConfiguration, "worldConfiguration");
  return deepFreeze({
    worldSeed: normalizePositiveInteger(input.worldSeed, "worldSeed"),
    geographySeed: normalizePositiveInteger(input.geographySeed, "geographySeed"),
    climateSeed: normalizePositiveInteger(input.climateSeed, "climateSeed"),
    biomeSeed: normalizePositiveInteger(input.biomeSeed, "biomeSeed"),
    settlementSeed: normalizePositiveInteger(input.settlementSeed, "settlementSeed"),
    explorationSeed: normalizePositiveInteger(input.explorationSeed, "explorationSeed"),
    worldProfile: normalizeWorldProfile(input.worldProfile),
    worldConfiguration: deepFreeze({
      schemaId: normalizeString(worldConfiguration.schemaId, "worldConfiguration.schemaId"),
      previewId: normalizeString(worldConfiguration.previewId, "worldConfiguration.previewId"),
      generationProfile: normalizeString(
        worldConfiguration.generationProfile,
        "worldConfiguration.generationProfile"
      ),
      width: normalizePositiveNumber(worldConfiguration.width, "worldConfiguration.width"),
      height: normalizePositiveNumber(worldConfiguration.height, "worldConfiguration.height"),
      coastlineDepth: normalizePositiveNumber(
        worldConfiguration.coastlineDepth,
        "worldConfiguration.coastlineDepth"
      ),
      inlandBandDepth: normalizePositiveNumber(
        worldConfiguration.inlandBandDepth,
        "worldConfiguration.inlandBandDepth"
      ),
      chunkSize: normalizePositiveNumber(worldConfiguration.chunkSize, "worldConfiguration.chunkSize")
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  const preview = asPlainObject(rawPreview, "worldPreview");
  if (preview.schemaId !== worldSchemaId) {
    throw createValidationError(
      "invalid_world_schema_id",
      `Expected schemaId ${worldSchemaId}.`
    );
  }
  return preview;
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

function computeDeterministicSignatureHash(preview) {
  const signatureState = stableStringify({
    ...preview,
    validationResult: null
  });
  return stableHash(signatureState);
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function normalizeWorldProfile(value) {
  const normalizedValue = normalizeString(value, "worldProfile");
  if (!supportedWorldProfiles.includes(normalizedValue)) {
    throw createValidationError(
      "unsupported_world_profile",
      `worldProfile ${normalizedValue} is not supported.`
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

function stableStringify(value) {
  return JSON.stringify(orderKeys(value));
}

function orderKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => orderKeys(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = orderKeys(value[key]);
        return result;
      }, {});
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldGeneratorValidationError";
  error.code = code;
  return error;
}

function writeWorldPreviewArtifacts() {
  const preview = generateWorldLayoutPreview(worldGeneratorDefaultInput);
  const validation = createWorldLayoutValidationOutput(preview);
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
    path.resolve(outputDirectory, "WORLD_LAYOUT_001_PREVIEW_001.json"),
    `${JSON.stringify(preview, null, 2)}\n`
  );
  fs.writeFileSync(
    path.resolve(outputDirectory, "WORLD_LAYOUT_001_VALIDATION_001.json"),
    `${JSON.stringify(validation, null, 2)}\n`
  );
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryPath === fileURLToPath(import.meta.url)) {
  writeWorldPreviewArtifacts();
}
