import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-glb-import-bridge-foundation.mjs"
  )
);

function createExistsSyncStub(existingPaths) {
  const normalized = new Set(existingPaths);
  return (candidatePath) => normalized.has(candidatePath);
}

test("ground coastal grass GLB import bridge validates registration and Atlas reference when files exist", () => {
  const foundation =
    moduleUnderTest.groundCoastalGrassGlbImportBridgeFoundationDefinition;
  const existingPaths = [
    foundation.glbRegistration.glbPath,
    ...Object.values(foundation.glbRegistration.lodReferences),
    foundation.glbRegistration.manifestReference,
    foundation.glbRegistration.metadataReference
  ];

  const result =
    moduleUnderTest.validateGroundCoastalGrassGlbImportBridgeFoundation(
      foundation,
      {
        existsSync: createExistsSyncStub(existingPaths)
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.glbImportBridge.foundation.glbRegistration.assetId, "GROUND_COASTAL_GRASS_001");
  assert.equal(result.glbImportBridge.foundation.atlasAssetReference.appearanceProfile, "day");
});

test("ground coastal grass GLB import bridge preserves all four LOD registrations", () => {
  const registration =
    moduleUnderTest.groundCoastalGrassGlbImportBridgeFoundationDefinition.glbRegistration;

  assert.deepEqual(Object.keys(registration.lodReferences), [
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP",
    "LOD_DISTANT_SILHOUETTE"
  ]);
});

test("ground coastal grass GLB import bridge rejects missing GLB files safely", () => {
  const result =
    moduleUnderTest.validateGroundCoastalGrassGlbImportBridgeFoundation(
      undefined,
      {
        existsSync: () => false
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "glb_missing");
});

test("ground coastal grass GLB import bridge rejects invalid appearance profiles safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.groundCoastalGrassGlbImportBridgeFoundationDefinition
  );
  invalidDefinition.atlasAssetReference.appearanceProfile = "storm";

  const result =
    moduleUnderTest.validateGroundCoastalGrassGlbImportBridgeFoundation(
      invalidDefinition,
      {
        existsSync: () => true
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_appearance_profile");
});
