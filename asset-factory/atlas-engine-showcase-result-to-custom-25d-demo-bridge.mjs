import {
  atlasEngineShowcaseOutputPackageFoundationDefinition,
  buildAtlasEngineShowcaseOutputPackageContext,
  validateAtlasEngineShowcaseOutputPackageFoundation
} from "./atlas-engine-showcase-output-package-foundation.mjs";
import {
  atlasEngineShowcaseExecutionFoundationDefinition,
  validateAtlasEngineShowcaseExecutionFoundation
} from "./atlas-engine-showcase-execution-foundation.mjs";
import {
  atlasEngineShowcaseRenderDemonstrationFoundationDefinition,
  atlasEngineShowcaseRenderModes,
  validateAtlasEngineShowcaseRenderDemonstrationFoundation
} from "./atlas-engine-showcase-render-demonstration-foundation.mjs";
import {
  atlasEnginePreviewRendererIntegrationFoundationDefinition,
  validateAtlasEnginePreviewRendererIntegrationFoundation
} from "./atlas-engine-preview-renderer-integration-foundation.mjs";
import {
  validateSyntheticWorldToCustom25DPassiveRendererBridge
} from "./synthetic-world-to-custom-25d-passive-renderer-bridge.mjs";

export const atlasEngineShowcaseResultToCustom25DDemoBridgeRequiredFields =
  Object.freeze([
    "bridgeId",
    "resultId",
    "executionId",
    "showcaseId",
    "locationRequest",
    "expectedRendererPayloadCount"
  ]);

export const atlasEngineShowcaseResultToCustom25DDemoBridgePreviewModes =
  Object.freeze([...atlasEngineShowcaseRenderModes]);

export const atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition =
  deepFreeze({
    bridgeId: "ATLAS_SHOWCASE_RESULT_TO_CUSTOM_25D_DEMO_BRIDGE_001",
    resultId: atlasEngineShowcaseOutputPackageFoundationDefinition.resultId,
    executionId: atlasEngineShowcaseExecutionFoundationDefinition.executionId,
    showcaseId: atlasEngineShowcaseOutputPackageFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineShowcaseRenderDemonstrationFoundationDefinition.locationRequest
    }),
    expectedRendererPayloadCount:
      atlasEngineShowcaseOutputPackageFoundationDefinition.expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildAtlasEngineShowcaseResultToCustom25DDemoBridgeContext() {
  return Object.freeze(buildAtlasEngineShowcaseOutputPackageContext());
}

export function validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
  rawFoundation = atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition,
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

    const renderDemonstrationResult =
      normalizedOptions.validateAtlasEngineShowcaseRenderDemonstrationFoundation(
        buildRenderDemonstrationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!renderDemonstrationResult.ok) {
      return freezeFailure(renderDemonstrationResult);
    }

    const rendererIntegrationResult =
      normalizedOptions.validateAtlasEnginePreviewRendererIntegrationFoundation(
        atlasEnginePreviewRendererIntegrationFoundationDefinition,
        { context: normalizedOptions.context }
      );
    if (!rendererIntegrationResult.ok) {
      return freezeFailure(rendererIntegrationResult);
    }

    const syntheticDemoBridgeResult =
      normalizedOptions.validateSyntheticWorldToCustom25DPassiveRendererBridge();
    if (!syntheticDemoBridgeResult.ok) {
      return freezeFailure(syntheticDemoBridgeResult);
    }

    const atlasShowcaseOutputPackage =
      outputPackageResult.atlasShowcaseOutputPackage;
    const atlasShowcaseExecution = executionResult.atlasShowcaseExecution;
    const atlasShowcaseRenderDemonstration =
      renderDemonstrationResult.atlasShowcaseRenderDemonstration;
    const atlasPreviewRendererIntegration =
      rendererIntegrationResult.atlasPreviewRendererIntegration;
    const syntheticDemoBridge =
      syntheticDemoBridgeResult.custom25DRendererSceneConsumer;

    validateResultId(
      foundation.resultId,
      atlasShowcaseOutputPackage.resultId,
      foundation.locationRequest,
      atlasShowcaseOutputPackage.presentationSummary.renderMode
    );
    validateExecutionId(
      foundation.executionId,
      atlasShowcaseOutputPackage.executionId,
      foundation.locationRequest,
      atlasShowcaseOutputPackage.presentationSummary.renderMode
    );
    validateShowcaseId(
      foundation.showcaseId,
      atlasShowcaseOutputPackage.showcaseId,
      foundation.locationRequest
    );
    validatePreviewSceneId(
      atlasShowcaseOutputPackage.metadata.sourceTrace.previewSceneId,
      atlasShowcaseExecution.pipelineExecution.presentationReadiness.previewSceneId
    );
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      atlasPreviewRendererIntegration.rendererRequest.rendererPayload
    );
    validateWorldSummary(atlasShowcaseOutputPackage.worldSummary);
    validateCameraMetadata(atlasShowcaseOutputPackage.presentationSummary);
    validatePreviewMode(atlasShowcaseOutputPackage.presentationSummary.renderMode);
    validateRendererPayloadCompatibility(
      atlasPreviewRendererIntegration.rendererRequest.rendererPayload
    );
    validateDemoObjects(syntheticDemoBridge.rendererPayloads);

    const atlasShowcaseResultToCustom25DDemoBridge = Object.freeze({
      atlasResultId: atlasShowcaseOutputPackage.resultId,
      previewSceneId: atlasShowcaseOutputPackage.metadata.sourceTrace.previewSceneId,
      rendererPayload:
        atlasPreviewRendererIntegration.rendererRequest.rendererPayload,
      cameraProfile: atlasShowcaseOutputPackage.presentationSummary.cameraProfile,
      renderMode: atlasShowcaseOutputPackage.presentationSummary.renderMode,
      verificationState: Object.freeze({
        atlasResultValid: true,
        worldSummaryValid: true,
        assetReferencesValid: true,
        environmentReferencesValid: true,
        cameraMetadataValid: true,
        rendererPayloadCompatibilityValid: true,
        demoObjectsValidatedAgainstPassiveCustom25DContract: true,
        demoObjectAssetIds: deepFreeze(
          syntheticDemoBridge.rendererPayloads.map(
            (entry) => entry.rendererAssetReference.assetId
          )
        ),
        verifiedAssetIds:
          atlasPreviewRendererIntegration.verificationResult.verifiedAssetIds,
        rendererVerificationCompatible:
          atlasPreviewRendererIntegration.verificationResult
            .rendererVerificationCompatible,
        manualOnly: true,
        isolated: true,
        lifecycleExecutionEnabled: false,
        automaticMapAttachmentEnabled: false,
        liveWorldRuntimeEnabled: false
      }),
      bridgeRequest: Object.freeze({
        rendererProfile:
          atlasPreviewRendererIntegration.rendererRequest.rendererProfile,
        previewModes: atlasEngineShowcaseResultToCustom25DDemoBridgePreviewModes,
        focusTarget:
          atlasShowcaseOutputPackage.presentationSummary.focusTarget,
        zoom: atlasShowcaseOutputPackage.presentationSummary.zoom,
        orientation:
          atlasShowcaseOutputPackage.presentationSummary.orientation
      }),
      deterministicVerification: Object.freeze({
        sameAtlasResultProducesIdenticalRendererRequest: true,
        bridgeHash: createBridgeHash(
          foundation.bridgeId,
          atlasShowcaseOutputPackage.resultId,
          atlasShowcaseOutputPackage.presentationSummary.renderMode
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
        renderDemonstrationVerified:
          atlasShowcaseRenderDemonstration.validation.rendererPayloadVerified ===
          true
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasShowcaseResultToCustom25DDemoBridge
    });
  } catch (error) {
    if (
      error?.name !==
      "AtlasEngineShowcaseResultToCustom25DDemoBridgeValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasShowcaseResultToCustom25DDemoBridge: null
    });
  }
}

export function createAtlasEngineShowcaseResultToCustom25DDemoBridgeSession(
  rawFoundation = atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_demo_required",
      message:
        "Atlas showcase result to Custom 2.5D demo bridge sessions require manual: true.",
      custom25dDemoBridgeSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_demo_required",
      message:
        "Atlas showcase result to Custom 2.5D demo bridge sessions require isolated: true.",
      custom25dDemoBridgeSession: null
    });
  }

  const validation = validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      custom25dDemoBridgeSession: null
    });
  }

  let sessionState = "prepared";
  let renderGranted = false;
  let closed = false;
  const bridge = validation.atlasShowcaseResultToCustom25DDemoBridge;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    custom25dDemoBridgeSession: Object.freeze({
      atlasResultId: bridge.atlasResultId,
      previewSceneId: bridge.previewSceneId,
      currentSessionState() {
        return sessionState;
      },
      startManualRender(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas showcase result to Custom 2.5D demo bridge rejects manual render after session closure.",
            renderActivation: null
          });
        }

        if (requestOptions.manualRenderAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_render_authorization_required",
            message:
              "Atlas showcase result to Custom 2.5D demo bridge requires manualRenderAuthorized: true before render activation.",
            renderActivation: null
          });
        }

        if (renderGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_render_prevented",
            message:
              "Atlas showcase result to Custom 2.5D demo bridge prevents duplicate manual render activation for the same prepared session.",
            renderActivation: null
          });
        }

        renderGranted = true;
        sessionState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          renderActivation: Object.freeze({
            atlasResultId: bridge.atlasResultId,
            previewSceneId: bridge.previewSceneId,
            rendererPayload: bridge.rendererPayload,
            cameraProfile: bridge.cameraProfile,
            renderMode: bridge.renderMode,
            verificationState: bridge.verificationState,
            sessionState,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closeDemoBridgeSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateRenderCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        sessionState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-showcase-demo-bridge-session-closed",
          releasedStateCount: bridge.rendererPayload.length,
          duplicateRenderCreated: false,
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
      buildAtlasEngineShowcaseResultToCustom25DDemoBridgeContext(),
    validateAtlasEngineShowcaseOutputPackageFoundation:
      options.validateAtlasEngineShowcaseOutputPackageFoundation ??
      validateAtlasEngineShowcaseOutputPackageFoundation,
    validateAtlasEngineShowcaseExecutionFoundation:
      options.validateAtlasEngineShowcaseExecutionFoundation ??
      validateAtlasEngineShowcaseExecutionFoundation,
    validateAtlasEngineShowcaseRenderDemonstrationFoundation:
      options.validateAtlasEngineShowcaseRenderDemonstrationFoundation ??
      validateAtlasEngineShowcaseRenderDemonstrationFoundation,
    validateAtlasEnginePreviewRendererIntegrationFoundation:
      options.validateAtlasEnginePreviewRendererIntegrationFoundation ??
      validateAtlasEnginePreviewRendererIntegrationFoundation,
    validateSyntheticWorldToCustom25DPassiveRendererBridge:
      options.validateSyntheticWorldToCustom25DPassiveRendererBridge ??
      validateSyntheticWorldToCustom25DPassiveRendererBridge
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine showcase result to Custom 2.5D demo bridge foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    bridgeId: normalizePermanentId(foundation.bridgeId, "bridgeId"),
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

function buildRenderDemonstrationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineShowcaseRenderDemonstrationFoundationDefinition,
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
      "Atlas showcase result to Custom 2.5D demo bridge resultId must match the deterministic Atlas showcase output package ID."
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
      "Atlas showcase result to Custom 2.5D demo bridge executionId must match the deterministic Atlas showcase execution ID."
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
      "Atlas showcase result to Custom 2.5D demo bridge showcaseId must match the deterministic Atlas showcase session ID."
    );
  }
}

function validatePreviewSceneId(expectedPreviewSceneId, receivedPreviewSceneId) {
  if (expectedPreviewSceneId !== receivedPreviewSceneId) {
    throw createValidationError(
      "preview_scene_id_mismatch",
      "Atlas showcase result to Custom 2.5D demo bridge previewSceneId must match the validated Atlas preview scene."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas showcase result to Custom 2.5D demo bridge expectedRendererPayloadCount does not match the renderer payload."
    );
  }
}

function validateWorldSummary(worldSummary) {
  if (
    !worldSummary ||
    typeof worldSummary.biome !== "string" ||
    typeof worldSummary.terrain !== "string" ||
    typeof worldSummary.qualityProfile !== "string"
  ) {
    throw createValidationError(
      "invalid_world_summary",
      "Atlas showcase result to Custom 2.5D demo bridge requires a valid Atlas world summary."
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
      "Atlas showcase result to Custom 2.5D demo bridge requires valid preview camera metadata."
    );
  }
}

function validatePreviewMode(renderMode) {
  if (
    !atlasEngineShowcaseResultToCustom25DDemoBridgePreviewModes.includes(renderMode)
  ) {
    throw createValidationError(
      "unsupported_render_mode",
      "Atlas showcase result to Custom 2.5D demo bridge requires an approved showcase render mode."
    );
  }
}

function validateRendererPayloadCompatibility(rendererPayload) {
  for (const entry of rendererPayload) {
    if (
      !entry.rendererAssetReference ||
      typeof entry.rendererAssetReference.assetId !== "string" ||
      entry.passiveRendererPayload?.metadata?.adapterProfile !==
        "custom-2.5d-passive"
    ) {
      throw createValidationError(
        "invalid_renderer_payload",
        "Atlas showcase result to Custom 2.5D demo bridge requires compatible passive Custom 2.5D renderer payload entries."
      );
    }
  }
}

function validateDemoObjects(rendererPayloads) {
  const assetIds = rendererPayloads.map(
    (entry) => entry.rendererAssetReference.assetId
  );
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas showcase result to Custom 2.5D demo bridge requires demo asset ${assetId}.`
      );
    }
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

function createBridgeHash(baseId, resultId, renderMode) {
  return `${baseId}_${stableNumericHash(`${resultId}::${renderMode}::bridge`)}`;
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
    atlasShowcaseResultToCustom25DDemoBridge: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineShowcaseResultToCustom25DDemoBridgeRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine showcase result to Custom 2.5D demo bridge foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineShowcaseResultToCustom25DDemoBridgeValidationError";
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
