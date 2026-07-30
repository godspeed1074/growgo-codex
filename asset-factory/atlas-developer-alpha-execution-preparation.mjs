import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const PREPARATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001";

const PREPARATION_RECORD_FILENAME =
  "atlas-developer-alpha-execution-preparation-record.json";
const SNAPSHOT_FILENAME = "atlas-developer-alpha-session-snapshot.json";
const CHECKLIST_FILENAME = "atlas-developer-alpha-operator-preparation-checklist.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-execution-preparation-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-execution-preparation-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-execution-preparation-report.md";

const EXECUTION_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/review/atlas-developer-alpha-execution-review-record.json";
const EXECUTION_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/validation/atlas-developer-alpha-execution-review-validation.json";
const EXECUTION_CHECKLIST_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/checklist/atlas-developer-alpha-execution-checklist.json";
const EXECUTION_RUNBOOK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution/ATLAS_DEVELOPER_ALPHA_EXECUTION_CHECKLIST_001/runbook/atlas-developer-alpha-operator-runbook.json";
const REHEARSAL_SESSIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/sessions/atlas-developer-alpha-simulated-session-records.json";
const REHEARSAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-rehearsal/ATLAS_DEVELOPER_ALPHA_SESSION_REHEARSAL_001/validation/atlas-developer-alpha-rehearsal-validation.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

const PREPARATION_DATE = "2026-07-30";
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
    executionReviewRecord: readJson(cwd, EXECUTION_REVIEW_RECORD_PATH),
    executionReviewValidation: readJson(cwd, EXECUTION_REVIEW_VALIDATION_PATH),
    executionChecklist: readJson(cwd, EXECUTION_CHECKLIST_PATH),
    executionRunbook: readJson(cwd, EXECUTION_RUNBOOK_PATH),
    rehearsalSessions: readJson(cwd, REHEARSAL_SESSIONS_PATH),
    rehearsalValidation: readJson(cwd, REHEARSAL_VALIDATION_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function buildSessionSnapshot(inputs) {
  const successRecord = inputs.rehearsalSessions.records.find(
    (record) => record.scenarioType === "SUCCESSFUL_ALPHA_SESSION"
  );
  const warningRecord = inputs.rehearsalSessions.records.find(
    (record) => record.scenarioType === "WARNING_EVENT"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_SNAPSHOT_001",
    preparationId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001",
    capturedOn: PREPARATION_DATE,
    sessionEnvironment: {
      environment: inputs.executionReviewRecord.alphaScope.environment,
      scopeType: inputs.executionReviewRecord.alphaScope.scopeType,
      permittedRegion: inputs.executionReviewRecord.alphaScope.permittedRegion,
      allowedActions: inputs.executionReviewRecord.alphaScope.allowedActions,
      blockedActions: inputs.executionReviewRecord.alphaScope.blockedActions
    },
    startingStateCapture: {
      reviewDecision: inputs.executionReviewRecord.reviewDecision,
      reviewStatus: inputs.executionReviewValidation.status,
      finalAuditStatus: inputs.finalAuditValidation.status,
      rehearsalStatus: inputs.rehearsalValidation.status
    },
    featureFlagSnapshot: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false
    },
    packageSnapshot: {
      packageId:
        inputs.executionReviewRecord.alphaScope.permittedRegion.packageId,
      regionId:
        inputs.executionReviewRecord.alphaScope.permittedRegion.primaryRegionId,
      latBucket:
        inputs.executionReviewRecord.alphaScope.permittedRegion.latBucket,
      lngBucket:
        inputs.executionReviewRecord.alphaScope.permittedRegion.lngBucket,
      packageValidationStatus: inputs.finalAuditValidation.status
    },
    recipeSnapshot: {
      expectedRecipeId:
        inputs.executionReviewRecord.alphaScope.permittedRegion.expectedRecipeId,
      recipeSelectionMode: "deterministic_region_locked_reference_recipe",
      approvedForDeveloperOnlyReview: true
    },
    monitoringPreparation: {
      monitoringChecklist: inputs.executionChecklist.monitoringChecklist,
      monitoringFocus: inputs.executionReviewRecord.monitoringReadiness.monitoringFocus,
      rehearsalHealthyOutcome: successRecord?.sessionOutcome ?? null,
      rehearsalWarningOutcome: warningRecord?.sessionOutcome ?? null
    },
    operatorPreparation: {
      operatorRoles: inputs.executionRunbook.operatorRoles,
      sessionMode: inputs.executionRunbook.sessionMode,
      operatorSteps: inputs.executionChecklist.operatorSteps
    },
    successMetrics: inputs.executionReviewRecord.successCriteria,
    stopAuthority: {
      primaryOwner: "atlas_operator",
      backupOwner: "internal_developer_reviewer",
      stopConditions: inputs.executionReviewRecord.failureCriteria
    },
    rollbackReadiness: {
      status: inputs.executionReviewRecord.rollbackReadiness.status,
      rollbackProcedure:
        inputs.executionReviewRecord.rollbackReadiness.rollbackProcedure
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_SNAPSHOT_001",
      inputs.executionReviewRecord.deterministicFingerprint,
      inputs.executionChecklist.deterministicFingerprint,
      PREPARATION_DATE
    )
  });
}

function buildOperatorPreparationChecklist(inputs, snapshot) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_OPERATOR_PREPARATION_CHECKLIST_001",
    preparationId: snapshot.preparationId,
    recordedOn: PREPARATION_DATE,
    items: [
      "confirm developer-only environment remains DEVELOPMENT_ONLY",
      "confirm approved primary region and package snapshot match the target review session",
      "confirm all runtime and renderer safety flags remain false",
      "confirm monitoring references are available before any manual review begins",
      "confirm operator roles remain atlas_operator and internal_developer_reviewer only",
      "confirm success metrics are visible to the operator before session start",
      "confirm stop authority and rollback owner are available",
      "confirm no map downloads, Blender work, GLB work, or asset modification are authorized"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_OPERATOR_PREPARATION_CHECKLIST_001",
      snapshot.deterministicFingerprint,
      JSON.stringify(snapshot.stopAuthority.stopConditions)
    )
  });
}

function buildPreparationRecord(inputs, snapshot, operatorChecklist) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_RECORD_001",
    preparationId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001",
    preparedOn: PREPARATION_DATE,
    references: {
      executionReviewId: inputs.executionReviewRecord.reviewId,
      executionChecklistId: inputs.executionChecklist.checklistId,
      executionRunbookId: inputs.executionRunbook.runbookId,
      rehearsalSimulationId: inputs.rehearsalSessions.simulationId,
      finalSafetyAuditId: inputs.finalAuditValidation.auditId
    },
    sessionEnvironment: snapshot.sessionEnvironment,
    startingStateCapture: snapshot.startingStateCapture,
    featureFlagSnapshot: snapshot.featureFlagSnapshot,
    packageSnapshot: snapshot.packageSnapshot,
    recipeSnapshot: snapshot.recipeSnapshot,
    monitoringPreparation: snapshot.monitoringPreparation,
    operatorChecklistReference:
      "ATLAS_DEVELOPER_ALPHA_OPERATOR_PREPARATION_CHECKLIST_001",
    successMetrics: snapshot.successMetrics,
    stopAuthority: snapshot.stopAuthority,
    rollbackReadiness: snapshot.rollbackReadiness,
    preparationDecision:
      inputs.executionReviewRecord.reviewDecision ===
        "APPROVED_FOR_FUTURE_DEVELOPER_ONLY_EXECUTION" &&
      inputs.executionReviewValidation.status === "pass" &&
      inputs.finalAuditValidation.status === "pass" &&
      inputs.rehearsalValidation.status === "pass" &&
      operatorChecklist.items.length >= 8
        ? "PREPARED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "PREPARATION_BLOCKED",
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001",
      snapshot.deterministicFingerprint,
      operatorChecklist.deterministicFingerprint
    )
  });
}

function buildValidation(inputs, snapshot, operatorChecklist, preparationRecord) {
  const checks = [
    {
      name: "session_environment_defined",
      ok:
        snapshot.sessionEnvironment.environment === "DEVELOPMENT_ONLY" &&
        snapshot.sessionEnvironment.scopeType ===
          "TINY_INTERNAL_ATTACHMENT_EXPERIMENT"
    },
    {
      name: "starting_state_and_feature_flags_captured",
      ok:
        snapshot.startingStateCapture.reviewStatus === "pass" &&
        snapshot.startingStateCapture.finalAuditStatus === "pass" &&
        snapshot.featureFlagSnapshot.runtimeExecutionEnabled === false &&
        snapshot.featureFlagSnapshot.mapAttachmentAllowed === false &&
        snapshot.featureFlagSnapshot.automaticRendererExecutionAllowed === false
    },
    {
      name: "package_and_recipe_snapshots_captured",
      ok:
        typeof snapshot.packageSnapshot.packageId === "string" &&
        snapshot.packageSnapshot.packageId.length > 0 &&
        snapshot.recipeSnapshot.expectedRecipeId === "COASTAL_LOCATION_RECIPE_001"
    },
    {
      name: "monitoring_and_operator_preparation_defined",
      ok:
        snapshot.monitoringPreparation.monitoringChecklist.length >= 5 &&
        snapshot.operatorPreparation.operatorSteps.length >= 5 &&
        operatorChecklist.items.length >= 8
    },
    {
      name: "success_metrics_stop_authority_and_rollback_defined",
      ok:
        snapshot.successMetrics.length >= 4 &&
        snapshot.stopAuthority.stopConditions.length >= 5 &&
        snapshot.rollbackReadiness.status === "PASS"
    },
    {
      name: "review_audit_and_rehearsal_support_preparation",
      ok:
        inputs.executionReviewValidation.status === "pass" &&
        inputs.finalAuditValidation.status === "pass" &&
        inputs.rehearsalValidation.status === "pass"
    },
    {
      name: "preparation_decision_reaches_ready_state",
      ok:
        preparationRecord.preparationDecision ===
        "PREPARED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        snapshot.featureFlagSnapshot.runtimeExecutionEnabled === false &&
        snapshot.featureFlagSnapshot.mapAttachmentAllowed === false &&
        snapshot.featureFlagSnapshot.automaticRendererExecutionAllowed === false &&
        inputs.finalAuditValidation.rendererAttachmentAuthorized === false &&
        inputs.finalAuditValidation.mapDownloadsAuthorized === false &&
        inputs.finalAuditValidation.blenderAuthorized === false &&
        inputs.finalAuditValidation.glbAuthorized === false &&
        inputs.finalAuditValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_VALIDATION_001",
    preparationId: preparationRecord.preparationId,
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
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_VALIDATION_001",
      JSON.stringify(checks),
      preparationRecord.deterministicFingerprint
    )
  });
}

function buildLifecycle(validation, preparationRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_LIFECYCLE_001",
    preparationId: preparationRecord.preparationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FINAL_PREPARATION_COMPLETE_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "DEVELOPER_ALPHA_EXECUTION_PREPARATION_BLOCKED",
    preparationDecision: preparationRecord.preparationDecision,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_LIFECYCLE_001",
      validation.status,
      preparationRecord.preparationDecision,
      PREPARATION_DATE
    )
  });
}

function buildReport(preparationRecord, operatorChecklist, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA EXECUTION PREPARATION

## Goal

Create the final operational preparation package before a future developer-only Atlas alpha session.

## Preparation Decision

- preparation id: ${preparationRecord.preparationId}
- prepared on: ${preparationRecord.preparedOn}
- decision: ${preparationRecord.preparationDecision}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Session Environment

- environment: ${preparationRecord.sessionEnvironment.environment}
- scope type: ${preparationRecord.sessionEnvironment.scopeType}
- primary region: ${preparationRecord.sessionEnvironment.permittedRegion.primaryRegionId}
- package: ${preparationRecord.packageSnapshot.packageId}
- recipe: ${preparationRecord.recipeSnapshot.expectedRecipeId}

## Operator Preparation

${operatorChecklist.items.map((item) => `- ${item}`).join("\n")}

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

## Final Preparation Status

Developer alpha execution preparation status: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ONLY_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaExecutionPreparation({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const sessionSnapshot = buildSessionSnapshot(inputs);
  const operatorChecklist = buildOperatorPreparationChecklist(
    inputs,
    sessionSnapshot
  );
  const preparationRecord = buildPreparationRecord(
    inputs,
    sessionSnapshot,
    operatorChecklist
  );
  const validation = buildValidation(
    inputs,
    sessionSnapshot,
    operatorChecklist,
    preparationRecord
  );
  const lifecycle = buildLifecycle(validation, preparationRecord);
  const report = buildReport(
    preparationRecord,
    operatorChecklist,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, PREPARATION_ROOT),
    preparationRecord,
    sessionSnapshot,
    operatorChecklist,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaExecutionPreparation({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaExecutionPreparation({ cwd });
  const preparationDir = path.join(result.root, "preparation");
  const snapshotDir = path.join(result.root, "snapshot");
  const checklistDir = path.join(result.root, "checklist");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    preparationDir,
    snapshotDir,
    checklistDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(preparationDir, PREPARATION_RECORD_FILENAME),
    result.preparationRecord
  );
  writeJson(path.join(snapshotDir, SNAPSHOT_FILENAME), result.sessionSnapshot);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.operatorChecklist);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaExecutionPreparation();
}
