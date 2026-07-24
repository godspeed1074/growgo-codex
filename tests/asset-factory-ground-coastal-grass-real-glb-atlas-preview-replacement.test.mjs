import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-atlas-preview-replacement.mjs"
  )
);

function createExistsSyncStub(existingPaths) {
  const normalized = new Set(existingPaths);
  return (candidatePath) => normalized.has(candidatePath);
}

test("ground coastal grass real GLB Atlas preview replacement validates when import files exist", () => {
  const definition =
    moduleUnderTest.groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition;
  const bridgeRegistration =
    moduleUnderTest
      .groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition.importReference;
  const existingPaths = [
    definition.importReference.glbPath,
    definition.importReference.manifestReference,
    definition.importReference.metadataReference,
    definition.rendererPayload.lodGlb,
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
  ];

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
      definition,
      { existsSync: createExistsSyncStub(existingPaths) }
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.realGlbAtlasPreviewReplacement.definition.previewState.placeholderGroundReplaced,
    true
  );
});

test("ground coastal grass real GLB Atlas preview replacement preserves renderer payload and lod selection", () => {
  const definition =
    moduleUnderTest.groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition;

  assert.equal(definition.rendererPayload.rendererAssetReference.assetId, "GROUND_COASTAL_GRASS_001");
  assert.equal(definition.lodSelection.currentLod, "LOD_CLOSE");
  assert.deepEqual(definition.lodSelection.availableLods, [
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP",
    "LOD_DISTANT_SILHOUETTE"
  ]);
});

test("ground coastal grass real GLB Atlas preview replacement rejects missing import files safely", () => {
  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
      undefined,
      { existsSync: () => false }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "glb_missing");
});
