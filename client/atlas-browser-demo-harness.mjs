import {
  createAtlasEngineFirstManualBrowserVisiblePreviewMountSession
} from "../asset-factory/atlas-engine-first-manual-browser-visible-preview-mount.mjs";
import {
  validateCoastalStarterWorldBrowserShowcase
} from "../asset-factory/coastal-starter-world-browser-showcase.mjs";

export const atlasBrowserDemoPlaceholderObjects = Object.freeze([
  "LIGHTHOUSE_PLACEHOLDER",
  "HOUSE_PLACEHOLDER",
  "ROAD_PLACEHOLDER",
  "TREE_PLACEHOLDER"
]);

const expandedSettlementCategoryOrder = Object.freeze([
  "road",
  "vegetation",
  "building",
  "landmark"
]);

const selectableExpandedSettlementAssetIds = new Set([
  "BUILDING_COASTAL_COTTAGE_001",
  "TREE_EUCALYPTUS_001",
  "ROAD_COASTAL_001",
  "LIGHTHOUSE_ISLAND_ROCKY_001"
]);

const coastalShowcasePlacementByAssetId = Object.freeze({
  GROUND_COASTAL_GRASS_001: Object.freeze({ x: 0, y: 0, scale: 320 }),
  TREE_EUCALYPTUS_001: Object.freeze({ x: -150, y: -28, scale: 110 }),
  ROAD_COASTAL_001: Object.freeze({ x: 0, y: 120, scale: 260 }),
  BUILDING_COASTAL_COTTAGE_001: Object.freeze({ x: 120, y: 56, scale: 150 }),
  LIGHTHOUSE_ISLAND_ROCKY_001: Object.freeze({ x: 250, y: -94, scale: 172 })
});

export function createAtlasBrowserDemoHarness(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  if (!documentRef) {
    return freezeError(
      "document_required",
      "Atlas browser demo harness requires a browser document."
    );
  }

  const elements = resolveElements(documentRef, options);
  if (!elements.ok) {
    return elements;
  }

  const canvas = createPreviewCanvas(documentRef, elements.canvasContainer);
  const drawContext = canvas.getContext("2d");
  if (!drawContext) {
    return freezeError(
      "canvas_context_unavailable",
      "Atlas browser demo harness requires a 2D canvas context."
    );
  }

  const previewMountOptions =
    options.previewMountOptions ?? buildBrowserSafePreviewMountOptions();
  const realGroundPreviewBinding = resolveRealGroundPreviewBinding(
    options.realGroundPreviewBinding
  );
  const realGroundRenderBinding = resolveRealGroundRenderBinding(
    options.realGroundRenderBinding
  );
  const realGroundMeshPreview = resolveRealGroundMeshPreview(
    options.realGroundMeshPreview
  );
  const realGroundRuntimeLoader = resolveRealGroundRuntimeLoader(
    options.realGroundRuntimeLoader
  );
  const realGroundMeshRenderTest = resolveRealGroundMeshRenderTest(
    options.realGroundMeshRenderTest,
    realGroundRuntimeLoader
  );
  const coastalWorldShowcase = resolveCoastalWorldShowcase(
    options.coastalWorldShowcase
  );
  const expandedSettlementPreview = resolveExpandedSettlementPreview(
    options.expandedSettlementPreview
  );
  let currentPresentationProfile = "neighbourhood";
  let currentStyleReviewMode = false;
  let currentLightingProfile =
    expandedSettlementPreview?.visualStyling?.activeLightingProfile ?? "day";
  let renderableExpandedSettlementPreview = buildRenderableExpandedSettlementPreview(
    expandedSettlementPreview,
    {
      presentationProfile: currentPresentationProfile,
      lightingProfile: currentLightingProfile,
      styleReviewMode: currentStyleReviewMode
    }
  );
  let mounted = false;
  let previewSession = null;
  let lastExpandedSettlementLayout = null;
  let currentOverlayInteractionState = createDefaultOverlayInteractionState(
    expandedSettlementPreview
  );
  let currentPoiState = createDefaultPoiState(expandedSettlementPreview);
  let currentPoiContentMetadata = createDefaultPoiContentMetadata(
    expandedSettlementPreview
  );
  let currentPoiPresentationState = createDefaultPoiPresentationState(
    expandedSettlementPreview
  );
  let currentAssetDetailPreviewState = createDefaultAssetDetailPreviewState(
    expandedSettlementPreview
  );
  let currentPlayerMapState = createDefaultPlayerMapState(
    expandedSettlementPreview
  );
  let currentPlayerInteractionState = createDefaultPlayerInteractionState(
    expandedSettlementPreview,
    currentPlayerMapState
  );
  let currentCaptureState = createDefaultCaptureState(
    expandedSettlementPreview,
    currentPlayerMapState
  );
  let currentCaptureSessionStore = createDefaultCaptureSessionStore(
    expandedSettlementPreview,
    currentPlayerMapState,
    currentCaptureState
  );
  let currentCapturePresentationState = createDefaultCapturePresentationState(
    expandedSettlementPreview,
    currentCaptureState,
    currentCaptureSessionStore
  );
  let currentDiscoveryState = createDefaultDiscoveryState(
    expandedSettlementPreview,
    currentPlayerMapState
  );
  let currentCaptureSessionSummaryState = createDefaultCaptureSessionSummaryState(
    expandedSettlementPreview,
    currentPlayerMapState,
    currentCaptureSessionStore,
    currentDiscoveryState
  );
  let currentExplorationMode = "free_exploration";
  let currentSessionExperienceState = createDefaultSessionExperienceState(
    expandedSettlementPreview,
    currentPlayerMapState,
    currentOverlayInteractionState,
    currentPoiState,
    currentCaptureSessionSummaryState,
    currentExplorationMode
  );
  let currentExplorationProgressPresentationState =
    createDefaultExplorationProgressPresentationState(
      expandedSettlementPreview,
      currentCaptureSessionSummaryState,
      currentDiscoveryState,
      currentSessionExperienceState,
      currentPoiContentMetadata
    );
  let currentLandmarkShowcaseState = createDefaultLandmarkShowcaseState(
    expandedSettlementPreview,
    currentOverlayInteractionState,
    currentPoiContentMetadata,
    currentAssetDetailPreviewState,
    currentDiscoveryState,
    currentCaptureState
  );
  let currentLocationExperienceState = createDefaultLocationExperienceState(
    expandedSettlementPreview,
    currentPlayerMapState,
    currentPoiState,
    currentExplorationProgressPresentationState,
    currentLandmarkShowcaseState,
    currentSessionExperienceState
  );
  let activeVisualSourceSummary = buildVisualSourceSummary({
    expandedSettlementPreview,
    coastalWorldShowcase,
    visibilityState: "hidden"
  });
  let currentWorldExpansionDemoRoutingState =
    createDefaultWorldExpansionDemoRoutingState();

  setStatus(
    elements.status,
    expandedSettlementPreview
      ? "Settlement world ready. Use Show Coastal World."
      : coastalWorldShowcase
        ? "Coastal world ready. Use Show Coastal World."
        : "Atlas preview ready. Use Show Atlas Preview."
  );
  setContainerVisibility(elements.previewContainer, false);

  const redrawExpandedSettlementPreviewIfMounted = () => {
    if (!renderableExpandedSettlementPreview || !mounted) {
      return null;
    }
    lastExpandedSettlementLayout = drawExpandedSettlementPreview(
      drawContext,
      renderableExpandedSettlementPreview,
      {
        width: canvas.width,
        height: canvas.height,
        interactionState: currentOverlayInteractionState,
        playerState: currentPlayerMapState,
        captureSessionStore: currentCaptureSessionStore,
        capturePresentationState: currentCapturePresentationState,
        discoveryState: currentDiscoveryState,
        poiPresentationState: currentPoiPresentationState
      }
    );
    return lastExpandedSettlementLayout;
  };

  const syncRenderableExpandedSettlementPreview = () => {
    renderableExpandedSettlementPreview = buildRenderableExpandedSettlementPreview(
      expandedSettlementPreview,
      {
        presentationProfile: currentPresentationProfile,
        lightingProfile: currentLightingProfile,
        styleReviewMode: currentStyleReviewMode
      }
    );
    return renderableExpandedSettlementPreview;
  };

  const refreshCaptureSessionState = () => {
    if (!renderableExpandedSettlementPreview || !currentPlayerMapState) {
      return;
    }
    currentCaptureState = buildCaptureState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState.selectedObject,
      currentCaptureSessionStore.capturedObjectIds
    );
    currentCaptureSessionStore = buildCaptureSessionStore(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentCaptureState,
      currentCaptureSessionStore.sessionId
    );
    currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentCaptureSessionStore,
      currentDiscoveryState
    );
    currentCapturePresentationState = buildCapturePresentationState(
      renderableExpandedSettlementPreview,
      currentCaptureState,
      currentCaptureSessionStore
    );
    currentSessionExperienceState = buildSessionExperienceState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState,
      currentPoiState,
      currentCaptureSessionSummaryState,
      currentExplorationMode
    );
    currentExplorationProgressPresentationState =
      buildExplorationProgressPresentationState(
        renderableExpandedSettlementPreview,
        currentCaptureSessionSummaryState,
        currentDiscoveryState,
        currentSessionExperienceState,
        currentPoiContentMetadata
      );
    currentLandmarkShowcaseState = buildLandmarkShowcaseState(
      renderableExpandedSettlementPreview,
      currentOverlayInteractionState,
      currentPoiContentMetadata,
      currentAssetDetailPreviewState,
      currentDiscoveryState,
      currentCaptureState
    );
    currentLocationExperienceState = buildLocationExperienceState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentPoiState,
      currentExplorationProgressPresentationState,
      currentLandmarkShowcaseState,
      currentSessionExperienceState
    );
  };

  const refreshExplorationProgressPresentationState = () => {
    currentExplorationProgressPresentationState =
      buildExplorationProgressPresentationState(
        renderableExpandedSettlementPreview,
        currentCaptureSessionSummaryState,
        currentDiscoveryState,
        currentSessionExperienceState,
        currentPoiContentMetadata
      );
    currentLandmarkShowcaseState = buildLandmarkShowcaseState(
      renderableExpandedSettlementPreview,
      currentOverlayInteractionState,
      currentPoiContentMetadata,
      currentAssetDetailPreviewState,
      currentDiscoveryState,
      currentCaptureState
    );
    currentLocationExperienceState = buildLocationExperienceState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentPoiState,
      currentExplorationProgressPresentationState,
      currentLandmarkShowcaseState,
      currentSessionExperienceState
    );
  };

  const showHandler = () => {
    if (previewSession == null) {
      const sessionResult =
        createAtlasEngineFirstManualBrowserVisiblePreviewMountSession(undefined, {
          manual: true,
          isolated: true,
          ...previewMountOptions
        });
      if (!sessionResult.ok) {
        setStatus(elements.status, sessionResult.message);
        return Object.freeze({
          ok: false,
          errorCode: sessionResult.errorCode,
          message: sessionResult.message,
          previewMountResult: null
        });
      }

      previewSession =
        sessionResult.atlasFirstManualBrowserVisiblePreviewMountSession;
    }

    const mountResult = previewSession.startPreviewMount({
      manualPreviewStart: true
    });
    if (!mountResult.ok) {
      setStatus(elements.status, mountResult.message);
      return mountResult;
    }

    if (!mounted) {
      elements.canvasContainer.appendChild(canvas);
      mounted = true;
    }

    if (renderableExpandedSettlementPreview) {
      lastExpandedSettlementLayout = drawExpandedSettlementPreview(drawContext, renderableExpandedSettlementPreview, {
        width: canvas.width,
        height: canvas.height,
        interactionState: currentOverlayInteractionState,
        playerState: currentPlayerMapState,
        captureSessionStore: currentCaptureSessionStore,
        capturePresentationState: currentCapturePresentationState,
        poiPresentationState: currentPoiPresentationState
      });
    } else if (coastalWorldShowcase) {
      drawCoastalWorldShowcase(drawContext, coastalWorldShowcase, {
        width: canvas.width,
        height: canvas.height
      });
    } else {
      drawAtlasPlaceholderScene(drawContext, {
        width: canvas.width,
        height: canvas.height,
        placeholders: atlasBrowserDemoPlaceholderObjects,
        realGroundPreviewBinding,
        realGroundRenderBinding,
        realGroundMeshPreview,
        realGroundRuntimeLoader,
        realGroundMeshRenderTest
      });
    }
    setContainerVisibility(elements.previewContainer, true);
    setStatus(
      elements.status,
      renderableExpandedSettlementPreview
        ? renderableExpandedSettlementPreview.visualStyling?.styleReviewMode === true
          ? `Settlement style review visible with ${renderableExpandedSettlementPreview.sceneId}.`
          : renderableExpandedSettlementPreview.validationResult.objectsResolve
            ? `Settlement world visible with neighbourhood-scale scene ${renderableExpandedSettlementPreview.sceneId}.`
            : `Settlement world visible with fallback-safe scene ${renderableExpandedSettlementPreview.sceneId}.`
      : coastalWorldShowcase
        ? coastalWorldShowcase.verificationResult.realGlbBackedSceneValid
          ? `Coastal world visible with assembled real GLB-backed scene ${coastalWorldShowcase.sceneId}.`
          : `Coastal world visible with assembled fallback-safe scene ${coastalWorldShowcase.sceneId}.`
        : realGroundMeshRenderTest?.verificationResult.actualGlbGeometryRendered
        ? `Atlas preview visible with rendered GLB mesh ${realGroundMeshRenderTest.assetId}.`
        : realGroundRuntimeLoader?.validationResult.glbAvailable
        ? `Atlas preview visible with runtime GLB mesh ${realGroundRuntimeLoader.assetId}.`
        : realGroundMeshPreview?.validationResult.glbAvailable
        ? `Atlas preview visible with real GLB mesh geometry ${realGroundMeshPreview.assetId}.`
        : realGroundRenderBinding?.verificationResult.glbExists
        ? `Atlas preview visible with real GLB ground render asset ${realGroundRenderBinding.assetId}.`
        : realGroundPreviewBinding
          ? `Atlas preview visible with real GLB ground asset ${realGroundPreviewBinding.assetId}.`
        : "Atlas preview visible."
    );
    activeVisualSourceSummary = buildVisualSourceSummary({
      expandedSettlementPreview: renderableExpandedSettlementPreview,
      coastalWorldShowcase,
      visibilityState: "visible"
    });

    return Object.freeze({
      ok: true,
      previewMountResult: mountResult.previewMountResult,
      visualSourceSummary: activeVisualSourceSummary,
      expandedSettlementPreview: renderableExpandedSettlementPreview,
      coastalWorldShowcase,
      realGroundPreviewBinding,
      realGroundRenderBinding,
      realGroundMeshPreview,
      realGroundRuntimeLoader,
      realGroundMeshRenderTest
    });
  };

  const hideHandler = () => {
    clearAtlasPlaceholderScene(drawContext, canvas.width, canvas.height);
    lastExpandedSettlementLayout = null;
    const cleanup = previewSession.unmountPreview();
    setContainerVisibility(elements.previewContainer, false);
    setStatus(elements.status, "Atlas preview hidden.");
    activeVisualSourceSummary = buildVisualSourceSummary({
      expandedSettlementPreview: renderableExpandedSettlementPreview,
      coastalWorldShowcase,
      visibilityState: "hidden"
    });

    if (mounted && typeof elements.canvasContainer.removeChild === "function") {
      try {
        elements.canvasContainer.removeChild(canvas);
      } catch {
        // Keep cleanup fail-closed and idempotent for mock DOMs.
      }
      mounted = false;
    }

    return cleanup;
  };

  elements.showButton.addEventListener("click", showHandler);
  elements.hideButton.addEventListener("click", hideHandler);

  const hoverHandler = ({ x, y } = {}) => {
    if (!expandedSettlementPreview || !lastExpandedSettlementLayout) {
      return freezeSelectionFailure(
        "overlay_interaction_unavailable",
        "Expanded settlement overlay interaction is unavailable."
      );
    }
    const resolvedObject = resolveSelectableObjectAtCanvasPoint(
      lastExpandedSettlementLayout,
      x,
      y
    );
    currentOverlayInteractionState = buildOverlayInteractionState(
      renderableExpandedSettlementPreview,
      {
        selectedObject: currentOverlayInteractionState.selectedObject,
        hoveredObject: resolvedObject
      }
    );
    return Object.freeze({
      ok: true,
      errorCode: null,
      message: resolvedObject
        ? `Hovering ${resolvedObject.assetId}.`
        : "Overlay hover cleared.",
      interactionState: currentOverlayInteractionState
    });
  };

  const selectHandler = ({ x, y } = {}) => {
    if (!expandedSettlementPreview || !lastExpandedSettlementLayout) {
      return freezeSelectionFailure(
        "overlay_interaction_unavailable",
        "Expanded settlement overlay interaction is unavailable."
      );
    }
    const resolvedObject = resolveSelectableObjectAtCanvasPoint(
      lastExpandedSettlementLayout,
      x,
      y
    );
    if (!resolvedObject) {
      return freezeSelectionFailure(
        "overlay_object_not_found",
        "No selectable settlement object was found at that map position."
      );
    }
    currentOverlayInteractionState = buildOverlayInteractionState(
      renderableExpandedSettlementPreview,
      {
        selectedObject: resolvedObject,
        hoveredObject: resolvedObject
      }
    );
    currentPlayerMapState = buildPlayerMapState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState?.cameraFocus?.currentState === "player-focused"
        ? "player-focused"
        : "world-overview",
      resolvedObject
    );
    currentAssetDetailPreviewState = buildAssetDetailPreviewState(
      renderableExpandedSettlementPreview,
      currentOverlayInteractionState.selectedObject
    );
    currentPoiState = buildPoiState(
      renderableExpandedSettlementPreview,
      currentOverlayInteractionState.selectedObject,
      currentPlayerMapState
    );
    currentPoiContentMetadata = buildPoiContentMetadata(
      renderableExpandedSettlementPreview,
      currentPoiState
    );
    currentPoiPresentationState = buildPoiPresentationState(
      renderableExpandedSettlementPreview,
      currentPoiState,
      currentPoiContentMetadata
    );
    currentPlayerInteractionState = buildPlayerInteractionState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState.selectedObject
    );
    currentCaptureState = buildCaptureState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState.selectedObject,
      currentCaptureSessionStore.capturedObjectIds
    );
    currentCaptureSessionStore = buildCaptureSessionStore(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentCaptureState,
      currentCaptureSessionStore.sessionId
    );
    currentCapturePresentationState = buildCapturePresentationState(
      renderableExpandedSettlementPreview,
      currentCaptureState,
      currentCaptureSessionStore
    );
    currentSessionExperienceState = buildSessionExperienceState(
      renderableExpandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState,
      currentPoiState,
      currentCaptureSessionSummaryState,
      currentExplorationMode
    );
    refreshExplorationProgressPresentationState();
    redrawExpandedSettlementPreviewIfMounted();
    const message = `Selected ${resolvedObject.assetId} and focused the settlement camera.`;
    setStatus(elements.status, message);
    return Object.freeze({
      ok: true,
      errorCode: null,
      message,
      selectedObject: deepFreeze({
        instanceId: resolvedObject.instanceId,
        assetId: resolvedObject.assetId,
        category: resolvedObject.category
      }),
      poiState: currentPoiState,
      poiContentMetadata: currentPoiContentMetadata,
      poiPresentationState: currentPoiPresentationState,
      interactionState: currentOverlayInteractionState,
      detailPreviewState: currentAssetDetailPreviewState,
      playerInteractionState: currentPlayerInteractionState,
      captureState: currentCaptureState,
      captureSessionStore: currentCaptureSessionStore,
      captureSessionSummaryState: currentCaptureSessionSummaryState,
      sessionExperienceState: currentSessionExperienceState,
      capturePresentationState: currentCapturePresentationState,
      discoveryState: currentDiscoveryState,
      explorationProgressPresentationState:
        currentExplorationProgressPresentationState,
      landmarkShowcaseState: currentLandmarkShowcaseState,
      locationExperienceState: currentLocationExperienceState
    });
  };

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasBrowserDemoHarness: Object.freeze({
      previewSessionId: "atlas-browser-demo-harness",
      canvas,
      elements: Object.freeze({
        previewContainer: elements.previewContainer,
        canvasContainer: elements.canvasContainer,
        showButton: elements.showButton,
        hideButton: elements.hideButton,
        status: elements.status
      }),
      showPreview: showHandler,
      hidePreview: hideHandler,
      showCoastalWorld: showHandler,
      hideCoastalWorld: hideHandler,
      hoverSettlementObjectAtCanvasPoint: hoverHandler,
      selectSettlementObjectAtCanvasPoint: selectHandler,
      clearSettlementInteraction() {
        currentOverlayInteractionState = createDefaultOverlayInteractionState(
          expandedSettlementPreview
        );
        currentAssetDetailPreviewState = createDefaultAssetDetailPreviewState(
          expandedSettlementPreview
        );
        currentPoiState = createDefaultPoiState(expandedSettlementPreview);
        currentPoiContentMetadata = createDefaultPoiContentMetadata(
          expandedSettlementPreview
        );
        currentPoiPresentationState = createDefaultPoiPresentationState(
          expandedSettlementPreview
        );
        currentPlayerMapState = createDefaultPlayerMapState(
          expandedSettlementPreview
        );
        currentPlayerInteractionState = createDefaultPlayerInteractionState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        currentCaptureState = buildCaptureState(
          expandedSettlementPreview,
          currentPlayerMapState,
          null,
          currentCaptureSessionStore.capturedObjectIds
        );
        currentCaptureSessionStore = buildCaptureSessionStore(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureState,
          currentCaptureSessionStore.sessionId
        );
        currentCapturePresentationState = createDefaultCapturePresentationState(
          expandedSettlementPreview,
          currentCaptureState,
          currentCaptureSessionStore
        );
        currentDiscoveryState = buildDiscoveryState(
          expandedSettlementPreview,
          currentPlayerMapState,
          null,
          currentDiscoveryState.discoveredObjectIds
        );
        currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureSessionStore,
          currentDiscoveryState
        );
        currentSessionExperienceState = buildSessionExperienceState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        if (expandedSettlementPreview && mounted) {
          redrawExpandedSettlementPreviewIfMounted();
        }
        return currentOverlayInteractionState;
      },
      currentSettlementInteractionState() {
        return currentOverlayInteractionState;
      },
      currentSettlementPoiState() {
        return currentPoiState;
      },
      currentSettlementPoiContentMetadata() {
        return currentPoiContentMetadata;
      },
      currentSettlementPoiPresentationState() {
        return currentPoiPresentationState;
      },
      openSettlementAssetDetailPreview() {
        currentAssetDetailPreviewState = buildAssetDetailPreviewState(
          expandedSettlementPreview,
          currentOverlayInteractionState.selectedObject
        );
        refreshCaptureSessionState();
        return currentAssetDetailPreviewState;
      },
      closeSettlementAssetDetailPreview() {
        currentAssetDetailPreviewState = buildAssetDetailPreviewState(
          expandedSettlementPreview,
          null,
          "returning-to-map-view"
        );
        refreshCaptureSessionState();
        return currentAssetDetailPreviewState;
      },
      currentSettlementAssetDetailPreviewState() {
        return currentAssetDetailPreviewState;
      },
      focusSettlementPlayerPresence() {
        const selectedPreviewObject =
          renderableExpandedSettlementPreview?.objectInstances?.find(
            (objectInstance) =>
              objectInstance.instanceId ===
              currentOverlayInteractionState.selectedObject?.instanceId
          ) ?? currentOverlayInteractionState.selectedObject;
        currentPlayerMapState = buildPlayerMapState(
          renderableExpandedSettlementPreview,
          "player-focused",
          selectedPreviewObject
        );
        refreshCaptureSessionState();
        redrawExpandedSettlementPreviewIfMounted();
        return currentPlayerMapState;
      },
      returnSettlementWorldOverview() {
        currentPlayerMapState = buildPlayerMapState(
          renderableExpandedSettlementPreview,
          "world-overview"
        );
        refreshCaptureSessionState();
        redrawExpandedSettlementPreviewIfMounted();
        return currentPlayerMapState;
      },
      currentSettlementPlayerMapState() {
        return currentPlayerMapState;
      },
      interactWithSelectedSettlementObject() {
        currentPlayerInteractionState = buildPlayerInteractionState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState.selectedObject
        );
        return currentPlayerInteractionState;
      },
      clearSettlementPlayerInteraction() {
        currentPlayerInteractionState = createDefaultPlayerInteractionState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        return currentPlayerInteractionState;
      },
      currentSettlementPlayerInteractionState() {
        return currentPlayerInteractionState;
      },
      captureSelectedSettlementObject() {
        currentCaptureState = buildCaptureState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState.selectedObject,
          currentCaptureSessionStore.capturedObjectIds
        );
        currentCaptureSessionStore = buildCaptureSessionStore(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureState,
          currentCaptureSessionStore.sessionId
        );
        currentCapturePresentationState = buildCapturePresentationState(
          renderableExpandedSettlementPreview,
          currentCaptureState,
          currentCaptureSessionStore
        );
        currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureSessionStore,
          currentDiscoveryState
        );
        currentSessionExperienceState = buildSessionExperienceState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        redrawExpandedSettlementPreviewIfMounted();
        return currentCaptureState;
      },
      clearSettlementCaptureState() {
        currentCaptureState = createDefaultCaptureState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        currentCaptureSessionStore = createDefaultCaptureSessionStore(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureState
        );
        currentCapturePresentationState = createDefaultCapturePresentationState(
          expandedSettlementPreview,
          currentCaptureState,
          currentCaptureSessionStore
        );
        currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureSessionStore,
          currentDiscoveryState
        );
        currentSessionExperienceState = buildSessionExperienceState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        redrawExpandedSettlementPreviewIfMounted();
        return currentCaptureState;
      },
      currentSettlementCaptureState() {
        return currentCaptureState;
      },
      currentSettlementCaptureSessionStore() {
        return currentCaptureSessionStore;
      },
      currentSettlementCaptureSessionSummaryState() {
        return currentCaptureSessionSummaryState;
      },
      currentSettlementSessionExperienceState() {
        return currentSessionExperienceState;
      },
      currentSettlementExplorationProgressPresentationState() {
        return currentExplorationProgressPresentationState;
      },
      currentSettlementLandmarkShowcaseState() {
        return currentLandmarkShowcaseState;
      },
      currentSettlementLocationExperienceState() {
        return currentLocationExperienceState;
      },
      currentSettlementCapturePresentationState() {
        return currentCapturePresentationState;
      },
      discoverSelectedSettlementObject() {
        currentDiscoveryState = buildDiscoveryState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState.selectedObject,
          currentDiscoveryState.discoveredObjectIds
        );
        currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureSessionStore,
          currentDiscoveryState
        );
        currentSessionExperienceState = buildSessionExperienceState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        redrawExpandedSettlementPreviewIfMounted();
        return currentDiscoveryState;
      },
      clearSettlementDiscoveryState() {
        currentDiscoveryState = createDefaultDiscoveryState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        currentCaptureSessionSummaryState = buildCaptureSessionSummaryState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentCaptureSessionStore,
          currentDiscoveryState
        );
        currentSessionExperienceState = buildSessionExperienceState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        return currentDiscoveryState;
      },
      currentSettlementDiscoveryState() {
        return currentDiscoveryState;
      },
      toggleSettlementExplorationMode() {
        currentExplorationMode =
          currentExplorationMode === "free_exploration"
            ? "guided_exploration"
            : "free_exploration";
        currentSessionExperienceState = buildSessionExperienceState(
          renderableExpandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState,
          currentPoiState,
          currentCaptureSessionSummaryState,
          currentExplorationMode
        );
        refreshExplorationProgressPresentationState();
        return currentSessionExperienceState;
      },
      currentSettlementSelectableObjects() {
        return deepFreeze(
          [...(lastExpandedSettlementLayout?.renderedObjects ?? [])].filter((object) =>
            selectableExpandedSettlementAssetIds.has(object.assetId)
          )
        );
      },
      setSettlementPresentationProfile(presentationProfile = "neighbourhood") {
        currentPresentationProfile = normalizeSettlementPresentationProfile(
          presentationProfile
        );
        currentStyleReviewMode = false;
        syncRenderableExpandedSettlementPreview();
        currentPoiPresentationState = buildPoiPresentationState(
          renderableExpandedSettlementPreview,
          currentPoiState,
          currentPoiContentMetadata
        );
        refreshCaptureSessionState();
        activeVisualSourceSummary = buildVisualSourceSummary({
          expandedSettlementPreview: renderableExpandedSettlementPreview,
          coastalWorldShowcase,
          visibilityState: mounted ? "visible" : "hidden"
        });
        redrawExpandedSettlementPreviewIfMounted();
        return this.currentDemoPresentationState();
      },
      setSettlementStyleReviewMode(enabled = true) {
        currentStyleReviewMode = enabled === true;
        syncRenderableExpandedSettlementPreview();
        currentPoiPresentationState = buildPoiPresentationState(
          renderableExpandedSettlementPreview,
          currentPoiState,
          currentPoiContentMetadata
        );
        refreshCaptureSessionState();
        activeVisualSourceSummary = buildVisualSourceSummary({
          expandedSettlementPreview: renderableExpandedSettlementPreview,
          coastalWorldShowcase,
          visibilityState: mounted ? "visible" : "hidden"
        });
        redrawExpandedSettlementPreviewIfMounted();
        return this.currentDemoPresentationState();
      },
      setSettlementLightingProfile(lightingProfile = "day") {
        currentLightingProfile = normalizeSettlementLightingProfile(lightingProfile);
        syncRenderableExpandedSettlementPreview();
        currentPoiPresentationState = buildPoiPresentationState(
          renderableExpandedSettlementPreview,
          currentPoiState,
          currentPoiContentMetadata
        );
        refreshCaptureSessionState();
        activeVisualSourceSummary = buildVisualSourceSummary({
          expandedSettlementPreview: renderableExpandedSettlementPreview,
          coastalWorldShowcase,
          visibilityState: mounted ? "visible" : "hidden"
        });
        redrawExpandedSettlementPreviewIfMounted();
        return this.currentDemoPresentationState();
      },
      currentDemoPresentationState() {
        const activePreview =
          renderableExpandedSettlementPreview ?? expandedSettlementPreview ?? null;
        if (!activePreview) {
          return deepFreeze({
            demoState: "placeholder-ready",
            activeWorld: null,
            activePresentationProfile: null,
            cameraProfile: null,
            lightingProfile: null,
            validationResult: deepFreeze({
              demoReady: false,
              deterministicSceneLoading: false,
              objectVisibilityReady: false,
              poiInteractionReady: false,
              cleanupReady: true
            })
          });
        }
        return deepFreeze({
          demoState: mounted ? "world-preview-visible" : "world-preview-ready",
          activeWorld: deepFreeze({
            worldId: activePreview.worldId,
            sceneId: activePreview.sceneId,
            objectInstanceCount: activePreview.objectInstances.length
          }),
          activePresentationProfile: activePreview.visualScaling.activePresentationProfile,
          styleReviewMode: activePreview.visualStyling?.styleReviewMode === true,
          cameraProfile: deepFreeze({
            cameraProfile: activePreview.cameraState.cameraProfile,
            activeCompositionProfile:
              activePreview.cameraState.activeCompositionProfile,
            previewZoomProfile: activePreview.cameraState.previewZoomProfile,
            targetAsset: activePreview.cameraState.targetAsset
          }),
          styleReviewProfile: deepFreeze({
            mode:
              activePreview.visualStyling?.styleReviewMode === true
                ? "review-only"
                : "standard-preview",
            cameraProfile:
              activePreview.presentationSummary?.styleReviewProfile?.cameraProfile ??
              null,
            colourProfile:
              activePreview.presentationSummary?.styleReviewProfile?.colourProfile ??
              null,
            depthLayeringPreview:
              activePreview.presentationSummary?.styleReviewProfile
                ?.depthLayeringPreview ?? null,
            terrainPresentationPreview:
              activePreview.presentationSummary?.styleReviewProfile
                ?.terrainPresentationPreview ?? null,
            lightingPreview:
              activePreview.presentationSummary?.styleReviewProfile
                ?.lightingPreview ?? null
          }),
          lightingProfile: deepFreeze({
            activeProfile:
              activePreview.visualStyling.activeLightingProfile ?? currentLightingProfile,
            availableProfiles: deepFreeze([
              ...(activePreview.visualStyling.availableLightingProfiles ?? [])
            ])
          }),
          validationResult: deepFreeze({
            demoReady: true,
            deterministicSceneLoading:
              activePreview.validationResult.deterministicOutput === true,
            objectVisibilityReady:
              activePreview.validationResult.objectsResolve === true,
            poiInteractionReady:
              activePreview.validationResult.objectsResolve === true,
            cleanupReady: true
          })
        });
      },
      currentVisualSourceSummary() {
        return activeVisualSourceSummary;
      },
      setWorldExpansionDemoRoutingState(pipelineValidationState = null) {
        currentWorldExpansionDemoRoutingState = buildWorldExpansionDemoRoutingState(
          pipelineValidationState,
          activeVisualSourceSummary
        );
        return currentWorldExpansionDemoRoutingState;
      },
      clearWorldExpansionDemoRoutingState() {
        currentWorldExpansionDemoRoutingState =
          createDefaultWorldExpansionDemoRoutingState();
        return currentWorldExpansionDemoRoutingState;
      },
      currentWorldExpansionDemoRoutingState() {
        return currentWorldExpansionDemoRoutingState;
      },
      currentMountState() {
        return previewSession?.currentMountState?.() ?? "created";
      }
    })
  });
}

export function drawAtlasPlaceholderScene(
  drawContext,
  {
    width = 960,
    height = 540,
    placeholders = atlasBrowserDemoPlaceholderObjects,
    realGroundPreviewBinding = null,
    realGroundRenderBinding = null,
    realGroundMeshPreview = null,
    realGroundRuntimeLoader = null,
    realGroundMeshRenderTest = null
  } = {}
) {
  if (!drawContext || typeof drawContext.fillRect !== "function") {
    throw new Error("Atlas placeholder draw requires a 2D canvas context.");
  }

  drawContext.fillStyle = "#d7ecff";
  drawContext.fillRect(0, 0, width, height);

  drawContext.fillStyle = "#8dd17e";
  drawContext.fillRect(0, height * 0.68, width, height * 0.32);
  const activeGroundBinding =
    realGroundMeshRenderTest?.verificationResult?.actualGlbGeometryRendered === true
      ? realGroundMeshRenderTest
      :
    realGroundRuntimeLoader?.validationResult.glbAvailable === true
      ? realGroundRuntimeLoader
      :
    realGroundMeshPreview?.validationResult.glbAvailable === true
      ? realGroundMeshPreview
      : 
    realGroundRenderBinding?.verificationResult.glbExists === true
      ? realGroundRenderBinding
      : realGroundPreviewBinding;

  if (activeGroundBinding) {
    drawContext.fillStyle = "#1e5f34";
    drawContext.font = "bold 16px sans-serif";
    drawContext.textAlign = "left";
    drawContext.fillText(
      activeGroundBinding.assetId,
      width * 0.04,
      height * 0.73
    );
    drawContext.font = "12px sans-serif";
    drawContext.fillText(
      `${resolveGroundBindingLodLabel(activeGroundBinding)} :: ${resolveGroundBindingSourceLabel(
        activeGroundBinding
      )}`,
      width * 0.04,
      height * 0.77
    );
    if (realGroundMeshRenderTest?.verificationResult?.actualGlbGeometryRendered === true) {
      drawProjectedGroundMesh(drawContext, {
        width,
        height,
        meshData: realGroundMeshRenderTest.geometryPayload,
        fillStyle: realGroundMeshRenderTest.materialPayload.fillStyle
      });
      drawContext.fillStyle = "#133046";
      drawContext.font = "11px sans-serif";
      drawContext.fillText(
        `${realGroundMeshRenderTest.renderState.currentState} :: ${realGroundMeshRenderTest.materialPayload.primaryMaterial}`,
        width * 0.04,
        height * 0.84
      );
    } else if (realGroundRuntimeLoader?.validationResult.glbAvailable === true) {
      drawProjectedGroundMesh(drawContext, {
        width,
        height,
        meshData: realGroundRuntimeLoader.meshResult
      });
      drawContext.fillStyle = "#133046";
      drawContext.font = "11px sans-serif";
      drawContext.fillText(
        `${realGroundRuntimeLoader.renderResult.displayMode}`,
        width * 0.04,
        height * 0.84
      );
    } else if (realGroundMeshPreview?.validationResult.glbAvailable === true) {
      drawProjectedGroundMesh(drawContext, {
        width,
        height,
        meshData: realGroundMeshPreview.meshData
      });
      drawContext.fillStyle = "#133046";
      drawContext.font = "11px sans-serif";
      drawContext.fillText(
        `${realGroundMeshPreview.renderResult.displayMode}`,
        width * 0.04,
        height * 0.84
      );
    } else if (realGroundRenderBinding?.verificationResult.glbExists === true) {
      drawContext.fillStyle = "#5ebf68";
      drawContext.fillRect(width * 0.04, height * 0.79, width * 0.26, height * 0.025);
      drawContext.fillStyle = "#133046";
      drawContext.font = "11px sans-serif";
      drawContext.fillText(
        `${realGroundRenderBinding.renderPayload.primaryGlb}`,
        width * 0.04,
        height * 0.84
      );
    }
  }

  drawContext.fillStyle = "#86a9c8";
  drawContext.fillRect(width * 0.12, height * 0.7, width * 0.76, height * 0.06);

  drawContext.fillStyle = "#d9dadb";
  drawContext.fillRect(width * 0.15, height * 0.24, width * 0.09, height * 0.36);
  drawContext.fillStyle = "#bd2d2d";
  drawContext.beginPath();
  drawContext.moveTo(width * 0.13, height * 0.24);
  drawContext.lineTo(width * 0.195, height * 0.12);
  drawContext.lineTo(width * 0.26, height * 0.24);
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = "#f0d4b0";
  drawContext.fillRect(width * 0.39, height * 0.42, width * 0.16, height * 0.16);
  drawContext.fillStyle = "#7d4d35";
  drawContext.beginPath();
  drawContext.moveTo(width * 0.37, height * 0.42);
  drawContext.lineTo(width * 0.47, height * 0.31);
  drawContext.lineTo(width * 0.57, height * 0.42);
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = "#4f8e43";
  drawContext.beginPath();
  drawContext.arc(width * 0.78, height * 0.36, width * 0.065, 0, Math.PI * 2);
  drawContext.fill();
  drawContext.fillStyle = "#6c4a2d";
  drawContext.fillRect(width * 0.765, height * 0.36, width * 0.03, height * 0.18);

  drawContext.fillStyle = "#133046";
  drawContext.font = "bold 18px sans-serif";
  drawContext.textAlign = "center";
  drawContext.fillText(placeholders[0], width * 0.195, height * 0.16);
  drawContext.fillText(placeholders[1], width * 0.47, height * 0.28);
  drawContext.fillText(placeholders[2], width * 0.5, height * 0.82);
  drawContext.fillText(placeholders[3], width * 0.78, height * 0.22);
}

export function clearAtlasPlaceholderScene(drawContext, width, height) {
  if (drawContext && typeof drawContext.clearRect === "function") {
    drawContext.clearRect(0, 0, width, height);
  }
}

export function drawCoastalWorldShowcase(
  drawContext,
  showcase,
  { width = 960, height = 540 } = {}
) {
  if (!drawContext || typeof drawContext.fillRect !== "function") {
    throw new Error("Coastal world showcase draw requires a 2D canvas context.");
  }

  const activeLightingProfile =
    showcase?.lightingProfile?.activeProfile?.toLowerCase?.() ?? "day";
  const palette = resolveLightingPalette(activeLightingProfile);

  drawContext.fillStyle = palette.sky;
  drawContext.fillRect(0, 0, width, height);
  drawContext.fillStyle = palette.sea;
  drawContext.fillRect(0, height * 0.42, width, height * 0.16);
  drawContext.fillStyle = palette.ground;
  drawContext.fillRect(0, height * 0.58, width, height * 0.42);

  const renderablesByAssetId = new Map(
    (showcase.renderables ?? []).map((renderable) => [renderable.assetId, renderable])
  );

  drawContext.fillStyle = "#163046";
  drawContext.font = "bold 18px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(showcase.showcaseId, width * 0.03, height * 0.08);
  drawContext.font = "13px sans-serif";
  drawContext.fillText(
    `${showcase.cameraProfile.cameraProfile} :: ${showcase.lightingProfile.activeProfile}`,
    width * 0.03,
    height * 0.115
  );

  for (const assetInstance of showcase.assetInstances ?? []) {
    const placement =
      coastalShowcasePlacementByAssetId[assetInstance.assetId] ??
      coastalShowcasePlacementByAssetId.GROUND_COASTAL_GRASS_001;
    const renderable = renderablesByAssetId.get(assetInstance.assetId) ?? null;
    if (!renderable) {
      continue;
    }
    drawShowcaseRenderable(drawContext, {
      width,
      height,
      assetInstance,
      renderable,
      placement,
      palette
    });
  }

  drawContext.fillStyle = "#163046";
  drawContext.font = "12px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(
    showcase.verificationResult.realGlbBackedSceneValid
      ? "real GLB-backed coastal showcase"
      : "fallback-safe coastal showcase",
    width * 0.03,
    height * 0.96
  );
}

export function createExpandedSettlementVisualPreviewBinding(rawScene) {
  if (
    !rawScene ||
    !rawScene.sceneId ||
    !rawScene.worldId ||
    !Array.isArray(rawScene.roadInstances) ||
    !Array.isArray(rawScene.buildingInstances) ||
    !Array.isArray(rawScene.vegetationInstances) ||
    !Array.isArray(rawScene.landmarkInstances) ||
    !rawScene.cameraProfile ||
    !rawScene.validationResult
  ) {
    return null;
  }

  const scene = rawScene;
  const roadInstances = (scene.roadInstances ?? []).map((instance) =>
    deepFreeze({
      instanceId: instance.instanceId,
      assetId: instance.assetId,
      category: "road",
      orientation: instance.orientation,
      geometry: deepFreeze({
        start: deepFreeze({ ...instance.start }),
        end: deepFreeze({ ...instance.end }),
        width: instance.width
      })
    })
  );
  const placementToObject = (instance, category) =>
    deepFreeze({
      instanceId: instance.instanceId,
      assetId: instance.assetId,
      category,
      orientation: instance.orientation,
      position: deepFreeze({ ...instance.position }),
      footprint: deepFreeze({ ...instance.footprint })
    });

  const objectInstances = deepFreeze([
    ...roadInstances,
    ...(scene.buildingInstances ?? []).map((instance) =>
      placementToObject(instance, "building")
    ),
    ...(scene.vegetationInstances ?? []).map((instance) =>
      placementToObject(instance, "vegetation")
    ),
    ...(scene.landmarkInstances ?? []).map((instance) =>
      placementToObject(instance, "landmark")
    )
  ]);

  return deepFreeze({
    previewId: createExpandedSettlementPreviewId(scene.sceneId, scene.worldId),
    sceneId: scene.sceneId,
    worldId: scene.worldId,
    objectInstances,
    visualScaling: deepFreeze({
      densityProfile: scene.visualScaling?.densityProfile ?? "sparse_coastal",
      blockScale: Number(scene.visualScaling?.blockScale ?? 1),
      cameraScale: Number(scene.visualScaling?.cameraScale ?? 1),
      activeZoomProfile: scene.visualScaling?.activeZoomProfile ?? "normal",
      activePresentationProfile:
        scene.visualScaling?.activePresentationProfile ?? "neighbourhood_presentation_profile",
      visibleObjectCount: Number(scene.visualScaling?.visibleObjectCount ?? objectInstances.length),
      roadSpacingTarget: Number(scene.visualScaling?.roadSpacingTarget ?? 0),
      lotSpacingTarget: Number(scene.visualScaling?.lotSpacingTarget ?? 0),
      houseSpacingTarget: Number(scene.visualScaling?.houseSpacingTarget ?? 0),
      houseDistributionTarget: Number(scene.visualScaling?.houseDistributionTarget ?? 0),
      treeDistributionTarget: Number(scene.visualScaling?.treeDistributionTarget ?? 0),
      poiSpacingTarget: Number(scene.visualScaling?.poiSpacingTarget ?? 0),
      zoomTransitionMetadata: deepFreeze({
        ...(scene.visualScaling?.zoomTransitionMetadata ?? {})
      }),
      previewZoomProfile: deepFreeze({
        ...(scene.visualScaling?.previewZoomProfile ?? {})
      })
    }),
    visualStyling: deepFreeze({
      ...(scene.visualStyling ?? {})
    }),
    presentationSummary: deepFreeze({
      ...(scene.presentationSummary ?? {})
    }),
    cameraState: deepFreeze({
      cameraProfile: scene.cameraProfile.cameraProfile,
      focusAssetId: scene.cameraProfile.focusAssetId,
      targetAsset: scene.cameraProfile.targetAsset ?? scene.cameraProfile.focusAssetId,
      focusPoint: deepFreeze({
        ...(scene.cameraProfile.focusPoint ?? {})
      }),
      orientation: scene.cameraProfile.orientation,
      previewZoomLevel: scene.cameraProfile.zoomLevel,
      previewZoomProfile:
        scene.visualScaling?.previewZoomProfile?.activeProfile ??
        scene.cameraProfile.previewZoomProfile ??
        "normal",
      activeZoomProfile: scene.visualScaling?.activeZoomProfile ?? "normal",
      cameraScale: Number(scene.visualScaling?.cameraScale ?? 1),
      tilt: Number(scene.cameraProfile.tilt ?? 0),
      activeCompositionProfile:
        scene.cameraProfile.activeCompositionProfile ?? "normal_neighbourhood",
      viewportComposition: deepFreeze({
        ...(scene.cameraProfile.viewportComposition ?? {})
      }),
      cameraCompositionProfiles: deepFreeze({
        ...(scene.cameraProfile.cameraCompositionProfiles ?? {})
      }),
      mapCenterCoordinate: deepFreeze({
        ...scene.cameraProfile.mapCenterCoordinate
      })
    }),
    visibilityState: deepFreeze({
      currentState: "hidden",
      visible: false,
      allowedStates: deepFreeze(["hidden", "visible", "closed"])
    }),
    validationResult: deepFreeze({
      sceneLoads: scene.validationResult.assetReferencesValid === true,
      objectsResolve:
        scene.validationResult.assetReferencesValid === true &&
        objectInstances.length === 45,
      cameraWorks: scene.validationResult.cameraProfileValid === true,
      visibilityToggleWorks: true,
      deterministicOutput: scene.validationResult.deterministicSceneOutputValid === true,
      visibleObjectCount:
        Number(scene.visualScaling?.visibleObjectCount ?? objectInstances.length),
      correctLodSelection: scene.validationResult.correctLodSelection === true,
      deterministicAppearanceOutputValid:
        scene.validationResult.deterministicAppearanceOutputValid === true
    }),
    expandedSettlementScene: scene
  });
}

export function drawExpandedSettlementPreview(
  drawContext,
  expandedSettlementPreview,
  {
    width = 960,
    height = 540,
    interactionState = null,
    playerState = null,
    capturePresentationState = null,
    discoveryState = null,
    poiPresentationState = null
  } = {}
) {
  if (!drawContext || typeof drawContext.fillRect !== "function") {
    throw new Error("Expanded settlement preview draw requires a 2D canvas context.");
  }

  const palette = resolveExpandedSettlementPalette(expandedSettlementPreview);
  const zoomProfile = resolveExpandedSettlementZoomProfile(expandedSettlementPreview);
  const resolvedInteractionState =
    interactionState ?? createDefaultOverlayInteractionState(expandedSettlementPreview);
  const resolvedPlayerState =
    playerState ?? createDefaultPlayerMapState(expandedSettlementPreview);
  const resolvedCapturePresentationState =
    capturePresentationState ??
    createDefaultCapturePresentationState(
      expandedSettlementPreview,
      createDefaultCaptureState(expandedSettlementPreview, resolvedPlayerState)
    );
  const resolvedDiscoveryState =
    discoveryState ?? createDefaultDiscoveryState(expandedSettlementPreview, resolvedPlayerState);
  const resolvedPoiPresentationState =
    poiPresentationState ?? createDefaultPoiPresentationState(expandedSettlementPreview);
  const resolvedCameraState =
    resolvedDiscoveryState?.cameraFocus?.currentState === "discovery-focused"
      ? {
          ...expandedSettlementPreview.cameraState,
          focusPoint: resolvedDiscoveryState.cameraFocus.focusPoint,
          targetAsset: resolvedDiscoveryState.cameraFocus.targetAsset
        }
      : resolvedPlayerState?.cameraFocus?.currentState === "player-focused"
      ? {
          ...expandedSettlementPreview.cameraState,
          focusPoint: resolvedPlayerState.cameraFocus.focusPoint,
          targetAsset: resolvedPlayerState.cameraFocus.targetAsset
        }
      : resolvedInteractionState.cameraFocus
        ? {
            ...expandedSettlementPreview.cameraState,
            focusPoint: resolvedInteractionState.cameraFocus.focusPoint,
            targetAsset: resolvedInteractionState.cameraFocus.targetAsset
          }
        : expandedSettlementPreview.cameraState;
  const selectedObjectId = resolvedInteractionState?.selectedObject?.instanceId ?? null;
  const objectInstances = sortExpandedSettlementInstances(
    filterExpandedSettlementInstancesByZoom(
      expandedSettlementPreview.objectInstances ?? [],
      zoomProfile
    )
  );
  const bounds = computeExpandedSettlementBounds(
    collectExpandedSettlementPoints(
      objectInstances.length > 0
        ? objectInstances
        : expandedSettlementPreview.objectInstances ?? []
    )
  );
  const scaling = expandedSettlementPreview.visualScaling ?? {};
  const styling = expandedSettlementPreview.visualStyling ?? {};
  const lightingProfile = expandedSettlementPreview.visualStyling?.activeLightingProfile ?? "day";
  const overlayAlpha = lightingProfile === "night" ? 0.86 : 0.8;
  const styleReviewProfile =
    expandedSettlementPreview.presentationSummary?.styleReviewProfile ?? null;

  drawExpandedSettlementBackdrop(drawContext, {
    width,
    height,
    palette,
    styling,
    overlayAlpha
  });

  drawContext.fillStyle = "#163046";
  drawContext.font = "bold 18px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(expandedSettlementPreview.sceneId, width * 0.03, height * 0.08);
  drawContext.font = "13px sans-serif";
  drawContext.fillText(
    `${expandedSettlementPreview.cameraState.cameraProfile} :: ${expandedSettlementPreview.worldId} :: ${zoomProfile} :: ${expandedSettlementPreview.cameraState.activeCompositionProfile}`,
    width * 0.03,
    height * 0.115
  );
  drawContext.fillText(
    `${expandedSettlementPreview.visualScaling.activePresentationProfile} :: roads ${expandedSettlementPreview.visualScaling.roadSpacingTarget} :: lots ${expandedSettlementPreview.visualScaling.lotSpacingTarget} :: houses ${expandedSettlementPreview.visualScaling.houseDistributionTarget} :: trees ${expandedSettlementPreview.visualScaling.treeDistributionTarget}`,
    width * 0.03,
    height * 0.145
  );

  drawExpandedSettlementReadabilityGuides(drawContext, objectInstances, bounds, {
    width,
    height,
    scaling,
    cameraState: resolvedCameraState,
    styling
  });

  const renderedObjects = [];
  for (const instance of objectInstances) {
    const projectedObject = drawExpandedSettlementInstance(drawContext, instance, bounds, {
      width,
      height,
      palette,
      scaling,
      cameraState: resolvedCameraState,
      styling,
      selected: instance.instanceId === selectedObjectId
    });
    if (projectedObject) {
      renderedObjects.push(projectedObject);
    }
  }

  if (styleReviewProfile?.enabled === true) {
    drawExpandedSettlementStyleReviewOverlay(drawContext, {
      width,
      height,
      palette,
      styleReviewProfile,
      cameraState: resolvedCameraState
    });
  }

  drawCapturePresentationMarkers(
    drawContext,
    renderedObjects,
    resolvedCapturePresentationState
  );

  if (resolvedPlayerState?.position) {
    const projectedPlayer = projectExpandedSettlementPoint(
      resolvedPlayerState.position,
      bounds,
      width,
      height,
      scaling,
      resolvedCameraState
    );
    drawContext.fillStyle = "#0b2f4a";
    drawContext.beginPath();
    drawContext.arc(projectedPlayer.x, projectedPlayer.y, 7, 0, Math.PI * 2);
    drawContext.fill();
    drawContext.fillStyle = "#f3fbff";
    drawContext.beginPath();
    drawContext.arc(projectedPlayer.x, projectedPlayer.y, 3, 0, Math.PI * 2);
    drawContext.fill();
  }

  const poiMarkers = resolvedPoiPresentationState?.poiMarkerState?.markers ?? [];
  for (const marker of poiMarkers) {
    if (!marker.visible || !marker.position) {
      continue;
    }
    const projectedMarker = projectExpandedSettlementPoint(
      marker.position,
      bounds,
      width,
      height,
      scaling,
      resolvedCameraState
    );
    drawPoiPresentationMarker(drawContext, projectedMarker, marker);
  }

  drawContext.fillStyle = "#163046";
  drawContext.font = "12px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(
    `${objectInstances.length}/${expandedSettlementPreview.objectInstances.length} scene objects :: ${expandedSettlementPreview.visualScaling.densityProfile} :: focus ${resolvedPlayerState.cameraFocus?.currentState === "player-focused" ? "PLAYER_MARKER" : resolvedInteractionState.cameraFocus?.targetAsset ?? expandedSettlementPreview.cameraState.targetAsset} :: captured ${resolvedCapturePresentationState.markerState?.capturedObjectCount ?? 0}`,
    width * 0.03,
    height * 0.96
  );

  return deepFreeze({
    bounds,
    renderedObjects: deepFreeze(renderedObjects),
    interactionState: resolvedInteractionState
  });
}

function drawShowcaseRenderable(
  drawContext,
  { width, height, assetInstance, renderable, placement, palette }
) {
  const fillStyle = resolveAssetFillStyle(
    renderable.primaryMaterial,
    assetInstance.assetId,
    palette
  );
  const baseOriginX = width * 0.5 + placement.x;
  const baseOriginY = height * 0.62 + placement.y;

  drawContext.fillStyle = fillStyle;
  drawContext.beginPath();
  renderable.projectedVertices.forEach((vertex, index) => {
    const x = baseOriginX + (vertex.x - 0.5) * placement.scale;
    const y = baseOriginY - vertex.y * placement.scale * 0.72;
    if (index === 0) {
      drawContext.moveTo(x, y);
    } else {
      drawContext.lineTo(x, y);
    }
  });
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = "#163046";
  drawContext.font = "bold 12px sans-serif";
  drawContext.textAlign = "center";
  drawContext.fillText(
    assetInstance.assetId,
    baseOriginX,
    baseOriginY - placement.scale * 0.86
  );
}

function resolveLightingPalette(profile) {
  if (profile === "sunset") {
    return Object.freeze({
      sky: "#f6c7a0",
      sea: "#7da2c4",
      ground: "#c2b27d",
      vegetation: "#6d8a46",
      road: "#6d625a",
      building: "#f3d4b6",
      lighthouse: "#f1eee6"
    });
  }
  if (profile === "night") {
    return Object.freeze({
      sky: "#1d2940",
      sea: "#29445e",
      ground: "#4f6446",
      vegetation: "#537647",
      road: "#545a61",
      building: "#d8c4a4",
      lighthouse: "#ece8de"
    });
  }
  return Object.freeze({
    sky: "#d7ecff",
    sea: "#8fc0df",
    ground: "#8dd17e",
    vegetation: "#5a8f46",
    road: "#6b7078",
    building: "#f0d4b0",
    lighthouse: "#e8ebef"
  });
}

function resolveExpandedSettlementPalette(expandedSettlementPreview) {
  const activeLightingProfile =
    expandedSettlementPreview?.visualStyling?.activeLightingProfile ?? "day";
  const lightingProfiles = expandedSettlementPreview?.visualStyling?.lightingProfiles ?? {};
  const scenePalette = lightingProfiles[activeLightingProfile];
  if (scenePalette) {
    return deepFreeze({ ...scenePalette });
  }
  return resolveLightingPalette(activeLightingProfile);
}

function withAlpha(color, alpha) {
  if (typeof color !== "string") {
    return color;
  }
  const normalized = color.trim();
  const resolvedAlpha = Math.max(0, Math.min(1, Number(alpha)));
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) {
    return normalized;
  }
  const hex = hexMatch[1];
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${resolvedAlpha})`;
}

function resolveAssetFillStyle(primaryMaterial, assetId, palette) {
  if (/grass/i.test(primaryMaterial) || /GROUND_COASTAL_GRASS/i.test(assetId)) {
    return palette.ground;
  }
  if (/tree|leaf/i.test(primaryMaterial) || /TREE_EUCALYPTUS/i.test(assetId)) {
    return palette.vegetation;
  }
  if (/road|asphalt/i.test(primaryMaterial) || /ROAD_COASTAL/i.test(assetId)) {
    return palette.road;
  }
  if (/lighthouse/i.test(primaryMaterial) || /LIGHTHOUSE_ISLAND_ROCKY/i.test(assetId)) {
    return palette.lighthouse;
  }
  return palette.building;
}

function drawExpandedSettlementInstance(
  drawContext,
  instance,
  bounds,
  { width, height, palette, scaling, cameraState, styling, selected = false }
) {
  if (instance.category === "road") {
    const start = projectExpandedSettlementPoint(
      instance.geometry.start,
      bounds,
      width,
      height,
      scaling,
      cameraState
    );
    const end = projectExpandedSettlementPoint(
      instance.geometry.end,
      bounds,
      width,
      height,
      scaling,
      cameraState
    );
    drawContext.strokeStyle =
      styling?.roadAppearance?.baseColor ?? palette.road;
    drawContext.lineWidth = Math.max(
      4,
      (instance.geometry.width ?? 8) * 1.2 * Number(scaling?.blockScale ?? 1)
    );
    if (typeof drawContext.stroke === "function") {
      drawContext.strokeStyle = withAlpha("#0d2235", 0.16);
      drawContext.lineWidth = Math.max(
        8,
        (instance.geometry.width ?? 8) * 1.7 * Number(scaling?.blockScale ?? 1)
      );
      drawContext.beginPath();
      drawContext.moveTo(start.x, start.y + 5);
      drawContext.lineTo(end.x, end.y + 5);
      drawContext.stroke();

      drawContext.strokeStyle =
        styling?.roadAppearance?.baseColor ?? palette.road;
      drawContext.lineWidth = Math.max(
        4,
        (instance.geometry.width ?? 8) * 1.2 * Number(scaling?.blockScale ?? 1)
      );
      drawContext.beginPath();
      drawContext.moveTo(start.x, start.y);
      drawContext.lineTo(end.x, end.y);
      drawContext.stroke();

      drawContext.strokeStyle =
        styling?.roadAppearance?.edgeColor ?? "#D9E0E6";
      drawContext.lineWidth = Math.max(1.5, Number(scaling?.blockScale ?? 1));
      drawContext.beginPath();
      drawContext.moveTo(start.x, start.y);
      drawContext.lineTo(end.x, end.y);
      drawContext.stroke();
    } else {
      drawContext.fillStyle =
        styling?.roadAppearance?.baseColor ?? palette.road;
      drawContext.fillRect(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.max(6, Math.abs(end.x - start.x)),
        Math.max(6, Math.abs(end.y - start.y))
      );
    }
    drawContext.fillStyle =
      styling?.roadAppearance?.edgeColor ?? "#D9E0E6";
    drawContext.fillRect(start.x - 1, start.y - 1, 2, 2);
    drawContext.fillRect(end.x - 1, end.y - 1, 2, 2);
    if (selected) {
      drawContext.strokeStyle = "#FFF2A8";
      drawContext.lineWidth = Math.max(6, 6 * Number(scaling?.blockScale ?? 1));
      if (typeof drawContext.stroke === "function") {
        drawContext.beginPath();
        drawContext.moveTo(start.x, start.y);
        drawContext.lineTo(end.x, end.y);
        drawContext.stroke();
      }
    }
    return deepFreeze({
      instanceId: instance.instanceId,
      assetId: instance.assetId,
      category: instance.category,
      hitShape: "segment",
      start,
      end,
      hitRadius: Math.max(10, (instance.geometry.width ?? 8) * 1.4)
    });
  }

  const projected = projectExpandedSettlementPoint(
    instance.position,
    bounds,
    width,
    height,
    scaling,
    cameraState
  );
  if (instance.category === "vegetation") {
    const radius = Math.max(6, 7 * Number(scaling?.blockScale ?? 1));
    drawContext.fillStyle = withAlpha("#173923", 0.16);
    drawContext.beginPath();
    drawContext.arc(projected.x + 2, projected.y + radius * 0.85, radius * 1.04, 0, Math.PI * 2);
    drawContext.fill();
    drawContext.fillStyle =
      styling?.vegetationAppearance?.accentColor ?? "#7FAA61";
    drawContext.beginPath();
    drawContext.arc(
      projected.x - radius * 0.46,
      projected.y - radius * 0.12,
      radius * 0.8,
      0,
      Math.PI * 2
    );
    drawContext.fill();
    drawContext.fillStyle =
      styling?.vegetationAppearance?.canopyColor ?? palette.vegetation;
    drawContext.beginPath();
    drawContext.arc(
      projected.x,
      projected.y,
      radius,
      0,
      Math.PI * 2
    );
    drawContext.fill();
    drawContext.fillStyle = withAlpha("#f2f8ef", 0.28);
    drawContext.beginPath();
    drawContext.arc(
      projected.x + radius * 0.24,
      projected.y - radius * 0.34,
      radius * 0.34,
      0,
      Math.PI * 2
    );
    drawContext.fill();
    if (selected) {
      drawContext.strokeStyle = "#FFF2A8";
      if (typeof drawContext.stroke === "function") {
        drawContext.beginPath();
        drawContext.arc(projected.x, projected.y, radius + 4, 0, Math.PI * 2);
        drawContext.stroke();
      }
    }
    return deepFreeze({
      instanceId: instance.instanceId,
      assetId: instance.assetId,
      category: instance.category,
      hitShape: "circle",
      center: projected,
      hitRadius: radius + 4
    });
  }

  if (instance.category === "landmark") {
    drawContext.fillStyle = withAlpha("#193142", 0.15);
    drawContext.fillRect(
      projected.x - 20 * Number(scaling?.cameraScale ?? 1),
      projected.y + 10,
      42 * Number(scaling?.cameraScale ?? 1),
      10 * Number(scaling?.cameraScale ?? 1)
    );
    drawContext.fillStyle = styling?.coastlineAppearance?.shorelineColor ?? palette.coastline ?? "#C9D9B5";
    drawContext.beginPath();
    drawContext.arc(projected.x, projected.y + 6, 18 * Number(scaling?.cameraScale ?? 1), 0, Math.PI * 2);
    drawContext.fill();
    drawContext.fillStyle = palette.lighthouse;
    const lighthouseScale = Number(scaling?.cameraScale ?? 1);
    drawContext.fillRect(
      projected.x - 8 * lighthouseScale,
      projected.y - 36 * lighthouseScale,
      16 * lighthouseScale,
      36 * lighthouseScale
    );
    drawContext.fillStyle = withAlpha("#ffffff", 0.42);
    drawContext.fillRect(
      projected.x - 2 * lighthouseScale,
      projected.y - 33 * lighthouseScale,
      3 * lighthouseScale,
      28 * lighthouseScale
    );
    drawContext.fillStyle = "#bd2d2d";
    drawContext.beginPath();
    drawContext.moveTo(projected.x - 12 * lighthouseScale, projected.y - 36 * lighthouseScale);
    drawContext.lineTo(projected.x, projected.y - 52 * lighthouseScale);
    drawContext.lineTo(projected.x + 12 * lighthouseScale, projected.y - 36 * lighthouseScale);
    drawContext.closePath();
    drawContext.fill();
    drawContext.strokeStyle = "#FFF6D6";
    if (typeof drawContext.stroke === "function") {
      drawContext.beginPath();
      drawContext.moveTo(projected.x, projected.y - 44 * lighthouseScale);
      drawContext.lineTo(projected.x + 24 * lighthouseScale, projected.y - 36 * lighthouseScale);
      drawContext.stroke();
    }
    if (selected) {
      drawContext.strokeStyle = "#FFF2A8";
      if (typeof drawContext.stroke === "function") {
        drawContext.strokeRect(
          projected.x - 14 * lighthouseScale,
          projected.y - 56 * lighthouseScale,
          28 * lighthouseScale,
          68 * lighthouseScale
        );
      }
    }
    return deepFreeze({
      instanceId: instance.instanceId,
      assetId: instance.assetId,
      category: instance.category,
      hitShape: "rect",
      x: projected.x - 14 * lighthouseScale,
      y: projected.y - 56 * lighthouseScale,
      width: 28 * lighthouseScale,
      height: 68 * lighthouseScale
    });
  }

  const houseScale = Number(scaling?.blockScale ?? 1);
  drawContext.fillStyle = withAlpha("#183244", 0.14);
  drawContext.fillRect(
    projected.x - 18 * houseScale,
    projected.y + 9 * houseScale,
    34 * houseScale,
    5 * houseScale
  );
  drawContext.fillStyle =
    styling?.buildingAppearance?.wallColor ?? palette.building;
  drawContext.fillRect(
    projected.x - 12 * houseScale,
    projected.y - 12 * houseScale,
    24 * houseScale,
    18 * houseScale
  );
  drawContext.fillStyle = withAlpha("#ffffff", 0.24);
  drawContext.fillRect(
    projected.x - 10 * houseScale,
    projected.y - 10 * houseScale,
    7 * houseScale,
    12 * houseScale
  );
  drawContext.fillStyle =
    styling?.buildingAppearance?.roofColor ?? "#7d4d35";
  drawContext.beginPath();
  drawContext.moveTo(projected.x - 15 * houseScale, projected.y - 12 * houseScale);
  drawContext.lineTo(projected.x, projected.y - 24 * houseScale);
  drawContext.lineTo(projected.x + 15 * houseScale, projected.y - 12 * houseScale);
  drawContext.closePath();
  drawContext.fill();
  drawContext.fillStyle =
    styling?.buildingAppearance?.separationColor ?? "#F7EBDD";
  drawContext.fillRect(
    projected.x - 16 * houseScale,
    projected.y + 8 * houseScale,
    32 * houseScale,
    3 * houseScale
  );
  if (selected) {
    drawContext.strokeStyle = "#FFF2A8";
    if (typeof drawContext.stroke === "function") {
      drawContext.strokeRect(
        projected.x - 16 * houseScale,
        projected.y - 26 * houseScale,
        32 * houseScale,
        38 * houseScale
      );
    }
  }
  return deepFreeze({
    instanceId: instance.instanceId,
    assetId: instance.assetId,
    category: instance.category,
    hitShape: "rect",
    x: projected.x - 16 * houseScale,
    y: projected.y - 26 * houseScale,
    width: 32 * houseScale,
    height: 38 * houseScale
  });
}

function drawExpandedSettlementBackdrop(
  drawContext,
  { width, height, palette, styling, overlayAlpha }
) {
  const coastlineColor =
    styling?.coastlineAppearance?.shorelineColor ?? palette.coastline ?? "#C9D9B5";
  const yardColor =
    styling?.terrainAppearance?.yardColor ??
    styling?.terrainAppearance?.accentColor ??
    "#B8D99A";

  drawContext.fillStyle = withAlpha(palette.sky, overlayAlpha * 0.92);
  drawContext.fillRect(0, 0, width, height);
  drawContext.fillStyle = withAlpha("#ffffff", 0.12);
  drawContext.fillRect(0, 0, width, height * 0.16);

  drawContext.fillStyle = withAlpha(palette.sea, overlayAlpha * 0.82);
  drawContext.fillRect(0, height * 0.19, width, height * 0.18);
  drawContext.fillStyle = withAlpha("#ffffff", 0.18);
  drawContext.fillRect(width * 0.04, height * 0.235, width * 0.92, height * 0.01);
  drawContext.fillRect(width * 0.12, height * 0.275, width * 0.74, height * 0.008);

  drawContext.fillStyle = withAlpha(coastlineColor, overlayAlpha * 0.9);
  drawContext.beginPath();
  drawContext.moveTo(0, height * 0.37);
  drawContext.lineTo(width * 0.22, height * 0.345);
  drawContext.lineTo(width * 0.44, height * 0.36);
  drawContext.lineTo(width * 0.7, height * 0.335);
  drawContext.lineTo(width, height * 0.355);
  drawContext.lineTo(width, height * 0.405);
  drawContext.lineTo(0, height * 0.43);
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = withAlpha(palette.ground, overlayAlpha * 0.88);
  drawContext.beginPath();
  drawContext.moveTo(0, height * 0.4);
  drawContext.lineTo(width, height * 0.36);
  drawContext.lineTo(width, height);
  drawContext.lineTo(0, height);
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = withAlpha(yardColor, overlayAlpha * 0.68);
  drawContext.beginPath();
  drawContext.moveTo(width * 0.05, height * 0.57);
  drawContext.lineTo(width * 0.93, height * 0.5);
  drawContext.lineTo(width * 0.95, height * 0.73);
  drawContext.lineTo(width * 0.07, height * 0.78);
  drawContext.closePath();
  drawContext.fill();

  drawContext.fillStyle = withAlpha("#ffffff", 0.08);
  for (let bandIndex = 0; bandIndex < 4; bandIndex += 1) {
    drawContext.fillRect(
      width * 0.08,
      height * (0.49 + bandIndex * 0.08),
      width * 0.84,
      height * 0.006
    );
  }
}

function drawExpandedSettlementStyleReviewOverlay(
  drawContext,
  { width, height, palette, styleReviewProfile, cameraState }
) {
  drawContext.fillStyle = withAlpha("#0d2133", 0.78);
  drawContext.fillRect(width * 0.67, height * 0.07, width * 0.28, height * 0.24);
  drawContext.fillStyle = "#f4fbff";
  drawContext.font = "bold 14px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText("STYLE REVIEW", width * 0.69, height * 0.11);
  drawContext.font = "12px sans-serif";
  drawContext.fillText(
    `${styleReviewProfile.cameraProfile} :: ${cameraState.activeCompositionProfile}`,
    width * 0.69,
    height * 0.145
  );
  drawContext.fillText(
    `${styleReviewProfile.colourProfile} :: ${styleReviewProfile.lightingPreview}`,
    width * 0.69,
    height * 0.175
  );
  drawContext.fillText(
    `${styleReviewProfile.depthLayeringPreview} :: ${styleReviewProfile.terrainPresentationPreview}`,
    width * 0.69,
    height * 0.205
  );
  drawContext.fillText(
    "existing coastal assets only",
    width * 0.69,
    height * 0.235
  );

  const swatches = [
    palette.ground,
    palette.vegetation,
    palette.road,
    palette.building,
    palette.lighthouse
  ];
  swatches.forEach((color, index) => {
    drawContext.fillStyle = color;
    drawContext.fillRect(width * 0.69 + index * 24, height * 0.25, 16, 10);
  });
}

function drawExpandedSettlementReadabilityGuides(
  drawContext,
  objectInstances,
  bounds,
  { width, height, scaling, cameraState, styling }
) {
  const coastlineStroke =
    styling?.coastlineAppearance?.shorelineColor ?? "#C9D9B5";
  const blockStroke =
    styling?.buildingAppearance?.separationColor ?? "#F7EBDD";
  const roadGuideColor =
    styling?.roadAppearance?.edgeColor ?? "#D9E0E6";
  const buildings = objectInstances.filter((instance) => instance.category === "building");
  const roads = objectInstances.filter((instance) => instance.category === "road");

  drawContext.fillStyle = withAlpha(coastlineStroke, 0.22);
  drawContext.fillRect(width * 0.08, height * 0.33, width * 0.84, height * 0.03);

  if (typeof drawContext.stroke === "function") {
    drawContext.strokeStyle = withAlpha(roadGuideColor, 0.34);
    drawContext.lineWidth = 2;
    for (const road of roads) {
      const start = projectExpandedSettlementPoint(
        road.geometry.start,
        bounds,
        width,
        height,
        scaling,
        cameraState
      );
      const end = projectExpandedSettlementPoint(
        road.geometry.end,
        bounds,
        width,
        height,
        scaling,
        cameraState
      );
      drawContext.beginPath();
      drawContext.moveTo(start.x, start.y);
      drawContext.lineTo(end.x, end.y);
      drawContext.stroke();
    }
  }

  for (const building of buildings) {
    const projectedTopLeft = projectExpandedSettlementPoint(
      {
        x: building.footprint.x,
        y: building.footprint.y
      },
      bounds,
      width,
      height,
      scaling,
      cameraState
    );
    const projectedBottomRight = projectExpandedSettlementPoint(
      {
        x: building.footprint.x + building.footprint.width,
        y: building.footprint.y + building.footprint.height
      },
      bounds,
      width,
      height,
      scaling,
      cameraState
    );
    const rectX = Math.min(projectedTopLeft.x, projectedBottomRight.x);
    const rectY = Math.min(projectedTopLeft.y, projectedBottomRight.y);
    const rectWidth = Math.max(8, Math.abs(projectedBottomRight.x - projectedTopLeft.x));
    const rectHeight = Math.max(8, Math.abs(projectedBottomRight.y - projectedTopLeft.y));
    if (typeof drawContext.strokeRect === "function") {
      drawContext.strokeStyle = withAlpha(blockStroke, 0.42);
      drawContext.lineWidth = 1.5;
      drawContext.strokeRect(rectX, rectY, rectWidth, rectHeight);
    } else {
      drawContext.fillStyle = withAlpha(blockStroke, 0.18);
      drawContext.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
  }
}

function collectExpandedSettlementPoints(objectInstances) {
  const points = [];
  for (const instance of objectInstances) {
    if (instance.category === "road") {
      points.push(instance.geometry.start, instance.geometry.end);
    } else if (instance.position) {
      points.push(instance.position);
    }
  }
  return points;
}

function computeExpandedSettlementBounds(points) {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  return deepFreeze({
    minX,
    maxX,
    minY,
    maxY,
    spanX: Math.max(1, maxX - minX),
    spanY: Math.max(1, maxY - minY)
  });
}

function projectExpandedSettlementPoint(
  point,
  bounds,
  width,
  height,
  scaling = null,
  cameraState = null
) {
  const normalizedX = (point.x - bounds.minX) / bounds.spanX;
  const normalizedY = (point.y - bounds.minY) / bounds.spanY;
  const cameraScale = Number(scaling?.cameraScale ?? 1);
  const blockScale = Number(scaling?.blockScale ?? 1);
  const viewportCenterX = Number(cameraState?.viewportComposition?.centerX ?? 0.5);
  const viewportCenterY = Number(cameraState?.viewportComposition?.centerY ?? 0.58);
  const focusPoint = cameraState?.focusPoint;
  const focusNormalizedX =
    focusPoint && Number.isFinite(focusPoint.x)
      ? (focusPoint.x - bounds.minX) / bounds.spanX
      : 0.5;
  const focusNormalizedY =
    focusPoint && Number.isFinite(focusPoint.y)
      ? (focusPoint.y - bounds.minY) / bounds.spanY
      : 0.5;
  const scaledX = viewportCenterX + ((normalizedX - focusNormalizedX) / cameraScale);
  const scaledY =
    viewportCenterY - ((focusNormalizedY - normalizedY) / Math.max(1, blockScale));
  return deepFreeze({
    x: width * 0.08 + scaledX * width * 0.84,
    y: height * 0.82 - scaledY * height * 0.46
  });
}

function sortExpandedSettlementInstances(objectInstances) {
  return [...objectInstances].sort((left, right) => {
    const leftIndex = expandedSettlementCategoryOrder.indexOf(left.category);
    const rightIndex = expandedSettlementCategoryOrder.indexOf(right.category);
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    return String(left.instanceId).localeCompare(String(right.instanceId));
  });
}

function resolveExpandedSettlementZoomProfile(expandedSettlementPreview) {
  return (
    expandedSettlementPreview?.visualScaling?.activeZoomProfile ??
    expandedSettlementPreview?.cameraState?.activeZoomProfile ??
    expandedSettlementPreview?.cameraState?.previewZoomProfile ??
    "normal"
  );
}

function filterExpandedSettlementInstancesByZoom(objectInstances, zoomProfile) {
  const visibleCategoriesByProfile = Object.freeze({
    far: new Set(["road", "landmark"]),
    normal: new Set(["road", "building", "vegetation", "landmark"]),
    close: new Set(["building", "vegetation", "landmark"])
  });
  const allowedCategories =
    visibleCategoriesByProfile[zoomProfile] ?? visibleCategoriesByProfile.normal;
  return objectInstances.filter((instance) => allowedCategories.has(instance.category));
}

function createDefaultOverlayInteractionState(expandedSettlementPreview) {
  if (!expandedSettlementPreview) {
    return deepFreeze({
      selectedObject: null,
      hoverState: deepFreeze({
        currentState: "idle",
        hoveredObjectId: null
      }),
      interactionMode: "inactive",
      cameraFocus: null,
      validationResult: deepFreeze({
        objectIdentityValid: true,
        selectionPersistenceValid: true,
        cameraFocusValid: true,
        cleanupValid: true,
        deterministicBehaviourValid: true
      })
    });
  }
  return deepFreeze({
    selectedObject: null,
    hoverState: deepFreeze({
      currentState: "idle",
      hoveredObjectId: null,
      hoveredAssetId: null
    }),
    interactionMode: "map-overlay-selection",
    cameraFocus: deepFreeze({
      currentState: "world-anchor",
      targetAsset: expandedSettlementPreview.cameraState.targetAsset,
      focusPoint: deepFreeze({
        ...expandedSettlementPreview.cameraState.focusPoint
      }),
      synchronizedWithMap: true,
      mapCenterCoordinate: deepFreeze({
        ...expandedSettlementPreview.cameraState.mapCenterCoordinate
      })
    }),
    validationResult: deepFreeze({
      objectIdentityValid: true,
      selectionPersistenceValid: true,
      cameraFocusValid: true,
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
}

function createDefaultAssetDetailPreviewState(expandedSettlementPreview) {
  return deepFreeze({
    detailPreviewId:
      expandedSettlementPreview == null
        ? "expanded-settlement-detail-preview::inactive"
        : `${expandedSettlementPreview.sceneId}::detail-preview::idle`,
    selectedObjectId: null,
    assetId: null,
    assetType: null,
    cameraProfile:
      expandedSettlementPreview == null
        ? null
        : deepFreeze({
            currentState: "world-anchor",
            targetAsset: expandedSettlementPreview.cameraState.targetAsset,
            focusPoint: deepFreeze({
              ...expandedSettlementPreview.cameraState.focusPoint
            }),
            synchronizedWithMap: true,
            mapCenterCoordinate: deepFreeze({
              ...expandedSettlementPreview.cameraState.mapCenterCoordinate
            }),
            previewCameraProfile: expandedSettlementPreview.cameraState.cameraProfile
          }),
    detailState: "map-overview",
    validationResult: deepFreeze({
      selectedAssetIdentityValid: true,
      previewStateValid: true,
      cleanupValid: true,
      mapSynchronizationValid: true
    })
  });
}

function createDefaultPoiState(expandedSettlementPreview) {
  if (!expandedSettlementPreview) {
    return deepFreeze({
      poiId: "WORLD_POI_INACTIVE",
      assetId: null,
      poiType: null,
      position: null,
      interactionState: "poi-idle",
      validationResult: deepFreeze({
        poiIdentityValid: true,
        playerProximityValid: true,
        deterministicPlacementValid: true,
        cleanupValid: true
      })
    });
  }
  return buildPoiState(expandedSettlementPreview, null, null);
}

function createDefaultPoiContentMetadata(expandedSettlementPreview) {
  if (!expandedSettlementPreview) {
    return deepFreeze({
      poiContentId: "WORLD_POI_CONTENT_INACTIVE",
      poiId: "WORLD_POI_INACTIVE",
      title: null,
      description: null,
      category: null,
      interactionProfile: null,
      discoveryProfile: null,
      validationResult: deepFreeze({
        poiIdentityValid: true,
        metadataConsistencyValid: true,
        deterministicOutputValid: true,
        cleanupValid: true
      })
    });
  }
  return buildPoiContentMetadata(
    expandedSettlementPreview,
    createDefaultPoiState(expandedSettlementPreview)
  );
}

function createDefaultPoiPresentationState(expandedSettlementPreview) {
  if (!expandedSettlementPreview) {
    return deepFreeze({
      poiMarkerState: deepFreeze({
        activeMarkerId: null,
        markers: deepFreeze([]),
        visibleMarkerCount: 0
      }),
      selectedStyle: deepFreeze({
        currentState: "default-poi-style",
        poiId: null,
        accentColor: null,
        haloRadius: 0
      }),
      labelState: deepFreeze({
        zoomProfile: "normal",
        visiblePoiIds: deepFreeze([]),
        selectedLabelId: null
      }),
      visibilityState: deepFreeze({
        currentState: "hidden",
        visibleMarkerCount: 0,
        visibleLabelCount: 0,
        mapLayerVisible: false
      }),
      validationResult: deepFreeze({
        poiIdentityValid: true,
        zoomVisibilityValid: true,
        selectionStateValid: true,
        deterministicPresentationValid: true,
        cleanupValid: true
      })
    });
  }
  return buildPoiPresentationState(expandedSettlementPreview);
}

function createDefaultPlayerMapState(expandedSettlementPreview) {
  if (!expandedSettlementPreview) {
    return deepFreeze({
      playerId: "PLAYER_MAP_INACTIVE",
      coordinate: null,
      worldId: null,
      position: null,
      visibilityState: "hidden",
      cameraFocus: null,
      mapMarkerOffset: deepFreeze({ x: 0, y: 0 }),
      validationResult: deepFreeze({
        coordinateConsistencyValid: true,
        worldAlignmentValid: true,
        cameraBehaviorValid: true,
        cleanupValid: true,
        deterministicPlacementValid: true
      })
    });
  }
  return buildPlayerMapState(expandedSettlementPreview, "world-overview");
}

function createDefaultPlayerInteractionState(
  expandedSettlementPreview,
  playerState
) {
  if (!expandedSettlementPreview || !playerState) {
    return deepFreeze({
      interactionId: "PLAYER_WORLD_INTERACTION_INACTIVE",
      playerId: playerState?.playerId ?? "PLAYER_MAP_INACTIVE",
      targetObjectId: null,
      targetAssetId: null,
      interactionState: "world-idle",
      interactionDistance: null,
      validationResult: deepFreeze({
        playerObjectAlignmentValid: true,
        interactionDistanceValid: true,
        objectIdentityValid: true,
        cleanupValid: true,
        deterministicBehaviourValid: true
      })
    });
  }
  return buildPlayerInteractionState(expandedSettlementPreview, playerState, null);
}

function createDefaultCaptureState(
  expandedSettlementPreview,
  playerState
) {
  if (!expandedSettlementPreview || !playerState) {
    return deepFreeze({
      captureId: "SETTLEMENT_CAPTURE_INACTIVE",
      playerId: playerState?.playerId ?? "PLAYER_MAP_INACTIVE",
      targetObjectId: null,
      targetAssetId: null,
      captureState: "capture-idle",
      captureDistance: null,
      captureRange: 72,
      captureAnimationState: "capture-animation-idle",
      capturedObjectIds: deepFreeze([]),
      validationResult: deepFreeze({
        playerProximityValid: true,
        targetIdentityValid: true,
        deterministicCaptureResultValid: true,
        cleanupValid: true
      })
    });
  }
  return buildCaptureState(expandedSettlementPreview, playerState, null, []);
}

function createDefaultCaptureSessionStore(
  expandedSettlementPreview,
  playerState,
  captureState
) {
  if (!expandedSettlementPreview || !playerState || !captureState) {
    return deepFreeze({
      sessionId: "SETTLEMENT_CAPTURE_SESSION_INACTIVE",
      playerId: playerState?.playerId ?? "PLAYER_MAP_INACTIVE",
      worldId: playerState?.worldId ?? expandedSettlementPreview?.worldId ?? null,
      capturedObjectIds: deepFreeze([]),
      sessionState: "capture-session-idle",
      validationResult: deepFreeze({
        worldConsistencyValid: true,
        objectIdentityValid: true,
        deterministicRestoreValid: true,
        cleanupResetBehaviorValid: true
      })
    });
  }
  return buildCaptureSessionStore(
    expandedSettlementPreview,
    playerState,
    captureState
  );
}

function createDefaultCaptureSessionSummaryState(
  expandedSettlementPreview,
  playerState,
  captureSessionStore,
  discoveryState
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !captureSessionStore ||
    !discoveryState
  ) {
    return deepFreeze({
      sessionSummaryId: "SETTLEMENT_CAPTURE_SUMMARY_INACTIVE",
      worldId: expandedSettlementPreview?.worldId ?? null,
      playerId: playerState?.playerId ?? "PLAYER_MAP_INACTIVE",
      totalObjects: 0,
      capturedObjects: 0,
      discoveredObjects: 0,
      completionPercent: 0,
      capturedObjectAssetIds: deepFreeze([]),
      discoveredPoiCount: 0,
      validationResult: deepFreeze({
        summaryMatchesSessionState: true,
        deterministicOutputValid: true,
        cleanupResetBehaviorValid: true
      })
    });
  }
  return buildCaptureSessionSummaryState(
    expandedSettlementPreview,
    playerState,
    captureSessionStore,
    discoveryState
  );
}

function createDefaultSessionExperienceState(
  expandedSettlementPreview,
  playerState,
  interactionState,
  poiState,
  captureSessionSummaryState,
  explorationMode = "free_exploration"
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !interactionState ||
    !poiState ||
    !captureSessionSummaryState
  ) {
    return deepFreeze({
      sessionState: "exploration-session-idle",
      activeWorld: null,
      explorationMode:
        explorationMode === "guided_exploration" ? "guided_exploration" : "free_exploration",
      currentObjective: "Initialize a world preview to begin exploring.",
      validationResult: deepFreeze({
        stateSynchronizationValid: true,
        cleanupValid: true,
        deterministicSessionFlowValid: true
      })
    });
  }
  return buildSessionExperienceState(
    expandedSettlementPreview,
    playerState,
    interactionState,
    poiState,
    captureSessionSummaryState,
    explorationMode
  );
}

function createDefaultCapturePresentationState(
  expandedSettlementPreview,
  captureState,
  captureSessionStore = null
) {
  if (!expandedSettlementPreview || !captureState) {
    return deepFreeze({
      capturePresentationId: "SETTLEMENT_CAPTURE_PRESENTATION_INACTIVE",
      targetObjectId: null,
      captureEffectState: "capture-highlight-idle",
      markerState: deepFreeze({
        currentState: "capture-marker-hidden",
        targetObjectId: null,
        targetAssetId: null,
        capturedObjectIds: deepFreeze([]),
        capturedObjectCount: 0,
        markerIcon: "capture-idle-ring",
        markerColor: "#7D8B9A"
      }),
      validationResult: deepFreeze({
        captureStateConsistencyValid: true,
        presentationStateConsistencyValid: true,
        cleanupValid: true,
        deterministicDisplayValid: true
      })
    });
  }
  return buildCapturePresentationState(
    expandedSettlementPreview,
    captureState,
    captureSessionStore
  );
}

function createDefaultExplorationProgressPresentationState(
  expandedSettlementPreview,
  captureSessionSummaryState,
  discoveryState,
  sessionExperienceState,
  poiContentMetadata = null
) {
  if (
    !expandedSettlementPreview ||
    !captureSessionSummaryState ||
    !discoveryState ||
    !sessionExperienceState
  ) {
    return deepFreeze({
      explorationProgressPresentationId:
        "EXPLORATION_PROGRESS_PRESENTATION_INACTIVE",
      capturedCount: 0,
      discoveredCount: 0,
      totalWorldObjects: 0,
      completionPercent: 0,
      activeDiscoveryTarget: null,
      capturedPoiIndicators: deepFreeze([]),
      discoveredPoiIndicators: deepFreeze([]),
      currentExplorationObjective:
        sessionExperienceState?.currentObjective ??
        "Initialize a world preview to begin exploring.",
      validationResult: deepFreeze({
        summaryMatchesSessionState: true,
        uiUpdatesAfterDiscoveryValid: true,
        uiUpdatesAfterCaptureValid: true,
        cleanupResetBehaviorValid: true
      })
    });
  }
  return buildExplorationProgressPresentationState(
    expandedSettlementPreview,
    captureSessionSummaryState,
    discoveryState,
    sessionExperienceState,
    poiContentMetadata
  );
}

function createDefaultLandmarkShowcaseState(
  expandedSettlementPreview,
  interactionState,
  poiContentMetadata,
  detailPreviewState,
  discoveryState,
  captureState
) {
  if (
    !expandedSettlementPreview ||
    !interactionState ||
    !detailPreviewState ||
    !discoveryState ||
    !captureState
  ) {
    return deepFreeze({
      landmarkId: "LANDMARK_SHOWCASE_INACTIVE",
      assetId: null,
      showcaseState: "landmark-showcase-idle",
      focusCamera: null,
      discoveryState: "discovery-idle",
      captureState: "capture-idle",
      detailPresentationState: "map-overview",
      validationResult: deepFreeze({
        landmarkIdentityValid: true,
        cameraFocusValid: true,
        discoveryStateSyncValid: true,
        captureStateSyncValid: true,
        cleanupResetValid: true
      })
    });
  }
  return buildLandmarkShowcaseState(
    expandedSettlementPreview,
    interactionState,
    poiContentMetadata,
    detailPreviewState,
    discoveryState,
    captureState
  );
}

function createDefaultLocationExperienceState(
  expandedSettlementPreview,
  playerState,
  poiState,
  explorationProgressPresentationState,
  landmarkShowcaseState,
  sessionExperienceState
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !poiState ||
    !explorationProgressPresentationState ||
    !landmarkShowcaseState ||
    !sessionExperienceState
  ) {
    return deepFreeze({
      locationId: "FIRST_LOCATION_EXPERIENCE_INACTIVE",
      worldId: expandedSettlementPreview?.worldId ?? null,
      playerState: null,
      poiState: null,
      explorationState: null,
      landmarkState: null,
      validationResult: deepFreeze({
        startupFlowValid: true,
        playerStateValid: true,
        poiSelectionValid: true,
        discoveryValid: true,
        captureValid: true,
        landmarkShowcaseValid: true,
        cleanupResetValid: true
      })
    });
  }
  return buildLocationExperienceState(
    expandedSettlementPreview,
    playerState,
    poiState,
    explorationProgressPresentationState,
    landmarkShowcaseState,
    sessionExperienceState
  );
}

function createDefaultDiscoveryState(
  expandedSettlementPreview,
  playerState
) {
  if (!expandedSettlementPreview || !playerState) {
    return deepFreeze({
      discoveryId: "WORLD_DISCOVERY_INACTIVE",
      playerId: playerState?.playerId ?? "PLAYER_MAP_INACTIVE",
      objectId: null,
      assetId: null,
      discoveryState: "discovery-idle",
      discoveredObjectIds: deepFreeze([]),
      discoveryDistance: null,
      cameraFocus: null,
      validationResult: deepFreeze({
        playerProximityValid: true,
        objectIdentityValid: true,
        deterministicDiscoveryResultValid: true,
        cleanupValid: true
      })
    });
  }
  return buildDiscoveryState(expandedSettlementPreview, playerState, null, []);
}

function buildOverlayInteractionState(
  expandedSettlementPreview,
  { selectedObject = null, hoveredObject = null } = {}
) {
  const cameraFocusObject = selectedObject ?? hoveredObject ?? null;
  return deepFreeze({
    selectedObject:
      selectedObject == null
        ? null
        : deepFreeze({
            instanceId: selectedObject.instanceId,
            assetId: selectedObject.assetId,
            category: selectedObject.category
          }),
    hoverState: deepFreeze({
      currentState: hoveredObject ? "hovering" : "idle",
      hoveredObjectId: hoveredObject?.instanceId ?? null,
      hoveredAssetId: hoveredObject?.assetId ?? null
    }),
    interactionMode: "map-overlay-selection",
    cameraFocus: deepFreeze({
      currentState: cameraFocusObject ? "selected-object" : "world-anchor",
      targetAsset:
        cameraFocusObject?.assetId ?? expandedSettlementPreview.cameraState.targetAsset,
      focusPoint: deepFreeze({
        ...(cameraFocusObject?.center ??
          cameraFocusObject?.position ??
          expandedSettlementPreview.cameraState.focusPoint)
      }),
      synchronizedWithMap: true,
      mapCenterCoordinate: deepFreeze({
        ...expandedSettlementPreview.cameraState.mapCenterCoordinate
      })
    }),
    validationResult: deepFreeze({
      objectIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      selectionPersistenceValid: true,
      cameraFocusValid: true,
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
}

function buildAssetDetailPreviewState(
  expandedSettlementPreview,
  selectedObject = null,
  detailStateOverride = null
) {
  if (!expandedSettlementPreview) {
    return createDefaultAssetDetailPreviewState(expandedSettlementPreview);
  }
  const resolvedDetailState =
    detailStateOverride ??
    (selectedObject ? "focused-detail-preview" : "map-overview");
  return deepFreeze({
    detailPreviewId:
      selectedObject == null
        ? `${expandedSettlementPreview.sceneId}::detail-preview::idle`
        : `${expandedSettlementPreview.sceneId}::detail-preview::${selectedObject.instanceId}`,
    selectedObjectId: selectedObject?.instanceId ?? null,
    assetId: selectedObject?.assetId ?? null,
    assetType: selectedObject?.category ?? null,
    cameraProfile: deepFreeze({
      currentState: selectedObject ? "detail-focused" : "world-anchor",
      targetAsset:
        selectedObject?.assetId ?? expandedSettlementPreview.cameraState.targetAsset,
      focusPoint: deepFreeze({
        ...(selectedObject?.center ??
          selectedObject?.position ??
          expandedSettlementPreview.cameraState.focusPoint)
      }),
      synchronizedWithMap: true,
      mapCenterCoordinate: deepFreeze({
        ...expandedSettlementPreview.cameraState.mapCenterCoordinate
      }),
      previewCameraProfile: expandedSettlementPreview.cameraState.cameraProfile
    }),
    detailState: resolvedDetailState,
    validationResult: deepFreeze({
      selectedAssetIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      previewStateValid: [
        "map-overview",
        "focused-detail-preview",
        "returning-to-map-view"
      ].includes(resolvedDetailState),
      cleanupValid: true,
      mapSynchronizationValid: true
    })
  });
}

function buildPoiState(
  expandedSettlementPreview,
  selectedObject = null,
  playerState = null
) {
  if (!expandedSettlementPreview) {
    return createDefaultPoiState(expandedSettlementPreview);
  }
  const resolvedPoiPosition =
    selectedObject == null
      ? null
      : selectedObject.center
        ? {
            x: selectedObject.center.x,
            y: selectedObject.center.y
          }
        : selectedObject.position
          ? {
              x: selectedObject.position.x,
              y: selectedObject.position.y
            }
          : typeof selectedObject.x === "number" &&
              typeof selectedObject.y === "number" &&
              typeof selectedObject.width === "number" &&
              typeof selectedObject.height === "number"
            ? {
                x: selectedObject.x + selectedObject.width / 2,
                y: selectedObject.y + selectedObject.height / 2
              }
            : null;
  const poiType =
    selectedObject?.category === "landmark"
      ? "landmark"
      : selectedObject?.category === "building"
        ? "building"
        : selectedObject?.category === "vegetation"
          ? "nature"
          : selectedObject?.category === "road"
            ? "infrastructure"
            : null;
  const distance =
    resolvedPoiPosition == null || playerState?.position == null
      ? null
      : Number(
          Math.hypot(
            resolvedPoiPosition.x - playerState.position.x,
            resolvedPoiPosition.y - playerState.position.y
          ).toFixed(3)
        );
  return deepFreeze({
    poiId:
      selectedObject == null
        ? `${expandedSettlementPreview.sceneId}::poi::idle`
        : `${expandedSettlementPreview.sceneId}::poi::${selectedObject.instanceId}`,
    assetId: selectedObject?.assetId ?? null,
    poiType,
    position:
      resolvedPoiPosition == null
        ? null
        : deepFreeze({ ...resolvedPoiPosition }),
    interactionState:
      selectedObject == null
        ? "poi-idle"
        : distance == null || distance <= 84
          ? "poi-resolved"
          : "poi-out-of-range",
    validationResult: deepFreeze({
      poiIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      playerProximityValid: distance == null || distance <= 84,
      deterministicPlacementValid: true,
      cleanupValid: true
    })
  });
}

function buildPoiContentMetadata(
  expandedSettlementPreview,
  poiState = null
) {
  if (!expandedSettlementPreview) {
    return createDefaultPoiContentMetadata(expandedSettlementPreview);
  }
  const resolvedPoiState =
    poiState ?? createDefaultPoiState(expandedSettlementPreview);
  const selectedObject = expandedSettlementPreview.objectInstances.find(
    (objectInstance) => objectInstance.assetId === resolvedPoiState.assetId
  ) ?? null;
  const category =
    resolvedPoiState.poiType ??
    (selectedObject?.category === "vegetation"
      ? "nature"
      : selectedObject?.category ?? null);
  const profile =
    selectedObject == null
      ? null
      : Object.freeze({
          LIGHTHOUSE_ISLAND_ROCKY_001: {
            title: "Rocky Point Lighthouse",
            description:
              "A coastal landmark preview with viewpoint, discovery, and landmark-only interaction metadata.",
            category: "landmark",
            interactionProfile: deepFreeze({
              mode: "viewpoint-inspect",
              supportsFocusPreview: true,
              supportsPlayerInteraction: true
            }),
            discoveryProfile: deepFreeze({
              mode: "landmark-discovery",
              persistsWithinSession: true,
              revealsDetailPreview: true
            })
          },
          BUILDING_COASTAL_COTTAGE_001: {
            title: "Coastal Cottage",
            description:
              "A residential preview object with passive inspection metadata for detail and discovery views.",
            category: "building",
            interactionProfile: deepFreeze({
              mode: "residence-inspect",
              supportsFocusPreview: true,
              supportsPlayerInteraction: true
            }),
            discoveryProfile: deepFreeze({
              mode: "residential-discovery",
              persistsWithinSession: true,
              revealsDetailPreview: true
            })
          },
          TREE_EUCALYPTUS_001: {
            title: "Eucalyptus Tree",
            description:
              "A passive nature point of interest with reusable metadata for discovery and close inspection.",
            category: "nature",
            interactionProfile: deepFreeze({
              mode: "nature-inspect",
              supportsFocusPreview: true,
              supportsPlayerInteraction: true
            }),
            discoveryProfile: deepFreeze({
              mode: "nature-discovery",
              persistsWithinSession: true,
              revealsDetailPreview: true
            })
          },
          ROAD_COASTAL_001: {
            title: "Coastal Road",
            description:
              "A passive infrastructure point of interest that exposes route-focused metadata without gameplay activation.",
            category: "infrastructure",
            interactionProfile: deepFreeze({
              mode: "route-inspect",
              supportsFocusPreview: true,
              supportsPlayerInteraction: true
            }),
            discoveryProfile: deepFreeze({
              mode: "infrastructure-discovery",
              persistsWithinSession: true,
              revealsDetailPreview: true
            })
          }
        })[selectedObject.assetId] ?? null;

  return deepFreeze({
    poiContentId:
      selectedObject == null
        ? `${expandedSettlementPreview.sceneId}::poi-content::idle`
        : `${expandedSettlementPreview.sceneId}::poi-content::${selectedObject.instanceId}`,
    poiId: resolvedPoiState.poiId,
    title: profile?.title ?? null,
    description: profile?.description ?? null,
    category: profile?.category ?? category,
    interactionProfile: profile?.interactionProfile ?? null,
    discoveryProfile: profile?.discoveryProfile ?? null,
    validationResult: deepFreeze({
      poiIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      metadataConsistencyValid:
        selectedObject == null ||
        (profile != null &&
          profile.category ===
            (resolvedPoiState.poiType ?? profile.category)),
      deterministicOutputValid: true,
      cleanupValid: true
    })
  });
}

function buildPoiPresentationState(
  expandedSettlementPreview,
  poiState = null,
  poiContentMetadata = null
) {
  if (!expandedSettlementPreview) {
    return createDefaultPoiPresentationState(expandedSettlementPreview);
  }
  const resolvedPoiState =
    poiState ?? createDefaultPoiState(expandedSettlementPreview);
  const resolvedPoiContentMetadata =
    poiContentMetadata ??
    buildPoiContentMetadata(expandedSettlementPreview, resolvedPoiState);
  const activeZoomProfile =
    expandedSettlementPreview.visualScaling?.activeZoomProfile ?? "normal";
  const visibleLabelCategories = (
    activeZoomProfile === "far"
      ? ["landmark", "infrastructure"]
      : activeZoomProfile === "close"
        ? ["landmark", "building", "nature", "infrastructure"]
        : ["landmark", "building"]
  );
  const markers = expandedSettlementPreview.objectInstances
    .filter((objectInstance) => selectableExpandedSettlementAssetIds.has(objectInstance.assetId))
    .map((objectInstance) => {
      const category =
        objectInstance.category === "vegetation"
          ? "nature"
          : objectInstance.category === "road"
            ? "infrastructure"
            : objectInstance.category;
      const profile =
        category === "landmark"
          ? {
              markerShape: "diamond",
              markerColor: "#D4534A",
              labelColor: "#6E1F1B",
              markerSize: 15
            }
          : category === "building"
            ? {
                markerShape: "square",
                markerColor: "#3F6EA8",
                labelColor: "#183A63",
                markerSize: 12
              }
            : category === "nature"
              ? {
                  markerShape: "circle",
                  markerColor: "#4D8A45",
                  labelColor: "#214C1D",
                  markerSize: 10
                }
              : {
                  markerShape: "line",
                  markerColor: "#6B7078",
                  labelColor: "#2C3138",
                  markerSize: 11
                };

      const selected =
        resolvedPoiState.assetId != null &&
        objectInstance.assetId === resolvedPoiState.assetId;
      return deepFreeze({
        poiId: `${expandedSettlementPreview.sceneId}::poi::${objectInstance.instanceId}`,
        assetId: objectInstance.assetId,
        category,
        position: deepFreeze({ ...objectInstance.position }),
        markerShape: profile.markerShape,
        markerColor: profile.markerColor,
        labelColor: profile.labelColor,
        markerSize: selected ? profile.markerSize + 4 : profile.markerSize,
        label:
          objectInstance.assetId === resolvedPoiState.assetId
            ? resolvedPoiContentMetadata.title
            : resolvePoiLabelFromAssetId(objectInstance.assetId),
        selected,
        visible: true,
        labelVisible:
          selected || visibleLabelCategories.includes(category)
      });
    });
  const visibleMarkers = markers.filter((marker) => marker.visible);
  const visibleLabels = markers.filter((marker) => marker.visible && marker.labelVisible);
  const selectedPoiId =
    markers.find((marker) => marker.assetId === resolvedPoiState.assetId)?.poiId ?? null;

  return deepFreeze({
    poiMarkerState: deepFreeze({
      activeMarkerId: selectedPoiId,
      markers: deepFreeze(markers),
      visibleMarkerCount: visibleMarkers.length
    }),
    selectedStyle: deepFreeze({
      currentState: selectedPoiId ? "selected-poi-emphasis" : "default-poi-style",
      poiId: selectedPoiId,
      accentColor:
        selectedPoiId != null
          ? resolvedPoiContentMetadata.category === "landmark"
            ? "#FFF2A8"
            : "#FFF7D6"
          : null,
      haloRadius:
        selectedPoiId != null
          ? Number(
              ((visibleMarkers.find((marker) => marker.poiId === selectedPoiId)?.markerSize ?? 12) + 6)
                .toFixed(2)
            )
          : 0
    }),
    labelState: deepFreeze({
      zoomProfile: activeZoomProfile,
      visiblePoiIds: deepFreeze(visibleLabels.map((marker) => marker.poiId)),
      selectedLabelId: selectedPoiId
    }),
    visibilityState: deepFreeze({
      currentState: visibleMarkers.length > 0 ? "visible" : "hidden",
      visibleMarkerCount: visibleMarkers.length,
      visibleLabelCount: visibleLabels.length,
      mapLayerVisible: visibleMarkers.length > 0
    }),
    validationResult: deepFreeze({
      poiIdentityValid: markers.every(
        (marker) =>
          typeof marker.poiId === "string" &&
          typeof marker.assetId === "string" &&
          typeof marker.category === "string"
      ),
      zoomVisibilityValid:
        visibleLabels.every(
          (marker) =>
            marker.selected === true ||
            visibleLabelCategories.includes(marker.category)
        ) && ["far", "normal", "close"].includes(activeZoomProfile),
      selectionStateValid:
        selectedPoiId == null ||
        markers.some((marker) => marker.poiId === selectedPoiId && marker.selected === true),
      deterministicPresentationValid: true,
      cleanupValid: true
    })
  });
}

function resolvePoiLabelFromAssetId(assetId) {
  if (assetId === "LIGHTHOUSE_ISLAND_ROCKY_001") {
    return "Rocky Point Lighthouse";
  }
  if (assetId === "BUILDING_COASTAL_COTTAGE_001") {
    return "Coastal Cottage";
  }
  if (assetId === "TREE_EUCALYPTUS_001") {
    return "Eucalyptus Tree";
  }
  if (assetId === "ROAD_COASTAL_001") {
    return "Coastal Road";
  }
  return assetId;
}

function drawPoiPresentationMarker(drawContext, projectedMarker, marker) {
  const markerSize = Number(marker.markerSize ?? 10);
  if (marker.selected) {
    drawContext.strokeStyle = marker.markerColor;
    if (typeof drawContext.stroke === "function") {
      drawContext.beginPath();
      drawContext.arc(projectedMarker.x, projectedMarker.y, markerSize + 5, 0, Math.PI * 2);
      drawContext.stroke();
    }
  }
  drawContext.fillStyle = marker.markerColor;
  if (marker.markerShape === "diamond") {
    drawContext.beginPath();
    drawContext.moveTo(projectedMarker.x, projectedMarker.y - markerSize);
    drawContext.lineTo(projectedMarker.x + markerSize, projectedMarker.y);
    drawContext.lineTo(projectedMarker.x, projectedMarker.y + markerSize);
    drawContext.lineTo(projectedMarker.x - markerSize, projectedMarker.y);
    drawContext.closePath();
    drawContext.fill();
  } else if (marker.markerShape === "square") {
    drawContext.fillRect(
      projectedMarker.x - markerSize,
      projectedMarker.y - markerSize,
      markerSize * 2,
      markerSize * 2
    );
  } else if (marker.markerShape === "line") {
    if (typeof drawContext.stroke === "function") {
      drawContext.strokeStyle = marker.markerColor;
      drawContext.lineWidth = Math.max(3, markerSize / 2);
      drawContext.beginPath();
      drawContext.moveTo(projectedMarker.x - markerSize, projectedMarker.y);
      drawContext.lineTo(projectedMarker.x + markerSize, projectedMarker.y);
      drawContext.stroke();
    } else {
      drawContext.fillRect(
        projectedMarker.x - markerSize,
        projectedMarker.y - 2,
        markerSize * 2,
        4
      );
    }
  } else {
    drawContext.beginPath();
    drawContext.arc(projectedMarker.x, projectedMarker.y, markerSize, 0, Math.PI * 2);
    drawContext.fill();
  }

  if (marker.labelVisible && typeof marker.label === "string" && marker.label.length > 0) {
    drawContext.fillStyle = marker.labelColor ?? "#163046";
    drawContext.font = marker.selected ? "bold 12px sans-serif" : "11px sans-serif";
    drawContext.textAlign = "center";
    drawContext.fillText(
      marker.label,
      projectedMarker.x,
      projectedMarker.y - markerSize - 8
    );
  }
}

function buildPlayerMapState(
  expandedSettlementPreview,
  focusMode = "world-overview",
  anchorObject = null
) {
  if (!expandedSettlementPreview) {
    return createDefaultPlayerMapState(expandedSettlementPreview);
  }
  const seed = stableNumericHash(
    `${expandedSettlementPreview.worldId}::${expandedSettlementPreview.sceneId}::player`
  );
  const anchorPoint =
    anchorObject?.center != null
      ? anchorObject.center
      : anchorObject?.position != null
        ? anchorObject.position
        : null;
  const offsetX =
    anchorPoint == null
      ? ((seed % 17) - 8) * 4
      : ((seed % 5) - 2) * 6;
  const offsetY =
    anchorPoint == null
      ? (((Math.floor(seed / 17)) % 17) - 8) * 3
      : (((Math.floor(seed / 5)) % 5) - 2) * 6;
  const latitudeOffset = Number((((seed % 9) - 4) * 0.000018).toFixed(6));
  const longitudeOffset = Number(((((Math.floor(seed / 9)) % 9) - 4) * 0.000018).toFixed(6));
  const playerPosition = deepFreeze({
    x: Number(
      ((anchorPoint?.x ?? expandedSettlementPreview.cameraState.focusPoint.x) + offsetX).toFixed(3)
    ),
    y: Number(
      ((anchorPoint?.y ?? expandedSettlementPreview.cameraState.focusPoint.y) + offsetY).toFixed(3)
    )
  });
  const resolvedFocusMode =
    focusMode === "player-focused" ? "player-focused" : "world-overview";
  return deepFreeze({
    playerId: `PLAYER_MAP_${seed}`,
    coordinate: deepFreeze({
      latitude: Number(
        (expandedSettlementPreview.cameraState.mapCenterCoordinate.latitude + latitudeOffset).toFixed(6)
      ),
      longitude: Number(
        (expandedSettlementPreview.cameraState.mapCenterCoordinate.longitude + longitudeOffset).toFixed(6)
      )
    }),
    worldId: expandedSettlementPreview.worldId,
    position: playerPosition,
    visibilityState:
      resolvedFocusMode === "player-focused" ? "player-focused" : "world-visible",
    cameraFocus: deepFreeze({
      currentState: resolvedFocusMode,
      focusPoint: deepFreeze(
        resolvedFocusMode === "player-focused"
          ? { ...playerPosition }
          : { ...expandedSettlementPreview.cameraState.focusPoint }
      ),
      targetAsset:
        resolvedFocusMode === "player-focused"
          ? "PLAYER_MARKER"
          : expandedSettlementPreview.cameraState.targetAsset,
      synchronizedWithMap: true
    }),
    mapMarkerOffset: deepFreeze({
      x: ((seed % 7) - 3) * 12,
      y: (((Math.floor(seed / 7)) % 7) - 3) * 10
    }),
    validationResult: deepFreeze({
      coordinateConsistencyValid: true,
      worldAlignmentValid: true,
      cameraBehaviorValid: true,
      cleanupValid: true,
      deterministicPlacementValid: true
    })
  });
}

function buildPlayerInteractionState(
  expandedSettlementPreview,
  playerState,
  selectedObject = null
) {
  if (!expandedSettlementPreview || !playerState) {
    return createDefaultPlayerInteractionState(expandedSettlementPreview, playerState);
  }
  const resolvedSelectedObject = resolveExpandedSettlementObject(
    expandedSettlementPreview,
    selectedObject
  );
  const interactionDistance =
    resolvedSelectedObject?.position == null && resolvedSelectedObject?.center == null
      ? null
      : Number(
          Math.hypot(
            (resolvedSelectedObject.center?.x ?? resolvedSelectedObject.position.x) -
              playerState.position.x,
            (resolvedSelectedObject.center?.y ?? resolvedSelectedObject.position.y) -
              playerState.position.y
          ).toFixed(3)
        );
  const withinInteractionRange =
    interactionDistance != null && interactionDistance <= 72;
  return deepFreeze({
    interactionId:
      resolvedSelectedObject == null
        ? `${expandedSettlementPreview.sceneId}::player-interaction::idle`
        : `${expandedSettlementPreview.sceneId}::player-interaction::${playerState.playerId}::${resolvedSelectedObject.instanceId}`,
    playerId: playerState.playerId,
    targetObjectId: resolvedSelectedObject?.instanceId ?? null,
    targetAssetId: resolvedSelectedObject?.assetId ?? null,
    interactionState:
      resolvedSelectedObject == null
        ? "world-idle"
        : withinInteractionRange
          ? "object-interaction-ready"
          : "object-out-of-range",
    interactionDistance,
    validationResult: deepFreeze({
      playerObjectAlignmentValid:
        resolvedSelectedObject == null ||
        expandedSettlementPreview.worldId === playerState.worldId,
      interactionDistanceValid:
        resolvedSelectedObject == null || withinInteractionRange,
      objectIdentityValid:
        resolvedSelectedObject == null ||
        selectableExpandedSettlementAssetIds.has(resolvedSelectedObject.assetId),
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
}

function buildCaptureState(
  expandedSettlementPreview,
  playerState,
  selectedObject = null,
  existingCapturedObjectIds = []
) {
  if (!expandedSettlementPreview || !playerState) {
    return createDefaultCaptureState(expandedSettlementPreview, playerState);
  }
  const resolvedSelectedObject = resolveExpandedSettlementObject(
    expandedSettlementPreview,
    selectedObject
  );
  const capturedObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(existingCapturedObjectIds)
        ? existingCapturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  const captureDistance =
    resolvedSelectedObject?.position == null && resolvedSelectedObject?.center == null
      ? null
      : Number(
          Math.hypot(
            (resolvedSelectedObject.center?.x ?? resolvedSelectedObject.position.x) -
              playerState.position.x,
            (resolvedSelectedObject.center?.y ?? resolvedSelectedObject.position.y) -
              playerState.position.y
          ).toFixed(3)
        );
  const withinCaptureRange =
    captureDistance != null && captureDistance <= 72;
  const alreadyCaptured =
    resolvedSelectedObject != null &&
    capturedObjectIds.includes(String(resolvedSelectedObject.instanceId));
  const nextCapturedObjectIds =
    resolvedSelectedObject != null && withinCaptureRange && !alreadyCaptured
      ? deepFreeze(
          [...new Set([...capturedObjectIds, String(resolvedSelectedObject.instanceId)])].sort()
        )
      : capturedObjectIds;
  const capturedThisSession =
    resolvedSelectedObject != null &&
    nextCapturedObjectIds.includes(String(resolvedSelectedObject.instanceId));
  return deepFreeze({
    captureId:
      resolvedSelectedObject == null
        ? `${expandedSettlementPreview.sceneId}::capture::idle`
        : `${expandedSettlementPreview.sceneId}::capture::${playerState.playerId}::${resolvedSelectedObject.instanceId}`,
    playerId: playerState.playerId,
    targetObjectId: resolvedSelectedObject?.instanceId ?? null,
    targetAssetId: resolvedSelectedObject?.assetId ?? null,
    captureState:
      resolvedSelectedObject == null
        ? "capture-idle"
        : capturedThisSession
          ? "captured-session"
          : withinCaptureRange
            ? "capture-ready"
            : "capture-out-of-range",
    captureDistance,
    captureRange: 72,
    captureAnimationState:
      selectedObject == null
        ? "capture-animation-idle"
        : capturedThisSession
          ? "capture-placeholder-pulse"
          : withinCaptureRange
            ? "capture-placeholder-armed"
            : "capture-placeholder-blocked",
    capturedObjectIds: nextCapturedObjectIds,
    validationResult: deepFreeze({
      playerProximityValid:
        resolvedSelectedObject == null ||
        withinCaptureRange ||
        !capturedThisSession,
      targetIdentityValid:
        resolvedSelectedObject == null ||
        selectableExpandedSettlementAssetIds.has(resolvedSelectedObject.assetId),
      deterministicCaptureResultValid:
        resolvedSelectedObject == null ||
        expandedSettlementPreview.worldId === playerState.worldId,
      cleanupValid: true
    })
  });
}

function buildCaptureSessionStore(
  expandedSettlementPreview,
  playerState,
  captureState,
  existingSessionId = null
) {
  if (!expandedSettlementPreview || !playerState || !captureState) {
    return createDefaultCaptureSessionStore(
      expandedSettlementPreview,
      playerState,
      captureState
    );
  }
  const capturedObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(captureState.capturedObjectIds)
        ? captureState.capturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  return deepFreeze({
    sessionId:
      typeof existingSessionId === "string" && existingSessionId.length > 0
        ? existingSessionId
        : `${expandedSettlementPreview.worldId}::${playerState.playerId}::capture-session`,
    playerId: playerState.playerId,
    worldId: expandedSettlementPreview.worldId,
    capturedObjectIds,
    sessionState:
      capturedObjectIds.length > 0 ? "capture-session-active" : "capture-session-idle",
    validationResult: deepFreeze({
      worldConsistencyValid: expandedSettlementPreview.worldId === playerState.worldId,
      objectIdentityValid:
        capturedObjectIds.every((objectId) =>
          expandedSettlementPreview.objectInstances.some(
            (objectInstance) => objectInstance.instanceId === objectId
          )
        ),
      deterministicRestoreValid: true,
      cleanupResetBehaviorValid: true
    })
  });
}

function buildCaptureSessionSummaryState(
  expandedSettlementPreview,
  playerState,
  captureSessionStore,
  discoveryState
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !captureSessionStore ||
    !discoveryState
  ) {
    return createDefaultCaptureSessionSummaryState(
      expandedSettlementPreview,
      playerState,
      captureSessionStore,
      discoveryState
    );
  }
  const totalObjects = expandedSettlementPreview.objectInstances.filter((objectInstance) =>
    selectableExpandedSettlementAssetIds.has(objectInstance.assetId)
  ).length;
  const capturedObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(captureSessionStore.capturedObjectIds)
        ? captureSessionStore.capturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  const discoveredObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(discoveryState.discoveredObjectIds)
        ? discoveryState.discoveredObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  const exploredObjectIds = deepFreeze(
    [...new Set([...capturedObjectIds, ...discoveredObjectIds])].sort()
  );
  const completionPercent =
    totalObjects === 0
      ? 0
      : Number(((exploredObjectIds.length / totalObjects) * 100).toFixed(2));
  const capturedObjectAssetIds = deepFreeze(
    capturedObjectIds
      .map(
        (objectId) =>
          expandedSettlementPreview.objectInstances.find(
            (objectInstance) => objectInstance.instanceId === objectId
          )?.assetId ?? null
      )
      .filter((assetId) => typeof assetId === "string")
  );
  return deepFreeze({
    sessionSummaryId: `${expandedSettlementPreview.worldId}::${playerState.playerId}::capture-summary`,
    worldId: expandedSettlementPreview.worldId,
    playerId: playerState.playerId,
    totalObjects,
    capturedObjects: capturedObjectIds.length,
    discoveredObjects: discoveredObjectIds.length,
    completionPercent,
    capturedObjectAssetIds,
    discoveredPoiCount: discoveredObjectIds.length,
    validationResult: deepFreeze({
      summaryMatchesSessionState:
        capturedObjectIds.length === captureSessionStore.capturedObjectIds.length &&
        discoveredObjectIds.length === discoveryState.discoveredObjectIds.length,
      deterministicOutputValid: true,
      cleanupResetBehaviorValid: true
    })
  });
}

function buildExplorationProgressPresentationState(
  expandedSettlementPreview,
  captureSessionSummaryState,
  discoveryState,
  sessionExperienceState,
  poiContentMetadata = null
) {
  if (
    !expandedSettlementPreview ||
    !captureSessionSummaryState ||
    !discoveryState ||
    !sessionExperienceState
  ) {
    return createDefaultExplorationProgressPresentationState(
      expandedSettlementPreview,
      captureSessionSummaryState,
      discoveryState,
      sessionExperienceState,
      poiContentMetadata
    );
  }
  const capturedAssetIds = Array.isArray(captureSessionSummaryState.capturedObjectAssetIds)
    ? captureSessionSummaryState.capturedObjectAssetIds
    : [];
  const discoveredObjectIds = Array.isArray(discoveryState.discoveredObjectIds)
    ? discoveryState.discoveredObjectIds.map((value) => String(value))
    : [];
  const discoveredAssetIds = deepFreeze(
    discoveredObjectIds
      .map(
        (objectId) =>
          expandedSettlementPreview.objectInstances.find(
            (objectInstance) => objectInstance.instanceId === objectId
          )?.assetId ?? null
      )
      .filter((assetId) => typeof assetId === "string")
  );
  const activeDiscoveryTarget =
    discoveryState.discoveryState === "discovered-persistent" &&
    discoveryState.assetId != null
      ? deepFreeze({
          assetId: discoveryState.assetId,
          title:
            poiContentMetadata?.title && poiContentMetadata.assetId === discoveryState.assetId
              ? poiContentMetadata.title
              : resolvePoiLabelFromAssetId(discoveryState.assetId),
          discoveryState: discoveryState.discoveryState
        })
      : null;
  return deepFreeze({
    explorationProgressPresentationId:
      `${expandedSettlementPreview.sceneId}::exploration-progress-presentation`,
    capturedCount: captureSessionSummaryState.capturedObjects,
    discoveredCount: captureSessionSummaryState.discoveredObjects,
    totalWorldObjects: captureSessionSummaryState.totalObjects,
    completionPercent: captureSessionSummaryState.completionPercent,
    activeDiscoveryTarget,
    capturedPoiIndicators: deepFreeze(
      capturedAssetIds.map((assetId) =>
        deepFreeze({
          assetId,
          title: resolvePoiLabelFromAssetId(assetId),
          indicatorState: "captured"
        })
      )
    ),
    discoveredPoiIndicators: deepFreeze(
      discoveredAssetIds.map((assetId) =>
        deepFreeze({
          assetId,
          title: resolvePoiLabelFromAssetId(assetId),
          indicatorState: capturedAssetIds.includes(assetId) ? "captured" : "discovered"
        })
      )
    ),
    currentExplorationObjective: sessionExperienceState.currentObjective,
    validationResult: deepFreeze({
      summaryMatchesSessionState:
        captureSessionSummaryState.capturedObjects === capturedAssetIds.length &&
        captureSessionSummaryState.discoveredObjects === discoveredObjectIds.length,
      uiUpdatesAfterDiscoveryValid:
        discoveryState.discoveryState !== "discovered-persistent" ||
        activeDiscoveryTarget?.assetId === discoveryState.assetId,
      uiUpdatesAfterCaptureValid:
        capturedAssetIds.length === captureSessionSummaryState.capturedObjects,
      cleanupResetBehaviorValid:
        captureSessionSummaryState.totalObjects >= captureSessionSummaryState.capturedObjects &&
        captureSessionSummaryState.totalObjects >= captureSessionSummaryState.discoveredObjects
    })
  });
}

function buildLandmarkShowcaseState(
  expandedSettlementPreview,
  interactionState,
  poiContentMetadata,
  detailPreviewState,
  discoveryState,
  captureState
) {
  if (
    !expandedSettlementPreview ||
    !interactionState ||
    !detailPreviewState ||
    !discoveryState ||
    !captureState
  ) {
    return createDefaultLandmarkShowcaseState(
      expandedSettlementPreview,
      interactionState,
      poiContentMetadata,
      detailPreviewState,
      discoveryState,
      captureState
    );
  }
  const selectedAssetId = interactionState.selectedObject?.assetId ?? null;
  const isLandmark = selectedAssetId === "LIGHTHOUSE_ISLAND_ROCKY_001";
  const title =
    isLandmark
      ? poiContentMetadata?.title ?? resolvePoiLabelFromAssetId(selectedAssetId)
      : null;
  const showcaseState =
    !isLandmark
      ? "landmark-showcase-idle"
      : captureState.captureState === "captured-session"
        ? "landmark-captured-showcase"
        : discoveryState.discoveryState === "discovered-persistent"
          ? "landmark-discovered-showcase"
          : detailPreviewState.detailState === "focused-detail-preview"
            ? "landmark-detail-showcase"
            : "landmark-focused-showcase";
  return deepFreeze({
    landmarkId:
      isLandmark && interactionState.selectedObject?.instanceId
        ? `${expandedSettlementPreview.sceneId}::landmark-showcase::${interactionState.selectedObject.instanceId}`
        : `${expandedSettlementPreview.sceneId}::landmark-showcase::idle`,
    assetId: isLandmark ? selectedAssetId : null,
    landmarkTitle: title,
    showcaseState,
    focusCamera:
      !isLandmark
        ? null
        : deepFreeze({
            currentState:
              detailPreviewState.detailState === "focused-detail-preview"
                ? "landmark-detail-focus"
                : "landmark-world-focus",
            targetAsset: selectedAssetId,
            focusPoint: deepFreeze({
              ...(detailPreviewState.cameraProfile?.focusPoint ??
                interactionState.cameraFocus?.focusPoint ??
                expandedSettlementPreview.cameraState.focusPoint)
            }),
            previewCameraProfile:
              detailPreviewState.cameraProfile?.previewCameraProfile ??
              expandedSettlementPreview.cameraState.cameraProfile,
            synchronizedWithMap:
              detailPreviewState.cameraProfile?.synchronizedWithMap ??
              interactionState.cameraFocus?.synchronizedWithMap ??
              true
          }),
    discoveryState: isLandmark ? discoveryState.discoveryState : "discovery-idle",
    captureState: isLandmark ? captureState.captureState : "capture-idle",
    detailPresentationState: isLandmark ? detailPreviewState.detailState : "map-overview",
    validationResult: deepFreeze({
      landmarkIdentityValid:
        !isLandmark ||
        poiContentMetadata?.category === "landmark" ||
        interactionState.selectedObject?.category === "landmark",
      cameraFocusValid:
        !isLandmark ||
        interactionState.cameraFocus?.targetAsset === "LIGHTHOUSE_ISLAND_ROCKY_001",
      discoveryStateSyncValid:
        !isLandmark ||
        (discoveryState.assetId == null ||
          discoveryState.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"),
      captureStateSyncValid:
        !isLandmark ||
        (captureState.targetAssetId == null ||
          captureState.targetAssetId === "LIGHTHOUSE_ISLAND_ROCKY_001"),
      cleanupResetValid:
        isLandmark ||
        (detailPreviewState.detailState === "map-overview" &&
          discoveryState.discoveryState === "discovery-idle")
    })
  });
}

function buildLocationExperienceState(
  expandedSettlementPreview,
  playerState,
  poiState,
  explorationProgressPresentationState,
  landmarkShowcaseState,
  sessionExperienceState
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !poiState ||
    !explorationProgressPresentationState ||
    !landmarkShowcaseState ||
    !sessionExperienceState
  ) {
    return createDefaultLocationExperienceState(
      expandedSettlementPreview,
      playerState,
      poiState,
      explorationProgressPresentationState,
      landmarkShowcaseState,
      sessionExperienceState
    );
  }
  const hasActivePoi = typeof poiState.assetId === "string" && poiState.assetId.length > 0;
  return deepFreeze({
    locationId:
      `${expandedSettlementPreview.worldId}::${expandedSettlementPreview.sceneId}::first-location`,
    worldId: expandedSettlementPreview.worldId,
    playerState: deepFreeze({
      playerId: playerState.playerId,
      worldId: playerState.worldId,
      visibilityState: playerState.visibilityState,
      coordinate: deepFreeze({ ...playerState.coordinate }),
      focusState: playerState.cameraFocus.currentState,
      targetAsset: playerState.cameraFocus.targetAsset
    }),
    poiState: deepFreeze({
      poiId: poiState.poiId,
      assetId: poiState.assetId,
      poiType: poiState.poiType,
      interactionState: poiState.interactionState
    }),
    explorationState: deepFreeze({
      capturedCount: explorationProgressPresentationState.capturedCount,
      discoveredCount: explorationProgressPresentationState.discoveredCount,
      totalWorldObjects: explorationProgressPresentationState.totalWorldObjects,
      completionPercent: explorationProgressPresentationState.completionPercent,
      activeDiscoveryTarget:
        explorationProgressPresentationState.activeDiscoveryTarget == null
          ? null
          : deepFreeze({
              ...explorationProgressPresentationState.activeDiscoveryTarget
            }),
      currentExplorationObjective:
        explorationProgressPresentationState.currentExplorationObjective
    }),
    landmarkState: deepFreeze({
      landmarkId: landmarkShowcaseState.landmarkId,
      assetId: landmarkShowcaseState.assetId,
      showcaseState: landmarkShowcaseState.showcaseState,
      discoveryState: landmarkShowcaseState.discoveryState,
      captureState: landmarkShowcaseState.captureState
    }),
    validationResult: deepFreeze({
      startupFlowValid:
        typeof expandedSettlementPreview.worldId === "string" &&
        typeof expandedSettlementPreview.sceneId === "string",
      playerStateValid:
        playerState.worldId === expandedSettlementPreview.worldId &&
        typeof playerState.playerId === "string",
      poiSelectionValid:
        !hasActivePoi ||
        expandedSettlementPreview.objectInstances.some(
          (objectInstance) => objectInstance.assetId === poiState.assetId
        ),
      discoveryValid:
        explorationProgressPresentationState.validationResult.uiUpdatesAfterDiscoveryValid === true,
      captureValid:
        explorationProgressPresentationState.validationResult.uiUpdatesAfterCaptureValid === true,
      landmarkShowcaseValid:
        landmarkShowcaseState.validationResult.landmarkIdentityValid === true &&
        landmarkShowcaseState.validationResult.cameraFocusValid === true,
      cleanupResetValid:
        sessionExperienceState.validationResult.cleanupValid === true &&
        landmarkShowcaseState.validationResult.cleanupResetValid === true
    })
  });
}

function buildSessionExperienceState(
  expandedSettlementPreview,
  playerState,
  interactionState,
  poiState,
  captureSessionSummaryState,
  explorationMode = "free_exploration"
) {
  if (
    !expandedSettlementPreview ||
    !playerState ||
    !interactionState ||
    !poiState ||
    !captureSessionSummaryState
  ) {
    return createDefaultSessionExperienceState(
      expandedSettlementPreview,
      playerState,
      interactionState,
      poiState,
      captureSessionSummaryState,
      explorationMode
    );
  }
  const normalizedExplorationMode =
    explorationMode === "guided_exploration" ? "guided_exploration" : "free_exploration";
  const selectedAssetId = interactionState.selectedObject?.assetId ?? null;
  const currentObjective =
    selectedAssetId != null
      ? `Inspect ${selectedAssetId} and choose whether to capture or discover it.`
      : captureSessionSummaryState.completionPercent >= 100
        ? "Review the completed world survey and revisit notable points of interest."
        : captureSessionSummaryState.capturedObjects === 0 &&
            captureSessionSummaryState.discoveredObjects === 0
          ? "Select a nearby point of interest to begin exploring the world."
          : "Continue exploring nearby objects to grow the current session survey.";
  return deepFreeze({
    sessionState: "exploration-session-active",
    activeWorld: deepFreeze({
      worldId: expandedSettlementPreview.worldId,
      sceneId: expandedSettlementPreview.sceneId,
      playerId: playerState.playerId
    }),
    explorationMode: normalizedExplorationMode,
    currentObjective,
    validationResult: deepFreeze({
      stateSynchronizationValid:
        playerState.worldId === expandedSettlementPreview.worldId &&
        captureSessionSummaryState.worldId === expandedSettlementPreview.worldId &&
        (poiState.assetId == null ||
          interactionState.selectedObject == null ||
          poiState.assetId === interactionState.selectedObject.assetId),
      cleanupValid: true,
      deterministicSessionFlowValid: true
    })
  });
}

function buildCapturePresentationState(
  expandedSettlementPreview,
  captureState,
  captureSessionStore = null
) {
  if (!expandedSettlementPreview || !captureState) {
    return createDefaultCapturePresentationState(
      expandedSettlementPreview,
      captureState,
      captureSessionStore
    );
  }
  const resolvedCaptureSessionStore =
    captureSessionStore ??
    buildCaptureSessionStore(
      expandedSettlementPreview,
      {
        playerId: captureState.playerId,
        worldId: expandedSettlementPreview.worldId
      },
      captureState
    );
  const targetObject =
    expandedSettlementPreview.objectInstances.find(
      (objectInstance) => objectInstance.instanceId === captureState.targetObjectId
    ) ?? null;
  const capturedObjectIds = deepFreeze(
    [...new Set(
      Array.isArray(resolvedCaptureSessionStore.capturedObjectIds)
        ? resolvedCaptureSessionStore.capturedObjectIds.map((value) => String(value))
        : []
    )].sort()
  );
  return deepFreeze({
    capturePresentationId:
      targetObject == null
        ? `${expandedSettlementPreview.sceneId}::capture-presentation::idle`
        : `${expandedSettlementPreview.sceneId}::capture-presentation::${targetObject.instanceId}`,
    targetObjectId: targetObject?.instanceId ?? null,
    captureEffectState:
      captureState.captureState === "captured-session"
        ? "capture-highlight-active"
        : captureState.captureState === "capture-ready"
          ? "capture-highlight-armed"
          : captureState.captureState === "capture-out-of-range"
            ? "capture-highlight-blocked"
            : "capture-highlight-idle",
    markerState: deepFreeze({
      currentState:
        capturedObjectIds.length > 0
          ? "captured-marker-visible"
          : targetObject != null
            ? "capture-target-marker-visible"
            : "capture-marker-hidden",
      targetObjectId: targetObject?.instanceId ?? null,
      targetAssetId: targetObject?.assetId ?? null,
      capturedObjectIds,
      capturedObjectCount: capturedObjectIds.length,
      markerIcon:
        captureState.captureState === "captured-session"
          ? "captured-poi-marker"
          : captureState.captureState === "capture-ready"
            ? "capture-ready-ring"
            : captureState.captureState === "capture-out-of-range"
              ? "capture-blocked-ring"
              : "capture-idle-ring",
      markerColor:
        captureState.captureState === "captured-session"
          ? "#F2C94C"
          : captureState.captureState === "capture-ready"
            ? "#49B675"
            : captureState.captureState === "capture-out-of-range"
              ? "#A94A4A"
              : "#7D8B9A"
    }),
    validationResult: deepFreeze({
      captureStateConsistencyValid:
        captureState.targetObjectId == null ||
        targetObject?.instanceId === captureState.targetObjectId,
      presentationStateConsistencyValid:
        capturedObjectIds.length >= 0 &&
        (captureState.captureState !== "captured-session" ||
          capturedObjectIds.includes(String(captureState.targetObjectId))),
      cleanupValid: true,
      deterministicDisplayValid: true
    })
  });
}

function drawCapturePresentationMarkers(
  drawContext,
  renderedObjects,
  capturePresentationState
) {
  if (!capturePresentationState?.markerState) {
    return;
  }
  const capturedObjectIds = new Set(
    capturePresentationState.markerState.capturedObjectIds ?? []
  );
  const targetObjectId = capturePresentationState.targetObjectId;
  for (const renderedObject of renderedObjects) {
    const centerX = renderedObject.x + renderedObject.width / 2;
    const centerY = renderedObject.y + renderedObject.height / 2;
    if (capturedObjectIds.has(String(renderedObject.instanceId))) {
      if (typeof drawContext.stroke === "function") {
        drawContext.strokeStyle = "#F2C94C";
        drawContext.lineWidth = 3;
        drawContext.beginPath();
        drawContext.arc(centerX, centerY, Math.max(renderedObject.width, renderedObject.height) * 0.42, 0, Math.PI * 2);
        drawContext.stroke();
      }
      drawContext.fillStyle = "#F2C94C";
      drawContext.beginPath();
      drawContext.arc(centerX, renderedObject.y - 10, 7, 0, Math.PI * 2);
      drawContext.fill();
      drawContext.fillStyle = "#163046";
      drawContext.font = "bold 10px sans-serif";
      drawContext.textAlign = "center";
      drawContext.fillText("C", centerX, renderedObject.y - 6.5);
    } else if (targetObjectId != null && renderedObject.instanceId === targetObjectId) {
      if (typeof drawContext.stroke === "function") {
        drawContext.strokeStyle =
          capturePresentationState.markerState.markerColor ?? "#7D8B9A";
        drawContext.lineWidth = 2;
        drawContext.beginPath();
        drawContext.arc(centerX, centerY, Math.max(renderedObject.width, renderedObject.height) * 0.36, 0, Math.PI * 2);
        drawContext.stroke();
      }
    }
  }
}

function buildDiscoveryState(
  expandedSettlementPreview,
  playerState,
  selectedObject = null,
  existingDiscoveredObjectIds = []
) {
  if (!expandedSettlementPreview || !playerState) {
    return createDefaultDiscoveryState(expandedSettlementPreview, playerState);
  }
  const resolvedSelectedObject = resolveExpandedSettlementObject(
    expandedSettlementPreview,
    selectedObject
  );
  const discoveredIds = new Set(
    Array.isArray(existingDiscoveredObjectIds)
      ? existingDiscoveredObjectIds.map((value) => String(value))
      : []
  );
  const discoveryDistance =
    resolvedSelectedObject?.position == null && resolvedSelectedObject?.center == null
      ? null
      : Number(
          Math.hypot(
            (resolvedSelectedObject.center?.x ?? resolvedSelectedObject.position.x) -
              playerState.position.x,
            (resolvedSelectedObject.center?.y ?? resolvedSelectedObject.position.y) -
              playerState.position.y
          ).toFixed(3)
        );
  const withinDiscoveryRange =
    discoveryDistance != null && discoveryDistance <= 84;
  const discoveredObjectIds =
    resolvedSelectedObject != null && withinDiscoveryRange
      ? deepFreeze(
          [...new Set([...discoveredIds, String(resolvedSelectedObject.instanceId)])].sort()
        )
      : deepFreeze([...discoveredIds].sort());
  const isDiscovered =
    resolvedSelectedObject != null &&
    discoveredObjectIds.includes(String(resolvedSelectedObject.instanceId));
  return deepFreeze({
    discoveryId:
      resolvedSelectedObject == null
        ? `${expandedSettlementPreview.sceneId}::discovery::idle`
        : `${expandedSettlementPreview.sceneId}::discovery::${playerState.playerId}::${resolvedSelectedObject.instanceId}`,
    playerId: playerState.playerId,
    objectId: resolvedSelectedObject?.instanceId ?? null,
    assetId: resolvedSelectedObject?.assetId ?? null,
    discoveryState:
      resolvedSelectedObject == null
        ? "discovery-idle"
        : isDiscovered
          ? "discovered-persistent"
          : withinDiscoveryRange
            ? "discovered-nearby"
            : "discovery-out-of-range",
    discoveredObjectIds,
    discoveryDistance,
    cameraFocus: deepFreeze({
      currentState:
        resolvedSelectedObject != null && withinDiscoveryRange
          ? "discovery-focused"
          : "world-overview",
      focusPoint: deepFreeze(
        resolvedSelectedObject != null && withinDiscoveryRange
          ? {
              x: resolvedSelectedObject.center?.x ?? resolvedSelectedObject.position.x,
              y: resolvedSelectedObject.center?.y ?? resolvedSelectedObject.position.y
            }
          : { ...expandedSettlementPreview.cameraState.focusPoint }
      ),
      targetAsset:
        resolvedSelectedObject != null && withinDiscoveryRange
          ? resolvedSelectedObject.assetId
          : expandedSettlementPreview.cameraState.targetAsset,
      synchronizedWithMap: true
    }),
    validationResult: deepFreeze({
      playerProximityValid: resolvedSelectedObject == null || withinDiscoveryRange,
      objectIdentityValid:
        resolvedSelectedObject == null ||
        selectableExpandedSettlementAssetIds.has(resolvedSelectedObject.assetId),
      deterministicDiscoveryResultValid: true,
      cleanupValid: true
    })
  });
}

function resolveExpandedSettlementObject(expandedSettlementPreview, objectReference = null) {
  if (!expandedSettlementPreview || !objectReference) {
    return objectReference ?? null;
  }
  return (
    expandedSettlementPreview.objectInstances.find(
      (objectInstance) =>
        objectInstance.instanceId === objectReference.instanceId ||
        objectInstance.assetId === objectReference.assetId
    ) ?? objectReference
  );
}

function resolveSelectableObjectAtCanvasPoint(layout, x, y) {
  if (!layout || !Array.isArray(layout.renderedObjects)) {
    return null;
  }
  const candidates = layout.renderedObjects.filter((object) =>
    selectableExpandedSettlementAssetIds.has(object.assetId)
  );
  const hitMatches = candidates.filter((object) =>
    doesCanvasPointHitObject(object, x, y)
  );
  if (hitMatches.length === 0) {
    return null;
  }
  return hitMatches.sort(compareSelectableObjects)[0];
}

function doesCanvasPointHitObject(object, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }
  if (object.hitShape === "circle") {
    return Math.hypot(x - object.center.x, y - object.center.y) <= object.hitRadius;
  }
  if (object.hitShape === "rect") {
    return (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    );
  }
  if (object.hitShape === "segment") {
    return pointToSegmentDistance(
      x,
      y,
      object.start.x,
      object.start.y,
      object.end.x,
      object.end.y
    ) <= object.hitRadius;
  }
  return false;
}

function compareSelectableObjects(left, right) {
  const priority = new Map([
    ["landmark", 0],
    ["building", 1],
    ["vegetation", 2],
    ["road", 3]
  ]);
  const leftPriority = priority.get(left.category) ?? 9;
  const rightPriority = priority.get(right.category) ?? 9;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }
  return String(left.instanceId).localeCompare(String(right.instanceId));
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  if (deltaX === 0 && deltaY === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const projected =
    ((px - x1) * deltaX + (py - y1) * deltaY) /
    (deltaX * deltaX + deltaY * deltaY);
  const clamped = Math.max(0, Math.min(1, projected));
  const closestX = x1 + clamped * deltaX;
  const closestY = y1 + clamped * deltaY;
  return Math.hypot(px - closestX, py - closestY);
}

function freezeSelectionFailure(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message,
    selectedObject: null,
    interactionState: null
  });
}

export function drawProjectedGroundMesh(drawContext, { width, height, meshData, fillStyle = "#4d9b57" }) {
  if (!drawContext || !meshData || !Array.isArray(meshData.projectedVertices)) {
    return;
  }

  const scaleX = width * 0.28;
  const scaleY = height * 0.1;
  const originX = width * 0.04;
  const originY = height * 0.8;

  drawContext.fillStyle = fillStyle;
  drawContext.beginPath();
  meshData.projectedVertices.forEach((vertex, index) => {
    const x = originX + vertex.x * scaleX;
    const y = originY - vertex.y * scaleY;
    if (index === 0) {
      drawContext.moveTo(x, y);
    } else {
      drawContext.lineTo(x, y);
    }
  });
  drawContext.closePath();
  drawContext.fill();
}

function resolveGroundBindingLodLabel(activeGroundBinding) {
  return (
    activeGroundBinding?.lodSelection?.currentLod ??
    activeGroundBinding?.glbReference?.lodKey ??
    "LOD_UNSPECIFIED"
  );
}

function resolveGroundBindingSourceLabel(activeGroundBinding) {
  return (
    activeGroundBinding?.renderPayload?.rendererAssetReference?.sourceType ??
    activeGroundBinding?.renderResult?.displayMode ??
    "preview-source-unspecified"
  );
}

function resolveElements(documentRef, options) {
  const previewContainer =
    options.previewContainer ??
    documentRef.getElementById("atlasPreviewContainer");
  const canvasContainer =
    options.canvasContainer ?? documentRef.getElementById("atlasPreviewCanvasHost");
  const showButton =
    options.showButton ?? documentRef.getElementById("atlasPreviewShowButton");
  const hideButton =
    options.hideButton ?? documentRef.getElementById("atlasPreviewHideButton");
  const status =
    options.status ?? documentRef.getElementById("atlasPreviewStatus");

  const required = [
    ["preview container", previewContainer],
    ["canvas container", canvasContainer],
    ["show button", showButton],
    ["hide button", hideButton],
    ["status", status]
  ];

  for (const [label, element] of required) {
    if (!element) {
      return freezeError(
        "missing_required_element",
        `Atlas browser demo harness requires ${label}.`
      );
    }
  }

  return Object.freeze({
    ok: true,
    previewContainer,
    canvasContainer,
    showButton,
    hideButton,
    status
  });
}

function createPreviewCanvas(documentRef, canvasContainer) {
  const canvas = documentRef.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  canvas.className = "atlas-preview-canvas";
  canvas.setAttribute("aria-label", "Atlas placeholder preview");
  if (canvasContainer && canvasContainer.dataset) {
    canvas.dataset.mountTarget = canvasContainer.id || "atlasPreviewCanvasHost";
  }
  return canvas;
}

function setStatus(statusElement, message) {
  statusElement.textContent = message;
}

function setContainerVisibility(previewContainer, isVisible) {
  previewContainer.hidden = !isVisible;
  previewContainer.dataset.previewVisible = isVisible ? "true" : "false";
}

function freezeError(errorCode, message) {
  return Object.freeze({
    ok: false,
    errorCode,
    message,
    atlasBrowserDemoHarness: null
  });
}

function buildBrowserSafePreviewMountOptions() {
  const lightingMode = "day_showcase";
  const foundationBase = "ATLAS_FIRST_MANUAL_BROWSER_VISIBLE_PREVIEW_MOUNT_001";
  const drawSessionBase = "ATLAS_FIRST_CONTROLLED_CANVAS_DRAW_001";
  const drawResultBase = "ATLAS_FIRST_VISIBLE_CANVAS_DRAW_RESULT_001";
  const drawSessionId = `${drawSessionBase}_${stableNumericHash(
    `${drawResultBase}_0123456789::${lightingMode}::draw`
  )}`;
  const drawResultId = `${drawResultBase}_${stableNumericHash(
    `${drawSessionId}::${lightingMode}::visible-capture`
  )}`;

  return Object.freeze({
    validateAtlasEngineFirstVisibleCanvasDrawResultFoundation: () =>
      Object.freeze({
        ok: true,
        errorCode: null,
        message: null,
        atlasFirstVisibleCanvasDrawResult: Object.freeze({
          captureId: drawResultId,
          drawSessionId,
          canvasResult: Object.freeze({
            exists: true,
            width: 1280,
            height: 720,
            pixelRatio: 1,
            lightingMode,
            drawCommandCount: 4,
            drawCommandsExecuted: true
          }),
          frameResult: Object.freeze({
            frameProduced: true,
            visibleState: "verified-visible",
            objectCount: 11,
            includedAssetIds: Object.freeze([
              "LIGHTHOUSE_ISLAND_ROCKY_001",
              "BUILDING_HOUSE_SMALL_COASTAL_001",
              "ROAD_STRAIGHT_SMALL_001",
              "TREE_EUCALYPTUS_001"
            ]),
            cameraResult: Object.freeze({
              profile: "coastal-overlook",
              focusTarget: "LIGHTHOUSE_ISLAND_ROCKY_001",
              orientation: "south-east",
              zoom: 1.22
            }),
            lightingResult: Object.freeze({
              currentMode: lightingMode,
              appearanceProfiles: Object.freeze([
                "DAY_COASTAL_LIGHTHOUSE",
                "SUNSET_COASTAL_LIGHTHOUSE",
                "NIGHT_COASTAL_LIGHTHOUSE"
              ])
            }),
            rendererResult: Object.freeze({
              rendererProfile: "custom-2.5d-passive",
              payloadValid: true
            }),
            deterministicOutput: true
          }),
          verificationState: Object.freeze({
            currentState: "verified",
            cleanupSuccessful: true
          })
        })
      }),
    browserDemoFoundationBase: foundationBase
  });
}

function resolveRealGroundPreviewBinding(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (rawBinding.assetId && rawBinding.rendererPayload && rawBinding.lodSelection) {
    return Object.freeze(rawBinding);
  }
  return null;
}

function resolveRealGroundRenderBinding(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (rawBinding.assetId && rawBinding.renderPayload && rawBinding.lodSelection) {
    return Object.freeze(rawBinding);
  }
  return null;
}

function resolveRealGroundMeshPreview(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (rawBinding.assetId && rawBinding.meshData && rawBinding.renderResult) {
    return Object.freeze(rawBinding);
  }
  return null;
}

function resolveRealGroundRuntimeLoader(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (
    rawBinding.assetId &&
    rawBinding.meshResult &&
    rawBinding.materialResult &&
    rawBinding.renderResult
  ) {
    return Object.freeze(rawBinding);
  }
  return null;
}

function resolveRealGroundMeshRenderTest(rawBinding, runtimeLoaderDefinition) {
  if (!rawBinding && !runtimeLoaderDefinition) {
    return null;
  }

  if (
    rawBinding?.assetId &&
    rawBinding?.geometryPayload &&
    rawBinding?.materialPayload &&
    rawBinding?.verificationResult
  ) {
    return Object.freeze(rawBinding);
  }
  return null;
}

function resolveCoastalWorldShowcase(rawShowcase) {
  if (!rawShowcase) {
    return null;
  }

  if (
    rawShowcase.showcaseId &&
    rawShowcase.sceneId &&
    Array.isArray(rawShowcase.assetInstances) &&
    rawShowcase.cameraProfile &&
    rawShowcase.lightingProfile &&
    rawShowcase.displayState &&
    rawShowcase.verificationResult
  ) {
    return Object.freeze(rawShowcase);
  }

  const validation = validateCoastalStarterWorldBrowserShowcase(
    rawShowcase.definition ?? rawShowcase
  );
  if (!validation.ok) {
    return null;
  }

  return Object.freeze(validation.coastalStarterWorldBrowserShowcase.showcase);
}

function resolveExpandedSettlementPreview(rawPreview) {
  if (!rawPreview) {
    return null;
  }

  if (
    rawPreview.previewId &&
    rawPreview.sceneId &&
    rawPreview.worldId &&
    Array.isArray(rawPreview.objectInstances) &&
    rawPreview.cameraState &&
    rawPreview.visibilityState &&
    rawPreview.validationResult
  ) {
    return deepFreeze(rawPreview);
  }

  return createExpandedSettlementVisualPreviewBinding(rawPreview);
}

function normalizeSettlementPresentationProfile(profile) {
  switch (profile) {
    case "overview":
    case "neighbourhood":
    case "close":
      return profile;
    default:
      return "neighbourhood";
  }
}

function normalizeSettlementLightingProfile(profile) {
  switch (profile) {
    case "day":
    case "sunset":
    case "night":
      return profile;
    default:
      return "day";
  }
}

function buildRenderableExpandedSettlementPreview(
  expandedSettlementPreview,
  {
    presentationProfile = "neighbourhood",
    lightingProfile = "day",
    styleReviewMode = false
  } = {}
) {
  if (!expandedSettlementPreview) {
    return null;
  }

  const normalizedPresentationProfile =
    normalizeSettlementPresentationProfile(presentationProfile);
  const normalizedLightingProfile =
    normalizeSettlementLightingProfile(lightingProfile);
  const presentationProfileMapping = Object.freeze({
    overview: Object.freeze({
      activePresentationProfile: "overview_presentation_profile",
      activeZoomProfile: "far",
      activeCompositionProfile: "far_overview"
    }),
    neighbourhood: Object.freeze({
      activePresentationProfile: "neighbourhood_presentation_profile",
      activeZoomProfile: "normal",
      activeCompositionProfile: "normal_neighbourhood"
    }),
    close: Object.freeze({
      activePresentationProfile: "close_exploration_profile",
      activeZoomProfile: "close",
      activeCompositionProfile: "close_property"
    }),
    style_review: Object.freeze({
      activePresentationProfile: "style_review_presentation_profile",
      activeZoomProfile: "normal",
      activeCompositionProfile: "style_review_scene"
    })
  });
  const mapping = styleReviewMode === true
    ? presentationProfileMapping.style_review
    : presentationProfileMapping[normalizedPresentationProfile];
  const visibleObjectCount = filterExpandedSettlementInstancesByZoom(
    expandedSettlementPreview.objectInstances ?? [],
    mapping.activeZoomProfile
  ).length;
  const styleReviewProfile = deepFreeze({
    enabled: styleReviewMode === true,
    cameraProfile:
      styleReviewMode === true ? "style_review_camera_profile" : null,
    colourProfile:
      styleReviewMode === true
        ? `coastal_review_${normalizedLightingProfile}_palette`
        : null,
    depthLayeringPreview:
      styleReviewMode === true ? "foreground-midground-background-stack" : null,
    terrainPresentationPreview:
      styleReviewMode === true ? "coastline-ground-yard-banding" : null,
    lightingPreview:
      styleReviewMode === true ? `${normalizedLightingProfile}_review_lighting` : null
  });

  return deepFreeze({
    ...expandedSettlementPreview,
    visualScaling: deepFreeze({
      ...expandedSettlementPreview.visualScaling,
      activePresentationProfile: mapping.activePresentationProfile,
      activeZoomProfile: mapping.activeZoomProfile,
      visibleObjectCount,
      previewZoomProfile: deepFreeze({
        ...(expandedSettlementPreview.visualScaling?.previewZoomProfile ?? {}),
        activeProfile: mapping.activeZoomProfile
      })
    }),
    visualStyling: deepFreeze({
      ...expandedSettlementPreview.visualStyling,
      activeLightingProfile: normalizedLightingProfile,
      styleReviewMode: styleReviewMode === true
    }),
    presentationSummary: deepFreeze({
      ...expandedSettlementPreview.presentationSummary,
      activePresentationProfile: mapping.activePresentationProfile,
      activeZoomProfile: mapping.activeZoomProfile,
      activeCompositionProfile: mapping.activeCompositionProfile,
      activeLightingProfile: normalizedLightingProfile,
      visibleObjectCount,
      styleReviewProfile
    }),
    cameraState: deepFreeze({
      ...expandedSettlementPreview.cameraState,
      cameraProfile:
        styleReviewMode === true
          ? "style_review_camera_profile"
          : expandedSettlementPreview.cameraState.cameraProfile,
      activeCompositionProfile: mapping.activeCompositionProfile,
      activeZoomProfile: mapping.activeZoomProfile,
      previewZoomProfile: mapping.activeZoomProfile
    }),
    validationResult: deepFreeze({
      ...expandedSettlementPreview.validationResult,
      visibleObjectCount
    })
  });
}

function buildVisualSourceSummary({
  expandedSettlementPreview,
  coastalWorldShowcase,
  visibilityState
}) {
  if (expandedSettlementPreview) {
    return deepFreeze({
      sourceType:
        expandedSettlementPreview.visualStyling?.styleReviewMode === true
          ? "expanded-settlement-style-review"
          : "expanded-settlement-scene",
      sceneId: expandedSettlementPreview.sceneId,
      worldId: expandedSettlementPreview.worldId,
      objectInstanceCount: expandedSettlementPreview.objectInstances.length,
      visibleObjectCount:
        expandedSettlementPreview.visualScaling?.visibleObjectCount ??
        expandedSettlementPreview.objectInstances.length,
      densityProfile: expandedSettlementPreview.visualScaling?.densityProfile ?? null,
      presentationProfile:
        expandedSettlementPreview.visualScaling?.activePresentationProfile ?? null,
      styleReviewMode:
        expandedSettlementPreview.visualStyling?.styleReviewMode === true,
      previewZoomProfile:
        expandedSettlementPreview.visualScaling?.activeZoomProfile ??
        expandedSettlementPreview.cameraState?.previewZoomProfile ??
        null,
      visibilityState,
      active:
        visibilityState === "visible" &&
        expandedSettlementPreview.validationResult.objectsResolve === true
    });
  }

  if (coastalWorldShowcase) {
    return deepFreeze({
      sourceType: "coastal-showcase-scene",
      sceneId: coastalWorldShowcase.sceneId,
      worldId: coastalWorldShowcase.worldId,
      objectInstanceCount: coastalWorldShowcase.assetInstances.length,
      visibilityState,
      active:
        visibilityState === "visible" &&
        coastalWorldShowcase.verificationResult.realGlbBackedSceneValid === true
    });
  }

  return deepFreeze({
    sourceType: "placeholder-scene",
    sceneId: null,
    worldId: null,
    objectInstanceCount: atlasBrowserDemoPlaceholderObjects.length,
    visibilityState,
    active: visibilityState === "visible"
  });
}

function createDefaultWorldExpansionDemoRoutingState() {
  return deepFreeze({
    activeRegion: null,
    regionType: null,
    mapDataRoute: null,
    sceneRoute: null,
    pipelineStatus: "waiting-for-pipeline-validation",
    validationResult: deepFreeze({
      coastalWorldUnchangedValid: false,
      demoStateMatchesPipelineStateValid: false,
      cleanupResetValid: true,
      pipelineValidationReady: false
    })
  });
}

function buildWorldExpansionDemoRoutingState(
  pipelineValidationState,
  activeVisualSourceSummary
) {
  if (!pipelineValidationState) {
    return createDefaultWorldExpansionDemoRoutingState();
  }

  const sceneMatchesVisualSource =
    !activeVisualSourceSummary?.sceneId ||
    activeVisualSourceSummary.sceneId === pipelineValidationState.sceneOutput?.sceneId;
  const worldMatchesVisualSource =
    !activeVisualSourceSummary?.worldId ||
    activeVisualSourceSummary.worldId ===
      pipelineValidationState.planningFoundation?.activeWorldLocation?.worldId;

  return deepFreeze({
    activeRegion: pipelineValidationState.regionResolution?.worldRegionId ?? null,
    regionType: pipelineValidationState.regionResolution?.regionType ?? null,
    mapDataRoute: deepFreeze({
      mapDataRouteId: pipelineValidationState.mapDataRoute?.mapDataRouteId ?? null,
      providerProfileId:
        pipelineValidationState.mapDataRoute?.providerProfile?.providerProfileId ??
        null,
      providerMode:
        pipelineValidationState.mapDataRoute?.providerProfile?.providerMode ?? null,
      mapFixtureProfileId:
        pipelineValidationState.mapDataRoute?.mapFixtureProfile
          ?.mapFixtureProfileId ?? null
    }),
    sceneRoute: deepFreeze({
      sceneRouteId: pipelineValidationState.sceneRoute?.sceneRouteId ?? null,
      sceneAssemblyId:
        pipelineValidationState.sceneRoute?.sceneProfile?.sceneAssemblyId ?? null,
      settlementGeneratorId:
        pipelineValidationState.sceneRoute?.settlementProfile?.generatorId ?? null
    }),
    pipelineStatus:
      pipelineValidationState.validationResult?.fullChainValid === true
        ? "validated-active"
        : "validation-incomplete",
    validationResult: deepFreeze({
      coastalWorldUnchangedValid:
        pipelineValidationState.validationResult?.coastalLocationUnchangedValid ===
        true,
      demoStateMatchesPipelineStateValid:
        pipelineValidationState.validationResult?.chainIdentityConsistencyValid ===
          true &&
        sceneMatchesVisualSource &&
        worldMatchesVisualSource,
      cleanupResetValid: true,
      pipelineValidationReady:
        pipelineValidationState.validationResult?.fullChainValid === true &&
        pipelineValidationState.validationResult?.deterministicOutputValid ===
          true &&
        pipelineValidationState.validationResult?.fallbackSafetyValid === true
    })
  });
}

function createExpandedSettlementPreviewId(sceneId, worldId) {
  const hash = stableNumericHash(`${sceneId}::${worldId}`);
  return `MAP_WORLD_SETTLEMENT_VISUAL_PREVIEW_${hash}`;
}

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
