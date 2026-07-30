import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const auditRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001"
);

const auditPath = path.join(
  auditRoot,
  "audit/atlas-alpha-final-safety-audit-record.json"
);
const checklistPath = path.join(
  auditRoot,
  "checklist/atlas-alpha-final-readiness-checklist.json"
);
const validationPath = path.join(
  auditRoot,
  "validation/atlas-alpha-final-safety-validation.json"
);
const lifecyclePath = path.join(
  auditRoot,
  "lifecycle/atlas-alpha-final-safety-lifecycle.json"
);
const reportPath = path.join(
  auditRoot,
  "reports/atlas-alpha-final-safety-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-alpha-final-safety-audit.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas alpha final safety audit is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAlphaFinalSafetyAudit({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasAlphaFinalSafetyAudit({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.auditRecord, second.auditRecord);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas alpha final safety audit covers approval, permission, package, budget, determinism, adapter, monitoring, rollback, and failure handling", () => {
  const result = moduleUnderTest.buildAtlasAlphaFinalSafetyAudit({
    cwd: repoRoot
  });

  assert.equal(
    result.auditRecord.approvalState.approvalStatus,
    "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION"
  );
  assert.equal(result.auditRecord.packageValidation.status, "pass");
  assert.equal(result.auditRecord.budgetValidation.status, "pass");
  assert.equal(result.auditRecord.deterministicBehaviour.adapterValidationStatus, "pass");
  assert.equal(result.auditRecord.monitoringReadiness.validationStatus, "pass");
  assert.equal(result.auditRecord.rollbackReadiness.controlledAttachmentCheck, true);
  assert.equal(result.auditRecord.failureHandling.monitoringCheck, true);
  assert.equal(result.checklist.items.length, 9);
});

test("atlas alpha final safety audit preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasAlphaFinalSafetyAudit({
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

test("atlas alpha final safety audit writes records and passes the final alpha gate", () => {
  moduleUnderTest.writeAtlasAlphaFinalSafetyAudit({ cwd: repoRoot });

  const auditRecord = readJson(auditPath);
  const checklist = readJson(checklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(auditRecord.auditedOn, "2026-07-30");
  assert.equal(checklist.failCount, 0);
  assert.equal(checklist.passCount, checklist.items.length);
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "ALPHA_FINAL_GATE_PASSED");
  assert.match(report, /Final alpha gate status: PASS/);
});
