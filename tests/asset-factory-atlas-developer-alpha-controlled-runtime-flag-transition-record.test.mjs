import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const transitionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001"
);

const flagTransitionRecordPath = path.join(
  transitionRoot,
  "record/atlas-developer-alpha-controlled-runtime-flag-transition-record.json"
);
const stateSchemaPath = path.join(
  transitionRoot,
  "schema/atlas-developer-alpha-controlled-runtime-before-after-state-schema.json"
);
const authorizationRecordPath = path.join(
  transitionRoot,
  "authorization/atlas-developer-alpha-controlled-runtime-transition-authorization-record.json"
);
const rollbackRecordPath = path.join(
  transitionRoot,
  "rollback/atlas-developer-alpha-controlled-runtime-transition-rollback-record.json"
);
const validationPath = path.join(
  transitionRoot,
  "validation/atlas-developer-alpha-controlled-runtime-flag-transition-validation.json"
);
const lifecyclePath = path.join(
  transitionRoot,
  "lifecycle/atlas-developer-alpha-controlled-runtime-flag-transition-lifecycle.json"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-controlled-runtime-flag-transition-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("controlled runtime flag transition record is deterministic", () => {
  const first =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
      cwd: repoRoot
    });
  const second =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
      cwd: repoRoot
    });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.flagTransitionRecord, second.flagTransitionRecord);
  assert.deepEqual(first.beforeAfterStateSchema, second.beforeAfterStateSchema);
  assert.deepEqual(first.authorizationRecord, second.authorizationRecord);
  assert.deepEqual(first.rollbackRecord, second.rollbackRecord);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("controlled runtime flag transition record preserves current false flags and planned runtime-only transition", () => {
  const result =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
      cwd: repoRoot
    });

  assert.equal(result.flagTransitionRecord.beforeStateSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.flagTransitionRecord.beforeStateSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.flagTransitionRecord.beforeStateSnapshot.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(
    result.flagTransitionRecord.plannedFlagTransition.runtimeExecutionEnabled,
    "planned transition"
  );
  assert.equal(result.flagTransitionRecord.plannedFlagTransition.mapAttachmentAllowed, false);
  assert.equal(
    result.flagTransitionRecord.plannedFlagTransition.automaticRendererExecutionAllowed,
    false
  );
});

test("controlled runtime flag transition authorization and rollback remain internal and blocked from renderer or map enablement", () => {
  const result =
    moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
      cwd: repoRoot
    });

  assert.equal(
    result.authorizationRecord.authorizationState,
    "AUTHORIZED_FOR_FUTURE_MANUAL_FLAG_TRANSITION_ONLY"
  );
  assert.equal(result.authorizationRecord.preservedSafetyState.rendererAttachmentAuthorized, false);
  assert.equal(result.authorizationRecord.preservedSafetyState.mapDownloadsAuthorized, false);
  assert.equal(result.rollbackRecord.rollbackState, "READY_IF_MANUAL_TRANSITION_IS_ATTEMPTED");
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
});

test("controlled runtime flag transition record writes records and reaches manual action readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
    cwd: repoRoot
  });

  const flagTransitionRecord = readJson(flagTransitionRecordPath);
  const stateSchema = readJson(stateSchemaPath);
  const authorizationRecord = readJson(authorizationRecordPath);
  const rollbackRecord = readJson(rollbackRecordPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(flagTransitionRecord.recordedOn, "2026-07-30");
  assert.equal(
    stateSchema.plannedTransitionSchema.runtimeExecutionEnabled,
    "planned transition"
  );
  assert.equal(
    authorizationRecord.authorizationState,
    "AUTHORIZED_FOR_FUTURE_MANUAL_FLAG_TRANSITION_ONLY"
  );
  assert.equal(
    rollbackRecord.planningOnlyResetTarget,
    "PLANNING_ONLY_STATE_WITH_RUNTIME_DISABLED"
  );
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FLAG_TRANSITION_READY_PENDING_MANUAL_RUNTIME_ENABLEMENT_ACTION"
  );
});
