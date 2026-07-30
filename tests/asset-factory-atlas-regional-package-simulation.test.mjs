import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001"
);

const inputsPath = path.join(
  packageRoot,
  "simulation/atlas-regional-package-simulation-inputs.json"
);
const packagesPath = path.join(
  packageRoot,
  "simulation/atlas-regional-package-simulation-packages.json"
);
const fingerprintsPath = path.join(
  packageRoot,
  "simulation/atlas-regional-package-simulation-fingerprints.json"
);
const classificationsPath = path.join(
  packageRoot,
  "simulation/atlas-regional-package-simulation-classifications.json"
);
const handoffsPath = path.join(
  packageRoot,
  "simulation/atlas-regional-package-simulation-selector-handoffs.json"
);
const validationPath = path.join(
  packageRoot,
  "validation/atlas-regional-package-simulation-validation.json"
);
const reportPath = path.join(
  packageRoot,
  "reports/atlas-regional-package-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-regional-package-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("atlas regional package simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRegionalPackageSimulation({ cwd: repoRoot });
  const second = moduleUnderTest.buildAtlasRegionalPackageSimulation({ cwd: repoRoot });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.results, second.results);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas regional package simulation handles coastal, forest, mixed, unsupported, and invalid packages", () => {
  const simulation = moduleUnderTest.buildAtlasRegionalPackageSimulation({
    cwd: repoRoot
  });

  const coastal = byScenarioId(simulation.results, "REGIONAL_PACKAGE_COASTAL_001");
  const forest = byScenarioId(simulation.results, "REGIONAL_PACKAGE_FOREST_001");
  const mixed = byScenarioId(simulation.results, "REGIONAL_PACKAGE_MIXED_001");
  const unsupported = byScenarioId(
    simulation.results,
    "REGIONAL_PACKAGE_UNSUPPORTED_001"
  );
  const invalid = byScenarioId(simulation.results, "REGIONAL_PACKAGE_INVALID_001");

  assert.equal(coastal.selectorResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(forest.selectorResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.selectorResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(unsupported.selectorResult.blocked, true);
  assert.equal(invalid.selectorResult.blocked, true);
  assert.equal(invalid.packageValidation.valid, false);
  assert.equal(invalid.packageValidation.missingLayers.includes("HYDROLOGY_SIGNAL_LAYER"), true);
});

test("atlas regional package simulation preserves deterministic package identity and selector handoff compatibility", () => {
  const simulation = moduleUnderTest.buildAtlasRegionalPackageSimulation({
    cwd: repoRoot
  });

  for (const result of simulation.results) {
    assert.equal(typeof result.packageFingerprint, "string");
    assert.equal(result.packageFingerprint.length > 20, true);
    assert.match(result.package.packageId, /^ATLAS_REGION_PACKAGE_/);
    assert.match(result.package.regionId, /^REGION_/);

    if (result.packageValidation.valid && result.selectorHandoff) {
      assert.equal(result.selectorHandoff.environment, "DEVELOPMENT_ONLY");
      assert.equal(typeof result.selectorHandoff.seed, "string");
      assert.equal(result.selectorHandoff.seed.length > 20, true);
    }
  }
});

test("atlas regional package simulation writes records and validation", () => {
  moduleUnderTest.writeAtlasRegionalPackageSimulation({ cwd: repoRoot });

  const inputs = readJson(inputsPath);
  const packages = readJson(packagesPath);
  const fingerprints = readJson(fingerprintsPath);
  const classifications = readJson(classificationsPath);
  const handoffs = readJson(handoffsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(inputs.length, 5);
  assert.equal(packages.length, 5);
  assert.equal(fingerprints.length, 5);
  assert.equal(classifications.length, 5);
  assert.equal(handoffs.length, 5);
  assert.equal(validation.status, "pass");
  assert.match(report, /Future Atlas development: READY/);
});
