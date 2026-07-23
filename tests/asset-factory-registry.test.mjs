import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const registryModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-registry.mjs"
  )
);

function buildAsset(overrides = {}) {
  return {
    assetId: "BUILDING_BAKERY_001",
    category: "buildings",
    version: "1.0.0",
    status: "validated",
    components: ["WALL_BASIC_001", "DOOR_WOOD_001", "ROOF_GABLE_001"],
    tags: ["bakery", "shopfront", "town"],
    metadata: {
      creatorSource: "internal",
      performanceTargets: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low"
      },
      lod: {
        profile: "mobile-default"
      },
      validationState: "validated"
    },
    ...overrides
  };
}

test("valid asset records normalize and validate successfully", () => {
  const result = registryModule.validateAssetRecord(buildAsset());

  assert.equal(result.ok, true);
  assert.equal(result.normalizedAsset.assetId, "BUILDING_BAKERY_001");
  assert.equal(result.normalizedAsset.category, "buildings");
  assert.equal(result.normalizedAsset.version, "1.0.0");
  assert.equal(result.normalizedAsset.status, "validated");
});

test("required fields are enforced", () => {
  const asset = buildAsset();
  delete asset.metadata;

  const result = registryModule.validateAssetRecord(asset);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "missing_required_field");
});

test("category, version, and status rules are enforced", () => {
  const badCategory = registryModule.validateAssetRecord(
    buildAsset({ category: "quests" })
  );
  const badVersion = registryModule.validateAssetRecord(
    buildAsset({ version: "v1" })
  );
  const badStatus = registryModule.validateAssetRecord(
    buildAsset({ status: "live" })
  );

  assert.equal(badCategory.ok, false);
  assert.equal(badCategory.errorCode, "invalid_category");
  assert.equal(badVersion.ok, false);
  assert.equal(badVersion.errorCode, "invalid_version");
  assert.equal(badStatus.ok, false);
  assert.equal(badStatus.errorCode, "invalid_status");
});

test("registry rejects duplicate asset IDs", () => {
  const registry = registryModule.createAssetRegistry([buildAsset()]);

  assert.throws(
    () => registry.addAsset(buildAsset()),
    /already exists in the registry/
  );
});

test("registry supports lookup by asset ID and metadata retrieval", () => {
  const registry = registryModule.createAssetRegistry([buildAsset()]);

  const asset = registry.findAssetById("building_bakery_001");
  const metadata = registry.getAssetMetadata("BUILDING_BAKERY_001");

  assert.equal(asset.assetId, "BUILDING_BAKERY_001");
  assert.equal(metadata.creatorSource, "internal");
  assert.equal(registry.hasAsset("BUILDING_BAKERY_001"), true);
});

test("registry returns component dependencies and availability state", () => {
  const registry = registryModule.createAssetRegistry([
    buildAsset(),
    buildAsset({
      assetId: "TREE_EUCALYPTUS_001",
      category: "nature",
      status: "draft",
      components: ["TRUNK_EUCALYPTUS_001", "CANOPY_EUCALYPTUS_001"],
      tags: ["tree", "eucalyptus"],
      metadata: {
        creatorSource: "internal",
        performanceTargets: {
          storageBudget: "low",
          ramBudget: "low",
          gpuBudget: "low"
        },
        lod: {
          profile: "mobile-default"
        },
        validationState: "draft"
      }
    })
  ]);

  assert.deepEqual(registry.getAssetComponentDependencies("TREE_EUCALYPTUS_001"), [
    "TRUNK_EUCALYPTUS_001",
    "CANOPY_EUCALYPTUS_001"
  ]);
  assert.equal(registry.isAssetAvailable("BUILDING_BAKERY_001"), true);
  assert.equal(registry.isAssetAvailable("TREE_EUCALYPTUS_001"), false);
  assert.equal(registry.isAssetAvailable("MISSING_ASSET_001"), false);
});

test("registry stays modular and does not require recipes or renderer integration yet", () => {
  const registry = registryModule.createAssetRegistry([buildAsset()]);
  const storedAsset = registry.findAssetById("BUILDING_BAKERY_001");

  assert.equal(typeof storedAsset.metadata.recipeId, "undefined");
  assert.equal(typeof storedAsset.metadata.rendererBinding, "undefined");
});
