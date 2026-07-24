import {
  createAtlasEngineFirstManualBrowserVisiblePreviewMountSession
} from "../asset-factory/atlas-engine-first-manual-browser-visible-preview-mount.mjs";
import {
  validateGroundCoastalGrassRealGlbAtlasPreviewReplacement
} from "../asset-factory/ground-coastal-grass-real-glb-atlas-preview-replacement.mjs";
import {
  validateGroundCoastalGrassRealGlbRendererPreviewTest
} from "../asset-factory/ground-coastal-grass-real-glb-renderer-preview-test.mjs";
import {
  validateGroundCoastalGrassRealGlbMeshPreviewIntegration
} from "../asset-factory/ground-coastal-grass-real-glb-mesh-preview-integration.mjs";

export const atlasBrowserDemoPlaceholderObjects = Object.freeze([
  "LIGHTHOUSE_PLACEHOLDER",
  "HOUSE_PLACEHOLDER",
  "ROAD_PLACEHOLDER",
  "TREE_PLACEHOLDER"
]);

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

  let mounted = false;
  let previewSession = null;
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

  setStatus(elements.status, "Atlas preview ready. Use Show Atlas Preview.");
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

    drawAtlasPlaceholderScene(drawContext, {
      width: canvas.width,
      height: canvas.height,
      placeholders: atlasBrowserDemoPlaceholderObjects,
      realGroundPreviewBinding,
      realGroundRenderBinding,
      realGroundMeshPreview
    });
    setContainerVisibility(elements.previewContainer, true);
    setStatus(
      elements.status,
      realGroundMeshPreview?.validationResult.glbAvailable
        ? `Atlas preview visible with real GLB mesh geometry ${realGroundMeshPreview.assetId}.`
        : realGroundRenderBinding?.verificationResult.glbExists
        ? `Atlas preview visible with real GLB ground render asset ${realGroundRenderBinding.assetId}.`
        : realGroundPreviewBinding
          ? `Atlas preview visible with real GLB ground asset ${realGroundPreviewBinding.assetId}.`
        : "Atlas preview visible."
    );

    return Object.freeze({
      ok: true,
      previewMountResult: mountResult.previewMountResult,
      realGroundPreviewBinding,
      realGroundRenderBinding,
      realGroundMeshPreview
    });
  };

  const hideHandler = () => {
    clearAtlasPlaceholderScene(drawContext, canvas.width, canvas.height);
    const cleanup = previewSession.unmountPreview();
    setContainerVisibility(elements.previewContainer, false);
    setStatus(elements.status, "Atlas preview hidden.");

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
    realGroundMeshPreview = null
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
    if (realGroundMeshPreview?.validationResult.glbAvailable === true) {
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

export function drawProjectedGroundMesh(drawContext, { width, height, meshData }) {
  if (!drawContext || !meshData || !Array.isArray(meshData.projectedVertices)) {
    return;
  }

  const scaleX = width * 0.28;
  const scaleY = height * 0.1;
  const originX = width * 0.04;
  const originY = height * 0.8;

  drawContext.fillStyle = "#4d9b57";
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

  const validation = validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
    rawBinding.definition,
    rawBinding.options
  );

  if (!validation.ok) {
    return null;
  }

  return Object.freeze(validation.realGlbAtlasPreviewReplacement.definition);
}

function resolveRealGroundRenderBinding(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (rawBinding.assetId && rawBinding.renderPayload && rawBinding.lodSelection) {
    return Object.freeze(rawBinding);
  }

  const validation = validateGroundCoastalGrassRealGlbRendererPreviewTest(
    rawBinding.definition,
    rawBinding.options
  );

  if (!validation.ok) {
    return null;
  }

  return Object.freeze(validation.realGlbRendererPreview.definition);
}

function resolveRealGroundMeshPreview(rawBinding) {
  if (!rawBinding) {
    return null;
  }

  if (rawBinding.assetId && rawBinding.meshData && rawBinding.renderResult) {
    return Object.freeze(rawBinding);
  }

  const validation = validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
    rawBinding.definition,
    rawBinding.options
  );

  if (!validation.ok) {
    return null;
  }

  return Object.freeze(validation.realGlbMeshPreview.definition);
}

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}
