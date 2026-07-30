import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-runtime-adapter-simulation-harness.json"
);
const outputsPath = path.join(
  simulationRoot,
  "outputs/atlas-runtime-adapter-simulation-outputs.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-runtime-adapter-simulation-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-runtime-adapter-simulation-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-runtime-adapter-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-runtime-adapter-contract-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas runtime adapter contract simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRuntimeAdapterContractSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRuntimeAdapterContractSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.outputs, second.outputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas runtime adapter contract simulation covers valid, blocked, missing, invalid, and emergency scenarios", () => {
  const result = moduleUnderTest.buildAtlasRuntimeAdapterContractSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 5);
  assert.equal(
    result.harness.scenarios.some(
      (scenario) =>
        scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
    ),
    true
  );
  assert.equal(
    result.harness.scenarios.some(
      (scenario) => scenario.scenarioType === "INVALID_COORDINATE_REQUEST"
    ),
    true
  );
  assert.equal(
    result.outputs.scenarios.some(
      (scenario) =>
        scenario.scenarioType === "EMERGENCY_SHUTDOWN_REQUEST" &&
        scenario.failureResponse.reasonCode === "EMERGENCY_SHUTDOWN_TRIGGERED"
    ),
    true
  );
});

test("atlas runtime adapter contract simulation preserves disabled runtime, map, and renderer flags", () => {
  const result = moduleUnderTest.buildAtlasRuntimeAdapterContractSimulation({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
});

test("atlas runtime adapter contract simulation writes records and reports implementation readiness", () => {
  moduleUnderTest.writeAtlasRuntimeAdapterContractSimulation({ cwd: repoRoot });

  const harness = readJson(harnessPath);
  const outputs = readJson(outputsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  const validScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
  );
  const invalidScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "INVALID_COORDINATE_REQUEST"
  );

  assert.equal(harness.simulationId, "ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001");
  assert.equal(validScenario.deterministicRecipeResolution, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validScenario.adapterState, "PREPARED_NOT_EXECUTED");
  assert.equal(invalidScenario.failureResponse.reasonCode, "INVALID_COORDINATE");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FUTURE_RUNTIME_ADAPTER_READY_FOR_IMPLEMENTATION"
  );
  assert.match(report, /Future adapter implementation readiness: READY_FOR_IMPLEMENTATION_WORK/);
});
