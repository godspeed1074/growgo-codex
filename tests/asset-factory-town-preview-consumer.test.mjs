import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "town-preview-consumer.mjs")
);

const previewOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "TOWN_LAYOUT_001_PREVIEW_SCENE_001"
);

test("town preview consumer builds a Blender preview command", () => {
  const command = moduleUnderTest.buildTownPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_town_layout_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/TOWN_LAYOUT_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/TOWN_LAYOUT_001_PREVIEW_SCENE_001/
  );
});

test("town preview consumer metadata resolves the town preview scene", () => {
  const metadata = moduleUnderTest.createTownPreviewSceneMetadata();

  assert.equal(metadata.sceneId, "TOWN_LAYOUT_001_PREVIEW_SCENE_001");
  assert.equal(metadata.previewType, "procedural_town_visual_inspection");
  assert.equal(metadata.townLayer.districtCount, 3);
  assert.equal(metadata.townLayer.districtLotCountEstimate, 336);
  assert.equal(metadata.districtLayer.districtInstanceCount, 3);
  assert.equal(metadata.townCentreLayer.centreCount, 1);
  assert.equal(metadata.commercialLayer.zoneCount, 1);
  assert.equal(metadata.civicLayer.reserveCount, 4);
  assert.equal(metadata.transportLayer.corridorCount, 6);
  assert.equal(metadata.recreationLayer.recreationZoneCount, 4);
  assert.equal(metadata.landmarkLayer.landmarkReserveCount, 2);
  assert.equal(metadata.ruralTransitionLayer.ruralTransitionCount, 2);
  assert.equal(
    metadata.visualCaptureWorkflow.previewVersion,
    "SESSION_65_TOWN_PREVIEW_CONSUMER"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.topDown.cameraId,
    "TOP_DOWN_TOWN_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.angledTown25D.cameraId,
    "ANGLED_TOWN_2_5D_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.centreAndDistrictOverview.cameraId,
    "CENTRE_AND_DISTRICT_OVERVIEW_INSPECTION"
  );
  assert.equal(metadata.districtLayer.districtReferenceCatalog.length, 1);
  assert.equal(metadata.performanceProfile.districtInstanceReferencesOnly, true);
  assert.equal(metadata.performanceProfile.expectedTransportCorridors, 6);
  assert.equal(metadata.transportLayer.resolvedTransportCorridors[3].corridorType, "ARTERIAL_ROAD");
  assert.equal(metadata.commercialLayer.resolvedCommercialZones[0].commercialType, "COMMERCIAL_STRIP_001");
  for (const district of metadata.districtLayer.resolvedDistrictInstances) {
    assert.equal(district.previewSceneId, "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001");
    assert.equal(district.previewMode, "instance_reference_only");
    assert.ok(district.previewMetadataPath.endsWith("preview-scene-metadata.json"));
  }
});

test("town preview consumer validation passes against the deterministic town source", () => {
  const validation = moduleUnderTest.createTownPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.districtCount, 3);
  assert.equal(validation.summary.districtLotCount, 336);
  assert.equal(validation.summary.townCentreCount, 1);
  assert.equal(validation.summary.commercialZoneCount, 1);
  assert.equal(validation.summary.civicReserveCount, 4);
  assert.equal(validation.summary.transportCorridorCount, 6);
  assert.equal(validation.summary.recreationZoneCount, 4);
  assert.equal(validation.summary.landmarkReserveCount, 2);
  assert.equal(validation.checks.townBoundaryValid, "PASS");
  assert.equal(validation.checks.districtsPlaced, "PASS");
  assert.equal(validation.checks.zonesValid, "PASS");
  assert.equal(validation.checks.districtPreviewsResolve, "PASS");
  assert.equal(validation.checks.townCentreAccessible, "PASS");
  assert.equal(validation.checks.townCentreConnected, "PASS");
  assert.equal(validation.checks.commercialSensibleLocation, "PASS");
  assert.equal(validation.checks.civicAccessible, "PASS");
  assert.equal(validation.checks.transportConnectedHierarchy, "PASS");
  assert.equal(validation.checks.recreationValid, "PASS");
  assert.equal(validation.checks.landmarksValid, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
  assert.equal(validation.checks.referenceBasedPlacement, "PASS");
  assert.equal(validation.checks.noDuplicateGeometryGeneration, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
});

test("checked-in town preview artifacts match generated metadata and validation outputs", () => {
  const metadata = JSON.parse(
    fs.readFileSync(
      path.join(previewOutputDirectory, "preview-scene-metadata.json"),
      "utf8"
    )
  );
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(previewOutputDirectory, "preview-scene-manifest.json"),
      "utf8"
    )
  );
  const validation = JSON.parse(
    fs.readFileSync(
      path.join(
        previewOutputDirectory,
        "TOWN_LAYOUT_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const generatedMetadata = moduleUnderTest.createTownPreviewSceneMetadata();
  const generatedValidation = moduleUnderTest.createTownPreviewValidationReport();
  const generatedCommand = moduleUnderTest.buildTownPreviewBlenderCommand();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(validation, generatedValidation);
  assert.equal(manifest.blenderCommand, generatedCommand);
});
