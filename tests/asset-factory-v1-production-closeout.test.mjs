import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const checklistPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-new-asset-production-checklist.md"
);
const intakeDocPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-new-asset-intake-template.md"
);
const intakeJsonPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "templates",
  "ASSET_FACTORY_V1_NEW_ASSET_INTAKE_TEMPLATE.json"
);
const codexWorkflowPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-codex-workflow-instructions.md"
);
const revisionWorkflowPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-revision-workflow.md"
);
const readinessReportPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-factory-readiness-report.md"
);

test("new asset production checklist exists and covers the full production sequence", () => {
  const checklist = fs.readFileSync(checklistPath, "utf8");

  for (const item of [
    "Asset request",
    "Family assignment",
    "Asset ID creation",
    "Recipe ID creation",
    "Specification",
    "Authoring setup",
    "Blender generation",
    "Source verification",
    "Universal export",
    "GLB validation",
    "Visual review",
    "Registration",
    "Promotion"
  ]) {
    assert.match(checklist, new RegExp(item, "i"));
  }
});

test("new asset intake templates exist and define the required inputs", () => {
  const intakeDoc = fs.readFileSync(intakeDocPath, "utf8");
  const intakeJson = JSON.parse(fs.readFileSync(intakeJsonPath, "utf8"));

  for (const item of [
    "asset name",
    "family",
    "purpose",
    "biome/theme",
    "expected LODs",
    "performance budget",
    "dependencies",
    "visual references",
    "approval criteria"
  ]) {
    assert.match(intakeDoc, new RegExp(item, "i"));
  }

  assert.deepEqual(intakeJson.requiredInputs, [
    "assetName",
    "family",
    "purpose",
    "biomeTheme",
    "expectedLods",
    "performanceBudget",
    "dependencies",
    "visualReferences",
    "approvalCriteria"
  ]);
});

test("workflow documentation exists for Codex operations, revisions, and readiness closeout", () => {
  const codexWorkflow = fs.readFileSync(codexWorkflowPath, "utf8");
  const revisionWorkflow = fs.readFileSync(revisionWorkflowPath, "utf8");
  const readinessReport = fs.readFileSync(readinessReportPath, "utf8");

  assert.match(codexWorkflow, /What Codex Should Do Automatically/);
  assert.match(codexWorkflow, /What Requires Manual Blender Review/);
  assert.match(codexWorkflow, /What Requires Human Approval/);
  assert.match(codexWorkflow, /When Commits Should Happen/);

  assert.match(revisionWorkflow, /v001 creation/i);
  assert.match(revisionWorkflow, /v002\+ revision/i);
  assert.match(revisionWorkflow, /protected history/i);
  assert.match(revisionWorkflow, /promotion/i);

  assert.match(readinessReport, /Proven Systems/);
  assert.match(readinessReport, /Remaining Limitations/);
  assert.match(readinessReport, /Known Risks/);
  assert.match(readinessReport, /Recommended Next Asset Workflow/);
});
