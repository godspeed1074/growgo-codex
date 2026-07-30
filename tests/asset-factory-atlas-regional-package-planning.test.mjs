import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const packageRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001"
);

const specificationPath = path.join(
  packageRoot,
  "specification/atlas-regional-package-planning-specification.json"
);
const validationPath = path.join(
  packageRoot,
  "validation/atlas-regional-package-planning-validation.json"
);
const lifecyclePath = path.join(
  packageRoot,
  "lifecycle/atlas-regional-package-planning-lifecycle-record.json"
);
const reportPath = path.join(
  packageRoot,
  "reports/atlas-regional-package-planning-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-regional-package-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas regional package planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasRegionalPackagePlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasRegionalPackagePlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas regional package planning defines schema, data layers, seeds, cache, refresh, and selector compatibility", () => {
  const planning = moduleUnderTest.buildAtlasRegionalPackagePlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.planningId, "ATLAS_REGIONAL_PACKAGE_PLANNING_001");
  assert.equal(
    specification.regionalPackageSchema.requiredTopLevelFields.includes("selectorCompatibility"),
    true
  );
  assert.equal(
    specification.dataLayerDefinitions.layers.some(
      (layer) => layer.layerId === "ENVIRONMENT_SUMMARY_LAYER"
    ),
    true
  );
  assert.equal(
    specification.recipeCompatibilityContract.requiredSelectorFields.includes("seed"),
    true
  );
  assert.equal(
    specification.cacheStrategy.storagePolicy,
    "metadata_only_no_runtime_mesh_or_texture_cache"
  );
  assert.equal(
    specification.refreshStrategy.refreshModes.includes("SOURCE_REVISION_REFRESH"),
    true
  );
});

test("atlas regional package planning representative packages preserve deterministic region identity and selector compatibility", () => {
  const planning = moduleUnderTest.buildAtlasRegionalPackagePlanning({
    cwd: repoRoot
  });

  for (const pkg of planning.specification.representativePackages) {
    assert.match(pkg.regionId, /^REGION_/);
    assert.match(pkg.packageId, /^ATLAS_REGION_PACKAGE_/);
    assert.equal(typeof pkg.selectorSeed, "string");
    assert.equal(pkg.selectorSeed.length > 20, true);
    assert.equal(
      ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
        pkg.expectedRecipeId
      ),
      true
    );
  }
});

test("atlas regional package planning records are written with runtime still blocked", () => {
  moduleUnderTest.writeAtlasRegionalPackagePlanning({ cwd: repoRoot });

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
