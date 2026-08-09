import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasControlledExistingAssetBinding,
  getDeveloperOnlyAtlasControlledExistingAssetBindingStatus,
  resolveDeveloperOnlyAtlasControlledExistingAssetBinding
} from "../client/developer-only-atlas-controlled-existing-asset-binding-contract.mjs";
import {
  createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract,
  resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution
} from "../client/developer-only-atlas-asset-factory-dry-run-execution-contract.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_70_CONTROLLED_EXISTING_ASSET_BINDING.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-existing-asset-binding-contract.mjs"
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
    selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
    viewportId: "EXISTING_ASSET_BINDING_VIEWPORT_001",
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

function getResolvedPlacement(kind = "coastal") {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const features =
    kind === "civic"
      ? [
          feature({
            featureId: "civic-plan-001",
            featureClass: "civic_site",
            latitude: -38.13545,
            longitude: 144.34935,
            sourceClassification: "amenity:community_centre"
          })
        ]
      : [
          feature({
            featureId: "coastal-plan-001",
            featureClass: "coastal_green",
            sourceClassification: "green:near_coast"
          })
        ];
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features,
      relationshipContext: { roadWays: [{ id: "road-1" }] }
    })
  );
  return {
    ...plan.resolvedFeatureRecipes[0],
    coordinate: features[0].coordinate
  };
}

function getDryRunResult(placement) {
  const registry = createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract();
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
    modularBibleFamilyId: placement.modularBibleFamilyId
  });
}

function resolveBinding({
  placement,
  dryRun,
  selectedExistingAssetId
}) {
  const registry = createDeveloperOnlyAtlasControlledExistingAssetBinding();
  return resolveDeveloperOnlyAtlasControlledExistingAssetBinding(registry, {
    dryRunExecutionId: dryRun.dryRunExecutionId,
    dryRunStatus: dryRun.dryRunStatus,
    expectedAssetId: dryRun.expectedAssetId,
    selectedExistingAssetId,
    assetFamilyId: placement.assetFamilyId,
    materialFamilyId: placement.materialFamilyId,
    paletteProfileId: placement.paletteProfileId,
    matchedFeatureClass: placement.matchedFeatureClass,
    selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
    deterministicFeatureIdentity: placement.featureId,
    coordinate: placement.coordinate,
    candidateIndex: 0
  });
}

test("1. TREE_EUCALYPTUS_001 binds successfully where compatible", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
});

test("2. TREE_BOTTLEBRUSH_001 binds successfully where compatible", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "TREE_BOTTLEBRUSH_001");
});

test("3. SHRUB_COASTAL_LOW_001 binds successfully where compatible", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "SHRUB_COASTAL_LOW_001"
  });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "SHRUB_COASTAL_LOW_001");
});

test("4. BUILDING_CIVIC_SPORTS_PAVILION_001 binds successfully where compatible", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  assert.equal(result.matched, true);
  assert.equal(
    result.selectedExistingAssetId,
    "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );
});

test("5. incompatible asset fails closed", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INCOMPATIBLE_MODULAR_ASSET_BINDING");
});

test("6. missing asset fails closed", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const result = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "MISSING_APPROVED_ASSET_001"
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "UNKNOWN_ASSET_ID");
});

test("7. same input same output", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const first = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });
  const second = resolveBinding({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });

  assert.deepEqual(first, second);
});

test("8. dry-run regression band stays green", () => {
  const registry = createDeveloperOnlyAtlasControlledExistingAssetBinding();
  const status =
    getDeveloperOnlyAtlasControlledExistingAssetBindingStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /existingAssetBindingId/);
  assert.match(source, /selectedExistingAssetId/);
  assert.match(source, /assetRegistryMatchStatus/);
  assert.match(source, /assetManifestMatchStatus/);
  assert.match(source, /resolvedLodProfile/);
  assert.match(source, /resolvedGlbIdentity/);
  assert.match(source, /existingAssetBindingStatus/);
  assert.match(source, /existingAssetBindingReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
  assert.doesNotMatch(moduleSource, /child_process|spawn\(|exec\(|execFile\(/);
  assert.doesNotMatch(moduleSource, /writeFile|mkdir|copyFile|rename|appendFile/);
  assert.doesNotMatch(moduleSource, /Blender|blender/);
});
