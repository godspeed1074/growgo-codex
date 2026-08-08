import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks
} from "../client/developer-only-atlas-population-local-mobility-access-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_39_LOCAL_MOBILITY_ACCESS_PATTERNS.md"
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
    selectorSeed: "LOCAL_MOBILITY_ACCESS_SELECTOR_001",
    viewportId: "LOCAL_MOBILITY_ACCESS_VIEWPORT_001",
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

function resolveMobility({
  featureClass = "civic_site",
  serviceRoleId = "SERVICE_ROLE_COMMUNITY_SERVICE_001",
  communityRole = "neighbourhood_gathering_point",
  civicRoutineProfileId = "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks(
    registry,
    {
      featureClass,
      serviceRoleId,
      communityRole,
      civicRoutineProfileId
    }
  );
}

test("1. mobility selection is stable", () => {
  const first = resolveMobility();
  const second = resolveMobility();

  assert.deepEqual(first, second);
  assert.equal(first.mobilityProfileId, "MOBILITY_PROFILE_COMMUNITY_MIXED_001");
});

test("2. access patterns are deterministic", () => {
  const first = resolveMobility({
    featureClass: "coastal_green",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001"
  });
  const second = resolveMobility({
    featureClass: "coastal_green",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.accessPatternId, "ACCESS_PATTERN_VISITOR_001");
});

test("3. daily flows are valid", () => {
  const result = resolveMobility({
    featureClass: "building_footprint",
    serviceRoleId: "SERVICE_ROLE_MARKET_HERITAGE_001",
    communityRole: "visitor_attraction",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_HERITAGE_SQUARE_001"
  });

  assert.equal(result.flowPriority, "event_daytime_evening_cycle");
});

test("4. accessibility rules are stable", () => {
  const result = resolveMobility({
    featureClass: "building_footprint",
    serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
    communityRole: "local_hub",
    civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001"
  });

  assert.equal(result.accessibilityProfile, "connection_priority_medium");
  assert.match(result.movementReason, /local|return|access|daily/i);
});

test("5. budgets preserved and planner exposes mobility diagnostics", () => {
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
  assert.equal(plan.localMobilityAccessDecisions.length >= 3, true);
  assert.equal(
    plan.localMobilityAccessDecisions.every(
      (entry) =>
        "mobilityProfileId" in entry &&
        "accessPatternId" in entry &&
        "flowPriority" in entry &&
        "movementReason" in entry &&
        "accessibilityProfile" in entry
    ),
    true
  );
  assert.equal(typeof status.movementReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredLocalMobilityAccessRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /mobilityProfileId/);
  assert.match(source, /accessPatternId/);
  assert.match(source, /flowPriority/);
  assert.match(source, /movementReason/);
  assert.match(source, /accessibilityProfile/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
