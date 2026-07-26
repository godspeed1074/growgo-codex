import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-district-generator.mjs"
  )
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_DISTRICT_001_PREVIEW_001.json"
);

const validationJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_DISTRICT_001_VALIDATION_001.json"
);

test("same seed produces identical suburban district output", () => {
  const first = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied suburban district output", () => {
  const first = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanDistrictPreview({
    ...moduleUnderTest.suburbanDistrictGeneratorDefaultInput,
    districtSeed: 20482
  });

  assert.notDeepEqual(first.blockPlacements, second.blockPlacements);
  assert.notDeepEqual(first.seedConfig, second.seedConfig);
  assert.notDeepEqual(first.lotCount, second.lotCount);
  assert.notDeepEqual(first.validationResult.deterministicSignatureHash, second.validationResult.deterministicSignatureHash);
  assert.equal(second.validationResult.validationPassed, true);
});

test("district generation creates a valid 4-block connected suburban district", () => {
  const preview = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );

  assert.equal(preview.blockPlacements.length, 4);
  assert.equal(preview.lotCount, 108);
  assert.equal(preview.roadConnectors.length, 5);
  assert.equal(preview.landUseZones.length, 8);
  assert.equal(preview.openSpacePlacements.length, 3);
  assert.equal(preview.destinationReserves.length, 3);
  assert.equal(preview.seamTreatment.seamId, "DISTRICT_SEAM_001");
  assert.equal(preview.pedestrianNetwork.length, 5);
  assert.equal(preview.roadConnectors[0].start.x, -22);
  assert.equal(preview.roadConnectors[0].end.x, 22);
  assert.ok(
    preview.landUseZones.some((zone) => zone.zoneType === "RESIDENTIAL_LOW_DENSITY")
  );
  assert.ok(preview.landUseZones.some((zone) => zone.zoneType === "OPEN_SPACE"));
  assert.ok(preview.landUseZones.some((zone) => zone.zoneType === "PARK_RESERVE"));
  assert.ok(preview.landUseZones.some((zone) => zone.zoneType === "COMMUNITY_ZONE"));
  assert.ok(
    preview.landUseZones.some((zone) => zone.zoneType === "COMMERCIAL_EDGE_ZONE")
  );
  assert.ok(
    preview.roadConnectors.some(
      (connector) => connector.hierarchy === "collector_connection"
    )
  );
  assert.ok(
    preview.roadConnectors.some(
      (connector) => connector.hierarchy === "future_arterial_connection"
    )
  );
  assert.equal(preview.validationResult.blocksInsideBoundary, true);
  assert.equal(preview.validationResult.blocksDoNotOverlap, true);
  assert.equal(preview.validationResult.roadsConnected, true);
  assert.equal(preview.validationResult.roadHierarchyValid, true);
  assert.equal(preview.validationResult.landUseDistributionValid, true);
  assert.equal(preview.validationResult.openSpaceValid, true);
  assert.equal(preview.validationResult.destinationReservesValid, true);
  assert.equal(preview.validationResult.seamTreatmentValid, true);
  assert.equal(preview.validationResult.pedestrianConnectivityValid, true);
  assert.equal(preview.validationResult.greenCorridorConnectivityValid, true);
  assert.equal(preview.validationResult.destinationAccessibilityValid, true);
  assert.equal(preview.validationResult.previewLayerCompletenessValid, true);
  assert.equal(preview.validationResult.streamingBoundariesValid, true);
  assert.equal(preview.validationResult.instanceReuseStrategyValid, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("district validation output reports pass status for the deterministic suburban district", () => {
  const preview = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );
  const validation = moduleUnderTest.createSuburbanDistrictValidationOutput(
    preview
  );

  assert.equal(
    validation.validationId,
    "SUBURBAN_DISTRICT_001_VALIDATION_001"
  );
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.blockCount, 4);
  assert.equal(validation.summary.lotCount, 108);
  assert.equal(validation.checks.blocksInsideBoundary, "PASS");
  assert.equal(validation.checks.blocksDoNotOverlap, "PASS");
  assert.equal(validation.checks.roadsConnected, "PASS");
  assert.equal(validation.checks.roadHierarchyValid, "PASS");
  assert.equal(validation.checks.landUseDistributionValid, "PASS");
  assert.equal(validation.checks.openSpaceValid, "PASS");
  assert.equal(validation.checks.destinationReservesValid, "PASS");
  assert.equal(validation.checks.seamTreatmentValid, "PASS");
  assert.equal(validation.checks.pedestrianConnectivityValid, "PASS");
  assert.equal(validation.checks.greenCorridorConnectivityValid, "PASS");
  assert.equal(validation.checks.destinationAccessibilityValid, "PASS");
  assert.equal(validation.checks.previewLayerCompletenessValid, "PASS");
  assert.equal(validation.checks.deterministicRebuildValid, "PASS");
  assert.equal(validation.checks.streamingBoundariesValid, "PASS");
  assert.equal(validation.checks.instanceReuseStrategyValid, "PASS");
});

test("checked-in district preview and validation outputs match generator output", () => {
  const generated = moduleUnderTest.generateSuburbanDistrictPreview(
    moduleUnderTest.suburbanDistrictGeneratorDefaultInput
  );
  const generatedValidation =
    moduleUnderTest.createSuburbanDistrictValidationOutput(generated);
  const persistedPreview = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));
  const persistedValidation = JSON.parse(
    fs.readFileSync(validationJsonPath, "utf8")
  );

  assert.deepEqual(persistedPreview, generated);
  assert.deepEqual(persistedValidation, generatedValidation);
});
