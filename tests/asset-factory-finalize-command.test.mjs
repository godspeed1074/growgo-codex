import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";

import {
  finalizeAssetFactoryAsset,
  main as finalizeMain
} from "../asset-factory/asset-factory-finalize.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const grassRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);

function hash(filepath) {
  return createHash("sha256").update(fs.readFileSync(filepath)).digest("hex");
}

function copyTree(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function makeTempFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-finalize-"));
  const targetRoot = path.join(
    tempRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
  );
  copyTree(grassRoot, targetRoot);
  return { tempRoot, targetRoot };
}

test("finalize command is idempotent for an already-promoted asset in read-only mode", () => {
  const result = finalizeAssetFactoryAsset("COASTAL_GRASS_TUSSOCK_001", {
    cwd: repoRoot,
    write: false
  });

  assert.equal(result.readiness.ready, true);
  assert.match(
    result.finalState?.versionState ?? result.audit.finalState.versionState,
    /active_development_revision/
  );
  assert.match(result.workspace.auditPath, /coastal-grass-tussock-finalization-audit\.json$/);
  assert.equal(result.audit.safety.publishPerformed, false);
  assert.equal(result.audit.safety.runtimeActivated, false);
});

test("finalize command can create missing registration and promotion records in a temp fixture", () => {
  const { tempRoot, targetRoot } = makeTempFixture();
  const exportRoot = path.join(targetRoot, "export");
  const reportsRoot = path.join(targetRoot, "reports");

  for (const filename of [
    "coastal-grass-tussock-registration.json",
    "coastal-grass-tussock-development-catalog-entry.json",
    "coastal-grass-tussock-v001-version-record.json",
    "coastal-grass-tussock-v001-promotion.json",
    path.join("reports", "coastal-grass-tussock-finalization-audit.json")
  ]) {
    const absolute = path.join(targetRoot, filename);
    if (fs.existsSync(absolute)) {
      fs.rmSync(absolute);
    }
  }

  const beforeHashes = Object.fromEntries(
    [
      path.join(targetRoot, "source/COASTAL_GRASS_TUSSOCK_001_v001.blend"),
      path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb"),
      path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb"),
      path.join(exportRoot, "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb")
    ].map((filepath) => [filepath, hash(filepath)])
  );

  const result = finalizeAssetFactoryAsset("COASTAL_GRASS_TUSSOCK_001", {
    cwd: tempRoot,
    write: true
  });

  assert.equal(result.readiness.ready, true);
  assert.equal(
    fs.existsSync(path.join(exportRoot, "coastal-grass-tussock-registration.json")),
    true
  );
  assert.equal(
    fs.existsSync(path.join(exportRoot, "coastal-grass-tussock-development-catalog-entry.json")),
    true
  );
  assert.equal(
    fs.existsSync(path.join(exportRoot, "coastal-grass-tussock-v001-version-record.json")),
    true
  );
  assert.equal(
    fs.existsSync(path.join(exportRoot, "coastal-grass-tussock-v001-promotion.json")),
    true
  );
  assert.equal(
    fs.existsSync(path.join(reportsRoot, "coastal-grass-tussock-finalization-audit.json")),
    true
  );
  assert.equal(result.audit.finalState.versionState, "active_development_revision");

  const afterHashes = Object.fromEntries(
    Object.keys(beforeHashes).map((filepath) => [filepath, hash(filepath)])
  );
  assert.deepEqual(afterHashes, beforeHashes);
});

test("finalize command stops when visual approval is missing", () => {
  const { tempRoot, targetRoot } = makeTempFixture();
  fs.rmSync(
    path.join(targetRoot, "export/coastal-grass-tussock-visual-approval.json")
  );

  assert.throws(
    () =>
      finalizeAssetFactoryAsset("COASTAL_GRASS_TUSSOCK_001", {
        cwd: tempRoot,
        write: true
      }),
    /visual_approval_exists/
  );
});

test("finalize cli usage returns structured output for the grass asset", async () => {
  const result = await finalizeMain(
    ["finalize", "COASTAL_GRASS_TUSSOCK_001"],
    { cwd: repoRoot, write: false }
  );

  assert.equal(result.ok, true);
  assert.equal(result.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.match(result.auditPath, /coastal-grass-tussock-finalization-audit\.json$/);
  assert.equal(result.finalState.published, false);
  assert.equal(result.finalState.runtimeActivated, false);
});

test("finalize command documentation exists and includes usage and safety rules", () => {
  const doc = fs.readFileSync(
    path.join(repoRoot, "asset-factory/asset-factory-finalize.md"),
    "utf8"
  );

  assert.match(doc, /asset-factory finalize ASSET_ID/);
  assert.match(doc, /never publish/i);
  assert.match(doc, /never activate runtime/i);
  assert.match(doc, /never bypass visual approval/i);
  assert.match(doc, /COASTAL_GRASS_TUSSOCK_001/);
});
