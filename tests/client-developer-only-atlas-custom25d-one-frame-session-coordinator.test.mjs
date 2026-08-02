import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const coordinatorModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-session-coordinator.mjs"
  )
);
const authorizationModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-renderer-handoff-authorization.mjs"
  )
);

const coordinatorSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-session-coordinator.mjs"
  ),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createApprovedReadiness(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    rendererHandoffStatus: "ready_for_future_renderer_attachment",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    resolvedRegion: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
    }),
    resolvedPackage: Object.freeze({
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      packageVersion: "v001",
      packageFingerprint:
        "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectedVersion: "v001"
    }),
    selectorSeed:
      "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
    safetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }),
    ...overrides
  });
}

function createBlockedReadiness(reasonCode = "REGION_OUT_OF_SCOPE") {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode,
    rendererHandoffStatus: "blocked",
    rendererConsumerAvailable: false,
    rendererIdentityValidated: false,
    resolvedRegion: null,
    resolvedPackage: null,
    resolvedRecipe: null,
    selectorSeed: null,
    safetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createAuthorizationStatus(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
    authorizationActive: true,
    authorizationSource: "developer-one-session-renderer-handoff-local",
    localDevelopmentHost: true,
    confirmationAccepted: true,
    sessionId: "AUTH_SESSION_001",
    authorizationConsumed: false,
    authorizationInvalidated: false,
    invalidationReasonCode: null,
    invalidatedAtReadinessReasonCode: null,
    authorizationRevoked: false,
    approvedReadinessBound: true,
    currentReadinessMatchesAuthorization: true,
    currentReadinessReasonCode: "READINESS_MATCHED",
    boundRegionId:
      "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    boundPackageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    boundPackageVersion: "v001",
    boundPackageFingerprint:
      "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed",
    boundRecipeId: "COASTAL_LOCATION_RECIPE_001",
    boundRecipeVersion: "v001",
    boundSelectorSeed:
      "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    canonicalRuntimeExecutionEnabled: false,
    canonicalMapAttachmentAllowed: false,
    canonicalAutomaticRendererExecutionAllowed: false,
    canonicalLifecycleExecutionEnabled: false,
    rendererInitializationAllowed: true,
    rendererAttachmentAllowed: true,
    drawAllowed: true,
    automaticAuthorization: false,
    automaticInvocation: false,
    persistentAuthorization: false,
    storageUsed: false,
    rendererInitialized: false,
    rendererAttached: false,
    drawRequested: false,
    canvasCreated: false,
    webglContextCreated: false,
    overlayCreated: false,
    listenerAdded: false,
    networkRequested: false,
    assetDownloadRequested: false,
    ...overrides
  });
}

function createConsumeResult(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_OPERATION_RESULT_001",
    operation: "consume",
    outcome: "consumed",
    reasonCode: "AUTHORIZED_RENDERER_HANDOFF_READY_FOR_FUTURE_ATTEMPT",
    authorizationStatus: createAuthorizationStatus({
      authorizationConsumed: true,
      authorizationActive: false,
      rendererInitializationAllowed: false,
      rendererAttachmentAllowed: false,
      drawAllowed: false
    }),
    ...overrides
  });
}

function createActivationResult(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_ONE_FRAME_RENDERER_ACTIVATION_RESULT_001",
    activationId: "ACTIVATION_001",
    operation: "simulate_one_frame_activation",
    outcome: "completed",
    reasonCode: "SIMULATED_ONE_FRAME_COMPLETED",
    activationState: "disposed",
    sessionId: "AUTH_SESSION_001",
    readinessValidated: true,
    authorizationValidated: true,
    authorizationConsumed: true,
    rendererIdentityValidated: true,
    requestedFrameCount: 1,
    completedFrameCount: 1,
    initializationAttemptCount: 1,
    drawAttemptCount: 1,
    disposalAttemptCount: 1,
    cleanupCompleted: true,
    secondFrameBlocked: true,
    boundRegionId:
      "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    boundPackageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    boundPackageVersion: "v001",
    boundPackageFingerprint:
      "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed",
    boundRecipeId: "COASTAL_LOCATION_RECIPE_001",
    boundRecipeVersion: "v001",
    boundSelectorSeed:
      "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    mapListenerAdded: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }),
    ...overrides
  });
}

function createPipelineResult(overrides = {}) {
  return Object.freeze({
    schemaId: "GROWGO_CUSTOM_25D_ONE_FRAME_PIPELINE_RESULT_001",
    pipelineId: "PIPELINE_001",
    operation: "execute_one_frame_pipeline",
    outcome: "completed",
    reasonCode: "PIPELINE_COMPLETED",
    pipelineState: "disposed",
    executionAttemptCount: 1,
    surfacePreparationAttemptCount: 1,
    surfacePrepared: true,
    lifecycleRegistrationAttemptCount: 1,
    lifecycleOwnershipRegistered: true,
    drawAttemptCount: 1,
    completedFrameCount: 1,
    drawCompleted: true,
    cleanupAttemptCount: 1,
    cleanupCompleted: true,
    cleanupFailed: false,
    cleanupFailureReasons: Object.freeze([]),
    permanentlyClosed: true,
    secondExecutionBlocked: false,
    paneReused: false,
    paneCreated: true,
    canvasCreated: true,
    canvasAppended: true,
    canvasRemoved: true,
    listenerRemoved: true,
    retentionReset: true,
    unrelatedResourcesPreserved: true,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    realListenerAdded: false,
    mapReferenceRetained: false,
    canvasReferenceRetained: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }),
    ...overrides
  });
}

function createActivationContractHarness({
  result = createActivationResult(),
  throwOnActivate = null
} = {}) {
  const counts = {
    getStatus: 0,
    simulate: 0,
    factory: 0
  };

  function factory() {
    counts.factory += 1;
    return {
      getActivationStatus() {
        counts.getStatus += 1;
        return Object.freeze({
          activationState: "idle"
        });
      },
      simulateOneFrameActivation() {
        counts.simulate += 1;
        if (throwOnActivate) {
          throw throwOnActivate;
        }
        return result;
      }
    };
  }

  return { counts, factory };
}

function createPipelineHarness({
  result = createPipelineResult(),
  throwOnExecute = null
} = {}) {
  const counts = {
    getStatus: 0,
    execute: 0,
    factory: 0
  };

  function factory() {
    counts.factory += 1;
    return {
      getPipelineStatus() {
        counts.getStatus += 1;
        return Object.freeze({
          pipelineState: "idle"
        });
      },
      executeOneFramePipeline() {
        counts.execute += 1;
        if (throwOnExecute) {
          throw throwOnExecute;
        }
        return result;
      }
    };
  }

  return { counts, factory };
}

function createRealAuthorizationHarness({
  readinessSequence = [createApprovedReadiness(), createApprovedReadiness()],
  hostname = "localhost",
  sessionId = "AUTH_SESSION_001"
} = {}) {
  let directReadinessReadCount = 0;
  let currentReadiness = readinessSequence[0] ?? null;

  const readinessProvider = () => {
    const value =
      readinessSequence[
        Math.min(directReadinessReadCount, readinessSequence.length - 1)
      ] ?? null;
    currentReadiness = value;
    directReadinessReadCount += 1;
    return value;
  };

  const authorization =
    authorizationModule.createControlledOneSessionDeveloperRendererHandoffAuthorization(
      {
        getHostname: () => hostname,
        getCurrentReadiness: () => currentReadiness,
        createSessionId: () => sessionId
      }
    );

  authorization.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  return {
    readinessProvider,
    getReadinessReadCount: () => directReadinessReadCount,
    authorizationStatusProvider: () =>
      authorization.getAtlasRendererHandoffAuthorizationStatus(),
    authorizationConsume: () =>
      authorization.consumeAuthorizedRendererHandoffAttempt(),
    getAuthorizationStatus: () =>
      authorization.getAtlasRendererHandoffAuthorizationStatus()
  };
}

function createCoordinator({
  hostname = "localhost",
  readinessProvider = () => createApprovedReadiness(),
  authorizationStatusProvider = () => createAuthorizationStatus(),
  authorizationConsume = () => createConsumeResult(),
  activationContractFactory = createActivationContractHarness().factory,
  rendererPipelineFactory = createPipelineHarness().factory,
  sessionExecutionId = "SESSION_EXECUTION_001"
} = {}) {
  return coordinatorModule.createDeveloperOnlyAtlasCustom25DOneFrameSessionCoordinator(
    {
      hostnameProvider: () => hostname,
      readinessProvider,
      authorizationStatusProvider,
      authorizationConsume,
      activationContractFactory,
      rendererPipelineFactory,
      sessionExecutionIdGenerator: () => sessionExecutionId
    }
  );
}

test("module import has no side effects, factory exists, initial state is idle, and source remains passive", () => {
  assert.equal(
    typeof coordinatorModule
      .createDeveloperOnlyAtlasCustom25DOneFrameSessionCoordinator,
    "function"
  );

  const activationHarness = createActivationContractHarness();
  const pipelineHarness = createPipelineHarness();
  const coordinator = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  });

  const statusA = coordinator.getCoordinatorStatus();
  const statusB = coordinator.getCoordinatorStatus();

  assert.equal(statusA.coordinatorState, "idle");
  assert.equal(statusA.executionAttemptCount, 0);
  assert.equal(statusA.readinessReadCount, 0);
  assert.equal(statusA.readinessRevalidationCount, 0);
  assert.equal(statusA.authorizationValidated, false);
  assert.equal(statusA.authorizationConsumeAttemptCount, 0);
  assert.equal(statusA.authorizationConsumed, false);
  assert.equal(statusA.activationStarted, false);
  assert.equal(statusA.pipelineStarted, false);
  assert.equal(statusA.pipelineCompleted, false);
  assert.equal(statusA.completedFrameCount, 0);
  assert.equal(statusA.cleanupVerified, false);
  assert.equal(statusA.referencesReleased, false);
  assert.equal(statusA.permanentlyClosed, false);
  assert.equal(statusA, statusB);
  assert.equal(Object.isFrozen(statusA), true);
  assert.equal(activationHarness.counts.factory, 0);
  assert.equal(pipelineHarness.counts.factory, 0);

  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.doesNotMatch(coordinatorSource, /initCustom25DMapExperiment\(/);
  assert.doesNotMatch(coordinatorSource, /drawCustom25DMapCanvas\(/);
  assert.doesNotMatch(coordinatorSource, /custom25DMapLayer\s*=/);
  assert.doesNotMatch(coordinatorSource, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(coordinatorSource, /\.on\(/);
  assert.doesNotMatch(coordinatorSource, /setTimeout|setInterval|fetch\(/);
  assert.doesNotMatch(developmentAlphaAppSource, /createDeveloperOnlyAtlasCustom25DOneFrameSessionCoordinator/);
});

test("successful fake session validates readiness and authorization, consumes once, runs activation and pipeline once, verifies cleanup, releases references, and blocks reuse", () => {
  const authHarness = createRealAuthorizationHarness();
  const activationHarness = createActivationContractHarness();
  const pipelineHarness = createPipelineHarness();
  const coordinator = createCoordinator({
    readinessProvider: authHarness.readinessProvider,
    authorizationStatusProvider: authHarness.authorizationStatusProvider,
    authorizationConsume: authHarness.authorizationConsume,
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory,
    sessionExecutionId: "SESSION_SUCCESS_001"
  });

  const result = coordinator.executeAuthorizedOneFrameSession();
  const secondExecution = coordinator.executeAuthorizedOneFrameSession();
  const finalAuthStatus = authHarness.getAuthorizationStatus();

  assert.equal(result.outcome, "completed");
  assert.equal(
    result.reasonCode,
    "PASSIVE_AUTHORIZED_ONE_FRAME_SESSION_COMPLETED"
  );
  assert.equal(result.coordinatorState, "completed");
  assert.equal(result.sessionExecutionId, "SESSION_SUCCESS_001");
  assert.equal(result.executionAttemptCount, 1);
  assert.equal(result.readinessReadCount, 2);
  assert.equal(result.readinessRevalidationCount, 1);
  assert.equal(result.authorizationValidated, true);
  assert.equal(result.authorizationConsumeAttemptCount, 1);
  assert.equal(result.authorizationConsumed, true);
  assert.equal(result.activationStarted, true);
  assert.equal(result.pipelineStarted, true);
  assert.equal(result.pipelineCompleted, true);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.cleanupVerified, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.secondExecutionBlocked, false);
  assert.equal(result.authorizationSessionId, "AUTH_SESSION_001");
  assert.equal(
    result.boundRegionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(result.boundPackageVersion, "v001");
  assert.deepEqual(result.cleanupFailureReasons, []);
  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => {
    result.coordinatorState = "mutated";
  });

  assert.equal(authHarness.getReadinessReadCount(), 2);
  assert.equal(activationHarness.counts.factory, 1);
  assert.equal(activationHarness.counts.simulate, 1);
  assert.equal(pipelineHarness.counts.factory, 1);
  assert.equal(pipelineHarness.counts.execute, 1);
  assert.equal(finalAuthStatus.authorizationConsumed, true);

  assert.equal(secondExecution.outcome, "blocked");
  assert.equal(secondExecution.reasonCode, "SESSION_COORDINATOR_ALREADY_CLOSED");
  assert.equal(secondExecution.secondExecutionBlocked, true);
});

test("non-local host, blocked readiness, consumed authorization, invalidated authorization, and each identity mismatch fail closed before consumption", () => {
  const activationHarness = createActivationContractHarness();
  const pipelineHarness = createPipelineHarness();

  const nonLocal = createCoordinator({
    hostname: "growgo.example",
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(nonLocal.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");

  const blockedReadiness = createCoordinator({
    readinessProvider: () => createBlockedReadiness(),
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(blockedReadiness.reasonCode, "REGION_OUT_OF_SCOPE");

  const consumedAuthorization = createCoordinator({
    authorizationStatusProvider: () =>
      createAuthorizationStatus({
        authorizationConsumed: true
      }),
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(consumedAuthorization.reasonCode, "AUTHORIZATION_ALREADY_CONSUMED");

  const invalidatedAuthorization = createCoordinator({
    authorizationStatusProvider: () =>
      createAuthorizationStatus({
        authorizationInvalidated: true,
        invalidationReasonCode: "PACKAGE_FINGERPRINT_DRIFTED"
      }),
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(invalidatedAuthorization.reasonCode, "PACKAGE_FINGERPRINT_DRIFTED");

  const identityCases = [
    ["BOUND_REGION_ID_MISMATCH", { boundRegionId: "OTHER_REGION" }],
    ["BOUND_PACKAGE_ID_MISMATCH", { boundPackageId: "OTHER_PACKAGE" }],
    ["BOUND_PACKAGE_VERSION_MISMATCH", { boundPackageVersion: "v999" }],
    ["BOUND_PACKAGE_FINGERPRINT_MISMATCH", { boundPackageFingerprint: "other" }],
    ["BOUND_RECIPE_ID_MISMATCH", { boundRecipeId: "OTHER_RECIPE" }],
    ["BOUND_RECIPE_VERSION_MISMATCH", { boundRecipeVersion: "v999" }],
    ["BOUND_SELECTOR_SEED_MISMATCH", { boundSelectorSeed: "other-seed" }]
  ];

  for (const [reasonCode, override] of identityCases) {
    const result = createCoordinator({
      authorizationStatusProvider: () => createAuthorizationStatus(override),
      activationContractFactory: activationHarness.factory,
      rendererPipelineFactory: pipelineHarness.factory
    }).executeAuthorizedOneFrameSession();
    assert.equal(result.reasonCode, reasonCode);
    assert.equal(result.authorizationConsumed, false);
  }
});

test("readiness drift blocks before consumption and keeps authorization reusable", () => {
  const authHarness = createRealAuthorizationHarness({
    readinessSequence: [
      createApprovedReadiness(),
      createApprovedReadiness({
        resolvedPackage: Object.freeze({
          packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
          packageVersion: "v002",
          packageFingerprint:
            "changed94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
        })
      })
    ]
  });
  const activationHarness = createActivationContractHarness();
  const pipelineHarness = createPipelineHarness();
  const coordinator = createCoordinator({
    readinessProvider: authHarness.readinessProvider,
    authorizationStatusProvider: authHarness.authorizationStatusProvider,
    authorizationConsume: authHarness.authorizationConsume,
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  });

  const result = coordinator.executeAuthorizedOneFrameSession();
  const authStatus = authHarness.getAuthorizationStatus();

  assert.equal(
    result.reasonCode,
    "PACKAGE_VERSION_DRIFTED_BEFORE_CONSUMPTION"
  );
  assert.equal(result.authorizationConsumed, false);
  assert.equal(result.pipelineStarted, false);
  assert.equal(result.cleanupVerified, false);
  assert.equal(activationHarness.counts.factory, 0);
  assert.equal(pipelineHarness.counts.factory, 0);
  assert.equal(authStatus.authorizationConsumed, false);
});

test("missing dependencies and activation failure close permanently without starting the pipeline", () => {
  const activationHarness = createActivationContractHarness({
    result: createActivationResult({
      outcome: "failed_closed",
      reasonCode: "ACTIVATION_FAILED"
    })
  });
  const pipelineHarness = createPipelineHarness();

  const missingActivation = createCoordinator({
    activationContractFactory: null,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(missingActivation.reasonCode, "MISSING_ACTIVATION_DEPENDENCY");

  const missingPipeline = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: null
  }).executeAuthorizedOneFrameSession();
  assert.equal(missingPipeline.reasonCode, "MISSING_PIPELINE_DEPENDENCY");

  const activationFailure = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: pipelineHarness.factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(activationFailure.reasonCode, "ACTIVATION_FAILED");
  assert.equal(activationFailure.activationStarted, true);
  assert.equal(activationFailure.pipelineStarted, false);
  assert.equal(pipelineHarness.counts.factory, 0);
});

test("surface failure, draw failure, and cleanup failure are preserved precisely and remain permanently closed", () => {
  const activationHarness = createActivationContractHarness();

  const surfaceFailure = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: createPipelineHarness({
      result: createPipelineResult({
        outcome: "failed_closed",
        reasonCode: "SURFACE_PREPARATION_FAILED",
        completedFrameCount: 0,
        cleanupAttemptCount: 0,
        cleanupCompleted: false,
        cleanupFailed: false
      })
    }).factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(surfaceFailure.reasonCode, "SURFACE_PREPARATION_FAILED");
  assert.equal(surfaceFailure.completedFrameCount, 0);

  const drawFailure = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: createPipelineHarness({
      result: createPipelineResult({
        outcome: "failed_closed",
        reasonCode: "FAKE_DRAW_RETURNED_FAILURE",
        completedFrameCount: 0,
        cleanupAttemptCount: 1,
        cleanupCompleted: true,
        cleanupFailed: false
      })
    }).factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(drawFailure.reasonCode, "FAKE_DRAW_RETURNED_FAILURE");
  assert.equal(drawFailure.completedFrameCount, 0);
  assert.equal(drawFailure.cleanupVerified, true);
  assert.equal(drawFailure.referencesReleased, true);

  const cleanupFailure = createCoordinator({
    activationContractFactory: activationHarness.factory,
    rendererPipelineFactory: createPipelineHarness({
      result: createPipelineResult({
        outcome: "completed",
        cleanupCompleted: false,
        cleanupFailed: true,
        cleanupFailureReasons: Object.freeze(["CANVAS_REMOVAL_FAILED"])
      })
    }).factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(cleanupFailure.reasonCode, "CANVAS_REMOVAL_FAILED");
  assert.equal(cleanupFailure.cleanupVerified, false);
  assert.deepEqual(cleanupFailure.cleanupFailureReasons, [
    "CANVAS_REMOVAL_FAILED"
  ]);
  assert.equal(cleanupFailure.permanentlyClosed, true);
});

test("exceptions fail closed and no live references or browser exposure are introduced", () => {
  const activationThrow = createCoordinator({
    activationContractFactory: createActivationContractHarness({
      throwOnActivate: Object.assign(new Error("boom"), {
        reasonCode: "ACTIVATION_EXCEPTION"
      })
    }).factory,
    rendererPipelineFactory: createPipelineHarness().factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(activationThrow.reasonCode, "ACTIVATION_EXCEPTION");

  const pipelineThrow = createCoordinator({
    activationContractFactory: createActivationContractHarness().factory,
    rendererPipelineFactory: createPipelineHarness({
      throwOnExecute: Object.assign(new Error("boom"), {
        reasonCode: "PIPELINE_EXECUTION_EXCEPTION"
      })
    }).factory
  }).executeAuthorizedOneFrameSession();
  assert.equal(pipelineThrow.reasonCode, "PIPELINE_EXECUTION_EXCEPTION");

  assert.doesNotMatch(coordinatorSource, /window\./);
  assert.doesNotMatch(coordinatorSource, /localStorage|sessionStorage|indexedDB/);
});
