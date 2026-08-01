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
  "GROWGO_CUSTOM_25D_RENDERER_LIFECYCLE_OWNER_STATUS_001";
const OPERATION_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_RENDERER_LIFECYCLE_OWNER_OPERATION_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM_25D_RENDERER_OWNERSHIP_SOURCE_LOCK_001";

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

function normalizeEventNames(eventNames) {
  if (Array.isArray(eventNames)) {
    return eventNames.map((value) => String(value ?? "").trim()).filter(Boolean);
  }

  if (typeof eventNames === "string" && eventNames.trim()) {
    return [eventNames.trim()];
  }

  return [];
}

function createInitialStatus(expectedPaneName, expectedRetentionSlot) {
  return {
    schemaId: STATUS_SCHEMA_ID,
    lifecycleState: "idle",
    ownershipRegistered: false,
    disposed: false,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    mapRetained: false,
    paneRetained: false,
    canvasRetained: false,
    listenerRetained: false,
    redrawCallbackRetained: false,
    listenerEventNames: [],
    listenerRemovalAttemptCount: 0,
    canvasRemovalAttemptCount: 0,
    paneRemovalAttemptCount: 0,
    retentionResetAttemptCount: 0,
    unrelatedResourcesPreserved: true,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realListenerAdded: false,
    realDrawRequested: false,
    automaticInvocation: false,
    expectedPaneName,
    expectedRetentionSlot,
    retainedPaneName: null,
    retainedRetentionSlot: null,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

export function inspectGrowGoCustom25DRendererOwnershipSource({ scriptSource } = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_IDENTITY_MISMATCH"
    });
  }

  const checks = deepFreeze({
    initializationFunctionFound: scriptSource.includes(
      "function initCustom25DMapExperiment()"
    ),
    drawFunctionFound: scriptSource.includes(
      "function drawCustom25DMapCanvas(canvas)"
    ),
    retentionSlotFound: scriptSource.includes("let custom25DMapLayer = null;"),
    paneNameFound: scriptSource.includes('map.createPane("custom25DMapPane")'),
    canvasCreationPointFound: scriptSource.includes(
      'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)'
    ),
    redrawClosureFound: scriptSource.includes(
      "const redraw = () => drawCustom25DMapCanvas(canvas);"
    ),
    eventRegistrationFound: scriptSource.includes(
      'map.on("moveend zoomend", redraw);'
    ),
    immediateDrawFound: scriptSource.includes("redraw();"),
    retentionWriteFound: scriptSource.includes(
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
      scriptSource.includes("removeChild(canvas)"),
    explicitRetentionResetFound: /(?<!let\s)(?<!const\s)(?<!var\s)custom25DMapLayer\s*=\s*null/.test(
      scriptSource
    )
  });

  const identityPresent =
    checks.initializationFunctionFound &&
    checks.drawFunctionFound &&
    checks.retentionSlotFound &&
    checks.paneNameFound &&
    checks.canvasCreationPointFound &&
    checks.redrawClosureFound &&
    checks.eventRegistrationFound &&
    checks.retentionWriteFound;

  if (!identityPresent) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "IDENTITY_MISMATCH",
      classification: "BLOCKED_BY_UNRESOLVED_LISTENER_IDENTITY",
      checks
    });
  }

  const cleanupAvailable =
    checks.explicitCleanupFunctionFound &&
    checks.explicitListenerRemovalFound &&
    checks.explicitCanvasRemovalFound &&
    checks.explicitRetentionResetFound;

  const classification = cleanupAvailable
    ? "CLEANUP_CONTRACT_READY_FOR_PASSIVE_ADAPTER_INTEGRATION"
    : "REQUIRES_RENDERER_INITIALIZATION_EXTRACTION";

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok: true,
    reasonCode: cleanupAvailable
      ? "CLEANUP_SOURCE_LOCK_CONFIRMED"
      : "LIVE_INITIALIZATION_BUNDLES_RENDERER_SETUP",
    classification,
    checks,
    ownershipPoints: deepFreeze({
      initializationFunction: "initCustom25DMapExperiment",
      drawFunction: "drawCustom25DMapCanvas",
      retentionSlot: "custom25DMapLayer",
      paneName: "custom25DMapPane",
      canvasCreationPoint:
        'L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)',
      eventRegistration: 'map.on("moveend zoomend", redraw);',
      listenerIdentity: "const redraw = () => drawCustom25DMapCanvas(canvas);",
      immediateDraw: true,
      existingCleanupBehavior: cleanupAvailable
        ? "explicit_cleanup_found"
        : "no_verified_matching_cleanup_owner",
      paneRemovalCurrentlySafe: false,
      retentionResetExtractable: true
    })
  });
}

export function createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
  expectedPaneName = "custom25DMapPane",
  expectedRetentionSlot = "custom25DMapLayer",
  removeCanvas,
  removePaneIfEmpty
} = {}) {
  let ownedBundle = null;
  let status = deepFreeze(createInitialStatus(expectedPaneName, expectedRetentionSlot));

  function updateStatus(patch) {
    status = deepFreeze({
      ...status,
      ...patch,
      cleanupFailureReasons: deepFreeze([
        ...(patch.cleanupFailureReasons ?? status.cleanupFailureReasons ?? [])
      ]),
      listenerEventNames: deepFreeze([
        ...(patch.listenerEventNames ?? status.listenerEventNames ?? [])
      ]),
      canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
    });
    return status;
  }

  function buildResult(operation, outcome, reasonCode, patch = {}) {
    return deepFreeze({
      schemaId: OPERATION_SCHEMA_ID,
      operation,
      outcome,
      reasonCode,
      status: updateStatus({
        ...patch,
        lifecycleState: patch.lifecycleState ?? status.lifecycleState,
        cleanupFailureReasons:
          patch.cleanupFailureReasons ?? status.cleanupFailureReasons,
        listenerEventNames: patch.listenerEventNames ?? status.listenerEventNames
      })
    });
  }

  function getLifecycleOwnerStatus() {
    return status;
  }

  function validateBundle(bundle) {
    if (!bundle || typeof bundle !== "object") {
      return "MISSING_RESOURCE_BUNDLE";
    }

    if (!bundle.map || typeof bundle.map.off !== "function") {
      return "MAP_OFF_REQUIRED";
    }

    if (!bundle.canvas) {
      return "CANVAS_REQUIRED";
    }

    if (typeof bundle.listener !== "function") {
      return "LISTENER_REQUIRED";
    }

    if (typeof bundle.redrawCallback !== "function") {
      return "REDRAW_CALLBACK_REQUIRED";
    }

    const listenerEventNames = normalizeEventNames(bundle.listenerEventNames);
    if (
      listenerEventNames.length !== 1 ||
      listenerEventNames[0] !== "moveend zoomend"
    ) {
      return "UNEXPECTED_EVENT_NAMES";
    }

    if (bundle.retentionSlotName !== expectedRetentionSlot) {
      return "RETENTION_SLOT_IDENTITY_MISMATCH";
    }

    if (bundle.paneName !== expectedPaneName) {
      return "PANE_IDENTITY_MISMATCH";
    }

    if (typeof bundle.clearRetentionSlot !== "function") {
      return "RETENTION_RESET_REQUIRED";
    }

    return null;
  }

  function registerOwnedResources(bundle) {
    if (status.disposed) {
      return buildResult("register", "blocked", "LIFECYCLE_OWNER_DISPOSED");
    }

    if (ownedBundle) {
      return buildResult("register", "blocked", "OWNERSHIP_ALREADY_REGISTERED");
    }

    const failure = validateBundle(bundle);
    if (failure) {
      return buildResult("register", "failed_closed", failure, {
        lifecycleState: "failed_closed",
        disposed: true,
        cleanupCompleted: false,
        cleanupFailed: true,
        cleanupFailureReasons: [failure]
      });
    }

    ownedBundle = {
      map: bundle.map,
      pane: bundle.pane ?? null,
      paneName: bundle.paneName,
      canvas: bundle.canvas,
      listener: bundle.listener,
      redrawCallback: bundle.redrawCallback,
      listenerEventNames: normalizeEventNames(bundle.listenerEventNames),
      retentionSlotName: bundle.retentionSlotName,
      clearRetentionSlot: bundle.clearRetentionSlot,
      paneOwnershipProven: bundle.paneOwnershipProven === true
    };

    return buildResult("register", "registered", "OWNERSHIP_REGISTERED", {
      lifecycleState: "registered",
      ownershipRegistered: true,
      mapRetained: true,
      paneRetained: !!ownedBundle.pane,
      canvasRetained: true,
      listenerRetained: true,
      redrawCallbackRetained: true,
      listenerEventNames: ownedBundle.listenerEventNames,
      retainedPaneName: ownedBundle.paneName,
      retainedRetentionSlot: ownedBundle.retentionSlotName,
      cleanupCompleted: false,
      cleanupFailed: false,
      cleanupFailureReasons: []
    });
  }

  function disposeOwnedResources() {
    if (status.disposed && !ownedBundle) {
      return buildResult("dispose", "noop", "ALREADY_DISPOSED");
    }

    if (!ownedBundle) {
      return buildResult("dispose", "noop", "NOTHING_REGISTERED", {
        lifecycleState: "disposed",
        disposed: true,
        cleanupCompleted: true,
        ownershipRegistered: false
      });
    }

    const failureReasons = [];
    let listenerRemovalAttemptCount = 0;
    let canvasRemovalAttemptCount = 0;
    let paneRemovalAttemptCount = 0;
    let retentionResetAttemptCount = 0;

    try {
      listenerRemovalAttemptCount = 1;
      ownedBundle.map.off(
        ownedBundle.listenerEventNames[0],
        ownedBundle.listener
      );
    } catch (error) {
      failureReasons.push(toReasonCode(error, "LISTENER_REMOVAL_FAILED"));
    }

    try {
      canvasRemovalAttemptCount = 1;
      if (typeof removeCanvas !== "function") {
        throw Object.assign(new Error("removeCanvas missing"), {
          reasonCode: "CANVAS_REMOVAL_FAILED"
        });
      }
      removeCanvas(ownedBundle.canvas);
    } catch (error) {
      failureReasons.push(toReasonCode(error, "CANVAS_REMOVAL_FAILED"));
    }

    try {
      retentionResetAttemptCount = 1;
      ownedBundle.clearRetentionSlot();
    } catch (error) {
      failureReasons.push(toReasonCode(error, "RETENTION_RESET_FAILED"));
    }

    try {
      if (
        typeof removePaneIfEmpty === "function" &&
        ownedBundle.pane &&
        ownedBundle.paneOwnershipProven === true
      ) {
        paneRemovalAttemptCount = 1;
        removePaneIfEmpty(ownedBundle.pane, ownedBundle.paneName);
      }
    } catch (error) {
      failureReasons.push(toReasonCode(error, "PANE_REMOVAL_FAILED"));
    }

    ownedBundle = null;

    return buildResult(
      "dispose",
      failureReasons.length === 0 ? "disposed" : "failed_closed",
      failureReasons.length === 0 ? "CLEANUP_COMPLETED" : failureReasons[0],
      {
        lifecycleState:
          failureReasons.length === 0 ? "disposed" : "failed_closed",
        disposed: true,
        cleanupCompleted: failureReasons.length === 0,
        cleanupFailed: failureReasons.length > 0,
        cleanupFailureReasons: failureReasons,
        ownershipRegistered: false,
        mapRetained: false,
        paneRetained: false,
        canvasRetained: false,
        listenerRetained: false,
        redrawCallbackRetained: false,
        listenerEventNames: [],
        retainedPaneName: null,
        retainedRetentionSlot: null,
        listenerRemovalAttemptCount:
          status.listenerRemovalAttemptCount + listenerRemovalAttemptCount,
        canvasRemovalAttemptCount:
          status.canvasRemovalAttemptCount + canvasRemovalAttemptCount,
        paneRemovalAttemptCount:
          status.paneRemovalAttemptCount + paneRemovalAttemptCount,
        retentionResetAttemptCount:
          status.retentionResetAttemptCount + retentionResetAttemptCount
      }
    );
  }

  return deepFreeze({
    registerOwnedResources,
    disposeOwnedResources,
    getLifecycleOwnerStatus
  });
}
