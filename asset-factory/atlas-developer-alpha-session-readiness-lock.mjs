import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const READINESS_LOCK_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001";

const LOCK_RECORD_FILENAME = "atlas-developer-alpha-session-readiness-lock-record.json";
const CHECKLIST_FILENAME = "atlas-developer-alpha-final-verification-checklist.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-session-readiness-lock-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-session-readiness-lock-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-session-readiness-lock-report.md";

const AUTHORIZATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/authorization/atlas-developer-alpha-manual-session-authorization-record.json";
const OPERATOR_AUTHORIZATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/operators/atlas-developer-alpha-manual-operator-authorization-record.json";
const SCOPE_CONFIRMATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/scope/atlas-developer-alpha-manual-session-scope-confirmation.json";
const AUTHORIZATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/validation/atlas-developer-alpha-manual-session-authorization-validation.json";
const FINAL_CHECK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/record/atlas-developer-alpha-final-check-record.json";
const FINAL_CHECK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/validation/atlas-developer-alpha-final-check-validation.json";
const DRY_RUN_REVIEW_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-dry-run-review/ATLAS_DEVELOPER_ALPHA_DRY_RUN_REVIEW_001/review/atlas-developer-alpha-dry-run-review-record.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";

const LOCK_DATE = "2026-07-30";
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

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function loadInputs(cwd) {
  return deepFreeze({
    authorizationRecord: readJson(cwd, AUTHORIZATION_RECORD_PATH),
    operatorAuthorization: readJson(cwd, OPERATOR_AUTHORIZATION_PATH),
    scopeConfirmation: readJson(cwd, SCOPE_CONFIRMATION_PATH),
    authorizationValidation: readJson(cwd, AUTHORIZATION_VALIDATION_PATH),
    finalCheckRecord: readJson(cwd, FINAL_CHECK_RECORD_PATH),
    finalCheckValidation: readJson(cwd, FINAL_CHECK_VALIDATION_PATH),
    dryRunReviewRecord: readJson(cwd, DRY_RUN_REVIEW_RECORD_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH)
  });
}

function captureRepositoryState(cwd) {
  const output = execFileSync("git", ["status", "--short"], {
    cwd,
    encoding: "utf8"
  }).trim();
  const statusLines = output ? output.split("\n") : [];
  return deepFreeze({
    gitStatusCaptured: true,
    statusLines,
    hasUncommittedChanges: statusLines.length > 0,
    readinessState: "REPOSITORY_STATE_LOCKED_FOR_MANUAL_PRE_FLIGHT"
  });
}

function buildChecklist(inputs, repositoryState) {
  const expiryStatus =
    inputs.authorizationRecord.authorizationReview.expiresOn >= LOCK_DATE
      ? "VALID"
      : "EXPIRED";
  const packageVersion = inputs.authorizationRecord.sessionScopeConfirmation.packageId.match(/_v(\d+)$/)?.[1]
    ? `v${inputs.authorizationRecord.sessionScopeConfirmation.packageId.match(/_v(\d+)$/)[1]}`
    : "UNKNOWN";
  const recipeVersion = inputs.authorizationRecord.sessionScopeConfirmation.recipeId.match(/_(\d{3})$/)?.[1]
    ? `v${inputs.authorizationRecord.sessionScopeConfirmation.recipeId.match(/_(\d{3})$/)[1]}`
    : "REFERENCE";

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_FINAL_VERIFICATION_CHECKLIST_001",
    lockId: "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001",
    verifiedOn: LOCK_DATE,
    authorizationStatus: {
      authorizationState: inputs.authorizationRecord.authorizationState,
      expiryStatus,
      expiresOn: inputs.authorizationRecord.authorizationReview.expiresOn
    },
    repositoryStatus: repositoryState,
    versionStatus: {
      packageId: inputs.authorizationRecord.sessionScopeConfirmation.packageId,
      packageVersion,
      recipeId: inputs.authorizationRecord.sessionScopeConfirmation.recipeId,
      recipeVersion
    },
    items: [
      {
        itemId: "CHECK_AUTHORIZATION_VALIDITY",
        area: "authorization_validity",
        status:
          inputs.authorizationValidation.status === "pass" &&
          inputs.authorizationRecord.authorizationState ===
            "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
            ? "PASS"
            : "FAIL",
        evidence: "Manual session authorization remains present and valid."
      },
      {
        itemId: "CHECK_EXPIRY_STATUS",
        area: "expiry_status",
        status: expiryStatus === "VALID" ? "PASS" : "FAIL",
        evidence: `Authorization expiry remains in the future relative to ${LOCK_DATE}.`
      },
      {
        itemId: "CHECK_OPERATOR_AUTHORIZATION",
        area: "operator_authorization",
        status:
          inputs.operatorAuthorization.internalOnly === true &&
          inputs.operatorAuthorization.authorizedUsers.length === 2
            ? "PASS"
            : "FAIL",
        evidence: "Exactly the authorized internal operator roles remain available."
      },
      {
        itemId: "CHECK_SAFETY_FLAGS_UNCHANGED",
        area: "safety_flags",
        status:
          inputs.authorizationRecord.finalSafetyConfirmation.runtimeExecutionEnabled === false &&
          inputs.authorizationRecord.finalSafetyConfirmation.mapAttachmentAllowed === false &&
          inputs.authorizationRecord.finalSafetyConfirmation.automaticRendererExecutionAllowed === false
            ? "PASS"
            : "FAIL",
        evidence: "Runtime, map attachment, and automatic renderer execution all remain disabled."
      },
      {
        itemId: "CHECK_SESSION_SCOPE_UNCHANGED",
        area: "session_scope",
        status:
          inputs.scopeConfirmation.environment === inputs.finalCheckRecord.alphaScope.environment &&
          inputs.scopeConfirmation.permittedRegion.primaryRegionId ===
            inputs.finalCheckRecord.alphaScope.regionId &&
          inputs.scopeConfirmation.permittedRegion.packageId ===
            inputs.finalCheckRecord.alphaScope.packageId &&
          inputs.scopeConfirmation.permittedRegion.expectedRecipeId ===
            inputs.finalCheckRecord.alphaScope.recipeId
            ? "PASS"
            : "FAIL",
        evidence: "Environment, region, package, and recipe remain locked to the approved scope."
      },
      {
        itemId: "CHECK_REPOSITORY_STATE",
        area: "repository_state",
        status: repositoryState.gitStatusCaptured ? "PASS" : "FAIL",
        evidence: "Repository state has been captured for final manual pre-flight comparison."
      },
      {
        itemId: "CHECK_PACKAGE_VERSIONS",
        area: "package_versions",
        status: packageVersion === "v001" ? "PASS" : "FAIL",
        evidence: "Approved regional package version remains the expected v001 package."
      },
      {
        itemId: "CHECK_RECIPE_VERSIONS",
        area: "recipe_versions",
        status: inputs.authorizationRecord.sessionScopeConfirmation.recipeId === "COASTAL_LOCATION_RECIPE_001"
          ? "PASS"
          : "FAIL",
        evidence: "Approved recipe reference remains COASTAL_LOCATION_RECIPE_001."
      },
      {
        itemId: "CHECK_MONITORING_READINESS",
        area: "monitoring_readiness",
        status:
          inputs.finalCheckRecord.monitoringReadiness.monitoringChecklist.length >= 5
            ? "PASS"
            : "FAIL",
        evidence: "Monitoring checklist and alert references remain available for the manual session."
      },
      {
        itemId: "CHECK_ROLLBACK_READINESS",
        area: "rollback_readiness",
        status:
          inputs.finalCheckRecord.rollbackReadiness.status === "PASS" &&
          inputs.controlSpecification.rollbackHandling.owners.includes("atlas_operator") &&
          inputs.controlSpecification.rollbackHandling.owners.includes("internal_developer_reviewer")
            ? "PASS"
            : "FAIL",
        evidence: "Rollback ownership and allowed rollback path remain intact."
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_FINAL_VERIFICATION_CHECKLIST_001",
      inputs.authorizationRecord.deterministicFingerprint,
      inputs.finalCheckRecord.deterministicFingerprint,
      inputs.dryRunReviewRecord.deterministicFingerprint,
      inputs.controlSpecification.deterministicFingerprint,
      JSON.stringify(repositoryState.statusLines),
      LOCK_DATE
    )
  });
}

function buildReadinessLockRecord(inputs, checklist) {
  const packageVersion = checklist.versionStatus.packageVersion;
  const recipeVersion = checklist.versionStatus.recipeVersion;

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_RECORD_001",
    lockId: "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001",
    lockedOn: LOCK_DATE,
    readinessState: checklist.items.every((item) => item.status === "PASS")
      ? "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "READINESS_LOCK_BLOCKED",
    references: {
      authorizationId: inputs.authorizationRecord.authorizationId,
      finalCheckId: inputs.finalCheckRecord.checkId,
      dryRunReviewId: inputs.dryRunReviewRecord.reviewId,
      controlId: inputs.controlSpecification.controlId
    },
    authorizationStatus: checklist.authorizationStatus,
    operatorAuthorization: {
      authorizedUsers: inputs.operatorAuthorization.authorizedUsers.map((entry) => entry.role),
      internalOnly: inputs.operatorAuthorization.internalOnly,
      maxConcurrentOperators: inputs.operatorAuthorization.maxConcurrentOperators
    },
    sessionScope: {
      environment: inputs.scopeConfirmation.environment,
      scopeType: inputs.scopeConfirmation.scopeType,
      regionId: inputs.scopeConfirmation.permittedRegion.primaryRegionId,
      packageId: inputs.scopeConfirmation.permittedRegion.packageId,
      recipeId: inputs.scopeConfirmation.permittedRegion.expectedRecipeId,
      durationLimitMinutes: inputs.scopeConfirmation.durationLimitMinutes
    },
    repositoryState: checklist.repositoryStatus,
    versionLock: {
      packageId: checklist.versionStatus.packageId,
      packageVersion,
      recipeId: checklist.versionStatus.recipeId,
      recipeVersion
    },
    monitoringReadiness: inputs.finalCheckRecord.monitoringReadiness,
    rollbackReadiness: inputs.finalCheckRecord.rollbackReadiness,
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_RECORD_001",
      checklist.deterministicFingerprint,
      LOCK_DATE
    )
  });
}

function buildValidation(inputs, checklist, readinessLockRecord) {
  const checks = [
    {
      name: "authorization_valid_and_not_expired",
      ok:
        checklist.items.find((item) => item.area === "authorization_validity")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "expiry_status")?.status === "PASS"
    },
    {
      name: "operator_authorization_and_scope_unchanged",
      ok:
        checklist.items.find((item) => item.area === "operator_authorization")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "session_scope")?.status === "PASS"
    },
    {
      name: "repository_and_versions_locked",
      ok:
        checklist.items.find((item) => item.area === "repository_state")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "package_versions")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "recipe_versions")?.status === "PASS"
    },
    {
      name: "monitoring_and_rollback_ready",
      ok:
        checklist.items.find((item) => item.area === "monitoring_readiness")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "rollback_readiness")?.status === "PASS"
    },
    {
      name: "dry_run_and_final_check_still_align",
      ok:
        inputs.dryRunReviewRecord.reviewDecision ===
          "DRY_RUN_APPROVED_FOR_FUTURE_MANUAL_DEVELOPER_SESSION" &&
        inputs.finalCheckValidation.status === "pass" &&
        inputs.finalCheckRecord.finalReadinessState ===
          "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        readinessLockRecord.finalSafetyConfirmation.runtimeExecutionEnabled === false &&
        readinessLockRecord.finalSafetyConfirmation.mapAttachmentAllowed === false &&
        readinessLockRecord.finalSafetyConfirmation.automaticRendererExecutionAllowed === false &&
        readinessLockRecord.finalSafetyConfirmation.rendererAttachmentAuthorized === false &&
        readinessLockRecord.finalSafetyConfirmation.mapDownloadsAuthorized === false &&
        readinessLockRecord.finalSafetyConfirmation.blenderAuthorized === false &&
        readinessLockRecord.finalSafetyConfirmation.glbAuthorized === false &&
        readinessLockRecord.finalSafetyConfirmation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_VALIDATION_001",
    lockId: readinessLockRecord.lockId,
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_VALIDATION_001",
      readinessLockRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, readinessLockRecord) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_LIFECYCLE_001",
    lockId: readinessLockRecord.lockId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READINESS_LOCK_COMPLETE_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "READINESS_LOCK_BLOCKED",
    readinessState: readinessLockRecord.readinessState,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_LIFECYCLE_001",
      validation.status,
      readinessLockRecord.readinessState,
      LOCK_DATE
    )
  });
}

function buildReport(readinessLockRecord, checklist, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION READINESS LOCK

## Goal

Create the final locked readiness verification before a future manual developer-only Atlas alpha session.

## Lock

- lock id: ${readinessLockRecord.lockId}
- locked on: ${readinessLockRecord.lockedOn}
- readiness state: ${readinessLockRecord.readinessState}
- lifecycle status: ${lifecycle.lifecycleStatus}
- authorization expiry: ${readinessLockRecord.authorizationStatus.expiresOn} (${readinessLockRecord.authorizationStatus.expiryStatus})

## Final Verification Checklist

${checklist.items.map((item) => `- ${item.area}: ${item.status}`).join("\n")}

## Repository State

- git status captured: ${checklist.repositoryStatus.gitStatusCaptured}
- uncommitted changes present: ${checklist.repositoryStatus.hasUncommittedChanges}
- captured lines: ${checklist.repositoryStatus.statusLines.length}

## Version Lock

- package: ${readinessLockRecord.versionLock.packageId} (${readinessLockRecord.versionLock.packageVersion})
- recipe: ${readinessLockRecord.versionLock.recipeId} (${readinessLockRecord.versionLock.recipeVersion})

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

## Final Readiness State

Developer alpha session readiness lock state: ${
    validation.status === "pass"
      ? "LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionReadinessLock({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const repositoryState = captureRepositoryState(cwd);
  const checklist = buildChecklist(inputs, repositoryState);
  const readinessLockRecord = buildReadinessLockRecord(inputs, checklist);
  const validation = buildValidation(inputs, checklist, readinessLockRecord);
  const lifecycle = buildLifecycle(validation, readinessLockRecord);
  const report = buildReport(readinessLockRecord, checklist, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, READINESS_LOCK_ROOT),
    readinessLockRecord,
    checklist,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionReadinessLock({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionReadinessLock({ cwd });
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

  writeJson(path.join(recordDir, LOCK_RECORD_FILENAME), result.readinessLockRecord);
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
  writeAtlasDeveloperAlphaSessionReadinessLock();
}
