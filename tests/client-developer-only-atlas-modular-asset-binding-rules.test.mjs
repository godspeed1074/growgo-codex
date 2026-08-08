import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry,
  getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationModularAssetBinding
} from "../client/developer-only-atlas-population-modular-asset-binding-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_28_MODULAR_ASSET_BINDING_RULES.md"
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
    selectorSeed: "MODULAR_BINDING_SELECTOR_001",
    viewportId: "MODULAR_BINDING_VIEWPORT_001",
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

function resolveBinding({
  assetFamilyId = "ASSET_FAMILY_VEGETATION_COASTAL_001",
  selectedAssetId = "TREE_BOTTLEBRUSH_001",
  featureClass = "coastal_green",
  materialFamilyId = "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
  paletteProfileId = "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
  selectorSeed = "MOD_BIND_001",
  deterministicFeatureIdentity = "feature-001",
  coordinate = { latitude: -38.13565, longitude: 144.34905 },
  candidateIndex = 0,
  densityTier = "medium",
  districtType = "coastal_natural",
  lotType = "standalone_lot"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationModularAssetBinding(registry, {
    assetFamilyId,
    selectedAssetId,
    featureClass,
    materialFamilyId,
    paletteProfileId,
    selectorSeed,
    deterministicFeatureIdentity,
    coordinate,
    candidateIndex,
    densityTier,
    districtType,
    lotType
  });
}

test("1. variant selection is stable", () => {
  const first = resolveBinding();
  const second = resolveBinding();

  assert.deepEqual(first, second);
  assert.equal(first.selectedAssetId, "TREE_BOTTLEBRUSH_001");
  assert.equal(typeof first.assetVariantId, "string");
});

test("2. same location same asset", () => {
  const result = resolveBinding({
    assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
    selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    featureClass: "civic_site",
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
    districtType: "civic"
  });

  assert.equal(result.selectedAssetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal(
    result.lodProfileId,
    "LOD_PROFILE_CIVIC_BUILDING_CLOSE_MEDIUM_DISTANT_001"
  );
});

test("3. neighbouring variation is valid", () => {
  const left = resolveBinding({
    selectedAssetId: "SHRUB_COASTAL_LOW_001",
    candidateIndex: 0
  });
  const right = resolveBinding({
    selectedAssetId: "SHRUB_COASTAL_LOW_001",
    candidateIndex: 1
  });

  assert.equal(left.selectedAssetId, right.selectedAssetId);
  assert.notEqual(left.assetVariantId, right.assetVariantId);
});

test("4. incompatible assets are rejected", () => {
  const result = resolveBinding({
    assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    featureClass: "civic_site",
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_MODULAR_ASSET_BINDING");
});

test("5. budgets are preserved and planner exposes modular binding diagnostics", () => {
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
  assert.equal(plan.modularAssetBindingDecisions.length >= 3, true);
  assert.equal(typeof status.selectedAssetId, "string");
  assert.equal(typeof status.assetVariantId, "string");
  assert.equal(typeof status.variantSelectionReason, "string");
  assert.equal(typeof status.materialAssignmentId, "string");
  assert.equal(typeof status.lodProfileId, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "selectedAssetId" in entry &&
        "assetVariantId" in entry &&
        "variantSelectionReason" in entry &&
        "materialAssignmentId" in entry &&
        "lodProfileId" in entry
    ),
    true
  );
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredModularBindingRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /selectedAssetId/);
  assert.match(source, /assetVariantId/);
  assert.match(source, /variantSelectionReason/);
  assert.match(source, /materialAssignmentId/);
  assert.match(source, /lodProfileId/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
