import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks
} from "../client/developer-only-atlas-population-world-wonder-discovery-memory-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_48_WORLD_WONDER_DISCOVERY_MEMORY.md"
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
    selectorSeed: "WORLD_WONDER_SELECTOR_001",
    viewportId: "WORLD_WONDER_VIEWPORT_001",
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

function resolveWorldWonder({
  signatureRouteProfileId = "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001",
  worldJourneyProfileId = "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001",
  legacyDestinationId = "LEGACY_DESTINATION_HERITAGE_LANDMARK_001",
  placeMemoryId = "PLACE_MEMORY_HISTORIC_LANDMARK_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks(
    registry,
    {
      signatureRouteProfileId,
      worldJourneyProfileId,
      legacyDestinationId,
      placeMemoryId
    }
  );
}

test("1. wonder selection stable", () => {
  const first = resolveWorldWonder();
  const second = resolveWorldWonder();

  assert.deepEqual(first, second);
  assert.equal(
    first.worldWonderProfileId,
    "WORLD_WONDER_PROFILE_HERITAGE_ICON_001"
  );
});

test("2. epic destinations deterministic", () => {
  const first = resolveWorldWonder({
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001",
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
    legacyDestinationId: "LEGACY_DESTINATION_COASTAL_REVEAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001"
  });
  const second = resolveWorldWonder({
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001",
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
    legacyDestinationId: "LEGACY_DESTINATION_COASTAL_REVEAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.epicDestinationId,
    "EPIC_DESTINATION_COASTAL_REVEAL_001"
  );
});

test("3. memory tiers valid", () => {
  const result = resolveWorldWonder({
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001",
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001",
    legacyDestinationId: "LEGACY_DESTINATION_DISCOVERY_MILESTONE_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
  });

  assert.equal(
    result.discoveryMemoryTier,
    "discovery_memory_tier_2_mythic"
  );
  assert.match(result.wonderReason, /mythic|discovery|generation/i);
});

test("4. same input same output", () => {
  const first = resolveWorldWonder({
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001",
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001",
    legacyDestinationId: "LEGACY_DESTINATION_COMMUNITY_ANCHOR_001",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001"
  });
  const second = resolveWorldWonder({
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001",
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001",
    legacyDestinationId: "LEGACY_DESTINATION_COMMUNITY_ANCHOR_001",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes wonder diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      seasonKey: "summer",
      features: [
        feature({
          featureId: "coast-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "park-001",
          featureClass: "parkland",
          latitude: -38.1357,
          longitude: 144.3491,
          sourceClassification: "leisure:park"
        }),
        feature({
          featureId: "civic-001",
          featureClass: "civic_site",
          latitude: -38.1356,
          longitude: 144.3492,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.worldWonderDiscoveryMemoryDecisions.length >= 1, true);
  assert.equal(
    plan.worldWonderDiscoveryMemoryDecisions.every(
      (entry) =>
        "worldWonderProfileId" in entry &&
        "epicDestinationId" in entry &&
        "discoveryMemoryTier" in entry &&
        "generationMemoryProfileId" in entry &&
        "wonderReason" in entry
    ),
    true
  );
  assert.equal(typeof status.wonderReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredWorldWonderRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldWonderProfileId/);
  assert.match(source, /epicDestinationId/);
  assert.match(source, /discoveryMemoryTier/);
  assert.match(source, /generationMemoryProfileId/);
  assert.match(source, /wonderReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
