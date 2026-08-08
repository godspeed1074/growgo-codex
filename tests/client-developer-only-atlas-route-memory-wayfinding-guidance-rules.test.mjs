import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry,
  getDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance
} from "../client/developer-only-atlas-population-route-memory-wayfinding-guidance-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_33_ROUTE_MEMORY_WAYFINDING_GUIDANCE.md"
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
    selectorSeed: "ROUTE_GUIDANCE_SELECTOR_001",
    viewportId: "ROUTE_GUIDANCE_VIEWPORT_001",
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

function resolveRoute({
  featureClass = "coastal_green",
  districtType = "coastal_natural",
  biomeProfileId = "coastal",
  destinationFrameProfileId = "DESTINATION_FRAME_SCENIC_REVEAL_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance(
    registry,
    {
      featureClass,
      districtType,
      biomeProfileId,
      destinationFrameProfileId
    }
  );
}

test("1. route selection is stable", () => {
  const first = resolveRoute();
  const second = resolveRoute();

  assert.deepEqual(first, second);
  assert.equal(first.routeMemoryId, "ROUTE_MEMORY_SCENIC_COASTAL_001");
});

test("2. guidance is deterministic", () => {
  const first = resolveRoute({
    featureClass: "building_footprint",
    districtType: "mixed_use",
    biomeProfileId: "urban",
    destinationFrameProfileId: "DESTINATION_FRAME_SPECIAL_SITE_001"
  });
  const second = resolveRoute({
    featureClass: "building_footprint",
    districtType: "mixed_use",
    biomeProfileId: "urban",
    destinationFrameProfileId: "DESTINATION_FRAME_SPECIAL_SITE_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.explorationRouteType, "heritage_landmark_route");
});

test("3. scenic routes are stable", () => {
  const result = resolveRoute({
    featureClass: "park",
    districtType: "recreation",
    biomeProfileId: "coastal",
    destinationFrameProfileId: "DESTINATION_FRAME_BEACH_GATHERING_001"
  });

  assert.equal(result.wayfindingProfileId, "WAYFINDING_PROFILE_SCENIC_COASTAL_001");
  assert.equal(result.routePriority, "high_scenic");
});

test("4. destination chains are valid", () => {
  const result = resolveRoute({
    featureClass: "civic_site",
    districtType: "civic",
    biomeProfileId: "suburban",
    destinationFrameProfileId: "DESTINATION_FRAME_CIVIC_LANDMARK_001"
  });

  assert.equal(result.routeMemoryId, "ROUTE_MEMORY_HERITAGE_LANDMARK_001");
  assert.equal(
    result.guidanceReason,
    "heritage_sequence_and_landmark_wayfinding_memory"
  );
});

test("5. budgets preserved and planner exposes route guidance diagnostics", () => {
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
          featureId: "special-plan-001",
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
  assert.equal(plan.routeGuidanceDecisions.length >= 3, true);
  assert.equal(
    plan.routeGuidanceDecisions.every(
      (entry) =>
        "routeMemoryId" in entry &&
        "wayfindingProfileId" in entry &&
        "explorationRouteType" in entry &&
        "guidanceReason" in entry &&
        "routePriority" in entry
    ),
    true
  );
  assert.equal(typeof status.guidanceReason, "string");
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredRouteGuidanceRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /routeMemoryId/);
  assert.match(source, /wayfindingProfileId/);
  assert.match(source, /explorationRouteType/);
  assert.match(source, /guidanceReason/);
  assert.match(source, /routePriority/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
