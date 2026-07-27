import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const simulationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "real-provider-format-simulation.mjs"
  )
);
const providerAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "provider-adapter.mjs")
);

test("messy road conversion handles aliases, nested tags, and geometry variants", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    simulationModule.messyProviderExports.MESSY_MAP_PROVIDER_EXPORT_001
  );

  assert.equal(layer.sourceDataBundle.roadFeatures.length, 3);
  assert.equal(layer.sourceDataBundle.settlementFeatures.length, 1);
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "MISSING_OPTIONAL_SURFACE")
  );
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "UNSUPPORTED_MAP_FEATURE")
  );
});

test("messy terrain conversion handles mixed labels and missing slope data safely", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    simulationModule.messyProviderExports.MESSY_TERRAIN_PROVIDER_EXPORT_001
  );

  assert.ok(
    layer.sourceDataBundle.geographyFeatures.some((feature) => feature.type === "COASTLINE")
  );
  assert.ok(
    layer.sourceDataBundle.geographyFeatures.some((feature) => feature.type === "BIOME")
  );
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "MISSING_OPTIONAL_SLOPE")
  );
});

test("messy POI conversion handles aliases, duplicates, incomplete metadata, and confidence", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    simulationModule.messyProviderExports.MESSY_POI_PROVIDER_EXPORT_001
  );

  assert.equal(layer.sourceDataBundle.poiFeatures.length, 3);
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "DUPLICATE_POI_RESOLVED")
  );
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "LOW_CONFIDENCE_POI_MAPPING")
  );
  assert.ok(
    layer.conversionWarnings.some((warning) => warning.code === "INCOMPLETE_POI_METADATA")
  );
});

test("messy natural conversion preserves normalization with boundary and overlap warnings", () => {
  const layer = providerAdapterModule.createProviderAdapterLayer(
    simulationModule.messyProviderExports.MESSY_NATURAL_PROVIDER_EXPORT_001
  );

  assert.equal(layer.sourceDataBundle.naturalFeatures.length, 4);
  assert.ok(
    layer.conversionWarnings.some(
      (warning) => warning.code === "INCOMPLETE_NATURAL_BOUNDARY"
    )
  );
  assert.ok(
    layer.conversionWarnings.some(
      (warning) => warning.code === "OVERLAPPING_NATURAL_FEATURE"
    )
  );
});

test("real provider format simulation generates validation warnings and preserves provenance", () => {
  const simulation = simulationModule.createRealProviderFormatSimulation();

  assert.equal(simulation.validation.warningCount > 0, true);
  assert.ok(
    simulation.warningSummary.warningCodes.includes("UNSUPPORTED_MAP_FEATURE")
  );
  assert.ok(
    simulation.warningSummary.warningCodes.includes("UNSUPPORTED_POI_FEATURE")
  );
  assert.equal(simulation.validation.sourceIdsPreserved, true);
  assert.equal(simulation.validation.providerMetadataPreserved, true);
});

test("real provider simulation remains interpretation compatible and coastal", () => {
  const simulation = simulationModule.createRealProviderFormatSimulation();

  assert.equal(
    simulation.interpretationResult.classificationResults.primaryWorldType,
    "COASTAL"
  );
  assert.equal(
    simulation.interpretationResult.selectedEnvironmentProfile.profileId,
    "AUSTRALIAN_COASTAL_WORLD"
  );
  assert.equal(simulation.validation.normalizedOutputCompatible, true);
  assert.equal(simulation.validation.classificationDeterministic, true);
});

test("same messy provider input produces deterministic same simulation output", () => {
  const first = simulationModule.createRealProviderFormatSimulation();
  const second = simulationModule.createRealProviderFormatSimulation();

  assert.deepEqual(first, second);
  assert.equal(first.validation.validationPassed, true);
});
