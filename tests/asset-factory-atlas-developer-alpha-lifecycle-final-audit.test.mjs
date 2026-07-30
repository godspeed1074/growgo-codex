import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const auditRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001"
);

const auditRecordPath = path.join(
  auditRoot,
  "record/atlas-developer-alpha-lifecycle-final-audit-record.json"
);
const checklistPath = path.join(
  auditRoot,
  "checklist/atlas-developer-alpha-lifecycle-certification-checklist.json"
);
const validationPath = path.join(
  auditRoot,
  "validation/atlas-developer-alpha-lifecycle-final-audit-validation.json"
);
const lifecyclePath = path.join(
  auditRoot,
  "lifecycle/atlas-developer-alpha-lifecycle-final-audit-lifecycle.json"
);
const summaryPath = path.join(
  auditRoot,
  "reports/atlas-developer-alpha-lifecycle-architecture-summary.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-lifecycle-final-audit.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha lifecycle final audit is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaLifecycleFinalAudit({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaLifecycleFinalAudit({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.auditRecord, second.auditRecord);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha lifecycle final audit covers governance, authorization, scope, state machine, telemetry, monitoring, rollback, lifecycle consistency, and blocked runtime preservation", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaLifecycleFinalAudit({
    cwd: repoRoot
  });

  const areas = result.checklist.items.map((item) => item.area);
  assert.equal(areas.includes("governance_consistency"), true);
  assert.equal(areas.includes("authorization_validity"), true);
  assert.equal(areas.includes("scope_consistency"), true);
  assert.equal(areas.includes("state_machine_integrity"), true);
  assert.equal(areas.includes("telemetry_completeness"), true);
  assert.equal(areas.includes("monitoring_readiness"), true);
  assert.equal(areas.includes("rollback_readiness"), true);
  assert.equal(areas.includes("lifecycle_consistency"), true);
  assert.equal(areas.includes("blocked_runtime_preservation"), true);
  assert.equal(
    result.auditRecord.certificationStatus,
    "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
  );
});

test("atlas developer alpha lifecycle final audit preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaLifecycleFinalAudit({
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

test("atlas developer alpha lifecycle final audit writes records and reaches lifecycle certification", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaLifecycleFinalAudit({ cwd: repoRoot });

  const auditRecord = readJson(auditRecordPath);
  const checklist = readJson(checklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const summary = fs.readFileSync(summaryPath, "utf8");

  assert.equal(auditRecord.auditedOn, "2026-07-30");
  assert.equal(checklist.items.length, 9);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "LIFECYCLE_CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
  );
  assert.match(
    summary,
    /Developer alpha lifecycle certification: CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION/
  );
});
