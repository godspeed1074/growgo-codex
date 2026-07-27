import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetProductionBatchModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-production-batch.mjs")
);

test("batch creation groups queue assets into deterministic environment-ready sets", () => {
  const layer = assetProductionBatchModule.createAssetProductionBatchLayer();

  assert.equal(layer.batchSet.summary.batchCount, 3);
  assert.deepEqual(
    layer.batchSet.batches.map((batch) => batch.batchId),
    [
      "CIVIC_LOCATION_BATCH_001",
      "TOWN_MAIN_STREET_BATCH_001",
      "COASTAL_LOCATION_BATCH_001"
    ]
  );
  assert.equal(layer.batchSet.summary.totalAssetCount, 17);
});

test("dependency validation keeps anchor assets and support assets attached to each batch", () => {
  const layer = assetProductionBatchModule.createAssetProductionBatchLayer();
  const mainStreetBatch = layer.getBatchById("TOWN_MAIN_STREET_BATCH_001");

  assert.ok(mainStreetBatch);
  assert.equal(mainStreetBatch.dependencies.length, 3);
  assert.deepEqual(
    mainStreetBatch.dependencies.map((dependency) => dependency.targetId),
    [
      "ROAD_SURFACE_RESIDENTIAL_STREET_001",
      "SIDEWALK_CURB_CROSSING_001",
      "STREET_FURNITURE_STANDARD_SET_001"
    ]
  );
  assert.equal(mainStreetBatch.expectedReuse.classification, "VERY_HIGH");
});

test("duplicate protection fails validation when the same asset appears in multiple batches", () => {
  const layer = assetProductionBatchModule.createAssetProductionBatchLayer();
  const duplicateBatchSet = structuredClone(layer.batchSet);

  duplicateBatchSet.batches[1].assetList[0].assetId =
    duplicateBatchSet.batches[0].assetList[0].assetId;

  const validation = assetProductionBatchModule.validateAssetProductionBatchSet(
    duplicateBatchSet
  );

  assert.equal(validation.ok, false);
  assert.match(validation.message, /noDuplicateBatchEntries/i);
});

test("dependency validation fails when a batch dependency points to a missing asset", () => {
  const layer = assetProductionBatchModule.createAssetProductionBatchLayer();
  const invalidBatchSet = structuredClone(layer.batchSet);

  invalidBatchSet.batches[0].dependencies[0].targetId = "UNKNOWN_ASSET_001";

  const validation = assetProductionBatchModule.validateAssetProductionBatchSet(
    invalidBatchSet
  );

  assert.equal(validation.ok, false);
  assert.match(validation.message, /dependenciesValid/i);
});

test("same inputs produce deterministic same production batches", () => {
  const first = assetProductionBatchModule.createAssetProductionBatchLayer();
  const second = assetProductionBatchModule.createAssetProductionBatchLayer();

  assert.deepEqual(first.batchSet, second.batchSet);
  assert.equal(
    first.validation.deterministicBatchHash,
    second.validation.deterministicBatchHash
  );
});

test("explicit batch validation passes contract checks", () => {
  const layer = assetProductionBatchModule.createAssetProductionBatchLayer();
  const validation = assetProductionBatchModule.validateAssetProductionBatchSet(
    layer.batchSet
  );

  assert.equal(validation.ok, true);
  assert.equal(validation.assetProductionBatchSet.validation.assetsExist, true);
  assert.equal(validation.assetProductionBatchSet.validation.dependenciesValid, true);
  assert.equal(
    validation.assetProductionBatchSet.validation.noDuplicateBatchEntries,
    true
  );
  assert.equal(
    validation.assetProductionBatchSet.validation.deterministicOrdering,
    true
  );
});
