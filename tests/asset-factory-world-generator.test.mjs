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

const expectedProfiles = [
  "AUSTRALIAN_COASTAL_WORLD",
  "AUSTRALIAN_OUTBACK_WORLD",
  "ALPINE_WORLD",
  "TOURISM_ARCHIPELAGO_WORLD",
  "METROPOLITAN_EXPANSION_WORLD"
];

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

test("world generation creates a valid composition-aware coastal preview", () => {
  const preview = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );

  assert.equal(preview.schemaId, "WORLD_LAYOUT_001");
  assert.equal(preview.worldProfile.profileId, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(preview.worldScaleProfile.scaleId, "SMALL_WORLD");
  assert.equal(preview.worldGeographyZones.length, 8);
  assert.ok(preview.regionInstances.length >= 5);
  assert.ok(preview.worldConnections.length >= preview.regionInstances.length);
  assert.ok(preview.worldLandmarkReserves.length >= 4);
  assert.ok(preview.worldExplorationRoutes.length >= 5);
  assert.equal(
    preview.streamingChunks.length,
    preview.worldScaleProfile.chunkRequirements.minimumChunkCount
  );
  assert.equal(preview.worldMetadata.referencePlacementMode, "instance_reference_only");
  assert.equal(preview.worldMetadata.scaleProfile, "SMALL_WORLD");
  assert.equal(preview.worldMetadata.transportIntensity, "MEDIUM_HIGH");
  assert.equal(preview.worldMetadata.landmarkDensity, "HIGH");
  assert.equal(preview.worldMetadata.explorationDensity, "HIGH_EXPLORATION");
  assert.ok(preview.worldMetadata.identityScore >= 0.72);
  assert.ok(preview.worldGeographyZones.some((zone) => zone.zoneType === "OCEAN"));
  assert.ok(preview.worldGeographyZones.some((zone) => zone.zoneType === "MOUNTAINS"));
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
    preview.worldLandmarkReserves.some(
      (landmark) => landmark.landmarkType === "ICONIC_LOCATION"
    )
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
  assert.equal(preview.validationResult.profileAppliedCorrectly, true);
  assert.equal(preview.validationResult.identityScoreAligned, true);
  assert.equal(preview.validationResult.requiredSystemsGenerated, true);
  assert.equal(preview.validationResult.streamingRequirementsValid, true);
  assert.equal(preview.validationResult.validationPassed, true);
});

test("expanded world profiles generate distinct valid outputs", () => {
  const previews = expectedProfiles.map((worldProfile) =>
    moduleUnderTest.generateWorldLayoutPreview({
      ...moduleUnderTest.worldGeneratorDefaultInput,
      worldProfile
    })
  );

  const profileIds = previews.map((preview) => preview.worldProfile.profileId);
  const scaleProfiles = new Set(
    previews.map((preview) => preview.worldScaleProfile.scaleId)
  );
  const signatureHashes = new Set(
    previews.map((preview) => preview.validationResult.deterministicSignatureHash)
  );
  const regionCounts = new Map(
    previews.map((preview) => [
      preview.worldProfile.profileId,
      preview.regionInstances.length
    ])
  );

  assert.deepEqual(profileIds, expectedProfiles);
  assert.equal(scaleProfiles.has("SMALL_WORLD"), true);
  assert.equal(scaleProfiles.has("MEDIUM_WORLD"), true);
  assert.equal(scaleProfiles.has("LARGE_WORLD"), true);
  assert.equal(signatureHashes.size, expectedProfiles.length);
  assert.equal(regionCounts.get("AUSTRALIAN_COASTAL_WORLD") >= 5, true);
  assert.equal(regionCounts.get("AUSTRALIAN_OUTBACK_WORLD") >= 8, true);
  assert.equal(regionCounts.get("ALPINE_WORLD") >= 8, true);
  assert.equal(regionCounts.get("TOURISM_ARCHIPELAGO_WORLD") >= 8, true);
  assert.equal(regionCounts.get("METROPOLITAN_EXPANSION_WORLD") >= 12, true);

  previews.forEach((preview) => {
    assert.equal(preview.validationResult.validationPassed, true);
    assert.equal(preview.validationResult.profileAppliedCorrectly, true);
    assert.equal(preview.validationResult.identityScoreAligned, true);
  });
});

test("world composition comparison output covers all requested profiles", () => {
  const comparison = moduleUnderTest.generateWorldCompositionProfileComparison(10482);

  assert.equal(comparison.length, expectedProfiles.length);
  assert.deepEqual(
    comparison.map((entry) => entry.profileId),
    expectedProfiles
  );
  assert.ok(
    comparison.every((entry) =>
      typeof entry.scaleProfile === "string" &&
      typeof entry.transportIntensity === "string" &&
      typeof entry.landmarkDensity === "string" &&
      typeof entry.explorationDensity === "string" &&
      entry.validationPassed === true
    )
  );
});

test("world validation output reports pass status for the composition-aware coastal world", () => {
  const preview = moduleUnderTest.generateWorldLayoutPreview(
    moduleUnderTest.worldGeneratorDefaultInput
  );
  const validation = moduleUnderTest.createWorldLayoutValidationOutput(preview);

  assert.equal(validation.validationId, "WORLD_LAYOUT_001_VALIDATION_001");
  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.worldProfileId, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(validation.summary.scaleProfileId, "SMALL_WORLD");
  assert.equal(validation.summary.geographyZoneCount, 8);
  assert.ok(validation.summary.regionCount >= 5);
  assert.ok(validation.summary.connectionCount >= validation.summary.regionCount);
  assert.ok(validation.summary.landmarkReserveCount >= 4);
  assert.ok(validation.summary.explorationRouteCount >= 5);
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
  assert.equal(validation.checks.profileAppliedCorrectly, "PASS");
  assert.equal(validation.checks.identityScoreAligned, "PASS");
  assert.equal(validation.checks.requiredSystemsGenerated, "PASS");
  assert.equal(validation.checks.streamingRequirementsValid, "PASS");
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
