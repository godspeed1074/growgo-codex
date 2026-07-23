import {
  atlasEngineWorldPreviewRuntimeFoundationDefinition,
  buildAtlasEngineWorldPreviewRuntimeFoundationContext,
  validateAtlasEngineWorldPreviewRuntimeFoundation
} from "./atlas-engine-world-preview-runtime-foundation.mjs";
import {
  atlasEnginePreviewRendererIntegrationFoundationDefinition,
  validateAtlasEnginePreviewRendererIntegrationFoundation
} from "./atlas-engine-preview-renderer-integration-foundation.mjs";
import {
  combinedWorldPreviewGeneratorFoundationDefinition,
  validateCombinedWorldPreviewGeneratorFoundation
} from "./combined-world-preview-generator-foundation.mjs";
import {
  controlledRealLocationSyntheticPreviewDefinition,
  validateControlledRealLocationSyntheticPreview
} from "./controlled-real-location-synthetic-preview.mjs";
import {
  environmentAndBiomePreviewFoundationDefinition,
  validateEnvironmentAndBiomePreviewFoundation
} from "./environment-and-biome-preview-foundation.mjs";

export const atlasEngineSyntheticWorldPreviewDemonstrationRequiredFields =
  Object.freeze([
    "demoId",
    "atlasSessionId",
    "locationRequest",
    "expectedStructureCount",
    "expectedEnvironmentCount",
    "expectedRendererPayloadCount"
  ]);

export const atlasEngineSyntheticWorldPreviewDemonstrationStates = Object.freeze([
  "created",
  "generated",
  "prepared",
  "preview_ready",
  "completed",
  "failed"
]);

export const atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition =
  deepFreeze({
    demoId: "ATLAS_SYNTHETIC_WORLD_PREVIEW_DEMO_001",
    atlasSessionId:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
    locationRequest: deepFreeze({
      ...controlledRealLocationSyntheticPreviewDefinition.locationRequest
    }),
    expectedStructureCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedStructureCount,
    expectedEnvironmentCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedEnvironmentCount,
    expectedRendererPayloadCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEngineSyntheticWorldPreviewDemonstrationContext() {
  return Object.freeze(buildAtlasEngineWorldPreviewRuntimeFoundationContext());
}

export function validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation(
  rawFoundation = atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const locationPreviewResult =
      normalizedOptions.validateControlledRealLocationSyntheticPreview(
        buildLocationPreviewDefinition(foundation.locationRequest)
      );
    if (!locationPreviewResult.ok) {
      return freezeFailure(locationPreviewResult);
    }

    const environmentPreviewResult =
      normalizedOptions.validateEnvironmentAndBiomePreviewFoundation(
        buildEnvironmentPreviewDefinition(foundation.locationRequest)
      );
    if (!environmentPreviewResult.ok) {
      return freezeFailure(environmentPreviewResult);
    }

    const combinedWorldPreviewResult =
      normalizedOptions.validateCombinedWorldPreviewGeneratorFoundation(
        buildCombinedWorldPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!combinedWorldPreviewResult.ok) {
      return freezeFailure(combinedWorldPreviewResult);
    }

    const atlasRuntimeResult =
      normalizedOptions.validateAtlasEngineWorldPreviewRuntimeFoundation(
        buildAtlasRuntimeDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!atlasRuntimeResult.ok) {
      return freezeFailure(atlasRuntimeResult);
    }

    const rendererIntegrationResult =
      normalizedOptions.validateAtlasEnginePreviewRendererIntegrationFoundation(
        atlasEnginePreviewRendererIntegrationFoundationDefinition,
        { context: normalizedOptions.context }
      );
    if (!rendererIntegrationResult.ok) {
      return freezeFailure(rendererIntegrationResult);
    }

    validateLocationBridge(
      foundation.locationRequest,
      locationPreviewResult.previewWorld.locationRequest,
      environmentPreviewResult.environmentBiomePreview.locationRequest,
      combinedWorldPreviewResult.combinedWorldPreview.locationRequest,
      atlasRuntimeResult.atlasWorldPreviewRuntime.locationRequest
    );
    validateCounts(
      foundation,
      combinedWorldPreviewResult.combinedWorldPreview,
      atlasRuntimeResult.atlasWorldPreviewRuntime,
      rendererIntegrationResult.atlasPreviewRendererIntegration
    );

    const demonstration = Object.freeze({
      demoId: createDemoId(
        foundation.demoId,
        foundation.locationRequest.locationId,
        foundation.locationRequest.worldSeed
      ),
      atlasSessionId: foundation.atlasSessionId,
      locationRequest: deepFreeze({ ...foundation.locationRequest }),
      worldPreview: Object.freeze({
        previewWorldId: combinedWorldPreviewResult.combinedWorldPreview.previewWorldId,
        locationPreview: locationPreviewResult.previewWorld,
        combinedWorldPreview: combinedWorldPreviewResult.combinedWorldPreview,
        environmentPreview: Object.freeze({
          biomeId:
            environmentPreviewResult.environmentBiomePreview.selectedBiome.biomeId,
          environmentType:
            environmentPreviewResult.environmentBiomePreview.selectedBiome.environmentType,
          environmentModules:
            environmentPreviewResult.environmentBiomePreview.environmentModules
        }),
        atlasRuntime: atlasRuntimeResult.atlasWorldPreviewRuntime
      }),
      rendererPreview: Object.freeze({
        rendererRequest:
          rendererIntegrationResult.atlasPreviewRendererIntegration.rendererRequest,
        attachmentState:
          rendererIntegrationResult.atlasPreviewRendererIntegration.attachmentState,
        verificationResult:
          rendererIntegrationResult.atlasPreviewRendererIntegration.verificationResult,
        supportedPreviewModes:
          rendererIntegrationResult.atlasPreviewRendererIntegration.rendererRequest.previewModes
      }),
      demoState: Object.freeze({
        currentState: "preview_ready",
        allowedStates: atlasEngineSyntheticWorldPreviewDemonstrationStates,
        liveRuntimeEnabled: false,
        realMapAttached: false,
        playerRuntimeEnabled: false
      }),
      demoOutputSummary: Object.freeze({
        location: Object.freeze({
          locationId: foundation.locationRequest.locationId,
          region: foundation.locationRequest.region,
          environmentType: foundation.locationRequest.environmentType
        }),
        biome: Object.freeze({
          biomeId:
            environmentPreviewResult.environmentBiomePreview.selectedBiome.biomeId,
          terrainType:
            environmentPreviewResult.environmentBiomePreview.selectedBiome.terrainType
        }),
        structureCount:
          combinedWorldPreviewResult.combinedWorldPreview.structureInstances.length,
        environmentCount:
          combinedWorldPreviewResult.combinedWorldPreview.environmentInstances.length,
        rendererVerification: Object.freeze({
          payloadCount:
            rendererIntegrationResult.atlasPreviewRendererIntegration
              .rendererRequest.rendererPayload.length,
          rendererCompatibilityVerified:
            rendererIntegrationResult.atlasPreviewRendererIntegration
              .verificationResult.rendererVerificationCompatible,
          previewModes:
            rendererIntegrationResult.atlasPreviewRendererIntegration
              .rendererRequest.previewModes
        })
      }),
      validation: Object.freeze({
        locationBridgeVerified: true,
        worldGenerationVerified: true,
        structuresVerified:
          combinedWorldPreviewResult.combinedWorldPreview.structureInstances.length ===
          foundation.expectedStructureCount,
        environmentVerified:
          combinedWorldPreviewResult.combinedWorldPreview.environmentInstances.length ===
          foundation.expectedEnvironmentCount,
        instancesVerified:
          atlasRuntimeResult.atlasWorldPreviewRuntime.worldInstances.length ===
            foundation.expectedStructureCount &&
          atlasRuntimeResult.atlasWorldPreviewRuntime.environmentInstances.length ===
            foundation.expectedEnvironmentCount,
        runtimeSessionVerified:
          atlasRuntimeResult.atlasWorldPreviewRuntime.sessionState.currentState ===
          "prepared",
        rendererAttachmentVerified:
          rendererIntegrationResult.atlasPreviewRendererIntegration.attachmentState
            .currentState === "prepared",
        deterministicDemoVerified: true
      }),
      compatibility: Object.freeze({
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveWorldObjectsCreated: false,
        realMapAttached: false,
        playerRuntimeEnabled: false,
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
      atlasSyntheticWorldPreviewDemonstration: demonstration
    });
  } catch (error) {
    if (
      error?.name !==
      "AtlasEngineSyntheticWorldPreviewDemonstrationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasSyntheticWorldPreviewDemonstration: null
    });
  }
}

export function createAtlasEngineSyntheticWorldPreviewDemonstrationSession(
  rawFoundation = atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_required",
      message:
        "Atlas Engine synthetic world preview demonstration sessions require manual: true.",
      demoSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_required",
      message:
        "Atlas Engine synthetic world preview demonstration sessions require isolated: true.",
      demoSession: null
    });
  }

  const validation =
    validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation(
      rawFoundation,
      options
    );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      demoSession: null
    });
  }

  let demoState = "created";
  let completed = false;
  let failed = false;
  let failureReason = null;
  const demo = validation.atlasSyntheticWorldPreviewDemonstration;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    demoSession: Object.freeze({
      demoId: demo.demoId,
      atlasSessionId: demo.atlasSessionId,
      locationRequest: demo.locationRequest,
      worldPreview: demo.worldPreview,
      rendererPreview: demo.rendererPreview,
      currentDemoState() {
        return demoState;
      },
      generateDemo() {
        if (failed) {
          return freezeSessionFailure(
            "demo_failed",
            failureReason ??
              "Atlas Engine synthetic world preview demonstration session has already failed."
          );
        }
        demoState = "generated";
        return freezeSessionSuccess(demoState, demo);
      },
      prepareDemo() {
        if (failed) {
          return freezeSessionFailure(
            "demo_failed",
            failureReason ??
              "Atlas Engine synthetic world preview demonstration session has already failed."
          );
        }
        demoState = "prepared";
        return freezeSessionSuccess(demoState, demo);
      },
      markPreviewReady() {
        if (failed) {
          return freezeSessionFailure(
            "demo_failed",
            failureReason ??
              "Atlas Engine synthetic world preview demonstration session has already failed."
          );
        }
        demoState = "preview_ready";
        return freezeSessionSuccess(demoState, demo);
      },
      completeDemo() {
        if (failed) {
          return freezeSessionFailure(
            "demo_failed",
            failureReason ??
              "Atlas Engine synthetic world preview demonstration session has already failed."
          );
        }
        completed = true;
        demoState = "completed";
        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          completed,
          demoState,
          demoOutputSummary: demo.demoOutputSummary,
          affectedLiveRuntime: false
        });
      },
      failDemo(reason = "Atlas demo session failed.") {
        failed = true;
        completed = false;
        failureReason = normalizeStringValue(reason, "failDemo.reason");
        demoState = "failed";

        return Object.freeze({
          ok: false,
          errorCode: "demo_failed",
          message: failureReason,
          completed,
          demoState,
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
      buildAtlasEngineSyntheticWorldPreviewDemonstrationContext(),
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation,
    validateCombinedWorldPreviewGeneratorFoundation:
      options.validateCombinedWorldPreviewGeneratorFoundation ??
      validateCombinedWorldPreviewGeneratorFoundation,
    validateControlledRealLocationSyntheticPreview:
      options.validateControlledRealLocationSyntheticPreview ??
      validateControlledRealLocationSyntheticPreview,
    validateEnvironmentAndBiomePreviewFoundation:
      options.validateEnvironmentAndBiomePreviewFoundation ??
      validateEnvironmentAndBiomePreviewFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine synthetic world preview demonstration foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    demoId: normalizePermanentId(foundation.demoId, "demoId"),
    atlasSessionId: normalizePermanentId(
      foundation.atlasSessionId,
      "atlasSessionId"
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
    )
  });
}

function buildLocationPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...controlledRealLocationSyntheticPreviewDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildEnvironmentPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...environmentAndBiomePreviewFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildCombinedWorldPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...combinedWorldPreviewGeneratorFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest }),
    worldSeed: locationRequest.worldSeed
  });
}

function buildAtlasRuntimeDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewRuntimeFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateLocationBridge(
  expectedLocationRequest,
  locationPreviewRequest,
  environmentPreviewRequest,
  combinedPreviewRequest,
  atlasRuntimeRequest
) {
  const serializedExpected = JSON.stringify(expectedLocationRequest);
  const requests = [
    locationPreviewRequest,
    environmentPreviewRequest,
    combinedPreviewRequest,
    atlasRuntimeRequest
  ];

  if (requests.some((entry) => JSON.stringify(entry) !== serializedExpected)) {
    throw createValidationError(
      "location_request_mismatch",
      "Atlas synthetic world preview demonstration locationRequest must remain identical across the complete passive pipeline."
    );
  }
}

function validateCounts(
  foundation,
  combinedWorldPreview,
  atlasRuntime,
  rendererIntegration
) {
  if (combinedWorldPreview.structureInstances.length !== foundation.expectedStructureCount) {
    throw createValidationError(
      "structure_count_mismatch",
      "Atlas synthetic world preview demonstration structure count does not match the approved combined world preview."
    );
  }

  if (
    combinedWorldPreview.environmentInstances.length !==
    foundation.expectedEnvironmentCount
  ) {
    throw createValidationError(
      "environment_count_mismatch",
      "Atlas synthetic world preview demonstration environment count does not match the approved combined world preview."
    );
  }

  if (
    rendererIntegration.rendererRequest.rendererPayload.length !==
    foundation.expectedRendererPayloadCount
  ) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas synthetic world preview demonstration renderer payload count does not match the approved renderer preview contract."
    );
  }

  if (
    atlasRuntime.worldInstances.length !== foundation.expectedStructureCount ||
    atlasRuntime.environmentInstances.length !== foundation.expectedEnvironmentCount
  ) {
    throw createValidationError(
      "instance_count_mismatch",
      "Atlas synthetic world preview demonstration runtime instance counts do not match the approved preview counts."
    );
  }
}

function createDemoId(baseDemoId, locationId, worldSeed) {
  return `${baseDemoId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
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
    atlasSyntheticWorldPreviewDemonstration: null
  });
}

function freezeSessionSuccess(demoState, demo) {
  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    demoState,
    demoOutputSummary: demo.demoOutputSummary,
    affectedLiveRuntime: false
  });
}

function freezeSessionFailure(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message,
    demoState: "failed",
    affectedLiveRuntime: false
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineSyntheticWorldPreviewDemonstrationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine synthetic world preview demonstration foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineSyntheticWorldPreviewDemonstrationValidationError";
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
