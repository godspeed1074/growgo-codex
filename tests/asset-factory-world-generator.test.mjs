import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "world-generator.mjs")
);

const previewJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "WORLD_LAYOUT_001_PREVIEW_001.json"
);

const validationJsonPath = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "WORLD_LAYOUT_001_VALIDATION_001.json"
);

test("same seed produces identical world output", () => {
  const first = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationResult.validationPassed, true);
});

test("different seed produces deterministic but varied world output", () => {
  const first = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );
  const second = moduleUnderTest.generateWorldLayoutPreview({
    ...moduleUnderTest.worldGeneratorDefaultInput,
    worldSeed: 20482
  });

  assert.notDeepEqual(first.worldId, second.worldId);
  assert.notDeepEqual(first.seedConfig, second.seedConfig);
  assert.notEqual(
    first.validationResult.deterministicSignatureHash,
    second.validationResult.deterministicSignatureHash
  );
  assert.equal(second.validationResult.validationPassed, true);
});

test("world generation creates a valid deterministic connected world preview", () => {
  const preview = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );

  assert.equal(preview.schemaId, "WORLD_LAYOUT_001");
  assert.equal(preview.worldProfile.profileId, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(preview.worldGeographyZones.length, 8);
  assert.equal(preview.regionInstances.length, 5);
  assert.equal(preview.worldConnections.length, 6);
  assert.equal(preview.worldLandmarkReserves.length, 5);
  assert.equal(preview.worldExplorationRoutes.length, 6);
  assert.equal(preview.streamingChunks.length, 4);
  assert.equal(preview.worldMetadata.referencePlacementMode, "instance_reference_only");
  assert.ok(
    preview.worldGeographyZones.some((zone) => zone.zoneType === "OCEAN")
  );
  assert.ok(
    preview.worldGeographyZones.some((zone) => zone.zoneType === "MOUNTAINS")
  );
  assert.ok(
    preview.regionInstances.some((region) => region.profile === "COASTAL_REGION")
  );
  assert.ok(
    preview.regionInstances.some((region) => region.profile === "TOURISM_REGION")
  );
  assert.ok(
    preview.worldConnections.some(
      (corridor) => corridor.connectionType === "COASTAL_ROUTE"
    )
  );
  assert.ok(
    preview.worldConnections.some(
      (corridor) => corridor.connectionType === "FERRY_ROUTE"
    )
  );
  assert.ok(
    preview.worldLandmarkReserves.some(
      (landmark) => landmark.landmarkType === "ICONIC_LOCATION"
    )
  );
  assert.ok(
    preview.worldExplorationRoutes.some(
      (route) => route.routeType === "COASTAL_GRAND_TOUR"
    )
  );
  assert.ok(
    preview.streamingChunks.every((chunk) => chunk.instanceReferencesOnly === true)
  );
  assert.equal(preview.validationResult.geographyValid, true);
  assert.equal(preview.validationResult.regionsValid, true);
  assert.equal(preview.validationResult.transitionsValid, true);
  assert.equal(preview.validationResult.corridorsConnected, true);
  assert.equal(preview.validationResult.routesReachable, true);
  assert.equal(preview.validationResult.landmarksAccessible, true);
  assert.equal(preview.validationResult.chunksValid, true);
  assert.equal(preview.validationResult.boundariesConsistent, true);
  assert.equal(preview.validationResult.deterministicRebuildValid, true);
  assert.equal(preview.validationResult.referenceBasedStructure, true);
  assert.equal(preview.validationResult.streamingReady, true);
  assert.equal(preview.validationResult.noDuplicateGeometryGeneration, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("world validation output reports pass status for the deterministic connected world", () => {
  const preview = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );
  const validation = moduleUnderTest.createWorldLayoutValidationOutput(preview);

  assert.equal(validation.validationId, "WORLD_LAYOUT_001_VALIDATION_001");
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.worldProfileId, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(validation.summary.geographyZoneCount, 8);
  assert.equal(validation.summary.regionCount, 5);
  assert.equal(validation.summary.connectionCount, 6);
  assert.equal(validation.summary.landmarkReserveCount, 5);
  assert.equal(validation.summary.explorationRouteCount, 6);
  assert.equal(validation.summary.streamingChunkCount, 4);
  assert.equal(validation.checks.geographyValid, "PASS");
  assert.equal(validation.checks.regionsValid, "PASS");
  assert.equal(validation.checks.transitionsValid, "PASS");
  assert.equal(validation.checks.corridorsConnected, "PASS");
  assert.equal(validation.checks.routesReachable, "PASS");
  assert.equal(validation.checks.landmarksAccessible, "PASS");
  assert.equal(validation.checks.chunksValid, "PASS");
  assert.equal(validation.checks.boundariesConsistent, "PASS");
  assert.equal(validation.checks.deterministicRebuildValid, "PASS");
  assert.equal(validation.checks.referenceBasedStructure, "PASS");
  assert.equal(validation.checks.streamingReady, "PASS");
  assert.equal(validation.checks.noDuplicateGeometryGeneration, "PASS");
});

test("checked-in world preview and validation outputs match generator output", () => {
  const generated = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );
  const generatedValidation =
    moduleUnderTest.createWorldLayoutValidationOutput(generated);
  const persistedPreview = JSON.parse(fs.readFileSync(previewJsonPath, "utf8"));
  const persistedValidation = JSON.parse(
    fs.readFileSync(validationJsonPath, "utf8")
  );

  assert.deepEqual(persistedPreview, generated);
  assert.deepEqual(persistedValidation, generatedValidation);
});
