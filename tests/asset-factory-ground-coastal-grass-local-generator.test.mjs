import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_ground_coastal_grass.py"
);

test("ground coastal grass local generator validates local Blender script metadata", () => {
  const result = moduleUnderTest.validateGroundCoastalGrassLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(result.localGenerator.definition.assetId, "GROUND_COASTAL_GRASS_001");
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export"
  );
  assert.equal(result.localGenerator.compatibility.localExecutionOnly, true);
});

test("ground coastal grass local generator command targets the concrete Python script and output directory", () => {
  const command = moduleUnderTest.buildGroundCoastalGrassLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_ground_coastal_grass\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_GROUND_FAMILY_001\/export/
  );
});

test("ground coastal grass Python script includes required Blender scene collections and generation hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
  assert.match(script, /def build_coastal_grass_geometry/);
  assert.match(script, /def create_materials/);
  assert.match(script, /def build_lod_outputs/);
  assert.match(script, /def export_glb_files/);
  assert.match(script, /def write_asset_metadata/);
});

test("ground coastal grass local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.groundCoastalGrassLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation = "asset-factory/local-blender-scripts/other_asset.py";

  const result = moduleUnderTest.validateGroundCoastalGrassLocalGenerator(
    invalidDefinition
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
