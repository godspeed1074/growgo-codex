import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION,
  CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW,
  DRAW_CONTROLLED_ONE_ASSET_LIVE,
  createDeveloperOnlyAtlasControlledOneAssetLiveDraw,
  installDeveloperOnlyAtlasControlledOneAssetLiveDraw
} from "../client/developer-only-atlas-controlled-one-asset-live-draw.mjs";
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
  "GROWGO_SESSION_212_73_CONTROLLED_ONE_ASSET_LIVE_DRAW.md"
);
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-one-asset-live-draw.mjs"
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
    selectorSeed: "CONTROLLED_ONE_ASSET_LIVE_DRAW_SELECTOR_001",
    viewportId: "CONTROLLED_ONE_ASSET_LIVE_DRAW_VIEWPORT_001",
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
      selectorSeed: "CONTROLLED_ONE_ASSET_LIVE_DRAW_SELECTOR_001",
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
      selectorSeed: "CONTROLLED_ONE_ASSET_LIVE_DRAW_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );
}

function getValidRendererHandoff() {
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

function getValidPersistentStatus() {
  return Object.freeze({
    attached: true,
    integrationState: "attached_idle",
    authorizationState: "attach_permission_consumed",
    redrawPermissionAllowed: true,
    lifecycleOwnerId: "LIFECYCLE_OWNER_001",
    sessionId: "PERSISTENT_SESSION_001",
    mapIdentityId: "MAP_IDENTITY_001",
    ownedCanvasCount: 1,
    ownedPaneCount: 1,
    retainedSurfaceState: "ready",
    canonicalSafetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createCommandHarness(overrides = {}) {
  const counters = {
    resolve: 0,
    load: 0,
    submit: 0,
    cleanup: 0
  };
  const command = createDeveloperOnlyAtlasControlledOneAssetLiveDraw({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider:
      overrides.persistentAtlasStatusProvider ?? (() => getValidPersistentStatus()),
    assetResolverProvider:
      overrides.assetResolverProvider ??
      (({ rendererHandoff, approvedAssetRecord }) => {
        counters.resolve += 1;
        return Object.freeze({
          assetResolverStatus: "resolved_existing_asset",
          selectedExistingAssetId: approvedAssetRecord.assetId,
          resolvedGlbIdentity: approvedAssetRecord.resolvedGlbIdentity,
          resolvedLodProfile: approvedAssetRecord.resolvedLodProfile,
          worldPosition: rendererHandoff.worldPosition
        });
      }),
    assetLoadProvider:
      overrides.assetLoadProvider ??
      (({ approvedAssetRecord }) => {
        counters.load += 1;
        return Object.freeze({
          assetLoadStatus: "loaded",
          selectedExistingAssetId: approvedAssetRecord.assetId
        });
      }),
    rendererSubmitProvider:
      overrides.rendererSubmitProvider ??
      (({ approvedAssetRecord, rendererHandoff }) => {
        counters.submit += 1;
        return Object.freeze({
          rendererSubmitStatus: "submitted",
          renderedAssetCount: 1,
          selectedExistingAssetId: approvedAssetRecord.assetId,
          worldPosition: rendererHandoff.worldPosition
        });
      }),
    cleanupProvider:
      overrides.cleanupProvider ??
      (() => {
        counters.cleanup += 1;
        return Object.freeze({
          cleanupStatus: "released",
          resourcesReleased: true
        });
      })
  });

  return { command, counters };
}

test("1. unauthorized draw fails closed", () => {
  const { command } = createCommandHarness();
  const handoff = getValidRendererHandoff();

  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "CONTROLLED_LIVE_DRAW_AUTHORIZATION_UNAVAILABLE");
});

test("2. valid eucalyptus handoff can be accepted", () => {
  const { command, counters } = createCommandHarness();
  const handoff = getValidRendererHandoff();

  const authorizeResult = command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(authorizeResult.outcome, "authorized");
  assert.equal(result.outcome, "drawn");
  assert.equal(result.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.rendererSubmitStatus, "submitted");
  assert.equal(result.renderedAssetCount, 1);
  assert.equal(counters.resolve, 1);
  assert.equal(counters.load, 1);
  assert.equal(counters.submit, 1);
});

test("3. one asset only can be submitted", () => {
  const { command } = createCommandHarness();
  const handoff = {
    ...getValidRendererHandoff(),
    selectedExistingAssetId: "TREE_BOTTLEBRUSH_001"
  };

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "ONLY_ONE_ASSET_SUPPORTED");
});

test("4. GLB mismatch fails closed", () => {
  const { command } = createCommandHarness();
  const handoff = {
    ...getValidRendererHandoff(),
    resolvedGlbIdentity: "WRONG.glb"
  };

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "GLB_IDENTITY_MISMATCH");
});

test("5. LOD mismatch fails closed", () => {
  const { command } = createCommandHarness();
  const handoff = {
    ...getValidRendererHandoff(),
    resolvedLodProfile: "LOD_PROFILE_WRONG"
  };

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "LOD_IDENTITY_MISMATCH");
});

test("6. invalid transform fails closed", () => {
  const { command } = createCommandHarness();
  const handoff = {
    ...getValidRendererHandoff(),
    rendererPlacementDescriptor: {
      ...getValidRendererHandoff().rendererPlacementDescriptor,
      worldPosition: { x: Number.NaN, y: 12 }
    }
  };

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "INVALID_WORLD_PLACEMENT_TRANSFORM");
});

test("7. cleanup releases created resources", () => {
  const { command, counters } = createCommandHarness();
  const handoff = getValidRendererHandoff();

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });
  const clearResult = command.clearControlledOneAssetLiveDraw({
    confirmation: CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW
  });

  assert.equal(clearResult.outcome, "cleared");
  assert.equal(clearResult.cleanupStatus, "released");
  assert.equal(counters.cleanup, 1);
  assert.equal(
    command.getControlledOneAssetLiveDrawStatus().resourcesActive,
    false
  );
});

test("8. second draw without cleanup is rejected safely", () => {
  const { command } = createCommandHarness();
  const handoff = getValidRendererHandoff();

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const first = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });
  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const second = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(first.outcome, "drawn");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "CONTROLLED_LIVE_DRAW_ALREADY_ACTIVE");
});

test("9. cleanup still runs on submit failure after asset load", () => {
  const { command, counters } = createCommandHarness({
    rendererSubmitProvider() {
      counters.submit += 1;
      throw Object.assign(new Error("RENDERER_SUBMIT_FAILED"), {
        reasonCode: "RENDERER_SUBMIT_FAILED"
      });
    }
  });
  const handoff = getValidRendererHandoff();

  command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "RENDERER_SUBMIT_FAILED");
  assert.equal(result.cleanupStatus, "released");
  assert.equal(counters.cleanup, 1);
});

test("10. installer exposes the required diagnostics commands", () => {
  const { command } = createCommandHarness();
  const globalObject = {};

  const namespace = installDeveloperOnlyAtlasControlledOneAssetLiveDraw({
    globalObject,
    command,
    hostnameProvider: () => "localhost"
  });

  assert.equal(typeof namespace.getControlledOneAssetLiveDrawStatus, "function");
  assert.equal(typeof namespace.authorizeControlledOneAssetLiveDraw, "function");
  assert.equal(typeof namespace.drawControlledOneAssetLive, "function");
  assert.equal(typeof namespace.clearControlledOneAssetLiveDraw, "function");
  assert.equal(
    namespace.getControlledOneAssetLiveDrawStatus().canonicalSafetyFlags
      .runtimeExecutionEnabled,
    false
  );
});

test("existing renderer handoff regression remains green", () => {
  const handoff = getValidRendererHandoff();
  assert.equal(handoff.rendererHandoffStatus, "ready_for_future_renderer_attachment");
  assert.equal(handoff.selectedExistingAssetId, "TREE_EUCALYPTUS_001");
});

test("session doc and source preserve developer-only one-asset boundaries", () => {
  const docSource = fs.readFileSync(sessionDocPath, "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");

  assert.match(docSource, /TREE_EUCALYPTUS_001/);
  assert.match(docSource, /draw exactly ONE approved asset/i);
  assert.match(docSource, /no startup draw/i);
  assert.match(moduleSource, /AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION/);
  assert.match(moduleSource, /DRAW_CONTROLLED_ONE_ASSET_LIVE/);
  assert.match(moduleSource, /CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW/);
  assert.doesNotMatch(moduleSource, /\bsetTimeout\b|\bsetInterval\b/);
});
