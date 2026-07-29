import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { Buffer } from "node:buffer";

const productionRunModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-bottlebrush-production-run.mjs"
  )
);

function createMinimalGlb({
  assetId = "TREE_BOTTLEBRUSH_001",
  recipeId = "TREE_BOTTLEBRUSH_RECIPE_001",
  paletteId = "AU_BOTTLEBRUSH_NATIVE_001",
  lodProfile = "NATURE_STANDARD_001",
  dependencyIds = [
    "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
    "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
    "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_GROUND_SOCKET_001"
  ],
  meshCount = 1,
  materialCount = 1,
  triangleCount = 12,
  lodSuffix = "LOD_CLOSE",
  includeAssetIdentity = true,
  includeMetadataIdentity = true,
  includeDependencyIdentity = true
} = {}) {
  const accessors = [
    {
      bufferView: 0,
      componentType: 5123,
      count: triangleCount * 3,
      type: "SCALAR"
    }
  ];
  const anchorName = `${assetId}_${lodSuffix}_IDENTITY_ANCHOR`;
  const rootName = `${assetId}_${lodSuffix}_ROOT`;
  const nodes = [
    {
      name: includeAssetIdentity ? anchorName : `BROKEN_${lodSuffix}_ANCHOR`,
      mesh: 0,
      extras: includeMetadataIdentity
        ? {
            assetId,
            recipeId,
            paletteId,
            lodProfile,
            dependencies: includeDependencyIdentity ? dependencyIds : []
          }
        : undefined
    },
    { name: includeAssetIdentity ? rootName : `BROKEN_${lodSuffix}_ROOT`, mesh: 1 }
  ];
  const meshes = [
    {
      name: includeAssetIdentity
        ? `${assetId}_${lodSuffix}_IDENTITY_ANCHOR_MESH`
        : `${lodSuffix}_IDENTITY_ANCHOR_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    },
    {
      name: includeAssetIdentity
        ? `${assetId}_${lodSuffix}_TRUNK_MESH`
        : `${lodSuffix}_TRUNK_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    }
  ];

  for (let index = 2; index < meshCount; index += 1) {
    nodes.push({
      name: includeAssetIdentity
        ? `${assetId}_CANOPY_${index}_${lodSuffix}`
        : `CANOPY_${index}_${lodSuffix}`,
      mesh: index
    });
    meshes.push({
      name: includeAssetIdentity
        ? `${assetId}_CANOPY_${index}_${lodSuffix}_MESH`
        : `CANOPY_${index}_${lodSuffix}_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    });
  }

  const materials = [];
  for (let index = 0; index < materialCount; index += 1) {
    materials.push({
      name: includeAssetIdentity
        ? `${assetId}_MATERIAL_${index}`
        : `MATERIAL_${index}`,
      extras: includeMetadataIdentity
        ? {
            paletteId,
            recipeId,
            dependencyId:
              includeDependencyIdentity && dependencyIds[index % dependencyIds.length]
                ? dependencyIds[index % dependencyIds.length]
                : undefined
          }
        : undefined
    });
  }

  let jsonChunk = Buffer.from(
    JSON.stringify({
      asset: {
        version: "2.0",
        generator: "growgo-test",
        extras: includeMetadataIdentity
          ? {
              assetId,
              recipeId,
              paletteId,
              lodProfile,
              dependencies: includeDependencyIdentity ? dependencyIds : []
            }
          : {}
      },
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

function seedWorkspace(tempRoot, options = {}) {
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const closeGlb =
    options.closeGlb ??
    createMinimalGlb({
      meshCount: 12,
      materialCount: 6,
      triangleCount: 240,
      lodSuffix: "LOD_CLOSE"
    });
  const gameplayGlb =
    options.gameplayGlb ??
    createMinimalGlb({
      meshCount: 8,
      materialCount: 6,
      triangleCount: 144,
      lodSuffix: "LOD_GAMEPLAY"
    });
  const mapGlb =
    options.mapGlb ??
    createMinimalGlb({
      meshCount: 4,
      materialCount: 4,
      triangleCount: 48,
      lodSuffix: "LOD_MAP"
    });

  fs.writeFileSync(
    path.join(outputDir, "TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb"),
    closeGlb
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb"),
    gameplayGlb
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_BOTTLEBRUSH_001_LOD_MAP.glb"),
    mapGlb
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_BOTTLEBRUSH_001_v001.blend"),
    Buffer.concat([
      Buffer.from("BLENDER-v402", "utf8"),
      Buffer.from("TREE_BOTTLEBRUSH_001", "utf8"),
      Buffer.from("TREE_BOTTLEBRUSH_RECIPE_001", "utf8"),
      Buffer.alloc(128)
    ])
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-bottlebrush-manifest.json"),
    JSON.stringify({
      assetId: "TREE_BOTTLEBRUSH_001",
      recipeReference: "TREE_BOTTLEBRUSH_RECIPE_001",
      manifestVersion: "1.0.0",
      category: "nature",
      identityContractSchemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
      variantId: "DEFAULT",
      paletteId: "AU_BOTTLEBRUSH_NATIVE_001",
      lodProfile: "NATURE_STANDARD_001",
      identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
      dependencies: [
        "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
        "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
        "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
        "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
        "MOD_TREE_GROUND_SOCKET_001"
      ],
      workspaceRoot: path.join(tempRoot, "asset-factory-workspace"),
      expectedBlendFilename: "TREE_BOTTLEBRUSH_001_v001.blend",
      expectedFinalOutputs: [
        "TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb",
        "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb",
        "TREE_BOTTLEBRUSH_001_LOD_MAP.glb"
      ]
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-bottlebrush-metadata.json"),
    JSON.stringify({
      assetId: "TREE_BOTTLEBRUSH_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      recipeReference: "TREE_BOTTLEBRUSH_RECIPE_001",
      registryRecipeId: "RECIPE_NATURE_ROADSIDE_NATIVE_STANDARD_001",
      identityContractV2: {
        schemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
        assetId: "TREE_BOTTLEBRUSH_001",
        category: "nature",
        recipeId: "TREE_BOTTLEBRUSH_RECIPE_001",
        version: "v001",
        variantId: "DEFAULT",
        paletteId: "AU_BOTTLEBRUSH_NATIVE_001",
        lodProfile: "NATURE_STANDARD_001",
        source: {
          generator: "Asset Factory",
          authoringTool: "Blender"
        },
        dependencies: [
          {
            dependencyId: "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          },
          {
            dependencyId: "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          },
          {
            dependencyId: "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          },
          {
            dependencyId: "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          },
          {
            dependencyId: "MOD_TREE_GROUND_SOCKET_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          }
        ],
        identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES",
        identityAnchor: {
          componentRole: "IDENTITY_ANCHOR",
          required: true
        },
        anchorRequired: true,
        anchorValidation: "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
        exportedIdentitySource: "identity_anchor"
      },
      outputDirectory: outputDir,
      paletteSlots: [
        "trunk",
        "branch",
        "leaf light",
        "leaf mid",
        "flower red",
        "flower pink"
      ],
      lodRoots: {
        close: "TREE_BOTTLEBRUSH_001_LOD_CLOSE_ROOT",
        gameplay: "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY_ROOT",
        map: "TREE_BOTTLEBRUSH_001_LOD_MAP_ROOT"
      },
      deterministicConstruction: true,
      manualBlenderExecutionRequired: true
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-bottlebrush-validation.json"),
    JSON.stringify({
      assetId: "TREE_BOTTLEBRUSH_001",
      readyForManualGeneration: true,
      outputDirectoryInsideRepo: true,
      applicationsWriteBlocked: true,
      deterministicPathConstruction: true,
      identityContractSchemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
      identityMetadataReady: true,
      finalBlendExistsBeforeManualSave: false,
      finalGlbsGenerated: false
    })
  );

  return outputDir;
}

test("tree bottlebrush post-run verification passes for a fully valid asset package", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-bottlebrush-verify-"));
  seedWorkspace(tempRoot);

  const verification = productionRunModule.verifyTreeBottlebrushOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, true);
  assert.equal(verification.manifestConsistency.ok, true);
  assert.equal(verification.lodComplexity.ok, true);
  const close = verification.files.find((entry) =>
    entry.filename.includes("LOD_CLOSE.glb")
  );
  assert.equal(close.assetIdentityPreserved, true);
  assert.equal(close.recipeIdentityPreserved, true);
  assert.equal(close.anchorIdentityPreserved, true);
  assert.equal(close.dependencyIdentityPreserved, true);
});

test("tree bottlebrush post-run verification fails when a required output is missing", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-bottlebrush-verify-missing-")
  );
  const outputDir = seedWorkspace(tempRoot);
  fs.rmSync(path.join(outputDir, "TREE_BOTTLEBRUSH_001_LOD_MAP.glb"));

  const verification = productionRunModule.verifyTreeBottlebrushOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, false);
  assert.match(
    verification.registrationGate.blockers.join("\n"),
    /TREE_BOTTLEBRUSH_001_LOD_MAP\.glb:MISSING/
  );
});

test("tree bottlebrush post-run verification fails when identity is not preserved", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-bottlebrush-verify-identity-")
  );
  seedWorkspace(tempRoot, {
    closeGlb: createMinimalGlb({
      lodSuffix: "LOD_CLOSE",
      meshCount: 12,
      materialCount: 6,
      triangleCount: 240,
      includeAssetIdentity: false,
      includeMetadataIdentity: false,
      includeDependencyIdentity: false
    })
  });

  const verification = productionRunModule.verifyTreeBottlebrushOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, false);
  const close = verification.files.find((entry) =>
    entry.filename.includes("LOD_CLOSE.glb")
  );
  assert.equal(close.classification, "CORRUPT");
  assert.equal(close.assetIdentityPreserved, false);
});

test("tree bottlebrush post-run verification fails when lod complexity does not decrease", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-bottlebrush-verify-lod-")
  );
  seedWorkspace(tempRoot, {
    closeGlb: createMinimalGlb({
      lodSuffix: "LOD_CLOSE",
      meshCount: 8,
      materialCount: 6,
      triangleCount: 120
    }),
    gameplayGlb: createMinimalGlb({
      lodSuffix: "LOD_GAMEPLAY",
      meshCount: 10,
      materialCount: 6,
      triangleCount: 180
    })
  });

  const verification = productionRunModule.verifyTreeBottlebrushOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, false);
  assert.equal(verification.lodComplexity.ok, false);
  assert.match(
    verification.registrationGate.blockers.join("\n"),
    /lod_complexity_failed/
  );
});
