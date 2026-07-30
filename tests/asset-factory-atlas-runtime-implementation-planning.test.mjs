import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const runtimeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001"
);

const specificationPath = path.join(
  runtimeRoot,
  "specification/atlas-runtime-implementation-specification.json"
);
const permissionModelPath = path.join(
  runtimeRoot,
  "permissions/atlas-runtime-implementation-permission-model.json"
);
const lifecyclePath = path.join(
  runtimeRoot,
  "lifecycle/atlas-runtime-implementation-lifecycle-rules.json"
);
const validationPath = path.join(
  runtimeRoot,
  "validation/atlas-runtime-implementation-validation.json"
);
const reportPath = path.join(
  runtimeRoot,
  "reports/atlas-runtime-implementation-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-runtime-implementation-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas runtime implementation planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRuntimeImplementationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRuntimeImplementationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.permissionModel, second.permissionModel);
  assert.deepEqual(first.lifecycleRules, second.lifecycleRules);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas runtime implementation planning defines runtime, map, renderer, lifecycle, flags, telemetry, rollback, and failure contracts", () => {
  const result = moduleUnderTest.buildAtlasRuntimeImplementationPlanning({
    cwd: repoRoot
  });

  assert.equal(
    result.specification.runtimeAdapterContract.requiredInputs.length >= 5,
    true
  );
  assert.equal(
    result.specification.mapIntegrationBoundary.allowedBoundaryStates.length >= 4,
    true
  );
  assert.equal(
    result.specification.rendererHandoffBoundary.preconditions.length >= 4,
    true
  );
  assert.equal(result.specification.lifecycleStates.length >= 6, true);
  assert.equal(
    result.specification.featureFlagProgression.stagedProgression.length,
    3
  );
  assert.equal(
    result.specification.telemetryRequirements.requiredSignals.length >= 6,
    true
  );
  assert.equal(result.specification.rollbackProcedure.rollbackSteps.length >= 5, true);
  assert.equal(result.specification.failureHandling.failureModes.length >= 5, true);
});

test("atlas runtime implementation planning keeps runtime, map, and renderer execution disabled", () => {
  const result = moduleUnderTest.buildAtlasRuntimeImplementationPlanning({
    cwd: repoRoot
  });

  assert.equal(result.permissionModel.permissionState.runtimeExecutionEnabled, false);
  assert.equal(result.permissionModel.permissionState.mapAttachmentAllowed, false);
  assert.equal(
    result.permissionModel.permissionState.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
});

test("atlas runtime implementation planning writes records and preserves planning-only lifecycle", () => {
  moduleUnderTest.writeAtlasRuntimeImplementationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const permissionModel = readJson(permissionModelPath);
  const lifecycleRules = readJson(lifecyclePath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.runtimeImplementationId, "ATLAS_RUNTIME_IMPLEMENTATION_001");
  assert.equal(specification.approvedOn, "2026-07-30");
  assert.equal(permissionModel.permissionState.runtimeExecutionEnabled, false);
  assert.equal(permissionModel.permissionState.mapAttachmentAllowed, false);
  assert.equal(
    permissionModel.permissionState.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(lifecycleRules.lifecycleStatus, "IMPLEMENTATION_PLANNING_READY");
  assert.equal(lifecycleRules.currentState, "RUNTIME_PLANNING_ONLY");
  assert.equal(validation.status, "pass");
  assert.match(
    report,
    /Future runtime implementation readiness: READY_FOR_CONTROLLED_IMPLEMENTATION_PLANNING/
  );
});
