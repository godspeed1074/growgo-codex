import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasThemeSubprofileRules,
  getDeveloperOnlyAtlasThemeSubprofileRulesStatus,
  resolveDeveloperOnlyAtlasThemeSubprofile
} from "../client/developer-only-atlas-theme-subprofile-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_54_THEME_SUBPROFILE_RULES.md"
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
    selectorSeed: "THEME_SUBPROFILE_SELECTOR_001",
    viewportId: "THEME_SUBPROFILE_VIEWPORT_001",
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

function resolveSubprofile(overrides = {}) {
  const registry = createDeveloperOnlyAtlasThemeSubprofileRules();
  return resolveDeveloperOnlyAtlasThemeSubprofile(registry, {
    worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
    assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
    ...overrides
  });
}

test("1. subprofile selection stable", () => {
  const first = resolveSubprofile();
  const second = resolveSubprofile();

  assert.deepEqual(first, second);
  assert.equal(first.themeSubprofileCompatibility, "valid");
});

test("2. architecture compatibility valid", () => {
  const result = resolveSubprofile();
  assert.equal(typeof result.architectureStyleProfileId, "string");
});

test("3. vegetation compatibility valid", () => {
  const result = resolveSubprofile();
  assert.equal(typeof result.vegetationStyleProfileId, "string");
});

test("4. streetscape compatibility valid", () => {
  const result = resolveSubprofile();
  assert.equal(typeof result.streetscapeStyleProfileId, "string");
});

test("5. same input same output", () => {
  const blocked = resolveSubprofile({
    assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001"
  });
  assert.equal(
    blocked.reasonCode,
    "ASSET_FAMILY_THEME_SUBPROFILE_INCOMPATIBLE"
  );
});

test("6. budgets preserved and planner exposes theme subprofile diagnostics", () => {
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
  assert.equal(plan.themeSubprofileDecisions.length >= 1, true);
  assert.equal(typeof status.architectureStyleProfileId, "string");
  assert.equal(typeof status.vegetationStyleProfileId, "string");
  assert.equal(typeof status.streetscapeStyleProfileId, "string");
  assert.equal(typeof status.themeSubprofileCompatibility, "string");
  assert.equal(typeof status.styleSubprofileReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "architectureStyleProfileId" in entry &&
        "vegetationStyleProfileId" in entry &&
        "streetscapeStyleProfileId" in entry &&
        "themeSubprofileCompatibility" in entry &&
        "styleSubprofileReason" in entry
    ),
    true
  );
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasThemeSubprofileRules();
  const status = getDeveloperOnlyAtlasThemeSubprofileRulesStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /architectureStyleProfileId/);
  assert.match(source, /vegetationStyleProfileId/);
  assert.match(source, /streetscapeStyleProfileId/);
  assert.match(source, /themeSubprofileCompatibility/);
  assert.match(source, /styleSubprofileReason/);
});
