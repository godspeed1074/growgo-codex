import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);
const intakePath = path.join(
  productionRoot,
  "specification/coastal-water-edge-001-intake.json"
);
const validationPath = path.join(
  productionRoot,
  "validation/coastal-water-edge-001-intake-validation.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-water-edge-001-intake-report.md"
);

test("coastal water edge intake defines identity, recipe, family, and LOD expectations", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.assetIdentity.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(intake.assetIdentity.familyId, "COASTAL_NATURE_FAMILY_001");
  assert.equal(intake.recipeIdentity.recipeId, "COASTAL_WATER_EDGE_RECIPE_001");
  assert.equal(intake.familyAssignment.familyId, "COASTAL_NATURE_FAMILY_001");
  assert.deepEqual(
    intake.lodExpectations.requiredLods.map((entry) => entry.lod),
    ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]
  );
  assert.equal(
    intake.lodExpectations.complexityOrderingRule,
    "LOD_CLOSE > LOD_GAMEPLAY > LOD_MAP"
  );
});

test("coastal water edge intake defines source/export separation and pre-export gates and remains pre-authoring", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.match(
    intake.productionContracts.sourceExportSeparation.rule,
    /Blender source must live only in source\/ and GLB outputs must live only in export\//
  );
  assert.equal(
    intake.productionContracts.preExportGates.visualApprovalRequiredBeforeRegistration,
    true
  );
  assert.equal(
    intake.productionContracts.preExportGates.sourcePathVerificationRequiredBeforeExport,
    true
  );
  assert.equal(intake.authoringReadiness.blenderFilesCreated, false);
  assert.equal(intake.authoringReadiness.geometryGenerated, false);
  assert.equal(intake.authoringReadiness.glbsExported, false);
  assert.equal(intake.authoringReadiness.registered, false);
  assert.equal(intake.authoringReadiness.readyForAuthoringSetup, true);
  assert.equal(intake.authoringReadiness.nextPhase, "197.2_authoring_setup");
});

test("coastal water edge validation confirms intake-only state", () => {
  const validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));

  assert.equal(validation.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "authoring_setup_only");
});

test("coastal water edge report documents intake completion and production lessons", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Intake complete, authoring not started/);
  assert.match(report, /visual approval required before registration/i);
  assert.match(report, /source path verification required before export/i);
  assert.match(report, /No Blender file, geometry, GLB, or registration artifact has been created/i);
  assert.match(report, /ready for Phase 197\.2 authoring setup/i);
});

test("coastal water edge intake preserves safe lane separation before registration", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_WATER_EDGE_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_WATER_EDGE_001_LOD_CLOSE.glb")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/coastal-water-edge-v001-registration.json")
    ),
    false
  );
});
