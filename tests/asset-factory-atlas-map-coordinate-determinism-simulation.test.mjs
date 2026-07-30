import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-map-coordinate-determinism-simulation-harness.json"
);
const resultsPath = path.join(
  simulationRoot,
  "outputs/atlas-map-coordinate-determinism-simulation-results.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-map-coordinate-determinism-simulation-validation.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-map-coordinate-determinism-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-map-coordinate-determinism-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas map coordinate determinism simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasMapCoordinateDeterminismSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasMapCoordinateDeterminismSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.results, second.results);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas map coordinate determinism simulation covers required scenarios", () => {
  const simulation = moduleUnderTest.buildAtlasMapCoordinateDeterminismSimulation({
    cwd: repoRoot
  });

  assert.equal(simulation.harness.scenarios.length, 5);
  assert.equal(
    simulation.harness.scenarios.some(
      (scenario) =>
        scenario.scenarioType === "IDENTICAL_COORDINATE_REPEATED_LOOKUP"
    ),
    true
  );
  assert.equal(
    simulation.harness.scenarios.some(
      (scenario) => scenario.scenarioType === "REGION_BOUNDARY_CROSSING"
    ),
    true
  );
  assert.equal(
    simulation.results.scenarioResults.every((scenario) => scenario.summary.result === "PASS"),
    true
  );
});

test("atlas map coordinate determinism simulation preserves deterministic resolution and safe failures", () => {
  const simulation = moduleUnderTest.buildAtlasMapCoordinateDeterminismSimulation({
    cwd: repoRoot
  });

  const repeated = simulation.results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_REPEAT_001"
  );
  const nearby = simulation.results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_NEARBY_VARIATION_001"
  );
  const invalid = simulation.results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_INVALID_INPUT_001"
  );
  const missing = simulation.results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_MISSING_PACKAGE_001"
  );

  assert.equal(repeated.lookups[0].regionId, repeated.lookups[1].regionId);
  assert.equal(repeated.lookups[0].selectorSeed, repeated.lookups[1].selectorSeed);
  assert.equal(nearby.lookups[0].packageId, nearby.lookups[1].packageId);
  assert.equal(nearby.lookups[0].selectedRecipeId, nearby.lookups[1].selectedRecipeId);
  assert.equal(invalid.lookups[0].reasonCode, "UNSUPPORTED_COORDINATE_CONTEXT");
  assert.equal(missing.lookups[0].reasonCode, "REGION_NOT_FOUND");
});

test("atlas map coordinate determinism simulation writes records and preserves safety boundaries", () => {
  moduleUnderTest.writeAtlasMapCoordinateDeterminismSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const results = readJson(resultsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.scenarios.length, 5);
  assert.equal(results.scenarioResults.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future map attachment determinism simulation: READY/);
});
