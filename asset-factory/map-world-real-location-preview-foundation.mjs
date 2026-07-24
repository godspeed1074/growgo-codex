import {
  createMapWorldLiveMapFoundation,
  createMapWorldLiveMapSession,
  mapWorldLiveMapFoundationDefinition,
  validateMapWorldLiveMapFoundation
} from "./map-world-live-map-foundation.mjs";

export const mapWorldRealLocationPreviewFoundationRequiredFields = Object.freeze([
  "locationPreviewId",
  "coordinate",
  "resolvedWorld",
  "previewScene",
  "cameraState",
  "validationResult"
]);

export const mapWorldRealLocationPreviewFoundationDefinition = deepFreeze({
  ...mapWorldLiveMapFoundationDefinition
});

export async function createMapWorldRealLocationPreviewFoundation(
  rawDefinition = mapWorldRealLocationPreviewFoundationDefinition,
  options = {}
) {
  const liveMapFoundation = await createMapWorldLiveMapFoundation(rawDefinition, options);
  const visualLayer = liveMapFoundation.mapWorldVisualLayerAttachment;
  const mapDisplay = visualLayer.mapWorldRealMapDisplay;
  const worldAttachment = mapDisplay.worldAttachment;

  const foundation = deepFreeze({
    locationPreviewId: createLocationPreviewId(
      liveMapFoundation.mapInstanceId,
      liveMapFoundation.activeWorldId,
      visualLayer.sceneId
    ),
    coordinate: deepFreeze({
      latitude: liveMapFoundation.centerCoordinate.latitude,
      longitude: liveMapFoundation.centerCoordinate.longitude
    }),
    resolvedWorld: deepFreeze({
      worldId: liveMapFoundation.activeWorldId,
      terrainType: worldAttachment.worldLocationResolver.terrainType,
      seed: worldAttachment.worldLocationResolver.seed,
      settlementId: worldAttachment.settlement.settlementSummary.settlementId,
      roadSegmentCount: worldAttachment.settlement.settlementSummary.roadSegmentCount,
      generatedAssetCount: worldAttachment.settlement.settlementSummary.generatedAssetCount
    }),
    previewScene: deepFreeze({
      sceneId: visualLayer.sceneId,
      assetInstances: deepFreeze(
        worldAttachment.scenePackage.assetInstances.map((assetInstance) =>
          deepFreeze({ ...assetInstance })
        )
      ),
      previewMode: mapDisplay.browserActivation.displayResult.previewMode,
      visibilityState: visualLayer.visibilityState.currentState
    }),
    cameraState: deepFreeze({
      ...visualLayer.cameraState
    }),
    validationResult: deepFreeze({
      coordinateConsistencyValid:
        liveMapFoundation.centerCoordinate.latitude ===
          worldAttachment.worldLocationResolver.latitude &&
        liveMapFoundation.centerCoordinate.longitude ===
          worldAttachment.worldLocationResolver.longitude,
      worldResolutionValid:
        liveMapFoundation.activeWorldId === worldAttachment.worldLocationResolver.worldId,
      sceneAttachmentValid: visualLayer.sceneId === worldAttachment.scenePackage.sceneId,
      cleanupValid: liveMapFoundation.validationResult.cleanupPreserved,
      deterministicOutputValid:
        liveMapFoundation.validationResult.deterministicWorldGenerationPreserved
    }),
    mapWorldLiveMapFoundation: liveMapFoundation
  });

  const validation = validateMapWorldRealLocationPreviewFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldRealLocationPreviewFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);
    const liveMapValidation = validateMapWorldLiveMapFoundation(
      foundation.mapWorldLiveMapFoundation
    );
    if (!liveMapValidation.ok) {
      throw createValidationError(
        liveMapValidation.errorCode ?? "live_map_invalid",
        liveMapValidation.message ??
          "Map world real location preview foundation requires a valid live map foundation."
      );
    }

    if (!foundation.validationResult.coordinateConsistencyValid) {
      throw createValidationError(
        "coordinate_consistency_invalid",
        "Map world real location preview foundation coordinateConsistencyValid must be true."
      );
    }
    if (!foundation.validationResult.worldResolutionValid) {
      throw createValidationError(
        "world_resolution_invalid",
        "Map world real location preview foundation worldResolutionValid must be true."
      );
    }
    if (!foundation.validationResult.sceneAttachmentValid) {
      throw createValidationError(
        "scene_attachment_invalid",
        "Map world real location preview foundation sceneAttachmentValid must be true."
      );
    }
    if (!foundation.validationResult.cleanupValid) {
      throw createValidationError(
        "cleanup_invalid",
        "Map world real location preview foundation cleanupValid must be true."
      );
    }
    if (!foundation.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world real location preview foundation deterministicOutputValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldRealLocationPreview: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldRealLocationPreviewFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldRealLocationPreview: null
    });
  }
}

export function createMapWorldRealLocationPreviewSession(options = {}) {
  const liveMapSession = createMapWorldLiveMapSession(options);
  let currentPreview = null;

  async function syncPreview(liveMapFoundation) {
    currentPreview = await createMapWorldRealLocationPreviewFoundation(
      {
        ...mapWorldRealLocationPreviewFoundationDefinition,
        mapId: liveMapFoundation.mapWorldVisualLayerAttachment.mapId,
        centerCoordinate: deepFreeze({
          ...liveMapFoundation.centerCoordinate
        }),
        zoomLevel: liveMapFoundation.zoomLevel,
        worldId: mapWorldRealLocationPreviewFoundationDefinition.worldId,
        bounds: deepFreeze({
          ...liveMapFoundation.bounds
        }),
        seed:
          liveMapFoundation.mapWorldVisualLayerAttachment.mapWorldRealMapDisplay
            .worldAttachment.worldLocationResolver.seed,
        terrainType:
          liveMapFoundation.mapWorldVisualLayerAttachment.mapWorldRealMapDisplay
            .worldAttachment.worldLocationResolver.terrainType
      },
      options.loaderOptions ?? {}
    );
    return currentPreview;
  }

  return Object.freeze({
    async initializeInteractiveMap() {
      const initialized = await liveMapSession.initializeInteractiveMap();
      if (!initialized.ok) {
        return initialized;
      }
      const preview = await syncPreview(initialized.mapWorldLiveMapFoundation);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: "Interactive map initialized for real-location preview.",
        mapWorldRealLocationPreview: preview
      });
    },

    async panMapBy({ latitudeDelta = 0, longitudeDelta = 0 } = {}) {
      const moved = await liveMapSession.panMapBy({ latitudeDelta, longitudeDelta });
      if (!moved.ok) {
        return moved;
      }
      const preview = await syncPreview(moved.mapWorldLiveMapFoundation);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: moved.message,
        mapWorldRealLocationPreview: preview
      });
    },

    async zoomMapBy(zoomDelta = 0) {
      const zoomed = await liveMapSession.zoomMapBy(zoomDelta);
      if (!zoomed.ok) {
        return zoomed;
      }
      const preview = await syncPreview(zoomed.mapWorldLiveMapFoundation);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: zoomed.message,
        mapWorldRealLocationPreview: preview
      });
    },

    selectCurrentMapPositionAsPreviewLocation() {
      if (!currentPreview) {
        return freezeFailure(
          "interactive_map_not_initialized",
          "Initialize the interactive map before selecting a preview location."
        );
      }
      const resolved = liveMapSession.resolveWorldAtCurrentPosition();
      if (!resolved.ok) {
        return resolved;
      }
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Selected current map position for preview at ${resolved.mapWorldLiveMapFoundation.centerCoordinate.latitude.toFixed(6)}, ${resolved.mapWorldLiveMapFoundation.centerCoordinate.longitude.toFixed(6)}.`,
        mapWorldRealLocationPreview: currentPreview
      });
    },

    loadGeneratedWorldPreview(browserOptions = {}) {
      if (!currentPreview) {
        return freezeFailure(
          "preview_location_not_selected",
          "Initialize the interactive map before loading a generated world preview."
        );
      }
      const activated = liveMapSession.activateVisualLayer(browserOptions);
      if (!activated.ok) {
        return activated;
      }
      currentPreview = deepFreeze({
        ...currentPreview,
        previewScene: deepFreeze({
          ...currentPreview.previewScene,
          visibilityState:
            activated.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.visibilityState.currentState
        }),
        cameraState: deepFreeze({
          ...activated.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.cameraState
        }),
        mapWorldLiveMapFoundation: activated.mapWorldLiveMapFoundation
      });
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Generated world preview loaded for ${currentPreview.resolvedWorld.worldId}.`,
        mapWorldRealLocationPreview: currentPreview,
        atlasPreviewAttachment: activated.atlasPreviewAttachment
      });
    },

    hidePreviewLayer() {
      if (!currentPreview) {
        return freezeFailure(
          "preview_location_not_selected",
          "Initialize the interactive map before hiding a generated world preview."
        );
      }
      const hidden = liveMapSession.hideVisualLayer();
      if (!hidden.ok) {
        return hidden;
      }
      currentPreview = deepFreeze({
        ...currentPreview,
        previewScene: deepFreeze({
          ...currentPreview.previewScene,
          visibilityState:
            hidden.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.visibilityState.currentState
        }),
        cameraState: deepFreeze({
          ...hidden.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment.cameraState
        }),
        mapWorldLiveMapFoundation: hidden.mapWorldLiveMapFoundation
      });
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: "Real-location preview hidden and cleaned up.",
        mapWorldRealLocationPreview: currentPreview
      });
    },

    currentPreview() {
      return currentPreview;
    }
  });
}

function createLocationPreviewId(mapInstanceId, worldId, sceneId) {
  const hash = stableHash(`${mapInstanceId}::${worldId}::${sceneId}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_REAL_LOCATION_PREVIEW_${hash}`;
}

function freezeFailure(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldRealLocationPreviewFoundation");
  for (const fieldName of mapWorldRealLocationPreviewFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world real location preview foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    locationPreviewId: normalizeString(foundation.locationPreviewId, "locationPreviewId"),
    coordinate: deepFreeze(asPlainObject(foundation.coordinate, "coordinate")),
    resolvedWorld: deepFreeze(asPlainObject(foundation.resolvedWorld, "resolvedWorld")),
    previewScene: deepFreeze(asPlainObject(foundation.previewScene, "previewScene")),
    cameraState: deepFreeze(asPlainObject(foundation.cameraState, "cameraState")),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    ),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(foundation.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    )
  });
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
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
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
    name: "MapWorldRealLocationPreviewFoundationValidationError"
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
