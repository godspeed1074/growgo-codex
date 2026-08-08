import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry,
  getDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationCorridorConnectivity
} from "../client/developer-only-atlas-population-corridor-connectivity-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_20_CORRIDOR_CONNECTIVITY_RULES.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "building_footprint",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "building:house"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "CORRIDOR_SELECTOR_001",
    viewportId: "CORRIDOR_VIEWPORT_001",
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

function resolveCorridor({
  districtId = "DISTRICT_RESIDENTIAL_001",
  districtType = "residential",
  districtTransitionReason = "residential_settlement_continuity",
  worldFillCategory = "residential",
  relationshipContext = { roadWays: [] },
  featureInput = feature()
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationCorridorConnectivity(registry, {
    feature: featureInput,
    selectorSeed: "CORRIDOR_DIRECT_001",
    districtId,
    districtType,
    districtTransitionReason,
    worldFillCategory,
    relationshipContext
  });
}

test("1. corridor selection is stable", () => {
  const first = resolveCorridor({
    relationshipContext: { roadWays: [{ id: "road-1" }] }
  });
  const second = resolveCorridor({
    relationshipContext: { roadWays: [{ id: "road-1" }] }
  });

  assert.deepEqual(first, second);
  assert.equal(first.corridorType, "local");
});

test("2. district connections are deterministic", () => {
  const result = resolveCorridor({
    districtId: "DISTRICT_MIXED_USE_001",
    districtType: "mixed_use",
    districtTransitionReason: "residential_to_commercial",
    worldFillCategory: "commercial",
    relationshipContext: { roadWays: [{ id: "road-a" }, { id: "road-b" }] },
    featureInput: feature({
      featureId: "mixed-001",
      sourceClassification: "cafe:frontage"
    })
  });

  assert.equal(result.corridorId, "CORRIDOR_ARTERIAL_001");
  assert.deepEqual(result.connectedDistrictIds, [
    "DISTRICT_MIXED_USE_001",
    "DISTRICT_COMMERCIAL_001"
  ]);
});

test("3. isolated regions are handled safely", () => {
  const result = resolveCorridor({
    districtId: "DISTRICT_COASTAL_NATURAL_001",
    districtType: "coastal_natural",
    districtTransitionReason: "coastal_to_settlement_edge",
    worldFillCategory: "coastal",
    relationshipContext: { roadWays: [] },
    featureInput: feature({
      featureId: "coast-001",
      featureClass: "coastal_green",
      sourceClassification: "green:near_coast"
    })
  });

  assert.equal(result.corridorType, "green_corridor");
  assert.equal(result.connectivityReason, "coastal_to_settlement_edge");
});

test("4. same input same output", () => {
  const residential = resolveCorridor({
    districtId: "DISTRICT_RESIDENTIAL_001",
    districtType: "residential",
    relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
  });

  assert.equal(typeof residential.connectivitySeed, "string");
  assert.equal(residential.movementPriority, "medium_high");
});

test("5. budgets preserved and planner exposes corridor diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "res-plan-001",
          sourceClassification: "building:house"
        }),
        feature({
          featureId: "shop-plan-001",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "cafe:frontage"
        }),
        feature({
          featureId: "park-plan-001",
          featureClass: "park",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "leisure:park"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.corridorConnectivityDecisions.length >= 3, true);
  assert.equal(typeof status.corridorId === "string", true);
  assert.equal(typeof status.corridorType === "string", true);
  assert.equal(Array.isArray(status.connectedDistrictIds), true);
  assert.equal(typeof status.connectivityReason === "string", true);
  assert.equal(typeof status.movementPriority === "string", true);
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredCorridorRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /corridorId/);
  assert.match(source, /corridorType/);
  assert.match(source, /connectedDistrictIds/);
  assert.match(source, /connectivityReason/);
  assert.match(source, /movementPriority/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
