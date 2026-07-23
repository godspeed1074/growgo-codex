import {
  buildCombinedWorldPreviewGeneratorFoundationContext,
  combinedWorldPreviewGeneratorFoundationDefinition,
  validateCombinedWorldPreviewGeneratorFoundation
} from "./combined-world-preview-generator-foundation.mjs";
import {
  controlledSyntheticWorldRuntimeAttachmentPreparationDefinition,
  validateControlledSyntheticWorldRuntimeAttachmentPreparation
} from "./controlled-synthetic-world-runtime-attachment-preparation.mjs";
import { validateWorldInstanceManagerFoundation } from "./world-instance-manager-foundation.mjs";
import { validateWorldStreamingCoordinatorFoundation } from "./world-streaming-coordinator-foundation.mjs";

export const atlasEngineWorldPreviewRuntimeFoundationRequiredFields =
  Object.freeze([
    "atlasSessionId",
    "previewWorldId",
    "locationRequest",
    "expectedStructureCount",
    "expectedEnvironmentCount",
    "expectedRendererPayloadCount",
    "activationAuthorizationRequired"
  ]);

export const atlasWorldPreviewRuntimeSessionStates = Object.freeze([
  "created",
  "prepared",
  "previewing",
  "paused",
  "closed"
]);

export const atlasEngineWorldPreviewRuntimeFoundationDefinition = deepFreeze({
  atlasSessionId: "ATLAS_WORLD_PREVIEW_SESSION_001",
  previewWorldId:
    combinedWorldPreviewGeneratorFoundationDefinition.previewWorldId,
  locationRequest: deepFreeze({
    ...combinedWorldPreviewGeneratorFoundationDefinition.locationRequest
  }),
  expectedStructureCount: 4,
  expectedEnvironmentCount: 7,
  expectedRendererPayloadCount: 11,
  activationAuthorizationRequired: true
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEngineWorldPreviewRuntimeFoundationContext() {
  return Object.freeze(buildCombinedWorldPreviewGeneratorFoundationContext());
}

export function validateAtlasEngineWorldPreviewRuntimeFoundation(
  rawFoundation = atlasEngineWorldPreviewRuntimeFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const combinedPreviewResult =
      normalizedOptions.validateCombinedWorldPreviewGeneratorFoundation(
        buildCombinedPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!combinedPreviewResult.ok) {
      return freezeFailure(combinedPreviewResult);
    }

    const runtimePreparationResult =
      normalizedOptions.validateControlledSyntheticWorldRuntimeAttachmentPreparation(
        controlledSyntheticWorldRuntimeAttachmentPreparationDefinition
      );
    if (!runtimePreparationResult.ok) {
      return freezeFailure(runtimePreparationResult);
    }

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const streamingResult =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation();
    if (!streamingResult.ok) {
      return freezeFailure(streamingResult);
    }

    validatePreviewShape(foundation, combinedPreviewResult.combinedWorldPreview);

    const atlasRuntime = Object.freeze({
      atlasSessionId: foundation.atlasSessionId,
      previewWorldId: combinedPreviewResult.combinedWorldPreview.previewWorldId,
      locationRequest: combinedPreviewResult.combinedWorldPreview.locationRequest,
      worldInstances: combinedPreviewResult.combinedWorldPreview.structureInstances,
      environmentInstances:
        combinedPreviewResult.combinedWorldPreview.environmentInstances,
      rendererPayload: combinedPreviewResult.combinedWorldPreview.rendererPayload,
      sessionState: Object.freeze({
        activationMode: "manual-preview-only",
        activationAuthorizationRequired:
          foundation.activationAuthorizationRequired,
        currentState: "prepared",
        liveRuntimeEnabled: false,
        realMapAttached: false,
        playerRuntimeEnabled: false
      }),
      validation: Object.freeze({
        worldPreviewValidityVerified: true,
        instanceValidityVerified:
          worldInstanceResult.worldInstanceManager.compatibility
            .deterministicIdentityVerified === true,
        environmentValidityVerified:
          combinedPreviewResult.combinedWorldPreview.environmentInstances.length >
          0,
        rendererPayloadValidityVerified:
          combinedPreviewResult.combinedWorldPreview.rendererPayload.length ===
          foundation.expectedRendererPayloadCount,
        cleanupSafetyVerified: true,
        duplicateSessionProtectionVerified: true,
        staleReferenceProtectionVerified: true
      }),
      cleanupSafety: Object.freeze({
        closableWithoutRuntimeSideEffects: true,
        releasedAtlasPreviewReferences: true,
        affectedLiveRuntime: false
      }),
      compatibility: Object.freeze({
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        realMapAttached: false,
        playerRuntimeEnabled: false,
        rendererModified: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false,
        runtimePreparationBenchmarkVerified:
          runtimePreparationResult.runtimePreparation.rendererAttachmentBoundary
            .verificationResult.preparedSuccessfully === true,
        streamingBenchmarkVerified:
          streamingResult.worldStreamingCoordinator.compatibility
            .passiveHandoffVerified === true
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasWorldPreviewRuntime: atlasRuntime
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineWorldPreviewRuntimeFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasWorldPreviewRuntime: null
    });
  }
}

export function createAtlasEngineWorldPreviewRuntimeSession(
  rawFoundation = atlasEngineWorldPreviewRuntimeFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_required",
      message:
        "Atlas world preview runtime sessions require manual: true.",
      atlasSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_required",
      message:
        "Atlas world preview runtime sessions require isolated: true.",
      atlasSession: null
    });
  }

  const validation = validateAtlasEngineWorldPreviewRuntimeFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasSession: null
    });
  }

  let sessionState = "prepared";
  let closed = false;
  let previewGranted = false;
  const runtime = validation.atlasWorldPreviewRuntime;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasSession: Object.freeze({
      atlasSessionId: runtime.atlasSessionId,
      previewWorldId: runtime.previewWorldId,
      locationRequest: runtime.locationRequest,
      worldInstances: runtime.worldInstances,
      environmentInstances: runtime.environmentInstances,
      rendererPayload: runtime.rendererPayload,
      currentSessionState() {
        return sessionState;
      },
      activatePreview(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas world preview runtime rejects preview activation after session closure.",
            previewActivation: null
          });
        }

        if (requestOptions.manualPreviewAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_preview_authorization_required",
            message:
              "Atlas world preview runtime requires manualPreviewAuthorized: true before preview activation.",
            previewActivation: null
          });
        }

        if (previewGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_session_prevented",
            message:
              "Atlas world preview runtime prevents duplicate preview activation for the same prepared session.",
            previewActivation: null
          });
        }

        previewGranted = true;
        sessionState = "previewing";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          previewActivation: Object.freeze({
            atlasSessionId: runtime.atlasSessionId,
            previewWorldId: runtime.previewWorldId,
            rendererPayload: runtime.rendererPayload,
            sessionState,
            liveRuntimeEnabled: false,
            realMapAttached: false,
            playerRuntimeEnabled: false
          })
        });
      },
      pausePreview() {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas world preview runtime rejects pause operations after session closure.",
            pauseResult: null
          });
        }

        const priorState = sessionState;
        sessionState = "paused";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          pauseResult: Object.freeze({
            priorState,
            currentState: sessionState,
            previewStateReleased: priorState === "previewing",
            affectedLiveRuntime: false
          })
        });
      },
      closeAtlasSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateSessionCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        sessionState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-preview-session-closed",
          releasedStateCount:
            runtime.worldInstances.length + runtime.environmentInstances.length,
          duplicateSessionCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEngineWorldPreviewRuntimeFoundationContext(),
    validateCombinedWorldPreviewGeneratorFoundation:
      options.validateCombinedWorldPreviewGeneratorFoundation ??
      validateCombinedWorldPreviewGeneratorFoundation,
    validateControlledSyntheticWorldRuntimeAttachmentPreparation:
      options.validateControlledSyntheticWorldRuntimeAttachmentPreparation ??
      validateControlledSyntheticWorldRuntimeAttachmentPreparation,
    validateWorldInstanceManagerFoundation:
      options.validateWorldInstanceManagerFoundation ??
      validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      options.validateWorldStreamingCoordinatorFoundation ??
      validateWorldStreamingCoordinatorFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine world preview runtime foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    atlasSessionId: normalizePermanentId(
      foundation.atlasSessionId,
      "atlasSessionId"
    ),
    previewWorldId: normalizePermanentId(
      foundation.previewWorldId,
      "previewWorldId"
    ),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedStructureCount: normalizePositiveInteger(
      foundation.expectedStructureCount,
      "expectedStructureCount"
    ),
    expectedEnvironmentCount: normalizePositiveInteger(
      foundation.expectedEnvironmentCount,
      "expectedEnvironmentCount"
    ),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    ),
    activationAuthorizationRequired: normalizeBoolean(
      foundation.activationAuthorizationRequired,
      "activationAuthorizationRequired"
    )
  });
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

function validatePreviewShape(foundation, combinedWorldPreview) {
  if (combinedWorldPreview.structureInstances.length !== foundation.expectedStructureCount) {
    throw createValidationError(
      "structure_count_mismatch",
      "Atlas world preview runtime foundation expectedStructureCount does not match the combined world preview structure set."
    );
  }

  if (
    combinedWorldPreview.environmentInstances.length !==
    foundation.expectedEnvironmentCount
  ) {
    throw createValidationError(
      "environment_count_mismatch",
      "Atlas world preview runtime foundation expectedEnvironmentCount does not match the combined world preview environment set."
    );
  }

  if (
    combinedWorldPreview.rendererPayload.length !==
    foundation.expectedRendererPayloadCount
  ) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas world preview runtime foundation expectedRendererPayloadCount does not match the combined world preview renderer payload."
    );
  }
}

function buildCombinedPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...combinedWorldPreviewGeneratorFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest }),
    worldSeed: locationRequest.worldSeed
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineWorldPreviewRuntimeFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine world preview runtime foundation is missing required field ${fieldName}.`
      );
    }
  }
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

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    atlasWorldPreviewRuntime: null
  });
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
  error.name = "AtlasEngineWorldPreviewRuntimeFoundationValidationError";
  error.code = code;
  return error;
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
