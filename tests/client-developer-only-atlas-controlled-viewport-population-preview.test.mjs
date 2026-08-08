import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasControlledViewportPopulationPreview,
  installDeveloperOnlyAtlasControlledViewportPopulationPreview,
  PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION,
  CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW
} from "../client/developer-only-atlas-controlled-viewport-population-preview.mjs";
import {
  createDeveloperOnlyAtlasLiveFeatureInputAdapter
} from "../client/developer-only-atlas-live-feature-input-adapter.mjs";
import {
  createPersistentAtlasFrameSnapshotProvider
} from "../client/developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createAtlasPopulationDrawIntegration
} from "../client/developer-only-atlas-population-draw-integration.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-controlled-viewport-population-preview.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_6_LIVE_FEATURE_INPUT_CONTROLLED_VIEWPORT_POPULATION.md"
);

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

function createPersistentStatus(overrides = {}) {
  return {
    integrationState: "attached_idle",
    attached: true,
    drawing: false,
    redrawQueued: false,
    redrawPermissionAllowed: true,
    cleanupCompleted: false,
    cleanupInProgress: false,
    failedClosed: false,
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    retainedSurfaceState: "ready",
    ownedCanvasCount: 1,
    ownedPaneCount: 1,
    ownedListenerCount: 3,
    ...overrides
  };
}

function createFeatureSource() {
  return {
    schemaId: "GROWGO_CUSTOM25D_CURRENT_VIEWPORT_FEATURE_SOURCE_001",
    zoneFeatures: [
      {
        id: "zone-park-001",
        zoneType: "park",
        coords: [
          [-38.12, 144.612],
          [-38.12, 144.613],
          [-38.121, 144.613],
          [-38.121, 144.612]
        ],
        closed: true,
        leisure: "park",
        landuse: null,
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-green-001",
        zoneType: "grass",
        coords: [
          [-38.123, 144.621],
          [-38.123, 144.622],
          [-38.124, 144.622],
          [-38.124, 144.621]
        ],
        closed: true,
        leisure: null,
        landuse: "grass",
        natural: null,
        waterway: null,
        boundary: null
      }
    ],
    buildingFeatures: [
      {
        id: "building-civic-001",
        coords: [
          [-38.122, 144.618],
          [-38.122, 144.6185],
          [-38.1226, 144.6185],
          [-38.1226, 144.618]
        ],
        center: { latitude: -38.1223, longitude: 144.6182 },
        buildingType: "civic",
        shopTag: null,
        amenity: "library",
        office: null,
        cuisine: null,
        tourism: null,
        leisure: null,
        landuse: null,
        buildingArea: 140,
        nearCoast: false
      }
    ],
    roadWays: [
      {
        id: "road-001",
        highway: "residential",
        coords: [
          [-38.1232, 144.6212],
          [-38.1238, 144.6218]
        ]
      }
    ]
  };
}

function createLiveAdapter() {
  return createDeveloperOnlyAtlasLiveFeatureInputAdapter({
    featureSourceProvider: () => createFeatureSource(),
    viewportProvider: () => ({
      viewportIdentity: "ATLAS_LIVE_VIEWPORT_ABC123",
      mapIdentityId: "MAP_A",
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "WORLD_SELECTOR_SEED_001",
      zoom: 16,
      bounds: {
        north: -38.11,
        south: -38.14,
        east: 144.63,
        west: 144.61
      }
    }),
    identityProvider: () => ({
      mapIdentityId: "MAP_A",
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "WORLD_SELECTOR_SEED_001"
    })
  });
}

function createPopulationDrawIntegrationHarness(overrides = {}) {
  const state = {
    snapshotCreateCalls: 0,
    snapshotReleaseCalls: 0,
    drawCalls: 0,
    drawStateReleaseCalls: 0,
    batchReferenceReleaseCalls: 0,
    retainedSurfaceResolveCalls: 0,
    receivedBatches: [],
    receivedCanvases: [],
    markerCalls: 0,
    layerCalls: 0,
    rendererCalls: 0
  };

  const map = {
    getSize() {
      return new FakePoint(640, 360);
    },
    getBounds() {
      return new FakeBounds(
        new FakeLatLng(-38.14, 144.61),
        new FakeLatLng(-38.11, 144.63)
      );
    },
    getCenter() {
      return new FakeLatLng(-38.125, 144.62);
    },
    getPixelOrigin() {
      return new FakePoint(100, 200);
    },
    getZoom() {
      return 16;
    }
  };

  const retainedSurface = {
    canvas: {
      id: "canvas-a",
      style: {},
      width: 640,
      height: 360
    },
    pane: {
      id: "pane-a"
    }
  };

  const snapshotProvider = createPersistentAtlasFrameSnapshotProvider({
    oneFrameSnapshotProvider(args) {
      state.snapshotCreateCalls += 1;
      return {
        viewportSize: args.map.getSize(),
        pixelRatio: 2,
        zoom: args.map.getZoom(),
        center: args.map.getCenter(),
        pixelOrigin: args.map.getPixelOrigin(),
        projectedViewportBounds: args.map.getBounds(),
        northWestCoordinate: { latitude: -38.14, longitude: 144.61 },
        canvasLayerPosition: new FakePoint(12, 18),
        contains() {
          return true;
        },
        getNorthWest() {
          return { lat: -38.14, lng: 144.61 };
        },
        getCenter() {
          return { lat: -38.125, lng: 144.62 };
        },
        scalarPayload: {
          viewportLabel: "atlas-live"
        }
      };
    },
    mapProvider() {
      return {
        map,
        mapIdentityId: "MAP_A"
      };
    },
    readinessProvider() {
      return {
        diagnosticStatus: "approved",
        reasonCode: "READINESS_APPROVED",
        regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
        packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
        packageVersion: "2026.08.07",
        packageFingerprint: "PKG_FP_001",
        recipeId: "COASTAL_LOCATION_RECIPE_001",
        recipeVersion: "RECIPE_V001",
        selectorSeed: "WORLD_SELECTOR_SEED_001"
      };
    },
    identityProvider() {
      return {
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
        packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
        packageVersion: "2026.08.07",
        packageFingerprint: "PKG_FP_001",
        recipeId: "COASTAL_LOCATION_RECIPE_001",
        recipeVersion: "RECIPE_V001",
        selectorSeed: "WORLD_SELECTOR_SEED_001"
      };
    },
    lifecycleIdentityProvider() {
      return {
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      };
    },
    snapshotReleaseProvider() {
      state.snapshotReleaseCalls += 1;
      return { released: true };
    },
    timeProvider: () => "2026-08-07T12:00:00.000Z"
  });

  const integration = createAtlasPopulationDrawIntegration({
    snapshotProvider,
    atlasIdentityProvider:
      overrides.atlasIdentityProvider ??
      (() => ({
        regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
        packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
        recipeId: "COASTAL_LOCATION_RECIPE_001",
        selectorSeed: "WORLD_SELECTOR_SEED_001"
      })),
    retainedSurfaceResolver:
      overrides.retainedSurfaceResolver ??
      (() => {
        state.retainedSurfaceResolveCalls += 1;
        return retainedSurface;
      }),
    retainedSurfaceValidator:
      overrides.retainedSurfaceValidator ??
      (() => ({
        ok: true,
        canvasIdentityId: "CANVAS_A",
        paneIdentityId: "PANE_A",
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      })),
    lifecycleOwnerResolver:
      overrides.lifecycleOwnerResolver ??
      (() => ({
        id: "lifecycle-owner-a"
      })),
    lifecycleOwnerValidator:
      overrides.lifecycleOwnerValidator ??
      (() => ({
        ok: true,
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      })),
    authorizationResolver:
      overrides.authorizationResolver ??
      (() => ({
        id: "authorization-a"
      })),
    authorizationValidator:
      overrides.authorizationValidator ??
      (({ drawGenerationId, redrawReason }) => ({
        ok: true,
        authorized: true,
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        drawGenerationId,
        redrawReason
      })),
    populationBatchDrawProvider:
      overrides.populationBatchDrawProvider ??
      (({ populationBatch, canvas, mutableDrawState }) => {
        state.drawCalls += 1;
        state.rendererCalls += 1;
        state.receivedBatches.push(populationBatch);
        state.receivedCanvases.push(canvas);
        mutableDrawState.batchId = populationBatch.batchId;
        return {
          reasonCode: "POPULATION_DRAW_COMPLETED"
        };
      }),
    mutableDrawStateProvider:
      overrides.mutableDrawStateProvider ??
      (({ snapshotScalars, drawGenerationId, redrawReason }) => ({
        snapshotScalars,
        drawGenerationId,
        redrawReason,
        canvasLayerPosition: {
          x: Number(snapshotScalars?.canvasLayerPosition?.x ?? 0),
          y: Number(snapshotScalars?.canvasLayerPosition?.y ?? 0)
        }
      })),
    canvasPositionAdapter:
      overrides.canvasPositionAdapter ??
      (() => ({
        positionAdapterPath: "test_mutable_position"
      })),
    drawStateReleaseProvider:
      overrides.drawStateReleaseProvider ??
      (() => {
        state.drawStateReleaseCalls += 1;
      }),
    batchReferenceReleaseProvider:
      overrides.batchReferenceReleaseProvider ??
      (() => {
        state.batchReferenceReleaseCalls += 1;
      }),
    timeProvider: () => "2026-08-07T12:00:00.000Z"
  });

  return { integration, state, retainedSurface };
}

function createHarness(overrides = {}) {
  const drawHarness = createPopulationDrawIntegrationHarness(
    overrides.drawOverrides
  );
  const preview = createDeveloperOnlyAtlasControlledViewportPopulationPreview({
    hostnameProvider: () => "127.0.0.1",
    persistentStatusProvider:
      overrides.persistentStatusProvider ??
      (() => createPersistentStatus()),
    liveFeatureInputAdapter:
      overrides.liveFeatureInputAdapter ?? createLiveAdapter(),
    populationDrawIntegration: drawHarness.integration
  });

  return {
    preview,
    drawHarness
  };
}

test("successful live viewport preview records one deterministic batch and clear keeps atlas attached", () => {
  const harness = createHarness();

  const previewResult = harness.preview.previewAtlasCurrentViewportPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION
  });

  assert.equal(previewResult.outcome, "completed");
  assert.equal(previewResult.reasonCode, "PREVIEW_SUBMITTED");
  assert.equal(previewResult.previewStatus.previewActive, true);
  assert.equal(previewResult.previewStatus.drawCompleted, true);
  assert.equal(harness.drawHarness.state.drawCalls, 1);
  assert.equal(harness.drawHarness.state.retainedSurfaceResolveCalls, 1);
  assert.equal(harness.drawHarness.state.receivedBatches.length, 1);
  assert.equal(harness.drawHarness.state.markerCalls, 0);
  assert.equal(harness.drawHarness.state.layerCalls, 0);

  const clearResult =
    harness.preview.clearAtlasCurrentViewportPopulationPreview({
      confirmation: CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW
    });

  assert.equal(clearResult.outcome, "completed");
  assert.equal(clearResult.reasonCode, "PREVIEW_CLEARED");
  assert.equal(clearResult.previewStatus.previewActive, false);
  assert.equal(clearResult.previewStatus.previewReferenceCount, 0);
  assert.equal(harness.drawHarness.state.drawCalls, 2);
  assert.strictEqual(
    harness.drawHarness.state.receivedCanvases[0],
    harness.drawHarness.state.receivedCanvases[1]
  );
  assertCanonicalFlags(clearResult.canonicalSafetyFlags);
});

test("invalid confirmation and attached-state preconditions fail closed", () => {
  const invalid = createHarness();
  const invalidResult = invalid.preview.previewAtlasCurrentViewportPopulation({
    confirmation: "NOPE"
  });
  assert.equal(invalidResult.outcome, "blocked");
  assert.equal(invalidResult.reasonCode, "INVALID_CONFIRMATION");

  const notAttached = createHarness({
    persistentStatusProvider: () =>
      createPersistentStatus({
        attached: false
      })
  });
  const failed = notAttached.preview.previewAtlasCurrentViewportPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION
  });
  assert.equal(failed.outcome, "failed_closed");
  assert.equal(failed.reasonCode, "PERSISTENT_ATLAS_NOT_ATTACHED");
});

test("draw integration handoff works and no startup or automatic population occurs", () => {
  const harness = createHarness();
  const initialStatus =
    harness.preview.getAtlasCurrentViewportPopulationPreviewStatus();

  assert.equal(initialStatus.previewActive, false);
  assert.equal(harness.drawHarness.state.drawCalls, 0);
  assert.equal(harness.drawHarness.state.retainedSurfaceResolveCalls, 0);
  assert.equal(initialStatus.previewAvailable, true);
});

test("status and diagnostics are frozen, serializable, and install into the local namespace", () => {
  const harness = createHarness();
  harness.preview.previewAtlasCurrentViewportPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION
  });

  const status = harness.preview.getAtlasCurrentViewportPopulationPreviewStatus();
  const adapterStatus = harness.preview.getAtlasLiveFeatureInputAdapterStatus();

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(adapterStatus), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.stringify(adapterStatus));
  assert.equal("normalizedFeatures" in status, false);
  assert.equal("plannerFeatures" in status, false);

  const globalObject = { GrowGoDeveloperDiagnostics: {} };
  installDeveloperOnlyAtlasControlledViewportPopulationPreview({
    globalObject,
    preview: harness.preview
  });

  assert.equal(
    typeof globalObject.GrowGoDeveloperDiagnostics.previewAtlasCurrentViewportPopulation,
    "function"
  );
  assert.equal(
    typeof globalObject.GrowGoDeveloperDiagnostics.getAtlasCurrentViewportPopulationPreviewStatus,
    "function"
  );
  assert.equal(
    typeof globalObject.GrowGoDeveloperDiagnostics.getAtlasLiveFeatureInputAdapterStatus,
    "function"
  );
});

test("live feature adapter status refreshes from the current viewport feature source before preview draw", () => {
  const harness = createHarness();
  const adapterStatus = harness.preview.getAtlasLiveFeatureInputAdapterStatus();

  assert.equal(adapterStatus.sourceFeatureCount > 0, true);
  assert.equal(adapterStatus.normalizedFeatureCount > 0, true);
  assert.equal(adapterStatus.rejectedFeatureCount >= 0, true);
  assert.equal(adapterStatus.lastFailureReason, null);
  assertCanonicalFlags(adapterStatus.canonicalSafetyFlags);
});

test("module wiring, docs, and safety posture remain planning-safe and manual-only", () => {
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");
  const docSource = fs.readFileSync(sessionDocPath, "utf8");

  assert.doesNotMatch(moduleSource, /\bfetch\b|Overpass|marker|L\.marker/);
  assert.match(
    appSource,
    /createDeveloperOnlyAtlasControlledViewportPopulationPreview/
  );
  assert.match(
    appSource,
    /installDeveloperOnlyAtlasControlledViewportPopulationPreview/
  );
  assert.match(docSource, /PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION/);
  assert.match(docSource, /Manual Safari verification remains required/);
});
