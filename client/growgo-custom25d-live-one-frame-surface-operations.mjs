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
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_OPERATIONS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_OPERATIONS_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_OPERATIONS_SOURCE_LOCK_001";
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

function isValidMap(map) {
  return (
    isObjectLike(map) &&
    typeof map.getPane === "function" &&
    typeof map.createPane === "function" &&
    typeof map.getSize === "function" &&
    typeof map.getBounds === "function" &&
    typeof map.latLngToLayerPoint === "function"
  );
}

function validatePaneIdentity(pane, paneName) {
  if (!isObjectLike(pane)) {
    return false;
  }

  const explicitIdentities = [
    pane.dataset?.owner,
    pane.dataset?.paneName,
    pane.paneName,
    pane.name,
    pane.identity
  ].filter((value) => typeof value === "string" && value.trim());

  if (explicitIdentities.length === 0) {
    return true;
  }

  return explicitIdentities.every((value) => value === paneName);
}

function normalizeLogicalSize(size) {
  if (!isObjectLike(size)) {
    return null;
  }

  const width = Number(size.x ?? size.width);
  const height = Number(size.y ?? size.height);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return deepFreeze({ width, height });
}

function normalizePoint(point) {
  if (!isObjectLike(point)) {
    return null;
  }

  const x = Number(point.x);
  const y = Number(point.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({ x, y });
}

function normalizeDevicePixelRatio(value) {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    operationState: "idle",
    prepareAttemptCount: 0,
    rollbackAttemptCount: 0,
    paneReused: false,
    paneCreated: false,
    canvasCreated: false,
    canvasAppended: false,
    cleanupRequired: false,
    rollbackAvailable: false,
    rollbackAttempted: false,
    rollbackCompleted: false,
    rollbackFailureReason: null,
    listenerAdded: false,
    retentionWritten: false,
    drawRequested: false,
    automaticInvocation: false,
    moduleLevelMapRetained: false,
    moduleLevelPaneRetained: false,
    moduleLevelCanvasRetained: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realDomChanged: false,
    realWebglContextCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    browserActivationExposed: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function createPublicSurfaceSnapshot(surface) {
  if (!surface) {
    return null;
  }

  return deepFreeze({
    schemaId: SURFACE_SCHEMA_ID,
    paneName: surface.paneName,
    canvasClassName: surface.canvasClassName,
    paneReused: surface.paneReused,
    paneCreated: surface.paneCreated,
    paneOwnedByOperation: surface.paneOwnedByOperation,
    canvasOwnedByOperation: surface.canvasOwnedByOperation,
    canvasAppended: surface.canvasAppended,
    cssWidth: surface.cssWidth,
    cssHeight: surface.cssHeight,
    backingWidth: surface.backingWidth,
    backingHeight: surface.backingHeight,
    devicePixelRatio: surface.devicePixelRatio,
    canvasPosition: deepFreeze({ ...surface.canvasPosition }),
    cleanupRequired: surface.cleanupRequired,
    rollbackAvailable: surface.rollbackAvailable,
    listenerAdded: false,
    retentionWritten: false,
    drawRequested: false,
    automaticInvocation: false
  });
}

function createResult({
  operation,
  outcome,
  reasonCode,
  status,
  surface = null,
  rollbackAttempted = false,
  rollbackCompleted = false,
  rollbackFailureReason = null,
  rendererResizeOwnershipNote = "draw_function_resizes_each_frame"
}) {
  return Object.freeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    operationState: status.operationState,
    prepareAttemptCount: status.prepareAttemptCount,
    rollbackAttemptCount: status.rollbackAttemptCount,
    paneReused: status.paneReused,
    paneCreated: status.paneCreated,
    canvasCreated: status.canvasCreated,
    canvasAppended: status.canvasAppended,
    cleanupRequired: status.cleanupRequired,
    rollbackAvailable: status.rollbackAvailable,
    rollbackAttempted,
    rollbackCompleted,
    rollbackFailureReason,
    listenerAdded: false,
    retentionWritten: false,
    drawRequested: false,
    automaticInvocation: false,
    moduleLevelMapRetained: false,
    moduleLevelPaneRetained: false,
    moduleLevelCanvasRetained: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realDomChanged: false,
    realWebglContextCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    browserActivationExposed: false,
    rendererResizeOwnershipNote,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags(),
    surfaceSnapshot: createPublicSurfaceSnapshot(surface),
    surface
  });
}

function removeCanvasExact(surface) {
  const { canvas, pane } = surface;
  if (!canvas) {
    return;
  }
  if (typeof canvas.remove === "function") {
    canvas.remove();
    return;
  }
  if (pane && typeof pane.removeChild === "function") {
    pane.removeChild(canvas);
    return;
  }
  throw Object.assign(new Error("canvas removal unavailable"), {
    reasonCode: "ROLLBACK_CANVAS_REMOVAL_FAILED"
  });
}

function removeOwnedPaneIfEmpty(surface) {
  if (!surface.paneOwnedByOperation) {
    return;
  }

  const { pane } = surface;
  if (!pane) {
    return;
  }

  const childCount = Number(
    pane.childElementCount ??
      pane.children?.length ??
      pane.childNodes?.length ??
      0
  );

  if (childCount > 0) {
    return;
  }

  if (pane.parentNode && typeof pane.parentNode.removeChild === "function") {
    pane.parentNode.removeChild(pane);
    return;
  }

  if (typeof pane.remove === "function") {
    pane.remove();
    return;
  }

  throw Object.assign(new Error("pane removal unavailable"), {
    reasonCode: "ROLLBACK_PANE_REMOVAL_FAILED"
  });
}

export function inspectGrowGoCustom25DLiveOneFrameSurfaceOperationsSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_LEAFLET_PANE_API_GAP"
    });
  }

  const checks = deepFreeze({
    paneNameFound: scriptSource.includes('map.createPane("custom25DMapPane")'),
    canvasClassFound: scriptSource.includes(
      'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)'
    ),
    domPositionFound: scriptSource.includes(
      "L.DomUtil.setPosition(canvas, topLeft);"
    ),
    mapSizeFound: scriptSource.includes("map.getSize()"),
    boundsFound: scriptSource.includes("map.getBounds()"),
    layerPointFound: scriptSource.includes(
      "map.latLngToLayerPoint(bounds.getNorthWest())"
    ),
    initializerFound: scriptSource.includes(
      "function initCustom25DMapExperiment()"
    ),
    drawFound: scriptSource.includes("function drawCustom25DMapCanvas(canvas)"),
    retentionFound: scriptSource.includes("let custom25DMapLayer = null;"),
    pixelRatioFound: scriptSource.includes(
      "const scale = window.devicePixelRatio || 1;"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "LIVE_SURFACE_SOURCE_LOCK_CONFIRMED"
      : "BLOCKED_BY_CANVAS_POSITIONING_MISMATCH",
    checks,
    currentRendererBehavior: deepFreeze({
      paneName: EXACT_PANE_NAME,
      canvasClassName: EXACT_CANVAS_CLASS_NAME,
      createFunction: 'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)',
      positionFunction: "L.DomUtil.setPosition(canvas, topLeft);",
      pixelRatioResizeOwner: "drawCustom25DMapCanvas",
      rendererResizesAgainEachFrame: checks.pixelRatioFound === true
    })
  });
}

export function createGrowGoCustom25DLiveOneFrameSurfaceOperations({
  leafletProvider,
  devicePixelRatioProvider
} = {}) {
  let status = freezeStatus(createInitialStatus());

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getSurfaceOperationsStatus() {
    return status;
  }

  function failPrepare(reasonCode, patch = {}, surface = null) {
    return createResult({
      operation: "prepare_one_frame_surface",
      outcome: "failed_closed",
      reasonCode,
      status: updateStatus({
        operationState: "failed_closed",
        ...patch
      }),
      surface,
      rollbackAttempted: patch.rollbackAttempted === true,
      rollbackCompleted: patch.rollbackCompleted === true,
      rollbackFailureReason: patch.rollbackFailureReason ?? null
    });
  }

  function prepareOneFrameSurface({
    map,
    paneName = EXACT_PANE_NAME,
    canvasClassName = EXACT_CANVAS_CLASS_NAME
  } = {}) {
    updateStatus({
      prepareAttemptCount: status.prepareAttemptCount + 1,
      operationState: "preparing"
    });

    if (!map) {
      return failPrepare("MISSING_MAP");
    }
    if (!isValidMap(map)) {
      return failPrepare("INVALID_MAP_CONTRACT");
    }
    if (paneName !== EXACT_PANE_NAME) {
      return failPrepare("INCORRECT_PANE_NAME");
    }
    if (canvasClassName !== EXACT_CANVAS_CLASS_NAME) {
      return failPrepare("INCORRECT_CANVAS_CLASS");
    }
    if (!leafletProvider || !leafletProvider.DomUtil) {
      return failPrepare("MISSING_LEAFLET_PROVIDER");
    }
    if (typeof leafletProvider.DomUtil.create !== "function") {
      return failPrepare("MISSING_DOMUTIL_CREATE");
    }
    if (typeof leafletProvider.DomUtil.setPosition !== "function") {
      return failPrepare("MISSING_DOMUTIL_SET_POSITION");
    }

    let pane = null;
    let paneCreated = false;
    let paneReused = false;
    let canvas = null;
    let canvasAppended = false;
    let surface = null;

    try {
      pane = map.getPane(paneName);
    } catch (error) {
      return failPrepare(toReasonCode(error, "PANE_LOOKUP_FAILED"));
    }

    if (pane != null) {
      if (!validatePaneIdentity(pane, paneName)) {
        return failPrepare("INVALID_EXISTING_PANE");
      }
      paneReused = true;
    } else {
      try {
        const createdPane = map.createPane(paneName);
        pane = isObjectLike(createdPane) ? createdPane : map.getPane(paneName);
      } catch (error) {
        return failPrepare(toReasonCode(error, "PANE_CREATION_FAILED"));
      }

      if (!validatePaneIdentity(pane, paneName)) {
        return failPrepare("PANE_CREATION_FAILED");
      }
      paneCreated = true;
    }

    try {
      canvas = leafletProvider.DomUtil.create("canvas", canvasClassName, pane);
    } catch (error) {
      return failPrepare(toReasonCode(error, "CANVAS_CREATION_FAILED"));
    }

    if (!isObjectLike(canvas)) {
      return failPrepare("CANVAS_CREATION_FAILED");
    }

    surface = {
      schemaId: SURFACE_SCHEMA_ID,
      map,
      pane,
      canvas,
      paneName,
      canvasClassName,
      paneReused,
      paneCreated,
      paneOwnedByOperation: paneCreated,
      canvasOwnedByOperation: true,
      canvasAppended: false,
      cssWidth: null,
      cssHeight: null,
      backingWidth: null,
      backingHeight: null,
      devicePixelRatio: 1,
      canvasPosition: null,
      cleanupRequired: true,
      rollbackAvailable: true,
      listenerAdded: false,
      retentionWritten: false,
      drawRequested: false,
      automaticInvocation: false
    };

    try {
      if (canvas.parentNode !== pane && typeof pane.appendChild === "function") {
        pane.appendChild(canvas);
      }
      canvasAppended = canvas.parentNode === pane || typeof pane.appendChild !== "function";
      surface.canvasAppended = canvasAppended;
    } catch (error) {
      let rollbackAttempted = true;
      let rollbackCompleted = false;
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        rollbackCompleted = true;
      } catch (rollbackError) {
        rollbackFailureReason = toReasonCode(
          rollbackError,
          "ROLLBACK_CANVAS_REMOVAL_FAILED"
        );
      }
      return failPrepare("CANVAS_APPEND_FAILED", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended: false,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted,
        rollbackCompleted,
        rollbackFailureReason
      }, surface);
    }

    let logicalSize;
    let bounds;
    let northWest;
    let layerPoint;

    try {
      logicalSize = normalizeLogicalSize(map.getSize());
    } catch (error) {
      logicalSize = null;
    }
    if (!logicalSize) {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (error) {
        rollbackFailureReason = toReasonCode(error, "ROLLBACK_CANVAS_REMOVAL_FAILED");
      }
      return failPrepare("INVALID_MAP_SIZE", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    try {
      bounds = map.getBounds();
    } catch (error) {
      bounds = null;
    }
    if (!bounds || typeof bounds.getNorthWest !== "function") {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (error) {
        rollbackFailureReason = toReasonCode(error, "ROLLBACK_CANVAS_REMOVAL_FAILED");
      }
      return failPrepare("INVALID_BOUNDS", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    try {
      northWest = bounds.getNorthWest();
    } catch (error) {
      northWest = null;
    }
    if (northWest == null) {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (error) {
        rollbackFailureReason = toReasonCode(error, "ROLLBACK_CANVAS_REMOVAL_FAILED");
      }
      return failPrepare("INVALID_NORTH_WEST_COORDINATE", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    try {
      layerPoint = normalizePoint(map.latLngToLayerPoint(northWest));
    } catch (error) {
      layerPoint = null;
    }
    if (!layerPoint) {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (error) {
        rollbackFailureReason = toReasonCode(error, "ROLLBACK_CANVAS_REMOVAL_FAILED");
      }
      return failPrepare("INVALID_LAYER_POINT_POSITION", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    const devicePixelRatio = normalizeDevicePixelRatio(
      typeof devicePixelRatioProvider === "function"
        ? devicePixelRatioProvider()
        : globalThis?.devicePixelRatio
    );
    const backingWidth = Math.max(1, Math.round(logicalSize.width * devicePixelRatio));
    const backingHeight = Math.max(1, Math.round(logicalSize.height * devicePixelRatio));

    try {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
      if (!isObjectLike(canvas.style)) {
        canvas.style = {};
      }
      canvas.style.width = `${logicalSize.width}px`;
      canvas.style.height = `${logicalSize.height}px`;
      canvas.style.position = "absolute";
      canvas.style.pointerEvents = "none";
    } catch (error) {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (rollbackError) {
        rollbackFailureReason = toReasonCode(
          rollbackError,
          "ROLLBACK_CANVAS_REMOVAL_FAILED"
        );
      }
      return failPrepare("CANVAS_SIZING_FAILED", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    try {
      leafletProvider.DomUtil.setPosition(canvas, layerPoint);
    } catch (error) {
      let rollbackFailureReason = null;
      try {
        removeCanvasExact(surface);
        removeOwnedPaneIfEmpty(surface);
      } catch (rollbackError) {
        rollbackFailureReason = toReasonCode(
          rollbackError,
          "ROLLBACK_CANVAS_REMOVAL_FAILED"
        );
      }
      return failPrepare("CANVAS_POSITIONING_FAILED", {
        paneCreated,
        paneReused,
        canvasCreated: true,
        canvasAppended,
        cleanupRequired: true,
        rollbackAvailable: true,
        rollbackAttempted: true,
        rollbackCompleted: rollbackFailureReason == null,
        rollbackFailureReason
      }, surface);
    }

    surface.canvasAppended = canvasAppended;
    surface.cssWidth = logicalSize.width;
    surface.cssHeight = logicalSize.height;
    surface.backingWidth = backingWidth;
    surface.backingHeight = backingHeight;
    surface.devicePixelRatio = devicePixelRatio;
    surface.canvasPosition = { x: layerPoint.x, y: layerPoint.y };

    const nextStatus = updateStatus({
      operationState: "prepared",
      paneReused,
      paneCreated,
      canvasCreated: true,
      canvasAppended,
      cleanupRequired: true,
      rollbackAvailable: true
    });

    return createResult({
      operation: "prepare_one_frame_surface",
      outcome: "prepared",
      reasonCode: "LIVE_SURFACE_PREPARED",
      status: nextStatus,
      surface
    });
  }

  function rollbackPreparedSurface({ surface } = {}) {
    updateStatus({
      rollbackAttemptCount: status.rollbackAttemptCount + 1,
      operationState: "rolling_back"
    });

    if (!surface || surface.schemaId !== SURFACE_SCHEMA_ID) {
      return createResult({
        operation: "rollback_prepared_surface",
        outcome: "failed_closed",
        reasonCode: "INVALID_SURFACE_BUNDLE",
        status: updateStatus({
          operationState: "failed_closed"
        }),
        surface: null,
        rollbackAttempted: false,
        rollbackCompleted: false,
        rollbackFailureReason: null
      });
    }

    let rollbackFailureReason = null;
    try {
      removeCanvasExact(surface);
      removeOwnedPaneIfEmpty(surface);
    } catch (error) {
      rollbackFailureReason = toReasonCode(error, "ROLLBACK_CANVAS_REMOVAL_FAILED");
    }

    const nextStatus = updateStatus({
      operationState: rollbackFailureReason ? "failed_closed" : "rolled_back",
      rollbackAttempted: true,
      rollbackCompleted: rollbackFailureReason == null,
      rollbackFailureReason,
      cleanupRequired: true,
      rollbackAvailable: true
    });

    return createResult({
      operation: "rollback_prepared_surface",
      outcome: rollbackFailureReason ? "failed_closed" : "rolled_back",
      reasonCode: rollbackFailureReason ?? "ROLLBACK_COMPLETED",
      status: nextStatus,
      surface,
      rollbackAttempted: true,
      rollbackCompleted: rollbackFailureReason == null,
      rollbackFailureReason
    });
  }

  return deepFreeze({
    getSurfaceOperationsStatus,
    prepareOneFrameSurface,
    rollbackPreparedSurface
  });
}
