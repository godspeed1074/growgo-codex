import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry,
  getDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern
} from "../client/developer-only-atlas-population-neighborhood-pattern-rules.mjs";
import {
  createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry,
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
  "GROWGO_SESSION_212_18_NEIGHBORHOOD_PATTERN_RULES.md"
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
  sourceClassification = "building:house"
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

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "NEIGHBORHOOD_SELECTOR_001",
    viewportId: "NEIGHBORHOOD_VIEWPORT_001",
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

function resolveContext(featureInput, selectorSeed = "CTX_SEED_001") {
  const registry = createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationContextualWorldFill(registry, {
    feature: featureInput,
    selectorSeed,
    placements: []
  });
}

test("1. same neighborhood input produces the same pattern", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const featureInput = feature({
    featureId: "res-001",
    sourceClassification: "building:house"
  });
  const contextual = resolveContext(featureInput, "CTX_SAME_001");

  const first = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: featureInput,
    selectorSeed: "PATTERN_SAME_001",
    worldFillCategory: contextual.worldFillCategory,
    contextualWorldFillResolution: contextual
  });
  const second = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: featureInput,
    selectorSeed: "PATTERN_SAME_001",
    worldFillCategory: contextual.worldFillCategory,
    contextualWorldFillResolution: contextual
  });

  assert.deepEqual(first, second);
  assert.equal(typeof first.patternSeed, "string");
});

test("2. different coordinates produce deterministic variation", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const firstFeature = feature({
    featureId: "res-a",
    deterministicFeatureIdentity: "res-a",
    latitude: -38.13565,
    longitude: 144.34905
  });
  const secondFeature = feature({
    featureId: "res-b",
    deterministicFeatureIdentity: "res-b",
    latitude: -38.13605,
    longitude: 144.34945
  });

  const first = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: firstFeature,
    selectorSeed: "PATTERN_VAR_001",
    worldFillCategory: "residential",
    contextualWorldFillResolution: resolveContext(firstFeature, "CTX_VAR_001")
  });
  const second = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: secondFeature,
    selectorSeed: "PATTERN_VAR_001",
    worldFillCategory: "residential",
    contextualWorldFillResolution: resolveContext(secondFeature, "CTX_VAR_001")
  });

  assert.notEqual(first.patternSeed, second.patternSeed);
});

test("3. residential pattern is stable", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const townhouse = feature({
    featureId: "townhouse-001",
    sourceClassification: "building:terrace"
  });
  const result = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: townhouse,
    selectorSeed: "PATTERN_RES_001",
    worldFillCategory: "residential",
    contextualWorldFillResolution: resolveContext(townhouse, "CTX_RES_001")
  });

  assert.equal(result.patternCategory, "residential");
  assert.equal(
    result.neighborhoodPatternId,
    "NEIGHBORHOOD_PATTERN_TOWNHOUSE_ROW_001"
  );
});

test("4. commercial pattern is stable", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const commercial = feature({
    featureId: "commercial-001",
    sourceClassification: "shop:bakery"
  });
  const result = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: commercial,
    selectorSeed: "PATTERN_COM_001",
    worldFillCategory: "commercial",
    contextualWorldFillResolution: resolveContext(commercial, "CTX_COM_001")
  });

  assert.equal(result.patternCategory, "commercial");
  assert.equal(
    result.neighborhoodPatternId,
    "NEIGHBORHOOD_PATTERN_LOCAL_SHOPPING_CLUSTER_001"
  );
});

test("5. civic and coastal patterns are stable", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const civic = feature({
    featureId: "civic-001",
    featureClass: "sports_ground",
    sourceClassification: "leisure:stadium"
  });
  const coastal = feature({
    featureId: "coastal-001",
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast"
  });

  const civicResult = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: civic,
    selectorSeed: "PATTERN_CIV_001",
    worldFillCategory: "civic",
    contextualWorldFillResolution: resolveContext(civic, "CTX_CIV_001")
  });
  const coastalResult = resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(registry, {
    feature: coastal,
    selectorSeed: "PATTERN_COAST_001",
    worldFillCategory: "coastal",
    contextualWorldFillResolution: resolveContext(coastal, "CTX_COAST_001")
  });

  assert.equal(
    civicResult.neighborhoodPatternId,
    "NEIGHBORHOOD_PATTERN_SPORTS_COMMUNITY_SITE_001"
  );
  assert.equal(
    coastalResult.neighborhoodPatternId,
    "NEIGHBORHOOD_PATTERN_COASTAL_SETTLEMENT_001"
  );
});

test("6. planner surfaces neighborhood pattern diagnostics deterministically", () => {
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
          featureId: "shop-plan-001",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "shop:bakery"
        }),
        feature({
          featureId: "park-plan-001",
          featureClass: "park",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "leisure:park"
        }),
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          latitude: -38.13515,
          longitude: 144.34955,
          sourceClassification: "green:near_coast"
        })
      ]
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.neighborhoodPatternDecisions.length >= 4, true);
  assert.equal(typeof status.neighborhoodPatternId === "string", true);
  assert.equal(typeof status.patternCategory === "string", true);
  assert.equal(typeof status.patternSeed === "string", true);
  assert.equal(status.generatedContextCount >= 2, true);
  assert.doesNotThrow(() => JSON.stringify(plan));
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("7. neighborhood pattern status and session documentation remain developer-only", () => {
  const registry = createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry();
  const status = getDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistryStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredNeighborhoodPatternCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.match(source, /neighborhoodPatternId/);
  assert.match(source, /patternCategory/);
  assert.match(source, /patternSeed/);
  assert.match(source, /generatedContextCount/);
  assert.match(source, /patternDecisionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
