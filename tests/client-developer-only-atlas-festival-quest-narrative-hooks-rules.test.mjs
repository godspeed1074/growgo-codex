import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks
} from "../client/developer-only-atlas-population-festival-quest-narrative-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_43_FESTIVAL_QUEST_NARRATIVE_HOOKS.md"
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
    selectorSeed: "FESTIVAL_QUEST_SELECTOR_001",
    viewportId: "FESTIVAL_QUEST_VIEWPORT_001",
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

function resolveNarrative({
  destinationFrameProfileId = "DESTINATION_FRAME_CIVIC_LANDMARK_001",
  routeMemoryId = "ROUTE_MEMORY_HERITAGE_LANDMARK_001",
  placeMemoryId = "PLACE_MEMORY_HISTORIC_LANDMARK_001",
  recurrencePatternId = "RECURRENCE_PATTERN_EVENT_MONTHLY_001",
  traditionProfileId = "TRADITION_PROFILE_HERITAGE_MARKET_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks(
    registry,
    {
      destinationFrameProfileId,
      routeMemoryId,
      placeMemoryId,
      recurrencePatternId,
      traditionProfileId
    }
  );
}

test("1. festival selection stable", () => {
  const first = resolveNarrative();
  const second = resolveNarrative();

  assert.deepEqual(first, second);
  assert.equal(first.festivalProfileId, "FESTIVAL_PROFILE_HERITAGE_MARKET_001");
});

test("2. quest hooks deterministic", () => {
  const first = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_SCENIC_REVEAL_001",
    routeMemoryId: "ROUTE_MEMORY_SCENIC_COASTAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    traditionProfileId: "TRADITION_PROFILE_COASTAL_SEASONAL_001"
  });
  const second = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_SCENIC_REVEAL_001",
    routeMemoryId: "ROUTE_MEMORY_SCENIC_COASTAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    traditionProfileId: "TRADITION_PROFILE_COASTAL_SEASONAL_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.questNarrativeProfileId,
    "QUEST_NARRATIVE_PROFILE_SCENIC_DISCOVERY_001"
  );
});

test("3. seasonal narratives valid", () => {
  const result = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_CIVIC_LANDMARK_001",
    routeMemoryId: "ROUTE_MEMORY_PARK_TRAIL_001",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001",
    recurrencePatternId: "RECURRENCE_PATTERN_DAILY_WEEKLY_001",
    traditionProfileId: "TRADITION_PROFILE_COMMUNITY_CADENCE_001"
  });

  assert.equal(
    result.seasonalDestinationProfileId,
    "SEASONAL_DESTINATION_PROFILE_LOCAL_GATHERING_001"
  );
  assert.match(result.narrativeReason, /community|journey|gathering/i);
});

test("4. achievement hooks stable", () => {
  const first = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_SPECIAL_SITE_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    recurrencePatternId: "RECURRENCE_PATTERN_DAILY_LOCAL_001",
    traditionProfileId: "TRADITION_PROFILE_DISCOVERY_RETURN_001"
  });
  const second = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_SPECIAL_SITE_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    recurrencePatternId: "RECURRENCE_PATTERN_DAILY_LOCAL_001",
    traditionProfileId: "TRADITION_PROFILE_DISCOVERY_RETURN_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.achievementHookProfileId,
    "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001"
  );
});

test("5. same input same output", () => {
  const first = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_BEACH_GATHERING_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    traditionProfileId: "TRADITION_PROFILE_COASTAL_SEASONAL_001"
  });
  const second = resolveNarrative({
    destinationFrameProfileId: "DESTINATION_FRAME_BEACH_GATHERING_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    traditionProfileId: "TRADITION_PROFILE_COASTAL_SEASONAL_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes narrative diagnostics", () => {
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
  assert.equal(plan.festivalQuestNarrativeDecisions.length >= 3, true);
  assert.equal(
    plan.festivalQuestNarrativeDecisions.every(
      (entry) =>
        "festivalProfileId" in entry &&
        "questNarrativeProfileId" in entry &&
        "seasonalDestinationProfileId" in entry &&
        "achievementHookProfileId" in entry &&
        "narrativeReason" in entry
    ),
    true
  );
  assert.equal(typeof status.narrativeReason, "string");
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredNarrativeRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /festivalProfileId/);
  assert.match(source, /questNarrativeProfileId/);
  assert.match(source, /seasonalDestinationProfileId/);
  assert.match(source, /achievementHookProfileId/);
  assert.match(source, /narrativeReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
