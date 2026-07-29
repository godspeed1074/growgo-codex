import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Buffer } from "node:buffer";

const diagnosticModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-glb-identity-diagnostic.mjs"
  )
);

function createMinimalGlb({
  sceneName = "Scene",
  nodeEntries = [],
  meshEntries = [],
  materialEntries = [],
  assetExtras = null,
  sceneExtras = null
} = {}) {
  const accessors = [
    {
      bufferView: 0,
      componentType: 5123,
      count: 18,
      type: "SCALAR"
    }
  ];
  const meshes = meshEntries.map((entry) => ({
    name: entry.name,
    primitives: [{ indices: 0, mode: 4 }],
    ...(entry.extras ? { extras: entry.extras } : {})
  }));
  const nodes = nodeEntries.map((entry, index) => ({
    name: entry.name,
    mesh: Math.min(index, Math.max(meshes.length - 1, 0)),
    ...(entry.extras ? { extras: entry.extras } : {})
  }));
  const materials = materialEntries.map((entry) => ({
    name: entry.name,
    ...(entry.extras ? { extras: entry.extras } : {})
  }));

  const document = {
    asset: {
      version: "2.0",
      generator: "growgo-test",
      ...(assetExtras ? { extras: assetExtras } : {})
    },
    scene: 0,
    scenes: [
      {
        name: sceneName,
        nodes: nodes.map((_, index) => index),
        ...(sceneExtras ? { extras: sceneExtras } : {})
      }
    ],
    nodes,
    meshes,
    materials,
    accessors,
    buffers: [{ byteLength: 0 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 0 }]
  };

  let jsonChunk = Buffer.from(JSON.stringify(document), "utf8");
  const jsonPadding = (4 - (jsonChunk.length % 4)) % 4;
  jsonChunk = Buffer.concat([jsonChunk, Buffer.alloc(jsonPadding, 0x20)]);
  const binChunk = Buffer.alloc(0);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.write("glTF", 0, "utf8");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.write("JSON", 4, "utf8");
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.write("BIN\u0000", 4, "binary");
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

function writeFixtureGlb(buffer, filename) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-tree-glb-diag-"));
  const absolutePath = path.join(tempDir, filename);
  fs.writeFileSync(absolutePath, buffer);
  return absolutePath;
}

test("diagnostic proves a GLB without anchor or extras preserved no eucalyptus identity", () => {
  const filename = writeFixtureGlb(
    createMinimalGlb({
      sceneName: "Scene",
      nodeEntries: [
        { name: "TREE_TRUNK_EUCALYPTUS_001_LOD0_EXPORT" },
        { name: "TREE_CANOPY_EUCALYPTUS_001_LOD0_EXPORT" }
      ],
      meshEntries: [{ name: "Cylinder.001" }, { name: "Icosphere.001" }],
      materialEntries: [{ name: "MAT_EUCALYPTUS_BARK_001" }]
    }),
    "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"
  );

  const inspection = diagnosticModule.inspectTreeEucalyptusGlbIdentity(filename);

  assert.equal(inspection.conclusions.identityAnchorMeshExistsInGlb, false);
  assert.equal(inspection.conclusions.identityAnchorNodeExistsInGlb, false);
  assert.equal(inspection.conclusions.gltfExtrasPresent, false);
  assert.equal(inspection.conclusions.exactAssetIdStringPresent, false);
  assert.equal(inspection.validatorInspection.assetIdentityPreserved, false);
  assert.equal(inspection.validatorInspection.metadataIdentityHits.length, 0);
  assert.equal(inspection.validatorInspection.anchorIdentityHits.length, 0);
});

test("diagnostic proves validator reads node extras and anchor names when exported", () => {
  const filename = writeFixtureGlb(
    createMinimalGlb({
      sceneName: "TREE_EUCALYPTUS_001_SCENE",
      assetExtras: {
        assetId: "TREE_EUCALYPTUS_001",
        recipeId: "TREE_EUCALYPTUS_RECIPE_001",
        paletteId: "AU_NATIVE_GREEN_001",
        lodProfile: "NATURE_STANDARD_001"
      },
      nodeEntries: [
        {
          name: "TREE_EUCALYPTUS_001_LOD_CLOSE_IDENTITY_ANCHOR",
          extras: {
            assetId: "TREE_EUCALYPTUS_001",
            recipeId: "TREE_EUCALYPTUS_RECIPE_001",
            paletteId: "AU_NATIVE_GREEN_001",
            lodProfile: "NATURE_STANDARD_001",
            componentRole: "IDENTITY_ANCHOR"
          }
        },
        {
          name: "TREE_EUCALYPTUS_001_TRUNK",
          extras: {
            assetId: "TREE_EUCALYPTUS_001"
          }
        }
      ],
      meshEntries: [
        { name: "TREE_EUCALYPTUS_001_LOD_CLOSE_IDENTITY_ANCHOR_MESH" },
        { name: "TREE_EUCALYPTUS_001_TRUNK_MESH" }
      ],
      materialEntries: [
        {
          name: "TREE_EUCALYPTUS_001_MATERIAL_LEAF",
          extras: {
            assetId: "TREE_EUCALYPTUS_001",
            dependencyId: "MOD_TREE_LEAF_CLUSTER_001"
          }
        }
      ]
    }),
    "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"
  );

  const inspection = diagnosticModule.inspectTreeEucalyptusGlbIdentity(filename);

  assert.equal(inspection.conclusions.identityAnchorNodeExistsInGlb, true);
  assert.equal(inspection.conclusions.identityAnchorMeshExistsInGlb, true);
  assert.equal(inspection.conclusions.gltfExtrasPresent, true);
  assert.equal(inspection.conclusions.exactAssetIdStringPresent, true);
  assert.equal(inspection.validatorInspection.assetIdentityPreserved, true);
  assert.equal(inspection.validatorInspection.anchorIdentityPreserved, true);
  assert.equal(inspection.validatorInspection.exportedIdentitySource, "metadata");
  assert.match(
    inspection.validatorInspection.metadataIdentityHits.join("\n"),
    /TREE_EUCALYPTUS_001/
  );
});

