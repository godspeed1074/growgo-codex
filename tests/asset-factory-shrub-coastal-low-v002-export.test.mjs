import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/source/shrub-coastal-low-v002-source-verification.json"
);
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-v002-export-validation.json"
);
const exportManifestPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-v002-export-manifest.json"
);

test("shrub v002 source verification records the approved revision source facts", () => {
  const sourceVerification = JSON.parse(fs.readFileSync(sourceVerificationPath, "utf8"));

  assert.equal(sourceVerification.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(sourceVerification.version, "v002");
  assert.equal(sourceVerification.sourceBlend.filename, "SHRUB_COASTAL_LOW_001_v002.blend");
  assert.equal(sourceVerification.sourceIdentityVerification.assetIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.identityAnchorsPresent, true);
  assert.equal(sourceVerification.sourceIdentityVerification.universalExporterCompatible, true);
  assert.equal(sourceVerification.preservedHistoricalRevision.overwritten, false);
});

test("shrub v002 export validation records the exported glbs and lod ordering", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));

  assert.equal(exportValidation.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(exportValidation.version, "v002");
  assert.equal(exportValidation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(exportValidation.lodOrdering.passed, true);
  assert.deepEqual(
    exportValidation.files.map((entry) => entry.filename),
    [
      "SHRUB_COASTAL_LOW_001_v002_LOD_CLOSE.glb",
      "SHRUB_COASTAL_LOW_001_v002_LOD_GAMEPLAY.glb",
      "SHRUB_COASTAL_LOW_001_v002_LOD_MAP.glb"
    ]
  );
  for (const file of exportValidation.files) {
    assert.equal(file.metadataPreserved, true);
    assert.equal(file.dependencyIdentityPreserved, true);
    assert.equal(file.anchorIdentityPreserved, true);
    assert.equal(file.hasExternalDependencies, false);
  }
});

test("shrub v002 export manifest matches the recorded validation metrics", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));
  const exportManifest = JSON.parse(fs.readFileSync(exportManifestPath, "utf8"));

  assert.equal(exportManifest.version, "v002");
  assert.equal(exportManifest.outputs.close.triangleCount, 341);
  assert.equal(exportManifest.outputs.gameplay.triangleCount, 241);
  assert.equal(exportManifest.outputs.map.triangleCount, 101);
  assert.equal(
    exportValidation.exportManifest.deterministicFingerprint,
    exportManifest.deterministicFingerprint
  );
});
