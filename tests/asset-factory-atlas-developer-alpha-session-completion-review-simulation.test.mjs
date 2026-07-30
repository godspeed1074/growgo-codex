import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const simulationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-session-completion-review/ATLAS_DEVELOPER_ALPHA_SESSION_COMPLETION_REVIEW_SIMULATION_001"
);

const harnessPath = path.join(
  simulationRoot,
  "specification/atlas-developer-alpha-session-completion-review-harness.json"
);
const finalSessionRecordsPath = path.join(
  simulationRoot,
  "sessions/atlas-developer-alpha-final-session-records.json"
);
const reviewOutputsPath = path.join(
  simulationRoot,
  "reviews/atlas-developer-alpha-session-review-outputs.json"
);
const telemetrySummaryPath = path.join(
  simulationRoot,
  "telemetry/atlas-developer-alpha-session-telemetry-summary.json"
);
const validationPath = path.join(
  simulationRoot,
  "validation/atlas-developer-alpha-session-completion-review-validation.json"
);
const lifecyclePath = path.join(
  simulationRoot,
  "lifecycle/atlas-developer-alpha-session-completion-review-lifecycle.json"
);
const reportPath = path.join(
  simulationRoot,
  "reports/atlas-developer-alpha-session-completion-review-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-session-completion-review-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha session completion review simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.harness, second.harness);
  assert.deepEqual(first.finalSessionRecords, second.finalSessionRecords);
  assert.deepEqual(first.reviewOutputs, second.reviewOutputs);
  assert.deepEqual(first.telemetrySummary, second.telemetrySummary);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha session completion review simulation covers success, warning, rollback, and failed review scenarios", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({
    cwd: repoRoot
  });

  assert.equal(result.harness.scenarios.length, 4);
  assert.equal(
    result.finalSessionRecords.records.some(
      (record) =>
        record.scenarioType === "SUCCESSFUL_SESSION_COMPLETION" &&
        record.outcomeState === "COMPLETED_NO_ACTION"
    ),
    true
  );
  assert.equal(
    result.finalSessionRecords.records.some(
      (record) =>
        record.scenarioType === "FAILED_SESSION_REQUIRING_REVIEW" &&
        record.outcomeState === "INVALID_SESSION_RECORD"
    ),
    true
  );
});

test("atlas developer alpha session completion review simulation preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaSessionCompletionReviewSimulation({
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

test("atlas developer alpha session completion review simulation writes records and reaches completion readiness", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaSessionCompletionReviewSimulation({
    cwd: repoRoot
  });

  const harness = readJson(harnessPath);
  const finalSessionRecords = readJson(finalSessionRecordsPath);
  const reviewOutputs = readJson(reviewOutputsPath);
  const telemetrySummary = readJson(telemetrySummaryPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(harness.recordedOn, "2026-07-30");
  assert.equal(finalSessionRecords.records.length, 4);
  assert.equal(reviewOutputs.outputs.every((output) => output.reviewStatus === "GENERATED"), true);
  assert.equal(telemetrySummary.summary.continuityState, "POST_SESSION_TELEMETRY_SUMMARY_COMPLETE");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "COMPLETION_REVIEW_READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.match(
    report,
    /Developer alpha completion readiness: READY_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
