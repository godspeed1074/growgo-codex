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
