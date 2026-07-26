import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-brick-house-module-batch-production-run.mjs"
  )
);

test("suburban brick house module batch production run validates approved export scope", () => {
  const result =
    moduleUnderTest.validateSuburbanBrickHouseModuleBatchProductionRun();

  assert.equal(result.ok, true);
  assert.deepEqual(result.productionRun.definition.moduleIds, [
    "MOD_WALL_BRICK_SUBURBAN_001",
    "MOD_ROOF_TILE_STANDARD_001",
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_LETTERBOX_STANDARD_001",
    "MOD_ENTRY_PATH_SUBURBAN_001",
  ]);
});

test("suburban brick house module batch production run declares expected LOD exports and metadata files", () => {
  const definition =
    moduleUnderTest.buildSuburbanBrickHouseModuleBatchProductionRun();

  assert.equal(definition.expectedOutputs.moduleExports.length, 18);
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_WALL_BRICK_SUBURBAN_001_LOD_CLOSE.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_ENTRY_PATH_SUBURBAN_001_LOD_MAP.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "suburban-brick-house-module-batch-1-registration.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "mod-garage-residential-standard-001-validation.json"
    )
  );
});
