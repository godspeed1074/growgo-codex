import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const startRecordRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-start-record/ATLAS_DEVELOPER_ALPHA_SESSION_START_RECORD_001"
);

const specificationPath = path.join(
  startRecordRoot,
  "specification/atlas-developer-alpha-session-start-record-specification.json"
);
const startEventSchemaPath = path.join(
  startRecordRoot,
  "schema/atlas-developer-alpha-session-start-event-schema.json"
);
const validationPath = path.join(
  startRecordRoot,
  "validation/atlas-developer-alpha-session-start-record-validation.json"
);
const lifecyclePath = path.join(
  startRecordRoot,
  "lifecycle/atlas-developer-alpha-session-start-record-lifecycle.json"
);
const reportPath = path.join(
  startRecordRoot,
  "reports/atlas-developer-alpha-session-start-record-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-start-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session start record is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionStartRecord({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionStartRecord({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.startEventSchema, second.startEventSchema);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session start record defines session identity, readiness verification, package and recipe snapshots, telemetry baseline, and audit initialization", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionStartRecord({
    cwd: repoRoot
  });

  assert.match(
    result.specification.sessionIdentityRecord.sessionId,
    /^ATLAS_DEVELOPER_ALPHA_SESSION_20260730_/
  );
  assert.equal(
    result.specification.readinessVerification.readinessLockState,
    "READINESS_LOCKED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.equal(result.specification.packageSnapshot.packageVersion, "v001");
  assert.equal(result.specification.recipeSnapshot.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(result.specification.telemetryBaseline.sourceMonitoringChecklist.length >= 5, true);
  assert.deepEqual(result.specification.auditInitialization.initialAuditEvents, [
    "SESSION_OPENED",
    "PRE_SESSION_CAPTURED"
  ]);
});

test("atlas developer alpha session start record preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionStartRecord({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.blenderAuthorized, false);
  assert.equal(result.validation.glbAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("atlas developer alpha session start record writes records and reaches session start readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionStartRecord({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const startEventSchema = readJson(startEventSchemaPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.recordedOn, "2026-07-30");
  assert.equal(startEventSchema.supportedStartEvents.length, 2);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "SESSION_START_READY_PENDING_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha session start readiness: READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
