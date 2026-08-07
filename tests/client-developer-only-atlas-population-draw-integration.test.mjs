import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasWorldPopulationPlan,
  createDeveloperOnlyAtlasWorldPopulationPlanner
} from "../client/developer-only-atlas-world-population-planner.mjs";
import {
  createPersistentAtlasFrameSnapshotProvider
} from "../client/developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createAtlasPopulationDrawIntegration,
  getAtlasPopulationDrawIntegrationStatus,
  submitAtlasPopulationPlanForDraw,
  validateAtlasPopulationPlanForDraw
} from "../client/developer-only-atlas-population-draw-integration.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-population-draw-integration.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_3_ATLAS_POPULATION_TO_DRAW_INTEGRATION.md"
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

function feature({
  featureId,
  featureClass,
  latitude,
  longitude,
  area = 180,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId
}) {
  return {
    featureId,
    featureClass,
    coordinate: {
      latitude,
      longitude
    },
    area,
    footprintScalars: {
      width,
      height
    },
    orientationHint,
    deterministicFeatureIdentity
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

function createValidPopulationPlan() {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  return createDeveloperOnlyAtlasWorldPopulationPlan(planner, {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "RECREATION_AREA_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    viewportId: "VIEWPORT_TILE_212_3",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [
      feature({
        featureId: "reserve-001",
        featureClass: "reserve",
        latitude: -38.1234,
        longitude: 144.6123,
        area: 240
      }),
      feature({
        featureId: "civic-001",
        featureClass: "civic_site",
        latitude: -38.1334,
        longitude: 144.6223,
        area: 420,
        width: 60,
        height: 30,
        orientationHint: 90
      })
    ]
  });
}

function cloneAsMutable(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness(overrides = {}) {
  const state = {
    snapshotCreateCalls: 0,
    snapshotReleaseCalls: 0,
    drawCalls: 0,
    drawStateReleaseCalls: 0,
    batchReferenceReleaseCalls: 0,
    retainedSurfaceResolveCalls: 0,
    lifecycleOwnerResolveCalls: 0,
    authorizationResolveCalls: 0,
    receivedBatches: [],
    receivedCanvases: [],
    receivedDrawGenerationIds: [],
    receivedRedrawReasons: [],
    secondRendererCalls: 0,
    layerCalls: 0,
    markerCalls: 0
  };

  const identity = {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "RECREATION_AREA_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001"
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
  const lifecycleOwner = {
    id: "lifecycle-owner-a"
  };
  const authorization = {
    id: "authorization-a"
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
      return {
        released: true
      };
    },
    timeProvider: (() => {
      const values = [
        "2026-08-07T12:00:00.000Z",
        "2026-08-07T12:00:00.010Z",
        "2026-08-07T12:00:00.020Z",
        "2026-08-07T12:00:00.030Z"
      ];
      let index = 0;
      return () => values[Math.min(index++, values.length - 1)];
    })()
  });

  const hasOverride = (key) =>
    Object.prototype.hasOwnProperty.call(overrides, key);

  const integration = createAtlasPopulationDrawIntegration({
    snapshotProvider: hasOverride("snapshotProvider")
      ? overrides.snapshotProvider
      : snapshotProvider,
    atlasIdentityProvider:
      overrides.atlasIdentityProvider ??
      (() => ({
        ...identity
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
      (() => {
        state.lifecycleOwnerResolveCalls += 1;
        return lifecycleOwner;
      }),
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
      (() => {
        state.authorizationResolveCalls += 1;
        return authorization;
      }),
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
      (({
        populationBatch,
        canvas,
        drawGenerationId,
        redrawReason,
        mutableDrawState
      }) => {
        state.drawCalls += 1;
        state.receivedBatches.push(populationBatch);
        state.receivedCanvases.push(canvas);
        state.receivedDrawGenerationIds.push(drawGenerationId);
        state.receivedRedrawReasons.push(redrawReason);
        mutableDrawState.batchSeen = populationBatch.batchId;
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
    timeProvider: () => "2026-08-07T12:00:00.000Z",
    drawCommandBudget: overrides.drawCommandBudget ?? 24
  });

  return {
    integration,
    state,
    retainedSurface
  };
}

test("1. valid Phase 212.2 plan is accepted and converted into one deterministic batch", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const batch = validateAtlasPopulationPlanForDraw(harness.integration, plan);

  assert.equal(batch.populationPlanId, plan.populationPlanId);
  assert.equal(batch.inputCommandCount, plan.commands.length);
  assert.equal(batch.acceptedCommandCount, plan.commands.length);
  assert.equal(batch.commands.length, plan.commands.length);
  assert.deepEqual(
    batch.commands.map((command) => command.instanceId),
    plan.commands.map((command) => command.instanceId)
  );
});

test("2. invalid plan schema and mutable plan are rejected", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();
  const mutablePlan = cloneAsMutable(plan);

  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, {
      ...plan,
      schemaId: "WRONG_SCHEMA"
    }),
    /INVALID_PLAN_SCHEMA/
  );
  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, mutablePlan),
    /PLAN_NOT_IMMUTABLE/
  );
});

test("3. region, package, recipe, and selector-seed mismatches fail closed", () => {
  const plan = createValidPopulationPlan();

  assert.throws(
    () =>
      validateAtlasPopulationPlanForDraw(
        createHarness({
          atlasIdentityProvider: () => ({
            regionId: "OTHER_REGION",
            packageId: "ATLAS_DEVELOPER_PACKAGE",
            recipeId: "RECREATION_AREA_RECIPE_001",
            selectorSeed: "WORLD_SELECTOR_SEED_001"
          })
        }).integration,
        plan
      ),
    /REGION_IDENTITY_MISMATCH/
  );
  assert.throws(
    () =>
      validateAtlasPopulationPlanForDraw(
        createHarness({
          atlasIdentityProvider: () => ({
            regionId: "BELLARINE",
            packageId: "OTHER_PACKAGE",
            recipeId: "RECREATION_AREA_RECIPE_001",
            selectorSeed: "WORLD_SELECTOR_SEED_001"
          })
        }).integration,
        plan
      ),
    /PACKAGE_IDENTITY_MISMATCH/
  );
  assert.throws(
    () =>
      validateAtlasPopulationPlanForDraw(
        createHarness({
          atlasIdentityProvider: () => ({
            regionId: "BELLARINE",
            packageId: "ATLAS_DEVELOPER_PACKAGE",
            recipeId: "OTHER_RECIPE",
            selectorSeed: "WORLD_SELECTOR_SEED_001"
          })
        }).integration,
        plan
      ),
    /RECIPE_IDENTITY_MISMATCH/
  );
  assert.throws(
    () =>
      validateAtlasPopulationPlanForDraw(
        createHarness({
          atlasIdentityProvider: () => ({
            regionId: "BELLARINE",
            packageId: "ATLAS_DEVELOPER_PACKAGE",
            recipeId: "RECREATION_AREA_RECIPE_001",
            selectorSeed: "OTHER_SEED"
          })
        }).integration,
        plan
      ),
    /SELECTOR_SEED_MISMATCH/
  );
});

test("4. unknown asset, duplicate instance ids, and invalid command shapes are rejected", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const unknownAssetPlan = Object.freeze({
    ...plan,
    commands: Object.freeze([
      Object.freeze({
        ...plan.commands[0],
        assetId: "UNKNOWN_ASSET_001"
      }),
      ...plan.commands.slice(1)
    ])
  });

  const duplicateInstancePlan = Object.freeze({
    ...plan,
    commands: Object.freeze([
      plan.commands[0],
      Object.freeze({
        ...plan.commands[0]
      }),
      ...plan.commands.slice(2)
    ].sort((left, right) => left.instanceId.localeCompare(right.instanceId)))
  });

  const invalidShapePlan = Object.freeze({
    ...plan,
    commands: Object.freeze([
      Object.freeze({
        ...plan.commands[0],
        geometry: Object.freeze({
          triangles: 10
        })
      }),
      ...plan.commands.slice(1)
    ])
  });

  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, unknownAssetPlan),
    /UNKNOWN_ASSET_ID/
  );
  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, duplicateInstancePlan),
    /DUPLICATE_INSTANCE_ID/
  );
  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, invalidShapePlan),
    /RAW_BROWSER_REFERENCE_DETECTED|INVALID_COMMAND_SHAPE/
  );
});

test("5. command budget exceeded fails closed", () => {
  const harness = createHarness({
    drawCommandBudget: 1
  });
  const plan = createValidPopulationPlan();

  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, plan),
    /DRAW_COMMAND_BUDGET_EXCEEDED/
  );
});

test("6. raw browser-like references are rejected from population commands", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const rawReferencePlan = Object.freeze({
    ...plan,
    commands: Object.freeze([
      Object.freeze({
        ...plan.commands[0],
        position: Object.freeze(new FakePoint(10, 20))
      }),
      ...plan.commands.slice(1)
    ])
  });

  assert.throws(
    () => validateAtlasPopulationPlanForDraw(harness.integration, rawReferencePlan),
    /RAW_BROWSER_REFERENCE_DETECTED|INVALID_COMMAND_SHAPE/
  );
});

test("7. submit sends one validated batch through the persistent draw seam and preserves command data", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const result = submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "manual_redraw"
  });

  assert.equal(result.drawCompleted, true);
  assert.equal(harness.state.drawCalls, 1);
  assert.equal(harness.state.receivedBatches.length, 1);
  assert.equal(
    harness.state.receivedBatches[0].commands.length,
    plan.commands.length
  );
  assert.deepEqual(
    harness.state.receivedBatches[0].commands.map((command) => command.instanceId),
    plan.commands.map((command) => command.instanceId)
  );
  assert.deepEqual(
    harness.state.receivedBatches[0].commands.map((command) => command.position),
    plan.commands.map((command) => command.position)
  );
  assert.deepEqual(
    harness.state.receivedBatches[0].commands.map((command) => command.scale),
    plan.commands.map((command) => command.scale)
  );
  assert.deepEqual(
    harness.state.receivedBatches[0].commands.map((command) => command.rotation),
    plan.commands.map((command) => command.rotation)
  );
  assert.deepEqual(
    harness.state.receivedBatches[0].commands.map((command) => command.lod),
    plan.commands.map((command) => command.lod)
  );
  const status = getAtlasPopulationDrawIntegrationStatus(harness.integration);
  assert.equal(status.requestedRedrawReason, "manual_redraw");
  assert.equal(status.acceptedRedrawReason, "manual_redraw");
});

test("7a. event redraw reasons are accepted when submitted through the draw integration", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const result = submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "moveend"
  });

  assert.equal(result.drawCompleted, true);
  const status = getAtlasPopulationDrawIntegrationStatus(harness.integration);
  assert.equal(status.requestedRedrawReason, "moveend");
  assert.equal(status.acceptedRedrawReason, "moveend");
});

test("8. the same retained canvas is reused across repeated submissions and no second renderer path exists", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "manual_redraw"
  });
  submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "follow_up_redraw"
  });

  assert.equal(harness.state.drawCalls, 2);
  assert.equal(harness.state.receivedCanvases[0], harness.state.receivedCanvases[1]);
  assert.equal(harness.state.secondRendererCalls, 0);
  assert.equal(harness.state.layerCalls, 0);
  assert.equal(harness.state.markerCalls, 0);
});

test("9. forced draw failure still releases temporary references without duplicating retained cleanup ownership", () => {
  const harness = createHarness({
    populationBatchDrawProvider: () => {
      throw Object.assign(new Error("DRAW_PROVIDER_FAILED"), {
        reasonCode: "DRAW_PROVIDER_FAILED"
      });
    }
  });
  const plan = createValidPopulationPlan();

  assert.throws(
    () =>
      submitAtlasPopulationPlanForDraw(harness.integration, {
        plan,
        redrawReason: "manual_redraw"
      }),
    /DRAW_PROVIDER_FAILED/
  );

  const status = getAtlasPopulationDrawIntegrationStatus(harness.integration);
  assert.equal(status.referencesReleased, true);
  assert.equal(harness.state.snapshotReleaseCalls, 1);
  assert.equal(harness.state.batchReferenceReleaseCalls, 1);
});

test("10. successful draw also releases temporary references", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "manual_redraw"
  });

  assert.equal(harness.state.snapshotReleaseCalls, 1);
  assert.equal(harness.state.batchReferenceReleaseCalls, 1);
  assert.equal(harness.state.drawStateReleaseCalls, 1);
});

test("11. missing snapshot provider, retained surface, lifecycle owner, and authorization fail closed", () => {
  const plan = createValidPopulationPlan();

  assert.throws(
    () =>
      submitAtlasPopulationPlanForDraw(
        createHarness({
          snapshotProvider: null
        }).integration,
        { plan }
      ),
    /SNAPSHOT_PROVIDER_UNAVAILABLE|DRAW_PROVIDER_UNAVAILABLE/
  );

  assert.throws(
    () =>
      submitAtlasPopulationPlanForDraw(
        createHarness({
          retainedSurfaceResolver: () => null
        }).integration,
        { plan }
      ),
    /RETAINED_SURFACE_UNAVAILABLE/
  );

  assert.throws(
    () =>
      submitAtlasPopulationPlanForDraw(
        createHarness({
          lifecycleOwnerResolver: () => null
        }).integration,
        { plan }
      ),
    /LIFECYCLE_OWNER_UNAVAILABLE/
  );

  assert.throws(
    () =>
      submitAtlasPopulationPlanForDraw(
        createHarness({
          authorizationResolver: () => null
        }).integration,
        { plan }
      ),
    /AUTHORIZATION_UNAVAILABLE/
  );
});

test("12. batch identity is deterministic for the same population plan", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  const first = validateAtlasPopulationPlanForDraw(harness.integration, plan);
  const second = validateAtlasPopulationPlanForDraw(harness.integration, plan);

  assert.equal(first.batchId, second.batchId);
});

test("13. status is frozen, serializable, and exposes no raw references", () => {
  const harness = createHarness();
  const plan = createValidPopulationPlan();

  submitAtlasPopulationPlanForDraw(harness.integration, {
    plan,
    redrawReason: "manual_redraw"
  });

  const status = getAtlasPopulationDrawIntegrationStatus(harness.integration);

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("canvas" in status, false);
  assert.equal("renderer" in status, false);
  assert.equal("map" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("14. integration module stays developer-only with no startup activation or global browser fallbacks", () => {
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.equal(moduleSource.includes("window."), false);
  assert.equal(moduleSource.includes("globalThis"), false);
  assert.equal(moduleSource.includes("document."), false);
  assert.equal(moduleSource.includes("moveend"), false);
  assert.equal(moduleSource.includes("zoomend"), false);
  assert.equal(moduleSource.includes("resize"), false);
});

test("15. session documentation exists and records the planning-to-draw boundary", () => {
  const sessionDoc = fs.readFileSync(sessionDocPath, "utf8");

  assert.match(sessionDoc, /Phase 212\.3/i);
  assert.match(sessionDoc, /population plan/i);
  assert.match(sessionDoc, /persistent draw/i);
  assert.match(sessionDoc, /TREE_EUCALYPTUS_001/);
  assert.match(sessionDoc, /BUILDING_CIVIC_SPORTS_PAVILION_001/);
  assert.match(sessionDoc, /runtimeExecutionEnabled = false/);
});
