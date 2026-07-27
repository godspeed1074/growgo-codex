import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const publishingModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-publishing-pipeline.mjs")
);
const approvalModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-approval-registration.mjs")
);

test("publish approved asset creates ready-to-publish record for active asset", () => {
  const layer = publishingModule.createAssetPublishingPipelineLayer();
  const record = layer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(record.version, "1.0.0");
  assert.equal(record.publishStatus, "READY_TO_PUBLISH");
  assert.equal(record.approvalReference.approvalStatus, "ACTIVE");
  assert.equal(record.qualityReference.approvalReadiness, "READY_FOR_APPROVAL");
});

test("block unapproved asset rejects pending approval records", () => {
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const pendingApproval = approvalLayer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const layer = publishingModule.createAssetPublishingPipelineLayer();

  assert.throws(
    () =>
      layer.createPublishRecord({
        approvalRecord: pendingApproval
      }),
    /approval status is ACTIVE/
  );
});

test("version handling rejects publish records whose version does not match registry", () => {
  const layer = publishingModule.createAssetPublishingPipelineLayer();

  assert.throws(
    () =>
      layer.createPublishRecord({
        assetId: "GROUND_BEACH_SAND_001",
        version: "2.0.0"
      }),
    /versionValid must be true/
  );
});

test("retirement handling advances published assets into retired state", () => {
  const layer = publishingModule.createAssetPublishingPipelineLayer();
  const ready = layer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const publishing = layer.advancePublishRecord(ready, "PUBLISHING");
  const published = layer.advancePublishRecord(publishing, "PUBLISHED");
  const retired = layer.advancePublishRecord(published, "RETIRED");

  assert.equal(published.publishStatus, "PUBLISHED");
  assert.equal(retired.publishStatus, "RETIRED");
  assert.deepEqual(retired.lifecycleHistory, [
    "READY_TO_PUBLISH",
    "PUBLISHING",
    "PUBLISHED",
    "RETIRED"
  ]);
});

test("same input produces deterministic same publish record", () => {
  const layer = publishingModule.createAssetPublishingPipelineLayer();
  const first = layer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicPublishHash,
    second.validation.deterministicPublishHash
  );
});

test("explicit asset publish validation passes contract checks", () => {
  const layer = publishingModule.createAssetPublishingPipelineLayer();
  const record = layer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validation = publishingModule.validateAssetPublishRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetPublishRecord.validation.approvalComplete, true);
  assert.equal(validation.assetPublishRecord.validation.qualityPassed, true);
  assert.equal(validation.assetPublishRecord.validation.registryValid, true);
  assert.equal(validation.assetPublishRecord.validation.versionValid, true);
});
