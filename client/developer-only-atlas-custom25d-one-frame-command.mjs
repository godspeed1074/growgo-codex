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
const REQUIRED_CONFIRMATION =
  "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME";
const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

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
    const commandId = status.commandId ?? createCommandId();
    const executionAttemptCount = status.executionAttemptCount + 1;

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
      adapterResult = adapter.executeDeveloperOnlyLiveOneFrameAdapter({
        deferCleanupUntilRelease: true
      });
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

  namespace.runAuthorizedAtlasCustom25DOneFrame = (input) =>
    command.runAuthorizedAtlasCustom25DOneFrame(input);

  return namespace;
}
