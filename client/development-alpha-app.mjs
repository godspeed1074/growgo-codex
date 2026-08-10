import { createDevelopmentAlphaController } from "./development-alpha-controller.mjs";
import {
  createControlledOneSessionDeveloperMapAttachmentAuthorization,
  installControlledOneSessionDeveloperMapAttachmentAuthorization
} from "./developer-only-atlas-map-attachment-authorization.mjs?v=atlas21277a";
import {
  createControlledOneSessionDeveloperRendererHandoffAuthorization,
  installControlledOneSessionDeveloperRendererHandoffAuthorization
} from "./developer-only-atlas-renderer-handoff-authorization.mjs";
import {
  createGatedDeveloperOnlyAtlasMapAttachmentController,
  installGatedDeveloperOnlyAtlasMapAttachmentController
} from "./developer-only-atlas-map-attachment-controller.mjs?v=atlas21277a";
import {
  createDeveloperOnlyLiveMapCentreAtlasBridge,
  installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge
} from "./developer-only-live-map-centre-atlas-bridge.mjs";
import {
  createDeveloperOnlyLiveAtlasRendererHandoffReadiness,
  installDeveloperOnlyLiveAtlasRendererHandoffReadiness
} from "./developer-only-live-atlas-renderer-handoff-readiness.mjs?v=atlas21274a";
import {
  createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter
} from "./developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150am";
import {
  createDeveloperOnlyAtlasCustom25DOneFrameCommand,
  installDeveloperOnlyAtlasCustom25DOneFrameCommand
} from "./developer-only-atlas-custom25d-one-frame-command.mjs";
import {
  createControlledPersistentAtlasContractIntegration
} from "./developer-only-controlled-persistent-atlas-contract-integration.mjs";
import {
  createDeveloperOnlyControlledPersistentAtlasManualCommand,
  installDeveloperOnlyControlledPersistentAtlasManualCommand
} from "./developer-only-controlled-persistent-atlas-manual-command.mjs";
import {
  createDeveloperOnlyAtlasAssetPopulationPreview,
  installDeveloperOnlyAtlasAssetPopulationPreview
} from "./developer-only-atlas-asset-population-preview.mjs";
import {
  createDeveloperOnlyAtlasLiveFeatureInputAdapter,
  extractDeveloperOnlyAtlasLiveViewportFeatures
} from "./developer-only-atlas-live-feature-input-adapter.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan
} from "./developer-only-atlas-world-population-planner.mjs";
import {
  createDeveloperOnlyAtlasControlledViewportPopulationPreview,
  installDeveloperOnlyAtlasControlledViewportPopulationPreview
} from "./developer-only-atlas-controlled-viewport-population-preview.mjs";
import {
  createAtlasAutomaticPopulationController
} from "./developer-only-atlas-automatic-population-controller.mjs";
import {
  createAtlasAutomaticPopulationLiveEventAdapter
} from "./developer-only-atlas-automatic-population-live-event-adapter.mjs";
import {
  createDeveloperOnlyControlledAutomaticAtlasPopulationToggle,
  installDeveloperOnlyControlledAutomaticAtlasPopulationToggle
} from "./developer-only-controlled-automatic-atlas-population-toggle.mjs";
import {
  createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace,
  installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace
} from "./developer-only-atlas-custom25d-one-frame-execution-trace.mjs";
import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs?v=atlas21274a";
import {
  createGrowGoCustom25DLiveOneFrameSurfaceOperations
} from "./growgo-custom25d-live-one-frame-surface-operations.mjs";
import {
  createPersistentAtlasFrameSnapshotProvider,
  normalizePersistentAtlasFrameSnapshotForContract,
  toOneFrameViewportSnapshotContract
} from "./developer-only-persistent-atlas-frame-snapshot-provider.mjs";
import {
  createAtlasPopulationDrawIntegration,
  submitAtlasPopulationPlanForDraw
} from "./developer-only-atlas-population-draw-integration.mjs";
import {
  createDeveloperOnlyAtlasFirstHarmlessVisualController
} from "./developer-only-atlas-first-harmless-visual.mjs?v=atlas21277a";
import {
  createDeveloperOnlyAtlasVisualPrimitiveLayer
} from "./developer-only-atlas-visual-primitive-layer.mjs?v=atlas21277c";
import {
  createDeveloperOnlyAtlasSharedApprovedLiveAssetController
} from "./developer-only-atlas-shared-approved-live-assets.mjs?v=atlas21281a";

const developmentAlphaStartupDiagnosticsNamespace =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : (globalThis.GrowGoDeveloperDiagnostics = {});

developmentAlphaStartupDiagnosticsNamespace.developmentAlphaModuleExecutionStarted =
  true;
developmentAlphaStartupDiagnosticsNamespace.developmentAlphaModuleExecutionTimestamp =
  Date.now();

const CLIENT_CONFIG_GLOBAL = "__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__";
const DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE =
  "DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE";
const atlasCustom25DOneFrameExecutionTrace =
  createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace();

installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
  globalObject: globalThis,
  trace: atlasCustom25DOneFrameExecutionTrace
});

function readDiagnosticsNamespace() {
  const namespace = globalThis?.GrowGoDeveloperDiagnostics;
  return namespace && typeof namespace === "object" ? namespace : null;
}

function isLocalDevelopmentHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  );
}

function installDeveloperOnlyAtlasAttachmentBrowserSurface({
  authorization,
  controller,
  getGrowGoMap,
  visualController = null,
  primitiveLayer = null,
  approvedAssetController = null
} = {}) {
  const hostname = globalThis?.location?.hostname ?? "";
  if (
    !globalThis?.document ||
    !isLocalDevelopmentHost(hostname) ||
    !authorization ||
    !controller ||
    typeof getGrowGoMap !== "function"
  ) {
    return null;
  }

  const surfaceId = "growgo-dev-atlas-attachment-surface";
  const authorizeButtonId = "growgo-dev-atlas-attachment-authorize";
  const attachButtonId = "growgo-dev-atlas-attachment-attach";
  const detachButtonId = "growgo-dev-atlas-attachment-detach";
  const showVisualButtonId = "growgo-dev-atlas-show-visual";
  const clearVisualButtonId = "growgo-dev-atlas-clear-visual";
  const panMapButtonId = "growgo-dev-atlas-pan-map";
  const zoomMapButtonId = "growgo-dev-atlas-zoom-map";
  const pointPrimitiveButtonId = "growgo-dev-atlas-point-primitive";
  const spritePrimitiveButtonId = "growgo-dev-atlas-sprite-primitive";
  const approvedAssetButtonId = "growgo-dev-atlas-approved-asset";
  const secondApprovedAssetButtonId = "growgo-dev-atlas-second-approved-asset";
  const thirdApprovedAssetButtonId = "growgo-dev-atlas-third-approved-asset";
  const fourthApprovedAssetButtonId = "growgo-dev-atlas-fourth-approved-asset";
  const updateApprovedAssetButtonId = "growgo-dev-atlas-update-approved-asset";
  const updateSecondApprovedAssetButtonId = "growgo-dev-atlas-update-second-approved-asset";
  const updateThirdApprovedAssetButtonId = "growgo-dev-atlas-update-third-approved-asset";
  const updateFourthApprovedAssetButtonId = "growgo-dev-atlas-update-fourth-approved-asset";
  const clearSecondApprovedAssetButtonId = "growgo-dev-atlas-clear-second-approved-asset";
  const clearThirdApprovedAssetButtonId = "growgo-dev-atlas-clear-third-approved-asset";
  const clearFourthApprovedAssetButtonId = "growgo-dev-atlas-clear-fourth-approved-asset";
  const updatePrimitiveButtonId = "growgo-dev-atlas-update-primitive";
  const clearPrimitivesButtonId = "growgo-dev-atlas-clear-primitives";
  const refreshButtonId = "growgo-dev-atlas-attachment-refresh";
  const statusId = "growgo-dev-atlas-attachment-status";
  const overlayCanvasSelector = ".leaflet-overlay-pane canvas";
  const baselineOverlayCanvasCount = globalThis.document.querySelectorAll(
    overlayCanvasSelector
  ).length;

  let surface = globalThis.document.getElementById(surfaceId);
  if (!surface) {
    surface = globalThis.document.createElement("section");
    surface.id = surfaceId;
    surface.setAttribute("aria-label", "Atlas attachment developer controls");
    surface.style.position = "fixed";
    surface.style.top = "12px";
    surface.style.right = "12px";
    surface.style.zIndex = "6000";
    surface.style.maxWidth = "320px";
    surface.style.padding = "8px";
    surface.style.background = "rgba(7, 20, 33, 0.92)";
    surface.style.color = "#f4f8ff";
    surface.style.fontSize = "12px";
    surface.style.border = "1px solid rgba(255,255,255,0.18)";
    surface.style.borderRadius = "8px";
    surface.innerHTML = `
      <strong>Atlas Attach Dev</strong>
      <button id="${authorizeButtonId}" type="button">authorize atlas attachment</button>
      <button id="${attachButtonId}" type="button">attach atlas</button>
      <button id="${detachButtonId}" type="button">detach atlas</button>
      <button id="${showVisualButtonId}" type="button">show atlas visual</button>
      <button id="${clearVisualButtonId}" type="button">clear atlas visual</button>
      <button id="${panMapButtonId}" type="button">pan map</button>
      <button id="${zoomMapButtonId}" type="button">zoom map</button>
      <button id="${pointPrimitiveButtonId}" type="button">point primitive</button>
      <button id="${spritePrimitiveButtonId}" type="button">sprite primitive</button>
      <button id="${approvedAssetButtonId}" type="button">approved asset</button>
      <button id="${secondApprovedAssetButtonId}" type="button">second approved asset</button>
      <button id="${thirdApprovedAssetButtonId}" type="button">third approved asset</button>
      <button id="${fourthApprovedAssetButtonId}" type="button">fourth approved asset</button>
      <button id="${updateApprovedAssetButtonId}" type="button">update approved asset</button>
      <button id="${updateSecondApprovedAssetButtonId}" type="button">update second approved asset</button>
      <button id="${updateThirdApprovedAssetButtonId}" type="button">update third approved asset</button>
      <button id="${updateFourthApprovedAssetButtonId}" type="button">update fourth approved asset</button>
      <button id="${clearSecondApprovedAssetButtonId}" type="button">clear second approved asset</button>
      <button id="${clearThirdApprovedAssetButtonId}" type="button">clear third approved asset</button>
      <button id="${clearFourthApprovedAssetButtonId}" type="button">clear fourth approved asset</button>
      <button id="${updatePrimitiveButtonId}" type="button">update primitive</button>
      <button id="${clearPrimitivesButtonId}" type="button">clear primitives</button>
      <button id="${refreshButtonId}" type="button">refresh atlas status</button>
      <pre id="${statusId}"></pre>
    `;
    globalThis.document.body?.appendChild(surface);
  }

  const authorizeButton = surface.querySelector(`#${authorizeButtonId}`);
  const attachButton = surface.querySelector(`#${attachButtonId}`);
  const detachButton = surface.querySelector(`#${detachButtonId}`);
  const showVisualButton = surface.querySelector(`#${showVisualButtonId}`);
  const clearVisualButton = surface.querySelector(`#${clearVisualButtonId}`);
  const panMapButton = surface.querySelector(`#${panMapButtonId}`);
  const zoomMapButton = surface.querySelector(`#${zoomMapButtonId}`);
  const pointPrimitiveButton = surface.querySelector(`#${pointPrimitiveButtonId}`);
  const spritePrimitiveButton = surface.querySelector(
    `#${spritePrimitiveButtonId}`
  );
  const approvedAssetButton = surface.querySelector(`#${approvedAssetButtonId}`);
  const secondApprovedAssetButton = surface.querySelector(
    `#${secondApprovedAssetButtonId}`
  );
  const thirdApprovedAssetButton = surface.querySelector(
    `#${thirdApprovedAssetButtonId}`
  );
  const fourthApprovedAssetButton = surface.querySelector(
    `#${fourthApprovedAssetButtonId}`
  );
  const updateApprovedAssetButton = surface.querySelector(
    `#${updateApprovedAssetButtonId}`
  );
  const updateSecondApprovedAssetButton = surface.querySelector(
    `#${updateSecondApprovedAssetButtonId}`
  );
  const updateThirdApprovedAssetButton = surface.querySelector(
    `#${updateThirdApprovedAssetButtonId}`
  );
  const updateFourthApprovedAssetButton = surface.querySelector(
    `#${updateFourthApprovedAssetButtonId}`
  );
  const clearSecondApprovedAssetButton = surface.querySelector(
    `#${clearSecondApprovedAssetButtonId}`
  );
  const clearThirdApprovedAssetButton = surface.querySelector(
    `#${clearThirdApprovedAssetButtonId}`
  );
  const clearFourthApprovedAssetButton = surface.querySelector(
    `#${clearFourthApprovedAssetButtonId}`
  );
  const updatePrimitiveButton = surface.querySelector(
    `#${updatePrimitiveButtonId}`
  );
  const clearPrimitivesButton = surface.querySelector(
    `#${clearPrimitivesButtonId}`
  );
  const refreshButton = surface.querySelector(`#${refreshButtonId}`);
  const statusNode = surface.querySelector(`#${statusId}`);

  function writeSurfaceStatus(lastAction = "status_read", lastResult = null) {
    const liveMap = getGrowGoMap();
    const controllerStatus = controller.getAtlasMapAttachmentStatus();
    const authorizationStatus =
      authorization.getAtlasMapAttachmentAuthorizationStatus();
    const visualStatus =
      visualController?.getAtlasFirstHarmlessVisualStatus?.() ?? null;
    const primitiveStatus =
      primitiveLayer?.getAtlasVisualPrimitiveLayerStatus?.() ?? null;
    const approvedAssetStatus =
      approvedAssetController?.getSharedApprovedLiveAssetStatus?.() ??
      approvedAssetController?.getFirstApprovedLiveAssetStatus?.() ??
      null;
    const currentOverlayCanvasCount = globalThis.document.querySelectorAll(
      overlayCanvasSelector
    ).length;
    const surfaceStatus = Object.freeze({
      schemaId: "GROWGO_DEV_ATLAS_ATTACHMENT_BROWSER_SURFACE_STATUS_001",
      browserSurfaceAvailable: true,
      localDevelopmentHost: hostname,
      lastAction,
      lastResult,
      authoritativeLiveMapAccessible: !!liveMap,
      liveMapIdentityId: controllerStatus.liveMapIdentityId ?? null,
      attached: controllerStatus.attached === true,
      attachedMapIdentityId: controllerStatus.attachedMapIdentityId ?? null,
      exactLiveMapBound: controllerStatus.exactLiveMapBound === true,
      attachAuthorizationState:
        authorizationStatus.authorizationState ?? null,
      attachPermissionGranted:
        authorizationStatus.effectiveMapAttachmentAllowed === true,
      ownedListenerCount: controllerStatus.ownedListenerCount ?? 0,
      atlasVisualPresent: visualStatus?.visualPresent === true,
      atlasVisualType: visualStatus?.visualType ?? null,
      atlasVisualMapIdentityId: visualStatus?.attachedMapIdentityId ?? null,
      atlasVisualLatitude: visualStatus?.visualLatitude ?? null,
      atlasVisualLongitude: visualStatus?.visualLongitude ?? null,
      atlasVisualLayerCount: visualStatus?.atlasOwnedLayerCount ?? 0,
      atlasVisualCanvasCount: visualStatus?.atlasOwnedCanvasCount ?? 0,
      atlasVisualListenerCount: visualStatus?.atlasOwnedListenerCount ?? 0,
      atlasPrimitiveCount: primitiveStatus?.atlasPrimitiveCount ?? 0,
      atlasPrimitiveIds: primitiveStatus?.atlasPrimitiveIds ?? [],
      atlasPrimitiveTypes: primitiveStatus?.atlasPrimitiveTypes ?? [],
      atlasPrimitiveEntries: primitiveStatus?.atlasPrimitiveEntries ?? [],
      atlasPrimitiveCanvasCount: primitiveStatus?.atlasOwnedCanvasCount ?? 0,
      atlasPrimitiveListenerCount: primitiveStatus?.atlasOwnedListenerCount ?? 0,
      atlasPrimitiveObjectCount: primitiveStatus?.atlasOwnedObjectCount ?? 0,
      atlasApprovedAssetPresent: approvedAssetStatus?.liveAssetPresent === true,
      atlasApprovedAssetId: approvedAssetStatus?.selectedAssetId ?? null,
      atlasApprovedAssetVersion:
        approvedAssetStatus?.selectedAssetVersion ?? null,
      atlasApprovedAssetStatus:
        approvedAssetStatus?.approvedAssetStatus ?? null,
      atlasApprovedAssetSource: approvedAssetStatus?.assetSource ?? null,
      atlasApprovedAssetReferenceId:
        approvedAssetStatus?.assetReferenceId ?? null,
      atlasApprovedAssetPrimitiveObjectId:
        approvedAssetStatus?.primitiveObjectId ?? null,
      atlasApprovedAssetModelInstanceId:
        approvedAssetStatus?.modelInstanceId ?? null,
      atlasApprovedAssetRepresentationMode:
        approvedAssetStatus?.representationMode ?? null,
      atlasApprovedAssetRuntimePreviewBindingId:
        approvedAssetStatus?.runtimePreviewBindingId ?? null,
      atlasApprovedAssetResolvedGlbIdentity:
        approvedAssetStatus?.resolvedGlbIdentity ?? null,
      atlasApprovedAssetLatitude: approvedAssetStatus?.latitude ?? null,
      atlasApprovedAssetLongitude: approvedAssetStatus?.longitude ?? null,
      atlasApprovedAssetLoaderStatus:
        approvedAssetStatus?.loaderStatus ?? null,
      atlasApprovedAssetLoaderReason:
        approvedAssetStatus?.loaderReason ?? null,
      atlasApprovedAssetActualGlbLoaded:
        approvedAssetStatus?.actualGlbLoaded === true,
      atlasApprovedAssetMeshCount:
        approvedAssetStatus?.meshCount ?? 0,
      atlasApprovedAssetMaterialCount:
        approvedAssetStatus?.materialCount ?? 0,
      atlasApprovedAssetSecondPresent:
        approvedAssetStatus?.secondLiveAssetPresent === true,
      atlasApprovedAssetSecondId:
        approvedAssetStatus?.secondSelectedAssetId ?? null,
      atlasApprovedAssetSecondVersion:
        approvedAssetStatus?.secondSelectedAssetVersion ?? null,
      atlasApprovedAssetSecondStatus:
        approvedAssetStatus?.secondApprovedAssetStatus ?? null,
      atlasApprovedAssetSecondModelInstanceId:
        approvedAssetStatus?.secondModelInstanceId ?? null,
      atlasApprovedAssetSecondRepresentationMode:
        approvedAssetStatus?.secondRepresentationMode ?? null,
      atlasApprovedAssetSecondResolvedGlbIdentity:
        approvedAssetStatus?.secondResolvedGlbIdentity ?? null,
      atlasApprovedAssetSecondLatitude:
        approvedAssetStatus?.secondLatitude ?? null,
      atlasApprovedAssetSecondLongitude:
        approvedAssetStatus?.secondLongitude ?? null,
      atlasApprovedAssetSecondActualGlbLoaded:
        approvedAssetStatus?.secondActualGlbLoaded === true,
      atlasApprovedAssetThirdPresent:
        approvedAssetStatus?.thirdLiveAssetPresent === true,
      atlasApprovedAssetThirdId:
        approvedAssetStatus?.thirdSelectedAssetId ?? null,
      atlasApprovedAssetThirdVersion:
        approvedAssetStatus?.thirdSelectedAssetVersion ?? null,
      atlasApprovedAssetThirdStatus:
        approvedAssetStatus?.thirdApprovedAssetStatus ?? null,
      atlasApprovedAssetThirdModelInstanceId:
        approvedAssetStatus?.thirdModelInstanceId ?? null,
      atlasApprovedAssetThirdRepresentationMode:
        approvedAssetStatus?.thirdRepresentationMode ?? null,
      atlasApprovedAssetThirdResolvedGlbIdentity:
        approvedAssetStatus?.thirdResolvedGlbIdentity ?? null,
      atlasApprovedAssetThirdLatitude:
        approvedAssetStatus?.thirdLatitude ?? null,
      atlasApprovedAssetThirdLongitude:
        approvedAssetStatus?.thirdLongitude ?? null,
      atlasApprovedAssetThirdActualGlbLoaded:
        approvedAssetStatus?.thirdActualGlbLoaded === true,
      atlasApprovedAssetFourthPresent:
        approvedAssetStatus?.fourthLiveAssetPresent === true,
      atlasApprovedAssetFourthId:
        approvedAssetStatus?.fourthSelectedAssetId ?? null,
      atlasApprovedAssetFourthVersion:
        approvedAssetStatus?.fourthSelectedAssetVersion ?? null,
      atlasApprovedAssetFourthStatus:
        approvedAssetStatus?.fourthApprovedAssetStatus ?? null,
      atlasApprovedAssetFourthModelInstanceId:
        approvedAssetStatus?.fourthModelInstanceId ?? null,
      atlasApprovedAssetFourthRepresentationMode:
        approvedAssetStatus?.fourthRepresentationMode ?? null,
      atlasApprovedAssetFourthResolvedGlbIdentity:
        approvedAssetStatus?.fourthResolvedGlbIdentity ?? null,
      atlasApprovedAssetFourthLatitude:
        approvedAssetStatus?.fourthLatitude ?? null,
      atlasApprovedAssetFourthLongitude:
        approvedAssetStatus?.fourthLongitude ?? null,
      atlasApprovedAssetFourthActualGlbLoaded:
        approvedAssetStatus?.fourthActualGlbLoaded === true,
      atlasApprovedAssetRendererSurfaceCount:
        approvedAssetStatus?.rendererSurfaceCount ?? 0,
      atlasApprovedAssetRendererCanvasCount:
        approvedAssetStatus?.rendererCanvasCount ?? 0,
      atlasApprovedAssetRendererInstanceCount:
        approvedAssetStatus?.rendererInstanceCount ?? 0,
      atlasApprovedAssetSharedSceneCount:
        approvedAssetStatus?.sharedSceneCount ?? 0,
      atlasApprovedAssetSceneObjectCount:
        approvedAssetStatus?.sceneObjectCount ?? 0,
      atlasApprovedAssetModelInstanceCount:
        approvedAssetStatus?.modelInstanceCount ?? 0,
      atlasApprovedAssetSharedInstances:
        approvedAssetStatus?.sharedAssetInstances ?? [],
      atlasApprovedAssetOwnedListenerCount:
        approvedAssetStatus?.ownedListenerCount ?? 0,
      atlasApprovedAssetRenderLoopCount:
        approvedAssetStatus?.renderLoopCount ?? 0,
      atlasApprovedAssetGlContextCreated:
        approvedAssetStatus?.glContextCreated === true,
      atlasApprovedAssetTrue3DRendererReady:
        approvedAssetStatus?.true3dRendererReady === true,
      atlasApprovedAssetRendererTechnologyPath:
        approvedAssetStatus?.rendererTechnologyPath ?? null,
      atlasApprovedAssetCameraState:
        approvedAssetStatus?.cameraState ?? null,
      atlasApprovedAssetSharedCameraPath:
        approvedAssetStatus?.sharedCameraPath ?? null,
      rendererActivity: controllerStatus.rendererActivity === true,
      overlayActivity: controllerStatus.overlayActivity === true,
      pollingOrTimerActivity:
        controllerStatus.pollingOrTimerActivity === true,
      baselineOverlayCanvasCount,
      currentOverlayCanvasCount,
      overlayCanvasCountDelta:
        currentOverlayCanvasCount - baselineOverlayCanvasCount,
      safetyFlags: controllerStatus.safetyFlags ?? null
    });

    surface.dataset.statusJson = JSON.stringify(surfaceStatus);
    surface.dataset.liveMapIdentityId = surfaceStatus.liveMapIdentityId ?? "";
    surface.dataset.attachedMapIdentityId =
      surfaceStatus.attachedMapIdentityId ?? "";
    surface.dataset.exactLiveMapBound = String(surfaceStatus.exactLiveMapBound);
    surface.dataset.attached = String(surfaceStatus.attached);
    if (statusNode) {
      statusNode.textContent = JSON.stringify(surfaceStatus);
    }
    return surfaceStatus;
  }

  authorizeButton?.addEventListener("click", () => {
    const result = authorization.authorizeAtlasMapAttachmentSession({
      confirmation: authorization.requiredConfirmation
    });
    writeSurfaceStatus("authorize", result);
  });

  attachButton?.addEventListener("click", () => {
    const result = controller.attachAtlasMapDiagnostic();
    if (result?.outcome === "attached") {
      authorization.consumeSuccessfulAttachment();
    }
    writeSurfaceStatus("attach", result);
  });

  detachButton?.addEventListener("click", () => {
    const clearedApprovedAsset =
      approvedAssetController?.clearAllApprovedLiveAssets?.() ??
      approvedAssetController?.clearFirstApprovedLiveAsset?.() ??
      null;
    const clearedVisual = visualController?.clearAtlasFirstHarmlessVisual?.() ?? null;
    const clearedPrimitives =
      primitiveLayer?.clearAllAtlasVisualPrimitives?.() ?? null;
    const result = controller.detachAtlasMapDiagnostic();
    authorization.revokeAtlasMapAttachmentSession();
    writeSurfaceStatus(
      "detach",
      clearedApprovedAsset || clearedVisual || clearedPrimitives
        ? {
            clearedApprovedAsset,
            clearedVisual,
            clearedPrimitives,
            detachResult: result
          }
        : result
    );
  });

  showVisualButton?.addEventListener("click", () => {
    const result = visualController?.showAtlasFirstHarmlessVisual?.() ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_VISUAL_CONTROLLER_UNAVAILABLE"
    };
    writeSurfaceStatus("show_visual", result);
  });

  clearVisualButton?.addEventListener("click", () => {
    const result = visualController?.clearAtlasFirstHarmlessVisual?.() ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_VISUAL_CONTROLLER_UNAVAILABLE"
    };
    writeSurfaceStatus("clear_visual", result);
  });

  pointPrimitiveButton?.addEventListener("click", () => {
    const center = getGrowGoMap()?.getCenter?.() ?? null;
    const result = primitiveLayer?.upsertAtlasVisualPrimitive?.({
      primitiveId: "ATLAS_DEV_POINT_001",
      primitiveType: "point_anchor",
      latitude: center?.lat ?? null,
      longitude: center?.lng ?? null,
      label: "Atlas Point"
    }) ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE"
    };
    writeSurfaceStatus("point_primitive", result);
  });

  spritePrimitiveButton?.addEventListener("click", () => {
    const center = getGrowGoMap()?.getCenter?.() ?? null;
    const result = primitiveLayer?.upsertAtlasVisualPrimitive?.({
      primitiveId: "ATLAS_DEV_SPRITE_001",
      primitiveType: "sprite_image",
      latitude: center?.lat ?? null,
      longitude: center?.lng ?? null,
      label: "Atlas Sprite"
    }) ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE"
    };
    writeSurfaceStatus("sprite_primitive", result);
  });

  approvedAssetButton?.addEventListener("click", async () => {
    const center = getGrowGoMap()?.getCenter?.() ?? null;
    const result =
      (await approvedAssetController?.placeFirstApprovedLiveAsset?.({
        latitude: center?.lat ?? null,
        longitude: center?.lng ?? null
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("approved_asset", result);
  });

  secondApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) - 118,
              Number(point?.y ?? 0) + 84
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.placeSecondApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat - 0.0024 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng - 0.0038 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("second_approved_asset", result);
  });

  thirdApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) + 196,
              Number(point?.y ?? 0) + 118
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.placeThirdApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat - 0.0015 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng + 0.0062 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("third_approved_asset", result);
  });

  fourthApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) + 28,
              Number(point?.y ?? 0) + 158
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.placeFourthApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat - 0.0052 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng + 0.0011 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("fourth_approved_asset", result);
  });

  updateApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) + 74,
              Number(point?.y ?? 0) - 64
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.updateFirstApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat + 0.002 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng + 0.002 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("update_approved_asset", result);
  });

  updateSecondApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) - 184,
              Number(point?.y ?? 0) - 28
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.updateSecondApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat - 0.0034 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng - 0.0048 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("update_second_approved_asset", result);
  });

  updateThirdApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) + 228,
              Number(point?.y ?? 0) - 118
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.updateThirdApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat + 0.0011 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng + 0.0082 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("update_third_approved_asset", result);
  });

  updateFourthApprovedAssetButton?.addEventListener("click", async () => {
    const liveMap = getGrowGoMap();
    const center = liveMap?.getCenter?.() ?? null;
    const shiftedCoordinate =
      center &&
      liveMap &&
      typeof liveMap.latLngToContainerPoint === "function" &&
      typeof liveMap.containerPointToLatLng === "function"
        ? (() => {
            const point = liveMap.latLngToContainerPoint(center);
            return liveMap.containerPointToLatLng([
              Number(point?.x ?? 0) - 18,
              Number(point?.y ?? 0) + 204
            ]);
          })()
        : null;
    const result =
      (await approvedAssetController?.updateFourthApprovedLiveAsset?.({
        latitude:
          shiftedCoordinate?.lat ?? (center?.lat != null ? center.lat - 0.0064 : null),
        longitude:
          shiftedCoordinate?.lng ?? (center?.lng != null ? center.lng - 0.0007 : null)
      })) ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("update_fourth_approved_asset", result);
  });

  clearSecondApprovedAssetButton?.addEventListener("click", () => {
    const result =
      approvedAssetController?.clearSecondApprovedLiveAsset?.() ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("clear_second_approved_asset", result);
  });

  clearThirdApprovedAssetButton?.addEventListener("click", () => {
    const result =
      approvedAssetController?.clearThirdApprovedLiveAsset?.() ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("clear_third_approved_asset", result);
  });

  clearFourthApprovedAssetButton?.addEventListener("click", () => {
    const result =
      approvedAssetController?.clearFourthApprovedLiveAsset?.() ?? {
        outcome: "blocked",
        reasonCode: "ATLAS_APPROVED_ASSET_CONTROLLER_UNAVAILABLE"
      };
    writeSurfaceStatus("clear_fourth_approved_asset", result);
  });

  updatePrimitiveButton?.addEventListener("click", () => {
    const center = getGrowGoMap()?.getCenter?.() ?? null;
    const result = primitiveLayer?.upsertAtlasVisualPrimitive?.({
      primitiveId: "ATLAS_DEV_POINT_001",
      primitiveType: "point_anchor",
      latitude: center?.lat != null ? center.lat + 0.02 : null,
      longitude: center?.lng != null ? center.lng + 0.02 : null,
      label: "Atlas Point Updated"
    }) ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE"
    };
    writeSurfaceStatus("update_primitive", result);
  });

  clearPrimitivesButton?.addEventListener("click", () => {
    const clearedApprovedAsset =
      approvedAssetController?.clearAllApprovedLiveAssets?.() ??
      approvedAssetController?.clearFirstApprovedLiveAsset?.() ??
      null;
    const clearedPrimitives = primitiveLayer?.clearAllAtlasVisualPrimitives?.() ?? {
      outcome: "blocked",
      reasonCode: "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE"
    };
    const result = clearedApprovedAsset
      ? {
          clearedApprovedAsset,
          clearedPrimitives
        }
      : clearedPrimitives;
    writeSurfaceStatus("clear_primitives", result);
  });

  panMapButton?.addEventListener("click", () => {
    const liveMap = getGrowGoMap();
    let result = {
      outcome: "blocked",
      reasonCode: "MAP_PAN_UNAVAILABLE"
    };

    if (liveMap && typeof liveMap.panBy === "function") {
      liveMap.panBy([160, 80], { animate: false });
      result = {
        outcome: "completed",
        reasonCode: "MAP_PANNED"
      };
    }

    writeSurfaceStatus("pan_map", result);
  });

  zoomMapButton?.addEventListener("click", () => {
    const liveMap = getGrowGoMap();
    let result = {
      outcome: "blocked",
      reasonCode: "MAP_ZOOM_UNAVAILABLE"
    };

    if (liveMap && typeof liveMap.zoomIn === "function") {
      liveMap.zoomIn(1, { animate: false });
      result = {
        outcome: "completed",
        reasonCode: "MAP_ZOOMED_IN"
      };
    }

    writeSurfaceStatus("zoom_map", result);
  });

  refreshButton?.addEventListener("click", () => {
    writeSurfaceStatus("refresh", null);
  });

  return Object.freeze({
    refresh: () => writeSurfaceStatus("refresh", null),
    elementId: surfaceId,
    authorizeButtonId,
    attachButtonId,
    detachButtonId,
    showVisualButtonId,
    clearVisualButtonId,
    panMapButtonId,
    zoomMapButtonId,
    pointPrimitiveButtonId,
    spritePrimitiveButtonId,
    approvedAssetButtonId,
    secondApprovedAssetButtonId,
    thirdApprovedAssetButtonId,
    fourthApprovedAssetButtonId,
    updateApprovedAssetButtonId,
    updateSecondApprovedAssetButtonId,
    updateThirdApprovedAssetButtonId,
    updateFourthApprovedAssetButtonId,
    clearSecondApprovedAssetButtonId,
    clearThirdApprovedAssetButtonId,
    clearFourthApprovedAssetButtonId,
    updatePrimitiveButtonId,
    clearPrimitivesButtonId,
    refreshButtonId
  });
}

async function loadControlledOneAssetLiveDrawBrowserWiringModule() {
  try {
    return await import(
      "./developer-only-atlas-controlled-one-asset-live-draw-browser-wiring.mjs"
    );
  } catch (error) {
    const namespace = readDiagnosticsNamespace();
    if (namespace) {
      namespace.controlledOneAssetInstallerAttempted = true;
      namespace.controlledOneAssetInstallerResultIsNull = true;
      namespace.controlledOneAssetInstallerResultType = "module_import_failed";
      namespace.controlledOneAssetInstallerReturnedNamespace = false;
      namespace.controlledOneAssetInstallerReturnStatus = "module_import_failed";
      namespace.controlledOneAssetInstallerImportErrorName =
        error?.name ?? "Error";
      namespace.controlledOneAssetInstallerImportErrorMessage =
        error?.message ?? String(error);
      namespace.controlledOneAssetCommandAvailableAfterInstall = false;
      namespace.controlledOneAssetCommandKeysAfterInstall = Object.freeze([]);
      namespace.controlledOneAssetInstallerNamespaceKeys = Object.freeze([]);
    }
    return null;
  }
}

function captureDiagnosticsFunction(functionName) {
  const namespace = readDiagnosticsNamespace();
  const candidate = namespace?.[functionName];
  return typeof candidate === "function" ? candidate.bind(namespace) : null;
}

function createCapturedRawLeafletMapProvider(mapGetter) {
  const capturedMapGetter = typeof mapGetter === "function" ? mapGetter : null;

  return atlasCustom25DOneFrameExecutionTrace.wrap(
    "rawLeafletMapProvider",
    () => capturedMapGetter?.() ?? null
  );
}

function createCapturedOneFrameBridgeProvider(bridgeGetter) {
  const capturedBridgeGetter = typeof bridgeGetter === "function" ? bridgeGetter : null;
  let cachedBridge = undefined;

  return atlasCustom25DOneFrameExecutionTrace.wrap(
    "capturedOneFrameBridgeProvider",
    () => {
      if (cachedBridge !== undefined) {
        return cachedBridge;
      }

      cachedBridge = capturedBridgeGetter?.() ?? null;
      return cachedBridge;
    }
  );
}

async function loadDevelopmentAlphaFirebaseRuntime(runtimeContract) {
  try {
    const runtimeModule = await import("./development-alpha-runtime.mjs");
    const createRuntime = runtimeModule?.createDevelopmentAlphaFirebaseRuntime;

    if (typeof createRuntime !== "function") {
      const missingExportError = new Error(
        DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE
      );
      missingExportError.code = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
      missingExportError.reasonCode = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
      throw missingExportError;
    }

    return createRuntime(runtimeContract);
  } catch (error) {
    const runtimeUnavailableError = new Error(
      DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE
    );
    runtimeUnavailableError.code = DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
    runtimeUnavailableError.reasonCode =
      DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE;
    runtimeUnavailableError.cause = error;
    throw runtimeUnavailableError;
  }
}

const getGrowGoMapFromScriptDiagnostics = captureDiagnosticsFunction("getGrowGoMap");
const getCustom25DCurrentViewportFeatureSourceFromScriptDiagnostics =
  captureDiagnosticsFunction("getCustom25DCurrentViewportFeatureSource");
const getCustom25DOneFrameBridgeFromScriptDiagnostics = captureDiagnosticsFunction(
  "getCustom25DOneFrameBridge"
);
const capturedOneFrameBridgeProviderFromScriptDiagnostics =
  createCapturedOneFrameBridgeProvider(getCustom25DOneFrameBridgeFromScriptDiagnostics);
let capturedOneFrameBridgeFromScriptDiagnostics = null;
let capturedOneFrameBridgeLookupFailureReason = null;
try {
  capturedOneFrameBridgeFromScriptDiagnostics =
    capturedOneFrameBridgeProviderFromScriptDiagnostics();
} catch (error) {
  capturedOneFrameBridgeFromScriptDiagnostics = null;
  capturedOneFrameBridgeLookupFailureReason = toReasonCode(
    error,
    "CUSTOM25D_ONE_FRAME_BRIDGE_LOOKUP_FAILED"
  );
}
const createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics =
  typeof capturedOneFrameBridgeFromScriptDiagnostics
    ?.createCustom25DFrameViewportSnapshotForOneFrame === "function"
    ? capturedOneFrameBridgeFromScriptDiagnostics.createCustom25DFrameViewportSnapshotForOneFrame.bind(
        capturedOneFrameBridgeFromScriptDiagnostics
      )
    : null;
const drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics =
  typeof capturedOneFrameBridgeFromScriptDiagnostics?.drawCustom25DOneFrameFromSnapshot ===
  "function"
    ? capturedOneFrameBridgeFromScriptDiagnostics.drawCustom25DOneFrameFromSnapshot.bind(
        capturedOneFrameBridgeFromScriptDiagnostics
      )
    : null;
const rawLeafletMapReferenceFromBridge = capturedOneFrameBridgeFromScriptDiagnostics
  ?.rawLeafletMapReference ?? null;

const rawLeafletMapProviderFromScriptDiagnostics =
  createCapturedRawLeafletMapProvider(getGrowGoMapFromScriptDiagnostics);

const diagnosticsNamespaceForEarlyBridgeLookup =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespaceForEarlyBridgeLookup) {
  diagnosticsNamespaceForEarlyBridgeLookup.custom25DOneFrameBridgeLookupStatus =
    capturedOneFrameBridgeFromScriptDiagnostics ? "resolved" : "failed_closed";
  diagnosticsNamespaceForEarlyBridgeLookup.custom25DOneFrameBridgeLookupFailureReason =
    capturedOneFrameBridgeLookupFailureReason;
  diagnosticsNamespaceForEarlyBridgeLookup.atlasStartupCheckpointAfterEarlyBridge =
    true;
  diagnosticsNamespaceForEarlyBridgeLookup.atlasStartupLastReachedCheckpoint =
    "after_early_bridge";
}

function readCustom25DCurrentViewportFeatureSourceFromScriptDiagnostics() {
  const dynamicGetter =
    captureDiagnosticsFunction("getCustom25DCurrentViewportFeatureSource");
  if (typeof dynamicGetter === "function") {
    return dynamicGetter() ?? null;
  }
  return getCustom25DCurrentViewportFeatureSourceFromScriptDiagnostics?.() ?? null;
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }

  return fallback;
}

function hashAtlasViewportIdentity(input) {
  const serialized = JSON.stringify(input);
  let h1 = 0xdeadbeef ^ serialized.length;
  let h2 = 0x41c6ce57 ^ serialized.length;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`.toUpperCase();
}

const persistentMapIdentityTokens = new WeakMap();
let persistentMapIdentityCounter = 0;
let persistentSessionCandidateCounter = 0;
let persistentSessionCandidateId = null;
let persistentSnapshotCounter = 0;
const persistentSnapshotDiagnosticsState = {
  lastFailureReason: null,
  rawReferenceDetected: false,
  rawReferenceFieldPath: null,
  rawReferenceType: null,
  rawReferenceConstructorName: null,
  snapshotCreateAttemptCount: 0,
  snapshotCreateCompletedCount: 0,
  snapshotValidationAttemptCount: 0,
  snapshotValidationCompletedCount: 0
};
const atlasAssetPopulationPreviewSnapshotTraceState = {
  schemaId:
    "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_POPULATION_PREVIEW_SNAPSHOT_TRACE_001",
  previewTraceActive: false,
  previewTraceCompleted: false,
  populationPlanId: null,
  batchId: null,
  snapshotId: null,
  snapshotGenerationId: null,
  normalizationStage: null,
  boundsValidationPassed: null,
  boundsFailureReason: null,
  lastFailureReason: null,
  stages: {
    one_frame_snapshot_created: null,
    persistent_normalization_input: null,
    persistent_normalization_output: null,
    draw_contract_conversion_input: null,
    draw_contract_conversion_output: null,
    bounds_validation: null
  }
};
const atlasPopulationDrawReasonTraceState = {
  schemaId:
    "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DRAW_REASON_TRACE_001",
  requestedRedrawReason: null,
  controllerTriggerReason: null,
  generationTriggerReason: null,
  populationDrawReason: null,
  persistentRedrawReason: null,
  redrawReasonAccepted: null,
  redrawReasonRejected: null,
  lastFailureReason: null,
  traceCompleted: false
};
let persistentPreparedSurface = null;
let persistentLifecycleOwner = null;
let persistentLifecycleOwnerId = null;
let persistentLifecycleGenerationId = null;
let persistentSurfaceOwnerId = null;

function readPersistentBridgeMapReference(bridge) {
  return bridge?.rawLeafletMapReference ?? null;
}

function resolvePersistentAuthoritativeMapReference(preferredMap = null) {
  const bridgeFromCapturedProvider =
    capturedOneFrameBridgeProviderFromScriptDiagnostics?.() ?? null;
  const bridgeFromDirectGetter =
    typeof getCustom25DOneFrameBridgeFromScriptDiagnostics === "function"
      ? getCustom25DOneFrameBridgeFromScriptDiagnostics() ?? null
      : null;

  const capturedBridgeMap = readPersistentBridgeMapReference(
    bridgeFromCapturedProvider
  );
  const directBridgeMap = readPersistentBridgeMapReference(bridgeFromDirectGetter);
  const authoritativeBridgeMap = capturedBridgeMap ?? directBridgeMap ?? null;

  if (
    preferredMap &&
    authoritativeBridgeMap &&
    preferredMap !== authoritativeBridgeMap
  ) {
    throw Object.assign(new Error("STALE_MAP_REFERENCE"), {
      reasonCode: "STALE_MAP_REFERENCE"
    });
  }

  const resolvedMap = preferredMap ?? authoritativeBridgeMap ?? null;

  if (!resolvedMap || typeof resolvedMap !== "object") {
    throw Object.assign(new Error("MAP_UNAVAILABLE"), {
      reasonCode: "MAP_UNAVAILABLE"
    });
  }

  return resolvedMap;
}

function resolvePersistentMapIdentityId(map) {
  const authoritativeMap = resolvePersistentAuthoritativeMapReference(map);

  if (!persistentMapIdentityTokens.has(authoritativeMap)) {
    persistentMapIdentityCounter += 1;
    persistentMapIdentityTokens.set(
      authoritativeMap,
      `LIVE_PERSISTENT_ATLAS_MAP_${String(persistentMapIdentityCounter).padStart(3, "0")}`
    );
  }

  return persistentMapIdentityTokens.get(authoritativeMap);
}

function ensurePersistentSessionCandidateId() {
  if (persistentSessionCandidateId) {
    return persistentSessionCandidateId;
  }

  persistentSessionCandidateCounter += 1;
  persistentSessionCandidateId = `LIVE_PERSISTENT_ATLAS_SESSION_${String(
    persistentSessionCandidateCounter
  ).padStart(3, "0")}`;
  return persistentSessionCandidateId;
}

function clearPersistentRuntimeReferences() {
  persistentPreparedSurface = null;
  persistentLifecycleOwner = null;
  persistentLifecycleOwnerId = null;
  persistentLifecycleGenerationId = null;
  persistentSurfaceOwnerId = null;
}

function canonicalPreviewTraceStageSnapshot(boundsShape = {}) {
  return Object.freeze({
    boundsPresent: boundsShape.boundsPresent === true,
    boundsType:
      typeof boundsShape.boundsType === "string" ? boundsShape.boundsType : null,
    boundsKeys: Object.freeze(
      Array.isArray(boundsShape.boundsKeys)
        ? boundsShape.boundsKeys
            .map((value) => (value == null ? null : String(value)))
            .filter((value) => typeof value === "string")
        : []
    ),
    northWestLatitude:
      Number.isFinite(Number(boundsShape.northWestLatitude))
        ? Number(boundsShape.northWestLatitude)
        : null,
    northWestLongitude:
      Number.isFinite(Number(boundsShape.northWestLongitude))
        ? Number(boundsShape.northWestLongitude)
        : null,
    southEastLatitude:
      Number.isFinite(Number(boundsShape.southEastLatitude))
        ? Number(boundsShape.southEastLatitude)
        : null,
    southEastLongitude:
      Number.isFinite(Number(boundsShape.southEastLongitude))
        ? Number(boundsShape.southEastLongitude)
        : null,
    north: Number.isFinite(Number(boundsShape.north)) ? Number(boundsShape.north) : null,
    south: Number.isFinite(Number(boundsShape.south)) ? Number(boundsShape.south) : null,
    east: Number.isFinite(Number(boundsShape.east)) ? Number(boundsShape.east) : null,
    west: Number.isFinite(Number(boundsShape.west)) ? Number(boundsShape.west) : null
  });
}

function resetAtlasAssetPopulationPreviewSnapshotTrace(lastFailureReason = null) {
  atlasAssetPopulationPreviewSnapshotTraceState.previewTraceActive = false;
  atlasAssetPopulationPreviewSnapshotTraceState.previewTraceCompleted = false;
  atlasAssetPopulationPreviewSnapshotTraceState.populationPlanId = null;
  atlasAssetPopulationPreviewSnapshotTraceState.batchId = null;
  atlasAssetPopulationPreviewSnapshotTraceState.snapshotId = null;
  atlasAssetPopulationPreviewSnapshotTraceState.snapshotGenerationId = null;
  atlasAssetPopulationPreviewSnapshotTraceState.normalizationStage = null;
  atlasAssetPopulationPreviewSnapshotTraceState.boundsValidationPassed = null;
  atlasAssetPopulationPreviewSnapshotTraceState.boundsFailureReason = null;
  atlasAssetPopulationPreviewSnapshotTraceState.lastFailureReason =
    lastFailureReason == null ? null : String(lastFailureReason);
  atlasAssetPopulationPreviewSnapshotTraceState.stages = {
    one_frame_snapshot_created: null,
    persistent_normalization_input: null,
    persistent_normalization_output: null,
    draw_contract_conversion_input: null,
    draw_contract_conversion_output: null,
    bounds_validation: null
  };
  return readAtlasAssetPopulationPreviewSnapshotTrace();
}

function updateAtlasAssetPopulationPreviewSnapshotTrace(patch = {}) {
  const stageName =
    typeof patch.stage === "string" ? patch.stage : null;
  atlasAssetPopulationPreviewSnapshotTraceState.previewTraceActive = true;
  if (patch.previewTraceCompleted != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.previewTraceCompleted =
      patch.previewTraceCompleted === true;
  }
  if (patch.populationPlanId != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.populationPlanId = String(
      patch.populationPlanId
    );
  }
  if (patch.batchId != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.batchId = String(patch.batchId);
  }
  if (patch.snapshotId != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.snapshotId = String(
      patch.snapshotId
    );
  }
  if (patch.snapshotGenerationId != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.snapshotGenerationId = String(
      patch.snapshotGenerationId
    );
  }
  if (patch.normalizationStage != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.normalizationStage = String(
      patch.normalizationStage
    );
  }
  if (patch.boundsValidationPassed != null) {
    atlasAssetPopulationPreviewSnapshotTraceState.boundsValidationPassed =
      patch.boundsValidationPassed === true;
  }
  if (patch.boundsFailureReason != null || patch.boundsFailureReason === null) {
    atlasAssetPopulationPreviewSnapshotTraceState.boundsFailureReason =
      patch.boundsFailureReason == null ? null : String(patch.boundsFailureReason);
  }
  if (patch.lastFailureReason != null || patch.lastFailureReason === null) {
    atlasAssetPopulationPreviewSnapshotTraceState.lastFailureReason =
      patch.lastFailureReason == null ? null : String(patch.lastFailureReason);
  }

  if (stageName) {
    atlasAssetPopulationPreviewSnapshotTraceState.stages[stageName] =
      canonicalPreviewTraceStageSnapshot(patch);
  }

  return readAtlasAssetPopulationPreviewSnapshotTrace();
}

function readAtlasAssetPopulationPreviewSnapshotTrace() {
  return Object.freeze({
    schemaId: atlasAssetPopulationPreviewSnapshotTraceState.schemaId,
    previewTraceActive:
      atlasAssetPopulationPreviewSnapshotTraceState.previewTraceActive === true,
    previewTraceCompleted:
      atlasAssetPopulationPreviewSnapshotTraceState.previewTraceCompleted === true,
    populationPlanId:
      atlasAssetPopulationPreviewSnapshotTraceState.populationPlanId,
    batchId: atlasAssetPopulationPreviewSnapshotTraceState.batchId,
    snapshotId: atlasAssetPopulationPreviewSnapshotTraceState.snapshotId,
    snapshotGenerationId:
      atlasAssetPopulationPreviewSnapshotTraceState.snapshotGenerationId,
    normalizationStage:
      atlasAssetPopulationPreviewSnapshotTraceState.normalizationStage,
    boundsValidationPassed:
      atlasAssetPopulationPreviewSnapshotTraceState.boundsValidationPassed,
    boundsFailureReason:
      atlasAssetPopulationPreviewSnapshotTraceState.boundsFailureReason,
    lastFailureReason:
      atlasAssetPopulationPreviewSnapshotTraceState.lastFailureReason,
    stages: Object.freeze({
      one_frame_snapshot_created:
        atlasAssetPopulationPreviewSnapshotTraceState.stages
          .one_frame_snapshot_created,
      persistent_normalization_input:
        atlasAssetPopulationPreviewSnapshotTraceState.stages
          .persistent_normalization_input,
      persistent_normalization_output:
        atlasAssetPopulationPreviewSnapshotTraceState.stages
          .persistent_normalization_output,
      draw_contract_conversion_input:
        atlasAssetPopulationPreviewSnapshotTraceState.stages
          .draw_contract_conversion_input,
      draw_contract_conversion_output:
        atlasAssetPopulationPreviewSnapshotTraceState.stages
          .draw_contract_conversion_output,
      bounds_validation:
        atlasAssetPopulationPreviewSnapshotTraceState.stages.bounds_validation
    }),
    canonicalSafetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createPersistentSnapshotIdentifiers() {
  persistentSnapshotCounter += 1;
  const sequence = String(persistentSnapshotCounter).padStart(3, "0");

  return {
    snapshotId: `PERSISTENT_ATLAS_SNAPSHOT_${sequence}`,
    snapshotGenerationId: `PERSISTENT_ATLAS_SNAPSHOT_GENERATION_${sequence}`,
    snapshotCreatedAt: "2026-08-06T00:00:00.000Z"
  };
}

function readPersistentSnapshotDiagnosticsStatus() {
  return Object.freeze({
    lastFailureReason: persistentSnapshotDiagnosticsState.lastFailureReason,
    rawReferenceDetected:
      persistentSnapshotDiagnosticsState.rawReferenceDetected === true,
    rawReferenceFieldPath:
      persistentSnapshotDiagnosticsState.rawReferenceFieldPath,
    rawReferenceType: persistentSnapshotDiagnosticsState.rawReferenceType,
    rawReferenceConstructorName:
      persistentSnapshotDiagnosticsState.rawReferenceConstructorName,
    snapshotCreateAttemptCount:
      persistentSnapshotDiagnosticsState.snapshotCreateAttemptCount,
    snapshotCreateCompletedCount:
      persistentSnapshotDiagnosticsState.snapshotCreateCompletedCount,
    snapshotValidationAttemptCount:
      persistentSnapshotDiagnosticsState.snapshotValidationAttemptCount,
    snapshotValidationCompletedCount:
      persistentSnapshotDiagnosticsState.snapshotValidationCompletedCount
  });
}

function resetAtlasPopulationDrawReasonTrace(reasonCode = null) {
  atlasPopulationDrawReasonTraceState.requestedRedrawReason = null;
  atlasPopulationDrawReasonTraceState.controllerTriggerReason = null;
  atlasPopulationDrawReasonTraceState.generationTriggerReason = null;
  atlasPopulationDrawReasonTraceState.populationDrawReason = null;
  atlasPopulationDrawReasonTraceState.persistentRedrawReason = null;
  atlasPopulationDrawReasonTraceState.redrawReasonAccepted = null;
  atlasPopulationDrawReasonTraceState.redrawReasonRejected = null;
  atlasPopulationDrawReasonTraceState.lastFailureReason =
    reasonCode == null ? null : String(reasonCode);
  atlasPopulationDrawReasonTraceState.traceCompleted = false;
  return readAtlasPopulationDrawReasonTrace();
}

function updateAtlasPopulationDrawReasonTrace(patch = {}) {
  if (patch.requestedRedrawReason != null || patch.requestedRedrawReason === null) {
    atlasPopulationDrawReasonTraceState.requestedRedrawReason =
      patch.requestedRedrawReason == null ? null : String(patch.requestedRedrawReason);
  }
  if (
    patch.controllerTriggerReason != null ||
    patch.controllerTriggerReason === null
  ) {
    atlasPopulationDrawReasonTraceState.controllerTriggerReason =
      patch.controllerTriggerReason == null
        ? null
        : String(patch.controllerTriggerReason);
  }
  if (
    patch.generationTriggerReason != null ||
    patch.generationTriggerReason === null
  ) {
    atlasPopulationDrawReasonTraceState.generationTriggerReason =
      patch.generationTriggerReason == null
        ? null
        : String(patch.generationTriggerReason);
  }
  if (patch.populationDrawReason != null || patch.populationDrawReason === null) {
    atlasPopulationDrawReasonTraceState.populationDrawReason =
      patch.populationDrawReason == null ? null : String(patch.populationDrawReason);
  }
  if (
    patch.persistentRedrawReason != null ||
    patch.persistentRedrawReason === null
  ) {
    atlasPopulationDrawReasonTraceState.persistentRedrawReason =
      patch.persistentRedrawReason == null
        ? null
        : String(patch.persistentRedrawReason);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "redrawReasonAccepted")) {
    atlasPopulationDrawReasonTraceState.redrawReasonAccepted =
      patch.redrawReasonAccepted == null ? null : patch.redrawReasonAccepted === true;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "redrawReasonRejected")) {
    atlasPopulationDrawReasonTraceState.redrawReasonRejected =
      patch.redrawReasonRejected == null ? null : patch.redrawReasonRejected === true;
  }
  if (patch.lastFailureReason != null || patch.lastFailureReason === null) {
    atlasPopulationDrawReasonTraceState.lastFailureReason =
      patch.lastFailureReason == null ? null : String(patch.lastFailureReason);
  }
  if (patch.traceCompleted != null) {
    atlasPopulationDrawReasonTraceState.traceCompleted = patch.traceCompleted === true;
  }
  return readAtlasPopulationDrawReasonTrace();
}

function readAtlasPopulationDrawReasonTrace() {
  return Object.freeze({
    schemaId: atlasPopulationDrawReasonTraceState.schemaId,
    requestedRedrawReason: atlasPopulationDrawReasonTraceState.requestedRedrawReason,
    controllerTriggerReason:
      atlasPopulationDrawReasonTraceState.controllerTriggerReason,
    generationTriggerReason:
      atlasPopulationDrawReasonTraceState.generationTriggerReason,
    populationDrawReason: atlasPopulationDrawReasonTraceState.populationDrawReason,
    persistentRedrawReason:
      atlasPopulationDrawReasonTraceState.persistentRedrawReason,
    redrawReasonAccepted:
      atlasPopulationDrawReasonTraceState.redrawReasonAccepted,
    redrawReasonRejected:
      atlasPopulationDrawReasonTraceState.redrawReasonRejected,
    lastFailureReason: atlasPopulationDrawReasonTraceState.lastFailureReason,
    traceCompleted: atlasPopulationDrawReasonTraceState.traceCompleted === true,
    canonicalSafetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function readApprovedPersistentReadinessIdentity(map) {
  const readiness = atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness();

  if (!readiness || readiness.diagnosticStatus === "blocked") {
    throw Object.assign(
      new Error(
        readiness?.rendererHandoff?.reasonCode ??
          readiness?.reasonCode ??
          "READINESS_REJECTED"
      ),
      {
        reasonCode:
          readiness?.rendererHandoff?.reasonCode ??
          readiness?.reasonCode ??
          "READINESS_REJECTED"
      }
    );
  }

  if (
    readiness.schemaId !== "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001" ||
    readiness.diagnosticStatus !== "resolved" ||
    readiness.reasonCode !== "RESOLVED" ||
    readiness.rendererHandoffStatus !== "ready_for_future_renderer_attachment"
  ) {
    throw Object.assign(new Error("READINESS_REJECTED"), {
      reasonCode:
        readiness?.rendererHandoff?.reasonCode ??
        readiness?.reasonCode ??
        "READINESS_REJECTED"
    });
  }

  const authoritativeMap = resolvePersistentAuthoritativeMapReference(map);

  const identity = Object.freeze({
    sessionId: ensurePersistentSessionCandidateId(),
    mapIdentityId: resolvePersistentMapIdentityId(authoritativeMap),
    regionId: readiness?.resolvedRegion?.regionId ?? null,
    packageId: readiness?.resolvedPackage?.packageId ?? null,
    packageVersion: readiness?.resolvedPackage?.packageVersion ?? null,
    packageFingerprint: readiness?.resolvedPackage?.packageFingerprint ?? null,
    recipeId: readiness?.resolvedRecipe?.recipeId ?? null,
    recipeVersion: readiness?.resolvedRecipe?.selectedVersion ?? null,
    selectorSeed: readiness?.selectorSeed ?? null
  });

  if (Object.values(identity).some((value) => value == null)) {
    throw Object.assign(new Error("READINESS_IDENTITY_INVALID"), {
      reasonCode: "READINESS_IDENTITY_INVALID"
    });
  }

  return identity;
}

const atlasLiveMapCentreBridge = createDeveloperOnlyLiveMapCentreAtlasBridge({
  getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics
});

installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge({
  globalObject: globalThis,
  bridge: atlasLiveMapCentreBridge
});

const atlasMapAttachmentAuthorization =
  createControlledOneSessionDeveloperMapAttachmentAuthorization({
    getSafetyFlags() {
      return atlasLiveMapCentreBridge.getSafetyFlags();
    }
  });

const atlasMapAttachmentController =
  createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
    runAtlasDiagnostic() {
      const diagnosticFunction =
        globalThis?.GrowGoDeveloperDiagnostics?.getAtlasDiagnosticForCurrentMapCentre;

      return typeof diagnosticFunction === "function" ? diagnosticFunction() : null;
    },
    getAuthorizationState() {
      return atlasMapAttachmentAuthorization.readAttachmentAuthorizationStateForController();
    }
  });

installGatedDeveloperOnlyAtlasMapAttachmentController({
  globalObject: globalThis,
  controller: atlasMapAttachmentController
});

installControlledOneSessionDeveloperMapAttachmentAuthorization({
  globalObject: globalThis,
  authorization: atlasMapAttachmentAuthorization,
  controller: atlasMapAttachmentController
});

const atlasFirstHarmlessVisualController =
  createDeveloperOnlyAtlasFirstHarmlessVisualController({
    getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
    attachmentStatusProvider: () =>
      atlasMapAttachmentController.getAtlasMapAttachmentStatus(),
    leafletProvider: () => globalThis?.L ?? null
  });

const atlasVisualPrimitiveLayer = createDeveloperOnlyAtlasVisualPrimitiveLayer({
  getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
  attachmentStatusProvider: () =>
    atlasMapAttachmentController.getAtlasMapAttachmentStatus(),
  leafletProvider: () => globalThis?.L ?? null
});

const atlasFirstApprovedLiveAssetController =
  createDeveloperOnlyAtlasSharedApprovedLiveAssetController({
    getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
    attachmentStatusProvider: () =>
      atlasMapAttachmentController.getAtlasMapAttachmentStatus(),
    documentObject: globalThis?.document ?? null,
    hostObject: globalThis
  });

const atlasAttachmentBrowserSurface =
  installDeveloperOnlyAtlasAttachmentBrowserSurface({
    authorization: atlasMapAttachmentAuthorization,
    controller: atlasMapAttachmentController,
    getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
    visualController: atlasFirstHarmlessVisualController,
    primitiveLayer: atlasVisualPrimitiveLayer,
    approvedAssetController: atlasFirstApprovedLiveAssetController
  });

atlasAttachmentBrowserSurface?.refresh();
if (atlasAttachmentBrowserSurface && globalThis?.addEventListener) {
  globalThis.addEventListener(
    "load",
    () => {
      atlasAttachmentBrowserSurface.refresh();
    },
    { once: true }
  );
}

const atlasRendererHandoffReadiness =
  createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      const diagnosticFunction =
        globalThis?.GrowGoDeveloperDiagnostics?.getAtlasDiagnosticForCurrentMapCentre;

      return typeof diagnosticFunction === "function" ? diagnosticFunction() : null;
    },
    getRendererConsumerDescriptor() {
      return createDiscoveredGrowGoCustom25DRendererConsumerDescriptor();
    }
  });

installDeveloperOnlyLiveAtlasRendererHandoffReadiness({
  globalObject: globalThis,
  readiness: atlasRendererHandoffReadiness
});

const atlasRendererHandoffAuthorization =
  createControlledOneSessionDeveloperRendererHandoffAuthorization({
    getCurrentReadiness() {
      return atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness();
    }
  });

installControlledOneSessionDeveloperRendererHandoffAuthorization({
  globalObject: globalThis,
  authorization: atlasRendererHandoffAuthorization
});

const growGoCustom25DLiveOneFrameAdapter =
  createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    rawLeafletMapReference: rawLeafletMapReferenceFromBridge,
    frameSnapshotProvider: () =>
      atlasCustom25DOneFrameExecutionTrace.wrap(
        "createCustom25DFrameViewportSnapshotForOneFrame",
        (input) =>
          createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics?.(
            input
          ) ?? null
      ),
    drawFunctionProvider: () =>
      atlasCustom25DOneFrameExecutionTrace.wrap(
        "drawCustom25DOneFrameFromSnapshot",
        (input) =>
          drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics?.(input) ?? null
      )
  });

const atlasCustom25DOneFrameCommand =
  createDeveloperOnlyAtlasCustom25DOneFrameCommand({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    readinessProvider: () =>
      atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness(),
    authorizationStatusProvider: () =>
      atlasRendererHandoffAuthorization.getAtlasRendererHandoffAuthorizationStatus(),
    authorizationConsume: () =>
      atlasRendererHandoffAuthorization.consumeAuthorizedRendererHandoffAttempt(),
    adapterProvider: () => growGoCustom25DLiveOneFrameAdapter,
    animationFrameProvider: (callback) => globalThis?.requestAnimationFrame?.(callback)
  });

installDeveloperOnlyAtlasCustom25DOneFrameCommand({
  globalObject: globalThis,
  command: atlasCustom25DOneFrameCommand
});

const persistentOneFrameSurfaceOperations =
  createGrowGoCustom25DLiveOneFrameSurfaceOperations({
    leafletProvider: globalThis?.L ?? null,
    devicePixelRatioProvider: () => globalThis?.devicePixelRatio ?? 1
  });

const controlledPersistentAtlasIntegration =
  createControlledPersistentAtlasContractIntegration({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    rawMapProvider: {
      resolveRawMap() {
        const map = resolvePersistentAuthoritativeMapReference();

        return {
          map,
          mapIdentityId: resolvePersistentMapIdentityId(map)
        };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness({ map } = {}) {
        try {
          return {
            approved: true,
            reasonCode: "READINESS_APPROVED",
            identity: readApprovedPersistentReadinessIdentity(map)
          };
        } catch (error) {
          return {
            approved: false,
            reasonCode: toReasonCode(error, "READINESS_REJECTED"),
            identity: null
          };
        }
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity({ map } = {}) {
        return readApprovedPersistentReadinessIdentity(map);
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface({ map, identity } = {}) {
        const prepared = persistentOneFrameSurfaceOperations.prepareOneFrameSurface({
          map
        });

        if (prepared?.outcome !== "prepared" || !prepared?.surface) {
          throw Object.assign(
            new Error(prepared?.reasonCode ?? "RETAINED_SURFACE_PROVIDER_FAILED"),
            {
              reasonCode:
                prepared?.reasonCode ?? "RETAINED_SURFACE_PROVIDER_FAILED"
            }
          );
        }

        persistentPreparedSurface = prepared.surface;
        persistentSurfaceOwnerId = `LIVE_PERSISTENT_SURFACE_${identity?.sessionId ?? "UNKNOWN"}`;
        persistentLifecycleOwnerId = `LIVE_PERSISTENT_LIFECYCLE_${identity?.sessionId ?? "UNKNOWN"}`;
        persistentLifecycleGenerationId = `${persistentLifecycleOwnerId}_GEN_001`;

        return {
          pane: prepared.surface.pane,
          canvas: prepared.surface.canvas,
          surfaceOwnerId: persistentSurfaceOwnerId,
          lifecycleOwnerId: persistentLifecycleOwnerId
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner({ identity } = {}) {
        if (!persistentPreparedSurface) {
          throw Object.assign(new Error("MISSING_PREPARED_SURFACE"), {
            reasonCode: "MISSING_PREPARED_SURFACE"
          });
        }

        if (!persistentLifecycleOwner) {
          const ownerId =
            persistentLifecycleOwnerId ??
            `LIVE_PERSISTENT_LIFECYCLE_${identity?.sessionId ?? "UNKNOWN"}`;
          const generationId =
            persistentLifecycleGenerationId ?? `${ownerId}_GEN_001`;
          const surfaceOwnerId =
            persistentSurfaceOwnerId ??
            `LIVE_PERSISTENT_SURFACE_${identity?.sessionId ?? "UNKNOWN"}`;

          persistentLifecycleOwnerId = ownerId;
          persistentLifecycleGenerationId = generationId;
          persistentSurfaceOwnerId = surfaceOwnerId;

          persistentLifecycleOwner = {
            ownerId,
            id: ownerId,
            registerOwnedResources() {
              return true;
            },
            disposeOwnedResources() {
              return true;
            },
            getLifecycleOwnerStatus() {
              return Object.freeze({
                lifecycleOwnerId: ownerId,
                lifecycleGenerationId: generationId,
                surfaceOwnerId
              });
            }
          };
        }

        return {
          lifecycleOwner: persistentLifecycleOwner,
          lifecycleOwnerId: persistentLifecycleOwnerId,
          ownerId: persistentLifecycleOwnerId,
          lifecycleGenerationId: persistentLifecycleGenerationId,
          surfaceOwnerId: persistentSurfaceOwnerId
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ map, identity, reason } = {}) {
        persistentSnapshotDiagnosticsState.snapshotCreateAttemptCount += 1;

        if (!persistentPreparedSurface?.canvas) {
          persistentSnapshotDiagnosticsState.lastFailureReason =
            "PERSISTENT_SURFACE_CANVAS_UNAVAILABLE";
          throw Object.assign(new Error("PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"), {
            reasonCode: "PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"
          });
        }

        try {
          const snapshotResult =
            createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics?.({
              map,
              canvas: persistentPreparedSurface.canvas
            }) ?? null;

          if (
            !snapshotResult ||
            typeof snapshotResult !== "object" ||
            snapshotResult.outcome === "blocked" ||
            !snapshotResult.frameViewportSnapshot
          ) {
            persistentSnapshotDiagnosticsState.lastFailureReason =
              snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED";
            throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
              reasonCode: snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED"
            });
          }

          const identifiers = createPersistentSnapshotIdentifiers();
          const snapshot = normalizePersistentAtlasFrameSnapshotForContract({
            rawSnapshot: snapshotResult.frameViewportSnapshot,
            map,
            identity,
            lifecycleIdentity: {
              lifecycleOwnerId: persistentLifecycleOwnerId,
              lifecycleGenerationId: persistentLifecycleGenerationId,
              surfaceOwnerId: persistentSurfaceOwnerId
            },
            redrawReason: reason,
            ...identifiers
          });

          persistentSnapshotDiagnosticsState.lastFailureReason = null;
          persistentSnapshotDiagnosticsState.rawReferenceDetected = false;
          persistentSnapshotDiagnosticsState.rawReferenceFieldPath = null;
          persistentSnapshotDiagnosticsState.rawReferenceType = null;
          persistentSnapshotDiagnosticsState.rawReferenceConstructorName = null;
          persistentSnapshotDiagnosticsState.snapshotCreateCompletedCount += 1;

          return snapshot;
        } catch (error) {
          const reasonCode =
            typeof error?.reasonCode === "string"
              ? error.reasonCode
              : "SNAPSHOT_PROVIDER_FAILED";
          persistentSnapshotDiagnosticsState.lastFailureReason = reasonCode;
          persistentSnapshotDiagnosticsState.rawReferenceDetected =
            reasonCode === "RAW_REFERENCE_DETECTED";
          persistentSnapshotDiagnosticsState.rawReferenceFieldPath =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceFieldPath === "string"
              ? error.rawReferenceFieldPath
              : null;
          persistentSnapshotDiagnosticsState.rawReferenceType =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceType === "string"
              ? error.rawReferenceType
              : null;
          persistentSnapshotDiagnosticsState.rawReferenceConstructorName =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceConstructorName === "string"
              ? error.rawReferenceConstructorName
              : null;
          throw error;
        }
      }
    },
    frameDrawProvider: {
      drawPersistentFrame({ canvas, snapshot } = {}) {
        const frameViewportSnapshot =
          toOneFrameViewportSnapshotContract(snapshot);
        const drawResult =
          drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics?.({
            canvas: canvas ?? persistentPreparedSurface?.canvas ?? null,
            frameViewportSnapshot
          }) ?? null;

        if (
          !drawResult ||
          (drawResult.outcome === "blocked" &&
            typeof drawResult.reasonCode === "string")
        ) {
          throw Object.assign(
            new Error(drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"),
            {
              reasonCode: drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"
            }
          );
        }

        return drawResult;
      }
    },
    animationFrameScheduler(callback) {
      return globalThis?.requestAnimationFrame?.(() => callback());
    },
    animationFrameCanceller(handle) {
      globalThis?.cancelAnimationFrame?.(handle);
    },
    approvedListenerRegistrar(eventName, callback) {
      const map = resolvePersistentAuthoritativeMapReference();

      if (!map || typeof map.on !== "function") {
        throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "LISTENER_REGISTRATION_FAILED"
        });
      }

      map.on(eventName, callback);
      return {
        map,
        eventName,
        callback
      };
    },
    approvedListenerRemover(registration) {
      registration?.map?.off?.(registration?.eventName, registration?.callback);
    },
    retainedCleanupProvider: {
      cleanupPersistentAttachment({ lifecycleOwner } = {}) {
        const cleanupFailureReasons = [];

        if (persistentPreparedSurface) {
          const rollback =
            persistentOneFrameSurfaceOperations.rollbackPreparedSurface({
              surface: persistentPreparedSurface
            });

          if (
            rollback?.outcome === "failed_closed" &&
            typeof rollback?.reasonCode === "string"
          ) {
            cleanupFailureReasons.push(rollback.reasonCode);
          }
        }

        try {
          lifecycleOwner?.disposeOwnedResources?.();
        } catch (error) {
          cleanupFailureReasons.push(
            toReasonCode(error, "LIFECYCLE_OWNER_RELEASE_FAILED")
          );
        }

        clearPersistentRuntimeReferences();

        return {
          cleanupCompleted: cleanupFailureReasons.length === 0,
          reasonCode:
            cleanupFailureReasons[0] ?? "CONTROLLED_PERSISTENT_ATLAS_CLEANUP_COMPLETED",
          cleanupFailureReasons,
          referencesReleased: cleanupFailureReasons.length === 0
        };
      }
    }
  });

const diagnosticsNamespaceAfterPersistentAtlasIntegration =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespaceAfterPersistentAtlasIntegration) {
  diagnosticsNamespaceAfterPersistentAtlasIntegration.atlasStartupCheckpointAfterPersistentAtlasIntegration =
    true;
  diagnosticsNamespaceAfterPersistentAtlasIntegration.atlasStartupLastReachedCheckpoint =
    "after_persistent_atlas_integration";
}

const atlasPopulationPreviewSnapshotProvider =
  createPersistentAtlasFrameSnapshotProvider({
    oneFrameSnapshotProvider({
      map,
      identitySnapshot,
      redrawReason,
      snapshotId,
      snapshotGenerationId,
      snapshotCreatedAt
    } = {}) {
      if (!persistentPreparedSurface?.canvas) {
        throw Object.assign(new Error("PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"), {
          reasonCode: "PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"
        });
      }

      const snapshotResult =
        createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics?.({
          map,
          canvas: persistentPreparedSurface.canvas
        }) ?? null;

      if (
        !snapshotResult ||
        typeof snapshotResult !== "object" ||
        snapshotResult.outcome === "blocked" ||
        !snapshotResult.frameViewportSnapshot
      ) {
        throw Object.assign(
          new Error(snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED"),
          {
            reasonCode: snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED"
          }
        );
      }

      updateAtlasAssetPopulationPreviewSnapshotTrace({
        stage: "one_frame_snapshot_created",
        normalizationStage: "one_frame_snapshot_created",
        snapshotId,
        snapshotGenerationId,
        ...{
          boundsPresent:
            snapshotResult.frameViewportSnapshot?.bounds != null ||
            snapshotResult.frameViewportSnapshot?.projectedViewportBounds != null,
          boundsType:
            snapshotResult.frameViewportSnapshot?.projectedViewportBounds != null
              ? typeof snapshotResult.frameViewportSnapshot.projectedViewportBounds
              : snapshotResult.frameViewportSnapshot?.bounds != null
                ? typeof snapshotResult.frameViewportSnapshot.bounds
                : null,
          boundsKeys:
            snapshotResult.frameViewportSnapshot?.projectedViewportBounds &&
            typeof snapshotResult.frameViewportSnapshot.projectedViewportBounds ===
              "object"
              ? Object.keys(
                  snapshotResult.frameViewportSnapshot.projectedViewportBounds
                ).sort()
              : snapshotResult.frameViewportSnapshot?.bounds &&
                  typeof snapshotResult.frameViewportSnapshot.bounds === "object"
                ? Object.keys(snapshotResult.frameViewportSnapshot.bounds).sort()
                : [],
          northWestLatitude:
            Number.isFinite(
              Number(
                snapshotResult.frameViewportSnapshot?.projectedViewportBounds
                  ?.northWestLatitude
              )
            )
              ? Number(
                  snapshotResult.frameViewportSnapshot.projectedViewportBounds
                    .northWestLatitude
                )
              : Number.isFinite(
                    Number(
                      snapshotResult.frameViewportSnapshot?.northWestCoordinate
                        ?.latitude
                    )
                  )
                ? Number(
                    snapshotResult.frameViewportSnapshot.northWestCoordinate
                      .latitude
                  )
                : null,
          northWestLongitude:
            Number.isFinite(
              Number(
                snapshotResult.frameViewportSnapshot?.projectedViewportBounds
                  ?.northWestLongitude
              )
            )
              ? Number(
                  snapshotResult.frameViewportSnapshot.projectedViewportBounds
                    .northWestLongitude
                )
              : Number.isFinite(
                    Number(
                      snapshotResult.frameViewportSnapshot?.northWestCoordinate
                        ?.longitude
                    )
                  )
                ? Number(
                    snapshotResult.frameViewportSnapshot.northWestCoordinate
                      .longitude
                  )
                : null,
          southEastLatitude: null,
          southEastLongitude: null,
          north: Number.isFinite(
            Number(snapshotResult.frameViewportSnapshot?.bounds?.north)
          )
            ? Number(snapshotResult.frameViewportSnapshot.bounds.north)
            : null,
          south: Number.isFinite(
            Number(snapshotResult.frameViewportSnapshot?.bounds?.south)
          )
            ? Number(snapshotResult.frameViewportSnapshot.bounds.south)
            : null,
          east: Number.isFinite(
            Number(snapshotResult.frameViewportSnapshot?.bounds?.east)
          )
            ? Number(snapshotResult.frameViewportSnapshot.bounds.east)
            : null,
          west: Number.isFinite(
            Number(snapshotResult.frameViewportSnapshot?.bounds?.west)
          )
            ? Number(snapshotResult.frameViewportSnapshot.bounds.west)
            : null
        }
      });

      return normalizePersistentAtlasFrameSnapshotForContract({
        rawSnapshot: snapshotResult.frameViewportSnapshot,
        map,
        identity: identitySnapshot,
        lifecycleIdentity: {
          lifecycleOwnerId: persistentLifecycleOwnerId,
          lifecycleGenerationId: persistentLifecycleGenerationId,
          surfaceOwnerId: persistentSurfaceOwnerId
        },
        redrawReason,
        snapshotId,
        snapshotGenerationId,
        snapshotCreatedAt,
        traceRecorder: updateAtlasAssetPopulationPreviewSnapshotTrace
      });
    },
    mapProvider() {
      const map = resolvePersistentAuthoritativeMapReference();
      return {
        map,
        mapIdentityId: resolvePersistentMapIdentityId(map)
      };
    },
    readinessProvider() {
      return {
        diagnosticStatus: "approved",
        reasonCode: "READINESS_APPROVED",
        ...readApprovedPersistentReadinessIdentity()
      };
    },
    identityProvider() {
      return readApprovedPersistentReadinessIdentity();
    },
    lifecycleIdentityProvider() {
      return {
        lifecycleOwnerId: persistentLifecycleOwnerId,
        lifecycleGenerationId: persistentLifecycleGenerationId,
        surfaceOwnerId: persistentSurfaceOwnerId
      };
    },
    snapshotReleaseProvider() {
      return {
        released: true
      };
    },
    timeProvider: () => new Date().toISOString()
  });

const atlasPopulationDrawIntegration = createAtlasPopulationDrawIntegration({
  snapshotProvider: atlasPopulationPreviewSnapshotProvider,
  atlasIdentityProvider: () => readApprovedPersistentReadinessIdentity(),
  retainedSurfaceResolver() {
    if (!persistentPreparedSurface?.canvas || !persistentPreparedSurface?.pane) {
      throw Object.assign(new Error("RETAINED_SURFACE_UNAVAILABLE"), {
        reasonCode: "RETAINED_SURFACE_UNAVAILABLE"
      });
    }

    return {
      canvas: persistentPreparedSurface.canvas,
      pane: persistentPreparedSurface.pane
    };
  },
  retainedSurfaceValidator() {
    const status =
      controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ?? {};
    return {
      ok: true,
      canvasIdentityId: "LIVE_PERSISTENT_CANVAS_001",
      paneIdentityId: "LIVE_PERSISTENT_PANE_001",
      sessionId: status.sessionId ?? null,
      mapIdentityId: status.mapIdentityId ?? null,
      surfaceOwnerId: persistentSurfaceOwnerId
    };
  },
  lifecycleOwnerResolver() {
    if (!persistentLifecycleOwner) {
      throw Object.assign(new Error("LIFECYCLE_OWNER_UNAVAILABLE"), {
        reasonCode: "LIFECYCLE_OWNER_UNAVAILABLE"
      });
    }
    return persistentLifecycleOwner;
  },
  lifecycleOwnerValidator() {
    return {
      ok: true,
      lifecycleOwnerId: persistentLifecycleOwnerId,
      lifecycleGenerationId: persistentLifecycleGenerationId,
      surfaceOwnerId: persistentSurfaceOwnerId
    };
  },
  authorizationResolver() {
    return controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ?? null;
  },
  authorizationValidator({ drawGenerationId, redrawReason }) {
    const status =
      controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ?? {};
    if (status.attached !== true || status.redrawPermissionAllowed !== true) {
      return {
        ok: false,
        reasonCode: "AUTHORIZATION_DENIED"
      };
    }
    return {
      ok: true,
      authorized: true,
      sessionId: status.sessionId ?? null,
      mapIdentityId: status.mapIdentityId ?? null,
      drawGenerationId,
      redrawReason
    };
  },
  populationBatchDrawProvider({
    canvas,
    pane,
    snapshot,
    mutableDrawState,
    populationBatch,
    drawGenerationId,
    redrawReason
  } = {}) {
    updateAtlasAssetPopulationPreviewSnapshotTrace({
      populationPlanId: populationBatch?.populationPlanId ?? null,
      batchId: populationBatch?.batchId ?? null,
      snapshotId: snapshot?.snapshotId ?? null,
      snapshotGenerationId: snapshot?.snapshotGenerationId ?? null
    });
    const frameViewportSnapshot = toOneFrameViewportSnapshotContract(snapshot, {
      traceRecorder: updateAtlasAssetPopulationPreviewSnapshotTrace
    });
    const drawResult =
      drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics?.({
        canvas: canvas ?? persistentPreparedSurface?.canvas ?? null,
        pane: pane ?? persistentPreparedSurface?.pane ?? null,
        frameViewportSnapshot,
        mutableDrawState,
        populationBatch,
        drawGenerationId,
        redrawReason
      }) ?? null;

    if (
      !drawResult ||
      (drawResult.outcome === "blocked" &&
        typeof drawResult.reasonCode === "string")
    ) {
      throw Object.assign(
        new Error(drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"),
        {
          reasonCode: drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"
        }
      );
    }

    return drawResult;
  },
  mutableDrawStateProvider({ snapshotScalars, drawGenerationId, redrawReason } = {}) {
    return {
      snapshotScalars,
      drawGenerationId,
      redrawReason,
      canvasLayerPosition: {
        x: Number(snapshotScalars?.canvasLayerPosition?.x ?? 0),
        y: Number(snapshotScalars?.canvasLayerPosition?.y ?? 0)
      }
    };
  },
  canvasPositionAdapter({ canvas, mutableCanvasLayerPosition } = {}) {
    const mutablePosition = {
      x: Number(mutableCanvasLayerPosition?.x ?? 0),
      y: Number(mutableCanvasLayerPosition?.y ?? 0)
    };

    if (globalThis?.L?.DomUtil?.setPosition && canvas) {
      try {
        globalThis.L.DomUtil.setPosition(canvas, mutablePosition);
      } catch {
        canvas._leaflet_pos = mutablePosition;
      }
    }

    return {
      positionAdapterPath: "direct_leaflet_position"
    };
  },
  drawStateReleaseProvider() {},
  batchReferenceReleaseProvider() {},
  drawReasonTraceRecorder: updateAtlasPopulationDrawReasonTrace,
  timeProvider: () => new Date().toISOString()
});

const atlasAssetPopulationPreview =
  createDeveloperOnlyAtlasAssetPopulationPreview({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    persistentStatusProvider: () =>
      controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
      null,
    populationDrawIntegration: atlasPopulationDrawIntegration,
    snapshotTraceProvider: readAtlasAssetPopulationPreviewSnapshotTrace,
    snapshotTraceResetter: resetAtlasAssetPopulationPreviewSnapshotTrace,
    snapshotTraceUpdater: updateAtlasAssetPopulationPreviewSnapshotTrace
  });

const atlasLiveFeatureInputAdapter =
  createDeveloperOnlyAtlasLiveFeatureInputAdapter({
    featureSourceProvider: () =>
      readCustom25DCurrentViewportFeatureSourceFromScriptDiagnostics(),
    viewportProvider: () => {
      const map = resolvePersistentAuthoritativeMapReference();
      const identity = readApprovedPersistentReadinessIdentity(map);
      const bounds = map?.getBounds?.();
      const northWest = bounds?.getNorthWest?.();
      const southEast = bounds?.getSouthEast?.();
      if (!northWest || !southEast) {
        throw Object.assign(new Error("INVALID_VIEWPORT"), {
          reasonCode: "INVALID_VIEWPORT"
        });
      }

      const north = Math.max(Number(northWest.lat), Number(southEast.lat));
      const south = Math.min(Number(northWest.lat), Number(southEast.lat));
      const east = Math.max(Number(northWest.lng), Number(southEast.lng));
      const west = Math.min(Number(northWest.lng), Number(southEast.lng));

      return Object.freeze({
        viewportIdentity: `ATLAS_LIVE_VIEWPORT_${hashAtlasViewportIdentity({
          mapIdentityId: identity.mapIdentityId,
          regionId: identity.regionId,
          packageId: identity.packageId,
          recipeId: identity.recipeId,
          selectorSeed: identity.selectorSeed,
          north,
          south,
          east,
          west,
          zoom: Number(map?.getZoom?.() ?? 0)
        })}`,
        mapIdentityId: identity.mapIdentityId,
        regionId: identity.regionId,
        packageId: identity.packageId,
        recipeId: identity.recipeId,
        selectorSeed: identity.selectorSeed,
        zoom: Number(map?.getZoom?.() ?? 0),
        bounds: Object.freeze({
          north,
          south,
          east,
          west
        })
      });
    },
    identityProvider: () =>
      readApprovedPersistentReadinessIdentity(
        resolvePersistentAuthoritativeMapReference()
      )
  });

const atlasWorldPopulationPlanner =
  createDeveloperOnlyAtlasWorldPopulationPlanner();

const atlasAutomaticPopulationController =
  createAtlasAutomaticPopulationController({
    viewportIdentityProvider: () =>
      Object.freeze({
        viewportIdentity:
          atlasLiveFeatureInputAdapter.__deps.viewportProvider?.()?.viewportIdentity ??
          "ATLAS_AUTO_VIEWPORT_UNAVAILABLE",
        featureSourceGenerationId:
          atlasLiveFeatureInputAdapter.__deps.viewportProvider?.()
            ?.viewportIdentity ?? null
      }),
    atlasIdentityProvider: () =>
      readApprovedPersistentReadinessIdentity(
        resolvePersistentAuthoritativeMapReference()
      ),
    readinessProvider: () => {
      const status =
        controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
        {};
      if (status.attached !== true || status.redrawPermissionAllowed !== true) {
        return {
          approved: false,
          reasonCode: "READINESS_BLOCKED"
        };
      }
      readApprovedPersistentReadinessIdentity(resolvePersistentAuthoritativeMapReference());
      return {
        approved: true,
        reasonCode: "READINESS_APPROVED"
      };
    },
    liveFeatureAdapter: ({ budgets } = {}) =>
      extractDeveloperOnlyAtlasLiveViewportFeatures(atlasLiveFeatureInputAdapter, {
        budget: {
          maxExtractedFeatures: Number(
            budgets?.maxSourceFeaturesPerViewport ?? 64
          ),
          maxNormalizedFeatures: Number(
            budgets?.maxNormalizedFeatures ?? 48
          ),
          maxPopulationCommands: Number(
            budgets?.maxPopulationCommands ?? 24
          )
        }
      }),
    populationPlanner: ({ generation, featureResult, budgets } = {}) =>
      createDeveloperOnlyAtlasWorldPopulationPlan(atlasWorldPopulationPlanner, {
        regionId: generation?.regionId,
        packageId: generation?.packageId,
        recipeId: generation?.recipeId,
        selectorSeed: generation?.selectorSeed,
        viewportId: generation?.viewportIdentity,
        features: featureResult?.normalizedFeatures ?? [],
        relationshipContext: featureResult?.relationshipContext,
        performanceBudget: {
          maximumCandidateFeatures: Number(
            budgets?.maxSourceFeaturesPerViewport ?? 64
          ),
          maximumCommands: Number(
            budgets?.maxPopulationCommands ?? 24
          ),
          maximumVegetationCommands: Number(
            budgets?.maxVegetationInstances ?? 18
          ),
          maximumBuildingCommands: Number(
            budgets?.maxBuildingInstances ?? 6
          )
        }
      }),
    populationDrawIntegration: ({ generation, plan } = {}) => {
      updateAtlasPopulationDrawReasonTrace({
        controllerTriggerReason: generation?.triggerReason ?? null,
        generationTriggerReason: generation?.triggerReason ?? null,
        lastFailureReason: null,
        traceCompleted: false
      });
      const populationDrawReason =
        typeof generation?.triggerReason === "string" &&
        generation.triggerReason.trim()
          ? generation.triggerReason
          : "manual_redraw";
      updateAtlasPopulationDrawReasonTrace({
        requestedRedrawReason: populationDrawReason,
        populationDrawReason,
        persistentRedrawReason: populationDrawReason,
        redrawReasonAccepted: null,
        redrawReasonRejected: null,
        lastFailureReason: null,
        traceCompleted: false
      });
      const result = submitAtlasPopulationPlanForDraw(atlasPopulationDrawIntegration, {
        plan,
        redrawReason: populationDrawReason
      });
      updateAtlasPopulationDrawReasonTrace({
        lastFailureReason: null,
        traceCompleted: true
      });
      return {
        submission: {
          batchId: result.batchId,
          viewportGenerationId: generation?.viewportGenerationId ?? null
        },
        draw: {
          batchId: result.batchId,
          viewportGenerationId: generation?.viewportGenerationId ?? null,
          drawCompleted: result.drawCompleted === true
        }
      };
    },
    populationReferenceReleaseProvider: () => ({ released: true })
  });

const atlasAutomaticPopulationLiveEventAdapter =
  createAtlasAutomaticPopulationLiveEventAdapter({
    mapProvider: () => resolvePersistentAuthoritativeMapReference(),
    controller: atlasAutomaticPopulationController,
    listenerRegistrar: (map, eventName, callback) => {
      map.on(eventName, callback);
      return {
        eventName,
        callbackIdentity: eventName
      };
    },
    listenerRemover: (map, eventName, callback) => {
      map.off(eventName, callback);
    },
    viewportIdentityProvider: ({ eventName } = {}) =>
      Object.freeze({
        viewportIdentity:
          atlasLiveFeatureInputAdapter.__deps.viewportProvider?.()?.viewportIdentity ??
          `ATLAS_AUTO_VIEWPORT_${eventName ?? "UNKNOWN"}`,
        featureSourceGenerationId:
          atlasLiveFeatureInputAdapter.__deps.viewportProvider?.()
            ?.viewportIdentity ?? null
      }),
    readinessProvider: () => {
      const status =
        controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
        {};
      if (status.attached !== true || status.redrawPermissionAllowed !== true) {
        return {
          approved: false,
          reasonCode: "READINESS_BLOCKED"
        };
      }
      readApprovedPersistentReadinessIdentity(resolvePersistentAuthoritativeMapReference());
      return {
        approved: true,
        reasonCode: "READINESS_APPROVED"
      };
    },
    atlasIdentityProvider: () =>
      Object.freeze({
        ...readApprovedPersistentReadinessIdentity(
          resolvePersistentAuthoritativeMapReference()
        ),
        sessionId:
          controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.()
            ?.sessionId ?? null
      })
  });

const controlledAutomaticAtlasPopulationToggle =
  createDeveloperOnlyControlledAutomaticAtlasPopulationToggle({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    persistentStatusProvider: () =>
      controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
      null,
    readinessValidationProvider: () => {
      readApprovedPersistentReadinessIdentity(resolvePersistentAuthoritativeMapReference());
      return {
        approved: true,
        reasonCode: "READINESS_APPROVED"
      };
    },
    controller: atlasAutomaticPopulationController,
    liveEventAdapter: atlasAutomaticPopulationLiveEventAdapter,
    drawReasonTraceProvider: readAtlasPopulationDrawReasonTrace,
    drawReasonTraceResetter: resetAtlasPopulationDrawReasonTrace
  });

const atlasControlledViewportPopulationPreview =
  createDeveloperOnlyAtlasControlledViewportPopulationPreview({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    persistentStatusProvider: () =>
      controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
      null,
    liveFeatureInputAdapter: atlasLiveFeatureInputAdapter,
    populationDrawIntegration: atlasPopulationDrawIntegration
  });

const diagnosticsNamespaceAfterViewportPreview =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespaceAfterViewportPreview) {
  diagnosticsNamespaceAfterViewportPreview.atlasStartupCheckpointAfterViewportPreview =
    true;
  diagnosticsNamespaceAfterViewportPreview.atlasStartupLastReachedCheckpoint =
    "after_viewport_preview";
}

const controlledPersistentAtlasManualCommand =
  createDeveloperOnlyControlledPersistentAtlasManualCommand({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    integrationProvider: () => controlledPersistentAtlasIntegration,
    compositionStatusProvider: () =>
      Object.freeze({
        schemaId:
          "GROWGO_CONTROLLED_PERSISTENT_ATLAS_LIVE_MANUAL_COMMAND_COMPOSITION_STATUS_001",
        state: "developer_only_manual_command_ready",
        bridgeSource:
          "captured_one_frame_bridge_and_renderer_handoff_readiness",
        rootSeamsMapped: true,
        startupInvocationPrevented: true,
        snapshotStatus: readPersistentSnapshotDiagnosticsStatus()
      })
  });

installDeveloperOnlyControlledPersistentAtlasManualCommand({
  globalObject: globalThis,
  command: controlledPersistentAtlasManualCommand
});

const diagnosticsNamespaceBeforeOneAssetInstallerCall =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespaceBeforeOneAssetInstallerCall) {
  diagnosticsNamespaceBeforeOneAssetInstallerCall.atlasStartupCheckpointBeforeOneAssetInstallerCall =
    true;
  diagnosticsNamespaceBeforeOneAssetInstallerCall.atlasStartupLastReachedCheckpoint =
    "before_one_asset_installer_call";
}

const controlledOneAssetLiveDrawBrowserWiringModule =
  await loadControlledOneAssetLiveDrawBrowserWiringModule();
const controlledOneAssetLiveDrawBrowserWiring =
  controlledOneAssetLiveDrawBrowserWiringModule
    ?.createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring?.({
      hostnameProvider: () => globalThis?.location?.hostname ?? "",
      persistentAtlasStatusProvider: () =>
        controlledPersistentAtlasIntegration.getIntegratedPersistentAtlasStatus?.() ??
        null
    }) ?? null;
const controlledOneAssetInstallerReturnedNamespace =
  controlledOneAssetLiveDrawBrowserWiringModule
    ?.installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring?.({
      globalObject: globalThis,
      wiring: controlledOneAssetLiveDrawBrowserWiring,
      hostnameProvider: () => globalThis?.location?.hostname ?? ""
    }) ?? null;

const controlledOneAssetInstallerNamespaceAfterInstall =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (controlledOneAssetInstallerNamespaceAfterInstall) {
  controlledOneAssetInstallerNamespaceAfterInstall.atlasStartupCheckpointAfterOneAssetInstallerCall =
    true;
  controlledOneAssetInstallerNamespaceAfterInstall.atlasStartupLastReachedCheckpoint =
    "after_one_asset_installer_call";
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerAttempted =
    true;
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerResultIsNull =
    controlledOneAssetInstallerReturnedNamespace == null;
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerResultType =
    controlledOneAssetInstallerReturnedNamespace == null
      ? "null"
      : typeof controlledOneAssetInstallerReturnedNamespace;
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerNamespaceKeys =
    controlledOneAssetInstallerReturnedNamespace &&
    typeof controlledOneAssetInstallerReturnedNamespace === "object"
      ? Object.freeze(
          Object.keys(controlledOneAssetInstallerReturnedNamespace)
            .filter((key) => typeof key === "string")
            .sort()
        )
      : Object.freeze([]);
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerReturnedNamespace =
    controlledOneAssetInstallerReturnedNamespace ===
    controlledOneAssetInstallerNamespaceAfterInstall;
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetInstallerReturnStatus =
    controlledOneAssetInstallerReturnedNamespace &&
    typeof controlledOneAssetInstallerReturnedNamespace === "object"
      ? "namespace_returned"
      : "namespace_unavailable";
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetCommandAvailableAfterInstall =
    typeof controlledOneAssetInstallerNamespaceAfterInstall
      .drawControlledOneAssetLive === "function";
  controlledOneAssetInstallerNamespaceAfterInstall.controlledOneAssetCommandKeysAfterInstall =
    Object.freeze(
      Object.keys(controlledOneAssetInstallerNamespaceAfterInstall)
        .filter((key) => typeof key === "string" && key.startsWith("controlledOneAsset"))
        .sort()
    );
}

installDeveloperOnlyControlledAutomaticAtlasPopulationToggle({
  globalObject: globalThis,
  toggle: controlledAutomaticAtlasPopulationToggle
});

installDeveloperOnlyAtlasAssetPopulationPreview({
  globalObject: globalThis,
  preview: atlasAssetPopulationPreview
});

installDeveloperOnlyAtlasControlledViewportPopulationPreview({
  globalObject: globalThis,
  preview: atlasControlledViewportPopulationPreview
});

const diagnosticsNamespace =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespace) {
  diagnosticsNamespace.getCustom25DOneFrameAdapterRuntimeIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameAdapterRuntimeIdentity?.() ??
    null;
  diagnosticsNamespace.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity?.() ??
    null;
  diagnosticsNamespace.getCustom25DOneFrameAdapterExecutionIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameAdapterExecutionIdentity?.() ??
    null;
}

const panel = buildPanel();
const elements = bindPanelElements(panel);

const controller = createDevelopmentAlphaController({
  readConfig() {
    return globalThis[CLIENT_CONFIG_GLOBAL] ?? null;
  },
  async createRuntime(runtimeContract) {
    return loadDevelopmentAlphaFirebaseRuntime(runtimeContract);
  },
  render(state) {
    renderPanel(elements, state);
  },
  toClientSafeError(error) {
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "The development backend is unavailable right now.";
  },
  isUnauthorizedError(error) {
    return (
      error?.code === "permission-denied" ||
      error?.code === "functions/permission-denied"
    );
  },
  createRequestId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
});

elements.signInButton.addEventListener("click", () => {
  controller.signIn().catch(() => {});
});
elements.signOutButton.addEventListener("click", () => {
  controller.signOut().catch(() => {});
});
elements.refreshButton.addEventListener("click", () => {
  controller.refreshSnapshot().catch(() => {});
});

controller.ensureInitialized().catch(() => {});

function buildPanel() {
  const panel = document.createElement("section");
  panel.id = "developmentAlphaStatusPanel";
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.bottom = "12px";
  panel.style.zIndex = "5000";
  panel.style.width = "min(320px, calc(100vw - 24px))";
  panel.style.background = "rgba(7, 20, 33, 0.92)";
  panel.style.color = "#f4f8ff";
  panel.style.border = "1px solid rgba(148, 178, 220, 0.35)";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  panel.style.padding = "12px";
  panel.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;">
      <div>
        <div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.72;">Development backend</div>
        <strong style="font-size:15px;">Private alpha status</strong>
      </div>
      <div id="developmentAlphaStatusBadge" style="font-size:11px;padding:4px 6px;border-radius:999px;background:#243447;">Blocked</div>
    </div>
    <div id="developmentAlphaSummary" style="font-size:13px;line-height:1.4;margin-bottom:8px;"></div>
    <div id="developmentAlphaSnapshot" style="font-size:12px;line-height:1.5;opacity:0.9;margin-bottom:10px;"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="developmentAlphaSignInButton" type="button" style="${buttonStyle("#5f7cff")}">Sign in</button>
      <button id="developmentAlphaRefreshButton" type="button" style="${buttonStyle("#1f7a5c")}">Refresh</button>
      <button id="developmentAlphaSignOutButton" type="button" style="${buttonStyle("#5c6470")}">Sign out</button>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function bindPanelElements(panel) {
  return {
    badge: panel.querySelector("#developmentAlphaStatusBadge"),
    summary: panel.querySelector("#developmentAlphaSummary"),
    snapshot: panel.querySelector("#developmentAlphaSnapshot"),
    signInButton: panel.querySelector("#developmentAlphaSignInButton"),
    refreshButton: panel.querySelector("#developmentAlphaRefreshButton"),
    signOutButton: panel.querySelector("#developmentAlphaSignOutButton")
  };
}

function renderPanel(elements, state) {
  elements.badge.textContent = summarizeBadge(state);
  elements.summary.innerHTML = [
    line("Environment", state.environment),
    line("Connection", state.connectionMode ?? "blocked"),
    line("Auth", state.authStatus),
    line("Invite", state.invitedStatus)
  ].join("");

  if (state.playerSnapshot) {
    elements.snapshot.innerHTML = [
      line("UID", state.user?.uid ?? "n/a"),
      line("Email", state.user?.email ?? "n/a"),
      line("Level", String(state.playerSnapshot.level)),
      line("XP", String(state.playerSnapshot.xp)),
      line("Coins", String(state.playerSnapshot.coins))
    ].join("");
  } else if (state.genericError) {
    elements.snapshot.textContent = state.genericError;
  } else if (state.blockedReasons.length > 0) {
    elements.snapshot.textContent = `Blocked: ${state.blockedReasons.join(", ")}`;
  } else {
    elements.snapshot.textContent =
      "No backend snapshot loaded. Sign in to the invited development alpha.";
  }

  elements.signInButton.disabled =
    state.initializationStatus !== "initialized" ||
    state.authStatus === "signed-in" ||
    state.authStatus === "signing-in";
  elements.signOutButton.disabled = state.authStatus !== "signed-in";
  elements.refreshButton.disabled =
    state.authStatus !== "signed-in" ||
    state.snapshotStatus === "loading" ||
    state.bootstrapStatus === "pending";
}

function summarizeBadge(state) {
  if (state.authStatus === "signed-in" && state.playerSnapshot) {
    return "Connected";
  }

  if (state.authStatus === "unauthorized") {
    return "Denied";
  }

  if (state.initializationStatus === "initialized") {
    return "Ready";
  }

  if (state.initializationStatus === "initializing") {
    return "Starting";
  }

  return "Blocked";
}

function line(label, value) {
  return `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;
}

function buttonStyle(background) {
  return [
    "appearance:none",
    "border:none",
    "border-radius:6px",
    "padding:8px 10px",
    "font:inherit",
    "font-size:12px",
    "font-weight:600",
    "cursor:pointer",
    "color:#fff",
    `background:${background}`
  ].join(";");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
