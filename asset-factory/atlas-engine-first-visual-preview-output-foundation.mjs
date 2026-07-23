import {
  atlasEngineControlledDemoRenderExecutionFoundationDefinition,
  buildAtlasEngineControlledDemoRenderExecutionContext,
  validateAtlasEngineControlledDemoRenderExecutionFoundation
} from "./atlas-engine-controlled-demo-render-execution-foundation.mjs";
import {
  atlasEngineShowcaseResultToCustom25DDemoBridgeFoundationDefinition,
  validateAtlasEngineShowcaseResultToCustom25DDemoBridge
} from "./atlas-engine-showcase-result-to-custom-25d-demo-bridge.mjs";

export const atlasEngineFirstVisualPreviewOutputRequiredFields = Object.freeze([
  "previewId",
  "renderExecutionId",
  "resultId",
  "executionId",
  "showcaseId",
  "locationRequest",
  "expectedSceneObjectCount"
]);

export const atlasEngineFirstVisualPreviewOutputLifecycleStates = Object.freeze([
  "created",
  "loading",
  "rendering",
  "display_ready",
  "verified",
  "closed",
  "failed"
]);

export const atlasEngineFirstVisualPreviewOutputLightingModes = Object.freeze([
  "day_showcase",
  "sunset_showcase",
  "night_showcase"
]);

export const atlasEngineFirstVisualPreviewOutputFoundationDefinition =
  deepFreeze({
    previewId: "ATLAS_FIRST_VISUAL_PREVIEW_OUTPUT_001",
    renderExecutionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.renderExecutionId,
    resultId: atlasEngineControlledDemoRenderExecutionFoundationDefinition.resultId,
    executionId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.executionId,
    showcaseId:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineControlledDemoRenderExecutionFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineControlledDemoRenderExecutionFoundationDefinition
        .expectedRendererPayloadCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredPreviewAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);
const renderModeToLightingMode = deepFreeze({
  day_showcase: "day_showcase",
  sunset_showcase: "sunset_showcase",
  night_showcase: "night_showcase"
});

export function buildAtlasEngineFirstVisualPreviewOutputContext() {
  return Object.freeze(buildAtlasEngineControlledDemoRenderExecutionContext());
}

export function validateAtlasEngineFirstVisualPreviewOutputFoundation(
  rawFoundation = atlasEngineFirstVisualPreviewOutputFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const renderExecutionResult =
      normalizedOptions.validateAtlasEngineControlledDemoRenderExecutionFoundation(
        buildRenderExecutionDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!renderExecutionResult.ok) {
      return freezeFailure(renderExecutionResult);
    }

    const bridgeResult =
      normalizedOptions.validateAtlasEngineShowcaseResultToCustom25DDemoBridge(
        buildBridgeDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const renderExecution =
      renderExecutionResult.atlasControlledDemoRenderExecution;
    const bridge = bridgeResult.atlasShowcaseResultToCustom25DDemoBridge;

    validateResultId(
      foundation.resultId,
      renderExecution.atlasResultId,
      foundation.locationRequest,
      bridge.renderMode
    );
    validateExecutionId(
      foundation.executionId,
      renderExecution.renderSummary,
      foundation.locationRequest,
      bridge.renderMode
    );
    validateShowcaseId(
      foundation.showcaseId,
      renderExecution.renderSummary,
      foundation.locationRequest
    );
    validateRenderExecutionId(
      foundation.renderExecutionId,
      renderExecution.renderExecutionId,
      renderExecution.atlasResultId,
      bridge.renderMode
    );
    validateSceneObjectCount(
      foundation.expectedSceneObjectCount,
      bridge.rendererPayload
    );
    validatePreviewAssets(bridge.verificationState.demoObjectAssetIds);
    validateCameraState(renderExecution.renderSummary.camera);
    validateLightingMode(bridge.renderMode);
    validatePreviewViewpoint(renderExecution.renderSummary.camera);

    const sceneObjects = deepFreeze(
      bridge.rendererPayload.map((entry, index) =>
        Object.freeze({
          objectId: `${entry.rendererAssetReference.assetId}_${String(index + 1).padStart(3, "0")}`,
          assetId: entry.rendererAssetReference.assetId,
          category: entry.rendererAssetReference.category,
          lodProfile: entry.passiveRendererPayload.metadata.lodProfile,
          placementData: deepFreeze({
            ...entry.passiveRendererPayload.placementData
          }),
          visibilityState: entry.passiveRendererPayload.visibilityState,
          transformData: deepFreeze({
            ...entry.passiveRendererPayload.transformData
          })
        })
      )
    );

    const atlasFirstVisualPreviewOutput = Object.freeze({
      previewId: createPreviewHash(
        foundation.previewId,
        renderExecution.renderExecutionId,
        bridge.renderMode
      ),
      renderExecutionId: renderExecution.renderExecutionId,
      sceneObjects,
      cameraState: Object.freeze({
        profile: renderExecution.renderSummary.camera.profile,
        focusTarget: renderExecution.renderSummary.camera.focusTarget,
        orientation: renderExecution.renderSummary.camera.orientation,
        zoom: renderExecution.renderSummary.camera.zoom,
        viewpoint: createViewpointLabel(renderExecution.renderSummary.camera)
      }),
      lightingState: Object.freeze({
        currentMode: renderModeToLightingMode[bridge.renderMode],
        supportedModes: atlasEngineFirstVisualPreviewOutputLightingModes,
        appearanceProfiles: deepFreeze([
          "DAY_COASTAL_LIGHTHOUSE",
          "SUNSET_COASTAL_LIGHTHOUSE",
          "NIGHT_COASTAL_LIGHTHOUSE"
        ])
      }),
      renderStatus: Object.freeze({
        currentState: "verified",
        allowedStates: atlasEngineFirstVisualPreviewOutputLifecycleStates,
        displayReady: true,
        verified: true,
        failed: false,
        liveWorldRuntimeEnabled: false
      }),
      verificationResult: Object.freeze({
        previewObjectsValid: true,
        cameraProfileValid: true,
        focusTargetValid: true,
        orientationValid: true,
        zoomValid: true,
        viewpointValid: true,
        lightingModeValid: true,
        renderExecutionValid: true,
        rendererPayloadCompatibilityValid:
          bridge.verificationState.rendererPayloadCompatibilityValid === true,
        verifiedAssetIds: bridge.verificationState.demoObjectAssetIds,
        verifiedRendererPayloadCount: bridge.rendererPayload.length
      }),
      metadata: Object.freeze({
        resultId: renderExecution.atlasResultId,
        executionId: createExecutionHash(
          foundation.executionId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed,
          bridge.renderMode
        ),
        showcaseId: createShowcaseId(
          foundation.showcaseId,
          foundation.locationRequest.locationId,
          foundation.locationRequest.worldSeed
        ),
        rendererProfile: bridge.bridgeRequest.rendererProfile,
        previewSceneId: bridge.previewSceneId,
        manualOnly: true,
        isolated: true,
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveWorldRuntimeEnabled: false,
        rendererModified: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false
      }),
      cleanupState: Object.freeze({
        closePreviewSupported: true,
        releaseStateSupported: true,
        duplicatePreviewRejected: true,
        staleReferenceRejected: true,
        affectedLiveRuntime: false
      }),
      deterministicVerification: Object.freeze({
        sameRenderExecutionProducesIdenticalPreviewOutput: true,
        previewHash: createPreviewHash(
          foundation.previewId,
          renderExecution.renderExecutionId,
          bridge.renderMode
        )
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstVisualPreviewOutput
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineFirstVisualPreviewOutputValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstVisualPreviewOutput: null
    });
  }
}

export function createAtlasEngineFirstVisualPreviewOutputSession(
  rawFoundation = atlasEngineFirstVisualPreviewOutputFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_required",
      message:
        "Atlas first visual preview output sessions require manual: true.",
      atlasVisualPreviewSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_required",
      message:
        "Atlas first visual preview output sessions require isolated: true.",
      atlasVisualPreviewSession: null
    });
  }

  const validation = validateAtlasEngineFirstVisualPreviewOutputFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasVisualPreviewSession: null
    });
  }

  let previewState = "created";
  let displayGranted = false;
  let closed = false;
  const preview = validation.atlasFirstVisualPreviewOutput;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasVisualPreviewSession: Object.freeze({
      previewId: preview.previewId,
      renderExecutionId: preview.renderExecutionId,
      currentPreviewState() {
        return previewState;
      },
      showPreview(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first visual preview output rejects display after session closure.",
            previewDisplay: null
          });
        }

        if (requestOptions.manualPreviewAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_preview_authorization_required",
            message:
              "Atlas first visual preview output requires manualPreviewAuthorized: true before display.",
            previewDisplay: null
          });
        }

        if (displayGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_preview_prevented",
            message:
              "Atlas first visual preview output prevents duplicate display activation for the same prepared session.",
            previewDisplay: null
          });
        }

        displayGranted = true;
        previewState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          previewDisplay: Object.freeze({
            previewId: preview.previewId,
            renderExecutionId: preview.renderExecutionId,
            renderStatus: preview.renderStatus,
            cameraState: preview.cameraState,
            lightingState: preview.lightingState,
            verificationResult: preview.verificationResult,
            liveWorldRuntimeEnabled: false,
            realMapAttached: false
          })
        });
      },
      closePreviewSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicatePreviewCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        previewState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-first-visual-preview-session-closed",
          releasedStateCount: preview.sceneObjects.length,
          duplicatePreviewCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineFirstVisualPreviewOutputContext(),
    validateAtlasEngineControlledDemoRenderExecutionFoundation:
      options.validateAtlasEngineControlledDemoRenderExecutionFoundation ??
      validateAtlasEngineControlledDemoRenderExecutionFoundation,
    validateAtlasEngineShowcaseResultToCustom25DDemoBridge:
      options.validateAtlasEngineShowcaseResultToCustom25DDemoBridge ??
      validateAtlasEngineShowcaseResultToCustom25DDemoBridge
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first visual preview output foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
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

function buildRenderExecutionDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineControlledDemoRenderExecutionFoundationDefinition,
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
      "Atlas first visual preview output resultId must match the deterministic Atlas showcase output package ID."
    );
  }
}

function validateExecutionId(
  expectedExecutionId,
  renderSummary,
  locationRequest,
  renderMode
) {
  const expectedResolvedId = createExecutionHash(
    expectedExecutionId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    renderMode
  );
  const receivedExecutionId = createExecutionHash(
    expectedExecutionId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    renderSummary.mode
  );
  if (receivedExecutionId !== expectedResolvedId) {
    throw createValidationError(
      "execution_id_mismatch",
      "Atlas first visual preview output executionId must match the deterministic Atlas showcase execution ID."
    );
  }
}

function validateShowcaseId(expectedShowcaseId, renderSummary, locationRequest) {
  const expectedResolvedId = createShowcaseId(
    expectedShowcaseId,
    locationRequest.locationId,
    locationRequest.worldSeed
  );
  const receivedShowcaseId = createShowcaseId(
    expectedShowcaseId,
    locationRequest.locationId,
    locationRequest.worldSeed
  );
  if (
    receivedShowcaseId !== expectedResolvedId ||
    typeof renderSummary.location !== "string"
  ) {
    throw createValidationError(
      "showcase_id_mismatch",
      "Atlas first visual preview output showcaseId must match the deterministic Atlas showcase session ID."
    );
  }
}

function validateRenderExecutionId(
  expectedBaseId,
  receivedRenderExecutionId,
  resultId,
  renderMode
) {
  const expectedResolvedId = createRenderExecutionHash(
    expectedBaseId,
    resultId,
    renderMode
  );
  if (receivedRenderExecutionId !== expectedResolvedId) {
    throw createValidationError(
      "render_execution_id_mismatch",
      "Atlas first visual preview output renderExecutionId must match the deterministic controlled demo render execution ID."
    );
  }
}

function validateSceneObjectCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "scene_object_count_mismatch",
      "Atlas first visual preview output expectedSceneObjectCount must match the renderer payload."
    );
  }
}

function validatePreviewAssets(assetIds) {
  for (const assetId of requiredPreviewAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_required_preview_asset",
        "Atlas first visual preview output requires the approved lighthouse, house, road, and tree preview assets."
      );
    }
  }
}

function validateCameraState(cameraState) {
  if (
    !cameraState ||
    typeof cameraState.profile !== "string" ||
    typeof cameraState.focusTarget !== "string" ||
    typeof cameraState.orientation !== "string" ||
    !Number.isFinite(cameraState.zoom)
  ) {
    throw createValidationError(
      "invalid_camera_state",
      "Atlas first visual preview output requires valid camera profile, focus target, orientation, and zoom values."
    );
  }
}

function validateLightingMode(renderMode) {
  if (!atlasEngineFirstVisualPreviewOutputLightingModes.includes(renderMode)) {
    throw createValidationError(
      "invalid_lighting_mode",
      "Atlas first visual preview output requires an approved showcase lighting mode."
    );
  }
}

function validatePreviewViewpoint(cameraState) {
  if (createViewpointLabel(cameraState).length === 0) {
    throw createValidationError(
      "invalid_viewpoint",
      "Atlas first visual preview output requires a deterministic preview viewpoint."
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

function createPreviewHash(baseId, renderExecutionId, renderMode) {
  return `${baseId}_${stableNumericHash(
    `${renderExecutionId}::${renderMode}::visual-preview`
  )}`;
}

function createViewpointLabel(cameraState) {
  return `${cameraState.profile}:${cameraState.focusTarget}:${cameraState.orientation}:${cameraState.zoom}`;
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
    atlasFirstVisualPreviewOutput: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstVisualPreviewOutputRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first visual preview output foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineFirstVisualPreviewOutputValidationError";
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
