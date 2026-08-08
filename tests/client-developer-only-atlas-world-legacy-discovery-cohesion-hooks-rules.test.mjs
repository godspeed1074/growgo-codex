import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks
} from "../client/developer-only-atlas-population-world-legacy-discovery-cohesion-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_49_WORLD_LEGACY_DISCOVERY_COHESION.md"
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
    selectorSeed: "WORLD_LEGACY_SELECTOR_001",
    viewportId: "WORLD_LEGACY_VIEWPORT_001",
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

function resolveWorldLegacy({
  worldWonderProfileId = "WORLD_WONDER_PROFILE_HERITAGE_ICON_001",
  signatureRouteProfileId = "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001",
  metaCollectionId = "META_COLLECTION_HERITAGE_LANDMARK_SET_001",
  generationMemoryProfileId =
    "GENERATION_MEMORY_PROFILE_CROSS_GENERATION_HERITAGE_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks(
    registry,
    {
      worldWonderProfileId,
      signatureRouteProfileId,
      metaCollectionId,
      generationMemoryProfileId
    }
  );
}

test("1. legacy selection stable", () => {
  const first = resolveWorldLegacy();
  const second = resolveWorldLegacy();

  assert.deepEqual(first, second);
  assert.equal(
    first.worldLegacyProfileId,
    "WORLD_LEGACY_PROFILE_HERITAGE_DESTINATION_001"
  );
});

test("2. discovery cohesion deterministic", () => {
  const first = resolveWorldLegacy({
    worldWonderProfileId: "WORLD_WONDER_PROFILE_COASTAL_NATURAL_WONDER_001",
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001",
    metaCollectionId: "META_COLLECTION_EXPEDITION_SET_COASTAL_001",
    generationMemoryProfileId:
      "GENERATION_MEMORY_PROFILE_SHARED_COASTAL_DISCOVERY_001"
  });
  const second = resolveWorldLegacy({
    worldWonderProfileId: "WORLD_WONDER_PROFILE_COASTAL_NATURAL_WONDER_001",
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001",
    metaCollectionId: "META_COLLECTION_EXPEDITION_SET_COASTAL_001",
    generationMemoryProfileId:
      "GENERATION_MEMORY_PROFILE_SHARED_COASTAL_DISCOVERY_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.discoveryCohesionId,
    "DISCOVERY_COHESION_COASTAL_COLLECTION_001"
  );
});

test("3. player/world separation valid", () => {
  const result = resolveWorldLegacy({
    worldWonderProfileId: "WORLD_WONDER_PROFILE_DISCOVERY_MYTHIC_SITE_001",
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001",
    metaCollectionId: "META_COLLECTION_DISCOVERY_MILESTONES_001",
    generationMemoryProfileId:
      "GENERATION_MEMORY_PROFILE_LONG_FORM_DISCOVERY_001"
  });

  assert.equal(result.memoryCategory, "mythic_world_discovery");
  assert.match(result.legacyReason, /world|player|campaign|legacy/i);
});

test("4. same input same output", () => {
  const first = resolveWorldLegacy({
    worldWonderProfileId: "WORLD_WONDER_PROFILE_COMMUNITY_DISCOVERY_ANCHOR_001",
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001",
    metaCollectionId: "META_COLLECTION_LOCAL_JOURNEY_SET_001",
    generationMemoryProfileId:
      "GENERATION_MEMORY_PROFILE_SHARED_COMMUNITY_RETURN_001"
  });
  const second = resolveWorldLegacy({
    worldWonderProfileId: "WORLD_WONDER_PROFILE_COMMUNITY_DISCOVERY_ANCHOR_001",
    signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001",
    metaCollectionId: "META_COLLECTION_LOCAL_JOURNEY_SET_001",
    generationMemoryProfileId:
      "GENERATION_MEMORY_PROFILE_SHARED_COMMUNITY_RETURN_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes legacy cohesion diagnostics", () => {
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
  assert.equal(plan.worldLegacyDiscoveryCohesionDecisions.length >= 1, true);
  assert.equal(
    plan.worldLegacyDiscoveryCohesionDecisions.every(
      (entry) =>
        "worldLegacyProfileId" in entry &&
        "discoveryCohesionId" in entry &&
        "legacyTier" in entry &&
        "memoryCategory" in entry &&
        "legacyReason" in entry
    ),
    true
  );
  assert.equal(typeof status.legacyReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredWorldLegacyRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldLegacyProfileId/);
  assert.match(source, /discoveryCohesionId/);
  assert.match(source, /legacyTier/);
  assert.match(source, /memoryCategory/);
  assert.match(source, /legacyReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
