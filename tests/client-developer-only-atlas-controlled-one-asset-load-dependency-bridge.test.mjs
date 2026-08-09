import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge
} from "../client/developer-only-atlas-controlled-one-asset-load-dependency-bridge.mjs";
import {
  createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff,
  resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff
} from "../client/developer-only-atlas-controlled-existing-asset-renderer-handoff.mjs";
import {
  createDeveloperOnlyAtlasControlledExistingAssetBinding
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
import {
  resolveDeveloperOnlyAtlasControlledExistingAssetBinding
} from "../client/developer-only-atlas-controlled-existing-asset-binding-contract.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_75_CONTROLLED_ASSET_LOAD_DEPENDENCY_BRIDGE.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-one-asset-load-dependency-bridge.mjs"
);

function feature() {
  return {
    featureId: "coastal-plan-001",
    featureClass: "coastal_green",
    coordinate: { latitude: -38.13565, longitude: 144.34905 },
    area: 220,
    footprintScalars: { width: 40, height: 20 },
    orientationHint: null,
    deterministicFeatureIdentity: "coastal-plan-001",
    sourceClassification: "green:near_coast"
  };
}

function buildInputs() {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(planner, {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "ONE_ASSET_LOAD_DEPENDENCY_SELECTOR_001",
    viewportId: "ONE_ASSET_LOAD_DEPENDENCY_VIEWPORT_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [feature()],
    relationshipContext: { roadWays: [{ id: "road-1" }] }
  });

  const placement = {
    ...plan.resolvedFeatureRecipes[0],
    coordinate: feature().coordinate
  };
  const dryRun = resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution(
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
  const binding = resolveDeveloperOnlyAtlasControlledExistingAssetBinding(
    createDeveloperOnlyAtlasControlledExistingAssetBinding(),
    {
      dryRunExecutionId: dryRun.dryRunExecutionId,
      dryRunStatus: dryRun.dryRunStatus,
      expectedAssetId: dryRun.expectedAssetId,
      selectedExistingAssetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: placement.assetFamilyId,
      materialFamilyId: placement.materialFamilyId,
      paletteProfileId: placement.paletteProfileId,
      matchedFeatureClass: placement.matchedFeatureClass,
      selectorSeed: "ONE_ASSET_LOAD_DEPENDENCY_SELECTOR_001",
      deterministicFeatureIdentity: placement.featureId,
      coordinate: placement.coordinate,
      candidateIndex: 0
    }
  );
  const packet = resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
    createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
    {
      existingAssetBindingStatus: binding.existingAssetBindingStatus,
      selectedExistingAssetId: binding.selectedExistingAssetId,
      sourceFeatureId: placement.featureId,
      coordinate: placement.coordinate,
      regionId: "BELLARINE",
      packageId: "ATLAS_DEVELOPER_PACKAGE",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectorSeed: "ONE_ASSET_LOAD_DEPENDENCY_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );
  const handoff = resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
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

  return { placement, binding, handoff };
}

test("1. eucalyptus dependency resolves", () => {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  const { handoff, binding } = buildInputs();

  const result = bridge.loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff: handoff,
    approvedAssetRecord: {
      assetId: binding.selectedExistingAssetId,
      resolvedGlbIdentity: binding.resolvedGlbIdentity,
      resolvedLodProfile: binding.resolvedLodProfile,
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
      manifestVersion: "v001"
    },
    resolvedAsset: {
      selectedExistingAssetId: binding.selectedExistingAssetId,
      resolvedGlbIdentity: binding.resolvedGlbIdentity,
      resolvedLodProfile: binding.resolvedLodProfile
    }
  });

  assert.equal(result.outcome, "resolved");
  assert.equal(result.assetLoadStatus, "resolved_dependency_bridge");
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
});

test("2. missing asset fails closed", () => {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  const { handoff } = buildInputs();

  const result = bridge.loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff: {
      ...handoff,
      selectedExistingAssetId: "TREE_NOT_PRESENT_999"
    }
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ASSET_MISSING");
});

test("3. wrong GLB fails closed", () => {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  const { handoff } = buildInputs();

  const result = bridge.loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff: {
      ...handoff,
      resolvedGlbIdentity: "WRONG.glb"
    },
    approvedAssetRecord: {
      assetId: "TREE_EUCALYPTUS_001",
      resolvedGlbIdentity:
        "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      resolvedLodProfile: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
      manifestVersion: "v001"
    }
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "GLB_IDENTITY_MISMATCH");
});

test("4. wrong LOD fails closed", () => {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  const { handoff } = buildInputs();

  const result = bridge.loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff: {
      ...handoff,
      resolvedLodProfile: "LOD_PROFILE_WRONG"
    },
    approvedAssetRecord: {
      assetId: "TREE_EUCALYPTUS_001",
      resolvedGlbIdentity:
        "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      resolvedLodProfile: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
      manifestVersion: "v001"
    }
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "LOD_IDENTITY_MISMATCH");
});

test("5. no automatic load occurs", () => {
  const bridge = createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge();
  const status = bridge.getControlledOneAssetLiveDrawAssetLoadDependencyStatus();

  assert.equal(status.oneAssetLiveDrawAssetLoadDependencyStatus, "idle");
  assert.equal(status.assetLoadAttemptCount, 0);
  assert.equal(status.assetLoadCompletedCount, 0);
});

test("6. session doc and source preserve eucalyptus-only developer bridge scope", () => {
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const docSource = fs.readFileSync(sessionDocPath, "utf8");

  assert.match(moduleSource, /TREE_EUCALYPTUS_001/);
  assert.match(moduleSource, /CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_LOADER_ID/);
  assert.match(docSource, /TREE_EUCALYPTUS_001/);
  assert.match(docSource, /fail closed/i);
});
