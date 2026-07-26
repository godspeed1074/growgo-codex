import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-suburban-brick-production-run.mjs"
  )
);

test("building house suburban brick production run validates approved reuse scope", () => {
  const result =
    moduleUnderTest.validateBuildingHouseSuburbanBrickProductionRun();

  assert.equal(result.ok, true);
  assert.equal(result.productionRun.definition.targetReusePercentage, 75);
  assert.deepEqual(result.productionRun.definition.suburbanIdentityModules, [
    "MOD_WALL_BRICK_SUBURBAN_001",
    "MOD_ROOF_TILE_STANDARD_001",
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_LETTERBOX_STANDARD_001",
    "MOD_ENTRY_PATH_SUBURBAN_001",
  ]);
});

test("building house suburban brick production run declares expected Layer C exports and metadata files", () => {
  const definition = moduleUnderTest.buildBuildingHouseSuburbanBrickProductionRun();

  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_HOUSE_SUBURBAN_BRICK_001_LOD_CLOSE.glb",
    "BUILDING_HOUSE_SUBURBAN_BRICK_001_LOD_GAMEPLAY.glb",
    "BUILDING_HOUSE_SUBURBAN_BRICK_001_LOD_MAP.glb",
  ]);
  assert.ok(definition.sharedSiteModules.includes("MOD_FENCE_STANDARD_001"));
  assert.ok(
    definition.sharedSiteModules.includes("MOD_DRIVEWAY_STANDARD_SINGLE_001")
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "building-house-suburban-brick-validation.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "BUILDING_HOUSE_SUBURBAN_BRICK_001_ASSEMBLY_TEST_v001.blend"
    )
  );
});
