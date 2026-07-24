import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const runtimeLoaderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-minimal-glb-runtime-loader.mjs"
  )
);
const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-mesh-visual-render-test.mjs"
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
  new Uint8Array(arrayBuffer, 20, paddedJsonLength).set(jsonBytes);
  return arrayBuffer;
}

async function buildRuntimeLoaderDefinition() {
  const definition =
    runtimeLoaderModule.groundCoastalGrassMinimalGlbRuntimeLoaderDefinition;
  const result = await runtimeLoaderModule.loadGroundCoastalGrassMinimalGlbRuntimeLoader(
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
  return result.glbRuntimeLoader.definition;
}

test("ground coastal grass mesh visual render test converts loaded GLB data for preview rendering", async () => {
  const runtimeLoaderDefinition = await buildRuntimeLoaderDefinition();
  const definition =
    moduleUnderTest.createGroundCoastalGrassRealGlbMeshVisualRenderTest(
      runtimeLoaderDefinition
    );

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbMeshVisualRenderTest(definition);

  assert.equal(result.ok, true);
  assert.equal(definition.geometryPayload.projectedVertices.length >= 3, true);
  assert.equal(definition.materialPayload.materialCount, 2);
  assert.equal(definition.verificationResult.actualGlbGeometryRendered, true);
});

test("ground coastal grass mesh visual render test rejects missing material mapping safely", async () => {
  const runtimeLoaderDefinition = await buildRuntimeLoaderDefinition();
  const definition =
    moduleUnderTest.createGroundCoastalGrassRealGlbMeshVisualRenderTest(
      runtimeLoaderDefinition
    );
  const invalidDefinition = {
    ...definition,
    materialPayload: {
      ...definition.materialPayload,
      materialNames: []
    },
    verificationResult: {
      ...definition.verificationResult,
      materialMappingValid: false
    }
  };

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbMeshVisualRenderTest(invalidDefinition);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "material_mapping_invalid");
});
