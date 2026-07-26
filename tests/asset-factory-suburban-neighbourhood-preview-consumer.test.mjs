import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "suburban-neighbourhood-preview-consumer.mjs"
  )
);

const prototypeOutputDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "asset-factory-workspace",
  "procedural-previews",
  "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001"
);

test("suburban neighbourhood preview consumer builds a Blender prototype command", () => {
  const command =
    moduleUnderTest.buildSuburbanNeighbourhoodPreviewBlenderCommand();

  assert.match(
    command,
    /blender --python asset-factory\/local-blender-scripts\/generate_suburban_neighbourhood_preview_scene\.py/
  );
  assert.match(
    command,
    /--source-json asset-factory-workspace\/procedural-previews\/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001\.json/
  );
  assert.match(
    command,
    /--output-dir asset-factory-workspace\/procedural-previews\/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/
  );
});

test("suburban neighbourhood preview consumer metadata resolves all six building instances", () => {
  const metadata =
    moduleUnderTest.createSuburbanNeighbourhoodPreviewSceneMetadata();

  assert.equal(
    metadata.sceneId,
    "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001"
  );
  assert.equal(metadata.resolvedBuildingAssets.length, 6);
  assert.equal(metadata.drivewayLayer.useDrivewaySideOffsets, true);
  assert.equal(metadata.fenceLayer.showDrivewayOpenings, true);
  assert.equal(metadata.fenceLayer.showPedestrianOpenings, true);
  assert.equal(metadata.landscapeLayer.useRegisteredLandscapeAssets, true);
  assert.equal(metadata.visualCaptureWorkflow.previewVersion, "SESSION_44_PREVIEW_POLISH_PASS");
  assert.equal(metadata.visualCaptureWorkflow.topDown.cameraId, "TOP_DOWN_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.angled25D.cameraId, "ANGLED_2_5D_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.streetLevel.cameraId, "STREET_LEVEL_INSPECTION");
  assert.equal(metadata.visualCaptureWorkflow.topDown.viewType, "top_down");
  assert.equal(metadata.visualCaptureWorkflow.angled25D.viewType, "angled_25d");
  assert.equal(metadata.visualCaptureWorkflow.streetLevel.viewType, "street_level");
  assert.equal(metadata.groundPresentation.vergeZones.length, 2);
  assert.equal(metadata.groundPresentation.footpathPlacements.length, 2);
  assert.equal(metadata.groundPresentation.lawnBoundaries.length, 12);
  assert.ok(
    metadata.groundPresentation.siteAssets.grassAssetPath.endsWith(
      "MOD_GROUND_GRASS_STANDARD_001_LOD_GAMEPLAY.glb"
    )
  );
  assert.ok(
    metadata.groundPresentation.siteAssets.pathAssetPath.endsWith(
      "MOD_PATH_STANDARD_001_LOD_GAMEPLAY.glb"
    )
  );
  for (const instance of metadata.resolvedBuildingAssets) {
    assert.equal(instance.lodProfile, "LOD_GAMEPLAY");
    assert.ok(instance.gameplayAssetPath.endsWith(".glb"));
  }
});

test("suburban neighbourhood preview consumer validation passes against the deterministic source preview", () => {
  const validation =
    moduleUnderTest.createSuburbanNeighbourhoodPreviewValidationReport();

  assert.equal(validation.summary.validationPassed, true);
  assert.equal(validation.checks.allBuildingIdsResolve, "PASS");
  assert.equal(validation.checks.allLotsPopulated, "PASS");
  assert.equal(validation.checks.noPlacementOverlap, "PASS");
  assert.equal(validation.checks.drivewayConnectionsValid, "PASS");
  assert.equal(validation.checks.orientationValid, "PASS");
  assert.equal(validation.checks.fenceOpeningsValid, "PASS");
  assert.equal(validation.checks.landscapeContainmentValid, "PASS");
  assert.equal(validation.checks.themeWeightingValid, "PASS");
  assert.equal(validation.checks.suburbanIdentityScoreValid, "PASS");
  assert.equal(validation.checks.vergeContainmentValid, "PASS");
  assert.equal(validation.checks.footpathAlignmentValid, "PASS");
  assert.equal(validation.checks.cameraProfileValid, "PASS");
  assert.equal(validation.checks.deterministicSourceMatches, "PASS");
});

test("checked-in prototype preview artifacts match the generated metadata and validation outputs", () => {
  const metadata = JSON.parse(
    fs.readFileSync(
      path.join(prototypeOutputDirectory, "preview-scene-metadata.json"),
      "utf8"
    )
  );
  const validation = JSON.parse(
    fs.readFileSync(
      path.join(
        prototypeOutputDirectory,
        "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001.json"
      ),
      "utf8"
    )
  );
  const generatedMetadata =
    moduleUnderTest.createSuburbanNeighbourhoodPreviewSceneMetadata();
  const generatedValidation =
    moduleUnderTest.createSuburbanNeighbourhoodPreviewValidationReport();

  assert.deepEqual(metadata, generatedMetadata);
  assert.deepEqual(validation, generatedValidation);
});
