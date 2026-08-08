import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks
} from "../client/developer-only-atlas-population-place-liveness-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_40_PLACE_LIVENESS_HOOKS.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "civic_site",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "amenity:community_centre"
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
    selectorSeed: "PLACE_LIVENESS_SELECTOR_001",
    viewportId: "PLACE_LIVENESS_VIEWPORT_001",
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

function resolveLiveness({
  featureClass = "civic_site",
  mobilityProfileId = "MOBILITY_PROFILE_COMMUNITY_MIXED_001",
  accessPatternId = "ACCESS_PATTERN_CIVIC_001",
  serviceRoleId = "SERVICE_ROLE_COMMUNITY_SERVICE_001",
  communityRole = "neighbourhood_gathering_point"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks(
    registry,
    {
      featureClass,
      mobilityProfileId,
      accessPatternId,
      serviceRoleId,
      communityRole
    }
  );
}

test("1. occupancy stable", () => {
  const first = resolveLiveness();
  const second = resolveLiveness();

  assert.deepEqual(first, second);
  assert.equal(first.occupancyProfileId, "OCCUPANCY_PROFILE_CIVIC_SOCIAL_001");
});

test("2. time presence deterministic", () => {
  const first = resolveLiveness({
    featureClass: "coastal_green",
    mobilityProfileId: "MOBILITY_PROFILE_TOURISM_WALKING_001",
    accessPatternId: "ACCESS_PATTERN_VISITOR_001",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction"
  });
  const second = resolveLiveness({
    featureClass: "coastal_green",
    mobilityProfileId: "MOBILITY_PROFILE_TOURISM_WALKING_001",
    accessPatternId: "ACCESS_PATTERN_VISITOR_001",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction"
  });

  assert.deepEqual(first, second);
  assert.equal(first.timePresenceProfile, "daytime");
});

test("3. liveness categories valid", () => {
  const result = resolveLiveness({
    featureClass: "building_footprint",
    mobilityProfileId: "MOBILITY_PROFILE_URBAN_EVENT_MIXED_001",
    accessPatternId: "ACCESS_PATTERN_COMMERCIAL_001",
    serviceRoleId: "SERVICE_ROLE_MARKET_HERITAGE_001",
    communityRole: "visitor_attraction"
  });

  assert.equal(result.livenessCategory, "commercial");
});

test("4. event presence stable", () => {
  const result = resolveLiveness({
    featureClass: "building_footprint",
    mobilityProfileId: "MOBILITY_PROFILE_URBAN_EVENT_MIXED_001",
    accessPatternId: "ACCESS_PATTERN_COMMERCIAL_001",
    serviceRoleId: "SERVICE_ROLE_MARKET_HERITAGE_001",
    communityRole: "visitor_attraction"
  });

  assert.equal(result.peakActivityWindow, "event_market_peak");
  assert.match(result.presenceReason, /event|market|peak/i);
});

test("5. same input same output", () => {
  const first = resolveLiveness({
    featureClass: "building_footprint",
    mobilityProfileId: "MOBILITY_PROFILE_LOCAL_DRIVING_001",
    accessPatternId: "ACCESS_PATTERN_RESIDENTIAL_001",
    serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
    communityRole: "local_hub"
  });
  const second = resolveLiveness({
    featureClass: "building_footprint",
    mobilityProfileId: "MOBILITY_PROFILE_LOCAL_DRIVING_001",
    accessPatternId: "ACCESS_PATTERN_RESIDENTIAL_001",
    serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
    communityRole: "local_hub"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes liveness diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      seasonKey: "summer",
      features: [
        feature({
          featureId: "civic-plan-001",
          featureClass: "civic_site",
          sourceClassification: "amenity:community_centre"
        }),
        feature({
          featureId: "sports-plan-001",
          featureClass: "sports_ground",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "leisure:pitch"
        }),
        feature({
          featureId: "coast-plan-001",
          featureClass: "coastal_green",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "green:near_coast"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.placeLivenessDecisions.length >= 3, true);
  assert.equal(
    plan.placeLivenessDecisions.every(
      (entry) =>
        "occupancyProfileId" in entry &&
        "timePresenceProfile" in entry &&
        "livenessCategory" in entry &&
        "peakActivityWindow" in entry &&
        "presenceReason" in entry
    ),
    true
  );
  assert.equal(typeof status.presenceReason, "string");
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredPlaceLivenessRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /occupancyProfileId/);
  assert.match(source, /timePresenceProfile/);
  assert.match(source, /livenessCategory/);
  assert.match(source, /peakActivityWindow/);
  assert.match(source, /presenceReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
