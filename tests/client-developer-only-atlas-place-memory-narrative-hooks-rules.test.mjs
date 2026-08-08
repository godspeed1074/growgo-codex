import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks
} from "../client/developer-only-atlas-population-place-memory-narrative-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_34_PLACE_MEMORY_NARRATIVE_HOOKS.md"
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
    selectorSeed: "PLACE_MEMORY_SELECTOR_001",
    viewportId: "PLACE_MEMORY_VIEWPORT_001",
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

function resolvePlaceMemory({
  featureClass = "coastal_green",
  explorationRouteType = "scenic_coastal_route",
  settlementIdentityId = "coastal_village"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks(
    registry,
    {
      featureClass,
      explorationRouteType,
      settlementIdentityId
    }
  );
}

test("1. place memory is stable", () => {
  const first = resolvePlaceMemory();
  const second = resolvePlaceMemory();

  assert.deepEqual(first, second);
  assert.equal(first.placeMemoryId, "PLACE_MEMORY_NATURAL_WONDER_001");
});

test("2. story category is deterministic", () => {
  const first = resolvePlaceMemory({
    featureClass: "building_footprint",
    explorationRouteType: "heritage_landmark_route",
    settlementIdentityId: "heritage_town"
  });
  const second = resolvePlaceMemory({
    featureClass: "building_footprint",
    explorationRouteType: "heritage_landmark_route",
    settlementIdentityId: "heritage_town"
  });

  assert.deepEqual(first, second);
  assert.equal(first.storyCategory, "historic");
});

test("3. discovery chains are valid", () => {
  const result = resolvePlaceMemory({
    featureClass: "building_footprint",
    explorationRouteType: "achievement_discovery_chain",
    settlementIdentityId: "suburban_community"
  });

  assert.equal(result.placeMemoryId, "PLACE_MEMORY_HISTORIC_LANDMARK_001");
  assert.equal(result.discoveryImportance, "high");
});

test("4. same input same output", () => {
  const first = resolvePlaceMemory({
    featureClass: "civic_site",
    explorationRouteType: "park_trail_route",
    settlementIdentityId: "suburban_community"
  });
  const second = resolvePlaceMemory({
    featureClass: "civic_site",
    explorationRouteType: "park_trail_route",
    settlementIdentityId: "suburban_community"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes place-memory diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
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
  assert.equal(plan.placeMemoryDecisions.length >= 3, true);
  assert.equal(
    plan.placeMemoryDecisions.every(
      (entry) =>
        "placeMemoryId" in entry &&
        "storyCategory" in entry &&
        "localNarrativeProfileId" in entry &&
        "discoveryImportance" in entry &&
        "storyReason" in entry
    ),
    true
  );
  assert.equal(typeof status.storyReason, "string");
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredPlaceMemoryRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /placeMemoryId/);
  assert.match(source, /storyCategory/);
  assert.match(source, /localNarrativeProfileId/);
  assert.match(source, /discoveryImportance/);
  assert.match(source, /storyReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
