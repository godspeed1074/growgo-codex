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
  "ATLAS_CUSTOM25D_ONE_FRAME_SESSION_COORDINATOR_STATUS_001";
const RESULT_SCHEMA_ID =
  "ATLAS_CUSTOM25D_ONE_FRAME_SESSION_COORDINATOR_RESULT_001";
const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);
const READINESS_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001";
const AUTHORIZATION_SCHEMA_ID =
  "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001";

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
    selectorSeed: readiness?.selectorSeed ?? null
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

function compareBoundIdentity(readinessSnapshot, authorizationSnapshot) {
  if (readinessSnapshot.regionId !== authorizationSnapshot.regionId) {
    return "BOUND_REGION_ID_MISMATCH";
  }
  if (readinessSnapshot.packageId !== authorizationSnapshot.packageId) {
    return "BOUND_PACKAGE_ID_MISMATCH";
  }
  if (readinessSnapshot.packageVersion !== authorizationSnapshot.packageVersion) {
    return "BOUND_PACKAGE_VERSION_MISMATCH";
  }
  if (
    readinessSnapshot.packageFingerprint !==
    authorizationSnapshot.packageFingerprint
  ) {
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
  if (firstSnapshot.regionId !== secondSnapshot.regionId) {
    return "REGION_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.packageId !== secondSnapshot.packageId) {
    return "PACKAGE_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.packageVersion !== secondSnapshot.packageVersion) {
    return "PACKAGE_VERSION_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (
    firstSnapshot.packageFingerprint !== secondSnapshot.packageFingerprint
  ) {
    return "PACKAGE_FINGERPRINT_DRIFTED_BEFORE_CONSUMPTION";
  }
  if (firstSnapshot.recipeId !== secondSnapshot.recipeId) {
    return "RECIPE_ID_DRIFTED_BEFORE_CONSUMPTION";
  }
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
    sessionExecutionId: null,
    coordinatorState: "idle",
    executionAttemptCount: 0,
    readinessReadCount: 0,
    readinessRevalidationCount: 0,
    authorizationValidated: false,
    authorizationConsumeAttemptCount: 0,
    authorizationConsumed: false,
    activationStarted: false,
    pipelineStarted: false,
    pipelineCompleted: false,
    completedFrameCount: 0,
    cleanupVerified: false,
    referencesReleased: false,
    permanentlyClosed: false,
    secondExecutionBlocked: false,
    authorizationSessionId: null,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null,
    cleanupFailureReasons: [],
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    realListenerAdded: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: defaultSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    cleanupFailureReasons: deepFreeze([
      ...(status.cleanupFailureReasons ?? [])
    ]),
    canonicalSafetyFlagSnapshot: deepFreeze({
      ...(status.canonicalSafetyFlagSnapshot ?? defaultSafetyFlags())
    })
  });
}

function createResult({ status, operation, outcome, reasonCode }) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    sessionExecutionId: status.sessionExecutionId,
    operation,
    outcome,
    reasonCode,
    coordinatorState: status.coordinatorState,
    executionAttemptCount: status.executionAttemptCount,
    readinessReadCount: status.readinessReadCount,
    readinessRevalidationCount: status.readinessRevalidationCount,
    authorizationValidated: status.authorizationValidated,
    authorizationConsumeAttemptCount: status.authorizationConsumeAttemptCount,
    authorizationConsumed: status.authorizationConsumed,
    activationStarted: status.activationStarted,
    pipelineStarted: status.pipelineStarted,
    pipelineCompleted: status.pipelineCompleted,
    completedFrameCount: status.completedFrameCount,
    cleanupVerified: status.cleanupVerified,
    referencesReleased: status.referencesReleased,
    permanentlyClosed: status.permanentlyClosed,
    secondExecutionBlocked: status.secondExecutionBlocked,
    authorizationSessionId: status.authorizationSessionId,
    boundRegionId: status.boundRegionId,
    boundPackageId: status.boundPackageId,
    boundPackageVersion: status.boundPackageVersion,
    boundPackageFingerprint: status.boundPackageFingerprint,
    boundRecipeId: status.boundRecipeId,
    boundRecipeVersion: status.boundRecipeVersion,
    boundSelectorSeed: status.boundSelectorSeed,
    cleanupFailureReasons: status.cleanupFailureReasons,
    realRendererInvoked: status.realRendererInvoked,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realWebglContextCreated: status.realWebglContextCreated,
    realOverlayCreated: status.realOverlayCreated,
    realListenerAdded: status.realListenerAdded,
    networkRequested: status.networkRequested,
    assetDownloadRequested: status.assetDownloadRequested,
    automaticInvocation: status.automaticInvocation,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

function evaluatePipelineResult(pipelineResult) {
  const cleanupFailureReasons = Array.isArray(pipelineResult?.cleanupFailureReasons)
    ? pipelineResult.cleanupFailureReasons
    : [];
  const cleanupVerified =
    pipelineResult?.cleanupCompleted === true &&
    pipelineResult?.cleanupFailed !== true;
  const referencesReleased =
    pipelineResult?.mapReferenceRetained === false &&
    pipelineResult?.canvasReferenceRetained === false;

  return {
    pipelineCompleted: pipelineResult?.outcome === "completed",
    completedFrameCount: pipelineResult?.completedFrameCount ?? 0,
    cleanupVerified,
    referencesReleased,
    cleanupFailureReasons,
    realRendererInvoked: pipelineResult?.realRendererInvoked === true,
    realDrawFunctionCalled: pipelineResult?.realDrawFunctionCalled === true,
    realCanvasCreated: pipelineResult?.realCanvasCreated === true,
    realPaneCreated: pipelineResult?.realPaneCreated === true,
    realWebglContextCreated:
      pipelineResult?.realWebglContextCreated === true,
    realOverlayCreated: pipelineResult?.realOverlayCreated === true,
    realListenerAdded: pipelineResult?.realListenerAdded === true,
    networkRequested: pipelineResult?.networkRequested === true,
    assetDownloadRequested: pipelineResult?.assetDownloadRequested === true
  };
}

export function createDeveloperOnlyAtlasCustom25DOneFrameSessionCoordinator({
  hostnameProvider,
  readinessProvider,
  authorizationStatusProvider,
  authorizationConsume,
  activationContractFactory,
  rendererPipelineFactory,
  sessionExecutionIdGenerator
} = {}) {
  const getHostname = hostnameProvider ?? (() => globalThis?.location?.hostname ?? "");
  const getReadiness = readinessProvider ?? (() => null);
  const getAuthorizationStatus = authorizationStatusProvider ?? (() => null);
  const consumeAuthorization = authorizationConsume ?? (() => null);
  const createExecutionId =
    sessionExecutionIdGenerator ??
    (() => `ATLAS_CUSTOM25D_ONE_FRAME_SESSION_${Date.now()}`);

  let status = freezeStatus(createInitialStatus());
  let refs = {
    activationContract: null,
    pipeline: null
  };

  function clearRefs() {
    refs = {
      activationContract: null,
      pipeline: null
    };
  }

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch
    });
    return status;
  }

  function getCoordinatorStatus() {
    return status;
  }

  function finish(operation, outcome, reasonCode, patch = {}) {
    const nextStatus = updateStatus(patch);
    if (nextStatus.permanentlyClosed) {
      clearRefs();
    }
    return createResult({
      status,
      operation,
      outcome,
      reasonCode
    });
  }

  function executeAuthorizedOneFrameSession() {
    const sessionExecutionId =
      status.sessionExecutionId ?? createExecutionId();

    if (status.permanentlyClosed) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "SESSION_COORDINATOR_ALREADY_CLOSED",
        {
          sessionExecutionId,
          coordinatorState: "blocked",
          secondExecutionBlocked: true
        }
      );
    }

    const hostname = getHostname();
    if (!isLocalDevelopmentHost(hostname)) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "LOCAL_DEVELOPMENT_HOST_REQUIRED",
        {
          sessionExecutionId,
          coordinatorState: "blocked",
          executionAttemptCount: status.executionAttemptCount + 1,
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      sessionExecutionId,
      coordinatorState: "validating_readiness",
      executionAttemptCount: status.executionAttemptCount + 1
    });

    let firstReadinessResult;
    try {
      firstReadinessResult = getReadiness();
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "READINESS_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          readinessReadCount: status.readinessReadCount + 1,
          permanentlyClosed: true
        }
      );
    }

    const firstReadiness = normalizeReadiness(firstReadinessResult);
    updateStatus({
      readinessReadCount: status.readinessReadCount + 1,
      canonicalSafetyFlagSnapshot: firstReadiness.safetyFlags
    });

    if (!canonicalSafetyFlagsAreClosed(firstReadiness.safetyFlags)) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (!firstReadiness.ok || !firstReadiness.snapshot) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        firstReadiness.reasonCode,
        {
          coordinatorState: "blocked",
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
      coordinatorState: "validating_authorization"
    });

    let authorizationStatusResult;
    try {
      authorizationStatusResult = getAuthorizationStatus();
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "AUTHORIZATION_STATUS_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    const authorizationStatus =
      normalizeAuthorizationStatus(authorizationStatusResult);
    updateStatus({
      authorizationSessionId: authorizationStatus.sessionId,
      authorizationValidated: authorizationStatus.ok === true,
      canonicalSafetyFlagSnapshot: authorizationStatus.safetyFlags
    });

    if (!canonicalSafetyFlagsAreClosed(authorizationStatus.safetyFlags)) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (!authorizationStatus.ok || !authorizationStatus.snapshot) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        authorizationStatus.reasonCode,
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    const boundIdentityMismatch = compareBoundIdentity(
      firstReadiness.snapshot,
      authorizationStatus.snapshot
    );
    if (boundIdentityMismatch) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        boundIdentityMismatch,
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (typeof activationContractFactory !== "function") {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "MISSING_ACTIVATION_DEPENDENCY",
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (typeof rendererPipelineFactory !== "function") {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        "MISSING_PIPELINE_DEPENDENCY",
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      coordinatorState: "readiness_revalidated"
    });

    let secondReadinessResult;
    try {
      secondReadinessResult = getReadiness();
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "READINESS_REVALIDATION_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          readinessReadCount: status.readinessReadCount + 1,
          readinessRevalidationCount: status.readinessRevalidationCount + 1,
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
        "execute_authorized_one_frame_session",
        "blocked",
        "CANONICAL_SAFETY_FLAGS_NOT_CLOSED",
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    if (!secondReadiness.ok || !secondReadiness.snapshot) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        secondReadiness.reasonCode,
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    const readinessDriftReason = compareReadinessSnapshots(
      firstReadiness.snapshot,
      secondReadiness.snapshot
    );
    if (readinessDriftReason) {
      return finish(
        "execute_authorized_one_frame_session",
        "blocked",
        readinessDriftReason,
        {
          coordinatorState: "blocked",
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      coordinatorState: "authorization_consumed",
      authorizationConsumeAttemptCount:
        status.authorizationConsumeAttemptCount + 1
    });

    let consumeResult;
    try {
      consumeResult = consumeAuthorization();
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "AUTHORIZATION_CONSUME_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    if (!isObjectLike(consumeResult) || consumeResult.outcome !== "consumed") {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        consumeResult?.reasonCode ?? "AUTHORIZATION_CONSUME_FAILED",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      authorizationConsumed: true
    });

    let activationContract;
    try {
      activationContract = activationContractFactory({
        sessionExecutionId,
        boundSnapshot: secondReadiness.snapshot,
        authorizationStatus: authorizationStatusResult,
        consumedAuthorizationResult: consumeResult
      });
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "ACTIVATION_CONTRACT_FACTORY_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    if (
      !activationContract ||
      typeof activationContract.getActivationStatus !== "function" ||
      typeof activationContract.simulateOneFrameActivation !== "function"
    ) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        "BLOCKED_BY_ACTIVATION_PIPELINE_CONTRACT_MISMATCH",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    refs.activationContract = activationContract;
    updateStatus({
      coordinatorState: "activation_started",
      activationStarted: true
    });

    let activationResult;
    try {
      activationResult = activationContract.simulateOneFrameActivation();
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "ACTIVATION_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    if (!isObjectLike(activationResult) || activationResult.outcome !== "completed") {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        activationResult?.reasonCode ?? "ACTIVATION_FAILED",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true,
          realRendererInvoked: activationResult?.realRendererInvoked === true,
          realCanvasCreated: activationResult?.realCanvasCreated === true,
          realWebglContextCreated:
            activationResult?.realWebglContextCreated === true,
          realOverlayCreated: activationResult?.realOverlayCreated === true,
          networkRequested: activationResult?.networkRequested === true,
          assetDownloadRequested:
            activationResult?.assetDownloadRequested === true
        }
      );
    }

    let pipeline;
    try {
      pipeline = rendererPipelineFactory({
        sessionExecutionId,
        boundSnapshot: secondReadiness.snapshot,
        activationResult,
        authorizationStatus: authorizationStatusResult,
        consumedAuthorizationResult: consumeResult
      });
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "PIPELINE_FACTORY_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    if (
      !pipeline ||
      typeof pipeline.getPipelineStatus !== "function" ||
      typeof pipeline.executeOneFramePipeline !== "function"
    ) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        "BLOCKED_BY_ACTIVATION_PIPELINE_CONTRACT_MISMATCH",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    refs.pipeline = pipeline;
    updateStatus({
      coordinatorState: "pipeline_running",
      pipelineStarted: true
    });

    let pipelineResult;
    try {
      pipelineResult = pipeline.executeOneFramePipeline({
        sessionExecutionId,
        boundSnapshot: secondReadiness.snapshot
      });
    } catch (error) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        toReasonCode(error, "PIPELINE_EXECUTION_EXCEPTION"),
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    const pipelineEvaluation = evaluatePipelineResult(pipelineResult);

    updateStatus({
      pipelineCompleted: pipelineEvaluation.pipelineCompleted,
      completedFrameCount: pipelineEvaluation.completedFrameCount,
      cleanupVerified: pipelineEvaluation.cleanupVerified,
      referencesReleased: pipelineEvaluation.referencesReleased,
      cleanupFailureReasons: pipelineEvaluation.cleanupFailureReasons,
      realRendererInvoked:
        pipelineEvaluation.realRendererInvoked ||
        activationResult.realRendererInvoked === true,
      realDrawFunctionCalled:
        pipelineEvaluation.realDrawFunctionCalled ||
        activationResult.realDrawFunctionCalled === true,
      realCanvasCreated:
        pipelineEvaluation.realCanvasCreated ||
        activationResult.realCanvasCreated === true,
      realPaneCreated:
        pipelineEvaluation.realPaneCreated ||
        activationResult.realPaneCreated === true,
      realWebglContextCreated:
        pipelineEvaluation.realWebglContextCreated ||
        activationResult.realWebglContextCreated === true,
      realOverlayCreated:
        pipelineEvaluation.realOverlayCreated ||
        activationResult.realOverlayCreated === true,
      realListenerAdded:
        pipelineEvaluation.realListenerAdded ||
        activationResult.mapListenerAdded === true,
      networkRequested:
        pipelineEvaluation.networkRequested ||
        activationResult.networkRequested === true,
      assetDownloadRequested:
        pipelineEvaluation.assetDownloadRequested ||
        activationResult.assetDownloadRequested === true
    });

    if (pipelineResult?.outcome !== "completed") {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        pipelineResult?.reasonCode ?? "PIPELINE_FAILED",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    updateStatus({
      coordinatorState: "cleanup_verified"
    });

    if (!pipelineEvaluation.cleanupVerified) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        pipelineEvaluation.cleanupFailureReasons[0] ?? "CLEANUP_VERIFICATION_FAILED",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    if (!pipelineEvaluation.referencesReleased) {
      return finish(
        "execute_authorized_one_frame_session",
        "failed_closed",
        "REFERENCE_RELEASE_NOT_CONFIRMED",
        {
          coordinatorState: "failed_closed",
          permanentlyClosed: true
        }
      );
    }

    return finish(
      "execute_authorized_one_frame_session",
      "completed",
      "PASSIVE_AUTHORIZED_ONE_FRAME_SESSION_COMPLETED",
      {
        coordinatorState: "completed",
        permanentlyClosed: true
      }
    );
  }

  return deepFreeze({
    getCoordinatorStatus,
    executeAuthorizedOneFrameSession
  });
}
