import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export"
);

const registrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-gravel-path-registration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

test("gravel path registration builders derive consistent records without mutating workspace state", () => {
  const visualApproval = registrationModule.buildCoastalGravelPathVisualApprovalRecord(
    undefined,
    { cwd: repoRoot }
  );
  const registration = registrationModule.buildCoastalGravelPathRegistrationRecord(undefined, {
    cwd: repoRoot,
    visualApprovalRecord: visualApproval
  });
  const catalog = registrationModule.buildCoastalGravelPathDevelopmentCatalogEntry(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });
  const versionRecord = registrationModule.buildCoastalGravelPathVersionRecord(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });

  assert.equal(visualApproval.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(registration.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(catalog.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(versionRecord.assetId, "COASTAL_GRAVEL_PATH_001");
});

test("gravel path visual approval record exists and is approved", () => {
  const approval = readJson("coastal-gravel-path-visual-approval.json");

  assert.equal(approval.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(approval.version, "v001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.reviewOutcome.visualReviewComplete, true);
  assert.equal(approval.reviewOutcome.visuallyApprovedForDevelopmentCatalog, true);
  assert.equal(approval.safety.published, false);
  assert.equal(approval.safety.runtimeActivated, false);
});

test("gravel path registration record preserves verified hashes and stays non-published", () => {
  const registration = readJson("coastal-gravel-path-registration.json");

  assert.equal(registration.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(registration.version, "v001");
  assert.equal(registration.registrationStatus, "registered");
  assert.equal(registration.validationStatus, "validated");
  assert.equal(registration.visualApprovalStatus, "approved");
  assert.equal(registration.publishStatus, "not_published");
  assert.equal(registration.releaseStatus, "not_released");
  assert.equal(registration.verification.registrationReady, true);
  assert.equal(registration.verification.manifestConsistency.ok, true);
  assert.equal(registration.verification.visualApprovalPassed, true);
  assert.equal(
    registration.verification.manifestConsistency.checks.find(
      (check) => check.name === "source_export_separation_valid"
    ).ok,
    true
  );
  assert.equal(
    registration.verification.manifestConsistency.checks.find(
      (check) => check.name === "canonical_source_lane_valid"
    ).ok,
    true
  );
  assert.equal(
    registration.verifiedOutputs.close.sha256,
    "8cd2a80e9ae16a6e6c17186db21fbb4872ad31b54b3491cfcb3777619f00340d"
  );
  assert.equal(
    registration.verifiedOutputs.gameplay.sha256,
    "caca943910cc29db34ab6242e60a7d73a0ce28a8db63c94fff4c099d61cb03fa"
  );
  assert.equal(
    registration.verifiedOutputs.map.sha256,
    "16af6dec6d366f02b328b55cda5d0b657dc5c14601b4b099ac1df498a1e21fa6"
  );
  assert.match(
    registration.promotionStatus,
    /approved\/current candidate|active_development_revision/
  );
});

test("gravel path development catalog remains development-only and blocks publish or runtime activation", () => {
  const catalog = readJson("coastal-gravel-path-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(catalog.version, "v001");
  assert.match(
    catalog.lifecycleStatus,
    /APPROVED_CURRENT_CANDIDATE|ACTIVE_DEVELOPMENT_REVISION/
  );
  assert.equal(catalog.environment, "DEVELOPMENT_ONLY");
  assert.equal(catalog.visibility.development, true);
  assert.equal(catalog.visibility.beta, false);
  assert.equal(catalog.visibility.production, false);
  assert.equal(catalog.environmentGuards.betaBlocked, true);
  assert.equal(catalog.environmentGuards.productionBlocked, true);
  assert.equal(catalog.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("gravel path version record tracks v001 lifecycle state without publish or runtime activation", () => {
  const versionRecord = readJson("coastal-gravel-path-v001-version-record.json");

  assert.equal(versionRecord.assetId, "COASTAL_GRAVEL_PATH_001");
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
