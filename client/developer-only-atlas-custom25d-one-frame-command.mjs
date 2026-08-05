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
  "ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_STATUS_001";
const RESULT_SCHEMA_ID =
  "ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001";
const READINESS_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001";
const AUTHORIZATION_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001";
const INVOCATION_BOUNDARY_TRACE_SCHEMA_ID =
  "ATLAS_CUSTOM25D_ONE_FRAME_INVOCATION_BOUNDARY_TRACE_001";
const PRE_SNAPSHOT_HANDOFF_TRACE_SCHEMA_ID =
  "ATLAS_CUSTOM25D_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE_001";
const REQUIRED_CONFIRMATION =
  "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME";
const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);
const INVOCATION_BOUNDARY_TRACE_LIMIT = 100;
const PRE_SNAPSHOT_HANDOFF_TRACE_LIMIT = 100;

function defaultSafetyFlags() {
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

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
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

function createInitialInvocationBoundaryTraceState() {
  return {
    currentDepth: 0,
    maxObservedDepth: 0,
    last100FunctionNames: [],
    last100Calls: [],
    totalEntryCount: 0,
    totalExitCount: 0,
    totalExceptionCount: 0,
    lastFailedFunctionName: null,
    previousFunctionNameBeforeFailure: null,
    lastExceptionName: null,
    lastExceptionMessage: null,
    lastExceptionReasonCode: null,
    stackOverflowDetected: false,
    reachedRunAuthorizedAtlasCustom25DOneFrame: false,
    reachedAdapterExecutePath: false,
    reachedSurfacePrepared: false,
    reachedSurfaceOwnershipConversion: false,
    reachedSnapshotBridgeProvider: false,
    reachedSnapshotMapNormalization: false,
    reachedSnapshotArgumentConstruction: false,
    reachedSnapshotBridgeInvocation: false,
    reachedCreateCustom25DFrameViewportSnapshotCaller: false,
    reasonCode: "INVOCATION_BOUNDARY_TRACE_IDLE"
  };
}

function createInitialPreSnapshotHandoffTraceState() {
  return {
    currentDepth: 0,
    maxObservedDepth: 0,
    last100FunctionNames: [],
    last100Calls: [],
    totalEntryCount: 0,
    totalExitCount: 0,
    totalExceptionCount: 0,
    lastFailedFunctionName: null,
    previousFunctionNameBeforeFailure: null,
    lastExceptionName: null,
    lastExceptionMessage: null,
    lastExceptionReasonCode: null,
    stackOverflowDetected: false,
    commandBridgePassed: false,
    commandBridgeSource: null,
    commandHasRawLeafletMapReference: false,
    adapterEntryBridgeReceived: false,
    adapterEntryBridgeSource: null,
    adapterEntryRawLeafletMapReference: false,
    snapshotCallbackExists: false,
    snapshotCallbackCallable: false,
    drawCallbackExists: false,
    drawCallbackCallable: false,
    handoffObjectCreated: false,
    handoffObjectHasMap: false,
    handoffObjectHasCanvas: false,
    reasonCode: "PRE_SNAPSHOT_HANDOFF_TRACE_IDLE"
  };
}

function cloneInvocationBoundaryTraceTail(values) {
  return values.slice(Math.max(0, values.length - INVOCATION_BOUNDARY_TRACE_LIMIT));
}

function clonePreSnapshotHandoffTraceTail(values) {
  return values.slice(Math.max(0, values.length - PRE_SNAPSHOT_HANDOFF_TRACE_LIMIT));
}

function createInvocationBoundaryTraceEvent({
  phase,
  functionName,
  depth,
  detail = null,
  reasonCode = null
}) {
  return deepFreeze({
    phase,
    functionName,
    depth,
    detail,
    reasonCode
  });
}

function createPreSnapshotHandoffTraceEvent({
  phase,
  functionName,
  depth,
  detail = null,
  reasonCode = null
}) {
  return deepFreeze({
    phase,
    functionName,
    depth,
    detail,
    reasonCode
  });
}

function createInvocationBoundaryTraceStore() {
  let state = createInitialInvocationBoundaryTraceState();

  function pushEvent(event) {
    state = {
      ...state,
      last100Calls: cloneInvocationBoundaryTraceTail([...state.last100Calls, event]),
      last100FunctionNames: cloneInvocationBoundaryTraceTail([
        ...state.last100FunctionNames,
        event.functionName
      ])
    };
  }

  function mark(milestoneName) {
    if (!Object.prototype.hasOwnProperty.call(state, milestoneName)) {
      return;
    }

    state = {
      ...state,
      [milestoneName]: true
    };
  }

  function enter(functionName, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const nextDepth = state.currentDepth + 1;
    state = {
      ...state,
      currentDepth: nextDepth,
      maxObservedDepth: Math.max(state.maxObservedDepth, nextDepth),
      totalEntryCount: state.totalEntryCount + 1,
      reasonCode: "INVOCATION_BOUNDARY_TRACE_ACTIVE"
    };

    pushEvent(
      createInvocationBoundaryTraceEvent({
        phase: "entry",
        functionName: normalizedFunctionName,
        depth: nextDepth,
        detail
      })
    );
  }

  function exit(functionName, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const depth = state.currentDepth;

    pushEvent(
      createInvocationBoundaryTraceEvent({
        phase: "exit",
        functionName: normalizedFunctionName,
        depth,
        detail
      })
    );

    state = {
      ...state,
      currentDepth: Math.max(0, state.currentDepth - 1),
      totalExitCount: state.totalExitCount + 1
    };
  }

  function exception(functionName, error, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const reasonCode = toReasonCode(error, "INVOCATION_BOUNDARY_TRACE_EXCEPTION");
    const previousFunctionNameBeforeFailure =
      state.last100FunctionNames[Math.max(0, state.last100FunctionNames.length - 1)] ??
      null;
    const stackOverflowDetected =
      reasonCode === "MAXIMUM_CALL_STACK_SIZE_EXCEEDED" ||
      reasonCode === "TRACE_MAX_DEPTH_EXCEEDED" ||
      /maximum call stack size exceeded/i.test(String(reasonCode));

    pushEvent(
      createInvocationBoundaryTraceEvent({
        phase: "exception",
        functionName: normalizedFunctionName,
        depth: state.currentDepth,
        detail,
        reasonCode
      })
    );

    state = {
      ...state,
      currentDepth: Math.max(0, state.currentDepth - 1),
      totalExitCount: state.totalExitCount + 1,
      totalExceptionCount: state.totalExceptionCount + 1,
      lastFailedFunctionName: normalizedFunctionName,
      previousFunctionNameBeforeFailure,
      lastExceptionName:
        typeof error?.name === "string" && error.name ? error.name : "Error",
      lastExceptionMessage:
        typeof error?.message === "string" && error.message ? error.message : null,
      lastExceptionReasonCode: reasonCode,
      stackOverflowDetected: state.stackOverflowDetected || stackOverflowDetected,
      reasonCode
    };
  }

  function reset(reasonCode = "INVOCATION_BOUNDARY_TRACE_RESET") {
    state = {
      ...createInitialInvocationBoundaryTraceState(),
      reasonCode
    };
    return getSnapshot();
  }

  function getSnapshot() {
    return deepFreeze({
      schemaId: INVOCATION_BOUNDARY_TRACE_SCHEMA_ID,
      currentDepth: state.currentDepth,
      maxObservedDepth: state.maxObservedDepth,
      last100FunctionNames: [...state.last100FunctionNames],
      last100Calls: [...state.last100Calls],
      totalEntryCount: state.totalEntryCount,
      totalExitCount: state.totalExitCount,
      totalExceptionCount: state.totalExceptionCount,
      lastFailedFunctionName: state.lastFailedFunctionName,
      previousFunctionNameBeforeFailure: state.previousFunctionNameBeforeFailure,
      lastExceptionName: state.lastExceptionName,
      lastExceptionMessage: state.lastExceptionMessage,
      lastExceptionReasonCode: state.lastExceptionReasonCode,
      stackOverflowDetected: state.stackOverflowDetected,
      reachedRunAuthorizedAtlasCustom25DOneFrame:
        state.reachedRunAuthorizedAtlasCustom25DOneFrame,
      reachedAdapterExecutePath: state.reachedAdapterExecutePath,
      reachedSurfacePrepared: state.reachedSurfacePrepared,
      reachedSurfaceOwnershipConversion: state.reachedSurfaceOwnershipConversion,
      reachedSnapshotBridgeProvider: state.reachedSnapshotBridgeProvider,
      reachedSnapshotMapNormalization: state.reachedSnapshotMapNormalization,
      reachedSnapshotArgumentConstruction: state.reachedSnapshotArgumentConstruction,
      reachedSnapshotBridgeInvocation: state.reachedSnapshotBridgeInvocation,
      reachedCreateCustom25DFrameViewportSnapshotCaller:
        state.reachedCreateCustom25DFrameViewportSnapshotCaller,
      reasonCode: state.reasonCode
    });
  }

  return {
    enter,
    exit,
    exception,
    mark,
    reset,
    getSnapshot
  };
}

function createPreSnapshotHandoffTraceStore() {
  let state = createInitialPreSnapshotHandoffTraceState();

  function pushEvent(event) {
    state = {
      ...state,
      last100Calls: clonePreSnapshotHandoffTraceTail([...state.last100Calls, event]),
      last100FunctionNames: clonePreSnapshotHandoffTraceTail([
        ...state.last100FunctionNames,
        event.functionName
      ])
    };
  }

  function enter(functionName, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const nextDepth = state.currentDepth + 1;
    state = {
      ...state,
      currentDepth: nextDepth,
      maxObservedDepth: Math.max(state.maxObservedDepth, nextDepth),
      totalEntryCount: state.totalEntryCount + 1,
      reasonCode: "PRE_SNAPSHOT_HANDOFF_TRACE_ACTIVE"
    };

    pushEvent(
      createPreSnapshotHandoffTraceEvent({
        phase: "entry",
        functionName: normalizedFunctionName,
        depth: nextDepth,
        detail
      })
    );
  }

  function exit(functionName, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const depth = state.currentDepth;

    pushEvent(
      createPreSnapshotHandoffTraceEvent({
        phase: "exit",
        functionName: normalizedFunctionName,
        depth,
        detail
      })
    );

    state = {
      ...state,
      currentDepth: Math.max(0, state.currentDepth - 1),
      totalExitCount: state.totalExitCount + 1
    };
  }

  function exception(functionName, error, detail = null) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const reasonCode = toReasonCode(error, "PRE_SNAPSHOT_HANDOFF_TRACE_EXCEPTION");
    const previousFunctionNameBeforeFailure =
      state.last100FunctionNames[Math.max(0, state.last100FunctionNames.length - 1)] ??
      null;
    const stackOverflowDetected =
      reasonCode === "MAXIMUM_CALL_STACK_SIZE_EXCEEDED" ||
      /maximum call stack size exceeded/i.test(String(reasonCode));

    pushEvent(
      createPreSnapshotHandoffTraceEvent({
        phase: "exception",
        functionName: normalizedFunctionName,
        depth: state.currentDepth,
        detail,
        reasonCode
      })
    );

    state = {
      ...state,
      currentDepth: Math.max(0, state.currentDepth - 1),
      totalExitCount: state.totalExitCount + 1,
      totalExceptionCount: state.totalExceptionCount + 1,
      lastFailedFunctionName: normalizedFunctionName,
      previousFunctionNameBeforeFailure,
      lastExceptionName:
        typeof error?.name === "string" && error.name ? error.name : "Error",
      lastExceptionMessage:
        typeof error?.message === "string" && error.message ? error.message : null,
      lastExceptionReasonCode: reasonCode,
      stackOverflowDetected: state.stackOverflowDetected || stackOverflowDetected,
      reasonCode
    };
  }

  function update(patch = {}) {
    state = {
      ...state,
      ...patch
    };
  }

  function reset(reasonCode = "PRE_SNAPSHOT_HANDOFF_TRACE_RESET") {
    state = {
      ...createInitialPreSnapshotHandoffTraceState(),
      reasonCode
    };
    return getSnapshot();
  }

  function getSnapshot() {
    return deepFreeze({
      schemaId: PRE_SNAPSHOT_HANDOFF_TRACE_SCHEMA_ID,
      currentDepth: state.currentDepth,
      maxObservedDepth: state.maxObservedDepth,
      last100FunctionNames: [...state.last100FunctionNames],
      last100Calls: [...state.last100Calls],
      totalEntryCount: state.totalEntryCount,
      totalExitCount: state.totalExitCount,
      totalExceptionCount: state.totalExceptionCount,
      lastFailedFunctionName: state.lastFailedFunctionName,
      previousFunctionNameBeforeFailure: state.previousFunctionNameBeforeFailure,
      lastExceptionName: state.lastExceptionName,
      lastExceptionMessage: state.lastExceptionMessage,
      lastExceptionReasonCode: state.lastExceptionReasonCode,
      stackOverflowDetected: state.stackOverflowDetected,
      commandBridgePassed: state.commandBridgePassed,
      commandBridgeSource: state.commandBridgeSource,
      commandHasRawLeafletMapReference: state.commandHasRawLeafletMapReference,
      adapterEntryBridgeReceived: state.adapterEntryBridgeReceived,
      adapterEntryBridgeSource: state.adapterEntryBridgeSource,
      adapterEntryRawLeafletMapReference: state.adapterEntryRawLeafletMapReference,
      snapshotCallbackExists: state.snapshotCallbackExists,
      snapshotCallbackCallable: state.snapshotCallbackCallable,
      drawCallbackExists: state.drawCallbackExists,
      drawCallbackCallable: state.drawCallbackCallable,
      handoffObjectCreated: state.handoffObjectCreated,
      handoffObjectHasMap: state.handoffObjectHasMap,
      handoffObjectHasCanvas: state.handoffObjectHasCanvas,
      reasonCode: state.reasonCode
    });
  }

  return {
    enter,
    exit,
    exception,
    update,
    reset,
    getSnapshot
  };
}

function ensureInvocationBoundaryTrace(globalObject = globalThis) {
  if (!globalObject) {
    return null;
  }

  if (!globalObject.__GROWGO_ATLAS_ONE_FRAME_INVOCATION_BOUNDARY_TRACE__) {
    globalObject.__GROWGO_ATLAS_ONE_FRAME_INVOCATION_BOUNDARY_TRACE__ =
      createInvocationBoundaryTraceStore();
  }

  return globalObject.__GROWGO_ATLAS_ONE_FRAME_INVOCATION_BOUNDARY_TRACE__;
}

function ensurePreSnapshotHandoffTrace(globalObject = globalThis) {
  if (!globalObject) {
    return null;
  }

  if (!globalObject.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__) {
    globalObject.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ =
      createPreSnapshotHandoffTraceStore();
  }

  return globalObject.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
}

async function traceInvocationBoundary(functionName, callback, detail = null) {
  const trace = ensureInvocationBoundaryTrace(globalThis);

  if (!trace) {
    return callback();
  }

  trace.enter(functionName, detail);
  try {
    return await callback();
  } catch (error) {
    trace.exception(functionName, error, detail);
    throw error;
  }
  finally {
    if (trace.getSnapshot().lastFailedFunctionName !== functionName) {
      trace.exit(functionName, detail);
    }
  }
}

function canonicalSafetyFlagsAreClosed(flags) {
  return (
    flags.runtimeExecutionEnabled === false &&
    flags.mapAttachmentAllowed === false &&
    flags.automaticRendererExecutionAllowed === false &&
    flags.lifecycleExecutionEnabled === false
  );
}

function deriveSafetyFlags({ readiness, authorizationStatus } = {}) {
  return deepFreeze({
    runtimeExecutionEnabled:
      readiness?.safetyFlagSnapshot?.runtimeExecutionEnabled ??
      authorizationStatus?.canonicalRuntimeExecutionEnabled ??
      false,
    mapAttachmentAllowed:
      readiness?.safetyFlagSnapshot?.mapAttachmentAllowed ??
      authorizationStatus?.canonicalMapAttachmentAllowed ??
      false,
    automaticRendererExecutionAllowed:
      readiness?.safetyFlagSnapshot?.automaticRendererExecutionAllowed ??
      authorizationStatus?.canonicalAutomaticRendererExecutionAllowed ??
      false,
    lifecycleExecutionEnabled:
      readiness?.safetyFlagSnapshot?.lifecycleExecutionEnabled ??
      authorizationStatus?.canonicalLifecycleExecutionEnabled ??
      false
  });
}

function normalizeReadiness(readiness) {
  const safetyFlags = deriveSafetyFlags({ readiness });

  if (!isObjectLike(readiness)) {
    return { ok: false, reasonCode: "MISSING_READINESS_RESULT", safetyFlags, snapshot: null };
  }

  if (readiness.schemaId !== READINESS_SCHEMA_ID) {
    return { ok: false, reasonCode: "INVALID_READINESS_RESULT", safetyFlags, snapshot: null };
  }

  if (readiness.diagnosticStatus === "blocked") {
    return {
      ok: false,
      reasonCode: readiness.reasonCode ?? "INVALID_READINESS_RESULT",
      safetyFlags,
      snapshot: null
    };
  }

  if (
    readiness.diagnosticStatus !== "resolved" ||
    readiness.reasonCode !== "RESOLVED" ||
    readiness.rendererHandoffStatus !== "ready_for_future_renderer_attachment"
  ) {
    return {
      ok: false,
      reasonCode:
        readiness?.rendererHandoff?.reasonCode ??
        readiness?.reasonCode ??
        "INVALID_READINESS_RESULT",
      safetyFlags,
      snapshot: null
    };
  }

  if (readiness.rendererConsumerAvailable !== true) {
    return { ok: false, reasonCode: "RENDERER_CONSUMER_UNAVAILABLE", safetyFlags, snapshot: null };
  }

  if (readiness.rendererIdentityValidated !== true) {
    return { ok: false, reasonCode: "RENDERER_IDENTITY_MISMATCH", safetyFlags, snapshot: null };
  }

  const snapshot = {
    regionId: readiness?.resolvedRegion?.regionId ?? null,
    packageId: readiness?.resolvedPackage?.packageId ?? null,
    packageVersion: readiness?.resolvedPackage?.packageVersion ?? null,
    packageFingerprint: readiness?.resolvedPackage?.packageFingerprint ?? null,
    recipeId: readiness?.resolvedRecipe?.recipeId ?? null,
    recipeVersion: readiness?.resolvedRecipe?.selectedVersion ?? null,
    selectorSeed: readiness?.selectorSeed ?? null
  };

  if (Object.values(snapshot).some((value) => value == null)) {
    return { ok: false, reasonCode: "INVALID_READINESS_RESULT", safetyFlags, snapshot: null };
  }

  return { ok: true, reasonCode: "READINESS_VALID", safetyFlags, snapshot: deepFreeze(snapshot) };
}

function normalizeAuthorizationStatus(status) {
  const safetyFlags = deriveSafetyFlags({ authorizationStatus: status });

  if (!isObjectLike(status)) {
    return {
      ok: false,
      reasonCode: "AUTHORIZATION_STATUS_UNAVAILABLE",
      safetyFlags,
      snapshot: null,
      sessionId: null
    };
  }

  if (status.schemaId !== AUTHORIZATION_SCHEMA_ID) {
    return {
      ok: false,
      reasonCode: "INVALID_AUTHORIZATION_STATUS",
      safetyFlags,
      snapshot: null,
      sessionId: null
    };
  }

  if (status.authorizationActive !== true) {
    return {
      ok: false,
      reasonCode: "AUTHORIZATION_NOT_ACTIVE",
      safetyFlags,
      snapshot: null,
      sessionId: status.sessionId ?? null
    };
  }

  if (status.authorizationConsumed === true) {
    return {
      ok: false,
      reasonCode: "AUTHORIZATION_ALREADY_CONSUMED",
      safetyFlags,
      snapshot: null,
      sessionId: status.sessionId ?? null
    };
  }

  if (status.authorizationInvalidated === true) {
    return {
      ok: false,
      reasonCode: status.invalidationReasonCode ?? "AUTHORIZATION_INVALIDATED",
      safetyFlags,
      snapshot: null,
      sessionId: status.sessionId ?? null
    };
  }

  if (
    status.approvedReadinessBound !== true ||
    status.currentReadinessMatchesAuthorization !== true
  ) {
    return {
      ok: false,
      reasonCode:
        status.currentReadinessReasonCode ?? "AUTHORIZATION_READINESS_MISMATCH",
      safetyFlags,
      snapshot: null,
      sessionId: status.sessionId ?? null
    };
  }

  const snapshot = {
    regionId: status.boundRegionId ?? null,
    packageId: status.boundPackageId ?? null,
    packageVersion: status.boundPackageVersion ?? null,
    packageFingerprint: status.boundPackageFingerprint ?? null,
    recipeId: status.boundRecipeId ?? null,
    recipeVersion: status.boundRecipeVersion ?? null,
    selectorSeed: status.boundSelectorSeed ?? null
  };

  if (Object.values(snapshot).some((value) => value == null)) {
    return {
      ok: false,
      reasonCode: "INVALID_AUTHORIZATION_STATUS",
      safetyFlags,
      snapshot: null,
      sessionId: status.sessionId ?? null
    };
  }

  return {
    ok: true,
    reasonCode: "AUTHORIZATION_VALID",
    safetyFlags,
    snapshot: deepFreeze(snapshot),
    sessionId: status.sessionId ?? null
  };
}

function readCommandBridgeDiagnostics() {
  const namespace = globalThis?.GrowGoDeveloperDiagnostics;
  const bridgeGetter = namespace?.getCustom25DOneFrameBridge;
  const bridgeDebugGetter = namespace?.getCustom25DOneFrameBridgeDebug;

  if (typeof bridgeGetter !== "function") {
    return {
      commandBridgeAvailable: false,
      bridgeSource: null,
      bridge: null,
      hasRawLeafletMapReference: false
    };
  }

  const bridge = bridgeGetter.call(namespace) ?? null;
  const debug =
    typeof bridgeDebugGetter === "function" ? bridgeDebugGetter.call(namespace) : null;

  return {
    commandBridgeAvailable: !!bridge && typeof bridge === "object",
    bridge,
    bridgeSource:
      (typeof debug?.bridgeSource === "string" && debug.bridgeSource) ||
      "UNKNOWN_BRIDGE_SOURCE",
    hasRawLeafletMapReference: !!bridge?.rawLeafletMapReference
  };
}

function compareIdentity(firstSnapshot, secondSnapshot) {
  if (firstSnapshot.regionId !== secondSnapshot.regionId) return "BOUND_REGION_ID_MISMATCH";
  if (firstSnapshot.packageId !== secondSnapshot.packageId) return "BOUND_PACKAGE_ID_MISMATCH";
  if (firstSnapshot.packageVersion !== secondSnapshot.packageVersion) {
    return "BOUND_PACKAGE_VERSION_MISMATCH";
  }
  if (firstSnapshot.packageFingerprint !== secondSnapshot.packageFingerprint) {
    return "BOUND_PACKAGE_FINGERPRINT_MISMATCH";
  }
  if (firstSnapshot.recipeId !== secondSnapshot.recipeId) return "BOUND_RECIPE_ID_MISMATCH";
  if (firstSnapshot.recipeVersion !== secondSnapshot.recipeVersion) {
    return "BOUND_RECIPE_VERSION_MISMATCH";
  }
  if (firstSnapshot.selectorSeed !== secondSnapshot.selectorSeed) {
    return "BOUND_SELECTOR_SEED_MISMATCH";
  }
  return null;
}

function compareReadinessSnapshots(firstSnapshot, secondSnapshot) {
  if (firstSnapshot.regionId !== secondSnapshot.regionId) return "REGION_ID_DRIFTED_BEFORE_CONSUMPTION";
  if (firstSnapshot.packageId !== secondSnapshot.packageId) return "PACKAGE_ID_DRIFTED_BEFORE_CONSUMPTION";
  if (firstSnapshot.packageVersion !== secondSnapshot.packageVersion) {
    return "PACKAGE_VERSION_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.packageFingerprint !== secondSnapshot.packageFingerprint) {
    return "PACKAGE_FINGERPRINT_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.recipeId !== secondSnapshot.recipeId) return "RECIPE_ID_DRIFTED_BEFORE_CONSUMPTION";
  if (firstSnapshot.recipeVersion !== secondSnapshot.recipeVersion) {
    return "RECIPE_VERSION_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.selectorSeed !== secondSnapshot.selectorSeed) {
    return "SELECTOR_SEED_DRIFTED_BEFORE_CONSUMPTION";
  }
  return null;
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    commandId: null,
    commandState: "idle",
    executionAttemptCount: 0,
    readinessReadCount: 0,
    readinessRevalidationCount: 0,
    authorizationValidated: false,
    authorizationSessionId: null,
    authorizationConsumeAttemptCount: 0,
    authorizationConsumed: false,
    adapterReady: false,
    adapterInvoked: false,
    surfacePrepared: false,
    lifecycleRegistered: false,
    frameSnapshotCreated: false,
    drawAttemptCount: 0,
    completedFrameCount: 0,
    animationFrameScheduleCount: 0,
    paintBoundaryReached: false,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: false,
    permanentlyClosed: false,
    secondExecutionBlocked: false,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    realListenerAdded: false,
    retentionWritten: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    commandBridgeAvailable: false,
    adapterBridgeAvailable: false,
    bridgeSource: null,
    adapterReceivedBridge: false,
    adapterBridgeResolutionFunction: null,
    hasBridge: false,
    hasRawLeafletMapReference: false,
    mapObjectType: "unresolved",
    mapValidationResult: "unresolved",
    mapValidationFailureReason: null,
    mapAvailabilityFailureFunction: null,
    surfacePreparationInputReady: false,
    confirmationAccepted: false,
    localDevelopmentHost: false,
    canonicalSafetyFlagSnapshot: defaultSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    cleanupFailureReasons: deepFreeze([...(status.cleanupFailureReasons ?? [])]),
    canonicalSafetyFlagSnapshot: deepFreeze({
      ...(status.canonicalSafetyFlagSnapshot ?? defaultSafetyFlags())
    })
  });
}

function createResult({ status, operation, outcome, reasonCode }) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    commandId: status.commandId,
    operation,
    outcome,
    reasonCode,
    commandState: status.commandState,
    confirmationAccepted: status.confirmationAccepted,
    localDevelopmentHost: status.localDevelopmentHost,
    executionAttemptCount: status.executionAttemptCount,
    readinessReadCount: status.readinessReadCount,
    readinessRevalidationCount: status.readinessRevalidationCount,
    authorizationValidated: status.authorizationValidated,
    authorizationSessionId: status.authorizationSessionId,
    authorizationConsumeAttemptCount: status.authorizationConsumeAttemptCount,
    authorizationConsumed: status.authorizationConsumed,
    adapterReady: status.adapterReady,
    adapterInvoked: status.adapterInvoked,
    surfacePrepared: status.surfacePrepared,
    lifecycleRegistered: status.lifecycleRegistered,
    frameSnapshotCreated: status.frameSnapshotCreated,
    drawAttemptCount: status.drawAttemptCount,
    completedFrameCount: status.completedFrameCount,
    animationFrameScheduleCount: status.animationFrameScheduleCount,
    paintBoundaryReached: status.paintBoundaryReached,
    cleanupAttemptCount: status.cleanupAttemptCount,
    cleanupCompleted: status.cleanupCompleted,
    cleanupFailed: status.cleanupFailed,
    cleanupFailureReasons: status.cleanupFailureReasons,
    referencesReleased: status.referencesReleased,
    permanentlyClosed: status.permanentlyClosed,
    secondExecutionBlocked: status.secondExecutionBlocked,
    boundRegionId: status.boundRegionId,
    boundPackageId: status.boundPackageId,
    boundPackageVersion: status.boundPackageVersion,
    boundPackageFingerprint: status.boundPackageFingerprint,
    boundRecipeId: status.boundRecipeId,
    boundRecipeVersion: status.boundRecipeVersion,
    boundSelectorSeed: status.boundSelectorSeed,
    realRendererInvoked: status.realRendererInvoked,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realWebglContextCreated: status.realWebglContextCreated,
    realOverlayCreated: status.realOverlayCreated,
    realListenerAdded: status.realListenerAdded,
    retentionWritten: status.retentionWritten,
    networkRequested: status.networkRequested,
    assetDownloadRequested: status.assetDownloadRequested,
    automaticInvocation: status.automaticInvocation,
    commandBridgeAvailable: status.commandBridgeAvailable,
    adapterBridgeAvailable: status.adapterBridgeAvailable,
    bridgeSource: status.bridgeSource,
    adapterReceivedBridge: status.adapterReceivedBridge,
    adapterBridgeResolutionFunction: status.adapterBridgeResolutionFunction,
    hasBridge: status.hasBridge,
    hasRawLeafletMapReference: status.hasRawLeafletMapReference,
    mapObjectType: status.mapObjectType,
    mapValidationResult: status.mapValidationResult,
    mapValidationFailureReason: status.mapValidationFailureReason,
    mapAvailabilityFailureFunction: status.mapAvailabilityFailureFunction,
    surfacePreparationInputReady: status.surfacePreparationInputReady,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

function validateAdapter(adapter) {
  if (!isObjectLike(adapter)) {
    return { ok: false, reasonCode: "ADAPTER_UNAVAILABLE" };
  }

  if (
    typeof adapter.getAdapterStatus !== "function" ||
    typeof adapter.executeDeveloperOnlyLiveOneFrameAdapter !== "function" ||
    typeof adapter.completeDeferredCleanup !== "function"
  ) {
    return { ok: false, reasonCode: "ADAPTER_UNAVAILABLE" };
  }

  const adapterStatus = adapter.getAdapterStatus();
  if (!isObjectLike(adapterStatus)) {
    return { ok: false, reasonCode: "ADAPTER_STATUS_UNAVAILABLE" };
  }

  if (adapterStatus.adapterReady !== true) {
    return { ok: false, reasonCode: "ADAPTER_NOT_READY" };
  }

  return { ok: true, status: adapterStatus };
}

export function createDeveloperOnlyAtlasCustom25DOneFrameCommand({
  hostnameProvider,
  readinessProvider,
  authorizationStatusProvider,
  authorizationConsume,
  adapterProvider,
  animationFrameProvider,
  commandIdGenerator
} = {}) {
  const getHostname = hostnameProvider ?? (() => globalThis?.location?.hostname ?? "");
  const getReadiness = readinessProvider ?? (() => null);
  const getAuthorizationStatus = authorizationStatusProvider ?? (() => null);
  const consumeAuthorization = authorizationConsume ?? (() => null);
  const getAdapter = adapterProvider ?? (() => null);
  const requestAnimationFrameOnce =
    animationFrameProvider ?? globalThis?.requestAnimationFrame ?? null;
  const createCommandId =
    commandIdGenerator ?? (() => `ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_${Date.now()}`);

  let status = freezeStatus(createInitialStatus());

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getCommandStatus() {
    return status;
  }

  function finish(operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus(patch);
    return createResult({
      status: nextStatus,
      operation,
      outcome,
      reasonCode
    });
  }

  async function runAuthorizedAtlasCustom25DOneFrame(input = {}) {
    return traceInvocationBoundary("runAuthorizedAtlasCustom25DOneFrame", async () => {
      const commandId = status.commandId ?? createCommandId();
      const executionAttemptCount = status.executionAttemptCount + 1;
      const invocationTrace = ensureInvocationBoundaryTrace(globalThis);
      invocationTrace?.mark("reachedRunAuthorizedAtlasCustom25DOneFrame");

      if (status.permanentlyClosed || status.executionAttemptCount > 0) {
        return finish(
          "run_authorized_atlas_custom25d_one_frame",
          "blocked",
          "COMMAND_ALREADY_USED",
          {
            commandId,
            commandState: "blocked",
            executionAttemptCount,
            secondExecutionBlocked: true,
            permanentlyClosed: status.permanentlyClosed || status.executionAttemptCount > 0
          }
        );
      }

      updateStatus({
        commandId,
        executionAttemptCount,
        commandState: "validating_host"
      });

      const hostname = getHostname();
      const localDevelopmentHost = isLocalDevelopmentHost(hostname);
      if (!localDevelopmentHost) {
        return finish(
          "run_authorized_atlas_custom25d_one_frame",
          "blocked",
          "LOCAL_DEVELOPMENT_HOST_REQUIRED",
          {
            commandId,
            commandState: "blocked",
            localDevelopmentHost: false,
            permanentlyClosed: true
          }
        );
      }

      updateStatus({
      commandId,
      localDevelopmentHost: true,
      commandState: "validating_confirmation"
    });

    const confirmationAccepted = input?.confirmation === REQUIRED_CONFIRMATION;
    if (typeof input?.confirmation !== "string") {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "MISSING_CONFIRMATION",
        {
          commandId,
          localDevelopmentHost: true,
          confirmationAccepted: false,
          commandState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (!confirmationAccepted) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "INVALID_CONFIRMATION",
        {
          commandId,
          localDevelopmentHost: true,
          confirmationAccepted: false,
          commandState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      localDevelopmentHost: true,
      confirmationAccepted: true,
      commandState: "validating_readiness"
    });

    const firstReadiness = normalizeReadiness(getReadiness());
    if (!canonicalSafetyFlagsAreClosed(firstReadiness.safetyFlags)) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_VIOLATED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          canonicalSafetyFlagSnapshot: firstReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    if (!firstReadiness.ok || !firstReadiness.snapshot) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        firstReadiness.reasonCode,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          canonicalSafetyFlagSnapshot: firstReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "validating_authorization",
      readinessReadCount: 1,
      canonicalSafetyFlagSnapshot: firstReadiness.safetyFlags,
      boundRegionId: firstReadiness.snapshot.regionId,
      boundPackageId: firstReadiness.snapshot.packageId,
      boundPackageVersion: firstReadiness.snapshot.packageVersion,
      boundPackageFingerprint: firstReadiness.snapshot.packageFingerprint,
      boundRecipeId: firstReadiness.snapshot.recipeId,
      boundRecipeVersion: firstReadiness.snapshot.recipeVersion,
      boundSelectorSeed: firstReadiness.snapshot.selectorSeed
    });

    const authorizationStatus = normalizeAuthorizationStatus(getAuthorizationStatus());
    const combinedSafetyFlags = deriveSafetyFlags({
      readiness: { safetyFlagSnapshot: firstReadiness.safetyFlags },
      authorizationStatus: getAuthorizationStatus()
    });

    if (!canonicalSafetyFlagsAreClosed(combinedSafetyFlags)) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_VIOLATED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          canonicalSafetyFlagSnapshot: combinedSafetyFlags,
          permanentlyClosed: true
        }
      );
    }

    if (!authorizationStatus.ok || !authorizationStatus.snapshot) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        authorizationStatus.reasonCode,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          authorizationSessionId: authorizationStatus.sessionId,
          canonicalSafetyFlagSnapshot: combinedSafetyFlags,
          permanentlyClosed: true
        }
      );
    }

    const identityMismatch = compareIdentity(
      firstReadiness.snapshot,
      authorizationStatus.snapshot
    );
    if (identityMismatch) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        identityMismatch,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          canonicalSafetyFlagSnapshot: combinedSafetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "validating_adapter",
      readinessReadCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      canonicalSafetyFlagSnapshot: combinedSafetyFlags
    });

    const adapter = getAdapter();
    const commandBridgeDiagnostics = readCommandBridgeDiagnostics();
    const preSnapshotHandoffTrace = ensurePreSnapshotHandoffTrace(globalThis);
    preSnapshotHandoffTrace?.update({
      commandBridgePassed: commandBridgeDiagnostics.commandBridgeAvailable === true,
      commandBridgeSource: commandBridgeDiagnostics.bridgeSource ?? null,
      commandHasRawLeafletMapReference:
        commandBridgeDiagnostics.hasRawLeafletMapReference === true
    });
    const adapterValidation = validateAdapter(adapter);
    if (!adapterValidation.ok) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        adapterValidation.reasonCode,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          commandBridgeAvailable:
            commandBridgeDiagnostics.commandBridgeAvailable === true,
          bridgeSource: commandBridgeDiagnostics.bridgeSource,
          canonicalSafetyFlagSnapshot: combinedSafetyFlags,
          permanentlyClosed: true
        }
      );
    }

    if (typeof requestAnimationFrameOnce !== "function") {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "REQUEST_ANIMATION_FRAME_UNAVAILABLE",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: combinedSafetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "readiness_revalidated",
      readinessReadCount: 1,
      readinessRevalidationCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      adapterReady: true,
      commandBridgeAvailable:
        commandBridgeDiagnostics.commandBridgeAvailable === true,
      bridgeSource: commandBridgeDiagnostics.bridgeSource,
      canonicalSafetyFlagSnapshot: combinedSafetyFlags
    });

    const secondReadiness = normalizeReadiness(getReadiness());
    if (!canonicalSafetyFlagsAreClosed(secondReadiness.safetyFlags)) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_VIOLATED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    if (!secondReadiness.ok || !secondReadiness.snapshot) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        secondReadiness.reasonCode,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    const driftReasonCode = compareReadinessSnapshots(
      firstReadiness.snapshot,
      secondReadiness.snapshot
    );
    if (driftReasonCode) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        driftReasonCode,
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "authorization_consumed",
      readinessReadCount: 1,
      readinessRevalidationCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      authorizationConsumeAttemptCount: 1,
      adapterReady: true,
      canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags
    });

    let consumeResult;
    try {
      consumeResult = consumeAuthorization();
    } catch (error) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "failed_closed",
        toReasonCode(error, "AUTHORIZATION_CONSUME_EXCEPTION"),
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "failed_closed",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          authorizationConsumeAttemptCount: 1,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    if (
      !consumeResult ||
      consumeResult.operation !== "consume" ||
      consumeResult.outcome !== "consumed"
    ) {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "blocked",
        consumeResult?.reasonCode ?? "AUTHORIZATION_CONSUME_BLOCKED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "blocked",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          authorizationConsumeAttemptCount: 1,
          adapterReady: true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "adapter_invoked",
      readinessReadCount: 1,
      readinessRevalidationCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      authorizationConsumeAttemptCount: 1,
      authorizationConsumed: true,
      adapterReady: true,
      canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags
    });

      let adapterResult;
      try {
        adapterResult = await traceInvocationBoundary(
          "command.adapter.executeDeveloperOnlyLiveOneFrameAdapter",
          () => {
            invocationTrace?.mark("reachedAdapterExecutePath");
            return adapter.executeDeveloperOnlyLiveOneFrameAdapter({
              deferCleanupUntilRelease: true,
              bridge: commandBridgeDiagnostics.bridge ?? null,
              bridgeSource: commandBridgeDiagnostics.bridgeSource ?? null,
              hasRawLeafletMapReference:
                commandBridgeDiagnostics.hasRawLeafletMapReference === true
            });
          }
        );
      } catch (error) {
        return finish(
          "run_authorized_atlas_custom25d_one_frame",
          "failed_closed",
          toReasonCode(error, "ADAPTER_INVOCATION_EXCEPTION"),
          {
            commandId,
            confirmationAccepted: true,
            localDevelopmentHost: true,
            commandState: "failed_closed",
            readinessReadCount: 1,
            readinessRevalidationCount: 1,
            authorizationValidated: true,
            authorizationSessionId: authorizationStatus.sessionId,
            authorizationConsumeAttemptCount: 1,
            authorizationConsumed: true,
            adapterReady: true,
            canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
            permanentlyClosed: true
          }
        );
      }

    if (adapterResult?.outcome !== "pending_cleanup") {
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        adapterResult?.outcome === "blocked" ? "blocked" : "failed_closed",
        adapterResult?.reasonCode ?? "ADAPTER_INVOCATION_FAILED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState:
            adapterResult?.outcome === "blocked" ? "blocked" : "failed_closed",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          authorizationConsumeAttemptCount: 1,
          authorizationConsumed: true,
          adapterReady: true,
          adapterInvoked: true,
          surfacePrepared: adapterResult?.surfacePrepared === true,
          lifecycleRegistered: adapterResult?.lifecycleRegistered === true,
          frameSnapshotCreated: adapterResult?.frameSnapshotCreated === true,
          drawAttemptCount: adapterResult?.drawAttemptCount ?? 0,
          completedFrameCount: adapterResult?.completedFrameCount ?? 0,
          cleanupAttemptCount: adapterResult?.cleanupAttemptCount ?? 0,
          cleanupCompleted: adapterResult?.cleanupCompleted === true,
          cleanupFailed: adapterResult?.cleanupFailed === true,
          cleanupFailureReasons: adapterResult?.cleanupFailureReasons ?? [],
          referencesReleased: adapterResult?.referencesReleased === true,
          commandBridgeAvailable:
            commandBridgeDiagnostics.commandBridgeAvailable === true,
          adapterBridgeAvailable:
            adapterResult?.adapterBridgeAvailable === true,
          bridgeSource:
            adapterResult?.bridgeSource ?? commandBridgeDiagnostics.bridgeSource,
          adapterReceivedBridge:
            adapterResult?.adapterReceivedBridge === true,
          adapterBridgeResolutionFunction:
            adapterResult?.adapterBridgeResolutionFunction ?? null,
          hasBridge: adapterResult?.hasBridge === true,
          hasRawLeafletMapReference:
            adapterResult?.hasRawLeafletMapReference === true,
          mapObjectType: adapterResult?.mapObjectType ?? "unresolved",
          mapValidationResult:
            adapterResult?.mapValidationResult ?? "unresolved",
          mapValidationFailureReason:
            adapterResult?.mapValidationFailureReason ?? null,
          mapAvailabilityFailureFunction:
            adapterResult?.mapAvailabilityFailureFunction ?? null,
          surfacePreparationInputReady:
            adapterResult?.surfacePreparationInputReady === true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

      if (
      adapterResult.completedFrameCount !== 1 ||
      adapterResult.drawAttemptCount !== 1 ||
      adapterResult.surfacePrepared !== true ||
      adapterResult.lifecycleRegistered !== true ||
      adapterResult.frameSnapshotCreated !== true
      ) {
      let cleanupResult;
      try {
        cleanupResult = adapter.completeDeferredCleanup();
      } catch (error) {
        cleanupResult = {
          outcome: "failed_closed",
          reasonCode: toReasonCode(error, "CLEANUP_EXCEPTION"),
          cleanupFailureReasons: [toReasonCode(error, "CLEANUP_EXCEPTION")]
        };
      }
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "failed_closed",
        "ADAPTER_INTEGRATION_FAILED",
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "failed_closed",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          authorizationConsumeAttemptCount: 1,
          authorizationConsumed: true,
          adapterReady: true,
          adapterInvoked: true,
          surfacePrepared: adapterResult?.surfacePrepared === true,
          lifecycleRegistered: adapterResult?.lifecycleRegistered === true,
          frameSnapshotCreated: adapterResult?.frameSnapshotCreated === true,
          drawAttemptCount: adapterResult?.drawAttemptCount ?? 0,
          completedFrameCount: adapterResult?.completedFrameCount ?? 0,
          cleanupAttemptCount: cleanupResult?.cleanupAttemptCount ?? 1,
          cleanupCompleted: cleanupResult?.cleanupCompleted === true,
          cleanupFailed: cleanupResult?.cleanupFailed === true,
          cleanupFailureReasons: cleanupResult?.cleanupFailureReasons ?? [],
          referencesReleased: cleanupResult?.referencesReleased === true,
          commandBridgeAvailable:
            commandBridgeDiagnostics.commandBridgeAvailable === true,
          adapterBridgeAvailable:
            adapterResult?.adapterBridgeAvailable === true,
          bridgeSource:
            adapterResult?.bridgeSource ?? commandBridgeDiagnostics.bridgeSource,
          adapterReceivedBridge:
            adapterResult?.adapterReceivedBridge === true,
          adapterBridgeResolutionFunction:
            adapterResult?.adapterBridgeResolutionFunction ?? null,
          hasBridge: adapterResult?.hasBridge === true,
          hasRawLeafletMapReference:
            adapterResult?.hasRawLeafletMapReference === true,
          mapObjectType: adapterResult?.mapObjectType ?? "unresolved",
          mapValidationResult:
            adapterResult?.mapValidationResult ?? "unresolved",
          mapValidationFailureReason:
            adapterResult?.mapValidationFailureReason ?? null,
          mapAvailabilityFailureFunction:
            adapterResult?.mapAvailabilityFailureFunction ?? null,
          surfacePreparationInputReady:
            adapterResult?.surfacePreparationInputReady === true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "awaiting_paint",
      readinessReadCount: 1,
      readinessRevalidationCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      authorizationConsumeAttemptCount: 1,
      authorizationConsumed: true,
      adapterReady: true,
      adapterInvoked: true,
      surfacePrepared: true,
      lifecycleRegistered: true,
      frameSnapshotCreated: true,
      drawAttemptCount: 1,
      completedFrameCount: 1,
      commandBridgeAvailable:
        commandBridgeDiagnostics.commandBridgeAvailable === true,
      adapterBridgeAvailable:
        adapterResult?.adapterBridgeAvailable === true,
      bridgeSource:
        adapterResult?.bridgeSource ?? commandBridgeDiagnostics.bridgeSource,
      adapterReceivedBridge:
        adapterResult?.adapterReceivedBridge === true,
      adapterBridgeResolutionFunction:
        adapterResult?.adapterBridgeResolutionFunction ?? null,
      hasBridge: adapterResult?.hasBridge === true,
      hasRawLeafletMapReference:
        adapterResult?.hasRawLeafletMapReference === true,
      mapObjectType: adapterResult?.mapObjectType ?? "unresolved",
      mapValidationResult:
        adapterResult?.mapValidationResult ?? "unresolved",
      mapValidationFailureReason:
        adapterResult?.mapValidationFailureReason ?? null,
      mapAvailabilityFailureFunction:
        adapterResult?.mapAvailabilityFailureFunction ?? null,
      surfacePreparationInputReady:
        adapterResult?.surfacePreparationInputReady === true,
      canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags
    });

    let animationFrameScheduled = false;

    try {
      await new Promise((resolve, reject) => {
        requestAnimationFrameOnce(() => {
          animationFrameScheduled = true;
          resolve();
        });
      });
    } catch (error) {
      let cleanupResult;
      try {
        cleanupResult = adapter.completeDeferredCleanup();
      } catch (cleanupError) {
        cleanupResult = {
          outcome: "failed_closed",
          reasonCode: toReasonCode(cleanupError, "CLEANUP_EXCEPTION"),
          cleanupFailureReasons: [toReasonCode(cleanupError, "CLEANUP_EXCEPTION")]
        };
      }
      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        "failed_closed",
        toReasonCode(error, "PAINT_BOUNDARY_SCHEDULING_FAILED"),
        {
          commandId,
          confirmationAccepted: true,
          localDevelopmentHost: true,
          commandState: "failed_closed",
          readinessReadCount: 1,
          readinessRevalidationCount: 1,
          authorizationValidated: true,
          authorizationSessionId: authorizationStatus.sessionId,
          authorizationConsumeAttemptCount: 1,
          authorizationConsumed: true,
          adapterReady: true,
          adapterInvoked: true,
          surfacePrepared: true,
          lifecycleRegistered: true,
          frameSnapshotCreated: true,
          drawAttemptCount: 1,
          completedFrameCount: 1,
          animationFrameScheduleCount: 0,
          cleanupAttemptCount: cleanupResult?.cleanupAttemptCount ?? 1,
          cleanupCompleted: cleanupResult?.cleanupCompleted === true,
          cleanupFailed: cleanupResult?.cleanupFailed === true,
          cleanupFailureReasons: cleanupResult?.cleanupFailureReasons ?? [],
          referencesReleased: cleanupResult?.referencesReleased === true,
          canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      commandId,
      confirmationAccepted: true,
      localDevelopmentHost: true,
      commandState: "cleaning_up",
      readinessReadCount: 1,
      readinessRevalidationCount: 1,
      authorizationValidated: true,
      authorizationSessionId: authorizationStatus.sessionId,
      authorizationConsumeAttemptCount: 1,
      authorizationConsumed: true,
      adapterReady: true,
      adapterInvoked: true,
      surfacePrepared: true,
      lifecycleRegistered: true,
      frameSnapshotCreated: true,
      drawAttemptCount: 1,
      completedFrameCount: 1,
      animationFrameScheduleCount: animationFrameScheduled ? 1 : 0,
      paintBoundaryReached: true,
      canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags
    });

    let cleanupResult;
    try {
      cleanupResult = adapter.completeDeferredCleanup();
    } catch (error) {
      cleanupResult = {
        outcome: "failed_closed",
        reasonCode: toReasonCode(error, "CLEANUP_EXCEPTION"),
        cleanupFailureReasons: [toReasonCode(error, "CLEANUP_EXCEPTION")]
      };
    }

    const cleanupFailureReasons = Array.isArray(cleanupResult?.cleanupFailureReasons)
      ? cleanupResult.cleanupFailureReasons
      : [];
    const cleanupCompleted = cleanupResult?.cleanupCompleted === true;
    const cleanupFailed =
      cleanupResult?.cleanupFailed === true ||
      cleanupResult?.outcome === "failed_closed" ||
      cleanupFailureReasons.length > 0;

      return finish(
        "run_authorized_atlas_custom25d_one_frame",
        cleanupFailed ? "failed_closed" : "completed",
        cleanupFailed
        ? cleanupFailureReasons[0] ?? cleanupResult?.reasonCode ?? "CLEANUP_FAILED"
        : "MANUAL_GATED_ONE_FRAME_COMMAND_COMPLETED",
      {
        commandId,
        confirmationAccepted: true,
        localDevelopmentHost: true,
        commandState: cleanupFailed ? "failed_closed" : "completed",
        readinessReadCount: 1,
        readinessRevalidationCount: 1,
        authorizationValidated: true,
        authorizationSessionId: authorizationStatus.sessionId,
        authorizationConsumeAttemptCount: 1,
        authorizationConsumed: true,
        adapterReady: true,
        adapterInvoked: true,
        surfacePrepared: true,
        lifecycleRegistered: true,
        frameSnapshotCreated: true,
        drawAttemptCount: 1,
        completedFrameCount: 1,
        animationFrameScheduleCount: animationFrameScheduled ? 1 : 0,
        paintBoundaryReached: true,
        cleanupAttemptCount: cleanupResult?.cleanupAttemptCount ?? 1,
        cleanupCompleted,
        cleanupFailed,
        cleanupFailureReasons,
        referencesReleased: cleanupResult?.referencesReleased === true,
        canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags,
        permanentlyClosed: true
      }
      );
    });
  }

  return deepFreeze({
    getCommandStatus,
    runAuthorizedAtlasCustom25DOneFrame
  });
}

export function installDeveloperOnlyAtlasCustom25DOneFrameCommand({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  command
} = {}) {
  if (
    !globalObject ||
    !command ||
    typeof command.runAuthorizedAtlasCustom25DOneFrame !== "function"
  ) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  const invocationBoundaryTrace = ensureInvocationBoundaryTrace(globalObject);
  const preSnapshotHandoffTrace = ensurePreSnapshotHandoffTrace(globalObject);

  namespace.resetCustom25DOneFrameInvocationBoundaryTrace = (reasonCode) =>
    invocationBoundaryTrace?.reset(reasonCode) ?? null;
  namespace.getCustom25DOneFrameInvocationBoundaryTrace = () =>
    invocationBoundaryTrace?.getSnapshot() ?? null;
  namespace.resetAtlasCustom25DOneFrameInvocationBoundaryTrace = (reasonCode) =>
    invocationBoundaryTrace?.reset(reasonCode) ?? null;
  namespace.getAtlasCustom25DOneFrameInvocationBoundaryTrace = () =>
    invocationBoundaryTrace?.getSnapshot() ?? null;
  namespace.resetCustom25DOneFramePreSnapshotHandoffTrace = (reasonCode) =>
    preSnapshotHandoffTrace?.reset(reasonCode) ?? null;
  namespace.getCustom25DOneFramePreSnapshotHandoffTrace = () =>
    preSnapshotHandoffTrace?.getSnapshot() ?? null;

  namespace.runAuthorizedAtlasCustom25DOneFrame =
    function runAuthorizedAtlasCustom25DOneFrameFromNamespace(input) {
      return command.runAuthorizedAtlasCustom25DOneFrame(input);
    };

  return namespace;
}
