import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry,
  getDeveloperOnlyAtlasPopulationRelationshipRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationRelationshipPlacements
} from "../client/developer-only-atlas-population-relationship-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_16_ROAD_BOUNDARY_RELATIONSHIP_RULES.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "park",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 180,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity
  };
}

function road({
  id = "road-001",
  highway = "residential",
  coords = [
    [-38.1356, 144.349],
    [-38.1357, 144.3492]
  ]
} = {}) {
  return { id, highway, coords };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "RELATION_SELECTOR_001",
    viewportId: "VIEWPORT_REL_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [],
    relationshipContext: {
      roadWays: []
    },
    ...overrides
  };
}

test("1. building orientation remains stable against nearest road", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const input = plannerInput({
    features: [
      feature({
        featureId: "civic-001",
        featureClass: "civic_site",
        latitude: -38.13565,
        longitude: 144.34905,
        area: 420,
        width: 54,
        height: 28
      })
    ],
    relationshipContext: {
      roadWays: [
        road({
          id: "road-facing-001",
          coords: [
            [-38.13565, 144.3489],
            [-38.13565, 144.3487]
          ]
        })
      ]
    }
  });

  const first = createDeveloperOnlyAtlasWorldPopulationPlan(planner, input);
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(planner, input);

  assert.deepEqual(first, second);
  assert.equal(first.relationshipDecisions[0].nearestRoadId, "road-facing-001");
  assert.equal(
    [0, 90, 180, 270].includes(first.relationshipDecisions[0].orientationDecision),
    true
  );
  assert.equal(first.commands[0].rotation, first.relationshipDecisions[0].orientationDecision);
});

test("2. road relationship diagnostics are deterministic", () => {
  const registry = createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry();
  const input = {
    matchedRecipeId: "BUILDING_GENERIC_RECIPE_001",
    feature: feature({
      featureId: "building-001",
      featureClass: "building_footprint",
      area: 320
    }),
    selectorSeed: "REL_RULE_001",
    placements: [
      {
        assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
        assetVersion: "1.0.0",
        candidateIndex: 0,
        coordinate: { latitude: -38.13565, longitude: 144.34905 },
        placementKind: "building_anchor",
        deterministicPlacementSeed: "placement-seed-001"
      }
    ],
    relationshipContext: {
      roadWays: [
        road({
          id: "road-main-001",
          coords: [
            [-38.1355, 144.349],
            [-38.1358, 144.349]
          ]
        })
      ]
    }
  };

  const first = resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
    registry,
    input
  );
  const second = resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
    registry,
    input
  );

  assert.deepEqual(first, second);
  assert.equal(first.featureDiagnostics.nearestRoadId, "road-main-001");
  assert.equal(first.featureDiagnostics.placementReason, "building_fronts_nearest_road");
});

test("3. vegetation avoids road surfaces through relationship rejection", () => {
  const registry = createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry();
  const result = resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
    registry,
    {
      matchedRecipeId: "COASTAL_GREEN_RECIPE_001",
      feature: feature({
        featureId: "roadside-001",
        featureClass: "roadside_green",
        area: 120
      }),
      selectorSeed: "REL_ROAD_001",
      placements: [
        {
          assetId: "TREE_BOTTLEBRUSH_001",
          assetVersion: "v002",
          candidateIndex: 0,
          coordinate: { latitude: -38.1356, longitude: 144.34901 },
          placementKind: "interior_tree",
          deterministicPlacementSeed: "tree-placement-001"
        }
      ],
      relationshipContext: {
        roadWays: [
        road({
          id: "road-near-veg-001",
          coords: [
            [-38.13564, 144.34904],
            [-38.135641, 144.349041]
          ]
        })
      ]
      }
    }
  );

  assert.equal(result.rejectedPlacements.length, 1);
  assert.equal(result.rejectedPlacements[0].reasonCode, "ROAD_EXCLUSION_ZONE_BLOCKED");
  assert.equal(result.rejectedPlacements[0].relationshipDiagnostics.nearestRoadId, "road-near-veg-001");
});

test("4. boundary rules stay stable for park edge planting", () => {
  const registry = createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry();
  const input = {
    matchedRecipeId: "PARK_PUBLIC_GREEN_RECIPE_001",
    feature: feature({
      featureId: "park-001",
      featureClass: "park",
      area: 220
    }),
    selectorSeed: "REL_BOUNDARY_001",
    placements: [
      {
        assetId: "SHRUB_COASTAL_LOW_001",
        assetVersion: "v002",
        candidateIndex: 0,
        coordinate: { latitude: -38.13561, longitude: 144.34912 },
        placementKind: "edge_cluster",
        deterministicPlacementSeed: "shrub-boundary-001"
      }
    ],
    relationshipContext: {
      roadWays: []
    }
  };

  const first = resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
    registry,
    input
  );
  const second = resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
    registry,
    input
  );

  assert.deepEqual(first, second);
  assert.equal(first.featureDiagnostics.placementReason, "park_edge_planting");
  assert.equal(typeof first.featureDiagnostics.boundaryDistance, "number");
});

test("5. same input is deterministic and different coordinates vary validly", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const first = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "veg-001",
          featureClass: "coastal_green",
          latitude: -38.13565,
          longitude: 144.34905,
          area: 180
        })
      ],
      relationshipContext: {
        roadWays: [road()]
      }
    })
  );
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "veg-002",
          featureClass: "coastal_green",
          latitude: -38.13585,
          longitude: 144.34925,
          area: 180
        })
      ],
      relationshipContext: {
        roadWays: [road()]
      }
    })
  );

  assert.notDeepEqual(first.commands, second.commands);
  assert.equal(first.relationshipDecisions.length >= 1, true);
  assert.equal(second.relationshipDecisions.length >= 1, true);
});

test("6. relationship registry status and session doc stay developer-only", () => {
  const registry = createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry();
  const status = getDeveloperOnlyAtlasPopulationRelationshipRuleRegistryStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredRelationshipRuleCount, 4);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.match(source, /relationshipRuleId/);
  assert.match(source, /nearestRoadId/);
  assert.match(source, /placementReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
