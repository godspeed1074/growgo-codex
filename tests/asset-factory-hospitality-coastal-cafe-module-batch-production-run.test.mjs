import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "hospitality-coastal-cafe-module-batch-production-run.mjs"
  )
);

test("hospitality coastal cafe module batch production run validates approved export scope", () => {
  const result =
    moduleUnderTest.validateHospitalityCoastalCafeModuleBatchProductionRun();

  assert.equal(result.ok, true);
  assert.deepEqual(result.productionRun.definition.moduleIds, [
    "MOD_AWNING_COASTAL_CAFE_001",
    "MOD_CAFE_SIGN_STANDARD_001",
    "MOD_SERVICE_WINDOW_CAFE_001",
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
  ]);
});

test("hospitality coastal cafe module batch production run declares expected LOD exports and metadata files", () => {
  const definition =
    moduleUnderTest.buildHospitalityCoastalCafeModuleBatchProductionRun();

  assert.equal(definition.expectedOutputs.moduleExports.length, 12);
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_AWNING_COASTAL_CAFE_001_LOD_CLOSE.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.moduleExports.includes(
      "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001_LOD_MAP.glb"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "hospitality-coastal-cafe-module-batch-1-registration.json"
    )
  );
  assert.ok(
    definition.expectedOutputs.metadataFiles.includes(
      "mod-service-window-cafe-001-validation.json"
    )
  );
});
