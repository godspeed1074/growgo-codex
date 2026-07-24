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
    mapCenterCoordinate: deepFreeze({
      latitude: previewFoundation.coordinate.latitude,
      longitude: previewFoundation.coordinate.longitude
    }),
    coastlineFocusY: maxCoastY,
    previewVisibilityState: previewFoundation.previewScene.visibilityState
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
