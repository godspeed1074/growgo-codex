import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry,
  getDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationStreetscapeVergeEdge
} from "../client/developer-only-atlas-population-streetscape-verge-edge-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_22_STREETSCAPE_VERGE_EDGE_RULES.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "building_footprint",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "building:house"
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
    selectorSeed: "STREETSCAPE_SELECTOR_001",
    viewportId: "STREETSCAPE_VIEWPORT_001",
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

function resolveStreetscape({
  districtType = "residential",
  corridorType = "local",
  parcelPatternId = "PARCEL_PATTERN_STANDALONE_LOT_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationStreetscapeVergeEdge(registry, {
    districtType,
    corridorType,
    parcelPatternId
  });
}

test("1. streetscape selection is stable", () => {
  const first = resolveStreetscape();
  const second = resolveStreetscape();

  assert.deepEqual(first, second);
  assert.equal(first.streetscapeProfileId, "STREETSCAPE_PROFILE_SUBURBAN_001");
});

test("2. verge selection is deterministic", () => {
  const result = resolveStreetscape({
    districtType: "coastal_natural",
    corridorType: "green_corridor",
    parcelPatternId: "PARCEL_PATTERN_RURAL_BLOCK_001"
  });

  assert.equal(result.vergeType, "native_verge");
});

test("3. edge conditions are stable", () => {
  const result = resolveStreetscape({
    districtType: "commercial",
    corridorType: "pedestrian",
    parcelPatternId: "PARCEL_PATTERN_COMMERCIAL_FRONTAGE_001"
  });

  assert.equal(result.edgeConditionType, "wall_placeholder");
  assert.equal(result.streetFurnitureProfile, "town_center_placeholder_furniture_line");
});

test("4. profiles vary correctly", () => {
  const suburban = resolveStreetscape({
    districtType: "residential",
    corridorType: "collector",
    parcelPatternId: "PARCEL_PATTERN_STANDALONE_LOT_001"
  });
  const civic = resolveStreetscape({
    districtType: "civic",
    corridorType: "collector",
    parcelPatternId: "PARCEL_PATTERN_CIVIC_FORECOURT_001"
  });

  assert.notEqual(suburban.streetscapeProfileId, civic.streetscapeProfileId);
  assert.notEqual(suburban.streetscapeReason, civic.streetscapeReason);
});

test("5. budgets preserved and planner exposes streetscape diagnostics", () => {
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
          featureId: "coast-plan-001",
          featureClass: "coastal_green",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "shop-plan-001",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "shop:bakery"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.streetscapeDecisions.length >= 3, true);
  assert.equal(typeof status.streetscapeProfileId === "string", true);
  assert.equal(typeof status.vergeType === "string", true);
  assert.equal(typeof status.edgeConditionType === "string", true);
  assert.equal(typeof status.streetFurnitureProfile === "string", true);
  assert.equal(typeof status.streetscapeReason === "string", true);
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredStreetscapeRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /streetscapeProfileId/);
  assert.match(source, /vergeType/);
  assert.match(source, /edgeConditionType/);
  assert.match(source, /streetFurnitureProfile/);
  assert.match(source, /streetscapeReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
