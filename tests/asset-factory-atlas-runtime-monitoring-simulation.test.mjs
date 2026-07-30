import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-runtime-monitoring-simulation-harness.json"
);
const telemetryPath = path.join(
  simulationRoot,
  "telemetry/atlas-runtime-monitoring-telemetry-records.json"
);
const alertsPath = path.join(
  simulationRoot,
  "alerts/atlas-runtime-monitoring-alert-outputs.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-runtime-monitoring-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-runtime-monitoring-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-runtime-monitoring-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-runtime-monitoring-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas runtime monitoring simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRuntimeMonitoringSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRuntimeMonitoringSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.telemetryRecords, second.telemetryRecords);
  assert.deepEqual(first.alertOutputs, second.alertOutputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas runtime monitoring simulation covers healthy, failure, warning, fallback, and shutdown scenarios", () => {
  const result = moduleUnderTest.buildAtlasRuntimeMonitoringSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 5);
  assert.equal(
    result.telemetryRecords.records.some(
      (record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION"
    ),
    true
  );
  assert.equal(
    result.telemetryRecords.records.some(
      (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
    ),
    true
  );
  assert.equal(
    result.alertOutputs.alerts.some(
      (alert) => alert.operatorAction === "OPEN_AUDIT_TRACE"
    ),
    true
  );
});

test("atlas runtime monitoring simulation preserves disabled runtime, map, and renderer flags", () => {
  const result = moduleUnderTest.buildAtlasRuntimeMonitoringSimulation({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
});

test("atlas runtime monitoring simulation writes telemetry, alerts, and readiness records", () => {
  moduleUnderTest.writeAtlasRuntimeMonitoringSimulation({ cwd: repoRoot });

  const harness = readJson(harnessPath);
  const telemetry = readJson(telemetryPath);
  const alerts = readJson(alertsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  const healthy = telemetry.records.find(
    (record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION"
  );
  const failure = telemetry.records.find(
    (record) => record.scenarioType === "PACKAGE_VALIDATION_FAILURE"
  );
  const warning = telemetry.records.find(
    (record) => record.scenarioType === "BUDGET_WARNING"
  );
  const shutdown = telemetry.records.find(
    (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );

  assert.equal(harness.simulationId, "ATLAS_RUNTIME_MONITORING_SIMULATION_001");
  assert.equal(healthy.healthState, "HEALTHY");
  assert.equal(failure.healthState, "BLOCKED");
  assert.equal(warning.healthState, "WARNING");
  assert.equal(shutdown.rollbackSignal, "FORCE_PLANNING_ONLY_STATE");
  assert.equal(alerts.alerts.length, 5);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "FUTURE_RUNTIME_MONITORING_READY_FOR_IMPLEMENTATION"
  );
  assert.match(report, /Future runtime monitoring readiness: READY_FOR_IMPLEMENTATION_WORK/);
});
