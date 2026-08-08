import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles,
  getDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfilesStatus,
  resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile
} from "../client/developer-only-atlas-material-palette-finish-compatibility-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_58_MATERIAL_PALETTE_FINISH_COMPATIBILITY.md"
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
    selectorSeed: "MATERIAL_PALETTE_SELECTOR_001",
    viewportId: "MATERIAL_PALETTE_VIEWPORT_001",
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

function resolveMaterial(overrides = {}) {
  const registry =
    createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles();
  return resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile(
    registry,
    {
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
      materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      ...overrides
    }
  );
}

test("1. material selection stable", () => {
  const first = resolveMaterial();
  const second = resolveMaterial();

  assert.deepEqual(first, second);
  assert.equal(first.materialCompatibilityStatus, "valid");
});

test("2. palette compatibility valid", () => {
  const result = resolveMaterial({
    assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
    worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.equal(result.paletteCompatibilityStatus, "valid");
  assert.equal(result.finishProfileId, "FINISH_PROFILE_HERITAGE_AGED_001");
});

test("3. finish profiles deterministic", () => {
  const first = resolveMaterial({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });
  const second = resolveMaterial({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.finishProfileId, "FINISH_PROFILE_CLEAN_MODERN_001");
});

test("4. invalid materials rejected", () => {
  const result = resolveMaterial({
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "MATERIAL_FAMILY_INCOMPATIBLE");
});

test("5. budgets preserved and planner exposes material diagnostics", () => {
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
  assert.equal(
    plan.materialPaletteFinishCompatibilityDecisions.length >= 1,
    true
  );
  assert.equal(typeof status.materialCompatibilityStatus, "string");
  assert.equal(typeof status.paletteCompatibilityStatus, "string");
  assert.equal("finishProfileId" in status, true);
  assert.equal("resolvedMaterialProfileId" in status, true);
  assert.equal(typeof status.materialReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "materialCompatibilityStatus" in entry &&
        "paletteCompatibilityStatus" in entry &&
        "finishProfileId" in entry &&
        "resolvedMaterialProfileId" in entry &&
        "materialReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles();
  const status =
    getDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfilesStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredMaterialCompatibilityRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /materialCompatibilityStatus/);
  assert.match(source, /paletteCompatibilityStatus/);
  assert.match(source, /finishProfileId/);
  assert.match(source, /resolvedMaterialProfileId/);
  assert.match(source, /materialReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
