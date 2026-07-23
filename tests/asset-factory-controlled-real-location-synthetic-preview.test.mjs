import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "controlled-real-location-synthetic-preview.mjs"
  )
);

test("controlled real location synthetic preview validates a passive deterministic preview world", () => {
  const result =
    previewModule.validateControlledRealLocationSyntheticPreview();

  assert.equal(result.ok, true);
  assert.equal(
    result.previewWorld.locationRequest.locationId,
    "MORNINGTON_PIER_COASTAL_001"
  );
  assert.equal(result.previewWorld.generatedInstances.length, 4);
  assert.equal(result.previewWorld.rendererPreviewPayload.length, 4);
  assert.deepEqual(
    result.previewWorld.generatedInstances.map((entry) => entry.assetId),
    [
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001",
      "ROCK_COASTAL_001"
    ]
  );
});

test("same real location request and world seed produce the same deterministic synthetic preview", () => {
  const first = previewModule.createControlledRealLocationSyntheticPreview();
  const second = previewModule.createControlledRealLocationSyntheticPreview();
  const third = previewModule.createControlledRealLocationSyntheticPreview({
    ...previewModule.controlledRealLocationSyntheticPreviewDefinition,
    locationRequest: {
      ...previewModule.controlledRealLocationSyntheticPreviewDefinition.locationRequest,
      worldSeed: "growgo-coastal-alpha-seed-002"
    }
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, true);
  assert.equal(first.previewWorld.previewId, second.previewWorld.previewId);
  assert.notEqual(first.previewWorld.previewId, third.previewWorld.previewId);
  assert.deepEqual(
    first.previewWorld.rendererPreviewPayload,
    second.previewWorld.rendererPreviewPayload
  );
});

test("controlled real location synthetic preview rejects unexpected generated asset ordering safely", () => {
  const invalid =
    previewModule.validateControlledRealLocationSyntheticPreview({
      ...previewModule.controlledRealLocationSyntheticPreviewDefinition,
      expectedGeneratedAssetIds: [
        "ROAD_STRAIGHT_SMALL_001",
        "BUILDING_HOUSE_SMALL_COASTAL_001",
        "TREE_EUCALYPTUS_001",
        "ROCK_COASTAL_001"
      ]
    });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "generated_asset_mismatch");
});

test("controlled real location synthetic preview remains passive and creates no live player world, GPS connection, or renderer runtime", () => {
  const result =
    previewModule.validateControlledRealLocationSyntheticPreview();

  assert.equal(result.ok, true);
  assert.equal(result.previewWorld.validation.locationAccepted, true);
  assert.equal(result.previewWorld.compatibility.passiveOnly, true);
  assert.equal(result.previewWorld.compatibility.gpsConnected, false);
  assert.equal(
    result.previewWorld.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    result.previewWorld.compatibility.livePlayerWorldCreated,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.previewWorld, "gpsHandle"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.previewWorld, "runtimeWorld"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.previewWorld.rendererPreviewPayload[0],
      "mesh"
    ),
    false
  );
});
