import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasAlphaAttachmentSpecification } from "./atlas-alpha-attachment-specification.mjs";
import { buildAtlasControlledAttachmentSimulation } from "./atlas-controlled-attachment-simulation.mjs";
import { buildAtlasMapPreviewAttachment } from "./atlas-map-preview-attachment.mjs";

const REVIEW_ROOT =
  "asset-factory-workspace/atlas-alpha-readiness-review/ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001";

const CHECKLIST_FILENAME = "atlas-alpha-attachment-readiness-checklist.json";
const REVIEW_RECORD_FILENAME = "atlas-alpha-attachment-readiness-review-record.json";
const VALIDATION_FILENAME = "atlas-alpha-attachment-readiness-validation.json";
const LIFECYCLE_FILENAME = "atlas-alpha-attachment-readiness-lifecycle.json";
const REPORT_FILENAME = "atlas-alpha-attachment-readiness-report.md";

const SUPPORTING_VALIDATION_PATHS = Object.freeze({
  monitoring:
    "asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/validation/atlas-admin-monitoring-validation.json",
  budget:
    "asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/validation/atlas-budget-validator-validation.json",
  regionalPackage:
    "asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/validation/atlas-regional-package-validation.json"
});

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

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function loadSupportingValidations(cwd) {
  return deepFreeze({
    monitoring: readJson(path.resolve(cwd, SUPPORTING_VALIDATION_PATHS.monitoring)),
    budget: readJson(path.resolve(cwd, SUPPORTING_VALIDATION_PATHS.budget)),
    regionalPackage: readJson(
      path.resolve(cwd, SUPPORTING_VALIDATION_PATHS.regionalPackage)
    )
  });
}

function buildReadinessChecklist(alphaSpecification, controlledSimulation, previewAttachment, supportingValidations) {
  const approvedScenario = controlledSimulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );
  const blockedScenarios = controlledSimulation.outputs.scenarios.filter(
    (scenario) => scenario.status === "blocked"
  );

  const checklist = [
    {
      itemId: "CHECK_SAFETY_GATES",
      area: "safety_gates",
      status:
        alphaSpecification.validation.status === "pass" &&
        alphaSpecification.validation.runtimeActivationAuthorized === false &&
        alphaSpecification.validation.rendererAttachmentAuthorized === false
          ? "PASS"
          : "FAIL",
      evidence: "Alpha specification validation and blocked runtime/renderer flags."
    },
    {
      itemId: "CHECK_PERMISSIONS",
      area: "permissions",
      status:
        alphaSpecification.permissionMatrix.matrix.every((row) =>
          row.area === "preview_inspection" ||
          row.area === "metadata_lookup" ||
          row.area === "rollback_and_disable" ||
          (row.internalDeveloperReviewer === "blocked" &&
            row.atlasOperator === "blocked" &&
            row.betaTester === "blocked" &&
            row.livePlayer === "blocked")
        )
          ? "PASS"
          : "FAIL",
      evidence: "Permission matrix remains internal-only and non-runtime."
    },
    {
      itemId: "CHECK_MONITORING_READY",
      area: "monitoring_readiness",
      status:
        supportingValidations.monitoring.status === "pass" &&
        alphaSpecification.monitoringChecklist.checklist.length === 5
          ? "PASS"
          : "FAIL",
      evidence: "Monitoring validation passes and alpha checklist is complete."
    },
    {
      itemId: "CHECK_ROLLBACK_READY",
      area: "rollback_readiness",
      status:
        controlledSimulation.outputs.scenarios.every(
          (scenario) => scenario.rollback.rollbackAvailable === true
        )
          ? "PASS"
          : "FAIL",
      evidence: "Controlled attachment simulation preserves rollback on every scenario."
    },
    {
      itemId: "CHECK_PACKAGE_VALIDATION",
      area: "package_validation",
      status:
        supportingValidations.regionalPackage.status === "pass" &&
        supportingValidations.regionalPackage.checks.every((check) => check.ok === true)
          ? "PASS"
          : "FAIL",
      evidence: "Regional package validation passes and blocks failures safely."
    },
    {
      itemId: "CHECK_BUDGET_VALIDATION",
      area: "budget_validation",
      status:
        supportingValidations.budget.status === "pass" &&
        supportingValidations.budget.representativeEvaluations[0]?.recommendation ===
          "APPROVE_WITHIN_BUDGET"
          ? "PASS"
          : "FAIL",
      evidence: "Budget validator passes and representative within-budget case approves."
    },
    {
      itemId: "CHECK_DETERMINISTIC_BEHAVIOUR",
      area: "deterministic_behaviour",
      status:
        approvedScenario?.status === "ready_for_future_alpha" &&
        typeof approvedScenario.coordinateResolution.selectorSeed === "string" &&
        previewAttachment.validation.status === "pass"
          ? "PASS"
          : "FAIL",
      evidence: "Approved alpha scenario remains deterministic and preview alignment passes."
    },
    {
      itemId: "CHECK_FAILURE_HANDLING",
      area: "failure_handling",
      status:
        blockedScenarios.length >= 4 &&
        blockedScenarios.some(
          (scenario) => scenario.reasonCode === "REGION_SCOPE_VIOLATION"
        ) &&
        blockedScenarios.some(
          (scenario) => scenario.reasonCode === "REGION_NOT_FOUND"
        ) &&
        blockedScenarios.some(
          (scenario) => scenario.reasonCode === "VALIDATION_GATE_FAILURE"
        ) &&
        blockedScenarios.some(
          (scenario) => scenario.reasonCode === "EMERGENCY_DISABLE_TRIGGERED"
        )
          ? "PASS"
          : "FAIL",
      evidence: "Simulation covers blocked region, missing package, validation failure, and emergency disable."
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_READINESS_CHECKLIST_001",
    reviewId: "ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001",
    checklist
  });
}

function buildReviewRecord(alphaSpecification, controlledSimulation, previewAttachment, supportingValidations, checklist) {
  const checklistPassed = checklist.checklist.every((item) => item.status === "PASS");

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_RECORD_001",
    reviewId: "ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001",
    references: {
      alphaAttachmentId: alphaSpecification.specification.alphaAttachmentId,
      controlledAttachmentSimulationId: controlledSimulation.harness.simulationId,
      mapPreviewAttachmentId: previewAttachment.previewId,
      adminMonitoringId: supportingValidations.monitoring.monitoringId,
      budgetValidatorId: supportingValidations.budget.validatorId,
      regionalPackageValidationId:
        supportingValidations.regionalPackage.validationPlanningId
    },
    reviewAreas: checklist.checklist.map((item) => ({
      area: item.area,
      status: item.status,
      evidence: item.evidence
    })),
    readinessDecision: checklistPassed ? "READY_FOR_MANUAL_ALPHA_APPROVAL" : "NOT_READY",
    unresolvedBlocks: checklist.checklist
      .filter((item) => item.status !== "PASS")
      .map((item) => item.area),
    deterministicFingerprint: hashHex(
      "ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001",
      JSON.stringify(checklist.checklist),
      alphaSpecification.validation.deterministicFingerprint,
      controlledSimulation.validation.deterministicFingerprint,
      previewAttachment.validation.deterministicFingerprint
    )
  });
}

function buildValidation(checklist, reviewRecord, alphaSpecification, controlledSimulation, previewAttachment, supportingValidations) {
  const checks = [
    {
      name: "safety_gates_reviewed",
      ok: checklist.checklist.find((item) => item.area === "safety_gates")?.status === "PASS"
    },
    {
      name: "permissions_reviewed",
      ok: checklist.checklist.find((item) => item.area === "permissions")?.status === "PASS"
    },
    {
      name: "monitoring_and_rollback_reviewed",
      ok:
        checklist.checklist.find((item) => item.area === "monitoring_readiness")?.status ===
          "PASS" &&
        checklist.checklist.find((item) => item.area === "rollback_readiness")?.status ===
          "PASS"
    },
    {
      name: "package_and_budget_validation_reviewed",
      ok:
        checklist.checklist.find((item) => item.area === "package_validation")?.status ===
          "PASS" &&
        checklist.checklist.find((item) => item.area === "budget_validation")?.status ===
          "PASS"
    },
    {
      name: "deterministic_behaviour_and_failure_handling_reviewed",
      ok:
        checklist.checklist.find((item) => item.area === "deterministic_behaviour")?.status ===
          "PASS" &&
        checklist.checklist.find((item) => item.area === "failure_handling")?.status ===
          "PASS"
    },
    {
      name: "supporting_validations_pass",
      ok:
        alphaSpecification.validation.status === "pass" &&
        controlledSimulation.validation.status === "pass" &&
        previewAttachment.validation.status === "pass" &&
        supportingValidations.monitoring.status === "pass" &&
        supportingValidations.budget.status === "pass" &&
        supportingValidations.regionalPackage.status === "pass"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        alphaSpecification.validation.runtimeActivationAuthorized === false &&
        alphaSpecification.validation.rendererAttachmentAuthorized === false &&
        alphaSpecification.validation.mapDownloadsAuthorized === false &&
        alphaSpecification.validation.blenderAuthorized === false &&
        alphaSpecification.validation.glbAuthorized === false &&
        alphaSpecification.validation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_READINESS_VALIDATION_001",
    reviewId: reviewRecord.reviewId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      reviewRecord.reviewId,
      JSON.stringify(checks),
      reviewRecord.deterministicFingerprint
    ),
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(reviewRecord, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_READINESS_LIFECYCLE_001",
    reviewId: reviewRecord.reviewId,
    lifecycleStatus:
      validation.status === "pass"
        ? "ALPHA_READY_PENDING_MANUAL_APPROVAL"
        : "ALPHA_READINESS_BLOCKED",
    readinessDecision: reviewRecord.readinessDecision,
    manualApprovalRequired: true,
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      reviewRecord.reviewId,
      validation.status,
      reviewRecord.readinessDecision
    )
  });
}

function buildReport(checklist, reviewRecord, validation, lifecycle) {
  return `# ATLAS ALPHA ATTACHMENT READINESS REVIEW

## Scope

${reviewRecord.reviewId} performs the final readiness review against the Atlas alpha attachment specification.

## Readiness Checklist

${checklist.checklist
  .map((item) => `- ${item.area}: ${item.status}`)
  .join("\n")}

## Review Decision

- readiness decision: ${reviewRecord.readinessDecision}
- unresolved blocks: ${reviewRecord.unresolvedBlocks.length === 0 ? "none" : reviewRecord.unresolvedBlocks.join(", ")}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- manual approval required: ${lifecycle.manualApprovalRequired}

## Readiness

Final alpha readiness status: ${lifecycle.lifecycleStatus}
`;
}

export function buildAtlasAlphaAttachmentReadinessReview({
  cwd = process.cwd()
} = {}) {
  const alphaSpecification = buildAtlasAlphaAttachmentSpecification({ cwd });
  const controlledSimulation = buildAtlasControlledAttachmentSimulation({ cwd });
  const previewAttachment = buildAtlasMapPreviewAttachment({ cwd });
  const supportingValidations = loadSupportingValidations(cwd);

  const checklist = buildReadinessChecklist(
    alphaSpecification,
    controlledSimulation,
    previewAttachment,
    supportingValidations
  );
  const reviewRecord = buildReviewRecord(
    alphaSpecification,
    controlledSimulation,
    previewAttachment,
    supportingValidations,
    checklist
  );
  const validation = buildValidation(
    checklist,
    reviewRecord,
    alphaSpecification,
    controlledSimulation,
    previewAttachment,
    supportingValidations
  );
  const lifecycle = buildLifecycle(reviewRecord, validation);
  const report = buildReport(checklist, reviewRecord, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, REVIEW_ROOT),
    checklist,
    reviewRecord,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasAlphaAttachmentReadinessReview({
  cwd = process.cwd()
} = {}) {
  const review = buildAtlasAlphaAttachmentReadinessReview({ cwd });
  const checklistDir = path.join(review.root, "checklist");
  const reviewDir = path.join(review.root, "review");
  const validationDir = path.join(review.root, "validation");
  const lifecycleDir = path.join(review.root, "lifecycle");
  const reportsDir = path.join(review.root, "reports");

  for (const directory of [
    checklistDir,
    reviewDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(checklistDir, CHECKLIST_FILENAME), review.checklist);
  writeJson(path.join(reviewDir, REVIEW_RECORD_FILENAME), review.reviewRecord);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), review.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), review.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), review.report);

  return review;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasAlphaAttachmentReadinessReview();
}
