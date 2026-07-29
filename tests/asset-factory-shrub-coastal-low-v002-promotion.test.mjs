import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export"
);
const protectedV001Files = [
  path.join(
    repoRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v001.blend"
  ),
  path.join(exportRoot, "SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb"),
  path.join(exportRoot, "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb"),
  path.join(exportRoot, "SHRUB_COASTAL_LOW_001_LOD_MAP.glb")
];

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(exportRoot, filename), "utf8"));
}

function hash(filepath) {
  return createHash("sha256").update(fs.readFileSync(filepath)).digest("hex");
}

test("shrub v002 promotion record sets active development revision and preserves v001", () => {
  const promotion = readJson("shrub-coastal-low-v002-promotion.json");

  assert.equal(promotion.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(promotion.previousDevelopmentVersion, "v001");
  assert.equal(promotion.currentDevelopmentVersion, "v002");
  assert.equal(promotion.v001.status, "historical_approved");
  assert.equal(promotion.v001.protected, true);
  assert.equal(promotion.v002.status, "active_development_revision");
  assert.equal(promotion.v002.current, true);
  assert.equal(promotion.published, false);
  assert.equal(promotion.runtimeActivated, false);
});

test("shrub development catalog moves from current candidate to active development revision", () => {
  const catalog = readJson("shrub-coastal-low-development-catalog-entry.json");

  assert.equal(catalog.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(catalog.version, "v002");
  assert.equal(catalog.lifecycleStatus, "ACTIVE_DEVELOPMENT_REVISION");
  assert.equal(catalog.validationStatus, "approved");
  assert.equal(catalog.sourcePromotionRecord.currentDevelopmentVersion, "v002");
  assert.equal(catalog.validation.promotionApplied, true);
});

test("shrub version state marks v002 active and keeps v001 protected historical", () => {
  const versionRecord = readJson("shrub-coastal-low-v002-version-record.json");

  assert.equal(versionRecord.currentDevelopmentVersion, "v002");
  assert.equal(versionRecord.v001.status, "historical_approved");
  assert.equal(versionRecord.v001.protected, true);
  assert.equal(versionRecord.v002.status, "active_development_revision");
  assert.equal(versionRecord.v002.current, true);
  assert.equal(versionRecord.promotionPerformed, true);
});

test("promotion state does not modify protected v001 shrub source or glbs", () => {
  const before = Object.fromEntries(protectedV001Files.map((filepath) => [filepath, hash(filepath)]));
  readJson("shrub-coastal-low-v002-promotion.json");
  const after = Object.fromEntries(protectedV001Files.map((filepath) => [filepath, hash(filepath)]));
  assert.deepEqual(after, before);
});
