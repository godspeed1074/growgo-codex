import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);

const specificationPath = path.join(
  recipeRoot,
  "refinement/coastal-location-recipe-001-refinement-specification.json"
);
const comparisonPath = path.join(
  recipeRoot,
  "refinement/coastal-location-recipe-001-before-after-rule-comparison.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-refinement-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-refinement-report.md"
);

const refinementPlanningModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-refinement-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location refinement specification captures all requested planning areas", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(specification.planningMode, "refinement_planning_only_no_regeneration");
  assert.equal(specification.plannedChanges.length, 4);
  assert.deepEqual(
    specification.plannedChanges.map((change) => change.area),
    [
      "shoreline_transition_improvements",
      "destination_zone_enhancement",
      "vegetation_density_smoothing",
      "exploration_interest_improvements"
    ]
  );
});

test("coastal location refinement planning creates before and after rule comparison", () => {
  const comparison = readJson(comparisonPath);

  assert.equal(comparison.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(comparison.comparisons.length, 4);
  assert.equal(comparison.noGeneratedPlanMutation, true);
  assert.equal(comparison.noAssetMutation, true);
});

test("coastal location refinement validation preserves planning-only safety", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "recipe_regeneration_ready");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.updatedValidationRequirements.length, 5);
});

test("coastal location refinement report documents planned changes and readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /shoreline_transition_improvements/);
  assert.match(report, /destination_zone_enhancement/);
  assert.match(report, /runtime activation: not performed/);
  assert.match(report, /ready for controlled regeneration planning/i);
});

test("coastal location refinement planning remains deterministic", () => {
  const first = refinementPlanningModule.buildCoastalLocationRecipeRefinementPlanning({
    cwd: repoRoot
  });
  const second = refinementPlanningModule.buildCoastalLocationRecipeRefinementPlanning({
    cwd: repoRoot
  });

  assert.equal(first.refinementFingerprint, second.refinementFingerprint);
  assert.deepEqual(first.refinementSpecification, second.refinementSpecification);
  assert.deepEqual(first.beforeAfterRuleComparison, second.beforeAfterRuleComparison);
  assert.deepEqual(first.refinementValidation, second.refinementValidation);
});
