import {
  createCoastalStarterWorldRealAssetSceneAssembly
} from "./coastal-starter-world-real-asset-scene-assembly.mjs";
import {
  groundCoastalGrassMinimalGlbRuntimeLoaderDefinition,
  loadGroundCoastalGrassMinimalGlbRuntimeLoader
} from "./ground-coastal-grass-minimal-glb-runtime-loader.mjs";
import {
  createGroundCoastalGrassRealGlbMeshVisualRenderTest
} from "./ground-coastal-grass-real-glb-mesh-visual-render-test.mjs";
import {
  treeEucalyptusRuntimePreviewBindingDefinition,
  loadTreeEucalyptusRuntimePreviewBinding
} from "./tree-eucalyptus-runtime-preview-binding.mjs";
import {
  createTreeEucalyptusRealGlbMeshVisualRenderTest
} from "./tree-eucalyptus-real-glb-mesh-visual-render-test.mjs";
import {
  roadCoastalRuntimePreviewBindingDefinition,
  loadRoadCoastalRuntimePreviewBinding
} from "./road-coastal-runtime-preview-binding.mjs";
import {
  createRoadCoastalRealGlbMeshVisualRenderTest
} from "./road-coastal-real-glb-mesh-visual-render-test.mjs";
import {
  buildingCoastalCottageRuntimePreviewBindingDefinition,
  createBuildingCoastalCottageRuntimePreviewBinding,
  loadBuildingCoastalCottageRuntimePreviewBinding
} from "./building-coastal-cottage-runtime-preview-binding.mjs";
import {
  lighthouseIslandRockyRuntimePreviewBindingDefinition,
  createLighthouseIslandRockyRuntimePreviewBinding,
  loadLighthouseIslandRockyRuntimePreviewBinding
} from "./lighthouse-island-rocky-runtime-preview-binding.mjs";

export const coastalStarterWorldBrowserShowcaseRequiredFields = Object.freeze([
  "showcaseId",
  "sceneId",
  "worldId",
  "assetInstances",
  "cameraProfile",
  "lightingProfile",
  "displayState",
  "verificationResult"
]);

export const coastalStarterWorldBrowserShowcaseStates = Object.freeze([
  "created",
  "ready",
  "displaying",
  "hidden",
  "closed",
  "failed"
]);

const expectedAssetIds = Object.freeze([
  "GROUND_COASTAL_GRASS_001",
  "TREE_EUCALYPTUS_001",
  "ROAD_COASTAL_001",
  "BUILDING_COASTAL_COTTAGE_001",
  "LIGHTHOUSE_ISLAND_ROCKY_001"
]);

export async function createCoastalStarterWorldBrowserShowcase(options = {}) {
  const normalizedOptions = normalizeOptions(options);

  try {
    const scene = await createCoastalStarterWorldRealAssetSceneAssembly({
      existsSync: normalizedOptions.existsSync,
      loadArrayBuffer: normalizedOptions.loadArrayBuffer
    });
    const renderables = await buildRenderables(normalizedOptions);

    return deepFreeze({
      showcaseId: "COASTAL_STARTER_WORLD_BROWSER_SHOWCASE_001",
      sceneId: scene.sceneId,
      worldId: scene.worldId,
      assetInstances: scene.assetInstances,
      cameraProfile: scene.cameraProfile,
      lightingProfile: scene.lightingProfile,
      displayState: deepFreeze({
        currentState: "ready",
        allowedStates: coastalStarterWorldBrowserShowcaseStates,
        manualActivationOnly: true,
        fallbackEnabled: true
      }),
      verificationResult: deepFreeze({
        assetReferencesValid: scene.validationResult.assetReferencesValid,
        glbAvailabilityValid: scene.validationResult.glbAvailabilityValid,
        placementDataValid: scene.validationResult.placementDataValid,
        cameraMetadataValid: scene.validationResult.cameraMetadataValid,
        lightingMetadataValid: scene.validationResult.lightingMetadataValid,
        allFiveAssetsPresent: true,
        realGlbBackedSceneValid: scene.validationResult.realGlbBackedAssetsValid
      }),
      renderables
    });
  } catch (error) {
    if (!normalizedOptions.allowFallbackShowcase) {
      throw error;
    }
    return createFallbackCoastalStarterWorldBrowserShowcase();
  }
}

export function validateCoastalStarterWorldBrowserShowcase(rawShowcase) {
  try {
    const showcase = normalizeShowcase(rawShowcase);

    const assetIds = showcase.assetInstances.map((assetInstance) => assetInstance.assetId);
    for (const expectedAssetId of expectedAssetIds) {
      if (!assetIds.includes(expectedAssetId)) {
        throw createValidationError(
          "missing_asset_instance",
          `Coastal starter world browser showcase is missing ${expectedAssetId}.`
        );
      }
    }

    if (!showcase.verificationResult.assetReferencesValid) {
      throw createValidationError(
        "asset_references_invalid",
        "Coastal starter world browser showcase assetReferencesValid must be true."
      );
    }
    if (!showcase.verificationResult.placementDataValid) {
      throw createValidationError(
        "placement_data_invalid",
        "Coastal starter world browser showcase placementDataValid must be true."
      );
    }
    if (!showcase.verificationResult.cameraMetadataValid) {
      throw createValidationError(
        "camera_metadata_invalid",
        "Coastal starter world browser showcase cameraMetadataValid must be true."
      );
    }
    if (!showcase.verificationResult.lightingMetadataValid) {
      throw createValidationError(
        "lighting_metadata_invalid",
        "Coastal starter world browser showcase lightingMetadataValid must be true."
      );
    }
    if (!showcase.verificationResult.allFiveAssetsPresent) {
      throw createValidationError(
        "asset_count_invalid",
        "Coastal starter world browser showcase allFiveAssetsPresent must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      coastalStarterWorldBrowserShowcase: Object.freeze({
        showcase
      })
    });
  } catch (error) {
    if (error?.name !== "CoastalStarterWorldBrowserShowcaseValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      coastalStarterWorldBrowserShowcase: null
    });
  }
}

async function buildRenderables(options) {
  const groundRuntimeResult = await loadGroundCoastalGrassMinimalGlbRuntimeLoader(
    options.groundRuntimeLoaderDefinition,
    options.loaderOptions
  );
  const treeRuntimeResult = await loadTreeEucalyptusRuntimePreviewBinding(
    options.treeRuntimeBindingDefinition,
    options.loaderOptions
  );
  const roadRuntimeResult = await loadRoadCoastalRuntimePreviewBinding(
    options.roadRuntimeBindingDefinition,
    options.loaderOptions
  );
  const cottageRuntimeResult = await loadBuildingCoastalCottageRuntimePreviewBinding(
    options.cottageRuntimeBindingDefinition,
    options.loaderOptions
  );
  const lighthouseRuntimeResult = await loadLighthouseIslandRockyRuntimePreviewBinding(
    options.lighthouseRuntimeBindingDefinition,
    options.loaderOptions
  );

  if (
    !groundRuntimeResult.ok ||
    !treeRuntimeResult.ok ||
    !roadRuntimeResult.ok ||
    !cottageRuntimeResult.ok ||
    !lighthouseRuntimeResult.ok
  ) {
    throw createValidationError(
      "runtime_loading_failed",
      "Coastal starter world browser showcase could not load all real GLB-backed renderables."
    );
  }

  const groundVisual = createGroundCoastalGrassRealGlbMeshVisualRenderTest(
    groundRuntimeResult.glbRuntimeLoader.definition
  );
  const treeVisual = createTreeEucalyptusRealGlbMeshVisualRenderTest(
    treeRuntimeResult.runtimePreviewBinding.definition
  );
  const roadVisual = createRoadCoastalRealGlbMeshVisualRenderTest(
    roadRuntimeResult.runtimePreviewBinding.definition
  );

  return deepFreeze([
    createVisualRenderable(groundVisual, "GROUND_COASTAL_GRASS_001"),
    createVisualRenderable(treeVisual, "TREE_EUCALYPTUS_001"),
    createVisualRenderable(roadVisual, "ROAD_COASTAL_001"),
    createRuntimeRenderable(
      cottageRuntimeResult.runtimePreviewBinding.definition,
      "BUILDING_COASTAL_COTTAGE_001"
    ),
    createRuntimeRenderable(
      lighthouseRuntimeResult.runtimePreviewBinding.definition,
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    )
  ]);
}

function createVisualRenderable(visualDefinition, assetId) {
  return deepFreeze({
    assetId,
    projectedVertices: deepFreeze(
      visualDefinition.geometryPayload.projectedVertices.map((vertex) => ({ ...vertex }))
    ),
    primaryMaterial:
      visualDefinition.materialPayload.primaryMaterial ?? `${assetId}_PRIMARY_MATERIAL`,
    rendererProfile: visualDefinition.renderState.rendererProfile,
    actualGlbBacked: visualDefinition.verificationResult.actualGlbGeometryRendered === true,
    appearanceProfiles: deepFreeze(["day", "sunset", "night"])
  });
}

function createRuntimeRenderable(runtimeDefinition, assetId) {
  return deepFreeze({
    assetId,
    projectedVertices: deepFreeze(
      runtimeDefinition.meshResult.projectedVertices.map((vertex) => ({ ...vertex }))
    ),
    primaryMaterial:
      runtimeDefinition.materialResult.materialNames[0] ?? `${assetId}_PRIMARY_MATERIAL`,
    rendererProfile: runtimeDefinition.renderResult.rendererProfile,
    actualGlbBacked: runtimeDefinition.validationResult.meshExtracted === true,
    appearanceProfiles: deepFreeze(
      runtimeDefinition.lighthouseMetadata?.supportedAppearanceProfiles ?? ["day", "sunset", "night"]
    )
  });
}

function createFallbackCoastalStarterWorldBrowserShowcase() {
  const assetInstances = deepFreeze([
    deepFreeze({
      assetId: "GROUND_COASTAL_GRASS_001",
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      orientationMode: "north-up"
    }),
    deepFreeze({
      assetId: "TREE_EUCALYPTUS_001",
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      orientationMode: "north-up"
    }),
    deepFreeze({
      assetId: "ROAD_COASTAL_001",
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      orientationMode: "north-up"
    }),
    deepFreeze({
      assetId: "BUILDING_COASTAL_COTTAGE_001",
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      orientationMode: "road-facing"
    }),
    deepFreeze({
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      appearanceProfiles: deepFreeze(["day", "sunset", "night"]),
      orientationMode: "viewpoint-focus"
    })
  ]);

  return deepFreeze({
    showcaseId: "COASTAL_STARTER_WORLD_BROWSER_SHOWCASE_001",
    sceneId: "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001",
    worldId: "COASTAL_STARTER_WORLD_001",
    assetInstances,
    cameraProfile: deepFreeze({
      cameraProfile: "coastal-overlook",
      focusAssetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      orientation: "north-up",
      viewpointMode: "lighthouse-focus",
      zoomLevel: 1.22
    }),
    lightingProfile: deepFreeze({
      activeProfile: "day",
      supportedProfiles: deepFreeze(["day", "sunset", "night"]),
      deterministicProfileOrder: deepFreeze(["day", "sunset", "night"])
    }),
    displayState: deepFreeze({
      currentState: "ready",
      allowedStates: coastalStarterWorldBrowserShowcaseStates,
      manualActivationOnly: true,
      fallbackEnabled: true
    }),
    verificationResult: deepFreeze({
      assetReferencesValid: true,
      glbAvailabilityValid: false,
      placementDataValid: true,
      cameraMetadataValid: true,
      lightingMetadataValid: true,
      allFiveAssetsPresent: true,
      realGlbBackedSceneValid: false
    }),
    renderables: deepFreeze([
      buildFallbackRenderable("GROUND_COASTAL_GRASS_001", [
        { x: 0.0, y: 0.28 },
        { x: 0.28, y: 0.08 },
        { x: 0.72, y: 0.12 },
        { x: 1.0, y: 0.3 }
      ]),
      buildFallbackRenderable("TREE_EUCALYPTUS_001", [
        { x: 0.5, y: 0.08 },
        { x: 0.46, y: 0.42 },
        { x: 0.38, y: 0.8 },
        { x: 0.18, y: 1.0 },
        { x: 0.62, y: 0.92 },
        { x: 0.82, y: 0.72 }
      ]),
      buildFallbackRenderable("ROAD_COASTAL_001", [
        { x: 0.0, y: 0.18 },
        { x: 0.0, y: 0.36 },
        { x: 1.0, y: 0.34 },
        { x: 1.0, y: 0.16 }
      ]),
      buildFallbackRenderable("BUILDING_COASTAL_COTTAGE_001", [
        { x: 0.18, y: 0.12 },
        { x: 0.18, y: 0.78 },
        { x: 0.34, y: 0.96 },
        { x: 0.5, y: 0.84 },
        { x: 0.66, y: 0.96 },
        { x: 0.82, y: 0.78 },
        { x: 0.82, y: 0.18 },
        { x: 0.62, y: 0.18 },
        { x: 0.62, y: 0.04 },
        { x: 0.38, y: 0.04 },
        { x: 0.38, y: 0.18 }
      ]),
      buildFallbackRenderable("LIGHTHOUSE_ISLAND_ROCKY_001", [
        { x: 0.5, y: 0.02 },
        { x: 0.32, y: 0.08 },
        { x: 0.22, y: 0.22 },
        { x: 0.3, y: 0.38 },
        { x: 0.4, y: 0.8 },
        { x: 0.4, y: 0.92 },
        { x: 0.46, y: 1.0 },
        { x: 0.54, y: 1.0 },
        { x: 0.6, y: 0.92 },
        { x: 0.6, y: 0.8 },
        { x: 0.7, y: 0.38 },
        { x: 0.78, y: 0.22 },
        { x: 0.68, y: 0.08 }
      ])
    ])
  });
}

function buildFallbackRenderable(assetId, projectedVertices) {
  return deepFreeze({
    assetId,
    projectedVertices: deepFreeze(projectedVertices.map((vertex) => ({ ...vertex }))),
    primaryMaterial: `${assetId}_PRIMARY_MATERIAL`,
    rendererProfile: "custom-2.5d-passive",
    actualGlbBacked: false,
    appearanceProfiles: deepFreeze(["day", "sunset", "night"])
  });
}

function normalizeOptions(options) {
  const existsSync =
    typeof options.existsSync === "function" ? options.existsSync : () => false;
  const loadArrayBuffer =
    typeof options.loadArrayBuffer === "function"
      ? options.loadArrayBuffer
      : async () => new ArrayBuffer(0);

  return Object.freeze({
    existsSync,
    loadArrayBuffer,
    allowFallbackShowcase: options.allowFallbackShowcase !== false,
    groundRuntimeLoaderDefinition:
      options.groundRuntimeLoaderDefinition ??
      groundCoastalGrassMinimalGlbRuntimeLoaderDefinition,
    treeRuntimeBindingDefinition:
      options.treeRuntimeBindingDefinition ??
      treeEucalyptusRuntimePreviewBindingDefinition,
    roadRuntimeBindingDefinition:
      options.roadRuntimeBindingDefinition ?? roadCoastalRuntimePreviewBindingDefinition,
    cottageRuntimeBindingDefinition:
      options.cottageRuntimeBindingDefinition ??
      buildingCoastalCottageRuntimePreviewBindingDefinition,
    lighthouseRuntimeBindingDefinition:
      options.lighthouseRuntimeBindingDefinition ??
      lighthouseIslandRockyRuntimePreviewBindingDefinition,
    loaderOptions: Object.freeze({
      existsSync,
      loadArrayBuffer
    })
  });
}

function normalizeShowcase(rawShowcase) {
  const showcase = asPlainObject(rawShowcase, "coastalStarterWorldBrowserShowcase");
  for (const fieldName of coastalStarterWorldBrowserShowcaseRequiredFields) {
    if (!(fieldName in showcase)) {
      throw createValidationError(
        "missing_required_field",
        `Coastal starter world browser showcase is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    showcaseId: normalizeString(showcase.showcaseId, "showcaseId"),
    sceneId: normalizeString(showcase.sceneId, "sceneId"),
    worldId: normalizeString(showcase.worldId, "worldId"),
    assetInstances: deepFreeze(
      (Array.isArray(showcase.assetInstances) ? showcase.assetInstances : []).map(
        (assetInstance, index) =>
          deepFreeze({
            assetId: normalizeString(
              assetInstance.assetId,
              `assetInstances[${index}].assetId`
            ),
            appearanceProfiles: deepFreeze(
              (Array.isArray(assetInstance.appearanceProfiles)
                ? assetInstance.appearanceProfiles
                : []
              ).map((profile, profileIndex) =>
                normalizeString(
                  profile,
                  `assetInstances[${index}].appearanceProfiles[${profileIndex}]`
                )
              )
            ),
            orientationMode: normalizeString(
              assetInstance.orientationMode,
              `assetInstances[${index}].orientationMode`
            )
          })
      )
    ),
    cameraProfile: deepFreeze({
      cameraProfile: normalizeString(showcase.cameraProfile.cameraProfile, "cameraProfile.cameraProfile"),
      focusAssetId: normalizeString(showcase.cameraProfile.focusAssetId, "cameraProfile.focusAssetId"),
      orientation: normalizeString(showcase.cameraProfile.orientation, "cameraProfile.orientation"),
      viewpointMode: normalizeString(showcase.cameraProfile.viewpointMode, "cameraProfile.viewpointMode"),
      zoomLevel: Number(showcase.cameraProfile.zoomLevel)
    }),
    lightingProfile: deepFreeze({
      activeProfile: normalizeString(showcase.lightingProfile.activeProfile, "lightingProfile.activeProfile"),
      supportedProfiles: deepFreeze(
        (Array.isArray(showcase.lightingProfile.supportedProfiles)
          ? showcase.lightingProfile.supportedProfiles
          : []
        ).map((profile, profileIndex) =>
          normalizeString(profile, `lightingProfile.supportedProfiles[${profileIndex}]`)
        )
      ),
      deterministicProfileOrder: deepFreeze(
        (Array.isArray(showcase.lightingProfile.deterministicProfileOrder)
          ? showcase.lightingProfile.deterministicProfileOrder
          : []
        ).map((profile, profileIndex) =>
          normalizeString(
            profile,
            `lightingProfile.deterministicProfileOrder[${profileIndex}]`
          )
        )
      )
    }),
    displayState: deepFreeze({
      currentState: normalizeString(showcase.displayState.currentState, "displayState.currentState"),
      allowedStates: deepFreeze(
        (Array.isArray(showcase.displayState.allowedStates)
          ? showcase.displayState.allowedStates
          : []
        ).map((state, stateIndex) =>
          normalizeString(state, `displayState.allowedStates[${stateIndex}]`)
        )
      ),
      manualActivationOnly: Boolean(showcase.displayState.manualActivationOnly),
      fallbackEnabled: Boolean(showcase.displayState.fallbackEnabled)
    }),
    verificationResult: deepFreeze({
      assetReferencesValid: Boolean(showcase.verificationResult.assetReferencesValid),
      glbAvailabilityValid: Boolean(showcase.verificationResult.glbAvailabilityValid),
      placementDataValid: Boolean(showcase.verificationResult.placementDataValid),
      cameraMetadataValid: Boolean(showcase.verificationResult.cameraMetadataValid),
      lightingMetadataValid: Boolean(showcase.verificationResult.lightingMetadataValid),
      allFiveAssetsPresent: Boolean(showcase.verificationResult.allFiveAssetsPresent),
      realGlbBackedSceneValid: Boolean(showcase.verificationResult.realGlbBackedSceneValid)
    }),
    renderables: deepFreeze(
      (Array.isArray(showcase.renderables) ? showcase.renderables : []).map(
        (renderable, renderableIndex) =>
          deepFreeze({
            assetId: normalizeString(renderable.assetId, `renderables[${renderableIndex}].assetId`),
            projectedVertices: deepFreeze(
              (Array.isArray(renderable.projectedVertices)
                ? renderable.projectedVertices
                : []
              ).map((vertex, vertexIndex) =>
                deepFreeze({
                  x: Number(vertex.x),
                  y: Number(vertex.y)
                })
              )
            ),
            primaryMaterial: normalizeString(
              renderable.primaryMaterial,
              `renderables[${renderableIndex}].primaryMaterial`
            ),
            rendererProfile: normalizeString(
              renderable.rendererProfile,
              `renderables[${renderableIndex}].rendererProfile`
            ),
            actualGlbBacked: Boolean(renderable.actualGlbBacked),
            appearanceProfiles: deepFreeze(
              (Array.isArray(renderable.appearanceProfiles)
                ? renderable.appearanceProfiles
                : []
              ).map((profile, profileIndex) =>
                normalizeString(
                  profile,
                  `renderables[${renderableIndex}].appearanceProfiles[${profileIndex}]`
                )
              )
            )
          })
      )
    )
  });
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "CoastalStarterWorldBrowserShowcaseValidationError"
  });
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
