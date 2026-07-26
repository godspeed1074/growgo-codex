import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-bakery-small-town-production-run.mjs"
  )
);

test("building bakery small town production run validates approved assembly scope", () => {
  const result = moduleUnderTest.validateBuildingBakerySmallTownProductionRun();

  assert.equal(result.ok, true);
  assert.equal(result.productionRun.definition.targetReusePercentage, 80);
  assert.deepEqual(result.productionRun.definition.reusedHospitalityModules, [
    "MOD_AWNING_COASTAL_CAFE_001",
    "MOD_CAFE_SIGN_STANDARD_001",
    "MOD_SERVICE_WINDOW_CAFE_001",
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
  ]);
  assert.deepEqual(result.productionRun.definition.bakeryIdentityModulesUsed, [
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001",
  ]);
});

test("building bakery small town production run declares expected Layer C exports and metadata files", () => {
  const definition = moduleUnderTest.buildBuildingBakerySmallTownProductionRun();

  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_BAKERY_SMALL_TOWN_001_LOD_CLOSE.glb",
    "BUILDING_BAKERY_SMALL_TOWN_001_LOD_GAMEPLAY.glb",
    "BUILDING_BAKERY_SMALL_TOWN_001_LOD_MAP.glb",
  ]);
  assert.ok(
    definition.reusedResidentialCoastalModules.includes(
      "MOD_WINDOW_RESIDENTIAL_LARGE_001"
    )
  );
  assert.ok(
    definition.bakeryIdentityModulesUsed.includes(
      "MOD_BAKERY_COUNTER_FRONTAGE_001"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "building-bakery-small-town-validation.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "BUILDING_BAKERY_SMALL_TOWN_001_ASSEMBLY_TEST_v001.blend"
    )
  );
});
