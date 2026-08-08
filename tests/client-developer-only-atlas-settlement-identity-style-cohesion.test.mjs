import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry,
  getDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesion
} from "../client/developer-only-atlas-population-settlement-identity-style-cohesion-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_26_SETTLEMENT_IDENTITY_STYLE_COHESION.md"
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
    selectorSeed: "SETTLEMENT_SELECTOR_001",
    viewportId: "SETTLEMENT_VIEWPORT_001",
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

function resolveSettlementIdentity({
  biomeProfileId = "BIOME_PROFILE_SUBURBAN_001",
  localCharacterProfileId = "LOCAL_CHARACTER_SUBURBAN_GARDEN_001",
  districtType = "residential"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesion(
    registry,
    {
      biomeProfileId,
      localCharacterProfileId,
      districtType
    }
  );
}

test("1. settlement identity is stable", () => {
  const first = resolveSettlementIdentity();
  const second = resolveSettlementIdentity();

  assert.deepEqual(first, second);
  assert.equal(
    first.settlementIdentityId,
    "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001"
  );
});

test("2. style cohesion is deterministic", () => {
  const first = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    districtType: "civic"
  });
  const second = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    districtType: "civic"
  });

  assert.deepEqual(first, second);
  assert.equal(first.styleProfileId, "STYLE_PROFILE_HERITAGE_TOWN_001");
  assert.equal(
    first.architecturalInfluence,
    "heritage_town_civic_frontage"
  );
});

test("3. palette selection is stable", () => {
  const result = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    localCharacterProfileId: "LOCAL_CHARACTER_COASTAL_SETTLEMENT_001",
    districtType: "coastal_natural"
  });

  assert.equal(
    result.paletteProfileId,
    "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
  );
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("4. regional transitions stay valid and deterministic", () => {
  const coastal = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_COASTAL_001",
    localCharacterProfileId: "LOCAL_CHARACTER_COASTAL_SETTLEMENT_001",
    districtType: "coastal_natural"
  });
  const rural = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_RURAL_001",
    localCharacterProfileId: "LOCAL_CHARACTER_RURAL_EDGE_001",
    districtType: "recreation"
  });
  const urban = resolveSettlementIdentity({
    biomeProfileId: "BIOME_PROFILE_URBAN_001",
    localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
    districtType: "commercial"
  });

  assert.notEqual(coastal.settlementIdentityId, rural.settlementIdentityId);
  assert.notEqual(rural.settlementIdentityId, urban.settlementIdentityId);
  assert.notEqual(coastal.paletteProfileId, urban.paletteProfileId);
});

test("5. budgets are preserved and planner exposes settlement diagnostics", () => {
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
  assert.equal(plan.settlementIdentityStyleCohesionDecisions.length >= 3, true);
  assert.equal(typeof status.settlementIdentityId, "string");
  assert.equal(typeof status.styleProfileId, "string");
  assert.equal(typeof status.paletteProfileId, "string");
  assert.equal(typeof status.architecturalInfluence, "string");
  assert.equal(typeof status.cohesionReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (placement) =>
        typeof placement.settlementIdentityId === "string" &&
        typeof placement.styleProfileId === "string" &&
        typeof placement.paletteProfileId === "string"
    ),
    true
  );
});

test("6. automatic controller regression remains planning safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSettlementIdentityRuleCount >= 6, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /settlementIdentityId/);
  assert.match(source, /styleProfileId/);
  assert.match(source, /paletteProfileId/);
  assert.match(source, /architecturalInfluence/);
  assert.match(source, /cohesionReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
