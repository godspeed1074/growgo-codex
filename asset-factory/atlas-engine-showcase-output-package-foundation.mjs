import {
  atlasEngineShowcaseExecutionFoundationDefinition,
  buildAtlasEngineShowcaseExecutionContext,
  validateAtlasEngineShowcaseExecutionFoundation
} from "./atlas-engine-showcase-execution-foundation.mjs";
import {
  atlasEngineShowcaseRenderDemonstrationFoundationDefinition
} from "./atlas-engine-showcase-render-demonstration-foundation.mjs";
import {
  atlasEnginePreviewShowcaseSessionFoundationDefinition,
  validateAtlasEnginePreviewShowcaseSessionFoundation
} from "./atlas-engine-preview-showcase-session-foundation.mjs";
import {
  atlasEngineWorldPreviewPresentationLayerFoundationDefinition,
  validateAtlasEngineWorldPreviewPresentationLayerFoundation
} from "./atlas-engine-world-preview-presentation-layer-foundation.mjs";
import {
  atlasEngineDemoSceneQualityLayerFoundationDefinition,
  validateAtlasEngineDemoSceneQualityLayerFoundation
} from "./atlas-engine-demo-scene-quality-layer-foundation.mjs";

export const atlasEngineShowcaseOutputPackageRequiredFields = Object.freeze([
  "resultId",
  "executionId",
  "showcaseId",
  "locationRequest",
  "expectedRendererPayloadCount",
  "exportReady"
]);

export const atlasEngineShowcaseOutputPackageFoundationDefinition = deepFreeze({
  resultId: "ATLAS_SHOWCASE_OUTPUT_PACKAGE_001",
  executionId: atlasEngineShowcaseExecutionFoundationDefinition.executionId,
  showcaseId: atlasEnginePreviewShowcaseSessionFoundationDefinition.showcaseId,
  locationRequest: deepFreeze({
    ...atlasEngineShowcaseRenderDemonstrationFoundationDefinition.locationRequest
  }),
  expectedRendererPayloadCount:
    atlasEngineShowcaseRenderDemonstrationFoundationDefinition.expectedRendererPayloadCount,
  exportReady: true
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildAtlasEngineShowcaseOutputPackageContext() {
  return Object.freeze(buildAtlasEngineShowcaseExecutionContext());
}

export function validateAtlasEngineShowcaseOutputPackageFoundation(
  rawFoundation = atlasEngineShowcaseOutputPackageFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const executionResult =
      normalizedOptions.validateAtlasEngineShowcaseExecutionFoundation(
        buildExecutionDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!executionResult.ok) {
      return freezeFailure(executionResult);
    }

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

    const qualityLayerResult =
      normalizedOptions.validateAtlasEngineDemoSceneQualityLayerFoundation(
        buildQualityLayerDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!qualityLayerResult.ok) {
      return freezeFailure(qualityLayerResult);
    }

    const execution = executionResult.atlasShowcaseExecution;
    const showcaseSession = showcaseSessionResult.atlasPreviewShowcaseSession;
    const presentationLayer =
      presentationLayerResult.atlasWorldPreviewPresentationLayer;
    const qualityLayer = qualityLayerResult.atlasDemoSceneQualityLayer;

    validateExecutionId(
      foundation.executionId,
      execution.executionSession.executionId,
      foundation.locationRequest,
      execution.executionSession.resultSummary.rendererStatus.renderMode
    );
    validateShowcaseId(
      foundation.showcaseId,
      execution.executionSession.showcaseId,
      foundation.locationRequest
    );
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      execution.executionSession.resultSummary.rendererStatus.payloadCount
    );

    const showcaseOutputPackage = Object.freeze({
      resultId: createResultHash(
        foundation.resultId,
        foundation.locationRequest.locationId,
        foundation.locationRequest.worldSeed,
        execution.executionSession.resultSummary.rendererStatus.renderMode
      ),
      executionId: execution.executionSession.executionId,
      showcaseId: execution.executionSession.showcaseId,
      locationSummary: buildLocationSummary(foundation, showcaseSession),
      worldSummary: buildWorldSummary(presentationLayer, qualityLayer),
      assetSummary: buildAssetSummary(
        presentationLayer,
        qualityLayer
      ),
      environmentSummary: buildEnvironmentSummary(
        presentationLayer,
        qualityLayer
      ),
      presentationSummary: buildPresentationSummary(
        showcaseSession,
        execution
      ),
      rendererSummary: buildRendererSummary(
        execution,
        presentationLayer
      ),
      metadata: buildMetadata(
        foundation,
        execution,
        presentationLayer,
        qualityLayer
      ),
      deterministicVerification: Object.freeze({
        sameExecutionInputProducesIdenticalOutputPackage: true,
        outputPackageHash: createResultHash(
          foundation.resultId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed,
          execution.executionSession.resultSummary.rendererStatus.renderMode
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
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasShowcaseOutputPackage: showcaseOutputPackage
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineShowcaseOutputPackageValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasShowcaseOutputPackage: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineShowcaseOutputPackageContext(),
    validateAtlasEngineShowcaseExecutionFoundation:
      options.validateAtlasEngineShowcaseExecutionFoundation ??
      validateAtlasEngineShowcaseExecutionFoundation,
    validateAtlasEnginePreviewShowcaseSessionFoundation:
      options.validateAtlasEnginePreviewShowcaseSessionFoundation ??
      validateAtlasEnginePreviewShowcaseSessionFoundation,
    validateAtlasEngineWorldPreviewPresentationLayerFoundation:
      options.validateAtlasEngineWorldPreviewPresentationLayerFoundation ??
      validateAtlasEngineWorldPreviewPresentationLayerFoundation,
    validateAtlasEngineDemoSceneQualityLayerFoundation:
      options.validateAtlasEngineDemoSceneQualityLayerFoundation ??
      validateAtlasEngineDemoSceneQualityLayerFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine showcase output package foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    resultId: normalizePermanentId(foundation.resultId, "resultId"),
    executionId: normalizePermanentId(foundation.executionId, "executionId"),
    showcaseId: normalizePermanentId(foundation.showcaseId, "showcaseId"),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    ),
    exportReady: normalizeBoolean(foundation.exportReady, "exportReady")
  });
}

function buildExecutionDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseExecutionFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
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

function buildQualityLayerDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineDemoSceneQualityLayerFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
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
      "Atlas showcase output package executionId must match the deterministic Atlas showcase execution ID."
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
      "Atlas showcase output package showcaseId must match the deterministic Atlas showcase session ID."
    );
  }
}

function validateRendererPayloadCount(expectedCount, receivedCount) {
  if (receivedCount !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas showcase output package expectedRendererPayloadCount does not match the renderer payload count."
    );
  }
}

function buildLocationSummary(foundation, showcaseSession) {
  return Object.freeze({
    locationId: foundation.locationRequest.locationId,
    region: foundation.locationRequest.region,
    environmentType: foundation.locationRequest.environmentType,
    coordinates: Object.freeze({
      latitude: foundation.locationRequest.latitude,
      longitude: foundation.locationRequest.longitude
    }),
    displayLabel: showcaseSession.showcaseSummary.location
  });
}

function buildWorldSummary(presentationLayer, qualityLayer) {
  const allSceneObjects = [
    ...presentationLayer.sceneObjects.landmarks,
    ...presentationLayer.sceneObjects.structures,
    ...presentationLayer.sceneObjects.environment
  ];

  return Object.freeze({
    biome: qualityLayer.demoSceneQualitySummary.biome.biomeId,
    terrain: qualityLayer.demoSceneQualitySummary.biome.terrainType,
    qualityProfile: qualityLayer.worldQualityProfile.worldQualityProfileId,
    densityProfile: Object.freeze({
      structureDensity: qualityLayer.worldQualityProfile.structureDensity,
      landmarkDensity: qualityLayer.worldQualityProfile.landmarkDensity,
      vegetationDensity: qualityLayer.worldQualityProfile.vegetationDensity,
      decorationDensity: qualityLayer.worldQualityProfile.decorationDensity
    }),
    generatedCounts: Object.freeze({
      landmarks: countLandmarkAssets(allSceneObjects),
      structures: presentationLayer.worldSummary.objectCounts.structures,
      environment: presentationLayer.worldSummary.objectCounts.environment
    })
  });
}

function buildAssetSummary(presentationLayer, qualityLayer) {
  return Object.freeze({
    landmarks: buildAssetVersionSummary(presentationLayer.sceneObjects.landmarks),
    structures: buildAssetVersionSummary(presentationLayer.sceneObjects.structures),
    environmentAssets: buildAssetVersionSummary(
      presentationLayer.sceneObjects.environment
    ),
    versions: buildCombinedAssetVersions(presentationLayer.sceneObjects),
    qualityInformation: Object.freeze({
      worldQualityProfile:
        qualityLayer.demoSceneQualitySummary.worldQualityProfile
          .worldQualityProfileId,
      landmarkWeighting:
        qualityLayer.demoSceneQualitySummary.landmarks.weighting,
      structureDensityScore:
        qualityLayer.demoSceneQualitySummary.buildings.densityScore,
      vegetationDensityScore:
        qualityLayer.demoSceneQualitySummary.vegetation.densityScore
    })
  });
}

function buildEnvironmentSummary(presentationLayer, qualityLayer) {
  return Object.freeze({
    biome: presentationLayer.environmentSummary.biome.biomeId,
    vegetation: presentationLayer.environmentSummary.vegetation,
    paths: presentationLayer.environmentSummary.paths,
    compositionRules: presentationLayer.environmentSummary.compositionRules,
    densityProfile: Object.freeze({
      vegetationDensity: qualityLayer.worldQualityProfile.vegetationDensity,
      decorationDensity: qualityLayer.worldQualityProfile.decorationDensity
    })
  });
}

function buildPresentationSummary(showcaseSession, execution) {
  return Object.freeze({
    cameraProfile: showcaseSession.showcaseSummary.camera.profile,
    focusTarget: showcaseSession.showcaseSummary.camera.focusTarget,
    zoom: showcaseSession.showcaseSummary.camera.zoomLevel,
    orientation: showcaseSession.showcaseSummary.camera.orientation,
    renderMode: execution.executionSession.resultSummary.rendererStatus.renderMode
  });
}

function buildRendererSummary(execution, presentationLayer) {
  return Object.freeze({
    rendererStatus: Object.freeze({
      rendererProfile:
        execution.executionSession.resultSummary.rendererStatus.rendererProfile,
      compatibilityVerified:
        execution.executionSession.resultSummary.rendererStatus.compatibilityVerified
    }),
    payloadStatus: Object.freeze({
      payloadCount:
        execution.executionSession.resultSummary.rendererStatus.payloadCount,
      attachmentState: presentationLayer.rendererPreviewData.attachmentState,
      previewModes: presentationLayer.rendererPreviewData.previewModes
    }),
    verificationResult:
      presentationLayer.rendererPreviewData.verificationResult
  });
}

function buildMetadata(foundation, execution, presentationLayer, qualityLayer) {
  return Object.freeze({
    exportReadiness: Object.freeze({
      portablePackageReady: foundation.exportReady,
      serializableFormat: "json-compatible-passive-package",
      runtimeHandlesIncluded: false,
      externalServicesRequired: false,
      liveMapDependenciesIncluded: false
    }),
    sourceTrace: Object.freeze({
      executionId: execution.executionSession.executionId,
      previewSceneId:
        execution.pipelineExecution.presentationReadiness.previewSceneId,
      worldQualityProfileId:
        qualityLayer.worldQualityProfile.worldQualityProfileId
    }),
    previewFocusSelection:
      presentationLayer.worldSummary.previewFocusSelection,
    deterministicPackageCreated: true
  });
}

function buildAssetVersionSummary(entries) {
  return deepFreeze(
    entries.map((entry) =>
      Object.freeze({
        assetId: entry.assetId,
        version: parseAssetVersion(entry.assetId),
        priority: entry.priority
      })
    )
  );
}

function buildCombinedAssetVersions(sceneObjects) {
  const uniqueAssetIds = [
    ...new Set(
      [
        ...sceneObjects.landmarks,
        ...sceneObjects.structures,
        ...sceneObjects.environment
      ].map((entry) => entry.assetId)
    )
  ];
  return deepFreeze(
    uniqueAssetIds.map((assetId) =>
      Object.freeze({
        assetId,
        version: parseAssetVersion(assetId)
      })
    )
  );
}

function parseAssetVersion(assetId) {
  const parts = assetId.split("_");
  return parts[parts.length - 1] ?? "UNKNOWN";
}

function countLandmarkAssets(entries) {
  return entries.filter((entry) =>
    entry.assetId.includes("LIGHTHOUSE") ||
    entry.assetId.includes("LANDMARK") ||
    entry.assetId.includes("SIGN")
  ).length;
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
    atlasShowcaseOutputPackage: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineShowcaseOutputPackageRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine showcase output package foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineShowcaseOutputPackageValidationError";
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
