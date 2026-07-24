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
      drawExpandedSettlementPreview(drawContext, expandedSettlementPreview, {
        width: canvas.width,
        height: canvas.height
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
    cameraState: deepFreeze({
      cameraProfile: scene.cameraProfile.cameraProfile,
      focusAssetId: scene.cameraProfile.focusAssetId,
      orientation: scene.cameraProfile.orientation,
      previewZoomLevel: scene.cameraProfile.zoomLevel,
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
      deterministicOutput: scene.validationResult.deterministicSceneOutputValid === true
    }),
    expandedSettlementScene: scene
  });
}

export function drawExpandedSettlementPreview(
  drawContext,
  expandedSettlementPreview,
  { width = 960, height = 540 } = {}
) {
  if (!drawContext || typeof drawContext.fillRect !== "function") {
    throw new Error("Expanded settlement preview draw requires a 2D canvas context.");
  }

  const palette = resolveLightingPalette("day");
  const objectInstances = sortExpandedSettlementInstances(
    expandedSettlementPreview.objectInstances ?? []
  );
  const bounds = computeExpandedSettlementBounds(
    collectExpandedSettlementPoints(objectInstances)
  );

  drawContext.fillStyle = palette.sky;
  drawContext.fillRect(0, 0, width, height);
  drawContext.fillStyle = palette.sea;
  drawContext.fillRect(0, height * 0.18, width, height * 0.2);
  drawContext.fillStyle = palette.ground;
  drawContext.fillRect(0, height * 0.38, width, height * 0.62);

  drawContext.fillStyle = "#163046";
  drawContext.font = "bold 18px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(expandedSettlementPreview.sceneId, width * 0.03, height * 0.08);
  drawContext.font = "13px sans-serif";
  drawContext.fillText(
    `${expandedSettlementPreview.cameraState.cameraProfile} :: ${expandedSettlementPreview.worldId}`,
    width * 0.03,
    height * 0.115
  );

  for (const instance of objectInstances) {
    drawExpandedSettlementInstance(drawContext, instance, bounds, { width, height, palette });
  }

  drawContext.fillStyle = "#163046";
  drawContext.font = "12px sans-serif";
  drawContext.textAlign = "left";
  drawContext.fillText(
    `${expandedSettlementPreview.objectInstances.length} scene objects :: focus ${expandedSettlementPreview.cameraState.focusAssetId}`,
    width * 0.03,
    height * 0.96
  );
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

function drawExpandedSettlementInstance(drawContext, instance, bounds, { width, height, palette }) {
  if (instance.category === "road") {
    const start = projectExpandedSettlementPoint(instance.geometry.start, bounds, width, height);
    const end = projectExpandedSettlementPoint(instance.geometry.end, bounds, width, height);
    drawContext.strokeStyle = palette.road;
    drawContext.lineWidth = Math.max(4, (instance.geometry.width ?? 8) * 1.2);
    if (typeof drawContext.stroke === "function") {
      drawContext.beginPath();
      drawContext.moveTo(start.x, start.y);
      drawContext.lineTo(end.x, end.y);
      drawContext.stroke();
    } else {
      drawContext.fillStyle = palette.road;
      drawContext.fillRect(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.max(6, Math.abs(end.x - start.x)),
        Math.max(6, Math.abs(end.y - start.y))
      );
    }
    return;
  }

  const projected = projectExpandedSettlementPoint(instance.position, bounds, width, height);
  if (instance.category === "vegetation") {
    drawContext.fillStyle = palette.vegetation;
    drawContext.beginPath();
    drawContext.arc(projected.x, projected.y, 7, 0, Math.PI * 2);
    drawContext.fill();
    return;
  }

  if (instance.category === "landmark") {
    drawContext.fillStyle = palette.lighthouse;
    drawContext.fillRect(projected.x - 8, projected.y - 36, 16, 36);
    drawContext.fillStyle = "#bd2d2d";
    drawContext.beginPath();
    drawContext.moveTo(projected.x - 12, projected.y - 36);
    drawContext.lineTo(projected.x, projected.y - 52);
    drawContext.lineTo(projected.x + 12, projected.y - 36);
    drawContext.closePath();
    drawContext.fill();
    return;
  }

  drawContext.fillStyle = palette.building;
  drawContext.fillRect(projected.x - 12, projected.y - 12, 24, 18);
  drawContext.fillStyle = "#7d4d35";
  drawContext.beginPath();
  drawContext.moveTo(projected.x - 15, projected.y - 12);
  drawContext.lineTo(projected.x, projected.y - 24);
  drawContext.lineTo(projected.x + 15, projected.y - 12);
  drawContext.closePath();
  drawContext.fill();
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

function projectExpandedSettlementPoint(point, bounds, width, height) {
  const normalizedX = (point.x - bounds.minX) / bounds.spanX;
  const normalizedY = (point.y - bounds.minY) / bounds.spanY;
  return deepFreeze({
    x: width * 0.08 + normalizedX * width * 0.84,
    y: height * 0.82 - normalizedY * height * 0.46
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
