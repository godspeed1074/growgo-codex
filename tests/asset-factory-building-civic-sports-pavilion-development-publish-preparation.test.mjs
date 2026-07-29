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
    "building-civic-sports-pavilion-production-run.mjs"
  )
);
const registrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-registration.mjs"
  )
);
const approvalModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-approval.mjs"
  )
);
const developmentPublishModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-development-publish-preparation.mjs"
  )
);

function createMinimalGlb({
  assetId = "BUILDING_CIVIC_SPORTS_PAVILION_001",
  meshCount = 1,
  materialCount = 1,
  triangleCount = 12
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
      primitives: [{ indices: 0, mode: 4 }]
    });
    nodes.push({
      name: `${assetId}_NODE_${index}`,
      mesh: index
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
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 47, materialCount: 6, triangleCount: 1624 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 44, materialCount: 6, triangleCount: 528 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 26, materialCount: 6, triangleCount: 312 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"),
    Buffer.concat([
      Buffer.from("BLENDER-v402", "utf8"),
      Buffer.from("BUILDING_CIVIC_SPORTS_PAVILION_001", "utf8"),
      Buffer.from("SPORTS_FACILITY_RECIPE_001", "utf8"),
      Buffer.alloc(128)
    ])
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-manifest.json"),
    JSON.stringify({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      recipeId: "SPORTS_FACILITY_RECIPE_001",
      version: "1.0.0",
      verifiedOutputs: {
        close: {
          filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb",
          sha256: "ee921ba10750ce0237f0ed13481145cbc383903afbbb61b1ca57e5695b4ddc06",
          sizeBytes: 154896,
          meshCount: 47,
          materialCount: 6,
          primitiveCount: 47,
          triangleCount: 1624
        },
        gameplay: {
          filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
          sha256: "e941dba8229c8d6158d132c6a1a5bcb241ea5ebb94ad702c63f9f12062dc0637",
          sizeBytes: 73260,
          meshCount: 44,
          materialCount: 6,
          primitiveCount: 44,
          triangleCount: 528
        },
        map: {
          filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb",
          sha256: "38208a153ef605fcea6a8f17fd38d16702259fc698c3bcc83a7a05cfb5982ab1",
          sizeBytes: 44948,
          meshCount: 26,
          materialCount: 6,
          primitiveCount: 26,
          triangleCount: 312
        }
      }
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      recipeId: "SPORTS_FACILITY_RECIPE_001",
      validationStatus: "VERIFIED_FINAL_OUTPUTS_READY_FOR_REGISTRATION",
      palette: {
        profile: "CIVIC_SPORTS_PAPERCUT_001"
      }
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-validation.json"),
    JSON.stringify({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      recipeId: "SPORTS_FACILITY_RECIPE_001",
      registrationReady: true,
      missingOutputs: [],
      noExternalDependencies: true,
      outputVerification: {
        "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb": "VERIFIED_COMPLETE",
        "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb": "VERIFIED_COMPLETE",
        "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb": "VERIFIED_COMPLETE",
        "building-civic-sports-pavilion-manifest.json": "VERIFIED_COMPLETE",
        "building-civic-sports-pavilion-metadata.json": "VERIFIED_COMPLETE",
        "building-civic-sports-pavilion-validation.json": "VERIFIED_COMPLETE",
        "building-civic-sports-pavilion-registration.json": "VERIFIED_COMPLETE",
        "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend": "VERIFIED_COMPLETE"
      }
    })
  );

  productionRunModule.writeBuildingCivicSportsPavilionVerifiedOutputRecords(undefined, {
    cwd: tempRoot
  });
  registrationModule.writeBuildingCivicSportsPavilionRegistrationRecord(undefined, {
    cwd: tempRoot
  });
  approvalModule.writeBuildingCivicSportsPavilionApprovalRecord(undefined, {
    cwd: tempRoot
  });

  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "building-civic-sports-pavilion-manifest.json"), "utf8")
  );

  return {
    outputDir,
    expectedHashes: {
      close: manifest.verifiedOutputs.close.sha256,
      gameplay: manifest.verifiedOutputs.gameplay.sha256,
      map: manifest.verifiedOutputs.map.sha256
    }
  };
}

test("development publish candidate creation preserves asset and recipe ids and targets development only", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-pavilion-dev-publish-"));
  const seeded = seedWorkspace(tempRoot);

  const candidate =
    developmentPublishModule.buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );

  assert.equal(candidate.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(candidate.recipeId, "SPORTS_FACILITY_RECIPE_001");
  assert.equal(candidate.targetEnvironment, "DEVELOPMENT");
  assert.equal(candidate.publishStatus, "PREPARED");
});

test("development publish candidate preserves verified hashes and blocks beta and production", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-publish-hashes-")
  );
  const seeded = seedWorkspace(tempRoot);

  const candidate =
    developmentPublishModule.buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );

  assert.equal(
    candidate.lodFiles.close.sha256,
    seeded.expectedHashes.close
  );
  assert.equal(candidate.betaEligibility, false);
  assert.equal(candidate.productionEligibility, false);
  assert.equal(candidate.environmentGuards.betaBlocked, true);
  assert.equal(candidate.environmentGuards.productionBlocked, true);
});

test("development publish preparation writes candidate and development catalog without release side effects", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-publish-write-")
  );
  const seeded = seedWorkspace(tempRoot);
  const outputDir = seeded.outputDir;

  const result =
    developmentPublishModule.writeBuildingCivicSportsPavilionDevelopmentPublishPreparation(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );

  assert.equal(fs.existsSync(result.candidatePath), true);
  assert.equal(fs.existsSync(result.catalogPath), true);
  assert.equal(
    fs.existsSync(path.join(outputDir, "building-civic-sports-pavilion-publish.json")),
    false
  );
  assert.equal(
    fs.existsSync(path.join(outputDir, "building-civic-sports-pavilion-release.json")),
    false
  );
});

test("development catalog entry exposes palette, LODs, metrics, atlas compatibility, and local references", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-catalog-")
  );
  const seeded = seedWorkspace(tempRoot);

  const entry =
    developmentPublishModule.buildBuildingCivicSportsPavilionDevelopmentCatalogEntry(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );

  assert.equal(entry.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(entry.availableLods.length, 3);
  assert.equal(entry.approvedPalette.profile, "CIVIC_SPORTS_PAPERCUT_001");
  assert.equal(entry.usageConstraints.liveMapAttachmentAllowed, false);
});

test("development publish candidate output is deterministic", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-publish-deterministic-")
  );
  const seeded = seedWorkspace(tempRoot);

  const first =
    developmentPublishModule.buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );
  const second =
    developmentPublishModule.buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
      undefined,
      { cwd: tempRoot, expectedHashes: seeded.expectedHashes }
    );

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicCandidateHash,
    second.validation.deterministicCandidateHash
  );
});
