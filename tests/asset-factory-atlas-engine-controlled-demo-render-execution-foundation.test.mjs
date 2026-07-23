import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const renderExecutionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-controlled-demo-render-execution-foundation.mjs"
  )
);

test("Atlas Engine controlled demo render execution foundation validates a deterministic passive render execution package", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledDemoRenderExecution.atlasResultId.startsWith(
      "ATLAS_SHOWCASE_OUTPUT_PACKAGE_001_"
    ),
    true
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.renderState.currentState,
    "completed"
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.verificationResult
      .verifiedRendererPayloadCount,
    11
  );
});

test("Atlas Engine controlled demo render execution exposes the approved render states and render summary", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation();

  assert.equal(result.ok, true);
  assert.deepEqual(
    renderExecutionModule.atlasEngineControlledDemoRenderExecutionStates,
    ["created", "preparing", "executing", "verified", "completed", "failed", "closed"]
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.location,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.scene,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.camera.profile,
    "string"
  );
  assert.equal(
    typeof result.atlasControlledDemoRenderExecution.renderSummary.mode,
    "string"
  );
});

test("same Atlas result produces identical deterministic controlled demo render execution output", () => {
  const first =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation();
  const second =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasControlledDemoRenderExecution,
    second.atlasControlledDemoRenderExecution
  );
});

test("Atlas Engine controlled demo render execution session stays manual-only and rejects duplicate render execution", () => {
  const creation =
    renderExecutionModule.createAtlasEngineControlledDemoRenderExecutionSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(creation.ok, true);
  assert.equal(
    creation.atlasControlledDemoRenderSession.currentRenderState(),
    "created"
  );

  const activation =
    creation.atlasControlledDemoRenderSession.startRenderExecution({
      manualRenderExecutionAuthorized: true
    });
  assert.equal(activation.ok, true);
  assert.equal(activation.renderActivation.renderState, "completed");
  assert.equal(activation.renderActivation.realMapAttached, false);

  const duplicate =
    creation.atlasControlledDemoRenderSession.startRenderExecution({
      manualRenderExecutionAuthorized: true
    });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.errorCode, "duplicate_render_execution_prevented");
});

test("Atlas Engine controlled demo render execution remains passive and exposes no live runtime handles", () => {
  const result =
    renderExecutionModule.validateAtlasEngineControlledDemoRenderExecutionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasControlledDemoRenderExecution.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledDemoRenderExecution,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasControlledDemoRenderExecution,
      "realMapAttachment"
    ),
    false
  );
});
