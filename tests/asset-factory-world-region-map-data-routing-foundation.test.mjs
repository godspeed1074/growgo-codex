import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-region-map-data-routing-foundation.mjs"
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
const sceneRoutingModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-region-scene-routing-foundation.mjs"
  )
);
const mapDataAdapterModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-local-real-map-data-adapter-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["WorldRegionMapDataRoutingMaterialA", "WorldRegionMapDataRoutingMaterialB"]
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

test("world region map data routing keeps the coastal local fixture path unchanged", async () => {
  const routing = await moduleUnderTest.createWorldRegionMapDataRoutingFoundation(
    moduleUnderTest.worldRegionMapDataRoutingFoundationDefinition,
    buildLoaderOptions()
  );

  const validation =
    moduleUnderTest.validateWorldRegionMapDataRoutingFoundation(routing);

  assert.equal(validation.ok, true);
  assert.match(routing.mapDataRouteId, /^WORLD_REGION_MAP_DATA_ROUTE_/);
  assert.equal(routing.regionType, "coastal");
  assert.equal(routing.providerProfile.providerId, "LOCAL_FIXTURE_MAP_PROVIDER_001");
  assert.equal(
    routing.providerProfile.providerMode,
    "active-local-fixture-provider"
  );
  assert.equal(
    routing.mapFixtureProfile.fixtureSource,
    "active-coastal-local-map-fixture"
  );
  assert.equal(routing.validationResult.coastalMapPathUnchangedValid, true);
  assert.equal(routing.validationResult.providerCompatibilityValid, true);
  assert.equal(routing.validationResult.deterministicRoutingValid, true);
  assert.equal(routing.validationResult.safeFallbackValid, true);
});

test("world region map data routing remains deterministic for the same scene route and local provider", async () => {
  const first = await moduleUnderTest.createWorldRegionMapDataRoutingFoundation(
    moduleUnderTest.worldRegionMapDataRoutingFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createWorldRegionMapDataRoutingFoundation(
    moduleUnderTest.worldRegionMapDataRoutingFoundationDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.mapDataRouteId, second.mapDataRouteId);
  assert.equal(first.worldRegionId, second.worldRegionId);
  assert.deepEqual(first.providerProfile, second.providerProfile);
  assert.deepEqual(first.mapFixtureProfile, second.mapFixtureProfile);
});

test("world region map data routing falls back safely for planned non-coastal regions while reusing the coastal local provider", async () => {
  const coastalResolution =
    await resolutionModule.createWorldRegionResolutionFoundation(
      resolutionModule.worldRegionResolutionFoundationDefinition,
      buildLoaderOptions()
    );
  const localMapDataAdapter =
    await mapDataAdapterModule.createMapWorldLocalRealMapDataAdapterFoundation(
      mapDataAdapterModule.mapWorldLocalRealMapDataAdapterFoundationDefinition,
      buildLoaderOptions()
    );

  const urbanResolution = {
    ...coastalResolution,
    regionResolutionId: "WORLD_REGION_RESOLUTION_URBAN_001",
    worldRegionId: "URBAN_WORLD_EXPANSION_REGION_001",
    regionType: "urban",
    generationProfile: {
      ...coastalResolution.planningFoundation.worldExpansionRegistry.find(
        (region) => region.regionType === "urban"
      ).generationProfile
    },
    assetProfile: {
      ...coastalResolution.planningFoundation.worldExpansionRegistry.find(
        (region) => region.regionType === "urban"
      ).assetProfile
    },
    fallbackRegionType: "coastal"
  };

  const urbanSceneRoute = sceneRoutingModule.resolveSceneRouteForRegionResolution(
    urbanResolution
  );
  const routed = moduleUnderTest.resolveMapDataRouteForSceneRoute(
    urbanSceneRoute,
    localMapDataAdapter
  );

  assert.equal(routed.regionType, "urban");
  assert.equal(routed.providerProfile.fallbackActivated, true);
  assert.equal(routed.providerProfile.fallbackRegionType, "coastal");
  assert.equal(
    routed.mapFixtureProfile.fixtureSource,
    "planned-region-fallback-to-coastal-fixture"
  );
  assert.equal(
    routed.mapFixtureProfile.fallbackFixtureProfileId,
    "coastal_fixture_profile_001"
  );
  assert.equal(routed.providerProfile.providerId, localMapDataAdapter.providerId);
});
