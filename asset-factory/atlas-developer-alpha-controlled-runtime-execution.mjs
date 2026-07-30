import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const EXECUTION_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001";

const SPECIFICATION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-execution-specification.json";
const PERMISSION_RECORD_FILENAME =
  "atlas-developer-alpha-controlled-runtime-permission-record.json";
const FLAG_TRANSITION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-flag-transition-record.json";
const MONITORING_PLAN_FILENAME =
  "atlas-developer-alpha-controlled-runtime-monitoring-plan.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-controlled-runtime-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-controlled-runtime-lifecycle.json";

const FINAL_AUDIT_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/record/atlas-developer-alpha-lifecycle-final-audit-record.json";
const FINAL_AUDIT_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-lifecycle-final-audit/ATLAS_DEVELOPER_ALPHA_LIFECYCLE_FINAL_AUDIT_001/validation/atlas-developer-alpha-lifecycle-final-audit-validation.json";
const AUTHORIZATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/authorization/atlas-developer-alpha-manual-session-authorization-record.json";
const RUNTIME_IMPLEMENTATION_SPEC_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/specification/atlas-runtime-implementation-specification.json";
const RUNTIME_PERMISSION_MODEL_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/permissions/atlas-runtime-implementation-permission-model.json";
const RUNTIME_ADAPTER_HARNESS_PATH =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001/specification/atlas-runtime-adapter-simulation-harness.json";
const RUNTIME_ADAPTER_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001/validation/atlas-runtime-adapter-simulation-validation.json";

const EXECUTION_DATE = "2026-07-30";
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
    finalAuditRecord: readJson(cwd, FINAL_AUDIT_RECORD_PATH),
    finalAuditValidation: readJson(cwd, FINAL_AUDIT_VALIDATION_PATH),
    authorizationRecord: readJson(cwd, AUTHORIZATION_RECORD_PATH),
    runtimeImplementationSpecification: readJson(cwd, RUNTIME_IMPLEMENTATION_SPEC_PATH),
    runtimePermissionModel: readJson(cwd, RUNTIME_PERMISSION_MODEL_PATH),
    runtimeAdapterHarness: readJson(cwd, RUNTIME_ADAPTER_HARNESS_PATH),
    runtimeAdapterValidation: readJson(cwd, RUNTIME_ADAPTER_VALIDATION_PATH)
  });
}

function buildExecutionSpecification(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_SPECIFICATION_001",
    executionId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001",
    definedOn: EXECUTION_DATE,
    references: {
      lifecycleFinalAuditId: inputs.finalAuditRecord.auditId,
      authorizationId: inputs.authorizationRecord.authorizationId,
      runtimeImplementationId:
        inputs.runtimeImplementationSpecification.runtimeImplementationId,
      runtimeAdapterSimulationId: inputs.runtimeAdapterHarness.simulationId
    },
    runtimeExecutionExperimentScope: {
      environment: "DEVELOPMENT_ONLY",
      scopeType: "MINIMAL_CONTROLLED_RUNTIME_PATHWAY",
      regionId:
        inputs.finalAuditRecord.lifecycleSummary.packageId.includes("BELLARINE")
          ? "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
          : inputs.finalAuditRecord.lifecycleSummary.packageId,
      packageId: inputs.finalAuditRecord.lifecycleSummary.packageId,
      recipeId: inputs.finalAuditRecord.lifecycleSummary.recipeId,
      internalDeveloperOnly: true,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false
    },
    exactFeatureFlagTransitionPlan: {
      currentFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      plannedTransition: [
        {
          stage: "PRE_ENABLEMENT_REVIEW",
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        {
          stage: "MINIMAL_RUNTIME_EXPERIMENT_WINDOW",
          runtimeExecutionEnabled: "planned transition",
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        {
          stage: "POST_EXPERIMENT_RESET",
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        }
      ]
    },
    developerOnlyPermissionBoundary: {
      authorizedRoles: [
        "atlas_operator",
        "internal_developer_reviewer"
      ],
      blockedRoles: ["beta_tester", "live_player", "external_reviewer"],
      approvedRegionOnly: true,
      approvedRecipeOnly: true,
      approvedPackageOnly: true
    },
    monitoringRequirements: {
      requiredTelemetrySignals:
        inputs.runtimeImplementationSpecification.telemetryRequirements.requiredSignals,
      monitoringChecklist: [
        "watch coordinate_lookup_attempt",
        "watch package_validation_result",
        "watch recipe_selection_result",
        "watch permission_gate_state",
        "watch rollback_trigger_state",
        "watch runtime_enablement_block_reason"
      ],
      requiredReferences: [
        "RUNTIME_MONITORING_HEALTHY_GENERATION_001_TELEMETRY",
        "RUNTIME_MONITORING_BUDGET_WARNING_001_TELEMETRY",
        "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001_TELEMETRY",
        "RUNTIME_MONITORING_EMERGENCY_SHUTDOWN_001_TELEMETRY"
      ]
    },
    rollbackTriggers: [
      "package validation failure",
      "recipe resolution outside approved recipe",
      "permission model violation",
      "unexpected map attachment request",
      "unexpected renderer attachment request",
      "emergency shutdown signal"
    ],
    successCriteria: [
      "single approved region remains the only runtime scope",
      "single approved recipe remains the only runtime resolution",
      "runtimeExecutionEnabled change remains manual and auditable",
      "mapAttachmentAllowed stays false",
      "automaticRendererExecutionAllowed stays false",
      "monitoring remains readable through the full experiment window"
    ],
    failureCriteria: [
      "any recipe other than COASTAL_LOCATION_RECIPE_001 is resolved",
      "any region outside REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION is touched",
      "mapAttachmentAllowed becomes true",
      "automaticRendererExecutionAllowed becomes true",
      "rendererAttachmentAuthorized becomes true without separate approval",
      "runtime telemetry enters blocked or emergency state without immediate rollback"
    ],
    activationAuditRequirements: {
      requiredRecords: [
        "runtime flag change record",
        "operator approval record",
        "monitoring session capture",
        "rollback outcome capture"
      ],
      requiredAuditFields: [
        "actorRole",
        "timestamp",
        "reason",
        "preFlagState",
        "postFlagState",
        "regionId",
        "recipeId"
      ]
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_SPECIFICATION_001",
      inputs.finalAuditRecord.deterministicFingerprint,
      inputs.authorizationRecord.deterministicFingerprint,
      inputs.runtimeImplementationSpecification.deterministicFingerprint,
      inputs.runtimeAdapterHarness.deterministicFingerprint,
      EXECUTION_DATE
    )
  });
}

function buildPermissionRecord(inputs, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_PERMISSION_RECORD_001",
    executionId: specification.executionId,
    recordedOn: EXECUTION_DATE,
    permissionBoundary: {
      runtimeExecutionEnabled: "planned transition",
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false,
      developerOnly: true,
      approvedRegionOnly: specification.runtimeExecutionExperimentScope.regionId,
      approvedRecipeOnly: specification.runtimeExecutionExperimentScope.recipeId
    },
    inheritedPermissionModel:
      inputs.runtimePermissionModel.permissionState,
    manualEnablementRequired: true,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_PERMISSION_RECORD_001",
      specification.deterministicFingerprint,
      inputs.runtimePermissionModel.deterministicFingerprint
    )
  });
}

function buildFlagTransitionRecord(specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_RECORD_001",
    executionId: specification.executionId,
    recordedOn: EXECUTION_DATE,
    transitionPlan: specification.exactFeatureFlagTransitionPlan,
    immutableSafetyFlags: {
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false
    },
    auditRequirement: "every runtimeExecutionEnabled change must be recorded before and after transition",
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_FLAG_TRANSITION_RECORD_001",
      specification.deterministicFingerprint,
      JSON.stringify(specification.exactFeatureFlagTransitionPlan)
    )
  });
}

function buildMonitoringPlan(specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_MONITORING_PLAN_001",
    executionId: specification.executionId,
    recordedOn: EXECUTION_DATE,
    requiredSignals: specification.monitoringRequirements.requiredTelemetrySignals,
    monitoringChecklist: specification.monitoringRequirements.monitoringChecklist,
    triggerResponses: [
      {
        trigger: "WARNING_PACKAGE_NEAR_LIMIT",
        action: "pause experiment and review package state"
      },
      {
        trigger: "RECIPE_FALLBACK_WARNING",
        action: "halt runtime path and revert to approved planning-only path"
      },
      {
        trigger: "EMERGENCY_SHUTDOWN_TRIGGERED",
        action: "immediate rollback and disable runtimeExecutionEnabled"
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_MONITORING_PLAN_001",
      specification.deterministicFingerprint,
      JSON.stringify(specification.monitoringRequirements.requiredReferences)
    )
  });
}

function buildValidation(inputs, specification, permissionRecord, flagTransitionRecord, monitoringPlan) {
  const checks = [
    {
      name: "lifecycle_certification_and_authorization_valid",
      ok:
        inputs.finalAuditValidation.status === "pass" &&
        inputs.finalAuditRecord.certificationStatus ===
          "CERTIFIED_FOR_FUTURE_DEVELOPER_ONLY_ATLAS_ALPHA_SESSION" &&
        inputs.authorizationRecord.authorizationState ===
          "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "single_region_and_single_recipe_scope_defined",
      ok:
        specification.runtimeExecutionExperimentScope.regionId ===
          "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION" &&
        specification.runtimeExecutionExperimentScope.recipeId ===
          "COASTAL_LOCATION_RECIPE_001"
    },
    {
      name: "runtime_flag_transition_minimal_and_map_renderer_blocked",
      ok:
        permissionRecord.permissionBoundary.mapAttachmentAllowed === false &&
        permissionRecord.permissionBoundary.automaticRendererExecutionAllowed === false &&
        flagTransitionRecord.immutableSafetyFlags.mapAttachmentAllowed === false &&
        flagTransitionRecord.immutableSafetyFlags.automaticRendererExecutionAllowed === false
    },
    {
      name: "monitoring_and_rollback_requirements_defined",
      ok:
        monitoringPlan.requiredSignals.length >= 6 &&
        specification.rollbackTriggers.length >= 6 &&
        inputs.runtimeAdapterValidation.status === "pass"
    },
    {
      name: "developer_only_permission_boundary_preserved",
      ok:
        permissionRecord.permissionBoundary.developerOnly === true &&
        specification.developerOnlyPermissionBoundary.authorizedRoles.length === 2
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked_except_planned_runtime_flag_transition",
      ok:
        inputs.runtimePermissionModel.permissionState.mapAttachmentAllowed === false &&
        inputs.runtimePermissionModel.permissionState.automaticRendererExecutionAllowed === false &&
        inputs.runtimePermissionModel.permissionState.rendererAttachmentAuthorized === false &&
        inputs.runtimePermissionModel.permissionState.mapDownloadsAuthorized === false &&
        inputs.runtimePermissionModel.permissionState.blenderAuthorized === false &&
        inputs.runtimePermissionModel.permissionState.glbAuthorized === false &&
        inputs.runtimePermissionModel.permissionState.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_VALIDATION_001",
    executionId: specification.executionId,
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
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_VALIDATION_001",
      specification.deterministicFingerprint,
      permissionRecord.deterministicFingerprint,
      flagTransitionRecord.deterministicFingerprint,
      monitoringPlan.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_LIFECYCLE_001",
    executionId: specification.executionId,
    lifecycleStatus:
      validation.status === "pass"
        ? "CONTROLLED_RUNTIME_READY_PENDING_MANUAL_ENABLEMENT_REVIEW"
        : "CONTROLLED_RUNTIME_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_LIFECYCLE_001",
      validation.status,
      specification.executionId,
      EXECUTION_DATE
    )
  });
}

export function buildAtlasDeveloperAlphaControlledRuntimeExecution({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const specification = buildExecutionSpecification(inputs);
  const permissionRecord = buildPermissionRecord(inputs, specification);
  const flagTransitionRecord = buildFlagTransitionRecord(specification);
  const monitoringPlan = buildMonitoringPlan(specification);
  const validation = buildValidation(
    inputs,
    specification,
    permissionRecord,
    flagTransitionRecord,
    monitoringPlan
  );
  const lifecycle = buildLifecycle(specification, validation);

  return deepFreeze({
    root: path.resolve(cwd, EXECUTION_ROOT),
    specification,
    permissionRecord,
    flagTransitionRecord,
    monitoringPlan,
    validation,
    lifecycle,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaControlledRuntimeExecution({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaControlledRuntimeExecution({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const permissionsDir = path.join(result.root, "permissions");
  const flagsDir = path.join(result.root, "flags");
  const monitoringDir = path.join(result.root, "monitoring");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");

  for (const directory of [
    specificationDir,
    permissionsDir,
    flagsDir,
    monitoringDir,
    validationDir,
    lifecycleDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), result.specification);
  writeJson(path.join(permissionsDir, PERMISSION_RECORD_FILENAME), result.permissionRecord);
  writeJson(path.join(flagsDir, FLAG_TRANSITION_FILENAME), result.flagTransitionRecord);
  writeJson(path.join(monitoringDir, MONITORING_PLAN_FILENAME), result.monitoringPlan);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaControlledRuntimeExecution();
}
