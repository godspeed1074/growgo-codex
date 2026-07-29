import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const generatorScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_tree_bottlebrush_001.py"
);
const resumeScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "resume_tree_bottlebrush_001_exports.py"
);
const anchorHelperPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "asset_identity_anchor_v2.py"
);
const bootstrapHelperPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "growgo_blender_bootstrap.py"
);

test("tree bottlebrush generator script is valid Python syntax", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        `source = Path(r'''${generatorScriptPath.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
        `compile(source, r'''${generatorScriptPath.replace(/\\/g, "\\\\")}''', 'exec')`,
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("tree bottlebrush generator script uses bootstrap identity anchors lod roots and metadata", () => {
  const script = fs.readFileSync(generatorScriptPath, "utf8");

  assert.match(script, /SOURCE_RECIPE_ID = "TREE_BOTTLEBRUSH_RECIPE_001"/);
  assert.match(script, /REGISTRY_RECIPE_ID = "RECIPE_NATURE_ROADSIDE_NATIVE_STANDARD_001"/);
  assert.match(script, /ASSET_CATEGORY = "nature"/);
  assert.match(script, /PREVIOUS_REGISTERED_VERSION = "v001"/);
  assert.match(script, /ASSET_VERSION = "v002"/);
  assert.match(script, /VERSIONED_ASSET_STEM = f"\{ASSET_ID\}_\{ASSET_VERSION\}"/);
  assert.match(script, /EXPECTED_BLEND_FILENAME = f"\{VERSIONED_ASSET_STEM\}\.blend"/);
  assert.match(script, /VARIANT_ID = "DEFAULT"/);
  assert.match(script, /PALETTE_ID = "AU_BOTTLEBRUSH_NATIVE_001"/);
  assert.match(script, /LOD_PROFILE = "NATURE_STANDARD_001"/);
  assert.match(script, /IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"/);
  assert.match(script, /DEPENDENCY_IDS = \(/);
  assert.match(script, /MOD_TREE_TRUNK_BOTTLEBRUSH_001/);
  assert.match(script, /MOD_TREE_BRANCH_BOTTLEBRUSH_001/);
  assert.match(script, /MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001/);
  assert.match(script, /MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001/);
  assert.match(script, /MOD_TREE_GROUND_SOCKET_001/);
  assert.match(script, /bootstrap_local_blender_scripts\(/);
  assert.match(script, /required_helpers=\("asset_identity_anchor_v2",\)/);
  assert.match(script, /from asset_identity_anchor_v2 import create_identity_anchor, write_identity_properties/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /create_identity_anchor\(/);
  assert.match(script, /tree-bottlebrush-\{ASSET_VERSION\}-manifest\.json/);
  assert.match(script, /tree-bottlebrush-\{ASSET_VERSION\}-metadata\.json/);
  assert.match(script, /tree-bottlebrush-\{ASSET_VERSION\}-validation\.json/);
  assert.match(script, /"previousRegisteredVersion": PREVIOUS_REGISTERED_VERSION/);
  assert.match(script, /"targetRevisionVersion": ASSET_VERSION/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_MAP\.glb"/);
  assert.match(script, /"manualBlenderExecutionRequired": True/);
  assert.doesNotMatch(script, /cycles/i);
  assert.doesNotMatch(script, /composit/i);
  assert.doesNotMatch(script, /denois/i);
  assert.doesNotMatch(script, /OpenEXR/i);
});

test("tree bottlebrush generator script declares papercut mobile native and road-trail workflow signals", () => {
  const script = fs.readFileSync(generatorScriptPath, "utf8");

  assert.match(script, /GrowGo papercut 2\.5D style/);
  assert.match(script, /lightweight mobile geometry/);
  assert.match(script, /Australian native vegetation identity/);
  assert.match(script, /road\/trail placement suitability/);
  assert.match(script, /Bottlebrush flower red should remain warmer than foliage green/);
  assert.match(script, /electric blue leaves/);
  assert.match(script, /pure black foliage/);
  assert.match(script, /neon magenta flowers/);
});

test("tree bottlebrush generator script defines deterministic non-planar canopy layout with depth offsets", () => {
  const script = fs.readFileSync(generatorScriptPath, "utf8");

  assert.match(script, /CLOSE_LEAF_SPECS = \(/);
  assert.match(script, /f"\{ASSET_ID\}_LEAF_CLUSTER_MAIN_004"/);
  assert.match(script, /f"\{ASSET_ID\}_LEAF_CLUSTER_MAIN_005"/);
  assert.match(script, /\(-0\.32, 0\.18, 3\.46\)/);
  assert.match(script, /\(0\.04, -0\.34, 3\.64\)/);
  assert.match(script, /\(-0\.18, -0\.22, 3\.20\)/);
  assert.match(script, /\(0\.22, 0\.36, 3\.12\)/);
  assert.match(script, /for name, location, rotation, scale, material_slot in CLOSE_LEAF_SPECS:/);
});

test("tree bottlebrush generator script improves flower visibility from multiple view angles", () => {
  const script = fs.readFileSync(generatorScriptPath, "utf8");

  assert.match(script, /CLOSE_FLOWER_SPECS = \(/);
  assert.match(script, /f"\{ASSET_ID\}_FLOWER_CLUSTER_MAIN_004"/);
  assert.match(script, /f"\{ASSET_ID\}_FLOWER_CLUSTER_MAIN_005"/);
  assert.match(script, /\(-0\.38, 0\.22, 3\.66\)/);
  assert.match(script, /\(0\.10, -0\.30, 3\.88\)/);
  assert.match(script, /\(-0\.06, 0\.40, 3\.56\)/);
  assert.match(script, /\(0\.26, -0\.14, 3\.34\)/);
  assert.match(script, /for name, location, rotation, scale, material_slot in CLOSE_FLOWER_SPECS:/);
});

test("tree bottlebrush generator script keeps proportional lod canopy coverage ordering", () => {
  const script = fs.readFileSync(generatorScriptPath, "utf8");

  assert.match(script, /GAMEPLAY_KEEP = \(/);
  assert.match(script, /MAP_KEEP = \(/);
  assert.match(script, /f"\{ASSET_ID\}_LEAF_CLUSTER_MAIN_004"/);
  assert.match(script, /f"\{ASSET_ID\}_FLOWER_CLUSTER_MAIN_004"/);
  assert.match(script, /f"\{ASSET_ID\}_LEAF_CLUSTER_MAIN_005"/);
  assert.match(script, /f"\{ASSET_ID\}_FLOWER_CLUSTER_MAIN_003"/);
  assert.match(script, /duplicate_for_lod\([\s\S]*GAMEPLAY_KEEP[\s\S]*LOD_GAMEPLAY/);
  assert.match(script, /duplicate_for_lod\([\s\S]*MAP_KEEP[\s\S]*LOD_MAP/);
});

test("tree bottlebrush manual resume script is valid Python syntax", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        `source = Path(r'''${resumeScriptPath.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
        `compile(source, r'''${resumeScriptPath.replace(/\\/g, "\\\\")}''', 'exec')`,
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("tree bottlebrush manual resume script includes blender 4.2 safe deterministic export identity validation", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /SOURCE_RECIPE_ID = "TREE_BOTTLEBRUSH_RECIPE_001"/);
  assert.match(script, /PREVIOUS_REGISTERED_VERSION = "v001"/);
  assert.match(script, /ASSET_VERSION = "v002"/);
  assert.match(script, /VERSIONED_ASSET_STEM = f"\{ASSET_ID\}_\{ASSET_VERSION\}"/);
  assert.match(script, /EXPECTED_BLEND_NAME = f"\{VERSIONED_ASSET_STEM\}\.blend"/);
  assert.match(script, /PALETTE_ID = "AU_BOTTLEBRUSH_NATIVE_001"/);
  assert.match(script, /DEPENDENCY_IDS = \(/);
  assert.match(script, /MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001/);
  assert.match(script, /ASSET_GUARD_MARKER/);
  assert.match(script, /RECIPE_GUARD_MARKER/);
  assert.match(script, /VERSION_GUARD_MARKER/);
  assert.match(script, /validate_pre_export_identity/);
  assert.match(script, /validate_export_preflight/);
  assert.match(script, /metadata_matches_dependency_contract/);
  assert.match(script, /collect_glb_metadata_hits/);
  assert.match(script, /determine_exported_identity_source/);
  assert.match(script, /export_kwargs = \{/);
  assert.match(script, /optional_export_kwargs = \{/);
  assert.match(script, /"export_extras": True/);
  assert.match(script, /"export_colors": False/);
  assert.match(script, /get_rna_type\(\)\.properties\.keys\(\)/);
  assert.match(script, /temp_path = build_temp_glb_path\(final_path\)/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{VERSIONED_ASSET_STEM\}_LOD_MAP\.glb"/);
  assert.doesNotMatch(script, /\.glb\.tmp/);
  assert.doesNotMatch(script, /\.glb\.tmp\.glb/);
});

test("tree bottlebrush revision workflow preserves v001 while preparing only v002 outputs", () => {
  const generatorScript = fs.readFileSync(generatorScriptPath, "utf8");
  const resumeScript = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(generatorScript, /PREVIOUS_REGISTERED_VERSION = "v001"/);
  assert.match(generatorScript, /ASSET_VERSION = "v002"/);
  assert.match(generatorScript, /Refusing to continue because the final blend already exists\./);
  assert.match(generatorScript, /expectedBlendFilename": EXPECTED_BLEND_FILENAME/);
  assert.doesNotMatch(generatorScript, /expectedFinalOutputs": \[\s*f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);

  assert.match(resumeScript, /PREVIOUS_REGISTERED_VERSION = "v001"/);
  assert.match(resumeScript, /ASSET_VERSION = "v002"/);
  assert.match(resumeScript, /Expected open blend '\{EXPECTED_BLEND_NAME\}'/);
  assert.doesNotMatch(resumeScript, /f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
});

test("tree bottlebrush shared helpers remain reusable and external to the authoring scripts", () => {
  const helper = fs.readFileSync(anchorHelperPath, "utf8");
  const bootstrap = fs.readFileSync(bootstrapHelperPath, "utf8");

  assert.match(helper, /def build_identity_anchor_name\(/);
  assert.match(helper, /def create_identity_anchor\(/);
  assert.match(helper, /def find_identity_anchor\(/);
  assert.match(bootstrap, /def bootstrap_local_blender_scripts\(/);
});
