import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const REVIEW_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-dry-run-review/ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001";

const REVIEW_RECORD_FILENAME =
  "atlas-developer-alpha-dry-run-review-record.json";
const CHECKLIST_FILENAME =
  "atlas-developer-alpha-dry-run-review-checklist.json";
const FINDINGS_FILENAME =
  "atlas-developer-alpha-dry-run-findings-report.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-dry-run-review-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-dry-run-review-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-dry-run-review-report.md";

const ORCHESTRATION_OUTPUTS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001/outputs/atlas-developer-alpha-session-lifecycle-outputs.json";
const ORCHESTRATION_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001/telemetry/atlas-developer-alpha-orchestration-telemetry-records.json";
const ORCHESTRATION_AUDIT_PATH =
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001/audit/atlas-developer-alpha-orchestration-audit-records.json";
const ORCHESTRATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001/validation/atlas-developer-alpha-orchestration-validation.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";
const CONTROL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/validation/atlas-developer-alpha-session-control-validation.json";
const RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
const RECORD_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/validation/atlas-developer-alpha-session-record-validation.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

const REVIEW_DATE = "2026-07-30";
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
    orchestrationOutputs: readJson(cwd, ORCHESTRATION_OUTPUTS_PATH),
    orchestrationTelemetry: readJson(cwd, ORCHESTRATION_TELEMETRY_PATH),
    orchestrationAudit: readJson(cwd, ORCHESTRATION_AUDIT_PATH),
    orchestrationValidation: readJson(cwd, ORCHESTRATION_VALIDATION_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH),
    controlValidation: readJson(cwd, CONTROL_VALIDATION_PATH),
    recordSpecification: readJson(cwd, RECORD_SPECIFICATION_PATH),
    recordValidation: readJson(cwd, RECORD_VALIDATION_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function buildReviewerChecklist(inputs) {
  const steps = inputs.orchestrationOutputs.outputs;
  const telemetry = inputs.orchestrationTelemetry.records;
  const audit = inputs.orchestrationAudit.records;
  const controlAllowed = new Set(
    inputs.controlSpecification.allowedTransitions.map(({ from, to }) => `${from}->${to}`)
  );

  const warningStep = steps.find((step) => step.stepId === "WARNING_EVENT");
  const rollbackStep = steps.find((step) => step.stepId === "ROLLBACK_EVENT");
  const warningTelemetry = telemetry.find(
    (record) => record.scenarioType === "BUDGET_WARNING"
  );
  const rollbackTelemetry = telemetry.find(
    (record) => record.scenarioType === "RECIPE_FALLBACK_EVENT"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_CHECKLIST_001",
    reviewId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001",
    reviewedOn: REVIEW_DATE,
    items: [
      {
        itemId: "CHECK_STATE_MACHINE_BEHAVIOUR",
        area: "state_machine_behaviour",
        status:
          inputs.controlValidation.status === "pass" &&
          controlAllowed.has("NOT_STARTED->PRE_SESSION_CAPTURE_READY") &&
          controlAllowed.has("PAUSED_FOR_REVIEW->ROLLBACK_IN_PROGRESS") &&
          steps.at(-1)?.toState === "COMPLETED"
            ? "PASS"
            : "FAIL",
        evidence:
          "Dry-run steps follow the approved control state machine through pause, rollback, and completion."
      },
      {
        itemId: "CHECK_TELEMETRY_COMPLETENESS",
        area: "telemetry_completeness",
        status:
          telemetry.length === 3 &&
          telemetry.some((record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION") &&
          telemetry.some((record) => record.scenarioType === "BUDGET_WARNING") &&
          telemetry.some((record) => record.scenarioType === "RECIPE_FALLBACK_EVENT")
            ? "PASS"
            : "FAIL",
        evidence:
          "Healthy, warning, and rollback-linked telemetry were all captured in the orchestration dry run."
      },
      {
        itemId: "CHECK_MONITORING_OUTPUTS",
        area: "monitoring_outputs",
        status:
          inputs.orchestrationValidation.status === "pass" &&
          warningTelemetry?.alertState === "WARNING_PACKAGE_NEAR_LIMIT" &&
          rollbackTelemetry?.alertState === "RECIPE_FALLBACK_WARNING"
            ? "PASS"
            : "FAIL",
        evidence:
          "Monitoring outputs preserved the expected warning and rollback-facing alert states."
      },
      {
        itemId: "CHECK_ROLLBACK_HANDLING",
        area: "rollback_handling",
        status:
          rollbackStep?.toState === "ROLLBACK_IN_PROGRESS" &&
          rollbackTelemetry?.rollbackSignal === "FALLBACK_TO_APPROVED_RECIPE_PATH" &&
          audit.some((record) => record.auditEvent === "ROLLBACK_RECORDED")
            ? "PASS"
            : "FAIL",
        evidence:
          "Rollback was triggered from a paused review state, linked to telemetry, and captured in audit."
      },
      {
        itemId: "CHECK_OPERATOR_WORKFLOW",
        area: "operator_workflow",
        status:
          steps.map((step) => step.stepId).join("|") ===
            [
              "SESSION_INITIALIZATION",
              "PREPARATION_VALIDATION",
              "SESSION_START",
              "HEALTHY_OPERATION",
              "WARNING_EVENT",
              "ROLLBACK_EVENT",
              "SESSION_COMPLETION",
              "REVIEW_COMPLETION"
            ].join("|")
            ? "PASS"
            : "FAIL",
        evidence:
          "The dry-run preserves a readable operator flow from initialization through review completion."
      },
      {
        itemId: "CHECK_STOP_CONDITIONS",
        area: "stop_conditions",
        status:
          inputs.finalAuditValidation.status === "pass" &&
          warningStep?.toState === "PAUSED_FOR_REVIEW" &&
          rollbackStep?.toState === "ROLLBACK_IN_PROGRESS"
            ? "PASS"
            : "FAIL",
        evidence:
          "Warning handling pauses the session and rollback handling remains available before any emergency path."
      },
      {
        itemId: "CHECK_AUDIT_COMPLETENESS",
        area: "audit_completeness",
        status:
          inputs.recordValidation.status === "pass" &&
          audit.some((record) => record.auditEvent === "SESSION_OPENED") &&
          audit.some((record) => record.auditEvent === "PRE_SESSION_CAPTURED") &&
          audit.some((record) => record.auditEvent === "TELEMETRY_REFERENCED") &&
          audit.some((record) => record.auditEvent === "SESSION_CLOSED")
            ? "PASS"
            : "FAIL",
        evidence:
          "The dry run produced a complete audit trail across open, capture, telemetry, rollback, and close events."
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_CHECKLIST_001",
      inputs.orchestrationValidation.deterministicFingerprint,
      inputs.controlValidation.deterministicFingerprint,
      inputs.recordValidation.deterministicFingerprint,
      REVIEW_DATE
    )
  });
}

function buildFindingsReport(inputs, checklist) {
  const findings = [
    {
      area: "state_machine_behaviour",
      outcome: checklist.items.find((item) => item.area === "state_machine_behaviour")?.status,
      note: "State progression remains deterministic and ends in COMPLETED after rollback."
    },
    {
      area: "telemetry_completeness",
      outcome: checklist.items.find((item) => item.area === "telemetry_completeness")?.status,
      note: "Healthy, warning, and rollback-linked telemetry channels are present and aligned with the dry run."
    },
    {
      area: "monitoring_outputs",
      outcome: checklist.items.find((item) => item.area === "monitoring_outputs")?.status,
      note: "Monitoring surfaced expected warning and fallback conditions without enabling runtime."
    },
    {
      area: "rollback_handling",
      outcome: checklist.items.find((item) => item.area === "rollback_handling")?.status,
      note: "Rollback remained callable, observed, and auditable from the simulated session flow."
    },
    {
      area: "operator_workflow",
      outcome: checklist.items.find((item) => item.area === "operator_workflow")?.status,
      note: "The operator-facing dry-run sequence remains understandable from setup through post-session review."
    },
    {
      area: "stop_conditions",
      outcome: checklist.items.find((item) => item.area === "stop_conditions")?.status,
      note: "Warning pause and rollback paths are exercised without crossing into emergency stop."
    },
    {
      area: "audit_completeness",
      outcome: checklist.items.find((item) => item.area === "audit_completeness")?.status,
      note: "Audit references remain complete enough for a future manual developer-only session record."
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_FINDINGS_REPORT_001",
    reviewId: checklist.reviewId,
    findings,
    overallSummary:
      "The developer alpha dry run demonstrates deterministic session flow, complete telemetry and audit coverage, and rollback-first safety behaviour with runtime still disabled.",
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_DRY_RUN_FINDINGS_REPORT_001",
      checklist.deterministicFingerprint,
      JSON.stringify(findings.map((finding) => `${finding.area}:${finding.outcome}`))
    )
  });
}

function buildReviewRecord(inputs, checklist, findingsReport) {
  const passed = checklist.items.every((item) => item.status === "PASS");

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_RECORD_001",
    reviewId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001",
    reviewedOn: REVIEW_DATE,
    references: {
      orchestrationId: inputs.orchestrationValidation.orchestrationId,
      controlId: inputs.controlValidation.controlId,
      recordFrameworkId: inputs.recordValidation.frameworkId,
      monitoringSimulationId: inputs.monitoringTelemetry.simulationId,
      finalSafetyAuditId: inputs.finalAuditValidation.auditId
    },
    reviewAreas: checklist.items.map((item) => ({
      area: item.area,
      status: item.status,
      evidence: item.evidence
    })),
    findingsReference: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_FINDINGS_REPORT_001",
    reviewDecision: passed
      ? "DRY_RUN_APPROVED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
      : "DRY_RUN_REQUIRES_REVIEW_FIXES",
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001",
      checklist.deterministicFingerprint,
      findingsReport.deterministicFingerprint
    )
  });
}

function buildValidation(inputs, checklist, findingsReport, reviewRecord) {
  const checks = [
    {
      name: "state_machine_behaviour_reviewed",
      ok: checklist.items.find((item) => item.area === "state_machine_behaviour")?.status === "PASS"
    },
    {
      name: "telemetry_and_monitoring_reviewed",
      ok:
        checklist.items.find((item) => item.area === "telemetry_completeness")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "monitoring_outputs")?.status === "PASS"
    },
    {
      name: "rollback_and_stop_conditions_reviewed",
      ok:
        checklist.items.find((item) => item.area === "rollback_handling")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "stop_conditions")?.status === "PASS"
    },
    {
      name: "operator_workflow_and_audit_reviewed",
      ok:
        checklist.items.find((item) => item.area === "operator_workflow")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "audit_completeness")?.status === "PASS"
    },
    {
      name: "findings_and_review_decision_defined",
      ok:
        findingsReport.findings.length === 7 &&
        reviewRecord.reviewDecision ===
          "DRY_RUN_APPROVED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.orchestrationValidation.runtimeExecutionEnabled === false &&
        inputs.orchestrationValidation.mapAttachmentAllowed === false &&
        inputs.orchestrationValidation.automaticRendererExecutionAllowed === false &&
        inputs.orchestrationValidation.rendererAttachmentAuthorized === false &&
        inputs.orchestrationValidation.mapDownloadsAuthorized === false &&
        inputs.orchestrationValidation.blenderAuthorized === false &&
        inputs.orchestrationValidation.glbAuthorized === false &&
        inputs.orchestrationValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_VALIDATION_001",
    reviewId: reviewRecord.reviewId,
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
      "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_VALIDATION_001",
      reviewRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, reviewRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_LIFECYCLE_001",
    reviewId: reviewRecord.reviewId,
    lifecycleStatus:
      validation.status === "pass"
        ? "DRY_RUN_REVIEW_COMPLETE_READY_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
        : "DRY_RUN_REVIEW_BLOCKED",
    reviewDecision: reviewRecord.reviewDecision,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_LIFECYCLE_001",
      validation.status,
      reviewRecord.reviewDecision,
      REVIEW_DATE
    )
  });
}

function buildReport(reviewRecord, checklist, validation, lifecycle, findingsReport) {
  return `# ATLAS DEVELOPER ALPHA DRY RUN REVIEW

## Goal

Review the completed Atlas developer alpha dry-run orchestration results and determine readiness for a future manual developer session.

## Review

- review id: ${reviewRecord.reviewId}
- reviewed on: ${reviewRecord.reviewedOn}
- decision: ${reviewRecord.reviewDecision}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Checklist

${checklist.items.map((item) => `- ${item.area}: ${item.status}`).join("\n")}

## Findings

${findingsReport.findings.map((finding) => `- ${finding.area}: ${finding.outcome}`).join("\n")}

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

## Final Dry-Run Review Status

Developer alpha dry-run review status: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaDryRunReview({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const checklist = buildReviewerChecklist(inputs);
  const findingsReport = buildFindingsReport(inputs, checklist);
  const reviewRecord = buildReviewRecord(inputs, checklist, findingsReport);
  const validation = buildValidation(inputs, checklist, findingsReport, reviewRecord);
  const lifecycle = buildLifecycle(validation, reviewRecord);
  const report = buildReport(reviewRecord, checklist, validation, lifecycle, findingsReport);

  return deepFreeze({
    root: path.resolve(cwd, REVIEW_ROOT),
    reviewRecord,
    checklist,
    findingsReport,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaDryRunReview({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaDryRunReview({ cwd });
  const reviewDir = path.join(result.root, "review");
  const checklistDir = path.join(result.root, "checklist");
  const findingsDir = path.join(result.root, "findings");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    reviewDir,
    checklistDir,
    findingsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(reviewDir, REVIEW_RECORD_FILENAME), result.reviewRecord);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.checklist);
  writeJson(path.join(findingsDir, FINDINGS_FILENAME), result.findingsReport);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaDryRunReview();
}
