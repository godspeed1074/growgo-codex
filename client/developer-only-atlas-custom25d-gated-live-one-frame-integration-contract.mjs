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
  "ATLAS_CUSTOM25D_GATED_LIVE_ONE_FRAME_INTEGRATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "ATLAS_CUSTOM25D_GATED_LIVE_ONE_FRAME_INTEGRATION_RESULT_001";
const READINESS_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001";
const AUTHORIZATION_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001";
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
    integrationId: null,
    integrationState: "idle",
    executionAttemptCount: 0,
    readinessReadCount: 0,
    readinessRevalidationCount: 0,
    authorizationValidated: false,
    authorizationConsumeAttemptCount: 0,
    authorizationConsumed: false,
    surfacePreparationAttemptCount: 0,
    surfacePrepared: false,
    cleanupMandatory: false,
    translationAttemptCount: 0,
    translationSucceeded: false,
    lifecycleRegistrationAttemptCount: 0,
    lifecycleOwnershipRegistered: false,
    frameSnapshotAttemptCount: 0,
    frameSnapshotCreated: false,
    drawOperationAttemptCount: 0,
    drawAttemptCount: 0,
    completedFrameCount: 0,
    cleanupAttemptCount: 0,
    cleanupCompleted: false,
    cleanupFailed: false,
    cleanupFailureReasons: [],
    referencesReleased: false,
    permanentlyClosed: false,
    secondExecutionBlocked: false,
    secondDrawBlocked: false,
    authorizationSessionId: null,
    ownershipMode: null,
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
    integrationId: status.integrationId,
    operation,
    outcome,
    reasonCode,
    integrationState: status.integrationState,
    executionAttemptCount: status.executionAttemptCount,
    readinessReadCount: status.readinessReadCount,
    readinessRevalidationCount: status.readinessRevalidationCount,
    authorizationValidated: status.authorizationValidated,
    authorizationConsumeAttemptCount: status.authorizationConsumeAttemptCount,
    authorizationConsumed: status.authorizationConsumed,
    surfacePreparationAttemptCount: status.surfacePreparationAttemptCount,
    surfacePrepared: status.surfacePrepared,
    cleanupMandatory: status.cleanupMandatory,
    translationAttemptCount: status.translationAttemptCount,
    translationSucceeded: status.translationSucceeded,
    lifecycleRegistrationAttemptCount: status.lifecycleRegistrationAttemptCount,
    lifecycleOwnershipRegistered: status.lifecycleOwnershipRegistered,
    frameSnapshotAttemptCount: status.frameSnapshotAttemptCount,
    frameSnapshotCreated: status.frameSnapshotCreated,
    drawOperationAttemptCount: status.drawOperationAttemptCount,
    drawAttemptCount: status.drawAttemptCount,
    completedFrameCount: status.completedFrameCount,
    cleanupAttemptCount: status.cleanupAttemptCount,
    cleanupCompleted: status.cleanupCompleted,
    cleanupFailed: status.cleanupFailed,
    cleanupFailureReasons: status.cleanupFailureReasons,
    referencesReleased: status.referencesReleased,
    permanentlyClosed: status.permanentlyClosed,
    secondExecutionBlocked: status.secondExecutionBlocked,
    secondDrawBlocked: status.secondDrawBlocked,
    authorizationSessionId: status.authorizationSessionId,
    ownershipMode: status.ownershipMode,
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

function extractPreparedSurface(surfaceResult) {
  if (!isObjectLike(surfaceResult)) {
    return null;
  }

  if (surfaceResult.outcome === "prepared" && isObjectLike(surfaceResult.surface)) {
    return surfaceResult.surface;
  }

  if (surfaceResult.preparationStatus === "prepared" && isObjectLike(surfaceResult.surface)) {
    return surfaceResult.surface;
  }

  if (surfaceResult.preparationStatus === "prepared" && isObjectLike(surfaceResult.ownedSurface)) {
    return surfaceResult.ownedSurface;
  }

  return null;
}

function validateDependencies({
  surfaceOperations,
  lifecycleTranslation,
  lifecycleOwnerFactory,
  frameSnapshotFactory,
  drawOperationFactory
}) {
  if (
    !isObjectLike(surfaceOperations) ||
    typeof surfaceOperations.prepareOneFrameSurface !== "function" ||
    typeof surfaceOperations.rollbackPreparedSurface !== "function"
  ) {
    return "MISSING_SURFACE_OPERATIONS_DEPENDENCY";
  }

  if (
    !isObjectLike(lifecycleTranslation) ||
    typeof lifecycleTranslation.translatePreparedSurfaceToLifecycleBundle !== "function"
  ) {
    return "MISSING_LIFECYCLE_TRANSLATION_DEPENDENCY";
  }

  if (typeof lifecycleOwnerFactory !== "function") {
    return "MISSING_LIFECYCLE_OWNER_FACTORY";
  }

  if (typeof frameSnapshotFactory !== "function") {
    return "MISSING_FRAME_SNAPSHOT_FACTORY";
  }

  if (typeof drawOperationFactory !== "function") {
    return "MISSING_DRAW_OPERATION_FACTORY";
  }

  return null;
}

export function createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract({
  hostnameProvider,
  readinessProvider,
  authorizationStatusProvider,
  authorizationConsume,
  surfaceOperations,
  lifecycleTranslation,
  lifecycleOwnerFactory,
  frameSnapshotFactory,
  drawOperationFactory,
  integrationIdGenerator
} = {}) {
  const getHostname = hostnameProvider ?? (() => globalThis?.location?.hostname ?? "");
  const getReadiness = readinessProvider ?? (() => null);
  const getAuthorizationStatus = authorizationStatusProvider ?? (() => null);
  const consumeAuthorization = authorizationConsume ?? (() => null);
  const createIntegrationId =
    integrationIdGenerator ??
    (() => `ATLAS_GATED_LIVE_ONE_FRAME_INTEGRATION_${Date.now()}`);

  let status = freezeStatus(createInitialStatus());
  let refs = {
    preparedSurface: null,
    lifecycleOwner: null,
    lifecycleBundle: null,
    frameSnapshot: null,
    drawOperation: null
  };

  function clearRefs() {
    refs = {
      preparedSurface: null,
      lifecycleOwner: null,
      lifecycleBundle: null,
      frameSnapshot: null,
      drawOperation: null
    };
  }

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getIntegrationStatus() {
    return status;
  }

  function finish(operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus(patch);
    if (nextStatus.referencesReleased || nextStatus.permanentlyClosed) {
      clearRefs();
    }
    return createResult({
      status: nextStatus,
      operation,
      outcome,
      reasonCode
    });
  }

  function normalizeCleanupFailureReasons(reason) {
    if (!reason) {
      return [];
    }
    return Array.isArray(reason) ? reason.filter(Boolean) : [reason];
  }

  function finalizeCleanup({
    cleanupResult,
    integrationState,
    completedFrameCount = status.completedFrameCount
  }) {
    const cleanupFailureReasons = normalizeCleanupFailureReasons(
      cleanupResult?.cleanupFailureReasons ?? cleanupResult?.reasonCode ?? null
    );
    const cleanupCompleted = cleanupResult?.outcome === "disposed";
    const cleanupFailed = !cleanupCompleted;

    return finish(
      "execute_gated_live_one_frame_integration",
      cleanupFailed ? "failed_closed" : "completed",
      cleanupFailed
        ? cleanupFailureReasons[0] ?? "CLEANUP_FAILED"
        : "GATED_LIVE_ONE_FRAME_INTEGRATION_COMPLETED",
      {
        integrationState,
        cleanupAttemptCount: status.cleanupAttemptCount + 1,
        cleanupCompleted,
        cleanupFailed,
        cleanupFailureReasons,
        completedFrameCount,
        referencesReleased: true,
        permanentlyClosed: true,
        secondExecutionBlocked: true,
        secondDrawBlocked: true
      }
    );
  }

  function rollbackPreparedSurface(reasonCode, extraPatch = {}) {
    let cleanupFailureReasons = [];
    let cleanupCompleted = false;
    let cleanupFailed = false;

    try {
      const rollbackResult = surfaceOperations.rollbackPreparedSurface({
        surface: refs.preparedSurface
      });
      cleanupCompleted =
        rollbackResult?.outcome === "rolled_back" ||
        rollbackResult?.rollbackCompleted === true;
      cleanupFailed = !cleanupCompleted;
      cleanupFailureReasons = normalizeCleanupFailureReasons(
        rollbackResult?.rollbackFailureReason ?? rollbackResult?.reasonCode ?? null
      );
    } catch (error) {
      cleanupCompleted = false;
      cleanupFailed = true;
      cleanupFailureReasons = [toReasonCode(error, "ROLLBACK_EXCEPTION")];
    }

    return finish(
      "execute_gated_live_one_frame_integration",
      "failed_closed",
      reasonCode,
      {
        integrationState: "failed_closed",
        cleanupAttemptCount: status.cleanupAttemptCount + 1,
        cleanupCompleted,
        cleanupFailed,
        cleanupFailureReasons,
        referencesReleased: true,
        permanentlyClosed: true,
        secondExecutionBlocked: true,
        secondDrawBlocked: true,
        ...extraPatch
      }
    );
  }

  function executeGatedLiveOneFrameIntegration() {
    const integrationId = status.integrationId ?? createIntegrationId();

    if (status.permanentlyClosed) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        "INTEGRATION_ALREADY_CLOSED",
        {
          integrationId,
          integrationState: "blocked",
          secondExecutionBlocked: true
        }
      );
    }

    updateStatus({
      integrationId,
      executionAttemptCount: status.executionAttemptCount + 1,
      integrationState: "validating_readiness"
    });

    const hostname = getHostname();
    if (!isLocalDevelopmentHost(hostname)) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        "LOCAL_DEVELOPMENT_HOST_REQUIRED",
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    let readinessResult;
    try {
      readinessResult = getReadiness();
    } catch (error) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        toReasonCode(error, "READINESS_PROVIDER_EXCEPTION"),
        {
          integrationState: "failed_closed",
          readinessReadCount: status.readinessReadCount + 1,
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    const firstReadiness = normalizeReadiness(readinessResult);
    updateStatus({
      readinessReadCount: status.readinessReadCount + 1,
      canonicalSafetyFlagSnapshot: firstReadiness.safetyFlags
    });

    if (!canonicalSafetyFlagsAreClosed(firstReadiness.safetyFlags)) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    if (!firstReadiness.ok || !firstReadiness.snapshot) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        firstReadiness.reasonCode,
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      integrationState: "validating_authorization"
    });

    let authStatusResult;
    try {
      authStatusResult = getAuthorizationStatus();
    } catch (error) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        toReasonCode(error, "AUTHORIZATION_STATUS_PROVIDER_EXCEPTION"),
        {
          integrationState: "failed_closed",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    const authorizationStatus = normalizeAuthorizationStatus(authStatusResult);
    updateStatus({
      authorizationValidated: authorizationStatus.ok,
      authorizationSessionId: authorizationStatus.sessionId,
      canonicalSafetyFlagSnapshot: authorizationStatus.safetyFlags
    });

    if (!canonicalSafetyFlagsAreClosed(authorizationStatus.safetyFlags)) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    if (!authorizationStatus.ok || !authorizationStatus.snapshot) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        authorizationStatus.reasonCode,
        {
          integrationState: "blocked",
          referencesReleased: true,
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
        "execute_gated_live_one_frame_integration",
        "blocked",
        identityMismatch,
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      boundRegionId: firstReadiness.snapshot.regionId,
      boundPackageId: firstReadiness.snapshot.packageId,
      boundPackageVersion: firstReadiness.snapshot.packageVersion,
      boundPackageFingerprint: firstReadiness.snapshot.packageFingerprint,
      boundRecipeId: firstReadiness.snapshot.recipeId,
      boundRecipeVersion: firstReadiness.snapshot.recipeVersion,
      boundSelectorSeed: firstReadiness.snapshot.selectorSeed,
      integrationState: "validating_dependencies"
    });

    const dependencyFailure = validateDependencies({
      surfaceOperations,
      lifecycleTranslation,
      lifecycleOwnerFactory,
      frameSnapshotFactory,
      drawOperationFactory
    });
    if (dependencyFailure) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        dependencyFailure,
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      integrationState: "readiness_revalidated"
    });

    let secondReadinessResult;
    try {
      secondReadinessResult = getReadiness();
    } catch (error) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        toReasonCode(error, "READINESS_REVALIDATION_EXCEPTION"),
        {
          integrationState: "failed_closed",
          readinessReadCount: status.readinessReadCount + 1,
          readinessRevalidationCount: status.readinessRevalidationCount + 1,
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    const secondReadiness = normalizeReadiness(secondReadinessResult);
    updateStatus({
      readinessReadCount: status.readinessReadCount + 1,
      readinessRevalidationCount: status.readinessRevalidationCount + 1,
      canonicalSafetyFlagSnapshot: secondReadiness.safetyFlags
    });

    if (!canonicalSafetyFlagsAreClosed(secondReadiness.safetyFlags)) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    if (!secondReadiness.ok || !secondReadiness.snapshot) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        secondReadiness.reasonCode,
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    const driftReason = compareReadinessSnapshots(
      firstReadiness.snapshot,
      secondReadiness.snapshot
    );
    if (driftReason) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "blocked",
        driftReason,
        {
          integrationState: "blocked",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      integrationState: "authorization_consumed",
      authorizationConsumeAttemptCount: status.authorizationConsumeAttemptCount + 1
    });

    let consumeResult;
    try {
      consumeResult = consumeAuthorization();
    } catch (error) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        toReasonCode(error, "AUTHORIZATION_CONSUME_EXCEPTION"),
        {
          integrationState: "failed_closed",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    if (!isObjectLike(consumeResult) || consumeResult.outcome !== "consumed") {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        consumeResult?.reasonCode ?? "AUTHORIZATION_CONSUME_FAILED",
        {
          integrationState: "failed_closed",
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      authorizationConsumed: true,
      integrationState: "preparing_surface"
    });

    let surfaceResult;
    try {
      updateStatus({
        surfacePreparationAttemptCount: status.surfacePreparationAttemptCount + 1
      });
      surfaceResult = surfaceOperations.prepareOneFrameSurface();
    } catch (error) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        toReasonCode(error, "SURFACE_PREPARATION_EXCEPTION"),
        {
          integrationState: "failed_closed",
          completedFrameCount: 0,
          referencesReleased: true,
          permanentlyClosed: true,
          secondExecutionBlocked: true
        }
      );
    }

    const preparedSurface = extractPreparedSurface(surfaceResult);
    if (!preparedSurface) {
      return finish(
        "execute_gated_live_one_frame_integration",
        "failed_closed",
        surfaceResult?.reasonCode ?? "SURFACE_PREPARATION_FAILED",
        {
          integrationState: "failed_closed",
          completedFrameCount: 0,
          referencesReleased: true,
          permanentlyClosed: true,
          secondExecutionBlocked: true
        }
      );
    }

    refs.preparedSurface = preparedSurface;
    updateStatus({
      surfacePrepared: true,
      cleanupMandatory: true
    });

    let lifecycleOwner;
    try {
      lifecycleOwner = lifecycleOwnerFactory();
    } catch (error) {
      return rollbackPreparedSurface(toReasonCode(error, "LIFECYCLE_OWNER_FACTORY_EXCEPTION"), {
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }
    refs.lifecycleOwner = lifecycleOwner;

    updateStatus({
      integrationState: "ownership_translated",
      translationAttemptCount: status.translationAttemptCount + 1
    });

    let translationResult;
    try {
      translationResult =
        lifecycleTranslation.translatePreparedSurfaceToLifecycleBundle({
          preparedSurface,
          lifecycleOwner
        });
    } catch (error) {
      return rollbackPreparedSurface(toReasonCode(error, "TRANSLATION_EXCEPTION"), {
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    if (!isObjectLike(translationResult) || translationResult.outcome !== "translated") {
      return rollbackPreparedSurface(
        translationResult?.reasonCode ?? "TRANSLATION_FAILED",
        {
          integrationState: "failed_closed",
          completedFrameCount: 0,
          lifecycleRegistrationAttemptCount:
            status.lifecycleRegistrationAttemptCount +
            (translationResult?.lifecycleRegistrationAttempted === true ? 1 : 0)
        }
      );
    }

    refs.lifecycleBundle = translationResult.lifecycleBundle ?? null;
    updateStatus({
      translationSucceeded: true,
      ownershipMode: translationResult.ownershipMode ?? translationResult.lifecycleBundle?.ownershipMode ?? null,
      lifecycleRegistrationAttemptCount:
        status.lifecycleRegistrationAttemptCount + 1,
      lifecycleOwnershipRegistered: translationResult.lifecycleRegistrationSucceeded === true,
      integrationState: "ownership_registered"
    });

    let frameSnapshot;
    try {
      updateStatus({
        integrationState: "frame_snapshot_created",
        frameSnapshotAttemptCount: status.frameSnapshotAttemptCount + 1
      });
      frameSnapshot = frameSnapshotFactory({
        preparedSurface,
        lifecycleBundle: refs.lifecycleBundle
      });
    } catch (error) {
      return finalizeCleanup({
        cleanupResult: refs.lifecycleOwner.disposeOwnedResources?.() ?? {
          reasonCode: toReasonCode(error, "FRAME_SNAPSHOT_EXCEPTION")
        },
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    if (!isObjectLike(frameSnapshot)) {
      return finalizeCleanup({
        cleanupResult: refs.lifecycleOwner.disposeOwnedResources?.() ?? {
          reasonCode: "FRAME_SNAPSHOT_FAILED"
        },
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    refs.frameSnapshot = frameSnapshot;
    updateStatus({
      frameSnapshotCreated: true
    });

    let drawOperation;
    try {
      updateStatus({
        drawOperationAttemptCount: status.drawOperationAttemptCount + 1,
        integrationState: "drawing"
      });
      drawOperation = drawOperationFactory({
        frameSnapshot,
        preparedSurface,
        lifecycleBundle: refs.lifecycleBundle
      });
    } catch (error) {
      return finalizeCleanup({
        cleanupResult: refs.lifecycleOwner.disposeOwnedResources?.() ?? {
          reasonCode: toReasonCode(error, "DRAW_OPERATION_FACTORY_EXCEPTION")
        },
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    if (
      !isObjectLike(drawOperation) ||
      typeof drawOperation.drawPreparedSurfaceExactlyOnce !== "function"
    ) {
      return finalizeCleanup({
        cleanupResult: refs.lifecycleOwner.disposeOwnedResources?.() ?? {
          reasonCode: "DRAW_OPERATION_FACTORY_EXCEPTION"
        },
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    refs.drawOperation = drawOperation;

    let drawResult;
    try {
      updateStatus({
        drawAttemptCount: status.drawAttemptCount + 1
      });
      drawResult = drawOperation.drawPreparedSurfaceExactlyOnce({
        surface: preparedSurface,
        canvas: preparedSurface.canvas
      });
    } catch (error) {
      const cleanupResult = refs.lifecycleOwner.disposeOwnedResources?.() ?? {
        reasonCode: "CLEANUP_UNAVAILABLE"
      };
      return finalizeCleanup({
        cleanupResult,
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    updateStatus({
      realRendererInvoked: drawResult?.realRendererInvoked === true,
      realDrawFunctionCalled: drawResult?.realDrawFunctionCalled === true,
      realCanvasCreated: drawResult?.realCanvasCreated === true,
      realPaneCreated: drawResult?.realPaneCreated === true,
      realWebglContextCreated: drawResult?.realWebglContextCreated === true,
      realOverlayCreated: drawResult?.realOverlayCreated === true,
      realListenerAdded: drawResult?.listenerAdded === true,
      retentionWritten: drawResult?.retentionWritten === true,
      networkRequested: drawResult?.networkRequested === true,
      assetDownloadRequested: drawResult?.assetDownloadRequested === true,
      automaticInvocation: drawResult?.automaticInvocation === true
    });

    if (!isObjectLike(drawResult) || drawResult.outcome !== "completed") {
      const cleanupResult = refs.lifecycleOwner.disposeOwnedResources?.() ?? {
        reasonCode: "CLEANUP_UNAVAILABLE"
      };
      return finalizeCleanup({
        cleanupResult,
        integrationState: "failed_closed",
        completedFrameCount: 0
      });
    }

    updateStatus({
      integrationState: "frame_completed",
      completedFrameCount: 1
    });

    let cleanupResult;
    try {
      updateStatus({
        integrationState: "cleaning_up"
      });
      cleanupResult = refs.lifecycleOwner.disposeOwnedResources();
    } catch (error) {
      cleanupResult = {
        reasonCode: toReasonCode(error, "CLEANUP_EXCEPTION"),
        cleanupFailureReasons: [toReasonCode(error, "CLEANUP_EXCEPTION")]
      };
    }

    updateStatus({
      integrationState: "references_released"
    });

    return finalizeCleanup({
      cleanupResult,
      integrationState: "completed",
      completedFrameCount: 1
    });
  }

  return deepFreeze({
    getIntegrationStatus,
    executeGatedLiveOneFrameIntegration
  });
}
