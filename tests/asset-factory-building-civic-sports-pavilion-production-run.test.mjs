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
    "building-civic-sports-pavilion-production-run.mjs"
  )
);

function createMinimalGlb({
  assetId = "BUILDING_CIVIC_SPORTS_PAVILION_001",
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

test("building civic sports pavilion production run validates approved assembly scope", () => {
  const result =
    moduleUnderTest.validateBuildingCivicSportsPavilionProductionRun();

  assert.equal(result.ok, true);
  assert.equal(result.productionRun.definition.targetReusePercentage, 60);
  assert.deepEqual(result.productionRun.definition.reusedSharedModules, [
    "MOD_FOUNDATION_STANDARD_RECT_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_PATH_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
  ]);
});

test("building civic sports pavilion production run declares expected proof assets and metadata files", () => {
  const definition = moduleUnderTest.buildBuildingCivicSportsPavilionProductionRun();

  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb",
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb",
  ]);
  assert.ok(
    definition.reusedSharedModules.includes("MOD_WINDOW_RESIDENTIAL_LARGE_001")
  );
  assert.ok(
    definition.missingSportsFacilityModules.includes(
      "MOD_PAVILION_CANOPY_STANDARD_001"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "building-civic-sports-pavilion-validation.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"
    )
  );
  assert.equal(
    definition.resumeScriptLocation,
    "asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py"
  );
});

test("building civic sports pavilion output inspector reports expected files when present", () => {
  const inspection =
    moduleUnderTest.inspectBuildingCivicSportsPavilionProductionOutputs(
      undefined,
      {
        cwd: path.resolve(import.meta.dirname, ".."),
      }
    );

  assert.equal(Array.isArray(inspection.fileStates), true);
  assert.equal(inspection.fileStates.length, 7);
  assert.equal(typeof inspection.blenderRuntime, "object");
  assert.equal(typeof inspection.summary, "object");
  assert.equal(typeof inspection.verification.registrationGate.ready, "boolean");
});

test("building civic sports pavilion safe Blender invocation includes background, factory-startup, no-audio, and python exit code flags", () => {
  const invocation =
    moduleUnderTest.buildBuildingCivicSportsPavilionSafeBlenderInvocation(
      undefined,
      {
        cwd: path.resolve(import.meta.dirname, ".."),
        runId: "diagnostic-check"
      }
    );

  assert.equal(
    invocation.executable,
    "/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender"
  );
  assert.deepEqual(invocation.args.slice(0, 5), [
    "--background",
    "--factory-startup",
    "-noaudio",
    "--python-exit-code",
    "1",
  ]);
  assert.match(invocation.stdoutLog, /diagnostic-check\.stdout\.log$/);
  assert.match(invocation.stderrLog, /diagnostic-check\.stderr\.log$/);
});

test("building civic sports pavilion sanitized environment keeps only essential variables", () => {
  const environment =
    moduleUnderTest.buildBuildingCivicSportsPavilionSanitizedEnvironment({
      HOME: "/Users/example",
      USER: "example",
      TMPDIR: "/tmp/example/",
      PATH: "/bad/path",
      LANG: "en_AU.UTF-8",
      DYLD_LIBRARY_PATH: "/bad/lib",
      PYTHONPATH: "/bad/python",
      BLENDER_USER_SCRIPTS: "/bad/scripts",
      OCIO: "/bad/ocio"
    });

  assert.deepEqual(Object.keys(environment).sort(), [
    "HOME",
    "LANG",
    "PATH",
    "TMPDIR",
    "USER",
  ]);
  assert.equal(environment.HOME, "/Users/example");
  assert.equal(environment.USER, "example");
  assert.equal(environment.TMPDIR, "/tmp/example/");
  assert.equal(environment.PATH, "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin");
  assert.equal(environment.LANG, "en_AU.UTF-8");
});

test("building civic sports pavilion LaunchServices invocation is deterministic and quoted around the app bundle path", () => {
  const invocation =
    moduleUnderTest.buildBuildingCivicSportsPavilionLaunchServicesInvocation(
      undefined,
      {
        cwd: path.resolve(import.meta.dirname, ".."),
        runId: "launchservices-check",
        environment: {
          HOME: "/Users/example",
          USER: "example",
          TMPDIR: "/tmp/example/",
          LANG: "C.UTF-8"
        }
      }
    );

  assert.equal(invocation.executable, "open");
  assert.deepEqual(invocation.args.slice(0, 5), [
    "-W",
    "-n",
    "-a",
    "/Applications/Blender-4.2-LTS.app",
    "--args",
  ]);
  assert.match(invocation.command, /open -W -n -a \/Applications\/Blender-4\.2-LTS\.app --args/);
});

test("building civic sports pavilion completion marker detection requires final marker", () => {
  assert.equal(
    moduleUnderTest.detectBuildingCivicSportsPavilionCompletionMarker(
      "hello\nS174_PAVILION_MARKER_COMPLETE\nbye"
    ),
    true
  );
  assert.equal(
    moduleUnderTest.detectBuildingCivicSportsPavilionCompletionMarker(
      "hello\nS174_PAVILION_MARKER_GEOMETRY_COMPLETE\nbye"
    ),
    false
  );
});

test("building civic sports pavilion crash classification distinguishes shutdown crash from generation failure", () => {
  assert.equal(
    moduleUnderTest.classifyBuildingCivicSportsPavilionCrashState({
      exitCode: -11,
      signal: "SIGSEGV",
      completionMarkerReached: true,
      verifiedOutputsPresent: true
    }),
    "COMPLETED_WITH_BLENDER_SHUTDOWN_CRASH"
  );

  assert.equal(
    moduleUnderTest.classifyBuildingCivicSportsPavilionCrashState({
      exitCode: -11,
      signal: "SIGSEGV",
      completionMarkerReached: false,
      verifiedOutputsPresent: false
    }),
    "GENERATION_FAILED"
  );
});

test("building civic sports pavilion output verification detects missing, verified, and corrupt files", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-verification-")
  );
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 3, materialCount: 2, triangleCount: 24 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    Buffer.from("bad")
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
    JSON.stringify({ ok: true })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify({ ok: true })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-validation.json"),
    JSON.stringify({ ok: true })
  );

  const verification =
    moduleUnderTest.verifyBuildingCivicSportsPavilionOutputs(undefined, {
      cwd: tempRoot
    });

  const byName = new Map(verification.files.map((entry) => [entry.filename, entry]));
  assert.equal(
    byName.get("BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb").classification,
    "VERIFIED_COMPLETE"
  );
  assert.equal(
    byName.get("BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb").assetIdentityPreserved,
    true
  );
  assert.equal(
    byName.get("BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb").classification,
    "CORRUPT"
  );
  assert.equal(
    byName.get("BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb").classification,
    "MISSING"
  );
  assert.equal(
    byName.get("BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend").classification,
    "VERIFIED_COMPLETE"
  );
  assert.equal(
    byName.get("building-civic-sports-pavilion-manifest.json").classification,
    "VERIFIED_COMPLETE"
  );
});

test("building civic sports pavilion run summary records crash classification and completion marker reachability", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-summary-")
  );
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  const logDir = path.join(outputDir, "logs");
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, "stdout.log"), "S174_PAVILION_MARKER_COMPLETE\n");
  fs.writeFileSync(path.join(logDir, "stderr.log"), "");
  for (const name of [
    ["BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb", { meshCount: 6, materialCount: 4, triangleCount: 48 }],
    ["BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb", { meshCount: 4, materialCount: 3, triangleCount: 28 }],
    ["BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb", { meshCount: 2, materialCount: 2, triangleCount: 12 }],
  ]) {
    fs.writeFileSync(path.join(outputDir, name[0]), createMinimalGlb(name[1]));
  }
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"),
    Buffer.concat([Buffer.from("BLENDER"), Buffer.alloc(64)])
  );
  for (const name of [
    "building-civic-sports-pavilion-manifest.json",
    "building-civic-sports-pavilion-metadata.json",
    "building-civic-sports-pavilion-validation.json",
  ]) {
    fs.writeFileSync(path.join(outputDir, name), JSON.stringify({ ok: true }));
  }

  const summary = moduleUnderTest.summarizeBuildingCivicSportsPavilionRun(
    {
      exitCode: -11,
      signal: "SIGSEGV",
      stdoutLogPath: path.join(logDir, "stdout.log"),
      stderrLogPath: path.join(logDir, "stderr.log")
    },
    undefined,
    { cwd: tempRoot }
  );

  assert.equal(summary.completionMarkerReached, true);
  assert.equal(summary.verifiedOutputsPresent, true);
  assert.equal(summary.crashClassification, "COMPLETED_WITH_BLENDER_SHUTDOWN_CRASH");
});

test("building civic sports pavilion final GLB verification records decreasing LOD complexity", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-lod-verify-")
  );
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 7, materialCount: 5, triangleCount: 60 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 5, materialCount: 4, triangleCount: 36 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 3, materialCount: 2, triangleCount: 18 })
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
    JSON.stringify({ ok: true })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-metadata.json"),
    JSON.stringify({ atlasCompatibility: { atlasCompatible: true } })
  );
  fs.writeFileSync(
    path.join(outputDir, "building-civic-sports-pavilion-validation.json"),
    JSON.stringify({ ok: true })
  );

  const verification =
    moduleUnderTest.verifyBuildingCivicSportsPavilionOutputs(undefined, {
      cwd: tempRoot
    });

  assert.equal(verification.proofAssetsVerified, true);
  assert.equal(verification.lodComplexity.ok, true);
  assert.equal(verification.registrationGate.ready, true);
});

test("building civic sports pavilion registration gate blocks external GLB dependencies and bad LOD order", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-lod-block-")
  );
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 2, materialCount: 2, triangleCount: 8 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({
      meshCount: 5,
      materialCount: 4,
      triangleCount: 20,
      includeExternalDependency: true
    })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 1, materialCount: 1, triangleCount: 4 })
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
  for (const name of [
    "building-civic-sports-pavilion-manifest.json",
    "building-civic-sports-pavilion-metadata.json",
    "building-civic-sports-pavilion-validation.json",
  ]) {
    fs.writeFileSync(path.join(outputDir, name), JSON.stringify({ ok: true }));
  }

  const verification =
    moduleUnderTest.verifyBuildingCivicSportsPavilionOutputs(undefined, {
      cwd: tempRoot
    });

  assert.equal(verification.registrationGate.ready, false);
  assert.match(
    verification.registrationGate.blockers.join("\n"),
    /external files|greater than or equal/
  );
});

test("building civic sports pavilion verified output record writer updates manifest and validation from final GLBs only", () => {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "growgo-pavilion-record-writer-")
  );
  const outputDir = path.join(
    tempRoot,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
    createMinimalGlb({ meshCount: 8, materialCount: 5, triangleCount: 80 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    createMinimalGlb({ meshCount: 6, materialCount: 4, triangleCount: 44 })
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
    createMinimalGlb({ meshCount: 2, materialCount: 2, triangleCount: 12 })
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

  const writeResult =
    moduleUnderTest.writeBuildingCivicSportsPavilionVerifiedOutputRecords(
      undefined,
      { cwd: tempRoot }
    );

  assert.equal(writeResult.verification.registrationGate.ready, true);
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
  assert.equal(manifest.assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(
    validation.registrationReady,
    true
  );
  assert.equal(validation.finalGlbVerificationPassed, true);
});
