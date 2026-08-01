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

const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const READINESS_SCHEMA_ID = "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001";
const AUTHORIZATION_SCHEMA_ID = "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001";
const RESULT_SCHEMA_ID = "ATLAS_ONE_FRAME_RENDERER_ACTIVATION_RESULT_001";
const SUCCESS_REASON = "SIMULATED_ONE_FRAME_COMPLETED";

function defaultSafetyFlags() {
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

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function normalizeCanonicalSafetyFlags({
  readiness = null,
  authorizationStatus = null
} = {}) {
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

function canonicalSafetyFlagsAreClosed(flags) {
  return (
    flags.runtimeExecutionEnabled === false &&
    flags.mapAttachmentAllowed === false &&
    flags.automaticRendererExecutionAllowed === false &&
    flags.lifecycleExecutionEnabled === false
  );
}

function normalizeReadiness(readiness) {
  const safetyFlags = normalizeCanonicalSafetyFlags({ readiness });

  if (!readiness || typeof readiness !== "object") {
    return {
      ok: false,
      reasonCode: "MISSING_READINESS_RESULT",
      safetyFlags,
      snapshot: null
    };
  }

  if (readiness.schemaId !== READINESS_SCHEMA_ID) {
    return {
      ok: false,
      reasonCode: "INVALID_READINESS_RESULT",
      safetyFlags,
      snapshot: null
    };
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
    return {
      ok: false,
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE",
      safetyFlags,
      snapshot: null
    };
  }

  if (readiness.rendererIdentityValidated !== true) {
    return {
      ok: false,
      reasonCode: "RENDERER_IDENTITY_MISMATCH",
      safetyFlags,
      snapshot: null
    };
  }

  const snapshot = {
    regionId: readiness?.resolvedRegion?.regionId ?? null,
    packageId: readiness?.resolvedPackage?.packageId ?? null,
    packageVersion: readiness?.resolvedPackage?.packageVersion ?? null,
    packageFingerprint: readiness?.resolvedPackage?.packageFingerprint ?? null,
    recipeId: readiness?.resolvedRecipe?.recipeId ?? null,
    recipeVersion: readiness?.resolvedRecipe?.selectedVersion ?? null,
    selectorSeed: readiness?.selectorSeed ?? null,
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true
  };

  if (Object.values(snapshot).some((value) => value == null)) {
    return {
      ok: false,
      reasonCode: "INVALID_READINESS_RESULT",
      safetyFlags,
      snapshot: null
    };
  }

  return {
    ok: true,
    reasonCode: "READINESS_VALID",
    safetyFlags,
    snapshot: deepFreeze(snapshot)
  };
}

function normalizeAuthorizationStatus(status) {
  const safetyFlags = normalizeCanonicalSafetyFlags({ authorizationStatus: status });

  if (!status || typeof status !== "object") {
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

  if (
    status.rendererInitializationAllowed !== true ||
    status.rendererAttachmentAllowed !== true ||
    status.drawAllowed !== true
  ) {
    return {
      ok: false,
      reasonCode: "AUTHORIZATION_NOT_RENDERER_READY",
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

function compareReadinessToAuthorization(readinessSnapshot, authorizationSnapshot) {
  if (readinessSnapshot.regionId !== authorizationSnapshot.regionId) {
    return "BOUND_REGION_ID_MISMATCH";
  }
  if (readinessSnapshot.packageId !== authorizationSnapshot.packageId) {
    return "BOUND_PACKAGE_ID_MISMATCH";
  }
  if (readinessSnapshot.packageVersion !== authorizationSnapshot.packageVersion) {
    return "BOUND_PACKAGE_VERSION_MISMATCH";
  }
  if (readinessSnapshot.packageFingerprint !== authorizationSnapshot.packageFingerprint) {
    return "BOUND_PACKAGE_FINGERPRINT_MISMATCH";
  }
  if (readinessSnapshot.recipeId !== authorizationSnapshot.recipeId) {
    return "BOUND_RECIPE_ID_MISMATCH";
  }
  if (readinessSnapshot.recipeVersion !== authorizationSnapshot.recipeVersion) {
    return "BOUND_RECIPE_VERSION_MISMATCH";
  }
  if (readinessSnapshot.selectorSeed !== authorizationSnapshot.selectorSeed) {
    return "BOUND_SELECTOR_SEED_MISMATCH";
  }

  return null;
}

function compareReadinessSnapshots(firstSnapshot, secondSnapshot) {
  if (secondSnapshot.regionId !== firstSnapshot.regionId) {
    return "REGION_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.packageId !== firstSnapshot.packageId) {
    return "PACKAGE_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.packageVersion !== firstSnapshot.packageVersion) {
    return "PACKAGE_VERSION_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.packageFingerprint !== firstSnapshot.packageFingerprint) {
    return "PACKAGE_FINGERPRINT_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.recipeId !== firstSnapshot.recipeId) {
    return "RECIPE_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.recipeVersion !== firstSnapshot.recipeVersion) {
    return "RECIPE_VERSION_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (secondSnapshot.selectorSeed !== firstSnapshot.selectorSeed) {
    return "SELECTOR_SEED_DRIFTED_BEFORE_CONSUMPTION";
  }

  return null;
}

function validateRendererAdapter(rendererAdapter) {
  if (!rendererAdapter || typeof rendererAdapter !== "object") {
    return {
      ok: false,
      reasonCode: "RENDERER_ADAPTER_UNAVAILABLE"
    };
  }

  const requiredFunctions = [
    "validateIdentity",
    "initializeForOneFrame",
    "drawExactlyOneFrame",
    "disposeAfterOneFrame"
  ];

  for (const name of requiredFunctions) {
    if (typeof rendererAdapter[name] !== "function") {
      return {
        ok: false,
        reasonCode: "RENDERER_ADAPTER_INVALID"
      };
    }
  }

  return {
    ok: true,
    reasonCode: "RENDERER_ADAPTER_VALID"
  };
}

function createBaseSnapshot() {
  return {
    schemaId: RESULT_SCHEMA_ID,
    activationId: null,
    operation: "get_status",
    outcome: "idle",
    reasonCode: "IDLE",
    activationState: "idle",
    sessionId: null,
    readinessValidated: false,
    authorizationValidated: false,
    authorizationConsumed: false,
    rendererIdentityValidated: false,
    requestedFrameCount: 0,
    completedFrameCount: 0,
    initializationAttemptCount: 0,
    drawAttemptCount: 0,
    disposalAttemptCount: 0,
    cleanupCompleted: false,
    secondFrameBlocked: false,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    mapListenerAdded: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: defaultSafetyFlags()
  };
}

function freezeSnapshot(snapshot) {
  return deepFreeze({
    ...snapshot,
    canonicalSafetyFlagSnapshot: deepFreeze({
      ...snapshot.canonicalSafetyFlagSnapshot
    })
  });
}

export function createDeveloperOnlyAtlasOneFrameRendererActivationContract(options = {}) {
  const hostnameProvider = options.hostnameProvider ?? (() => globalThis?.location?.hostname ?? "");
  const readinessProvider = options.readinessProvider ?? (() => null);
  const authorizationStatusProvider = options.authorizationStatusProvider ?? (() => null);
  const authorizationConsume = options.authorizationConsume ?? (() => null);
  const rendererAdapter = options.rendererAdapter ?? null;
  const activationIdGenerator = options.activationIdGenerator ?? (() => `ATLAS_ONE_FRAME_ACTIVATION_${Date.now()}`);

  let closed = false;
  let latestSnapshot = freezeSnapshot(createBaseSnapshot());

  function updateSnapshot(patch) {
    latestSnapshot = freezeSnapshot({
      ...latestSnapshot,
      ...patch
    });
    return latestSnapshot;
  }

  function buildFailure({
    activationId,
    reasonCode,
    activationState,
    sessionId,
    readinessValidated,
    authorizationValidated,
    authorizationConsumed,
    rendererIdentityValidated,
    requestedFrameCount,
    completedFrameCount,
    initializationAttemptCount,
    drawAttemptCount,
    disposalAttemptCount,
    cleanupCompleted,
    boundSnapshot,
    safetyFlags,
    secondFrameBlocked,
    outcome = "blocked"
  }) {
    closed = true;
    return updateSnapshot({
      activationId,
      operation: "simulate_one_frame_activation",
      outcome,
      reasonCode,
      activationState,
      sessionId,
      readinessValidated,
      authorizationValidated,
      authorizationConsumed,
      rendererIdentityValidated,
      requestedFrameCount,
      completedFrameCount,
      initializationAttemptCount,
      drawAttemptCount,
      disposalAttemptCount,
      cleanupCompleted,
      secondFrameBlocked,
      boundRegionId: boundSnapshot?.regionId ?? null,
      boundPackageId: boundSnapshot?.packageId ?? null,
      boundPackageVersion: boundSnapshot?.packageVersion ?? null,
      boundPackageFingerprint: boundSnapshot?.packageFingerprint ?? null,
      boundRecipeId: boundSnapshot?.recipeId ?? null,
      boundRecipeVersion: boundSnapshot?.recipeVersion ?? null,
      boundSelectorSeed: boundSnapshot?.selectorSeed ?? null,
      canonicalSafetyFlagSnapshot: safetyFlags ?? latestSnapshot.canonicalSafetyFlagSnapshot
    });
  }

  function runDisposal({
    activationId,
    sessionId,
    boundSnapshot,
    safetyFlags,
    readinessValidated,
    authorizationValidated,
    authorizationConsumed,
    rendererIdentityValidated,
    requestedFrameCount,
    completedFrameCount,
    initializationAttemptCount,
    drawAttemptCount
  }) {
    let disposalAttemptCount = 0;

    try {
      disposalAttemptCount = 1;
      const result = rendererAdapter.disposeAfterOneFrame({
        activationId,
        sessionId,
        boundSnapshot
      });

      if (result && result.ok === false) {
        return buildFailure({
          activationId,
          reasonCode: result.reasonCode ?? "DISPOSAL_FAILED",
          activationState: "failed_closed",
          sessionId,
          readinessValidated,
          authorizationValidated,
          authorizationConsumed,
          rendererIdentityValidated,
          requestedFrameCount,
          completedFrameCount,
          initializationAttemptCount,
          drawAttemptCount,
          disposalAttemptCount,
          cleanupCompleted: false,
          boundSnapshot,
          safetyFlags,
          secondFrameBlocked: true,
          outcome: "failed_closed"
        });
      }

      return updateSnapshot({
        activationId,
        operation: "simulate_one_frame_activation",
        outcome: completedFrameCount === 1 ? "completed" : "failed_closed",
        reasonCode: completedFrameCount === 1 ? SUCCESS_REASON : "DISPOSED_AFTER_FAILURE",
        activationState: "disposed",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted: true,
        secondFrameBlocked: true,
        boundRegionId: boundSnapshot.regionId,
        boundPackageId: boundSnapshot.packageId,
        boundPackageVersion: boundSnapshot.packageVersion,
        boundPackageFingerprint: boundSnapshot.packageFingerprint,
        boundRecipeId: boundSnapshot.recipeId,
        boundRecipeVersion: boundSnapshot.recipeVersion,
        boundSelectorSeed: boundSnapshot.selectorSeed,
        canonicalSafetyFlagSnapshot: safetyFlags
      });
    } catch (error) {
      return buildFailure({
        activationId,
        reasonCode: toReasonCode(error, "DISPOSAL_EXCEPTION"),
        activationState: "failed_closed",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted: false,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: true,
        outcome: "failed_closed"
      });
    }
  }

  function simulateOneFrameActivation() {
    if (closed) {
      return updateSnapshot({
        operation: "simulate_one_frame_activation",
        outcome: "blocked",
        reasonCode: "ACTIVATION_ALREADY_CLOSED",
        activationState: latestSnapshot.activationState === "disposed" ? "disposed" : "blocked",
        secondFrameBlocked: true
      });
    }

    const activationId = activationIdGenerator();
    const requestedFrameCount = 1;
    let readinessValidated = false;
    let authorizationValidated = false;
    let authorizationConsumed = false;
    let rendererIdentityValidated = false;
    let initializationAttemptCount = 0;
    let drawAttemptCount = 0;
    let completedFrameCount = 0;
    let disposalAttemptCount = 0;
    let cleanupCompleted = false;
    let sessionId = null;
    let boundSnapshot = null;
    let safetyFlags = defaultSafetyFlags();

    const hostname = hostnameProvider();
    if (!isLocalDevelopmentHost(hostname)) {
      return buildFailure({
        activationId,
        reasonCode: "LOCAL_DEVELOPMENT_HOST_REQUIRED",
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    const firstReadiness = normalizeReadiness(readinessProvider());
    safetyFlags = firstReadiness.safetyFlags;
    if (!canonicalSafetyFlagsAreClosed(safetyFlags)) {
      return buildFailure({
        activationId,
        reasonCode: "CANONICAL_SAFETY_FLAGS_VIOLATED",
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    if (!firstReadiness.ok || !firstReadiness.snapshot) {
      return buildFailure({
        activationId,
        reasonCode: firstReadiness.reasonCode,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }
    readinessValidated = true;

    const authorizationStatus = normalizeAuthorizationStatus(
      authorizationStatusProvider()
    );
    safetyFlags = normalizeCanonicalSafetyFlags({
      readiness: { safetyFlagSnapshot: safetyFlags },
      authorizationStatus: authorizationStatusProvider()
    });

    if (!canonicalSafetyFlagsAreClosed(safetyFlags)) {
      return buildFailure({
        activationId,
        reasonCode: "CANONICAL_SAFETY_FLAGS_VIOLATED",
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    sessionId = authorizationStatus.sessionId;
    if (!authorizationStatus.ok || !authorizationStatus.snapshot) {
      return buildFailure({
        activationId,
        reasonCode: authorizationStatus.reasonCode,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }
    authorizationValidated = true;

    const boundMismatch = compareReadinessToAuthorization(
      firstReadiness.snapshot,
      authorizationStatus.snapshot
    );
    if (boundMismatch) {
      return buildFailure({
        activationId,
        reasonCode: boundMismatch,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot: authorizationStatus.snapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }
    boundSnapshot = authorizationStatus.snapshot;

    const adapterValidation = validateRendererAdapter(rendererAdapter);
    if (!adapterValidation.ok) {
      return buildFailure({
        activationId,
        reasonCode: adapterValidation.reasonCode,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    try {
      const rendererIdentity = rendererAdapter.validateIdentity({
        activationId,
        readinessSnapshot: firstReadiness.snapshot,
        authorizationSnapshot: authorizationStatus.snapshot
      });

      if (!rendererIdentity || rendererIdentity.ok !== true) {
        return buildFailure({
          activationId,
          reasonCode: rendererIdentity?.reasonCode ?? "RENDERER_IDENTITY_MISMATCH",
          activationState: "blocked",
          sessionId,
          readinessValidated,
          authorizationValidated,
          authorizationConsumed,
          rendererIdentityValidated,
          requestedFrameCount,
          completedFrameCount,
          initializationAttemptCount,
          drawAttemptCount,
          disposalAttemptCount,
          cleanupCompleted,
          boundSnapshot,
          safetyFlags,
          secondFrameBlocked: false
        });
      }
    } catch (error) {
      return buildFailure({
        activationId,
        reasonCode: toReasonCode(error, "RENDERER_IDENTITY_EXCEPTION"),
        activationState: "failed_closed",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false,
        outcome: "failed_closed"
      });
    }
    rendererIdentityValidated = true;

    const secondReadiness = normalizeReadiness(readinessProvider());
    safetyFlags = secondReadiness.safetyFlags;

    if (!canonicalSafetyFlagsAreClosed(safetyFlags)) {
      return buildFailure({
        activationId,
        reasonCode: "CANONICAL_SAFETY_FLAGS_VIOLATED",
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    if (!secondReadiness.ok || !secondReadiness.snapshot) {
      return buildFailure({
        activationId,
        reasonCode: secondReadiness.reasonCode,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    const readinessDrift = compareReadinessSnapshots(
      firstReadiness.snapshot,
      secondReadiness.snapshot
    );
    if (readinessDrift) {
      return buildFailure({
        activationId,
        reasonCode: readinessDrift,
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }

    let consumeResult;
    try {
      consumeResult = authorizationConsume();
    } catch (error) {
      return buildFailure({
        activationId,
        reasonCode: toReasonCode(error, "AUTHORIZATION_CONSUME_EXCEPTION"),
        activationState: "failed_closed",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false,
        outcome: "failed_closed"
      });
    }

    if (
      !consumeResult ||
      consumeResult.operation !== "consume" ||
      consumeResult.outcome !== "consumed"
    ) {
      return buildFailure({
        activationId,
        reasonCode: consumeResult?.reasonCode ?? "AUTHORIZATION_CONSUME_BLOCKED",
        activationState: "blocked",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: false
      });
    }
    authorizationConsumed = true;

    try {
      initializationAttemptCount = 1;
      const initResult = rendererAdapter.initializeForOneFrame({
        activationId,
        sessionId,
        readinessSnapshot: secondReadiness.snapshot,
        authorizationSnapshot: authorizationStatus.snapshot
      });

      if (initResult && initResult.ok === false) {
        if (initResult.cleanupRequired === true) {
          return runDisposal({
            activationId,
            sessionId,
            boundSnapshot,
            safetyFlags,
            readinessValidated,
            authorizationValidated,
            authorizationConsumed,
            rendererIdentityValidated,
            requestedFrameCount,
            completedFrameCount,
            initializationAttemptCount,
            drawAttemptCount
          });
        }

        return buildFailure({
          activationId,
          reasonCode: initResult.reasonCode ?? "INITIALIZATION_FAILED",
          activationState: "failed_closed",
          sessionId,
          readinessValidated,
          authorizationValidated,
          authorizationConsumed,
          rendererIdentityValidated,
          requestedFrameCount,
          completedFrameCount,
          initializationAttemptCount,
          drawAttemptCount,
          disposalAttemptCount,
          cleanupCompleted,
          boundSnapshot,
          safetyFlags,
          secondFrameBlocked: true,
          outcome: "failed_closed"
        });
      }
    } catch (error) {
      return buildFailure({
        activationId,
        reasonCode: toReasonCode(error, "INITIALIZATION_EXCEPTION"),
        activationState: "failed_closed",
        sessionId,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount,
        disposalAttemptCount,
        cleanupCompleted,
        boundSnapshot,
        safetyFlags,
        secondFrameBlocked: true,
        outcome: "failed_closed"
      });
    }

    try {
      drawAttemptCount = 1;
      const drawResult = rendererAdapter.drawExactlyOneFrame({
        activationId,
        sessionId,
        boundSnapshot
      });

      if (drawResult && drawResult.ok === false) {
        return runDisposal({
          activationId,
          sessionId,
          boundSnapshot,
          safetyFlags,
          readinessValidated,
          authorizationValidated,
          authorizationConsumed,
          rendererIdentityValidated,
          requestedFrameCount,
          completedFrameCount,
          initializationAttemptCount,
          drawAttemptCount
        });
      }

      completedFrameCount = 1;
    } catch (error) {
      return runDisposal({
        activationId,
        sessionId,
        boundSnapshot,
        safetyFlags,
        readinessValidated,
        authorizationValidated,
        authorizationConsumed,
        rendererIdentityValidated,
        requestedFrameCount,
        completedFrameCount,
        initializationAttemptCount,
        drawAttemptCount
      });
    }

    closed = true;
    return runDisposal({
      activationId,
      sessionId,
      boundSnapshot,
      safetyFlags,
      readinessValidated,
      authorizationValidated,
      authorizationConsumed,
      rendererIdentityValidated,
      requestedFrameCount,
      completedFrameCount,
      initializationAttemptCount,
      drawAttemptCount
    });
  }

  function getActivationStatus() {
    return latestSnapshot;
  }

  return deepFreeze({
    simulateOneFrameActivation,
    getActivationStatus
  });
}
