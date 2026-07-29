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
  assert.match(script, /ASSET_GUARD_MARKER/);
  assert.match(script, /RECIPE_GUARD_MARKER/);
  assert.match(script, /VERSION_GUARD_MARKER/);
  assert.match(
    script,
    /\("close", "LOD_CLOSE", f"\{ASSET_ID\}_LOD_CLOSE\.glb", f"\{ASSET_ID\}_CLOSE_ROOT"\)/
  );
  assert.match(
    script,
    /\("gameplay", "LOD_GAMEPLAY", f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb", f"\{ASSET_ID\}_GAMEPLAY_ROOT"\)/
  );
  assert.match(
    script,
    /\("map", "LOD_MAP", f"\{ASSET_ID\}_LOD_MAP\.glb", f"\{ASSET_ID\}_MAP_ROOT"\)/
  );
});

test("tree eucalyptus manual resume script uses .tmp.glb files and stops on first failure", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /def build_temp_glb_path\(final_path\):/);
  assert.match(script, /final_path\.with_name\(f"\{final_path\.stem\}\.tmp\{final_path\.suffix\}"\)/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.match(script, /raise RuntimeError/);
  assert.match(script, /for lod_key, lod_label, final_filename, root_name in EXPORT_SEQUENCE/);
  assert.doesNotMatch(script, /\.glb\.tmp/);
  assert.doesNotMatch(script, /\.glb\.tmp\.glb/);
});

test("tree eucalyptus manual resume script validates the actual exported temp file and enforces final blend naming", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /EXPECTED_BLEND_NAME = f"\{ASSET_ID\}_v001\.blend"/);
  assert.match(script, /BLEND_NAME_MISMATCH/);
  assert.match(script, /temp_path = build_temp_glb_path\(final_path\)/);
  assert.match(script, /export_root\(root_object, temp_path\)/);
  assert.match(script, /verified_metrics = validate_export\(temp_path, expected_metrics\)/);
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

test("tree eucalyptus post-run verifier remains Node-side only", () => {
  const script = fs.readFileSync(verifierScriptPath, "utf8");

  assert.match(script, /verifyTreeEucalyptusOutputs/);
  assert.doesNotMatch(script, /spawn|execFile|child_process|Blender/);
});
