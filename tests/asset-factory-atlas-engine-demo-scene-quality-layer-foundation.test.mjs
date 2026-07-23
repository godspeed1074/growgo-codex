import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const qualityLayerModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-demo-scene-quality-layer-foundation.mjs"
  )
);

test("Atlas Engine demo scene quality layer foundation validates a deterministic passive quality profile for the demo scene", () => {
  const result =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasDemoSceneQualityLayer.worldQualityProfile.worldQualityProfileId,
    "WORLD_QUALITY_PROFILE_COASTAL_001"
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.structureCount,
    4
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.environmentCount,
    7
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.paths.count,
    2
  );
});

test("same location and seed produce identical deterministic Atlas quality output", () => {
  const first =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation();
  const second =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.atlasDemoSceneQualityLayer, second.atlasDemoSceneQualityLayer);
});

test("Atlas Engine demo scene quality layer rejects mismatched quality profiles safely", () => {
  const invalid =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation({
      ...qualityLayerModule.atlasEngineDemoSceneQualityLayerFoundationDefinition,
      qualityProfileId: "WORLD_QUALITY_PROFILE_URBAN_001"
    });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "quality_profile_mismatch");
});

test("Atlas Engine demo scene quality layer improves the summary with landmarks, buildings, vegetation, paths, and world quality profile", () => {
  const result =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation();

  assert.equal(result.ok, true);
  assert.deepEqual(
    Object.keys(result.atlasDemoSceneQualityLayer.demoSceneQualitySummary),
    [
      "location",
      "biome",
      "landmarks",
      "buildings",
      "vegetation",
      "paths",
      "worldQualityProfile",
      "compositionRules",
      "structureCount",
      "environmentCount",
      "rendererVerification"
    ]
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.buildings.count,
    1
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.vegetation.count,
    4
  );
  assert.equal(
    result.atlasDemoSceneQualityLayer.demoSceneQualitySummary.landmarks.count,
    0
  );
});

test("Atlas Engine demo scene quality layer remains passive and exposes no live runtime handles", () => {
  const result =
    qualityLayerModule.validateAtlasEngineDemoSceneQualityLayerFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.atlasDemoSceneQualityLayer.compatibility.passiveOnly, true);
  assert.equal(result.atlasDemoSceneQualityLayer.compatibility.gpsConnected, false);
  assert.equal(
    result.atlasDemoSceneQualityLayer.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasDemoSceneQualityLayer,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasDemoSceneQualityLayer.demoSceneQualitySummary,
      "realMapAttachment"
    ),
    false
  );
});
