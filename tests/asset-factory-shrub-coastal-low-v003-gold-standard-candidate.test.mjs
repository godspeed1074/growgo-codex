import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseTreeEucalyptusApprovedGameplayGlbSceneData } from "../client/developer-only-atlas-first-approved-live-asset.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const specificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/specification/shrub-coastal-low-v003-revision-specification.json"
);
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/source/shrub-coastal-low-v003-source-verification.json"
);
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-v003-export-validation.json"
);
const exportManifestPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-v003-export-manifest.json"
);
const reviewCandidatePath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-v003-gold-standard-review-candidate.json"
);
const v002GameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v002_LOD_GAMEPLAY.glb"
);
const v003GameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb"
);

test("shrub v003 revision spec preserves v001/v002 and targets the Gold Standard shrub candidate", () => {
  const spec = JSON.parse(fs.readFileSync(specificationPath, "utf8"));

  assert.equal(spec.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(spec.previousRevisionVersion, "v002");
  assert.equal(spec.targetRevisionVersion, "v003");
  assert.equal(spec.constraints.preserveV001Completely, true);
  assert.equal(spec.constraints.preserveV002Completely, true);
  assert.equal(spec.constraints.goldStandardApprovalAutomatic, false);
  assert.equal(spec.constraints.lowShrubIdentityRequired, true);
  assert.deepEqual(spec.expectedOutputs.glbs, [
    "SHRUB_COASTAL_LOW_001_v003_LOD_CLOSE.glb",
    "SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb",
    "SHRUB_COASTAL_LOW_001_v003_LOD_MAP.glb"
  ]);
});

test("shrub v003 source verification records a protected carried-forward source artifact", () => {
  const sourceVerification = JSON.parse(
    fs.readFileSync(sourceVerificationPath, "utf8")
  );

  assert.equal(sourceVerification.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(sourceVerification.version, "v003");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "SHRUB_COASTAL_LOW_001_v003.blend"
  );
  assert.equal(
    sourceVerification.sourceBlend.carriedForwardFromVersion,
    "v002"
  );
  assert.equal(sourceVerification.sourceIdentityVerification.assetIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.identityAnchorsPresent, true);
  assert.equal(sourceVerification.preservedHistoricalRevision.overwritten, false);
});

test("shrub v003 export validation proves deeper gameplay silhouette while staying a low shrub", () => {
  const v003Validation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));
  const v003Manifest = JSON.parse(fs.readFileSync(exportManifestPath, "utf8"));
  const v002Buffer = fs.readFileSync(v002GameplayGlbPath);
  const v003Buffer = fs.readFileSync(v003GameplayGlbPath);
  const v002SceneData = parseTreeEucalyptusApprovedGameplayGlbSceneData(
    v002Buffer.buffer.slice(
      v002Buffer.byteOffset,
      v002Buffer.byteOffset + v002Buffer.byteLength
    )
  );
  const v003SceneData = parseTreeEucalyptusApprovedGameplayGlbSceneData(
    v003Buffer.buffer.slice(
      v003Buffer.byteOffset,
      v003Buffer.byteOffset + v003Buffer.byteLength
    )
  );
  const v002DepthRatio =
    v002SceneData.modelBounds.depth / v002SceneData.modelBounds.height;

  assert.equal(v003Validation.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(v003Validation.version, "v003");
  assert.equal(v003Validation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(v003Validation.lodOrdering.passed, true);
  assert.equal(
    v003Validation.files[1].filename,
    "SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb"
  );
  assert.equal(v003Validation.files[1].triangleCount, 165);
  assert.equal(v003Validation.files[1].materialCount, 4);
  assert.equal(
    v003Validation.silhouetteDepth.gameplayDepthToHeightRatio > v002DepthRatio,
    true
  );
  assert.equal(
    v003Validation.files[1].bounds.height < v002SceneData.modelBounds.height,
    true
  );
  assert.equal(
    v003Validation.files[1].bounds.depth > v003SceneData.modelBounds.depth - 0.00001,
    true
  );
  assert.equal(v003Manifest.outputs.close.triangleCount, 217);
  assert.equal(v003Manifest.outputs.gameplay.triangleCount, 165);
  assert.equal(v003Manifest.outputs.map.triangleCount, 73);
  assert.equal(
    v003Validation.exportManifest.deterministicFingerprint,
    v003Manifest.deterministicFingerprint
  );
});

test("shrub v003 review candidate remains pending operator Gold Standard approval", () => {
  const reviewCandidate = JSON.parse(fs.readFileSync(reviewCandidatePath, "utf8"));

  assert.equal(reviewCandidate.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(reviewCandidate.version, "v003");
  assert.equal(reviewCandidate.approvalStatus, "PENDING_GOLD_STANDARD_REVIEW");
  assert.equal(reviewCandidate.referenceTreeAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(reviewCandidate.referenceTreeVersion, "v002");
  assert.equal(
    reviewCandidate.gameplayGlb,
    "SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb"
  );
  assert.equal(reviewCandidate.safety.published, false);
  assert.equal(reviewCandidate.safety.runtimeActivated, false);
});
