import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const automationModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-automation-rules.mjs")
);

test("validation failure trigger creates review-oriented automation actions", () => {
  const layer = automationModule.createAssetAutomationRuleLayer();
  const results = layer.evaluateEvent({
    eventType: "ASSET_VALIDATION_FAILED",
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    sourceRecordId: "QUALITY_REPORT_001",
    severity: "HIGH"
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].triggerEvent, "ASSET_VALIDATION_FAILED");
  assert.equal(results[0].matchedRule.actionType, "CREATE_REVIEW_TASK");
});

test("publish trigger includes release-note generation and discovery refresh suggestions", () => {
  const layer = automationModule.createAssetAutomationRuleLayer();
  const results = layer.evaluateEvent({
    eventType: "ASSET_PUBLISHED",
    assetId: "GROUND_BEACH_SAND_001",
    sourceRecordId: "PUBLISH_RECORD_001",
    severity: "MEDIUM"
  });

  assert.equal(results.length, 2);
  assert.ok(results.some((entry) => entry.matchedRule.actionType === "GENERATE_RELEASE_NOTE"));
  assert.ok(results.some((entry) => entry.matchedRule.actionType === "UPDATE_DISCOVERY_INDEX"));
});

test("impact trigger creates a high-impact report suggestion", () => {
  const layer = automationModule.createAssetAutomationRuleLayer();
  const results = layer.evaluateEvent({
    eventType: "ASSET_IMPACT_HIGH",
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
    sourceRecordId: "IMPACT_REPORT_001",
    severity: "HIGH"
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].matchedRule.actionType, "GENERATE_IMPACT_REPORT");
  assert.equal(results[0].executionStatus, "READY_FOR_REVIEW");
});

test("approval requirement is preserved for non-executing automation actions", () => {
  const layer = automationModule.createAssetAutomationRuleLayer();
  const results = layer.evaluateEvent({
    eventType: "ASSET_APPROVED",
    assetId: "GROUND_BEACH_SAND_001",
    sourceRecordId: "APPROVAL_RECORD_001",
    severity: "LOW"
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].approvalRequirement, "AUTHORIZATION_REQUIRED");
  assert.equal(results[0].executionStatus, "PENDING_APPROVAL");
});

test("same automation event produces deterministic same output", () => {
  const layer = automationModule.createAssetAutomationRuleLayer();
  const event = {
    eventType: "ASSET_VERSION_CREATED",
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
    sourceRecordId: "VERSION_RECORD_001",
    severity: "MEDIUM"
  };

  const first = layer.evaluateEvent(event);
  const second = layer.evaluateEvent(event);

  assert.deepEqual(first, second);
});
