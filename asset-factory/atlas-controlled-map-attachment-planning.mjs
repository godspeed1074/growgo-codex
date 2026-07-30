import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasMapAttachmentPlanning } from "./atlas-map-attachment-planning.mjs";
import { buildAtlasMapPreviewAttachment } from "./atlas-map-preview-attachment.mjs";
import { buildAtlasRegionalBoundaryTransitionSimulation } from "./atlas-regional-boundary-transition-simulation.mjs";

const CONTROLLED_ATTACHMENT_ROOT =
  "asset-factory-workspace/atlas-controlled-map-attachment/ATLAS_CONTROLLED_MAP_ATTACHMENT_001";

const SPECIFICATION_FILENAME = "atlas-controlled-map-attachment-specification.json";
const PERMISSION_MODEL_FILENAME = "atlas-controlled-map-attachment-permission-model.json";
const LIFECYCLE_FILENAME = "atlas-controlled-map-attachment-lifecycle-rules.json";
const VALIDATION_FILENAME = "atlas-controlled-map-attachment-validation.json";
const REPORT_FILENAME = "atlas-controlled-map-attachment-architecture-report.md";

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

function buildControlledAttachmentSpecification(
  mapAttachmentPlanning,
  previewAttachment,
  transitionSimulation
) {
  const allowedRegions = uniqueBy(
    previewAttachment.coordinatePreviewData.points.map((point) => ({
      regionId: point.regionId,
      packageId: point.packageId,
      expectedRecipeId: point.expectedRecipeId,
      selectedRecipeId: point.selectedRecipeId,
      latBucket: point.coordinate.latBucket,
      lngBucket: point.coordinate.lngBucket
    })),
    (entry) => entry.regionId
  );

  const alphaTestBoundaries = transitionSimulation.transitionRecords.transitions
    .filter((transition) =>
      [
        "TRANSITION_BETWEEN_REGIONS",
        "MIXED_BIOME_BOUNDARY"
      ].includes(transition.transitionType)
    )
    .map((transition) => {
      const resolvedSteps = transition.steps.filter((step) => step.status === "resolved");
      const [from, to] = resolvedSteps;
      return deepFreeze({
        boundaryId: `${transition.transitionId}_ALPHA_BOUNDARY`,
        sourceTransitionId: transition.transitionId,
        fromRegionId: from.regionId,
        toRegionId: to.regionId,
        fromPackageId: from.packageId,
        toPackageId: to.packageId,
        fromCoordinate: {
          lat: from.latBucket,
          lng: from.lngBucket
        },
        toCoordinate: {
          lat: to.latBucket,
          lng: to.lngBucket
        },
        allowedForAlphaInspectionOnly: true,
        expectedTransitionStatus: transition.summary.result
      });
    });

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_MAP_ATTACHMENT_SPECIFICATION_001",
    attachmentPlanId: "ATLAS_CONTROLLED_MAP_ATTACHMENT_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      mapAttachmentId: mapAttachmentPlanning.specification.attachmentId,
      mapPreviewAttachmentId: previewAttachment.previewId,
      regionalBoundaryTransitionSimulationId:
        transitionSimulation.harness.simulationId
    },
    attachmentPermissionModel: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_PERMISSION_MODEL_REF_001",
      permissionModelId: "ATLAS_CONTROLLED_ATTACHMENT_PERMISSION_MODEL_001"
    },
    alphaTestBoundaries: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_ALPHA_TEST_BOUNDARIES_001",
      boundaryCount: alphaTestBoundaries.length,
      boundaries: alphaTestBoundaries,
      scopeRules: [
        "alpha testing remains limited to approved preview regions and boundary transitions",
        "alpha attachment planning is development-only and inspection-only",
        "unsupported coordinates or missing neighboring packages remain blocked"
      ]
    },
    allowedRegions: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_ALLOWED_REGIONS_001",
      regionCount: allowedRegions.length,
      regions: allowedRegions,
      regionSelectionPolicy:
        "only regions proven by preview alignment and deterministic transition simulation may enter controlled attachment planning"
    },
    rollbackControls: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_ROLLBACK_CONTROLS_001",
      rollbackModes: [
        "DISABLE_ATTACHMENT_PLAN",
        "REVERT_TO_PREVIEW_ONLY",
        "CLEAR_PENDING_HANDOFF",
        "FREEZE_REGION_SCOPE"
      ],
      rollbackRules: [
        "rollback returns all attachment states to planning-only",
        "rollback does not mutate assets or approved recipes",
        "rollback clears pending renderer handoff authorization"
      ]
    },
    emergencyDisable: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_EMERGENCY_DISABLE_001",
      triggerModes: [
        "MANUAL_OPERATOR_DISABLE",
        "VALIDATION_GATE_FAILURE",
        "BOUNDARY_HANDOFF_MISMATCH",
        "UNEXPECTED_REGION_SCOPE"
      ],
      emergencyState: "ATTACHMENT_DISABLED",
      requiredOutcome:
        "all controlled attachment readiness is revoked and preview-only mode remains available"
    },
    rendererHandoffContract: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_RENDERER_HANDOFF_CONTRACT_001",
      currentState: "PREVIEW_ONLY_NO_RUNTIME_HANDOFF",
      allowedFutureState: "CONTROLLED_HANDOFF_PENDING_APPROVAL",
      blockedNow: true,
      blockedOperations: [
        "renderer_attach",
        "runtime_scene_boot",
        "map_layer_enable",
        "player_visible_publish"
      ],
      prerequisites: [
        "controlled attachment validation must pass",
        "alpha region scope must remain inside allowed regions",
        "rollback and emergency disable controls must remain available"
      ]
    },
    loggingRequirements: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_LOGGING_REQUIREMENTS_001",
      requiredEvents: [
        "ATTACHMENT_SCOPE_CHECK",
        "REGION_LOOKUP_ATTEMPT",
        "BOUNDARY_HANDOFF_CHECK",
        "VALIDATION_GATE_RESULT",
        "ROLLBACK_TRIGGERED",
        "EMERGENCY_DISABLE_TRIGGERED"
      ],
      privacyAndSafetyRules: [
        "logs remain metadata-only",
        "logs preserve deterministic fingerprints for lookup and transition records",
        "logs do not include player runtime state because runtime remains disabled"
      ]
    },
    failureHandling: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_FAILURE_HANDLING_001",
      reasonCodes: [
        "REGION_SCOPE_VIOLATION",
        "BOUNDARY_HANDOFF_MISMATCH",
        "PREVIEW_ALIGNMENT_FAILURE",
        "VALIDATION_GATE_FAILURE",
        "EMERGENCY_DISABLE_TRIGGERED",
        "RENDERER_HANDOFF_BLOCKED"
      ],
      safeFailureRules: [
        "failures keep preview data available",
        "failures prevent runtime or renderer activation",
        "failures preserve rollback availability",
        "failures do not download maps or mutate assets"
      ]
    },
    validationGates: {
      schemaId: "ATLAS_CONTROLLED_ATTACHMENT_VALIDATION_GATES_001",
      requiredPasses: [
        "preview_alignment_pass",
        "boundary_transition_pass",
        "permission_model_pass",
        "rollback_controls_present",
        "emergency_disable_present"
      ],
      finalStateIfPassed: "CONTROLLED_ATTACHMENT_PLANNING_READY",
      finalStateIfFailed: "CONTROLLED_ATTACHMENT_BLOCKED"
    }
  });
}

function buildPermissionModel(specification, mapAttachmentPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_PERMISSION_MODEL_001",
    permissionModelId: "ATLAS_CONTROLLED_ATTACHMENT_PERMISSION_MODEL_001",
    attachmentPlanId: specification.attachmentPlanId,
    environment: "DEVELOPMENT_ONLY",
    permissionFlags: {
      runtimeActivationAuthorized: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false,
      blenderAuthorized: false,
      glbAuthorized: false,
      assetModificationAuthorized: false,
      previewInspectionAuthorized: true,
      metadataLookupAuthorized: true,
      boundaryInspectionAuthorized: true
    },
    operatorRoles: [
      {
        roleId: "ATLAS_ATTACHMENT_REVIEWER",
        allowedActions: [
          "inspect_preview_alignment",
          "inspect_boundary_transition",
          "review_validation_gates",
          "trigger_rollback",
          "trigger_emergency_disable"
        ],
        blockedActions: [
          "attach_renderer",
          "activate_runtime",
          "download_maps",
          "modify_assets"
        ]
      }
    ],
    inheritedBlockedStates:
      mapAttachmentPlanning.specification.mapAttachmentPermissions.blockedStates,
    deterministicFingerprint: hashHex(
      "ATLAS_CONTROLLED_ATTACHMENT_PERMISSION_MODEL_001",
      JSON.stringify(specification.allowedRegions),
      JSON.stringify(mapAttachmentPlanning.specification.mapAttachmentPermissions)
    )
  });
}

function buildLifecycleRules(specification, permissionModel, previewAttachment) {
  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_MAP_ATTACHMENT_LIFECYCLE_RULES_001",
    attachmentPlanId: specification.attachmentPlanId,
    lifecycleStatus:
      previewAttachment.validation.status === "pass"
        ? "CONTROLLED_ATTACHMENT_PLANNING_READY"
        : "CONTROLLED_ATTACHMENT_BLOCKED",
    allowedStates: [
      "PREVIEW_ONLY",
      "ALPHA_SCOPE_DEFINED",
      "CONTROLLED_HANDOFF_PENDING"
    ],
    blockedStates: [
      "RUNTIME_ATTACHED",
      "RENDERER_ATTACHED",
      "MAPS_DOWNLOADED",
      "PLAYER_VISIBLE"
    ],
    rollbackAvailable: true,
    emergencyDisableAvailable: true,
    runtimeActivationAuthorized:
      permissionModel.permissionFlags.runtimeActivationAuthorized,
    rendererAttachmentAuthorized:
      permissionModel.permissionFlags.rendererAttachmentAuthorized,
    mapDownloadsAuthorized: permissionModel.permissionFlags.mapDownloadsAuthorized,
    blenderAuthorized: permissionModel.permissionFlags.blenderAuthorized,
    glbAuthorized: permissionModel.permissionFlags.glbAuthorized,
    assetModificationAuthorized:
      permissionModel.permissionFlags.assetModificationAuthorized,
    deterministicFingerprint: hashHex(
      specification.attachmentPlanId,
      JSON.stringify(permissionModel.permissionFlags),
      previewAttachment.validation.deterministicFingerprint
    )
  });
}

function buildValidation(
  specification,
  permissionModel,
  lifecycleRules,
  previewAttachment,
  transitionSimulation,
  mapAttachmentPlanning
) {
  const checks = [
    {
      name: "attachment_permission_model_defined",
      ok:
        permissionModel.permissionFlags.previewInspectionAuthorized === true &&
        permissionModel.permissionFlags.runtimeActivationAuthorized === false &&
        permissionModel.permissionFlags.rendererAttachmentAuthorized === false
    },
    {
      name: "alpha_test_boundaries_defined",
      ok:
        specification.alphaTestBoundaries.boundaryCount >= 2 &&
        specification.alphaTestBoundaries.boundaries.every(
          (boundary) => boundary.allowedForAlphaInspectionOnly === true
        )
    },
    {
      name: "allowed_regions_defined",
      ok:
        specification.allowedRegions.regionCount >= 2 &&
        specification.allowedRegions.regions.every(
          (region) => typeof region.regionId === "string" && typeof region.packageId === "string"
        )
    },
    {
      name: "rollback_and_emergency_disable_present",
      ok:
        specification.rollbackControls.rollbackModes.length >= 4 &&
        specification.emergencyDisable.triggerModes.length >= 4 &&
        lifecycleRules.rollbackAvailable === true &&
        lifecycleRules.emergencyDisableAvailable === true
    },
    {
      name: "renderer_handoff_contract_blocked",
      ok:
        specification.rendererHandoffContract.blockedNow === true &&
        specification.rendererHandoffContract.blockedOperations.length === 4
    },
    {
      name: "logging_and_failure_handling_defined",
      ok:
        specification.loggingRequirements.requiredEvents.length >= 6 &&
        specification.failureHandling.reasonCodes.length >= 6
    },
    {
      name: "validation_gates_backed_by_preview_and_transition_passes",
      ok:
        previewAttachment.validation.status === "pass" &&
        transitionSimulation.validation.status === "pass" &&
        specification.validationGates.requiredPasses.length === 5
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        permissionModel.permissionFlags.runtimeActivationAuthorized === false &&
        permissionModel.permissionFlags.rendererAttachmentAuthorized === false &&
        permissionModel.permissionFlags.mapDownloadsAuthorized === false &&
        permissionModel.permissionFlags.blenderAuthorized === false &&
        permissionModel.permissionFlags.glbAuthorized === false &&
        permissionModel.permissionFlags.assetModificationAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .runtimeActivationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_MAP_ATTACHMENT_VALIDATION_001",
    attachmentPlanId: specification.attachmentPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.attachmentPlanId,
      JSON.stringify(specification),
      JSON.stringify(permissionModel),
      JSON.stringify(lifecycleRules),
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

function buildReport(specification, permissionModel, lifecycleRules, validation) {
  const regionLines = specification.allowedRegions.regions
    .map(
      (region) =>
        `- ${region.regionId} -> ${region.packageId} -> ${region.selectedRecipeId}`
    )
    .join("\n");

  return `# ATLAS CONTROLLED MAP ATTACHMENT ARCHITECTURE REPORT

## Scope

${specification.attachmentPlanId} defines the first safety-controlled plan for future limited Atlas map attachment without enabling runtime.

## Allowed Regions

${regionLines}

## Alpha Test Boundaries

- boundary count: ${specification.alphaTestBoundaries.boundaryCount}
- inspection-only: true

## Permission Model

- preview inspection authorized: ${permissionModel.permissionFlags.previewInspectionAuthorized}
- metadata lookup authorized: ${permissionModel.permissionFlags.metadataLookupAuthorized}
- boundary inspection authorized: ${permissionModel.permissionFlags.boundaryInspectionAuthorized}
- runtime activation authorized: ${permissionModel.permissionFlags.runtimeActivationAuthorized}
- renderer attachment authorized: ${permissionModel.permissionFlags.rendererAttachmentAuthorized}
- map downloads authorized: ${permissionModel.permissionFlags.mapDownloadsAuthorized}

## Lifecycle

- lifecycle status: ${lifecycleRules.lifecycleStatus}
- rollback available: ${lifecycleRules.rollbackAvailable}
- emergency disable available: ${lifecycleRules.emergencyDisableAvailable}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Readiness

Future controlled attachment planning: ${validation.status === "pass" ? "READY" : "BLOCKED"}
`;
}

export function buildAtlasControlledMapAttachmentPlanning({
  cwd = process.cwd()
} = {}) {
  const mapAttachmentPlanning = buildAtlasMapAttachmentPlanning({ cwd });
  const previewAttachment = buildAtlasMapPreviewAttachment({ cwd });
  const transitionSimulation = buildAtlasRegionalBoundaryTransitionSimulation({
    cwd
  });

  const specification = buildControlledAttachmentSpecification(
    mapAttachmentPlanning,
    previewAttachment,
    transitionSimulation
  );
  const permissionModel = buildPermissionModel(
    specification,
    mapAttachmentPlanning
  );
  const lifecycleRules = buildLifecycleRules(
    specification,
    permissionModel,
    previewAttachment
  );
  const validation = buildValidation(
    specification,
    permissionModel,
    lifecycleRules,
    previewAttachment,
    transitionSimulation,
    mapAttachmentPlanning
  );
  const report = buildReport(
    specification,
    permissionModel,
    lifecycleRules,
    validation
  );

  return deepFreeze({
    root: path.resolve(cwd, CONTROLLED_ATTACHMENT_ROOT),
    specification,
    permissionModel,
    lifecycleRules,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasControlledMapAttachmentPlanning({
  cwd = process.cwd()
} = {}) {
  const planning = buildAtlasControlledMapAttachmentPlanning({ cwd });
  const specificationDir = path.join(planning.root, "specification");
  const permissionsDir = path.join(planning.root, "permissions");
  const lifecycleDir = path.join(planning.root, "lifecycle");
  const validationDir = path.join(planning.root, "validation");
  const reportsDir = path.join(planning.root, "reports");

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
    planning.specification
  );
  writeJson(
    path.join(permissionsDir, PERMISSION_MODEL_FILENAME),
    planning.permissionModel
  );
  writeJson(
    path.join(lifecycleDir, LIFECYCLE_FILENAME),
    planning.lifecycleRules
  );
  writeJson(
    path.join(validationDir, VALIDATION_FILENAME),
    planning.validation
  );
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasControlledMapAttachmentPlanning();
}
