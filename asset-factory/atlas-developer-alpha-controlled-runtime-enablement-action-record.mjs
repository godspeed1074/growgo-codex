import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const ACTION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001";

const ACTION_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-action-record.json";
const AUTHORIZATION_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-action-authorization-record.json";
const SNAPSHOT_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-before-after-snapshot.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-action-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-controlled-runtime-enablement-action-lifecycle.json";

const FLAG_TRANSITION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/record/atlas-developer-alpha-controlled-runtime-flag-transition-record.json";
const FLAG_TRANSITION_AUTHORIZATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/authorization/atlas-developer-alpha-controlled-runtime-transition-authorization-record.json";
const FLAG_TRANSITION_ROLLBACK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/rollback/atlas-developer-alpha-controlled-runtime-transition-rollback-record.json";
const FLAG_TRANSITION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/validation/atlas-developer-alpha-controlled-runtime-flag-transition-validation.json";
const FLAG_TRANSITION_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/lifecycle/atlas-developer-alpha-controlled-runtime-flag-transition-lifecycle.json";
const CONTROLLED_RUNTIME_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/specification/atlas-developer-alpha-controlled-runtime-execution-specification.json";
const CONTROLLED_RUNTIME_MONITORING_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/monitoring/atlas-developer-alpha-controlled-runtime-monitoring-plan.json";
const CONTROLLED_RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/validation/atlas-developer-alpha-controlled-runtime-validation.json";
const ENABLEMENT_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/record/atlas-developer-alpha-controlled-runtime-enablement-review-record.json";
const ENABLEMENT_REVIEW_APPROVAL_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/approval/atlas-developer-alpha-controlled-runtime-approval-conditions.json";
const ENABLEMENT_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/validation/atlas-developer-alpha-controlled-runtime-enablement-review-validation.json";

const ACTION_DATE = "2026-07-30";
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
    flagTransitionRecord: readJson(cwd, FLAG_TRANSITION_RECORD_PATH),
    flagTransitionAuthorization: readJson(cwd, FLAG_TRANSITION_AUTHORIZATION_PATH),
    flagTransitionRollback: readJson(cwd, FLAG_TRANSITION_ROLLBACK_PATH),
    flagTransitionValidation: readJson(cwd, FLAG_TRANSITION_VALIDATION_PATH),
    flagTransitionLifecycle: readJson(cwd, FLAG_TRANSITION_LIFECYCLE_PATH),
    controlledRuntimeSpecification: readJson(cwd, CONTROLLED_RUNTIME_SPECIFICATION_PATH),
    controlledRuntimeMonitoringPlan: readJson(cwd, CONTROLLED_RUNTIME_MONITORING_PATH),
    controlledRuntimeValidation: readJson(cwd, CONTROLLED_RUNTIME_VALIDATION_PATH),
    enablementReviewRecord: readJson(cwd, ENABLEMENT_REVIEW_RECORD_PATH),
    enablementReviewApproval: readJson(cwd, ENABLEMENT_REVIEW_APPROVAL_PATH),
    enablementReviewValidation: readJson(cwd, ENABLEMENT_REVIEW_VALIDATION_PATH)
  });
}

function buildBeforeAfterSnapshot(inputs) {
  const beforeState = {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  };

  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_BEFORE_AFTER_SNAPSHOT_001",
    actionId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001",
    capturedOn: ACTION_DATE,
    finalPreChangeSnapshot: beforeState,
    plannedActionDelta: {
      runtimeExecutionEnabled: {
        before: false,
        planned: "planned transition",
        afterRequiredReset: false
      },
      mapAttachmentAllowed: {
        before: false,
        planned: false,
        afterRequiredReset: false
      },
      automaticRendererExecutionAllowed: {
        before: false,
        planned: false,
        afterRequiredReset: false
      }
    },
    approvedScope: {
      regionId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRegion,
      recipeId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRecipe,
      packageId: inputs.enablementReviewRecord.approvedRuntimeWindow.packageId
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_BEFORE_AFTER_SNAPSHOT_001",
      inputs.flagTransitionRecord.deterministicFingerprint,
      inputs.enablementReviewRecord.deterministicFingerprint,
      ACTION_DATE
    )
  });
}

function buildAuthorizationRecord(inputs, snapshot) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_AUTHORIZATION_RECORD_001",
    actionId: snapshot.actionId,
    recordedOn: ACTION_DATE,
    authorizationState: "READY_FOR_FUTURE_MANUAL_ENABLEMENT_DECISION_ONLY",
    sourceTransitionId: inputs.flagTransitionRecord.transitionId,
    sourceEnablementReviewId: inputs.enablementReviewRecord.reviewId,
    authorizedRoles: inputs.flagTransitionAuthorization.authorizedRoles,
    operatorAuthority: {
      internalDeveloperOnly: true,
      dualAwarenessRequired: true,
      explicitOperatorDecisionRequired: true
    },
    preservedFlags: snapshot.finalPreChangeSnapshot,
    blockedActions: [
      "automatic runtime enablement",
      "renderer attachment",
      "map attachment",
      "map downloads",
      "Blender execution",
      "GLB generation",
      "asset modification"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_AUTHORIZATION_RECORD_001",
      snapshot.deterministicFingerprint,
      inputs.flagTransitionAuthorization.deterministicFingerprint
    )
  });
}

function buildEnablementActionRecord(inputs, snapshot, authorizationRecord) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_RECORD_001",
    actionId: snapshot.actionId,
    recordedOn: ACTION_DATE,
    actionState: "PLANNED_NOT_EXECUTED",
    references: {
      flagTransitionId: inputs.flagTransitionRecord.transitionId,
      controlledRuntimeExecutionId:
        inputs.controlledRuntimeSpecification.executionId,
      enablementReviewId: inputs.enablementReviewRecord.reviewId
    },
    finalPreChangeSnapshot: snapshot.finalPreChangeSnapshot,
    operatorAuthorization: {
      authorizationState: authorizationRecord.authorizationState,
      authorizedRoles: authorizationRecord.authorizedRoles,
      explicitActionRequired: true
    },
    exactFlagDelta: snapshot.plannedActionDelta,
    monitoringConfirmation: {
      requiredSignals: inputs.controlledRuntimeMonitoringPlan.requiredSignals,
      monitoringChecklist:
        inputs.controlledRuntimeMonitoringPlan.monitoringChecklist,
      confirmationState: "READY_FOR_MANUAL_MONITORING_CONFIRMATION"
    },
    rollbackReference: {
      rollbackState: inputs.flagTransitionRollback.rollbackState,
      rollbackOwner: inputs.flagTransitionRollback.rollbackOwner,
      backupRollbackOwner: inputs.flagTransitionRollback.backupRollbackOwner,
      planningOnlyResetTarget:
        inputs.flagTransitionRollback.planningOnlyResetTarget
    },
    actionOutcomeStates: [
      "PLANNED_NOT_EXECUTED",
      "MANUAL_ENABLEMENT_APPROVED_PENDING_OPERATOR_ACTION",
      "MANUAL_ENABLEMENT_EXECUTED_WITH_MONITORING",
      "MANUAL_ENABLEMENT_ABORTED",
      "MANUAL_ENABLEMENT_ROLLED_BACK"
    ],
    auditRequirements: {
      requiredFields: [
        "operatorId",
        "operatorRole",
        "timestamp",
        "decisionReason",
        "beforeState",
        "approvedDelta",
        "monitoringConfirmation",
        "rollbackReference",
        "outcomeState"
      ],
      immutableSafetyAssertions: [
        "mapAttachmentAllowed remains false until separate approval",
        "automaticRendererExecutionAllowed remains false until separate approval",
        "renderer attachment remains unauthorized",
        "asset modification remains unauthorized"
      ]
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_RECORD_001",
      snapshot.deterministicFingerprint,
      authorizationRecord.deterministicFingerprint,
      inputs.controlledRuntimeSpecification.deterministicFingerprint
    )
  });
}

function buildValidation(inputs, actionRecord, authorizationRecord, snapshot) {
  const checks = [
    {
      name: "flag_transition_and_enablement_review_chain_valid",
      ok:
        inputs.flagTransitionValidation.status === "pass" &&
        inputs.flagTransitionLifecycle.lifecycleStatus ===
          "FLAG_TRANSITION_READY_PENDING_MANUAL_RUNTIME_ENABLEMENT_ACTION" &&
        inputs.enablementReviewValidation.status === "pass"
    },
    {
      name: "controlled_runtime_execution_and_monitoring_ready",
      ok:
        inputs.controlledRuntimeValidation.status === "pass" &&
        actionRecord.monitoringConfirmation.requiredSignals.length >= 6 &&
        actionRecord.monitoringConfirmation.monitoringChecklist.length >= 6
    },
    {
      name: "pre_change_snapshot_preserves_current_false_flags",
      ok:
        snapshot.finalPreChangeSnapshot.runtimeExecutionEnabled === false &&
        snapshot.finalPreChangeSnapshot.mapAttachmentAllowed === false &&
        snapshot.finalPreChangeSnapshot.automaticRendererExecutionAllowed === false
    },
    {
      name: "planned_flag_delta_is_runtime_only_and_scope_locked",
      ok:
        actionRecord.exactFlagDelta.runtimeExecutionEnabled.planned ===
          "planned transition" &&
        actionRecord.exactFlagDelta.mapAttachmentAllowed.planned === false &&
        actionRecord.exactFlagDelta.automaticRendererExecutionAllowed.planned === false &&
        snapshot.approvedScope.regionId ===
          "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION" &&
        snapshot.approvedScope.recipeId === "COASTAL_LOCATION_RECIPE_001"
    },
    {
      name: "authorization_and_rollback_reference_defined",
      ok:
        authorizationRecord.authorizationState ===
          "READY_FOR_FUTURE_MANUAL_ENABLEMENT_DECISION_ONLY" &&
        authorizationRecord.authorizedRoles.length === 2 &&
        actionRecord.rollbackReference.rollbackState ===
          "READY_IF_MANUAL_TRANSITION_IS_ATTEMPTED"
    },
    {
      name: "runtime_renderer_map_downloads_blender_glb_and_asset_mutation_remain_blocked",
      ok:
        actionRecord.finalPreChangeSnapshot.runtimeExecutionEnabled === false &&
        actionRecord.finalPreChangeSnapshot.mapAttachmentAllowed === false &&
        actionRecord.finalPreChangeSnapshot.automaticRendererExecutionAllowed === false &&
        actionRecord.finalPreChangeSnapshot.rendererAttachmentAuthorized === false &&
        actionRecord.finalPreChangeSnapshot.mapDownloadsAuthorized === false &&
        actionRecord.finalPreChangeSnapshot.blenderAuthorized === false &&
        actionRecord.finalPreChangeSnapshot.glbAuthorized === false &&
        actionRecord.finalPreChangeSnapshot.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_VALIDATION_001",
    actionId: actionRecord.actionId,
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
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_VALIDATION_001",
      actionRecord.deterministicFingerprint,
      authorizationRecord.deterministicFingerprint,
      snapshot.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(actionRecord, validation) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_LIFECYCLE_001",
    actionId: actionRecord.actionId,
    lifecycleStatus:
      validation.status === "pass"
        ? "ENABLEMENT_ACTION_READY_PENDING_EXPLICIT_MANUAL_OPERATOR_DECISION"
        : "ENABLEMENT_ACTION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_LIFECYCLE_001",
      actionRecord.actionId,
      validation.status,
      ACTION_DATE
    )
  });
}

export function buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const beforeAfterSnapshot = buildBeforeAfterSnapshot(inputs);
  const authorizationRecord = buildAuthorizationRecord(
    inputs,
    beforeAfterSnapshot
  );
  const enablementActionRecord = buildEnablementActionRecord(
    inputs,
    beforeAfterSnapshot,
    authorizationRecord
  );
  const validation = buildValidation(
    inputs,
    enablementActionRecord,
    authorizationRecord,
    beforeAfterSnapshot
  );
  const lifecycle = buildLifecycle(enablementActionRecord, validation);

  return deepFreeze({
    root: path.resolve(cwd, ACTION_ROOT),
    enablementActionRecord,
    authorizationRecord,
    beforeAfterSnapshot,
    validation,
    lifecycle,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const result =
    buildAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord({ cwd });
  const recordDir = path.join(result.root, "record");
  const authorizationDir = path.join(result.root, "authorization");
  const snapshotDir = path.join(result.root, "snapshot");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");

  for (const directory of [
    recordDir,
    authorizationDir,
    snapshotDir,
    validationDir,
    lifecycleDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(recordDir, ACTION_RECORD_FILENAME),
    result.enablementActionRecord
  );
  writeJson(
    path.join(authorizationDir, AUTHORIZATION_RECORD_FILENAME),
    result.authorizationRecord
  );
  writeJson(
    path.join(snapshotDir, SNAPSHOT_FILENAME),
    result.beforeAfterSnapshot
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaControlledRuntimeEnablementActionRecord();
}
