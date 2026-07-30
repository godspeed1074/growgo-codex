import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const TRANSITION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001";

const FLAG_TRANSITION_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-flag-transition-record.json";
const STATE_SCHEMA_FILENAME =
  "atlas-developer-alpha-controlled-runtime-before-after-state-schema.json";
const AUTHORIZATION_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-transition-authorization-record.json";
const ROLLBACK_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-transition-rollback-record.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-flag-transition-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-controlled-runtime-flag-transition-lifecycle.json";

const ENABLEMENT_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/record/atlas-developer-alpha-controlled-runtime-enablement-review-record.json";
const ENABLEMENT_REVIEW_APPROVAL_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/approval/atlas-developer-alpha-controlled-runtime-approval-conditions.json";
const ENABLEMENT_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/validation/atlas-developer-alpha-controlled-runtime-enablement-review-validation.json";
const ENABLEMENT_REVIEW_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/lifecycle/atlas-developer-alpha-controlled-runtime-enablement-review-lifecycle.json";
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
const FINAL_AUDIT_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/record/atlas-developer-alpha-lifecycle-final-audit-record.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/validation/atlas-developer-alpha-lifecycle-final-audit-validation.json";

const TRANSITION_DATE = "2026-07-30";
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
    enablementReviewRecord: readJson(cwd, ENABLEMENT_REVIEW_RECORD_PATH),
    enablementReviewApproval: readJson(cwd, ENABLEMENT_REVIEW_APPROVAL_PATH),
    enablementReviewValidation: readJson(cwd, ENABLEMENT_REVIEW_VALIDATION_PATH),
    enablementReviewLifecycle: readJson(cwd, ENABLEMENT_REVIEW_LIFECYCLE_PATH),
    controlledRuntimeSpecification: readJson(cwd, CONTROLLED_RUNTIME_SPECIFICATION_PATH),
    controlledRuntimePermissionRecord: readJson(cwd, CONTROLLED_RUNTIME_PERMISSION_PATH),
    controlledRuntimeFlagRecord: readJson(cwd, CONTROLLED_RUNTIME_FLAG_PATH),
    controlledRuntimeMonitoringPlan: readJson(cwd, CONTROLLED_RUNTIME_MONITORING_PATH),
    controlledRuntimeValidation: readJson(cwd, CONTROLLED_RUNTIME_VALIDATION_PATH),
    finalAuditRecord: readJson(cwd, FINAL_AUDIT_RECORD_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function buildFlagTransitionRecord(inputs) {
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

  const plannedStage =
    inputs.controlledRuntimeSpecification.exactFeatureFlagTransitionPlan.plannedTransition[1];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_RECORD_001",
    transitionId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001",
    recordedOn: TRANSITION_DATE,
    transitionState: "PLANNED_NOT_EXECUTED",
    references: {
      enablementReviewId: inputs.enablementReviewRecord.reviewId,
      controlledRuntimeExecutionId: inputs.controlledRuntimeSpecification.executionId,
      lifecycleFinalAuditId: inputs.finalAuditRecord.auditId
    },
    beforeStateSnapshot: beforeState,
    plannedFlagTransition: {
      stage: plannedStage.stage,
      runtimeExecutionEnabled: plannedStage.runtimeExecutionEnabled,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      executionMode: "MANUAL_CHANGE_CONTROL_ONLY"
    },
    operatorAuthorization: {
      authorizedRoles: ["atlas_operator", "internal_developer_reviewer"],
      internalDeveloperOnly: true,
      transitionRequiresDualAwareness: true,
      operatorRecordRequiredBeforeExecution: true
    },
    transitionProcedure: [
      "confirm enablement review remains approved",
      "capture before-state snapshot immediately before any manual change",
      "record operator identity, timestamp, and reason",
      "change runtimeExecutionEnabled only within the approved experiment window",
      "leave mapAttachmentAllowed unchanged and false",
      "leave automaticRendererExecutionAllowed unchanged and false",
      "capture telemetry throughout the window",
      "record post-window reset back to false"
    ],
    telemetryCapture: {
      requiredSignals: inputs.controlledRuntimeMonitoringPlan.requiredSignals,
      requiredEvents: [
        "coordinate_lookup_attempt",
        "package_validation_result",
        "recipe_selection_result",
        "permission_gate_state",
        "rollback_trigger_state"
      ],
      runtimeExperimentReasonCode: "PLANNED_RUNTIME_FLAG_TRANSITION_NOT_EXECUTED"
    },
    rollbackProcedure: {
      triggers: inputs.enablementReviewRecord.rollbackProcedure.triggers,
      owner: inputs.enablementReviewRecord.rollbackProcedure.owner,
      backupOwner: inputs.enablementReviewRecord.rollbackProcedure.backupOwner,
      resetTarget: "runtimeExecutionEnabled=false",
      planningOnlyTarget: "PLANNING_ONLY_STATE_WITH_RUNTIME_DISABLED"
    },
    auditRequirements: {
      requiredFields: [
        "operatorId",
        "operatorRole",
        "timestamp",
        "reason",
        "beforeState",
        "plannedState",
        "postState",
        "approvedRegion",
        "approvedRecipe"
      ],
      immutableSafetyAssertions: [
        "mapAttachmentAllowed remains false",
        "automaticRendererExecutionAllowed remains false",
        "renderer attachment remains unauthorized",
        "asset modification remains unauthorized"
      ]
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_RECORD_001",
      inputs.enablementReviewRecord.deterministicFingerprint,
      inputs.controlledRuntimeSpecification.deterministicFingerprint,
      inputs.finalAuditRecord.deterministicFingerprint,
      TRANSITION_DATE
    )
  });
}

function buildBeforeAfterStateSchema(inputs, transitionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_BEFORE_AFTER_STATE_SCHEMA_001",
    transitionId: transitionRecord.transitionId,
    recordedOn: TRANSITION_DATE,
    beforeStateSchema: {
      runtimeExecutionEnabled: "boolean_false_required",
      mapAttachmentAllowed: "boolean_false_required",
      automaticRendererExecutionAllowed: "boolean_false_required"
    },
    plannedTransitionSchema: {
      runtimeExecutionEnabled: "planned transition",
      mapAttachmentAllowed: "boolean_false_required",
      automaticRendererExecutionAllowed: "boolean_false_required"
    },
    afterStateSchema: {
      runtimeExecutionEnabled: "boolean_false_required_after_reset",
      mapAttachmentAllowed: "boolean_false_required",
      automaticRendererExecutionAllowed: "boolean_false_required"
    },
    approvedScope: {
      regionId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRegion,
      recipeId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRecipe,
      packageId: inputs.enablementReviewRecord.approvedRuntimeWindow.packageId
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_BEFORE_AFTER_STATE_SCHEMA_001",
      transitionRecord.deterministicFingerprint,
      inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRegion,
      inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRecipe
    )
  });
}

function buildAuthorizationRecord(inputs, transitionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_TRANSITION_AUTHORIZATION_RECORD_001",
    transitionId: transitionRecord.transitionId,
    recordedOn: TRANSITION_DATE,
    authorizationState: "AUTHORIZED_FOR_FUTURE_MANUAL_FLAG_TRANSITION_ONLY",
    sourceReviewId: inputs.enablementReviewRecord.reviewId,
    authorizedRoles: transitionRecord.operatorAuthorization.authorizedRoles,
    approvedScope: {
      regionId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRegion,
      recipeId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRecipe
    },
    preservedSafetyState: transitionRecord.beforeStateSnapshot,
    blockedActions: [
      "map attachment enablement",
      "renderer attachment enablement",
      "map download enablement",
      "Blender execution",
      "GLB generation",
      "asset modification"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_TRANSITION_AUTHORIZATION_RECORD_001",
      transitionRecord.deterministicFingerprint,
      inputs.enablementReviewApproval.deterministicFingerprint
    )
  });
}

function buildRollbackRecord(inputs, transitionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_TRANSITION_ROLLBACK_RECORD_001",
    transitionId: transitionRecord.transitionId,
    recordedOn: TRANSITION_DATE,
    rollbackState: "READY_IF_MANUAL_TRANSITION_IS_ATTEMPTED",
    rollbackOwner: transitionRecord.rollbackProcedure.owner,
    backupRollbackOwner: transitionRecord.rollbackProcedure.backupOwner,
    triggers: transitionRecord.rollbackProcedure.triggers,
    resetProcedure: [
      "record rollback reason",
      "set runtimeExecutionEnabled back to false immediately",
      "confirm mapAttachmentAllowed remains false",
      "confirm automaticRendererExecutionAllowed remains false",
      "capture rollback telemetry and audit closure"
    ],
    planningOnlyResetTarget: transitionRecord.rollbackProcedure.planningOnlyTarget,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_TRANSITION_ROLLBACK_RECORD_001",
      transitionRecord.deterministicFingerprint,
      JSON.stringify(transitionRecord.rollbackProcedure.triggers)
    )
  });
}

function buildValidation(
  inputs,
  transitionRecord,
  stateSchema,
  authorizationRecord,
  rollbackRecord
) {
  const checks = [
    {
      name: "enablement_review_and_controlled_runtime_chain_valid",
      ok:
        inputs.enablementReviewValidation.status === "pass" &&
        inputs.enablementReviewLifecycle.lifecycleStatus ===
          "ENABLEMENT_REVIEW_APPROVED_PENDING_MANUAL_RUNTIME_FLAG_TRANSITION" &&
        inputs.controlledRuntimeValidation.status === "pass"
    },
    {
      name: "lifecycle_certification_preserved",
      ok:
        inputs.finalAuditValidation.status === "pass" &&
        inputs.finalAuditRecord.certificationStatus ===
          "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
    },
    {
      name: "before_state_and_planned_transition_preserve_safety_flags",
      ok:
        transitionRecord.beforeStateSnapshot.runtimeExecutionEnabled === false &&
        transitionRecord.beforeStateSnapshot.mapAttachmentAllowed === false &&
        transitionRecord.beforeStateSnapshot.automaticRendererExecutionAllowed === false &&
        transitionRecord.plannedFlagTransition.runtimeExecutionEnabled ===
          "planned transition" &&
        transitionRecord.plannedFlagTransition.mapAttachmentAllowed === false &&
        transitionRecord.plannedFlagTransition.automaticRendererExecutionAllowed === false
    },
    {
      name: "authorization_and_scope_are_internal_and_single_scope_only",
      ok:
        authorizationRecord.authorizationState ===
          "AUTHORIZED_FOR_FUTURE_MANUAL_FLAG_TRANSITION_ONLY" &&
        authorizationRecord.authorizedRoles.length === 2 &&
        stateSchema.approvedScope.regionId ===
          "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION" &&
        stateSchema.approvedScope.recipeId === "COASTAL_LOCATION_RECIPE_001"
    },
    {
      name: "rollback_and_telemetry_capture_defined",
      ok:
        rollbackRecord.triggers.length >= 6 &&
        transitionRecord.telemetryCapture.requiredSignals.length >= 6 &&
        transitionRecord.telemetryCapture.requiredEvents.length >= 5
    },
    {
      name: "runtime_map_renderer_downloads_blender_glb_and_asset_mutation_blocked",
      ok:
        transitionRecord.beforeStateSnapshot.runtimeExecutionEnabled === false &&
        transitionRecord.beforeStateSnapshot.mapAttachmentAllowed === false &&
        transitionRecord.beforeStateSnapshot.automaticRendererExecutionAllowed === false &&
        authorizationRecord.preservedSafetyState.rendererAttachmentAuthorized === false &&
        authorizationRecord.preservedSafetyState.mapDownloadsAuthorized === false &&
        authorizationRecord.preservedSafetyState.blenderAuthorized === false &&
        authorizationRecord.preservedSafetyState.glbAuthorized === false &&
        authorizationRecord.preservedSafetyState.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_VALIDATION_001",
    transitionId: transitionRecord.transitionId,
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
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_VALIDATION_001",
      transitionRecord.deterministicFingerprint,
      stateSchema.deterministicFingerprint,
      authorizationRecord.deterministicFingerprint,
      rollbackRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(transitionRecord, validation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_LIFECYCLE_001",
    transitionId: transitionRecord.transitionId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FLAG_TRANSITION_READY_PENDING_MANUAL_RUNTIME_ENABLEMENT_ACTION"
        : "FLAG_TRANSITION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_LIFECYCLE_001",
      transitionRecord.transitionId,
      validation.status,
      TRANSITION_DATE
    )
  });
}

export function buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const flagTransitionRecord = buildFlagTransitionRecord(inputs);
  const beforeAfterStateSchema = buildBeforeAfterStateSchema(
    inputs,
    flagTransitionRecord
  );
  const authorizationRecord = buildAuthorizationRecord(
    inputs,
    flagTransitionRecord
  );
  const rollbackRecord = buildRollbackRecord(inputs, flagTransitionRecord);
  const validation = buildValidation(
    inputs,
    flagTransitionRecord,
    beforeAfterStateSchema,
    authorizationRecord,
    rollbackRecord
  );
  const lifecycle = buildLifecycle(flagTransitionRecord, validation);

  return deepFreeze({
    root: path.resolve(cwd, TRANSITION_ROOT),
    flagTransitionRecord,
    beforeAfterStateSchema,
    authorizationRecord,
    rollbackRecord,
    validation,
    lifecycle,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord({
    cwd
  });
  const recordDir = path.join(result.root, "record");
  const schemaDir = path.join(result.root, "schema");
  const authorizationDir = path.join(result.root, "authorization");
  const rollbackDir = path.join(result.root, "rollback");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");

  for (const directory of [
    recordDir,
    schemaDir,
    authorizationDir,
    rollbackDir,
    validationDir,
    lifecycleDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(recordDir, FLAG_TRANSITION_RECORD_FILENAME),
    result.flagTransitionRecord
  );
  writeJson(
    path.join(schemaDir, STATE_SCHEMA_FILENAME),
    result.beforeAfterStateSchema
  );
  writeJson(
    path.join(authorizationDir, AUTHORIZATION_RECORD_FILENAME),
    result.authorizationRecord
  );
  writeJson(
    path.join(rollbackDir, ROLLBACK_RECORD_FILENAME),
    result.rollbackRecord
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaControlledRuntimeFlagTransitionRecord();
}
