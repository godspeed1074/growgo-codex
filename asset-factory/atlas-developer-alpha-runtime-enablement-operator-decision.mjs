import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const DECISION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001";

const DECISION_RECORD_FILENAME =
  "atlas-developer-alpha-runtime-enablement-operator-decision-record.json";
const AUTHORIZATION_RECORD_FILENAME =
  "atlas-developer-alpha-runtime-enablement-operator-authorization-record.json";
const RATIONALE_FILENAME =
  "atlas-developer-alpha-runtime-enablement-decision-rationale.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-runtime-enablement-operator-decision-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-runtime-enablement-operator-decision-lifecycle.json";

const ENABLEMENT_ACTION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001/record/atlas-developer-alpha-controlled-runtime-enablement-action-record.json";
const ENABLEMENT_ACTION_AUTHORIZATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001/authorization/atlas-developer-alpha-controlled-runtime-enablement-action-authorization-record.json";
const ENABLEMENT_ACTION_SNAPSHOT_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001/snapshot/atlas-developer-alpha-controlled-runtime-enablement-before-after-snapshot.json";
const ENABLEMENT_ACTION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001/validation/atlas-developer-alpha-controlled-runtime-enablement-action-validation.json";
const ENABLEMENT_ACTION_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-action/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_ACTION_001/lifecycle/atlas-developer-alpha-controlled-runtime-enablement-action-lifecycle.json";

const ENABLEMENT_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/record/atlas-developer-alpha-controlled-runtime-enablement-review-record.json";
const ENABLEMENT_REVIEW_APPROVAL_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/approval/atlas-developer-alpha-controlled-runtime-approval-conditions.json";
const ENABLEMENT_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-enablement-review/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_ENABLEMENT_REVIEW_001/validation/atlas-developer-alpha-controlled-runtime-enablement-review-validation.json";

const FLAG_TRANSITION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/record/atlas-developer-alpha-controlled-runtime-flag-transition-record.json";
const FLAG_TRANSITION_AUTHORIZATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/authorization/atlas-developer-alpha-controlled-runtime-transition-authorization-record.json";
const FLAG_TRANSITION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime-flag-transition/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_001/validation/atlas-developer-alpha-controlled-runtime-flag-transition-validation.json";

const DECISION_DATE = "2026-07-30";
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
    enablementActionRecord: readJson(cwd, ENABLEMENT_ACTION_RECORD_PATH),
    enablementActionAuthorization: readJson(cwd, ENABLEMENT_ACTION_AUTHORIZATION_PATH),
    enablementActionSnapshot: readJson(cwd, ENABLEMENT_ACTION_SNAPSHOT_PATH),
    enablementActionValidation: readJson(cwd, ENABLEMENT_ACTION_VALIDATION_PATH),
    enablementActionLifecycle: readJson(cwd, ENABLEMENT_ACTION_LIFECYCLE_PATH),
    enablementReviewRecord: readJson(cwd, ENABLEMENT_REVIEW_RECORD_PATH),
    enablementReviewApproval: readJson(cwd, ENABLEMENT_REVIEW_APPROVAL_PATH),
    enablementReviewValidation: readJson(cwd, ENABLEMENT_REVIEW_VALIDATION_PATH),
    flagTransitionRecord: readJson(cwd, FLAG_TRANSITION_RECORD_PATH),
    flagTransitionAuthorization: readJson(cwd, FLAG_TRANSITION_AUTHORIZATION_PATH),
    flagTransitionValidation: readJson(cwd, FLAG_TRANSITION_VALIDATION_PATH)
  });
}

function buildDecisionRationale(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_DECISION_RATIONALE_001",
    decisionId: "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001",
    recordedOn: DECISION_DATE,
    selectedDecisionState: "DEFER_ENABLEMENT",
    rationaleSummary:
      "Defer the first runtime enablement until a separate explicit manual transition moment is intentionally chosen by the authorized operator pair.",
    reasons: [
      "current planning and control records are complete and passing",
      "no explicit live transition request is being executed in this phase",
      "safety requires runtimeExecutionEnabled to remain false until the precise operator moment",
      "map and renderer pathways remain intentionally blocked",
      "deferral preserves rollback simplicity and audit clarity"
    ],
    preservedFlags: inputs.enablementActionSnapshot.finalPreChangeSnapshot,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_DECISION_RATIONALE_001",
      inputs.enablementActionRecord.enablementActionRecord
        ? "nested-unexpected"
        : inputs.enablementActionRecord.deterministicFingerprint,
      inputs.enablementReviewRecord.deterministicFingerprint,
      DECISION_DATE
    )
  });
}

function buildAuthorizationRecord(inputs) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_AUTHORIZATION_RECORD_001",
    decisionId: "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001",
    recordedOn: DECISION_DATE,
    authorizationState: "AUTHORIZED_TO_RECORD_DECISION_ONLY",
    authorizedRoles: inputs.enablementActionAuthorization.authorizedRoles,
    internalDeveloperOnly: true,
    explicitTransitionStillRequired: true,
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
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_AUTHORIZATION_RECORD_001",
      inputs.enablementActionAuthorization.deterministicFingerprint,
      inputs.flagTransitionAuthorization.deterministicFingerprint,
      DECISION_DATE
    )
  });
}

function buildDecisionRecord(inputs, authorizationRecord, rationale) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_RECORD_001",
    decisionId: "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001",
    recordedOn: DECISION_DATE,
    decisionState: "DEFER_ENABLEMENT",
    decisionStatesSupported: ["EXECUTE_ENABLEMENT", "DEFER_ENABLEMENT"],
    operatorDecision: {
      state: "DEFER_ENABLEMENT",
      operatorRole: "atlas_operator",
      dualAwarenessRequired: true
    },
    decisionRationaleReference: rationale.schemaId,
    finalPreChangeSnapshot:
      inputs.enablementActionSnapshot.finalPreChangeSnapshot,
    approvalReferences: {
      enablementActionId: inputs.enablementActionRecord.actionId,
      enablementReviewId: inputs.enablementReviewRecord.reviewId,
      flagTransitionId: inputs.flagTransitionRecord.transitionId
    },
    scopeConfirmation: {
      regionId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRegion,
      recipeId: inputs.enablementReviewRecord.approvedRuntimeWindow.approvedRecipe,
      packageId: inputs.enablementReviewRecord.approvedRuntimeWindow.packageId,
      internalDeveloperOnly: true
    },
    rollbackConfirmation: {
      rollbackState: inputs.enablementActionRecord.rollbackReference.rollbackState,
      rollbackOwner: inputs.enablementActionRecord.rollbackReference.rollbackOwner,
      backupRollbackOwner:
        inputs.enablementActionRecord.rollbackReference.backupRollbackOwner
    },
    authorizationState: authorizationRecord.authorizationState,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_RECORD_001",
      inputs.enablementActionRecord.deterministicFingerprint,
      inputs.enablementReviewRecord.deterministicFingerprint,
      inputs.flagTransitionRecord.deterministicFingerprint,
      rationale.deterministicFingerprint
    )
  });
}

function buildValidation(inputs, decisionRecord, authorizationRecord, rationale) {
  const checks = [
    {
      name: "enablement_action_chain_valid",
      ok:
        inputs.enablementActionValidation.status === "pass" &&
        inputs.enablementActionLifecycle.lifecycleStatus ===
          "ENABLEMENT_ACTION_READY_PENDING_EXPLICIT_MANUAL_OPERATOR_DECISION"
    },
    {
      name: "enablement_review_and_flag_transition_chain_valid",
      ok:
        inputs.enablementReviewValidation.status === "pass" &&
        inputs.flagTransitionValidation.status === "pass"
    },
    {
      name: "decision_is_safe_and_deferred",
      ok:
        decisionRecord.decisionState === "DEFER_ENABLEMENT" &&
        rationale.selectedDecisionState === "DEFER_ENABLEMENT"
    },
    {
      name: "scope_and_authorization_preserved",
      ok:
        authorizationRecord.authorizationState ===
          "AUTHORIZED_TO_RECORD_DECISION_ONLY" &&
        decisionRecord.scopeConfirmation.regionId ===
          "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION" &&
        decisionRecord.scopeConfirmation.recipeId === "COASTAL_LOCATION_RECIPE_001"
    },
    {
      name: "rollback_confirmation_defined",
      ok:
        decisionRecord.rollbackConfirmation.rollbackState ===
          "READY_IF_MANUAL_TRANSITION_IS_ATTEMPTED" &&
        Boolean(decisionRecord.rollbackConfirmation.rollbackOwner)
    },
    {
      name: "runtime_renderer_map_downloads_blender_glb_and_asset_mutation_remain_blocked",
      ok:
        decisionRecord.finalPreChangeSnapshot.runtimeExecutionEnabled === false &&
        decisionRecord.finalPreChangeSnapshot.mapAttachmentAllowed === false &&
        decisionRecord.finalPreChangeSnapshot.automaticRendererExecutionAllowed === false &&
        decisionRecord.finalPreChangeSnapshot.rendererAttachmentAuthorized === false &&
        decisionRecord.finalPreChangeSnapshot.mapDownloadsAuthorized === false &&
        decisionRecord.finalPreChangeSnapshot.blenderAuthorized === false &&
        decisionRecord.finalPreChangeSnapshot.glbAuthorized === false &&
        decisionRecord.finalPreChangeSnapshot.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_VALIDATION_001",
    decisionId: decisionRecord.decisionId,
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
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_VALIDATION_001",
      decisionRecord.deterministicFingerprint,
      authorizationRecord.deterministicFingerprint,
      rationale.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(decisionRecord, validation) {
  return deepFreeze({
    schemaId:
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_LIFECYCLE_001",
    decisionId: decisionRecord.decisionId,
    lifecycleStatus:
      validation.status === "pass"
        ? "OPERATOR_DECISION_RECORDED_DEFERRED_PENDING_FUTURE_EXPLICIT_TRANSITION"
        : "OPERATOR_DECISION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_LIFECYCLE_001",
      decisionRecord.decisionId,
      validation.status,
      DECISION_DATE
    )
  });
}

export function buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const decisionRationale = buildDecisionRationale(inputs);
  const authorizationRecord = buildAuthorizationRecord(inputs);
  const operatorDecisionRecord = buildDecisionRecord(
    inputs,
    authorizationRecord,
    decisionRationale
  );
  const validation = buildValidation(
    inputs,
    operatorDecisionRecord,
    authorizationRecord,
    decisionRationale
  );
  const lifecycle = buildLifecycle(operatorDecisionRecord, validation);

  return deepFreeze({
    root: path.resolve(cwd, DECISION_ROOT),
    operatorDecisionRecord,
    authorizationRecord,
    decisionRationale,
    validation,
    lifecycle,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaRuntimeEnablementOperatorDecision({
    cwd
  });
  const recordDir = path.join(result.root, "record");
  const authorizationDir = path.join(result.root, "authorization");
  const rationaleDir = path.join(result.root, "rationale");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");

  for (const directory of [
    recordDir,
    authorizationDir,
    rationaleDir,
    validationDir,
    lifecycleDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(recordDir, DECISION_RECORD_FILENAME),
    result.operatorDecisionRecord
  );
  writeJson(
    path.join(authorizationDir, AUTHORIZATION_RECORD_FILENAME),
    result.authorizationRecord
  );
  writeJson(
    path.join(rationaleDir, RATIONALE_FILENAME),
    result.decisionRationale
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaRuntimeEnablementOperatorDecision();
}
