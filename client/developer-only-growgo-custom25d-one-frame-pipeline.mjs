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

const STATUS_SCHEMA_ID = "GROWGO_CUSTOM_25D_ONE_FRAME_PIPELINE_STATUS_001";
const RESULT_SCHEMA_ID = "GROWGO_CUSTOM_25D_ONE_FRAME_PIPELINE_RESULT_001";
const EXACT_CANVAS_CLASS_NAME = "custom-25d-map-canvas";
const EXACT_PANE_NAME = "custom25DMapPane";

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

function initialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    pipelineId: null,
    pipelineState: "idle",
    executionAttemptCount: 0,
    surfacePreparationAttemptCount: 0,
    surfacePrepared: false,
    lifecycleRegistrationAttemptCount: 0,
    lifecycleOwnershipRegistered: false,
    drawAttemptCount: 0,
    completedFrameCount: 0,
    drawCompleted: false,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    permanentlyClosed: false,
    secondExecutionBlocked: false,
    paneReused: false,
    paneCreated: false,
    canvasCreated: false,
    canvasAppended: false,
    canvasRemoved: false,
    listenerRemoved: false,
    retentionReset: false,
    unrelatedResourcesPreserved: true,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    realListenerAdded: false,
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
    cleanupFailureReasons: deepFreeze([
      ...(status.cleanupFailureReasons ?? [])
    ]),
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function createResult({
  pipelineId,
  operation,
  outcome,
  reasonCode,
  status
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    pipelineId,
    operation,
    outcome,
    reasonCode,
    pipelineState: status.pipelineState,
    executionAttemptCount: status.executionAttemptCount,
    surfacePreparationAttemptCount: status.surfacePreparationAttemptCount,
    surfacePrepared: status.surfacePrepared,
    lifecycleRegistrationAttemptCount: status.lifecycleRegistrationAttemptCount,
    lifecycleOwnershipRegistered: status.lifecycleOwnershipRegistered,
    drawAttemptCount: status.drawAttemptCount,
    completedFrameCount: status.completedFrameCount,
    drawCompleted: status.drawCompleted,
    cleanupAttemptCount: status.cleanupAttemptCount,
    cleanupCompleted: status.cleanupCompleted,
    cleanupFailed: status.cleanupFailed,
    cleanupFailureReasons: status.cleanupFailureReasons,
    permanentlyClosed: status.permanentlyClosed,
    secondExecutionBlocked: status.secondExecutionBlocked,
    paneReused: status.paneReused,
    paneCreated: status.paneCreated,
    canvasCreated: status.canvasCreated,
    canvasAppended: status.canvasAppended,
    canvasRemoved: status.canvasRemoved,
    listenerRemoved: status.listenerRemoved,
    retentionReset: status.retentionReset,
    unrelatedResourcesPreserved: status.unrelatedResourcesPreserved,
    realRendererInvoked: status.realRendererInvoked,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realWebglContextCreated: status.realWebglContextCreated,
    realOverlayCreated: status.realOverlayCreated,
    realListenerAdded: status.realListenerAdded,
    mapReferenceRetained: status.mapReferenceRetained,
    canvasReferenceRetained: status.canvasReferenceRetained,
    networkRequested: status.networkRequested,
    assetDownloadRequested: status.assetDownloadRequested,
    automaticInvocation: status.automaticInvocation,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

function deriveCleanupPatch(cleanupResult) {
  const cleanupStatus = cleanupResult?.status;
  const cleanupFailureReasons = Array.isArray(cleanupStatus?.cleanupFailureReasons)
    ? cleanupStatus.cleanupFailureReasons
    : [];

  return {
    cleanupAttemptCount: cleanupResult ? 1 : 0,
    cleanupCompleted: cleanupStatus?.cleanupCompleted === true,
    cleanupFailed:
      cleanupStatus?.cleanupFailed === true || cleanupFailureReasons.length > 0,
    cleanupFailureReasons,
    canvasRemoved: (cleanupStatus?.canvasRemovalAttemptCount ?? 0) > 0,
    listenerRemoved: (cleanupStatus?.listenerRemovalAttemptCount ?? 0) > 0,
    retentionReset: (cleanupStatus?.retentionResetAttemptCount ?? 0) > 0,
    unrelatedResourcesPreserved:
      cleanupStatus?.unrelatedResourcesPreserved !== false
  };
}

export function createDeveloperOnlyGrowGoCustom25DOneFramePipeline({
  surfacePreparation,
  drawHelperFactory,
  lifecycleOwnerFactory,
  pipelineIdGenerator
} = {}) {
  let status = freezeStatus(initialStatus());
  let currentRefs = {
    map: null,
    pane: null,
    canvas: null,
    lifecycleOwner: null,
    drawHelper: null
  };

  function clearRefs() {
    currentRefs = {
      map: null,
      pane: null,
      canvas: null,
      lifecycleOwner: null,
      drawHelper: null
    };
  }

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getPipelineStatus() {
    return status;
  }

  function finish(operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus(patch);
    if (nextStatus.permanentlyClosed) {
      clearRefs();
      updateStatus({
        mapReferenceRetained: false,
        canvasReferenceRetained: false
      });
    }

    return createResult({
      pipelineId: nextStatus.pipelineId,
      operation,
      outcome,
      reasonCode,
      status: freezeStatus({
        ...status,
        mapReferenceRetained: false,
        canvasReferenceRetained: false
      })
    });
  }

  function requestSecondFrame() {
    return finish("request_second_frame", "blocked", "SECOND_FRAME_BLOCKED", {
      pipelineState: status.permanentlyClosed ? "blocked" : status.pipelineState,
      secondExecutionBlocked: true
    });
  }

  function validateDependencies() {
    if (!surfacePreparation || typeof surfacePreparation.prepareOneFrameSurface !== "function") {
      return "MISSING_SURFACE_PREPARATION_DEPENDENCY";
    }
    if (typeof lifecycleOwnerFactory !== "function") {
      return "MISSING_LIFECYCLE_OWNER_FACTORY";
    }
    if (typeof drawHelperFactory !== "function") {
      return "MISSING_DRAW_HELPER_FACTORY";
    }
    return null;
  }

  function executeOneFramePipeline({ map } = {}) {
    const pipelineId =
      status.pipelineId ??
      (typeof pipelineIdGenerator === "function"
        ? pipelineIdGenerator()
        : "PIPELINE_ID_MISSING");

    if (status.permanentlyClosed) {
      return finish("execute_one_frame_pipeline", "blocked", "PIPELINE_ALREADY_CLOSED", {
        pipelineId,
        pipelineState: "blocked",
        secondExecutionBlocked: true
      });
    }

    const dependencyFailure = validateDependencies();
    if (dependencyFailure) {
      return finish(
        "execute_one_frame_pipeline",
        "failed_closed",
        dependencyFailure,
        {
          pipelineId,
          pipelineState: "failed_closed",
          executionAttemptCount: status.executionAttemptCount + 1,
          permanentlyClosed: true,
          secondExecutionBlocked: false
        }
      );
    }

    updateStatus({
      pipelineId,
      pipelineState: "preparing_surface",
      executionAttemptCount: status.executionAttemptCount + 1,
      surfacePreparationAttemptCount: status.surfacePreparationAttemptCount + 1,
      mapReferenceRetained: true
    });
    currentRefs.map = map ?? null;

    let surfaceResult;
    try {
      surfaceResult = surfacePreparation.prepareOneFrameSurface({ map });
    } catch (error) {
      return finish("execute_one_frame_pipeline", "failed_closed", toReasonCode(error, "SURFACE_PREPARATION_EXCEPTION"), {
        pipelineState: "failed_closed",
        permanentlyClosed: true
      });
    }

    if (!isObjectLike(surfaceResult) || surfaceResult.preparationStatus !== "prepared") {
      return finish(
        "execute_one_frame_pipeline",
        "failed_closed",
        surfaceResult?.reasonCode ?? "INVALID_SURFACE_DESCRIPTOR",
        {
          pipelineState: "failed_closed",
          permanentlyClosed: true,
          surfacePrepared: false,
          paneReused: surfaceResult?.paneReused === true,
          paneCreated: surfaceResult?.paneCreated === true,
          canvasCreated: surfaceResult?.canvasCreated === true,
          canvasAppended: surfaceResult?.canvasAppended === true
        }
      );
    }

    const pane = surfaceResult.ownedSurface?.pane ?? null;
    const canvas = surfaceResult.ownedSurface?.canvas ?? null;

    if (!canvas || surfaceResult.canvasClassName !== EXACT_CANVAS_CLASS_NAME) {
      return finish("execute_one_frame_pipeline", "failed_closed", "BLOCKED_BY_SURFACE_DRAW_CONTRACT_MISMATCH", {
        pipelineState: "failed_closed",
        permanentlyClosed: true,
        surfacePrepared: true,
        paneReused: surfaceResult.paneReused === true,
        paneCreated: surfaceResult.paneCreated === true,
        canvasCreated: surfaceResult.canvasCreated === true,
        canvasAppended: surfaceResult.canvasAppended === true
      });
    }

    currentRefs.pane = pane;
    currentRefs.canvas = canvas;

    updateStatus({
      pipelineState: "surface_prepared",
      surfacePrepared: true,
      paneReused: surfaceResult.paneReused === true,
      paneCreated: surfaceResult.paneCreated === true,
      canvasCreated: surfaceResult.canvasCreated === true,
      canvasAppended: surfaceResult.canvasAppended === true,
      canvasReferenceRetained: true
    });

    let lifecycleOwner;
    try {
      lifecycleOwner = lifecycleOwnerFactory();
    } catch (error) {
      return finish("execute_one_frame_pipeline", "failed_closed", toReasonCode(error, "LIFECYCLE_OWNER_FACTORY_EXCEPTION"), {
        pipelineState: "failed_closed",
        permanentlyClosed: true
      });
    }

    if (
      !lifecycleOwner ||
      typeof lifecycleOwner.registerOwnedResources !== "function" ||
      typeof lifecycleOwner.disposeOwnedResources !== "function" ||
      typeof lifecycleOwner.getLifecycleOwnerStatus !== "function"
    ) {
      return finish("execute_one_frame_pipeline", "failed_closed", "BLOCKED_BY_LIFECYCLE_REGISTRATION_GAP", {
        pipelineState: "failed_closed",
        permanentlyClosed: true
      });
    }

    currentRefs.lifecycleOwner = lifecycleOwner;
    updateStatus({
      pipelineState: "ownership_registered",
      lifecycleRegistrationAttemptCount:
        status.lifecycleRegistrationAttemptCount + 1
    });

    const fakeListener = function fakePipelineListener() {};
    const fakeRedrawCallback = function fakePipelineRedrawCallback() {};
    let retentionState = { current: { canvas, redraw: fakeRedrawCallback } };
    const clearRetentionSlot = () => {
      retentionState.current = null;
    };

    let registrationResult;
    try {
      registrationResult = lifecycleOwner.registerOwnedResources({
        map,
        pane,
        paneName: EXACT_PANE_NAME,
        canvas,
        listener: fakeListener,
        redrawCallback: fakeRedrawCallback,
        listenerEventNames: "moveend zoomend",
        retentionSlotName: "custom25DMapLayer",
        clearRetentionSlot,
        paneOwnershipProven: surfaceResult.ownedSurface?.paneOwned === true
      });
    } catch (error) {
      return finish("execute_one_frame_pipeline", "failed_closed", toReasonCode(error, "LIFECYCLE_REGISTRATION_EXCEPTION"), {
        pipelineState: "failed_closed",
        permanentlyClosed: true
      });
    }

    if (registrationResult?.outcome !== "registered") {
      let cleanupPatch = {
        cleanupAttemptCount: 0,
        cleanupCompleted: false,
        cleanupFailed: true,
        cleanupFailureReasons: [registrationResult?.reasonCode ?? "OWNERSHIP_REGISTRATION_FAILED"],
        canvasRemoved: false,
        listenerRemoved: false,
        retentionReset: false,
        unrelatedResourcesPreserved: true
      };

      if (typeof lifecycleOwner.rollbackUnregisteredSurface === "function") {
        try {
          const rollbackResult = lifecycleOwner.rollbackUnregisteredSurface(surfaceResult);
          cleanupPatch = {
            ...cleanupPatch,
            ...deriveCleanupPatch(rollbackResult)
          };
        } catch (error) {
          cleanupPatch = {
            ...cleanupPatch,
            cleanupAttemptCount: 1,
            cleanupFailed: true,
            cleanupFailureReasons: [
              ...cleanupPatch.cleanupFailureReasons,
              toReasonCode(error, "REGISTRATION_ROLLBACK_EXCEPTION")
            ]
          };
        }
      }

      return finish(
        "execute_one_frame_pipeline",
        "failed_closed",
        registrationResult?.reasonCode ?? "OWNERSHIP_REGISTRATION_FAILED",
        {
          pipelineState: "failed_closed",
          permanentlyClosed: true,
          lifecycleOwnershipRegistered: false,
          ...cleanupPatch
        }
      );
    }

    updateStatus({
      pipelineState: "ownership_registered",
      lifecycleOwnershipRegistered: true
    });

    let drawHelper;
    try {
      drawHelper = drawHelperFactory();
    } catch (error) {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finish("execute_one_frame_pipeline", "failed_closed", toReasonCode(error, "DRAW_HELPER_FACTORY_EXCEPTION"), {
        pipelineState: "failed_closed",
        permanentlyClosed: true,
        ...deriveCleanupPatch(cleanupResult)
      });
    }

    if (
      !drawHelper ||
      typeof drawHelper.drawPreparedSurface !== "function" ||
      typeof drawHelper.getDrawStatus !== "function"
    ) {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finish("execute_one_frame_pipeline", "failed_closed", "BLOCKED_BY_SURFACE_DRAW_CONTRACT_MISMATCH", {
        pipelineState: "failed_closed",
        permanentlyClosed: true,
        ...deriveCleanupPatch(cleanupResult)
      });
    }

    currentRefs.drawHelper = drawHelper;
    updateStatus({
      pipelineState: "drawing"
    });

    let drawResult;
    try {
      drawResult = drawHelper.drawPreparedSurface({
        surface: surfaceResult,
        canvas
      });
    } catch (error) {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finish("execute_one_frame_pipeline", "failed_closed", toReasonCode(error, "DRAW_EXCEPTION"), {
        pipelineState: "failed_closed",
        permanentlyClosed: true,
        drawAttemptCount: 1,
        completedFrameCount: 0,
        drawCompleted: false,
        ...deriveCleanupPatch(cleanupResult)
      });
    }

    updateStatus({
      drawAttemptCount: drawResult?.drawAttemptCount ?? 0,
      completedFrameCount: drawResult?.completedFrameCount ?? 0,
      drawCompleted: drawResult?.drawCompleted === true
    });

    updateStatus({
      pipelineState:
        drawResult?.drawCompleted === true ? "frame_completed" : "failed_closed"
    });

    updateStatus({
      pipelineState: "cleaning_up"
    });
    const cleanupResult = lifecycleOwner.disposeOwnedResources();
    const cleanupPatch = deriveCleanupPatch(cleanupResult);

    if (drawResult?.outcome !== "drawn") {
      return finish(
        "execute_one_frame_pipeline",
        "failed_closed",
        drawResult?.reasonCode ?? "DRAW_FAILED",
        {
          pipelineState: "failed_closed",
          permanentlyClosed: true,
          drawAttemptCount: drawResult?.drawAttemptCount ?? 0,
          completedFrameCount: drawResult?.completedFrameCount ?? 0,
          drawCompleted: false,
          ...cleanupPatch
        }
      );
    }

    const cleanupFailed = cleanupPatch.cleanupFailed === true;

    return finish(
      "execute_one_frame_pipeline",
      cleanupFailed ? "failed_closed" : "completed",
      cleanupFailed
        ? cleanupPatch.cleanupFailureReasons[0] ?? "CLEANUP_FAILED"
        : "PIPELINE_COMPLETED",
      {
        pipelineState: "disposed",
        permanentlyClosed: true,
        drawAttemptCount: drawResult.drawAttemptCount,
        completedFrameCount: drawResult.completedFrameCount,
        drawCompleted: true,
        ...cleanupPatch
      }
    );
  }

  return deepFreeze({
    getPipelineStatus,
    executeOneFramePipeline,
    requestSecondFrame
  });
}
