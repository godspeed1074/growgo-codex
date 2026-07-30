import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const validatorRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001"
);

const specificationPath = path.join(
  validatorRoot,
  "specification/atlas-budget-validator-specification.json"
);
const validationPath = path.join(
  validatorRoot,
  "validation/atlas-budget-validator-validation.json"
);
const lifecyclePath = path.join(
  validatorRoot,
  "lifecycle/atlas-budget-validator-lifecycle-record.json"
);
const reportPath = path.join(
  validatorRoot,
  "reports/atlas-budget-validator-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-budget-validator-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas budget validator planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasBudgetValidatorPlanning({ cwd: repoRoot });
  const second = moduleUnderTest.buildAtlasBudgetValidatorPlanning({ cwd: repoRoot });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas budget validator planning defines package, cache, recipe, generation, preview, warning, block, and recommendation rules", () => {
  const planning = moduleUnderTest.buildAtlasBudgetValidatorPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.packageSizeLimits.hardBlockKb, 96);
  assert.equal(specification.cacheLimits.standardWarmPackageCount, 24);
  assert.equal(specification.cacheLimits.constrainedWarmPackageCount, 12);
  assert.equal(
    specification.generationCostThresholds.blockedShortCircuitRequired,
    true
  );
  assert.equal(specification.previewPayloadLimits.previewMode, "NON_RUNTIME_ONLY");
  assert.equal(specification.warningStates.states.includes("WARNING_PACKAGE_NEAR_LIMIT"), true);
  assert.equal(specification.blockingStates.states.includes("BLOCK_PACKAGE_SIZE_LIMIT"), true);
  assert.equal(
    specification.approvalRecommendations.recommendationStates.includes(
      "BLOCK_FOR_REDESIGN"
    ),
    true
  );
});

test("atlas budget validator planning evaluates representative cases into expected recommendations", () => {
  const planning = moduleUnderTest.buildAtlasBudgetValidatorPlanning({
    cwd: repoRoot
  });

  const evaluations = new Map(
    planning.validation.representativeEvaluations.map((entry) => [entry.caseId, entry])
  );

  assert.equal(
    evaluations.get("BUDGET_CASE_WITHIN_LIMITS_001").recommendation,
    "APPROVE_WITHIN_BUDGET"
  );
  assert.equal(
    evaluations.get("BUDGET_CASE_WARNING_001").recommendation,
    "APPROVE_WITH_WARNING"
  );
  assert.equal(
    evaluations.get("BUDGET_CASE_HOLD_001").recommendation,
    "HOLD_FOR_OPTIMIZATION"
  );
  assert.equal(
    evaluations.get("BUDGET_CASE_BLOCK_001").recommendation,
    "BLOCK_FOR_REDESIGN"
  );
});

test("atlas budget validator planning writes records and keeps all unsafe operations blocked", () => {
  moduleUnderTest.writeAtlasBudgetValidatorPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.downloadsAuthorized, false);
  assert.equal(lifecycle.blenderAuthorized, false);
  assert.equal(lifecycle.glbAuthorized, false);
  assert.equal(lifecycle.assetModificationAuthorized, false);
  assert.equal(specification.packageSizeLimits.warningThresholdKb < specification.packageSizeLimits.hardBlockKb, true);
  assert.match(report, /Future Atlas engineering: READY/);
});
