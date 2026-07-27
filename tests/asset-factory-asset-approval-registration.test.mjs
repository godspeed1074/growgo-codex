import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const approvalModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-approval-registration.mjs")
);
const authoringModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-authoring-workflow.mjs")
);
const qualityModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-quality-validation.mjs")
);

test("approval success creates pending review record for validated asset", () => {
  const layer = approvalModule.createAssetApprovalRegistrationLayer();
  const record = layer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(record.approvalStatus, "PENDING_REVIEW");
  assert.equal(record.validation.qualityPassed, true);
});

test("approval blocked by quality failure", () => {
  const authoringLayer = authoringModule.createAssetAuthoringWorkflowLayer();
  let authoringRecord = authoringLayer.createRecord({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });
  authoringRecord = authoringLayer.advanceRecord(authoringRecord, "AUTHORING_STARTED");
  authoringRecord = authoringLayer.advanceRecord(authoringRecord, "AUTHORING_COMPLETE");
  authoringRecord = authoringLayer.advanceRecord(authoringRecord, "VALIDATION_PENDING");

  const qualityLayer = qualityModule.createAssetQualityValidationLayer();
  const failedQualityReport = qualityLayer.validateAsset({
    authoringRecord,
    metadataCompleteOverride: false
  }).report;

  const layer = approvalModule.createAssetApprovalRegistrationLayer();
  assert.throws(
    () =>
      layer.createApprovalRecord({
        authoringRecord,
        qualityReport: failedQualityReport
      }),
    /quality checks did not pass/
  );
});

test("registration success advances approval record to registered and active", () => {
  const layer = approvalModule.createAssetApprovalRegistrationLayer();
  const pending = layer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const approved = layer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  const registered = layer.advanceApprovalRecord(approved, "REGISTERED");
  const active = layer.advanceApprovalRecord(registered, "ACTIVE");

  assert.equal(registered.approvalStatus, "REGISTERED");
  assert.equal(registered.registrationStatus, "registered");
  assert.equal(active.approvalStatus, "ACTIVE");
  assert.equal(active.registrationStatus, "active_library_entry");
});

test("invalid asset handling rejects unknown asset approval input", () => {
  const layer = approvalModule.createAssetApprovalRegistrationLayer();

  assert.throws(
    () =>
      layer.createApprovalRecord({
        assetId: "MISSING_ASSET_001"
      }),
    /No approved asset creation specification exists|not registered/
  );
});

test("same input produces deterministic same approval record", () => {
  const layer = approvalModule.createAssetApprovalRegistrationLayer();
  const first = layer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicApprovalHash,
    second.validation.deterministicApprovalHash
  );
});

test("explicit asset approval validation passes contract checks", () => {
  const layer = approvalModule.createAssetApprovalRegistrationLayer();
  const record = layer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validation = approvalModule.validateAssetApprovalRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetApprovalRecord.validation.validationPassed, true);
});
