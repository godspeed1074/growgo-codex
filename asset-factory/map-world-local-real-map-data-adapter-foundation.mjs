import {
  createMapWorldLiveMapFoundation,
  mapWorldLiveMapFoundationDefinition,
  validateMapWorldLiveMapFoundation
} from "./map-world-live-map-foundation.mjs";
import {
  createMapWorldRealLocationPreviewFoundation,
  mapWorldRealLocationPreviewFoundationDefinition,
  validateMapWorldRealLocationPreviewFoundation
} from "./map-world-real-location-preview-foundation.mjs";
import {
  createMapCoordinateWorldResolverFoundation,
  mapCoordinateWorldResolverFoundationDefinition,
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";

export const mapWorldLocalRealMapDataAdapterFoundationRequiredFields = Object.freeze([
  "providerId",
  "mapDataId",
  "coordinate",
  "bounds",
  "roads",
  "landAreas",
  "buildingHints",
  "vegetationHints",
  "terrainHints",
  "landmarkHints",
  "validationResult"
]);

export const mapWorldLocalRealMapDataAdapterFoundationDefinition = deepFreeze({
  ...mapWorldRealLocationPreviewFoundationDefinition
});

const supportedDensityProfiles = new Set([
  "sparse_coastal",
  "suburban_coastal",
  "town_coastal"
]);

export async function createMapWorldLocalRealMapDataAdapterFoundation(
  rawDefinition = mapWorldLocalRealMapDataAdapterFoundationDefinition,
  options = {}
) {
  const liveMapFoundation = await createMapWorldLiveMapFoundation(rawDefinition, options);
  const previewFoundation = await createMapWorldRealLocationPreviewFoundation(
    rawDefinition,
    options
  );
  const fixtureContext = buildFixtureContext(rawDefinition, liveMapFoundation, previewFoundation);
  const roads = buildRoadsFromFixture(fixtureContext);
  const landAreas = buildLandAreasFromFixture(fixtureContext);
  const buildingHints = buildBuildingHints(fixtureContext, landAreas, roads);
  const vegetationHints = buildVegetationHints(
    fixtureContext,
    landAreas,
    buildingHints
  );
  const terrainHints = buildTerrainHints(fixtureContext);
  const landmarkHints = buildLandmarkHints(
    fixtureContext,
    previewFoundation.previewScene.assetInstances
  );
  const mapFixtureData = deepFreeze({
    roads,
    landAreas,
    buildingHints,
    vegetationHints,
    landmarkHints
  });

  const resolverDefinition = buildResolverDefinition(
    liveMapFoundation,
    previewFoundation,
    mapFixtureData
  );
  const worldResolver = await createMapCoordinateWorldResolverFoundation(
    resolverDefinition,
    options
  );

  const providerId = "LOCAL_FIXTURE_MAP_PROVIDER_001";
  const mapDataId = createMapDataId(
    providerId,
    worldResolver.worldLocationResolver.worldId,
    previewFoundation.coordinate
  );

  const foundation = deepFreeze({
    providerId,
    mapDataId,
    coordinate: deepFreeze({
      latitude: previewFoundation.coordinate.latitude,
      longitude: previewFoundation.coordinate.longitude
    }),
    bounds: deepFreeze({
      ...worldResolver.worldLocationResolver.bounds
    }),
    roads,
    landAreas,
    buildingHints,
    vegetationHints,
    terrainHints,
    landmarkHints,
    providerBoundary: deepFreeze({
      providerKind: "local_fixture_map_provider",
      compatibleFutureProviderKinds: deepFreeze([
        "local_fixture_map_provider",
        "future_osm_provider"
      ]),
      liveNetworkAllowed: false,
      deterministicSource: true
    }),
    mapFixtureData,
    worldResolver,
    mapWorldLiveMapFoundation: liveMapFoundation,
    mapWorldRealLocationPreview: previewFoundation,
    validationResult: deepFreeze({
      deterministicOutputValid:
        previewFoundation.validationResult.deterministicOutputValid &&
        worldResolver.validationResult.sameCoordinateSameWorld,
      providerContractValid: true,
      coordinateConsistencyValid:
        previewFoundation.coordinate.latitude === worldResolver.worldLocationResolver.latitude &&
        previewFoundation.coordinate.longitude === worldResolver.worldLocationResolver.longitude,
      fallbackBehaviorValid:
        liveMapFoundation.validationResult.fallbackBehaviorPreserved === true,
      localFixtureDataValid:
        roads.length >= 5 &&
        landAreas.length >= 5 &&
        buildingHints.length >= 6 &&
        vegetationHints.length >= 6 &&
        landmarkHints.length >= 1,
      mapDataContractValid:
        roads.every((road) => Array.isArray(road.connectedIntersectionIds)) &&
        landAreas.every((area) => Array.isArray(area.boundaryPoints)) &&
        buildingHints.every((hint) => typeof hint.facing === "string") &&
        vegetationHints.every((hint) => typeof hint.density === "string"),
      performanceSafeObjectCountsValid:
        roads.length <= 12 &&
        buildingHints.length <= 20 &&
        vegetationHints.length <= 40 &&
        worldResolver.settlement.settlementSummary.generatedAssetCount <= 80,
      placementValidityPreserved:
        worldResolver.settlement.validationResult.placementValidity === true,
      assetReferenceValidityPreserved:
        worldResolver.settlement.validationResult.assetReferenceValidity === true,
      settlementMatchesFixture:
        worldResolver.settlement.validationResult.settlementMatchesMapFixture === true &&
        worldResolver.settlement.roadNetwork.roadSegments.length === roads.length &&
        worldResolver.settlement.buildingPlacements.length >= buildingHints.length &&
        worldResolver.settlement.vegetationPlacements.length >= vegetationHints.length
    })
  });

  const validation = validateMapWorldLocalRealMapDataAdapterFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldLocalRealMapDataAdapterFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const liveMapValidation = validateMapWorldLiveMapFoundation(
      foundation.mapWorldLiveMapFoundation
    );
    if (!liveMapValidation.ok) {
      throw createValidationError(
        liveMapValidation.errorCode ?? "live_map_invalid",
        liveMapValidation.message ??
          "Map world local real map data adapter requires a valid live map foundation."
      );
    }

    const previewValidation = validateMapWorldRealLocationPreviewFoundation(
      foundation.mapWorldRealLocationPreview
    );
    if (!previewValidation.ok) {
      throw createValidationError(
        previewValidation.errorCode ?? "preview_invalid",
        previewValidation.message ??
          "Map world local real map data adapter requires a valid real-location preview foundation."
      );
    }

    const worldResolverValidation = validateMapCoordinateWorldResolverFoundation(
      foundation.worldResolver
    );
    if (!worldResolverValidation.ok) {
      throw createValidationError(
        worldResolverValidation.errorCode ?? "world_resolver_invalid",
        worldResolverValidation.message ??
          "Map world local real map data adapter requires a valid world resolver."
      );
    }

    if (!foundation.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world local real map data adapter deterministicOutputValid must be true."
      );
    }
    if (!foundation.validationResult.providerContractValid) {
      throw createValidationError(
        "provider_contract_invalid",
        "Map world local real map data adapter providerContractValid must be true."
      );
    }
    if (!foundation.validationResult.coordinateConsistencyValid) {
      throw createValidationError(
        "coordinate_consistency_invalid",
        "Map world local real map data adapter coordinateConsistencyValid must be true."
      );
    }
    if (!foundation.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_behavior_invalid",
        "Map world local real map data adapter fallbackBehaviorValid must be true."
      );
    }
    if (!foundation.validationResult.localFixtureDataValid) {
      throw createValidationError(
        "local_fixture_data_invalid",
        "Map world local real map data adapter localFixtureDataValid must be true."
      );
    }
    if (!foundation.validationResult.mapDataContractValid) {
      throw createValidationError(
        "map_data_contract_invalid",
        "Map world local real map data adapter mapDataContractValid must be true."
      );
    }
    if (!foundation.validationResult.performanceSafeObjectCountsValid) {
      throw createValidationError(
        "performance_safe_counts_invalid",
        "Map world local real map data adapter performanceSafeObjectCountsValid must be true."
      );
    }
    if (!foundation.validationResult.placementValidityPreserved) {
      throw createValidationError(
        "placement_validity_invalid",
        "Map world local real map data adapter placementValidityPreserved must be true."
      );
    }
    if (!foundation.validationResult.assetReferenceValidityPreserved) {
      throw createValidationError(
        "asset_reference_invalid",
        "Map world local real map data adapter assetReferenceValidityPreserved must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldLocalRealMapDataAdapter: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldLocalRealMapDataAdapterFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldLocalRealMapDataAdapter: null
    });
  }
}

function buildResolverDefinition(liveMapFoundation, previewFoundation, mapFixtureData) {
  return deepFreeze({
    ...mapCoordinateWorldResolverFoundationDefinition,
    latitude: previewFoundation.coordinate.latitude,
    longitude: previewFoundation.coordinate.longitude,
    bounds: deepFreeze({
      minLatitude:
        previewFoundation.coordinate.latitude -
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxY - liveMapFoundation.bounds.minY),
      minLongitude:
        previewFoundation.coordinate.longitude -
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxX - liveMapFoundation.bounds.minX),
      maxLatitude:
        previewFoundation.coordinate.latitude +
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxY - liveMapFoundation.bounds.minY),
      maxLongitude:
        previewFoundation.coordinate.longitude +
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxX - liveMapFoundation.bounds.minX),
      ...liveMapFoundation.bounds
    }),
    seed:
      previewFoundation.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment
        .mapWorldRealMapDisplay.worldAttachment.worldLocationResolver.seed,
    terrainType: previewFoundation.resolvedWorld.terrainType,
    mapFixtureData
  });
}

function buildFixtureContext(rawDefinition, liveMapFoundation, previewFoundation) {
  const bounds = liveMapFoundation.bounds;
  const seed =
    previewFoundation.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment
      .mapWorldRealMapDisplay.worldAttachment.worldLocationResolver.seed;
  const densityProfile = selectDensityProfile(rawDefinition);
  const densityConfig = buildDensityProfileConfig(densityProfile, bounds);
  const height = bounds.maxY - bounds.minY;
  const shorelineY = roundNumber(bounds.minY + height * densityConfig.shorelineRatio);

  return deepFreeze({
    bounds: deepFreeze({ ...bounds }),
    coordinate: deepFreeze({
      latitude: previewFoundation.coordinate.latitude,
      longitude: previewFoundation.coordinate.longitude
    }),
    seed,
    densityProfile,
    densityConfig,
    shorelineY
  });
}

function buildRoadsFromFixture(fixtureContext) {
  const eastWestRoads = fixtureContext.densityConfig.eastWestRoadYs.map((roadY, rowIndex) => {
    const roadSegmentId = `LOCAL_MAP_ROAD_SEGMENT_${String(rowIndex + 1).padStart(3, "0")}`;
    const connectedIntersectionIds = fixtureContext.densityConfig.northSouthRoadXs.map(
      (_, columnIndex) =>
        `LOCAL_MAP_INTERSECTION_${String(rowIndex * fixtureContext.densityConfig.northSouthRoadXs.length + columnIndex + 1).padStart(3, "0")}`
    );
    const roadClass =
      rowIndex === fixtureContext.densityConfig.eastWestRoadYs.length - 1
        ? "coastal_view_road"
        : "residential_row_road";

    return deepFreeze({
      roadSegmentId,
      roadClass,
      orientation: "east-west",
      start: deepFreeze({
        x: fixtureContext.bounds.minX + 42,
        y: roadY
      }),
      end: deepFreeze({
        x: fixtureContext.bounds.maxX - 46,
        y: roadY
      }),
      width: roadClass === "coastal_view_road" ? 22 : 26,
      connectedIntersectionIds: deepFreeze(connectedIntersectionIds)
    });
  });

  const eastWestCount = eastWestRoads.length;
  const northSouthRoads = fixtureContext.densityConfig.northSouthRoadXs.map((roadX, columnIndex) =>
    deepFreeze({
      roadSegmentId: `LOCAL_MAP_ROAD_SEGMENT_${String(eastWestCount + columnIndex + 1).padStart(3, "0")}`,
      roadClass: "residential_spur",
      orientation: "north-south",
      start: deepFreeze({
        x: roadX,
        y: fixtureContext.densityConfig.eastWestRoadYs[0]
      }),
      end: deepFreeze({
        x: roadX,
        y: fixtureContext.densityConfig.eastWestRoadYs[fixtureContext.densityConfig.eastWestRoadYs.length - 1]
      }),
      width: 18,
      connectedIntersectionIds: deepFreeze(
        fixtureContext.densityConfig.eastWestRoadYs.map(
          (_, rowIndex) =>
            `LOCAL_MAP_INTERSECTION_${String(rowIndex * fixtureContext.densityConfig.northSouthRoadXs.length + columnIndex + 1).padStart(3, "0")}`
        )
      )
    })
  );

  return deepFreeze([...eastWestRoads, ...northSouthRoads]);
}

function buildLandAreasFromFixture(fixtureContext) {
  const { minX, maxX, maxY } = fixtureContext.bounds;
  const residentialAreas = fixtureContext.densityConfig.residentialAreaBands.map((band, index) =>
    deepFreeze({
      landAreaId: `LOCAL_MAP_LAND_AREA_RESIDENTIAL_${String(index + 1).padStart(3, "0")}`,
      areaType: "residential_neighbourhood",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: band.minX, y: band.minY }),
        deepFreeze({ x: band.maxX, y: band.minY }),
        deepFreeze({ x: band.maxX, y: band.maxY }),
        deepFreeze({ x: band.minX, y: band.maxY })
      ])
    })
  );

  return deepFreeze([
    ...residentialAreas,
    deepFreeze({
      landAreaId: "LOCAL_MAP_LAND_AREA_COASTLINE_001",
      areaType: "coastline_boundary",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: fixtureContext.bounds.minX, y: fixtureContext.shorelineY }),
        deepFreeze({ x: maxX, y: fixtureContext.shorelineY }),
        deepFreeze({ x: maxX, y: maxY }),
        deepFreeze({ x: fixtureContext.bounds.minX, y: maxY })
      ])
    }),
    deepFreeze({
      landAreaId: "LOCAL_MAP_LAND_AREA_FORESHORE_001",
      areaType: "foreshore_transition",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: fixtureContext.bounds.minX + 28, y: fixtureContext.shorelineY - 54 }),
        deepFreeze({ x: maxX - 28, y: fixtureContext.shorelineY - 54 }),
        deepFreeze({ x: maxX - 28, y: fixtureContext.shorelineY + 24 }),
        deepFreeze({ x: fixtureContext.bounds.minX + 28, y: fixtureContext.shorelineY + 24 })
      ])
    })
  ]);
}

function buildBuildingHints(fixtureContext, landAreas, roads) {
  const residentialRoads = roads.filter((road) => road.roadClass === "residential_row_road");
  const residentialAreas = landAreas.filter((area) => area.areaType === "residential_neighbourhood");
  const rowOffsets = [];

  return deepFreeze(
    fixtureContext.densityConfig.buildingRows.flatMap((row, rowIndex) =>
      row.centerXs.map((centerX, columnIndex) => {
        const rowRoad = residentialRoads[row.roadIndex];
        const residentialAreaId = resolveResidentialAreaId(residentialAreas, centerX);
        const index = rowOffsets.push(0) - 1;
        const buildingWidth = row.variant === "compact" ? 66 : 72;
        const buildingDepth = row.variant === "compact" ? 56 : 60;
        const lotWidth = row.variant === "compact" ? 118 : 128;
        const lotDepth = row.variant === "compact" ? 94 : 108;
        const position = {
          x: centerX,
          y: roundNumber(rowRoad.start.y - (row.variant === "compact" ? 54 : 58))
        };

        return deepFreeze({
          buildingHintId: `LOCAL_MAP_BUILDING_HINT_${String(index + 1).padStart(3, "0")}`,
          assetId: "BUILDING_COASTAL_COTTAGE_001",
          lotId: `COASTAL_SETTLEMENT_LOT_${String(index + 1).padStart(3, "0")}`,
          frontageRoadSegmentId: rowRoad.roadSegmentId,
          position: deepFreeze(position),
          width: lotWidth,
          depth: lotDepth,
          buildingWidth,
          buildingDepth,
          facing: "south",
          residentialAreaId
        });
      })
    )
  );
}

function buildVegetationHints(fixtureContext, landAreas, buildingHints) {
  const perLotOffsets =
    fixtureContext.densityConfig.treesPerLot === 1
      ? [{ x: -22, y: -18, density: "moderate" }]
      : [
          { x: -24, y: -18, density: "moderate" },
          { x: 24, y: -14, density: "light" }
        ];

  return deepFreeze(
    buildingHints.flatMap((hint, buildingIndex) =>
      perLotOffsets.map((offset, treeIndex) => {
        const index = buildingIndex * perLotOffsets.length + treeIndex;
        return deepFreeze({
          vegetationHintId: `LOCAL_MAP_VEGETATION_HINT_${String(index + 1).padStart(3, "0")}`,
          assetId: "TREE_EUCALYPTUS_001",
          position: deepFreeze({
            x: roundNumber(hint.position.x + offset.x),
            y: roundNumber(hint.position.y + offset.y)
          }),
          density: offset.density,
          vegetationAreaId: hint.residentialAreaId,
          lotId: hint.lotId
        });
      })
    )
  );
}

function buildTerrainHints(fixtureContext) {
  return deepFreeze({
    terrainType: "coastal_grassland",
    coastalProfile: deepFreeze({
      shorelineOrientation: "east-west",
      settlementBand: "foreshore",
      windExposure: "medium",
      vegetationDensity:
        fixtureContext.densityProfile === "sparse_coastal"
          ? "low"
          : fixtureContext.densityProfile === "town_coastal"
            ? "dense"
            : "moderate"
    }),
    densityProfile: fixtureContext.densityProfile,
    source: "local_fixture_map_data",
    coordinate: fixtureContext.coordinate,
    coastlineBoundaryId: "LOCAL_MAP_LAND_AREA_COASTLINE_001",
    foreshoreAreaId: "LOCAL_MAP_LAND_AREA_FORESHORE_001"
  });
}

function buildLandmarkHints(fixtureContext, assetInstances) {
  const lighthouseAsset = assetInstances.find(
    (assetInstance) => assetInstance.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  return deepFreeze([
    deepFreeze({
      landmarkHintId: "LOCAL_MAP_LANDMARK_HINT_001",
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      hintType: "landmark",
      position: deepFreeze({
        x: roundNumber(fixtureContext.bounds.maxX - 136),
        y: roundNumber(fixtureContext.shorelineY + 56)
      }),
      source: "local_fixture_map_data",
      landmarkValue: "high",
      questEligible: true,
      captureEligible: false,
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      sourceAssetId: lighthouseAsset?.assetId ?? "LIGHTHOUSE_ISLAND_ROCKY_001"
    })
  ]);
}

function selectDensityProfile(rawDefinition) {
  const requestedProfile =
    rawDefinition && typeof rawDefinition === "object" ? rawDefinition.densityProfile : null;
  if (requestedProfile == null) {
    return "suburban_coastal";
  }
  if (typeof requestedProfile !== "string" || !supportedDensityProfiles.has(requestedProfile)) {
    throw createValidationError(
      "density_profile_invalid",
      "Map world local real map data adapter densityProfile must be sparse_coastal, suburban_coastal, or town_coastal."
    );
  }
  return requestedProfile;
}

function buildDensityProfileConfig(densityProfile, bounds) {
  const { minX, minY, maxX, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;

  const configs = {
    sparse_coastal: deepFreeze({
      shorelineRatio: 0.76,
      eastWestRoadYs: [roundNumber(minY + height * 0.31), roundNumber(minY + height * 0.49), roundNumber(minY + height * 0.68)],
      northSouthRoadXs: [roundNumber(minX + width * 0.32), roundNumber(minX + width * 0.62)],
      buildingRows: [
        { roadIndex: 0, centerXs: [150, 430, 740], variant: "standard" },
        { roadIndex: 1, centerXs: [220, 540, 820], variant: "standard" }
      ],
      treesPerLot: 1,
      residentialAreaBands: [
        { minX: minX + 52, minY: minY + 78, maxX: minX + width * 0.36, maxY: minY + height * 0.59 },
        { minX: minX + width * 0.36 + 12, minY: minY + 78, maxX: minX + width * 0.68, maxY: minY + height * 0.59 },
        { minX: minX + width * 0.68 + 12, minY: minY + 78, maxX: maxX - 54, maxY: minY + height * 0.59 }
      ]
    }),
    suburban_coastal: deepFreeze({
      shorelineRatio: 0.82,
      eastWestRoadYs: [180, 300, 420, 535],
      northSouthRoadXs: [roundNumber(minX + width * 0.18), roundNumber(minX + width * 0.34), roundNumber(minX + width * 0.52), roundNumber(minX + width * 0.70)],
      buildingRows: [
        { roadIndex: 0, centerXs: [96, 246, 406], variant: "compact" },
        { roadIndex: 1, centerXs: [108, 258, 418, 588], variant: "standard" },
        { roadIndex: 2, centerXs: [120, 280, 430, 590, 810], variant: "standard" }
      ],
      treesPerLot: 2,
      residentialAreaBands: [
        { minX: minX + 46, minY: minY + 68, maxX: minX + width * 0.30, maxY: minY + height * 0.63 },
        { minX: minX + width * 0.30 + 14, minY: minY + 68, maxX: minX + width * 0.60, maxY: minY + height * 0.63 },
        { minX: minX + width * 0.60 + 14, minY: minY + 68, maxX: maxX - 48, maxY: minY + height * 0.63 }
      ]
    }),
    town_coastal: deepFreeze({
      shorelineRatio: 0.84,
      eastWestRoadYs: [145, 255, 365, 475, 570],
      northSouthRoadXs: [roundNumber(minX + width * 0.15), roundNumber(minX + width * 0.29), roundNumber(minX + width * 0.44), roundNumber(minX + width * 0.59), roundNumber(minX + width * 0.75)],
      buildingRows: [
        { roadIndex: 0, centerXs: [72, 211, 350, 494, 643], variant: "compact" },
        { roadIndex: 1, centerXs: [90, 230, 370, 514, 663], variant: "compact" },
        { roadIndex: 2, centerXs: [80, 350, 500, 640, 840], variant: "compact" },
        { roadIndex: 3, centerXs: [220, 360, 500, 660, 860], variant: "standard" }
      ],
      treesPerLot: 2,
      residentialAreaBands: [
        { minX: minX + 42, minY: minY + 60, maxX: minX + width * 0.24, maxY: minY + height * 0.65 },
        { minX: minX + width * 0.24 + 12, minY: minY + 60, maxX: minX + width * 0.47, maxY: minY + height * 0.65 },
        { minX: minX + width * 0.47 + 12, minY: minY + 60, maxX: minX + width * 0.70, maxY: minY + height * 0.65 },
        { minX: minX + width * 0.70 + 12, minY: minY + 60, maxX: maxX - 42, maxY: minY + height * 0.65 }
      ]
    })
  };

  return configs[densityProfile];
}

function resolveResidentialAreaId(residentialAreas, centerX) {
  const matchingArea = residentialAreas.find((area) => {
    const xs = area.boundaryPoints.map((point) => point.x);
    return centerX >= Math.min(...xs) && centerX <= Math.max(...xs);
  });
  return matchingArea?.landAreaId ?? residentialAreas[residentialAreas.length - 1]?.landAreaId ?? "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001";
}

function buildIntersectionLookup(roads) {
  const lookup = new Map();
  for (const road of roads) {
    lookup.set(road.roadSegmentId, road.connectedIntersectionIds);
  }
  return lookup;
}

function coordinateSpanFromWorldBounds(worldSpan) {
  return Number((Math.max(Number(worldSpan) || 0, 1) / 100000).toFixed(6));
}

function createMapDataId(providerId, worldId, coordinate) {
  const hash = stableHash(
    `${providerId}::${worldId}::${coordinate.latitude.toFixed(6)}::${coordinate.longitude.toFixed(6)}`
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `LOCAL_REAL_MAP_DATA_${hash}`;
}

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldLocalRealMapDataAdapterFoundation");
  for (const fieldName of mapWorldLocalRealMapDataAdapterFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world local real map data adapter foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    providerId: normalizeString(foundation.providerId, "providerId"),
    mapDataId: normalizeString(foundation.mapDataId, "mapDataId"),
    coordinate: deepFreeze(asPlainObject(foundation.coordinate, "coordinate")),
    bounds: deepFreeze(asPlainObject(foundation.bounds, "bounds")),
    roads: normalizeArray(foundation.roads, "roads"),
    landAreas: normalizeArray(foundation.landAreas, "landAreas"),
    buildingHints: normalizeArray(foundation.buildingHints, "buildingHints"),
    vegetationHints: normalizeArray(foundation.vegetationHints, "vegetationHints"),
    terrainHints: deepFreeze(asPlainObject(foundation.terrainHints, "terrainHints")),
    landmarkHints: normalizeArray(foundation.landmarkHints, "landmarkHints"),
    providerBoundary: deepFreeze(asPlainObject(foundation.providerBoundary, "providerBoundary")),
    worldResolver: deepFreeze(asPlainObject(foundation.worldResolver, "worldResolver")),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(foundation.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    ),
    mapWorldRealLocationPreview: deepFreeze(
      asPlainObject(foundation.mapWorldRealLocationPreview, "mapWorldRealLocationPreview")
    ),
    validationResult: deepFreeze(asPlainObject(foundation.validationResult, "validationResult"))
  });
}

function normalizeArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError("invalid_array", `${fieldName} must be an array.`);
  }
  return deepFreeze(value.map((entry) => deepFreeze({ ...entry })));
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
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
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldLocalRealMapDataAdapterFoundationValidationError"
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
