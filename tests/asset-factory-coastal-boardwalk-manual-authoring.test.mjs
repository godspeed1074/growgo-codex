import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const generatorPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/generate_coastal_boardwalk_001.py"
);
const resumePath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_coastal_boardwalk_001_exports.py"
);
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001"
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

test("coastal boardwalk generator and resume scripts are valid Python syntax", () => {
  for (const filename of [generatorPath, resumePath]) {
    const result = compilePython(filename);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
});

test("generator preserves identity and creates every required root and anchor", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /ASSET_ID = "COASTAL_BOARDWALK_001"/);
  assert.match(script, /SOURCE_RECIPE_ID = "COASTAL_BOARDWALK_RECIPE_001"/);
  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /PALETTE_ID = "AU_COASTAL_BOARDWALK_001"/);
  assert.match(script, /LOD_PROFILE = "PATHWAY_LIGHTWEIGHT_001"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /COASTAL_BOARDWALK_001_LOD_CLOSE_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_BOARDWALK_001_LOD_GAMEPLAY_IDENTITY_ANCHOR/);
  assert.match(script, /COASTAL_BOARDWALK_001_LOD_MAP_IDENTITY_ANCHOR/);
  assert.match(script, /create_identity_anchor\(/);
  assert.match(script, /required_helpers=\("asset_identity_anchor_v2",\)/);
});

test("generator defines deterministic papercut boardwalk modules with straight and curve-ready support", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /CLOSE_DECK_SPECS = \(/);
  assert.match(script, /GAMEPLAY_DECK_SPECS = \(/);
  assert.match(script, /MAP_DECK_SPECS = \(/);
  assert.match(script, /POST_SPECS = {/);
  assert.match(script, /RAIL_SPECS = {/);
  assert.match(script, /MOD_BOARDWALK_DECK_SEGMENT_001/);
  assert.match(script, /MOD_BOARDWALK_POST_RAIL_SET_001/);
  assert.match(script, /MOD_BOARDWALK_GROUND_SOCKET_COASTAL_001/);
  assert.match(script, /growgo_papercut_2_5d/);
  assert.match(script, /growgo_curve_ready_layout/);
  assert.match(script, /growgo_future_boardwalk_expansion_compatible/);
  assert.match(script, /COASTAL_GRAVEL_PATH_001/);
  assert.match(script, /COASTAL_WATER_EDGE_001/);
  assert.doesNotMatch(script, /\brandom\b/);
});

test("generator prepares three LOD roots but never exports GLBs", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /coastal-boardwalk-authoring-manifest\.json/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP\.glb"/);
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
  assert.match(script, /coastal-boardwalk-export-manifest\.json/);
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
        "validation/coastal-boardwalk-manual-authoring-setup.json"
      ),
      "utf8"
    )
  );

  assert.equal(setup.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(setup.version, "v001");
  assert.equal(setup.expectedBlend, "COASTAL_BOARDWALK_001_v001.blend");
  assert.equal(
    setup.expectedBlendLocation,
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_BOARDWALK_001_v001.blend"
  );
  assert.deepEqual(setup.expectedLodRoots, [
    "COASTAL_BOARDWALK_001_LOD_CLOSE_ROOT",
    "COASTAL_BOARDWALK_001_LOD_GAMEPLAY_ROOT",
    "COASTAL_BOARDWALK_001_LOD_MAP_ROOT"
  ]);
  assert.equal(setup.folderContract.blendFilesAllowedInExport, false);
  assert.equal(setup.manualBlenderExecutionRequired, true);
  assert.equal(setup.blendGenerated, false);
  assert.equal(setup.finalGlbsGenerated, false);
  assert.equal(setup.registered, false);
  assert.equal(setup.promoted, false);
  assert.equal(setup.published, false);
  assert.equal(setup.runtimeActivated, false);
  assert.equal(setup.readyForBlenderGeneration, true);
  assert.equal(setup.authoringDesignRules.straightSectionsIncluded, true);
  assert.equal(setup.authoringDesignRules.curveReadyLayout, true);
});

test("coastal boardwalk source/export contract stays pre-generation clean", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_BOARDWALK_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_BOARDWALK_001_v001.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_BOARDWALK_001_LOD_CLOSE.glb")
    ),
    false
  );
});
