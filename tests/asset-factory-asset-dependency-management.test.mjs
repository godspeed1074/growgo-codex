import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const dependencyModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-dependency-management.mjs"
  )
);

test("create dependency graph builds deterministic asset-to-recipe dependency records", () => {
  const layer = dependencyModule.createAssetDependencyManagementLayer();
  const beachDependency = layer.dependencyRecords.find(
    (record) =>
      record.sourceId === "GROUND_BEACH_SAND_001" &&
      record.targetId === "BEACH_ENVIRONMENT_RECIPE_001" &&
      record.dependencyType === "ASSET_USES_RECIPE"
  );

  assert.ok(beachDependency);
  assert.equal(beachDependency.impactLevel, "HIGH");
  assert.match(beachDependency.dependencyReason, /uses primary recipe/);
});

test("resolve dependency chain walks recipe, environment, atlas, and variant edges deterministically", () => {
  const layer = dependencyModule.createAssetDependencyManagementLayer();
  const chain = layer.resolveDependencyChain("GROUND_BEACH_SAND_001");

  assert.ok(
    chain.some(
      (record) =>
        record.targetId === "BEACH_ENVIRONMENT_RECIPE_001" &&
        record.dependencyType === "ASSET_USES_RECIPE"
    )
  );
  assert.ok(
    chain.some(
      (record) =>
        record.targetId === "ENVIRONMENT::BEACH_GROUND_COVER" &&
        record.dependencyType === "ASSET_USED_BY_ENVIRONMENT"
    )
  );
  assert.ok(
    chain.some(
      (record) =>
        record.targetId === "ATLAS::BEACH" &&
        record.dependencyType === "ASSET_USED_BY_ATLAS"
    )
  );
});

test("invalid reference handling rejects dependency records with unknown targets", () => {
  assert.throws(
    () =>
      dependencyModule.createAssetDependencyManagementLayer({
        customDependencyRecords: [
          {
            sourceId: "GROUND_BEACH_SAND_001",
            targetId: "UNKNOWN_DEPENDENCY_TARGET_001",
            dependencyType: "ASSET_USES_RECIPE",
            dependencyReason: "Invalid reference coverage.",
            impactLevel: "LOW"
          }
        ]
      }),
    /referencesExist must be true|references must exist/
  );
});

test("cycle detection rejects invalid circular dependency chains", () => {
  assert.throws(
    () =>
      dependencyModule.createAssetDependencyManagementLayer({
        customDependencyRecords: [
          {
            sourceId: "BEACH_ENVIRONMENT_RECIPE_001",
            targetId: "TREE_COASTAL_001",
            dependencyType: "RECIPE_USES_ASSET",
            dependencyReason: "Cross-recipe dependency link for cycle coverage.",
            impactLevel: "MEDIUM"
          },
          {
            sourceId: "TREE_COASTAL_001",
            targetId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
            dependencyType: "ASSET_USES_RECIPE",
            dependencyReason: "Tree asset uses the coastal environment recipe.",
            impactLevel: "HIGH"
          },
          {
            sourceId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
            targetId: "GROUND_BEACH_SAND_001",
            dependencyType: "RECIPE_USES_ASSET",
            dependencyReason: "Recipe loops back to beach ground asset.",
            impactLevel: "MEDIUM"
          }
        ]
      }),
    /noInvalidCycles must be true/
  );
});

test("same input produces deterministic same dependency graph output", () => {
  const first = dependencyModule.createAssetDependencyManagementLayer();
  const second = dependencyModule.createAssetDependencyManagementLayer();

  assert.deepEqual(first.dependencyRecords, second.dependencyRecords);
  assert.equal(
    first.validation.deterministicGraphHash,
    second.validation.deterministicGraphHash
  );
});

test("explicit dependency validation passes contract checks", () => {
  const layer = dependencyModule.createAssetDependencyManagementLayer();
  const validation = dependencyModule.validateAssetDependencyManagementLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetDependencyManagementLayer.validation.referencesExist,
    true
  );
  assert.equal(
    validation.assetDependencyManagementLayer.validation.dependencyTypeValid,
    true
  );
  assert.equal(
    validation.assetDependencyManagementLayer.validation.noInvalidCycles,
    true
  );
});
