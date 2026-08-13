import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("asset-factory/modular");
const analysis = JSON.parse(fs.readFileSync(path.join(root, "SHOP_REFERENCE_ANALYSIS.json"), "utf8"));
const pack = JSON.parse(fs.readFileSync(path.join(root, "SHOP_PRODUCTION_ASSET_PACK_SPEC.json"), "utf8"));

test("production shop reference analysis is traceable", () => {
  assert.equal(analysis.referenceId, "GG-REF-SIMPLE-SHOP-GROWGO-CONCEPT-001");
  assert.equal(analysis.source.sha256.length, 64);
  assert.equal(analysis.acceptance.mustGenerateFourSideReview, true);
});

test("production shop pack has eight permanent Layer A IDs", () => {
  assert.equal(pack.layerAModules.length, 8);
  assert.ok(pack.layerAModules.every(module => /^GG-(BLD|VEG)-[A-Z0-9-]+-\d{3}$/.test(module.assetId)));
  assert.equal(pack.layerBRecipe.anonymousGeometryCount, 0);
});

test("production shop recipe requires real worker and operator review outputs", () => {
  assert.equal(pack.worker.requiredExecutionMode, "REAL_BLENDER_WORKER_EXECUTION");
  assert.equal(pack.approval.operatorReviewRequired, true);
  assert.equal(pack.approval.autoApproval, false);
  for (const output of ["COMPONENT_ID_RENDER.png", "COMPONENT_ID_MAP.json", "SHOP_FRONT.png", "SHOP_BACK.png", "SHOP_LEFT.png", "SHOP_RIGHT.png", "SHOP_FOUR_SIDE_REVIEW_BOARD.png"]) assert.ok(pack.requiredOutputs.includes(output));
});

test("pack remains blocked until the supplied visual target is reproduced", () => {
  assert.equal(pack.status, "SPEC_ONLY_REFERENCE_MISMATCH_BLOCKS_BUILD_APPROVAL");
});
