import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const finalCheckRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001"
);

const recordPath = path.join(
  finalCheckRoot,
  "record/atlas-developer-alpha-final-check-record.json"
);
const checklistPath = path.join(
  finalCheckRoot,
  "checklist/atlas-developer-alpha-verification-checklist.json"
);
const validationPath = path.join(
  finalCheckRoot,
  "validation/atlas-developer-alpha-final-check-validation.json"
);
const lifecyclePath = path.join(
  finalCheckRoot,
  "lifecycle/atlas-developer-alpha-final-check-lifecycle.json"
);
const reportPath = path.join(
  finalCheckRoot,
  "reports/atlas-developer-alpha-final-check-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-execution-final-check.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha execution final check is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaExecutionFinalCheck({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaExecutionFinalCheck({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.finalCheckRecord, second.finalCheckRecord);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha execution final check verifies repository, required records, scope, monitoring, rollback, and approval conditions", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionFinalCheck({
    cwd: repoRoot
  });

  const areas = result.checklist.items.map((item) => item.area);
  assert.equal(areas.includes("repository_readiness"), true);
  assert.equal(areas.includes("required_records"), true);
  assert.equal(areas.includes("safety_flags"), true);
  assert.equal(areas.includes("alpha_scope"), true);
  assert.equal(areas.includes("monitoring_readiness"), true);
  assert.equal(areas.includes("rollback_readiness"), true);
  assert.equal(areas.includes("approval_conditions"), true);
  assert.equal(
    result.finalCheckRecord.finalReadinessState,
    "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
});

test("atlas developer alpha execution final check preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionFinalCheck({
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

test("atlas developer alpha execution final check writes records and reaches final readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaExecutionFinalCheck({ cwd: repoRoot });

  const record = readJson(recordPath);
  const checklist = readJson(checklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(record.verifiedOn, "2026-07-30");
  assert.equal(checklist.repositoryStatus.gitStatusCaptured, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FINAL_CHECK_COMPLETE_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha final readiness state: READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
