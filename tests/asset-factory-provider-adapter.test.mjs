import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const providerAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "provider-adapter.mjs")
);
const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);

test("map provider fixture converts roads, trails, paths, and boundaries into source data", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.MAP_PROVIDER_FIXTURE_001
  );

  assert.equal(layer.schemaId, "PROVIDER_ADAPTER_LAYER_001");
  assert.equal(layer.sourceDataBundle.schemaId, "SOURCE_DATA_BUNDLE_001");
  assert.equal(layer.sourceDataBundle.roadFeatures.length, 3);
  assert.equal(layer.sourceDataBundle.settlementFeatures.length, 1);
  assert.equal(layer.sourceDataBundle.roadFeatures[0].properties.providerProvenance.provider, "fixture-map-provider");
});

test("terrain provider fixture converts elevation and terrain classes into geography features", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.TERRAIN_PROVIDER_FIXTURE_001
  );

  assert.equal(layer.sourceDataBundle.geographyFeatures.length, 5);
  assert.ok(
    layer.sourceDataBundle.geographyFeatures.some((feature) => feature.type === "ELEVATION")
  );
  assert.ok(
    layer.sourceDataBundle.geographyFeatures.some((feature) => feature.type === "BIOME")
  );
  assert.ok(
    layer.sourceDataBundle.geographyFeatures.some((feature) => feature.type === "COASTLINE")
  );
});

test("poi provider fixture maps provider categories into GrowGo POI types", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.POI_PROVIDER_FIXTURE_001
  );

  assert.equal(layer.sourceDataBundle.poiFeatures.length, 3);
  assert.deepEqual(
    layer.sourceDataBundle.poiFeatures.map((feature) => feature.type),
    ["LANDMARK", "ATTRACTION", "SERVICE"]
  );
});

test("natural provider fixture maps provider feature classes into natural source features", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.NATURAL_PROVIDER_FIXTURE_001
  );

  assert.equal(layer.sourceDataBundle.naturalFeatures.length, 3);
  assert.deepEqual(
    layer.sourceDataBundle.naturalFeatures.map((feature) => feature.type),
    ["BEACH", "PARK", "WATERWAY"]
  );
});

test("provider field mappings expose deterministic translation rules", () => {
  const mappings = providerAdapterModule.providerFieldMappings;

  assert.ok(
    mappings.some(
      (mapping) =>
        mapping.providerType === "MAP_PROVIDER" &&
        mapping.providerField === "highway" &&
        mapping.growgoTargetField === "roadFeatures[].type"
    )
  );
  assert.ok(
    mappings.some(
      (mapping) =>
        mapping.providerType === "POI_PROVIDER" &&
        mapping.providerField === "category" &&
        mapping.transformationRule === "MAP_POI_CATEGORY_TO_SOURCE_POI_TYPE"
    )
  );
});

test("provider conversion preserves provider provenance metadata", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.POI_PROVIDER_FIXTURE_001
  );

  assert.ok(
    layer.sourceDataBundle.poiFeatures.every((feature) => {
      const provenance = feature.properties.providerProvenance;
      return (
        provenance.provider === "fixture-poi-provider" &&
        typeof provenance.providerId === "string" &&
        provenance.providerType === "POI_PROVIDER" &&
        provenance.providerVersion === "1.0"
      );
    })
  );
});

test("same provider fixture produces deterministic same output", () => {
  const first = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.MAP_PROVIDER_FIXTURE_001
  );
  const second = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.MAP_PROVIDER_FIXTURE_001
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicConversion, true);
});

test("provider adapter output is source adapter compatible", () => {
  const providerLayer = providerAdapterModule.createProviderAdapterLayer(
    providerAdapterModule.providerFixtureBundles.NATURAL_PROVIDER_FIXTURE_001
  );
  const sourceLayer = sourceAdapterModule.createSourceAdapterLayer(providerLayer.sourceDataBundle);

  assert.equal(providerLayer.validation.sourceAdapterCompatibility, true);
  assert.equal(sourceLayer.validationStatus.validationPassed, true);
  assert.equal(sourceLayer.regionPackage.schemaId, "GROWGO_REGION_PACKAGE_001");
});

test("provider adapter region package helper creates validated region packages", () => {
  const regionPackage = providerAdapterModule.createProviderAdapterRegionPackage(
    providerAdapterModule.providerFixtureBundles.TERRAIN_PROVIDER_FIXTURE_001
  );

  assert.equal(regionPackage.schemaId, "GROWGO_REGION_PACKAGE_001");
  assert.equal(regionPackage.packageValidation.validationPassed, true);
});
