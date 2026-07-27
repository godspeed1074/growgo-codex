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

function createCoastalPackage() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  return regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
}

test("region package builder creates validated import package from source adapter output", () => {
  const regionImportPackage = createCoastalPackage();

  assert.equal(regionImportPackage.schemaId, "GROWGO_REGION_IMPORT_PACKAGE_001");
  assert.equal(
    regionImportPackage.regionPackageMetadata.schemaId,
    "REGION_PACKAGE_METADATA_001"
  );
  assert.equal(
    regionImportPackage.validationReport.validationPassed,
    true
  );
});

test("region package metadata preserves deterministic source version and bounds details", () => {
  const regionImportPackage = createCoastalPackage();

  assert.equal(
    regionImportPackage.regionPackageMetadata.regionId,
    "fixture-coastal-region"
  );
  assert.equal(
    regionImportPackage.regionPackageMetadata.sourceVersions.providerVersion,
    "1.0"
  );
  assert.equal(
    regionImportPackage.regionPackageMetadata.creationTimestamp,
    "2026-07-27T00:00:00Z"
  );
  assert.deepEqual(regionImportPackage.regionPackageMetadata.geographicBounds, {
    minLatitude: -38.58,
    maxLatitude: -38.14,
    minLongitude: 144.82,
    maxLongitude: 145.38
  });
});

test("provenance index provides fast trace records across normalized groups", () => {
  const regionImportPackage = createCoastalPackage();

  assert.equal(
    regionImportPackage.provenanceIndex.schemaId,
    "PACKAGE_PROVENANCE_INDEX_001"
  );
  assert.ok(regionImportPackage.provenanceIndex.totalEntries > 0);
  assert.ok(
    regionImportPackage.provenanceIndex.indexEntries.every(
      (entry) =>
        typeof entry.sourceFeatureId === "string" &&
        typeof entry.normalizedFeatureId === "string" &&
        entry.provider === "fixture-provider"
    )
  );
});

test("interpretation metadata remains compatible with world interpretation profile resolution", () => {
  const regionImportPackage = createCoastalPackage();

  assert.equal(
    regionImportPackage.interpretationMetadata.classificationResult,
    "COASTAL"
  );
  assert.equal(
    regionImportPackage.interpretationMetadata.selectedProfile,
    "AUSTRALIAN_COASTAL_WORLD"
  );
  assert.ok(regionImportPackage.interpretationMetadata.confidence > 0);
  assert.ok(regionImportPackage.interpretationMetadata.evidenceReasons.length > 0);
});

test("same source adapter output produces deterministic identical region packages", () => {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );

  const first = regionPackageBuilderModule.createGrowgoRegionImportPackage(
    sourceAdapterLayer
  );
  const second = regionPackageBuilderModule.createGrowgoRegionImportPackage(
    sourceAdapterLayer
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationReport.deterministicPackageHashValid, true);
});

test("cache metadata remains valid and includes deterministic package hash", () => {
  const regionImportPackage = createCoastalPackage();

  assert.equal(
    regionImportPackage.cacheMetadata.schemaId,
    "REGION_CACHE_METADATA_001"
  );
  assert.equal(regionImportPackage.cacheMetadata.compatibilityVersion, "WORLD_INTERPRETATION_LAYER_001");
  assert.equal(regionImportPackage.cacheMetadata.chunkReferences.length, 5);
  assert.match(regionImportPackage.cacheMetadata.packageHash, /^[0-9a-f]{8}$/);
});

test("explicit region import package validation passes full contract checks", () => {
  const regionImportPackage = createCoastalPackage();
  const validation =
    regionPackageBuilderModule.validateGrowgoRegionImportPackage(regionImportPackage);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.regionImportPackage.validationReport.sourceReferencesPreserved,
    true
  );
  assert.equal(
    validation.regionImportPackage.validationReport.provenanceComplete,
    true
  );
  assert.equal(
    validation.regionImportPackage.validationReport.interpretationCompatible,
    true
  );
});
