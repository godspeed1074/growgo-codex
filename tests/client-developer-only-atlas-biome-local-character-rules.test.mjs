import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry,
  getDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationBiomeLocalCharacter
} from "../client/developer-only-atlas-population-biome-local-character-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_24_BIOME_LOCAL_CHARACTER_RULES.md"
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
    selectorSeed: "BIOME_SELECTOR_001",
    viewportId: "BIOME_VIEWPORT_001",
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

function resolveBiome({
  featureClass = "building_footprint",
  sourceClassification = "building:house",
  districtType = "residential",
  vergeType = "grass_verge",
  foregroundType = "civic_entry_foreground",
  selectorSeed = "BIOME_DIRECT_001",
  deterministicFeatureIdentity = "feature-001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationBiomeLocalCharacter(registry, {
    featureClass,
    sourceClassification,
    districtType,
    vergeType,
    foregroundType,
    selectorSeed,
    deterministicFeatureIdentity
  });
}

test("1. biome selection is stable", () => {
  const first = resolveBiome();
  const second = resolveBiome();

  assert.deepEqual(first, second);
  assert.equal(first.biomeProfileId, "BIOME_PROFILE_SUBURBAN_001");
});

test("2. blending is deterministic", () => {
  const first = resolveBiome({
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast",
    districtType: "coastal_natural",
    vergeType: "native_verge",
    foregroundType: "scenic_open_frame",
    selectorSeed: "BIOME_BLEND_001",
    deterministicFeatureIdentity: "coast-001"
  });
  const second = resolveBiome({
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast",
    districtType: "coastal_natural",
    vergeType: "native_verge",
    foregroundType: "scenic_open_frame",
    selectorSeed: "BIOME_BLEND_001",
    deterministicFeatureIdentity: "coast-001"
  });

  assert.deepEqual(first.blendWeights, second.blendWeights);
  assert.equal(first.regionalStyleSeed, second.regionalStyleSeed);
});

test("3. coastal rural urban differences are valid", () => {
  const coastal = resolveBiome({
    featureClass: "coastal_green",
    sourceClassification: "green:near_coast",
    districtType: "coastal_natural",
    vergeType: "native_verge",
    foregroundType: "scenic_open_frame"
  });
  const rural = resolveBiome({
    featureClass: "park",
    sourceClassification: "leisure:park",
    districtType: "recreation",
    vergeType: "natural_edge",
    foregroundType: "recreation_open_space"
  });
  const urban = resolveBiome({
    featureClass: "building_footprint",
    sourceClassification: "shop:bakery",
    districtType: "commercial",
    vergeType: "urban_footpath_edge",
    foregroundType: "landmark_supporting_landscape"
  });

  assert.notEqual(coastal.biomeProfileId, rural.biomeProfileId);
  assert.notEqual(rural.biomeProfileId, urban.biomeProfileId);
  assert.notEqual(coastal.localCharacterProfileId, urban.localCharacterProfileId);
});

test("4. same input same output", () => {
  const first = resolveBiome({
    featureClass: "civic_site",
    sourceClassification: "amenity:school",
    districtType: "civic",
    vergeType: "grass_verge",
    foregroundType: "school_entry_foreground",
    selectorSeed: "BIOME_SAME_001",
    deterministicFeatureIdentity: "school-001"
  });
  const second = resolveBiome({
    featureClass: "civic_site",
    sourceClassification: "amenity:school",
    districtType: "civic",
    vergeType: "grass_verge",
    foregroundType: "school_entry_foreground",
    selectorSeed: "BIOME_SAME_001",
    deterministicFeatureIdentity: "school-001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes biome diagnostics", () => {
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
          featureId: "urban-plan-001",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "shop:bakery"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.biomeLocalCharacterDecisions.length >= 3, true);
  assert.equal(typeof status.biomeProfileId === "string", true);
  assert.equal(typeof status.localCharacterProfileId === "string", true);
  assert.equal(typeof status.blendWeights === "object", true);
  assert.equal(typeof status.characterReason === "string", true);
  assert.equal(typeof status.regionalStyleSeed === "string", true);
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredBiomeRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /biomeProfileId/);
  assert.match(source, /localCharacterProfileId/);
  assert.match(source, /blendWeights/);
  assert.match(source, /characterReason/);
  assert.match(source, /regionalStyleSeed/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
