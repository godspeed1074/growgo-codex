import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry,
  getDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFraming
} from "../client/developer-only-atlas-population-open-space-landmark-framing-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_23_OPEN_SPACE_LANDMARK_FRAMING_RULES.md"
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
    selectorSeed: "LANDMARK_SELECTOR_001",
    viewportId: "LANDMARK_VIEWPORT_001",
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

function resolveFraming({
  featureClass = "civic_site",
  sourceClassification = "amenity:community_centre",
  districtType = "civic",
  parcelPatternId = "PARCEL_PATTERN_CIVIC_FORECOURT_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFraming(registry, {
    featureClass,
    sourceClassification,
    districtType,
    parcelPatternId
  });
}

test("1. civic foreground is stable", () => {
  const first = resolveFraming();
  const second = resolveFraming();

  assert.deepEqual(first, second);
  assert.equal(first.foregroundType, "civic_entry_foreground");
});

test("2. landmark framing is stable", () => {
  const result = resolveFraming({
    featureClass: "building_footprint",
    sourceClassification: "building:church",
    districtType: "mixed_use",
    parcelPatternId: "PARCEL_PATTERN_COMMERCIAL_FRONTAGE_001"
  });

  assert.equal(
    result.landmarkFramingRuleId,
    "LANDMARK_FRAMING_CHURCH_FOREGROUND_001"
  );
  assert.equal(result.approachDirection, "ceremonial_approach");
});

test("3. open space is preserved", () => {
  const result = resolveFraming({
    featureClass: "sports_ground",
    sourceClassification: "leisure:pitch",
    districtType: "recreation",
    parcelPatternId: "PARCEL_PATTERN_RURAL_BLOCK_001"
  });

  assert.equal(result.foregroundType, "recreation_open_space");
  assert.equal(result.openSpaceRatio >= 0.72, true);
});

test("4. recreation rules are stable", () => {
  const result = resolveFraming({
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast",
    districtType: "coastal_natural",
    parcelPatternId: "PARCEL_PATTERN_RURAL_BLOCK_001"
  });

  assert.equal(
    result.landmarkFramingRuleId,
    "LANDMARK_FRAMING_SCENIC_POINT_001"
  );
  assert.equal(result.visibilityReason, "open_sightline_and_supporting_landscape");
});

test("5. same input same output", () => {
  const first = resolveFraming({
    featureClass: "civic_site",
    sourceClassification: "amenity:school",
    districtType: "civic",
    parcelPatternId: "PARCEL_PATTERN_CIVIC_FORECOURT_001"
  });
  const second = resolveFraming({
    featureClass: "civic_site",
    sourceClassification: "amenity:school",
    districtType: "civic",
    parcelPatternId: "PARCEL_PATTERN_CIVIC_FORECOURT_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes landmark framing diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "civic-plan-001",
          featureClass: "civic_site",
          sourceClassification: "amenity:community_centre"
        }),
        feature({
          featureId: "church-plan-001",
          featureClass: "building_footprint",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "building:church"
        }),
        feature({
          featureId: "recreation-plan-001",
          featureClass: "sports_ground",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "leisure:pitch"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.openSpaceLandmarkFramingDecisions.length >= 3, true);
  assert.equal(typeof status.landmarkFramingRuleId === "string", true);
  assert.equal(typeof status.foregroundType === "string", true);
  assert.equal(typeof status.approachDirection === "string", true);
  assert.equal(typeof status.openSpaceRatio === "number", true);
  assert.equal(typeof status.visibilityReason === "string", true);
});

test("7. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredLandmarkFramingRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /landmarkFramingRuleId/);
  assert.match(source, /foregroundType/);
  assert.match(source, /approachDirection/);
  assert.match(source, /openSpaceRatio/);
  assert.match(source, /visibilityReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
