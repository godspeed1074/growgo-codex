import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-completion-review/ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_SIMULATION_001";

const HARNESS_FILENAME =
  "atlas-developer-alpha-session-completion-review-harness.json";
const FINAL_SESSION_RECORDS_FILENAME =
  "atlas-developer-alpha-final-session-records.json";
const REVIEW_OUTPUTS_FILENAME =
  "atlas-developer-alpha-session-review-outputs.json";
const TELEMETRY_SUMMARY_FILENAME =
  "atlas-developer-alpha-session-telemetry-summary.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-completion-review-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-completion-review-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-session-completion-review-report.md";

const OPERATIONAL_STATES_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001/outputs/atlas-developer-alpha-session-operational-state-outputs.json";
const OPERATIONAL_AUDIT_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001/audit/atlas-developer-alpha-session-operational-audit-records.json";
const OPERATIONAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001/validation/atlas-developer-alpha-session-operational-validation.json";
const RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";

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
    operationalStates: readJson(cwd, OPERATIONAL_STATES_PATH),
    operationalAudit: readJson(cwd, OPERATIONAL_AUDIT_PATH),
    operationalValidation: readJson(cwd, OPERATIONAL_VALIDATION_PATH),
    recordSpecification: readJson(cwd, RECORD_SPECIFICATION_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH)
  });
}

function telemetryById(inputs, telemetryId) {
  return inputs.monitoringTelemetry.records.find(
    (record) => record.telemetryId === telemetryId
  );
}

function buildHarness(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_HARNESS_001",
    simulationId: "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_SIMULATION_001",
    recordedOn: SIMULATION_DATE,
    operationalReference: inputs.operationalStates.simulationId,
    recordFrameworkReference: inputs.recordSpecification.frameworkId,
    monitoringReference: inputs.monitoringTelemetry.simulationId,
    controlReference: inputs.controlSpecification.controlId,
    scenarios: [
      {
        scenarioId: "ATLAS_COMPLETION_SUCCESS_001",
        scenarioType: "SUCCESSFUL_SESSION_COMPLETION",
        outcomeState: "COMPLETED_NO_ACTION"
      },
      {
        scenarioId: "ATLAS_COMPLETION_WARNING_001",
        scenarioType: "COMPLETION_WITH_WARNINGS",
        outcomeState: "COMPLETED_WITH_WARNING"
      },
      {
        scenarioId: "ATLAS_COMPLETION_ROLLBACK_001",
        scenarioType: "ROLLBACK_COMPLETION",
        outcomeState: "STOPPED_AND_ROLLED_BACK"
      },
      {
        scenarioId: "ATLAS_COMPLETION_REVIEW_FAIL_001",
        scenarioType: "FAILED_SESSION_REQUIRING_REVIEW",
        outcomeState: "INVALID_SESSION_RECORD"
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_HARNESS_001",
      inputs.operationalStates.deterministicFingerprint,
      inputs.operationalAudit.deterministicFingerprint,
      inputs.recordSpecification.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      inputs.controlSpecification.deterministicFingerprint,
      SIMULATION_DATE
    )
  });
}

function buildFinalSessionRecords(inputs, harness) {
  const outputs = [
    {
      scenarioId: "ATLAS_COMPLETION_SUCCESS_001",
      scenarioType: "SUCCESSFUL_SESSION_COMPLETION",
      completionStateTransition: {
        from: "COMPLETED",
        event: "POST_SESSION_REVIEW_COMPLETED",
        to: "COMPLETED"
      },
      outcomeState: "COMPLETED_NO_ACTION",
      postSessionCapture: "CAPTURED",
      telemetrySummaryReference: "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
      reviewGenerated: true,
      recommendationsGenerated: false,
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      }
    },
    {
      scenarioId: "ATLAS_COMPLETION_WARNING_001",
      scenarioType: "COMPLETION_WITH_WARNINGS",
      completionStateTransition: {
        from: "COMPLETED",
        event: "POST_SESSION_REVIEW_COMPLETED",
        to: "COMPLETED"
      },
      outcomeState: "COMPLETED_WITH_WARNING",
      postSessionCapture: "CAPTURED",
      telemetrySummaryReference: "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
      reviewGenerated: true,
      recommendationsGenerated: true,
      runtimeFlags: {
        "runtimeExecutionEnabled": false,
        "mapAttachmentAllowed": false,
        "automaticRendererExecutionAllowed": false
      }
    },
    {
      scenarioId: "ATLAS_COMPLETION_ROLLBACK_001",
      scenarioType: "ROLLBACK_COMPLETION",
      completionStateTransition: {
        from: "ROLLBACK_IN_PROGRESS",
        event: "CLOSE_SESSION",
        to: "COMPLETED"
      },
      outcomeState: "STOPPED_AND_ROLLED_BACK",
      postSessionCapture: "CAPTURED",
      telemetrySummaryReference: "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
      reviewGenerated: true,
      recommendationsGenerated: true,
      runtimeFlags: {
        "runtimeExecutionEnabled": false,
        "mapAttachmentAllowed": false,
        "automaticRendererExecutionAllowed": false
      }
    },
    {
      scenarioId: "ATLAS_COMPLETION_REVIEW_FAIL_001",
      scenarioType: "FAILED_SESSION_REQUIRING_REVIEW",
      completionStateTransition: {
        from: "INVALID_SESSION",
        event: "POST_SESSION_REVIEW_COMPLETED",
        to: "INVALID_SESSION"
      },
      outcomeState: "INVALID_SESSION_RECORD",
      postSessionCapture: "CAPTURED_WITH_FAILURE_NOTES",
      telemetrySummaryReference: "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
      reviewGenerated: true,
      recommendationsGenerated: true,
      runtimeFlags: {
        "runtimeExecutionEnabled": false,
        "mapAttachmentAllowed": false,
        "automaticRendererExecutionAllowed": false
      }
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_SESSION_RECORDS_001",
    simulationId: harness.simulationId,
    records: outputs,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_FINAL_SESSION_RECORDS_001",
      harness.deterministicFingerprint,
      JSON.stringify(outputs)
    )
  });
}

function buildReviewOutputs(inputs, finalSessionRecords) {
  const outputs = finalSessionRecords.records.map((record) => ({
    scenarioId: record.scenarioId,
    scenarioType: record.scenarioType,
    reviewSections: inputs.recordSpecification.postSessionReviewStructure.requiredSections,
    reviewStatus: "GENERATED",
    recommendations:
      record.recommendationsGenerated
        ? [
            "inspect warning and fallback traces before any future manual session",
            "confirm operator notes and follow-up actions are appended",
            "preserve planning-only rollback path if the same signals recur"
          ]
        : [],
    operatorNotesRequired: true
  }));

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_REVIEW_OUTPUTS_001",
    simulationId: finalSessionRecords.simulationId,
    outputs,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_REVIEW_OUTPUTS_001",
      finalSessionRecords.deterministicFingerprint,
      JSON.stringify(outputs)
    )
  });
}

function buildTelemetrySummary(inputs, finalSessionRecords) {
  const telemetryIds = [
    "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
    "RUNTIME_MONITORING_BUDGET_WARNING_001_TELEMETRY",
    "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY"
  ];
  const telemetryRecords = telemetryIds.map((id) => telemetryById(inputs, id));

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
    simulationId: finalSessionRecords.simulationId,
    summary: {
      telemetryIds,
      healthStates: telemetryRecords.map((record) => record.healthState),
      alertStates: telemetryRecords.map((record) => record.alertState),
      rollbackSignals: telemetryRecords.map((record) => record.rollbackSignal),
      warningsObserved: telemetryRecords.filter((record) => record.healthState === "WARNING").length,
      blockedSignalsObserved: telemetryRecords.filter((record) => record.healthState === "BLOCKED").length,
      continuityState: "POST_SESSION_TELEMETRY_SUMMARY_COMPLETE"
    },
    deterministicFingerprint: hashHex(
      "ATLAS_ALPHA_SESSION_TELEMETRY_SUMMARY_001",
      finalSessionRecords.deterministicFingerprint,
      JSON.stringify(telemetryIds)
    )
  });
}

function buildValidation(inputs, harness, finalSessionRecords, reviewOutputs, telemetrySummary) {
  const checks = [
    {
      name: "completion_state_transitions_valid",
      ok:
        inputs.operationalValidation.status === "pass" &&
        finalSessionRecords.records.some(
          (record) =>
            record.scenarioType === "SUCCESSFUL_SESSION_COMPLETION" &&
            record.completionStateTransition.from === "COMPLETED"
        ) &&
        finalSessionRecords.records.some(
          (record) =>
            record.scenarioType === "ROLLBACK_COMPLETION" &&
            record.completionStateTransition.from === "ROLLBACK_IN_PROGRESS"
        )
    },
    {
      name: "post_session_capture_and_review_generation_defined",
      ok:
        finalSessionRecords.records.every((record) => record.postSessionCapture.startsWith("CAPTURED")) &&
        reviewOutputs.outputs.every((output) => output.reviewStatus === "GENERATED")
    },
    {
      name: "telemetry_summary_and_audit_closure_defined",
      ok:
        telemetrySummary.summary.continuityState === "POST_SESSION_TELEMETRY_SUMMARY_COMPLETE" &&
        inputs.operationalAudit.records.some((record) => record.eventType === "SESSION_CLOSED")
    },
    {
      name: "warning_and_rollback_recommendations_defined",
      ok:
        reviewOutputs.outputs.some(
          (output) =>
            output.scenarioType === "COMPLETION_WITH_WARNINGS" &&
            output.recommendations.length > 0
        ) &&
        reviewOutputs.outputs.some(
          (output) =>
            output.scenarioType === "ROLLBACK_COMPLETION" &&
            output.recommendations.length > 0
        )
    },
    {
      name: "failed_session_review_path_defined",
      ok:
        finalSessionRecords.records.some(
          (record) =>
            record.scenarioType === "FAILED_SESSION_REQUIRING_REVIEW" &&
            record.outcomeState === "INVALID_SESSION_RECORD"
        )
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.monitoringValidation.status === "pass" &&
        finalSessionRecords.records.every(
          (record) =>
            record.runtimeFlags.runtimeExecutionEnabled === false &&
            record.runtimeFlags.mapAttachmentAllowed === false &&
            record.runtimeFlags.automaticRendererExecutionAllowed === false
        )
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_VALIDATION_001",
      harness.deterministicFingerprint,
      finalSessionRecords.deterministicFingerprint,
      reviewOutputs.deterministicFingerprint,
      telemetrySummary.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, harness) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_LIFECYCLE_001",
    simulationId: harness.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "COMPLETION_REVIEW_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "COMPLETION_REVIEW_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_LIFECYCLE_001",
      validation.status,
      harness.simulationId,
      SIMULATION_DATE
    )
  });
}

function buildReport(harness, finalSessionRecords, reviewOutputs, telemetrySummary, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION COMPLETION REVIEW SIMULATION

## Goal

Create a data-only simulation of the final completion and review workflow for the future developer-only Atlas alpha session.

## Simulation

- simulation id: ${harness.simulationId}
- recorded on: ${harness.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Completion Scenarios

${harness.scenarios.map((scenario) => `- ${scenario.scenarioType}: ${scenario.outcomeState}`).join("\n")}

## Final Session Records

${finalSessionRecords.records
  .map((record) => `- ${record.scenarioType}: ${record.outcomeState}`)
  .join("\n")}

## Review Outputs

${reviewOutputs.outputs
  .map((output) => `- ${output.scenarioType}: ${output.reviewStatus}`)
  .join("\n")}

## Telemetry Summary

- telemetry ids: ${telemetrySummary.summary.telemetryIds.join(", ")}
- warnings observed: ${telemetrySummary.summary.warningsObserved}
- blocked signals observed: ${telemetrySummary.summary.blockedSignalsObserved}
- continuity: ${telemetrySummary.summary.continuityState}

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

## Completion Readiness

Developer alpha completion readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const finalSessionRecords = buildFinalSessionRecords(inputs, harness);
  const reviewOutputs = buildReviewOutputs(inputs, finalSessionRecords);
  const telemetrySummary = buildTelemetrySummary(inputs, finalSessionRecords);
  const validation = buildValidation(
    inputs,
    harness,
    finalSessionRecords,
    reviewOutputs,
    telemetrySummary
  );
  const lifecycle = buildLifecycle(validation, harness);
  const report = buildReport(
    harness,
    finalSessionRecords,
    reviewOutputs,
    telemetrySummary,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    finalSessionRecords,
    reviewOutputs,
    telemetrySummary,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionCompletionReviewSimulation({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const sessionsDir = path.join(result.root, "sessions");
  const reviewsDir = path.join(result.root, "reviews");
  const telemetryDir = path.join(result.root, "telemetry");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    sessionsDir,
    reviewsDir,
    telemetryDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(sessionsDir, FINAL_SESSION_RECORDS_FILENAME), result.finalSessionRecords);
  writeJson(path.join(reviewsDir, REVIEW_OUTPUTS_FILENAME), result.reviewOutputs);
  writeJson(path.join(telemetryDir, TELEMETRY_SUMMARY_FILENAME), result.telemetrySummary);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionCompletionReviewSimulation();
}
