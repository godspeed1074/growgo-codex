import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry,
  getDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesion
} from "../client/developer-only-atlas-population-asset-family-material-cohesion-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_27_ASSET_FAMILY_MATERIAL_COHESION_HOOKS.md"
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
    selectorSeed: "ASSET_FAMILY_SELECTOR_001",
    viewportId: "ASSET_FAMILY_VIEWPORT_001",
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

function resolveCohesion({
  settlementIdentityId = "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
  biomeProfileId = "BIOME_PROFILE_SUBURBAN_001",
  localCharacterProfileId = "LOCAL_CHARACTER_SUBURBAN_GARDEN_001",
  featureClass = "building_footprint",
  paletteProfileId = "PALETTE_PROFILE_SUBURBAN_GARDEN_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesion(
    registry,
    {
      settlementIdentityId,
      biomeProfileId,
      localCharacterProfileId,
      featureClass,
      paletteProfileId
    }
  );
}

test("1. settlement style selects valid assets", () => {
  const result = resolveCohesion();

  assert.equal(result.matched, true);
  assert.equal(result.assetFamilyId, "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001");
  assert.equal(result.materialFamilyId, "MATERIAL_FAMILY_ROOF_SUBURBAN_001");
});

test("2. palette selection is deterministic", () => {
  const first = resolveCohesion({
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    localCharacterProfileId: "LOCAL_CHARACTER_COASTAL_SETTLEMENT_001",
    featureClass: "coastal_green",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
  });
  const second = resolveCohesion({
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    localCharacterProfileId: "LOCAL_CHARACTER_COASTAL_SETTLEMENT_001",
    featureClass: "coastal_green",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.materialFamilyId,
    "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
  );
});

test("3. incompatible styles are rejected", () => {
  const result = resolveCohesion({
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    featureClass: "building_footprint",
    paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_ASSET_FAMILY_MATERIAL_STYLE");
});

test("4. same input same output", () => {
  const first = resolveCohesion({
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    featureClass: "civic_site",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
  });
  const second = resolveCohesion({
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    featureClass: "civic_site",
    paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
  });

  assert.deepEqual(first, second);
  assert.equal(typeof first.assetSelectionSeed, "string");
});

test("5. budgets are preserved and planner exposes cohesion diagnostics", () => {
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
          featureId: "urban-plan-001",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "shop:bakery"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.assetFamilyMaterialCohesionDecisions.length >= 3, true);
  assert.equal(typeof status.assetFamilyId, "string");
  assert.equal(typeof status.materialFamilyId, "string");
  assert.equal(typeof status.styleCompatibilityReason, "string");
  assert.equal(typeof status.assetSelectionSeed, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        typeof entry.assetFamilyId === "string" &&
        typeof entry.materialFamilyId === "string" &&
        typeof entry.styleCompatibilityReason === "string" &&
        typeof entry.assetSelectionSeed === "string"
    ),
    true
  );
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredAssetFamilyRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /assetFamilyId/);
  assert.match(source, /materialFamilyId/);
  assert.match(source, /paletteProfileId/);
  assert.match(source, /styleCompatibilityReason/);
  assert.match(source, /assetSelectionSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
