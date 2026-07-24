import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const runtimeBindingModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-runtime-preview-binding.mjs"
  )
);
const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-real-glb-mesh-visual-render-test.mjs"
  )
);

function createSyntheticGlb({ materialNames = ["Bark", "Leaves"] } = {}) {
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

async function buildRuntimeDefinition() {
  const definition = runtimeBindingModule.treeEucalyptusRuntimePreviewBindingDefinition;
  const existingPaths = [
    definition.glbReference.glbPath,
    definition.glbReference.manifestReference,
    definition.glbReference.metadataReference,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_MAP.glb",
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb"
  ];

  const result = await runtimeBindingModule.loadTreeEucalyptusRuntimePreviewBinding(
    definition,
    {
      existsSync(candidatePath) {
        return existingPaths.includes(candidatePath);
      },
      loadArrayBuffer() {
        return Promise.resolve(createSyntheticGlb());
      }
    }
  );
  assert.equal(result.ok, true);
  return result.runtimePreviewBinding.definition;
}

test("tree eucalyptus mesh visual render test reuses the existing preview renderer input shape", async () => {
  const runtimeDefinition = await buildRuntimeDefinition();
  const definition =
    moduleUnderTest.createTreeEucalyptusRealGlbMeshVisualRenderTest(runtimeDefinition);
  const result =
    moduleUnderTest.validateTreeEucalyptusRealGlbMeshVisualRenderTest(definition);

  assert.equal(result.ok, true);
  assert.equal(definition.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(definition.verificationResult.actualGlbGeometryRendered, true);
  assert.equal(definition.materialPayload.materialCount, 2);
});

test("tree eucalyptus mesh visual render test rejects missing material mapping safely", async () => {
  const runtimeDefinition = await buildRuntimeDefinition();
  const definition =
    moduleUnderTest.createTreeEucalyptusRealGlbMeshVisualRenderTest(runtimeDefinition);
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
    moduleUnderTest.validateTreeEucalyptusRealGlbMeshVisualRenderTest(invalidDefinition);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "material_mapping_invalid");
});
