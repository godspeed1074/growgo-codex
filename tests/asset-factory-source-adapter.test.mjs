import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const interpretationEngineModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-interpretation-engine.mjs"
  )
);

function createInterpretationDefinition(bundleKey) {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles[bundleKey]
  );

  return {
    interpretationSeed: `${bundleKey}_INTERPRETATION`,
    sourceDataReferences: sourceAdapterModule.createWorldInterpretationInputsFromRegionPackage(
      adapterLayer.regionPackage
    )
  };
}

test("coastal source bundle normalizes into a validated coastal region package", () => {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );

  assert.equal(adapterLayer.schemaId, "SOURCE_ADAPTER_LAYER_001");
  assert.equal(adapterLayer.validationStatus.validationPassed, true);
  assert.equal(
    adapterLayer.regionPackage.schemaId,
    "GROWGO_REGION_PACKAGE_001"
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedGeographyData.coastlineFeatures.length,
    1
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedNaturalFeatureData.beachFeatures.length,
    1
  );
});

test("rural source bundle normalizes villages and sparse POIs", () => {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.RURAL_SOURCE_BUNDLE_001
  );

  assert.equal(adapterLayer.validationStatus.validationPassed, true);
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedSettlementData.townRecords.length,
    1
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedSettlementData.villageRecords.length,
    1
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedPoiData.serviceRecords.length,
    1
  );
});

test("urban source bundle normalizes dense roads and service-heavy POIs", () => {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.URBAN_SOURCE_BUNDLE_001
  );

  assert.equal(adapterLayer.validationStatus.validationPassed, true);
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedSettlementData.cityRecords.length,
    1
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedRoadData.transportRoutes.length,
    2
  );
  assert.equal(
    adapterLayer.normalizedOutputs.normalizedPoiData.serviceRecords.length,
    2
  );
});

test("normalized outputs preserve provenance for every source feature class", () => {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );

  const provenanceGroups = [
    adapterLayer.normalizedOutputs.normalizedGeographyData.provenance,
    adapterLayer.normalizedOutputs.normalizedRoadData.provenance,
    adapterLayer.normalizedOutputs.normalizedSettlementData.provenance,
    adapterLayer.normalizedOutputs.normalizedPoiData.provenance,
    adapterLayer.normalizedOutputs.normalizedNaturalFeatureData.provenance
  ];

  assert.ok(provenanceGroups.every((group) => group.length > 0));
  assert.ok(
    provenanceGroups.flat().every((record) => {
      return (
        record.provider === "fixture-provider" &&
        typeof record.sourceId === "string" &&
        typeof record.originalType === "string" &&
        record.normalizationVersion === "1"
      );
    })
  );
});

test("same source bundle produces deterministic same adapter output", () => {
  const first = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const second = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );

  assert.deepEqual(first, second);
  assert.equal(first.validationStatus.deterministicOutputValid, true);
});

test("adapter output validates successfully as a GrowGo region package boundary", () => {
  const adapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.URBAN_SOURCE_BUNDLE_001
  );
  const validation = sourceAdapterModule.validateSourceAdapterLayer(adapterLayer);

  assert.equal(validation.ok, true);
  assert.equal(validation.sourceAdapterLayer.validationStatus.requiredMetadataExists, true);
  assert.equal(validation.sourceAdapterLayer.validationStatus.coordinatesValid, true);
  assert.equal(validation.sourceAdapterLayer.validationStatus.geometryValid, true);
  assert.equal(validation.sourceAdapterLayer.validationStatus.provenancePreserved, true);
  assert.equal(
    validation.sourceAdapterLayer.validationStatus.interpretationCompatibilityValid,
    true
  );
});

test("region package interpretation inputs feed the world interpretation layer", () => {
  const interpretation = interpretationEngineModule.createWorldInterpretationLayer(
    createInterpretationDefinition("COASTAL_SOURCE_BUNDLE_001")
  );

  assert.equal(interpretation.validationState.validationPassed, true);
  assert.equal(interpretation.classificationResults.primaryWorldType, "COASTAL");
  assert.equal(
    interpretation.selectedEnvironmentProfile.profileId,
    "AUSTRALIAN_COASTAL_WORLD"
  );
});

test("rural and urban region packages remain interpretation compatible", () => {
  const ruralInterpretation = interpretationEngineModule.createWorldInterpretationLayer(
    createInterpretationDefinition("RURAL_SOURCE_BUNDLE_001")
  );
  const urbanInterpretation = interpretationEngineModule.createWorldInterpretationLayer(
    createInterpretationDefinition("URBAN_SOURCE_BUNDLE_001")
  );

  assert.ok(["RURAL", "REMOTE"].includes(ruralInterpretation.classificationResults.primaryWorldType));
  assert.equal(
    ruralInterpretation.selectedEnvironmentProfile.profileId,
    "AUSTRALIAN_OUTBACK_WORLD"
  );
  assert.equal(urbanInterpretation.classificationResults.primaryWorldType, "URBAN");
  assert.equal(
    urbanInterpretation.selectedEnvironmentProfile.profileId,
    "METROPOLITAN_EXPANSION_WORLD"
  );
});
