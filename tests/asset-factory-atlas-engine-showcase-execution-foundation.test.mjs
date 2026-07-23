import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const executionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-showcase-execution-foundation.mjs"
  )
);

test("Atlas Engine showcase execution foundation validates a deterministic passive execution package", () => {
  const result =
    executionModule.validateAtlasEngineShowcaseExecutionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseExecution.executionSession.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasShowcaseExecution.executionSession.executionState,
    "completed"
  );
  assert.equal(
    result.atlasShowcaseExecution.pipelineExecution.rendererPreviewPreparation
      .payloadCount,
    11
  );
});

test("Atlas Engine showcase execution session progresses through manual-only execution safely", () => {
  const creation = executionModule.createAtlasEngineShowcaseExecutionSession(
    undefined,
    { manual: true, isolated: true }
  );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasExecutionSession.currentExecutionState(),
    "created"
  );

  const activation = creation.atlasExecutionSession.startExecution({
    manualExecutionAuthorized: true
  });
  assert.equal(activation.ok, true);
  assert.equal(activation.executionActivation.executionState, "completed");
  assert.equal(
    activation.executionActivation.liveRuntimeEnabled,
    false
  );

  const duplicate = creation.atlasExecutionSession.startExecution({
    manualExecutionAuthorized: true
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_execution_prevented");
});

test("same location and seed produce identical deterministic Atlas showcase execution output", () => {
  const first = executionModule.validateAtlasEngineShowcaseExecutionFoundation();
  const second = executionModule.validateAtlasEngineShowcaseExecutionFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.atlasShowcaseExecution, second.atlasShowcaseExecution);
});

test("Atlas Engine showcase execution provides an execution summary with completion details", () => {
  const result =
    executionModule.validateAtlasEngineShowcaseExecutionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.atlasShowcaseExecution.executionSession.resultSummary.location,
    "string"
  );
  assert.equal(
    result.atlasShowcaseExecution.executionSession.resultSummary.theme,
    "Coastal Explorer"
  );
  assert.equal(
    result.atlasShowcaseExecution.executionSession.resultSummary
      .generatedWorldStatus.generationVerified,
    true
  );
  assert.equal(
    result.atlasShowcaseExecution.executionSession.resultSummary.rendererStatus
      .compatibilityVerified,
    true
  );
});

test("Atlas Engine showcase execution remains passive and exposes no live runtime handles", () => {
  const result =
    executionModule.validateAtlasEngineShowcaseExecutionFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.atlasShowcaseExecution.compatibility.passiveOnly, true);
  assert.equal(result.atlasShowcaseExecution.compatibility.gpsConnected, false);
  assert.equal(
    result.atlasShowcaseExecution.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseExecution,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseExecution.executionSession,
      "realMapAttachment"
    ),
    false
  );
});
