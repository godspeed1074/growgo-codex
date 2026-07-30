import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const controlRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-control/ATLAS_DEVELOPER_ALPHA_SESSION_CONTROL_RECORD_001"
);

const specificationPath = path.join(
  controlRoot,
  "specification/atlas-developer-alpha-session-control-specification.json"
);
const schemaPath = path.join(
  controlRoot,
  "schema/atlas-developer-alpha-session-state-machine-schema.json"
);
const validationPath = path.join(
  controlRoot,
  "validation/atlas-developer-alpha-session-control-validation.json"
);
const lifecyclePath = path.join(
  controlRoot,
  "lifecycle/atlas-developer-alpha-session-control-lifecycle.json"
);
const reportPath = path.join(
  controlRoot,
  "reports/atlas-developer-alpha-session-control-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-control-record.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session control record is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionControlRecord({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionControlRecord({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.stateMachine, second.stateMachine);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session control record defines states, transitions, control events, pause, rollback, emergency stop, and audit requirements", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionControlRecord({
    cwd: repoRoot
  });

  assert.equal(result.specification.sessionStates.length >= 8, true);
  assert.equal(result.specification.allowedTransitions.length >= 10, true);
  assert.equal(result.specification.blockedTransitions.length >= 6, true);
  assert.equal(result.specification.controlEvents.length >= 9, true);
  assert.equal(
    result.specification.pauseHandling.allowedFromStates.includes(
      "ACTIVE_MANUAL_REVIEW"
    ),
    true
  );
  assert.equal(
    result.specification.rollbackHandling.rollbackState,
    "ROLLBACK_IN_PROGRESS"
  );
  assert.equal(
    result.specification.emergencyStopHandling.terminalState,
    "EMERGENCY_STOPPED"
  );
  assert.equal(
    result.specification.auditEventRequirements.requiredAuditEvents.length >= 7,
    true
  );
});

test("atlas developer alpha session control record preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionControlRecord({
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

test("atlas developer alpha session control record writes records and reaches control readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionControlRecord({
    cwd: repoRoot
  });

  const specification = readJson(specificationPath);
  const schema = readJson(schemaPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.recordedOn, "2026-07-30");
  assert.equal(schema.states.length === specification.sessionStates.length, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_CONTROL_RECORDING"
  );
  assert.match(
    report,
    /Developer alpha session control readiness: READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_CONTROL_RECORDING/
  );
});
