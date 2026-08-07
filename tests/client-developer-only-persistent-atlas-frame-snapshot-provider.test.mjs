import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasFrameSnapshot,
  createPersistentAtlasFrameSnapshotProvider,
  getPersistentAtlasFrameSnapshotStatus,
  normalizePersistentAtlasFrameSnapshotForContract,
  releasePersistentAtlasFrameSnapshot,
  toOneFrameViewportSnapshotContract,
  validatePersistentAtlasFrameSnapshot
} from "../client/developer-only-persistent-atlas-frame-snapshot-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-frame-snapshot-provider.mjs"
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
  constructor(northWest, southEast) {
    this.northWest = northWest;
    this.southEast = southEast;
  }
  getNorthWest() {
    return this.northWest;
  }
  getSouthEast() {
    return this.southEast;
  }
}

class UnsupportedRawReference {
  constructor(label = "unsupported") {
    this.label = label;
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

function createIdentity(overrides = {}) {
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

function createReadiness(overrides = {}) {
  return {
    diagnosticStatus: "approved",
    reasonCode: "READINESS_APPROVED",
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

function createLifecycleIdentity(overrides = {}) {
  return {
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    lifecycleGenerationId: "GEN_A",
    surfaceOwnerId: "SURFACE_OWNER_A",
    ...overrides
  };
}

function createFakeMap() {
  return {
    getSize() {
      return new FakePoint(640, 360);
    },
    getBounds() {
      return new FakeBounds(
        new FakeLatLng(-38.2, 144.5),
        new FakeLatLng(-38.1, 144.7)
      );
    },
    getCenter() {
      return new FakeLatLng(-38.15, 144.6);
    },
    getPixelOrigin() {
      return new FakePoint(100, 200);
    },
    getZoom() {
      return 14;
    }
  };
}

function createHarness({
  snapshotFactory = null,
  mapIdentityId = "MAP_A",
  releaseShouldFail = null
} = {}) {
  const state = {
    map: createFakeMap(),
    mapIdentityId,
    readiness: createReadiness(),
    identity: createIdentity({ mapIdentityId }),
    lifecycleIdentity: createLifecycleIdentity(),
    timeValue: "2026-08-06T12:00:00.000Z",
    releaseCalls: 0,
    snapshotCalls: 0
  };

  const provider = createPersistentAtlasFrameSnapshotProvider({
    oneFrameSnapshotProvider(args) {
      state.snapshotCalls += 1;
      if (snapshotFactory) {
        return snapshotFactory(state, args);
      }
      return {
        viewportSize: args.map.getSize(),
        pixelRatio: 2,
        zoom: args.map.getZoom(),
        center: args.map.getCenter(),
        pixelOrigin: args.map.getPixelOrigin(),
        projectedViewportBounds: args.map.getBounds(),
        northWestCoordinate: { latitude: -38.2, longitude: 144.5 },
        canvasLayerPosition: new FakePoint(12, 18),
        contains() {
          return true;
        },
        getNorthWest() {
          return { lat: -38.2, lng: 144.5 };
        },
        getCenter() {
          return { lat: -38.15, lng: 144.6 };
        },
        scalarPayload: {
          viewportLabel: "atlas-main"
        }
      };
    },
    mapProvider() {
      return {
        map: state.map,
        mapIdentityId: state.mapIdentityId
      };
    },
    readinessProvider() {
      return state.readiness;
    },
    identityProvider() {
      return state.identity;
    },
    lifecycleIdentityProvider() {
      return state.lifecycleIdentity;
    },
    snapshotReleaseProvider() {
      state.releaseCalls += 1;
      if (releaseShouldFail) {
        throw Object.assign(new Error(releaseShouldFail), {
          reasonCode: releaseShouldFail
        });
      }
      return { released: true };
    },
    timeProvider() {
      return state.timeValue;
    }
  });

  return { provider, state };
}

test("1. defaults unavailable", () => {
  const provider = createPersistentAtlasFrameSnapshotProvider();
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => error.reasonCode === "SNAPSHOT_PROVIDER_UNAVAILABLE"
  );
});

test("2. wrong dependency types rejected", () => {
  const provider = createPersistentAtlasFrameSnapshotProvider({
    oneFrameSnapshotProvider: 1,
    mapProvider: 2,
    readinessProvider: 3,
    identityProvider: 4,
    lifecycleIdentityProvider: 5,
    snapshotReleaseProvider: 6,
    timeProvider: 7
  });
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => error.reasonCode === "SNAPSHOT_PROVIDER_UNAVAILABLE"
  );
});

test("3. snapshot creation succeeds", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  assert.equal(snapshot.schemaId, "GROWGO_PERSISTENT_ATLAS_FRAME_SNAPSHOT_001");
});

test("4. unique snapshot per redraw", () => {
  const { provider } = createHarness();
  const first = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const second = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "moveend"
  });
  assert.notEqual(first.snapshotId, second.snapshotId);
  assert.notEqual(first.snapshotGenerationId, second.snapshotGenerationId);
});

test("5. supported redraw reasons accepted", () => {
  const { provider } = createHarness();
  for (const reason of [
    "initial_attach",
    "moveend",
    "zoomend",
    "resize",
    "manual_redraw",
    "follow_up_redraw"
  ]) {
    const snapshot = createPersistentAtlasFrameSnapshot(provider, {
      redrawReason: reason
    });
    assert.equal(snapshot.redrawReason, reason);
  }
});

test("6. unknown redraw reason rejected", () => {
  const { provider } = createHarness();
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "unknown"
      }),
    (error) => error.reasonCode === "INVALID_REDRAW_REASON"
  );
});

test("7. snapshot deeply immutable", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.projectedViewportBounds), true);
});

test("8. snapshot serializable", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  assert.equal(typeof JSON.stringify(snapshot), "string");
});

test("9. raw map reference rejected", () => {
  const { provider } = createHarness({
    snapshotFactory: () => ({
      map: createFakeMap()
    })
  });
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => error.reasonCode === "RAW_REFERENCE_DETECTED"
  );
});

test("10. raw Canvas/pane reference rejected", () => {
  const { provider } = createHarness({
    snapshotFactory: () => ({
      canvas: { nodeName: "CANVAS" },
      pane: { id: "pane" }
    })
  });
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => error.reasonCode === "RAW_REFERENCE_DETECTED"
  );
});

test("11. raw listener/callback reference rejected", () => {
  const { provider } = createHarness({
    snapshotFactory: () => ({
      callbacks: [() => {}]
    })
  });
  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => error.reasonCode === "RAW_REFERENCE_DETECTED"
  );
});

test("11a. exact raw-reference field path is reported for unsupported scalar payload values", () => {
  const { provider } = createHarness({
    snapshotFactory: (state, args) => ({
      viewportSize: args.map.getSize(),
      pixelRatio: 2,
      zoom: args.map.getZoom(),
      center: args.map.getCenter(),
      pixelOrigin: args.map.getPixelOrigin(),
      projectedViewportBounds: args.map.getBounds(),
      canvasLayerPosition: new FakePoint(12, 18),
      scalarPayload: {
        unsupportedField: new UnsupportedRawReference("bad-ref")
      }
    })
  });

  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => {
      assert.equal(error.reasonCode, "RAW_REFERENCE_DETECTED");
      assert.equal(
        error.rawReferenceFieldPath,
        "rawSnapshot.scalarPayload.unsupportedField"
      );
      assert.equal(error.rawReferenceType, "object");
      assert.equal(
        error.rawReferenceConstructorName,
        "UnsupportedRawReference"
      );
      return true;
    }
  );

  const status = getPersistentAtlasFrameSnapshotStatus(provider);
  assert.equal(status.rawReferenceDetected, true);
  assert.equal(
    status.rawReferenceFieldPath,
    "rawSnapshot.scalarPayload.unsupportedField"
  );
  assert.equal(status.rawReferenceType, "object");
  assert.equal(
    status.rawReferenceConstructorName,
    "UnsupportedRawReference"
  );
});

test("11b. unsupported top-level snapshot helper still fails closed with exact field path", () => {
  const { provider } = createHarness({
    snapshotFactory: (state, args) => ({
      viewportSize: args.map.getSize(),
      pixelRatio: 2,
      zoom: args.map.getZoom(),
      projectedViewportBounds: args.map.getBounds(),
      northWestCoordinate: { latitude: -38.2, longitude: 144.5 },
      canvasLayerPosition: new FakePoint(12, 18),
      contains() {
        return true;
      },
      getNorthWest() {
        return { lat: -38.2, lng: 144.5 };
      },
      getCenter() {
        return { lat: -38.15, lng: 144.6 };
      },
      clone() {
        return {};
      }
    })
  });

  assert.throws(
    () =>
      createPersistentAtlasFrameSnapshot(provider, {
        redrawReason: "initial_attach"
      }),
    (error) => {
      assert.equal(error.reasonCode, "RAW_REFERENCE_DETECTED");
      assert.equal(error.rawReferenceFieldPath, "rawSnapshot.clone");
      assert.equal(error.rawReferenceType, "function");
      assert.equal(error.rawReferenceConstructorName, "clone");
      return true;
    }
  );
});

test("12. Leaflet-shaped points normalized to scalars", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  assert.equal(snapshot.pixelOriginX, 100);
  assert.equal(snapshot.pixelOriginY, 200);
  assert.deepEqual(snapshot.projectedViewportBounds, {
    northWestLatitude: -38.2,
    northWestLongitude: 144.5,
    southEastLatitude: -38.1,
    southEastLongitude: 144.7
  });
});

test("13. viewport scalars preserved", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  assert.equal(snapshot.viewportWidth, 640);
  assert.equal(snapshot.viewportHeight, 360);
  assert.equal(snapshot.pixelRatio, 2);
  assert.equal(snapshot.zoom, 14);
  assert.equal(snapshot.centerLatitude, -38.15);
  assert.equal(snapshot.centerLongitude, 144.6);
});

test("14. identity fields complete", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  for (const key of [
    "snapshotId",
    "snapshotGenerationId",
    "sessionId",
    "mapIdentityId",
    "lifecycleOwnerId",
    "lifecycleGenerationId",
    "surfaceOwnerId",
    "regionId",
    "packageId",
    "packageVersion",
    "packageFingerprint",
    "recipeId",
    "recipeVersion",
    "selectorSeed",
    "redrawReason",
    "snapshotCreatedAt"
  ]) {
    assert.notEqual(snapshot[key], null);
  }
});

test("15. unchanged identity validates", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const validated = validatePersistentAtlasFrameSnapshot(provider, snapshot);
  assert.equal(validated.snapshotId, snapshot.snapshotId);
});

test("16. map mismatch rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.mapIdentityId = "MAP_B";
  state.identity = createIdentity({ mapIdentityId: "MAP_B" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "MAP_IDENTITY_MISMATCH"
  );
});

test("17. session mismatch rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.identity = createIdentity({ sessionId: "SESSION_B" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "SESSION_IDENTITY_MISMATCH"
  );
});

test("18. lifecycle owner mismatch rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.lifecycleIdentity = createLifecycleIdentity({
    lifecycleOwnerId: "LIFECYCLE_OWNER_B"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "LIFECYCLE_OWNER_MISMATCH"
  );
});

test("19. lifecycle generation mismatch rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.lifecycleIdentity = createLifecycleIdentity({
    lifecycleGenerationId: "GEN_B"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "LIFECYCLE_GENERATION_MISMATCH"
  );
});

test("20. surface owner mismatch rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.lifecycleIdentity = createLifecycleIdentity({
    surfaceOwnerId: "SURFACE_OWNER_B"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "SURFACE_OWNER_MISMATCH"
  );
});

test("21. package fingerprint drift rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.identity = createIdentity({ packageFingerprint: "fingerprint-b" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "PACKAGE_IDENTITY_MISMATCH"
  );
});

test("22. recipe drift rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.identity = createIdentity({ recipeVersion: "recipe-v002" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "RECIPE_IDENTITY_MISMATCH"
  );
});

test("23. selector-seed drift rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.identity = createIdentity({ selectorSeed: "seed-b" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "SELECTOR_SEED_MISMATCH"
  );
});

test("24. readiness blocked rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.readiness = createReadiness({
    diagnosticStatus: "blocked",
    reasonCode: "READINESS_BLOCKED"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "READINESS_BLOCKED"
  );
});

test("25. readiness drift rejected", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  state.readiness = createReadiness({ packageFingerprint: "fingerprint-b" });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "READINESS_DRIFT_DETECTED"
  );
});

test("26. stale snapshot generation rejected", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const stale = Object.freeze({
    ...snapshot,
    snapshotGenerationId: "SNAPSHOT_GENERATION_999"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, stale),
    (error) => error.reasonCode === "SNAPSHOT_GENERATION_MISMATCH"
  );
});

test("27. snapshot reuse across redraw generation rejected", () => {
  const { provider } = createHarness();
  const first = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "moveend"
  });
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, first),
    (error) => error.reasonCode === "SNAPSHOT_REUSE_DETECTED"
  );
});

test("28. released snapshot rejected", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  releasePersistentAtlasFrameSnapshot(provider, snapshot);
  assert.throws(
    () => validatePersistentAtlasFrameSnapshot(provider, snapshot),
    (error) => error.reasonCode === "SNAPSHOT_ALREADY_RELEASED"
  );
});

test("29. release provider called", () => {
  const { provider, state } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const result = releasePersistentAtlasFrameSnapshot(provider, snapshot);
  assert.equal(result.released, true);
  assert.equal(state.releaseCalls, 1);
});

test("30. repeated release harmless", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const first = releasePersistentAtlasFrameSnapshot(provider, snapshot);
  const second = releasePersistentAtlasFrameSnapshot(provider, snapshot);
  assert.equal(first.released, true);
  assert.equal(second.released, true);
});

test("31. status immutable and serializable", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasFrameSnapshotStatus(provider);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("32. no raw references exposed", () => {
  const { provider } = createHarness();
  createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });
  const status = getPersistentAtlasFrameSnapshotStatus(provider);
  assert.equal("snapshot" in status, false);
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
});

test("33. no window/document/global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\./);
  assert.doesNotMatch(source, /\bdocument\./);
  assert.doesNotMatch(source, /\bglobalThis\b(?!["'])/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
});

test("34. no retained surface or lifecycle cleanup", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /releasePersistentAtlasLifecycleOwner/);
  assert.doesNotMatch(source, /releasePersistentAtlasRetainedSurface/);
});

test("35. no draw invocation", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /drawCustom25DMapCanvasWithFrameSnapshot/);
  assert.doesNotMatch(source, /createAtlasRenderer/i);
});

test("36. no scheduler\/listener\/controller connection", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /\.on\(/);
  assert.doesNotMatch(source, /createControlledPersistentAtlasController/);
});

test("37. no live rendering or startup behavior", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.match(appSource, /developer-only-persistent-atlas-frame-snapshot-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-frame-snapshot-provider/);
});

test("38. all four canonical safety flags remain false", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasFrameSnapshotStatus(provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("39. one-frame viewport snapshot contract normalizes into persistent scalars", () => {
  const normalized = normalizePersistentAtlasFrameSnapshotForContract({
    rawSnapshot: {
      logicalWidth: 640,
      logicalHeight: 360,
      backingWidth: 1280,
      backingHeight: 720,
      devicePixelRatio: 2,
      bounds: { north: -38.1, south: -38.2, east: 144.7, west: 144.5 },
      northWestCoordinate: { latitude: -38.1, longitude: 144.5 },
      canvasLayerPosition: { x: 12, y: 18 },
      zoom: 14
    },
    map: createFakeMap(),
    identity: createIdentity(),
    lifecycleIdentity: createLifecycleIdentity(),
    redrawReason: "initial_attach",
    snapshotId: "SNAP_001",
    snapshotGenerationId: "SNAP_GEN_001",
    snapshotCreatedAt: "2026-08-06T12:00:00.000Z"
  });

  assert.equal(normalized.viewportWidth, 640);
  assert.equal(normalized.viewportHeight, 360);
  assert.equal(normalized.pixelRatio, 2);
  assert.equal(normalized.canvasLayerPositionX, 12);
  assert.equal(normalized.canvasLayerPositionY, 18);
  assert.equal(normalized.projectedViewportBounds.northWestLatitude, -38.1);
  assert.equal(normalized.projectedViewportBounds.southEastLongitude, 144.7);
});

test("39a. real one-frame helper methods do not survive persistent normalization", () => {
  const normalized = normalizePersistentAtlasFrameSnapshotForContract({
    rawSnapshot: {
      logicalWidth: 640,
      logicalHeight: 360,
      backingWidth: 1280,
      backingHeight: 720,
      devicePixelRatio: 2,
      bounds: { north: -38.1, south: -38.2, east: 144.7, west: 144.5 },
      northWestCoordinate: { latitude: -38.1, longitude: 144.5 },
      canvasLayerPosition: { x: 12, y: 18 },
      zoom: 14,
      contains() {
        return true;
      },
      getNorthWest() {
        return { lat: -38.1, lng: 144.5 };
      },
      getCenter() {
        return { lat: -38.15, lng: 144.6 };
      }
    },
    map: createFakeMap(),
    identity: createIdentity(),
    lifecycleIdentity: createLifecycleIdentity(),
    redrawReason: "initial_attach",
    snapshotId: "SNAP_002",
    snapshotGenerationId: "SNAP_GEN_002",
    snapshotCreatedAt: "2026-08-06T12:00:00.000Z"
  });

  assert.equal(normalized.snapshotId, "SNAP_002");
  assert.equal(normalized.snapshotGenerationId, "SNAP_GEN_002");
  assert.equal("contains" in normalized, false);
  assert.equal("getNorthWest" in normalized, false);
  assert.equal("getCenter" in normalized, false);
  assert.equal(normalized.projectedViewportBounds.northWestLatitude, -38.1);
  assert.equal(normalized.projectedViewportBounds.northWestLongitude, 144.5);
  assert.equal(typeof JSON.stringify(normalized), "string");
});

test("39aa. already-normalized projected viewport bounds survive provider normalization", () => {
  const normalized = normalizePersistentAtlasFrameSnapshotForContract({
    rawSnapshot: {
      logicalWidth: 640,
      logicalHeight: 360,
      backingWidth: 1280,
      backingHeight: 720,
      devicePixelRatio: 2,
      bounds: { north: -38.1, south: -38.2, east: 144.7, west: 144.5 },
      northWestCoordinate: { latitude: -38.1, longitude: 144.5 },
      canvasLayerPosition: { x: 12, y: 18 },
      zoom: 14
    },
    map: createFakeMap(),
    identity: createIdentity(),
    lifecycleIdentity: createLifecycleIdentity(),
    redrawReason: "initial_attach",
    snapshotId: "SNAP_002A",
    snapshotGenerationId: "SNAP_GEN_002A",
    snapshotCreatedAt: "2026-08-06T12:00:00.000Z"
  });

  const renormalized = normalizePersistentAtlasFrameSnapshotForContract({
    rawSnapshot: normalized,
    map: createFakeMap(),
    identity: createIdentity(),
    lifecycleIdentity: createLifecycleIdentity(),
    redrawReason: "follow_up_redraw",
    snapshotId: "SNAP_002B",
    snapshotGenerationId: "SNAP_GEN_002B",
    snapshotCreatedAt: "2026-08-06T12:00:01.000Z"
  });

  assert.deepEqual(renormalized.projectedViewportBounds, {
    northWestLatitude: -38.1,
    northWestLongitude: 144.5,
    southEastLatitude: -38.2,
    southEastLongitude: 144.7
  });
});

test("39b. successful persistent snapshot contains no functions or custom class instances", () => {
  const { provider } = createHarness();
  const snapshot = createPersistentAtlasFrameSnapshot(provider, {
    redrawReason: "initial_attach"
  });

  const seen = new WeakSet();
  function walk(value) {
    if (!value || typeof value !== "object") {
      assert.notEqual(typeof value, "function");
      return;
    }
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    const proto = Object.getPrototypeOf(value);
    assert.ok(
      proto === Object.prototype || proto === null,
      `unexpected prototype: ${proto?.constructor?.name ?? "null"}`
    );
    for (const nested of Object.values(value)) {
      assert.notEqual(typeof nested, "function");
      walk(nested);
    }
  }

  walk(snapshot);
});

test("40. persistent normalized snapshot converts back to one-frame draw contract", () => {
  const snapshot = createPersistentAtlasFrameSnapshot(createHarness().provider, {
    redrawReason: "initial_attach"
  });
  const frameViewportSnapshot = toOneFrameViewportSnapshotContract(snapshot);

  assert.equal(frameViewportSnapshot.logicalWidth, 640);
  assert.equal(frameViewportSnapshot.logicalHeight, 360);
  assert.equal(frameViewportSnapshot.backingWidth, 1280);
  assert.equal(frameViewportSnapshot.devicePixelRatio, 2);
  assert.deepEqual(frameViewportSnapshot.canvasLayerPosition, { x: 12, y: 18 });
  assert.deepEqual(frameViewportSnapshot.bounds, {
    north: -38.1,
    south: -38.2,
    east: 144.7,
    west: 144.5
  });
});

test("41. trace recorder captures normalization and draw-contract bounds stages", () => {
  const traceEntries = [];
  const normalized = normalizePersistentAtlasFrameSnapshotForContract({
    rawSnapshot: {
      logicalWidth: 640,
      logicalHeight: 360,
      devicePixelRatio: 2,
      bounds: { north: -38.1, south: -38.2, east: 144.7, west: 144.5 },
      canvasLayerPosition: { x: 12, y: 18 },
      zoom: 14
    },
    map: createFakeMap(),
    identity: createIdentity(),
    lifecycleIdentity: createLifecycleIdentity(),
    redrawReason: "initial_attach",
    snapshotId: "SNAP_TRACE_001",
    snapshotGenerationId: "SNAP_GEN_TRACE_001",
    snapshotCreatedAt: "2026-08-06T12:00:00.000Z",
    traceRecorder(entry) {
      traceEntries.push(JSON.parse(JSON.stringify(entry)));
    }
  });

  toOneFrameViewportSnapshotContract(normalized, {
    traceRecorder(entry) {
      traceEntries.push(JSON.parse(JSON.stringify(entry)));
    }
  });

  assert.deepEqual(
    traceEntries.map((entry) => entry.stage),
    [
      "persistent_normalization_input",
      "persistent_normalization_output",
      "draw_contract_conversion_input",
      "draw_contract_conversion_output",
      "bounds_validation"
    ]
  );
  assert.equal(traceEntries[0].north, -38.1);
  assert.equal(traceEntries[1].northWestLatitude, -38.1);
  assert.equal(traceEntries[3].west, 144.5);
  assert.equal(traceEntries[4].boundsValidationPassed, true);
});

test("42. trace recorder captures invalid bounds without changing behavior", () => {
  const traceEntries = [];
  const invalidSnapshot = Object.freeze({
    schemaId: "GROWGO_PERSISTENT_ATLAS_FRAME_SNAPSHOT_001",
    snapshotId: "SNAP_INVALID_001",
    snapshotGenerationId: "SNAP_GEN_INVALID_001",
    viewportWidth: 640,
    viewportHeight: 360,
    pixelRatio: 2,
    zoom: 14,
    canvasLayerPositionX: 12,
    canvasLayerPositionY: 18,
    projectedViewportBounds: Object.freeze({
      northWestLongitude: 144.5,
      southEastLatitude: -38.2,
      southEastLongitude: 144.7
    })
  });

  const frameViewportSnapshot = toOneFrameViewportSnapshotContract(
    invalidSnapshot,
    {
      traceRecorder(entry) {
        traceEntries.push(JSON.parse(JSON.stringify(entry)));
      }
    }
  );

  assert.equal(
    frameViewportSnapshot.schemaId,
    "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001"
  );
  assert.equal(traceEntries.at(-1).stage, "bounds_validation");
  assert.equal(traceEntries.at(-1).boundsValidationPassed, false);
  assert.equal(
    traceEntries.at(-1).boundsFailureReason,
    "FRAME_VIEWPORT_SNAPSHOT_BOUNDS_INVALID"
  );
});
