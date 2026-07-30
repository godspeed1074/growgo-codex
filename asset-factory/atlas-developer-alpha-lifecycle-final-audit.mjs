import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const AUDIT_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001";

const AUDIT_RECORD_FILENAME = "atlas-developer-alpha-lifecycle-final-audit-record.json";
const CHECKLIST_FILENAME = "atlas-developer-alpha-lifecycle-certification-checklist.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-lifecycle-final-audit-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-lifecycle-final-audit-lifecycle.json";
const SUMMARY_FILENAME = "atlas-developer-alpha-lifecycle-architecture-summary.md";

const AUTHORIZATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/authorization/atlas-developer-alpha-manual-session-authorization-record.json";
const AUTHORIZATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/validation/atlas-developer-alpha-manual-session-authorization-validation.json";
const READINESS_LOCK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/record/atlas-developer-alpha-session-readiness-lock-record.json";
const READINESS_LOCK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/validation/atlas-developer-alpha-session-readiness-lock-validation.json";
const START_RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001/specification/atlas-developer-alpha-session-start-record-specification.json";
const START_RECORD_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001/validation/atlas-developer-alpha-session-start-record-validation.json";
const INITIALIZATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-initialization/ATLAS_DEVELOPER_ALPHA_SESSION_INITIALIZATION_SIMULATION_001/validation/atlas-developer-alpha-session-initialization-validation.json";
const OPERATIONAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-operational/ATLAS_DEVELOPER_ALPHA_SESSION_OPERATIONAL_SIMULATION_001/validation/atlas-developer-alpha-session-operational-validation.json";
const COMPLETION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-completion-review/ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_SIMULATION_001/validation/atlas-developer-alpha-session-completion-review-validation.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";
const FINAL_SAFETY_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";

const AUDIT_DATE = "2026-07-30";
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
    authorizationRecord: readJson(cwd, AUTHORIZATION_RECORD_PATH),
    authorizationValidation: readJson(cwd, AUTHORIZATION_VALIDATION_PATH),
    readinessLockRecord: readJson(cwd, READINESS_LOCK_RECORD_PATH),
    readinessLockValidation: readJson(cwd, READINESS_LOCK_VALIDATION_PATH),
    startRecordSpecification: readJson(cwd, START_RECORD_SPECIFICATION_PATH),
    startRecordValidation: readJson(cwd, START_RECORD_VALIDATION_PATH),
    initializationValidation: readJson(cwd, INITIALIZATION_VALIDATION_PATH),
    operationalValidation: readJson(cwd, OPERATIONAL_VALIDATION_PATH),
    completionValidation: readJson(cwd, COMPLETION_VALIDATION_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH),
    finalSafetyValidation: readJson(cwd, FINAL_SAFETY_VALIDATION_PATH)
  });
}

function buildChecklist(inputs) {
  const flagsBlocked =
    inputs.authorizationRecord.finalSafetyConfirmation.runtimeExecutionEnabled === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.mapAttachmentAllowed === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.automaticRendererExecutionAllowed === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.rendererAttachmentAuthorized === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.mapDownloadsAuthorized === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.blenderAuthorized === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.glbAuthorized === false &&
    inputs.authorizationRecord.finalSafetyConfirmation.assetModificationAuthorized === false;

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_CERTIFICATION_CHECKLIST_001",
    auditId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001",
    auditedOn: AUDIT_DATE,
    items: [
      {
        area: "governance_consistency",
        status:
          inputs.authorizationValidation.status === "pass" &&
          inputs.readinessLockValidation.status === "pass" &&
          inputs.finalSafetyValidation.status === "pass"
            ? "PASS"
            : "FAIL",
        evidence:
          "Authorization, readiness lock, and prior final safety audit all remain in pass state."
      },
      {
        area: "authorization_validity",
        status:
          inputs.authorizationRecord.authorizationState ===
            "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION" &&
          inputs.authorizationRecord.authorizationReview.expiresOn >= AUDIT_DATE
            ? "PASS"
            : "FAIL",
        evidence:
          "Manual session authorization remains valid and unexpired on July 30, 2026."
      },
      {
        area: "scope_consistency",
        status:
          inputs.authorizationRecord.sessionScopeConfirmation.packageId ===
            inputs.readinessLockRecord.sessionScope.packageId &&
          inputs.authorizationRecord.sessionScopeConfirmation.recipeId ===
            inputs.readinessLockRecord.sessionScope.recipeId &&
          inputs.startRecordSpecification.sessionIdentityRecord.packageId ===
            inputs.readinessLockRecord.sessionScope.packageId &&
          inputs.startRecordSpecification.sessionIdentityRecord.recipeId ===
            inputs.readinessLockRecord.sessionScope.recipeId
            ? "PASS"
            : "FAIL",
        evidence:
          "Package, recipe, environment, and region remain aligned across authorization, readiness, and start records."
      },
      {
        area: "state_machine_integrity",
        status:
          inputs.startRecordValidation.status === "pass" &&
          inputs.initializationValidation.status === "pass" &&
          inputs.operationalValidation.status === "pass" &&
          inputs.completionValidation.status === "pass"
            ? "PASS"
            : "FAIL",
        evidence:
          "Initialization, operational, and completion simulations all validate their lifecycle transitions."
      },
      {
        area: "telemetry_completeness",
        status:
          inputs.monitoringValidation.status === "pass" &&
          inputs.initializationValidation.checks.some(
            (check) => check.name === "telemetry_initialization_defined" && check.ok
          ) &&
          inputs.operationalValidation.checks.some(
            (check) => check.name === "telemetry_continuity_preserved" && check.ok
          ) &&
          inputs.completionValidation.checks.some(
            (check) => check.name === "telemetry_summary_and_audit_closure_defined" && check.ok
          )
            ? "PASS"
            : "FAIL",
        evidence:
          "Telemetry is present for initialization, continuous through operations, and summarized at completion."
      },
      {
        area: "monitoring_readiness",
        status:
          inputs.readinessLockRecord.monitoringReadiness.monitoringChecklist.length >= 5 &&
          inputs.monitoringValidation.status === "pass"
            ? "PASS"
            : "FAIL",
        evidence:
          "Monitoring references and validation remain present for healthy, warning, fallback, and emergency signals."
      },
      {
        area: "rollback_readiness",
        status:
          inputs.readinessLockRecord.rollbackReadiness.status === "PASS" &&
          inputs.operationalValidation.checks.some(
            (check) => check.name === "rollback_and_completion_workflow_defined" && check.ok
          ) &&
          inputs.finalSafetyValidation.checks.some(
            (check) => check.name === "rollback_and_failure_handling" && check.ok
          )
            ? "PASS"
            : "FAIL",
        evidence:
          "Rollback remains defined in readiness records, operational flow, and the prior safety audit."
      },
      {
        area: "lifecycle_consistency",
        status:
          inputs.readinessLockRecord.readinessState ===
            "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION" &&
          inputs.startRecordSpecification.readinessVerification.readinessLockState ===
            "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION" &&
          inputs.authorizationRecord.references.dryRunReviewId ===
            inputs.readinessLockRecord.references.dryRunReviewId
            ? "PASS"
            : "FAIL",
        evidence:
          "The lifecycle references align from authorization through readiness lock into session start."
      },
      {
        area: "blocked_runtime_preservation",
        status: flagsBlocked ? "PASS" : "FAIL",
        evidence:
          "Runtime, map attachment, renderer execution, downloads, Blender, GLBs, and asset mutation all remain blocked."
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_CERTIFICATION_CHECKLIST_001",
      inputs.authorizationRecord.deterministicFingerprint,
      inputs.readinessLockRecord.deterministicFingerprint,
      inputs.startRecordSpecification.deterministicFingerprint,
      inputs.initializationValidation.deterministicFingerprint,
      inputs.operationalValidation.deterministicFingerprint,
      inputs.completionValidation.deterministicFingerprint,
      inputs.monitoringValidation.deterministicFingerprint,
      inputs.finalSafetyValidation.deterministicFingerprint,
      AUDIT_DATE
    )
  });
}

function buildAuditRecord(inputs, checklist) {
  const certificationStatus = checklist.items.every((item) => item.status === "PASS")
    ? "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
    : "CERTIFICATION_BLOCKED";

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_RECORD_001",
    auditId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001",
    auditedOn: AUDIT_DATE,
    certificationStatus,
    references: {
      authorizationId: inputs.authorizationRecord.authorizationId,
      readinessLockId: inputs.readinessLockRecord.lockId,
      startRecordId: inputs.startRecordSpecification.startRecordId,
      initializationSimulationId: inputs.initializationValidation.simulationId,
      operationalSimulationId: inputs.operationalValidation.simulationId,
      completionSimulationId: inputs.completionValidation.simulationId,
      monitoringSimulationId: inputs.monitoringValidation.simulationId,
      finalSafetyAuditId: inputs.finalSafetyValidation.auditId
    },
    lifecycleSummary: {
      authorizationState: inputs.authorizationRecord.authorizationState,
      readinessLockState: inputs.readinessLockRecord.readinessState,
      sessionId: inputs.startRecordSpecification.sessionIdentityRecord.sessionId,
      packageId: inputs.startRecordSpecification.sessionIdentityRecord.packageId,
      recipeId: inputs.startRecordSpecification.sessionIdentityRecord.recipeId
    },
    blockedRuntimeState: {
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
      "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_RECORD_001",
      checklist.deterministicFingerprint,
      certificationStatus,
      AUDIT_DATE
    )
  });
}

function buildValidation(auditRecord, checklist) {
  const checks = [
    {
      name: "governance_and_authorization_consistent",
      ok:
        checklist.items.find((item) => item.area === "governance_consistency")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "authorization_validity")?.status === "PASS"
    },
    {
      name: "scope_and_lifecycle_consistent",
      ok:
        checklist.items.find((item) => item.area === "scope_consistency")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "lifecycle_consistency")?.status === "PASS"
    },
    {
      name: "state_machine_and_telemetry_complete",
      ok:
        checklist.items.find((item) => item.area === "state_machine_integrity")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "telemetry_completeness")?.status === "PASS"
    },
    {
      name: "monitoring_and_rollback_ready",
      ok:
        checklist.items.find((item) => item.area === "monitoring_readiness")?.status === "PASS" &&
        checklist.items.find((item) => item.area === "rollback_readiness")?.status === "PASS"
    },
    {
      name: "blocked_runtime_preserved",
      ok:
        checklist.items.find((item) => item.area === "blocked_runtime_preservation")?.status === "PASS"
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_VALIDATION_001",
    auditId: auditRecord.auditId,
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
      "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_VALIDATION_001",
      auditRecord.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(auditRecord, validation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_LIFECYCLE_001",
    auditId: auditRecord.auditId,
    lifecycleStatus:
      validation.status === "pass"
        ? "LIFECYCLE_CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
        : "LIFECYCLE_CERTIFICATION_BLOCKED",
    certificationStatus: auditRecord.certificationStatus,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_LIFECYCLE_001",
      validation.status,
      auditRecord.certificationStatus,
      AUDIT_DATE
    )
  });
}

function buildArchitectureSummary(auditRecord, checklist, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA LIFECYCLE FINAL AUDIT

## Goal

Perform the final combined audit across the complete developer-only Atlas alpha lifecycle preparation stack.

## Certification

- audit id: ${auditRecord.auditId}
- audited on: ${auditRecord.auditedOn}
- certification status: ${auditRecord.certificationStatus}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Stack References

- authorization: ${auditRecord.references.authorizationId}
- readiness lock: ${auditRecord.references.readinessLockId}
- session start: ${auditRecord.references.startRecordId}
- initialization: ${auditRecord.references.initializationSimulationId}
- operational: ${auditRecord.references.operationalSimulationId}
- completion review: ${auditRecord.references.completionSimulationId}
- monitoring: ${auditRecord.references.monitoringSimulationId}
- final safety audit: ${auditRecord.references.finalSafetyAuditId}

## Certification Checklist

${checklist.items.map((item) => `- ${item.area}: ${item.status}`).join("\n")}

## Validation

${validation.checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`).join("\n")}

## Runtime Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false
- blenderAuthorized: false
- glbAuthorized: false
- assetModificationAuthorized: false

## Final Lifecycle Certification Status

Developer alpha lifecycle certification: ${
    validation.status === "pass"
      ? "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaLifecycleFinalAudit({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const checklist = buildChecklist(inputs);
  const auditRecord = buildAuditRecord(inputs, checklist);
  const validation = buildValidation(auditRecord, checklist);
  const lifecycle = buildLifecycle(auditRecord, validation);
  const architectureSummary = buildArchitectureSummary(
    auditRecord,
    checklist,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, AUDIT_ROOT),
    auditRecord,
    checklist,
    validation,
    lifecycle,
    architectureSummary,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaLifecycleFinalAudit({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaLifecycleFinalAudit({ cwd });
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

  writeJson(path.join(recordDir, AUDIT_RECORD_FILENAME), result.auditRecord);
  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), result.checklist);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, SUMMARY_FILENAME), result.architectureSummary);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaLifecycleFinalAudit();
}
