import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const resumeScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "resume_tree_eucalyptus_001_exports.py"
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

const verifierScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "tree-eucalyptus-post-run-verify.mjs"
);

test("tree eucalyptus manual resume script is valid Python syntax", () => {
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

test("tree eucalyptus manual resume script includes asset guards and ordered exports", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"/);
  assert.match(script, /ASSET_CATEGORY = "nature"/);
  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /VARIANT_ID = "DEFAULT"/);
  assert.match(script, /PALETTE_ID = "AU_NATIVE_GREEN_001"/);
  assert.match(script, /LOD_PROFILE = "NATURE_STANDARD_001"/);
  assert.match(script, /IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS"/);
  assert.match(script, /DEPENDENCY_IDS = \("MOD_TREE_LEAF_CLUSTER_001",\)/);
  assert.match(script, /IDENTITY_CONTRACT_V2 = \{/);
  assert.match(script, /BOOTSTRAP_PATH = \(/);
  assert.match(script, /bootstrap_local_blender_scripts\(/);
  assert.match(script, /ASSET_GUARD_MARKER/);
  assert.match(script, /RECIPE_GUARD_MARKER/);
  assert.match(script, /VERSION_GUARD_MARKER/);
  assert.match(
    script,
    /\("close", "LOD_CLOSE", f"\{ASSET_ID\}_LOD_CLOSE\.glb", f"\{ASSET_ID\}_LOD_CLOSE_ROOT"\)/
  );
  assert.match(
    script,
    /\("gameplay", "LOD_GAMEPLAY", f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb", f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"\)/
  );
  assert.match(
    script,
    /\("map", "LOD_MAP", f"\{ASSET_ID\}_LOD_MAP\.glb", f"\{ASSET_ID\}_LOD_MAP_ROOT"\)/
  );
});

test("tree eucalyptus manual resume script validates v2 asset, dependency, palette, and metadata identity", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /from asset_identity_anchor_v2 import \(/);
  assert.match(script, /build_export_object_set/);
  assert.match(script, /growgo_blender_bootstrap/);
  assert.match(script, /def collect_id_properties\(target\):/);
  assert.match(script, /def metadata_matches_asset_contract\(metadata, lod_label=None\):/);
  assert.match(script, /def metadata_matches_dependency_contract\(metadata, lod_label=None\):/);
  assert.match(script, /def validate_pre_export_identity\(root_object, lod_label\):/);
  assert.match(script, /def validate_export_preflight\(root_object, lod_label\):/);
  assert.match(script, /Pre-export identity validation failed for/);
  assert.match(script, /if not metrics\["assetIdentityPreserved"\]:/);
  assert.match(script, /if not metrics\["metadataIdentityPreserved"\]:/);
  assert.match(script, /if not metrics\["anchorIdentityPreserved"\]:/);
  assert.match(script, /if not metrics\["dependencyIdentityPreserved"\]:/);
  assert.match(script, /did not preserve the eucalyptus asset identity/);
  assert.match(script, /did not preserve eucalyptus metadata identity/);
  assert.match(script, /did not preserve the eucalyptus identity anchor/);
  assert.match(script, /did not preserve declared dependency identity/);
});

test("tree eucalyptus manual resume script uses .tmp.glb files and stops on first failure", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /def build_temp_glb_path\(final_path\):/);
  assert.match(script, /final_path\.with_name\(f"\{final_path\.stem\}\.tmp\{final_path\.suffix\}"\)/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.match(script, /raise RuntimeError/);
  assert.match(script, /for lod_key, lod_label, final_filename, root_name in EXPORT_SEQUENCE/);
  assert.match(script, /validate_export_preflight\(root_object, lod_label\)/);
  assert.doesNotMatch(script, /\.glb\.tmp/);
  assert.doesNotMatch(script, /\.glb\.tmp\.glb/);
});

test("tree eucalyptus manual resume script validates the actual exported temp file and enforces final blend naming", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /EXPECTED_BLEND_NAME = f"\{ASSET_ID\}_v001\.blend"/);
  assert.match(script, /REPO_ROOT = Path\(/);
  assert.match(script, /WORKSPACE_ROOT = \(REPO_ROOT \/ "asset-factory-workspace"\)\.resolve\(\)/);
  assert.match(script, /Resolved eucalyptus export directory:/);
  assert.match(script, /OUTPUT_DIR_IN_APPLICATIONS/);
  assert.match(script, /OUTPUT_DIR_OUTSIDE_REPO/);
  assert.match(script, /BLEND_NAME_MISMATCH/);
  assert.match(script, /temp_path = build_temp_glb_path\(final_path\)/);
  assert.match(script, /export_root\(root_object, temp_path\)/);
  assert.match(script, /verified_metrics = validate_export\(temp_path, expected_metrics\)/);
  assert.match(script, /"export_extras": True/);
  assert.doesNotMatch(script, /asset-factory-workspace\/production\/COASTAL_NATURE_FAMILY_001\/export/);
});

test("tree eucalyptus manual resume script uses a Blender 4.2-safe glTF export argument set", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /export_kwargs = \{/);
  assert.match(script, /optional_export_kwargs = \{/);
  assert.match(script, /"export_extras": True/);
  assert.match(script, /"export_colors": False/);
  assert.match(script, /get_rna_type\(\)\.properties\.keys\(\)/);
  assert.match(script, /if key in supported_export_args:/);
  assert.match(script, /bpy\.ops\.export_scene\.gltf\(\*\*export_kwargs\)/);
  assert.doesNotMatch(script, /bpy\.ops\.export_scene\.gltf\([^)]*export_colors=False/s);
});

test("tree eucalyptus manual resume script preserves successful earlier exports and avoids render systems", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /validate_existing_final_if_present/);
  assert.match(script, /EXPORT_SKIP_PREFIX/);
  assert.doesNotMatch(script, /initialize_scene/);
  assert.doesNotMatch(script, /save_as_mainfile/);
  assert.doesNotMatch(script, /cycles/i);
  assert.doesNotMatch(script, /composit/i);
  assert.doesNotMatch(script, /denois/i);
  assert.doesNotMatch(script, /OpenEXR/i);
});

test("tree eucalyptus manual resume script encodes dependency-aware and palette-aware validation", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /MOD_TREE_LEAF_CLUSTER_001/);
  assert.match(script, /find_identity_anchor/);
  assert.match(script, /select_export_object_set/);
  assert.match(script, /determine_exported_identity_source/);
  assert.match(script, /palette_identity/);
  assert.match(script, /invalid_dependencies:/);
  assert.match(script, /metadataIdentityHits/);
  assert.match(script, /anchorIdentityHits/);
  assert.match(script, /dependencyIdentityHits/);
  assert.match(script, /collect_glb_metadata_hits/);
});

test("tree eucalyptus shared identity anchor helper remains separate and reusable", () => {
  const helper = fs.readFileSync(anchorHelperPath, "utf8");
  const bootstrap = fs.readFileSync(bootstrapHelperPath, "utf8");

  assert.match(helper, /def build_identity_anchor_name\(/);
  assert.match(helper, /def create_identity_anchor\(/);
  assert.match(helper, /def find_identity_anchor\(/);
  assert.match(bootstrap, /def bootstrap_local_blender_scripts\(/);
});

test("tree eucalyptus post-run verifier remains Node-side only", () => {
  const script = fs.readFileSync(verifierScriptPath, "utf8");

  assert.match(script, /verifyTreeEucalyptusOutputs/);
  assert.doesNotMatch(script, /spawn|execFile|child_process|Blender/);
});
