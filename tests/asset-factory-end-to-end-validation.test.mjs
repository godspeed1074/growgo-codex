import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const endToEndModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-factory-end-to-end-validation.mjs")
);

test("full lifecycle success runs residential asset through active registration", () => {
  const layer = endToEndModule.createAssetFactoryEndToEndValidationLayer();
  const result = layer.runValidation({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });

  assert.equal(result.assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
  assert.equal(result.finalStatus, "ACTIVE");
  assert.equal(result.pipelineStages.activeAsset.completed, true);
  assert.equal(result.validation.idsPreserved, true);
});

test("failure at quality stage stops pipeline before approval", () => {
  const layer = endToEndModule.createAssetFactoryEndToEndValidationLayer();
  const result = layer.runValidation({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    metadataCompleteOverride: false
  });

  assert.equal(result.finalStatus, "FAILED_AT_QUALITY");
  assert.equal(result.pipelineStages.approvalRecord.completed, false);
  assert.equal(result.validation.qualityPassed, true);
});

test("failure at approval stage is surfaced when approval cannot proceed", () => {
  const layer = endToEndModule.createAssetFactoryEndToEndValidationLayer();

  assert.throws(
    () =>
      layer.runValidation({
        assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
        recipeExistsOverride: false,
        expectApprovalFailure: true
      }),
    /quality checks did not pass/
  );
});

test("same input produces deterministic same pipeline result", () => {
  const layer = endToEndModule.createAssetFactoryEndToEndValidationLayer();
  const first = layer.runValidation({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });
  const second = layer.runValidation({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicFingerprint,
    second.validation.deterministicFingerprint
  );
});

test("explicit end-to-end validation passes contract checks", () => {
  const layer = endToEndModule.createAssetFactoryEndToEndValidationLayer();
  const result = layer.runValidation({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });
  const validation = endToEndModule.validateAssetFactoryEndToEndResult(result);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetFactoryEndToEndResult.validation.validationPassed, true);
});
