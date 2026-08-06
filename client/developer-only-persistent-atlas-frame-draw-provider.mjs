const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_FRAME_DRAW_PROVIDER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_FRAME_DRAW_RESULT_001";

const SUPPORTED_REDRAW_REASONS = new Set([
  "initial_attach",
  "moveend",
  "zoomend",
  "resize",
  "manual_redraw",
  "follow_up_redraw"
]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }

  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  return fn;
}

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
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

function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function isDeeplyFrozen(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") {
    return true;
  }

  if (seen.has(value)) {
    return true;
  }

  if (!Object.isFrozen(value)) {
    return false;
  }

  seen.add(value);
  return Object.values(value).every((nested) => isDeeplyFrozen(nested, seen));
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function validateRedrawReason(reason) {
  const normalized = sanitizeString(reason);
  if (!normalized || !SUPPORTED_REDRAW_REASONS.has(normalized)) {
    throw Object.assign(new Error("INVALID_REDRAW_REASON"), {
      reasonCode: "INVALID_REDRAW_REASON"
    });
  }
  return normalized;
}

function snapshotIdentitySummary(snapshot) {
  return {
    sessionId: sanitizeString(snapshot?.sessionId),
    mapIdentityId: sanitizeString(snapshot?.mapIdentityId),
    lifecycleOwnerId: sanitizeString(snapshot?.lifecycleOwnerId),
    lifecycleGenerationId: sanitizeString(snapshot?.lifecycleGenerationId),
    surfaceOwnerId: sanitizeString(snapshot?.surfaceOwnerId),
    regionId: sanitizeString(snapshot?.regionId),
    packageId: sanitizeString(snapshot?.packageId),
    packageVersion: sanitizeString(snapshot?.packageVersion),
    packageFingerprint: sanitizeString(snapshot?.packageFingerprint),
    recipeId: sanitizeString(snapshot?.recipeId),
    recipeVersion: sanitizeString(snapshot?.recipeVersion),
    selectorSeed: sanitizeString(snapshot?.selectorSeed),
    snapshotId: sanitizeString(snapshot?.snapshotId),
    snapshotGenerationId: sanitizeString(snapshot?.snapshotGenerationId),
    redrawReason: sanitizeString(snapshot?.redrawReason)
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    providerReady: state.providerReady,
    drawing: state.drawing,
    invalidated: state.invalidated,
    failedClosed: state.failedClosed,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    lifecycleGenerationId: state.lifecycleGenerationId,
    surfaceOwnerId: state.surfaceOwnerId,
    canvasIdentityId: state.canvasIdentityId,
    paneIdentityId: state.paneIdentityId,
    snapshotId: state.snapshotId,
    snapshotGenerationId: state.snapshotGenerationId,
    drawGenerationId: state.drawGenerationId,
    redrawReason: state.redrawReason,
    validationAttemptCount: state.validationAttemptCount,
    validationCompletedCount: state.validationCompletedCount,
    drawAttemptCount: state.drawAttemptCount,
    drawCompletedCount: state.drawCompletedCount,
    drawRejectedCount: state.drawRejectedCount,
    mutableStateCreateAttemptCount: state.mutableStateCreateAttemptCount,
    mutableStateCreateCompletedCount: state.mutableStateCreateCompletedCount,
    positionAdaptAttemptCount: state.positionAdaptAttemptCount,
    positionAdaptCompletedCount: state.positionAdaptCompletedCount,
    drawStateReleaseAttemptCount: state.drawStateReleaseAttemptCount,
    drawStateReleaseCompletedCount: state.drawStateReleaseCompletedCount,
    recursiveDrawDetected: state.recursiveDrawDetected,
    parallelDrawDetected: state.parallelDrawDetected,
    readonlyPositionFallbackUsed: state.readonlyPositionFallbackUsed,
    rawBrowserReferenceDetected: state.rawBrowserReferenceDetected,
    snapshotMutationDetected: state.snapshotMutationDetected,
    lastPositionAdapterPath: state.lastPositionAdapterPath,
    lastDrawProviderReason: state.lastDrawProviderReason,
    lastFailureReason: state.lastFailureReason,
    referencesReleased: state.referencesReleased,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function createResult({
  drawCompleted,
  drawReason,
  snapshotId,
  snapshotGenerationId,
  drawGenerationId,
  canvasIdentityId,
  lifecycleOwnerId,
  startedAt,
  completedAt,
  durationMs,
  positionAdapterPath,
  drawProviderReason,
  failureReason
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    drawCompleted,
    drawReason,
    snapshotId,
    snapshotGenerationId,
    drawGenerationId,
    canvasIdentityId,
    lifecycleOwnerId,
    startedAt,
    completedAt,
    durationMs,
    positionAdapterPath,
    drawProviderReason,
    failureReason
  });
}

function readDeps(provider, required = []) {
  const state = provider.__state;
  const deps = provider.__deps;
  const availability = required.every((name) => isAvailableFunction(deps[name]));
  state.providerReady = availability;

  if (!availability) {
    state.lastFailureReason = "DRAW_PROVIDER_UNAVAILABLE";
    throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
      reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
    });
  }

  return deps;
}

function syncState(provider) {
  const state = provider.__state;
  const internal = provider.__internal;
  state.drawing = internal.isDrawing;
  state.referencesReleased = internal.mutableDrawState == null;
}

function sanitizeTraceString(value) {
  return value == null ? null : String(value);
}

function sanitizeTraceStack(error) {
  if (typeof error?.stack !== "string" || !error.stack.trim()) {
    return null;
  }

  return error.stack
    .split("\n")
    .slice(0, 12)
    .map((line) => line.trim())
    .join("\n");
}

function recordStepTrace(provider, patch = {}) {
  const recorder = provider?.__deps?.stepTraceRecorder;
  if (typeof recorder !== "function") {
    return;
  }

  recorder(
    deepFreeze({
      step: sanitizeTraceString(patch.step),
      phase: sanitizeTraceString(patch.phase) ?? "persistent_first_draw",
      timestamp:
        sanitizeTraceString(patch.timestamp) ??
        sanitizeTraceString(provider?.__deps?.timeProvider?.()) ??
        null,
      redrawReason: sanitizeTraceString(patch.redrawReason) ?? null,
      snapshotId: sanitizeTraceString(patch.snapshotId) ?? null,
      snapshotGenerationId:
        sanitizeTraceString(patch.snapshotGenerationId) ?? null,
      lifecycleOwnerId: sanitizeTraceString(patch.lifecycleOwnerId) ?? null,
      surfaceOwnerId: sanitizeTraceString(patch.surfaceOwnerId) ?? null,
      canvasIdentityId: sanitizeTraceString(patch.canvasIdentityId) ?? null,
      thrownErrorName: sanitizeTraceString(patch.thrownErrorName) ?? null,
      thrownErrorMessage: sanitizeTraceString(patch.thrownErrorMessage) ?? null,
      thrownErrorStack: sanitizeTraceString(patch.thrownErrorStack) ?? null,
      normalizedReasonCode:
        sanitizeTraceString(patch.normalizedReasonCode) ?? null
    })
  );
}

function setState(provider, next) {
  const state = provider.__state;
  state.state = next;
  state.invalidated = next === "invalidated";
  state.failedClosed = next === "failed_closed";
  syncState(provider);
}

function sanitizeValidatorResult(result, fallbackReason) {
  if (!result || typeof result !== "object") {
    throw Object.assign(new Error(fallbackReason), {
      reasonCode: fallbackReason
    });
  }

  if (result.ok === false || result.matches === false || result.authorized === false) {
    throw Object.assign(new Error(toReasonCode(result, fallbackReason)), {
      reasonCode: toReasonCode(result, fallbackReason)
    });
  }

  return result;
}

function copyMutablePosition(snapshot) {
  return {
    x: Number(snapshot.canvasLayerPositionX ?? 0),
    y: Number(snapshot.canvasLayerPositionY ?? 0)
  };
}

function createMutableSnapshotScalars(snapshot) {
  return {
    viewportWidth: Number(snapshot.viewportWidth ?? 0),
    viewportHeight: Number(snapshot.viewportHeight ?? 0),
    pixelRatio: Number(snapshot.pixelRatio ?? 1),
    zoom: Number(snapshot.zoom ?? 0),
    centerLatitude: Number(snapshot.centerLatitude ?? 0),
    centerLongitude: Number(snapshot.centerLongitude ?? 0),
    pixelOriginX: Number(snapshot.pixelOriginX ?? 0),
    pixelOriginY: Number(snapshot.pixelOriginY ?? 0),
    projectedViewportBounds:
      snapshot.projectedViewportBounds == null
        ? null
        : {
            northWestLatitude: Number(
              snapshot.projectedViewportBounds.northWestLatitude ?? 0
            ),
            northWestLongitude: Number(
              snapshot.projectedViewportBounds.northWestLongitude ?? 0
            ),
            southEastLatitude: Number(
              snapshot.projectedViewportBounds.southEastLatitude ?? 0
            ),
            southEastLongitude: Number(
              snapshot.projectedViewportBounds.southEastLongitude ?? 0
            )
          },
    canvasLayerPosition: copyMutablePosition(snapshot)
  };
}

export function createPersistentAtlasFrameDrawProvider({
  snapshotValidator = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  retainedSurfaceValidator = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  lifecycleOwnerValidator = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  authorizationValidator = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  snapshotAwareDrawProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  mutableDrawStateProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  canvasPositionAdapter = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  drawStateReleaseProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  timeProvider = unavailable("DRAW_PROVIDER_UNAVAILABLE"),
  stepTraceRecorder = null
} = {}) {
  const state = {
    state: "idle",
    providerReady: false,
    drawing: false,
    invalidated: false,
    failedClosed: false,
    sessionId: null,
    mapIdentityId: null,
    lifecycleOwnerId: null,
    lifecycleGenerationId: null,
    surfaceOwnerId: null,
    canvasIdentityId: null,
    paneIdentityId: null,
    snapshotId: null,
    snapshotGenerationId: null,
    drawGenerationId: null,
    redrawReason: null,
    validationAttemptCount: 0,
    validationCompletedCount: 0,
    drawAttemptCount: 0,
    drawCompletedCount: 0,
    drawRejectedCount: 0,
    mutableStateCreateAttemptCount: 0,
    mutableStateCreateCompletedCount: 0,
    positionAdaptAttemptCount: 0,
    positionAdaptCompletedCount: 0,
    drawStateReleaseAttemptCount: 0,
    drawStateReleaseCompletedCount: 0,
    recursiveDrawDetected: false,
    parallelDrawDetected: false,
    readonlyPositionFallbackUsed: false,
    rawBrowserReferenceDetected: false,
    snapshotMutationDetected: false,
    lastPositionAdapterPath: null,
    lastDrawProviderReason: null,
    lastFailureReason: null,
    referencesReleased: true
  };

  const internal = {
    isDrawing: false,
    callDepth: 0,
    mutableDrawState: null,
    invalidationReason: null
  };

  return Object.freeze({
    __growgoPersistentAtlasFrameDrawProvider: true,
    __state: state,
    __internal: internal,
    __deps: {
      snapshotValidator,
      retainedSurfaceValidator,
      lifecycleOwnerValidator,
      authorizationValidator,
      snapshotAwareDrawProvider,
      mutableDrawStateProvider,
      canvasPositionAdapter,
      drawStateReleaseProvider,
      timeProvider,
      stepTraceRecorder
    }
  });
}

export function validatePersistentAtlasDrawInputs(
  provider,
  {
    snapshot,
    retainedSurface,
    lifecycleOwner,
    authorization,
    drawGenerationId
  } = {}
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
      reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
    });
  }

  state.validationAttemptCount += 1;
  state.rawBrowserReferenceDetected = false;
  state.snapshotMutationDetected = false;
  state.lastFailureReason = null;

  if (state.invalidated) {
    throw Object.assign(new Error("DRAW_PROVIDER_INVALIDATED"), {
      reasonCode: "DRAW_PROVIDER_INVALIDATED"
    });
  }

  if (internal.callDepth > 0 && internal.isDrawing) {
    state.recursiveDrawDetected = true;
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("RECURSIVE_DRAW_DETECTED"), {
      reasonCode: "RECURSIVE_DRAW_DETECTED"
    });
  }

  if (internal.isDrawing) {
    state.parallelDrawDetected = true;
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("DRAW_ALREADY_IN_PROGRESS"), {
      reasonCode: "DRAW_ALREADY_IN_PROGRESS"
    });
  }

  const deps = readDeps(provider, [
    "snapshotValidator",
    "retainedSurfaceValidator",
    "lifecycleOwnerValidator",
    "authorizationValidator"
  ]);

  setState(provider, "validating");

  const redrawReason = validateRedrawReason(snapshot?.redrawReason);

  if (!isDeeplyFrozen(snapshot)) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("INVALID_DRAW_INPUT"), {
      reasonCode: "INVALID_DRAW_INPUT"
    });
  }

  if (!isSerializable(snapshot)) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("INVALID_DRAW_INPUT"), {
      reasonCode: "INVALID_DRAW_INPUT"
    });
  }

  const snapshotValidation = sanitizeValidatorResult(
    deps.snapshotValidator({ snapshot, drawGenerationId }),
    "SNAPSHOT_VALIDATION_FAILED"
  );
  const retainedSurfaceValidation = sanitizeValidatorResult(
    deps.retainedSurfaceValidator({ retainedSurface }),
    "SURFACE_VALIDATION_FAILED"
  );
  const lifecycleValidation = sanitizeValidatorResult(
    deps.lifecycleOwnerValidator({ lifecycleOwner }),
    "LIFECYCLE_VALIDATION_FAILED"
  );
  const authorizationValidation = sanitizeValidatorResult(
    deps.authorizationValidator({ authorization, redrawReason, drawGenerationId }),
    "AUTHORIZATION_DENIED"
  );

  const snapshotIdentity = snapshotIdentitySummary(snapshot);

  const mismatches = [
    [
      sanitizeString(snapshotValidation.reasonCode) === "SNAPSHOT_RELEASED",
      "SNAPSHOT_RELEASED"
    ],
    [
      sanitizeString(snapshotValidation.reasonCode) === "SNAPSHOT_REUSE_DETECTED",
      "SNAPSHOT_REUSE_DETECTED"
    ],
    [
      sanitizeString(snapshotValidation.sessionId) &&
        sanitizeString(snapshotValidation.sessionId) !== snapshotIdentity.sessionId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ],
    [
      sanitizeString(snapshotValidation.mapIdentityId) &&
        sanitizeString(snapshotValidation.mapIdentityId) !== snapshotIdentity.mapIdentityId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ],
    [
      sanitizeString(snapshotValidation.lifecycleOwnerId) &&
        sanitizeString(snapshotValidation.lifecycleOwnerId) !== snapshotIdentity.lifecycleOwnerId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ],
    [
      sanitizeString(snapshotValidation.lifecycleGenerationId) &&
        sanitizeString(snapshotValidation.lifecycleGenerationId) !==
          snapshotIdentity.lifecycleGenerationId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ],
    [
      sanitizeString(snapshotValidation.surfaceOwnerId) &&
        sanitizeString(snapshotValidation.surfaceOwnerId) !==
          snapshotIdentity.surfaceOwnerId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ],
    [
      sanitizeString(snapshotValidation.snapshotGenerationId) &&
        sanitizeString(snapshotValidation.snapshotGenerationId) !==
          snapshotIdentity.snapshotGenerationId,
      "SNAPSHOT_IDENTITY_MISMATCH"
    ]
  ];

  for (const [matched, reason] of mismatches) {
    if (matched) {
      state.drawRejectedCount += 1;
      throw Object.assign(new Error(reason), { reasonCode: reason });
    }
  }

  if (
    sanitizeString(retainedSurfaceValidation.canvasIdentityId) == null ||
    sanitizeString(retainedSurfaceValidation.canvasIdentityId) === ""
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("CANVAS_IDENTITY_MISMATCH"), {
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    });
  }

  if (
    sanitizeString(retainedSurfaceValidation.sessionId) &&
    sanitizeString(retainedSurfaceValidation.sessionId) !== snapshotIdentity.sessionId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("SURFACE_VALIDATION_FAILED"), {
      reasonCode: "SURFACE_VALIDATION_FAILED"
    });
  }

  if (
    sanitizeString(retainedSurfaceValidation.mapIdentityId) &&
    sanitizeString(retainedSurfaceValidation.mapIdentityId) !==
      snapshotIdentity.mapIdentityId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("CANVAS_IDENTITY_MISMATCH"), {
      reasonCode: "CANVAS_IDENTITY_MISMATCH"
    });
  }

  if (
    sanitizeString(retainedSurfaceValidation.surfaceOwnerId) &&
    sanitizeString(retainedSurfaceValidation.surfaceOwnerId) !==
      snapshotIdentity.surfaceOwnerId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("SURFACE_VALIDATION_FAILED"), {
      reasonCode: "SURFACE_VALIDATION_FAILED"
    });
  }

  if (
    sanitizeString(lifecycleValidation.lifecycleOwnerId) &&
    sanitizeString(lifecycleValidation.lifecycleOwnerId) !==
      snapshotIdentity.lifecycleOwnerId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("LIFECYCLE_VALIDATION_FAILED"), {
      reasonCode: "LIFECYCLE_VALIDATION_FAILED"
    });
  }

  if (
    sanitizeString(lifecycleValidation.lifecycleGenerationId) &&
    sanitizeString(lifecycleValidation.lifecycleGenerationId) !==
      snapshotIdentity.lifecycleGenerationId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("LIFECYCLE_VALIDATION_FAILED"), {
      reasonCode: "LIFECYCLE_VALIDATION_FAILED"
    });
  }

  if (
    sanitizeString(authorizationValidation.sessionId) &&
    sanitizeString(authorizationValidation.sessionId) !== snapshotIdentity.sessionId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("AUTHORIZATION_DENIED"), {
      reasonCode: "AUTHORIZATION_DENIED"
    });
  }

  if (
    sanitizeString(authorizationValidation.mapIdentityId) &&
    sanitizeString(authorizationValidation.mapIdentityId) !==
      snapshotIdentity.mapIdentityId
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("AUTHORIZATION_DENIED"), {
      reasonCode: "AUTHORIZATION_DENIED"
    });
  }

  if (
    sanitizeString(authorizationValidation.drawGenerationId) &&
    sanitizeString(authorizationValidation.drawGenerationId) !==
      sanitizeString(drawGenerationId)
  ) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("AUTHORIZATION_DENIED"), {
      reasonCode: "AUTHORIZATION_DENIED"
    });
  }

  state.validationCompletedCount += 1;
  state.sessionId = snapshotIdentity.sessionId;
  state.mapIdentityId = snapshotIdentity.mapIdentityId;
  state.lifecycleOwnerId = snapshotIdentity.lifecycleOwnerId;
  state.lifecycleGenerationId = snapshotIdentity.lifecycleGenerationId;
  state.surfaceOwnerId = snapshotIdentity.surfaceOwnerId;
  state.canvasIdentityId = sanitizeString(retainedSurfaceValidation.canvasIdentityId);
  state.paneIdentityId = sanitizeString(retainedSurfaceValidation.paneIdentityId);
  state.snapshotId = snapshotIdentity.snapshotId;
  state.snapshotGenerationId = snapshotIdentity.snapshotGenerationId;
  state.drawGenerationId = sanitizeString(drawGenerationId);
  state.redrawReason = redrawReason;
  return {
    redrawReason,
    snapshotValidation: {
      snapshotId: sanitizeString(snapshotValidation.snapshotId),
      snapshotGenerationId: sanitizeString(
        snapshotValidation.snapshotGenerationId
      ),
      sessionId: sanitizeString(snapshotValidation.sessionId),
      mapIdentityId: sanitizeString(snapshotValidation.mapIdentityId),
      lifecycleOwnerId: sanitizeString(snapshotValidation.lifecycleOwnerId),
      lifecycleGenerationId: sanitizeString(
        snapshotValidation.lifecycleGenerationId
      ),
      surfaceOwnerId: sanitizeString(snapshotValidation.surfaceOwnerId),
      drawGenerationId: sanitizeString(snapshotValidation.drawGenerationId)
    },
    retainedSurfaceValidation: {
      canvasIdentityId: sanitizeString(retainedSurfaceValidation.canvasIdentityId),
      paneIdentityId: sanitizeString(retainedSurfaceValidation.paneIdentityId),
      sessionId: sanitizeString(retainedSurfaceValidation.sessionId),
      mapIdentityId: sanitizeString(retainedSurfaceValidation.mapIdentityId),
      surfaceOwnerId: sanitizeString(retainedSurfaceValidation.surfaceOwnerId)
    },
    lifecycleValidation: {
      lifecycleOwnerId: sanitizeString(lifecycleValidation.lifecycleOwnerId),
      lifecycleGenerationId: sanitizeString(
        lifecycleValidation.lifecycleGenerationId
      ),
      surfaceOwnerId: sanitizeString(lifecycleValidation.surfaceOwnerId)
    },
    authorizationValidation: {
      sessionId: sanitizeString(authorizationValidation.sessionId),
      mapIdentityId: sanitizeString(authorizationValidation.mapIdentityId),
      drawGenerationId: sanitizeString(authorizationValidation.drawGenerationId),
      redrawReason: sanitizeString(authorizationValidation.redrawReason)
    }
  };
}

export function drawPersistentAtlasFrame(
  provider,
  {
    snapshot,
    retainedSurface,
    lifecycleOwner,
    authorization,
    drawGenerationId
  } = {}
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
      reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
    });
  }

  const deps = readDeps(provider, [
    "snapshotValidator",
    "retainedSurfaceValidator",
    "lifecycleOwnerValidator",
    "authorizationValidator",
    "snapshotAwareDrawProvider",
    "mutableDrawStateProvider",
    "canvasPositionAdapter",
    "drawStateReleaseProvider",
    "timeProvider"
  ]);

  state.drawAttemptCount += 1;

  if (state.invalidated) {
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("DRAW_PROVIDER_INVALIDATED"), {
      reasonCode: "DRAW_PROVIDER_INVALIDATED"
    });
  }

  if (internal.callDepth > 0) {
    state.recursiveDrawDetected = true;
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("RECURSIVE_DRAW_DETECTED"), {
      reasonCode: "RECURSIVE_DRAW_DETECTED"
    });
  }

  if (internal.isDrawing) {
    state.parallelDrawDetected = true;
    state.drawRejectedCount += 1;
    throw Object.assign(new Error("DRAW_ALREADY_IN_PROGRESS"), {
      reasonCode: "DRAW_ALREADY_IN_PROGRESS"
    });
  }

  internal.callDepth += 1;
  const startedAt = sanitizeString(deps.timeProvider());
  const snapshotBefore = JSON.stringify(snapshot);

  try {
    const validated = validatePersistentAtlasDrawInputs(provider, {
      snapshot,
      retainedSurface,
      lifecycleOwner,
      authorization,
      drawGenerationId
    });
    internal.isDrawing = true;
    setState(provider, "preparing_draw_state");
    recordStepTrace(provider, {
      step: "surface_validated",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });
    recordStepTrace(provider, {
      step: "lifecycle_validated",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.lifecycleValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });
    recordStepTrace(provider, {
      step: "snapshot_validated",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });

    state.mutableStateCreateAttemptCount += 1;
    let mutableDrawState;
    try {
      mutableDrawState = deps.mutableDrawStateProvider({
        snapshotScalars: createMutableSnapshotScalars(snapshot),
        drawGenerationId: sanitizeString(drawGenerationId),
        redrawReason: validated.redrawReason
      });
      if (!mutableDrawState || typeof mutableDrawState !== "object") {
        throw Object.assign(new Error("MUTABLE_DRAW_STATE_CREATION_FAILED"), {
          reasonCode: "MUTABLE_DRAW_STATE_CREATION_FAILED"
        });
      }
      internal.mutableDrawState = mutableDrawState;
      state.mutableStateCreateCompletedCount += 1;
      recordStepTrace(provider, {
        step: "mutable_draw_state_created",
        redrawReason: validated.redrawReason,
        snapshotId: snapshot?.snapshotId ?? null,
        snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
        lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
        surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
        canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
      });
    } catch (error) {
      recordStepTrace(provider, {
        step: "mutable_draw_state_created",
        redrawReason: validated.redrawReason,
        snapshotId: snapshot?.snapshotId ?? null,
        snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
        lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
        surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
        canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId,
        thrownErrorName: error?.name ?? "Error",
        thrownErrorMessage: error?.message ?? String(error),
        thrownErrorStack: sanitizeTraceStack(error),
        normalizedReasonCode: toReasonCode(
          error,
          "MUTABLE_DRAW_STATE_CREATION_FAILED"
        )
      });
      throw Object.assign(
        new Error(toReasonCode(error, "MUTABLE_DRAW_STATE_CREATION_FAILED")),
        { reasonCode: toReasonCode(error, "MUTABLE_DRAW_STATE_CREATION_FAILED") }
      );
    }

    state.positionAdaptAttemptCount += 1;
    let positionAdapterPath = "direct_leaflet_position";
    try {
      const adapterResult = deps.canvasPositionAdapter({
        canvas: retainedSurface.canvas,
        pane: retainedSurface.pane ?? null,
        mutableCanvasLayerPosition:
          mutableDrawState.canvasLayerPosition ??
          createMutableSnapshotScalars(snapshot).canvasLayerPosition,
        mutableDrawState
      });
      if (adapterResult?.reasonCode === "READONLY_CANVAS_POSITION_FALLBACK_USED") {
        state.readonlyPositionFallbackUsed = true;
      }
      positionAdapterPath = sanitizeString(adapterResult?.positionAdapterPath) ??
        (state.readonlyPositionFallbackUsed
          ? "readonly_canvas_position_fallback"
          : "direct_leaflet_position");
      state.lastPositionAdapterPath = positionAdapterPath;
      state.positionAdaptCompletedCount += 1;
      recordStepTrace(provider, {
        step: "canvas_position_adapted",
        redrawReason: validated.redrawReason,
        snapshotId: snapshot?.snapshotId ?? null,
        snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
        lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
        surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
        canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
      });
    } catch (error) {
      const reasonCode = toReasonCode(error, "CANVAS_POSITION_ADAPTATION_FAILED");
      if (reasonCode === "READONLY_CANVAS_POSITION_FALLBACK_USED") {
        state.readonlyPositionFallbackUsed = true;
        state.lastPositionAdapterPath = "readonly_canvas_position_fallback";
        recordStepTrace(provider, {
          step: "canvas_position_adapted",
          redrawReason: validated.redrawReason,
          snapshotId: snapshot?.snapshotId ?? null,
          snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
          lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
          surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
          canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
        });
      } else {
        recordStepTrace(provider, {
          step: "canvas_position_adapted",
          redrawReason: validated.redrawReason,
          snapshotId: snapshot?.snapshotId ?? null,
          snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
          lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
          surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
          canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId,
          thrownErrorName: error?.name ?? "Error",
          thrownErrorMessage: error?.message ?? String(error),
          thrownErrorStack: sanitizeTraceStack(error),
          normalizedReasonCode: reasonCode
        });
        throw Object.assign(new Error(reasonCode), { reasonCode });
      }
    }

    setState(provider, "drawing");
    recordStepTrace(provider, {
      step: "draw_provider_entered",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });
    const drawResult = deps.snapshotAwareDrawProvider({
      snapshot,
      canvas: retainedSurface.canvas,
      pane: retainedSurface.pane ?? null,
      mutableDrawState,
      drawGenerationId: sanitizeString(drawGenerationId),
      redrawReason: validated.redrawReason
    });

    const drawProviderReason =
      sanitizeString(drawResult?.reasonCode) ?? "DRAW_COMPLETED";
    state.lastDrawProviderReason = drawProviderReason;
    recordStepTrace(provider, {
      step: "draw_provider_completed",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId,
      normalizedReasonCode: drawProviderReason
    });

    const snapshotAfter = JSON.stringify(snapshot);
    state.snapshotMutationDetected = snapshotBefore !== snapshotAfter;

    const completedAt = sanitizeString(deps.timeProvider());
    const durationMs = Math.max(
      0,
      new Date(completedAt).getTime() - new Date(startedAt).getTime()
    );

    state.drawCompletedCount += 1;
    const result = createResult({
      drawCompleted: true,
      drawReason: validated.redrawReason,
      snapshotId: snapshot.snapshotId,
      snapshotGenerationId: snapshot.snapshotGenerationId,
      drawGenerationId: sanitizeString(drawGenerationId),
      canvasIdentityId: state.canvasIdentityId,
      lifecycleOwnerId: state.lifecycleOwnerId,
      startedAt,
      completedAt,
      durationMs,
      positionAdapterPath: state.lastPositionAdapterPath,
      drawProviderReason,
      failureReason: null
    });

    recordStepTrace(provider, {
      step: "draw_state_release_started",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });
    releasePersistentAtlasDrawState(provider, { reason: "draw_completed" });
    recordStepTrace(provider, {
      step: "draw_state_release_completed",
      redrawReason: validated.redrawReason,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null,
      lifecycleOwnerId: validated.lifecycleValidation.lifecycleOwnerId,
      surfaceOwnerId: validated.retainedSurfaceValidation.surfaceOwnerId,
      canvasIdentityId: validated.retainedSurfaceValidation.canvasIdentityId
    });
    state.lastFailureReason = null;
    setState(provider, "idle");
    return result;
  } catch (error) {
    const reasonCode = toReasonCode(error, "DRAW_EXECUTION_FAILED");
    state.lastFailureReason = reasonCode;
    recordStepTrace(provider, {
      step:
        state.drawStateReleaseAttemptCount > state.drawStateReleaseCompletedCount
          ? "draw_state_release_started"
          : state.lastPositionAdapterPath == null
            ? "draw_provider_entered"
            : "draw_provider_completed",
      thrownErrorName: error?.name ?? "Error",
      thrownErrorMessage: error?.message ?? String(error),
      thrownErrorStack: sanitizeTraceStack(error),
      normalizedReasonCode: reasonCode
    });
    try {
      recordStepTrace(provider, {
        step: "draw_state_release_started",
        normalizedReasonCode: reasonCode
      });
      releasePersistentAtlasDrawState(provider, { reason: "draw_failed" });
      recordStepTrace(provider, {
        step: "draw_state_release_completed",
        normalizedReasonCode: reasonCode
      });
    } catch (releaseError) {
      state.lastFailureReason = toReasonCode(
        releaseError,
        "DRAW_STATE_RELEASE_FAILED"
      );
      recordStepTrace(provider, {
        step: "draw_state_release_completed",
        thrownErrorName: releaseError?.name ?? "Error",
        thrownErrorMessage: releaseError?.message ?? String(releaseError),
        thrownErrorStack: sanitizeTraceStack(releaseError),
        normalizedReasonCode: toReasonCode(
          releaseError,
          "DRAW_STATE_RELEASE_FAILED"
        )
      });
    }
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  } finally {
    internal.isDrawing = false;
    internal.callDepth = Math.max(0, internal.callDepth - 1);
    syncState(provider);
  }
}

export function releasePersistentAtlasDrawState(
  provider,
  { reason = "manual_release" } = {}
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
      reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
    });
  }

  state.drawStateReleaseAttemptCount += 1;
  const deps = readDeps(provider, ["drawStateReleaseProvider"]);
  setState(provider, "releasing_draw_state");

  if (internal.mutableDrawState == null) {
    state.drawStateReleaseCompletedCount += 1;
    state.lastFailureReason = null;
    setState(provider, state.invalidated ? "invalidated" : "idle");
    return deepFreeze({ released: true, reasonCode: "RELEASED" });
  }

  try {
    deps.drawStateReleaseProvider({
      mutableDrawState: internal.mutableDrawState,
      reason: sanitizeString(reason)
    });
    internal.mutableDrawState = null;
    state.drawStateReleaseCompletedCount += 1;
    state.lastFailureReason = null;
    setState(provider, state.invalidated ? "invalidated" : "idle");
    return deepFreeze({ released: true, reasonCode: "RELEASED" });
  } catch (error) {
    const reasonCode = toReasonCode(error, "DRAW_STATE_RELEASE_FAILED");
    state.lastFailureReason = reasonCode;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
}

export function invalidatePersistentAtlasDrawProvider(
  provider,
  reason = "DRAW_PROVIDER_INVALIDATED"
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("DRAW_PROVIDER_UNAVAILABLE"), {
      reasonCode: "DRAW_PROVIDER_UNAVAILABLE"
    });
  }

  internal.invalidationReason = sanitizeString(reason);
  state.lastFailureReason = sanitizeString(reason);
  setState(provider, "invalidated");
  return freezeStatus(state);
}

export function getPersistentAtlasFrameDrawStatus(provider) {
  const state = provider?.__state;
  if (!state) {
    return freezeStatus({
      state: "unavailable",
      providerReady: false,
      drawing: false,
      invalidated: false,
      failedClosed: true,
      sessionId: null,
      mapIdentityId: null,
      lifecycleOwnerId: null,
      lifecycleGenerationId: null,
      surfaceOwnerId: null,
      canvasIdentityId: null,
      paneIdentityId: null,
      snapshotId: null,
      snapshotGenerationId: null,
      drawGenerationId: null,
      redrawReason: null,
      validationAttemptCount: 0,
      validationCompletedCount: 0,
      drawAttemptCount: 0,
      drawCompletedCount: 0,
      drawRejectedCount: 0,
      mutableStateCreateAttemptCount: 0,
      mutableStateCreateCompletedCount: 0,
      positionAdaptAttemptCount: 0,
      positionAdaptCompletedCount: 0,
      drawStateReleaseAttemptCount: 0,
      drawStateReleaseCompletedCount: 0,
      recursiveDrawDetected: false,
      parallelDrawDetected: false,
      readonlyPositionFallbackUsed: false,
      rawBrowserReferenceDetected: false,
      snapshotMutationDetected: false,
      lastPositionAdapterPath: null,
      lastDrawProviderReason: null,
      lastFailureReason: "DRAW_PROVIDER_UNAVAILABLE",
      referencesReleased: false
    });
  }

  syncState(provider);
  return freezeStatus(state);
}
