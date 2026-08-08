import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks
} from "../client/developer-only-atlas-population-tradition-event-cycle-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_42_TRADITION_EVENT_CYCLE_HOOKS.md"
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
    selectorSeed: "TRADITION_SELECTOR_001",
    viewportId: "TRADITION_VIEWPORT_001",
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

function resolveTradition({
  settlementIdentityId = "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
  storyCategory = "community",
  recurrencePatternId = "RECURRENCE_PATTERN_DAILY_WEEKLY_001",
  communityCadenceId = "COMMUNITY_CADENCE_LOCAL_GATHERING_001",
  seasonProfileId = "summer"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks(
    registry,
    {
      settlementIdentityId,
      storyCategory,
      recurrencePatternId,
      communityCadenceId,
      seasonProfileId
    }
  );
}

test("1. tradition selection stable", () => {
  const first = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    storyCategory: "natural_wonder",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    communityCadenceId: "COMMUNITY_CADENCE_SCENIC_VISITOR_001",
    seasonProfileId: "summer"
  });
  const second = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    storyCategory: "natural_wonder",
    recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
    communityCadenceId: "COMMUNITY_CADENCE_SCENIC_VISITOR_001",
    seasonProfileId: "summer"
  });

  assert.deepEqual(first, second);
  assert.equal(first.traditionProfileId, "TRADITION_PROFILE_COASTAL_SEASONAL_001");
});

test("2. seasonal events deterministic", () => {
  const first = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    storyCategory: "historic",
    recurrencePatternId: "RECURRENCE_PATTERN_EVENT_MONTHLY_001",
    communityCadenceId: "COMMUNITY_CADENCE_MARKET_TRADITION_001",
    seasonProfileId: "autumn"
  });
  const second = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    storyCategory: "historic",
    recurrencePatternId: "RECURRENCE_PATTERN_EVENT_MONTHLY_001",
    communityCadenceId: "COMMUNITY_CADENCE_MARKET_TRADITION_001",
    seasonProfileId: "autumn"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.seasonalEventCycleId,
    "SEASONAL_EVENT_CYCLE_HERITAGE_MARKET_001"
  );
});

test("3. community traditions valid", () => {
  const result = resolveTradition();

  assert.equal(result.communityTraditionId, "COMMUNITY_TRADITION_LOCAL_GATHERING_001");
  assert.equal(result.eventImportance, "medium");
  assert.match(result.traditionReason, /community|gathering|tradition/i);
});

test("4. same input same output", () => {
  const first = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    storyCategory: "hidden_discovery",
    recurrencePatternId: "RECURRENCE_PATTERN_DAILY_LOCAL_001",
    communityCadenceId: "COMMUNITY_CADENCE_QUIET_RETURN_001",
    seasonProfileId: "winter"
  });
  const second = resolveTradition({
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    storyCategory: "hidden_discovery",
    recurrencePatternId: "RECURRENCE_PATTERN_DAILY_LOCAL_001",
    communityCadenceId: "COMMUNITY_CADENCE_QUIET_RETURN_001",
    seasonProfileId: "winter"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes tradition diagnostics", () => {
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
  assert.equal(plan.traditionEventCycleDecisions.length >= 3, true);
  assert.equal(
    plan.traditionEventCycleDecisions.every(
      (entry) =>
        "traditionProfileId" in entry &&
        "seasonalEventCycleId" in entry &&
        "communityTraditionId" in entry &&
        "eventImportance" in entry &&
        "traditionReason" in entry
    ),
    true
  );
  assert.equal(typeof status.traditionReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredTraditionRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /traditionProfileId/);
  assert.match(source, /seasonalEventCycleId/);
  assert.match(source, /communityTraditionId/);
  assert.match(source, /eventImportance/);
  assert.match(source, /traditionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
