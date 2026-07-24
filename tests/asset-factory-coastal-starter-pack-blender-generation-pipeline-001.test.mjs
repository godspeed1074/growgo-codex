import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const pipelineModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-starter-pack-blender-generation-pipeline-001.mjs"
  )
);

test("Blender generation pipeline 001 validates GROUND_COASTAL_GRASS_001 preparation", () => {
  const result =
    pipelineModule.validateCoastalStarterPackBlenderGenerationPipeline001();

  assert.equal(result.ok, true);
  assert.equal(
    result.generationPipeline.contract.assetId,
    "GROUND_COASTAL_GRASS_001"
  );
  assert.equal(
    result.generationPipeline.contract.exportConfiguration.format,
    "glb"
  );
});

test("scene builder helpers create the required Blender collections", () => {
  const sceneTemplate = pipelineModule.buildBlenderSceneTemplate(
    "GROUND_COASTAL_GRASS_001"
  );

  assert.deepEqual(sceneTemplate.collectionNames, [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);
  assert.equal(sceneTemplate.rootCollection, "GROUND_COASTAL_GRASS_001");
});

test("GLB export preparation helpers preserve supported LOD outputs", () => {
  const exportConfiguration =
    pipelineModule.buildGlbExportPreparationHelpers("GROUND_COASTAL_GRASS_001");

  assert.equal(exportConfiguration.format, "glb");
  assert.equal(
    exportConfiguration.lodExports.close,
    "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb"
  );
  assert.equal(
    exportConfiguration.lodExports.distantSilhouette,
    "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
  );
});

test("generation pipeline rejects invalid scene collection contracts safely", () => {
  const invalidContract = structuredClone(
    pipelineModule.coastalStarterPackBlenderGenerationPipeline001Definition
  );
  invalidContract.sceneTemplate.collectionNames = [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "EXPORT"
  ];

  const result =
    pipelineModule.validateCoastalStarterPackBlenderGenerationPipeline001(
      invalidContract
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "scene_contract_mismatch");
});
