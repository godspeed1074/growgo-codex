import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const decisionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001"
);

const decisionRecordPath = path.join(
  decisionRoot,
  "record/atlas-developer-alpha-runtime-enablement-operator-decision-record.json"
);
const authorizationRecordPath = path.join(
  decisionRoot,
  "authorization/atlas-developer-alpha-runtime-enablement-operator-authorization-record.json"
);
const rationalePath = path.join(
  decisionRoot,
  "rationale/atlas-developer-alpha-runtime-enablement-decision-rationale.json"
);
const validationPath = path.join(
  decisionRoot,
  "validation/atlas-developer-alpha-runtime-enablement-operator-decision-validation.json"
);
const lifecyclePath = path.join(
  decisionRoot,
  "lifecycle/atlas-developer-alpha-runtime-enablement-operator-decision-lifecycle.json"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-runtime-enablement-operator-decision.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("runtime enablement operator decision is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
    cwd: repoRoot
  });
  const second =
    moduleUnderTest.buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
      cwd: repoRoot
    });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.operatorDecisionRecord, second.operatorDecisionRecord);
  assert.deepEqual(first.authorizationRecord, second.authorizationRecord);
  assert.deepEqual(first.decisionRationale, second.decisionRationale);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("runtime enablement operator decision safely defers enablement and preserves false flags", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
    cwd: repoRoot
  });

  assert.equal(result.operatorDecisionRecord.decisionState, "DEFER_ENABLEMENT");
  assert.equal(result.decisionRationale.selectedDecisionState, "DEFER_ENABLEMENT");
  assert.equal(result.operatorDecisionRecord.finalPreChangeSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.operatorDecisionRecord.finalPreChangeSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.operatorDecisionRecord.finalPreChangeSnapshot.automaticRendererExecutionAllowed,
    false
  );
});

test("runtime enablement operator decision keeps renderer, map, downloads, and mutation blocked", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
    cwd: repoRoot
  });

  assert.equal(
    result.authorizationRecord.authorizationState,
    "AUTHORIZED_TO_RECORD_DECISION_ONLY"
  );
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("runtime enablement operator decision writes records and reaches deferred future transition lifecycle state", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
    cwd: repoRoot
  });

  const decisionRecord = readJson(decisionRecordPath);
  const authorizationRecord = readJson(authorizationRecordPath);
  const rationale = readJson(rationalePath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(decisionRecord.recordedOn, "2026-07-30");
  assert.equal(decisionRecord.decisionState, "DEFER_ENABLEMENT");
  assert.equal(
    authorizationRecord.authorizationState,
    "AUTHORIZED_TO_RECORD_DECISION_ONLY"
  );
  assert.equal(rationale.selectedDecisionState, "DEFER_ENABLEMENT");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "OPERATOR_DECISION_RECORDED_DEFERRED_PENDING_FUTURE_EXPLICIT_TRANSITION"
  );
});
