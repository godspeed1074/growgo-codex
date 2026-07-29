import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const eucalyptusScriptPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py"
);
const bottlebrushScriptPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py"
);

function readScript(filepath) {
  return fs.readFileSync(filepath, "utf8");
}

test("tree exporters resolve roots and shared metrics through the universal exporter", () => {
  for (const scriptPath of [eucalyptusScriptPath, bottlebrushScriptPath]) {
    const script = readScript(scriptPath);

    assert.match(script, /from asset_factory_exporter_v1 import \(/);
    assert.match(script, /discover_lod_roots/);
    assert.match(script, /normalize_export_objects/);
    assert.match(script, /validate_export_identity/);
    assert.match(script, /count_export_metrics/);
    assert.match(script, /validate_lod_metric_order/);
    assert.match(script, /write_export_manifest/);
    assert.match(script, /discover_lod_roots\(bpy\.data\.objects, ASSET_ID\)\[lod_label\]/);
    assert.match(script, /count_export_metrics\(normalize_export_objects\(root_object\)\)/);
  }
});

test("tree exporters preserve approved GLBs by validating existing finals before any export", () => {
  for (const scriptPath of [eucalyptusScriptPath, bottlebrushScriptPath]) {
    const script = readScript(scriptPath);

    assert.match(script, /def validate_existing_final_if_present\(final_path, expected_metrics\):/);
    assert.match(script, /existing_metrics = validate_existing_final_if_present\(final_path, expected_metrics\)/);
    assert.match(script, /if existing_metrics is not None:\s+emit_marker\(f"\{EXPORT_SKIP_PREFIX\}\{lod_label\}"\)\s+return existing_metrics/s);
    assert.match(script, /export_root\(root_object, temp_path\)/);
    assert.match(script, /temp_path\.replace\(final_path\)/);
  }
});

test("tree exporters write version-correct universal manifests without changing asset identity contracts", () => {
  const eucalyptusScript = readScript(eucalyptusScriptPath);
  const bottlebrushScript = readScript(bottlebrushScriptPath);

  assert.match(
    eucalyptusScript,
    /write_export_manifest\(\s*EXPECTED_OUTPUT_DIR \/ "tree-eucalyptus-export-manifest\.json"/s
  );
  assert.match(
    bottlebrushScript,
    /write_export_manifest\(\s*EXPECTED_OUTPUT_DIR \/ f"tree-bottlebrush-\{ASSET_VERSION\}-export-manifest\.json"/s
  );
  assert.match(eucalyptusScript, /version=ASSET_VERSION/);
  assert.match(bottlebrushScript, /version=ASSET_VERSION/);
  assert.match(eucalyptusScript, /dependency_ids=DEPENDENCY_IDS/);
  assert.match(bottlebrushScript, /dependency_ids=DEPENDENCY_IDS/);
});
