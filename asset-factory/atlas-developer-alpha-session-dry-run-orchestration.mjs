import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const ORCHESTRATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001";

const HARNESS_FILENAME =
  "atlas-developer-alpha-orchestration-simulation-harness.json";
const SESSION_OUTPUTS_FILENAME =
  "atlas-developer-alpha-session-lifecycle-outputs.json";
const TELEMETRY_OUTPUTS_FILENAME =
  "atlas-developer-alpha-orchestration-telemetry-records.json";
const AUDIT_OUTPUTS_FILENAME =
  "atlas-developer-alpha-orchestration-audit-records.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-orchestration-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-orchestration-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-orchestration-report.md";

const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";
const CONTROL_SCHEMA_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/schema/atlas-developer-alpha-session-state-machine-schema.json";
const CONTROL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/validation/atlas-developer-alpha-session-control-validation.json";
const RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
const RECORD_SCHEMA_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/schema/atlas-developer-alpha-session-event-schema.json";
const RECORD_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/validation/atlas-developer-alpha-session-record-validation.json";
const PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";
const REHEARSAL_SESSIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/sessions/atlas-developer-alpha-simulated-session-records.json";
const REHEARSAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/validation/atlas-developer-alpha-rehearsal-validation.json";

const RECORD_DATE = "2026-07-30";
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
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH),
    controlSchema: readJson(cwd, CONTROL_SCHEMA_PATH),
    controlValidation: readJson(cwd, CONTROL_VALIDATION_PATH),
    recordSpecification: readJson(cwd, RECORD_SPECIFICATION_PATH),
    recordSchema: readJson(cwd, RECORD_SCHEMA_PATH),
    recordValidation: readJson(cwd, RECORD_VALIDATION_PATH),
    preparationRecord: readJson(cwd, PREPARATION_RECORD_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH),
    rehearsalSessions: readJson(cwd, REHEARSAL_SESSIONS_PATH),
    rehearsalValidation: readJson(cwd, REHEARSAL_VALIDATION_PATH)
  });
}

function findTelemetry(inputs, telemetryId) {
  return inputs.monitoringTelemetry.records.find(
    (record) => record.telemetryId === telemetryId
  );
}

function allowedTransitionSet(controlSpecification) {
  return new Set(
    controlSpecification.allowedTransitions.map(({ from, to }) => `${from}->${to}`)
  );
}

function assertAllowed(set, from, to) {
  if (!set.has(`${from}->${to}`)) {
    throw new Error(`Missing allowed transition ${from} -> ${to}`);
  }
}

function buildHarness(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_SIMULATION_HARNESS_001",
    orchestrationId: "ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001",
    recordedOn: RECORD_DATE,
    references: {
      controlId: inputs.controlSpecification.controlId,
      recordFrameworkId: inputs.recordSpecification.frameworkId,
      preparationId: inputs.preparationRecord.preparationId,
      monitoringSimulationId: inputs.monitoringTelemetry.simulationId,
      rehearsalSimulationId: inputs.rehearsalSessions.simulationId
    },
    scenarios: [
      "SESSION_INITIALIZATION",
      "PREPARATION_VALIDATION",
      "SESSION_START",
      "HEALTHY_OPERATION",
      "WARNING_EVENT",
      "ROLLBACK_EVENT",
      "SESSION_COMPLETION",
      "REVIEW_COMPLETION"
    ],
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001",
      inputs.controlSpecification.deterministicFingerprint,
      inputs.recordSpecification.deterministicFingerprint,
      inputs.preparationRecord.deterministicFingerprint,
      RECORD_DATE
    )
  });
}

function buildSessionLifecycleOutputs(inputs, harness) {
  const transitions = allowedTransitionSet(inputs.controlSpecification);
  const outputs = [];

  const steps = [
    {
      stepId: "SESSION_INITIALIZATION",
      eventType: "OPEN_SESSION",
      fromState: "NOT_STARTED",
      toState: "PRE_SESSION_CAPTURE_READY",
      outcome: "initialized"
    },
    {
      stepId: "PREPARATION_VALIDATION",
      eventType: "CAPTURE_PRE_SESSION_STATE",
      fromState: "PRE_SESSION_CAPTURE_READY",
      toState: "PRE_SESSION_CAPTURE_READY",
      outcome: "preparation_validated"
    },
    {
      stepId: "SESSION_START",
      eventType: "BEGIN_MANUAL_REVIEW",
      fromState: "PRE_SESSION_CAPTURE_READY",
      toState: "ACTIVE_MANUAL_REVIEW",
      outcome: "manual_review_started"
    },
    {
      stepId: "HEALTHY_OPERATION",
      eventType: "MONITORING_SIGNAL_OBSERVED",
      fromState: "ACTIVE_MANUAL_REVIEW",
      toState: "ACTIVE_MANUAL_REVIEW",
      outcome: "healthy_monitoring_observed"
    },
    {
      stepId: "WARNING_EVENT",
      eventType: "MONITORING_SIGNAL_OBSERVED",
      fromState: "ACTIVE_MANUAL_REVIEW",
      toState: "PAUSED_FOR_REVIEW",
      outcome: "warning_recorded_and_paused"
    },
    {
      stepId: "ROLLBACK_EVENT",
      eventType: "REQUEST_ROLLBACK",
      fromState: "PAUSED_FOR_REVIEW",
      toState: "ROLLBACK_IN_PROGRESS",
      outcome: "rollback_started"
    },
    {
      stepId: "SESSION_COMPLETION",
      eventType: "CLOSE_SESSION",
      fromState: "ROLLBACK_IN_PROGRESS",
      toState: "COMPLETED",
      outcome: "session_closed_after_rollback"
    },
    {
      stepId: "REVIEW_COMPLETION",
      eventType: "POST_SESSION_REVIEW_COMPLETED",
      fromState: "COMPLETED",
      toState: "COMPLETED",
      outcome: "review_complete"
    }
  ];

  for (const step of steps) {
    if (step.fromState !== step.toState) {
      assertAllowed(transitions, step.fromState, step.toState);
    }

    outputs.push(
      deepFreeze({
        schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_STEP_OUTPUT_001",
        stepId: step.stepId,
        eventType: step.eventType,
        fromState: step.fromState,
        toState: step.toState,
        outcome: step.outcome,
        runtimeFlags: {
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        deterministicFingerprint: hashHex(
          step.stepId,
          step.eventType,
          step.fromState,
          step.toState,
          step.outcome
        )
      })
    );
  }

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_SESSION_OUTPUT_SET_001",
    orchestrationId: harness.orchestrationId,
    outputs,
    deterministicFingerprint: hashHex(
      harness.orchestrationId,
      JSON.stringify(outputs.map((entry) => entry.deterministicFingerprint))
    )
  });
}

function buildTelemetryOutputs(inputs, harness) {
  const telemetryIds = [
    "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
    "RUNTIME_MONITORING_BUDGET_WARNING_001_TELEMETRY",
    "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY"
  ];

  const records = telemetryIds.map((telemetryId) => {
    const telemetry = findTelemetry(inputs, telemetryId);
    return deepFreeze({
      schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_TELEMETRY_OUTPUT_001",
      telemetryId: telemetry.telemetryId,
      scenarioType: telemetry.scenarioType,
      healthState: telemetry.healthState,
      alertState: telemetry.alertState,
      rollbackSignal: telemetry.rollbackSignal,
      reasonCode: telemetry.reasonCode,
      packageId: telemetry.packageId,
      regionId: telemetry.regionId,
      recipeResolution: telemetry.recipeResolution,
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      deterministicFingerprint: hashHex(
        telemetry.telemetryId,
        telemetry.healthState,
        telemetry.alertState,
        telemetry.rollbackSignal,
        telemetry.deterministicFingerprint
      )
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_TELEMETRY_SET_001",
    orchestrationId: harness.orchestrationId,
    records,
    deterministicFingerprint: hashHex(
      harness.orchestrationId,
      JSON.stringify(records.map((record) => record.deterministicFingerprint))
    )
  });
}

function buildAuditOutputs(inputs, harness, sessionLifecycleOutputs, telemetryOutputs) {
  const auditEvents = [
    {
      auditId: "ORCH_AUDIT_SESSION_OPENED_001",
      auditEvent: "SESSION_OPENED",
      relatedStepId: "SESSION_INITIALIZATION"
    },
    {
      auditId: "ORCH_AUDIT_PRE_SESSION_CAPTURED_001",
      auditEvent: "PRE_SESSION_CAPTURED",
      relatedStepId: "PREPARATION_VALIDATION"
    },
    {
      auditId: "ORCH_AUDIT_STATE_CHANGE_001",
      auditEvent: "SESSION_STATE_CHANGED",
      relatedStepId: "SESSION_START"
    },
    {
      auditId: "ORCH_AUDIT_TELEMETRY_REFERENCED_001",
      auditEvent: "TELEMETRY_REFERENCED",
      relatedStepId: "HEALTHY_OPERATION"
    },
    {
      auditId: "ORCH_AUDIT_ROLLBACK_RECORDED_001",
      auditEvent: "ROLLBACK_RECORDED",
      relatedStepId: "ROLLBACK_EVENT"
    },
    {
      auditId: "ORCH_AUDIT_SESSION_CLOSED_001",
      auditEvent: "SESSION_CLOSED",
      relatedStepId: "SESSION_COMPLETION"
    }
  ].map((event) =>
    deepFreeze({
      schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_AUDIT_RECORD_001",
      ...event,
      references: {
        finalCheckReference: "ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001",
        preparationReference: inputs.preparationRecord.preparationId,
        monitoringReference: inputs.monitoringTelemetry.simulationId
      },
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      deterministicFingerprint: hashHex(
        event.auditId,
        event.auditEvent,
        event.relatedStepId,
        harness.orchestrationId
      )
    })
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_AUDIT_SET_001",
    orchestrationId: harness.orchestrationId,
    records: auditEvents,
    summary: {
      sessionSteps: sessionLifecycleOutputs.outputs.length,
      telemetryRecords: telemetryOutputs.records.length,
      auditEvents: auditEvents.length
    },
    deterministicFingerprint: hashHex(
      harness.orchestrationId,
      JSON.stringify(auditEvents.map((record) => record.deterministicFingerprint))
    )
  });
}

function buildValidation(
  inputs,
  harness,
  sessionLifecycleOutputs,
  telemetryOutputs,
  auditOutputs
) {
  const finalState =
    sessionLifecycleOutputs.outputs[sessionLifecycleOutputs.outputs.length - 1]?.toState;
  const rollbackStep = sessionLifecycleOutputs.outputs.find(
    (step) => step.stepId === "ROLLBACK_EVENT"
  );
  const warningTelemetry = telemetryOutputs.records.find(
    (record) => record.scenarioType === "BUDGET_WARNING"
  );
  const rollbackTelemetry = telemetryOutputs.records.find(
    (record) => record.scenarioType === "RECIPE_FALLBACK_EVENT"
  );

  const checks = [
    {
      name: "state_transitions_valid",
      ok:
        inputs.controlValidation.status === "pass" &&
        sessionLifecycleOutputs.outputs.length === 8 &&
        finalState === "COMPLETED"
    },
    {
      name: "event_recording_complete",
      ok:
        inputs.recordValidation.status === "pass" &&
        auditOutputs.records.length >= 6
    },
    {
      name: "telemetry_flow_complete",
      ok:
        telemetryOutputs.records.length === 3 &&
        warningTelemetry?.healthState === "WARNING" &&
        rollbackTelemetry?.rollbackSignal === "FALLBACK_TO_APPROVED_RECIPE_PATH"
    },
    {
      name: "monitoring_outputs_preserved",
      ok:
        inputs.monitoringValidation.status === "pass" &&
        telemetryOutputs.records.every(
          (record) =>
            record.runtimeFlags.runtimeExecutionEnabled === false &&
            record.runtimeFlags.mapAttachmentAllowed === false &&
            record.runtimeFlags.automaticRendererExecutionAllowed === false
        )
    },
    {
      name: "rollback_behaviour_recorded",
      ok:
        rollbackStep?.toState === "ROLLBACK_IN_PROGRESS" &&
        auditOutputs.records.some(
          (record) => record.auditEvent === "ROLLBACK_RECORDED"
        ) &&
        inputs.rehearsalValidation.status === "pass"
    },
    {
      name: "audit_completeness_preserved",
      ok:
        auditOutputs.records.some((record) => record.auditEvent === "SESSION_OPENED") &&
        auditOutputs.records.some((record) => record.auditEvent === "SESSION_CLOSED") &&
        auditOutputs.records.some(
          (record) => record.auditEvent === "TELEMETRY_REFERENCED"
        )
    },
    {
      name: "blocked_runtime_state_preserved",
      ok:
        inputs.preparationRecord.featureFlagSnapshot.runtimeExecutionEnabled === false &&
        inputs.preparationRecord.featureFlagSnapshot.mapAttachmentAllowed === false &&
        inputs.preparationRecord.featureFlagSnapshot.automaticRendererExecutionAllowed ===
          false &&
        inputs.monitoringValidation.runtimeExecutionEnabled === false &&
        inputs.monitoringValidation.mapAttachmentAllowed === false &&
        inputs.monitoringValidation.automaticRendererExecutionAllowed === false &&
        inputs.monitoringValidation.rendererAttachmentAuthorized === false &&
        inputs.monitoringValidation.mapDownloadsAuthorized === false &&
        inputs.monitoringValidation.blenderAuthorized === false &&
        inputs.monitoringValidation.glbAuthorized === false &&
        inputs.monitoringValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_VALIDATION_001",
    orchestrationId: harness.orchestrationId,
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
      "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_VALIDATION_001",
      harness.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, harness) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_LIFECYCLE_001",
    orchestrationId: harness.orchestrationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_DRY_RUN_ORCHESTRATION_REVIEW"
        : "DEVELOPER_ALPHA_DRY_RUN_ORCHESTRATION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_ORCHESTRATION_LIFECYCLE_001",
      validation.status,
      harness.orchestrationId,
      RECORD_DATE
    )
  });
}

function buildReport(harness, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION DRY RUN ORCHESTRATION

## Goal

Create a data-only orchestration simulation combining the Atlas developer alpha preparation, control, recording, and monitoring systems.

## Orchestration

- orchestration id: ${harness.orchestrationId}
- recorded on: ${harness.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Coverage

- session initialization
- preparation validation
- session start
- healthy operation
- warning event
- rollback event
- session completion
- review completion

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

## Readiness

Developer alpha orchestration readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_DRY_RUN_ORCHESTRATION_REVIEW"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionDryRunOrchestration({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const sessionLifecycleOutputs = buildSessionLifecycleOutputs(inputs, harness);
  const telemetryOutputs = buildTelemetryOutputs(inputs, harness);
  const auditOutputs = buildAuditOutputs(
    inputs,
    harness,
    sessionLifecycleOutputs,
    telemetryOutputs
  );
  const validation = buildValidation(
    inputs,
    harness,
    sessionLifecycleOutputs,
    telemetryOutputs,
    auditOutputs
  );
  const lifecycle = buildLifecycle(validation, harness);
  const report = buildReport(harness, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, ORCHESTRATION_ROOT),
    harness,
    sessionLifecycleOutputs,
    telemetryOutputs,
    auditOutputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionDryRunOrchestration({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionDryRunOrchestration({ cwd });
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
  writeJson(path.join(outputsDir, SESSION_OUTPUTS_FILENAME), result.sessionLifecycleOutputs);
  writeJson(path.join(telemetryDir, TELEMETRY_OUTPUTS_FILENAME), result.telemetryOutputs);
  writeJson(path.join(auditDir, AUDIT_OUTPUTS_FILENAME), result.auditOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionDryRunOrchestration();
}
