import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry,
  getDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSeasonalEnvironment
} from "../client/developer-only-atlas-population-seasonal-environment-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_25_SEASONAL_ENVIRONMENT_RULES.md"
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
    selectorSeed: "SEASON_SELECTOR_001",
    seasonKey: "summer",
    viewportId: "SEASON_VIEWPORT_001",
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

function resolveSeason({
  seasonKey = "summer",
  biomeProfileId = "BIOME_PROFILE_SUBURBAN_001",
  blendWeights = {
    coastal: 0.05,
    rural: 0.15,
    suburban: 0.7,
    urban: 0.1,
    wetland: 0,
    forest: 0
  },
  districtType = "residential",
  featureClass = "building_footprint",
  selectorSeed = "SEASON_DIRECT_001",
  deterministicFeatureIdentity = "feature-001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSeasonalEnvironment(registry, {
    seasonKey,
    biomeProfileId,
    blendWeights,
    districtType,
    featureClass,
    selectorSeed,
    deterministicFeatureIdentity
  });
}

test("1. season selection is stable", () => {
  const first = resolveSeason({ seasonKey: "spring" });
  const second = resolveSeason({ seasonKey: "spring" });

  assert.deepEqual(first, second);
  assert.equal(first.seasonProfileId, "SEASON_PROFILE_SPRING_001");
});

test("2. environmental response is deterministic", () => {
  const first = resolveSeason({
    seasonKey: "winter",
    biomeProfileId: "BIOME_PROFILE_WETLAND_001",
    blendWeights: {
      coastal: 0.2,
      rural: 0.1,
      suburban: 0,
      urban: 0,
      wetland: 0.6,
      forest: 0.1
    },
    districtType: "coastal_natural",
    featureClass: "reserve",
    selectorSeed: "SEASON_WET_001",
    deterministicFeatureIdentity: "wetland-001"
  });
  const second = resolveSeason({
    seasonKey: "winter",
    biomeProfileId: "BIOME_PROFILE_WETLAND_001",
    blendWeights: {
      coastal: 0.2,
      rural: 0.1,
      suburban: 0,
      urban: 0,
      wetland: 0.6,
      forest: 0.1
    },
    districtType: "coastal_natural",
    featureClass: "reserve",
    selectorSeed: "SEASON_WET_001",
    deterministicFeatureIdentity: "wetland-001"
  });

  assert.deepEqual(first.seasonalBlendWeights, second.seasonalBlendWeights);
  assert.equal(first.environmentStateId, second.environmentStateId);
  assert.equal(first.seasonSeed, second.seasonSeed);
});

test("3. same location same season same output", () => {
  const first = resolveSeason({
    seasonKey: "summer",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    districtType: "coastal_natural",
    featureClass: "coastal_green",
    selectorSeed: "SEASON_COAST_001",
    deterministicFeatureIdentity: "coast-001"
  });
  const second = resolveSeason({
    seasonKey: "summer",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    districtType: "coastal_natural",
    featureClass: "coastal_green",
    selectorSeed: "SEASON_COAST_001",
    deterministicFeatureIdentity: "coast-001"
  });

  assert.deepEqual(first, second);
});

test("4. different seasons create valid variation", () => {
  const summer = resolveSeason({ seasonKey: "summer" });
  const winter = resolveSeason({ seasonKey: "winter" });

  assert.notEqual(summer.seasonProfileId, winter.seasonProfileId);
  assert.notDeepEqual(summer.seasonalBlendWeights, winter.seasonalBlendWeights);
});

test("5. budgets preserved and planner exposes seasonal diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      seasonKey: "autumn",
      features: [
        feature({
          featureId: "suburban-plan-001",
          sourceClassification: "building:house"
        }),
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "urban-plan-001",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "shop:bakery"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.seasonalEnvironmentDecisions.length >= 3, true);
  assert.equal(typeof status.seasonProfileId === "string", true);
  assert.equal(typeof status.environmentStateId === "string", true);
  assert.equal(typeof status.seasonalBlendWeights === "object", true);
  assert.equal(typeof status.environmentReason === "string", true);
  assert.equal(typeof status.seasonSeed === "string", true);
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSeasonRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /seasonProfileId/);
  assert.match(source, /environmentStateId/);
  assert.match(source, /seasonalBlendWeights/);
  assert.match(source, /environmentReason/);
  assert.match(source, /seasonSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
