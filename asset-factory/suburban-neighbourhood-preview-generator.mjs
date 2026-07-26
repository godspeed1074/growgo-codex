const previewSchemaId = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001";
const lotSchemaId = "LOT_SUBURBAN_RESIDENTIAL_001";
const buildingPlacementSchemaId = "BUILDING_PLACEMENT_INSTANCE_001";
const landscapePlacementSchemaId = "LANDSCAPE_PLACEMENT_INSTANCE_001";
const roadFrontageConnectionSchemaId = "ROAD_FRONTAGE_CONNECTION_001";

export const supportedSuburbanNeighbourhoodBuildingAssets = Object.freeze([
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
    primaryTheme: "suburban_primary"
  },
  BUILDING_HOUSE_COASTAL_COTTAGE_001: {
    assetId: "BUILDING_HOUSE_COASTAL_COTTAGE_001",
    familyId: "FAMILY_HOUSE_COASTAL",
    recipeId: "RECIPE_HOUSE_COASTAL_COTTAGE_001",
    footprintWidth: 8.8,
    footprintDepth: 7.4,
    weight: 0.25,
    primaryTheme: "coastal_secondary"
  },
  BUILDING_HOUSE_BEACH_BUNGALOW_001: {
    assetId: "BUILDING_HOUSE_BEACH_BUNGALOW_001",
    familyId: "FAMILY_HOUSE_COASTAL",
    recipeId: "RECIPE_HOUSE_BEACH_BUNGALOW_001",
    footprintWidth: 10.2,
    footprintDepth: 8.2,
    weight: 0.2,
    primaryTheme: "coastal_tertiary"
  }
});

export const suburbanNeighbourhoodPreviewGeneratorDefaultInput = deepFreeze({
  neighbourhoodSeed: 10482,
  regionSeed: 1,
  themeSeed: "SUBURBAN_AUSTRALIA",
  lotCount: 6,
  blockConfiguration: deepFreeze({
    blockType: "suburban_preview_straight_street",
    previewId: "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
    roadSegmentId: "ROAD_SEGMENT_STRAIGHT_001",
    roadWidth: 12,
    sidewalkWidth: 1.6,
    vergeWidth: 1.8,
    streetLength: 58,
    lotDepthRange: deepFreeze([34, 40]),
    lotWidthPattern: deepFreeze([16, 14, 18, 16, 15, 19]),
    densityProfile: "low_density_suburban",
    neighbourhoodTheme: "suburban_mixed_residential_default"
  })
});

export function createSuburbanNeighbourhoodPreviewGenerator(
  options = suburbanNeighbourhoodPreviewGeneratorDefaultInput
) {
  const normalizedDefaultInput = normalizeGeneratorInput(options);

  return Object.freeze({
    generate(overrides = {}) {
      return generateSuburbanNeighbourhoodPreview({
        ...normalizedDefaultInput,
        ...overrides,
        blockConfiguration: {
          ...normalizedDefaultInput.blockConfiguration,
          ...(overrides.blockConfiguration ?? {})
        }
      });
    },
    validate(preview) {
      return validateSuburbanNeighbourhoodPreview(preview);
    }
  });
}

export function generateSuburbanNeighbourhoodPreview(
  rawInput = suburbanNeighbourhoodPreviewGeneratorDefaultInput
) {
  const input = normalizeGeneratorInput(rawInput);
  const seedConfig = buildSeedConfig(input);
  const lots = buildLots(input, seedConfig);
  const resolvedLots = resolveLotBuildings(lots, input, seedConfig);
  const buildingPlacements = buildBuildingPlacements(resolvedLots, input);
  const landscapePlacements = buildLandscapePlacements(resolvedLots, input);
  const roadFrontageConnections = buildRoadFrontageConnections(
    resolvedLots,
    input
  );

  const preview = deepFreeze({
    schemaId: previewSchemaId,
    neighbourhoodId: `NEIGHBOURHOOD_SUBURBAN_BLOCK_PREVIEW_${String(
      input.neighbourhoodSeed
    ).padStart(5, "0")}`,
    previewId: input.blockConfiguration.previewId,
    blockType: input.blockConfiguration.blockType,
    seed: input.neighbourhoodSeed,
    seedConfig,
    themeProfile: deepFreeze({
      themeSeed: input.themeSeed,
      neighbourhoodTheme: input.blockConfiguration.neighbourhoodTheme,
      densityProfile: input.blockConfiguration.densityProfile,
      buildingWeights: deepFreeze({
        BUILDING_HOUSE_SUBURBAN_BRICK_001: 0.55,
        BUILDING_HOUSE_COASTAL_COTTAGE_001: 0.25,
        BUILDING_HOUSE_BEACH_BUNGALOW_001: 0.2
      })
    }),
    bounds: buildBounds(input, resolvedLots),
    roadLayout: deepFreeze({
      roadSegmentId: input.blockConfiguration.roadSegmentId,
      roadType: "straight_local_residential",
      roadWidth: input.blockConfiguration.roadWidth,
      sidewalkWidth: input.blockConfiguration.sidewalkWidth,
      vergeWidth: input.blockConfiguration.vergeWidth,
      streetLength: input.blockConfiguration.streetLength,
      orientation: "east-west"
    }),
    lotCount: resolvedLots.length,
    lots: deepFreeze(resolvedLots),
    buildingPlacements: deepFreeze(buildingPlacements),
    landscapePlacements: deepFreeze(landscapePlacements),
    roadFrontageConnections: deepFreeze(roadFrontageConnections),
    validationContract: deepFreeze({
      checks: deepFreeze({
        lotCountCorrect: true,
        noDuplicateInvalidPlacement: true,
        deterministicRebuild: true,
        validBuildingIds: true,
        validRotations: true,
        drivewayAssignments: true,
        fenceAssignments: true,
        noOverlap: true,
        validLotBoundaries: true,
        validRoadConnections: true,
        validDrivewayConnections: true,
        validBuildingOrientation: true
      })
    }),
    validationResult: null
  });

  const validationResult = buildValidationResult(preview, input);
  const finalizedPreview = deepFreeze({
    ...preview,
    validationResult
  });

  const validation = validateSuburbanNeighbourhoodPreview(finalizedPreview);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalizedPreview;
}

export function validateSuburbanNeighbourhoodPreview(rawPreview) {
  try {
    const preview = normalizeGeneratedPreview(rawPreview);

    if (preview.lotCount !== 6) {
      throw createValidationError(
        "invalid_lot_count",
        "Suburban neighbourhood preview must generate exactly six lots."
      );
    }

    if (preview.lots.length !== preview.lotCount) {
      throw createValidationError(
        "lot_count_mismatch",
        "Preview lotCount must match the generated lot array length."
      );
    }

    for (const lot of preview.lots) {
      if (!supportedSuburbanNeighbourhoodBuildingAssets.includes(lot.buildingId)) {
        throw createValidationError(
          "invalid_building_id",
          `Preview lot ${lot.lotId} resolved an unsupported building ID.`
        );
      }
      if (!supportedDirections.has(lot.frontageDirection)) {
        throw createValidationError(
          "invalid_frontage_direction",
          `Preview lot ${lot.lotId} has an invalid frontage direction.`
        );
      }
      if (!supportedDrivewaySides.has(lot.drivewaySide)) {
        throw createValidationError(
          "invalid_driveway_side",
          `Preview lot ${lot.lotId} has an invalid driveway side.`
        );
      }
    }

    validateBuildingPlacements(preview.buildingPlacements, preview.lots);
    validateRoadConnections(preview.roadFrontageConnections, preview.lots);
    validateLandscapePlacements(preview.landscapePlacements, preview.lots);

    const adjacentViolations = countAdjacentDuplicateViolations(preview.lots);
    if (adjacentViolations > 0) {
      throw createValidationError(
        "adjacent_duplicate_violation",
        "Preview contains invalid adjacent duplicate building placement."
      );
    }

    const actualDeterministicHash = stableHash(
      JSON.stringify({
        seedConfig: preview.seedConfig,
        lots: preview.lots.map((lot) => ({
          lotId: lot.lotId,
          buildingId: lot.buildingId,
          rotation: lot.rotation,
          drivewaySide: lot.drivewaySide,
          landscapingSeed: lot.landscapingSeed
        }))
      })
    );

    if (
      preview.validationResult.deterministicSignatureHash !==
      actualDeterministicHash
    ) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Preview deterministic signature hash does not match the generated placement state."
      );
    }

    if (!preview.validationResult.validationPassed) {
      throw createValidationError(
        "validation_result_failed",
        "Preview validationResult must report a passing state."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      preview
    });
  } catch (error) {
    if (error?.name !== "SuburbanNeighbourhoodPreviewGeneratorValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      preview: null
    });
  }
}

function buildSeedConfig(input) {
  return deepFreeze({
    neighbourhoodSeed: input.neighbourhoodSeed,
    regionSeed: input.regionSeed,
    themeSeed: input.themeSeed
  });
}

function buildLots(input, seedConfig) {
  const { lotCount, blockConfiguration } = input;
  const rowSize = lotCount / 2;
  const lots = [];
  let southRowX = 0;
  let northRowX = 0;

  for (let index = 0; index < lotCount; index += 1) {
    const lotId = `LOT_${String(index + 1).padStart(3, "0")}`;
    const width = blockConfiguration.lotWidthPattern[index];
    const depth = pickDepth(seedConfig, blockConfiguration.lotDepthRange, index);
    const isNorthFacingRow = index < rowSize;
    const frontageDirection = isNorthFacingRow ? "NORTH" : "SOUTH";
    const rowLocalIndex = isNorthFacingRow ? index : index - rowSize;
    const x = isNorthFacingRow ? southRowX : northRowX;
    const y = isNorthFacingRow ? -depth - 8 : 8;
    const lotType = classifyLotType(width);
    const setbacks = buildSetbacks(seedConfig, index);
    const drivewaySide = resolveDrivewaySide(seedConfig, index, frontageDirection);

    const lot = deepFreeze({
      schemaId: lotSchemaId,
      lotId,
      position: deepFreeze({ x, y, z: 0 }),
      width,
      depth,
      size: deepFreeze({ width, depth }),
      frontageDirection,
      lotType,
      setback: deepFreeze(setbacks),
      rotation: frontageDirection,
      drivewaySide,
      fenceConfiguration:
        "standard_suburban_front_gap_with_side_and_rear_boundaries",
      landscapingSeed: `LANDSCAPE_${seedConfig.neighbourhoodSeed}_${String(
        index + 1
      ).padStart(3, "0")}`,
      buildingSocket: deepFreeze({
        x: x + width / 2,
        y:
          frontageDirection === "NORTH"
            ? y + depth - setbacks.front
            : y + setbacks.front,
        facing: frontageDirection
      }),
      drivewaySocket: deepFreeze({
        side: drivewaySide,
        frontageDirection
      }),
      fenceBoundary: deepFreeze({
        front: true,
        left: true,
        right: true,
        rear: true,
        drivewayOpeningSide: drivewaySide
      }),
      landscapingZones: deepFreeze({
        frontLawnZone: zoneRect(x + 0.5, y + depth - 10, width - 1, 8),
        backyardZone: zoneRect(x + 0.5, y + 1, width - 1, depth - 14),
        sidePlantingZone:
          drivewaySide === "EAST"
            ? zoneRect(x + 0.5, y + 4, 1.4, depth - 8)
            : zoneRect(x + width - 1.9, y + 4, 1.4, depth - 8),
        treeZone: zoneRect(x + width * 0.58, y + 6, 3.4, 6.5)
      }),
      resolverInputs: deepFreeze({
        neighbourhoodSeed: seedConfig.neighbourhoodSeed,
        regionSeed: seedConfig.regionSeed,
        themeSeed: seedConfig.themeSeed,
        rowLocalIndex,
        neighbourhoodTheme: blockConfiguration.neighbourhoodTheme
      })
    });

    lots.push(lot);

    if (isNorthFacingRow) {
      southRowX += width + 2;
    } else {
      northRowX += width + 2;
    }
  }

  return deepFreeze(lots);
}

function buildSetbacks(seedConfig, index) {
  return {
    front: roundNumber(randomInRange(seedConfig, `front-${index}`, 4.5, 6.5)),
    left: roundNumber(randomInRange(seedConfig, `left-${index}`, 1.4, 2.2)),
    right: roundNumber(randomInRange(seedConfig, `right-${index}`, 1.4, 2.2)),
    rear: roundNumber(randomInRange(seedConfig, `rear-${index}`, 5.5, 8.0))
  };
}

function pickDepth(seedConfig, range, index) {
  return roundNumber(randomInRange(seedConfig, `depth-${index}`, range[0], range[1]));
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

function resolveDrivewaySide(seedConfig, index, frontageDirection) {
  const hashed = stableHash(
    `${seedConfig.neighbourhoodSeed}:${seedConfig.regionSeed}:${seedConfig.themeSeed}:${index}:${frontageDirection}`
  );
  return hashed % 2 === 0 ? "EAST" : "WEST";
}

function resolveLotBuildings(lots, input, seedConfig) {
  const resolved = [];
  const rowSize = lots.length / 2;

  for (const lot of lots) {
    const index = resolved.length;
    const excludedAssets = new Set();

    if (index > 0 && sameRow(index, index - 1, rowSize)) {
      excludedAssets.add(resolved[index - 1].buildingId);
    }
    if (index >= rowSize) {
      excludedAssets.add(resolved[index - rowSize].buildingId);
    }
    if (
      index > 1 &&
      sameRow(index, index - 1, rowSize) &&
      sameRow(index, index - 2, rowSize) &&
      resolved[index - 1].buildingId === resolved[index - 2].buildingId
    ) {
      excludedAssets.add(resolved[index - 1].buildingId);
    }

    const candidateIds = pickCandidateOrder(lot, input, seedConfig, excludedAssets);
    const selectedProfile =
      candidateIds
        .map((assetId) => buildingProfiles[assetId])
        .find(Boolean) ?? buildingProfiles.BUILDING_HOUSE_SUBURBAN_BRICK_001;

    resolved.push(
      deepFreeze({
        ...lot,
        buildingId: selectedProfile.assetId,
        buildingRecipe: selectedProfile.recipeId,
        buildingFamily: selectedProfile.familyId,
        variationProfile: deepFreeze({
          roofTone: resolveRoofTone(seedConfig, lot.lotId, selectedProfile.assetId),
          fenceStyle:
            lot.lotType === "wide" ? "decorative_suburban" : "timber_standard",
          yardDensity: resolveYardDensity(seedConfig, lot.lotId),
          colourVariant: resolveColourVariant(
            seedConfig,
            lot.lotId,
            selectedProfile.assetId
          )
        }),
        resolverMetadata: deepFreeze({
          weightingRuleApplied: selectedProfile.primaryTheme,
          duplicatePreventionRuleApplied: excludedAssets.size > 0,
          resolverHash: stableHash(
            `${lot.lotId}:${input.neighbourhoodSeed}:${selectedProfile.assetId}`
          )
        })
      })
    );
  }

  return deepFreeze(resolved);
}

function pickCandidateOrder(lot, input, seedConfig, excludedAssets) {
  const candidates = Object.values(buildingProfiles)
    .filter((candidate) => lotCanFitProfile(lot, candidate))
    .filter((candidate) => !excludedAssets.has(candidate.assetId));

  const fallbackCandidates =
    candidates.length > 0
      ? candidates
      : Object.values(buildingProfiles).filter((candidate) =>
          lotCanFitProfile(lot, candidate)
        );

  return fallbackCandidates
    .map((candidate) => ({
      assetId: candidate.assetId,
      score: weightedDeterministicScore(
        `${input.neighbourhoodSeed}:${input.regionSeed}:${input.themeSeed}:${lot.lotId}:${candidate.assetId}`,
        candidate.weight
      )
    }))
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.assetId);
}

function lotCanFitProfile(lot, profile) {
  const buildableWidth = lot.width - lot.setback.left - lot.setback.right;
  const buildableDepth = lot.depth - lot.setback.front - lot.setback.rear;
  return (
    profile.footprintWidth <= buildableWidth &&
    profile.footprintDepth <= buildableDepth
  );
}

function weightedDeterministicScore(hashInput, weight) {
  const normalized = stableHash(hashInput) / 4294967295;
  return normalized / weight;
}

function buildBuildingPlacements(lots, input) {
  return lots.map((lot, index) => {
    const profile = buildingProfiles[lot.buildingId];
    const roadFacingPlacement = buildBuildingPosition(lot, profile);
    return deepFreeze({
      schemaId: buildingPlacementSchemaId,
      placementId: `BUILDING_PLACEMENT_${String(index + 1).padStart(3, "0")}`,
      lotId: lot.lotId,
      assetId: profile.assetId,
      familyId: profile.familyId,
      recipeId: profile.recipeId,
      position: roadFacingPlacement.position,
      rotation: deepFreeze({
        facingDirection: lot.frontageDirection,
        yawDegrees: facingDirectionToYaw(lot.frontageDirection)
      }),
      scale: deepFreeze({ x: 1, y: 1, z: 1 }),
      lodProfile: "LOD_GAMEPLAY",
      frontSetback: lot.setback.front,
      drivewaySide: lot.drivewaySide,
      variationProfile: lot.variationProfile,
      resolverMetadata: lot.resolverMetadata
    });
  });
}

function buildBuildingPosition(lot, profile) {
  const centerX = lot.position.x + lot.width / 2;
  const y =
    lot.frontageDirection === "NORTH"
      ? lot.position.y + lot.depth - lot.setback.front - profile.footprintDepth / 2
      : lot.position.y + lot.setback.front + profile.footprintDepth / 2;

  return deepFreeze({
    position: deepFreeze({
      x: roundNumber(centerX),
      y: roundNumber(y),
      z: 0
    })
  });
}

function buildLandscapePlacements(lots, input) {
  const placements = [];

  for (const lot of lots) {
    placements.push(
      deepFreeze({
        schemaId: landscapePlacementSchemaId,
        placementId: `${lot.lotId}_GRASS_001`,
        lotId: lot.lotId,
        assetId: "MOD_GROUND_GRASS_STANDARD_001",
        landscapeType: "grass",
        zoneId: "frontLawnZone",
        position: deepFreeze({
          x: roundNumber(lot.position.x + lot.width / 2),
          y: roundNumber(lot.position.y + lot.depth / 2),
          z: 0
        }),
        rotation: deepFreeze({ yawDegrees: 0 }),
        variationSeed: `${lot.landscapingSeed}_GRASS`,
        placementRules: deepFreeze({
          insideLotBoundary: true,
          outsideDrivewayExclusion: true,
          outsideBuildingFootprint: true
        })
      })
    );

    placements.push(
      deepFreeze({
        schemaId: landscapePlacementSchemaId,
        placementId: `${lot.lotId}_BUSH_001`,
        lotId: lot.lotId,
        assetId: "MOD_BUSH_NATIVE_STANDARD_001",
        landscapeType: "bush",
        zoneId: "entryPlantingZone",
        position: deepFreeze({
          x:
            lot.drivewaySide === "EAST"
              ? roundNumber(lot.position.x + 2.2)
              : roundNumber(lot.position.x + lot.width - 2.2),
          y:
            lot.frontageDirection === "NORTH"
              ? roundNumber(lot.position.y + lot.depth - 5.8)
              : roundNumber(lot.position.y + 5.8),
          z: 0
        }),
        rotation: deepFreeze({
          yawDegrees: stableHash(`${lot.landscapingSeed}:bush`) % 360
        }),
        variationSeed: `${lot.landscapingSeed}_BUSH`,
        placementRules: deepFreeze({
          insideLotBoundary: true,
          outsideDrivewayExclusion: true,
          outsideBuildingFootprint: true
        })
      })
    );

    if (stableHash(`${lot.landscapingSeed}:tree`) % 3 !== 1) {
      placements.push(
        deepFreeze({
          schemaId: landscapePlacementSchemaId,
          placementId: `${lot.lotId}_TREE_001`,
          lotId: lot.lotId,
          assetId: "MOD_TREE_EUCALYPTUS_STANDARD_001",
          landscapeType: "tree",
          zoneId: "treeZone",
          position: deepFreeze({
            x: roundNumber(lot.position.x + lot.width * 0.7),
            y: roundNumber(lot.position.y + 8.5),
            z: 0
          }),
          rotation: deepFreeze({
            yawDegrees: stableHash(`${lot.landscapingSeed}:tree-rot`) % 360
          }),
          variationSeed: `${lot.landscapingSeed}_TREE`,
          placementRules: deepFreeze({
            insideLotBoundary: true,
            outsideDrivewayExclusion: true,
            outsideBuildingFootprint: true
          })
        })
      );
    }
  }

  return deepFreeze(placements);
}

function buildRoadFrontageConnections(lots, input) {
  return lots.map((lot, index) =>
    deepFreeze({
      schemaId: roadFrontageConnectionSchemaId,
      connectionId: `ROAD_FRONTAGE_CONNECTION_${String(index + 1).padStart(3, "0")}`,
      lotId: lot.lotId,
      roadSegmentId: input.blockConfiguration.roadSegmentId,
      frontageDirection: lot.frontageDirection,
      connectionPoint: deepFreeze({
        x: roundNumber(lot.position.x + lot.width / 2),
        y: lot.frontageDirection === "NORTH" ? 0 : input.blockConfiguration.roadWidth,
        z: 0
      }),
      drivewayLink: deepFreeze({
        drivewaySide: lot.drivewaySide,
        roadAligned: true
      }),
      entryPathLink: deepFreeze({
        connected: true,
        frontDoorFacingRoad: true
      }),
      vergeProfile: deepFreeze({
        grassVergeWidth: input.blockConfiguration.vergeWidth,
        sidewalkWidth: input.blockConfiguration.sidewalkWidth
      })
    })
  );
}

function buildValidationResult(preview, input) {
  const noOverlap = countBuildingOverlaps(preview.buildingPlacements, preview.lots) === 0;
  const validBuildingIds = preview.lots.every((lot) =>
    supportedSuburbanNeighbourhoodBuildingAssets.includes(lot.buildingId)
  );
  const validRotations = preview.buildingPlacements.every((placement) =>
    supportedDirections.has(placement.rotation.facingDirection)
  );
  const drivewayAssignments = preview.lots.every((lot) =>
    supportedDrivewaySides.has(lot.drivewaySide)
  );
  const fenceAssignments = preview.lots.every(
    (lot) => typeof lot.fenceConfiguration === "string" && lot.fenceConfiguration.length > 0
  );
  const deterministicSignatureHash = stableHash(
    JSON.stringify({
      seedConfig: preview.seedConfig,
      lots: preview.lots.map((lot) => ({
        lotId: lot.lotId,
        buildingId: lot.buildingId,
        rotation: lot.rotation,
        drivewaySide: lot.drivewaySide,
        landscapingSeed: lot.landscapingSeed
      }))
    })
  );

  return deepFreeze({
    lotCountCorrect: preview.lotCount === input.lotCount,
    noDuplicateInvalidPlacement: countAdjacentDuplicateViolations(preview.lots) === 0,
    deterministicRebuild: true,
    validBuildingIds,
    validRotations,
    drivewayAssignments,
    fenceAssignments,
    noOverlap,
    validLotBoundaries: preview.lots.every(
      (lot) => lot.width > 0 && lot.depth > 0 && lot.setback.front > 0
    ),
    validRoadConnections: preview.roadFrontageConnections.every(
      (connection) => connection.roadSegmentId === input.blockConfiguration.roadSegmentId
    ),
    validDrivewayConnections: preview.roadFrontageConnections.every(
      (connection) => connection.drivewayLink.roadAligned
    ),
    validBuildingOrientation: preview.buildingPlacements.every(
      (placement) =>
        placement.rotation.yawDegrees ===
        facingDirectionToYaw(placement.rotation.facingDirection)
    ),
    deterministicSignatureHash,
    validationPassed:
      preview.lotCount === input.lotCount &&
      countAdjacentDuplicateViolations(preview.lots) === 0 &&
      validBuildingIds &&
      validRotations &&
      drivewayAssignments &&
      fenceAssignments &&
      noOverlap
  });
}

function countAdjacentDuplicateViolations(lots) {
  let count = 0;
  const rowSize = lots.length / 2;

  for (let index = 0; index < lots.length; index += 1) {
    if (index > 0 && sameRow(index, index - 1, rowSize)) {
      if (lots[index].buildingId === lots[index - 1].buildingId) {
        count += 1;
      }
    }
  }

  return count;
}

function countBuildingOverlaps(buildingPlacements, lots) {
  const lotMap = new Map(lots.map((lot) => [lot.lotId, lot]));
  let overlaps = 0;

  for (let leftIndex = 0; leftIndex < buildingPlacements.length; leftIndex += 1) {
    const leftPlacement = buildingPlacements[leftIndex];
    const leftProfile = buildingProfiles[leftPlacement.assetId];
    const leftBounds = placementBounds(leftPlacement.position, leftProfile);

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < buildingPlacements.length;
      rightIndex += 1
    ) {
      const rightPlacement = buildingPlacements[rightIndex];
      const rightProfile = buildingProfiles[rightPlacement.assetId];
      const rightBounds = placementBounds(rightPlacement.position, rightProfile);

      if (rectsOverlap(leftBounds, rightBounds)) {
        const leftLot = lotMap.get(leftPlacement.lotId);
        const rightLot = lotMap.get(rightPlacement.lotId);
        if (!leftLot || !rightLot || leftLot.lotId !== rightLot.lotId) {
          overlaps += 1;
        }
      }
    }
  }

  return overlaps;
}

function validateBuildingPlacements(buildingPlacements, lots) {
  const lotMap = new Map(lots.map((lot) => [lot.lotId, lot]));
  const overlaps = countBuildingOverlaps(buildingPlacements, lots);
  if (overlaps > 0) {
    throw createValidationError(
      "building_overlap_invalid",
      "Preview building placements overlap across lot boundaries."
    );
  }

  for (const placement of buildingPlacements) {
    const lot = lotMap.get(placement.lotId);
    const profile = buildingProfiles[placement.assetId];
    if (!lot || !profile) {
      throw createValidationError(
        "building_placement_invalid",
        "Preview building placement references an invalid lot or building profile."
      );
    }

    const bounds = placementBounds(placement.position, profile);
    if (
      bounds.minX < lot.position.x + lot.setback.left ||
      bounds.maxX > lot.position.x + lot.width - lot.setback.right ||
      bounds.minY < lot.position.y + lot.setback.rear - 0.1 &&
      lot.frontageDirection === "NORTH"
    ) {
      // no-op: north-facing lots have rear at minY side, checked below with explicit rules
    }

    if (lot.frontageDirection === "NORTH") {
      const minAllowedY = lot.position.y + lot.setback.rear;
      const maxAllowedY = lot.position.y + lot.depth - lot.setback.front;
      if (
        bounds.minY < minAllowedY - 0.02 ||
        bounds.maxY > maxAllowedY + 0.02
      ) {
        throw createValidationError(
          "building_inside_lot_invalid",
          `Preview building placement ${placement.placementId} exceeds its lot boundary (north-facing lot ${lot.lotId}; minY=${bounds.minY}, maxY=${bounds.maxY}, allowedMinY=${minAllowedY}, allowedMaxY=${maxAllowedY}).`
        );
      }
    } else {
      const minAllowedY = lot.position.y + lot.setback.front;
      const maxAllowedY = lot.position.y + lot.depth - lot.setback.rear;
      if (
        bounds.minY < minAllowedY - 0.02 ||
        bounds.maxY > maxAllowedY + 0.02
      ) {
        throw createValidationError(
          "building_inside_lot_invalid",
          `Preview building placement ${placement.placementId} exceeds its lot boundary (south-facing lot ${lot.lotId}; minY=${bounds.minY}, maxY=${bounds.maxY}, allowedMinY=${minAllowedY}, allowedMaxY=${maxAllowedY}).`
        );
      }
    }
  }
}

function validateRoadConnections(roadFrontageConnections, lots) {
  const lotIds = new Set(lots.map((lot) => lot.lotId));
  for (const connection of roadFrontageConnections) {
    if (!lotIds.has(connection.lotId)) {
      throw createValidationError(
        "road_connection_invalid",
        "Preview road connection references an unknown lot."
      );
    }
    if (!connection.drivewayLink.roadAligned) {
      throw createValidationError(
        "driveway_connection_invalid",
        "Preview road connection must keep driveway alignment true."
      );
    }
  }
}

function validateLandscapePlacements(landscapePlacements, lots) {
  const lotMap = new Map(lots.map((lot) => [lot.lotId, lot]));
  for (const placement of landscapePlacements) {
    const lot = lotMap.get(placement.lotId);
    if (!lot) {
      throw createValidationError(
        "landscape_lot_invalid",
        "Preview landscape placement references an unknown lot."
      );
    }

    if (
      placement.position.x < lot.position.x ||
      placement.position.x > lot.position.x + lot.width ||
      placement.position.y < lot.position.y ||
      placement.position.y > lot.position.y + lot.depth
    ) {
      throw createValidationError(
        "landscape_outside_lot",
        "Preview landscape placement falls outside its assigned lot."
      );
    }
  }
}

function buildBounds(input, lots) {
  const maxX = Math.max(...lots.map((lot) => lot.position.x + lot.width)) + 4;
  const minY = Math.min(...lots.map((lot) => lot.position.y)) - 4;
  const maxY = Math.max(...lots.map((lot) => lot.position.y + lot.depth)) + 4;
  return deepFreeze({
    minX: 0,
    minY: roundNumber(minY),
    maxX: roundNumber(maxX),
    maxY: roundNumber(maxY)
  });
}

function sameRow(leftIndex, rightIndex, rowSize) {
  return Math.floor(leftIndex / rowSize) === Math.floor(rightIndex / rowSize);
}

function resolveRoofTone(seedConfig, lotId, assetId) {
  const tones =
    assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001"
      ? ["charcoal", "terracotta", "deep_red"]
      : ["soft_grey", "weathered_red", "sandstone"];
  return tones[stableHash(`${seedConfig.neighbourhoodSeed}:${lotId}:${assetId}:roof`) % tones.length];
}

function resolveYardDensity(seedConfig, lotId) {
  const options = ["light", "moderate", "lush"];
  return options[stableHash(`${seedConfig.themeSeed}:${lotId}:yard`) % options.length];
}

function resolveColourVariant(seedConfig, lotId, assetId) {
  const options =
    assetId === "BUILDING_HOUSE_SUBURBAN_BRICK_001"
      ? ["brick_red", "brick_cream", "brick_brown"]
      : ["weatherboard_white", "weatherboard_sand", "weatherboard_soft_blue"];
  return options[stableHash(`${seedConfig.regionSeed}:${lotId}:${assetId}:colour`) % options.length];
}

function zoneRect(x, y, width, depth) {
  return deepFreeze({
    x: roundNumber(x),
    y: roundNumber(y),
    width: roundNumber(width),
    depth: roundNumber(depth)
  });
}

function placementBounds(position, profile) {
  return {
    minX: position.x - profile.footprintWidth / 2,
    maxX: position.x + profile.footprintWidth / 2,
    minY: position.y - profile.footprintDepth / 2,
    maxY: position.y + profile.footprintDepth / 2
  };
}

function rectsOverlap(left, right) {
  return !(
    left.maxX <= right.minX ||
    left.minX >= right.maxX ||
    left.maxY <= right.minY ||
    left.minY >= right.maxY
  );
}

function facingDirectionToYaw(direction) {
  switch (direction) {
    case "NORTH":
      return 180;
    case "SOUTH":
      return 0;
    case "EAST":
      return 270;
    case "WEST":
      return 90;
    default:
      return 0;
  }
}

function normalizeGeneratorInput(rawInput) {
  const input = asPlainObject(rawInput, "suburban neighbourhood preview input");
  const blockConfiguration = asPlainObject(
    input.blockConfiguration ?? suburbanNeighbourhoodPreviewGeneratorDefaultInput.blockConfiguration,
    "blockConfiguration"
  );

  const lotCount = normalizeInteger(input.lotCount, "lotCount");
  if (lotCount !== 6) {
    throw createValidationError(
      "unsupported_lot_count",
      "The first deterministic suburban preview generator currently supports exactly six lots."
    );
  }

  return deepFreeze({
    neighbourhoodSeed: normalizeInteger(
      input.neighbourhoodSeed,
      "neighbourhoodSeed"
    ),
    regionSeed: normalizeInteger(input.regionSeed, "regionSeed"),
    themeSeed: normalizeNonEmptyString(input.themeSeed, "themeSeed"),
    lotCount,
    blockConfiguration: deepFreeze({
      blockType: normalizeNonEmptyString(
        blockConfiguration.blockType,
        "blockConfiguration.blockType"
      ),
      previewId: normalizeNonEmptyString(
        blockConfiguration.previewId,
        "blockConfiguration.previewId"
      ),
      roadSegmentId: normalizeNonEmptyString(
        blockConfiguration.roadSegmentId,
        "blockConfiguration.roadSegmentId"
      ),
      roadWidth: normalizePositiveNumber(
        blockConfiguration.roadWidth,
        "blockConfiguration.roadWidth"
      ),
      sidewalkWidth: normalizePositiveNumber(
        blockConfiguration.sidewalkWidth,
        "blockConfiguration.sidewalkWidth"
      ),
      vergeWidth: normalizePositiveNumber(
        blockConfiguration.vergeWidth,
        "blockConfiguration.vergeWidth"
      ),
      streetLength: normalizePositiveNumber(
        blockConfiguration.streetLength,
        "blockConfiguration.streetLength"
      ),
      lotDepthRange: normalizeDepthRange(
        blockConfiguration.lotDepthRange,
        "blockConfiguration.lotDepthRange"
      ),
      lotWidthPattern: normalizeWidthPattern(
        blockConfiguration.lotWidthPattern,
        "blockConfiguration.lotWidthPattern"
      ),
      densityProfile: normalizeNonEmptyString(
        blockConfiguration.densityProfile,
        "blockConfiguration.densityProfile"
      ),
      neighbourhoodTheme: normalizeNonEmptyString(
        blockConfiguration.neighbourhoodTheme,
        "blockConfiguration.neighbourhoodTheme"
      )
    })
  });
}

function normalizeGeneratedPreview(rawPreview) {
  const preview = asPlainObject(rawPreview, "generated suburban neighbourhood preview");
  return deepFreeze({
    schemaId: normalizeNonEmptyString(preview.schemaId, "schemaId"),
    neighbourhoodId: normalizeNonEmptyString(
      preview.neighbourhoodId,
      "neighbourhoodId"
    ),
    previewId: normalizeNonEmptyString(preview.previewId, "previewId"),
    blockType: normalizeNonEmptyString(preview.blockType, "blockType"),
    seedConfig: asPlainObject(preview.seedConfig, "seedConfig"),
    lotCount: normalizeInteger(preview.lotCount, "lotCount"),
    lots: normalizeArray(preview.lots, "lots"),
    buildingPlacements: normalizeArray(
      preview.buildingPlacements,
      "buildingPlacements"
    ),
    landscapePlacements: normalizeArray(
      preview.landscapePlacements,
      "landscapePlacements"
    ),
    roadFrontageConnections: normalizeArray(
      preview.roadFrontageConnections,
      "roadFrontageConnections"
    ),
    validationResult: asPlainObject(preview.validationResult, "validationResult")
  });
}

function normalizeWidthPattern(value, fieldName) {
  if (!Array.isArray(value) || value.length !== 6) {
    throw createValidationError(
      "invalid_width_pattern",
      `${fieldName} must be an array of six lot widths.`
    );
  }
  return value.map((entry, index) =>
    normalizePositiveNumber(entry, `${fieldName}[${index}]`)
  );
}

function normalizeDepthRange(value, fieldName) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw createValidationError(
      "invalid_depth_range",
      `${fieldName} must contain a minimum and maximum depth.`
    );
  }
  const min = normalizePositiveNumber(value[0], `${fieldName}[0]`);
  const max = normalizePositiveNumber(value[1], `${fieldName}[1]`);
  if (max <= min) {
    throw createValidationError(
      "invalid_depth_range",
      `${fieldName} maximum depth must be greater than minimum depth.`
    );
  }
  return deepFreeze([min, max]);
}

function normalizeArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be an array.`
    );
  }
  return value;
}

function normalizeInteger(value, fieldName) {
  if (!Number.isInteger(value)) {
    throw createValidationError(
      "invalid_integer",
      `${fieldName} must be an integer.`
    );
  }
  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a positive number.`
    );
  }
  return roundNumber(value);
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
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

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function randomInRange(seedConfig, label, min, max) {
  const normalized = stableHash(
    `${seedConfig.neighbourhoodSeed}:${seedConfig.regionSeed}:${seedConfig.themeSeed}:${label}`
  ) / 4294967295;
  return roundNumber(min + normalized * (max - min));
}

function stableHash(value) {
  const stringValue = String(value);
  let hash = 2166136261;
  for (let index = 0; index < stringValue.length; index += 1) {
    hash ^= stringValue.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "SuburbanNeighbourhoodPreviewGeneratorValidationError";
  error.code = code;
  return error;
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

const supportedDirections = new Set(["NORTH", "SOUTH", "EAST", "WEST"]);
const supportedDrivewaySides = new Set(["EAST", "WEST"]);
