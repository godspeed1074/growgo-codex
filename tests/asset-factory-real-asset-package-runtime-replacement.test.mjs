import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-asset-package-runtime-replacement-test.mjs"
  )
);

test("runtime replacement validates lighthouse package resolution and passive pipeline references", () => {
  const result = moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest();

  assert.equal(result.ok, true);
  assert.equal(result.runtimeReplacementValidation.assetResolution.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.runtimeReplacementValidation.assetResolution.packageVersion, "1.0.0");
  assert.equal(
    result.runtimeReplacementValidation.pipelineVerification.assetRegistration.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  assert.equal(
    result.runtimeReplacementValidation.pipelineVerification.rendererPayload.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
});

test("runtime replacement preserves same world output when replacing placeholder with real package reference", () => {
  const result = moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest();

  assert.equal(result.ok, true);
  assert.equal(
    result.runtimeReplacementValidation.replacementValidation.placeholderReference.includes(
      "_PLACEHOLDER.glb"
    ),
    true
  );
  assert.equal(
    result.runtimeReplacementValidation.replacementValidation.realPackageReference.endsWith(
      "/LIGHTHOUSE_ISLAND_ROCKY_001.glb"
    ),
    true
  );
  assert.equal(
    result.runtimeReplacementValidation.replacementValidation.sameWorldOutput,
    true
  );
});

test("same world seed, location, and lighthouse asset produce identical passive replacement output", () => {
  const first = moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest();
  const second = moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.runtimeReplacementValidation, second.runtimeReplacementValidation);
});

test("runtime replacement rejects package-reference and appearance-profile mismatches safely", () => {
  const badPackageReference =
    moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest({
      ...moduleUnderTest.realAssetPackageRuntimeReplacementTestDefinition,
      packageReference:
        "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/LIGHTHOUSE_ISLAND_ROCKY_PLACEHOLDER.glb"
    });

  const badAppearanceProfiles =
    moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest({
      ...moduleUnderTest.realAssetPackageRuntimeReplacementTestDefinition,
      appearanceProfiles: ["DAY_COASTAL_LIGHTHOUSE", "NIGHT_ONLY_LIGHTHOUSE"]
    });

  assert.equal(badPackageReference.ok, false);
  assert.equal(badPackageReference.errorCode, "package_reference_mismatch");
  assert.equal(badAppearanceProfiles.ok, false);
  assert.equal(badAppearanceProfiles.errorCode, "appearance_profile_mismatch");
});

test("runtime replacement remains passive and creates no runtime or live world objects", () => {
  const result = moduleUnderTest.validateRealAssetPackageRuntimeReplacementTest();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.runtimeReplacementValidation, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.runtimeReplacementValidation.assetResolution,
      "glbBinary"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.runtimeReplacementValidation,
      "runtimeRenderer"
    ),
    false
  );
});
