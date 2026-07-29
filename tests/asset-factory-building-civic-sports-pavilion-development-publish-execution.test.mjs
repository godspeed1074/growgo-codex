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
const preparationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-development-publish-preparation.mjs"
  )
);
const executionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-development-publish-execution.mjs"
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
  fs.writeFileSync(path.join(outputDir, "building-civic-sports-pavilion-manifest.json"), "{}");
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify({ atlasCompatibility: { atlasCompatible: true } })
  );
  fs.writeFileSync(path.join(outputDir, "building-civic-sports-pavilion-validation.json"), "{}");

  productionRunModule.writeBuildingCivicSportsPavilionVerifiedOutputRecords(undefined, {
    cwd: tempRoot
  });
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(outputDir, "building-civic-sports-pavilion-manifest.json"),
      "utf8"
    )
  );
  const expectedHashes = {
    close: manifest.verifiedOutputs.close.sha256,
    gameplay: manifest.verifiedOutputs.gameplay.sha256,
    map: manifest.verifiedOutputs.map.sha256
  };
  registrationModule.writeBuildingCivicSportsPavilionRegistrationRecord(undefined, {
    cwd: tempRoot
  });
  approvalModule.writeBuildingCivicSportsPavilionApprovalRecord(undefined, {
    cwd: tempRoot
  });
  preparationModule.writeBuildingCivicSportsPavilionDevelopmentPublishPreparation(
    undefined,
    {
      cwd: tempRoot,
      expectedHashes
    }
  );

  return { outputDir, expectedHashes };
}

test("development publish record creation preserves ids, hashes, and development-only target", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-pavilion-dev-exec-"));
  const { expectedHashes } = seedWorkspace(tempRoot);

  const record =
    executionModule.buildBuildingCivicSportsPavilionDevelopmentPublishRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.equal(record.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(record.recipeId, "SPORTS_FACILITY_RECIPE_001");
  assert.equal(record.targetEnvironment, "DEVELOPMENT");
  assert.equal(record.publishStatus, "PUBLISHED_DEVELOPMENT");
  assert.equal(
    record.verifiedHashes.close,
    expectedHashes.close
  );
});

test("development catalog activation stays development-only and keeps beta and production blocked", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-activation-")
  );
  const { expectedHashes } = seedWorkspace(tempRoot);

  const activation =
    executionModule.buildBuildingCivicSportsPavilionDevelopmentCatalogActivation(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.equal(activation.targetEnvironment, "DEVELOPMENT");
  assert.equal(activation.developmentVisibility.enabled, true);
  assert.equal(activation.blockedVisibility.beta, true);
  assert.equal(activation.blockedVisibility.production, true);
});

test("development publish execution writes records with no release creation and no renderer activation", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-pavilion-dev-write-"));
  const { outputDir, expectedHashes } = seedWorkspace(tempRoot);

  const result =
    executionModule.writeBuildingCivicSportsPavilionDevelopmentPublishExecution(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.equal(fs.existsSync(result.publishPath), true);
  assert.equal(fs.existsSync(result.activationPath), true);
  assert.equal(
    fs.existsSync(path.join(outputDir, "building-civic-sports-pavilion-release.json")),
    false
  );
  assert.equal(result.publishRecord.runtimeSafetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(result.publishRecord.runtimeSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    result.publishRecord.runtimeSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.publishRecord.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("development publish execution output is deterministic", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-dev-deterministic-")
  );
  const { expectedHashes } = seedWorkspace(tempRoot);

  const first =
    executionModule.buildBuildingCivicSportsPavilionDevelopmentPublishRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );
  const second =
    executionModule.buildBuildingCivicSportsPavilionDevelopmentPublishRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicPublishExecutionHash,
    second.validation.deterministicPublishExecutionHash
  );
});
