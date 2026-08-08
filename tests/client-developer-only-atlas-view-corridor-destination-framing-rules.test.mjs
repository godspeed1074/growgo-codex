import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry,
  getDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming
} from "../client/developer-only-atlas-population-view-corridor-destination-framing-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_32_VIEW_CORRIDOR_DESTINATION_FRAMING.md"
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
    selectorSeed: "DESTINATION_SELECTOR_001",
    viewportId: "DESTINATION_VIEWPORT_001",
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

function resolveDestination({
  featureClass = "civic_site",
  districtType = "civic",
  sourceClassification = "amenity:community_centre",
  specialSiteType = "local_landmark"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming(
    registry,
    {
      featureClass,
      districtType,
      sourceClassification,
      specialSiteType
    }
  );
}

test("1. view corridors are stable", () => {
  const first = resolveDestination();
  const second = resolveDestination();

  assert.deepEqual(first, second);
  assert.equal(first.viewCorridorId, "VIEW_CORRIDOR_LANDMARK_SIGHTLINE_001");
});

test("2. approaches are deterministic", () => {
  const first = resolveDestination({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    sourceClassification: "tourist:lookout",
    specialSiteType: "tourist_special_location"
  });
  const second = resolveDestination({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    sourceClassification: "tourist:lookout",
    specialSiteType: "tourist_special_location"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.approachSequenceId,
    "APPROACH_SEQUENCE_SCENIC_DESTINATION_001"
  );
});

test("3. destinations frame correctly", () => {
  const result = resolveDestination({
    featureClass: "park",
    districtType: "recreation",
    sourceClassification: "tourist:beach",
    specialSiteType: "tourist_special_location"
  });

  assert.equal(
    result.destinationFrameProfileId,
    "DESTINATION_FRAME_BEACH_GATHERING_001"
  );
  assert.equal(result.arrivalReason.includes("beach_arrival"), true);
});

test("4. visibility rules are stable", () => {
  const result = resolveDestination({
    featureClass: "building_footprint",
    districtType: "mixed_use",
    sourceClassification: "building:church",
    specialSiteType: "historic_building"
  });

  assert.equal(result.visibilityPriority, "landmark_sightline_high");
});

test("5. budgets preserved and planner exposes destination framing diagnostics", () => {
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
          featureId: "coast-plan-001",
          featureClass: "park",
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
  assert.equal(plan.destinationFramingDecisions.length >= 3, true);
  assert.equal(typeof status.viewCorridorId, "string");
  assert.equal(typeof status.approachSequenceId, "string");
  assert.equal(typeof status.destinationFrameProfileId, "string");
  assert.equal(typeof status.arrivalReason, "string");
  assert.equal(typeof status.visibilityPriority, "string");
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredDestinationFramingRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /viewCorridorId/);
  assert.match(source, /approachSequenceId/);
  assert.match(source, /destinationFrameProfileId/);
  assert.match(source, /arrivalReason/);
  assert.match(source, /visibilityPriority/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
