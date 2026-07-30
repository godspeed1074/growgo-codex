import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const cleanupRecordPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation/coastal-gravel-path-source-lane-cleanup.json"
);

test("coastal gravel path source lane cleanup keeps the canonical pathway source and preserves quarantine evidence", () => {
  const record = JSON.parse(fs.readFileSync(cleanupRecordPath, "utf8"));
  const canonicalPath = path.join(repoRoot, record.canonicalSource.relativePath);
  const oldNaturePath = path.join(repoRoot, record.quarantinedCandidate.originalRelativePath);
  const quarantinePath = path.join(repoRoot, record.quarantinedCandidate.quarantineRelativePath);

  assert.equal(record.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(record.version, "v001");
  assert.equal(record.canonicalFamily, "COASTAL_PATHWAY_FAMILY_001");
  assert.equal(record.comparison.sameRevisionByIdentity, true);
  assert.equal(record.comparison.byteIdentical, false);

  assert.equal(fs.existsSync(canonicalPath), true);
  assert.equal(fs.existsSync(quarantinePath), true);
  assert.equal(fs.existsSync(oldNaturePath), false);

  assert.equal(record.canonicalSource.assetIdentityPresent, true);
  assert.equal(record.canonicalSource.recipeIdentityPresent, true);
  assert.equal(record.canonicalSource.lodRootsPresent, true);
  assert.equal(record.canonicalSource.identityAnchorsPresent, true);
  assert.equal(record.quarantinedCandidate.assetIdentityPresent, true);
  assert.equal(record.quarantinedCandidate.recipeIdentityPresent, true);
  assert.equal(record.quarantinedCandidate.lodRootsPresent, true);
  assert.equal(record.quarantinedCandidate.identityAnchorsPresent, true);
});

test("coastal gravel path source lane cleanup preserves source-only safety", () => {
  const record = JSON.parse(fs.readFileSync(cleanupRecordPath, "utf8"));

  assert.equal(record.finalSourceState.canonicalSourceInPlace, true);
  assert.equal(record.finalSourceState.duplicateRemovedFromNatureSourceLane, true);
  assert.equal(record.finalSourceState.quarantineEvidencePreserved, true);
  assert.equal(record.safety.exportPerformed, false);
  assert.equal(record.safety.registered, false);
  assert.equal(record.safety.promoted, false);
  assert.equal(record.safety.approvedAssetsModified, false);
});
