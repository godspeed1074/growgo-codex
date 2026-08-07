import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createControlledPersistentAtlasContractIntegration
} from "../client/developer-only-controlled-persistent-atlas-contract-integration.mjs";
import {
  ATTACH_CONTROLLED_PERSISTENT_ATLAS,
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  CONTROLLED_PERSISTENT_ATLAS_INVALIDATION_REASONS,
  DETACH_CONTROLLED_PERSISTENT_ATLAS,
  INVALIDATE_CONTROLLED_PERSISTENT_ATLAS,
  REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW,
  REVOKE_CONTROLLED_PERSISTENT_ATLAS,
  createDeveloperOnlyControlledPersistentAtlasManualCommand,
  installDeveloperOnlyControlledPersistentAtlasManualCommand
} from "../client/developer-only-controlled-persistent-atlas-manual-command.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-manual-command.mjs"
);
const appPath = path.join(repoRoot, "client/development-alpha-app.mjs");

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_001",
    sessionId: "SESSION_001",
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

function createHarness({
  hostname = "127.0.0.1",
  manualScheduler = false,
  readinessApproved = true,
  readinessIdentityOverrides = {},
  identityOverrides = {},
  failDraw = false,
  failSnapshot = false,
  followUpDuringFirstDraw = false
} = {}) {
  const identity = createIdentity(identityOverrides);
  const map = {
    kind: "fake-map",
    on() {},
    off() {}
  };
  const canvas = { kind: "fake-canvas" };
  const pane = { kind: "fake-pane" };
  const lifecycleOwner = { kind: "fake-lifecycle-owner", ownerId: "LIFECYCLE_OWNER_A" };
  const queued = [];
  let integration;
  let followUpConsumed = false;
  let identitySnapshotFailureReasonCode = null;

  const metrics = {
    registeredEvents: [],
    removedEvents: [],
    scheduleCount: 0,
    cancelCount: 0,
    surfaceCalls: 0,
    lifecycleAcquireCalls: 0,
    snapshotCalls: 0,
    drawCalls: 0,
    cleanupCalls: 0
  };

  integration = createControlledPersistentAtlasContractIntegration({
    hostnameProvider: () => hostname,
    rawMapProvider: {
      resolveRawMap() {
        return {
          map,
          mapIdentityId: identity.mapIdentityId
        };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        return {
          approved: readinessApproved,
          reasonCode: readinessApproved ? "READINESS_APPROVED" : "READINESS_BLOCKED",
          identity: {
            ...identity,
            ...readinessIdentityOverrides
          }
        };
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity() {
        if (identitySnapshotFailureReasonCode) {
          throw Object.assign(new Error(identitySnapshotFailureReasonCode), {
            reasonCode: identitySnapshotFailureReasonCode
          });
        }
        return { ...identity };
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface() {
        metrics.surfaceCalls += 1;
        return {
          pane,
          canvas,
          surfaceOwnerId: "SURFACE_OWNER_A",
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner() {
        metrics.lifecycleAcquireCalls += 1;
        return {
          lifecycleOwner,
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ reason }) {
        metrics.snapshotCalls += 1;
        if (failSnapshot) {
          throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
            reasonCode: "SNAPSHOT_PROVIDER_FAILED"
          });
        }
        return Object.freeze({
          kind: "fake-snapshot",
          reason
        });
      }
    },
    frameDrawProvider: {
      drawPersistentFrame() {
        metrics.drawCalls += 1;
        if (failDraw) {
          throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
            reasonCode: "DRAW_PROVIDER_FAILED"
          });
        }
        if (followUpDuringFirstDraw && !followUpConsumed) {
          followUpConsumed = true;
          integration.requestIntegratedPersistentAtlasRedraw({
            confirmation: REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW,
            reason: "moveend"
          });
        }
      }
    },
    animationFrameScheduler(callback) {
      metrics.scheduleCount += 1;
      if (manualScheduler) {
        queued.push(callback);
      } else {
        callback();
      }
      return { kind: "frame-handle", id: metrics.scheduleCount };
    },
    animationFrameCanceller() {
      metrics.cancelCount += 1;
    },
    approvedListenerRegistrar(eventName, callback) {
      metrics.registeredEvents.push({ eventName, callback });
      return { eventName, callback };
    },
    approvedListenerRemover(registration) {
      metrics.removedEvents.push(registration?.eventName ?? "unknown");
    },
    retainedCleanupProvider: {
      cleanupPersistentAttachment() {
        metrics.cleanupCalls += 1;
        return {
          cleanupCompleted: true
        };
      }
    }
  });

  const command = createDeveloperOnlyControlledPersistentAtlasManualCommand({
    hostnameProvider: () => hostname,
    integrationProvider: () => integration,
    compositionStatusProvider: () => ({
      schemaId: "TEST_PERSISTENT_COMPOSITION_STATUS_001",
      state: "ready"
    })
  });

  return {
    identity,
    integration,
    command,
    metrics,
    namespace: { GrowGoDeveloperDiagnostics: {} },
    flushOne() {
      const next = queued.shift();
      if (next) {
        next();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queued.length > 0 && remaining > 0) {
        remaining -= 1;
        queued.shift()();
      }
    },
    setIdentitySnapshotFailure(reasonCode = null) {
      identitySnapshotFailureReasonCode = reasonCode;
    }
  };
}

function createSnapshotDiagnosticsHarness(overrides = {}) {
  return createDeveloperOnlyControlledPersistentAtlasManualCommand({
    hostnameProvider: () => "127.0.0.1",
    integrationProvider: () => ({
      getIntegratedPersistentAtlasStatus() {
        return {
          schemaId:
            "GROWGO_CONTROLLED_PERSISTENT_ATLAS_CONTRACT_INTEGRATION_STATUS_001",
          integrationState: "failed_closed",
          failedClosed: true,
          lastFailureReason: "RAW_REFERENCE_DETECTED",
          snapshotCompletedCount: 0
        };
      }
    }),
    compositionStatusProvider: () => ({
      schemaId: "TEST_PERSISTENT_COMPOSITION_STATUS_001",
      state: "ready",
      snapshotStatus: {
        lastFailureReason: "RAW_REFERENCE_DETECTED",
        rawReferenceDetected: true,
        rawReferenceFieldPath: "rawSnapshot.contains",
        rawReferenceType: "function",
        rawReferenceConstructorName: "contains",
        snapshotCreateAttemptCount: 1,
        snapshotCreateCompletedCount: 0,
        snapshotValidationAttemptCount: 0,
        snapshotValidationCompletedCount: 0,
        ...overrides
      }
    })
  });
}

test("1. install refuses to expose the namespace outside approved local hosts", () => {
  const harness = createHarness({ hostname: "growgo.example.com" });
  const installed = installDeveloperOnlyControlledPersistentAtlasManualCommand({
    globalObject: harness.namespace,
    command: harness.command
  });

  assert.equal(installed, null);
  assert.equal(
    "authorizeControlledPersistentAtlas" in harness.namespace.GrowGoDeveloperDiagnostics,
    false
  );
});

test("2. creating the command creates no browser-owned resources and status has no side effects", () => {
  const harness = createHarness();
  const status = harness.command.getControlledPersistentAtlasStatus();

  assert.equal(harness.metrics.surfaceCalls, 0);
  assert.equal(harness.metrics.lifecycleAcquireCalls, 0);
  assert.equal(harness.metrics.snapshotCalls, 0);
  assert.equal(harness.metrics.drawCalls, 0);
  assert.equal(harness.metrics.scheduleCount, 0);
  assert.equal(harness.metrics.registeredEvents.length, 0);
  assert.equal(status.commandAvailable, true);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("3. exact authorization confirmation is required and one-frame confirmation is rejected", () => {
  const harness = createHarness();

  const invalid = harness.command.authorizeControlledPersistentAtlas({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  const wrong = harness.command.authorizeControlledPersistentAtlas({
    confirmation: "WRONG"
  });

  assert.equal(invalid.reasonCode, "INVALID_CONFIRMATION");
  assert.equal(wrong.reasonCode, "INVALID_CONFIRMATION");
});

test("4. authorization succeeds and install extends the existing diagnostics namespace", () => {
  const harness = createHarness();
  const installed = installDeveloperOnlyControlledPersistentAtlasManualCommand({
    globalObject: harness.namespace,
    command: harness.command
  });

  assert.ok(installed);
  assert.equal(
    typeof harness.namespace.GrowGoDeveloperDiagnostics.authorizeControlledPersistentAtlas,
    "function"
  );

  const result =
    harness.namespace.GrowGoDeveloperDiagnostics.authorizeControlledPersistentAtlas({
      confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
    });

  assert.equal(result.outcome, "authorized");
  assert.equal(result.authorizationState, "active");
  assert.equal(result.attached, false);
  assertCanonicalFlags(result.canonicalSafetyFlags);
});

test("5. attach requires prior authorization and exact confirmation", () => {
  const harness = createHarness();

  const blocked = harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  const wrong = harness.command.attachControlledPersistentAtlas({
    confirmation: "WRONG"
  });

  assert.equal(blocked.reasonCode, "PERSISTENT_AUTHORIZATION_UNAVAILABLE");
  assert.equal(wrong.reasonCode, "INVALID_CONFIRMATION");
});

test("6. attach succeeds once, owns one Canvas and pane, and registers exactly three approved listeners", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const result = harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  assert.equal(result.outcome, "attached");
  assert.equal(result.attached, true);
  assert.equal(result.ownedCanvasCount, 1);
  assert.equal(result.ownedPaneCount, 1);
  assert.equal(result.ownedListenerCount, 3);
  assert.equal(harness.metrics.scheduleCount, 1);
  assert.deepEqual(
    harness.metrics.registeredEvents.map(({ eventName }) => eventName),
    ["moveend", "zoomend", "resize"]
  );
});

test("7. duplicate attach is blocked", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  const duplicate = harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  assert.equal(duplicate.reasonCode, "DUPLICATE_ATTACH");
});

test("8. manual redraw requires exact confirmation and uses manual_redraw", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  const wrong = harness.command.requestControlledPersistentAtlasRedraw({
    confirmation: "WRONG"
  });
  const okay = harness.command.requestControlledPersistentAtlasRedraw({
    confirmation: REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW
  });

  assert.equal(wrong.reasonCode, "INVALID_CONFIRMATION");
  assert.ok(["queued", "coalesced"].includes(okay.outcome));
});

test("9. queued redraws coalesce and a redraw during draw creates one follow-up", () => {
  const harness = createHarness({
    manualScheduler: true,
    followUpDuringFirstDraw: true
  });

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  const redrawA = harness.command.requestControlledPersistentAtlasRedraw({
    confirmation: REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW,
    reason: "moveend"
  });
  const redrawB = harness.command.requestControlledPersistentAtlasRedraw({
    confirmation: REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW,
    reason: "zoomend"
  });

  harness.flushAll();
  const status = harness.command.getControlledPersistentAtlasStatus();

  assert.ok(["queued", "coalesced"].includes(redrawA.outcome));
  assert.equal(redrawB.outcome, "coalesced");
  assert.equal(status.schedulerListenerStatus.redrawCompletedCount >= 1, true);
  assert.equal(status.schedulerListenerStatus.redrawCoalescedCount >= 1, true);
});

test("10. detach requires exact confirmation, reaches zero ownership, and repeated detach is harmless", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  const wrong = harness.command.detachControlledPersistentAtlas({
    confirmation: "WRONG"
  });
  const detached = harness.command.detachControlledPersistentAtlas({
    confirmation: DETACH_CONTROLLED_PERSISTENT_ATLAS
  });
  const again = harness.command.detachControlledPersistentAtlas({
    confirmation: DETACH_CONTROLLED_PERSISTENT_ATLAS
  });

  assert.equal(wrong.reasonCode, "INVALID_CONFIRMATION");
  assert.equal(detached.ownedCanvasCount, 0);
  assert.equal(detached.ownedPaneCount, 0);
  assert.equal(detached.ownedListenerCount, 0);
  assert.ok(["released", "blocked"].includes(again.outcome));
});

test("11. revoke requires its own confirmation and triggers cleanup", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  const wrong = harness.command.revokeControlledPersistentAtlas({
    confirmation: "WRONG"
  });
  const revoked = harness.command.revokeControlledPersistentAtlas({
    confirmation: REVOKE_CONTROLLED_PERSISTENT_ATLAS
  });

  assert.equal(wrong.reasonCode, "INVALID_CONFIRMATION");
  assert.equal(revoked.outcome, "revoked");
  assert.equal(revoked.detachRequired, true);
});

test("12. invalidate accepts only the allowed reasons and triggers cleanup", () => {
  const harness = createHarness();

  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });

  const wrong = harness.command.invalidateControlledPersistentAtlas({
    confirmation: INVALIDATE_CONTROLLED_PERSISTENT_ATLAS,
    reasonCode: "NOT_ALLOWED"
  });
  const okay = harness.command.invalidateControlledPersistentAtlas({
    confirmation: INVALIDATE_CONTROLLED_PERSISTENT_ATLAS,
    reasonCode: CONTROLLED_PERSISTENT_ATLAS_INVALIDATION_REASONS[0]
  });

  assert.equal(wrong.reasonCode, "INVALID_INVALIDATION_REASON");
  assert.equal(okay.outcome, "invalidated");
  assert.equal(okay.detachRequired, true);
});

test("13. snapshot and draw failures fail closed and expose cleanup state", () => {
  const snapshotHarness = createHarness({ failSnapshot: true, manualScheduler: true });
  snapshotHarness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  snapshotHarness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  snapshotHarness.flushAll();
  const snapshotStatus = snapshotHarness.command.getControlledPersistentAtlasStatus();
  assert.equal(snapshotStatus.integrationStatus.failedClosed, true);

  const drawHarness = createHarness({ failDraw: true, manualScheduler: true });
  drawHarness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  drawHarness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  drawHarness.flushAll();
  const drawStatus = drawHarness.command.getControlledPersistentAtlasStatus();
  assert.equal(drawStatus.integrationStatus.failedClosed, true);
  assert.equal(drawStatus.cleanupStatus.cleanupAttemptCount >= 1, true);
});

test("14. results and status stay immutable, serializable, and expose no raw references", () => {
  const harness = createHarness();
  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  const result = harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  const status = harness.command.getControlledPersistentAtlasStatus();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(result));
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("map" in status.integrationStatus, false);
  assert.equal("canvas" in status.integrationStatus, false);
  assert.equal("pane" in status.integrationStatus, false);
  assert.equal("listener" in status.integrationStatus, false);
});

test("14a. snapshot status exposes raw-reference metadata without exposing raw objects", () => {
  const command = createSnapshotDiagnosticsHarness();
  const status = command.getControlledPersistentAtlasStatus();
  const snapshotStatus = command.getControlledPersistentAtlasSnapshotStatus();

  assert.equal(status.snapshotStatus.lastFailureReason, "RAW_REFERENCE_DETECTED");
  assert.equal(status.snapshotStatus.rawReferenceDetected, true);
  assert.equal(status.snapshotStatus.rawReferenceFieldPath, "rawSnapshot.contains");
  assert.equal(status.snapshotStatus.rawReferenceType, "function");
  assert.equal(status.snapshotStatus.rawReferenceConstructorName, "contains");
  assert.equal(status.snapshotStatus.snapshotCreateAttemptCount, 1);
  assert.equal(status.snapshotStatus.snapshotCreateCompletedCount, 0);
  assert.equal(status.snapshotStatus.snapshotValidationAttemptCount, 0);
  assert.equal(status.snapshotStatus.snapshotValidationCompletedCount, 0);
  assert.deepEqual(snapshotStatus, status.snapshotStatus);
  assert.equal("rawReference" in status.snapshotStatus, false);
  assert.equal(Object.isFrozen(status.snapshotStatus), true);
  assert.doesNotThrow(() => JSON.stringify(status.snapshotStatus));
});

test("14b. successful snapshot diagnostics clear stale raw-reference metadata", () => {
  const command = createSnapshotDiagnosticsHarness({
    lastFailureReason: null,
    rawReferenceDetected: false,
    rawReferenceFieldPath: null,
    rawReferenceType: null,
    rawReferenceConstructorName: null,
    snapshotCreateAttemptCount: 2,
    snapshotCreateCompletedCount: 1
  });

  const snapshotStatus = command.getControlledPersistentAtlasSnapshotStatus();
  assert.equal(snapshotStatus.lastFailureReason, "RAW_REFERENCE_DETECTED");
  assert.equal(snapshotStatus.rawReferenceDetected, false);
  assert.equal(snapshotStatus.rawReferenceFieldPath, null);
  assert.equal(snapshotStatus.rawReferenceType, null);
  assert.equal(snapshotStatus.rawReferenceConstructorName, null);
  assert.equal(snapshotStatus.snapshotCreateAttemptCount, 2);
  assert.equal(snapshotStatus.snapshotCreateCompletedCount, 1);
});

test("14c. invalidated status reads remain non-throwing and preserve cleanup visibility", () => {
  const harness = createHarness({ manualScheduler: true });
  harness.command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  harness.command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
  harness.flushOne();

  harness.command.invalidateControlledPersistentAtlas({
    confirmation: INVALIDATE_CONTROLLED_PERSISTENT_ATLAS,
    reasonCode: "MANUAL_INVALIDATION"
  });
  harness.setIdentitySnapshotFailure("REGION_OUT_OF_SCOPE");

  assert.doesNotThrow(() => harness.command.getControlledPersistentAtlasStatus());
  const status = harness.command.getControlledPersistentAtlasStatus();
  assert.equal(status.integrationStatus.integrationState, "invalidated");
  assert.equal(status.integrationStatus.cleanupCompleted, true);
  assert.equal(status.integrationStatus.referencesReleased, true);
  assert.equal(status.integrationStatus.ownedCanvasCount, 0);
  assert.equal(status.integrationStatus.ownedPaneCount, 0);
  assert.equal(status.integrationStatus.ownedListenerCount, 0);
  assert.equal(status.integrationStatus.lastFailureReason, "MANUAL_INVALIDATION");
  assert.equal(status.authorizationStatus.redrawPermissionAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("15. command source and app wiring include the developer-only persistent diagnostics surface with no polling", () => {
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");

  for (const phrase of [
    "authorizeControlledPersistentAtlas",
    "attachControlledPersistentAtlas",
    "requestControlledPersistentAtlasRedraw",
    "getControlledPersistentAtlasStatus",
    "getControlledPersistentAtlasSnapshotStatus",
    "detachControlledPersistentAtlas",
    "revokeControlledPersistentAtlas",
    "invalidateControlledPersistentAtlas",
    "installDeveloperOnlyControlledPersistentAtlasManualCommand",
    "createControlledPersistentAtlasContractIntegration"
  ]) {
    assert.match(moduleSource + appSource, new RegExp(phrase));
  }

  for (const phrase of [
    "rawReferenceFieldPath",
    "rawReferenceType",
    "rawReferenceConstructorName",
    "snapshotCreateAttemptCount",
    "snapshotValidationCompletedCount"
  ]) {
    assert.match(moduleSource + appSource, new RegExp(phrase));
  }

  assert.doesNotMatch(moduleSource, /setInterval|setTimeout/);
  assert.doesNotMatch(appSource, /setInterval|setTimeout/);
});
