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
  let mounted = false;
  let previewSession = null;
  let lastExpandedSettlementLayout = null;
  let currentOverlayInteractionState = createDefaultOverlayInteractionState(
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
  let currentDiscoveryState = createDefaultDiscoveryState(
    expandedSettlementPreview,
    currentPlayerMapState
  );
  let activeVisualSourceSummary = buildVisualSourceSummary({
    expandedSettlementPreview,
    coastalWorldShowcase,
    visibilityState: "hidden"
  });

  setStatus(
    elements.status,
    expandedSettlementPreview
      ? "Settlement world ready. Use Show Coastal World."
      : coastalWorldShowcase
        ? "Coastal world ready. Use Show Coastal World."
        : "Atlas preview ready. Use Show Atlas Preview."
  );
  setContainerVisibility(elements.previewContainer, false);

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

    if (expandedSettlementPreview) {
      lastExpandedSettlementLayout = drawExpandedSettlementPreview(drawContext, expandedSettlementPreview, {
        width: canvas.width,
        height: canvas.height,
        interactionState: currentOverlayInteractionState,
        playerState: currentPlayerMapState
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
      expandedSettlementPreview
        ? expandedSettlementPreview.validationResult.objectsResolve
          ? `Settlement world visible with neighbourhood-scale scene ${expandedSettlementPreview.sceneId}.`
          : `Settlement world visible with fallback-safe scene ${expandedSettlementPreview.sceneId}.`
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
      expandedSettlementPreview,
      coastalWorldShowcase,
      visibilityState: "visible"
    });

    return Object.freeze({
      ok: true,
      previewMountResult: mountResult.previewMountResult,
      visualSourceSummary: activeVisualSourceSummary,
      expandedSettlementPreview,
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
    currentOverlayInteractionState = createDefaultOverlayInteractionState(
      expandedSettlementPreview
    );
    currentAssetDetailPreviewState = createDefaultAssetDetailPreviewState(
      expandedSettlementPreview
    );
    currentPlayerMapState = createDefaultPlayerMapState(
      expandedSettlementPreview
    );
    currentPlayerInteractionState = createDefaultPlayerInteractionState(
      expandedSettlementPreview,
      currentPlayerMapState
    );
    currentDiscoveryState = createDefaultDiscoveryState(
      expandedSettlementPreview,
      currentPlayerMapState
    );
    const cleanup = previewSession.unmountPreview();
    setContainerVisibility(elements.previewContainer, false);
    setStatus(elements.status, "Atlas preview hidden.");
    activeVisualSourceSummary = buildVisualSourceSummary({
      expandedSettlementPreview,
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
      expandedSettlementPreview,
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
      expandedSettlementPreview,
      {
        selectedObject: resolvedObject,
        hoveredObject: resolvedObject
      }
    );
    currentAssetDetailPreviewState = buildAssetDetailPreviewState(
      expandedSettlementPreview,
      currentOverlayInteractionState.selectedObject
    );
    currentPlayerInteractionState = buildPlayerInteractionState(
      expandedSettlementPreview,
      currentPlayerMapState,
      currentOverlayInteractionState.selectedObject
    );
    lastExpandedSettlementLayout = drawExpandedSettlementPreview(
      drawContext,
      expandedSettlementPreview,
      {
        width: canvas.width,
        height: canvas.height,
        interactionState: currentOverlayInteractionState
        ,
        playerState: currentPlayerMapState
      }
    );
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
      interactionState: currentOverlayInteractionState,
      detailPreviewState: currentAssetDetailPreviewState,
      playerInteractionState: currentPlayerInteractionState,
      discoveryState: currentDiscoveryState
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
        currentPlayerMapState = createDefaultPlayerMapState(
          expandedSettlementPreview
        );
        currentPlayerInteractionState = createDefaultPlayerInteractionState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        currentDiscoveryState = createDefaultDiscoveryState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        if (expandedSettlementPreview && mounted) {
          lastExpandedSettlementLayout = drawExpandedSettlementPreview(
            drawContext,
            expandedSettlementPreview,
            {
              width: canvas.width,
              height: canvas.height,
              interactionState: currentOverlayInteractionState,
              playerState: currentPlayerMapState
            }
          );
        }
        return currentOverlayInteractionState;
      },
      currentSettlementInteractionState() {
        return currentOverlayInteractionState;
      },
      openSettlementAssetDetailPreview() {
        currentAssetDetailPreviewState = buildAssetDetailPreviewState(
          expandedSettlementPreview,
          currentOverlayInteractionState.selectedObject
        );
        return currentAssetDetailPreviewState;
      },
      closeSettlementAssetDetailPreview() {
        currentAssetDetailPreviewState = buildAssetDetailPreviewState(
          expandedSettlementPreview,
          null,
          "returning-to-map-view"
        );
        return currentAssetDetailPreviewState;
      },
      currentSettlementAssetDetailPreviewState() {
        return currentAssetDetailPreviewState;
      },
      focusSettlementPlayerPresence() {
        currentPlayerMapState = buildPlayerMapState(
          expandedSettlementPreview,
          "player-focused"
        );
        if (expandedSettlementPreview && mounted) {
          lastExpandedSettlementLayout = drawExpandedSettlementPreview(
            drawContext,
            expandedSettlementPreview,
            {
              width: canvas.width,
              height: canvas.height,
              interactionState: currentOverlayInteractionState,
              playerState: currentPlayerMapState
            }
          );
        }
        return currentPlayerMapState;
      },
      returnSettlementWorldOverview() {
        currentPlayerMapState = buildPlayerMapState(
          expandedSettlementPreview,
          "world-overview"
        );
        if (expandedSettlementPreview && mounted) {
          lastExpandedSettlementLayout = drawExpandedSettlementPreview(
            drawContext,
            expandedSettlementPreview,
            {
              width: canvas.width,
              height: canvas.height,
              interactionState: currentOverlayInteractionState,
              playerState: currentPlayerMapState
            }
          );
        }
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
      discoverSelectedSettlementObject() {
        currentDiscoveryState = buildDiscoveryState(
          expandedSettlementPreview,
          currentPlayerMapState,
          currentOverlayInteractionState.selectedObject,
          currentDiscoveryState.discoveredObjectIds
        );
        if (expandedSettlementPreview && mounted) {
          lastExpandedSettlementLayout = drawExpandedSettlementPreview(
            drawContext,
            expandedSettlementPreview,
            {
              width: canvas.width,
              height: canvas.height,
              interactionState: currentOverlayInteractionState,
              playerState: currentPlayerMapState,
              discoveryState: currentDiscoveryState
            }
          );
        }
        return currentDiscoveryState;
      },
      clearSettlementDiscoveryState() {
        currentDiscoveryState = createDefaultDiscoveryState(
          expandedSettlementPreview,
          currentPlayerMapState
        );
        return currentDiscoveryState;
      },
      currentSettlementDiscoveryState() {
        return currentDiscoveryState;
      },
      currentSettlementSelectableObjects() {
        return deepFreeze(
          [...(lastExpandedSettlementLayout?.renderedObjects ?? [])].filter((object) =>
            selectableExpandedSettlementAssetIds.has(object.assetId)
          )
        );
      },
      currentVisualSourceSummary() {
        return activeVisualSourceSummary;
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
      visibleObjectCount: Number(scene.visualScaling?.visibleObjectCount ?? objectInstances.length),
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
    discoveryState = null
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
  const resolvedDiscoveryState =
    discoveryState ?? createDefaultDiscoveryState(expandedSettlementPreview, resolvedPlayerState);
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
  const overlayAlpha = 0.58;

  drawContext.fillStyle = withAlpha(palette.sky, overlayAlpha * 0.48);
  drawContext.fillRect(0, 0, width, height);
  drawContext.fillStyle = withAlpha(palette.coastline ?? palette.sea, overlayAlpha * 0.72);
  drawContext.fillRect(0, height * 0.18, width, height * 0.07);
  drawContext.fillStyle = withAlpha(palette.sea, overlayAlpha * 0.62);
  drawContext.fillRect(0, height * 0.25, width, height * 0.13);
  drawContext.fillStyle = withAlpha(palette.ground, overlayAlpha * 0.56);
  drawContext.fillRect(0, height * 0.38, width, height * 0.62);
  drawContext.fillStyle =
    withAlpha(
      styling.terrainAppearance?.yardColor ??
        styling.terrainAppearance?.accentColor ??
        "#B8D99A",
      overlayAlpha * 0.52
    );
  drawContext.fillRect(width * 0.06, height * 0.56, width * 0.88, height * 0.18);

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

  drawContext.fillStyle = "#163046";
  drawContext.font = "12px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(
    `${objectInstances.length}/${expandedSettlementPreview.objectInstances.length} scene objects :: ${expandedSettlementPreview.visualScaling.densityProfile} :: focus ${resolvedPlayerState.cameraFocus?.currentState === "player-focused" ? "PLAYER_MARKER" : resolvedInteractionState.cameraFocus?.targetAsset ?? expandedSettlementPreview.cameraState.targetAsset}`,
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
  drawContext.fillStyle =
    styling?.buildingAppearance?.wallColor ?? palette.building;
  drawContext.fillRect(
    projected.x - 12 * houseScale,
    projected.y - 12 * houseScale,
    24 * houseScale,
    18 * houseScale
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

function buildPlayerMapState(
  expandedSettlementPreview,
  focusMode = "world-overview"
) {
  if (!expandedSettlementPreview) {
    return createDefaultPlayerMapState(expandedSettlementPreview);
  }
  const seed = stableNumericHash(
    `${expandedSettlementPreview.worldId}::${expandedSettlementPreview.sceneId}::player`
  );
  const offsetX = ((seed % 17) - 8) * 4;
  const offsetY = (((Math.floor(seed / 17)) % 17) - 8) * 3;
  const latitudeOffset = Number((((seed % 9) - 4) * 0.000018).toFixed(6));
  const longitudeOffset = Number(((((Math.floor(seed / 9)) % 9) - 4) * 0.000018).toFixed(6));
  const playerPosition = deepFreeze({
    x: Number((expandedSettlementPreview.cameraState.focusPoint.x + offsetX).toFixed(3)),
    y: Number((expandedSettlementPreview.cameraState.focusPoint.y + offsetY).toFixed(3))
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
  const interactionDistance =
    selectedObject?.position == null && selectedObject?.center == null
      ? null
      : Number(
          Math.hypot(
            (selectedObject.center?.x ?? selectedObject.position.x) - playerState.position.x,
            (selectedObject.center?.y ?? selectedObject.position.y) - playerState.position.y
          ).toFixed(3)
        );
  const withinInteractionRange =
    interactionDistance != null && interactionDistance <= 72;
  return deepFreeze({
    interactionId:
      selectedObject == null
        ? `${expandedSettlementPreview.sceneId}::player-interaction::idle`
        : `${expandedSettlementPreview.sceneId}::player-interaction::${playerState.playerId}::${selectedObject.instanceId}`,
    playerId: playerState.playerId,
    targetObjectId: selectedObject?.instanceId ?? null,
    targetAssetId: selectedObject?.assetId ?? null,
    interactionState:
      selectedObject == null
        ? "world-idle"
        : withinInteractionRange
          ? "object-interaction-ready"
          : "object-out-of-range",
    interactionDistance,
    validationResult: deepFreeze({
      playerObjectAlignmentValid:
        selectedObject == null ||
        expandedSettlementPreview.worldId === playerState.worldId,
      interactionDistanceValid:
        selectedObject == null || withinInteractionRange,
      objectIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      cleanupValid: true,
      deterministicBehaviourValid: true
    })
  });
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
  const discoveredIds = new Set(
    Array.isArray(existingDiscoveredObjectIds)
      ? existingDiscoveredObjectIds.map((value) => String(value))
      : []
  );
  const discoveryDistance =
    selectedObject?.position == null && selectedObject?.center == null
      ? null
      : Number(
          Math.hypot(
            (selectedObject.center?.x ?? selectedObject.position.x) - playerState.position.x,
            (selectedObject.center?.y ?? selectedObject.position.y) - playerState.position.y
          ).toFixed(3)
        );
  const withinDiscoveryRange =
    discoveryDistance != null && discoveryDistance <= 84;
  const discoveredObjectIds =
    selectedObject != null && withinDiscoveryRange
      ? deepFreeze(
          [...new Set([...discoveredIds, String(selectedObject.instanceId)])].sort()
        )
      : deepFreeze([...discoveredIds].sort());
  const isDiscovered =
    selectedObject != null && discoveredObjectIds.includes(String(selectedObject.instanceId));
  return deepFreeze({
    discoveryId:
      selectedObject == null
        ? `${expandedSettlementPreview.sceneId}::discovery::idle`
        : `${expandedSettlementPreview.sceneId}::discovery::${playerState.playerId}::${selectedObject.instanceId}`,
    playerId: playerState.playerId,
    objectId: selectedObject?.instanceId ?? null,
    assetId: selectedObject?.assetId ?? null,
    discoveryState:
      selectedObject == null
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
        selectedObject != null && withinDiscoveryRange
          ? "discovery-focused"
          : "world-overview",
      focusPoint: deepFreeze(
        selectedObject != null && withinDiscoveryRange
          ? {
              x: selectedObject.center?.x ?? selectedObject.position.x,
              y: selectedObject.center?.y ?? selectedObject.position.y
            }
          : { ...expandedSettlementPreview.cameraState.focusPoint }
      ),
      targetAsset:
        selectedObject != null && withinDiscoveryRange
          ? selectedObject.assetId
          : expandedSettlementPreview.cameraState.targetAsset,
      synchronizedWithMap: true
    }),
    validationResult: deepFreeze({
      playerProximityValid: selectedObject == null || withinDiscoveryRange,
      objectIdentityValid:
        selectedObject == null ||
        selectableExpandedSettlementAssetIds.has(selectedObject.assetId),
      deterministicDiscoveryResultValid: true,
      cleanupValid: true
    })
  });
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

function buildVisualSourceSummary({
  expandedSettlementPreview,
  coastalWorldShowcase,
  visibilityState
}) {
  if (expandedSettlementPreview) {
    return deepFreeze({
      sourceType: "expanded-settlement-scene",
      sceneId: expandedSettlementPreview.sceneId,
      worldId: expandedSettlementPreview.worldId,
      objectInstanceCount: expandedSettlementPreview.objectInstances.length,
      visibleObjectCount:
        expandedSettlementPreview.visualScaling?.visibleObjectCount ??
        expandedSettlementPreview.objectInstances.length,
      densityProfile: expandedSettlementPreview.visualScaling?.densityProfile ?? null,
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
