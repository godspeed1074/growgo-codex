import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const validationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001"
);

const specificationPath = path.join(
  validationRoot,
  "specification/atlas-gameplay-opportunity-validation-specification.json"
);
const contractsPath = path.join(
  validationRoot,
  "metadata/atlas-gameplay-opportunity-validation-metadata-contracts.json"
);
const validationPath = path.join(
  validationRoot,
  "validation/atlas-gameplay-opportunity-validation-record.json"
);
const lifecyclePath = path.join(
  validationRoot,
  "lifecycle/atlas-gameplay-opportunity-validation-lifecycle-rules.json"
);
const reportPath = path.join(
  validationRoot,
  "reports/atlas-gameplay-opportunity-validation-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "gameplay-opportunity-validation-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("gameplay opportunity validation planning is deterministic", () => {
  const first = moduleUnderTest.buildGameplayOpportunityValidationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildGameplayOpportunityValidationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.contracts, second.contracts);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycleRules, second.lifecycleRules);
});

test("gameplay opportunity validation planning defines scoring, duplicate prevention, difficulty, suitability, reward, player experience, and approval gates", () => {
  const planning = moduleUnderTest.buildGameplayOpportunityValidationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.opportunityQualityScoring.weightedFactors.length, 5);
  assert.equal(specification.duplicatePrevention.duplicateSignatureFields.length >= 5, true);
  assert.equal(specification.difficultyValidation.allowedBands.length, 4);
  assert.equal(specification.locationSuitabilityChecks.checks.length >= 4, true);
  assert.equal(specification.rewardPlanningValidation.requiredFields.length, 5);
  assert.equal(specification.playerExperienceRules.rules.length >= 4, true);
  assert.equal(specification.approvalGates.gateChecks.length, 6);
});

test("gameplay opportunity validation planning builds deterministic candidate validation records with approved recipes only", () => {
  const planning = moduleUnderTest.buildGameplayOpportunityValidationPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.contracts.candidateValidationRecords.length >= 4, true);
  assert.equal(
    planning.contracts.candidateValidationRecords
      .filter((record) => record.approvedRecipeId !== null)
      .every((record) =>
        ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
          record.approvedRecipeId
        )
      ),
    true
  );
  assert.equal(
    Object.values(planning.contracts.duplicateSignatures).every((count) => count === 1),
    true
  );
});

test("gameplay opportunity validation planning writes records and preserves blocked gameplay creation", () => {
  moduleUnderTest.writeGameplayOpportunityValidationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const contracts = readJson(contractsPath);
  const validation = readJson(validationPath);
  const lifecycleRules = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycleRules.lifecycleStatus, "PLANNING_READY");
  assert.equal(validation.questsCreated, false);
  assert.equal(validation.achievementsCreated, false);
  assert.equal(validation.rewardsCreated, false);
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.playerExposureAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.equal(specification.approvalGates.approvedRecipesOnly, true);
  assert.equal(contracts.approvalQueuePreview.length >= 4, true);
  assert.match(report, /Future gameplay factory integration: READY/);
});
