import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { Buffer } from "node:buffer";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-v002-production-verify.mjs"
  )
);

function createMinimalGlb({ meshCount = 1, materialCount = 1, triangleCount = 12 } = {}) {
  const accessors = [
    {
      bufferView: 0,
      componentType: 5123,
      count: triangleCount * 3,
      type: "SCALAR"
    }
  ];
  const meshes = [];
  const nodes = [];
  for (let index = 0; index < meshCount; index += 1) {
    meshes.push({
      name: `MESH_${index}`,
      primitives: [{ indices: 0, mode: 4 }]
    });
    nodes.push({ name: `NODE_${index}`, mesh: index });
  }
  const materials = [];
  for (let index = 0; index < materialCount; index += 1) {
    materials.push({ name: `MAT_${index}` });
  }
  let jsonChunk = Buffer.from(
    JSON.stringify({
      asset: { version: "2.0", generator: "growgo-test" },
      scene: 0,
      scenes: [{ nodes: nodes.map((_, index) => index) }],
      nodes,
      meshes,
      materials,
      accessors,
      buffers: [{ byteLength: 0 }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 0 }]
    }),
    "utf8"
  );
  const jsonPadding = (4 - (jsonChunk.length % 4)) % 4;
  jsonChunk = Buffer.concat([jsonChunk, Buffer.alloc(jsonPadding, 0x20)]);
  const header = Buffer.alloc(12);
  header.write("glTF", 0, "utf8");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.write("JSON", 4, "utf8");
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(0, 0);
  binHeader.write("BIN\u0000", 4, "binary");
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader]);
}

function seedWorkspace(tempRoot) {
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v001.blend"),
    Buffer.from("TREE_EUCALYPTUS_001_v001_blend", "utf8")
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 7, materialCount: 5, triangleCount: 153 })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-eucalyptus-metadata.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      identityContractV2: { version: "v001" }
    })
  );

  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v002.blend"),
    Buffer.from("TREE_EUCALYPTUS_001_v002_blend_changed", "utf8")
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v002_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 11, materialCount: 5, triangleCount: 360 })
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 8, materialCount: 5, triangleCount: 204 })
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v002_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 5, materialCount: 3, triangleCount: 90 })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-eucalyptus-v002-metadata.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      previousRegisteredVersion: "v001",
      targetRevisionVersion: "v002",
      identityContractV2: { version: "v002" }
    })
  );
  return outputDir;
}

test("tree eucalyptus v002 verification preserves identity and versioned geometry change", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-tree-eucalyptus-v002-")
  );
  seedWorkspace(tempRoot);

  const verification = moduleUnderTest.verifyTreeEucalyptusV002({ cwd: tempRoot });

  assert.equal(verification.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(verification.targetVersion, "v002");
  assert.equal(verification.readyForOperatorReview, true);
  assert.equal(
    verification.comparisons.find((entry) => entry.name === "blend_geometry_hash_changed").ok,
    true
  );
  assert.equal(
    verification.comparisons.find((entry) => entry.name === "version_change_recorded").ok,
    true
  );
});
