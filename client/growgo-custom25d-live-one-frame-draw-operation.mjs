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

const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_DRAW_OPERATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_DRAW_OPERATION_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_DRAW_OPERATION_SOURCE_LOCK_001";
const SURFACE_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001";
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

function createInitialStatus(expectedCanvasClassName) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    operationId: null,
    drawState: "idle",
    surfaceValidated: false,
    surfaceSchemaValidated: false,
    canvasIdentityValidated: false,
    canvasClassValidated: false,
    drawFunctionAvailable: false,
    drawAttemptCount: 0,
    completedFrameCount: 0,
    drawCompleted: false,
    drawFailed: false,
    permanentlyClosed: false,
    secondDrawBlocked: false,
    cleanupRequired: false,
    lifecycleCleanupRequired: false,
    canvasResizeObserved: false,
    canvasPositionMutationObserved: false,
    globalMapDependencyDeclared: true,
    devicePixelRatioDependencyDeclared: true,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    listenerAdded: false,
    retentionWritten: false,
    mapReferenceRetained: false,
    canvasReferenceRetained: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canvasClassName: expectedCanvasClassName,
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
  operationId,
  operation,
  outcome,
  reasonCode,
  status
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operationId,
    operation,
    outcome,
    reasonCode,
    drawState: status.drawState,
    surfaceValidated: status.surfaceValidated,
    surfaceSchemaValidated: status.surfaceSchemaValidated,
    canvasIdentityValidated: status.canvasIdentityValidated,
    canvasClassValidated: status.canvasClassValidated,
    drawFunctionAvailable: status.drawFunctionAvailable,
    drawAttemptCount: status.drawAttemptCount,
    completedFrameCount: status.completedFrameCount,
    drawCompleted: status.drawCompleted,
    drawFailed: status.drawFailed,
    permanentlyClosed: status.permanentlyClosed,
    secondDrawBlocked: status.secondDrawBlocked,
    cleanupRequired: status.cleanupRequired,
    lifecycleCleanupRequired: status.lifecycleCleanupRequired,
    canvasResizeObserved: status.canvasResizeObserved,
    canvasPositionMutationObserved: status.canvasPositionMutationObserved,
    globalMapDependencyDeclared: status.globalMapDependencyDeclared,
    devicePixelRatioDependencyDeclared:
      status.devicePixelRatioDependencyDeclared,
    realRendererInvoked: status.realRendererInvoked,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realWebglContextCreated: status.realWebglContextCreated,
    realOverlayCreated: status.realOverlayCreated,
    listenerAdded: status.listenerAdded,
    retentionWritten: status.retentionWritten,
    mapReferenceRetained: status.mapReferenceRetained,
    canvasReferenceRetained: status.canvasReferenceRetained,
    networkRequested: status.networkRequested,
    assetDownloadRequested: status.assetDownloadRequested,
    automaticInvocation: status.automaticInvocation,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

function validateSurfaceSchema(surface) {
  return isObjectLike(surface) && surface.schemaId === SURFACE_SCHEMA_ID;
}

function validateSurfaceContract(surface, expectedCanvasClassName) {
  if (!validateSurfaceSchema(surface)) {
    return {
      ok: false,
      reasonCode: "INVALID_SURFACE_SCHEMA",
      surfaceSchemaValidated: false
    };
  }

  if (surface.paneName !== EXACT_PANE_NAME) {
    return {
      ok: false,
      reasonCode: "INCORRECT_PANE_NAME",
      surfaceSchemaValidated: true
    };
  }

  if (surface.canvasClassName !== expectedCanvasClassName) {
    return {
      ok: false,
      reasonCode: "INCORRECT_CANVAS_CLASS_NAME",
      surfaceSchemaValidated: true
    };
  }

  if (surface.canvasOwnedByOperation !== true) {
    return {
      ok: false,
      reasonCode: "CANVAS_NOT_CREATED",
      surfaceSchemaValidated: true
    };
  }

  if (surface.canvasAppended !== true) {
    return {
      ok: false,
      reasonCode: "CANVAS_NOT_APPENDED",
      surfaceSchemaValidated: true
    };
  }

  if (surface.cleanupRequired !== true) {
    return {
      ok: false,
      reasonCode: "CLEANUP_REQUIRED_FALSE",
      surfaceSchemaValidated: true
    };
  }

  if (surface.rollbackAvailable !== true) {
    return {
      ok: false,
      reasonCode: "ROLLBACK_AVAILABLE_FALSE",
      surfaceSchemaValidated: true
    };
  }

  if (surface.listenerAdded === true) {
    return {
      ok: false,
      reasonCode: "LISTENER_ALREADY_ADDED",
      surfaceSchemaValidated: true
    };
  }

  if (surface.retentionWritten === true) {
    return {
      ok: false,
      reasonCode: "RETENTION_ALREADY_WRITTEN",
      surfaceSchemaValidated: true
    };
  }

  if (surface.drawRequested === true) {
    return {
      ok: false,
      reasonCode: "DRAW_ALREADY_REQUESTED",
      surfaceSchemaValidated: true
    };
  }

  if (!surface.canvas) {
    return {
      ok: false,
      reasonCode: "MISSING_SURFACE_CANVAS",
      surfaceSchemaValidated: true
    };
  }

  return {
    ok: true,
    reasonCode: "SURFACE_VALIDATED",
    surfaceSchemaValidated: true
  };
}

function canvasClassMatches(canvas, expectedCanvasClassName) {
  return (
    isObjectLike(canvas) &&
    typeof canvas.className === "string" &&
    canvas.className === expectedCanvasClassName
  );
}

function captureCanvasShape(canvas) {
  return {
    width: canvas?.width ?? null,
    height: canvas?.height ?? null,
    styleWidth: canvas?.style?.width ?? null,
    styleHeight: canvas?.style?.height ?? null,
    positionX:
      canvas?.position?.x ??
      canvas?.intendedPosition?.x ??
      canvas?._leaflet_pos?.x ??
      null,
    positionY:
      canvas?.position?.y ??
      canvas?.intendedPosition?.y ??
      canvas?._leaflet_pos?.y ??
      null
  };
}

function observedCanvasResize(before, after) {
  return (
    before.width !== after.width ||
    before.height !== after.height ||
    before.styleWidth !== after.styleWidth ||
    before.styleHeight !== after.styleHeight
  );
}

function observedCanvasPositionMutation(before, after) {
  return before.positionX !== after.positionX || before.positionY !== after.positionY;
}

export function inspectGrowGoCustom25DLiveOneFrameDrawOperationSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY"
    });
  }

  const checks = deepFreeze({
    drawEntryFound: scriptSource.includes("function drawCustom25DMapCanvas(canvas)"),
    initializerFound: scriptSource.includes("function initCustom25DMapExperiment()"),
    retentionFound: scriptSource.includes("let custom25DMapLayer = null;"),
    mapSizeFound: scriptSource.includes("const size = map.getSize();"),
    boundsFound: scriptSource.includes("const bounds = map.getBounds();"),
    topLeftFound: scriptSource.includes(
      "const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());"
    ),
    panePositionFound: scriptSource.includes("L.DomUtil.setPosition(canvas, topLeft);"),
    devicePixelRatioFound: scriptSource.includes(
      "const scale = window.devicePixelRatio || 1;"
    ),
    context2dFound: scriptSource.includes('const ctx = canvas.getContext("2d");'),
    clearRectFound: scriptSource.includes("ctx.clearRect(0, 0, size.x, size.y);"),
    helperFanoutFound:
      scriptSource.includes("drawCustom25DBackground(ctx, size, bounds);") &&
      scriptSource.includes("drawCustom25DZones(ctx, bounds, topLeft);") &&
      scriptSource.includes("drawCustom25DBuildings(ctx, bounds, topLeft);") &&
      scriptSource.includes("drawCustom25DRoads(ctx, bounds, topLeft);") &&
      scriptSource.includes("drawCustom25DTrees(ctx, size, bounds);") &&
      scriptSource.includes("drawCustom25DLandmarkFoundation(ctx, bounds, topLeft);")
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "DRAW_SOURCE_LOCK_CONFIRMED" : "DRAW_SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY"
      : "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY",
    checks,
    discoveredDrawDependencies: ok
      ? deepFreeze({
          globalMapDependency: true,
          canvasContextDependency: "2d",
          pixelRatioBehavior: "window.devicePixelRatio || 1",
          resizingBehavior: "canvas.width, canvas.height, canvas.style.width, canvas.style.height mutate each draw",
          positioningBehavior: "L.DomUtil.setPosition(canvas, topLeft) runs each draw",
          globalDrawingDataDependencies:
            "background, zones, buildings, roads, trees, landmark foundation helper fanout",
          synchronousBehavior: true,
          listenerRegistrationInsideDraw: false,
          networkActivityInsideDraw: false,
          singleCallSuitability:
            "future_narrow_adapter_possible_but_requires_map_dependency_extraction"
        })
      : null
  });
}

export function createGrowGoCustom25DLiveOneFrameDrawOperation({
  expectedCanvasClassName = EXACT_CANVAS_CLASS_NAME,
  drawFunctionProvider,
  operationIdGenerator
} = {}) {
  let status = freezeStatus(createInitialStatus(expectedCanvasClassName));

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch,
      canvasClassName: patch.canvasClassName ?? status.canvasClassName
    });
    return status;
  }

  function getDrawOperationStatus() {
    return status;
  }

  function buildResult(operationId, operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus(patch);
    return createResult({
      operationId,
      operation,
      outcome,
      reasonCode,
      status: nextStatus
    });
  }

  function drawPreparedSurfaceExactlyOnce({ surface, canvas } = {}) {
    const operationId =
      status.operationId ??
      (typeof operationIdGenerator === "function"
        ? operationIdGenerator()
        : "LIVE_DRAW_OPERATION_ID_MISSING");

    if (status.permanentlyClosed) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "DRAW_OPERATION_ALREADY_CLOSED",
        {
          operationId,
          drawState: "blocked",
          secondDrawBlocked: true
        }
      );
    }

    const surfaceValidation = validateSurfaceContract(
      surface,
      expectedCanvasClassName
    );

    if (!surfaceValidation.ok) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        surfaceValidation.reasonCode,
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: surfaceValidation.surfaceSchemaValidated,
          surfaceValidated: false,
          cleanupRequired: surface?.cleanupRequired === true,
          lifecycleCleanupRequired:
            surface?.cleanupRequired === true || surface?.rollbackAvailable === true,
          permanentlyClosed: true
        }
      );
    }

    if (!canvas) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "MISSING_CANVAS",
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    if (surface.canvas !== canvas) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "CANVAS_IDENTITY_MISMATCH",
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    if (!canvasClassMatches(canvas, expectedCanvasClassName)) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "CANVAS_CLASS_MISMATCH",
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          canvasIdentityValidated: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    if (typeof drawFunctionProvider !== "function") {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "DRAW_FUNCTION_PROVIDER_MISSING",
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          canvasIdentityValidated: true,
          canvasClassValidated: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    let drawOperation;
    try {
      drawOperation = drawFunctionProvider();
    } catch (error) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "failed_closed",
        toReasonCode(error, "DRAW_FUNCTION_PROVIDER_EXCEPTION"),
        {
          operationId,
          drawState: "failed_closed",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          canvasIdentityValidated: true,
          canvasClassValidated: true,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    if (typeof drawOperation !== "function") {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "blocked",
        "DRAW_FUNCTION_UNAVAILABLE",
        {
          operationId,
          drawState: "blocked",
          surfaceSchemaValidated: true,
          surfaceValidated: true,
          canvasIdentityValidated: true,
          canvasClassValidated: true,
          drawFunctionAvailable: false,
          cleanupRequired: true,
          lifecycleCleanupRequired: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      operationId,
      drawState: "drawing",
      surfaceSchemaValidated: true,
      surfaceValidated: true,
      canvasIdentityValidated: true,
      canvasClassValidated: true,
      drawFunctionAvailable: true,
      drawAttemptCount: 1,
      cleanupRequired: true,
      lifecycleCleanupRequired: true,
      mapReferenceRetained: true,
      canvasReferenceRetained: true
    });

    const beforeShape = captureCanvasShape(canvas);

    let drawResult;
    try {
      drawResult = drawOperation({ surface, canvas });
    } catch (error) {
      const afterShape = captureCanvasShape(canvas);
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "failed_closed",
        toReasonCode(error, "DRAW_OPERATION_EXCEPTION"),
        {
          drawState: "failed_closed",
          drawCompleted: false,
          drawFailed: true,
          completedFrameCount: 0,
          permanentlyClosed: true,
          secondDrawBlocked: false,
          canvasResizeObserved: observedCanvasResize(beforeShape, afterShape),
          canvasPositionMutationObserved: observedCanvasPositionMutation(
            beforeShape,
            afterShape
          ),
          mapReferenceRetained: false,
          canvasReferenceRetained: false
        }
      );
    }

    const afterShape = captureCanvasShape(canvas);
    const resizeObserved = observedCanvasResize(beforeShape, afterShape);
    const positionObserved = observedCanvasPositionMutation(
      beforeShape,
      afterShape
    );

    if (drawResult?.ok === false) {
      return buildResult(
        operationId,
        "draw_prepared_surface_exactly_once",
        "failed_closed",
        drawResult.reasonCode ?? "DRAW_OPERATION_FAILED",
        {
          drawState: "failed_closed",
          drawCompleted: false,
          drawFailed: true,
          completedFrameCount: 0,
          permanentlyClosed: true,
          canvasResizeObserved: resizeObserved,
          canvasPositionMutationObserved: positionObserved,
          realRendererInvoked: drawResult.realRendererInvoked === true,
          realDrawFunctionCalled: drawResult.realDrawFunctionCalled === true,
          realCanvasCreated: drawResult.realCanvasCreated === true,
          realPaneCreated: drawResult.realPaneCreated === true,
          realWebglContextCreated:
            drawResult.realWebglContextCreated === true,
          realOverlayCreated: drawResult.realOverlayCreated === true,
          listenerAdded: drawResult.listenerAdded === true,
          retentionWritten: drawResult.retentionWritten === true,
          networkRequested: drawResult.networkRequested === true,
          assetDownloadRequested: drawResult.assetDownloadRequested === true,
          mapReferenceRetained: false,
          canvasReferenceRetained: false
        }
      );
    }

    return buildResult(
      operationId,
      "draw_prepared_surface_exactly_once",
      "completed",
      "LIVE_ONE_FRAME_DRAW_COMPLETED",
      {
        drawState: "completed",
        drawCompleted: true,
        drawFailed: false,
        completedFrameCount: 1,
        permanentlyClosed: true,
        secondDrawBlocked: false,
        canvasResizeObserved: resizeObserved,
        canvasPositionMutationObserved: positionObserved,
        realRendererInvoked: drawResult?.realRendererInvoked === true,
        realDrawFunctionCalled: drawResult?.realDrawFunctionCalled === true,
        realCanvasCreated: drawResult?.realCanvasCreated === true,
        realPaneCreated: drawResult?.realPaneCreated === true,
        realWebglContextCreated:
          drawResult?.realWebglContextCreated === true,
        realOverlayCreated: drawResult?.realOverlayCreated === true,
        listenerAdded: drawResult?.listenerAdded === true,
        retentionWritten: drawResult?.retentionWritten === true,
        networkRequested: drawResult?.networkRequested === true,
        assetDownloadRequested: drawResult?.assetDownloadRequested === true,
        mapReferenceRetained: false,
        canvasReferenceRetained: false
      }
    );
  }

  return deepFreeze({
    getDrawOperationStatus,
    drawPreparedSurfaceExactlyOnce
  });
}
