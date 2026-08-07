import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createAtlasAutomaticPopulationController,
  runQueuedAutomaticViewportPopulationRefresh,
  getAutomaticViewportPopulationControllerStatus
} from "../client/developer-only-atlas-automatic-population-controller.mjs";
import {
  createAtlasAutomaticPopulationLiveEventAdapter,
  getAtlasAutomaticPopulationLiveEventAdapterStatus
} from "../client/developer-only-atlas-automatic-population-live-event-adapter.mjs";
import {
  createDeveloperOnlyControlledAutomaticAtlasPopulationToggle,
  ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION,
  DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
} from "../client/developer-only-controlled-automatic-atlas-population-toggle.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const toggleModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-controlled-automatic-atlas-population-toggle.mjs"
);

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_BELLARINE_001",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    sessionId: "PERSISTENT_SESSION_001",
    ...overrides
  };
}

function createViewport(viewportIdentity, overrides = {}) {
  return {
    viewportIdentity,
    featureSourceGenerationId:
      overrides.featureSourceGenerationId ?? `${viewportIdentity}_FEATURE_GEN_001`,
    ...overrides
  };
}

function createFeatures({
  sourceCount = 4,
  normalizedCount = 3,
  vegetationCount = 2,
  buildingCount = 1
} = {}) {
  const sourceFeatures = Array.from({ length: sourceCount }, (_, index) => ({
    featureId: `source-${index + 1}`,
    featureClass: index < vegetationCount ? "vegetation_area" : "building_footprint"
  }));
  const normalizedFeatures = Array.from({ length: normalizedCount }, (_, index) => ({
    featureId: `normalized-${index + 1}`,
    featureClass:
      index < vegetationCount
        ? "vegetation_area"
        : index < vegetationCount + buildingCount
          ? "building_footprint"
          : "park"
  }));
  return { sourceFeatures, normalizedFeatures };
}

function createPlannerResult(
  generation,
  featureResult,
  { commandCount = 3, vegetationCount = 2 } = {}
) {
  const commands = Array.from({ length: commandCount }, (_, index) => ({
    instanceId: `${generation.viewportGenerationId}_INSTANCE_${index + 1}`,
    assetCategory: index < vegetationCount ? "vegetation" : "building"
  }));
  return {
    populationPlanId: `PLAN_${generation.viewportGenerationId}`,
    viewportGenerationId: generation.viewportGenerationId,
    commands,
    sourceFeatureCount: featureResult.sourceFeatureCount,
    normalizedFeatureCount: featureResult.normalizedFeatureCount
  };
}

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createHarness() {
  const metrics = {
    mapOnCalls: [],
    mapOffCalls: []
  };

  const mutable = {
    hostname: "127.0.0.1",
    persistentStatus: {
      integrationState: "attached_idle",
      attached: true,
      redrawPermissionAllowed: true,
      authorizationState: "attach_permission_consumed",
      attachPermissionConsumed: true,
      invalidated: false,
      revoked: false,
      failedClosed: false,
      retainedSurfaceState: "ready",
      lifecycleOwnerId: "LIFECYCLE_OWNER_001",
      mapIdentityId: "MAP_BELLARINE_001",
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "WORLD_SELECTOR_SEED_001",
      sessionId: "PERSISTENT_SESSION_001",
      ownedCanvasCount: 1,
      ownedPaneCount: 1,
      ownedListenerCount: 3,
      lastFailureReason: null
    },
    readinessApproved: true,
    readinessReasonCode: "READINESS_APPROVED",
    identity: createIdentity(),
    mapReplacementEnabled: false
  };

  const primaryMap = {
    on(eventName, callback) {
      metrics.mapOnCalls.push([eventName, callback]);
    },
    off(eventName, callback) {
      metrics.mapOffCalls.push([eventName, callback]);
    }
  };
  const replacementMap = {
    on() {},
    off() {}
  };

  const viewportByEvent = new Map([
    ["moveend", createViewport("VP_MOVE")],
    ["zoomend", createViewport("VP_ZOOM")],
    ["resize", createViewport("VP_RESIZE")]
  ]);
  const featureByGeneration = new Map();
  const plannerByGeneration = new Map();
  const drawByGeneration = new Map();

  const controller = createAtlasAutomaticPopulationController({
    viewportIdentityProvider: ({ eventName }) =>
      JSON.parse(
        JSON.stringify(viewportByEvent.get(eventName) ?? createViewport("VP_A"))
      ),
    atlasIdentityProvider: () => JSON.parse(JSON.stringify(mutable.identity)),
    readinessProvider: () =>
      mutable.readinessApproved
        ? { approved: true, reasonCode: "READINESS_APPROVED" }
        : { approved: false, reasonCode: mutable.readinessReasonCode },
    liveFeatureAdapter: ({ generation }) => {
      const configured = featureByGeneration.get(generation.viewportGenerationId) ?? {};
      if (configured.failureReason) {
        throw Object.assign(new Error(configured.failureReason), {
          reasonCode: configured.failureReason
        });
      }
      const featureSet = configured.featureSet ?? createFeatures();
      return {
        viewportGenerationId:
          configured.viewportGenerationId ?? generation.viewportGenerationId,
        normalizedViewportGenerationId:
          configured.normalizedViewportGenerationId ?? generation.viewportGenerationId,
        featureSourceGenerationId:
          configured.featureSourceGenerationId ??
          generation.featureSourceGenerationId,
        sourceFeatures: featureSet.sourceFeatures,
        normalizedFeatures: featureSet.normalizedFeatures,
        sourceFeatureCount:
          configured.sourceFeatureCount ?? featureSet.sourceFeatures.length,
        normalizedFeatureCount:
          configured.normalizedFeatureCount ?? featureSet.normalizedFeatures.length
      };
    },
    populationPlanner: ({ generation, featureResult }) => {
      const configured = plannerByGeneration.get(generation.viewportGenerationId) ?? {};
      if (configured.failureReason) {
        throw Object.assign(new Error(configured.failureReason), {
          reasonCode: configured.failureReason
        });
      }
      return (
        configured.result ??
        createPlannerResult(generation, featureResult, configured.options)
      );
    },
    populationDrawIntegration: ({ generation, plan }) => {
      const configured = drawByGeneration.get(generation.viewportGenerationId) ?? {};
      if (configured.failureReason) {
        throw Object.assign(new Error(configured.failureReason), {
          reasonCode: configured.failureReason
        });
      }
      return {
        submission: {
          batchId: configured.batchId ?? `BATCH_${generation.viewportGenerationId}`,
          viewportGenerationId:
            configured.submissionViewportGenerationId ??
            generation.viewportGenerationId
        },
        draw: {
          batchId: configured.batchId ?? `BATCH_${generation.viewportGenerationId}`,
          viewportGenerationId:
            configured.drawViewportGenerationId ?? generation.viewportGenerationId,
          drawCompleted: configured.drawCompleted ?? true,
          reasonCode: configured.drawReasonCode
        }
      };
    },
    populationReferenceReleaseProvider: () => ({ released: true })
  });

  const liveEventAdapter = createAtlasAutomaticPopulationLiveEventAdapter({
    mapProvider: () => (mutable.mapReplacementEnabled ? replacementMap : primaryMap),
    controller,
    listenerRegistrar: (map, eventName, callback) => {
      map.on(eventName, callback);
      return { id: `${eventName}_REG` };
    },
    listenerRemover: (map, eventName, callback) => {
      map.off(eventName, callback);
    },
    viewportIdentityProvider: ({ eventName }) =>
      JSON.parse(JSON.stringify(viewportByEvent.get(eventName) ?? createViewport("VP_A"))),
    readinessProvider: () =>
      mutable.readinessApproved
        ? { approved: true, reasonCode: "READINESS_APPROVED" }
        : { approved: false, reasonCode: mutable.readinessReasonCode },
    atlasIdentityProvider: () => JSON.parse(JSON.stringify(mutable.identity))
  });

  const toggle = createDeveloperOnlyControlledAutomaticAtlasPopulationToggle({
    hostnameProvider: () => mutable.hostname,
    persistentStatusProvider: () => JSON.parse(JSON.stringify(mutable.persistentStatus)),
    readinessValidationProvider: () =>
      mutable.readinessApproved
        ? { approved: true, reasonCode: "READINESS_APPROVED" }
        : { approved: false, reasonCode: mutable.readinessReasonCode },
    controller,
    liveEventAdapter
  });

  return {
    controller,
    liveEventAdapter,
    toggle,
    mutable,
    metrics,
    setFeature(generationId, config) {
      featureByGeneration.set(generationId, config);
    },
    setPlanner(generationId, config) {
      plannerByGeneration.set(generationId, config);
    },
    setDraw(generationId, config) {
      drawByGeneration.set(generationId, config);
    },
    trigger(eventName, eventObject = {}) {
      const registration = metrics.mapOnCalls.find(([name]) => name === eventName);
      assert.ok(registration, `expected ${eventName} listener`);
      return registration[1](eventObject);
    }
  };
}

test("module evaluation does nothing", () => {
  const harness = createHarness();
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.ownedAutomaticListenerCount, 0);
});

test("commands local-only", () => {
  const harness = createHarness();
  harness.mutable.hostname = "growgo.example.com";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "NON_LOCAL_DEVELOPMENT_HOST");
});

test("exact enable confirmation required", () => {
  const harness = createHarness();
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: "WRONG"
  });
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "INVALID_CONFIRMATION");
});

test("enable blocked if Atlas unauthorized", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.authorizationState = "inactive";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_UNAUTHORIZED");
});

test("enable blocked after authorization but before attach", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.authorizationState = "active";
  harness.mutable.persistentStatus.attachPermissionConsumed = false;
  harness.mutable.persistentStatus.attached = false;
  harness.mutable.persistentStatus.integrationState = "authorized";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_NOT_ATTACHED");
});

test("enable blocked if redraw permission false", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.redrawPermissionAllowed = false;
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_REDRAW_NOT_ALLOWED");
});

test("enable blocked if readiness blocked", () => {
  const harness = createHarness();
  harness.mutable.readinessApproved = false;
  harness.mutable.readinessReasonCode = "REGION_OUT_OF_SCOPE";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "REGION_OUT_OF_SCOPE");
});

test("enable succeeds when attached_idle", () => {
  const harness = createHarness();
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.outcome, "enabled");
  assert.equal(result.automaticPopulationEnabled, true);
});

test("enable succeeds with attach_permission_consumed", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.authorizationState = "attach_permission_consumed";
  harness.mutable.persistentStatus.attachPermissionConsumed = true;
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.outcome, "enabled");
  assert.equal(result.reasonCode, "AUTOMATIC_POPULATION_ENABLED");
});

test("enable blocked when invalidated", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.invalidated = true;
  harness.mutable.persistentStatus.lastFailureReason = "REGION_OUT_OF_SCOPE";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "REGION_OUT_OF_SCOPE");
});

test("enable blocked when revoked", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.revoked = true;
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_REVOKED");
});

test("enable blocked when expired", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.authorizationState = "expired";
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_EXPIRED");
});

test("enable blocked on identity drift", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.recipeId = null;
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "PERSISTENT_ATLAS_IDENTITY_MISMATCH");
});

test("controller enabled once", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.automaticPopulationEnabled, true);
});

test("event adapter enabled once", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(
    harness.liveEventAdapter
  );
  assert.equal(status.enabled, true);
});

test("exactly three automatic listeners registered", () => {
  const harness = createHarness();
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.ownedAutomaticListenerCount, 3);
});

test("duplicate enable blocked", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.reasonCode, "AUTOMATIC_POPULATION_ALREADY_ENABLED");
});

test("no immediate population on enable", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.refreshRequestedCount, 0);
});

for (const eventName of ["moveend", "zoomend", "resize"]) {
  test(`${eventName} forwards automatic refresh`, () => {
    const harness = createHarness();
    harness.toggle.enableControlledAutomaticAtlasPopulation({
      confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
    });
    const before = getAutomaticViewportPopulationControllerStatus(harness.controller);
    harness.trigger(eventName);
    const after = getAutomaticViewportPopulationControllerStatus(harness.controller);
    assert.equal(after.refreshRequestedCount, before.refreshRequestedCount + 1);
  });
}

test("controller owns coalescing", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.trigger("moveend");
  harness.trigger("zoomend");
  harness.trigger("resize");
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.refreshRequestedCount, 3);
  assert.equal(status.refreshCoalescedCount, 2);
});

test("stale generation discarded", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.trigger("moveend");
  const queued = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setFeature(queued.queuedViewportGenerationId, {
    viewportGenerationId: "STALE_AFTER_FEATURE_READ"
  });
  const run = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(run.outcome, "discarded");
});

test("successful automatic population replaces batch", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.trigger("moveend");
  const run = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(run.outcome, "completed");
  assert.equal(run.status.currentBatchId != null, true);
});

test("duplicate instances do not accumulate", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.trigger("moveend");
  const queued = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(queued.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${queued.queuedViewportGenerationId}`,
      viewportGenerationId: queued.queuedViewportGenerationId,
      commands: [
        { instanceId: "DUPLICATE", assetCategory: "vegetation" },
        { instanceId: "DUPLICATE", assetCategory: "building" }
      ]
    }
  });
  const run = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(run.reasonCode, "DUPLICATE_INSTANCE_ID");
});

test("disable confirmation required", () => {
  const harness = createHarness();
  const result = harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: "WRONG"
  });
  assert.equal(result.reasonCode, "INVALID_CONFIRMATION");
});

test("disable removes automatic listeners", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const result = harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.ownedAutomaticListenerCount, 0);
  assert.equal(harness.metrics.mapOffCalls.length, 3);
});

test("disable clears controller refs", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.trigger("moveend");
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  const result = harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(result.populationReferenceCount, 0);
});

test("disable keeps persistent Atlas attached", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(harness.mutable.persistentStatus.attached, true);
});

test("repeated disable harmless", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  const second = harness.toggle.disableControlledAutomaticAtlasPopulation({
    confirmation: DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(second.outcome, "disabled");
});

test("invalidation disables automatic population", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.mutable.persistentStatus.invalidated = true;
  harness.mutable.persistentStatus.lastFailureReason = "REGION_OUT_OF_SCOPE";
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.invalidationReason, "REGION_OUT_OF_SCOPE");
});

test("detach disables automatic population", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.mutable.persistentStatus.attached = false;
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.invalidationReason, "PERSISTENT_ATLAS_NOT_ATTACHED");
});

test("revoke disables automatic population", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.mutable.persistentStatus.revoked = true;
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.invalidationReason, "PERSISTENT_ATLAS_REVOKED");
});

test("expired auth disables automatic population", () => {
  const harness = createHarness();
  harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  harness.mutable.persistentStatus.authorizationState = "expired";
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.invalidationReason, "PERSISTENT_ATLAS_EXPIRED");
});

test("no auto-reattach", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.attached = false;
  harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(harness.mutable.persistentStatus.attached, false);
});

test("no auto-reauthorize", () => {
  const harness = createHarness();
  harness.mutable.persistentStatus.authorizationState = "inactive";
  harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(harness.mutable.persistentStatus.authorizationState, "inactive");
});

test("status immutable serializable", () => {
  const harness = createHarness();
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("command results immutable serializable", () => {
  const harness = createHarness();
  const result = harness.toggle.enableControlledAutomaticAtlasPopulation({
    confirmation: ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION
  });
  assert.equal(Object.isFrozen(result), true);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("no raw refs exposed", () => {
  const harness = createHarness();
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  for (const key of [
    "map",
    "listeners",
    "callbacks",
    "canvas",
    "pane",
    "renderer",
    "featureObjects",
    "planInternals",
    "batchInternals"
  ]) {
    assert.equal(key in status, false);
  }
});

test("no timers", () => {
  const source = fs.readFileSync(toggleModulePath, "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|requestAnimationFrame/);
});

test("no polling", () => {
  const source = fs.readFileSync(toggleModulePath, "utf8");
  assert.doesNotMatch(source, /setInterval|setTimeout/);
});

test("no startup population", () => {
  const source = fs.readFileSync(toggleModulePath, "utf8");
  assert.doesNotMatch(
    source,
    /DOMContentLoaded|window\.onload|addEventListener\s*\(\s*["']load["']|addEventListener\s*\(\s*["']DOMContentLoaded["']/i
  );
});

test("no player runtime activation", () => {
  const source = fs.readFileSync(toggleModulePath, "utf8");
  assert.doesNotMatch(source, /firebase|player runtime|production activation/i);
});

test("all four canonical safety flags remain false", () => {
  const harness = createHarness();
  const status = harness.toggle.getControlledAutomaticAtlasPopulationStatus();
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
