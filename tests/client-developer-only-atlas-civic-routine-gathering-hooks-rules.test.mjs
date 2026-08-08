import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks
} from "../client/developer-only-atlas-population-civic-routine-gathering-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_37_CIVIC_ROUTINE_GATHERING_HOOKS.md"
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
    selectorSeed: "CIVIC_ROUTINE_SELECTOR_001",
    viewportId: "CIVIC_ROUTINE_VIEWPORT_001",
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

function resolveCivicRoutine({
  featureClass = "civic_site",
  activityProfileId = "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001",
  socialRhythmId = "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001",
  seasonProfileId = "summer"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks(
    registry,
    {
      featureClass,
      activityProfileId,
      socialRhythmId,
      seasonProfileId
    }
  );
}

test("1. civic routines are stable", () => {
  const first = resolveCivicRoutine();
  const second = resolveCivicRoutine();

  assert.deepEqual(first, second);
  assert.equal(
    first.civicRoutineProfileId,
    "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001"
  );
});

test("2. gathering patterns are deterministic", () => {
  const first = resolveCivicRoutine({
    featureClass: "building_footprint",
    activityProfileId: "ACTIVITY_PROFILE_HERITAGE_EVENT_001",
    socialRhythmId: "SOCIAL_RHYTHM_HERITAGE_FESTIVAL_001",
    seasonProfileId: "autumn"
  });
  const second = resolveCivicRoutine({
    featureClass: "building_footprint",
    activityProfileId: "ACTIVITY_PROFILE_HERITAGE_EVENT_001",
    socialRhythmId: "SOCIAL_RHYTHM_HERITAGE_FESTIVAL_001",
    seasonProfileId: "autumn"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.gatheringPatternId,
    "GATHERING_PATTERN_FESTIVAL_MARKET_001"
  );
});

test("3. temporal use is stable", () => {
  const result = resolveCivicRoutine({
    featureClass: "coastal_green",
    activityProfileId: "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001",
    socialRhythmId: "SOCIAL_RHYTHM_COASTAL_DISCOVERY_SEASONAL_001",
    seasonProfileId: "summer"
  });

  assert.equal(result.temporalUseProfile, "daytime_seasonal_visit_cycle");
});

test("4. community roles are valid", () => {
  const result = resolveCivicRoutine({
    featureClass: "sports_ground",
    activityProfileId: "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001",
    socialRhythmId: "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001",
    seasonProfileId: "spring"
  });

  assert.equal(result.communityRole, "local_hub");
  assert.match(result.routineReason, /community|recreation|gather/i);
});

test("5. budgets preserved and planner exposes civic routine diagnostics", () => {
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
  assert.equal(plan.civicRoutineGatheringDecisions.length >= 3, true);
  assert.equal(
    plan.civicRoutineGatheringDecisions.every(
      (entry) =>
        "civicRoutineProfileId" in entry &&
        "gatheringPatternId" in entry &&
        "temporalUseProfile" in entry &&
        "communityRole" in entry &&
        "routineReason" in entry
    ),
    true
  );
  assert.equal(typeof status.routineReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredCivicRoutineRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /civicRoutineProfileId/);
  assert.match(source, /gatheringPatternId/);
  assert.match(source, /temporalUseProfile/);
  assert.match(source, /communityRole/);
  assert.match(source, /routineReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
