import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const preparationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001"
);

const preparationRecordPath = path.join(
  preparationRoot,
  "preparation/atlas-developer-alpha-execution-preparation-record.json"
);
const snapshotPath = path.join(
  preparationRoot,
  "snapshot/atlas-developer-alpha-session-snapshot.json"
);
const checklistPath = path.join(
  preparationRoot,
  "checklist/atlas-developer-alpha-operator-preparation-checklist.json"
);
const validationPath = path.join(
  preparationRoot,
  "validation/atlas-developer-alpha-execution-preparation-validation.json"
);
const lifecyclePath = path.join(
  preparationRoot,
  "lifecycle/atlas-developer-alpha-execution-preparation-lifecycle.json"
);
const reportPath = path.join(
  preparationRoot,
  "reports/atlas-developer-alpha-execution-preparation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-execution-preparation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha execution preparation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaExecutionPreparation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaExecutionPreparation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.preparationRecord, second.preparationRecord);
  assert.deepEqual(first.sessionSnapshot, second.sessionSnapshot);
  assert.deepEqual(first.operatorChecklist, second.operatorChecklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha execution preparation captures environment, flags, package, recipe, monitoring, success, stop, and rollback state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionPreparation({
    cwd: repoRoot
  });

  assert.equal(
    result.sessionSnapshot.sessionEnvironment.environment,
    "DEVELOPMENT_ONLY"
  );
  assert.equal(
    result.sessionSnapshot.packageSnapshot.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
  );
  assert.equal(
    result.sessionSnapshot.recipeSnapshot.expectedRecipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(
    result.sessionSnapshot.featureFlagSnapshot.runtimeExecutionEnabled,
    false
  );
  assert.equal(result.sessionSnapshot.monitoringPreparation.monitoringChecklist.length >= 5, true);
  assert.equal(result.sessionSnapshot.successMetrics.length >= 4, true);
  assert.equal(result.sessionSnapshot.stopAuthority.stopConditions.length >= 5, true);
  assert.equal(result.sessionSnapshot.rollbackReadiness.status, "PASS");
});

test("atlas developer alpha execution preparation preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaExecutionPreparation({
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

test("atlas developer alpha execution preparation writes records and reaches final preparation readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaExecutionPreparation({ cwd: repoRoot });

  const preparationRecord = readJson(preparationRecordPath);
  const snapshot = readJson(snapshotPath);
  const checklist = readJson(checklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(preparationRecord.preparedOn, "2026-07-30");
  assert.equal(snapshot.capturedOn, "2026-07-30");
  assert.equal(checklist.items.length >= 8, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FINAL_PREPARATION_COMPLETE_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha execution preparation status: READY_FOR_FUTURE_MANUAL_DEVELOPER_ONLY_ALPHA_SESSION/
  );
});
