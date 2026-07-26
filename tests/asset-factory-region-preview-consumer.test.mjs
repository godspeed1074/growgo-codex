import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-preview-consumer.mjs"
  )
);

const previewOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "REGION_LAYOUT_001_PREVIEW_SCENE_001"
);

test("region preview consumer builds a Blender preview command", () => {
  const command = moduleUnderTest.buildRegionPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_region_layout_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/REGION_LAYOUT_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/REGION_LAYOUT_001_PREVIEW_SCENE_001/
  );
});

test("region preview consumer metadata resolves the region preview scene", () => {
  const metadata = moduleUnderTest.createRegionPreviewSceneMetadata();

  assert.equal(metadata.sceneId, "REGION_LAYOUT_001_PREVIEW_SCENE_001");
  assert.equal(metadata.previewType, "procedural_region_visual_inspection");
  assert.equal(metadata.regionLayer.profileIdentity, "COASTAL_REGION");
  assert.equal(metadata.regionLayer.settlementCount, 5);
  assert.equal(metadata.regionLayer.naturalZoneCount, 6);
  assert.equal(metadata.regionLayer.transportCorridorCount, 6);
  assert.equal(metadata.regionLayer.landmarkReserveCount, 5);
  assert.equal(metadata.regionLayer.explorationRouteCount, 6);
  assert.equal(metadata.naturalSystemLayer.zoneCount, 6);
  assert.equal(metadata.settlementLayer.settlementCount, 5);
  assert.equal(metadata.transportLayer.corridorCount, 6);
  assert.equal(metadata.landmarkLayer.landmarkReserveCount, 5);
  assert.equal(metadata.explorationLayer.routeCount, 6);
  assert.equal(
    metadata.visualCaptureWorkflow.previewVersion,
    "SESSION_76_REGION_PREVIEW_CONSUMER"
  );
  assert.equal(metadata.visualCaptureWorkflow.regionProfile, "COASTAL_REGION");
  assert.equal(
    metadata.visualCaptureWorkflow.inspectionStatus,
    "READY_FOR_REGION_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.topDown.cameraId,
    "TOP_DOWN_REGION_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.angledRegion25D.cameraId,
    "ANGLED_REGION_2_5D_INSPECTION"
  );
  assert.equal(
    metadata.visualCaptureWorkflow.settlementNetworkOverview.cameraId,
    "SETTLEMENT_NETWORK_OVERVIEW_INSPECTION"
  );
  assert.equal(metadata.performanceProfile.reuseMode, "reference_based_preview_only");
  assert.equal(metadata.performanceProfile.streamingReadyStructure, true);
  assert.equal(metadata.performanceProfile.noDuplicateGeometryGeneration, true);
  assert.equal(
    metadata.transportLayer.resolvedTransportCorridors[4].transportType,
    "COASTAL_ROUTE"
  );
  assert.equal(
    metadata.landmarkLayer.resolvedLandmarkReserves[0].landmarkType,
    "LIGHTHOUSE"
  );
  assert.equal(
    metadata.explorationLayer.resolvedExplorationRoutes[0].routeType,
    "COASTAL_SCENIC_ROUTE"
  );
  assert.equal(
    metadata.transportLayer.resolvedTransportCorridors[0].routeMode,
    "shortest_practical_route"
  );
  assert.equal(
    metadata.transportLayer.resolvedTransportCorridors[0].terrainInfluences.length > 0,
    true
  );
  assert.equal(
    metadata.naturalSystemLayer.resolvedNaturalZones[0].corridorGuidance,
    "FOLLOW_SHORE_EDGE_FOR_SCENIC_AND_COASTAL_LINKS"
  );
  assert.equal(
    metadata.settlementLayer.resolvedSettlements[0].connectionPriority,
    "PRIMARY_MULTI_CORRIDOR"
  );
  assert.equal(
    metadata.explorationLayer.resolvedExplorationRoutes[0].geographicRelationship,
    "foreshore travel corridor linked to NATURAL_ZONE_001"
  );
});

test("region preview consumer validation passes against the deterministic region source", () => {
  const validation = moduleUnderTest.createRegionPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.summary.regionProfileId, "COASTAL_REGION");
  assert.equal(validation.summary.settlementCount, 5);
  assert.equal(validation.summary.naturalZoneCount, 6);
  assert.equal(validation.summary.transportCorridorCount, 6);
  assert.equal(validation.summary.landmarkReserveCount, 5);
  assert.equal(validation.summary.explorationRouteCount, 6);
  assert.equal(validation.checks.regionBoundaryValid, "PASS");
  assert.equal(validation.checks.naturalZonesValid, "PASS");
  assert.equal(validation.checks.settlementsValid, "PASS");
  assert.equal(validation.checks.corridorsConnected, "PASS");
  assert.equal(validation.checks.terrainAwareCorridorValidity, "PASS");
  assert.equal(validation.checks.scenicRouteValidity, "PASS");
  assert.equal(validation.checks.settlementConnectivity, "PASS");
  assert.equal(validation.checks.naturalBarrierCompliance, "PASS");
  assert.equal(validation.checks.settlementsLinked, "PASS");
  assert.equal(validation.checks.landmarksAccessible, "PASS");
  assert.equal(validation.checks.routeCompatible, "PASS");
  assert.equal(validation.checks.explorationRoutesValid, "PASS");
  assert.equal(validation.checks.explorationRouteQuality, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
  assert.equal(validation.checks.referenceBasedPlacement, "PASS");
  assert.equal(validation.checks.streamingReadyStructure, "PASS");
  assert.equal(validation.checks.noDuplicateGeometryGeneration, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
});

test("checked-in region preview artifacts match generated metadata and validation outputs", () => {
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
        "REGION_LAYOUT_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const generatedMetadata = moduleUnderTest.createRegionPreviewSceneMetadata();
  const generatedValidation = moduleUnderTest.createRegionPreviewValidationReport();
  const generatedCommand = moduleUnderTest.buildRegionPreviewBlenderCommand();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(validation, generatedValidation);
  assert.equal(manifest.blenderCommand, generatedCommand);
});
