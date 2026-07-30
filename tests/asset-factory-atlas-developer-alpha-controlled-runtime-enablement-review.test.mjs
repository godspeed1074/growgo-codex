import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const reviewRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001"
);

const reviewRecordPath = path.join(
  reviewRoot,
  "record/atlas-developer-alpha-controlled-runtime-enablement-review-record.json"
);
const checklistPath = path.join(
  reviewRoot,
  "checklist/atlas-developer-alpha-controlled-runtime-reviewer-checklist.json"
);
const approvalConditionsPath = path.join(
  reviewRoot,
  "approval/atlas-developer-alpha-controlled-runtime-approval-conditions.json"
);
const validationPath = path.join(
  reviewRoot,
  "validation/atlas-developer-alpha-controlled-runtime-enablement-review-validation.json"
);
const lifecyclePath = path.join(
  reviewRoot,
  "lifecycle/atlas-developer-alpha-controlled-runtime-enablement-review-lifecycle.json"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-controlled-runtime-enablement-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("controlled runtime enablement review is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.reviewRecord, second.reviewRecord);
  assert.deepEqual(first.reviewerChecklist, second.reviewerChecklist);
  assert.deepEqual(first.approvalConditions, second.approvalConditions);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("controlled runtime enablement review preserves the single approved region and recipe", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd: repoRoot
  });

  assert.equal(
    result.reviewRecord.approvedRuntimeWindow.approvedRegion,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.reviewRecord.approvedRuntimeWindow.approvedRecipe,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(result.reviewRecord.approvedRuntimeWindow.packageVersion, "v001");
  assert.equal(result.reviewRecord.safetyState.runtimeExecutionEnabled, false);
});

test("controlled runtime enablement review keeps runtime, map, and renderer blocked while preparing the gate", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
  assert.equal(
    result.approvalConditions.enablementState,
    "READY_FOR_MANUAL_RUNTIME_FLAG_TRANSITION_REVIEW"
  );
});

test("controlled runtime enablement review writes records and reaches approved pending manual transition status", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd: repoRoot
  });

  const reviewRecord = readJson(reviewRecordPath);
  const checklist = readJson(checklistPath);
  const approvalConditions = readJson(approvalConditionsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(reviewRecord.reviewedOn, "2026-07-30");
  assert.equal(checklist.checklist.length, 10);
  assert.equal(
    approvalConditions.enablementState,
    "READY_FOR_MANUAL_RUNTIME_FLAG_TRANSITION_REVIEW"
  );
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "ENABLEMENT_REVIEW_APPROVED_PENDING_MANUAL_RUNTIME_FLAG_TRANSITION"
  );
});
