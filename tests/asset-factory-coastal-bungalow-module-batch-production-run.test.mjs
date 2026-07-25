import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-bungalow-module-batch-production-run.mjs"
  )
);

test("coastal bungalow module batch production run validates approved module scope", () => {
  const result = moduleUnderTest.validateCoastalBungalowModuleBatchProductionRun();

  assert.equal(result.ok, true);
  assert.deepEqual(result.productionRun.definition.moduleIds, [
    "MOD_FOUNDATION_RAISED_COASTAL_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_DECK_TIMBER_COASTAL_001",
  ]);
});

test("coastal bungalow module batch production run declares expected LOD exports and metadata files", () => {
  const definition =
    moduleUnderTest.buildCoastalBungalowModuleBatchProductionRun();

  assert.equal(definition.expectedOutputs.moduleExports.length, 9);
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_FOUNDATION_RAISED_COASTAL_001_LOD_CLOSE.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_DECK_TIMBER_COASTAL_001_LOD_MAP.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "coastal-expansion-module-batch-1-registration.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "mod-window-residential-large-001-validation.json"
    )
  );
});
