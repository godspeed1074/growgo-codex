import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const REVIEW_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001";

const REVIEW_RECORD_FILENAME = "atlas-developer-alpha-execution-review-record.json";
const CHECKLIST_FILENAME = "atlas-developer-alpha-reviewer-checklist.json";
const CONDITIONS_FILENAME = "atlas-developer-alpha-execution-approval-conditions.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-execution-review-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-execution-review-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-execution-review-report.md";

const GO_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/decision/atlas-developer-alpha-go-no-go-decision-record.json";
const GO_SCOPE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/scope/atlas-developer-alpha-approved-scope-record.json";
const GO_CONDITIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/conditions/atlas-developer-alpha-conditions-of-approval.json";
const EXECUTION_CHECKLIST_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/checklist/atlas-developer-alpha-execution-checklist.json";
const EXECUTION_RUNBOOK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/runbook/atlas-developer-alpha-operator-runbook.json";
const REHEARSAL_SESSIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/sessions/atlas-developer-alpha-simulated-session-records.json";
const REHEARSAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/validation/atlas-developer-alpha-rehearsal-validation.json";
const REHEARSAL_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/lifecycle/atlas-developer-alpha-rehearsal-lifecycle.json";
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
    goRecord: readJson(cwd, GO_RECORD_PATH),
    goScope: readJson(cwd, GO_SCOPE_PATH),
    goConditions: readJson(cwd, GO_CONDITIONS_PATH),
    executionChecklist: readJson(cwd, EXECUTION_CHECKLIST_PATH),
    executionRunbook: readJson(cwd, EXECUTION_RUNBOOK_PATH),
    rehearsalSessions: readJson(cwd, REHEARSAL_SESSIONS_PATH),
    rehearsalValidation: readJson(cwd, REHEARSAL_VALIDATION_PATH),
    rehearsalLifecycle: readJson(cwd, REHEARSAL_LIFECYCLE_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function buildReviewerChecklist(inputs) {
  const rehearsalRecords = inputs.rehearsalSessions.records;
  const successRecord = rehearsalRecords.find(
    (record) => record.scenarioType === "SUCCESSFUL_ALPHA_SESSION"
  );
  const warningRecord = rehearsalRecords.find(
    (record) => record.scenarioType === "WARNING_EVENT"
  );
  const rollbackRecord = rehearsalRecords.find(
    (record) => record.scenarioType === "ROLLBACK_EVENT"
  );
  const emergencyRecord = rehearsalRecords.find(
    (record) => record.scenarioType === "EMERGENCY_STOP_EVENT"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_CHECKLIST_001",
    reviewId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001",
    recordedOn: REVIEW_DATE,
    items: [
      {
        itemId: "CHECK_ALPHA_SCOPE",
        area: "alpha_scope",
        status:
          inputs.goScope.environment === "DEVELOPMENT_ONLY" &&
          inputs.goScope.scopeType === "TINY_INTERNAL_ATTACHMENT_EXPERIMENT"
            ? "PASS"
            : "FAIL",
        evidence: `${inputs.goScope.permittedRegion.primaryRegionId} remains the single approved developer-only region.`
      },
      {
        itemId: "CHECK_AUTHORIZED_USERS",
        area: "authorized_users",
        status:
          inputs.goScope.testUserBoundaries.internalOnly === true &&
          inputs.goScope.testUserBoundaries.playerAccountsAllowed === false &&
          inputs.goScope.testUserBoundaries.maxConcurrentTestUsers === 2
            ? "PASS"
            : "FAIL",
        evidence: `Authorized users remain limited to ${inputs.goScope.testUserBoundaries.userClasses.join(" and ")}.`
      },
      {
        itemId: "CHECK_DURATION",
        area: "duration",
        status: inputs.goConditions.conditions.some((condition) =>
          condition.includes("must not exceed 30 minutes")
        )
          ? "PASS"
          : "FAIL",
        evidence: "Manual review remains capped at a 30-minute window."
      },
      {
        itemId: "CHECK_SAFETY_FLAGS",
        area: "safety_flags",
        status:
          inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false &&
          inputs.goRecord.runtimeFlags.mapAttachmentAllowed === false &&
          inputs.goRecord.runtimeFlags.automaticRendererExecutionAllowed === false
            ? "PASS"
            : "FAIL",
        evidence:
          "runtimeExecutionEnabled, mapAttachmentAllowed, and automaticRendererExecutionAllowed all remain false."
      },
      {
        itemId: "CHECK_MONITORING_READINESS",
        area: "monitoring_readiness",
        status:
          inputs.executionChecklist.monitoringChecklist.length >= 5 &&
          inputs.executionRunbook.monitoringFocus.healthyReference != null &&
          inputs.rehearsalValidation.checks.find(
            (check) => check.name === "monitoring_flow"
          )?.ok === true
            ? "PASS"
            : "FAIL",
        evidence:
          "Monitoring signals, alerts, and observation flow are defined and rehearsal-validated."
      },
      {
        itemId: "CHECK_ROLLBACK_READINESS",
        area: "rollback_readiness",
        status:
          inputs.executionChecklist.rollbackProcedure.length >= 4 &&
          rollbackRecord?.rollbackUsed === true &&
          emergencyRecord?.rollbackUsed === true
            ? "PASS"
            : "FAIL",
        evidence:
          "Rollback owner is defined and both rollback and emergency stop rehearsals used rollback successfully."
      },
      {
        itemId: "CHECK_SUCCESS_CRITERIA",
        area: "success_criteria",
        status: inputs.goConditions.successMetrics.length >= 4 ? "PASS" : "FAIL",
        evidence: `${inputs.goConditions.successMetrics.length} explicit success metrics remain in force.`
      },
      {
        itemId: "CHECK_FAILURE_CRITERIA",
        area: "failure_criteria",
        status: inputs.goConditions.failureCriteria.length >= 5 ? "PASS" : "FAIL",
        evidence: `${inputs.goConditions.failureCriteria.length} stop conditions remain defined and blocking.`
      },
      {
        itemId: "CHECK_REHEARSAL_RESULTS",
        area: "rehearsal_results",
        status:
          inputs.finalAuditValidation.status === "pass" &&
          inputs.rehearsalValidation.status === "pass" &&
          inputs.rehearsalLifecycle.lifecycleStatus ===
            "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW" &&
          successRecord?.sessionOutcome === "REHEARSAL_COMPLETED" &&
          warningRecord?.sessionOutcome === "REHEARSAL_COMPLETED_WITH_WARNING" &&
          rollbackRecord?.sessionOutcome ===
            "REHEARSAL_STOPPED_AND_ROLLED_BACK" &&
          emergencyRecord?.sessionOutcome === "REHEARSAL_EMERGENCY_STOP"
            ? "PASS"
            : "FAIL",
        evidence:
          "Rehearsal covered success, warning, rollback, and emergency stop with validation and lifecycle both passing."
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_CHECKLIST_001",
      inputs.goRecord.deterministicFingerprint,
      inputs.rehearsalLifecycle.deterministicFingerprint,
      REVIEW_DATE
    )
  });
}

function buildExecutionReviewRecord(inputs, checklist) {
  const passed = checklist.items.every((item) => item.status === "PASS");

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_RECORD_001",
    reviewId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001",
    reviewedOn: REVIEW_DATE,
    references: {
      goNoGoRecordId: inputs.goRecord.recordId,
      executionChecklistId: inputs.executionChecklist.checklistId,
      executionRunbookId: inputs.executionRunbook.runbookId,
      rehearsalSimulationId: inputs.rehearsalSessions.simulationId,
      finalSafetyAuditId: inputs.finalAuditValidation.auditId
    },
    alphaScope: {
      environment: inputs.goScope.environment,
      scopeType: inputs.goScope.scopeType,
      permittedRegion: inputs.goScope.permittedRegion,
      allowedActions: inputs.goScope.allowedActions,
      blockedActions: inputs.goScope.blockedActions
    },
    authorizedUsers: inputs.goScope.testUserBoundaries,
    durationLimitMinutes: 30,
    safetyFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    monitoringReadiness: {
      status: checklist.items.find((item) => item.area === "monitoring_readiness")
        ?.status,
      monitoringChecklist: inputs.executionChecklist.monitoringChecklist,
      monitoringFocus: inputs.executionRunbook.monitoringFocus
    },
    rollbackReadiness: {
      status: checklist.items.find((item) => item.area === "rollback_readiness")
        ?.status,
      rollbackProcedure: inputs.executionChecklist.rollbackProcedure
    },
    successCriteria: inputs.goConditions.successMetrics,
    failureCriteria: inputs.goConditions.failureCriteria,
    rehearsalResults: {
      successfulSessions: inputs.rehearsalLifecycle.successfulSessions,
      warningSessions: inputs.rehearsalLifecycle.warningSessions,
      stoppedSessions: inputs.rehearsalLifecycle.stoppedSessions,
      scenarioOutcomes: inputs.rehearsalSessions.records.map((record) => ({
        scenarioId: record.scenarioId,
        scenarioType: record.scenarioType,
        sessionOutcome: record.sessionOutcome,
        stopTriggered: record.stopTriggered,
        rollbackUsed: record.rollbackUsed
      }))
    },
    reviewDecision: passed
      ? "APPROVED_FOR_FUTURE_DEVELOPER_ONLY_EXECUTION"
      : "BLOCKED_PENDING_REVIEW_FIXES",
    unresolvedBlocks: checklist.items
      .filter((item) => item.status !== "PASS")
      .map((item) => item.area),
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001",
      checklist.deterministicFingerprint,
      inputs.finalAuditValidation.deterministicFingerprint,
      inputs.rehearsalValidation.deterministicFingerprint
    )
  });
}

function buildApprovalConditions(inputs, reviewRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_APPROVAL_CONDITIONS_001",
    reviewId: reviewRecord.reviewId,
    conditions: [
      ...inputs.goConditions.conditions,
      "authorized users remain limited to atlas_operator and internal_developer_reviewer",
      "approved region remains the single Bellarine coastal primary region",
      "review follows the manual operator runbook without runtime activation",
      "monitoring must be observed throughout the session",
      "stop conditions end the session immediately with rollback note captured"
    ],
    requiredPreStartConfirmations: [
      "go/no-go record remains pass",
      "final alpha safety audit remains pass",
      "developer alpha rehearsal validation remains pass",
      "all runtime and map attachment flags remain false"
    ],
    blockedCapabilities: [
      "runtime activation",
      "renderer attachment",
      "map downloads",
      "Blender usage",
      "GLB generation",
      "asset modification",
      "player exposure",
      "beta or production publication"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_APPROVAL_CONDITIONS_001",
      reviewRecord.deterministicFingerprint,
      JSON.stringify(inputs.goConditions.conditions)
    )
  });
}

function buildValidation(inputs, checklist, reviewRecord, approvalConditions) {
  const checks = [
    {
      name: "alpha_scope_reviewed",
      ok: checklist.items.find((item) => item.area === "alpha_scope")?.status === "PASS"
    },
    {
      name: "authorized_users_and_duration_reviewed",
      ok:
        checklist.items.find((item) => item.area === "authorized_users")?.status ===
          "PASS" &&
        checklist.items.find((item) => item.area === "duration")?.status === "PASS"
    },
    {
      name: "safety_flags_preserved",
      ok:
        checklist.items.find((item) => item.area === "safety_flags")?.status ===
          "PASS" &&
        inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        inputs.goRecord.runtimeFlags.mapAttachmentAllowed === false &&
        inputs.goRecord.runtimeFlags.automaticRendererExecutionAllowed === false
    },
    {
      name: "monitoring_and_rollback_ready",
      ok:
        checklist.items.find((item) => item.area === "monitoring_readiness")?.status ===
          "PASS" &&
        checklist.items.find((item) => item.area === "rollback_readiness")?.status ===
          "PASS"
    },
    {
      name: "success_and_failure_criteria_defined",
      ok:
        checklist.items.find((item) => item.area === "success_criteria")?.status ===
          "PASS" &&
        checklist.items.find((item) => item.area === "failure_criteria")?.status ===
          "PASS" &&
        approvalConditions.conditions.length >= 10
    },
    {
      name: "rehearsal_results_support_execution_review",
      ok:
        checklist.items.find((item) => item.area === "rehearsal_results")?.status ===
          "PASS" &&
        inputs.rehearsalValidation.status === "pass" &&
        inputs.rehearsalLifecycle.lifecycleStatus ===
          "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_REVIEW"
    },
    {
      name: "final_audit_still_passes",
      ok: inputs.finalAuditValidation.status === "pass"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.goRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        inputs.goRecord.runtimeFlags.mapAttachmentAllowed === false &&
        inputs.goRecord.runtimeFlags.automaticRendererExecutionAllowed === false &&
        inputs.finalAuditValidation.rendererAttachmentAuthorized === false &&
        inputs.finalAuditValidation.mapDownloadsAuthorized === false &&
        inputs.finalAuditValidation.blenderAuthorized === false &&
        inputs.finalAuditValidation.glbAuthorized === false &&
        inputs.finalAuditValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_VALIDATION_001",
      JSON.stringify(checks),
      reviewRecord.deterministicFingerprint
    )
  });
}

function buildLifecycle(validation, reviewRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_LIFECYCLE_001",
    reviewId: reviewRecord.reviewId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FINAL_HUMAN_REVIEW_COMPLETE_PENDING_MANUAL_DEVELOPER_ALPHA_EXECUTION"
        : "DEVELOPER_ALPHA_EXECUTION_REVIEW_BLOCKED",
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
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_LIFECYCLE_001",
      validation.status,
      reviewRecord.reviewDecision,
      REVIEW_DATE
    )
  });
}

function buildReport(reviewRecord, checklist, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA EXECUTION REVIEW

## Goal

Create the final human review gate before any future developer-only Atlas alpha execution.

## Review Decision

- review id: ${reviewRecord.reviewId}
- reviewed on: ${reviewRecord.reviewedOn}
- decision: ${reviewRecord.reviewDecision}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Scope

- environment: ${reviewRecord.alphaScope.environment}
- scope type: ${reviewRecord.alphaScope.scopeType}
- primary region: ${reviewRecord.alphaScope.permittedRegion.primaryRegionId}
- expected recipe: ${reviewRecord.alphaScope.permittedRegion.expectedRecipeId}
- authorized users: ${reviewRecord.authorizedUsers.userClasses.join(", ")}
- duration limit: ${reviewRecord.durationLimitMinutes} minutes

## Reviewer Checklist

${checklist.items.map((item) => `- ${item.area}: ${item.status}`).join("\n")}

## Rehearsal Summary

- successful sessions: ${reviewRecord.rehearsalResults.successfulSessions}
- warning sessions: ${reviewRecord.rehearsalResults.warningSessions}
- stopped sessions: ${reviewRecord.rehearsalResults.stoppedSessions}

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

## Final Review Status

Developer alpha execution review status: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ONLY_ALPHA_EXECUTION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaExecutionReview({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const reviewerChecklist = buildReviewerChecklist(inputs);
  const reviewRecord = buildExecutionReviewRecord(inputs, reviewerChecklist);
  const approvalConditions = buildApprovalConditions(inputs, reviewRecord);
  const validation = buildValidation(
    inputs,
    reviewerChecklist,
    reviewRecord,
    approvalConditions
  );
  const lifecycle = buildLifecycle(validation, reviewRecord);
  const report = buildReport(reviewRecord, reviewerChecklist, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, REVIEW_ROOT),
    reviewRecord,
    reviewerChecklist,
    approvalConditions,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaExecutionReview({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaExecutionReview({ cwd });
  const reviewDir = path.join(result.root, "review");
  const checklistDir = path.join(result.root, "checklist");
  const conditionsDir = path.join(result.root, "conditions");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    reviewDir,
    checklistDir,
    conditionsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(reviewDir, REVIEW_RECORD_FILENAME), result.reviewRecord);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.reviewerChecklist);
  writeJson(
    path.join(conditionsDir, CONDITIONS_FILENAME),
    result.approvalConditions
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaExecutionReview();
}
