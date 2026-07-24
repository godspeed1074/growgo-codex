import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-world-browser-showcase.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["ShowcaseMaterialA", "ShowcaseMaterialB"]
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

test("coastal starter world browser showcase creates a manual coastal showcase with five real GLB-backed assets", async () => {
  const showcase = await moduleUnderTest.createCoastalStarterWorldBrowserShowcase({
    existsSync() {
      return true;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    }
  });

  const result = moduleUnderTest.validateCoastalStarterWorldBrowserShowcase(showcase);

  assert.equal(result.ok, true);
  assert.equal(showcase.showcaseId, "COASTAL_STARTER_WORLD_BROWSER_SHOWCASE_001");
  assert.equal(showcase.sceneId, "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001");
  assert.equal(showcase.worldId, "COASTAL_STARTER_WORLD_001");
  assert.equal(showcase.assetInstances.length, 5);
  assert.equal(showcase.renderables.length, 5);
  assert.equal(showcase.displayState.currentState, "ready");
  assert.equal(showcase.verificationResult.realGlbBackedSceneValid, true);
});

test("coastal starter world browser showcase falls back safely when GLB loading is unavailable", async () => {
  const showcase = await moduleUnderTest.createCoastalStarterWorldBrowserShowcase({
    existsSync() {
      return false;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    },
    allowFallbackShowcase: true
  });

  assert.equal(showcase.verificationResult.realGlbBackedSceneValid, false);
  assert.equal(showcase.verificationResult.allFiveAssetsPresent, true);
  assert.equal(showcase.renderables.length, 5);
});
