function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}

const STATUS_SCHEMA_ID = "GROWGO_CUSTOM_25D_ONE_FRAME_DRAW_STATUS_001";
const RESULT_SCHEMA_ID = "GROWGO_CUSTOM_25D_ONE_FRAME_DRAW_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID = "GROWGO_CUSTOM_25D_ONE_FRAME_DRAW_SOURCE_LOCK_001";
const SURFACE_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_SURFACE_PREPARATION_RESULT_001";
const EXACT_PANE_NAME = "custom25DMapPane";
const EXACT_CANVAS_CLASS_NAME = "custom-25d-map-canvas";

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }

  return fallback;
}

function isObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isPreparedSurfaceDescriptor(surface) {
  return isObjectLike(surface) && surface.schemaId === SURFACE_SCHEMA_ID;
}

function canvasClassMatches(canvas, expectedCanvasClassName) {
  return (
    isObjectLike(canvas) &&
    typeof canvas.className === "string" &&
    canvas.className === expectedCanvasClassName
  );
}

function initialStatus(expectedCanvasClassName) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    drawState: "idle",
    drawAttemptCount: 0,
    completedFrameCount: 0,
    drawCompleted: false,
    drawFailed: false,
    permanentlyClosed: false,
    secondDrawBlocked: false,
    surfaceValidated: false,
    canvasIdentityValidated: false,
    canvasClassName: expectedCanvasClassName,
    cleanupRequired: false,
    lifecycleCleanupRequired: false,
    listenerAdded: false,
    retentionWritten: false,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    mapReferenceRetained: false,
    canvasReferenceRetained: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function createResult({
  drawState,
  operation,
  outcome,
  reasonCode,
  surfaceValidated,
  canvasIdentityValidated,
  canvasClassName,
  drawAttemptCount,
  completedFrameCount,
  drawCompleted,
  drawFailed,
  cleanupRequired,
  lifecycleCleanupRequired,
  permanentlyClosed,
  secondDrawBlocked,
  listenerAdded,
  retentionWritten,
  realRendererInvoked,
  realDrawFunctionCalled,
  realCanvasCreated,
  realPaneCreated,
  realWebglContextCreated,
  realOverlayCreated,
  mapReferenceRetained,
  canvasReferenceRetained,
  networkRequested,
  assetDownloadRequested,
  automaticInvocation
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    drawState,
    operation,
    outcome,
    reasonCode,
    surfaceValidated,
    canvasIdentityValidated,
    canvasClassName,
    drawAttemptCount,
    completedFrameCount,
    drawCompleted,
    drawFailed,
    cleanupRequired,
    lifecycleCleanupRequired,
    permanentlyClosed,
    secondDrawBlocked,
    listenerAdded,
    retentionWritten,
    realRendererInvoked,
    realDrawFunctionCalled,
    realCanvasCreated,
    realPaneCreated,
    realWebglContextCreated,
    realOverlayCreated,
    mapReferenceRetained,
    canvasReferenceRetained,
    networkRequested,
    assetDownloadRequested,
    automaticInvocation,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function cleanupRequiredFromSurface(surface) {
  return !!(
    isObjectLike(surface) &&
    (surface.cleanupRequired === true ||
      surface.lifecycleRegistrationRequired === true ||
      surface.canvasCreated === true)
  );
}

function validateSurface(surface, expectedCanvasClassName) {
  if (!isPreparedSurfaceDescriptor(surface)) {
    return { ok: false, reasonCode: "INVALID_SURFACE_DESCRIPTOR", cleanupRequired: false };
  }

  if (surface.preparationStatus !== "prepared" || surface.reasonCode !== "SURFACE_PREPARED") {
    return { ok: false, reasonCode: "UNSUCCESSFUL_SURFACE_PREPARATION", cleanupRequired: false };
  }

  if (surface.paneName !== EXACT_PANE_NAME || surface.paneIdentityValidated !== true) {
    return { ok: false, reasonCode: "INVALID_PANE_IDENTITY", cleanupRequired: cleanupRequiredFromSurface(surface) };
  }

  if (surface.canvasCreated !== true) {
    return { ok: false, reasonCode: "CANVAS_NOT_CREATED", cleanupRequired: cleanupRequiredFromSurface(surface) };
  }

  if (surface.canvasAppended !== true) {
    return { ok: false, reasonCode: "CANVAS_NOT_APPENDED", cleanupRequired: cleanupRequiredFromSurface(surface) };
  }

  if (surface.cleanupRequired !== true) {
    return { ok: false, reasonCode: "CLEANUP_REQUIRED_FALSE", cleanupRequired: false };
  }

  if (surface.drawRequested === true) {
    return { ok: false, reasonCode: "DRAW_ALREADY_REQUESTED", cleanupRequired: true };
  }

  if (surface.listenerAdded === true) {
    return { ok: false, reasonCode: "LISTENER_ALREADY_ADDED", cleanupRequired: true };
  }

  if (surface.retentionWritten === true) {
    return { ok: false, reasonCode: "RETENTION_ALREADY_WRITTEN", cleanupRequired: true };
  }

  if (surface.canvasClassName !== expectedCanvasClassName) {
    return { ok: false, reasonCode: "INCORRECT_CANVAS_CLASS_NAME", cleanupRequired: true };
  }

  if (!isObjectLike(surface.ownedSurface) || !isObjectLike(surface.ownedSurface.canvas)) {
    return { ok: false, reasonCode: "MISSING_SURFACE_CANVAS", cleanupRequired: true };
  }

  return { ok: true, reasonCode: "SURFACE_VALIDATED", cleanupRequired: true };
}

export function inspectGrowGoCustom25DOneFrameDrawSourceLock({ scriptSource } = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_DRAW_GLOBAL_MAP_DEPENDENCY"
    });
  }

  const checks = deepFreeze({
    drawEntryFound: scriptSource.includes("function drawCustom25DMapCanvas(canvas)"),
    globalMapGuardFound: scriptSource.includes("if (!ENABLE_CUSTOM_25D_MAP || !map || !canvas) return;"),
    mapSizeFound: scriptSource.includes("const size = map.getSize();"),
    boundsFound: scriptSource.includes("const bounds = map.getBounds();"),
    topLeftFound: scriptSource.includes(
      "const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());"
    ),
    panePositionFound: scriptSource.includes("L.DomUtil.setPosition(canvas, topLeft);"),
    devicePixelRatioFound: scriptSource.includes("const scale = window.devicePixelRatio || 1;"),
    context2dFound: scriptSource.includes('const ctx = canvas.getContext("2d");'),
    clearRectFound: scriptSource.includes("ctx.clearRect(0, 0, size.x, size.y);"),
    helperFanoutFound:
      scriptSource.includes("drawCustom25DBackground(ctx, size, bounds);") &&
      scriptSource.includes("drawCustom25DZones(ctx, bounds, topLeft);") &&
      scriptSource.includes("drawCustom25DBuildings(ctx, bounds, topLeft);")
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "DRAW_SOURCE_LOCK_CONFIRMED" : "DRAW_SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "ONE_FRAME_DRAW_HELPER_READY"
      : "BLOCKED_BY_DRAW_GLOBAL_MAP_DEPENDENCY",
    checks,
    discoveredDrawDependencies: ok
      ? deepFreeze({
          drawEntry: "drawCustom25DMapCanvas",
          globalMapDependency: true,
          canvasContextDependency: "2d",
          sizeDependency: "map.getSize()",
          boundsDependency: "map.getBounds()",
          topLeftDependency: "map.latLngToLayerPoint(bounds.getNorthWest())",
          domPositionDependency: "L.DomUtil.setPosition(canvas, topLeft)",
          styleDependency: "window.devicePixelRatio",
          helperFanoutDependency: true
        })
      : null
  });
}

export function createDeveloperOnlyCustom25DOneFrameDraw({
  expectedCanvasClassName = EXACT_CANVAS_CLASS_NAME,
  drawOperation
} = {}) {
  let status = freezeStatus(initialStatus(expectedCanvasClassName));

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getDrawStatus() {
    return status;
  }

  function buildResult(reasonCode, outcome, patch = {}) {
    const nextStatus = updateStatus({
      ...patch,
      canvasClassName: patch.canvasClassName ?? expectedCanvasClassName
    });

    return createResult({
      drawState: nextStatus.drawState,
      operation: "draw_one_frame",
      outcome,
      reasonCode,
      surfaceValidated: nextStatus.surfaceValidated,
      canvasIdentityValidated: nextStatus.canvasIdentityValidated,
      canvasClassName: nextStatus.canvasClassName,
      drawAttemptCount: nextStatus.drawAttemptCount,
      completedFrameCount: nextStatus.completedFrameCount,
      drawCompleted: nextStatus.drawCompleted,
      drawFailed: nextStatus.drawFailed,
      cleanupRequired: nextStatus.cleanupRequired,
      lifecycleCleanupRequired: nextStatus.lifecycleCleanupRequired,
      permanentlyClosed: nextStatus.permanentlyClosed,
      secondDrawBlocked: nextStatus.secondDrawBlocked,
      listenerAdded: nextStatus.listenerAdded,
      retentionWritten: nextStatus.retentionWritten,
      realRendererInvoked: nextStatus.realRendererInvoked,
      realDrawFunctionCalled: nextStatus.realDrawFunctionCalled,
      realCanvasCreated: nextStatus.realCanvasCreated,
      realPaneCreated: nextStatus.realPaneCreated,
      realWebglContextCreated: nextStatus.realWebglContextCreated,
      realOverlayCreated: nextStatus.realOverlayCreated,
      mapReferenceRetained: nextStatus.mapReferenceRetained,
      canvasReferenceRetained: nextStatus.canvasReferenceRetained,
      networkRequested: nextStatus.networkRequested,
      assetDownloadRequested: nextStatus.assetDownloadRequested,
      automaticInvocation: nextStatus.automaticInvocation
    });
  }

  function drawPreparedSurface({ surface, canvas } = {}) {
    if (status.permanentlyClosed) {
      return buildResult("DRAW_HELPER_CLOSED", "blocked", {
        drawState: "blocked",
        secondDrawBlocked: true
      });
    }

    const surfaceValidation = validateSurface(surface, expectedCanvasClassName);
    if (!surfaceValidation.ok) {
      return buildResult(surfaceValidation.reasonCode, "failed_closed", {
        drawState: "failed_closed",
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: surfaceValidation.cleanupRequired,
        lifecycleCleanupRequired: surfaceValidation.cleanupRequired,
        surfaceValidated: false,
        canvasIdentityValidated: false
      });
    }

    if (!isObjectLike(canvas)) {
      return buildResult("MISSING_CANVAS", "failed_closed", {
        drawState: "failed_closed",
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: false
      });
    }

    if (canvas !== surface.ownedSurface.canvas) {
      return buildResult("CANVAS_IDENTITY_MISMATCH", "failed_closed", {
        drawState: "failed_closed",
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: false
      });
    }

    if (!canvasClassMatches(canvas, expectedCanvasClassName)) {
      return buildResult("INCORRECT_CANVAS_CLASS_NAME", "failed_closed", {
        drawState: "failed_closed",
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: false
      });
    }

    if (typeof drawOperation !== "function") {
      return buildResult("DRAW_OPERATION_MISSING", "failed_closed", {
        drawState: "failed_closed",
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: true
      });
    }

    const drawAttemptCount = status.drawAttemptCount + 1;

    try {
      const drawResult = drawOperation({
        canvas,
        surface
      });

      if (drawResult && drawResult.ok === false) {
        return buildResult(drawResult.reasonCode ?? "DRAW_FAILED", "failed_closed", {
          drawState: "failed_closed",
          drawAttemptCount,
          completedFrameCount: 0,
          drawCompleted: false,
          drawFailed: true,
          permanentlyClosed: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          surfaceValidated: true,
          canvasIdentityValidated: true
        });
      }

      return buildResult("FRAME_DRAWN", "drawn", {
        drawState: "drawn",
        drawAttemptCount,
        completedFrameCount: 1,
        drawCompleted: true,
        drawFailed: false,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: true
      });
    } catch (error) {
      return buildResult(toReasonCode(error, "DRAW_EXCEPTION"), "failed_closed", {
        drawState: "failed_closed",
        drawAttemptCount,
        completedFrameCount: 0,
        drawCompleted: false,
        drawFailed: true,
        permanentlyClosed: true,
        cleanupRequired: true,
        lifecycleCleanupRequired: true,
        surfaceValidated: true,
        canvasIdentityValidated: true
      });
    }
  }

  return deepFreeze({
    getDrawStatus,
    drawPreparedSurface
  });
}
