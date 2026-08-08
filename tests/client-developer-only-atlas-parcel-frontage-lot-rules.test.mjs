import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry,
  getDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationParcelFrontageLot
} from "../client/developer-only-atlas-population-parcel-frontage-lot-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_21_PARCEL_FRONTAGE_LOT_RULES.md"
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
    selectorSeed: "PARCEL_SELECTOR_001",
    viewportId: "PARCEL_VIEWPORT_001",
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

function resolveParcel({
  districtType = "residential",
  neighborhoodPatternId = "NEIGHBORHOOD_PATTERN_SUBURBAN_STREET_001",
  corridorType = "local",
  relationshipDiagnostics = {},
  featureInput = feature(),
  orientationHint = null
} = {}) {
  const registry = createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationParcelFrontageLot(registry, {
    feature: featureInput,
    districtType,
    neighborhoodPatternId,
    corridorType,
    relationshipDiagnostics,
    orientationHint
  });
}

test("1. parcel selection is stable", () => {
  const first = resolveParcel();
  const second = resolveParcel();

  assert.deepEqual(first, second);
  assert.equal(first.parcelPatternId, "PARCEL_PATTERN_STANDALONE_LOT_001");
});

test("2. frontage direction is stable", () => {
  const result = resolveParcel({
    orientationHint: 90
  });

  assert.equal(result.frontageDirection, "east_west");
});

test("3. lot patterns are deterministic", () => {
  const result = resolveParcel({
    districtType: "commercial",
    featureInput: feature({
      featureId: "shop-001",
      sourceClassification: "shop:bakery"
    }),
    corridorType: "pedestrian"
  });

  assert.equal(result.lotType, "shopfront_lot");
  assert.equal(result.frontageDirection, "road_facing");
});

test("4. corner lots resolve correctly", () => {
  const result = resolveParcel({
    relationshipDiagnostics: {
      nearestRoadId: "road-corner-001",
      connectedDistrictIds: [
        "DISTRICT_RESIDENTIAL_001",
        "DISTRICT_COMMERCIAL_001"
      ]
    }
  });

  assert.equal(result.parcelPatternId, "PARCEL_PATTERN_CORNER_LOT_001");
  assert.equal(result.frontageRoadId, "road-corner-001");
});

test("5. budgets preserved and planner exposes parcel diagnostics", () => {
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
          sourceClassification: "shop:bakery"
        }),
        feature({
          featureId: "civic-plan-001",
          featureClass: "civic_site",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.parcelFrontageLotDecisions.length >= 3, true);
  assert.equal(typeof status.parcelPatternId === "string", true);
  assert.equal(typeof status.lotType === "string", true);
  assert.equal(typeof status.frontageDirection === "string", true);
  assert.equal(typeof status.setbackDistance === "number", true);
  assert.equal(typeof status.boundaryPattern === "string", true);
});

test("6. automatic controller regression remains planning safe", () => {
  const registry = createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistryStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredParcelRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /parcelPatternId/);
  assert.match(source, /lotType/);
  assert.match(source, /frontageDirection/);
  assert.match(source, /frontageRoadId/);
  assert.match(source, /setbackDistance/);
  assert.match(source, /boundaryPattern/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
