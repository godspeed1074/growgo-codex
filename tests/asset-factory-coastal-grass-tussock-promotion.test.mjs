import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);
const protectedFiles = [
  path.join(
    repoRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GRASS_TUSSOCK_001_v001.blend"
  ),
  path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb"),
  path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb"),
  path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb")
];

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

function hash(filepath) {
  return createHash("sha256").update(fs.readFileSync(filepath)).digest("hex");
}

test("grass v001 promotion record sets active development revision", () => {
  const promotion = readJson("coastal-grass-tussock-v001-promotion.json");

  assert.equal(promotion.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(promotion.previousDevelopmentVersion, null);
  assert.equal(promotion.currentDevelopmentVersion, "v001");
  assert.equal(promotion.before.developmentCatalogLifecycleStatus, "APPROVED_CURRENT_CANDIDATE");
  assert.equal(promotion.after.developmentCatalogLifecycleStatus, "ACTIVE_DEVELOPMENT_REVISION");
  assert.equal(promotion.v001.status, "active_development_revision");
  assert.equal(promotion.v001.current, true);
  assert.equal(promotion.published, false);
  assert.equal(promotion.runtimeActivated, false);
  assert.equal(promotion.rollbackCapability.available, true);
});

test("grass development catalog moves from current candidate to active development revision", () => {
  const catalog = readJson("coastal-grass-tussock-development-catalog-entry.json");

  assert.equal(catalog.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(catalog.version, "v001");
  assert.equal(catalog.lifecycleStatus, "ACTIVE_DEVELOPMENT_REVISION");
  assert.equal(catalog.validationStatus, "approved");
  assert.equal(catalog.sourcePromotionRecord.currentDevelopmentVersion, "v001");
  assert.equal(catalog.validation.promotionApplied, true);
});

test("grass version state marks v001 active and promotion performed", () => {
  const versionRecord = readJson("coastal-grass-tussock-v001-version-record.json");

  assert.equal(versionRecord.currentDevelopmentVersion, "v001");
  assert.equal(versionRecord.v001.status, "active_development_revision");
  assert.equal(versionRecord.v001.current, true);
  assert.equal(versionRecord.promotionPerformed, true);
  assert.equal(versionRecord.published, false);
  assert.equal(versionRecord.runtimeActivated, false);
});

test("promotion state does not modify protected grass source or exported glbs", () => {
  const before = Object.fromEntries(protectedFiles.map((filepath) => [filepath, hash(filepath)]));
  readJson("coastal-grass-tussock-v001-promotion.json");
  const after = Object.fromEntries(protectedFiles.map((filepath) => [filepath, hash(filepath)]));
  assert.deepEqual(after, before);
});
