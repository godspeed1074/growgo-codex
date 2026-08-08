import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks
} from "../client/developer-only-atlas-population-regional-expedition-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_45_REGIONAL_EXPEDITION_CAMPAIGNS.md"
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
    selectorSeed: "REGIONAL_EXPEDITION_SELECTOR_001",
    viewportId: "REGIONAL_EXPEDITION_VIEWPORT_001",
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

function resolveExpedition({
  campaignProfileId = "CAMPAIGN_PROFILE_HERITAGE_ROUTE_001",
  destinationChainId = "DESTINATION_CHAIN_HERITAGE_ROUTE_001",
  progressionTier = "tier_3_landmark",
  districtType = "civic",
  regionId = "BELLARINE"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks(
    registry,
    {
      campaignProfileId,
      destinationChainId,
      progressionTier,
      districtType,
      regionId
    }
  );
}

test("1. expedition selection stable", () => {
  const first = resolveExpedition();
  const second = resolveExpedition();

  assert.deepEqual(first, second);
  assert.equal(first.expeditionProfileId, "EXPEDITION_PROFILE_HERITAGE_LOOP_001");
});

test("2. campaign networks deterministic", () => {
  const first = resolveExpedition({
    campaignProfileId: "CAMPAIGN_PROFILE_COASTAL_TRAIL_001",
    destinationChainId: "DESTINATION_CHAIN_COASTAL_TRAIL_001",
    progressionTier: "tier_2_regional",
    districtType: "coastal_natural",
    regionId: "BELLARINE"
  });
  const second = resolveExpedition({
    campaignProfileId: "CAMPAIGN_PROFILE_COASTAL_TRAIL_001",
    destinationChainId: "DESTINATION_CHAIN_COASTAL_TRAIL_001",
    progressionTier: "tier_2_regional",
    districtType: "coastal_natural",
    regionId: "BELLARINE"
  });

  assert.deepEqual(first, second);
  assert.equal(first.campaignNetworkId, "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001");
});

test("3. completion arcs valid", () => {
  const result = resolveExpedition({
    campaignProfileId: "CAMPAIGN_PROFILE_COMMUNITY_JOURNEY_001",
    destinationChainId: "DESTINATION_CHAIN_COMMUNITY_JOURNEY_001",
    progressionTier: "tier_1_local",
    districtType: "civic",
    regionId: "BELLARINE"
  });

  assert.equal(result.completionArcId, "COMPLETION_ARC_COMMUNITY_RETURN_001");
  assert.match(result.expeditionReason, /community|regional|journey/i);
});

test("4. same input same output", () => {
  const first = resolveExpedition({
    campaignProfileId: "CAMPAIGN_PROFILE_DISCOVERY_RETURN_001",
    destinationChainId: "DESTINATION_CHAIN_DISCOVERY_RETURN_001",
    progressionTier: "tier_2_discovery",
    districtType: "recreation",
    regionId: "BELLARINE"
  });
  const second = resolveExpedition({
    campaignProfileId: "CAMPAIGN_PROFILE_DISCOVERY_RETURN_001",
    destinationChainId: "DESTINATION_CHAIN_DISCOVERY_RETURN_001",
    progressionTier: "tier_2_discovery",
    districtType: "recreation",
    regionId: "BELLARINE"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes expedition diagnostics", () => {
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
  assert.equal(plan.regionalExpeditionDecisions.length >= 3, true);
  assert.equal(
    plan.regionalExpeditionDecisions.every(
      (entry) =>
        "expeditionProfileId" in entry &&
        "campaignNetworkId" in entry &&
        "completionArcId" in entry &&
        "regionalIdentityId" in entry &&
        "expeditionReason" in entry
    ),
    true
  );
  assert.equal(typeof status.expeditionReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredExpeditionRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /expeditionProfileId/);
  assert.match(source, /campaignNetworkId/);
  assert.match(source, /completionArcId/);
  assert.match(source, /regionalIdentityId/);
  assert.match(source, /expeditionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
