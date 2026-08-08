import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasMultiAssetPlacementProvider
} from "../client/developer-only-atlas-multi-asset-placement-provider.mjs";
import {
  createDeveloperOnlyAtlasSpatialRuleRegistry,
  getDeveloperOnlyAtlasSpatialRuleRegistryStatus,
  resolveDeveloperOnlyAtlasSpatialRuleByAssetId
} from "../client/developer-only-atlas-spatial-rule-registry.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlan,
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const spatialRuleRegistryModulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-spatial-rule-registry.mjs"
);
const worldPopulationPlannerModulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-world-population-planner.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_2_ATLAS_ASSET_SPATIAL_RULES_WORLD_POPULATION.md"
);

function createHarness() {
  const spatialRuleRegistry = createDeveloperOnlyAtlasSpatialRuleRegistry();
  const placementProvider = createDeveloperOnlyAtlasMultiAssetPlacementProvider();
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner({
    spatialRuleRegistry,
    placementProvider
  });

  return {
    spatialRuleRegistry,
    placementProvider,
    planner
  };
}

function feature({
  featureId,
  featureClass,
  latitude,
  longitude,
  area = 80,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId
}) {
  return {
    featureId,
    featureClass,
    coordinate: {
      latitude,
      longitude
    },
    area,
    footprintScalars: {
      width,
      height
    },
    orientationHint,
    deterministicFeatureIdentity
  };
}

function createInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "RECREATION_AREA_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    viewportId: "VIEWPORT_TILE_001",
    features: [],
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    ...overrides
  };
}

test("1. spatial rule registry loads the approved atlas asset rule set", () => {
  const harness = createHarness();
  const status = getDeveloperOnlyAtlasSpatialRuleRegistryStatus(
    harness.spatialRuleRegistry
  );

  assert.equal(status.registeredRuleCount, 4);
  assert.equal(status.lastFailureReason, null);
  assert.doesNotThrow(() => JSON.stringify(status));

  const eucalyptus = resolveDeveloperOnlyAtlasSpatialRuleByAssetId(
    harness.spatialRuleRegistry,
    "TREE_EUCALYPTUS_001"
  );
  const bottlebrush = resolveDeveloperOnlyAtlasSpatialRuleByAssetId(
    harness.spatialRuleRegistry,
    "TREE_BOTTLEBRUSH_001"
  );
  const shrub = resolveDeveloperOnlyAtlasSpatialRuleByAssetId(
    harness.spatialRuleRegistry,
    "SHRUB_COASTAL_LOW_001"
  );
  const pavilion = resolveDeveloperOnlyAtlasSpatialRuleByAssetId(
    harness.spatialRuleRegistry,
    "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );

  assert.equal(eucalyptus.minimumSpacing, 8);
  assert.equal(bottlebrush.assetCategory, "vegetation");
  assert.equal(shrub.maximumDensity, 3);
  assert.equal(pavilion.assetCategory, "building");
});

test("2. vegetation spatial planning produces deterministic lightweight commands", () => {
  const harness = createHarness();
  const input = createInput({
    recipeId: "TREE_EUCALYPTUS_RECIPE_001",
    features: [
      feature({
        featureId: "veg-001",
        featureClass: "vegetation_area",
        latitude: -38.12345,
        longitude: 144.61234,
        area: 80
      })
    ]
  });

  const first = createDeveloperOnlyAtlasWorldPopulationPlan(harness.planner, input);
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(harness.planner, input);

  assert.deepEqual(first, second);
  assert.equal(first.commands.length, 3);
  assert.deepEqual(
    first.commands.map((command) => command.assetId),
    [
      "SHRUB_COASTAL_LOW_001",
      "TREE_BOTTLEBRUSH_001",
      "SHRUB_COASTAL_LOW_001"
    ]
  );
  assert.equal(first.resolvedFeatureRecipes[0].matchedRecipeId, "COASTAL_GREEN_RECIPE_001");
  assert.equal(first.resolvedFeatureRecipes[0].densityTier, "medium");
  assert.equal(first.resolvedFeatureRecipes[0].generatedPlacementCount, 3);
  assert.equal(
    first.commands.every(
      (command) =>
        !("geometry" in command) &&
        !("texture" in command) &&
        !("canvas" in command) &&
        !("map" in command)
    ),
    true
  );
});

test("3. building placement planning works for civic features", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "RECREATION_AREA_RECIPE_001",
      features: [
        feature({
          featureId: "civic-001",
          featureClass: "civic_site",
          latitude: -38.12001,
          longitude: 144.61001,
          area: 400,
          width: 60,
          height: 30,
          orientationHint: 90
        })
      ]
    })
  );

  assert.equal(plan.commands.length, 1);
  assert.equal(plan.commands[0].assetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal([0, 90, 180, 270].includes(plan.commands[0].rotation), true);
});

test("4. unsupported features and mismatched asset contexts fail closed", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      features: [
        feature({
          featureId: "unsupported-001",
          featureClass: "unsupported",
          latitude: -38.13001,
          longitude: 144.62001
        }),
        feature({
          featureId: "park-001",
          featureClass: "park",
          latitude: -38.13041,
          longitude: 144.62041
        })
      ]
    })
  );

  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) => candidate.reasonCode === "UNSUPPORTED_FEATURE_CLASS"
    ),
    true
  );
  assert.equal(
    plan.commands.some((command) => command.assetId === "TREE_EUCALYPTUS_001"),
    true
  );
  assert.equal(
    plan.commands.some((command) => command.assetId === "SHRUB_COASTAL_LOW_001"),
    true
  );
  assert.equal(plan.resolvedFeatureRecipes[0].matchedRecipeId, "PARK_PUBLIC_GREEN_RECIPE_001");
});

test("5. invalid region, package, and recipe are rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      createDeveloperOnlyAtlasWorldPopulationPlan(harness.planner, createInput({
        regionId: "OUTSIDE_SCOPE"
      })),
    /INVALID_REGION_ID/
  );
  assert.throws(
    () =>
      createDeveloperOnlyAtlasWorldPopulationPlan(harness.planner, createInput({
        packageId: "OTHER_PACKAGE"
      })),
    /INVALID_PACKAGE_ID/
  );
  assert.throws(
    () =>
      createDeveloperOnlyAtlasWorldPopulationPlan(harness.planner, createInput({
        recipeId: "UNKNOWN_RECIPE_001"
      })),
    /INVALID_RECIPE_ID/
  );
});

test("6. different selector seeds produce deterministic but different population plans", () => {
  const harness = createHarness();
  const base = {
    recipeId: "TREE_BOTTLEBRUSH_RECIPE_001",
    features: [
      feature({
        featureId: "coastal-001",
        featureClass: "coastal_green",
        latitude: -38.12021,
        longitude: 144.61021
      })
    ]
  };

  const first = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      ...base,
      selectorSeed: "WORLD_SELECTOR_SEED_001"
    })
  );
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      ...base,
      selectorSeed: "WORLD_SELECTOR_SEED_002"
    })
  );

  assert.notEqual(first.populationPlanId, second.populationPlanId);
  assert.notEqual(first.commands[0].instanceId, second.commands[0].instanceId);
});

test("7. different feature coordinates produce different instance identities", () => {
  const harness = createHarness();
  const first = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_EUCALYPTUS_RECIPE_001",
      features: [
        feature({
          featureId: "veg-001",
          featureClass: "vegetation_area",
          latitude: -38.12111,
          longitude: 144.61111
        })
      ]
    })
  );
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_EUCALYPTUS_RECIPE_001",
      features: [
        feature({
          featureId: "veg-001",
          featureClass: "vegetation_area",
          latitude: -38.12121,
          longitude: 144.61121
        })
      ]
    })
  );

  assert.notEqual(first.commands[0].instanceId, second.commands[0].instanceId);
});

test("8. shrub density expands deterministically on larger eligible vegetation features", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
      features: [
        feature({
          featureId: "veg-large-001",
          featureClass: "vegetation_area",
          latitude: -38.12222,
          longitude: 144.61222,
          area: 260
        })
      ]
    })
  );

  const shrubCommands = plan.commands.filter(
    (command) => command.assetId === "SHRUB_COASTAL_LOW_001"
  );

  assert.equal(shrubCommands.length, 1);
  assert.equal(
    plan.commands.some((command) => command.assetId === "TREE_BOTTLEBRUSH_001"),
    true
  );
  assert.equal(new Set(shrubCommands.map((command) => command.instanceId)).size, 1);
  assert.equal(plan.resolvedFeatureRecipes[0].densityTier, "large");
  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "SHRUB_COASTAL_LOW_001" &&
        candidate.reasonCode === "MINIMUM_SPACING_BLOCKED"
    ),
    true
  );
});

test("9. tree spacing blocks overly dense roadside vegetation candidates", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_EUCALYPTUS_RECIPE_001",
      features: [
        feature({
          featureId: "roadside-001",
          featureClass: "roadside_green",
          latitude: -38.12400,
          longitude: 144.61400
        }),
        feature({
          featureId: "roadside-002",
          featureClass: "roadside_green",
          latitude: -38.12403,
          longitude: 144.61403
        })
      ]
    })
  );

  assert.equal(plan.commands.length, 4);
  assert.equal(
    plan.commands.some((command) => command.assetId === "TREE_BOTTLEBRUSH_001"),
    true
  );
  assert.equal(
    plan.commands.filter((command) => command.assetId === "SHRUB_COASTAL_LOW_001").length,
    3
  );
  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "TREE_BOTTLEBRUSH_001" &&
        candidate.reasonCode === "MINIMUM_SPACING_BLOCKED"
    ),
    true
  );
  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "SHRUB_COASTAL_LOW_001" &&
        candidate.reasonCode === "MINIMUM_SPACING_BLOCKED"
    ),
    true
  );
});

test("10. exclusion radii block vegetation placements near building footprints", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_EUCALYPTUS_RECIPE_001",
      features: [
        feature({
          featureId: "veg-near-building",
          featureClass: "vegetation_area",
          latitude: -38.12500,
          longitude: 144.61500,
          area: 120
        }),
        feature({
          featureId: "footprint-near-veg",
          featureClass: "building_footprint",
          latitude: -38.12501,
          longitude: 144.61501,
          area: 300,
          width: 40,
          height: 20
        })
      ]
    })
  );

  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "TREE_BOTTLEBRUSH_001" &&
        candidate.reasonCode === "EXCLUSION_RADIUS_BLOCKED"
    ),
    true
  );
  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) =>
        candidate.assetId === "SHRUB_COASTAL_LOW_001" &&
        candidate.reasonCode === "EXCLUSION_RADIUS_BLOCKED"
    ),
    false
  );
  assert.equal(
    plan.commands.filter((command) => command.assetId === "SHRUB_COASTAL_LOW_001").length,
    2
  );
});

test("11. building footprint resolves the generic placeholder recipe with no visible asset command", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "SPORTS_OVAL_RECIPE_001",
      features: [
        feature({
          featureId: "tiny-footprint",
          featureClass: "building_footprint",
          latitude: -38.12600,
          longitude: 144.61600,
          area: 40,
          width: 12,
          height: 8
        })
      ]
    })
  );

  assert.equal(plan.commands.length, 0);
  assert.equal(plan.resolvedFeatureRecipes[0].matchedRecipeId, "BUILDING_GENERIC_RECIPE_001");
  assert.deepEqual(plan.rejectedCandidates, []);
});

test("12. command budgets truncate deterministically and preserve failure reasons", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001",
      performanceBudget: {
        maximumCandidateFeatures: 64,
        maximumCommands: 1,
        maximumVegetationCommands: 1,
        maximumBuildingCommands: 1
      },
      features: [
        feature({
          featureId: "reserve-001",
          featureClass: "reserve",
          latitude: -38.12700,
          longitude: 144.61700,
          area: 240
        })
      ]
    })
  );

  assert.equal(plan.commands.length, 1);
  assert.equal(
    plan.rejectedCandidates.some(
      (candidate) => candidate.reasonCode === "VEGETATION_BUDGET_EXCEEDED"
    ) ||
      plan.rejectedCandidates.some(
        (candidate) => candidate.reasonCode === "COMMAND_BUDGET_EXCEEDED"
      ),
    true
  );

  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(harness.planner);
  assert.equal(status.budgetTruncated, true);
});

test("13. deterministic batch ordering is preserved regardless of feature input order", () => {
  const harness = createHarness();
  const features = [
    feature({
      featureId: "reserve-100",
      featureClass: "reserve",
      latitude: -38.12800,
      longitude: 144.61800,
      area: 240
    }),
    feature({
      featureId: "civic-100",
      featureClass: "civic_site",
      latitude: -38.12900,
      longitude: 144.61900,
      area: 300
    }),
    feature({
      featureId: "park-100",
      featureClass: "park",
      latitude: -38.13000,
      longitude: 144.62000,
      area: 120
    })
  ];

  const first = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      features
    })
  );
  const second = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      features: [...features].reverse()
    })
  );

  assert.deepEqual(first.commands, second.commands);
  assert.deepEqual(
    first.commands.map((command) => command.instanceId),
    [...first.commands.map((command) => command.instanceId)].sort()
  );
});

test("14. planner output stays batch compatible and render-command only", () => {
  const harness = createHarness();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001",
      features: [
        feature({
          featureId: "coastal-100",
          featureClass: "coastal_green",
          latitude: -38.13100,
          longitude: 144.62100,
          area: 180
        }),
        feature({
          featureId: "civic-101",
          featureClass: "civic_site",
          latitude: -38.13200,
          longitude: 144.62200,
          area: 260
        })
      ]
    })
  );

  assert.equal(
    plan.commands.every(
      (command) =>
        typeof command.assetId === "string" &&
        typeof command.instanceId === "string" &&
        typeof command.position?.x === "number" &&
        typeof command.position?.y === "number" &&
        typeof command.scale === "number" &&
        typeof command.rotation === "number" &&
        typeof command.lod === "string"
    ),
    true
  );
  assert.equal(
    plan.commands.every(
      (command) =>
        !("geometry" in command) &&
        !("texture" in command) &&
        !("blend" in command) &&
        !("glb" in command)
    ),
    true
  );
});

test("15. planner status is frozen, serializable, and exposes no raw references", () => {
  const harness = createHarness();
  createDeveloperOnlyAtlasWorldPopulationPlan(
    harness.planner,
    createInput({
      recipeId: "TREE_EUCALYPTUS_RECIPE_001",
      features: [
        feature({
          featureId: "veg-status-001",
          featureClass: "vegetation_area",
          latitude: -38.13300,
          longitude: 144.62300
        })
      ]
    })
  );

  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(harness.planner);

  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("renderer" in status, false);
});

test("16. planner modules avoid browser-object fallbacks and remain planning only", () => {
  const plannerModule = fs.readFileSync(
    worldPopulationPlannerModulePath,
    "utf8"
  );
  const registryModule = fs.readFileSync(
    spatialRuleRegistryModulePath,
    "utf8"
  );

  assert.equal(plannerModule.includes("window."), false);
  assert.equal(plannerModule.includes("globalThis"), false);
  assert.equal(plannerModule.includes("document."), false);
  assert.equal(registryModule.includes("window."), false);
  assert.equal(registryModule.includes("globalThis"), false);
});

test("17. session documentation exists and records the planning-only pipeline", () => {
  const sessionDoc = fs.readFileSync(sessionDocPath, "utf8");

  assert.match(sessionDoc, /Phase 212\.2/i);
  assert.match(sessionDoc, /TREE_EUCALYPTUS_001/);
  assert.match(sessionDoc, /TREE_BOTTLEBRUSH_001/);
  assert.match(sessionDoc, /SHRUB_COASTAL_LOW_001/);
  assert.match(sessionDoc, /BUILDING_CIVIC_SPORTS_PAVILION_001/);
  assert.match(sessionDoc, /planning-only/i);
  assert.match(sessionDoc, /runtimeExecutionEnabled = false/);
});

test("18. canonical safety flags remain false throughout world population planning", () => {
  const harness = createHarness();
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(harness.planner);

  assert.deepEqual(status.canonicalSafetyFlags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});
