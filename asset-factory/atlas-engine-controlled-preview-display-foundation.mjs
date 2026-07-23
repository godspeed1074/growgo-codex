import {
  atlasEngineFirstVisualPreviewOutputFoundationDefinition,
  buildAtlasEngineFirstVisualPreviewOutputContext,
  validateAtlasEngineFirstVisualPreviewOutputFoundation
} from "./atlas-engine-first-visual-preview-output-foundation.mjs";
import {
  atlasEngineControlledDemoRenderExecutionFoundationDefinition
} from "./atlas-engine-controlled-demo-render-execution-foundation.mjs";
import {
  atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition
} from "./atlas-engine-showcase-result-to-custom-25d-demo-bridge.mjs";

export const atlasEngineControlledPreviewDisplayRequiredFields = Object.freeze([
  "displaySessionId",
  "previewId",
  "renderExecutionId",
  "resultId",
  "executionId",
  "showcaseId",
  "locationRequest",
  "expectedSceneObjectCount"
]);

export const atlasEngineControlledPreviewDisplayStates = Object.freeze([
  "created",
  "preparing",
  "displaying",
  "verified",
  "hidden",
  "closed",
  "failed"
]);

export const atlasEngineControlledPreviewDisplayFoundationDefinition =
  deepFreeze({
    displaySessionId: "ATLAS_CONTROLLED_PREVIEW_DISPLAY_001",
    previewId: atlasEngineFirstVisualPreviewOutputFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.renderExecutionId,
    resultId: atlasEngineControlledDemoRenderExecutionFoundationDefinition.resultId,
    executionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.executionId,
    showcaseId:
      atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineFirstVisualPreviewOutputFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineFirstVisualPreviewOutputFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildAtlasEngineControlledPreviewDisplayContext() {
  return Object.freeze(buildAtlasEngineFirstVisualPreviewOutputContext());
}

export function validateAtlasEngineControlledPreviewDisplayFoundation(
  rawFoundation = atlasEngineControlledPreviewDisplayFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const previewResult =
      normalizedOptions.validateAtlasEngineFirstVisualPreviewOutputFoundation(
        buildPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!previewResult.ok) {
      return freezeFailure(previewResult);
    }

    const preview = previewResult.atlasFirstVisualPreviewOutput;

    validatePreviewId(
      foundation.previewId,
      preview.previewId,
      preview.renderExecutionId,
      preview.lightingState.currentMode
    );
    validateRenderExecutionId(
      foundation.renderExecutionId,
      preview.renderExecutionId,
      preview.metadata.resultId,
      preview.lightingState.currentMode
    );
    validateExecutionId(
      foundation.executionId,
      preview.metadata.executionId,
      foundation.locationRequest,
      preview.lightingState.currentMode
    );
    validateShowcaseId(
      foundation.showcaseId,
      preview.metadata.showcaseId,
      foundation.locationRequest
    );
    validateSceneObjects(
      preview.sceneObjects,
      foundation.expectedSceneObjectCount
    );
    validateDemoObjects(preview.verificationResult.verifiedAssetIds);
    validateCameraState(preview.cameraState);
    validateLightingState(preview.lightingState);
    validateRendererPayload(preview.sceneObjects, preview.metadata.rendererProfile);

    const atlasControlledPreviewDisplay = Object.freeze({
      displaySessionId: createDisplaySessionHash(
        foundation.displaySessionId,
        preview.previewId,
        preview.lightingState.currentMode
      ),
      previewId: preview.previewId,
      renderExecutionId: preview.renderExecutionId,
      displayState: Object.freeze({
        currentState: "verified",
        allowedStates: atlasEngineControlledPreviewDisplayStates,
        manualOnly: true,
        isolated: true,
        displayAuthorized: false,
        liveWorldRuntimeEnabled: false
      }),
      sceneData: Object.freeze({
        previewSceneId: preview.metadata.previewSceneId,
        rendererProfile: preview.metadata.rendererProfile,
        sceneObjects: preview.sceneObjects,
        objectCount: preview.sceneObjects.length,
        duplicateSessionsPrevented: true
      }),
      cameraState: Object.freeze({
        ...preview.cameraState
      }),
      lightingState: Object.freeze({
        ...preview.lightingState
      }),
      verificationResult: Object.freeze({
        previewOutputValid: true,
        sceneObjectsValid: true,
        cameraMetadataValid: true,
        lightingStateValid: true,
        rendererPayloadValid: true,
        duplicateSessionsPrevented: true,
        verifiedAssetIds: preview.verificationResult.verifiedAssetIds,
        verifiedRendererPayloadCount:
          preview.verificationResult.verifiedRendererPayloadCount
      }),
      cleanupState: Object.freeze({
        hideDisplaySupported: true,
        closeSessionSupported: true,
        releaseStateSupported: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        samePreviewInputProducesIdenticalDisplayOutput: true,
        displayHash: createDisplaySessionHash(
          foundation.displaySessionId,
          preview.previewId,
          preview.lightingState.currentMode
        )
      }),
      compatibility: Object.freeze({
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveWorldRuntimeEnabled: false,
        rendererModified: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasControlledPreviewDisplay
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineControlledPreviewDisplayValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasControlledPreviewDisplay: null
    });
  }
}

export function createAtlasEngineControlledPreviewDisplaySession(
  rawFoundation = atlasEngineControlledPreviewDisplayFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_display_required",
      message:
        "Atlas controlled preview display sessions require manual: true.",
      atlasControlledPreviewDisplaySession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_display_required",
      message:
        "Atlas controlled preview display sessions require isolated: true.",
      atlasControlledPreviewDisplaySession: null
    });
  }

  const validation = validateAtlasEngineControlledPreviewDisplayFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasControlledPreviewDisplaySession: null
    });
  }

  let displayState = "created";
  let displayGranted = false;
  let hidden = false;
  let closed = false;
  const display = validation.atlasControlledPreviewDisplay;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasControlledPreviewDisplaySession: Object.freeze({
      displaySessionId: display.displaySessionId,
      previewId: display.previewId,
      currentDisplayState() {
        return displayState;
      },
      showDisplay(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas controlled preview display rejects display activation after session closure.",
            displayActivation: null
          });
        }

        if (requestOptions.manualDisplayAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_display_authorization_required",
            message:
              "Atlas controlled preview display requires manualDisplayAuthorized: true before display.",
            displayActivation: null
          });
        }

        if (displayGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_display_prevented",
            message:
              "Atlas controlled preview display prevents duplicate display activation for the same prepared session.",
            displayActivation: null
          });
        }

        displayGranted = true;
        hidden = false;
        displayState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          displayActivation: Object.freeze({
            displaySessionId: display.displaySessionId,
            previewId: display.previewId,
            displayState,
            sceneData: display.sceneData,
            cameraState: display.cameraState,
            lightingState: display.lightingState,
            verificationResult: display.verificationResult,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      hideDisplay() {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas controlled preview display rejects hide requests after session closure.",
            displayHidden: null
          });
        }

        hidden = true;
        displayState = "hidden";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          displayHidden: Object.freeze({
            displaySessionId: display.displaySessionId,
            previewId: display.previewId,
            displayState,
            releasedSceneObjectCount: display.sceneData.objectCount,
            affectedLiveRuntime: false
          })
        });
      },
      closeDisplaySession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        displayState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: hidden
            ? "atlas-controlled-preview-display-session-closed-after-hide"
            : "atlas-controlled-preview-display-session-closed",
          releasedStateCount: display.sceneData.objectCount,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEngineControlledPreviewDisplayContext(),
    validateAtlasEngineFirstVisualPreviewOutputFoundation:
      options.validateAtlasEngineFirstVisualPreviewOutputFoundation ??
      validateAtlasEngineFirstVisualPreviewOutputFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine controlled preview display foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    displaySessionId: normalizePermanentId(
      foundation.displaySessionId,
      "displaySessionId"
    ),
    previewId: normalizePermanentId(foundation.previewId, "previewId"),
    renderExecutionId: normalizePermanentId(
      foundation.renderExecutionId,
      "renderExecutionId"
    ),
    resultId: normalizePermanentId(foundation.resultId, "resultId"),
    executionId: normalizePermanentId(foundation.executionId, "executionId"),
    showcaseId: normalizePermanentId(foundation.showcaseId, "showcaseId"),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedSceneObjectCount: normalizePositiveInteger(
      foundation.expectedSceneObjectCount,
      "expectedSceneObjectCount"
    )
  });
}

function buildPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineFirstVisualPreviewOutputFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validatePreviewId(expectedBaseId, receivedPreviewId, renderExecutionId, renderMode) {
  const expectedResolvedId = createPreviewHash(
    expectedBaseId,
    renderExecutionId,
    renderMode
  );
  if (receivedPreviewId !== expectedResolvedId) {
    throw createValidationError(
      "preview_id_mismatch",
      "Atlas controlled preview display previewId must match the deterministic visual preview ID."
    );
  }
}

function validateRenderExecutionId(
  expectedBaseId,
  receivedRenderExecutionId,
  resultId,
  renderMode
) {
  const expectedResolvedId = createRenderExecutionHash(
    expectedBaseId,
    resultId,
    renderMode
  );
  if (receivedRenderExecutionId !== expectedResolvedId) {
    throw createValidationError(
      "render_execution_id_mismatch",
      "Atlas controlled preview display renderExecutionId must match the deterministic render execution ID."
    );
  }
}

function validateExecutionId(
  expectedExecutionId,
  receivedExecutionId,
  locationRequest,
  renderMode
) {
  const expectedResolvedId = createExecutionHash(
    expectedExecutionId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    renderMode
  );
  if (receivedExecutionId !== expectedResolvedId) {
    throw createValidationError(
      "execution_id_mismatch",
      "Atlas controlled preview display executionId must match the deterministic execution ID."
    );
  }
}

function validateShowcaseId(expectedShowcaseId, receivedShowcaseId, locationRequest) {
  const expectedResolvedId = createShowcaseId(
    expectedShowcaseId,
    locationRequest.locationId,
    locationRequest.worldSeed
  );
  if (receivedShowcaseId !== expectedResolvedId) {
    throw createValidationError(
      "showcase_id_mismatch",
      "Atlas controlled preview display showcaseId must match the deterministic showcase ID."
    );
  }
}

function validateSceneObjects(sceneObjects, expectedCount) {
  if (!Array.isArray(sceneObjects) || sceneObjects.length !== expectedCount) {
    throw createValidationError(
      "scene_object_count_mismatch",
      "Atlas controlled preview display requires the approved deterministic scene object count."
    );
  }

  for (const sceneObject of sceneObjects) {
    if (
      typeof sceneObject.objectId !== "string" ||
      typeof sceneObject.assetId !== "string" ||
      typeof sceneObject.category !== "string" ||
      typeof sceneObject.lodProfile !== "string"
    ) {
      throw createValidationError(
        "invalid_scene_object",
        "Atlas controlled preview display scene objects must expose deterministic object identity and renderer-ready metadata."
      );
    }
  }
}

function validateDemoObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas controlled preview display requires demo asset ${assetId}.`
      );
    }
  }
}

function validateCameraState(cameraState) {
  if (
    !cameraState ||
    typeof cameraState.profile !== "string" ||
    typeof cameraState.focusTarget !== "string" ||
    typeof cameraState.orientation !== "string" ||
    typeof cameraState.viewpoint !== "string" ||
    !Number.isFinite(cameraState.zoom)
  ) {
    throw createValidationError(
      "invalid_camera_state",
      "Atlas controlled preview display requires valid camera profile, focus target, orientation, viewpoint, and zoom metadata."
    );
  }
}

function validateLightingState(lightingState) {
  if (
    !lightingState ||
    !Array.isArray(lightingState.supportedModes) ||
    !lightingState.supportedModes.includes(lightingState.currentMode) ||
    !Array.isArray(lightingState.appearanceProfiles) ||
    lightingState.appearanceProfiles.length !== 3
  ) {
    throw createValidationError(
      "invalid_lighting_state",
      "Atlas controlled preview display requires approved day, sunset, and night lighting metadata."
    );
  }
}

function validateRendererPayload(sceneObjects, rendererProfile) {
  if (rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "invalid_renderer_profile",
      "Atlas controlled preview display requires the approved passive Custom 2.5D renderer profile."
    );
  }

  for (const sceneObject of sceneObjects) {
    if (!permanentIdPattern.test(sceneObject.assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas controlled preview display requires permanent asset IDs in scene data."
      );
    }
  }
}

function createPreviewHash(baseId, renderExecutionId, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${renderExecutionId}::${renderMode}::visual-preview`
  )}`;
}

function createRenderExecutionHash(baseId, resultId, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${resultId}::${renderMode}::render-execution`
  )}`;
}

function createExecutionHash(baseId, locationId, worldSeed, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${renderMode}::execution`
  )}`;
}

function createShowcaseId(baseId, locationId, worldSeed) {
  return `${baseId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
}

function createDisplaySessionHash(baseId, previewId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${previewId}::${lightingMode}::display`
  )}`;
}

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    atlasControlledPreviewDisplay: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineControlledPreviewDisplayRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine controlled preview display foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  return Object.freeze({
    locationId: normalizePermanentId(
      locationRequest.locationId,
      "locationRequest.locationId"
    ),
    latitude: normalizeFiniteNumber(
      locationRequest.latitude,
      "locationRequest.latitude"
    ),
    longitude: normalizeFiniteNumber(
      locationRequest.longitude,
      "locationRequest.longitude"
    ),
    region: normalizeStringValue(locationRequest.region, "locationRequest.region"),
    environmentType: normalizeStringValue(
      locationRequest.environmentType,
      "locationRequest.environmentType"
    ),
    worldSeed: normalizeStringValue(
      locationRequest.worldSeed,
      "locationRequest.worldSeed"
    )
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must use the approved permanent ID format.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }
  return Number(value);
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "AtlasEngineControlledPreviewDisplayValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
