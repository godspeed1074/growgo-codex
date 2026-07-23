import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const atlasRuntimeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-world-preview-runtime-foundation.mjs"
  )
);

const combinedPreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "combined-world-preview-generator-foundation.mjs"
  )
);

test("Atlas Engine world preview runtime foundation validates the manual-only preview session structure", () => {
  const result =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation();
  const combinedPreview =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation();

  assert.equal(result.ok, true);
  assert.equal(combinedPreview.ok, true);
  assert.equal(
    result.atlasWorldPreviewRuntime.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasWorldPreviewRuntime.previewWorldId,
    combinedPreview.combinedWorldPreview.previewWorldId
  );
  assert.equal(
    result.atlasWorldPreviewRuntime.sessionState.currentState,
    "prepared"
  );
  assert.equal(result.atlasWorldPreviewRuntime.worldInstances.length, 4);
  assert.equal(result.atlasWorldPreviewRuntime.environmentInstances.length, 7);
});

test("Atlas Engine world preview runtime requires manual activation authorization and prevents duplicate preview sessions", () => {
  const sessionResult =
    atlasRuntimeModule.createAtlasEngineWorldPreviewRuntimeSession(undefined, {
      manual: true,
      isolated: true
    });

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.atlasSession.currentSessionState(), "prepared");

  const blockedActivation = sessionResult.atlasSession.activatePreview();
  const firstActivation = sessionResult.atlasSession.activatePreview({
    manualPreviewAuthorized: true
  });
  const duplicateActivation = sessionResult.atlasSession.activatePreview({
    manualPreviewAuthorized: true
  });

  assert.equal(blockedActivation.ok, false);
  assert.equal(
    blockedActivation.errorCode,
    "manual_preview_authorization_required"
  );
  assert.equal(firstActivation.ok, true);
  assert.equal(
    firstActivation.previewActivation.liveRuntimeEnabled,
    false
  );
  assert.equal(sessionResult.atlasSession.currentSessionState(), "previewing");
  assert.equal(duplicateActivation.ok, false);
  assert.equal(duplicateActivation.errorCode, "duplicate_session_prevented");
});

test("Atlas Engine world preview runtime validates pause, cleanup safety, and stale reference rejection", () => {
  const sessionResult =
    atlasRuntimeModule.createAtlasEngineWorldPreviewRuntimeSession(undefined, {
      manual: true,
      isolated: true
    });

  assert.equal(sessionResult.ok, true);

  const activation = sessionResult.atlasSession.activatePreview({
    manualPreviewAuthorized: true
  });
  const pause = sessionResult.atlasSession.pausePreview();
  const close = sessionResult.atlasSession.closeAtlasSession();
  const staleActivation = sessionResult.atlasSession.activatePreview({
    manualPreviewAuthorized: true
  });

  assert.equal(activation.ok, true);
  assert.equal(pause.ok, true);
  assert.equal(pause.pauseResult.priorState, "previewing");
  assert.equal(pause.pauseResult.currentState, "paused");
  assert.equal(close.ok, true);
  assert.equal(close.cleanupStatus, "atlas-preview-session-closed");
  assert.equal(close.affectedLiveRuntime, false);
  assert.equal(staleActivation.ok, false);
  assert.equal(staleActivation.errorCode, "stale_reference_rejected");
});

test("same world preview input produces identical passive Atlas runtime output", () => {
  const first =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation();
  const second =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.atlasWorldPreviewRuntime, second.atlasWorldPreviewRuntime);
});

test("Atlas Engine world preview runtime remains passive and rejects invalid preview counts safely", () => {
  const invalidCounts =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation({
      ...atlasRuntimeModule.atlasEngineWorldPreviewRuntimeFoundationDefinition,
      expectedRendererPayloadCount: 10
    });

  const result =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation();

  assert.equal(invalidCounts.ok, false);
  assert.equal(invalidCounts.errorCode, "renderer_payload_count_mismatch");
  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasWorldPreviewRuntime,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasWorldPreviewRuntime,
      "realMapAttachment"
    ),
    false
  );
  assert.equal(
    result.atlasWorldPreviewRuntime.compatibility.playerRuntimeEnabled,
    false
  );
});
