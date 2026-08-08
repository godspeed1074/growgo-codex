import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry,
  getDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationContextualWorldFill
} from "../client/developer-only-atlas-population-contextual-world-fill-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_17_CONTEXTUAL_WORLD_FILL_RULES.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "building_footprint",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "building:yes"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function placement({
  assetId = "SHRUB_COASTAL_LOW_001",
  assetVersion = "v002",
  latitude = -38.13562,
  longitude = 144.34907,
  candidateIndex = 0,
  placementKind = "edge_cluster",
  deterministicPlacementSeed = "seed-001",
  orientationHintOverride = null
} = {}) {
  return {
    assetId,
    assetVersion,
    candidateIndex,
    coordinate: { latitude, longitude },
    placementKind,
    deterministicPlacementSeed,
    orientationHintOverride,
    relationshipDiagnostics: null
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_FILL_SELECTOR_001",
    viewportId: "WORLD_FILL_VIEWPORT_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [],
    relationshipContext: { roadWays: [] },
    ...overrides
  };
}

test("1. residential context is stable and creates backyard context", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const input = {
    feature: feature({
      featureId: "residential-001",
      sourceClassification: "building:house"
    }),
    selectorSeed: "RESIDENTIAL_SEED_001",
    placements: []
  };

  const first = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(
    registry,
    input
  );
  const second = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(
    registry,
    input
  );

  assert.deepEqual(first, second);
  assert.equal(first.worldFillCategory, "residential");
  assert.equal(first.generatedSubRecipeCount, 3);
  assert.equal(first.childPlacementCount, 1);
  assert.equal(first.contextReason, "residential_backyard_context");
});

test("2. commercial context is stable and preserves frontage context", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const result = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, {
    feature: feature({
      featureId: "commercial-001",
      sourceClassification: "shop:bakery"
    }),
    selectorSeed: "COMMERCIAL_SEED_001",
    placements: []
  });

  assert.equal(result.worldFillCategory, "commercial");
  assert.equal(result.generatedSubRecipeCount, 2);
  assert.equal(result.childPlacementCount, 0);
  assert.equal(result.contextReason, "commercial_frontage_context");
});

test("3. civic context is stable", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const result = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, {
    feature: feature({
      featureId: "civic-001",
      featureClass: "civic_site",
      sourceClassification: "amenity:library"
    }),
    selectorSeed: "CIVIC_SEED_001",
    placements: [
      placement({
        assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
        assetVersion: "1.0.0",
        placementKind: "building_anchor"
      })
    ]
  });

  assert.equal(result.worldFillCategory, "civic");
  assert.equal(result.generatedSubRecipeCount, 2);
  assert.equal(result.contextReason, "civic_open_surround_context");
});

test("4. park and coastal contexts stay stable", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const park = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, {
    feature: feature({
      featureId: "park-001",
      featureClass: "park",
      sourceClassification: "leisure:park"
    }),
    selectorSeed: "PARK_SEED_001",
    placements: [placement()]
  });
  const coastal = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, {
    feature: feature({
      featureId: "coastal-001",
      featureClass: "coastal_green",
      sourceClassification: "green:near_coast",
      area: 140
    }),
    selectorSeed: "COASTAL_SEED_001",
    placements: [
      placement({
        assetId: "TREE_BOTTLEBRUSH_001",
        assetVersion: "v002",
        placementKind: "interior_tree"
      })
    ]
  });

  assert.equal(park.worldFillCategory, "park");
  assert.equal(park.contextReason, "park_open_area_preserved");
  assert.equal(coastal.worldFillCategory, "coastal");
  assert.equal(coastal.generatedSubRecipeCount, 2);
  assert.equal(coastal.childPlacementCount, 1);
});

test("5. same input produces same output", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const input = {
    feature: feature({
      featureId: "same-001",
      featureClass: "coastal_green",
      sourceClassification: "green:near_coast",
      area: 130
    }),
    selectorSeed: "SAME_SEED_001",
    placements: [
      placement({
        assetId: "TREE_BOTTLEBRUSH_001",
        assetVersion: "v002"
      })
    ]
  };

  assert.deepEqual(
    resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, input),
    resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, input)
  );
});

test("6. planner preserves budgets and surfaces contextual diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "residential-plan-001",
          sourceClassification: "building:house"
        }),
        feature({
          featureId: "commercial-plan-001",
          latitude: -38.1358,
          longitude: 144.3493,
          sourceClassification: "shop:bakery"
        }),
        feature({
          featureId: "park-plan-001",
          featureClass: "park",
          latitude: -38.1354,
          longitude: 144.3494,
          sourceClassification: "leisure:park"
        }),
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          latitude: -38.1352,
          longitude: 144.3496,
          sourceClassification: "green:near_coast"
        })
      ]
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.contextualWorldFillDecisions.length >= 4, true);
  assert.equal(typeof status.contextRuleId === "string", true);
  assert.equal(typeof status.worldFillCategory === "string", true);
  assert.equal(status.generatedSubRecipeCount >= 2, true);
  assert.doesNotThrow(() => JSON.stringify(plan));
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("7. status and session documentation remain developer-only", () => {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const status = getDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistryStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredContextRuleCount, 5);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.match(source, /contextRuleId/);
  assert.match(source, /worldFillCategory/);
  assert.match(source, /generatedSubRecipeCount/);
  assert.match(source, /childPlacementCount/);
  assert.match(source, /contextReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
