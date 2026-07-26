import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-cafe-coastal-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_cafe_coastal.py"
);

test("building cafe coastal local generator validates recipe assembly metadata", () => {
  const result = moduleUnderTest.validateBuildingCafeCoastalLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_CAFE_COASTAL_001"
  );
  assert.equal(
    result.localGenerator.definition.recipeId,
    "RECIPE_CAFE_COASTAL_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/CAFE_COASTAL_FAMILY_001/export"
  );
  assert.equal(
    result.localGenerator.definition.executionInstructions.preferredExecutionMode,
    "gui"
  );
});

test("building cafe coastal Blender command points to the approved assembly script", () => {
  const command = moduleUnderTest.buildBuildingCafeCoastalLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_building_cafe_coastal\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/CAFE_COASTAL_FAMILY_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("building cafe coastal script references reused modules, hospitality modules, and validation outputs", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /BUILDING_CAFE_COASTAL_001/);
  assert.match(script, /RECIPE_CAFE_COASTAL_001/);
  assert.match(script, /MOD_FOUNDATION_STANDARD_RECT_001/);
  assert.match(script, /MOD_WALL_WEATHERBOARD_WHITE_001/);
  assert.match(script, /MOD_ROOF_GABLE_STANDARD_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_LARGE_001/);
  assert.match(script, /MOD_AWNING_COASTAL_CAFE_001/);
  assert.match(script, /MOD_CAFE_SIGN_STANDARD_001/);
  assert.match(script, /MOD_SERVICE_WINDOW_CAFE_001/);
  assert.match(script, /MOD_OUTDOOR_TABLE_SEATING_COASTAL_001/);
  assert.match(script, /TARGET_REUSE_PERCENTAGE = 75/);
  assert.match(script, /building-cafe-coastal-manifest\.json/);
  assert.match(script, /building-cafe-coastal-validation\.json/);
});
