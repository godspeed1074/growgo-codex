import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-coastal-cottage-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_house_coastal_cottage.py"
);

test("building house coastal cottage local generator validates proof-build metadata", () => {
  const result = moduleUnderTest.validateBuildingHouseCoastalCottageLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_HOUSE_COASTAL_COTTAGE_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "RECIPE_HOUSE_COASTAL_COTTAGE_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export"
  );
});

test("building house coastal cottage Blender command points to the approved proof-build script", () => {
  const command =
    moduleUnderTest.buildBuildingHouseCoastalCottageLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_building_house_coastal_cottage\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/HOUSE_COASTAL_FAMILY_001\/export/
  );
});

test("building house coastal cottage script contains phase outputs and validation metadata hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_HOUSE_COASTAL_COTTAGE_001/);
  assert.match(script, /RECIPE_HOUSE_COASTAL_COTTAGE_001/);
  assert.match(script, /HOUSE_COASTAL_COTTAGE_SHELL_TEST/);
  assert.match(script, /MOD_FOUNDATION_STANDARD_RECT_001/);
  assert.match(script, /MOD_WALL_WEATHERBOARD_WHITE_001/);
  assert.match(script, /MOD_WALL_CORNER_STANDARD_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_STANDARD_001/);
  assert.match(script, /MOD_DOOR_STANDARD_RESIDENTIAL_001/);
  assert.match(script, /MOD_ROOF_GABLE_STANDARD_001/);
  assert.match(script, /SOCKET_TOP_EDGE/);
  assert.match(script, /SOCKET_WINDOW_STANDARD/);
  assert.match(script, /SOCKET_DOOR_STANDARD/);
  assert.match(script, /SOCKET_ROOF_RIDGE/);
  assert.match(script, /MOD_PATH_STANDARD_001/);
  assert.match(script, /MOD_FENCE_STANDARD_001/);
  assert.match(script, /MOD_GROUND_GRASS_STANDARD_001/);
  assert.match(script, /MOD_BUSH_NATIVE_STANDARD_001/);
  assert.match(script, /MOD_TREE_EUCALYPTUS_STANDARD_001/);
  assert.match(script, /MOD_DRIVEWAY_STANDARD_SINGLE_001/);
  assert.match(script, /MOD_FLOWERBED_STANDARD_001/);
  assert.match(script, /MOD_VERANDAH_STANDARD_TIMBER_001/);
  assert.match(script, /MOD_PORCH_COASTAL_SMALL_001/);
  assert.match(script, /MOD_TRIM_STANDARD_COASTAL_001/);
  assert.match(script, /MOD_CHIMNEY_COASTAL_SMALL_001/);
  assert.match(script, /layer-a-expansion-batch-1-metadata\.json/);
  assert.match(script, /layer-a-expansion-batch-1-validation\.json/);
  assert.match(script, /building-house-coastal-cottage-validation\.json/);
});
