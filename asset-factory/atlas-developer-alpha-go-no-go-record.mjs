import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECORD_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-go-no-go/ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001";

const DECISION_FILENAME = "atlas-developer-alpha-go-no-go-decision-record.json";
const REVIEWER_FILENAME = "atlas-developer-alpha-reviewer-record.json";
const SCOPE_FILENAME = "atlas-developer-alpha-approved-scope-record.json";
const RATIONALE_FILENAME = "atlas-developer-alpha-decision-rationale.json";
const CONDITIONS_FILENAME = "atlas-developer-alpha-conditions-of-approval.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-go-no-go-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-go-no-go-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-go-no-go-report.md";

const DECISION_FRAMEWORK_PATH =
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001/framework/atlas-developer-alpha-decision-framework.json";
const EXPERIMENT_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001/experiment/atlas-developer-alpha-experiment-specification.json";
const DECISION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001/validation/atlas-developer-alpha-decision-validation.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

const DECISION_DATE = "2026-07-30";

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
    framework: readJson(cwd, DECISION_FRAMEWORK_PATH),
    experimentSpecification: readJson(cwd, EXPERIMENT_SPECIFICATION_PATH),
    decisionValidation: readJson(cwd, DECISION_VALIDATION_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH)
  });
}

function buildDecisionRecord(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_DECISION_RECORD_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    decisionId: inputs.framework.decisionId,
    decisionDate: DECISION_DATE,
    decisionState: "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY",
    decisionMode: "manual_internal_review",
    finalAuditStatus: inputs.finalAuditValidation.status,
    decisionValidationStatus: inputs.decisionValidation.status,
    experimentState: inputs.experimentSpecification.experimentState,
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
      inputs.framework.deterministicFingerprint,
      inputs.experimentSpecification.deterministicFingerprint,
      DECISION_DATE
    )
  });
}

function buildReviewerRecord(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_REVIEWER_RECORD_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    reviewerRoles: ["atlas_operator", "internal_developer_reviewer"],
    reviewMode: "manual_dual_role_internal_review",
    approvalRequirement:
      "both reviewer roles must remain internal and developer-only",
    reviewDate: DECISION_DATE,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_REVIEWER_RECORD_001",
      JSON.stringify(["atlas_operator", "internal_developer_reviewer"]),
      DECISION_DATE
    )
  });
}

function buildApprovedScopeRecord(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_APPROVED_SCOPE_RECORD_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    environment: inputs.framework.alphaExperimentScope.environment,
    scopeType: inputs.framework.alphaExperimentScope.scopeType,
    permittedRegion: inputs.framework.permittedTestRegion,
    testUserBoundaries: inputs.framework.testUserBoundaries,
    allowedActions: inputs.framework.alphaExperimentScope.allowedActions,
    blockedActions: inputs.framework.alphaExperimentScope.blockedActions,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_APPROVED_SCOPE_RECORD_001",
      inputs.framework.permittedTestRegion.primaryRegionId,
      JSON.stringify(inputs.framework.alphaExperimentScope.allowedActions)
    )
  });
}

function buildDecisionRationale(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DECISION_RATIONALE_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    rationaleSummary:
      "Proceed to a tiny developer-only go/no-go review because the final alpha safety audit passed and runtime remains fully disabled.",
    supportingReasons: [
      "final alpha safety audit passed",
      "developer alpha decision validation passed",
      "permitted scope is limited to one internal primary region",
      "rollback owner and failure criteria are already defined"
    ],
    blockedCapabilitiesReminder: [
      "runtime activation remains blocked",
      "renderer attachment remains blocked",
      "map downloads remain blocked",
      "asset modification remains blocked"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_DECISION_RATIONALE_001",
      inputs.finalAuditValidation.deterministicFingerprint,
      inputs.decisionValidation.deterministicFingerprint
    )
  });
}

function buildConditionsOfApproval(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONDITIONS_OF_APPROVAL_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    conditions: [
      "runtimeExecutionEnabled must remain false",
      "mapAttachmentAllowed must remain false",
      "automaticRendererExecutionAllowed must remain false",
      "test remains developer-only and internal-only",
      "experiment stays within the single approved primary region",
      "experiment duration must not exceed 30 minutes",
      "manual rollback owner must remain available",
      "any failure criteria immediately returns to planning-only state"
    ],
    successMetrics: inputs.framework.successMetrics,
    failureCriteria: inputs.framework.failureCriteria,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONDITIONS_OF_APPROVAL_001",
      JSON.stringify(inputs.framework.successMetrics),
      JSON.stringify(inputs.framework.failureCriteria)
    )
  });
}

function buildValidation(
  inputs,
  decisionRecord,
  reviewerRecord,
  approvedScopeRecord,
  rationale,
  conditions
) {
  const checks = [
    {
      name: "decision_framework_preserved",
      ok:
        inputs.decisionValidation.status === "pass" &&
        inputs.finalAuditValidation.status === "pass"
    },
    {
      name: "go_decision_recorded",
      ok:
        decisionRecord.decisionState ===
          "GO_FOR_TINY_DEVELOPER_ALPHA_REVIEW_ONLY" &&
        decisionRecord.decisionDate === DECISION_DATE
    },
    {
      name: "reviewer_record_defined",
      ok:
        reviewerRecord.reviewerRoles.length === 2 &&
        reviewerRecord.reviewerRoles.includes("atlas_operator") &&
        reviewerRecord.reviewerRoles.includes("internal_developer_reviewer")
    },
    {
      name: "approved_scope_preserved",
      ok:
        approvedScopeRecord.environment === "DEVELOPMENT_ONLY" &&
        approvedScopeRecord.testUserBoundaries.playerAccountsAllowed === false
    },
    {
      name: "rationale_and_conditions_defined",
      ok:
        rationale.supportingReasons.length >= 4 &&
        conditions.conditions.length >= 8
    },
    {
      name: "runtime_flags_preserved",
      ok:
        decisionRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        decisionRecord.runtimeFlags.mapAttachmentAllowed === false &&
        decisionRecord.runtimeFlags.automaticRendererExecutionAllowed === false
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.decisionValidation.runtimeExecutionEnabled === false &&
        inputs.decisionValidation.mapAttachmentAllowed === false &&
        inputs.decisionValidation.automaticRendererExecutionAllowed === false &&
        inputs.decisionValidation.rendererAttachmentAuthorized === false &&
        inputs.decisionValidation.mapDownloadsAuthorized === false &&
        inputs.decisionValidation.blenderAuthorized === false &&
        inputs.decisionValidation.glbAuthorized === false &&
        inputs.decisionValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_VALIDATION_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
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
      "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_VALIDATION_001",
      JSON.stringify(checks),
      decisionRecord.deterministicFingerprint
    )
  });
}

function buildLifecycle(validation, decisionRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_LIFECYCLE_001",
    recordId: "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_001",
    lifecycleStatus:
      validation.status === "pass"
        ? "GO_RECORDED_PENDING_FUTURE_MANUAL_EXECUTION_REVIEW"
        : "GO_NO_GO_RECORD_BLOCKED",
    decisionState: decisionRecord.decisionState,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_GO_NO_GO_LIFECYCLE_001",
      validation.status,
      decisionRecord.decisionState
    )
  });
}

function buildReport(
  decisionRecord,
  reviewerRecord,
  approvedScopeRecord,
  validation,
  lifecycle
) {
  return `# ATLAS DEVELOPER ALPHA GO / NO-GO RECORD

## Goal

Create the formal manual decision record for the developer-only Atlas alpha experiment.

## Decision

- record id: ${decisionRecord.recordId}
- decision date: ${decisionRecord.decisionDate}
- decision state: ${decisionRecord.decisionState}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Reviewer Roles

${reviewerRecord.reviewerRoles.map((role) => `- ${role}`).join("\n")}

## Approved Scope

- environment: ${approvedScopeRecord.environment}
- region: ${approvedScopeRecord.permittedRegion.primaryRegionId}
- user boundary: internal only

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

## Decision State

Developer alpha go/no-go decision state: ${
    validation.status === "pass"
      ? "GO_RECORDED_FOR_DEVELOPER_ONLY_REVIEW"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaGoNoGoRecord({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const decisionRecord = buildDecisionRecord(inputs);
  const reviewerRecord = buildReviewerRecord(inputs);
  const approvedScopeRecord = buildApprovedScopeRecord(inputs);
  const rationale = buildDecisionRationale(inputs);
  const conditions = buildConditionsOfApproval(inputs);
  const validation = buildValidation(
    inputs,
    decisionRecord,
    reviewerRecord,
    approvedScopeRecord,
    rationale,
    conditions
  );
  const lifecycle = buildLifecycle(validation, decisionRecord);
  const report = buildReport(
    decisionRecord,
    reviewerRecord,
    approvedScopeRecord,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, RECORD_ROOT),
    decisionRecord,
    reviewerRecord,
    approvedScopeRecord,
    rationale,
    conditions,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaGoNoGoRecord({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasDeveloperAlphaGoNoGoRecord({ cwd });
  const decisionDir = path.join(result.root, "decision");
  const reviewerDir = path.join(result.root, "reviewer");
  const scopeDir = path.join(result.root, "scope");
  const rationaleDir = path.join(result.root, "rationale");
  const conditionsDir = path.join(result.root, "conditions");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    decisionDir,
    reviewerDir,
    scopeDir,
    rationaleDir,
    conditionsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(decisionDir, DECISION_FILENAME), result.decisionRecord);
  writeJson(path.join(reviewerDir, REVIEWER_FILENAME), result.reviewerRecord);
  writeJson(path.join(scopeDir, SCOPE_FILENAME), result.approvedScopeRecord);
  writeJson(path.join(rationaleDir, RATIONALE_FILENAME), result.rationale);
  writeJson(path.join(conditionsDir, CONDITIONS_FILENAME), result.conditions);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaGoNoGoRecord();
}
