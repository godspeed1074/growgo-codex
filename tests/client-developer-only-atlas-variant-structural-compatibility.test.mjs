import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles,
  getDeveloperOnlyAtlasVariantStructuralCompatibilityProfilesStatus,
  resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile
} from "../client/developer-only-atlas-variant-structural-compatibility-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_57_VARIANT_STRUCTURAL_COMPATIBILITY.md"
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
    selectorSeed: "VARIANT_STRUCTURAL_SELECTOR_001",
    viewportId: "VARIANT_STRUCTURAL_VIEWPORT_001",
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

function resolveVariant(overrides = {}) {
  const registry =
    createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles();
  return resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile(
    registry,
    {
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
      lotType: "rural_block",
      districtType: "coastal_natural",
      streetscapeProfileId: "STREETSCAPE_PROFILE_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      densityTier: "medium",
      ...overrides
    }
  );
}

test("1. variant selection stable", () => {
  const first = resolveVariant();
  const second = resolveVariant();

  assert.deepEqual(first, second);
  assert.equal(first.structuralCompatibilityStatus, "valid");
});

test("2. invalid variants rejected", () => {
  const result = resolveVariant({
    assetVariantId: "VARIANT_NOT_REGISTERED_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "VARIANT_STRUCTURAL_RULE_NOT_FOUND");
});

test("3. structural rules valid", () => {
  const result = resolveVariant({
    assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
    lotType: "civic_forecourt_lot",
    districtType: "civic",
    streetscapeProfileId: "STREETSCAPE_PROFILE_HERITAGE_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
    densityTier: "medium"
  });

  assert.equal(
    result.assetVariantEnvelopeId,
    "ASSET_VARIANT_ENVELOPE_HERITAGE_CIVIC_STANDARD_001"
  );
  assert.equal(
    result.selectedVariantProfileId,
    "SELECTED_VARIANT_PROFILE_HERITAGE_PAVILION_A_001"
  );
});

test("4. same input same output", () => {
  const first = resolveVariant({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    lotType: "corner_lot",
    districtType: "commercial",
    streetscapeProfileId: "STREETSCAPE_PROFILE_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    densityTier: "large"
  });
  const second = resolveVariant({
    assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
    lotType: "corner_lot",
    districtType: "commercial",
    streetscapeProfileId: "STREETSCAPE_PROFILE_URBAN_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
    densityTier: "large"
  });

  assert.deepEqual(first, second);
  assert.equal(typeof first.variantSelectionSeed, "string");
});

test("5. budgets preserved and planner exposes variant compatibility diagnostics", () => {
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
  assert.equal(plan.variantStructuralCompatibilityDecisions.length >= 1, true);
  assert.equal("assetVariantEnvelopeId" in status, true);
  assert.equal(typeof status.structuralCompatibilityStatus, "string");
  assert.equal("selectedVariantProfileId" in status, true);
  assert.equal(typeof status.variantConstraintReason, "string");
  assert.equal("variantSelectionSeed" in status, true);
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "assetVariantEnvelopeId" in entry &&
        "structuralCompatibilityStatus" in entry &&
        "selectedVariantProfileId" in entry &&
        "variantConstraintReason" in entry &&
        "variantSelectionSeed" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles();
  const status =
    getDeveloperOnlyAtlasVariantStructuralCompatibilityProfilesStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredVariantCompatibilityRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /assetVariantEnvelopeId/);
  assert.match(source, /structuralCompatibilityStatus/);
  assert.match(source, /selectedVariantProfileId/);
  assert.match(source, /variantConstraintReason/);
  assert.match(source, /variantSelectionSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
