import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const performanceRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001"
);

const specificationPath = path.join(
  performanceRoot,
  "specification/atlas-world-generation-cost-performance-specification.json"
);
const assumptionsPath = path.join(
  performanceRoot,
  "assumptions/atlas-world-generation-cost-model-assumptions.json"
);
const validationPath = path.join(
  performanceRoot,
  "validation/atlas-world-generation-cost-performance-validation.json"
);
const reportPath = path.join(
  performanceRoot,
  "reports/atlas-world-generation-cost-performance-scaling-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-world-generation-cost-performance-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas world generation cost performance planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasWorldGenerationCostPerformancePlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasWorldGenerationCostPerformancePlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.assumptions, second.assumptions);
  assert.deepEqual(first.validation, second.validation);
});

test("atlas world generation cost performance planning captures package, generation, preview, cache, backend, reuse, and refresh expectations", () => {
  const planning = moduleUnderTest.buildAtlasWorldGenerationCostPerformancePlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(
    specification.regionalPackageEnvelope.averageCompressedPackageKb > 0,
    true
  );
  assert.equal(specification.recipeGenerationProfile.averageGenerationKb > 0, true);
  assert.equal(specification.previewPayloadProfile.averagePreviewKb > 0, true);
  assert.equal(
    specification.deviceCacheRequirements.standardProfile.warmPackageCount,
    24
  );
  assert.equal(
    specification.deviceCacheRequirements.constrainedProfile.warmPackageCount,
    12
  );
  assert.equal(
    specification.backendProcessingExpectations.blockedPackageShortCircuitBeforeClassification,
    true
  );
  assert.equal(
    specification.multiplayerRegionReuse.sharedRegionPackageByRegionId,
    true
  );
  assert.equal(
    specification.refreshFrequencyExpectations.normalRefreshWindow,
    "24h"
  );
});

test("atlas world generation cost performance planning uses reuse-first backend cost assumptions", () => {
  const planning = moduleUnderTest.buildAtlasWorldGenerationCostPerformancePlanning({
    cwd: repoRoot
  });
  const assumptions = planning.assumptions;

  assert.equal(
    assumptions.firebaseBackendConsiderations.pricingInputsMode,
    "assumption_only_no_live_pricing_lookup"
  );
  assert.equal(
    assumptions.firebaseBackendConsiderations.mitigationRules.includes(
      "reuse packages by regionId and fingerprint"
    ),
    true
  );
  assert.equal(
    assumptions.firebaseBackendConsiderations.mitigationRules.includes(
      "reuse preview payloads by deterministic recipe fingerprint"
    ),
    true
  );
  assert.equal(assumptions.scalingAssumptions.packageCacheHitTarget >= 0.8, true);
});

test("atlas world generation cost performance planning writes records and passes validation with runtime blocked", () => {
  moduleUnderTest.writeAtlasWorldGenerationCostPerformancePlanning({
    cwd: repoRoot
  });

  const specification = readJson(specificationPath);
  const assumptions = readJson(assumptionsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(
    specification.regionalPackageEnvelope.peakCompressedPackageKb <=
      specification.regionalPackageEnvelope.standardProfileMaxKb,
    true
  );
  assert.equal(
    assumptions.backendProcessingAssumptions.blockedPackageProcessingBudgetClass,
    "VERY_LOW"
  );
  assert.match(report, /Future Atlas engineering: READY/);
  assert.match(report, /Runtime activation: BLOCKED/);
});
