import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);
const specificationPath = path.join(
  recipeRoot,
  "specification/coastal-location-recipe-001-specification.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-report.md"
);

const recipeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-intake.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location recipe intake defines recipe identity and approved dependency sets", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.recipeIdentity.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(
    specification.recipeIdentity.recipeType,
    "WORLD_ASSEMBLY_COASTAL_EXPLORATION_LOCATION"
  );
  assert.deepEqual(
    specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    [
      "COASTAL_GRAVEL_PATH_001",
      "COASTAL_BOARDWALK_001",
      "COASTAL_WATER_EDGE_001",
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
});

test("coastal location recipe intake defines deterministic placement, biome, and navigation rules", () => {
  const specification = readJson(specificationPath);

  assert.match(
    specification.deterministicSeedRules.seedStrategy,
    /hash\(recipeId, locationId, variantId, biomeProfile, placementZoneId\)/
  );
  assert.equal(specification.placementRules.zoneDefinitions.length >= 5, true);
  assert.equal(specification.biomeRules.allowedBiomeProfiles.includes("COASTAL_DUNE_EDGE"), true);
  assert.equal(
    specification.navigationRules.supportedArchetypes.includes("WETLAND_CROSSING"),
    true
  );
  assert.equal(
    specification.performanceConstraints.maxUniqueReferencedAssetsPerLocation,
    8
  );
});

test("coastal location recipe intake excludes non-approved vegetation from approved dependencies", () => {
  const specification = readJson(specificationPath);
  const approvedIds = new Set([
    ...specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    ...specification.assetDependencies.approvedVegetationAssets.map((entry) => entry.assetId)
  ]);

  assert.equal(approvedIds.has("TREE_EUCALYPTUS_001"), false);
  assert.equal(
    specification.assetDependencies.deferredAssets.some(
      (entry) => entry.assetId === "TREE_EUCALYPTUS_001"
    ),
    true
  );
});

test("coastal location recipe validation confirms intake-only state and approved dependency gate", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "recipe_generation_only");
});

test("coastal location recipe report documents readiness for recipe generation", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Recipe intake complete, generation not started/);
  assert.match(report, /COASTAL_GRAVEL_PATH_001/);
  assert.match(report, /TREE_BOTTLEBRUSH_001/);
  assert.match(
    report,
    /No Blender file, geometry, GLB, registration, or promotion artifact has been created/i
  );
  assert.match(report, /ready for Phase 200\.2 recipe generation/i);
});

test("coastal location recipe intake builder remains deterministic and dependency-gated", () => {
  const first = recipeModule.buildCoastalLocationRecipeSpecification({ cwd: repoRoot });
  const second = recipeModule.buildCoastalLocationRecipeSpecification({ cwd: repoRoot });

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
