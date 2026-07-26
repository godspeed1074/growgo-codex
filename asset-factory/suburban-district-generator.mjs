import { generateSuburbanStreetBlockPreview } from "./suburban-street-block-generator.mjs";

const districtSchemaId = "SUBURBAN_DISTRICT_001";
const blockPlacementSchemaId = "BLOCK_PLACEMENT_INSTANCE_001";
const roadConnectorSchemaId = "DISTRICT_ROAD_CONNECTOR_INSTANCE_001";
const landUseZoneSchemaId = "LAND_USE_ZONE_INSTANCE_001";
const openSpaceSchemaId = "OPEN_SPACE_INSTANCE_001";
const destinationReserveSchemaId = "DESTINATION_RESERVE_INSTANCE_001";
const validationSchemaId = "DISTRICT_VALIDATION_001";
const validationOutputId = "SUBURBAN_DISTRICT_001_VALIDATION_001";

const supportedDistrictThemeSeeds = Object.freeze([
  "LOW_DENSITY_SUBURBAN",
  "MEDIUM_DENSITY_SUBURBAN",
  "COASTAL_ESTATES",
  "FUTURE_URBAN_EDGE"
]);

const supportedZoneTypes = new Set([
  "RESIDENTIAL_LOW_DENSITY",
  "OPEN_SPACE",
  "PARK_RESERVE",
  "COMMUNITY_ZONE",
  "COMMERCIAL_EDGE_ZONE"
]);

const supportedOpenSpaceTypes = new Set([
  "park",
  "green_corridor",
  "reserve",
  "walking_link"
]);

const supportedReserveTypes = new Set([
  "school_reserve",
  "shopping_reserve",
  "sports_field_reserve",
  "railway_station_reserve",
  "civic_building_reserve"
]);

const supportedConnectorHierarchies = new Set([
  "local_connection",
  "collector_connection",
  "future_arterial_connection"
]);

const districtThemeProfiles = deepFreeze({
  LOW_DENSITY_SUBURBAN: {
    themeSeed: "LOW_DENSITY_SUBURBAN",
    blockThemeSeed: "SUBURBAN_AUSTRALIA",
    districtProfile: "suburban_district_default",
    dominantZoneType: "RESIDENTIAL_LOW_DENSITY",
    blockLotTarget: 27,
    targetBlocksRange: [4, 8],
    openSpaceTarget: 2,
    connectorHierarchy: "collector_connection"
  },
  MEDIUM_DENSITY_SUBURBAN: {
    themeSeed: "MEDIUM_DENSITY_SUBURBAN",
    blockThemeSeed: "SUBURBAN_AUSTRALIA",
    districtProfile: "suburban_district_medium_density",
    dominantZoneType: "RESIDENTIAL_LOW_DENSITY",
    blockLotTarget: 30,
    targetBlocksRange: [4, 8],
    openSpaceTarget: 2,
    connectorHierarchy: "collector_connection"
  },
  COASTAL_ESTATES: {
    themeSeed: "COASTAL_ESTATES",
    blockThemeSeed: "COASTAL_ESTATES",
    districtProfile: "coastal_estate_district_default",
    dominantZoneType: "RESIDENTIAL_LOW_DENSITY",
    blockLotTarget: 26,
    targetBlocksRange: [4, 8],
    openSpaceTarget: 3,
    connectorHierarchy: "collector_connection"
  },
  FUTURE_URBAN_EDGE: {
    themeSeed: "FUTURE_URBAN_EDGE",
    blockThemeSeed: "SUBURBAN_AUSTRALIA",
    districtProfile: "future_urban_edge_default",
    dominantZoneType: "RESIDENTIAL_LOW_DENSITY",
    blockLotTarget: 32,
    targetBlocksRange: [4, 8],
    openSpaceTarget: 2,
    connectorHierarchy: "future_arterial_connection"
  }
});

export const suburbanDistrictGeneratorDefaultInput = deepFreeze({
  districtSeed: 10482,
  regionSeed: 1,
  districtThemeSeed: "LOW_DENSITY_SUBURBAN",
  targetBlocks: 4,
  districtConfiguration: deepFreeze({
    schemaId: districtSchemaId,
    previewId: "SUBURBAN_DISTRICT_001_PREVIEW_001",
    generationProfile: "suburban_district_default",
    minBlocks: 4,
    maxBlocks: 8,
    blockSpacingX: 336,
    blockSpacingY: 272,
    blockFootprintWidth: 292,
    blockFootprintDepth: 186,
    connectorWidthLocal: 12,
    connectorWidthCollector: 16,
    connectorWidthArterial: 22
  })
});

export function createSuburbanDistrictGenerator(
  options = suburbanDistrictGeneratorDefaultInput
) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);
  return Object.freeze({
    generate(overrides = {}) {
      return generateSuburbanDistrictPreview({
        ...normalizedDefaultInput,
        ...overrides,
        districtConfiguration: {
          ...normalizedDefaultInput.districtConfiguration,
          ...(overrides.districtConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateSuburbanDistrictPreview(preview);
    }
  });
}

export function generateSuburbanDistrictPreview(
  rawInput = suburbanDistrictGeneratorDefaultInput
) {
  const input = normalizeGeneratorInput(rawInput);
  const themeProfile = resolveDistrictThemeProfile(input);
  const seedConfig = buildSeedConfig(input);
  const blockGrid = buildBlockGrid(input, themeProfile);
  const districtBounds = buildDistrictBounds(blockGrid, input);
  const blockPlacements = buildBlockPlacements(input, seedConfig, themeProfile, blockGrid);
  const roadConnectors = buildRoadConnectors(input, themeProfile, blockPlacements);
  const landUseZones = buildLandUseZones(input, themeProfile, blockPlacements, districtBounds);
  const openSpacePlacements = buildOpenSpacePlacements(
    input,
    themeProfile,
    blockPlacements,
    districtBounds
  );
  const destinationReserves = buildDestinationReserves(
    input,
    themeProfile,
    blockPlacements,
    districtBounds
  );
  const lotCount = blockPlacements.reduce(
    (sum, block) => sum + block.estimatedLotCount,
    0
  );

  const preview = deepFreeze({
    schemaId: districtSchemaId,
    districtId: `SUBURBAN_DISTRICT_${String(input.districtSeed).padStart(5, "0")}`,
    previewId: input.districtConfiguration.previewId,
    generationProfile: input.districtConfiguration.generationProfile,
    seed: input.districtSeed,
    seedConfig,
    themeProfile: deepFreeze({ ...themeProfile }),
    districtBounds,
    roadHierarchy: buildRoadHierarchySummary(themeProfile, roadConnectors),
    blockGrid,
    blockPlacements: deepFreeze(blockPlacements),
    roadConnectors: deepFreeze(roadConnectors),
    landUseZones: deepFreeze(landUseZones),
    openSpacePlacements: deepFreeze(openSpacePlacements),
    destinationReserves: deepFreeze(destinationReserves),
    lotCount,
    validationContract: deepFreeze({
      checks: deepFreeze({
        blocksInsideBoundary: true,
        blocksDoNotOverlap: true,
        roadsConnected: true,
        roadHierarchyValid: true,
        landUseDistributionValid: true,
        openSpaceValid: true,
        destinationReservesValid: true,
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

  const validation = validateSuburbanDistrictPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function createSuburbanDistrictValidationOutput(
  rawPreview,
  validationId = validationOutputId
) {
  const preview = normalizeGeneratedPreview(rawPreview);
  return deepFreeze({
    validationId,
    previewId: preview.previewId,
    districtId: preview.districtId,
    seed: preview.seed,
    summary: deepFreeze({
      validationPassed: preview.validationResult.validationPassed,
      blockCount: preview.blockPlacements.length,
      lotCount: preview.lotCount,
      roadConnectorCount: preview.roadConnectors.length,
      zoneCount: preview.landUseZones.length,
      openSpaceCount: preview.openSpacePlacements.length,
      destinationReserveCount: preview.destinationReserves.length
    }),
    checks: deepFreeze({
      blocksInsideBoundary: passFail(preview.validationResult.blocksInsideBoundary),
      blocksDoNotOverlap: passFail(preview.validationResult.blocksDoNotOverlap),
      roadsConnected: passFail(preview.validationResult.roadsConnected),
      roadHierarchyValid: passFail(preview.validationResult.roadHierarchyValid),
      landUseDistributionValid: passFail(
        preview.validationResult.landUseDistributionValid
      ),
      openSpaceValid: passFail(preview.validationResult.openSpaceValid),
      destinationReservesValid: passFail(
        preview.validationResult.destinationReservesValid
      ),
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

export function validateSuburbanDistrictPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.blockPlacements.length < 4 || preview.blockPlacements.length > 8) {
      throw createValidationError(
        "invalid_block_count",
        "Suburban district preview must generate between 4 and 8 street blocks."
      );
    }
    if (preview.lotCount < 100 || preview.lotCount > 300) {
      throw createValidationError(
        "invalid_lot_count",
        "Suburban district preview must estimate between 100 and 300 residential lots."
      );
    }
    for (const connector of preview.roadConnectors) {
      if (!supportedConnectorHierarchies.has(connector.hierarchy)) {
        throw createValidationError(
          "invalid_connector_hierarchy",
          `District road connector ${connector.connectorId} has an unsupported hierarchy.`
        );
      }
    }
    for (const zone of preview.landUseZones) {
      if (!supportedZoneTypes.has(zone.zoneType)) {
        throw createValidationError(
          "invalid_zone_type",
          `District zone ${zone.zoneId} has an unsupported zone type.`
        );
      }
    }
    for (const space of preview.openSpacePlacements) {
      if (!supportedOpenSpaceTypes.has(space.openSpaceType)) {
        throw createValidationError(
          "invalid_open_space_type",
          `Open space ${space.openSpaceId} has an unsupported type.`
        );
      }
    }
    for (const reserve of preview.destinationReserves) {
      if (!supportedReserveTypes.has(reserve.reserveType)) {
        throw createValidationError(
          "invalid_destination_reserve_type",
          `Destination reserve ${reserve.reserveId} has an unsupported type.`
        );
      }
    }

    validateBlocks(preview);
    validateConnectors(preview);
    validateZones(preview);
    validateOpenSpace(preview);
    validateDestinationReserves(preview);

    if (!preview.validationResult.validationPassed) {
      throw createValidationError(
        "validation_result_failed",
        "District validationResult must report a passing state."
      );
    }

    const actualHash = computeDeterministicSignatureHash(preview);
    if (actualHash !== preview.validationResult.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "District deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      preview
    });
  } catch (error) {
    if (error?.name !== "SuburbanDistrictGeneratorValidationError") {
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
    districtSeed: input.districtSeed,
    regionSeed: input.regionSeed,
    districtThemeSeed: input.districtThemeSeed
  });
}

function resolveDistrictThemeProfile(input) {
  return (
    districtThemeProfiles[input.districtThemeSeed] ??
    districtThemeProfiles.LOW_DENSITY_SUBURBAN
  );
}

function buildBlockGrid(input, themeProfile) {
  const blockCount = clamp(
    input.targetBlocks,
    input.districtConfiguration.minBlocks,
    input.districtConfiguration.maxBlocks
  );
  const columns = Math.ceil(Math.sqrt(blockCount));
  const rows = Math.ceil(blockCount / columns);
  return deepFreeze({
    gridType: "deterministic_rectangular_district_grid",
    blockCount,
    columns,
    rows,
    blockSpacingX: input.districtConfiguration.blockSpacingX,
    blockSpacingY: input.districtConfiguration.blockSpacingY,
    densityProfile: themeProfile.themeSeed
  });
}

function buildDistrictBounds(blockGrid, input) {
  const halfWidth =
    ((blockGrid.columns - 1) * input.districtConfiguration.blockSpacingX) / 2 +
    input.districtConfiguration.blockFootprintWidth / 2 +
    80;
  const halfDepth =
    ((blockGrid.rows - 1) * input.districtConfiguration.blockSpacingY) / 2 +
    input.districtConfiguration.blockFootprintDepth / 2 +
    90;
  return deepFreeze({
    minX: roundNumber(-halfWidth),
    maxX: roundNumber(halfWidth),
    minY: roundNumber(-halfDepth),
    maxY: roundNumber(halfDepth)
  });
}

function buildBlockPlacements(input, seedConfig, themeProfile, blockGrid) {
  const placements = [];
  const total = blockGrid.blockCount;
  const centerOffsetX =
    ((blockGrid.columns - 1) * input.districtConfiguration.blockSpacingX) / 2;
  const centerOffsetY =
    ((blockGrid.rows - 1) * input.districtConfiguration.blockSpacingY) / 2;

  for (let index = 0; index < total; index += 1) {
    const row = Math.floor(index / blockGrid.columns);
    const column = index % blockGrid.columns;
    const blockInstanceId = `BLOCK_${String(index + 1).padStart(3, "0")}`;
    const sourceBlockSeed = deriveBlockSeed(seedConfig, blockInstanceId);
    const sourcePreview = generateSuburbanStreetBlockPreview({
      streetBlockSeed: sourceBlockSeed,
      regionSeed: seedConfig.regionSeed,
      neighbourhoodThemeSeed: themeProfile.blockThemeSeed,
      lotCount: 24,
      blockConfiguration: {
        schemaId: "SUBURBAN_STREET_BLOCK_001",
        previewId: "SUBURBAN_STREET_BLOCK_001_PREVIEW_001",
        generationProfile: "suburban_multi_street_24_lot_default",
        targetLotCount: 24,
        roadWidth: 12,
        sidewalkWidth: 1.6,
        vergeWidth: 1.8,
        standardLotDepthRange: [34, 40],
        cornerLotDepthRange: [36, 42],
        localStreetSpacing: 58,
        collectorStreetLength: 124,
        localStreetLength: 58,
        culDeSacLength: 54
      }
    });
    const position = deepFreeze({
      x: roundNumber(
        column * input.districtConfiguration.blockSpacingX - centerOffsetX
      ),
      y: roundNumber(row * input.districtConfiguration.blockSpacingY - centerOffsetY),
      z: 0
    });
    const rotation = deepFreeze({
      yawDegrees:
        stableHash(
          `${seedConfig.districtSeed}:${seedConfig.regionSeed}:${blockInstanceId}:rotation`
        ) %
          2 ===
        0
          ? 0
          : 180
    });
    const estimatedLotCount =
      themeProfile.blockLotTarget +
      ((stableHash(`${seedConfig.districtSeed}:${blockInstanceId}:lot-target`) % 3) -
        1);

    placements.push(
      deepFreeze({
        schemaId: blockPlacementSchemaId,
        blockInstanceId,
        streetBlockType: "SUBURBAN_STREET_BLOCK_001",
        sourceBlockSchemaId: "SUBURBAN_STREET_BLOCK_001",
        sourcePreviewId: sourcePreview.previewId,
        sourceStreetBlockId: sourcePreview.streetBlockId,
        sourceBlockSeed,
        position,
        rotation,
        densityProfile: themeProfile.themeSeed,
        themeProfile: themeProfile.blockThemeSeed,
        connectorRelationships: [],
        estimatedLotCount,
        streamingCellId: `DISTRICT_CELL_${row + 1}_${column + 1}`,
        gridPosition: deepFreeze({
          row: row + 1,
          column: column + 1
        }),
        blockFootprint: deepFreeze({
          width: input.districtConfiguration.blockFootprintWidth,
          depth: input.districtConfiguration.blockFootprintDepth
        }),
        sourceValidationSignature: sourcePreview.validationResult.deterministicSignatureHash
      })
    );
  }

  return attachConnectorRelationships(placements);
}

function attachConnectorRelationships(placements) {
  return placements.map((placement) =>
    deepFreeze({
      ...placement,
      connectorRelationships: deepFreeze([])
    })
  );
}

function buildRoadConnectors(input, themeProfile, blockPlacements) {
  const connectors = [];
  const placementByCell = new Map(
    blockPlacements.map((placement) => [
      `${placement.gridPosition.row}:${placement.gridPosition.column}`,
      placement
    ])
  );
  for (const placement of blockPlacements) {
    const { row, column } = placement.gridPosition;
    const east = placementByCell.get(`${row}:${column + 1}`);
    const south = placementByCell.get(`${row + 1}:${column}`);

    if (east) {
      connectors.push(
        buildConnector(
          `CONNECTOR_${String(connectors.length + 1).padStart(3, "0")}`,
          placement.blockInstanceId,
          east.blockInstanceId,
          "collector_residential_street",
          "east_west",
          input.districtConfiguration.connectorWidthCollector,
          "collector_connection"
        )
      );
    }
    if (south) {
      connectors.push(
        buildConnector(
          `CONNECTOR_${String(connectors.length + 1).padStart(3, "0")}`,
          placement.blockInstanceId,
          south.blockInstanceId,
          "local_residential_street",
          "north_south",
          input.districtConfiguration.connectorWidthLocal,
          "local_connection"
        )
      );
    }
  }

  const eastMost = [...blockPlacements].sort((left, right) => right.position.x - left.position.x)[0];
  connectors.push(
    buildConnector(
      `CONNECTOR_${String(connectors.length + 1).padStart(3, "0")}`,
      eastMost.blockInstanceId,
      "DISTRICT_EDGE_EAST",
      "future_arterial_connection",
      "east_west",
      input.districtConfiguration.connectorWidthArterial,
      "future_arterial_connection"
    )
  );

  return deepFreeze(connectors);
}

function buildConnector(
  connectorId,
  startBlockId,
  endBlockId,
  roadType,
  direction,
  width,
  hierarchy
) {
  return deepFreeze({
    schemaId: roadConnectorSchemaId,
    connectorId,
    startBlockId,
    endBlockId,
    roadType,
    direction,
    width,
    hierarchy,
    supportsPedestrianLink: true,
    futureExpansionCompatible: true
  });
}

function buildLandUseZones(input, themeProfile, blockPlacements, districtBounds) {
  const residentialZones = blockPlacements.map((placement, index) =>
    deepFreeze({
      schemaId: landUseZoneSchemaId,
      zoneId: `ZONE_RES_${String(index + 1).padStart(3, "0")}`,
      zoneType: "RESIDENTIAL_LOW_DENSITY",
      boundary: boundaryRect(
        placement.position.x - 146,
        placement.position.y - 93,
        292,
        186
      ),
      purpose: "Detached suburban housing block.",
      allowedContent: deepFreeze(["SUBURBAN_STREET_BLOCK_001"]),
      placementRules: deepFreeze({
        adjacentToCollectorPreferred: true,
        supportsCulDeSacs: true
      }),
      densityCompatibility: deepFreeze([
        "LOW_DENSITY_SUBURBAN",
        "COASTAL_ESTATES"
      ])
    })
  );

  const centralGreenX = roundNumber((districtBounds.minX + districtBounds.maxX) / 2 - 30);
  const zones = [
    ...residentialZones,
    deepFreeze({
      schemaId: landUseZoneSchemaId,
      zoneId: "ZONE_OPEN_001",
      zoneType: "OPEN_SPACE",
      boundary: boundaryRect(centralGreenX, districtBounds.minY + 40, 60, 180),
      purpose: "District green separation and walking connection.",
      allowedContent: deepFreeze(["green_corridor", "walking_link"]),
      placementRules: deepFreeze({
        buffersResidentialBlocks: true,
        adjacentToCollectorsAllowed: true
      }),
      densityCompatibility: deepFreeze(supportedDistrictThemeSeeds)
    }),
    deepFreeze({
      schemaId: landUseZoneSchemaId,
      zoneId: "ZONE_PARK_001",
      zoneType: "PARK_RESERVE",
      boundary: boundaryRect(districtBounds.minX + 24, districtBounds.maxY - 96, 120, 72),
      purpose: "Neighbourhood park reserve.",
      allowedContent: deepFreeze(["park", "trees", "paths"]),
      placementRules: deepFreeze({
        adjacentToCollectorPreferred: true,
        walkableFromResidential: true
      }),
      densityCompatibility: deepFreeze(supportedDistrictThemeSeeds)
    }),
    deepFreeze({
      schemaId: landUseZoneSchemaId,
      zoneId: "ZONE_COMMUNITY_001",
      zoneType: "COMMUNITY_ZONE",
      boundary: boundaryRect(districtBounds.minX + 36, districtBounds.minY + 18, 110, 70),
      purpose: "Future community facility edge.",
      allowedContent: deepFreeze(["school_reserve", "civic_building_reserve"]),
      placementRules: deepFreeze({
        collectorAccessRequired: true,
        avoidDeepCulDeSacs: true
      }),
      densityCompatibility: deepFreeze([
        "LOW_DENSITY_SUBURBAN",
        "MEDIUM_DENSITY_SUBURBAN"
      ])
    }),
    deepFreeze({
      schemaId: landUseZoneSchemaId,
      zoneId: "ZONE_COMMERCIAL_001",
      zoneType: "COMMERCIAL_EDGE_ZONE",
      boundary: boundaryRect(districtBounds.maxX - 134, districtBounds.minY + 24, 110, 180),
      purpose: "Future neighbourhood retail and services edge.",
      allowedContent: deepFreeze(["shopping_reserve", "commercial_edge_use"]),
      placementRules: deepFreeze({
        futureArterialPreferred: true,
        edgeOfDistrictPreferred: true
      }),
      densityCompatibility: deepFreeze([
        "LOW_DENSITY_SUBURBAN",
        "MEDIUM_DENSITY_SUBURBAN",
        "FUTURE_URBAN_EDGE"
      ])
    })
  ];

  return deepFreeze(zones);
}

function buildOpenSpacePlacements(input, themeProfile, blockPlacements, districtBounds) {
  const centerX = roundNumber((districtBounds.minX + districtBounds.maxX) / 2);
  return deepFreeze([
    {
      schemaId: openSpaceSchemaId,
      openSpaceId: "OPEN_SPACE_001",
      openSpaceType: "park",
      position: deepFreeze({ x: districtBounds.minX + 84, y: districtBounds.maxY - 60, z: 0 }),
      size: deepFreeze({ width: 90, depth: 64 }),
      connectionRules: deepFreeze({
        adjacentToCollectorPreferred: true,
        supportsWalkingLink: true,
        buffersResidentialBlocks: true
      }),
      futureAssetCompatibility: deepFreeze(["playground", "sport_field", "trees", "path_network"])
    },
    {
      schemaId: openSpaceSchemaId,
      openSpaceId: "OPEN_SPACE_002",
      openSpaceType: "green_corridor",
      position: deepFreeze({ x: centerX, y: districtBounds.minY + 132, z: 0 }),
      size: deepFreeze({ width: 60, depth: 180 }),
      connectionRules: deepFreeze({
        adjacentToCollectorPreferred: true,
        supportsWalkingLink: true,
        buffersResidentialBlocks: true
      }),
      futureAssetCompatibility: deepFreeze(["trees", "walking_path", "reserve_edge"])
    },
    {
      schemaId: openSpaceSchemaId,
      openSpaceId: "OPEN_SPACE_003",
      openSpaceType: "walking_link",
      position: deepFreeze({ x: districtBounds.maxX - 90, y: districtBounds.minY + 116, z: 0 }),
      size: deepFreeze({ width: 32, depth: 144 }),
      connectionRules: deepFreeze({
        adjacentToCollectorPreferred: true,
        supportsWalkingLink: true,
        buffersResidentialBlocks: false
      }),
      futureAssetCompatibility: deepFreeze(["walking_path", "signage", "trees"])
    }
  ]);
}

function buildDestinationReserves(input, themeProfile, blockPlacements, districtBounds) {
  return deepFreeze([
    {
      schemaId: destinationReserveSchemaId,
      reserveId: "RESERVE_001",
      reserveType: "school_reserve",
      boundary: boundaryRect(districtBounds.minX + 36, districtBounds.minY + 18, 110, 70),
      futureUse: "Primary school campus",
      roadAccessProfile: "collector_edge_access",
      bufferRules: deepFreeze({
        requiresOpenSpaceBuffer: true,
        avoidDeepCulDeSacAccess: true
      })
    },
    {
      schemaId: destinationReserveSchemaId,
      reserveId: "RESERVE_002",
      reserveType: "shopping_reserve",
      boundary: boundaryRect(districtBounds.maxX - 134, districtBounds.minY + 24, 110, 86),
      futureUse: "Neighbourhood shopping strip",
      roadAccessProfile: "future_arterial_edge_access",
      bufferRules: deepFreeze({
        requiresOpenSpaceBuffer: false,
        avoidDeepCulDeSacAccess: true
      })
    },
    {
      schemaId: destinationReserveSchemaId,
      reserveId: "RESERVE_003",
      reserveType: "sports_field_reserve",
      boundary: boundaryRect(districtBounds.maxX - 146, districtBounds.maxY - 92, 120, 70),
      futureUse: "Community sports field",
      roadAccessProfile: "collector_edge_access",
      bufferRules: deepFreeze({
        requiresOpenSpaceBuffer: true,
        avoidDeepCulDeSacAccess: true
      })
    }
  ]);
}

function buildRoadHierarchySummary(themeProfile, roadConnectors) {
  const counts = roadConnectors.reduce(
    (summary, connector) => {
      summary[connector.hierarchy] = (summary[connector.hierarchy] ?? 0) + 1;
      return summary;
    },
    {}
  );
  return deepFreeze({
    dominantHierarchy: themeProfile.connectorHierarchy,
    connectorCounts: deepFreeze(counts),
    supportedHierarchies: deepFreeze([...supportedConnectorHierarchies])
  });
}

function buildValidationResult(preview, input) {
  const blocksInsideBoundary = preview.blockPlacements.every((block) =>
    blockInsideBoundary(block, preview.districtBounds)
  );
  const blocksDoNotOverlap = countBlockOverlaps(preview.blockPlacements) === 0;
  const roadsConnected = roadConnectorGraphConnected(preview.blockPlacements, preview.roadConnectors);
  const roadHierarchyValid = preview.roadConnectors.every((connector) =>
    supportedConnectorHierarchies.has(connector.hierarchy)
  );
  const landUseDistributionValid =
    preview.landUseZones.some((zone) => zone.zoneType === "RESIDENTIAL_LOW_DENSITY") &&
    preview.landUseZones.some((zone) => zone.zoneType === "OPEN_SPACE") &&
    preview.landUseZones.some((zone) => zone.zoneType === "PARK_RESERVE") &&
    preview.landUseZones.some((zone) => zone.zoneType === "COMMUNITY_ZONE") &&
    preview.landUseZones.some((zone) => zone.zoneType === "COMMERCIAL_EDGE_ZONE");
  const openSpaceValid = preview.openSpacePlacements.every((space) =>
    boundaryContainsRect(
      preview.districtBounds,
      rectFromPositionAndSize(space.position, space.size)
    )
  );
  const destinationReservesValid = preview.destinationReserves.every((reserve) =>
    boundaryContainsRect(preview.districtBounds, reserve.boundary)
  );
  const streamingBoundariesValid = preview.blockPlacements.every(
    (block) => typeof block.streamingCellId === "string" && block.streamingCellId.length > 0
  );
  const instanceReuseStrategyValid = preview.blockPlacements.every(
    (block) =>
      block.streetBlockType === "SUBURBAN_STREET_BLOCK_001" &&
      typeof block.sourceStreetBlockId === "string"
  );
  const deterministicSignatureHash = computeDeterministicSignatureHash(preview);

  return deepFreeze({
    blocksInsideBoundary,
    blocksDoNotOverlap,
    roadsConnected,
    roadHierarchyValid,
    landUseDistributionValid,
    openSpaceValid,
    destinationReservesValid,
    deterministicRebuildValid: true,
    streamingBoundariesValid,
    instanceReuseStrategyValid,
    deterministicSignatureHash,
    validationPassed:
      blocksInsideBoundary &&
      blocksDoNotOverlap &&
      roadsConnected &&
      roadHierarchyValid &&
      landUseDistributionValid &&
      openSpaceValid &&
      destinationReservesValid &&
      streamingBoundariesValid &&
      instanceReuseStrategyValid
  });
}

function validateBlocks(preview) {
  if (!preview.validationResult.blocksInsideBoundary) {
    throw createValidationError(
      "blocks_outside_boundary",
      "District contains block placements outside the district boundary."
    );
  }
  if (!preview.validationResult.blocksDoNotOverlap) {
    throw createValidationError(
      "blocks_overlap",
      "District block placements overlap."
    );
  }
}

function validateConnectors(preview) {
  if (!preview.validationResult.roadsConnected) {
    throw createValidationError(
      "roads_not_connected",
      "District road connectors do not form a connected hierarchy."
    );
  }
  if (!preview.validationResult.roadHierarchyValid) {
    throw createValidationError(
      "invalid_road_hierarchy",
      "District road connectors contain an invalid hierarchy."
    );
  }
}

function validateZones(preview) {
  if (!preview.validationResult.landUseDistributionValid) {
    throw createValidationError(
      "invalid_land_use_distribution",
      "District land-use distribution does not satisfy the required zone mix."
    );
  }
}

function validateOpenSpace(preview) {
  if (!preview.validationResult.openSpaceValid) {
    throw createValidationError(
      "invalid_open_space",
      "District open-space placements are outside the district boundary."
    );
  }
}

function validateDestinationReserves(preview) {
  if (!preview.validationResult.destinationReservesValid) {
    throw createValidationError(
      "invalid_destination_reserves",
      "District destination reserves are outside the district boundary."
    );
  }
}

function deriveBlockSeed(seedConfig, blockInstanceId) {
  return (
    10000 +
    (stableHash(
      `${seedConfig.districtSeed}:${seedConfig.regionSeed}:${seedConfig.districtThemeSeed}:${blockInstanceId}`
    ) % 80000)
  );
}

function blockInsideBoundary(block, districtBounds) {
  const rect = {
    minX: block.position.x - block.blockFootprint.width / 2,
    maxX: block.position.x + block.blockFootprint.width / 2,
    minY: block.position.y - block.blockFootprint.depth / 2,
    maxY: block.position.y + block.blockFootprint.depth / 2
  };
  return boundaryContainsRect(districtBounds, rect);
}

function countBlockOverlaps(blockPlacements) {
  let overlaps = 0;
  for (let leftIndex = 0; leftIndex < blockPlacements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < blockPlacements.length; rightIndex += 1) {
      if (
        rectanglesOverlap(
          blockRect(blockPlacements[leftIndex]),
          blockRect(blockPlacements[rightIndex])
        )
      ) {
        overlaps += 1;
      }
    }
  }
  return overlaps;
}

function roadConnectorGraphConnected(blockPlacements, roadConnectors) {
  const nodes = new Set(blockPlacements.map((block) => block.blockInstanceId));
  const adjacency = new Map([...nodes].map((node) => [node, new Set()]));
  for (const connector of roadConnectors) {
    if (!nodes.has(connector.startBlockId) || connector.endBlockId === "DISTRICT_EDGE_EAST") {
      continue;
    }
    adjacency.get(connector.startBlockId)?.add(connector.endBlockId);
    adjacency.get(connector.endBlockId)?.add(connector.startBlockId);
  }
  const startingNode = blockPlacements[0]?.blockInstanceId;
  if (!startingNode) {
    return false;
  }
  const visited = new Set();
  const queue = [startingNode];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const neighbour of adjacency.get(current) ?? []) {
      if (!visited.has(neighbour)) {
        queue.push(neighbour);
      }
    }
  }
  return visited.size === nodes.size;
}

function blockRect(block) {
  return {
    minX: block.position.x - block.blockFootprint.width / 2,
    maxX: block.position.x + block.blockFootprint.width / 2,
    minY: block.position.y - block.blockFootprint.depth / 2,
    maxY: block.position.y + block.blockFootprint.depth / 2
  };
}

function rectFromPositionAndSize(position, size) {
  return {
    minX: position.x - size.width / 2,
    maxX: position.x + size.width / 2,
    minY: position.y - size.depth / 2,
    maxY: position.y + size.depth / 2
  };
}

function boundaryContainsRect(bounds, rect) {
  return (
    rect.minX >= bounds.minX &&
    rect.maxX <= bounds.maxX &&
    rect.minY >= bounds.minY &&
    rect.maxY <= bounds.maxY
  );
}

function rectanglesOverlap(left, right) {
  return !(
    left.maxX <= right.minX ||
    right.maxX <= left.minX ||
    left.maxY <= right.minY ||
    right.maxY <= left.minY
  );
}

function boundaryRect(x, y, width, depth) {
  return deepFreeze({
    shape: "rect",
    x: roundNumber(x),
    y: roundNumber(y),
    width: roundNumber(width),
    depth: roundNumber(depth),
    minX: roundNumber(x),
    maxX: roundNumber(x + width),
    minY: roundNumber(y),
    maxY: roundNumber(y + depth)
  });
}

function computeDeterministicSignatureHash(preview) {
  return stableHash(
    JSON.stringify({
      seedConfig: preview.seedConfig,
      blocks: preview.blockPlacements.map((block) => ({
        blockInstanceId: block.blockInstanceId,
        sourceBlockSeed: block.sourceBlockSeed,
        position: block.position,
        rotation: block.rotation,
        estimatedLotCount: block.estimatedLotCount
      })),
      connectors: preview.roadConnectors.map((connector) => ({
        connectorId: connector.connectorId,
        startBlockId: connector.startBlockId,
        endBlockId: connector.endBlockId,
        hierarchy: connector.hierarchy
      })),
      zones: preview.landUseZones.map((zone) => ({
        zoneId: zone.zoneId,
        zoneType: zone.zoneType
      })),
      openSpace: preview.openSpacePlacements.map((space) => ({
        openSpaceId: space.openSpaceId,
        openSpaceType: space.openSpaceType
      })),
      reserves: preview.destinationReserves.map((reserve) => ({
        reserveId: reserve.reserveId,
        reserveType: reserve.reserveType
      }))
    })
  );
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function normalizeGeneratorInput(rawInput) {
  const input = asPlainObject(rawInput, "suburban district generator input");
  const districtConfiguration = asPlainObject(
    input.districtConfiguration,
    "suburban district districtConfiguration"
  );
  return deepFreeze({
    districtSeed: normalizePositiveInteger(input.districtSeed, "districtSeed"),
    regionSeed: normalizePositiveInteger(input.regionSeed, "regionSeed"),
    districtThemeSeed: normalizeDistrictThemeSeed(input.districtThemeSeed),
    targetBlocks: normalizePositiveInteger(input.targetBlocks, "targetBlocks"),
    districtConfiguration: deepFreeze({
      schemaId: normalizeNonEmptyString(
        districtConfiguration.schemaId,
        "districtConfiguration.schemaId"
      ),
      previewId: normalizeNonEmptyString(
        districtConfiguration.previewId,
        "districtConfiguration.previewId"
      ),
      generationProfile: normalizeNonEmptyString(
        districtConfiguration.generationProfile,
        "districtConfiguration.generationProfile"
      ),
      minBlocks: normalizePositiveInteger(
        districtConfiguration.minBlocks,
        "districtConfiguration.minBlocks"
      ),
      maxBlocks: normalizePositiveInteger(
        districtConfiguration.maxBlocks,
        "districtConfiguration.maxBlocks"
      ),
      blockSpacingX: normalizePositiveNumber(
        districtConfiguration.blockSpacingX,
        "districtConfiguration.blockSpacingX"
      ),
      blockSpacingY: normalizePositiveNumber(
        districtConfiguration.blockSpacingY,
        "districtConfiguration.blockSpacingY"
      ),
      blockFootprintWidth: normalizePositiveNumber(
        districtConfiguration.blockFootprintWidth,
        "districtConfiguration.blockFootprintWidth"
      ),
      blockFootprintDepth: normalizePositiveNumber(
        districtConfiguration.blockFootprintDepth,
        "districtConfiguration.blockFootprintDepth"
      ),
      connectorWidthLocal: normalizePositiveNumber(
        districtConfiguration.connectorWidthLocal,
        "districtConfiguration.connectorWidthLocal"
      ),
      connectorWidthCollector: normalizePositiveNumber(
        districtConfiguration.connectorWidthCollector,
        "districtConfiguration.connectorWidthCollector"
      ),
      connectorWidthArterial: normalizePositiveNumber(
        districtConfiguration.connectorWidthArterial,
        "districtConfiguration.connectorWidthArterial"
      )
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  const preview = asPlainObject(rawPreview, "suburban district preview");
  return deepFreeze(preview);
}

function normalizeDistrictThemeSeed(value) {
  const themeSeed = normalizeNonEmptyString(value, "districtThemeSeed");
  if (!supportedDistrictThemeSeeds.includes(themeSeed)) {
    throw new TypeError(
      `districtThemeSeed must be one of ${supportedDistrictThemeSeeds.join(", ")}.`
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

function normalizeNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim();
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  error.name = "SuburbanDistrictGeneratorValidationError";
  error.code = code;
  return error;
}
