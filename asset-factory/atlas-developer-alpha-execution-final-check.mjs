import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const FINAL_CHECK_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001";

const FINAL_CHECK_RECORD_FILENAME =
  "atlas-developer-alpha-final-check-record.json";
const CHECKLIST_FILENAME = "atlas-developer-alpha-verification-checklist.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-final-check-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-final-check-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-final-check-report.md";

const SESSION_DECISION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/decision/atlas-developer-alpha-session-execution-decision-record.json";
const SESSION_DECISION_CONDITIONS_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/conditions/atlas-developer-alpha-session-approval-conditions.json";
const SESSION_DECISION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-decision/ATLAS_DEVELOPER_ALPHA_SESSION_EXECUTION_DECISION_001/validation/atlas-developer-alpha-session-decision-validation.json";
const PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const PREPARATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/validation/atlas-developer-alpha-execution-preparation-validation.json";
const EXECUTION_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/review/atlas-developer-alpha-execution-review-record.json";
const EXECUTION_REVIEW_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-review/ATLAS_DEVELOPER_ALPHA_EXECUTION_REVIEW_001/validation/atlas-developer-alpha-execution-review-validation.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

const RECORD_DATE = "2026-07-30";
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

function fileExists(cwd, relativePath) {
  return fs.existsSync(path.resolve(cwd, relativePath));
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function getGitStatus(cwd) {
  const repoRoot = path.resolve(cwd);
  const stdout = execFileSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  return stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function loadInputs(cwd) {
  return deepFreeze({
    sessionDecisionRecord: readJson(cwd, SESSION_DECISION_RECORD_PATH),
    sessionDecisionConditions: readJson(cwd, SESSION_DECISION_CONDITIONS_PATH),
    sessionDecisionValidation: readJson(cwd, SESSION_DECISION_VALIDATION_PATH),
    preparationRecord: readJson(cwd, PREPARATION_RECORD_PATH),
    preparationValidation: readJson(cwd, PREPARATION_VALIDATION_PATH),
    executionReviewRecord: readJson(cwd, EXECUTION_REVIEW_RECORD_PATH),
    executionReviewValidation: readJson(cwd, EXECUTION_REVIEW_VALIDATION_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH),
    repositoryStatus: getGitStatus(cwd)
  });
}

function buildVerificationChecklist(cwd, inputs) {
  const requiredRecords = [
    SESSION_DECISION_RECORD_PATH,
    SESSION_DECISION_CONDITIONS_PATH,
    SESSION_DECISION_VALIDATION_PATH,
    PREPARATION_RECORD_PATH,
    PREPARATION_VALIDATION_PATH,
    EXECUTION_REVIEW_RECORD_PATH,
    EXECUTION_REVIEW_VALIDATION_PATH,
    FINAL_AUDIT_VALIDATION_PATH
  ];

  const missingRecords = requiredRecords.filter(
    (relativePath) => !fileExists(cwd, relativePath)
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_CHECKLIST_001",
    checkId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001",
    recordedOn: RECORD_DATE,
    repositoryStatus: {
      gitStatusCaptured: true,
      statusLines: inputs.repositoryStatus,
      readinessState: "REPOSITORY_STATE_CAPTURED_FOR_MANUAL_PRE_FLIGHT"
    },
    items: [
      {
        itemId: "CHECK_REPOSITORY_READINESS",
        area: "repository_readiness",
        status: "PASS",
        evidence: `Repository status captured with ${inputs.repositoryStatus.length} pending change line(s).`
      },
      {
        itemId: "CHECK_REQUIRED_RECORDS",
        area: "required_records",
        status: missingRecords.length === 0 ? "PASS" : "FAIL",
        evidence:
          missingRecords.length === 0
            ? "All required decision, preparation, review, and final audit records exist."
            : `Missing records: ${missingRecords.join(", ")}`
      },
      {
        itemId: "CHECK_SAFETY_FLAGS",
        area: "safety_flags",
        status:
          inputs.sessionDecisionRecord.runtimeFlags.runtimeExecutionEnabled === false &&
          inputs.sessionDecisionRecord.runtimeFlags.mapAttachmentAllowed === false &&
          inputs.sessionDecisionRecord.runtimeFlags
            .automaticRendererExecutionAllowed === false
            ? "PASS"
            : "FAIL",
        evidence:
          "runtimeExecutionEnabled, mapAttachmentAllowed, and automaticRendererExecutionAllowed remain false."
      },
      {
        itemId: "CHECK_ALPHA_SCOPE",
        area: "alpha_scope",
        status:
          inputs.sessionDecisionRecord.sessionTarget.regionId ===
            inputs.preparationRecord.sessionEnvironment.permittedRegion
              .primaryRegionId &&
          inputs.sessionDecisionRecord.sessionTarget.recipeId ===
            inputs.preparationRecord.recipeSnapshot.expectedRecipeId
            ? "PASS"
            : "FAIL",
        evidence:
          "Decision target region and recipe match the prepared developer-only session scope."
      },
      {
        itemId: "CHECK_MONITORING_READINESS",
        area: "monitoring_readiness",
        status:
          inputs.preparationRecord.monitoringPreparation.monitoringChecklist
            .length >= 5 &&
          inputs.preparationRecord.monitoringPreparation.monitoringFocus
            .healthyReference != null
            ? "PASS"
            : "FAIL",
        evidence:
          "Monitoring checklist and monitoring focus references remain present."
      },
      {
        itemId: "CHECK_ROLLBACK_READINESS",
        area: "rollback_readiness",
        status:
          inputs.preparationRecord.rollbackReadiness.status === "PASS" &&
          inputs.sessionDecisionConditions.rollbackReadiness.status === "PASS"
            ? "PASS"
            : "FAIL",
        evidence:
          "Rollback readiness remains PASS in both preparation and session approval conditions."
      },
      {
        itemId: "CHECK_APPROVAL_CONDITIONS",
        area: "approval_conditions",
        status:
          inputs.sessionDecisionConditions.conditions.length >= 10 &&
          inputs.sessionDecisionConditions.stopAuthority.stopConditions.length >= 5
            ? "PASS"
            : "FAIL",
        evidence:
          "Approval conditions, stop authority, and stop conditions remain intact."
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_CHECKLIST_001",
      inputs.sessionDecisionRecord.deterministicFingerprint,
      inputs.preparationRecord.deterministicFingerprint,
      JSON.stringify(inputs.repositoryStatus),
      RECORD_DATE
    )
  });
}

function buildFinalCheckRecord(inputs, checklist) {
  const passed = checklist.items.every((item) => item.status === "PASS");

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_RECORD_001",
    checkId: "ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001",
    verifiedOn: RECORD_DATE,
    references: {
      sessionDecisionId: inputs.sessionDecisionRecord.decisionId,
      preparationId: inputs.preparationRecord.preparationId,
      executionReviewId: inputs.executionReviewRecord.reviewId,
      finalSafetyAuditId: inputs.finalAuditValidation.auditId
    },
    repositoryReadiness: checklist.repositoryStatus,
    sessionDecisionState: inputs.sessionDecisionRecord.decisionState,
    alphaScope: {
      environment: inputs.sessionDecisionRecord.sessionTarget.environment,
      regionId: inputs.sessionDecisionRecord.sessionTarget.regionId,
      packageId: inputs.sessionDecisionRecord.sessionTarget.packageId,
      recipeId: inputs.sessionDecisionRecord.sessionTarget.recipeId
    },
    safetyFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    monitoringReadiness: inputs.preparationRecord.monitoringPreparation,
    rollbackReadiness: inputs.preparationRecord.rollbackReadiness,
    approvalConditionsIntact:
      inputs.sessionDecisionConditions.conditions.length >= 10 &&
      inputs.sessionDecisionConditions.stopAuthority.stopConditions.length >= 5,
    finalReadinessState: passed
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "NOT_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION",
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001",
      checklist.deterministicFingerprint,
      inputs.finalAuditValidation.deterministicFingerprint,
      inputs.sessionDecisionValidation.deterministicFingerprint
    )
  });
}

function buildValidation(inputs, checklist, finalCheckRecord) {
  const checks = [
    {
      name: "repository_readiness_captured",
      ok: checklist.repositoryStatus.gitStatusCaptured === true
    },
    {
      name: "required_records_exist",
      ok:
        checklist.items.find((item) => item.area === "required_records")?.status ===
        "PASS"
    },
    {
      name: "safety_flags_remain_disabled",
      ok:
        checklist.items.find((item) => item.area === "safety_flags")?.status ===
          "PASS" &&
        inputs.finalAuditValidation.rendererAttachmentAuthorized === false &&
        inputs.finalAuditValidation.mapDownloadsAuthorized === false &&
        inputs.finalAuditValidation.blenderAuthorized === false &&
        inputs.finalAuditValidation.glbAuthorized === false &&
        inputs.finalAuditValidation.assetModificationAuthorized === false
    },
    {
      name: "alpha_scope_unchanged",
      ok: checklist.items.find((item) => item.area === "alpha_scope")?.status === "PASS"
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
      name: "approval_conditions_intact",
      ok:
        checklist.items.find((item) => item.area === "approval_conditions")?.status ===
          "PASS" &&
        inputs.sessionDecisionRecord.decisionState === "GO"
    },
    {
      name: "final_readiness_reaches_ready_state",
      ok:
        finalCheckRecord.finalReadinessState ===
        "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.sessionDecisionRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        inputs.sessionDecisionRecord.runtimeFlags.mapAttachmentAllowed === false &&
        inputs.sessionDecisionRecord.runtimeFlags
          .automaticRendererExecutionAllowed === false &&
        inputs.finalAuditValidation.rendererAttachmentAuthorized === false &&
        inputs.finalAuditValidation.mapDownloadsAuthorized === false &&
        inputs.finalAuditValidation.blenderAuthorized === false &&
        inputs.finalAuditValidation.glbAuthorized === false &&
        inputs.finalAuditValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_VALIDATION_001",
    checkId: finalCheckRecord.checkId,
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
      "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_VALIDATION_001",
      finalCheckRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, finalCheckRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_LIFECYCLE_001",
    checkId: finalCheckRecord.checkId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FINAL_CHECK_COMPLETE_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "FINAL_CHECK_BLOCKED",
    finalReadinessState: finalCheckRecord.finalReadinessState,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_FINAL_CHECK_LIFECYCLE_001",
      validation.status,
      finalCheckRecord.finalReadinessState,
      RECORD_DATE
    )
  });
}

function buildReport(finalCheckRecord, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA EXECUTION FINAL CHECK

## Goal

Perform the final verification before a future manual developer-only Atlas alpha session.

## Final Check

- check id: ${finalCheckRecord.checkId}
- verified on: ${finalCheckRecord.verifiedOn}
- decision state: ${finalCheckRecord.sessionDecisionState}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Scope

- environment: ${finalCheckRecord.alphaScope.environment}
- region: ${finalCheckRecord.alphaScope.regionId}
- package: ${finalCheckRecord.alphaScope.packageId}
- recipe: ${finalCheckRecord.alphaScope.recipeId}

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

## Final Readiness

Developer alpha final readiness state: ${finalCheckRecord.finalReadinessState}
`;
}

export function buildAtlasDeveloperAlphaExecutionFinalCheck({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const checklist = buildVerificationChecklist(cwd, inputs);
  const finalCheckRecord = buildFinalCheckRecord(inputs, checklist);
  const validation = buildValidation(inputs, checklist, finalCheckRecord);
  const lifecycle = buildLifecycle(validation, finalCheckRecord);
  const report = buildReport(finalCheckRecord, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, FINAL_CHECK_ROOT),
    finalCheckRecord,
    checklist,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaExecutionFinalCheck({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaExecutionFinalCheck({ cwd });
  const recordDir = path.join(result.root, "record");
  const checklistDir = path.join(result.root, "checklist");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    recordDir,
    checklistDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(recordDir, FINAL_CHECK_RECORD_FILENAME), result.finalCheckRecord);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.checklist);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaExecutionFinalCheck();
}
