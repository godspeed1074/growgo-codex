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

function seedVerifiedPavilionOutputs(tempRoot) {
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 7, materialCount: 6, triangleCount: 80 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 5, materialCount: 6, triangleCount: 48 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 3, materialCount: 6, triangleCount: 24 })
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
    JSON.stringify({ old: true })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify({ atlasCompatibility: { atlasCompatible: true } })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-validation.json"),
    JSON.stringify({ stale: true })
  );

  productionRunModule.writeBuildingCivicSportsPavilionVerifiedOutputRecords(undefined, {
    cwd: tempRoot
  });

  return outputDir;
}

test("pavilion registration writer creates registered validated not-published record from verified outputs", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-pavilion-registration-"));
  const outputDir = seedVerifiedPavilionOutputs(tempRoot);

  const writeResult =
    registrationModule.writeBuildingCivicSportsPavilionRegistrationRecord(undefined, {
      cwd: tempRoot
    });

  const registration = JSON.parse(
    fs.readFileSync(
      path.join(outputDir, "building-civic-sports-pavilion-registration.json"),
      "utf8"
    )
  );

  assert.equal(writeResult.record.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(registration.registrationStatus, "registered");
  assert.equal(registration.validationStatus, "validated");
  assert.equal(registration.publishStatus, "not_published");
  assert.equal(registration.readyForApproval, true);
  assert.equal(registration.readyForPublishing, false);
  assert.equal(registration.registry.recipeId, "SPORTS_FACILITY_RECIPE_001");
  assert.equal(registration.verifiedOutputs.close.primitiveCount, 7);
});

test("pavilion registration preserves hashes and registry identity without publishing side effects", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-registration-hash-")
  );
  const outputDir = seedVerifiedPavilionOutputs(tempRoot);

  registrationModule.writeBuildingCivicSportsPavilionRegistrationRecord(undefined, {
    cwd: tempRoot
  });

  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(outputDir, "building-civic-sports-pavilion-manifest.json"),
      "utf8"
    )
  );
  const validation = JSON.parse(
    fs.readFileSync(
      path.join(outputDir, "building-civic-sports-pavilion-validation.json"),
      "utf8"
    )
  );
  const registration = JSON.parse(
    fs.readFileSync(
      path.join(outputDir, "building-civic-sports-pavilion-registration.json"),
      "utf8"
    )
  );

  assert.equal(
    registration.verifiedOutputs.close.sha256,
    manifest.verifiedOutputs.close.sha256
  );
  assert.equal(
    registration.verifiedOutputs.gameplay.sha256,
    manifest.verifiedOutputs.gameplay.sha256
  );
  assert.equal(
    registration.verifiedOutputs.map.sha256,
    manifest.verifiedOutputs.map.sha256
  );
  assert.equal(registration.verification.registrationReady, true);
  assert.equal(validation.registrationReady, true);
  assert.equal(registration.publishStatus, "not_published");
});
