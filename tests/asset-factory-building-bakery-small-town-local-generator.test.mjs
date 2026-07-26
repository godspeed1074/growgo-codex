import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-bakery-small-town-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_bakery_small_town.py"
);

test("building bakery small town local generator validates recipe assembly metadata", () => {
  const result = moduleUnderTest.validateBuildingBakerySmallTownLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_BAKERY_SMALL_TOWN_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "RECIPE_BAKERY_SMALL_TOWN_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/BAKERY_SMALL_TOWN_FAMILY_001/export"
  );
  assert.equal(
    result.localGenerator.definition.executionInstructions.preferredExecutionMode,
    "gui"
  );
});

test("building bakery small town Blender command points to the approved assembly script", () => {
  const command =
    moduleUnderTest.buildBuildingBakerySmallTownLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_building_bakery_small_town\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/BAKERY_SMALL_TOWN_FAMILY_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("building bakery small town script references reused modules, hospitality modules, bakery identity modules, and validation outputs", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_BAKERY_SMALL_TOWN_001/);
  assert.match(script, /RECIPE_BAKERY_SMALL_TOWN_001/);
  assert.match(script, /MOD_FOUNDATION_STANDARD_RECT_001/);
  assert.match(script, /MOD_WALL_WEATHERBOARD_WHITE_001/);
  assert.match(script, /MOD_ROOF_GABLE_STANDARD_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_LARGE_001/);
  assert.match(script, /MOD_AWNING_COASTAL_CAFE_001/);
  assert.match(script, /MOD_CAFE_SIGN_STANDARD_001/);
  assert.match(script, /MOD_SERVICE_WINDOW_CAFE_001/);
  assert.match(script, /MOD_OUTDOOR_TABLE_SEATING_COASTAL_001/);
  assert.match(script, /MOD_BAKERY_DISPLAY_WINDOW_001/);
  assert.match(script, /MOD_BAKERY_SIGN_STANDARD_001/);
  assert.match(script, /MOD_BAKERY_COUNTER_FRONTAGE_001/);
  assert.match(script, /MOD_BAKERY_ROOFTOP_ICON_001/);
  assert.match(script, /TARGET_REUSE_PERCENTAGE = 80/);
  assert.match(script, /building-bakery-small-town-manifest\.json/);
  assert.match(script, /building-bakery-small-town-validation\.json/);
});
