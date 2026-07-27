import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const governanceModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-governance-dashboard.mjs"
  )
);
const productionReviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-production-review-dashboard.mjs"
  )
);
const impactModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-impact-analysis.mjs")
);
const auditModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-audit-trail.mjs")
);
const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);
const approvalModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-approval-registration.mjs"
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

test("dashboard generation summarizes Asset Factory lifecycle governance state", () => {
  const layer = governanceModule.createAssetGovernanceDashboardLayer();
  const report = layer.report;

  assert.equal(report.schemaId, governanceModule.assetGovernanceReportSchemaId);
  assert.equal(report.totalAssets > 0, true);
  assert.equal(report.recentChanges.count > 0, true);
  assert.equal(report.versionHealth.assetId, "GROUND_BEACH_SAND_001");
});

test("health calculation escalates when high-risk governance signals are present", () => {
  const productionReviewLayer = productionReviewModule.createAssetProductionReviewLayer();
  const impactLayer = impactModule.createAssetImpactAnalysisLayer();
  const auditLayer = auditModule.createAssetAuditTrailLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();
  const publishReadyRecord = publishingLayer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  const layer = governanceModule.createAssetGovernanceDashboardLayer(
    { publishRecord: publishReadyRecord },
    productionReviewLayer,
    impactLayer,
    auditLayer,
    versioningLayer,
    approvalLayer,
    publishingLayer
  );

  assert.equal(layer.report.healthState, "HIGH_RISK");
  assert.equal(layer.report.publishingIssues.count > 0, true);
});

test("risk detection reports approval and publishing issues explicitly", () => {
  const layer = governanceModule.createAssetGovernanceDashboardLayer();
  const report = layer.report;

  assert.equal(report.approvalIssues.count > 0, true);
  assert.equal(report.riskSummary.count > 0, true);
  assert.ok(report.riskSummary.risks.includes("approval pipeline friction"));
});

test("missing record handling rejects invalid audit inputs", () => {
  const productionReviewLayer = productionReviewModule.createAssetProductionReviewLayer();
  const impactLayer = impactModule.createAssetImpactAnalysisLayer();
  const auditLayer = auditModule.createAssetAuditTrailLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();

  assert.throws(
    () =>
      governanceModule.createAssetGovernanceDashboardLayer(
        { auditRecords: [{ schemaId: "BROKEN_RECORD" }] },
        productionReviewLayer,
        impactLayer,
        auditLayer,
        versioningLayer,
        approvalLayer,
        publishingLayer
      ),
    /sourceRecordsValid must be true/
  );
});

test("same input produces deterministic same governance output", () => {
  const first = governanceModule.createAssetGovernanceDashboardLayer();
  const second = governanceModule.createAssetGovernanceDashboardLayer();

  assert.deepEqual(first.report, second.report);
  assert.equal(
    first.validation.deterministicSummaryHash,
    second.validation.deterministicSummaryHash
  );
});

test("explicit governance validation passes contract checks", () => {
  const layer = governanceModule.createAssetGovernanceDashboardLayer();
  const validation = governanceModule.validateAssetGovernanceReport(layer.report);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetGovernanceReport.validation.sourceRecordsValid, true);
  assert.equal(validation.assetGovernanceReport.validation.summariesDeterministic, true);
  assert.equal(validation.assetGovernanceReport.validation.noMutation, true);
});
