import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Buffer } from "node:buffer";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-identity-contract.mjs"
  )
);

function createMinimalGlb({
  meshNames = [],
  nodeNames = [],
  materialNames = [],
  sceneName = "SCENE",
  extras = {}
} = {}) {
  const accessors = [
    {
      bufferView: 0,
      componentType: 5123,
      count: 18,
      type: "SCALAR"
    }
  ];
  const meshes = meshNames.map((name) => ({
    name,
    primitives: [{ indices: 0, mode: 4 }]
  }));
  const nodes = nodeNames.map((name, index) => ({
    name,
    mesh: Math.min(index, Math.max(meshes.length - 1, 0)),
    extras: extras.nodeExtras ?? null
  }));
  const materials = materialNames.map((name) => ({
    name,
    extras: extras.materialExtras ?? null
  }));
  const document = {
    asset: {
      version: "2.0",
      generator: "growgo-test",
      extras: extras.assetExtras ?? null
    },
    scene: 0,
    scenes: [
      {
        name: sceneName,
        nodes: nodes.map((_, index) => index),
        extras: extras.sceneExtras ?? null
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

function createContract(overrides = {}) {
  return {
    assetId: "TREE_EUCALYPTUS_001",
    recipeId: "TREE_EUCALYPTUS_RECIPE_001",
    version: "v001",
    category: "nature",
    variantId: "DEFAULT",
    paletteId: "PALETTE_AU_NATIVE_GREEN_001",
    lodProfile: "NATURE_STANDARD_001",
    source: {
      generator: "Asset Factory",
      authoringTool: "Blender"
    },
    dependencies: [],
    identityPolicy: "ASSET_ROOT_AND_COMPONENTS",
    identityAnchor: {
      componentRole: "IDENTITY_ANCHOR",
      required: true
    },
    anchorRequired: true,
    anchorValidation: "REQUIRE_EXPORTED_ANCHOR",
    exportedIdentitySource: "IDENTITY_ANCHOR",
    ...overrides
  };
}

test("asset identity contract v2 builds the permanent schema fields", () => {
  const contract = moduleUnderTest.buildAssetIdentityContract(createContract());

  assert.equal(
    contract.schemaId,
    moduleUnderTest.assetIdentityContractPhase0011SchemaId
  );
  assert.equal(contract.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(contract.category, "NATURE");
  assert.equal(contract.recipeId, "TREE_EUCALYPTUS_RECIPE_001");
  assert.equal(contract.version, "v001");
  assert.equal(contract.variantId, "DEFAULT");
  assert.equal(contract.paletteId, "PALETTE_AU_NATIVE_GREEN_001");
  assert.equal(contract.lodProfile, "NATURE_STANDARD_001");
  assert.equal(contract.source.generator, "ASSET_FACTORY");
  assert.equal(contract.source.authoringTool, "BLENDER");
  assert.equal(contract.identityAnchor.componentRole, "IDENTITY_ANCHOR");
  assert.equal(contract.anchorRequired, true);
  assert.equal(contract.anchorValidation, "REQUIRE_EXPORTED_ANCHOR");
});

test("asset identity contract v2 supports structured asset-owned names", () => {
  const contract = createContract();

  const objectResult = moduleUnderTest.validateBlenderObjectNames(contract, [
    "TREE_EUCALYPTUS_001_ROOT",
    "TREE_EUCALYPTUS_001_TRUNK",
    "TREE_EUCALYPTUS_001_CANOPY"
  ]);

  const materialResult = moduleUnderTest.validateBlenderMaterialNames(contract, [
    "TREE_EUCALYPTUS_001_MATERIAL_LEAF"
  ]);

  assert.equal(objectResult.ok, true);
  assert.equal(materialResult.ok, true);
  assert.deepEqual(objectResult.assetOwnedItems, [
    "TREE_EUCALYPTUS_001_ROOT",
    "TREE_EUCALYPTUS_001_TRUNK",
    "TREE_EUCALYPTUS_001_CANOPY"
  ]);
});

test("asset identity contract v2 supports reusable dependency identity", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential",
    dependencies: [
      {
        dependencyId: "MOD_WINDOW_RESIDENTIAL_LARGE_001",
        category: "module"
      }
    ],
    identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
  });

  const result = moduleUnderTest.validateBlenderObjectNames(contract, [
    "BUILDING_HOME_001_ROOT",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001_FRAME"
  ]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.assetOwnedItems, ["BUILDING_HOME_001_ROOT"]);
  assert.deepEqual(result.dependencyOwnedItems, [
    "MOD_WINDOW_RESIDENTIAL_LARGE_001_FRAME"
  ]);
});

test("asset identity contract v2 supports asset variants", () => {
  const contract = createContract({
    assetId: "TRAIN_METRO_001",
    recipeId: "TRAIN_METRO_RECIPE_001",
    category: "vehicle",
    variantId: "BLUE"
  });

  const explicitVariant = moduleUnderTest.validateIdentityName(
    contract,
    "TRAIN_METRO_001_VARIANT_BLUE"
  );
  const componentVariant = moduleUnderTest.validateIdentityName(
    contract,
    "TRAIN_METRO_001_BODY_BLUE"
  );

  assert.equal(explicitVariant.ok, true);
  assert.equal(componentVariant.ok, true);
});

test("asset identity contract v2 supports formal LOD labels", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  assert.equal(
    moduleUnderTest.createLodIdentityName(contract, "LOD_CLOSE", "ROOT"),
    "BUILDING_HOME_001_LOD_CLOSE_ROOT"
  );

  const result = moduleUnderTest.validatePreExportIdentity(contract, {
    lodRoots: [
      "BUILDING_HOME_001_LOD_CLOSE_ROOT",
      "BUILDING_HOME_001_LOD_GAMEPLAY_ROOT",
      "BUILDING_HOME_001_LOD_MAP_ROOT"
    ],
    identityAnchors: [
      "BUILDING_HOME_001_LOD_CLOSE_IDENTITY_ANCHOR",
      "BUILDING_HOME_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      "BUILDING_HOME_001_LOD_MAP_IDENTITY_ANCHOR"
    ],
    objectNames: ["BUILDING_HOME_001_ROOT"],
    meshNames: ["BUILDING_HOME_001_BODY_MESH"],
    materialNames: ["BUILDING_HOME_001_MATERIAL_ROOF"],
    collectionNames: ["BUILDING_HOME_001"]
  });

  assert.equal(result.ok, true);
});

test("asset identity contract v2 preserves palette identity deterministically", () => {
  const contract = moduleUnderTest.buildAssetIdentityContract(
    createContract({
      paletteId: "PALETTE_COASTAL_HOME_001"
    })
  );

  assert.equal(contract.paletteId, "PALETTE_COASTAL_HOME_001");
});

test("asset identity contract v2 accepts metadata-based GLB identity", () => {
  const contract = createContract();

  const inspection = moduleUnderTest.inspectExportedGlbIdentityBuffer(
    contract,
    createMinimalGlb({
      meshNames: ["TREE_CANOPY_MESH"],
      nodeNames: ["TREE_NODE"],
      materialNames: ["TREE_LEAF_MATERIAL"],
      sceneName: "TREE_SCENE",
      extras: {
        assetExtras: {
          contract: {
            assetId: "TREE_EUCALYPTUS_001",
            recipeId: "TREE_EUCALYPTUS_RECIPE_001",
            paletteId: "PALETTE_AU_NATIVE_GREEN_001"
          }
        }
      }
    })
  );

  assert.equal(inspection.valid, true);
  assert.equal(inspection.assetIdentityPreserved, true);
  assert.ok(inspection.metadataIdentityHits.length >= 1);
  assert.equal(inspection.exportedIdentitySource, "metadata");
});

test("asset identity contract v2 reads exported growgo snake_case extras for recipe palette and dependencies", () => {
  const contract = createContract({
    dependencies: [
      {
        dependencyId: "MOD_TREE_LEAF_CLUSTER_001",
        category: "module"
      }
    ]
  });

  const inspection = moduleUnderTest.inspectExportedGlbIdentityBuffer(
    contract,
    createMinimalGlb({
      meshNames: ["TREE_MESH"],
      nodeNames: ["TREE_NODE"],
      materialNames: ["TREE_MATERIAL"],
      extras: {
        nodeExtras: {
          growgo_asset_id: "TREE_EUCALYPTUS_001",
          growgo_recipe_id: "TREE_EUCALYPTUS_RECIPE_001",
          growgo_palette_id: "PALETTE_AU_NATIVE_GREEN_001",
          growgo_lod_profile: "NATURE_STANDARD_001",
          growgo_dependencies: "MOD_TREE_LEAF_CLUSTER_001",
          growgo_dependency_id: "MOD_TREE_LEAF_CLUSTER_001",
          growgo_identity_policy: "ASSET_ROOT_AND_COMPONENTS"
        }
      }
    })
  );

  assert.equal(inspection.valid, true);
  assert.equal(inspection.assetIdentityPreserved, true);
  assert.ok(
    inspection.metadataIdentityHits.some((hit) =>
      hit.includes("$.nodes[0].extras.growgo_recipe_id:TREE_EUCALYPTUS_RECIPE_001")
    )
  );
  assert.ok(
    inspection.metadataIdentityHits.some((hit) =>
      hit.includes("$.nodes[0].extras.growgo_dependencies:MOD_TREE_LEAF_CLUSTER_001")
    )
  );
  assert.ok(
    inspection.dependencyIdentityHits.some((hit) =>
      hit.includes("$.nodes[0].extras.growgo_dependency_id:MOD_TREE_LEAF_CLUSTER_001")
    )
  );
  assert.equal(inspection.exportedIdentitySource, "metadata");
});

test("asset identity contract v2 supports explicit identity anchor naming", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  assert.equal(
    moduleUnderTest.createIdentityAnchorName(contract, "LOD_CLOSE"),
    "BUILDING_HOME_001_LOD_CLOSE_IDENTITY_ANCHOR"
  );
});

test("asset identity contract v2 validates identity anchors before export when required", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  const result = moduleUnderTest.validatePreExportIdentity(contract, {
    lodRoots: [
      "BUILDING_HOME_001_LOD_CLOSE_ROOT",
      "BUILDING_HOME_001_LOD_GAMEPLAY_ROOT",
      "BUILDING_HOME_001_LOD_MAP_ROOT"
    ],
    identityAnchors: [
      "BUILDING_HOME_001_LOD_CLOSE_IDENTITY_ANCHOR",
      "BUILDING_HOME_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      "BUILDING_HOME_001_LOD_MAP_IDENTITY_ANCHOR"
    ],
    objectNames: ["BUILDING_HOME_001_ROOT"],
    meshNames: ["BUILDING_HOME_001_BODY_MESH"],
    materialNames: ["BUILDING_HOME_001_MATERIAL_ROOF"],
    collectionNames: ["BUILDING_HOME_001"]
  });

  assert.equal(result.ok, true);
});

test("asset identity contract v2 fails when required anchor is missing", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  const result = moduleUnderTest.validatePreExportIdentity(contract, {
    lodRoots: [
      "BUILDING_HOME_001_LOD_CLOSE_ROOT",
      "BUILDING_HOME_001_LOD_GAMEPLAY_ROOT",
      "BUILDING_HOME_001_LOD_MAP_ROOT"
    ],
    identityAnchors: [],
    objectNames: ["BUILDING_HOME_001_ROOT"],
    meshNames: ["BUILDING_HOME_001_BODY_MESH"],
    materialNames: ["BUILDING_HOME_001_MATERIAL_ROOF"],
    collectionNames: ["BUILDING_HOME_001"]
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.missingAnchors.includes("BUILDING_HOME_001_LOD_CLOSE_IDENTITY_ANCHOR")
  );
});

test("asset identity contract v2 can recover identity from exported anchor metadata", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  const inspection = moduleUnderTest.inspectExportedGlbIdentityBuffer(
    contract,
    createMinimalGlb({
      meshNames: ["ANCHOR_MESH"],
      nodeNames: ["BUILDING_HOME_001_LOD_CLOSE_IDENTITY_ANCHOR"],
      materialNames: ["ANCHOR_MATERIAL"],
      sceneName: "ANCHOR_SCENE",
      extras: {
        nodeExtras: {
          growgo_identity_anchor: true,
          growgo_asset_id: "BUILDING_HOME_001",
          growgo_palette_id: "PALETTE_AU_NATIVE_GREEN_001"
        }
      }
    })
  );

  assert.equal(inspection.assetIdentityPreserved, true);
  assert.equal(inspection.anchorIdentityPreserved, true);
  assert.equal(inspection.exportedIdentitySource, "metadata");
});

test("asset identity contract v2 still rejects partial asset tokens", () => {
  const result = moduleUnderTest.validateBlenderObjectNames(createContract(), [
    "TREE_EUCALYPTUS_TRUNK_001"
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.unknownIdentityItems, ["TREE_EUCALYPTUS_TRUNK_001"]);
});

test("asset identity contract v2 fails invalid dependency references", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential",
    dependencies: [{ dependencyId: "MOD_WINDOW_RESIDENTIAL_LARGE_001" }],
    identityPolicy: "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
  });

  const result = moduleUnderTest.validateBlenderObjectNames(contract, [
    "BUILDING_HOME_001_ROOT",
    "MOD_DOOR_STANDARD_001_PANEL"
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.unknownIdentityItems, ["MOD_DOOR_STANDARD_001_PANEL"]);
});

test("asset identity contract v2 fails missing LOD identity", () => {
  const contract = createContract({
    assetId: "BUILDING_HOME_001",
    recipeId: "BUILDING_HOME_RECIPE_001",
    category: "building_residential"
  });

  const result = moduleUnderTest.validatePreExportIdentity(contract, {
    lodRoots: ["BUILDING_HOME_001_ROOT"],
    objectNames: ["BUILDING_HOME_001_ROOT"],
    meshNames: ["BUILDING_HOME_001_BODY_MESH"],
    materialNames: ["BUILDING_HOME_001_MATERIAL_ROOF"],
    collectionNames: ["BUILDING_HOME_001"]
  });

  assert.equal(result.ok, false);
  assert.ok(result.missingIdentityItems.includes("lod:LOD_CLOSE"));
});

test("asset identity contract v2 fails invalid variant references", () => {
  const contract = createContract({
    assetId: "TRAIN_METRO_001",
    recipeId: "TRAIN_METRO_RECIPE_001",
    category: "vehicle",
    variantId: "BLUE"
  });

  const result = moduleUnderTest.validateIdentityName(
    contract,
    "TRAIN_METRO_001_VARIANT_RED"
  );

  assert.equal(result.ok, false);
});
