import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-local-real-map-data-adapter-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["LocalRealMapDataMaterialA", "LocalRealMapDataMaterialB"]
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

test("local real map data adapter builds deterministic local fixture map-shaped data", async () => {
  const foundation = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
    buildLoaderOptions()
  );

  const result = moduleUnderTest.validateMapWorldLocalRealMapDataAdapterFoundation(
    foundation
  );

  assert.equal(result.ok, true);
  assert.equal(foundation.providerId, "LOCAL_FIXTURE_MAP_PROVIDER_001");
  assert.match(foundation.mapDataId, /^LOCAL_REAL_MAP_DATA_/);
  assert.equal(foundation.providerBoundary.providerKind, "local_fixture_map_provider");
  assert.equal(
    foundation.coordinate.latitude,
    foundation.worldResolver.worldLocationResolver.latitude
  );
  assert.equal(
    foundation.coordinate.longitude,
    foundation.worldResolver.worldLocationResolver.longitude
  );
  assert.equal(foundation.terrainHints.densityProfile, "suburban_coastal");
  assert.ok(foundation.roads.length >= 8);
  assert.ok(foundation.landAreas.length >= 5);
  assert.ok(foundation.buildingHints.length >= 12);
  assert.ok(foundation.vegetationHints.length >= 24);
  assert.ok(foundation.landmarkHints.length >= 1);
  assert.equal(foundation.validationResult.mapDataContractValid, true);
  assert.equal(foundation.validationResult.performanceSafeObjectCountsValid, true);
  assert.equal(foundation.validationResult.placementValidityPreserved, true);
  assert.equal(foundation.validationResult.assetReferenceValidityPreserved, true);
  assert.equal(foundation.worldResolver.settlement.residentialBlocks.length, 3);
  assert.equal(
    foundation.worldResolver.settlement.roadNetwork.roadSegments.length,
    foundation.roads.length
  );
  assert.equal(
    foundation.worldResolver.settlement.buildingPlacements.length,
    foundation.buildingHints.length
  );
  assert.equal(
    foundation.worldResolver.settlement.vegetationPlacements.length,
    foundation.vegetationHints.length
  );
  assert.ok(
    foundation.landAreas.some((area) => area.areaType === "coastline_boundary")
  );
  assert.ok(
    foundation.roads.some((road) => road.connectedIntersectionIds.length >= 1)
  );
});

test("same local map-shaped input resolves to the same world deterministically", async () => {
  const first = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.mapDataId, second.mapDataId);
  assert.deepEqual(first.coordinate, second.coordinate);
  assert.deepEqual(first.roads, second.roads);
  assert.deepEqual(first.landAreas, second.landAreas);
  assert.deepEqual(first.buildingHints, second.buildingHints);
  assert.deepEqual(first.vegetationHints, second.vegetationHints);
  assert.equal(
    first.worldResolver.worldLocationResolver.worldId,
    second.worldResolver.worldLocationResolver.worldId
  );
});

test("local real map data adapter rejects invalid provider contract safely", async () => {
  const foundation = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
    buildLoaderOptions()
  );

  const invalid = {
    ...foundation,
    validationResult: {
      ...foundation.validationResult,
      mapDataContractValid: false
    }
  };

  const result = moduleUnderTest.validateMapWorldLocalRealMapDataAdapterFoundation(
    invalid
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "map_data_contract_invalid");
});

test("density profiles scale the neighbourhood deterministically from sparse to town coastal", async () => {
  const sparse = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    {
      ...moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
      densityProfile: "sparse_coastal"
    },
    buildLoaderOptions()
  );
  const suburban = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    {
      ...moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
      densityProfile: "suburban_coastal"
    },
    buildLoaderOptions()
  );
  const town = await moduleUnderTest.createMapWorldLocalRealMapDataAdapterFoundation(
    {
      ...moduleUnderTest.mapWorldLocalRealMapDataAdapterFoundationDefinition,
      densityProfile: "town_coastal"
    },
    buildLoaderOptions()
  );

  assert.equal(sparse.terrainHints.densityProfile, "sparse_coastal");
  assert.equal(suburban.terrainHints.densityProfile, "suburban_coastal");
  assert.equal(town.terrainHints.densityProfile, "town_coastal");
  assert.ok(sparse.roads.length < suburban.roads.length);
  assert.ok(suburban.roads.length < town.roads.length);
  assert.ok(sparse.buildingHints.length < suburban.buildingHints.length);
  assert.ok(suburban.buildingHints.length < town.buildingHints.length);
  assert.ok(sparse.vegetationHints.length < suburban.vegetationHints.length);
  assert.ok(suburban.vegetationHints.length < town.vegetationHints.length);
  assert.equal(sparse.validationResult.performanceSafeObjectCountsValid, true);
  assert.equal(suburban.validationResult.performanceSafeObjectCountsValid, true);
  assert.equal(town.validationResult.performanceSafeObjectCountsValid, true);
});
