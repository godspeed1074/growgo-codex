import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const bootstrapPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "growgo_blender_bootstrap.py"
);

const helperPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "asset_identity_anchor_v2.py"
);

test("growgo blender bootstrap helper is valid Python syntax", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "from pathlib import Path",
        `source = Path(r'''${bootstrapPath.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
        `compile(source, r'''${bootstrapPath.replace(/\\/g, "\\\\")}''', 'exec')`,
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("growgo blender bootstrap resolves the repo root and scripts directory", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import importlib.util, json",
        `bootstrap_path = r'''${bootstrapPath.replace(/\\/g, "\\\\")}'''`,
        "spec = importlib.util.spec_from_file_location('growgo_blender_bootstrap', bootstrap_path)",
        "module = importlib.util.module_from_spec(spec)",
        "spec.loader.exec_module(module)",
        `state = module.bootstrap_local_blender_scripts('bootstrap-test', required_helpers=('asset_identity_anchor_v2',), explicit_repo_root=r'''${path.resolve(import.meta.dirname, "..").replace(/\\/g, "\\\\")}''')`,
        "print(json.dumps(state, sort_keys=True))",
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.scriptLabel, "bootstrap-test");
  assert.ok(payload.repoRoot.endsWith("/growgo-codex"));
  assert.ok(payload.scriptsDir.endsWith("/asset-factory/local-blender-scripts"));
  assert.deepEqual(payload.loadedHelpers, ["asset_identity_anchor_v2"]);
});

test("growgo blender bootstrap reports clear failure when helper is missing", () => {
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import importlib.util",
        `bootstrap_path = r'''${bootstrapPath.replace(/\\/g, "\\\\")}'''`,
        "spec = importlib.util.spec_from_file_location('growgo_blender_bootstrap', bootstrap_path)",
        "module = importlib.util.module_from_spec(spec)",
        "spec.loader.exec_module(module)",
        `module.bootstrap_local_blender_scripts('bootstrap-test', required_helpers=('missing_helper_module',), explicit_repo_root=r'''${path.resolve(import.meta.dirname, "..").replace(/\\/g, "\\\\")}''')`,
      ].join("; "),
    ],
    { encoding: "utf8" }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /Required helper 'missing_helper_module' was missing/);
});

test("growgo blender bootstrap reports clear failure when repo root is invalid", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-bootstrap-missing-"));
  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import importlib.util",
        `bootstrap_path = r'''${bootstrapPath.replace(/\\/g, "\\\\")}'''`,
        "spec = importlib.util.spec_from_file_location('growgo_blender_bootstrap', bootstrap_path)",
        "module = importlib.util.module_from_spec(spec)",
        "spec.loader.exec_module(module)",
        `module.DEFAULT_REPO_ROOT = __import__('pathlib').Path(r'''${tempRoot.replace(/\\/g, "\\\\")}''')`,
        `module.bootstrap_local_blender_scripts('bootstrap-test', required_helpers=(), explicit_repo_root=r'''${tempRoot.replace(/\\/g, "\\\\")}''', script_path=r'''${tempRoot.replace(/\\/g, "\\\\")}''', cwd=r'''${tempRoot.replace(/\\/g, "\\\\")}''')`,
      ].join("; "),
    ],
    { encoding: "utf8", cwd: tempRoot }
  );

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr || result.stdout,
    /Could not locate the GrowGo repository root|Local Blender scripts directory was missing/
  );
});

test("growgo blender bootstrap companion helper exists", () => {
  const helper = fs.readFileSync(helperPath, "utf8");
  assert.match(helper, /def create_identity_anchor\(/);
});
