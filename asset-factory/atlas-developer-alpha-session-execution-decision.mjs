import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const DECISION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001";

const DECISION_RECORD_FILENAME =
  "atlas-developer-alpha-session-execution-decision-record.json";
const RATIONALE_FILENAME = "atlas-developer-alpha-session-decision-rationale.json";
const AUTHORIZATION_FILENAME =
  "atlas-developer-alpha-operator-authorization-record.json";
const SCOPE_FILENAME =
  "atlas-developer-alpha-session-scope-confirmation.json";
const CONDITIONS_FILENAME =
  "atlas-developer-alpha-session-approval-conditions.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-decision-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-decision-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-session-decision-report.md";

const PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const PREPARATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/validation/atlas-developer-alpha-execution-preparation-validation.json";
const PREPARATION_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/lifecycle/atlas-developer-alpha-execution-preparation-lifecycle.json";
const EXECUTION_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/review/atlas-developer-alpha-execution-review-record.json";
const EXECUTION_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/validation/atlas-developer-alpha-execution-review-validation.json";
const GO_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/decision/atlas-developer-alpha-go-no-go-decision-record.json";
const GO_CONDITIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001/conditions/atlas-developer-alpha-conditions-of-approval.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

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
    preparationRecord: readJson(cwd, PREPARATION_RECORD_PATH),
    preparationValidation: readJson(cwd, PREPARATION_VALIDATION_PATH),
    preparationLifecycle: readJson(cwd, PREPARATION_LIFECYCLE_PATH),
    executionReviewRecord: readJson(cwd, EXECUTION_REVIEW_RECORD_PATH),
    executionReviewValidation: readJson(cwd, EXECUTION_REVIEW_VALIDATION_PATH),
    goRecord: readJson(cwd, GO_RECORD_PATH),
    goConditions: readJson(cwd, GO_CONDITIONS_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function determineDecisionState(inputs) {
  if (
    inputs.preparationValidation.status === "pass" &&
    inputs.executionReviewValidation.status === "pass" &&
    inputs.goRecord.decisionState === "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY" &&
    inputs.finalAuditValidation.status === "pass"
  ) {
    return "GO";
  }
  if (
    inputs.preparationValidation.status === "fail" ||
    inputs.finalAuditValidation.status === "fail"
  ) {
    return "CANCEL";
  }
  return "HOLD";
}

function buildDecisionRecord(inputs) {
  const decisionState = determineDecisionState(inputs);

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_RECORD_001",
    decisionId: "ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001",
    decidedOn: DECISION_DATE,
    decisionState,
    decisionMode: "manual_internal_session_authorization",
    references: {
      preparationId: inputs.preparationRecord.preparationId,
      executionReviewId: inputs.executionReviewRecord.reviewId,
      goNoGoRecordId: inputs.goRecord.recordId,
      finalSafetyAuditId: inputs.finalAuditValidation.auditId
    },
    sessionTarget: {
      environment: inputs.preparationRecord.sessionEnvironment.environment,
      regionId:
        inputs.preparationRecord.sessionEnvironment.permittedRegion.primaryRegionId,
      packageId: inputs.preparationRecord.packageSnapshot.packageId,
      recipeId: inputs.preparationRecord.recipeSnapshot.expectedRecipeId
    },
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001",
      inputs.preparationRecord.deterministicFingerprint,
      inputs.executionReviewRecord.deterministicFingerprint,
      inputs.goRecord.deterministicFingerprint,
      decisionState,
      DECISION_DATE
    )
  });
}

function buildDecisionRationale(inputs, decisionRecord) {
  const rationaleByState = {
    GO: "Preparation, execution review, go/no-go, and final safety audit all pass, so the future developer-only session is authorized to remain on standby for manual execution.",
    HOLD: "One or more supporting records need reconfirmation before the future developer-only session can be authorized.",
    CANCEL:
      "A required preparation or safety validation failed, so the future developer-only session must not proceed."
  };

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_RATIONALE_001",
    decisionId: decisionRecord.decisionId,
    rationaleSummary: rationaleByState[decisionRecord.decisionState],
    supportingEvidence: [
      `preparation validation: ${inputs.preparationValidation.status}`,
      `execution review validation: ${inputs.executionReviewValidation.status}`,
      `go/no-go state: ${inputs.goRecord.decisionState}`,
      `final safety audit: ${inputs.finalAuditValidation.status}`
    ],
    preservedGuards: [
      "runtimeExecutionEnabled remains false",
      "mapAttachmentAllowed remains false",
      "automaticRendererExecutionAllowed remains false",
      "renderer attachment remains blocked",
      "map downloads remain blocked"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_RATIONALE_001",
      decisionRecord.deterministicFingerprint,
      JSON.stringify([
        inputs.preparationValidation.status,
        inputs.executionReviewValidation.status,
        inputs.goRecord.decisionState,
        inputs.finalAuditValidation.status
      ])
    )
  });
}

function buildOperatorAuthorizationRecord(inputs, decisionRecord) {
  const authorized =
    decisionRecord.decisionState === "GO"
      ? ["atlas_operator", "internal_developer_reviewer"]
      : [];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_OPERATOR_AUTHORIZATION_RECORD_001",
    decisionId: decisionRecord.decisionId,
    authorizationMode: "manual_internal_roles_only",
    authorizedRoles: authorized,
    blockedRoles: ["beta_tester", "live_player", "external_reviewer"],
    maxConcurrentOperators:
      inputs.executionReviewRecord.authorizedUsers.maxConcurrentTestUsers,
    playerAccountsAllowed: false,
    internalOnly: true,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_OPERATOR_AUTHORIZATION_RECORD_001",
      decisionRecord.deterministicFingerprint,
      JSON.stringify(authorized)
    )
  });
}

function buildSessionScopeConfirmation(inputs, decisionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_SCOPE_CONFIRMATION_001",
    decisionId: decisionRecord.decisionId,
    environment: inputs.preparationRecord.sessionEnvironment.environment,
    scopeType: inputs.preparationRecord.sessionEnvironment.scopeType,
    permittedRegion:
      inputs.preparationRecord.sessionEnvironment.permittedRegion,
    allowedActions: inputs.preparationRecord.sessionEnvironment.allowedActions,
    blockedActions: inputs.preparationRecord.sessionEnvironment.blockedActions,
    durationLimitMinutes: 30,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_SCOPE_CONFIRMATION_001",
      decisionRecord.deterministicFingerprint,
      inputs.preparationRecord.sessionEnvironment.permittedRegion.primaryRegionId
    )
  });
}

function buildApprovalConditions(inputs, decisionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_APPROVAL_CONDITIONS_001",
    decisionId: decisionRecord.decisionId,
    decisionState: decisionRecord.decisionState,
    conditions: [
      ...inputs.goConditions.conditions,
      "session remains developer-only and internal-only",
      "session uses the captured package snapshot and recipe snapshot only",
      "session remains limited to metadata inspection and monitoring review",
      "no runtime, renderer, map download, Blender, GLB, or asset mutation work is authorized"
    ],
    successMetrics: inputs.preparationRecord.successMetrics,
    stopAuthority: inputs.preparationRecord.stopAuthority,
    rollbackReadiness: inputs.preparationRecord.rollbackReadiness,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_APPROVAL_CONDITIONS_001",
      decisionRecord.deterministicFingerprint,
      JSON.stringify(inputs.preparationRecord.stopAuthority.stopConditions)
    )
  });
}

function buildValidation(
  inputs,
  decisionRecord,
  rationale,
  authorization,
  scopeConfirmation,
  approvalConditions
) {
  const checks = [
    {
      name: "preparation_supports_decision",
      ok:
        inputs.preparationValidation.status === "pass" &&
        inputs.preparationLifecycle.lifecycleStatus ===
          "FINAL_PREPARATION_COMPLETE_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "review_and_go_no_go_support_decision",
      ok:
        inputs.executionReviewValidation.status === "pass" &&
        inputs.goRecord.decisionState ===
          "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY"
    },
    {
      name: "final_audit_supports_decision",
      ok: inputs.finalAuditValidation.status === "pass"
    },
    {
      name: "decision_rationale_authorization_and_scope_defined",
      ok:
        rationale.supportingEvidence.length >= 4 &&
        authorization.internalOnly === true &&
        scopeConfirmation.environment === "DEVELOPMENT_ONLY"
    },
    {
      name: "approval_conditions_defined",
      ok:
        approvalConditions.conditions.length >= 10 &&
        approvalConditions.successMetrics.length >= 4 &&
        approvalConditions.stopAuthority.stopConditions.length >= 5
    },
    {
      name: "decision_state_is_go_hold_or_cancel",
      ok: ["GO", "HOLD", "CANCEL"].includes(decisionRecord.decisionState)
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.preparationRecord.featureFlagSnapshot.runtimeExecutionEnabled ===
          false &&
        inputs.preparationRecord.featureFlagSnapshot.mapAttachmentAllowed ===
          false &&
        inputs.preparationRecord.featureFlagSnapshot
          .automaticRendererExecutionAllowed === false &&
        inputs.finalAuditValidation.rendererAttachmentAuthorized === false &&
        inputs.finalAuditValidation.mapDownloadsAuthorized === false &&
        inputs.finalAuditValidation.blenderAuthorized === false &&
        inputs.finalAuditValidation.glbAuthorized === false &&
        inputs.finalAuditValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_VALIDATION_001",
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_VALIDATION_001",
      decisionRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, decisionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_LIFECYCLE_001",
    decisionId: decisionRecord.decisionId,
    decisionState: decisionRecord.decisionState,
    lifecycleStatus:
      validation.status === "pass" && decisionRecord.decisionState === "GO"
        ? "SESSION_DECISION_GO_RECORDED_PENDING_FUTURE_MANUAL_EXECUTION"
        : validation.status === "pass" && decisionRecord.decisionState === "HOLD"
          ? "SESSION_DECISION_ON_HOLD"
          : validation.status === "pass" && decisionRecord.decisionState === "CANCEL"
            ? "SESSION_DECISION_CANCELLED"
            : "SESSION_DECISION_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_DECISION_LIFECYCLE_001",
      validation.status,
      decisionRecord.decisionState,
      DECISION_DATE
    )
  });
}

function buildReport(decisionRecord, validation, lifecycle, scopeConfirmation) {
  return `# ATLAS DEVELOPER ALPHA SESSION EXECUTION DECISION

## Goal

Create the formal decision record for the prepared developer-only Atlas alpha session.

## Decision

- decision id: ${decisionRecord.decisionId}
- decided on: ${decisionRecord.decidedOn}
- decision state: ${decisionRecord.decisionState}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Session Scope

- environment: ${scopeConfirmation.environment}
- scope type: ${scopeConfirmation.scopeType}
- primary region: ${scopeConfirmation.permittedRegion.primaryRegionId}
- package: ${scopeConfirmation.permittedRegion.packageId}
- recipe: ${scopeConfirmation.permittedRegion.expectedRecipeId}

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

## Final Decision State

Developer alpha session execution decision: ${decisionRecord.decisionState}
`;
}

export function buildAtlasDeveloperAlphaSessionExecutionDecision({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const decisionRecord = buildDecisionRecord(inputs);
  const rationale = buildDecisionRationale(inputs, decisionRecord);
  const authorization = buildOperatorAuthorizationRecord(inputs, decisionRecord);
  const scopeConfirmation = buildSessionScopeConfirmation(inputs, decisionRecord);
  const approvalConditions = buildApprovalConditions(inputs, decisionRecord);
  const validation = buildValidation(
    inputs,
    decisionRecord,
    rationale,
    authorization,
    scopeConfirmation,
    approvalConditions
  );
  const lifecycle = buildLifecycle(validation, decisionRecord);
  const report = buildReport(
    decisionRecord,
    validation,
    lifecycle,
    scopeConfirmation
  );

  return deepFreeze({
    root: path.resolve(cwd, DECISION_ROOT),
    decisionRecord,
    rationale,
    authorization,
    scopeConfirmation,
    approvalConditions,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionExecutionDecision({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionExecutionDecision({ cwd });
  const decisionDir = path.join(result.root, "decision");
  const rationaleDir = path.join(result.root, "rationale");
  const authorizationDir = path.join(result.root, "authorization");
  const scopeDir = path.join(result.root, "scope");
  const conditionsDir = path.join(result.root, "conditions");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    decisionDir,
    rationaleDir,
    authorizationDir,
    scopeDir,
    conditionsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(decisionDir, DECISION_RECORD_FILENAME), result.decisionRecord);
  writeJson(path.join(rationaleDir, RATIONALE_FILENAME), result.rationale);
  writeJson(
    path.join(authorizationDir, AUTHORIZATION_FILENAME),
    result.authorization
  );
  writeJson(path.join(scopeDir, SCOPE_FILENAME), result.scopeConfirmation);
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
  writeAtlasDeveloperAlphaSessionExecutionDecision();
}
