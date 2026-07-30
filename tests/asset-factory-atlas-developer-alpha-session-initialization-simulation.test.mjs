import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-initialization/ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-developer-alpha-session-initialization-harness.json"
);
const stateOutputsPath = path.join(
  simulationRoot,
  "outputs/atlas-developer-alpha-session-initialization-state-outputs.json"
);
const telemetryPath = path.join(
  simulationRoot,
  "telemetry/atlas-developer-alpha-session-initialization-telemetry-records.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-developer-alpha-session-initialization-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-developer-alpha-session-initialization-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-developer-alpha-session-initialization-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-initialization-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session initialization simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionInitializationSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionInitializationSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.stateOutputs, second.stateOutputs);
  assert.deepEqual(first.telemetryOutputs, second.telemetryOutputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session initialization simulation covers success, invalid authorization, missing readiness lock, and safety flag mismatch scenarios", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionInitializationSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 4);
  assert.equal(
    result.stateOutputs.outputs.some(
      (record) =>
        record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION" &&
        record.stateTransition.to === "PRE_SESSION_CAPTURE_READY"
    ),
    true
  );
  assert.equal(
    result.stateOutputs.outputs.filter(
      (record) => record.stateTransition.to === "INVALID_SESSION"
    ).length,
    3
  );
});

test("atlas developer alpha session initialization simulation preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionInitializationSimulation({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.blenderAuthorized, false);
  assert.equal(result.validation.glbAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("atlas developer alpha session initialization simulation writes records and reaches initialization readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionInitializationSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const stateOutputs = readJson(stateOutputsPath);
  const telemetry = readJson(telemetryPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  const successRecord = stateOutputs.outputs.find(
    (record) => record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
  );
  const failedRecords = stateOutputs.outputs.filter(
    (record) => record.scenarioType !== "SUCCESSFUL_SESSION_INITIALIZATION"
  );

  assert.equal(harness.recordedOn, "2026-07-30");
  assert.equal(successRecord.preSessionCapture, "CAPTURED");
  assert.equal(failedRecords.every((record) => record.blockedFailureBehaviour), true);
  assert.equal(telemetry.outputs.length, 4);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "INITIALIZATION_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha initialization readiness: READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
