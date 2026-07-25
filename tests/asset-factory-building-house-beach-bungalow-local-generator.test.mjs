import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-beach-bungalow-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_house_beach_bungalow.py"
);

test("building house beach bungalow local generator validates recipe assembly metadata", () => {
  const result = moduleUnderTest.validateBuildingHouseBeachBungalowLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_HOUSE_BEACH_BUNGALOW_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "RECIPE_HOUSE_BEACH_BUNGALOW_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/HOUSE_BEACH_BUNGALOW_FAMILY_001/export"
  );
  assert.equal(
    result.localGenerator.definition.executionInstructions.preferredExecutionMode,
    "gui"
  );
});

test("building house beach bungalow Blender command points to the approved assembly-test script", () => {
  const command =
    moduleUnderTest.buildBuildingHouseBeachBungalowLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_building_house_beach_bungalow\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/HOUSE_BEACH_BUNGALOW_FAMILY_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("building house beach bungalow script references reused modules, coastal expansion modules, and metadata outputs", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_HOUSE_BEACH_BUNGALOW_001/);
  assert.match(script, /RECIPE_HOUSE_BEACH_BUNGALOW_001/);
  assert.match(script, /MOD_FOUNDATION_RAISED_COASTAL_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_LARGE_001/);
  assert.match(script, /MOD_DECK_TIMBER_COASTAL_001/);
  assert.match(script, /MOD_WALL_WEATHERBOARD_WHITE_001/);
  assert.match(script, /MOD_ROOF_GABLE_STANDARD_001/);
  assert.match(script, /MOD_PATH_STANDARD_001/);
  assert.match(script, /MOD_TREE_EUCALYPTUS_STANDARD_001/);
  assert.match(script, /TARGET_REUSE_PERCENTAGE = 79/);
  assert.match(script, /building-house-beach-bungalow-manifest\.json/);
  assert.match(script, /building-house-beach-bungalow-validation\.json/);
});
