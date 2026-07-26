import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-preview-consumer.mjs"
  )
);

const previewOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "WORLD_LAYOUT_001_PREVIEW_SCENE_001"
);

test("world preview consumer builds a Blender preview command", () => {
  const command = moduleUnderTest.buildWorldPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_world_layout_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/WORLD_LAYOUT_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/WORLD_LAYOUT_001_PREVIEW_SCENE_001/
  );
});

test("world preview consumer metadata resolves the world preview scene", () => {
  const metadata = moduleUnderTest.createWorldPreviewSceneMetadata();

  assert.equal(metadata.sceneId, "WORLD_LAYOUT_001_PREVIEW_SCENE_001");
  assert.equal(metadata.previewType, "procedural_world_visual_inspection");
  assert.equal(metadata.worldLayer.profileIdentity, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(metadata.worldLayer.geographyZoneCount, 8);
  assert.equal(metadata.worldLayer.regionCount, 5);
  assert.equal(metadata.worldLayer.connectionCount, 6);
  assert.equal(metadata.worldLayer.landmarkReserveCount, 5);
  assert.equal(metadata.worldLayer.explorationRouteCount, 6);
  assert.equal(metadata.worldLayer.streamingChunkCount, 4);
  assert.equal(metadata.geographyLayer.zoneCount, 8);
  assert.equal(metadata.regionLayer.regionCount, 5);
  assert.equal(metadata.connectionLayer.corridorCount, 6);
  assert.equal(metadata.landmarkLayer.landmarkReserveCount, 5);
  assert.equal(metadata.explorationLayer.routeCount, 6);
  assert.equal(metadata.streamingLayer.chunkCount, 4);
  assert.equal(
    metadata.visualCaptureWorkflow.previewVersion,
    "SESSION_84_WORLD_PREVIEW_CONSUMER_PASS"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.generatorVersion,
    "SESSION_83_DETERMINISTIC_WORLD_GENERATOR"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.previewConsumerVersion,
    "SESSION_84_WORLD_VISUAL_PREVIEW_CONSUMER"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.validationVersion,
    "WORLD_PREVIEW_VALIDATION_001"
  );
  assert.equal(
    metadata.traceability.sourcePreview.previewId,
    "WORLD_LAYOUT_001_PREVIEW_001"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.topDown.cameraId,
    "TOP_DOWN_WORLD_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.angledWorld25D.cameraId,
    "ANGLED_WORLD_2_5D_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.regionNetworkOverview.cameraId,
    "REGION_NETWORK_OVERVIEW_INSPECTION"
  );
  assert.equal(metadata.performanceProfile.reuseMode, "reference_based_preview_only");
  assert.equal(metadata.performanceProfile.streamingReadyStructure, true);
  assert.equal(metadata.performanceProfile.noDuplicateGeometryGeneration, true);
  assert.equal(
    metadata.connectionLayer.resolvedWorldConnections[1].connectionType,
    "COASTAL_ROUTE"
  );
  assert.equal(
    metadata.landmarkLayer.resolvedWorldLandmarkReserves[0].landmarkType,
    "ICONIC_LOCATION"
  );
  assert.equal(
    metadata.explorationLayer.resolvedWorldExplorationRoutes[0].routeType,
    "COASTAL_GRAND_TOUR"
  );
  assert.equal(
    metadata.streamingLayer.resolvedStreamingChunks[0].regionOwnership[0],
    "REGION_001"
  );
});

test("world preview consumer emits a complete inspection capture record", () => {
  const captureRecord = moduleUnderTest.createWorldInspectionCaptureRecord();

  assert.equal(captureRecord.captureRecordId, "WORLD_INSPECTION_CAPTURE_RECORD_001");
  assert.equal(
    captureRecord.previewVersion,
    "SESSION_84_WORLD_PREVIEW_CONSUMER_PASS"
  );
  assert.equal(captureRecord.worldProfile, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(captureRecord.captureStatus, "METADATA_ONLY_PENDING_VIEWPORT_CAPTURE");
  assert.equal(captureRecord.validationStatus, "PASS");
  assert.equal(captureRecord.cameraProfiles.length, 3);
  assert.equal(captureRecord.cameraProfiles[0].cameraId, "TOP_DOWN_WORLD_INSPECTION");
});

test("world preview consumer validation passes against the deterministic world source", () => {
  const validation = moduleUnderTest.createWorldPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.worldProfileId, "AUSTRALIAN_COASTAL_WORLD");
  assert.equal(validation.summary.geographyZoneCount, 8);
  assert.equal(validation.summary.regionCount, 5);
  assert.equal(validation.summary.connectionCount, 6);
  assert.equal(validation.summary.landmarkReserveCount, 5);
  assert.equal(validation.summary.explorationRouteCount, 6);
  assert.equal(validation.summary.streamingChunkCount, 4);
  assert.equal(validation.checks.worldBoundaryValid, "PASS");
  assert.equal(validation.checks.geographyValid, "PASS");
  assert.equal(validation.checks.regionsValid, "PASS");
  assert.equal(validation.checks.corridorsConnected, "PASS");
  assert.equal(validation.checks.travelRoutesValid, "PASS");
  assert.equal(validation.checks.landmarkPlacementValid, "PASS");
  assert.equal(validation.checks.chunksValid, "PASS");
  assert.equal(validation.checks.ownershipValid, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
  assert.equal(validation.checks.referenceBasedPlacement, "PASS");
  assert.equal(validation.checks.streamingReadyStructure, "PASS");
  assert.equal(validation.checks.noDuplicateGeometryGeneration, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
  assert.equal(validation.checks.metadataVersionMatchesPreviewState, "PASS");
  assert.equal(validation.checks.inspectionRecordComplete, "PASS");
  assert.equal(validation.checks.validationReferenceConsistent, "PASS");
});

test("checked-in world preview artifacts match generated metadata and validation outputs", () => {
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
        "WORLD_LAYOUT_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const captureRecord = JSON.parse(
    fs.readFileSync(
      path.join(
        previewOutputDirectory,
        "WORLD_INSPECTION_CAPTURE_RECORD_001.json"
      ),
      "utf8"
    )
  );

  const generatedMetadata = moduleUnderTest.createWorldPreviewSceneMetadata();
  const generatedCaptureRecord =
    moduleUnderTest.createWorldInspectionCaptureRecord();
  const generatedValidation = moduleUnderTest.createWorldPreviewValidationReport();
  const generatedCommand = moduleUnderTest.buildWorldPreviewBlenderCommand();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(captureRecord, generatedCaptureRecord);
  assert.deepEqual(validation, generatedValidation);
  assert.equal(manifest.blenderCommand, generatedCommand);
  assert.equal(
    manifest.captureRecordId,
    "WORLD_INSPECTION_CAPTURE_RECORD_001"
  );
  assert.equal(
    manifest.previewVersion,
    "SESSION_84_WORLD_PREVIEW_CONSUMER_PASS"
  );
});
