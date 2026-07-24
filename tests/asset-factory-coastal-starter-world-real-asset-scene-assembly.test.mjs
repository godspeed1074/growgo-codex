import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-world-real-asset-scene-assembly.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["SharedMaterialA", "SharedMaterialB"]
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

test("coastal starter world real asset scene assembly composes the five coastal assets into a deterministic real GLB-backed showcase scene", async () => {
  const scene = await moduleUnderTest.createCoastalStarterWorldRealAssetSceneAssembly(
    {
      existsSync() {
        return true;
      },
      loadArrayBuffer() {
        return Promise.resolve(createSyntheticGlb());
      }
    }
  );

  const result =
    moduleUnderTest.validateCoastalStarterWorldRealAssetSceneAssembly(scene);

  assert.equal(result.ok, true);
  assert.equal(scene.sceneId, "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001");
  assert.equal(scene.worldId, "COASTAL_STARTER_WORLD_001");
  assert.deepEqual(
    scene.assetInstances.map((assetInstance) => assetInstance.assetId),
    [
      "GROUND_COASTAL_GRASS_001",
      "TREE_EUCALYPTUS_001",
      "ROAD_COASTAL_001",
      "BUILDING_COASTAL_COTTAGE_001",
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ]
  );
  assert.equal(scene.placements.length, 5);
  assert.equal(
    scene.placements.find((placement) => placement.assetId === "BUILDING_COASTAL_COTTAGE_001")
      ?.facingMode,
    "road-facing"
  );
  assert.equal(scene.cameraProfile.focusAssetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(scene.cameraProfile.orientation, "north-up");
  assert.deepEqual(scene.lightingProfile.supportedProfiles, ["day", "sunset", "night"]);
  assert.equal(scene.validationResult.realGlbBackedAssetsValid, true);
});

test("coastal starter world real asset scene assembly rejects invalid GLB-backed validation safely", async () => {
  const scene = await moduleUnderTest.createCoastalStarterWorldRealAssetSceneAssembly(
    {
      existsSync() {
        return true;
      },
      loadArrayBuffer() {
        return Promise.resolve(createSyntheticGlb());
      }
    }
  );

  const invalidScene = {
    ...scene,
    validationResult: {
      ...scene.validationResult,
      realGlbBackedAssetsValid: false
    }
  };

  const result =
    moduleUnderTest.validateCoastalStarterWorldRealAssetSceneAssembly(invalidScene);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "real_glb_backing_invalid");
});
