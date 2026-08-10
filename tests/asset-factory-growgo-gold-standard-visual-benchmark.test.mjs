import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "growgo-gold-standard-visual-benchmark.mjs"
  )
);

test("Gold Standard benchmark set exposes exactly three protected benchmark assets", () => {
  const benchmarkSet = moduleUnderTest.getGrowGoGoldStandardVisualBenchmarkSet();

  assert.equal(
    benchmarkSet.schemaId,
    "GROWGO_GOLD_STANDARD_VISUAL_ASSET_SET_001"
  );
  assert.equal(benchmarkSet.benchmarkAssets.length, 3);
  assert.deepEqual(
    benchmarkSet.benchmarkAssets.map((asset) => asset.benchmarkCategory),
    ["tree", "shrub", "building"]
  );
  assert.ok(Object.isFrozen(benchmarkSet));
  assert.ok(Object.isFrozen(benchmarkSet.benchmarkAssets));
});

test("Gold Standard benchmark set preserves protected next-revision planning", () => {
  const benchmarkSet = moduleUnderTest.getGrowGoGoldStandardVisualBenchmarkSet();

  const tree = benchmarkSet.benchmarkAssets.find(
    (asset) => asset.benchmarkCategory === "tree"
  );
  const shrub = benchmarkSet.benchmarkAssets.find(
    (asset) => asset.benchmarkCategory === "shrub"
  );
  const building = benchmarkSet.benchmarkAssets.find(
    (asset) => asset.benchmarkCategory === "building"
  );

  assert.equal(tree.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(tree.protectedRevisionPlan.targetRevisionVersion, "v002");
  assert.equal(tree.selectedCurrentVersion, "v002");
  assert.equal(tree.currentLifecycleStatus, "gold_standard_operator_approved");
  assert.equal(tree.operatorApprovalStatus, "APPROVED_GOLD_STANDARD");
  assert.equal(tree.goldStandardApprovalRecord.approvedVersion, "v002");
  assert.equal(
    tree.goldStandardApprovalRecord.gameplayGlb,
    "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb"
  );
  assert.equal(tree.goldStandardApprovalRecord.geographicAnchoringVerified, true);
  assert.equal(tree.goldStandardApprovalRecord.approvalScaleMultiplier, 1);
  assert.equal(tree.goldStandardApprovalRecord.historicalVersionPreserved, "v001");
  assert.equal(shrub.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(shrub.protectedRevisionPlan.targetRevisionVersion, "v003");
  assert.equal(building.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(building.protectedRevisionPlan.targetRevisionVersion, "1.1.0");

  for (const asset of benchmarkSet.benchmarkAssets) {
    assert.equal(
      asset.protectedRevisionPlan.overwriteHistoricalVersionsForbidden,
      true
    );
  }
  assert.equal(shrub.operatorApprovalStatus, "PENDING_GOLD_STANDARD_REVIEW");
  assert.equal(building.operatorApprovalStatus, "PENDING_GOLD_STANDARD_REVIEW");
});

test("Gold Standard benchmark validation keeps review checkpoints and safety gates intact", () => {
  const validation = moduleUnderTest.validateGrowGoGoldStandardVisualBenchmarkSet();
  const benchmarkSet = moduleUnderTest.getGrowGoGoldStandardVisualBenchmarkSet();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.equal(
    benchmarkSet.benchmarkStatus,
    "tree_gold_standard_approved_shrub_building_pending"
  );
  assert.deepEqual(
    [...validation.benchmarkCategories].sort(),
    ["building", "shrub", "tree"]
  );
  assert.equal(
    benchmarkSet.operatorApprovalPolicy.perAssetCheckpointRequired,
    true
  );
  assert.equal(
    benchmarkSet.operatorApprovalPolicy.automaticApprovalForbidden,
    true
  );
  assert.deepEqual(benchmarkSet.runtimeSafety, {
    lifecycleExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    runtimeExecutionEnabled: false
  });
});
