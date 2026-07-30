import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const generatorPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/generate_coastal_water_edge_001.py"
);
const resumePath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_coastal_water_edge_001_exports.py"
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

test("coastal water edge generator and resume scripts are valid Python syntax", () => {
  for (const filename of [generatorPath, resumePath]) {
    const result = compilePython(filename);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
});

test("generator preserves identity and creates every required root and anchor", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /ASSET_ID = "COASTAL_WATER_EDGE_001"/);
  assert.match(script, /SOURCE_RECIPE_ID = "COASTAL_WATER_EDGE_RECIPE_001"/);
  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /PALETTE_ID = "AU_COASTAL_WATER_EDGE_001"/);
  assert.match(script, /LOD_PROFILE = "NATURE_LIGHTWEIGHT_001"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /COASTAL_WATER_EDGE_001_LOD_CLOSE_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_WATER_EDGE_001_LOD_GAMEPLAY_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_WATER_EDGE_001_LOD_MAP_IDENTITY_ANCHOR/);
  assert.match(script, /create_identity_anchor\(/);
  assert.match(script, /required_helpers=\("asset_identity_anchor_v2",\)/);
});

test("generator defines deterministic mobile-first papercut shoreline transition geometry", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /CLOSE_STRIP_SPECS = \(/);
  assert.match(script, /GAMEPLAY_STRIP_SPECS = \(/);
  assert.match(script, /MAP_STRIP_SPECS = \(/);
  assert.match(script, /\(-0\.56, 0\.08, 0\.14\)/);
  assert.match(script, /\(0\.18, 0\.10, 0\.18\)/);
  assert.match(script, /\(0\.02, 0\.00, 0\.06\)/);
  assert.match(script, /primitive_cube_add/);
  assert.match(script, /primitive_ico_sphere_add\(subdivisions=1/);
  assert.match(script, /primitive_cylinder_add\(vertices=6/);
  assert.match(script, /growgo_papercut_2_5d/);
  assert.match(script, /growgo_mobile_first/);
  assert.match(script, /growgo_repeat_ready/);
  assert.match(script, /growgo_deterministic_placement_compatible/);
  assert.match(script, /without using transparency or simulated water effects/);
  assert.doesNotMatch(script, /\brandom\b/);
});

test("generator prepares three LOD roots but never exports GLBs", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /coastal-water-edge-authoring-manifest\.json/);
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
  assert.match(script, /coastal-water-edge-export-manifest\.json/);
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

test("manual authoring setup record preserves identity, folder contract, and setup-only safety", () => {
  const setup = JSON.parse(
    fs.readFileSync(
      path.join(
        productionRoot,
        "validation/coastal-water-edge-manual-authoring-setup.json"
      ),
      "utf8"
    )
  );

  assert.equal(setup.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(setup.version, "v001");
  assert.equal(setup.expectedBlend, "COASTAL_WATER_EDGE_001_v001.blend");
  assert.equal(
    setup.expectedBlendLocation,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_WATER_EDGE_001_v001.blend"
  );
  assert.deepEqual(setup.expectedLodRoots, [
    "COASTAL_WATER_EDGE_001_LOD_CLOSE_ROOT",
    "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY_ROOT",
    "COASTAL_WATER_EDGE_001_LOD_MAP_ROOT"
  ]);
  assert.equal(setup.folderContract.blendFilesAllowedInExport, false);
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

test("coastal water edge source/export contract keeps source canonical and export free of asset-specific blend leakage after export", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_WATER_EDGE_001_v001.blend")
    ),
    true
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_WATER_EDGE_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_WATER_EDGE_001_LOD_CLOSE.glb")
    ),
    true
  );
});
