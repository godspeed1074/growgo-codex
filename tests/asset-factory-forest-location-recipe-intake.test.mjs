import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
);
const specificationPath = path.join(
  recipeRoot,
  "specification/forest-location-recipe-001-specification.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/forest-location-recipe-001-validation.json"
);
const lifecyclePath = path.join(
  recipeRoot,
  "lifecycle/forest-location-recipe-001-lifecycle.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-report.md"
);

const recipeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-intake.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("forest location recipe intake defines recipe identity and forest biome classification", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.recipeIdentity.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(
    specification.recipeIdentity.recipeType,
    "WORLD_ASSEMBLY_FOREST_EXPLORATION_LOCATION"
  );
  assert.equal(specification.biomeClassification.primaryBiome, "TEMPERATE_FOREST");
  assert.equal(
    specification.biomeClassification.supportedBiomeProfiles.includes(
      "TEMPERATE_FOREST_EDGE"
    ),
    true
  );
});

test("forest location recipe intake defines approved starter dependencies and deferred canopy uplift", () => {
  const specification = readJson(specificationPath);

  assert.deepEqual(
    specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    [
      "COASTAL_GRAVEL_PATH_001",
      "COASTAL_GROUND_COVER_001",
      "COASTAL_ROCK_CLUSTER_001"
    ]
  );
  assert.deepEqual(
    specification.assetDependencies.approvedVegetationAssets.map((entry) => entry.assetId),
    [
      "COASTAL_GRASS_TUSSOCK_001",
      "SHRUB_COASTAL_LOW_001",
      "TREE_BOTTLEBRUSH_001"
    ]
  );
  assert.equal(
    specification.assetDependencies.deferredAssets.some(
      (entry) => entry.assetId === "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("forest location recipe intake defines placement zones, deterministic seed rules, and approval workflow", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.placementRules.zoneDefinitions.length, 5);
  assert.equal(
    specification.deterministicSeedRules.sameSeedMustProduceSameFingerprint,
    true
  );
  assert.equal(
    specification.navigationRules.supportedArchetypes.includes("FOREST_EDGE_LOOP"),
    true
  );
  assert.equal(
    specification.previewRequirements.requiredReviewChecks.includes(
      "forest_density_gradient"
    ),
    true
  );
  assert.equal(specification.approvalWorkflow.producedRecords.length, 3);
});

test("forest location recipe validation and lifecycle mark the recipe ready for generation", () => {
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "recipe_generation_only");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(lifecycle.lifecycleState, "GENERATION_READY");
});

test("forest location recipe report documents readiness without runtime side effects", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Recipe intake complete, generation not started/);
  assert.match(report, /TREE_EUCALYPTUS_001/);
  assert.match(report, /LOCATION_RECIPE_FACTORY_001/);
  assert.match(
    report,
    /No Blender, GLBs, asset modification, or runtime activation were performed/i
  );
});

test("forest location recipe intake builder remains deterministic and factory-gated", () => {
  const first = recipeModule.buildForestLocationRecipeSpecification({ cwd: repoRoot });
  const second = recipeModule.buildForestLocationRecipeSpecification({ cwd: repoRoot });

  assert.equal(first.deterministicFingerprint, second.deterministicFingerprint);
  assert.equal(
    first.assetDependencies.requiredCoreAssets.every((entry) =>
      [
        "ACTIVE_DEVELOPMENT_REVISION",
        "APPROVED_CURRENT",
        "APPROVED_CURRENT_CANDIDATE"
      ].includes(entry.lifecycleStatus)
    ),
    true
  );
});
