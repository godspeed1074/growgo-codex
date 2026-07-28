import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const controlCentreModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-control-centre.mjs")
);

test("control centre generation builds unified operational record", () => {
  const layer = controlCentreModule.createAssetControlCentreLayer();

  assert.equal(layer.record.schemaId, "ASSET_CONTROL_CENTRE_RECORD_001");
  assert.equal(layer.record.controlAreas.length, 6);
  assert.equal(layer.record.navigation.productionReportId.length > 0, true);
});

test("system aggregation exposes connected workflow summaries", () => {
  const layer = controlCentreModule.createAssetControlCentreLayer();
  const { systemStatus, activeWorkflows } = layer.record;

  assert.equal(systemStatus.production.length > 0, true);
  assert.equal(systemStatus.governance.length > 0, true);
  assert.equal(activeWorkflows.activeBatchCount >= 0, true);
  assert.equal(activeWorkflows.automationSuggestionCount >= 0, true);
});

test("blocked item visibility includes production blockers", () => {
  const layer = controlCentreModule.createAssetControlCentreLayer();

  assert.equal(layer.record.blockedItems.length > 0, true);
  assert.ok(layer.record.blockedItems.some((item) => item.area === "PRODUCTION"));
});

test("health summary reflects connected governance and production state", () => {
  const layer = controlCentreModule.createAssetControlCentreLayer();
  const { healthSummary, systemStatus } = layer.record;

  assert.equal(healthSummary.governanceHealth, systemStatus.governance);
  assert.equal(healthSummary.productionState, systemStatus.production);
  assert.equal(healthSummary.pendingActionCount, layer.record.pendingActions.length);
});

test("same input produces deterministic same control-centre output", () => {
  const first = controlCentreModule.createAssetControlCentreLayer();
  const second = controlCentreModule.createAssetControlCentreLayer();

  assert.deepEqual(first.record, second.record);
});
