import test from "node:test";
import assert from "node:assert/strict";

import {
  createControlledPersistentAtlasContractIntegration
} from "../client/developer-only-controlled-persistent-atlas-contract-integration.mjs";
import {
  ATTACH_CONTROLLED_PERSISTENT_ATLAS,
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  createDeveloperOnlyControlledPersistentAtlasManualCommand,
  installDeveloperOnlyControlledPersistentAtlasManualCommand
} from "../client/developer-only-controlled-persistent-atlas-manual-command.mjs";

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
    mapIdentityId: "MAP_TRACE_001",
    sessionId: "SESSION_TRACE_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_TRACE_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_TRACE_001",
    ...overrides
  };
}

function createHarness({
  failSnapshot = false,
  failDraw = false,
  cleanupFailureReasons = []
} = {}) {
  const identity = createIdentity();
  const map = { kind: "fake-map", on() {}, off() {} };
  const canvas = { kind: "fake-canvas" };
  const pane = { kind: "fake-pane" };
  const lifecycleOwner = { ownerId: "LIFECYCLE_OWNER_TRACE_001" };
  const queued = [];

  const integration = createControlledPersistentAtlasContractIntegration({
    hostnameProvider: () => "127.0.0.1",
    rawMapProvider: {
      resolveRawMap() {
        return { map, mapIdentityId: identity.mapIdentityId };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        return {
          approved: true,
          reasonCode: "READINESS_APPROVED",
          identity
        };
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity() {
        return identity;
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface() {
        return {
          pane,
          canvas,
          surfaceOwnerId: "SURFACE_OWNER_TRACE_001",
          lifecycleOwnerId: "LIFECYCLE_OWNER_TRACE_001"
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner() {
        return {
          lifecycleOwner,
          lifecycleOwnerId: "LIFECYCLE_OWNER_TRACE_001"
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ reason }) {
        if (failSnapshot) {
          throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
            reasonCode: "SNAPSHOT_PROVIDER_FAILED"
          });
        }

        return Object.freeze({
          snapshotId: "SNAP_TRACE_001",
          snapshotGenerationId: "SNAP_GEN_TRACE_001",
          redrawReason: reason
        });
      }
    },
    frameDrawProvider: {
      drawPersistentFrame() {
        if (failDraw) {
          throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
            reasonCode: "DRAW_PROVIDER_FAILED"
          });
        }

        return { outcome: "completed", reasonCode: "DRAW_COMPLETED" };
      }
    },
    animationFrameScheduler(callback) {
      queued.push(callback);
      return { kind: "frame-handle" };
    },
    animationFrameCanceller() {},
    approvedListenerRegistrar(eventName, callback) {
      return { eventName, callback };
    },
    approvedListenerRemover() {},
    retainedCleanupProvider: {
      cleanupPersistentAttachment() {
        return {
          cleanupCompleted: cleanupFailureReasons.length === 0,
          reasonCode:
            cleanupFailureReasons[0] ??
            "CONTROLLED_PERSISTENT_ATLAS_CLEANUP_COMPLETED",
          cleanupFailureReasons,
          referencesReleased: cleanupFailureReasons.length === 0
        };
      }
    }
  });

  const command = createDeveloperOnlyControlledPersistentAtlasManualCommand({
    hostnameProvider: () => "127.0.0.1",
    integrationProvider: () => integration,
    compositionStatusProvider: () => ({
      schemaId: "TEST_PERSISTENT_TRACE_COMPOSITION_STATUS_001",
      state: "ready"
    })
  });

  return {
    integration,
    command,
    flushOne() {
      const callback = queued.shift();
      callback?.();
    }
  };
}

function authorizeAndAttach(command) {
  const authorized = command.authorizeControlledPersistentAtlas({
    confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
  });
  assert.equal(authorized.outcome, "authorized");

  return command.attachControlledPersistentAtlas({
    confirmation: ATTACH_CONTROLLED_PERSISTENT_ATLAS
  });
}

test("1. successful fake first draw records a frozen serializable trace", () => {
  const harness = createHarness();
  const attached = authorizeAndAttach(harness.command);

  assert.equal(attached.outcome, "attached");
  harness.flushOne();

  const trace = harness.command.getControlledPersistentAtlasFirstDrawTrace();
  assert.equal(Object.isFrozen(trace), true);
  assert.equal(typeof JSON.stringify(trace), "string");
  assert.equal(trace.traceActive, true);
  assert.equal(trace.step, "draw_provider_completed");
  assert.equal(trace.snapshotId, "SNAP_TRACE_001");
  assert.equal(trace.snapshotGenerationId, "SNAP_GEN_TRACE_001");
  assert.equal(trace.mapIdentityId, "MAP_TRACE_001");
  assert.equal(trace.sessionId, "SESSION_TRACE_001");
  assert.equal(trace.cleanupStarted, false);
  assert.equal(trace.thrownErrorName, null);
  assertCanonicalFlags(trace.canonicalSafetyFlags);
  assert.equal("canvas" in trace, false);
  assert.equal("map" in trace, false);
});

test("2. snapshot validation failure preserves the originating failure before cleanup", () => {
  const harness = createHarness({ failSnapshot: true });
  const attached = authorizeAndAttach(harness.command);

  assert.equal(attached.outcome, "attached");
  harness.flushOne();

  const trace = harness.command.getControlledPersistentAtlasFirstDrawTrace();
  assert.equal(trace.originatingFailureReason, "SNAPSHOT_PROVIDER_FAILED");
  assert.equal(trace.normalizedReasonCode, "CONTROLLED_PERSISTENT_ATLAS_CLEANUP_COMPLETED");
  assert.equal(trace.cleanupStarted, true);
  assert.equal(trace.cleanupCompleted, true);
});

test("3. draw-provider throw preserves failure separately from cleanup failures", () => {
  const harness = createHarness({
    failDraw: true,
    cleanupFailureReasons: ["ROLLBACK_FAILED"]
  });
  const attached = authorizeAndAttach(harness.command);

  assert.equal(attached.outcome, "attached");
  harness.flushOne();

  const trace = harness.command.getControlledPersistentAtlasFirstDrawTrace();
  assert.equal(trace.step, "cleanup_handoff_completed");
  assert.equal(trace.originatingFailureReason, "DRAW_PROVIDER_FAILED");
  assert.deepEqual(trace.cleanupFailureReasons, ["ROLLBACK_FAILED"]);
  assert.equal(trace.cleanupCompleted, false);
});

test("4. diagnostics namespace exposes the first-draw trace getter on local hosts", () => {
  const harness = createHarness();
  const globalObject = { GrowGoDeveloperDiagnostics: {} };

  installDeveloperOnlyControlledPersistentAtlasManualCommand({
    globalObject,
    command: harness.command
  });

  assert.equal(
    typeof globalObject.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasFirstDrawTrace,
    "function"
  );
});
