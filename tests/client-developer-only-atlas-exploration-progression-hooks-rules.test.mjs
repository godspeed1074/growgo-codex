import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks
} from "../client/developer-only-atlas-population-exploration-progression-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_44_DESTINATION_CHAIN_PROGRESSION.md"
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
    selectorSeed: "EXPLORATION_PROGRESSION_SELECTOR_001",
    viewportId: "EXPLORATION_PROGRESSION_VIEWPORT_001",
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

function resolveProgression({
  seasonalDestinationProfileId = "SEASONAL_DESTINATION_PROFILE_HERITAGE_GATHERING_001",
  routePriority = "high_heritage",
  achievementHookProfileId = "ACHIEVEMENT_HOOK_PROFILE_HERITAGE_COLLECTION_001",
  questNarrativeProfileId = "QUEST_NARRATIVE_PROFILE_HERITAGE_SEQUENCE_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks(
    registry,
    {
      seasonalDestinationProfileId,
      routePriority,
      achievementHookProfileId,
      questNarrativeProfileId
    }
  );
}

test("1. destination chains stable", () => {
  const first = resolveProgression();
  const second = resolveProgression();

  assert.deepEqual(first, second);
  assert.equal(first.destinationChainId, "DESTINATION_CHAIN_HERITAGE_ROUTE_001");
});

test("2. reward arcs deterministic", () => {
  const first = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001",
    routePriority: "high_scenic",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_SCENIC_EXPLORER_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_SCENIC_DISCOVERY_001"
  });
  const second = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001",
    routePriority: "high_scenic",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_SCENIC_EXPLORER_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_SCENIC_DISCOVERY_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.rewardArcProfileId, "REWARD_ARC_PROFILE_SCENIC_DISCOVERY_001");
});

test("3. campaigns valid", () => {
  const result = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_LOCAL_GATHERING_001",
    routePriority: "medium_trail",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_COMMUNITY_RETURN_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_COMMUNITY_JOURNEY_001"
  });

  assert.equal(result.campaignProfileId, "CAMPAIGN_PROFILE_COMMUNITY_JOURNEY_001");
  assert.match(result.explorationReason, /community|journey|return/i);
});

test("4. progression tiers stable", () => {
  const first = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_RETURN_VISIT_001",
    routePriority: "medium_discovery",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
  });
  const second = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_RETURN_VISIT_001",
    routePriority: "medium_discovery",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.progressionTier, "tier_2_discovery");
});

test("5. same input same output", () => {
  const first = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001",
    routePriority: "medium_discovery",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
  });
  const second = resolveProgression({
    seasonalDestinationProfileId: "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001",
    routePriority: "medium_discovery",
    achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001",
    questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes exploration diagnostics", () => {
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
  assert.equal(plan.explorationProgressionDecisions.length >= 3, true);
  assert.equal(
    plan.explorationProgressionDecisions.every(
      (entry) =>
        "campaignProfileId" in entry &&
        "destinationChainId" in entry &&
        "rewardArcProfileId" in entry &&
        "progressionTier" in entry &&
        "explorationReason" in entry
    ),
    true
  );
  assert.equal(typeof status.explorationReason, "string");
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredExplorationRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /campaignProfileId/);
  assert.match(source, /destinationChainId/);
  assert.match(source, /rewardArcProfileId/);
  assert.match(source, /progressionTier/);
  assert.match(source, /explorationReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
