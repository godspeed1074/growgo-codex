import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "nature-asset-creation-pass.mjs"
  )
);

test("nature asset creation pass defines the first five nature assets", () => {
  const result = moduleUnderTest.createNatureAssetCreationPass();
  const assetIds = result.assets.map((asset) => asset.assetId);

  assert.deepEqual(assetIds, [
    "BUSH_NATIVE_001",
    "GROUND_COASTAL_GRASS_001",
    "ROCK_COASTAL_001",
    "TREE_COASTAL_001",
    "TREE_EUCALYPTUS_001"
  ]);
});

test("tree eucalyptus and ground coastal grass preserve validated prototype-backed budgets", () => {
  const result = moduleUnderTest.createNatureAssetCreationPass();
  const tree = result.assets.find((asset) => asset.assetId === "TREE_EUCALYPTUS_001");
  const ground = result.assets.find(
    (asset) => asset.assetId === "GROUND_COASTAL_GRASS_001"
  );

  assert.ok(tree);
  assert.ok(ground);
  assert.equal(tree.polygonBudget.close, 240);
  assert.equal(ground.polygonBudget.close, 160);
  assert.equal(result.validation.prototypeChecks.treeEucalyptus, true);
  assert.equal(result.validation.prototypeChecks.groundCoastalGrass, true);
});

test("tree coastal asset includes coastal and foreshore biome support", () => {
  const result = moduleUnderTest.createNatureAssetCreationPass();
  const asset = result.assets.find((entry) => entry.assetId === "TREE_COASTAL_001");

  assert.ok(asset);
  assert.ok(asset.biomeCompatibility.includes("COASTAL"));
  assert.ok(asset.biomeCompatibility.includes("FORESHORE_PARKLAND"));
  assert.deepEqual(asset.lodRules, [
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP",
    "LOD_DISTANT_SILHOUETTE"
  ]);
});

test("bush and rock assets remain lightweight and atlas compatible", () => {
  const result = moduleUnderTest.createNatureAssetCreationPass();
  const bush = result.assets.find((entry) => entry.assetId === "BUSH_NATIVE_001");
  const rock = result.assets.find((entry) => entry.assetId === "ROCK_COASTAL_001");

  assert.ok(bush);
  assert.ok(rock);
  assert.equal(bush.materialBudget.maxSharedMaterials, 2);
  assert.equal(rock.atlasCompatibility.atlasCompatible, true);
  assert.ok(rock.atlasCompatibility.placementRoles.includes("cliff_edge"));
});

test("same inputs produce deterministic same creation pass output", () => {
  const first = moduleUnderTest.createNatureAssetCreationPass();
  const second = moduleUnderTest.createNatureAssetCreationPass();

  assert.deepEqual(first, second);
});

test("nature asset creation validation passes for complete asset set", () => {
  const result = moduleUnderTest.validateNatureAssetCreationPass();

  assert.equal(result.ok, true);
  assert.equal(result.natureAssetCreationPass.validation.assetsHaveIds, true);
  assert.equal(result.natureAssetCreationPass.validation.metadataComplete, true);
  assert.equal(
    result.natureAssetCreationPass.validation.performanceBudgetValid,
    true
  );
});

test("nature asset creation validation fails for invalid polygon budget ordering", () => {
  const result = moduleUnderTest.validateNatureAssetCreationPass({
    ...moduleUnderTest.natureAssetCreationSetDefinition,
    assets: moduleUnderTest.natureAssetCreationSetDefinition.assets.map((asset) =>
      asset.assetId === "TREE_COASTAL_001"
        ? {
            ...asset,
            polygonBudget: {
              close: 120,
              gameplay: 160,
              map: 64,
              distantSilhouette: 20
            }
          }
        : asset
    )
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_polygon_budget_order");
});
