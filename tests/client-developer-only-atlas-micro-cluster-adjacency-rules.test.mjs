import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry,
  getDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency
} from "../client/developer-only-atlas-population-micro-cluster-adjacency-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_29_MICRO_CLUSTER_ADJACENCY_RULES.md"
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
    selectorSeed: "MICRO_CLUSTER_SELECTOR_001",
    viewportId: "MICRO_CLUSTER_VIEWPORT_001",
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

function resolveMicroCluster({
  featureClass = "building_footprint",
  districtType = "residential",
  assetFamilyId = "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001",
  selectedAssetId = "TREE_EUCALYPTUS_001",
  selectorSeed = "MICRO_CLUSTER_001",
  deterministicFeatureIdentity = "feature-001",
  coordinate = { latitude: -38.13565, longitude: 144.34905 },
  candidateIndex = 0,
  budgetRemaining = 3
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency(registry, {
    featureClass,
    districtType,
    assetFamilyId,
    selectedAssetId,
    selectorSeed,
    deterministicFeatureIdentity,
    coordinate,
    candidateIndex,
    budgetRemaining
  });
}

test("1. cluster generation is stable", () => {
  const first = resolveMicroCluster();
  const second = resolveMicroCluster();

  assert.deepEqual(first, second);
  assert.equal(first.clusterType, "residential");
  assert.equal(typeof first.microClusterId, "string");
});

test("2. adjacency rules are valid", () => {
  const result = resolveMicroCluster({
    featureClass: "civic_site",
    districtType: "civic",
    assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
    selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.clusterType, "civic");
  assert.equal(result.adjacencyReason, "civic_foreground_and_landscape_cluster");
});

test("3. variation is deterministic", () => {
  const left = resolveMicroCluster({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    candidateIndex: 0
  });
  const right = resolveMicroCluster({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    candidateIndex: 0
  });

  assert.deepEqual(left, right);
  assert.equal(typeof left.variationSeed, "string");
});

test("4. incompatible combinations are rejected", () => {
  const result = resolveMicroCluster({
    featureClass: "coastal_green",
    districtType: "commercial",
    assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_MICRO_CLUSTER_CONTEXT");
});

test("5. budgets are preserved and planner exposes micro-cluster diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "suburban-plan-001",
          sourceClassification: "building:house"
        }),
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          latitude: -38.13575,
          longitude: 144.34925,
          sourceClassification: "green:near_coast"
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
  assert.equal(plan.microClusterAdjacencyDecisions.length >= 3, true);
  assert.equal(typeof status.microClusterId, "string");
  assert.equal(typeof status.clusterType, "string");
  assert.equal(typeof status.childAssetCount, "number");
  assert.equal(typeof status.adjacencyReason, "string");
  assert.equal(typeof status.variationSeed, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "microClusterId" in entry &&
        "clusterType" in entry &&
        "childAssetCount" in entry &&
        "adjacencyReason" in entry &&
        "variationSeed" in entry
    ),
    true
  );
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredMicroClusterRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /microClusterId/);
  assert.match(source, /clusterType/);
  assert.match(source, /childAssetCount/);
  assert.match(source, /adjacencyReason/);
  assert.match(source, /variationSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
