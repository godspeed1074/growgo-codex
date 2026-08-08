import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasModularBibleStyleBridge,
  getDeveloperOnlyAtlasModularBibleStyleBridgeStatus,
  resolveDeveloperOnlyAtlasModularBibleStyleBridge
} from "../client/developer-only-atlas-modular-bible-style-bridge.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_55_MODULAR_BIBLE_STYLE_BRIDGE.md"
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
    selectorSeed: "MODULAR_BIBLE_STYLE_BRIDGE_SELECTOR_001",
    viewportId: "MODULAR_BIBLE_STYLE_BRIDGE_VIEWPORT_001",
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

function resolveBridge(overrides = {}) {
  const registry = createDeveloperOnlyAtlasModularBibleStyleBridge();
  return resolveDeveloperOnlyAtlasModularBibleStyleBridge(registry, {
    worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    architectureStyleProfileId:
      "ARCHITECTURE_STYLE_PROFILE_COASTAL_RESIDENTIAL_001",
    vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_COASTAL_001",
    streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_COASTAL_001",
    materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
    ...overrides
  });
}

test("1. style maps to valid family", () => {
  const result = resolveBridge();

  assert.equal(result.matched, true);
  assert.equal(
    result.modularBibleFamilyId,
    "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001"
  );
});

test("2. components compatible", () => {
  const result = resolveBridge({
    worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
    assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
    architectureStyleProfileId: "ARCHITECTURE_STYLE_PROFILE_HERITAGE_CIVIC_001",
    vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
    streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_HERITAGE_001",
    materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
  });

  assert.equal(result.componentRecipeId, "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001");
  assert.equal(
    result.assetAssemblyProfileId,
    "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001"
  );
});

test("3. assembly deterministic", () => {
  const first = resolveBridge({
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
    architectureStyleProfileId: "ARCHITECTURE_STYLE_PROFILE_MODERN_COMMERCIAL_001",
    vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
    streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_URBAN_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
  });
  const second = resolveBridge({
    worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
    assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
    architectureStyleProfileId: "ARCHITECTURE_STYLE_PROFILE_MODERN_COMMERCIAL_001",
    vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
    streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_URBAN_001",
    materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
  });

  assert.deepEqual(first, second);
  assert.equal(first.styleBridgeStatus, "valid");
});

test("4. invalid combinations fail closed", () => {
  const result = resolveBridge({
    worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    architectureStyleProfileId: "ARCHITECTURE_STYLE_PROFILE_HERITAGE_CIVIC_001",
    vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
    streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_HERITAGE_001",
    materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE");
});

test("5. budgets preserved and planner exposes bridge diagnostics", () => {
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
  assert.equal(plan.modularBibleStyleBridgeDecisions.length >= 1, true);
  assert.equal(typeof status.modularBibleFamilyId, "string");
  assert.equal(typeof status.componentRecipeId, "string");
  assert.equal(typeof status.assetAssemblyProfileId, "string");
  assert.equal(typeof status.styleBridgeStatus, "string");
  assert.equal(typeof status.bridgeReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "modularBibleFamilyId" in entry &&
        "componentRecipeId" in entry &&
        "assetAssemblyProfileId" in entry &&
        "styleBridgeStatus" in entry &&
        "bridgeReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasModularBibleStyleBridge();
  const status = getDeveloperOnlyAtlasModularBibleStyleBridgeStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredStyleBridgeRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /modularBibleFamilyId/);
  assert.match(source, /componentRecipeId/);
  assert.match(source, /assetAssemblyProfileId/);
  assert.match(source, /styleBridgeStatus/);
  assert.match(source, /bridgeReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
