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
const ADAPTER_VERSION_TAG = "atlas21150x";
const ADAPTER_SOURCE_TAG =
  "client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150x";
const MODULE_LOAD_TIMESTAMP = new Date().toISOString();

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

function describeMapObjectType(value) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  const valueType = typeof value;
  if (valueType !== "object") {
    return valueType;
  }

  const constructorName =
    typeof value?.constructor?.name === "string" && value.constructor.name.trim()
      ? value.constructor.name.trim()
      : "Object";

  return `object:${constructorName}`;
}

function readRuntimeOneFrameBridgeNamespace() {
  const namespace = globalThis?.GrowGoDeveloperDiagnostics;
  return namespace && typeof namespace === "object" ? namespace : null;
}

function resolveRuntimeOneFrameBridge() {
  const namespace = readRuntimeOneFrameBridgeNamespace();
  const bridgeGetter = namespace?.getCustom25DOneFrameBridge;
  const bridgeDebugGetter = namespace?.getCustom25DOneFrameBridgeDebug;

  if (typeof bridgeGetter !== "function") {
    return {
      bridgeAvailable: false,
      bridge: null,
      bridgeSource: null,
      hasRawLeafletMapReference: false,
      adapterReceivedBridge: false,
      adapterBridgeResolutionFunction: "adapter.resolveRuntimeOneFrameBridge"
    };
  }

  const bridge = bridgeGetter.call(namespace) ?? null;
  const debug =
    typeof bridgeDebugGetter === "function" ? bridgeDebugGetter.call(namespace) : null;

  return {
    bridgeAvailable: !!bridge && typeof bridge === "object",
    bridge,
    bridgeSource:
      (typeof debug?.bridgeSource === "string" && debug.bridgeSource) ||
      "UNKNOWN_BRIDGE_SOURCE",
    hasRawLeafletMapReference: !!bridge?.rawLeafletMapReference,
    adapterReceivedBridge: !!bridge && typeof bridge === "object",
    adapterBridgeResolutionFunction: "adapter.resolveRuntimeOneFrameBridge"
  };
}

function resolveInjectedRuntimeOneFrameBridge(options = {}) {
  const injectedBridge = options?.bridge ?? null;
  const injectedBridgeSource =
    typeof options?.bridgeSource === "string" && options.bridgeSource
      ? options.bridgeSource
      : null;
  const injectedHasRawLeafletMapReference =
    options?.hasRawLeafletMapReference === true ||
    !!injectedBridge?.rawLeafletMapReference;

  return {
    bridgeAvailable: !!injectedBridge && typeof injectedBridge === "object",
    bridge: injectedBridge,
    bridgeSource: injectedBridgeSource,
    hasRawLeafletMapReference: injectedHasRawLeafletMapReference,
    adapterReceivedBridge: !!injectedBridge && typeof injectedBridge === "object",
    adapterBridgeResolutionFunction: "adapter.resolveInjectedRuntimeOneFrameBridge"
  };
}

function traceSafariSnapshotRuntime(functionName, callback) {
  const trace = globalThis?.__GROWGO_ATLAS_ONE_FRAME_TRACE__;

  if (
    !trace ||
    typeof trace.enter !== "function" ||
    typeof trace.exit !== "function"
  ) {
    return callback();
  }

  trace.enter(functionName);
  try {
    return callback();
  } finally {
    trace.exit(functionName);
  }
}

function readInvocationBoundaryTrace() {
  const trace = globalThis?.__GROWGO_ATLAS_ONE_FRAME_INVOCATION_BOUNDARY_TRACE__;

  if (
    !trace ||
    typeof trace.enter !== "function" ||
    typeof trace.exit !== "function" ||
    typeof trace.exception !== "function"
  ) {
    return null;
  }

  return trace;
}

function markInvocationBoundaryMilestone(milestoneName) {
  const trace = readInvocationBoundaryTrace();
  if (trace && typeof trace.mark === "function") {
    trace.mark(milestoneName);
  }
}

function traceInvocationBoundary(functionName, callback, detail = null) {
  const trace = readInvocationBoundaryTrace();

  if (!trace) {
    return callback();
  }

  trace.enter(functionName, detail);
  try {
    const result = callback();
    trace.exit(functionName, detail);
    return result;
  } catch (error) {
    trace.exception(functionName, error, detail);
    throw error;
  }
}

function readSnapshotHandoffTrace() {
  const trace = globalThis?.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__;

  if (
    !trace ||
    typeof trace.enter !== "function" ||
    typeof trace.exit !== "function" ||
    typeof trace.exception !== "function"
  ) {
    return null;
  }

  return trace;
}

function readPreSnapshotHandoffTrace() {
  const trace = globalThis?.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;

  if (
    !trace ||
    typeof trace.enter !== "function" ||
    typeof trace.exit !== "function" ||
    typeof trace.exception !== "function" ||
    typeof trace.update !== "function"
  ) {
    return null;
  }

  return trace;
}

function updatePreSnapshotHandoffTrace(patch = {}) {
  const trace = readPreSnapshotHandoffTrace();
  if (trace) {
    trace.update(patch);
  }
}

function tracePreSnapshotHandoff(functionName, callback, detail = null) {
  const trace = readPreSnapshotHandoffTrace();

  if (!trace) {
    return callback();
  }

  trace.enter(functionName, detail);
  try {
    const result = callback();
    trace.exit(functionName, detail);
    return result;
  } catch (error) {
    trace.exception(functionName, error, detail);
    throw error;
  }
}

function markAdapterPostCallbackTrace(patch = {}) {
  updatePreSnapshotHandoffTrace({
    adapterPostCallbackResolutionNextStep: null,
    adapterEarlyReturnReason: null,
    adapterExecutionCompletionReason: null,
    ...patch
  });
}

function describeValueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") {
    return `object:${value?.constructor?.name ?? "Object"}`;
  }
  return typeof value;
}

function markSnapshotHandoffMilestone(milestoneName) {
  const trace = readSnapshotHandoffTrace();
  if (trace && typeof trace.mark === "function") {
    trace.mark(milestoneName);
  }
}

function traceSnapshotHandoff(functionName, callback, detail = null) {
  const trace = readSnapshotHandoffTrace();

  if (!trace) {
    return callback();
  }

  trace.enter(functionName, detail);
  try {
    const result = callback();
    trace.exit(functionName, detail);
    return result;
  } catch (error) {
    trace.exception(functionName, error, detail);
    throw error;
  }
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
    hasBridge: frameSnapshotBridgeAvailable,
    adapterBridgeAvailable: false,
    commandBridgeAvailable: false,
    bridgeSource: null,
    adapterReceivedBridge: false,
    adapterBridgeResolutionFunction: null,
    hasRawLeafletMapReference: false,
    mapObjectType: "unresolved",
    mapValidationResult: "unresolved",
    mapValidationFailureReason: null,
    mapAvailabilityFailureFunction: null,
    surfacePreparationInputReady: false,
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
    hasBridge: status.hasBridge,
    adapterBridgeAvailable: status.adapterBridgeAvailable,
    commandBridgeAvailable: status.commandBridgeAvailable,
    bridgeSource: status.bridgeSource,
    adapterReceivedBridge: status.adapterReceivedBridge,
    adapterBridgeResolutionFunction: status.adapterBridgeResolutionFunction,
    hasRawLeafletMapReference: status.hasRawLeafletMapReference,
    mapObjectType: status.mapObjectType,
    mapValidationResult: status.mapValidationResult,
    mapValidationFailureReason: status.mapValidationFailureReason,
    mapAvailabilityFailureFunction: status.mapAvailabilityFailureFunction,
    surfacePreparationInputReady: status.surfacePreparationInputReady,
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
  return traceSafariSnapshotRuntime("devicePixelRatioProvider", () =>
    globalThis?.devicePixelRatio
  );
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
  return traceSafariSnapshotRuntime("resolveSnapshotMapTarget", () => {
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
  });
}

function defaultSnapshotMapNormalizer(map) {
  return traceSafariSnapshotRuntime("defaultSnapshotMapNormalizer", () => {
    const target = resolveSnapshotMapTarget(map);

    if (!isSnapshotBridgeCompatibleMap(target)) {
      return target;
    }

    const getSize = target.getSize.bind(target);
    const getBounds = target.getBounds.bind(target);
    const latLngToLayerPoint = target.latLngToLayerPoint.bind(target);
    const getZoom = target.getZoom.bind(target);

    return Object.freeze({
      getSize: () =>
        traceSafariSnapshotRuntime("normalizedSnapshotMap.getSize", () =>
          getSize()
        ),
      getBounds: () =>
        traceSafariSnapshotRuntime("normalizedSnapshotMap.getBounds", () =>
          getBounds()
        ),
      latLngToLayerPoint: (coordinate) =>
        traceSafariSnapshotRuntime(
          "normalizedSnapshotMap.latLngToLayerPoint",
          () => latLngToLayerPoint(coordinate)
        ),
      getZoom: () =>
        traceSafariSnapshotRuntime("normalizedSnapshotMap.getZoom", () =>
          getZoom()
        )
    });
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

function resolveRuntimeRawLeafletMapReference({
  rawLeafletMapReference,
  rawLeafletMapProvider,
  runtimeBridge
} = {}) {
  if (rawLeafletMapReference !== undefined && rawLeafletMapReference !== null) {
    return {
      ok: true,
      map: rawLeafletMapReference,
      source: "rawLeafletMapReference",
      error: null
    };
  }

  if (runtimeBridge?.rawLeafletMapReference) {
    return {
      ok: true,
      map: runtimeBridge.rawLeafletMapReference,
      source: "runtimeBridge.rawLeafletMapReference",
      error: null
    };
  }

  if (typeof rawLeafletMapProvider !== "function") {
    return {
      ok: true,
      map: null,
      source: "rawLeafletMapProvider",
      error: null
    };
  }

  try {
    return {
      ok: true,
      map: rawLeafletMapProvider(),
      source: "rawLeafletMapProvider",
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      map: null,
      source: "rawLeafletMapProvider",
      error
    };
  }
}

export function createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
  mapProvider = defaultMapProvider,
  rawLeafletMapProvider = mapProvider,
  rawLeafletMapReference,
  leafletProvider = defaultLeafletProvider,
  devicePixelRatioProvider = defaultDevicePixelRatioProvider,
  surfaceOperationsFactory = defaultSurfaceOperationsFactory,
  lifecycleTranslationFactory = defaultLifecycleTranslationFactory,
  lifecycleOwnerFactory = defaultLifecycleOwnerFactory,
  frameSnapshotProvider = defaultFrameSnapshotBridgeProvider,
  drawFunctionProvider = defaultDrawBridgeProvider,
  drawOperationFactory = defaultDrawOperationFactory,
  snapshotMapNormalizer = defaultSnapshotMapNormalizer,
  postDrawOperationContinuationHooks = null,
  postLifecycleOwnerContinuationHooks = null
} = {}) {
  const constructionFlags = {
    mapProviderAvailable:
      rawLeafletMapReference !== undefined ||
      typeof rawLeafletMapProvider === "function",
    leafletProviderAvailable: typeof leafletProvider === "function",
    surfaceOperationsAvailable: typeof surfaceOperationsFactory === "function",
    lifecycleTranslationAvailable:
      typeof lifecycleTranslationFactory === "function",
    lifecycleOwnerAvailable: typeof lifecycleOwnerFactory === "function",
    frameSnapshotBridgeAvailable: typeof frameSnapshotProvider === "function",
    drawBridgeAvailable: typeof drawFunctionProvider === "function",
    drawOperationAvailable: typeof drawOperationFactory === "function"
  };
  const runtimeIdentity = deepFreeze({
    adapterVersionTag: ADAPTER_VERSION_TAG,
    adapterSourceTag: ADAPTER_SOURCE_TAG,
    moduleLoadTimestamp: MODULE_LOAD_TIMESTAMP,
    postCallbackTraceFieldsInstalled: true
  });
  let executionIdentityState = {
    adapterExecuteFunctionName: "executeDeveloperOnlyLiveOneFrameAdapter",
    adapterExecuteFunctionSourceTag: ADAPTER_SOURCE_TAG,
    postCallbackInstrumentationWrapperEntered: false,
    payloadAssemblyInstrumentationEntered: false,
    activeAdapterFunctionReferenceMatchesInstrumentedModuleExport: true,
    adapterEntryReached: false,
    adapterEntryFunctionName: "executeDeveloperOnlyLiveOneFrameAdapter",
    adapterEntryReturnPath: null,
    adapterEarlyReturnReason: null,
    nextFunctionAfterAdapterEntry: null,
    bridgeResolutionStarted: false,
    snapshotBridgeResolutionStarted: false,
    drawBridgeResolutionStarted: false,
    postCallbackWrapperNextFunction: null,
    postCallbackWrapperExitReason: null,
    payloadAssemblyGuardEvaluated: false,
    payloadAssemblyGuardResult: null,
    payloadAssemblySkippedReason: null,
    createDrawOperationEntered: false,
    createDrawOperationFunctionName: "adapter.createDrawOperation",
    createDrawOperationFactoryAvailable: false,
    createDrawOperationFactoryCallable: false,
    createDrawOperationInputCanvasPresent: false,
    createDrawOperationInputMapPresent: false,
    createDrawOperationInputDrawCallbackPresent: false,
    createDrawOperationReturned: false,
    createDrawOperationResultType: null,
    createDrawOperationFailureReason: null,
    createDrawOperationLastFunction: null,
    createDrawOperationPreviousFunction: null,
    createDrawOperationExceptionName: null,
    createDrawOperationExceptionMessage: null,
    createDrawOperationExceptionReasonCode: null,
    createDrawOperationSelfCallDetected: false,
    createDrawOperationExecuteFunctionCallDetected: false,
    createDrawOperationDiagnosticsNamespaceCallDetected: false,
    createDrawOperationSnapshotBridgeCallDetected: false,
    createDrawOperationDrawBridgeResolverCallDetected: false,
    createDrawOperationLifecycleTranslationCallDetected: false,
    postDrawOperationContinuationEntered: false,
    drawOperationLocalAssignmentAttempted: false,
    drawOperationLocalAssignmentCompleted: false,
    currentRefsMapAssignmentAttempted: false,
    currentRefsMapAssignmentCompleted: false,
    currentRefsLifecycleOwnerAssignmentAttempted: false,
    currentRefsLifecycleOwnerAssignmentCompleted: false,
    currentRefsDrawOperationAssignmentAttempted: false,
    currentRefsDrawOperationAssignmentCompleted: false,
    prepareOneFrameSurfaceSelected: false,
    prepareOneFrameSurfaceCallAttempted: false,
    prepareOneFrameSurfaceCallEntered: false,
    prepareOneFrameSurfaceCallReturned: false,
    prepareOneFrameSurfaceResultType: null,
    surfacePreparationInputReadyStatusWriteAttempted: false,
    surfacePreparationInputReadyStatusWriteCompleted: false,
    postDrawOperationLastCompletedStep: null,
    postDrawOperationNextExpectedStep: null,
    postDrawOperationFailureFunction: null,
    postDrawOperationExceptionName: null,
    postDrawOperationExceptionMessage: null,
    postDrawOperationExceptionReasonCode: null,
    postDrawOperationPropertySetterInvoked: false,
    postDrawOperationProxyTrapInvoked: false,
    postDrawOperationGetterInvoked: false,
    postDrawOperationDiagnosticsLookupInvoked: false,
    postDrawOperationRecursiveCallbackInvoked: false,
    preparedSurfaceLocalAssignmentAttempted: false,
    preparedSurfaceLocalAssignmentCompleted: false,
    preparedSurfacePresent: false,
    preparedSurfaceType: null,
    preparedSurfaceKeys: null,
    preparedSurfaceStatusReadAttempted: false,
    preparedSurfaceStatusReadCompleted: false,
    preparedSurfaceStatusValue: null,
    preparedSurfaceReasonReadAttempted: false,
    preparedSurfaceReasonReadCompleted: false,
    preparedSurfaceReasonValue: null,
    preparedSurfaceCanvasReadAttempted: false,
    preparedSurfaceCanvasReadCompleted: false,
    preparedSurfaceCanvasPresent: false,
    preparedSurfaceMapReadAttempted: false,
    preparedSurfaceMapReadCompleted: false,
    preparedSurfaceMapPresent: false,
    preparedSurfaceLifecycleOwnerReadAttempted: false,
    preparedSurfaceLifecycleOwnerReadCompleted: false,
    preparedSurfaceLifecycleOwnerPresent: false,
    preparedSurfaceLifecycleOwnerSource: null,
    preparedSurfaceLifecycleOwnerPropertyName: null,
    preparedSurfaceNestedLifecycleOwnerPresent: false,
    currentRefsLifecycleOwnerPresentAfterSurfacePreparation: false,
    payloadLifecycleOwnerResolved: false,
    payloadLifecycleOwnerResolutionSource: null,
    payloadLifecycleOwnerResolutionFailureReason: null,
    resolvedLifecycleOwnerLocalAssignmentAttempted: false,
    resolvedLifecycleOwnerLocalAssignmentCompleted: false,
    resolvedLifecycleOwnerMatchesCurrentRefs: false,
    resolvedLifecycleOwnerIdentityType: null,
    postLifecycleOwnerContinuationEntered: false,
    postLifecycleOwnerNextFunction: null,
    payloadEntryMarkerWriteAttempted: false,
    payloadEntryMarkerWriteCompleted: false,
    payloadContextConstructorSelected: false,
    payloadContextConstructorEntered: false,
    payloadContextConstructorReturned: false,
    payloadContextConstructorResultType: null,
    postLifecycleOwnerLastCompletedStep: null,
    postLifecycleOwnerNextExpectedStep: null,
    postLifecycleOwnerFailureFunction: null,
    postLifecycleOwnerExceptionName: null,
    postLifecycleOwnerExceptionMessage: null,
    postLifecycleOwnerExceptionReasonCode: null,
    postLifecycleOwnerGetterInvoked: false,
    postLifecycleOwnerSetterInvoked: false,
    postLifecycleOwnerProxyTrapInvoked: false,
    postLifecycleOwnerRecursiveCallbackInvoked: false,
    postLifecycleOwnerDiagnosticsLookupInvoked: false,
    payloadAssemblyEntryAttempted: false,
    payloadAssemblyEntryCompleted: false,
    preparedSurfaceContinuationLastCompletedStep: null,
    preparedSurfaceContinuationNextExpectedStep: null,
    preparedSurfaceContinuationFailureFunction: null,
    preparedSurfaceContinuationExceptionName: null,
    preparedSurfaceContinuationExceptionMessage: null,
    preparedSurfaceContinuationExceptionReasonCode: null,
    preparedSurfaceGetterInvoked: false,
    preparedSurfaceProxyTrapInvoked: false,
    preparedSurfaceRecursiveCallbackInvoked: false,
    preparedSurfaceDiagnosticsLookupInvoked: false,
    postPreparedSurfaceMapReadContinuationEntered: false,
    postPreparedSurfaceMapReadNextFunction: null,
    preparedSurfacePayloadLocalCreationAttempted: false,
    preparedSurfacePayloadLocalCreationCompleted: false,
    preparedSurfacePayloadLocalType: null,
    preparedSurfaceMapLocalAssignmentAttempted: false,
    preparedSurfaceMapLocalAssignmentCompleted: false,
    preparedSurfaceCanvasLocalAssignmentAttempted: false,
    preparedSurfaceCanvasLocalAssignmentCompleted: false,
    preparedSurfaceOwnerLocalAssignmentAttempted: false,
    preparedSurfaceOwnerLocalAssignmentCompleted: false,
    payloadEntryTraceMutationAttempted: false,
    payloadEntryTraceMutationCompleted: false,
    postMapReadLastCompletedStatement: null,
    postMapReadNextExpectedStatement: null,
    postMapReadFailureFunction: null,
    postMapReadExceptionName: null,
    postMapReadExceptionMessage: null,
    postMapReadExceptionReasonCode: null,
    postMapReadObjectSpreadInvoked: false,
    postMapReadStructuredCloneInvoked: false,
    postMapReadObjectFreezeInvoked: false,
    postMapReadJsonSerializationInvoked: false,
    postMapReadPropertyEnumerationInvoked: false,
    postMapReadGetterInvoked: false,
    postMapReadSetterInvoked: false,
    postMapReadProxyTrapInvoked: false,
    postMapReadRecursiveCallbackInvoked: false,
    postMapReadDiagnosticsLookupInvoked: false,
    lifecycleRegistrationStateAssignmentAttempted: false,
    lifecycleRegistrationStateAssignmentCompleted: false,
    lifecycleRegistrationStateValue: null,
    lifecycleTranslationGateEntered: false,
    lifecycleTranslationGateOperandOneEvaluated: false,
    lifecycleTranslationGateOperandOneValue: null,
    lifecycleTranslationGateOperandTwoEvaluated: false,
    lifecycleTranslationGateOperandTwoValue: null,
    lifecycleTranslationObjectSpreadAttempted: false,
    lifecycleTranslationObjectSpreadCompleted: false,
    lifecycleTranslationFunctionSelected: false,
    lifecycleTranslationFunctionEntered: false,
    lifecycleTranslationFunctionReturned: false,
    lifecycleTranslationResultType: null,
    lifecycleTranslationResultStatus: null,
    lifecycleTranslationTraceEntered: false,
    lifecycleTranslationTraceExited: false,
    lifecycleTranslationTraceCurrentDepth: 0,
    lifecycleTranslationTraceMaxDepth: 0,
    lifecycleTranslationTraceLast100Calls: null,
    lifecycleTranslationRepeatedCallChain: null,
    lifecycleTranslationRecursionDetected: false,
    lifecycleTranslationOverflowPrevented: false,
    lifecycleTranslationLastFunction: null,
    lifecycleTranslationPreviousFunction: null,
    lifecycleRegisteredStatusWriteAttempted: false,
    lifecycleRegisteredStatusWriteCompleted: false,
    lifecycleGateLastCompletedStep: null,
    lifecycleGateNextExpectedStep: null,
    lifecycleGateFailureFunction: null,
    lifecycleGateExceptionName: null,
    lifecycleGateExceptionMessage: null,
    lifecycleGateExceptionReasonCode: null,
    lifecycleGateObjectSpreadInvoked: false,
    lifecycleGateGetterInvoked: false,
    lifecycleGateSetterInvoked: false,
    lifecycleGateProxyTrapInvoked: false,
    lifecycleGateRecursiveCallbackInvoked: false,
    lifecycleGateDiagnosticsLookupInvoked: false,
    lifecycleGateJsonSerializationInvoked: false,
    lifecycleGateObjectFreezeInvoked: false,
    lifecycleGateStructuredCloneInvoked: false,
    payloadAssemblyEntryFunction: null,
    payloadAssemblyContextCreationAttempted: false,
    payloadAssemblyContextCreationCompleted: false,
    payloadGuardEvaluationAttempted: false,
    payloadGuardEvaluationCompleted: false,
    payloadGuardResult: null,
    payloadGuardFailureReason: null,
    payloadContextHasMap: false,
    payloadContextHasCanvas: false,
    payloadContextHasViewport: false,
    payloadContextHasDrawOperation: false,
    payloadContextHasCallbacks: false,
    handoffCreationAfterGuardAttempted: false,
    handoffCreationAfterGuardCompleted: false,
    payloadAssemblyNextFunction: null,
    payloadAssemblyLastCompletedStep: null,
    payloadAssemblyFailureFunction: null,
    payloadAssemblyExceptionName: null,
    payloadAssemblyExceptionMessage: null,
    payloadAssemblyExceptionReasonCode: null,
    payloadAssemblyGetterInvoked: false,
    payloadAssemblyProxyTrapInvoked: false,
    payloadAssemblyRecursiveCallbackInvoked: false,
    payloadAssemblyDiagnosticsLookupInvoked: false
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
  let activeLifecycleTranslationTraceSource = null;

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

  function getCustom25DOneFrameAdapterRuntimeIdentity() {
    return runtimeIdentity;
  }

  function getCustom25DOneFrameAdapterExecutionIdentity() {
    return deepFreeze({
      ...executionIdentityState
    });
  }

  function notifyContinuationHook(name, payload = {}) {
    const hook = postDrawOperationContinuationHooks?.[name];
    if (typeof hook === "function") {
      return hook(payload);
    }
    return undefined;
  }

  function notifyPostLifecycleOwnerContinuationHook(name, payload = {}) {
    const hook = postLifecycleOwnerContinuationHooks?.[name];
    if (typeof hook === "function") {
      return hook(payload);
    }
    return undefined;
  }

  function recordPostDrawStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function recordPreparedSurfaceStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function recordPayloadAssemblyStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function recordPostLifecycleOwnerStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function recordPostMapReadStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function recordLifecycleGateStep(patch = {}) {
    executionIdentityState = {
      ...executionIdentityState,
      ...patch
    };
  }

  function syncLifecycleTranslationTraceSnapshot() {
    if (
      !activeLifecycleTranslationTraceSource ||
      typeof activeLifecycleTranslationTraceSource.getLifecycleTranslationTrace !==
        "function"
    ) {
      return;
    }

    const trace = activeLifecycleTranslationTraceSource.getLifecycleTranslationTrace();
    executionIdentityState = {
      ...executionIdentityState,
      lifecycleTranslationTraceEntered:
        trace?.lifecycleTranslationTraceEntered ?? false,
      lifecycleTranslationTraceExited:
        trace?.lifecycleTranslationTraceExited ?? false,
      lifecycleTranslationTraceCurrentDepth:
        trace?.lifecycleTranslationTraceCurrentDepth ?? 0,
      lifecycleTranslationTraceMaxDepth:
        trace?.lifecycleTranslationTraceMaxDepth ?? 0,
      lifecycleTranslationTraceLast100Calls:
        trace?.lifecycleTranslationTraceLast100Calls ?? null,
      lifecycleTranslationRepeatedCallChain:
        trace?.lifecycleTranslationRepeatedCallChain ?? null,
      lifecycleTranslationRecursionDetected:
        trace?.lifecycleTranslationRecursionDetected ?? false,
      lifecycleTranslationOverflowPrevented:
        trace?.lifecycleTranslationOverflowPrevented ?? false,
      lifecycleTranslationLastFunction:
        trace?.lifecycleTranslationLastFunction ?? null,
      lifecycleTranslationPreviousFunction:
        trace?.lifecycleTranslationPreviousFunction ?? null
    };
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
    executionIdentityState = {
      ...executionIdentityState,
      adapterEntryReached: true,
      adapterEntryFunctionName: "executeDeveloperOnlyLiveOneFrameAdapter",
      adapterEntryReturnPath: null,
      adapterEarlyReturnReason: null,
      nextFunctionAfterAdapterEntry: "adapter.resolveInjectedRuntimeOneFrameBridge",
      bridgeResolutionStarted: false,
      snapshotBridgeResolutionStarted: false,
      drawBridgeResolutionStarted: false,
      postCallbackWrapperNextFunction: null,
      postCallbackWrapperExitReason: null,
      payloadAssemblyGuardEvaluated: false,
      payloadAssemblyGuardResult: null,
      payloadAssemblySkippedReason: null,
      createDrawOperationEntered: false,
      createDrawOperationFactoryAvailable: typeof drawOperationFactory !== "undefined",
      createDrawOperationFactoryCallable: typeof drawOperationFactory === "function",
      createDrawOperationInputCanvasPresent: false,
      createDrawOperationInputMapPresent: false,
      createDrawOperationInputDrawCallbackPresent: false,
      createDrawOperationReturned: false,
      createDrawOperationResultType: null,
      createDrawOperationFailureReason: null,
      createDrawOperationLastFunction: null,
      createDrawOperationPreviousFunction: null,
      createDrawOperationExceptionName: null,
      createDrawOperationExceptionMessage: null,
      createDrawOperationExceptionReasonCode: null,
      createDrawOperationSelfCallDetected: false,
      createDrawOperationExecuteFunctionCallDetected: false,
      createDrawOperationDiagnosticsNamespaceCallDetected: false,
      createDrawOperationSnapshotBridgeCallDetected: false,
      createDrawOperationDrawBridgeResolverCallDetected: false,
      createDrawOperationLifecycleTranslationCallDetected: false,
      postDrawOperationContinuationEntered: false,
      drawOperationLocalAssignmentAttempted: false,
      drawOperationLocalAssignmentCompleted: false,
      currentRefsMapAssignmentAttempted: false,
      currentRefsMapAssignmentCompleted: false,
      currentRefsLifecycleOwnerAssignmentAttempted: false,
      currentRefsLifecycleOwnerAssignmentCompleted: false,
      currentRefsDrawOperationAssignmentAttempted: false,
      currentRefsDrawOperationAssignmentCompleted: false,
      prepareOneFrameSurfaceSelected: false,
      prepareOneFrameSurfaceCallAttempted: false,
      prepareOneFrameSurfaceCallEntered: false,
      prepareOneFrameSurfaceCallReturned: false,
      prepareOneFrameSurfaceResultType: null,
      surfacePreparationInputReadyStatusWriteAttempted: false,
      surfacePreparationInputReadyStatusWriteCompleted: false,
      postDrawOperationLastCompletedStep: null,
      postDrawOperationNextExpectedStep: null,
      postDrawOperationFailureFunction: null,
      postDrawOperationExceptionName: null,
      postDrawOperationExceptionMessage: null,
      postDrawOperationExceptionReasonCode: null,
      postDrawOperationPropertySetterInvoked: false,
      postDrawOperationProxyTrapInvoked: false,
      postDrawOperationGetterInvoked: false,
      postDrawOperationDiagnosticsLookupInvoked: false,
      postDrawOperationRecursiveCallbackInvoked: false,
      preparedSurfaceLocalAssignmentAttempted: false,
      preparedSurfaceLocalAssignmentCompleted: false,
      preparedSurfacePresent: false,
      preparedSurfaceType: null,
      preparedSurfaceKeys: null,
      preparedSurfaceStatusReadAttempted: false,
      preparedSurfaceStatusReadCompleted: false,
      preparedSurfaceStatusValue: null,
      preparedSurfaceReasonReadAttempted: false,
      preparedSurfaceReasonReadCompleted: false,
      preparedSurfaceReasonValue: null,
      preparedSurfaceCanvasReadAttempted: false,
      preparedSurfaceCanvasReadCompleted: false,
      preparedSurfaceCanvasPresent: false,
      preparedSurfaceMapReadAttempted: false,
      preparedSurfaceMapReadCompleted: false,
      preparedSurfaceMapPresent: false,
      preparedSurfaceLifecycleOwnerReadAttempted: false,
      preparedSurfaceLifecycleOwnerReadCompleted: false,
      preparedSurfaceLifecycleOwnerPresent: false,
      preparedSurfaceLifecycleOwnerSource: null,
      preparedSurfaceLifecycleOwnerPropertyName: null,
      preparedSurfaceNestedLifecycleOwnerPresent: false,
      currentRefsLifecycleOwnerPresentAfterSurfacePreparation: false,
      payloadLifecycleOwnerResolved: false,
      payloadLifecycleOwnerResolutionSource: null,
      payloadLifecycleOwnerResolutionFailureReason: null,
      resolvedLifecycleOwnerLocalAssignmentAttempted: false,
      resolvedLifecycleOwnerLocalAssignmentCompleted: false,
      resolvedLifecycleOwnerMatchesCurrentRefs: false,
      resolvedLifecycleOwnerIdentityType: null,
      postLifecycleOwnerContinuationEntered: false,
      postLifecycleOwnerNextFunction: null,
      payloadEntryMarkerWriteAttempted: false,
      payloadEntryMarkerWriteCompleted: false,
      payloadContextConstructorSelected: false,
      payloadContextConstructorEntered: false,
      payloadContextConstructorReturned: false,
      payloadContextConstructorResultType: null,
      postLifecycleOwnerLastCompletedStep: null,
      postLifecycleOwnerNextExpectedStep: null,
      postLifecycleOwnerFailureFunction: null,
      postLifecycleOwnerExceptionName: null,
      postLifecycleOwnerExceptionMessage: null,
      postLifecycleOwnerExceptionReasonCode: null,
      postLifecycleOwnerGetterInvoked: false,
      postLifecycleOwnerSetterInvoked: false,
      postLifecycleOwnerProxyTrapInvoked: false,
      postLifecycleOwnerRecursiveCallbackInvoked: false,
      postLifecycleOwnerDiagnosticsLookupInvoked: false,
      payloadAssemblyEntryAttempted: false,
      payloadAssemblyEntryCompleted: false,
      preparedSurfaceContinuationLastCompletedStep: null,
      preparedSurfaceContinuationNextExpectedStep: null,
      preparedSurfaceContinuationFailureFunction: null,
      preparedSurfaceContinuationExceptionName: null,
      preparedSurfaceContinuationExceptionMessage: null,
      preparedSurfaceContinuationExceptionReasonCode: null,
      preparedSurfaceGetterInvoked: false,
      preparedSurfaceProxyTrapInvoked: false,
      preparedSurfaceRecursiveCallbackInvoked: false,
      preparedSurfaceDiagnosticsLookupInvoked: false,
      postPreparedSurfaceMapReadContinuationEntered: false,
      postPreparedSurfaceMapReadNextFunction: null,
      preparedSurfacePayloadLocalCreationAttempted: false,
      preparedSurfacePayloadLocalCreationCompleted: false,
      preparedSurfacePayloadLocalType: null,
      preparedSurfaceMapLocalAssignmentAttempted: false,
      preparedSurfaceMapLocalAssignmentCompleted: false,
      preparedSurfaceCanvasLocalAssignmentAttempted: false,
      preparedSurfaceCanvasLocalAssignmentCompleted: false,
      preparedSurfaceOwnerLocalAssignmentAttempted: false,
      preparedSurfaceOwnerLocalAssignmentCompleted: false,
      payloadEntryTraceMutationAttempted: false,
      payloadEntryTraceMutationCompleted: false,
      postMapReadLastCompletedStatement: null,
      postMapReadNextExpectedStatement: null,
      postMapReadFailureFunction: null,
      postMapReadExceptionName: null,
      postMapReadExceptionMessage: null,
      postMapReadExceptionReasonCode: null,
      postMapReadObjectSpreadInvoked: false,
      postMapReadStructuredCloneInvoked: false,
      postMapReadObjectFreezeInvoked: false,
      postMapReadJsonSerializationInvoked: false,
      postMapReadPropertyEnumerationInvoked: false,
      postMapReadGetterInvoked: false,
      postMapReadSetterInvoked: false,
      postMapReadProxyTrapInvoked: false,
      postMapReadRecursiveCallbackInvoked: false,
      postMapReadDiagnosticsLookupInvoked: false,
      lifecycleRegistrationStateAssignmentAttempted: false,
      lifecycleRegistrationStateAssignmentCompleted: false,
      lifecycleRegistrationStateValue: null,
      lifecycleTranslationGateEntered: false,
      lifecycleTranslationGateOperandOneEvaluated: false,
      lifecycleTranslationGateOperandOneValue: null,
      lifecycleTranslationGateOperandTwoEvaluated: false,
      lifecycleTranslationGateOperandTwoValue: null,
      lifecycleTranslationObjectSpreadAttempted: false,
      lifecycleTranslationObjectSpreadCompleted: false,
      lifecycleTranslationFunctionSelected: false,
      lifecycleTranslationFunctionEntered: false,
      lifecycleTranslationFunctionReturned: false,
      lifecycleTranslationResultType: null,
      lifecycleTranslationResultStatus: null,
      lifecycleTranslationTraceEntered: false,
      lifecycleTranslationTraceExited: false,
      lifecycleTranslationTraceCurrentDepth: 0,
      lifecycleTranslationTraceMaxDepth: 0,
      lifecycleTranslationTraceLast100Calls: null,
      lifecycleTranslationRepeatedCallChain: null,
      lifecycleTranslationRecursionDetected: false,
      lifecycleTranslationOverflowPrevented: false,
      lifecycleTranslationLastFunction: null,
      lifecycleTranslationPreviousFunction: null,
      lifecycleRegisteredStatusWriteAttempted: false,
      lifecycleRegisteredStatusWriteCompleted: false,
      lifecycleGateLastCompletedStep: null,
      lifecycleGateNextExpectedStep: null,
      lifecycleGateFailureFunction: null,
      lifecycleGateExceptionName: null,
      lifecycleGateExceptionMessage: null,
      lifecycleGateExceptionReasonCode: null,
      lifecycleGateObjectSpreadInvoked: false,
      lifecycleGateGetterInvoked: false,
      lifecycleGateSetterInvoked: false,
      lifecycleGateProxyTrapInvoked: false,
      lifecycleGateRecursiveCallbackInvoked: false,
      lifecycleGateDiagnosticsLookupInvoked: false,
      lifecycleGateJsonSerializationInvoked: false,
      lifecycleGateObjectFreezeInvoked: false,
      lifecycleGateStructuredCloneInvoked: false,
      payloadAssemblyEntryFunction: null,
      payloadAssemblyContextCreationAttempted: false,
      payloadAssemblyContextCreationCompleted: false,
      payloadGuardEvaluationAttempted: false,
      payloadGuardEvaluationCompleted: false,
      payloadGuardResult: null,
      payloadGuardFailureReason: null,
      payloadContextHasMap: false,
      payloadContextHasCanvas: false,
      payloadContextHasViewport: false,
      payloadContextHasDrawOperation: false,
      payloadContextHasCallbacks: false,
      handoffCreationAfterGuardAttempted: false,
      handoffCreationAfterGuardCompleted: false,
      payloadAssemblyNextFunction: null,
      payloadAssemblyLastCompletedStep: null,
      payloadAssemblyFailureFunction: null,
      payloadAssemblyExceptionName: null,
      payloadAssemblyExceptionMessage: null,
      payloadAssemblyExceptionReasonCode: null,
      payloadAssemblyGetterInvoked: false,
      payloadAssemblyProxyTrapInvoked: false,
      payloadAssemblyRecursiveCallbackInvoked: false,
      payloadAssemblyDiagnosticsLookupInvoked: false,
      postCallbackInstrumentationWrapperEntered: true,
      payloadAssemblyInstrumentationEntered: false,
      activeAdapterFunctionReferenceMatchesInstrumentedModuleExport: true
    };
    const deferCleanupUntilRelease =
      isObjectLike(options) && options.deferCleanupUntilRelease === true;
    updatePreSnapshotHandoffTrace({
      adapterEntryBridgeReceived: !!options?.bridge,
      adapterEntryBridgeSource:
        typeof options?.bridgeSource === "string" ? options.bridgeSource : null,
      adapterEntryRawLeafletMapReference:
        options?.hasRawLeafletMapReference === true ||
        !!options?.bridge?.rawLeafletMapReference
    });
    markInvocationBoundaryMilestone("reachedAdapterExecutePath");

    if (status.permanentlyClosed || currentRefs.deferredCleanupPending) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "blockSecondInvocation",
        adapterEarlyReturnReason: "ADAPTER_ALREADY_CLOSED"
      };
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
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: firstMissingDependencyReason(constructionFlags)
      };
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
    executionIdentityState = {
      ...executionIdentityState,
      bridgeResolutionStarted: true
    };
    const injectedBridgeDiagnostics = traceInvocationBoundary(
      "adapter.resolveInjectedRuntimeOneFrameBridge",
      () => resolveInjectedRuntimeOneFrameBridge(options)
    );
    const runtimeBridgeDiagnostics =
      injectedBridgeDiagnostics.bridgeAvailable === true
        ? injectedBridgeDiagnostics
        : traceInvocationBoundary(
            "adapter.resolveRuntimeOneFrameBridge",
            () => resolveRuntimeOneFrameBridge()
          );

    const runtimeMapResolution = traceInvocationBoundary(
      "adapter.resolveRuntimeRawLeafletMapReference",
      () =>
        resolveRuntimeRawLeafletMapReference({
          rawLeafletMapReference,
          rawLeafletMapProvider,
          runtimeBridge: runtimeBridgeDiagnostics.bridge
        })
    );

    if (!runtimeMapResolution.ok) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(
          runtimeMapResolution.error,
          "MAP_PROVIDER_EXCEPTION"
        )
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(runtimeMapResolution.error, "MAP_PROVIDER_EXCEPTION"),
        {
          hasBridge: constructionFlags.frameSnapshotBridgeAvailable,
          adapterBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
          commandBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
          bridgeSource: runtimeBridgeDiagnostics.bridgeSource,
          adapterReceivedBridge:
            runtimeBridgeDiagnostics.adapterReceivedBridge === true,
          adapterBridgeResolutionFunction:
            runtimeBridgeDiagnostics.adapterBridgeResolutionFunction,
          hasRawLeafletMapReference: false,
          mapObjectType: "provider_exception",
          mapValidationResult: "provider_exception",
          mapValidationFailureReason: toReasonCode(
            runtimeMapResolution.error,
            "MAP_PROVIDER_EXCEPTION"
          ),
          mapAvailabilityFailureFunction:
            "adapter.resolveRuntimeRawLeafletMapReference"
        }
      );
    }

    map = runtimeMapResolution.map ?? null;

    updateStatus({
      hasBridge: constructionFlags.frameSnapshotBridgeAvailable,
      adapterBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
      commandBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
      bridgeSource: runtimeBridgeDiagnostics.bridgeSource,
      adapterReceivedBridge:
        runtimeBridgeDiagnostics.adapterReceivedBridge === true,
      adapterBridgeResolutionFunction:
        runtimeBridgeDiagnostics.adapterBridgeResolutionFunction,
      hasRawLeafletMapReference: map !== null,
      mapObjectType: describeMapObjectType(map),
      mapValidationResult: map ? "present" : "missing",
      mapValidationFailureReason: map ? null : "MAP_REFERENCE_MISSING",
      mapAvailabilityFailureFunction: map
        ? null
        : "adapter.resolveRuntimeRawLeafletMapReference",
      surfacePreparationInputReady: map !== null
    });

    if (!map) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "MAP_UNAVAILABLE"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "MAP_UNAVAILABLE",
        {
          hasBridge: constructionFlags.frameSnapshotBridgeAvailable,
          adapterBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
          commandBridgeAvailable: runtimeBridgeDiagnostics.bridgeAvailable === true,
          bridgeSource: runtimeBridgeDiagnostics.bridgeSource,
          adapterReceivedBridge:
            runtimeBridgeDiagnostics.adapterReceivedBridge === true,
          adapterBridgeResolutionFunction:
            runtimeBridgeDiagnostics.adapterBridgeResolutionFunction,
          hasRawLeafletMapReference: false,
          mapObjectType: describeMapObjectType(map),
          mapValidationResult: "missing",
          mapValidationFailureReason: "MAP_REFERENCE_MISSING",
          mapAvailabilityFailureFunction:
            "adapter.resolveRuntimeRawLeafletMapReference",
          surfacePreparationInputReady: false
        }
      );
    }

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.leafletProvider"
      };
      leaflet = leafletProvider();
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(error, "LEAFLET_PROVIDER_EXCEPTION")
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "LEAFLET_PROVIDER_EXCEPTION")
      );
    }

    if (!validateLeaflet(leaflet)) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "LEAFLET_PROVIDER_INVALID"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LEAFLET_PROVIDER_INVALID"
      );
    }

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.surfaceOperationsFactory"
      };
      surfaceOperations = surfaceOperationsFactory({
        leafletProvider: leaflet,
        devicePixelRatioProvider
      });
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "SURFACE_OPERATIONS_FACTORY_EXCEPTION"
        )
      };
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
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "SURFACE_OPERATIONS_UNAVAILABLE"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "SURFACE_OPERATIONS_UNAVAILABLE"
      );
    }

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.lifecycleTranslationFactory"
      };
      lifecycleTranslation = lifecycleTranslationFactory();
      activeLifecycleTranslationTraceSource = lifecycleTranslation;
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "LIFECYCLE_TRANSLATION_FACTORY_EXCEPTION"
        )
      };
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
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "LIFECYCLE_TRANSLATION_UNAVAILABLE"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LIFECYCLE_TRANSLATION_UNAVAILABLE"
      );
    }

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.lifecycleOwnerFactory"
      };
      lifecycleOwner = lifecycleOwnerFactory();
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(error, "LIFECYCLE_OWNER_FACTORY_EXCEPTION")
      };
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
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "LIFECYCLE_OWNER_UNAVAILABLE"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "LIFECYCLE_OWNER_UNAVAILABLE"
      );
    }

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.resolveFrameSnapshotBridge",
        snapshotBridgeResolutionStarted: true
      };
      snapshotBridge = tracePreSnapshotHandoff(
        "adapter.resolveFrameSnapshotBridge",
        () =>
          traceInvocationBoundary("adapter.resolveFrameSnapshotBridge", () => {
            markInvocationBoundaryMilestone("reachedSnapshotBridgeProvider");
            const providerBridge = frameSnapshotProvider();
            if (typeof providerBridge === "function") {
              return providerBridge;
            }
            const runtimeBridgeSnapshotFunction =
              runtimeBridgeDiagnostics.bridge
                ?.createCustom25DFrameViewportSnapshotForOneFrame;
            return typeof runtimeBridgeSnapshotFunction === "function"
              ? runtimeBridgeSnapshotFunction.bind(runtimeBridgeDiagnostics.bridge)
              : providerBridge;
          })
      );
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "FRAME_SNAPSHOT_BRIDGE_PROVIDER_EXCEPTION"
        )
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "FRAME_SNAPSHOT_BRIDGE_PROVIDER_EXCEPTION")
      );
    }

    if (typeof snapshotBridge !== "function") {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "FRAME_SNAPSHOT_BRIDGE_UNAVAILABLE"
      };
      updatePreSnapshotHandoffTrace({
        snapshotCallbackExists: snapshotBridge !== undefined && snapshotBridge !== null,
        snapshotCallbackCallable: false
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "FRAME_SNAPSHOT_BRIDGE_UNAVAILABLE"
      );
    }

    updatePreSnapshotHandoffTrace({
      snapshotCallbackExists: true,
      snapshotCallbackCallable: true
    });

    try {
      executionIdentityState = {
        ...executionIdentityState,
        nextFunctionAfterAdapterEntry: "adapter.resolveDrawBridge",
        drawBridgeResolutionStarted: true
      };
      drawBridge = tracePreSnapshotHandoff(
        "adapter.resolveDrawBridge",
        () =>
          traceInvocationBoundary("adapter.resolveDrawBridge", () => {
            const providerDrawBridge = drawFunctionProvider();
            if (typeof providerDrawBridge === "function") {
              return providerDrawBridge;
            }
            const runtimeBridgeDrawFunction =
              runtimeBridgeDiagnostics.bridge?.drawCustom25DOneFrameFromSnapshot;
            return typeof runtimeBridgeDrawFunction === "function"
              ? runtimeBridgeDrawFunction.bind(runtimeBridgeDiagnostics.bridge)
              : providerDrawBridge;
          })
      );
    } catch (error) {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: toReasonCode(error, "DRAW_BRIDGE_PROVIDER_EXCEPTION")
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "DRAW_BRIDGE_PROVIDER_EXCEPTION")
      );
    }

    if (typeof drawBridge !== "function") {
      executionIdentityState = {
        ...executionIdentityState,
        adapterEntryReturnPath: "finalize",
        adapterEarlyReturnReason: "DRAW_BRIDGE_UNAVAILABLE"
      };
      updatePreSnapshotHandoffTrace({
        drawCallbackExists: drawBridge !== undefined && drawBridge !== null,
        drawCallbackCallable: false
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "DRAW_BRIDGE_UNAVAILABLE"
      );
    }

    updatePreSnapshotHandoffTrace({
      drawCallbackExists: true,
      drawCallbackCallable: true,
      adapterPostCallbackResolutionNextStep: "adapter.createDrawOperation",
      adapterEarlyReturnReason: null,
      adapterExecutionCompletionReason: null,
      payloadAssemblyEntryMarked: false,
      payloadAssemblyEntryFunction: "adapter.assembleSnapshotHandoffPayload",
      payloadAssemblyNotReachedBranchReason: null,
      payloadAssemblyNotReachedReturnReason: null,
      postDrawBridgeNextFunction: "adapter.createDrawOperation"
    });
    executionIdentityState = {
      ...executionIdentityState,
      postCallbackWrapperNextFunction: "adapter.createDrawOperation",
      postCallbackWrapperExitReason: null,
      payloadAssemblyGuardEvaluated: false,
      payloadAssemblyGuardResult: null,
      payloadAssemblySkippedReason: null,
      createDrawOperationEntered: false,
      createDrawOperationFactoryAvailable: typeof drawOperationFactory !== "undefined",
      createDrawOperationFactoryCallable: typeof drawOperationFactory === "function",
      createDrawOperationInputCanvasPresent: false,
      createDrawOperationInputMapPresent: !!map,
      createDrawOperationInputDrawCallbackPresent: typeof drawBridge === "function",
      createDrawOperationReturned: false,
      createDrawOperationResultType: null,
      createDrawOperationFailureReason: null,
      createDrawOperationLastFunction: null,
      createDrawOperationPreviousFunction: null,
      createDrawOperationExceptionName: null,
      createDrawOperationExceptionMessage: null,
      createDrawOperationExceptionReasonCode: null,
      createDrawOperationSelfCallDetected: false,
      createDrawOperationExecuteFunctionCallDetected: false,
      createDrawOperationDiagnosticsNamespaceCallDetected: false,
      createDrawOperationSnapshotBridgeCallDetected: false,
      createDrawOperationDrawBridgeResolverCallDetected: false,
      createDrawOperationLifecycleTranslationCallDetected: false
    };

    let activeFrameViewportSnapshot = null;

    try {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.createDrawOperation",
        nextFunctionAfterAdapterEntry: "adapter.createDrawOperation",
        postDrawBridgeNextFunction: "adapter.createDrawOperation"
      });
      executionIdentityState = {
        ...executionIdentityState,
        createDrawOperationEntered: true,
        createDrawOperationPreviousFunction:
          executionIdentityState.createDrawOperationLastFunction,
        createDrawOperationLastFunction: "adapter.createDrawOperation"
      };
      drawOperation = drawOperationFactory({
        drawFunctionProvider: () => ({ surface, canvas }) =>
          drawBridge({
            canvas,
            frameViewportSnapshot: activeFrameViewportSnapshot,
            surface
          })
      });
    } catch (error) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.createDrawOperation",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "DRAW_OPERATION_FACTORY_EXCEPTION"
        ),
        adapterExecutionCompletionReason: toReasonCode(
          error,
          "DRAW_OPERATION_FACTORY_EXCEPTION"
        ),
        payloadAssemblyNotReachedBranchReason: "DRAW_OPERATION_FACTORY_EXCEPTION",
        payloadAssemblyNotReachedReturnReason: toReasonCode(
          error,
          "DRAW_OPERATION_FACTORY_EXCEPTION"
        )
      });
      executionIdentityState = {
        ...executionIdentityState,
        createDrawOperationReturned: false,
        createDrawOperationFailureReason: toReasonCode(
          error,
          "DRAW_OPERATION_FACTORY_EXCEPTION"
        ),
        createDrawOperationExceptionName: error?.name ?? "Error",
        createDrawOperationExceptionMessage: error?.message ?? null,
        createDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "DRAW_OPERATION_FACTORY_EXCEPTION"
        )
      };
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
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.createDrawOperation",
        adapterEarlyReturnReason: "DRAW_OPERATION_UNAVAILABLE",
        adapterExecutionCompletionReason: "DRAW_OPERATION_UNAVAILABLE",
        payloadAssemblyNotReachedBranchReason: "DRAW_OPERATION_UNAVAILABLE",
        payloadAssemblyNotReachedReturnReason: "DRAW_OPERATION_UNAVAILABLE"
      });
      executionIdentityState = {
        ...executionIdentityState,
        createDrawOperationReturned: true,
        createDrawOperationResultType:
          drawOperation === null
            ? "null"
            : Array.isArray(drawOperation)
              ? "array"
              : typeof drawOperation === "object"
                ? `object:${drawOperation?.constructor?.name ?? "Object"}`
                : typeof drawOperation,
        createDrawOperationFailureReason: "DRAW_OPERATION_UNAVAILABLE"
      };
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "DRAW_OPERATION_UNAVAILABLE"
      );
    }
    executionIdentityState = {
      ...executionIdentityState,
      createDrawOperationReturned: true,
      createDrawOperationResultType:
        typeof drawOperation === "object"
          ? `object:${drawOperation?.constructor?.name ?? "Object"}`
          : typeof drawOperation
    };
    recordPostDrawStep({
      postDrawOperationContinuationEntered: true,
      drawOperationLocalAssignmentAttempted: true,
      drawOperationLocalAssignmentCompleted: true,
      postDrawOperationLastCompletedStep: "drawOperationLocalAssignmentCompleted",
      postDrawOperationNextExpectedStep: "currentRefs.map assignment"
    });

    try {
      recordPostDrawStep({
        currentRefsMapAssignmentAttempted: true,
        postDrawOperationNextExpectedStep: "currentRefs.map assignment"
      });
      notifyContinuationHook("beforeCurrentRefsMapAssignment", { map, currentRefs });
      currentRefs.map = map;
      notifyContinuationHook("afterCurrentRefsMapAssignment", { map, currentRefs });
      recordPostDrawStep({
        currentRefsMapAssignmentCompleted: true,
        postDrawOperationLastCompletedStep: "currentRefs.map assignment",
        postDrawOperationNextExpectedStep: "currentRefs.lifecycleOwner assignment"
      });
    } catch (error) {
      recordPostDrawStep({
        postDrawOperationFailureFunction: "currentRefs.map assignment",
        postDrawOperationExceptionName: error?.name ?? "Error",
        postDrawOperationExceptionMessage: error?.message ?? null,
        postDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "CURRENT_REFS_MAP_ASSIGNMENT_EXCEPTION"
        ),
        postDrawOperationPropertySetterInvoked: true,
        postDrawOperationFailureReason:
          toReasonCode(error, "CURRENT_REFS_MAP_ASSIGNMENT_EXCEPTION")
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "CURRENT_REFS_MAP_ASSIGNMENT_EXCEPTION"
      );
    }

    try {
      recordPostDrawStep({
        currentRefsLifecycleOwnerAssignmentAttempted: true,
        postDrawOperationNextExpectedStep: "currentRefs.lifecycleOwner assignment"
      });
      notifyContinuationHook("beforeCurrentRefsLifecycleOwnerAssignment", {
        lifecycleOwner,
        currentRefs
      });
      currentRefs.lifecycleOwner = lifecycleOwner;
      notifyContinuationHook("afterCurrentRefsLifecycleOwnerAssignment", {
        lifecycleOwner,
        currentRefs
      });
      recordPostDrawStep({
        currentRefsLifecycleOwnerAssignmentCompleted: true,
        postDrawOperationLastCompletedStep: "currentRefs.lifecycleOwner assignment",
        postDrawOperationNextExpectedStep: "currentRefs.drawOperation assignment"
      });
    } catch (error) {
      recordPostDrawStep({
        postDrawOperationFailureFunction: "currentRefs.lifecycleOwner assignment",
        postDrawOperationExceptionName: error?.name ?? "Error",
        postDrawOperationExceptionMessage: error?.message ?? null,
        postDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "CURRENT_REFS_LIFECYCLE_ASSIGNMENT_EXCEPTION"
        ),
        postDrawOperationPropertySetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "CURRENT_REFS_LIFECYCLE_ASSIGNMENT_EXCEPTION"
      );
    }

    try {
      recordPostDrawStep({
        currentRefsDrawOperationAssignmentAttempted: true,
        postDrawOperationNextExpectedStep: "currentRefs.drawOperation assignment"
      });
      notifyContinuationHook("beforeCurrentRefsDrawOperationAssignment", {
        drawOperation,
        currentRefs
      });
      currentRefs.drawOperation = drawOperation;
      notifyContinuationHook("afterCurrentRefsDrawOperationAssignment", {
        drawOperation,
        currentRefs
      });
      recordPostDrawStep({
        currentRefsDrawOperationAssignmentCompleted: true,
        postDrawOperationLastCompletedStep: "currentRefs.drawOperation assignment",
        postDrawOperationNextExpectedStep:
          "updateStatus(surfacePreparationInputReady)"
      });
    } catch (error) {
      recordPostDrawStep({
        postDrawOperationFailureFunction: "currentRefs.drawOperation assignment",
        postDrawOperationExceptionName: error?.name ?? "Error",
        postDrawOperationExceptionMessage: error?.message ?? null,
        postDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "CURRENT_REFS_DRAW_OPERATION_ASSIGNMENT_EXCEPTION"
        ),
        postDrawOperationPropertySetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "CURRENT_REFS_DRAW_OPERATION_ASSIGNMENT_EXCEPTION"
      );
    }

    markAdapterPostCallbackTrace({
      adapterPostCallbackResolutionNextStep: "adapter.prepareOneFrameSurface",
      nextFunctionAfterAdapterEntry: "adapter.prepareOneFrameSurface",
      postDrawBridgeNextFunction: "adapter.prepareOneFrameSurface"
    });
    recordPostDrawStep({
      prepareOneFrameSurfaceSelected: true,
      postDrawOperationLastCompletedStep: "adapter.prepareOneFrameSurface selected",
      postDrawOperationNextExpectedStep:
        "updateStatus(surfacePreparationInputReady)"
    });

    try {
      notifyContinuationHook("beforeSurfacePreparationInputReadyStatusWrite", {
        map,
        currentRefs
      });
      recordPostDrawStep({
        surfacePreparationInputReadyStatusWriteAttempted: true
      });
      updateStatus({
        surfacePreparationInputReady: true
      });
      recordPostDrawStep({
        surfacePreparationInputReadyStatusWriteCompleted: true,
        postDrawOperationLastCompletedStep:
          "updateStatus(surfacePreparationInputReady)",
        postDrawOperationNextExpectedStep: "surfaceOperations.prepareOneFrameSurface"
      });
      notifyContinuationHook("afterSurfacePreparationInputReadyStatusWrite", {
        map,
        currentRefs
      });
    } catch (error) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.prepareOneFrameSurface",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION"
        ),
        adapterExecutionCompletionReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION"
        ),
        payloadAssemblyNotReachedBranchReason:
          "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION",
        payloadAssemblyNotReachedReturnReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION"
        )
      });
      recordPostDrawStep({
        postDrawOperationFailureFunction:
          "updateStatus(surfacePreparationInputReady)",
        postDrawOperationExceptionName: error?.name ?? "Error",
        postDrawOperationExceptionMessage: error?.message ?? null,
        postDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION"
        )
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION")
      );
    }

    try {
      recordPostDrawStep({
        prepareOneFrameSurfaceCallAttempted: true,
        prepareOneFrameSurfaceCallEntered: true
      });
      notifyContinuationHook("beforePrepareOneFrameSurface", { map, currentRefs });
      surfaceResult = surfaceOperations.prepareOneFrameSurface({ map });
      notifyContinuationHook("afterPrepareOneFrameSurface", {
        map,
        currentRefs,
        surfaceResult
      });
      recordPostDrawStep({
        prepareOneFrameSurfaceCallReturned: true,
        prepareOneFrameSurfaceResultType: describeValueType(surfaceResult),
        postDrawOperationLastCompletedStep:
          "surfaceOperations.prepareOneFrameSurface returned",
        postDrawOperationNextExpectedStep: "payload assembly entry"
      });
    } catch (error) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.prepareOneFrameSurface",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_EXCEPTION"
        ),
        adapterExecutionCompletionReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_EXCEPTION"
        ),
        payloadAssemblyNotReachedBranchReason: "SURFACE_PREPARATION_EXCEPTION",
        payloadAssemblyNotReachedReturnReason: toReasonCode(
          error,
          "SURFACE_PREPARATION_EXCEPTION"
        )
      });
      recordPostDrawStep({
        postDrawOperationFailureFunction: "adapter.prepareOneFrameSurface",
        postDrawOperationExceptionName: error?.name ?? "Error",
        postDrawOperationExceptionMessage: error?.message ?? null,
        postDrawOperationExceptionReasonCode: toReasonCode(
          error,
          "SURFACE_PREPARATION_EXCEPTION"
        )
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SURFACE_PREPARATION_EXCEPTION")
      );
    }

    let preparedSurface = null;
    let preparedSurfaceStatusValue = null;
    let preparedSurfaceReasonValue = null;
    let preparedSurfacePayload = null;
    let preparedSurfaceCanvas = null;
    let preparedSurfaceMap = null;
    let preparedSurfaceLifecycleOwner = null;
    let preparedSurfaceLifecycleOwnerSource = null;
    let preparedSurfaceLifecycleOwnerPropertyName = null;
    let preparedSurfaceNestedLifecycleOwnerPresent = false;
    let payloadLifecycleOwner = null;
    let payloadLifecycleOwnerResolutionSource = null;
    let resolvedLifecycleOwner = null;
    let preparedSurfacePayloadLocal = null;
    let preparedSurfaceMapLocal = null;
    let preparedSurfaceCanvasLocal = null;
    let preparedSurfaceOwnerLocal = null;

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceLocalAssignmentAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface local assignment"
      });
      preparedSurface = surfaceResult;
      recordPreparedSurfaceStep({
        preparedSurfaceLocalAssignmentCompleted: true,
        preparedSurfacePresent: preparedSurface !== null && preparedSurface !== undefined,
        preparedSurfaceType: describeValueType(preparedSurface),
        preparedSurfaceKeys:
          preparedSurface && typeof preparedSurface === "object"
            ? Object.keys(preparedSurface)
            : [],
        preparedSurfaceContinuationLastCompletedStep:
          "preparedSurface local assignment",
        preparedSurfaceContinuationNextExpectedStep:
          "preparedSurface status/reason read"
      });
    } catch (error) {
      const preparedSurfaceLocalAssignmentReasonCode =
        "PREPARED_SURFACE_LOCAL_ASSIGNMENT_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction: "preparedSurface local assignment",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceLocalAssignmentReasonCode,
        preparedSurfaceProxyTrapInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceLocalAssignmentReasonCode
      );
    }

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceStatusReadAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface status read"
      });
      preparedSurfaceStatusValue = preparedSurface?.outcome ?? null;
      recordPreparedSurfaceStep({
        preparedSurfaceStatusReadCompleted: true,
        preparedSurfaceStatusValue,
        preparedSurfaceContinuationLastCompletedStep: "preparedSurface status read",
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface reason read"
      });
    } catch (error) {
      const preparedSurfaceStatusReadReasonCode =
        "PREPARED_SURFACE_STATUS_READ_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction: "preparedSurface.outcome read",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceStatusReadReasonCode,
        preparedSurfaceGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceStatusReadReasonCode
      );
    }

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceReasonReadAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface reason read"
      });
      preparedSurfaceReasonValue = preparedSurface?.reasonCode ?? null;
      recordPreparedSurfaceStep({
        preparedSurfaceReasonReadCompleted: true,
        preparedSurfaceReasonValue,
        preparedSurfaceContinuationLastCompletedStep: "preparedSurface reason read",
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface canvas read"
      });
    } catch (error) {
      const preparedSurfaceReasonReadReasonCode =
        "PREPARED_SURFACE_REASON_READ_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction: "preparedSurface.reasonCode read",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceReasonReadReasonCode,
        preparedSurfaceGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceReasonReadReasonCode
      );
    }

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceCanvasReadAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface canvas read"
      });
      preparedSurfacePayload = preparedSurface?.surface ?? null;
      preparedSurfaceCanvas = preparedSurfacePayload?.canvas ?? null;
      recordPreparedSurfaceStep({
        preparedSurfaceCanvasReadCompleted: true,
        preparedSurfaceCanvasPresent: !!preparedSurfaceCanvas,
        preparedSurfaceContinuationLastCompletedStep: "preparedSurface canvas read",
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface lifecycle read"
      });
    } catch (error) {
      const preparedSurfaceCanvasReadReasonCode =
        "PREPARED_SURFACE_CANVAS_READ_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction: "preparedSurface.surface.canvas read",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceCanvasReadReasonCode,
        preparedSurfaceGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceCanvasReadReasonCode
      );
    }

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceLifecycleOwnerReadAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface lifecycle read"
      });
      preparedSurfaceNestedLifecycleOwnerPresent =
        !!preparedSurfacePayload?.operationState?.lifecycleOwner ||
        !!preparedSurface?.operationState?.lifecycleOwner;
      if (preparedSurfacePayload?.lifecycleOwner) {
        preparedSurfaceLifecycleOwner = preparedSurfacePayload.lifecycleOwner;
        preparedSurfaceLifecycleOwnerSource = "preparedSurface.surface.lifecycleOwner";
        preparedSurfaceLifecycleOwnerPropertyName = "lifecycleOwner";
      } else if (preparedSurface?.lifecycleOwner) {
        preparedSurfaceLifecycleOwner = preparedSurface.lifecycleOwner;
        preparedSurfaceLifecycleOwnerSource = "preparedSurface.lifecycleOwner";
        preparedSurfaceLifecycleOwnerPropertyName = "lifecycleOwner";
      } else if (preparedSurfacePayload?.operationState?.lifecycleOwner) {
        preparedSurfaceLifecycleOwner =
          preparedSurfacePayload.operationState.lifecycleOwner;
        preparedSurfaceLifecycleOwnerSource =
          "preparedSurface.surface.operationState.lifecycleOwner";
        preparedSurfaceLifecycleOwnerPropertyName = "operationState.lifecycleOwner";
      } else if (preparedSurface?.operationState?.lifecycleOwner) {
        preparedSurfaceLifecycleOwner =
          preparedSurface.operationState.lifecycleOwner;
        preparedSurfaceLifecycleOwnerSource =
          "preparedSurface.operationState.lifecycleOwner";
        preparedSurfaceLifecycleOwnerPropertyName = "operationState.lifecycleOwner";
      }
      const currentRefsLifecycleOwnerPresentAfterSurfacePreparation =
        !!currentRefs.lifecycleOwner;
      if (currentRefsLifecycleOwnerPresentAfterSurfacePreparation) {
        payloadLifecycleOwner = currentRefs.lifecycleOwner;
        payloadLifecycleOwnerResolutionSource = "currentRefs.lifecycleOwner";
      } else if (preparedSurfaceLifecycleOwner) {
        payloadLifecycleOwner = preparedSurfaceLifecycleOwner;
        payloadLifecycleOwnerResolutionSource =
          preparedSurfaceLifecycleOwnerSource;
      }
      recordPreparedSurfaceStep({
        preparedSurfaceLifecycleOwnerReadCompleted: true,
        preparedSurfaceLifecycleOwnerPresent: !!preparedSurfaceLifecycleOwner,
        preparedSurfaceLifecycleOwnerSource,
        preparedSurfaceLifecycleOwnerPropertyName,
        preparedSurfaceNestedLifecycleOwnerPresent,
        currentRefsLifecycleOwnerPresentAfterSurfacePreparation,
        payloadLifecycleOwnerResolved: !!payloadLifecycleOwner,
        payloadLifecycleOwnerResolutionSource,
        payloadLifecycleOwnerResolutionFailureReason: payloadLifecycleOwner
          ? null
          : "LIFECYCLE_OWNER_SOURCE_UNRESOLVED",
        preparedSurfaceContinuationLastCompletedStep:
          "preparedSurface lifecycle read",
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface map read"
      });
    } catch (error) {
      const preparedSurfaceLifecycleReadReasonCode =
        "PREPARED_SURFACE_LIFECYCLE_READ_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction:
          "preparedSurface.surface.lifecycleOwner read",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceLifecycleReadReasonCode,
        preparedSurfaceGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceLifecycleReadReasonCode
      );
    }

    try {
      recordPostLifecycleOwnerStep({
        resolvedLifecycleOwnerLocalAssignmentAttempted: true,
        postLifecycleOwnerContinuationEntered: true,
        postLifecycleOwnerNextFunction: "resolved lifecycle owner local assignment",
        postLifecycleOwnerNextExpectedStep:
          "resolved lifecycle owner local assignment"
      });
      resolvedLifecycleOwner = payloadLifecycleOwner;
      recordPostLifecycleOwnerStep({
        resolvedLifecycleOwnerLocalAssignmentCompleted: true,
        resolvedLifecycleOwnerIdentityType: describeValueType(resolvedLifecycleOwner),
        resolvedLifecycleOwnerMatchesCurrentRefs:
          resolvedLifecycleOwner === currentRefs.lifecycleOwner,
        postLifecycleOwnerLastCompletedStep:
          "resolved lifecycle owner local assignment",
        postLifecycleOwnerNextExpectedStep:
          "currentRefs.lifecycleOwner identity comparison",
        postLifecycleOwnerNextFunction:
          "currentRefs.lifecycleOwner identity comparison"
      });
      notifyPostLifecycleOwnerContinuationHook(
        "afterResolvedLifecycleOwnerLocalAssignment",
        {
          resolvedLifecycleOwner,
          currentRefs
        }
      );
      recordPostLifecycleOwnerStep({
        postLifecycleOwnerLastCompletedStep:
          "currentRefs.lifecycleOwner identity comparison",
        postLifecycleOwnerNextExpectedStep: "preparedSurface map read",
        postLifecycleOwnerNextFunction: "preparedSurface map read"
      });
    } catch (error) {
      const resolvedLifecycleOwnerAssignmentReasonCode =
        "RESOLVED_LIFECYCLE_OWNER_ASSIGNMENT_EXCEPTION";
      recordPostLifecycleOwnerStep({
        postLifecycleOwnerFailureFunction:
          "resolved lifecycle owner local assignment",
        postLifecycleOwnerExceptionName: error?.name ?? "Error",
        postLifecycleOwnerExceptionMessage: error?.message ?? null,
        postLifecycleOwnerExceptionReasonCode:
          resolvedLifecycleOwnerAssignmentReasonCode,
        postLifecycleOwnerSetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        resolvedLifecycleOwnerAssignmentReasonCode
      );
    }

    try {
      recordPreparedSurfaceStep({
        preparedSurfaceMapReadAttempted: true,
        preparedSurfaceContinuationNextExpectedStep: "preparedSurface map read"
      });
      preparedSurfaceMap = preparedSurfacePayload?.map ?? null;
      recordPreparedSurfaceStep({
        preparedSurfaceMapReadCompleted: true,
        preparedSurfaceMapPresent: !!preparedSurfaceMap,
        preparedSurfaceContinuationLastCompletedStep: "preparedSurface map read",
        preparedSurfaceContinuationNextExpectedStep: "payload assembly entry"
      });
    } catch (error) {
      const preparedSurfaceMapReadReasonCode =
        "PREPARED_SURFACE_MAP_READ_EXCEPTION";
      recordPreparedSurfaceStep({
        preparedSurfaceContinuationFailureFunction: "preparedSurface.surface.map read",
        preparedSurfaceContinuationExceptionName: error?.name ?? "Error",
        preparedSurfaceContinuationExceptionMessage: error?.message ?? null,
        preparedSurfaceContinuationExceptionReasonCode:
          preparedSurfaceMapReadReasonCode,
        preparedSurfaceGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceMapReadReasonCode
      );
    }

    try {
      recordPostMapReadStep({
        postPreparedSurfaceMapReadContinuationEntered: true,
        postPreparedSurfaceMapReadNextFunction: "preparedSurfacePayload local creation",
        postMapReadNextExpectedStatement:
          "preparedSurfacePayload local creation"
      });
      preparedSurfacePayloadLocal = preparedSurfacePayload;
      recordPostMapReadStep({
        preparedSurfacePayloadLocalCreationAttempted: true,
        preparedSurfacePayloadLocalCreationCompleted: true,
        preparedSurfacePayloadLocalType: describeValueType(
          preparedSurfacePayloadLocal
        ),
        postMapReadLastCompletedStatement:
          "preparedSurfacePayload local creation",
        postMapReadNextExpectedStatement: "preparedSurfaceMap local assignment",
        postPreparedSurfaceMapReadNextFunction:
          "preparedSurfaceMap local assignment"
      });
      preparedSurfaceMapLocal = preparedSurfaceMap;
      recordPostMapReadStep({
        preparedSurfaceMapLocalAssignmentAttempted: true,
        preparedSurfaceMapLocalAssignmentCompleted: true,
        postMapReadLastCompletedStatement:
          "preparedSurfaceMap local assignment",
        postMapReadNextExpectedStatement: "preparedSurfaceCanvas local assignment",
        postPreparedSurfaceMapReadNextFunction:
          "preparedSurfaceCanvas local assignment"
      });
      preparedSurfaceCanvasLocal = preparedSurfaceCanvas;
      recordPostMapReadStep({
        preparedSurfaceCanvasLocalAssignmentAttempted: true,
        preparedSurfaceCanvasLocalAssignmentCompleted: true,
        postMapReadLastCompletedStatement:
          "preparedSurfaceCanvas local assignment",
        postMapReadNextExpectedStatement: "preparedSurfaceOwner local assignment",
        postPreparedSurfaceMapReadNextFunction:
          "preparedSurfaceOwner local assignment"
      });
      preparedSurfaceOwnerLocal = resolvedLifecycleOwner;
      recordPostMapReadStep({
        preparedSurfaceOwnerLocalAssignmentAttempted: true,
        preparedSurfaceOwnerLocalAssignmentCompleted: true,
        postMapReadLastCompletedStatement:
          "preparedSurfaceOwner local assignment",
        postMapReadNextExpectedStatement:
          "prepared surface validity gate",
        postPreparedSurfaceMapReadNextFunction:
          "prepared surface validity gate"
      });
      notifyPostLifecycleOwnerContinuationHook("afterPreparedSurfaceMapReadLocals", {
        preparedSurfacePayloadLocal,
        preparedSurfaceMapLocal,
        preparedSurfaceCanvasLocal,
        preparedSurfaceOwnerLocal
      });
    } catch (error) {
      const payloadLocalCreationReasonCode = "PAYLOAD_LOCAL_CREATION_EXCEPTION";
      recordPostMapReadStep({
        postMapReadFailureFunction: "payload local creation",
        postMapReadExceptionName: error?.name ?? "Error",
        postMapReadExceptionMessage: error?.message ?? null,
        postMapReadExceptionReasonCode: payloadLocalCreationReasonCode,
        postMapReadSetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        payloadLocalCreationReasonCode
      );
    }

    if (preparedSurfaceStatusValue !== "prepared" || !preparedSurfacePayload) {
      recordPostMapReadStep({
        postMapReadLastCompletedStatement: "prepared surface validity gate",
        postMapReadNextExpectedStatement: "currentRefs.surface assignment",
        postPreparedSurfaceMapReadNextFunction: "currentRefs.surface assignment"
      });
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.prepareOneFrameSurface",
        adapterEarlyReturnReason:
          preparedSurfaceReasonValue ?? "SURFACE_PREPARATION_FAILED",
        adapterExecutionCompletionReason:
          preparedSurfaceReasonValue ?? "SURFACE_PREPARATION_FAILED",
        payloadAssemblyNotReachedBranchReason:
          preparedSurfaceReasonValue ?? "SURFACE_PREPARATION_FAILED",
        payloadAssemblyNotReachedReturnReason:
          preparedSurfaceReasonValue ?? "SURFACE_PREPARATION_FAILED"
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        preparedSurfaceReasonValue ?? "SURFACE_PREPARATION_FAILED"
      );
    }

    currentRefs.surface = preparedSurfacePayloadLocal;
    recordPostMapReadStep({
      postMapReadLastCompletedStatement: "currentRefs.surface assignment",
      postMapReadNextExpectedStatement:
        "surface preparation completion milestones",
      postPreparedSurfaceMapReadNextFunction:
        "surface preparation completion milestones"
    });
    markSnapshotHandoffMilestone("reachedSurfacePreparationCompletion");
    markInvocationBoundaryMilestone("reachedSurfacePrepared");
    recordPostMapReadStep({
      postMapReadLastCompletedStatement:
        "surface preparation completion milestones",
      postMapReadNextExpectedStatement: "surfacePrepared status write",
      postPreparedSurfaceMapReadNextFunction: "surfacePrepared status write"
    });
    updateStatus({
      surfacePrepared: true
    });
    recordPostMapReadStep({
      postMapReadObjectSpreadInvoked: true,
      postMapReadLastCompletedStatement: "surfacePrepared status write",
      postMapReadNextExpectedStatement: "lifecycle translation",
      postPreparedSurfaceMapReadNextFunction: "lifecycle translation"
    });

    try {
      recordLifecycleGateStep({
        lifecycleTranslationFunctionSelected: true,
        lifecycleGateNextExpectedStep: "lifecycle translation function entry"
      });
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep:
          "adapter.translatePreparedSurfaceToLifecycleBundle",
        nextFunctionAfterAdapterEntry:
          "adapter.translatePreparedSurfaceToLifecycleBundle",
        postDrawBridgeNextFunction:
          "adapter.translatePreparedSurfaceToLifecycleBundle"
      });
      translationResult = traceInvocationBoundary(
        "adapter.translatePreparedSurfaceToLifecycleBundle",
        () => {
          recordLifecycleGateStep({
            lifecycleTranslationFunctionEntered: true,
            lifecycleGateLastCompletedStep:
              "lifecycle translation function entry",
            lifecycleGateNextExpectedStep:
              "lifecycle translation function return"
          });
          markInvocationBoundaryMilestone("reachedSurfaceOwnershipConversion");
          return lifecycleTranslation.translatePreparedSurfaceToLifecycleBundle({
            preparedSurface: preparedSurfacePayloadLocal,
            lifecycleOwner
          });
        }
      );
      syncLifecycleTranslationTraceSnapshot();
      recordLifecycleGateStep({
        lifecycleTranslationFunctionReturned: true,
        lifecycleTranslationResultType: describeValueType(translationResult),
        lifecycleTranslationResultStatus: translationResult?.outcome ?? null,
        lifecycleGateLastCompletedStep:
          "lifecycle translation function return",
        lifecycleGateNextExpectedStep:
          "lifecycle registration state derivation"
      });
      recordPostMapReadStep({
        postMapReadObjectSpreadInvoked: true,
        postMapReadLastCompletedStatement: "lifecycle translation",
        postMapReadNextExpectedStatement:
          "lifecycle registration state derivation",
        postPreparedSurfaceMapReadNextFunction:
          "lifecycle registration state derivation"
      });
    } catch (error) {
      syncLifecycleTranslationTraceSnapshot();
      translationResult = {
        outcome: "failed_closed",
        reasonCode: toReasonCode(error, "LIFECYCLE_TRANSLATION_EXCEPTION")
      };
      recordLifecycleGateStep({
        lifecycleGateFailureFunction:
          "adapter.translatePreparedSurfaceToLifecycleBundle",
        lifecycleGateExceptionName: error?.name ?? "Error",
        lifecycleGateExceptionMessage: error?.message ?? null,
        lifecycleGateExceptionReasonCode: toReasonCode(
          error,
          "LIFECYCLE_TRANSLATION_EXCEPTION"
        )
      });
    }

    recordLifecycleGateStep({
      lifecycleRegistrationStateAssignmentAttempted: true,
      lifecycleGateNextExpectedStep:
        "lifecycle registration state derivation"
    });
    lifecycleRegistered =
      translationResult?.lifecycleRegistrationSucceeded === true ||
      translationResult?.lifecycleRegistrationAttempted === true;
    recordLifecycleGateStep({
      lifecycleRegistrationStateAssignmentCompleted: true,
      lifecycleRegistrationStateValue: lifecycleRegistered,
      lifecycleGateLastCompletedStep:
        "lifecycle registration state derivation",
      lifecycleGateNextExpectedStep: "lifecycle translation gate"
    });
    recordPostMapReadStep({
      postMapReadLastCompletedStatement:
        "lifecycle registration state derivation",
      postMapReadNextExpectedStatement: "lifecycle translation gate",
      postPreparedSurfaceMapReadNextFunction: "lifecycle translation gate"
    });

    recordLifecycleGateStep({
      lifecycleTranslationGateEntered: true,
      lifecycleGateNextExpectedStep: "lifecycle translation gate operand one"
    });
    const lifecycleTranslationGateOperandOneValue =
      translationResult?.outcome !== "translated";
    recordLifecycleGateStep({
      lifecycleTranslationGateOperandOneEvaluated: true,
      lifecycleTranslationGateOperandOneValue,
      lifecycleGateLastCompletedStep:
        "lifecycle translation gate operand one",
      lifecycleGateNextExpectedStep: "lifecycle translation gate operand two"
    });
    const lifecycleTranslationGateOperandTwoValue =
      !translationResult?.lifecycleBundle;
    recordLifecycleGateStep({
      lifecycleTranslationGateOperandTwoEvaluated: true,
      lifecycleTranslationGateOperandTwoValue,
      lifecycleGateLastCompletedStep:
        "lifecycle translation gate operand two",
      lifecycleGateNextExpectedStep: "lifecycle translation gate branch"
    });

    if (
      lifecycleTranslationGateOperandOneValue ||
      lifecycleTranslationGateOperandTwoValue
    ) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep:
          "adapter.translatePreparedSurfaceToLifecycleBundle",
        adapterEarlyReturnReason:
          translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED",
        adapterExecutionCompletionReason:
          translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED",
        payloadAssemblyNotReachedBranchReason:
          translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED",
        payloadAssemblyNotReachedReturnReason:
          translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED"
      });
      recordLifecycleGateStep({
        lifecycleTranslationObjectSpreadAttempted: true,
        lifecycleTranslationObjectSpreadCompleted: true,
        lifecycleGateObjectSpreadInvoked: true,
        lifecycleGateFailureFunction: "lifecycle translation gate",
        lifecycleGateExceptionReasonCode:
          translationResult?.reasonCode ?? "LIFECYCLE_TRANSLATION_FAILED"
      });
      const rollbackResult = surfaceOperations.rollbackPreparedSurface({
        surface: preparedSurfacePayload
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

    recordLifecycleGateStep({
      lifecycleTranslationObjectSpreadAttempted: true,
      lifecycleTranslationObjectSpreadCompleted: true,
      lifecycleGateObjectSpreadInvoked: true,
      lifecycleGateLastCompletedStep: "lifecycle translation gate",
      lifecycleGateNextExpectedStep: "lifecycleRegistered status write"
    });
    recordPostMapReadStep({
      postMapReadLastCompletedStatement: "lifecycle translation gate",
      postMapReadNextExpectedStatement: "lifecycleRegistered status write",
      postPreparedSurfaceMapReadNextFunction: "lifecycleRegistered status write"
    });
    recordLifecycleGateStep({
      lifecycleRegisteredStatusWriteAttempted: true,
      lifecycleGateNextExpectedStep: "lifecycleRegistered status write"
    });
    updateStatus({
      lifecycleRegistered: true,
      ownershipMode:
        translationResult.lifecycleBundle.ownershipMode ??
        translationResult.ownershipMode ??
        "ONE_FRAME_SURFACE_ONLY"
    });
    recordLifecycleGateStep({
      lifecycleRegisteredStatusWriteCompleted: true,
      lifecycleGateLastCompletedStep: "lifecycleRegistered status write",
      lifecycleGateNextExpectedStep: "payload-entry trace mutation"
    });
    recordPostMapReadStep({
      postMapReadObjectSpreadInvoked: true,
      postMapReadLastCompletedStatement: "lifecycleRegistered status write",
      postMapReadNextExpectedStatement: "snapshotCompatibleMap normalization",
      postPreparedSurfaceMapReadNextFunction:
        "snapshotCompatibleMap normalization"
    });

    let snapshotBridgeResult;
    try {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.resolveSnapshotCompatibleMap",
        nextFunctionAfterAdapterEntry: "adapter.resolveSnapshotCompatibleMap",
        postDrawBridgeNextFunction: "adapter.resolveSnapshotCompatibleMap"
      });
      snapshotCompatibleMap = traceInvocationBoundary(
        "adapter.resolveSnapshotCompatibleMap",
        () => {
          markInvocationBoundaryMilestone("reachedSnapshotMapNormalization");
          return snapshotMapNormalizer(map);
        }
      );
      recordPostMapReadStep({
        postMapReadLastCompletedStatement:
          "snapshotCompatibleMap normalization",
        postMapReadNextExpectedStatement: "payload entry trace mutation",
        postPreparedSurfaceMapReadNextFunction:
          "payload entry trace mutation"
      });
    } catch (error) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.resolveSnapshotCompatibleMap",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "SNAPSHOT_MAP_NORMALIZATION_EXCEPTION"
        ),
        adapterExecutionCompletionReason: toReasonCode(
          error,
          "SNAPSHOT_MAP_NORMALIZATION_EXCEPTION"
        ),
        payloadAssemblyNotReachedBranchReason:
          "SNAPSHOT_MAP_NORMALIZATION_EXCEPTION",
        payloadAssemblyNotReachedReturnReason: toReasonCode(
          error,
          "SNAPSHOT_MAP_NORMALIZATION_EXCEPTION"
        ),
        handoffCreationSucceeded: false,
        handoffCreationFailureReason: toReasonCode(
          error,
          "SNAPSHOT_ARGUMENT_CONSTRUCTION_EXCEPTION"
        ),
        handoffObjectCreated: false,
        handoffObjectHasMap: false,
        handoffObjectHasCanvas: false,
        handoffObjectHasFrameSnapshot: false,
        handoffObjectHasViewportData: false,
        handoffObjectHasCallbacks: false
      });
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
      recordPostMapReadStep({
        payloadEntryTraceMutationAttempted: true,
        postMapReadObjectSpreadInvoked: true,
        postMapReadNextExpectedStatement: "payload entry marker write",
        postPreparedSurfaceMapReadNextFunction: "payload entry marker write"
      });
      notifyPostLifecycleOwnerContinuationHook("beforePayloadEntryTraceMutation", {
        preparedSurfacePayloadLocal,
        preparedSurfaceMapLocal,
        preparedSurfaceCanvasLocal,
        preparedSurfaceOwnerLocal,
        snapshotCompatibleMap
      });
      recordPostLifecycleOwnerStep({
        payloadEntryMarkerWriteAttempted: true,
        postLifecycleOwnerNextFunction: "payload entry marker write",
        postLifecycleOwnerNextExpectedStep: "payload entry marker write"
      });
      recordPostMapReadStep({
        payloadEntryTraceMutationCompleted: true,
        postMapReadLastCompletedStatement: "payload entry trace mutation",
        postMapReadNextExpectedStatement: "payload entry marker write",
        postPreparedSurfaceMapReadNextFunction: "payload entry marker write"
      });
      notifyPostLifecycleOwnerContinuationHook("beforePayloadEntryMarkerWrite", {
        resolvedLifecycleOwner,
        currentRefs
      });
      recordPreparedSurfaceStep({
        payloadAssemblyEntryAttempted: true,
        preparedSurfaceContinuationLastCompletedStep:
          "payload assembly entry attempted",
        preparedSurfaceContinuationNextExpectedStep:
          "payload assembly guard evaluation"
      });
      recordPostLifecycleOwnerStep({
        payloadEntryMarkerWriteCompleted: true,
        postLifecycleOwnerLastCompletedStep: "payload entry marker write",
        postLifecycleOwnerNextExpectedStep: "payload context constructor",
        postLifecycleOwnerNextFunction: "payload context constructor"
      });
      notifyPostLifecycleOwnerContinuationHook("afterPayloadEntryMarkerWrite", {
        resolvedLifecycleOwner,
        currentRefs
      });
    } catch (error) {
      const payloadEntryTraceMutationReasonCode =
        error?.message === "COMPLEX_OBJECT_SPREAD_EXCEPTION"
          ? "COMPLEX_OBJECT_SPREAD_EXCEPTION"
          : error?.message === "TRACE_STATUS_MUTATION_EXCEPTION"
            ? "TRACE_STATUS_MUTATION_EXCEPTION"
            : "PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION";
      recordPostMapReadStep({
        postMapReadFailureFunction: "payload entry trace mutation",
        postMapReadExceptionName: error?.name ?? "Error",
        postMapReadExceptionMessage: error?.message ?? null,
        postMapReadExceptionReasonCode: payloadEntryTraceMutationReasonCode
      });
      const payloadEntryMarkerWriteReasonCode =
        "PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION";
      recordPostLifecycleOwnerStep({
        postLifecycleOwnerFailureFunction: "payload entry marker write",
        postLifecycleOwnerExceptionName: error?.name ?? "Error",
        postLifecycleOwnerExceptionMessage: error?.message ?? null,
        postLifecycleOwnerExceptionReasonCode:
          payloadEntryTraceMutationReasonCode,
        postLifecycleOwnerSetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        payloadEntryTraceMutationReasonCode ===
          "PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION"
          ? payloadEntryMarkerWriteReasonCode
          : payloadEntryTraceMutationReasonCode
      );
    }

    recordPayloadAssemblyStep({
      payloadAssemblyEntryFunction: "adapter.assembleSnapshotHandoffPayload",
      payloadAssemblyLastCompletedStep: "payload assembly entry attempted",
      payloadAssemblyNextFunction: "payload context creation"
    });

    let surfaceInput;
    let surfaceInputHasCanvas;
    let surfaceInputHasMap;
    let surfaceInputHasViewport;
    let viewportInput;
    let handoffMapInput;
    let handoffCanvasInput;
    let handoffSnapshotCallbackAssigned;
    let handoffDrawCallbackAssigned;
    let payloadContextHasDrawOperation;
    let payloadContextHasCallbacks;
    try {
      recordPostLifecycleOwnerStep({
        payloadContextConstructorSelected: true,
        postLifecycleOwnerNextFunction: "payload context constructor",
        postLifecycleOwnerNextExpectedStep: "payload context constructor"
      });
      recordPayloadAssemblyStep({
        payloadAssemblyContextCreationAttempted: true,
        payloadAssemblyNextFunction: "payload context creation"
      });
      notifyPostLifecycleOwnerContinuationHook(
        "beforePayloadContextConstructor",
        {
          resolvedLifecycleOwner,
          currentRefs,
          snapshotCompatibleMap
        }
      );
      recordPostLifecycleOwnerStep({
        payloadContextConstructorEntered: true
      });
      surfaceInput = preparedSurfacePayload;
      surfaceInputHasCanvas = !!surfaceInput?.canvas;
      surfaceInputHasMap = !!surfaceInput?.map;
      surfaceInputHasViewport = !!surfaceInput?.viewport;
      viewportInput = surfaceInput?.viewport ?? snapshotCompatibleMap ?? null;
      handoffMapInput = snapshotCompatibleMap ?? null;
      handoffCanvasInput = surfaceInput?.canvas ?? null;
      handoffSnapshotCallbackAssigned = typeof snapshotBridge === "function";
      handoffDrawCallbackAssigned = typeof drawBridge === "function";
      payloadContextHasDrawOperation = !!drawOperation;
      payloadContextHasCallbacks =
        handoffSnapshotCallbackAssigned && handoffDrawCallbackAssigned;
      const payloadContextConstructorResult = {
        surfaceInput,
        viewportInput,
        handoffMapInput,
        handoffCanvasInput,
        handoffSnapshotCallbackAssigned,
        handoffDrawCallbackAssigned
      };
      recordPayloadAssemblyStep({
        payloadAssemblyContextCreationCompleted: true,
        payloadContextHasMap: !!handoffMapInput,
        payloadContextHasCanvas: !!handoffCanvasInput,
        payloadContextHasViewport: !!viewportInput,
        payloadContextHasDrawOperation,
        payloadContextHasCallbacks,
        payloadAssemblyLastCompletedStep: "payload context creation",
        payloadAssemblyNextFunction: "payload guard evaluation"
      });
      recordPostLifecycleOwnerStep({
        payloadContextConstructorReturned: true,
        payloadContextConstructorResultType: describeValueType(
          payloadContextConstructorResult
        ),
        postLifecycleOwnerLastCompletedStep: "payload context constructor",
        postLifecycleOwnerNextExpectedStep: "payload guard evaluation entered",
        postLifecycleOwnerNextFunction: "payload guard evaluation"
      });
      notifyPostLifecycleOwnerContinuationHook(
        "afterPayloadContextConstructor",
        {
          resolvedLifecycleOwner,
          currentRefs,
          payloadContextConstructorResult
        }
      );
    } catch (error) {
      const payloadContextCreationReasonCode =
        "PAYLOAD_CONTEXT_CREATION_EXCEPTION";
      recordPayloadAssemblyStep({
        payloadAssemblyFailureFunction: "payload context creation",
        payloadAssemblyExceptionName: error?.name ?? "Error",
        payloadAssemblyExceptionMessage: error?.message ?? null,
        payloadAssemblyExceptionReasonCode: payloadContextCreationReasonCode,
        payloadAssemblyGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        payloadContextCreationReasonCode
      );
    }

    let payloadAssemblyGuardSkippedReason;
    let payloadAssemblyGuardResult;
    try {
      recordPostLifecycleOwnerStep({
        postLifecycleOwnerLastCompletedStep: "payload guard evaluation entered",
        postLifecycleOwnerNextExpectedStep: "payload guard evaluation completed",
        postLifecycleOwnerNextFunction: "payload guard evaluation"
      });
      recordPayloadAssemblyStep({
        payloadGuardEvaluationAttempted: true,
        payloadAssemblyNextFunction: "payload guard evaluation"
      });
      payloadAssemblyGuardSkippedReason =
        !surfaceInput
          ? "SURFACE_INPUT_MISSING"
          : !handoffCanvasInput
            ? "SURFACE_INPUT_CANVAS_MISSING"
            : !handoffMapInput
              ? "SNAPSHOT_COMPATIBLE_MAP_MISSING"
              : !viewportInput
                ? "VIEWPORT_INPUT_MISSING"
                : !handoffSnapshotCallbackAssigned
                  ? "SNAPSHOT_CALLBACK_MISSING"
                  : !handoffDrawCallbackAssigned
                    ? "DRAW_CALLBACK_MISSING"
                    : null;
      payloadAssemblyGuardResult = payloadAssemblyGuardSkippedReason === null;
      recordPayloadAssemblyStep({
        payloadGuardEvaluationCompleted: true,
        payloadGuardResult: payloadAssemblyGuardResult,
        payloadGuardFailureReason: payloadAssemblyGuardSkippedReason,
        payloadAssemblyLastCompletedStep: "payload guard evaluation",
        payloadAssemblyNextFunction: payloadAssemblyGuardResult
          ? "handoff object creation"
          : "handoff skipped after payload guard"
      });
    } catch (error) {
      const payloadGuardEvaluationReasonCode =
        "PAYLOAD_GUARD_EVALUATION_EXCEPTION";
      recordPayloadAssemblyStep({
        payloadAssemblyFailureFunction: "payload guard evaluation",
        payloadAssemblyExceptionName: error?.name ?? "Error",
        payloadAssemblyExceptionMessage: error?.message ?? null,
        payloadAssemblyExceptionReasonCode: payloadGuardEvaluationReasonCode,
        payloadAssemblyGetterInvoked: true
      });
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        payloadGuardEvaluationReasonCode
      );
    }

    updatePreSnapshotHandoffTrace({
      adapterPostCallbackResolutionNextStep: "adapter.assembleSnapshotHandoffPayload",
      adapterEarlyReturnReason: null,
      adapterExecutionCompletionReason: "PAYLOAD_ASSEMBLY_REACHED",
      nextFunctionAfterAdapterEntry: "adapter.assembleSnapshotHandoffPayload",
      payloadAssemblyEntryMarked: true,
      handoffPayloadAssemblyStarted: false,
      handoffPayloadAssemblyFunction: "adapter.assembleSnapshotHandoffPayload",
      payloadAssemblyNotReachedBranchReason: null,
      payloadAssemblyNotReachedReturnReason: null,
      surfaceInputPresent: !!surfaceInput,
      surfaceInputHasCanvas,
      surfaceInputHasMap,
      surfaceInputHasViewport,
      handoffMapAssigned: false,
      handoffCanvasAssigned: false,
      handoffViewportAssigned: false,
      handoffSnapshotCallbackAssigned: false,
      handoffDrawCallbackAssigned: false,
      handoffCreationBranchEntered: false,
      handoffCreationSkippedReason: null,
      handoffCreationAttempted: false,
      handoffCreationSucceeded: false,
      handoffCreationFailureReason: null,
      handoffCreationFunction: "adapter.createSnapshotBridgeInput",
      handoffRequiredMapPresent: !!handoffMapInput,
      handoffRequiredCanvasPresent: !!handoffCanvasInput,
      handoffRequiredSnapshotCallbackPresent: handoffSnapshotCallbackAssigned,
      handoffRequiredDrawCallbackPresent: handoffDrawCallbackAssigned,
      handoffViewportDataPresent: !!viewportInput,
      handoffObjectHasFrameSnapshot: false,
      handoffObjectHasViewportData: false,
      handoffObjectHasCallbacks: false
    });
    recordPreparedSurfaceStep({
      payloadAssemblyEntryCompleted: true,
      preparedSurfaceContinuationLastCompletedStep: "payload assembly entry",
      preparedSurfaceContinuationNextExpectedStep: "payload assembly guard evaluation"
    });
    executionIdentityState = {
      ...executionIdentityState,
      postCallbackWrapperNextFunction: "adapter.assembleSnapshotHandoffPayload",
      postCallbackWrapperExitReason: null,
      payloadAssemblyGuardEvaluated: true,
      payloadAssemblyGuardResult,
      payloadAssemblySkippedReason: payloadAssemblyGuardSkippedReason,
      payloadAssemblyInstrumentationEntered: true
    };

    let snapshotBridgeInput;
    try {
      recordPayloadAssemblyStep({
        handoffCreationAfterGuardAttempted: true,
        payloadAssemblyNextFunction: "handoff object creation"
      });
      snapshotBridgeInput = tracePreSnapshotHandoff(
        "adapter.assembleSnapshotHandoffPayload",
        () =>
          traceInvocationBoundary("adapter.assembleSnapshotHandoffPayload", () => {
            updatePreSnapshotHandoffTrace({
              handoffPayloadAssemblyStarted: true,
              handoffMapAssigned: !!handoffMapInput,
              handoffCanvasAssigned: !!handoffCanvasInput,
              handoffViewportAssigned: !!viewportInput,
              handoffSnapshotCallbackAssigned,
              handoffDrawCallbackAssigned
            });

            if (payloadAssemblyGuardSkippedReason) {
              markAdapterPostCallbackTrace({
                adapterPostCallbackResolutionNextStep:
                  "adapter.assembleSnapshotHandoffPayload",
                adapterEarlyReturnReason: payloadAssemblyGuardSkippedReason,
                adapterExecutionCompletionReason:
                  "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED",
                handoffCreationBranchEntered: false,
                handoffCreationSkippedReason: payloadAssemblyGuardSkippedReason,
                handoffCreationAttempted: false,
                handoffCreationSucceeded: false,
                handoffCreationFailureReason: payloadAssemblyGuardSkippedReason,
                handoffObjectCreated: false,
                handoffObjectHasMap: false,
                handoffObjectHasCanvas: false,
                handoffObjectHasFrameSnapshot: false,
                handoffObjectHasViewportData: false,
                handoffObjectHasCallbacks: false
              });
              executionIdentityState = {
                ...executionIdentityState,
                postCallbackWrapperExitReason: payloadAssemblyGuardSkippedReason,
                payloadAssemblySkippedReason: payloadAssemblyGuardSkippedReason
              };
              recordPayloadAssemblyStep({
                handoffCreationAfterGuardCompleted: false,
                payloadAssemblyLastCompletedStep: "payload guard evaluation",
                payloadAssemblyNextFunction: "handoff skipped after payload guard"
              });
              return null;
            }

            updatePreSnapshotHandoffTrace({
              adapterExecutionCompletionReason: "HANDOFF_CREATION_REACHED",
              handoffCreationBranchEntered: true,
              handoffCreationSkippedReason: null,
              handoffCreationAttempted: true
            });

            return tracePreSnapshotHandoff(
              "adapter.createSnapshotBridgeInput",
              () =>
                traceInvocationBoundary("adapter.createSnapshotBridgeInput", () => {
              markInvocationBoundaryMilestone(
                    "reachedSnapshotArgumentConstruction"
                  );
                  executionIdentityState = {
                    ...executionIdentityState,
                    nextFunctionAfterAdapterEntry: "adapter.createSnapshotBridgeInput"
                  };
                  recordPayloadAssemblyStep({
                    handoffCreationAfterGuardCompleted: true,
                    payloadAssemblyLastCompletedStep: "handoff object creation",
                    payloadAssemblyNextFunction: "snapshot callback invocation"
                  });
                  return {
                    map: handoffMapInput,
                    canvas: handoffCanvasInput
                  };
                })
            );
          })
      );
    } catch (error) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.createSnapshotBridgeInput",
        adapterEarlyReturnReason: toReasonCode(
          error,
          "SNAPSHOT_ARGUMENT_CONSTRUCTION_EXCEPTION"
        ),
        adapterExecutionCompletionReason: toReasonCode(
          error,
          "SNAPSHOT_ARGUMENT_CONSTRUCTION_EXCEPTION"
        ),
        handoffCreationSucceeded: false,
        handoffCreationFailureReason: toReasonCode(
          error,
          "SNAPSHOT_ARGUMENT_CONSTRUCTION_EXCEPTION"
        ),
        handoffObjectCreated: false,
        handoffObjectHasMap: false,
        handoffObjectHasCanvas: false,
        handoffObjectHasFrameSnapshot: false,
        handoffObjectHasViewportData: false,
        handoffObjectHasCallbacks: false
      });
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        toReasonCode(error, "SNAPSHOT_ARGUMENT_CONSTRUCTION_EXCEPTION"),
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

    if (!snapshotBridgeInput) {
      markAdapterPostCallbackTrace({
        adapterPostCallbackResolutionNextStep: "adapter.assembleSnapshotHandoffPayload",
        adapterEarlyReturnReason: "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED",
        adapterExecutionCompletionReason: "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED"
      });
      const cleanupResult = lifecycleOwner.disposeOwnedResources();
      return finalize(
        "execute_developer_only_live_one_frame_adapter",
        "failed_closed",
        "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED",
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

    updatePreSnapshotHandoffTrace({
      adapterPostCallbackResolutionNextStep: "adapter.invokeSnapshotCallback",
      adapterExecutionCompletionReason: "SNAPSHOT_INVOCATION_REACHED",
      nextFunctionAfterAdapterEntry: "adapter.invokeSnapshotCallback",
      handoffCreationSucceeded: true,
      handoffObjectCreated: true,
      handoffCreationFailureReason: null,
      handoffObjectHasMap: !!snapshotBridgeInput?.map,
      handoffObjectHasCanvas: !!snapshotBridgeInput?.canvas,
      handoffObjectHasFrameSnapshot: false,
      handoffObjectHasViewportData: !!viewportInput,
      handoffObjectHasCallbacks:
        handoffSnapshotCallbackAssigned && handoffDrawCallbackAssigned,
      handoffRequiredMapPresent: !!snapshotBridgeInput?.map,
      handoffRequiredCanvasPresent: !!snapshotBridgeInput?.canvas,
      handoffRequiredSnapshotCallbackPresent: handoffSnapshotCallbackAssigned,
      handoffRequiredDrawCallbackPresent: handoffDrawCallbackAssigned,
      handoffViewportDataPresent: !!viewportInput
    });
    executionIdentityState = {
      ...executionIdentityState,
      nextFunctionAfterAdapterEntry: "adapter.invokeSnapshotCallback"
    };

    try {
      snapshotBridgeResult = traceInvocationBoundary(
        "adapter.invokeFrameSnapshotBridge",
        () => {
          markInvocationBoundaryMilestone("reachedSnapshotBridgeInvocation");
          markInvocationBoundaryMilestone(
            "reachedCreateCustom25DFrameViewportSnapshotCaller"
          );
          markSnapshotHandoffMilestone("reachedSnapshotHandoffCall");
          return tracePreSnapshotHandoff(
            "adapter.invokeSnapshotCallback",
            () =>
              traceSnapshotHandoff(
                "adapter.invokeFrameSnapshotBridge",
                () => snapshotBridge(snapshotBridgeInput),
                {
                  hasMap: !!snapshotBridgeInput?.map,
                  hasCanvas: !!snapshotBridgeInput?.canvas
                }
              ),
            {
              snapshotCallbackExists: !!snapshotBridge,
              snapshotCallbackCallable: typeof snapshotBridge === "function",
              hasMap: !!snapshotBridgeInput?.map,
              hasCanvas: !!snapshotBridgeInput?.canvas
            }
          );
        }
      );
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

    traceSnapshotHandoff(
      "adapter.assignFrameSnapshotCreated",
      () => {
        markSnapshotHandoffMilestone("reachedFrameSnapshotCreatedAssignment");
      },
      {
        hasFrameViewportSnapshot: !!frameViewportSnapshot
      }
    );

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
    getCustom25DOneFrameAdapterRuntimeIdentity,
    getCustom25DOneFrameAdapterExecutionIdentity,
    executeDeveloperOnlyLiveOneFrameAdapter,
    completeDeferredCleanup: finalizeDeferredCleanup
  });
}
