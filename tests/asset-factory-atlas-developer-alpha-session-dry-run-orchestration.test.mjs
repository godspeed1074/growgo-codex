import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const orchestrationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-orchestration/ATLAS_DEVELOPER_ALPHA_SESSION_DRY_RUN_ORCHESTRATION_001"
);

const harnessPath = path.join(
  orchestrationRoot,
  "specification/atlas-developer-alpha-orchestration-simulation-harness.json"
);
const outputsPath = path.join(
  orchestrationRoot,
  "outputs/atlas-developer-alpha-session-lifecycle-outputs.json"
);
const telemetryPath = path.join(
  orchestrationRoot,
  "telemetry/atlas-developer-alpha-orchestration-telemetry-records.json"
);
const auditPath = path.join(
  orchestrationRoot,
  "audit/atlas-developer-alpha-orchestration-audit-records.json"
);
const validationPath = path.join(
  orchestrationRoot,
  "validation/atlas-developer-alpha-orchestration-validation.json"
);
const lifecyclePath = path.join(
  orchestrationRoot,
  "lifecycle/atlas-developer-alpha-orchestration-lifecycle.json"
);
const reportPath = path.join(
  orchestrationRoot,
  "reports/atlas-developer-alpha-orchestration-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-dry-run-orchestration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session dry run orchestration is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionDryRunOrchestration({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionDryRunOrchestration({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.sessionLifecycleOutputs, second.sessionLifecycleOutputs);
  assert.deepEqual(first.telemetryOutputs, second.telemetryOutputs);
  assert.deepEqual(first.auditOutputs, second.auditOutputs);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session dry run orchestration covers initialization, preparation, start, healthy operation, warning, rollback, completion, and review completion", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionDryRunOrchestration({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 8);
  assert.equal(result.sessionLifecycleOutputs.outputs.length, 8);
  assert.equal(
    result.sessionLifecycleOutputs.outputs.some(
      (step) => step.stepId === "ROLLBACK_EVENT" && step.toState === "ROLLBACK_IN_PROGRESS"
    ),
    true
  );
  assert.equal(
    result.sessionLifecycleOutputs.outputs.at(-1)?.toState,
    "COMPLETED"
  );
});

test("atlas developer alpha session dry run orchestration preserves telemetry flow, audit completeness, and blocked runtime state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionDryRunOrchestration({
    cwd: repoRoot
  });

  assert.equal(result.telemetryOutputs.records.length, 3);
  assert.equal(
    result.auditOutputs.records.some(
      (record) => record.auditEvent === "ROLLBACK_RECORDED"
    ),
    true
  );
  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.blenderAuthorized, false);
  assert.equal(result.validation.glbAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("atlas developer alpha session dry run orchestration writes records and reaches orchestration readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionDryRunOrchestration({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const outputs = readJson(outputsPath);
  const telemetry = readJson(telemetryPath);
  const audit = readJson(auditPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.recordedOn, "2026-07-30");
  assert.equal(outputs.outputs.length, 8);
  assert.equal(telemetry.records.length, 3);
  assert.equal(audit.records.length >= 6, true);
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "READY_FOR_FUTURE_DEVELOPER_ALPHA_DRY_RUN_ORCHESTRATION_REVIEW"
  );
  assert.match(
    report,
    /Developer alpha orchestration readiness: READY_FOR_FUTURE_DEVELOPER_ALPHA_DRY_RUN_ORCHESTRATION_REVIEW/
  );
});
