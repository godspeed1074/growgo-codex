import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const previewReviewModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-preview-review.mjs")
);

test("preview creation builds inspection record with quality summary and variant data", () => {
  const layer = previewReviewModule.createAssetPreviewReviewLayer();
  const record = layer.previewRecord;

  assert.equal(record.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(record.previewStatus, "PREVIEW_DATA_AVAILABLE");
  assert.equal(record.reviewStatus, "PREVIEW_READY");
  assert.deepEqual(record.variantPreviewData.availableVariants, [
    "sports_pavilion",
    "changing_rooms",
    "recreation_building"
  ]);
  assert.equal(record.qualitySummary.reportId.length > 0, true);
});

test("review progression supports review loop and approval path", () => {
  const layer = previewReviewModule.createAssetPreviewReviewLayer();
  let record = layer.previewRecord;

  record = layer.advanceReview(record, "UNDER_REVIEW");
  assert.equal(record.reviewStatus, "UNDER_REVIEW");

  record = layer.advanceReview(record, "CHANGES_REQUESTED");
  assert.equal(record.reviewStatus, "CHANGES_REQUESTED");

  record = layer.advanceReview(record, "UNDER_REVIEW");
  record = layer.advanceReview(record, "REVIEW_APPROVED");

  assert.equal(record.reviewStatus, "REVIEW_APPROVED");
  assert.deepEqual(record.reviewHistory, [
    "PREVIEW_READY",
    "UNDER_REVIEW",
    "CHANGES_REQUESTED",
    "UNDER_REVIEW",
    "REVIEW_APPROVED"
  ]);
});

test("invalid asset handling rejects preview targets outside the batch specification", () => {
  const layer = previewReviewModule.createAssetPreviewReviewLayer();

  assert.throws(
    () =>
      layer.createPreviewRecord({
        assetId: "UNKNOWN_ASSET_001"
      }),
    /does not exist in the authoring batch record/
  );
});

test("same inputs produce deterministic same preview record", () => {
  const first = previewReviewModule.createAssetPreviewReviewLayer();
  const second = previewReviewModule.createAssetPreviewReviewLayer();

  assert.deepEqual(first.previewRecord, second.previewRecord);
  assert.equal(
    first.validation.deterministicPreviewHash,
    second.validation.deterministicPreviewHash
  );
});

test("explicit preview validation passes contract checks", () => {
  const layer = previewReviewModule.createAssetPreviewReviewLayer();
  const validation = previewReviewModule.validateAssetPreviewRecord(layer.previewRecord);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetPreviewRecord.validation.assetExists, true);
  assert.equal(
    validation.assetPreviewRecord.validation.previewReferencesValidAsset,
    true
  );
  assert.equal(validation.assetPreviewRecord.validation.qualityDataExists, true);
  assert.equal(validation.assetPreviewRecord.validation.reviewStateValid, true);
});
