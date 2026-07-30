import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pipelineRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001"
);

const inputsPath = path.join(
  pipelineRoot,
  "simulation/atlas-full-pipeline-simulation-inputs.json"
);
const resultsPath = path.join(
  pipelineRoot,
  "simulation/atlas-full-pipeline-simulation-stage-results.json"
);
const outputsPath = path.join(
  pipelineRoot,
  "simulation/atlas-full-pipeline-simulation-pipeline-outputs.json"
);
const validationPath = path.join(
  pipelineRoot,
  "validation/atlas-full-pipeline-simulation-validation.json"
);
const lifecyclePath = path.join(
  pipelineRoot,
  "lifecycle/atlas-full-pipeline-simulation-lifecycle-record.json"
);
const reportPath = path.join(
  pipelineRoot,
  "reports/atlas-full-pipeline-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-full-pipeline-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("atlas full pipeline simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasFullPipelineSimulation({ cwd: repoRoot });
  const second = moduleUnderTest.buildAtlasFullPipelineSimulation({ cwd: repoRoot });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.pipelineOutputs, second.pipelineOutputs);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas full pipeline simulation completes coastal, forest, and mixed scenarios through preview", () => {
  const simulation = moduleUnderTest.buildAtlasFullPipelineSimulation({
    cwd: repoRoot
  });

  const coastal = byScenarioId(simulation.results, "PIPELINE_COASTAL_001");
  const forest = byScenarioId(simulation.results, "PIPELINE_FOREST_001");
  const mixed = byScenarioId(simulation.results, "PIPELINE_MIXED_001");

  assert.equal(coastal.finalStage, "PREVIEW_READY");
  assert.equal(coastal.selectionResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(coastal.preview.validation.status, "pass");

  assert.equal(forest.finalStage, "PREVIEW_READY");
  assert.equal(forest.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(forest.preview.validation.status, "pass");

  assert.equal(mixed.finalStage, "PREVIEW_READY");
  assert.equal(mixed.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.selectionResult.fallbackApplied, true);
  assert.equal(mixed.preview.validation.status, "pass");
});

test("atlas full pipeline simulation blocks invalid and incompatible packages safely", () => {
  const simulation = moduleUnderTest.buildAtlasFullPipelineSimulation({
    cwd: repoRoot
  });

  const invalid = byScenarioId(simulation.results, "PIPELINE_INVALID_001");
  const incompatible = byScenarioId(
    simulation.results,
    "PIPELINE_INCOMPATIBLE_VERSION_001"
  );

  assert.equal(invalid.finalStage, "VALIDATION_BLOCKED");
  assert.equal(invalid.selectionResult.blocked, true);
  assert.equal(invalid.validationGate.blockedReason, "MISSING_REQUIRED_LAYER");

  assert.equal(incompatible.finalStage, "VALIDATION_BLOCKED");
  assert.equal(incompatible.selectionResult.blocked, true);
  assert.equal(incompatible.validationGate.blockedReason, "INVALID_SCHEMA_VERSION");
});

test("atlas full pipeline simulation preserves approved-only recipe usage and runtime safety", () => {
  const simulation = moduleUnderTest.buildAtlasFullPipelineSimulation({
    cwd: repoRoot
  });

  for (const result of simulation.results) {
    if (result.selectionResult.selectedRecipeId !== null) {
      assert.equal(
        ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
          result.selectionResult.selectedRecipeId
        ),
        true
      );
    }
    assert.notEqual(result.preview?.previewPackage.safety.runtimeActivated, true);
    assert.notEqual(result.preview?.previewPackage.safety.assetsModified, true);
  }
});

test("atlas full pipeline simulation writes records and lifecycle state", () => {
  moduleUnderTest.writeAtlasFullPipelineSimulation({ cwd: repoRoot });

  const inputs = readJson(inputsPath);
  const results = readJson(resultsPath);
  const outputs = readJson(outputsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(inputs.length, 5);
  assert.equal(results.length, 5);
  assert.equal(outputs.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "READY");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.mapDownloadsAuthorized, false);
  assert.match(report, /End-to-end Atlas planning simulation: READY/);
});
