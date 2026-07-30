import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const bridgeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-gameplay/ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_001"
);

const specificationPath = path.join(
  bridgeRoot,
  "specification/atlas-achievement-quest-factory-bridge-specification.json"
);
const contractsPath = path.join(
  bridgeRoot,
  "metadata/atlas-achievement-quest-factory-bridge-metadata-contracts.json"
);
const validationPath = path.join(
  bridgeRoot,
  "validation/atlas-achievement-quest-factory-bridge-validation.json"
);
const lifecyclePath = path.join(
  bridgeRoot,
  "lifecycle/atlas-achievement-quest-factory-bridge-lifecycle-boundaries.json"
);
const reportPath = path.join(
  bridgeRoot,
  "reports/atlas-achievement-quest-factory-bridge-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-achievement-quest-factory-bridge-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas achievement and quest factory bridge planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasAchievementQuestFactoryBridgePlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasAchievementQuestFactoryBridgePlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.contracts, second.contracts);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas achievement and quest factory bridge planning defines mapping, hooks, difficulty, reward inputs, and lifecycle boundaries", () => {
  const bridge = moduleUnderTest.buildAtlasAchievementQuestFactoryBridgePlanning({
    cwd: repoRoot
  });
  const specification = bridge.specification;

  assert.equal(specification.opportunityToAchievementMapping.mappingRules.length >= 5, true);
  assert.equal(specification.opportunityToQuestMapping.mappingRules.length >= 5, true);
  assert.equal(specification.collectionHookMapping.hookTargets.length >= 4, true);
  assert.equal(specification.poiHookMapping.hookTargets.length >= 3, true);
  assert.equal(specification.difficultyEstimation.inputs.length >= 5, true);
  assert.equal(specification.rewardPlanningInputs.supportedRewardInputs.length >= 5, true);
  assert.equal(specification.lifecycleBoundaries.blockedStates.includes("QUEST_CREATED"), true);
});

test("atlas achievement and quest factory bridge planning builds planning-only factory inputs from approved recipes", () => {
  const bridge = moduleUnderTest.buildAtlasAchievementQuestFactoryBridgePlanning({
    cwd: repoRoot
  });

  assert.equal(bridge.contracts.achievementFactoryInputs.length >= 2, true);
  assert.equal(bridge.contracts.questFactoryInputs.length >= 2, true);
  assert.equal(
    bridge.contracts.achievementFactoryInputs.every(
      (entry) =>
        ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
          entry.approvedRecipeId
        ) && entry.mappedAchievements.every((candidate) => candidate.planningOnly === true)
    ),
    true
  );
  assert.equal(
    bridge.contracts.questFactoryInputs.every(
      (entry) =>
        ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
          entry.approvedRecipeId
        ) && entry.mappedQuests.every((candidate) => candidate.planningOnly === true)
    ),
    true
  );
});

test("atlas achievement and quest factory bridge planning writes records and keeps all gameplay creation blocked", () => {
  moduleUnderTest.writeAtlasAchievementQuestFactoryBridgePlanning({
    cwd: repoRoot
  });

  const specification = readJson(specificationPath);
  const contracts = readJson(contractsPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(validation.questsCreated, false);
  assert.equal(validation.achievementsCreated, false);
  assert.equal(validation.rewardsCreated, false);
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.playerExposureAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.equal(specification.rewardPlanningInputs.rewardsCreatedByBridge, false);
  assert.equal(contracts.collectionHooks.length >= 2, true);
  assert.equal(contracts.poiHooks.length >= 2, true);
  assert.match(report, /Future gameplay factory integration: READY/);
});
