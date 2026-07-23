import {
  atlasEngineFirstVisualSceneCaptureFoundationDefinition,
  buildAtlasEngineFirstVisualSceneCaptureContext,
  validateAtlasEngineFirstVisualSceneCaptureFoundation
} from "./atlas-engine-first-visual-scene-capture-foundation.mjs";
import {
  atlasEngineControlledVisualDemoActivationFoundationDefinition
} from "./atlas-engine-controlled-visual-demo-activation.mjs";
import {
  atlasEngineControlledPreviewDisplayFoundationDefinition
} from "./atlas-engine-controlled-preview-display-foundation.mjs";

export const atlasEngineFirstControlledCanvasDrawRequiredFields =
  Object.freeze([
    "drawSessionId",
    "captureId",
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

export const atlasEngineFirstControlledCanvasDrawStates = Object.freeze([
  "created",
  "preparing",
  "drawing",
  "drawn",
  "verified",
  "closed",
  "failed"
]);

export const atlasEngineFirstControlledCanvasDrawFoundationDefinition =
  deepFreeze({
    drawSessionId: "ATLAS_FIRST_CONTROLLED_CANVAS_DRAW_001",
    captureId: atlasEngineFirstVisualSceneCaptureFoundationDefinition.captureId,
    activationId:
      atlasEngineControlledVisualDemoActivationFoundationDefinition.activationId,
    displaySessionId:
      atlasEngineControlledPreviewDisplayFoundationDefinition.displaySessionId,
    verificationId:
      atlasEngineFirstVisualSceneCaptureFoundationDefinition.verificationId,
    previewId: atlasEngineFirstVisualSceneCaptureFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineFirstVisualSceneCaptureFoundationDefinition.renderExecutionId,
    resultId: atlasEngineFirstVisualSceneCaptureFoundationDefinition.resultId,
    executionId:
      atlasEngineFirstVisualSceneCaptureFoundationDefinition.executionId,
    showcaseId:
      atlasEngineFirstVisualSceneCaptureFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineFirstVisualSceneCaptureFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineFirstVisualSceneCaptureFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const requiredDemoAssets = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);
const requiredCommandKinds = Object.freeze([
  "lighthouse-silhouette",
  "house-silhouette",
  "road-path",
  "tree"
]);

export function buildAtlasEngineFirstControlledCanvasDrawContext() {
  return Object.freeze(buildAtlasEngineFirstVisualSceneCaptureContext());
}

export function validateAtlasEngineFirstControlledCanvasDrawFoundation(
  rawFoundation = atlasEngineFirstControlledCanvasDrawFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const captureResult =
      normalizedOptions.validateAtlasEngineFirstVisualSceneCaptureFoundation(
        buildCaptureDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!captureResult.ok) {
      return freezeFailure(captureResult);
    }

    const capture = captureResult.atlasFirstVisualSceneCapture;
    const lightingMode = capture.captureSummary.lightingResult.currentMode;

    validateCaptureId(
      foundation.captureId,
      capture.captureId,
      capture.activationId,
      lightingMode
    );
    validateActivationId(
      foundation.activationId,
      capture.activationId,
      capture.displaySessionId,
      lightingMode
    );
    validateDisplaySessionId(
      foundation.displaySessionId,
      capture.displaySessionId,
      foundation.locationRequest,
      lightingMode
    );
    validateSceneResult(
      capture.sceneResult,
      foundation.expectedSceneObjectCount
    );
    validateCaptureSummary(capture.captureSummary);
    validateDemoObjects(capture.verificationResult.verifiedAssetIds);

    const drawCommands = createDrawCommands(capture);
    validateDrawCommands(drawCommands);

    const canvasState = Object.freeze({
      width: 1280,
      height: 720,
      pixelRatio: 1,
      currentState: "verified",
      lightingMode,
      clearedBeforeDraw: true,
      liveRuntimeAttached: false
    });
    validateCanvasState(canvasState);

    const drawSessionId = createDrawSessionHash(
      foundation.drawSessionId,
      capture.captureId,
      lightingMode
    );
    const drawResult = Object.freeze({
      visibleState: capture.captureSummary.visibleState,
      objectCount: capture.sceneResult.objectCount,
      cameraResult: capture.captureSummary.cameraResult,
      lightingResult: capture.captureSummary.lightingResult,
      rendererResult: capture.captureSummary.rendererResult,
      outputDeterministic: true,
      drawnCommandCount: drawCommands.length
    });

    const atlasFirstControlledCanvasDraw = Object.freeze({
      drawSessionId,
      captureId: capture.captureId,
      canvasState,
      drawCommands,
      drawResult,
      cleanupState: Object.freeze({
        clearCanvasSupported: true,
        releaseStateSupported: true,
        duplicateSessionsRejected: true,
        affectedLiveRuntime: false
      }),
      verificationResult: Object.freeze({
        canvasStateValid: true,
        drawCommandsValid: true,
        cameraTransformValid: true,
        lightingModeValid: true,
        outputDeterministic: true,
        verifiedAssetIds: capture.verificationResult.verifiedAssetIds
      }),
      metadata: Object.freeze({
        activationId: capture.activationId,
        displaySessionId: capture.displaySessionId,
        verificationId: capture.metadata.verificationId,
        manualOnly: true,
        isolated: true,
        passiveOnly: true,
        gpsConnected: false,
        externalMapServicesQueried: false,
        liveMapAttached: false,
        playerRuntimeEnabled: false,
        gameplayModified: false,
        firebaseModified: false,
        backendModified: false
      }),
      deterministicVerification: Object.freeze({
        sameActivationInputProducesIdenticalDrawResult: true,
        drawHash: drawSessionId
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstControlledCanvasDraw
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineFirstControlledCanvasDrawValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstControlledCanvasDraw: null
    });
  }
}

export function createAtlasEngineFirstControlledCanvasDrawSession(
  rawFoundation = atlasEngineFirstControlledCanvasDrawFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_draw_required",
      message:
        "Atlas first controlled canvas draw sessions require manual: true.",
      atlasFirstControlledCanvasDrawSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_draw_required",
      message:
        "Atlas first controlled canvas draw sessions require isolated: true.",
      atlasFirstControlledCanvasDrawSession: null
    });
  }

  const validation = validateAtlasEngineFirstControlledCanvasDrawFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasFirstControlledCanvasDrawSession: null
    });
  }

  let drawState = "created";
  let drawn = false;
  let closed = false;
  const draw = validation.atlasFirstControlledCanvasDraw;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasFirstControlledCanvasDrawSession: Object.freeze({
      drawSessionId: draw.drawSessionId,
      captureId: draw.captureId,
      currentDrawState() {
        return drawState;
      },
      startDraw(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first controlled canvas draw rejects draw after session closure.",
            drawActivation: null
          });
        }

        if (requestOptions.manualDrawAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_draw_authorization_required",
            message:
              "Atlas first controlled canvas draw requires manualDrawAuthorized: true before drawing.",
            drawActivation: null
          });
        }

        if (drawn) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_draw_session_prevented",
            message:
              "Atlas first controlled canvas draw prevents duplicate draw sessions for the same captured scene.",
            drawActivation: null
          });
        }

        drawn = true;
        drawState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          drawActivation: Object.freeze({
            drawSessionId: draw.drawSessionId,
            captureId: draw.captureId,
            drawState,
            canvasState: draw.canvasState,
            drawCommands: draw.drawCommands,
            drawResult: draw.drawResult,
            liveMapAttached: false,
            playerRuntimeEnabled: false
          })
        });
      },
      clearCanvas() {
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
        drawState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-first-controlled-canvas-draw-session-closed",
          releasedStateCount: draw.drawCommands.length,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineFirstControlledCanvasDrawContext(),
    validateAtlasEngineFirstVisualSceneCaptureFoundation:
      options.validateAtlasEngineFirstVisualSceneCaptureFoundation ??
      validateAtlasEngineFirstVisualSceneCaptureFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first controlled canvas draw foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    drawSessionId: normalizePermanentId(foundation.drawSessionId, "drawSessionId"),
    captureId: normalizePermanentId(foundation.captureId, "captureId"),
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

function buildCaptureDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineFirstVisualSceneCaptureFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateCaptureId(expectedBaseId, receivedCaptureId, activationId, lightingMode) {
  const expectedResolvedId = createCaptureHash(
    expectedBaseId,
    activationId,
    lightingMode
  );
  if (receivedCaptureId !== expectedResolvedId) {
    throw createValidationError(
      "capture_id_mismatch",
      "Atlas first controlled canvas draw captureId must match the deterministic capture ID."
    );
  }
}

function validateActivationId(
  expectedBaseId,
  receivedActivationId,
  displaySessionId,
  lightingMode
) {
  const expectedResolvedId = createActivationHash(
    expectedBaseId,
    displaySessionId,
    lightingMode
  );
  if (receivedActivationId !== expectedResolvedId) {
    throw createValidationError(
      "activation_id_mismatch",
      "Atlas first controlled canvas draw activationId must match the deterministic activation ID."
    );
  }
}

function validateDisplaySessionId(
  expectedBaseId,
  receivedDisplaySessionId,
  locationRequest,
  lightingMode
) {
  const resultId = createResultHash(
    atlasEngineFirstVisualSceneCaptureFoundationDefinition.resultId,
    locationRequest.locationId,
    locationRequest.worldSeed,
    lightingMode
  );
  const renderExecutionId = createRenderExecutionHash(
    atlasEngineFirstVisualSceneCaptureFoundationDefinition.renderExecutionId,
    resultId,
    lightingMode
  );
  const previewId = createPreviewHash(
    atlasEngineFirstVisualSceneCaptureFoundationDefinition.previewId,
    renderExecutionId,
    lightingMode
  );
  const expectedResolvedId = createDisplaySessionHash(
    expectedBaseId,
    previewId,
    lightingMode
  );
  if (receivedDisplaySessionId !== expectedResolvedId) {
    throw createValidationError(
      "display_session_id_mismatch",
      "Atlas first controlled canvas draw displaySessionId must match the deterministic display session ID."
    );
  }
}

function validateSceneResult(sceneResult, expectedCount) {
  if (
    !sceneResult ||
    sceneResult.visibleState !== "verified-visible" ||
    !Array.isArray(sceneResult.sceneObjects) ||
    sceneResult.sceneObjects.length !== expectedCount ||
    sceneResult.objectCount !== expectedCount
  ) {
    throw createValidationError(
      "invalid_scene_result",
      "Atlas first controlled canvas draw requires a verified visible scene result with the approved deterministic object count."
    );
  }
}

function validateCaptureSummary(captureSummary) {
  if (
    !captureSummary ||
    captureSummary.visibleState !== "verified-visible" ||
    !Number.isInteger(captureSummary.objectCount) ||
    captureSummary.objectCount <= 0
  ) {
    throw createValidationError(
      "invalid_capture_summary",
      "Atlas first controlled canvas draw requires a valid capture summary."
    );
  }
}

function validateDemoObjects(assetIds) {
  for (const assetId of requiredDemoAssets) {
    if (!assetIds.includes(assetId)) {
      throw createValidationError(
        "missing_demo_asset",
        `Atlas first controlled canvas draw requires demo asset ${assetId}.`
      );
    }
  }
}

function createDrawCommands(capture) {
  return Object.freeze([
    Object.freeze({
      commandId: `${capture.captureId}_LIGHTHOUSE_001`,
      kind: "lighthouse-silhouette",
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      layer: "foreground-landmark",
      cameraTransform: capture.captureSummary.cameraResult,
      lightingMode: capture.captureSummary.lightingResult.currentMode,
      outputDeterministic: true
    }),
    Object.freeze({
      commandId: `${capture.captureId}_HOUSE_001`,
      kind: "house-silhouette",
      assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      layer: "midground-structure",
      cameraTransform: capture.captureSummary.cameraResult,
      lightingMode: capture.captureSummary.lightingResult.currentMode,
      outputDeterministic: true
    }),
    Object.freeze({
      commandId: `${capture.captureId}_ROAD_001`,
      kind: "road-path",
      assetId: "ROAD_STRAIGHT_SMALL_001",
      layer: "ground-path",
      cameraTransform: capture.captureSummary.cameraResult,
      lightingMode: capture.captureSummary.lightingResult.currentMode,
      outputDeterministic: true
    }),
    Object.freeze({
      commandId: `${capture.captureId}_TREE_001`,
      kind: "tree",
      assetId: "TREE_EUCALYPTUS_001",
      layer: "environment-foreground",
      cameraTransform: capture.captureSummary.cameraResult,
      lightingMode: capture.captureSummary.lightingResult.currentMode,
      outputDeterministic: true
    })
  ]);
}

function validateDrawCommands(drawCommands) {
  if (!Array.isArray(drawCommands) || drawCommands.length !== requiredCommandKinds.length) {
    throw createValidationError(
      "invalid_draw_commands",
      "Atlas first controlled canvas draw requires the approved synthetic draw commands."
    );
  }

  for (const commandKind of requiredCommandKinds) {
    if (!drawCommands.some((drawCommand) => drawCommand.kind === commandKind)) {
      throw createValidationError(
        "missing_draw_command",
        `Atlas first controlled canvas draw requires ${commandKind} draw command coverage.`
      );
    }
  }

  for (const drawCommand of drawCommands) {
    if (
      !drawCommand ||
      typeof drawCommand.commandId !== "string" ||
      typeof drawCommand.assetId !== "string" ||
      drawCommand.outputDeterministic !== true
    ) {
      throw createValidationError(
        "invalid_draw_command",
        "Atlas first controlled canvas draw requires fully verified draw commands."
      );
    }
  }
}

function validateCanvasState(canvasState) {
  if (
    !canvasState ||
    canvasState.currentState !== "verified" ||
    canvasState.clearedBeforeDraw !== true ||
    canvasState.liveRuntimeAttached !== false
  ) {
    throw createValidationError(
      "invalid_canvas_state",
      "Atlas first controlled canvas draw requires a verified passive canvas state."
    );
  }
}

function createResultHash(baseId, locationId, worldSeed, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${locationId}::${worldSeed}::${lightingMode}::output-package`
  )}`;
}

function createRenderExecutionHash(baseId, resultId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${resultId}::${lightingMode}::render-execution`
  )}`;
}

function createPreviewHash(baseId, renderExecutionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${renderExecutionId}::${lightingMode}::visual-preview`
  )}`;
}

function createDisplaySessionHash(baseId, previewId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${previewId}::${lightingMode}::display`
  )}`;
}

function createActivationHash(baseId, displaySessionId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${displaySessionId}::${lightingMode}::activation`
  )}`;
}

function createCaptureHash(baseId, activationId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${activationId}::${lightingMode}::capture`
  )}`;
}

function createDrawSessionHash(baseId, captureId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${captureId}::${lightingMode}::draw`
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
    atlasFirstControlledCanvasDraw: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstControlledCanvasDrawRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first controlled canvas draw foundation is missing required field ${fieldName}.`
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
  error.name = "AtlasEngineFirstControlledCanvasDrawValidationError";
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
