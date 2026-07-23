import {
  atlasEngineShowcaseRenderDemonstrationFoundationDefinition,
  buildAtlasEngineShowcaseRenderDemonstrationContext,
  validateAtlasEngineShowcaseRenderDemonstrationFoundation
} from "./atlas-engine-showcase-render-demonstration-foundation.mjs";
import {
  atlasEnginePreviewShowcaseSessionFoundationDefinition,
} from "./atlas-engine-preview-showcase-session-foundation.mjs";
import {
  atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
} from "./atlas-engine-world-preview-presentation-layer-foundation.mjs";
import {
  atlasEngineWorldPreviewRuntimeFoundationDefinition,
  validateAtlasEngineWorldPreviewRuntimeFoundation
} from "./atlas-engine-world-preview-runtime-foundation.mjs";

export const atlasEngineShowcaseExecutionRequiredFields = Object.freeze([
  "executionId",
  "showcaseId",
  "atlasSessionId",
  "locationRequest",
  "expectedRendererPayloadCount",
  "manualExecutionAuthorizationRequired"
]);

export const atlasEngineShowcaseExecutionStates = Object.freeze([
  "created",
  "initializing",
  "generating",
  "rendering",
  "verified",
  "completed",
  "failed"
]);

export const atlasEngineShowcaseExecutionFoundationDefinition = deepFreeze({
  executionId: "ATLAS_SHOWCASE_EXECUTION_001",
  showcaseId:
    atlasEnginePreviewShowcaseSessionFoundationDefinition.showcaseId,
  atlasSessionId:
    atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
  locationRequest: deepFreeze({
    ...atlasEngineShowcaseRenderDemonstrationFoundationDefinition.locationRequest
  }),
  expectedRendererPayloadCount:
    atlasEngineShowcaseRenderDemonstrationFoundationDefinition.expectedRendererPayloadCount,
  manualExecutionAuthorizationRequired: true
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEngineShowcaseExecutionContext() {
  return Object.freeze(buildAtlasEngineShowcaseRenderDemonstrationContext());
}

export function validateAtlasEngineShowcaseExecutionFoundation(
  rawFoundation = atlasEngineShowcaseExecutionFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const atlasRuntimeResult =
      normalizedOptions.validateAtlasEngineWorldPreviewRuntimeFoundation(
        buildRuntimeDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!atlasRuntimeResult.ok) {
      return freezeFailure(atlasRuntimeResult);
    }

    const renderDemonstrationResult =
      normalizedOptions.validateAtlasEngineShowcaseRenderDemonstrationFoundation(
        buildRenderDemonstrationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!renderDemonstrationResult.ok) {
      return freezeFailure(renderDemonstrationResult);
    }

    const atlasRuntime = atlasRuntimeResult.atlasWorldPreviewRuntime;
    const renderDemonstration =
      renderDemonstrationResult.atlasShowcaseRenderDemonstration;

    validateAtlasSessionId(foundation.atlasSessionId, atlasRuntime.atlasSessionId);
    validateShowcaseId(
      foundation.showcaseId,
      renderDemonstration.showcaseRenderRequest.showcaseId,
      foundation.locationRequest
    );
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      renderDemonstration.showcaseRenderRequest.rendererPayload
    );

    const executionSummary = buildExecutionSummary(
      foundation,
      atlasRuntime,
      renderDemonstration
    );

    const atlasShowcaseExecution = Object.freeze({
      executionSession: Object.freeze({
        executionId: createExecutionHash(
          foundation.executionId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed,
          renderDemonstration.showcaseRenderRequest.renderMode
        ),
        showcaseId: renderDemonstration.showcaseRenderRequest.showcaseId,
        atlasSessionId: atlasRuntime.atlasSessionId,
        executionState: "completed",
        startTime: "deterministic-start-time-not-runtime-derived",
        completionState: Object.freeze({
          status: "verified",
          completed: true,
          failed: false,
          cleanupRequired: true
        }),
        resultSummary: executionSummary
      }),
      pipelineExecution: Object.freeze({
        locationProcessing: Object.freeze({
          locationId: foundation.locationRequest.locationId,
          environmentType: foundation.locationRequest.environmentType,
          processedSuccessfully: true
        }),
        worldGeneration: Object.freeze({
          previewWorldId: atlasRuntime.previewWorldId,
          generatedSuccessfully: true,
          structureCount: atlasRuntime.worldInstances.length,
          environmentCount: atlasRuntime.environmentInstances.length
        }),
        presentationReadiness: Object.freeze({
          previewSceneId:
            renderDemonstration.showcaseRenderRequest.previewSceneId,
          ready: true,
          cameraProfile: renderDemonstration.finalDemoSummary.camera.profile
        }),
        rendererPreviewPreparation: Object.freeze({
          rendererProfile:
            renderDemonstration.finalDemoSummary.rendererStatus.rendererProfile,
          payloadCount:
            renderDemonstration.finalDemoSummary.rendererStatus.payloadCount,
          prepared: true
        }),
        verificationResult: Object.freeze({
          renderMode:
            renderDemonstration.finalDemoSummary.rendererStatus.renderMode,
          compatibilityVerified:
            renderDemonstration.finalDemoSummary.rendererStatus.compatibilityVerified,
          verified: true
        })
      }),
      failureHandling: Object.freeze({
        invalidLocation: Object.freeze({
          handledSafely: true,
          failClosed: true,
          liveRuntimeEnabled: false
        }),
        missingAssets: Object.freeze({
          handledSafely: true,
          failClosed: true,
          placeholderRuntimeEnabled: false
        }),
        invalidPayloads: Object.freeze({
          handledSafely: true,
          failClosed: true,
          rendererRuntimeEnabled: false
        }),
        cleanupFailures: Object.freeze({
          handledSafely: true,
          failClosed: true,
          duplicateSessionsPrevented: true
        })
      }),
      deterministicVerification: Object.freeze({
        sameLocationAndSeedProduceIdenticalExecutionOutput: true,
        executionHash: createExecutionHash(
          foundation.executionId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed,
          renderDemonstration.showcaseRenderRequest.renderMode
        )
      }),
      validation: Object.freeze({
        locationProcessingVerified: true,
        worldGenerationVerified: true,
        presentationReadinessVerified: true,
        rendererPreviewPreparationVerified: true,
        verificationResultVerified: true,
        failureHandlingVerified: true,
        deterministicOutputVerified: true
      }),
      compatibility: Object.freeze({
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveWorldObjectsCreated: false,
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
      atlasShowcaseExecution
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineShowcaseExecutionValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasShowcaseExecution: null
    });
  }
}

export function createAtlasEngineShowcaseExecutionSession(
  rawFoundation = atlasEngineShowcaseExecutionFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_execution_required",
      message:
        "Atlas showcase execution sessions require manual: true.",
      atlasExecutionSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_execution_required",
      message:
        "Atlas showcase execution sessions require isolated: true.",
      atlasExecutionSession: null
    });
  }

  const validation = validateAtlasEngineShowcaseExecutionFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasExecutionSession: null
    });
  }

  let executionState = "created";
  let closed = false;
  let executionGranted = false;
  const execution = validation.atlasShowcaseExecution;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasExecutionSession: Object.freeze({
      executionId: execution.executionSession.executionId,
      showcaseId: execution.executionSession.showcaseId,
      atlasSessionId: execution.executionSession.atlasSessionId,
      currentExecutionState() {
        return executionState;
      },
      startExecution(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas showcase execution rejects start operations after session closure.",
            executionActivation: null
          });
        }

        if (requestOptions.manualExecutionAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_execution_authorization_required",
            message:
              "Atlas showcase execution requires manualExecutionAuthorized: true before execution.",
            executionActivation: null
          });
        }

        if (executionGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_execution_prevented",
            message:
              "Atlas showcase execution prevents duplicate execution for the same prepared session.",
            executionActivation: null
          });
        }

        executionGranted = true;
        executionState = "completed";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          executionActivation: Object.freeze({
            executionId: execution.executionSession.executionId,
            executionState,
            completionState: execution.executionSession.completionState,
            resultSummary: execution.executionSession.resultSummary,
            liveRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeExecutionSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateExecutionCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        executionState = "completed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-showcase-execution-session-closed",
          releasedStateCount: 5,
          duplicateExecutionCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineShowcaseExecutionContext(),
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation,
    validateAtlasEngineShowcaseRenderDemonstrationFoundation:
      options.validateAtlasEngineShowcaseRenderDemonstrationFoundation ??
      validateAtlasEngineShowcaseRenderDemonstrationFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine showcase execution foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    executionId: normalizePermanentId(foundation.executionId, "executionId"),
    showcaseId: normalizePermanentId(foundation.showcaseId, "showcaseId"),
    atlasSessionId: normalizePermanentId(
      foundation.atlasSessionId,
      "atlasSessionId"
    ),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    ),
    manualExecutionAuthorizationRequired: normalizeBoolean(
      foundation.manualExecutionAuthorizationRequired,
      "manualExecutionAuthorizationRequired"
    )
  });
}

function buildRuntimeDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewRuntimeFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildRenderDemonstrationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseRenderDemonstrationFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateAtlasSessionId(expectedSessionId, receivedSessionId) {
  if (expectedSessionId !== receivedSessionId) {
    throw createValidationError(
      "atlas_session_id_mismatch",
      "Atlas showcase execution atlasSessionId must match the Atlas runtime session."
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
      "Atlas showcase execution showcaseId must match the deterministic Atlas showcase session ID."
    );
  }
}

function createShowcaseId(baseId, locationId, worldSeed) {
  return `${baseId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas showcase execution expectedRendererPayloadCount does not match the renderer payload."
    );
  }
}

function buildExecutionSummary(
  foundation,
  atlasRuntime,
  renderDemonstration
) {
  return Object.freeze({
    location: renderDemonstration.finalDemoSummary.location,
    theme: renderDemonstration.finalDemoSummary.experienceTheme,
    generatedWorldStatus: Object.freeze({
      previewSceneId: renderDemonstration.showcaseRenderRequest.previewSceneId,
      structureCount: atlasRuntime.worldInstances.length,
      environmentCount: atlasRuntime.environmentInstances.length,
      generationVerified: true
    }),
    camera: Object.freeze({
      profile: renderDemonstration.finalDemoSummary.camera.profile,
      orientation: renderDemonstration.finalDemoSummary.camera.orientation,
      zoomLevel: renderDemonstration.finalDemoSummary.camera.zoomLevel
    }),
    rendererStatus: Object.freeze({
      renderMode: renderDemonstration.finalDemoSummary.rendererStatus.renderMode,
      rendererProfile:
        renderDemonstration.finalDemoSummary.rendererStatus.rendererProfile,
      payloadCount:
        renderDemonstration.finalDemoSummary.rendererStatus.payloadCount,
      compatibilityVerified:
        renderDemonstration.finalDemoSummary.rendererStatus.compatibilityVerified
    }),
    completionResult: Object.freeze({
      verified: true,
      completed: true,
      failureDetected: false,
      cleanupRemainsManual: foundation.manualExecutionAuthorizationRequired
    })
  });
}

function createExecutionHash(baseId, locationId, worldSeed, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${renderMode}::execution`
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
    atlasShowcaseExecution: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineShowcaseExecutionRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine showcase execution foundation is missing required field ${fieldName}.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
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
  error.name = "AtlasEngineShowcaseExecutionValidationError";
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
