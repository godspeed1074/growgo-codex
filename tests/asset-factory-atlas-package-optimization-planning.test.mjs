import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const optimizationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001"
);

const specificationPath = path.join(
  optimizationRoot,
  "specification/atlas-package-optimization-specification.json"
);
const validationPath = path.join(
  optimizationRoot,
  "validation/atlas-package-optimization-validation.json"
);
const lifecyclePath = path.join(
  optimizationRoot,
  "lifecycle/atlas-package-optimization-lifecycle-record.json"
);
const reportPath = path.join(
  optimizationRoot,
  "reports/atlas-package-optimization-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-package-optimization-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas package optimization planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasPackageOptimizationPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasPackageOptimizationPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas package optimization planning defines compression, reduction, cache, loading, refresh, and offline rules", () => {
  const planning = moduleUnderTest.buildAtlasPackageOptimizationPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.optimizationId, "ATLAS_PACKAGE_OPTIMIZATION_001");
  assert.equal(
    specification.compressionStrategy.supportedMethods.includes("JSON_GZIP_AT_REST"),
    true
  );
  assert.equal(
    specification.dataLayerReductionRules.selectorCriticalLayers.includes(
      "ENVIRONMENT_SUMMARY_LAYER"
    ),
    true
  );
  assert.equal(
    specification.cacheLifecycle.states.includes("WARM"),
    true
  );
  assert.equal(
    specification.nearbyRegionLoadingStrategy.loadingBands.some(
      (band) => band.band === "ADJACENT_REGION_RING"
    ),
    true
  );
  assert.equal(
    specification.offlineFallbackStrategy.offlineModes.includes(
      "LAST_VALID_SELECTOR_HANDOFF"
    ),
    true
  );
});

test("atlas package optimization planning preserves identity and recipe compatibility inside mobile budgets", () => {
  const planning = moduleUnderTest.buildAtlasPackageOptimizationPlanning({
    cwd: repoRoot
  });
  const standardBudget = planning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );

  for (const example of planning.specification.representativeOptimizationExamples) {
    assert.match(example.packageId, /^ATLAS_REGION_PACKAGE_/);
    assert.match(example.regionId, /^REGION_/);
    assert.equal(example.compressedPackageKb <= standardBudget.maxCompressedPackageKb, true);
    assert.equal(typeof example.selectorSeed, "string");
    assert.equal(example.selectorSeed.length > 20, true);
    assert.equal(
      ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
        example.expectedRecipeId
      ),
      true
    );
  }
});

test("atlas package optimization planning records are written with runtime blocked", () => {
  moduleUnderTest.writeAtlasPackageOptimizationPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "PLANNING_READY");
  assert.equal(lifecycle.runtimeActivationAuthorized, false);
  assert.equal(lifecycle.mapDownloadsAuthorized, false);
  assert.match(report, /Future Atlas development: READY/);
});
