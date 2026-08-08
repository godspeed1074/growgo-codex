import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry,
  getDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistryStatus,
  resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks
} from "../client/developer-only-atlas-population-signature-route-legacy-hooks-rules.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_47_SIGNATURE_ROUTE_LEGACY_HOOKS.md"
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
    selectorSeed: "SIGNATURE_ROUTE_SELECTOR_001",
    viewportId: "SIGNATURE_ROUTE_VIEWPORT_001",
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

function resolveSignatureRouteLegacy({
  worldJourneyProfileId = "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001",
  routeMemoryId = "ROUTE_MEMORY_HERITAGE_LANDMARK_001",
  placeMemoryId = "PLACE_MEMORY_HISTORIC_LANDMARK_001",
  regionalIdentityId = "REGIONAL_IDENTITY_BELLARINE_HERITAGE_001"
} = {}) {
  const registry =
    createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry();
  return resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks(registry, {
    worldJourneyProfileId,
    routeMemoryId,
    placeMemoryId,
    regionalIdentityId
  });
}

test("1. signature routes stable", () => {
  const first = resolveSignatureRouteLegacy();
  const second = resolveSignatureRouteLegacy();

  assert.deepEqual(first, second);
  assert.equal(
    first.signatureRouteProfileId,
    "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001"
  );
});

test("2. legacy destinations deterministic", () => {
  const first = resolveSignatureRouteLegacy({
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
    routeMemoryId: "ROUTE_MEMORY_SCENIC_COASTAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COASTAL_001"
  });
  const second = resolveSignatureRouteLegacy({
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
    routeMemoryId: "ROUTE_MEMORY_SCENIC_COASTAL_001",
    placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COASTAL_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.legacyDestinationId,
    "LEGACY_DESTINATION_COASTAL_REVEAL_001"
  );
});

test("3. mythology profiles valid", () => {
  const result = resolveSignatureRouteLegacy({
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001",
    routeMemoryId: "ROUTE_MEMORY_PARK_TRAIL_001",
    placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COMMUNITY_001"
  });

  assert.equal(
    result.mythologyProfileId,
    "MYTHOLOGY_PROFILE_LOCAL_MEMORY_KEEPER_001"
  );
  assert.match(result.legacyReason, /community|legend|return/i);
});

test("4. same input same output", () => {
  const first = resolveSignatureRouteLegacy({
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
  });
  const second = resolveSignatureRouteLegacy({
    worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001",
    routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
    placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
    regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
  });

  assert.deepEqual(first, second);
});

test("5. budgets preserved and planner exposes legacy diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      seasonKey: "summer",
      features: [
        feature({
          featureId: "coast-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "park-001",
          featureClass: "parkland",
          latitude: -38.1357,
          longitude: 144.3491,
          sourceClassification: "leisure:park"
        }),
        feature({
          featureId: "civic-001",
          featureClass: "civic_site",
          latitude: -38.1356,
          longitude: 144.3492,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.signatureRouteLegacyDecisions.length >= 1, true);
  assert.equal(
    plan.signatureRouteLegacyDecisions.every(
      (entry) =>
        "signatureRouteProfileId" in entry &&
        "legacyDestinationId" in entry &&
        "mythologyProfileId" in entry &&
        "globalJourneyTier" in entry &&
        "legacyReason" in entry
    ),
    true
  );
  assert.equal(typeof status.legacyReason, "string");
});

test("6. automatic controller regression passes planning-safe", () => {
  const registry =
    createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry();
  const status =
    getDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistryStatus(
      registry
    );
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredSignatureRouteLegacyRuleCount >= 4, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /signatureRouteProfileId/);
  assert.match(source, /legacyDestinationId/);
  assert.match(source, /mythologyProfileId/);
  assert.match(source, /globalJourneyTier/);
  assert.match(source, /legacyReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
