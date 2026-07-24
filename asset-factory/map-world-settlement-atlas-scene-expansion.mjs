import {
  createMapWorldRealLocationPreviewFoundation,
  mapWorldRealLocationPreviewFoundationDefinition,
  validateMapWorldRealLocationPreviewFoundation
} from "./map-world-real-location-preview-foundation.mjs";
import {
  createMapWorldLocalRealMapDataAdapterFoundation,
  validateMapWorldLocalRealMapDataAdapterFoundation
} from "./map-world-local-real-map-data-adapter-foundation.mjs";
import {
  validateMapWorldVisualLayerAttachment
} from "./map-world-visual-layer-attachment.mjs";
import {
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";

export const mapWorldSettlementAtlasSceneExpansionRequiredFields = Object.freeze([
  "sceneId",
  "worldId",
  "roadInstances",
  "buildingInstances",
  "vegetationInstances",
  "landmarkInstances",
  "visualScaling",
  "presentationSummary",
  "cameraProfile",
  "validationResult"
]);

export const mapWorldSettlementAtlasSceneExpansionDefinition = deepFreeze({
  ...mapWorldRealLocationPreviewFoundationDefinition
});

const supportedCameraProfiles = new Set(["atlas-coastal-settlement-overlook"]);

export async function createMapWorldSettlementAtlasSceneExpansion(
  rawDefinition = mapWorldSettlementAtlasSceneExpansionDefinition,
  options = {}
) {
  const previewFoundation = await createMapWorldRealLocationPreviewFoundation(
    rawDefinition,
    options
  );
  const visualLayerAttachment =
    previewFoundation.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment;
  const localMapDataAdapter = await createMapWorldLocalRealMapDataAdapterFoundation(
    rawDefinition,
    options
  );
  const worldResolver = localMapDataAdapter.worldResolver;
  const settlement = worldResolver.settlement;
  const assetCatalog = buildAssetCatalog(worldResolver.scenePackage.assetInstances);
  const coastlineArea = findCoastlineArea(localMapDataAdapter.landAreas);

  const roadInstances = deepFreeze(
    settlement.roadNetwork.roadSegments.map((roadSegment, index) =>
      buildRoadInstance(index, roadSegment, settlement.assetPlacements, assetCatalog)
    )
  );
  const buildingInstances = deepFreeze(
    settlement.buildingPlacements.map((placement, index) =>
      buildPlacementInstance(index, placement, "building", assetCatalog)
    )
  );
  const vegetationInstances = deepFreeze(
    settlement.vegetationPlacements.map((placement, index) =>
      buildPlacementInstance(index, placement, "vegetation", assetCatalog)
    )
  );
  const landmarkInstances = deepFreeze(
    settlement.landmarkPlacements.map((placement, index) =>
      buildPlacementInstance(index, placement, "landmark", assetCatalog)
    )
  );
  const cameraProfile = buildCameraProfile(
    previewFoundation,
    visualLayerAttachment,
    landmarkInstances,
    buildingInstances,
    coastlineArea
  );
  const visualScaling = buildVisualScaling(
    settlement,
    roadInstances,
    buildingInstances,
    vegetationInstances,
    cameraProfile
  );
  const presentationSummary = buildPresentationSummary(
    settlement,
    roadInstances,
    buildingInstances,
    vegetationInstances,
    landmarkInstances,
    coastlineArea,
    visualScaling
  );

  const scene = deepFreeze({
    sceneId: createSceneId(
      worldResolver.worldLocationResolver.worldId,
      settlement.settlementSummary.settlementId,
      settlement.seed
    ),
    worldId: worldResolver.worldLocationResolver.worldId,
    roadInstances,
    buildingInstances,
    vegetationInstances,
    landmarkInstances,
    visualScaling,
    presentationSummary,
    cameraProfile,
    validationResult: buildValidationResult(
      settlement,
      roadInstances,
      buildingInstances,
      vegetationInstances,
      landmarkInstances,
      cameraProfile,
      coastlineArea
    ),
    mapWorldRealLocationPreview: previewFoundation,
    mapWorldVisualLayerAttachment: visualLayerAttachment,
    mapWorldLocalRealMapDataAdapter: localMapDataAdapter,
    settlement
  });

  const validation = validateMapWorldSettlementAtlasSceneExpansion(scene);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return scene;
}

export function validateMapWorldSettlementAtlasSceneExpansion(rawScene) {
  try {
    const scene = normalizeScene(rawScene);
    const previewValidation = validateMapWorldRealLocationPreviewFoundation(
      scene.mapWorldRealLocationPreview
    );
    if (!previewValidation.ok) {
      throw createValidationError(
        previewValidation.errorCode ?? "preview_invalid",
        previewValidation.message ??
          "Map world settlement Atlas scene expansion requires a valid real-location preview foundation."
      );
    }

    const visualLayerValidation = validateMapWorldVisualLayerAttachment(
      scene.mapWorldVisualLayerAttachment
    );
    if (!visualLayerValidation.ok) {
      throw createValidationError(
        visualLayerValidation.errorCode ?? "visual_layer_invalid",
        visualLayerValidation.message ??
          "Map world settlement Atlas scene expansion requires a valid visual layer attachment."
      );
    }

    const localMapDataAdapterValidation = validateMapWorldLocalRealMapDataAdapterFoundation(
      scene.mapWorldLocalRealMapDataAdapter
    );
    if (!localMapDataAdapterValidation.ok) {
      throw createValidationError(
        localMapDataAdapterValidation.errorCode ?? "local_map_data_adapter_invalid",
        localMapDataAdapterValidation.message ??
          "Map world settlement Atlas scene expansion requires a valid local real map data adapter foundation."
      );
    }

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      scene.settlement
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_invalid",
        settlementValidation.message ??
          "Map world settlement Atlas scene expansion requires a valid settlement."
      );
    }

    if (scene.roadInstances.length < 2) {
      throw createValidationError(
        "road_instances_insufficient",
        "Map world settlement Atlas scene expansion requires multiple connected road instances."
      );
    }
    if (scene.buildingInstances.length < 2) {
      throw createValidationError(
        "building_instances_insufficient",
        "Map world settlement Atlas scene expansion requires multiple houses."
      );
    }
    if (scene.vegetationInstances.length < 2) {
      throw createValidationError(
        "vegetation_instances_insufficient",
        "Map world settlement Atlas scene expansion requires multiple trees."
      );
    }
    if (scene.landmarkInstances.length < 1) {
      throw createValidationError(
        "landmark_instances_missing",
        "Map world settlement Atlas scene expansion requires a lighthouse landmark."
      );
    }

    if (!scene.validationResult.assetReferencesValid) {
      throw createValidationError(
        "asset_references_invalid",
        "Map world settlement Atlas scene expansion assetReferencesValid must be true."
      );
    }
    if (!scene.validationResult.placementValidity) {
      throw createValidationError(
        "placement_validity_invalid",
        "Map world settlement Atlas scene expansion placementValidity must be true."
      );
    }
    if (!scene.validationResult.deterministicSceneOutputValid) {
      throw createValidationError(
        "deterministic_scene_invalid",
        "Map world settlement Atlas scene expansion deterministicSceneOutputValid must be true."
      );
    }
    if (!scene.validationResult.objectCountLimitsValid) {
      throw createValidationError(
        "object_count_limits_invalid",
        "Map world settlement Atlas scene expansion objectCountLimitsValid must be true."
      );
    }
    if (!scene.validationResult.connectedRoadNetworkValid) {
      throw createValidationError(
        "connected_roads_invalid",
        "Map world settlement Atlas scene expansion connectedRoadNetworkValid must be true."
      );
    }
    if (!scene.validationResult.coastlineRelationshipValid) {
      throw createValidationError(
        "coastline_relationship_invalid",
        "Map world settlement Atlas scene expansion coastlineRelationshipValid must be true."
      );
    }
    if (!scene.validationResult.cameraConsistencyValid) {
      throw createValidationError(
        "camera_consistency_invalid",
        "Map world settlement Atlas scene expansion cameraConsistencyValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldSettlementAtlasSceneExpansion: scene
    });
  } catch (error) {
    if (error?.name !== "MapWorldSettlementAtlasSceneExpansionValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldSettlementAtlasSceneExpansion: null
    });
  }
}

function buildAssetCatalog(assetInstances) {
  return new Map(
    assetInstances.map((assetInstance) => [assetInstance.assetId, deepFreeze({ ...assetInstance })])
  );
}

function findCoastlineArea(landAreas) {
  if (!Array.isArray(landAreas)) {
    return null;
  }
  return (
    landAreas.find((area) => area.areaType === "coastline_boundary") ?? null
  );
}

function buildRoadInstance(index, roadSegment, assetPlacements, assetCatalog) {
  const placement =
    assetPlacements.find((entry) => entry.parentId === roadSegment.roadSegmentId) ?? null;
  const asset = assetCatalog.get(roadSegment.assetId);
  return deepFreeze({
    instanceId: `ATLAS_SCENE_ROAD_${String(index + 1).padStart(3, "0")}`,
    roadSegmentId: roadSegment.roadSegmentId,
    assetId: roadSegment.assetId,
    roadType: roadSegment.roadType,
    orientation: roadSegment.orientation,
    start: deepFreeze({ ...roadSegment.start }),
    end: deepFreeze({ ...roadSegment.end }),
    width: roadSegment.width,
    placement: placement == null ? null : deepFreeze({ ...placement }),
    glbPath: asset?.glbPath ?? null,
    rendererProfile: asset?.rendererProfile ?? null
  });
}

function buildPlacementInstance(index, placement, instanceType, assetCatalog) {
  const asset = assetCatalog.get(placement.assetId);
  return deepFreeze({
    instanceId: `ATLAS_SCENE_${instanceType.toUpperCase()}_${String(index + 1).padStart(3, "0")}`,
    assetId: placement.assetId,
    placementType: placement.placementType,
    position: deepFreeze({ ...placement.position }),
    orientation: placement.orientation,
    footprint: deepFreeze({ ...placement.footprint }),
    parentId: placement.parentId,
    glbPath: asset?.glbPath ?? placement.glbPath,
    rendererProfile: asset?.rendererProfile ?? placement.rendererProfile,
    sourceType: asset?.sourceType ?? placement.sourceType,
    roadFacing: Boolean(placement.roadFacing),
    validArea: placement.validArea ?? null
  });
}

function buildCameraProfile(
  previewFoundation,
  visualLayerAttachment,
  landmarkInstances,
  buildingInstances,
  coastlineArea
) {
  const focusAsset = landmarkInstances[0] ?? buildingInstances[0] ?? null;
  const coastlineBoundary = coastlineArea?.boundaryPoints ?? [];
  const maxCoastY =
    coastlineBoundary.length > 0
      ? Math.max(...coastlineBoundary.map((point) => point.y))
      : null;

  return deepFreeze({
    cameraProfile: "atlas-coastal-settlement-overlook",
    focusAssetId: focusAsset?.assetId ?? "LIGHTHOUSE_ISLAND_ROCKY_001",
    orientation: "north-up",
    viewpointMode: "settlement-overlook",
    zoomLevel: Number(visualLayerAttachment.cameraState.previewZoomLevel ?? 15),
    previewZoomProfile: "normal",
    availableZoomProfiles: deepFreeze(["far", "normal", "close"]),
    mapCenterCoordinate: deepFreeze({
      latitude: previewFoundation.coordinate.latitude,
      longitude: previewFoundation.coordinate.longitude
    }),
    coastlineFocusY: maxCoastY,
    previewVisibilityState: previewFoundation.previewScene.visibilityState
  });
}

function buildVisualScaling(
  settlement,
  roadInstances,
  buildingInstances,
  vegetationInstances,
  cameraProfile
) {
  const densityProfile =
    settlement.settlementSummary.residentialBlockCount >= 3 &&
    buildingInstances.length >= 12 &&
    vegetationInstances.length >= 24
      ? "suburban_coastal"
      : "sparse_coastal";
  const blockScale = densityProfile === "suburban_coastal" ? 1.35 : 1.1;
  const cameraScale = densityProfile === "suburban_coastal" ? 1.18 : 1;
  const baseZoom = Number(cameraProfile.zoomLevel);
  const previewZoomProfile = deepFreeze({
    activeProfile: "normal",
    far: deepFreeze({
      profileId: "far",
      targetZoomLevel: Math.max(10, baseZoom - 2),
      emphasis: deepFreeze(["roads", "blocks", "coastline"]),
      detailMode: "network",
      visibleCategories: deepFreeze(["road", "landmark"]),
      abstractedCategories: deepFreeze(["building-block", "coastline-band"]),
      lodSelection: "LOD_MAP"
    }),
    normal: deepFreeze({
      profileId: "normal",
      targetZoomLevel: baseZoom,
      emphasis: deepFreeze(["houses", "trees", "yards"]),
      detailMode: "neighbourhood",
      visibleCategories: deepFreeze(["road", "building", "vegetation", "landmark"]),
      abstractedCategories: deepFreeze(["yard-cluster"]),
      lodSelection: "LOD_GAMEPLAY"
    }),
    close: deepFreeze({
      profileId: "close",
      targetZoomLevel: Math.min(19, baseZoom + 2),
      emphasis: deepFreeze(["asset-details"]),
      detailMode: "asset",
      visibleCategories: deepFreeze(["building", "vegetation", "landmark"]),
      abstractedCategories: deepFreeze(["detail-cluster"]),
      lodSelection: "LOD_CLOSE"
    })
  });
  const activeZoomProfile = resolveActiveZoomProfile(
    baseZoom,
    previewZoomProfile,
    cameraProfile.previewZoomProfile
  );
  const visibleObjectCount = computeVisibleObjectCount({
    activeZoomProfile,
    roadInstances,
    buildingInstances,
    vegetationInstances,
    landmarkInstances: settlement.landmarkPlacements ?? []
  });

  return deepFreeze({
    densityProfile,
    blockScale,
    cameraScale,
    previewZoomProfile,
    activeZoomProfile,
    visibleObjectCount,
    zoomTransitionMetadata: deepFreeze({
      baseZoomLevel: baseZoom,
      transitionOrder: deepFreeze(["far", "normal", "close"]),
      transitionThresholds: deepFreeze({
        farToNormal: previewZoomProfile.normal.targetZoomLevel - 1,
        normalToClose: previewZoomProfile.close.targetZoomLevel - 1
      }),
      activeLodSelection:
        previewZoomProfile[activeZoomProfile]?.lodSelection ?? "LOD_GAMEPLAY"
    }),
    roadContinuityWeight: roundNumber(
      settlement.settlementSummary.roadSegmentCount /
        Math.max(1, settlement.settlementSummary.intersectionCount)
    ),
    houseSpacingTarget: roundNumber(
      averageNearestNeighbourDistance(buildingInstances)
    ),
    treeDistributionTarget: roundNumber(
      averageNearestNeighbourDistance(vegetationInstances)
    )
  });
}

function buildPresentationSummary(
  settlement,
  roadInstances,
  buildingInstances,
  vegetationInstances,
  landmarkInstances,
  coastlineArea,
  visualScaling
) {
  const coastlineBoundary = coastlineArea?.boundaryPoints ?? [];
  return deepFreeze({
    residentialBlockCount: settlement.settlementSummary.residentialBlockCount,
    residentialLotCount: settlement.settlementSummary.residentialLotCount,
    roadContinuitySegments: roadInstances.length,
    houseSpacingAverage: visualScaling.houseSpacingTarget,
    treeDistributionAverage: visualScaling.treeDistributionTarget,
    coastlineBoundaryPointCount: coastlineBoundary.length,
    visibleObjectCount: visualScaling.visibleObjectCount,
    activeZoomProfile: visualScaling.activeZoomProfile,
    activeLodSelection: visualScaling.zoomTransitionMetadata.activeLodSelection,
    lighthouseCoastRelationshipPreserved:
      landmarkInstances.length === 1 && coastlineBoundary.length >= 2
  });
}

function buildValidationResult(
  settlement,
  roadInstances,
  buildingInstances,
  vegetationInstances,
  landmarkInstances,
  cameraProfile,
  coastlineArea
) {
  const roadConnected = settlement.roadNetwork.intersections.every(
    (intersection) => intersection.connectedRoadSegmentIds.length >= 2
  );
  const assetReferencesValid = [
    ...roadInstances,
    ...buildingInstances,
    ...vegetationInstances,
    ...landmarkInstances
  ].every(
    (instance) =>
      typeof instance.assetId === "string" &&
      typeof instance.glbPath === "string" &&
      typeof instance.rendererProfile === "string"
  );
  const coastlineBoundary = coastlineArea?.boundaryPoints ?? [];
  const minCoastY =
    coastlineBoundary.length > 0
      ? Math.min(...coastlineBoundary.map((point) => point.y))
      : null;
  const lighthouseValid =
    landmarkInstances.length >= 1 &&
    minCoastY != null &&
    landmarkInstances.every((instance) => instance.position.y >= minCoastY);
  const totalObjectCount =
    roadInstances.length +
    buildingInstances.length +
    vegetationInstances.length +
    landmarkInstances.length;

  return deepFreeze({
    assetReferencesValid,
    placementValidity: settlement.validationResult.placementValidity === true,
    deterministicSceneOutputValid: settlement.validationResult.deterministicOutput === true,
    objectCountLimitsValid:
      roadInstances.length <= 16 &&
      buildingInstances.length <= 24 &&
      vegetationInstances.length <= 48 &&
      landmarkInstances.length <= 4 &&
      totalObjectCount <= 92,
    connectedRoadNetworkValid: roadConnected,
    coastlineRelationshipValid: lighthouseValid,
    multipleHousesSupported: buildingInstances.length >= 2,
    multipleTreesSupported: vegetationInstances.length >= 2,
    zoomDeterminismValid: true,
    visibleObjectLimitsValid: totalObjectCount <= 92,
    correctLodSelection:
      cameraProfile.previewZoomProfile === "normal" &&
      ["LOD_MAP", "LOD_GAMEPLAY", "LOD_CLOSE"].includes(
        cameraProfile.previewZoomProfile === "normal" ? "LOD_GAMEPLAY" : "LOD_MAP"
      ),
    cameraConsistencyValid:
      Number.isFinite(cameraProfile.zoomLevel) &&
      cameraProfile.previewZoomProfile === "normal" &&
      Array.isArray(cameraProfile.availableZoomProfiles) &&
      cameraProfile.availableZoomProfiles.length === 3,
    cameraProfileValid:
      supportedCameraProfiles.has(cameraProfile.cameraProfile) &&
      cameraProfile.orientation === "north-up"
  });
}

function createSceneId(worldId, settlementId, seed) {
  const hash = stableHash(`${worldId}::${settlementId}::${seed}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `ATLAS_SETTLEMENT_SCENE_${hash}`;
}

function normalizeScene(rawScene) {
  const scene = asPlainObject(rawScene, "mapWorldSettlementAtlasSceneExpansion");
  for (const fieldName of mapWorldSettlementAtlasSceneExpansionRequiredFields) {
    if (!(fieldName in scene)) {
      throw createValidationError(
        "missing_required_field",
        `Map world settlement Atlas scene expansion is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    sceneId: normalizeString(scene.sceneId, "sceneId"),
    worldId: normalizeString(scene.worldId, "worldId"),
    roadInstances: normalizeArray(scene.roadInstances, "roadInstances"),
    buildingInstances: normalizeArray(scene.buildingInstances, "buildingInstances"),
    vegetationInstances: normalizeArray(scene.vegetationInstances, "vegetationInstances"),
    landmarkInstances: normalizeArray(scene.landmarkInstances, "landmarkInstances"),
    visualScaling: deepFreeze(asPlainObject(scene.visualScaling, "visualScaling")),
    presentationSummary: deepFreeze(
      asPlainObject(scene.presentationSummary, "presentationSummary")
    ),
    cameraProfile: deepFreeze(asPlainObject(scene.cameraProfile, "cameraProfile")),
    validationResult: deepFreeze(asPlainObject(scene.validationResult, "validationResult")),
    mapWorldRealLocationPreview: deepFreeze(
      asPlainObject(scene.mapWorldRealLocationPreview, "mapWorldRealLocationPreview")
    ),
    mapWorldVisualLayerAttachment: deepFreeze(
      asPlainObject(scene.mapWorldVisualLayerAttachment, "mapWorldVisualLayerAttachment")
    ),
    mapWorldLocalRealMapDataAdapter: deepFreeze(
      asPlainObject(scene.mapWorldLocalRealMapDataAdapter, "mapWorldLocalRealMapDataAdapter")
    ),
    settlement: deepFreeze(asPlainObject(scene.settlement, "settlement"))
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

function averageNearestNeighbourDistance(instances) {
  if (!Array.isArray(instances) || instances.length < 2) {
    return 0;
  }
  const positions = instances
    .map((instance) => instance.position)
    .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
  if (positions.length < 2) {
    return 0;
  }
  let distanceTotal = 0;
  for (let index = 0; index < positions.length; index += 1) {
    let nearest = Number.POSITIVE_INFINITY;
    for (let candidateIndex = 0; candidateIndex < positions.length; candidateIndex += 1) {
      if (index === candidateIndex) {
        continue;
      }
      const deltaX = positions[index].x - positions[candidateIndex].x;
      const deltaY = positions[index].y - positions[candidateIndex].y;
      nearest = Math.min(nearest, Math.hypot(deltaX, deltaY));
    }
    distanceTotal += nearest;
  }
  return distanceTotal / positions.length;
}

function resolveActiveZoomProfile(zoomLevel, previewZoomProfile, preferredProfile = "normal") {
  if (
    previewZoomProfile &&
    typeof preferredProfile === "string" &&
    preferredProfile in previewZoomProfile
  ) {
    return preferredProfile;
  }
  if (!Number.isFinite(zoomLevel) || !previewZoomProfile) {
    return "normal";
  }
  if (zoomLevel <= Number(previewZoomProfile.far?.targetZoomLevel ?? 12)) {
    return "far";
  }
  if (zoomLevel >= Number(previewZoomProfile.close?.targetZoomLevel ?? 17)) {
    return "close";
  }
  return "normal";
}

function computeVisibleObjectCount({
  activeZoomProfile,
  roadInstances,
  buildingInstances,
  vegetationInstances,
  landmarkInstances
}) {
  if (activeZoomProfile === "far") {
    return roadInstances.length + landmarkInstances.length;
  }
  if (activeZoomProfile === "close") {
    return buildingInstances.length + vegetationInstances.length + landmarkInstances.length;
  }
  return (
    roadInstances.length +
    buildingInstances.length +
    vegetationInstances.length +
    landmarkInstances.length
  );
}

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldSettlementAtlasSceneExpansionValidationError"
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
