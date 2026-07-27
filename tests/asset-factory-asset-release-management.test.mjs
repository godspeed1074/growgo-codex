import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const releaseModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-release-management.mjs"
  )
);
const publishingModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-publishing-pipeline.mjs"
  )
);
const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);
const environmentModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-environment-separation.mjs"
  )
);

test("create release groups production published assets into deterministic release package", () => {
  const layer = releaseModule.createAssetReleaseManagementLayer();
  const record = layer.createReleaseRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });

  assert.equal(record.assetList.length, 1);
  assert.equal(record.assetList[0], "GROUND_BEACH_SAND_001");
  assert.equal(record.releaseStatus, "DRAFT");
  assert.equal(record.includedVersions[0].versionNumber, "1.0.0");
});

test("validate release confirms published production contents", () => {
  const layer = releaseModule.createAssetReleaseManagementLayer();
  const record = layer.createReleaseRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });
  const validation = releaseModule.validateAssetReleaseRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetReleaseRecord.validation.assetsPublished, true);
  assert.equal(
    validation.assetReleaseRecord.validation.productionEnvironmentConfirmed,
    true
  );
  assert.equal(validation.assetReleaseRecord.validation.noUnapprovedAssets, true);
});

test("block invalid release rejects assets not yet published", () => {
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const environmentLayer = environmentModule.createAssetEnvironmentSeparationLayer();
  const layer = releaseModule.createAssetReleaseManagementLayer(
    publishingLayer,
    versioningLayer,
    environmentLayer
  );
  const readyPublish = publishingLayer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.throws(
    () =>
      layer.createReleaseRecord({
        assetIds: ["GROUND_BEACH_SAND_001"],
        publishRecords: [readyPublish]
      }),
    /promotionAllowed must be true/
  );
});

test("archive release advances released package into archived state", () => {
  const layer = releaseModule.createAssetReleaseManagementLayer();
  const draft = layer.createReleaseRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });
  const pending = layer.advanceReleaseRecord(draft, "VALIDATION_PENDING");
  const ready = layer.advanceReleaseRecord(pending, "READY");
  const released = layer.advanceReleaseRecord(ready, "RELEASED");
  const archived = layer.advanceReleaseRecord(released, "ARCHIVED");

  assert.equal(released.releaseStatus, "RELEASED");
  assert.equal(archived.releaseStatus, "ARCHIVED");
});

test("same input produces deterministic same release output", () => {
  const layer = releaseModule.createAssetReleaseManagementLayer();
  const first = layer.createReleaseRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });
  const second = layer.createReleaseRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicReleaseHash,
    second.validation.deterministicReleaseHash
  );
});
