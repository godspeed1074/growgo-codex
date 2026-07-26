import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-street-block-preview-consumer.mjs"
  )
);

const previewOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001"
);

test("suburban street block preview consumer builds a Blender preview command", () => {
  const command = moduleUnderTest.buildSuburbanStreetBlockPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_suburban_street_block_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/SUBURBAN_STREET_BLOCK_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/
  );
});

test("suburban street block preview consumer metadata resolves the 24-lot block", () => {
  const metadata = moduleUnderTest.createSuburbanStreetBlockPreviewSceneMetadata();

  assert.equal(metadata.sceneId, "SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001");
  assert.equal(metadata.previewType, "suburban_street_block_visual_inspection");
  assert.equal(metadata.roadLayer.roadSegmentCount, 6);
  assert.equal(metadata.roadLayer.intersectionCount, 3);
  assert.equal(metadata.roadLayer.nodeCount, 7);
  assert.equal(metadata.lotLayer.lotCount, 24);
  assert.equal(metadata.buildingLayer.buildingInstanceCount, 24);
  assert.equal(metadata.drivewayLayer.drivewayCount, 24);
  assert.equal(metadata.fenceLayer.fenceLotCount, 24);
  assert.equal(metadata.streetFeatureLayer.featureCount, 69);
  assert.equal(metadata.visualCaptureWorkflow.previewVersion, "SESSION_49_BLOCK_PREVIEW_INTEGRATION");
  assert.equal(metadata.visualCaptureWorkflow.topDown.cameraId, "TOP_DOWN_BLOCK_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.angled25D.cameraId, "ANGLED_2_5D_BLOCK_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.streetLevel.cameraId, "STREET_LEVEL_BLOCK_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.topDown.viewType, "top_down_block");
  assert.equal(metadata.visualCaptureWorkflow.angled25D.viewType, "angled_25d_block");
  assert.equal(metadata.visualCaptureWorkflow.streetLevel.viewType, "street_level_block");
  assert.equal(metadata.performanceProfile.expectedStreetFeatureInstances, 69);
  assert.equal(metadata.debugLayer.showRoadGraphMarkers, true);
  assert.equal(metadata.streetFeatureLayer.featurePresentation.length, 69);
  for (const instance of metadata.buildingLayer.resolvedBuildingAssets) {
    assert.equal(instance.lodProfile, "LOD_GAMEPLAY");
    assert.ok(instance.gameplayAssetPath.endsWith(".glb"));
  }
});

test("suburban street block preview consumer validation passes against the deterministic source preview", () => {
  const validation = moduleUnderTest.createSuburbanStreetBlockPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.roadSegmentCount, 6);
  assert.equal(validation.summary.intersectionCount, 3);
  assert.equal(validation.summary.lotCount, 24);
  assert.equal(validation.summary.buildingInstanceCount, 24);
  assert.equal(validation.summary.streetFeatureCount, 69);
  assert.equal(validation.checks.roadConnectedNetworkValid, "PASS");
  assert.equal(validation.checks.validIntersections, "PASS");
  assert.equal(validation.checks.allLotsPopulated, "PASS");
  assert.equal(validation.checks.lotBoundariesValid, "PASS");
  assert.equal(validation.checks.allBuildingIdsResolve, "PASS");
  assert.equal(validation.checks.noBuildingOverlap, "PASS");
  assert.equal(validation.checks.orientationValid, "PASS");
  assert.equal(validation.checks.drivewaysConnected, "PASS");
  assert.equal(validation.checks.streetFeaturesContained, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
});

test("checked-in block preview artifacts match generated metadata and validation outputs", () => {
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
        "SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const generatedMetadata =
    moduleUnderTest.createSuburbanStreetBlockPreviewSceneMetadata();
  const generatedValidation =
    moduleUnderTest.createSuburbanStreetBlockPreviewValidationReport();
  const generatedCommand =
    moduleUnderTest.buildSuburbanStreetBlockPreviewBlenderCommand();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(validation, generatedValidation);
  assert.equal(
    manifest.blenderCommand,
    generatedCommand
  );
});
