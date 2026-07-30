import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const gameplayRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_INTEGRATION_001"
);

const inputsPath = path.join(
  gameplayRoot,
  "simulation/atlas-gameplay-opportunity-simulation-inputs.json"
);
const achievementOutputsPath = path.join(
  gameplayRoot,
  "simulation/atlas-gameplay-achievement-opportunity-outputs.json"
);
const questOutputsPath = path.join(
  gameplayRoot,
  "simulation/atlas-gameplay-quest-opportunity-outputs.json"
);
const collectionOutputsPath = path.join(
  gameplayRoot,
  "simulation/atlas-gameplay-collection-opportunity-outputs.json"
);
const poiOutputsPath = path.join(
  gameplayRoot,
  "simulation/atlas-gameplay-poi-opportunity-outputs.json"
);
const validationPath = path.join(
  gameplayRoot,
  "validation/atlas-gameplay-opportunity-simulation-validation.json"
);
const reportPath = path.join(
  gameplayRoot,
  "reports/atlas-gameplay-opportunity-simulation-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-gameplay-opportunity-simulation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function byScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId);
}

test("atlas gameplay opportunity simulation is deterministic", () => {
  const first = moduleUnderTest.buildAtlasGameplayOpportunitySimulation({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasGameplayOpportunitySimulation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.scenarioInputs, second.scenarioInputs);
  assert.deepEqual(first.achievementOutputs, second.achievementOutputs);
  assert.deepEqual(first.questOutputs, second.questOutputs);
  assert.deepEqual(first.collectionOutputs, second.collectionOutputs);
  assert.deepEqual(first.poiOutputs, second.poiOutputs);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas gameplay opportunity simulation covers coastal, forest, unsupported, and ambiguous scenarios", () => {
  const simulation = moduleUnderTest.buildAtlasGameplayOpportunitySimulation({
    cwd: repoRoot
  });
  const coastal = byScenarioId(
    simulation.achievementOutputs,
    "ATLAS_GAMEPLAY_COASTAL_LOCATION_001"
  );
  const forest = byScenarioId(
    simulation.achievementOutputs,
    "ATLAS_GAMEPLAY_FOREST_LOCATION_001"
  );
  const unsupported = byScenarioId(
    simulation.achievementOutputs,
    "ATLAS_GAMEPLAY_UNSUPPORTED_LOCATION_001"
  );
  const ambiguous = byScenarioId(
    simulation.achievementOutputs,
    "ATLAS_GAMEPLAY_AMBIGUOUS_LOCATION_001"
  );

  assert.equal(coastal.blocked, false);
  assert.equal(forest.blocked, false);
  assert.equal(unsupported.blocked, true);
  assert.equal(ambiguous.blocked, false);
  assert.equal(ambiguous.reviewState, "APPROVED_AMBIGUOUS_REVIEW_REQUIRED");
});

test("atlas gameplay opportunity simulation uses approved recipes only and blocks unsupported hooks", () => {
  const simulation = moduleUnderTest.buildAtlasGameplayOpportunitySimulation({
    cwd: repoRoot
  });

  for (const group of [
    simulation.achievementOutputs,
    simulation.questOutputs,
    simulation.collectionOutputs,
    simulation.poiOutputs
  ]) {
    for (const entry of group) {
      if (entry.blocked) {
        assert.equal(entry.approvedRecipeId, null);
        assert.equal(entry.liveGameplayStateCreated, false);
      } else {
        assert.equal(
          ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
            entry.approvedRecipeId
          ),
          true
        );
        assert.equal(entry.liveGameplayStateCreated, false);
      }
    }
  }
});

test("atlas gameplay opportunity simulation writes records and preserves read-only gameplay safety", () => {
  moduleUnderTest.writeAtlasGameplayOpportunitySimulation({ cwd: repoRoot });

  const inputs = readJson(inputsPath);
  const achievementOutputs = readJson(achievementOutputsPath);
  const questOutputs = readJson(questOutputsPath);
  const collectionOutputs = readJson(collectionOutputsPath);
  const poiOutputs = readJson(poiOutputsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(inputs.length, 4);
  assert.equal(achievementOutputs.length, 4);
  assert.equal(questOutputs.length, 4);
  assert.equal(collectionOutputs.length, 4);
  assert.equal(poiOutputs.length, 4);
  assert.equal(validation.status, "pass");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.questsCreated, false);
  assert.equal(validation.achievementsAwarded, false);
  assert.equal(validation.playerExposureAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future gameplay integration: READY/);
});
