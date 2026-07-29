import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  resolveAssetFactoryIdentity,
  resolveAssetFactoryPaths,
  validateAssetFactoryName
} from "../asset-factory/asset-factory-identity-paths.mjs";
import { finalizeAssetFactoryAsset } from "../asset-factory/asset-factory-finalize.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const grassRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);

function copyTree(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function makeTempFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-identity-paths-"));
  const targetRoot = path.join(
    tempRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
  );
  copyTree(grassRoot, targetRoot);
  return { tempRoot, targetRoot };
}

test("Asset Factory naming validator accepts canonical asset and revision IDs", () => {
  const assetId = validateAssetFactoryName("COASTAL_GRASS_TUSSOCK_001");
  assert.equal(assetId.ok, true);
  assert.equal(assetId.kind, "asset_id");
  assert.equal(assetId.assetId, "COASTAL_GRASS_TUSSOCK_001");

  const revisionId = validateAssetFactoryName("TREE_BOTTLEBRUSH_001_v002");
  assert.equal(revisionId.ok, true);
  assert.equal(revisionId.kind, "asset_revision_id");
  assert.equal(revisionId.assetId, "TREE_BOTTLEBRUSH_001");
  assert.equal(revisionId.version, "v002");

  const familyId = validateAssetFactoryName("COASTAL_SHRUB_FAMILY_001");
  assert.equal(familyId.ok, true);
  assert.equal(familyId.kind, "family_id");
});

test("Asset Factory naming validator rejects non-canonical names", () => {
  const invalid = validateAssetFactoryName("tree-bottlebrush-v002");
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(" "), /uppercase/i);
  assert.match(invalid.errors.join(" "), /underscores/i);
});

test("identity resolver supports canonical and legacy compatibility names", () => {
  const cases = [
    ["COASTAL_GRASS_TUSSOCK_001", "COASTAL_GRASS_TUSSOCK_001", "v001", "ACTIVE_DEVELOPMENT_REVISION"],
    ["tree-eucalyptus", "TREE_EUCALYPTUS_001", "v001", "REGISTERED"],
    ["TREE_BOTTLEBRUSH_001_v002", "TREE_BOTTLEBRUSH_001", "v002", "APPROVED_CURRENT"],
    ["shrub-coastal-low-v002", "SHRUB_COASTAL_LOW_001", "v002", "ACTIVE_DEVELOPMENT_REVISION"]
  ];

  for (const [reference, assetId, version, lifecycleState] of cases) {
    const resolved = resolveAssetFactoryIdentity(reference, { cwd: repoRoot });
    assert.equal(resolved.assetId, assetId);
    assert.equal(resolved.version, version);
    assert.equal(resolved.lifecycleState, lifecycleState);
  }
});

test("path resolver selects canonical workspace folders for proven assets", () => {
  const grass = resolveAssetFactoryPaths("COASTAL_GRASS_TUSSOCK_001", { cwd: repoRoot });
  assert.match(grass.folders.sourceRoot, /COASTAL_NATURE_FAMILY_001\/source$/);
  assert.match(grass.sourceBlend.selectedPath, /COASTAL_GRASS_TUSSOCK_001_v001\.blend$/);
  assert.match(grass.records.exportManifest.selectedPath, /coastal-grass-tussock-export-manifest\.json$/);

  const eucalyptus = resolveAssetFactoryPaths("TREE_EUCALYPTUS_001_v001", { cwd: repoRoot });
  assert.match(eucalyptus.folders.exportRoot, /COASTAL_NATURE_FAMILY_001\/export$/);
  assert.match(eucalyptus.records.exportValidation.selectedPath, /tree-eucalyptus-validation\.json$/);
  assert.match(eucalyptus.records.visualApproval.selectedPath, /tree-eucalyptus-manual-visual-review\.json$/);

  const bottlebrush = resolveAssetFactoryPaths("tree-bottlebrush-v002", { cwd: repoRoot });
  assert.match(
    bottlebrush.records.exportManifest.selectedPath,
    /tree-bottlebrush-v002-export-manifest\.json$/
  );
  assert.match(
    bottlebrush.records.sourceVerification.selectedPath,
    /tree-bottlebrush-v002-verification\.json$/
  );

  const shrub = resolveAssetFactoryPaths("SHRUB_COASTAL_LOW_001_v002", { cwd: repoRoot });
  assert.match(shrub.folders.familyRoot, /COASTAL_SHRUB_FAMILY_001$/);
  assert.match(
    shrub.records.exportValidation.selectedPath,
    /shrub-coastal-low-v002-export-validation\.json$/
  );
});

test("path resolver preserves legacy source blend compatibility without changing production state", () => {
  const shrub = resolveAssetFactoryPaths("SHRUB_COASTAL_LOW_001", { cwd: repoRoot });

  assert.match(
    shrub.compatibility.canonicalSourceBlendPath,
    /COASTAL_SHRUB_FAMILY_001\/source\/SHRUB_COASTAL_LOW_001_v002\.blend$/
  );
  assert.match(
    shrub.sourceBlend.selectedPath,
    /COASTAL_NATURE_FAMILY_001\/export\/SHRUB_COASTAL_LOW_001_v002\.blend$/
  );
});

test("finalization errors explain missing files and the required next action", () => {
  const { tempRoot, targetRoot } = makeTempFixture();
  fs.rmSync(path.join(targetRoot, "export/coastal-grass-tussock-visual-approval.json"));

  assert.throws(
    () =>
      finalizeAssetFactoryAsset("COASTAL_GRASS_TUSSOCK_001", {
        cwd: tempRoot,
        write: true
      }),
    (error) => {
      assert.match(error.message, /visual_approval_exists/);
      assert.match(error.message, /coastal-grass-tussock-visual-approval\.json/);
      assert.match(error.message, /Complete human visual approval/i);
      return true;
    }
  );
});
