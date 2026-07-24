import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-region-scene-routing-foundation.mjs"
  )
);
const resolutionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-region-resolution-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["WorldRegionSceneRoutingMaterialA", "WorldRegionSceneRoutingMaterialB"]
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

test("world region scene routing keeps the coastal scene route unchanged through the existing generation pipeline", async () => {
  const routing = await moduleUnderTest.createWorldRegionSceneRoutingFoundation(
    moduleUnderTest.worldRegionSceneRoutingFoundationDefinition,
    buildLoaderOptions()
  );

  const validation =
    moduleUnderTest.validateWorldRegionSceneRoutingFoundation(routing);

  assert.equal(validation.ok, true);
  assert.match(routing.sceneRouteId, /^WORLD_REGION_SCENE_ROUTE_/);
  assert.equal(routing.regionType, "coastal");
  assert.equal(
    routing.sceneProfile.sceneAssemblyId,
    "map-world-settlement-atlas-scene-expansion"
  );
  assert.equal(
    routing.settlementProfile.generatorId,
    "coastal-settlement-generator-foundation"
  );
  assert.equal(routing.sceneProfile.fallbackActivated, false);
  assert.equal(routing.validationResult.coastalRouteUnchangedValid, true);
  assert.equal(routing.validationResult.unsupportedRegionsFallbackSafelyValid, true);
  assert.equal(routing.validationResult.deterministicSceneRoutingValid, true);
  assert.equal(routing.validationResult.assetCompatibilityValid, true);
});

test("world region scene routing remains deterministic for the same coordinate and region resolution", async () => {
  const first = await moduleUnderTest.createWorldRegionSceneRoutingFoundation(
    moduleUnderTest.worldRegionSceneRoutingFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createWorldRegionSceneRoutingFoundation(
    moduleUnderTest.worldRegionSceneRoutingFoundationDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.sceneRouteId, second.sceneRouteId);
  assert.equal(first.worldRegionId, second.worldRegionId);
  assert.deepEqual(first.sceneProfile, second.sceneProfile);
  assert.deepEqual(first.settlementProfile, second.settlementProfile);
});

test("world region scene routing falls back safely for planned non-coastal regions without generating new content", async () => {
  const coastalResolution =
    await resolutionModule.createWorldRegionResolutionFoundation(
      resolutionModule.worldRegionResolutionFoundationDefinition,
      buildLoaderOptions()
    );

  const suburbanResolution = {
    ...coastalResolution,
    regionResolutionId: "WORLD_REGION_RESOLUTION_SUBURBAN_001",
    worldRegionId: "SUBURBAN_WORLD_EXPANSION_REGION_001",
    regionType: "suburban",
    generationProfile: {
      ...coastalResolution.planningFoundation.worldExpansionRegistry.find(
        (region) => region.regionType === "suburban"
      ).generationProfile
    },
    assetProfile: {
      ...coastalResolution.planningFoundation.worldExpansionRegistry.find(
        (region) => region.regionType === "suburban"
      ).assetProfile
    },
    fallbackRegionType: "coastal"
  };

  const routed = moduleUnderTest.resolveSceneRouteForRegionResolution(
    suburbanResolution
  );

  assert.equal(routed.regionType, "suburban");
  assert.equal(routed.sceneProfile.fallbackActivated, true);
  assert.equal(routed.sceneProfile.fallbackRegionType, "coastal");
  assert.equal(routed.settlementProfile.fallbackActivated, true);
  assert.equal(
    routed.sceneProfile.sceneId,
    coastalResolution.planningFoundation.regionGenerationPipeline.sceneAssembly.sceneId
  );
});
