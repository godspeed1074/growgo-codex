import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetFactoryPackageManifests,
  getDeveloperOnlyAtlasAssetFactoryPackageManifestsStatus,
  resolveDeveloperOnlyAtlasAssetFactoryPackageManifest
} from "../client/developer-only-atlas-asset-factory-package-manifests.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_64_ASSET_FACTORY_PACKAGE_MANIFESTS.md"
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
    selectorSeed: "ASSET_FACTORY_MANIFEST_SELECTOR_001",
    viewportId: "ASSET_FACTORY_MANIFEST_VIEWPORT_001",
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

function resolveManifest(overrides = {}) {
  const registry = createDeveloperOnlyAtlasAssetFactoryPackageManifests();
  return resolveDeveloperOnlyAtlasAssetFactoryPackageManifest(registry, {
    exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_A_001",
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_001",
    ...overrides
  });
}

test("1. manifests stable", () => {
  const first = resolveManifest();
  const second = resolveManifest();

  assert.deepEqual(first, second);
  assert.equal(typeof first.assetPackageManifestId, "string");
});

test("2. validation deterministic", () => {
  const result = resolveManifest({
    exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001",
    selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001",
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001"
  });

  assert.equal(
    result.exportValidationProfileId,
    "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001"
  );
  assert.equal(result.manifestValidationStatus, "valid");
});

test("3. incomplete packages rejected", () => {
  const result = resolveManifest({
    materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001"
  });

  assert.equal(result.matched, false);
  assert.equal(
    result.reasonCode,
    "ASSET_FACTORY_MANIFEST_MATERIAL_SLOT_INCOMPATIBLE"
  );
});

test("4. same input same output", () => {
  const first = resolveManifest({
    exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001",
    selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
    componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_A_001",
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001"
  });
  const second = resolveManifest({
    exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001",
    selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
    componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_A_001",
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes asset factory manifest diagnostics", () => {
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
  assert.equal(plan.assetFactoryManifestDecisions.length >= 1, true);
  assert.equal(typeof status.assetPackageManifestId, "string");
  assert.equal(typeof status.exportValidationProfileId, "string");
  assert.equal(typeof status.manifestComponentCount, "number");
  assert.equal(typeof status.manifestValidationStatus, "string");
  assert.equal(typeof status.manifestReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "assetPackageManifestId" in entry &&
        "exportValidationProfileId" in entry &&
        "manifestComponentCount" in entry &&
        "manifestValidationStatus" in entry &&
        "manifestReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasAssetFactoryPackageManifests();
  const status = getDeveloperOnlyAtlasAssetFactoryPackageManifestsStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredAssetFactoryManifestRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /assetPackageManifestId/);
  assert.match(source, /exportValidationProfileId/);
  assert.match(source, /manifestComponentCount/);
  assert.match(source, /manifestValidationStatus/);
  assert.match(source, /manifestReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
