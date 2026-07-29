import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const helperPath = path.join(
  repoRoot,
  "asset-factory/local-blender-scripts/asset_factory_exporter_v1.py"
);
const exporterPaths = [
  "resume_tree_eucalyptus_001_exports.py",
  "resume_tree_bottlebrush_001_exports.py",
  "resume_shrub_coastal_low_001_exports.py"
].map((filename) =>
  path.join(repoRoot, "asset-factory/local-blender-scripts", filename)
);

function runPython(source) {
  return spawnSync("python3", ["-c", source], { encoding: "utf8" });
}

test("universal exporter helper is valid Python syntax", () => {
  const result = runPython(
    `compile(open(r'''${helperPath}''', encoding='utf8').read(), r'''${helperPath}''', 'exec')`
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("normalization supports objects lists tuples sets and collection-like sources", () => {
  const result = runPython(`
import importlib.util, json
spec = importlib.util.spec_from_file_location("exporter", r'''${helperPath}''')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
class Obj:
    def __init__(self, name):
        self.name=name; self.type="EMPTY"; self.children=[]
class Collection:
    def __init__(self, objects):
        self.objects=objects
a=Obj("A"); b=Obj("B"); c=Obj("C"); a.children=[b]
cases = [
    a,
    [a, b],
    ([a], b),
    {a, b},
    Collection([a, c]),
]
print(json.dumps([[o.name for o in mod.normalize_export_objects(case)] for case in cases]))
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), [
    ["A", "B"],
    ["A", "B"],
    ["A", "B"],
    ["A", "B"],
    ["A", "B", "C"]
  ]);
});

test("automatic discovery resolves exact CLOSE GAMEPLAY and MAP roots", () => {
  const result = runPython(`
import importlib.util, json
spec = importlib.util.spec_from_file_location("exporter", r'''${helperPath}''')
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
class Obj:
    def __init__(self, name):
        self.name=name; self.type="EMPTY"; self.children=[]
objects={name:Obj(name) for name in [
    "ASSET_001_LOD_CLOSE_ROOT",
    "ASSET_001_LOD_GAMEPLAY_ROOT",
    "ASSET_001_LOD_MAP_ROOT",
]}
roots=mod.discover_lod_roots(objects, "ASSET_001")
print(json.dumps(list(roots)))
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), [
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP"
  ]);
});

test("shared metrics count meshes triangulated polygons and unique materials", () => {
  const result = runPython(`
import importlib.util, json
spec = importlib.util.spec_from_file_location("exporter", r'''${helperPath}''')
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
class Named:
    def __init__(self, name): self.name=name
class Polygon:
    def __init__(self, count): self.vertices=list(range(count))
class Data:
    def __init__(self, polys, materials):
        self.polygons=[Polygon(n) for n in polys]; self.materials=materials
class Obj:
    def __init__(self, name, data=None):
        self.name=name; self.type="MESH" if data else "EMPTY"; self.data=data; self.children=[]
m1=Named("LEAF"); m2=Named("BRANCH")
root=Obj("ROOT"); root.children=[
    Obj("A", Data([3,4], [m1])),
    Obj("B", Data([3], [m1,m2])),
]
print(json.dumps(mod.count_export_metrics(root), sort_keys=True))
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    materialCount: 2,
    materials: ["BRANCH", "LEAF"],
    meshCount: 2,
    triangleCount: 4
  });
});

test("manifest generation is deterministic and records all LOD outputs", () => {
  const result = runPython(`
import importlib.util, json
spec = importlib.util.spec_from_file_location("exporter", r'''${helperPath}''')
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
options=dict(asset_id="ASSET_001", recipe_id="RECIPE_001", version="v001",
 dependency_ids=("DEP_001",), outputs={
  "close":{"filename":"close.glb","meshCount":3,"triangleCount":30,"materialCount":2},
  "gameplay":{"filename":"gameplay.glb","meshCount":2,"triangleCount":20,"materialCount":2},
  "map":{"filename":"map.glb","meshCount":1,"triangleCount":10,"materialCount":1}})
a=mod.build_export_manifest(**options); b=mod.build_export_manifest(**options)
print(json.dumps({"same":a==b,"schema":a["schemaId"],"lods":list(a["outputs"])}))
`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    same: true,
    schema: "ASSET_FACTORY_UNIVERSAL_EXPORT_MANIFEST_001",
    lods: ["close", "gameplay", "map"]
  });
});

test("all three exporters consume the shared hardened pipeline", () => {
  for (const exporterPath of exporterPaths) {
    const script = fs.readFileSync(exporterPath, "utf8");
    assert.match(script, /from asset_factory_exporter_v1 import \(/);
    assert.match(script, /discover_lod_roots\(/);
    assert.match(script, /validate_export_identity\(/);
    assert.match(script, /count_export_metrics\(/);
    assert.match(script, /write_export_manifest\(/);
  }
});
