import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-alpha-readiness-review/ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001"
);

const checklistPath = path.join(
  reviewRoot,
  "checklist/atlas-alpha-attachment-readiness-checklist.json"
);
const reviewRecordPath = path.join(
  reviewRoot,
  "review/atlas-alpha-attachment-readiness-review-record.json"
);
const validationPath = path.join(
  reviewRoot,
  "validation/atlas-alpha-attachment-readiness-validation.json"
);
const lifecyclePath = path.join(
  reviewRoot,
  "lifecycle/atlas-alpha-attachment-readiness-lifecycle.json"
);
const reportPath = path.join(
  reviewRoot,
  "reports/atlas-alpha-attachment-readiness-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-alpha-attachment-readiness-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas alpha attachment readiness review is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAlphaAttachmentReadinessReview({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasAlphaAttachmentReadinessReview({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.reviewRecord, second.reviewRecord);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas alpha attachment readiness review covers required review areas", () => {
  const review = moduleUnderTest.buildAtlasAlphaAttachmentReadinessReview({
    cwd: repoRoot
  });

  assert.equal(review.checklist.checklist.length, 8);
  assert.equal(
    review.checklist.checklist.every((item) => item.status === "PASS"),
    true
  );
  assert.equal(
    review.reviewRecord.readinessDecision,
    "READY_FOR_MANUAL_ALPHA_APPROVAL"
  );
});

test("atlas alpha attachment readiness review preserves non-runtime alpha posture", () => {
  const review = moduleUnderTest.buildAtlasAlphaAttachmentReadinessReview({
    cwd: repoRoot
  });

  assert.equal(review.validation.status, "pass");
  assert.equal(review.lifecycle.lifecycleStatus, "ALPHA_READY_PENDING_MANUAL_APPROVAL");
  assert.equal(review.lifecycle.manualApprovalRequired, true);
  assert.equal(review.validation.runtimeActivationAuthorized, false);
  assert.equal(review.validation.rendererAttachmentAuthorized, false);
  assert.equal(review.validation.mapDownloadsAuthorized, false);
  assert.equal(review.validation.blenderAuthorized, false);
  assert.equal(review.validation.glbAuthorized, false);
  assert.equal(review.validation.assetModificationAuthorized, false);
});

test("atlas alpha attachment readiness review writes records and reports final readiness", () => {
  moduleUnderTest.writeAtlasAlphaAttachmentReadinessReview({ cwd: repoRoot });

  const checklist = readJson(checklistPath);
  const reviewRecord = readJson(reviewRecordPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(checklist.checklist.length, 8);
  assert.equal(reviewRecord.readinessDecision, "READY_FOR_MANUAL_ALPHA_APPROVAL");
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "ALPHA_READY_PENDING_MANUAL_APPROVAL");
  assert.match(report, /Final alpha readiness status: ALPHA_READY_PENDING_MANUAL_APPROVAL/);
});
