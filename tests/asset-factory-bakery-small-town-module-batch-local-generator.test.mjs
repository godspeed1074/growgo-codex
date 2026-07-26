import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "bakery-small-town-module-batch-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_bakery_small_town_modules.py"
);

test("bakery small town module batch local generator validates approved module scope", () => {
  const result = moduleUnderTest.validateBakerySmallTownModuleBatchLocalGenerator();

  assert.equal(result.ok, true);
  assert.deepEqual(result.localGenerator.definition.moduleIds, [
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001",
  ]);
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export"
  );
});

test("bakery small town module batch Blender command points to the approved script and output location", () => {
  const command =
    moduleUnderTest.buildBakerySmallTownModuleBatchLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_bakery_small_town_modules\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/BAKERY_SMALL_TOWN_MODULE_BATCH_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("bakery small town module batch script contains module ids, recipe hooks, and export metadata wiring", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /MOD_BAKERY_DISPLAY_WINDOW_001/);
  assert.match(script, /MOD_BAKERY_SIGN_STANDARD_001/);
  assert.match(script, /MOD_BAKERY_COUNTER_FRONTAGE_001/);
  assert.match(script, /MOD_BAKERY_ROOFTOP_ICON_001/);
  assert.match(script, /RECIPE_BAKERY_SMALL_TOWN_001/);
  assert.match(script, /RECIPE_CAFE_COASTAL_001/);
  assert.match(script, /LOD_CLOSE/);
  assert.match(script, /LOD_GAMEPLAY/);
  assert.match(script, /LOD_MAP/);
  assert.match(script, /bakery-small-town-module-batch-1-manifest\.json/);
  assert.match(
    script,
    /"MOD_BAKERY_DISPLAY_WINDOW_001": "mod-bakery-display-window-001"/
  );
});
