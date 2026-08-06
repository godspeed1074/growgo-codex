import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  createControlledPersistentAtlasAuthorization
} from "../client/developer-only-controlled-persistent-atlas-authorization.mjs";
import {
  createPersistentAtlasAuthorizationProvider,
  resolvePersistentAtlasAuthorization,
  consumePersistentAtlasAttachPermission,
  validatePersistentAtlasRedrawAuthorization,
  revokePersistentAtlasAuthorization,
  invalidatePersistentAtlasAuthorization,
  getPersistentAtlasAuthorizationProviderStatus
} from "../client/developer-only-persistent-atlas-authorization-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const providerPath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-authorization-provider.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

function createIdentity({
  sessionId = "IDENTITY_SESSION_A",
  mapIdentityId = "MAP_A",
  regionId = "BELLARINE",
  packageId = "atlas-bellarine",
  packageVersion = "2026.08.06",
  packageFingerprint = "fingerprint-a",
  recipeId = "coastal-default",
  recipeVersion = "recipe-v001",
  selectorSeed = "seed-a"
} = {}) {
  return {
    sessionId,
    mapIdentityId,
    regionId,
    packageId,
    packageVersion,
    packageFingerprint,
    recipeId,
    recipeVersion,
    selectorSeed
  };
}

function createHarness() {
  const state = {
    identity: createIdentity(),
    readiness: { approved: true, reasonCode: "READINESS_APPROVED" },
    attached: false,
    lifecycle: { matches: true, reasonCode: null },
    now: "2026-08-06T00:00:00.000Z"
  };

  const contract = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => "127.0.0.1",
    identityProvider: () => state.identity,
    readinessProvider: () => state.readiness,
    controllerAttachmentStateProvider: () => ({ attached: state.attached }),
    lifecycleOwnerStateProvider: () => state.lifecycle,
    nowProvider: () => state.now,
    authorizationSource: "persistent_test_contract"
  });

  const authorizeResult = contract.authorizePersistentAtlasSession({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const provider = createPersistentAtlasAuthorizationProvider({
    persistentAuthorizationContract: contract
  });

  return { state, contract, authorizeResult, provider };
}

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

test("1. default provider unavailable", () => {
  const provider = createPersistentAtlasAuthorizationProvider();
  assert.throws(
    () => resolvePersistentAtlasAuthorization(provider),
    (error) => error.reasonCode === "AUTHORIZATION_PROVIDER_UNAVAILABLE"
  );
});

test("2. wrong dependency type rejected", () => {
  const provider = createPersistentAtlasAuthorizationProvider({
    persistentAuthorizationContract: {}
  });
  assert.throws(
    () => resolvePersistentAtlasAuthorization(provider),
    (error) => error.reasonCode === "AUTHORIZATION_PROVIDER_UNAVAILABLE"
  );
});

test("3. active persistent authorization resolves", () => {
  const harness = createHarness();
  const snapshot = resolvePersistentAtlasAuthorization(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  assert.equal(snapshot.authorizationActive, true);
  assert.equal(snapshot.authorizationState, "active");
});

test("4. frozen authorization snapshot returned", () => {
  const harness = createHarness();
  const snapshot = resolvePersistentAtlasAuthorization(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  assert.equal(Object.isFrozen(snapshot), true);
});

test("5. attach permission consumed once", () => {
  const harness = createHarness();
  const snapshot = consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  assert.equal(snapshot.attachPermissionConsumed, true);
});

test("6. second attach consumption rejected", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  assert.throws(
    () =>
      consumePersistentAtlasAttachPermission(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity
      }),
    (error) => error.reasonCode === "ATTACH_PERMISSION_ALREADY_CONSUMED"
  );
});

test("7. redraw blocked before attach consumption", () => {
  const harness = createHarness();
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "REDRAW_PERMISSION_DENIED"
  );
});

test("8. redraw allowed after attach consumption", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  const snapshot = validatePersistentAtlasRedrawAuthorization(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity,
    readinessSnapshot: harness.state.identity,
    controllerAttached: true
  });
  assert.equal(snapshot.redrawPermissionAllowed, true);
});

test("9. redraw blocked when controller detached", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: false
      }),
    (error) => error.reasonCode === "REDRAW_PERMISSION_DENIED"
  );
});

test("10. redraw blocked on session mismatch", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: "WRONG_SESSION",
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "SESSION_IDENTITY_MISMATCH"
  );
});

test("11. redraw blocked on map mismatch", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: { ...harness.state.identity, mapIdentityId: "MAP_B" },
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "MAP_IDENTITY_MISMATCH"
  );
});

test("12. redraw blocked on readiness drift", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: {
          ...harness.state.identity,
          packageFingerprint: "fingerprint-b"
        },
        controllerAttached: true
      }),
    (error) => error.reasonCode === "READINESS_IDENTITY_MISMATCH"
  );
});

test("13. redraw blocked on lifecycle-owner mismatch", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true,
        lifecycleOwnerMatches: false
      }),
    (error) => error.reasonCode === "LIFECYCLE_OWNER_MISMATCH"
  );
});

test("14. revoke blocks redraw", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  revokePersistentAtlasAuthorization(harness.provider);
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "AUTHORIZATION_REVOKED"
  );
});

test("15. revoke exposes detachRequired", () => {
  const harness = createHarness();
  const result = revokePersistentAtlasAuthorization(harness.provider);
  assert.equal(result.detachRequired, true);
  assert.equal(result.snapshot.detachRequired, true);
});

test("16. invalidation blocks redraw", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  invalidatePersistentAtlasAuthorization(harness.provider, {
    reasonCode: "READINESS_DRIFT_DETECTED"
  });
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "READINESS_DRIFT_DETECTED"
  );
});

test("17. expiry blocks attach/redraw", () => {
  const state = {
    identity: createIdentity(),
    readiness: { approved: true, reasonCode: "READINESS_APPROVED" },
    attached: false,
    lifecycle: { matches: true, reasonCode: null }
  };
  const contract = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => "127.0.0.1",
    identityProvider: () => state.identity,
    readinessProvider: () => state.readiness,
    controllerAttachmentStateProvider: () => ({ attached: state.attached }),
    lifecycleOwnerStateProvider: () => state.lifecycle,
    nowProvider: () => "2026-08-06T00:00:00.000Z",
    expiryPolicy: () => true
  });
  const authorize = contract.authorizePersistentAtlasSession({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const provider = createPersistentAtlasAuthorizationProvider({
    persistentAuthorizationContract: contract
  });
  assert.throws(
    () =>
      consumePersistentAtlasAttachPermission(provider, {
        sessionId: authorize.authorizationStatus.sessionId,
        identity: state.identity
      }),
    (error) => error.reasonCode === "AUTHORIZATION_EXPIRED"
  );
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(provider, {
        sessionId: authorize.authorizationStatus.sessionId,
        identity: state.identity,
        readinessSnapshot: state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "AUTHORIZATION_EXPIRED"
  );
});

test("18. one-frame confirmation rejected", () => {
  const harness = createHarness();
  assert.throws(
    () =>
      resolvePersistentAtlasAuthorization(harness.provider, {
        confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
      }),
    (error) => error.reasonCode === "ONE_FRAME_AUTHORIZATION_REJECTED"
  );
});

test("19. one-frame status rejected", () => {
  const provider = createPersistentAtlasAuthorizationProvider({
    persistentAuthorizationContract: {
      getPersistentAtlasAuthorizationStatus() {
        return {
          schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001"
        };
      },
      consumePersistentAttachPermission() {},
      validatePersistentRedrawPermission() {},
      revokePersistentAtlasSession() {},
      invalidatePersistentAtlasSession() {}
    }
  });
  assert.throws(
    () => resolvePersistentAtlasAuthorization(provider),
    (error) => error.reasonCode === "ONE_FRAME_AUTHORIZATION_REJECTED"
  );
});

test("20. no one-frame module import", () => {
  const source = fs.readFileSync(providerPath, "utf8");
  assert.doesNotMatch(source, /developer-only-atlas-renderer-handoff-authorization\.mjs/);
});

test("21. exact denial reason preserved", () => {
  const harness = createHarness();
  consumePersistentAtlasAttachPermission(harness.provider, {
    sessionId: harness.authorizeResult.authorizationStatus.sessionId,
    identity: harness.state.identity
  });
  harness.state.attached = true;
  invalidatePersistentAtlasAuthorization(harness.provider, {
    reasonCode: "SELECTOR_SEED_DRIFT_DETECTED"
  });
  assert.throws(
    () =>
      validatePersistentAtlasRedrawAuthorization(harness.provider, {
        sessionId: harness.authorizeResult.authorizationStatus.sessionId,
        identity: harness.state.identity,
        readinessSnapshot: harness.state.identity,
        controllerAttached: true
      }),
    (error) => error.reasonCode === "SELECTOR_SEED_DRIFT_DETECTED"
  );
});

test("22. status deeply immutable", () => {
  const harness = createHarness();
  const status = getPersistentAtlasAuthorizationProviderStatus(harness.provider);
  assert.equal(Object.isFrozen(status), true);
});

test("23. status serializable", () => {
  const harness = createHarness();
  const status = getPersistentAtlasAuthorizationProviderStatus(harness.provider);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("24. no raw references exposed", () => {
  const harness = createHarness();
  const status = getPersistentAtlasAuthorizationProviderStatus(harness.provider);
  assert.equal("persistentAuthorizationContract" in status, false);
  assert.equal("contract" in status, false);
  assert.equal("map" in status, false);
  assert.equal("readiness" in status, false);
  assert.equal("lifecycleOwner" in status, false);
});

test("25. no window/global fallback", () => {
  const source = fs.readFileSync(providerPath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bglobalThis\b/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
});

test("26. no live map/Canvas/listener/scheduler/renderer use", () => {
  const source = fs.readFileSync(providerPath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");

  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /createElement/);
  assert.doesNotMatch(source, /canvas/i);
  assert.doesNotMatch(source, /\.on\(/);
  assert.doesNotMatch(source, /\.off\(/);
  assert.doesNotMatch(source, /drawPersistentFrame/);
  assert.doesNotMatch(source, /createCustom25DFrameViewportSnapshot/);
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-authorization-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-authorization-provider/);
});

test("27. all four canonical safety flags remain false", () => {
  const harness = createHarness();
  const status = getPersistentAtlasAuthorizationProviderStatus(harness.provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
