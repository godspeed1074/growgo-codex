import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-bottlebrush-production-setup.mjs"
  )
);

const generatorScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "generate_tree_bottlebrush_001.py"
);

const exportScriptPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory",
  "local-blender-scripts",
  "resume_tree_bottlebrush_001_exports.py"
);

test("tree bottlebrush production setup defines the required recipe and identity fields", () => {
  const setup = moduleUnderTest.buildTreeBottlebrushProductionSetup();

  assert.equal(setup.assetId, "TREE_BOTTLEBRUSH_001");
  assert.equal(setup.recipeDefinition.recipeId, "TREE_BOTTLEBRUSH_RECIPE_001");
  assert.equal(setup.recipeDefinition.version, "v001");
  assert.equal(setup.recipeDefinition.variantId, "DEFAULT");
  assert.equal(setup.recipeDefinition.paletteId, "AU_BOTTLEBRUSH_NATIVE_001");
  assert.equal(setup.recipeDefinition.lodProfile, "NATURE_STANDARD_001");
  assert.equal(setup.identityContract.anchorRequired, true);
});

test("tree bottlebrush setup defines exactly the required lods and visual targets", () => {
  const setup = moduleUnderTest.buildTreeBottlebrushProductionSetup();

  assert.deepEqual(setup.lodPlan.expectedLods, [
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP"
  ]);
  assert.deepEqual(setup.visualTargets, [
    "GrowGo papercut 2.5D style",
    "lightweight mobile geometry",
    "Australian native vegetation identity",
    "road/trail placement suitability"
  ]);
});

test("tree bottlebrush setup declares reusable dependencies for trunk branch leaf flower and socket modules", () => {
  const setup = moduleUnderTest.buildTreeBottlebrushProductionSetup();
  const dependencyIds = setup.reusableDependencies.map((dependency) => dependency.dependencyId);

  assert.deepEqual(dependencyIds, [
    "MOD_TREE_TRUNK_BOTTLEBRUSH_001",
    "MOD_TREE_BRANCH_BOTTLEBRUSH_001",
    "MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001",
    "MOD_TREE_GROUND_SOCKET_001"
  ]);
});

test("tree bottlebrush placeholder blender scripts are present and valid python syntax", () => {
  const compile = (scriptPath) =>
    spawnSync(
      "python3",
      [
        "-c",
        [
          "from pathlib import Path",
          `source = Path(r'''${scriptPath.replace(/\\/g, "\\\\")}''').read_text(encoding='utf8')`,
          `compile(source, r'''${scriptPath.replace(/\\/g, "\\\\")}''', 'exec')`
        ].join("; ")
      ],
      { encoding: "utf8" }
    );

  assert.equal(fs.existsSync(generatorScriptPath), true);
  assert.equal(fs.existsSync(exportScriptPath), true);
  assert.equal(compile(generatorScriptPath).status, 0);
  assert.equal(compile(exportScriptPath).status, 0);
});

test("tree bottlebrush setup validation reports manual blender authoring readiness without binaries or publishing", () => {
  const validation = moduleUnderTest.validateTreeBottlebrushProductionSetup(undefined, {
    cwd: path.resolve(import.meta.dirname, "..")
  });

  assert.equal(validation.ok, true);
  assert.equal(validation.setup.readiness.manualBlenderAuthoringReady, true);
  assert.equal(validation.setup.readiness.binaryOutputsCreated, false);
  assert.equal(validation.setup.readiness.publishingPrepared, false);
});
