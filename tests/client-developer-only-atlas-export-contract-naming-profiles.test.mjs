import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasExportContractNamingProfiles,
  getDeveloperOnlyAtlasExportContractNamingProfilesStatus,
  resolveDeveloperOnlyAtlasExportContractNamingProfile
} from "../client/developer-only-atlas-export-contract-naming-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_63_EXPORT_CONTRACT_NAMING_PROFILES.md"
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
    selectorSeed: "EXPORT_CONTRACT_SELECTOR_001",
    viewportId: "EXPORT_CONTRACT_VIEWPORT_001",
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

function resolveContract(overrides = {}) {
  const registry = createDeveloperOnlyAtlasExportContractNamingProfiles();
  return resolveDeveloperOnlyAtlasExportContractNamingProfile(registry, {
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_001",
    glbPreparationProfileId: "GLB_PREPARATION_PROFILE_COASTAL_VEGETATION_001",
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    ...overrides
  });
}

test("1. export contracts stable", () => {
  const first = resolveContract();
  const second = resolveContract();

  assert.deepEqual(first, second);
  assert.equal(typeof first.exportContractId, "string");
});

test("2. naming profiles deterministic", () => {
  const result = resolveContract({
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001",
    glbPreparationProfileId: "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_001",
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
    selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  assert.equal(
    result.assetNamingProfileId,
    "ATLAS_ASSET_NAMING_PROFILE_BUILDINGS_001"
  );
  assert.equal(
    result.glbExportProfileId,
    "ATLAS_GLB_EXPORT_PROFILE_BUILDINGS_001"
  );
});

test("3. metadata requirements valid", () => {
  const result = resolveContract({
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001",
    glbPreparationProfileId: "GLB_PREPARATION_PROFILE_INDUSTRIAL_EDGE_001",
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_STREETSCAPE_EDGE_001",
    selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001"
  });

  assert.equal(result.matched, true);
  assert.equal(typeof result.assetVersionPolicy, "string");
});

test("4. invalid exports rejected", () => {
  const result = resolveContract({
    selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "EXPORT_CONTRACT_ASSET_ID_INCOMPATIBLE");
});

test("5. same input same output", () => {
  const first = resolveContract({
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_URBAN_COMMERCIAL_001",
    glbPreparationProfileId: "GLB_PREPARATION_PROFILE_URBAN_COMMERCIAL_001",
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
    selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001"
  });
  const second = resolveContract({
    attachmentMetadataProfileId:
      "ATTACHMENT_METADATA_PROFILE_URBAN_COMMERCIAL_001",
    glbPreparationProfileId: "GLB_PREPARATION_PROFILE_URBAN_COMMERCIAL_001",
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
    selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001"
  });

  assert.deepEqual(first, second);
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasExportContractNamingProfiles();
  const status = getDeveloperOnlyAtlasExportContractNamingProfilesStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredExportContractRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /exportContractId/);
  assert.match(source, /assetNamingProfileId/);
  assert.match(source, /glbExportProfileId/);
  assert.match(source, /assetVersionPolicy/);
  assert.match(source, /exportContractReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});

test("7. budgets preserved and planner exposes export contract diagnostics", () => {
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
  assert.equal(plan.exportContractDecisions.length >= 1, true);
  assert.equal(typeof status.exportContractId, "string");
  assert.equal(typeof status.assetNamingProfileId, "string");
  assert.equal(typeof status.glbExportProfileId, "string");
  assert.equal(typeof status.assetVersionPolicy, "string");
  assert.equal(typeof status.exportContractReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "exportContractId" in entry &&
        "assetNamingProfileId" in entry &&
        "glbExportProfileId" in entry &&
        "assetVersionPolicy" in entry &&
        "exportContractReason" in entry
    ),
    true
  );
});
