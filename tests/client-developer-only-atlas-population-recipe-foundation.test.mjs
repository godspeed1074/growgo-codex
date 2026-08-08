import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationRecipeRegistry,
  getDeveloperOnlyAtlasPopulationRecipeRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRecipeForFeature
} from "../client/developer-only-atlas-population-recipe-registry.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_14_POPULATION_RECIPE_FOUNDATION.md"
);

function plannerFeature({
  featureId,
  featureClass,
  latitude,
  longitude,
  area = 180,
  width = 50,
  height = 25,
  orientationHint = null
}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity: featureId
  };
}

function createPlanInput(overrides = {}) {
  return {
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    viewportId: "VIEWPORT_001",
    features: [],
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    ...overrides
  };
}

test("1. park feature resolves PARK_PUBLIC_GREEN_RECIPE_001 and generates deterministic commands", () => {
  const registry = createDeveloperOnlyAtlasPopulationRecipeRegistry();
  const resolution = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(registry, {
    featureClass: "park",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    contextRecipeId: "COASTAL_LOCATION_RECIPE_001"
  });

  assert.equal(resolution.matched, true);
  assert.equal(resolution.matchedRecipeId, "PARK_PUBLIC_GREEN_RECIPE_001");
  assert.equal(resolution.matchedFeatureClass, "park");
  assert.equal(resolution.generatedCommandCount, 2);
  assert.deepEqual(
    resolution.assetCommands.map((entry) => entry.assetId),
    ["TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"]
  );
});

test("2. coastal vegetation resolves COASTAL_GREEN_RECIPE_001 and generates deterministic commands", () => {
  const registry = createDeveloperOnlyAtlasPopulationRecipeRegistry();
  const resolution = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(registry, {
    featureClass: "vegetation_area",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    contextRecipeId: "COASTAL_LOCATION_RECIPE_001"
  });

  assert.equal(resolution.matched, true);
  assert.equal(resolution.matchedRecipeId, "COASTAL_GREEN_RECIPE_001");
  assert.equal(resolution.generatedCommandCount, 2);
  assert.deepEqual(
    resolution.assetCommands.map((entry) => entry.assetId),
    ["TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]
  );
});

test("3. civic features resolve BUILDING_CIVIC_RECIPE_001 and generic building placeholder resolves with no visible asset", () => {
  const registry = createDeveloperOnlyAtlasPopulationRecipeRegistry();
  const civic = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(registry, {
    featureClass: "civic_site",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    contextRecipeId: "COASTAL_LOCATION_RECIPE_001"
  });
  const generic = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(registry, {
    featureClass: "building_footprint",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    contextRecipeId: "COASTAL_LOCATION_RECIPE_001"
  });

  assert.equal(civic.matchedRecipeId, "BUILDING_CIVIC_RECIPE_001");
  assert.equal(civic.generatedCommandCount, 1);
  assert.equal(civic.assetCommands[0].assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(generic.matchedRecipeId, "BUILDING_GENERIC_RECIPE_001");
  assert.equal(generic.generatedCommandCount, 0);
});

test("4. unknown feature fails closed and increments rejected recipe count", () => {
  const registry = createDeveloperOnlyAtlasPopulationRecipeRegistry();
  const resolution = resolveDeveloperOnlyAtlasPopulationRecipeForFeature(registry, {
    featureClass: "unsupported",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    contextRecipeId: "COASTAL_LOCATION_RECIPE_001"
  });
  const status = getDeveloperOnlyAtlasPopulationRecipeRegistryStatus(registry);

  assert.equal(resolution.matched, false);
  assert.equal(resolution.reasonCode, "UNSUPPORTED_FEATURE_CLASS");
  assert.equal(status.rejectedRecipeCount, 1);
  assert.equal(Object.isFrozen(status), true);
});

test("5. planner uses recipe foundation deterministically and exposes diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const input = createPlanInput({
    features: [
      plannerFeature({
        featureId: "park-001",
        featureClass: "park",
        latitude: -38.121,
        longitude: 144.611
      }),
      plannerFeature({
        featureId: "coastal-001",
        featureClass: "coastal_green",
        latitude: -38.122,
        longitude: 144.612
      }),
      plannerFeature({
        featureId: "civic-001",
        featureClass: "civic_site",
        latitude: -38.123,
        longitude: 144.613
      })
    ]
  });

  const first = createDeveloperOnlyAtlasWorldPopulationPlan(planner, input);
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(planner, input);
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.deepEqual(first, second);
  assert.equal(first.populationPlanId.startsWith("ATLAS_POPULATION_PLAN_"), true);
  assert.equal(first.commands.length > 0, true);
  assert.equal(
    first.resolvedFeatureRecipes.some(
      (entry) => entry.matchedRecipeId === "PARK_PUBLIC_GREEN_RECIPE_001"
    ),
    true
  );
  assert.equal(
    first.resolvedFeatureRecipes.some(
      (entry) => entry.matchedRecipeId === "COASTAL_GREEN_RECIPE_001"
    ),
    true
  );
  assert.equal(
    first.resolvedFeatureRecipes.some(
      (entry) => entry.matchedRecipeId === "BUILDING_CIVIC_RECIPE_001"
    ),
    true
  );
  assert.equal(status.generatedCommandCount, first.commands.length);
  assert.equal(typeof status.matchedRecipeId, "string");
  assert.equal(typeof status.matchedFeatureClass, "string");
  assert.equal(status.rejectedRecipeCount, 0);
});

test("6. session documentation exists and records the population recipe foundation", () => {
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.match(source, /Phase 212\.14/i);
  assert.match(source, /PARK_PUBLIC_GREEN_RECIPE_001/);
  assert.match(source, /COASTAL_GREEN_RECIPE_001/);
  assert.match(source, /BUILDING_CIVIC_RECIPE_001/);
  assert.match(source, /BUILDING_GENERIC_RECIPE_001/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
