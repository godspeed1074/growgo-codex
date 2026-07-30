import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const validationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001"
);

const specificationPath = path.join(
  validationRoot,
  "specification/atlas-regional-package-validation-specification.json"
);
const validationPath = path.join(
  validationRoot,
  "validation/atlas-regional-package-validation.json"
);
const lifecyclePath = path.join(
  validationRoot,
  "lifecycle/atlas-regional-package-validation-lifecycle-record.json"
);
const reportPath = path.join(
  validationRoot,
  "reports/atlas-regional-package-validation-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-regional-package-validation-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas regional package validation planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRegionalPackageValidationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRegionalPackageValidationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas regional package validation planning defines integrity, schema, compatibility, rollback, and release gates", () => {
  const planning = moduleUnderTest.buildAtlasRegionalPackageValidationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(
    specification.integrityChecks.requiredTopLevelFields.includes(
      "selectorCompatibility"
    ),
    true
  );
  assert.equal(
    specification.schemaValidationRules.requiredPackageType,
    "ATLAS_REGION_CONTEXT_PACKAGE"
  );
  assert.equal(
    specification.dependencyValidationRules.selectorDependency.requiredEnvironment,
    "DEVELOPMENT_ONLY"
  );
  assert.equal(
    specification.fingerprintVerificationRules.identityReplayRules.includes(
      "fingerprint mismatch must block selector handoff"
    ),
    true
  );
  assert.equal(
    specification.releaseGating.lifecycleStates.includes(
      "READY_FOR_FUTURE_DISTRIBUTION"
    ),
    true
  );
  assert.equal(
    specification.rollbackStrategy.rollbackTarget,
    "LAST_VALIDATED_PACKAGE_FINGERPRINT"
  );
});

test("atlas regional package validation planning preserves deterministic package identity, safe failure behaviour, approved recipe compatibility, and mobile suitability", () => {
  const planning = moduleUnderTest.buildAtlasRegionalPackageValidationPlanning({
    cwd: repoRoot
  });

  const validScenarios = planning.specification.representativeValidationScenarios.filter(
    (scenario) => scenario.valid
  );
  const invalidScenarios = planning.specification.representativeValidationScenarios.filter(
    (scenario) => !scenario.valid
  );

  assert.equal(validScenarios.length >= 3, true);
  assert.equal(invalidScenarios.length >= 3, true);

  for (const scenario of validScenarios) {
    assert.equal(scenario.computedFingerprint, scenario.declaredFingerprint);
    assert.equal(scenario.recipeApproved, true);
    assert.equal(scenario.compressedPackageKb <= scenario.mobileBudgetKb, true);
  }

  const corrupt = invalidScenarios.find(
    (scenario) => scenario.scenarioId === "REGIONAL_PACKAGE_VALIDATION_CORRUPT_001"
  );
  const incompatible = invalidScenarios.find(
    (scenario) =>
      scenario.scenarioId === "REGIONAL_PACKAGE_VALIDATION_INCOMPATIBLE_RECIPE_001"
  );
  const oversize = invalidScenarios.find(
    (scenario) => scenario.scenarioId === "REGIONAL_PACKAGE_VALIDATION_OVERSIZE_001"
  );

  assert.equal(corrupt.requiredFieldsPresent, false);
  assert.equal(corrupt.requiredIdentityPresent, false);
  assert.equal(corrupt.selectorCompatibilityComplete, false);
  assert.notEqual(corrupt.computedFingerprint, corrupt.declaredFingerprint);
  assert.equal(incompatible.recipeApproved, false);
  assert.equal(oversize.compressedPackageKb > oversize.mobileBudgetKb, true);
});

test("atlas regional package validation planning writes records with distribution still blocked", () => {
  moduleUnderTest.writeAtlasRegionalPackageValidationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.releaseGateState, "READY_FOR_FUTURE_DISTRIBUTION");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.mapDownloadsAuthorized, false);
  assert.equal(lifecycle.packageDistributionAuthorized, false);
  assert.match(report, /Future Atlas development: READY/);
  assert.match(report, /Package distribution: PLANNING ONLY/);
});
