import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-initialization/ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001";

const HARNESS_FILENAME =
  "atlas-developer-alpha-session-initialization-harness.json";
const SESSION_STATES_FILENAME =
  "atlas-developer-alpha-session-initialization-state-outputs.json";
const TELEMETRY_FILENAME =
  "atlas-developer-alpha-session-initialization-telemetry-records.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-initialization-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-initialization-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-session-initialization-report.md";

const START_RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001/specification/atlas-developer-alpha-session-start-record-specification.json";
const START_RECORD_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001/validation/atlas-developer-alpha-session-start-record-validation.json";
const READINESS_LOCK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/record/atlas-developer-alpha-session-readiness-lock-record.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";

const SIMULATION_DATE = "2026-07-30";
const DEFAULT_CWD = path.resolve(import.meta.dirname, "..");

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
    startSpecification: readJson(cwd, START_RECORD_SPECIFICATION_PATH),
    startValidation: readJson(cwd, START_RECORD_VALIDATION_PATH),
    readinessLockRecord: readJson(cwd, READINESS_LOCK_RECORD_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH)
  });
}

function monitoringRecordById(inputs, telemetryId) {
  return inputs.monitoringTelemetry.records.find(
    (record) => record.telemetryId === telemetryId
  );
}

function buildHarness(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_HARNESS_001",
    simulationId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001",
    recordedOn: SIMULATION_DATE,
    startRecordReference: inputs.startSpecification.startRecordId,
    readinessLockReference: inputs.readinessLockRecord.lockId,
    controlReference: inputs.controlSpecification.controlId,
    monitoringReference: inputs.monitoringTelemetry.simulationId,
    scenarios: [
      {
        scenarioId: "ATLAS_INIT_SUCCESS_001",
        scenarioType: "SUCCESSFUL_SESSION_INITIALIZATION",
        expectedOutcome: "PRE_SESSION_CAPTURE_READY"
      },
      {
        scenarioId: "ATLAS_INIT_INVALID_AUTH_001",
        scenarioType: "INVALID_AUTHORIZATION",
        expectedOutcome: "INVALID_SESSION"
      },
      {
        scenarioId: "ATLAS_INIT_MISSING_LOCK_001",
        scenarioType: "MISSING_READINESS_LOCK",
        expectedOutcome: "INVALID_SESSION"
      },
      {
        scenarioId: "ATLAS_INIT_SAFETY_FLAG_MISMATCH_001",
        scenarioType: "SAFETY_FLAG_MISMATCH",
        expectedOutcome: "INVALID_SESSION"
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_HARNESS_001",
      inputs.startSpecification.deterministicFingerprint,
      inputs.readinessLockRecord.deterministicFingerprint,
      inputs.controlSpecification.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      SIMULATION_DATE
    )
  });
}

function buildSessionStateOutputs(inputs, harness) {
  const healthyTelemetry = monitoringRecordById(
    inputs,
    "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY"
  );
  const emergencyTelemetry = monitoringRecordById(
    inputs,
    "RUNTIME_MONITORING_EMERGENCY_SHUTDOWN_001_TELEMETRY"
  );

  const records = [
    {
      scenarioId: "ATLAS_INIT_SUCCESS_001",
      scenarioType: "SUCCESSFUL_SESSION_INITIALIZATION",
      readinessVerification: "PASS",
      authorizationCheck: "PASS",
      readinessLockCheck: "PASS",
      safetyFlagCheck: "PASS",
      stateTransition: {
        from: "NOT_STARTED",
        event: "OPEN_SESSION",
        to: "PRE_SESSION_CAPTURE_READY"
      },
      preSessionCapture: "CAPTURED",
      telemetryInitialization: healthyTelemetry.telemetryId,
      auditInitialization: ["SESSION_OPENED", "PRE_SESSION_CAPTURED"],
      blockedFailureBehaviour: false
    },
    {
      scenarioId: "ATLAS_INIT_INVALID_AUTH_001",
      scenarioType: "INVALID_AUTHORIZATION",
      readinessVerification: "FAIL",
      authorizationCheck: "FAIL",
      readinessLockCheck: "PASS",
      safetyFlagCheck: "PASS",
      stateTransition: {
        from: "PRE_SESSION_CAPTURE_READY",
        event: "MARK_INVALID",
        to: "INVALID_SESSION"
      },
      preSessionCapture: "BLOCKED",
      telemetryInitialization: emergencyTelemetry.telemetryId,
      auditInitialization: ["SESSION_OPENED", "AUTHORIZATION_FAILURE_RECORDED"],
      blockedFailureBehaviour: true
    },
    {
      scenarioId: "ATLAS_INIT_MISSING_LOCK_001",
      scenarioType: "MISSING_READINESS_LOCK",
      readinessVerification: "FAIL",
      authorizationCheck: "PASS",
      readinessLockCheck: "FAIL",
      safetyFlagCheck: "PASS",
      stateTransition: {
        from: "PRE_SESSION_CAPTURE_READY",
        event: "MARK_INVALID",
        to: "INVALID_SESSION"
      },
      preSessionCapture: "BLOCKED",
      telemetryInitialization: emergencyTelemetry.telemetryId,
      auditInitialization: ["SESSION_OPENED", "READINESS_LOCK_FAILURE_RECORDED"],
      blockedFailureBehaviour: true
    },
    {
      scenarioId: "ATLAS_INIT_SAFETY_FLAG_MISMATCH_001",
      scenarioType: "SAFETY_FLAG_MISMATCH",
      readinessVerification: "FAIL",
      authorizationCheck: "PASS",
      readinessLockCheck: "PASS",
      safetyFlagCheck: "FAIL",
      stateTransition: {
        from: "PRE_SESSION_CAPTURE_READY",
        event: "MARK_INVALID",
        to: "INVALID_SESSION"
      },
      preSessionCapture: "BLOCKED",
      telemetryInitialization: emergencyTelemetry.telemetryId,
      auditInitialization: ["SESSION_OPENED", "SAFETY_FLAG_MISMATCH_RECORDED"],
      blockedFailureBehaviour: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_STATE_OUTPUTS_001",
    simulationId: harness.simulationId,
    outputs: records,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_STATE_OUTPUTS_001",
      harness.deterministicFingerprint,
      JSON.stringify(records)
    )
  });
}

function buildTelemetryOutputs(inputs, stateOutputs) {
  const healthyTelemetry = monitoringRecordById(
    inputs,
    "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY"
  );
  const emergencyTelemetry = monitoringRecordById(
    inputs,
    "RUNTIME_MONITORING_EMERGENCY_SHUTDOWN_001_TELEMETRY"
  );

  const outputs = stateOutputs.outputs.map((record) => ({
    scenarioId: record.scenarioId,
    scenarioType: record.scenarioType,
    telemetryId: record.telemetryInitialization,
    healthState:
      record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
        ? healthyTelemetry.healthState
        : emergencyTelemetry.healthState,
    alertState:
      record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
        ? healthyTelemetry.alertState
        : emergencyTelemetry.alertState,
    rollbackSignal:
      record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
        ? healthyTelemetry.rollbackSignal
        : emergencyTelemetry.rollbackSignal,
    reasonCode:
      record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
        ? "INITIALIZATION_READY_NO_RUNTIME_EXECUTION"
        : "INITIALIZATION_BLOCKED_BEFORE_RUNTIME",
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    }
  }));

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_TELEMETRY_OUTPUTS_001",
    simulationId: stateOutputs.simulationId,
    outputs,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_TELEMETRY_OUTPUTS_001",
      stateOutputs.deterministicFingerprint,
      JSON.stringify(outputs)
    )
  });
}

function buildValidation(inputs, harness, stateOutputs, telemetryOutputs) {
  const successRecord = stateOutputs.outputs.find(
    (record) => record.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION"
  );
  const failureRecords = stateOutputs.outputs.filter(
    (record) => record.scenarioType !== "SUCCESSFUL_SESSION_INITIALIZATION"
  );

  const checks = [
    {
      name: "readiness_verification_performed",
      ok:
        inputs.startValidation.status === "pass" &&
        successRecord?.readinessVerification === "PASS"
    },
    {
      name: "authorization_checks_applied",
      ok:
        successRecord?.authorizationCheck === "PASS" &&
        failureRecords.some((record) => record.authorizationCheck === "FAIL")
    },
    {
      name: "session_state_transitions_valid",
      ok:
        inputs.controlSpecification.allowedTransitions.some(
          (transition) =>
            transition.from === "NOT_STARTED" &&
            transition.to === "PRE_SESSION_CAPTURE_READY"
        ) &&
        failureRecords.every((record) => record.stateTransition.to === "INVALID_SESSION")
    },
    {
      name: "pre_session_capture_and_audit_initialization_defined",
      ok:
        successRecord?.preSessionCapture === "CAPTURED" &&
        successRecord?.auditInitialization.includes("PRE_SESSION_CAPTURED") &&
        failureRecords.every((record) => record.blockedFailureBehaviour === true)
    },
    {
      name: "telemetry_initialization_defined",
      ok:
        telemetryOutputs.outputs.length === 4 &&
        telemetryOutputs.outputs.some(
          (output) =>
            output.scenarioType === "SUCCESSFUL_SESSION_INITIALIZATION" &&
            output.telemetryId === "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY"
        )
    },
    {
      name: "blocked_failure_behaviour_preserved",
      ok: failureRecords.length === 3 && failureRecords.every((record) => record.blockedFailureBehaviour)
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.monitoringValidation.status === "pass" &&
        telemetryOutputs.outputs.every(
          (output) =>
            output.runtimeFlags.runtimeExecutionEnabled === false &&
            output.runtimeFlags.mapAttachmentAllowed === false &&
            output.runtimeFlags.automaticRendererExecutionAllowed === false
        )
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_VALIDATION_001",
      harness.deterministicFingerprint,
      stateOutputs.deterministicFingerprint,
      telemetryOutputs.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, harness) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_LIFECYCLE_001",
    simulationId: harness.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "INITIALIZATION_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "INITIALIZATION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_LIFECYCLE_001",
      validation.status,
      harness.simulationId,
      SIMULATION_DATE
    )
  });
}

function buildReport(harness, stateOutputs, telemetryOutputs, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION INITIALIZATION SIMULATION

## Goal

Create a data-only simulation of the future developer-only Atlas session initialization flow.

## Simulation

- simulation id: ${harness.simulationId}
- recorded on: ${harness.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Scenarios

${harness.scenarios
  .map((scenario) => `- ${scenario.scenarioType}: ${scenario.expectedOutcome}`)
  .join("\n")}

## Session State Outputs

${stateOutputs.outputs
  .map(
    (record) =>
      `- ${record.scenarioType}: ${record.stateTransition.from} -> ${record.stateTransition.to}`
  )
  .join("\n")}

## Telemetry Initialization

${telemetryOutputs.outputs
  .map((record) => `- ${record.scenarioType}: ${record.telemetryId}`)
  .join("\n")}

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

## Initialization Readiness

Developer alpha initialization readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionInitializationSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const stateOutputs = buildSessionStateOutputs(inputs, harness);
  const telemetryOutputs = buildTelemetryOutputs(inputs, stateOutputs);
  const validation = buildValidation(inputs, harness, stateOutputs, telemetryOutputs);
  const lifecycle = buildLifecycle(validation, harness);
  const report = buildReport(harness, stateOutputs, telemetryOutputs, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    stateOutputs,
    telemetryOutputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionInitializationSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionInitializationSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const outputsDir = path.join(result.root, "outputs");
  const telemetryDir = path.join(result.root, "telemetry");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    outputsDir,
    telemetryDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(outputsDir, SESSION_STATES_FILENAME), result.stateOutputs);
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
  writeAtlasDeveloperAlphaSessionInitializationSimulation();
}
