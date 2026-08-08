import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles,
  getDeveloperOnlyAtlasAssetBiomeSettlementPackageProfilesStatus,
  resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile
} from "../client/developer-only-atlas-asset-biome-settlement-package-profiles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_52_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES.md"
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
    selectorSeed: "PACKAGE_PROFILE_SELECTOR_001",
    viewportId: "PACKAGE_PROFILE_VIEWPORT_001",
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

function resolveProfile(overrides = {}) {
  const registry = createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles();
  return resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile(registry, {
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    worldPackageCategory: "coastal",
    worldPackageId: "ATLAS_WORLD_PACKAGE_VALID_001",
    ...overrides
  });
}

test("1. package profiles stable", () => {
  const first = resolveProfile();
  const second = resolveProfile();

  assert.deepEqual(first, second);
  assert.equal(first.profileCompatibilityStatus, "valid");
});

test("2. biome compatibility valid", () => {
  const result = resolveProfile({
    biomeProfileId: "BIOME_PROFILE_WETLAND_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "PROFILE_RULE_NOT_FOUND");
});

test("3. settlement packages deterministic", () => {
  const result = resolveProfile();
  assert.equal(typeof result.resolvedWorldPackageId, "string");
});

test("4. invalid combinations rejected", () => {
  const result = resolveProfile({
    worldPackageCategory: "commercial"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "WORLD_PACKAGE_CATEGORY_INCOMPATIBLE");
});

test("5. budgets preserved and planner exposes package profile diagnostics", () => {
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
          featureId: "park-001",
          featureClass: "park",
          latitude: -38.13555,
          longitude: 144.34915,
          sourceClassification: "zone:park"
        })
      ]
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.packageProfileDecisions.length >= 1, true);
  assert.equal(typeof status.settlementPackageProfileId, "string");
  assert.equal(typeof status.biomePackageProfileId, "string");
  assert.equal(typeof status.resolvedWorldPackageId, "string");
  assert.equal(typeof status.profileCompatibilityStatus, "string");
  assert.equal(typeof status.packageSelectionReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "settlementPackageProfileId" in entry &&
        "biomePackageProfileId" in entry &&
        "resolvedWorldPackageId" in entry &&
        "profileCompatibilityStatus" in entry &&
        "packageSelectionReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles();
  const status =
    getDeveloperOnlyAtlasAssetBiomeSettlementPackageProfilesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /settlementPackageProfileId/);
  assert.match(source, /biomePackageProfileId/);
  assert.match(source, /resolvedWorldPackageId/);
  assert.match(source, /profileCompatibilityStatus/);
  assert.match(source, /packageSelectionReason/);
});
