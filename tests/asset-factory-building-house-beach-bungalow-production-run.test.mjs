import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-house-beach-bungalow-production-run.mjs"
  )
);

test("building house beach bungalow production run validates approved reuse scope", () => {
  const result = moduleUnderTest.validateBuildingHouseBeachBungalowProductionRun();

  assert.equal(result.ok, true);
  assert.equal(result.productionRun.definition.targetReusePercentage, 79);
  assert.deepEqual(result.productionRun.definition.newModulesUsed, [
    "MOD_FOUNDATION_RAISED_COASTAL_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_DECK_TIMBER_COASTAL_001",
  ]);
});

test("building house beach bungalow production run declares expected Layer C exports and metadata files", () => {
  const definition = moduleUnderTest.buildBuildingHouseBeachBungalowProductionRun();

  assert.deepEqual(definition.expectedOutputs.proofAsset, [
    "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_CLOSE.glb",
    "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_GAMEPLAY.glb",
    "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_MAP.glb",
  ]);
  assert.ok(
    definition.reusedModules.includes("MOD_WINDOW_RESIDENTIAL_STANDARD_001")
  );
  assert.ok(definition.reusedModules.includes("MOD_FLOWERBED_STANDARD_001"));
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "building-house-beach-bungalow-validation.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "BUILDING_HOUSE_BEACH_BUNGALOW_001_ASSEMBLY_TEST_v001.blend"
    )
  );
});
