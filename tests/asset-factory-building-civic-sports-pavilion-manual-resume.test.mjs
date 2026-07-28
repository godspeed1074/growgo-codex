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
  "resume_building_civic_sports_pavilion_exports.py"
);

const verifierScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "building-civic-sports-pavilion-post-run-verify.mjs"
);

test("pavilion manual resume script is valid Python syntax", () => {
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

test("pavilion manual resume script includes identity guards and ordered exports", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /RECIPE_ID = "SPORTS_FACILITY_RECIPE_001"/);
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

test("pavilion manual resume script uses atomic export finalization and stops on first failure", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /def build_temp_glb_path\(final_path\):/);
  assert.match(script, /final_path\.with_name\(f"\{final_path\.stem\}\.tmp\{final_path\.suffix\}"\)/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.match(script, /raise RuntimeError/);
  assert.match(script, /for lod_key, lod_label, final_filename, root_name in EXPORT_SEQUENCE/);
});

test("pavilion manual resume script never uses .glb.tmp or .glb.tmp.glb temp names", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.doesNotMatch(script, /\.glb\.tmp/);
  assert.doesNotMatch(script, /\.glb\.tmp\.glb/);
});

test("pavilion manual resume script builds .tmp.glb paths for all three lod exports", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /\("close", "LOD_CLOSE", f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
  assert.match(script, /\("gameplay", "LOD_GAMEPLAY", f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /\("map", "LOD_MAP", f"\{ASSET_ID\}_LOD_MAP\.glb"/);
  assert.match(script, /temp_path = build_temp_glb_path\(final_path\)/);
  assert.match(script, /export_root\(root_object, temp_path\)/);
  assert.match(script, /verified_metrics = validate_export\(temp_path, expected_metrics\)/);
});

test("pavilion manual resume script enforces final source blend naming", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.match(script, /EXPECTED_BLEND_NAME = f"\{ASSET_ID\}_v001\.blend"/);
  assert.match(script, /BLEND_NAME_MISMATCH/);
  assert.match(script, /Expected open blend '\{EXPECTED_BLEND_NAME\}', found '\{filepath\.name\}'\./);
});

test("pavilion manual resume script avoids regeneration and rendering systems", () => {
  const script = fs.readFileSync(resumeScriptPath, "utf8");

  assert.doesNotMatch(script, /initialize_scene/);
  assert.doesNotMatch(script, /build_lod_assembly/);
  assert.doesNotMatch(script, /save_as_mainfile/);
  assert.doesNotMatch(script, /cycles/i);
  assert.doesNotMatch(script, /composit/i);
  assert.doesNotMatch(script, /denois/i);
  assert.doesNotMatch(script, /OpenEXR/i);
});

test("pavilion post-run verifier is a Node-side tool and does not launch Blender", () => {
  const script = fs.readFileSync(verifierScriptPath, "utf8");

  assert.match(script, /verifyBuildingCivicSportsPavilionOutputs/);
  assert.doesNotMatch(script, /Blender/);
  assert.doesNotMatch(script, /spawn|execFile|child_process/);
});
