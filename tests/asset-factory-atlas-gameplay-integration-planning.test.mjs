import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const gameplayRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_INTEGRATION_001"
);

const specificationPath = path.join(
  gameplayRoot,
  "specification/atlas-gameplay-integration-specification.json"
);
const schemaPath = path.join(
  gameplayRoot,
  "metadata/atlas-gameplay-metadata-schema.json"
);
const representativeMetadataPath = path.join(
  gameplayRoot,
  "metadata/atlas-gameplay-generated-location-metadata.json"
);
const validationPath = path.join(
  gameplayRoot,
  "validation/atlas-gameplay-integration-validation.json"
);
const lifecyclePath = path.join(
  gameplayRoot,
  "lifecycle/atlas-gameplay-integration-lifecycle-record.json"
);
const reportPath = path.join(
  gameplayRoot,
  "reports/atlas-gameplay-integration-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-gameplay-integration-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas gameplay integration planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasGameplayIntegrationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasGameplayIntegrationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.gameplayMetadataSchema, second.gameplayMetadataSchema);
  assert.deepEqual(first.representativeMetadata, second.representativeMetadata);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas gameplay integration planning defines gameplay tags, extraction rules, suitability scoring, poi mapping, and metadata contract", () => {
  const planning = moduleUnderTest.buildAtlasGameplayIntegrationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.locationGameplayTags.categories.length >= 5, true);
  assert.equal(specification.featureExtractionRules.derivedFeatures.length >= 5, true);
  assert.equal(specification.achievementSuitabilityScoring.weightedFactors.length, 4);
  assert.equal(specification.questSuitabilityScoring.weightedFactors.length, 4);
  assert.equal(specification.collectionSuitabilityScoring.weightedFactors.length, 4);
  assert.equal(specification.poiOpportunityMapping.opportunityTypes.length >= 5, true);
  assert.equal(specification.gameplayMetadataContract.supportedRecipeIds.length >= 2, true);
});

test("atlas gameplay integration planning produces representative gameplay metadata and blocks unsupported hooks", () => {
  const planning = moduleUnderTest.buildAtlasGameplayIntegrationPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.representativeMetadata.length >= 2, true);
  assert.equal(
    planning.representativeMetadata.every(
      (record) =>
        record.gameplayTags.length >= 3 &&
        record.poiOpportunities.length >= 1 &&
        record.gameplayHooks.blocked.runtimeQuestCreation === true &&
        record.gameplayHooks.blocked.runtimeAchievementAwarding === true &&
        record.gameplayHooks.blocked.livePoiActivation === true &&
        record.gameplayHooks.blocked.playerExposure === true
    ),
    true
  );
});

test("atlas gameplay integration planning writes records and preserves read-only gameplay safety", () => {
  moduleUnderTest.writeAtlasGameplayIntegrationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const schema = readJson(schemaPath);
  const representativeMetadata = readJson(representativeMetadataPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.questsCreated, false);
  assert.equal(lifecycle.achievementsAwarded, false);
  assert.equal(lifecycle.playerExposureAuthorized, false);
  assert.equal(lifecycle.blenderAuthorized, false);
  assert.equal(lifecycle.glbAuthorized, false);
  assert.equal(lifecycle.assetModificationAuthorized, false);
  assert.equal(schema.safetyContract.unsupportedGameplayHooksBlocked, true);
  assert.equal(representativeMetadata.length >= 2, true);
  assert.equal(specification.integratedSystems.questFactory, "PLANNING_BRIDGE_ONLY");
  assert.match(report, /Future gameplay integration: READY/);
});
