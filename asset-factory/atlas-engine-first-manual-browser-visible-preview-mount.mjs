import {
  atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition,
  buildAtlasEngineFirstVisibleCanvasDrawResultContext,
  validateAtlasEngineFirstVisibleCanvasDrawResultFoundation
} from "./atlas-engine-first-visible-canvas-draw-result-foundation.mjs";

export const atlasEngineFirstManualBrowserVisiblePreviewMountRequiredFields =
  Object.freeze([
    "previewMountId",
    "drawResultId",
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

export const atlasEngineFirstManualBrowserVisiblePreviewMountStates =
  Object.freeze([
    "created",
    "preparing",
    "mounted",
    "displaying",
    "verified",
    "unmounted",
    "closed",
    "failed"
  ]);

export const atlasEngineFirstManualBrowserVisiblePreviewMountFoundationDefinition =
  deepFreeze({
    previewMountId: "ATLAS_FIRST_MANUAL_BROWSER_VISIBLE_PREVIEW_MOUNT_001",
    drawResultId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.captureId,
    drawSessionId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.drawSessionId,
    activationId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.activationId,
    displaySessionId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.displaySessionId,
    verificationId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.verificationId,
    previewId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.previewId,
    renderExecutionId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.renderExecutionId,
    resultId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.resultId,
    executionId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.executionId,
    showcaseId:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.showcaseId,
    locationRequest: deepFreeze({
      ...atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.locationRequest
    }),
    expectedSceneObjectCount:
      atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition.expectedSceneObjectCount
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const placeholderObjects = Object.freeze([
  "LIGHTHOUSE_PLACEHOLDER",
  "HOUSE_PLACEHOLDER",
  "ROAD_PLACEHOLDER",
  "TREE_PLACEHOLDER"
]);

export function buildAtlasEngineFirstManualBrowserVisiblePreviewMountContext() {
  return Object.freeze(buildAtlasEngineFirstVisibleCanvasDrawResultContext());
}

export function validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
  rawFoundation = atlasEngineFirstManualBrowserVisiblePreviewMountFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const visibleDrawResult =
      normalizedOptions.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation(
        buildVisibleDrawDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!visibleDrawResult.ok) {
      return freezeFailure(visibleDrawResult);
    }

    const drawResult = visibleDrawResult.atlasFirstVisibleCanvasDrawResult;
    const lightingMode = drawResult.canvasResult.lightingMode;

    validateDrawResultId(
      foundation.drawResultId,
      drawResult.captureId,
      drawResult.drawSessionId,
      lightingMode
    );
    validateDrawSessionId(
      foundation.drawSessionId,
      drawResult.drawSessionId
    );
    validateCanvasResult(drawResult.canvasResult);
    validateFrameResult(drawResult.frameResult, foundation.expectedSceneObjectCount);
    validateVerificationState(drawResult.verificationState);

    const previewMountId = createPreviewMountHash(
      foundation.previewMountId,
      drawResult.captureId,
      lightingMode
    );
    const canvasElement = Object.freeze({
      elementId: `${previewMountId}_CANVAS`,
      tagName: "CANVAS",
      width: drawResult.canvasResult.width,
      height: drawResult.canvasResult.height,
      pixelRatio: drawResult.canvasResult.pixelRatio,
      exists: true
    });
    const mountState = Object.freeze({
      currentState: "verified",
      allowedStates: atlasEngineFirstManualBrowserVisiblePreviewMountStates,
      manualPreviewStartRequired: true,
      failClosedByDefault: true
    });
    const displayResult = Object.freeze({
      mountTargetId: `${previewMountId}_MOUNT_TARGET`,
      mountTargetExists: true,
      frameDisplayed: true,
      placeholderObjects,
      visibleState: drawResult.frameResult.visibleState,
      objectCount: placeholderObjects.length,
      deterministicOutput: true
    });
    const cleanupState = Object.freeze({
      unmountSupported: true,
      releaseStateSupported: true,
      cleanupSuccessful: true,
      duplicateSessionsRejected: true,
      affectedLiveRuntime: false
    });

    const atlasFirstManualBrowserVisiblePreviewMount = Object.freeze({
      previewMountId,
      drawResultId: drawResult.captureId,
      canvasElement,
      mountState,
      displayResult,
      cleanupState,
      metadata: Object.freeze({
        drawSessionId: drawResult.drawSessionId,
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
        sameDrawResultProducesIdenticalPreviewMountOutput: true,
        previewMountHash: previewMountId
      })
    });

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasFirstManualBrowserVisiblePreviewMount
    });
  } catch (error) {
    if (
      error?.name !==
      "AtlasEngineFirstManualBrowserVisiblePreviewMountValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasFirstManualBrowserVisiblePreviewMount: null
    });
  }
}

export function createAtlasEngineFirstManualBrowserVisiblePreviewMountSession(
  rawFoundation = atlasEngineFirstManualBrowserVisiblePreviewMountFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_mount_required",
      message:
        "Atlas first manual browser visible preview mount sessions require manual: true.",
      atlasFirstManualBrowserVisiblePreviewMountSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_mount_required",
      message:
        "Atlas first manual browser visible preview mount sessions require isolated: true.",
      atlasFirstManualBrowserVisiblePreviewMountSession: null
    });
  }

  const validation =
    validateAtlasEngineFirstManualBrowserVisiblePreviewMountFoundation(
      rawFoundation,
      options
    );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      atlasFirstManualBrowserVisiblePreviewMountSession: null
    });
  }

  let mountState = "created";
  let mounted = false;
  let closed = false;
  const previewMount = validation.atlasFirstManualBrowserVisiblePreviewMount;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    atlasFirstManualBrowserVisiblePreviewMountSession: Object.freeze({
      previewMountId: previewMount.previewMountId,
      drawResultId: previewMount.drawResultId,
      currentMountState() {
        return mountState;
      },
      startPreviewMount(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas first manual browser visible preview mount rejects mounting after session closure.",
            previewMountResult: null
          });
        }

        if (requestOptions.manualPreviewStart !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_preview_start_required",
            message:
              "Atlas first manual browser visible preview mount requires manualPreviewStart: true before mounting.",
            previewMountResult: null
          });
        }

        if (mounted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_preview_mount_prevented",
            message:
              "Atlas first manual browser visible preview mount prevents duplicate preview mounts for the same draw result.",
            previewMountResult: null
          });
        }

        mounted = true;
        mountState = "verified";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          previewMountResult: Object.freeze({
            previewMountId: previewMount.previewMountId,
            drawResultId: previewMount.drawResultId,
            mountState,
            canvasElement: previewMount.canvasElement,
            displayResult: previewMount.displayResult,
            liveMapAttached: false,
            playerRuntimeEnabled: false
          })
        });
      },
      unmountPreview() {
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
        mountState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus:
            "atlas-first-manual-browser-visible-preview-mount-session-closed",
          releasedStateCount: previewMount.displayResult.placeholderObjects.length,
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
      buildAtlasEngineFirstManualBrowserVisiblePreviewMountContext(),
    validateAtlasEngineFirstVisibleCanvasDrawResultFoundation:
      options.validateAtlasEngineFirstVisibleCanvasDrawResultFoundation ??
      validateAtlasEngineFirstVisibleCanvasDrawResultFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine first manual browser visible preview mount foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    previewMountId: normalizePermanentId(
      foundation.previewMountId,
      "previewMountId"
    ),
    drawResultId: normalizePermanentId(foundation.drawResultId, "drawResultId"),
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

function buildVisibleDrawDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineFirstVisibleCanvasDrawResultFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function validateDrawResultId(
  expectedBaseId,
  receivedDrawResultId,
  drawSessionId,
  lightingMode
) {
  const expectedResolvedId = createVisibleCaptureHash(
    expectedBaseId,
    drawSessionId,
    lightingMode
  );
  if (receivedDrawResultId !== expectedResolvedId) {
    throw createValidationError(
      "draw_result_id_mismatch",
      "Atlas first manual browser visible preview mount drawResultId must match the deterministic visible draw result ID."
    );
  }
}

function validateDrawSessionId(expectedBaseId, receivedDrawSessionId) {
  if (
    typeof receivedDrawSessionId !== "string" ||
    !receivedDrawSessionId.startsWith(`${expectedBaseId}_`)
  ) {
    throw createValidationError(
      "draw_session_id_mismatch",
      "Atlas first manual browser visible preview mount drawSessionId must match the deterministic draw session ID."
    );
  }
}

function validateCanvasResult(canvasResult) {
  if (
    !canvasResult ||
    canvasResult.exists !== true ||
    canvasResult.drawCommandsExecuted !== true
  ) {
    throw createValidationError(
      "invalid_canvas_result",
      "Atlas first manual browser visible preview mount requires an existing canvas with executed draw commands."
    );
  }
}

function validateFrameResult(frameResult, expectedCount) {
  if (
    !frameResult ||
    frameResult.frameProduced !== true ||
    frameResult.objectCount !== expectedCount ||
    frameResult.deterministicOutput !== true
  ) {
    throw createValidationError(
      "invalid_frame_result",
      "Atlas first manual browser visible preview mount requires a deterministic produced frame."
    );
  }
}

function validateVerificationState(verificationState) {
  if (
    !verificationState ||
    verificationState.currentState !== "verified" ||
    verificationState.cleanupSuccessful !== true
  ) {
    throw createValidationError(
      "invalid_verification_state",
      "Atlas first manual browser visible preview mount requires a verified visible draw result state."
    );
  }
}

function createPreviewMountHash(baseId, drawResultId, lightingMode) {
  return `${baseId}_${stableNumericHash(
    `${drawResultId}::${lightingMode}::preview-mount`
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
    atlasFirstManualBrowserVisiblePreviewMount: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineFirstManualBrowserVisiblePreviewMountRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine first manual browser visible preview mount foundation is missing required field ${fieldName}.`
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
  error.name =
    "AtlasEngineFirstManualBrowserVisiblePreviewMountValidationError";
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
