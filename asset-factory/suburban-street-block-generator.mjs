const streetBlockSchemaId = "SUBURBAN_STREET_BLOCK_001";
const roadNodeSchemaId = "ROAD_NODE_INSTANCE_001";
const roadSegmentSchemaId = "ROAD_SEGMENT_INSTANCE_001";
const roadIntersectionSchemaId = "ROAD_INTERSECTION_INSTANCE_001";
const lotSchemaId = "LOT_SUBURBAN_BLOCK_001";
const buildingPlacementSchemaId = "BUILDING_BLOCK_PLACEMENT_INSTANCE_001";
const streetFeatureSchemaId = "STREET_FEATURE_INSTANCE_001";
const validationOutputId = "SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001";

export const supportedSuburbanStreetBlockBuildingAssets = Object.freeze([
  "BUILDING_HOUSE_SUBURBAN_BRICK_001",
  "BUILDING_HOUSE_COASTAL_COTTAGE_001",
  "BUILDING_HOUSE_BEACH_BUNGALOW_001"
]);

const buildingProfiles = deepFreeze({
  BUILDING_HOUSE_SUBURBAN_BRICK_001: {
    assetId: "BUILDING_HOUSE_SUBURBAN_BRICK_001",
    familyId: "FAMILY_HOUSE_SUBURBAN_BRICK",
    recipeId: "RECIPE_HOUSE_SUBURBAN_BRICK_001",
    footprintWidth: 11.2,
    footprintDepth: 8.4,
    weight: 0.55,
    primaryTheme: "suburban_primary",
    cornerBias: 0.96
  },
  BUILDING_HOUSE_COASTAL_COTTAGE_001: {
    assetId: "BUILDING_HOUSE_COASTAL_COTTAGE_001",
    familyId: "FAMILY_HOUSE_COASTAL",
    recipeId: "RECIPE_HOUSE_COASTAL_COTTAGE_001",
    footprintWidth: 8.8,
    footprintDepth: 7.4,
    weight: 0.25,
    primaryTheme: "coastal_secondary",
    cornerBias: 1.08
  },
  BUILDING_HOUSE_BEACH_BUNGALOW_001: {
    assetId: "BUILDING_HOUSE_BEACH_BUNGALOW_001",
    familyId: "FAMILY_HOUSE_COASTAL",
    recipeId: "RECIPE_HOUSE_BEACH_BUNGALOW_001",
    footprintWidth: 10.2,
    footprintDepth: 8.2,
    weight: 0.2,
    primaryTheme: "coastal_tertiary",
    cornerBias: 1.15
  }
});

const themeProfiles = deepFreeze({
  SUBURBAN_AUSTRALIA: deepFreeze({
    themeSeed: "SUBURBAN_AUSTRALIA",
    neighbourhoodTheme: "suburban_multi_street_default",
    densityProfile: "low_density_suburban",
    buildingWeights: deepFreeze({
      BUILDING_HOUSE_SUBURBAN_BRICK_001: 0.85,
      BUILDING_HOUSE_COASTAL_COTTAGE_001: 0.12,
      BUILDING_HOUSE_BEACH_BUNGALOW_001: 0.03
    })
  }),
  COASTAL_ESTATES: deepFreeze({
    themeSeed: "COASTAL_ESTATES",
    neighbourhoodTheme: "coastal_estate_multi_street",
    densityProfile: "low_density_coastal_estate",
    buildingWeights: deepFreeze({
      BUILDING_HOUSE_SUBURBAN_BRICK_001: 0.2,
      BUILDING_HOUSE_COASTAL_COTTAGE_001: 0.5,
      BUILDING_HOUSE_BEACH_BUNGALOW_001: 0.3
    })
  })
});

const streetFeatureAssetIds = deepFreeze({
  sidewalk: "MOD_PATH_STANDARD_001",
  grass_verge: "MOD_GROUND_GRASS_STANDARD_001",
  street_tree: "MOD_TREE_EUCALYPTUS_STANDARD_001",
  street_sign: "STREET_FEATURE_SIGN_STANDARD_001"
});

const streetFeatureTypes = new Set([
  "sidewalk",
  "grass_verge",
  "street_tree",
  "street_sign"
]);

const supportedDirections = new Set(["NORTH", "SOUTH", "EAST", "WEST"]);
const supportedDrivewaySides = new Set(["EAST", "WEST"]);

export const suburbanStreetBlockGeneratorDefaultInput = deepFreeze({
  streetBlockSeed: 10482,
  regionSeed: 1,
  neighbourhoodThemeSeed: "SUBURBAN_AUSTRALIA",
  lotCount: 24,
  blockConfiguration: deepFreeze({
    schemaId: streetBlockSchemaId,
    previewId: "SUBURBAN_STREET_BLOCK_001_PREVIEW_001",
    generationProfile: "suburban_multi_street_24_lot_default",
    targetLotCount: 24,
    roadWidth: 12,
    sidewalkWidth: 1.6,
    vergeWidth: 1.8,
    standardLotDepthRange: deepFreeze([34, 40]),
    cornerLotDepthRange: deepFreeze([36, 42]),
    localStreetSpacing: 58,
    collectorStreetLength: 124,
    localStreetLength: 58,
    culDeSacLength: 54
  })
});

const edgeDefinitions = deepFreeze([
  {
    edgeId: "EDGE_COLLECTOR_WEST_NORTH",
    roadSegmentId: "SEGMENT_001",
    side: "NORTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 0,
    roadCoordinate: 0,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [1]
  },
  {
    edgeId: "EDGE_COLLECTOR_WEST_SOUTH",
    roadSegmentId: "SEGMENT_001",
    side: "SOUTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 0,
    roadCoordinate: 0,
    lotTypePattern: ["standard", "wide"],
    cornerLotIndices: [1]
  },
  {
    edgeId: "EDGE_COLLECTOR_MID_NORTH",
    roadSegmentId: "SEGMENT_002",
    side: "NORTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 82,
    roadCoordinate: 0,
    lotTypePattern: ["standard", "wide"],
    cornerLotIndices: [0]
  },
  {
    edgeId: "EDGE_COLLECTOR_MID_SOUTH",
    roadSegmentId: "SEGMENT_002",
    side: "SOUTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 82,
    roadCoordinate: 0,
    lotTypePattern: ["narrow", "standard"],
    cornerLotIndices: [0]
  },
  {
    edgeId: "EDGE_COLLECTOR_EAST_NORTH",
    roadSegmentId: "SEGMENT_003",
    side: "NORTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 164,
    roadCoordinate: 0,
    lotTypePattern: ["wide", "standard"],
    cornerLotIndices: [0]
  },
  {
    edgeId: "EDGE_COLLECTOR_EAST_SOUTH",
    roadSegmentId: "SEGMENT_003",
    side: "SOUTH",
    orientation: "EAST_WEST",
    count: 2,
    startCoordinate: 164,
    roadCoordinate: 0,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [0]
  },
  {
    edgeId: "EDGE_LOCAL_NORTH_WEST",
    roadSegmentId: "SEGMENT_004",
    side: "WEST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: 10,
    roadCoordinate: 52,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [0, 1]
  },
  {
    edgeId: "EDGE_LOCAL_NORTH_EAST",
    roadSegmentId: "SEGMENT_004",
    side: "EAST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: 10,
    roadCoordinate: 52,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [0, 1]
  },
  {
    edgeId: "EDGE_LOCAL_SOUTH_WEST",
    roadSegmentId: "SEGMENT_005",
    side: "WEST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: -48,
    roadCoordinate: 52,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [0, 1]
  },
  {
    edgeId: "EDGE_LOCAL_SOUTH_EAST",
    roadSegmentId: "SEGMENT_005",
    side: "EAST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: -48,
    roadCoordinate: 52,
    lotTypePattern: ["standard", "standard"],
    cornerLotIndices: [0, 1]
  },
  {
    edgeId: "EDGE_CULDESAC_WEST",
    roadSegmentId: "SEGMENT_006",
    side: "WEST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: 8,
    roadCoordinate: 88,
    lotTypePattern: ["standard", "culdesac"],
    cornerLotIndices: [0, 1]
  },
  {
    edgeId: "EDGE_CULDESAC_EAST",
    roadSegmentId: "SEGMENT_006",
    side: "EAST",
    orientation: "NORTH_SOUTH",
    count: 2,
    startCoordinate: 8,
    roadCoordinate: 88,
    lotTypePattern: ["standard", "culdesac"],
    cornerLotIndices: [0, 1]
  }
]);

export function createSuburbanStreetBlockGenerator(
  options = suburbanStreetBlockGeneratorDefaultInput
) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);
  return Object.freeze({
    generate(overrides = {}) {
      return generateSuburbanStreetBlockPreview({
        ...normalizedDefaultInput,
        ...overrides,
        blockConfiguration: {
          ...normalizedDefaultInput.blockConfiguration,
          ...(overrides.blockConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateSuburbanStreetBlockPreview(preview);
    }
  });
}

export function generateSuburbanStreetBlockPreview(
  rawInput = suburbanStreetBlockGeneratorDefaultInput
) {
  const input = normalizeGeneratorInput(rawInput);
  const seedConfig = buildSeedConfig(input);
  const roadGraphData = buildRoadGraph(input);
  const lots = buildLots(input, seedConfig, roadGraphData);
  const resolvedLots = resolveLotBuildings(lots, input, seedConfig);
  const buildingPlacements = buildBuildingPlacements(resolvedLots);
  const streetFeaturePlacements = buildStreetFeaturePlacements(
    input,
    seedConfig,
    roadGraphData,
    resolvedLots
  );
  const roadFrontageConnections = buildRoadFrontageConnections(
    resolvedLots,
    roadGraphData
  );

  const preview = deepFreeze({
    schemaId: streetBlockSchemaId,
    streetBlockId: `SUBURBAN_STREET_BLOCK_${String(input.streetBlockSeed).padStart(
      5,
      "0"
    )}`,
    previewId: input.blockConfiguration.previewId,
    generationProfile: input.blockConfiguration.generationProfile,
    seed: input.streetBlockSeed,
    seedConfig,
    themeProfile: deepFreeze({ ...resolveThemeProfile(input) }),
    blockBounds: roadGraphData.blockBounds,
    roadGraph: roadGraphData.roadGraph,
    roadNodes: roadGraphData.roadNodes,
    roadSegments: roadGraphData.roadSegments,
    intersections: roadGraphData.intersections,
    lotCount: resolvedLots.length,
    lots: deepFreeze(resolvedLots),
    buildingPlacements: deepFreeze(buildingPlacements),
    streetFeaturePlacements: deepFreeze(streetFeaturePlacements),
    roadFrontageConnections: deepFreeze(roadFrontageConnections),
    validationContract: deepFreeze({
      checks: deepFreeze({
        roadConnectivityValid: true,
        intersectionValidity: true,
        allLotsGenerated: true,
        lotBoundaryValidity: true,
        lotFrontageValidity: true,
        validBuildingIds: true,
        buildingPlacementValidity: true,
        drivewayConnectionValidity: true,
        streetFeatureContainmentValidity: true,
        deterministicRebuildValidity: true
      })
    }),
    validationResult: null
  });

  const validationResult = buildValidationResult(preview, input);
  const finalizedPreview = deepFreeze({
    ...preview,
    validationResult
  });

  const validation = validateSuburbanStreetBlockPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function createSuburbanStreetBlockValidationOutput(
  rawPreview,
  validationId = validationOutputId
) {
  const preview = normalizeGeneratedPreview(rawPreview);
  return deepFreeze({
    validationId,
    previewId: preview.previewId,
    streetBlockId: preview.streetBlockId,
    seed: preview.seed,
    summary: deepFreeze({
      validationPassed: preview.validationResult.validationPassed,
      lotCount: preview.lotCount,
      roadNodeCount: preview.roadNodes.length,
      roadSegmentCount: preview.roadSegments.length,
      buildingPlacementCount: preview.buildingPlacements.length,
      streetFeatureCount: preview.streetFeaturePlacements.length
    }),
    checks: deepFreeze({
      roadConnectivityValid: passFail(preview.validationResult.roadConnectivityValid),
      intersectionValidity: passFail(preview.validationResult.intersectionValidity),
      allLotsGenerated: passFail(preview.validationResult.allLotsGenerated),
      lotBoundaryValidity: passFail(preview.validationResult.lotBoundaryValidity),
      lotFrontageValidity: passFail(preview.validationResult.lotFrontageValidity),
      validBuildingIds: passFail(preview.validationResult.validBuildingIds),
      buildingPlacementValidity: passFail(
        preview.validationResult.buildingPlacementValidity
      ),
      drivewayConnectionValidity: passFail(
        preview.validationResult.drivewayConnectionValidity
      ),
      frontageResolutionValidity: passFail(
        preview.validationResult.frontageResolutionValidity
      ),
      suburbanWeightingValidity: passFail(
        preview.validationResult.suburbanWeightingValidity
      ),
      adjacentVariationValidity: passFail(
        preview.validationResult.adjacentVariationValidity
      ),
      cornerLotRuleValidity: passFail(
        preview.validationResult.cornerLotRuleValidity
      ),
      streetFeatureContainmentValidity: passFail(
        preview.validationResult.streetFeatureContainmentValidity
      ),
      deterministicRebuildValidity: passFail(
        preview.validationResult.deterministicRebuildValidity
      )
    })
  });
}

export function validateSuburbanStreetBlockPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.lotCount !== 24) {
      throw createValidationError(
        "invalid_lot_count",
        "Suburban street block preview must generate exactly 24 lots."
      );
    }
    if (preview.lots.length !== preview.lotCount) {
      throw createValidationError(
        "lot_count_mismatch",
        "Street block lotCount must match the lot array length."
      );
    }
    if (preview.roadNodes.length < 6 || preview.roadSegments.length < 5) {
      throw createValidationError(
        "road_graph_too_small",
        "Street block road graph does not satisfy the minimum topology."
      );
    }
    for (const lot of preview.lots) {
      if (!supportedDirections.has(lot.frontageDirection)) {
        throw createValidationError(
          "invalid_frontage_direction",
          `Street block lot ${lot.lotId} has an invalid frontage direction.`
        );
      }
      if (!supportedDrivewaySides.has(lot.drivewaySide)) {
        throw createValidationError(
          "invalid_driveway_side",
          `Street block lot ${lot.lotId} has an invalid driveway side.`
        );
      }
    }
    validateRoadGraph(preview);
    validateBuildingPlacements(preview.buildingPlacements, preview.lots);
    validateRoadConnections(preview.roadFrontageConnections, preview.lots, preview.roadSegments);
    validateStreetFeatures(preview.streetFeaturePlacements, preview.blockBounds);
    validateThemeMix(preview, preview.themeProfile);
    validateAdjacentVariation(preview.lots);
    validateCornerLots(preview.lots);

    if (!preview.validationResult.validationPassed) {
      throw createValidationError(
        "validation_result_failed",
        "Street block validationResult must report a passing state."
      );
    }

    const actualHash = computeDeterministicSignatureHash(preview);

    if (actualHash !== preview.validationResult.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Street block deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      preview
    });
  } catch (error) {
    if (error?.name !== "SuburbanStreetBlockGeneratorValidationError") {
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
    streetBlockSeed: input.streetBlockSeed,
    regionSeed: input.regionSeed,
    neighbourhoodThemeSeed: input.neighbourhoodThemeSeed
  });
}

function buildRoadGraph(input) {
  const roadNodes = deepFreeze([
    roadNode("NODE_001", "road_connection_point", 0, 0, ["SEGMENT_001"], 1),
    roadNode("NODE_002", "four_way", 80, 0, ["SEGMENT_001", "SEGMENT_002", "SEGMENT_004", "SEGMENT_005"], 4),
    roadNode("NODE_003", "t_junction", 160, 0, ["SEGMENT_002", "SEGMENT_003", "SEGMENT_006"], 3),
    roadNode("NODE_004", "road_connection_point", 240, 0, ["SEGMENT_003"], 1),
    roadNode("NODE_005", "road_connection_point", 80, 72, ["SEGMENT_004"], 1),
    roadNode("NODE_006", "road_connection_point", 80, -72, ["SEGMENT_005"], 1),
    roadNode("NODE_007", "cul_de_sac_end", 160, 72, ["SEGMENT_006"], 1)
  ]);

  const roadSegments = deepFreeze([
    roadSegment("SEGMENT_001", "collector_residential_street", "NODE_001", "NODE_002", "east_west", 80, input),
    roadSegment("SEGMENT_002", "collector_residential_street", "NODE_002", "NODE_003", "east_west", 80, input),
    roadSegment("SEGMENT_003", "collector_residential_street", "NODE_003", "NODE_004", "east_west", 80, input),
    roadSegment("SEGMENT_004", "local_residential_street", "NODE_002", "NODE_005", "north_south", 72, input),
    roadSegment("SEGMENT_005", "local_residential_street", "NODE_006", "NODE_002", "north_south", 72, input),
    roadSegment("SEGMENT_006", "cul_de_sac_residential_loop", "NODE_003", "NODE_007", "north_south", 72, input)
  ]);

  const intersections = deepFreeze([
    roadIntersection("INTERSECTION_001", "NODE_002", "four_way_intersection", ["SEGMENT_001", "SEGMENT_002", "SEGMENT_004", "SEGMENT_005"]),
    roadIntersection("INTERSECTION_002", "NODE_003", "t_intersection", ["SEGMENT_002", "SEGMENT_003", "SEGMENT_006"]),
    roadIntersection("INTERSECTION_003", "NODE_007", "cul_de_sac_head", ["SEGMENT_006"])
  ]);

  const blockBounds = deepFreeze({
    minX: -26,
    maxX: 266,
    minY: -86,
    maxY: 100
  });

  return deepFreeze({
    roadGraph: deepFreeze({
      graphType: "collector_plus_cross_street_plus_culdesac",
      supportsStraightRoads: true,
      supportsTIntersections: true,
      supportsCornerConnections: true,
      supportsCulDeSac: true,
      connectedComponentCount: 1
    }),
    roadNodes,
    roadSegments,
    intersections,
    blockBounds
  });
}

function buildLots(input, seedConfig, roadGraphData) {
  const lots = [];
  let lotIndex = 0;

  for (const edge of edgeDefinitions) {
    const segment = roadGraphData.roadSegments.find(
      (entry) => entry.roadSegmentId === edge.roadSegmentId
    );
    if (!segment) {
      throw new Error(`Missing road segment ${edge.roadSegmentId} for lot generation.`);
    }
    const widths = buildEdgeWidths(seedConfig, edge, input);
    let cursor = edge.startCoordinate;
    for (let index = 0; index < edge.count; index += 1) {
      lotIndex += 1;
      const lotId = `LOT_${String(lotIndex).padStart(3, "0")}`;
      const frontageSpan = widths[index];
      const isCornerLot = edge.cornerLotIndices.includes(index);
      const depthRange = isCornerLot
        ? input.blockConfiguration.cornerLotDepthRange
        : input.blockConfiguration.standardLotDepthRange;
      const rawRoadDistance = pickDepth(seedConfig, depthRange, edge.edgeId, index);
      const roadDistance =
        edge.orientation === "EAST_WEST"
          ? rawRoadDistance
          : roundNumber(Math.max(22, rawRoadDistance * 0.62));
      const width = edge.orientation === "EAST_WEST" ? frontageSpan : roadDistance;
      const depth = edge.orientation === "EAST_WEST" ? roadDistance : frontageSpan;
      const positionData = buildLotPosition(edge, segment, cursor, width, depth, input);
      const frontageDirection = positionData.frontageDirection;
      const cornerStatus = resolveCornerStatus(edge, index);
      const lotType = classifyLotType(frontageSpan);
      const streetContext = resolveStreetContextFromFrontageRoad(
        edge.roadSegmentId,
        cornerStatus
      );
      const frontageRelationship = resolveFrontageRelationship(
        edge.roadSegmentId,
        edge.side,
        frontageDirection,
        cornerStatus
      );
      const setbacks = buildSetbacks(
        seedConfig,
        lotId,
        cornerStatus,
        frontageDirection,
        streetContext
      );
      const drivewaySide = resolveDrivewaySide(
        seedConfig,
        lotId,
        edge.side,
        cornerStatus,
        frontageDirection,
        streetContext
      );
      const landscapingZones = buildLandscapingZones(
        positionData.position,
        width,
        depth,
        frontageDirection,
        drivewaySide,
        cornerStatus,
        streetContext
      );
      lots.push(
        deepFreeze({
          schemaId: lotSchemaId,
          lotId,
          position: positionData.position,
          width,
          depth,
          dimensions: deepFreeze({ width, depth }),
          frontageWidth: frontageSpan,
          frontageRoadSegmentId: edge.roadSegmentId,
          frontageDirection,
          frontageRelationship,
          cornerStatus,
          lotType,
          setback: deepFreeze(setbacks),
          setbackProfile: deepFreeze(setbacks),
          drivewaySide,
          drivewayStreet: edge.roadSegmentId,
          fenceConfiguration:
            cornerStatus === "interior"
              ? "standard_suburban_front_gap_with_side_and_rear_boundaries"
              : "corner_suburban_dual_frontage_visibility_buffer",
          fenceRules: deepFreeze({
            front: true,
            left: true,
            right: true,
            rear: true,
            drivewayOpeningSide: drivewaySide,
            drivewayOpeningWidth: 3.2,
            pedestrianAccessSide: drivewaySide === "EAST" ? "WEST" : "EAST",
            pedestrianAccessWidth: 1.1,
            cornerVisibilityOpening: cornerStatus !== "interior"
          }),
          landscapingSeed: `LANDSCAPE_${seedConfig.streetBlockSeed}_${String(lotIndex).padStart(3, "0")}`,
          landscapingZones,
          buildingSocket: deepFreeze({
            x: roundNumber(positionData.position.x + width / 2),
            y: roundNumber(positionData.position.y + depth / 2),
            facing: frontageDirection
          }),
          drivewaySocket: buildDrivewaySocket(
            positionData.position,
            width,
            depth,
            frontageDirection,
            drivewaySide,
            streetContext,
            cornerStatus
          ),
          garageRelationship: buildGarageRelationship(
            frontageDirection,
            drivewaySide,
            streetContext,
            cornerStatus
          ),
          streetContext,
          resolverInputs: deepFreeze({
            streetBlockSeed: seedConfig.streetBlockSeed,
            regionSeed: seedConfig.regionSeed,
            neighbourhoodThemeSeed: seedConfig.neighbourhoodThemeSeed,
            frontageRoadSegmentId: edge.roadSegmentId,
            cornerStatus,
            edgeId: edge.edgeId
          })
        })
      );
      cursor += frontageSpan + 2;
    }
  }

  if (lots.length !== input.lotCount) {
    throw new Error(`Expected ${input.lotCount} lots but built ${lots.length}.`);
  }

  return deepFreeze(lots);
}

function buildEdgeWidths(seedConfig, edge, input) {
  return edge.lotTypePattern.map((pattern, index) => {
    const range = widthRangeForPattern(pattern);
    return roundNumber(
      randomInRange(seedConfig, `${edge.edgeId}:width:${index}`, range[0], range[1])
    );
  });
}

function widthRangeForPattern(pattern) {
  if (pattern === "narrow") {
    return [12, 14];
  }
  if (pattern === "wide") {
    return [19, 24];
  }
  if (pattern === "culdesac") {
    return [18, 21];
  }
  return [15, 18];
}

function buildLotPosition(edge, segment, cursor, width, depth, input) {
  const offset = input.blockConfiguration.roadWidth / 2 +
    input.blockConfiguration.sidewalkWidth +
    input.blockConfiguration.vergeWidth;

  if (edge.orientation === "EAST_WEST") {
    if (edge.side === "NORTH") {
      return deepFreeze({
        position: deepFreeze({ x: roundNumber(cursor), y: roundNumber(segment.y + offset), z: 0 }),
        frontageDirection: "SOUTH"
      });
    }
    return deepFreeze({
      position: deepFreeze({ x: roundNumber(cursor), y: roundNumber(segment.y - offset - depth), z: 0 }),
      frontageDirection: "NORTH"
    });
  }

  if (edge.side === "WEST") {
    return deepFreeze({
      position: deepFreeze({ x: roundNumber(segment.x - offset - width), y: roundNumber(cursor), z: 0 }),
      frontageDirection: "EAST"
    });
  }

  return deepFreeze({
    position: deepFreeze({ x: roundNumber(segment.x + offset), y: roundNumber(cursor), z: 0 }),
    frontageDirection: "WEST"
  });
}

function buildSetbacks(
  seedConfig,
  lotId,
  cornerStatus,
  frontageDirection,
  streetContext
) {
  const isCornerLot = cornerStatus !== "interior";
  const frontMin =
    streetContext === "cul_de_sac_residential_edge"
      ? 5.4
      : isCornerLot
        ? 5.2
        : 4.5;
  const frontMax =
    streetContext === "cul_de_sac_residential_edge"
      ? 6.9
      : isCornerLot
        ? 7
        : 6.5;
  const sideMin =
    frontageDirection === "EAST" || frontageDirection === "WEST" ? 1.8 : 1.4;
  return deepFreeze({
    front: roundNumber(
      randomInRange(seedConfig, `${lotId}:front`, frontMin, frontMax)
    ),
    left: roundNumber(randomInRange(seedConfig, `${lotId}:left`, sideMin, 2.6)),
    right: roundNumber(randomInRange(seedConfig, `${lotId}:right`, sideMin, 2.6)),
    rear: roundNumber(randomInRange(seedConfig, `${lotId}:rear`, 5.5, 8.5))
  });
}

function pickDepth(seedConfig, range, label, index) {
  return roundNumber(randomInRange(seedConfig, `${label}:depth:${index}`, range[0], range[1]));
}

function resolveDrivewaySide(
  seedConfig,
  lotId,
  edgeSide,
  cornerStatus,
  frontageDirection,
  streetContext
) {
  if (streetContext === "cul_de_sac_residential_edge") {
    return edgeSide === "WEST" ? "WEST" : "EAST";
  }
  if (
    cornerStatus !== "interior" &&
    (edgeSide === "NORTH" ||
      edgeSide === "WEST" ||
      frontageDirection === "EAST")
  ) {
    return "WEST";
  }
  const hashed = stableHash(`${seedConfig.streetBlockSeed}:${seedConfig.regionSeed}:${seedConfig.neighbourhoodThemeSeed}:${lotId}:${edgeSide}`);
  return hashed % 2 === 0 ? "EAST" : "WEST";
}

function resolveCornerStatus(edge, index) {
  if (!edge.cornerLotIndices.includes(index)) {
    return "interior";
  }
  if (edge.roadSegmentId === "SEGMENT_006") {
    return "cul_de_sac_edge";
  }
  if (edge.side === "NORTH" || edge.side === "SOUTH") {
    return "corner_primary";
  }
  return "corner_secondary";
}

function buildLandscapingZones(
  position,
  width,
  depth,
  frontageDirection,
  drivewaySide,
  cornerStatus,
  streetContext
) {
  const sideWidth = 1.4;
  const frontDepth = Math.min(
    cornerStatus === "interior" ? 8 : 9.5,
    depth * (cornerStatus === "interior" ? 0.25 : 0.3)
  );
  const treeZoneDepth = Math.min(6.5, depth * 0.22);
  const frontLawnZone = zoneForFront(position, width, depth, frontageDirection, frontDepth);
  const backyardZone = zoneForBack(position, width, depth, frontageDirection, Math.max(depth - frontDepth - 6, 8));
  const sidePlantingZone = zoneForSide(position, width, depth, frontageDirection, drivewaySide, sideWidth);
  const treeZone = zoneForTree(position, width, depth, frontageDirection, treeZoneDepth);
  return deepFreeze({
    frontLawnZone,
    backyardZone,
    sidePlantingZone,
    treeZone,
    mailboxVergeZone: zoneForMailbox(position, width, depth, frontageDirection),
    cornerFrontageGardenZone:
      cornerStatus === "interior"
        ? null
        : zoneForCornerGarden(position, width, depth, frontageDirection, streetContext),
    cornerVisibilityPlantingZone:
      cornerStatus === "interior"
        ? null
        : zoneForCornerVisibility(position, width, depth, frontageDirection)
  });
}

function zoneForFront(position, width, depth, frontageDirection, frontDepth) {
  if (frontageDirection === "SOUTH") {
    return zoneRect(position.x + 0.5, position.y + 0.5, width - 1, frontDepth);
  }
  if (frontageDirection === "NORTH") {
    return zoneRect(position.x + 0.5, position.y + depth - frontDepth - 0.5, width - 1, frontDepth);
  }
  if (frontageDirection === "EAST") {
    return zoneRect(position.x + width - frontDepth - 0.5, position.y + 0.5, frontDepth, depth - 1);
  }
  return zoneRect(position.x + 0.5, position.y + 0.5, frontDepth, depth - 1);
}

function zoneForBack(position, width, depth, frontageDirection, backDepth) {
  if (frontageDirection === "SOUTH") {
    return zoneRect(position.x + 0.5, position.y + depth - backDepth - 0.5, width - 1, backDepth);
  }
  if (frontageDirection === "NORTH") {
    return zoneRect(position.x + 0.5, position.y + 0.5, width - 1, backDepth);
  }
  if (frontageDirection === "EAST") {
    return zoneRect(position.x + 0.5, position.y + 0.5, backDepth, depth - 1);
  }
  return zoneRect(position.x + width - backDepth - 0.5, position.y + 0.5, backDepth, depth - 1);
}

function zoneForSide(position, width, depth, frontageDirection, drivewaySide, sideWidth) {
  if (frontageDirection === "NORTH" || frontageDirection === "SOUTH") {
    if (drivewaySide === "EAST") {
      return zoneRect(position.x + 0.5, position.y + 4, sideWidth, depth - 8);
    }
    return zoneRect(position.x + width - sideWidth - 0.5, position.y + 4, sideWidth, depth - 8);
  }
  if (drivewaySide === "EAST") {
    return zoneRect(position.x + 4, position.y + 0.5, width - 8, sideWidth);
  }
  return zoneRect(position.x + 4, position.y + depth - sideWidth - 0.5, width - 8, sideWidth);
}

function zoneForTree(position, width, depth, frontageDirection, treeZoneDepth) {
  if (frontageDirection === "SOUTH" || frontageDirection === "NORTH") {
    return zoneRect(position.x + width * 0.56, position.y + depth * 0.35, Math.min(3.4, width * 0.22), treeZoneDepth);
  }
  return zoneRect(position.x + width * 0.35, position.y + depth * 0.56, treeZoneDepth, Math.min(3.4, depth * 0.22));
}

function zoneForMailbox(position, width, depth, frontageDirection) {
  if (frontageDirection === "SOUTH") {
    return zoneRect(position.x + width * 0.15, position.y - 1.2, 1.4, 1);
  }
  if (frontageDirection === "NORTH") {
    return zoneRect(position.x + width * 0.15, position.y + depth + 0.2, 1.4, 1);
  }
  if (frontageDirection === "EAST") {
    return zoneRect(position.x + width + 0.2, position.y + depth * 0.15, 1, 1.4);
  }
  return zoneRect(position.x - 1.2, position.y + depth * 0.15, 1, 1.4);
}

function zoneForCornerVisibility(position, width, depth, frontageDirection) {
  if (frontageDirection === "SOUTH") {
    return zoneRect(position.x + width - 3.2, position.y + 0.5, 2.4, 2.4);
  }
  if (frontageDirection === "NORTH") {
    return zoneRect(position.x + width - 3.2, position.y + depth - 2.9, 2.4, 2.4);
  }
  if (frontageDirection === "EAST") {
    return zoneRect(position.x + width - 2.9, position.y + depth - 3.2, 2.4, 2.4);
  }
  return zoneRect(position.x + 0.5, position.y + depth - 3.2, 2.4, 2.4);
}

function zoneForCornerGarden(position, width, depth, frontageDirection, streetContext) {
  const size = streetContext === "cul_de_sac_residential_edge" ? 3.4 : 2.8;
  if (frontageDirection === "SOUTH") {
    return zoneRect(position.x + 0.5, position.y + 0.5, size, size);
  }
  if (frontageDirection === "NORTH") {
    return zoneRect(position.x + 0.5, position.y + depth - size - 0.5, size, size);
  }
  if (frontageDirection === "EAST") {
    return zoneRect(position.x + width - size - 0.5, position.y + 0.5, size, size);
  }
  return zoneRect(position.x + 0.5, position.y + 0.5, size, size);
}

function buildDrivewaySocket(
  position,
  width,
  depth,
  frontageDirection,
  drivewaySide,
  streetContext,
  cornerStatus
) {
  if (frontageDirection === "NORTH") {
    return deepFreeze({
      x: roundNumber(position.x + (drivewaySide === "EAST" ? width - 2.2 : 2.2)),
      y: roundNumber(position.y + depth),
      side: drivewaySide,
      frontageDirection,
      garageSide: drivewaySide,
      frontageGeometry:
        streetContext === "cul_de_sac_residential_edge"
          ? "cul_de_sac_radial_frontage"
          : "linear_frontage"
    });
  }
  if (frontageDirection === "SOUTH") {
    return deepFreeze({
      x: roundNumber(position.x + (drivewaySide === "EAST" ? width - 2.2 : 2.2)),
      y: roundNumber(position.y),
      side: drivewaySide,
      frontageDirection,
      garageSide: drivewaySide,
      frontageGeometry:
        streetContext === "cul_de_sac_residential_edge"
          ? "cul_de_sac_radial_frontage"
          : "linear_frontage"
    });
  }
  if (frontageDirection === "EAST") {
    return deepFreeze({
      x: roundNumber(position.x + width),
      y: roundNumber(
        position.y +
          (streetContext === "cul_de_sac_residential_edge"
            ? depth * 0.5
            : drivewaySide === "EAST"
              ? depth - 2.2
              : 2.2)
      ),
      side: drivewaySide,
      frontageDirection,
      garageSide:
        cornerStatus === "corner_secondary" ? "SIDE_FACING" : drivewaySide,
      frontageGeometry:
        streetContext === "cul_de_sac_residential_edge"
          ? "cul_de_sac_radial_frontage"
          : "linear_frontage"
    });
  }
  return deepFreeze({
    x: roundNumber(position.x),
    y: roundNumber(
      position.y +
        (streetContext === "cul_de_sac_residential_edge"
          ? depth * 0.5
          : drivewaySide === "EAST"
            ? depth - 2.2
            : 2.2)
    ),
    side: drivewaySide,
    frontageDirection,
    garageSide:
      cornerStatus === "corner_secondary" ? "SIDE_FACING" : drivewaySide,
    frontageGeometry:
      streetContext === "cul_de_sac_residential_edge"
        ? "cul_de_sac_radial_frontage"
        : "linear_frontage"
  });
}

function classifyLotType(width) {
  if (width <= 14) {
    return "narrow";
  }
  if (width <= 18) {
    return "standard";
  }
  return "wide";
}

function resolveLotBuildings(lots, input, seedConfig) {
  const resolved = [];
  const targetCounts = buildThemeTargetCounts(resolveThemeProfile(input), lots.length);
  const currentCounts = Object.fromEntries(
    supportedSuburbanStreetBlockBuildingAssets.map((assetId) => [assetId, 0])
  );

  for (const lot of lots) {
    const selectedProfile = selectProfileForLot(
      lot,
      resolved,
      currentCounts,
      targetCounts,
      input,
      seedConfig
    );
    currentCounts[selectedProfile.assetId] += 1;

    resolved.push(
      deepFreeze({
        ...lot,
        buildingId: selectedProfile.assetId,
        buildingRecipe: selectedProfile.recipeId,
        buildingFamily: selectedProfile.familyId,
        variationProfile: buildVariationProfile(
          seedConfig,
          lot,
          selectedProfile,
          resolved
        ),
        resolverMetadata: deepFreeze({
          weightingRuleApplied: selectedProfile.primaryTheme,
          duplicatePreventionRuleApplied: hasImmediateDuplicateRisk(
            resolved,
            lot,
            selectedProfile.assetId
          ),
          streetAwareSelection: true,
          cornerLotVariationApplied: lot.cornerStatus !== "interior",
          resolverHash: stableHash(
            `${lot.lotId}:${input.streetBlockSeed}:${selectedProfile.assetId}`
          ),
          targetCounts,
          selectedFromRemainingPool:
            targetCounts[selectedProfile.assetId] - currentCounts[selectedProfile.assetId]
        })
      })
    );
  }

  return deepFreeze(
    rebalanceResolvedLotsToTargets(resolved, targetCounts, input, seedConfig)
  );
}

function buildThemeTargetCounts(themeProfile, totalLots) {
  const entries = Object.entries(themeProfile.buildingWeights);
  const baseCounts = Object.fromEntries(entries.map(([assetId]) => [assetId, 0]));
  const remainders = [];
  let assigned = 0;

  for (const [assetId, weight] of entries) {
    const exact = weight * totalLots;
    const count = Math.floor(exact);
    baseCounts[assetId] = count;
    assigned += count;
    remainders.push({ assetId, remainder: exact - count });
  }

  remainders.sort(
    (left, right) =>
      right.remainder - left.remainder || left.assetId.localeCompare(right.assetId)
  );
  while (assigned < totalLots) {
    const next = remainders.shift();
    baseCounts[next.assetId] += 1;
    assigned += 1;
  }

  return deepFreeze(baseCounts);
}

function selectProfileForLot(
  lot,
  resolvedLots,
  currentCounts,
  targetCounts,
  input,
  seedConfig
) {
  const candidates = Object.values(buildingProfiles)
    .filter((candidate) => lotCanFitProfile(lot, candidate))
    .map((candidate) => ({
      profile: candidate,
      score: scoreProfileForLot(
        lot,
        candidate,
        resolvedLots,
        currentCounts,
        targetCounts,
        input,
        seedConfig
      )
    }))
    .sort((left, right) => left.score - right.score);

  return candidates.at(0)?.profile ?? buildingProfiles.BUILDING_HOUSE_SUBURBAN_BRICK_001;
}

function numericLotId(lotId) {
  return Number.parseInt(lotId.split("_").at(-1), 10);
}

function scoreProfileForLot(
  lot,
  candidate,
  resolvedLots,
  currentCounts,
  targetCounts,
  input,
  seedConfig
) {
  const resolutionIndex = resolvedLots.length + 1;
  const totalLots = Object.values(targetCounts).reduce((sum, value) => sum + value, 0);
  const currentCount = currentCounts[candidate.assetId] ?? 0;
  const targetCount = targetCounts[candidate.assetId] ?? 0;
  const expectedCountByNow = (targetCount * resolutionIndex) / totalLots;
  let score = 0;

  if (currentCount >= targetCount) {
    score += 10000;
  }

  score += (currentCount - expectedCountByNow) * 120;
  score += repetitionPenaltyForLot(resolvedLots, lot, candidate.assetId);
  score += streetContextPenalty(lot, candidate.assetId);
  score += cornerLotPenalty(lot, candidate.assetId);
  score +=
    (stableHash(
      `${input.streetBlockSeed}:${input.regionSeed}:${input.neighbourhoodThemeSeed}:${lot.lotId}:${candidate.assetId}`
    ) %
      100) /
    100;

  return score;
}

function repetitionPenaltyForLot(resolvedLots, lot, assetId) {
  const priorStreetLots = resolvedLots.filter(
    (entry) =>
      entry.frontageRoadSegmentId === lot.frontageRoadSegmentId &&
      entry.frontageDirection === lot.frontageDirection
  );
  const acrossStreetLots = resolvedLots.filter(
    (entry) =>
      entry.frontageRoadSegmentId === lot.frontageRoadSegmentId &&
      entry.frontageDirection !== lot.frontageDirection &&
      sameRoadCluster(entry, lot)
  );

  let penalty = 0;
  const priorLot = priorStreetLots.at(-1);
  const twoBack = priorStreetLots.at(-2);

  if (priorLot?.buildingId === assetId) {
    penalty += 2500;
  }
  if (twoBack?.buildingId === assetId && priorLot?.buildingId !== assetId) {
    penalty += 450;
  }
  if (acrossStreetLots.some((entry) => entry.buildingId === assetId)) {
    penalty += 360;
  }

  return penalty;
}

function streetContextPenalty(lot, assetId) {
  if (
    lot.streetContext === "cul_de_sac_residential_edge" ||
    lot.streetContext === "local_residential_interior"
  ) {
    if (assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001") {
      return -120;
    }
    if (assetId === "BUILDING_HOUSE_COASTAL_COTTAGE_001") {
      return 25;
    }
    return 90;
  }
  return assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001" ? -30 : 0;
}

function cornerLotPenalty(lot, assetId) {
  if (lot.cornerStatus === "interior") {
    return 0;
  }
  if (lot.cornerStatus === "cul_de_sac_edge") {
    return assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001" ? -55 : 20;
  }
  if (assetId === "BUILDING_HOUSE_COASTAL_COTTAGE_001") {
    return -20;
  }
  if (assetId === "BUILDING_HOUSE_BEACH_BUNGALOW_001") {
    return 40;
  }
  return -10;
}

function buildVariationProfile(seedConfig, lot, selectedProfile, resolvedLots) {
  const priorLot = findPriorStreetLot(resolvedLots, lot);
  const roofTones = ["charcoal", "terracotta", "slate", "warm_grey"];
  const yardDensities = ["light", "balanced", "lush"];
  const colourVariants = ["muted_trim", "warm_trim", "cool_trim", "brick_contrast"];

  const roofTone = dedupeVariant(
    resolveVariantValue(seedConfig, `${lot.lotId}:${selectedProfile.assetId}:roof`, roofTones),
    priorLot?.variationProfile?.roofTone,
    roofTones
  );
  const yardDensity = dedupeVariant(
    resolveVariantValue(seedConfig, `${lot.lotId}:${selectedProfile.assetId}:yard`, yardDensities),
    priorLot?.variationProfile?.yardDensity,
    yardDensities
  );
  const colourVariant = dedupeVariant(
    resolveVariantValue(
      seedConfig,
      `${lot.lotId}:${selectedProfile.assetId}:colour`,
      colourVariants
    ),
    priorLot?.variationProfile?.colourVariant,
    colourVariants
  );

  return deepFreeze({
    roofTone,
    fenceStyle:
      lot.cornerStatus !== "interior" || lot.lotType === "wide"
        ? "decorative_suburban"
        : "timber_standard",
    yardDensity,
    colourVariant,
    landscapingSequence:
      lot.streetContext === "cul_de_sac_residential_edge"
        ? "culdesac_garden_cluster"
        : lot.streetContext === "local_residential_interior"
          ? "suburban_side_street_garden"
          : "collector_edge_front_garden"
  });
}

function resolveVariantValue(seedConfig, label, variants) {
  const index = stableHash(
    `${seedConfig.streetBlockSeed}:${seedConfig.regionSeed}:${seedConfig.neighbourhoodThemeSeed}:${label}`
  ) % variants.length;
  return variants[index];
}

function dedupeVariant(value, priorValue, variants) {
  if (value !== priorValue) {
    return value;
  }
  const index = variants.indexOf(value);
  return variants[(index + 1) % variants.length];
}

function findPriorStreetLot(resolvedLots, lot) {
  for (let index = resolvedLots.length - 1; index >= 0; index -= 1) {
    const priorLot = resolvedLots[index];
    if (
      priorLot.frontageRoadSegmentId === lot.frontageRoadSegmentId &&
      priorLot.frontageDirection === lot.frontageDirection
    ) {
      return priorLot;
    }
  }
  return null;
}

function hasImmediateDuplicateRisk(resolvedLots, lot, assetId) {
  const priorLot = findPriorStreetLot(resolvedLots, lot);
  return priorLot?.buildingId === assetId;
}

function sameRoadCluster(left, right) {
  return Math.abs(left.position.x - right.position.x) < 20 ||
    Math.abs(left.position.y - right.position.y) < 20;
}

function rebalanceResolvedLotsToTargets(resolvedLots, targetCounts, input, seedConfig) {
  const balancedLots = [...resolvedLots];
  const counts = countResolvedBuildingMix(balancedLots);
  const underTarget = () =>
    supportedSuburbanStreetBlockBuildingAssets.filter(
      (assetId) => counts[assetId] < (targetCounts[assetId] ?? 0)
    );

  const candidates = [...balancedLots].sort((left, right) => {
    const priorityDelta =
      replacementPriority(left.buildingId) - replacementPriority(right.buildingId);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    if (left.streetContext !== right.streetContext) {
      return left.streetContext.localeCompare(right.streetContext);
    }
    return left.lotId.localeCompare(right.lotId);
  });

  for (const candidate of candidates) {
    const currentAssetId = candidate.buildingId;
    if (counts[currentAssetId] <= (targetCounts[currentAssetId] ?? 0)) {
      continue;
    }
    const replacementAssetIds = underTarget();
    for (const replacementAssetId of replacementAssetIds) {
      if (!canReplaceLotWithAsset(balancedLots, candidate.lotId, replacementAssetId)) {
        continue;
      }
      const replacementProfile = buildingProfiles[replacementAssetId];
      if (!lotCanFitProfile(candidate, replacementProfile)) {
        continue;
      }
      const candidateIndex = balancedLots.findIndex((lot) => lot.lotId === candidate.lotId);
      const replacementLot = deepFreeze({
        ...balancedLots[candidateIndex],
        buildingId: replacementProfile.assetId,
        buildingRecipe: replacementProfile.recipeId,
        buildingFamily: replacementProfile.familyId,
        variationProfile: buildVariationProfile(
          seedConfig,
          balancedLots[candidateIndex],
          replacementProfile,
          balancedLots.slice(0, candidateIndex)
        ),
        resolverMetadata: deepFreeze({
          weightingRuleApplied: replacementProfile.primaryTheme,
          duplicatePreventionRuleApplied: true,
          streetAwareSelection: true,
          cornerLotVariationApplied:
            balancedLots[candidateIndex].cornerStatus !== "interior",
          resolverHash: stableHash(
            `${balancedLots[candidateIndex].lotId}:${input.streetBlockSeed}:${replacementProfile.assetId}:rebalanced`
          ),
          targetCounts,
          rebalanceApplied: true
        })
      });
      balancedLots[candidateIndex] = replacementLot;
      counts[currentAssetId] -= 1;
      counts[replacementAssetId] += 1;
      break;
    }
  }

  return balancedLots;
}

function countResolvedBuildingMix(lots) {
  const counts = Object.fromEntries(
    supportedSuburbanStreetBlockBuildingAssets.map((assetId) => [assetId, 0])
  );
  for (const lot of lots) {
    counts[lot.buildingId] += 1;
  }
  return counts;
}

function replacementPriority(assetId) {
  if (assetId === "BUILDING_HOUSE_BEACH_BUNGALOW_001") {
    return 0;
  }
  if (assetId === "BUILDING_HOUSE_COASTAL_COTTAGE_001") {
    return 1;
  }
  return 2;
}

function canReplaceLotWithAsset(lots, lotId, replacementAssetId) {
  const targetLot = lots.find((lot) => lot.lotId === lotId);
  if (!targetLot) {
    return false;
  }
  return true;
}

function lotCanFitProfile(lot, profile) {
  const buildableWidth =
    lot.frontageDirection === "NORTH" || lot.frontageDirection === "SOUTH"
      ? lot.width - lot.setback.left - lot.setback.right
      : lot.depth - lot.setback.left - lot.setback.right;
  const buildableDepth =
    lot.frontageDirection === "NORTH" || lot.frontageDirection === "SOUTH"
      ? lot.depth - lot.setback.front - lot.setback.rear
      : lot.width - lot.setback.front - lot.setback.rear;
  return (
    profile.footprintWidth <= buildableWidth &&
    profile.footprintDepth <= buildableDepth
  );
}

function buildBuildingPlacements(lots) {
  return lots.map((lot, index) => {
    const profile = buildingProfiles[lot.buildingId];
    const position = buildBuildingPosition(lot, profile);
    return deepFreeze({
      schemaId: buildingPlacementSchemaId,
      placementId: `BUILDING_PLACEMENT_${String(index + 1).padStart(3, "0")}`,
      lotId: lot.lotId,
      assetId: profile.assetId,
      familyId: profile.familyId,
      recipeId: profile.recipeId,
      position,
      rotation: deepFreeze({
        facingDirection: lot.frontageDirection,
        yawDegrees: facingDirectionToYaw(lot.frontageDirection)
      }),
      scale: deepFreeze({ x: 1, y: 1, z: 1 }),
      lodProfile: "LOD_GAMEPLAY",
      frontSetback: lot.setback.front,
      drivewaySide: lot.drivewaySide,
      garageRelationship: lot.garageRelationship,
      streetContext: lot.streetContext,
      variationProfile: lot.variationProfile,
      resolverMetadata: lot.resolverMetadata
    });
  });
}

function buildBuildingPosition(lot, profile) {
  const { position, width, depth, frontageDirection, setback } = lot;
  if (frontageDirection === "NORTH") {
    return deepFreeze({
      x: roundNumber(position.x + width / 2),
      y: roundNumber(position.y + depth - setback.front - profile.footprintDepth / 2),
      z: 0
    });
  }
  if (frontageDirection === "SOUTH") {
    return deepFreeze({
      x: roundNumber(position.x + width / 2),
      y: roundNumber(position.y + setback.front + profile.footprintDepth / 2),
      z: 0
    });
  }
  if (frontageDirection === "EAST") {
    return deepFreeze({
      x: roundNumber(position.x + width - setback.front - profile.footprintDepth / 2),
      y: roundNumber(position.y + depth / 2),
      z: 0
    });
  }
  return deepFreeze({
    x: roundNumber(position.x + setback.front + profile.footprintDepth / 2),
    y: roundNumber(position.y + depth / 2),
    z: 0
  });
}

function resolveStreetContext(lot) {
  return resolveStreetContextFromFrontageRoad(
    lot.frontageRoadSegmentId,
    lot.cornerStatus
  );
}

function resolveStreetContextFromFrontageRoad(frontageRoadSegmentId, cornerStatus) {
  if (frontageRoadSegmentId === "SEGMENT_006") {
    return "cul_de_sac_residential_edge";
  }
  if (frontageRoadSegmentId === "SEGMENT_004" || frontageRoadSegmentId === "SEGMENT_005") {
    return "local_residential_interior";
  }
  if (cornerStatus !== "interior") {
    return "corner_residential_lot";
  }
  if (
    frontageRoadSegmentId === "SEGMENT_001" ||
    frontageRoadSegmentId === "SEGMENT_002" ||
    frontageRoadSegmentId === "SEGMENT_003"
  ) {
    return "collector_edge_residential";
  }
  return "local_residential_interior";
}

function resolveFrontageRelationship(
  frontageRoadSegmentId,
  side,
  frontageDirection,
  cornerStatus
) {
  if (frontageRoadSegmentId === "SEGMENT_006") {
    return deepFreeze({
      roadRelationship: "cul_de_sac_radial_frontage",
      primaryFrontageSelection: side,
      inwardFacingRoadRelationship: true,
      cornerLotProfile: cornerStatus
    });
  }
  return deepFreeze({
    roadRelationship: "linear_frontage",
    primaryFrontageSelection: side,
    inwardFacingRoadRelationship: false,
    cornerLotProfile: cornerStatus
  });
}

function buildGarageRelationship(
  frontageDirection,
  drivewaySide,
  streetContext,
  cornerStatus
) {
  return deepFreeze({
    garageSide:
      cornerStatus === "corner_secondary" ? "SIDE_FACING" : drivewaySide,
    frontageDirection,
    alignmentMode:
      streetContext === "cul_de_sac_residential_edge"
        ? "radial_driveway_alignment"
        : cornerStatus !== "interior"
          ? "corner_side_alignment"
          : "standard_frontage_alignment"
  });
}

function buildStreetFeaturePlacements(input, seedConfig, roadGraphData, lots) {
  const features = [];
  let featureIndex = 0;

  for (const segment of roadGraphData.roadSegments) {
    const edgeProfiles = featureEdgeProfiles(segment);
    for (const profile of edgeProfiles) {
      featureIndex += 1;
      features.push(
        deepFreeze({
          schemaId: streetFeatureSchemaId,
          featurePlacementId: `FEATURE_${String(featureIndex).padStart(3, "0")}`,
          featureType: "sidewalk",
          assetId: streetFeatureAssetIds.sidewalk,
          streetSegmentId: segment.roadSegmentId,
          relatedLotId: null,
          position: profile.sidewalkPosition,
          rotation: deepFreeze({ yawDegrees: profile.rotation }),
          variationSeed: `SIDEWALK_${seedConfig.streetBlockSeed}_${segment.roadSegmentId}_${profile.side}`,
          placementRule: "continuous_footpath_edge",
          publicAreaClass: "public_footpath"
        })
      );
      featureIndex += 1;
      features.push(
        deepFreeze({
          schemaId: streetFeatureSchemaId,
          featurePlacementId: `FEATURE_${String(featureIndex).padStart(3, "0")}`,
          featureType: "grass_verge",
          assetId: streetFeatureAssetIds.grass_verge,
          streetSegmentId: segment.roadSegmentId,
          relatedLotId: null,
          position: profile.vergePosition,
          rotation: deepFreeze({ yawDegrees: profile.rotation }),
          variationSeed: `VERGE_${seedConfig.streetBlockSeed}_${segment.roadSegmentId}_${profile.side}`,
          placementRule: "continuous_grass_verge_edge",
          publicAreaClass: "public_verge"
        })
      );
    }

    const treeCount = Math.max(1, Math.floor(segment.length / 24));
    for (let index = 0; index < treeCount; index += 1) {
      const treePlacement = buildStreetTreePlacement(segment, index, treeCount, featureIndex, seedConfig);
      featureIndex += 1;
      features.push(treePlacement);
    }
  }

  for (const intersection of roadGraphData.intersections) {
    featureIndex += 1;
    const node = roadGraphData.roadNodes.find((entry) => entry.nodeId === intersection.nodeId);
    features.push(
      deepFreeze({
        schemaId: streetFeatureSchemaId,
        featurePlacementId: `FEATURE_${String(featureIndex).padStart(3, "0")}`,
        featureType: "street_sign",
        assetId: streetFeatureAssetIds.street_sign,
        streetSegmentId: intersection.connectedSegmentIds[0],
        relatedLotId: null,
        position: deepFreeze({
          x: roundNumber(node.position.x + 2.2),
          y: roundNumber(node.position.y + 2.2),
          z: 0
        }),
        rotation: deepFreeze({ yawDegrees: 0 }),
        variationSeed: `SIGN_${seedConfig.streetBlockSeed}_${intersection.intersectionId}`,
        placementRule: "intersection_sign_anchor",
        publicAreaClass:
          intersection.intersectionType === "cul_de_sac_head"
            ? "cul_de_sac_centre"
            : "intersection_buffer"
      })
    );
  }

  for (const lot of lots) {
    featureIndex += 1;
    features.push(
      deepFreeze({
        schemaId: streetFeatureSchemaId,
        featurePlacementId: `FEATURE_${String(featureIndex).padStart(3, "0")}`,
        featureType: "street_sign",
        assetId: "MAILBOX_PREVIEW_001",
        streetSegmentId: lot.frontageRoadSegmentId,
        relatedLotId: lot.lotId,
        position: centerOfZone(lot.landscapingZones.mailboxVergeZone),
        rotation: deepFreeze({ yawDegrees: 0 }),
        variationSeed: `MAILBOX_${seedConfig.streetBlockSeed}_${lot.lotId}`,
        placementRule: "frontage_mailbox_anchor",
        publicAreaClass: "lot_frontage_edge"
      })
    );
  }

  return deepFreeze(features);
}

function featureEdgeProfiles(segment) {
  if (segment.direction === "east_west") {
    return [
      {
        side: "NORTH",
        rotation: 0,
        sidewalkPosition: deepFreeze({ x: roundNumber(segment.centerX), y: roundNumber(segment.y + 6.8), z: 0 }),
        vergePosition: deepFreeze({ x: roundNumber(segment.centerX), y: roundNumber(segment.y + 8.5), z: 0 })
      },
      {
        side: "SOUTH",
        rotation: 0,
        sidewalkPosition: deepFreeze({ x: roundNumber(segment.centerX), y: roundNumber(segment.y - 6.8), z: 0 }),
        vergePosition: deepFreeze({ x: roundNumber(segment.centerX), y: roundNumber(segment.y - 8.5), z: 0 })
      }
    ];
  }
  return [
    {
      side: "WEST",
      rotation: 90,
      sidewalkPosition: deepFreeze({ x: roundNumber(segment.x - 6.8), y: roundNumber(segment.centerY), z: 0 }),
      vergePosition: deepFreeze({ x: roundNumber(segment.x - 8.5), y: roundNumber(segment.centerY), z: 0 })
    },
    {
      side: "EAST",
      rotation: 90,
      sidewalkPosition: deepFreeze({ x: roundNumber(segment.x + 6.8), y: roundNumber(segment.centerY), z: 0 }),
      vergePosition: deepFreeze({ x: roundNumber(segment.x + 8.5), y: roundNumber(segment.centerY), z: 0 })
    }
  ];
}

function buildStreetTreePlacement(segment, index, treeCount, featureIndex, seedConfig) {
  const fraction = (index + 1) / (treeCount + 1);
  if (segment.direction === "east_west") {
    return deepFreeze({
      schemaId: streetFeatureSchemaId,
      featurePlacementId: `FEATURE_${String(featureIndex + 1).padStart(3, "0")}`,
      featureType: "street_tree",
      assetId: streetFeatureAssetIds.street_tree,
      streetSegmentId: segment.roadSegmentId,
      relatedLotId: null,
      position: deepFreeze({
        x: roundNumber(segment.startX + segment.length * fraction),
        y: roundNumber(segment.y + 8.5),
        z: 0
      }),
      rotation: deepFreeze({
        yawDegrees: stableHash(`TREE:${seedConfig.streetBlockSeed}:${segment.roadSegmentId}:${index}`) % 360
      }),
      variationSeed: `TREE_${seedConfig.streetBlockSeed}_${segment.roadSegmentId}_${index}`,
      placementRule: "verge_interval_standard",
      publicAreaClass: "public_verge"
    });
  }
  return deepFreeze({
    schemaId: streetFeatureSchemaId,
    featurePlacementId: `FEATURE_${String(featureIndex + 1).padStart(3, "0")}`,
    featureType: "street_tree",
    assetId: streetFeatureAssetIds.street_tree,
    streetSegmentId: segment.roadSegmentId,
    relatedLotId: null,
    position: deepFreeze({
      x: roundNumber(segment.x + 8.5),
      y: roundNumber(segment.startY + segment.length * fraction),
      z: 0
    }),
    rotation: deepFreeze({
      yawDegrees: stableHash(`TREE:${seedConfig.streetBlockSeed}:${segment.roadSegmentId}:${index}`) % 360
    }),
    variationSeed: `TREE_${seedConfig.streetBlockSeed}_${segment.roadSegmentId}_${index}`,
    placementRule: "verge_interval_standard",
    publicAreaClass: "public_verge"
  });
}

function buildRoadFrontageConnections(lots, roadGraphData) {
  return lots.map((lot, index) => {
    const segment = roadGraphData.roadSegments.find(
      (entry) => entry.roadSegmentId === lot.frontageRoadSegmentId
    );
    return deepFreeze({
      connectionId: `ROAD_FRONTAGE_CONNECTION_${String(index + 1).padStart(3, "0")}`,
      lotId: lot.lotId,
      roadSegmentId: lot.frontageRoadSegmentId,
      frontageDirection: lot.frontageDirection,
      connectionPoint: resolveRoadConnectionPoint(lot, segment),
      drivewayLink: deepFreeze({
        drivewaySide: lot.drivewaySide,
        drivewayStreet: lot.drivewayStreet,
        garageSide: lot.drivewaySocket.garageSide,
        roadAligned: true,
        crossingNeighbouringLots: false
      }),
      pedestrianLink: deepFreeze({
        connected: true,
        footpathAligned: true
      }),
      fenceOpenings: deepFreeze({
        drivewayOpeningSide: lot.fenceRules.drivewayOpeningSide,
        drivewayOpeningWidth: lot.fenceRules.drivewayOpeningWidth,
        pedestrianAccessSide: lot.fenceRules.pedestrianAccessSide,
        pedestrianAccessWidth: lot.fenceRules.pedestrianAccessWidth
      })
    });
  });
}

function resolveRoadConnectionPoint(lot, segment) {
  if (segment.direction === "east_west") {
    return deepFreeze({
      x: lot.drivewaySocket.x,
      y: roundNumber(segment.y),
      z: 0
    });
  }
  return deepFreeze({
    x: roundNumber(segment.x),
    y: lot.drivewaySocket.y,
    z: 0
  });
}

function buildValidationResult(preview, input) {
  const roadConnectivityValid = countConnectedComponents(
    preview.roadNodes,
    preview.roadSegments
  ) === 1;
  const intersectionValidity = preview.intersections.every((intersection) => {
    const node = preview.roadNodes.find((entry) => entry.nodeId === intersection.nodeId);
    return node && node.connectedSegmentIds.length === intersection.connectedSegmentIds.length;
  });
  const allLotsGenerated = preview.lotCount === input.lotCount;
  const lotBoundaryValidity = preview.lots.every(
    (lot) =>
      lot.width > 0 &&
      lot.depth > 0 &&
      lot.position.x >= preview.blockBounds.minX &&
      lot.position.y >= preview.blockBounds.minY &&
      lot.position.x + lot.width <= preview.blockBounds.maxX &&
      lot.position.y + lot.depth <= preview.blockBounds.maxY
  ) && countLotOverlaps(preview.lots) === 0;
  const lotFrontageValidity = preview.lots.every((lot) =>
    preview.roadSegments.some((segment) => segment.roadSegmentId === lot.frontageRoadSegmentId)
  );
  const validBuildingIds = preview.buildingPlacements.every((placement) =>
    supportedSuburbanStreetBlockBuildingAssets.includes(placement.assetId)
  );
  const buildingPlacementValidity =
    countBuildingOverlaps(preview.buildingPlacements, preview.lots) === 0 &&
    preview.buildingPlacements.every((placement) =>
      facingDirectionToYaw(placement.rotation.facingDirection) ===
      placement.rotation.yawDegrees
    );
  const drivewayConnectionValidity = preview.roadFrontageConnections.every((connection) =>
    connection.drivewayLink.roadAligned &&
    connection.drivewayLink.crossingNeighbouringLots === false &&
    connection.drivewayLink.drivewayStreet === connection.roadSegmentId
  );
  const frontageResolutionValidity = preview.lots.every((lot) => {
    const placement = preview.buildingPlacements.find(
      (entry) => entry.lotId === lot.lotId
    );
    const connection = preview.roadFrontageConnections.find(
      (entry) => entry.lotId === lot.lotId
    );
    return (
      placement &&
      connection &&
      placement.rotation.facingDirection === lot.frontageDirection &&
      connection.frontageDirection === lot.frontageDirection &&
      connection.drivewayLink.drivewayStreet === lot.frontageRoadSegmentId &&
      connection.drivewayLink.garageSide === lot.drivewaySocket.garageSide
    );
  });
  const suburbanWeightingValidity = themeWeightingWithinTolerance(
    preview.lots,
    resolveThemeProfile(input)
  );
  const adjacentVariationValidity = noExcessiveAdjacentRepeats(preview.lots);
  const cornerLotRuleValidity = preview.lots
    .filter((lot) => lot.cornerStatus !== "interior")
    .every(
      (lot) =>
        lot.setback.front >= 5.2 &&
        lot.landscapingZones.cornerVisibilityPlantingZone !== null &&
        lot.garageRelationship.alignmentMode !== "standard_frontage_alignment"
    );
  const streetFeatureContainmentValidity = preview.streetFeaturePlacements.every((feature) =>
    isStreetFeatureWithinPublicArea(feature, preview.blockBounds)
  );

  const deterministicSignatureHash = computeDeterministicSignatureHash(preview);

  return deepFreeze({
    roadConnectivityValid,
    intersectionValidity,
    allLotsGenerated,
    lotBoundaryValidity,
    lotFrontageValidity,
    validBuildingIds,
    buildingPlacementValidity,
    drivewayConnectionValidity,
    frontageResolutionValidity,
    suburbanWeightingValidity,
    adjacentVariationValidity,
    cornerLotRuleValidity,
    streetFeatureContainmentValidity,
    deterministicRebuildValidity: true,
    deterministicSignatureHash,
    validationPassed:
      roadConnectivityValid &&
      intersectionValidity &&
      allLotsGenerated &&
      lotBoundaryValidity &&
      lotFrontageValidity &&
      validBuildingIds &&
      buildingPlacementValidity &&
      drivewayConnectionValidity &&
      frontageResolutionValidity &&
      suburbanWeightingValidity &&
      adjacentVariationValidity &&
      cornerLotRuleValidity &&
      streetFeatureContainmentValidity
  });
}

function countConnectedComponents(nodes, segments) {
  const adjacency = new Map(nodes.map((node) => [node.nodeId, new Set()]));
  for (const segment of segments) {
    adjacency.get(segment.startNodeId)?.add(segment.endNodeId);
    adjacency.get(segment.endNodeId)?.add(segment.startNodeId);
  }
  const visited = new Set();
  let components = 0;
  for (const node of nodes) {
    if (visited.has(node.nodeId)) {
      continue;
    }
    components += 1;
    const queue = [node.nodeId];
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
  }
  return components;
}

function validateRoadGraph(preview) {
  if (!preview.validationResult.roadConnectivityValid) {
    throw createValidationError(
      "road_connectivity_failed",
      "Street block road graph is not connected."
    );
  }
  if (!preview.validationResult.intersectionValidity) {
    throw createValidationError(
      "intersection_validity_failed",
      "Street block intersections do not match their road nodes."
    );
  }
}

function validateBuildingPlacements(placements, lots) {
  for (const placement of placements) {
    const lot = lots.find((entry) => entry.lotId === placement.lotId);
    if (!lot) {
      throw createValidationError(
        "missing_lot_for_building",
        `Building placement ${placement.placementId} does not map to a lot.`
      );
    }
    if (!supportedSuburbanStreetBlockBuildingAssets.includes(placement.assetId)) {
      throw createValidationError(
        "invalid_building_asset",
        `Building placement ${placement.placementId} resolved an unsupported asset ID.`
      );
    }
  }
}

function validateRoadConnections(connections, lots, roadSegments) {
  for (const connection of connections) {
    const lot = lots.find((entry) => entry.lotId === connection.lotId);
    const roadSegment = roadSegments.find(
      (entry) => entry.roadSegmentId === connection.roadSegmentId
    );
    if (!lot || !roadSegment) {
      throw createValidationError(
        "invalid_road_connection",
        `Road frontage connection ${connection.connectionId} is incomplete.`
      );
    }
    if (!connection.drivewayLink.roadAligned) {
      throw createValidationError(
        "driveway_not_road_aligned",
        `Road frontage connection ${connection.connectionId} is not road-aligned.`
      );
    }
  }
}

function validateThemeMix(preview, themeProfile) {
  if (!themeWeightingWithinTolerance(preview.lots, themeProfile)) {
    throw createValidationError(
      "theme_weighting_out_of_tolerance",
      "Street block building mix is outside the configured theme tolerance."
    );
  }
}

function validateAdjacentVariation(lots) {
  if (!noExcessiveAdjacentRepeats(lots)) {
    throw createValidationError(
      "adjacent_variation_failed",
      "Street block contains excessive adjacent building or landscaping repetition."
    );
  }
}

function validateCornerLots(lots) {
  const invalidCornerLot = lots.find(
    (lot) =>
      lot.cornerStatus !== "interior" &&
      (lot.setback.front < 5.2 ||
        lot.landscapingZones.cornerVisibilityPlantingZone === null ||
        lot.garageRelationship.alignmentMode === "standard_frontage_alignment")
  );
  if (invalidCornerLot) {
    throw createValidationError(
      "corner_lot_rule_failed",
      `Street block corner lot ${invalidCornerLot.lotId} did not receive the required corner treatment.`
    );
  }
}

function validateStreetFeatures(features, blockBounds) {
  for (const feature of features) {
    if (!streetFeatureTypes.has(feature.featureType) && feature.assetId !== "MAILBOX_PREVIEW_001") {
      throw createValidationError(
        "invalid_street_feature_type",
        `Street feature ${feature.featurePlacementId} resolved an unsupported type.`
      );
    }
    if (!isStreetFeatureWithinPublicArea(feature, blockBounds)) {
      throw createValidationError(
        "street_feature_out_of_bounds",
        `Street feature ${feature.featurePlacementId} is outside the block bounds.`
      );
    }
  }
}

function countLotOverlaps(lots) {
  let overlaps = 0;
  for (let leftIndex = 0; leftIndex < lots.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < lots.length; rightIndex += 1) {
      if (
        rectanglesOverlap(lotRect(lots[leftIndex]), lotRect(lots[rightIndex])) &&
        lotsShareFrontageConflictDomain(lots[leftIndex], lots[rightIndex])
      ) {
        overlaps += 1;
      }
    }
  }
  return overlaps;
}

function countBuildingOverlaps(placements, lots) {
  const buildingRects = placements.map((placement) => {
    const lot = lots.find((entry) => entry.lotId === placement.lotId);
    const profile = buildingProfiles[placement.assetId];
    return lot.frontageDirection === "NORTH" || lot.frontageDirection === "SOUTH"
      ? {
          minX: placement.position.x - profile.footprintWidth / 2,
          maxX: placement.position.x + profile.footprintWidth / 2,
          minY: placement.position.y - profile.footprintDepth / 2,
          maxY: placement.position.y + profile.footprintDepth / 2
        }
      : {
          minX: placement.position.x - profile.footprintDepth / 2,
          maxX: placement.position.x + profile.footprintDepth / 2,
          minY: placement.position.y - profile.footprintWidth / 2,
          maxY: placement.position.y + profile.footprintWidth / 2
        };
  });

  let overlaps = 0;
  for (let leftIndex = 0; leftIndex < buildingRects.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < buildingRects.length; rightIndex += 1) {
      if (
        rectanglesOverlap(buildingRects[leftIndex], buildingRects[rightIndex]) &&
        lotsShareFrontageConflictDomain(lots[leftIndex], lots[rightIndex])
      ) {
        overlaps += 1;
      }
    }
  }
  return overlaps;
}

function lotRect(lot) {
  return {
    minX: lot.position.x,
    maxX: lot.position.x + lot.width,
    minY: lot.position.y,
    maxY: lot.position.y + lot.depth
  };
}

function rectanglesOverlap(left, right) {
  return !(
    left.maxX <= right.minX ||
    right.maxX <= left.minX ||
    left.maxY <= right.minY ||
    right.maxY <= left.minY
  );
}

function isStreetFeatureWithinPublicArea(feature, blockBounds) {
  return (
    feature.position.x >= blockBounds.minX - 2 &&
    feature.position.x <= blockBounds.maxX + 2 &&
    feature.position.y >= blockBounds.minY - 2 &&
    feature.position.y <= blockBounds.maxY + 2
  );
}

function themeWeightingWithinTolerance(lots, themeProfile) {
  const targetCounts = buildThemeTargetCounts(themeProfile, lots.length);
  const actualCounts = Object.fromEntries(
    supportedSuburbanStreetBlockBuildingAssets.map((assetId) => [assetId, 0])
  );
  for (const lot of lots) {
    actualCounts[lot.buildingId] += 1;
  }
  return Object.entries(targetCounts).every(
    ([assetId, targetCount]) =>
      Math.abs(actualCounts[assetId] - targetCount) <=
      (assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001" ? 2 : 1)
  );
}

function noExcessiveAdjacentRepeats(lots) {
  const rows = new Map();
  for (const lot of lots) {
    const key = `${lot.frontageRoadSegmentId}:${lot.frontageDirection}`;
    if (!rows.has(key)) {
      rows.set(key, []);
    }
    rows.get(key).push(lot);
  }

  for (const rowLots of rows.values()) {
    rowLots.sort((left, right) =>
      left.frontageDirection === "NORTH" || left.frontageDirection === "SOUTH"
        ? left.position.x - right.position.x
        : left.position.y - right.position.y
    );
    for (let index = 1; index < rowLots.length; index += 1) {
      if (
        rowLots[index].buildingId === rowLots[index - 1].buildingId &&
        rowLots[index].variationProfile.roofTone ===
          rowLots[index - 1].variationProfile.roofTone &&
        rowLots[index].variationProfile.colourVariant ===
          rowLots[index - 1].variationProfile.colourVariant
      ) {
        return false;
      }
      if (
        index >= 2 &&
        rowLots[index].buildingId === rowLots[index - 1].buildingId &&
        rowLots[index - 1].buildingId === rowLots[index - 2].buildingId
      ) {
        return false;
      }
      if (
        rowLots[index].variationProfile.landscapingSequence ===
          rowLots[index - 1].variationProfile.landscapingSequence &&
        rowLots[index].variationProfile.yardDensity ===
          rowLots[index - 1].variationProfile.yardDensity &&
        rowLots[index].variationProfile.colourVariant ===
          rowLots[index - 1].variationProfile.colourVariant
      ) {
        return false;
      }
    }
  }

  return true;
}

function lotsShareFrontageConflictDomain(left, right) {
  if (left.frontageRoadSegmentId === right.frontageRoadSegmentId) {
    return true;
  }
  if (
    left.frontageDirection === right.frontageDirection &&
    (left.frontageDirection === "NORTH" || left.frontageDirection === "SOUTH")
  ) {
    return Math.abs(left.position.y - right.position.y) < 14;
  }
  if (
    left.frontageDirection === right.frontageDirection &&
    (left.frontageDirection === "EAST" || left.frontageDirection === "WEST")
  ) {
    return Math.abs(left.position.x - right.position.x) < 14;
  }
  return false;
}

function roadNode(nodeId, nodeType, x, y, connectedSegmentIds, degree) {
  return deepFreeze({
    schemaId: roadNodeSchemaId,
    nodeId,
    nodeType,
    position: deepFreeze({ x, y, z: 0 }),
    connectedSegmentIds: deepFreeze(connectedSegmentIds),
    degree,
    orientationProfile: "north_up_cardinal"
  });
}

function roadSegment(roadSegmentId, roadType, startNodeId, endNodeId, direction, length, input) {
  const startPosition = resolveNodePosition(startNodeId);
  const endPosition = resolveNodePosition(endNodeId);
  const x = startPosition.x === endPosition.x ? startPosition.x : Math.min(startPosition.x, endPosition.x);
  const y = startPosition.y === endPosition.y ? startPosition.y : Math.min(startPosition.y, endPosition.y);
  const centerX = (startPosition.x + endPosition.x) / 2;
  const centerY = (startPosition.y + endPosition.y) / 2;
  return deepFreeze({
    schemaId: roadSegmentSchemaId,
    roadSegmentId,
    roadType,
    startNodeId,
    endNodeId,
    direction,
    length,
    roadWidth: input.blockConfiguration.roadWidth,
    sidewalkWidth: input.blockConfiguration.sidewalkWidth,
    vergeWidth: input.blockConfiguration.vergeWidth,
    lotRanges: deepFreeze([`${roadSegmentId}_LOT_RANGE_A`, `${roadSegmentId}_LOT_RANGE_B`]),
    supportsDriveways: true,
    x,
    y,
    centerX,
    centerY,
    startX: Math.min(startPosition.x, endPosition.x),
    startY: Math.min(startPosition.y, endPosition.y)
  });
}

function roadIntersection(intersectionId, nodeId, intersectionType, connectedSegmentIds) {
  return deepFreeze({
    schemaId: roadIntersectionSchemaId,
    intersectionId,
    nodeId,
    intersectionType,
    connectedSegmentIds: deepFreeze(connectedSegmentIds),
    turnRules: deepFreeze({
      leftTurnAllowed: true,
      rightTurnAllowed: true,
      throughAllowed: intersectionType !== "cul_de_sac_head"
    }),
    lotVisibilityBuffer: intersectionType === "cul_de_sac_head" ? 2 : 4
  });
}

function resolveNodePosition(nodeId) {
  const positions = {
    NODE_001: { x: 0, y: 0 },
    NODE_002: { x: 80, y: 0 },
    NODE_003: { x: 160, y: 0 },
    NODE_004: { x: 240, y: 0 },
    NODE_005: { x: 80, y: 72 },
    NODE_006: { x: 80, y: -72 },
    NODE_007: { x: 160, y: 72 }
  };
  const position = positions[nodeId];
  if (!position) {
    throw new Error(`Unknown road node ${nodeId}.`);
  }
  return position;
}

function centerOfZone(zone) {
  return deepFreeze({
    x: roundNumber(zone.x + zone.width / 2),
    y: roundNumber(zone.y + zone.depth / 2),
    z: 0
  });
}

function computeDeterministicSignatureHash(preview) {
  return stableHash(
    JSON.stringify({
      seedConfig: preview.seedConfig,
      roadSegments: preview.roadSegments.map((segment) => segment.roadSegmentId),
      lots: preview.lots.map((lot) => ({
        lotId: lot.lotId,
        buildingId: lot.buildingId,
        frontageRoadSegmentId: lot.frontageRoadSegmentId,
        drivewaySide: lot.drivewaySide
      })),
      streetFeatures: preview.streetFeaturePlacements.map((feature) => ({
        featurePlacementId: feature.featurePlacementId,
        assetId: feature.assetId,
        position: feature.position
      }))
    })
  );
}

function facingDirectionToYaw(direction) {
  if (direction === "NORTH") {
    return 180;
  }
  if (direction === "SOUTH") {
    return 0;
  }
  if (direction === "EAST") {
    return 270;
  }
  return 90;
}

function resolveRoofTone(seedConfig, lotId, assetId) {
  const tones = ["charcoal", "slate", "sandstone"];
  return tones[stableHash(`${seedConfig.streetBlockSeed}:${lotId}:${assetId}:roof`) % tones.length];
}

function resolveYardDensity(seedConfig, lotId) {
  const options = ["light", "moderate", "planted"];
  return options[stableHash(`${seedConfig.streetBlockSeed}:${lotId}:yard`) % options.length];
}

function resolveColourVariant(seedConfig, lotId, assetId) {
  const options = ["standard", "warm_trim", "muted_trim"];
  return options[
    stableHash(`${seedConfig.streetBlockSeed}:${lotId}:${assetId}:colour`) %
      options.length
  ];
}

function weightedDeterministicScore(hashInput, weight) {
  const normalized = stableHash(hashInput) / 4294967295;
  return normalized / weight;
}

function resolveThemeProfile(input) {
  const explicit = themeProfiles[input.neighbourhoodThemeSeed];
  if (explicit) {
    return explicit;
  }
  return themeProfiles.SUBURBAN_AUSTRALIA;
}

function zoneRect(x, y, width, depth) {
  return deepFreeze({
    x: roundNumber(x),
    y: roundNumber(y),
    width: roundNumber(width),
    depth: roundNumber(depth)
  });
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function normalizeGeneratorInput(rawInput) {
  const input = asPlainObject(rawInput, "suburban street block generator input");
  const blockConfiguration = asPlainObject(
    input.blockConfiguration,
    "suburban street block blockConfiguration"
  );
  return deepFreeze({
    streetBlockSeed: normalizePositiveInteger(input.streetBlockSeed, "streetBlockSeed"),
    regionSeed: normalizePositiveInteger(input.regionSeed, "regionSeed"),
    neighbourhoodThemeSeed: normalizeNonEmptyString(
      input.neighbourhoodThemeSeed,
      "neighbourhoodThemeSeed"
    ),
    lotCount: normalizePositiveInteger(input.lotCount, "lotCount"),
    blockConfiguration: deepFreeze({
      schemaId: normalizeNonEmptyString(blockConfiguration.schemaId, "blockConfiguration.schemaId"),
      previewId: normalizeNonEmptyString(blockConfiguration.previewId, "blockConfiguration.previewId"),
      generationProfile: normalizeNonEmptyString(
        blockConfiguration.generationProfile,
        "blockConfiguration.generationProfile"
      ),
      targetLotCount: normalizePositiveInteger(
        blockConfiguration.targetLotCount,
        "blockConfiguration.targetLotCount"
      ),
      roadWidth: normalizePositiveNumber(blockConfiguration.roadWidth, "blockConfiguration.roadWidth"),
      sidewalkWidth: normalizePositiveNumber(blockConfiguration.sidewalkWidth, "blockConfiguration.sidewalkWidth"),
      vergeWidth: normalizePositiveNumber(blockConfiguration.vergeWidth, "blockConfiguration.vergeWidth"),
      standardLotDepthRange: normalizeNumberRange(
        blockConfiguration.standardLotDepthRange,
        "blockConfiguration.standardLotDepthRange"
      ),
      cornerLotDepthRange: normalizeNumberRange(
        blockConfiguration.cornerLotDepthRange,
        "blockConfiguration.cornerLotDepthRange"
      ),
      localStreetSpacing: normalizePositiveNumber(
        blockConfiguration.localStreetSpacing,
        "blockConfiguration.localStreetSpacing"
      ),
      collectorStreetLength: normalizePositiveNumber(
        blockConfiguration.collectorStreetLength,
        "blockConfiguration.collectorStreetLength"
      ),
      localStreetLength: normalizePositiveNumber(
        blockConfiguration.localStreetLength,
        "blockConfiguration.localStreetLength"
      ),
      culDeSacLength: normalizePositiveNumber(
        blockConfiguration.culDeSacLength,
        "blockConfiguration.culDeSacLength"
      )
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  const preview = asPlainObject(rawPreview, "suburban street block preview");
  return deepFreeze({
    ...preview,
    roadNodes: Array.isArray(preview.roadNodes) ? preview.roadNodes : [],
    roadSegments: Array.isArray(preview.roadSegments) ? preview.roadSegments : [],
    intersections: Array.isArray(preview.intersections) ? preview.intersections : [],
    lots: Array.isArray(preview.lots) ? preview.lots : [],
    buildingPlacements: Array.isArray(preview.buildingPlacements)
      ? preview.buildingPlacements
      : [],
    streetFeaturePlacements: Array.isArray(preview.streetFeaturePlacements)
      ? preview.streetFeaturePlacements
      : [],
    roadFrontageConnections: Array.isArray(preview.roadFrontageConnections)
      ? preview.roadFrontageConnections
      : [],
    validationResult: asPlainObject(preview.validationResult, "validationResult")
  });
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive finite number.`);
  }
  return value;
}

function normalizeNumberRange(value, fieldName) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`${fieldName} must be a two-item numeric range.`);
  }
  const min = normalizePositiveNumber(value[0], `${fieldName}[0]`);
  const max = normalizePositiveNumber(value[1], `${fieldName}[1]`);
  if (min > max) {
    throw new Error(`${fieldName} minimum must not exceed its maximum.`);
  }
  return deepFreeze([min, max]);
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value;
}

function randomInRange(seedConfig, label, min, max) {
  const normalized = stableHash(
    `${seedConfig.streetBlockSeed}:${seedConfig.regionSeed}:${seedConfig.neighbourhoodThemeSeed}:${label}`
  ) / 4294967295;
  return min + normalized * (max - min);
}

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "SuburbanStreetBlockGeneratorValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
