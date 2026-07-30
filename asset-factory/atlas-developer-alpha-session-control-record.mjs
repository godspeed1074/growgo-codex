import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const CONTROL_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001";

const SPECIFICATION_FILENAME =
  "atlas-developer-alpha-session-control-specification.json";
const STATE_MACHINE_FILENAME =
  "atlas-developer-alpha-session-state-machine-schema.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-control-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-control-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-session-control-architecture-report.md";

const RECORD_FRAMEWORK_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
const RECORD_FRAMEWORK_SCHEMA_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/schema/atlas-developer-alpha-session-event-schema.json";
const RECORD_FRAMEWORK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/validation/atlas-developer-alpha-session-record-validation.json";
const PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";

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
    recordFrameworkSpecification: readJson(cwd, RECORD_FRAMEWORK_SPECIFICATION_PATH),
    recordFrameworkSchema: readJson(cwd, RECORD_FRAMEWORK_SCHEMA_PATH),
    recordFrameworkValidation: readJson(cwd, RECORD_FRAMEWORK_VALIDATION_PATH),
    preparationRecord: readJson(cwd, PREPARATION_RECORD_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH)
  });
}

function buildSessionControlSpecification(inputs) {
  const emergencyTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );
  const warningTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "BUDGET_WARNING"
  );
  const rollbackTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "RECIPE_FALLBACK_EVENT"
  );

  const sessionStates = [
    "NOT_STARTED",
    "PRE_SESSION_CAPTURE_READY",
    "ACTIVE_MANUAL_REVIEW",
    "PAUSED_FOR_REVIEW",
    "ROLLBACK_IN_PROGRESS",
    "EMERGENCY_STOPPED",
    "COMPLETED",
    "INVALID_SESSION"
  ];

  const allowedTransitions = [
    ["NOT_STARTED", "PRE_SESSION_CAPTURE_READY"],
    ["PRE_SESSION_CAPTURE_READY", "ACTIVE_MANUAL_REVIEW"],
    ["ACTIVE_MANUAL_REVIEW", "PAUSED_FOR_REVIEW"],
    ["PAUSED_FOR_REVIEW", "ACTIVE_MANUAL_REVIEW"],
    ["ACTIVE_MANUAL_REVIEW", "ROLLBACK_IN_PROGRESS"],
    ["PAUSED_FOR_REVIEW", "ROLLBACK_IN_PROGRESS"],
    ["ACTIVE_MANUAL_REVIEW", "EMERGENCY_STOPPED"],
    ["PAUSED_FOR_REVIEW", "EMERGENCY_STOPPED"],
    ["ROLLBACK_IN_PROGRESS", "COMPLETED"],
    ["ACTIVE_MANUAL_REVIEW", "COMPLETED"],
    ["PRE_SESSION_CAPTURE_READY", "INVALID_SESSION"],
    ["ACTIVE_MANUAL_REVIEW", "INVALID_SESSION"],
    ["PAUSED_FOR_REVIEW", "INVALID_SESSION"]
  ];

  const blockedTransitions = [
    ["NOT_STARTED", "COMPLETED"],
    ["NOT_STARTED", "ACTIVE_MANUAL_REVIEW"],
    ["PRE_SESSION_CAPTURE_READY", "COMPLETED"],
    ["COMPLETED", "ACTIVE_MANUAL_REVIEW"],
    ["EMERGENCY_STOPPED", "ACTIVE_MANUAL_REVIEW"],
    ["EMERGENCY_STOPPED", "COMPLETED"],
    ["INVALID_SESSION", "ACTIVE_MANUAL_REVIEW"]
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_SPECIFICATION_001",
    controlId: "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001",
    recordedOn: RECORD_DATE,
    sessionStates,
    allowedTransitions: allowedTransitions.map(([from, to]) => ({ from, to })),
    blockedTransitions: blockedTransitions.map(([from, to]) => ({ from, to })),
    controlEvents: [
      "OPEN_SESSION",
      "CAPTURE_PRE_SESSION_STATE",
      "BEGIN_MANUAL_REVIEW",
      "PAUSE_SESSION",
      "RESUME_SESSION",
      "REQUEST_ROLLBACK",
      "TRIGGER_EMERGENCY_STOP",
      "CLOSE_SESSION",
      "MARK_INVALID"
    ],
    pauseHandling: {
      allowedFromStates: ["ACTIVE_MANUAL_REVIEW"],
      pauseState: "PAUSED_FOR_REVIEW",
      requiredAuditEvents: ["SESSION_PAUSED", "SESSION_RESUMED"]
    },
    rollbackHandling: {
      triggerTelemetryId: rollbackTelemetry.telemetryId,
      allowedFromStates: ["ACTIVE_MANUAL_REVIEW", "PAUSED_FOR_REVIEW"],
      rollbackState: "ROLLBACK_IN_PROGRESS",
      completionState: "COMPLETED",
      owners: [
        inputs.preparationRecord.stopAuthority.primaryOwner,
        inputs.preparationRecord.stopAuthority.backupOwner
      ]
    },
    emergencyStopHandling: {
      triggerTelemetryId: emergencyTelemetry.telemetryId,
      triggerAlertState: emergencyTelemetry.alertState,
      terminalState: "EMERGENCY_STOPPED",
      restartAllowed: false
    },
    monitoringHooks: {
      warningTelemetryId: warningTelemetry.telemetryId,
      emergencyTelemetryId: emergencyTelemetry.telemetryId,
      requiredMonitoringChecklist:
        inputs.preparationRecord.monitoringPreparation.monitoringChecklist
    },
    auditEventRequirements: {
      requiredAuditEvents: [
        "SESSION_OPENED",
        "PRE_SESSION_CAPTURED",
        "SESSION_STATE_CHANGED",
        "TELEMETRY_REFERENCED",
        "ROLLBACK_RECORDED",
        "EMERGENCY_STOP_RECORDED",
        "SESSION_CLOSED"
      ],
      requiredReferences:
        inputs.recordFrameworkSpecification.auditReferences.requiredReferences
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001",
      inputs.recordFrameworkSpecification.deterministicFingerprint,
      inputs.preparationRecord.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      RECORD_DATE
    )
  });
}

function buildStateMachineSchema(inputs, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_STATE_MACHINE_SCHEMA_001",
    controlId: specification.controlId,
    states: specification.sessionStates.map((state) => ({
      state,
      terminal: ["COMPLETED", "EMERGENCY_STOPPED", "INVALID_SESSION"].includes(
        state
      ),
      requiresRuntimeDisabled: true
    })),
    transitions: {
      allowed: specification.allowedTransitions,
      blocked: specification.blockedTransitions
    },
    controlEventMap: {
      OPEN_SESSION: { from: "NOT_STARTED", to: "PRE_SESSION_CAPTURE_READY" },
      CAPTURE_PRE_SESSION_STATE: {
        from: "PRE_SESSION_CAPTURE_READY",
        to: "PRE_SESSION_CAPTURE_READY"
      },
      BEGIN_MANUAL_REVIEW: {
        from: "PRE_SESSION_CAPTURE_READY",
        to: "ACTIVE_MANUAL_REVIEW"
      },
      PAUSE_SESSION: { from: "ACTIVE_MANUAL_REVIEW", to: "PAUSED_FOR_REVIEW" },
      RESUME_SESSION: { from: "PAUSED_FOR_REVIEW", to: "ACTIVE_MANUAL_REVIEW" },
      REQUEST_ROLLBACK: {
        from: ["ACTIVE_MANUAL_REVIEW", "PAUSED_FOR_REVIEW"],
        to: "ROLLBACK_IN_PROGRESS"
      },
      TRIGGER_EMERGENCY_STOP: {
        from: ["ACTIVE_MANUAL_REVIEW", "PAUSED_FOR_REVIEW"],
        to: "EMERGENCY_STOPPED"
      },
      CLOSE_SESSION: {
        from: ["ACTIVE_MANUAL_REVIEW", "ROLLBACK_IN_PROGRESS"],
        to: "COMPLETED"
      },
      MARK_INVALID: {
        from: [
          "PRE_SESSION_CAPTURE_READY",
          "ACTIVE_MANUAL_REVIEW",
          "PAUSED_FOR_REVIEW"
        ],
        to: "INVALID_SESSION"
      }
    },
    auditRequirements: specification.auditEventRequirements,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_STATE_MACHINE_SCHEMA_001",
      specification.deterministicFingerprint,
      JSON.stringify(specification.allowedTransitions),
      JSON.stringify(specification.blockedTransitions)
    )
  });
}

function buildValidation(inputs, specification, stateMachine) {
  const allowedPairs = new Set(
    specification.allowedTransitions.map(({ from, to }) => `${from}->${to}`)
  );
  const blockedPairs = new Set(
    specification.blockedTransitions.map(({ from, to }) => `${from}->${to}`)
  );

  const checks = [
    {
      name: "record_framework_supports_control_record",
      ok:
        inputs.recordFrameworkValidation.status === "pass" &&
        inputs.recordFrameworkSpecification.sessionEventLogging.eventSequence
          .length >= 7
    },
    {
      name: "session_states_and_control_events_defined",
      ok:
        specification.sessionStates.length >= 8 &&
        specification.controlEvents.length >= 9
    },
    {
      name: "allowed_and_blocked_transitions_defined",
      ok:
        specification.allowedTransitions.length >= 10 &&
        specification.blockedTransitions.length >= 6 &&
        allowedPairs.has("NOT_STARTED->PRE_SESSION_CAPTURE_READY") &&
        blockedPairs.has("NOT_STARTED->COMPLETED")
    },
    {
      name: "pause_rollback_and_emergency_stop_defined",
      ok:
        specification.pauseHandling.allowedFromStates.includes(
          "ACTIVE_MANUAL_REVIEW"
        ) &&
        specification.rollbackHandling.allowedFromStates.length >= 2 &&
        specification.emergencyStopHandling.terminalState ===
          "EMERGENCY_STOPPED"
    },
    {
      name: "audit_event_requirements_defined",
      ok:
        specification.auditEventRequirements.requiredAuditEvents.length >= 7 &&
        specification.auditEventRequirements.requiredReferences.length >= 3
    },
    {
      name: "monitoring_hooks_and_transition_schema_defined",
      ok:
        specification.monitoringHooks.requiredMonitoringChecklist.length >= 5 &&
        stateMachine.states.length === specification.sessionStates.length &&
        Object.keys(stateMachine.controlEventMap).length >= 9 &&
        inputs.monitoringValidation.status === "pass"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.preparationRecord.featureFlagSnapshot.runtimeExecutionEnabled ===
          false &&
        inputs.preparationRecord.featureFlagSnapshot.mapAttachmentAllowed ===
          false &&
        inputs.preparationRecord.featureFlagSnapshot
          .automaticRendererExecutionAllowed === false &&
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
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_VALIDATION_001",
    controlId: specification.controlId,
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_VALIDATION_001",
      specification.deterministicFingerprint,
      stateMachine.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_LIFECYCLE_001",
    controlId: specification.controlId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_CONTROL_RECORDING"
        : "DEVELOPER_ALPHA_SESSION_CONTROL_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_LIFECYCLE_001",
      validation.status,
      specification.controlId,
      RECORD_DATE
    )
  });
}

function buildReport(specification, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION CONTROL RECORD

## Goal

Define the safe session state machine and control record for a future developer-only Atlas alpha session.

## Control Record

- control id: ${specification.controlId}
- recorded on: ${specification.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Coverage

- session states
- allowed transitions
- blocked transitions
- control events
- pause handling
- rollback handling
- emergency stop handling
- audit event requirements

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

Developer alpha session control readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_CONTROL_RECORDING"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionControlRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const specification = buildSessionControlSpecification(inputs);
  const stateMachine = buildStateMachineSchema(inputs, specification);
  const validation = buildValidation(inputs, specification, stateMachine);
  const lifecycle = buildLifecycle(validation, specification);
  const report = buildReport(specification, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, CONTROL_ROOT),
    specification,
    stateMachine,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionControlRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionControlRecord({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const schemaDir = path.join(result.root, "schema");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    schemaDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    result.specification
  );
  writeJson(path.join(schemaDir, STATE_MACHINE_FILENAME), result.stateMachine);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionControlRecord();
}
