import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-dry-run-review/ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001"
);

const reviewRecordPath = path.join(
  reviewRoot,
  "review/atlas-developer-alpha-dry-run-review-record.json"
);
const checklistPath = path.join(
  reviewRoot,
  "checklist/atlas-developer-alpha-dry-run-review-checklist.json"
);
const findingsPath = path.join(
  reviewRoot,
  "findings/atlas-developer-alpha-dry-run-findings-report.json"
);
const validationPath = path.join(
  reviewRoot,
  "validation/atlas-developer-alpha-dry-run-review-validation.json"
);
const lifecyclePath = path.join(
  reviewRoot,
  "lifecycle/atlas-developer-alpha-dry-run-review-lifecycle.json"
);
const reportPath = path.join(
  reviewRoot,
  "reports/atlas-developer-alpha-dry-run-review-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-dry-run-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha dry-run review is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaDryRunReview({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaDryRunReview({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.reviewRecord, second.reviewRecord);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.findingsReport, second.findingsReport);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha dry-run review covers state machine, telemetry, monitoring, rollback, operator workflow, stop conditions, and audit completeness", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaDryRunReview({
    cwd: repoRoot
  });

  const areas = result.checklist.items.map((item) => item.area);
  assert.equal(areas.includes("state_machine_behaviour"), true);
  assert.equal(areas.includes("telemetry_completeness"), true);
  assert.equal(areas.includes("monitoring_outputs"), true);
  assert.equal(areas.includes("rollback_handling"), true);
  assert.equal(areas.includes("operator_workflow"), true);
  assert.equal(areas.includes("stop_conditions"), true);
  assert.equal(areas.includes("audit_completeness"), true);
  assert.equal(result.findingsReport.findings.length, 7);
});

test("atlas developer alpha dry-run review preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaDryRunReview({
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

test("atlas developer alpha dry-run review writes records and reaches final dry-run readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaDryRunReview({ cwd: repoRoot });

  const reviewRecord = readJson(reviewRecordPath);
  const checklist = readJson(checklistPath);
  const findings = readJson(findingsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(reviewRecord.reviewedOn, "2026-07-30");
  assert.equal(checklist.items.length, 7);
  assert.equal(findings.findings.length, 7);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "DRY_RUN_REVIEW_COMPLETE_READY_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
  );
  assert.match(
    report,
    /Developer alpha dry-run review status: READY_FOR_FUTURE_MANUAL_DEVELOPER_SESSION/
  );
});
