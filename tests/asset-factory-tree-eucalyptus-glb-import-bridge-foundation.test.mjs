import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-glb-import-bridge-foundation.mjs"
  )
);

test("tree eucalyptus GLB import bridge registers all tree LOD outputs and validates the runtime preview binding", () => {
  const definition = moduleUnderTest.treeEucalyptusGlbImportBridgeFoundationDefinition;
  const existingPaths = [
    definition.glbRegistration.glbPath,
    definition.glbRegistration.lodReferences.LOD_CLOSE,
    definition.glbRegistration.lodReferences.LOD_GAMEPLAY,
    definition.glbRegistration.lodReferences.LOD_MAP,
    definition.glbRegistration.lodReferences.LOD_DISTANT_SILHOUETTE,
    definition.glbRegistration.manifestReference,
    definition.glbRegistration.metadataReference
  ];

  const result = moduleUnderTest.validateTreeEucalyptusGlbImportBridgeFoundation(
    definition,
    {
      existsSync(candidatePath) {
        return existingPaths.includes(candidatePath);
      }
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.glbImportBridge.foundation.glbRegistration.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(
    result.glbImportBridge.foundation.runtimePreviewBinding.renderPayload.rendererAssetReference,
    "TREE_EUCALYPTUS_001"
  );
});

test("tree eucalyptus GLB import bridge rejects missing gameplay GLB safely", () => {
  const definition = moduleUnderTest.treeEucalyptusGlbImportBridgeFoundationDefinition;
  const result = moduleUnderTest.validateTreeEucalyptusGlbImportBridgeFoundation(
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
