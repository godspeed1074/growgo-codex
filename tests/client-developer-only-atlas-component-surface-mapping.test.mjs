import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasComponentSurfaceMapping,
  getDeveloperOnlyAtlasComponentSurfaceMappingStatus,
  resolveDeveloperOnlyAtlasComponentSurfaceMapping
} from "../client/developer-only-atlas-component-surface-mapping.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_61_COMPONENT_SURFACE_MAPPING.md"
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
    selectorSeed: "COMPONENT_SURFACE_SELECTOR_001",
    viewportId: "COMPONENT_SURFACE_VIEWPORT_001",
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

function resolveSurface(overrides = {}) {
  const registry = createDeveloperOnlyAtlasComponentSurfaceMapping();
  return resolveDeveloperOnlyAtlasComponentSurfaceMapping(registry, {
    componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_A_001",
    slotCompatibilityStatus: "valid",
    ...overrides
  });
}

test("1. anchor mapping stable", () => {
  const first = resolveSurface();
  const second = resolveSurface();

  assert.deepEqual(first, second);
  assert.equal(first.resolvedAnchorCount > 0, true);
});

test("2. components attach correctly", () => {
  const result = resolveSurface({
    componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001"
  });

  assert.equal(
    result.surfaceMappingProfileId,
    "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_001"
  );
  assert.equal(result.mappedComponentCount >= 1, true);
});

test("3. invalid anchors rejected", () => {
  const result = resolveSurface({
    assetAssemblyProfileId: "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001"
  });

  assert.equal(result.matched, false);
  assert.equal(
    result.reasonCode,
    "COMPONENT_SURFACE_MAPPING_ASSEMBLY_PROFILE_INCOMPATIBLE"
  );
});

test("4. same input same output", () => {
  const first = resolveSurface({
    componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_URBAN_COMMERCIAL_A_001"
  });
  const second = resolveSurface({
    componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
    materialSlotSetId: "MATERIAL_SLOT_SET_URBAN_COMMERCIAL_A_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes component surface diagnostics", () => {
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
  assert.equal(plan.componentSurfaceMappingDecisions.length >= 1, true);
  assert.equal(typeof status.surfaceMappingProfileId, "string");
  assert.equal(typeof status.componentAnchorSetId, "string");
  assert.equal(typeof status.resolvedAnchorCount, "number");
  assert.equal(typeof status.mappedComponentCount, "number");
  assert.equal(typeof status.surfaceMappingReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "surfaceMappingProfileId" in entry &&
        "componentAnchorSetId" in entry &&
        "resolvedAnchorCount" in entry &&
        "mappedComponentCount" in entry &&
        "surfaceMappingReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasComponentSurfaceMapping();
  const status = getDeveloperOnlyAtlasComponentSurfaceMappingStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(
    status.registeredComponentSurfaceMappingRuleCount >= 5,
    true
  );
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /surfaceMappingProfileId/);
  assert.match(source, /componentAnchorSetId/);
  assert.match(source, /resolvedAnchorCount/);
  assert.match(source, /mappedComponentCount/);
  assert.match(source, /surfaceMappingReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
