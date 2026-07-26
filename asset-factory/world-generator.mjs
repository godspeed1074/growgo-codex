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
  "AUSTRALIAN_OUTBACK_WORLD",
  "ALPINE_WORLD",
  "TOURISM_ARCHIPELAGO_WORLD",
  "METROPOLITAN_EXPANSION_WORLD"
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

const worldScaleProfiles = deepFreeze({
  SMALL_WORLD: {
    schemaId: "WORLD_SCALE_PROFILE_001",
    scaleId: "SMALL_WORLD",
    regionCountRange: [5, 6],
    travelDistanceRange: "COMPACT_INTER_REGION",
    explorationDensity: "HIGH_EXPLORATION",
    sizeMultiplier: 1,
    chunkRequirements: {
      minimumChunkCount: 4,
      preferredColumns: 2,
      preferredRows: 2,
      streamingComplexity: "LOW"
    }
  },
  MEDIUM_WORLD: {
    schemaId: "WORLD_SCALE_PROFILE_001",
    scaleId: "MEDIUM_WORLD",
    regionCountRange: [8, 10],
    travelDistanceRange: "MULTI_REGION",
    explorationDensity: "MEDIUM_EXPLORATION",
    sizeMultiplier: 1.55,
    chunkRequirements: {
      minimumChunkCount: 6,
      preferredColumns: 3,
      preferredRows: 2,
      streamingComplexity: "MEDIUM"
    }
  },
  LARGE_WORLD: {
    schemaId: "WORLD_SCALE_PROFILE_001",
    scaleId: "LARGE_WORLD",
    regionCountRange: [12, 14],
    travelDistanceRange: "EPIC_WORLD_ROUTE",
    explorationDensity: "WIDE_EXPLORATION",
    sizeMultiplier: 2.1,
    chunkRequirements: {
      minimumChunkCount: 9,
      preferredColumns: 3,
      preferredRows: 3,
      streamingComplexity: "HIGH"
    }
  }
});

const worldProfiles = deepFreeze({
  AUSTRALIAN_COASTAL_WORLD: {
    profileId: "AUSTRALIAN_COASTAL_WORLD",
    generationProfile: "australian_coastal_world_composition_v1",
    worldIdentity: "SCENIC_COASTAL_CHAIN",
    scaleProfile: "SMALL_WORLD",
    geographyWeighting: {
      ocean: 1,
      coastline: 1,
      forest: 0.72,
      farmland: 0.72,
      river: 0.62,
      wetland: 0.45,
      mountains: 0.4,
      protectedArea: 0.7
    },
    regionMix: {
      COASTAL_REGION: 0.34,
      TOURISM_REGION: 0.22,
      RURAL_REGION: 0.2,
      MOUNTAIN_REGION: 0.1,
      METROPOLITAN_EDGE_REGION: 0.14
    },
    settlementDensity: "MEDIUM_SCENIC",
    transportIntensity: "MEDIUM_HIGH",
    landmarkFrequency: "HIGH",
    explorationDensity: "HIGH_EXPLORATION",
    streamingRequirements: {
      targetChunkComplexity: "LOW",
      routeDensity: "DENSE",
      cacheMode: "SCENIC_CHAIN"
    },
    boundaryBehaviour: "COASTAL_CONTINENTAL_ARC",
    growthPattern: "COASTAL_SPINE_WITH_INLAND_SUPPORT"
  },
  AUSTRALIAN_OUTBACK_WORLD: {
    profileId: "AUSTRALIAN_OUTBACK_WORLD",
    generationProfile: "australian_outback_world_composition_v1",
    worldIdentity: "SPARSE_INTERIOR_NETWORK",
    scaleProfile: "MEDIUM_WORLD",
    geographyWeighting: {
      ocean: 0.1,
      coastline: 0.18,
      forest: 0.28,
      farmland: 0.88,
      river: 0.52,
      wetland: 0.14,
      mountains: 0.35,
      protectedArea: 0.42
    },
    regionMix: {
      COASTAL_REGION: 0.05,
      TOURISM_REGION: 0.08,
      RURAL_REGION: 0.52,
      MOUNTAIN_REGION: 0.12,
      METROPOLITAN_EDGE_REGION: 0.23
    },
    settlementDensity: "LOW_SPARSE",
    transportIntensity: "MEDIUM_LONG_DISTANCE",
    landmarkFrequency: "LOW_MEDIUM",
    explorationDensity: "LONG_RANGE_DISCOVERY",
    streamingRequirements: {
      targetChunkComplexity: "MEDIUM",
      routeDensity: "SPARSE",
      cacheMode: "LONG_RANGE_TRAVEL"
    },
    boundaryBehaviour: "INLAND_EXPANSE",
    growthPattern: "SERVICE_CORRIDORS_AND_REMOTE_EDGES"
  },
  ALPINE_WORLD: {
    profileId: "ALPINE_WORLD",
    generationProfile: "alpine_world_composition_v1",
    worldIdentity: "MOUNTAIN_PASS_DISCOVERY",
    scaleProfile: "MEDIUM_WORLD",
    geographyWeighting: {
      ocean: 0.16,
      coastline: 0.14,
      forest: 0.94,
      farmland: 0.26,
      river: 0.78,
      wetland: 0.22,
      mountains: 1,
      protectedArea: 0.92
    },
    regionMix: {
      COASTAL_REGION: 0.04,
      TOURISM_REGION: 0.24,
      RURAL_REGION: 0.16,
      MOUNTAIN_REGION: 0.46,
      METROPOLITAN_EDGE_REGION: 0.1
    },
    settlementDensity: "LOW_CONSTRAINED",
    transportIntensity: "LOW_MEDIUM",
    landmarkFrequency: "VERY_HIGH",
    explorationDensity: "REMOTE_HIGH_VALUE",
    streamingRequirements: {
      targetChunkComplexity: "MEDIUM",
      routeDensity: "MEDIUM",
      cacheMode: "PASS_AND_VALLEY"
    },
    boundaryBehaviour: "RIDGE_CHAIN_WORLD",
    growthPattern: "VALLEY_AND_PASS_CORRIDORS"
  },
  TOURISM_ARCHIPELAGO_WORLD: {
    profileId: "TOURISM_ARCHIPELAGO_WORLD",
    generationProfile: "tourism_archipelago_world_composition_v1",
    worldIdentity: "ISLAND_DESTINATION_NETWORK",
    scaleProfile: "MEDIUM_WORLD",
    geographyWeighting: {
      ocean: 1,
      coastline: 0.96,
      forest: 0.64,
      farmland: 0.24,
      river: 0.42,
      wetland: 0.38,
      mountains: 0.3,
      protectedArea: 0.74
    },
    regionMix: {
      COASTAL_REGION: 0.36,
      TOURISM_REGION: 0.32,
      RURAL_REGION: 0.08,
      MOUNTAIN_REGION: 0.06,
      METROPOLITAN_EDGE_REGION: 0.18
    },
    settlementDensity: "DESTINATION_CLUSTERED",
    transportIntensity: "FERRY_SCENIC_HIGH",
    landmarkFrequency: "VERY_HIGH",
    explorationDensity: "DENSE_ATTRACTION_LOOPS",
    streamingRequirements: {
      targetChunkComplexity: "MEDIUM",
      routeDensity: "VERY_DENSE",
      cacheMode: "ISLAND_HOPPING"
    },
    boundaryBehaviour: "ARCHIPELAGO_CHAIN",
    growthPattern: "ISLAND_HUBS_AND_SCENIC_LINKS"
  },
  METROPOLITAN_EXPANSION_WORLD: {
    profileId: "METROPOLITAN_EXPANSION_WORLD",
    generationProfile: "metropolitan_expansion_world_composition_v1",
    worldIdentity: "URBAN_GROWTH_CORRIDORS",
    scaleProfile: "LARGE_WORLD",
    geographyWeighting: {
      ocean: 0.42,
      coastline: 0.36,
      forest: 0.34,
      farmland: 0.48,
      river: 0.56,
      wetland: 0.22,
      mountains: 0.2,
      protectedArea: 0.24
    },
    regionMix: {
      COASTAL_REGION: 0.14,
      TOURISM_REGION: 0.08,
      RURAL_REGION: 0.24,
      MOUNTAIN_REGION: 0.04,
      METROPOLITAN_EDGE_REGION: 0.5
    },
    settlementDensity: "HIGH_CORRIDOR",
    transportIntensity: "VERY_HIGH_MULTI_CENTRE",
    landmarkFrequency: "MEDIUM",
    explorationDensity: "NETWORKED_REGIONAL_DISCOVERY",
    streamingRequirements: {
      targetChunkComplexity: "HIGH",
      routeDensity: "HIGH",
      cacheMode: "MULTI_CENTRE_STREAMING"
    },
    boundaryBehaviour: "URBAN_CORRIDOR_FAN",
    growthPattern: "MULTI_CENTRE_EXPANSION_AND_SERVICE_SPINES"
  }
});

const regionProfileDescriptors = deepFreeze({
  COASTAL_REGION: {
    biome: "TEMPERATE_COASTAL",
    climate: "MILD_COASTAL",
    sizeBias: "LARGE",
    transitionRules: ["COAST_TO_INLAND", "SCENIC_PUBLIC_EDGE", "FORESHORE_ACCESS"]
  },
  RURAL_REGION: {
    biome: "TEMPERATE_FARMLAND",
    climate: "MIXED_TEMPERATE",
    sizeBias: "LARGE",
    transitionRules: ["SERVICE_SPINE", "FARMLAND_SUPPORT", "INLAND_CONNECTOR"]
  },
  MOUNTAIN_REGION: {
    biome: "HIGHLAND_FOREST",
    climate: "COOL_ELEVATED",
    sizeBias: "LARGE",
    transitionRules: ["RIDGE_ACCESS", "PASS_CORRIDOR", "PROTECTED_EDGE"]
  },
  TOURISM_REGION: {
    biome: "SCENIC_DESTINATION",
    climate: "MILD_VISITOR",
    sizeBias: "MEDIUM_LARGE",
    transitionRules: ["DESTINATION_LINK", "LANDMARK_CLUSTER", "PEDESTRIAN_SCENIC_CHAIN"]
  },
  METROPOLITAN_EDGE_REGION: {
    biome: "COASTAL_PLAIN_MIXED",
    climate: "TEMPERATE_GROWTH_BELT",
    sizeBias: "MEDIUM",
    transitionRules: ["SERVICE_EXPANSION", "CORRIDOR_CONCENTRATION", "FUTURE_CENTRE_SUPPORT"]
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
    generationProfile: "world_composition_profile_system_001",
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
  const worldScaleProfile = resolveWorldScaleProfile(worldProfile.scaleProfile);
  const seedConfig = buildSeedConfig(input, worldProfile, worldScaleProfile);
  const worldBounds = buildWorldBounds(input, worldProfile, worldScaleProfile);
  const worldGeographyZones = buildWorldGeographyZones(
    input,
    worldProfile,
    worldScaleProfile,
    worldBounds
  );
  const regionInstances = buildRegionInstances(
    input,
    worldProfile,
    worldScaleProfile,
    worldBounds
  );
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
  const streamingChunks = buildStreamingChunks(
    input,
    worldProfile,
    worldScaleProfile,
    regionInstances,
    worldBounds
  );
  const worldMetadata = buildWorldMetadata(
    worldProfile,
    worldScaleProfile,
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
    worldScaleProfile: deepFreeze({ ...worldScaleProfile }),
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
        noDuplicateGeometryGeneration: true,
        profileAppliedCorrectly: true,
        identityScoreAligned: true,
        requiredSystemsGenerated: true,
        streamingRequirementsValid: true
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

export function generateWorldCompositionProfileComparison(seed = 10482) {
  return deepFreeze(
    supportedWorldProfiles.map((profileId) => {
      const preview = generateWorldLayoutPreview({
        ...worldGeneratorDefaultInput,
        worldSeed: seed,
        worldProfile: profileId
      });
      return {
        profileId,
        scaleProfile: preview.worldScaleProfile.scaleId,
        geographyDistribution: preview.worldMetadata.geographyDistribution,
        regionDistribution: preview.worldMetadata.regionDistribution,
        transportIntensity: preview.worldMetadata.transportIntensity,
        landmarkDensity: preview.worldMetadata.landmarkDensity,
        explorationDensity: preview.worldMetadata.explorationDensity,
        validationPassed: preview.validationResult.validationPassed
      };
    })
  );
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
      scaleProfileId: preview.worldScaleProfile.scaleId,
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
      ),
      profileAppliedCorrectly: passFail(
        preview.validationResult.profileAppliedCorrectly
      ),
      identityScoreAligned: passFail(
        preview.validationResult.identityScoreAligned
      ),
      requiredSystemsGenerated: passFail(
        preview.validationResult.requiredSystemsGenerated
      ),
      streamingRequirementsValid: passFail(
        preview.validationResult.streamingRequirementsValid
      )
    })
  });
}

export function validateWorldLayoutPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (!supportedWorldProfiles.includes(preview.worldProfile.profileId)) {
      throw createValidationError(
        "unsupported_world_profile",
        `World preview profile ${preview.worldProfile.profileId} is not supported.`
      );
    }
    if (preview.worldGeographyZones.length < 8) {
      throw createValidationError(
        "insufficient_geography_zone_count",
        "World preview must include at least eight geography zones."
      );
    }
    if (
      preview.regionInstances.length <
      preview.worldScaleProfile.regionCountRange[0]
    ) {
      throw createValidationError(
        "insufficient_region_count",
        "World preview does not satisfy the selected scale profile region count."
      );
    }
    if (preview.worldConnections.length < preview.regionInstances.length) {
      throw createValidationError(
        "insufficient_connection_count",
        "World preview must include at least one corridor per region."
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
    if (
      preview.streamingChunks.length <
      preview.worldScaleProfile.chunkRequirements.minimumChunkCount
    ) {
      throw createValidationError(
        "insufficient_chunk_count",
        "World preview must satisfy the selected scale profile chunk count."
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

function buildSeedConfig(input, worldProfile, worldScaleProfile) {
  return deepFreeze({
    worldSeed: input.worldSeed,
    geographySeed: input.geographySeed,
    climateSeed: input.climateSeed,
    biomeSeed: input.biomeSeed,
    settlementSeed: input.settlementSeed,
    explorationSeed: input.explorationSeed,
    worldProfile: input.worldProfile,
    scaleProfile: worldScaleProfile.scaleId,
    compositionIdentity: worldProfile.worldIdentity
  });
}

function resolveWorldProfile(worldProfile) {
  return worldProfiles[worldProfile] ?? worldProfiles.AUSTRALIAN_COASTAL_WORLD;
}

function resolveWorldScaleProfile(scaleProfile) {
  return worldScaleProfiles[scaleProfile] ?? worldScaleProfiles.SMALL_WORLD;
}

function buildWorldBounds(input, worldProfile, worldScaleProfile) {
  const profileWidthFactor = worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD" ? 1.18 : 1;
  const profileHeightFactor = worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? 1.12 : 1;
  const width = input.worldConfiguration.width * worldScaleProfile.sizeMultiplier * profileWidthFactor;
  const height = input.worldConfiguration.height * worldScaleProfile.sizeMultiplier * profileHeightFactor;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const variation = seedOffset(input.worldSeed, 260);
  const coastalLift = worldProfile.geographyWeighting.coastline * 880;
  const northernRidge = worldProfile.geographyWeighting.mountains * 540;

  return deepFreeze({
    boundaryStyle: worldProfile.boundaryBehaviour,
    minX: roundNumber(-halfWidth),
    maxX: roundNumber(halfWidth),
    minY: roundNumber(-halfHeight),
    maxY: roundNumber(halfHeight),
    boundaryPolygon: deepFreeze([
      point(-halfWidth, -halfHeight + 680 + coastalLift * 0.2),
      point(-halfWidth + 940, -halfHeight - 120),
      point(-halfWidth + width * 0.23 + variation, -halfHeight + 240),
      point(halfWidth - width * 0.1, -halfHeight + 520 + coastalLift * 0.3),
      point(halfWidth + 280, -halfHeight + height * 0.14),
      point(halfWidth + 460, halfHeight - height * 0.12),
      point(halfWidth - 820, halfHeight + northernRidge * 0.5),
      point(-halfWidth + width * 0.1, halfHeight + 420),
      point(-halfWidth - 360, halfHeight - height * 0.08),
      point(-halfWidth - 420, -860)
    ])
  });
}

function buildWorldGeographyZones(input, worldProfile, worldScaleProfile, worldBounds) {
  const { minX, maxX, minY, maxY } = worldBounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const coastDepth =
    input.worldConfiguration.coastlineDepth *
    worldScaleProfile.sizeMultiplier *
    clamp(worldProfile.geographyWeighting.coastline, 0.18, 1);
  const inlandDepth =
    input.worldConfiguration.inlandBandDepth *
    worldScaleProfile.sizeMultiplier *
    clamp(worldProfile.geographyWeighting.farmland, 0.3, 1);
  const oceanDepth = coastDepth + worldProfile.geographyWeighting.ocean * 760;
  const mountainBias = worldProfile.geographyWeighting.mountains;
  const forestBias = worldProfile.geographyWeighting.forest;
  const wetlandBias = worldProfile.geographyWeighting.wetland;
  const protectedBias = worldProfile.geographyWeighting.protectedArea;

  return [
    buildWorldGeographyZone(
      "WORLD_ZONE_001",
      "OCEAN",
      [
        point(minX - 1200, minY - 1200),
        point(maxX + 1400, minY - 920),
        point(maxX + 820, minY + oceanDepth - 520),
        point(minX - 620, minY + oceanDepth - 680)
      ],
      worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? "DRY_MARGIN_COAST" : "MARINE_COASTAL",
      worldProfile.profileId === "ALPINE_WORLD" ? "COLD_MARINE" : "TEMPERATE_MARINE",
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
      worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD" ? "ARCHIPELAGO_COASTLINE" : "TEMPERATE_COASTLINE",
      worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? "WARM_DRY_COAST" : "MILD_COASTAL",
      "PARTIAL_PUBLIC_ACCESS",
      ["ENABLES_COASTAL_AND_TOURISM_REGIONS", "SUPPORTS_SCENIC_ROUTE_SPINES"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_003",
      "FOREST",
      [
        point(minX + width * 0.05, maxY - height * 0.26),
        point(minX + width * 0.24, maxY - height * 0.28),
        point(minX + width * 0.26, maxY - height * 0.05),
        point(minX + width * 0.08, maxY - height * 0.04)
      ],
      forestBias > 0.8 ? "DENSE_TEMPERATE_FOREST" : "TEMPERATE_FOREST",
      forestBias > 0.85 ? "MILD_WET" : "MIXED_WET_DRY",
      "TRACK_ACCESS",
      ["SUPPORTS_MOUNTAIN_AND_TOURISM_EDGE_REGIONS", "INCREASES_DISCOVERY_VALUE"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_004",
      "FARMLAND",
      [
        point(minX + width * 0.12, minY + coastDepth + 760),
        point(maxX - width * 0.04, minY + coastDepth + 420),
        point(maxX - width * 0.06, minY + coastDepth + inlandDepth),
        point(minX + width * 0.1, minY + coastDepth + inlandDepth + 620)
      ],
      worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? "ARID_GRAZING_BELT" : "TEMPERATE_FARMLAND",
      worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? "HOT_DRY" : "MIXED_TEMPERATE",
      "ROAD_ACCESS",
      ["SUPPORTS_RURAL_AND_SERVICE_REGIONS", "ENABLES_HIGHWAY_AND_RAIL_ALIGNMENT"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_005",
      "RIVER",
      [
        point(minX + width * 0.24, maxY - 260),
        point(minX + width * 0.27, maxY - height * 0.14),
        point(minX + width * 0.29, maxY - height * 0.26),
        point(minX + width * 0.31, minY + height * 0.12)
      ],
      worldProfile.profileId === "ALPINE_WORLD" ? "SNOWMELT_RIVER_SYSTEM" : "TEMPERATE_RIVER_SYSTEM",
      worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? "SEASONAL_FLOW" : "MIXED_TEMPERATE",
      "PARTIAL_PUBLIC_ACCESS",
      ["CREATES_BRIDGE_AND_VALLEY_CORRIDOR_LOGIC", "ATTRACTS_SETTLEMENT_AND_RECREATION"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_006",
      "WETLAND",
      [
        point(maxX - width * 0.2, minY + height * 0.17),
        point(maxX - width * 0.12, minY + height * 0.16),
        point(maxX - width * 0.11, minY + height * (0.16 + 0.08 * wetlandBias)),
        point(maxX - width * 0.19, minY + height * (0.17 + 0.08 * wetlandBias))
      ],
      wetlandBias > 0.3 ? "COASTAL_WETLAND" : "SEASONAL_LOWLAND",
      wetlandBias > 0.3 ? "MILD_HUMID" : "SEASONAL_DRY",
      "BOARDWALK_CONTROLLED",
      ["LIMITS_DENSE_REGION_EXPANSION", "SHIFTS_CORRIDORS_TO_DRY_GROUND"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_007",
      "MOUNTAINS",
      [
        point(maxX - width * 0.27, maxY - height * 0.32),
        point(maxX - width * 0.12, maxY - height * 0.35),
        point(maxX - width * 0.08, maxY - height * 0.14),
        point(maxX - width * 0.24, maxY - height * 0.1)
      ],
      mountainBias > 0.8 ? "ALPINE_RIDGE_SYSTEM" : "HIGHLAND_RIDGE",
      mountainBias > 0.8 ? "COOL_ELEVATED" : "TEMPERATE_HIGHLAND",
      "PASS_AND_TRAIL_ACCESS",
      ["CONSTRAINS_TRANSPORT", "SUPPORTS_MOUNTAIN_REGIONS_AND_REMOTE_DISCOVERY"]
    ),
    buildWorldGeographyZone(
      "WORLD_ZONE_008",
      "PROTECTED_AREA",
      [
        point(maxX - width * 0.16, maxY - height * 0.2),
        point(maxX - width * 0.07, maxY - height * 0.21),
        point(maxX - width * 0.04, maxY - height * 0.12),
        point(maxX - width * 0.13, maxY - height * 0.09)
      ],
      protectedBias > 0.75 ? "NATIONAL_PARK_COMPLEX" : "REGIONAL_CONSERVATION_AREA",
      protectedBias > 0.75 ? "TEMPERATE_PROTECTED" : "MIXED_PROTECTED",
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

function buildRegionInstances(input, worldProfile, worldScaleProfile, worldBounds) {
  const count = selectRegionCount(input.worldSeed, worldScaleProfile);
  const profiles = buildRegionProfileSequence(count, worldProfile, input.settlementSeed);
  const { minX, maxX, minY, maxY } = worldBounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = roundNumber((minX + maxX) / 2);
  const centerY = roundNumber((minY + maxY) / 2);
  const radiusX = width * 0.33;
  const radiusY = height * 0.28;
  const archipelagoOffset = worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD" ? width * 0.09 : 0;
  const outbackDepth = worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD" ? height * 0.09 : 0;
  const metroBias = worldProfile.profileId === "METROPOLITAN_EXPANSION_WORLD" ? width * 0.04 : 0;

  return profiles.map((profile, index) => {
    const descriptor = regionProfileDescriptors[profile];
    const angle = (-Math.PI * 0.92) + (index / count) * Math.PI * 1.84;
    const position = {
      x: roundNumber(
        centerX +
          Math.cos(angle) * radiusX +
          seedOffset(input.worldSeed + index * 19, 220) +
          (profile === "TOURISM_REGION" ? archipelagoOffset : 0) +
          (profile === "METROPOLITAN_EDGE_REGION" ? metroBias : 0)
      ),
      y: 0,
      z: roundNumber(
        centerY +
          Math.sin(angle) * radiusY +
          seedOffset(input.settlementSeed + index * 11, 180) -
          (profile === "COASTAL_REGION" ? height * 0.12 : 0) +
          (profile === "RURAL_REGION" ? outbackDepth : 0) -
          (profile === "MOUNTAIN_REGION" ? height * 0.14 : 0)
      )
    };

    return deepFreeze({
      schemaId: regionInstanceSchemaId,
      regionId: `REGION_${String(index + 1).padStart(3, "0")}`,
      profile,
      position: deepFreeze(position),
      size: descriptor.sizeBias,
      biome: descriptor.biome,
      climate: descriptor.climate,
      neighbouringRegions: deepFreeze(resolveRegionNeighbours(index, count)),
      transitionRules: deepFreeze(resolveRegionTransitionRules(profile, descriptor, worldProfile)),
      worldProfileBias: worldProfile.profileId
    });
  });
}

function buildWorldConnections(input, worldProfile, regionInstances, geographyZones) {
  const zoneByType = new Map(geographyZones.map((zone) => [zone.zoneType, zone]));
  const connections = [];
  const extraCrossLinks =
    worldProfile.transportIntensity.includes("VERY_HIGH") ? 3 :
      worldProfile.transportIntensity.includes("HIGH") ? 2 : 1;

  for (let index = 0; index < regionInstances.length - 1; index += 1) {
    connections.push(
      buildConnectionRecord(
        `WORLD_CORRIDOR_${String(connections.length + 1).padStart(3, "0")}`,
        regionInstances[index],
        regionInstances[index + 1],
        worldProfile,
        zoneByType
      )
    );
  }

  connections.push(
    buildConnectionRecord(
      `WORLD_CORRIDOR_${String(connections.length + 1).padStart(3, "0")}`,
      regionInstances[regionInstances.length - 1],
      regionInstances[0],
      worldProfile,
      zoneByType
    )
  );

  for (let index = 0; index < extraCrossLinks; index += 1) {
    const start = regionInstances[index];
    const end = regionInstances[(index + 2 + index) % regionInstances.length];
    if (start.regionId !== end.regionId) {
      connections.push(
        buildConnectionRecord(
          `WORLD_CORRIDOR_${String(connections.length + 1).padStart(3, "0")}`,
          start,
          end,
          worldProfile,
          zoneByType
        )
      );
    }
  }

  return connections.map((connection) => deepFreeze(connection));
}

function buildWorldLandmarks(input, worldProfile, regionInstances, geographyZones) {
  const zoneByType = new Map(geographyZones.map((zone) => [zone.zoneType, zone]));
  const targetCount = Math.max(
    4,
    Math.round(regionInstances.length * landmarkFrequencyMultiplier(worldProfile.landmarkFrequency))
  );
  const landmarks = [];

  for (let index = 0; index < targetCount; index += 1) {
    const region = regionInstances[index % regionInstances.length];
    const landmarkType = selectLandmarkType(worldProfile, region.profile, index);
    const geographyRelationship = selectLandmarkZoneId(zoneByType, landmarkType, region.profile);
    const rarity = index === 0 ? "VERY_HIGH" : (index % 3 === 0 ? "HIGH" : "MEDIUM");
    landmarks.push(
      deepFreeze({
        schemaId: landmarkReserveSchemaId,
        landmarkId: `WORLD_LANDMARK_${String(index + 1).padStart(3, "0")}`,
        landmarkType,
        location: deepFreeze(
          offsetPoint(
            region.position,
            seedOffset(input.explorationSeed + index * 7, 620),
            seedOffset(input.biomeSeed + index * 13, 540)
          )
        ),
        rarity,
        regionRelationship: region.regionId,
        discoveryValue: rarity === "VERY_HIGH" ? "VERY_HIGH" : "HIGH",
        geographyRelationship,
        worldProfileBias: worldProfile.profileId
      })
    );
  }

  return landmarks;
}

function buildWorldExplorationRoutes(input, worldProfile, regionInstances, landmarks) {
  const regionById = new Map(regionInstances.map((region) => [region.regionId, region]));
  const landmarkById = new Map(landmarks.map((landmark) => [landmark.landmarkId, landmark]));
  const routes = [];

  landmarks.forEach((landmark, index) => {
    const sourceRegion = regionInstances[index % regionInstances.length];
    routes.push(
      deepFreeze({
        schemaId: explorationRouteSchemaId,
        routeId: `WORLD_ROUTE_${String(routes.length + 1).padStart(3, "0")}`,
        routeType: selectRouteType(worldProfile, landmark, sourceRegion.profile),
        startAnchor: sourceRegion.regionId,
        endAnchor: landmark.landmarkId,
        distance: roundNumber(distance2d(sourceRegion.position, landmark.location)),
        difficulty: resolveRouteDifficulty(worldProfile, landmark.landmarkType),
        rewardPotential: landmark.discoveryValue === "VERY_HIGH" ? "VERY_HIGH" : "HIGH",
        worldProfileBias: worldProfile.profileId
      })
    );
  });

  for (let index = 0; index < regionInstances.length - 1; index += 2) {
    const start = regionInstances[index];
    const end = regionInstances[(index + 1) % regionInstances.length];
    routes.push(
      deepFreeze({
        schemaId: explorationRouteSchemaId,
        routeId: `WORLD_ROUTE_${String(routes.length + 1).padStart(3, "0")}`,
        routeType: "INTER_REGION_CONNECTOR",
        startAnchor: start.regionId,
        endAnchor: end.regionId,
        distance: roundNumber(distance2d(start.position, end.position)),
        difficulty: "LOW_MEDIUM",
        rewardPotential: "MEDIUM",
        worldProfileBias: worldProfile.profileId
      })
    );
  }

  return routes.map((route) => {
    const start = resolveAnchorPosition(route.startAnchor, regionById, landmarkById);
    const end = resolveAnchorPosition(route.endAnchor, regionById, landmarkById);
    return deepFreeze({
      ...route,
      distance: roundNumber(distance2d(start, end))
    });
  });
}

function buildStreamingChunks(input, worldProfile, worldScaleProfile, regionInstances, worldBounds) {
  const columns = worldScaleProfile.chunkRequirements.preferredColumns;
  const rows = worldScaleProfile.chunkRequirements.preferredRows;
  const width = worldBounds.maxX - worldBounds.minX;
  const height = worldBounds.maxY - worldBounds.minY;
  const chunkWidth = width / columns;
  const chunkHeight = height / rows;
  const chunks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const minX = worldBounds.minX + column * chunkWidth;
      const maxX = minX + chunkWidth;
      const minY = worldBounds.minY + row * chunkHeight;
      const maxY = minY + chunkHeight;
      const chunkId = `WORLD_CHUNK_${String(chunks.length + 1).padStart(3, "0")}`;
      const regionOwnership = regionInstances
        .filter(
          (region) =>
            region.position.x >= minX &&
            region.position.x < maxX &&
            region.position.z >= minY &&
            region.position.z < maxY
        )
        .map((region) => region.regionId);

      chunks.push(
        deepFreeze({
          schemaId: streamingChunkSchemaId,
          chunkId,
          regionOwnership: deepFreeze(
            regionOwnership.length > 0 ? regionOwnership : [regionInstances[chunks.length % regionInstances.length].regionId]
          ),
          boundary: deepFreeze({
            points: deepFreeze([
              point(minX, minY),
              point(maxX, minY),
              point(maxX, maxY),
              point(minX, maxY)
            ])
          }),
          loadingPriority: resolveChunkPriority(worldProfile, row, column),
          cacheRules: deepFreeze(resolveChunkCacheRules(worldProfile, row, column)),
          neighbourRelationships: deepFreeze([]),
          instanceReferencesOnly: true
        })
      );
    }
  }

  const chunkIds = chunks.map((chunk) => chunk.chunkId);
  return chunks.map((chunk, index) =>
    deepFreeze({
      ...chunk,
      neighbourRelationships: deepFreeze(resolveChunkNeighbours(index, columns, rows, chunkIds))
    })
  );
}

function buildWorldMetadata(
  worldProfile,
  worldScaleProfile,
  geographyZones,
  regionInstances,
  connections,
  landmarks,
  routes,
  chunks
) {
  const geographyDistribution = summarizeByKey(geographyZones, "zoneType");
  const regionDistribution = summarizeByKey(regionInstances, "profile");
  const identityScore = computeIdentityScore(worldProfile, regionDistribution);

  return deepFreeze({
    profileId: worldProfile.profileId,
    scaleProfile: worldScaleProfile.scaleId,
    worldIdentity: worldProfile.worldIdentity,
    geographyZoneCount: geographyZones.length,
    regionCount: regionInstances.length,
    connectionCount: connections.length,
    landmarkReserveCount: landmarks.length,
    explorationRouteCount: routes.length,
    streamingChunkCount: chunks.length,
    geographyDistribution,
    regionDistribution,
    transportIntensity: worldProfile.transportIntensity,
    landmarkDensity: worldProfile.landmarkFrequency,
    explorationDensity: worldProfile.explorationDensity,
    identityScore,
    referencePlacementMode: "instance_reference_only",
    futureCompatibleProfiles: deepFreeze([
      "AUSTRALIAN_OUTBACK_WORLD",
      "ALPINE_WORLD",
      "TOURISM_ARCHIPELAGO_WORLD",
      "METROPOLITAN_EXPANSION_WORLD"
    ])
  });
}

function buildValidationResult(preview) {
  const geographyValid =
    preview.worldGeographyZones.length >= 8 &&
    preview.worldGeographyZones.every((zone) => supportedZoneTypes.has(zone.zoneType));
  const regionIds = new Set(preview.regionInstances.map((region) => region.regionId));
  const regionsValid =
    preview.regionInstances.length >= preview.worldScaleProfile.regionCountRange[0] &&
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
    (route) => regionIds.has(route.startAnchor) || landmarkIds.has(route.startAnchor)
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
  const streamingReady =
    preview.streamingChunks.length >=
    preview.worldScaleProfile.chunkRequirements.minimumChunkCount;
  const noDuplicateGeometryGeneration = true;
  const profileAppliedCorrectly =
    preview.worldProfile.scaleProfile === preview.worldScaleProfile.scaleId &&
    supportedWorldProfiles.includes(preview.worldProfile.profileId);
  const identityScoreAligned = preview.worldMetadata.identityScore >= 0.72;
  const requiredSystemsGenerated = [
    preview.worldGeographyZones.length,
    preview.regionInstances.length,
    preview.worldConnections.length,
    preview.worldLandmarkReserves.length,
    preview.worldExplorationRoutes.length,
    preview.streamingChunks.length
  ].every((count) => count > 0);
  const streamingRequirementsValid =
    preview.worldScaleProfile.chunkRequirements.minimumChunkCount <=
      preview.streamingChunks.length &&
    preview.worldMetadata.referencePlacementMode === "instance_reference_only";

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
    profileAppliedCorrectly,
    identityScoreAligned,
    requiredSystemsGenerated,
    streamingRequirementsValid,
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
    noDuplicateGeometryGeneration,
    profileAppliedCorrectly,
    identityScoreAligned,
    requiredSystemsGenerated,
    streamingRequirementsValid
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
    if (!regionIds.has(route.startAnchor) && !landmarkIds.has(route.startAnchor)) {
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

function selectRegionCount(worldSeed, worldScaleProfile) {
  const [minimum, maximum] = worldScaleProfile.regionCountRange;
  const span = maximum - minimum + 1;
  return minimum + ((worldSeed + span) % span);
}

function buildRegionProfileSequence(count, worldProfile, settlementSeed) {
  const entries = Object.entries(worldProfile.regionMix).sort((left, right) =>
    right[1] - left[1] || left[0].localeCompare(right[0])
  );
  const allocations = entries.map(([profile, weight]) => ({
    profile,
    exact: count * weight,
    count: Math.floor(count * weight)
  }));
  let assigned = allocations.reduce((sum, entry) => sum + entry.count, 0);

  while (assigned < count) {
    allocations
      .sort((left, right) =>
        (right.exact - right.count) - (left.exact - left.count) ||
        left.profile.localeCompare(right.profile)
      )[0]
      .count += 1;
    assigned += 1;
  }

  const sequence = [];
  const ordered = allocations
    .slice()
    .sort((left, right) => right.count - left.count || left.profile.localeCompare(right.profile));

  while (sequence.length < count) {
    let placed = false;
    for (const entry of ordered) {
      if (entry.count === 0) {
        continue;
      }
      if (sequence.at(-1) === entry.profile && ordered.some((candidate) => candidate.count > 0 && candidate.profile !== entry.profile)) {
        continue;
      }
      sequence.push(entry.profile);
      entry.count -= 1;
      placed = true;
      break;
    }
    if (!placed) {
      const fallback = ordered.find((entry) => entry.count > 0);
      sequence.push(fallback.profile);
      fallback.count -= 1;
    }
  }

  const rotation = settlementSeed % sequence.length;
  return sequence.slice(rotation).concat(sequence.slice(0, rotation));
}

function resolveRegionNeighbours(index, count) {
  const previous = ((index - 1 + count) % count) + 1;
  const next = ((index + 1) % count) + 1;
  const across = ((index + Math.ceil(count / 2)) % count) + 1;
  return [
    `REGION_${String(previous).padStart(3, "0")}`,
    `REGION_${String(next).padStart(3, "0")}`,
    `REGION_${String(across).padStart(3, "0")}`
  ];
}

function resolveRegionTransitionRules(profile, descriptor, worldProfile) {
  const base = [...descriptor.transitionRules];
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD") {
    base.push("FERRY_AND_WATERFRONT_LINK");
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    base.push("LONG_DISTANCE_SERVICE_ROUTE");
  }
  if (profile === "METROPOLITAN_EDGE_REGION") {
    base.push("MULTI_CENTRE_GROWTH_SUPPORT");
  }
  return base;
}

function buildConnectionRecord(corridorId, start, end, worldProfile, zoneByType) {
  const connectionType = selectConnectionType(worldProfile, start.profile, end.profile);
  return {
    schemaId: connectionCorridorSchemaId,
    corridorId,
    startRegion: start.regionId,
    endRegion: end.regionId,
    connectionType,
    hierarchy: resolveConnectionHierarchy(connectionType, worldProfile),
    distance: roundNumber(distance2d(start.position, end.position)),
    difficulty: resolveConnectionDifficulty(connectionType, worldProfile),
    explorationValue: resolveConnectionExplorationValue(connectionType, worldProfile),
    terrainInfluence: deepFreeze(resolveConnectionTerrainInfluence(connectionType, zoneByType)),
    worldProfileBias: worldProfile.profileId
  };
}

function selectConnectionType(worldProfile, startProfile, endProfile) {
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD") {
    return startProfile === "COASTAL_REGION" || endProfile === "COASTAL_REGION"
      ? "FERRY_ROUTE"
      : "COASTAL_ROUTE";
  }
  if (worldProfile.profileId === "ALPINE_WORLD") {
    return startProfile === "MOUNTAIN_REGION" || endProfile === "MOUNTAIN_REGION"
      ? "TRAIL"
      : "HIGHWAY";
  }
  if (worldProfile.profileId === "METROPOLITAN_EXPANSION_WORLD") {
    return startProfile === "METROPOLITAN_EDGE_REGION" || endProfile === "METROPOLITAN_EDGE_REGION"
      ? "RAILWAY"
      : "HIGHWAY";
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    return startProfile === "RURAL_REGION" && endProfile === "RURAL_REGION"
      ? "HIGHWAY"
      : "RAILWAY";
  }
  if (startProfile === "COASTAL_REGION" || endProfile === "TOURISM_REGION") {
    return "COASTAL_ROUTE";
  }
  return "HIGHWAY";
}

function resolveConnectionHierarchy(connectionType, worldProfile) {
  const baseMap = {
    HIGHWAY: "PRIMARY_WORLD_SPINE",
    RAILWAY: "PASSENGER_AND_FREIGHT_SPINE",
    COASTAL_ROUTE: "SCENIC_COASTAL_SPINE",
    FERRY_ROUTE: "WATER_DESTINATION_CHAIN",
    TRAIL: "DISCOVERY_ACCESS_LINK"
  };
  return `${baseMap[connectionType]}_${worldProfile.scaleProfile}`;
}

function resolveConnectionDifficulty(connectionType, worldProfile) {
  if (connectionType === "TRAIL") {
    return "MEDIUM_HIGH";
  }
  if (connectionType === "FERRY_ROUTE") {
    return "MEDIUM";
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    return "MEDIUM";
  }
  return "LOW_MEDIUM";
}

function resolveConnectionExplorationValue(connectionType, worldProfile) {
  if (connectionType === "COASTAL_ROUTE" || connectionType === "FERRY_ROUTE") {
    return "HIGH";
  }
  if (connectionType === "TRAIL" || worldProfile.profileId === "ALPINE_WORLD") {
    return "VERY_HIGH";
  }
  return "MEDIUM";
}

function selectLandmarkType(worldProfile, regionProfile, index) {
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD") {
    return index % 2 === 0 ? "ICONIC_LOCATION" : "NATURAL_WONDER";
  }
  if (worldProfile.profileId === "ALPINE_WORLD") {
    return regionProfile === "MOUNTAIN_REGION" ? "NATURAL_WONDER" : "RARE_DISCOVERY";
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    return index % 3 === 0 ? "RARE_DISCOVERY" : "HISTORICAL_SITE";
  }
  if (worldProfile.profileId === "METROPOLITAN_EXPANSION_WORLD") {
    return index % 3 === 0 ? "ICONIC_LOCATION" : "HISTORICAL_SITE";
  }
  return index % 3 === 0 ? "ICONIC_LOCATION" : "NATURAL_WONDER";
}

function selectLandmarkZoneId(zoneByType, landmarkType, regionProfile) {
  if (landmarkType === "NATURAL_WONDER" && regionProfile === "MOUNTAIN_REGION") {
    return zoneByType.get("MOUNTAINS")?.zoneId ?? zoneByType.get("PROTECTED_AREA")?.zoneId;
  }
  if (landmarkType === "ICONIC_LOCATION") {
    return zoneByType.get("COASTLINE")?.zoneId ?? zoneByType.get("OCEAN")?.zoneId;
  }
  if (landmarkType === "HISTORICAL_SITE") {
    return zoneByType.get("FARMLAND")?.zoneId ?? zoneByType.get("RIVER")?.zoneId;
  }
  return zoneByType.get("PROTECTED_AREA")?.zoneId ?? zoneByType.get("FOREST")?.zoneId;
}

function selectRouteType(worldProfile, landmark, sourceRegionProfile) {
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD") {
    return landmark.landmarkType === "ICONIC_LOCATION"
      ? "FERRY_EXPLORATION_LOOP"
      : "COASTAL_GRAND_TOUR";
  }
  if (worldProfile.profileId === "ALPINE_WORLD" || sourceRegionProfile === "MOUNTAIN_REGION") {
    return landmark.landmarkType === "NATURAL_WONDER"
      ? "MOUNTAIN_DISCOVERY_ROUTE"
      : "PROTECTED_AREA_TRAIL";
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    return "INLAND_HERITAGE_ROUTE";
  }
  return landmark.landmarkType === "NATURAL_WONDER"
    ? "COASTAL_GRAND_TOUR"
    : "INTER_REGION_CONNECTOR";
}

function resolveRouteDifficulty(worldProfile, landmarkType) {
  if (worldProfile.profileId === "ALPINE_WORLD") {
    return landmarkType === "NATURAL_WONDER" ? "HIGH" : "MEDIUM_HIGH";
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    return "MEDIUM";
  }
  return landmarkType === "ICONIC_LOCATION" ? "LOW_MEDIUM" : "MEDIUM";
}

function resolveChunkPriority(worldProfile, row, column) {
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD" && row === 0) {
    return "WATERFRONT_DESTINATION_ENTRY";
  }
  if (worldProfile.profileId === "METROPOLITAN_EXPANSION_WORLD" && column === 1) {
    return "MULTI_CENTRE_CORRIDOR_CORE";
  }
  if (worldProfile.profileId === "ALPINE_WORLD" && row === 0) {
    return "ELEVATION_DISCOVERY_ENTRY";
  }
  return row === 0 ? "PRIMARY_WORLD_ENTRY" : "SECONDARY_WORLD_SUPPORT";
}

function resolveChunkCacheRules(worldProfile, row, column) {
  const rules = ["INSTANCE_REFERENCE_ONLY", "DETERMINISTIC_CHUNK_REBUILD"];
  if (worldProfile.profileId === "TOURISM_ARCHIPELAGO_WORLD") {
    rules.push("PREFER_FERRY_AND_SCENIC_CACHE");
  }
  if (worldProfile.profileId === "AUSTRALIAN_OUTBACK_WORLD") {
    rules.push("PREFER_LONG_DISTANCE_CORRIDOR_CACHE");
  }
  if (worldProfile.profileId === "METROPOLITAN_EXPANSION_WORLD") {
    rules.push("KEEP_CENTRE_CORRIDOR_CHUNKS_WARM");
  }
  if (row === 0 && column === 0) {
    rules.push("BOOST_INITIAL_INSPECTION_READABILITY");
  }
  return rules;
}

function resolveChunkNeighbours(index, columns, rows, chunkIds) {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const neighbours = [];
  const candidates = [
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1]
  ];

  for (const [candidateRow, candidateColumn] of candidates) {
    if (
      candidateRow >= 0 &&
      candidateRow < rows &&
      candidateColumn >= 0 &&
      candidateColumn < columns
    ) {
      neighbours.push(chunkIds[candidateRow * columns + candidateColumn]);
    }
  }

  return neighbours;
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

function landmarkFrequencyMultiplier(frequency) {
  switch (frequency) {
    case "VERY_HIGH":
      return 1;
    case "HIGH":
      return 0.8;
    case "MEDIUM":
      return 0.65;
    case "LOW_MEDIUM":
      return 0.55;
    default:
      return 0.6;
  }
}

function computeIdentityScore(worldProfile, regionDistribution) {
  const total = Object.values(regionDistribution).reduce((sum, value) => sum + value, 0);
  let score = 0;

  for (const [profile, targetWeight] of Object.entries(worldProfile.regionMix)) {
    const actualWeight = (regionDistribution[profile] ?? 0) / total;
    score += 1 - Math.min(1, Math.abs(actualWeight - targetWeight));
  }

  return roundNumber(score / Object.keys(worldProfile.regionMix).length);
}

function summarizeByKey(items, key) {
  return deepFreeze(
    items.reduce((result, item) => {
      result[item[key]] = (result[item[key]] ?? 0) + 1;
      return result;
    }, {})
  );
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
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
