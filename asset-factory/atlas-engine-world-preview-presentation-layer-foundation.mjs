import {
  atlasEngineDemoSceneQualityLayerFoundationDefinition,
  buildAtlasEngineDemoSceneQualityLayerContext,
  validateAtlasEngineDemoSceneQualityLayerFoundation
} from "./atlas-engine-demo-scene-quality-layer-foundation.mjs";
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

export const atlasEngineWorldPreviewPresentationLayerRequiredFields =
  Object.freeze([
    "presentationLayerId",
    "atlasSessionId",
    "locationRequest",
    "expectedRendererPayloadCount"
  ]);

export const atlasEngineWorldPreviewPresentationLayerFoundationDefinition =
  deepFreeze({
    presentationLayerId: "ATLAS_WORLD_PREVIEW_PRESENTATION_LAYER_001",
    atlasSessionId:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
    locationRequest: deepFreeze({
      ...atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.locationRequest
    }),
    expectedRendererPayloadCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

const cameraProfilesByEnvironmentType = deepFreeze({
  coastal: deepFreeze({
    cameraProfile: "coastal-overlook",
    positionOffset: { x: -18, y: 12 },
    zoomLevel: 1.22,
    orientation: "south-east"
  }),
  rural: deepFreeze({
    cameraProfile: "rural-panorama",
    positionOffset: { x: -22, y: 10 },
    zoomLevel: 1.08,
    orientation: "south-east"
  }),
  urban: deepFreeze({
    cameraProfile: "urban-streetfront",
    positionOffset: { x: -12, y: 8 },
    zoomLevel: 1.34,
    orientation: "south"
  }),
  park: deepFreeze({
    cameraProfile: "park-grove",
    positionOffset: { x: -16, y: 9 },
    zoomLevel: 1.16,
    orientation: "south-east"
  })
});

export function buildAtlasEngineWorldPreviewPresentationLayerContext() {
  return Object.freeze(buildAtlasEngineDemoSceneQualityLayerContext());
}

export function validateAtlasEngineWorldPreviewPresentationLayerFoundation(
  rawFoundation = atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const qualityLayerResult =
      normalizedOptions.validateAtlasEngineDemoSceneQualityLayerFoundation(
        buildQualityLayerDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!qualityLayerResult.ok) {
      return freezeFailure(qualityLayerResult);
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

    const qualityLayer = qualityLayerResult.atlasDemoSceneQualityLayer;
    const demonstration =
      demonstrationResult.atlasSyntheticWorldPreviewDemonstration;
    const atlasRuntime = atlasRuntimeResult.atlasWorldPreviewRuntime;
    const rendererIntegration =
      rendererIntegrationResult.atlasPreviewRendererIntegration;

    validateAtlasSessionId(foundation.atlasSessionId, atlasRuntime.atlasSessionId);
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      rendererIntegration.rendererRequest.rendererPayload
    );

    const sceneObjects = buildSceneObjects(
      rendererIntegration.rendererRequest.rendererPayload
    );
    const cameraMetadata = buildCameraMetadata(
      foundation.locationRequest.environmentType,
      sceneObjects,
      qualityLayer.worldQualityProfile
    );
    const worldSummary = buildWorldSummary(
      foundation,
      qualityLayer,
      demonstration,
      sceneObjects,
      cameraMetadata
    );
    const environmentSummary = buildEnvironmentSummary(
      qualityLayer,
      demonstration
    );
    const rendererPreviewData = buildRendererPreviewData(rendererIntegration);
    const metadata = buildPresentationMetadata(
      foundation,
      qualityLayer,
      sceneObjects,
      cameraMetadata
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasWorldPreviewPresentationLayer: Object.freeze({
        previewSceneId: createPreviewSceneId(
          foundation.presentationLayerId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed
        ),
        atlasSessionId: foundation.atlasSessionId,
        worldSummary,
        sceneObjects,
        environmentSummary,
        rendererPreviewData,
        metadata,
        demoSummaryPresentation: Object.freeze({
          location: demonstration.demoOutputSummary.location,
          biome: demonstration.demoOutputSummary.biome,
          worldQualityProfile:
            qualityLayer.demoSceneQualitySummary.worldQualityProfile,
          showcaseLocations: metadata.presentationQualityRules.showcaseLocations,
          previewFocusSelection:
            metadata.presentationQualityRules.previewFocusSelection
        }),
        deterministicVerification: Object.freeze({
          sameLocationAndSeedProduceIdenticalPresentation: true,
          presentationHash: createPreviewSceneId(
            foundation.presentationLayerId,
            foundation.locationRequest.locationId,
            foundation.locationRequest.worldSeed
          )
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
    if (
      error?.name !== "AtlasEngineWorldPreviewPresentationLayerValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasWorldPreviewPresentationLayer: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildAtlasEngineWorldPreviewPresentationLayerContext(),
    validateAtlasEngineDemoSceneQualityLayerFoundation:
      options.validateAtlasEngineDemoSceneQualityLayerFoundation ??
      validateAtlasEngineDemoSceneQualityLayerFoundation,
    validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation:
      options.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation ??
      validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation,
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine world preview presentation layer foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    presentationLayerId: normalizePermanentId(
      foundation.presentationLayerId,
      "presentationLayerId"
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

function buildQualityLayerDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineDemoSceneQualityLayerFoundationDefinition,
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

function validateAtlasSessionId(expectedSessionId, receivedSessionId) {
  if (expectedSessionId !== receivedSessionId) {
    throw createValidationError(
      "atlas_session_id_mismatch",
      "Atlas presentation layer atlasSessionId must match the Atlas runtime session."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas presentation layer expectedRendererPayloadCount does not match the renderer preview payload."
    );
  }
}

function buildSceneObjects(rendererPayload) {
  const normalizedObjects = rendererPayload.map((entry) =>
    Object.freeze({
      assetId: entry.rendererAssetReference.assetId,
      rendererCategory: entry.rendererAssetReference.rendererCategory,
      rendererLayer: entry.rendererAssetReference.rendererLayer,
      locationId: entry.transformData.locationId,
      position: deepFreeze({
        x: entry.transformData.position.x,
        y: entry.transformData.position.y
      }),
      orientation: entry.transformData.orientation,
      lodProfile: entry.lodProfile,
      visibilityState: entry.visibilityMetadata.visibilityState,
      priority: entry.visibilityMetadata.priority,
      distanceToPlayerMetres: entry.visibilityMetadata.distanceToPlayerMetres
    })
  );

  return Object.freeze({
    landmarks: deepFreeze(
      normalizedObjects.filter((entry) => isLandmarkAsset(entry.assetId))
    ),
    structures: deepFreeze(
      normalizedObjects.filter(
        (entry) =>
          !isLandmarkAsset(entry.assetId) &&
          ["buildings", "roads"].includes(entry.rendererCategory)
      )
    ),
    environment: deepFreeze(
      normalizedObjects.filter(
        (entry) =>
          !isLandmarkAsset(entry.assetId) &&
          !["buildings", "roads"].includes(entry.rendererCategory)
      )
    )
  });
}

function buildCameraMetadata(environmentType, sceneObjects, qualityProfile) {
  const profile = cameraProfilesByEnvironmentType[environmentType] ?? null;
  if (!profile) {
    throw createValidationError(
      "unsupported_camera_profile",
      `No approved camera profile exists for environment type ${environmentType}.`
    );
  }

  const focusTarget =
    sceneObjects.landmarks[0] ??
    sceneObjects.structures.find((entry) => entry.rendererCategory === "buildings") ??
    highestPriorityObject(sceneObjects.structures) ??
    highestPriorityObject(sceneObjects.environment);

  if (!focusTarget) {
    throw createValidationError(
      "missing_focus_target",
      "Atlas presentation layer requires a deterministic focus target."
    );
  }

  return Object.freeze({
    cameraProfile: profile.cameraProfile,
    viewPosition: deepFreeze({
      x: Number((focusTarget.position.x + profile.positionOffset.x).toFixed(4)),
      y: Number((focusTarget.position.y + profile.positionOffset.y).toFixed(4))
    }),
    focusTarget: Object.freeze({
      assetId: focusTarget.assetId,
      locationId: focusTarget.locationId
    }),
    zoomLevel: Number(
      (
        profile.zoomLevel +
        qualityProfile.structureDensity * 0.1 -
        qualityProfile.environmentBalance * 0.05
      ).toFixed(4)
    ),
    orientation: profile.orientation
  });
}

function buildWorldSummary(
  foundation,
  qualityLayer,
  demonstration,
  sceneObjects,
  cameraMetadata
) {
  const showcaseLocations = collectShowcaseLocations(sceneObjects);

  return Object.freeze({
    location: demonstration.demoOutputSummary.location,
    biome: demonstration.demoOutputSummary.biome,
    objectCounts: Object.freeze({
      landmarks: sceneObjects.landmarks.length,
      structures: sceneObjects.structures.length,
      environment: sceneObjects.environment.length
    }),
    worldQualityProfile:
      qualityLayer.demoSceneQualitySummary.worldQualityProfile,
    showcaseLocations,
    previewFocusSelection: Object.freeze({
      assetId: cameraMetadata.focusTarget.assetId,
      locationId: cameraMetadata.focusTarget.locationId
    }),
    deterministicPresentationId: createPreviewSceneId(
      foundation.presentationLayerId,
      foundation.locationRequest.locationId,
      foundation.locationRequest.worldSeed
    )
  });
}

function buildEnvironmentSummary(qualityLayer, demonstration) {
  return Object.freeze({
    biome: demonstration.demoOutputSummary.biome,
    vegetation:
      qualityLayer.demoSceneQualitySummary.vegetation,
    paths: qualityLayer.demoSceneQualitySummary.paths,
    compositionRules:
      qualityLayer.demoSceneQualitySummary.compositionRules
  });
}

function buildRendererPreviewData(rendererIntegration) {
  return Object.freeze({
    rendererProfile: rendererIntegration.rendererRequest.rendererProfile,
    previewModes: rendererIntegration.rendererRequest.previewModes,
    payloadCount: rendererIntegration.rendererRequest.rendererPayload.length,
    attachmentState: rendererIntegration.attachmentState.currentState,
    verificationResult: rendererIntegration.verificationResult
  });
}

function buildPresentationMetadata(
  foundation,
  qualityLayer,
  sceneObjects,
  cameraMetadata
) {
  const showcaseLocations = collectShowcaseLocations(sceneObjects);

  return Object.freeze({
    locationRequest: deepFreeze({ ...foundation.locationRequest }),
    previewCameraMetadata: cameraMetadata,
    presentationQualityRules: Object.freeze({
      landmarkHighlighting:
        sceneObjects.landmarks.length > 0
          ? sceneObjects.landmarks.map((entry) => entry.assetId)
          : ["BUILDING_HOUSE_SMALL_COASTAL_001"],
      showcaseLocations,
      pointsOfInterest: deepFreeze(
        [
          ...sceneObjects.landmarks.map((entry) => entry.locationId),
          ...sceneObjects.structures
            .filter((entry) => entry.rendererCategory === "buildings")
            .map((entry) => entry.locationId)
            .slice(0, 2),
          ...sceneObjects.structures
            .filter((entry) => entry.rendererCategory === "roads")
            .map((entry) => entry.locationId)
            .slice(0, 1)
        ].filter(Boolean)
      ),
      previewFocusSelection: Object.freeze({
        assetId: cameraMetadata.focusTarget.assetId,
        locationId: cameraMetadata.focusTarget.locationId
      })
    }),
    worldQualityProfileId:
      qualityLayer.worldQualityProfile.worldQualityProfileId,
    passiveOnly: true
  });
}

function collectShowcaseLocations(sceneObjects) {
  const ranked = [
    ...sceneObjects.landmarks,
    ...sceneObjects.structures,
    ...sceneObjects.environment
  ].sort((left, right) => right.priority - left.priority);

  return deepFreeze(
    ranked.slice(0, 3).map((entry) =>
      Object.freeze({
        assetId: entry.assetId,
        locationId: entry.locationId
      })
    )
  );
}

function highestPriorityObject(entries) {
  if (entries.length === 0) {
    return null;
  }
  return [...entries].sort((left, right) => right.priority - left.priority)[0];
}

function isLandmarkAsset(assetId) {
  return (
    assetId.includes("LIGHTHOUSE") ||
    assetId.includes("LANDMARK") ||
    assetId.includes("SIGN_GENERIC")
  );
}

function createPreviewSceneId(baseId, locationId, worldSeed) {
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
    atlasWorldPreviewPresentationLayer: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineWorldPreviewPresentationLayerRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine world preview presentation layer foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineWorldPreviewPresentationLayerValidationError";
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
