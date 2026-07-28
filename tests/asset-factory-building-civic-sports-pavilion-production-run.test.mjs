import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-production-run.mjs"
  )
);

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
});

test("building civic sports pavilion output inspector reports expected files when present", () => {
  const inspection =
    moduleUnderTest.inspectBuildingCivicSportsPavilionProductionOutputs(
      undefined,
      {
        cwd: path.resolve(import.meta.dirname, ".."),
      }
    );

  assert.equal(inspection.blenderRuntime.ok, true);
  assert.equal(Array.isArray(inspection.fileStates), true);
  assert.equal(inspection.fileStates.length, 7);
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
    Buffer.concat([Buffer.from("glTF"), Buffer.alloc(64)])
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
    Buffer.from("bad")
  );
  fs.writeFileSync(
    path.join(outputDir, "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"),
    Buffer.concat([Buffer.from("BLENDER"), Buffer.alloc(64)])
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
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb",
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
    "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb",
  ]) {
    fs.writeFileSync(path.join(outputDir, name), Buffer.concat([Buffer.from("glTF"), Buffer.alloc(64)]));
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
