import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks
} from "../client/developer-only-atlas-population-seasonal-story-memory-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_35_SEASONAL_STORY_MEMORY.md"
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
    selectorSeed: "SEASONAL_MEMORY_SELECTOR_001",
    viewportId: "SEASONAL_MEMORY_VIEWPORT_001",
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

function resolveSeasonalMemory({
  seasonProfileId = "summer",
  biomeProfileId = "coastal",
  storyCategory = "natural_wonder"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks(
    registry,
    {
      seasonProfileId,
      biomeProfileId,
      storyCategory
    }
  );
}

test("1. seasonal story is stable", () => {
  const first = resolveSeasonalMemory();
  const second = resolveSeasonalMemory();

  assert.deepEqual(first, second);
  assert.equal(
    first.memoryStateId,
    "MEMORY_STATE_SEASONAL_COASTAL_DISCOVERED_001"
  );
});

test("2. event hooks are deterministic", () => {
  const first = resolveSeasonalMemory({
    seasonProfileId: "autumn",
    biomeProfileId: "urban",
    storyCategory: "historic"
  });
  const second = resolveSeasonalMemory({
    seasonProfileId: "autumn",
    biomeProfileId: "urban",
    storyCategory: "historic"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.eventHookProfileId,
    "EVENT_HOOK_PROFILE_HERITAGE_FESTIVAL_001"
  );
});

test("3. return memory is stable", () => {
  const result = resolveSeasonalMemory({
    seasonProfileId: "summer",
    biomeProfileId: "suburban",
    storyCategory: "community"
  });

  assert.equal(result.returnVisitCategory, "remembered");
  assert.equal(
    result.storyEvolutionReason,
    "community_event_recurrence_and_local_memory"
  );
});

test("4. same input same output", () => {
  const first = resolveSeasonalMemory({
    seasonProfileId: "winter",
    biomeProfileId: "urban",
    storyCategory: "historic"
  });
  const second = resolveSeasonalMemory({
    seasonProfileId: "winter",
    biomeProfileId: "urban",
    storyCategory: "historic"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes seasonal memory diagnostics", () => {
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
  assert.equal(plan.seasonalStoryMemoryDecisions.length >= 3, true);
  assert.equal(
    plan.seasonalStoryMemoryDecisions.every(
      (entry) =>
        "memoryStateId" in entry &&
        "seasonalStoryProfileId" in entry &&
        "eventHookProfileId" in entry &&
        "returnVisitCategory" in entry &&
        "storyEvolutionReason" in entry
    ),
    true
  );
  assert.equal(typeof status.storyEvolutionReason, "string");
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSeasonalStoryMemoryRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /memoryStateId/);
  assert.match(source, /seasonalStoryProfileId/);
  assert.match(source, /eventHookProfileId/);
  assert.match(source, /returnVisitCategory/);
  assert.match(source, /storyEvolutionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
