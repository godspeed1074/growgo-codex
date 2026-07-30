import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const integrationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001"
);

const simulationInputsPath = path.join(
  integrationRoot,
  "simulation/atlas-environment-classification-simulation-inputs.json"
);
const classificationOutputsPath = path.join(
  integrationRoot,
  "simulation/atlas-environment-classification-simulation-classifications.json"
);
const biomeConfidencePath = path.join(
  integrationRoot,
  "simulation/atlas-environment-classification-simulation-biome-confidence.json"
);
const selectorHandoffPath = path.join(
  integrationRoot,
  "simulation/atlas-environment-classification-simulation-selector-handoffs.json"
);
const validationPath = path.join(
  integrationRoot,
  "validation/atlas-environment-classification-simulation-validation.json"
);
const reportPath = path.join(
  integrationRoot,
  "reports/atlas-environment-classification-simulation-report.md"
);

const simulationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-environment-classification-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("atlas environment classification simulation is deterministic", () => {
  const first = simulationModule.buildAtlasEnvironmentClassificationSimulation({
    cwd: repoRoot
  });
  const second = simulationModule.buildAtlasEnvironmentClassificationSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.results, second.results);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas environment classification simulation handles coastal, forest, mixed, unsupported, and ambiguous scenarios", () => {
  const simulation = simulationModule.buildAtlasEnvironmentClassificationSimulation({
    cwd: repoRoot
  });

  const coastal = byScenarioId(simulation.results, "CLASSIFY_COASTAL_001");
  const forest = byScenarioId(simulation.results, "CLASSIFY_FOREST_001");
  const mixed = byScenarioId(simulation.results, "CLASSIFY_MIXED_001");
  const unsupported = byScenarioId(simulation.results, "CLASSIFY_UNSUPPORTED_001");
  const ambiguous = byScenarioId(simulation.results, "CLASSIFY_AMBIGUOUS_001");

  assert.equal(coastal.classification.primaryEnvironmentType, "COASTAL_EXPLORATION");
  assert.equal(coastal.selectorResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(forest.classification.primaryEnvironmentType, "FOREST_EXPLORATION");
  assert.equal(forest.selectorResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.classification.primaryEnvironmentType, "MIXED_EDGE_TRANSITION");
  assert.equal(mixed.selectorResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.selectorResult.fallbackApplied, true);
  assert.equal(unsupported.classification.classificationStatus, "BLOCKED_UNSUPPORTED");
  assert.equal(unsupported.selectorResult.blocked, true);
  assert.equal(ambiguous.classification.classificationStatus, "AMBIGUOUS_CLASSIFICATION");
  assert.equal(ambiguous.selectorResult.fallbackApplied, true);
});

test("atlas environment classification simulation records correct confidence handling and approved-only handoff", () => {
  const simulation = simulationModule.buildAtlasEnvironmentClassificationSimulation({
    cwd: repoRoot
  });

  for (const result of simulation.results) {
    if (result.classification.classificationStatus === "BLOCKED_UNSUPPORTED") {
      assert.equal(result.selectorResult.selectedRecipeId, null);
      assert.equal(result.selectorResult.blocked, true);
      continue;
    }

    assert.equal(
      ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
        result.selectorResult.selectedRecipeId
      ),
      true
    );
    assert.ok(result.biomeConfidence.environmentConfidence >= 0);
    assert.ok(result.biomeConfidence.environmentConfidence <= 100);
  }
});

test("atlas environment classification simulation writes records and validation", () => {
  simulationModule.writeAtlasEnvironmentClassificationSimulation({ cwd: repoRoot });

  const inputs = readJson(simulationInputsPath);
  const classifications = readJson(classificationOutputsPath);
  const confidence = readJson(biomeConfidencePath);
  const handoffs = readJson(selectorHandoffPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(inputs.length, 5);
  assert.equal(classifications.length, 5);
  assert.equal(confidence.length, 5);
  assert.equal(handoffs.length, 5);
  assert.equal(validation.status, "pass");
  assert.match(report, /Future Atlas Engine development: READY/);
});
