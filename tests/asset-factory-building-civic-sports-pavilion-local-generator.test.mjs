import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-civic-sports-pavilion-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_civic_sports_pavilion.py"
);

test("building civic sports pavilion local generator validates recipe assembly metadata", () => {
  const result =
    moduleUnderTest.validateBuildingCivicSportsPavilionLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "SPORTS_FACILITY_RECIPE_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
  );
  assert.equal(
    result.localGenerator.definition.executionInstructions.preferredExecutionMode,
    "background"
  );
});

test("building civic sports pavilion Blender command points to the approved authoring script", () => {
  const command =
    moduleUnderTest.buildBuildingCivicSportsPavilionLocalBlenderCommand();

  assert.match(
    command,
    /\/Applications\/Blender-4\.2-LTS\.app\/Contents\/MacOS\/Blender --background --factory-startup -noaudio --python-exit-code 1 --python asset-factory\/local-blender-scripts\/generate_building_civic_sports_pavilion\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/CIVIC_SPORTS_PAVILION_FAMILY_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("building civic sports pavilion script references deterministic palette, shared modules, and output files", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_CIVIC_SPORTS_PAVILION_001/);
  assert.match(script, /SPORTS_FACILITY_RECIPE_001/);
  assert.match(script, /MOD_FOUNDATION_STANDARD_RECT_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_LARGE_001/);
  assert.match(script, /MOD_PATH_STANDARD_001/);
  assert.match(script, /MOD_GROUND_GRASS_STANDARD_001/);
  assert.match(script, /MOD_FENCE_STANDARD_001/);
  assert.match(script, /TARGET_REUSE_PERCENTAGE = 60/);
  assert.match(script, /CIVIC_SPORTS_PAPERCUT_001/);
  assert.match(script, /building-civic-sports-pavilion-manifest\.json/);
  assert.match(script, /BLEND_OUTPUT = f"\{ASSET_ID\}_v001\.blend"/);
  assert.match(script, /TEMP_BLEND_OUTPUT = f"\{ASSET_ID\}_v001\.tmp\.blend"/);
  assert.match(script, /export_root_atomically/);
  assert.match(script, /temp_filepath\.replace\(filepath\)/);
  assert.match(script, /S174_PAVILION_MARKER_COMPLETE/);
  assert.match(script, /LOD_EXPORT_START_PREFIX/);
  assert.match(script, /LOD_EXPORT_COMPLETE_PREFIX/);
});

test("building civic sports pavilion Blender script is valid Python syntax", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        "source = Path(r'''"
          + pythonScriptPath.replace(/\\/g, "\\\\")
          + "''').read_text(encoding='utf8')",
        "compile(source, r'''"
          + pythonScriptPath.replace(/\\/g, "\\\\")
          + "''', 'exec')",
      ].join("; "),
    ],
    {
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
