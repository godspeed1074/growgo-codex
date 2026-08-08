import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry,
  getDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent
} from "../client/developer-only-atlas-population-special-site-accent-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_31_SPECIAL_SITE_ACCENT_RULES.md"
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
    selectorSeed: "SPECIAL_SITE_SELECTOR_001",
    viewportId: "SPECIAL_SITE_VIEWPORT_001",
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

function resolveSpecialSite({
  featureClass = "building_footprint",
  districtType = "residential",
  lotType = "corner_lot",
  sourceClassification = "building:house"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent(registry, {
    featureClass,
    districtType,
    lotType,
    sourceClassification
  });
}

test("1. corner lot is stable", () => {
  const first = resolveSpecialSite();
  const second = resolveSpecialSite();

  assert.deepEqual(first, second);
  assert.equal(first.specialSiteType, "corner_lot");
  assert.equal(
    first.cornerLotAccentId,
    "CORNER_LOT_ACCENT_DUAL_FRONTAGE_001"
  );
});

test("2. landmark accent is stable", () => {
  const result = resolveSpecialSite({
    featureClass: "civic_site",
    districtType: "civic",
    lotType: "standalone_lot",
    sourceClassification: "amenity:community_centre"
  });

  assert.equal(result.matched, true);
  assert.equal(result.specialSiteType, "local_landmark");
  assert.equal(
    result.landmarkAccentProfileId,
    "LANDMARK_ACCENT_PROFILE_LOCAL_ICON_001"
  );
});

test("3. special locations are deterministic", () => {
  const first = resolveSpecialSite({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    lotType: "standalone_lot",
    sourceClassification: "tourist:lookout"
  });
  const second = resolveSpecialSite({
    featureClass: "coastal_green",
    districtType: "coastal_natural",
    lotType: "standalone_lot",
    sourceClassification: "tourist:lookout"
  });

  assert.deepEqual(first, second);
  assert.equal(first.specialSiteType, "tourist_special_location");
});

test("4. incompatible accents are rejected", () => {
  const result = resolveSpecialSite({
    featureClass: "unsupported",
    districtType: "industrial",
    lotType: "unknown",
    sourceClassification: "other:unknown"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_SPECIAL_SITE_CONTEXT");
});

test("5. budgets are preserved and planner exposes special-site diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "corner-plan-001",
          sourceClassification: "building:house",
          deterministicFeatureIdentity: "corner-plan-001",
          orientationHint: 90
        }),
        feature({
          featureId: "landmark-plan-001",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "cafe:frontage"
        }),
        feature({
          featureId: "corner-plan-002",
          sourceClassification: "building:house",
          latitude: -38.13575,
          longitude: 144.34925,
          deterministicFeatureIdentity: "corner-plan-002",
          orientationHint: 180
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.specialSiteAccentDecisions.length >= 3, true);
  assert.equal(typeof status.specialSiteType, "string");
  assert.equal(typeof status.landmarkAccentProfileId, "string");
  assert.equal(typeof status.cornerLotAccentId, "string");
  assert.equal(typeof status.visibilityPriority, "string");
  assert.equal(typeof status.specialSiteReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "specialSiteType" in entry &&
        "landmarkAccentProfileId" in entry &&
        "cornerLotAccentId" in entry &&
        "visibilityPriority" in entry &&
        "specialSiteReason" in entry
    ),
    true
  );
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSpecialSiteAccentRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /specialSiteType/);
  assert.match(source, /landmarkAccentProfileId/);
  assert.match(source, /cornerLotAccentId/);
  assert.match(source, /visibilityPriority/);
  assert.match(source, /specialSiteReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
