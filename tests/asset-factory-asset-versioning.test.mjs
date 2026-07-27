import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);
const publishingModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-publishing-pipeline.mjs")
);
const approvalModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-approval-registration.mjs")
);

test("create version record builds published version history for approved asset", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const record = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(record.versionNumber, "1.0.0");
  assert.equal(record.versionState, "PUBLISHED");
  assert.equal(record.activeStatus, true);
});

test("version increment derives next patch version from parent version", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const record = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001",
    parentVersion: "1.0.0",
    changeSummary: "Patch update for coastal ground polish."
  });

  assert.equal(record.versionNumber, "1.0.1");
  assert.equal(record.parentVersion, "1.0.0");
});

test("publish version keeps publish linkage and published state", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const record = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.publishReference.publishStatus, "PUBLISHED");
  assert.equal(record.versionState, "PUBLISHED");
  assert.equal(record.validation.publishLinked, true);
});

test("deprecate version advances published version into deprecated state", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const record = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const deprecated = layer.advanceVersionRecord(record, "DEPRECATED");

  assert.equal(deprecated.versionState, "DEPRECATED");
  assert.equal(deprecated.activeStatus, false);
  assert.equal(deprecated.publishReference.publishStatus, "RETIRED");
});

test("invalid version handling rejects incomplete approval lineage", () => {
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const pendingApproval = approvalLayer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();
  const published = publishingLayer
    .advancePublishRecord(
      publishingLayer.advancePublishRecord(
        publishingLayer.createPublishRecord({ assetId: "GROUND_BEACH_SAND_001" }),
        "PUBLISHING"
      ),
      "PUBLISHED"
    );
  const layer = versioningModule.createAssetVersioningLayer();

  assert.throws(
    () =>
      layer.createVersionRecord({
        approvalRecord: pendingApproval,
        publishRecord: published
      }),
    /approvalLinked must be true/
  );
});

test("same input produces deterministic same version record", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const first = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicVersionHash,
    second.validation.deterministicVersionHash
  );
});

test("explicit asset version validation passes contract checks", () => {
  const layer = versioningModule.createAssetVersioningLayer();
  const record = layer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validation = versioningModule.validateAssetVersionRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetVersionRecord.validation.versionSequenceValid, true);
  assert.equal(validation.assetVersionRecord.validation.assetReferenceValid, true);
  assert.equal(validation.assetVersionRecord.validation.approvalLinked, true);
  assert.equal(validation.assetVersionRecord.validation.publishLinked, true);
});
