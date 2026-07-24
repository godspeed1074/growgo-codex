import {
  createGroundCoastalGrassRealGlbMeshVisualRenderTest
} from "./ground-coastal-grass-real-glb-mesh-visual-render-test.mjs";
import {
  groundCoastalGrassMinimalGlbRuntimeLoaderDefinition,
  loadGroundCoastalGrassMinimalGlbRuntimeLoader
} from "./ground-coastal-grass-minimal-glb-runtime-loader.mjs";
import {
  createTreeEucalyptusRealGlbMeshVisualRenderTest
} from "./tree-eucalyptus-real-glb-mesh-visual-render-test.mjs";
import {
  loadTreeEucalyptusRuntimePreviewBinding,
  treeEucalyptusRuntimePreviewBindingDefinition
} from "./tree-eucalyptus-runtime-preview-binding.mjs";
import {
  createRoadCoastalRealGlbMeshVisualRenderTest
} from "./road-coastal-real-glb-mesh-visual-render-test.mjs";
import {
  loadRoadCoastalRuntimePreviewBinding,
  roadCoastalRuntimePreviewBindingDefinition
} from "./road-coastal-runtime-preview-binding.mjs";
import {
  buildingCoastalCottageRuntimePreviewBindingDefinition,
  loadBuildingCoastalCottageRuntimePreviewBinding
} from "./building-coastal-cottage-runtime-preview-binding.mjs";
import {
  lighthouseIslandRockyRuntimePreviewBindingDefinition,
  loadLighthouseIslandRockyRuntimePreviewBinding
} from "./lighthouse-island-rocky-runtime-preview-binding.mjs";

export const coastalStarterWorldRealAssetSceneAssemblyRequiredFields =
  Object.freeze([
    "sceneId",
    "worldId",
    "assetInstances",
    "placements",
    "cameraProfile",
    "lightingProfile",
    "validationResult"
  ]);

const supportedLightingProfiles = Object.freeze(["day", "sunset", "night"]);
const supportedCameraProfiles = Object.freeze(["coastal-overlook"]);
const supportedFacingModes = Object.freeze(["north-up", "road-facing", "viewpoint-focus"]);

export async function createCoastalStarterWorldRealAssetSceneAssembly(options = {}) {
  const assetRuntime = await loadAssetRuntime(options);
  const assetInstances = buildAssetInstances(assetRuntime);
  const placements = buildPlacements(assetInstances);
  const cameraProfile = buildCameraProfile();
  const lightingProfile = buildLightingProfile();

  const scene = deepFreeze({
    sceneId: "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001",
    worldId: "COASTAL_STARTER_WORLD_001",
    assetInstances,
    placements,
    cameraProfile,
    lightingProfile,
    validationResult: buildValidationResult(
      assetInstances,
      placements,
      cameraProfile,
      lightingProfile
    )
  });

  const validation = validateCoastalStarterWorldRealAssetSceneAssembly(scene);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return scene;
}

export function validateCoastalStarterWorldRealAssetSceneAssembly(rawScene) {
  try {
    const scene = normalizeScene(rawScene);

    if (scene.assetInstances.length !== 5) {
      throw createValidationError(
        "asset_count_invalid",
        "Coastal starter world real asset scene assembly must include exactly five asset instances."
      );
    }

    const expectedAssetOrder = [
      "GROUND_COASTAL_GRASS_001",
      "TREE_EUCALYPTUS_001",
      "ROAD_COASTAL_001",
      "BUILDING_COASTAL_COTTAGE_001",
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    ];

    const assetIds = scene.assetInstances.map((assetInstance) => assetInstance.assetId);
    for (const expectedAssetId of expectedAssetOrder) {
      if (!assetIds.includes(expectedAssetId)) {
        throw createValidationError(
          "missing_asset_instance",
          `Coastal starter world real asset scene assembly is missing ${expectedAssetId}.`
        );
      }
    }

    if (!scene.validationResult.assetReferencesValid) {
      throw createValidationError(
        "asset_references_invalid",
        "Coastal starter world real asset scene assembly assetReferencesValid must be true."
      );
    }
    if (!scene.validationResult.glbAvailabilityValid) {
      throw createValidationError(
        "glb_availability_invalid",
        "Coastal starter world real asset scene assembly glbAvailabilityValid must be true."
      );
    }
    if (!scene.validationResult.placementDataValid) {
      throw createValidationError(
        "placement_data_invalid",
        "Coastal starter world real asset scene assembly placementDataValid must be true."
      );
    }
    if (!scene.validationResult.cameraMetadataValid) {
      throw createValidationError(
        "camera_metadata_invalid",
        "Coastal starter world real asset scene assembly cameraMetadataValid must be true."
      );
    }
    if (!scene.validationResult.lightingMetadataValid) {
      throw createValidationError(
        "lighting_metadata_invalid",
        "Coastal starter world real asset scene assembly lightingMetadataValid must be true."
      );
    }
    if (!scene.validationResult.realGlbBackedAssetsValid) {
      throw createValidationError(
        "real_glb_backing_invalid",
        "Coastal starter world real asset scene assembly realGlbBackedAssetsValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      realAssetSceneAssembly: Object.freeze({
        scene
      })
    });
  } catch (error) {
    if (error?.name !== "CoastalStarterWorldRealAssetSceneAssemblyValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      realAssetSceneAssembly: null
    });
  }
}

async function loadAssetRuntime(options) {
  const normalizedOptions = normalizeOptions(options);

  const groundRuntimeResult = await loadGroundCoastalGrassMinimalGlbRuntimeLoader(
    normalizedOptions.groundRuntimeLoaderDefinition,
    normalizedOptions.loaderOptions
  );
  if (!groundRuntimeResult.ok) {
    throw createValidationError(
      groundRuntimeResult.errorCode ?? "ground_runtime_invalid",
      groundRuntimeResult.message ??
        "Ground coastal grass runtime loader failed during real scene assembly."
    );
  }

  const treeRuntimeResult = await loadTreeEucalyptusRuntimePreviewBinding(
    normalizedOptions.treeRuntimeBindingDefinition,
    normalizedOptions.loaderOptions
  );
  if (!treeRuntimeResult.ok) {
    throw createValidationError(
      treeRuntimeResult.errorCode ?? "tree_runtime_invalid",
      treeRuntimeResult.message ??
        "Tree eucalyptus runtime binding failed during real scene assembly."
    );
  }

  const roadRuntimeResult = await loadRoadCoastalRuntimePreviewBinding(
    normalizedOptions.roadRuntimeBindingDefinition,
    normalizedOptions.loaderOptions
  );
  if (!roadRuntimeResult.ok) {
    throw createValidationError(
      roadRuntimeResult.errorCode ?? "road_runtime_invalid",
      roadRuntimeResult.message ??
        "Road coastal runtime binding failed during real scene assembly."
    );
  }

  const cottageRuntimeResult =
    await loadBuildingCoastalCottageRuntimePreviewBinding(
      normalizedOptions.cottageRuntimeBindingDefinition,
      normalizedOptions.loaderOptions
    );
  if (!cottageRuntimeResult.ok) {
    throw createValidationError(
      cottageRuntimeResult.errorCode ?? "cottage_runtime_invalid",
      cottageRuntimeResult.message ??
        "Building coastal cottage runtime binding failed during real scene assembly."
    );
  }

  const lighthouseRuntimeResult =
    await loadLighthouseIslandRockyRuntimePreviewBinding(
      normalizedOptions.lighthouseRuntimeBindingDefinition,
      normalizedOptions.loaderOptions
    );
  if (!lighthouseRuntimeResult.ok) {
    throw createValidationError(
      lighthouseRuntimeResult.errorCode ?? "lighthouse_runtime_invalid",
      lighthouseRuntimeResult.message ??
        "Lighthouse runtime binding failed during real scene assembly."
    );
  }

  return Object.freeze({
    groundRuntimeDefinition: groundRuntimeResult.glbRuntimeLoader.definition,
    groundRealGlbVisual:
      createGroundCoastalGrassRealGlbMeshVisualRenderTest(
        groundRuntimeResult.glbRuntimeLoader.definition
      ),
    treeRuntimeDefinition: treeRuntimeResult.runtimePreviewBinding.definition,
    treeRealGlbVisual: createTreeEucalyptusRealGlbMeshVisualRenderTest(
      treeRuntimeResult.runtimePreviewBinding.definition
    ),
    roadRuntimeDefinition: roadRuntimeResult.runtimePreviewBinding.definition,
    roadRealGlbVisual: createRoadCoastalRealGlbMeshVisualRenderTest(
      roadRuntimeResult.runtimePreviewBinding.definition
    ),
    cottageRuntimeDefinition: cottageRuntimeResult.runtimePreviewBinding.definition,
    lighthouseRuntimeDefinition: lighthouseRuntimeResult.runtimePreviewBinding.definition
  });
}

function buildAssetInstances(assetRuntime) {
  return deepFreeze([
    createVisualAssetInstance(
      assetRuntime.groundRealGlbVisual,
      assetRuntime.groundRuntimeDefinition.glbReference.glbPath,
      {
        appearanceProfiles: ["day", "sunset", "night"],
        orientationMode: "north-up"
      }
    ),
    createVisualAssetInstance(
      assetRuntime.treeRealGlbVisual,
      assetRuntime.treeRuntimeDefinition.glbReference.glbPath,
      {
        appearanceProfiles: ["day", "sunset", "night"],
        orientationMode: "north-up"
      }
    ),
    createVisualAssetInstance(
      assetRuntime.roadRealGlbVisual,
      assetRuntime.roadRuntimeDefinition.glbReference.glbPath,
      {
        appearanceProfiles: ["day", "sunset", "night"],
        orientationMode: "north-up"
      }
    ),
    createRuntimeAssetInstance(assetRuntime.cottageRuntimeDefinition, {
      appearanceProfiles: ["day", "sunset", "night"],
      orientationMode: "road-facing"
    }),
    createRuntimeAssetInstance(assetRuntime.lighthouseRuntimeDefinition, {
      appearanceProfiles: assetRuntime.lighthouseRuntimeDefinition.lighthouseMetadata
        .supportedAppearanceProfiles,
      orientationMode: "viewpoint-focus",
      viewpointValue:
        assetRuntime.lighthouseRuntimeDefinition.lighthouseMetadata.viewpointValue,
      questEligibility:
        assetRuntime.lighthouseRuntimeDefinition.lighthouseMetadata.questEligibility,
      captureEligibility:
        assetRuntime.lighthouseRuntimeDefinition.lighthouseMetadata.captureEligibility,
      landmarkEligibility:
        assetRuntime.lighthouseRuntimeDefinition.lighthouseMetadata.landmarkEligibility
    })
  ]);
}

function createVisualAssetInstance(visualDefinition, glbPath, metadata = {}) {
  return deepFreeze({
    assetId: visualDefinition.assetId,
    sourceType: "real-glb-mesh-visual-render-test",
    glbPath,
    rendererProfile: visualDefinition.renderState.rendererProfile,
    materialNames: [...visualDefinition.materialPayload.materialNames],
    meshVertexCount: visualDefinition.geometryPayload.vertexCount,
    primitiveCount: visualDefinition.geometryPayload.primitiveCount,
    actualGlbBacked: visualDefinition.verificationResult.actualGlbGeometryRendered === true,
    appearanceProfiles: deepFreeze([...(metadata.appearanceProfiles ?? ["day"])]),
    orientationMode: metadata.orientationMode ?? "north-up"
  });
}

function createRuntimeAssetInstance(runtimeDefinition, metadata = {}) {
  return deepFreeze({
    assetId: runtimeDefinition.assetId,
    sourceType: "runtime-preview-binding",
    glbPath: runtimeDefinition.glbReference.glbPath,
    rendererProfile: runtimeDefinition.renderResult.rendererProfile,
    materialNames: [...runtimeDefinition.materialResult.materialNames],
    meshVertexCount: runtimeDefinition.meshResult.vertexCount,
    primitiveCount: runtimeDefinition.meshResult.primitiveCount,
    actualGlbBacked: runtimeDefinition.validationResult.meshExtracted === true,
    appearanceProfiles: deepFreeze([...(metadata.appearanceProfiles ?? ["day"])]),
    orientationMode: metadata.orientationMode ?? "north-up",
    viewpointValue: metadata.viewpointValue ?? null,
    questEligibility: metadata.questEligibility ?? null,
    captureEligibility: metadata.captureEligibility ?? null,
    landmarkEligibility: metadata.landmarkEligibility ?? null
  });
}

function buildPlacements(assetInstances) {
  const placementByAssetId = {
    GROUND_COASTAL_GRASS_001: {
      x: 0,
      y: 0,
      z: 0,
      headingDegrees: 0,
      facingMode: "north-up"
    },
    TREE_EUCALYPTUS_001: {
      x: -18,
      y: 26,
      z: 0,
      headingDegrees: 0,
      facingMode: "north-up"
    },
    ROAD_COASTAL_001: {
      x: 0,
      y: -18,
      z: 0,
      headingDegrees: 0,
      facingMode: "north-up"
    },
    BUILDING_COASTAL_COTTAGE_001: {
      x: 22,
      y: -8,
      z: 0,
      headingDegrees: 180,
      facingMode: "road-facing"
    },
    LIGHTHOUSE_ISLAND_ROCKY_001: {
      x: 48,
      y: 34,
      z: 0,
      headingDegrees: 0,
      facingMode: "viewpoint-focus"
    }
  };

  return deepFreeze(
    assetInstances.map((assetInstance, index) =>
      deepFreeze({
        placementId: `COASTAL_SHOWCASE_PLACEMENT_${String(index + 1).padStart(3, "0")}`,
        assetId: assetInstance.assetId,
        ...placementByAssetId[assetInstance.assetId],
        deterministicPlacementKey: `${assetInstance.assetId}:${placementByAssetId[assetInstance.assetId].x}:${placementByAssetId[assetInstance.assetId].y}:${placementByAssetId[assetInstance.assetId].headingDegrees}`
      })
    )
  );
}

function buildCameraProfile() {
  return deepFreeze({
    cameraProfile: "coastal-overlook",
    focusAssetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    orientation: "north-up",
    viewpointMode: "lighthouse-focus",
    zoomLevel: 1.22
  });
}

function buildLightingProfile() {
  return deepFreeze({
    activeProfile: "day",
    supportedProfiles: ["day", "sunset", "night"],
    deterministicProfileOrder: ["day", "sunset", "night"]
  });
}

function buildValidationResult(assetInstances, placements, cameraProfile, lightingProfile) {
  const assetReferencesValid = assetInstances.every(
    (assetInstance) => typeof assetInstance.assetId === "string" && assetInstance.assetId
  );
  const glbAvailabilityValid = assetInstances.every(
    (assetInstance) => typeof assetInstance.glbPath === "string" && assetInstance.actualGlbBacked
  );
  const placementDataValid =
    placements.length === assetInstances.length &&
    placements.every(
      (placement) =>
        typeof placement.assetId === "string" &&
        typeof placement.headingDegrees === "number" &&
        supportedFacingModes.includes(placement.facingMode)
    );
  const cameraMetadataValid =
    supportedCameraProfiles.includes(cameraProfile.cameraProfile) &&
    cameraProfile.focusAssetId === "LIGHTHOUSE_ISLAND_ROCKY_001" &&
    cameraProfile.orientation === "north-up";
  const lightingMetadataValid =
    supportedLightingProfiles.every((profile) =>
      lightingProfile.supportedProfiles.includes(profile)
    ) && lightingProfile.activeProfile === "day";

  return deepFreeze({
    assetReferencesValid,
    glbAvailabilityValid,
    placementDataValid,
    cameraMetadataValid,
    lightingMetadataValid,
    realGlbBackedAssetsValid: assetInstances.every(
      (assetInstance) => assetInstance.actualGlbBacked === true
    )
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

function normalizeScene(rawScene) {
  const scene = asPlainObject(rawScene, "coastalStarterWorldRealAssetSceneAssembly");
  for (const fieldName of coastalStarterWorldRealAssetSceneAssemblyRequiredFields) {
    if (!(fieldName in scene)) {
      throw createValidationError(
        "missing_required_field",
        `Coastal starter world real asset scene assembly is missing ${fieldName}.`
      );
    }
  }

  const assetInstances = Array.isArray(scene.assetInstances)
    ? scene.assetInstances.map((assetInstance, index) =>
        normalizeAssetInstance(assetInstance, index)
      )
    : [];
  const placements = Array.isArray(scene.placements)
    ? scene.placements.map((placement, index) => normalizePlacement(placement, index))
    : [];

  const cameraProfile = asPlainObject(scene.cameraProfile, "cameraProfile");
  const lightingProfile = asPlainObject(scene.lightingProfile, "lightingProfile");
  const validationResult = asPlainObject(scene.validationResult, "validationResult");

  return deepFreeze({
    sceneId: normalizeString(scene.sceneId, "sceneId"),
    worldId: normalizeString(scene.worldId, "worldId"),
    assetInstances: deepFreeze(assetInstances),
    placements: deepFreeze(placements),
    cameraProfile: deepFreeze({
      cameraProfile: normalizeString(cameraProfile.cameraProfile, "cameraProfile.cameraProfile"),
      focusAssetId: normalizeString(cameraProfile.focusAssetId, "cameraProfile.focusAssetId"),
      orientation: normalizeString(cameraProfile.orientation, "cameraProfile.orientation"),
      viewpointMode: normalizeString(
        cameraProfile.viewpointMode,
        "cameraProfile.viewpointMode"
      ),
      zoomLevel: Number(cameraProfile.zoomLevel)
    }),
    lightingProfile: deepFreeze({
      activeProfile: normalizeString(
        lightingProfile.activeProfile,
        "lightingProfile.activeProfile"
      ),
      supportedProfiles: deepFreeze(
        (Array.isArray(lightingProfile.supportedProfiles)
          ? lightingProfile.supportedProfiles
          : []
        ).map((profile, index) =>
          normalizeString(profile, `lightingProfile.supportedProfiles[${index}]`)
        )
      ),
      deterministicProfileOrder: deepFreeze(
        (Array.isArray(lightingProfile.deterministicProfileOrder)
          ? lightingProfile.deterministicProfileOrder
          : []
        ).map((profile, index) =>
          normalizeString(profile, `lightingProfile.deterministicProfileOrder[${index}]`)
        )
      )
    }),
    validationResult: deepFreeze({
      assetReferencesValid: Boolean(validationResult.assetReferencesValid),
      glbAvailabilityValid: Boolean(validationResult.glbAvailabilityValid),
      placementDataValid: Boolean(validationResult.placementDataValid),
      cameraMetadataValid: Boolean(validationResult.cameraMetadataValid),
      lightingMetadataValid: Boolean(validationResult.lightingMetadataValid),
      realGlbBackedAssetsValid: Boolean(validationResult.realGlbBackedAssetsValid)
    })
  });
}

function normalizeAssetInstance(rawAssetInstance, index) {
  const assetInstance = asPlainObject(rawAssetInstance, `assetInstances[${index}]`);
  return deepFreeze({
    assetId: normalizeString(assetInstance.assetId, `assetInstances[${index}].assetId`),
    sourceType: normalizeString(
      assetInstance.sourceType,
      `assetInstances[${index}].sourceType`
    ),
    glbPath: normalizeString(assetInstance.glbPath, `assetInstances[${index}].glbPath`),
    rendererProfile: normalizeString(
      assetInstance.rendererProfile,
      `assetInstances[${index}].rendererProfile`
    ),
    materialNames: deepFreeze(
      (Array.isArray(assetInstance.materialNames) ? assetInstance.materialNames : []).map(
        (materialName, materialIndex) =>
          normalizeString(
            materialName,
            `assetInstances[${index}].materialNames[${materialIndex}]`
          )
      )
    ),
    meshVertexCount: Number(assetInstance.meshVertexCount),
    primitiveCount: Number(assetInstance.primitiveCount),
    actualGlbBacked: Boolean(assetInstance.actualGlbBacked),
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
    ),
    viewpointValue:
      assetInstance.viewpointValue == null
        ? null
        : normalizeString(
            assetInstance.viewpointValue,
            `assetInstances[${index}].viewpointValue`
          ),
    questEligibility:
      assetInstance.questEligibility == null
        ? null
        : Boolean(assetInstance.questEligibility),
    captureEligibility:
      assetInstance.captureEligibility == null
        ? null
        : Boolean(assetInstance.captureEligibility),
    landmarkEligibility:
      assetInstance.landmarkEligibility == null
        ? null
        : Boolean(assetInstance.landmarkEligibility)
  });
}

function normalizePlacement(rawPlacement, index) {
  const placement = asPlainObject(rawPlacement, `placements[${index}]`);
  return deepFreeze({
    placementId: normalizeString(placement.placementId, `placements[${index}].placementId`),
    assetId: normalizeString(placement.assetId, `placements[${index}].assetId`),
    x: Number(placement.x),
    y: Number(placement.y),
    z: Number(placement.z),
    headingDegrees: Number(placement.headingDegrees),
    facingMode: normalizeString(placement.facingMode, `placements[${index}].facingMode`),
    deterministicPlacementKey: normalizeString(
      placement.deterministicPlacementKey,
      `placements[${index}].deterministicPlacementKey`
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
    name: "CoastalStarterWorldRealAssetSceneAssemblyValidationError"
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
