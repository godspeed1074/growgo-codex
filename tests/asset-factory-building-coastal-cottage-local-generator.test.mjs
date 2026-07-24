import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-coastal-cottage-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_building_coastal_cottage.py"
);

test("building coastal cottage local generator validates local Blender script metadata", () => {
  const result = moduleUnderTest.validateBuildingCoastalCottageLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerator.definition.assetId,
    "BUILDING_COASTAL_COTTAGE_001"
  );
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export"
  );
  assert.equal(result.localGenerator.compatibility.localExecutionOnly, true);
});

test("building coastal cottage local generator command targets the concrete Python script and output directory", () => {
  const command = moduleUnderTest.buildBuildingCoastalCottageLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_building_coastal_cottage\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_RESIDENTIAL_FAMILY_001\/export/
  );
});

test("building coastal cottage Python script includes required Blender scene collections and cottage generation hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
  assert.match(script, /def build_wall_geometry/);
  assert.match(script, /def build_roof_geometry/);
  assert.match(script, /def build_windows/);
  assert.match(script, /def build_doors/);
  assert.match(script, /def build_verandah/);
  assert.match(script, /def build_deck/);
  assert.match(script, /def build_fence_elements/);
  assert.match(script, /building-coastal-cottage-manifest\.json/);
  assert.match(script, /building-coastal-cottage-metadata\.json/);
  assert.match(script, /building-coastal-cottage-validation\.json/);
  assert.match(script, /BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE\.glb/);
  assert.match(script, /BUILDING_COASTAL_COTTAGE_001_LOD_GAMEPLAY\.glb/);
  assert.match(script, /BUILDING_COASTAL_COTTAGE_001_LOD_DISTANT_SILHOUETTE\.glb/);
  assert.match(script, /BUILDING_COASTAL_COTTAGE_001_LOD_MAP\.glb/);
});

test("building coastal cottage local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.buildingCoastalCottageLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation =
    "asset-factory/local-blender-scripts/other_asset.py";

  const result =
    moduleUnderTest.validateBuildingCoastalCottageLocalGenerator(
      invalidDefinition
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
