import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const readinessLockRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001"
);

const lockRecordPath = path.join(
  readinessLockRoot,
  "record/atlas-developer-alpha-session-readiness-lock-record.json"
);
const checklistPath = path.join(
  readinessLockRoot,
  "checklist/atlas-developer-alpha-final-verification-checklist.json"
);
const validationPath = path.join(
  readinessLockRoot,
  "validation/atlas-developer-alpha-session-readiness-lock-validation.json"
);
const lifecyclePath = path.join(
  readinessLockRoot,
  "lifecycle/atlas-developer-alpha-session-readiness-lock-lifecycle.json"
);
const reportPath = path.join(
  readinessLockRoot,
  "reports/atlas-developer-alpha-session-readiness-lock-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-readiness-lock.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session readiness lock is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionReadinessLock({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionReadinessLock({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.readinessLockRecord, second.readinessLockRecord);
  assert.deepEqual(first.checklist, second.checklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session readiness lock verifies authorization, expiry, operator authorization, scope, repository, versions, monitoring, and rollback", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionReadinessLock({
    cwd: repoRoot
  });

  const areas = result.checklist.items.map((item) => item.area);
  assert.equal(areas.includes("authorization_validity"), true);
  assert.equal(areas.includes("expiry_status"), true);
  assert.equal(areas.includes("operator_authorization"), true);
  assert.equal(areas.includes("session_scope"), true);
  assert.equal(areas.includes("repository_state"), true);
  assert.equal(areas.includes("package_versions"), true);
  assert.equal(areas.includes("recipe_versions"), true);
  assert.equal(areas.includes("monitoring_readiness"), true);
  assert.equal(areas.includes("rollback_readiness"), true);
  assert.equal(
    result.readinessLockRecord.readinessState,
    "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
});

test("atlas developer alpha session readiness lock preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionReadinessLock({
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

test("atlas developer alpha session readiness lock writes records and reaches locked readiness lifecycle state", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionReadinessLock({ cwd: repoRoot });

  const lockRecord = readJson(lockRecordPath);
  const checklist = readJson(checklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(lockRecord.lockedOn, "2026-07-30");
  assert.equal(checklist.authorizationStatus.expiryStatus, "VALID");
  assert.equal(checklist.versionStatus.packageVersion, "v001");
  assert.equal(checklist.versionStatus.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READINESS_LOCK_COMPLETE_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha session readiness lock state: LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
