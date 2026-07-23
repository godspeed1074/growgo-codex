import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const coreWorldPackModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "core-world-asset-pack.mjs"
  )
);

const worldPlacementModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-placement-rules.mjs"
  )
);

function buildPlacementContext() {
  const layers = coreWorldPackModule.buildCoreWorldAssetFactoryLayers();
  const placementRuleRegistry = worldPlacementModule.createWorldPlacementRuleRegistry(
    worldPlacementModule.coreWorldPlacementRules
  );

  return {
    ...layers,
    placementRuleRegistry
  };
}

function buildPlacementInput(overrides = {}) {
  return {
    placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
    assetId: "BUILDING_HOUSE_SMALL_001",
    locationId: "PLOT_TOWN_001",
    coordinates: {
      x: 12.25,
      y: 6.75
    },
    seed: "placement-seed-001",
    terrainType: "grass",
    locationType: "building_plot",
    ...overrides
  };
}

test("valid world placement rules normalize and validate successfully", () => {
  const result = worldPlacementModule.validateWorldPlacementRule(
    worldPlacementModule.coreWorldPlacementRules[0]
  );

  assert.equal(result.ok, true);
  assert.equal(result.normalizedRule.placementRuleId, "PLACEMENT_TERRAIN_TILE_001");
  assert.equal(result.normalizedRule.assetCategory, "terrain");
});

test("world placement rule validation enforces required fields and orientations", () => {
  const missingMetadata = structuredClone(
    worldPlacementModule.coreWorldPlacementRules[0]
  );
  delete missingMetadata.metadata;

  const invalidOrientation = structuredClone(
    worldPlacementModule.coreWorldPlacementRules[0]
  );
  invalidOrientation.orientationRules.allowedOrientations = ["north", "diagonal"];

  const missingMetadataResult =
    worldPlacementModule.validateWorldPlacementRule(missingMetadata);
  const invalidOrientationResult =
    worldPlacementModule.validateWorldPlacementRule(invalidOrientation);

  assert.equal(missingMetadataResult.ok, false);
  assert.equal(missingMetadataResult.errorCode, "missing_required_field");
  assert.equal(invalidOrientationResult.ok, false);
  assert.equal(invalidOrientationResult.errorCode, "invalid_orientation");
});

test("same asset, location, seed, and rule produce the same deterministic placement result", () => {
  const context = buildPlacementContext();
  const first = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput(),
    context
  );
  const second = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput(),
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.placement, second.placement);
  assert.equal(
    first.deterministicPlacement.deterministicHash,
    second.deterministicPlacement.deterministicHash
  );
});

test("different seeds can produce different valid placement outcomes", () => {
  const context = buildPlacementContext();
  const first = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({ seed: "placement-seed-001" }),
    context
  );
  const second = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({ seed: "placement-seed-002" }),
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.selectedAsset.assetId, "BUILDING_HOUSE_SMALL_001");
  assert.equal(second.selectedAsset.assetId, "BUILDING_HOUSE_SMALL_001");
  assert.notEqual(
    first.deterministicPlacement.deterministicHash,
    second.deterministicPlacement.deterministicHash
  );
});

test("invalid placement input fails safely for category, terrain, and location mismatches", () => {
  const context = buildPlacementContext();

  const categoryMismatch = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({ assetId: "TREE_BASIC_001" }),
    context
  );
  const terrainBlocked = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({ terrainType: "water_edge" }),
    context
  );
  const locationBlocked = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({ locationType: "nature_cluster" }),
    context
  );

  assert.equal(categoryMismatch.ok, false);
  assert.equal(categoryMismatch.errorCode, "asset_category_mismatch");
  assert.equal(categoryMismatch.placement, null);
  assert.equal(terrainBlocked.ok, false);
  assert.equal(terrainBlocked.errorCode, "terrain_not_allowed");
  assert.equal(locationBlocked.ok, false);
  assert.equal(locationBlocked.errorCode, "location_not_allowed");
});

test("placement output includes selected asset, manifest, recipe, and deterministic placement details", () => {
  const context = buildPlacementContext();
  const result = worldPlacementModule.calculateDeterministicPlacement(
    buildPlacementInput({
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      assetId: "DECORATION_SIGN_BASIC_001",
      locationType: "road_edge"
    }),
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.selectedAsset.assetId, "DECORATION_SIGN_BASIC_001");
  assert.equal(result.selectedManifest.assetId, "DECORATION_SIGN_BASIC_001");
  assert.equal(result.selectedRecipeReference, "DECORATION_SIGN_BASIC_RECIPE_001");
  assert.equal(typeof result.placement.orientation, "string");
  assert.equal(typeof result.placement.position.x, "number");
});
