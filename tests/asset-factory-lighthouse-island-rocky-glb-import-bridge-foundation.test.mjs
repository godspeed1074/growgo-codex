import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "lighthouse-island-rocky-glb-import-bridge-foundation.mjs"
  )
);

test("lighthouse GLB import bridge registers all lighthouse LOD outputs, validates the runtime preview binding, and preserves lighthouse metadata", () => {
  const definition =
    moduleUnderTest.lighthouseIslandRockyGlbImportBridgeFoundationDefinition;
  const existingPaths = [
    definition.glbRegistration.glbPath,
    definition.glbRegistration.lodReferences.LOD_CLOSE,
    definition.glbRegistration.lodReferences.LOD_GAMEPLAY,
    definition.glbRegistration.lodReferences.LOD_MAP,
    definition.glbRegistration.lodReferences.LOD_DISTANT_SILHOUETTE,
    definition.glbRegistration.manifestReference,
    definition.glbRegistration.metadataReference
  ];

  const result = moduleUnderTest.validateLighthouseIslandRockyGlbImportBridgeFoundation(
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
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  assert.deepEqual(
    result.glbImportBridge.foundation.runtimePreviewBinding.supportedAppearanceProfiles,
    ["day", "sunset", "night"]
  );
  assert.equal(
    result.glbImportBridge.foundation.runtimePreviewBinding.landmarkMetadata.questEligibility,
    true
  );
  assert.equal(
    result.glbImportBridge.foundation.runtimePreviewBinding.landmarkMetadata.captureEligibility,
    false
  );
});

test("lighthouse GLB import bridge rejects missing gameplay GLB safely", () => {
  const definition =
    moduleUnderTest.lighthouseIslandRockyGlbImportBridgeFoundationDefinition;
  const result = moduleUnderTest.validateLighthouseIslandRockyGlbImportBridgeFoundation(
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
