import {
  atlasEngineControlledVisualDemoActivationFoundationDefinition,
  buildAtlasEngineControlledVisualDemoActivationContext,
  validateAtlasEngineControlledVisualDemoActivationFoundation
} from "./atlas-engine-controlled-visual-demo-activation.mjs";
import {
  atlasEngineControlledPreviewDisplayFoundationDefinition
} from "./atlas-engine-controlled-preview-display-foundation.mjs";
import {
  atlasEngineFirstSceneVerificationFoundationDefinition
} from "./atlas-engine-first-scene-verification-foundation.mjs";

export const atlasEngineFirstVisualSceneCaptureRequiredFields = Object.freeze([
  "captureId",
  "activationId",
  "displaySessionId",
  "verificationId",
  "previewId",
  "renderExecutionId",
  "resultId",
  "executionId",
  "showcaseId",
  "locationRequest",
  "expectedSceneObjectCount"
]);

export const atlasEngineFirstVisualSceneCaptureStates = Object.freeze([
  "created",
  "preparing",
  "drawing",
  "captured",
  "verified",
  "closed",
  "failed"
]);

export const atlasEngineFirstVisualSceneCaptureFoundationDefinition =
  deepFreeze({
    captureId: "ATLAS_FIRST_VISUAL_SCENE_CAPTURE_001",
    activationId:
      atlasEngineControlledVisualDemoActivationFoundationDefinition.activationId,
    displaySessionId:
      atlasEngineControlledPreviewDisplayFoundationDefinition.displaySessionId,
    verificationId: atlasEngineFirstSceneVerificationFoundationDefinition.verificationId,
    previewId: atlasEngineFirstSceneVerificationFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineFirstSceneVerificationFoundationDefinition.renderExecutionId,
    resultId: atlasEngineFirstSceneVerificationFoundationDefinition.resultId,
    executionId: atlasEngineFirstSceneVerificationFoundationDefinition.executionId,
    showcaseId: atlasEngineFirstSceneVerificationFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineFirstSceneVerificationFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineFirstSceneVerificationFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildAtlasEngineFirstVisualSceneCaptureContext() {
  return Object.freeze(buildAtlasEngineControlledVisualDemoActivationContext());
}

export function validateAtlasEngineFirstVisualSceneCaptureFoundation(
  rawFoundation = atlasEngineFirstVisualSceneCaptureFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const activationResult =
      normalizedOptions.validateAtlasEngineControlledVisualDemoActivationFoundation(
        buildActivationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!activationResult.ok) {
      return freezeFailure(activationResult);
    }

    const activation = activationResult.atlasControlledVisualDemoActivation;

    validateActivationId(
      foundation.activationId,
      activation.activationId,
      activation.displaySessionId,
      activation.displayResult.lightingVerification.currentMode
    );
    validateDisplaySessionId(
      foundation.displaySessionId,
      activation.displaySessionId,
      foundation.locationRequest,
      activation.displayResult.lightingVerification.currentMode
    );
    validateSceneObjects(
      activation.displayResult.sceneObjects,
      foundation.expectedSceneObjectCount
    );
    validateDemoObjects(
      activation.displayResult.renderVerification.verifiedAssetIds
    );
    validateCameraVerification(activation.displayResult.cameraVerification);
    validateLightingVerification(activation.displayResult.lightingVerification);
    validateRendererVerification(activation.displayResult.renderVerification);
    validateDisplayState(activation.displayResult.displayState);

    const atlasFirstVisualSceneCapture = Object.freeze({
      captureId: createCaptureHash(
        foundation.captureId,
        activation.activationId,
        activation.displayResult.lightingVerification.currentMode
      ),
      activationId: activation.activationId,
      displaySessionId: activation.displaySessionId,
      sceneResult: Object.freeze({
        previewSceneId: activation.displayResult.previewSceneId,
        sceneObjects: activation.displayResult.sceneObjects,
        visibleState: "verified-visible",
        objectCount: activation.displayResult.sceneObjects.length
      }),
      captureState: Object.freeze({
        currentState: "verified",
        allowedStates: atlasEngineFirstVisualSceneCaptureStates,
        liveWorldRuntimeEnabled: false
      }),
      verificationResult: Object.freeze({
        activationSessionValid: true,
        displaySessionValid: true,
        sceneObjectsValid: true,
        cameraStateValid: true,
        lightingStateValid: true,
        rendererOutputValid: true,
        verifiedAssetIds:
          activation.displayResult.renderVerification.verifiedAssetIds
      }),
      captureSummary: Object.freeze({
        visibleState: "verified-visible",
        objectCount: activation.displayResult.renderVerification.objectCount,
        cameraResult: Object.freeze({
          profile: activation.displayResult.cameraVerification.profile,
          focusTarget: activation.displayResult.cameraVerification.focusTarget,
          orientation: activation.displayResult.cameraVerification.orientation,
          zoom: activation.displayResult.cameraVerification.zoom
        }),
        lightingResult: Object.freeze({
          currentMode:
            activation.displayResult.lightingVerification.currentMode,
          appearanceProfiles:
            activation.displayResult.lightingVerification.appearanceProfiles
        }),
        rendererResult: Object.freeze({
          rendererProfile:
            activation.displayResult.renderVerification.rendererProfile,
          payloadValid:
            activation.displayResult.renderVerification.rendererPayloadValid
        })
      }),
      metadata: Object.freeze({
        verificationId: activation.verificationId,
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
        closeCaptureSupported: true,
        releaseStateSupported: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        sameActivationInputProducesIdenticalCaptureResult: true,
        captureHash: createCaptureHash(
          foundation.captureId,
          activation.activationId,
          activation.displayResult.lightingVerification.currentMode
        )
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstVisualSceneCapture
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineFirstVisualSceneCaptureValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstVisualSceneCapture: null
    });
  }
}

export function createAtlasEngineFirstVisualSceneCaptureSession(
  rawFoundation = atlasEngineFirstVisualSceneCaptureFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_capture_required",
      message:
        "Atlas first visual scene capture sessions require manual: true.",
      atlasFirstVisualSceneCaptureSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_capture_required",
      message:
        "Atlas first visual scene capture sessions require isolated: true.",
      atlasFirstVisualSceneCaptureSession: null
    });
  }

  const validation = validateAtlasEngineFirstVisualSceneCaptureFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasFirstVisualSceneCaptureSession: null
    });
  }

  let captureState = "created";
  let captured = false;
  let closed = false;
  const capture = validation.atlasFirstVisualSceneCapture;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasFirstVisualSceneCaptureSession: Object.freeze({
      captureId: capture.captureId,
      activationId: capture.activationId,
      currentCaptureState() {
        return captureState;
      },
      startCapture(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first visual scene capture rejects capture after session closure.",
            captureResult: null
          });
        }

        if (requestOptions.manualCaptureAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_capture_authorization_required",
            message:
              "Atlas first visual scene capture requires manualCaptureAuthorized: true before capture.",
            captureResult: null
          });
        }

        if (captured) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_capture_prevented",
            message:
              "Atlas first visual scene capture prevents duplicate capture for the same activated scene.",
            captureResult: null
          });
        }

        captured = true;
        captureState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          captureResult: Object.freeze({
            captureId: capture.captureId,
            activationId: capture.activationId,
            displaySessionId: capture.displaySessionId,
            captureState,
            sceneResult: capture.sceneResult,
            verificationResult: capture.verificationResult,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeCaptureSession() {
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
        captureState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-first-visual-scene-capture-session-closed",
          releasedStateCount: capture.sceneResult.sceneObjects.length,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineFirstVisualSceneCaptureContext(),
    validateAtlasEngineControlledVisualDemoActivationFoundation:
      options.validateAtlasEngineControlledVisualDemoActivationFoundation ??
      validateAtlasEngineControlledVisualDemoActivationFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first visual scene capture foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    captureId: normalizePermanentId(foundation.captureId, "captureId"),
    activationId: normalizePermanentId(foundation.activationId, "activationId"),
    displaySessionId: normalizePermanentId(
      foundation.displaySessionId,
      "displaySessionId"
    ),
    verificationId: normalizePermanentId(
      foundation.verificationId,
      "verificationId"
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

function buildActivationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineControlledVisualDemoActivationFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateActivationId(
  expectedBaseId,
  receivedActivationId,
  displaySessionId,
  lightingMode
) {
  const expectedResolvedId = createActivationHash(
    expectedBaseId,
    displaySessionId,
    lightingMode
  );
  if (receivedActivationId !== expectedResolvedId) {
    throw createValidationError(
      "activation_id_mismatch",
      "Atlas first visual scene capture activationId must match the deterministic activation ID."
    );
  }
}

function validateDisplaySessionId(
  expectedBaseId,
  receivedDisplaySessionId,
  locationRequest,
  lightingMode
) {
  const resultId = createResultHash(
    atlasEngineFirstSceneVerificationFoundationDefinition.resultId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    lightingMode
  );
  const renderExecutionId = createRenderExecutionHash(
    atlasEngineFirstSceneVerificationFoundationDefinition.renderExecutionId,
    resultId,
    lightingMode
  );
  const previewId = createPreviewHash(
    atlasEngineFirstSceneVerificationFoundationDefinition.previewId,
    renderExecutionId,
    lightingMode
  );
  const expectedResolvedId = createDisplaySessionHash(
    expectedBaseId,
    previewId,
    lightingMode
  );
  if (receivedDisplaySessionId !== expectedResolvedId) {
    throw createValidationError(
      "display_session_id_mismatch",
      "Atlas first visual scene capture displaySessionId must match the deterministic display session ID."
    );
  }
}

function validateSceneObjects(sceneObjects, expectedCount) {
  if (!Array.isArray(sceneObjects) || sceneObjects.length !== expectedCount) {
    throw createValidationError(
      "scene_object_count_mismatch",
      "Atlas first visual scene capture requires the approved deterministic scene object count."
    );
  }
}

function validateDemoObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas first visual scene capture requires demo asset ${assetId}.`
      );
    }
  }
}

function validateCameraVerification(cameraVerification) {
  if (
    !cameraVerification ||
    cameraVerification.profileValid !== true ||
    cameraVerification.focusTargetValid !== true ||
    cameraVerification.orientationValid !== true ||
    cameraVerification.zoomValid !== true
  ) {
    throw createValidationError(
      "invalid_camera_verification",
      "Atlas first visual scene capture requires a fully verified camera state."
    );
  }
}

function validateLightingVerification(lightingVerification) {
  if (
    !lightingVerification ||
    lightingVerification.lightingProfileValid !== true ||
    typeof lightingVerification.currentMode !== "string" ||
    !Array.isArray(lightingVerification.supportedModes) ||
    !lightingVerification.supportedModes.includes(
      lightingVerification.currentMode
    )
  ) {
    throw createValidationError(
      "invalid_lighting_verification",
      "Atlas first visual scene capture requires a fully verified lighting state."
    );
  }
}

function validateRendererVerification(renderVerification) {
  if (
    !renderVerification ||
    renderVerification.rendererPayloadValid !== true ||
    renderVerification.rendererProfile !== "custom-2.5d-passive"
  ) {
    throw createValidationError(
      "invalid_renderer_verification",
      "Atlas first visual scene capture requires a valid passive Custom 2.5D renderer output."
    );
  }
}

function validateDisplayState(displayState) {
  if (displayState !== "verified") {
    throw createValidationError(
      "invalid_display_state",
      "Atlas first visual scene capture requires a verified display state."
    );
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

function createActivationHash(baseId, displaySessionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::activation`
  )}`;
}

function createCaptureHash(baseId, activationId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${activationId}::${lightingMode}::capture`
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
    atlasFirstVisualSceneCapture: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstVisualSceneCaptureRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first visual scene capture foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineFirstVisualSceneCaptureValidationError";
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
