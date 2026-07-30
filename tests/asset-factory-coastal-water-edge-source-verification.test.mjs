import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/coastal-water-edge-source-verification.json"
);

test("coastal water edge v001 source verification records the canonical source facts", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(sourceVerification.version, "v001");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "COASTAL_WATER_EDGE_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.relativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_WATER_EDGE_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.sha256,
    "b709dd778df851afdbe8548674be04086bbbb68fd3b393a3dda5a033d346263e"
  );
  assert.equal(sourceVerification.sourceIdentityVerification.assetIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.recipeIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.dependencyIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.identityAnchorsPresent, true);
  assert.equal(sourceVerification.sourceIdentityVerification.lodRootsPresent, true);
  assert.equal(
    sourceVerification.sourceIdentityVerification.universalExporterCompatible,
    true
  );
  assert.equal(sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport, false);
});

test("coastal water edge source verification records export-folder hygiene truth and runtime blocker", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.sourceIdentityVerification.noBlendFilesPresentInExport, false);
  assert.equal(sourceVerification.exportFolderHygiene.legacyBlendFiles.length > 0, true);
  assert.equal(sourceVerification.exportReadiness.readyToAttemptExport, true);
  assert.equal(sourceVerification.exportReadiness.exportCompleted, true);
  assert.equal(sourceVerification.exportReadiness.exportBlocked, false);
  assert.equal(sourceVerification.exportReadiness.blockerType, null);
});
