import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const authoringModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-authoring-workflow.mjs")
);

test("workflow creation builds spec-ready authoring record from approved specification", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const record = layer.createRecord({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });

  assert.equal(record.assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
  assert.equal(record.workflowState, "SPEC_READY");
  assert.equal(record.validation.specificationExists, true);
});

test("state transitions move authoring record through valid workflow path", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const specReady = layer.createRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const started = layer.advanceRecord(specReady, "AUTHORING_STARTED");
  const complete = layer.advanceRecord(started, "AUTHORING_COMPLETE");
  const pending = layer.advanceRecord(complete, "VALIDATION_PENDING");

  assert.equal(started.workflowState, "AUTHORING_STARTED");
  assert.equal(complete.workflowState, "AUTHORING_COMPLETE");
  assert.equal(pending.workflowState, "VALIDATION_PENDING");
});

test("validation failure handling rejects invalid workflow state transitions", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const record = layer.createRecord({
    assetId: "TREE_EUCALYPTUS_001"
  });

  assert.throws(
    () => layer.advanceRecord(record, "APPROVED"),
    /Cannot transition asset authoring record/
  );
});

test("approval path reaches approved and registered states with valid status changes", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const specReady = layer.createRecord({
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001"
  });
  const started = layer.advanceRecord(specReady, "AUTHORING_STARTED");
  const complete = layer.advanceRecord(started, "AUTHORING_COMPLETE");
  const pending = layer.advanceRecord(complete, "VALIDATION_PENDING");
  const approved = layer.advanceRecord(pending, "APPROVED");
  const registered = layer.advanceRecord(approved, "REGISTERED");

  assert.equal(approved.validationStatus, "approved");
  assert.equal(approved.registrationStatus, "approved_pending_registration");
  assert.equal(registered.workflowState, "REGISTERED");
  assert.equal(registered.registrationStatus, "registered");
});

test("same input produces deterministic same authoring workflow record", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const first = layer.createRecord({
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001"
  });
  const second = layer.createRecord({
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicWorkflowHash,
    second.validation.deterministicWorkflowHash
  );
});

test("explicit asset authoring record validation passes contract checks", () => {
  const layer = authoringModule.createAssetAuthoringWorkflowLayer();
  const record = layer.createRecord({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001"
  });
  const validation = authoringModule.validateAssetAuthoringRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetAuthoringRecord.validation.validationPassed, true);
});
