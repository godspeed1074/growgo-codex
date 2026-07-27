import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const batchExecutionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-authoring-batch-execution.mjs"
  )
);

test("batch creation builds civic authoring batch with foundation assets ready", () => {
  const layer = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();
  const record = layer.batchRecord;

  assert.equal(record.batchId, "CIVIC_LOCATION_BATCH_001");
  assert.equal(record.assets[0].assetState, "READY");
  assert.equal(record.assets[1].assetState, "READY");
  assert.equal(record.assets[2].assetState, "NOT_STARTED");
  assert.equal(record.assets[2].dependencyStatus, "BLOCKED");
  assert.equal(record.completionPercentage, 8);
});

test("state progression advances one foundation asset through completion", () => {
  const layer = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();
  let record = layer.batchRecord;

  record = layer.advanceAsset(
    record,
    "BUILDING_CIVIC_SPORTS_PAVILION_001",
    "IN_PROGRESS"
  );
  record = layer.advanceAsset(
    record,
    "BUILDING_CIVIC_SPORTS_PAVILION_001",
    "AUTHORING_COMPLETE"
  );
  record = layer.advanceAsset(
    record,
    "BUILDING_CIVIC_SPORTS_PAVILION_001",
    "VALIDATION_PENDING"
  );
  record = layer.advanceAsset(
    record,
    "BUILDING_CIVIC_SPORTS_PAVILION_001",
    "COMPLETE"
  );

  const pavilion = record.assets.find(
    (entry) => entry.assetId === "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );
  const transport = record.assets.find(
    (entry) => entry.assetId === "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001"
  );

  assert.equal(pavilion.assetState, "COMPLETE");
  assert.equal(pavilion.validationStatus, "PASSED");
  assert.equal(transport.assetState, "READY");
  assert.equal(transport.dependencyStatus, "CLEAR");
  assert.equal(record.completionPercentage, 32);
});

test("dependency blocking prevents supporting assets from starting early", () => {
  const layer = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();

  assert.throws(
    () =>
      layer.advanceAsset(
        layer.batchRecord,
        "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
        "IN_PROGRESS"
      ),
    /blocked by dependencies/
  );
});

test("detail assets remain blocked until all supporting dependencies complete", () => {
  const layer = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();
  let record = layer.batchRecord;

  for (const state of [
    "IN_PROGRESS",
    "AUTHORING_COMPLETE",
    "VALIDATION_PENDING",
    "COMPLETE"
  ]) {
    record = layer.advanceAsset(record, "BUILDING_CIVIC_SPORTS_PAVILION_001", state);
  }

  for (const state of [
    "IN_PROGRESS",
    "AUTHORING_COMPLETE",
    "VALIDATION_PENDING",
    "COMPLETE"
  ]) {
    record = layer.advanceAsset(record, "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001", state);
  }

  const detail = record.assets.find(
    (entry) => entry.assetId === "RESIDENTIAL_DETAIL_GARDEN_SET_001"
  );

  assert.equal(detail.assetState, "NOT_STARTED");
  assert.equal(detail.dependencyStatus, "BLOCKED");
  assert.deepEqual(detail.blockedBy, ["PARK_TREATMENT_GREENERY_SET_001"]);
});

test("same inputs produce deterministic same batch execution record", () => {
  const first = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();
  const second = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();

  assert.deepEqual(first.batchRecord, second.batchRecord);
  assert.equal(
    first.validation.deterministicBatchExecutionHash,
    second.validation.deterministicBatchExecutionHash
  );
});

test("explicit batch execution validation passes contract checks", () => {
  const layer = batchExecutionModule.createAssetAuthoringBatchExecutionLayer();
  const validation = batchExecutionModule.validateAssetAuthoringBatchRecord(
    layer.batchRecord
  );

  assert.equal(validation.ok, true);
  assert.equal(validation.assetAuthoringBatchRecord.validation.specificationExists, true);
  assert.equal(validation.assetAuthoringBatchRecord.validation.assetIdsValid, true);
  assert.equal(validation.assetAuthoringBatchRecord.validation.dependencyOrderValid, true);
  assert.equal(validation.assetAuthoringBatchRecord.validation.stateTransitionsValid, true);
});
