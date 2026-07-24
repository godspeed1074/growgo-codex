import {
  attachMapWorldToAtlasPreview,
  createMapWorldToAtlasSceneAttachmentFoundation,
  mapWorldToAtlasSceneAttachmentFoundationDefinition,
  validateMapWorldToAtlasSceneAttachmentFoundation
} from "./map-world-to-atlas-scene-attachment-foundation.mjs";

export const mapWorldBrowserActivationFoundationRequiredFields = Object.freeze([
  "activationId",
  "attachmentId",
  "worldId",
  "activationState",
  "displayResult",
  "validationResult"
]);

export const mapWorldBrowserActivationFoundationDefinition = deepFreeze({
  ...mapWorldToAtlasSceneAttachmentFoundationDefinition
});

export async function createMapWorldBrowserActivationFoundation(
  rawDefinition = mapWorldBrowserActivationFoundationDefinition,
  options = {}
) {
  const attachment = await createMapWorldToAtlasSceneAttachmentFoundation(
    rawDefinition,
    options
  );
  const activationId = createActivationId(
    attachment.attachmentId,
    attachment.worldId,
    attachment.sceneId
  );

  const foundation = deepFreeze({
    activationId,
    attachmentId: attachment.attachmentId,
    worldId: attachment.worldId,
    activationState: deepFreeze({
      currentState: "loaded",
      allowedStates: deepFreeze([
        "created",
        "loaded",
        "activated",
        "hidden",
        "closed",
        "failed"
      ]),
      manualLoadRequired: true,
      manualActivationRequired: true,
      fallbackEnabled: attachment.renderState.fallbackEnabled
    }),
    displayResult: deepFreeze({
      sceneId: attachment.sceneId,
      assetInstances: deepFreeze(
        attachment.assetInstances.map((assetInstance) => deepFreeze({ ...assetInstance }))
      ),
      cameraProfile: deepFreeze({ ...attachment.cameraProfile }),
      previewMode: attachment.renderState.previewMode,
      showAction: "showCoastalWorld",
      hideAction: "hideCoastalWorld"
    }),
    validationResult: deepFreeze({
      activationSuccessReady: true,
      worldIdentityValid: attachment.validationResult.worldIdentityValid,
      sceneIdentityValid: attachment.validationResult.sceneIdentityValid,
      cleanupValid: attachment.validationResult.cleanupBehaviorValid,
      fallbackBehaviorValid: attachment.validationResult.fallbackBehaviorValid,
      attachmentValidation: deepFreeze({
        ...attachment.validationResult
      })
    }),
    attachment
  });

  const validation = validateMapWorldBrowserActivationFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldBrowserActivationFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);
    const attachmentValidation =
      validateMapWorldToAtlasSceneAttachmentFoundation(foundation.attachment);
    if (!attachmentValidation.ok) {
      throw createValidationError(
        attachmentValidation.errorCode ?? "attachment_invalid",
        attachmentValidation.message ??
          "Map world browser activation foundation requires a valid map world attachment."
      );
    }

    if (!foundation.validationResult.activationSuccessReady) {
      throw createValidationError(
        "activation_not_ready",
        "Map world browser activation foundation activationSuccessReady must be true."
      );
    }
    if (!foundation.validationResult.worldIdentityValid) {
      throw createValidationError(
        "world_identity_invalid",
        "Map world browser activation foundation worldIdentityValid must be true."
      );
    }
    if (!foundation.validationResult.sceneIdentityValid) {
      throw createValidationError(
        "scene_identity_invalid",
        "Map world browser activation foundation sceneIdentityValid must be true."
      );
    }
    if (!foundation.validationResult.cleanupValid) {
      throw createValidationError(
        "cleanup_invalid",
        "Map world browser activation foundation cleanupValid must be true."
      );
    }
    if (!foundation.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_invalid",
        "Map world browser activation foundation fallbackBehaviorValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldBrowserActivation: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldBrowserActivationFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldBrowserActivation: null
    });
  }
}

export function createMapWorldBrowserActivationSession(options = {}) {
  let currentState = "created";
  let closed = false;
  let loadedActivation = null;
  let attachedPreview = null;

  return Object.freeze({
    async loadTestMapWorld() {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world browser activation session is already closed."
        );
      }
      if (loadedActivation) {
        return Object.freeze({
          ok: true,
          errorCode: null,
          message: "Test map world already loaded.",
          activationState: currentState,
          mapWorldBrowserActivation: loadedActivation
        });
      }

      const activation = await createMapWorldBrowserActivationFoundation(
        options.definition ?? mapWorldBrowserActivationFoundationDefinition,
        options.loaderOptions ?? {}
      );
      loadedActivation = activation;
      currentState = "loaded";

      return Object.freeze({
        ok: true,
        errorCode: null,
        message: `Test map world loaded for ${activation.worldId}.`,
        activationState: currentState,
        mapWorldBrowserActivation: activation
      });
    },

    activateCoastalWorld(browserOptions = {}) {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world browser activation session is already closed."
        );
      }
      if (!loadedActivation) {
        return freezeFailure(
          "test_map_world_not_loaded",
          "Load test map world before activating the coastal world."
        );
      }
      if (attachedPreview == null) {
        const attachResult = attachMapWorldToAtlasPreview(
          loadedActivation.attachment,
          browserOptions
        );
        if (!attachResult.ok) {
          currentState = "failed";
          return Object.freeze({
            ok: false,
            errorCode: attachResult.errorCode,
            message: attachResult.message,
            activationState: currentState,
            activationResult: null
          });
        }
        attachedPreview = attachResult.atlasPreviewAttachment;
      }

      const shown = attachedPreview.atlasBrowserDemoHarness.showCoastalWorld();
      currentState = shown.ok ? "activated" : "failed";

      return Object.freeze({
        ok: shown.ok,
        errorCode: shown.errorCode ?? null,
        message:
          shown.ok
            ? `Activated coastal world ${loadedActivation.worldId}.`
            : shown.message,
        activationState: currentState,
        activationResult: shown,
        mapWorldBrowserActivation: loadedActivation,
        atlasPreviewAttachment: attachedPreview
      });
    },

    hideCoastalWorld() {
      if (closed) {
        return freezeFailure(
          "session_closed",
          "Map world browser activation session is already closed."
        );
      }
      if (attachedPreview == null) {
        return freezeFailure(
          "coastal_world_not_active",
          "Activate coastal world before hiding it."
        );
      }

      const hidden = attachedPreview.atlasBrowserDemoHarness.hideCoastalWorld();
      if (hidden.ok) {
        currentState = "hidden";
      } else {
        currentState = "failed";
      }

      return Object.freeze({
        ok: hidden.ok,
        errorCode: hidden.errorCode ?? null,
        message: hidden.ok ? "Coastal world hidden." : hidden.message,
        activationState: currentState,
        cleanupResult: hidden,
        atlasPreviewAttachment: attachedPreview
      });
    },

    close() {
      closed = true;
      currentState = "closed";
      return Object.freeze({
        ok: true,
        activationState: currentState
      });
    },

    currentActivationState() {
      return currentState;
    }
  });
}

function createActivationId(attachmentId, worldId, sceneId) {
  const hash = stableHash(`${attachmentId}::${worldId}::${sceneId}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `MAP_WORLD_BROWSER_ACTIVATION_${hash}`;
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldBrowserActivationFoundation");
  for (const fieldName of mapWorldBrowserActivationFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world browser activation foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    activationId: normalizeString(foundation.activationId, "activationId"),
    attachmentId: normalizeString(foundation.attachmentId, "attachmentId"),
    worldId: normalizeString(foundation.worldId, "worldId"),
    activationState: deepFreeze({
      ...asPlainObject(foundation.activationState, "activationState")
    }),
    displayResult: deepFreeze({
      ...asPlainObject(foundation.displayResult, "displayResult")
    }),
    validationResult: deepFreeze({
      ...asPlainObject(foundation.validationResult, "validationResult")
    }),
    attachment: deepFreeze(
      asPlainObject(foundation.attachment, "attachment")
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
    name: "MapWorldBrowserActivationFoundationValidationError"
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
