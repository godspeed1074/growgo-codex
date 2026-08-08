import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasComponentAssemblyRuleProfiles,
  getDeveloperOnlyAtlasComponentAssemblyRuleProfilesStatus,
  resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile
} from "../client/developer-only-atlas-component-assembly-rule-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_56_COMPONENT_ASSEMBLY_RULES.md"
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
    selectorSeed: "COMPONENT_ASSEMBLY_SELECTOR_001",
    viewportId: "COMPONENT_ASSEMBLY_VIEWPORT_001",
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

function resolveAssembly(overrides = {}) {
  const registry = createDeveloperOnlyAtlasComponentAssemblyRuleProfiles();
  return resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile(registry, {
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
    componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
    featureClass: "coastal_green",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    ...overrides
  });
}

test("1. component compatibility stable", () => {
  const first = resolveAssembly();
  const second = resolveAssembly();

  assert.deepEqual(first, second);
  assert.equal(first.componentCompatibilityStatus, "valid");
});

test("2. invalid combinations rejected", () => {
  const result = resolveAssembly({
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
    componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
    featureClass: "civic_site",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "COMPONENT_ASSEMBLY_RULE_NOT_FOUND");
});

test("3. assembly rules deterministic", () => {
  const result = resolveAssembly({
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
    componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
    featureClass: "civic_site",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.equal(result.assemblyRuleProfileId, "ASSEMBLY_RULE_PROFILE_HERITAGE_CIVIC_001");
  assert.equal(result.requiredComponentCount, 4);
  assert.equal(result.validatedComponentCount, 5);
});

test("4. same input same output", () => {
  const first = resolveAssembly({
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
    componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
    featureClass: "building_footprint",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });
  const second = resolveAssembly({
    modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
    componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
    featureClass: "building_footprint",
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes component assembly diagnostics", () => {
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
  assert.equal(plan.componentAssemblyRuleDecisions.length >= 1, true);
  assert.equal(typeof status.componentCompatibilityStatus, "string");
  assert.equal("assemblyRuleProfileId" in status, true);
  assert.equal(typeof status.requiredComponentCount, "number");
  assert.equal(typeof status.validatedComponentCount, "number");
  assert.equal(typeof status.assemblyReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "componentCompatibilityStatus" in entry &&
        "assemblyRuleProfileId" in entry &&
        "requiredComponentCount" in entry &&
        "validatedComponentCount" in entry &&
        "assemblyReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasComponentAssemblyRuleProfiles();
  const status = getDeveloperOnlyAtlasComponentAssemblyRuleProfilesStatus(
    registry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredComponentAssemblyRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /componentCompatibilityStatus/);
  assert.match(source, /assemblyRuleProfileId/);
  assert.match(source, /requiredComponentCount/);
  assert.match(source, /validatedComponentCount/);
  assert.match(source, /assemblyReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
