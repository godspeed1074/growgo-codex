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

const resolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "deterministic-asset-resolver.mjs"
  )
);

function buildResolverContext() {
  return coreWorldPackModule.buildCoreWorldAssetFactoryLayers();
}

function buildInput(overrides = {}) {
  return {
    locationId: "CELL_AU_MEL_001",
    coordinates: {
      x: 144.9631,
      y: -37.8136
    },
    seed: "growgo-seed-001",
    assetCategory: "terrain",
    assetType: null,
    availableAssetReferences: [
      "TERRAIN_GRASS_001",
      "TERRAIN_DIRT_001",
      "TERRAIN_SAND_001",
      "TERRAIN_WATER_EDGE_001"
    ],
    resolverRules: {
      variantPolicy: "seeded-index",
      variantOffset: 0
    },
    ...overrides
  };
}

test("same deterministic resolver input produces the same asset selection", () => {
  const context = buildResolverContext();
  const first = resolverModule.resolveDeterministicAssetSelection(
    buildInput(),
    context
  );
  const second = resolverModule.resolveDeterministicAssetSelection(
    buildInput(),
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.selectedAsset.assetId, second.selectedAsset.assetId);
  assert.equal(
    first.selectedManifest.assetId,
    second.selectedManifest.assetId
  );
  assert.equal(
    first.deterministicVariant.deterministicHash,
    second.deterministicVariant.deterministicHash
  );
});

test("different seeds can produce different valid deterministic selections", () => {
  const context = buildResolverContext();
  const first = resolverModule.resolveDeterministicAssetSelection(
    buildInput({ seed: "growgo-seed-001" }),
    context
  );
  const second = resolverModule.resolveDeterministicAssetSelection(
    buildInput({ seed: "growgo-seed-002" }),
    context
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.selectedAsset.category, "terrain");
  assert.equal(second.selectedAsset.category, "terrain");
  assert.equal(
    context.manifestRegistry.hasManifest(first.selectedAsset.assetId),
    true
  );
  assert.equal(
    context.manifestRegistry.hasManifest(second.selectedAsset.assetId),
    true
  );
  assert.notEqual(
    first.deterministicVariant.deterministicHash,
    second.deterministicVariant.deterministicHash
  );
});

test("resolver supports deterministic selection using exact asset type", () => {
  const context = buildResolverContext();
  const result = resolverModule.resolveDeterministicAssetSelection(
    buildInput({
      assetCategory: "buildings",
      assetType: "building_shop_small",
      availableAssetReferences: [
        "BUILDING_HOUSE_SMALL_001",
        "BUILDING_SHOP_SMALL_001"
      ]
    }),
    context
  );

  assert.equal(result.ok, true);
  assert.equal(result.selectedAsset.assetId, "BUILDING_SHOP_SMALL_001");
  assert.equal(
    result.selectedRecipeReference,
    "BUILDING_SHOP_SMALL_RECIPE_001"
  );
});

test("invalid input fails safely without selecting an asset", () => {
  const context = buildResolverContext();
  const invalidCategory = resolverModule.resolveDeterministicAssetSelection(
    buildInput({ assetCategory: "quests" }),
    context
  );
  const missingReference = resolverModule.resolveDeterministicAssetSelection(
    buildInput({
      availableAssetReferences: ["TERRAIN_UNKNOWN_001"]
    }),
    context
  );

  assert.equal(invalidCategory.ok, false);
  assert.equal(invalidCategory.errorCode, "invalid_category");
  assert.equal(invalidCategory.selectedAsset, null);
  assert.equal(missingReference.ok, false);
  assert.equal(missingReference.errorCode, "missing_asset_reference");
  assert.equal(missingReference.selectedManifest, null);
});

test("resolver returns safe failure when no approved asset matches the request", () => {
  const context = buildResolverContext();
  const result = resolverModule.resolveDeterministicAssetSelection(
    buildInput({
      assetCategory: "nature",
      assetType: "building_shop_small",
      availableAssetReferences: ["TREE_BASIC_001", "BUSH_BASIC_001"]
    }),
    context
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "no_matching_assets");
  assert.equal(result.selectedAsset, null);
  assert.equal(result.deterministicVariant, null);
});
