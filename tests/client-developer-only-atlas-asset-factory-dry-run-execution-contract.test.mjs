import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract,
  getDeveloperOnlyAtlasAssetFactoryDryRunExecutionContractStatus,
  resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution
} from "../client/developer-only-atlas-asset-factory-dry-run-execution-contract.mjs";
import {
  createDeveloperOnlyAtlasAssetFactoryBuildRecipes,
  DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPE_RULES
} from "../client/developer-only-atlas-asset-factory-build-recipes.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_69_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-asset-factory-dry-run-execution-contract.mjs"
);

function feature({
  featureId = "feature-001",
  featureClass = "coastal_green",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "green:near_coast"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "ASSET_FACTORY_DRY_RUN_SELECTOR_001",
    viewportId: "ASSET_FACTORY_DRY_RUN_VIEWPORT_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [],
    relationshipContext: { roadWays: [] },
    ...overrides
  };
}

function getValidatedPlacement() {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }] }
    })
  );
  return plan.resolvedFeatureRecipes[0];
}

function createDryRunRegistry(overrides = {}) {
  return createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract(overrides);
}

function resolveDryRun(overrides = {}, registry = createDryRunRegistry()) {
  const placement = getValidatedPlacement();
  return resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution(registry, {
    productionBundleId: placement.productionBundleId,
    assetJobTicketId: placement.assetJobTicketId,
    productionBatchId: placement.productionBatchId,
    assetBuildRecipeId: placement.assetBuildRecipeId,
    exportContractId: placement.exportContractId,
    assetPackageManifestId: placement.assetPackageManifestId,
    selectedAssetId: placement.selectedAssetId,
    componentRecipeId: placement.componentRecipeId,
    materialSlotSetId: placement.materialSlotSetId,
    attachmentMetadataProfileId: placement.attachmentMetadataProfileId,
    glbPreparationProfileId: placement.glbPreparationProfileId,
    modularBibleFamilyId: placement.modularBibleFamilyId,
    ...overrides
  });
}

test("1. valid job dry run completes", () => {
  const result = resolveDryRun();

  assert.equal(result.matched, true);
  assert.equal(result.dryRunStatus, "completed");
  assert.equal(typeof result.dryRunExecutionId, "string");
  assert.equal(typeof result.expectedOutputFilename, "string");
});

test("2. missing dependency fails closed", () => {
  const alteredRules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPE_RULES.map(
    (rule) =>
      rule.assetBuildRecipeId === "ATLAS_BUILD_RECIPE_COASTAL_TREE_001" ||
      rule.assetBuildRecipeId ===
        "ATLAS_BUILD_RECIPE_COASTAL_TREE_COMPACT_001"
        ? { ...rule, dependencyCount: 2 }
        : rule
  );
  const registry = createDryRunRegistry({
    atlasAssetFactoryBuildRecipes:
      createDeveloperOnlyAtlasAssetFactoryBuildRecipes({
        rules: alteredRules
      })
  });

  const result = resolveDryRun({}, registry);

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "DRY_RUN_DEPENDENCY_VALIDATION_FAILED");
});

test("3. invalid manifest fails closed", () => {
  const result = resolveDryRun({
    assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_MISSING_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "DRY_RUN_MANIFEST_INVALID");
});

test("4. wrong export contract fails closed", () => {
  const result = resolveDryRun({
    exportContractId: "ATLAS_EXPORT_CONTRACT_WRONG_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "DRY_RUN_EXPORT_CONTRACT_MISMATCH");
});

test("5. same input gives same dry-run result", () => {
  const first = resolveDryRun();
  const second = resolveDryRun();

  assert.deepEqual(first, second);
});

test("6. no filesystem generation occurs", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  const result = resolveDryRun();
  const unexpectedOutputPath = path.join(repoRoot, result.expectedOutputFilename);

  assert.equal(fs.existsSync(unexpectedOutputPath), false);
  assert.doesNotMatch(source, /writeFile|mkdir|copyFile|rename|appendFile|createWriteStream/);
});

test("7. no subprocess or Blender execution occurs", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /child_process|spawn\(|exec\(|execFile\(/);
  assert.doesNotMatch(source, /Blender|blender/);
});

test("8. existing Asset Factory regression band stays green", () => {
  const registry = createDryRunRegistry();
  const status =
    getDeveloperOnlyAtlasAssetFactoryDryRunExecutionContractStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /dryRunExecutionId/);
  assert.match(source, /selectedJobTicketId/);
  assert.match(source, /selectedProductionBatchId/);
  assert.match(source, /resolvedBuildRecipeId/);
  assert.match(source, /resolvedExportContractId/);
  assert.match(source, /expectedAssetId/);
  assert.match(source, /expectedOutputFilename/);
  assert.match(source, /dependencyValidationStatus/);
  assert.match(source, /dryRunStatus/);
  assert.match(source, /dryRunReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
