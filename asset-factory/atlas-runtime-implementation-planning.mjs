import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RUNTIME_ROOT =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001";

const SPECIFICATION_FILENAME = "atlas-runtime-implementation-specification.json";
const PERMISSION_MODEL_FILENAME = "atlas-runtime-implementation-permission-model.json";
const LIFECYCLE_FILENAME = "atlas-runtime-implementation-lifecycle-rules.json";
const VALIDATION_FILENAME = "atlas-runtime-implementation-validation.json";
const REPORT_FILENAME = "atlas-runtime-implementation-architecture-report.md";

const APPROVAL_RECORD_PATH =
  "asset-factory-workspace/atlas-alpha-approval/ATLAS_ALPHA_MANUAL_APPROVAL_001/approval/atlas-alpha-manual-approval-record.json";
const READINESS_REVIEW_PATH =
  "asset-factory-workspace/atlas-alpha-readiness-review/ATLAS_ALPHA_ATTACHMENT_READINESS_REVIEW_001/review/atlas-alpha-attachment-readiness-review-record.json";
const CONTROLLED_SIMULATION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001/validation/atlas-controlled-attachment-simulation-validation.json";
const MAP_ATTACHMENT_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/specification/atlas-map-attachment-specification.json";

const APPROVAL_DATE = "2026-07-30";
const RUNTIME_SAFETY_FLAGS = Object.freeze({
  runtimeExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false
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
    readinessReview: readJson(cwd, READINESS_REVIEW_PATH),
    controlledSimulationValidation: readJson(
      cwd,
      CONTROLLED_SIMULATION_VALIDATION_PATH
    ),
    mapAttachmentSpecification: readJson(cwd, MAP_ATTACHMENT_SPECIFICATION_PATH)
  });
}

function buildRuntimeImplementationSpecification(inputs) {
  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_IMPLEMENTATION_SPECIFICATION_001",
    runtimeImplementationId: "ATLAS_RUNTIME_IMPLEMENTATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    approvedOn: APPROVAL_DATE,
    references: {
      atlasAlphaManualApprovalId: inputs.approvalRecord.approvalId,
      atlasAlphaReadinessReviewId: inputs.readinessReview.reviewId,
      atlasControlledAttachmentSimulationId:
        "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001",
      atlasMapAttachmentId: inputs.mapAttachmentSpecification.attachmentId
    },
    runtimeAdapterContract: {
      schemaId: "ATLAS_RUNTIME_ADAPTER_CONTRACT_001",
      adapterResponsibilities: [
        "consume validated region metadata only",
        "resolve coordinate-to-package handoff through approved map attachment contract",
        "request recipe selection from approved selector inputs only",
        "prepare runtime-ready payload envelopes without activating runtime"
      ],
      blockedResponsibilities: [
        "direct renderer boot",
        "direct map download",
        "asset mutation",
        "live player exposure"
      ],
      requiredInputs: [
        "validatedPackageMetadata",
        "approvedRecipeSelection",
        "deterministicSeed",
        "permissionState",
        "featureFlagState"
      ]
    },
    mapIntegrationBoundary: {
      schemaId: "ATLAS_RUNTIME_MAP_INTEGRATION_BOUNDARY_001",
      allowedBoundaryStates: [
        "COORDINATE_LOOKUP_CONFIRMED",
        "PACKAGE_METADATA_READY",
        "SELECTOR_HANDOFF_READY",
        "RUNTIME_ADAPTER_PREPARED"
      ],
      blockedBoundaryStates: [
        "LIVE_MAP_ATTACHMENT",
        "PLAYER_VISIBLE_RUNTIME",
        "UNVALIDATED_PACKAGE_HANDOFF"
      ],
      sourceContract:
        inputs.mapAttachmentSpecification.coordinateInputContract.schemaId
    },
    rendererHandoffBoundary: {
      schemaId: "ATLAS_RUNTIME_RENDERER_HANDOFF_BOUNDARY_001",
      preconditions: [
        "manual alpha approval remains valid",
        "runtime adapter payload validated",
        "renderer capability separately authorized",
        "rollback path verified"
      ],
      blockedUntilAuthorized: [
        "renderer attachment",
        "automatic renderer execution",
        "runtime scene activation"
      ],
      blockedImports:
        inputs.mapAttachmentSpecification.rendererBoundaryRules.blockedImports
    },
    lifecycleStates: [
      "RUNTIME_PLANNING_ONLY",
      "ADAPTER_CONTRACT_READY",
      "ALPHA_RUNTIME_SCOPE_DEFINED",
      "FEATURE_FLAGS_DEFINED",
      "TELEMETRY_READY",
      "ROLLBACK_READY",
      "IMPLEMENTATION_READY_PENDING_MANUAL_ENABLEMENT"
    ],
    featureFlagProgression: {
      schemaId: "ATLAS_RUNTIME_FEATURE_FLAG_PROGRESSION_001",
      permanentDefaults: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      stagedProgression: [
        {
          stage: "PLANNING",
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        {
          stage: "ALPHA_INTERNAL_VALIDATION",
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        },
        {
          stage: "MANUAL_RUNTIME_ENABLEMENT_REVIEW",
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false
        }
      ]
    },
    alphaRuntimeScope: {
      schemaId: "ATLAS_ALPHA_RUNTIME_SCOPE_001",
      authorizedRegions: inputs.approvalRecord.authorizedRegionListId,
      scopePolicy: "development-only manual alpha preparation",
      allowedCapabilities: inputs.approvalRecord.enabledCapabilityListId,
      disabledCapabilities: inputs.approvalRecord.disabledCapabilityListId,
      unsupportedCapabilities: [
        "beta exposure",
        "production exposure",
        "player-triggered runtime launch",
        "automatic region streaming"
      ]
    },
    telemetryRequirements: {
      schemaId: "ATLAS_RUNTIME_TELEMETRY_REQUIREMENTS_001",
      requiredSignals: [
        "coordinate_lookup_attempt",
        "package_validation_result",
        "recipe_selection_result",
        "permission_gate_state",
        "rollback_trigger_state",
        "runtime_enablement_block_reason"
      ],
      privacyPolicy: "developer-only internal planning telemetry",
      exportPolicy: "no player telemetry, no live gameplay telemetry"
    },
    rollbackProcedure: {
      schemaId: "ATLAS_RUNTIME_ROLLBACK_PROCEDURE_001",
      triggerSources: [
        "manual operator disable",
        "package validation failure",
        "coordinate resolution mismatch",
        "permission model violation",
        "renderer boundary violation"
      ],
      rollbackSteps: [
        "set runtimeExecutionEnabled false",
        "set mapAttachmentAllowed false",
        "set automaticRendererExecutionAllowed false",
        "return to metadata-only planning state",
        "record blocked lifecycle reason"
      ]
    },
    failureHandling: {
      schemaId: "ATLAS_RUNTIME_FAILURE_HANDLING_001",
      failureModes: [
        "PACKAGE_VALIDATION_FAILED",
        "RECIPE_SELECTION_BLOCKED",
        "PERMISSION_GATE_BLOCKED",
        "MAP_INTEGRATION_CONTRACT_MISMATCH",
        "RENDERER_HANDOFF_PRECONDITION_FAILED"
      ],
      safeFailureRules: [
        "stay in planning-only state",
        "do not activate runtime",
        "do not attach renderer",
        "do not download maps",
        "do not mutate assets"
      ]
    }
  });
}

function buildPermissionModel(inputs, specification) {
  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_PERMISSION_MODEL_001",
    runtimeImplementationId: specification.runtimeImplementationId,
    approvalReference: inputs.approvalRecord.approvalId,
    readinessReference: inputs.readinessReview.reviewId,
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
    manualEnablementRequired: true,
    authorizationBoundaries: [
      "development-only internal review",
      "manual operator approval",
      "validated package input only",
      "no player-facing runtime exposure"
    ],
    deterministicFingerprint: hashHex(
      specification.runtimeImplementationId,
      JSON.stringify(RUNTIME_SAFETY_FLAGS),
      inputs.approvalRecord.deterministicFingerprint
    )
  });
}

function buildLifecycleRules(specification, permissionModel) {
  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_IMPLEMENTATION_LIFECYCLE_RULES_001",
    runtimeImplementationId: specification.runtimeImplementationId,
    lifecycleStatus: "IMPLEMENTATION_PLANNING_READY",
    currentState: "RUNTIME_PLANNING_ONLY",
    nextState: "ADAPTER_CONTRACT_READY",
    allowedTransitions: [
      "RUNTIME_PLANNING_ONLY->ADAPTER_CONTRACT_READY",
      "ADAPTER_CONTRACT_READY->ALPHA_RUNTIME_SCOPE_DEFINED",
      "ALPHA_RUNTIME_SCOPE_DEFINED->FEATURE_FLAGS_DEFINED",
      "FEATURE_FLAGS_DEFINED->TELEMETRY_READY",
      "TELEMETRY_READY->ROLLBACK_READY",
      "ROLLBACK_READY->IMPLEMENTATION_READY_PENDING_MANUAL_ENABLEMENT"
    ],
    blockedTransitions: [
      "RUNTIME_PLANNING_ONLY->RUNTIME_EXECUTING",
      "FEATURE_FLAGS_DEFINED->RENDERER_ATTACHED",
      "ROLLBACK_READY->LIVE_PLAYER_RUNTIME"
    ],
    runtimeExecutionEnabled: permissionModel.permissionState.runtimeExecutionEnabled,
    mapAttachmentAllowed: permissionModel.permissionState.mapAttachmentAllowed,
    automaticRendererExecutionAllowed:
      permissionModel.permissionState.automaticRendererExecutionAllowed
  });
}

function buildValidation(inputs, specification, permissionModel, lifecycleRules) {
  const checks = [
    {
      name: "manual_alpha_approval_present",
      ok:
        inputs.approvalRecord.approvalStatus ===
          "MANUALLY_APPROVED_FOR_CONTROLLED_ALPHA_PREPARATION" &&
        inputs.approvalRecord.approvedOn === APPROVAL_DATE
    },
    {
      name: "readiness_review_passed",
      ok:
        inputs.readinessReview.readinessDecision ===
          "READY_FOR_MANUAL_ALPHA_APPROVAL" &&
        inputs.readinessReview.unresolvedBlocks.length === 0
    },
    {
      name: "controlled_attachment_simulation_passed",
      ok:
        inputs.controlledSimulationValidation.status === "pass" &&
        inputs.controlledSimulationValidation.runtimeActivationAuthorized === false &&
        inputs.controlledSimulationValidation.rendererAttachmentAuthorized === false
    },
    {
      name: "map_attachment_contract_available",
      ok:
        inputs.mapAttachmentSpecification.attachmentId === "ATLAS_MAP_ATTACHMENT_001" &&
        inputs.mapAttachmentSpecification.mapAttachmentPermissions.permissions
          .runtimeActivationAuthorized === false
    },
    {
      name: "runtime_flags_remain_disabled",
      ok:
        permissionModel.permissionState.runtimeExecutionEnabled === false &&
        permissionModel.permissionState.mapAttachmentAllowed === false &&
        permissionModel.permissionState.automaticRendererExecutionAllowed === false
    },
    {
      name: "runtime_scope_and_telemetry_defined",
      ok:
        specification.alphaRuntimeScope.unsupportedCapabilities.length >= 4 &&
        specification.telemetryRequirements.requiredSignals.length >= 6
    },
    {
      name: "lifecycle_stays_planning_only",
      ok:
        lifecycleRules.lifecycleStatus === "IMPLEMENTATION_PLANNING_READY" &&
        lifecycleRules.currentState === "RUNTIME_PLANNING_ONLY"
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_IMPLEMENTATION_VALIDATION_001",
    runtimeImplementationId: specification.runtimeImplementationId,
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
      specification.runtimeImplementationId,
      JSON.stringify(checks),
      permissionModel.deterministicFingerprint
    )
  });
}

function buildReport(specification, permissionModel, lifecycleRules, validation) {
  return `# ATLAS RUNTIME IMPLEMENTATION PLANNING

## Goal

Define the future runtime architecture path from approved Atlas alpha preparation into controlled runtime implementation.

## Runtime Scope

- runtime implementation id: ${specification.runtimeImplementationId}
- approved on: ${specification.approvedOn}
- alpha runtime scope: ${specification.alphaRuntimeScope.scopePolicy}

## Boundaries

- map integration boundary states: ${specification.mapIntegrationBoundary.allowedBoundaryStates.join(", ")}
- renderer handoff remains blocked until manual authorization
- runtime adapter remains metadata-driven only

## Feature Flags

- runtimeExecutionEnabled: ${permissionModel.permissionState.runtimeExecutionEnabled}
- mapAttachmentAllowed: ${permissionModel.permissionState.mapAttachmentAllowed}
- automaticRendererExecutionAllowed: ${permissionModel.permissionState.automaticRendererExecutionAllowed}

## Lifecycle

- lifecycle status: ${lifecycleRules.lifecycleStatus}
- current state: ${lifecycleRules.currentState}
- next state: ${lifecycleRules.nextState}

## Validation

${validation.checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`).join("\n")}

## Readiness

Future runtime implementation readiness: ${validation.status === "pass" ? "READY_FOR_CONTROLLED_IMPLEMENTATION_PLANNING" : "BLOCKED"}
`;
}

export function buildAtlasRuntimeImplementationPlanning({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const specification = buildRuntimeImplementationSpecification(inputs);
  const permissionModel = buildPermissionModel(inputs, specification);
  const lifecycleRules = buildLifecycleRules(specification, permissionModel);
  const validation = buildValidation(
    inputs,
    specification,
    permissionModel,
    lifecycleRules
  );
  const report = buildReport(
    specification,
    permissionModel,
    lifecycleRules,
    validation
  );

  return deepFreeze({
    root: path.resolve(cwd, RUNTIME_ROOT),
    specification,
    permissionModel,
    lifecycleRules,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasRuntimeImplementationPlanning({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasRuntimeImplementationPlanning({ cwd });

  const specificationDir = path.join(result.root, "specification");
  const permissionsDir = path.join(result.root, "permissions");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const validationDir = path.join(result.root, "validation");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    permissionsDir,
    lifecycleDir,
    validationDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    result.specification
  );
  writeJson(
    path.join(permissionsDir, PERMISSION_MODEL_FILENAME),
    result.permissionModel
  );
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycleRules);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasRuntimeImplementationPlanning();
}
