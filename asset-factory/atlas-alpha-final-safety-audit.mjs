import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const AUDIT_ROOT =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001";

const AUDIT_FILENAME = "atlas-alpha-final-safety-audit-record.json";
const CHECKLIST_FILENAME = "atlas-alpha-final-readiness-checklist.json";
const VALIDATION_FILENAME = "atlas-alpha-final-safety-validation.json";
const LIFECYCLE_FILENAME = "atlas-alpha-final-safety-lifecycle.json";
const REPORT_FILENAME = "atlas-alpha-final-safety-report.md";

const APPROVAL_RECORD_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/approval/atlas-alpha-manual-approval-record.json";
const APPROVAL_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/validation/atlas-alpha-manual-approval-validation.json";
const APPROVAL_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/lifecycle/atlas-alpha-manual-approval-lifecycle.json";
const READINESS_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-readiness-review/ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001/validation/atlas-alpha-attachment-readiness-validation.json";
const CONTROLLED_SIM_VALIDATION_PATH =
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001/validation/atlas-controlled-attachment-simulation-validation.json";
const RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/validation/atlas-runtime-implementation-validation.json";
const RUNTIME_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/lifecycle/atlas-runtime-implementation-lifecycle-rules.json";
const ADAPTER_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001/validation/atlas-runtime-adapter-simulation-validation.json";
const ADAPTER_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001/lifecycle/atlas-runtime-adapter-simulation-lifecycle.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";
const MONITORING_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/lifecycle/atlas-runtime-monitoring-lifecycle.json";
const BUDGET_VALIDATION_PATH =
  "asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/validation/atlas-budget-validator-validation.json";
const REGIONAL_PACKAGE_VALIDATION_PATH =
  "asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/validation/atlas-regional-package-validation.json";

const AUDIT_DATE = "2026-07-30";

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
    approvalRecord: readJson(cwd, APPROVAL_RECORD_PATH),
    approvalValidation: readJson(cwd, APPROVAL_VALIDATION_PATH),
    approvalLifecycle: readJson(cwd, APPROVAL_LIFECYCLE_PATH),
    readinessValidation: readJson(cwd, READINESS_VALIDATION_PATH),
    controlledSimulationValidation: readJson(cwd, CONTROLLED_SIM_VALIDATION_PATH),
    runtimeValidation: readJson(cwd, RUNTIME_VALIDATION_PATH),
    runtimeLifecycle: readJson(cwd, RUNTIME_LIFECYCLE_PATH),
    adapterValidation: readJson(cwd, ADAPTER_VALIDATION_PATH),
    adapterLifecycle: readJson(cwd, ADAPTER_LIFECYCLE_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH),
    monitoringLifecycle: readJson(cwd, MONITORING_LIFECYCLE_PATH),
    budgetValidation: readJson(cwd, BUDGET_VALIDATION_PATH),
    regionalPackageValidation: readJson(cwd, REGIONAL_PACKAGE_VALIDATION_PATH)
  });
}

function buildAuditRecord(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_FINAL_SAFETY_AUDIT_RECORD_001",
    auditId: "ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001",
    auditedOn: AUDIT_DATE,
    references: {
      atlasAlphaManualApprovalId: inputs.approvalRecord.approvalId,
      atlasAlphaReadinessReviewId: "ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001",
      atlasControlledAttachmentSimulationId: "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001",
      atlasRuntimeImplementationId: "ATLAS_RUNTIME_IMPLEMENTATION_001",
      atlasRuntimeAdapterSimulationId: "ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001",
      atlasRuntimeMonitoringSimulationId: "ATLAS_RUNTIME_MONITORING_SIMULATION_001",
      atlasBudgetValidatorId: "ATLAS_BUDGET_VALIDATOR_001",
      atlasRegionalPackageValidationId: "ATLAS_REGIONAL_PACKAGE_VALIDATION_001"
    },
    approvalState: {
      approvalStatus: inputs.approvalRecord.approvalStatus,
      lifecycleStatus: inputs.approvalLifecycle.lifecycleStatus,
      approvalValidationStatus: inputs.approvalValidation.status
    },
    permissionState: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false,
      blenderAuthorized: false,
      glbAuthorized: false,
      assetModificationAuthorized: false
    },
    packageValidation: {
      status: inputs.regionalPackageValidation.status,
      nextAllowedAction: inputs.regionalPackageValidation.nextAllowedAction
    },
    budgetValidation: {
      status: inputs.budgetValidation.status,
      nextAllowedAction: inputs.budgetValidation.nextAllowedAction
    },
    deterministicBehaviour: {
      readinessStatus: inputs.readinessValidation.status,
      controlledSimulationStatus: inputs.controlledSimulationValidation.status,
      runtimeValidationStatus: inputs.runtimeValidation.status,
      adapterValidationStatus: inputs.adapterValidation.status,
      monitoringValidationStatus: inputs.monitoringValidation.status
    },
    adapterReadiness: {
      lifecycleStatus: inputs.adapterLifecycle.lifecycleStatus,
      validationStatus: inputs.adapterValidation.status
    },
    monitoringReadiness: {
      lifecycleStatus: inputs.monitoringLifecycle.lifecycleStatus,
      validationStatus: inputs.monitoringValidation.status
    },
    rollbackReadiness: {
      controlledAttachmentCheck: inputs.controlledSimulationValidation.checks.find(
        (check) => check.name === "rollback_behaviour"
      )?.ok === true,
      adapterCheck: inputs.adapterValidation.checks.find(
        (check) => check.name === "rollback_behaviour"
      )?.ok === true,
      monitoringCheck: inputs.monitoringValidation.checks.find(
        (check) => check.name === "rollback_signals_defined"
      )?.ok === true
    },
    failureHandling: {
      readinessCheck: inputs.readinessValidation.checks.find(
        (check) =>
          check.name === "deterministic_behaviour_and_failure_handling_reviewed"
      )?.ok === true,
      controlledAttachmentCheck: inputs.controlledSimulationValidation.checks.find(
        (check) => check.name === "kill_switch_handling"
      )?.ok === true,
      adapterCheck: inputs.adapterValidation.checks.find(
        (check) => check.name === "failure_responses"
      )?.ok === true,
      monitoringCheck: inputs.monitoringValidation.checks.find(
        (check) => check.name === "alert_rules_applied"
      )?.ok === true
    },
    deterministicFingerprint: hashHex(
      "ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001",
      inputs.approvalRecord.deterministicFingerprint,
      inputs.readinessValidation.deterministicFingerprint,
      inputs.controlledSimulationValidation.deterministicFingerprint,
      inputs.runtimeValidation.deterministicFingerprint,
      inputs.adapterValidation.deterministicFingerprint,
      inputs.monitoringValidation.deterministicFingerprint
    )
  });
}

function buildReadinessChecklist(inputs) {
  const items = [
    {
      itemId: "ALPHA_APPROVAL_STATE",
      label: "Approval state is manually approved and internally scoped",
      status:
        inputs.approvalRecord.approvalStatus ===
          "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION" &&
        inputs.approvalValidation.status === "pass"
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "PERMISSION_STATE_LOCKED",
      label: "Runtime, map, and renderer permissions remain disabled",
      status:
        inputs.runtimeValidation.runtimeExecutionEnabled === false &&
        inputs.adapterValidation.mapAttachmentAllowed === false &&
        inputs.monitoringValidation.automaticRendererExecutionAllowed === false
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "PACKAGE_VALIDATION_READY",
      label: "Regional package validation remains passing",
      status: inputs.regionalPackageValidation.status === "pass" ? "PASS" : "FAIL"
    },
    {
      itemId: "BUDGET_VALIDATION_READY",
      label: "Budget validator remains passing",
      status: inputs.budgetValidation.status === "pass" ? "PASS" : "FAIL"
    },
    {
      itemId: "DETERMINISTIC_BEHAVIOUR_PROVEN",
      label: "Deterministic behaviour remains proven across readiness and simulations",
      status:
        inputs.readinessValidation.status === "pass" &&
        inputs.controlledSimulationValidation.status === "pass" &&
        inputs.adapterValidation.status === "pass"
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "ADAPTER_READY",
      label: "Runtime adapter simulation is ready for future implementation",
      status:
        inputs.adapterLifecycle.lifecycleStatus ===
          "FUTURE_RUNTIME_ADAPTER_READY_FOR_IMPLEMENTATION"
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "MONITORING_READY",
      label: "Runtime monitoring simulation is ready for future implementation",
      status:
        inputs.monitoringLifecycle.lifecycleStatus ===
          "FUTURE_RUNTIME_MONITORING_READY_FOR_IMPLEMENTATION"
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "ROLLBACK_READY",
      label: "Rollback remains defined across controlled attachment, adapter, and monitoring",
      status:
        inputs.controlledSimulationValidation.checks.find(
          (check) => check.name === "rollback_behaviour"
        )?.ok === true &&
        inputs.adapterValidation.checks.find(
          (check) => check.name === "rollback_behaviour"
        )?.ok === true &&
        inputs.monitoringValidation.checks.find(
          (check) => check.name === "rollback_signals_defined"
        )?.ok === true
          ? "PASS"
          : "FAIL"
    },
    {
      itemId: "FAILURE_HANDLING_READY",
      label: "Failure handling remains proven across readiness, adapter, and monitoring",
      status:
        inputs.readinessValidation.checks.find(
          (check) =>
            check.name === "deterministic_behaviour_and_failure_handling_reviewed"
        )?.ok === true &&
        inputs.adapterValidation.checks.find(
          (check) => check.name === "failure_responses"
        )?.ok === true &&
        inputs.monitoringValidation.checks.find(
          (check) => check.name === "alert_rules_applied"
        )?.ok === true
          ? "PASS"
          : "FAIL"
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_FINAL_READINESS_CHECKLIST_001",
    auditId: "ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001",
    items,
    passCount: items.filter((item) => item.status === "PASS").length,
    failCount: items.filter((item) => item.status === "FAIL").length
  });
}

function buildValidation(auditRecord, checklist, inputs) {
  const checks = [
    {
      name: "approval_state",
      ok:
        auditRecord.approvalState.approvalStatus ===
          "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION" &&
        auditRecord.approvalState.approvalValidationStatus === "pass"
    },
    {
      name: "permission_state",
      ok:
        auditRecord.permissionState.runtimeExecutionEnabled === false &&
        auditRecord.permissionState.mapAttachmentAllowed === false &&
        auditRecord.permissionState.automaticRendererExecutionAllowed === false
    },
    {
      name: "package_validation",
      ok: auditRecord.packageValidation.status === "pass"
    },
    {
      name: "budget_validation",
      ok: auditRecord.budgetValidation.status === "pass"
    },
    {
      name: "deterministic_behaviour",
      ok:
        auditRecord.deterministicBehaviour.readinessStatus === "pass" &&
        auditRecord.deterministicBehaviour.controlledSimulationStatus === "pass" &&
        auditRecord.deterministicBehaviour.runtimeValidationStatus === "pass" &&
        auditRecord.deterministicBehaviour.adapterValidationStatus === "pass" &&
        auditRecord.deterministicBehaviour.monitoringValidationStatus === "pass"
    },
    {
      name: "adapter_and_monitoring_readiness",
      ok:
        auditRecord.adapterReadiness.validationStatus === "pass" &&
        auditRecord.monitoringReadiness.validationStatus === "pass"
    },
    {
      name: "rollback_and_failure_handling",
      ok:
        auditRecord.rollbackReadiness.controlledAttachmentCheck === true &&
        auditRecord.rollbackReadiness.adapterCheck === true &&
        auditRecord.rollbackReadiness.monitoringCheck === true &&
        auditRecord.failureHandling.readinessCheck === true &&
        auditRecord.failureHandling.adapterCheck === true &&
        auditRecord.failureHandling.monitoringCheck === true
    },
    {
      name: "readiness_checklist_complete",
      ok: checklist.failCount === 0 && checklist.passCount === checklist.items.length
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.runtimeValidation.runtimeExecutionEnabled === false &&
        inputs.runtimeValidation.mapAttachmentAllowed === false &&
        inputs.runtimeValidation.automaticRendererExecutionAllowed === false &&
        inputs.runtimeValidation.rendererAttachmentAuthorized === false &&
        inputs.runtimeValidation.mapDownloadsAuthorized === false &&
        inputs.runtimeValidation.blenderAuthorized === false &&
        inputs.runtimeValidation.glbAuthorized === false &&
        inputs.runtimeValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_FINAL_SAFETY_VALIDATION_001",
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
      auditRecord.auditId,
      JSON.stringify(checks),
      auditRecord.deterministicFingerprint
    )
  });
}

function buildLifecycle(auditRecord, checklist, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_FINAL_SAFETY_LIFECYCLE_001",
    auditId: auditRecord.auditId,
    lifecycleStatus:
      validation.status === "pass"
        ? "ALPHA_FINAL_GATE_PASSED"
        : "ALPHA_FINAL_GATE_BLOCKED",
    checklistPassCount: checklist.passCount,
    checklistFailCount: checklist.failCount,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      auditRecord.auditId,
      validation.status,
      checklist.passCount,
      checklist.failCount
    )
  });
}

function buildReport(auditRecord, checklist, validation, lifecycle) {
  const checklistLines = checklist.items
    .map((item) => `- ${item.itemId}: ${item.status}`)
    .join("\n");

  return `# ATLAS ALPHA FINAL SAFETY AUDIT

## Goal

Perform a final combined safety audit across all Atlas alpha preparation systems.

## Audit Summary

- audit id: ${auditRecord.auditId}
- audited on: ${auditRecord.auditedOn}
- approval status: ${auditRecord.approvalState.approvalStatus}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Readiness Checklist

${checklistLines}

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

## Final Alpha Gate

Final alpha gate status: ${
    validation.status === "pass" ? "PASS" : "BLOCKED"
  }
`;
}

export function buildAtlasAlphaFinalSafetyAudit({ cwd = process.cwd() } = {}) {
  const inputs = loadInputs(cwd);
  const auditRecord = buildAuditRecord(inputs);
  const checklist = buildReadinessChecklist(inputs);
  const validation = buildValidation(auditRecord, checklist, inputs);
  const lifecycle = buildLifecycle(auditRecord, checklist, validation);
  const report = buildReport(auditRecord, checklist, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, AUDIT_ROOT),
    auditRecord,
    checklist,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasAlphaFinalSafetyAudit({ cwd = process.cwd() } = {}) {
  const result = buildAtlasAlphaFinalSafetyAudit({ cwd });
  const auditDir = path.join(result.root, "audit");
  const checklistDir = path.join(result.root, "checklist");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    auditDir,
    checklistDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(auditDir, AUDIT_FILENAME), result.auditRecord);
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
  writeAtlasAlphaFinalSafetyAudit();
}
