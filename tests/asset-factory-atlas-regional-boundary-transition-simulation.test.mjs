import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-regional-boundary-transition/ATLAS_REGIONAL_BOUNDARY_TRANSITION_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-regional-boundary-transition-simulation-harness.json"
);
const recordsPath = path.join(
  simulationRoot,
  "outputs/atlas-regional-boundary-transition-records.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-regional-boundary-transition-validation.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-regional-boundary-transition-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-regional-boundary-transition-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas regional boundary transition simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRegionalBoundaryTransitionSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRegionalBoundaryTransitionSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.transitionRecords, second.transitionRecords);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas regional boundary transition simulation covers required transition scenarios", () => {
  const simulation = moduleUnderTest.buildAtlasRegionalBoundaryTransitionSimulation({
    cwd: repoRoot
  });

  assert.equal(simulation.harness.scenarios.length, 5);
  assert.equal(
    simulation.harness.scenarios.some(
      (scenario) => scenario.transitionType === "MOVEMENT_WITHIN_SAME_REGION"
    ),
    true
  );
  assert.equal(
    simulation.harness.scenarios.some(
      (scenario) => scenario.transitionType === "MIXED_BIOME_BOUNDARY"
    ),
    true
  );
  assert.equal(
    simulation.transitionRecords.transitions.every(
      (transition) => transition.summary.result === "PASS"
    ),
    true
  );
});

test("atlas regional boundary transition simulation preserves handoff, continuity, and safe failures", () => {
  const simulation = moduleUnderTest.buildAtlasRegionalBoundaryTransitionSimulation({
    cwd: repoRoot
  });

  const sameRegion = simulation.transitionRecords.transitions.find(
    (transition) => transition.transitionId === "REGION_TRANSITION_WITHIN_REGION_001"
  );
  const crossRegion = simulation.transitionRecords.transitions.find(
    (transition) => transition.transitionId === "REGION_TRANSITION_CROSS_REGION_001"
  );
  const mixedBoundary = simulation.transitionRecords.transitions.find(
    (transition) => transition.transitionId === "REGION_TRANSITION_MIXED_BOUNDARY_001"
  );
  const missingNeighbor = simulation.transitionRecords.transitions.find(
    (transition) => transition.transitionId === "REGION_TRANSITION_MISSING_NEIGHBOR_001"
  );
  const invalidBoundary = simulation.transitionRecords.transitions.find(
    (transition) => transition.transitionId === "REGION_TRANSITION_INVALID_BOUNDARY_001"
  );

  assert.equal(sameRegion.steps[0].cacheKey, sameRegion.steps[1].cacheKey);
  assert.equal(sameRegion.steps[0].selectorSeed, sameRegion.steps[1].selectorSeed);
  assert.notEqual(crossRegion.steps[0].cacheKey, crossRegion.steps[1].cacheKey);
  assert.notEqual(crossRegion.steps[0].selectorSeed, crossRegion.steps[1].selectorSeed);
  assert.equal(mixedBoundary.steps[0].selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixedBoundary.steps[1].selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixedBoundary.steps[1].fallbackApplied, true);
  assert.equal(missingNeighbor.steps[1].reasonCode, "REGION_NOT_FOUND");
  assert.equal(invalidBoundary.steps[0].reasonCode, "UNSUPPORTED_COORDINATE_CONTEXT");
});

test("atlas regional boundary transition simulation writes records and preserves safety boundaries", () => {
  moduleUnderTest.writeAtlasRegionalBoundaryTransitionSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const records = readJson(recordsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.scenarios.length, 5);
  assert.equal(records.transitions.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future map attachment boundary transitions: READY/);
});
