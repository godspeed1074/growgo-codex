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
  "poiState",
  "poiContentMetadata",
  "poiLocationMetadata",
  "poiPresentationState",
  "interactionState",
  "detailState",
  "playerState",
  "playerInteractionState",
  "captureState",
  "capturePresentationState",
  "discoveryState",
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
  const poiState = createMapWorldSettlementPoiState({
    settlementScene
  });
  const poiContentMetadata = createMapWorldSettlementPoiContentMetadata({
    settlementScene,
    poiState
  });
  const poiLocationMetadata = createMapWorldSettlementPoiLocationMetadata({
    settlementScene,
    poiState,
    poiContentMetadata
  });
  const poiPresentationState = createMapWorldSettlementPoiPresentationState({
    settlementScene,
    poiState,
    poiContentMetadata,
    poiLocationMetadata
  });

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
    poiState,
    poiContentMetadata,
    poiLocationMetadata,
    poiPresentationState,
    interactionState: createMapWorldSettlementOverlayInteractionState({
      settlementScene,
      mapWorldLiveMapFoundation
    }),
    detailState: createMapWorldSettlementOverlayAssetDetailState({
      settlementScene,
      mapWorldLiveMapFoundation
    }),
    playerState: createMapWorldSettlementPlayerMapState({
      settlementScene,
      mapWorldLiveMapFoundation
    }),
    playerInteractionState: createMapWorldSettlementPlayerInteractionState({
      settlementScene,
      mapWorldLiveMapFoundation,
      playerState: createMapWorldSettlementPlayerMapState({
        settlementScene,
        mapWorldLiveMapFoundation
      })
    }),
    captureState: createMapWorldSettlementCaptureState({
      settlementScene,
      mapWorldLiveMapFoundation,
      playerState: createMapWorldSettlementPlayerMapState({
        settlementScene,
        mapWorldLiveMapFoundation
      })
    }),
    capturePresentationState: createMapWorldSettlementCapturePresentationState({
      settlementScene,
      captureState: createMapWorldSettlementCaptureState({
        settlementScene,
        mapWorldLiveMapFoundation,
        playerState: createMapWorldSettlementPlayerMapState({
          settlementScene,
          mapWorldLiveMapFoundation
        })
      })
    }),
    discoveryState: createMapWorldSettlementDiscoveryState({
      settlementScene,
      mapWorldLiveMapFoundation,
      playerState: createMapWorldSettlementPlayerMapState({
        settlementScene,
        mapWorldLiveMapFoundation
      })
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
      objectIdentityValid: true,
      poiIdentityValid: true,
      poiContentMetadataValid: true,
      poiLocationMetadataValid: true,
      poiPresentationStateValid: true,
      selectionPersistenceValid: true,
      cameraFocusValid: true,
      detailPreviewValid: true,
      playerPresenceValid: true,
      playerInteractionValid: true,
      captureInteractionValid: true,
      capturePresentationValid: true,
      discoveryValid: true,
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
    if (!overlay.validationResult.objectIdentityValid) {
      throw createValidationError(
        "object_identity_invalid",
        "Map world settlement real map overlay foundation objectIdentityValid must be true."
      );
    }
    if (!overlay.validationResult.poiIdentityValid) {
      throw createValidationError(
        "poi_identity_invalid",
        "Map world settlement real map overlay foundation poiIdentityValid must be true."
      );
    }
    if (!overlay.validationResult.poiContentMetadataValid) {
      throw createValidationError(
        "poi_content_metadata_invalid",
        "Map world settlement real map overlay foundation poiContentMetadataValid must be true."
      );
    }
    if (!overlay.validationResult.poiLocationMetadataValid) {
      throw createValidationError(
        "poi_location_metadata_invalid",
        "Map world settlement real map overlay foundation poiLocationMetadataValid must be true."
      );
    }
    if (!overlay.validationResult.poiPresentationStateValid) {
      throw createValidationError(
        "poi_presentation_state_invalid",
        "Map world settlement real map overlay foundation poiPresentationStateValid must be true."
      );
    }
    if (!overlay.validationResult.selectionPersistenceValid) {
      throw createValidationError(
        "selection_persistence_invalid",
        "Map world settlement real map overlay foundation selectionPersistenceValid must be true."
      );
    }
    if (!overlay.validationResult.cameraFocusValid) {
      throw createValidationError(
        "camera_focus_invalid",
        "Map world settlement real map overlay foundation cameraFocusValid must be true."
      );
    }
    if (!overlay.validationResult.detailPreviewValid) {
      throw createValidationError(
        "detail_preview_invalid",
        "Map world settlement real map overlay foundation detailPreviewValid must be true."
      );
    }
    if (!overlay.validationResult.playerPresenceValid) {
      throw createValidationError(
        "player_presence_invalid",
        "Map world settlement real map overlay foundation playerPresenceValid must be true."
      );
    }
    if (!overlay.validationResult.playerInteractionValid) {
      throw createValidationError(
        "player_interaction_invalid",
        "Map world settlement real map overlay foundation playerInteractionValid must be true."
      );
    }
    if (!overlay.validationResult.captureInteractionValid) {
      throw createValidationError(
        "capture_interaction_invalid",
        "Map world settlement real map overlay foundation captureInteractionValid must be true."
      );
    }
    if (!overlay.validationResult.discoveryValid) {
      throw createValidationError(
        "discovery_invalid",
        "Map world settlement real map overlay foundation discoveryValid must be true."
      );
    }
    if (!overlay.validationResult.mapVisibleUnderlayValid) {
      throw createValidationError(
        "map_visible_underlay_invalid",
        "Map world settlement real map overlay foundation mapVisibleUnderlayValid must be true."
      );
    }
    if (!overlay.validationResult.combinedViewReady) {
      throw createValidationError(
        "combined_view_not_ready",
        "Map world settlement real map overlay foundation combinedViewReady must be true."
      );
    }
    if (overlay.interactionState.interactionMode !== "map-overlay-selection") {
      throw createValidationError(
        "interaction_mode_invalid",
        "Map world settlement real map overlay foundation interaction mode must remain map-overlay-selection."
      );
    }
    if (
      overlay.poiState.validationResult.poiIdentityValid !== true ||
      overlay.poiState.validationResult.playerProximityValid !== true ||
      overlay.poiState.validationResult.deterministicPlacementValid !== true ||
      overlay.poiState.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "poi_state_invalid",
        "Map world settlement real map overlay foundation POI state must remain valid."
      );
    }
    if (
      overlay.poiContentMetadata.validationResult.poiIdentityValid !== true ||
      overlay.poiContentMetadata.validationResult.metadataConsistencyValid !== true ||
      overlay.poiContentMetadata.validationResult.deterministicOutputValid !== true ||
      overlay.poiContentMetadata.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "poi_content_metadata_state_invalid",
        "Map world settlement real map overlay foundation POI content metadata must remain valid."
      );
    }
    if (
      overlay.poiLocationMetadata.validationResult.coordinateConsistencyValid !== true ||
      overlay.poiLocationMetadata.validationResult.objectAlignmentValid !== true ||
      overlay.poiLocationMetadata.validationResult.deterministicPlacementValid !== true ||
      overlay.poiLocationMetadata.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "poi_location_metadata_state_invalid",
        "Map world settlement real map overlay foundation POI location metadata must remain valid."
      );
    }
    if (
      overlay.poiPresentationState.validationResult.poiIdentityValid !== true ||
      overlay.poiPresentationState.validationResult.zoomVisibilityValid !== true ||
      overlay.poiPresentationState.validationResult.selectionStateValid !== true ||
      overlay.poiPresentationState.validationResult.deterministicPresentationValid !== true ||
      overlay.poiPresentationState.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "poi_presentation_state_invalid",
        "Map world settlement real map overlay foundation POI presentation state must remain valid."
      );
    }
    if (
      overlay.detailState.validationResult.selectedAssetIdentityValid !== true ||
      overlay.detailState.validationResult.previewStateValid !== true ||
      overlay.detailState.validationResult.cleanupValid !== true ||
      overlay.detailState.validationResult.mapSynchronizationValid !== true
    ) {
      throw createValidationError(
        "detail_state_invalid",
        "Map world settlement real map overlay foundation detail preview state must remain valid."
      );
    }
    if (
      overlay.playerState.validationResult.coordinateConsistencyValid !== true ||
      overlay.playerState.validationResult.worldAlignmentValid !== true ||
      overlay.playerState.validationResult.cameraBehaviorValid !== true ||
      overlay.playerState.validationResult.cleanupValid !== true ||
      overlay.playerState.validationResult.deterministicPlacementValid !== true
    ) {
      throw createValidationError(
        "player_state_invalid",
        "Map world settlement real map overlay foundation player state must remain valid."
      );
    }
    if (
      overlay.playerInteractionState.validationResult.playerObjectAlignmentValid !== true ||
      overlay.playerInteractionState.validationResult.interactionDistanceValid !== true ||
      overlay.playerInteractionState.validationResult.objectIdentityValid !== true ||
      overlay.playerInteractionState.validationResult.cleanupValid !== true ||
      overlay.playerInteractionState.validationResult.deterministicBehaviourValid !== true
    ) {
      throw createValidationError(
        "player_interaction_state_invalid",
        "Map world settlement real map overlay foundation player interaction state must remain valid."
      );
    }
    if (
      overlay.captureState.validationResult.playerProximityValid !== true ||
      overlay.captureState.validationResult.targetIdentityValid !== true ||
      overlay.captureState.validationResult.deterministicCaptureResultValid !== true ||
      overlay.captureState.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "capture_state_invalid",
        "Map world settlement real map overlay foundation capture state must remain valid."
      );
    }
    if (
      overlay.capturePresentationState.validationResult.captureStateConsistencyValid !== true ||
      overlay.capturePresentationState.validationResult.presentationStateConsistencyValid !==
        true ||
      overlay.capturePresentationState.validationResult.cleanupValid !== true ||
      overlay.capturePresentationState.validationResult.deterministicDisplayValid !== true
    ) {
      throw createValidationError(
        "capture_presentation_state_invalid",
        "Map world settlement real map overlay foundation capture presentation state must remain valid."
      );
    }
    if (
      overlay.discoveryState.validationResult.playerProximityValid !== true ||
      overlay.discoveryState.validationResult.objectIdentityValid !== true ||
      overlay.discoveryState.validationResult.deterministicDiscoveryResultValid !== true ||
      overlay.discoveryState.validationResult.cleanupValid !== true
    ) {
      throw createValidationError(
        "discovery_state_invalid",
        "Map world settlement real map overlay foundation discovery state must remain valid."
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
    poiState: deepFreeze(asPlainObject(overlay.poiState, "poiState")),
    poiContentMetadata: deepFreeze(
      asPlainObject(overlay.poiContentMetadata, "poiContentMetadata")
    ),
    poiLocationMetadata: deepFreeze(
      asPlainObject(overlay.poiLocationMetadata, "poiLocationMetadata")
    ),
    poiPresentationState: deepFreeze(
      asPlainObject(overlay.poiPresentationState, "poiPresentationState")
    ),
    interactionState: deepFreeze(asPlainObject(overlay.interactionState, "interactionState")),
    detailState: deepFreeze(asPlainObject(overlay.detailState, "detailState")),
    playerState: deepFreeze(asPlainObject(overlay.playerState, "playerState")),
    playerInteractionState: deepFreeze(
      asPlainObject(overlay.playerInteractionState, "playerInteractionState")
    ),
    captureState: deepFreeze(asPlainObject(overlay.captureState, "captureState")),
    capturePresentationState: deepFreeze(
      asPlainObject(overlay.capturePresentationState, "capturePresentationState")
    ),
    discoveryState: deepFreeze(asPlainObject(overlay.discoveryState, "discoveryState")),
    cameraSync: deepFreeze(asPlainObject(overlay.cameraSync, "cameraSync")),
    validationResult: deepFreeze(asPlainObject(overlay.validationResult, "validationResult")),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(overlay.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    ),
    settlementScene: deepFreeze(asPlainObject(overlay.settlementScene, "settlementScene"))
  });
}

export function createMapWorldSettlementOverlayInteractionState({
  settlementScene,
  mapWorldLiveMapFoundation,
  selectedObject = null,
  hoveredObject = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const selectedResolved = resolveSelectableOverlayObject(selectableObjects, selectedObject);
  const hoveredResolved = resolveSelectableOverlayObject(selectableObjects, hoveredObject);

  const cameraFocusObject =
    selectedResolved ?? hoveredResolved ?? null;
  const focusPoint =
    cameraFocusObject?.position ??
    settlementScene.cameraProfile.focusPoint;

  return deepFreeze({
    selectedObject:
      selectedResolved == null
        ? null
        : deepFreeze({
            instanceId: selectedResolved.instanceId,
            assetId: selectedResolved.assetId,
            category: selectedResolved.category
          }),
    hoverState: deepFreeze({
      currentState: hoveredResolved ? "hovering" : "idle",
      hoveredObjectId: hoveredResolved?.instanceId ?? null,
      hoveredAssetId: hoveredResolved?.assetId ?? null
    }),
    interactionMode: "map-overlay-selection",
    cameraFocus: deepFreeze({
      currentState: cameraFocusObject ? "selected-object" : "world-anchor",
      targetAsset:
        cameraFocusObject?.assetId ?? settlementScene.cameraProfile.targetAsset,
      focusPoint: deepFreeze({ ...focusPoint }),
      synchronizedWithMap: true,
      mapCenterCoordinate: deepFreeze({
        ...mapWorldLiveMapFoundation.centerCoordinate
      })
    }),
    validationResult: deepFreeze({
      objectIdentityValid:
        selectedResolved == null ||
        selectableObjects.some((entry) => entry.instanceId === selectedResolved.instanceId),
      selectionPersistenceValid: true,
      cameraFocusValid:
        focusPoint != null &&
        Number.isFinite(focusPoint.x) &&
        Number.isFinite(focusPoint.y),
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
}

export function createMapWorldSettlementPoiState({
  settlementScene,
  targetObject = null,
  playerState = null,
  interactionState = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedTarget = resolveSelectableOverlayObject(selectableObjects, targetObject);
  const poiType = resolvedTarget?.poiType ?? null;
  const distance =
    resolvedTarget == null || playerState?.position == null
      ? null
      : Number(
          Math.hypot(
            resolvedTarget.position.x - playerState.position.x,
            resolvedTarget.position.y - playerState.position.y
          ).toFixed(3)
        );
  const withinPoiRange = distance == null || distance <= 84;
  const resolvedInteractionState =
    interactionState ??
    (resolvedTarget == null
      ? "poi-idle"
      : withinPoiRange
        ? "poi-resolved"
        : "poi-out-of-range");

  return deepFreeze({
    poiId:
      resolvedTarget == null
        ? `${settlementScene.sceneId}::poi::idle`
        : `${settlementScene.sceneId}::poi::${resolvedTarget.instanceId}`,
    assetId: resolvedTarget?.assetId ?? null,
    poiType,
    position: deepFreeze({
      ...(resolvedTarget?.position ?? settlementScene.cameraProfile.focusPoint)
    }),
    interactionState: resolvedInteractionState,
    validationResult: deepFreeze({
      poiIdentityValid:
        resolvedTarget == null ||
        selectableObjects.some((entry) => entry.instanceId === resolvedTarget.instanceId),
      playerProximityValid: withinPoiRange,
      deterministicPlacementValid: true,
      cleanupValid: true
    })
  });
}

const poiContentMetadataProfilesByAssetId = Object.freeze({
  LIGHTHOUSE_ISLAND_ROCKY_001: Object.freeze({
    title: "Rocky Point Lighthouse",
    description:
      "A coastal landmark lookout with strong visibility across the shoreline and nearby roads.",
    category: "landmark",
    interactionProfile: Object.freeze({
      mode: "viewpoint-inspect",
      rangeBand: "nearby",
      cameraBehavior: "focus-landmark"
    }),
    discoveryProfile: Object.freeze({
      mode: "landmark-discovery",
      persistence: "session",
      emphasis: "high-visibility"
    })
  }),
  BUILDING_COASTAL_COTTAGE_001: Object.freeze({
    title: "Coastal Cottage",
    description:
      "A small residential point of interest facing the local road network and settlement edge.",
    category: "building",
    interactionProfile: Object.freeze({
      mode: "residence-inspect",
      rangeBand: "nearby",
      cameraBehavior: "focus-building"
    }),
    discoveryProfile: Object.freeze({
      mode: "residential-discovery",
      persistence: "session",
      emphasis: "neighbourhood-anchor"
    })
  }),
  TREE_EUCALYPTUS_001: Object.freeze({
    title: "Eucalyptus Tree",
    description:
      "A native vegetation marker used to shape the coastal streetscape and green edges of the settlement.",
    category: "nature",
    interactionProfile: Object.freeze({
      mode: "nature-inspect",
      rangeBand: "nearby",
      cameraBehavior: "focus-nature"
    }),
    discoveryProfile: Object.freeze({
      mode: "nature-discovery",
      persistence: "session",
      emphasis: "environmental"
    })
  }),
  ROAD_COASTAL_001: Object.freeze({
    title: "Coastal Road",
    description:
      "A connected infrastructure corridor that organizes movement through the coastal neighbourhood.",
    category: "infrastructure",
    interactionProfile: Object.freeze({
      mode: "route-inspect",
      rangeBand: "adjacent",
      cameraBehavior: "focus-infrastructure"
    }),
    discoveryProfile: Object.freeze({
      mode: "infrastructure-discovery",
      persistence: "session",
      emphasis: "network-context"
    })
  })
});

export function createMapWorldSettlementPoiContentMetadata({
  settlementScene,
  poiState = null,
  targetObject = null
}) {
  const resolvedPoiState =
    poiState ??
    createMapWorldSettlementPoiState({
      settlementScene,
      targetObject
    });
  const profile = poiContentMetadataProfilesByAssetId[resolvedPoiState.assetId] ?? null;
  const title = profile?.title ?? null;
  const description = profile?.description ?? null;
  const category = profile?.category ?? resolvedPoiState.poiType ?? null;
  const interactionProfile = profile?.interactionProfile ?? null;
  const discoveryProfile = profile?.discoveryProfile ?? null;

  return deepFreeze({
    poiContentId:
      resolvedPoiState.poiId === `${settlementScene.sceneId}::poi::idle`
        ? `${settlementScene.sceneId}::poi-content::idle`
        : `${settlementScene.sceneId}::poi-content::${resolvedPoiState.poiId}`,
    poiId: resolvedPoiState.poiId,
    title,
    description,
    category,
    interactionProfile: interactionProfile ? deepFreeze({ ...interactionProfile }) : null,
    discoveryProfile: discoveryProfile ? deepFreeze({ ...discoveryProfile }) : null,
    validationResult: deepFreeze({
      poiIdentityValid:
        resolvedPoiState.assetId == null ||
        Object.prototype.hasOwnProperty.call(
          poiContentMetadataProfilesByAssetId,
          resolvedPoiState.assetId
        ),
      metadataConsistencyValid:
        resolvedPoiState.assetId == null ||
        (category === resolvedPoiState.poiType &&
          typeof title === "string" &&
          typeof description === "string"),
      deterministicOutputValid: true,
      cleanupValid: true
    })
  });
}

export function createMapWorldSettlementPoiLocationMetadata({
  settlementScene,
  poiState = null,
  poiContentMetadata = null,
  targetObject = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedPoiState =
    poiState ??
    createMapWorldSettlementPoiState({
      settlementScene,
      targetObject
    });
  const resolvedPoiContentMetadata =
    poiContentMetadata ??
    createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      poiState: resolvedPoiState,
      targetObject
    });
  const resolvedTarget =
    resolveSelectableOverlayObject(selectableObjects, targetObject) ??
    resolveSelectableOverlayObject(selectableObjects, resolvedPoiState.assetId);
  const bounds = resolveInstanceBounds(resolvedTarget);
  const position =
    resolvedTarget?.position == null
      ? null
      : deepFreeze({ ...resolvedTarget.position });
  const accessibility =
    resolvedTarget == null
      ? null
      : deepFreeze({
          zone:
            resolvedPoiContentMetadata.category === "landmark"
              ? "landmark-positioning"
              : resolvedPoiContentMetadata.category === "building"
                ? "building-footprint"
                : resolvedPoiContentMetadata.category === "nature"
                  ? "vegetation-placement-zone"
                  : "infrastructure-alignment",
          traversal:
            resolvedTarget.category === "road"
              ? "adjacent-only"
              : resolvedTarget.roadFacing
                ? "roadside-access"
                : "view-only",
          placementContext:
            resolvedTarget.validArea ??
            (resolvedTarget.category === "landmark"
              ? "coastline"
              : resolvedTarget.category === "vegetation"
                ? "vegetation-zone"
                : resolvedTarget.category === "road"
                  ? "road-corridor"
                  : "lot-footprint")
        });

  return deepFreeze({
    poiLocationId:
      resolvedPoiState.poiId === `${settlementScene.sceneId}::poi::idle`
        ? `${settlementScene.sceneId}::poi-location::idle`
        : `${settlementScene.sceneId}::poi-location::${resolvedPoiState.poiId}`,
    poiId: resolvedPoiState.poiId,
    worldId: settlementScene.worldId,
    position,
    bounds,
    orientation: resolvedTarget?.orientation ?? null,
    accessibility,
    validationResult: deepFreeze({
      coordinateConsistencyValid:
        position == null ||
        (Number.isFinite(position.x) &&
          Number.isFinite(position.y) &&
          bounds != null &&
          Number.isFinite(bounds.minX) &&
          Number.isFinite(bounds.minY) &&
          Number.isFinite(bounds.maxX) &&
          Number.isFinite(bounds.maxY)),
      objectAlignmentValid:
        resolvedTarget == null ||
        (resolvedPoiContentMetadata.poiId === resolvedPoiState.poiId &&
          typeof resolvedTarget.assetId === "string" &&
          resolvedTarget.assetId === resolvedPoiState.assetId &&
          (resolvedTarget.category !== "building" ||
            bounds?.shape === "footprint") &&
          (resolvedTarget.category !== "landmark" ||
            resolvedPoiContentMetadata.category === "landmark") &&
          (resolvedTarget.category !== "vegetation" ||
            accessibility?.zone === "vegetation-placement-zone") &&
          (resolvedTarget.category !== "road" ||
            accessibility?.zone === "infrastructure-alignment")),
      deterministicPlacementValid: true,
      cleanupValid: true
    })
  });
}

const poiCategoryPresentationProfiles = Object.freeze({
  landmark: Object.freeze({
    markerShape: "diamond",
    markerColor: "#D4534A",
    labelColor: "#6E1F1B",
    markerSize: 15
  }),
  building: Object.freeze({
    markerShape: "square",
    markerColor: "#3F6EA8",
    labelColor: "#183A63",
    markerSize: 12
  }),
  nature: Object.freeze({
    markerShape: "circle",
    markerColor: "#4D8A45",
    labelColor: "#214C1D",
    markerSize: 10
  }),
  infrastructure: Object.freeze({
    markerShape: "line",
    markerColor: "#6B7078",
    labelColor: "#2C3138",
    markerSize: 11
  })
});

const poiLabelVisibilityByZoomProfile = Object.freeze({
  far: Object.freeze(["landmark", "infrastructure"]),
  normal: Object.freeze(["landmark", "building"]),
  close: Object.freeze(["landmark", "building", "nature", "infrastructure"])
});

export function createMapWorldSettlementPoiPresentationState({
  settlementScene,
  poiState = null,
  poiContentMetadata = null,
  poiLocationMetadata = null,
  zoomProfile = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const activeZoomProfile =
    zoomProfile ??
    normalizePoiPresentationZoomProfile(
      settlementScene.visualScaling?.activeZoomProfile
    );
  const visibleLabelCategories =
    poiLabelVisibilityByZoomProfile[activeZoomProfile] ??
    poiLabelVisibilityByZoomProfile.normal;
  const resolvedPoiState =
    poiState ?? createMapWorldSettlementPoiState({ settlementScene });
  const resolvedPoiContentMetadata =
    poiContentMetadata ??
    createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      poiState: resolvedPoiState
    });
  const resolvedPoiLocationMetadata =
    poiLocationMetadata ??
    createMapWorldSettlementPoiLocationMetadata({
      settlementScene,
      poiState: resolvedPoiState,
      poiContentMetadata: resolvedPoiContentMetadata
    });
  const selectedPoiId = resolvedPoiState.assetId == null ? null : resolvedPoiState.poiId;

  const markers = selectableObjects.map((selectableObject) => {
    const locationMetadata = createMapWorldSettlementPoiLocationMetadata({
      settlementScene,
      targetObject: selectableObject
    });
    const contentMetadata = createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      targetObject: selectableObject
    });
    const profile =
      poiCategoryPresentationProfiles[contentMetadata.category] ??
      poiCategoryPresentationProfiles.infrastructure;
    const selected = locationMetadata.poiId === selectedPoiId;
    const visible = locationMetadata.position != null;
    const labelVisible =
      selected ||
      visibleLabelCategories.includes(contentMetadata.category ?? "infrastructure");
    return deepFreeze({
      poiId: locationMetadata.poiId,
      assetId: selectableObject.assetId,
      category: contentMetadata.category,
      position: locationMetadata.position,
      markerShape: profile.markerShape,
      markerColor: profile.markerColor,
      labelColor: profile.labelColor,
      markerSize: selected ? profile.markerSize + 4 : profile.markerSize,
      label: contentMetadata.title,
      selected,
      visible,
      labelVisible
    });
  });

  const visibleMarkers = markers.filter((marker) => marker.visible);
  const visibleLabels = markers.filter((marker) => marker.visible && marker.labelVisible);

  return deepFreeze({
    poiMarkerState: deepFreeze({
      activeMarkerId: selectedPoiId,
      markers: deepFreeze(markers),
      visibleMarkerCount: visibleMarkers.length
    }),
    selectedStyle: deepFreeze({
      currentState: selectedPoiId ? "selected-poi-emphasis" : "default-poi-style",
      poiId: selectedPoiId,
      accentColor:
        selectedPoiId != null
          ? resolvedPoiContentMetadata.category === "landmark"
            ? "#FFF2A8"
            : "#FFF7D6"
          : null,
      haloRadius:
        selectedPoiId != null
          ? Number(
              ((visibleMarkers.find((marker) => marker.poiId === selectedPoiId)?.markerSize ?? 12) + 6)
                .toFixed(2)
            )
          : 0
    }),
    labelState: deepFreeze({
      zoomProfile: activeZoomProfile,
      visiblePoiIds: deepFreeze(visibleLabels.map((marker) => marker.poiId)),
      selectedLabelId: selectedPoiId
    }),
    visibilityState: deepFreeze({
      currentState: visibleMarkers.length > 0 ? "visible" : "hidden",
      visibleMarkerCount: visibleMarkers.length,
      visibleLabelCount: visibleLabels.length,
      mapLayerVisible: visibleMarkers.length > 0
    }),
    validationResult: deepFreeze({
      poiIdentityValid: markers.every(
        (marker) =>
          typeof marker.poiId === "string" &&
          typeof marker.assetId === "string" &&
          typeof marker.category === "string"
      ),
      zoomVisibilityValid:
        visibleLabels.every(
          (marker) =>
            marker.selected === true ||
            visibleLabelCategories.includes(marker.category)
        ) && ["far", "normal", "close"].includes(activeZoomProfile),
      selectionStateValid:
        selectedPoiId == null ||
        markers.some((marker) => marker.poiId === selectedPoiId && marker.selected === true),
      deterministicPresentationValid:
        resolvedPoiLocationMetadata.worldId === settlementScene.worldId,
      cleanupValid: true
    })
  });
}

export function createMapWorldSettlementOverlayAssetDetailState({
  settlementScene,
  mapWorldLiveMapFoundation,
  selectedObject = null,
  detailState = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const selectedResolved = resolveSelectableOverlayObject(selectableObjects, selectedObject);
  const selectedAssetId = selectedResolved?.assetId ?? null;
  const resolvedState =
    detailState ??
    (selectedResolved ? "focused-detail-preview" : "map-overview");
  const assetType = selectedResolved?.category ?? null;
  const cameraProfile = deepFreeze({
    currentState: selectedResolved ? "detail-focused" : "world-anchor",
    targetAsset: selectedAssetId,
    focusPoint: deepFreeze({
      ...(selectedResolved?.position ?? settlementScene.cameraProfile.focusPoint)
    }),
    synchronizedWithMap: true,
    mapCenterCoordinate: deepFreeze({
      ...mapWorldLiveMapFoundation.centerCoordinate
    }),
    previewCameraProfile: settlementScene.cameraProfile.cameraProfile
  });

  return deepFreeze({
    detailPreviewId:
      selectedResolved == null
        ? `${settlementScene.sceneId}::detail-preview::idle`
        : `${settlementScene.sceneId}::detail-preview::${selectedResolved.instanceId}`,
    selectedObjectId: selectedResolved?.instanceId ?? null,
    assetId: selectedAssetId,
    assetType,
    cameraProfile,
    detailState: resolvedState,
    validationResult: deepFreeze({
      selectedAssetIdentityValid:
        selectedResolved == null ||
        selectableObjects.some((entry) => entry.instanceId === selectedResolved.instanceId),
      previewStateValid: [
        "map-overview",
        "focused-detail-preview",
        "returning-to-map-view"
      ].includes(resolvedState),
      cleanupValid: true,
      mapSynchronizationValid:
        cameraProfile.synchronizedWithMap === true &&
        Number.isFinite(cameraProfile.mapCenterCoordinate.latitude) &&
        Number.isFinite(cameraProfile.mapCenterCoordinate.longitude)
    })
  });
}

export function createMapWorldSettlementPlayerMapState({
  settlementScene,
  mapWorldLiveMapFoundation,
  focusMode = "world-overview"
}) {
  const playerSeed = stableOverlayNumericHash(
    `${settlementScene.worldId}::${settlementScene.sceneId}::player`
  );
  const offsetX = ((playerSeed % 19) - 9) * 4;
  const offsetY = (((Math.floor(playerSeed / 19)) % 19) - 9) * 3;
  const latitudeOffset = Number((((playerSeed % 11) - 5) * 0.000018).toFixed(6));
  const longitudeOffset = Number(((((Math.floor(playerSeed / 11)) % 11) - 5) * 0.000018).toFixed(6));
  const coordinate = deepFreeze({
    latitude: Number(
      (mapWorldLiveMapFoundation.centerCoordinate.latitude + latitudeOffset).toFixed(6)
    ),
    longitude: Number(
      (mapWorldLiveMapFoundation.centerCoordinate.longitude + longitudeOffset).toFixed(6)
    )
  });
  const position = deepFreeze({
    x: Number((settlementScene.cameraProfile.focusPoint.x + offsetX).toFixed(3)),
    y: Number((settlementScene.cameraProfile.focusPoint.y + offsetY).toFixed(3))
  });
  const resolvedFocusMode =
    focusMode === "player-focused" ? "player-focused" : "world-overview";

  return deepFreeze({
    playerId: `PLAYER_MAP_${playerSeed}`,
    coordinate,
    worldId: settlementScene.worldId,
    position,
    visibilityState:
      resolvedFocusMode === "player-focused" ? "player-focused" : "world-visible",
    cameraFocus: deepFreeze({
      currentState: resolvedFocusMode,
      focusPoint: deepFreeze(
        resolvedFocusMode === "player-focused"
          ? { ...position }
          : { ...settlementScene.cameraProfile.focusPoint }
      ),
      targetAsset:
        resolvedFocusMode === "player-focused"
          ? "PLAYER_MARKER"
          : settlementScene.cameraProfile.targetAsset,
      synchronizedWithMap: true
    }),
    mapMarkerOffset: deepFreeze({
      x: ((playerSeed % 7) - 3) * 12,
      y: (((Math.floor(playerSeed / 7)) % 7) - 3) * 10
    }),
    validationResult: deepFreeze({
      coordinateConsistencyValid:
        Number.isFinite(coordinate.latitude) &&
        Number.isFinite(coordinate.longitude),
      worldAlignmentValid:
        settlementScene.worldId === mapWorldLiveMapFoundation.activeWorldId,
      cameraBehaviorValid:
        Number.isFinite(position.x) &&
        Number.isFinite(position.y) &&
        ["world-overview", "player-focused"].includes(resolvedFocusMode),
      cleanupValid: true,
      deterministicPlacementValid: true
    })
  });
}

export function createMapWorldSettlementPlayerInteractionState({
  settlementScene,
  mapWorldLiveMapFoundation,
  playerState,
  targetObject = null,
  interactionState = null
}) {
  const poiState = createMapWorldSettlementPoiState({
    settlementScene,
    targetObject,
    playerState
  });
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedTarget = resolveSelectableOverlayObject(selectableObjects, targetObject);
  const distance = poiState.validationResult.playerProximityValid
    ? resolvedTarget == null || playerState?.position == null
      ? null
      : Number(
          Math.hypot(
            resolvedTarget.position.x - playerState.position.x,
            resolvedTarget.position.y - playerState.position.y
          ).toFixed(3)
        )
    : null;
  const withinRange = distance != null && distance <= 72;
  const resolvedInteractionState =
    interactionState ??
    (resolvedTarget == null
      ? "world-idle"
      : withinRange
        ? "object-interaction-ready"
        : "object-out-of-range");

  return deepFreeze({
    interactionId:
      resolvedTarget == null
        ? `${settlementScene.sceneId}::player-interaction::idle`
        : `${settlementScene.sceneId}::player-interaction::${playerState.playerId}::${resolvedTarget.instanceId}`,
    playerId: playerState.playerId,
    targetObjectId: resolvedTarget?.instanceId ?? null,
    targetAssetId: resolvedTarget?.assetId ?? null,
    interactionState: resolvedInteractionState,
    interactionDistance: distance,
    validationResult: deepFreeze({
      playerObjectAlignmentValid:
        resolvedTarget == null ||
        settlementScene.worldId === mapWorldLiveMapFoundation.activeWorldId,
      interactionDistanceValid:
        resolvedTarget == null ||
        (poiState.validationResult.playerProximityValid === true && withinRange),
      objectIdentityValid:
        resolvedTarget == null ||
        selectableObjects.some((entry) => entry.instanceId === resolvedTarget.instanceId) &&
        poiState.validationResult.poiIdentityValid === true,
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
}

export function createMapWorldSettlementCaptureState({
  settlementScene,
  mapWorldLiveMapFoundation,
  playerState = null,
  targetObject = null,
  capturedObjectIds = []
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedPlayerState =
    playerState ??
    createMapWorldSettlementPlayerMapState({
      settlementScene,
      mapWorldLiveMapFoundation,
      focusMode: "player-focused"
    });
  const resolvedTarget = resolveSelectableOverlayObject(selectableObjects, targetObject);
  const sessionCapturedIds = deepFreeze(
    [...new Set(
      Array.isArray(capturedObjectIds)
        ? capturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  const captureDistance =
    resolvedTarget?.position == null
      ? null
      : Number(
          Math.hypot(
            resolvedTarget.position.x - resolvedPlayerState.position.x,
            resolvedTarget.position.y - resolvedPlayerState.position.y
          ).toFixed(3)
        );
  const withinCaptureRange =
    captureDistance != null && captureDistance <= 72;
  const alreadyCaptured =
    resolvedTarget != null &&
    sessionCapturedIds.includes(String(resolvedTarget.instanceId));
  const nextCapturedObjectIds =
    resolvedTarget != null && withinCaptureRange && !alreadyCaptured
      ? deepFreeze([...new Set([
          ...sessionCapturedIds,
          String(resolvedTarget.instanceId)
        ])].sort())
      : sessionCapturedIds;
  const capturedThisSession =
    resolvedTarget != null &&
    nextCapturedObjectIds.includes(String(resolvedTarget.instanceId));

  return deepFreeze({
    captureId:
      resolvedTarget == null
        ? `${settlementScene.sceneId}::capture::idle`
        : `${settlementScene.sceneId}::capture::${resolvedPlayerState.playerId}::${resolvedTarget.instanceId}`,
    playerId: resolvedPlayerState.playerId,
    targetObjectId: resolvedTarget?.instanceId ?? null,
    targetAssetId: resolvedTarget?.assetId ?? null,
    captureState:
      resolvedTarget == null
        ? "capture-idle"
        : capturedThisSession
          ? "captured-session"
          : withinCaptureRange
            ? "capture-ready"
            : "capture-out-of-range",
    captureDistance,
    captureRange: 72,
    captureAnimationState:
      resolvedTarget == null
        ? "capture-animation-idle"
        : capturedThisSession
          ? "capture-placeholder-pulse"
          : withinCaptureRange
            ? "capture-placeholder-armed"
            : "capture-placeholder-blocked",
    capturedObjectIds: nextCapturedObjectIds,
    validationResult: deepFreeze({
      playerProximityValid: resolvedTarget == null || withinCaptureRange || !capturedThisSession,
      targetIdentityValid:
        resolvedTarget == null ||
        selectableObjects.some((entry) => entry.instanceId === resolvedTarget.instanceId),
      deterministicCaptureResultValid:
        resolvedTarget == null ||
        settlementScene.worldId === resolvedPlayerState.worldId,
      cleanupValid: true
    })
  });
}

export function createMapWorldSettlementCapturePresentationState({
  settlementScene,
  captureState = null
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedCaptureState =
    captureState ??
    createMapWorldSettlementCaptureState({
      settlementScene,
      mapWorldLiveMapFoundation: {
        activeWorldId: settlementScene.worldId
      },
      playerState: {
        playerId: "PLAYER_CAPTURE_PRESENTATION_DEFAULT",
        worldId: settlementScene.worldId,
        position: { x: 0, y: 0 }
      }
    });
  const resolvedTarget = resolveSelectableOverlayObject(
    selectableObjects,
    resolvedCaptureState.targetObjectId ?? resolvedCaptureState.targetAssetId ?? null
  );
  const capturedObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(resolvedCaptureState.capturedObjectIds)
        ? resolvedCaptureState.capturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  const capturedCount = capturedObjectIds.length;
  const captureEffectState =
    resolvedCaptureState.captureState === "captured-session"
      ? "capture-highlight-active"
      : resolvedCaptureState.captureState === "capture-ready"
        ? "capture-highlight-armed"
        : resolvedCaptureState.captureState === "capture-out-of-range"
          ? "capture-highlight-blocked"
          : "capture-highlight-idle";
  const markerState = deepFreeze({
    currentState:
      capturedCount > 0
        ? "captured-marker-visible"
        : resolvedTarget != null
          ? "capture-target-marker-visible"
          : "capture-marker-hidden",
    targetObjectId: resolvedTarget?.instanceId ?? null,
    targetAssetId: resolvedTarget?.assetId ?? null,
    capturedObjectIds,
    capturedObjectCount: capturedCount,
    markerIcon:
      resolvedCaptureState.captureState === "captured-session"
        ? "captured-poi-marker"
        : resolvedCaptureState.captureState === "capture-ready"
          ? "capture-ready-ring"
          : resolvedCaptureState.captureState === "capture-out-of-range"
            ? "capture-blocked-ring"
            : "capture-idle-ring",
    markerColor:
      resolvedCaptureState.captureState === "captured-session"
        ? "#F2C94C"
        : resolvedCaptureState.captureState === "capture-ready"
          ? "#49B675"
          : resolvedCaptureState.captureState === "capture-out-of-range"
            ? "#A94A4A"
            : "#7D8B9A"
  });

  return deepFreeze({
    capturePresentationId:
      resolvedTarget == null
        ? `${settlementScene.sceneId}::capture-presentation::idle`
        : `${settlementScene.sceneId}::capture-presentation::${resolvedTarget.instanceId}`,
    targetObjectId: resolvedTarget?.instanceId ?? null,
    captureEffectState,
    markerState,
    validationResult: deepFreeze({
      captureStateConsistencyValid:
        resolvedCaptureState.targetObjectId == null ||
        resolvedTarget?.instanceId === resolvedCaptureState.targetObjectId,
      presentationStateConsistencyValid:
        markerState.capturedObjectCount === markerState.capturedObjectIds.length &&
        (resolvedCaptureState.captureState !== "captured-session" ||
          markerState.currentState === "captured-marker-visible"),
      cleanupValid: true,
      deterministicDisplayValid: true
    })
  });
}

export function createMapWorldSettlementDiscoveryState({
  settlementScene,
  mapWorldLiveMapFoundation,
  playerState,
  targetObject = null,
  discoveryState = null,
  discoveredObjectIds = []
}) {
  const selectableObjects = collectSelectableOverlayObjects(settlementScene);
  const resolvedTarget = resolveSelectableOverlayObject(selectableObjects, targetObject);
  const poiState = createMapWorldSettlementPoiState({
    settlementScene,
    targetObject,
    playerState
  });
  const discoveredIds = new Set(
    Array.isArray(discoveredObjectIds)
      ? discoveredObjectIds.map((value) => String(value))
      : []
  );
  const distance =
    resolvedTarget == null || playerState?.position == null
      ? null
      : Number(
          Math.hypot(
            resolvedTarget.position.x - playerState.position.x,
            resolvedTarget.position.y - playerState.position.y
          ).toFixed(3)
        );
  const withinDiscoveryRange =
    poiState.validationResult.playerProximityValid === true &&
    distance != null &&
    distance <= 84;
  const alreadyDiscovered =
    resolvedTarget != null && discoveredIds.has(String(resolvedTarget.instanceId));
  const resolvedDiscoveryState =
    discoveryState ??
    (resolvedTarget == null
      ? "discovery-idle"
      : alreadyDiscovered
        ? "discovered-persistent"
        : withinDiscoveryRange
          ? "discovered-nearby"
          : "discovery-out-of-range");
  const nextDiscoveredObjectIds =
    resolvedTarget != null && withinDiscoveryRange
      ? deepFreeze(
          [...new Set([...discoveredIds, String(resolvedTarget.instanceId)])].sort()
        )
      : deepFreeze([...discoveredIds].sort());

  return deepFreeze({
    discoveryId:
      resolvedTarget == null
        ? `${settlementScene.sceneId}::discovery::idle`
        : `${settlementScene.sceneId}::discovery::${playerState.playerId}::${resolvedTarget.instanceId}`,
    playerId: playerState.playerId,
    objectId: resolvedTarget?.instanceId ?? null,
    assetId: resolvedTarget?.assetId ?? null,
    discoveryState: resolvedDiscoveryState,
    discoveredObjectIds: nextDiscoveredObjectIds,
    discoveryDistance: distance,
    cameraFocus: deepFreeze({
      currentState:
        resolvedTarget != null && withinDiscoveryRange
          ? "discovery-focused"
          : "world-overview",
      focusPoint: deepFreeze(
        resolvedTarget != null && withinDiscoveryRange
          ? { ...resolvedTarget.position }
          : { ...settlementScene.cameraProfile.focusPoint }
      ),
      targetAsset:
        resolvedTarget != null && withinDiscoveryRange
          ? resolvedTarget.assetId
          : settlementScene.cameraProfile.targetAsset,
      synchronizedWithMap: true
    }),
    validationResult: deepFreeze({
      playerProximityValid: resolvedTarget == null || withinDiscoveryRange,
      objectIdentityValid:
        resolvedTarget == null ||
        selectableObjects.some((entry) => entry.instanceId === resolvedTarget.instanceId) &&
        poiState.validationResult.poiIdentityValid === true,
      deterministicDiscoveryResultValid: true,
      cleanupValid: true
    })
  });
}

function stableOverlayNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function collectSelectableOverlayObjects(settlementScene) {
  return deepFreeze([
    ...collectSelectablePlacements(settlementScene.roadInstances, "road"),
    ...collectSelectablePlacements(settlementScene.buildingInstances, "building"),
    ...collectSelectablePlacements(settlementScene.vegetationInstances, "vegetation"),
    ...collectSelectablePlacements(settlementScene.landmarkInstances, "landmark")
  ]);
}

function collectSelectablePlacements(instances, category) {
  return (instances ?? [])
    .filter((instance) =>
      [
        "BUILDING_COASTAL_COTTAGE_001",
        "TREE_EUCALYPTUS_001",
        "ROAD_COASTAL_001",
        "LIGHTHOUSE_ISLAND_ROCKY_001"
      ].includes(instance.assetId)
    )
    .map((instance) =>
      deepFreeze({
        instanceId: instance.instanceId,
        assetId: instance.assetId,
        category,
        poiType: resolvePoiType(category),
        position: resolveInstancePosition(instance),
        bounds: resolveInstanceBounds(instance),
        orientation: instance.orientation ?? null,
        footprint: instance.footprint ? deepFreeze({ ...instance.footprint }) : null,
        roadFacing: Boolean(instance.roadFacing),
        validArea: instance.validArea ?? null,
        start:
          instance.start != null ? deepFreeze({ ...instance.start }) : null,
        end:
          instance.end != null ? deepFreeze({ ...instance.end }) : null,
        width:
          Number.isFinite(instance.width) ? Number(instance.width) : null
      })
    );
}

function resolvePoiType(category) {
  if (category === "landmark") {
    return "landmark";
  }
  if (category === "building") {
    return "building";
  }
  if (category === "vegetation") {
    return "nature";
  }
  return "infrastructure";
}

function resolveSelectableOverlayObject(selectableObjects, candidate) {
  if (candidate == null) {
    return null;
  }
  if (typeof candidate === "string") {
    return (
      selectableObjects.find((entry) => entry.instanceId === candidate) ??
      selectableObjects.find((entry) => entry.assetId === candidate) ??
      null
    );
  }
  if (typeof candidate === "object") {
    if (typeof candidate.instanceId === "string") {
      return (
        selectableObjects.find((entry) => entry.instanceId === candidate.instanceId) ??
        null
      );
    }
    if (typeof candidate.assetId === "string") {
      return (
        selectableObjects.find((entry) => entry.assetId === candidate.assetId) ??
        null
      );
    }
  }
  return null;
}

function normalizePoiPresentationZoomProfile(value) {
  if (value === "far" || value === "close") {
    return value;
  }
  return "normal";
}

function resolveInstancePosition(instance) {
  if (instance?.position && Number.isFinite(instance.position.x) && Number.isFinite(instance.position.y)) {
    return deepFreeze({ ...instance.position });
  }
  if (instance?.start && instance?.end) {
    return deepFreeze({
      x: (Number(instance.start.x) + Number(instance.end.x)) / 2,
      y: (Number(instance.start.y) + Number(instance.end.y)) / 2
    });
  }
  return deepFreeze({ x: 0, y: 0 });
}

function resolveInstanceBounds(instance) {
  if (
    instance?.footprint &&
    Number.isFinite(instance.footprint.x) &&
    Number.isFinite(instance.footprint.y) &&
    Number.isFinite(instance.footprint.width) &&
    Number.isFinite(instance.footprint.height)
  ) {
    const minX = Number(instance.footprint.x.toFixed(3));
    const minY = Number(instance.footprint.y.toFixed(3));
    const maxX = Number((instance.footprint.x + instance.footprint.width).toFixed(3));
    const maxY = Number((instance.footprint.y + instance.footprint.height).toFixed(3));
    return deepFreeze({
      minX,
      minY,
      maxX,
      maxY,
      width: Number(instance.footprint.width.toFixed(3)),
      height: Number(instance.footprint.height.toFixed(3)),
      shape: "footprint"
    });
  }
  if (
    instance?.start &&
    instance?.end &&
    Number.isFinite(instance.start.x) &&
    Number.isFinite(instance.start.y) &&
    Number.isFinite(instance.end.x) &&
    Number.isFinite(instance.end.y)
  ) {
    const halfWidth = Number.isFinite(instance.width) ? Number(instance.width) / 2 : 6;
    const minX = Number((Math.min(instance.start.x, instance.end.x) - halfWidth).toFixed(3));
    const minY = Number((Math.min(instance.start.y, instance.end.y) - halfWidth).toFixed(3));
    const maxX = Number((Math.max(instance.start.x, instance.end.x) + halfWidth).toFixed(3));
    const maxY = Number((Math.max(instance.start.y, instance.end.y) + halfWidth).toFixed(3));
    return deepFreeze({
      minX,
      minY,
      maxX,
      maxY,
      width: Number((maxX - minX).toFixed(3)),
      height: Number((maxY - minY).toFixed(3)),
      shape: "corridor"
    });
  }
  if (
    instance?.position &&
    Number.isFinite(instance.position.x) &&
    Number.isFinite(instance.position.y)
  ) {
    return deepFreeze({
      minX: Number((instance.position.x - 6).toFixed(3)),
      minY: Number((instance.position.y - 6).toFixed(3)),
      maxX: Number((instance.position.x + 6).toFixed(3)),
      maxY: Number((instance.position.y + 6).toFixed(3)),
      width: 12,
      height: 12,
      shape: "point-radius"
    });
  }
  return null;
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
