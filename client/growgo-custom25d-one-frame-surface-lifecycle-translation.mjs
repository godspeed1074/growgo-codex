let ACTIVE_LIFECYCLE_TRANSLATION_TRACE = null;

function appendLifecycleTranslationTraceCall(trace, functionName, phase) {
  if (!trace) {
    return;
  }

  trace.lastFunction = functionName;
  trace.last100Calls.push(`${phase}:${functionName}`);
  if (trace.last100Calls.length > 100) {
    trace.last100Calls.shift();
  }
}

function traceLifecycleTranslationCall(functionName, callback) {
  const trace = ACTIVE_LIFECYCLE_TRANSLATION_TRACE;
  if (!trace) {
    return callback();
  }

  trace.previousFunction = trace.lastFunction;
  appendLifecycleTranslationTraceCall(trace, functionName, "enter");
  trace.currentDepth += 1;
  trace.maxDepth = Math.max(trace.maxDepth, trace.currentDepth);

  try {
    const result = callback();
    appendLifecycleTranslationTraceCall(trace, functionName, "exit");
    trace.currentDepth = Math.max(0, trace.currentDepth - 1);
    return result;
  } catch (error) {
    appendLifecycleTranslationTraceCall(trace, functionName, "throw");
    trace.currentDepth = Math.max(0, trace.currentDepth - 1);
    throw error;
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  return traceLifecycleTranslationCall("deepFreeze", () => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    if (seen.has(value)) {
      if (ACTIVE_LIFECYCLE_TRANSLATION_TRACE) {
        ACTIVE_LIFECYCLE_TRANSLATION_TRACE.recursionDetected = true;
        ACTIVE_LIFECYCLE_TRANSLATION_TRACE.overflowPrevented = true;
        ACTIVE_LIFECYCLE_TRANSLATION_TRACE.repeatedCallChain = [
          "translatePreparedSurfaceToLifecycleBundle",
          "createResult",
          "deepFreeze",
          "deepFreeze"
        ];
      }
      return value;
    }

    seen.add(value);
    for (const nested of Object.values(value)) {
      if (nested && typeof nested === "object") {
        deepFreeze(nested, seen);
      }
    }

    return Object.freeze(value);
  });
}

const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ONE_FRAME_SURFACE_LIFECYCLE_TRANSLATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ONE_FRAME_SURFACE_LIFECYCLE_TRANSLATION_RESULT_001";
const BUNDLE_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ONE_FRAME_LIFECYCLE_REGISTRATION_BUNDLE_001";
const OWNERSHIP_MODE = "ONE_FRAME_SURFACE_ONLY";
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

function isObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    translationStatus: "idle",
    translationAttemptCount: 0,
    surfaceValidated: false,
    lifecycleOwnerValidated: false,
    lifecycleRegistrationAttempted: false,
    lifecycleRegistrationSucceeded: false,
    ownershipMode: null,
    mapIdentityPreserved: false,
    paneIdentityPreserved: false,
    canvasIdentityPreserved: false,
    listenerOwnershipAbsent: false,
    retentionOwnershipAbsent: false,
    cleanupRequired: false,
    canvasRemovalRequired: false,
    paneRemovalEligible: false,
    permanentlyClosed: false,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realListenerAdded: false,
    retentionWritten: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    moduleLevelMapRetained: false,
    moduleLevelPaneRetained: false,
    moduleLevelCanvasRetained: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function freezeStatus(status) {
  return traceLifecycleTranslationCall("freezeStatus", () =>
    deepFreeze({
      ...status,
      canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
    })
  );
}

function createLifecycleTranslationTraceState() {
  return {
    entered: false,
    exited: false,
    currentDepth: 0,
    maxDepth: 0,
    last100Calls: [],
    repeatedCallChain: [],
    recursionDetected: false,
    overflowPrevented: false,
    lastFunction: null,
    previousFunction: null
  };
}

function snapshotLifecycleTranslationTrace(trace) {
  return deepFreeze({
    lifecycleTranslationTraceEntered: trace.entered,
    lifecycleTranslationTraceExited: trace.exited,
    lifecycleTranslationTraceCurrentDepth: trace.currentDepth,
    lifecycleTranslationTraceMaxDepth: trace.maxDepth,
    lifecycleTranslationTraceLast100Calls: [...trace.last100Calls],
    lifecycleTranslationRepeatedCallChain: [...trace.repeatedCallChain],
    lifecycleTranslationRecursionDetected: trace.recursionDetected,
    lifecycleTranslationOverflowPrevented: trace.overflowPrevented,
    lifecycleTranslationLastFunction: trace.lastFunction,
    lifecycleTranslationPreviousFunction: trace.previousFunction
  });
}

function createBundleSnapshot(bundle) {
  return traceLifecycleTranslationCall("createBundleSnapshot", () => {
    if (!bundle) {
      return null;
    }

    return deepFreeze({
      schemaId: bundle.schemaId,
      ownershipMode: bundle.ownershipMode,
      paneName: bundle.paneName,
      canvasClassName: bundle.canvasClassName,
      paneOwned: bundle.paneOwned,
      canvasOwned: bundle.canvasOwned,
      listenerOwned: bundle.listenerOwned,
      listenerEventNames: deepFreeze([...(bundle.listenerEventNames ?? [])]),
      listenerFunction: bundle.listenerFunction,
      redrawCallback: bundle.redrawCallback,
      retentionSlot: bundle.retentionSlot,
      retentionWritten: bundle.retentionWritten,
      retentionValue: bundle.retentionValue,
      retentionResetRequired: bundle.retentionResetRequired,
      cleanupRequired: bundle.cleanupRequired,
      canvasRemovalRequired: bundle.canvasRemovalRequired,
      paneRemovalEligible: bundle.paneRemovalEligible,
      unrelatedResourcesPreserved: bundle.unrelatedResourcesPreserved,
      automaticInvocation: false
    });
  });
}

function createResult({
  operation,
  outcome,
  reasonCode,
  status,
  lifecycleBundle = null
}) {
  return traceLifecycleTranslationCall("createResult", () =>
    deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      operation,
      outcome,
      reasonCode,
      translationStatus: status.translationStatus,
      surfaceValidated: status.surfaceValidated,
      lifecycleOwnerValidated: status.lifecycleOwnerValidated,
      ownershipMode: status.ownershipMode,
      mapIdentityPreserved: status.mapIdentityPreserved,
      paneIdentityPreserved: status.paneIdentityPreserved,
      canvasIdentityPreserved: status.canvasIdentityPreserved,
      listenerOwnershipAbsent: status.listenerOwnershipAbsent,
      retentionOwnershipAbsent: status.retentionOwnershipAbsent,
      cleanupRequired: status.cleanupRequired,
      canvasRemovalRequired: status.canvasRemovalRequired,
      paneRemovalEligible: status.paneRemovalEligible,
      lifecycleRegistrationAttempted: status.lifecycleRegistrationAttempted,
      lifecycleRegistrationSucceeded: status.lifecycleRegistrationSucceeded,
      realRendererInvoked: false,
      realDrawFunctionCalled: false,
      realCanvasCreated: false,
      realPaneCreated: false,
      realListenerAdded: false,
      retentionWritten: false,
      networkRequested: false,
      assetDownloadRequested: false,
      automaticInvocation: false,
      canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot,
      lifecycleBundleSnapshot: createBundleSnapshot(lifecycleBundle),
      lifecycleBundle
    })
  );
}

function validatePreparedSurface(preparedSurface) {
  if (!isObjectLike(preparedSurface)) {
    return "MISSING_PREPARED_SURFACE";
  }

  if (preparedSurface.schemaId !== SURFACE_SCHEMA_ID) {
    return "INVALID_SURFACE_SCHEMA";
  }

  if (preparedSurface.paneName !== EXACT_PANE_NAME) {
    return "INCORRECT_PANE_NAME";
  }

  if (preparedSurface.canvasClassName !== EXACT_CANVAS_CLASS_NAME) {
    return "INCORRECT_CANVAS_CLASS";
  }

  if (preparedSurface.canvasOwnedByOperation !== true) {
    return "CANVAS_NOT_OWNED";
  }

  if (preparedSurface.canvasAppended !== true) {
    return "CANVAS_NOT_APPENDED";
  }

  if (preparedSurface.cleanupRequired !== true) {
    return "CLEANUP_REQUIRED_FALSE";
  }

  if (preparedSurface.rollbackAvailable !== true) {
    return "ROLLBACK_UNAVAILABLE";
  }

  if (preparedSurface.listenerAdded === true) {
    return "LISTENER_ALREADY_ADDED";
  }

  if (preparedSurface.retentionWritten === true) {
    return "RETENTION_ALREADY_WRITTEN";
  }

  if (preparedSurface.drawRequested === true) {
    return "DRAW_ALREADY_REQUESTED";
  }

  if (!preparedSurface.map) {
    return "MISSING_MAP_REFERENCE";
  }

  if (!preparedSurface.pane) {
    return "MISSING_PANE_REFERENCE";
  }

  if (!preparedSurface.canvas) {
    return "MISSING_CANVAS_REFERENCE";
  }

  return null;
}

function validateLifecycleOwner(lifecycleOwner) {
  if (!isObjectLike(lifecycleOwner)) {
    return "MISSING_LIFECYCLE_OWNER";
  }

  if (typeof lifecycleOwner.registerOwnedResources !== "function") {
    return "INCOMPATIBLE_LIFECYCLE_OWNER_CONTRACT";
  }

  if (typeof lifecycleOwner.disposeOwnedResources !== "function") {
    return "INCOMPATIBLE_LIFECYCLE_OWNER_CONTRACT";
  }

  if (typeof lifecycleOwner.getLifecycleOwnerStatus !== "function") {
    return "INCOMPATIBLE_LIFECYCLE_OWNER_CONTRACT";
  }

  return null;
}

export function createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation({
  expectedPaneName = EXACT_PANE_NAME,
  expectedRetentionSlot = "custom25DMapLayer"
} = {}) {
  let status = freezeStatus(createInitialStatus());
  let lifecycleTranslationTrace = createLifecycleTranslationTraceState();

  function updateStatus(patch) {
    return traceLifecycleTranslationCall("updateStatus", () => {
      status = freezeStatus({
        ...status,
        ...patch
      });
      return status;
    });
  }

  function getTranslationStatus() {
    return status;
  }

  function getLifecycleTranslationTrace() {
    return snapshotLifecycleTranslationTrace(lifecycleTranslationTrace);
  }

  function buildClosedResult(reasonCode, patch = {}) {
    return traceLifecycleTranslationCall("buildClosedResult", () => {
      const nextStatus = updateStatus({
        translationAttemptCount: status.translationAttemptCount + 1,
        translationStatus: patch.translationStatus ?? "failed_closed",
        permanentlyClosed: true,
        ...patch
      });
      return createResult({
        operation: "translate_prepared_surface_to_lifecycle_bundle",
        outcome: "failed_closed",
        reasonCode,
        status: nextStatus
      });
    });
  }

  function translatePreparedSurfaceToLifecycleBundle({
    preparedSurface,
    lifecycleOwner
  } = {}) {
    lifecycleTranslationTrace = createLifecycleTranslationTraceState();
    ACTIVE_LIFECYCLE_TRANSLATION_TRACE = lifecycleTranslationTrace;
    lifecycleTranslationTrace.entered = true;

    try {
      return traceLifecycleTranslationCall(
        "translatePreparedSurfaceToLifecycleBundle",
        () => {
          if (status.permanentlyClosed) {
            const nextStatus = updateStatus({
              translationStatus: "blocked",
              permanentlyClosed: true
            });
            return createResult({
              operation: "translate_prepared_surface_to_lifecycle_bundle",
              outcome: "blocked",
              reasonCode: "TRANSLATOR_CLOSED",
              status: nextStatus
            });
          }

          const surfaceFailure = traceLifecycleTranslationCall(
            "validatePreparedSurface",
            () => validatePreparedSurface(preparedSurface)
          );
          if (surfaceFailure) {
            return buildClosedResult(surfaceFailure, {
              surfaceValidated: false,
              lifecycleOwnerValidated: false
            });
          }

          const ownerFailure = traceLifecycleTranslationCall(
            "validateLifecycleOwner",
            () => validateLifecycleOwner(lifecycleOwner)
          );
          if (ownerFailure) {
            return buildClosedResult(ownerFailure, {
              surfaceValidated: true,
              lifecycleOwnerValidated: false
            });
          }

          const lifecycleBundle = traceLifecycleTranslationCall(
            "createLifecycleBundle",
            () =>
              deepFreeze({
                schemaId: BUNDLE_SCHEMA_ID,
                ownershipMode: OWNERSHIP_MODE,
                map: preparedSurface.map,
                pane: preparedSurface.pane,
                canvas: preparedSurface.canvas,
                paneName: expectedPaneName,
                canvasClassName: EXACT_CANVAS_CLASS_NAME,
                paneOwned: preparedSurface.paneOwnedByOperation === true,
                canvasOwned: preparedSurface.canvasOwnedByOperation === true,
                listenerOwned: false,
                listenerEventNames: deepFreeze([]),
                listenerFunction: null,
                listener: null,
                redrawCallback: null,
                retentionSlot: expectedRetentionSlot,
                retentionSlotName: expectedRetentionSlot,
                retentionWritten: false,
                retentionValue: null,
                retentionResetRequired: false,
                clearRetentionSlot: null,
                cleanupRequired: true,
                canvasRemovalRequired: true,
                paneRemovalEligible: preparedSurface.paneOwnedByOperation === true,
                unrelatedResourcesPreserved: true,
                automaticInvocation: false,
                paneOwnershipProven: preparedSurface.paneOwnedByOperation === true
              })
          );

          let registrationResult;
          try {
            registrationResult = traceLifecycleTranslationCall(
              "lifecycleOwner.registerOwnedResources",
              () => lifecycleOwner.registerOwnedResources(lifecycleBundle)
            );
          } catch (error) {
            return buildClosedResult("LIFECYCLE_REGISTRATION_EXCEPTION", {
              surfaceValidated: true,
              lifecycleOwnerValidated: true,
              lifecycleRegistrationAttempted: true,
              ownershipMode: OWNERSHIP_MODE,
              mapIdentityPreserved: true,
              paneIdentityPreserved: true,
              canvasIdentityPreserved: true,
              listenerOwnershipAbsent: true,
              retentionOwnershipAbsent: true,
              cleanupRequired: true,
              canvasRemovalRequired: true,
              paneRemovalEligible: preparedSurface.paneOwnedByOperation === true
            });
          }

          if (
            !isObjectLike(registrationResult) ||
            registrationResult.outcome !== "registered"
          ) {
            return buildClosedResult(
              registrationResult?.reasonCode ?? "LIFECYCLE_REGISTRATION_FAILED",
              {
                surfaceValidated: true,
                lifecycleOwnerValidated: true,
                lifecycleRegistrationAttempted: true,
                lifecycleRegistrationSucceeded: false,
                ownershipMode: OWNERSHIP_MODE,
                mapIdentityPreserved: true,
                paneIdentityPreserved: true,
                canvasIdentityPreserved: true,
                listenerOwnershipAbsent: true,
                retentionOwnershipAbsent: true,
                cleanupRequired: true,
                canvasRemovalRequired: true,
                paneRemovalEligible: preparedSurface.paneOwnedByOperation === true
              }
            );
          }

          const nextStatus = updateStatus({
            translationAttemptCount: status.translationAttemptCount + 1,
            translationStatus: "translated",
            surfaceValidated: true,
            lifecycleOwnerValidated: true,
            lifecycleRegistrationAttempted: true,
            lifecycleRegistrationSucceeded: true,
            ownershipMode: OWNERSHIP_MODE,
            mapIdentityPreserved: true,
            paneIdentityPreserved: true,
            canvasIdentityPreserved: true,
            listenerOwnershipAbsent: true,
            retentionOwnershipAbsent: true,
            cleanupRequired: true,
            canvasRemovalRequired: true,
            paneRemovalEligible: preparedSurface.paneOwnedByOperation === true,
            permanentlyClosed: true
          });

          return createResult({
            operation: "translate_prepared_surface_to_lifecycle_bundle",
            outcome: "translated",
            reasonCode: "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED",
            status: nextStatus,
            lifecycleBundle
          });
        }
      );
    } finally {
      lifecycleTranslationTrace.exited = true;
      ACTIVE_LIFECYCLE_TRANSLATION_TRACE = null;
    }
  }

  return deepFreeze({
    getTranslationStatus,
    getLifecycleTranslationTrace,
    translatePreparedSurfaceToLifecycleBundle
  });
}
