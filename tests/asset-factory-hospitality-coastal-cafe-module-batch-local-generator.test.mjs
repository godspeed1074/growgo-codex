import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "hospitality-coastal-cafe-module-batch-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_hospitality_coastal_cafe_modules.py"
);

test("hospitality coastal cafe module batch local generator validates approved module scope", () => {
  const result =
    moduleUnderTest.validateHospitalityCoastalCafeModuleBatchLocalGenerator();

  assert.equal(result.ok, true);
  assert.deepEqual(result.localGenerator.definition.moduleIds, [
    "MOD_AWNING_COASTAL_CAFE_001",
    "MOD_CAFE_SIGN_STANDARD_001",
    "MOD_SERVICE_WINDOW_CAFE_001",
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
  ]);
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/HOSPITALITY_COASTAL_CAFE_MODULE_BATCH_001/export"
  );
});

test("hospitality coastal cafe module batch Blender command points to the approved script and output location", () => {
  const command =
    moduleUnderTest.buildHospitalityCoastalCafeModuleBatchLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_hospitality_coastal_cafe_modules\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/HOSPITALITY_COASTAL_CAFE_MODULE_BATCH_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("hospitality coastal cafe module batch script contains module ids, LOD exports, and batch metadata hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /MOD_AWNING_COASTAL_CAFE_001/);
  assert.match(script, /MOD_CAFE_SIGN_STANDARD_001/);
  assert.match(script, /MOD_SERVICE_WINDOW_CAFE_001/);
  assert.match(script, /MOD_OUTDOOR_TABLE_SEATING_COASTAL_001/);
  assert.match(script, /RECIPE_CAFE_COASTAL_001/);
  assert.match(script, /RECIPE_BAKERY_COASTAL_001/);
  assert.match(script, /LOD_CLOSE/);
  assert.match(script, /LOD_GAMEPLAY/);
  assert.match(script, /LOD_MAP/);
  assert.match(script, /hospitality-coastal-cafe-module-batch-1-manifest\.json/);
  assert.match(script, /"MOD_AWNING_COASTAL_CAFE_001": "mod-awning-coastal-cafe-001"/);
});
