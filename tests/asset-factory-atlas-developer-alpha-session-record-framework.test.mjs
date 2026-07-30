import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const frameworkRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-recording/ATLAS_DEVELOPER_ALPHA_SESSION_RECORD_FRAMEWORK_001"
);

const specificationPath = path.join(
  frameworkRoot,
  "specification/atlas-developer-alpha-session-record-specification.json"
);
const eventSchemaPath = path.join(
  frameworkRoot,
  "schema/atlas-developer-alpha-session-event-schema.json"
);
const validationPath = path.join(
  frameworkRoot,
  "validation/atlas-developer-alpha-session-record-validation.json"
);
const lifecyclePath = path.join(
  frameworkRoot,
  "lifecycle/atlas-developer-alpha-session-record-lifecycle.json"
);
const reportPath = path.join(
  frameworkRoot,
  "reports/atlas-developer-alpha-session-record-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-record-framework.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session record framework is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionRecordFramework({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionRecordFramework({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.eventSchema, second.eventSchema);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session record framework defines identity, pre-session capture, event logging, telemetry, outcomes, review structure, and audit references", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionRecordFramework({
    cwd: repoRoot
  });

  assert.equal(
    result.specification.sessionIdentitySchema.requiredFields.length >= 8,
    true
  );
  assert.equal(
    result.specification.preSessionStateCapture.requiredCaptures.length >= 8,
    true
  );
  assert.equal(
    result.specification.sessionEventLogging.eventSequence.length >= 7,
    true
  );
  assert.equal(
    result.specification.telemetryCapture.requiredFields.length >= 6,
    true
  );
  assert.equal(result.specification.outcomeStates.length >= 5, true);
  assert.equal(
    result.specification.postSessionReviewStructure.requiredSections.length >= 8,
    true
  );
  assert.equal(
    result.specification.auditReferences.requiredReferences.length >= 3,
    true
  );
});

test("atlas developer alpha session record framework preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionRecordFramework({
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

test("atlas developer alpha session record framework writes records and reaches recording readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionRecordFramework({
    cwd: repoRoot
  });

  const specification = readJson(specificationPath);
  const eventSchema = readJson(eventSchemaPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.recordedOn, "2026-07-30");
  assert.equal(eventSchema.sessionEventSchema.eventTypes.length >= 7, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_RECORDING"
  );
  assert.match(
    report,
    /Developer alpha session recording readiness: READY_FOR_FUTURE_DEVELOPER_ALPHA_SESSION_RECORDING/
  );
});
