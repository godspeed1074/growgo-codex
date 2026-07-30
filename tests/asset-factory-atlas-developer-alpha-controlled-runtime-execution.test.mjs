import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const executionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001"
);

const specificationPath = path.join(
  executionRoot,
  "specification/atlas-developer-alpha-controlled-runtime-execution-specification.json"
);
const permissionRecordPath = path.join(
  executionRoot,
  "permissions/atlas-developer-alpha-controlled-runtime-permission-record.json"
);
const flagTransitionPath = path.join(
  executionRoot,
  "flags/atlas-developer-alpha-controlled-runtime-flag-transition-record.json"
);
const monitoringPlanPath = path.join(
  executionRoot,
  "monitoring/atlas-developer-alpha-controlled-runtime-monitoring-plan.json"
);
const validationPath = path.join(
  executionRoot,
  "validation/atlas-developer-alpha-controlled-runtime-validation.json"
);
const lifecyclePath = path.join(
  executionRoot,
  "lifecycle/atlas-developer-alpha-controlled-runtime-lifecycle.json"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-controlled-runtime-execution.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha controlled runtime execution is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeExecution({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeExecution({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.permissionRecord, second.permissionRecord);
  assert.deepEqual(first.flagTransitionRecord, second.flagTransitionRecord);
  assert.deepEqual(first.monitoringPlan, second.monitoringPlan);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha controlled runtime execution locks to one region, one recipe, and planned runtime-only transition", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeExecution({
    cwd: repoRoot
  });

  assert.equal(
    result.specification.runtimeExecutionExperimentScope.regionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.specification.runtimeExecutionExperimentScope.recipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(
    result.specification.exactFeatureFlagTransitionPlan.currentFlags.runtimeExecutionEnabled,
    false
  );
  assert.equal(
    result.specification.exactFeatureFlagTransitionPlan.plannedTransition.length,
    3
  );
  assert.equal(
    result.specification.exactFeatureFlagTransitionPlan.plannedTransition[1]
      .runtimeExecutionEnabled,
    "planned transition"
  );
  assert.equal(
    result.specification.exactFeatureFlagTransitionPlan.currentFlags.mapAttachmentAllowed,
    false
  );
});

test("atlas developer alpha controlled runtime execution keeps map and renderer blocked while planning runtime enablement", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaControlledRuntimeExecution({
    cwd: repoRoot
  });

  assert.equal(result.permissionRecord.permissionBoundary.mapAttachmentAllowed, false);
  assert.equal(
    result.permissionRecord.permissionBoundary.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
});

test("atlas developer alpha controlled runtime execution writes records and reaches controlled runtime readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaControlledRuntimeExecution({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const permissionRecord = readJson(permissionRecordPath);
  const flagTransition = readJson(flagTransitionPath);
  const monitoringPlan = readJson(monitoringPlanPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(specification.definedOn, "2026-07-30");
  assert.equal(permissionRecord.permissionBoundary.developerOnly, true);
  assert.equal(
    flagTransition.transitionPlan.plannedTransition[1].runtimeExecutionEnabled,
    "planned transition"
  );
  assert.equal(monitoringPlan.requiredSignals.length >= 6, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "CONTROLLED_RUNTIME_READY_PENDING_MANUAL_ENABLEMENT_REVIEW"
  );
});
