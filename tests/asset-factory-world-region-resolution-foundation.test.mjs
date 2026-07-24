import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-region-resolution-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["WorldRegionResolutionMaterialA", "WorldRegionResolutionMaterialB"]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: materialNames.map((name) => ({ name }))
  });
  const jsonBytes = new TextEncoder().encode(json);
  const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const totalLength = 12 + 8 + paddedJsonLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(arrayBuffer, 20, paddedJsonLength).set(jsonBytes);
  return arrayBuffer;
}

function buildLoaderOptions() {
  return {
    existsSync() {
      return true;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    },
    allowFallbackShowcase: true
  };
}

test("coordinates resolve to the matching coastal region profile through the world expansion registry", async () => {
  const resolution = await moduleUnderTest.createWorldRegionResolutionFoundation(
    moduleUnderTest.worldRegionResolutionFoundationDefinition,
    buildLoaderOptions()
  );

  const validation =
    moduleUnderTest.validateWorldRegionResolutionFoundation(resolution);

  assert.equal(validation.ok, true);
  assert.match(resolution.regionResolutionId, /^WORLD_REGION_RESOLUTION_/);
  assert.equal(resolution.regionType, "coastal");
  assert.equal(
    resolution.generationProfile.generationProfileId,
    "coastal_first_location_generation_profile_001"
  );
  assert.equal(
    resolution.assetProfile.assetProfileId,
    "coastal_first_location_asset_profile_001"
  );
  assert.equal(resolution.validationResult.coordinateResolutionValid, true);
  assert.equal(resolution.validationResult.profileSelectionValid, true);
  assert.equal(resolution.validationResult.deterministicRegionResultValid, true);
  assert.equal(resolution.validationResult.fallbackBehaviorValid, true);
  assert.equal(resolution.validationResult.coastalFirstLocationUnchangedValid, true);
  assert.equal(resolution.validationResult.existingScenePipelineValid, true);
});

test("region resolution remains deterministic for the same coordinate and preserves the coastal pipeline", async () => {
  const first = await moduleUnderTest.createWorldRegionResolutionFoundation(
    moduleUnderTest.worldRegionResolutionFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createWorldRegionResolutionFoundation(
    moduleUnderTest.worldRegionResolutionFoundationDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.regionResolutionId, second.regionResolutionId);
  assert.equal(first.worldRegionId, second.worldRegionId);
  assert.equal(
    first.planningFoundation.regionGenerationPipeline.worldLocation.worldId,
    second.planningFoundation.regionGenerationPipeline.worldLocation.worldId
  );
  assert.equal(
    first.planningFoundation.regionGenerationPipeline.sceneAssembly.sceneId,
    second.planningFoundation.regionGenerationPipeline.sceneAssembly.sceneId
  );
});

test("region resolution falls back safely to coastal when a coordinate does not match future planned region bounds", () => {
  const registry = [
    {
      worldRegionId: "COASTAL_WORLD_EXPANSION_REGION_001",
      regionType: "coastal",
      bounds: {
        minLatitude: -38.2225,
        minLongitude: 145.0325,
        maxLatitude: -38.2153,
        maxLongitude: 145.0445
      },
      generationProfile: {
        generationProfileId: "coastal_first_location_generation_profile_001"
      },
      assetProfile: {
        assetProfileId: "coastal_first_location_asset_profile_001"
      },
      validationResult: {
        deterministicRegionOutput: true,
        profileCompatibility: true,
        cleanupValid: true
      }
    },
    {
      worldRegionId: "SUBURBAN_WORLD_EXPANSION_REGION_001",
      regionType: "suburban",
      bounds: {
        minLatitude: null,
        minLongitude: null,
        maxLatitude: null,
        maxLongitude: null
      },
      generationProfile: {
        generationProfileId: "suburban_growth_profile_001"
      },
      assetProfile: {
        assetProfileId: "suburban_existing_asset_profile_001"
      },
      validationResult: {
        deterministicRegionOutput: true,
        profileCompatibility: true,
        cleanupValid: true
      }
    }
  ];

  const resolved = moduleUnderTest.resolveRegionProfileForCoordinate(
    { latitude: -37.9, longitude: 145.9 },
    registry
  );

  assert.equal(resolved.regionType, "coastal");
  assert.equal(
    resolved.generationProfile.generationProfileId,
    "coastal_first_location_generation_profile_001"
  );
});
