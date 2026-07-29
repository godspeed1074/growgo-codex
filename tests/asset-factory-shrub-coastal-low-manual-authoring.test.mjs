import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const generatorPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/generate_shrub_coastal_low_001.py"
);
const resumePath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_shrub_coastal_low_001_exports.py"
);
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001"
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

test("shrub generator and resume scripts are valid Python syntax", () => {
  for (const filename of [generatorPath, resumePath]) {
    const result = compilePython(filename);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
});

test("generator preserves permanent identity and creates every required anchor", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /ASSET_ID = "SHRUB_COASTAL_LOW_001"/);
  assert.match(script, /SOURCE_RECIPE_ID = "SHRUB_COASTAL_LOW_RECIPE_001"/);
  assert.match(script, /ASSET_VERSION = "v001"/);
  assert.match(script, /PALETTE_ID = "AU_COASTAL_SHRUB_NATIVE_001"/);
  assert.match(
    script,
    /SHRUB_COASTAL_LOW_001_LOD_CLOSE_IDENTITY_ANCHOR/
  );
  assert.match(
    script,
    /SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY_IDENTITY_ANCHOR/
  );
  assert.match(script, /SHRUB_COASTAL_LOW_001_LOD_MAP_IDENTITY_ANCHOR/);
  assert.match(script, /create_identity_anchor\(/);
  assert.match(script, /required_helpers=\("asset_identity_anchor_v2",\)/);
});

test("generator defines deterministic mobile-first papercut geometry and shared materials", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /CLOSE_CLUSTER_SPECS = \(/);
  assert.match(script, /GAMEPLAY_CLUSTER_SPECS = \(/);
  assert.match(script, /MAP_CLUSTER_SPECS = \(/);
  assert.match(script, /primitive_cylinder_add\(vertices=6/);
  assert.match(script, /primitive_ico_sphere_add\(subdivisions=1/);
  assert.match(script, /growgo_papercut_2_5d/);
  assert.match(script, /growgo_mobile_first/);
  assert.match(script, /growgo_shared_material/);
  assert.match(script, /Shallow Y offsets retain papercut depth/);
  assert.doesNotMatch(script, /\brandom\b/);
  assert.doesNotMatch(script, /cycles/i);
  assert.doesNotMatch(script, /composit/i);
  assert.doesNotMatch(script, /denois/i);
});

test("generator prepares three LOD roots but never exports GLBs", () => {
  const script = fs.readFileSync(generatorPath, "utf8");

  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY_ROOT"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP_ROOT"/);
  assert.match(script, /finalGlbsGenerated": False/);
  assert.doesNotMatch(script, /bpy\.ops\.export_scene\.gltf/);
  assert.doesNotMatch(script, /save_as_mainfile/);
});

test("resume workflow is deterministic identity-aware and development-safe", () => {
  const script = fs.readFileSync(resumePath, "utf8");

  assert.match(script, /EXPECTED_BLEND_NAME = "SHRUB_COASTAL_LOW_001_v001\.blend"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_CLOSE\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_GAMEPLAY\.glb"/);
  assert.match(script, /f"\{ASSET_ID\}_LOD_MAP\.glb"/);
  assert.match(script, /find_identity_anchor\(/);
  assert.match(script, /build_export_object_set\(/);
  assert.match(script, /select_export_object_set\(/);
  assert.match(script, /"export_extras": True/);
  assert.match(script, /temp_path\.replace\(final_path\)/);
  assert.match(script, /validate_lod_metric_order\(metrics\)/);
  assert.doesNotMatch(script, /write.*registration|register_asset|publish_asset|activate_runtime/i);
});

test("resume metric validator normalizes the shared export-set compatibility tuple", () => {
  const script = fs.readFileSync(resumePath, "utf8");
  const metricFunction = script.match(
    /def count_scene_metrics\(root, lod_label\):([\s\S]*?)\n\ndef /
  )?.[1];

  assert.ok(metricFunction);
  assert.match(
    metricFunction,
    /export_set = build_export_object_set\(root, ASSET_ID, lod_label\)/
  );
  assert.match(
    metricFunction,
    /objects = normalize_export_objects\(export_set\)/
  );
  assert.match(metricFunction, /metrics = count_export_metrics\(objects\)/);
});

test("manual authoring setup record preserves its setup-only safety contract", () => {
  const setup = JSON.parse(
    fs.readFileSync(
      path.join(productionRoot, "validation/manual-authoring-setup.json"),
      "utf8"
    )
  );
  assert.equal(setup.manualBlenderExecutionRequired, true);
  assert.equal(setup.blenderLaunched, false);
  assert.equal(setup.blendGenerated, false);
  assert.equal(setup.finalGlbsGenerated, false);
  assert.equal(setup.registered, false);
  assert.equal(setup.published, false);
  assert.equal(setup.runtimeActivated, false);
});
