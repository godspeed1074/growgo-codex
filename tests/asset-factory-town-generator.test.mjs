import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "town-generator.mjs")
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "TOWN_LAYOUT_001_PREVIEW_001.json"
);

const validationJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "TOWN_LAYOUT_001_VALIDATION_001.json"
);

test("same seed produces identical town output", () => {
  const first = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied town output", () => {
  const first = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateTownLayoutPreview({
    ...moduleUnderTest.townGeneratorDefaultInput,
    townSeed: 20482
  });

  assert.notDeepEqual(first.districtPlacements, second.districtPlacements);
  assert.notDeepEqual(first.seedConfig, second.seedConfig);
  assert.notEqual(
    first.validationResult.deterministicSignatureHash,
    second.validationResult.deterministicSignatureHash
  );
  assert.equal(second.validationResult.validationPassed, true);
});

test("town generation creates a valid deterministic coastal town preview", () => {
  const preview = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );

  assert.equal(preview.schemaId, "TOWN_LAYOUT_001");
  assert.equal(preview.townThemeProfile.themeSeed, "SMALL_COASTAL_TOWN");
  assert.equal(preview.coastalIdentityProfile.profileId, "COASTAL_TOWN_PROFILE");
  assert.equal(preview.townBounds.boundaryShape, "coastal_irregular_polygon");
  assert.equal(preview.townBounds.boundaryPolygon.length, 10);
  assert.equal(preview.districtPlacements.length, 3);
  assert.equal(preview.townMetadata.districtLotCount, 337);
  assert.equal(preview.townCentreZones.length, 1);
  assert.equal(preview.commercialZones.length, 2);
  assert.equal(preview.civicReserves.length, 4);
  assert.equal(preview.transportCorridors.length, 6);
  assert.equal(preview.recreationZones.length, 5);
  assert.equal(preview.landmarkReserves.length, 3);
  assert.equal(preview.townTransitionZones.length, 5);
  assert.ok(
    preview.districtPlacements.some(
      (district) => district.districtType === "COASTAL_RESIDENTIAL_DISTRICT"
    )
  );
  assert.ok(
    preview.districtPlacements.some(
      (district) => district.districtType === "TOURISM_DISTRICT"
    )
  );
  assert.ok(
    preview.commercialZones.some(
      (zone) => zone.commercialType === "COASTAL_TOURISM_RETAIL"
    )
  );
  assert.ok(
    preview.recreationZones.some(
      (zone) => zone.recreationType === "WATERFRONT_RECREATION_ZONE"
    )
  );
  assert.ok(
    preview.districtPlacements.every(
      (district) => district.sourceDistrictSchemaId === "SUBURBAN_DISTRICT_001"
    )
  );
  assert.equal(preview.validationResult.districtsInsideBoundary, true);
  assert.equal(preview.validationResult.districtOverlapFree, true);
  assert.equal(preview.validationResult.roadsConnected, true);
  assert.equal(preview.validationResult.zonesValid, true);
  assert.equal(preview.validationResult.townCentreAccessible, true);
  assert.equal(preview.validationResult.townCentreTransportConnected, true);
  assert.equal(preview.validationResult.townCentreResidentialConnected, true);
  assert.equal(preview.validationResult.commercialPlacementValid, true);
  assert.equal(preview.validationResult.commercialPedestrianConnected, true);
  assert.equal(preview.validationResult.civicAccessible, true);
  assert.equal(preview.validationResult.civicRoadRelationshipValid, true);
  assert.equal(preview.validationResult.recreationConnected, true);
  assert.equal(preview.validationResult.landmarksValid, true);
  assert.equal(preview.validationResult.serviceEdgesValid, true);
  assert.equal(preview.validationResult.ruralTransitionsValid, true);
  assert.equal(preview.validationResult.coastalIdentityScore, 100);
  assert.equal(preview.validationResult.coastalIdentityScoreValid, true);
  assert.equal(preview.validationResult.boundaryNaturalnessValid, true);
  assert.equal(preview.validationResult.ruralTransitionValidity, true);
  assert.equal(preview.validationResult.waterfrontRelationshipValid, true);
  assert.equal(preview.validationResult.tourismZoneValidity, true);
  assert.equal(preview.validationResult.streamingBoundariesValid, true);
  assert.equal(preview.validationResult.instanceReuseStrategyValid, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("town validation output reports pass status for the deterministic town preview", () => {
  const preview = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );
  const validation = moduleUnderTest.createTownLayoutValidationOutput(preview);

  assert.equal(validation.validationId, "TOWN_LAYOUT_001_VALIDATION_001");
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.districtCount, 3);
  assert.equal(validation.summary.districtLotCount, 337);
  assert.equal(validation.summary.townCentreCount, 1);
  assert.equal(validation.summary.commercialZoneCount, 2);
  assert.equal(validation.summary.civicReserveCount, 4);
  assert.equal(validation.summary.transportCorridorCount, 6);
  assert.equal(validation.summary.recreationZoneCount, 5);
  assert.equal(validation.summary.landmarkReserveCount, 3);
  assert.equal(validation.summary.transitionZoneCount, 5);
  assert.equal(validation.summary.coastalIdentityScore, 100);
  assert.equal(validation.checks.districtsInsideBoundary, "PASS");
  assert.equal(validation.checks.districtOverlapFree, "PASS");
  assert.equal(validation.checks.roadsConnected, "PASS");
  assert.equal(validation.checks.zonesValid, "PASS");
  assert.equal(validation.checks.townCentreAccessible, "PASS");
  assert.equal(validation.checks.townCentreTransportConnected, "PASS");
  assert.equal(validation.checks.townCentreResidentialConnected, "PASS");
  assert.equal(validation.checks.commercialPlacementValid, "PASS");
  assert.equal(validation.checks.commercialPedestrianConnected, "PASS");
  assert.equal(validation.checks.civicAccessible, "PASS");
  assert.equal(validation.checks.civicRoadRelationshipValid, "PASS");
  assert.equal(validation.checks.recreationConnected, "PASS");
  assert.equal(validation.checks.landmarksValid, "PASS");
  assert.equal(validation.checks.serviceEdgesValid, "PASS");
  assert.equal(validation.checks.ruralTransitionsValid, "PASS");
  assert.equal(validation.checks.coastalIdentityScoreValid, "PASS");
  assert.equal(validation.checks.boundaryNaturalnessValid, "PASS");
  assert.equal(validation.checks.waterfrontRelationshipValid, "PASS");
  assert.equal(validation.checks.tourismZoneValidity, "PASS");
  assert.equal(validation.checks.deterministicRebuildValid, "PASS");
  assert.equal(validation.checks.streamingBoundariesValid, "PASS");
  assert.equal(validation.checks.instanceReuseStrategyValid, "PASS");
});

test("checked-in town preview and validation outputs match generator output", () => {
  const generated = moduleUnderTest.generateTownLayoutPreview(
    moduleUnderTest.townGeneratorDefaultInput
  );
  const generatedValidation =
    moduleUnderTest.createTownLayoutValidationOutput(generated);
  const persistedPreview = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));
  const persistedValidation = JSON.parse(
    fs.readFileSync(validationJsonPath, "utf8")
  );

  assert.deepEqual(persistedPreview, generated);
  assert.deepEqual(persistedValidation, generatedValidation);
});
