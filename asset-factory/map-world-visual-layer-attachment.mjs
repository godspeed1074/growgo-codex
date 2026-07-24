import {
  createMapWorldRealMapDisplayFoundation,
  createMapWorldRealMapDisplaySession,
  mapWorldRealMapDisplayFoundationDefinition,
  validateMapWorldRealMapDisplayFoundation
} from "./map-world-real-map-display-foundation.mjs";

export const mapWorldVisualLayerAttachmentRequiredFields = Object.freeze([
  "layerId",
  "mapId",
  "worldId",
  "sceneId",
  "cameraState",
  "visibilityState",
  "validationResult"
]);

export const mapWorldVisualLayerAttachmentDefinition = deepFreeze({
  ...mapWorldRealMapDisplayFoundationDefinition
});

export async function createMapWorldVisualLayerAttachment(
  rawDefinition = mapWorldVisualLayerAttachmentDefinition,
  options = {}
) {
  const mapDisplay = await createMapWorldRealMapDisplayFoundation(rawDefinition, options);
  const attachment = deepFreeze({
    layerId: createLayerId(
      mapDisplay.mapId,
      mapDisplay.worldAttachment.worldId,
      mapDisplay.worldAttachment.sceneId
    ),
    mapId: mapDisplay.mapId,
    worldId: mapDisplay.worldAttachment.worldId,
    sceneId: mapDisplay.worldAttachment.sceneId,
    cameraState: buildCameraState(mapDisplay, false),
    visibilityState: deepFreeze({
      currentState: "hidden",
      layerToggleSupported: true,
      visible: false,
      cleanupOnHideSupported: true
    }),
    validationResult: deepFreeze({
      correctWorldForCoordinate: mapDisplay.validationResult.coordinateConsistencyValid,
      visibilityStateValid: true,
      cameraStateValid: true,
      deterministicOutputValid: mapDisplay.validationResult.deterministicOutputValid,
      cleanupValid: mapDisplay.validationResult.activationCleanupValid
    }),
    mapWorldRealMapDisplay: mapDisplay
  });

  const validation = validateMapWorldVisualLayerAttachment(attachment);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return attachment;
}

export function validateMapWorldVisualLayerAttachment(rawAttachment) {
  try {
    const attachment = normalizeAttachment(rawAttachment);
    const displayValidation = validateMapWorldRealMapDisplayFoundation(
      attachment.mapWorldRealMapDisplay
    );
    if (!displayValidation.ok) {
      throw createValidationError(
        displayValidation.errorCode ?? "map_display_invalid",
        displayValidation.message ??
          "Map world visual layer attachment requires a valid map world real map display."
      );
    }

    if (!attachment.validationResult.correctWorldForCoordinate) {
      throw createValidationError(
        "coordinate_world_mismatch",
        "Map world visual layer attachment correctWorldForCoordinate must be true."
      );
    }
    if (!attachment.validationResult.visibilityStateValid) {
      throw createValidationError(
        "visibility_state_invalid",
        "Map world visual layer attachment visibilityStateValid must be true."
      );
    }
    if (!attachment.validationResult.cameraStateValid) {
      throw createValidationError(
        "camera_state_invalid",
        "Map world visual layer attachment cameraStateValid must be true."
      );
    }
    if (!attachment.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world visual layer attachment deterministicOutputValid must be true."
      );
    }
    if (!attachment.validationResult.cleanupValid) {
      throw createValidationError(
        "cleanup_invalid",
        "Map world visual layer attachment cleanupValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldVisualLayerAttachment: attachment
    });
  } catch (error) {
    if (error?.name !== "MapWorldVisualLayerAttachmentValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldVisualLayerAttachment: null
    });
  }
}

export function createMapWorldVisualLayerSession(options = {}) {
  const displaySession = createMapWorldRealMapDisplaySession(options);
  let currentAttachment = null;
  let currentVisibilityState = "hidden";

  const syncFromDisplay = async (mapDisplay) => {
    currentAttachment = await createMapWorldVisualLayerAttachment(
      {
        ...mapWorldVisualLayerAttachmentDefinition,
        mapId: mapDisplay.mapId,
        centerCoordinate: deepFreeze({
          ...mapDisplay.centerCoordinate
        }),
        zoomLevel: mapDisplay.zoomLevel,
        worldId: mapWorldVisualLayerAttachmentDefinition.worldId,
        bounds: deepFreeze({
          ...mapDisplay.worldAttachment.worldLocationResolver.bounds
        }),
        seed: mapDisplay.worldAttachment.worldLocationResolver.seed,
        terrainType: mapDisplay.worldAttachment.worldLocationResolver.terrainType
      },
      options.loaderOptions ?? {}
    );

    currentAttachment = deepFreeze({
      ...currentAttachment,
      visibilityState: deepFreeze({
        ...currentAttachment.visibilityState,
        currentState: currentVisibilityState,
        visible: currentVisibilityState === "visible"
      }),
      cameraState: buildCameraState(
        currentAttachment.mapWorldRealMapDisplay,
        currentVisibilityState === "visible"
      )
    });

    return currentAttachment;
  };

  return Object.freeze({
    async loadFixedTestCoordinate() {
      const loaded = await displaySession.loadFixedTestCoordinate();
      if (!loaded.ok) {
        return loaded;
      }
      currentVisibilityState = "hidden";
      const attachment = await syncFromDisplay(loaded.mapWorldRealMapDisplay);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: loaded.message,
        visualLayerState: currentVisibilityState,
        mapWorldVisualLayerAttachment: attachment
      });
    },

    async moveMapCenter({ latitudeDelta = 0, longitudeDelta = 0 } = {}) {
      const moved = await displaySession.moveMapCenter({ latitudeDelta, longitudeDelta });
      if (!moved.ok) {
        return moved;
      }
      currentVisibilityState = "hidden";
      const attachment = await syncFromDisplay(moved.mapWorldRealMapDisplay);
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: moved.message,
        visualLayerState: currentVisibilityState,
        mapWorldVisualLayerAttachment: attachment
      });
    },

    activateVisualLayer(browserOptions = {}) {
      const activated = displaySession.activateWorldFromMapLocation(browserOptions);
      if (!activated.ok) {
        return Object.freeze({
          ok: false,
          errorCode: activated.errorCode,
          message: activated.message,
          visualLayerState: "failed",
          mapWorldVisualLayerAttachment: currentAttachment
        });
      }

      currentVisibilityState = "visible";
      currentAttachment = deepFreeze({
        ...currentAttachment,
        cameraState: buildCameraState(
          activated.mapWorldRealMapDisplay,
          true
        ),
        visibilityState: deepFreeze({
          ...currentAttachment.visibilityState,
          currentState: "visible",
          visible: true
        })
      });

      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Visible overlay layer activated for ${currentAttachment.worldId}.`,
        visualLayerState: currentVisibilityState,
        mapWorldVisualLayerAttachment: currentAttachment,
        atlasPreviewAttachment: activated.atlasPreviewAttachment
      });
    },

    toggleWorldLayer(browserOptions = {}) {
      if (currentVisibilityState === "visible") {
        return this.hideVisualLayer();
      }
      return this.activateVisualLayer(browserOptions);
    },

    hideVisualLayer() {
      const hidden = displaySession.hideWorld();
      if (!hidden.ok) {
        return Object.freeze({
          ok: false,
          errorCode: hidden.errorCode,
          message: hidden.message,
          visualLayerState: "failed",
          mapWorldVisualLayerAttachment: currentAttachment
        });
      }

      currentVisibilityState = "hidden";
      currentAttachment = deepFreeze({
        ...currentAttachment,
        cameraState: buildCameraState(
          currentAttachment.mapWorldRealMapDisplay,
          false
        ),
        visibilityState: deepFreeze({
          ...currentAttachment.visibilityState,
          currentState: "hidden",
          visible: false
        })
      });

      return Object.freeze({
        ok: true,
        errorCode: null,
        message: "Visible overlay layer hidden and cleaned up.",
        visualLayerState: currentVisibilityState,
        mapWorldVisualLayerAttachment: currentAttachment
      });
    },

    currentLayerAttachment() {
      return currentAttachment;
    },

    currentVisualLayerState() {
      return currentVisibilityState;
    }
  });
}

function buildCameraState(mapDisplay, visible) {
  const previewCamera = mapDisplay.worldAttachment.cameraProfile;
  return deepFreeze({
    mapCenterCoordinate: deepFreeze({
      latitude: mapDisplay.centerCoordinate.latitude,
      longitude: mapDisplay.centerCoordinate.longitude
    }),
    mapZoomLevel: mapDisplay.zoomLevel,
    previewCameraProfile: previewCamera.cameraProfile,
    previewFocusAssetId: previewCamera.focusAssetId,
    previewZoomLevel: previewCamera.zoomLevel,
    synchronized: true,
    visible
  });
}

function createLayerId(mapId, worldId, sceneId) {
  const hash = stableHash(`${mapId}::${worldId}::${sceneId}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_VISUAL_LAYER_${hash}`;
}

function normalizeAttachment(rawAttachment) {
  const attachment = asPlainObject(rawAttachment, "mapWorldVisualLayerAttachment");
  for (const fieldName of mapWorldVisualLayerAttachmentRequiredFields) {
    if (!(fieldName in attachment)) {
      throw createValidationError(
        "missing_required_field",
        `Map world visual layer attachment is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    layerId: normalizeString(attachment.layerId, "layerId"),
    mapId: normalizeString(attachment.mapId, "mapId"),
    worldId: normalizeString(attachment.worldId, "worldId"),
    sceneId: normalizeString(attachment.sceneId, "sceneId"),
    cameraState: deepFreeze(
      asPlainObject(attachment.cameraState, "cameraState")
    ),
    visibilityState: deepFreeze(
      asPlainObject(attachment.visibilityState, "visibilityState")
    ),
    validationResult: deepFreeze(
      asPlainObject(attachment.validationResult, "validationResult")
    ),
    mapWorldRealMapDisplay: deepFreeze(
      asPlainObject(attachment.mapWorldRealMapDisplay, "mapWorldRealMapDisplay")
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
    name: "MapWorldVisualLayerAttachmentValidationError"
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
