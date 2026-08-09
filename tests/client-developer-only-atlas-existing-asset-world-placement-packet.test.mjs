import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket,
  getDeveloperOnlyAtlasExistingAssetWorldPlacementPacketStatus,
  resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket
} from "../client/developer-only-atlas-existing-asset-world-placement-packet.mjs";
import {
  createDeveloperOnlyAtlasControlledExistingAssetBinding,
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
import {
  createDeveloperOnlyAtlasMultiAssetPlacementProvider
} from "../client/developer-only-atlas-multi-asset-placement-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_71_EXISTING_ASSET_WORLD_PLACEMENT_PACKET.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-existing-asset-world-placement-packet.mjs"
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
  return resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution(
    createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract(),
    {
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
    }
  );
}

function getBindingResult({ placement, dryRun, selectedExistingAssetId }) {
  return resolveDeveloperOnlyAtlasControlledExistingAssetBinding(
    createDeveloperOnlyAtlasControlledExistingAssetBinding(),
    {
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
    }
  );
}

function resolveWorldPlacementPacket({
  placement,
  binding,
  packetRegistry,
  recipeId
}) {
  return resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    packetRegistry ?? createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: placement.coordinate,
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId:
        recipeId ??
        (placement.matchedFeatureClass === "civic_site"
          ? "BUILDING_CIVIC_RECIPE_001"
          : "COASTAL_LOCATION_RECIPE_001"),
      selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );
}

test("1. eucalyptus produces valid deterministic placement packet", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });

  const result = resolveWorldPlacementPacket({ placement, binding });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.resolvedLodProfile, "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001");
});

test("2. bottlebrush produces valid deterministic placement packet", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });

  const result = resolveWorldPlacementPacket({ placement, binding });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "TREE_BOTTLEBRUSH_001");
  assert.equal(result.resolvedGlbIdentity, "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb");
});

test("3. coastal shrub produces valid deterministic placement packet", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "SHRUB_COASTAL_LOW_001"
  });

  const result = resolveWorldPlacementPacket({ placement, binding });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(result.placementTransformStatus, "valid");
});

test("4. civic pavilion produces valid deterministic placement packet", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  const result = resolveWorldPlacementPacket({ placement, binding });

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
  assert.equal([0, 90, 180, 270].includes(result.heading), true);
});

test("5. invalid coordinate fails closed", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });

  const result = resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: { latitude: 200, longitude: 144.34905 },
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INVALID_WORLD_PLACEMENT_COORDINATE");
});

test("6. invalid transform fails closed", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });

  const packetRegistry = createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket({
    placementProvider: createDeveloperOnlyAtlasMultiAssetPlacementProvider({
      coordinateProjectionProvider: () => ({
        x: Number.NaN,
        y: Number.NaN,
        projectionPath: "broken_projection"
      })
    })
  });

  const result = resolveWorldPlacementPacket({
    placement,
    binding,
    packetRegistry
  });

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INVALID_WORLD_PLACEMENT_TRANSFORM");
});

test("7. incorrect GLB or LOD identity fails closed", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });

  const wrongLodResult = resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: placement.coordinate,
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId: "BUILDING_CIVIC_RECIPE_001",
      selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
      resolvedLodProfile: "LOD_PROFILE_WRONG_001",
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );

  const wrongGlbResult = resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: placement.coordinate,
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId: "BUILDING_CIVIC_RECIPE_001",
      selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: "WRONG.glb"
    }
  );

  assert.equal(wrongLodResult.matched, false);
  assert.equal(wrongLodResult.reasonCode, "BOUND_LOD_IDENTITY_MISMATCH");
  assert.equal(wrongGlbResult.matched, false);
  assert.equal(wrongGlbResult.reasonCode, "BOUND_GLB_IDENTITY_MISMATCH");
});

test("8. same input same output", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });

  const first = resolveWorldPlacementPacket({ placement, binding });
  const second = resolveWorldPlacementPacket({ placement, binding });

  assert.deepEqual(first, second);
});

test("9. existing-asset binding regression remains green", () => {
  const packetRegistry = createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket();
  const status = getDeveloperOnlyAtlasExistingAssetWorldPlacementPacketStatus(
    packetRegistry
  );
  const source = fs.readFileSync(sessionDocPath, "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /worldPlacementPacketId/);
  assert.match(source, /selectedExistingAssetId/);
  assert.match(source, /resolvedLodProfile/);
  assert.match(source, /resolvedGlbIdentity/);
  assert.match(source, /placementTransformStatus/);
  assert.match(source, /worldPlacementStatus/);
  assert.doesNotMatch(moduleSource, /child_process|spawn\(|exec\(|execFile\(/);
  assert.doesNotMatch(moduleSource, /writeFile|mkdir|copyFile|rename|appendFile/);
  assert.doesNotMatch(moduleSource, /Blender|blender/);
});

test("10. planner regression remains green", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });
  const result = resolveWorldPlacementPacket({ placement, binding });

  assert.equal(result.worldPlacementStatus, "resolved");
  assert.equal(typeof result.worldPosition.x, "number");
  assert.equal(typeof result.worldPosition.y, "number");
  assert.equal(result.sourceFeatureId, placement.featureId);
});
