import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const integrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-asset-package-integration.mjs"
  )
);

test("real asset package integration validates lighthouse package registration and flow references", () => {
  const result = integrationModule.validateRealAssetPackageIntegration();

  assert.equal(result.ok, true);
  assert.equal(result.integration.assetPackage.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.integration.manifestReference.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.integration.manifestReference.recipeId, "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001");
  assert.equal(result.integration.worldInstanceReference.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.integration.rendererPayloadReference.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
});

test("real asset package integration preserves same world output when replacing placeholder reference with real package reference", () => {
  const result = integrationModule.validateRealAssetPackageIntegration();

  assert.equal(result.ok, true);
  assert.equal(result.integration.replacementValidation.placeholderReference.includes("_PLACEHOLDER.glb"), true);
  assert.equal(result.integration.replacementValidation.realPackageReference.endsWith("/LIGHTHOUSE_ISLAND_ROCKY_001.glb"), true);
  assert.equal(result.integration.replacementValidation.sameWorldOutput, true);
  assert.equal(result.integration.replacementValidation.worldOutputSnapshot.receivedObjectCount, 4);
});

test("same lighthouse package registration produces identical passive integration output", () => {
  const first = integrationModule.validateRealAssetPackageIntegration();
  const second = integrationModule.validateRealAssetPackageIntegration();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.integration, second.integration);
});

test("real asset package integration rejects manifest and import-contract mismatches safely", () => {
  const manifestMismatch = integrationModule.validateRealAssetPackageIntegration({
    ...integrationModule.realAssetPackageIntegrationDefinition,
    componentReferences: integrationModule.realAssetPackageIntegrationDefinition.componentReferences.slice(0, 8)
  });

  const lodNamingMismatch = integrationModule.validateRealAssetPackageIntegration({
    ...integrationModule.realAssetPackageIntegrationDefinition,
    lodReferences: {
      ...integrationModule.realAssetPackageIntegrationDefinition.lodReferences,
      close: "LIGHTHOUSE_ISLAND_ROCKY_001_CLOSE.glb"
    }
  });

  assert.equal(manifestMismatch.ok, false);
  assert.equal(manifestMismatch.errorCode, "component_reference_mismatch");
  assert.equal(lodNamingMismatch.ok, false);
  assert.equal(lodNamingMismatch.errorCode, "invalid_lod_naming");
});

test("real asset package integration remains passive and creates no final asset runtime objects", () => {
  const result = integrationModule.validateRealAssetPackageIntegration();

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.integration, "canvas"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.integration.assetPackage, "glbBinary"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.integration, "runtimeRenderer"), false);
});
