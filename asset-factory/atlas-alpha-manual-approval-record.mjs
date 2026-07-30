import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasAlphaAttachmentSpecification } from "./atlas-alpha-attachment-specification.mjs";
import { buildAtlasAlphaAttachmentReadinessReview } from "./atlas-alpha-attachment-readiness-review.mjs";

const APPROVAL_ROOT =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001";

const APPROVAL_RECORD_FILENAME = "atlas-alpha-manual-approval-record.json";
const APPROVAL_SCOPE_FILENAME = "atlas-alpha-manual-approval-scope.json";
const AUTHORIZED_REGIONS_FILENAME = "atlas-alpha-authorized-region-list.json";
const ENABLED_CAPABILITIES_FILENAME = "atlas-alpha-enabled-capabilities.json";
const DISABLED_CAPABILITIES_FILENAME = "atlas-alpha-disabled-capabilities.json";
const ROLLBACK_AUTHORITY_FILENAME = "atlas-alpha-rollback-authority-record.json";
const REVIEW_SCHEDULE_FILENAME = "atlas-alpha-review-schedule.json";
const VALIDATION_FILENAME = "atlas-alpha-manual-approval-validation.json";
const LIFECYCLE_FILENAME = "atlas-alpha-manual-approval-lifecycle.json";
const REPORT_FILENAME = "atlas-alpha-manual-approval-report.md";

const APPROVAL_DATE = "2026-07-30";

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

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function buildApprovalScope(alphaSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_MANUAL_APPROVAL_SCOPE_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    environment: alphaSpecification.specification.allowedEnvironments.environments,
    userAccessBoundaries: alphaSpecification.specification.userAccessBoundaries,
    alphaRegionPolicy: alphaSpecification.specification.alphaRegionScope.regionPolicy,
    manualApprovalGates: alphaSpecification.specification.manualApprovalGates.gates
  });
}

function buildAuthorizedRegionList(alphaSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_AUTHORIZED_REGION_LIST_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    regionCount: alphaSpecification.specification.alphaRegionScope.regionCount,
    regions: alphaSpecification.specification.alphaRegionScope.regions
  });
}

function buildEnabledCapabilities(alphaSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ENABLED_CAPABILITIES_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    capabilities: alphaSpecification.specification.enabledSystems.systems
  });
}

function buildDisabledCapabilities(alphaSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_DISABLED_CAPABILITIES_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    capabilities: alphaSpecification.specification.disabledSystems.systems
  });
}

function buildRollbackAuthority(alphaSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ROLLBACK_AUTHORITY_RECORD_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    authorizedRoles: ["internal_developer_reviewer", "atlas_operator"],
    rollbackTriggers: alphaSpecification.specification.rollbackTriggers.triggers,
    emergencyDisableTriggers:
      alphaSpecification.specification.references.controlledAttachmentPlanId
        ? [
            "MANUAL_OPERATOR_DISABLE",
            "VALIDATION_GATE_FAILURE",
            "BOUNDARY_HANDOFF_MISMATCH",
            "UNEXPECTED_REGION_SCOPE"
          ]
        : [],
    deterministicFingerprint: hashHex(
      "ATLAS_ALPHA_ROLLBACK_AUTHORITY_RECORD_001",
      JSON.stringify(alphaSpecification.specification.rollbackTriggers.triggers)
    )
  });
}

function buildReviewSchedule() {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_REVIEW_SCHEDULE_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    approvedOn: APPROVAL_DATE,
    reviewCadence: [
      {
        scheduleId: "ALPHA_DAILY_REVIEW",
        frequency: "DAILY",
        purpose: "Review region scope, package validation, and failure signals."
      },
      {
        scheduleId: "ALPHA_BOUNDARY_REVIEW",
        frequency: "PER_BOUNDARY_TEST_WINDOW",
        purpose: "Review transition behaviour and rollback readiness."
      },
      {
        scheduleId: "ALPHA_EXIT_REVIEW",
        frequency: "END_OF_ALPHA_WINDOW",
        purpose: "Review readiness for any later attachment escalation."
      }
    ]
  });
}

function buildApprovalRecord(
  alphaSpecification,
  readinessReview,
  approvalScope,
  authorizedRegions,
  enabledCapabilities,
  disabledCapabilities,
  rollbackAuthority,
  reviewSchedule
) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_MANUAL_APPROVAL_RECORD_001",
    approvalId: "ATLAS_ALPHA_MANUAL_APPROVAL_001",
    alphaAttachmentId: alphaSpecification.specification.alphaAttachmentId,
    readinessReviewId: readinessReview.reviewRecord.reviewId,
    approvalStatus: "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION",
    lifecycleStatus: "APPROVED_ALPHA_PACKAGE",
    approvedOn: APPROVAL_DATE,
    approvalMode: "manual_only",
    approvalScopeId: approvalScope.schemaId,
    authorizedRegionListId: authorizedRegions.schemaId,
    enabledCapabilityListId: enabledCapabilities.schemaId,
    disabledCapabilityListId: disabledCapabilities.schemaId,
    rollbackAuthorityId: rollbackAuthority.schemaId,
    reviewScheduleId: reviewSchedule.schemaId,
    references: {
      alphaAttachmentId: alphaSpecification.specification.alphaAttachmentId,
      readinessDecision: readinessReview.reviewRecord.readinessDecision,
      alphaLifecycleStatus: alphaSpecification.lifecycle.lifecycleStatus
    },
    deterministicFingerprint: hashHex(
      "ATLAS_ALPHA_MANUAL_APPROVAL_001",
      alphaSpecification.validation.deterministicFingerprint,
      readinessReview.validation.deterministicFingerprint,
      APPROVAL_DATE
    )
  });
}

function buildValidation(
  alphaSpecification,
  readinessReview,
  approvalRecord,
  approvalScope,
  authorizedRegions,
  enabledCapabilities,
  disabledCapabilities,
  rollbackAuthority,
  reviewSchedule
) {
  const checks = [
    {
      name: "readiness_review_approved",
      ok:
        readinessReview.reviewRecord.readinessDecision ===
          "READY_FOR_MANUAL_ALPHA_APPROVAL" &&
        readinessReview.validation.status === "pass"
    },
    {
      name: "approval_scope_defined",
      ok:
        approvalScope.environment.length === 1 &&
        approvalScope.environment[0] === "DEVELOPMENT_ONLY" &&
        approvalScope.manualApprovalGates.length === 3
    },
    {
      name: "authorized_regions_defined",
      ok:
        authorizedRegions.regionCount >= 2 &&
        authorizedRegions.regions.every((region) => region.previewAvailable === true)
    },
    {
      name: "enabled_and_disabled_capabilities_defined",
      ok:
        enabledCapabilities.capabilities.length >= 5 &&
        disabledCapabilities.capabilities.includes("renderer_attachment") &&
        disabledCapabilities.capabilities.includes("runtime_scene_activation")
    },
    {
      name: "rollback_and_review_schedule_defined",
      ok:
        rollbackAuthority.authorizedRoles.length === 2 &&
        rollbackAuthority.rollbackTriggers.length >= 5 &&
        reviewSchedule.reviewCadence.length === 3
    },
    {
      name: "approval_record_consistent",
      ok:
        approvalRecord.approvalStatus ===
          "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION" &&
        approvalRecord.lifecycleStatus === "APPROVED_ALPHA_PACKAGE" &&
        approvalRecord.approvedOn === APPROVAL_DATE
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
    schemaId: "ATLAS_ALPHA_MANUAL_APPROVAL_VALIDATION_001",
    approvalId: approvalRecord.approvalId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      approvalRecord.approvalId,
      JSON.stringify(checks),
      approvalRecord.deterministicFingerprint
    ),
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(approvalRecord, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_MANUAL_APPROVAL_LIFECYCLE_001",
    approvalId: approvalRecord.approvalId,
    lifecycleStatus:
      validation.status === "pass"
        ? "APPROVED_ALPHA_PENDING_RUNTIME_IMPLEMENTATION"
        : "ALPHA_APPROVAL_BLOCKED",
    approvalStatus: approvalRecord.approvalStatus,
    manualApprovalCompleted: true,
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      approvalRecord.approvalId,
      validation.status,
      approvalRecord.approvalStatus
    )
  });
}

function buildReport(approvalRecord, authorizedRegions, enabledCapabilities, disabledCapabilities, validation, lifecycle) {
  const regionLines = authorizedRegions.regions
    .map(
      (region) =>
        `- ${region.regionId} -> ${region.packageId} -> ${region.selectedRecipeId}`
    )
    .join("\n");

  return `# ATLAS ALPHA MANUAL APPROVAL RECORD

## Scope

${approvalRecord.approvalId} records formal manual approval for the Atlas alpha package.

## Approval State

- approval status: ${approvalRecord.approvalStatus}
- lifecycle status: ${lifecycle.lifecycleStatus}
- approved on: ${approvalRecord.approvedOn}

## Authorized Regions

${regionLines}

## Enabled Capabilities

${enabledCapabilities.capabilities.map((item) => `- ${item}`).join("\n")}

## Disabled Capabilities

${disabledCapabilities.capabilities.map((item) => `- ${item}`).join("\n")}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Readiness

Approval state: ${approvalRecord.approvalStatus}
`;
}

export function buildAtlasAlphaManualApprovalRecord({ cwd = process.cwd() } = {}) {
  const alphaSpecification = buildAtlasAlphaAttachmentSpecification({ cwd });
  const readinessReview = buildAtlasAlphaAttachmentReadinessReview({ cwd });

  const approvalScope = buildApprovalScope(alphaSpecification);
  const authorizedRegions = buildAuthorizedRegionList(alphaSpecification);
  const enabledCapabilities = buildEnabledCapabilities(alphaSpecification);
  const disabledCapabilities = buildDisabledCapabilities(alphaSpecification);
  const rollbackAuthority = buildRollbackAuthority(alphaSpecification);
  const reviewSchedule = buildReviewSchedule();
  const approvalRecord = buildApprovalRecord(
    alphaSpecification,
    readinessReview,
    approvalScope,
    authorizedRegions,
    enabledCapabilities,
    disabledCapabilities,
    rollbackAuthority,
    reviewSchedule
  );
  const validation = buildValidation(
    alphaSpecification,
    readinessReview,
    approvalRecord,
    approvalScope,
    authorizedRegions,
    enabledCapabilities,
    disabledCapabilities,
    rollbackAuthority,
    reviewSchedule
  );
  const lifecycle = buildLifecycle(approvalRecord, validation);
  const report = buildReport(
    approvalRecord,
    authorizedRegions,
    enabledCapabilities,
    disabledCapabilities,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, APPROVAL_ROOT),
    approvalRecord,
    approvalScope,
    authorizedRegions,
    enabledCapabilities,
    disabledCapabilities,
    rollbackAuthority,
    reviewSchedule,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasAlphaManualApprovalRecord({ cwd = process.cwd() } = {}) {
  const approval = buildAtlasAlphaManualApprovalRecord({ cwd });
  const approvalDir = path.join(approval.root, "approval");
  const scopeDir = path.join(approval.root, "scope");
  const capabilitiesDir = path.join(approval.root, "capabilities");
  const authorityDir = path.join(approval.root, "authority");
  const scheduleDir = path.join(approval.root, "schedule");
  const validationDir = path.join(approval.root, "validation");
  const lifecycleDir = path.join(approval.root, "lifecycle");
  const reportsDir = path.join(approval.root, "reports");

  for (const directory of [
    approvalDir,
    scopeDir,
    capabilitiesDir,
    authorityDir,
    scheduleDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(approvalDir, APPROVAL_RECORD_FILENAME), approval.approvalRecord);
  writeJson(path.join(scopeDir, APPROVAL_SCOPE_FILENAME), approval.approvalScope);
  writeJson(path.join(scopeDir, AUTHORIZED_REGIONS_FILENAME), approval.authorizedRegions);
  writeJson(path.join(capabilitiesDir, ENABLED_CAPABILITIES_FILENAME), approval.enabledCapabilities);
  writeJson(path.join(capabilitiesDir, DISABLED_CAPABILITIES_FILENAME), approval.disabledCapabilities);
  writeJson(path.join(authorityDir, ROLLBACK_AUTHORITY_FILENAME), approval.rollbackAuthority);
  writeJson(path.join(scheduleDir, REVIEW_SCHEDULE_FILENAME), approval.reviewSchedule);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), approval.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), approval.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), approval.report);

  return approval;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasAlphaManualApprovalRecord();
}
