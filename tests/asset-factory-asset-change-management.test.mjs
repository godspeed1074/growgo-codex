import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const changeModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-change-management.mjs")
);
const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);
const approvalModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-approval-registration.mjs")
);

test("create change record tracks version-to-version asset evolution deterministically", () => {
  const layer = changeModule.createAssetChangeManagementLayer();
  const record = layer.createChangeRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(record.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(record.sourceVersion, "1.0.0");
  assert.equal(record.targetVersion, "1.0.1");
  assert.equal(record.changeCategory, "VARIANT_ADDITION");
});

test("version transition links source version to target version through parent lineage", () => {
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const sourceVersionRecord = versioningLayer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const targetVersionRecord = versioningLayer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001",
    parentVersion: sourceVersionRecord.versionNumber,
    changeSummary: "Compatibility follow-up refinement."
  });
  const layer = changeModule.createAssetChangeManagementLayer();
  const record = layer.createChangeRecord({
    sourceVersionRecord,
    targetVersionRecord,
    changeCategory: "COMPATIBILITY_UPDATE",
    changeReason: "Align coastal asset version with current publishing expectations."
  });

  assert.equal(record.sourceVersion, "1.0.0");
  assert.equal(record.targetVersion, "1.0.1");
  assert.equal(record.impactSummary.changeDelta, "1.0.0 -> 1.0.1");
  assert.equal(record.validation.targetVersionExists, true);
});

test("missing approval handling rejects pending approval lineage", () => {
  const approvalLayer = approvalModule.createAssetApprovalRegistrationLayer();
  const pendingApproval = approvalLayer.createApprovalRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const layer = changeModule.createAssetChangeManagementLayer();

  assert.throws(
    () =>
      layer.createChangeRecord({
        assetId: "GROUND_BEACH_SAND_001",
        approvalRecord: pendingApproval
      }),
    /approvalLinked must be true/
  );
});

test("invalid version handling rejects mismatched target version lineage", () => {
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const sourceVersionRecord = versioningLayer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validTargetVersionRecord = versioningLayer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001",
    parentVersion: sourceVersionRecord.versionNumber,
    changeSummary: "Compatibility change for lineage validation coverage."
  });
  const invalidTargetVersionRecord = {
    ...validTargetVersionRecord,
    parentVersion: "1.5.0"
  };
  const layer = changeModule.createAssetChangeManagementLayer();

  assert.throws(
    () =>
      layer.createChangeRecord({
        sourceVersionRecord,
        targetVersionRecord: invalidTargetVersionRecord
      }),
    /targetVersionExists must be true/
  );
});

test("same input produces deterministic same change record", () => {
  const layer = changeModule.createAssetChangeManagementLayer();
  const first = layer.createChangeRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createChangeRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicChangeHash,
    second.validation.deterministicChangeHash
  );
});

test("explicit asset change validation passes contract checks", () => {
  const layer = changeModule.createAssetChangeManagementLayer();
  const record = layer.createChangeRecord({
    assetId: "GROUND_BEACH_SAND_001",
    changeCategory: "BUG_FIX",
    changeReason: "Corrected a deterministic production issue in the asset workflow."
  });
  const validation = changeModule.validateAssetChangeRecord(record);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetChangeRecord.validation.sourceVersionExists, true);
  assert.equal(validation.assetChangeRecord.validation.targetVersionExists, true);
  assert.equal(validation.assetChangeRecord.validation.changeReasonExists, true);
  assert.equal(validation.assetChangeRecord.validation.approvalLinked, true);
});
