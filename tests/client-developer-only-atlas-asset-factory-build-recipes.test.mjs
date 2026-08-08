import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetFactoryBuildRecipes,
  getDeveloperOnlyAtlasAssetFactoryBuildRecipesStatus,
  resolveDeveloperOnlyAtlasAssetFactoryBuildRecipe
} from "../client/developer-only-atlas-asset-factory-build-recipes.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_65_ASSET_FACTORY_BUILD_RECIPES.md"
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
    selectorSeed: "ASSET_FACTORY_BUILD_SELECTOR_001",
    viewportId: "ASSET_FACTORY_BUILD_VIEWPORT_001",
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

function resolveBuildRecipe(overrides = {}) {
  const registry = createDeveloperOnlyAtlasAssetFactoryBuildRecipes();
  return resolveDeveloperOnlyAtlasAssetFactoryBuildRecipe(registry, {
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_001",
    exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_001",
    ...overrides
  });
}

test("1. build recipes stable", () => {
  const first = resolveBuildRecipe();
  const second = resolveBuildRecipe();

  assert.deepEqual(first, second);
  assert.equal(typeof first.assetBuildRecipeId, "string");
});

test("2. queues deterministic", () => {
  const result = resolveBuildRecipe({
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
    exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001"
  });

  assert.equal(
    result.generationQueueProfileId,
    "ATLAS_GENERATION_QUEUE_BUILDINGS_001"
  );
  assert.equal(result.factoryReadinessStatus, "ready");
});

test("3. dependencies valid", () => {
  const result = resolveBuildRecipe({
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001",
    exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.dependencyCount >= 1, true);
});

test("4. duplicate prevention works", () => {
  const result = resolveBuildRecipe({
    exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001"
  });

  assert.equal(result.matched, false);
  assert.equal(
    result.reasonCode,
    "ASSET_FACTORY_BUILD_RECIPE_EXPORT_CONTRACT_INCOMPATIBLE"
  );
});

test("5. same input same output", () => {
  const first = resolveBuildRecipe({
    assetPackageManifestId:
      "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_COMPACT_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_COMPACT_001",
    exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_COMPACT_001"
  });
  const second = resolveBuildRecipe({
    assetPackageManifestId:
      "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_COMPACT_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_COMPACT_001",
    exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_COMPACT_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes build recipe diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "heritage-plan-001",
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
  assert.equal(plan.assetFactoryBuildRecipeDecisions.length >= 1, true);
  assert.equal(typeof status.assetBuildRecipeId, "string");
  assert.equal(typeof status.generationQueueProfileId, "string");
  assert.equal(typeof status.buildStepCount, "number");
  assert.equal(typeof status.dependencyCount, "number");
  assert.equal(typeof status.factoryReadinessStatus, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "assetBuildRecipeId" in entry &&
        "generationQueueProfileId" in entry &&
        "buildStepCount" in entry &&
        "dependencyCount" in entry &&
        "factoryReadinessStatus" in entry
    ),
    true
  );
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasAssetFactoryBuildRecipes();
  const status = getDeveloperOnlyAtlasAssetFactoryBuildRecipesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(
    status.registeredAssetFactoryBuildRecipeRuleCount >= 5,
    true
  );
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /assetBuildRecipeId/);
  assert.match(source, /generationQueueProfileId/);
  assert.match(source, /buildStepCount/);
  assert.match(source, /dependencyCount/);
  assert.match(source, /factoryReadinessStatus/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
