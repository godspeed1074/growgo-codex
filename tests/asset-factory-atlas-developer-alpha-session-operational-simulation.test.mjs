import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-developer-alpha-session-operational-harness.json"
);
const stateOutputsPath = path.join(
  simulationRoot,
  "outputs/atlas-developer-alpha-session-operational-state-outputs.json"
);
const telemetryPath = path.join(
  simulationRoot,
  "telemetry/atlas-developer-alpha-session-operational-telemetry-records.json"
);
const auditPath = path.join(
  simulationRoot,
  "audit/atlas-developer-alpha-session-operational-audit-records.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-developer-alpha-session-operational-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-developer-alpha-session-operational-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-developer-alpha-session-operational-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-operational-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session operational simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionOperationalSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionOperationalSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.stateOutputs, second.stateOutputs);
  assert.deepEqual(first.telemetryOutputs, second.telemetryOutputs);
  assert.deepEqual(first.auditOutputs, second.auditOutputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session operational simulation covers active review, warning, fallback, pause/resume, rollback, and completion", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionOperationalSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.phases.length, 7);
  assert.equal(
    result.stateOutputs.outputs.some(
      (phase) =>
        phase.phaseType === "enter_active_review_state" &&
        phase.stateTransition.to === "ACTIVE_MANUAL_REVIEW"
    ),
    true
  );
  assert.equal(
    result.stateOutputs.outputs.some(
      (phase) =>
        phase.phaseType === "rollback_flow" &&
        phase.stateTransition.to === "ROLLBACK_IN_PROGRESS" &&
        phase.rollbackTriggered === true
    ),
    true
  );
  assert.equal(
    result.stateOutputs.outputs.some(
      (phase) =>
        phase.phaseType === "session_completion" &&
        phase.stateTransition.to === "COMPLETED"
    ),
    true
  );
});

test("atlas developer alpha session operational simulation preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionOperationalSimulation({
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

test("atlas developer alpha session operational simulation writes records and reaches operational readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionOperationalSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const stateOutputs = readJson(stateOutputsPath);
  const telemetry = readJson(telemetryPath);
  const audit = readJson(auditPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.recordedOn, "2026-07-30");
  assert.equal(stateOutputs.outputs.length, 7);
  assert.equal(telemetry.outputs.length, 7);
  assert.equal(audit.records.some((record) => record.eventType === "SESSION_PAUSED"), true);
  assert.equal(audit.records.some((record) => record.eventType === "SESSION_RESUMED"), true);
  assert.equal(audit.records.some((record) => record.eventType === "ROLLBACK_RECORDED"), true);
  assert.equal(audit.records.some((record) => record.eventType === "SESSION_CLOSED"), true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "OPERATIONAL_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha operational readiness: READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
