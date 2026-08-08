import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry,
  getDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationDistrictComposition
} from "../client/developer-only-atlas-population-district-composition-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry,
  resolveDeveloperOnlyAtlasPopulationContextualWorldFill
} from "../client/developer-only-atlas-population-contextual-world-fill-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry,
  resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern
} from "../client/developer-only-atlas-population-neighborhood-pattern-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_19_DISTRICT_SETTLEMENT_COMPOSITION.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "building_footprint",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "building:house"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "DISTRICT_SELECTOR_001",
    viewportId: "DISTRICT_VIEWPORT_001",
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

function resolveDistrict(featureInput, selectorSeed = "DISTRICT_SEED_001") {
  const contextRegistry =
    createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  const neighborhoodRegistry =
    createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const districtRegistry =
    createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry();

  const context = resolveDeveloperOnlyAtlasPopulationContextualWorldFill(
    contextRegistry,
    { feature: featureInput, selectorSeed, placements: [] }
  );
  const neighborhood = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(
    neighborhoodRegistry,
    {
      feature: featureInput,
      selectorSeed,
      worldFillCategory: context.worldFillCategory,
      contextualWorldFillResolution: context
    }
  );

  return resolveDeveloperOnlyAtlasPopulationDistrictComposition(districtRegistry, {
    feature: featureInput,
    selectorSeed,
    worldFillCategory: context.worldFillCategory,
    neighborhoodPatternId: neighborhood.neighborhoodPatternId,
    patternCategory: neighborhood.patternCategory
  });
}

test("1. district selection is stable", () => {
  const home = feature({
    featureId: "res-001",
    sourceClassification: "building:house"
  });

  const first = resolveDistrict(home, "DISTRICT_STABLE_001");
  const second = resolveDistrict(home, "DISTRICT_STABLE_001");

  assert.deepEqual(first, second);
  assert.equal(first.districtType, "residential");
  assert.equal(first.districtId, "DISTRICT_RESIDENTIAL_001");
});

test("2. settlement composition is deterministic", () => {
  const shop = feature({
    featureId: "shop-001",
    sourceClassification: "shop:bakery"
  });

  const first = resolveDistrict(shop, "DISTRICT_COMPOSE_001");
  const second = resolveDistrict(shop, "DISTRICT_COMPOSE_001");

  assert.equal(first.compositionSeed, second.compositionSeed);
  assert.equal(first.settlementPatternId, second.settlementPatternId);
});

test("3. transitions are stable", () => {
  const coastal = feature({
    featureId: "coastal-001",
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast"
  });

  const result = resolveDistrict(coastal, "DISTRICT_TRANSITION_001");

  assert.equal(result.districtType, "coastal_natural");
  assert.equal(result.districtTransitionReason, "coastal_to_settlement_edge");
});

test("4. mixed-use districts are valid", () => {
  const cafe = feature({
    featureId: "cafe-001",
    sourceClassification: "cafe:frontage"
  });

  const result = resolveDistrict(cafe, "DISTRICT_MIXED_001");

  assert.equal(result.districtId, "DISTRICT_MIXED_USE_001");
  assert.equal(result.districtType, "mixed_use");
  assert.equal(result.districtTransitionReason, "residential_to_commercial");
});

test("5. budgets preserved and planner exposes district diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "res-plan-001",
          sourceClassification: "building:house"
        }),
        feature({
          featureId: "cafe-plan-001",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "cafe:frontage"
        }),
        feature({
          featureId: "park-plan-001",
          featureClass: "park",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "leisure:park"
        })
      ]
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.districtCompositionDecisions.length >= 3, true);
  assert.equal(typeof status.districtId === "string", true);
  assert.equal(typeof status.districtType === "string", true);
  assert.equal(typeof status.settlementPatternId === "string", true);
  assert.equal(typeof status.districtTransitionReason === "string", true);
  assert.equal(typeof status.compositionSeed === "string", true);
});

test("6. automatic controller regression evidence remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistryStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredDistrictRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /districtId/);
  assert.match(source, /districtType/);
  assert.match(source, /settlementPatternId/);
  assert.match(source, /districtTransitionReason/);
  assert.match(source, /compositionSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
