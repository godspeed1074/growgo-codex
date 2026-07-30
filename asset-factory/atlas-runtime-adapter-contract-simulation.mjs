import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001";

const HARNESS_FILENAME = "atlas-runtime-adapter-simulation-harness.json";
const OUTPUTS_FILENAME = "atlas-runtime-adapter-simulation-outputs.json";
const VALIDATION_FILENAME = "atlas-runtime-adapter-simulation-validation.json";
const LIFECYCLE_FILENAME = "atlas-runtime-adapter-simulation-lifecycle.json";
const REPORT_FILENAME = "atlas-runtime-adapter-simulation-report.md";

const RUNTIME_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/specification/atlas-runtime-implementation-specification.json";
const RUNTIME_PERMISSION_MODEL_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/permissions/atlas-runtime-implementation-permission-model.json";
const CONTROLLED_HARNESS_PATH =
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001/specification/atlas-controlled-attachment-simulation-harness.json";
const CONTROLLED_OUTPUTS_PATH =
  "asset-factory-workspace/atlas-controlled-attachment-simulation/ATLAS_CONTROLLED_ATTACHMENT_SIMULATION_001/outputs/atlas-controlled-attachment-simulation-outputs.json";
const MAP_ATTACHMENT_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/specification/atlas-map-attachment-specification.json";

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

function normalizeBucket(value) {
  return Number(Number(value).toFixed(2));
}

function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function loadInputs(cwd) {
  return deepFreeze({
    runtimeSpecification: readJson(cwd, RUNTIME_SPECIFICATION_PATH),
    runtimePermissionModel: readJson(cwd, RUNTIME_PERMISSION_MODEL_PATH),
    controlledHarness: readJson(cwd, CONTROLLED_HARNESS_PATH),
    controlledOutputs: readJson(cwd, CONTROLLED_OUTPUTS_PATH),
    mapAttachmentSpecification: readJson(cwd, MAP_ATTACHMENT_SPECIFICATION_PATH)
  });
}

function buildHarness(inputs) {
  const approvedScenario = inputs.controlledHarness.scenarios.find(
    (scenario) => scenario.scenarioType === "APPROVED_ALPHA_REGION"
  );
  const blockedScenario = inputs.controlledHarness.scenarios.find(
    (scenario) => scenario.scenarioType === "BLOCKED_REGION"
  );
  const missingScenario = inputs.controlledHarness.scenarios.find(
    (scenario) => scenario.scenarioType === "MISSING_PACKAGE"
  );
  const emergencyScenario = inputs.controlledHarness.scenarios.find(
    (scenario) => scenario.scenarioType === "EMERGENCY_DISABLE"
  );

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_ADAPTER_SIMULATION_HARNESS_001",
    simulationId: "ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      runtimeImplementationId: inputs.runtimeSpecification.runtimeImplementationId,
      controlledAttachmentSimulationId: inputs.controlledHarness.simulationId,
      mapAttachmentId: inputs.mapAttachmentSpecification.attachmentId
    },
    runtimeFlags: {
      runtimeExecutionEnabled:
        inputs.runtimePermissionModel.permissionState.runtimeExecutionEnabled,
      mapAttachmentAllowed:
        inputs.runtimePermissionModel.permissionState.mapAttachmentAllowed,
      automaticRendererExecutionAllowed:
        inputs.runtimePermissionModel.permissionState
          .automaticRendererExecutionAllowed
    },
    scenarios: [
      {
        scenarioId: "RUNTIME_ADAPTER_VALID_PLAYER_LOCATION_REQUEST_001",
        scenarioType: "VALID_PLAYER_LOCATION_REQUEST",
        requestType: "PLAYER_LOCATION_LOOKUP",
        lat: approvedScenario.lat,
        lng: approvedScenario.lng,
        inheritedScenarioId: approvedScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_ADAPTER_BLOCKED_REGION_REQUEST_001",
        scenarioType: "BLOCKED_REGION_REQUEST",
        requestType: "PLAYER_LOCATION_LOOKUP",
        lat: blockedScenario.lat,
        lng: blockedScenario.lng,
        inheritedScenarioId: blockedScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_ADAPTER_MISSING_PACKAGE_REQUEST_001",
        scenarioType: "MISSING_PACKAGE_REQUEST",
        requestType: "PLAYER_LOCATION_LOOKUP",
        lat: missingScenario.lat,
        lng: missingScenario.lng,
        inheritedScenarioId: missingScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_ADAPTER_INVALID_COORDINATE_REQUEST_001",
        scenarioType: "INVALID_COORDINATE_REQUEST",
        requestType: "PLAYER_LOCATION_LOOKUP",
        lat: 93.25,
        lng: 181.4,
        inheritedScenarioId: null
      },
      {
        scenarioId: "RUNTIME_ADAPTER_EMERGENCY_SHUTDOWN_REQUEST_001",
        scenarioType: "EMERGENCY_SHUTDOWN_REQUEST",
        requestType: "EMERGENCY_SHUTDOWN",
        lat: emergencyScenario.lat,
        lng: emergencyScenario.lng,
        inheritedScenarioId: emergencyScenario.scenarioId
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001",
      JSON.stringify(inputs.runtimePermissionModel.permissionState),
      JSON.stringify(inputs.controlledHarness.scenarios.map((scenario) => scenario.scenarioId))
    )
  });
}

function buildControlledOutputIndex(controlledOutputs) {
  return new Map(
    controlledOutputs.scenarios.map((scenario) => [scenario.scenarioId, scenario])
  );
}

function evaluatePermissionChecks(permissionModel, requestType) {
  return deepFreeze({
    runtimeExecutionEnabled: permissionModel.permissionState.runtimeExecutionEnabled,
    mapAttachmentAllowed: permissionModel.permissionState.mapAttachmentAllowed,
    automaticRendererExecutionAllowed:
      permissionModel.permissionState.automaticRendererExecutionAllowed,
    rendererAttachmentAuthorized:
      permissionModel.permissionState.rendererAttachmentAuthorized,
    mapDownloadsAuthorized: permissionModel.permissionState.mapDownloadsAuthorized,
    metadataLookupAuthorized: requestType === "PLAYER_LOCATION_LOOKUP",
    emergencyShutdownAuthorized: requestType === "EMERGENCY_SHUTDOWN"
  });
}

function buildFailureResponse(reasonCode, scenarioType) {
  return deepFreeze({
    reasonCode,
    responseState:
      scenarioType === "EMERGENCY_SHUTDOWN_REQUEST"
        ? "SHUTDOWN_TO_PLANNING_ONLY"
        : "BLOCKED_METADATA_ONLY_RESPONSE",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false
  });
}

function resolveAdapterScenario(scenario, controlledIndex, permissionModel) {
  const permissionChecks = evaluatePermissionChecks(
    permissionModel,
    scenario.requestType
  );
  const coordinateValid = isValidCoordinate(scenario.lat, scenario.lng);
  const inheritedOutput = scenario.inheritedScenarioId
    ? controlledIndex.get(scenario.inheritedScenarioId) ?? null
    : null;

  const adapterInput = deepFreeze({
    requestType: scenario.requestType,
    lat: scenario.lat,
    lng: scenario.lng,
    latBucket: coordinateValid ? normalizeBucket(scenario.lat) : null,
    lngBucket: coordinateValid ? normalizeBucket(scenario.lng) : null,
    coordinateValid,
    inheritedScenarioId: scenario.inheritedScenarioId
  });

  if (!coordinateValid) {
    const failureResponse = buildFailureResponse(
      "INVALID_COORDINATE",
      scenario.scenarioType
    );

    return deepFreeze({
      schemaId: "ATLAS_RUNTIME_ADAPTER_SCENARIO_OUTPUT_001",
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      adapterInput,
      inputHandling: "rejected_invalid_coordinate",
      packageLookup: {
        status: "blocked",
        packageId: null,
        regionId: null
      },
      permissionChecks,
      deterministicRecipeResolution: null,
      rollbackBehaviour: {
        rollbackAvailable: true,
        rollbackState: "REVERT_TO_PLANNING_ONLY"
      },
      failureResponse,
      adapterState: "BLOCKED_INVALID_INPUT",
      deterministicFingerprint: hashHex(
        scenario.scenarioId,
        "INVALID_COORDINATE",
        JSON.stringify(adapterInput)
      )
    });
  }

  if (scenario.scenarioType === "EMERGENCY_SHUTDOWN_REQUEST") {
    const failureResponse = buildFailureResponse(
      "EMERGENCY_SHUTDOWN_TRIGGERED",
      scenario.scenarioType
    );

    return deepFreeze({
      schemaId: "ATLAS_RUNTIME_ADAPTER_SCENARIO_OUTPUT_001",
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      adapterInput,
      inputHandling: "accepted_shutdown_signal",
      packageLookup: {
        status: inheritedOutput.coordinateResolution.status,
        packageId: inheritedOutput.coordinateResolution.packageId,
        regionId: inheritedOutput.coordinateResolution.regionId
      },
      permissionChecks,
      deterministicRecipeResolution:
        inheritedOutput.deterministicRecipeSelection ?? null,
      rollbackBehaviour: {
        rollbackAvailable: inheritedOutput.rollback.rollbackAvailable,
        rollbackState: inheritedOutput.rollback.rollbackState
      },
      failureResponse,
      adapterState: "EMERGENCY_SHUTDOWN_TO_PLANNING_ONLY",
      deterministicFingerprint: hashHex(
        scenario.scenarioId,
        inheritedOutput.deterministicFingerprint,
        "EMERGENCY_SHUTDOWN"
      )
    });
  }

  const reasonCode =
    inheritedOutput?.reasonCode ??
    (scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
      ? "APPROVED_ALPHA_SCOPE"
      : "UNKNOWN");

  const adapterState =
    scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
      ? "PREPARED_NOT_EXECUTED"
      : "BLOCKED_METADATA_ONLY";

  const failureResponse =
    scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
      ? buildFailureResponse("RUNTIME_FLAGS_DISABLED", scenario.scenarioType)
      : buildFailureResponse(reasonCode, scenario.scenarioType);

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_ADAPTER_SCENARIO_OUTPUT_001",
    scenarioId: scenario.scenarioId,
    scenarioType: scenario.scenarioType,
    adapterInput,
    inputHandling:
      scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
        ? "accepted_metadata_only"
        : "accepted_then_blocked",
    packageLookup: {
      status: inheritedOutput.coordinateResolution.status,
      packageId: inheritedOutput.coordinateResolution.packageId,
      regionId: inheritedOutput.coordinateResolution.regionId
    },
    permissionChecks,
    deterministicRecipeResolution:
      inheritedOutput.deterministicRecipeSelection ?? null,
    rollbackBehaviour: {
      rollbackAvailable: inheritedOutput.rollback.rollbackAvailable,
      rollbackState: inheritedOutput.rollback.rollbackState
    },
    failureResponse,
    adapterState,
    inheritedControlledState: inheritedOutput.status,
    deterministicFingerprint: hashHex(
      scenario.scenarioId,
      inheritedOutput.deterministicFingerprint,
      JSON.stringify(permissionChecks)
    )
  });
}

function buildOutputs(harness, inputs) {
  const controlledIndex = buildControlledOutputIndex(inputs.controlledOutputs);
  const scenarios = harness.scenarios.map((scenario) =>
    resolveAdapterScenario(
      scenario,
      controlledIndex,
      inputs.runtimePermissionModel
    )
  );

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_ADAPTER_SIMULATION_OUTPUT_SET_001",
    simulationId: harness.simulationId,
    scenarios,
    runtimeSafetyState: {
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
      harness.simulationId,
      JSON.stringify(scenarios.map((scenario) => scenario.deterministicFingerprint))
    )
  });
}

function buildValidation(harness, outputs, inputs) {
  const validScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "VALID_PLAYER_LOCATION_REQUEST"
  );
  const blockedScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "BLOCKED_REGION_REQUEST"
  );
  const missingScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "MISSING_PACKAGE_REQUEST"
  );
  const invalidScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "INVALID_COORDINATE_REQUEST"
  );
  const emergencyScenario = outputs.scenarios.find(
    (scenario) => scenario.scenarioType === "EMERGENCY_SHUTDOWN_REQUEST"
  );

  const checks = [
    {
      name: "adapter_input_handling",
      ok:
        validScenario.inputHandling === "accepted_metadata_only" &&
        invalidScenario.inputHandling === "rejected_invalid_coordinate"
    },
    {
      name: "package_lookup",
      ok:
        validScenario.packageLookup.status === "resolved" &&
        blockedScenario.packageLookup.status === "blocked" &&
        missingScenario.packageLookup.status === "blocked"
    },
    {
      name: "permission_checks",
      ok:
        harness.runtimeFlags.runtimeExecutionEnabled === false &&
        validScenario.permissionChecks.mapAttachmentAllowed === false &&
        emergencyScenario.permissionChecks.automaticRendererExecutionAllowed ===
          false
    },
    {
      name: "deterministic_recipe_resolution",
      ok:
        validScenario.deterministicRecipeResolution ===
          "COASTAL_LOCATION_RECIPE_001" &&
        blockedScenario.deterministicRecipeResolution === null
    },
    {
      name: "rollback_behaviour",
      ok:
        validScenario.rollbackBehaviour.rollbackAvailable === true &&
        emergencyScenario.rollbackBehaviour.rollbackState ===
          "REVERT_TO_PREVIEW_ONLY"
    },
    {
      name: "failure_responses",
      ok:
        invalidScenario.failureResponse.reasonCode === "INVALID_COORDINATE" &&
        emergencyScenario.failureResponse.reasonCode ===
          "EMERGENCY_SHUTDOWN_TRIGGERED"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.runtimePermissionModel.permissionState.runtimeExecutionEnabled ===
          false &&
        inputs.runtimePermissionModel.permissionState.mapAttachmentAllowed ===
          false &&
        inputs.runtimePermissionModel.permissionState
          .automaticRendererExecutionAllowed === false &&
        inputs.runtimePermissionModel.permissionState.rendererAttachmentAuthorized ===
          false &&
        inputs.runtimePermissionModel.permissionState.mapDownloadsAuthorized ===
          false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_ADAPTER_SIMULATION_VALIDATION_001",
    simulationId: harness.simulationId,
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
      harness.simulationId,
      JSON.stringify(checks),
      outputs.deterministicFingerprint
    )
  });
}

function buildLifecycle(outputs, validation) {
  const readyCount = outputs.scenarios.filter(
    (scenario) => scenario.adapterState === "PREPARED_NOT_EXECUTED"
  ).length;
  const blockedCount = outputs.scenarios.length - readyCount;

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_ADAPTER_SIMULATION_LIFECYCLE_001",
    simulationId: outputs.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FUTURE_RUNTIME_ADAPTER_READY_FOR_IMPLEMENTATION"
        : "RUNTIME_ADAPTER_SIMULATION_BLOCKED",
    readyScenarioCount: readyCount,
    blockedScenarioCount: blockedCount,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      outputs.simulationId,
      validation.status,
      readyCount,
      blockedCount
    )
  });
}

function buildReport(outputs, validation, lifecycle) {
  const scenarioLines = outputs.scenarios
    .map(
      (scenario) =>
        `- ${scenario.scenarioId}: ${scenario.adapterState} (${scenario.failureResponse.reasonCode})`
    )
    .join("\n");

  return `# ATLAS RUNTIME ADAPTER CONTRACT SIMULATION

## Goal

Simulate the future Atlas runtime adapter contract using data-only inputs.

## Scenario Results

${scenarioLines}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- ready scenarios: ${lifecycle.readyScenarioCount}
- blocked scenarios: ${lifecycle.blockedScenarioCount}

## Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false

## Readiness

Future adapter implementation readiness: ${
    validation.status === "pass"
      ? "READY_FOR_IMPLEMENTATION_WORK"
      : "BLOCKED"
  }
`;
}

export function buildAtlasRuntimeAdapterContractSimulation({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const outputs = buildOutputs(harness, inputs);
  const validation = buildValidation(harness, outputs, inputs);
  const lifecycle = buildLifecycle(outputs, validation);
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

export function writeAtlasRuntimeAdapterContractSimulation({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasRuntimeAdapterContractSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const outputsDir = path.join(result.root, "outputs");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    outputsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(outputsDir, OUTPUTS_FILENAME), result.outputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasRuntimeAdapterContractSimulation();
}
