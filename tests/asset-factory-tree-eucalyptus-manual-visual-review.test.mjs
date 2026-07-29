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
    "tree-eucalyptus-production-run.mjs"
  )
);
const registrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-registration.mjs"
  )
);
const manualVisualReviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-manual-visual-review.mjs"
  )
);

function createMinimalGlb({
  assetId = "TREE_EUCALYPTUS_001",
  meshCount = 1,
  materialCount = 1,
  triangleCount = 12,
  lodSuffix = "LOD_CLOSE"
} = {}) {
  const accessors = [
    {
      bufferView: 0,
      componentType: 5123,
      count: triangleCount * 3,
      type: "SCALAR"
    }
  ];
  const nodes = [
    { name: `${assetId}_${lodSuffix}_IDENTITY_ANCHOR`, mesh: 0 },
    { name: `${assetId}_${lodSuffix}_ROOT`, mesh: 1 }
  ];
  const meshes = [
    {
      name: `${assetId}_${lodSuffix}_IDENTITY_ANCHOR_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    },
    {
      name: `${assetId}_${lodSuffix}_TRUNK_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    }
  ];

  for (let index = 2; index < meshCount; index += 1) {
    nodes.push({
      name: `${assetId}_CANOPY_${index}_${lodSuffix}`,
      mesh: index
    });
    meshes.push({
      name: `${assetId}_CANOPY_${index}_${lodSuffix}_MESH`,
      primitives: [{ indices: 0, mode: 4 }]
    });
  }

  const materials = [];
  for (let index = 0; index < materialCount; index += 1) {
    materials.push({ name: `${assetId}_MATERIAL_${index}` });
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
    path.join(outputDir, "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"),
    createMinimalGlb({
      meshCount: 11,
      materialCount: 5,
      triangleCount: 249,
      lodSuffix: "LOD_CLOSE"
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({
      meshCount: 7,
      materialCount: 5,
      triangleCount: 153,
      lodSuffix: "LOD_GAMEPLAY"
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_LOD_MAP.glb"),
    createMinimalGlb({
      meshCount: 4,
      materialCount: 2,
      triangleCount: 77,
      lodSuffix: "LOD_MAP"
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "TREE_EUCALYPTUS_001_v001.blend"),
    Buffer.concat([
      Buffer.from("BLENDER-v402", "utf8"),
      Buffer.from("TREE_EUCALYPTUS_001", "utf8"),
      Buffer.from("TREE_EUCALYPTUS_RECIPE_001", "utf8"),
      Buffer.alloc(128)
    ])
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-eucalyptus-manifest.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      manifestVersion: "1.0.0",
      category: "nature",
      identityContractSchemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
      variantId: "DEFAULT",
      paletteId: "AU_NATIVE_GREEN_001",
      lodProfile: "NATURE_STANDARD_001",
      identityPolicy: "ASSET_ROOT_AND_COMPONENTS",
      dependencies: ["MOD_TREE_LEAF_CLUSTER_001"],
      workspaceRoot: path.join(tempRoot, "asset-factory-workspace"),
      expectedBlendFilename: "TREE_EUCALYPTUS_001_v001.blend",
      expectedFinalOutputs: [
        "TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
        "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
        "TREE_EUCALYPTUS_001_LOD_MAP.glb"
      ]
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-eucalyptus-metadata.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      registryRecipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
      identityContractV2: {
        schemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
        assetId: "TREE_EUCALYPTUS_001",
        category: "nature",
        recipeId: "TREE_EUCALYPTUS_RECIPE_001",
        version: "v001",
        variantId: "DEFAULT",
        paletteId: "AU_NATIVE_GREEN_001",
        lodProfile: "NATURE_STANDARD_001",
        source: {
          generator: "Asset Factory",
          authoringTool: "Blender"
        },
        dependencies: [
          {
            dependencyId: "MOD_TREE_LEAF_CLUSTER_001",
            category: "module",
            identityPolicy: "DEPENDENCY_DECLARED_ONLY"
          }
        ],
        identityPolicy: "ASSET_ROOT_AND_COMPONENTS",
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
        "canopy light",
        "canopy mid",
        "canopy dark"
      ],
      lodRoots: {
        close: "TREE_EUCALYPTUS_001_LOD_CLOSE_ROOT",
        gameplay: "TREE_EUCALYPTUS_001_LOD_GAMEPLAY_ROOT",
        map: "TREE_EUCALYPTUS_001_LOD_MAP_ROOT"
      },
      deterministicConstruction: true,
      manualBlenderExecutionRequired: true
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "tree-eucalyptus-validation.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
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

  registrationModule.writeTreeEucalyptusRegistrationRecord(undefined, { cwd: tempRoot });
  registrationModule.writeTreeEucalyptusDevelopmentCatalogEntry(undefined, { cwd: tempRoot });

  return { outputDir };
}

test("unresolved eucalyptus checks remain not reviewed without explicit evidence", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-tree-manual-review-"));
  seedWorkspace(tempRoot);

  const record = manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(
    undefined,
    { cwd: tempRoot }
  );

  assert.equal(record.reviewResults.papercut_2_5d_style.result, "NOT_REVIEWED");
  assert.equal(record.reviewResults.australian_eucalyptus_identity.result, "NOT_REVIEWED");
  assert.equal(record.reviewResults.mobile_lightweight_design.result, "NOT_REVIEWED");
  assert.equal(record.reviewResults.world_placement_suitability.result, "NOT_REVIEWED");
  assert.equal(record.reviewOutcome.visualReviewComplete, false);
});

test("pass requires explicit evidence for eucalyptus visual review", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-tree-manual-review-pass-")
  );
  seedWorkspace(tempRoot);

  assert.throws(
    () =>
      manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(undefined, {
        cwd: tempRoot,
        reviewEvidence: {
          papercut_2_5d_style: {
            result: "PASS"
          }
        }
      }),
    /cannot pass without explicit evidence/i
  );
});

test("fail records exact eucalyptus defect and produces a minimal revision recommendation", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-tree-manual-review-fail-")
  );
  seedWorkspace(tempRoot);

  const record = manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(
    undefined,
    {
      cwd: tempRoot,
      reviewEvidence: {
        australian_eucalyptus_identity: {
          result: "FAIL",
          notes: "Canopy silhouette reads too generic and loses the eucalyptus profile.",
          reviewerEvidence: "Manual visual inspection of the development asset.",
          screenshotReferenceOrConfirmation: "Screenshot_A"
        }
      }
    }
  );

  assert.equal(record.reviewResults.australian_eucalyptus_identity.result, "FAIL");
  assert.match(record.reviewResults.australian_eucalyptus_identity.notes, /generic/i);
  assert.equal(record.reviewOutcome.minimalRevisionRecommendation.length, 1);
});

test("manual eucalyptus review preserves hashes and has no publishing side effects", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-tree-manual-review-hashes-")
  );
  seedWorkspace(tempRoot);

  const verification = productionRunModule.verifyTreeEucalyptusOutputs(undefined, {
    cwd: tempRoot
  });
  const record = manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(
    undefined,
    { cwd: tempRoot }
  );

  assert.equal(record.preservedHashes.blend, verification.files[0].sha256);
  assert.equal(record.safety.betaPublished, false);
  assert.equal(record.safety.productionPublished, false);
  assert.equal(record.safety.releaseCreated, false);
});

test("manual eucalyptus review has no renderer or map activation and is deterministic", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-tree-manual-review-deterministic-")
  );
  seedWorkspace(tempRoot);

  const first = manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(
    undefined,
    { cwd: tempRoot }
  );
  const second = manualVisualReviewModule.buildTreeEucalyptusManualVisualReviewRecord(
    undefined,
    { cwd: tempRoot }
  );

  assert.deepEqual(first, second);
  assert.equal(first.safety.automaticRendererExecutionAllowed, false);
  assert.equal(first.safety.mapAttached, false);
  assert.equal(first.validation.deterministicOutput, true);
});
