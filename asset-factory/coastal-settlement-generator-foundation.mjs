import {
  createCoastalStarterWorldRealAssetSceneAssembly
} from "./coastal-starter-world-real-asset-scene-assembly.mjs";

export const coastalSettlementGeneratorFoundationRequiredFields = Object.freeze([
  "worldRegionId",
  "bounds",
  "seed",
  "terrainType",
  "coastalProfile"
]);

export const coastalSettlementSupportedAssets = Object.freeze([
  "BUILDING_COASTAL_COTTAGE_001",
  "TREE_EUCALYPTUS_001",
  "ROAD_COASTAL_001"
]);

export const coastalSettlementGeneratorFoundationDefinition = deepFreeze({
  worldRegionId: "COASTAL_SETTLEMENT_REGION_001",
  bounds: deepFreeze({
    minX: 0,
    minY: 0,
    maxX: 960,
    maxY: 640
  }),
  seed: "growgo-coastal-settlement-alpha-001",
  terrainType: "coastal_grassland",
  coastalProfile: deepFreeze({
    shorelineOrientation: "east-west",
    settlementBand: "foreshore",
    windExposure: "medium",
    vegetationDensity: "moderate"
  })
});

const supportedTerrainTypes = new Set(["coastal_grassland"]);
const supportedShorelineOrientations = new Set(["east-west", "north-south"]);
const supportedWindExposure = new Set(["low", "medium", "high"]);
const supportedVegetationDensity = new Set(["low", "moderate", "dense"]);
const supportedRoadOrientations = new Set(["east-west", "north-south"]);
const supportedFacing = new Set(["north", "south", "east", "west"]);
const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export async function createCoastalSettlementGeneratorFoundation(
  rawDefinition = coastalSettlementGeneratorFoundationDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const coastalScene = await createCoastalStarterWorldRealAssetSceneAssembly(options);
  const assetCatalog = buildAssetCatalog(coastalScene.assetInstances);
  const roadNetwork = buildRoadNetwork(definition);
  const residentialLots = buildResidentialLots(definition, roadNetwork);
  const assetPlacements = buildAssetPlacements(definition, residentialLots, roadNetwork, assetCatalog);
  const settlement = deepFreeze({
    worldRegionId: definition.worldRegionId,
    bounds: definition.bounds,
    seed: definition.seed,
    terrainType: definition.terrainType,
    coastalProfile: definition.coastalProfile,
    roadNetwork,
    residentialLots,
    assetPlacements,
    validationResult: buildValidationResult(
      definition,
      residentialLots,
      roadNetwork,
      assetPlacements,
      assetCatalog
    ),
    settlementSummary: buildSettlementSummary(
      definition,
      residentialLots,
      roadNetwork,
      assetPlacements
    )
  });

  const validation = validateCoastalSettlementGeneratorFoundation(settlement);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return settlement;
}

export function validateCoastalSettlementGeneratorFoundation(rawSettlement) {
  try {
    const settlement = normalizeGeneratedSettlement(rawSettlement);

    if (settlement.residentialLots.length < 1) {
      throw createValidationError(
        "residential_lots_missing",
        "Coastal settlement generator requires at least one residential lot."
      );
    }
    if (settlement.roadNetwork.roadSegments.length < 1) {
      throw createValidationError(
        "road_network_missing",
        "Coastal settlement generator requires at least one road segment."
      );
    }

    validateLotOverlap(settlement.residentialLots);
    validatePlacementFootprints(settlement.assetPlacements, settlement.roadNetwork, settlement.residentialLots);

    if (!settlement.validationResult.deterministicOutput) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Coastal settlement generator deterministicOutput must be true."
      );
    }
    if (!settlement.validationResult.placementValidity) {
      throw createValidationError(
        "placement_validity_invalid",
        "Coastal settlement generator placementValidity must be true."
      );
    }
    if (!settlement.validationResult.assetReferenceValidity) {
      throw createValidationError(
        "asset_reference_invalid",
        "Coastal settlement generator assetReferenceValidity must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      coastalSettlement: settlement
    });
  } catch (error) {
    if (error?.name !== "CoastalSettlementGeneratorFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      coastalSettlement: null
    });
  }
}

function buildAssetCatalog(assetInstances) {
  const allowed = new Set(coastalSettlementSupportedAssets);
  const catalog = new Map();

  for (const assetInstance of assetInstances) {
    if (allowed.has(assetInstance.assetId)) {
      catalog.set(assetInstance.assetId, deepFreeze({ ...assetInstance }));
    }
  }

  for (const assetId of coastalSettlementSupportedAssets) {
    if (!catalog.has(assetId)) {
      throw createValidationError(
        "missing_supported_asset",
        `Coastal settlement generator requires supported asset ${assetId}.`
      );
    }
  }

  return catalog;
}

function buildRoadNetwork(definition) {
  const width = definition.bounds.maxX - definition.bounds.minX;
  const height = definition.bounds.maxY - definition.bounds.minY;
  const mainRoadY = roundNumber(height * 0.58 + randomInRange(definition.seed, "main-road-y", -12, 12));
  const westLaneX = roundNumber(width * 0.26 + randomInRange(definition.seed, "west-lane-x", -8, 8));
  const eastLaneX = roundNumber(width * 0.72 + randomInRange(definition.seed, "east-lane-x", -8, 8));

  const roadSegments = deepFreeze([
    deepFreeze({
      roadSegmentId: "COASTAL_SETTLEMENT_ROAD_SEGMENT_001",
      assetId: "ROAD_COASTAL_001",
      roadType: "coastal_main",
      orientation: "east-west",
      start: deepFreeze({ x: definition.bounds.minX + 40, y: mainRoadY }),
      end: deepFreeze({ x: definition.bounds.maxX - 40, y: mainRoadY }),
      width: 30
    }),
    deepFreeze({
      roadSegmentId: "COASTAL_SETTLEMENT_ROAD_SEGMENT_002",
      assetId: "ROAD_COASTAL_001",
      roadType: "residential_spur",
      orientation: "north-south",
      start: deepFreeze({ x: westLaneX, y: mainRoadY }),
      end: deepFreeze({ x: westLaneX, y: mainRoadY - 150 }),
      width: 18
    }),
    deepFreeze({
      roadSegmentId: "COASTAL_SETTLEMENT_ROAD_SEGMENT_003",
      assetId: "ROAD_COASTAL_001",
      roadType: "residential_spur",
      orientation: "north-south",
      start: deepFreeze({ x: eastLaneX, y: mainRoadY }),
      end: deepFreeze({ x: eastLaneX, y: mainRoadY - 140 }),
      width: 18
    })
  ]);

  const intersections = deepFreeze([
    deepFreeze({
      intersectionId: "COASTAL_SETTLEMENT_INTERSECTION_001",
      position: deepFreeze({ x: westLaneX, y: mainRoadY }),
      connectedRoadSegmentIds: deepFreeze([
        "COASTAL_SETTLEMENT_ROAD_SEGMENT_001",
        "COASTAL_SETTLEMENT_ROAD_SEGMENT_002"
      ]),
      orientation: "coastal_t_junction"
    }),
    deepFreeze({
      intersectionId: "COASTAL_SETTLEMENT_INTERSECTION_002",
      position: deepFreeze({ x: eastLaneX, y: mainRoadY }),
      connectedRoadSegmentIds: deepFreeze([
        "COASTAL_SETTLEMENT_ROAD_SEGMENT_001",
        "COASTAL_SETTLEMENT_ROAD_SEGMENT_003"
      ]),
      orientation: "coastal_t_junction"
    })
  ]);

  return deepFreeze({
    roadSegments,
    intersections,
    orientation: "east-west"
  });
}

function buildResidentialLots(definition, roadNetwork) {
  const mainRoad = roadNetwork.roadSegments[0];
  const westLane = roadNetwork.roadSegments[1];
  const eastLane = roadNetwork.roadSegments[2];
  const lotWidth = 150;
  const lotDepth = 170;
  const baseY = mainRoad.start.y - lotDepth - 24;
  const centers = [
    definition.bounds.minX + 120,
    westLane.start.x + 145,
    eastLane.start.x - 130,
    definition.bounds.maxX - 120
  ];

  return deepFreeze(
    centers.map((centerX, index) => {
      const widthAdjustment = randomInRange(
        definition.seed,
        `lot-width-${index + 1}`,
        -10,
        12
      );
      const depthAdjustment = randomInRange(
        definition.seed,
        `lot-depth-${index + 1}`,
        -12,
        10
      );
      const actualWidth = roundNumber(lotWidth + widthAdjustment);
      const actualDepth = roundNumber(lotDepth + depthAdjustment);
      const minX = roundNumber(centerX - actualWidth / 2);
      const minY = roundNumber(baseY + randomInRange(definition.seed, `lot-y-${index + 1}`, -6, 6));
      return deepFreeze({
        lotId: `COASTAL_SETTLEMENT_LOT_${String(index + 1).padStart(3, "0")}`,
        width: actualWidth,
        depth: actualDepth,
        roadFrontage: actualWidth,
        position: deepFreeze({
          x: minX,
          y: minY
        }),
        orientation: "south",
        frontageRoadSegmentId: mainRoad.roadSegmentId
      });
    })
  );
}

function buildAssetPlacements(definition, residentialLots, roadNetwork, assetCatalog) {
  const placements = [];

  for (const roadSegment of roadNetwork.roadSegments) {
    placements.push(
      createPlacementEntry({
        placementId: `COASTAL_SETTLEMENT_ASSET_${String(placements.length + 1).padStart(3, "0")}`,
        asset: assetCatalog.get("ROAD_COASTAL_001"),
        placementType: "road_segment",
        position: deepFreeze({
          x: roundNumber((roadSegment.start.x + roadSegment.end.x) / 2),
          y: roundNumber((roadSegment.start.y + roadSegment.end.y) / 2)
        }),
        orientation: roadSegment.orientation === "east-west" ? "east" : "north",
        footprint: deepFreeze(
          roadSegment.orientation === "east-west"
            ? {
                minX: Math.min(roadSegment.start.x, roadSegment.end.x),
                minY: roadSegment.start.y - roadSegment.width / 2,
                maxX: Math.max(roadSegment.start.x, roadSegment.end.x),
                maxY: roadSegment.start.y + roadSegment.width / 2
              }
            : {
                minX: roadSegment.start.x - roadSegment.width / 2,
                minY: Math.min(roadSegment.start.y, roadSegment.end.y),
                maxX: roadSegment.start.x + roadSegment.width / 2,
                maxY: Math.max(roadSegment.start.y, roadSegment.end.y)
              }
        ),
        parentId: roadSegment.roadSegmentId,
        deterministicKey: `${definition.seed}:${roadSegment.roadSegmentId}`
      })
    );
  }

  for (const lot of residentialLots) {
    const buildingWidth = roundNumber(Math.min(96, lot.width * 0.58));
    const buildingDepth = roundNumber(Math.min(82, lot.depth * 0.48));
    const buildingX =
      lot.position.x + lot.width / 2 + randomInRange(definition.seed, `${lot.lotId}-building-x`, -6, 6);
    const buildingY =
      lot.position.y + lot.depth - buildingDepth / 2 - 28 + randomInRange(definition.seed, `${lot.lotId}-building-y`, -4, 4);
    const buildingFootprint = {
      minX: roundNumber(buildingX - buildingWidth / 2),
      minY: roundNumber(buildingY - buildingDepth / 2),
      maxX: roundNumber(buildingX + buildingWidth / 2),
      maxY: roundNumber(buildingY + buildingDepth / 2)
    };

    placements.push(
      createPlacementEntry({
        placementId: `COASTAL_SETTLEMENT_ASSET_${String(placements.length + 1).padStart(3, "0")}`,
        asset: assetCatalog.get("BUILDING_COASTAL_COTTAGE_001"),
        placementType: "residential_building",
        position: deepFreeze({
          x: roundNumber(buildingX),
          y: roundNumber(buildingY)
        }),
        orientation: "south",
        footprint: deepFreeze(buildingFootprint),
        parentId: lot.lotId,
        deterministicKey: `${definition.seed}:${lot.lotId}:building`,
        roadFacing: true
      })
    );

    const treeOffsets = [
      { x: 20, y: 28, suffix: "tree-west" },
      { x: lot.width - 20, y: 34, suffix: "tree-east" }
    ];

    for (const treeOffset of treeOffsets) {
      const treeX =
        lot.position.x +
        treeOffset.x +
        randomInRange(definition.seed, `${lot.lotId}-${treeOffset.suffix}-x`, -5, 5);
      const treeY =
        lot.position.y +
        treeOffset.y +
        randomInRange(definition.seed, `${lot.lotId}-${treeOffset.suffix}-y`, -5, 5);
      const treeRadius = 14;

      placements.push(
        createPlacementEntry({
          placementId: `COASTAL_SETTLEMENT_ASSET_${String(placements.length + 1).padStart(3, "0")}`,
          asset: assetCatalog.get("TREE_EUCALYPTUS_001"),
          placementType: "vegetation",
          position: deepFreeze({
            x: roundNumber(treeX),
            y: roundNumber(treeY)
          }),
          orientation: "north",
          footprint: deepFreeze({
            minX: roundNumber(treeX - treeRadius),
            minY: roundNumber(treeY - treeRadius),
            maxX: roundNumber(treeX + treeRadius),
            maxY: roundNumber(treeY + treeRadius)
          }),
          parentId: lot.lotId,
          deterministicKey: `${definition.seed}:${lot.lotId}:${treeOffset.suffix}`,
          validArea: "rear-yard"
        })
      );
    }
  }

  return deepFreeze(placements);
}

function createPlacementEntry({
  placementId,
  asset,
  placementType,
  position,
  orientation,
  footprint,
  parentId,
  deterministicKey,
  roadFacing = false,
  validArea = null
}) {
  return deepFreeze({
    placementId,
    assetId: asset.assetId,
    glbPath: asset.glbPath,
    rendererProfile: asset.rendererProfile,
    sourceType: asset.sourceType,
    placementType,
    position,
    orientation,
    footprint,
    parentId,
    roadFacing,
    validArea,
    deterministicKey
  });
}

function buildValidationResult(definition, residentialLots, roadNetwork, assetPlacements, assetCatalog) {
  const roadAssetValid = roadNetwork.roadSegments.every((segment) => segment.assetId === "ROAD_COASTAL_001");
  const placementAssetValid = assetPlacements.every((placement) => assetCatalog.has(placement.assetId));
  const lotFacingValid = residentialLots.every((lot) => lot.orientation === "south");
  const buildingFacingValid = assetPlacements
    .filter((placement) => placement.assetId === "BUILDING_COASTAL_COTTAGE_001")
    .every((placement) => placement.orientation === "south" && placement.roadFacing);
  const treesValid = assetPlacements
    .filter((placement) => placement.assetId === "TREE_EUCALYPTUS_001")
    .every((placement) => placement.validArea === "rear-yard");

  return deepFreeze({
    deterministicOutput: true,
    placementValidity:
      roadAssetValid &&
      lotFacingValid &&
      buildingFacingValid &&
      treesValid &&
      validateOverlapSilently(residentialLots, assetPlacements, roadNetwork),
    assetReferenceValidity: placementAssetValid
  });
}

function buildSettlementSummary(definition, residentialLots, roadNetwork, assetPlacements) {
  const cottages = assetPlacements.filter((placement) => placement.assetId === "BUILDING_COASTAL_COTTAGE_001").length;
  const trees = assetPlacements.filter((placement) => placement.assetId === "TREE_EUCALYPTUS_001").length;
  const roads = assetPlacements.filter((placement) => placement.assetId === "ROAD_COASTAL_001").length;
  return deepFreeze({
    settlementId: `COASTAL_SETTLEMENT_${stableHash(`${definition.worldRegionId}:${definition.seed}`)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0")}`,
    residentialLotCount: residentialLots.length,
    roadSegmentCount: roadNetwork.roadSegments.length,
    intersectionCount: roadNetwork.intersections.length,
    cottageCount: cottages,
    treeCount: trees,
    roadAssetPlacementCount: roads,
    generatedAssetCount: assetPlacements.length,
    dominantOrientation: roadNetwork.orientation,
    terrainType: definition.terrainType
  });
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "coastalSettlementGeneratorFoundation");
  for (const fieldName of coastalSettlementGeneratorFoundationRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Coastal settlement generator definition is missing ${fieldName}.`
      );
    }
  }

  const bounds = normalizeBounds(definition.bounds);
  const terrainType = normalizeString(definition.terrainType, "terrainType");
  if (!supportedTerrainTypes.has(terrainType)) {
    throw createValidationError(
      "terrain_type_invalid",
      "Coastal settlement generator terrainType must be supported."
    );
  }

  return deepFreeze({
    worldRegionId: normalizePermanentId(definition.worldRegionId, "worldRegionId"),
    bounds,
    seed: normalizeString(definition.seed, "seed"),
    terrainType,
    coastalProfile: normalizeCoastalProfile(definition.coastalProfile)
  });
}

function normalizeGeneratedSettlement(rawSettlement) {
  const settlement = asPlainObject(rawSettlement, "coastalSettlement");
  const definition = normalizeDefinition(settlement);
  const roadNetwork = normalizeRoadNetwork(settlement.roadNetwork);
  const residentialLots = deepFreeze(
    (Array.isArray(settlement.residentialLots) ? settlement.residentialLots : []).map(normalizeLot)
  );
  const assetPlacements = deepFreeze(
    (Array.isArray(settlement.assetPlacements) ? settlement.assetPlacements : []).map(
      normalizePlacement
    )
  );

  return deepFreeze({
    ...definition,
    roadNetwork,
    residentialLots,
    assetPlacements,
    validationResult: deepFreeze({
      deterministicOutput: Boolean(settlement.validationResult?.deterministicOutput),
      placementValidity: Boolean(settlement.validationResult?.placementValidity),
      assetReferenceValidity: Boolean(settlement.validationResult?.assetReferenceValidity)
    }),
    settlementSummary: deepFreeze({
      ...asPlainObject(settlement.settlementSummary, "settlementSummary")
    })
  });
}

function normalizeBounds(rawBounds) {
  const bounds = asPlainObject(rawBounds, "bounds");
  const minX = Number(bounds.minX);
  const minY = Number(bounds.minY);
  const maxX = Number(bounds.maxX);
  const maxY = Number(bounds.maxY);
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    throw createValidationError("bounds_invalid", "Coastal settlement bounds must be finite numbers.");
  }
  if (maxX <= minX || maxY <= minY) {
    throw createValidationError("bounds_invalid", "Coastal settlement bounds must have positive size.");
  }
  return deepFreeze({ minX, minY, maxX, maxY });
}

function normalizeCoastalProfile(rawProfile) {
  const profile = asPlainObject(rawProfile, "coastalProfile");
  const shorelineOrientation = normalizeString(
    profile.shorelineOrientation,
    "coastalProfile.shorelineOrientation"
  );
  const windExposure = normalizeString(profile.windExposure, "coastalProfile.windExposure");
  const vegetationDensity = normalizeString(
    profile.vegetationDensity,
    "coastalProfile.vegetationDensity"
  );
  if (!supportedShorelineOrientations.has(shorelineOrientation)) {
    throw createValidationError(
      "coastal_profile_invalid",
      "Coastal settlement shorelineOrientation must be supported."
    );
  }
  if (!supportedWindExposure.has(windExposure)) {
    throw createValidationError(
      "coastal_profile_invalid",
      "Coastal settlement windExposure must be supported."
    );
  }
  if (!supportedVegetationDensity.has(vegetationDensity)) {
    throw createValidationError(
      "coastal_profile_invalid",
      "Coastal settlement vegetationDensity must be supported."
    );
  }
  return deepFreeze({
    shorelineOrientation,
    settlementBand: normalizeString(profile.settlementBand, "coastalProfile.settlementBand"),
    windExposure,
    vegetationDensity
  });
}

function normalizeRoadNetwork(rawRoadNetwork) {
  const roadNetwork = asPlainObject(rawRoadNetwork, "roadNetwork");
  const orientation = normalizeString(roadNetwork.orientation, "roadNetwork.orientation");
  if (!supportedRoadOrientations.has(orientation)) {
    throw createValidationError(
      "road_orientation_invalid",
      "Coastal settlement roadNetwork.orientation must be supported."
    );
  }
  return deepFreeze({
    orientation,
    roadSegments: deepFreeze(
      (Array.isArray(roadNetwork.roadSegments) ? roadNetwork.roadSegments : []).map((segment) => {
        const normalized = asPlainObject(segment, "roadSegment");
        const segmentOrientation = normalizeString(normalized.orientation, "roadSegment.orientation");
        if (!supportedRoadOrientations.has(segmentOrientation)) {
          throw createValidationError(
            "road_orientation_invalid",
            "Coastal settlement roadSegment.orientation must be supported."
          );
        }
        return deepFreeze({
          roadSegmentId: normalizeString(normalized.roadSegmentId, "roadSegment.roadSegmentId"),
          assetId: normalizePermanentId(normalized.assetId, "roadSegment.assetId"),
          roadType: normalizeString(normalized.roadType, "roadSegment.roadType"),
          orientation: segmentOrientation,
          start: normalizePoint(normalized.start, "roadSegment.start"),
          end: normalizePoint(normalized.end, "roadSegment.end"),
          width: Number(normalized.width)
        });
      })
    ),
    intersections: deepFreeze(
      (Array.isArray(roadNetwork.intersections) ? roadNetwork.intersections : []).map((intersection) => {
        const normalized = asPlainObject(intersection, "intersection");
        return deepFreeze({
          intersectionId: normalizeString(normalized.intersectionId, "intersection.intersectionId"),
          position: normalizePoint(normalized.position, "intersection.position"),
          connectedRoadSegmentIds: deepFreeze(
            (Array.isArray(normalized.connectedRoadSegmentIds)
              ? normalized.connectedRoadSegmentIds
              : []
            ).map((roadSegmentId, index) =>
              normalizeString(
                roadSegmentId,
                `intersection.connectedRoadSegmentIds[${index}]`
              )
            )
          ),
          orientation: normalizeString(normalized.orientation, "intersection.orientation")
        });
      })
    )
  });
}

function normalizeLot(rawLot) {
  const lot = asPlainObject(rawLot, "residentialLot");
  const orientation = normalizeString(lot.orientation, "residentialLot.orientation");
  if (!supportedFacing.has(orientation)) {
    throw createValidationError(
      "lot_orientation_invalid",
      "Coastal settlement residential lot orientation must be supported."
    );
  }
  return deepFreeze({
    lotId: normalizeString(lot.lotId, "residentialLot.lotId"),
    width: Number(lot.width),
    depth: Number(lot.depth),
    roadFrontage: Number(lot.roadFrontage),
    position: normalizePoint(lot.position, "residentialLot.position"),
    orientation,
    frontageRoadSegmentId: normalizeString(
      lot.frontageRoadSegmentId,
      "residentialLot.frontageRoadSegmentId"
    )
  });
}

function normalizePlacement(rawPlacement) {
  const placement = asPlainObject(rawPlacement, "assetPlacement");
  const orientation = normalizeString(placement.orientation, "assetPlacement.orientation");
  if (!supportedFacing.has(orientation)) {
    throw createValidationError(
      "placement_orientation_invalid",
      "Coastal settlement asset placement orientation must be supported."
    );
  }
  return deepFreeze({
    placementId: normalizeString(placement.placementId, "assetPlacement.placementId"),
    assetId: normalizePermanentId(placement.assetId, "assetPlacement.assetId"),
    glbPath: normalizeString(placement.glbPath, "assetPlacement.glbPath"),
    rendererProfile: normalizeString(
      placement.rendererProfile,
      "assetPlacement.rendererProfile"
    ),
    sourceType: normalizeString(placement.sourceType, "assetPlacement.sourceType"),
    placementType: normalizeString(placement.placementType, "assetPlacement.placementType"),
    position: normalizePoint(placement.position, "assetPlacement.position"),
    orientation,
    footprint: normalizeBounds(placement.footprint),
    parentId: normalizeString(placement.parentId, "assetPlacement.parentId"),
    roadFacing: Boolean(placement.roadFacing),
    validArea: placement.validArea == null ? null : normalizeString(placement.validArea, "assetPlacement.validArea"),
    deterministicKey: normalizeString(
      placement.deterministicKey,
      "assetPlacement.deterministicKey"
    )
  });
}

function validateLotOverlap(residentialLots) {
  for (let index = 0; index < residentialLots.length; index += 1) {
    const current = residentialLots[index];
    const currentBounds = {
      minX: current.position.x,
      minY: current.position.y,
      maxX: current.position.x + current.width,
      maxY: current.position.y + current.depth
    };
    for (let compareIndex = index + 1; compareIndex < residentialLots.length; compareIndex += 1) {
      const compare = residentialLots[compareIndex];
      const compareBounds = {
        minX: compare.position.x,
        minY: compare.position.y,
        maxX: compare.position.x + compare.width,
        maxY: compare.position.y + compare.depth
      };
      if (rectanglesOverlap(currentBounds, compareBounds)) {
        throw createValidationError(
          "lot_overlap_invalid",
          `Coastal settlement lots ${current.lotId} and ${compare.lotId} overlap.`
        );
      }
    }
  }
}

function validatePlacementFootprints(assetPlacements, roadNetwork, residentialLots) {
  const roadBounds = assetPlacements
    .filter((placement) => placement.assetId === "ROAD_COASTAL_001")
    .map((placement) => placement.footprint);
  const buildingPlacements = assetPlacements.filter(
    (placement) => placement.assetId === "BUILDING_COASTAL_COTTAGE_001"
  );
  const treePlacements = assetPlacements.filter(
    (placement) => placement.assetId === "TREE_EUCALYPTUS_001"
  );

  for (const building of buildingPlacements) {
    if (!building.roadFacing || building.orientation !== "south") {
      throw createValidationError(
        "building_facing_invalid",
        `Coastal settlement building ${building.placementId} must face its road frontage.`
      );
    }
    if (roadBounds.some((road) => rectanglesOverlap(building.footprint, road))) {
      throw createValidationError(
        "building_road_overlap",
        `Coastal settlement building ${building.placementId} overlaps a road segment.`
      );
    }
  }

  for (const tree of treePlacements) {
    const parentLot = residentialLots.find((lot) => lot.lotId === tree.parentId);
    if (!parentLot) {
      throw createValidationError(
        "tree_parent_invalid",
        `Coastal settlement tree ${tree.placementId} must belong to a residential lot.`
      );
    }
    const lotBounds = {
      minX: parentLot.position.x,
      minY: parentLot.position.y,
      maxX: parentLot.position.x + parentLot.width,
      maxY: parentLot.position.y + parentLot.depth
    };
    if (!rectangleContained(tree.footprint, lotBounds)) {
      throw createValidationError(
        "tree_bounds_invalid",
        `Coastal settlement tree ${tree.placementId} must stay inside its residential lot.`
      );
    }
    if (roadBounds.some((road) => rectanglesOverlap(tree.footprint, road))) {
      throw createValidationError(
        "tree_road_overlap",
        `Coastal settlement tree ${tree.placementId} overlaps a road segment.`
      );
    }
  }

  for (const intersection of roadNetwork.intersections) {
    if (intersection.connectedRoadSegmentIds.length < 2) {
      throw createValidationError(
        "intersection_invalid",
        `Coastal settlement intersection ${intersection.intersectionId} must connect at least two road segments.`
      );
    }
  }
}

function validateOverlapSilently(residentialLots, assetPlacements, roadNetwork) {
  try {
    validateLotOverlap(residentialLots);
    validatePlacementFootprints(assetPlacements, roadNetwork, residentialLots);
    return true;
  } catch {
    return false;
  }
}

function rectanglesOverlap(first, second) {
  return (
    first.minX < second.maxX &&
    first.maxX > second.minX &&
    first.minY < second.maxY &&
    first.maxY > second.minY
  );
}

function rectangleContained(inner, outer) {
  return (
    inner.minX >= outer.minX &&
    inner.maxX <= outer.maxX &&
    inner.minY >= outer.minY &&
    inner.maxY <= outer.maxY
  );
}

function normalizePoint(rawPoint, fieldName) {
  const point = asPlainObject(rawPoint, fieldName);
  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw createValidationError(
      "point_invalid",
      `${fieldName} must contain finite x and y coordinates.`
    );
  }
  return deepFreeze({ x, y });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "permanent_id_invalid",
      `${fieldName} must use a permanent GrowGo asset-style identifier.`
    );
  }
  return normalized;
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

function randomInRange(seed, salt, min, max) {
  const hash = stableHash(`${seed}::${salt}`);
  const fraction = hash / 0xffffffff;
  return min + fraction * (max - min);
}

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "CoastalSettlementGeneratorFoundationValidationError"
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
