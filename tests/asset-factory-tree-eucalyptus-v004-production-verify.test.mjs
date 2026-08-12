import test from "node:test";
import assert from "node:assert/strict";
import { verifyTreeEucalyptusV004 } from "../asset-factory/tree-eucalyptus-v004-production-verify.mjs";

test("TREE_EUCALYPTUS_001 v004 is a protected, grounded, mobile-ready review candidate", () => {
  const result = verifyTreeEucalyptusV004();
  assert.equal(result.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.previousVersion, "v003");
  assert.equal(result.targetVersion, "v004");
  assert.equal(result.technicalValidationPassed, true);
  assert.ok(result.lods.CLOSE.triangleCount <= 18000);
  assert.ok(result.lods.GAMEPLAY.triangleCount <= 8000);
  assert.ok(result.lods.MAP.triangleCount <= 2000);
  assert.ok(result.lods.CLOSE.triangleCount > result.lods.GAMEPLAY.triangleCount);
  assert.ok(result.lods.GAMEPLAY.triangleCount > result.lods.MAP.triangleCount);
  assert.equal(result.operatorVisualApprovalRequired, true);
  assert.equal(result.runtimeActivated, false);
  assert.equal(result.publishingPerformed, false);
});
