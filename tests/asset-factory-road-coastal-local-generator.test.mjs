import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "road-coastal-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_road_coastal.py"
);

test("road coastal local generator validates local Blender script metadata", () => {
  const result = moduleUnderTest.validateRoadCoastalLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(result.localGenerator.definition.assetId, "ROAD_COASTAL_001");
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/COASTAL_INFRASTRUCTURE_FAMILY_001/export"
  );
  assert.equal(result.localGenerator.compatibility.localExecutionOnly, true);
});

test("road coastal local generator command targets the concrete Python script and output directory", () => {
  const command = moduleUnderTest.buildRoadCoastalLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_road_coastal\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_INFRASTRUCTURE_FAMILY_001\/export/
  );
});

test("road coastal Python script includes required Blender scene collections and road generation hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
  assert.match(script, /def build_road_geometry/);
  assert.match(script, /def build_road_surface/);
  assert.match(script, /def build_road_edges/);
  assert.match(script, /def build_road_shoulders/);
  assert.match(script, /def build_road_marking/);
  assert.match(script, /def build_connectors/);
  assert.match(script, /road-coastal-manifest\.json/);
  assert.match(script, /road-coastal-metadata\.json/);
  assert.match(script, /road-coastal-validation\.json/);
});

test("road coastal local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.roadCoastalLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation = "asset-factory/local-blender-scripts/other_asset.py";

  const result = moduleUnderTest.validateRoadCoastalLocalGenerator(invalidDefinition);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
