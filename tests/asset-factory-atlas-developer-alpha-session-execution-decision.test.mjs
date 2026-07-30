import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const decisionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001"
);

const decisionRecordPath = path.join(
  decisionRoot,
  "decision/atlas-developer-alpha-session-execution-decision-record.json"
);
const rationalePath = path.join(
  decisionRoot,
  "rationale/atlas-developer-alpha-session-decision-rationale.json"
);
const authorizationPath = path.join(
  decisionRoot,
  "authorization/atlas-developer-alpha-operator-authorization-record.json"
);
const scopePath = path.join(
  decisionRoot,
  "scope/atlas-developer-alpha-session-scope-confirmation.json"
);
const conditionsPath = path.join(
  decisionRoot,
  "conditions/atlas-developer-alpha-session-approval-conditions.json"
);
const validationPath = path.join(
  decisionRoot,
  "validation/atlas-developer-alpha-session-decision-validation.json"
);
const lifecyclePath = path.join(
  decisionRoot,
  "lifecycle/atlas-developer-alpha-session-decision-lifecycle.json"
);
const reportPath = path.join(
  decisionRoot,
  "reports/atlas-developer-alpha-session-decision-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-execution-decision.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session execution decision is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionExecutionDecision({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionExecutionDecision({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.decisionRecord, second.decisionRecord);
  assert.deepEqual(first.rationale, second.rationale);
  assert.deepEqual(first.authorization, second.authorization);
  assert.deepEqual(first.scopeConfirmation, second.scopeConfirmation);
  assert.deepEqual(first.approvalConditions, second.approvalConditions);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session execution decision produces a GO state with authorization, scope, and approval conditions", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionExecutionDecision({
    cwd: repoRoot
  });

  assert.equal(result.decisionRecord.decisionState, "GO");
  assert.deepEqual(result.authorization.authorizedRoles, [
    "atlas_operator",
    "internal_developer_reviewer"
  ]);
  assert.equal(result.scopeConfirmation.environment, "DEVELOPMENT_ONLY");
  assert.equal(
    result.scopeConfirmation.permittedRegion.expectedRecipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(result.approvalConditions.conditions.length >= 10, true);
});

test("atlas developer alpha session execution decision preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionExecutionDecision({
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

test("atlas developer alpha session execution decision writes records and reaches GO lifecycle state", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionExecutionDecision({
    cwd: repoRoot
  });

  const decisionRecord = readJson(decisionRecordPath);
  const rationale = readJson(rationalePath);
  const authorization = readJson(authorizationPath);
  const scope = readJson(scopePath);
  const conditions = readJson(conditionsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(decisionRecord.decidedOn, "2026-07-30");
  assert.equal(decisionRecord.decisionState, "GO");
  assert.equal(rationale.supportingEvidence.length >= 4, true);
  assert.equal(authorization.internalOnly, true);
  assert.equal(scope.durationLimitMinutes, 30);
  assert.equal(conditions.stopAuthority.stopConditions.length >= 5, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "SESSION_DECISION_GO_RECORDED_PENDING_FUTURE_MANUAL_EXECUTION"
  );
  assert.match(report, /Developer alpha session execution decision: GO/);
});
