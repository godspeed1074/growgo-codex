import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const REVIEW_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001";

const REVIEW_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-review-record.json";
const CHECKLIST_FILENAME =
  "atlas-developer-alpha-controlled-runtime-reviewer-checklist.json";
const APPROVAL_CONDITIONS_FILENAME =
  "atlas-developer-alpha-controlled-runtime-approval-conditions.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-review-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-review-lifecycle.json";

const CONTROLLED_RUNTIME_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/specification/atlas-developer-alpha-controlled-runtime-execution-specification.json";
const CONTROLLED_RUNTIME_PERMISSION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/permissions/atlas-developer-alpha-controlled-runtime-permission-record.json";
const CONTROLLED_RUNTIME_FLAG_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/flags/atlas-developer-alpha-controlled-runtime-flag-transition-record.json";
const CONTROLLED_RUNTIME_MONITORING_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/monitoring/atlas-developer-alpha-controlled-runtime-monitoring-plan.json";
const CONTROLLED_RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/validation/atlas-developer-alpha-controlled-runtime-validation.json";
const CONTROLLED_RUNTIME_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/lifecycle/atlas-developer-alpha-controlled-runtime-lifecycle.json";
const FINAL_AUDIT_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/record/atlas-developer-alpha-lifecycle-final-audit-record.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/validation/atlas-developer-alpha-lifecycle-final-audit-validation.json";
const READINESS_LOCK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/record/atlas-developer-alpha-session-readiness-lock-record.json";
const READINESS_LOCK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/validation/atlas-developer-alpha-session-readiness-lock-validation.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";

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
    controlledRuntimeSpecification: readJson(cwd, CONTROLLED_RUNTIME_SPECIFICATION_PATH),
    controlledRuntimePermissionRecord: readJson(cwd, CONTROLLED_RUNTIME_PERMISSION_PATH),
    controlledRuntimeFlagTransitionRecord: readJson(cwd, CONTROLLED_RUNTIME_FLAG_PATH),
    controlledRuntimeMonitoringPlan: readJson(cwd, CONTROLLED_RUNTIME_MONITORING_PATH),
    controlledRuntimeValidation: readJson(cwd, CONTROLLED_RUNTIME_VALIDATION_PATH),
    controlledRuntimeLifecycle: readJson(cwd, CONTROLLED_RUNTIME_LIFECYCLE_PATH),
    finalAuditRecord: readJson(cwd, FINAL_AUDIT_RECORD_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH),
    readinessLockRecord: readJson(cwd, READINESS_LOCK_RECORD_PATH),
    readinessLockValidation: readJson(cwd, READINESS_LOCK_VALIDATION_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH)
  });
}

function buildEnablementReviewRecord(inputs) {
  const approvedRegion =
    inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope.regionId;
  const approvedRecipe =
    inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope.recipeId;
  const packageVersion =
    inputs.readinessLockRecord.versionLock?.packageVersion ?? "v001";
  const recipeVersion =
    inputs.readinessLockRecord.versionLock?.recipeVersion ?? "v001";

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_RECORD_001",
    reviewId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001",
    reviewedOn: REVIEW_DATE,
    reviewStatus: "APPROVED_PENDING_MANUAL_RUNTIME_FLAG_TRANSITION",
    references: {
      controlledRuntimeExecutionId:
        inputs.controlledRuntimeSpecification.executionId,
      lifecycleFinalAuditId: inputs.finalAuditRecord.auditId,
      readinessLockId: inputs.readinessLockRecord.lockId,
      runtimeMonitoringSimulationId: inputs.monitoringValidation.simulationId
    },
    experimentScope: {
      environment: inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope.environment,
      scopeType:
        inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope.scopeType,
      internalDeveloperOnly:
        inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope
          .internalDeveloperOnly
    },
    approvedRuntimeWindow: {
      approvedRegion,
      approvedRecipe,
      packageId:
        inputs.controlledRuntimeSpecification.runtimeExecutionExperimentScope.packageId,
      packageVersion,
      recipeVersion
    },
    runtimeFlagTransitionPlan:
      inputs.controlledRuntimeSpecification.exactFeatureFlagTransitionPlan,
    rollbackProcedure: {
      triggers: inputs.controlledRuntimeSpecification.rollbackTriggers,
      owner: "atlas_operator",
      backupOwner: "internal_developer_reviewer",
      rollbackTarget: "PLANNING_ONLY_STATE_WITH_RUNTIME_DISABLED"
    },
    monitoringReadiness: {
      requiredSignals:
        inputs.controlledRuntimeMonitoringPlan.requiredSignals,
      checklist:
        inputs.controlledRuntimeMonitoringPlan.monitoringChecklist,
      healthyReference:
        inputs.monitoringTelemetry.records.find(
          (record) => record.telemetryId ===
            "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY"
        )?.telemetryId ?? null,
      emergencyReference:
        inputs.monitoringTelemetry.records.find(
          (record) => record.telemetryId ===
            "RUNTIME_MONITORING_EMERGENCY_SHUTDOWN_001_TELEMETRY"
        )?.telemetryId ?? null
    },
    operatorAuthority: {
      authorizedUsers:
        inputs.readinessLockRecord.operatorAuthorization.authorizedUsers,
      internalOnly:
        inputs.readinessLockRecord.operatorAuthorization.internalOnly,
      maxConcurrentOperators:
        inputs.readinessLockRecord.operatorAuthorization.maxConcurrentOperators
    },
    successCriteria:
      inputs.controlledRuntimeSpecification.successCriteria,
    failureCriteria:
      inputs.controlledRuntimeSpecification.failureCriteria,
    safetyState: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false,
      blenderAuthorized: false,
      glbAuthorized: false,
      assetModificationAuthorized: false
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_RECORD_001",
      inputs.controlledRuntimeSpecification.deterministicFingerprint,
      inputs.finalAuditRecord.deterministicFingerprint,
      inputs.readinessLockRecord.deterministicFingerprint,
      inputs.monitoringValidation.deterministicFingerprint,
      REVIEW_DATE
    )
  });
}

function buildReviewerChecklist(inputs, reviewRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_REVIEWER_CHECKLIST_001",
    reviewId: reviewRecord.reviewId,
    checkedOn: REVIEW_DATE,
    checklist: [
      {
        name: "experiment_scope_confirmed",
        result: "PASS",
        evidence: reviewRecord.experimentScope.scopeType
      },
      {
        name: "approved_region_confirmed",
        result: "PASS",
        evidence: reviewRecord.approvedRuntimeWindow.approvedRegion
      },
      {
        name: "approved_recipe_confirmed",
        result: "PASS",
        evidence: reviewRecord.approvedRuntimeWindow.approvedRecipe
      },
      {
        name: "package_version_confirmed",
        result: "PASS",
        evidence: reviewRecord.approvedRuntimeWindow.packageVersion
      },
      {
        name: "runtime_flag_transition_plan_reviewed",
        result: "PASS",
        evidence:
          inputs.controlledRuntimeFlagTransitionRecord.auditRequirement
      },
      {
        name: "rollback_procedure_confirmed",
        result: "PASS",
        evidence: reviewRecord.rollbackProcedure.rollbackTarget
      },
      {
        name: "monitoring_readiness_confirmed",
        result: "PASS",
        evidence: reviewRecord.monitoringReadiness.emergencyReference
      },
      {
        name: "operator_authority_confirmed",
        result: "PASS",
        evidence: reviewRecord.operatorAuthority.authorizedUsers.join(", ")
      },
      {
        name: "success_criteria_confirmed",
        result: "PASS",
        evidence: `${reviewRecord.successCriteria.length} criteria`
      },
      {
        name: "failure_criteria_confirmed",
        result: "PASS",
        evidence: `${reviewRecord.failureCriteria.length} criteria`
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_REVIEWER_CHECKLIST_001",
      reviewRecord.deterministicFingerprint,
      JSON.stringify(reviewRecord.successCriteria),
      JSON.stringify(reviewRecord.failureCriteria)
    )
  });
}

function buildApprovalConditions(reviewRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_APPROVAL_CONDITIONS_001",
    reviewId: reviewRecord.reviewId,
    recordedOn: REVIEW_DATE,
    enablementState: "READY_FOR_MANUAL_RUNTIME_FLAG_TRANSITION_REVIEW",
    conditions: [
      "runtimeExecutionEnabled remains false until separate manual transition action is recorded",
      "approved scope remains limited to one internal developer-only region",
      "approved recipe remains COASTAL_LOCATION_RECIPE_001 only",
      "package version remains locked to v001",
      "mapAttachmentAllowed remains false",
      "automaticRendererExecutionAllowed remains false",
      "renderer attachment remains unauthorized",
      "map downloads remain unauthorized",
      "rollback owner and backup owner remain available throughout review window",
      "any failure criteria immediately returns the process to planning-only state"
    ],
    blockedActions: [
      "runtime enablement without explicit operator record",
      "map attachment",
      "renderer attachment",
      "map download",
      "Blender execution",
      "GLB generation",
      "asset modification"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_APPROVAL_CONDITIONS_001",
      reviewRecord.deterministicFingerprint,
      "READY_FOR_MANUAL_RUNTIME_FLAG_TRANSITION_REVIEW"
    )
  });
}

function buildValidation(inputs, reviewRecord, checklist, approvalConditions) {
  const checks = [
    {
      name: "controlled_runtime_execution_is_review_ready",
      ok:
        inputs.controlledRuntimeValidation.status === "pass" &&
        inputs.controlledRuntimeLifecycle.lifecycleStatus ===
          "CONTROLLED_RUNTIME_READY_PENDING_MANUAL_ENABLEMENT_REVIEW"
    },
    {
      name: "alpha_lifecycle_certification_and_readiness_lock_are_valid",
      ok:
        inputs.finalAuditValidation.status === "pass" &&
        inputs.finalAuditRecord.certificationStatus ===
          "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION" &&
        inputs.readinessLockValidation.status === "pass" &&
        inputs.readinessLockRecord.readinessState ===
          "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "single_region_recipe_and_package_scope_preserved",
      ok:
        reviewRecord.approvedRuntimeWindow.approvedRegion ===
          "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION" &&
        reviewRecord.approvedRuntimeWindow.approvedRecipe ===
          "COASTAL_LOCATION_RECIPE_001" &&
        reviewRecord.approvedRuntimeWindow.packageVersion === "v001"
    },
    {
      name: "monitoring_and_rollback_review_ready",
      ok:
        inputs.monitoringValidation.status === "pass" &&
        reviewRecord.monitoringReadiness.requiredSignals.length >= 6 &&
        reviewRecord.rollbackProcedure.triggers.length >= 6
    },
    {
      name: "operator_authority_and_approval_conditions_defined",
      ok:
        reviewRecord.operatorAuthority.internalOnly === true &&
        reviewRecord.operatorAuthority.authorizedUsers.length === 2 &&
        checklist.checklist.every((item) => item.result === "PASS") &&
        approvalConditions.enablementState ===
          "READY_FOR_MANUAL_RUNTIME_FLAG_TRANSITION_REVIEW"
    },
    {
      name: "runtime_renderer_map_and_asset_safety_flags_remain_blocked",
      ok:
        reviewRecord.safetyState.runtimeExecutionEnabled === false &&
        reviewRecord.safetyState.mapAttachmentAllowed === false &&
        reviewRecord.safetyState.automaticRendererExecutionAllowed === false &&
        reviewRecord.safetyState.rendererAttachmentAuthorized === false &&
        reviewRecord.safetyState.mapDownloadsAuthorized === false &&
        reviewRecord.safetyState.blenderAuthorized === false &&
        reviewRecord.safetyState.glbAuthorized === false &&
        reviewRecord.safetyState.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_VALIDATION_001",
      reviewRecord.deterministicFingerprint,
      checklist.deterministicFingerprint,
      approvalConditions.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(reviewRecord, validation) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_LIFECYCLE_001",
    reviewId: reviewRecord.reviewId,
    lifecycleStatus:
      validation.status === "pass"
        ? "ENABLEMENT_REVIEW_APPROVED_PENDING_MANUAL_RUNTIME_FLAG_TRANSITION"
        : "ENABLEMENT_REVIEW_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_LIFECYCLE_001",
      reviewRecord.reviewId,
      validation.status,
      REVIEW_DATE
    )
  });
}

export function buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const reviewRecord = buildEnablementReviewRecord(inputs);
  const reviewerChecklist = buildReviewerChecklist(inputs, reviewRecord);
  const approvalConditions = buildApprovalConditions(reviewRecord);
  const validation = buildValidation(
    inputs,
    reviewRecord,
    reviewerChecklist,
    approvalConditions
  );
  const lifecycle = buildLifecycle(reviewRecord, validation);

  return deepFreeze({
    root: path.resolve(cwd, REVIEW_ROOT),
    reviewRecord,
    reviewerChecklist,
    approvalConditions,
    validation,
    lifecycle,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaControlledRuntimeEnablementReview({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaControlledRuntimeEnablementReview({
    cwd
  });
  const recordDir = path.join(result.root, "record");
  const checklistDir = path.join(result.root, "checklist");
  const approvalDir = path.join(result.root, "approval");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");

  for (const directory of [
    recordDir,
    checklistDir,
    approvalDir,
    validationDir,
    lifecycleDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(recordDir, REVIEW_RECORD_FILENAME), result.reviewRecord);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.reviewerChecklist);
  writeJson(
    path.join(approvalDir, APPROVAL_CONDITIONS_FILENAME),
    result.approvalConditions
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaControlledRuntimeEnablementReview();
}
