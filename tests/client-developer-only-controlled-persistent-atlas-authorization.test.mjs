import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  authorizePersistentAtlasSession,
  consumePersistentAttachPermission,
  createControlledPersistentAtlasAuthorization,
  getPersistentAtlasAuthorizationStatus,
  invalidatePersistentAtlasSession,
  revokePersistentAtlasSession,
  validatePersistentRedrawPermission
} from "../client/developer-only-controlled-persistent-atlas-authorization.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-authorization.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_59_PERSISTENT_ATLAS_AUTHORIZATION_CONTRACT.md"
);

function buildIdentity(overrides = {}) {
  return {
    sessionId: "SESSION_001",
    mapIdentityId: "MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_001",
    ...overrides
  };
}

let persistentAuthHarnessSessionCounter = 0;

function createHarness({
  hostname = "127.0.0.1",
  readinessApproved = true,
  readinessReasonCode = "READINESS_APPROVED",
  controllerAttached = false,
  lifecycleMatches = true,
  lifecycleReasonCode = "LIFECYCLE_OWNER_MISMATCH",
  expiry = false,
  identityOverrides = {}
} = {}) {
  const identity = buildIdentity(identityOverrides);
  let authorizationCounter = 0;

  const contract = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => hostname,
    identityProvider: () => ({ ...identity }),
    readinessProvider: () => ({
      approved: readinessApproved,
      reasonCode: readinessReasonCode
    }),
    controllerAttachmentStateProvider: () => ({
      attached: controllerAttached
    }),
    lifecycleOwnerStateProvider: () => ({
      matches: lifecycleMatches,
      reasonCode: lifecycleReasonCode
    }),
    nowProvider: () => "2026-08-06T12:00:00.000Z",
    createSessionId: () => {
      authorizationCounter += 1;
      persistentAuthHarnessSessionCounter += 1;
      return `PERSISTENT_AUTH_SESSION_${persistentAuthHarnessSessionCounter}`;
    },
    expiryPolicy: expiry ? () => true : null
  });

  return {
    contract,
    identity,
    setControllerAttached(next) {
      controllerAttached = next;
    },
    setReadiness(nextApproved, nextReason = "READINESS_APPROVED") {
      readinessApproved = nextApproved;
      readinessReasonCode = nextReason;
    },
    setLifecycleMatch(nextMatches, nextReason = "LIFECYCLE_OWNER_MISMATCH") {
      lifecycleMatches = nextMatches;
      lifecycleReasonCode = nextReason;
    }
  };
}

test("initial inactive state is frozen serializable and keeps all canonical flags false", () => {
  const { contract } = createHarness();
  const status = getPersistentAtlasAuthorizationStatus(contract);

  assert.equal(status.schemaId, "GROWGO_CONTROLLED_PERSISTENT_ATLAS_AUTHORIZATION_STATUS_001");
  assert.equal(status.authorizationState, "inactive");
  assert.equal(status.authorizationActive, false);
  assert.equal(status.attachPermissionConsumed, false);
  assert.equal(status.redrawPermissionAllowed, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
});

test("exact confirmation is required and local-development-only is enforced", () => {
  const local = createHarness();
  const invalid = authorizePersistentAtlasSession(local.contract, {
    confirmation: "WRONG"
  });
  assert.equal(invalid.reasonCode, "INVALID_CONFIRMATION");

  const remote = createHarness({ hostname: "growgo.example.com" });
  const blocked = authorizePersistentAtlasSession(remote.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  assert.equal(blocked.reasonCode, "NON_LOCAL_DEVELOPMENT_HOST");
});

test("authorization succeeds once and duplicate authorization is blocked", () => {
  const { contract } = createHarness();
  const first = authorizePersistentAtlasSession(contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const second = authorizePersistentAtlasSession(contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });

  assert.equal(first.outcome, "authorized");
  assert.equal(
    first.reasonCode,
    "AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION"
  );
  assert.equal(first.authorizationStatus.authorizationState, "active");
  assert.equal(second.reasonCode, "AUTHORIZATION_ALREADY_ACTIVE");
});

test("one-frame authorization confirmation cannot satisfy persistent authorization", () => {
  const { contract } = createHarness();
  const result = authorizePersistentAtlasSession(contract, {
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  });

  assert.equal(result.reasonCode, "INVALID_CONFIRMATION");
});

test("attach permission may be consumed exactly once", () => {
  const { contract } = createHarness();
  authorizePersistentAtlasSession(contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });

  const first = consumePersistentAttachPermission(contract);
  const second = consumePersistentAttachPermission(contract);

  assert.equal(first.reasonCode, "ATTACH_PERMISSION_CONSUMED");
  assert.equal(first.authorizationStatus.attachPermissionConsumed, true);
  assert.equal(second.reasonCode, "ATTACH_PERMISSION_ALREADY_CONSUMED");
});

test("redraw is blocked before attach consumption and allowed after attach consumption while attached", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });

  const before = validatePersistentRedrawPermission(harness.contract);
  assert.equal(before.authorizationStatus.redrawPermissionAllowed, false);

  consumePersistentAttachPermission(harness.contract);
  harness.setControllerAttached(true);
  const after = validatePersistentRedrawPermission(harness.contract);

  assert.equal(after.outcome, "allowed");
  assert.equal(after.authorizationStatus.redrawPermissionAllowed, true);
});

test("revocation blocks redraw and remains observable", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(harness.contract);
  harness.setControllerAttached(true);

  const revoked = revokePersistentAtlasSession(harness.contract);
  const redraw = validatePersistentRedrawPermission(harness.contract);

  assert.equal(revoked.reasonCode, "AUTHORIZATION_REVOKED");
  assert.equal(revoked.detachRequiredByCaller, true);
  assert.equal(redraw.reasonCode, "AUTHORIZATION_REVOKED");
  assert.equal(getPersistentAtlasAuthorizationStatus(harness.contract).revoked, true);
});

test("explicit invalidation blocks redraw and indicates detach required by caller", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(harness.contract);
  harness.setControllerAttached(true);

  const invalidated = invalidatePersistentAtlasSession(harness.contract, {
    reasonCode: "STALE_SESSION"
  });
  const redraw = validatePersistentRedrawPermission(harness.contract);

  assert.equal(invalidated.reasonCode, "AUTHORIZATION_INVALIDATED");
  assert.equal(invalidated.invalidationReasonCode, "STALE_SESSION");
  assert.equal(invalidated.detachRequiredByCaller, true);
  assert.equal(redraw.reasonCode, "AUTHORIZATION_INVALIDATED");
});

test("identity drift invalidates for map region package fingerprint recipe and selector-seed changes", () => {
  for (const overrides of [
    { mapIdentityId: "MAP_002" },
    { regionId: "OTHER_REGION" },
    { packageFingerprint: "PKG_FP_002" },
    { recipeId: "ATLAS_RECIPE_002" },
    { selectorSeed: "SEED_002" }
  ]) {
    const harness = createHarness();
    authorizePersistentAtlasSession(harness.contract, {
      confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
    });
    consumePersistentAttachPermission(harness.contract);
    harness.setControllerAttached(true);
    Object.assign(harness.identity, overrides);

    const redraw = validatePersistentRedrawPermission(harness.contract);
    assert.equal(redraw.reasonCode, "IDENTITY_MISMATCH");
    assert.equal(
      getPersistentAtlasAuthorizationStatus(harness.contract).invalidated,
      true
    );
  }
});

test("readiness blocked invalidates and stale session is blocked", () => {
  const blockedReadiness = createHarness({
    readinessApproved: false,
    readinessReasonCode: "READINESS_BLOCKED"
  });
  authorizePersistentAtlasSession(blockedReadiness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(blockedReadiness.contract);
  blockedReadiness.setControllerAttached(true);
  const redrawBlocked = validatePersistentRedrawPermission(
    blockedReadiness.contract
  );
  assert.equal(redrawBlocked.reasonCode, "READINESS_BLOCKED");

  const stale = createHarness();
  authorizePersistentAtlasSession(stale.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(stale.contract);
  const redrawStale = validatePersistentRedrawPermission(stale.contract);
  assert.equal(redrawStale.reasonCode, "STALE_SESSION");
});

test("lifecycle owner mismatch invalidates", () => {
  const harness = createHarness();
  authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(harness.contract);
  harness.setControllerAttached(true);
  harness.setLifecycleMatch(false, "LIFECYCLE_OWNER_MISMATCH");

  const redraw = validatePersistentRedrawPermission(harness.contract);
  assert.equal(redraw.reasonCode, "LIFECYCLE_OWNER_MISMATCH");
  assert.equal(
    getPersistentAtlasAuthorizationStatus(harness.contract).invalidated,
    true
  );
});

test("injected expiry blocks attach consumption and redraw without timers", () => {
  const harness = createHarness({ expiry: true });
  authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });

  const attach = consumePersistentAttachPermission(harness.contract);
  const redraw = validatePersistentRedrawPermission(harness.contract);
  const status = getPersistentAtlasAuthorizationStatus(harness.contract);

  assert.equal(attach.reasonCode, "AUTHORIZATION_EXPIRED");
  assert.equal(redraw.reasonCode, "AUTHORIZATION_EXPIRED");
  assert.equal(status.expiryPolicyPresent, true);
  assert.equal(status.expired, true);
});

test("fresh session starts inactive and new authorization gets a fresh session id", () => {
  const first = createHarness();
  const second = createHarness();

  const firstInitial = getPersistentAtlasAuthorizationStatus(first.contract);
  const secondInitial = getPersistentAtlasAuthorizationStatus(second.contract);
  assert.equal(firstInitial.authorizationActive, false);
  assert.equal(secondInitial.authorizationActive, false);

  const a = authorizePersistentAtlasSession(first.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const b = authorizePersistentAtlasSession(second.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });

  assert.notEqual(a.authorizationStatus.sessionId, b.authorizationStatus.sessionId);
});

test("integration proof with injected fakes only: authorize consume redraw revoke fresh authorize drift invalidate", () => {
  const harness = createHarness();

  const authorized = authorizePersistentAtlasSession(harness.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const consumed = consumePersistentAttachPermission(harness.contract);
  harness.setControllerAttached(true);
  const redraw1 = validatePersistentRedrawPermission(harness.contract);
  const redraw2 = validatePersistentRedrawPermission(harness.contract);
  const revoked = revokePersistentAtlasSession(harness.contract);
  const blockedAfterRevoke = validatePersistentRedrawPermission(harness.contract);

  assert.equal(authorized.outcome, "authorized");
  assert.equal(consumed.outcome, "consumed");
  assert.equal(redraw1.outcome, "allowed");
  assert.equal(redraw2.outcome, "allowed");
  assert.equal(revoked.detachRequiredByCaller, true);
  assert.equal(blockedAfterRevoke.reasonCode, "AUTHORIZATION_REVOKED");

  const fresh = createHarness();
  authorizePersistentAtlasSession(fresh.contract, {
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  consumePersistentAttachPermission(fresh.contract);
  fresh.setControllerAttached(true);
  fresh.identity.selectorSeed = "SEED_DRIFTED";
  const invalidated = validatePersistentRedrawPermission(fresh.contract);

  assert.equal(invalidated.reasonCode, "IDENTITY_MISMATCH");
  assert.equal(
    getPersistentAtlasAuthorizationStatus(fresh.contract).invalidated,
    true
  );
});

test("module uses no timers, no storage, no window exposure, and session doc exists", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\blocalStorage\b/);
  assert.doesNotMatch(source, /\bsessionStorage\b/);
  assert.doesNotMatch(source, /\bsetTimeout\b/);
  assert.doesNotMatch(source, /\bsetInterval\b/);
  assert.ok(fs.existsSync(sessionDocPath));
});
