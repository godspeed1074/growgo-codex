import {
  atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition,
  buildAtlasEngineShowcaseResultToCustom25DDemoBridgeContext,
  validateAtlasEngineShowcaseResultToCustom25DDemoBridge
} from "./atlas-engine-showcase-result-to-custom-25d-demo-bridge.mjs";
import {
  atlasEngineShowcaseOutputPackageFoundationDefinition,
  validateAtlasEngineShowcaseOutputPackageFoundation
} from "./atlas-engine-showcase-output-package-foundation.mjs";
import {
  atlasEngineShowcaseExecutionFoundationDefinition,
  validateAtlasEngineShowcaseExecutionFoundation
} from "./atlas-engine-showcase-execution-foundation.mjs";
import {
  atlasEnginePreviewRendererIntegrationFoundationDefinition,
  validateAtlasEnginePreviewRendererIntegrationFoundation
} from "./atlas-engine-preview-renderer-integration-foundation.mjs";
import {
  syntheticWorldActualCustom25DRenderVerificationDefinition,
  validateSyntheticWorldActualCustom25DRenderVerification
} from "./synthetic-world-actual-custom-25d-render-verification.mjs";

export const atlasEngineControlledDemoRenderExecutionRequiredFields =
  Object.freeze([
    "renderExecutionId",
    "resultId",
    "executionId",
    "showcaseId",
    "locationRequest",
    "expectedRendererPayloadCount"
  ]);

export const atlasEngineControlledDemoRenderExecutionStates = Object.freeze([
  "created",
  "preparing",
  "executing",
  "verified",
  "completed",
  "failed",
  "closed"
]);

export const atlasEngineControlledDemoRenderExecutionFoundationDefinition =
  deepFreeze({
    renderExecutionId: "ATLAS_CONTROLLED_DEMO_RENDER_EXECUTION_001",
    resultId: atlasEngineShowcaseOutputPackageFoundationDefinition.resultId,
    executionId: atlasEngineShowcaseExecutionFoundationDefinition.executionId,
    showcaseId:
      atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition.locationRequest
    }),
    expectedRendererPayloadCount:
      atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEngineControlledDemoRenderExecutionContext() {
  return Object.freeze(buildAtlasEngineShowcaseResultToCustom25DDemoBridgeContext());
}

export function validateAtlasEngineControlledDemoRenderExecutionFoundation(
  rawFoundation = atlasEngineControlledDemoRenderExecutionFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const outputPackageResult =
      normalizedOptions.validateAtlasEngineShowcaseOutputPackageFoundation(
        buildOutputPackageDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!outputPackageResult.ok) {
      return freezeFailure(outputPackageResult);
    }

    const executionResult =
      normalizedOptions.validateAtlasEngineShowcaseExecutionFoundation(
        buildExecutionDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!executionResult.ok) {
      return freezeFailure(executionResult);
    }

    const bridgeResult =
      normalizedOptions.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
        buildBridgeDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const rendererIntegrationResult =
      normalizedOptions.validateAtlasEnginePreviewRendererIntegrationFoundation(
        atlasEnginePreviewRendererIntegrationFoundationDefinition,
        { context: normalizedOptions.context }
      );
    if (!rendererIntegrationResult.ok) {
      return freezeFailure(rendererIntegrationResult);
    }

    const custom25DRenderVerificationResult =
      normalizedOptions.validateSyntheticWorldActualCustom25DRenderVerification(
        syntheticWorldActualCustom25DRenderVerificationDefinition,
        { context: normalizedOptions.context }
      );
    if (!custom25DRenderVerificationResult.ok) {
      return freezeFailure(custom25DRenderVerificationResult);
    }

    const outputPackage = outputPackageResult.atlasShowcaseOutputPackage;
    const execution = executionResult.atlasShowcaseExecution;
    const bridge = bridgeResult.atlasShowcaseResultToCustom25DDemoBridge;
    const rendererIntegration =
      rendererIntegrationResult.atlasPreviewRendererIntegration;
    const custom25DRenderVerification =
      custom25DRenderVerificationResult.renderVerification;

    validateResultId(
      foundation.resultId,
      outputPackage.resultId,
      foundation.locationRequest,
      bridge.renderMode
    );
    validateExecutionId(
      foundation.executionId,
      outputPackage.executionId,
      foundation.locationRequest,
      bridge.renderMode
    );
    validateShowcaseId(
      foundation.showcaseId,
      outputPackage.showcaseId,
      foundation.locationRequest
    );
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      bridge.rendererPayload
    );
    validateCameraMetadata(outputPackage.presentationSummary);
    validateRendererPayload(bridge.rendererPayload);
    validateAssetReferences(bridge.verificationState.demoObjectAssetIds);
    validateAppearanceProfiles(
      syntheticWorldActualCustom25DRenderVerificationDefinition
        .supportedAppearanceProfiles
    );

    const atlasControlledDemoRenderExecution = Object.freeze({
      renderExecutionId: createRenderExecutionHash(
        foundation.renderExecutionId,
        outputPackage.resultId,
        bridge.renderMode
      ),
      atlasResultId: outputPackage.resultId,
      bridgeRequestId: bridge.deterministicVerification.bridgeHash,
      renderState: Object.freeze({
        currentState: "completed",
        allowedStates: atlasEngineControlledDemoRenderExecutionStates,
        manualOnly: true,
        isolated: true,
        lifecycleExecutionEnabled: false,
        automaticMapAttachmentEnabled: false,
        liveWorldRuntimeEnabled: false
      }),
      verificationResult: Object.freeze({
        atlasResultValid: true,
        demoBridgeRequestValid: true,
        cameraMetadataValid: true,
        rendererPayloadValid: true,
        assetReferencesValid: true,
        appearanceProfilesValid: true,
        rendererVerificationCompatible:
          bridge.verificationState.rendererVerificationCompatible,
        verifiedAssetIds: bridge.verificationState.demoObjectAssetIds,
        verifiedRendererPayloadCount:
          rendererIntegration.verificationResult.verifiedRendererPayloadCount
      }),
      renderSummary: Object.freeze({
        location: outputPackage.locationSummary.displayLabel,
        scene: bridge.previewSceneId,
        objects: Object.freeze({
          payloadCount: bridge.rendererPayload.length,
          landmarkObjects:
            outputPackage.worldSummary.generatedCounts.landmarks,
          structureObjects:
            outputPackage.worldSummary.generatedCounts.structures,
          environmentObjects:
            outputPackage.worldSummary.generatedCounts.environment
        }),
        camera: Object.freeze({
          profile: bridge.cameraProfile,
          focusTarget: outputPackage.presentationSummary.focusTarget,
          zoom: outputPackage.presentationSummary.zoom,
          orientation: outputPackage.presentationSummary.orientation
        }),
        mode: bridge.renderMode,
        result: Object.freeze({
          verified: true,
          completed: true,
          failureDetected: false
        })
      }),
      cleanupState: Object.freeze({
        closeSessionSupported: true,
        releaseStateSupported: true,
        duplicateRenderRejected: true,
        staleReferenceRejected: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        sameAtlasResultProducesIdenticalRenderExecutionOutput: true,
        renderExecutionHash: createRenderExecutionHash(
          foundation.renderExecutionId,
          outputPackage.resultId,
          bridge.renderMode
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
        backendModified: false,
        bridgeRequestVerified:
          bridge.verificationState.rendererPayloadCompatibilityValid === true,
        renderVerificationProfilesMatched:
          sameStringArray(
            custom25DRenderVerification.supportedAppearanceProfiles,
            syntheticWorldActualCustom25DRenderVerificationDefinition
              .supportedAppearanceProfiles
          )
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasControlledDemoRenderExecution
    });
  } catch (error) {
    if (
      error?.name !== "AtlasEngineControlledDemoRenderExecutionValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasControlledDemoRenderExecution: null
    });
  }
}

export function createAtlasEngineControlledDemoRenderExecutionSession(
  rawFoundation = atlasEngineControlledDemoRenderExecutionFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_render_execution_required",
      message:
        "Atlas controlled demo render execution sessions require manual: true.",
      atlasControlledDemoRenderSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_render_execution_required",
      message:
        "Atlas controlled demo render execution sessions require isolated: true.",
      atlasControlledDemoRenderSession: null
    });
  }

  const validation = validateAtlasEngineControlledDemoRenderExecutionFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasControlledDemoRenderSession: null
    });
  }

  let renderState = "created";
  let renderGranted = false;
  let closed = false;
  const renderExecution = validation.atlasControlledDemoRenderExecution;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasControlledDemoRenderSession: Object.freeze({
      renderExecutionId: renderExecution.renderExecutionId,
      atlasResultId: renderExecution.atlasResultId,
      currentRenderState() {
        return renderState;
      },
      startRenderExecution(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas controlled demo render execution rejects render activation after session closure.",
            renderActivation: null
          });
        }

        if (requestOptions.manualRenderExecutionAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_render_execution_authorization_required",
            message:
              "Atlas controlled demo render execution requires manualRenderExecutionAuthorized: true before execution.",
            renderActivation: null
          });
        }

        if (renderGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_render_execution_prevented",
            message:
              "Atlas controlled demo render execution prevents duplicate render activation for the same prepared session.",
            renderActivation: null
          });
        }

        renderGranted = true;
        renderState = "completed";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          renderActivation: Object.freeze({
            renderExecutionId: renderExecution.renderExecutionId,
            atlasResultId: renderExecution.atlasResultId,
            renderState,
            verificationResult: renderExecution.verificationResult,
            renderSummary: renderExecution.renderSummary,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeRenderExecutionSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateRenderExecutionCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        renderState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-controlled-demo-render-session-closed",
          releasedStateCount:
            renderExecution.verificationResult.verifiedRendererPayloadCount,
          duplicateRenderExecutionCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ??
      buildAtlasEngineControlledDemoRenderExecutionContext(),
    validateAtlasEngineShowcaseOutputPackageFoundation:
      options.validateAtlasEngineShowcaseOutputPackageFoundation ??
      validateAtlasEngineShowcaseOutputPackageFoundation,
    validateAtlasEngineShowcaseExecutionFoundation:
      options.validateAtlasEngineShowcaseExecutionFoundation ??
      validateAtlasEngineShowcaseExecutionFoundation,
    validateAtlasEngineShowcaseResultToCustom25DDemoBridge:
      options.validateAtlasEngineShowcaseResultToCustom25DDemoBridge ??
      validateAtlasEngineShowcaseResultToCustom25DDemoBridge,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation,
    validateSyntheticWorldActualCustom25DRenderVerification:
      options.validateSyntheticWorldActualCustom25DRenderVerification ??
      validateSyntheticWorldActualCustom25DRenderVerification
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine controlled demo render execution foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    renderExecutionId: normalizePermanentId(
      foundation.renderExecutionId,
      "renderExecutionId"
    ),
    resultId: normalizePermanentId(foundation.resultId, "resultId"),
    executionId: normalizePermanentId(foundation.executionId, "executionId"),
    showcaseId: normalizePermanentId(foundation.showcaseId, "showcaseId"),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    )
  });
}

function buildOutputPackageDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseOutputPackageFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildExecutionDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseExecutionFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildBridgeDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateResultId(expectedResultId, receivedResultId, locationRequest, renderMode) {
  const expectedResolvedId = createResultHash(
    expectedResultId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    renderMode
  );
  if (receivedResultId !== expectedResolvedId) {
    throw createValidationError(
      "result_id_mismatch",
      "Atlas controlled demo render execution resultId must match the deterministic Atlas showcase output package ID."
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
      "Atlas controlled demo render execution executionId must match the deterministic Atlas showcase execution ID."
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
      "Atlas controlled demo render execution showcaseId must match the deterministic Atlas showcase session ID."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas controlled demo render execution expectedRendererPayloadCount does not match the renderer payload."
    );
  }
}

function validateCameraMetadata(presentationSummary) {
  if (
    !presentationSummary ||
    typeof presentationSummary.cameraProfile !== "string" ||
    typeof presentationSummary.focusTarget !== "string" ||
    typeof presentationSummary.orientation !== "string" ||
    !Number.isFinite(presentationSummary.zoom)
  ) {
    throw createValidationError(
      "invalid_camera_metadata",
      "Atlas controlled demo render execution requires valid preview camera metadata."
    );
  }
}

function validateRendererPayload(rendererPayload) {
  for (const entry of rendererPayload) {
    if (
      !entry.rendererAssetReference ||
      typeof entry.rendererAssetReference.assetId !== "string" ||
      entry.passiveRendererPayload?.metadata?.adapterProfile !==
        "custom-2.5d-passive"
    ) {
      throw createValidationError(
        "invalid_renderer_payload",
        "Atlas controlled demo render execution requires compatible passive Custom 2.5D renderer payload entries."
      );
    }
  }
}

function validateAssetReferences(assetIds) {
  for (const assetId of assetIds) {
    if (!permanentIdPattern.test(assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas controlled demo render execution requires approved permanent asset IDs."
      );
    }
  }
}

function validateAppearanceProfiles(receivedAppearanceProfiles) {
  if (
    !sameStringArray(
      receivedAppearanceProfiles,
      syntheticWorldActualCustom25DRenderVerificationDefinition
        .supportedAppearanceProfiles
    )
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Atlas controlled demo render execution appearance profiles must match the approved day, sunset, and night set."
    );
  }
}

function createShowcaseId(baseId, locationId, worldSeed) {
  return `${baseId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
}

function createExecutionHash(baseId, locationId, worldSeed, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${renderMode}::execution`
  )}`;
}

function createResultHash(baseId, locationId, worldSeed, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${renderMode}::output-package`
  )}`;
}

function createRenderExecutionHash(baseId, resultId, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${resultId}::${renderMode}::render-execution`
  )}`;
}

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function sameStringArray(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every((entry, index) => entry === right[index]);
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    atlasControlledDemoRenderExecution: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineControlledDemoRenderExecutionRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine controlled demo render execution foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineControlledDemoRenderExecutionValidationError";
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
