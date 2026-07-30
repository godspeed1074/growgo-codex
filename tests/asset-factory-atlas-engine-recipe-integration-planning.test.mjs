import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const integrationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001"
);

const specificationPath = path.join(
  integrationRoot,
  "specification/atlas-engine-recipe-integration-specification.json"
);
const validationPath = path.join(
  integrationRoot,
  "validation/atlas-engine-recipe-integration-validation.json"
);
const lifecyclePath = path.join(
  integrationRoot,
  "lifecycle/atlas-engine-recipe-integration-lifecycle-record.json"
);
const reportPath = path.join(
  integrationRoot,
  "reports/atlas-engine-recipe-integration-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-recipe-integration-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("atlas engine recipe integration planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasEngineRecipeIntegrationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasEngineRecipeIntegrationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas integration specification defines classification, selector, fallback, and seed contracts", () => {
  const planning = moduleUnderTest.buildAtlasEngineRecipeIntegrationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.integrationId, "ATLAS_ENGINE_RECIPE_INTEGRATION_001");
  assert.equal(
    specification.selectorReference.selectorId,
    "LOCATION_RECIPE_SELECTOR_001"
  );
  assert.equal(
    specification.environmentClassificationSchema.supportedEnvironmentTypes.includes(
      "COASTAL_EXPLORATION"
    ),
    true
  );
  assert.equal(
    specification.coordinateSeedRules.requiredSeedInputs.includes("primaryBiomeTag"),
    true
  );
  assert.equal(
    specification.fallbackStrategy.supportedOutcomes.includes("APPROVED_RECIPE_FALLBACK"),
    true
  );
});

test("atlas integration planning scenarios map correctly to approved recipes and fallback behavior", () => {
  const planning = moduleUnderTest.buildAtlasEngineRecipeIntegrationPlanning({
    cwd: repoRoot
  });
  const coastal = byScenarioId(planning.scenarioResults, "ATLAS_COASTAL_CONTEXT_001");
  const forest = byScenarioId(planning.scenarioResults, "ATLAS_FOREST_CONTEXT_001");
  const mixed = byScenarioId(
    planning.scenarioResults,
    "ATLAS_MIXED_EDGE_CONTEXT_001"
  );

  assert.equal(coastal.selectionResult.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(coastal.selectionResult.fallbackApplied, false);
  assert.equal(forest.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(forest.selectionResult.fallbackApplied, false);
  assert.equal(mixed.selectionResult.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(mixed.selectionResult.fallbackApplied, true);
  assert.ok(mixed.selectionResult.confidenceScore >= 35);
  assert.ok(mixed.selectionResult.confidenceScore <= 84);
});

test("atlas integration planning records are written with runtime still blocked", async () => {
  await moduleUnderTest.writeAtlasEngineRecipeIntegrationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.mapDownloadsAuthorized, false);
  assert.equal(
    specification.futureAtlasEngineIntegrationBoundaries.futureAtlasBoundary
      .runtimeStillBlocked,
    true
  );
  assert.match(report, /Future Atlas Engine development: READY/);
});
