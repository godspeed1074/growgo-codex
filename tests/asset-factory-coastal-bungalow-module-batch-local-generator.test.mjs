import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-bungalow-module-batch-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_coastal_bungalow_modules.py"
);

test("coastal bungalow module batch local generator validates approved batch metadata", () => {
  const result = moduleUnderTest.validateCoastalBungalowModuleBatchLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.batchId,
    "COASTAL_EXPANSION_MODULE_BATCH_1"
  );
  assert.deepEqual(result.localGenerator.definition.moduleIds, [
    "MOD_FOUNDATION_RAISED_COASTAL_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_DECK_TIMBER_COASTAL_001",
  ]);
  assert.equal(result.localGenerator.compatibility.guiExecutionPreferred, true);
});

test("coastal bungalow module batch Blender command targets the concrete Python script and output directory", () => {
  const command =
    moduleUnderTest.buildCoastalBungalowModuleBatchLocalBlenderCommand();

  assert.match(
    command,
    /blender --factory-startup --python asset-factory\/local-blender-scripts\/generate_coastal_bungalow_modules\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_EXPANSION_MODULE_BATCH_001\/export/
  );
  assert.match(command, /--auto-quit/);
});

test("coastal bungalow module batch Python script includes required module builders and metadata hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /MOD_FOUNDATION_RAISED_COASTAL_001/);
  assert.match(script, /MOD_WINDOW_RESIDENTIAL_LARGE_001/);
  assert.match(script, /MOD_DECK_TIMBER_COASTAL_001/);
  assert.match(script, /def build_foundation_variants/);
  assert.match(script, /def build_window_variants/);
  assert.match(script, /def build_deck_variants/);
  assert.match(script, /SOCKET_WINDOW_LARGE/);
  assert.match(script, /SOCKET_PATH_ENTRY/);
  assert.match(script, /coastal-expansion-module-batch-1-registration\.json/);
  assert.match(script, /mod-foundation-raised-coastal-001/);
});

test("coastal bungalow module batch local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.coastalBungalowModuleBatchLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation = "asset-factory/local-blender-scripts/other_asset.py";

  const result =
    moduleUnderTest.validateCoastalBungalowModuleBatchLocalGenerator(
      invalidDefinition
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
