import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001"
);

const reviewRecordPath = path.join(
  reviewRoot,
  "review/atlas-developer-alpha-execution-review-record.json"
);
const checklistPath = path.join(
  reviewRoot,
  "checklist/atlas-developer-alpha-reviewer-checklist.json"
);
const conditionsPath = path.join(
  reviewRoot,
  "conditions/atlas-developer-alpha-execution-approval-conditions.json"
);
const validationPath = path.join(
  reviewRoot,
  "validation/atlas-developer-alpha-execution-review-validation.json"
);
const lifecyclePath = path.join(
  reviewRoot,
  "lifecycle/atlas-developer-alpha-execution-review-lifecycle.json"
);
const reportPath = path.join(
  reviewRoot,
  "reports/atlas-developer-alpha-execution-review-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-execution-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha execution review is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaExecutionReview({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaExecutionReview({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.reviewRecord, second.reviewRecord);
  assert.deepEqual(first.reviewerChecklist, second.reviewerChecklist);
  assert.deepEqual(first.approvalConditions, second.approvalConditions);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha execution review covers scope, users, duration, safety, monitoring, rollback, criteria, and rehearsal evidence", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionReview({
    cwd: repoRoot
  });

  const areas = result.reviewerChecklist.items.map((item) => item.area);

  assert.equal(areas.includes("alpha_scope"), true);
  assert.equal(areas.includes("authorized_users"), true);
  assert.equal(areas.includes("duration"), true);
  assert.equal(areas.includes("safety_flags"), true);
  assert.equal(areas.includes("monitoring_readiness"), true);
  assert.equal(areas.includes("rollback_readiness"), true);
  assert.equal(areas.includes("success_criteria"), true);
  assert.equal(areas.includes("failure_criteria"), true);
  assert.equal(areas.includes("rehearsal_results"), true);
  assert.equal(result.reviewRecord.durationLimitMinutes, 30);
  assert.equal(result.reviewRecord.rehearsalResults.successfulSessions, 1);
  assert.equal(result.reviewRecord.rehearsalResults.warningSessions, 1);
  assert.equal(result.reviewRecord.rehearsalResults.stoppedSessions, 2);
});

test("atlas developer alpha execution review preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionReview({
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

test("atlas developer alpha execution review writes records and reaches final human review completion", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaExecutionReview({ cwd: repoRoot });

  const reviewRecord = readJson(reviewRecordPath);
  const checklist = readJson(checklistPath);
  const approvalConditions = readJson(conditionsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(reviewRecord.reviewedOn, "2026-07-30");
  assert.equal(checklist.items.length, 9);
  assert.equal(approvalConditions.conditions.length >= 10, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FINAL_HUMAN_REVIEW_COMPLETE_PENDING_MANUAL_DEVELOPER_ALPHA_EXECUTION"
  );
  assert.match(
    report,
    /Developer alpha execution review status: READY_FOR_FUTURE_MANUAL_DEVELOPER_ONLY_ALPHA_EXECUTION/
  );
});
