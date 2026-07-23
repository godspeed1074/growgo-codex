import {
  atlasEngineControlledPreviewDisplayFoundationDefinition,
  buildAtlasEngineControlledPreviewDisplayContext,
  validateAtlasEngineControlledPreviewDisplayFoundation
} from "./atlas-engine-controlled-preview-display-foundation.mjs";
import {
  atlasEngineFirstVisualPreviewOutputFoundationDefinition
} from "./atlas-engine-first-visual-preview-output-foundation.mjs";
import {
  atlasEngineControlledDemoRenderExecutionFoundationDefinition
} from "./atlas-engine-controlled-demo-render-execution-foundation.mjs";
import {
  atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition
} from "./atlas-engine-showcase-result-to-custom-25d-demo-bridge.mjs";

export const atlasEngineFirstSceneVerificationRequiredFields = Object.freeze([
  "verificationId",
  "displaySessionId",
  "previewId",
  "renderExecutionId",
  "resultId",
  "executionId",
  "showcaseId",
  "locationRequest",
  "expectedSceneObjectCount"
]);

export const atlasEngineFirstSceneVerificationStates = Object.freeze([
  "created",
  "checking",
  "validated",
  "failed",
  "closed"
]);

export const atlasEngineFirstSceneVerificationFoundationDefinition =
  deepFreeze({
    verificationId: "ATLAS_FIRST_SCENE_VERIFICATION_001",
    displaySessionId:
      atlasEngineControlledPreviewDisplayFoundationDefinition.displaySessionId,
    previewId: atlasEngineFirstVisualPreviewOutputFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.renderExecutionId,
    resultId: atlasEngineControlledDemoRenderExecutionFoundationDefinition.resultId,
    executionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.executionId,
    showcaseId:
      atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineControlledPreviewDisplayFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineControlledPreviewDisplayFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildAtlasEngineFirstSceneVerificationContext() {
  return Object.freeze(buildAtlasEngineControlledPreviewDisplayContext());
}

export function validateAtlasEngineFirstSceneVerificationFoundation(
  rawFoundation = atlasEngineFirstSceneVerificationFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const displayResult =
      normalizedOptions.validateAtlasEngineControlledPreviewDisplayFoundation(
        buildDisplayDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!displayResult.ok) {
      return freezeFailure(displayResult);
    }

    const display = displayResult.atlasControlledPreviewDisplay;

    validateDisplaySessionId(
      foundation.displaySessionId,
      display.displaySessionId,
      display.previewId,
      display.lightingState.currentMode
    );
    validatePreviewId(
      foundation.previewId,
      display.previewId,
      display.renderExecutionId,
      display.lightingState.currentMode
    );
    validateRenderExecutionId(
      foundation.renderExecutionId,
      display.renderExecutionId,
      foundation.locationRequest,
      display.lightingState.currentMode
    );
    validateSceneObjects(
      display.sceneData.sceneObjects,
      foundation.expectedSceneObjectCount
    );
    validateDemoObjects(display.verificationResult.verifiedAssetIds);
    validateCameraState(display.cameraState);
    validateLightingState(display.lightingState);
    validateRendererPayload(
      display.sceneData.sceneObjects,
      display.sceneData.rendererProfile
    );

    const atlasFirstSceneVerification = Object.freeze({
      verificationId: createVerificationHash(
        foundation.verificationId,
        display.displaySessionId,
        display.lightingState.currentMode
      ),
      displaySessionId: display.displaySessionId,
      sceneObjects: display.sceneData.sceneObjects,
      cameraVerification: Object.freeze({
        profileValid: true,
        focusTargetValid: true,
        orientationValid: true,
        zoomValid: true,
        profile: display.cameraState.profile,
        focusTarget: display.cameraState.focusTarget,
        orientation: display.cameraState.orientation,
        zoom: display.cameraState.zoom
      }),
      lightingVerification: Object.freeze({
        lightingProfileValid: true,
        currentMode: display.lightingState.currentMode,
        supportedModes: display.lightingState.supportedModes,
        appearanceProfiles: display.lightingState.appearanceProfiles
      }),
      renderVerification: Object.freeze({
        rendererPayloadValid: true,
        rendererProfile: display.sceneData.rendererProfile,
        objectCount: display.sceneData.objectCount,
        verifiedAssetIds: display.verificationResult.verifiedAssetIds
      }),
      resultState: Object.freeze({
        currentState: "validated",
        allowedStates: atlasEngineFirstSceneVerificationStates,
        liveWorldRuntimeEnabled: false
      }),
      metadata: Object.freeze({
        previewId: display.previewId,
        renderExecutionId: display.renderExecutionId,
        previewSceneId: display.sceneData.previewSceneId,
        manualOnly: true,
        isolated: true,
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveWorldRuntimeEnabled: false,
        rendererModified: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false
      }),
      cleanupState: Object.freeze({
        closeVerificationSupported: true,
        releaseStateSupported: true,
        duplicateVerificationRejected: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        sameDisplaySessionProducesIdenticalVerificationOutput: true,
        verificationHash: createVerificationHash(
          foundation.verificationId,
          display.displaySessionId,
          display.lightingState.currentMode
        )
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstSceneVerification
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineFirstSceneVerificationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstSceneVerification: null
    });
  }
}

export function createAtlasEngineFirstSceneVerificationSession(
  rawFoundation = atlasEngineFirstSceneVerificationFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_verification_required",
      message:
        "Atlas first scene verification sessions require manual: true.",
      atlasFirstSceneVerificationSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_verification_required",
      message:
        "Atlas first scene verification sessions require isolated: true.",
      atlasFirstSceneVerificationSession: null
    });
  }

  const validation = validateAtlasEngineFirstSceneVerificationFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasFirstSceneVerificationSession: null
    });
  }

  let verificationState = "created";
  let verified = false;
  let closed = false;
  const verification = validation.atlasFirstSceneVerification;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasFirstSceneVerificationSession: Object.freeze({
      verificationId: verification.verificationId,
      displaySessionId: verification.displaySessionId,
      currentVerificationState() {
        return verificationState;
      },
      startVerification(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first scene verification rejects verification after session closure.",
            verificationActivation: null
          });
        }

        if (requestOptions.manualVerificationAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_verification_authorization_required",
            message:
              "Atlas first scene verification requires manualVerificationAuthorized: true before verification.",
            verificationActivation: null
          });
        }

        if (verified) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_verification_prevented",
            message:
              "Atlas first scene verification prevents duplicate verification activation for the same prepared session.",
            verificationActivation: null
          });
        }

        verified = true;
        verificationState = "validated";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          verificationActivation: Object.freeze({
            verificationId: verification.verificationId,
            displaySessionId: verification.displaySessionId,
            resultState: verification.resultState,
            cameraVerification: verification.cameraVerification,
            lightingVerification: verification.lightingVerification,
            renderVerification: verification.renderVerification,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeVerificationSession() {
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
        verificationState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-first-scene-verification-session-closed",
          releasedStateCount: verification.sceneObjects.length,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineFirstSceneVerificationContext(),
    validateAtlasEngineControlledPreviewDisplayFoundation:
      options.validateAtlasEngineControlledPreviewDisplayFoundation ??
      validateAtlasEngineControlledPreviewDisplayFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first scene verification foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    verificationId: normalizePermanentId(
      foundation.verificationId,
      "verificationId"
    ),
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

function buildDisplayDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineControlledPreviewDisplayFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateDisplaySessionId(
  expectedBaseId,
  receivedDisplaySessionId,
  previewId,
  lightingMode
) {
  const expectedResolvedId = createDisplaySessionHash(
    expectedBaseId,
    previewId,
    lightingMode
  );
  if (receivedDisplaySessionId !== expectedResolvedId) {
    throw createValidationError(
      "display_session_id_mismatch",
      "Atlas first scene verification displaySessionId must match the deterministic preview display ID."
    );
  }
}

function validatePreviewId(expectedBaseId, receivedPreviewId, renderExecutionId, lightingMode) {
  const expectedResolvedId = createPreviewHash(
    expectedBaseId,
    renderExecutionId,
    lightingMode
  );
  if (receivedPreviewId !== expectedResolvedId) {
    throw createValidationError(
      "preview_id_mismatch",
      "Atlas first scene verification previewId must match the deterministic preview output ID."
    );
  }
}

function validateRenderExecutionId(
  expectedBaseId,
  receivedRenderExecutionId,
  locationRequest,
  lightingMode
) {
  const resultId = createResultHash(
    atlasEngineControlledDemoRenderExecutionFoundationDefinition.resultId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    lightingMode
  );
  const expectedResolvedId = createRenderExecutionHash(
    expectedBaseId,
    resultId,
    lightingMode
  );
  if (receivedRenderExecutionId !== expectedResolvedId) {
    throw createValidationError(
      "render_execution_id_mismatch",
      "Atlas first scene verification renderExecutionId must match the deterministic render execution ID."
    );
  }
}

function validateSceneObjects(sceneObjects, expectedCount) {
  if (!Array.isArray(sceneObjects) || sceneObjects.length !== expectedCount) {
    throw createValidationError(
      "scene_object_count_mismatch",
      "Atlas first scene verification requires the approved deterministic scene object count."
    );
  }
}

function validateDemoObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas first scene verification requires demo asset ${assetId}.`
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
    !Number.isFinite(cameraState.zoom)
  ) {
    throw createValidationError(
      "invalid_camera_state",
      "Atlas first scene verification requires valid camera profile, focus target, orientation, and zoom."
    );
  }
}

function validateLightingState(lightingState) {
  if (
    !lightingState ||
    typeof lightingState.currentMode !== "string" ||
    !Array.isArray(lightingState.supportedModes) ||
    !lightingState.supportedModes.includes(lightingState.currentMode)
  ) {
    throw createValidationError(
      "invalid_lighting_state",
      "Atlas first scene verification requires an approved lighting profile."
    );
  }
}

function validateRendererPayload(sceneObjects, rendererProfile) {
  if (rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "invalid_renderer_profile",
      "Atlas first scene verification requires the approved passive Custom 2.5D renderer profile."
    );
  }

  for (const sceneObject of sceneObjects) {
    if (!permanentIdPattern.test(sceneObject.assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas first scene verification requires permanent asset IDs in scene objects."
      );
    }
  }
}

function createResultHash(baseId, locationId, worldSeed, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${lightingMode}::output-package`
  )}`;
}

function createRenderExecutionHash(baseId, resultId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${resultId}::${lightingMode}::render-execution`
  )}`;
}

function createPreviewHash(baseId, renderExecutionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${renderExecutionId}::${lightingMode}::visual-preview`
  )}`;
}

function createDisplaySessionHash(baseId, previewId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${previewId}::${lightingMode}::display`
  )}`;
}

function createVerificationHash(baseId, displaySessionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::verification`
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
    atlasFirstSceneVerification: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstSceneVerificationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first scene verification foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineFirstSceneVerificationValidationError";
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
