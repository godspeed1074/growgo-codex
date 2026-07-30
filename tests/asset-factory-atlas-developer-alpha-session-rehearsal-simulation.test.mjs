import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-developer-alpha-rehearsal-harness.json"
);
const sessionsPath = path.join(
  simulationRoot,
  "sessions/atlas-developer-alpha-simulated-session-records.json"
);
const telemetryPath = path.join(
  simulationRoot,
  "telemetry/atlas-developer-alpha-rehearsal-telemetry.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-developer-alpha-rehearsal-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-developer-alpha-rehearsal-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-developer-alpha-rehearsal-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-rehearsal-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session rehearsal simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionRehearsalSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionRehearsalSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.sessionRecords, second.sessionRecords);
  assert.deepEqual(first.telemetryOutputs, second.telemetryOutputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session rehearsal simulation covers success, warning, rollback, and emergency stop scenarios", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionRehearsalSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 4);
  assert.equal(
    result.sessionRecords.records.some(
      (record) => record.scenarioType === "SUCCESSFUL_ALPHA_SESSION"
    ),
    true
  );
  assert.equal(
    result.sessionRecords.records.some(
      (record) =>
        record.scenarioType === "EMERGENCY_STOP_EVENT" &&
        record.stopTriggered === true
    ),
    true
  );
});

test("atlas developer alpha session rehearsal simulation preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionRehearsalSimulation({
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

test("atlas developer alpha session rehearsal simulation writes records and reaches rehearsal readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionRehearsalSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const sessions = readJson(sessionsPath);
  const telemetry = readJson(telemetryPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  const rollbackRecord = sessions.records.find(
    (record) => record.scenarioType === "ROLLBACK_EVENT"
  );
  const emergencyRecord = sessions.records.find(
    (record) => record.scenarioType === "EMERGENCY_STOP_EVENT"
  );

  assert.equal(harness.recordedOn, "2026-07-30");
  assert.equal(telemetry.outputs.length, 4);
  assert.equal(rollbackRecord.rollbackUsed, true);
  assert.equal(emergencyRecord.stopTriggered, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW"
  );
  assert.match(
    report,
    /Developer alpha rehearsal readiness: READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW/
  );
});
