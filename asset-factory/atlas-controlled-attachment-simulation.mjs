import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasControlledMapAttachmentPlanning } from "./atlas-controlled-map-attachment-planning.mjs";
import { buildAtlasMapAttachmentPlanning } from "./atlas-map-attachment-planning.mjs";
import { buildAtlasMapPreviewAttachment } from "./atlas-map-preview-attachment.mjs";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001";

const HARNESS_FILENAME = "atlas-controlled-attachment-simulation-harness.json";
const OUTPUTS_FILENAME = "atlas-controlled-attachment-simulation-outputs.json";
const VALIDATION_FILENAME = "atlas-controlled-attachment-simulation-validation.json";
const LIFECYCLE_FILENAME = "atlas-controlled-attachment-simulation-lifecycle.json";
const REPORT_FILENAME = "atlas-controlled-attachment-simulation-report.md";

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

function normalizeBucket(value) {
  return Number(Number(value).toFixed(2));
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

function buildScenarioDefinitions(controlledPlanning) {
  const approvedRegion = controlledPlanning.specification.allowedRegions.regions.find(
    (region) => region.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001"
  );
  const blockedRegion = {
    regionId: "REGION_UNAPPROVED_HINTERLAND_NEG_37_55_144_02_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_UNAPPROVED_HINTERLAND_NEG_37_55_144_02_v001",
    latBucket: -37.55,
    lngBucket: 144.02,
    expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
    selectedRecipeId: null
  };

  return deepFreeze([
    {
      scenarioId: "CONTROLLED_ATTACHMENT_APPROVED_ALPHA_REGION_001",
      scenarioType: "APPROVED_ALPHA_REGION",
      regionId: approvedRegion.regionId,
      packageId: approvedRegion.packageId,
      lat: approvedRegion.latBucket,
      lng: approvedRegion.lngBucket,
      expectsBlocked: false
    },
    {
      scenarioId: "CONTROLLED_ATTACHMENT_BLOCKED_REGION_001",
      scenarioType: "BLOCKED_REGION",
      regionId: blockedRegion.regionId,
      packageId: blockedRegion.packageId,
      lat: blockedRegion.latBucket,
      lng: blockedRegion.lngBucket,
      expectsBlocked: true
    },
    {
      scenarioId: "CONTROLLED_ATTACHMENT_MISSING_PACKAGE_001",
      scenarioType: "MISSING_PACKAGE",
      regionId: approvedRegion.regionId,
      packageId: "ATLAS_REGION_PACKAGE_MISSING_NEG_38_50_145_50_v001",
      lat: -38.5,
      lng: 145.5,
      expectsBlocked: true
    },
    {
      scenarioId: "CONTROLLED_ATTACHMENT_VALIDATION_FAILURE_001",
      scenarioType: "VALIDATION_FAILURE",
      regionId: approvedRegion.regionId,
      packageId: approvedRegion.packageId,
      lat: approvedRegion.latBucket,
      lng: approvedRegion.lngBucket,
      expectsBlocked: true
    },
    {
      scenarioId: "CONTROLLED_ATTACHMENT_EMERGENCY_DISABLE_001",
      scenarioType: "EMERGENCY_DISABLE",
      regionId: approvedRegion.regionId,
      packageId: approvedRegion.packageId,
      lat: approvedRegion.latBucket,
      lng: approvedRegion.lngBucket,
      expectsBlocked: true
    }
  ]);
}

function buildHarness(controlledPlanning, mapAttachmentPlanning, previewAttachment) {
  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_HARNESS_001",
    simulationId: "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      controlledAttachmentPlanId: controlledPlanning.specification.attachmentPlanId,
      mapAttachmentId: mapAttachmentPlanning.specification.attachmentId,
      mapPreviewAttachmentId: previewAttachment.previewId
    },
    safetyEnvelope: {
      allowedStates: controlledPlanning.lifecycleRules.allowedStates,
      blockedStates: controlledPlanning.lifecycleRules.blockedStates,
      rollbackAvailable: controlledPlanning.lifecycleRules.rollbackAvailable,
      emergencyDisableAvailable:
        controlledPlanning.lifecycleRules.emergencyDisableAvailable
    },
    scenarios: buildScenarioDefinitions(controlledPlanning)
  });
}

function buildPreviewIndex(previewAttachment) {
  const pointByRegionId = new Map();
  const pointByPackageId = new Map();

  for (const point of previewAttachment.coordinatePreviewData.points) {
    if (!pointByRegionId.has(point.regionId)) {
      pointByRegionId.set(point.regionId, point);
    }
    if (!pointByPackageId.has(point.packageId)) {
      pointByPackageId.set(point.packageId, point);
    }
  }

  return { pointByRegionId, pointByPackageId };
}

function evaluatePermissionChecks(scenario, controlledPlanning) {
  const allowedRegionIds = new Set(
    controlledPlanning.specification.allowedRegions.regions.map((region) => region.regionId)
  );
  const allowedPackageIds = new Set(
    controlledPlanning.specification.allowedRegions.regions.map((region) => region.packageId)
  );

  const regionAllowed = allowedRegionIds.has(scenario.regionId);
  const packageAllowed = allowedPackageIds.has(scenario.packageId);
  const permissionFlags = controlledPlanning.permissionModel.permissionFlags;

  return deepFreeze({
    inAllowedRegion: regionAllowed,
    inAllowedPackage: packageAllowed,
    metadataLookupAuthorized: permissionFlags.metadataLookupAuthorized,
    previewInspectionAuthorized: permissionFlags.previewInspectionAuthorized,
    runtimeActivationAuthorized: permissionFlags.runtimeActivationAuthorized,
    rendererAttachmentAuthorized: permissionFlags.rendererAttachmentAuthorized,
    mapDownloadsAuthorized: permissionFlags.mapDownloadsAuthorized
  });
}

function createRollbackRecord(scenarioId, enabled) {
  return deepFreeze({
    scenarioId,
    rollbackAvailable: enabled,
    rollbackState: enabled ? "REVERT_TO_PREVIEW_ONLY" : "UNAVAILABLE",
    deterministicFingerprint: hashHex(scenarioId, enabled ? "ROLLBACK" : "NO_ROLLBACK")
  });
}

function createKillSwitchRecord(scenarioType, available) {
  const triggered = scenarioType === "EMERGENCY_DISABLE";
  return deepFreeze({
    emergencyDisableAvailable: available,
    emergencyDisableTriggered: triggered,
    resultingState: triggered ? "ATTACHMENT_DISABLED" : "NOT_TRIGGERED",
    deterministicFingerprint: hashHex(
      scenarioType,
      available ? "AVAILABLE" : "UNAVAILABLE",
      triggered ? "TRIGGERED" : "IDLE"
    )
  });
}

function resolveScenario(
  scenario,
  controlledPlanning,
  mapAttachmentPlanning,
  previewAttachment,
  previewIndex
) {
  const permissionChecks = evaluatePermissionChecks(scenario, controlledPlanning);
  const rollback = createRollbackRecord(
    scenario.scenarioId,
    controlledPlanning.lifecycleRules.rollbackAvailable
  );
  const killSwitch = createKillSwitchRecord(
    scenario.scenarioType,
    controlledPlanning.lifecycleRules.emergencyDisableAvailable
  );

  const previewPoint = permissionChecks.inAllowedPackage
    ? previewIndex.pointByPackageId.get(scenario.packageId) ??
      previewIndex.pointByRegionId.get(scenario.regionId) ??
      null
    : permissionChecks.inAllowedRegion
      ? null
      : previewIndex.pointByRegionId.get(scenario.regionId) ??
        previewIndex.pointByPackageId.get(scenario.packageId) ??
        null;

  const coordinateResolution = previewPoint
    ? deepFreeze({
        status: "resolved",
        lat: previewPoint.coordinate.lat,
        lng: previewPoint.coordinate.lng,
        latBucket: previewPoint.coordinate.latBucket,
        lngBucket: previewPoint.coordinate.lngBucket,
        regionId: previewPoint.regionId,
        packageId: previewPoint.packageId,
        selectorSeed: previewPoint.selectorSeed,
        selectedRecipeId: previewPoint.selectedRecipeId,
        expectedRecipeId: previewPoint.expectedRecipeId,
        deterministicFingerprint: previewPoint.deterministicFingerprint
      })
    : deepFreeze({
        status: "blocked",
        lat: scenario.lat,
        lng: scenario.lng,
        latBucket: normalizeBucket(scenario.lat),
        lngBucket: normalizeBucket(scenario.lng),
        regionId: scenario.regionId,
        packageId: scenario.packageId,
        selectorSeed: null,
        selectedRecipeId: null,
        expectedRecipeId: null,
        deterministicFingerprint: hashHex(
          scenario.scenarioId,
          scenario.regionId,
          scenario.packageId,
          "NO_PREVIEW_MATCH"
        )
      });

  let status = "ready_for_future_alpha";
  let reasonCode = "APPROVED_ALPHA_SCOPE";
  let packageValidation = "pass";

  if (!permissionChecks.inAllowedRegion) {
    status = "blocked";
    reasonCode = "REGION_SCOPE_VIOLATION";
    packageValidation = "blocked";
  } else if (!permissionChecks.inAllowedPackage || !previewPoint) {
    status = "blocked";
    reasonCode = "REGION_NOT_FOUND";
    packageValidation = "blocked";
  } else if (scenario.scenarioType === "VALIDATION_FAILURE") {
    status = "blocked";
    reasonCode = "VALIDATION_GATE_FAILURE";
    packageValidation = "fail";
  } else if (scenario.scenarioType === "EMERGENCY_DISABLE") {
    status = "blocked";
    reasonCode = "EMERGENCY_DISABLE_TRIGGERED";
    packageValidation = "pass";
  }

  const rendererHandoff = deepFreeze({
    contractState: controlledPlanning.specification.rendererHandoffContract.currentState,
    allowedFutureState:
      controlledPlanning.specification.rendererHandoffContract.allowedFutureState,
    blockedNow: controlledPlanning.specification.rendererHandoffContract.blockedNow,
    attempted: false
  });

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_SCENARIO_OUTPUT_001",
    scenarioId: scenario.scenarioId,
    scenarioType: scenario.scenarioType,
    status,
    reasonCode,
    permissionChecks,
    packageValidation,
    coordinateResolution,
    deterministicRecipeSelection: coordinateResolution.selectedRecipeId,
    rollback,
    killSwitch,
    rendererHandoff,
    deterministicFingerprint: hashHex(
      scenario.scenarioId,
      status,
      reasonCode,
      coordinateResolution.regionId ?? "NONE",
      coordinateResolution.packageId ?? "NONE",
      coordinateResolution.selectedRecipeId ?? "NONE"
    )
  });
}

function buildScenarioOutputs(
  harness,
  controlledPlanning,
  mapAttachmentPlanning,
  previewAttachment
) {
  const previewIndex = buildPreviewIndex(previewAttachment);
  const scenarios = harness.scenarios.map((scenario) =>
    resolveScenario(
      scenario,
      controlledPlanning,
      mapAttachmentPlanning,
      previewAttachment,
      previewIndex
    )
  );

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_SCENARIO_OUTPUT_SET_001",
    simulationId: harness.simulationId,
    scenarios,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      ...scenarios.map((scenario) => JSON.stringify(scenario))
    ),
    safetyState: {
      runtimeActivationAuthorized: false,
      rendererAttachmentAuthorized: false,
      mapDownloadsAuthorized: false,
      blenderAuthorized: false,
      glbAuthorized: false,
      assetModificationAuthorized: false
    }
  });
}

function buildValidation(harness, outputs, controlledPlanning, mapAttachmentPlanning) {
  const approved = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );
  const blockedRegion = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "BLOCKED_REGION"
  );
  const missingPackage = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "MISSING_PACKAGE"
  );
  const validationFailure = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "VALIDATION_FAILURE"
  );
  const emergencyDisable = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "EMERGENCY_DISABLE"
  );

  const checks = [
    {
      name: "permission_checks",
      ok:
        approved.permissionChecks.inAllowedRegion === true &&
        blockedRegion.permissionChecks.inAllowedRegion === false &&
        approved.permissionChecks.runtimeActivationAuthorized === false &&
        approved.permissionChecks.rendererAttachmentAuthorized === false
    },
    {
      name: "rollback_behaviour",
      ok:
        outputs.scenarios.every((scenario) => scenario.rollback.rollbackAvailable === true) &&
        blockedRegion.rollback.rollbackState === "REVERT_TO_PREVIEW_ONLY"
    },
    {
      name: "kill_switch_handling",
      ok:
        emergencyDisable.killSwitch.emergencyDisableTriggered === true &&
        emergencyDisable.status === "blocked" &&
        emergencyDisable.reasonCode === "EMERGENCY_DISABLE_TRIGGERED"
    },
    {
      name: "package_validation",
      ok:
        approved.packageValidation === "pass" &&
        missingPackage.packageValidation === "blocked" &&
        validationFailure.packageValidation === "fail"
    },
    {
      name: "coordinate_resolution",
      ok:
        approved.coordinateResolution.status === "resolved" &&
        blockedRegion.coordinateResolution.status === "blocked" &&
        missingPackage.coordinateResolution.status === "blocked"
    },
    {
      name: "deterministic_recipe_selection",
      ok:
        approved.deterministicRecipeSelection ===
          approved.coordinateResolution.expectedRecipeId &&
        typeof approved.coordinateResolution.selectorSeed === "string"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        controlledPlanning.permissionModel.permissionFlags.runtimeActivationAuthorized === false &&
        controlledPlanning.permissionModel.permissionFlags.rendererAttachmentAuthorized ===
          false &&
        controlledPlanning.permissionModel.permissionFlags.mapDownloadsAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_VALIDATION_001",
    simulationId: harness.simulationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(checks),
      outputs.deterministicFingerprint
    ),
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(harness, outputs, validation) {
  const readyCount = outputs.scenarios.filter(
    (scenario) => scenario.status === "ready_for_future_alpha"
  ).length;
  const blockedCount = outputs.scenarios.filter(
    (scenario) => scenario.status === "blocked"
  ).length;

  return deepFreeze({
    schemaId: "ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_LIFECYCLE_001",
    simulationId: harness.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FUTURE_ALPHA_ATTACHMENT_READY_FOR_REVIEW"
        : "FUTURE_ALPHA_ATTACHMENT_BLOCKED",
    readyScenarioCount: readyCount,
    blockedScenarioCount: blockedCount,
    rollbackAvailable: true,
    emergencyDisableAvailable: true,
    runtimeActivationAuthorized: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      readyCount,
      blockedCount,
      validation.status
    )
  });
}

function buildReport(outputs, validation, lifecycle) {
  const scenarioLines = outputs.scenarios
    .map(
      (scenario) =>
        `- ${scenario.scenarioId}: ${scenario.status} (${scenario.reasonCode}) | recipe ${scenario.deterministicRecipeSelection ?? "NONE"}`
    )
    .join("\n");

  return `# ATLAS CONTROLLED ATTACHMENT SIMULATION

## Scope

ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001 simulates the first controlled Atlas attachment flow using the approved safety envelope.

## Scenario Outputs

${scenarioLines}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- ready scenario count: ${lifecycle.readyScenarioCount}
- blocked scenario count: ${lifecycle.blockedScenarioCount}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- renderer attachment authorized: ${validation.rendererAttachmentAuthorized}
- map downloads authorized: ${validation.mapDownloadsAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Readiness

Future alpha attachment simulation: ${validation.status === "pass" ? "READY" : "BLOCKED"}
`;
}

export function buildAtlasControlledAttachmentSimulation({
  cwd = process.cwd()
} = {}) {
  const controlledPlanning = buildAtlasControlledMapAttachmentPlanning({ cwd });
  const mapAttachmentPlanning = buildAtlasMapAttachmentPlanning({ cwd });
  const previewAttachment = buildAtlasMapPreviewAttachment({ cwd });

  const harness = buildHarness(
    controlledPlanning,
    mapAttachmentPlanning,
    previewAttachment
  );
  const outputs = buildScenarioOutputs(
    harness,
    controlledPlanning,
    mapAttachmentPlanning,
    previewAttachment
  );
  const validation = buildValidation(
    harness,
    outputs,
    controlledPlanning,
    mapAttachmentPlanning
  );
  const lifecycle = buildLifecycle(harness, outputs, validation);
  const report = buildReport(outputs, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    outputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasControlledAttachmentSimulation({
  cwd = process.cwd()
} = {}) {
  const simulation = buildAtlasControlledAttachmentSimulation({ cwd });
  const specificationDir = path.join(simulation.root, "specification");
  const outputsDir = path.join(simulation.root, "outputs");
  const validationDir = path.join(simulation.root, "validation");
  const lifecycleDir = path.join(simulation.root, "lifecycle");
  const reportsDir = path.join(simulation.root, "reports");

  for (const directory of [
    specificationDir,
    outputsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), simulation.harness);
  writeJson(path.join(outputsDir, OUTPUTS_FILENAME), simulation.outputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), simulation.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), simulation.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), simulation.report);

  return simulation;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasControlledAttachmentSimulation();
}
