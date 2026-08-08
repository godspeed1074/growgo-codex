import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks
} from "../client/developer-only-atlas-population-weekly-routine-recurrence-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_41_WEEKLY_ROUTINE_RECURRENCE_HOOKS.md"
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
    selectorSeed: "WEEKLY_ROUTINE_SELECTOR_001",
    viewportId: "WEEKLY_ROUTINE_VIEWPORT_001",
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

function resolveRecurrence({
  featureClass = "civic_site",
  livenessCategory = "civic",
  occupancyProfileId = "OCCUPANCY_PROFILE_CIVIC_SOCIAL_001",
  serviceRoleId = "SERVICE_ROLE_COMMUNITY_SERVICE_001",
  communityRole = "neighbourhood_gathering_point"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks(
    registry,
    {
      featureClass,
      livenessCategory,
      occupancyProfileId,
      serviceRoleId,
      communityRole
    }
  );
}

test("1. recurrence stable", () => {
  const first = resolveRecurrence({
    featureClass: "coastal_green",
    livenessCategory: "visitor",
    occupancyProfileId: "OCCUPANCY_PROFILE_VISITOR_DAYTIME_001",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction"
  });
  const second = resolveRecurrence({
    featureClass: "coastal_green",
    livenessCategory: "visitor",
    occupancyProfileId: "OCCUPANCY_PROFILE_VISITOR_DAYTIME_001",
    serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
    communityRole: "visitor_attraction"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.weeklyRoutineProfileId,
    "WEEKLY_ROUTINE_PROFILE_VISITOR_WEEKEND_001"
  );
});

test("2. weekly patterns deterministic", () => {
  const first = resolveRecurrence();
  const second = resolveRecurrence();

  assert.deepEqual(first, second);
  assert.equal(first.recurrencePatternId, "RECURRENCE_PATTERN_DAILY_WEEKLY_001");
});

test("3. event cadence valid", () => {
  const result = resolveRecurrence({
    featureClass: "building_footprint",
    livenessCategory: "commercial",
    occupancyProfileId: "OCCUPANCY_PROFILE_EVENT_PEAK_001",
    serviceRoleId: "SERVICE_ROLE_MARKET_HERITAGE_001",
    communityRole: "visitor_attraction"
  });

  assert.equal(result.communityCadenceId, "COMMUNITY_CADENCE_MARKET_TRADITION_001");
  assert.equal(result.eventFrequency, "monthly_event");
  assert.match(result.recurrenceReason, /market|festival|tradition/i);
});

test("4. same input same output", () => {
  const first = resolveRecurrence({
    featureClass: "building_footprint",
    livenessCategory: "social",
    occupancyProfileId: "OCCUPANCY_PROFILE_QUIET_LOCAL_001",
    serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
    communityRole: "local_hub"
  });
  const second = resolveRecurrence({
    featureClass: "building_footprint",
    livenessCategory: "social",
    occupancyProfileId: "OCCUPANCY_PROFILE_QUIET_LOCAL_001",
    serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
    communityRole: "local_hub"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes recurrence diagnostics", () => {
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
          featureId: "market-plan-001",
          featureClass: "building_footprint",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "shop:market"
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
  assert.equal(plan.weeklyRoutineRecurrenceDecisions.length >= 3, true);
  assert.equal(
    plan.weeklyRoutineRecurrenceDecisions.every(
      (entry) =>
        "weeklyRoutineProfileId" in entry &&
        "recurrencePatternId" in entry &&
        "communityCadenceId" in entry &&
        "eventFrequency" in entry &&
        "recurrenceReason" in entry
    ),
    true
  );
  assert.equal(typeof status.recurrenceReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredWeeklyRoutineRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /weeklyRoutineProfileId/);
  assert.match(source, /recurrencePatternId/);
  assert.match(source, /communityCadenceId/);
  assert.match(source, /eventFrequency/);
  assert.match(source, /recurrenceReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
