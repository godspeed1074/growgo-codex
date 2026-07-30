import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const AUTHORIZATION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001";

const AUTHORIZATION_RECORD_FILENAME =
  "atlas-developer-alpha-manual-session-authorization-record.json";
const OPERATOR_AUTHORIZATION_FILENAME =
  "atlas-developer-alpha-manual-operator-authorization-record.json";
const SCOPE_CONFIRMATION_FILENAME =
  "atlas-developer-alpha-manual-session-scope-confirmation.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-manual-session-authorization-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-manual-session-authorization-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-manual-session-authorization-report.md";

const DRY_RUN_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-dry-run-review/ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001/review/atlas-developer-alpha-dry-run-review-record.json";
const FINAL_CHECK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/record/atlas-developer-alpha-final-check-record.json";
const FINAL_CHECK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/validation/atlas-developer-alpha-final-check-validation.json";
const SESSION_DECISION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/decision/atlas-developer-alpha-session-execution-decision-record.json";
const DECISION_OPERATOR_AUTHORIZATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/authorization/atlas-developer-alpha-operator-authorization-record.json";
const DECISION_SCOPE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/scope/atlas-developer-alpha-session-scope-confirmation.json";
const DECISION_CONDITIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/conditions/atlas-developer-alpha-session-approval-conditions.json";
const EXECUTION_PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const EXECUTION_PREPARATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/validation/atlas-developer-alpha-execution-preparation-validation.json";

const AUTHORIZATION_DATE = "2026-07-30";
const REVIEW_EXPIRY_DATE = "2026-08-06";
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
    dryRunReviewRecord: readJson(cwd, DRY_RUN_REVIEW_RECORD_PATH),
    finalCheckRecord: readJson(cwd, FINAL_CHECK_RECORD_PATH),
    finalCheckValidation: readJson(cwd, FINAL_CHECK_VALIDATION_PATH),
    sessionDecisionRecord: readJson(cwd, SESSION_DECISION_RECORD_PATH),
    decisionOperatorAuthorization: readJson(cwd, DECISION_OPERATOR_AUTHORIZATION_PATH),
    decisionScope: readJson(cwd, DECISION_SCOPE_PATH),
    decisionConditions: readJson(cwd, DECISION_CONDITIONS_PATH),
    executionPreparationRecord: readJson(cwd, EXECUTION_PREPARATION_RECORD_PATH),
    executionPreparationValidation: readJson(cwd, EXECUTION_PREPARATION_VALIDATION_PATH)
  });
}

function buildScopeConfirmation(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_SCOPE_CONFIRMATION_001",
    authorizationId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001",
    confirmedOn: AUTHORIZATION_DATE,
    environment: inputs.decisionScope.environment,
    scopeType: inputs.decisionScope.scopeType,
    permittedRegion: inputs.decisionScope.permittedRegion,
    allowedActions: inputs.decisionScope.allowedActions,
    blockedActions: inputs.decisionScope.blockedActions,
    durationLimitMinutes: inputs.decisionScope.durationLimitMinutes,
    sourceDecisionId: inputs.sessionDecisionRecord.decisionId,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_SCOPE_CONFIRMATION_001",
      inputs.decisionScope.deterministicFingerprint,
      AUTHORIZATION_DATE
    )
  });
}

function buildOperatorAuthorization(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_MANUAL_OPERATOR_AUTHORIZATION_RECORD_001",
    authorizationId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001",
    confirmedOn: AUTHORIZATION_DATE,
    authorizationMode: inputs.decisionOperatorAuthorization.authorizationMode,
    authorizedUsers: [
      {
        role: "atlas_operator",
        authorizationState: "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION",
        stopAuthority: true
      },
      {
        role: "internal_developer_reviewer",
        authorizationState: "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION",
        stopAuthority: true
      }
    ],
    blockedRoles: inputs.decisionOperatorAuthorization.blockedRoles,
    maxConcurrentOperators: inputs.decisionOperatorAuthorization.maxConcurrentOperators,
    playerAccountsAllowed: inputs.decisionOperatorAuthorization.playerAccountsAllowed,
    internalOnly: inputs.decisionOperatorAuthorization.internalOnly,
    operatorAuthorizationSource: inputs.sessionDecisionRecord.decisionId,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_MANUAL_OPERATOR_AUTHORIZATION_RECORD_001",
      inputs.decisionOperatorAuthorization.deterministicFingerprint,
      AUTHORIZATION_DATE
    )
  });
}

function buildAuthorizationRecord(inputs, operatorAuthorization, scopeConfirmation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_RECORD_001",
    authorizationId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001",
    authorizedOn: AUTHORIZATION_DATE,
    authorizationState: "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION",
    sessionScopeConfirmation: {
      environment: scopeConfirmation.environment,
      scopeType: scopeConfirmation.scopeType,
      primaryRegionId: scopeConfirmation.permittedRegion.primaryRegionId,
      packageId: scopeConfirmation.permittedRegion.packageId,
      recipeId: scopeConfirmation.permittedRegion.expectedRecipeId
    },
    references: {
      dryRunReviewId: inputs.dryRunReviewRecord.reviewId,
      finalCheckId: inputs.finalCheckRecord.checkId,
      sessionDecisionId: inputs.sessionDecisionRecord.decisionId,
      preparationId: inputs.executionPreparationRecord.preparationId
    },
    authorizedUsers: operatorAuthorization.authorizedUsers.map((entry) => entry.role),
    operatorAuthorizationReference: operatorAuthorization.schemaId,
    scopeConfirmationReference: scopeConfirmation.schemaId,
    approvalConditions: {
      reviewDecision: inputs.dryRunReviewRecord.reviewDecision,
      finalReadinessState: inputs.finalCheckRecord.finalReadinessState,
      sessionDecisionState: inputs.sessionDecisionRecord.decisionState,
      conditions: inputs.decisionConditions.conditions,
      successMetrics: inputs.decisionConditions.successMetrics
    },
    preconditions: [
      "dry-run review remains approved for a future manual developer session",
      "final execution check remains in READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION state",
      "session execution decision remains GO",
      "execution preparation remains PREPARED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION",
      "runtimeExecutionEnabled remains false",
      "mapAttachmentAllowed remains false",
      "automaticRendererExecutionAllowed remains false"
    ],
    authorizationReview: {
      expiresOn: REVIEW_EXPIRY_DATE,
      reviewRequiredBeforeExecution: true,
      revalidationSources: [
        inputs.dryRunReviewRecord.reviewId,
        inputs.finalCheckRecord.checkId,
        inputs.sessionDecisionRecord.decisionId,
        inputs.executionPreparationRecord.preparationId
      ]
    },
    finalSafetyConfirmation: {
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
      "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_RECORD_001",
      inputs.dryRunReviewRecord.deterministicFingerprint,
      inputs.finalCheckRecord.deterministicFingerprint,
      inputs.sessionDecisionRecord.deterministicFingerprint,
      inputs.executionPreparationRecord.deterministicFingerprint,
      AUTHORIZATION_DATE,
      REVIEW_EXPIRY_DATE
    )
  });
}

function buildValidation(inputs, authorizationRecord, operatorAuthorization, scopeConfirmation) {
  const checks = [
    {
      name: "dry_run_review_remains_approved",
      ok:
        inputs.dryRunReviewRecord.reviewDecision ===
        "DRY_RUN_APPROVED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION"
    },
    {
      name: "final_check_and_session_decision_remain_ready",
      ok:
        inputs.finalCheckValidation.status === "pass" &&
        inputs.finalCheckRecord.finalReadinessState ===
          "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION" &&
        inputs.sessionDecisionRecord.decisionState === "GO"
    },
    {
      name: "preparation_remains_ready",
      ok:
        inputs.executionPreparationValidation.status === "pass" &&
        inputs.executionPreparationRecord.preparationDecision ===
          "PREPARED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "authorized_users_and_operator_limits_confirmed",
      ok:
        operatorAuthorization.authorizedUsers.length === 2 &&
        operatorAuthorization.maxConcurrentOperators === 2 &&
        operatorAuthorization.internalOnly === true
    },
    {
      name: "scope_confirmation_and_preconditions_defined",
      ok:
        scopeConfirmation.environment === "DEVELOPMENT_ONLY" &&
        scopeConfirmation.durationLimitMinutes === 30 &&
        authorizationRecord.preconditions.length >= 7
    },
    {
      name: "authorization_expiry_and_review_defined",
      ok:
        authorizationRecord.authorizationReview.expiresOn === REVIEW_EXPIRY_DATE &&
        authorizationRecord.authorizationReview.reviewRequiredBeforeExecution === true
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        authorizationRecord.finalSafetyConfirmation.runtimeExecutionEnabled === false &&
        authorizationRecord.finalSafetyConfirmation.mapAttachmentAllowed === false &&
        authorizationRecord.finalSafetyConfirmation.automaticRendererExecutionAllowed === false &&
        authorizationRecord.finalSafetyConfirmation.rendererAttachmentAuthorized === false &&
        authorizationRecord.finalSafetyConfirmation.mapDownloadsAuthorized === false &&
        authorizationRecord.finalSafetyConfirmation.blenderAuthorized === false &&
        authorizationRecord.finalSafetyConfirmation.glbAuthorized === false &&
        authorizationRecord.finalSafetyConfirmation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_VALIDATION_001",
    authorizationId: authorizationRecord.authorizationId,
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
      "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_VALIDATION_001",
      authorizationRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, authorizationRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_LIFECYCLE_001",
    authorizationId: authorizationRecord.authorizationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "MANUAL_SESSION_AUTHORIZED_PENDING_FUTURE_MANUAL_DEVELOPER_EXECUTION"
        : "MANUAL_SESSION_AUTHORIZATION_BLOCKED",
    authorizationState: authorizationRecord.authorizationState,
    reviewExpiry: authorizationRecord.authorizationReview.expiresOn,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_LIFECYCLE_001",
      validation.status,
      authorizationRecord.authorizationState,
      REVIEW_EXPIRY_DATE
    )
  });
}

function buildReport(
  authorizationRecord,
  operatorAuthorization,
  scopeConfirmation,
  validation,
  lifecycle
) {
  return `# ATLAS DEVELOPER ALPHA MANUAL SESSION AUTHORIZATION

## Goal

Create the final authorization package for a future manual developer-only Atlas alpha session after successful review and rehearsal.

## Authorization

- authorization id: ${authorizationRecord.authorizationId}
- authorized on: ${authorizationRecord.authorizedOn}
- authorization state: ${authorizationRecord.authorizationState}
- lifecycle status: ${lifecycle.lifecycleStatus}
- review expiry: ${authorizationRecord.authorizationReview.expiresOn}

## Authorized Users

${operatorAuthorization.authorizedUsers
  .map((entry) => `- ${entry.role}: ${entry.authorizationState}`)
  .join("\n")}

## Scope Confirmation

- environment: ${scopeConfirmation.environment}
- scope type: ${scopeConfirmation.scopeType}
- primary region: ${scopeConfirmation.permittedRegion.primaryRegionId}
- package: ${scopeConfirmation.permittedRegion.packageId}
- recipe: ${scopeConfirmation.permittedRegion.expectedRecipeId}
- duration limit minutes: ${scopeConfirmation.durationLimitMinutes}

## Preconditions

${authorizationRecord.preconditions.map((item) => `- ${item}`).join("\n")}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false
- blenderAuthorized: false
- glbAuthorized: false
- assetModificationAuthorized: false

## Final Authorization State

Developer alpha manual session authorization state: ${
    validation.status === "pass"
      ? "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaManualSessionAuthorization({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const scopeConfirmation = buildScopeConfirmation(inputs);
  const operatorAuthorization = buildOperatorAuthorization(inputs);
  const authorizationRecord = buildAuthorizationRecord(
    inputs,
    operatorAuthorization,
    scopeConfirmation
  );
  const validation = buildValidation(
    inputs,
    authorizationRecord,
    operatorAuthorization,
    scopeConfirmation
  );
  const lifecycle = buildLifecycle(validation, authorizationRecord);
  const report = buildReport(
    authorizationRecord,
    operatorAuthorization,
    scopeConfirmation,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, AUTHORIZATION_ROOT),
    authorizationRecord,
    operatorAuthorization,
    scopeConfirmation,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaManualSessionAuthorization({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaManualSessionAuthorization({ cwd });
  const authorizationDir = path.join(result.root, "authorization");
  const operatorsDir = path.join(result.root, "operators");
  const scopeDir = path.join(result.root, "scope");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    authorizationDir,
    operatorsDir,
    scopeDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(authorizationDir, AUTHORIZATION_RECORD_FILENAME),
    result.authorizationRecord
  );
  writeJson(
    path.join(operatorsDir, OPERATOR_AUTHORIZATION_FILENAME),
    result.operatorAuthorization
  );
  writeJson(
    path.join(scopeDir, SCOPE_CONFIRMATION_FILENAME),
    result.scopeConfirmation
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
  writeAtlasDeveloperAlphaManualSessionAuthorization();
}
