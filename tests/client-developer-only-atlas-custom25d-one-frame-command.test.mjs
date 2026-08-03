import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-command.mjs"
  )
);

const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const commandSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-command.mjs"
  ),
  "utf8"
);

function createReadiness(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    rendererHandoffStatus: "ready_for_future_renderer_attachment",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    resolvedRegion: Object.freeze({ regionId: "REGION_001" }),
    resolvedPackage: Object.freeze({
      packageId: "PACKAGE_001",
      packageVersion: "v001",
      packageFingerprint: "fingerprint-001"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "RECIPE_001",
      selectedVersion: "v001"
    }),
    selectorSeed: "seed-001",
    safetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    }),
    ...overrides
  });
}

function createAuthorizationStatus(overrides = {}) {
  return Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
    authorizationActive: true,
    authorizationConsumed: false,
    authorizationInvalidated: false,
    approvedReadinessBound: true,
    currentReadinessMatchesAuthorization: true,
    sessionId: "AUTH_SESSION_001",
    boundRegionId: "REGION_001",
    boundPackageId: "PACKAGE_001",
    boundPackageVersion: "v001",
    boundPackageFingerprint: "fingerprint-001",
    boundRecipeId: "RECIPE_001",
    boundRecipeVersion: "v001",
    boundSelectorSeed: "seed-001",
    canonicalRuntimeExecutionEnabled: false,
    canonicalMapAttachmentAllowed: false,
    canonicalAutomaticRendererExecutionAllowed: false,
    canonicalLifecycleExecutionEnabled: false,
    ...overrides
  });
}

function createEnvironment(overrides = {}) {
  const calls = {
    hostname: 0,
    readiness: 0,
    authorizationStatus: 0,
    authorizationConsume: 0,
    adapterProvider: 0,
    adapterStatus: 0,
    adapterExecute: 0,
    adapterCleanup: 0,
    animationFrame: 0
  };

  const readinessQueue = overrides.readinessQueue ?? [
    createReadiness(),
    createReadiness()
  ];

  const adapterStatus =
    overrides.adapterStatus ?? {
      adapterReady: true,
      schemaId: "GROWGO_CUSTOM25D_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_STATUS_001"
    };

  const adapter = overrides.adapter ?? {
    getAdapterStatus() {
      calls.adapterStatus += 1;
      return adapterStatus;
    },
    executeDeveloperOnlyLiveOneFrameAdapter() {
      calls.adapterExecute += 1;
      if (overrides.adapterExecuteThrows) {
        throw overrides.adapterExecuteThrows;
      }
      return (
        overrides.adapterExecuteResult ?? {
          outcome: "pending_cleanup",
          reasonCode: "DEFERRED_CLEANUP_PENDING",
          surfacePrepared: true,
          lifecycleRegistered: true,
          frameSnapshotCreated: true,
          drawAttemptCount: 1,
          completedFrameCount: 1,
          cleanupAttemptCount: 0,
          cleanupCompleted: false,
          referencesReleased: false,
          permanentlyClosed: false
        }
      );
    },
    completeDeferredCleanup() {
      calls.adapterCleanup += 1;
      if (overrides.adapterCleanupThrows) {
        throw overrides.adapterCleanupThrows;
      }
      return (
        overrides.adapterCleanupResult ?? {
          outcome: "completed",
          reasonCode: "LIVE_ONE_FRAME_DRAW_COMPLETED",
          cleanupAttemptCount: 1,
          cleanupCompleted: true,
          cleanupFailed: false,
          cleanupFailureReasons: [],
          referencesReleased: true,
          permanentlyClosed: true
        }
      );
    }
  };

  const command = moduleUnderTest.createDeveloperOnlyAtlasCustom25DOneFrameCommand({
    hostnameProvider: () => {
      calls.hostname += 1;
      return overrides.hostname ?? "localhost";
    },
    readinessProvider: () => {
      calls.readiness += 1;
      if (overrides.readinessThrows) {
        throw overrides.readinessThrows;
      }
      return readinessQueue[Math.min(calls.readiness - 1, readinessQueue.length - 1)];
    },
    authorizationStatusProvider: () => {
      calls.authorizationStatus += 1;
      if (overrides.authorizationStatusThrows) {
        throw overrides.authorizationStatusThrows;
      }
      return overrides.authorizationStatus ?? createAuthorizationStatus();
    },
    authorizationConsume: () => {
      calls.authorizationConsume += 1;
      if (overrides.authorizationConsumeThrows) {
        throw overrides.authorizationConsumeThrows;
      }
      return overrides.authorizationConsumeResult ?? {
        operation: "consume",
        outcome: "consumed",
        reasonCode: "CONSUMED"
      };
    },
    adapterProvider: () => {
      calls.adapterProvider += 1;
      return overrides.adapterProviderValue ?? adapter;
    },
    animationFrameProvider: overrides.omitAnimationFrameProvider
      ? undefined
      : (callback) => {
          calls.animationFrame += 1;
          if (overrides.animationFrameThrows) {
            throw overrides.animationFrameThrows;
          }
          if (overrides.animationFrameRejects) {
            throw new Error(overrides.animationFrameRejects);
          }
          callback(16);
          return 1;
        },
    commandIdGenerator: () => "TEST_COMMAND_001"
  });

  return {
    calls,
    command,
    adapter
  };
}

test("module import has no side effects, command factory exists, and default status is idle", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyAtlasCustom25DOneFrameCommand,
    "function"
  );
  const env = createEnvironment();
  const status = env.command.getCommandStatus();

  assert.equal(status.commandState, "idle");
  assert.equal(status.executionAttemptCount, 0);
  assert.equal(status.readinessReadCount, 0);
  assert.equal(status.authorizationConsumeAttemptCount, 0);
  assert.equal(status.adapterInvoked, false);
  assert.equal(status.completedFrameCount, 0);
  assert.equal(status.animationFrameScheduleCount, 0);
  assert.equal(status.permanentlyClosed, false);

  for (const count of Object.values(env.calls)) {
    assert.equal(count, 0);
  }
});

test("non-local host, missing confirmation, and incorrect confirmation block before consumption", async () => {
  const nonLocal = createEnvironment({ hostname: "growgo.example" });
  const nonLocalResult = await nonLocal.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  assert.equal(nonLocalResult.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");
  assert.equal(nonLocal.calls.authorizationConsume, 0);

  const missing = createEnvironment();
  const missingResult = await missing.command.runAuthorizedAtlasCustom25DOneFrame();
  assert.equal(missingResult.reasonCode, "MISSING_CONFIRMATION");
  assert.equal(missing.calls.readiness, 0);

  const invalid = createEnvironment();
  const invalidResult = await invalid.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "WRONG"
  });
  assert.equal(invalidResult.reasonCode, "INVALID_CONFIRMATION");
  assert.equal(invalid.calls.readiness, 0);
});

test("approved readiness, authorization, exact binding, adapter readiness, authorization consumption, adapter invocation, paint boundary, cleanup, and permanent closure all complete exactly once", async () => {
  const env = createEnvironment();
  const result = await env.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  const status = env.command.getCommandStatus();
  const second = await env.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "MANUAL_GATED_ONE_FRAME_COMMAND_COMPLETED");
  assert.equal(result.confirmationAccepted, true);
  assert.equal(result.localDevelopmentHost, true);
  assert.equal(result.readinessReadCount, 1);
  assert.equal(result.readinessRevalidationCount, 1);
  assert.equal(result.authorizationValidated, true);
  assert.equal(result.authorizationSessionId, "AUTH_SESSION_001");
  assert.equal(result.authorizationConsumeAttemptCount, 1);
  assert.equal(result.authorizationConsumed, true);
  assert.equal(result.adapterReady, true);
  assert.equal(result.adapterInvoked, true);
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.lifecycleRegistered, true);
  assert.equal(result.frameSnapshotCreated, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.animationFrameScheduleCount, 1);
  assert.equal(result.paintBoundaryReached, true);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(result.permanentlyClosed, true);

  assert.equal(env.calls.readiness, 2);
  assert.equal(env.calls.authorizationConsume, 1);
  assert.equal(env.calls.adapterProvider, 1);
  assert.equal(env.calls.adapterStatus, 1);
  assert.equal(env.calls.adapterExecute, 1);
  assert.equal(env.calls.animationFrame, 1);
  assert.equal(env.calls.adapterCleanup, 1);

  assert.equal(status.commandState, "completed");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "COMMAND_ALREADY_USED");
  assert.equal(second.secondExecutionBlocked, true);
});

test("drift blocks before consumption and requestAnimationFrame missing fails closed before live invocation", async () => {
  const drift = createEnvironment({
    readinessQueue: [
      createReadiness(),
      createReadiness({
        resolvedPackage: Object.freeze({
          packageId: "PACKAGE_002",
          packageVersion: "v001",
          packageFingerprint: "fingerprint-001"
        })
      })
    ]
  });
  const driftResult = await drift.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  assert.equal(driftResult.reasonCode, "PACKAGE_ID_DRIFTED_BEFORE_CONSUMPTION");
  assert.equal(drift.calls.authorizationConsume, 0);

  const missingRaf = createEnvironment({ omitAnimationFrameProvider: true });
  const missingRafResult =
    await missingRaf.command.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });
  assert.equal(missingRafResult.reasonCode, "REQUEST_ANIMATION_FRAME_UNAVAILABLE");
  assert.equal(missingRaf.calls.authorizationConsume, 0);
  assert.equal(missingRaf.calls.adapterExecute, 0);
});

test("authorization and identity failure cases block before consumption", async () => {
  const inactive = createEnvironment({
    authorizationStatus: createAuthorizationStatus({ authorizationActive: false })
  });
  const inactiveResult = await inactive.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  assert.equal(inactiveResult.reasonCode, "AUTHORIZATION_NOT_ACTIVE");

  const mismatch = createEnvironment({
    authorizationStatus: createAuthorizationStatus({ boundRecipeVersion: "v002" })
  });
  const mismatchResult = await mismatch.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  assert.equal(mismatchResult.reasonCode, "BOUND_RECIPE_VERSION_MISMATCH");
  assert.equal(mismatch.calls.authorizationConsume, 0);
});

test("adapter failure, draw failure, scheduling failure, cleanup failure, and exceptions fail closed precisely", async () => {
  const adapterFailure = createEnvironment({
    adapterExecuteResult: {
      outcome: "failed_closed",
      reasonCode: "DRAW_FAILURE",
      surfacePrepared: true,
      lifecycleRegistered: true,
      frameSnapshotCreated: true,
      drawAttemptCount: 1,
      completedFrameCount: 0,
      cleanupAttemptCount: 1,
      cleanupCompleted: true,
      referencesReleased: true
    }
  });
  const adapterFailureResult =
    await adapterFailure.command.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });
  assert.equal(adapterFailureResult.reasonCode, "DRAW_FAILURE");

  const schedulingFailure = createEnvironment({
    animationFrameThrows: new Error("paint schedule exploded")
  });
  const schedulingFailureResult =
    await schedulingFailure.command.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });
  assert.equal(schedulingFailureResult.outcome, "failed_closed");
  assert.equal(schedulingFailureResult.cleanupAttemptCount, 1);
  assert.equal(schedulingFailureResult.referencesReleased, true);

  const cleanupFailure = createEnvironment({
    adapterCleanupResult: {
      outcome: "failed_closed",
      reasonCode: "CANVAS_REMOVAL_FAILED",
      cleanupAttemptCount: 1,
      cleanupCompleted: false,
      cleanupFailed: true,
      cleanupFailureReasons: ["CANVAS_REMOVAL_FAILED"],
      referencesReleased: true,
      permanentlyClosed: true
    }
  });
  const cleanupFailureResult =
    await cleanupFailure.command.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });
  assert.equal(cleanupFailureResult.reasonCode, "CANVAS_REMOVAL_FAILED");
  assert.equal(cleanupFailureResult.cleanupFailed, true);

  const consumeException = createEnvironment({
    authorizationConsumeThrows: new Error("consume exploded")
  });
  const consumeExceptionResult =
    await consumeException.command.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });
  assert.equal(consumeExceptionResult.reasonCode, "CONSUME_EXPLODED");
});

test("public results are deeply immutable and the browser exposure stays narrow", async () => {
  const env = createEnvironment();
  const result = await env.command.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.cleanupFailureReasons), true);

  assert.match(
    developmentAlphaAppSource,
    /installDeveloperOnlyAtlasCustom25DOneFrameCommand/
  );
  assert.match(
    commandSource,
    /runAuthorizedAtlasCustom25DOneFrame/
  );
  assert.doesNotMatch(scriptSource, /runAuthorizedAtlasCustom25DOneFrame/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /GrowGoDeveloperDiagnostics[\s\S]{0,400}(consumeAuthorizedRendererHandoffAttempt|executeDeveloperOnlyLiveOneFrameAdapter|completeDeferredCleanup|initCustom25DMapExperiment|custom25DMapLayer)/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /moveend zoomend|setInterval|setTimeout/
  );
  assert.doesNotMatch(commandSource, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/);
});

test("install helper exposes only the manual command on the diagnostics namespace", () => {
  const namespace = {};
  const command = createEnvironment().command;
  const installed =
    moduleUnderTest.installDeveloperOnlyAtlasCustom25DOneFrameCommand({
      globalObject: { GrowGoDeveloperDiagnostics: namespace },
      command
    });

  assert.equal(installed, namespace);
  assert.equal(typeof namespace.runAuthorizedAtlasCustom25DOneFrame, "function");
  assert.deepEqual(Object.keys(namespace), ["runAuthorizedAtlasCustom25DOneFrame"]);
});

test("installed namespace command explicitly returns the underlying promise result", async () => {
  const namespace = {};
  const command = createEnvironment().command;

  moduleUnderTest.installDeveloperOnlyAtlasCustom25DOneFrameCommand({
    globalObject: { GrowGoDeveloperDiagnostics: namespace },
    command
  });

  const result = await namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.commandId, "TEST_COMMAND_001");
  assert.equal(result.outcome, "completed");
});
