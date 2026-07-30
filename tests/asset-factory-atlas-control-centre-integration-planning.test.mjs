import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const controlCentreRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001"
);

const specificationPath = path.join(
  controlCentreRoot,
  "specification/atlas-control-centre-integration-specification.json"
);
const dataModelPath = path.join(
  controlCentreRoot,
  "data-model/atlas-control-centre-integration-data-model.json"
);
const validationPath = path.join(
  controlCentreRoot,
  "validation/atlas-control-centre-integration-validation.json"
);
const lifecyclePath = path.join(
  controlCentreRoot,
  "lifecycle/atlas-control-centre-integration-lifecycle-record.json"
);
const reportPath = path.join(
  controlCentreRoot,
  "reports/atlas-control-centre-integration-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-control-centre-integration-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas control centre integration planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasControlCentreIntegrationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasControlCentreIntegrationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.dataModel, second.dataModel);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas control centre integration planning defines dashboard, recipe, package, budget, approval, version, operator, and audit areas", () => {
  const planning = moduleUnderTest.buildAtlasControlCentreIntegrationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.atlasDashboardIntegration.dashboardCards.length >= 4, true);
  assert.equal(specification.recipeManagementViews.viewIds.length >= 4, true);
  assert.equal(specification.packageHealthViews.viewIds.length >= 4, true);
  assert.equal(specification.budgetAlertWorkflows.operatorResponses.length >= 4, true);
  assert.equal(specification.approvalWorkflows.phases.length >= 4, true);
  assert.equal(specification.versionComparison.comparisonTargets.length >= 4, true);
  assert.equal(specification.operatorActions.allowedActions.length >= 4, true);
  assert.equal(specification.auditLogging.logTypes.length >= 4, true);
});

test("atlas control centre integration planning builds a read-only data model with operator-safe views", () => {
  const planning = moduleUnderTest.buildAtlasControlCentreIntegrationPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.dataModel.dashboardPanels.length >= 5, true);
  assert.equal(planning.dataModel.views.recipeManagement.length >= 2, true);
  assert.equal(planning.dataModel.views.budgetAlerts.length >= 4, true);
  assert.equal(planning.dataModel.views.auditTrailTemplates.every((entry) => entry.readOnly === true), true);
});

test("atlas control centre integration planning writes records and keeps runtime/player exposure blocked", () => {
  moduleUnderTest.writeAtlasControlCentreIntegrationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const dataModel = readJson(dataModelPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.dashboardReadOnly, true);
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.playerExposureAuthorized, false);
  assert.equal(lifecycle.blenderAuthorized, false);
  assert.equal(lifecycle.glbAuthorized, false);
  assert.equal(lifecycle.assetModificationAuthorized, false);
  assert.equal(specification.controlAreas.includes("AUDIT"), true);
  assert.equal(dataModel.dashboardPanels.some((panel) => panel.panelId === "BUDGET_ALERTS"), true);
  assert.match(report, /Future Control Centre development: READY/);
});
