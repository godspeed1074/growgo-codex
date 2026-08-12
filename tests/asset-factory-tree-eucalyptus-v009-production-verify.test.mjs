import test from "node:test";
import assert from "node:assert/strict";
import { verifyTreeEucalyptusV009 } from "../asset-factory/tree-eucalyptus-v009-production-verify.mjs";

test("TREE_EUCALYPTUS_001 v009 is a protected, grounded, mobile-ready review candidate", () => {
  const result = verifyTreeEucalyptusV009();
  assert.equal(result.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.previousVersion, "v007");
  assert.equal(result.targetVersion, "v009");
  assert.equal(result.technicalValidationPassed, true);
  assert.ok(result.lods.CLOSE.triangleCount <= 18000);
  assert.ok(result.lods.GAMEPLAY.triangleCount <= 8000);
  assert.ok(result.lods.GAMEPLAY.triangleCount >= 5500);
  assert.ok(result.lods.GAMEPLAY.triangleCount <= 8000);
  assert.ok(result.lods.MAP.triangleCount <= 2000);
  assert.ok(result.lods.CLOSE.triangleCount > result.lods.GAMEPLAY.triangleCount);
  assert.ok(result.lods.GAMEPLAY.triangleCount > result.lods.MAP.triangleCount);
  assert.equal(result.operatorVisualApprovalRequired, true);
  assert.equal(result.runtimeActivated, false);
  assert.equal(result.publishingPerformed, false);
  assert.deepEqual(result.textureAtlas.dimensions, [512, 512]);
  assert.ok(result.lods.GAMEPLAY.alphaModes.includes("MASK"));
  assert.equal(result.lods.GAMEPLAY.nodeNames.some((name) => name.includes("GRAPHIC_BARK")), false);
});
