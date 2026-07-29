import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  natureAssetPackRecords
} from "../asset-factory/asset-registry.mjs";
import { buildTreeBottlebrushV002Promotion } from "../asset-factory/tree-bottlebrush-v002-promotion.mjs";

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

test("Asset Factory registry selects v002 and protects historical v001", () => {
  const sourceRecord = natureAssetPackRecords.find(
    (entry) => entry.assetId === "TREE_BOTTLEBRUSH_001"
  );
  const normalizedRecord = createAssetFactoryRegistryLayer().getAssetById(
    "TREE_BOTTLEBRUSH_001"
  );

  for (const record of [sourceRecord, normalizedRecord]) {
    assert.equal(record.currentDevelopmentVersion, "v002");
    assert.deepEqual(
      record.revisions.map(({ version, status, protected: isProtected, current }) => ({
        version,
        status,
        protected: isProtected,
        current
      })),
      [
        {
          version: "v001",
          status: "historical_approved",
          protected: true,
          current: false
        },
        {
          version: "v002",
          status: "approved",
          protected: false,
          current: true
        }
      ]
    );
  }
});

test("promotion maps verified v002 outputs into approved current catalog state", () => {
  const promotion = buildTreeBottlebrushV002Promotion({ cwd: repoRoot });
  assert.equal(promotion.catalog.currentDevelopmentVersion, "v002");
  assert.equal(promotion.catalog.version, "v002");
  assert.equal(promotion.catalog.lifecycleStatus, "APPROVED_CURRENT");
  assert.equal(promotion.catalog.validationStatus, "approved");
  assert.deepEqual(
    Object.values(promotion.catalog.availableLods).map((lod) => lod.triangleCount),
    [1089, 657, 265]
  );
  assert.equal(promotion.catalog.environment, "DEVELOPMENT_ONLY");
  assert.equal(promotion.catalog.publishStatus, "not_published");
  assert.equal(
    promotion.catalog.environmentGuards.runtimeActivation,
    "disabled"
  );
});

test("promotion keeps v001 historical and does not replace approval or runtime state", () => {
  const promotion = buildTreeBottlebrushV002Promotion({ cwd: repoRoot });
  const v001 = promotion.catalog.revisions.find(
    (revision) => revision.version === "v001"
  );
  assert.equal(v001.status, "historical_approved");
  assert.equal(v001.protected, true);
  assert.equal(v001.current, false);
  assert.equal(promotion.promotionRecord.published, false);
  assert.equal(promotion.promotionRecord.runtimeActivated, false);
  assert.equal(promotion.promotionRecord.registrationReplaced, false);
  assert.equal(promotion.promotionRecord.visualApprovalReplaced, false);
});

test("building promotion state does not modify protected v001 files", () => {
  const before = Object.fromEntries(
    protectedV001Files.map((filename) => [filename, hash(filename)])
  );
  buildTreeBottlebrushV002Promotion({ cwd: repoRoot });
  const after = Object.fromEntries(
    protectedV001Files.map((filename) => [filename, hash(filename)])
  );
  assert.deepEqual(after, before);
});
