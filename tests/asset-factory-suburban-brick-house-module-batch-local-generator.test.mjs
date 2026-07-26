import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-brick-house-module-batch-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_suburban_brick_house_modules.py"
);

test("suburban brick house module batch local generator validates approved module scope", () => {
  const result =
    moduleUnderTest.validateSuburbanBrickHouseModuleBatchLocalGenerator();

  assert.equal(result.ok, true);
  assert.deepEqual(result.localGenerator.definition.moduleIds, [
    "MOD_WALL_BRICK_SUBURBAN_001",
    "MOD_ROOF_TILE_STANDARD_001",
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_LETTERBOX_STANDARD_001",
    "MOD_ENTRY_PATH_SUBURBAN_001",
  ]);
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/SUBURBAN_BRICK_HOUSE_MODULE_BATCH_001/export"
  );
});

test("suburban brick house module batch Blender command points to the approved script and output location", () => {
  const command =
    moduleUnderTest.buildSuburbanBrickHouseModuleBatchLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_suburban_brick_house_modules\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/SUBURBAN_BRICK_HOUSE_MODULE_BATCH_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("suburban brick house module batch script contains module ids, recipe hooks, and export metadata wiring", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /MOD_WALL_BRICK_SUBURBAN_001/);
  assert.match(script, /MOD_ROOF_TILE_STANDARD_001/);
  assert.match(script, /MOD_GARAGE_RESIDENTIAL_STANDARD_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_STANDARD_001/);
  assert.match(script, /MOD_LETTERBOX_STANDARD_001/);
  assert.match(script, /MOD_ENTRY_PATH_SUBURBAN_001/);
  assert.match(script, /RECIPE_HOUSE_SUBURBAN_BRICK_001/);
  assert.match(script, /RECIPE_TOWNHOUSE_SUBURBAN_001/);
  assert.match(script, /LOD_CLOSE/);
  assert.match(script, /LOD_GAMEPLAY/);
  assert.match(script, /LOD_MAP/);
  assert.match(script, /suburban-brick-house-module-batch-1-manifest\.json/);
  assert.match(
    script,
    /"MOD_WALL_BRICK_SUBURBAN_001": "mod-wall-brick-suburban-001"/
  );
});
