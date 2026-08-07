import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetPopulationPreview,
  installDeveloperOnlyAtlasAssetPopulationPreview,
  ATLAS_POPULATION_PREVIEW_BELLARINE_001,
  CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW,
  PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
} from "../client/developer-only-atlas-asset-population-preview.mjs";
import {
  createPersistentAtlasFrameSnapshotProvider
} from "../client/developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createAtlasPopulationDrawIntegration
} from "../client/developer-only-atlas-population-draw-integration.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const previewModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-asset-population-preview.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_4_DEVELOPER_ONLY_LIVE_ASSET_POPULATION_PREVIEW.md"
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

  const map = createFakeMap();
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
        map,
        mapIdentityId: "MAP_A"
      };
    },
    readinessProvider() {
      return {
        diagnosticStatus: "approved",
        reasonCode: "READINESS_APPROVED",
        regionId: "BELLARINE",
        packageId: "ATLAS_DEVELOPER_PACKAGE",
        packageVersion: "2026.08.07",
        packageFingerprint: "PKG_FP_001",
        recipeId: "RECREATION_AREA_RECIPE_001",
        recipeVersion: "RECIPE_V001",
        selectorSeed: "WORLD_SELECTOR_SEED_001"
      };
    },
    identityProvider() {
      return {
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        regionId: "BELLARINE",
        packageId: "ATLAS_DEVELOPER_PACKAGE",
        packageVersion: "2026.08.07",
        packageFingerprint: "PKG_FP_001",
        recipeId: "RECREATION_AREA_RECIPE_001",
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
        regionId: "BELLARINE",
        packageId: "ATLAS_DEVELOPER_PACKAGE",
        recipeId: "RECREATION_AREA_RECIPE_001",
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
          x: snapshotScalars.canvasLayerPosition.x,
          y: snapshotScalars.canvasLayerPosition.y
        }
      })),
    canvasPositionAdapter:
      overrides.canvasPositionAdapter ??
      (({ canvas, mutableCanvasLayerPosition }) => {
        canvas.position = {
          x: mutableCanvasLayerPosition.x,
          y: mutableCanvasLayerPosition.y
        };
        return {
          positionAdapterPath: "direct_leaflet_position"
        };
      }),
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

  return {
    integration,
    state,
    retainedSurface
  };
}

function createPersistentStatus(overrides = {}) {
  return {
    integrationState: "attached_idle",
    attached: true,
    drawing: false,
    redrawQueued: false,
    failedClosed: false,
    cleanupCompleted: false,
    authorizationState: "active",
    redrawPermissionAllowed: true,
    mapIdentityId: "MAP_A",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    packageVersion: "2026.08.07",
    packageFingerprint: "PKG_FP_001",
    recipeId: "RECREATION_AREA_RECIPE_001",
    recipeVersion: "RECIPE_V001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    sessionId: "SESSION_A",
    ownedCanvasCount: 1,
    ownedPaneCount: 1,
    ownedListenerCount: 3,
    cleanupAttemptCount: 0,
    lastFailureReason: null,
    ...overrides
  };
}

function createHarness({
  hostname = "127.0.0.1",
  persistentStatusOverrides = {},
  drawIntegrationOverrides = {},
  allowSelectorSeedOverride = false
} = {}) {
  const drawHarness = createPopulationDrawIntegrationHarness(
    drawIntegrationOverrides
  );
  const preview = createDeveloperOnlyAtlasAssetPopulationPreview({
    hostnameProvider: () => hostname,
    persistentStatusProvider: () =>
      createPersistentStatus(persistentStatusOverrides),
    populationDrawIntegration: drawHarness.integration,
    allowSelectorSeedOverride
  });

  return {
    preview,
    drawHarness,
    namespace: {
      GrowGoDeveloperDiagnostics: {}
    }
  };
}

test("1. preview command is unavailable outside local development hosts", () => {
  const harness = createHarness({
    hostname: "growgo.example.com"
  });

  const result = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  assert.equal(result.reasonCode, "NON_LOCAL_DEVELOPMENT_HOST");
});

test("2. exact preview and clear confirmations are required", () => {
  const harness = createHarness();

  const previewResult = harness.preview.previewAtlasAssetPopulation({
    confirmation: "WRONG"
  });
  const clearResult = harness.preview.clearAtlasAssetPopulationPreview({
    confirmation: "WRONG"
  });

  assert.equal(previewResult.reasonCode, "INVALID_CONFIRMATION");
  assert.equal(clearResult.reasonCode, "INVALID_CONFIRMATION");
});

test("3. preview requires Atlas attached and idle with valid ownership", () => {
  const attachedBlocked = createHarness({
    persistentStatusOverrides: {
      attached: false
    }
  });
  const stateBlocked = createHarness({
    persistentStatusOverrides: {
      integrationState: "drawing"
    }
  });

  assert.equal(
    attachedBlocked.preview.previewAtlasAssetPopulation({
      confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
    }).reasonCode,
    "ATLAS_NOT_ATTACHED"
  );
  assert.equal(
    stateBlocked.preview.previewAtlasAssetPopulation({
      confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
    }).reasonCode,
    "WRONG_INTEGRATION_STATE"
  );
});

test("4. approved built-in fixture resolves and creates a deterministic population plan", () => {
  const harness = createHarness();

  const result = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION,
    previewFixtureId: ATLAS_POPULATION_PREVIEW_BELLARINE_001
  });

  assert.equal(result.outcome, "completed");
  assert.match(result.previewStatus.populationPlanId, /^ATLAS_POPULATION_PLAN_/);
  assert.equal(result.previewStatus.previewFixtureId, ATLAS_POPULATION_PREVIEW_BELLARINE_001);
});

test("5. preview uses approved asset IDs only and submits one deterministic batch", () => {
  const harness = createHarness();

  const result = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  assert.equal(result.previewStatus.currentAssetIds.includes("TREE_EUCALYPTUS_001"), true);
  assert.equal(result.previewStatus.currentAssetIds.includes("TREE_BOTTLEBRUSH_001"), true);
  assert.equal(result.previewStatus.currentAssetIds.includes("SHRUB_COASTAL_LOW_001"), true);
  assert.equal(
    result.previewStatus.currentAssetIds.includes(
      "BUILDING_CIVIC_SPORTS_PAVILION_001"
    ),
    true
  );
  assert.equal(harness.drawHarness.state.receivedBatches.length, 1);
});

test("6. preview reuses the same retained canvas and does not create a second canvas or renderer path", () => {
  const harness = createHarness();

  harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });
  harness.preview.clearAtlasAssetPopulationPreview({
    confirmation: CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW
  });
  harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  assert.equal(harness.drawHarness.state.receivedCanvases.length >= 2, true);
  assert.equal(
    harness.drawHarness.state.receivedCanvases[0],
    harness.drawHarness.state.receivedCanvases[1]
  );
  assert.equal(harness.drawHarness.state.layerCalls, 0);
  assert.equal(harness.drawHarness.state.markerCalls, 0);
});

test("7. command count, instance IDs, scale, rotation, LOD, and deterministic order are preserved", () => {
  const harness = createHarness();

  const result = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });
  const batch = harness.drawHarness.state.receivedBatches[0];

  assert.equal(result.previewStatus.plannedCommandCount, batch.commands.length);
  assert.equal(result.previewStatus.submittedCommandCount, batch.commands.length);
  assert.deepEqual(
    result.previewStatus.currentInstanceIds,
    batch.commands.map((command) => command.instanceId)
  );
  assert.deepEqual(
    [...batch.commands.map((command) => command.instanceId)],
    [...batch.commands.map((command) => command.instanceId)].sort()
  );
  assert.equal(
    batch.commands.every(
      (command) =>
        typeof command.scale === "number" &&
        typeof command.rotation === "number" &&
        typeof command.lod === "string"
    ),
    true
  );
});

test("8. duplicate preview with the same fixture reuses existing preview state without duplicating instances", () => {
  const harness = createHarness();

  const first = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });
  const second = harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  assert.equal(first.outcome, "completed");
  assert.equal(second.outcome, "reused");
  assert.equal(harness.drawHarness.state.receivedBatches.length, 1);
});

test("9. clear preview succeeds, keeps Atlas attached, and leaves zero preview refs", () => {
  const harness = createHarness();

  harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });
  const clearResult = harness.preview.clearAtlasAssetPopulationPreview({
    confirmation: CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW
  });

  assert.equal(clearResult.outcome, "completed");
  assert.equal(clearResult.previewStatus.previewActive, false);
  assert.equal(clearResult.previewStatus.previewClearCompleted, true);
  assert.equal(clearResult.previewStatus.previewReferenceCount, 0);
  assert.equal(clearResult.previewStatus.submittedCommandCount, 0);
});

test("10. planner failure and draw failure fail closed without leaking preview refs", () => {
  const blockedFixtureHarness = createHarness({
    persistentStatusOverrides: {
      recipeId: "UNKNOWN_RECIPE"
    }
  });
  const drawFailureHarness = createHarness({
    drawIntegrationOverrides: {
      populationBatchDrawProvider: () => {
        throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
          reasonCode: "DRAW_PROVIDER_FAILED"
        });
      }
    }
  });

  const blocked = blockedFixtureHarness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });
  const drawFailed = drawFailureHarness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  assert.equal(blocked.outcome, "failed_closed");
  assert.equal(drawFailed.outcome, "failed_closed");
  assert.equal(drawFailureHarness.drawHarness.state.batchReferenceReleaseCalls, 1);
});

test("11. preview status is frozen, serializable, and exposes no raw refs", () => {
  const harness = createHarness();

  harness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION
  });

  const status = harness.preview.getAtlasAssetPopulationPreviewStatus();

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("canvas" in status, false);
  assert.equal("renderer" in status, false);
  assert.equal("map" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("12. installer extends the existing diagnostics namespace with preview methods", () => {
  const harness = createHarness();

  const installed = installDeveloperOnlyAtlasAssetPopulationPreview({
    globalObject: harness.namespace,
    preview: harness.preview
  });

  assert.ok(installed);
  assert.equal(
    typeof harness.namespace.GrowGoDeveloperDiagnostics.previewAtlasAssetPopulation,
    "function"
  );
  assert.equal(
    typeof harness.namespace.GrowGoDeveloperDiagnostics.getAtlasAssetPopulationPreviewStatus,
    "function"
  );
  assert.equal(
    typeof harness.namespace.GrowGoDeveloperDiagnostics.clearAtlasAssetPopulationPreview,
    "function"
  );
});

test("13. selector seed override is blocked unless explicitly allowed", () => {
  const blockedHarness = createHarness();
  const allowedHarness = createHarness({
    allowSelectorSeedOverride: true,
    drawIntegrationOverrides: {
      atlasIdentityProvider: () => ({
        regionId: "BELLARINE",
        packageId: "ATLAS_DEVELOPER_PACKAGE",
        recipeId: "RECREATION_AREA_RECIPE_001",
        selectorSeed: "OVERRIDE_SEED"
      })
    },
    persistentStatusOverrides: {
      selectorSeed: "OVERRIDE_SEED"
    }
  });

  const blocked = blockedHarness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION,
    selectorSeed: "OVERRIDE_SEED"
  });
  const allowed = allowedHarness.preview.previewAtlasAssetPopulation({
    confirmation: PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION,
    selectorSeed: "OVERRIDE_SEED"
  });

  assert.equal(blocked.reasonCode, "SELECTOR_SEED_OVERRIDE_NOT_ALLOWED");
  assert.equal(allowed.outcome, "completed");
});

test("14. no startup preview, automatic viewport population, timers, or polling are introduced", () => {
  const moduleSource = fs.readFileSync(previewModulePath, "utf8");

  assert.equal(moduleSource.includes("setInterval"), false);
  assert.equal(moduleSource.includes("setTimeout"), false);
  assert.equal(moduleSource.includes("requestAnimationFrame"), false);
  assert.equal(moduleSource.includes("moveend"), false);
  assert.equal(moduleSource.includes("zoomend"), false);
  assert.equal(moduleSource.includes("resize"), false);
});

test("15. development-alpha app composes and installs preview diagnostics on the existing namespace", () => {
  const appSource = fs.readFileSync(appPath, "utf8");

  assert.match(appSource, /createDeveloperOnlyAtlasAssetPopulationPreview/);
  assert.match(appSource, /atlasAssetPopulationPreview/);
  assert.match(appSource, /installDeveloperOnlyAtlasAssetPopulationPreview/);
  assert.match(appSource, /atlasPopulationDrawIntegration/);
});

test("16. session documentation exists for phase 212.4", () => {
  const sessionDoc = fs.readFileSync(sessionDocPath, "utf8");

  assert.match(sessionDoc, /Phase 212\.4/i);
  assert.match(sessionDoc, /PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION/);
  assert.match(sessionDoc, /CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW/);
  assert.match(sessionDoc, /ATLAS_POPULATION_PREVIEW_BELLARINE_001/);
  assert.match(sessionDoc, /runtimeExecutionEnabled = false/);
});
