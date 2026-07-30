import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const approvalRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001"
);

const approvalRecordPath = path.join(
  approvalRoot,
  "approval/atlas-alpha-manual-approval-record.json"
);
const approvalScopePath = path.join(
  approvalRoot,
  "scope/atlas-alpha-manual-approval-scope.json"
);
const authorizedRegionsPath = path.join(
  approvalRoot,
  "scope/atlas-alpha-authorized-region-list.json"
);
const enabledCapabilitiesPath = path.join(
  approvalRoot,
  "capabilities/atlas-alpha-enabled-capabilities.json"
);
const disabledCapabilitiesPath = path.join(
  approvalRoot,
  "capabilities/atlas-alpha-disabled-capabilities.json"
);
const rollbackAuthorityPath = path.join(
  approvalRoot,
  "authority/atlas-alpha-rollback-authority-record.json"
);
const reviewSchedulePath = path.join(
  approvalRoot,
  "schedule/atlas-alpha-review-schedule.json"
);
const validationPath = path.join(
  approvalRoot,
  "validation/atlas-alpha-manual-approval-validation.json"
);
const lifecyclePath = path.join(
  approvalRoot,
  "lifecycle/atlas-alpha-manual-approval-lifecycle.json"
);
const reportPath = path.join(
  approvalRoot,
  "reports/atlas-alpha-manual-approval-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-alpha-manual-approval-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas alpha manual approval record is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAlphaManualApprovalRecord({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasAlphaManualApprovalRecord({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.approvalRecord, second.approvalRecord);
  assert.deepEqual(first.approvalScope, second.approvalScope);
  assert.deepEqual(first.authorizedRegions, second.authorizedRegions);
  assert.deepEqual(first.enabledCapabilities, second.enabledCapabilities);
  assert.deepEqual(first.disabledCapabilities, second.disabledCapabilities);
  assert.deepEqual(first.rollbackAuthority, second.rollbackAuthority);
  assert.deepEqual(first.reviewSchedule, second.reviewSchedule);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas alpha manual approval record defines approval scope, capabilities, authority, and schedule", () => {
  const approval = moduleUnderTest.buildAtlasAlphaManualApprovalRecord({
    cwd: repoRoot
  });

  assert.equal(approval.approvalRecord.approvalStatus, "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION");
  assert.equal(approval.approvalRecord.approvedOn, "2026-07-30");
  assert.equal(approval.approvalScope.environment[0], "DEVELOPMENT_ONLY");
  assert.equal(approval.authorizedRegions.regionCount >= 2, true);
  assert.equal(approval.enabledCapabilities.capabilities.length >= 5, true);
  assert.equal(approval.disabledCapabilities.capabilities.includes("renderer_attachment"), true);
  assert.equal(approval.rollbackAuthority.rollbackTriggers.length >= 5, true);
  assert.equal(approval.reviewSchedule.reviewCadence.length, 3);
});

test("atlas alpha manual approval record preserves non-runtime approval state", () => {
  const approval = moduleUnderTest.buildAtlasAlphaManualApprovalRecord({
    cwd: repoRoot
  });

  assert.equal(approval.validation.status, "pass");
  assert.equal(approval.lifecycle.lifecycleStatus, "APPROVED_ALPHA_PENDING_RUNTIME_IMPLEMENTATION");
  assert.equal(approval.lifecycle.manualApprovalCompleted, true);
  assert.equal(approval.validation.runtimeActivationAuthorized, false);
  assert.equal(approval.validation.rendererAttachmentAuthorized, false);
  assert.equal(approval.validation.mapDownloadsAuthorized, false);
  assert.equal(approval.validation.blenderAuthorized, false);
  assert.equal(approval.validation.glbAuthorized, false);
  assert.equal(approval.validation.assetModificationAuthorized, false);
});

test("atlas alpha manual approval record writes records and reports approval state", () => {
  moduleUnderTest.writeAtlasAlphaManualApprovalRecord({ cwd: repoRoot });

  const approvalRecord = readJson(approvalRecordPath);
  const approvalScope = readJson(approvalScopePath);
  const authorizedRegions = readJson(authorizedRegionsPath);
  const enabledCapabilities = readJson(enabledCapabilitiesPath);
  const disabledCapabilities = readJson(disabledCapabilitiesPath);
  const rollbackAuthority = readJson(rollbackAuthorityPath);
  const reviewSchedule = readJson(reviewSchedulePath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(approvalRecord.approvalStatus, "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION");
  assert.equal(approvalScope.environment[0], "DEVELOPMENT_ONLY");
  assert.equal(authorizedRegions.regionCount >= 2, true);
  assert.equal(enabledCapabilities.capabilities.length >= 5, true);
  assert.equal(disabledCapabilities.capabilities.includes("runtime_scene_activation"), true);
  assert.equal(rollbackAuthority.authorizedRoles.length, 2);
  assert.equal(reviewSchedule.reviewCadence.length, 3);
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "APPROVED_ALPHA_PENDING_RUNTIME_IMPLEMENTATION");
  assert.match(report, /Approval state: MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION/);
});
