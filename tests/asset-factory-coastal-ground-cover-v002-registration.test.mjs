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

test("ground cover v002 visual approval record exists and is approved", () => {
  const approval = readJson("coastal-ground-cover-v002-visual-approval.json");

  assert.equal(approval.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(approval.version, "v002");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.safety.published, false);
  assert.equal(approval.safety.runtimeActivated, false);
});

test("ground cover v002 registration record links evidence and preserves safe non-published state", () => {
  const registration = readJson("coastal-ground-cover-v002-registration.json");

  assert.equal(registration.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(registration.version, "v002");
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
  assert.equal(registration.historicalRevision.version, "v001");
  assert.equal(registration.historicalRevision.protected, true);
});

test("ground cover v002 development catalog stays development-only and blocks runtime or publish activation", () => {
  const catalog = readJson("coastal-ground-cover-v002-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(catalog.version, "v002");
  assert.match(
    catalog.lifecycleStatus,
    /APPROVED_CURRENT_CANDIDATE|ACTIVE_DEVELOPMENT_REVISION/
  );
  assert.equal(catalog.visibility.development, true);
  assert.equal(catalog.visibility.beta, false);
  assert.equal(catalog.visibility.production, false);
  assert.equal(catalog.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("ground cover v002 version record tracks v001 as preserved and v002 as the current lifecycle revision", () => {
  const versionRecord = readJson("coastal-ground-cover-v002-version-record.json");

  assert.equal(versionRecord.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(versionRecord.previousDevelopmentVersion, "v001");
  assert.equal(versionRecord.currentDevelopmentVersion, "v002");
  assert.equal(versionRecord.v001.status, "historical_preserved_revision");
  assert.equal(versionRecord.v001.current, false);
  assert.equal(versionRecord.v001.protected, true);
  assert.match(
    versionRecord.v002.status,
    /approved\/current candidate|active_development_revision/
  );
  assert.equal(versionRecord.v002.current, true);
  assert.equal(versionRecord.published, false);
  assert.equal(versionRecord.runtimeActivated, false);
  assert.equal(typeof versionRecord.promotionPerformed, "boolean");
});
