import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const selectorRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001"
);

const scenarioInputsPath = path.join(
  selectorRoot,
  "simulation/location-recipe-selector-simulation-inputs.json"
);
const scenarioResultsPath = path.join(
  selectorRoot,
  "simulation/location-recipe-selector-simulation-results.json"
);
const confidencePath = path.join(
  selectorRoot,
  "simulation/location-recipe-selector-confidence-results.json"
);
const validationPath = path.join(
  selectorRoot,
  "validation/location-recipe-selector-simulation-validation.json"
);
const reportPath = path.join(
  selectorRoot,
  "reports/location-recipe-selector-simulation-report.md"
);

const simulationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "location-recipe-selection-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("location recipe selection simulation is deterministic", () => {
  const first = simulationModule.buildLocationRecipeSelectionSimulation({
    cwd: repoRoot
  });
  const second = simulationModule.buildLocationRecipeSelectionSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.scenarioInputs, second.scenarioInputs);
  assert.deepEqual(first.scenarioResults, second.scenarioResults);
  assert.deepEqual(first.validation, second.validation);
});

test("location recipe selection simulation covers coastal, forest, mixed, unsupported, and ambiguous scenarios", () => {
  const simulation = simulationModule.buildLocationRecipeSelectionSimulation({
    cwd: repoRoot
  });
  const coastal = byScenarioId(
    simulation.scenarioResults,
    "COASTAL_ENVIRONMENT_001"
  );
  const forest = byScenarioId(
    simulation.scenarioResults,
    "FOREST_ENVIRONMENT_001"
  );
  const mixed = byScenarioId(
    simulation.scenarioResults,
    "MIXED_BIOME_ENVIRONMENT_001"
  );
  const unsupported = byScenarioId(
    simulation.scenarioResults,
    "UNSUPPORTED_ENVIRONMENT_001"
  );
  const ambiguous = byScenarioId(
    simulation.scenarioResults,
    "AMBIGUOUS_ENVIRONMENT_001"
  );

  assert.equal(coastal.selectionResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(forest.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.selectionResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(unsupported.selectionResult.selectedRecipeId, null);
  assert.equal(unsupported.selectionResult.blocked, true);
  assert.equal(ambiguous.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(ambiguous.selectionResult.fallbackApplied, true);
});

test("location recipe selection simulation preserves confidence ranking and approved-only behavior", () => {
  const simulation = simulationModule.buildLocationRecipeSelectionSimulation({
    cwd: repoRoot
  });

  for (const scenario of simulation.scenarioResults) {
    const ranked = scenario.scoredCandidates;
    for (let index = 1; index < ranked.length; index += 1) {
      assert.ok(ranked[index - 1].totalScore >= ranked[index].totalScore);
    }
    for (const candidate of ranked) {
      if (candidate.eligible) {
        assert.equal(["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(candidate.recipeId), true);
      }
    }
  }
});

test("location recipe selection simulation records and validation are written correctly", () => {
  simulationModule.writeLocationRecipeSelectionSimulation({ cwd: repoRoot });

  const scenarioInputs = readJson(scenarioInputsPath);
  const scenarioResults = readJson(scenarioResultsPath);
  const confidence = readJson(confidencePath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(scenarioInputs.length, 5);
  assert.equal(scenarioResults.length, 5);
  assert.equal(confidence.length, 5);
  assert.equal(validation.status, "pass");
  assert.match(report, /Atlas Engine integration planning: READY/);
});
