import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-local-generator.mjs"
  )
);

const pythonScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_tree_eucalyptus.py"
);

test("tree eucalyptus local generator validates local Blender script metadata", () => {
  const result = moduleUnderTest.validateTreeEucalyptusLocalGenerator();

  assert.equal(result.ok, true);
  assert.equal(result.localGenerator.definition.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(
    result.localGenerator.definition.expectedOutputLocation,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
  );
  assert.equal(result.localGenerator.compatibility.localExecutionOnly, true);
});

test("tree eucalyptus local generator command targets the concrete Python script and output directory", () => {
  const command = moduleUnderTest.buildTreeEucalyptusLocalBlenderCommand();

  assert.match(
    command,
    /blender --background --python asset-factory\/local-blender-scripts\/generate_tree_eucalyptus\.py/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/production\/COASTAL_NATURE_FAMILY_001\/export/
  );
});

test("tree eucalyptus Python script includes required Blender scene collections and tree generation hooks", () => {
  const script = fs.readFileSync(pythonScriptPath, "utf8");

  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
  assert.match(script, /def build_trunk_geometry/);
  assert.match(script, /def build_branch_structure/);
  assert.match(script, /def build_canopy_geometry/);
  assert.match(script, /MAT_EUCALYPTUS_BARK_001/);
  assert.match(script, /MAT_EUCALYPTUS_LEAF_001/);
  assert.match(script, /tree-eucalyptus-manifest\.json/);
  assert.match(script, /tree-eucalyptus-metadata\.json/);
  assert.match(script, /tree-eucalyptus-validation\.json/);
});

test("tree eucalyptus local generator rejects mismatched script locations safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.treeEucalyptusLocalGeneratorDefinition
  );
  invalidDefinition.scriptLocation = "asset-factory/local-blender-scripts/other_asset.py";

  const result = moduleUnderTest.validateTreeEucalyptusLocalGenerator(
    invalidDefinition
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "script_location_mismatch");
});
