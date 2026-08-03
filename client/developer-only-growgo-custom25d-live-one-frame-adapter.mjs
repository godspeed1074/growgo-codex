import { createGrowGoCustom25DLiveOneFrameSurfaceOperations } from "./growgo-custom25d-live-one-frame-surface-operations.mjs";
import { createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation } from "./growgo-custom25d-one-frame-surface-lifecycle-translation.mjs";
import { createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner } from "./developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs";
import { createGrowGoCustom25DLiveOneFrameDrawOperation } from "./growgo-custom25d-live-one-frame-draw-operation.mjs";

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
  "GROWGO_CUSTOM25D_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_RESULT_001";
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

function createInitialStatus({
  mapProviderAvailable,
  leafletProviderAvailable,
  surfaceOperationsAvailable,
  lifecycleTranslationAvailable,
  lifecycleOwnerAvailable,
  frameSnapshotBridgeAvailable,
  drawBridgeAvailable,
  drawOperationAvailable
}) {
  const adapterReady =
    mapProviderAvailable &&
    leafletProviderAvailable &&
    surfaceOperationsAvailable &&
    lifecycleTranslationAvailable &&
    lifecycleOwnerAvailable &&
    frameSnapshotBridgeAvailable &&
    drawBridgeAvailable &&
    drawOperationAvailable;

  return {
    schemaId: STATUS_SCHEMA_ID,
    adapterStatus: adapterReady ? "ready" : "blocked",
    reasonCode: adapterReady ? "ADAPTER_READY" : "ADAPTER_DEPENDENCY_MISSING",
    adapterReady,
    mapProviderAvailable,
    leafletProviderAvailable,
    surfaceOperationsAvailable,
    lifecycleTranslationAvailable,
    lifecycleOwnerAvailable,
    frameSnapshotBridgeAvailable,
    drawBridgeAvailable,
    drawOperationAvailable,
    liveInvocationPerformed: false,
    surfacePrepared: false,
    lifecycleRegistered: false,
    frameSnapshotCreated: false,
    drawAttemptCount: 0,
    completedFrameCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: false,
    permanentlyClosed: false,
    secondInvocationBlocked: false,
    ownershipMode: null,
    realCanvasCreated: false,
    realPaneCreated: false,
    realDrawFunctionCalled: false,
    realListenerAdded: false,
    retentionWritten: false,
    browserActivationExposed: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    cleanupFailureReasons: deepFreeze([...(status.cleanupFailureReasons ?? [])]),
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function createResult({ operation, outcome, reasonCode, status }) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation,
    outcome,
    reasonCode,
    adapterStatus: status.adapterStatus,
    adapterReady: status.adapterReady,
    mapProviderAvailable: status.mapProviderAvailable,
    leafletProviderAvailable: status.leafletProviderAvailable,
    surfaceOperationsAvailable: status.surfaceOperationsAvailable,
    lifecycleTranslationAvailable: status.lifecycleTranslationAvailable,
    lifecycleOwnerAvailable: status.lifecycleOwnerAvailable,
    frameSnapshotBridgeAvailable: status.frameSnapshotBridgeAvailable,
    drawBridgeAvailable: status.drawBridgeAvailable,
    drawOperationAvailable: status.drawOperationAvailable,
    liveInvocationPerformed: status.liveInvocationPerformed,
    surfacePrepared: status.surfacePrepared,
    lifecycleRegistered: status.lifecycleRegistered,
    frameSnapshotCreated: status.frameSnapshotCreated,
    drawAttemptCount: status.drawAttemptCount,
    completedFrameCount: status.completedFrameCount,
    cleanupAttemptCount: status.cleanupAttemptCount,
    cleanupCompleted: status.cleanupCompleted,
    cleanupFailed: status.cleanupFailed,
    cleanupFailureReasons: status.cleanupFailureReasons,
    referencesReleased: status.referencesReleased,
    permanentlyClosed: status.permanentlyClosed,
    secondInvocationBlocked: status.secondInvocationBlocked,
    ownershipMode: status.ownershipMode,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realListenerAdded: status.realListenerAdded,
    retentionWritten: status.retentionWritten,
    browserActivationExposed: status.browserActivationExposed,
    automaticInvocation: status.automaticInvocation,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

function defaultMapProvider() {
  return globalThis?.GrowGoDeveloperDiagnostics?.getGrowGoMap?.() ?? null;
}

function defaultLeafletProvider() {
  return globalThis?.L ?? null;
}

function defaultDevicePixelRatioProvider() {
  return globalThis?.devicePixelRatio;
}

function removeCanvasExact(canvas) {
  if (!canvas) {
    return;
  }

  if (typeof canvas.remove === "function") {
    canvas.remove();
    return;
  }

  if (canvas.parentNode && typeof canvas.parentNode.removeChild === "function") {
    canvas.parentNode.removeChild(canvas);
  }
}

function removePaneIfEmpty(pane) {
  const childCount = Number(
    pane?.childElementCount ??
      (Array.isArray(pane?.children) ? pane.children.length : NaN)
  );

  if (Number.isFinite(childCount) && childCount > 0) {
    return { ok: true, removed: false };
  }

  if (pane?.parentNode && typeof pane.parentNode.removeChild === "function") {
    pane.parentNode.removeChild(pane);
    return { ok: true, removed: true };
  }

  if (typeof pane?.remove === "function") {
    pane.remove();
    return { ok: true, removed: true };
  }

  return { ok: true, removed: false };
}

function defaultSurfaceOperationsFactory({
  leafletProvider,
  devicePixelRatioProvider
} = {}) {
  return createGrowGoCustom25DLiveOneFrameSurfaceOperations({
    leafletProvider,
    devicePixelRatioProvider
  });
}

function defaultLifecycleTranslationFactory() {
  return createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation();
}

function defaultLifecycleOwnerFactory() {
  return createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
    expectedPaneName: EXACT_PANE_NAME,
    expectedRetentionSlot: "custom25DMapLayer",
    removeCanvas: removeCanvasExact,
    removePaneIfEmpty
  });
}

function defaultFrameSnapshotBridgeProvider() {
  return (
    globalThis?.GrowGoDeveloperDiagnostics?.getCustom25DOneFrameBridge?.()
      ?.createCustom25DFrameViewportSnapshotForOneFrame ?? null
  );
}

function defaultDrawBridgeProvider() {
  return (
    globalThis?.GrowGoDeveloperDiagnostics?.getCustom25DOneFrameBridge?.()
      ?.drawCustom25DOneFrameFromSnapshot ?? null
  );
}

function defaultDrawOperationFactory({ drawFunctionProvider } = {}) {
  return createGrowGoCustom25DLiveOneFrameDrawOperation({
    drawFunctionProvider,
    operationIdGenerator: () => "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_ADAPTER_DRAW_001"
  });
}

function validateLeaflet(leaflet) {
  return (
    isObjectLike(leaflet) &&
    isObjectLike(leaflet.DomUtil) &&
    typeof leaflet.DomUtil.create === "function" &&
    typeof leaflet.DomUtil.setPosition === "function"
  );
}

function isSnapshotBridgeCompatibleMap(value) {
  return (
    isObjectLike(value) &&
    typeof value.getSize === "function" &&
    typeof value.getBounds === "function" &&
    typeof value.latLngToLayerPoint === "function" &&
    typeof value.getZoom === "function"
  );
}

function resolveSnapshotMapTarget(map) {
  const candidates = [
    map?.__growgoRawLeafletMap,
    map?.__rawLeafletMap,
    map?.rawLeafletMap,
    map?.leafletMap,
    map
  ];

  for (const candidate of candidates) {
    if (isSnapshotBridgeCompatibleMap(candidate)) {
      return candidate;
    }
  }

  return map;
}

function defaultSnapshotMapNormalizer(map) {
  const target = resolveSnapshotMapTarget(map);

  if (!isSnapshotBridgeCompatibleMap(target)) {
    return target;
  }

  const getSize = target.getSize.bind(target);
  const getBounds = target.getBounds.bind(target);
  const latLngToLayerPoint = target.latLngToLayerPoint.bind(target);
  const getZoom = target.getZoom.bind(target);

  return Object.freeze({
    getSize: () => getSize(),
    getBounds: () => getBounds(),
    latLngToLayerPoint: (coordinate) => latLngToLayerPoint(coordinate),
    getZoom: () => getZoom()
  });
}

function normalizeBridgeSnapshotResult(result) {
  if (
    isObjectLike(result) &&
    typeof result.outcome === "string" &&
    result.outcome !== "snapshot_created"
  ) {
    return {
      ok: false,
      reasonCode: result.reasonCode ?? "FRAME_SNAPSHOT_BRIDGE_BLOCKED",
      frameViewportSnapshot: null
    };
  }

  if (isObjectLike(result) && isObjectLike(result.frameViewportSnapshot)) {
    if (result.outcome && result.outcome !== "snapshot_created") {
      return {
        ok: false,
        reasonCode: result.reasonCode ?? "FRAME_SNAPSHOT_BRIDGE_BLOCKED",
        frameViewportSnapshot: null
      };
    }

    return {
      ok: true,
      reasonCode: result.reasonCode ?? "FRAME_VIEWPORT_SNAPSHOT_CREATED",
      frameViewportSnapshot: result.frameViewportSnapshot
    };
  }

  if (
    isObjectLike(result) &&
    Number.isFinite(Number(result.logicalWidth)) &&
    Number.isFinite(Number(result.logicalHeight)) &&
    Number.isFinite(Number(result.backingWidth)) &&
    Number.isFinite(Number(result.backingHeight)) &&
    Number.isFinite(Number(result.devicePixelRatio)) &&
    Number.isFinite(Number(result.zoom))
  ) {
    return {
      ok: true,
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
      frameViewportSnapshot: result
    };
  }

  return {
    ok: false,
    reasonCode: "INVALID_FRAME_SNAPSHOT_RESULT",
    frameViewportSnapshot: null
  };
}

function deriveCleanupPatch(cleanupResult) {
  const cleanupFailureReasons =
    cleanupResult?.cleanupFailureReasons ??
    cleanupResult?.status?.cleanupFailureReasons ??
    (typeof cleanupResult?.rollbackFailureReason === "string" &&
    cleanupResult.rollbackFailureReason
      ? [cleanupResult.rollbackFailureReason]
      : []);
  const normalizedFailureReasons = Array.isArray(cleanupFailureReasons)
    ? cleanupFailureReasons
    : [];

  const cleanupCompleted =
    cleanupResult?.cleanupCompleted === true ||
    cleanupResult?.status?.cleanupCompleted === true ||
    cleanupResult?.rollbackCompleted === true ||
    cleanupResult?.outcome === "rolled_back";

  const cleanupFailed =
    cleanupResult?.cleanupFailed === true ||
    cleanupResult?.status?.cleanupFailed === true ||
    cleanupResult?.outcome === "failed_closed" ||
    normalizedFailureReasons.length > 0;

  return {
    cleanupAttemptCount: cleanupResult ? 1 : 0,
    cleanupCompleted,
    cleanupFailed,
    cleanupFailureReasons: normalizedFailureReasons
  };
}

function firstMissingDependencyReason({
  mapProviderAvailable,
  leafletProviderAvailable,
  surfaceOperationsAvailable,
  lifecycleTranslationAvailable,
  lifecycleOwnerAvailable,
  frameSnapshotBridgeAvailable,
  drawBridgeAvailable,
  drawOperationAvailable
}) {
  if (!mapProviderAvailable) return "MISSING_MAP_PROVIDER";
  if (!leafletProviderAvailable) return "MISSING_LEAFLET_PROVIDER";
  if (!surfaceOperationsAvailable) return "MISSING_SURFACE_OPERATIONS_FACTORY";
  if (!lifecycleTranslationAvailable) return "MISSING_LIFECYCLE_TRANSLATION_FACTORY";
  if (!lifecycleOwnerAvailable) return "MISSING_LIFECYCLE_OWNER_FACTORY";
  if (!frameSnapshotBridgeAvailable) return "MISSING_FRAME_SNAPSHOT_BRIDGE_PROVIDER";
  if (!drawBridgeAvailable) return "MISSING_DRAW_BRIDGE_PROVIDER";
  if (!drawOperationAvailable) return "MISSING_DRAW_OPERATION_FACTORY";
  return "ADAPTER_DEPENDENCY_MISSING";
}

export function createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
  mapProvider = defaultMapProvider,
  leafletProvider = defaultLeafletProvider,
  devicePixelRatioProvider = defaultDevicePixelRatioProvider,
  surfaceOperationsFactory = defaultSurfaceOperationsFactory,
  lifecycleTranslationFactory = defaultLifecycleTranslationFactory,
  lifecycleOwnerFactory = defaultLifecycleOwnerFactory,
  frameSnapshotProvider = defaultFrameSnapshotBridgeProvider,
  drawFunctionProvider = defaultDrawBridgeProvider,
  drawOperationFactory = defaultDrawOperationFactory,
  snapshotMapNormalizer = defaultSnapshotMapNormalizer
} = {}) {
  const constructionFlags = {
    mapProviderAvailable: typeof mapProvider === "function",
    leafletProviderAvailable: typeof leafletProvider === "function",
    surfaceOperationsAvailable: typeof surfaceOperationsFactory === "function",
    lifecycleTranslationAvailable:
      typeof lifecycleTranslationFactory === "function",
    lifecycleOwnerAvailable: typeof lifecycleOwnerFactory === "function",
    frameSnapshotBridgeAvailable: typeof frameSnapshotProvider === "function",
    drawBridgeAvailable: typeof drawFunctionProvider === "function",
    drawOperationAvailable: typeof drawOperationFactory === "function"
  };

  let status = freezeStatus(createInitialStatus(constructionFlags));
  let currentRefs = {
    map: null,
    surface: null,
    lifecycleOwner: null,
    frameViewportSnapshot: null,
    drawOperation: null,
    deferredCleanupPending: false
  };

  function clearRefs() {
    currentRefs = {
      map: null,
      surface: null,
      lifecycleOwner: null,
      frameViewportSnapshot: null,
      drawOperation: null,
      deferredCleanupPending: false
    };
  }

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getAdapterStatus() {
    return status;
  }

  function finalize(operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus({
      ...patch,
      adapterStatus:
        patch.adapterStatus ??
        (outcome === "completed"
          ? "completed"
          : outcome === "blocked"
            ? "blocked"
            : "failed_closed"),
      reasonCode,
      referencesReleased: true,
      permanentlyClosed: true
    });

    clearRefs();

    return createResult({
      operation,
      outcome,
      reasonCode,
      status: nextStatus
    });
  }

  function blockSecondInvocation() {
    return createResult({
      operation: "execute_developer_only_live_one_frame_adapter",
      outcome: "blocked",
      reasonCode: "ADAPTER_ALREADY_CLOSED",
      status: updateStatus({
        adapterStatus: "blocked",
        secondInvocationBlocked: true,
        reasonCode: "ADAPTER_ALREADY_CLOSED"
      })
    });
  }

  function finalizeDeferredCleanup() {
    if (!currentRefs.deferredCleanupPending || !currentRefs.lifecycleOwner) {
      return createResult({
        operation: "complete_deferred_live_one_frame_cleanup",
        outcome: "blocked",
        reasonCode: "DEFERRED_CLEANUP_NOT_PENDING",
        status: updateStatus({
          adapterStatus: status.permanentlyClosed ? status.adapterStatus : "blocked",
          reasonCode: "DEFERRED_CLEANUP_NOT_PENDING"
        })
      });
    }

    let cleanupResult;
    try {
      cleanupResult = currentRefs.lifecycleOwner.disposeOwnedResources();
    } catch (error) {
      cleanupResult = {
        outcome: "failed_closed",
        reasonCode: toReasonCode(error, "DEFERRED_CLEANUP_EXCEPTION"),
        cleanupFailureReasons: [toReasonCode(error, "DEFERRED_CLEANUP_EXCEPTION")]
      };
    }

    const cleanupPatch = deriveCleanupPatch(cleanupResult);
    const finalReasonCode = cleanupPatch.cleanupFailed
      ? cleanupPatch.cleanupFailureReasons[0] ?? "CLEANUP_FAILED"
      : "LIVE_ONE_FRAME_DRAW_COMPLETED";

    currentRefs.deferredCleanupPending = false;

    return finalize(
      "complete_deferred_live_one_frame_cleanup",
      cleanupPatch.cleanupFailed ? "failed_closed" : "completed",
      finalReasonCode,
      {
        ...cleanupPatch,
        referencesReleased: true,
        permanentlyClosed: true,
        adapterStatus: cleanupPatch.cleanupFailed
          ? "failed_closed"
          : "completed"
      }
    );
  }

  function executeDeveloperOnlyLiveOneFrameAdapter(options = {}) {
    const deferCleanupUntilRelease =
      isObjectLike(options) && options.deferCleanupUntilRelease === true;

    if (status.permanentlyClosed || currentRefs.deferredCleanupPending) {
      return blockSecondInvocation();
    }

    updateStatus({
      liveInvocationPerformed: true,
      adapterStatus: "executing",
      reasonCode: status.adapterReady
        ? "EXECUTION_STARTED"
        : firstMissingDependencyReason(constructionFlags)
    });

    if (!status.adapterReady) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        firstMissingDependencyReason(constructionFlags),
        {
          liveInvocationPerformed: true
        }
      );
    }

    let map = null;
    let leaflet = null;
    let surfaceOperations = null;
    let lifecycleTranslation = null;
    let lifecycleOwner = null;
    let snapshotBridge = null;
    let drawBridge = null;
    let drawOperation = null;
    let frameViewportSnapshot = null;
    let snapshotCompatibleMap = null;
    let surfaceResult = null;
    let translationResult = null;
    let drawResult = null;
    let lifecycleRegistered = false;

    try {
      map = mapProvider();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "MAP_PROVIDER_EXCEPTION")
      );
    }

    if (!map) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "MAP_UNAVAILABLE"
      );
    }

    try {
      leaflet = leafletProvider();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "LEAFLET_PROVIDER_EXCEPTION")
      );
    }

    if (!validateLeaflet(leaflet)) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LEAFLET_PROVIDER_INVALID"
      );
    }

    try {
      surfaceOperations = surfaceOperationsFactory({
        leafletProvider: leaflet,
        devicePixelRatioProvider
      });
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SURFACE_OPERATIONS_FACTORY_EXCEPTION")
      );
    }

    if (
      !surfaceOperations ||
      typeof surfaceOperations.prepareOneFrameSurface !== "function" ||
      typeof surfaceOperations.rollbackPreparedSurface !== "function"
    ) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "SURFACE_OPERATIONS_UNAVAILABLE"
      );
    }

    try {
      lifecycleTranslation = lifecycleTranslationFactory();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "LIFECYCLE_TRANSLATION_FACTORY_EXCEPTION")
      );
    }

    if (
      !lifecycleTranslation ||
      typeof lifecycleTranslation.translatePreparedSurfaceToLifecycleBundle !==
        "function"
    ) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LIFECYCLE_TRANSLATION_UNAVAILABLE"
      );
    }

    try {
      lifecycleOwner = lifecycleOwnerFactory();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "LIFECYCLE_OWNER_FACTORY_EXCEPTION")
      );
    }

    if (
      !lifecycleOwner ||
      typeof lifecycleOwner.registerOwnedResources !== "function" ||
      typeof lifecycleOwner.disposeOwnedResources !== "function"
    ) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LIFECYCLE_OWNER_UNAVAILABLE"
      );
    }

    try {
      snapshotBridge = frameSnapshotProvider();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "FRAME_SNAPSHOT_BRIDGE_PROVIDER_EXCEPTION")
      );
    }

    if (typeof snapshotBridge !== "function") {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "FRAME_SNAPSHOT_BRIDGE_UNAVAILABLE"
      );
    }

    try {
      drawBridge = drawFunctionProvider();
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "DRAW_BRIDGE_PROVIDER_EXCEPTION")
      );
    }

    if (typeof drawBridge !== "function") {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "DRAW_BRIDGE_UNAVAILABLE"
      );
    }

    let activeFrameViewportSnapshot = null;

    try {
      drawOperation = drawOperationFactory({
        drawFunctionProvider: () => ({ surface, canvas }) =>
          drawBridge({
            canvas,
            frameViewportSnapshot: activeFrameViewportSnapshot,
            surface
          })
      });
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "DRAW_OPERATION_FACTORY_EXCEPTION")
      );
    }

    if (
      !drawOperation ||
      typeof drawOperation.drawPreparedSurfaceExactlyOnce !== "function"
    ) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "DRAW_OPERATION_UNAVAILABLE"
      );
    }

    currentRefs.map = map;
    currentRefs.lifecycleOwner = lifecycleOwner;
    currentRefs.drawOperation = drawOperation;

    try {
      surfaceResult = surfaceOperations.prepareOneFrameSurface({ map });
    } catch (error) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SURFACE_PREPARATION_EXCEPTION")
      );
    }

    if (surfaceResult?.outcome !== "prepared" || !surfaceResult?.surface) {
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        surfaceResult?.reasonCode ?? "SURFACE_PREPARATION_FAILED"
      );
    }

    currentRefs.surface = surfaceResult.surface;
    updateStatus({
      surfacePrepared: true
    });

    try {
      translationResult =
        lifecycleTranslation.translatePreparedSurfaceToLifecycleBundle({
          preparedSurface: surfaceResult.surface,
          lifecycleOwner
        });
    } catch (error) {
      translationResult = {
        outcome: "failed_closed",
        reasonCode: toReasonCode(error, "LIFECYCLE_TRANSLATION_EXCEPTION")
      };
    }

    lifecycleRegistered =
      translationResult?.lifecycleRegistrationSucceeded === true ||
      translationResult?.lifecycleRegistrationAttempted === true;

    if (translationResult?.outcome !== "translated" || !translationResult?.lifecycleBundle) {
      const rollbackResult = surfaceOperations.rollbackPreparedSurface({
        surface: surfaceResult.surface
      });

      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED",
        {
          surfacePrepared: true,
          lifecycleRegistered: false,
          ownershipMode:
            translationResult?.ownershipMode ??
            translationResult?.lifecycleBundleSnapshot?.ownershipMode ??
            null,
          ...deriveCleanupPatch(rollbackResult)
        }
      );
    }

    updateStatus({
      lifecycleRegistered: true,
      ownershipMode:
        translationResult.lifecycleBundle.ownershipMode ??
        translationResult.ownershipMode ??
        "ONE_FRAME_SURFACE_ONLY"
    });

    let snapshotBridgeResult;
    try {
      snapshotCompatibleMap = snapshotMapNormalizer(map);
    } catch (error) {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SNAPSHOT_MAP_NORMALIZATION_EXCEPTION"),
        {
          surfacePrepared: true,
          lifecycleRegistered: true,
          frameSnapshotCreated: false,
          ownershipMode:
            translationResult.lifecycleBundle.ownershipMode ?? "ONE_FRAME_SURFACE_ONLY",
          ...deriveCleanupPatch(cleanupResult)
        }
      );
    }

    try {
      snapshotBridgeResult = snapshotBridge({
        map: snapshotCompatibleMap,
        canvas: surfaceResult.surface.canvas
      });
    } catch (error) {
      snapshotBridgeResult = {
        outcome: "failed_closed",
        reasonCode: toReasonCode(error, "FRAME_SNAPSHOT_BRIDGE_EXCEPTION")
      };
    }

    const normalizedSnapshot =
      normalizeBridgeSnapshotResult(snapshotBridgeResult);

    if (!normalizedSnapshot.ok) {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        normalizedSnapshot.reasonCode,
        {
          surfacePrepared: true,
          lifecycleRegistered: true,
          frameSnapshotCreated: false,
          ownershipMode:
            translationResult.lifecycleBundle.ownershipMode ?? "ONE_FRAME_SURFACE_ONLY",
          ...deriveCleanupPatch(cleanupResult)
        }
      );
    }

    frameViewportSnapshot = normalizedSnapshot.frameViewportSnapshot;
    activeFrameViewportSnapshot = frameViewportSnapshot;
    currentRefs.frameViewportSnapshot = frameViewportSnapshot;

    updateStatus({
      frameSnapshotCreated: true
    });

    drawResult = drawOperation.drawPreparedSurfaceExactlyOnce({
      surface: surfaceResult.surface,
      canvas: surfaceResult.surface.canvas
    });

    const drawReasonCode = drawResult?.reasonCode ?? "DRAW_OPERATION_FAILED";

    if (drawResult?.outcome !== "completed") {
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      const cleanupPatch = deriveCleanupPatch(cleanupResult);
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        drawReasonCode,
        {
          surfacePrepared: true,
          lifecycleRegistered: true,
          frameSnapshotCreated: true,
          drawAttemptCount: drawResult?.drawAttemptCount ?? 1,
          completedFrameCount: drawResult?.completedFrameCount ?? 0,
          ownershipMode:
            translationResult.lifecycleBundle.ownershipMode ?? "ONE_FRAME_SURFACE_ONLY",
          ...cleanupPatch
        }
      );
    }

    if (deferCleanupUntilRelease) {
      currentRefs.deferredCleanupPending = true;
      const pendingStatus = updateStatus({
        surfacePrepared: true,
        lifecycleRegistered: true,
        frameSnapshotCreated: true,
        drawAttemptCount: drawResult?.drawAttemptCount ?? 1,
        completedFrameCount: drawResult?.completedFrameCount ?? 1,
        ownershipMode:
          translationResult.lifecycleBundle.ownershipMode ?? "ONE_FRAME_SURFACE_ONLY",
        adapterStatus: "awaiting_cleanup_release",
        reasonCode: "DEFERRED_CLEANUP_PENDING"
      });

      return createResult({
        operation: "execute_developer_only_live_one_frame_adapter",
        outcome: "pending_cleanup",
        reasonCode: "DEFERRED_CLEANUP_PENDING",
        status: pendingStatus
      });
    }

    const cleanupResult = lifecycleOwner.disposeOwnedResources();
    const cleanupPatch = deriveCleanupPatch(cleanupResult);
    const finalReasonCode = cleanupPatch.cleanupFailed
      ? cleanupPatch.cleanupFailureReasons[0] ?? "CLEANUP_FAILED"
      : drawReasonCode;

    return finalize(
      "execute_developer_only_live_one_frame_adapter",
      cleanupPatch.cleanupFailed ? "failed_closed" : "completed",
      finalReasonCode,
      {
        surfacePrepared: true,
        lifecycleRegistered: true,
        frameSnapshotCreated: true,
        drawAttemptCount: drawResult?.drawAttemptCount ?? 1,
        completedFrameCount: drawResult?.completedFrameCount ?? 1,
        ownershipMode:
          translationResult.lifecycleBundle.ownershipMode ?? "ONE_FRAME_SURFACE_ONLY",
        ...cleanupPatch
      }
    );
  }

  return deepFreeze({
    getAdapterStatus,
    executeDeveloperOnlyLiveOneFrameAdapter,
    completeDeferredCleanup: finalizeDeferredCleanup
  });
}
