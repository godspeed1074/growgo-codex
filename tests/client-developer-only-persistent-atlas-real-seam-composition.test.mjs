import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  createControlledPersistentAtlasAuthorization
} from "../client/developer-only-controlled-persistent-atlas-authorization.mjs";
import { createControlledPersistentAtlasController } from "../client/developer-only-controlled-persistent-atlas-controller.mjs";
import {
  createPersistentAtlasRealSeamComposition,
  createPersistentAtlasControllerDependenciesFromRealSeams,
  validatePersistentAtlasRealSeamComposition,
  releasePersistentAtlasRealSeamComposition,
  getPersistentAtlasRealSeamCompositionStatus
} from "../client/developer-only-persistent-atlas-real-seam-composition.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-real-seam-composition.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

class FakePoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class FakeLatLng {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }
}
class FakeBounds {
  constructor(nw, se) {
    this.nw = nw;
    this.se = se;
  }
  getNorthWest() {
    return this.nw;
  }
  getSouthEast() {
    return this.se;
  }
}

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createFakeMap(id = "MAP_A") {
  return {
    id,
    getSize() {
      return new FakePoint(640, 360);
    },
    getBounds() {
      return new FakeBounds(new FakeLatLng(-38.2, 144.5), new FakeLatLng(-38.1, 144.7));
    },
    getCenter() {
      return new FakeLatLng(-38.15, 144.6);
    },
    getPixelOrigin() {
      return new FakePoint(100, 200);
    },
    getZoom() {
      return 14;
    },
    latLngToLayerPoint(latlng) {
      return new FakePoint(latlng.lng * 10, latlng.lat * -10);
    },
    on() {},
    off() {}
  };
}

function baseIdentity(overrides = {}) {
  return {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    regionId: "BELLARINE",
    packageId: "atlas-bellarine",
    packageVersion: "2026.08.06",
    packageFingerprint: "fingerprint-a",
    recipeId: "coastal-default",
    recipeVersion: "recipe-v001",
    selectorSeed: "seed-a",
    ...overrides
  };
}

function createApprovedReadiness(overrides = {}) {
  return {
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "approved",
    reasonCode: "READINESS_APPROVED",
    rendererHandoffStatus: "ready_for_future_renderer_attachment",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    resolvedRegion: Object.freeze({ regionId: "BELLARINE" }),
    resolvedPackage: Object.freeze({
      packageId: "atlas-bellarine",
      packageVersion: "2026.08.06",
      packageFingerprint: "fingerprint-a"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "coastal-default",
      selectedVersion: "recipe-v001"
    }),
    selectorSeed: "seed-a",
    ...overrides
  };
}

function createHarness(options = {}) {
  const state = {
    identity: baseIdentity(options.identityOverrides),
    readiness: createApprovedReadiness(options.readinessOverrides),
    map: createFakeMap(options.mapId ?? "MAP_A"),
    attached: false,
    lifecycleMatches: true,
    lifecycleReasonCode: null,
    frameQueue: [],
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    lifecycleGenerationId: "GEN_A",
    surfaceOwnerId: "SURFACE_OWNER_A",
    cleanupOwnerSeed: null,
    schedules: 0,
    cancels: 0,
    listeners: [],
    listenerRemovals: 0,
    surfaceCreates: 0,
    lifecycleCreates: 0,
    snapshotCreates: 0,
    draws: 0,
    cleanupCalls: [],
    drawReleaseCalls: 0,
    surfaceRemovalCalls: [],
    surfaceReferenceReleases: 0,
    lifecycleReleaseCalls: 0,
    lifecycleReferenceReleases: 0,
    snapshotReleaseCalls: 0,
    authInvalidations: 0,
    mapIdentityReleases: 0,
    sessionIdentityReleases: 0,
    referenceReleases: 0,
    redrawBlocks: 0,
    mutableStateCreates: 0,
    positionAdapts: 0,
    mapReferenceCount: 1,
    sessionReferenceCount: 1,
    authorizationClosed: false,
    referencesReleased: false,
    nowTick: 0
  };

  const contract = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => "127.0.0.1",
    identityProvider: () => state.identity,
    readinessProvider: () => ({ approved: true, reasonCode: "READINESS_APPROVED" }),
    controllerAttachmentStateProvider: () => ({ attached: state.attached }),
    lifecycleOwnerStateProvider: () => ({ matches: state.lifecycleMatches, reasonCode: state.lifecycleReasonCode }),
    nowProvider: () => "2026-08-06T12:00:00.000Z",
    authorizationSource: "persistent_real_seam_test"
  });

  const seams = {
    mapBridgeProvider() {
      return {
        rawLeafletMapReference: state.map,
        mapIdentityId: state.identity.mapIdentityId
      };
    },
    readinessBridgeProvider() {
      return state.readiness;
    },
    persistentAuthorizationContract: contract,
    browserFrameScheduler(callback) {
      state.schedules += 1;
      state.frameQueue.push(callback);
      return { kind: "fake-frame", id: state.schedules };
    },
    browserFrameCanceller() {
      state.cancels += 1;
    },
    listenerRegistrar(map, eventName, callback) {
      state.listeners.push({ map, eventName, callback });
      return { eventName, callback };
    },
    listenerRemover() {
      state.listenerRemovals += 1;
    },
    oneFrameSurfaceProvider() {
      state.surfaceCreates += 1;
      return {
        surfaceOwnerId: state.surfaceOwnerId,
        canvas: { id: "canvas-a", style: {} },
        pane: { id: "pane-a" }
      };
    },
    surfaceIdentityProvider(surface) {
      return { surfaceOwnerId: surface.surfaceOwnerId };
    },
    surfaceRemovalProvider({ target }) {
      state.surfaceRemovalCalls.push(target ?? "surface");
    },
    surfaceReferenceReleaseProvider() {
      state.surfaceReferenceReleases += 1;
    },
    lifecycleOwnerProvider() {
      state.lifecycleCreates += 1;
      return {
        lifecycleOwner: { id: "lifecycle-a" },
        lifecycleOwnerId: state.lifecycleOwnerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      };
    },
    lifecycleTranslationProvider({ metadata }) {
      return {
        lifecycleOwnerId: metadata.lifecycleOwnerId,
        lifecycleGenerationId: metadata.lifecycleGenerationId,
        surfaceOwnerId: metadata.surfaceOwnerId,
        translationStatus: "scalar_only",
        lifecycleState: "retained"
      };
    },
    lifecycleIdentityProvider() {
      return {
        lifecycleOwnerId: state.lifecycleOwnerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      };
    },
    lifecycleReleaseProvider() {
      state.lifecycleReleaseCalls += 1;
    },
    lifecycleReferenceReleaseProvider() {
      state.lifecycleReferenceReleases += 1;
    },
    oneFrameSnapshotProvider(args) {
      state.snapshotCreates += 1;
      return {
        viewportSize: args.map.getSize(),
        pixelRatio: 2,
        zoom: args.map.getZoom(),
        center: args.map.getCenter(),
        pixelOrigin: args.map.getPixelOrigin(),
        projectedViewportBounds: {
          northWestLatitude: -38.2,
          northWestLongitude: 144.5,
          southEastLatitude: -38.1,
          southEastLongitude: 144.7
        },
        canvasLayerPosition: { x: 12.4, y: 34.6 },
        scalarPayload: { viewportLabel: "atlas-main" }
      };
    },
    snapshotReleaseProvider() {
      state.snapshotReleaseCalls += 1;
    },
    snapshotAwareDrawProvider({ canvas, mutableDrawState, redrawReason }) {
      state.draws += 1;
      canvas.drawnReason = redrawReason;
      mutableDrawState.used = true;
      return { reasonCode: "FRAME_DRAW_COMPLETED" };
    },
    mutableDrawStateProvider({ snapshotScalars, drawGenerationId, redrawReason }) {
      state.mutableStateCreates += 1;
      return {
        snapshotScalars,
        drawGenerationId,
        redrawReason,
        canvasLayerPosition: {
          x: snapshotScalars.canvasLayerPosition.x,
          y: snapshotScalars.canvasLayerPosition.y
        }
      };
    },
    canvasPositionAdapter({ canvas, mutableCanvasLayerPosition }) {
      state.positionAdapts += 1;
      canvas.position = {
        x: mutableCanvasLayerPosition.x,
        y: mutableCanvasLayerPosition.y
      };
      return { positionAdapterPath: "direct_leaflet_position" };
    },
    drawStateReleaseProvider() {
      state.drawReleaseCalls += 1;
    },
    redrawBlockProvider() {
      state.redrawBlocks += 1;
    },
    authorizationInvalidationProvider() {
      state.authInvalidations += 1;
      state.authorizationClosed = true;
    },
    mapIdentityReleaseProvider() {
      state.mapIdentityReleases += 1;
      state.mapReferenceCount = 0;
    },
    sessionIdentityReleaseProvider() {
      state.sessionIdentityReleases += 1;
      state.sessionReferenceCount = 0;
    },
    referenceReleaseProvider() {
      state.referenceReleases += 1;
      state.referencesReleased = true;
    },
    schedulerPairIdentityProvider: options.schedulerPairIdentityProvider,
    listenerPairIdentityProvider: options.listenerPairIdentityProvider,
    cleanupIdentitySeedProvider: options.cleanupIdentitySeedProvider ?? (() => ({
      ...(state.cleanupOwnerSeed ? { cleanupOwnerId: state.cleanupOwnerSeed } : {}),
      mapReferenceCount: state.mapReferenceCount,
      sessionReferenceCount: state.sessionReferenceCount,
      authorizationClosed: state.authorizationClosed,
      referencesReleased: state.referencesReleased
    })),
    timeProvider() {
      const times = [
        "2026-08-06T12:00:00.000Z",
        "2026-08-06T12:00:00.010Z",
        "2026-08-06T12:00:00.020Z",
        "2026-08-06T12:00:00.030Z"
      ];
      return times[Math.min(state.nowTick++, times.length - 1)];
    }
  };

  return {
    state,
    seams,
    contract,
    authorize() {
      return contract.authorizePersistentAtlasSession({
        confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
      });
    },
    flushOne() {
      const next = state.frameQueue.shift();
      if (next) {
        next();
      }
    },
    flushAll(limit = 10) {
      let remaining = limit;
      while (state.frameQueue.length > 0 && remaining > 0) {
        remaining -= 1;
        state.frameQueue.shift()();
      }
    }
  };
}

function createExportedDependencyAdapter(exported) {
  return {
    mapProvider: { getMap: () => exported.resolveMap() },
    readinessProvider: { getPersistentAttachmentReadiness: () => exported.resolveReadiness() },
    authorizationProvider: {
      isLocalDevelopment: () => true,
      createPersistentSession: () => exported.resolveAuthorization()
    },
    identityProvider: { getPersistentAttachmentIdentity: () => exported.createIdentitySnapshot() },
    surfaceProvider: { preparePersistentSurface: () => exported.acquireSurface() },
    lifecycleOwnerProvider: { createLifecycleOwner: () => exported.acquireLifecycleOwner() },
    snapshotProvider: { createPersistentSnapshot: ({ reason }) => exported.createSnapshot({ redrawReason: reason }) },
    drawProvider: { drawPersistentFrame: ({ drawGenerationId }) => exported.drawFrame({ drawGenerationId }) },
    animationFrameScheduler: {
      schedule: (callback) => exported.scheduleFrame(callback),
      cancel: () => exported.cancelFrame()
    },
    cleanupProvider: { cleanupPersistentAttachment: () => exported.prepareCleanup({ cleanupMode: "detach" }) },
    listenerRegistrar: () => {},
    listenerRemover: () => {}
  };
}

test("1. defaults unavailable", () => {
  const composition = createPersistentAtlasRealSeamComposition();
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.state, "unavailable");
  assert.equal(status.compositionReady, false);
});

test("2. complete fake root seams compose successfully", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.state, "composed");
  assert.equal(status.createCompletedCount, 1);
});

test("3. exactly one instance of each wrapper", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.createCompletedCount, 1);
  assert.equal(composition.__state.wrapperInstanceCount, 11);
});

test("4. no live resources created during composition", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.realCanvasResourceCreated, false);
  assert.equal(status.realListenerRegistered, false);
  assert.equal(status.realFrameScheduled, false);
  assert.equal(status.realRendererInvoked, false);
});

test("5. missing root seam blocks", () => {
  const harness = createHarness();
  delete harness.seams.oneFrameSnapshotProvider;
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.equal(getPersistentAtlasRealSeamCompositionStatus(composition).compositionReady, false);
});

test("6. wrong seam type blocks", () => {
  const harness = createHarness();
  harness.seams.oneFrameSnapshotProvider = true;
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.equal(getPersistentAtlasRealSeamCompositionStatus(composition).compositionReady, false);
});

test("7. scheduler/canceller mismatch blocks", () => {
  const harness = createHarness({
    schedulerPairIdentityProvider: () => ({
      schedulerOwnerId: "SCHED_A",
      cancellerOwnerId: "SCHED_B"
    })
  });
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.throws(() => validatePersistentAtlasRealSeamComposition(composition), (error) => error.reasonCode === "SCHEDULER_CANCELLER_MISMATCH");
});

test("8. listener registrar/remover mismatch blocks", () => {
  const harness = createHarness({
    listenerPairIdentityProvider: () => ({
      listenerRegistrarOwnerId: "LISTENER_A",
      listenerRemoverOwnerId: "LISTENER_B"
    })
  });
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.throws(() => validatePersistentAtlasRealSeamComposition(composition), (error) => error.reasonCode === "LISTENER_PAIR_MISMATCH");
});

test("9. cleanup seam incomplete blocks", () => {
  const harness = createHarness();
  harness.seams.referenceReleaseProvider = undefined;
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.throws(() => validatePersistentAtlasRealSeamComposition(composition), (error) => error.reasonCode === "CLEANUP_SEAM_INCOMPLETE");
});

test("10. identity consistency succeeds", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = validatePersistentAtlasRealSeamComposition(composition);
  assert.equal(status.compositionValid, true);
  assert.equal(status.mapIdentityId, "MAP_A");
});

test("11. map mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  harness.state.identity.mapIdentityId = "MAP_B";
  harness.state.map = createFakeMap("MAP_B");
  assert.throws(() => createPersistentAtlasControllerDependenciesFromRealSeams(composition).resolveMap(), (error) => error.reasonCode === "MAP_IDENTITY_CHANGED" || error.reasonCode === "STALE_MAP_REFERENCE" || error.reasonCode === "DEPENDENCY_EXPORT_BLOCKED");
});

test("12. session mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  composition.__state.sessionId = "WRONG_SESSION";
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  assert.throws(() => exported.resolveAuthorization(), (error) => /SESSION/.test(error.reasonCode));
});

test("13. package fingerprint mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.resolveAuthorization();
  exported.createIdentitySnapshot();
  exported.consumeAttachPermission();
  harness.state.attached = true;
  harness.state.readiness = createApprovedReadiness({
    resolvedPackage: Object.freeze({
      packageId: "atlas-bellarine",
      packageVersion: "2026.08.06",
      packageFingerprint: "fingerprint-b"
    })
  });
  exported.resolveReadiness();
  assert.throws(() => exported.validateRedrawAuthorization(), (error) => error.reasonCode === "READINESS_IDENTITY_MISMATCH");
});

test("14. lifecycle-owner mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  harness.state.lifecycleMatches = false;
  harness.state.lifecycleReasonCode = "LIFECYCLE_OWNER_MISMATCH";
  exported.consumeAttachPermission();
  harness.state.attached = true;
  exported.createSnapshot({ redrawReason: "initial_attach" });
  assert.throws(() => exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" }), (error) => error.reasonCode === "LIFECYCLE_OWNER_MISMATCH");
});

test("15. surface-owner mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  harness.state.surfaceOwnerId = "SURFACE_OWNER_B";
  assert.throws(() => exported.validateLifecycleOwner(), (error) => error.reasonCode === "SURFACE_OWNER_MISMATCH");
});

test("16. scheduler-owner mismatch blocks", () => {
  const harness = createHarness({
    schedulerPairIdentityProvider: () => ({ schedulerOwnerId: "A", cancellerOwnerId: "B" })
  });
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.throws(() => validatePersistentAtlasRealSeamComposition(composition), (error) => error.reasonCode === "SCHEDULER_CANCELLER_MISMATCH");
});

test("17. listener-owner mismatch blocks", () => {
  const harness = createHarness({
    listenerPairIdentityProvider: () => ({ listenerRegistrarOwnerId: "A", listenerRemoverOwnerId: "B" })
  });
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  assert.throws(() => validatePersistentAtlasRealSeamComposition(composition), (error) => error.reasonCode === "LISTENER_PAIR_MISMATCH");
});

test("18. cleanup-owner mismatch blocks", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.resolveMap();
  exported.resolveReadiness();
  exported.resolveAuthorization();
  exported.createIdentitySnapshot();
  exported.consumeAttachPermission();
  harness.state.attached = true;
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  exported.prepareCleanup({ cleanupMode: "detach" });
  harness.state.cleanupOwnerSeed = "OTHER";
  assert.throws(() => exported.resumeCleanup(), (error) => error.reasonCode === "CLEANUP_OWNER_MISMATCH");
});

test("19. narrow dependencies export successfully", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  assert.equal(exported.schemaId, "GROWGO_PERSISTENT_ATLAS_REAL_SEAM_DEPENDENCIES_001");
  assert.equal(typeof exported.resolveMap, "function");
});

test("20. no raw wrappers exported", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  assert.equal("wrappers" in exported, false);
  assert.equal("map" in exported, false);
  assert.equal("canvas" in exported, false);
});

test("21. no raw map/Canvas/listener/frame/snapshot refs exported", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  assert.doesNotThrow(() => JSON.stringify(exported.getReadOnlyStatus()));
});

test("22. controller can be created from exported dependencies", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  const controller = createControlledPersistentAtlasController(createExportedDependencyAdapter(exported));
  assert.ok(controller);
});

test("23. fake attach/redraw/detach lifecycle succeeds", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.resolveMap();
  exported.resolveReadiness();
  exported.resolveAuthorization();
  exported.createIdentitySnapshot();
  exported.consumeAttachPermission();
  harness.state.attached = true;
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  exported.registerListeners({ moveend() {}, zoomend() {}, resize() {} });
  exported.scheduleFrame(() => {
    exported.createSnapshot({ redrawReason: "initial_attach" });
    exported.validateSnapshot();
    exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" });
  });
  harness.flushOne();
  const cleanupPrepared = exported.prepareCleanup({ cleanupMode: "detach" });
  exported.executeCleanup();
  const cleanupCompleted = exported.resumeCleanup();
  assert.equal(cleanupPrepared.cleanupPrepared, true);
  assert.equal(cleanupCompleted.cleanupComplete, true);
});

test("24. same Canvas reused", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  const first = exported.acquireSurface();
  const second = exported.reuseSurface();
  assert.equal(first.surfaceOwnerId, second.surfaceOwnerId);
});

test("25. same lifecycle owner reused", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  const first = exported.acquireLifecycleOwner();
  const second = exported.validateLifecycleOwner();
  assert.equal(first.lifecycleOwnerId, second.lifecycleOwnerId);
});

test("26. one frame queued maximum", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.scheduleFrame(() => {});
  assert.throws(() => exported.scheduleFrame(() => {}), (error) => error.reasonCode === "FRAME_ALREADY_QUEUED");
});

test("27. exact three listeners only", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  exported.registerListeners({ moveend() {}, zoomend() {}, resize() {} });
  assert.equal(harness.state.listeners.length, 3);
});

test("28. cleanup reaches zero ownership", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  exported.resolveMap();
  exported.resolveReadiness();
  exported.resolveAuthorization();
  exported.createIdentitySnapshot();
  exported.consumeAttachPermission();
  harness.state.attached = true;
  exported.acquireSurface();
  exported.acquireLifecycleOwner();
  exported.registerListeners({ moveend() {}, zoomend() {}, resize() {} });
  exported.scheduleFrame(() => {
    exported.createSnapshot({ redrawReason: "initial_attach" });
    exported.validateSnapshot();
    exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" });
  });
  harness.flushOne();
  exported.prepareCleanup({ cleanupMode: "detach" });
  exported.executeCleanup();
  const result = exported.resumeCleanup();
  assert.equal(result.zeroOwnershipVerified, true);
});

test("29. release composition succeeds", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  const result = releasePersistentAtlasRealSeamComposition(composition);
  assert.equal(result.released, true);
});

test("30. repeated release harmless", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  releasePersistentAtlasRealSeamComposition(composition);
  const second = releasePersistentAtlasRealSeamComposition(composition);
  assert.equal(second.released, true);
});

test("31. export after release blocked", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  validatePersistentAtlasRealSeamComposition(composition);
  releasePersistentAtlasRealSeamComposition(composition);
  assert.throws(() => createPersistentAtlasControllerDependenciesFromRealSeams(composition), (error) => error.reasonCode === "DEPENDENCY_EXPORT_BLOCKED");
});

test("32. status immutable and serializable", () => {
  const harness = createHarness();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("33. no raw references exposed", () => {
  const harness = createHarness();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal("wrappers" in status, false);
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
});

test("34. no window/document/global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.equal(source.includes("window."), false);
  assert.equal(source.includes("document."), false);
  assert.equal(source.includes("globalThis."), false);
  assert.equal(source.includes("GrowGoDeveloperDiagnostics"), false);
  assert.equal(source.includes("getGrowGoMap("), false);
});

test("35. no script.js import", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.equal(source.includes("script.js"), false);
});

test("36. no startup wiring", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const source = fs.readFileSync(modulePath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.equal(appSource.includes("developer-only-persistent-atlas-real-seam-composition"), false);
  assert.equal(scriptSource.includes("developer-only-persistent-atlas-real-seam-composition"), false);
  assert.equal(source.includes("addEventListener(\"load\""), false);
});

test("37. no real map/Canvas/listener/frame/renderer activity", () => {
  const harness = createHarness();
  harness.authorize();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.realMapResourceCreated, false);
  assert.equal(status.realCanvasResourceCreated, false);
  assert.equal(status.realListenerRegistered, false);
  assert.equal(status.realFrameScheduled, false);
  assert.equal(status.realRendererInvoked, false);
});

test("38. all four canonical safety flags remain false", () => {
  const harness = createHarness();
  const composition = createPersistentAtlasRealSeamComposition(harness.seams);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
