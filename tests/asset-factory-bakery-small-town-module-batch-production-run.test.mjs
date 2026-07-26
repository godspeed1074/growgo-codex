import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "bakery-small-town-module-batch-production-run.mjs"
  )
);

test("bakery small town module batch production run validates approved export scope", () => {
  const result = moduleUnderTest.validateBakerySmallTownModuleBatchProductionRun();

  assert.equal(result.ok, true);
  assert.deepEqual(result.productionRun.definition.moduleIds, [
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001",
  ]);
});

test("bakery small town module batch production run declares expected LOD exports and metadata files", () => {
  const definition = moduleUnderTest.buildBakerySmallTownModuleBatchProductionRun();

  assert.equal(definition.expectedOutputs.moduleExports.length, 12);
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_CLOSE.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_BAKERY_ROOFTOP_ICON_001_LOD_MAP.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "bakery-small-town-module-batch-1-registration.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "mod-bakery-counter-frontage-001-validation.json"
    )
  );
});
