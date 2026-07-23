import {
  atlasEngineFirstSceneVerificationFoundationDefinition,
  buildAtlasEngineFirstSceneVerificationContext,
  validateAtlasEngineFirstSceneVerificationFoundation
} from "./atlas-engine-first-scene-verification-foundation.mjs";
import {
  atlasEngineControlledPreviewDisplayFoundationDefinition
} from "./atlas-engine-controlled-preview-display-foundation.mjs";
import {
  atlasEngineFirstVisualPreviewOutputFoundationDefinition
} from "./atlas-engine-first-visual-preview-output-foundation.mjs";

export const atlasEngineControlledVisualDemoActivationRequiredFields =
  Object.freeze([
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

export const atlasEngineControlledVisualDemoActivationStates = Object.freeze([
  "requested",
  "authorizing",
  "activated",
  "displaying",
  "verified",
  "closed",
  "failed"
]);

export const atlasEngineControlledVisualDemoActivationFoundationDefinition =
  deepFreeze({
    activationId: "ATLAS_CONTROLLED_VISUAL_DEMO_ACTIVATION_001",
    displaySessionId:
      atlasEngineControlledPreviewDisplayFoundationDefinition.displaySessionId,
    verificationId: atlasEngineFirstSceneVerificationFoundationDefinition.verificationId,
    previewId: atlasEngineFirstVisualPreviewOutputFoundationDefinition.previewId,
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

export function buildAtlasEngineControlledVisualDemoActivationContext() {
  return Object.freeze(buildAtlasEngineFirstSceneVerificationContext());
}

export function validateAtlasEngineControlledVisualDemoActivationFoundation(
  rawFoundation = atlasEngineControlledVisualDemoActivationFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const verificationResult =
      normalizedOptions.validateAtlasEngineFirstSceneVerificationFoundation(
        buildVerificationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!verificationResult.ok) {
      return freezeFailure(verificationResult);
    }

    const verification = verificationResult.atlasFirstSceneVerification;

    validateVerificationId(
      foundation.verificationId,
      verification.verificationId,
      verification.displaySessionId,
      verification.lightingVerification.currentMode
    );
    validateDisplaySessionId(
      foundation.displaySessionId,
      verification.displaySessionId,
      foundation.locationRequest,
      verification.lightingVerification.currentMode
    );
    validateSceneObjects(
      verification.sceneObjects,
      foundation.expectedSceneObjectCount
    );
    validateDemoObjects(verification.renderVerification.verifiedAssetIds);
    validateCameraVerification(verification.cameraVerification);
    validateLightingVerification(verification.lightingVerification);
    validateRendererPayload(
      verification.sceneObjects,
      verification.renderVerification.rendererProfile
    );

    const atlasControlledVisualDemoActivation = Object.freeze({
      activationId: createActivationHash(
        foundation.activationId,
        verification.displaySessionId,
        verification.lightingVerification.currentMode
      ),
      displaySessionId: verification.displaySessionId,
      verificationId: verification.verificationId,
      activationState: Object.freeze({
        currentState: "verified",
        allowedStates: atlasEngineControlledVisualDemoActivationStates,
        manualStartRequired: true,
        failClosedByDefault: true,
        liveWorldRuntimeEnabled: false
      }),
      displayResult: Object.freeze({
        previewSceneId: verification.metadata.previewSceneId,
        sceneObjects: verification.sceneObjects,
        cameraVerification: verification.cameraVerification,
        lightingVerification: verification.lightingVerification,
        renderVerification: verification.renderVerification,
        displayState: "verified"
      }),
      cleanupState: Object.freeze({
        closeActivationSupported: true,
        releaseStateSupported: true,
        duplicateActivationRejected: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        sameVerifiedSceneProducesIdenticalActivationOutput: true,
        activationHash: createActivationHash(
          foundation.activationId,
          verification.displaySessionId,
          verification.lightingVerification.currentMode
        )
      }),
      metadata: Object.freeze({
        verificationId: verification.verificationId,
        previewId: verification.metadata.previewId,
        renderExecutionId: verification.metadata.renderExecutionId,
        manualOnly: true,
        isolated: true,
        passiveOnly: true,
        realMapAttached: false,
        playerRuntimeEnabled: false,
        gpsConnected: false,
        externalMapServicesQueried: false,
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
      atlasControlledVisualDemoActivation
    });
  } catch (error) {
    if (
      error?.name !== "AtlasEngineControlledVisualDemoActivationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasControlledVisualDemoActivation: null
    });
  }
}

export function createAtlasEngineControlledVisualDemoActivationSession(
  rawFoundation = atlasEngineControlledVisualDemoActivationFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_activation_required",
      message:
        "Atlas controlled visual demo activation sessions require manual: true.",
      atlasControlledVisualDemoActivationSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_activation_required",
      message:
        "Atlas controlled visual demo activation sessions require isolated: true.",
      atlasControlledVisualDemoActivationSession: null
    });
  }

  const validation = validateAtlasEngineControlledVisualDemoActivationFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasControlledVisualDemoActivationSession: null
    });
  }

  let activationState = "requested";
  let activated = false;
  let closed = false;
  const activation = validation.atlasControlledVisualDemoActivation;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasControlledVisualDemoActivationSession: Object.freeze({
      activationId: activation.activationId,
      displaySessionId: activation.displaySessionId,
      currentActivationState() {
        return activationState;
      },
      startActivation(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas controlled visual demo activation rejects activation after session closure.",
            activationResult: null
          });
        }

        if (requestOptions.manualStart !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_start_required",
            message:
              "Atlas controlled visual demo activation requires manualStart: true before activation.",
            activationResult: null
          });
        }

        if (activated) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_activation_prevented",
            message:
              "Atlas controlled visual demo activation prevents duplicate activation for the same verified scene.",
            activationResult: null
          });
        }

        activated = true;
        activationState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          activationResult: Object.freeze({
            activationId: activation.activationId,
            displaySessionId: activation.displaySessionId,
            verificationId: activation.verificationId,
            activationState,
            displayResult: activation.displayResult,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeActivationSession() {
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
        activationState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-controlled-visual-demo-activation-session-closed",
          releasedStateCount: activation.displayResult.sceneObjects.length,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEngineControlledVisualDemoActivationContext(),
    validateAtlasEngineFirstSceneVerificationFoundation:
      options.validateAtlasEngineFirstSceneVerificationFoundation ??
      validateAtlasEngineFirstSceneVerificationFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine controlled visual demo activation foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
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

function buildVerificationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineFirstSceneVerificationFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateVerificationId(
  expectedBaseId,
  receivedVerificationId,
  displaySessionId,
  lightingMode
) {
  const expectedResolvedId = createVerificationHash(
    expectedBaseId,
    displaySessionId,
    lightingMode
  );
  if (receivedVerificationId !== expectedResolvedId) {
    throw createValidationError(
      "verification_id_mismatch",
      "Atlas controlled visual demo activation verificationId must match the deterministic scene verification ID."
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
      "Atlas controlled visual demo activation displaySessionId must match the deterministic preview display ID."
    );
  }
}

function validateSceneObjects(sceneObjects, expectedCount) {
  if (!Array.isArray(sceneObjects) || sceneObjects.length !== expectedCount) {
    throw createValidationError(
      "scene_object_count_mismatch",
      "Atlas controlled visual demo activation requires the approved deterministic scene object count."
    );
  }
}

function validateDemoObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas controlled visual demo activation requires demo asset ${assetId}.`
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
      "Atlas controlled visual demo activation requires a fully verified camera profile."
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
      "Atlas controlled visual demo activation requires a fully verified lighting profile."
    );
  }
}

function validateRendererPayload(sceneObjects, rendererProfile) {
  if (rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "invalid_renderer_profile",
      "Atlas controlled visual demo activation requires the approved passive Custom 2.5D renderer profile."
    );
  }

  for (const sceneObject of sceneObjects) {
    if (!permanentIdPattern.test(sceneObject.assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas controlled visual demo activation requires permanent asset IDs in scene objects."
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

function createActivationHash(baseId, displaySessionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::activation`
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
    atlasControlledVisualDemoActivation: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineControlledVisualDemoActivationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine controlled visual demo activation foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineControlledVisualDemoActivationValidationError";
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
