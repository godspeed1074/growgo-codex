import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-coastal-cottage-runtime-preview-binding.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["CoastalWall", "CoastalRoof", "CoastalTrim"]
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

test("building coastal cottage runtime preview binding loads the gameplay GLB into the existing real GLB pipeline shape", async () => {
  const definition =
    moduleUnderTest.buildingCoastalCottageRuntimePreviewBindingDefinition;
  const existingPaths = [
    definition.glbReference.glbPath,
    definition.glbReference.manifestReference,
    definition.glbReference.metadataReference,
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_MAP.glb",
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export/BUILDING_COASTAL_COTTAGE_001_LOD_DISTANT_SILHOUETTE.glb"
  ];
  const result =
    await moduleUnderTest.loadBuildingCoastalCottageRuntimePreviewBinding(
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
  assert.equal(
    result.runtimePreviewBinding.definition.validationResult.binaryParsed,
    true
  );
  assert.equal(
    result.runtimePreviewBinding.definition.validationResult.meshExtracted,
    true
  );
  assert.equal(
    result.runtimePreviewBinding.definition.validationResult.materialExtracted,
    true
  );
  assert.equal(result.runtimePreviewBinding.runtime.actualGlbMeshLoaded, true);
});

test("building coastal cottage runtime preview binding preserves fallback when the gameplay GLB is unavailable", async () => {
  const result =
    await moduleUnderTest.loadBuildingCoastalCottageRuntimePreviewBinding(
      moduleUnderTest.buildingCoastalCottageRuntimePreviewBindingDefinition,
      {
        existsSync: () => false,
        loadArrayBuffer() {
          return Promise.resolve(createSyntheticGlb());
        }
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.runtimePreviewBinding.runtime.actualGlbMeshLoaded, false);
  assert.equal(result.runtimePreviewBinding.runtime.usedFallback, true);
});
