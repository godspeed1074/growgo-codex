import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const demonstrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-synthetic-world-preview-demonstration-foundation.mjs"
  )
);

test("Atlas Engine synthetic world preview demonstration foundation validates a complete passive preview pipeline", () => {
  const result =
    demonstrationModule.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.locationRequest.locationId,
    "MORNINGTON_PIER_COASTAL_001"
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.demoState.currentState,
    "preview_ready"
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.demoOutputSummary.structureCount,
    4
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.demoOutputSummary.environmentCount,
    7
  );
});

test("Atlas Engine synthetic world preview demonstration session progresses through the approved passive states", () => {
  const sessionResult =
    demonstrationModule.createAtlasEngineSyntheticWorldPreviewDemonstrationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.demoSession.currentDemoState(), "created");

  const generated = sessionResult.demoSession.generateDemo();
  const prepared = sessionResult.demoSession.prepareDemo();
  const previewReady = sessionResult.demoSession.markPreviewReady();
  const completed = sessionResult.demoSession.completeDemo();

  assert.equal(generated.ok, true);
  assert.equal(generated.demoState, "generated");
  assert.equal(prepared.ok, true);
  assert.equal(prepared.demoState, "prepared");
  assert.equal(previewReady.ok, true);
  assert.equal(previewReady.demoState, "preview_ready");
  assert.equal(completed.ok, true);
  assert.equal(completed.demoState, "completed");
  assert.equal(completed.affectedLiveRuntime, false);
});

test("same location and seed produce identical Atlas demo output", () => {
  const first =
    demonstrationModule.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation();
  const second =
    demonstrationModule.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasSyntheticWorldPreviewDemonstration,
    second.atlasSyntheticWorldPreviewDemonstration
  );
});

test("Atlas Engine synthetic world preview demonstration rejects mismatched renderer counts safely", () => {
  const invalid =
    demonstrationModule.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation(
      {
        ...demonstrationModule.atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
        expectedRendererPayloadCount: 10
      }
    );

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "renderer_payload_count_mismatch");
});

test("Atlas Engine synthetic world preview demonstration remains passive and exposes no live world runtime handles", () => {
  const result =
    demonstrationModule.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.compatibility.passiveOnly,
    true
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasSyntheticWorldPreviewDemonstration.compatibility
      .externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasSyntheticWorldPreviewDemonstration,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasSyntheticWorldPreviewDemonstration.rendererPreview,
      "realMapAttachment"
    ),
    false
  );
});
