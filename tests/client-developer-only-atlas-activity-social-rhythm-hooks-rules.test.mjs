import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks
} from "../client/developer-only-atlas-population-activity-social-rhythm-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_36_ACTIVITY_SOCIAL_RHYTHM_HOOKS.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "coastal_green",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "green:near_coast"
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
    selectorSeed: "ACTIVITY_SOCIAL_RHYTHM_SELECTOR_001",
    viewportId: "ACTIVITY_SOCIAL_RHYTHM_VIEWPORT_001",
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

function resolveActivityRhythm({
  settlementIdentityId = "coastal_village",
  placeMemoryId = "PLACE_MEMORY_NATURAL_WONDER_001",
  seasonalStoryProfileId = "SEASONAL_STORY_PROFILE_COASTAL_SUMMER_001",
  seasonProfileId = "summer",
  returnVisitCategory = "discovered"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks(
    registry,
    {
      settlementIdentityId,
      placeMemoryId,
      seasonalStoryProfileId,
      seasonProfileId,
      returnVisitCategory
    }
  );
}

test("1. activity selection is stable", () => {
  const first = resolveActivityRhythm();
  const second = resolveActivityRhythm();

  assert.deepEqual(first, second);
  assert.equal(
    first.activityProfileId,
    "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001"
  );
});

test("2. rhythms are deterministic", () => {
  const first = resolveActivityRhythm({
    settlementIdentityId: "suburban_community",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001",
    seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_COMMUNITY_RECURRING_001",
    seasonProfileId: "summer",
    returnVisitCategory: "remembered"
  });
  const second = resolveActivityRhythm({
    settlementIdentityId: "suburban_community",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001",
    seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_COMMUNITY_RECURRING_001",
    seasonProfileId: "summer",
    returnVisitCategory: "remembered"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.socialRhythmId,
    "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001"
  );
});

test("3. social hooks are valid", () => {
  const result = resolveActivityRhythm({
    settlementIdentityId: "heritage_town",
    placeMemoryId: "PLACE_MEMORY_HISTORIC_LANDMARK_001",
    seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_HERITAGE_GATHERING_001",
    seasonProfileId: "autumn",
    returnVisitCategory: "revisited"
  });

  assert.equal(result.timeContextProfile, "autumn_winter_event_window");
  assert.equal(result.communityImportance, "high");
  assert.match(result.activityReason, /festival|heritage|communal/i);
});

test("4. same input same output", () => {
  const first = resolveActivityRhythm({
    settlementIdentityId: "urban_district",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_DISCOVERY_RETURN_001",
    seasonProfileId: "winter",
    returnVisitCategory: "remembered"
  });
  const second = resolveActivityRhythm({
    settlementIdentityId: "urban_district",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_DISCOVERY_RETURN_001",
    seasonProfileId: "winter",
    returnVisitCategory: "remembered"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes activity rhythm diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      seasonKey: "summer",
      features: [
        feature({
          featureId: "coast-plan-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "civic-plan-001",
          featureClass: "civic_site",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "amenity:community_centre"
        }),
        feature({
          featureId: "historic-plan-001",
          featureClass: "building_footprint",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "building:church"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.activitySocialRhythmDecisions.length >= 3, true);
  assert.equal(
    plan.activitySocialRhythmDecisions.every(
      (entry) =>
        "activityProfileId" in entry &&
        "socialRhythmId" in entry &&
        "timeContextProfile" in entry &&
        "activityReason" in entry &&
        "communityImportance" in entry
    ),
    true
  );
  assert.equal(typeof status.activityReason, "string");
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredActivitySocialRhythmRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /activityProfileId/);
  assert.match(source, /socialRhythmId/);
  assert.match(source, /timeContextProfile/);
  assert.match(source, /activityReason/);
  assert.match(source, /communityImportance/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
