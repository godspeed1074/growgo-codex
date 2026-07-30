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
  "specification/coastal-rock-cluster-001-intake.json"
);
const validationPath = path.join(
  productionRoot,
  "validation/coastal-rock-cluster-001-intake-validation.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-rock-cluster-001-intake-report.md"
);

test("coastal rock cluster intake defines identity, recipe, family, and LOD expectations", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.assetIdentity.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(intake.assetIdentity.familyId, "COASTAL_NATURE_FAMILY_001");
  assert.equal(intake.recipeIdentity.recipeId, "COASTAL_ROCK_CLUSTER_RECIPE_001");
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

test("coastal rock cluster intake defines source/export separation and remains pre-authoring", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.match(
    intake.productionContracts.sourceExportSeparation.rule,
    /Blender source must live only in source\/ and GLB outputs must live only in export\//
  );
  assert.equal(intake.authoringReadiness.blenderFilesCreated, false);
  assert.equal(intake.authoringReadiness.geometryGenerated, false);
  assert.equal(intake.authoringReadiness.glbsExported, false);
  assert.equal(intake.authoringReadiness.registered, false);
  assert.equal(intake.authoringReadiness.readyForAuthoringSetup, true);
  assert.equal(intake.authoringReadiness.nextPhase, "196.2_authoring_setup");
});

test("coastal rock cluster validation confirms intake-only state", () => {
  const validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));

  assert.equal(validation.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "authoring_setup_only");
});

test("coastal rock cluster report documents intake completion and no generated assets", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Intake complete, authoring not started/);
  assert.match(report, /Blender source must live only in `source\/`/);
  assert.match(report, /No Blender file, geometry, GLB, or registration artifact has been created/i);
  assert.match(report, /ready for Phase 196\.2 authoring setup/i);
});

test("coastal rock cluster intake preserves safe lane separation before registration", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_ROCK_CLUSTER_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_ROCK_CLUSTER_001_LOD_CLOSE.glb")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/coastal-rock-cluster-v001-registration.json")
    ),
    false
  );
});
