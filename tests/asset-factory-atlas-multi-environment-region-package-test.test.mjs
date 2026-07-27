import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const regionPackageBuilderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-builder.mjs"
  )
);
const multiEnvironmentModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-multi-environment-region-package-test.mjs"
  )
);

function createPackageFromBundle(bundle) {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(bundle);
  return regionPackageBuilderModule.createGrowgoRegionImportPackage(
    sourceAdapterLayer
  );
}

function createPackageMap() {
  return {
    COASTAL_REGION_PACKAGE: createPackageFromBundle(
      sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
    ),
    RURAL_REGION_PACKAGE: createPackageFromBundle(
      sourceAdapterModule.fixtureSourceBundles.RURAL_SOURCE_BUNDLE_001
    ),
    URBAN_REGION_PACKAGE: createPackageFromBundle(
      sourceAdapterModule.fixtureSourceBundles.URBAN_SOURCE_BUNDLE_001
    )
  };
}

test("coastal package produces a valid package-driven atlas result", () => {
  const result =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(
      createPackageMap()
    );
  const coastal = result.packageResults.find(
    (entry) => entry.packageType === "COASTAL_REGION_PACKAGE"
  );

  assert.ok(coastal);
  assert.equal(coastal.classificationResult, "COASTAL");
  assert.ok(coastal.sceneSummary.sceneCount >= 1);
});

test("rural package produces a valid package-driven atlas result", () => {
  const result =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(
      createPackageMap()
    );
  const rural = result.packageResults.find(
    (entry) => entry.packageType === "RURAL_REGION_PACKAGE"
  );

  assert.ok(rural);
  assert.equal(rural.classificationResult, "RURAL");
  assert.ok(rural.objectCounts.totalWorldObjects > 0);
});

test("urban package produces a valid package-driven atlas result", () => {
  const result =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(
      createPackageMap()
    );
  const urban = result.packageResults.find(
    (entry) => entry.packageType === "URBAN_REGION_PACKAGE"
  );

  assert.ok(urban);
  assert.equal(urban.classificationResult, "URBAN");
  assert.ok(urban.assetAssignments.assignmentCount > 0);
});

test("multi-environment results preserve deterministic output", () => {
  const packageMap = createPackageMap();
  const first =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(packageMap);
  const second =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(packageMap);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("multi-environment validation passes for provenance geometry classification and recipes", () => {
  const result =
    multiEnvironmentModule.createAtlasMultiEnvironmentRegionPackageTest(
      createPackageMap()
    );
  const validation =
    multiEnvironmentModule.validateAtlasMultiEnvironmentRegionPackageTest(result);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.atlasMultiEnvironmentRegionTestResult.validation.provenancePreserved,
    true
  );
  assert.equal(
    validation.atlasMultiEnvironmentRegionTestResult.validation.geometryPreserved,
    true
  );
  assert.equal(
    validation.atlasMultiEnvironmentRegionTestResult.validation.classificationsCorrect,
    true
  );
  assert.equal(
    validation.atlasMultiEnvironmentRegionTestResult.validation.recipesValid,
    true
  );
});
