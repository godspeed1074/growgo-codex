import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-neighbourhood-preview-generator.mjs"
  )
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json"
);

test("same seed produces identical suburban neighbourhood preview output", () => {
  const first = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied neighbourhood output", () => {
  const first = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateSuburbanNeighbourhoodPreview({
    ...moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput,
    neighbourhoodSeed: 20482
  });

  assert.notDeepEqual(first.lots, second.lots);
  assert.notDeepEqual(first.buildingPlacements, second.buildingPlacements);
  assert.equal(second.validationResult.validationPassed, true);
});

test("six lots are generated with valid building ids and passing validation", () => {
  const preview = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );

  assert.equal(preview.lotCount, 6);
  assert.equal(preview.lots.length, 6);
  for (const lot of preview.lots) {
    assert.ok(
      moduleUnderTest.supportedSuburbanNeighbourhoodBuildingAssets.includes(
        lot.buildingId
      )
    );
  }
  assert.equal(preview.validationResult.validBuildingIds, true);
  assert.equal(preview.validationResult.validRotations, true);
  assert.equal(preview.validationResult.drivewayAssignments, true);
  assert.equal(preview.validationResult.fenceAssignments, true);
  assert.equal(preview.validationResult.fenceOpeningsValid, true);
  assert.equal(preview.validationResult.landscapeContainment, true);
  assert.equal(preview.validationResult.themeWeightingValid, true);
  assert.deepEqual(preview.themeProfile.buildingWeights, {
    BUILDING_HOUSE_SUBURBAN_BRICK_001: 0.7,
    BUILDING_HOUSE_COASTAL_COTTAGE_001: 0.25,
    BUILDING_HOUSE_BEACH_BUNGALOW_001: 0.05
  });
  for (const lot of preview.lots) {
    const expectedDrivewayX =
      lot.drivewaySide === "EAST" ? lot.position.x + lot.width - 2.2 : lot.position.x + 2.2;
    assert.equal(lot.drivewaySocket.x, expectedDrivewayX);
  }
});

test("coastal estates theme profile resolves deterministically with coastal weighting", () => {
  const preview = moduleUnderTest.generateSuburbanNeighbourhoodPreview({
    ...moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput,
    neighbourhoodSeed: 30482,
    themeSeed: "COASTAL_ESTATES"
  });

  assert.deepEqual(preview.themeProfile.buildingWeights, {
    BUILDING_HOUSE_SUBURBAN_BRICK_001: 0.2,
    BUILDING_HOUSE_COASTAL_COTTAGE_001: 0.5,
    BUILDING_HOUSE_BEACH_BUNGALOW_001: 0.3
  });
  assert.equal(preview.validationResult.themeWeightingValid, true);
});

test("validator rejects invalid duplicate adjacent building rows safely", () => {
  const preview = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );
  const invalidLots = preview.lots.map((lot, index) =>
    index === 1 ? { ...lot, buildingId: preview.lots[0].buildingId } : lot
  );
  const invalidPreview = {
    ...preview,
    lots: invalidLots,
    validationResult: {
      ...preview.validationResult,
      noDuplicateInvalidPlacement: false,
      validationPassed: false
    }
  };

  const result = moduleUnderTest.validateSuburbanNeighbourhoodPreview(
    invalidPreview
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "adjacent_duplicate_violation");
});

test("checked-in preview json matches generator output for the default six-lot preview", () => {
  const generated = moduleUnderTest.generateSuburbanNeighbourhoodPreview(
    moduleUnderTest.suburbanNeighbourhoodPreviewGeneratorDefaultInput
  );
  const persisted = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));

  assert.deepEqual(persisted, generated);
});
