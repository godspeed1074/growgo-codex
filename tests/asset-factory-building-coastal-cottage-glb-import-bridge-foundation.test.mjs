import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-coastal-cottage-glb-import-bridge-foundation.mjs"
  )
);

test("building coastal cottage GLB import bridge registers all cottage LOD outputs and validates the runtime preview binding", () => {
  const definition =
    moduleUnderTest.buildingCoastalCottageGlbImportBridgeFoundationDefinition;
  const existingPaths = [
    definition.glbRegistration.glbPath,
    definition.glbRegistration.lodReferences.LOD_CLOSE,
    definition.glbRegistration.lodReferences.LOD_GAMEPLAY,
    definition.glbRegistration.lodReferences.LOD_MAP,
    definition.glbRegistration.lodReferences.LOD_DISTANT_SILHOUETTE,
    definition.glbRegistration.manifestReference,
    definition.glbRegistration.metadataReference
  ];

  const result =
    moduleUnderTest.validateBuildingCoastalCottageGlbImportBridgeFoundation(
      definition,
      {
        existsSync(candidatePath) {
          return existingPaths.includes(candidatePath);
        }
      }
    );

  assert.equal(result.ok, true);
  assert.equal(
    result.glbImportBridge.foundation.glbRegistration.assetId,
    "BUILDING_COASTAL_COTTAGE_001"
  );
  assert.equal(
    result.glbImportBridge.foundation.runtimePreviewBinding.renderPayload
      .rendererAssetReference,
    "BUILDING_COASTAL_COTTAGE_001"
  );
});

test("building coastal cottage GLB import bridge rejects missing gameplay GLB safely", () => {
  const definition =
    moduleUnderTest.buildingCoastalCottageGlbImportBridgeFoundationDefinition;
  const result =
    moduleUnderTest.validateBuildingCoastalCottageGlbImportBridgeFoundation(
      definition,
      {
        existsSync(candidatePath) {
          return candidatePath !== definition.glbRegistration.lodReferences.LOD_GAMEPLAY;
        }
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "glb_missing");
});
