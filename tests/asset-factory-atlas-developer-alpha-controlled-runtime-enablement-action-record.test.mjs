import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const actionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001"
);

const actionRecordPath = path.join(
  actionRoot,
  "record/atlas-developer-alpha-controlled-runtime-enablement-action-record.json"
);
const authorizationRecordPath = path.join(
  actionRoot,
  "authorization/atlas-developer-alpha-controlled-runtime-enablement-action-authorization-record.json"
);
const snapshotPath = path.join(
  actionRoot,
  "snapshot/atlas-developer-alpha-controlled-runtime-enablement-before-after-snapshot.json"
);
const validationPath = path.join(
  actionRoot,
  "validation/atlas-developer-alpha-controlled-runtime-enablement-action-validation.json"
);
const lifecyclePath = path.join(
  actionRoot,
  "lifecycle/atlas-developer-alpha-controlled-runtime-enablement-action-lifecycle.json"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-controlled-runtime-enablement-action-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("controlled runtime enablement action record is deterministic", () => {
  const first =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
      cwd: repoRoot
    });
  const second =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
      cwd: repoRoot
    });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.enablementActionRecord, second.enablementActionRecord);
  assert.deepEqual(first.authorizationRecord, second.authorizationRecord);
  assert.deepEqual(first.beforeAfterSnapshot, second.beforeAfterSnapshot);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("controlled runtime enablement action preserves current false flags until explicit manual action", () => {
  const result =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
      cwd: repoRoot
    });

  assert.equal(result.beforeAfterSnapshot.finalPreChangeSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.beforeAfterSnapshot.finalPreChangeSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.beforeAfterSnapshot.finalPreChangeSnapshot.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(
    result.enablementActionRecord.exactFlagDelta.runtimeExecutionEnabled.planned,
    "planned transition"
  );
  assert.equal(result.enablementActionRecord.exactFlagDelta.mapAttachmentAllowed.planned, false);
  assert.equal(
    result.enablementActionRecord.exactFlagDelta.automaticRendererExecutionAllowed.planned,
    false
  );
});

test("controlled runtime enablement action keeps renderer, map, downloads, and asset mutation blocked", () => {
  const result =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
      cwd: repoRoot
    });

  assert.equal(
    result.authorizationRecord.authorizationState,
    "READY_FOR_FUTURE_MANUAL_ENABLEMENT_DECISION_ONLY"
  );
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("controlled runtime enablement action writes records and reaches explicit manual operator decision readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
    cwd: repoRoot
  });

  const actionRecord = readJson(actionRecordPath);
  const authorizationRecord = readJson(authorizationRecordPath);
  const snapshot = readJson(snapshotPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(actionRecord.recordedOn, "2026-07-30");
  assert.equal(
    authorizationRecord.authorizationState,
    "READY_FOR_FUTURE_MANUAL_ENABLEMENT_DECISION_ONLY"
  );
  assert.equal(
    snapshot.plannedActionDelta.runtimeExecutionEnabled.planned,
    "planned transition"
  );
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "ENABLEMENT_ACTION_READY_PENDING_EXPLICIT_MANUAL_OPERATOR_DECISION"
  );
});
