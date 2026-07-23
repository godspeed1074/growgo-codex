import {
  atlasEnginePreviewShowcaseSessionFoundationDefinition,
  buildAtlasEnginePreviewShowcaseSessionContext,
  validateAtlasEnginePreviewShowcaseSessionFoundation
} from "./atlas-engine-preview-showcase-session-foundation.mjs";
import {
  atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
  validateAtlasEngineWorldPreviewPresentationLayerFoundation
} from "./atlas-engine-world-preview-presentation-layer-foundation.mjs";
import {
  atlasEnginePreviewRendererIntegrationFoundationDefinition,
  validateAtlasEnginePreviewRendererIntegrationFoundation
} from "./atlas-engine-preview-renderer-integration-foundation.mjs";
import {
  atlasEngineWorldPreviewRuntimeFoundationDefinition,
  validateAtlasEngineWorldPreviewRuntimeFoundation
} from "./atlas-engine-world-preview-runtime-foundation.mjs";

export const atlasEngineShowcaseRenderDemonstrationRequiredFields =
  Object.freeze([
    "renderDemonstrationId",
    "atlasSessionId",
    "locationRequest",
    "expectedRendererPayloadCount"
  ]);

export const atlasEngineShowcaseRenderModes = Object.freeze([
  "day_showcase",
  "sunset_showcase",
  "night_showcase"
]);

export const atlasEngineShowcaseRenderDemonstrationFoundationDefinition =
  deepFreeze({
    renderDemonstrationId: "ATLAS_SHOWCASE_RENDER_DEMONSTRATION_001",
    atlasSessionId:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
    locationRequest: deepFreeze({
      ...atlasEnginePreviewShowcaseSessionFoundationDefinition.locationRequest
    }),
    expectedRendererPayloadCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const renderModeByEnvironmentType = deepFreeze({
  coastal: "day_showcase",
  rural: "sunset_showcase",
  park: "sunset_showcase",
  urban: "night_showcase"
});
const appearanceProfileByRenderMode = deepFreeze({
  day_showcase: "DAY_COASTAL_LIGHTHOUSE",
  sunset_showcase: "SUNSET_COASTAL_LIGHTHOUSE",
  night_showcase: "NIGHT_COASTAL_LIGHTHOUSE"
});
const cameraRuleByEnvironmentType = deepFreeze({
  coastal: "scenic_viewpoint",
  rural: "exploration_view",
  park: "scenic_viewpoint",
  urban: "landmark_focus"
});

export function buildAtlasEngineShowcaseRenderDemonstrationContext() {
  return Object.freeze(buildAtlasEnginePreviewShowcaseSessionContext());
}

export function validateAtlasEngineShowcaseRenderDemonstrationFoundation(
  rawFoundation = atlasEngineShowcaseRenderDemonstrationFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const showcaseSessionResult =
      normalizedOptions.validateAtlasEnginePreviewShowcaseSessionFoundation(
        buildShowcaseDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!showcaseSessionResult.ok) {
      return freezeFailure(showcaseSessionResult);
    }

    const presentationLayerResult =
      normalizedOptions.validateAtlasEngineWorldPreviewPresentationLayerFoundation(
        buildPresentationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!presentationLayerResult.ok) {
      return freezeFailure(presentationLayerResult);
    }

    const rendererIntegrationResult =
      normalizedOptions.validateAtlasEnginePreviewRendererIntegrationFoundation(
        atlasEnginePreviewRendererIntegrationFoundationDefinition,
        { context: normalizedOptions.context }
      );
    if (!rendererIntegrationResult.ok) {
      return freezeFailure(rendererIntegrationResult);
    }

    const atlasRuntimeResult =
      normalizedOptions.validateAtlasEngineWorldPreviewRuntimeFoundation(
        buildRuntimeDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!atlasRuntimeResult.ok) {
      return freezeFailure(atlasRuntimeResult);
    }

    const showcaseSession = showcaseSessionResult.atlasPreviewShowcaseSession;
    const presentationLayer =
      presentationLayerResult.atlasWorldPreviewPresentationLayer;
    const rendererIntegration =
      rendererIntegrationResult.atlasPreviewRendererIntegration;
    const atlasRuntime = atlasRuntimeResult.atlasWorldPreviewRuntime;

    validateAtlasSessionId(foundation.atlasSessionId, atlasRuntime.atlasSessionId);
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      rendererIntegration.rendererRequest.rendererPayload
    );

    const renderMode = selectRenderMode(foundation.locationRequest.environmentType);
    const cameraSelection = buildCameraSelection(
      foundation.locationRequest.environmentType,
      presentationLayer
    );

    validateCameraMetadata(presentationLayer.metadata.previewCameraMetadata);
    validateRendererPayload(rendererIntegration.rendererRequest.rendererPayload);
    validateAssetReferences(rendererIntegration.verificationResult.verifiedAssetIds);
    validateAppearanceProfiles(
      renderMode,
      rendererIntegration.rendererRequest.verificationReference
        .supportedAppearanceProfiles
    );

    const showcaseRenderDemonstration = Object.freeze({
      showcaseRenderRequest: Object.freeze({
        showcaseId: showcaseSession.showcaseId,
        atlasSessionId: showcaseSession.atlasSessionId,
        previewSceneId: showcaseSession.previewSceneId,
        cameraProfile: presentationLayer.metadata.previewCameraMetadata.cameraProfile,
        rendererPayload: rendererIntegration.rendererRequest.rendererPayload,
        renderMode
      }),
      cameraSelectionRules: Object.freeze({
        rule: cameraSelection.rule,
        focusTarget: cameraSelection.focusTarget,
        scenicViewpoint: cameraSelection.scenicViewpoint,
        explorationView: cameraSelection.explorationView
      }),
      finalDemoSummary: buildFinalDemoSummary(
        foundation,
        showcaseSession,
        presentationLayer,
        cameraSelection,
        renderMode
      ),
      deterministicVerification: Object.freeze({
        sameLocationAndSeedProduceIdenticalShowcaseRender: true,
        renderHash: createRenderHash(
          foundation.renderDemonstrationId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed,
          renderMode
        )
      }),
      validation: Object.freeze({
        showcaseSessionVerified: true,
        worldPreviewVerified: true,
        cameraMetadataVerified: true,
        rendererPayloadVerified: true,
        assetReferencesVerified: true,
        appearanceProfilesVerified: true,
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
      atlasShowcaseRenderDemonstration: showcaseRenderDemonstration
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineShowcaseRenderDemonstrationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasShowcaseRenderDemonstration: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEngineShowcaseRenderDemonstrationContext(),
    validateAtlasEnginePreviewShowcaseSessionFoundation:
      options.validateAtlasEnginePreviewShowcaseSessionFoundation ??
      validateAtlasEnginePreviewShowcaseSessionFoundation,
    validateAtlasEngineWorldPreviewPresentationLayerFoundation:
      options.validateAtlasEngineWorldPreviewPresentationLayerFoundation ??
      validateAtlasEngineWorldPreviewPresentationLayerFoundation,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation,
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine showcase render demonstration foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    renderDemonstrationId: normalizePermanentId(
      foundation.renderDemonstrationId,
      "renderDemonstrationId"
    ),
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

function buildShowcaseDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEnginePreviewShowcaseSessionFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildPresentationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildRuntimeDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineWorldPreviewRuntimeFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateAtlasSessionId(expectedSessionId, receivedSessionId) {
  if (expectedSessionId !== receivedSessionId) {
    throw createValidationError(
      "atlas_session_id_mismatch",
      "Atlas showcase render demonstration atlasSessionId must match the Atlas runtime session."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas showcase render demonstration expectedRendererPayloadCount does not match the renderer payload."
    );
  }
}

function selectRenderMode(environmentType) {
  const renderMode = renderModeByEnvironmentType[environmentType] ?? null;
  if (!renderMode) {
    throw createValidationError(
      "unsupported_render_mode",
      `No approved showcase render mode exists for environment type ${environmentType}.`
    );
  }
  return renderMode;
}

function buildCameraSelection(environmentType, presentationLayer) {
  const rule = cameraRuleByEnvironmentType[environmentType] ?? "exploration_view";
  const showcaseLocations =
    presentationLayer.metadata.presentationQualityRules.showcaseLocations;
  const focusTarget =
    presentationLayer.metadata.previewCameraMetadata.focusTarget;
  const scenicViewpoint = showcaseLocations[0] ?? focusTarget;
  const explorationView = showcaseLocations[1] ?? focusTarget;

  return Object.freeze({
    rule,
    focusTarget,
    scenicViewpoint,
    explorationView
  });
}

function validateCameraMetadata(cameraMetadata) {
  if (
    !cameraMetadata ||
    typeof cameraMetadata.cameraProfile !== "string" ||
    typeof cameraMetadata.orientation !== "string"
  ) {
    throw createValidationError(
      "invalid_camera_metadata",
      "Atlas showcase render demonstration requires valid preview camera metadata."
    );
  }
}

function validateRendererPayload(rendererPayload) {
  for (const entry of rendererPayload) {
    if (
      !entry.rendererAssetReference ||
      typeof entry.rendererAssetReference.assetId !== "string" ||
      !entry.transformData ||
      !entry.placementData
    ) {
      throw createValidationError(
        "invalid_renderer_payload",
        "Atlas showcase render demonstration requires renderer payload entries with asset references, transform data, and placement data."
      );
    }
  }
}

function validateAssetReferences(assetIds) {
  for (const assetId of assetIds) {
    if (!permanentIdPattern.test(assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas showcase render demonstration requires approved permanent asset IDs."
      );
    }
  }
}

function validateAppearanceProfiles(renderMode, supportedAppearanceProfiles) {
  const requiredAppearanceProfile = appearanceProfileByRenderMode[renderMode];
  if (!supportedAppearanceProfiles.includes(requiredAppearanceProfile)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Atlas showcase render demonstration requires the approved appearance profile for the selected showcase render mode."
    );
  }
}

function buildFinalDemoSummary(
  foundation,
  showcaseSession,
  presentationLayer,
  cameraSelection,
  renderMode
) {
  return Object.freeze({
    location: showcaseSession.showcaseSummary.location,
    experienceTheme: showcaseSession.showcaseSummary.theme,
    landmarks: showcaseSession.showcaseSummary.landmarks,
    structures: showcaseSession.showcaseSummary.buildings,
    environment: showcaseSession.showcaseSummary.environment,
    camera: Object.freeze({
      profile: presentationLayer.metadata.previewCameraMetadata.cameraProfile,
      rule: cameraSelection.rule,
      focusTarget: cameraSelection.focusTarget,
      orientation: presentationLayer.metadata.previewCameraMetadata.orientation,
      zoomLevel: presentationLayer.metadata.previewCameraMetadata.zoomLevel
    }),
    rendererStatus: Object.freeze({
      renderMode,
      rendererProfile: showcaseSession.rendererPreview.rendererPreviewData.rendererProfile,
      payloadCount: showcaseSession.rendererPreview.payloadCount,
      compatibilityVerified:
        showcaseSession.rendererPreview.rendererCompatibilityVerified
    }),
    renderDemonstrationId: createRenderHash(
      foundation.renderDemonstrationId,
      foundation.locationRequest.locationId,
      foundation.locationRequest.worldSeed,
      renderMode
    )
  });
}

function createRenderHash(baseId, locationId, worldSeed, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${renderMode}`
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
    atlasShowcaseRenderDemonstration: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineShowcaseRenderDemonstrationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine showcase render demonstration foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineShowcaseRenderDemonstrationValidationError";
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
