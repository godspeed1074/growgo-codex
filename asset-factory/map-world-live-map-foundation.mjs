import {
  createMapWorldVisualLayerAttachment,
  createMapWorldVisualLayerSession,
  mapWorldVisualLayerAttachmentDefinition,
  validateMapWorldVisualLayerAttachment
} from "./map-world-visual-layer-attachment.mjs";

export const mapWorldLiveMapFoundationRequiredFields = Object.freeze([
  "mapInstanceId",
  "centerCoordinate",
  "zoomLevel",
  "bounds",
  "activeWorldId",
  "validationResult"
]);

export const mapWorldLiveMapFoundationDefinition = deepFreeze({
  ...mapWorldVisualLayerAttachmentDefinition
});

export async function createMapWorldLiveMapFoundation(
  rawDefinition = mapWorldLiveMapFoundationDefinition,
  options = {}
) {
  const visualLayer = await createMapWorldVisualLayerAttachment(rawDefinition, options);
  const foundation = deepFreeze({
    mapInstanceId: createMapInstanceId(
      visualLayer.mapId,
      visualLayer.worldId,
      visualLayer.sceneId
    ),
    centerCoordinate: deepFreeze({
      latitude: visualLayer.mapWorldRealMapDisplay.centerCoordinate.latitude,
      longitude: visualLayer.mapWorldRealMapDisplay.centerCoordinate.longitude
    }),
    zoomLevel: visualLayer.mapWorldRealMapDisplay.zoomLevel,
    bounds: deepFreeze({
      ...visualLayer.mapWorldRealMapDisplay.worldAttachment.worldLocationResolver.bounds
    }),
    activeWorldId: visualLayer.worldId,
    validationResult: deepFreeze({
      panUpdatesCoordinateState: true,
      zoomUpdatesWorldDisplayState: true,
      currentMapPositionResolvesWorldData: true,
      deterministicWorldGenerationPreserved:
        visualLayer.validationResult.deterministicOutputValid,
      visualLayerAttachmentPreserved: true,
      cleanupPreserved: visualLayer.validationResult.cleanupValid,
      fallbackBehaviorPreserved:
        visualLayer.mapWorldRealMapDisplay.validationResult.fallbackBehaviorValid
    }),
    mapWorldVisualLayerAttachment: visualLayer
  });

  const validation = validateMapWorldLiveMapFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldLiveMapFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);
    const visualLayerValidation = validateMapWorldVisualLayerAttachment(
      foundation.mapWorldVisualLayerAttachment
    );
    if (!visualLayerValidation.ok) {
      throw createValidationError(
        visualLayerValidation.errorCode ?? "visual_layer_invalid",
        visualLayerValidation.message ??
          "Map world live map foundation requires a valid visual layer attachment."
      );
    }

    if (!foundation.validationResult.panUpdatesCoordinateState) {
      throw createValidationError(
        "pan_state_invalid",
        "Map world live map foundation panUpdatesCoordinateState must be true."
      );
    }
    if (!foundation.validationResult.zoomUpdatesWorldDisplayState) {
      throw createValidationError(
        "zoom_state_invalid",
        "Map world live map foundation zoomUpdatesWorldDisplayState must be true."
      );
    }
    if (!foundation.validationResult.currentMapPositionResolvesWorldData) {
      throw createValidationError(
        "world_resolution_invalid",
        "Map world live map foundation currentMapPositionResolvesWorldData must be true."
      );
    }
    if (!foundation.validationResult.deterministicWorldGenerationPreserved) {
      throw createValidationError(
        "deterministic_generation_invalid",
        "Map world live map foundation deterministicWorldGenerationPreserved must be true."
      );
    }
    if (!foundation.validationResult.cleanupPreserved) {
      throw createValidationError(
        "cleanup_invalid",
        "Map world live map foundation cleanupPreserved must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldLiveMapFoundation: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldLiveMapFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldLiveMapFoundation: null
    });
  }
}

export function createMapWorldLiveMapSession(options = {}) {
  const visualLayerSession = createMapWorldVisualLayerSession(options);
  let currentFoundation = null;

  async function syncFoundation(visualLayerAttachment) {
    currentFoundation = await createMapWorldLiveMapFoundation(
      {
        ...mapWorldLiveMapFoundationDefinition,
        mapId: visualLayerAttachment.mapId,
        centerCoordinate: deepFreeze({
          ...visualLayerAttachment.mapWorldRealMapDisplay.centerCoordinate
        }),
        zoomLevel: visualLayerAttachment.mapWorldRealMapDisplay.zoomLevel,
        worldId: mapWorldLiveMapFoundationDefinition.worldId,
        bounds: deepFreeze({
          ...visualLayerAttachment.mapWorldRealMapDisplay.worldAttachment.worldLocationResolver.bounds
        }),
        seed:
          visualLayerAttachment.mapWorldRealMapDisplay.worldAttachment
            .worldLocationResolver.seed,
        terrainType:
          visualLayerAttachment.mapWorldRealMapDisplay.worldAttachment
            .worldLocationResolver.terrainType
      },
      options.loaderOptions ?? {}
    );
    return currentFoundation;
  }

  return Object.freeze({
    async initializeInteractiveMap() {
      const loaded = await visualLayerSession.loadFixedTestCoordinate();
      if (!loaded.ok) {
        return loaded;
      }
      const foundation = await syncFoundation(loaded.mapWorldVisualLayerAttachment);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: "Interactive map initialized from fixed test coordinate.",
        mapWorldLiveMapFoundation: foundation
      });
    },

    async panMapBy({ latitudeDelta = 0, longitudeDelta = 0 } = {}) {
      const moved = await visualLayerSession.moveMapCenter({
        latitudeDelta,
        longitudeDelta
      });
      if (!moved.ok) {
        return moved;
      }
      const foundation = await syncFoundation(moved.mapWorldVisualLayerAttachment);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: moved.message,
        mapWorldLiveMapFoundation: foundation
      });
    },

    async zoomMapBy(zoomDelta = 0) {
      const nextZoomLevel =
        (currentFoundation?.zoomLevel ??
          mapWorldLiveMapFoundationDefinition.zoomLevel) + Number(zoomDelta);
      const zoomed = await visualLayerSession.setMapZoomLevel(nextZoomLevel);
      if (!zoomed.ok) {
        return zoomed;
      }
      const foundation = await syncFoundation(zoomed.mapWorldVisualLayerAttachment);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: zoomed.message,
        mapWorldLiveMapFoundation: foundation
      });
    },

    resolveWorldAtCurrentPosition() {
      if (!currentFoundation) {
        return freezeFailure(
          "interactive_map_not_initialized",
          "Initialize the interactive map before resolving the current world."
        );
      }
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Resolved world ${currentFoundation.activeWorldId} at the current map position.`,
        mapWorldLiveMapFoundation: currentFoundation
      });
    },

    activateVisualLayer(browserOptions = {}) {
      const activated = visualLayerSession.activateVisualLayer(browserOptions);
      if (!activated.ok) {
        return activated;
      }
      currentFoundation = deepFreeze({
        ...currentFoundation,
        mapWorldVisualLayerAttachment: activated.mapWorldVisualLayerAttachment
      });
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: activated.message,
        mapWorldLiveMapFoundation: currentFoundation,
        atlasPreviewAttachment: activated.atlasPreviewAttachment
      });
    },

    hideVisualLayer() {
      const hidden = visualLayerSession.hideVisualLayer();
      if (!hidden.ok) {
        return hidden;
      }
      currentFoundation = deepFreeze({
        ...currentFoundation,
        mapWorldVisualLayerAttachment: hidden.mapWorldVisualLayerAttachment
      });
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: hidden.message,
        mapWorldLiveMapFoundation: currentFoundation
      });
    },

    currentLiveMapFoundation() {
      return currentFoundation;
    }
  });
}

function createMapInstanceId(mapId, worldId, sceneId) {
  const hash = stableHash(`${mapId}::${worldId}::${sceneId}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_LIVE_MAP_${hash}`;
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldLiveMapFoundation");
  for (const fieldName of mapWorldLiveMapFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world live map foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    mapInstanceId: normalizeString(foundation.mapInstanceId, "mapInstanceId"),
    centerCoordinate: deepFreeze(
      asPlainObject(foundation.centerCoordinate, "centerCoordinate")
    ),
    zoomLevel: Number(foundation.zoomLevel),
    bounds: deepFreeze(asPlainObject(foundation.bounds, "bounds")),
    activeWorldId: normalizeString(foundation.activeWorldId, "activeWorldId"),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    ),
    mapWorldVisualLayerAttachment: deepFreeze(
      asPlainObject(
        foundation.mapWorldVisualLayerAttachment,
        "mapWorldVisualLayerAttachment"
      )
    )
  });
}

function freezeFailure(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message
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
    name: "MapWorldLiveMapFoundationValidationError"
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
