import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001";

const HARNESS_FILENAME = "atlas-developer-alpha-rehearsal-harness.json";
const SESSION_RECORDS_FILENAME = "atlas-developer-alpha-simulated-session-records.json";
const TELEMETRY_FILENAME = "atlas-developer-alpha-rehearsal-telemetry.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-rehearsal-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-rehearsal-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-rehearsal-report.md";

const EXECUTION_CHECKLIST_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/checklist/atlas-developer-alpha-execution-checklist.json";
const RUNBOOK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/runbook/atlas-developer-alpha-operator-runbook.json";
const GO_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/decision/atlas-developer-alpha-go-no-go-decision-record.json";
const FINAL_AUDIT_CHECKLIST_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/checklist/atlas-alpha-final-readiness-checklist.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_ALERTS_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/alerts/atlas-runtime-monitoring-alert-outputs.json";

const RECORD_DATE = "2026-07-30";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(cwd, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(cwd, relativePath), "utf8"));
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function loadInputs(cwd) {
  return deepFreeze({
    executionChecklist: readJson(cwd, EXECUTION_CHECKLIST_PATH),
    runbook: readJson(cwd, RUNBOOK_PATH),
    goRecord: readJson(cwd, GO_RECORD_PATH),
    finalAuditChecklist: readJson(cwd, FINAL_AUDIT_CHECKLIST_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringAlerts: readJson(cwd, MONITORING_ALERTS_PATH)
  });
}

function findTelemetry(inputs, scenarioType) {
  return inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === scenarioType
  );
}

function findAlert(inputs, scenarioType) {
  return inputs.monitoringAlerts.alerts.find(
    (alert) => alert.scenarioType === scenarioType
  );
}

function buildHarness(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_HARNESS_001",
    simulationId: "ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001",
    recordedOn: RECORD_DATE,
    references: {
      executionChecklistId: inputs.executionChecklist.checklistId,
      runbookId: inputs.runbook.runbookId,
      goRecordId: inputs.goRecord.recordId,
      finalAuditChecklistId: inputs.finalAuditChecklist.auditId
    },
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    scenarios: [
      {
        scenarioId: "DEVELOPER_ALPHA_REHEARSAL_SUCCESS_001",
        scenarioType: "SUCCESSFUL_ALPHA_SESSION",
        telemetryId: findTelemetry(inputs, "HEALTHY_ATLAS_GENERATION").telemetryId,
        alertId: findAlert(inputs, "HEALTHY_ATLAS_GENERATION").alertId
      },
      {
        scenarioId: "DEVELOPER_ALPHA_REHEARSAL_WARNING_001",
        scenarioType: "WARNING_EVENT",
        telemetryId: findTelemetry(inputs, "BUDGET_WARNING").telemetryId,
        alertId: findAlert(inputs, "BUDGET_WARNING").alertId
      },
      {
        scenarioId: "DEVELOPER_ALPHA_REHEARSAL_ROLLBACK_001",
        scenarioType: "ROLLBACK_EVENT",
        telemetryId: findTelemetry(inputs, "RECIPE_FALLBACK_EVENT").telemetryId,
        alertId: findAlert(inputs, "RECIPE_FALLBACK_EVENT").alertId
      },
      {
        scenarioId: "DEVELOPER_ALPHA_REHEARSAL_EMERGENCY_STOP_001",
        scenarioType: "EMERGENCY_STOP_EVENT",
        telemetryId: findTelemetry(inputs, "EMERGENCY_SHUTDOWN_EVENT").telemetryId,
        alertId: findAlert(inputs, "EMERGENCY_SHUTDOWN_EVENT").alertId
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001",
      inputs.executionChecklist.deterministicFingerprint,
      inputs.runbook.deterministicFingerprint,
      RECORD_DATE
    )
  });
}

function buildScenarioRecord(inputs, scenario) {
  const telemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.telemetryId === scenario.telemetryId
  );
  const alert = inputs.monitoringAlerts.alerts.find(
    (entry) => entry.alertId === scenario.alertId
  );

  let sessionOutcome = "REHEARSAL_COMPLETED";
  let stopTriggered = false;
  let rollbackUsed = false;
  let auditCompleted = true;

  if (scenario.scenarioType === "WARNING_EVENT") {
    sessionOutcome = "REHEARSAL_COMPLETED_WITH_WARNING";
  } else if (scenario.scenarioType === "ROLLBACK_EVENT") {
    sessionOutcome = "REHEARSAL_STOPPED_AND_ROLLED_BACK";
    stopTriggered = true;
    rollbackUsed = true;
  } else if (scenario.scenarioType === "EMERGENCY_STOP_EVENT") {
    sessionOutcome = "REHEARSAL_EMERGENCY_STOP";
    stopTriggered = true;
    rollbackUsed = true;
  }

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_SESSION_RECORD_001",
    scenarioId: scenario.scenarioId,
    scenarioType: scenario.scenarioType,
    preFlightCompleted: true,
    environmentVerified: true,
    operatorSequenceCompleted:
      scenario.scenarioType === "EMERGENCY_STOP_EVENT" ? false : true,
    monitoringObserved: true,
    stopTriggered,
    rollbackUsed,
    auditCompleted,
    telemetryReference: telemetry.telemetryId,
    alertReference: alert.alertId,
    sessionOutcome,
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    deterministicFingerprint: hashHex(
      scenario.scenarioId,
      telemetry.deterministicFingerprint,
      alert.deterministicFingerprint,
      sessionOutcome
    )
  });
}

function buildSessionRecords(inputs, harness) {
  const records = harness.scenarios.map((scenario) =>
    buildScenarioRecord(inputs, scenario)
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_SESSION_RECORD_SET_001",
    simulationId: harness.simulationId,
    records,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(records.map((record) => record.deterministicFingerprint))
    )
  });
}

function buildTelemetryOutputs(inputs, harness, sessionRecords) {
  const outputs = harness.scenarios.map((scenario) => {
    const sessionRecord = sessionRecords.records.find(
      (record) => record.scenarioId === scenario.scenarioId
    );
    const telemetry = inputs.monitoringTelemetry.records.find(
      (record) => record.telemetryId === scenario.telemetryId
    );
    const alert = inputs.monitoringAlerts.alerts.find(
      (entry) => entry.alertId === scenario.alertId
    );

    return deepFreeze({
      schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_TELEMETRY_OUTPUT_001",
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      healthState: telemetry.healthState,
      alertState: alert.alertState,
      rollbackSignal: telemetry.rollbackSignal,
      stopTriggered: sessionRecord.stopTriggered,
      auditCompleted: sessionRecord.auditCompleted,
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      deterministicFingerprint: hashHex(
        scenario.scenarioId,
        telemetry.deterministicFingerprint,
        alert.deterministicFingerprint,
        sessionRecord.deterministicFingerprint
      )
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_TELEMETRY_SET_001",
    simulationId: harness.simulationId,
    outputs,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(outputs.map((output) => output.deterministicFingerprint))
    )
  });
}

function buildValidation(inputs, harness, sessionRecords, telemetryOutputs) {
  const successRecord = sessionRecords.records.find(
    (record) => record.scenarioType === "SUCCESSFUL_ALPHA_SESSION"
  );
  const warningRecord = sessionRecords.records.find(
    (record) => record.scenarioType === "WARNING_EVENT"
  );
  const rollbackRecord = sessionRecords.records.find(
    (record) => record.scenarioType === "ROLLBACK_EVENT"
  );
  const emergencyRecord = sessionRecords.records.find(
    (record) => record.scenarioType === "EMERGENCY_STOP_EVENT"
  );

  const checks = [
    {
      name: "runbook_execution",
      ok:
        inputs.runbook.executionSequence.length === 5 &&
        successRecord.operatorSequenceCompleted === true
    },
    {
      name: "preflight_checks",
      ok:
        successRecord.preFlightCompleted === true &&
        rollbackRecord.preFlightCompleted === true &&
        inputs.finalAuditChecklist.failCount === 0
    },
    {
      name: "monitoring_flow",
      ok:
        telemetryOutputs.outputs.length === 4 &&
        warningRecord.monitoringObserved === true &&
        emergencyRecord.monitoringObserved === true
    },
    {
      name: "rollback_handling",
      ok:
        rollbackRecord.rollbackUsed === true &&
        emergencyRecord.rollbackUsed === true
    },
    {
      name: "stop_conditions",
      ok:
        rollbackRecord.stopTriggered === true &&
        emergencyRecord.stopTriggered === true &&
        successRecord.stopTriggered === false
    },
    {
      name: "audit_completion",
      ok:
        successRecord.auditCompleted === true &&
        warningRecord.auditCompleted === true &&
        rollbackRecord.auditCompleted === true &&
        emergencyRecord.auditCompleted === true
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        inputs.goRecord.runtimeFlags.mapAttachmentAllowed === false &&
        inputs.goRecord.runtimeFlags.automaticRendererExecutionAllowed === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_VALIDATION_001",
    simulationId: harness.simulationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(checks),
      telemetryOutputs.deterministicFingerprint
    )
  });
}

function buildLifecycle(sessionRecords, validation) {
  const successCount = sessionRecords.records.filter(
    (record) => record.sessionOutcome === "REHEARSAL_COMPLETED"
  ).length;
  const warningCount = sessionRecords.records.filter(
    (record) => record.sessionOutcome === "REHEARSAL_COMPLETED_WITH_WARNING"
  ).length;
  const stopCount = sessionRecords.records.filter((record) => record.stopTriggered)
    .length;

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REHEARSAL_LIFECYCLE_001",
    simulationId: sessionRecords.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW"
        : "DEVELOPER_ALPHA_REHEARSAL_BLOCKED",
    successfulSessions: successCount,
    warningSessions: warningCount,
    stoppedSessions: stopCount,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      sessionRecords.simulationId,
      validation.status,
      successCount,
      warningCount,
      stopCount
    )
  });
}

function buildReport(sessionRecords, validation, lifecycle) {
  const recordLines = sessionRecords.records
    .map(
      (record) =>
        `- ${record.scenarioId}: ${record.sessionOutcome} (stop=${record.stopTriggered}, rollback=${record.rollbackUsed})`
    )
    .join("\n");

  return `# ATLAS DEVELOPER ALPHA SESSION REHEARSAL

## Goal

Simulate the future developer alpha session using the approved execution checklist and runbook.

## Session Results

${recordLines}

## Validation

${validation.checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`).join("\n")}

## Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false
- blenderAuthorized: false
- glbAuthorized: false
- assetModificationAuthorized: false

## Rehearsal Readiness

Developer alpha rehearsal readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionRehearsalSimulation({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const sessionRecords = buildSessionRecords(inputs, harness);
  const telemetryOutputs = buildTelemetryOutputs(inputs, harness, sessionRecords);
  const validation = buildValidation(
    inputs,
    harness,
    sessionRecords,
    telemetryOutputs
  );
  const lifecycle = buildLifecycle(sessionRecords, validation);
  const report = buildReport(sessionRecords, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    sessionRecords,
    telemetryOutputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionRehearsalSimulation({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionRehearsalSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const sessionsDir = path.join(result.root, "sessions");
  const telemetryDir = path.join(result.root, "telemetry");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    sessionsDir,
    telemetryDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(sessionsDir, SESSION_RECORDS_FILENAME), result.sessionRecords);
  writeJson(path.join(telemetryDir, TELEMETRY_FILENAME), result.telemetryOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionRehearsalSimulation();
}
