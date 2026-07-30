import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const FRAMEWORK_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001";

const SPECIFICATION_FILENAME =
  "atlas-developer-alpha-session-record-specification.json";
const EVENT_SCHEMA_FILENAME =
  "atlas-developer-alpha-session-event-schema.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-record-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-record-lifecycle.json";
const REPORT_FILENAME =
  "atlas-developer-alpha-session-record-architecture-report.md";

const FINAL_CHECK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/record/atlas-developer-alpha-final-check-record.json";
const FINAL_CHECK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-final-check/ATLAS_DEVELOPER_ALPHA_EXECUTION_FINAL_CHECK_001/validation/atlas-developer-alpha-final-check-validation.json";
const PREPARATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-execution-preparation/ATLAS_DEVELOPER_ALPHA_EXECUTION_PREPARATION_001/preparation/atlas-developer-alpha-execution-preparation-record.json";
const MONITORING_TELEMETRY_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/telemetry/atlas-runtime-monitoring-telemetry-records.json";
const MONITORING_VALIDATION_PATH =
  "asset-factory-workspace/atlas-runtime-monitoring/ATLAS_RUNTIME_MONITORING_SIMULATION_001/validation/atlas-runtime-monitoring-validation.json";

const RECORD_DATE = "2026-07-30";
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
    finalCheckRecord: readJson(cwd, FINAL_CHECK_RECORD_PATH),
    finalCheckValidation: readJson(cwd, FINAL_CHECK_VALIDATION_PATH),
    preparationRecord: readJson(cwd, PREPARATION_RECORD_PATH),
    monitoringTelemetry: readJson(cwd, MONITORING_TELEMETRY_PATH),
    monitoringValidation: readJson(cwd, MONITORING_VALIDATION_PATH)
  });
}

function buildSessionRecordSpecification(inputs) {
  const healthyTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "HEALTHY_ATLAS_GENERATION"
  );
  const shutdownTelemetry = inputs.monitoringTelemetry.records.find(
    (record) => record.scenarioType === "EMERGENCY_SHUTDOWN_EVENT"
  );

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_SPECIFICATION_001",
    frameworkId: "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001",
    recordedOn: RECORD_DATE,
    sessionIdentitySchema: {
      sessionIdFormat: "ATLAS_DEVELOPER_ALPHA_SESSION_{DATE}_{REGION}_{RUN}",
      requiredFields: [
        "sessionId",
        "sessionDate",
        "environment",
        "regionId",
        "packageId",
        "recipeId",
        "operatorRoles",
        "approvalReference",
        "finalCheckReference"
      ]
    },
    preSessionStateCapture: {
      requiredCaptures: [
        "repositoryReadiness",
        "sessionDecisionState",
        "featureFlagSnapshot",
        "alphaScope",
        "packageSnapshot",
        "recipeSnapshot",
        "monitoringPreparation",
        "rollbackReadiness"
      ],
      requiredFlagStates: {
        runtimeExecutionEnabled: false,
        mapAttachmentAllowed: false,
        automaticRendererExecutionAllowed: false
      }
    },
    sessionEventLogging: {
      eventSequence: [
        "SESSION_OPENED",
        "PRE_SESSION_CAPTURED",
        "COORDINATE_LOOKUP_NOTED",
        "MONITORING_SIGNAL_OBSERVED",
        "STOP_CONDITION_OBSERVED",
        "ROLLBACK_RECORDED",
        "SESSION_CLOSED"
      ],
      eventRequirements: [
        "eventId",
        "eventType",
        "timestamp",
        "actorRole",
        "summary",
        "safetyFlags",
        "auditReference"
      ]
    },
    telemetryCapture: {
      sourceSimulationId: inputs.monitoringTelemetry.simulationId,
      requiredTelemetryReferences: [
        healthyTelemetry.telemetryId,
        shutdownTelemetry.telemetryId
      ],
      requiredFields: [
        "telemetryId",
        "healthState",
        "alertState",
        "rollbackSignal",
        "reasonCode",
        "runtimeFlags"
      ]
    },
    outcomeStates: [
      "COMPLETED_NO_ACTION",
      "COMPLETED_WITH_WARNING",
      "STOPPED_AND_ROLLED_BACK",
      "EMERGENCY_STOP_RECORDED",
      "INVALID_SESSION_RECORD"
    ],
    postSessionReviewStructure: {
      requiredSections: [
        "sessionSummary",
        "eventTimeline",
        "telemetrySummary",
        "successMetricReview",
        "stopConditionReview",
        "rollbackReview",
        "operatorNotes",
        "followUpActions"
      ]
    },
    auditReferences: {
      requiredReferences: [
        inputs.finalCheckRecord.checkId,
        inputs.preparationRecord.preparationId,
        "ATLAS_RUNTIME_MONITORING_SIMULATION_001"
      ],
      retentionPolicy: "developer_only_session_records_retained_with_audit_links"
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001",
      inputs.finalCheckRecord.deterministicFingerprint,
      inputs.preparationRecord.deterministicFingerprint,
      inputs.monitoringTelemetry.deterministicFingerprint,
      RECORD_DATE
    )
  });
}

function buildEventSchema(inputs, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_EVENT_SCHEMA_001",
    frameworkId: specification.frameworkId,
    sessionEventSchema: {
      requiredFields: {
        eventId: "string",
        eventType: "enum",
        timestamp: "ISO-8601 string",
        actorRole: "enum",
        summary: "string",
        safetyFlags: {
          runtimeExecutionEnabled: "boolean false only",
          mapAttachmentAllowed: "boolean false only",
          automaticRendererExecutionAllowed: "boolean false only"
        },
        telemetryReference: "nullable string",
        auditReference: "string",
        notes: "optional string"
      },
      eventTypes: specification.sessionEventLogging.eventSequence,
      actorRoles: inputs.preparationRecord.stopAuthority.primaryOwner
        ? [
            inputs.preparationRecord.stopAuthority.primaryOwner,
            inputs.preparationRecord.stopAuthority.backupOwner
          ]
        : ["atlas_operator", "internal_developer_reviewer"]
    },
    telemetrySchema: {
      requiredFields: specification.telemetryCapture.requiredFields,
      acceptedHealthStates: ["HEALTHY", "WARNING", "BLOCKED"],
      acceptedAlertStates: [
        "NO_ALERT",
        "WARNING_PACKAGE_NEAR_LIMIT",
        "RECIPE_FALLBACK_WARNING",
        "BLOCK_PACKAGE_SIZE_LIMIT",
        "EMERGENCY_SHUTDOWN_TRIGGERED"
      ]
    },
    postSessionReviewSchema: {
      requiredSections: specification.postSessionReviewStructure.requiredSections,
      requiredOutcomeStates: specification.outcomeStates
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_EVENT_SCHEMA_001",
      specification.deterministicFingerprint,
      JSON.stringify(specification.sessionEventLogging.eventSequence)
    )
  });
}

function buildValidation(inputs, specification, eventSchema) {
  const checks = [
    {
      name: "final_check_supports_recording_framework",
      ok:
        inputs.finalCheckValidation.status === "pass" &&
        inputs.finalCheckRecord.finalReadinessState ===
          "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "session_identity_and_pre_session_capture_defined",
      ok:
        specification.sessionIdentitySchema.requiredFields.length >= 8 &&
        specification.preSessionStateCapture.requiredCaptures.length >= 8
    },
    {
      name: "event_logging_and_telemetry_capture_defined",
      ok:
        specification.sessionEventLogging.eventSequence.length >= 7 &&
        eventSchema.telemetrySchema.requiredFields.length >= 6 &&
        inputs.monitoringValidation.status === "pass"
    },
    {
      name: "outcomes_post_session_review_and_audit_defined",
      ok:
        specification.outcomeStates.length >= 5 &&
        specification.postSessionReviewStructure.requiredSections.length >= 8 &&
        specification.auditReferences.requiredReferences.length >= 3
    },
    {
      name: "safety_flags_remain_disabled",
      ok:
        inputs.finalCheckRecord.safetyFlags.runtimeExecutionEnabled === false &&
        inputs.finalCheckRecord.safetyFlags.mapAttachmentAllowed === false &&
        inputs.finalCheckRecord.safetyFlags.automaticRendererExecutionAllowed ===
          false
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        inputs.finalCheckValidation.runtimeExecutionEnabled === false &&
        inputs.finalCheckValidation.mapAttachmentAllowed === false &&
        inputs.finalCheckValidation.automaticRendererExecutionAllowed === false &&
        inputs.finalCheckValidation.rendererAttachmentAuthorized === false &&
        inputs.finalCheckValidation.mapDownloadsAuthorized === false &&
        inputs.finalCheckValidation.blenderAuthorized === false &&
        inputs.finalCheckValidation.glbAuthorized === false &&
        inputs.finalCheckValidation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_VALIDATION_001",
    frameworkId: specification.frameworkId,
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_VALIDATION_001",
      specification.deterministicFingerprint,
      eventSchema.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_LIFECYCLE_001",
    frameworkId: specification.frameworkId,
    lifecycleStatus:
      validation.status === "pass"
        ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_RECORDING"
        : "DEVELOPER_ALPHA_SESSION_RECORDING_BLOCKED",
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_LIFECYCLE_001",
      validation.status,
      specification.frameworkId,
      RECORD_DATE
    )
  });
}

function buildReport(specification, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION RECORD FRAMEWORK

## Goal

Create the formal recording framework for a future developer-only Atlas alpha session.

## Framework

- framework id: ${specification.frameworkId}
- recorded on: ${specification.recordedOn}
- lifecycle status: ${lifecycle.lifecycleStatus}

## Coverage

- session identity schema
- pre-session state capture
- session event logging
- telemetry capture
- outcome states
- post-session review structure
- audit references

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

Developer alpha session recording readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_RECORDING"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionRecordFramework({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const specification = buildSessionRecordSpecification(inputs);
  const eventSchema = buildEventSchema(inputs, specification);
  const validation = buildValidation(inputs, specification, eventSchema);
  const lifecycle = buildLifecycle(validation, specification);
  const report = buildReport(specification, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, FRAMEWORK_ROOT),
    specification,
    eventSchema,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionRecordFramework({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionRecordFramework({ cwd });
  const specificationDir = path.join(result.root, "specification");
  const schemaDir = path.join(result.root, "schema");
  const validationDir = path.join(result.root, "validation");
  const lifecycleDir = path.join(result.root, "lifecycle");
  const reportsDir = path.join(result.root, "reports");

  for (const directory of [
    specificationDir,
    schemaDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    result.specification
  );
  writeJson(path.join(schemaDir, EVENT_SCHEMA_FILENAME), result.eventSchema);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionRecordFramework();
}
