import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const START_RECORD_ROOT =
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001";

const SPECIFICATION_FILENAME =
  "atlas-developer-alpha-session-start-record-specification.json";
const START_EVENT_SCHEMA_FILENAME =
  "atlas-developer-alpha-session-start-event-schema.json";
const VALIDATION_FILENAME =
  "atlas-developer-alpha-session-start-record-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-developer-alpha-session-start-record-lifecycle.json";
const REPORT_FILENAME = "atlas-developer-alpha-session-start-record-report.md";

const READINESS_LOCK_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/record/atlas-developer-alpha-session-readiness-lock-record.json";
const READINESS_LOCK_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-readiness-lock/ATLAS_DEVELOPER_ALPHA_SESSION_READINESS_LOCK_001/validation/atlas-developer-alpha-session-readiness-lock-validation.json";
const CONTROL_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001/specification/atlas-developer-alpha-session-control-specification.json";
const RECORD_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001/specification/atlas-developer-alpha-session-record-specification.json";
const AUTHORIZATION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001/authorization/atlas-developer-alpha-manual-session-authorization-record.json";

const SESSION_DATE = "2026-07-30";
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
    readinessLockRecord: readJson(cwd, READINESS_LOCK_RECORD_PATH),
    readinessLockValidation: readJson(cwd, READINESS_LOCK_VALIDATION_PATH),
    controlSpecification: readJson(cwd, CONTROL_SPECIFICATION_PATH),
    recordSpecification: readJson(cwd, RECORD_SPECIFICATION_PATH),
    authorizationRecord: readJson(cwd, AUTHORIZATION_RECORD_PATH)
  });
}

function captureRepositoryState(cwd) {
  const output = execFileSync("git", ["status", "--short"], {
    cwd,
    encoding: "utf8"
  }).trim();
  const statusLines = output ? output.split("\n") : [];
  return deepFreeze({
    gitStatusCaptured: true,
    statusLines,
    hasUncommittedChanges: statusLines.length > 0,
    readinessState: "SESSION_START_REPOSITORY_SNAPSHOT_CAPTURED"
  });
}

function buildSessionId(readinessLockRecord) {
  const dateToken = SESSION_DATE.replaceAll("-", "");
  const regionToken = readinessLockRecord.sessionScope.regionId;
  return `ATLAS_DEVELOPER_ALPHA_SESSION_${dateToken}_${regionToken}_001`;
}

function buildStartRecordSpecification(inputs, repositoryState) {
  const sessionId = buildSessionId(inputs.readinessLockRecord);

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_SPECIFICATION_001",
    startRecordId: "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001",
    recordedOn: SESSION_DATE,
    sessionIdentityRecord: {
      sessionId,
      sessionDate: SESSION_DATE,
      environment: inputs.readinessLockRecord.sessionScope.environment,
      regionId: inputs.readinessLockRecord.sessionScope.regionId,
      packageId: inputs.readinessLockRecord.sessionScope.packageId,
      recipeId: inputs.readinessLockRecord.sessionScope.recipeId,
      operatorRoles: inputs.readinessLockRecord.operatorAuthorization.authorizedUsers,
      approvalReference: inputs.readinessLockRecord.references.authorizationId,
      finalCheckReference: inputs.readinessLockRecord.references.finalCheckId,
      readinessLockReference: inputs.readinessLockRecord.lockId
    },
    readinessVerification: {
      readinessLockState: inputs.readinessLockRecord.readinessState,
      readinessLockValidationStatus: inputs.readinessLockValidation.status,
      authorizationState: inputs.readinessLockRecord.authorizationStatus.authorizationState,
      authorizationExpiryStatus: inputs.readinessLockRecord.authorizationStatus.expiryStatus,
      repositoryState: repositoryState.readinessState
    },
    initialStateSnapshot: {
      allowedStartState: "NOT_STARTED",
      nextState: "PRE_SESSION_CAPTURE_READY",
      allowedTransitionConfirmed: inputs.controlSpecification.allowedTransitions.some(
        (transition) =>
          transition.from === "NOT_STARTED" &&
          transition.to === "PRE_SESSION_CAPTURE_READY"
      ),
      featureFlags: inputs.readinessLockRecord.finalSafetyConfirmation
    },
    packageSnapshot: {
      packageId: inputs.readinessLockRecord.versionLock.packageId,
      packageVersion: inputs.readinessLockRecord.versionLock.packageVersion,
      regionId: inputs.readinessLockRecord.sessionScope.regionId,
      packageVersionLocked: true
    },
    recipeSnapshot: {
      recipeId: inputs.readinessLockRecord.versionLock.recipeId,
      recipeVersion: inputs.readinessLockRecord.versionLock.recipeVersion,
      approvedForDeveloperOnlySession: true,
      recipeVersionLocked: true
    },
    telemetryBaseline: {
      sourceMonitoringChecklist: inputs.readinessLockRecord.monitoringReadiness.monitoringChecklist,
      healthyReference:
        inputs.readinessLockRecord.monitoringReadiness.monitoringFocus.healthyReference,
      warningReference:
        inputs.readinessLockRecord.monitoringReadiness.monitoringFocus.budgetWarningAlert,
      emergencyReference:
        inputs.readinessLockRecord.monitoringReadiness.monitoringFocus.emergencyShutdownAlert
    },
    auditInitialization: {
      requiredAuditEvents:
        inputs.controlSpecification.auditEventRequirements.requiredAuditEvents,
      requiredAuditReferences:
        inputs.controlSpecification.auditEventRequirements.requiredReferences,
      initialAuditEvents: ["SESSION_OPENED", "PRE_SESSION_CAPTURED"]
    },
    repositorySnapshot: repositoryState,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_SPECIFICATION_001",
      inputs.readinessLockRecord.deterministicFingerprint,
      inputs.controlSpecification.deterministicFingerprint,
      inputs.recordSpecification.deterministicFingerprint,
      inputs.authorizationRecord.deterministicFingerprint,
      JSON.stringify(repositoryState.statusLines),
      SESSION_DATE
    )
  });
}

function buildStartEventSchema(inputs, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_START_EVENT_SCHEMA_001",
    startRecordId: specification.startRecordId,
    recordedOn: SESSION_DATE,
    supportedStartEvents: [
      {
        eventType: "SESSION_OPENED",
        requiredFields: [
          "eventId",
          "eventType",
          "timestamp",
          "actorRole",
          "sessionId",
          "authorizationReference",
          "readinessLockReference",
          "safetyFlags",
          "summary",
          "auditReference"
        ]
      },
      {
        eventType: "PRE_SESSION_CAPTURED",
        requiredFields: [
          "eventId",
          "eventType",
          "timestamp",
          "actorRole",
          "sessionId",
          "repositorySnapshotReference",
          "packageSnapshotReference",
          "recipeSnapshotReference",
          "telemetryBaselineReference",
          "safetyFlags",
          "summary",
          "auditReference"
        ]
      }
    ],
    controlAlignment: {
      startState: "NOT_STARTED",
      nextState: "PRE_SESSION_CAPTURE_READY",
      requiredControlEvent: "OPEN_SESSION",
      requiredPreSessionEvent: "CAPTURE_PRE_SESSION_STATE"
    },
    telemetryAlignment: {
      requiredTelemetryReferences:
        inputs.recordSpecification.telemetryCapture.requiredTelemetryReferences,
      baselineMonitoringChecklist:
        specification.telemetryBaseline.sourceMonitoringChecklist
    },
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_START_EVENT_SCHEMA_001",
      specification.deterministicFingerprint,
      JSON.stringify(inputs.recordSpecification.telemetryCapture.requiredTelemetryReferences)
    )
  });
}

function buildValidation(inputs, specification, startEventSchema) {
  const checks = [
    {
      name: "readiness_lock_and_authorization_valid",
      ok:
        inputs.readinessLockValidation.status === "pass" &&
        inputs.readinessLockRecord.readinessState ===
          "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION" &&
        inputs.authorizationRecord.authorizationState ===
          "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
    },
    {
      name: "session_identity_and_start_transition_defined",
      ok:
        specification.sessionIdentityRecord.sessionId.startsWith(
          "ATLAS_DEVELOPER_ALPHA_SESSION_"
        ) &&
        specification.initialStateSnapshot.allowedTransitionConfirmed === true
    },
    {
      name: "package_recipe_and_telemetry_snapshots_defined",
      ok:
        specification.packageSnapshot.packageVersionLocked === true &&
        specification.recipeSnapshot.recipeVersionLocked === true &&
        specification.telemetryBaseline.sourceMonitoringChecklist.length >= 5
    },
    {
      name: "audit_initialization_and_start_event_schema_defined",
      ok:
        specification.auditInitialization.initialAuditEvents.length === 2 &&
        startEventSchema.supportedStartEvents.length === 2 &&
        startEventSchema.controlAlignment.requiredControlEvent === "OPEN_SESSION"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        specification.initialStateSnapshot.featureFlags.runtimeExecutionEnabled === false &&
        specification.initialStateSnapshot.featureFlags.mapAttachmentAllowed === false &&
        specification.initialStateSnapshot.featureFlags.automaticRendererExecutionAllowed ===
          false &&
        specification.initialStateSnapshot.featureFlags.rendererAttachmentAuthorized === false &&
        specification.initialStateSnapshot.featureFlags.mapDownloadsAuthorized === false &&
        specification.initialStateSnapshot.featureFlags.blenderAuthorized === false &&
        specification.initialStateSnapshot.featureFlags.glbAuthorized === false &&
        specification.initialStateSnapshot.featureFlags.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_VALIDATION_001",
    startRecordId: specification.startRecordId,
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
      "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_VALIDATION_001",
      specification.deterministicFingerprint,
      startEventSchema.deterministicFingerprint,
      JSON.stringify(checks)
    )
  });
}

function buildLifecycle(validation, specification) {
  return deepFreeze({
    schemaId: "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_LIFECYCLE_001",
    startRecordId: specification.startRecordId,
    lifecycleStatus:
      validation.status === "pass"
        ? "SESSION_START_READY_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
        : "SESSION_START_BLOCKED",
    sessionId: specification.sessionIdentityRecord.sessionId,
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    rendererAttachmentAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: hashHex(
      "ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_LIFECYCLE_001",
      validation.status,
      specification.sessionIdentityRecord.sessionId,
      SESSION_DATE
    )
  });
}

function buildReport(specification, startEventSchema, validation, lifecycle) {
  return `# ATLAS DEVELOPER ALPHA SESSION START RECORD

## Goal

Create the formal start-record framework for the future developer-only Atlas alpha session.

## Session Start Readiness

- start record id: ${specification.startRecordId}
- session id: ${specification.sessionIdentityRecord.sessionId}
- lifecycle status: ${lifecycle.lifecycleStatus}
- readiness lock: ${specification.readinessVerification.readinessLockState}
- authorization state: ${specification.readinessVerification.authorizationState}

## Start Event Schema

${startEventSchema.supportedStartEvents
  .map((event) => `- ${event.eventType}: ${event.requiredFields.length} required fields`)
  .join("\n")}

## Snapshots

- package: ${specification.packageSnapshot.packageId} (${specification.packageSnapshot.packageVersion})
- recipe: ${specification.recipeSnapshot.recipeId} (${specification.recipeSnapshot.recipeVersion})
- monitoring checklist items: ${specification.telemetryBaseline.sourceMonitoringChecklist.length}
- initial audit events: ${specification.auditInitialization.initialAuditEvents.join(", ")}

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

## Final Session Start Readiness

Developer alpha session start readiness: ${
    validation.status === "pass"
      ? "READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
      : "BLOCKED"
  }
`;
}

export function buildAtlasDeveloperAlphaSessionStartRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const inputs = loadInputs(cwd);
  const repositoryState = captureRepositoryState(cwd);
  const specification = buildStartRecordSpecification(inputs, repositoryState);
  const startEventSchema = buildStartEventSchema(inputs, specification);
  const validation = buildValidation(inputs, specification, startEventSchema);
  const lifecycle = buildLifecycle(validation, specification);
  const report = buildReport(specification, startEventSchema, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, START_RECORD_ROOT),
    specification,
    startEventSchema,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasDeveloperAlphaSessionStartRecord({
  cwd = DEFAULT_CWD
} = {}) {
  const result = buildAtlasDeveloperAlphaSessionStartRecord({ cwd });
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

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), result.specification);
  writeJson(path.join(schemaDir, START_EVENT_SCHEMA_FILENAME), result.startEventSchema);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), result.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), result.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), result.report);

  return result;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasDeveloperAlphaSessionStartRecord();
}
