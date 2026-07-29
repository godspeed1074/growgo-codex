import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const generatorPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/generate_coastal_grass_tussock_001.py"
);
const resumePath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_coastal_grass_tussock_001_exports.py"
);
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);

function compilePython(filename) {
  return spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        `source = Path(r'''${filename.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
        `compile(source, r'''${filename.replace(/\\/g, "\\\\")}''', 'exec')`
      ].join("; ")
    ],
    { encoding: "utf8" }
  );
}

test("coastal grass tussock generator and resume scripts are valid Python syntax", () => {
  for (const filename of [generatorPath, resumePath]) {
    const result = compilePython(filename);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
});

test("generator preserves identity and creates every required anchor", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /ASSET_ID = "COASTAL_GRASS_TUSSOCK_001"/);
  assert.match(script, /SOURCE_RECIPE_ID = "COASTAL_GRASS_TUSSOCK_RECIPE_001"/);
  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /PALETTE_ID = "AU_COASTAL_GRASS_NATIVE_001"/);
  assert.match(script, /LOD_PROFILE = "NATURE_LIGHTWEIGHT_001"/);
  assert.match(script, /COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_GRASS_TUSSOCK_001_LOD_MAP_IDENTITY_ANCHOR/);
  assert.match(script, /create_identity_anchor\(/);
  assert.match(script, /required_helpers=\("asset_identity_anchor_v2",\)/);
});

test("generator defines deterministic mobile-first papercut tussock geometry", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /CLOSE_BLADE_SPECS = \(/);
  assert.match(script, /GAMEPLAY_BLADE_SPECS = \(/);
  assert.match(script, /MAP_BLADE_SPECS = \(/);
  assert.match(script, /\(-0\.42, 0\.14, 0\.44\)/);
  assert.match(script, /\(0\.10, -0\.16, 0\.98\)/);
  assert.match(script, /\(0\.20, -0\.04, 0\.76\)/);
  assert.match(script, /primitive_cube_add/);
  assert.match(script, /primitive_ico_sphere_add\(subdivisions=1/);
  assert.match(script, /primitive_cylinder_add\(vertices=6/);
  assert.match(script, /growgo_papercut_2_5d/);
  assert.match(script, /growgo_mobile_first/);
  assert.match(script, /growgo_shared_material/);
  assert.match(script, /subtle front\/back depth/);
  assert.doesNotMatch(script, /\brandom\b/);
});

test("generator prepares three LOD roots but never exports GLBs", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /targetRevisionVersion": ASSET_VERSION/);
  assert.match(script, /coastal-grass-tussock-authoring-manifest\.json/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP\.glb"/);
  assert.match(script, /finalGlbsGenerated": False/);
  assert.doesNotMatch(script, /bpy\.ops\.export_scene\.gltf/);
  assert.doesNotMatch(script, /save_as_mainfile/);
});

test("resume workflow is deterministic identity-aware and universal-exporter based", () => {
  const script = fs.readFileSync(resumePath, "utf8");

  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /EXPECTED_BLEND_NAME = f"\{VERSIONED_ASSET_STEM\}\.blend"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP\.glb"/);
  assert.match(script, /write_export_manifest\(/);
  assert.match(script, /discover_lod_roots\(/);
  assert.match(script, /normalize_export_objects\(/);
  assert.match(script, /validate_export_identity\(/);
  assert.match(script, /validate_lod_metric_order\(metrics\)/);
  assert.match(script, /find_identity_anchor\(/);
  assert.match(script, /build_export_object_set\(/);
  assert.match(script, /select_export_object_set\(/);
  assert.match(script, /"export_extras": True/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.doesNotMatch(script, /register|publish|activate_runtime/i);
});

test("manual authoring setup record preserves setup-only safety contract", () => {
  const setup = JSON.parse(
    fs.readFileSync(
      path.join(
        productionRoot,
        "validation/coastal-grass-tussock-manual-authoring-setup.json"
      ),
      "utf8"
    )
  );

  assert.equal(setup.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(setup.version, "v001");
  assert.equal(setup.expectedBlend, "COASTAL_GRASS_TUSSOCK_001_v001.blend");
  assert.equal(
    setup.expectedBlendLocation,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GRASS_TUSSOCK_001_v001.blend"
  );
  assert.equal(setup.manualBlenderExecutionRequired, true);
  assert.equal(setup.blenderLaunched, false);
  assert.equal(setup.blendGenerated, false);
  assert.equal(setup.finalGlbsGenerated, false);
  assert.equal(setup.registered, false);
  assert.equal(setup.promoted, false);
  assert.equal(setup.published, false);
  assert.equal(setup.runtimeActivated, false);
  assert.equal(setup.readyForBlenderGeneration, true);
});

test("coastal grass tussock source blend is canonical in source and absent from export", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_GRASS_TUSSOCK_001_v001.blend")
    ),
    true
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_GRASS_TUSSOCK_001_v001.blend")
    ),
    false
  );
});
