import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/coastal-gravel-path-source-verification.json"
);

test("coastal gravel path source verification records the canonical source facts", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.assetId, "COASTAL_GRAVEL_PATH_001");
  assert.equal(sourceVerification.version, "v001");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "COASTAL_GRAVEL_PATH_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.relativePath,
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_GRAVEL_PATH_001_v001.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.sha256,
    "3372ca28b50489b7b1e3af95430b9296d66a365734026fa27feec6b50b0629a5"
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
  assert.equal(sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport, false);
});

test("coastal gravel path source verification records post-export source safety truthfully", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.exportFolderHygiene.legacyBlendFiles.length, 0);
  assert.equal(sourceVerification.exportFolderHygiene.assetSpecificFiles.length, 0);
  assert.equal(sourceVerification.exportReadiness.readyToAttemptExport, true);
  assert.equal(sourceVerification.exportReadiness.exportCompleted, true);
  assert.equal(sourceVerification.exportReadiness.exportBlocked, false);
  assert.equal(sourceVerification.exportReadiness.blockerType, null);
});
