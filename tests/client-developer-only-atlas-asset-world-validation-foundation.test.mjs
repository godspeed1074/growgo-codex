import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetWorldValidationFoundation,
  getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus,
  resolveDeveloperOnlyAtlasAssetWorldValidationFoundation
} from "../client/developer-only-atlas-asset-world-validation-foundation.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_50_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION.md"
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
    selectorSeed: "ASSET_VALIDATION_SELECTOR_001",
    viewportId: "ASSET_VALIDATION_VIEWPORT_001",
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
  const registry = createDeveloperOnlyAtlasAssetWorldValidationFoundation();
  return resolveDeveloperOnlyAtlasAssetWorldValidationFoundation(registry, {
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
    materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
    lodProfileId: "LOD_PROFILE_TREE_STANDARD_CLOSE_MEDIUM_DISTANT_001",
    placementIntent: "vegetation_coastal_cluster",
    coordinate: { latitude: -38.13565, longitude: 144.34905 },
    ...overrides
  });
}

test("1. valid asset binding passes", () => {
  const result = resolveValidation();
  assert.equal(result.matched, true);
  assert.equal(result.assetValidationStatus, "valid");
  assert.equal(result.rendererHandoffReadiness, "ready_for_future_renderer_attachment");
});

test("2. invalid asset fails closed", () => {
  const result = resolveValidation({
    selectedAssetId: "UNKNOWN_ASSET_001"
  });
  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "ASSET_NOT_REGISTERED");
});

test("3. variant validation works", () => {
  const result = resolveValidation({
    assetVariantId: "VARIANT_UNKNOWN_001"
  });
  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "VARIANT_NOT_REGISTERED");
});

test("4. palette/material compatibility works", () => {
  const materialResult = resolveValidation({
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001"
  });
  const paletteResult = resolveValidation({
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
  });

  assert.equal(materialResult.reasonCode, "MATERIAL_FAMILY_INCOMPATIBLE");
  assert.equal(paletteResult.reasonCode, "PALETTE_PROFILE_INCOMPATIBLE");
});

test("5. placement deterministic", () => {
  const first = resolveValidation();
  const second = resolveValidation();
  assert.deepEqual(first, second);
  assert.equal(typeof first.atlasAssetPackageId, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "coast-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "civic-001",
          featureClass: "civic_site",
          latitude: -38.13555,
          longitude: 144.34915,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);
  const registry = createDeveloperOnlyAtlasAssetWorldValidationFoundation();
  const registryStatus =
    getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.assetWorldValidationDecisions.length >= 1, true);
  assert.equal(typeof status.atlasAssetPackageId, "string");
  assert.equal(typeof status.assetValidationStatus, "string");
  assert.equal(typeof status.bindingValidationReason, "string");
  assert.equal(typeof status.placementValidationStatus, "string");
  assert.equal(typeof status.rendererHandoffReadiness, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "atlasAssetPackageId" in entry &&
        "assetValidationStatus" in entry &&
        "bindingValidationReason" in entry &&
        "placementValidationStatus" in entry &&
        "rendererHandoffReadiness" in entry
    ),
    true
  );
  assert.equal(
    registryStatus.canonicalSafetyFlags.runtimeExecutionEnabled,
    false
  );
  assert.equal(
    registryStatus.canonicalSafetyFlags.mapAttachmentAllowed,
    false
  );
  assert.equal(
    registryStatus.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(
    registryStatus.canonicalSafetyFlags.lifecycleExecutionEnabled,
    false
  );
  assert.doesNotThrow(() => JSON.stringify(registryStatus));
  assert.match(source, /atlasAssetPackageId/);
  assert.match(source, /assetValidationStatus/);
  assert.match(source, /bindingValidationReason/);
  assert.match(source, /placementValidationStatus/);
  assert.match(source, /rendererHandoffReadiness/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
