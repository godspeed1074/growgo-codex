import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const authorizationModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-handoff-authorization.mjs")
);
const readinessModule = await import(
  path.join(repoRoot, "client", "developer-only-live-atlas-renderer-handoff-readiness.mjs")
);
const handoffModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-zero-draw-handoff.mjs")
);
const bridgeModule = await import(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs")
);

const authorizationSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-handoff-authorization.mjs"),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createMapStub(initialCentre = { lat: -38.12, lng: 144.61 }) {
  let centre = initialCentre;

  return {
    getCenter() {
      return centre;
    },
    setCenter(nextCentre) {
      centre = nextCentre;
    }
  };
}

function buildIntegratedNamespace({
  hostname = "localhost",
  mapPresent = true,
  centre = { lat: -38.12, lng: 144.61 },
  getCurrentReadiness,
  rendererDescriptor,
  createSessionId
} = {}) {
  const map = mapPresent ? createMapStub(centre) : null;
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => map
  });
  const readiness = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre: bridge.getAtlasDiagnosticForCurrentMapCentre,
    getRendererConsumerDescriptor:
      rendererDescriptor ??
      (() => handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor())
  });
  const authorization =
    authorizationModule.createControlledOneSessionDeveloperRendererHandoffAuthorization({
      getHostname: () => hostname,
      getCurrentReadiness:
        getCurrentReadiness ?? (() => readiness.getAtlasRendererHandoffReadiness()),
      createSessionId
    });

  const globalObject = {
    GrowGoDeveloperDiagnostics: {}
  };

  readinessModule.installDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    globalObject,
    readiness
  });
  authorizationModule.installControlledOneSessionDeveloperRendererHandoffAuthorization({
    globalObject,
    authorization
  });

  return {
    map,
    bridge,
    readiness,
    authorization,
    diagnostics: globalObject.GrowGoDeveloperDiagnostics
  };
}

test("browser interfaces exist", () => {
  const { diagnostics } = buildIntegratedNamespace();

  assert.equal(typeof diagnostics.authorizeAtlasRendererHandoffSession, "function");
  assert.equal(typeof diagnostics.revokeAtlasRendererHandoffSession, "function");
  assert.equal(typeof diagnostics.getAtlasRendererHandoffAuthorizationStatus, "function");
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      diagnostics,
      "consumeAuthorizedRendererHandoffAttempt"
    ),
    false
  );
});

test("default state is unauthorized with canonical false flags and no effective renderer permission", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const status = diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(status.authorizationActive, false);
  assert.equal(status.sessionId, null);
  assert.equal(status.authorizationConsumed, false);
  assert.equal(status.authorizationRevoked, false);
  assert.equal(status.currentReadinessMatchesAuthorization, false);
  assert.equal(status.rendererInitializationAllowed, false);
  assert.equal(status.rendererAttachmentAllowed, false);
  assert.equal(status.drawAllowed, false);
  assert.equal(status.canonicalRuntimeExecutionEnabled, false);
  assert.equal(status.canonicalMapAttachmentAllowed, false);
  assert.equal(status.canonicalAutomaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalLifecycleExecutionEnabled, false);
});

test("missing confirmation and incorrect confirmation are blocked", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const missing = diagnostics.authorizeAtlasRendererHandoffSession();
  const incorrect = diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "WRONG"
  });

  assert.equal(missing.reasonCode, "MISSING_CONFIRMATION");
  assert.equal(incorrect.reasonCode, "INVALID_CONFIRMATION");
});

test("non-local host is blocked", () => {
  const { diagnostics } = buildIntegratedNamespace({
    hostname: "growgo.example.com"
  });

  const result = diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  assert.equal(result.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");
});

test("missing readiness invalid readiness and out-of-scope readiness are blocked", () => {
  const missingReadiness = buildIntegratedNamespace({
    getCurrentReadiness: () => null
  }).diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const invalidReadiness = buildIntegratedNamespace({
    getCurrentReadiness: () =>
      Object.freeze({
        schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
        diagnosticStatus: "resolved",
        reasonCode: "RESOLVED",
        rendererHandoffStatus: "ready_for_future_renderer_attachment",
        rendererConsumerAvailable: true,
        rendererIdentityValidated: true,
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
      })
  }).diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const outOfScope = buildIntegratedNamespace({
    centre: { lat: -38.9, lng: 145.5 }
  }).diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  assert.equal(missingReadiness.reasonCode, "MISSING_READINESS_RESULT");
  assert.equal(invalidReadiness.reasonCode, "INVALID_READINESS_RESULT");
  assert.equal(outOfScope.reasonCode, "REGION_OUT_OF_SCOPE");
});

test("renderer consumer unavailable and renderer identity mismatch are blocked", () => {
  const unavailable = buildIntegratedNamespace({
    rendererDescriptor: () => null
  }).diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const mismatch = buildIntegratedNamespace({
    rendererDescriptor: () =>
      Object.freeze({
        ...handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor(),
        drawEntryPoint: "drawSomethingElse"
      })
  }).diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  assert.equal(unavailable.reasonCode, "RENDERER_CONSUMER_UNAVAILABLE");
  assert.equal(mismatch.reasonCode, "RENDERER_IDENTITY_MISMATCH");
});

test("valid Bellarine readiness authorizes successfully and binds exact approved identity", () => {
  const { diagnostics } = buildIntegratedNamespace({
    createSessionId: () => "TEST_RENDERER_SESSION_001"
  });

  const result = diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const status = diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(result.outcome, "authorized");
  assert.equal(result.reasonCode, "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION");
  assert.equal(status.authorizationActive, true);
  assert.equal(
    status.authorizationSource,
    "developer-one-session-renderer-handoff-local"
  );
  assert.equal(status.localDevelopmentHost, true);
  assert.equal(status.confirmationAccepted, true);
  assert.equal(status.sessionId, "TEST_RENDERER_SESSION_001");
  assert.equal(status.approvedReadinessBound, true);
  assert.equal(status.currentReadinessMatchesAuthorization, true);
  assert.equal(
    status.boundRegionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(
    status.boundPackageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
  );
  assert.equal(status.boundPackageVersion, "v001");
  assert.equal(
    status.boundPackageFingerprint,
    "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
  );
  assert.equal(status.boundRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(status.boundRecipeVersion, "v001");
  assert.equal(
    status.boundSelectorSeed,
    "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"
  );
  assert.equal(status.rendererConsumerAvailable, true);
  assert.equal(status.rendererIdentityValidated, true);
  assert.equal(status.canonicalRuntimeExecutionEnabled, false);
  assert.equal(status.canonicalMapAttachmentAllowed, false);
  assert.equal(status.canonicalAutomaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalLifecycleExecutionEnabled, false);
  assert.equal(status.rendererInitializationAllowed, true);
  assert.equal(status.rendererAttachmentAllowed, true);
  assert.equal(status.drawAllowed, true);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(status), true);
});

test("repeated authorization creates no second session", () => {
  const { diagnostics } = buildIntegratedNamespace({
    createSessionId: ({ counter }) => `TEST_RENDERER_SESSION_${counter}`
  });

  const first = diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const second = diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const status = diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(first.reasonCode, "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION");
  assert.equal(second.reasonCode, "ALREADY_AUTHORIZED");
  assert.equal(status.sessionId, "TEST_RENDERER_SESSION_1");
});

test("status inspection and readiness inspection do not consume authorization", () => {
  const { diagnostics, authorization } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const before = diagnostics.getAtlasRendererHandoffAuthorizationStatus();
  const readinessFirst = diagnostics.getAtlasRendererHandoffReadiness();
  const middle = diagnostics.getAtlasRendererHandoffAuthorizationStatus();
  const readinessSecond = diagnostics.getAtlasRendererHandoffReadiness();
  const after = diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(before.authorizationConsumed, false);
  assert.equal(middle.authorizationConsumed, false);
  assert.equal(after.authorizationConsumed, false);
  assert.equal(readinessFirst.rendererInitializationRequested, false);
  assert.equal(readinessSecond.rendererInitializationRequested, false);
  assert.equal(
    authorization.getAtlasRendererHandoffAuthorizationStatus().authorizationConsumed,
    false
  );
});

test("successful isolated consumption marks authorization consumed and blocks second consumption", () => {
  const { diagnostics, authorization } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const first = authorization.consumeAuthorizedRendererHandoffAttempt();
  const second = authorization.consumeAuthorizedRendererHandoffAttempt();
  const status = diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(first.outcome, "consumed");
  assert.equal(
    first.reasonCode,
    "AUTHORIZED_RENDERER_HANDOFF_READY_FOR_FUTURE_ATTEMPT"
  );
  assert.equal(second.reasonCode, "AUTHORIZATION_ALREADY_CONSUMED");
  assert.equal(status.authorizationActive, false);
  assert.equal(status.authorizationConsumed, true);
  assert.equal(status.rendererInitializationAllowed, false);
  assert.equal(status.rendererAttachmentAllowed, false);
  assert.equal(status.drawAllowed, false);
  assert.equal(status.canonicalRuntimeExecutionEnabled, false);
  assert.equal(status.canonicalMapAttachmentAllowed, false);
  assert.equal(status.canonicalAutomaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalLifecycleExecutionEnabled, false);
});

test("readiness drift fails closed for out-of-scope movement fingerprint drift and selector-seed drift", () => {
  const outOfScopeHarness = buildIntegratedNamespace();
  outOfScopeHarness.diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  outOfScopeHarness.map.setCenter({ lat: -38.9, lng: 145.5 });
  const outOfScopeStatus =
    outOfScopeHarness.diagnostics.getAtlasRendererHandoffAuthorizationStatus();
  const outOfScopeConsume =
    outOfScopeHarness.authorization.consumeAuthorizedRendererHandoffAttempt();

  let mutatedFingerprint = false;
  const fingerprintHarness = buildIntegratedNamespace({
    getCurrentReadiness: (() => {
      const local = buildIntegratedNamespace();
      return () => {
        const base = local.readiness.getAtlasRendererHandoffReadiness();
        if (!mutatedFingerprint) {
          return base;
        }
        return Object.freeze({
          ...base,
          resolvedPackage: Object.freeze({
            ...base.resolvedPackage,
            packageFingerprint: "DIFFERENT_FINGERPRINT"
          })
        });
      };
    })()
  });
  fingerprintHarness.diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  mutatedFingerprint = true;
  const fingerprintStatus =
    fingerprintHarness.diagnostics.getAtlasRendererHandoffAuthorizationStatus();
  const fingerprintConsume =
    fingerprintHarness.authorization.consumeAuthorizedRendererHandoffAttempt();

  let mutatedSeed = false;
  const seedHarness = buildIntegratedNamespace({
    getCurrentReadiness: (() => {
      const local = buildIntegratedNamespace();
      return () => {
        const base = local.readiness.getAtlasRendererHandoffReadiness();
        if (!mutatedSeed) {
          return base;
        }
        return Object.freeze({
          ...base,
          selectorSeed: "DIFFERENT_SELECTOR_SEED"
        });
      };
    })()
  });
  seedHarness.diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  mutatedSeed = true;
  const seedStatus = seedHarness.diagnostics.getAtlasRendererHandoffAuthorizationStatus();
  const seedConsume = seedHarness.authorization.consumeAuthorizedRendererHandoffAttempt();

  assert.equal(outOfScopeStatus.currentReadinessMatchesAuthorization, false);
  assert.equal(outOfScopeStatus.currentReadinessReasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(outOfScopeConsume.reasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(fingerprintStatus.currentReadinessMatchesAuthorization, false);
  assert.equal(fingerprintStatus.currentReadinessReasonCode, "PACKAGE_FINGERPRINT_DRIFTED");
  assert.equal(fingerprintConsume.reasonCode, "PACKAGE_FINGERPRINT_DRIFTED");
  assert.equal(seedStatus.currentReadinessMatchesAuthorization, false);
  assert.equal(seedStatus.currentReadinessReasonCode, "SELECTOR_SEED_DRIFTED");
  assert.equal(seedConsume.reasonCode, "SELECTOR_SEED_DRIFTED");
});

test("explicit revoke is idempotent and fresh instances start unauthorized with no retained state", () => {
  const { diagnostics } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });
  const first = diagnostics.revokeAtlasRendererHandoffSession();
  const second = diagnostics.revokeAtlasRendererHandoffSession();
  const fresh = buildIntegratedNamespace().diagnostics.getAtlasRendererHandoffAuthorizationStatus();

  assert.equal(first.reasonCode, "REVOKED");
  assert.equal(second.reasonCode, "ALREADY_REVOKED");
  assert.equal(fresh.authorizationActive, false);
  assert.equal(fresh.sessionId, null);
  assert.equal(fresh.authorizationRevoked, false);
});

test("no startup authorization no persistence no renderer work and no browser consume interface are introduced", () => {
  assert.doesNotMatch(authorizationSource, /localStorage/);
  assert.doesNotMatch(authorizationSource, /sessionStorage/);
  assert.doesNotMatch(authorizationSource, /indexedDB/i);
  assert.doesNotMatch(authorizationSource, /document\.cookie/);
  assert.doesNotMatch(authorizationSource, /setInterval\(/);
  assert.doesNotMatch(authorizationSource, /setTimeout\(/);
  assert.doesNotMatch(authorizationSource, /fetch\(/);
  assert.doesNotMatch(authorizationSource, /XMLHttpRequest/);
  assert.doesNotMatch(authorizationSource, /createElement/);
  assert.doesNotMatch(authorizationSource, /appendChild/);
  assert.doesNotMatch(authorizationSource, /drawCustom25DMapCanvas/);
  assert.doesNotMatch(authorizationSource, /initCustom25DMapExperiment/);
  assert.match(
    developmentAlphaAppSource,
    /installControlledOneSessionDeveloperRendererHandoffAuthorization/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /consumeAuthorizedRendererHandoffAttempt/
  );
});
