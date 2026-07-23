import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "blender-prototype-asset-generation-glb-export-foundation.mjs"
  )
);

test("prototype GLB export foundation validates lighthouse export structure and references", () => {
  const result =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.exportFoundation.foundation.assetPackage.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.exportFoundation.foundation.assetPackage.format, "glb");
  assert.equal(result.exportFoundation.exportPreparation.exportCollectionId, "EXPORT");
  assert.equal(result.exportFoundation.assetPackageValidation.identityVerified, true);
});

test("prototype GLB export foundation validates all four LOD tiers and synthetic replacement references", () => {
  const result =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation();

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.exportFoundation.lodValidation.map((entry) => entry.lodTier),
    ["LOD0", "LOD1", "LOD2", "LOD3"]
  );
  assert.equal(
    result.exportFoundation.syntheticReplacementVerification.packageReference.endsWith(
      "/LIGHTHOUSE_ISLAND_ROCKY_001.glb"
    ),
    true
  );
  assert.equal(
    result.exportFoundation.syntheticReplacementVerification.worldPipelineReference.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
});

test("same lighthouse prototype export definition produces identical passive output", () => {
  const first =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation();
  const second =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.exportFoundation, second.exportFoundation);
});

test("prototype GLB export foundation rejects invalid LOD naming and export metadata placement safely", () => {
  const invalidLodNaming =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation({
      ...moduleUnderTest.blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
      lodReferences: {
        ...moduleUnderTest.blenderPrototypeAssetGenerationGlbExportFoundationDefinition
          .lodReferences,
        LOD1: {
          ...moduleUnderTest.blenderPrototypeAssetGenerationGlbExportFoundationDefinition
            .lodReferences.LOD1,
          filename: "LIGHTHOUSE_ISLAND_ROCKY_001_GAMEPLAY.glb"
        }
      }
    });

  const invalidExportMetadata =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation({
      ...moduleUnderTest.blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
      metadataReferences: {
        ...moduleUnderTest.blenderPrototypeAssetGenerationGlbExportFoundationDefinition
          .metadataReferences,
        exportMetadata: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/metadata/not-in-export-folder.json"
      }
    });

  assert.equal(invalidLodNaming.ok, false);
  assert.equal(invalidLodNaming.errorCode, "invalid_lod_naming");
  assert.equal(invalidExportMetadata.ok, false);
  assert.equal(invalidExportMetadata.errorCode, "export_metadata_location_mismatch");
});

test("prototype GLB export foundation remains passive and does not create runtime or final assets", () => {
  const result =
    moduleUnderTest.validateBlenderPrototypeAssetGenerationGlbExportFoundation();

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.exportFoundation, "canvas"), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.exportFoundation.foundation, "glbBinary"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.exportFoundation, "runtimeRenderer"),
    false
  );
});
