import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasProductionBundlesJobTickets,
  getDeveloperOnlyAtlasProductionBundlesJobTicketsStatus,
  resolveDeveloperOnlyAtlasProductionBundleJobTicket
} from "../client/developer-only-atlas-production-bundles-job-tickets.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_67_PRODUCTION_BUNDLES_JOB_TICKETS.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "coastal_green",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "green:near_coast"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "PRODUCTION_BUNDLE_SELECTOR_001",
    viewportId: "PRODUCTION_BUNDLE_VIEWPORT_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [],
    relationshipContext: { roadWays: [] },
    ...overrides
  };
}

function resolveProductionBundle(overrides = {}) {
  const registry = createDeveloperOnlyAtlasProductionBundlesJobTickets();
  return resolveDeveloperOnlyAtlasProductionBundleJobTicket(registry, {
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_COASTAL_TREE_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_VEGETATION_001",
    factoryValidationStatus: "ready",
    ...overrides
  });
}

test("1. bundle creation stable", () => {
  const first = resolveProductionBundle();
  const second = resolveProductionBundle();

  assert.deepEqual(first, second);
  assert.equal(typeof first.productionBundleId, "string");
});

test("2. job tickets deterministic", () => {
  const result = resolveProductionBundle();

  assert.equal(typeof result.assetJobTicketId, "string");
  assert.equal(result.reasonCode, "RESOLVED");
  assert.equal(result.assetJobTicketId.includes("COASTAL_TREE"), true);
});

test("3. dependencies valid", () => {
  const result = resolveProductionBundle({
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_HERITAGE_CIVIC_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.jobDependencyCount >= 1, true);
});

test("4. priorities consistent", () => {
  const first = resolveProductionBundle({
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_URBAN_COMMERCIAL_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_URBAN_COMMERCIAL_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001"
  });
  const second = resolveProductionBundle({
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_URBAN_COMMERCIAL_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_URBAN_COMMERCIAL_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001"
  });

  assert.equal(first.factoryQueuePriority, second.factoryQueuePriority);
  assert.equal(first.factoryQueuePriority > 0, true);
});

test("5. same input same output", () => {
  const first = resolveProductionBundle({
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_COMPACT_001",
    generationQueueProfileId:
      "ATLAS_GENERATION_QUEUE_STREETSCAPE_COMPACT_001"
  });
  const second = resolveProductionBundle({
    productionReadinessProfileId:
      "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_COMPACT_001",
    generationQueueProfileId:
      "ATLAS_GENERATION_QUEUE_STREETSCAPE_COMPACT_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes production bundle diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "civic-plan-001",
          featureClass: "civic_site",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.productionBundleJobTicketDecisions.length >= 1, true);
  assert.equal(typeof status.productionBundleId, "string");
  assert.equal(typeof status.assetJobTicketId, "string");
  assert.equal(typeof status.factoryQueuePriority, "number");
  assert.equal(typeof status.jobDependencyCount, "number");
  assert.equal(typeof status.productionBundleReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "productionBundleId" in entry &&
        "assetJobTicketId" in entry &&
        "factoryQueuePriority" in entry &&
        "jobDependencyCount" in entry &&
        "productionBundleReason" in entry
    ),
    true
  );
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasProductionBundlesJobTickets();
  const status = getDeveloperOnlyAtlasProductionBundlesJobTicketsStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredProductionBundleRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /productionBundleId/);
  assert.match(source, /assetJobTicketId/);
  assert.match(source, /factoryQueuePriority/);
  assert.match(source, /jobDependencyCount/);
  assert.match(source, /productionBundleReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
