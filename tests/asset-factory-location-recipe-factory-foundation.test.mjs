import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const factoryRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipe-factory/LOCATION_RECIPE_FACTORY_001"
);

const specificationPath = path.join(
  factoryRoot,
  "specification/location-recipe-factory-specification.json"
);
const validationPath = path.join(
  factoryRoot,
  "validation/location-recipe-factory-validation.json"
);
const lifecyclePath = path.join(
  factoryRoot,
  "lifecycle/location-recipe-factory-lifecycle-record.json"
);
const reportPath = path.join(
  factoryRoot,
  "reports/location-recipe-factory-foundation-report.md"
);

const foundationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "location-recipe-factory-foundation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("location recipe factory foundation builder is deterministic", () => {
  const first = foundationModule.buildLocationRecipeFactoryFoundation({
    cwd: repoRoot
  });
  const second = foundationModule.buildLocationRecipeFactoryFoundation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("location recipe factory specification defines reusable recipe schema and workflows", () => {
  const specification = readJson(specificationPath);

  assert.equal(specification.factoryId, "LOCATION_RECIPE_FACTORY_001");
  assert.equal(
    specification.referenceRecipe.recipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(
    specification.recipeSchema.requiredOutputRecords.includes("approval"),
    true
  );
  assert.equal(
    specification.lifecycleStates.includes("APPROVED_CURRENT"),
    true
  );
  assert.equal(
    specification.previewWorkflow.requiredReviewChecks.includes("performance_budgets"),
    true
  );
});

test("location recipe factory validation confirms reference-backed readiness", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "future_recipe_creation_ready");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
});

test("location recipe factory lifecycle record marks the framework ready", () => {
  const lifecycle = readJson(lifecyclePath);

  assert.equal(lifecycle.factoryId, "LOCATION_RECIPE_FACTORY_001");
  assert.equal(lifecycle.lifecycleStatus, "READY");
  assert.equal(
    lifecycle.referenceRecipeId,
    "COASTAL_LOCATION_RECIPE_001"
  );
  assert.equal(lifecycle.safety.runtimeActivated, false);
});

test("location recipe factory report documents future recipe creation readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Status: READY/);
  assert.match(report, /COASTAL_LOCATION_RECIPE_001/);
  assert.match(report, /future recipe creation/i);
});
