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
  "specification/coastal-ground-cover-001-intake.json"
);
const validationPath = path.join(
  productionRoot,
  "validation/coastal-ground-cover-001-intake-validation.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-ground-cover-001-intake-report.md"
);

test("coastal ground cover intake defines identity, recipe, and LOD expectations", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.assetIdentity.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(intake.assetIdentity.familyId, "COASTAL_NATURE_FAMILY_001");
  assert.equal(intake.recipeIdentity.recipeId, "COASTAL_GROUND_COVER_RECIPE_001");
  assert.deepEqual(
    intake.lodExpectations.requiredLods.map((entry) => entry.lod),
    ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]
  );
  assert.equal(
    intake.lodExpectations.complexityOrderingRule,
    "LOD_CLOSE > LOD_GAMEPLAY > LOD_MAP"
  );
});

test("coastal ground cover intake remains pre-authoring and unregistered", () => {
  const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

  assert.equal(intake.authoringReadiness.blenderFilesCreated, false);
  assert.equal(intake.authoringReadiness.geometryGenerated, false);
  assert.equal(intake.authoringReadiness.glbsExported, false);
  assert.equal(intake.authoringReadiness.registered, false);
  assert.equal(intake.authoringReadiness.readyForAuthoringSetup, true);
  assert.equal(intake.authoringReadiness.nextPhase, "195.2_authoring_setup");
});

test("coastal ground cover validation confirms intake-only state", () => {
  const validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));

  assert.equal(validation.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "authoring_setup_only");
});

test("coastal ground cover report documents intake completion and no generated assets", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Intake complete, authoring not started/);
  assert.match(report, /No Blender file, geometry, GLB, or registration artifact has been created/i);
  assert.match(report, /ready for Phase 195\.2 authoring setup/i);
});

test("coastal ground cover intake preserves pre-authoring empty production state", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_GROUND_COVER_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_GROUND_COVER_001_LOD_CLOSE.glb")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/coastal-ground-cover-registration.json")
    ),
    false
  );
});
