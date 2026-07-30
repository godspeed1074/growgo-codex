import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const planningRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-controlled-map-attachment/ATLAS_CONTROLLED_MAP_ATTACHMENT_001"
);

const specificationPath = path.join(
  planningRoot,
  "specification/atlas-controlled-map-attachment-specification.json"
);
const permissionModelPath = path.join(
  planningRoot,
  "permissions/atlas-controlled-map-attachment-permission-model.json"
);
const lifecyclePath = path.join(
  planningRoot,
  "lifecycle/atlas-controlled-map-attachment-lifecycle-rules.json"
);
const validationPath = path.join(
  planningRoot,
  "validation/atlas-controlled-map-attachment-validation.json"
);
const reportPath = path.join(
  planningRoot,
  "reports/atlas-controlled-map-attachment-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-map-attachment-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas controlled map attachment planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasControlledMapAttachmentPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasControlledMapAttachmentPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.permissionModel, second.permissionModel);
  assert.deepEqual(first.lifecycleRules, second.lifecycleRules);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas controlled map attachment planning defines permission, region, rollback, emergency, renderer, logging, and validation controls", () => {
  const planning = moduleUnderTest.buildAtlasControlledMapAttachmentPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.specification.allowedRegions.regionCount >= 2, true);
  assert.equal(planning.specification.alphaTestBoundaries.boundaryCount >= 2, true);
  assert.equal(planning.specification.rollbackControls.rollbackModes.length >= 4, true);
  assert.equal(planning.specification.emergencyDisable.triggerModes.length >= 4, true);
  assert.equal(planning.specification.rendererHandoffContract.blockedNow, true);
  assert.equal(planning.specification.loggingRequirements.requiredEvents.length >= 6, true);
  assert.equal(planning.specification.validationGates.requiredPasses.length, 5);
});

test("atlas controlled map attachment planning preserves non-runtime safety", () => {
  const planning = moduleUnderTest.buildAtlasControlledMapAttachmentPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.permissionModel.permissionFlags.previewInspectionAuthorized, true);
  assert.equal(planning.permissionModel.permissionFlags.metadataLookupAuthorized, true);
  assert.equal(planning.permissionModel.permissionFlags.runtimeActivationAuthorized, false);
  assert.equal(planning.permissionModel.permissionFlags.rendererAttachmentAuthorized, false);
  assert.equal(planning.permissionModel.permissionFlags.mapDownloadsAuthorized, false);
  assert.equal(planning.lifecycleRules.rollbackAvailable, true);
  assert.equal(planning.lifecycleRules.emergencyDisableAvailable, true);
});

test("atlas controlled map attachment planning writes records and preserves blocked attachment behavior", () => {
  moduleUnderTest.writeAtlasControlledMapAttachmentPlanning({
    cwd: repoRoot
  });

  const specification = readJson(specificationPath);
  const permissionModel = readJson(permissionModelPath);
  const lifecycleRules = readJson(lifecyclePath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.allowedRegions.regionCount >= 2, true);
  assert.equal(permissionModel.permissionFlags.runtimeActivationAuthorized, false);
  assert.equal(permissionModel.permissionFlags.rendererAttachmentAuthorized, false);
  assert.equal(permissionModel.permissionFlags.mapDownloadsAuthorized, false);
  assert.equal(lifecycleRules.lifecycleStatus, "CONTROLLED_ATTACHMENT_PLANNING_READY");
  assert.equal(lifecycleRules.rollbackAvailable, true);
  assert.equal(lifecycleRules.emergencyDisableAvailable, true);
  assert.equal(validation.status, "pass");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future controlled attachment planning: READY/);
});
