import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001";

const HARNESS_FILENAME = "atlas-runtime-monitoring-simulation-harness.json";
const TELEMETRY_FILENAME = "atlas-runtime-monitoring-telemetry-records.json";
const ALERTS_FILENAME = "atlas-runtime-monitoring-alert-outputs.json";
const VALIDATION_FILENAME = "atlas-runtime-monitoring-validation.json";
const LIFECYCLE_FILENAME = "atlas-runtime-monitoring-lifecycle.json";
const REPORT_FILENAME = "atlas-runtime-monitoring-report.md";

const RUNTIME_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/specification/atlas-runtime-implementation-specification.json";
const RUNTIME_PERMISSION_MODEL_PATH =
  "asset-factory-workspace/atlas-runtime-implementation/ATLAS_RUNTIME_IMPLEMENTATION_001/permissions/atlas-runtime-implementation-permission-model.json";
const RUNTIME_ADAPTER_OUTPUTS_PATH =
  "asset-factory-workspace/atlas-runtime-adapter-simulation/ATLAS_RUNTIME_ADAPTER_CONTRACT_SIMULATION_001/outputs/atlas-runtime-adapter-simulation-outputs.json";
const ADMIN_MONITORING_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/specification/atlas-admin-monitoring-specification.json";
const CONTROL_CENTRE_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/specification/atlas-control-centre-integration-specification.json";
const BUDGET_VALIDATOR_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001/specification/atlas-budget-validator-specification.json";
const REGIONAL_PACKAGE_VALIDATION_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/specification/atlas-regional-package-validation-specification.json";

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
    runtimeSpecification: readJson(cwd, RUNTIME_SPECIFICATION_PATH),
    runtimePermissionModel: readJson(cwd, RUNTIME_PERMISSION_MODEL_PATH),
    runtimeAdapterOutputs: readJson(cwd, RUNTIME_ADAPTER_OUTPUTS_PATH),
    adminMonitoringSpecification: readJson(cwd, ADMIN_MONITORING_SPECIFICATION_PATH),
    controlCentreSpecification: readJson(cwd, CONTROL_CENTRE_SPECIFICATION_PATH),
    budgetValidatorSpecification: readJson(cwd, BUDGET_VALIDATOR_SPECIFICATION_PATH),
    regionalPackageValidationSpecification: readJson(
      cwd,
      REGIONAL_PACKAGE_VALIDATION_SPECIFICATION_PATH
    )
  });
}

function findScenario(outputs, scenarioType) {
  return outputs.scenarios.find((scenario) => scenario.scenarioType === scenarioType);
}

function buildHarness(inputs) {
  const validScenario = findScenario(
    inputs.runtimeAdapterOutputs,
    "VALID_PLAYER_LOCATION_REQUEST"
  );
  const blockedScenario = findScenario(
    inputs.runtimeAdapterOutputs,
    "BLOCKED_REGION_REQUEST"
  );
  const missingScenario = findScenario(
    inputs.runtimeAdapterOutputs,
    "MISSING_PACKAGE_REQUEST"
  );
  const emergencyScenario = findScenario(
    inputs.runtimeAdapterOutputs,
    "EMERGENCY_SHUTDOWN_REQUEST"
  );

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_MONITORING_SIMULATION_HARNESS_001",
    simulationId: "ATLAS_RUNTIME_MONITORING_SIMULATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      runtimeImplementationId: inputs.runtimeSpecification.runtimeImplementationId,
      runtimeAdapterSimulationId: inputs.runtimeAdapterOutputs.simulationId,
      adminMonitoringId: inputs.adminMonitoringSpecification.monitoringId,
      controlCentreId: inputs.controlCentreSpecification.controlCentreId,
      budgetValidatorId: inputs.budgetValidatorSpecification.validatorId,
      regionalPackageValidationId:
        inputs.regionalPackageValidationSpecification.validationPlanningId
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
    telemetryEvents: inputs.runtimeSpecification.telemetryRequirements.requiredSignals,
    healthStates:
      inputs.adminMonitoringSpecification.packageHealthMonitoring.healthStates,
    alertRules: {
      warningStates:
        inputs.budgetValidatorSpecification.warningStates.states,
      blockingStates:
        inputs.budgetValidatorSpecification.blockingStates.states
    },
    scenarios: [
      {
        scenarioId: "RUNTIME_MONITORING_HEALTHY_GENERATION_001",
        scenarioType: "HEALTHY_ATLAS_GENERATION",
        inheritedAdapterScenarioId: validScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_MONITORING_PACKAGE_VALIDATION_FAILURE_001",
        scenarioType: "PACKAGE_VALIDATION_FAILURE",
        inheritedAdapterScenarioId: missingScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_MONITORING_BUDGET_WARNING_001",
        scenarioType: "BUDGET_WARNING",
        inheritedAdapterScenarioId: validScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_MONITORING_RECIPE_FALLBACK_EVENT_001",
        scenarioType: "RECIPE_FALLBACK_EVENT",
        inheritedAdapterScenarioId: blockedScenario.scenarioId
      },
      {
        scenarioId: "RUNTIME_MONITORING_EMERGENCY_SHUTDOWN_001",
        scenarioType: "EMERGENCY_SHUTDOWN_EVENT",
        inheritedAdapterScenarioId: emergencyScenario.scenarioId
      }
    ],
    deterministicFingerprint: hashHex(
      "ATLAS_RUNTIME_MONITORING_SIMULATION_001",
      JSON.stringify(inputs.runtimePermissionModel.permissionState),
      JSON.stringify(inputs.runtimeAdapterOutputs.scenarios.map((scenario) => scenario.scenarioId))
    )
  });
}

function buildAdapterIndex(runtimeAdapterOutputs) {
  return new Map(
    runtimeAdapterOutputs.scenarios.map((scenario) => [scenario.scenarioId, scenario])
  );
}

function buildTelemetryRecords(harness, inputs) {
  const adapterIndex = buildAdapterIndex(inputs.runtimeAdapterOutputs);
  const warningBand =
    inputs.budgetValidatorSpecification.warningStates.states[0];
  const blockBand =
    inputs.budgetValidatorSpecification.blockingStates.states[0];
  const fallbackReasonCode =
    inputs.regionalPackageValidationSpecification.corruptionHandling.reasonCodes[3];

  const telemetryRecords = harness.scenarios.map((scenario) => {
    const adapterScenario = adapterIndex.get(scenario.inheritedAdapterScenarioId);
    let healthState = "HEALTHY";
    let alertState = "NO_ALERT";
    let rollbackSignal = "NONE";
    let adminVisibility = "DASHBOARD_HEALTHY";
    let eventType = "coordinate_lookup_attempt";

    if (scenario.scenarioType === "PACKAGE_VALIDATION_FAILURE") {
      healthState = "BLOCKED";
      alertState = blockBand;
      rollbackSignal = "ROLLBACK_TO_LAST_VALIDATED_PACKAGE";
      adminVisibility = "PACKAGE_HEALTH_BLOCKED";
      eventType = "package_validation_result";
    } else if (scenario.scenarioType === "BUDGET_WARNING") {
      healthState = "WARNING";
      alertState = warningBand;
      rollbackSignal = "NONE";
      adminVisibility = "BUDGET_WARNING_VISIBLE";
      eventType = "permission_gate_state";
    } else if (scenario.scenarioType === "RECIPE_FALLBACK_EVENT") {
      healthState = "WARNING";
      alertState = "RECIPE_FALLBACK_WARNING";
      rollbackSignal = "FALLBACK_TO_APPROVED_RECIPE_PATH";
      adminVisibility = "RECIPE_USAGE_WARNING";
      eventType = "recipe_selection_result";
    } else if (scenario.scenarioType === "EMERGENCY_SHUTDOWN_EVENT") {
      healthState = "BLOCKED";
      alertState = "EMERGENCY_SHUTDOWN_TRIGGERED";
      rollbackSignal = "FORCE_PLANNING_ONLY_STATE";
      adminVisibility = "CRITICAL_RUNTIME_BLOCK";
      eventType = "rollback_trigger_state";
    }

    return deepFreeze({
      schemaId: "ATLAS_RUNTIME_MONITORING_TELEMETRY_RECORD_001",
      telemetryId: `${scenario.scenarioId}_TELEMETRY`,
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      eventType,
      healthState,
      alertState,
      rollbackSignal,
      adminVisibility,
      adapterReference: adapterScenario.scenarioId,
      packageId: adapterScenario.packageLookup.packageId,
      regionId: adapterScenario.packageLookup.regionId,
      recipeResolution: adapterScenario.deterministicRecipeResolution,
      reasonCode:
        scenario.scenarioType === "PACKAGE_VALIDATION_FAILURE"
          ? fallbackReasonCode
          : adapterScenario.failureResponse.reasonCode,
      runtimeFlags: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      },
      deterministicFingerprint: hashHex(
        scenario.scenarioId,
        eventType,
        healthState,
        alertState,
        rollbackSignal,
        adapterScenario.deterministicFingerprint
      )
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_MONITORING_TELEMETRY_SET_001",
    simulationId: harness.simulationId,
    records: telemetryRecords,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(telemetryRecords.map((record) => record.deterministicFingerprint))
    )
  });
}

function buildAlertOutputs(harness, telemetryRecords, inputs) {
  const dashboardCards =
    inputs.controlCentreSpecification.atlasDashboardIntegration.dashboardCards;

  const alerts = telemetryRecords.records.map((record) => {
    const matchingCard =
      record.healthState === "HEALTHY"
        ? dashboardCards.find((card) => card.cardId === "BACKEND_LOAD")
        : record.scenarioType === "BUDGET_WARNING"
          ? dashboardCards.find((card) => card.cardId === "BUDGET_STATUS")
          : dashboardCards.find((card) => card.cardId === "PACKAGE_HEALTH");

    return deepFreeze({
      schemaId: "ATLAS_RUNTIME_MONITORING_ALERT_OUTPUT_001",
      alertId: `${record.scenarioId}_ALERT`,
      scenarioId: record.scenarioId,
      scenarioType: record.scenarioType,
      healthState: record.healthState,
      alertState: record.alertState,
      rollbackSignal: record.rollbackSignal,
      controlCentreCardId: matchingCard?.cardId ?? "PACKAGE_HEALTH",
      controlCentreStatus: matchingCard?.status ?? "BLOCKED",
      operatorAction:
        record.healthState === "HEALTHY"
          ? "VIEW_DASHBOARD"
          : record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
            ? "OPEN_AUDIT_TRACE"
            : "QUEUE_REVIEW",
      deterministicFingerprint: hashHex(
        record.alertState,
        record.healthState,
        matchingCard?.cardId ?? "PACKAGE_HEALTH"
      )
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_MONITORING_ALERT_OUTPUT_SET_001",
    simulationId: harness.simulationId,
    alerts,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(alerts.map((alert) => alert.deterministicFingerprint))
    )
  });
}

function buildValidation(harness, telemetryRecords, alertOutputs, inputs) {
  const healthyRecord = telemetryRecords.records.find(
    (record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION"
  );
  const failureRecord = telemetryRecords.records.find(
    (record) => record.scenarioType === "PACKAGE_VALIDATION_FAILURE"
  );
  const warningRecord = telemetryRecords.records.find(
    (record) => record.scenarioType === "BUDGET_WARNING"
  );
  const fallbackRecord = telemetryRecords.records.find(
    (record) => record.scenarioType === "RECIPE_FALLBACK_EVENT"
  );
  const shutdownRecord = telemetryRecords.records.find(
    (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );

  const checks = [
    {
      name: "telemetry_events_defined",
      ok:
        harness.telemetryEvents.length >= 6 &&
        telemetryRecords.records.length === 5
    },
    {
      name: "health_states_covered",
      ok:
        healthyRecord.healthState === "HEALTHY" &&
        warningRecord.healthState === "WARNING" &&
        failureRecord.healthState === "BLOCKED" &&
        shutdownRecord.healthState === "BLOCKED"
    },
    {
      name: "alert_rules_applied",
      ok:
        warningRecord.alertState.startsWith("WARNING_") &&
        failureRecord.alertState.startsWith("BLOCK_") &&
        shutdownRecord.alertState === "EMERGENCY_SHUTDOWN_TRIGGERED"
    },
    {
      name: "rollback_signals_defined",
      ok:
        failureRecord.rollbackSignal === "ROLLBACK_TO_LAST_VALIDATED_PACKAGE" &&
        fallbackRecord.rollbackSignal === "FALLBACK_TO_APPROVED_RECIPE_PATH" &&
        shutdownRecord.rollbackSignal === "FORCE_PLANNING_ONLY_STATE"
    },
    {
      name: "admin_visibility_outputs_defined",
      ok:
        alertOutputs.alerts.length === 5 &&
        alertOutputs.alerts.some((alert) => alert.operatorAction === "QUEUE_REVIEW") &&
        alertOutputs.alerts.some(
          (alert) => alert.operatorAction === "OPEN_AUDIT_TRACE"
        )
    },
    {
      name: "adapter_and_package_monitoring_safe",
      ok:
        healthyRecord.runtimeFlags.runtimeExecutionEnabled === false &&
        failureRecord.runtimeFlags.mapAttachmentAllowed === false &&
        warningRecord.runtimeFlags.automaticRendererExecutionAllowed === false
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
    schemaId: "ATLAS_RUNTIME_MONITORING_SIMULATION_VALIDATION_001",
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
      telemetryRecords.deterministicFingerprint,
      alertOutputs.deterministicFingerprint
    )
  });
}

function buildLifecycle(telemetryRecords, validation) {
  const healthyCount = telemetryRecords.records.filter(
    (record) => record.healthState === "HEALTHY"
  ).length;
  const warningCount = telemetryRecords.records.filter(
    (record) => record.healthState === "WARNING"
  ).length;
  const blockedCount = telemetryRecords.records.filter(
    (record) => record.healthState === "BLOCKED"
  ).length;

  return deepFreeze({
    schemaId: "ATLAS_RUNTIME_MONITORING_SIMULATION_LIFECYCLE_001",
    simulationId: telemetryRecords.simulationId,
    lifecycleStatus:
      validation.status === "pass"
        ? "FUTURE_RUNTIME_MONITORING_READY_FOR_IMPLEMENTATION"
        : "RUNTIME_MONITORING_SIMULATION_BLOCKED",
    healthyScenarioCount: healthyCount,
    warningScenarioCount: warningCount,
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
      telemetryRecords.simulationId,
      validation.status,
      healthyCount,
      warningCount,
      blockedCount
    )
  });
}

function buildReport(telemetryRecords, alertOutputs, validation, lifecycle) {
  const telemetryLines = telemetryRecords.records
    .map(
      (record) =>
        `- ${record.scenarioId}: ${record.healthState} / ${record.alertState} / ${record.rollbackSignal}`
    )
    .join("\n");
  const alertLines = alertOutputs.alerts
    .map(
      (alert) =>
        `- ${alert.alertId}: ${alert.controlCentreCardId} -> ${alert.operatorAction}`
    )
    .join("\n");

  return `# ATLAS RUNTIME MONITORING SIMULATION

## Goal

Create a data-only simulation proving the future Atlas runtime monitoring layer can observe, report, and respond safely.

## Telemetry

${telemetryLines}

## Alerts

${alertLines}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- healthy scenarios: ${lifecycle.healthyScenarioCount}
- warning scenarios: ${lifecycle.warningScenarioCount}
- blocked scenarios: ${lifecycle.blockedScenarioCount}

## Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false

## Readiness

Future runtime monitoring readiness: ${
    validation.status === "pass"
      ? "READY_FOR_IMPLEMENTATION_WORK"
      : "BLOCKED"
  }
`;
}

export function buildAtlasRuntimeMonitoringSimulation({
  cwd = process.cwd()
} = {}) {
  const inputs = loadInputs(cwd);
  const harness = buildHarness(inputs);
  const telemetryRecords = buildTelemetryRecords(harness, inputs);
  const alertOutputs = buildAlertOutputs(harness, telemetryRecords, inputs);
  const validation = buildValidation(
    harness,
    telemetryRecords,
    alertOutputs,
    inputs
  );
  const lifecycle = buildLifecycle(telemetryRecords, validation);
  const report = buildReport(
    telemetryRecords,
    alertOutputs,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    telemetryRecords,
    alertOutputs,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasRuntimeMonitoringSimulation({
  cwd = process.cwd()
} = {}) {
  const result = buildAtlasRuntimeMonitoringSimulation({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const telemetryDir = path.join(result.root, "telemetry");
  const alertsDir = path.join(result.root, "alerts");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    telemetryDir,
    alertsDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), result.harness);
  writeJson(path.join(telemetryDir, TELEMETRY_FILENAME), result.telemetryRecords);
  writeJson(path.join(alertsDir, ALERTS_FILENAME), result.alertOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasRuntimeMonitoringSimulation();
}
