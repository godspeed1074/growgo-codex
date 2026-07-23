import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const combinedPreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "combined-world-preview-generator-foundation.mjs"
  )
);

test("combined world preview generator foundation validates a complete deterministic world preview", () => {
  const result =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.combinedWorldPreview.locationRequest.locationId,
    "MORNINGTON_PIER_COASTAL_001"
  );
  assert.equal(result.combinedWorldPreview.structureInstances.length, 4);
  assert.equal(result.combinedWorldPreview.environmentInstances.length, 7);
  assert.equal(result.combinedWorldPreview.rendererPayload.length, 11);
});

test("same location and world seed produce identical combined world previews", () => {
  const first =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation();
  const second =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation();
  const third =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation({
      ...combinedPreviewModule.combinedWorldPreviewGeneratorFoundationDefinition,
      locationRequest: {
        ...combinedPreviewModule.combinedWorldPreviewGeneratorFoundationDefinition.locationRequest,
        worldSeed: "growgo-coastal-alpha-seed-002"
      },
      worldSeed: "growgo-coastal-alpha-seed-002"
    });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, true);
  assert.deepEqual(first.combinedWorldPreview, second.combinedWorldPreview);
  assert.notDeepEqual(first.combinedWorldPreview, third.combinedWorldPreview);
});

test("combined world preview generator foundation rejects renderer ordering mismatches safely", () => {
  const invalid =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation({
      ...combinedPreviewModule.combinedWorldPreviewGeneratorFoundationDefinition,
      expectedRendererAssetIds: [
        "BUILDING_HOUSE_SMALL_COASTAL_001",
        ...combinedPreviewModule.combinedWorldPreviewGeneratorFoundationDefinition.expectedRendererAssetIds.slice(1)
      ]
    });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "renderer_asset_mismatch");
});

test("combined world preview generator foundation remains passive and creates no live world objects or external map connections", () => {
  const result =
    combinedPreviewModule.validateCombinedWorldPreviewGeneratorFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.combinedWorldPreview.compatibility.passiveOnly, true);
  assert.equal(result.combinedWorldPreview.compatibility.gpsConnected, false);
  assert.equal(
    result.combinedWorldPreview.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    result.combinedWorldPreview.compatibility.liveWorldObjectsCreated,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.combinedWorldPreview, "gpsHandle"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.combinedWorldPreview, "runtimeWorld"),
    false
  );
});
