import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const executionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001"
);

const checklistPath = path.join(
  executionRoot,
  "checklist/atlas-developer-alpha-execution-checklist.json"
);
const runbookPath = path.join(
  executionRoot,
  "runbook/atlas-developer-alpha-operator-runbook.json"
);
const validationPath = path.join(
  executionRoot,
  "validation/atlas-developer-alpha-execution-validation.json"
);
const lifecyclePath = path.join(
  executionRoot,
  "lifecycle/atlas-developer-alpha-execution-lifecycle.json"
);
const reportPath = path.join(
  executionRoot,
  "reports/atlas-developer-alpha-execution-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-execution-checklist.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha execution checklist is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaExecutionChecklist({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaExecutionChecklist({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.runbook, second.runbook);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha execution checklist defines pre-flight, environment, operator, monitoring, stop, rollback, exit, and audit steps", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionChecklist({
    cwd: repoRoot
  });

  assert.equal(result.checklist.preFlightChecklist.length >= 4, true);
  assert.equal(result.checklist.environmentVerification.length >= 5, true);
  assert.equal(result.checklist.operatorSteps.length >= 5, true);
  assert.equal(result.checklist.monitoringChecklist.length >= 5, true);
  assert.equal(result.checklist.stopConditions.length >= 5, true);
  assert.equal(result.checklist.rollbackProcedure.length >= 4, true);
  assert.equal(result.checklist.exitProcedure.length >= 4, true);
  assert.equal(result.checklist.auditRequirements.length >= 4, true);
  assert.equal(result.runbook.executionSequence.length, 5);
});

test("atlas developer alpha execution checklist preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionChecklist({
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

test("atlas developer alpha execution checklist writes records and reaches future session readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaExecutionChecklist({ cwd: repoRoot });

  const checklist = readJson(checklistPath);
  const runbook = readJson(runbookPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(checklist.recordedOn, "2026-07-30");
  assert.equal(runbook.sessionMode, "MANUAL_DEVELOPER_REVIEW_ONLY");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REHEARSAL"
  );
  assert.match(
    report,
    /Developer alpha execution readiness: READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REHEARSAL/
  );
});
