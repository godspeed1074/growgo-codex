import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const monitoringRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001"
);

const specificationPath = path.join(
  monitoringRoot,
  "specification/atlas-admin-monitoring-specification.json"
);
const dataModelPath = path.join(
  monitoringRoot,
  "data-model/atlas-admin-monitoring-data-model.json"
);
const validationPath = path.join(
  monitoringRoot,
  "validation/atlas-admin-monitoring-validation.json"
);
const lifecyclePath = path.join(
  monitoringRoot,
  "lifecycle/atlas-admin-monitoring-lifecycle-record.json"
);
const reportPath = path.join(
  monitoringRoot,
  "reports/atlas-admin-monitoring-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-admin-monitoring-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas admin monitoring planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAdminMonitoringPlanning({ cwd: repoRoot });
  const second = moduleUnderTest.buildAtlasAdminMonitoringPlanning({ cwd: repoRoot });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.dataModel, second.dataModel);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas admin monitoring planning defines dashboard metrics, health, analytics, budget visibility, failures, generation stats, backend load, and cost visibility", () => {
  const planning = moduleUnderTest.buildAtlasAdminMonitoringPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.atlasDashboardMetrics.totalApprovedRecipes >= 2, true);
  assert.equal(specification.packageHealthMonitoring.healthStates.includes("BLOCKED"), true);
  assert.equal(specification.recipeUsageAnalytics.usageByRecipeId.length >= 2, true);
  assert.equal(specification.budgetWarnings.warningStateCount >= 4, true);
  assert.equal(specification.validationFailures.pipelineBlockedCount >= 1, true);
  assert.equal(specification.generationStatistics.averageGenerationKb > 0, true);
  assert.equal(specification.backendWorkloadIndicators.validationPassesPerPackage >= 1, true);
  assert.equal(specification.costVisibility.averagePerRegionStorageKb > 0, true);
});

test("atlas admin monitoring planning builds a read-only admin data model with dashboard cards and tables", () => {
  const planning = moduleUnderTest.buildAtlasAdminMonitoringPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.dataModel.dashboardCards.length >= 4, true);
  assert.equal(planning.dataModel.tables.recipeUsage.length >= 2, true);
  assert.equal(planning.dataModel.tables.budgetRecommendations.length >= 4, true);
  assert.equal(planning.dataModel.tables.blockedScenarios.length >= 1, true);
});

test("atlas admin monitoring planning writes records and keeps all unsafe operations blocked", () => {
  moduleUnderTest.writeAtlasAdminMonitoringPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const dataModel = readJson(dataModelPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.dashboardReadOnly, true);
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.downloadsAuthorized, false);
  assert.equal(lifecycle.blenderAuthorized, false);
  assert.equal(lifecycle.glbAuthorized, false);
  assert.equal(lifecycle.assetModificationAuthorized, false);
  assert.equal(specification.atlasDashboardMetrics.pipelineScenarioCount, 5);
  assert.equal(dataModel.dashboardCards.some((card) => card.cardId === "BUDGET_STATUS"), true);
  assert.match(report, /Future Atlas operations: READY/);
});
