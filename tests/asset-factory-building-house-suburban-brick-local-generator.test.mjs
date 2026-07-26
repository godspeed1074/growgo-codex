import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-suburban-brick-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_house_suburban_brick.py"
);

test("building house suburban brick local generator validates recipe assembly metadata", () => {
  const result = moduleUnderTest.validateBuildingHouseSuburbanBrickLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_HOUSE_SUBURBAN_BRICK_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "RECIPE_HOUSE_SUBURBAN_BRICK_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/HOUSE_SUBURBAN_BRICK_FAMILY_001/export"
  );
  assert.equal(
    result.localGenerator.definition.executionInstructions.preferredExecutionMode,
    "gui"
  );
});

test("building house suburban brick Blender command points to the approved assembly script", () => {
  const command =
    moduleUnderTest.buildBuildingHouseSuburbanBrickLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_building_house_suburban_brick\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/HOUSE_SUBURBAN_BRICK_FAMILY_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("building house suburban brick script references suburban modules, shared site modules, and metadata outputs", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_HOUSE_SUBURBAN_BRICK_001/);
  assert.match(script, /RECIPE_HOUSE_SUBURBAN_BRICK_001/);
  assert.match(script, /MOD_WALL_BRICK_SUBURBAN_001/);
  assert.match(script, /MOD_ROOF_TILE_STANDARD_001/);
  assert.match(script, /MOD_GARAGE_RESIDENTIAL_STANDARD_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_STANDARD_001/);
  assert.match(script, /MOD_LETTERBOX_STANDARD_001/);
  assert.match(script, /MOD_ENTRY_PATH_SUBURBAN_001/);
  assert.match(script, /MOD_PATH_STANDARD_001/);
  assert.match(script, /MOD_FENCE_STANDARD_001/);
  assert.match(script, /MOD_DRIVEWAY_STANDARD_SINGLE_001/);
  assert.match(script, /TARGET_REUSE_PERCENTAGE = 75/);
  assert.match(script, /building-house-suburban-brick-manifest\.json/);
  assert.match(script, /building-house-suburban-brick-validation\.json/);
});
