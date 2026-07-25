import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-coastal-cottage-production-run.mjs"
  )
);

test("building house coastal cottage production run validates the approved phase structure", () => {
  const result = moduleUnderTest.validateBuildingHouseCoastalCottageProductionRun();

  assert.equal(result.ok, true);
  assert.deepEqual(result.productionRun.definition.phase1CoreModules, [
    "MOD_FOUNDATION_STANDARD_RECT_001",
    "MOD_WALL_WEATHERBOARD_WHITE_001",
    "MOD_WALL_CORNER_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_DOOR_STANDARD_RESIDENTIAL_001",
    "MOD_ROOF_GABLE_STANDARD_001",
  ]);
  assert.equal(
    result.productionRun.definition.phase2ShellOutput,
    "HOUSE_COASTAL_COTTAGE_SHELL_TEST"
  );
});

test("building house coastal cottage production run declares proof-build output expectations", () => {
  const definition =
    moduleUnderTest.buildBuildingHouseCoastalCottageProductionRun();

  assert.deepEqual(definition.expectedOutputs.coreModules, [
    "MOD_FOUNDATION_STANDARD_RECT_001.glb",
    "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
    "MOD_WALL_CORNER_STANDARD_001.glb",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001.glb",
    "MOD_DOOR_STANDARD_RESIDENTIAL_001.glb",
    "MOD_ROOF_GABLE_STANDARD_001.glb",
  ]);
  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
    "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
    "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_MAP.glb",
  ]);
});
