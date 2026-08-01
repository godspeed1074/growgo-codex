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

const IDENTITY_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_ADAPTER_IDENTITY_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_SOURCE_LOCK_001";
const ADAPTER_STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_ADAPTER_STATUS_001";
const ADAPTER_OPERATION_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_ADAPTER_OPERATION_RESULT_001";

function buildCanonicalSafetyFlags() {
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

export function createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor() {
  return deepFreeze({
    schemaId: IDENTITY_SCHEMA_ID,
    rendererId: "GROWGO_CUSTOM_25D_MAP_EXPERIMENT",
    rendererOwnerFile: "script.js",
    rendererInitializationEntry: "initCustom25DMapExperiment",
    rendererDrawEntry: "drawCustom25DMapCanvas",
    rendererRetentionSlot: "custom25DMapLayer",
    renderingTechnology: "canvas-2d-leaflet-pane",
    expectedCanvasOwnership: "custom25DMapLayer.canvas",
    expectedLeafletPaneOwnership: "custom25DMapPane",
    expectedCleanupOwnership: "missing_explicit_cleanup_owner",
    supportsOneFrameAdapter: false,
    adapterConnectionStatus: "passive_disconnected",
    liveOperationsInjected: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realListenerAdded: false,
    automaticInvocation: false
  });
}

export function validateGrowGoCustom25DRendererSourceLock({
  scriptSource,
  identity = createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor()
} = {}) {
  if (!identity || identity.schemaId !== IDENTITY_SCHEMA_ID) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "IDENTITY_MISMATCH",
      classification: "BLOCKED_BY_IDENTITY_MISMATCH"
    });
  }

  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_IDENTITY_MISMATCH"
    });
  }

  const explicitRetentionResetFound = /(?<!let\s)(?<!const\s)(?<!var\s)custom25DMapLayer\s*=\s*null/.test(
    scriptSource
  );

  const checks = deepFreeze({
    initializationFunctionFound: scriptSource.includes(
      "function initCustom25DMapExperiment()"
    ),
    drawFunctionFound: scriptSource.includes(
      "function drawCustom25DMapCanvas(canvas)"
    ),
    retentionSlotFound: scriptSource.includes("let custom25DMapLayer = null;"),
    paneCreationFound: scriptSource.includes('map.createPane("custom25DMapPane")'),
    canvasCreationFound: scriptSource.includes(
      'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)'
    ),
    immediateDrawFound: scriptSource.includes("redraw();"),
    listenerRegistrationFound: scriptSource.includes(
      'map.on("moveend zoomend", redraw)'
    ),
    redrawStoredInRetentionSlot: scriptSource.includes(
      "custom25DMapLayer = { canvas, redraw };"
    ),
    canvasOwnershipLocationFound: scriptSource.includes(
      "custom25DMapLayer = { canvas, redraw };"
    ),
    explicitCleanupFunctionFound:
      scriptSource.includes("function disposeCustom25DMapExperiment") ||
      scriptSource.includes("function cleanupCustom25DMapExperiment"),
    explicitListenerRemovalFound: scriptSource.includes(
      'map.off("moveend zoomend", redraw)'
    ),
    explicitCanvasRemovalFound:
      scriptSource.includes("canvas.remove()") ||
      scriptSource.includes("pane.removeChild(canvas)"),
    explicitRetentionResetFound
  });

  const identityChecksPassed =
    checks.initializationFunctionFound &&
    checks.drawFunctionFound &&
    checks.retentionSlotFound &&
    checks.canvasOwnershipLocationFound;

  if (!identityChecksPassed) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "IDENTITY_MISMATCH",
      classification: "BLOCKED_BY_IDENTITY_MISMATCH",
      checks
    });
  }

  const cleanupComplete =
    checks.explicitCleanupFunctionFound &&
    checks.explicitListenerRemovalFound &&
    checks.explicitCanvasRemovalFound &&
    checks.explicitRetentionResetFound;

  const initializationBundledLifecycle =
    checks.paneCreationFound &&
    checks.canvasCreationFound &&
    checks.listenerRegistrationFound &&
    checks.immediateDrawFound &&
    checks.redrawStoredInRetentionSlot;

  const classification = !cleanupComplete
    ? "BLOCKED_BY_MISSING_CLEANUP"
    : initializationBundledLifecycle
      ? "REQUIRES_SAFE_LIFECYCLE_EXTRACTION"
      : "READY_FOR_NARROW_LIVE_ADAPTER";

  const reasonCode =
    classification === "BLOCKED_BY_MISSING_CLEANUP"
      ? "MISSING_CLEANUP_PATH"
      : classification === "REQUIRES_SAFE_LIFECYCLE_EXTRACTION"
        ? "LIFECYCLE_BUNDLED_IN_LIVE_INITIALIZER"
        : "SOURCE_LOCK_CONFIRMED";

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok: true,
    reasonCode,
    classification,
    checks,
    discoveredLifecycle: deepFreeze({
      createsLeafletPane: checks.paneCreationFound,
      createsCanvas: checks.canvasCreationFound,
      installsListeners: checks.listenerRegistrationFound,
      drawsImmediately: checks.immediateDrawFound,
      writesRetentionSlot: checks.redrawStoredInRetentionSlot,
      explicitCleanupFound: cleanupComplete,
      cleanupOwnership:
        cleanupComplete === true
          ? "explicit_live_cleanup_found"
          : "explicit_live_cleanup_not_found",
      drawingDependsOnGlobalState: true,
      safelyCallableTwice: false,
      altersNormalLeafletBehavior: checks.listenerRegistrationFound
    })
  });
}

function createInitialStatus(identity) {
  return {
    schemaId: ADAPTER_STATUS_SCHEMA_ID,
    adapterState: "idle",
    reasonCode: "IDLE",
    identityValidated: false,
    initialized: false,
    drawCompleted: false,
    closed: false,
    initializationAttemptCount: 0,
    drawAttemptCount: 0,
    disposalAttemptCount: 0,
    completedFrameCount: 0,
    cleanupCompleted: false,
    cleanupRequired: false,
    liveMapRetained: false,
    liveCanvasRetained: false,
    liveOperationsInjected: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    mapListenerAdded: false,
    pollingOrTimerAdded: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    browserCommandExposed: false,
    rendererIdentity: identity,
    canonicalSafetyFlagSnapshot: buildCanonicalSafetyFlags()
  };
}

export function createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({
  identity,
  initializeOneFrameSurface,
  drawOneFrame,
  disposeOneFrameSurface
} = {}) {
  let surfaceToken = null;
  let state = createInitialStatus(identity ?? null);

  function freezeStatus(next) {
    state = deepFreeze({
      ...next,
      canonicalSafetyFlagSnapshot: buildCanonicalSafetyFlags()
    });
    return state;
  }

  function buildOperationResult(operation, outcome, reasonCode, extra = {}) {
    return deepFreeze({
      schemaId: ADAPTER_OPERATION_SCHEMA_ID,
      operation,
      outcome,
      reasonCode,
      status: freezeStatus({
        ...state,
        reasonCode,
        ...extra
      })
    });
  }

  function getAdapterStatus() {
    return state;
  }

  function validateIdentity() {
    if (state.closed) {
      return buildOperationResult("validate_identity", "blocked", "ADAPTER_CLOSED");
    }

    if (!identity) {
      return buildOperationResult("validate_identity", "failed_closed", "MISSING_IDENTITY", {
        adapterState: "failed_closed",
        closed: true
      });
    }

    if (
      identity.schemaId !== IDENTITY_SCHEMA_ID ||
      identity.rendererId !== "GROWGO_CUSTOM_25D_MAP_EXPERIMENT" ||
      identity.rendererInitializationEntry !== "initCustom25DMapExperiment" ||
      identity.rendererDrawEntry !== "drawCustom25DMapCanvas" ||
      identity.rendererRetentionSlot !== "custom25DMapLayer"
    ) {
      return buildOperationResult("validate_identity", "failed_closed", "IDENTITY_MISMATCH", {
        adapterState: "failed_closed",
        closed: true
      });
    }

    return buildOperationResult("validate_identity", "validated", "IDENTITY_VALIDATED", {
      adapterState: "idle",
      identityValidated: true
    });
  }

  function initializeForOneFrame() {
    if (state.closed) {
      return buildOperationResult("initialize", "blocked", "ADAPTER_CLOSED");
    }

    if (!state.identityValidated) {
      return buildOperationResult("initialize", "blocked", "IDENTITY_NOT_VALIDATED");
    }

    if (state.initialized) {
      return buildOperationResult("initialize", "blocked", "INITIALIZATION_ALREADY_COMPLETED");
    }

    if (typeof initializeOneFrameSurface !== "function") {
      return buildOperationResult(
        "initialize",
        "failed_closed",
        "INITIALIZE_CAPABILITY_MISSING",
        {
          adapterState: "failed_closed",
          closed: true
        }
      );
    }

    try {
      const initializationAttemptCount = state.initializationAttemptCount + 1;
      const result = initializeOneFrameSurface();

      if (result && result.ok === false) {
        return buildOperationResult(
          "initialize",
          "failed_closed",
          result.reasonCode ?? "INITIALIZATION_FAILED",
          {
            adapterState: "failed_closed",
            closed: true,
            initializationAttemptCount
          }
        );
      }

      surfaceToken = result?.surfaceToken ?? Object.freeze({ fakeSurface: true });

      return buildOperationResult("initialize", "initialized", "INITIALIZED", {
        adapterState: "initialized",
        initialized: true,
        initializationAttemptCount,
        cleanupRequired: true
      });
    } catch (error) {
      return buildOperationResult(
        "initialize",
        "failed_closed",
        toReasonCode(error, "INITIALIZATION_EXCEPTION"),
        {
          adapterState: "failed_closed",
          closed: true,
          initializationAttemptCount: state.initializationAttemptCount + 1
        }
      );
    }
  }

  function drawExactlyOneFrame() {
    if (state.closed) {
      return buildOperationResult("draw", "blocked", "ADAPTER_CLOSED");
    }

    if (!state.initialized) {
      return buildOperationResult("draw", "blocked", "INITIALIZATION_REQUIRED");
    }

    if (state.drawCompleted || state.drawAttemptCount > 0) {
      return buildOperationResult("draw", "blocked", "SECOND_DRAW_BLOCKED");
    }

    if (typeof drawOneFrame !== "function") {
      return buildOperationResult("draw", "failed_closed", "DRAW_CAPABILITY_MISSING", {
        adapterState: "failed_closed",
        closed: true
      });
    }

    try {
      const drawAttemptCount = state.drawAttemptCount + 1;
      const result = drawOneFrame(surfaceToken);

      if (result && result.ok === false) {
        return buildOperationResult(
          "draw",
          "failed_closed",
          result.reasonCode ?? "DRAW_FAILED",
          {
            adapterState: "failed_closed",
            closed: true,
            drawAttemptCount,
            cleanupRequired: true
          }
        );
      }

      return buildOperationResult("draw", "drawn", "FRAME_DRAWN", {
        adapterState: "frame_drawn",
        drawAttemptCount,
        drawCompleted: true,
        completedFrameCount: 1,
        cleanupRequired: true
      });
    } catch (error) {
      return buildOperationResult(
        "draw",
        "failed_closed",
        toReasonCode(error, "DRAW_EXCEPTION"),
        {
          adapterState: "failed_closed",
          closed: true,
          drawAttemptCount: state.drawAttemptCount + 1,
          cleanupRequired: true
        }
      );
    }
  }

  function disposeAfterOneFrame() {
    if (state.closed && state.cleanupCompleted) {
      return buildOperationResult("dispose", "noop", "ALREADY_DISPOSED");
    }

    if (typeof disposeOneFrameSurface !== "function") {
      return buildOperationResult(
        "dispose",
        "failed_closed",
        "DISPOSE_CAPABILITY_MISSING",
        {
          adapterState: "failed_closed",
          closed: true
        }
      );
    }

    try {
      const disposalAttemptCount = state.disposalAttemptCount + 1;
      const result = disposeOneFrameSurface(surfaceToken);

      if (result && result.ok === false) {
        return buildOperationResult(
          "dispose",
          "failed_closed",
          result.reasonCode ?? "DISPOSAL_FAILED",
          {
            adapterState: "failed_closed",
            closed: true,
            disposalAttemptCount,
            cleanupCompleted: false
          }
        );
      }

      surfaceToken = null;

      return buildOperationResult("dispose", "disposed", "DISPOSED", {
        adapterState: "disposed",
        closed: true,
        initialized: false,
        disposalAttemptCount,
        cleanupCompleted: true,
        cleanupRequired: false
      });
    } catch (error) {
      return buildOperationResult(
        "dispose",
        "failed_closed",
        toReasonCode(error, "DISPOSAL_EXCEPTION"),
        {
          adapterState: "failed_closed",
          closed: true,
          disposalAttemptCount: state.disposalAttemptCount + 1,
          cleanupCompleted: false
        }
      );
    }
  }

  return deepFreeze({
    validateIdentity,
    initializeForOneFrame,
    drawExactlyOneFrame,
    disposeAfterOneFrame,
    getAdapterStatus
  });
}
