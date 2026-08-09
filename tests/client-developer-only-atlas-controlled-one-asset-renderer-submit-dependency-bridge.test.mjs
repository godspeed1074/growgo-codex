import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge
} from "../client/developer-only-atlas-controlled-one-asset-renderer-submit-dependency-bridge.mjs";
import {
  createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge
} from "../client/developer-only-atlas-controlled-one-asset-load-dependency-bridge.mjs";
import {
  createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff,
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
  "GROWGO_SESSION_212_76_RENDERER_SUBMIT_DEPENDENCY_BRIDGE.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-one-asset-renderer-submit-dependency-bridge.mjs"
);

function feature({
  featureId = "feature-001",
  featureClass = "coastal_green",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "green:near_coast"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint: null,
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_SELECTOR_001",
    viewportId: "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_VIEWPORT_001",
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

function getResolvedPlacement() {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const features = [
    feature({
      featureId: "coastal-submit-001",
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

function getBindingResult({ placement, selectedExistingAssetId = "TREE_EUCALYPTUS_001" }) {
  const dryRun = getDryRunResult(placement);
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
      selectorSeed: "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_SELECTOR_001",
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
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );
}

function getRendererHandoff() {
  const placement = getResolvedPlacement();
  const binding = getBindingResult({ placement });
  const packet = getWorldPlacementPacket({ placement, binding });
  return resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
    createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(),
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

function getLoadedAsset(rendererHandoff) {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  return bridge.loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff,
    approvedAssetRecord: Object.freeze({
      assetId: "TREE_EUCALYPTUS_001",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
      manifestVersion: "v001",
      resolvedGlbIdentity:
        "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      resolvedLodProfile: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001"
    }),
    resolvedAsset: Object.freeze({
      selectedExistingAssetId: rendererHandoff.selectedExistingAssetId,
      resolvedGlbIdentity: rendererHandoff.resolvedGlbIdentity,
      resolvedLodProfile: rendererHandoff.resolvedLodProfile
    })
  });
}

function getApprovedAssetRecord() {
  return Object.freeze({
    assetId: "TREE_EUCALYPTUS_001",
    manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
    manifestVersion: "v001",
    resolvedGlbIdentity:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    resolvedLodProfile: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001"
  });
}

test("1. valid eucalyptus submit dependency resolves", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge();
  const rendererHandoff = getRendererHandoff();
  const loadedAsset = getLoadedAsset(rendererHandoff);
  const result = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });

  assert.equal(result.outcome, "submitted");
  assert.equal(result.reasonCode, "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_RESOLVED");
  assert.equal(result.rendererSubmitStatus, "submitted");
  assert.equal(result.renderedAssetCount, 1);
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
});

test("2. missing submit dependency fails closed", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge({
      passiveRendererConsumer: null
    });
  const rendererHandoff = getRendererHandoff();
  const loadedAsset = getLoadedAsset(rendererHandoff);
  const result = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(
    result.reasonCode,
    "ONE_ASSET_LIVE_DRAW_RENDERER_SUBMIT_DEPENDENCY_UNAVAILABLE"
  );
});

test("3. invalid renderer identity fails closed", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge({
      rendererConsumerDescriptor: Object.freeze({
        schemaId: "GROWGO_CUSTOM_25D_RENDERER_CONSUMER_DESCRIPTOR_001",
        rendererId: "WRONG_RENDERER",
        drawEntryPoint: "drawCustom25DMapCanvas",
        passiveHandoffOnly: true
      })
    });
  const rendererHandoff = getRendererHandoff();
  const loadedAsset = getLoadedAsset(rendererHandoff);
  const result = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "RENDERER_IDENTITY_MISMATCH");
});

test("4. invalid transform fails closed", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge();
  const rendererHandoff = {
    ...getRendererHandoff(),
    rendererPlacementDescriptor: {
      ...getRendererHandoff().rendererPlacementDescriptor,
      projectedPlacementData: {
        ...getRendererHandoff().rendererPlacementDescriptor.projectedPlacementData,
        position: { x: Number.NaN, y: 15 }
      }
    }
  };
  const loadedAsset = getLoadedAsset(getRendererHandoff());
  const result = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "INVALID_FIELD_TYPE");
});

test("5. same input same output", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge();
  const rendererHandoff = getRendererHandoff();
  const loadedAsset = getLoadedAsset(rendererHandoff);

  const first = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });
  const second = bridge.submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord: getApprovedAssetRecord()
  });

  assert.equal(first.reasonCode, second.reasonCode);
  assert.equal(first.rendererSubmitStatus, second.rendererSubmitStatus);
  assert.equal(first.renderedAssetCount, second.renderedAssetCount);
  assert.deepEqual(first.passiveRendererPayload, second.passiveRendererPayload);
});

test("6. no automatic draw occurs", () => {
  const bridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge();
  const status =
    bridge.getControlledOneAssetLiveDrawRendererSubmitDependencyStatus();

  assert.equal(status.oneAssetLiveDrawRendererSubmitDependencyStatus, "idle");
  assert.equal(status.submitAttemptCount, 0);
  assert.equal(status.submitCompletedCount, 0);
});

test("7. session doc and source preserve eucalyptus-only controlled submit scope", () => {
  const docSource = fs.readFileSync(sessionDocPath, "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.match(docSource, /TREE_EUCALYPTUS_001/);
  assert.match(docSource, /fail closed/i);
  assert.match(moduleSource, /CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_ID/);
  assert.doesNotMatch(moduleSource, /TREE_BOTTLEBRUSH_001|SHRUB_COASTAL_LOW_001|BUILDING_CIVIC_SPORTS_PAVILION_001/);
});
