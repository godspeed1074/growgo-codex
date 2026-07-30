import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-controlled-attachment-simulation-harness.json"
);
const outputsPath = path.join(
  simulationRoot,
  "outputs/atlas-controlled-attachment-simulation-outputs.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-controlled-attachment-simulation-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-controlled-attachment-simulation-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-controlled-attachment-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-attachment-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas controlled attachment simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasControlledAttachmentSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasControlledAttachmentSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.outputs, second.outputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas controlled attachment simulation covers required scenarios", () => {
  const simulation = moduleUnderTest.buildAtlasControlledAttachmentSimulation({
    cwd: repoRoot
  });

  assert.equal(simulation.harness.scenarios.length, 5);
  assert.equal(
    simulation.outputs.scenarios.some(
      (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
    ),
    true
  );
  assert.equal(
    simulation.outputs.scenarios.some(
      (scenario) => scenario.scenarioType === "EMERGENCY_DISABLE"
    ),
    true
  );
});

test("atlas controlled attachment simulation preserves permission checks, rollback, kill switch, validation, and deterministic recipe selection", () => {
  const simulation = moduleUnderTest.buildAtlasControlledAttachmentSimulation({
    cwd: repoRoot
  });

  const approved = simulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );
  const blockedRegion = simulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "BLOCKED_REGION"
  );
  const missingPackage = simulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "MISSING_PACKAGE"
  );
  const validationFailure = simulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "VALIDATION_FAILURE"
  );
  const emergencyDisable = simulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "EMERGENCY_DISABLE"
  );

  assert.equal(approved.status, "ready_for_future_alpha");
  assert.equal(approved.permissionChecks.inAllowedRegion, true);
  assert.equal(approved.coordinateResolution.status, "resolved");
  assert.equal(
    approved.deterministicRecipeSelection,
    approved.coordinateResolution.expectedRecipeId
  );
  assert.equal(blockedRegion.status, "blocked");
  assert.equal(blockedRegion.reasonCode, "REGION_SCOPE_VIOLATION");
  assert.equal(missingPackage.reasonCode, "REGION_NOT_FOUND");
  assert.equal(validationFailure.reasonCode, "VALIDATION_GATE_FAILURE");
  assert.equal(emergencyDisable.killSwitch.emergencyDisableTriggered, true);
  assert.equal(emergencyDisable.reasonCode, "EMERGENCY_DISABLE_TRIGGERED");
  assert.equal(
    simulation.outputs.scenarios.every((scenario) => scenario.rollback.rollbackAvailable),
    true
  );
});

test("atlas controlled attachment simulation writes records and preserves safety boundaries", () => {
  moduleUnderTest.writeAtlasControlledAttachmentSimulation({ cwd: repoRoot });

  const harness = readJson(harnessPath);
  const outputs = readJson(outputsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.scenarios.length, 5);
  assert.equal(outputs.scenarios.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "FUTURE_ALPHA_ATTACHMENT_READY_FOR_REVIEW");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future alpha attachment simulation: READY/);
});
