import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks
} from "../client/developer-only-atlas-population-local-economy-service-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_38_LOCAL_ECONOMY_SERVICE_HOOKS.md"
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
    selectorSeed: "LOCAL_ECONOMY_SERVICE_SELECTOR_001",
    viewportId: "LOCAL_ECONOMY_SERVICE_VIEWPORT_001",
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

function resolveEconomyService({
  featureClass = "civic_site",
  communityRole = "neighbourhood_gathering_point",
  civicRoutineProfileId = "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001",
  activityProfileId = "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001",
  settlementIdentityId = "suburban_community"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks(
    registry,
    {
      featureClass,
      communityRole,
      civicRoutineProfileId,
      activityProfileId,
      settlementIdentityId
    }
  );
}

test("1. service roles are stable", () => {
  const first = resolveEconomyService();
  const second = resolveEconomyService();

  assert.deepEqual(first, second);
  assert.equal(first.serviceRoleId, "SERVICE_ROLE_COMMUNITY_SERVICE_001");
});

test("2. economy profiles are deterministic", () => {
  const first = resolveEconomyService({
    featureClass: "coastal_green",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001",
    activityProfileId: "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001",
    settlementIdentityId: "coastal_village"
  });
  const second = resolveEconomyService({
    featureClass: "coastal_green",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001",
    activityProfileId: "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001",
    settlementIdentityId: "coastal_village"
  });

  assert.deepEqual(first, second);
  assert.equal(first.economyProfileId, "ECONOMY_PROFILE_COASTAL_TOURISM_001");
});

test("3. market cycles are valid", () => {
  const result = resolveEconomyService({
    featureClass: "building_footprint",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_HERITAGE_SQUARE_001",
    activityProfileId: "ACTIVITY_PROFILE_HERITAGE_EVENT_001",
    settlementIdentityId: "heritage_town"
  });

  assert.equal(
    result.marketCycleProfileId,
    "MARKET_CYCLE_PROFILE_EVENT_BASED_001"
  );
});

test("4. same input same output", () => {
  const first = resolveEconomyService({
    featureClass: "building_footprint",
    communityRole: "local_hub",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001",
    activityProfileId: "ACTIVITY_PROFILE_QUIET_MEMORY_RETURN_001",
    settlementIdentityId: "rural_town"
  });
  const second = resolveEconomyService({
    featureClass: "building_footprint",
    communityRole: "local_hub",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001",
    activityProfileId: "ACTIVITY_PROFILE_QUIET_MEMORY_RETURN_001",
    settlementIdentityId: "rural_town"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes economy diagnostics", () => {
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
  assert.equal(plan.localEconomyServiceDecisions.length >= 3, true);
  assert.equal(
    plan.localEconomyServiceDecisions.every(
      (entry) =>
        "serviceRoleId" in entry &&
        "economyProfileId" in entry &&
        "marketCycleProfileId" in entry &&
        "serviceImportance" in entry &&
        "economyReason" in entry
    ),
    true
  );
  assert.equal(typeof status.economyReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredLocalEconomyServiceRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /serviceRoleId/);
  assert.match(source, /economyProfileId/);
  assert.match(source, /marketCycleProfileId/);
  assert.match(source, /serviceImportance/);
  assert.match(source, /economyReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
