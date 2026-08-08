import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetCompatibilityWorldPackages,
  getDeveloperOnlyAtlasAssetCompatibilityWorldPackagesStatus,
  resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage
} from "../client/developer-only-atlas-asset-compatibility-world-packages.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_51_ASSET_COMPATIBILITY_WORLD_PACKAGES.md"
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
    selectorSeed: "WORLD_PACKAGE_SELECTOR_001",
    viewportId: "WORLD_PACKAGE_VIEWPORT_001",
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

function resolveWorldPackage(overrides = {}) {
  const registry = createDeveloperOnlyAtlasAssetCompatibilityWorldPackages();
  return resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage(registry, {
    packageCategory: "coastal",
    atlasAssetPackageId: "ATLAS_ASSET_PACKAGE_VALID_001",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    selectedAssetId: "TREE_BOTTLEBRUSH_001",
    assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
    materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
    paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
    childAssetIds: ["SHRUB_COASTAL_LOW_001"],
    ...overrides
  });
}

test("1. package validation stable", () => {
  const first = resolveWorldPackage();
  const second = resolveWorldPackage();

  assert.deepEqual(first, second);
  assert.equal(first.matched, true);
  assert.equal(first.packageValidationStatus, "valid");
});

test("2. incompatible packages fail closed", () => {
  const result = resolveWorldPackage({
    biomeProfileId: "BIOME_PROFILE_URBAN_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "WORLD_PACKAGE_BIOME_INCOMPATIBLE");
});

test("3. asset relationships deterministic", () => {
  const first = resolveWorldPackage({
    childAssetIds: ["TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"]
  });
  const second = resolveWorldPackage({
    childAssetIds: ["SHRUB_COASTAL_LOW_001", "TREE_EUCALYPTUS_001"]
  });

  assert.equal(first.worldPackageId, second.worldPackageId);
  assert.equal(first.compatibleAssetCount, 3);
});

test("4. same input same output", () => {
  const result = resolveWorldPackage();
  assert.equal(typeof result.worldPackageId, "string");
  assert.equal(result.blockedAssetCount, 0);
});

test("5. budgets preserved and planner exposes world package diagnostics", () => {
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
  assert.equal(plan.worldPackageValidationDecisions.length >= 1, true);
  assert.equal(typeof status.worldPackageId, "string");
  assert.equal(typeof status.packageValidationStatus, "string");
  assert.equal(typeof status.compatibleAssetCount, "number");
  assert.equal(typeof status.blockedAssetCount, "number");
  assert.equal(typeof status.packageReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "worldPackageId" in entry &&
        "packageValidationStatus" in entry &&
        "compatibleAssetCount" in entry &&
        "blockedAssetCount" in entry &&
        "packageReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasAssetCompatibilityWorldPackages();
  const status =
    getDeveloperOnlyAtlasAssetCompatibilityWorldPackagesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldPackageId/);
  assert.match(source, /packageValidationStatus/);
  assert.match(source, /compatibleAssetCount/);
  assert.match(source, /blockedAssetCount/);
  assert.match(source, /packageReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
