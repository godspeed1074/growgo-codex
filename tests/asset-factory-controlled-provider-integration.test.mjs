import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const integrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "controlled-provider-integration.mjs"
  )
);

test("full controlled provider pipeline executes successfully", () => {
  const integration = integrationModule.createControlledProviderIntegration();

  assert.equal(integration.schemaId, "CONTROLLED_PROVIDER_INTEGRATION_001");
  assert.equal(integration.output.schemaId, "CONTROLLED_PROVIDER_INTEGRATION_OUTPUT_001");
  assert.equal(integration.validation.validationPassed, true);
});

test("provider adapter, source adapter, and interpretation layers remain compatible", () => {
  const integration = integrationModule.createControlledProviderIntegration();

  assert.equal(integration.validation.providerAdapterCompatibility, true);
  assert.equal(integration.validation.sourceAdapterCompatibility, true);
  assert.equal(integration.validation.interpretationCompatibility, true);
});

test("controlled coastal mock data resolves to coastal interpretation", () => {
  const integration = integrationModule.createControlledProviderIntegration();

  assert.equal(integration.interpretationResult.classificationResults.primaryWorldType, "COASTAL");
  assert.equal(integration.output.selectedProfile, "AUSTRALIAN_COASTAL_WORLD");
  assert.ok(
    integration.output.gameplayOpportunities.some(
      (rule) => rule.interpretedGameplayType === "COASTAL_EXPLORATION_OPPORTUNITY"
    )
  );
  assert.ok(
    integration.output.gameplayOpportunities.some(
      (rule) => rule.interpretedGameplayType === "DISCOVERY_AND_QUEST_CANDIDATE"
    )
  );
  assert.ok(
    integration.output.gameplayOpportunities.some(
      (rule) => rule.interpretedGameplayType === "WALKING_EXPLORATION_ROUTE"
    )
  );
});

test("provenance summary preserves traceability from provider source to normalized output", () => {
  const integration = integrationModule.createControlledProviderIntegration();

  assert.equal(integration.validation.provenancePreserved, true);
  assert.ok(
    integration.output.provenanceSummary.providerTraceRecords.every(
      (record) =>
        record.providerStagePresent &&
        record.sourceAdapterStagePresent &&
        record.normalizedStagePresent
    )
  );
});

test("pipeline does not invent features and remains deterministic", () => {
  const first = integrationModule.createControlledProviderIntegration();
  const second = integrationModule.createControlledProviderIntegration();

  assert.deepEqual(first, second);
  assert.equal(first.validation.noInventedFeatures, true);
  assert.equal(first.validation.deterministicOutputValid, true);
});

test("controlled integration validation passes explicit contract checks", () => {
  const integration = integrationModule.createControlledProviderIntegration();
  const validation = integrationModule.validateControlledProviderIntegration(integration);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.controlledProviderIntegration.output.normalizedRegionPackage.schemaId,
    "GROWGO_REGION_PACKAGE_001"
  );
  assert.equal(
    validation.controlledProviderIntegration.interpretationResult.validationState.validationPassed,
    true
  );
});
