import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const qualityModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-quality-validation.mjs")
);
const authoringModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-authoring-workflow.mjs")
);

test("valid asset produces approval-ready quality report", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const result = layer.validateAsset({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(result.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(result.report.approvalReadiness, "READY_FOR_APPROVAL");
  assert.equal(result.report.validationCategories.PERFORMANCE_VALIDATION_001.passed, true);
});

test("missing metadata produces quality warning and not-ready report", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const result = layer.validateAsset({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    metadataCompleteOverride: false
  });

  assert.equal(result.report.approvalReadiness, "NOT_READY");
  assert.equal(
    result.report.validationCategories.MODULAR_BIBLE_VALIDATION_001.passed,
    false
  );
  assert.ok(result.report.warnings.includes("metadata incomplete"));
});

test("performance failure is reported when texture budget evidence is missing", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const result = layer.validateAsset({
    assetId: "TREE_EUCALYPTUS_001",
    textureBudgetValidOverride: false
  });

  assert.equal(result.report.approvalReadiness, "NOT_READY");
  assert.equal(
    result.report.validationCategories.PERFORMANCE_VALIDATION_001.checks.textureBudgetValid,
    false
  );
});

test("compatibility failure is reported when recipe compatibility fails", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const result = layer.validateAsset({
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
    recipeExistsOverride: false
  });

  assert.equal(result.report.approvalReadiness, "NOT_READY");
  assert.equal(
    result.report.validationCategories.ATLAS_COMPATIBILITY_VALIDATION_001.passed,
    false
  );
  assert.ok(result.report.warnings.includes("recipe compatibility failed"));
});

test("same input produces deterministic same quality report", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const input = {
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001"
  };

  const first = layer.validateAsset(input);
  const second = layer.validateAsset(input);

  assert.deepEqual(first.report, second.report);
  assert.equal(
    first.validation.deterministicValidationHash,
    second.validation.deterministicValidationHash
  );
});

test("explicit quality validation result passes contract checks", () => {
  const layer = qualityModule.createAssetQualityValidationLayer();
  const authoringLayer = authoringModule.createAssetAuthoringWorkflowLayer();
  const record = authoringLayer.createRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const result = layer.validateAsset({
    authoringRecord: record
  });
  const validation = qualityModule.validateAssetQualityValidationResult(result);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetQualityValidationResult.validation.validationPassed, true);
});
