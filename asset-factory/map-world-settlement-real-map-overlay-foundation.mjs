import {
  createMapWorldLiveMapFoundation,
  mapWorldLiveMapFoundationDefinition,
  validateMapWorldLiveMapFoundation
} from "./map-world-live-map-foundation.mjs";
import {
  createMapWorldSettlementAtlasSceneExpansion,
  mapWorldSettlementAtlasSceneExpansionDefinition,
  validateMapWorldSettlementAtlasSceneExpansion
} from "./map-world-settlement-atlas-scene-expansion.mjs";
import {
  validateMapWorldVisualLayerAttachment
} from "./map-world-visual-layer-attachment.mjs";

export const mapWorldSettlementRealMapOverlayFoundationRequiredFields = Object.freeze([
  "overlayId",
  "worldId",
  "sceneId",
  "mapBaseLayer",
  "settlementLayer",
  "alignmentState",
  "cameraSync",
  "validationResult"
]);

export const mapWorldSettlementRealMapOverlayFoundationDefinition = deepFreeze({
  ...mapWorldLiveMapFoundationDefinition,
  ...mapWorldSettlementAtlasSceneExpansionDefinition
});

export async function createMapWorldSettlementRealMapOverlayFoundation(
  rawDefinition = mapWorldSettlementRealMapOverlayFoundationDefinition,
  options = {}
) {
  const mapWorldLiveMapFoundation = await createMapWorldLiveMapFoundation(
    rawDefinition,
    options
  );
  const settlementScene = await createMapWorldSettlementAtlasSceneExpansion(
    rawDefinition,
    options
  );

  return buildMapWorldSettlementRealMapOverlayFoundation({
    mapWorldLiveMapFoundation,
    settlementScene
  });
}

export function buildMapWorldSettlementRealMapOverlayFoundation({
  mapWorldLiveMapFoundation,
  settlementScene
}) {
  const overlay = deepFreeze({
    overlayId: createOverlayId(
      mapWorldLiveMapFoundation.activeWorldId,
      settlementScene.sceneId,
      mapWorldLiveMapFoundation.zoomLevel
    ),
    worldId: mapWorldLiveMapFoundation.activeWorldId,
    sceneId: settlementScene.sceneId,
    mapBaseLayer: deepFreeze({
      mapInstanceId: mapWorldLiveMapFoundation.mapInstanceId,
      mapId: mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.mapId,
      centerCoordinate: deepFreeze({
        ...mapWorldLiveMapFoundation.centerCoordinate
      }),
      zoomLevel: mapWorldLiveMapFoundation.zoomLevel,
      bounds: deepFreeze({
        ...mapWorldLiveMapFoundation.bounds
      }),
      visibleUnderlay: true,
      interactionMode: "interactive-map-underlay"
    }),
    settlementLayer: deepFreeze({
      layerId: mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.layerId,
      worldId: settlementScene.worldId,
      sceneId: settlementScene.sceneId,
      sourceType: "expanded-settlement-scene",
      anchorCoordinate: deepFreeze({
        ...mapWorldLiveMapFoundation.centerCoordinate
      }),
      opacity: 0.68,
      objectInstanceCount:
        settlementScene.roadInstances.length +
        settlementScene.buildingInstances.length +
        settlementScene.vegetationInstances.length +
        settlementScene.landmarkInstances.length,
      mapVisibleUnderneath: true
    }),
    alignmentState: deepFreeze({
      coordinateAlignmentValid:
        settlementScene.cameraProfile.mapCenterCoordinate.latitude ===
          mapWorldLiveMapFoundation.centerCoordinate.latitude &&
        settlementScene.cameraProfile.mapCenterCoordinate.longitude ===
          mapWorldLiveMapFoundation.centerCoordinate.longitude,
      zoomConsistencyValid:
        settlementScene.cameraProfile.zoomLevel ===
        mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.cameraState.previewZoomLevel,
      worldIdentityValid:
        settlementScene.worldId === mapWorldLiveMapFoundation.activeWorldId &&
        settlementScene.worldId ===
          mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.worldId,
      cleanupSynchronized:
        mapWorldLiveMapFoundation.validationResult.cleanupPreserved === true &&
        mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.visibilityState
          .cleanupOnHideSupported === true,
      deterministicPlacementValid:
        settlementScene.validationResult.deterministicSceneOutputValid === true,
      overlayMode: "map-and-settlement-combined-view"
    }),
    cameraSync: deepFreeze({
      synchronized: true,
      mapZoomLevel: mapWorldLiveMapFoundation.zoomLevel,
      settlementZoomProfile: settlementScene.visualScaling.activeZoomProfile,
      previewCameraProfile: settlementScene.cameraProfile.cameraProfile,
      focusAssetId: settlementScene.cameraProfile.focusAssetId,
      targetAsset: settlementScene.cameraProfile.targetAsset,
      compositionProfile: settlementScene.cameraProfile.activeCompositionProfile,
      movementMode: "shared-map-center"
    }),
    validationResult: deepFreeze({
      coordinateAlignmentValid:
        settlementScene.cameraProfile.mapCenterCoordinate.latitude ===
          mapWorldLiveMapFoundation.centerCoordinate.latitude &&
        settlementScene.cameraProfile.mapCenterCoordinate.longitude ===
          mapWorldLiveMapFoundation.centerCoordinate.longitude,
      zoomConsistencyValid:
        settlementScene.cameraProfile.zoomLevel ===
        mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.cameraState.previewZoomLevel,
      worldIdentityValid:
        settlementScene.worldId === mapWorldLiveMapFoundation.activeWorldId,
      cleanupValid:
        mapWorldLiveMapFoundation.validationResult.cleanupPreserved === true &&
        mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.validationResult.cleanupValid ===
          true,
      deterministicPlacementValid:
        settlementScene.validationResult.deterministicSceneOutputValid === true,
      mapVisibleUnderlayValid: true,
      combinedViewReady: true
    }),
    mapWorldLiveMapFoundation,
    settlementScene
  });

  const validation = validateMapWorldSettlementRealMapOverlayFoundation(overlay);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return overlay;
}

export function validateMapWorldSettlementRealMapOverlayFoundation(rawOverlay) {
  try {
    const overlay = normalizeOverlay(rawOverlay);
    const liveMapValidation = validateMapWorldLiveMapFoundation(
      overlay.mapWorldLiveMapFoundation
    );
    if (!liveMapValidation.ok) {
      throw createValidationError(
        liveMapValidation.errorCode ?? "live_map_invalid",
        liveMapValidation.message ??
          "Map world settlement real map overlay foundation requires a valid live map foundation."
      );
    }

    const sceneValidation = validateMapWorldSettlementAtlasSceneExpansion(
      overlay.settlementScene
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "settlement_scene_invalid",
        sceneValidation.message ??
          "Map world settlement real map overlay foundation requires a valid settlement scene."
      );
    }

    const visualLayerValidation = validateMapWorldVisualLayerAttachment(
      overlay.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment
    );
    if (!visualLayerValidation.ok) {
      throw createValidationError(
        visualLayerValidation.errorCode ?? "visual_layer_invalid",
        visualLayerValidation.message ??
          "Map world settlement real map overlay foundation requires a valid visual layer attachment."
      );
    }

    if (!overlay.validationResult.coordinateAlignmentValid) {
      throw createValidationError(
        "coordinate_alignment_invalid",
        "Map world settlement real map overlay foundation coordinateAlignmentValid must be true."
      );
    }
    if (!overlay.validationResult.zoomConsistencyValid) {
      throw createValidationError(
        "zoom_consistency_invalid",
        "Map world settlement real map overlay foundation zoomConsistencyValid must be true."
      );
    }
    if (!overlay.validationResult.worldIdentityValid) {
      throw createValidationError(
        "world_identity_invalid",
        "Map world settlement real map overlay foundation worldIdentityValid must be true."
      );
    }
    if (!overlay.validationResult.cleanupValid) {
      throw createValidationError(
        "cleanup_invalid",
        "Map world settlement real map overlay foundation cleanupValid must be true."
      );
    }
    if (!overlay.validationResult.deterministicPlacementValid) {
      throw createValidationError(
        "deterministic_placement_invalid",
        "Map world settlement real map overlay foundation deterministicPlacementValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldSettlementRealMapOverlayFoundation: overlay
    });
  } catch (error) {
    if (error?.name !== "MapWorldSettlementRealMapOverlayFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldSettlementRealMapOverlayFoundation: null
    });
  }
}

function normalizeOverlay(rawOverlay) {
  const overlay = asPlainObject(rawOverlay, "mapWorldSettlementRealMapOverlayFoundation");
  for (const fieldName of mapWorldSettlementRealMapOverlayFoundationRequiredFields) {
    if (!(fieldName in overlay)) {
      throw createValidationError(
        "missing_required_field",
        `Map world settlement real map overlay foundation is missing ${fieldName}.`
      );
    }
  }
  return deepFreeze({
    overlayId: normalizeString(overlay.overlayId, "overlayId"),
    worldId: normalizeString(overlay.worldId, "worldId"),
    sceneId: normalizeString(overlay.sceneId, "sceneId"),
    mapBaseLayer: deepFreeze(asPlainObject(overlay.mapBaseLayer, "mapBaseLayer")),
    settlementLayer: deepFreeze(asPlainObject(overlay.settlementLayer, "settlementLayer")),
    alignmentState: deepFreeze(asPlainObject(overlay.alignmentState, "alignmentState")),
    cameraSync: deepFreeze(asPlainObject(overlay.cameraSync, "cameraSync")),
    validationResult: deepFreeze(asPlainObject(overlay.validationResult, "validationResult")),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(overlay.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    ),
    settlementScene: deepFreeze(asPlainObject(overlay.settlementScene, "settlementScene"))
  });
}

function createOverlayId(worldId, sceneId, zoomLevel) {
  const hash = stableHash(`${worldId}::${sceneId}::${zoomLevel}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_SETTLEMENT_OVERLAY_${hash}`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldSettlementRealMapOverlayFoundationValidationError"
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
