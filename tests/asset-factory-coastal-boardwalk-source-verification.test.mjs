import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/coastal-boardwalk-source-verification.json"
);

test("coastal boardwalk source verification records the canonical source facts", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(sourceVerification.version, "v001");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "COASTAL_BOARDWALK_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.relativePath,
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_BOARDWALK_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.sha256,
    "a4188df3f994fedeb4b2d7a3091874cfd84cb61d7919334dea013f561696fce1"
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
  assert.equal(sourceVerification.sourceIdentityVerification.noBlendFilesPresentInExport, true);
  assert.equal(
    sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport,
    false
  );
});

test("coastal boardwalk source verification records post-export source safety truthfully", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.exportReadiness.readyToAttemptExport, true);
  assert.equal(sourceVerification.exportReadiness.exportCompleted, true);
  assert.equal(sourceVerification.exportReadiness.exportBlocked, false);
  assert.equal(sourceVerification.exportReadiness.blockerType, null);
  assert.equal(sourceVerification.exportFolderHygiene.legacyBlendFiles.length, 0);
  assert.equal(sourceVerification.exportFolderHygiene.assetSpecificFiles.length, 0);
});
