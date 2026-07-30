import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);

const registrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-water-edge-registration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

test("water edge registration builders derive consistent records without mutating workspace state", () => {
  const visualApproval = registrationModule.buildCoastalWaterEdgeVisualApprovalRecord(
    undefined,
    { cwd: repoRoot }
  );
  const registration = registrationModule.buildCoastalWaterEdgeRegistrationRecord(undefined, {
    cwd: repoRoot,
    visualApprovalRecord: visualApproval
  });
  const catalog = registrationModule.buildCoastalWaterEdgeDevelopmentCatalogEntry(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });
  const versionRecord = registrationModule.buildCoastalWaterEdgeVersionRecord(undefined, {
    cwd: repoRoot,
    registrationRecord: registration
  });

  assert.equal(visualApproval.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(registration.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(catalog.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(versionRecord.assetId, "COASTAL_WATER_EDGE_001");
});

test("water edge visual approval record exists and is approved", () => {
  const approval = readJson("coastal-water-edge-visual-approval.json");

  assert.equal(approval.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(approval.version, "v001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.reviewOutcome.visualReviewComplete, true);
  assert.equal(approval.reviewOutcome.visuallyApprovedForDevelopmentCatalog, true);
  assert.equal(approval.safety.published, false);
  assert.equal(approval.safety.runtimeActivated, false);
});

test("water edge registration record preserves verified hashes and stays non-published", () => {
  const registration = readJson("coastal-water-edge-registration.json");

  assert.equal(registration.assetId, "COASTAL_WATER_EDGE_001");
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
    registration.verifiedOutputs.close.sha256,
    "9fc965aedb6d5454014f2c1de80b129c623daad2eb136bd27f1354033e16dd95"
  );
  assert.equal(
    registration.verifiedOutputs.gameplay.sha256,
    "52aa060d98f77c8e7ec8fdcdbb2017bcd62bb3a319cde733130ea0c7c00c139e"
  );
  assert.equal(
    registration.verifiedOutputs.map.sha256,
    "3ea3341ecc439c7b8efb4d544746761aecedfd841aeaa850234174cd379bd275"
  );
  assert.match(
    registration.promotionStatus,
    /approved\/current candidate|active_development_revision/
  );
});

test("water edge development catalog remains development-only and blocks publish or runtime activation", () => {
  const catalog = readJson("coastal-water-edge-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_WATER_EDGE_001");
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

test("water edge version record tracks v001 lifecycle state without publish or runtime activation", () => {
  const versionRecord = readJson("coastal-water-edge-v001-version-record.json");

  assert.equal(versionRecord.assetId, "COASTAL_WATER_EDGE_001");
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
