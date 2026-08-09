import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff,
  getDeveloperOnlyAtlasControlledExistingAssetRendererHandoffStatus,
  resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff
} from "../client/developer-only-atlas-controlled-existing-asset-renderer-handoff.mjs";
import {
  createDeveloperOnlyAtlasControlledExistingAssetBinding,
  resolveDeveloperOnlyAtlasControlledExistingAssetBinding
} from "../client/developer-only-atlas-controlled-existing-asset-binding-contract.mjs";
import {
  createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract,
  resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution
} from "../client/developer-only-atlas-asset-factory-dry-run-execution-contract.mjs";
import {
  createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket,
  resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket
} from "../client/developer-only-atlas-existing-asset-world-placement-packet.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_72_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-existing-asset-renderer-handoff.mjs"
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

function getWorldPlacementPacket({ placement, binding }) {
  return resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: placement.coordinate,
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId:
        placement.matchedFeatureClass === "civic_site"
          ? "BUILDING_CIVIC_RECIPE_001"
          : "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "EXISTING_ASSET_BINDING_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );
}

function resolveRendererHandoff(packet, registry) {
  return resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
    registry ?? createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(),
    {
      worldPlacementStatus: packet.worldPlacementStatus,
      sourceWorldPlacementPacketId: packet.worldPlacementPacketId,
      selectedExistingAssetId: packet.selectedExistingAssetId,
      sourceFeatureId: packet.sourceFeatureId,
      worldPosition: packet.worldPosition,
      projectedPlacementData: packet.projectedPlacementData,
      rotation: packet.rotation,
      heading: packet.heading,
      scale: packet.scale,
      resolvedGlbIdentity: packet.resolvedGlbIdentity,
      resolvedLodProfile: packet.resolvedLodProfile
    }
  );
}

test("1. eucalyptus handoff succeeds", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveRendererHandoff(packet);

  assert.equal(result.matched, true);
  assert.equal(result.rendererHandoffStatus, "ready_for_future_renderer_attachment");
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
});

test("2. bottlebrush handoff succeeds", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveRendererHandoff(packet);

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "TREE_BOTTLEBRUSH_001");
});

test("3. coastal shrub handoff succeeds", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "SHRUB_COASTAL_LOW_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveRendererHandoff(packet);

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "SHRUB_COASTAL_LOW_001");
});

test("4. civic pavilion handoff succeeds", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveRendererHandoff(packet);

  assert.equal(result.matched, true);
  assert.equal(result.selectedExistingAssetId, "BUILDING_CIVIC_SPORTS_PAVILION_001");
});

test("5. bad transform fails closed", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
    createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(),
    {
      ...packet,
      sourceWorldPlacementPacketId: packet.worldPlacementPacketId,
      worldPosition: { x: Number.NaN, y: packet.worldPosition.y }
    }
  );

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "INVALID_WORLD_PLACEMENT_TRANSFORM");
});

test("6. GLB mismatch fails closed", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
    createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(),
    {
      ...packet,
      sourceWorldPlacementPacketId: packet.worldPlacementPacketId,
      resolvedGlbIdentity: "WRONG.glb"
    }
  );

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "GLB_IDENTITY_MISMATCH");
});

test("7. LOD mismatch fails closed", () => {
  const placement = getResolvedPlacement("civic");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
    createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(),
    {
      ...packet,
      sourceWorldPlacementPacketId: packet.worldPlacementPacketId,
      resolvedLodProfile: "LOD_PROFILE_WRONG_001"
    }
  );

  assert.equal(result.matched, false);
  assert.equal(result.reasonCode, "LOD_IDENTITY_MISMATCH");
});

test("8. same input same output", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });

  const first = resolveRendererHandoff(packet);
  const second = resolveRendererHandoff(packet);

  assert.deepEqual(first, second);
});

test("9. world-placement regression remains green", () => {
  const registry = createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff();
  const status =
    getDeveloperOnlyAtlasControlledExistingAssetRendererHandoffStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.canonicalSafetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /rendererHandoffPacketId/);
  assert.match(source, /sourceWorldPlacementPacketId/);
  assert.match(source, /selectedExistingAssetId/);
  assert.match(source, /resolvedGlbIdentity/);
  assert.match(source, /resolvedLodProfile/);
  assert.match(source, /rendererPlacementDescriptorStatus/);
  assert.match(source, /rendererHandoffStatus/);
  assert.doesNotMatch(moduleSource, /child_process|spawn\(|exec\(|execFile\(/);
  assert.doesNotMatch(moduleSource, /writeFile|mkdir|copyFile|rename|appendFile/);
  assert.doesNotMatch(moduleSource, /Blender|blender/);
});

test("10. controlled renderer regression remains green", () => {
  const placement = getResolvedPlacement("coastal");
  const dryRun = getDryRunResult(placement);
  const binding = getBindingResult({
    placement,
    dryRun,
    selectedExistingAssetId: "TREE_EUCALYPTUS_001"
  });
  const packet = getWorldPlacementPacket({ placement, binding });
  const result = resolveRendererHandoff(packet);

  assert.equal(result.rendererPlacementDescriptor.schemaId, "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_RENDERER_PLACEMENT_DESCRIPTOR_001");
  assert.equal(result.rendererConsumerDescriptor.schemaId, "GROWGO_CUSTOM_25D_RENDERER_CONSUMER_DESCRIPTOR_001");
  assert.equal(result.rendererConsumerDescriptor.passiveHandoffOnly, true);
  assert.equal(result.rendererPlacementDescriptor.drawReady, false);
});
