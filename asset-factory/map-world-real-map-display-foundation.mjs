import {
  attachMapWorldToAtlasPreview
} from "./map-world-to-atlas-scene-attachment-foundation.mjs";
import {
  createMapWorldBrowserActivationFoundation,
  mapWorldBrowserActivationFoundationDefinition,
  validateMapWorldBrowserActivationFoundation
} from "./map-world-browser-activation-foundation.mjs";
import {
  mapCoordinateWorldResolverFoundationDefinition
} from "./map-coordinate-world-resolver-foundation.mjs";

export const mapWorldRealMapDisplayFoundationRequiredFields = Object.freeze([
  "mapId",
  "centerCoordinate",
  "zoomLevel",
  "worldAttachment",
  "displayState",
  "validationResult"
]);

export const mapWorldRealMapDisplayFoundationDefinition = deepFreeze({
  mapId: "COASTAL_REAL_MAP_DISPLAY_001",
  centerCoordinate: deepFreeze({
    latitude: mapCoordinateWorldResolverFoundationDefinition.latitude,
    longitude: mapCoordinateWorldResolverFoundationDefinition.longitude
  }),
  zoomLevel: 14,
  worldId: mapCoordinateWorldResolverFoundationDefinition.worldId,
  bounds: deepFreeze({
    ...mapCoordinateWorldResolverFoundationDefinition.bounds
  }),
  seed: mapCoordinateWorldResolverFoundationDefinition.seed,
  terrainType: mapCoordinateWorldResolverFoundationDefinition.terrainType
});

export async function createMapWorldRealMapDisplayFoundation(
  rawDefinition = mapWorldRealMapDisplayFoundationDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const activation = await createMapWorldBrowserActivationFoundation(
    buildActivationDefinition(definition),
    options
  );

  const foundation = deepFreeze({
    mapId: definition.mapId,
    centerCoordinate: deepFreeze({
      latitude: definition.centerCoordinate.latitude,
      longitude: definition.centerCoordinate.longitude
    }),
    zoomLevel: definition.zoomLevel,
    worldAttachment: activation.attachment,
    displayState: deepFreeze({
      currentState: "loaded",
      allowedStates: deepFreeze([
        "created",
        "loaded",
        "activated",
        "hidden",
        "closed",
        "failed"
      ]),
      mapCenterMovementSupported: true,
      fixedTestCoordinateLoadingSupported: true,
      worldActivationFromMapLocationSupported: true,
      manualActivationOnly: true
    }),
    validationResult: deepFreeze({
      coordinateConsistencyValid:
        activation.attachment.worldLocationResolver.latitude ===
          definition.centerCoordinate.latitude &&
        activation.attachment.worldLocationResolver.longitude ===
          definition.centerCoordinate.longitude,
      worldIdentityValid: activation.validationResult.worldIdentityValid,
      sceneIdentityValid: activation.validationResult.sceneIdentityValid,
      activationCleanupValid: activation.validationResult.cleanupValid,
      deterministicOutputValid: true,
      fallbackBehaviorValid: activation.validationResult.fallbackBehaviorValid
    }),
    browserActivation: activation
  });

  const validation = validateMapWorldRealMapDisplayFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldRealMapDisplayFoundation(rawFoundation) {
  try {
    const foundation = normalizeGeneratedFoundation(rawFoundation);
    const activationValidation = validateMapWorldBrowserActivationFoundation(
      foundation.browserActivation
    );
    if (!activationValidation.ok) {
      throw createValidationError(
        activationValidation.errorCode ?? "browser_activation_invalid",
        activationValidation.message ??
          "Map world real map display foundation requires a valid browser activation."
      );
    }

    if (!foundation.validationResult.coordinateConsistencyValid) {
      throw createValidationError(
        "coordinate_consistency_invalid",
        "Map world real map display foundation coordinateConsistencyValid must be true."
      );
    }
    if (!foundation.validationResult.worldIdentityValid) {
      throw createValidationError(
        "world_identity_invalid",
        "Map world real map display foundation worldIdentityValid must be true."
      );
    }
    if (!foundation.validationResult.sceneIdentityValid) {
      throw createValidationError(
        "scene_identity_invalid",
        "Map world real map display foundation sceneIdentityValid must be true."
      );
    }
    if (!foundation.validationResult.activationCleanupValid) {
      throw createValidationError(
        "activation_cleanup_invalid",
        "Map world real map display foundation activationCleanupValid must be true."
      );
    }
    if (!foundation.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world real map display foundation deterministicOutputValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldRealMapDisplay: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldRealMapDisplayFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldRealMapDisplay: null
    });
  }
}

export function createMapWorldRealMapDisplaySession(options = {}) {
  const baseDefinition = deepFreeze({
    ...mapWorldRealMapDisplayFoundationDefinition,
    ...(options.definition ?? {})
  });
  let currentDefinition = baseDefinition;
  let currentDisplay = null;
  let attachedPreview = null;
  let currentState = "created";
  let closed = false;

  async function buildDisplay(definition) {
    return createMapWorldRealMapDisplayFoundation(
      definition,
      options.loaderOptions ?? {}
    );
  }

  return Object.freeze({
    async loadFixedTestCoordinate() {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world real map display session is already closed."
        );
      }
      currentDefinition = deepFreeze({
        ...baseDefinition,
        centerCoordinate: deepFreeze({
          ...baseDefinition.centerCoordinate
        })
      });
      currentDisplay = await buildDisplay(currentDefinition);
      attachedPreview = null;
      currentState = "loaded";
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Loaded fixed test coordinate for ${currentDisplay.worldAttachment.worldId}.`,
        displayState: currentState,
        mapWorldRealMapDisplay: currentDisplay
      });
    },

    async moveMapCenter({ latitudeDelta = 0, longitudeDelta = 0 } = {}) {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world real map display session is already closed."
        );
      }
      if (!currentDefinition) {
        return freezeFailure(
          "map_definition_missing",
          "Map world real map display definition is unavailable."
        );
      }

      if (attachedPreview?.atlasBrowserDemoHarness) {
        const cleanup = attachedPreview.atlasBrowserDemoHarness.hideCoastalWorld();
        if (!cleanup.ok) {
          currentState = "failed";
          return Object.freeze({
            ok: false,
            errorCode: cleanup.errorCode ?? "cleanup_failed",
            message: cleanup.message ?? "Unable to hide active coastal world before moving map center.",
            displayState: currentState,
            mapWorldRealMapDisplay: currentDisplay
          });
        }
      }

      const nextDefinition = deepFreeze({
        ...currentDefinition,
        centerCoordinate: deepFreeze({
          latitude: roundCoordinate(
            currentDefinition.centerCoordinate.latitude + Number(latitudeDelta)
          ),
          longitude: roundCoordinate(
            currentDefinition.centerCoordinate.longitude + Number(longitudeDelta)
          )
        })
      });

      currentDisplay = await buildDisplay(nextDefinition);
      currentDefinition = nextDefinition;
      attachedPreview = null;
      currentState = "loaded";

      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Map center moved to ${currentDisplay.centerCoordinate.latitude.toFixed(6)}, ${currentDisplay.centerCoordinate.longitude.toFixed(6)}.`,
        displayState: currentState,
        mapWorldRealMapDisplay: currentDisplay
      });
    },

    async setMapZoomLevel(zoomLevel) {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world real map display session is already closed."
        );
      }
      if (!currentDefinition) {
        return freezeFailure(
          "map_definition_missing",
          "Map world real map display definition is unavailable."
        );
      }

      if (attachedPreview?.atlasBrowserDemoHarness) {
        const cleanup = attachedPreview.atlasBrowserDemoHarness.hideCoastalWorld();
        if (!cleanup.ok) {
          currentState = "failed";
          return Object.freeze({
            ok: false,
            errorCode: cleanup.errorCode ?? "cleanup_failed",
            message:
              cleanup.message ??
              "Unable to hide active coastal world before changing zoom level.",
            displayState: currentState,
            mapWorldRealMapDisplay: currentDisplay
          });
        }
      }

      const nextDefinition = deepFreeze({
        ...currentDefinition,
        zoomLevel: normalizeZoomLevel(zoomLevel)
      });

      currentDisplay = await buildDisplay(nextDefinition);
      currentDefinition = nextDefinition;
      attachedPreview = null;
      currentState = "loaded";

      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Map zoom changed to ${currentDisplay.zoomLevel}.`,
        displayState: currentState,
        mapWorldRealMapDisplay: currentDisplay
      });
    },

    activateWorldFromMapLocation(browserOptions = {}) {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world real map display session is already closed."
        );
      }
      if (!currentDisplay) {
        return freezeFailure(
          "map_world_not_loaded",
          "Load a fixed test coordinate or move the map center before activation."
        );
      }

      if (attachedPreview == null) {
        const attached = attachMapWorldToAtlasPreview(
          currentDisplay.worldAttachment,
          browserOptions
        );
        if (!attached.ok) {
          currentState = "failed";
          return Object.freeze({
            ok: false,
            errorCode: attached.errorCode,
            message: attached.message,
            displayState: currentState,
            activationResult: null
          });
        }
        attachedPreview = attached.atlasPreviewAttachment;
      }

      const shown = attachedPreview.atlasBrowserDemoHarness.showCoastalWorld();
      currentState = shown.ok ? "activated" : "failed";

      return Object.freeze({
        ok: shown.ok,
        errorCode: shown.errorCode ?? null,
        message:
          shown.ok
            ? `Activated coastal world ${currentDisplay.worldAttachment.worldId} from map location.`
            : shown.message,
        displayState: currentState,
        activationResult: shown,
        mapWorldRealMapDisplay: currentDisplay,
        atlasPreviewAttachment: attachedPreview
      });
    },

    hideWorld() {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world real map display session is already closed."
        );
      }
      if (attachedPreview == null) {
        return freezeFailure(
          "world_not_active",
          "Activate a map world before hiding it."
        );
      }

      const hidden = attachedPreview.atlasBrowserDemoHarness.hideCoastalWorld();
      currentState = hidden.ok ? "hidden" : "failed";

      return Object.freeze({
        ok: hidden.ok,
        errorCode: hidden.errorCode ?? null,
        message: hidden.ok ? "Map-positioned coastal world hidden." : hidden.message,
        displayState: currentState,
        cleanupResult: hidden,
        atlasPreviewAttachment: attachedPreview
      });
    },

    currentDisplayState() {
      return currentState;
    },

    currentMapDisplay() {
      return currentDisplay;
    }
  });
}

function buildActivationDefinition(definition) {
  return deepFreeze({
    ...mapWorldBrowserActivationFoundationDefinition,
    worldId: definition.worldId,
    latitude: definition.centerCoordinate.latitude,
    longitude: definition.centerCoordinate.longitude,
    bounds: deepFreeze({
      ...definition.bounds
    }),
    seed: definition.seed,
    terrainType: definition.terrainType
  });
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "mapWorldRealMapDisplayFoundationDefinition");
  const centerCoordinate = asPlainObject(definition.centerCoordinate, "centerCoordinate");
  const bounds = asPlainObject(definition.bounds, "bounds");

  return deepFreeze({
    mapId: normalizeString(definition.mapId, "mapId"),
    centerCoordinate: deepFreeze({
      latitude: normalizeLatitude(centerCoordinate.latitude, "centerCoordinate.latitude"),
      longitude: normalizeLongitude(centerCoordinate.longitude, "centerCoordinate.longitude")
    }),
    zoomLevel: normalizeZoomLevel(definition.zoomLevel),
    worldId: normalizeString(definition.worldId, "worldId"),
    bounds: deepFreeze({
      minLatitude: normalizeLatitude(bounds.minLatitude, "bounds.minLatitude"),
      minLongitude: normalizeLongitude(bounds.minLongitude, "bounds.minLongitude"),
      maxLatitude: normalizeLatitude(bounds.maxLatitude, "bounds.maxLatitude"),
      maxLongitude: normalizeLongitude(bounds.maxLongitude, "bounds.maxLongitude"),
      minX: Number(bounds.minX),
      minY: Number(bounds.minY),
      maxX: Number(bounds.maxX),
      maxY: Number(bounds.maxY)
    }),
    seed: normalizeString(definition.seed, "seed"),
    terrainType: normalizeString(definition.terrainType, "terrainType")
  });
}

function normalizeGeneratedFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldRealMapDisplayFoundation");
  for (const fieldName of mapWorldRealMapDisplayFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world real map display foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    mapId: normalizeString(foundation.mapId, "mapId"),
    centerCoordinate: deepFreeze({
      ...asPlainObject(foundation.centerCoordinate, "centerCoordinate")
    }),
    zoomLevel: normalizeZoomLevel(foundation.zoomLevel),
    worldAttachment: deepFreeze(
      asPlainObject(foundation.worldAttachment, "worldAttachment")
    ),
    displayState: deepFreeze(
      asPlainObject(foundation.displayState, "displayState")
    ),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    ),
    browserActivation: deepFreeze(
      asPlainObject(foundation.browserActivation, "browserActivation")
    )
  });
}

function normalizeLatitude(value, fieldName) {
  const latitude = Number(value);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw createValidationError(
      "invalid_latitude",
      `${fieldName} must be a finite latitude between -90 and 90.`
    );
  }
  return latitude;
}

function normalizeLongitude(value, fieldName) {
  const longitude = Number(value);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw createValidationError(
      "invalid_longitude",
      `${fieldName} must be a finite longitude between -180 and 180.`
    );
  }
  return longitude;
}

function normalizeZoomLevel(value) {
  const zoomLevel = Number(value);
  if (!Number.isInteger(zoomLevel) || zoomLevel < 1 || zoomLevel > 22) {
    throw createValidationError(
      "invalid_zoom_level",
      "zoomLevel must be an integer between 1 and 22."
    );
  }
  return zoomLevel;
}

function roundCoordinate(value) {
  return Number(value.toFixed(6));
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

function freezeFailure(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message
  });
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldRealMapDisplayFoundationValidationError"
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
