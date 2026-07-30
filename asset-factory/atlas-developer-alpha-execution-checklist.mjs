import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const EXECUTION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001";

const CHECKLIST_FILENAME = "atlas-developer-alpha-execution-checklist.json";
const RUNBOOK_FILENAME = "atlas-developer-alpha-operator-runbook.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-execution-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-execution-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-execution-report.md";

const DECISION_FRAMEWORK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001/framework/atlas-developer-alpha-decision-framework.json";
const GO_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/decision/atlas-developer-alpha-go-no-go-decision-record.json";
const GO_CONDITIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/conditions/atlas-developer-alpha-conditions-of-approval.json";
const FINAL_CHECKLIST_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/checklist/atlas-alpha-final-readiness-checklist.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_ALERTS_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/alerts/atlas-runtime-monitoring-alert-outputs.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";

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
    decisionFramework: readJson(cwd, DECISION_FRAMEWORK_PATH),
    goRecord: readJson(cwd, GO_RECORD_PATH),
    goConditions: readJson(cwd, GO_CONDITIONS_PATH),
    finalChecklist: readJson(cwd, FINAL_CHECKLIST_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringAlerts: readJson(cwd, MONITORING_ALERTS_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH)
  });
}

function buildExecutionChecklist(inputs) {
  const healthyTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION"
  );
  const shutdownTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001",
    checklistId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001",
    recordedOn: RECORD_DATE,
    preFlightChecklist: [
      "confirm go/no-go record is pass and developer-only",
      "confirm final alpha safety checklist remains all PASS",
      "confirm approved primary region matches current review target",
      "confirm rollback owner is available before session start"
    ],
    environmentVerification: [
      "runtimeExecutionEnabled remains false",
      "mapAttachmentAllowed remains false",
      "automaticRendererExecutionAllowed remains false",
      "rendererAttachmentAuthorized remains false",
      "mapDownloadsAuthorized remains false"
    ],
    operatorSteps: [
      "open developer alpha decision records and confirm scope",
      "review permitted region and expected recipe before any rehearsal",
      "perform metadata-only coordinate lookup rehearsal notes",
      "observe monitoring outputs without activating runtime",
      "record results and end session within 30-minute window"
    ],
    monitoringChecklist: [
      `healthy signal available: ${healthyTelemetry.telemetryId}`,
      "watch for package validation failure alerts",
      "watch for budget warning alerts",
      "watch for recipe fallback warning alerts",
      `watch for emergency shutdown signal: ${shutdownTelemetry.telemetryId}`
    ],
    stopConditions: inputs.decisionFramework.failureCriteria,
    rollbackProcedure: [
      `owner: ${inputs.decisionFramework.rollbackOwner.ownerRole}`,
      `backup owner: ${inputs.decisionFramework.rollbackOwner.backupRole}`,
      "return immediately to planning-only state",
      "end session if any failure criteria or emergency signal is observed"
    ],
    exitProcedure: [
      "record whether all success metrics were met",
      "record whether any stop conditions were triggered",
      "confirm runtime flags remained false throughout review",
      "close the session and archive operator notes"
    ],
    auditRequirements: [
      "retain developer-only operator notes",
      "retain monitored alert and telemetry references",
      "retain explicit go/no-go record reference",
      "retain rollback invocation note if used"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001",
      inputs.goRecord.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      RECORD_DATE
    )
  });
}

function buildOperatorRunbook(inputs, checklist) {
  const emergencyAlert = inputs.monitoringAlerts.alerts.find(
    (alert) => alert.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );
  const budgetAlert = inputs.monitoringAlerts.alerts.find(
    (alert) => alert.scenarioType === "BUDGET_WARNING"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_OPERATOR_RUNBOOK_001",
    checklistId: checklist.checklistId,
    runbookId: "ATLAS_DEVELOPER_ALPHA_OPERATOR_RUNBOOK_001",
    operatorRoles: inputs.decisionFramework.testUserBoundaries.userClasses,
    sessionMode: "MANUAL_DEVELOPER_REVIEW_ONLY",
    preFlight: checklist.preFlightChecklist,
    executionSequence: [
      {
        stepId: "VERIFY_ENVIRONMENT",
        instruction: "Verify all runtime and renderer flags remain false."
      },
      {
        stepId: "VERIFY_SCOPE",
        instruction:
          "Verify the approved region and internal-only user boundary before proceeding."
      },
      {
        stepId: "REHEARSE_LOOKUP",
        instruction:
          "Rehearse metadata-only coordinate lookup notes without runtime activation."
      },
      {
        stepId: "MONITOR_SIGNALS",
        instruction:
          "Observe monitoring outputs for healthy, warning, blocked, and shutdown signals."
      },
      {
        stepId: "EXIT_AND_AUDIT",
        instruction:
          "Exit within the timebox and complete audit notes whether successful or stopped."
      }
    ],
    monitoringFocus: {
      healthyReference: "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
      budgetWarningAlert: budgetAlert.alertId,
      emergencyShutdownAlert: emergencyAlert.alertId
    },
    stopAndRollback: {
      stopConditions: checklist.stopConditions,
      rollbackProcedure: checklist.rollbackProcedure
    },
    exitAudit: checklist.auditRequirements,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_OPERATOR_RUNBOOK_001",
      checklist.deterministicFingerprint,
      JSON.stringify(checklist.stopConditions)
    )
  });
}

function buildValidation(inputs, checklist, runbook) {
  const checks = [
    {
      name: "go_record_preserved",
      ok:
        inputs.goRecord.decisionState ===
          "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY" &&
        inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false
    },
    {
      name: "preflight_and_environment_defined",
      ok:
        checklist.preFlightChecklist.length >= 4 &&
        checklist.environmentVerification.length >= 5
    },
    {
      name: "operator_and_monitoring_steps_defined",
      ok:
        checklist.operatorSteps.length >= 5 &&
        checklist.monitoringChecklist.length >= 5 &&
        runbook.executionSequence.length === 5
    },
    {
      name: "stop_rollback_exit_audit_defined",
      ok:
        checklist.stopConditions.length >= 5 &&
        checklist.rollbackProcedure.length >= 4 &&
        checklist.exitProcedure.length >= 4 &&
        checklist.auditRequirements.length >= 4
    },
    {
      name: "monitoring_signals_traceable",
      ok:
        inputs.monitoringValidation.status === "pass" &&
        runbook.monitoringFocus.healthyReference != null &&
        runbook.monitoringFocus.budgetWarningAlert != null &&
        runbook.monitoringFocus.emergencyShutdownAlert != null
    },
    {
      name: "final_safety_checklist_preserved",
      ok:
        inputs.finalChecklist.failCount === 0 &&
        inputs.finalChecklist.passCount === inputs.finalChecklist.items.length
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        inputs.goRecord.runtimeFlags.mapAttachmentAllowed === false &&
        inputs.goRecord.runtimeFlags.automaticRendererExecutionAllowed === false &&
        inputs.monitoringValidation.rendererAttachmentAuthorized === false &&
        inputs.monitoringValidation.mapDownloadsAuthorized === false &&
        inputs.monitoringValidation.blenderAuthorized === false &&
        inputs.monitoringValidation.glbAuthorized === false &&
        inputs.monitoringValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_VALIDATION_001",
    checklistId: checklist.checklistId,
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
      checklist.checklistId,
      JSON.stringify(checks),
      runbook.deterministicFingerprint
    )
  });
}

function buildLifecycle(validation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_LIFECYCLE_001",
    checklistId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001",
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REHEARSAL"
        : "DEVELOPER_ALPHA_EXECUTION_CHECKLIST_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001",
      validation.status,
      RECORD_DATE
    )
  });
}

function buildReport(checklist, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA EXECUTION CHECKLIST

## Goal

Create the operational runbook for a future tiny developer-only Atlas alpha review session.

## Pre-Flight

${checklist.preFlightChecklist.map((item) => `- ${item}`).join("\n")}

## Monitoring

${checklist.monitoringChecklist.map((item) => `- ${item}`).join("\n")}

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

Developer alpha execution readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REHEARSAL"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaExecutionChecklist({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const checklist = buildExecutionChecklist(inputs);
  const runbook = buildOperatorRunbook(inputs, checklist);
  const validation = buildValidation(inputs, checklist, runbook);
  const lifecycle = buildLifecycle(validation);
  const report = buildReport(checklist, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, EXECUTION_ROOT),
    checklist,
    runbook,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaExecutionChecklist({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasDeveloperAlphaExecutionChecklist({ cwd });
  const checklistDir = path.join(result.root, "checklist");
  const runbookDir = path.join(result.root, "runbook");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    checklistDir,
    runbookDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.checklist);
  writeJson(path.join(runbookDir, RUNBOOK_FILENAME), result.runbook);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaExecutionChecklist();
}
