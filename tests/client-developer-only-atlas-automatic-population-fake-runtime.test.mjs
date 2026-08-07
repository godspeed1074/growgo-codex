import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createAtlasAutomaticPopulationFakeRuntime,
  enableAutomaticPopulationFakeRuntime,
  disableAutomaticPopulationFakeRuntime,
  requestAutomaticViewportRefresh,
  runQueuedAutomaticViewportRefresh,
  invalidateAutomaticViewportPopulation,
  getAutomaticPopulationFakeRuntimeStatus
} from "../client/developer-only-atlas-automatic-population-fake-runtime.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-automatic-population-fake-runtime.mjs"
);
const previewPath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-controlled-viewport-population-preview.mjs"
);
const designPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_8_CONTROLLED_AUTOMATIC_VIEWPORT_REPOPULATION_DESIGN.md"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_9_AUTOMATIC_POPULATION_FAKE_RUNTIME_CONTRACT.md"
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

function createEvent(eventName, viewportIdentity, overrides = {}) {
  const identity = createIdentity(overrides);
  return {
    eventName,
    viewportIdentity,
    mapIdentityId: identity.mapIdentityId,
    regionId: identity.regionId,
    packageId: identity.packageId,
    recipeId: identity.recipeId,
    selectorSeed: identity.selectorSeed,
    featureFingerprint: overrides.featureFingerprint ?? `${viewportIdentity}:FEATURES`,
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

function createPlannerResult(generation, features, { commandCount = 3, vegetationCount = 2 } = {}) {
  const commands = Array.from({ length: commandCount }, (_, index) => ({
    instanceId: `${generation.viewportGenerationId}_INSTANCE_${index + 1}`,
    assetCategory: index < vegetationCount ? "vegetation" : "building"
  }));
  return {
    populationPlanId: `PLAN_${generation.viewportGenerationId}`,
    commands,
    sourceFeatureCount: features.sourceFeatureCount,
    normalizedFeatureCount: features.normalizedFeatureCount
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
    featureReads: 0,
    plannerCalls: 0,
    submissionCalls: 0,
    drawCalls: 0,
    releaseCalls: 0,
    readinessCalls: 0,
    identityCalls: 0,
    staleSubmissionResults: 0,
    staleDrawResults: 0
  };

  const identity = createIdentity(overrides.identity);
  const featureMap = new Map();
  const plannerByGeneration = new Map();
  const submissionByGeneration = new Map();
  const drawByGeneration = new Map();

  const runtime = createAtlasAutomaticPopulationFakeRuntime({
    identityProvider: () => {
      metrics.identityCalls += 1;
      return { ...identity };
    },
    readinessProvider: (generation) => {
      metrics.readinessCalls += 1;
      if (overrides.readinessFailureReason) {
        return {
          approved: false,
          reasonCode: overrides.readinessFailureReason,
          generation
        };
      }
      return { approved: true, reasonCode: "READINESS_APPROVED", generation };
    },
    featureSourceProvider: (generation) => {
      metrics.featureReads += 1;
      if (overrides.featureSourceFailureReason) {
        throw Object.assign(new Error(overrides.featureSourceFailureReason), {
          reasonCode: overrides.featureSourceFailureReason
        });
      }
      const configured = featureMap.get(generation.viewportGenerationId) ?? {};
      const featureSet = configured.featureSet ?? createFeatures();
      const sourceFeatures = featureSet.sourceFeatures;
      const normalizedFeatures = featureSet.normalizedFeatures;
      return {
        viewportGenerationId:
          configured.returnStaleGenerationId ?? generation.viewportGenerationId,
        viewportIdentity: generation.viewportIdentity,
        sourceFeatures,
        normalizedFeatures,
        sourceFeatureCount:
          configured.sourceFeatureCountOverride ?? sourceFeatures.length,
        normalizedFeatureCount:
          configured.normalizedFeatureCountOverride ?? normalizedFeatures.length,
        featureFingerprint:
          configured.featureFingerprint ?? generation.featureFingerprint
      };
    },
    planner: ({ generation, featureResult }) => {
      metrics.plannerCalls += 1;
      if (overrides.plannerFailureReason) {
        throw Object.assign(new Error(overrides.plannerFailureReason), {
          reasonCode: overrides.plannerFailureReason
        });
      }
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
    submission: ({ generation, plan }) => {
      metrics.submissionCalls += 1;
      const configured = submissionByGeneration.get(generation.viewportGenerationId) ?? {};
      if (configured.failureReason) {
        throw Object.assign(new Error(configured.failureReason), {
          reasonCode: configured.failureReason
        });
      }
      if (configured.returnStaleGenerationId) {
        metrics.staleSubmissionResults += 1;
      }
      return {
        batchId: configured.batchId ?? `BATCH_${generation.viewportGenerationId}`,
        viewportGenerationId:
          configured.returnStaleGenerationId ?? generation.viewportGenerationId,
        commands: plan.commands
      };
    },
    draw: ({ generation, batch }) => {
      metrics.drawCalls += 1;
      const configured = drawByGeneration.get(generation.viewportGenerationId) ?? {};
      if (configured.failureReason) {
        throw Object.assign(new Error(configured.failureReason), {
          reasonCode: configured.failureReason
        });
      }
      if (configured.returnStaleGenerationId) {
        metrics.staleDrawResults += 1;
      }
      return {
        drawCompleted: true,
        batchId: batch.batchId,
        viewportGenerationId:
          configured.returnStaleGenerationId ?? generation.viewportGenerationId
      };
    },
    releasePopulationReferences: () => {
      metrics.releaseCalls += 1;
      if (overrides.releaseFailureReason) {
        return { released: false, reasonCode: overrides.releaseFailureReason };
      }
      return { released: true };
    }
  });

  return {
    runtime,
    metrics,
    identity,
    setFeatures(generationId, config) {
      featureMap.set(generationId, config);
    },
    setPlanner(generationId, config) {
      plannerByGeneration.set(generationId, config);
    },
    setSubmission(generationId, config) {
      submissionByGeneration.set(generationId, config);
    },
    setDraw(generationId, config) {
      drawByGeneration.set(generationId, config);
    }
  };
}

test("starts disabled", () => {
  const harness = createHarness();
  const status = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);

  assert.equal(status.automaticPopulationEnabled, false);
  assert.equal(status.state, "disabled");
  assert.equal(status.populationReferenceCount, 0);
  assert.equal(status.referencesReleased, true);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("enable fake runtime", () => {
  const harness = createHarness();
  const result = enableAutomaticPopulationFakeRuntime(harness.runtime);

  assert.equal(result.outcome, "enabled");
  assert.equal(result.reasonCode, "AUTOMATIC_POPULATION_ENABLED");
  assert.equal(result.status.state, "attached_idle");
  assert.equal(result.status.automaticPopulationEnabled, true);
});

test("invalid event rejected and approved events accepted", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  const invalid = requestAutomaticViewportRefresh(harness.runtime, createEvent("move", "VP_A"));
  const moveend = requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  const zoomend = requestAutomaticViewportRefresh(harness.runtime, createEvent("zoomend", "VP_B"));
  const resize = requestAutomaticViewportRefresh(harness.runtime, createEvent("resize", "VP_C"));

  assert.equal(invalid.outcome, "blocked");
  assert.equal(invalid.reasonCode, "FORBIDDEN_EVENT");
  assert.equal(moveend.outcome, "queued");
  assert.equal(zoomend.outcome, "coalesced");
  assert.equal(resize.outcome, "coalesced");
});

test("one queued refresh maximum burst coalesces and latest generation wins", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  requestAutomaticViewportRefresh(harness.runtime, createEvent("zoomend", "VP_B"));
  const last = requestAutomaticViewportRefresh(harness.runtime, createEvent("resize", "VP_C"));

  assert.equal(last.status.refreshQueuedCount, 1);
  assert.equal(last.status.refreshCoalescedCount, 2);
  assert.equal(last.status.queuedViewportGenerationId.includes("VP_C"), false);
  const run = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(run.outcome, "completed");
  assert.equal(run.status.currentViewportIdentity, "VP_C");
  assert.equal(harness.metrics.plannerCalls, 1);
  assert.equal(harness.metrics.submissionCalls, 1);
  assert.equal(harness.metrics.drawCalls, 1);
});

test("stale queued generation discarded and stale active submission or draw cannot replace current", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  requestAutomaticViewportRefresh(harness.runtime, createEvent("zoomend", "VP_B"));
  const firstRun = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(firstRun.status.currentViewportIdentity, "VP_B");

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_C"));
  const queuedStatus = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  const generationId = queuedStatus.queuedViewportGenerationId;
  harness.setSubmission(generationId, {
    returnStaleGenerationId: "STALE_OTHER_GENERATION"
  });
  const staleSubmit = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(staleSubmit.outcome, "discarded");
  assert.equal(staleSubmit.reasonCode, "STALE_SUBMISSION_RESULT");
  assert.equal(staleSubmit.status.staleRefreshDiscardedCount >= 1, true);
  assert.equal(staleSubmit.status.currentViewportIdentity, "VP_B");

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_D"));
  const queuedStatus2 = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setDraw(queuedStatus2.queuedViewportGenerationId, {
    returnStaleGenerationId: "STALE_DRAW_GENERATION"
  });
  const staleDraw = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(staleDraw.outcome, "discarded");
  assert.equal(staleDraw.reasonCode, "STALE_DRAW_RESULT");
  assert.equal(staleDraw.status.currentViewportIdentity, "VP_B");
});

test("same viewport can be skipped deterministically", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  runQueuedAutomaticViewportRefresh(harness.runtime);
  const second = requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));

  assert.equal(second.outcome, "skipped");
  assert.equal(second.reasonCode, "UNCHANGED_VIEWPORT");
});

test("first population succeeds old population retained while next plan builds and full deterministic replacement releases old refs", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  const first = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(first.outcome, "completed");
  assert.equal(first.status.currentPopulationPlanId.startsWith("PLAN_"), true);
  assert.equal(first.status.currentCommandCount > 0, true);
  assert.equal(harness.metrics.releaseCalls, 0);
  const firstPlanId = first.status.currentPopulationPlanId;

  requestAutomaticViewportRefresh(harness.runtime, createEvent("zoomend", "VP_B"));
  const beforeRun = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  assert.equal(beforeRun.currentViewportIdentity, "VP_A");
  const second = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(second.outcome, "completed");
  assert.equal(second.status.currentViewportIdentity, "VP_B");
  assert.equal(harness.metrics.releaseCalls, 1);
  assert.equal(second.status.currentPopulationPlanId.startsWith("PLAN_"), true);
  assert.notEqual(second.status.currentPopulationPlanId, firstPlanId);
});

test("failed replacement preserves last good population and no duplicate instances accumulate", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  const first = runQueuedAutomaticViewportRefresh(harness.runtime);
  const oldPlanId = first.status.currentPopulationPlanId;

  requestAutomaticViewportRefresh(harness.runtime, createEvent("zoomend", "VP_B"));
  const queued = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setSubmission(queued.queuedViewportGenerationId, {
    failureReason: "SUBMISSION_FAILED"
  });
  const failed = runQueuedAutomaticViewportRefresh(harness.runtime);

  assert.equal(failed.outcome, "failed_closed");
  assert.equal(failed.reasonCode, "SUBMISSION_FAILED");
  assert.equal(failed.status.currentPopulationPlanId, oldPlanId);
  assert.equal(failed.status.populationReferenceCount > 0, true);
});

test("feature and command budgets are enforced including vegetation and building caps", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_SOURCE"));
  let queued = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setFeatures(queued.queuedViewportGenerationId, {
    featureSet: createFeatures({ sourceCount: 70, normalizedCount: 3 })
  });
  let result = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "SOURCE_FEATURE_BUDGET_EXCEEDED");

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_COMMANDS"));
  queued = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setPlanner(queued.queuedViewportGenerationId, {
    options: { commandCount: 30, vegetationCount: 20 }
  });
  result = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(result.reasonCode, "POPULATION_COMMAND_BUDGET_EXCEEDED");

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_VEG"));
  queued = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setPlanner(queued.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${queued.queuedViewportGenerationId}`,
      commands: Array.from({ length: 19 }, (_, index) => ({
        instanceId: `veg-${index}`,
        assetCategory: "vegetation"
      })),
      sourceFeatureCount: 3,
      normalizedFeatureCount: 3
    }
  });
  result = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(result.reasonCode, "VEGETATION_BUDGET_EXCEEDED");

  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_BUILD"));
  queued = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  harness.setPlanner(queued.queuedViewportGenerationId, {
    result: {
      populationPlanId: `PLAN_${queued.queuedViewportGenerationId}`,
      commands: Array.from({ length: 7 }, (_, index) => ({
        instanceId: `bld-${index}`,
        assetCategory: "building"
      })),
      sourceFeatureCount: 3,
      normalizedFeatureCount: 3
    }
  });
  result = runQueuedAutomaticViewportRefresh(harness.runtime);
  assert.equal(result.reasonCode, "BUILDING_BUDGET_EXCEEDED");
});

test("feature source planner submission and draw failures are handled", () => {
  const featureFailure = createHarness({
    featureSourceFailureReason: "FEATURE_SOURCE_UNAVAILABLE"
  });
  enableAutomaticPopulationFakeRuntime(featureFailure.runtime);
  requestAutomaticViewportRefresh(featureFailure.runtime, createEvent("moveend", "VP_A"));
  let result = runQueuedAutomaticViewportRefresh(featureFailure.runtime);
  assert.equal(result.reasonCode, "FEATURE_SOURCE_UNAVAILABLE");

  const plannerFailure = createHarness({
    plannerFailureReason: "PLANNER_FAILED"
  });
  enableAutomaticPopulationFakeRuntime(plannerFailure.runtime);
  requestAutomaticViewportRefresh(plannerFailure.runtime, createEvent("moveend", "VP_A"));
  result = runQueuedAutomaticViewportRefresh(plannerFailure.runtime);
  assert.equal(result.reasonCode, "PLANNER_FAILED");

  const drawFailure = createHarness();
  enableAutomaticPopulationFakeRuntime(drawFailure.runtime);
  requestAutomaticViewportRefresh(drawFailure.runtime, createEvent("moveend", "VP_A"));
  const queued = getAutomaticPopulationFakeRuntimeStatus(drawFailure.runtime);
  drawFailure.setDraw(queued.queuedViewportGenerationId, {
    failureReason: "DRAW_FAILED"
  });
  result = runQueuedAutomaticViewportRefresh(drawFailure.runtime);
  assert.equal(result.reasonCode, "DRAW_FAILED");
});

test("identity drift and readiness block invalidate and clear automatic refs while external atlas ownership stays untouched", () => {
  const mapMismatch = createHarness({
    identity: { mapIdentityId: "MAP_LIVE" }
  });
  enableAutomaticPopulationFakeRuntime(mapMismatch.runtime);
  const invalidated = requestAutomaticViewportRefresh(
    mapMismatch.runtime,
    createEvent("moveend", "VP_A", { mapIdentityId: "MAP_STALE" })
  );
  assert.equal(invalidated.outcome, "invalidated");
  assert.equal(invalidated.reasonCode, "MAP_IDENTITY_MISMATCH");
  assert.equal(invalidated.status.populationReferenceCount, 0);
  assert.equal(invalidated.status.referencesReleased, true);

  const readinessBlocked = createHarness({
    readinessFailureReason: "READINESS_BLOCKED"
  });
  enableAutomaticPopulationFakeRuntime(readinessBlocked.runtime);
  requestAutomaticViewportRefresh(readinessBlocked.runtime, createEvent("moveend", "VP_B"));
  const blocked = runQueuedAutomaticViewportRefresh(readinessBlocked.runtime);
  assert.equal(blocked.outcome, "invalidated");
  assert.equal(blocked.reasonCode, "READINESS_BLOCKED");
  assert.equal(blocked.status.invalidationReason, "READINESS_BLOCKED");
});

test("disable and explicit invalidation clear automatic refs and remain browser-free", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);
  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_A"));
  runQueuedAutomaticViewportRefresh(harness.runtime);

  const disabled = disableAutomaticPopulationFakeRuntime(harness.runtime);
  assert.equal(disabled.outcome, "disabled");
  assert.equal(disabled.status.state, "disabled");
  assert.equal(disabled.status.populationReferenceCount, 0);
  assert.equal(disabled.status.referencesReleased, true);

  enableAutomaticPopulationFakeRuntime(harness.runtime);
  requestAutomaticViewportRefresh(harness.runtime, createEvent("moveend", "VP_B"));
  const invalidated = invalidateAutomaticViewportPopulation(
    harness.runtime,
    "MANUAL_INVALIDATION"
  );
  assert.equal(invalidated.outcome, "invalidated");
  assert.equal(invalidated.status.state, "invalidated");
  assert.equal(invalidated.status.invalidationReason, "MANUAL_INVALIDATION");
});

test("diagnostics are immutable serializable expose no raw refs and module stays fake only", () => {
  const harness = createHarness();
  enableAutomaticPopulationFakeRuntime(harness.runtime);
  const status = getAutomaticPopulationFakeRuntimeStatus(harness.runtime);
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const previewSource = fs.readFileSync(previewPath, "utf8");
  const designSource = fs.readFileSync(designPath, "utf8");
  const sessionDocSource = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("map" in status, false);
  assert.equal("features" in status, false);
  assert.equal("canvas" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);

  assert.doesNotMatch(moduleSource, /\bwindow\b|\bdocument\b|requestAnimationFrame|setTimeout|setInterval|fetch\s*\(/);
  assert.match(previewSource, /previewAtlasCurrentViewportPopulation/);
  assert.match(designSource, /212\.9 — Automatic Population Fake Runtime Contract/);
  assert.match(sessionDocSource, /AUTOMATIC POPULATION FAKE RUNTIME|AUTOMATIC_POPULATION_FAKE_RUNTIME/);
});
