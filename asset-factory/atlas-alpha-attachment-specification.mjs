import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasControlledMapAttachmentPlanning } from "./atlas-controlled-map-attachment-planning.mjs";
import { buildAtlasControlledAttachmentSimulation } from "./atlas-controlled-attachment-simulation.mjs";
import { buildAtlasMapPreviewAttachment } from "./atlas-map-preview-attachment.mjs";

const ALPHA_ROOT =
  "asset-factory-workspace/atlas-alpha-attachment/ATLAS_ALPHA_ATTACHMENT_001";

const SPECIFICATION_FILENAME = "atlas-alpha-attachment-specification.json";
const PERMISSION_MATRIX_FILENAME = "atlas-alpha-attachment-permission-matrix.json";
const MONITORING_CHECKLIST_FILENAME = "atlas-alpha-attachment-monitoring-checklist.json";
const VALIDATION_FILENAME = "atlas-alpha-attachment-validation.json";
const LIFECYCLE_FILENAME = "atlas-alpha-attachment-lifecycle.json";
const REPORT_FILENAME = "atlas-alpha-attachment-report.md";

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

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = keyFn(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value);
  }
  return out;
}

function buildAlphaSpecification(controlledPlanning, controlledSimulation, previewAttachment) {
  const approvedScenario = controlledSimulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );

  const alphaRegionScope = uniqueBy(
    controlledPlanning.specification.allowedRegions.regions.map((region) => ({
      regionId: region.regionId,
      packageId: region.packageId,
      expectedRecipeId: region.expectedRecipeId,
      selectedRecipeId: region.selectedRecipeId,
      latBucket: region.latBucket,
      lngBucket: region.lngBucket,
      previewAvailable: previewAttachment.coordinatePreviewData.points.some(
        (point) => point.regionId === region.regionId && point.packageId === region.packageId
      )
    })),
    (region) => region.regionId
  );

  const allowedEnvironments = uniqueBy(
    previewAttachment.coordinatePreviewData.points.map((point) => ({
      environment: "DEVELOPMENT_ONLY",
      regionId: point.regionId,
      packageId: point.packageId
    })),
    (entry) => `${entry.environment}:${entry.regionId}`
  );

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_SPECIFICATION_001",
    alphaAttachmentId: "ATLAS_ALPHA_ATTACHMENT_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      controlledAttachmentPlanId: controlledPlanning.specification.attachmentPlanId,
      controlledAttachmentSimulationId: controlledSimulation.harness.simulationId,
      mapPreviewAttachmentId: previewAttachment.previewId
    },
    alphaRegionScope: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_REGION_SCOPE_001",
      regionCount: alphaRegionScope.length,
      regions: alphaRegionScope,
      regionPolicy:
        "alpha scope is restricted to preview-verified, simulation-approved regions only"
    },
    allowedEnvironments: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_ALLOWED_ENVIRONMENTS_001",
      environments: ["DEVELOPMENT_ONLY"],
      regionEnvironmentBindings: allowedEnvironments,
      environmentPolicy:
        "alpha attachment remains inside development-only environment boundaries"
    },
    userAccessBoundaries: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_USER_ACCESS_BOUNDARIES_001",
      allowedUserTypes: ["internal_developer_reviewer", "atlas_operator"],
      blockedUserTypes: ["beta_tester", "live_player", "anonymous_user"],
      accessRules: [
        "alpha access is manual and invitation-only",
        "no player-facing discovery is enabled",
        "preview and review tools remain internal only"
      ]
    },
    enabledSystems: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_ENABLED_SYSTEMS_001",
      systems: [
        "metadata_lookup",
        "preview_overlay_inspection",
        "boundary_transition_review",
        "controlled_attachment_logging",
        "manual_approval_gate_review"
      ]
    },
    disabledSystems: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_DISABLED_SYSTEMS_001",
      systems: [
        "runtime_scene_activation",
        "renderer_attachment",
        "map_downloads",
        "player_visibility",
        "automatic_recipe_execution",
        "asset_mutation"
      ]
    },
    monitoringRequirements: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_MONITORING_REQUIREMENTS_001",
      requiredSignals: [
        "region_scope_match",
        "package_identity_match",
        "deterministic_recipe_match",
        "boundary_transition_outcome",
        "rollback_invocation_status",
        "emergency_disable_status"
      ],
      monitoringPolicy:
        "alpha monitoring remains metadata-only and must be reviewable before any future escalation"
    },
    rollbackTriggers: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_ROLLBACK_TRIGGERS_001",
      triggers: [
        "unexpected_region_scope",
        "recipe_selection_mismatch",
        "package_identity_mismatch",
        "boundary_transition_failure",
        "manual_operator_rollback"
      ]
    },
    successCriteria: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_SUCCESS_CRITERIA_001",
      criteria: [
        "approved alpha scenario remains ready_for_future_alpha",
        "blocked scenarios remain blocked deterministically",
        "preview and package identity remain aligned",
        "manual approval gates remain unresolved until a human approves"
      ],
      referenceScenarioId: approvedScenario?.scenarioId ?? null
    },
    failureCriteria: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_FAILURE_CRITERIA_001",
      criteria: [
        "region scope violation",
        "missing package",
        "validation gate failure",
        "emergency disable triggered",
        "attempted renderer or runtime escalation"
      ]
    },
    manualApprovalGates: {
      schemaId: "ATLAS_ALPHA_ATTACHMENT_MANUAL_APPROVAL_GATES_001",
      gates: [
        {
          gateId: "ALPHA_SCOPE_APPROVAL",
          description: "Confirm alpha region scope and allowed environments."
        },
        {
          gateId: "ALPHA_MONITORING_APPROVAL",
          description: "Confirm monitoring and rollback procedures are in place."
        },
        {
          gateId: "ALPHA_HANDOFF_APPROVAL",
          description: "Confirm renderer handoff remains disabled pending later work."
        }
      ],
      approvalMode: "manual_only"
    }
  });
}

function buildPermissionMatrix(specification, controlledPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_PERMISSION_MATRIX_001",
    alphaAttachmentId: specification.alphaAttachmentId,
    matrix: [
      {
        area: "preview_inspection",
        internalDeveloperReviewer: "allowed",
        atlasOperator: "allowed",
        betaTester: "blocked",
        livePlayer: "blocked"
      },
      {
        area: "metadata_lookup",
        internalDeveloperReviewer: "allowed",
        atlasOperator: "allowed",
        betaTester: "blocked",
        livePlayer: "blocked"
      },
      {
        area: "renderer_attachment",
        internalDeveloperReviewer: "blocked",
        atlasOperator: "blocked",
        betaTester: "blocked",
        livePlayer: "blocked"
      },
      {
        area: "runtime_activation",
        internalDeveloperReviewer: "blocked",
        atlasOperator: "blocked",
        betaTester: "blocked",
        livePlayer: "blocked"
      },
      {
        area: "rollback_and_disable",
        internalDeveloperReviewer: "allowed",
        atlasOperator: "allowed",
        betaTester: "blocked",
        livePlayer: "blocked"
      }
    ],
    inheritedPermissionFlags: controlledPlanning.permissionModel.permissionFlags,
    deterministicFingerprint: hashHex(
      specification.alphaAttachmentId,
      JSON.stringify(controlledPlanning.permissionModel.permissionFlags)
    )
  });
}

function buildMonitoringChecklist(specification, controlledSimulation) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_MONITORING_CHECKLIST_001",
    alphaAttachmentId: specification.alphaAttachmentId,
    checklist: [
      {
        itemId: "CHECK_REGION_SCOPE",
        description: "Verify alpha region scope matches approved simulation records.",
        expectedStatus: "required"
      },
      {
        itemId: "CHECK_RECIPE_ALIGNMENT",
        description: "Verify deterministic recipe selection matches expected recipe IDs.",
        expectedStatus: "required"
      },
      {
        itemId: "CHECK_BOUNDARY_BEHAVIOR",
        description: "Verify boundary transitions remain deterministic and reviewable.",
        expectedStatus: "required"
      },
      {
        itemId: "CHECK_ROLLBACK_READY",
        description: "Verify rollback remains available before any future escalation.",
        expectedStatus: "required"
      },
      {
        itemId: "CHECK_EMERGENCY_DISABLE_READY",
        description: "Verify emergency disable remains available before any future escalation.",
        expectedStatus: "required"
      }
    ],
    referencedScenarioIds: controlledSimulation.outputs.scenarios.map(
      (scenario) => scenario.scenarioId
    )
  });
}

function buildValidation(specification, permissionMatrix, monitoringChecklist, controlledSimulation, controlledPlanning) {
  const approvedScenario = controlledSimulation.outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );
  const blockedScenarios = controlledSimulation.outputs.scenarios.filter(
    (scenario) => scenario.status === "blocked"
  );

  const checks = [
    {
      name: "alpha_region_scope_defined",
      ok:
        specification.alphaRegionScope.regionCount >= 2 &&
        specification.alphaRegionScope.regions.every((region) => region.previewAvailable === true)
    },
    {
      name: "allowed_environments_restricted",
      ok:
        specification.allowedEnvironments.environments.length === 1 &&
        specification.allowedEnvironments.environments[0] === "DEVELOPMENT_ONLY"
    },
    {
      name: "user_access_boundaries_defined",
      ok:
        specification.userAccessBoundaries.allowedUserTypes.length === 2 &&
        specification.userAccessBoundaries.blockedUserTypes.includes("live_player")
    },
    {
      name: "enabled_and_disabled_systems_defined",
      ok:
        specification.enabledSystems.systems.length >= 4 &&
        specification.disabledSystems.systems.includes("renderer_attachment") &&
        specification.disabledSystems.systems.includes("runtime_scene_activation")
    },
    {
      name: "monitoring_and_rollback_controls_defined",
      ok:
        specification.monitoringRequirements.requiredSignals.length >= 6 &&
        specification.rollbackTriggers.triggers.length >= 5 &&
        monitoringChecklist.checklist.length === 5
    },
    {
      name: "success_and_failure_criteria_defined",
      ok:
        specification.successCriteria.criteria.length >= 4 &&
        specification.failureCriteria.criteria.length >= 5 &&
        specification.manualApprovalGates.gates.length === 3
    },
    {
      name: "simulation_supports_alpha_readiness",
      ok:
        approvedScenario?.status === "ready_for_future_alpha" &&
        blockedScenarios.length >= 4 &&
        controlledSimulation.validation.status === "pass"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        controlledPlanning.permissionModel.permissionFlags.runtimeActivationAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.rendererAttachmentAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.mapDownloadsAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.blenderAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.glbAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_VALIDATION_001",
    alphaAttachmentId: specification.alphaAttachmentId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.alphaAttachmentId,
      JSON.stringify(specification),
      JSON.stringify(permissionMatrix),
      JSON.stringify(monitoringChecklist),
      JSON.stringify(checks)
    ),
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ALPHA_ATTACHMENT_LIFECYCLE_001",
    alphaAttachmentId: specification.alphaAttachmentId,
    lifecycleStatus:
      validation.status === "pass"
        ? "ALPHA_ATTACHMENT_SPEC_READY"
        : "ALPHA_ATTACHMENT_SPEC_BLOCKED",
    manualApprovalRequired: true,
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      specification.alphaAttachmentId,
      validation.status,
      "manual_approval_required"
    )
  });
}

function buildReport(specification, validation, lifecycle) {
  const regionLines = specification.alphaRegionScope.regions
    .map(
      (region) =>
        `- ${region.regionId} -> ${region.packageId} -> ${region.selectedRecipeId}`
    )
    .join("\n");

  return `# ATLAS ALPHA ATTACHMENT SPECIFICATION

## Scope

${specification.alphaAttachmentId} defines the final limited alpha attachment specification without enabling runtime.

## Alpha Region Scope

${regionLines}

## Allowed Environment

- ${specification.allowedEnvironments.environments.join(", ")}

## Manual Approval Gates

${specification.manualApprovalGates.gates
  .map((gate) => `- ${gate.gateId}: ${gate.description}`)
  .join("\n")}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- manual approval required: ${lifecycle.manualApprovalRequired}

## Readiness

Future controlled alpha attachment: ${validation.status === "pass" ? "READY" : "BLOCKED"}
`;
}

export function buildAtlasAlphaAttachmentSpecification({ cwd = process.cwd() } = {}) {
  const controlledPlanning = buildAtlasControlledMapAttachmentPlanning({ cwd });
  const controlledSimulation = buildAtlasControlledAttachmentSimulation({ cwd });
  const previewAttachment = buildAtlasMapPreviewAttachment({ cwd });

  const specification = buildAlphaSpecification(
    controlledPlanning,
    controlledSimulation,
    previewAttachment
  );
  const permissionMatrix = buildPermissionMatrix(
    specification,
    controlledPlanning
  );
  const monitoringChecklist = buildMonitoringChecklist(
    specification,
    controlledSimulation
  );
  const validation = buildValidation(
    specification,
    permissionMatrix,
    monitoringChecklist,
    controlledSimulation,
    controlledPlanning
  );
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, ALPHA_ROOT),
    specification,
    permissionMatrix,
    monitoringChecklist,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasAlphaAttachmentSpecification({ cwd = process.cwd() } = {}) {
  const alpha = buildAtlasAlphaAttachmentSpecification({ cwd });
  const specificationDir = path.join(alpha.root, "specification");
  const permissionsDir = path.join(alpha.root, "permissions");
  const monitoringDir = path.join(alpha.root, "monitoring");
  const validationDir = path.join(alpha.root, "validation");
  const lifecycleDir = path.join(alpha.root, "lifecycle");
  const reportsDir = path.join(alpha.root, "reports");

  for (const directory of [
    specificationDir,
    permissionsDir,
    monitoringDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), alpha.specification);
  writeJson(path.join(permissionsDir, PERMISSION_MATRIX_FILENAME), alpha.permissionMatrix);
  writeJson(path.join(monitoringDir, MONITORING_CHECKLIST_FILENAME), alpha.monitoringChecklist);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), alpha.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), alpha.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), alpha.report);

  return alpha;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasAlphaAttachmentSpecification();
}
