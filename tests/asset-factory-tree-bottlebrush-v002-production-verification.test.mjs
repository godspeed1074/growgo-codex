import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  treeBottlebrushV002VerificationDefinition,
  verifyTreeBottlebrushV002
} from "../asset-factory/tree-bottlebrush-v002-production-verify.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);
const protectedV001Files = [
  "TREE_BOTTLEBRUSH_001_v001.blend",
  "TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb",
  "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb",
  "TREE_BOTTLEBRUSH_001_LOD_MAP.glb",
  "tree-bottlebrush-manifest.json",
  "tree-bottlebrush-metadata.json",
  "tree-bottlebrush-validation.json",
  "tree-bottlebrush-registration.json",
  "tree-bottlebrush-manual-visual-review.json"
];

function hash(filename) {
  return createHash("sha256")
    .update(fs.readFileSync(path.join(outputDirectory, filename)))
    .digest("hex");
}

test("v002 verifier targets only versioned refinement outputs", () => {
  assert.equal(
    treeBottlebrushV002VerificationDefinition.expectedOutputs.blend,
    "TREE_BOTTLEBRUSH_001_v002.blend"
  );
  assert.deepEqual(
    treeBottlebrushV002VerificationDefinition.expectedOutputs.proofAssets,
    [
      "TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb",
      "TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb",
      "TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb"
    ]
  );
  assert.equal(treeBottlebrushV002VerificationDefinition.version, "v002");
});

test("production v002 package passes identity, dependency, anchor and LOD checks", () => {
  const verification = verifyTreeBottlebrushV002({ cwd: repoRoot });
  const glbs = verification.packageVerification.files.filter((entry) =>
    entry.filename.endsWith(".glb")
  );

  assert.equal(verification.packageVerification.registrationGate.ready, true);
  assert.equal(verification.packageVerification.lodComplexity.ok, true);
  assert.deepEqual(
    glbs.map((entry) => entry.triangleCount),
    [1089, 657, 265]
  );
  for (const glb of glbs) {
    assert.equal(glb.classification, "VERIFIED_COMPLETE");
    assert.equal(glb.assetIdentityPreserved, true);
    assert.equal(glb.recipeIdentityPreserved, true);
    assert.equal(glb.metadataIdentityPreserved, true);
    assert.equal(glb.dependencyIdentityPreserved, true);
    assert.equal(glb.anchorIdentityPreserved, true);
    assert.equal(glb.hasExternalDependencies, false);
  }
});

test("v002 changes geometry while preserving identity and recording the version", () => {
  const verification = verifyTreeBottlebrushV002({ cwd: repoRoot });
  assert.equal(verification.versionComparison.ok, true);
  assert.equal(verification.replacementReadiness.readyToReplaceV001, true);
  assert.equal(verification.replacementReadiness.registrationReplaced, false);
  assert.equal(verification.replacementReadiness.visualApprovalReplaced, false);
});

test("verification is read-only for all v001 package and approval records", () => {
  const before = Object.fromEntries(
    protectedV001Files.map((filename) => [filename, hash(filename)])
  );
  verifyTreeBottlebrushV002({ cwd: repoRoot });
  const after = Object.fromEntries(
    protectedV001Files.map((filename) => [filename, hash(filename)])
  );
  assert.deepEqual(after, before);
});
