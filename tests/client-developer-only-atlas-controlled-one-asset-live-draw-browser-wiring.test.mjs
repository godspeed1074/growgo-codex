import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION,
  DRAW_CONTROLLED_ONE_ASSET_LIVE
} from "../client/developer-only-atlas-controlled-one-asset-live-draw.mjs";
import {
  createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring,
  installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring
} from "../client/developer-only-atlas-controlled-one-asset-live-draw-browser-wiring.mjs";
import {
  createDeveloperOnlyAtlasControlledOneAssetLiveDraw
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
const browserWiringPath = path.join(
  repoRoot,
  "client/developer-only-atlas-controlled-one-asset-live-draw-browser-wiring.mjs"
);
const appPath = path.join(repoRoot, "client/development-alpha-app.mjs");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_74_ONE_ASSET_LIVE_DRAW_DIAGNOSTICS_WIRING.md"
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

function getValidRendererHandoff() {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(planner, {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "ONE_ASSET_LIVE_DRAW_WIRING_SELECTOR_001",
    viewportId: "ONE_ASSET_LIVE_DRAW_WIRING_VIEWPORT_001",
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
      selectorSeed: "ONE_ASSET_LIVE_DRAW_WIRING_SELECTOR_001",
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
      selectorSeed: "ONE_ASSET_LIVE_DRAW_WIRING_SELECTOR_001",
      rotationOverride: placement.orientationDecision ?? null,
      resolvedLodProfile: binding.resolvedLodProfile,
      resolvedGlbIdentity: binding.resolvedGlbIdentity
    }
  );

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
    retainedSurfaceState: "ready",
    canonicalSafetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

test("1. diagnostics commands are exposed", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });
  const globalObject = { GrowGoDeveloperDiagnostics: {} };

  const namespace = installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    globalObject,
    wiring,
    hostnameProvider: () => "localhost"
  });

  assert.equal(typeof namespace.authorizeControlledOneAssetLiveDraw, "function");
  assert.equal(typeof namespace.drawControlledOneAssetLive, "function");
  assert.equal(typeof namespace.clearControlledOneAssetLiveDraw, "function");
  assert.equal(typeof namespace.getControlledOneAssetLiveDrawStatus, "function");
  assert.equal(
    typeof namespace.getControlledOneAssetLiveDrawBrowserWiringStatus,
    "function"
  );
});

test("2. wrong confirmation fails closed", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });

  const result = wiring.command.authorizeControlledOneAssetLiveDraw({
    confirmation: "WRONG_CONFIRMATION"
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "INVALID_CONFIRMATION");
});

test("3. valid live dependency path submits one controlled eucalyptus draw", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });
  const handoff = getValidRendererHandoff();

  wiring.command.authorizeControlledOneAssetLiveDraw({
    confirmation: AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION
  });
  const result = wiring.command.drawControlledOneAssetLive({
    confirmation: DRAW_CONTROLLED_ONE_ASSET_LIVE,
    rendererHandoff: handoff
  });

  assert.equal(result.outcome, "drawn");
  assert.equal(result.reasonCode, "CONTROLLED_ONE_ASSET_LIVE_DRAW_COMPLETED");
  assert.equal(result.rendererSubmitStatus, "submitted");
  assert.equal(result.renderedAssetCount, 1);
});

test("4. existing 212.73 module remains source of truth", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });
  const baseStatus = wiring.__internal.baseCommand.getControlledOneAssetLiveDrawStatus();
  const wrappedStatus = wiring.command.getControlledOneAssetLiveDrawStatus();

  assert.equal(
    typeof wiring.__internal.baseCommand.authorizeControlledOneAssetLiveDraw,
    "function"
  );
  assert.equal(
    typeof wiring.__internal.baseCommand.drawControlledOneAssetLive,
    "function"
  );
  assert.equal(
    typeof wiring.command.drawControlledOneAssetLive,
    "function"
  );
  assert.equal(baseStatus.schemaId, wrappedStatus.schemaId);
  assert.equal(
    wrappedStatus.oneAssetLiveDrawCommandAvailable,
    true
  );
});

test("5. status is frozen and serializable", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });

  const status = wiring.command.getControlledOneAssetLiveDrawStatus();

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal(status.oneAssetLiveDrawCommandAvailable, true);
  assert.equal(status.oneAssetLiveDrawDependenciesAvailable, true);
  assert.equal(status.oneAssetLiveDrawBrowserWiringStatus, "ready");
  assert.equal(status.oneAssetLiveDrawAssetLoadDependencyStatus, "idle");
  assert.equal(status.oneAssetLiveDrawRendererSubmitDependencyStatus, "idle");
});

test("6. no raw browser objects leak through diagnostics", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });
  const status = wiring.command.getControlledOneAssetLiveDrawStatus();

  assert.equal("canvas" in status, false);
  assert.equal("map" in status, false);
  assert.equal("renderer" in status, false);
  assert.equal("leaflet" in status, false);
});

test("7. no startup draw occurs in browser wiring or app source", () => {
  const appSource = fs.readFileSync(appPath, "utf8");

  assert.match(appSource, /installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring/);
  assert.doesNotMatch(appSource, /import\s*\{\s*createDevelopmentAlphaFirebaseRuntime\s*\}/);
  assert.match(appSource, /await import\("\.\/development-alpha-runtime\.mjs"\)/);
  assert.doesNotMatch(appSource, /\.\s*authorizeControlledOneAssetLiveDraw\s*\(/);
  assert.doesNotMatch(appSource, /\.\s*drawControlledOneAssetLive\s*\(/);
  assert.doesNotMatch(appSource, /\bsetTimeout\b|\bsetInterval\b/);
});

test("8. browser status surfaces dependency availability explicitly", () => {
  const wiring = createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
    hostnameProvider: () => "localhost",
    persistentAtlasStatusProvider: () => getValidPersistentStatus()
  });
  const status = wiring.command.getControlledOneAssetLiveDrawStatus();
  const browserStatus =
    wiring.command.getControlledOneAssetLiveDrawBrowserWiringStatus();

  assert.equal(status.oneAssetLiveDrawBrowserWiringReason, browserStatus.oneAssetLiveDrawBrowserWiringReason);
  assert.equal(
    browserStatus.oneAssetLiveDrawBrowserWiringReason,
    "ONE_ASSET_LIVE_DRAW_BROWSER_WIRING_READY"
  );
  assert.equal(
    browserStatus.oneAssetLiveDrawAssetLoadDependencyStatus,
    "idle"
  );
  assert.equal(
    browserStatus.oneAssetLiveDrawRendererSubmitDependencyStatus,
    "idle"
  );
});

test("9. session doc and app wiring record developer-only diagnostics exposure", () => {
  const docSource = fs.readFileSync(sessionDocPath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");

  assert.match(docSource, /GrowGoDeveloperDiagnostics/);
  assert.match(docSource, /oneAssetLiveDrawCommandAvailable/);
  assert.match(docSource, /fail closed/i);
  assert.match(appSource, /createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring/);
  assert.match(appSource, /installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring/);
  assert.match(appSource, /controlledOneAssetInstallerAttempted/);
  assert.match(appSource, /controlledOneAssetInstallerResultIsNull/);
  assert.match(appSource, /controlledOneAssetInstallerResultType/);
  assert.match(appSource, /controlledOneAssetInstallerNamespaceKeys/);
  assert.match(appSource, /controlledOneAssetInstallerReturnedNamespace/);
  assert.match(appSource, /controlledOneAssetInstallerReturnStatus/);
  assert.match(appSource, /controlledOneAssetCommandAvailableAfterInstall/);
  assert.match(appSource, /controlledOneAssetCommandKeysAfterInstall/);
  assert.match(appSource, /custom25DOneFrameBridgeLookupStatus/);
  assert.match(appSource, /custom25DOneFrameBridgeLookupFailureReason/);
  assert.match(appSource, /atlasStartupCheckpointAfterEarlyBridge/);
  assert.match(appSource, /atlasStartupCheckpointAfterPersistentAtlasIntegration/);
  assert.match(appSource, /atlasStartupCheckpointAfterViewportPreview/);
  assert.match(appSource, /atlasStartupCheckpointBeforeOneAssetInstallerCall/);
  assert.match(appSource, /atlasStartupCheckpointAfterOneAssetInstallerCall/);
  assert.match(appSource, /atlasStartupLastReachedCheckpoint/);
  assert.match(appSource, /try \{/);
});
