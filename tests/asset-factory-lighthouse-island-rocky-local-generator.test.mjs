import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "lighthouse-island-rocky-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_lighthouse_island_rocky.py"
);

test("lighthouse island rocky local generator validates local Blender script metadata", () => {
  const result = moduleUnderTest.validateLighthouseIslandRockyLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(result.localGenerator.definition.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/COASTAL_LIGHTHOUSE_FAMILY_001/export"
  );
  assert.equal(result.localGenerator.compatibility.localExecutionOnly, true);
});

test("lighthouse island rocky local generator command targets the concrete Python script and output directory", () => {
  const command = moduleUnderTest.buildLighthouseIslandRockyLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_lighthouse_island_rocky\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_LIGHTHOUSE_FAMILY_001\/export/
  );
});

test("lighthouse island rocky Python script includes required Blender scene collections, lighthouse generation hooks, and appearance metadata", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
  assert.match(script, /def build_tower_geometry/);
  assert.match(script, /def build_lantern_room/);
  assert.match(script, /def build_roof/);
  assert.match(script, /def build_balcony_components/);
  assert.match(script, /def build_rocky_base/);
  assert.match(script, /def build_path/);
  assert.match(script, /def build_fence/);
  assert.match(script, /lighthouse-island-rocky-manifest\.json/);
  assert.match(script, /lighthouse-island-rocky-metadata\.json/);
  assert.match(script, /lighthouse-island-rocky-validation\.json/);
  assert.match(script, /"day"/);
  assert.match(script, /"sunset"/);
  assert.match(script, /"night"/);
  assert.match(script, /LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE\.glb/);
  assert.match(script, /LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY\.glb/);
  assert.match(script, /LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE\.glb/);
  assert.match(script, /LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP\.glb/);
});

test("lighthouse island rocky local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.lighthouseIslandRockyLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation =
    "asset-factory/local-blender-scripts/other_asset.py";

  const result =
    moduleUnderTest.validateLighthouseIslandRockyLocalGenerator(invalidDefinition);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
