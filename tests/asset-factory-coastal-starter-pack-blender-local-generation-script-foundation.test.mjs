import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-pack-blender-local-generation-script-foundation.mjs"
  )
);

test("local Blender generation script foundation validates the coastal grass local script contract", () => {
  const result =
    moduleUnderTest.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.localGenerationScriptFoundation.foundation.assetId,
    "GROUND_COASTAL_GRASS_001"
  );
  assert.equal(
    result.localGenerationScriptFoundation.foundation.executionTarget.intendedExecutionHost,
    "developer-machine"
  );
  assert.equal(
    result.localGenerationScriptFoundation.compatibility.localOnlyExecutionVerified,
    true
  );
});

test("local Blender generation Python script includes the required collections and entry points", () => {
  const script =
    moduleUnderTest.buildCoastalStarterPackBlenderLocalGenerationPythonScript();

  assert.match(script, /def generate_asset_package\(/);
  assert.match(script, /def export_asset_package\(/);
  assert.match(script, /GEOMETRY/);
  assert.match(script, /MATERIALS/);
  assert.match(script, /LOD0/);
  assert.match(script, /LOD1/);
  assert.match(script, /LOD2/);
  assert.match(script, /LOD3/);
  assert.match(script, /EXPORT/);
});

test("local Blender generation Python script is explicitly intended for local Blender execution", () => {
  const script =
    moduleUnderTest.buildCoastalStarterPackBlenderLocalGenerationPythonScript();

  assert.match(script, /developer machine/i);
  assert.match(script, /Blender Python/i);
  assert.match(script, /write_asset_manifest_json/);
});

test("local Blender generation script foundation rejects scene contract drift safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition
  );
  invalidDefinition.sceneHelpers.collections = [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "EXPORT"
  ];

  const result =
    moduleUnderTest.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation(
      invalidDefinition
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "scene_contract_mismatch");
});

test("local Blender generation script foundation rejects non-GLB export safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition
  );
  invalidDefinition.exportHelpers.exportFormat = "gltf";

  const result =
    moduleUnderTest.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation(
      invalidDefinition
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "export_format_mismatch");
});
