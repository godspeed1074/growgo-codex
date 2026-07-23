import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const showcaseModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-preview-showcase-session-foundation.mjs"
  )
);

test("Atlas Engine preview showcase session foundation validates a deterministic passive showcase package", () => {
  const result =
    showcaseModule.validateAtlasEnginePreviewShowcaseSessionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasPreviewShowcaseSession.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasPreviewShowcaseSession.presentationData.showcaseProfile
      .showcaseProfileId,
    "coastal_explorer"
  );
  assert.equal(
    result.atlasPreviewShowcaseSession.rendererPreview.payloadCount,
    11
  );
});

test("Atlas Engine preview showcase session progresses through the approved passive showcase states", () => {
  const sessionResult =
    showcaseModule.createAtlasEnginePreviewShowcaseSession(undefined, {
      manual: true,
      isolated: true
    });

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.showcaseSession.currentShowcaseState(), "created");

  const generating = sessionResult.showcaseSession.beginGeneration();
  const ready = sessionResult.showcaseSession.markReady();
  const presenting = sessionResult.showcaseSession.beginPresentation();
  const completed = sessionResult.showcaseSession.completeShowcase();

  assert.equal(generating.ok, true);
  assert.equal(generating.showcaseState, "generating");
  assert.equal(ready.ok, true);
  assert.equal(ready.showcaseState, "ready");
  assert.equal(presenting.ok, true);
  assert.equal(presenting.showcaseState, "presenting");
  assert.equal(completed.ok, true);
  assert.equal(completed.showcaseState, "completed");
});

test("same location and seed produce identical deterministic Atlas showcase output", () => {
  const first =
    showcaseModule.validateAtlasEnginePreviewShowcaseSessionFoundation();
  const second =
    showcaseModule.validateAtlasEnginePreviewShowcaseSessionFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.atlasPreviewShowcaseSession, second.atlasPreviewShowcaseSession);
});

test("Atlas Engine preview showcase session provides a human-readable showcase summary", () => {
  const result =
    showcaseModule.validateAtlasEnginePreviewShowcaseSessionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.atlasPreviewShowcaseSession.showcaseSummary.location,
    "string"
  );
  assert.equal(
    result.atlasPreviewShowcaseSession.showcaseSummary.theme,
    "Coastal Explorer"
  );
  assert.equal(
    Array.isArray(result.atlasPreviewShowcaseSession.showcaseSummary.buildings),
    true
  );
  assert.equal(
    typeof result.atlasPreviewShowcaseSession.showcaseSummary.camera.profile,
    "string"
  );
  assert.equal(
    typeof result.atlasPreviewShowcaseSession.showcaseSummary.rendererStatus
      .compatibilityVerified,
    "boolean"
  );
});

test("Atlas Engine preview showcase session remains passive and exposes no live runtime handles", () => {
  const result =
    showcaseModule.validateAtlasEnginePreviewShowcaseSessionFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasPreviewShowcaseSession.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasPreviewShowcaseSession.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasPreviewShowcaseSession.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasPreviewShowcaseSession,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasPreviewShowcaseSession.rendererPreview,
      "realMapAttachment"
    ),
    false
  );
});
