import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001"
);
const intakePath = path.join(
  productionRoot,
  "specification/coastal-boardwalk-001-intake.json"
);
const validationPath = path.join(
  productionRoot,
  "validation/coastal-boardwalk-001-intake-validation.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-boardwalk-001-intake-report.md"
);

test("coastal boardwalk intake defines identity, recipe, family, and LOD expectations", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.assetIdentity.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(intake.assetIdentity.familyId, "COASTAL_PATHWAY_FAMILY_001");
  assert.equal(intake.recipeIdentity.recipeId, "COASTAL_BOARDWALK_RECIPE_001");
  assert.equal(intake.familyAssignment.familyId, "COASTAL_PATHWAY_FAMILY_001");
  assert.deepEqual(
    intake.lodExpectations.requiredLods.map((entry) => entry.lod),
    ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]
  );
  assert.equal(
    intake.lodExpectations.complexityOrderingRule,
    "LOD_CLOSE > LOD_GAMEPLAY > LOD_MAP"
  );
});

test("coastal boardwalk intake defines modular coastal boardwalk budgets and dependencies", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.intakeTemplateInputs.performanceBudget.mobileFirst, true);
  assert.equal(
    intake.intakeTemplateInputs.performanceBudget.triangleTargets.LOD_CLOSE.targetMax,
    220
  );
  assert.equal(
    intake.intakeTemplateInputs.performanceBudget.materialTargets.allLods.targetMax,
    2
  );
  assert.deepEqual(intake.intakeTemplateInputs.dependencies, [
    "MOD_BOARDWALK_DECK_SEGMENT_001",
    "MOD_BOARDWALK_POST_RAIL_SET_001",
    "MOD_BOARDWALK_GROUND_SOCKET_COASTAL_001"
  ]);
});

test("coastal boardwalk intake defines source/export separation, compatibility, and pre-authoring state", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.match(
    intake.productionContracts.sourceExportSeparation.rule,
    /Blender source must live only in source\/ and GLB outputs must live only in export\//
  );
  assert.equal(
    intake.productionContracts.preExportGates.visualApprovalRequiredBeforeExport,
    true
  );
  assert.equal(
    intake.productionContracts.preExportGates.sourcePathVerificationRequiredBeforeExport,
    true
  );
  assert.match(
    intake.intakeTemplateInputs.approvalCriteria.join(" "),
    /COASTAL_GRAVEL_PATH_001/
  );
  assert.match(
    intake.intakeTemplateInputs.approvalCriteria.join(" "),
    /COASTAL_WATER_EDGE_001/
  );
  assert.equal(intake.authoringReadiness.blenderFilesCreated, false);
  assert.equal(intake.authoringReadiness.geometryGenerated, false);
  assert.equal(intake.authoringReadiness.glbsExported, false);
  assert.equal(intake.authoringReadiness.registered, false);
  assert.equal(intake.authoringReadiness.readyForAuthoringSetup, true);
  assert.equal(intake.authoringReadiness.nextPhase, "199.2_authoring_setup");
});

test("coastal boardwalk validation confirms intake-only state", () => {
  const validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));

  assert.equal(validation.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "authoring_setup_only");
});

test("coastal boardwalk report documents intake completion and readiness for authoring setup", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Intake complete, authoring not started/);
  assert.match(report, /visual approval/i);
  assert.match(report, /source-path verification/i);
  assert.match(
    report,
    /No Blender file, geometry, GLB, registration, or promotion artifact has been created/i
  );
  assert.match(report, /ready for Phase 199\.2 authoring setup/i);
});
