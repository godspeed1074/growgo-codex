import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-minimal-glb-runtime-loader.mjs"
  )
);

function createSyntheticGlb({ materialNames = ["GrassBase", "GrassDetail"] } = {}) {
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
  const targetBytes = new Uint8Array(arrayBuffer, 20, paddedJsonLength);
  targetBytes.set(jsonBytes);
  return arrayBuffer;
}

test("ground coastal grass minimal runtime loader parses a gameplay GLB successfully", async () => {
  const definition =
    moduleUnderTest.groundCoastalGrassMinimalGlbRuntimeLoaderDefinition;
  const result = await moduleUnderTest.loadGroundCoastalGrassMinimalGlbRuntimeLoader(
    definition,
    {
      existsSync(candidatePath) {
        return candidatePath === definition.glbReference.glbPath;
      },
      loadArrayBuffer() {
        return Promise.resolve(createSyntheticGlb());
      }
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.glbRuntimeLoader.definition.loaderState.currentState, "verified");
  assert.equal(result.glbRuntimeLoader.definition.validationResult.binaryParsed, true);
  assert.equal(result.glbRuntimeLoader.definition.validationResult.meshExtracted, true);
  assert.equal(result.glbRuntimeLoader.definition.validationResult.materialExtracted, true);
  assert.equal(result.glbRuntimeLoader.definition.meshResult.meshCount, 1);
  assert.equal(result.glbRuntimeLoader.definition.materialResult.materialCount, 2);
  assert.equal(result.glbRuntimeLoader.runtime.actualGlbMeshLoaded, true);
});

test("ground coastal grass minimal runtime loader preserves fallback when gameplay GLB is unavailable", async () => {
  const definition =
    moduleUnderTest.groundCoastalGrassMinimalGlbRuntimeLoaderDefinition;
  let attemptedLoad = false;
  const result = await moduleUnderTest.loadGroundCoastalGrassMinimalGlbRuntimeLoader(
    definition,
    {
      existsSync: () => false,
      loadArrayBuffer() {
        attemptedLoad = true;
        return Promise.resolve(createSyntheticGlb());
      }
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.glbRuntimeLoader.runtime.actualGlbMeshLoaded, false);
  assert.equal(result.glbRuntimeLoader.runtime.usedFallback, true);
  assert.equal(attemptedLoad, false);
});

test("ground coastal grass minimal runtime loader rejects invalid GLB binary safely", async () => {
  const definition =
    moduleUnderTest.groundCoastalGrassMinimalGlbRuntimeLoaderDefinition;
  const invalidBinary = new ArrayBuffer(24);
  const result = await moduleUnderTest.loadGroundCoastalGrassMinimalGlbRuntimeLoader(
    definition,
    {
      existsSync(candidatePath) {
        return candidatePath === definition.glbReference.glbPath;
      },
      loadArrayBuffer() {
        return Promise.resolve(invalidBinary);
      }
    }
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_glb_binary");
});
