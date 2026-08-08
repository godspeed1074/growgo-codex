import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSpatialDistribution
} from "../client/developer-only-atlas-population-spatial-distribution-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_15_POPULATION_SPATIAL_DISTRIBUTION_RULES.md"
);

function distanceMeters(a, b) {
  const dx = Number(a.longitude) - Number(b.longitude);
  const dy = Number(a.latitude) - Number(b.latitude);
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

function featureRadiusMeters(feature) {
  return Math.max(3.5, Math.sqrt(Math.max(Number(feature.area ?? 64), 9) / Math.PI));
}

function createFeature(overrides = {}) {
  return {
    featureId: "feature-001",
    featureClass: "park",
    coordinate: {
      latitude: -38.13565,
      longitude: 144.34905
    },
    area: 180,
    footprintScalars: null,
    orientationHint: null,
    deterministicFeatureIdentity: "viewport-001:feature-001",
    ...overrides
  };
}

function createPlannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "POPULATION_SELECTOR_001",
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

test("1. same input produces the same deterministic placements", () => {
  const registry = createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry();
  const feature = createFeature({
    featureClass: "park",
    area: 220
  });
  const input = {
    matchedRecipeId: "PARK_PUBLIC_GREEN_RECIPE_001",
    feature,
    selectorSeed: "SEED_PARK_001",
    assetCommands: [
      { assetId: "TREE_EUCALYPTUS_001", assetVersion: "v001" },
      { assetId: "SHRUB_COASTAL_LOW_001", assetVersion: "v002" }
    ]
  };

  const first = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
    registry,
    input
  );
  const second = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
    registry,
    input
  );

  assert.deepEqual(first, second);
  assert.equal(first.matched, true);
  assert.equal(first.distributionRuleId, "DIST_RULE_PARK_PUBLIC_GREEN_RECIPE_001");
});

test("2. different coordinates produce different deterministic placements", () => {
  const registry = createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry();
  const first = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(registry, {
    matchedRecipeId: "COASTAL_GREEN_RECIPE_001",
    feature: createFeature({
      featureClass: "vegetation_area",
      deterministicFeatureIdentity: "viewport-001:veg-001"
    }),
    selectorSeed: "SEED_GREEN_001",
    assetCommands: [
      { assetId: "TREE_BOTTLEBRUSH_001", assetVersion: "v002" },
      { assetId: "SHRUB_COASTAL_LOW_001", assetVersion: "v002" }
    ]
  });
  const second = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(registry, {
    matchedRecipeId: "COASTAL_GREEN_RECIPE_001",
    feature: createFeature({
      featureId: "veg-002",
      featureClass: "vegetation_area",
      coordinate: { latitude: -38.13525, longitude: 144.34945 },
      deterministicFeatureIdentity: "viewport-001:veg-002"
    }),
    selectorSeed: "SEED_GREEN_001",
    assetCommands: [
      { assetId: "TREE_BOTTLEBRUSH_001", assetVersion: "v002" },
      { assetId: "SHRUB_COASTAL_LOW_001", assetVersion: "v002" }
    ]
  });

  assert.notDeepEqual(
    first.placements.map((entry) => entry.coordinate),
    second.placements.map((entry) => entry.coordinate)
  );
});

test("3. trees avoid nearby building footprints through planner exclusion", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const buildingCoordinate = { latitude: -38.13565, longitude: 144.34905 };
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    createPlannerInput({
      features: [
        createFeature({
          featureId: "park-001",
          featureClass: "park",
          coordinate: buildingCoordinate,
          area: 240,
          deterministicFeatureIdentity: "viewport-001:park-001"
        }),
        createFeature({
          featureId: "building-001",
          featureClass: "building_footprint",
          coordinate: buildingCoordinate,
          area: 420,
          footprintScalars: { width: 48, height: 26 },
          orientationHint: 90,
          deterministicFeatureIdentity: "viewport-001:building-001"
        })
      ]
    })
  );

  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "TREE_EUCALYPTUS_001" &&
        candidate.reasonCode === "EXCLUSION_RADIUS_BLOCKED"
    ),
    true
  );
  assert.equal(
    plan.commands.some((command) => command.assetId === "SHRUB_COASTAL_LOW_001"),
    true
  );
});

test("4. shrubs stay inside allowed edge-biased zones", () => {
  const registry = createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry();
  const feature = createFeature({
    featureClass: "coastal_green",
    area: 260,
    deterministicFeatureIdentity: "viewport-001:coastal-001"
  });
  const result = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(registry, {
    matchedRecipeId: "COASTAL_GREEN_RECIPE_001",
    feature,
    selectorSeed: "SEED_COASTAL_001",
    assetCommands: [{ assetId: "SHRUB_COASTAL_LOW_001", assetVersion: "v002" }]
  });

  const radius = featureRadiusMeters(feature);
  assert.equal(result.generatedPlacementCount >= 2, true);
  for (const placement of result.placements) {
    const measured = distanceMeters(placement.coordinate, feature.coordinate);
    assert.equal(measured <= radius, true);
    assert.equal(measured >= radius * 0.8, true);
  }
});

test("5. building anchors remain stable and deterministic", () => {
  const registry = createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry();
  const input = {
    matchedRecipeId: "BUILDING_CIVIC_RECIPE_001",
    feature: createFeature({
      featureId: "civic-001",
      featureClass: "civic_site",
      area: 640,
      footprintScalars: { width: 60, height: 32 },
      orientationHint: 90,
      deterministicFeatureIdentity: "viewport-001:civic-001"
    }),
    selectorSeed: "SEED_CIVIC_001",
    assetCommands: [
      {
        assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
        assetVersion: "1.0.0"
      }
    ]
  };

  const first = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
    registry,
    input
  );
  const second = resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
    registry,
    input
  );

  assert.deepEqual(first.placements, second.placements);
  assert.equal(first.placements[0].orientationHintOverride, 90);
  assert.notDeepEqual(first.placements[0].coordinate, input.feature.coordinate);
});

test("6. planner preserves budgets and exposes distribution diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const features = Array.from({ length: 18 }, (_, index) =>
    createFeature({
      featureId: `coastal-${String(index + 1).padStart(3, "0")}`,
      featureClass: index % 2 === 0 ? "coastal_green" : "roadside_green",
      coordinate: {
        latitude: -38.13565 + index * 0.00035,
        longitude: 144.34905 + index * 0.00035
      },
      area: 160 + (index % 3) * 60,
      deterministicFeatureIdentity: `viewport-001:coastal-${index + 1}`
    })
  );

  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    createPlannerInput({
      features
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(status.generatedPlacementCount >= plan.commands.length, true);
  assert.equal(typeof status.distributionRuleId === "string", true);
  assert.equal(["small", "medium", "large"].includes(status.densityTier), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("7. distribution registry status and session documentation stay planning-only", () => {
  const registry = createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry();
  const status = getDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistryStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredDistributionRuleCount, 4);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.match(source, /PARK_PUBLIC_GREEN_RECIPE_001/);
  assert.match(source, /COASTAL_GREEN_RECIPE_001/);
  assert.match(source, /BUILDING_CIVIC_RECIPE_001/);
  assert.match(source, /distributionRuleId/);
  assert.match(source, /densityTier/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
