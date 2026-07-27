import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const comparisonModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-variant-comparison.mjs")
);
const variantModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-variant-system.mjs")
);

test("variant comparison builds review-ready record with deterministic comparison data", () => {
  const layer = comparisonModule.createAssetVariantComparisonLayer();
  const record = layer.comparisonRecord;

  assert.equal(record.assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
  assert.equal(record.reviewStatus, "COMPARISON_READY");
  assert.deepEqual(
    record.variantList.map((entry) => entry.selectedVariant),
    ["coastal", "rural", "suburban"]
  );
  assert.deepEqual(record.comparisonCriteria, [
    "style_match",
    "biome_compatibility",
    "atlas_compatibility",
    "performance_budget",
    "reuse_value"
  ]);
  assert.equal(record.validation.validationPassed, true);
});

test("variant comparison selects a deterministic recommended variant", () => {
  const layer = comparisonModule.createAssetVariantComparisonLayer();
  const recommended = layer.comparisonRecord.recommendedVariant;

  assert.equal(recommended.variantId, "coastal");
  assert.equal(recommended.assetId, "BUILDING_RESIDENTIAL_HOUSE_COASTAL_001");
  assert.equal(recommended.recommendationScore, 81);
  assert.match(recommended.reason, /style \(90\) and biome compatibility \(95\)/);
});

test("invalid variant assignment handling rejects mismatched base assets", () => {
  const variantSystem = variantModule.createAssetVariantSystem();
  const validAssignment = variantSystem.resolveVariant({
    baseAssetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "RESIDENTIAL_COASTAL",
      styleProfile: "PAPERCUT_COASTAL"
    }
  });

  assert.throws(
    () =>
      comparisonModule.createAssetVariantComparisonLayer({
        variantAssignments: [
          {
            ...validAssignment,
            baseAssetId: "TREE_EUCALYPTUS_001"
          }
        ]
      }),
    /variantsBelongToAsset must be true/
  );
});

test("same comparison input produces deterministic same output", () => {
  const first = comparisonModule.createAssetVariantComparisonLayer();
  const second = comparisonModule.createAssetVariantComparisonLayer();

  assert.deepEqual(first.comparisonRecord, second.comparisonRecord);
  assert.equal(
    first.validation.deterministicComparisonHash,
    second.validation.deterministicComparisonHash
  );
});

test("explicit comparison validation passes contract checks", () => {
  const layer = comparisonModule.createAssetVariantComparisonLayer();
  const validation = comparisonModule.validateAssetVariantComparisonRecord(
    layer.comparisonRecord
  );

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetVariantComparisonRecord.validation.variantsBelongToAsset,
    true
  );
  assert.equal(
    validation.assetVariantComparisonRecord.validation.comparisonDataComplete,
    true
  );
  assert.equal(
    validation.assetVariantComparisonRecord.validation.deterministicRecommendation,
    true
  );
  assert.equal(
    validation.assetVariantComparisonRecord.validation.noApprovalBypass,
    true
  );
});
