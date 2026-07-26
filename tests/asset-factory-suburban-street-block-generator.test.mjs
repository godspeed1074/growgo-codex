import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-street-block-generator.mjs"
  )
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json"
);

const validationJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json"
);

test("same seed produces identical suburban street block output", () => {
  const first = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied suburban street block output", () => {
  const first = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanStreetBlockPreview({
    ...moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput,
    streetBlockSeed: 30482
  });

  assert.notDeepEqual(first.lots, second.lots);
  assert.notDeepEqual(first.buildingPlacements, second.buildingPlacements);
  assert.notDeepEqual(first.streetFeaturePlacements, second.streetFeaturePlacements);
  assert.equal(second.validationResult.validationPassed, true);
});

test("24 lots are generated with a valid road graph and passing validation", () => {
  const preview = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );

  assert.equal(preview.lotCount, 24);
  assert.equal(preview.lots.length, 24);
  assert.equal(preview.roadNodes.length, 7);
  assert.equal(preview.roadSegments.length, 6);
  assert.equal(preview.intersections.length, 3);
  assert.equal(preview.roadGraph.connectedComponentCount, 1);
  assert.equal(
    preview.lots.filter((lot) => lot.frontageRoadSegmentId === "SEGMENT_004").length,
    4
  );
  assert.equal(
    preview.lots.filter((lot) => lot.frontageRoadSegmentId === "SEGMENT_005").length,
    4
  );
  assert.equal(
    preview.lots.filter((lot) => lot.frontageRoadSegmentId === "SEGMENT_006").length,
    4
  );
  assert.ok(preview.lots.some((lot) => lot.frontageDirection === "EAST"));
  assert.ok(preview.lots.some((lot) => lot.frontageDirection === "WEST"));
  assert.ok(
    preview.lots.some(
      (lot) => lot.streetContext === "cul_de_sac_residential_edge"
    )
  );
  assert.deepEqual(
    preview.lots.reduce((counts, lot) => {
      counts[lot.buildingId] = (counts[lot.buildingId] ?? 0) + 1;
      return counts;
    }, {}),
    {
      BUILDING_HOUSE_SUBURBAN_BRICK_001: 20,
      BUILDING_HOUSE_COASTAL_COTTAGE_001: 3,
      BUILDING_HOUSE_BEACH_BUNGALOW_001: 1
    }
  );
  assert.deepEqual(
    preview.lots.reduce((counts, lot) => {
      counts[lot.lotRole] = (counts[lot.lotRole] ?? 0) + 1;
      return counts;
    }, {}),
    {
      STANDARD_LOT: 6,
      CORNER_LOT: 13,
      FEATURE_LOT: 1,
      CUL_DE_SAC_LOT: 4
    }
  );
  for (const lot of preview.lots) {
    assert.ok(
      moduleUnderTest.supportedSuburbanStreetBlockBuildingAssets.includes(
        lot.buildingId
      )
    );
  }
  assert.equal(preview.validationResult.roadConnectivityValid, true);
  assert.equal(preview.validationResult.intersectionValidity, true);
  assert.equal(preview.validationResult.allLotsGenerated, true);
  assert.equal(preview.validationResult.lotBoundaryValidity, true);
  assert.equal(preview.validationResult.validBuildingIds, true);
  assert.equal(preview.validationResult.buildingPlacementValidity, true);
  assert.equal(preview.validationResult.drivewayConnectionValidity, true);
  assert.equal(preview.validationResult.frontageResolutionValidity, true);
  assert.equal(preview.validationResult.blockThemeBudgetValidity, true);
  assert.equal(preview.validationResult.lotRoleValidity, true);
  assert.equal(preview.validationResult.featureLotLimitValidity, true);
  assert.equal(preview.validationResult.suburbanWeightingValidity, true);
  assert.equal(preview.validationResult.adjacentVariationValidity, true);
  assert.equal(preview.validationResult.cornerLotRuleValidity, true);
  assert.equal(preview.validationResult.streetFeatureContainmentValidity, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("validation output reports pass status for the deterministic 24-lot block", () => {
  const preview = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );
  const validation =
    moduleUnderTest.createSuburbanStreetBlockValidationOutput(preview);

  assert.equal(
    validation.validationId,
    "SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001"
  );
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.lotCount, 24);
  assert.equal(validation.checks.roadConnectivityValid, "PASS");
  assert.equal(validation.checks.intersectionValidity, "PASS");
  assert.equal(validation.checks.allLotsGenerated, "PASS");
  assert.equal(validation.checks.validBuildingIds, "PASS");
  assert.equal(validation.checks.frontageResolutionValidity, "PASS");
  assert.equal(validation.checks.blockThemeBudgetValidity, "PASS");
  assert.equal(validation.checks.lotRoleValidity, "PASS");
  assert.equal(validation.checks.featureLotLimitValidity, "PASS");
  assert.equal(validation.checks.suburbanWeightingValidity, "PASS");
  assert.equal(validation.checks.adjacentVariationValidity, "PASS");
  assert.equal(validation.checks.cornerLotRuleValidity, "PASS");
  assert.equal(validation.checks.deterministicRebuildValidity, "PASS");
});

test("checked-in street block preview and validation outputs match generator output", () => {
  const generated = moduleUnderTest.generateSuburbanStreetBlockPreview(
    moduleUnderTest.suburbanStreetBlockGeneratorDefaultInput
  );
  const generatedValidation =
    moduleUnderTest.createSuburbanStreetBlockValidationOutput(generated);
  const persistedPreview = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));
  const persistedValidation = JSON.parse(
    fs.readFileSync(validationJsonPath, "utf8")
  );

  assert.deepEqual(persistedPreview, generated);
  assert.deepEqual(persistedValidation, generatedValidation);
});
