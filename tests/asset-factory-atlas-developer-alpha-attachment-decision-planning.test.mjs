import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const decisionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001"
);

const frameworkPath = path.join(
  decisionRoot,
  "framework/atlas-developer-alpha-decision-framework.json"
);
const experimentPath = path.join(
  decisionRoot,
  "experiment/atlas-developer-alpha-experiment-specification.json"
);
const validationPath = path.join(
  decisionRoot,
  "validation/atlas-developer-alpha-decision-validation.json"
);
const lifecyclePath = path.join(
  decisionRoot,
  "lifecycle/atlas-developer-alpha-decision-lifecycle.json"
);
const reportPath = path.join(
  decisionRoot,
  "reports/atlas-developer-alpha-decision-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-attachment-decision-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha attachment decision planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaAttachmentDecisionPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaAttachmentDecisionPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.decisionFramework, second.decisionFramework);
  assert.deepEqual(first.experimentSpecification, second.experimentSpecification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha attachment decision planning defines tiny internal scope, permitted region, user bounds, metrics, failure criteria, rollback, duration, exit conditions, and approvals", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaAttachmentDecisionPlanning({
    cwd: repoRoot
  });

  assert.equal(
    result.decisionFramework.alphaExperimentScope.scopeType,
    "TINY_INTERNAL_ATTACHMENT_EXPERIMENT"
  );
  assert.equal(
    result.decisionFramework.permittedTestRegion.expectedRecipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(result.decisionFramework.testUserBoundaries.playerAccountsAllowed, false);
  assert.equal(result.decisionFramework.successMetrics.length >= 4, true);
  assert.equal(result.decisionFramework.failureCriteria.length >= 5, true);
  assert.equal(result.decisionFramework.rollbackOwner.ownerRole, "atlas_operator");
  assert.equal(
    result.decisionFramework.experimentDuration.maximumActiveWindowMinutes,
    30
  );
  assert.equal(result.decisionFramework.exitConditions.length >= 5, true);
  assert.equal(result.decisionFramework.approvalRequirements.length >= 4, true);
});

test("atlas developer alpha attachment decision planning preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaAttachmentDecisionPlanning({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.blenderAuthorized, false);
  assert.equal(result.validation.glbAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("atlas developer alpha attachment decision planning writes records and reaches decision readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaAttachmentDecisionPlanning({
    cwd: repoRoot
  });

  const framework = readJson(frameworkPath);
  const experiment = readJson(experimentPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(framework.decidedOn, "2026-07-30");
  assert.equal(experiment.experimentState, "DECISION_PENDING_MANUAL_GO_NO_GO");
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "READY_FOR_DEVELOPER_ALPHA_DECISION");
  assert.match(report, /Developer alpha decision readiness: READY_FOR_GO_NO_GO_REVIEW/);
});
