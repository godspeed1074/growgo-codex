import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasMaterialSlotResolution,
  getDeveloperOnlyAtlasMaterialSlotResolutionStatus,
  resolveDeveloperOnlyAtlasMaterialSlotSet
} from "../client/developer-only-atlas-material-slot-resolution.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_60_MATERIAL_SLOT_RESOLUTION.md"
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
    selectorSeed: "MATERIAL_SLOT_SELECTOR_001",
    viewportId: "MATERIAL_SLOT_VIEWPORT_001",
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

function resolveSlots(overrides = {}) {
  const registry = createDeveloperOnlyAtlasMaterialSlotResolution();
  return resolveDeveloperOnlyAtlasMaterialSlotSet(registry, {
    assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
    materialThemeBundleId: "MATERIAL_THEME_BUNDLE_COASTAL_001",
    finishProfileId: "FINISH_PROFILE_NATURAL_001",
    resolvedFinishSetId: "RESOLVED_FINISH_SET_COASTAL_NATURAL_001",
    ...overrides
  });
}

test("1. slot resolution stable", () => {
  const first = resolveSlots();
  const second = resolveSlots();

  assert.deepEqual(first, second);
  assert.equal(first.slotCompatibilityStatus, "valid");
});

test("2. assignments deterministic", () => {
  const result = resolveSlots({
    assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
    materialThemeBundleId: "MATERIAL_THEME_BUNDLE_HERITAGE_001",
    finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
    resolvedFinishSetId: "RESOLVED_FINISH_SET_HERITAGE_AGED_001"
  });

  assert.equal(result.materialSlotSetId, "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001");
  assert.equal(result.assignedMaterialCount > 0, true);
});

test("3. invalid slots rejected", () => {
  const result = resolveSlots({
    resolvedFinishSetId: "RESOLVED_FINISH_SET_URBAN_MODERN_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "MATERIAL_SLOT_FINISH_SET_INCOMPATIBLE");
});

test("4. same input same output", () => {
  const first = resolveSlots({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    materialThemeBundleId: "MATERIAL_THEME_BUNDLE_URBAN_001",
    finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
    resolvedFinishSetId: "RESOLVED_FINISH_SET_URBAN_MODERN_001"
  });
  const second = resolveSlots({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    materialThemeBundleId: "MATERIAL_THEME_BUNDLE_URBAN_001",
    finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
    resolvedFinishSetId: "RESOLVED_FINISH_SET_URBAN_MODERN_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes material slot diagnostics", () => {
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
  assert.equal(plan.materialSlotResolutionDecisions.length >= 1, true);
  assert.equal(typeof status.materialSlotSetId, "string");
  assert.equal(typeof status.resolvedSlotCount, "number");
  assert.equal(typeof status.assignedMaterialCount, "number");
  assert.equal(typeof status.slotCompatibilityStatus, "string");
  assert.equal(typeof status.slotResolutionReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "materialSlotSetId" in entry &&
        "resolvedSlotCount" in entry &&
        "assignedMaterialCount" in entry &&
        "slotCompatibilityStatus" in entry &&
        "slotResolutionReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasMaterialSlotResolution();
  const status = getDeveloperOnlyAtlasMaterialSlotResolutionStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredMaterialSlotRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /materialSlotSetId/);
  assert.match(source, /resolvedSlotCount/);
  assert.match(source, /assignedMaterialCount/);
  assert.match(source, /slotCompatibilityStatus/);
  assert.match(source, /slotResolutionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
