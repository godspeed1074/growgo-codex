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
  "GROWGO_CUSTOM_25D_ONE_FRAME_SURFACE_PREPARATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_SURFACE_PREPARATION_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_SURFACE_PREPARATION_SOURCE_LOCK_001";
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

function isValidMap(value) {
  return isObjectLike(value);
}

function isValidPaneIdentity(pane, paneName) {
  if (!isObjectLike(pane)) {
    return false;
  }

  return (
    pane.dataset?.owner === paneName ||
    pane.paneName === paneName ||
    pane.name === paneName ||
    pane.identity === paneName
  );
}

function isValidCanvas(value) {
  return isObjectLike(value);
}

function normalizeCanvasPosition(position) {
  if (!isObjectLike(position)) {
    return null;
  }

  const x = Number(position.x);
  const y = Number(position.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({ x, y });
}

function normalizeMapSize(size) {
  if (!isObjectLike(size)) {
    return null;
  }

  const width = Number(size.width);
  const height = Number(size.height);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return deepFreeze({ width, height });
}

function defaultApplyCanvasSize(canvas, size) {
  canvas.width = size.width;
  canvas.height = size.height;
}

function defaultApplyCanvasPosition(canvas, position) {
  canvas.intendedPosition = { x: position.x, y: position.y };
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    preparationState: "idle",
    attemptCount: 0,
    duplicateAttemptBlocked: false,
    preparationCompleted: false,
    mapIdentityValidated: false,
    paneIdentityValidated: false,
    paneReused: false,
    paneCreated: false,
    canvasCreated: false,
    canvasAppended: false,
    cleanupRequired: false,
    lifecycleRegistrationRequired: false,
    rollbackAttempted: false,
    rollbackCompleted: false,
    rollbackFailureReasonCode: null,
    drawRequested: false,
    listenerAdded: false,
    retentionWritten: false,
    moduleLevelMapRetained: false,
    moduleLevelCanvasRetained: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realOverlayCreated: false,
    realWebglContextCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    pollingOrTimerAdded: false,
    browserCommandExposed: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function createResult({
  reasonCode,
  preparationStatus,
  paneName = EXACT_PANE_NAME,
  paneReused = false,
  paneCreated = false,
  paneIdentityValidated = false,
  canvasClassName = EXACT_CANVAS_CLASS_NAME,
  canvasCreated = false,
  canvasAppended = false,
  canvasWidth = null,
  canvasHeight = null,
  canvasPosition = null,
  mapIdentityValidated = false,
  cleanupRequired = false,
  lifecycleRegistrationRequired = false,
  drawRequested = false,
  listenerAdded = false,
  retentionWritten = false,
  realRendererInvoked = false,
  realCanvasCreated = false,
  realPaneCreated = false,
  realOverlayCreated = false,
  networkRequested = false,
  assetDownloadRequested = false,
  automaticInvocation = false,
  rollbackAttempted = false,
  rollbackCompleted = false,
  rollbackFailureReasonCode = null,
  moduleLevelMapRetained = false,
  moduleLevelCanvasRetained = false,
  ownedSurface = null
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    preparationStatus,
    reasonCode,
    paneName,
    paneReused,
    paneCreated,
    paneIdentityValidated,
    canvasClassName,
    canvasCreated,
    canvasAppended,
    canvasWidth,
    canvasHeight,
    canvasPosition,
    mapIdentityValidated,
    cleanupRequired,
    lifecycleRegistrationRequired,
    drawRequested,
    listenerAdded,
    retentionWritten,
    realRendererInvoked,
    realCanvasCreated,
    realPaneCreated,
    realOverlayCreated,
    networkRequested,
    assetDownloadRequested,
    automaticInvocation,
    rollbackAttempted,
    rollbackCompleted,
    rollbackFailureReasonCode,
    moduleLevelMapRetained,
    moduleLevelCanvasRetained,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags(),
    ownedSurface
  });
}

export function inspectGrowGoCustom25DOneFrameSurfacePreparationSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_SOURCE_LOCK_MISMATCH"
    });
  }

  const checks = deepFreeze({
    paneNameFound: scriptSource.includes('map.createPane("custom25DMapPane")'),
    canvasClassFound: scriptSource.includes(
      'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)'
    ),
    mapSizeFound: scriptSource.includes("map.getSize()"),
    topLeftFound: scriptSource.includes(
      "map.latLngToLayerPoint(bounds.getNorthWest())"
    ),
    initializerOwnershipFound: scriptSource.includes(
      "function initCustom25DMapExperiment()"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "INITIALIZATION_EXTRACTION_PLAN_READY"
      : "BLOCKED_BY_SOURCE_LOCK_MISMATCH",
    checks,
    discoveredSurfaceDependencies: ok
      ? deepFreeze({
          paneIdentity: EXACT_PANE_NAME,
          canvasClassName: EXACT_CANVAS_CLASS_NAME,
          sizeDependency: "map.getSize()",
          positionDependency: "map.latLngToLayerPoint(bounds.getNorthWest())",
          liveInitializerOwnership: "initCustom25DMapExperiment"
        })
      : null
  });
}

export function createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
  paneName = EXACT_PANE_NAME,
  canvasClassName = EXACT_CANVAS_CLASS_NAME,
  paneLookup,
  paneCreate,
  canvasCreate,
  canvasAppend,
  canvasRemove,
  mapSizeProvider,
  mapTopLeftProvider,
  applyCanvasSize = defaultApplyCanvasSize,
  applyCanvasPosition = defaultApplyCanvasPosition
} = {}) {
  let status = deepFreeze(createInitialStatus());
  let helperConsumed = false;

  function updateStatus(patch) {
    status = deepFreeze({
      ...status,
      ...patch,
      canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
    });
    return status;
  }

  function getPreparationStatus() {
    return status;
  }

  function failBeforeCanvas({
    reasonCode,
    attemptCount,
    mapIdentityValidated = false
  }) {
    const nextStatus = updateStatus({
      preparationState: "blocked",
      attemptCount,
      duplicateAttemptBlocked: reasonCode === "PREPARATION_ALREADY_COMPLETED",
      preparationCompleted: false,
      mapIdentityValidated,
      paneIdentityValidated: false,
      paneReused: false,
      paneCreated: false,
      canvasCreated: false,
      canvasAppended: false,
      cleanupRequired: false,
      lifecycleRegistrationRequired: false,
      rollbackAttempted: false,
      rollbackCompleted: false,
      rollbackFailureReasonCode: null
    });

    return createResult({
      reasonCode,
      preparationStatus: nextStatus.preparationState,
      mapIdentityValidated: nextStatus.mapIdentityValidated
    });
  }

  function rollbackAfterCanvas({
    reasonCode,
    attemptCount,
    mapIdentityValidated,
    paneIdentityValidated,
    paneReused,
    paneCreated,
    canvas,
    pane,
    canvasAppended,
    canvasWidth,
    canvasHeight,
    canvasPosition
  }) {
    let rollbackCompleted = false;
    let rollbackFailureReasonCode = null;

    try {
      canvasRemove(canvas, pane);
      rollbackCompleted = true;
    } catch (error) {
      rollbackFailureReasonCode = toReasonCode(
        error,
        "ROLLBACK_REMOVAL_EXCEPTION"
      );
    }

    const cleanupRequired = rollbackCompleted !== true;
    const nextStatus = updateStatus({
      preparationState: "failed",
      attemptCount,
      preparationCompleted: false,
      mapIdentityValidated,
      paneIdentityValidated,
      paneReused,
      paneCreated,
      canvasCreated: true,
      canvasAppended,
      cleanupRequired,
      lifecycleRegistrationRequired: false,
      rollbackAttempted: true,
      rollbackCompleted,
      rollbackFailureReasonCode
    });

    return createResult({
      reasonCode,
      preparationStatus: nextStatus.preparationState,
      paneReused,
      paneCreated,
      paneIdentityValidated,
      canvasCreated: true,
      canvasAppended,
      canvasWidth,
      canvasHeight,
      canvasPosition,
      mapIdentityValidated,
      cleanupRequired,
      lifecycleRegistrationRequired: false,
      rollbackAttempted: true,
      rollbackCompleted,
      rollbackFailureReasonCode,
      ownedSurface:
        rollbackCompleted === true
          ? null
          : deepFreeze({
              pane,
              canvas,
              paneOwned: paneCreated
            })
    });
  }

  function prepareOneFrameSurface({ map, paneName: requestedPaneName } = {}) {
    const attemptCount = status.attemptCount + 1;

    if (helperConsumed) {
      return failBeforeCanvas({
        reasonCode: "PREPARATION_ALREADY_COMPLETED",
        attemptCount,
        mapIdentityValidated: false
      });
    }

    helperConsumed = true;

    if (requestedPaneName !== undefined && requestedPaneName !== paneName) {
      return failBeforeCanvas({
        reasonCode: "INCORRECT_PANE_NAME",
        attemptCount
      });
    }

    if (paneName !== EXACT_PANE_NAME) {
      return failBeforeCanvas({
        reasonCode: "INCORRECT_PANE_NAME",
        attemptCount
      });
    }

    if (canvasClassName !== EXACT_CANVAS_CLASS_NAME) {
      return failBeforeCanvas({
        reasonCode: "INCORRECT_CANVAS_CLASS_NAME",
        attemptCount
      });
    }

    if (!isValidMap(map)) {
      return failBeforeCanvas({
        reasonCode: map == null ? "MISSING_MAP" : "INVALID_MAP_INTERFACE",
        attemptCount
      });
    }

    if (typeof paneLookup !== "function") {
      return failBeforeCanvas({
        reasonCode: "PANE_LOOKUP_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof paneCreate !== "function") {
      return failBeforeCanvas({
        reasonCode: "PANE_CREATE_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof canvasCreate !== "function") {
      return failBeforeCanvas({
        reasonCode: "CANVAS_FACTORY_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof canvasAppend !== "function") {
      return failBeforeCanvas({
        reasonCode: "CANVAS_APPEND_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof canvasRemove !== "function") {
      return failBeforeCanvas({
        reasonCode: "CANVAS_REMOVE_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof mapSizeProvider !== "function") {
      return failBeforeCanvas({
        reasonCode: "MAP_SIZE_PROVIDER_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof mapTopLeftProvider !== "function") {
      return failBeforeCanvas({
        reasonCode: "MAP_TOP_LEFT_PROVIDER_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof applyCanvasSize !== "function") {
      return failBeforeCanvas({
        reasonCode: "CANVAS_SIZE_APPLIER_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (typeof applyCanvasPosition !== "function") {
      return failBeforeCanvas({
        reasonCode: "CANVAS_POSITION_APPLIER_REQUIRED",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    let pane = null;
    let paneReused = false;
    let paneCreated = false;

    try {
      pane = paneLookup(map, paneName);
    } catch (error) {
      return failBeforeCanvas({
        reasonCode: "PANE_LOOKUP_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (pane != null) {
      if (!isValidPaneIdentity(pane, paneName)) {
        return failBeforeCanvas({
          reasonCode: "INVALID_EXISTING_PANE_IDENTITY",
          attemptCount,
          mapIdentityValidated: true
        });
      }

      paneReused = true;
    } else {
      try {
        pane = paneCreate(map, paneName);
      } catch (error) {
        return failBeforeCanvas({
          reasonCode: "PANE_CREATION_EXCEPTION",
          attemptCount,
          mapIdentityValidated: true
        });
      }

      if (!isValidPaneIdentity(pane, paneName)) {
        return failBeforeCanvas({
          reasonCode: "CREATED_PANE_IDENTITY_INVALID",
          attemptCount,
          mapIdentityValidated: true
        });
      }

      paneCreated = true;
    }

    let canvas = null;

    try {
      canvas = canvasCreate(canvasClassName, pane, map);
    } catch (error) {
      return failBeforeCanvas({
        reasonCode: "CANVAS_CREATION_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    if (!isValidCanvas(canvas)) {
      return failBeforeCanvas({
        reasonCode: "INVALID_CANVAS_RESULT",
        attemptCount,
        mapIdentityValidated: true
      });
    }

    try {
      canvasAppend(pane, canvas, map);
    } catch (error) {
      return rollbackAfterCanvas({
        reasonCode: "APPEND_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: false,
        canvasWidth: null,
        canvasHeight: null,
        canvasPosition: null
      });
    }

    let normalizedSize = null;

    try {
      normalizedSize = normalizeMapSize(mapSizeProvider(map));
    } catch (error) {
      return rollbackAfterCanvas({
        reasonCode: "MAP_SIZE_PROVIDER_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: null,
        canvasHeight: null,
        canvasPosition: null
      });
    }

    if (!normalizedSize) {
      return rollbackAfterCanvas({
        reasonCode: "INVALID_MAP_SIZE",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: null,
        canvasHeight: null,
        canvasPosition: null
      });
    }

    try {
      applyCanvasSize(canvas, normalizedSize);
    } catch (error) {
      return rollbackAfterCanvas({
        reasonCode: "CANVAS_SIZING_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: normalizedSize.width,
        canvasHeight: normalizedSize.height,
        canvasPosition: null
      });
    }

    let normalizedPosition = null;

    try {
      normalizedPosition = normalizeCanvasPosition(mapTopLeftProvider(map));
    } catch (error) {
      return rollbackAfterCanvas({
        reasonCode: "MAP_TOP_LEFT_PROVIDER_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: normalizedSize.width,
        canvasHeight: normalizedSize.height,
        canvasPosition: null
      });
    }

    if (!normalizedPosition) {
      return rollbackAfterCanvas({
        reasonCode: "INVALID_TOP_LEFT_POSITION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: normalizedSize.width,
        canvasHeight: normalizedSize.height,
        canvasPosition: null
      });
    }

    try {
      applyCanvasPosition(canvas, normalizedPosition);
    } catch (error) {
      return rollbackAfterCanvas({
        reasonCode: "CANVAS_POSITIONING_EXCEPTION",
        attemptCount,
        mapIdentityValidated: true,
        paneIdentityValidated: true,
        paneReused,
        paneCreated,
        canvas,
        pane,
        canvasAppended: true,
        canvasWidth: normalizedSize.width,
        canvasHeight: normalizedSize.height,
        canvasPosition: normalizedPosition
      });
    }

    const nextStatus = updateStatus({
      preparationState: "prepared",
      attemptCount,
      duplicateAttemptBlocked: false,
      preparationCompleted: true,
      mapIdentityValidated: true,
      paneIdentityValidated: true,
      paneReused,
      paneCreated,
      canvasCreated: true,
      canvasAppended: true,
      cleanupRequired: true,
      lifecycleRegistrationRequired: true,
      rollbackAttempted: false,
      rollbackCompleted: false,
      rollbackFailureReasonCode: null
    });

    return createResult({
      reasonCode: "SURFACE_PREPARED",
      preparationStatus: nextStatus.preparationState,
      paneReused,
      paneCreated,
      paneIdentityValidated: true,
      canvasCreated: true,
      canvasAppended: true,
      canvasWidth: normalizedSize.width,
      canvasHeight: normalizedSize.height,
      canvasPosition: normalizedPosition,
      mapIdentityValidated: true,
      cleanupRequired: true,
      lifecycleRegistrationRequired: true,
      ownedSurface: deepFreeze({
        pane,
        canvas,
        paneOwned: paneCreated
      })
    });
  }

  return deepFreeze({
    getPreparationStatus,
    prepareOneFrameSurface
  });
}
