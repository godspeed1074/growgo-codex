import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasWorldThemeStyleBundles,
  getDeveloperOnlyAtlasWorldThemeStyleBundlesStatus,
  resolveDeveloperOnlyAtlasWorldThemeStyleBundle
} from "../client/developer-only-atlas-world-theme-style-bundles.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_53_WORLD_THEME_STYLE_BUNDLES.md"
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
    selectorSeed: "WORLD_THEME_SELECTOR_001",
    viewportId: "WORLD_THEME_VIEWPORT_001",
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

function resolveTheme(overrides = {}) {
  const registry = createDeveloperOnlyAtlasWorldThemeStyleBundles();
  return resolveDeveloperOnlyAtlasWorldThemeStyleBundle(registry, {
    settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_COASTAL_VILLAGE_001",
    biomePackageProfileId: "BIOME_PACKAGE_PROFILE_COASTAL_001",
    worldPackageCategory: "coastal",
    resolvedWorldPackageId: "ATLAS_PROFILED_WORLD_PACKAGE_VALID_001",
    ...overrides
  });
}

test("1. theme selection stable", () => {
  const first = resolveTheme();
  const second = resolveTheme();

  assert.deepEqual(first, second);
  assert.equal(first.themeCompatibilityStatus, "valid");
});

test("2. regional bundles deterministic", () => {
  const result = resolveTheme();
  assert.equal(typeof result.regionalStyleBundleId, "string");
  assert.equal(typeof result.visualCohesionScore, "number");
});

test("3. incompatible themes rejected", () => {
  const result = resolveTheme({
    worldPackageCategory: "commercial"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "WORLD_PACKAGE_THEME_INCOMPATIBLE");
});

test("4. same input same output", () => {
  const result = resolveTheme();
  assert.equal(typeof result.worldThemeProfileId, "string");
});

test("5. budgets preserved and planner exposes theme bundle diagnostics", () => {
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
  assert.equal(plan.worldThemeBundleDecisions.length >= 1, true);
  assert.equal(typeof status.worldThemeProfileId, "string");
  assert.equal(typeof status.regionalStyleBundleId, "string");
  assert.equal(typeof status.visualCohesionScore, "number");
  assert.equal(typeof status.themeCompatibilityStatus, "string");
  assert.equal(typeof status.themeSelectionReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "worldThemeProfileId" in entry &&
        "regionalStyleBundleId" in entry &&
        "visualCohesionScore" in entry &&
        "themeCompatibilityStatus" in entry &&
        "themeSelectionReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasWorldThemeStyleBundles();
  const status = getDeveloperOnlyAtlasWorldThemeStyleBundlesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldThemeProfileId/);
  assert.match(source, /regionalStyleBundleId/);
  assert.match(source, /visualCohesionScore/);
  assert.match(source, /themeCompatibilityStatus/);
  assert.match(source, /themeSelectionReason/);
});
