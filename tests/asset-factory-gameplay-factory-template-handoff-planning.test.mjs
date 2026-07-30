import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const handoffRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_001"
);

const specificationPath = path.join(
  handoffRoot,
  "specification/atlas-gameplay-factory-template-handoff-specification.json"
);
const contractsPath = path.join(
  handoffRoot,
  "metadata/atlas-gameplay-factory-template-handoff-metadata-contracts.json"
);
const lifecyclePath = path.join(
  handoffRoot,
  "lifecycle/atlas-gameplay-factory-template-handoff-lifecycle-rules.json"
);
const validationPath = path.join(
  handoffRoot,
  "validation/atlas-gameplay-factory-template-handoff-validation.json"
);
const reportPath = path.join(
  handoffRoot,
  "reports/atlas-gameplay-factory-template-handoff-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "gameplay-factory-template-handoff-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("gameplay factory template handoff planning is deterministic", () => {
  const first = moduleUnderTest.buildGameplayFactoryTemplateHandoffPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildGameplayFactoryTemplateHandoffPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.contracts, second.contracts);
  assert.deepEqual(first.lifecycleRules, second.lifecycleRules);
  assert.deepEqual(first.validation, second.validation);
});

test("gameplay factory template handoff planning defines all target schemas and handoff contracts", () => {
  const planning = moduleUnderTest.buildGameplayFactoryTemplateHandoffPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.opportunityTemplateContracts.contractFamilies.length, 4);
  assert.equal(specification.achievementInputSchema.requiredFields.length >= 6, true);
  assert.equal(specification.questInputSchema.requiredFields.length >= 6, true);
  assert.equal(specification.collectionInputSchema.requiredFields.length >= 5, true);
  assert.equal(specification.poiInputSchema.requiredFields.length >= 6, true);
  assert.equal(specification.difficultyHandoff.supportedBands.length, 4);
  assert.equal(specification.rewardPlanningHandoff.requiredFields.length, 5);
  assert.equal(specification.validationHandoff.requiredFields.length, 6);
});

test("gameplay factory template handoff planning preserves ready and review states in planning-only templates", () => {
  const planning = moduleUnderTest.buildGameplayFactoryTemplateHandoffPlanning({
    cwd: repoRoot
  });

  assert.equal(
    planning.contracts.achievementTemplates.some(
      (record) => record.handoffState === "HANDOFF_READY"
    ),
    true
  );
  assert.equal(
    planning.contracts.achievementTemplates.some(
      (record) => record.handoffState === "HANDOFF_REVIEW_REQUIRED"
    ),
    true
  );
  assert.equal(
    planning.contracts.questTemplates.every((record) =>
      record.templateCandidates.every((candidate) => candidate.planningOnly === true)
    ),
    true
  );
});

test("gameplay factory template handoff planning writes records and keeps all gameplay creation blocked", () => {
  moduleUnderTest.writeGameplayFactoryTemplateHandoffPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const contracts = readJson(contractsPath);
  const lifecycle = readJson(lifecyclePath);
  const validation = readJson(validationPath);
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
  assert.equal(specification.opportunityTemplateContracts.supportedHandoffStates.length, 3);
  assert.equal(contracts.collectionTemplates.length >= 2, true);
  assert.equal(contracts.poiTemplates.length >= 2, true);
  assert.match(report, /Future gameplay factory integration: READY/);
});
