import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const environmentModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-environment-separation.mjs"
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
const auditModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-audit-trail.mjs")
);

test("valid promotion moves asset from testing to approval with deterministic history", () => {
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const auditLayer = auditModule.createAssetAuditTrailLayer();
  const layer = environmentModule.createAssetEnvironmentSeparationLayer(
    approvalLayer,
    publishingLayer,
    versioningLayer,
    auditLayer
  );

  const pending = approvalLayer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const readyPublish = publishingLayer.createPublishRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  let auditRecords = [];
  auditRecords = auditLayer.appendAuditRecord(auditRecords, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_CREATED"
  });
  auditRecords = auditLayer.appendAuditRecord(auditRecords, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_VALIDATED"
  });
  const testingRecord = layer.createEnvironmentRecord({
    assetId: "GROUND_BEACH_SAND_001",
    approvalRecord: pending,
    publishRecord: readyPublish,
    auditRecords,
    currentEnvironment: "TESTING",
    transitionHistory: [
      {
        fromEnvironment: "DEVELOPMENT",
        toEnvironment: "TESTING",
        promotionRule: "DEVELOPMENT_TO_TESTING",
        timestamp: "2026-07-27T00:00:00.000Z",
        approvalStatus: "PENDING_REVIEW",
        publishStatus: "READY_TO_PUBLISH"
      }
    ]
  });

  const promoted = layer.promoteEnvironmentRecord(testingRecord, "APPROVAL");

  assert.equal(promoted.currentEnvironment, "APPROVAL");
  assert.equal(promoted.previousEnvironment, "TESTING");
  assert.equal(promoted.promotionStatus, "PROMOTED");
  assert.equal(promoted.transitionHistory.length, 2);
});

test("blocked promotion prevents testing asset from bypassing approval into production", () => {
  const layer = environmentModule.createAssetEnvironmentSeparationLayer();
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const publishingLayer = publishingModule.createAssetPublishingPipelineLayer();
  const record = layer.createEnvironmentRecord({
    approvalRecord: approvalLayer.createApprovalRecord({
      assetId: "GROUND_BEACH_SAND_001"
    }),
    publishRecord: publishingLayer.createPublishRecord({
      assetId: "GROUND_BEACH_SAND_001"
    }),
    currentEnvironment: "TESTING",
    transitionHistory: [
      {
        fromEnvironment: "DEVELOPMENT",
        toEnvironment: "TESTING",
        promotionRule: "DEVELOPMENT_TO_TESTING",
        timestamp: "2026-07-27T00:00:00.000Z",
        approvalStatus: "PENDING_REVIEW",
        publishStatus: "READY_TO_PUBLISH"
      }
    ]
  });

  assert.throws(
    () => layer.promoteEnvironmentRecord(record, "PRODUCTION"),
    /Cannot transition/
  );
});

test("environment tracking derives approval environment from active approval and ready publish state", () => {
  const layer = environmentModule.createAssetEnvironmentSeparationLayer();
  const record = layer.createEnvironmentRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.currentEnvironment, "APPROVAL");
  assert.equal(record.previousEnvironment, "TESTING");
  assert.equal(record.validation.approvalStateValid, true);
});

test("invalid transition handling rejects environment bypass in supplied history", () => {
  const layer = environmentModule.createAssetEnvironmentSeparationLayer();

  assert.throws(
    () =>
      layer.createEnvironmentRecord({
        currentEnvironment: "PRODUCTION",
        transitionHistory: [
          {
            fromEnvironment: "DEVELOPMENT",
            toEnvironment: "PRODUCTION",
            promotionRule: "APPROVAL_TO_PRODUCTION",
            timestamp: "2026-07-27T00:00:00.000Z",
            approvalStatus: "ACTIVE",
            publishStatus: "PUBLISHED"
          }
        ]
      }),
    /promotionAllowed must be true/
  );
});

test("same input produces deterministic same environment record", () => {
  const layer = environmentModule.createAssetEnvironmentSeparationLayer();
  const first = layer.createEnvironmentRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createEnvironmentRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicTransitionHash,
    second.validation.deterministicTransitionHash
  );
});

test("explicit environment validation passes contract checks", () => {
  const layer = environmentModule.createAssetEnvironmentSeparationLayer();
  const record = layer.createEnvironmentRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validation = environmentModule.validateAssetEnvironmentRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetEnvironmentRecord.validation.promotionAllowed, true);
  assert.equal(validation.assetEnvironmentRecord.validation.approvalStateValid, true);
  assert.equal(validation.assetEnvironmentRecord.validation.publishStateValid, true);
});
