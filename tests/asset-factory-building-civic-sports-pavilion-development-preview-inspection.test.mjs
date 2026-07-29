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
const inspectionModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-development-preview-inspection.mjs"
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
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify(
      {
        assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
        recipeId: "SPORTS_FACILITY_RECIPE_001",
        moduleList: [
          "MOD_FOUNDATION_STANDARD_RECT_001",
          "MOD_WINDOW_RESIDENTIAL_LARGE_001",
          "MOD_PATH_STANDARD_001",
          "MOD_GROUND_GRASS_STANDARD_001",
          "MOD_FENCE_STANDARD_001",
          "MOD_TREE_EUCALYPTUS_STANDARD_001",
          "MOD_PAVILION_CANOPY_STANDARD_001",
          "MOD_PAVILION_POST_SET_001",
          "MOD_PAVILION_BLEACHER_SET_001",
          "MOD_PAVILION_CHANGE_ROOM_BLOCK_001"
        ],
        reusePercentage: 60,
        palette: {
          profile: "CIVIC_SPORTS_PAPERCUT_001",
          colours: {
            civic_wall: [0.886, 0.871, 0.816],
            civic_roof: [0.188, 0.357, 0.455],
            civic_trim: [0.247, 0.263, 0.298],
            sports_accent: [0.816, 0.416, 0.224],
            ground_green: [0.455, 0.655, 0.42],
            path_neutral: [0.631, 0.62, 0.596]
          }
        },
        atlasCompatibility: {
          atlasCompatible: true,
          supportedObjectTypes: ["OVAL", "RECREATION_AREA"],
          supportedClassifications: ["PARK"],
          supportedRecipeIds: [
            "SPORTS_FACILITY_RECIPE_001",
            "SPORTS_OVAL_RECIPE_001",
            "RECREATION_AREA_RECIPE_001"
          ]
        },
        verifiedOutputMetrics: manifest.verifiedOutputs
      },
      null,
      2
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
  executionModule.writeBuildingCivicSportsPavilionDevelopmentPublishExecution(undefined, {
    cwd: tempRoot,
    expectedHashes
  });

  return {
    outputDir,
    expectedHashes,
    expectedMetrics: {
      close: manifest.verifiedOutputs.close,
      gameplay: manifest.verifiedOutputs.gameplay,
      map: manifest.verifiedOutputs.map
    }
  };
}

test("inspection record creation preserves hashes and metrics from the development-published pavilion", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-preview-inspection-")
  );
  const { expectedHashes, expectedMetrics } = seedWorkspace(tempRoot);

  const inspectionRecord =
    inspectionModule.buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.equal(inspectionRecord.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(inspectionRecord.version, "1.0.0");
  assert.deepEqual(inspectionRecord.verifiedHashes, expectedHashes);
  assert.equal(
    inspectionRecord.metrics.close.triangleCount,
    expectedMetrics.close.triangleCount
  );
  assert.equal(
    inspectionRecord.metrics.gameplay.triangleCount,
    expectedMetrics.gameplay.triangleCount
  );
  assert.equal(
    inspectionRecord.metrics.map.triangleCount,
    expectedMetrics.map.triangleCount
  );
});

test("static preview descriptor is generated without renderer or map activation", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-preview-descriptor-")
  );
  const { expectedHashes } = seedWorkspace(tempRoot);

  const descriptor =
    inspectionModule.buildBuildingCivicSportsPavilionStaticPreviewDescriptor(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.equal(descriptor.cameraFramingRecommendation.preferredLod, "CLOSE");
  assert.equal(descriptor.restrictions.renderPixelsAllowed, false);
  assert.equal(descriptor.restrictions.canvasInitialisationAllowed, false);
  assert.equal(descriptor.restrictions.webglInitialisationAllowed, false);
  assert.equal(descriptor.restrictions.mapAttachmentAllowed, false);
});

test("preview inspection writer creates deterministic read-only records", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-preview-write-")
  );
  const { expectedHashes } = seedWorkspace(tempRoot);

  const first =
    inspectionModule.writeBuildingCivicSportsPavilionDevelopmentPreviewInspection(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );
  const secondInspection = JSON.parse(fs.readFileSync(first.inspectionPath, "utf8"));

  assert.equal(fs.existsSync(first.inspectionPath), true);
  assert.equal(fs.existsSync(first.descriptorPath), true);
  assert.equal(secondInspection.validation.noRendererImports, true);
  assert.equal(secondInspection.validation.noCanvasOrWebglCreation, true);
  assert.equal(secondInspection.validation.noMapAttachment, true);
});

test("preview inspection source remains free of renderer imports and canvas or webgl creation", () => {
  const source = fs.readFileSync(
    path.resolve(
      import.meta.dirname,
      "..",
      "asset-factory",
      "building-civic-sports-pavilion-development-preview-inspection.mjs"
    ),
    "utf8"
  );

  assert.equal(/from\s+["'][^"']*(renderer|leaflet)["']/.test(source), false);
  assert.equal(/document\.createElement\(\s*["']canvas["']\s*\)/.test(source), false);
  assert.equal(/\bgetContext\(\s*["']webgl/.test(source), false);
  assert.equal(/\bnew\s+OffscreenCanvas\b/.test(source), false);
});

test("preview inspection output is deterministic and stays development-only", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-preview-deterministic-")
  );
  const { expectedHashes } = seedWorkspace(tempRoot);

  const first =
    inspectionModule.buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );
  const second =
    inspectionModule.buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
      undefined,
      { cwd: tempRoot, expectedHashes }
    );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
  assert.equal(first.validation.noBetaSideEffects, true);
  assert.equal(first.validation.noProductionSideEffects, true);
  assert.equal(first.rendererSafetyState.lifecycleExecutionEnabled, false);
  assert.equal(first.mapAttachmentSafetyState.mapAttachmentAllowed, false);
});
