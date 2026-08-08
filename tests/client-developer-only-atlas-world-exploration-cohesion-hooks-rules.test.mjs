import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks
} from "../client/developer-only-atlas-population-world-exploration-cohesion-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_46_WORLD_EXPLORATION_COHESION.md"
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
    selectorSeed: "WORLD_COHESION_SELECTOR_001",
    viewportId: "WORLD_COHESION_VIEWPORT_001",
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

function resolveWorldCohesion({
  expeditionProfileId = "EXPEDITION_PROFILE_HERITAGE_LOOP_001",
  campaignNetworkId = "CAMPAIGN_NETWORK_HERITAGE_LANDMARKS_001",
  progressionTier = "tier_3_landmark",
  regionalIdentityId = "REGIONAL_IDENTITY_BELLARINE_HERITAGE_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks(
    registry,
    {
      expeditionProfileId,
      campaignNetworkId,
      progressionTier,
      regionalIdentityId
    }
  );
}

test("1. cross-region journeys stable", () => {
  const first = resolveWorldCohesion();
  const second = resolveWorldCohesion();

  assert.deepEqual(first, second);
  assert.equal(
    first.worldJourneyProfileId,
    "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001"
  );
});

test("2. meta collections deterministic", () => {
  const first = resolveWorldCohesion({
    expeditionProfileId: "EXPEDITION_PROFILE_COASTAL_EXPEDITION_001",
    campaignNetworkId: "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001",
    progressionTier: "tier_2_regional",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COASTAL_001"
  });
  const second = resolveWorldCohesion({
    expeditionProfileId: "EXPEDITION_PROFILE_COASTAL_EXPEDITION_001",
    campaignNetworkId: "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001",
    progressionTier: "tier_2_regional",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COASTAL_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.metaCollectionId,
    "META_COLLECTION_EXPEDITION_SET_COASTAL_001"
  );
});

test("3. world progression valid", () => {
  const result = resolveWorldCohesion({
    expeditionProfileId: "EXPEDITION_PROFILE_COMMUNITY_JOURNEY_001",
    campaignNetworkId: "CAMPAIGN_NETWORK_LOCAL_GATHERINGS_001",
    progressionTier: "tier_1_local",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COMMUNITY_001"
  });

  assert.equal(
    result.crossRegionCampaignId,
    "CROSS_REGION_CAMPAIGN_COMMUNITY_NETWORK_001"
  );
  assert.match(result.worldCohesionReason, /community|meta|campaign/i);
});

test("4. same input same output", () => {
  const first = resolveWorldCohesion({
    expeditionProfileId: "EXPEDITION_PROFILE_NATURE_JOURNEY_001",
    campaignNetworkId: "CAMPAIGN_NETWORK_NATURE_DISCOVERY_001",
    progressionTier: "tier_2_discovery",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
  });
  const second = resolveWorldCohesion({
    expeditionProfileId: "EXPEDITION_PROFILE_NATURE_JOURNEY_001",
    campaignNetworkId: "CAMPAIGN_NETWORK_NATURE_DISCOVERY_001",
    progressionTier: "tier_2_discovery",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes world cohesion diagnostics", () => {
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
  assert.equal(plan.worldExplorationCohesionDecisions.length >= 3, true);
  assert.equal(
    plan.worldExplorationCohesionDecisions.every(
      (entry) =>
        "worldJourneyProfileId" in entry &&
        "metaCollectionId" in entry &&
        "crossRegionCampaignId" in entry &&
        "explorationTier" in entry &&
        "worldCohesionReason" in entry
    ),
    true
  );
  assert.equal(typeof status.worldCohesionReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredWorldExplorationRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldJourneyProfileId/);
  assert.match(source, /metaCollectionId/);
  assert.match(source, /crossRegionCampaignId/);
  assert.match(source, /explorationTier/);
  assert.match(source, /worldCohesionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
