import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const dashboardModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-production-review-dashboard.mjs"
  )
);
const approvalModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-approval-registration.mjs"
  )
);

test("dashboard generation builds unified Asset Factory production review report", () => {
  const layer = dashboardModule.createAssetProductionReviewLayer();
  const report = layer.report;

  assert.equal(report.schemaId, "ASSET_FACTORY_PRODUCTION_REVIEW_REPORT_001");
  assert.equal(report.activeBatches.length, 3);
  assert.equal(report.assetProgress.length, 5);
  assert.equal(report.qualityStatus.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(report.reviewStatus.variantComparisonAssetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
});

test("status aggregation summarizes quality review and approval readiness deterministically", () => {
  const layer = dashboardModule.createAssetProductionReviewLayer();
  const report = layer.report;

  assert.equal(report.overallSummaryState, "QUALITY_REVIEW");
  assert.equal(report.qualityStatus.summaryState, "QUALITY_REVIEW");
  assert.equal(report.approvalStatus.summaryState, "APPROVAL_READY");
  assert.equal(report.recommendedActions[0].actionId, "ACTION_UNBLOCK_DEPENDENCIES");
});

test("blocked asset detection identifies blocked dependent assets", () => {
  const layer = dashboardModule.createAssetProductionReviewLayer();

  assert.equal(layer.report.blockedAssets.length, 3);
  assert.deepEqual(
    layer.report.blockedAssets.map((entry) => entry.assetId),
    [
      "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
      "PARK_TREATMENT_GREENERY_SET_001",
      "RESIDENTIAL_DETAIL_GARDEN_SET_001"
    ]
  );
});

test("approval readiness stays visible when a valid pending approval record is supplied", () => {
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const approvalRecord = approvalLayer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  const layer = dashboardModule.createAssetProductionReviewLayer({
    approvalRecord
  });

  assert.equal(layer.report.approvalStatus.approvalStatus, "PENDING_REVIEW");
  assert.equal(layer.report.approvalStatus.summaryState, "APPROVAL_READY");
});

test("same dashboard inputs produce deterministic same review report", () => {
  const first = dashboardModule.createAssetProductionReviewLayer();
  const second = dashboardModule.createAssetProductionReviewLayer();

  assert.deepEqual(first.report, second.report);
  assert.equal(
    first.validation.deterministicSummaryHash,
    second.validation.deterministicSummaryHash
  );
});

test("explicit production review validation passes contract checks", () => {
  const layer = dashboardModule.createAssetProductionReviewLayer();
  const validation = dashboardModule.validateAssetProductionReviewReport(layer.report);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryProductionReviewReport.validation.sourceRecordsValid,
    true
  );
  assert.equal(
    validation.assetFactoryProductionReviewReport.validation.statusesConsistent,
    true
  );
  assert.equal(
    validation.assetFactoryProductionReviewReport.validation.noMutationOfSourceRecords,
    true
  );
});
