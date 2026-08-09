import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasBatchOrchestrationAuditTrails,
  getDeveloperOnlyAtlasBatchOrchestrationAuditTrailsStatus,
  resolveDeveloperOnlyAtlasBatchOrchestrationAuditTrail
} from "../client/developer-only-atlas-batch-orchestration-audit-trails.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_68_BATCH_ORCHESTRATION_AUDIT_TRAILS.md"
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
    selectorSeed: "BATCH_ORCHESTRATION_SELECTOR_001",
    viewportId: "BATCH_ORCHESTRATION_VIEWPORT_001",
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

function resolveBatch(overrides = {}) {
  const registry = createDeveloperOnlyAtlasBatchOrchestrationAuditTrails();
  return resolveDeveloperOnlyAtlasBatchOrchestrationAuditTrail(registry, {
    productionBundleId: "ATLAS_PRODUCTION_BUNDLE_COASTAL_TREE_001",
    assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_COASTAL_TREE_001",
    ...overrides
  });
}

test("1. batch grouping stable", () => {
  const first = resolveBatch();
  const second = resolveBatch();

  assert.deepEqual(first, second);
  assert.equal(typeof first.productionBatchId, "string");
});

test("2. audit records deterministic", () => {
  const result = resolveBatch();

  assert.equal(typeof result.auditTrailId, "string");
  assert.equal(result.reasonCode, "RESOLVED");
  assert.equal(result.auditTrailId.includes("BELLARINE_COASTAL"), true);
});

test("3. dependencies valid", () => {
  const result = resolveBatch({
    productionBundleId: "ATLAS_PRODUCTION_BUNDLE_HERITAGE_CIVIC_001",
    assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_HERITAGE_CIVIC_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.batchDependencyCount >= 1, true);
});

test("4. same input same output", () => {
  const first = resolveBatch({
    productionBundleId: "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_COMPACT_001",
    assetJobTicketId:
      "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_COMPACT_001"
  });
  const second = resolveBatch({
    productionBundleId: "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_COMPACT_001",
    assetJobTicketId:
      "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_COMPACT_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes batch orchestration diagnostics", () => {
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
  assert.equal(plan.batchOrchestrationAuditTrailDecisions.length >= 1, true);
  assert.equal(typeof status.productionBatchId, "string");
  assert.equal(typeof status.auditTrailId, "string");
  assert.equal(typeof status.batchAssetCount, "number");
  assert.equal(typeof status.batchDependencyCount, "number");
  assert.equal(typeof status.orchestrationReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "productionBatchId" in entry &&
        "auditTrailId" in entry &&
        "batchAssetCount" in entry &&
        "batchDependencyCount" in entry &&
        "orchestrationReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasBatchOrchestrationAuditTrails();
  const status = getDeveloperOnlyAtlasBatchOrchestrationAuditTrailsStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredBatchOrchestrationRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /productionBatchId/);
  assert.match(source, /auditTrailId/);
  assert.match(source, /batchAssetCount/);
  assert.match(source, /batchDependencyCount/);
  assert.match(source, /orchestrationReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
