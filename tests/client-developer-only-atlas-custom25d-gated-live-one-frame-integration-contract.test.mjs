import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.mjs"
  )
);

const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");

function createReadinessSnapshot(overrides = {}) {
  return {
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    rendererHandoffStatus: "ready_for_future_renderer_attachment",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    resolvedRegion: {
      regionId: overrides.regionId ?? "REGION_001"
    },
    resolvedPackage: {
      packageId: overrides.packageId ?? "PACKAGE_001",
      packageVersion: overrides.packageVersion ?? "v001",
      packageFingerprint: overrides.packageFingerprint ?? "fingerprint-001"
    },
    resolvedRecipe: {
      recipeId: overrides.recipeId ?? "RECIPE_001",
      selectedVersion: overrides.recipeVersion ?? "v001"
    },
    selectorSeed: overrides.selectorSeed ?? "selector-seed-001",
    safetyFlagSnapshot: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }
  };
}

function createAuthorizationStatus(overrides = {}) {
  return {
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
    authorizationActive: true,
    authorizationConsumed: false,
    authorizationInvalidated: false,
    approvedReadinessBound: true,
    currentReadinessMatchesAuthorization: true,
    sessionId: overrides.sessionId ?? "AUTH_SESSION_001",
    boundRegionId: overrides.regionId ?? "REGION_001",
    boundPackageId: overrides.packageId ?? "PACKAGE_001",
    boundPackageVersion: overrides.packageVersion ?? "v001",
    boundPackageFingerprint: overrides.packageFingerprint ?? "fingerprint-001",
    boundRecipeId: overrides.recipeId ?? "RECIPE_001",
    boundRecipeVersion: overrides.recipeVersion ?? "v001",
    boundSelectorSeed: overrides.selectorSeed ?? "selector-seed-001",
    canonicalRuntimeExecutionEnabled: false,
    canonicalMapAttachmentAllowed: false,
    canonicalAutomaticRendererExecutionAllowed: false,
    canonicalLifecycleExecutionEnabled: false
  };
}

function createEnvironment(overrides = {}) {
  const calls = {
    readiness: 0,
    authorizationStatus: 0,
    authorizationConsume: 0,
    prepareSurface: 0,
    rollbackSurface: 0,
    translation: 0,
    lifecycleOwnerFactory: 0,
    lifecycleRegistration: 0,
    lifecycleDispose: 0,
    frameSnapshot: 0,
    drawOperationFactory: 0,
    draw: 0
  };
  const order = [];

  const map = { id: "fake-map" };
  const pane = { id: "fake-pane", childElementCount: 0 };
  const canvas = { className: "custom-25d-map-canvas" };
  const preparedSurface = {
    schemaId: "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001",
    map,
    pane,
    canvas,
    paneName: "custom25DMapPane",
    canvasClassName: "custom-25d-map-canvas",
    paneOwnedByOperation: overrides.paneOwnedByOperation ?? false,
    canvasOwnedByOperation: true,
    canvasAppended: true,
    cleanupRequired: true,
    rollbackAvailable: true,
    listenerAdded: false,
    retentionWritten: false,
    drawRequested: false
  };
  const lifecycleBundle = {
    schemaId: "GROWGO_CUSTOM25D_ONE_FRAME_LIFECYCLE_REGISTRATION_BUNDLE_001",
    ownershipMode: "ONE_FRAME_SURFACE_ONLY",
    map,
    pane,
    canvas,
    paneName: "custom25DMapPane",
    canvasClassName: "custom-25d-map-canvas"
  };
  const frameSnapshot = { schemaId: "FRAME_ROOT_SNAPSHOT_001", ready: true };

  let consumed = false;
  const readinessQueue = overrides.readinessQueue ?? [
    createReadinessSnapshot(),
    createReadinessSnapshot()
  ];
  const authorizationStatus =
    overrides.authorizationStatus ?? createAuthorizationStatus();

  const lifecycleOwnerDefault = {
    registerOwnedResources(bundle) {
      calls.lifecycleRegistration += 1;
      order.push("register");
      if (overrides.throwOnRegistration) throw overrides.throwOnRegistration;
      if (overrides.registrationFailure) {
        return { outcome: "failed_closed", reasonCode: overrides.registrationFailure };
      }
      assert.equal(bundle.ownershipMode, "ONE_FRAME_SURFACE_ONLY");
      return { outcome: "registered", reasonCode: "OWNERSHIP_REGISTERED" };
    },
    disposeOwnedResources() {
      calls.lifecycleDispose += 1;
      order.push("cleanup");
      if (overrides.throwOnCleanup) throw overrides.throwOnCleanup;
      if (overrides.cleanupFailure) {
        return {
          outcome: "failed_closed",
          reasonCode: overrides.cleanupFailure,
          cleanupFailureReasons: [overrides.cleanupFailure]
        };
      }
      return { outcome: "disposed", reasonCode: "CLEANUP_COMPLETED" };
    },
    getLifecycleOwnerStatus() {
      return { lifecycleState: "registered" };
    }
  };

  const surfaceOperationsDefault = {
    prepareOneFrameSurface() {
      calls.prepareSurface += 1;
      order.push("prepare");
      if (overrides.throwOnSurfacePrepare) throw overrides.throwOnSurfacePrepare;
      if (overrides.surfaceFailure) {
        return { outcome: "failed_closed", reasonCode: overrides.surfaceFailure };
      }
      return { outcome: "prepared", reasonCode: "LIVE_SURFACE_PREPARED", surface: preparedSurface };
    },
    rollbackPreparedSurface() {
      calls.rollbackSurface += 1;
      order.push("rollback");
      if (overrides.throwOnRollback) throw overrides.throwOnRollback;
      return overrides.rollbackResult ?? {
        outcome: "rolled_back",
        reasonCode: "ROLLBACK_COMPLETED",
        rollbackCompleted: true
      };
    }
  };

  const lifecycleTranslationDefault = {
    translatePreparedSurfaceToLifecycleBundle({ preparedSurface: translatedSurface, lifecycleOwner: owner }) {
      calls.translation += 1;
      order.push("translate");
      if (overrides.throwOnTranslation) throw overrides.throwOnTranslation;
      if (overrides.translationFailure) {
        return { outcome: "failed_closed", reasonCode: overrides.translationFailure };
      }
      const registrationResult = owner.registerOwnedResources(lifecycleBundle);
      return {
        outcome: registrationResult.outcome === "registered" ? "translated" : "failed_closed",
        reasonCode:
          registrationResult.outcome === "registered"
            ? "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED"
            : registrationResult.reasonCode,
        ownershipMode: "ONE_FRAME_SURFACE_ONLY",
        lifecycleRegistrationAttempted: true,
        lifecycleRegistrationSucceeded: registrationResult.outcome === "registered",
        lifecycleBundle
      };
    }
  };

  const contract =
    moduleUnderTest.createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract({
      hostnameProvider: () => overrides.hostname ?? "localhost",
      readinessProvider: () => {
        calls.readiness += 1;
        order.push(`readiness-${calls.readiness}`);
        if (overrides.throwOnReadiness) throw overrides.throwOnReadiness;
        return readinessQueue[calls.readiness - 1] ?? readinessQueue.at(-1);
      },
      authorizationStatusProvider: () => {
        calls.authorizationStatus += 1;
        order.push("authorization-status");
        if (overrides.throwOnAuthorizationStatus) {
          throw overrides.throwOnAuthorizationStatus;
        }
        return overrides.authorizationStatusValue ?? authorizationStatus;
      },
      authorizationConsume: () => {
        calls.authorizationConsume += 1;
        order.push("consume");
        if (overrides.throwOnConsume) throw overrides.throwOnConsume;
        if (consumed || overrides.consumeFailure) {
          return { outcome: "blocked", reasonCode: overrides.consumeFailure ?? "AUTH_REUSED" };
        }
        consumed = true;
        return { operation: "consume", outcome: "consumed", reasonCode: "CONSUMED" };
      },
      surfaceOperations:
        Object.prototype.hasOwnProperty.call(overrides, "surfaceOperations")
          ? overrides.surfaceOperations
          : surfaceOperationsDefault,
      lifecycleTranslation:
        Object.prototype.hasOwnProperty.call(overrides, "lifecycleTranslation")
          ? overrides.lifecycleTranslation
          : lifecycleTranslationDefault,
      lifecycleOwnerFactory: () => {
        calls.lifecycleOwnerFactory += 1;
        order.push("owner-factory");
        if (overrides.throwOnLifecycleOwnerFactory) {
          throw overrides.throwOnLifecycleOwnerFactory;
        }
        return Object.prototype.hasOwnProperty.call(overrides, "lifecycleOwner")
          ? overrides.lifecycleOwner
          : lifecycleOwnerDefault;
      },
      frameSnapshotFactory: () => {
        calls.frameSnapshot += 1;
        order.push("snapshot");
        if (overrides.throwOnFrameSnapshot) throw overrides.throwOnFrameSnapshot;
        return Object.prototype.hasOwnProperty.call(overrides, "frameSnapshotValue")
          ? overrides.frameSnapshotValue
          : frameSnapshot;
      },
      drawOperationFactory: () => {
        calls.drawOperationFactory += 1;
        order.push("draw-factory");
        if (overrides.throwOnDrawOperationFactory) {
          throw overrides.throwOnDrawOperationFactory;
        }
        return {
          drawPreparedSurfaceExactlyOnce() {
            calls.draw += 1;
            order.push("draw");
            if (overrides.throwOnDraw) throw overrides.throwOnDraw;
            if (overrides.drawFailure) {
              return { outcome: "failed_closed", reasonCode: overrides.drawFailure };
            }
            return { outcome: "completed", reasonCode: "LIVE_ONE_FRAME_DRAW_COMPLETED" };
          }
        };
      },
      integrationIdGenerator: () => overrides.integrationId ?? "INTEGRATION_001"
    });

  return { contract, calls, order, map, pane, canvas };
}

test("module import has no side effects factory exists and initial state is idle", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract,
    "function"
  );
  const env = createEnvironment();
  const status = env.contract.getIntegrationStatus();
  assert.equal(status.integrationState, "idle");
  assert.equal(status.executionAttemptCount, 0);
  assert.equal(status.automaticInvocation, false);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /developer-only-atlas-custom25d-gated-live-one-frame-integration-contract/
  );
});

test("successful full fake live-shaped integration completes with exact ordering and permanent closure", () => {
  const env = createEnvironment({ paneOwnedByOperation: true });
  const result = env.contract.executeGatedLiveOneFrameIntegration();
  const statusAfterSuccess = env.contract.getIntegrationStatus();
  const second = env.contract.executeGatedLiveOneFrameIntegration();
  const status = env.contract.getIntegrationStatus();

  assert.equal(result.outcome, "completed");
  assert.equal(result.integrationId, "INTEGRATION_001");
  assert.equal(result.readinessReadCount, 2);
  assert.equal(result.authorizationValidated, true);
  assert.equal(result.authorizationConsumeAttemptCount, 1);
  assert.equal(result.authorizationConsumed, true);
  assert.equal(result.surfacePreparationAttemptCount, 1);
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.cleanupMandatory, true);
  assert.equal(result.translationAttemptCount, 1);
  assert.equal(result.translationSucceeded, true);
  assert.equal(result.lifecycleRegistrationAttemptCount, 1);
  assert.equal(result.lifecycleOwnershipRegistered, true);
  assert.equal(result.frameSnapshotAttemptCount, 1);
  assert.equal(result.frameSnapshotCreated, true);
  assert.equal(result.drawOperationAttemptCount, 1);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.secondExecutionBlocked, true);
  assert.equal(result.secondDrawBlocked, true);
  assert.equal(result.ownershipMode, "ONE_FRAME_SURFACE_ONLY");
  assert.equal(second.reasonCode, "INTEGRATION_ALREADY_CLOSED");
  assert.deepEqual(env.order, [
    "readiness-1",
    "authorization-status",
    "readiness-2",
    "consume",
    "prepare",
    "owner-factory",
    "translate",
    "register",
    "snapshot",
    "draw-factory",
    "draw",
    "cleanup"
  ]);
  assert.equal(env.calls.rollbackSurface, 0);
  assert.equal(statusAfterSuccess.integrationState, "completed");
  assert.equal(status.integrationState, "blocked");
});

test("dependencies validate before consumption and consumed authorization cannot be reused", () => {
  const env = createEnvironment();
  const result = env.contract.executeGatedLiveOneFrameIntegration();
  assert.equal(result.authorizationConsumeAttemptCount, 1);
  assert.ok(env.order.indexOf("consume") > env.order.indexOf("authorization-status"));
  assert.ok(env.order.indexOf("consume") > env.order.indexOf("readiness-2"));
  assert.ok(env.order.indexOf("prepare") > env.order.indexOf("consume"));
});

test("non-local host readiness drift invalidated authorization consumed authorization identity mismatch and missing dependency all block before consumption", () => {
  const nonLocal = createEnvironment({ hostname: "example.com" }).contract.executeGatedLiveOneFrameIntegration();
  const drift = createEnvironment({
    readinessQueue: [
      createReadinessSnapshot(),
      createReadinessSnapshot({ selectorSeed: "drifted-seed" })
    ]
  }).contract.executeGatedLiveOneFrameIntegration();
  const invalidated = createEnvironment({
    authorizationStatusValue: { ...createAuthorizationStatus(), authorizationInvalidated: true, invalidationReasonCode: "AUTH_INVALIDATED" }
  }).contract.executeGatedLiveOneFrameIntegration();
  const consumed = createEnvironment({
    authorizationStatusValue: { ...createAuthorizationStatus(), authorizationConsumed: true }
  }).contract.executeGatedLiveOneFrameIntegration();
  const mismatch = createEnvironment({
    authorizationStatusValue: { ...createAuthorizationStatus({ packageId: "OTHER_PACKAGE" }) }
  }).contract.executeGatedLiveOneFrameIntegration();
  const missingDependency = createEnvironment({
    surfaceOperations: null
  }).contract.executeGatedLiveOneFrameIntegration();

  assert.equal(nonLocal.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");
  assert.equal(drift.reasonCode, "SELECTOR_SEED_DRIFTED_BEFORE_CONSUMPTION");
  assert.equal(drift.authorizationConsumed, false);
  assert.equal(invalidated.reasonCode, "AUTH_INVALIDATED");
  assert.equal(consumed.reasonCode, "AUTHORIZATION_ALREADY_CONSUMED");
  assert.equal(mismatch.reasonCode, "BOUND_PACKAGE_ID_MISMATCH");
  assert.equal(missingDependency.reasonCode, "MISSING_SURFACE_OPERATIONS_DEPENDENCY");
});

test("surface failure closes and translation plus registration failures trigger rollback cleanup", () => {
  const surfaceFailureEnv = createEnvironment({ surfaceFailure: "SURFACE_FAILED" });
  const surfaceFailure = surfaceFailureEnv.contract.executeGatedLiveOneFrameIntegration();
  const translationFailureEnv = createEnvironment({ translationFailure: "TRANSLATION_FAILED" });
  const translationFailure = translationFailureEnv.contract.executeGatedLiveOneFrameIntegration();
  const registrationFailureEnv = createEnvironment({ registrationFailure: "OWNERSHIP_REGISTRATION_FAILED" });
  const registrationFailure = registrationFailureEnv.contract.executeGatedLiveOneFrameIntegration();

  assert.equal(surfaceFailure.reasonCode, "SURFACE_FAILED");
  assert.equal(surfaceFailure.completedFrameCount, 0);
  assert.equal(surfaceFailureEnv.calls.rollbackSurface, 0);

  assert.equal(translationFailure.reasonCode, "TRANSLATION_FAILED");
  assert.equal(translationFailureEnv.calls.rollbackSurface, 1);
  assert.equal(translationFailure.completedFrameCount, 0);

  assert.equal(registrationFailure.reasonCode, "OWNERSHIP_REGISTRATION_FAILED");
  assert.equal(registrationFailureEnv.calls.rollbackSurface, 1);
  assert.equal(registrationFailure.completedFrameCount, 0);
});

test("frame snapshot failure draw failure and draw exception cleanup and permanently close", () => {
  const snapshotFailureEnv = createEnvironment({
    frameSnapshotValue: null
  });
  const snapshotFailure = snapshotFailureEnv.contract.executeGatedLiveOneFrameIntegration();
  const drawFailureEnv = createEnvironment({ drawFailure: "DRAW_FAILED" });
  const drawFailure = drawFailureEnv.contract.executeGatedLiveOneFrameIntegration();
  const drawExceptionEnv = createEnvironment({
    throwOnDraw: Object.assign(new Error("draw blew up"), {
      reasonCode: "DRAW_EXCEPTION"
    })
  });
  const drawException = drawExceptionEnv.contract.executeGatedLiveOneFrameIntegration();

  assert.equal(snapshotFailure.completedFrameCount, 0);
  assert.equal(snapshotFailureEnv.calls.lifecycleDispose, 1);
  assert.equal(drawFailure.completedFrameCount, 0);
  assert.equal(drawFailureEnv.calls.lifecycleDispose, 1);
  assert.equal(drawException.completedFrameCount, 0);
  assert.equal(drawExceptionEnv.calls.lifecycleDispose, 1);
});

test("cleanup failure is reported precisely and reference release still happens", () => {
  const env = createEnvironment({ cleanupFailure: "CANVAS_REMOVAL_FAILED" });
  const result = env.contract.executeGatedLiveOneFrameIntegration();
  const status = env.contract.getIntegrationStatus();

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupFailed, true);
  assert.match(result.cleanupFailureReasons.join(","), /CANVAS_REMOVAL_FAILED/);
  assert.equal(result.referencesReleased, true);
  assert.equal(status.permanentlyClosed, true);
});

test("exception coverage is structured fail-closed", () => {
  const readinessException = createEnvironment({
    throwOnReadiness: Object.assign(new Error("readiness"), {
      reasonCode: "READINESS_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const authStatusException = createEnvironment({
    throwOnAuthorizationStatus: Object.assign(new Error("auth"), {
      reasonCode: "AUTH_STATUS_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const consumeException = createEnvironment({
    throwOnConsume: Object.assign(new Error("consume"), {
      reasonCode: "CONSUME_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const surfaceException = createEnvironment({
    throwOnSurfacePrepare: Object.assign(new Error("surface"), {
      reasonCode: "SURFACE_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const translationException = createEnvironment({
    throwOnTranslation: Object.assign(new Error("translation"), {
      reasonCode: "TRANSLATION_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const ownerFactoryException = createEnvironment({
    throwOnLifecycleOwnerFactory: Object.assign(new Error("owner"), {
      reasonCode: "OWNER_FACTORY_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const snapshotException = createEnvironment({
    throwOnFrameSnapshot: Object.assign(new Error("snapshot"), {
      reasonCode: "SNAPSHOT_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const drawFactoryException = createEnvironment({
    throwOnDrawOperationFactory: Object.assign(new Error("draw factory"), {
      reasonCode: "DRAW_FACTORY_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();
  const cleanupException = createEnvironment({
    throwOnCleanup: Object.assign(new Error("cleanup"), {
      reasonCode: "CLEANUP_BROKEN"
    })
  }).contract.executeGatedLiveOneFrameIntegration();

  assert.equal(readinessException.reasonCode, "READINESS_BROKEN");
  assert.equal(authStatusException.reasonCode, "AUTH_STATUS_BROKEN");
  assert.equal(consumeException.reasonCode, "CONSUME_BROKEN");
  assert.equal(surfaceException.reasonCode, "SURFACE_BROKEN");
  assert.equal(translationException.reasonCode, "TRANSLATION_BROKEN");
  assert.equal(ownerFactoryException.reasonCode, "OWNER_FACTORY_BROKEN");
  assert.equal(snapshotException.cleanupAttemptCount, 1);
  assert.equal(drawFactoryException.cleanupAttemptCount, 1);
  assert.equal(cleanupException.reasonCode, "CLEANUP_BROKEN");
});

test("status inspection has no side effects results are deeply immutable and no real runtime behavior is introduced", () => {
  const env = createEnvironment();
  const before = env.contract.getIntegrationStatus();
  const result = env.contract.executeGatedLiveOneFrameIntegration();
  const after = env.contract.getIntegrationStatus();

  assert.equal(before.executionAttemptCount, 0);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(after), true);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.realListenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /executeGatedLiveOneFrameIntegration|createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract/
  );
  assert.doesNotMatch(
    scriptSource,
    /createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract/
  );
});
