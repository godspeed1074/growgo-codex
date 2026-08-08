import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSupportingComposition
} from "../client/developer-only-atlas-population-supporting-composition-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_30_SUPPORTING_COMPOSITION_RULES.md"
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
    selectorSeed: "SUPPORTING_COMPOSITION_SELECTOR_001",
    viewportId: "SUPPORTING_COMPOSITION_VIEWPORT_001",
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

function resolveSupportingComposition({
  districtType = "residential",
  clusterType = "residential",
  featureClass = "building_footprint"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSupportingComposition(registry, {
    districtType,
    clusterType,
    featureClass
  });
}

test("1. prop selection is stable", () => {
  const first = resolveSupportingComposition();
  const second = resolveSupportingComposition();

  assert.deepEqual(first, second);
  assert.equal(
    first.supportingPropProfileId,
    "SUPPORTING_PROP_PROFILE_RESIDENTIAL_001"
  );
});

test("2. boundary rules are valid", () => {
  const result = resolveSupportingComposition({
    districtType: "civic",
    clusterType: "civic",
    featureClass: "civic_site"
  });

  assert.equal(result.matched, true);
  assert.equal(result.boundaryCompositionId, "BOUNDARY_COMPOSITION_CIVIC_001");
});

test("3. entry composition is stable", () => {
  const result = resolveSupportingComposition({
    districtType: "coastal_natural",
    clusterType: "coastal",
    featureClass: "coastal_green"
  });

  assert.equal(result.entryCompositionId, "ENTRY_COMPOSITION_COASTAL_001");
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("4. density tiers are deterministic", () => {
  const commercial = resolveSupportingComposition({
    districtType: "commercial",
    clusterType: "commercial",
    featureClass: "building_footprint"
  });
  const pedestrian = resolveSupportingComposition({
    districtType: "mixed_use",
    clusterType: "civic",
    featureClass: "civic_site"
  });

  assert.equal(commercial.propDensityTier, "commercial_high");
  assert.equal(pedestrian.propDensityTier, "pedestrian_high");
});

test("5. incompatible combinations are rejected", () => {
  const result = resolveSupportingComposition({
    districtType: "commercial",
    clusterType: "residential",
    featureClass: "coastal_green"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_SUPPORTING_COMPOSITION_CONTEXT");
});

test("6. budgets are preserved and planner exposes supporting composition diagnostics", () => {
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
          featureId: "civic-plan-001",
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
  assert.equal(plan.supportingCompositionDecisions.length >= 3, true);
  assert.equal(typeof status.supportingPropProfileId, "string");
  assert.equal(typeof status.boundaryCompositionId, "string");
  assert.equal(typeof status.entryCompositionId, "string");
  assert.equal(typeof status.propDensityTier, "string");
  assert.equal(typeof status.compositionReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "supportingPropProfileId" in entry &&
        "boundaryCompositionId" in entry &&
        "entryCompositionId" in entry &&
        "propDensityTier" in entry &&
        "compositionReason" in entry
    ),
    true
  );
});

test("7. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSupportingCompositionRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /supportingPropProfileId/);
  assert.match(source, /boundaryCompositionId/);
  assert.match(source, /entryCompositionId/);
  assert.match(source, /propDensityTier/);
  assert.match(source, /compositionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
