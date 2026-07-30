import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
);

const specificationPath = path.join(
  recipeRoot,
  "refinement/forest-location-recipe-001-refinement-specification.json"
);
const comparisonPath = path.join(
  recipeRoot,
  "refinement/forest-location-recipe-001-before-after-rule-comparison.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/forest-location-recipe-001-refinement-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-refinement-report.md"
);

const refinementPlanningModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-refinement-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("forest location refinement specification captures all requested planning areas", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(specification.planningMode, "refinement_planning_only_no_regeneration");
  assert.equal(specification.plannedChanges.length, 3);
  assert.deepEqual(
    specification.plannedChanges.map((change) => change.area),
    [
      "canopy_corridor_enclosure_improvement",
      "clearing_payoff_enhancement",
      "exploration_curiosity_improvement"
    ]
  );
});

test("forest location refinement planning creates before and after rule comparison", () => {
  const comparison = readJson(comparisonPath);

  assert.equal(comparison.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(comparison.comparisons.length, 3);
  assert.equal(comparison.noGeneratedPlanMutation, true);
  assert.equal(comparison.noAssetMutation, true);
});

test("forest location refinement validation preserves planning-only safety", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "recipe_regeneration_ready");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.updatedValidationRequirements.length, 5);
});

test("forest location refinement report documents planned changes and readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /canopy_corridor_enclosure_improvement/);
  assert.match(report, /clearing_payoff_enhancement/);
  assert.match(report, /exploration_curiosity_improvement/);
  assert.match(report, /runtime activation: not performed/);
  assert.match(report, /ready for controlled regeneration/i);
});

test("forest location refinement planning remains deterministic", () => {
  const first = refinementPlanningModule.buildForestLocationRecipeRefinementPlanning({
    cwd: repoRoot
  });
  const second = refinementPlanningModule.buildForestLocationRecipeRefinementPlanning({
    cwd: repoRoot
  });

  assert.equal(first.refinementFingerprint, second.refinementFingerprint);
  assert.deepEqual(first.refinementSpecification, second.refinementSpecification);
  assert.deepEqual(first.beforeAfterRuleComparison, second.beforeAfterRuleComparison);
  assert.deepEqual(first.refinementValidation, second.refinementValidation);
});
