import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const alphaRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-alpha-attachment/ATLAS_ALPHA_ATTACHMENT_001"
);

const specificationPath = path.join(
  alphaRoot,
  "specification/atlas-alpha-attachment-specification.json"
);
const permissionMatrixPath = path.join(
  alphaRoot,
  "permissions/atlas-alpha-attachment-permission-matrix.json"
);
const monitoringChecklistPath = path.join(
  alphaRoot,
  "monitoring/atlas-alpha-attachment-monitoring-checklist.json"
);
const validationPath = path.join(
  alphaRoot,
  "validation/atlas-alpha-attachment-validation.json"
);
const lifecyclePath = path.join(
  alphaRoot,
  "lifecycle/atlas-alpha-attachment-lifecycle.json"
);
const reportPath = path.join(
  alphaRoot,
  "reports/atlas-alpha-attachment-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-alpha-attachment-specification.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas alpha attachment specification is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAlphaAttachmentSpecification({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasAlphaAttachmentSpecification({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.permissionMatrix, second.permissionMatrix);
  assert.deepEqual(first.monitoringChecklist, second.monitoringChecklist);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas alpha attachment specification defines scope, access, systems, monitoring, criteria, and approval gates", () => {
  const alpha = moduleUnderTest.buildAtlasAlphaAttachmentSpecification({
    cwd: repoRoot
  });

  assert.equal(alpha.specification.alphaRegionScope.regionCount >= 2, true);
  assert.equal(alpha.specification.allowedEnvironments.environments.length, 1);
  assert.equal(alpha.specification.userAccessBoundaries.allowedUserTypes.length, 2);
  assert.equal(alpha.specification.enabledSystems.systems.length >= 5, true);
  assert.equal(alpha.specification.disabledSystems.systems.includes("renderer_attachment"), true);
  assert.equal(alpha.specification.monitoringRequirements.requiredSignals.length >= 6, true);
  assert.equal(alpha.specification.rollbackTriggers.triggers.length >= 5, true);
  assert.equal(alpha.specification.successCriteria.criteria.length >= 4, true);
  assert.equal(alpha.specification.failureCriteria.criteria.length >= 5, true);
  assert.equal(alpha.specification.manualApprovalGates.gates.length, 3);
});

test("atlas alpha attachment specification preserves non-runtime safety and manual approval requirement", () => {
  const alpha = moduleUnderTest.buildAtlasAlphaAttachmentSpecification({
    cwd: repoRoot
  });

  assert.equal(alpha.lifecycle.lifecycleStatus, "ALPHA_ATTACHMENT_SPEC_READY");
  assert.equal(alpha.lifecycle.manualApprovalRequired, true);
  assert.equal(alpha.validation.runtimeActivationAuthorized, false);
  assert.equal(alpha.validation.rendererAttachmentAuthorized, false);
  assert.equal(alpha.validation.mapDownloadsAuthorized, false);
  assert.equal(alpha.validation.blenderAuthorized, false);
  assert.equal(alpha.validation.glbAuthorized, false);
  assert.equal(alpha.validation.assetModificationAuthorized, false);
});

test("atlas alpha attachment specification writes records and remains ready for future controlled alpha attachment", () => {
  moduleUnderTest.writeAtlasAlphaAttachmentSpecification({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const permissionMatrix = readJson(permissionMatrixPath);
  const monitoringChecklist = readJson(monitoringChecklistPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.alphaRegionScope.regionCount >= 2, true);
  assert.equal(permissionMatrix.matrix.length, 5);
  assert.equal(monitoringChecklist.checklist.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "ALPHA_ATTACHMENT_SPEC_READY");
  assert.equal(lifecycle.manualApprovalRequired, true);
  assert.match(report, /Future controlled alpha attachment: READY/);
});
