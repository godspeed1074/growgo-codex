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
    "coastal-boardwalk-registration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

test("boardwalk registration builders derive consistent records without mutating workspace state", () => {
  const visualApproval = registrationModule.buildCoastalBoardwalkVisualApprovalRecord(
    undefined,
    { cwd: repoRoot }
  );
  const registration = registrationModule.buildCoastalBoardwalkRegistrationRecord(undefined, {
    cwd: repoRoot,
    visualApprovalRecord: visualApproval
  });
  const catalog = registrationModule.buildCoastalBoardwalkDevelopmentCatalogEntry(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });
  const versionRecord = registrationModule.buildCoastalBoardwalkVersionRecord(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });

  assert.equal(visualApproval.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(registration.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(catalog.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(versionRecord.assetId, "COASTAL_BOARDWALK_001");
});

test("boardwalk visual approval record exists and is approved", () => {
  const approval = readJson("coastal-boardwalk-visual-approval.json");

  assert.equal(approval.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(approval.version, "v001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.reviewOutcome.visualReviewComplete, true);
  assert.equal(approval.reviewOutcome.visuallyApprovedForDevelopmentCatalog, true);
  assert.equal(approval.safety.published, false);
  assert.equal(approval.safety.runtimeActivated, false);
});

test("boardwalk registration record preserves verified hashes and stays non-published", () => {
  const registration = readJson("coastal-boardwalk-registration.json");

  assert.equal(registration.assetId, "COASTAL_BOARDWALK_001");
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
    "a223d20ff8de455c90b2d74e5c2be32f1b936d6a01769e5dc18bd31c3c11c19d"
  );
  assert.equal(
    registration.verifiedOutputs.gameplay.sha256,
    "16a3ec5db34d674904e6554acf855d722846a147634c11bc6091bb16d455ee99"
  );
  assert.equal(
    registration.verifiedOutputs.map.sha256,
    "3a62663ca25559fb59a98c9a6aa10478fe54fbe643f5a331db0aab5daedce9f6"
  );
  assert.match(
    registration.promotionStatus,
    /approved\/current candidate|active_development_revision/
  );
});

test("boardwalk development catalog remains development-only and blocks publish or runtime activation", () => {
  const catalog = readJson("coastal-boardwalk-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_BOARDWALK_001");
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

test("boardwalk version record tracks v001 lifecycle state without publish or runtime activation", () => {
  const versionRecord = readJson("coastal-boardwalk-v001-version-record.json");

  assert.equal(versionRecord.assetId, "COASTAL_BOARDWALK_001");
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
