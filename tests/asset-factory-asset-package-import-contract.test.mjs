import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-package-import-contract.mjs"
  )
);

test("asset package import contract validates the first real coastal house import profile", () => {
  const context = moduleUnderTest.buildAssetPackageImportContractContext();
  const result = moduleUnderTest.validateAssetPackageImportContract(
    moduleUnderTest.assetPackageImportContractDefinition,
    { validationContext: context }
  );

  assert.equal(result.ok, true);
  assert.equal(result.importContract.contract.assetId, "BUILDING_HOUSE_SMALL_COASTAL_001");
  assert.equal(result.importContract.contract.format, "glb");
  assert.equal(
    result.importContract.compatibility.rendererCompatibilityVerified,
    true
  );
});

test("asset package import contract enforces supported format and LOD naming safely", () => {
  const context = moduleUnderTest.buildAssetPackageImportContractContext();

  const invalidFormat = moduleUnderTest.validateAssetPackageImportContract(
    {
      ...moduleUnderTest.assetPackageImportContractDefinition,
      format: "fbx"
    },
    { validationContext: context }
  );

  const invalidLodNaming = moduleUnderTest.validateAssetPackageImportContract(
    {
      ...moduleUnderTest.assetPackageImportContractDefinition,
      lodFiles: {
        ...moduleUnderTest.assetPackageImportContractDefinition.lodFiles,
        gameplay: "BUILDING_HOUSE_SMALL_COASTAL_001_GAMEPLAY.glb"
      }
    },
    { validationContext: context }
  );

  assert.equal(invalidFormat.ok, false);
  assert.equal(invalidFormat.errorCode, "unsupported_format");
  assert.equal(invalidLodNaming.ok, false);
  assert.equal(invalidLodNaming.errorCode, "invalid_lod_naming");
});

test("asset package import contract rejects component and material mismatches safely", () => {
  const context = moduleUnderTest.buildAssetPackageImportContractContext();

  const invalidComponents = moduleUnderTest.validateAssetPackageImportContract(
    {
      ...moduleUnderTest.assetPackageImportContractDefinition,
      metadata: {
        ...moduleUnderTest.assetPackageImportContractDefinition.metadata,
        componentReferences: [
          "COASTAL_HOUSE_WALL_PANEL_001",
          "COASTAL_HOUSE_ROOF_GABLE_001"
        ]
      }
    },
    { validationContext: context }
  );

  const invalidMaterials = moduleUnderTest.validateAssetPackageImportContract(
    {
      ...moduleUnderTest.assetPackageImportContractDefinition,
      metadata: {
        ...moduleUnderTest.assetPackageImportContractDefinition.metadata,
        materialReferences: ["COASTAL_WEATHERBOARD_SHARED_001"]
      }
    },
    { validationContext: context }
  );

  assert.equal(invalidComponents.ok, false);
  assert.equal(invalidComponents.errorCode, "component_reference_mismatch");
  assert.equal(invalidMaterials.ok, false);
  assert.equal(invalidMaterials.errorCode, "material_reference_mismatch");
});

test("asset package import contract rejects mobile performance mismatch and remains passive", () => {
  const context = moduleUnderTest.buildAssetPackageImportContractContext();

  const invalidPerformance = moduleUnderTest.validateAssetPackageImportContract(
    {
      ...moduleUnderTest.assetPackageImportContractDefinition,
      metadata: {
        ...moduleUnderTest.assetPackageImportContractDefinition.metadata,
        performanceMetadata: {
          ...moduleUnderTest.assetPackageImportContractDefinition.metadata.performanceMetadata,
          gpuVertexBudget: 120
        }
      }
    },
    { validationContext: context }
  );

  const success = moduleUnderTest.validateAssetPackageImportContract(
    moduleUnderTest.assetPackageImportContractDefinition,
    { validationContext: context }
  );

  assert.equal(invalidPerformance.ok, false);
  assert.equal(invalidPerformance.errorCode, "mobile_performance_mismatch");
  assert.equal(success.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.importContract, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.importContract, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(success.importContract, "runtimeRenderer"),
    false
  );
});
