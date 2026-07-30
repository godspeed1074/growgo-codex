import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/coastal-ground-cover-v002-source-verification.json"
);

test("ground cover v002 source verification records the canonical source facts", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(sourceVerification.version, "v002");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "COASTAL_GROUND_COVER_001_v002.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.relativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GROUND_COVER_001_v002.blend"
  );
  assert.equal(sourceVerification.sourceIdentityVerification.assetIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.recipeIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.identityAnchorsPresent, true);
  assert.equal(sourceVerification.sourceIdentityVerification.lodRootsPresent, true);
  assert.equal(
    sourceVerification.sourceIdentityVerification.universalExporterCompatible,
    true
  );
  assert.equal(sourceVerification.preservedHistoricalRevision.overwritten, false);
});

test("ground cover v002 source verification records the current Blender runtime export blocker", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.exportReadiness.readyToAttemptExport, true);
  assert.equal(sourceVerification.exportReadiness.exportCompleted, false);
  assert.equal(sourceVerification.exportReadiness.exportBlocked, true);
  assert.equal(sourceVerification.exportReadiness.blockerType, "BLENDER_RUNTIME_CRASH");
});
