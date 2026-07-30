import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

test("rock cluster v001 visual approval record exists and is approved", () => {
  const approval = readJson("coastal-rock-cluster-visual-approval.json");

  assert.equal(approval.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(approval.version, "v001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.safety.published, false);
  assert.equal(approval.safety.runtimeActivated, false);
});

test("rock cluster registration record links v001 evidence and preserves safe non-published state", () => {
  const registration = readJson("coastal-rock-cluster-registration.json");

  assert.equal(registration.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(registration.version, "v001");
  assert.equal(registration.registrationStatus, "registered");
  assert.equal(registration.validationStatus, "validated");
  assert.equal(registration.visualApprovalStatus, "approved");
  assert.equal(registration.verification.registrationReady, true);
  assert.equal(registration.verification.manifestConsistency.ok, true);
  assert.equal(
    registration.verification.manifestConsistency.checks.find(
      (check) => check.name === "source_export_separation_valid"
    ).ok,
    true
  );
  assert.equal(registration.publishStatus, "not_published");
  assert.equal(registration.releaseStatus, "not_released");
  assert.match(
    registration.promotionStatus,
    /approved\/current candidate|active_development_revision/
  );
  assert.equal(typeof registration.currentDevelopmentRevision, "boolean");
});

test("rock cluster development catalog stays development-only and blocks runtime or publish activation", () => {
  const catalog = readJson("coastal-rock-cluster-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(catalog.version, "v001");
  assert.match(
    catalog.lifecycleStatus,
    /APPROVED_CURRENT_CANDIDATE|ACTIVE_DEVELOPMENT_REVISION/
  );
  assert.equal(catalog.visibility.development, true);
  assert.equal(catalog.visibility.beta, false);
  assert.equal(catalog.visibility.production, false);
  assert.equal(catalog.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("rock cluster version record tracks v001 lifecycle state without publish or runtime activation", () => {
  const versionRecord = readJson("coastal-rock-cluster-v001-version-record.json");

  assert.equal(versionRecord.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(versionRecord.previousDevelopmentVersion, null);
  assert.equal(versionRecord.currentDevelopmentVersion, "v001");
  assert.match(
    versionRecord.v001.status,
    /approved\/current candidate|active_development_revision/
  );
  assert.equal(versionRecord.v001.current, true);
  assert.equal(versionRecord.published, false);
  assert.equal(versionRecord.runtimeActivated, false);
  assert.equal(typeof versionRecord.promotionPerformed, "boolean");
});
