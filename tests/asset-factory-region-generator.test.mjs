import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "region-generator.mjs")
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "REGION_LAYOUT_001_PREVIEW_001.json"
);

const validationJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "REGION_LAYOUT_001_VALIDATION_001.json"
);

test("same seed produces identical region output", () => {
  const first = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied region output", () => {
  const first = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateRegionLayoutPreview({
    ...moduleUnderTest.regionGeneratorDefaultInput,
    regionSeed: 20482
  });

  assert.notDeepEqual(first.regionId, second.regionId);
  assert.notDeepEqual(first.seedConfig, second.seedConfig);
  assert.notEqual(
    first.validationResult.deterministicSignatureHash,
    second.validationResult.deterministicSignatureHash
  );
  assert.equal(second.validationResult.validationPassed, true);
});

test("region generation creates a valid deterministic coastal region preview", () => {
  const preview = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );

  assert.equal(preview.schemaId, "REGION_LAYOUT_001");
  assert.equal(preview.regionProfile.profileId, "COASTAL_REGION");
  assert.equal(preview.regionBounds.boundaryStyle, "coastal_irregular_region_polygon");
  assert.equal(preview.naturalZones.length, 6);
  assert.equal(preview.settlements.length, 5);
  assert.equal(preview.transportCorridors.length, 6);
  assert.equal(preview.landmarkReserves.length, 5);
  assert.equal(preview.explorationRoutes.length, 6);
  assert.equal(preview.regionMetadata.referencePlacementMode, "instance_reference_only");
  assert.equal(preview.streamingGrid.strategy, "reference_only_region_chunking");
  assert.ok(
    preview.naturalZones.some((zone) => zone.zoneType === "COASTLINE")
  );
  assert.ok(
    preview.naturalZones.some((zone) => zone.zoneType === "PROTECTED_AREA")
  );
  assert.ok(
    preview.settlements.some(
      (settlement) => settlement.settlementType === "MAJOR_TOWN"
    )
  );
  assert.ok(
    preview.settlements.some(
      (settlement) => settlement.settlementType === "SMALL_COASTAL_TOWN"
    )
  );
  assert.ok(
    preview.transportCorridors.some(
      (corridor) => corridor.transportType === "COASTAL_ROUTE"
    )
  );
  assert.ok(
    preview.landmarkReserves.some(
      (landmark) => landmark.landmarkType === "LIGHTHOUSE"
    )
  );
  assert.ok(
    preview.explorationRoutes.some(
      (route) => route.routeType === "SCENIC_COASTAL_DRIVE"
    )
  );
  assert.equal(preview.validationResult.naturalZonesValid, true);
  assert.equal(preview.validationResult.settlementsValid, true);
  assert.equal(preview.validationResult.transportConnected, true);
  assert.equal(preview.validationResult.settlementHierarchyValid, true);
  assert.equal(preview.validationResult.terrainRelationshipsValid, true);
  assert.equal(preview.validationResult.corridorsConnected, true);
  assert.equal(preview.validationResult.landmarksAccessible, true);
  assert.equal(preview.validationResult.explorationRoutesValid, true);
  assert.equal(preview.validationResult.deterministicRebuildValid, true);
  assert.equal(preview.validationResult.streamingReadyStructure, true);
  assert.equal(preview.validationResult.instanceReferencesOnly, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("region validation output reports pass status for the deterministic coastal region", () => {
  const preview = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );
  const validation = moduleUnderTest.createRegionLayoutValidationOutput(preview);

  assert.equal(validation.validationId, "REGION_LAYOUT_001_VALIDATION_001");
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.regionProfileId, "COASTAL_REGION");
  assert.equal(validation.summary.settlementCount, 5);
  assert.equal(validation.summary.naturalZoneCount, 6);
  assert.equal(validation.summary.transportCorridorCount, 6);
  assert.equal(validation.summary.landmarkReserveCount, 5);
  assert.equal(validation.summary.explorationRouteCount, 6);
  assert.equal(validation.checks.naturalZonesValid, "PASS");
  assert.equal(validation.checks.settlementsValid, "PASS");
  assert.equal(validation.checks.transportConnected, "PASS");
  assert.equal(validation.checks.settlementHierarchyValid, "PASS");
  assert.equal(validation.checks.terrainRelationshipsValid, "PASS");
  assert.equal(validation.checks.corridorsConnected, "PASS");
  assert.equal(validation.checks.landmarksAccessible, "PASS");
  assert.equal(validation.checks.explorationRoutesValid, "PASS");
  assert.equal(validation.checks.deterministicRebuildValid, "PASS");
  assert.equal(validation.checks.streamingReadyStructure, "PASS");
  assert.equal(validation.checks.instanceReferencesOnly, "PASS");
});

test("checked-in region preview and validation outputs match generator output", () => {
  const generated = moduleUnderTest.generateRegionLayoutPreview(
    moduleUnderTest.regionGeneratorDefaultInput
  );
  const generatedValidation =
    moduleUnderTest.createRegionLayoutValidationOutput(generated);
  const persistedPreview = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));
  const persistedValidation = JSON.parse(
    fs.readFileSync(validationJsonPath, "utf8")
  );

  assert.deepEqual(persistedPreview, generated);
  assert.deepEqual(persistedValidation, generatedValidation);
});
