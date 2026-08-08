import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasMaterialThemeBundles,
  getDeveloperOnlyAtlasMaterialThemeBundlesStatus,
  resolveDeveloperOnlyAtlasMaterialThemeBundle
} from "../client/developer-only-atlas-material-theme-bundles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_59_MATERIAL_THEME_BUNDLES.md"
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
    selectorSeed: "MATERIAL_THEME_BUNDLE_SELECTOR_001",
    viewportId: "MATERIAL_THEME_BUNDLE_VIEWPORT_001",
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

function resolveBundle(overrides = {}) {
  const registry = createDeveloperOnlyAtlasMaterialThemeBundles();
  return resolveDeveloperOnlyAtlasMaterialThemeBundle(registry, {
    worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
    finishProfileId: "FINISH_PROFILE_NATURAL_001",
    resolvedMaterialProfileId: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_001",
    ...overrides
  });
}

test("1. bundle selection stable", () => {
  const first = resolveBundle();
  const second = resolveBundle();

  assert.deepEqual(first, second);
  assert.equal(first.materialBundleCompatibilityStatus, "valid");
});

test("2. materials remain compatible", () => {
  const result = resolveBundle({
    worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
    finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
    resolvedMaterialProfileId:
      "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_001"
  });

  assert.equal(result.materialBundleCompatibilityStatus, "valid");
  assert.equal(result.materialThemeBundleId, "MATERIAL_THEME_BUNDLE_HERITAGE_001");
});

test("3. palette sets deterministic", () => {
  const first = resolveBundle({
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
    finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
    resolvedMaterialProfileId:
      "RESOLVED_MATERIAL_PROFILE_URBAN_COMMERCIAL_MIXED_001"
  });
  const second = resolveBundle({
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
    finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
    resolvedMaterialProfileId:
      "RESOLVED_MATERIAL_PROFILE_URBAN_COMMERCIAL_MIXED_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.resolvedPaletteSetId,
    "RESOLVED_PALETTE_SET_URBAN_MIXED_001"
  );
});

test("4. invalid bundles rejected", () => {
  const result = resolveBundle({
    finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "MATERIAL_THEME_BUNDLE_FINISH_INCOMPATIBLE");
});

test("5. budgets preserved and planner exposes material theme diagnostics", () => {
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
  assert.equal(plan.materialThemeBundleDecisions.length >= 1, true);
  assert.equal(typeof status.materialThemeBundleId, "string");
  assert.equal(typeof status.resolvedFinishSetId, "string");
  assert.equal(typeof status.resolvedPaletteSetId, "string");
  assert.equal(typeof status.materialBundleCompatibilityStatus, "string");
  assert.equal(typeof status.materialBundleReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "materialThemeBundleId" in entry &&
        "resolvedFinishSetId" in entry &&
        "resolvedPaletteSetId" in entry &&
        "materialBundleCompatibilityStatus" in entry &&
        "materialBundleReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasMaterialThemeBundles();
  const status = getDeveloperOnlyAtlasMaterialThemeBundlesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredMaterialThemeBundleRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /materialThemeBundleId/);
  assert.match(source, /resolvedFinishSetId/);
  assert.match(source, /resolvedPaletteSetId/);
  assert.match(source, /materialBundleCompatibilityStatus/);
  assert.match(source, /materialBundleReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
