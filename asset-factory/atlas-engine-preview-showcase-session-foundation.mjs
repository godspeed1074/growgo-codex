import {
  atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
  buildAtlasEngineWorldPreviewPresentationLayerContext,
  validateAtlasEngineWorldPreviewPresentationLayerFoundation
} from "./atlas-engine-world-preview-presentation-layer-foundation.mjs";
import {
  atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
  validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation
} from "./atlas-engine-synthetic-world-preview-demonstration-foundation.mjs";
import {
  atlasEngineWorldPreviewRuntimeFoundationDefinition,
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

export const atlasEnginePreviewShowcaseSessionRequiredFields = Object.freeze([
  "showcaseId",
  "atlasSessionId",
  "locationRequest",
  "expectedRendererPayloadCount"
]);

export const atlasEnginePreviewShowcaseStates = Object.freeze([
  "created",
  "generating",
  "ready",
  "presenting",
  "completed",
  "failed"
]);

export const atlasEnginePreviewShowcaseProfiles = deepFreeze({
  coastal_explorer: deepFreeze({
    showcaseProfileId: "coastal_explorer",
    theme: "Coastal Explorer",
    environmentTypes: ["coastal"],
    highlightBias: "shoreline-path-and-structure-balance"
  }),
  rural_discovery: deepFreeze({
    showcaseProfileId: "rural_discovery",
    theme: "Rural Discovery",
    environmentTypes: ["rural", "park"],
    highlightBias: "open-space-and-vegetation-balance"
  }),
  urban_explorer: deepFreeze({
    showcaseProfileId: "urban_explorer",
    theme: "Urban Explorer",
    environmentTypes: ["urban"],
    highlightBias: "structure-and-route-emphasis"
  })
});

export const atlasEnginePreviewShowcaseSessionFoundationDefinition =
  deepFreeze({
    showcaseId: "ATLAS_PREVIEW_SHOWCASE_SESSION_001",
    atlasSessionId:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
    locationRequest: deepFreeze({
      ...atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.locationRequest
    }),
    expectedRendererPayloadCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEnginePreviewShowcaseSessionContext() {
  return Object.freeze(buildAtlasEngineWorldPreviewPresentationLayerContext());
}

export function validateAtlasEnginePreviewShowcaseSessionFoundation(
  rawFoundation = atlasEnginePreviewShowcaseSessionFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const presentationLayerResult =
      normalizedOptions.validateAtlasEngineWorldPreviewPresentationLayerFoundation(
        buildPresentationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!presentationLayerResult.ok) {
      return freezeFailure(presentationLayerResult);
    }

    const demonstrationResult =
      normalizedOptions.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation(
        buildDemonstrationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!demonstrationResult.ok) {
      return freezeFailure(demonstrationResult);
    }

    const atlasRuntimeResult =
      normalizedOptions.validateAtlasEngineWorldPreviewRuntimeFoundation(
        buildRuntimeDefinition(foundation.locationRequest),
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

    const combinedPreviewResult =
      normalizedOptions.validateCombinedWorldPreviewGeneratorFoundation(
        buildCombinedPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!combinedPreviewResult.ok) {
      return freezeFailure(combinedPreviewResult);
    }

    const presentation =
      presentationLayerResult.atlasWorldPreviewPresentationLayer;
    const demonstration =
      demonstrationResult.atlasSyntheticWorldPreviewDemonstration;
    const atlasRuntime = atlasRuntimeResult.atlasWorldPreviewRuntime;
    const rendererIntegration =
      rendererIntegrationResult.atlasPreviewRendererIntegration;
    const combinedPreview = combinedPreviewResult.combinedWorldPreview;

    validateAtlasSessionId(foundation.atlasSessionId, atlasRuntime.atlasSessionId);
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      rendererIntegration.rendererRequest.rendererPayload
    );

    const showcaseProfile = selectShowcaseProfile(
      foundation.locationRequest.environmentType
    );
    const showcaseSummary = buildHumanReadableShowcaseSummary(
      foundation,
      showcaseProfile,
      presentation,
      demonstration
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasPreviewShowcaseSession: Object.freeze({
        showcaseId: createShowcaseId(
          foundation.showcaseId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed
        ),
        atlasSessionId: foundation.atlasSessionId,
        previewSceneId: presentation.previewSceneId,
        locationRequest: deepFreeze({ ...foundation.locationRequest }),
        presentationData: Object.freeze({
          worldSummary: presentation.worldSummary,
          sceneObjects: presentation.sceneObjects,
          environmentSummary: presentation.environmentSummary,
          cameraMetadata: presentation.metadata.previewCameraMetadata,
          showcaseProfile
        }),
        rendererPreview: Object.freeze({
          rendererPreviewData: presentation.rendererPreviewData,
          rendererCompatibilityVerified:
            rendererIntegration.verificationResult.rendererVerificationCompatible,
          payloadCount:
            rendererIntegration.rendererRequest.rendererPayload.length
        }),
        showcaseState: Object.freeze({
          currentState: "ready",
          allowedStates: atlasEnginePreviewShowcaseStates,
          liveRuntimeEnabled: false,
          realMapAttached: false,
          playerRuntimeEnabled: false
        }),
        showcaseSummary,
        deterministicVerification: Object.freeze({
          worldGenerationVerified:
            combinedPreview.validation.deterministicWorldPreviewVerified === true,
          presentationReadinessVerified: true,
          cameraMetadataVerified: true,
          rendererPreviewCompatibilityVerified:
            rendererIntegration.verificationResult.rendererVerificationCompatible,
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
      })
    });
  } catch (error) {
    if (error?.name !== "AtlasEnginePreviewShowcaseSessionValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasPreviewShowcaseSession: null
    });
  }
}

export function createAtlasEnginePreviewShowcaseSession(
  rawFoundation = atlasEnginePreviewShowcaseSessionFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_required",
      message:
        "Atlas preview showcase sessions require manual: true.",
      showcaseSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_required",
      message:
        "Atlas preview showcase sessions require isolated: true.",
      showcaseSession: null
    });
  }

  const validation = validateAtlasEnginePreviewShowcaseSessionFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      showcaseSession: null
    });
  }

  let showcaseState = "created";
  let failed = false;
  let failureMessage = null;
  const showcase = validation.atlasPreviewShowcaseSession;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    showcaseSession: Object.freeze({
      showcaseId: showcase.showcaseId,
      atlasSessionId: showcase.atlasSessionId,
      previewSceneId: showcase.previewSceneId,
      locationRequest: showcase.locationRequest,
      presentationData: showcase.presentationData,
      rendererPreview: showcase.rendererPreview,
      currentShowcaseState() {
        return showcaseState;
      },
      beginGeneration() {
        if (failed) {
          return freezeSessionFailure(failureMessage);
        }
        showcaseState = "generating";
        return freezeSessionStep(showcaseState, showcase.showcaseSummary);
      },
      markReady() {
        if (failed) {
          return freezeSessionFailure(failureMessage);
        }
        showcaseState = "ready";
        return freezeSessionStep(showcaseState, showcase.showcaseSummary);
      },
      beginPresentation() {
        if (failed) {
          return freezeSessionFailure(failureMessage);
        }
        showcaseState = "presenting";
        return freezeSessionStep(showcaseState, showcase.showcaseSummary);
      },
      completeShowcase() {
        if (failed) {
          return freezeSessionFailure(failureMessage);
        }
        showcaseState = "completed";
        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          showcaseState,
          showcaseSummary: showcase.showcaseSummary,
          affectedLiveRuntime: false
        });
      },
      failShowcase(reason = "Atlas preview showcase session failed.") {
        failed = true;
        showcaseState = "failed";
        failureMessage = normalizeStringValue(reason, "failShowcase.reason");
        return freezeSessionFailure(failureMessage);
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEnginePreviewShowcaseSessionContext(),
    validateAtlasEngineWorldPreviewPresentationLayerFoundation:
      options.validateAtlasEngineWorldPreviewPresentationLayerFoundation ??
      validateAtlasEngineWorldPreviewPresentationLayerFoundation,
    validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation:
      options.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation ??
      validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation,
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation,
    validateCombinedWorldPreviewGeneratorFoundation:
      options.validateCombinedWorldPreviewGeneratorFoundation ??
      validateCombinedWorldPreviewGeneratorFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine preview showcase session foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    showcaseId: normalizePermanentId(foundation.showcaseId, "showcaseId"),
    atlasSessionId: normalizePermanentId(
      foundation.atlasSessionId,
      "atlasSessionId"
    ),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    )
  });
}

function buildPresentationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildDemonstrationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildRuntimeDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewRuntimeFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildCombinedPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...combinedWorldPreviewGeneratorFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest }),
    worldSeed: locationRequest.worldSeed
  });
}

function selectShowcaseProfile(environmentType) {
  const profiles = Object.values(atlasEnginePreviewShowcaseProfiles);
  const profile =
    profiles.find((entry) => entry.environmentTypes.includes(environmentType)) ??
    null;

  if (!profile) {
    throw createValidationError(
      "unsupported_showcase_profile",
      `No approved showcase profile exists for environment type ${environmentType}.`
    );
  }

  return profile;
}

function validateAtlasSessionId(expectedSessionId, receivedSessionId) {
  if (expectedSessionId !== receivedSessionId) {
    throw createValidationError(
      "atlas_session_id_mismatch",
      "Atlas showcase session atlasSessionId must match the Atlas runtime session."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas showcase session expectedRendererPayloadCount does not match the renderer preview payload."
    );
  }
}

function buildHumanReadableShowcaseSummary(
  foundation,
  showcaseProfile,
  presentation,
  demonstration
) {
  return Object.freeze({
    location: `${foundation.locationRequest.locationId} (${foundation.locationRequest.region})`,
    theme: showcaseProfile.theme,
    landmarks: presentation.sceneObjects.landmarks.map((entry) => entry.assetId),
    buildings: presentation.sceneObjects.structures
      .filter((entry) => entry.rendererCategory === "buildings")
      .map((entry) => entry.assetId),
    environment: presentation.sceneObjects.environment.map((entry) => entry.assetId),
    camera: Object.freeze({
      profile: presentation.metadata.previewCameraMetadata.cameraProfile,
      focusTarget:
        presentation.metadata.previewCameraMetadata.focusTarget.assetId,
      zoomLevel: presentation.metadata.previewCameraMetadata.zoomLevel,
      orientation: presentation.metadata.previewCameraMetadata.orientation
    }),
    rendererStatus: Object.freeze({
      rendererProfile: presentation.rendererPreviewData.rendererProfile,
      payloadCount: presentation.rendererPreviewData.payloadCount,
      compatibilityVerified:
        presentation.rendererPreviewData.verificationResult
          .rendererVerificationCompatible
    }),
    previewModes: demonstration.rendererPreview.supportedPreviewModes
  });
}

function createShowcaseId(baseId, locationId, worldSeed) {
  return `${baseId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
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
    atlasPreviewShowcaseSession: null
  });
}

function freezeSessionStep(showcaseState, showcaseSummary) {
  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    showcaseState,
    showcaseSummary,
    affectedLiveRuntime: false
  });
}

function freezeSessionFailure(message) {
  return Object.freeze({
    ok: false,
    errorCode: "showcase_failed",
    message,
    showcaseState: "failed",
    affectedLiveRuntime: false
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEnginePreviewShowcaseSessionRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine preview showcase session foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEnginePreviewShowcaseSessionValidationError";
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
