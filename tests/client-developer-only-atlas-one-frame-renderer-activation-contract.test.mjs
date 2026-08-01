import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const contractModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-one-frame-renderer-activation-contract.mjs"
  )
);
const authorizationModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-renderer-handoff-authorization.mjs"
  )
);

const contractSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-one-frame-renderer-activation-contract.mjs"
  ),
  "utf8"
);
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
    selectorSeed: "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
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

function createFakeRendererAdapter({
  identityResult = { ok: true },
  initResult = { ok: true },
  drawResult = { ok: true },
  disposeResult = { ok: true },
  throwOnValidateIdentity = null,
  throwOnInitialize = null,
  throwOnDraw = null,
  throwOnDispose = null
} = {}) {
  const counts = {
    validateIdentity: 0,
    initialize: 0,
    draw: 0,
    dispose: 0
  };

  const adapter = {
    counts,
    validateIdentity() {
      counts.validateIdentity += 1;
      if (throwOnValidateIdentity) {
        throw throwOnValidateIdentity;
      }
      return identityResult;
    },
    initializeForOneFrame() {
      counts.initialize += 1;
      if (throwOnInitialize) {
        throw throwOnInitialize;
      }
      return initResult;
    },
    drawExactlyOneFrame() {
      counts.draw += 1;
      if (throwOnDraw) {
        throw throwOnDraw;
      }
      return drawResult;
    },
    disposeAfterOneFrame() {
      counts.dispose += 1;
      if (throwOnDispose) {
        throw throwOnDispose;
      }
      return disposeResult;
    }
  };

  return adapter;
}

function createRealAuthorizationHarness({
  readinessSequence,
  hostname = "localhost",
  sessionId = "TEST_RENDERER_SESSION_001"
}) {
  let readinessIndex = 0;
  const getCurrentReadiness = () => {
    const current =
      readinessSequence[
        Math.min(readinessIndex, readinessSequence.length - 1)
      ] ?? null;
    readinessIndex += 1;
    return current;
  };

  const authorization =
    authorizationModule.createControlledOneSessionDeveloperRendererHandoffAuthorization(
      {
        getHostname: () => hostname,
        getCurrentReadiness,
        createSessionId: () => sessionId
      }
    );

  authorization.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  return {
    authorization,
    getStatus: () => authorization.getAtlasRendererHandoffAuthorizationStatus(),
    consume: () => authorization.consumeAuthorizedRendererHandoffAttempt()
  };
}

function createContractWithRealAuthorization({
  readinessSequence,
  rendererAdapter,
  hostname = "localhost",
  activationId = "TEST_ACTIVATION_001",
  sessionId = "TEST_RENDERER_SESSION_001"
}) {
  const readinessQueue = [...readinessSequence];
  let readinessCallCount = 0;
  const harness = createRealAuthorizationHarness({
    readinessSequence: readinessQueue,
    hostname,
    sessionId
  });

  const contract =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => hostname,
      readinessProvider: () => {
        const value =
          readinessQueue[
            Math.min(readinessCallCount, readinessQueue.length - 1)
          ] ?? null;
        readinessCallCount += 1;
        return value;
      },
      authorizationStatusProvider: harness.getStatus,
      authorizationConsume: harness.consume,
      rendererAdapter,
      activationIdGenerator: () => activationId
    });

  return {
    contract,
    harness,
    getReadinessCallCount: () => readinessCallCount
  };
}

test("fresh contract starts idle and status inspection has no side effects", () => {
  const adapter = createFakeRendererAdapter();
  const contract =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => createApprovedReadiness(),
      authorizationStatusProvider: () => null,
      authorizationConsume: () => null,
      rendererAdapter: adapter,
      activationIdGenerator: () => "TEST_ACTIVATION_IDLE"
    });

  const statusA = contract.getActivationStatus();
  const statusB = contract.getActivationStatus();

  assert.equal(statusA.activationState, "idle");
  assert.equal(statusA.outcome, "idle");
  assert.equal(statusA.reasonCode, "IDLE");
  assert.equal(statusA.requestedFrameCount, 0);
  assert.equal(statusA.completedFrameCount, 0);
  assert.equal(statusA.initializationAttemptCount, 0);
  assert.equal(statusA.drawAttemptCount, 0);
  assert.equal(statusA.disposalAttemptCount, 0);
  assert.equal(Object.isFrozen(statusA), true);
  assert.equal(statusA, statusB);
  assert.deepEqual(adapter.counts, {
    validateIdentity: 0,
    initialize: 0,
    draw: 0,
    dispose: 0
  });
});

test("successful isolated one-frame simulation consumes authorization once and closes after one frame", () => {
  const adapter = createFakeRendererAdapter();
  const { contract, harness } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: adapter
  });

  const result = contract.simulateOneFrameActivation();
  const secondAttempt = contract.simulateOneFrameActivation();
  const authorizationStatus = harness.getStatus();

  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "SIMULATED_ONE_FRAME_COMPLETED");
  assert.equal(result.activationState, "disposed");
  assert.equal(result.activationId, "TEST_ACTIVATION_001");
  assert.equal(result.sessionId, "TEST_RENDERER_SESSION_001");
  assert.equal(result.readinessValidated, true);
  assert.equal(result.authorizationValidated, true);
  assert.equal(result.authorizationConsumed, true);
  assert.equal(result.rendererIdentityValidated, true);
  assert.equal(result.requestedFrameCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.initializationAttemptCount, 1);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.disposalAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.secondFrameBlocked, true);
  assert.equal(result.boundRegionId, "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION");
  assert.equal(result.boundPackageId, "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001");
  assert.equal(result.boundPackageVersion, "v001");
  assert.equal(
    result.boundPackageFingerprint,
    "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
  );
  assert.equal(result.boundRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(result.boundRecipeVersion, "v001");
  assert.equal(
    result.boundSelectorSeed,
    "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"
  );
  assert.deepEqual(adapter.counts, {
    validateIdentity: 1,
    initialize: 1,
    draw: 1,
    dispose: 1
  });
  assert.equal(authorizationStatus.authorizationConsumed, true);
  assert.equal(secondAttempt.outcome, "blocked");
  assert.equal(secondAttempt.reasonCode, "ACTIVATION_ALREADY_CLOSED");
  assert.equal(secondAttempt.secondFrameBlocked, true);
});

test("missing readiness out-of-scope readiness and invalid diagnostic all fail closed before consumption", () => {
  const adapterA = createFakeRendererAdapter();
  const missing =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => null,
      authorizationStatusProvider: () => null,
      authorizationConsume: () => {
        throw new Error("should_not_consume");
      },
      rendererAdapter: adapterA,
      activationIdGenerator: () => "A"
    }).simulateOneFrameActivation();

  const adapterB = createFakeRendererAdapter();
  const blocked =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => createBlockedReadiness(),
      authorizationStatusProvider: () => null,
      authorizationConsume: () => {
        throw new Error("should_not_consume");
      },
      rendererAdapter: adapterB,
      activationIdGenerator: () => "B"
    }).simulateOneFrameActivation();

  const adapterC = createFakeRendererAdapter();
  const invalid =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () =>
        Object.freeze({
          schemaId: "WRONG",
          diagnosticStatus: "resolved"
        }),
      authorizationStatusProvider: () => null,
      authorizationConsume: () => {
        throw new Error("should_not_consume");
      },
      rendererAdapter: adapterC,
      activationIdGenerator: () => "C"
    }).simulateOneFrameActivation();

  assert.equal(missing.reasonCode, "MISSING_READINESS_RESULT");
  assert.equal(blocked.reasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(invalid.reasonCode, "INVALID_READINESS_RESULT");
  assert.deepEqual(adapterA.counts, {
    validateIdentity: 0,
    initialize: 0,
    draw: 0,
    dispose: 0
  });
  assert.deepEqual(adapterB.counts, adapterA.counts);
  assert.deepEqual(adapterC.counts, adapterA.counts);
});

test("renderer unavailable identity mismatch inactive invalidated and consumed authorization all block", () => {
  const approved = createApprovedReadiness();
  const noAdapter =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => approved,
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: true,
          authorizationConsumed: false,
          authorizationInvalidated: false,
          approvedReadinessBound: true,
          currentReadinessMatchesAuthorization: true,
          rendererInitializationAllowed: true,
          rendererAttachmentAllowed: true,
          drawAllowed: true,
          boundRegionId: approved.resolvedRegion.regionId,
          boundPackageId: approved.resolvedPackage.packageId,
          boundPackageVersion: approved.resolvedPackage.packageVersion,
          boundPackageFingerprint: approved.resolvedPackage.packageFingerprint,
          boundRecipeId: approved.resolvedRecipe.recipeId,
          boundRecipeVersion: approved.resolvedRecipe.selectedVersion,
          boundSelectorSeed: approved.selectorSeed,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false,
          sessionId: "S"
        }),
      authorizationConsume: () => null,
      rendererAdapter: null,
      activationIdGenerator: () => "NO_ADAPTER"
    }).simulateOneFrameActivation();

  const identityMismatchAdapter = createFakeRendererAdapter({
    identityResult: { ok: false, reasonCode: "RENDERER_IDENTITY_MISMATCH" }
  });
  const identityMismatch =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => approved,
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: true,
          authorizationConsumed: false,
          authorizationInvalidated: false,
          approvedReadinessBound: true,
          currentReadinessMatchesAuthorization: true,
          rendererInitializationAllowed: true,
          rendererAttachmentAllowed: true,
          drawAllowed: true,
          boundRegionId: approved.resolvedRegion.regionId,
          boundPackageId: approved.resolvedPackage.packageId,
          boundPackageVersion: approved.resolvedPackage.packageVersion,
          boundPackageFingerprint: approved.resolvedPackage.packageFingerprint,
          boundRecipeId: approved.resolvedRecipe.recipeId,
          boundRecipeVersion: approved.resolvedRecipe.selectedVersion,
          boundSelectorSeed: approved.selectorSeed,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false,
          sessionId: "S"
        }),
      authorizationConsume: () => null,
      rendererAdapter: identityMismatchAdapter,
      activationIdGenerator: () => "IDENTITY"
    }).simulateOneFrameActivation();

  const inactive =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => approved,
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: false,
          sessionId: null,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false
        }),
      authorizationConsume: () => null,
      rendererAdapter: createFakeRendererAdapter(),
      activationIdGenerator: () => "INACTIVE"
    }).simulateOneFrameActivation();

  const invalidated =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => approved,
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: true,
          authorizationConsumed: false,
          authorizationInvalidated: true,
          invalidationReasonCode: "REGION_OUT_OF_SCOPE",
          approvedReadinessBound: true,
          currentReadinessMatchesAuthorization: false,
          rendererInitializationAllowed: false,
          rendererAttachmentAllowed: false,
          drawAllowed: false,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false,
          sessionId: "S"
        }),
      authorizationConsume: () => null,
      rendererAdapter: createFakeRendererAdapter(),
      activationIdGenerator: () => "INVALIDATED"
    }).simulateOneFrameActivation();

  const consumed =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => approved,
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: true,
          authorizationConsumed: true,
          authorizationInvalidated: false,
          approvedReadinessBound: true,
          currentReadinessMatchesAuthorization: true,
          rendererInitializationAllowed: false,
          rendererAttachmentAllowed: false,
          drawAllowed: false,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false,
          sessionId: "S"
        }),
      authorizationConsume: () => null,
      rendererAdapter: createFakeRendererAdapter(),
      activationIdGenerator: () => "CONSUMED"
    }).simulateOneFrameActivation();

  assert.equal(noAdapter.reasonCode, "RENDERER_ADAPTER_UNAVAILABLE");
  assert.equal(identityMismatch.reasonCode, "RENDERER_IDENTITY_MISMATCH");
  assert.equal(inactive.reasonCode, "AUTHORIZATION_NOT_ACTIVE");
  assert.equal(invalidated.reasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(consumed.reasonCode, "AUTHORIZATION_ALREADY_CONSUMED");
});

test("every bound identity mismatch and non-local host fail closed before consumption", () => {
  const approved = createApprovedReadiness();
  const baseStatus = Object.freeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
    authorizationActive: true,
    authorizationConsumed: false,
    authorizationInvalidated: false,
    approvedReadinessBound: true,
    currentReadinessMatchesAuthorization: true,
    rendererInitializationAllowed: true,
    rendererAttachmentAllowed: true,
    drawAllowed: true,
    boundRegionId: approved.resolvedRegion.regionId,
    boundPackageId: approved.resolvedPackage.packageId,
    boundPackageVersion: approved.resolvedPackage.packageVersion,
    boundPackageFingerprint: approved.resolvedPackage.packageFingerprint,
    boundRecipeId: approved.resolvedRecipe.recipeId,
    boundRecipeVersion: approved.resolvedRecipe.selectedVersion,
    boundSelectorSeed: approved.selectorSeed,
    canonicalRuntimeExecutionEnabled: false,
    canonicalMapAttachmentAllowed: false,
    canonicalAutomaticRendererExecutionAllowed: false,
    canonicalLifecycleExecutionEnabled: false,
    sessionId: "BOUND_TEST"
  });

  const scenarios = [
    ["BOUND_REGION_ID_MISMATCH", { boundRegionId: "OTHER_REGION" }],
    ["BOUND_PACKAGE_ID_MISMATCH", { boundPackageId: "OTHER_PACKAGE" }],
    ["BOUND_PACKAGE_VERSION_MISMATCH", { boundPackageVersion: "v999" }],
    ["BOUND_PACKAGE_FINGERPRINT_MISMATCH", { boundPackageFingerprint: "bad" }],
    ["BOUND_RECIPE_ID_MISMATCH", { boundRecipeId: "FOREST_LOCATION_RECIPE_001" }],
    ["BOUND_RECIPE_VERSION_MISMATCH", { boundRecipeVersion: "v999" }],
    ["BOUND_SELECTOR_SEED_MISMATCH", { boundSelectorSeed: "wrong-seed" }]
  ];

  for (const [expectedReason, override] of scenarios) {
    const result =
      contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
        hostnameProvider: () => "localhost",
        readinessProvider: () => approved,
        authorizationStatusProvider: () => Object.freeze({ ...baseStatus, ...override }),
        authorizationConsume: () => {
          throw new Error("should_not_consume");
        },
        rendererAdapter: createFakeRendererAdapter(),
        activationIdGenerator: () => expectedReason
      }).simulateOneFrameActivation();

    assert.equal(result.reasonCode, expectedReason);
    assert.equal(result.authorizationConsumed, false);
  }

  const nonLocal =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "growgo.example.com",
      readinessProvider: () => approved,
      authorizationStatusProvider: () => baseStatus,
      authorizationConsume: () => null,
      rendererAdapter: createFakeRendererAdapter(),
      activationIdGenerator: () => "NON_LOCAL"
    }).simulateOneFrameActivation();

  assert.equal(nonLocal.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");
});

test("readiness drift before consumption blocks and does not consume authorization", () => {
  const adapter = createFakeRendererAdapter();
  const approved = createApprovedReadiness();
  const drifted = createApprovedReadiness({
    resolvedPackage: Object.freeze({
      ...approved.resolvedPackage,
      packageFingerprint: "drifted"
    })
  });
  let readinessCallCount = 0;
  let consumeCallCount = 0;
  const contract =
    contractModule.createDeveloperOnlyAtlasOneFrameRendererActivationContract({
      hostnameProvider: () => "localhost",
      readinessProvider: () => {
        const values = [approved, drifted];
        const value = values[Math.min(readinessCallCount, values.length - 1)];
        readinessCallCount += 1;
        return value;
      },
      authorizationStatusProvider: () =>
        Object.freeze({
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
          authorizationActive: true,
          authorizationConsumed: false,
          authorizationInvalidated: false,
          approvedReadinessBound: true,
          currentReadinessMatchesAuthorization: true,
          rendererInitializationAllowed: true,
          rendererAttachmentAllowed: true,
          drawAllowed: true,
          boundRegionId: approved.resolvedRegion.regionId,
          boundPackageId: approved.resolvedPackage.packageId,
          boundPackageVersion: approved.resolvedPackage.packageVersion,
          boundPackageFingerprint: approved.resolvedPackage.packageFingerprint,
          boundRecipeId: approved.resolvedRecipe.recipeId,
          boundRecipeVersion: approved.resolvedRecipe.selectedVersion,
          boundSelectorSeed: approved.selectorSeed,
          canonicalRuntimeExecutionEnabled: false,
          canonicalMapAttachmentAllowed: false,
          canonicalAutomaticRendererExecutionAllowed: false,
          canonicalLifecycleExecutionEnabled: false,
          sessionId: "DRIFT_TEST_SESSION"
        }),
      authorizationConsume: () => {
        consumeCallCount += 1;
        return Object.freeze({
          operation: "consume",
          outcome: "consumed",
          reasonCode: "SHOULD_NOT_BE_REACHED"
        });
      },
      rendererAdapter: adapter,
      activationIdGenerator: () => "DRIFT_TEST_ACTIVATION"
    });

  const result = contract.simulateOneFrameActivation();

  assert.equal(result.reasonCode, "PACKAGE_FINGERPRINT_DRIFTED_BEFORE_CONSUMPTION");
  assert.equal(result.authorizationConsumed, false);
  assert.equal(result.initializationAttemptCount, 0);
  assert.equal(result.drawAttemptCount, 0);
  assert.equal(result.disposalAttemptCount, 0);
  assert.equal(consumeCallCount, 0);
  assert.equal(adapter.counts.validateIdentity, 1);
  assert.equal(adapter.counts.initialize, 0);
  assert.equal(adapter.counts.draw, 0);
  assert.equal(adapter.counts.dispose, 0);
  assert.equal(readinessCallCount >= 2, true);
});

test("initialization failure prevents draw and draw failure triggers cleanup", () => {
  const initFailAdapter = createFakeRendererAdapter({
    initResult: { ok: false, reasonCode: "INITIALIZATION_FAILED", cleanupRequired: true }
  });
  const { contract: initFailContract } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: initFailAdapter,
    activationId: "INIT_FAIL"
  });
  const initFail = initFailContract.simulateOneFrameActivation();

  assert.equal(initFail.completedFrameCount, 0);
  assert.equal(initFail.initializationAttemptCount, 1);
  assert.equal(initFail.drawAttemptCount, 0);
  assert.equal(initFail.disposalAttemptCount, 1);
  assert.equal(initFail.cleanupCompleted, true);

  const drawFailAdapter = createFakeRendererAdapter({
    drawResult: { ok: false, reasonCode: "DRAW_FAILED" }
  });
  const { contract: drawFailContract } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: drawFailAdapter,
    activationId: "DRAW_FAIL"
  });
  const drawFail = drawFailContract.simulateOneFrameActivation();

  assert.equal(drawFail.completedFrameCount, 0);
  assert.equal(drawFail.initializationAttemptCount, 1);
  assert.equal(drawFail.drawAttemptCount, 1);
  assert.equal(drawFail.disposalAttemptCount, 1);
  assert.equal(drawFail.cleanupCompleted, true);
});

test("disposal failure remains closed and injected exceptions fail closed without retries", () => {
  const disposalFailAdapter = createFakeRendererAdapter({
    disposeResult: { ok: false, reasonCode: "DISPOSAL_FAILED" }
  });
  const { contract: disposalFailContract } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: disposalFailAdapter,
    activationId: "DISPOSE_FAIL"
  });
  const disposalFail = disposalFailContract.simulateOneFrameActivation();

  assert.equal(disposalFail.outcome, "failed_closed");
  assert.equal(disposalFail.reasonCode, "DISPOSAL_FAILED");
  assert.equal(disposalFail.cleanupCompleted, false);
  assert.equal(disposalFail.disposalAttemptCount, 1);

  const exceptionAdapter = createFakeRendererAdapter({
    throwOnDraw: Object.assign(new Error("draw exploded"), {
      reasonCode: "DRAW_EXCEPTION"
    })
  });
  const { contract: exceptionContract } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: exceptionAdapter,
    activationId: "DRAW_EXCEPTION"
  });
  const exceptionResult = exceptionContract.simulateOneFrameActivation();

  assert.equal(exceptionResult.initializationAttemptCount, 1);
  assert.equal(exceptionResult.drawAttemptCount, 1);
  assert.equal(exceptionResult.disposalAttemptCount, 1);
  assert.equal(exceptionResult.secondFrameBlocked, true);
});

test("results are deeply immutable and no real renderer wiring is introduced", () => {
  const adapter = createFakeRendererAdapter();
  const { contract } = createContractWithRealAuthorization({
    readinessSequence: [createApprovedReadiness(), createApprovedReadiness(), createApprovedReadiness()],
    rendererAdapter: adapter,
    activationId: "IMMUTABLE"
  });
  const result = contract.simulateOneFrameActivation();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);
  assert.throws(() => {
    result.completedFrameCount = 99;
  }, /read only|Cannot assign|object is not extensible/i);

  assert.match(contractSource, /initializeForOneFrame/);
  assert.match(contractSource, /drawExactlyOneFrame/);
  assert.match(contractSource, /disposeAfterOneFrame/);
  assert.doesNotMatch(developmentAlphaAppSource, /developer-only-atlas-one-frame-renderer-activation-contract/);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.mapListenerAdded, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});
