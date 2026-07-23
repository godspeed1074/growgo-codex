import {
  atlasEngineFirstControlledCanvasDrawFoundationDefinition,
  buildAtlasEngineFirstControlledCanvasDrawContext,
  validateAtlasEngineFirstControlledCanvasDrawFoundation
} from "./atlas-engine-first-controlled-canvas-draw-test.mjs";

export const atlasEngineFirstVisibleCanvasDrawResultRequiredFields =
  Object.freeze([
    "captureId",
    "drawSessionId",
    "activationId",
    "displaySessionId",
    "verificationId",
    "previewId",
    "renderExecutionId",
    "resultId",
    "executionId",
    "showcaseId",
    "locationRequest",
    "expectedSceneObjectCount"
  ]);

export const atlasEngineFirstVisibleCanvasDrawResultStates = Object.freeze([
  "created",
  "capturing",
  "captured",
  "verified",
  "closed",
  "failed"
]);

export const atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition =
  deepFreeze({
    captureId: "ATLAS_FIRST_VISIBLE_CANVAS_DRAW_RESULT_001",
    drawSessionId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.drawSessionId,
    activationId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.activationId,
    displaySessionId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.displaySessionId,
    verificationId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.verificationId,
    previewId: atlasEngineFirstControlledCanvasDrawFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.renderExecutionId,
    resultId: atlasEngineFirstControlledCanvasDrawFoundationDefinition.resultId,
    executionId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.executionId,
    showcaseId:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineFirstControlledCanvasDrawFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineFirstControlledCanvasDrawFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildAtlasEngineFirstVisibleCanvasDrawResultContext() {
  return Object.freeze(buildAtlasEngineFirstControlledCanvasDrawContext());
}

export function validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
  rawFoundation = atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const drawResult =
      normalizedOptions.validateAtlasEngineFirstControlledCanvasDrawFoundation(
        buildDrawDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!drawResult.ok) {
      return freezeFailure(drawResult);
    }

    const draw = drawResult.atlasFirstControlledCanvasDraw;
    const lightingMode = draw.canvasState.lightingMode;

    validateDrawSessionId(
      foundation.drawSessionId,
      draw.drawSessionId,
      draw.captureId,
      lightingMode
    );
    validateDrawCaptureId(
      foundation.captureId,
      draw.drawSessionId,
      lightingMode
    );
    validateCanvasState(draw.canvasState);
    validateDrawCommands(draw.drawCommands);
    validateDrawResult(draw.drawResult, foundation.expectedSceneObjectCount);
    validateExpectedObjects(draw.verificationResult.verifiedAssetIds);

    const captureId = createVisibleCaptureHash(
      foundation.captureId,
      draw.drawSessionId,
      lightingMode
    );
    const canvasResult = Object.freeze({
      exists: true,
      width: draw.canvasState.width,
      height: draw.canvasState.height,
      pixelRatio: draw.canvasState.pixelRatio,
      lightingMode,
      drawCommandCount: draw.drawCommands.length,
      drawCommandsExecuted: true
    });
    const frameResult = Object.freeze({
      frameProduced: true,
      visibleState: draw.drawResult.visibleState,
      objectCount: draw.drawResult.objectCount,
      includedAssetIds: draw.verificationResult.verifiedAssetIds,
      cameraResult: draw.drawResult.cameraResult,
      lightingResult: draw.drawResult.lightingResult,
      rendererResult: draw.drawResult.rendererResult,
      deterministicOutput: true
    });
    const verificationState = Object.freeze({
      currentState: "verified",
      allowedStates: atlasEngineFirstVisibleCanvasDrawResultStates,
      canvasExists: true,
      drawCommandsExecuted: true,
      frameProduced: true,
      expectedObjectsIncluded: true,
      deterministicOutput: true
    });
    const cleanupState = Object.freeze({
      clearCanvasSupported: true,
      releaseStateSupported: true,
      duplicateSessionsRejected: true,
      cleanupSuccessful: true,
      affectedLiveRuntime: false
    });

    const atlasFirstVisibleCanvasDrawResult = Object.freeze({
      captureId,
      drawSessionId: draw.drawSessionId,
      canvasResult,
      frameResult,
      verificationState,
      cleanupState,
      metadata: Object.freeze({
        manualOnly: true,
        isolated: true,
        passiveOnly: true,
        activationId: draw.metadata.activationId,
        displaySessionId: draw.metadata.displaySessionId,
        verificationId: draw.metadata.verificationId,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveMapAttached: false,
        playerRuntimeEnabled: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false
      }),
      deterministicVerification: Object.freeze({
        sameDrawSessionProducesIdenticalVisibleCapture: true,
        visibleCaptureHash: captureId
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstVisibleCanvasDrawResult
    });
  } catch (error) {
    if (
      error?.name !==
      "AtlasEngineFirstVisibleCanvasDrawResultValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstVisibleCanvasDrawResult: null
    });
  }
}

export function createAtlasEngineFirstVisibleCanvasDrawResultSession(
  rawFoundation = atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_visible_capture_required",
      message:
        "Atlas first visible canvas draw result sessions require manual: true.",
      atlasFirstVisibleCanvasDrawResultSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_visible_capture_required",
      message:
        "Atlas first visible canvas draw result sessions require isolated: true.",
      atlasFirstVisibleCanvasDrawResultSession: null
    });
  }

  const validation =
    validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
      rawFoundation,
      options
    );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasFirstVisibleCanvasDrawResultSession: null
    });
  }

  let captureState = "created";
  let captured = false;
  let closed = false;
  const visibleCapture = validation.atlasFirstVisibleCanvasDrawResult;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasFirstVisibleCanvasDrawResultSession: Object.freeze({
      captureId: visibleCapture.captureId,
      drawSessionId: visibleCapture.drawSessionId,
      currentCaptureState() {
        return captureState;
      },
      captureFrame(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first visible canvas draw result rejects capture after session closure.",
            visibleCaptureResult: null
          });
        }

        if (requestOptions.manualCaptureAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_visible_capture_authorization_required",
            message:
              "Atlas first visible canvas draw result requires manualCaptureAuthorized: true before frame capture.",
            visibleCaptureResult: null
          });
        }

        if (captured) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_visible_capture_prevented",
            message:
              "Atlas first visible canvas draw result prevents duplicate capture for the same draw session.",
            visibleCaptureResult: null
          });
        }

        captured = true;
        captureState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          visibleCaptureResult: Object.freeze({
            captureId: visibleCapture.captureId,
            drawSessionId: visibleCapture.drawSessionId,
            captureState,
            canvasResult: visibleCapture.canvasResult,
            frameResult: visibleCapture.frameResult,
            verificationState: visibleCapture.verificationState,
            liveMapAttached: false,
            playerRuntimeEnabled: false
          })
        });
      },
      closeCapture() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        captureState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus:
            "atlas-first-visible-canvas-draw-result-session-closed",
          releasedStateCount: visibleCapture.frameResult.includedAssetIds.length,
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
      buildAtlasEngineFirstVisibleCanvasDrawResultContext(),
    validateAtlasEngineFirstControlledCanvasDrawFoundation:
      options.validateAtlasEngineFirstControlledCanvasDrawFoundation ??
      validateAtlasEngineFirstControlledCanvasDrawFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first visible canvas draw result foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    captureId: normalizePermanentId(foundation.captureId, "captureId"),
    drawSessionId: normalizePermanentId(
      foundation.drawSessionId,
      "drawSessionId"
    ),
    activationId: normalizePermanentId(foundation.activationId, "activationId"),
    displaySessionId: normalizePermanentId(
      foundation.displaySessionId,
      "displaySessionId"
    ),
    verificationId: normalizePermanentId(
      foundation.verificationId,
      "verificationId"
    ),
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

function buildDrawDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineFirstControlledCanvasDrawFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateDrawSessionId(
  expectedBaseId,
  receivedDrawSessionId,
  drawCaptureId,
  lightingMode
) {
  const expectedResolvedId = createDrawSessionHash(
    expectedBaseId,
    drawCaptureId,
    lightingMode
  );
  if (receivedDrawSessionId !== expectedResolvedId) {
    throw createValidationError(
      "draw_session_id_mismatch",
      "Atlas first visible canvas draw result drawSessionId must match the deterministic draw session ID."
    );
  }
}

function validateDrawCaptureId(
  expectedBaseId,
  receivedDrawSessionId,
  lightingMode
) {
  const expectedResolvedId = createVisibleCaptureHash(
    expectedBaseId,
    receivedDrawSessionId,
    lightingMode
  );
  if (!expectedResolvedId.startsWith(`${expectedBaseId}_`)) {
    throw createValidationError(
      "capture_id_generation_failed",
      "Atlas first visible canvas draw result captureId generation failed."
    );
  }
}

function validateCanvasState(canvasState) {
  if (
    !canvasState ||
    canvasState.currentState !== "verified" ||
    canvasState.width <= 0 ||
    canvasState.height <= 0
  ) {
    throw createValidationError(
      "invalid_canvas_state",
      "Atlas first visible canvas draw result requires a verified canvas state."
    );
  }
}

function validateDrawCommands(drawCommands) {
  if (!Array.isArray(drawCommands) || drawCommands.length < 4) {
    throw createValidationError(
      "invalid_draw_commands",
      "Atlas first visible canvas draw result requires approved draw commands."
    );
  }
}

function validateDrawResult(drawResult, expectedCount) {
  if (
    !drawResult ||
    drawResult.visibleState !== "verified-visible" ||
    drawResult.objectCount !== expectedCount ||
    drawResult.outputDeterministic !== true ||
    drawResult.drawnCommandCount < 4
  ) {
    throw createValidationError(
      "invalid_draw_result",
      "Atlas first visible canvas draw result requires a verified deterministic draw result."
    );
  }
}

function validateExpectedObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_expected_object",
        `Atlas first visible canvas draw result requires expected object ${assetId}.`
      );
    }
  }
}

function createDrawSessionHash(baseId, captureId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${captureId}::${lightingMode}::draw`
  )}`;
}

function createVisibleCaptureHash(baseId, drawSessionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${drawSessionId}::${lightingMode}::visible-capture`
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
    atlasFirstVisibleCanvasDrawResult: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstVisibleCanvasDrawResultRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first visible canvas draw result foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineFirstVisibleCanvasDrawResultValidationError";
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
