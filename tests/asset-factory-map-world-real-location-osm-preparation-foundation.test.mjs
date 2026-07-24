import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-real-location-osm-preparation-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["MapDataPreparationMaterialA", "MapDataPreparationMaterialB"]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [{ attributes: { POSITION: 0 }, material: 0 }]
      }
    ],
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

test("map world real location OSM preparation foundation creates a synthetic provider map-data package for the world resolver", async () => {
  const foundation =
    await moduleUnderTest.createMapWorldRealLocationOsmPreparationFoundation(
      moduleUnderTest.mapWorldRealLocationOsmPreparationFoundationDefinition,
      buildLoaderOptions()
    );

  const result =
    moduleUnderTest.validateMapWorldRealLocationOsmPreparationFoundation(foundation);

  assert.equal(result.ok, true);
  assert.match(foundation.mapDataId, /^MAP_DATA_INPUT_/);
  assert.equal(foundation.providerBoundary.currentProvider.providerKind, "synthetic_map_provider");
  assert.equal(foundation.providerBoundary.providerContract.futureOsmCompatibility, true);
  assert.equal(foundation.coordinate.latitude, foundation.worldResolver.worldLocationResolver.latitude);
  assert.equal(foundation.coordinate.longitude, foundation.worldResolver.worldLocationResolver.longitude);
  assert.ok(foundation.roads.length >= 1);
  assert.equal(foundation.validationResult.providerContractValid, true);
});

test("same preview coordinate and provider contract produce deterministic map-data output", async () => {
  const first =
    await moduleUnderTest.createMapWorldRealLocationOsmPreparationFoundation(
      moduleUnderTest.mapWorldRealLocationOsmPreparationFoundationDefinition,
      buildLoaderOptions()
    );
  const second =
    await moduleUnderTest.createMapWorldRealLocationOsmPreparationFoundation(
      moduleUnderTest.mapWorldRealLocationOsmPreparationFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(first.mapDataId, second.mapDataId);
  assert.deepEqual(first.coordinate, second.coordinate);
  assert.deepEqual(first.roads, second.roads);
  assert.equal(first.worldResolver.worldLocationResolver.worldId, second.worldResolver.worldLocationResolver.worldId);
});

test("map world real location OSM preparation foundation rejects an invalid provider contract safely", async () => {
  const foundation =
    await moduleUnderTest.createMapWorldRealLocationOsmPreparationFoundation(
      moduleUnderTest.mapWorldRealLocationOsmPreparationFoundationDefinition,
      buildLoaderOptions()
    );

  const invalid = {
    ...foundation,
    providerBoundary: {
      ...foundation.providerBoundary,
      currentProvider: {
        ...foundation.providerBoundary.currentProvider,
        liveNetworkAllowed: true
      }
    },
    validationResult: {
      ...foundation.validationResult,
      providerContractValid: false
    }
  };

  const result =
    moduleUnderTest.validateMapWorldRealLocationOsmPreparationFoundation(invalid);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "provider_contract_invalid");
});
