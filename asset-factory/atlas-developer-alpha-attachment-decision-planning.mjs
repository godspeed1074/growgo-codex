import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const DECISION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-decision/ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001";

const FRAMEWORK_FILENAME = "atlas-developer-alpha-decision-framework.json";
const EXPERIMENT_FILENAME = "atlas-developer-alpha-experiment-specification.json";
const VALIDATION_FILENAME = "atlas-developer-alpha-decision-validation.json";
const LIFECYCLE_FILENAME = "atlas-developer-alpha-decision-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-decision-report.md";

const FINAL_AUDIT_RECORD_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/audit/atlas-alpha-final-safety-audit-record.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/validation/atlas-alpha-final-safety-validation.json";
const FINAL_AUDIT_LIFECYCLE_PATH =
  "asset-factory-workspace/atlas-alpha-final-audit/ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001/lifecycle/atlas-alpha-final-safety-lifecycle.json";
const APPROVAL_SCOPE_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/scope/atlas-alpha-authorized-region-list.json";
const APPROVAL_RECORD_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/approval/atlas-alpha-manual-approval-record.json";
const RUNTIME_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/specification/atlas-runtime-implementation-specification.json";
const RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/validation/atlas-runtime-implementation-validation.json";

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
    finalAuditRecord: readJson(cwd, FINAL_AUDIT_RECORD_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH),
    finalAuditLifecycle: readJson(cwd, FINAL_AUDIT_LIFECYCLE_PATH),
    approvalScope: readJson(cwd, APPROVAL_SCOPE_PATH),
    approvalRecord: readJson(cwd, APPROVAL_RECORD_PATH),
    runtimeSpecification: readJson(cwd, RUNTIME_SPECIFICATION_PATH),
    runtimeValidation: readJson(cwd, RUNTIME_VALIDATION_PATH)
  });
}

function buildDecisionFramework(inputs) {
  const primaryRegion = inputs.approvalScope.regions[0];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DECISION_FRAMEWORK_001",
    decisionId: "ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001",
    decidedOn: DECISION_DATE,
    references: {
      finalSafetyAuditId: inputs.finalAuditRecord.auditId,
      alphaManualApprovalId: inputs.approvalRecord.approvalId,
      runtimeImplementationId: inputs.runtimeSpecification.runtimeImplementationId
    },
    alphaExperimentScope: {
      environment: "DEVELOPMENT_ONLY",
      scopeType: "TINY_INTERNAL_ATTACHMENT_EXPERIMENT",
      allowedActions: [
        "manual developer inspection",
        "metadata-only coordinate lookup rehearsal",
        "non-player internal monitoring review"
      ],
      blockedActions: [
        "player exposure",
        "beta distribution",
        "production distribution",
        "automatic renderer execution",
        "map download expansion"
      ]
    },
    permittedTestRegion: {
      primaryRegionId: primaryRegion.regionId,
      packageId: primaryRegion.packageId,
      expectedRecipeId: primaryRegion.expectedRecipeId,
      latBucket: primaryRegion.latBucket,
      lngBucket: primaryRegion.lngBucket,
      regionPolicy: "single-primary-region unless manual escalation approved"
    },
    testUserBoundaries: {
      userClasses: ["internal_developer_reviewer", "atlas_operator"],
      maxConcurrentTestUsers: 2,
      playerAccountsAllowed: false,
      internalOnly: true
    },
    successMetrics: [
      "deterministic coordinate lookup remains stable across repeat requests",
      "package validation produces no new blocked states in approved region",
      "monitoring signals stay readable in developer control centre views",
      "rollback path remains callable without state drift"
    ],
    failureCriteria: [
      "runtimeExecutionEnabled becomes true without manual authorization",
      "mapAttachmentAllowed becomes true outside approved experiment review",
      "automaticRendererExecutionAllowed becomes true",
      "package validation enters blocked state for permitted region",
      "monitoring emits emergency shutdown or unresolved blocked condition"
    ],
    rollbackOwner: {
      ownerRole: "atlas_operator",
      backupRole: "internal_developer_reviewer",
      authoritySource: "ATLAS_ALPHA_ROLLBACK_AUTHORITY_RECORD_001"
    },
    experimentDuration: {
      mode: "time-boxed_manual_window",
      maximumActiveWindowMinutes: 30,
      repeatability: "single-session unless reapproved"
    },
    exitConditions: [
      "all success metrics satisfied and documented",
      "any failure criteria triggered",
      "manual rollback invoked",
      "experiment window expires",
      "approval owner halts experiment"
    ],
    approvalRequirements: [
      "ATLAS_ALPHA_FINAL_SAFETY_AUDIT_001 remains pass",
      "ATLAS_ALPHA_MANUAL_APPROVAL_001 remains valid",
      "ATLAS_RUNTIME_IMPLEMENTATION_001 remains planning-only",
      "manual developer signoff recorded before experiment execution"
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001",
      inputs.finalAuditRecord.deterministicFingerprint,
      primaryRegion.regionId,
      DECISION_DATE
    )
  });
}

function buildExperimentSpecification(inputs, framework) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_EXPERIMENT_SPECIFICATION_001",
    decisionId: framework.decisionId,
    experimentId: "ATLAS_DEVELOPER_ALPHA_EXPERIMENT_001",
    experimentState: "DECISION_PENDING_MANUAL_GO_NO_GO",
    environment: "DEVELOPMENT_ONLY",
    permittedRegion: framework.permittedTestRegion,
    testUserBoundaries: framework.testUserBoundaries,
    runtimeFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    telemetryPlan: {
      requiredSignals:
        inputs.runtimeSpecification.telemetryRequirements.requiredSignals,
      visibilityTarget: "internal developer monitoring only"
    },
    rollbackPlan: {
      owner: framework.rollbackOwner.ownerRole,
      backupOwner: framework.rollbackOwner.backupRole,
      rollbackSteps: inputs.runtimeSpecification.rollbackProcedure.rollbackSteps
    },
    approvalGate: {
      requiredRecords: framework.approvalRequirements,
      finalAuditLifecycle: inputs.finalAuditLifecycle.lifecycleStatus,
      finalAuditValidationStatus: inputs.finalAuditValidation.status
    },
    deterministicFingerprint: hashHex(
      framework.deterministicFingerprint,
      JSON.stringify(framework.successMetrics),
      JSON.stringify(framework.failureCriteria)
    )
  });
}

function buildValidation(inputs, framework, experimentSpecification) {
  const checks = [
    {
      name: "final_audit_passed",
      ok:
        inputs.finalAuditValidation.status === "pass" &&
        inputs.finalAuditLifecycle.lifecycleStatus === "ALPHA_FINAL_GATE_PASSED"
    },
    {
      name: "manual_approval_preserved",
      ok:
        inputs.approvalRecord.approvalStatus ===
          "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION"
    },
    {
      name: "runtime_planning_only_preserved",
      ok:
        inputs.runtimeValidation.status === "pass" &&
        inputs.runtimeValidation.runtimeExecutionEnabled === false &&
        inputs.runtimeValidation.mapAttachmentAllowed === false &&
        inputs.runtimeValidation.automaticRendererExecutionAllowed === false
    },
    {
      name: "single_region_internal_scope_defined",
      ok:
        framework.permittedTestRegion.primaryRegionId != null &&
        framework.testUserBoundaries.playerAccountsAllowed === false &&
        framework.testUserBoundaries.maxConcurrentTestUsers <= 2
    },
    {
      name: "success_and_failure_gates_defined",
      ok:
        framework.successMetrics.length >= 4 &&
        framework.failureCriteria.length >= 5 &&
        framework.exitConditions.length >= 5
    },
    {
      name: "rollback_owner_and_duration_defined",
      ok:
        framework.rollbackOwner.ownerRole === "atlas_operator" &&
        framework.experimentDuration.maximumActiveWindowMinutes === 30
    },
    {
      name: "experiment_keeps_flags_disabled",
      ok:
        experimentSpecification.runtimeFlags.runtimeExecutionEnabled === false &&
        experimentSpecification.runtimeFlags.mapAttachmentAllowed === false &&
        experimentSpecification.runtimeFlags.automaticRendererExecutionAllowed ===
          false
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.runtimeValidation.rendererAttachmentAuthorized === false &&
        inputs.runtimeValidation.mapDownloadsAuthorized === false &&
        inputs.runtimeValidation.blenderAuthorized === false &&
        inputs.runtimeValidation.glbAuthorized === false &&
        inputs.runtimeValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DECISION_VALIDATION_001",
    decisionId: framework.decisionId,
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
      framework.decisionId,
      JSON.stringify(checks),
      experimentSpecification.deterministicFingerprint
    )
  });
}

function buildLifecycle(framework, experimentSpecification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_DECISION_LIFECYCLE_001",
    decisionId: framework.decisionId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_DEVELOPER_ALPHA_DECISION"
        : "DEVELOPER_ALPHA_DECISION_BLOCKED",
    experimentState: experimentSpecification.experimentState,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      framework.decisionId,
      validation.status,
      experimentSpecification.experimentState
    )
  });
}

function buildReport(framework, experimentSpecification, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA ATTACHMENT DECISION

## Goal

Define the decision framework for whether to proceed from audited preparation into a tiny developer-only Atlas attachment experiment.

## Scope

- decision id: ${framework.decisionId}
- decided on: ${framework.decidedOn}
- permitted region: ${framework.permittedTestRegion.primaryRegionId}
- environment: ${experimentSpecification.environment}
- test users: ${framework.testUserBoundaries.userClasses.join(", ")}

## Success Metrics

${framework.successMetrics.map((item) => `- ${item}`).join("\n")}

## Failure Criteria

${framework.failureCriteria.map((item) => `- ${item}`).join("\n")}

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

## Readiness

Developer alpha decision readiness: ${
    validation.status === "pass" ? "READY_FOR_GO_NO_GO_REVIEW" : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaAttachmentDecisionPlanning({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const decisionFramework = buildDecisionFramework(inputs);
  const experimentSpecification = buildExperimentSpecification(
    inputs,
    decisionFramework
  );
  const validation = buildValidation(
    inputs,
    decisionFramework,
    experimentSpecification
  );
  const lifecycle = buildLifecycle(
    decisionFramework,
    experimentSpecification,
    validation
  );
  const report = buildReport(
    decisionFramework,
    experimentSpecification,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, DECISION_ROOT),
    decisionFramework,
    experimentSpecification,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaAttachmentDecisionPlanning({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasDeveloperAlphaAttachmentDecisionPlanning({ cwd });
  const frameworkDir = path.join(result.root, "framework");
  const experimentDir = path.join(result.root, "experiment");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    frameworkDir,
    experimentDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(frameworkDir, FRAMEWORK_FILENAME), result.decisionFramework);
  writeJson(
    path.join(experimentDir, EXPERIMENT_FILENAME),
    result.experimentSpecification
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
  writeAtlasDeveloperAlphaAttachmentDecisionPlanning();
}
