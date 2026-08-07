import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createAtlasAutomaticPopulationController,
  enableAutomaticViewportPopulation,
  disableAutomaticViewportPopulation,
  requestAutomaticViewportPopulationRefresh,
  runQueuedAutomaticViewportPopulationRefresh,
  invalidateAutomaticViewportPopulationController,
  getAutomaticViewportPopulationControllerStatus
} from "../client/developer-only-atlas-automatic-population-controller.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-automatic-population-controller.mjs"
);
const designPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_8_CONTROLLED_AUTOMATIC_VIEWPORT_REPOPULATION_DESIGN.md"
);
const fakeRuntimePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-automatic-population-fake-runtime.mjs"
);

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_BELLARINE_001",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
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

function createHarness(overrides = {}) {
  const metrics = {
    viewportCalls: 0,
    atlasIdentityCalls: 0,
    readinessCalls: 0,
    featureReads: 0,
    plannerCalls: 0,
    drawIntegrationCalls: 0,
    releaseCalls: 0
  };

  const mutable = {
    identity: createIdentity(overrides.identity),
    readinessFailureReason: null,
    externalOwnership: { attached: true, ownedCanvasCount: 1, ownedListenerCount: 3 }
  };

  const viewportByEvent = new Map();
  const featureByGeneration = new Map();
  const plannerByGeneration = new Map();
  const drawByGeneration = new Map();

  const controller = createAtlasAutomaticPopulationController({
    viewportIdentityProvider: ({ eventName }) => {
      metrics.viewportCalls += 1;
      return clone(viewportByEvent.get(eventName) ?? createViewport("VP_A"));
    },
    atlasIdentityProvider: () => {
      metrics.atlasIdentityCalls += 1;
      return clone(mutable.identity);
    },
    readinessProvider: () => {
      metrics.readinessCalls += 1;
      if (mutable.readinessFailureReason) {
        return {
          approved: false,
          reasonCode: mutable.readinessFailureReason
        };
      }
      return { approved: true, reasonCode: "READINESS_APPROVED" };
    },
    liveFeatureAdapter: ({ generation }) => {
      metrics.featureReads += 1;
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
      metrics.plannerCalls += 1;
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
      metrics.drawIntegrationCalls += 1;
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
    populationReferenceReleaseProvider: ({ scope }) => {
      metrics.releaseCalls += 1;
      if (overrides.releaseFailureReason) {
        return { released: false, reasonCode: overrides.releaseFailureReason };
      }
      assert.equal(scope, "automatic_population_controller");
      return { released: true };
    }
  });

  return {
    controller,
    metrics,
    mutable,
    setViewport(eventName, viewport) {
      viewportByEvent.set(eventName, viewport);
    },
    setFeature(generationId, config) {
      featureByGeneration.set(generationId, config);
    },
    setPlanner(generationId, config) {
      plannerByGeneration.set(generationId, config);
    },
    setDrawIntegration(generationId, config) {
      drawByGeneration.set(generationId, config);
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("starts disabled", () => {
  const harness = createHarness();
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.state, "disabled");
  assert.equal(status.controllerReady, true);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("enable succeeds with valid injected deps", () => {
  const harness = createHarness();
  const result = enableAutomaticViewportPopulation(harness.controller);
  assert.equal(result.outcome, "enabled");
  assert.equal(result.status.state, "attached_idle");
});

test("missing dependency fails closed", () => {
  const controller = createAtlasAutomaticPopulationController();
  const result = enableAutomaticViewportPopulation(controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "AUTOMATIC_POPULATION_CONTROLLER_DEPENDENCIES_UNAVAILABLE");
});

test("invalid event rejected", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  const result = requestAutomaticViewportPopulationRefresh(
    harness.controller,
    { eventName: "move" }
  );
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "FORBIDDEN_EVENT");
});

for (const eventName of ["moveend", "zoomend", "resize"]) {
  test(`${eventName} queues`, () => {
    const harness = createHarness();
    harness.setViewport(eventName, createViewport(`VP_${eventName.toUpperCase()}`));
    enableAutomaticViewportPopulation(harness.controller);
    const result = requestAutomaticViewportPopulationRefresh(harness.controller, {
      eventName
    });
    assert.equal(result.outcome, "queued");
    assert.equal(result.status.state, "population_queued");
  });
}

test("burst coalesces", () => {
  const harness = createHarness();
  harness.setViewport("moveend", createViewport("VP_A"));
  harness.setViewport("zoomend", createViewport("VP_B"));
  harness.setViewport("resize", createViewport("VP_C"));
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const result = requestAutomaticViewportPopulationRefresh(harness.controller, {
    eventName: "resize"
  });
  assert.equal(result.outcome, "coalesced");
  assert.equal(result.status.refreshCoalescedCount, 2);
});

test("latest generation wins", () => {
  const harness = createHarness();
  harness.setViewport("moveend", createViewport("VP_A"));
  harness.setViewport("zoomend", createViewport("VP_B"));
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const run = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(run.outcome, "completed");
  assert.equal(run.status.currentViewportIdentity, "VP_B");
});

test("unchanged viewport skipped", () => {
  const harness = createHarness();
  harness.setViewport("moveend", createViewport("VP_A", { featureSourceGenerationId: "FG1" }));
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  const second = requestAutomaticViewportPopulationRefresh(harness.controller, {
    eventName: "moveend"
  });
  assert.equal(second.outcome, "skipped");
  assert.equal(second.reasonCode, "UNCHANGED_VIEWPORT");
});

test("stale after feature read discarded", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setFeature(status.queuedViewportGenerationId, {
    viewportGenerationId: "STALE_OTHER_GENERATION"
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "discarded");
  assert.equal(result.reasonCode, "STALE_AFTER_FEATURE_READ");
});

test("stale after planning discarded", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${status.queuedViewportGenerationId}`,
      viewportGenerationId: "STALE_AFTER_PLANNING",
      commands: [{ instanceId: "X1", assetCategory: "vegetation" }]
    }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "discarded");
  assert.equal(result.reasonCode, "STALE_AFTER_PLANNING");
});

test("stale before submission discarded", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${status.queuedViewportGenerationId}`,
      viewportGenerationId: status.queuedViewportGenerationId,
      preSubmissionViewportGenerationId: "STALE_BEFORE_SUBMISSION",
      commands: [{ instanceId: "X1", assetCategory: "vegetation" }]
    }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "discarded");
  assert.equal(result.reasonCode, "STALE_BEFORE_SUBMISSION");
});

test("stale after submission discarded", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setDrawIntegration(status.queuedViewportGenerationId, {
    submissionViewportGenerationId: "STALE_AFTER_SUBMISSION"
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "discarded");
  assert.equal(result.reasonCode, "STALE_AFTER_SUBMISSION");
});

test("one follow-up max", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  harness.controller.__internal.activeGeneration = { viewportGenerationId: "ACTIVE_GEN" };
  harness.controller.__state.activeViewportGenerationId = "ACTIVE_GEN";
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.followUpRefreshPending, true);
  assert.equal(Boolean(status.followUpViewportGenerationId), true);
});

test("no recursion", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  harness.controller.__internal.activeGeneration = { viewportGenerationId: "ACTIVE_GEN" };
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ACTIVE_REFRESH_IN_PROGRESS");
});

test("no parallel feature read", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.controller.__internal.featureReadActive = true;
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PARALLEL_FEATURE_READ_DETECTED");
});

test("no parallel planning", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.controller.__internal.planningActive = true;
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PARALLEL_PLANNING_DETECTED");
});

test("no parallel submission", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.controller.__internal.submissionActive = true;
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PARALLEL_SUBMISSION_DETECTED");
});

test("no parallel draw", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.controller.__internal.drawActive = true;
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PARALLEL_DRAW_DETECTED");
});

test("first population succeeds", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "completed");
  assert.equal(result.status.currentCommandCount > 0, true);
});

test("replacement keeps old population during planning", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  harness.setViewport("moveend", createViewport("VP_A"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  harness.setViewport("zoomend", createViewport("VP_B"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(status.currentViewportIdentity, "VP_A");
});

test("successful draw atomically replaces", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  harness.setViewport("moveend", createViewport("VP_A"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  harness.setViewport("zoomend", createViewport("VP_B"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "completed");
  assert.equal(result.status.currentViewportIdentity, "VP_B");
});

test("old refs release after success", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  harness.setViewport("moveend", createViewport("VP_A"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  harness.setViewport("zoomend", createViewport("VP_B"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(harness.metrics.releaseCalls, 1);
});

test("failed replacement preserves last good population", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const first = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  const oldPlan = first.status.currentPopulationPlanId;
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setDrawIntegration(status.queuedViewportGenerationId, {
    failureReason: "SUBMISSION_FAILED"
  });
  const failed = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(failed.outcome, "failed_closed");
  assert.equal(failed.status.currentPopulationPlanId, oldPlan);
});

test("duplicate instances do not accumulate", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${status.queuedViewportGenerationId}`,
      viewportGenerationId: status.queuedViewportGenerationId,
      commands: [
        { instanceId: "DUPLICATE", assetCategory: "vegetation" },
        { instanceId: "DUPLICATE", assetCategory: "building" }
      ]
    }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "DUPLICATE_INSTANCE_ID");
});

test("source budget enforced", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setFeature(status.queuedViewportGenerationId, { sourceFeatureCount: 65 });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "SOURCE_FEATURE_BUDGET_EXCEEDED");
});

test("normalized budget enforced", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setFeature(status.queuedViewportGenerationId, { normalizedFeatureCount: 49 });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "NORMALIZED_FEATURE_BUDGET_EXCEEDED");
});

test("command budget enforced", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    options: { commandCount: 25, vegetationCount: 18 }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "POPULATION_COMMAND_BUDGET_EXCEEDED");
});

test("vegetation budget enforced", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    options: { commandCount: 19, vegetationCount: 19 }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "VEGETATION_BUDGET_EXCEEDED");
});

test("building budget enforced", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${status.queuedViewportGenerationId}`,
      viewportGenerationId: status.queuedViewportGenerationId,
      commands: Array.from({ length: 7 }, (_, index) => ({
        instanceId: `B_${index + 1}`,
        assetCategory: "building"
      }))
    }
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "BUILDING_BUDGET_EXCEEDED");
});

test("readiness drift invalidates", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.mutable.readinessFailureReason = "REGION_OUT_OF_SCOPE";
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "invalidated");
  assert.equal(result.reasonCode, "REGION_OUT_OF_SCOPE");
});

test("identity drift invalidates", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  harness.mutable.identity.mapIdentityId = "MAP_REPLACED";
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "invalidated");
  assert.equal(result.reasonCode, "MAP_IDENTITY_MISMATCH");
});

test("planner failure preserved", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setPlanner(status.queuedViewportGenerationId, {
    failureReason: "PLANNER_FAILED"
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PLANNER_FAILED");
});

test("submission failure preserved", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setDrawIntegration(status.queuedViewportGenerationId, {
    failureReason: "SUBMISSION_FAILED"
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "SUBMISSION_FAILED");
});

test("draw failure preserved", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  harness.setDrawIntegration(status.queuedViewportGenerationId, {
    drawCompleted: false,
    drawReasonCode: "DRAW_FAILED"
  });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "DRAW_FAILED");
});

test("release failure reported", () => {
  const harness = createHarness({ releaseFailureReason: "POPULATION_REFERENCE_RELEASE_FAILED" });
  enableAutomaticViewportPopulation(harness.controller);
  harness.setViewport("moveend", createViewport("VP_A"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  harness.setViewport("zoomend", createViewport("VP_B"));
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "zoomend" });
  const result = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assert.equal(result.reasonCode, "POPULATION_REFERENCE_RELEASE_FAILED");
  assert.equal(result.status.cleanupFailureReasons.includes("POPULATION_REFERENCE_RELEASE_FAILED"), true);
});

test("disable clears controller refs only", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  const result = disableAutomaticViewportPopulation(harness.controller);
  assert.equal(result.outcome, "disabled");
  assert.equal(result.status.populationReferenceCount, 0);
});

test("invalidate clears controller refs only", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  const result = invalidateAutomaticViewportPopulationController(
    harness.controller,
    "MANUAL_INVALIDATION"
  );
  assert.equal(result.outcome, "invalidated");
  assert.equal(result.status.populationReferenceCount, 0);
});

test("external persistent Atlas ownership untouched", () => {
  const harness = createHarness();
  const before = clone(harness.mutable.externalOwnership);
  enableAutomaticViewportPopulation(harness.controller);
  disableAutomaticViewportPopulation(harness.controller);
  invalidateAutomaticViewportPopulationController(
    harness.controller,
    "MANUAL_INVALIDATION"
  );
  assert.deepEqual(harness.mutable.externalOwnership, before);
});

test("status immutable serializable", () => {
  const harness = createHarness();
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("no raw refs exposed", () => {
  const harness = createHarness();
  const status = getAutomaticViewportPopulationControllerStatus(harness.controller);
  for (const key of [
    "map",
    "features",
    "canvas",
    "pane",
    "listeners",
    "renderer",
    "callbacks",
    "batch",
    "plan"
  ]) {
    assert.equal(key in status, false);
  }
});

test("no window global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b|\bdocument\b|\bglobalThis\b/);
});

test("no live listeners", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\.on\(|\.off\(|addEventListener|removeEventListener/);
});

test("no automatic startup", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(
    source,
    /DOMContentLoaded|window\.onload|addEventListener\s*\(\s*["']load["']|addEventListener\s*\(\s*["']DOMContentLoaded["']/i
  );
});

test("no timers polling", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|requestAnimationFrame/);
});

test("all four canonical safety flags remain false", () => {
  const harness = createHarness();
  enableAutomaticViewportPopulation(harness.controller);
  requestAutomaticViewportPopulationRefresh(harness.controller, { eventName: "moveend" });
  const run = runQueuedAutomaticViewportPopulationRefresh(harness.controller);
  assertCanonicalFlags(run.status.canonicalSafetyFlags);
});

test("phase docs and neighboring fake runtime remain aligned with controller phase", () => {
  const designSource = fs.readFileSync(designPath, "utf8");
  const fakeRuntimeSource = fs.readFileSync(fakeRuntimePath, "utf8");
  const controllerSource = fs.readFileSync(modulePath, "utf8");
  assert.match(designSource, /212\.10|automatic viewport repopulation/i);
  assert.match(fakeRuntimeSource, /AUTOMATIC_POPULATION_FAKE_RUNTIME/);
  assert.match(controllerSource, /createAtlasAutomaticPopulationController/);
});
