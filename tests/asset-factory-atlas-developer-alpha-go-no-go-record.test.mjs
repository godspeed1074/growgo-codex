import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recordRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001"
);

const decisionPath = path.join(
  recordRoot,
  "decision/atlas-developer-alpha-go-no-go-decision-record.json"
);
const reviewerPath = path.join(
  recordRoot,
  "reviewer/atlas-developer-alpha-reviewer-record.json"
);
const scopePath = path.join(
  recordRoot,
  "scope/atlas-developer-alpha-approved-scope-record.json"
);
const rationalePath = path.join(
  recordRoot,
  "rationale/atlas-developer-alpha-decision-rationale.json"
);
const conditionsPath = path.join(
  recordRoot,
  "conditions/atlas-developer-alpha-conditions-of-approval.json"
);
const validationPath = path.join(
  recordRoot,
  "validation/atlas-developer-alpha-go-no-go-validation.json"
);
const lifecyclePath = path.join(
  recordRoot,
  "lifecycle/atlas-developer-alpha-go-no-go-lifecycle.json"
);
const reportPath = path.join(
  recordRoot,
  "reports/atlas-developer-alpha-go-no-go-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-go-no-go-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha go/no-go record is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaGoNoGoRecord({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaGoNoGoRecord({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.decisionRecord, second.decisionRecord);
  assert.deepEqual(first.reviewerRecord, second.reviewerRecord);
  assert.deepEqual(first.approvedScopeRecord, second.approvedScopeRecord);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha go/no-go record defines decision, reviewer, scope, rationale, and conditions", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaGoNoGoRecord({
    cwd: repoRoot
  });

  assert.equal(
    result.decisionRecord.decisionState,
    "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY"
  );
  assert.equal(result.reviewerRecord.reviewerRoles.length, 2);
  assert.equal(
    result.approvedScopeRecord.permittedRegion.expectedRecipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(result.rationale.supportingReasons.length >= 4, true);
  assert.equal(result.conditions.conditions.length >= 8, true);
});

test("atlas developer alpha go/no-go record preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaGoNoGoRecord({
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

test("atlas developer alpha go/no-go record writes records and preserves go state without activation", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaGoNoGoRecord({ cwd: repoRoot });

  const decision = readJson(decisionPath);
  const reviewer = readJson(reviewerPath);
  const scope = readJson(scopePath);
  const rationale = readJson(rationalePath);
  const conditions = readJson(conditionsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(decision.decisionDate, "2026-07-30");
  assert.equal(decision.decisionState, "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY");
  assert.equal(reviewer.reviewerRoles.includes("atlas_operator"), true);
  assert.equal(scope.environment, "DEVELOPMENT_ONLY");
  assert.equal(rationale.rationaleSummary.length > 0, true);
  assert.equal(conditions.conditions.length >= 8, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "GO_RECORDED_PENDING_FUTURE_MANUAL_EXECUTION_REVIEW"
  );
  assert.match(report, /Developer alpha go\/no-go decision state: GO_RECORDED_FOR_DEVELOPER_ONLY_REVIEW/);
});
