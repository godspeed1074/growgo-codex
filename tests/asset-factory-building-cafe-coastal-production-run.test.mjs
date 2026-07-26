import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-cafe-coastal-production-run.mjs"
  )
);

test("building cafe coastal production run validates approved assembly scope", () => {
  const result = moduleUnderTest.validateBuildingCafeCoastalProductionRun();

  assert.equal(result.ok, true);
  assert.equal(result.productionRun.definition.targetReusePercentage, 75);
  assert.deepEqual(result.productionRun.definition.hospitalityModulesUsed, [
    "MOD_AWNING_COASTAL_CAFE_001",
    "MOD_CAFE_SIGN_STANDARD_001",
    "MOD_SERVICE_WINDOW_CAFE_001",
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
  ]);
});

test("building cafe coastal production run declares expected Layer C exports and metadata files", () => {
  const definition = moduleUnderTest.buildBuildingCafeCoastalProductionRun();

  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_CAFE_COASTAL_001_LOD_CLOSE.glb",
    "BUILDING_CAFE_COASTAL_001_LOD_GAMEPLAY.glb",
    "BUILDING_CAFE_COASTAL_001_LOD_MAP.glb",
  ]);
  assert.ok(
    definition.reusedModules.includes("MOD_WINDOW_RESIDENTIAL_LARGE_001")
  );
  assert.ok(
    definition.hospitalityModulesUsed.includes("MOD_SERVICE_WINDOW_CAFE_001")
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "building-cafe-coastal-validation.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "BUILDING_CAFE_COASTAL_001_ASSEMBLY_TEST_v001.blend"
    )
  );
});
