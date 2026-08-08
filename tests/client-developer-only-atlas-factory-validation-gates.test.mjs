import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasFactoryValidationGates,
  getDeveloperOnlyAtlasFactoryValidationGatesStatus,
  resolveDeveloperOnlyAtlasFactoryValidationGate
} from "../client/developer-only-atlas-factory-validation-gates.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_66_FACTORY_VALIDATION_GATES.md"
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
    selectorSeed: "FACTORY_VALIDATION_SELECTOR_001",
    viewportId: "FACTORY_VALIDATION_VIEWPORT_001",
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

function resolveValidation(overrides = {}) {
  const registry = createDeveloperOnlyAtlasFactoryValidationGates();
  return resolveDeveloperOnlyAtlasFactoryValidationGate(registry, {
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_VEGETATION_001",
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_001",
    ...overrides
  });
}

test("1. readiness checks stable", () => {
  const first = resolveValidation();
  const second = resolveValidation();

  assert.deepEqual(first, second);
  assert.equal(typeof first.productionReadinessProfileId, "string");
});

test("2. invalid builds blocked", () => {
  const result = resolveValidation({
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001"
  });

  assert.equal(result.matched, false);
  assert.equal(
    result.reasonCode,
    "FACTORY_VALIDATION_QUEUE_PROFILE_INCOMPATIBLE"
  );
});

test("3. dependencies validated", () => {
  const result = resolveValidation({
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.validationGateCount >= result.passedGateCount, true);
});

test("4. same input same output", () => {
  const first = resolveValidation({
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_STREETSCAPE_001",
    assetPackageManifestId:
      "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001"
  });
  const second = resolveValidation({
    assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_001",
    generationQueueProfileId: "ATLAS_GENERATION_QUEUE_STREETSCAPE_001",
    assetPackageManifestId:
      "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
    exportValidationProfileId:
      "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes production validation diagnostics", () => {
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
  assert.equal(plan.factoryValidationGateDecisions.length >= 1, true);
  assert.equal(typeof status.productionReadinessProfileId, "string");
  assert.equal(typeof status.factoryValidationStatus, "string");
  assert.equal(typeof status.validationGateCount, "number");
  assert.equal(typeof status.passedGateCount, "number");
  assert.equal(typeof status.productionReadinessReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "productionReadinessProfileId" in entry &&
        "factoryValidationStatus" in entry &&
        "validationGateCount" in entry &&
        "passedGateCount" in entry &&
        "productionReadinessReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasFactoryValidationGates();
  const status = getDeveloperOnlyAtlasFactoryValidationGatesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredFactoryValidationGateRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /productionReadinessProfileId/);
  assert.match(source, /factoryValidationStatus/);
  assert.match(source, /validationGateCount/);
  assert.match(source, /passedGateCount/);
  assert.match(source, /productionReadinessReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
