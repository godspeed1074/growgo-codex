import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  attachPersistentAtlas,
  authorizePersistentAtlasSession,
  createControlledPersistentAtlasController,
  detachPersistentAtlas,
  getPersistentAtlasControllerStatus,
  requestPersistentAtlasRedraw
} from "../client/developer-only-controlled-persistent-atlas-controller.mjs";
import {
  createControlledPersistentAtlasLiveAdapter,
  createPersistentControllerDependencies,
  getPersistentLiveAdapterStatus
} from "../client/developer-only-controlled-persistent-atlas-live-adapter.mjs";

const AUTHORIZE = "AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION";
const ATTACH = "ATTACH_CONTROLLED_PERSISTENT_ATLAS";
const DETACH = "DETACH_CONTROLLED_PERSISTENT_ATLAS";
const REDRAW = "REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-controlled-persistent-atlas-live-adapter.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_57_DISCONNECTED_PERSISTENT_LIVE_ADAPTER_SKELETON.md"
);

function buildIdentity(overrides = {}) {
  return {
    mapIdentity: "FAKE_MAP_001",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "1",
    packageFingerprint: "PKG_FP_001",
    recipeId: "ATLAS_RECIPE_001",
    recipeVersion: "1",
    selectorSeed: "SEED_001",
    sessionId: "SESSION_001",
    ...overrides
  };
}

function createSeamHarness({
  manualScheduler = false,
  mutableSnapshot = false,
  staleReadinessIdentity = false,
  duplicateLifecycleOwner = false,
  twoCanvases = false,
  forbiddenRegisteredEvent = null,
  cleanupFailed = false,
  mapIdentitySequence = ["FAKE_MAP_001"]
} = {}) {
  let mapIndex = 0;
  const queuedFrames = [];
  const map = { kind: "fake-map" };
  const identity = buildIdentity();
  const readinessIdentity = staleReadinessIdentity
    ? buildIdentity({ packageFingerprint: "PKG_FP_STALE" })
    : { ...identity };
  const authorizedIdentity = { ...identity };

  const metrics = {
    rawMapCalls: 0,
    readinessCalls: 0,
    authorizationCalls: 0,
    identityCalls: 0,
    surfaceCalls: 0,
    lifecycleCalls: 0,
    snapshotCalls: 0,
    drawCalls: 0,
    schedulerCalls: 0,
    cancellerCalls: 0,
    registerCalls: [],
    removeCalls: [],
    cleanupCalls: 0,
    runtimeDrawStates: [],
    snapshotsSeen: [],
    liveInvocationsAtConstruction: 0
  };

  const seams = {
    rawMapProvider: {
      resolveRawMap() {
        metrics.rawMapCalls += 1;
        const mapIdentityId =
          mapIdentitySequence[Math.min(mapIndex, mapIdentitySequence.length - 1)];
        mapIndex += 1;
        return { map, mapIdentityId };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness() {
        metrics.readinessCalls += 1;
        return {
          approved: true,
          reasonCode: "READINESS_APPROVED",
          identity: { ...readinessIdentity }
        };
      }
    },
    authorizationStatusProvider: {
      getPersistentAuthorizationStatus() {
        metrics.authorizationCalls += 1;
        return {
          localDevelopment: true,
          sessionId: "SESSION_001",
          authorizedIdentity: { ...authorizedIdentity }
        };
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity() {
        metrics.identityCalls += 1;
        return { ...identity };
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface() {
        metrics.surfaceCalls += 1;
        return {
          pane: { kind: "fake-pane" },
          ...(twoCanvases
            ? { canvases: [{ kind: "fake-canvas-a" }, { kind: "fake-canvas-b" }] }
            : { canvas: { kind: "fake-canvas" } }),
          cleanupOwner: { kind: "fake-cleanup-owner" },
          surfaceOwnerId: "SURFACE_OWNER_A",
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner() {
        metrics.lifecycleCalls += 1;
        if (duplicateLifecycleOwner) {
          return {
            lifecycleOwners: [{ ownerId: "A" }, { ownerId: "B" }]
          };
        }
        return {
          lifecycleOwner: { kind: "fake-lifecycle-owner", ownerId: "LIFECYCLE_OWNER_A" },
          lifecycleOwnerId: "LIFECYCLE_OWNER_A"
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ reason }) {
        metrics.snapshotCalls += 1;
        const snapshot = { kind: "fake-snapshot", reason };
        const finalSnapshot = mutableSnapshot ? snapshot : Object.freeze(snapshot);
        metrics.snapshotsSeen.push(finalSnapshot);
        return finalSnapshot;
      }
    },
    frameDrawProvider: {
      drawPersistentFrame({ snapshot, runtimeDrawState, reason }) {
        metrics.drawCalls += 1;
        metrics.runtimeDrawStates.push(runtimeDrawState);
        metrics.snapshotsSeen.push(snapshot);
        runtimeDrawState.lastReason = reason;
      }
    },
    animationFrameScheduler(callback) {
      metrics.schedulerCalls += 1;
      if (manualScheduler) {
        queuedFrames.push(callback);
      } else {
        callback();
      }
      return { kind: "fake-frame", id: metrics.schedulerCalls };
    },
    animationFrameCanceller() {
      metrics.cancellerCalls += 1;
    },
    approvedListenerRegistrar(eventName) {
      metrics.registerCalls.push(eventName);
      return {
        eventName: forbiddenRegisteredEvent ?? eventName
      };
    },
    approvedListenerRemover(registration) {
      metrics.removeCalls.push(registration?.eventName ?? "unknown");
    },
    retainedCleanupProvider: {
      cleanupPersistentAttachment() {
        metrics.cleanupCalls += 1;
        if (cleanupFailed) {
          return {
            cleanupCompleted: false,
            reasonCode: "CLEANUP_PROVIDER_FAILED"
          };
        }
        return { cleanupCompleted: true };
      }
    }
  };

  return {
    seams,
    metrics,
    flushOne() {
      const callback = queuedFrames.shift();
      if (callback) {
        callback();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (queuedFrames.length && remaining > 0) {
        remaining -= 1;
        queuedFrames.shift()();
      }
    }
  };
}

function createReadyAdapterHarness(options = {}) {
  const harness = createSeamHarness(options);
  const adapter = createControlledPersistentAtlasLiveAdapter(harness.seams);
  return { harness, adapter };
}

test("default adapter is unavailable and status is frozen serializable", () => {
  const adapter = createControlledPersistentAtlasLiveAdapter();
  const status = getPersistentLiveAdapterStatus(adapter);

  assert.equal(status.adapterReady, false);
  assert.equal(status.dependenciesCreated, false);
  assert.equal(status.mapSeamAvailable, false);
  assert.equal(status.cleanupSeamAvailable, false);
  assert.equal(status.windowAccessDetected, false);
  assert.equal(status.documentAccessDetected, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("complete fake candidate seams make the adapter ready without live invocation", () => {
  const { harness, adapter } = createReadyAdapterHarness();
  const status = getPersistentLiveAdapterStatus(adapter);

  assert.equal(status.adapterReady, true);
  assert.equal(status.dependenciesCreated, false);
  assert.equal(harness.metrics.rawMapCalls, 0);
  assert.equal(harness.metrics.drawCalls, 0);
});

test("missing required seams and wrong dependency types keep adapter not ready", () => {
  const missingMap = createControlledPersistentAtlasLiveAdapter({
    readinessProvider: {
      getPersistentAttachmentReadiness() {}
    }
  });
  assert.equal(getPersistentLiveAdapterStatus(missingMap).adapterReady, false);

  const wrongTypes = createControlledPersistentAtlasLiveAdapter({
    rawMapProvider: { resolveRawMap: true },
    readinessProvider: { getPersistentAttachmentReadiness: true },
    authorizationStatusProvider: { getPersistentAuthorizationStatus: true }
  });
  const status = getPersistentLiveAdapterStatus(wrongTypes);
  assert.equal(status.adapterReady, false);
  assert.match(status.lastFailureReason, /_INVALID$/);
});

test("scheduler/canceller and listener registrar/remover mismatches block readiness", () => {
  const badScheduler = createControlledPersistentAtlasLiveAdapter({
    ...createSeamHarness().seams,
    animationFrameCanceller: true
  });
  assert.equal(getPersistentLiveAdapterStatus(badScheduler).adapterReady, false);

  const badListener = createControlledPersistentAtlasLiveAdapter({
    ...createSeamHarness().seams,
    approvedListenerRemover: true
  });
  assert.equal(getPersistentLiveAdapterStatus(badListener).adapterReady, false);
});

test("createPersistentControllerDependencies marks dependencies created and returns narrow controller contracts only", () => {
  const { adapter } = createReadyAdapterHarness();
  const deps = createPersistentControllerDependencies(adapter);
  const status = getPersistentLiveAdapterStatus(adapter);

  assert.equal(status.dependenciesCreated, true);
  assert.equal(typeof deps.mapProvider.getMap, "function");
  assert.equal(typeof deps.readinessProvider.getPersistentAttachmentReadiness, "function");
  assert.equal(typeof deps.authorizationProvider.createPersistentSession, "function");
  assert.equal(typeof deps.surfaceProvider.preparePersistentSurface, "function");
  assert.equal(typeof deps.animationFrameScheduler.schedule, "function");
  assert.equal("map" in deps, false);
  assert.equal("canvas" in deps, false);
  assert.equal("lifecycleOwner" in deps, false);
});

test("stale map identity is rejected", () => {
  const { adapter } = createReadyAdapterHarness({
    mapIdentitySequence: ["FAKE_MAP_001", "FAKE_MAP_002"]
  });

  adapter.resolveMap();

  assert.throws(
    () => adapter.resolveMap(),
    /STALE_MAP_IDENTITY/
  );
});

test("stale region package recipe identity is rejected by readiness resolution", () => {
  const { adapter } = createReadyAdapterHarness({
    staleReadinessIdentity: true
  });

  adapter.resolveAuthorization();

  assert.throws(
    () => adapter.resolveReadiness({ map: {} }),
    /STALE_REGION_PACKAGE_RECIPE_IDENTITY/
  );
});

test("surface with two canvases is rejected", () => {
  const { adapter } = createReadyAdapterHarness({ twoCanvases: true });
  assert.throws(
    () =>
      adapter.acquireRetainedSurface({
        map: {},
        identity: buildIdentity(),
        lifecycleOwner: { ownerId: "LIFECYCLE_OWNER_A" }
      }),
    /RETAINED_SURFACE_CANVAS_COUNT_INVALID/
  );
});

test("duplicate lifecycle owner is rejected", () => {
  const { adapter } = createReadyAdapterHarness({
    duplicateLifecycleOwner: true
  });
  assert.throws(
    () => adapter.acquireLifecycleOwner({ map: {}, identity: buildIdentity() }),
    /DUPLICATE_LIFECYCLE_OWNER/
  );
});

test("forbidden listener name is rejected", () => {
  const { adapter } = createReadyAdapterHarness({
    forbiddenRegisteredEvent: "move"
  });
  assert.throws(
    () =>
      adapter.registerApprovedListeners({
        moveend: () => {},
        zoomend: () => {},
        resize: () => {}
      }),
    /FORBIDDEN_LISTENER_EVENT/
  );
});

test("immutable snapshot is required", () => {
  const { adapter } = createReadyAdapterHarness({ mutableSnapshot: true });
  assert.throws(
    () =>
      adapter.createFrameSnapshot({
        map: {},
        identity: buildIdentity(),
        reason: "initial_attach"
      }),
    /IMMUTABLE_SNAPSHOT_REQUIRED/
  );
});

test("draw keeps immutable snapshot separate from mutable runtime draw state", () => {
  const { harness, adapter } = createReadyAdapterHarness();
  const snapshot = adapter.createFrameSnapshot({
    map: {},
    identity: buildIdentity(),
    reason: "initial_attach"
  });
  adapter.drawFrame({
    map: {},
    identity: buildIdentity(),
    pane: { kind: "fake-pane" },
    canvas: { kind: "fake-canvas" },
    lifecycleOwner: { kind: "fake-owner" },
    snapshot,
    reason: "initial_attach"
  });

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(harness.metrics.drawCalls, 1);
  assert.equal(harness.metrics.runtimeDrawStates.length, 1);
  assert.notEqual(harness.metrics.runtimeDrawStates[0], snapshot);
  assert.equal(harness.metrics.runtimeDrawStates[0].lastReason, "initial_attach");
});

test("cleanup failures are reported", () => {
  const { adapter } = createReadyAdapterHarness({ cleanupFailed: true });
  assert.throws(
    () => adapter.cleanupRetainedResources({}),
    /CLEANUP_PROVIDER_FAILED/
  );
});

test("module stays disconnected from window script startup and browser globals", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /from\s+["']\.\/script\.js["']/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.ok(fs.existsSync(sessionDocPath));
});

test("all canonical safety flags remain false", () => {
  const { adapter } = createReadyAdapterHarness();
  const status = getPersistentLiveAdapterStatus(adapter);

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
});

test("controller integration works through injected fake seams only: authorize attach redraw coalesce detach cleanup", () => {
  const { harness, adapter } = createReadyAdapterHarness({ manualScheduler: true });
  const dependencies = createPersistentControllerDependencies(adapter);
  const controller = createControlledPersistentAtlasController(dependencies);

  const authorized = authorizePersistentAtlasSession(controller, {
    confirmation: AUTHORIZE
  });
  assert.equal(authorized.outcome, "authorized");

  const attached = attachPersistentAtlas(controller, {
    confirmation: ATTACH
  });
  assert.equal(attached.outcome, "attached");
  assert.equal(harness.metrics.schedulerCalls, 1);
  assert.equal(harness.metrics.drawCalls, 0);

  const redrawA = requestPersistentAtlasRedraw(controller, {
    confirmation: REDRAW,
    reason: "moveend"
  });
  const redrawB = requestPersistentAtlasRedraw(controller, {
    confirmation: REDRAW,
    reason: "zoomend"
  });
  assert.equal(redrawA.outcome, "coalesced");
  assert.equal(redrawB.outcome, "coalesced");

  harness.flushOne();

  const idleStatus = getPersistentAtlasControllerStatus(controller);
  assert.equal(idleStatus.redrawCompletedCount, 1);
  assert.equal(harness.metrics.snapshotCalls, 1);
  assert.equal(harness.metrics.drawCalls, 1);

  const redrawAfterIdle = requestPersistentAtlasRedraw(controller, {
    confirmation: REDRAW,
    reason: "resize"
  });
  assert.equal(redrawAfterIdle.outcome, "queued");
  harness.flushOne();

  const detached = detachPersistentAtlas(controller, {
    confirmation: DETACH
  });
  assert.equal(detached.outcome, "detached");
  assert.equal(harness.metrics.cleanupCalls, 1);
  assert.equal(harness.metrics.removeCalls.length, 3);

  const finalStatus = getPersistentAtlasControllerStatus(controller);
  assert.equal(finalStatus.ownedCanvasCount, 0);
  assert.equal(finalStatus.ownedPaneCount, 0);
  assert.equal(finalStatus.ownedListenerCount, 0);
  assert.equal(finalStatus.referencesReleased, true);
});
