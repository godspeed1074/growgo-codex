import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-production-run.mjs"
  )
);

const assetRegistryModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-registry.mjs"
  )
);

const generationScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_tree_eucalyptus_001.py"
);

const verifierScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "tree-eucalyptus-post-run-verify.mjs"
);

function createMinimalGlb({
  assetId = "TREE_EUCALYPTUS_001",
  meshCount = 1,
  materialCount = 1,
  triangleCount = 12,
  includeExternalDependency = false
} = {}) {
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
      name: `${assetId}_MESH_${index}`,
      primitives: [
        {
          indices: 0,
          mode: 4
        }
      ]
    });
    nodes.push({
      name: `${assetId}_NODE_${index}`,
      mesh: index
    });
  }
  const materials = [];
  for (let index = 0; index < materialCount; index += 1) {
    materials.push({
      name: `${assetId}_MATERIAL_${index}`
    });
  }
  const document = {
    asset: {
      version: "2.0",
      generator: "growgo-test"
    },
    scene: 0,
    scenes: [{ name: `${assetId}_SCENE`, nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    accessors,
    buffers: [{ byteLength: 0 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 0 }]
  };
  if (includeExternalDependency) {
    document.images = [{ uri: "external-texture.png" }];
  }
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

function createMinimalBlend({ assetId, recipeId }) {
  return Buffer.from(`BLENDER-v420${assetId}\n${recipeId}\n`, "utf8");
}

test("tree eucalyptus production definition preserves existing registry identity without duplicate asset definitions", () => {
  const definition = moduleUnderTest.buildTreeEucalyptusProductionRun();
  const registryMatches = assetRegistryModule.natureAssetPackRecords.filter(
    (record) => record.assetId === definition.assetId
  );

  assert.equal(registryMatches.length, 1);
  assert.equal(registryMatches[0].assetFamily, "TREE_ASSET_FAMILY_001");
  assert.equal(registryMatches[0].recipeId, "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001");
  assert.deepEqual(definition.variants, ["windswept", "upright", "young_cluster"]);
});

test("tree eucalyptus production definition keeps exact final filenames and legacy silhouette separate", () => {
  const definition = moduleUnderTest.buildTreeEucalyptusProductionRun();

  assert.equal(definition.expectedOutputs.blend, "TREE_EUCALYPTUS_001_v001.blend");
  assert.deepEqual(definition.expectedOutputs.proofAssets, [
    "TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
    "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    "TREE_EUCALYPTUS_001_LOD_MAP.glb",
  ]);
  assert.deepEqual(definition.expectedOutputs.legacyOutputs, [
    "TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb",
  ]);
});

test("tree eucalyptus generation script is valid Python syntax", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        `source = Path(r'''${generationScriptPath.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
        `compile(source, r'''${generationScriptPath.replace(/\\/g, "\\\\")}''', 'exec')`,
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("tree eucalyptus generation script preserves deterministic palette restrictions and avoids renderer systems", () => {
  const script = fs.readFileSync(generationScriptPath, "utf8");

  assert.match(script, /SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"/);
  assert.match(script, /REGISTRY_RECIPE_ID = "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"/);
  assert.match(script, /REPO_ROOT = Path\(/);
  assert.match(script, /WORKSPACE_ROOT = \(REPO_ROOT \/ "asset-factory-workspace"\)\.resolve\(\)/);
  assert.match(script, /EXPECTED_OUTPUT_DIR = \(/);
  assert.match(script, /Resolved eucalyptus output directory:/);
  assert.match(script, /Refusing to write inside \/Applications/);
  assert.match(script, /Refusing to write outside the GrowGo repository workspace/);
  assert.match(script, /"canopy light"/);
  assert.match(script, /"canopy mid"/);
  assert.match(script, /"canopy dark"/);
  assert.match(script, /bright pink/);
  assert.match(script, /neon blue/);
  assert.match(script, /pure black foliage/);
  assert.match(script, /S184_TREE_EUCALYPTUS_GENERATION_READY_FOR_SAVE/);
  assert.doesNotMatch(script, /cycles/i);
  assert.doesNotMatch(script, /composit/i);
  assert.doesNotMatch(script, /denois/i);
  assert.doesNotMatch(script, /OpenEXR/i);
  assert.doesNotMatch(script, /asset-factory-workspace\/production\/COASTAL_NATURE_FAMILY_001\/export/);
});

test("tree eucalyptus verifier does not launch Blender from Codex", () => {
  const script = fs.readFileSync(verifierScriptPath, "utf8");

  assert.match(script, /verifyTreeEucalyptusOutputs/);
  assert.doesNotMatch(script, /spawn|execFile|child_process|Blender/);
});

test("tree eucalyptus final GLB verification records decreasing lod complexity", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-tree-eucalyptus-"));
  const outputDirectory = path.join(
    tempRoot,
    "asset-factory-workspace",
    "production",
    "COASTAL_NATURE_FAMILY_001",
    "export"
  );
  fs.mkdirSync(outputDirectory, { recursive: true });

  fs.writeFileSync(
    path.join(outputDirectory, "TREE_EUCALYPTUS_001_v001.blend"),
    createMinimalBlend({
      assetId: "TREE_EUCALYPTUS_001",
      recipeId: "TREE_EUCALYPTUS_RECIPE_001"
    })
  );

  fs.writeFileSync(
    path.join(outputDirectory, "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 6, materialCount: 5, triangleCount: 180 })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 4, materialCount: 5, triangleCount: 96 })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "TREE_EUCALYPTUS_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 2, materialCount: 3, triangleCount: 30 })
  );

  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-manifest.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      manifestVersion: "1.0.0"
    })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-metadata.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001"
    })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-validation.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      readyForManualGeneration: true
    })
  );

  const verification = moduleUnderTest.verifyTreeEucalyptusOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, true);
  assert.equal(verification.lodComplexity.ok, true);
  assert.deepEqual(verification.registrationGate.blockers, []);
});

test("tree eucalyptus verification blocks registration when final blend is missing", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-tree-eucalyptus-missing-"));
  const outputDirectory = path.join(
    tempRoot,
    "asset-factory-workspace",
    "production",
    "COASTAL_NATURE_FAMILY_001",
    "export"
  );
  fs.mkdirSync(outputDirectory, { recursive: true });

  for (const [filename, triangleCount] of [
    ["TREE_EUCALYPTUS_001_LOD_CLOSE.glb", 180],
    ["TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb", 96],
    ["TREE_EUCALYPTUS_001_LOD_MAP.glb", 30],
  ]) {
    fs.writeFileSync(
      path.join(outputDirectory, filename),
      createMinimalGlb({ meshCount: 3, materialCount: 2, triangleCount })
    );
  }

  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-manifest.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001"
    })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-metadata.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001"
    })
  );
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-validation.json"),
    JSON.stringify({
      assetId: "TREE_EUCALYPTUS_001"
    })
  );

  const verification = moduleUnderTest.verifyTreeEucalyptusOutputs(undefined, {
    cwd: tempRoot
  });

  assert.equal(verification.registrationGate.ready, false);
  assert.match(
    verification.registrationGate.blockers.join("\n"),
    /TREE_EUCALYPTUS_001_v001\.blend:MISSING|final_blend_missing_or_unverified/
  );
});

test("tree eucalyptus generator and resume script share the same absolute output directory", () => {
  const generationScript = fs.readFileSync(generationScriptPath, "utf8");
  const resumeScript = fs.readFileSync(
    path.resolve(
      import.meta.dirname,
      "..",
      "asset-factory",
      "local-blender-scripts",
      "resume_tree_eucalyptus_001_exports.py"
    ),
    "utf8"
  );

  for (const script of [generationScript, resumeScript]) {
    assert.match(
      script,
      /\/Users\/michaelpeterson\/Documents\/Codex\/2026-06-16\/files-mentioned-by-the-user-root\/growgo-codex/
    );
    assert.match(script, /WORKSPACE_ROOT = \(REPO_ROOT \/ "asset-factory-workspace"\)\.resolve\(\)/);
    assert.match(
      script,
      /EXPECTED_OUTPUT_DIR = \(\s*WORKSPACE_ROOT \/ "production" \/ "COASTAL_NATURE_FAMILY_001" \/ "export"/
    );
  }
});

test("tree eucalyptus path construction stays inside the GrowGo repository deterministically", () => {
  const definition = moduleUnderTest.buildTreeEucalyptusProductionRun();
  const outputPath = path.resolve(
    path.resolve(import.meta.dirname, ".."),
    definition.outputLocation
  );
  const repoRoot = path.resolve(import.meta.dirname, "..");

  assert.ok(outputPath.startsWith(repoRoot));
  assert.ok(!outputPath.startsWith("/Applications"));
  assert.equal(
    outputPath,
    path.join(
      repoRoot,
      "asset-factory-workspace",
      "production",
      "COASTAL_NATURE_FAMILY_001",
      "export"
    )
  );
});
