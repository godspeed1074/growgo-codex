import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-coordinate-world-resolver-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["WorldResolverMaterialA", "WorldResolverMaterialB"]
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
    }
  };
}

test("map coordinate world resolver foundation connects a real coordinate to the coastal settlement generator and scene package", async () => {
  const resolver = await moduleUnderTest.createMapCoordinateWorldResolverFoundation(
    moduleUnderTest.mapCoordinateWorldResolverFoundationDefinition,
    buildLoaderOptions()
  );

  const result = moduleUnderTest.validateMapCoordinateWorldResolverFoundation(
    resolver
  );

  assert.equal(result.ok, true);
  assert.equal(
    resolver.worldLocationResolver.latitude,
    -38.2189
  );
  assert.equal(
    resolver.worldLocationResolver.longitude,
    145.0385
  );
  assert.equal(resolver.worldLocationResolver.terrainType, "coastal_grassland");
  assert.equal(resolver.settlement.settlementSummary.residentialLotCount, 4);
  assert.equal(resolver.scenePackage.sceneId, "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001");
  assert.equal(resolver.validationResult.sameCoordinateSameWorld, true);
  assert.equal(resolver.validationResult.sameSeedSameSettlement, true);
  assert.equal(resolver.validationResult.assetReferencesRemainValid, true);
});

test("same coordinate resolves to the same world and the same seed preserves settlement identity", async () => {
  const first = await moduleUnderTest.createMapCoordinateWorldResolverFoundation(
    moduleUnderTest.mapCoordinateWorldResolverFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createMapCoordinateWorldResolverFoundation(
    moduleUnderTest.mapCoordinateWorldResolverFoundationDefinition,
    buildLoaderOptions()
  );
  const third = await moduleUnderTest.createMapCoordinateWorldResolverFoundation(
    {
      ...moduleUnderTest.mapCoordinateWorldResolverFoundationDefinition,
      seed: "growgo-coastal-map-world-seed-002"
    },
    buildLoaderOptions()
  );

  assert.equal(first.worldLocationResolver.worldId, second.worldLocationResolver.worldId);
  assert.equal(first.worldLocationResolver.worldId, third.worldLocationResolver.worldId);
  assert.equal(first.settlement.settlementSummary.settlementId, second.settlement.settlementSummary.settlementId);
  assert.notEqual(first.settlement.settlementSummary.settlementId, third.settlement.settlementSummary.settlementId);
});

test("map coordinate world resolver foundation rejects invalid coordinates safely", async () => {
  const invalid = await (async () => {
    const result = moduleUnderTest.validateMapCoordinateWorldResolverFoundation({
      worldLocationResolver: {
        ...moduleUnderTest.mapCoordinateWorldResolverFoundationDefinition,
        latitude: -91
      },
      settlement: {},
      scenePackage: {},
      validationResult: {
        sameCoordinateSameWorld: false,
        sameSeedSameSettlement: false,
        assetReferencesRemainValid: false
      },
      worldSummary: {}
    });
    return result;
  })();

  assert.equal(invalid.ok, false);
  assert.equal(invalid.errorCode, "invalid_latitude");
});
