import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001";

const HARNESS_FILENAME = "atlas-developer-alpha-session-operational-harness.json";
const SESSION_STATES_FILENAME =
  "atlas-developer-alpha-session-operational-state-outputs.json";
const TELEMETRY_FILENAME =
  "atlas-developer-alpha-session-operational-telemetry-records.json";
const AUDIT_FILENAME = "atlas-developer-alpha-session-operational-audit-records.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-operational-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-operational-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-session-operational-report.md";

const INITIALIZATION_STATES_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-initialization/ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001/outputs/atlas-developer-alpha-session-initialization-state-outputs.json";
const INITIALIZATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-initialization/ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001/validation/atlas-developer-alpha-session-initialization-validation.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";
const RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
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
    initializationStates: readJson(cwd, INITIALIZATION_STATES_PATH),
    initializationValidation: readJson(cwd, INITIALIZATION_VALIDATION_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH),
    recordSpecification: readJson(cwd, RECORD_SPECIFICATION_PATH),
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
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_HARNESS_001",
    simulationId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001",
    recordedOn: SIMULATION_DATE,
    initializationReference: inputs.initializationStates.simulationId,
    controlReference: inputs.controlSpecification.controlId,
    recordFrameworkReference: inputs.recordSpecification.frameworkId,
    monitoringReference: inputs.monitoringTelemetry.simulationId,
    phases: [
      "enter_active_review_state",
      "normal_operation",
      "warning_event",
      "recipe_fallback_event",
      "pause_resume_flow",
      "rollback_flow",
      "session_completion"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_HARNESS_001",
      inputs.initializationStates.deterministicFingerprint,
      inputs.controlSpecification.deterministicFingerprint,
      inputs.recordSpecification.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      SIMULATION_DATE
    )
  });
}

function buildStateOutputs(inputs, harness) {
  const outputs = [
    {
      phaseId: "ENTER_ACTIVE_REVIEW_STATE",
      phaseType: "enter_active_review_state",
      stateTransition: {
        from: "PRE_SESSION_CAPTURE_READY",
        event: "BEGIN_MANUAL_REVIEW",
        to: "ACTIVE_MANUAL_REVIEW"
      },
      telemetryReference: "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
      auditEvents: ["SESSION_STATE_CHANGED", "TELEMETRY_REFERENCED"],
      pauseTriggered: false,
      rollbackTriggered: false,
      completionTriggered: false
    },
    {
      phaseId: "NORMAL_OPERATION",
      phaseType: "normal_operation",
      stateTransition: {
        from: "ACTIVE_MANUAL_REVIEW",
        event: "MONITORING_SIGNAL_OBSERVED",
        to: "ACTIVE_MANUAL_REVIEW"
      },
      telemetryReference: "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
      auditEvents: ["COORDINATE_LOOKUP_NOTED", "MONITORING_SIGNAL_OBSERVED"],
      pauseTriggered: false,
      rollbackTriggered: false,
      completionTriggered: false
    },
    {
      phaseId: "WARNING_EVENT",
      phaseType: "warning_event",
      stateTransition: {
        from: "ACTIVE_MANUAL_REVIEW",
        event: "PAUSE_SESSION",
        to: "PAUSED_FOR_REVIEW"
      },
      telemetryReference: "RUNTIME_MONITORING_BUDGET_WARNING_001_TELEMETRY",
      auditEvents: ["MONITORING_SIGNAL_OBSERVED", "SESSION_PAUSED"],
      pauseTriggered: true,
      rollbackTriggered: false,
      completionTriggered: false
    },
    {
      phaseId: "RECIPE_FALLBACK_EVENT",
      phaseType: "recipe_fallback_event",
      stateTransition: {
        from: "PAUSED_FOR_REVIEW",
        event: "RESUME_SESSION",
        to: "ACTIVE_MANUAL_REVIEW"
      },
      telemetryReference: "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY",
      auditEvents: ["SESSION_RESUMED", "TELEMETRY_REFERENCED"],
      pauseTriggered: false,
      rollbackTriggered: false,
      completionTriggered: false
    },
    {
      phaseId: "PAUSE_RESUME_FLOW",
      phaseType: "pause_resume_flow",
      stateTransition: {
        from: "ACTIVE_MANUAL_REVIEW",
        event: "PAUSE_SESSION",
        to: "PAUSED_FOR_REVIEW"
      },
      resumeTransition: {
        from: "PAUSED_FOR_REVIEW",
        event: "RESUME_SESSION",
        to: "ACTIVE_MANUAL_REVIEW"
      },
      telemetryReference: "RUNTIME_MONITORING_BUDGET_WARNING_001_TELEMETRY",
      auditEvents: ["SESSION_PAUSED", "SESSION_RESUMED"],
      pauseTriggered: true,
      rollbackTriggered: false,
      completionTriggered: false
    },
    {
      phaseId: "ROLLBACK_FLOW",
      phaseType: "rollback_flow",
      stateTransition: {
        from: "ACTIVE_MANUAL_REVIEW",
        event: "REQUEST_ROLLBACK",
        to: "ROLLBACK_IN_PROGRESS"
      },
      telemetryReference: "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY",
      auditEvents: ["ROLLBACK_RECORDED", "SESSION_STATE_CHANGED"],
      pauseTriggered: false,
      rollbackTriggered: true,
      completionTriggered: false
    },
    {
      phaseId: "SESSION_COMPLETION",
      phaseType: "session_completion",
      stateTransition: {
        from: "ROLLBACK_IN_PROGRESS",
        event: "CLOSE_SESSION",
        to: "COMPLETED"
      },
      telemetryReference: "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
      auditEvents: ["SESSION_CLOSED"],
      pauseTriggered: false,
      rollbackTriggered: false,
      completionTriggered: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_STATE_OUTPUTS_001",
    simulationId: harness.simulationId,
    outputs,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_STATE_OUTPUTS_001",
      harness.deterministicFingerprint,
      JSON.stringify(outputs)
    )
  });
}

function buildTelemetryOutputs(inputs, stateOutputs) {
  const outputs = stateOutputs.outputs.map((phase) => {
    const record = monitoringRecordById(inputs, phase.telemetryReference);
    return {
      phaseId: phase.phaseId,
      phaseType: phase.phaseType,
      telemetryId: record.telemetryId,
      healthState: record.healthState,
      alertState: record.alertState,
      rollbackSignal: record.rollbackSignal,
      recipeResolution: record.recipeResolution,
      continuityState: "CONTIGUOUS_MONITORING_FLOW",
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      }
    };
  });

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_TELEMETRY_OUTPUTS_001",
    simulationId: stateOutputs.simulationId,
    outputs,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_TELEMETRY_OUTPUTS_001",
      stateOutputs.deterministicFingerprint,
      JSON.stringify(outputs)
    )
  });
}

function buildAuditOutputs(inputs, stateOutputs) {
  const records = [];
  let eventCounter = 1;

  for (const phase of stateOutputs.outputs) {
    for (const eventType of phase.auditEvents) {
      records.push({
        eventId: `ATLAS_ALPHA_OPERATIONAL_AUDIT_${String(eventCounter).padStart(3, "0")}`,
        phaseId: phase.phaseId,
        eventType,
        actorRole:
          eventType === "ROLLBACK_RECORDED"
            ? "atlas_operator"
            : "internal_developer_reviewer",
        summary: `${phase.phaseType}:${eventType}`,
        safetyFlags: {
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        auditReferences: inputs.recordSpecification.auditReferences.requiredReferences
      });
      eventCounter += 1;
    }
  }

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_AUDIT_OUTPUTS_001",
    simulationId: stateOutputs.simulationId,
    records,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_AUDIT_OUTPUTS_001",
      stateOutputs.deterministicFingerprint,
      JSON.stringify(records)
    )
  });
}

function buildValidation(inputs, harness, stateOutputs, telemetryOutputs, auditOutputs) {
  const transitions = inputs.controlSpecification.allowedTransitions;
  const hasTransition = (from, to) =>
    transitions.some((transition) => transition.from === from && transition.to === to);

  const checks = [
    {
      name: "operational_state_transitions_valid",
      ok:
        hasTransition("PRE_SESSION_CAPTURE_READY", "ACTIVE_MANUAL_REVIEW") &&
        hasTransition("ACTIVE_MANUAL_REVIEW", "PAUSED_FOR_REVIEW") &&
        hasTransition("PAUSED_FOR_REVIEW", "ACTIVE_MANUAL_REVIEW") &&
        hasTransition("ACTIVE_MANUAL_REVIEW", "ROLLBACK_IN_PROGRESS") &&
        hasTransition("ROLLBACK_IN_PROGRESS", "COMPLETED")
    },
    {
      name: "telemetry_continuity_preserved",
      ok:
        telemetryOutputs.outputs.length === 7 &&
        telemetryOutputs.outputs.every(
          (output) => output.continuityState === "CONTIGUOUS_MONITORING_FLOW"
        )
    },
    {
      name: "audit_completeness_preserved",
      ok:
        auditOutputs.records.some((record) => record.eventType === "SESSION_CLOSED") &&
        auditOutputs.records.some((record) => record.eventType === "ROLLBACK_RECORDED") &&
        auditOutputs.records.some((record) => record.eventType === "SESSION_PAUSED") &&
        auditOutputs.records.some((record) => record.eventType === "SESSION_RESUMED")
    },
    {
      name: "warning_and_fallback_handling_defined",
      ok:
        stateOutputs.outputs.some(
          (phase) =>
            phase.phaseType === "warning_event" && phase.stateTransition.to === "PAUSED_FOR_REVIEW"
        ) &&
        stateOutputs.outputs.some(
          (phase) =>
            phase.phaseType === "recipe_fallback_event" &&
            phase.telemetryReference === "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY"
        )
    },
    {
      name: "rollback_and_completion_workflow_defined",
      ok:
        stateOutputs.outputs.some(
          (phase) =>
            phase.phaseType === "rollback_flow" &&
            phase.stateTransition.to === "ROLLBACK_IN_PROGRESS" &&
            phase.rollbackTriggered === true
        ) &&
        stateOutputs.outputs.some(
          (phase) =>
            phase.phaseType === "session_completion" &&
            phase.stateTransition.to === "COMPLETED" &&
            phase.completionTriggered === true
        )
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.initializationValidation.status === "pass" &&
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
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_VALIDATION_001",
      harness.deterministicFingerprint,
      stateOutputs.deterministicFingerprint,
      telemetryOutputs.deterministicFingerprint,
      auditOutputs.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, harness) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_LIFECYCLE_001",
    simulationId: harness.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "OPERATIONAL_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "OPERATIONAL_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_LIFECYCLE_001",
      validation.status,
      harness.simulationId,
      SIMULATION_DATE
    )
  });
}

function buildReport(harness, stateOutputs, telemetryOutputs, auditOutputs, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION OPERATIONAL SIMULATION

## Goal

Create a data-only simulation of the active operational period of the future developer-only Atlas alpha session.

## Simulation

- simulation id: ${harness.simulationId}
- recorded on: ${harness.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Operational Phases

${harness.phases.map((phase) => `- ${phase}`).join("\n")}

## Session State Outputs

${stateOutputs.outputs
  .map((phase) => `- ${phase.phaseType}: ${phase.stateTransition.from} -> ${phase.stateTransition.to}`)
  .join("\n")}

## Telemetry Continuity

${telemetryOutputs.outputs
  .map((phase) => `- ${phase.phaseType}: ${phase.telemetryId}`)
  .join("\n")}

## Audit Trail

- audit records: ${auditOutputs.records.length}
- includes pause/resume: ${auditOutputs.records.some((record) => record.eventType === "SESSION_PAUSED")}
- includes rollback: ${auditOutputs.records.some((record) => record.eventType === "ROLLBACK_RECORDED")}
- includes close: ${auditOutputs.records.some((record) => record.eventType === "SESSION_CLOSED")}

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

## Operational Readiness

Developer alpha operational readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionOperationalSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const stateOutputs = buildStateOutputs(inputs, harness);
  const telemetryOutputs = buildTelemetryOutputs(inputs, stateOutputs);
  const auditOutputs = buildAuditOutputs(inputs, stateOutputs);
  const validation = buildValidation(
    inputs,
    harness,
    stateOutputs,
    telemetryOutputs,
    auditOutputs
  );
  const lifecycle = buildLifecycle(validation, harness);
  const report = buildReport(
    harness,
    stateOutputs,
    telemetryOutputs,
    auditOutputs,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    stateOutputs,
    telemetryOutputs,
    auditOutputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionOperationalSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionOperationalSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const outputsDir = path.join(result.root, "outputs");
  const telemetryDir = path.join(result.root, "telemetry");
  const auditDir = path.join(result.root, "audit");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    outputsDir,
    telemetryDir,
    auditDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(outputsDir, SESSION_STATES_FILENAME), result.stateOutputs);
  writeJson(path.join(telemetryDir, TELEMETRY_FILENAME), result.telemetryOutputs);
  writeJson(path.join(auditDir, AUDIT_FILENAME), result.auditOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionOperationalSimulation();
}
