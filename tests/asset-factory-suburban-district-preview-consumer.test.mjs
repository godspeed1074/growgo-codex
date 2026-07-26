import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-district-preview-consumer.mjs"
  )
);

const previewOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001"
);

test("suburban district preview consumer builds a Blender preview command", () => {
  const command = moduleUnderTest.buildSuburbanDistrictPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_suburban_district_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/SUBURBAN_DISTRICT_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/
  );
});

test("suburban district preview consumer metadata resolves the district preview scene", () => {
  const metadata = moduleUnderTest.createSuburbanDistrictPreviewSceneMetadata();

  assert.equal(metadata.sceneId, "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001");
  assert.equal(metadata.previewType, "suburban_district_visual_inspection");
  assert.equal(metadata.districtLayer.blockCount, 4);
  assert.equal(metadata.districtLayer.lotCountEstimate, 108);
  assert.equal(metadata.blockLayer.blockInstanceCount, 4);
  assert.equal(metadata.roadConnectorLayer.connectorCount, 5);
  assert.equal(metadata.landUseLayer.zoneCount, 8);
  assert.equal(metadata.openSpaceLayer.openSpaceCount, 3);
  assert.equal(metadata.destinationReserveLayer.reserveCount, 3);
  assert.equal(
    metadata.visualCaptureWorkflow.previewVersion,
    "SESSION_58_DISTRICT_PREVIEW_CONSUMER"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.topDown.cameraId,
    "TOP_DOWN_DISTRICT_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.angled25D.cameraId,
    "ANGLED_DISTRICT_2_5D_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.streetBlockOverview.cameraId,
    "STREET_BLOCK_OVERVIEW_INSPECTION"
  );
  assert.equal(metadata.blockLayer.blockReferenceCatalog.length, 1);
  assert.equal(metadata.performanceProfile.blockInstanceReferencesOnly, true);
  assert.equal(
    metadata.performanceProfile.expectedConnectorInstances,
    5
  );
  for (const block of metadata.blockLayer.resolvedBlockInstances) {
    assert.equal(block.previewSceneId, "SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001");
    assert.equal(block.previewMode, "instance_reference_only");
    assert.ok(block.previewMetadataPath.endsWith("preview-scene-metadata.json"));
  }
});

test("suburban district preview consumer validation passes against the deterministic district source", () => {
  const validation = moduleUnderTest.createSuburbanDistrictPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.blockCount, 4);
  assert.equal(validation.summary.lotCount, 108);
  assert.equal(validation.summary.roadConnectorCount, 5);
  assert.equal(validation.summary.zoneCount, 8);
  assert.equal(validation.summary.openSpaceCount, 3);
  assert.equal(validation.summary.destinationReserveCount, 3);
  assert.equal(validation.checks.blocksInsideBoundary, "PASS");
  assert.equal(validation.checks.streetBlocksResolve, "PASS");
  assert.equal(validation.checks.blocksDoNotOverlap, "PASS");
  assert.equal(validation.checks.roadsConnected, "PASS");
  assert.equal(validation.checks.zonesValid, "PASS");
  assert.equal(validation.checks.openSpaceConnected, "PASS");
  assert.equal(validation.checks.destinationReservesValid, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
  assert.equal(validation.checks.instanceReferenceModeValid, "PASS");
});

test("checked-in district preview artifacts match generated metadata and validation outputs", () => {
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
        "SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const generatedMetadata = moduleUnderTest.createSuburbanDistrictPreviewSceneMetadata();
  const generatedValidation =
    moduleUnderTest.createSuburbanDistrictPreviewValidationReport();
  const generatedCommand =
    moduleUnderTest.buildSuburbanDistrictPreviewBlenderCommand();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(validation, generatedValidation);
  assert.equal(manifest.blenderCommand, generatedCommand);
});
