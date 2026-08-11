import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import {
  parseTreeEucalyptusApprovedGameplayGlbSceneData
} from "./developer-only-atlas-first-approved-live-asset.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_SHARED_APPROVED_LIVE_ASSET_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_SHARED_APPROVED_LIVE_ASSET_RESULT_001";
const FOUNDATION_CONTRACT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_SHARED_RENDERER_FOUNDATION_CONTRACT_001";

export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID = "TREE_EUCALYPTUS_001";
export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION = "v001";
export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID =
  "ATLAS_APPROVED_ASSET_TREE_EUCALYPTUS_001_3D_001";
export const DEFAULT_SECOND_APPROVED_LIVE_ASSET_ID = "TREE_BOTTLEBRUSH_001";
export const DEFAULT_SECOND_APPROVED_LIVE_ASSET_VERSION = "v002";
export const DEFAULT_SECOND_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID =
  "ATLAS_APPROVED_ASSET_TREE_BOTTLEBRUSH_001_3D_001";
export const DEFAULT_THIRD_APPROVED_LIVE_ASSET_ID =
  "BUILDING_CIVIC_SPORTS_PAVILION_001";
export const DEFAULT_THIRD_APPROVED_LIVE_ASSET_VERSION = "1.0.0";
export const DEFAULT_THIRD_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID =
  "ATLAS_APPROVED_ASSET_BUILDING_CIVIC_SPORTS_PAVILION_001_3D_001";
export const DEFAULT_FOURTH_APPROVED_LIVE_ASSET_ID =
  "SHRUB_COASTAL_LOW_001";
export const DEFAULT_FOURTH_APPROVED_LIVE_ASSET_VERSION = "v002";
export const DEFAULT_FOURTH_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID =
  "ATLAS_APPROVED_ASSET_SHRUB_COASTAL_LOW_001_3D_001";

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

const TRUE_3D_REPRESENTATION_MODE = "atlas_true_3d_glb_model";
const RENDERER_SURFACE_CLASS_NAME = "atlas-approved-asset-true-3d-surface";
const LISTENER_EVENT_NAMES = Object.freeze(["moveend", "zoomend", "resize"]);
const VIEW_FOV_DEGREES = 32;
const CLEAR_COLOR = Object.freeze([0, 0, 0, 0]);
const DEFAULT_ROTATION_Y_RADIANS = 0.18;
const SHARED_CAMERA_PATH = "shared_fixed_north_up_oblique";
const SHARED_RENDERER_TECHNOLOGY_PATH = "webgl-shared-scene-fixed-camera";
const PROVISIONAL_PAVILION_DEVELOPER_SCALE_MULTIPLIER = 0.62;
const PROVISIONAL_PAVILION_DEVELOPER_TARGET_HEIGHT_METERS = 3.6;

const SUPPORTED_ASSET_RUNTIME_PROFILES = Object.freeze({
  TREE_EUCALYPTUS_001: Object.freeze({
    defaultVersion: DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION,
    modelInstanceId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID,
    targetHeightMeters: 14,
    rotationYRadians: 0.18
  }),
  TREE_BOTTLEBRUSH_001: Object.freeze({
    defaultVersion: DEFAULT_SECOND_APPROVED_LIVE_ASSET_VERSION,
    modelInstanceId: DEFAULT_SECOND_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID,
    targetHeightMeters: 8.5,
    rotationYRadians: 0.14
  }),
  BUILDING_CIVIC_SPORTS_PAVILION_001: Object.freeze({
    defaultVersion: DEFAULT_THIRD_APPROVED_LIVE_ASSET_VERSION,
    modelInstanceId: DEFAULT_THIRD_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID,
    targetHeightMeters: 3.6,
    rotationYRadians: 0
  }),
  SHRUB_COASTAL_LOW_001: Object.freeze({
    defaultVersion: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_VERSION,
    modelInstanceId: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID,
    targetHeightMeters: 1.35,
    rotationYRadians: 0
  })
});

const VERSIONED_REVIEW_OVERRIDE_PROFILES = Object.freeze({
  "TREE_EUCALYPTUS_001@v001": Object.freeze({
    assetVersion: "v001",
    assetReferenceId: "TREE_EUCALYPTUS_001@v001",
    resolvedGlbIdentity:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
  }),
  "TREE_EUCALYPTUS_001@v002": Object.freeze({
    assetVersion: "v002",
    assetReferenceId: "TREE_EUCALYPTUS_001@v002",
    resolvedGlbIdentity:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb"
  }),
  "SHRUB_COASTAL_LOW_001@v002": Object.freeze({
    assetVersion: "v002",
    assetReferenceId: "SHRUB_COASTAL_LOW_001@v002",
    resolvedGlbIdentity:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v002_LOD_GAMEPLAY.glb"
  }),
  "SHRUB_COASTAL_LOW_001@v003": Object.freeze({
    assetVersion: "v003",
    assetReferenceId: "SHRUB_COASTAL_LOW_001@v003",
    resolvedGlbIdentity:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb"
  })
});

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function sanitizeNumber(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function createAssetSlot({
  slotId,
  defaultAssetId,
  defaultAssetVersion,
  defaultModelInstanceId
}) {
  return {
    slotId,
    selectedAssetId: defaultAssetId,
    selectedAssetVersion: defaultAssetVersion,
    approvedAssetStatus: null,
    assetReferenceId: null,
    assetSource: null,
    runtimePreviewBindingId: null,
    resolvedGlbIdentity: null,
    modelInstanceId: defaultModelInstanceId,
    liveAssetPresent: false,
    latitude: null,
    longitude: null,
    representationMode: null,
    actualGlbLoaded: false,
    meshCount: 0,
    materialCount: 0,
    sceneObjectCount: 0,
    lastReasonCode: null
  };
}

function createState() {
  return {
    firstAsset: createAssetSlot({
      slotId: "first",
      defaultAssetId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
      defaultAssetVersion: DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION,
      defaultModelInstanceId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID
    }),
    secondAsset: createAssetSlot({
      slotId: "second",
      defaultAssetId: DEFAULT_SECOND_APPROVED_LIVE_ASSET_ID,
      defaultAssetVersion: DEFAULT_SECOND_APPROVED_LIVE_ASSET_VERSION,
      defaultModelInstanceId: DEFAULT_SECOND_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID
    }),
    thirdAsset: createAssetSlot({
      slotId: "third",
      defaultAssetId: DEFAULT_THIRD_APPROVED_LIVE_ASSET_ID,
      defaultAssetVersion: DEFAULT_THIRD_APPROVED_LIVE_ASSET_VERSION,
      defaultModelInstanceId: DEFAULT_THIRD_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID
    }),
    fourthAsset: createAssetSlot({
      slotId: "fourth",
      defaultAssetId: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_ID,
      defaultAssetVersion: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_VERSION,
      defaultModelInstanceId: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID
    }),
    loaderStatus: "idle",
    loaderReason: null,
    rendererSurfaceCount: 0,
    rendererCanvasCount: 0,
    rendererInstanceCount: 0,
    sharedSceneCount: 0,
    sceneObjectCount: 0,
    modelInstanceCount: 0,
    ownedListenerCount: 0,
    renderLoopCount: 0,
    glContextCreated: false,
    true3dRendererReady: false,
    rendererTechnologyPath: SHARED_RENDERER_TECHNOLOGY_PATH,
    sharedCameraPath: SHARED_CAMERA_PATH,
    cameraState: null,
    mapProjectionState: null,
    lastOperation: null,
    lastReasonCode: null
  };
}

function buildInstanceSummary(asset) {
  return deepFreeze({
    slotId: asset.slotId,
    assetId: asset.selectedAssetId,
    assetVersion: asset.selectedAssetVersion,
    approvedAssetStatus: asset.approvedAssetStatus,
    assetReferenceId: asset.assetReferenceId,
    modelInstanceId: asset.modelInstanceId,
    resolvedGlbIdentity: asset.resolvedGlbIdentity,
    latitude: asset.latitude,
    longitude: asset.longitude,
    representationMode: asset.representationMode,
    liveAssetPresent: asset.liveAssetPresent,
    actualGlbLoaded: asset.actualGlbLoaded
  });
}

function buildStatus(state) {
  const first = state.firstAsset;
  const second = state.secondAsset;
  const third = state.thirdAsset;
  const fourth = state.fourthAsset;
  const liveInstances = [first, second, third, fourth]
    .filter((asset) => asset.liveAssetPresent)
    .map((asset) => buildInstanceSummary(asset));

  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    selectedAssetId: first.selectedAssetId,
    selectedAssetVersion: first.selectedAssetVersion,
    approvedAssetStatus: first.approvedAssetStatus,
    assetReferenceId: first.assetReferenceId,
    assetSource: first.assetSource,
    runtimePreviewBindingId: first.runtimePreviewBindingId,
    resolvedGlbIdentity: first.resolvedGlbIdentity,
    modelInstanceId: first.modelInstanceId,
    liveAssetPresent: first.liveAssetPresent,
    latitude: first.latitude,
    longitude: first.longitude,
    representationMode: first.representationMode,
    secondSelectedAssetId: second.selectedAssetId,
    secondSelectedAssetVersion: second.selectedAssetVersion,
    secondApprovedAssetStatus: second.approvedAssetStatus,
    secondAssetReferenceId: second.assetReferenceId,
    secondAssetSource: second.assetSource,
    secondRuntimePreviewBindingId: second.runtimePreviewBindingId,
    secondResolvedGlbIdentity: second.resolvedGlbIdentity,
    secondModelInstanceId: second.modelInstanceId,
    secondLiveAssetPresent: second.liveAssetPresent,
    secondLatitude: second.latitude,
    secondLongitude: second.longitude,
    secondRepresentationMode: second.representationMode,
    thirdSelectedAssetId: third.selectedAssetId,
    thirdSelectedAssetVersion: third.selectedAssetVersion,
    thirdApprovedAssetStatus: third.approvedAssetStatus,
    thirdAssetReferenceId: third.assetReferenceId,
    thirdAssetSource: third.assetSource,
    thirdRuntimePreviewBindingId: third.runtimePreviewBindingId,
    thirdResolvedGlbIdentity: third.resolvedGlbIdentity,
    thirdModelInstanceId: third.modelInstanceId,
    thirdLiveAssetPresent: third.liveAssetPresent,
    thirdLatitude: third.latitude,
    thirdLongitude: third.longitude,
    thirdRepresentationMode: third.representationMode,
    fourthSelectedAssetId: fourth.selectedAssetId,
    fourthSelectedAssetVersion: fourth.selectedAssetVersion,
    fourthApprovedAssetStatus: fourth.approvedAssetStatus,
    fourthAssetReferenceId: fourth.assetReferenceId,
    fourthAssetSource: fourth.assetSource,
    fourthRuntimePreviewBindingId: fourth.runtimePreviewBindingId,
    fourthResolvedGlbIdentity: fourth.resolvedGlbIdentity,
    fourthModelInstanceId: fourth.modelInstanceId,
    fourthLiveAssetPresent: fourth.liveAssetPresent,
    fourthLatitude: fourth.latitude,
    fourthLongitude: fourth.longitude,
    fourthRepresentationMode: fourth.representationMode,
    loaderStatus: state.loaderStatus,
    loaderReason: state.loaderReason,
    actualGlbLoaded: first.actualGlbLoaded,
    secondActualGlbLoaded: second.actualGlbLoaded,
    thirdActualGlbLoaded: third.actualGlbLoaded,
    fourthActualGlbLoaded: fourth.actualGlbLoaded,
    meshCount: first.meshCount,
    secondMeshCount: second.meshCount,
    thirdMeshCount: third.meshCount,
    fourthMeshCount: fourth.meshCount,
    materialCount: first.materialCount,
    secondMaterialCount: second.materialCount,
    thirdMaterialCount: third.materialCount,
    fourthMaterialCount: fourth.materialCount,
    rendererSurfaceCount: state.rendererSurfaceCount,
    rendererCanvasCount: state.rendererCanvasCount,
    rendererInstanceCount: state.rendererInstanceCount,
    sharedSceneCount: state.sharedSceneCount,
    sceneObjectCount: state.sceneObjectCount,
    firstSceneObjectCount: first.sceneObjectCount,
    secondSceneObjectCount: second.sceneObjectCount,
    thirdSceneObjectCount: third.sceneObjectCount,
    fourthSceneObjectCount: fourth.sceneObjectCount,
    modelInstanceCount: state.modelInstanceCount,
    ownedListenerCount: state.ownedListenerCount,
    renderLoopCount: state.renderLoopCount,
    glContextCreated: state.glContextCreated,
    true3dRendererReady: state.true3dRendererReady,
    rendererTechnologyPath: state.rendererTechnologyPath,
    sharedCameraPath: state.sharedCameraPath,
    cameraState: state.cameraState,
    mapProjectionState: state.mapProjectionState,
    sharedAssetInstances: deepFreeze(liveInstances),
    lastOperation: state.lastOperation,
    lastReasonCode: state.lastReasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult(state, outcome, reasonCode, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    outcome,
    reasonCode,
    status: buildStatus(state),
    ...extra
  });
}

function isSupportedSlotId(slotId) {
  return (
    slotId === "first" ||
    slotId === "second" ||
    slotId === "third" ||
    slotId === "fourth"
  );
}

function buildLockedSharedRendererFoundationContract() {
  return deepFreeze({
    schemaId: FOUNDATION_CONTRACT_SCHEMA_ID,
    foundationLocked: true,
    developerAlphaOnly: true,
    sharedRendererSingletonRequired: true,
    sharedCanvasSingletonRequired: true,
    sharedSceneSingletonRequired: true,
    perAssetRendererForbidden: true,
    perAssetCanvasForbidden: true,
    duplicateSceneCreationForbidden: true,
    duplicateMapListenerOwnershipForbidden: true,
    orphanedRenderLoopForbidden: true,
    leakedModelInstanceForbidden: true,
    authoritativeLiveLeafletMapRequired: true,
    lazyRendererInitialization: true,
    rendererTechnologyPath: SHARED_RENDERER_TECHNOLOGY_PATH,
    sharedCameraPath: SHARED_CAMERA_PATH,
    minimumSupportedRendererApi: deepFreeze({
      attach: deepFreeze({
        kind: "external_contract",
        controller: "developer-only-atlas-map-attachment-controller",
        operation: "attachAtlasMapDiagnostic"
      }),
      initializeSharedRenderer: deepFreeze({
        kind: "controller_method",
        operation: "initializeSharedApprovedLiveAssetRenderer",
        mode: "lazy_on_first_model_instance"
      }),
      loadApprovedGlb: deepFreeze({
        kind: "controller_method",
        operation: "createApprovedSharedAssetModelInstance",
        note: "approved GLB load is coupled to first model-instance creation in developer alpha"
      }),
      createModelInstance: deepFreeze({
        kind: "controller_method",
        operation: "createApprovedSharedAssetModelInstance"
      }),
      updateGeographicPosition: deepFreeze({
        kind: "controller_method",
        operation: "updateApprovedSharedAssetGeographicPosition"
      }),
      removeModel: deepFreeze({
        kind: "controller_method",
        operation: "removeApprovedSharedAssetModelInstance"
      }),
      clearModels: deepFreeze({
        kind: "controller_method",
        operation: "clearApprovedSharedAssetModelInstances"
      }),
      detachDispose: deepFreeze({
        kind: "combined_contract",
        operations: deepFreeze([
          "clearApprovedSharedAssetModelInstances",
          "detachAtlasMapDiagnostic"
        ])
      })
    }),
    provisionalVisualCalibrationObservation: deepFreeze({
      pavilionAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      pavilionAssetVersion: "1.0.0",
      developerScaleMultiplier: PROVISIONAL_PAVILION_DEVELOPER_SCALE_MULTIPLIER,
      developerTargetHeightMeters:
        PROVISIONAL_PAVILION_DEVELOPER_TARGET_HEIGHT_METERS,
      observationOnly: true,
      universalProductionRule: false
    }),
    visualQualityFinding:
      "Current proof assets are technically functional but visually below the desired GrowGo quality bar.",
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "unknown shader error";
    gl.deleteShader(shader);
    throw Object.assign(new Error("WEBGL_SHADER_COMPILE_FAILED"), {
      reasonCode: "WEBGL_SHADER_COMPILE_FAILED",
      detail: info
    });
  }
  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec3 aPosition;
      uniform mat4 uModel;
      uniform mat4 uViewProjection;
      uniform vec2 uAnchorNdc;
      void main() {
        vec4 clip = uViewProjection * uModel * vec4(aPosition, 1.0);
        clip.xy += uAnchorNdc * clip.w;
        gl_Position = clip;
      }
    `
  );
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform vec4 uColor;
      void main() {
        gl_FragColor = uColor;
      }
    `
  );
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "unknown link error";
    gl.deleteProgram(program);
    throw Object.assign(new Error("WEBGL_PROGRAM_LINK_FAILED"), {
      reasonCode: "WEBGL_PROGRAM_LINK_FAILED",
      detail: info
    });
  }
  return {
    program,
    positionLocation: gl.getAttribLocation(program, "aPosition"),
    modelLocation: gl.getUniformLocation(program, "uModel"),
    viewProjectionLocation: gl.getUniformLocation(program, "uViewProjection"),
    anchorNdcLocation: gl.getUniformLocation(program, "uAnchorNdc"),
    colorLocation: gl.getUniformLocation(program, "uColor")
  };
}

function multiplyMat4(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function perspectiveMatrix(fieldOfViewRadians, aspect, near, far) {
  const f = 1 / Math.tan(fieldOfViewRadians / 2);
  const rangeInverse = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInverse, -1,
    0, 0, near * far * rangeInverse * 2, 0
  ]);
}

function normalizeVector(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function subtractVector(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function crossVector(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dotVector(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function lookAtMatrix(cameraPosition, target, up) {
  const zAxis = normalizeVector(subtractVector(cameraPosition, target));
  const xAxis = normalizeVector(crossVector(up, zAxis));
  const yAxis = crossVector(zAxis, xAxis);

  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dotVector(xAxis, cameraPosition),
    -dotVector(yAxis, cameraPosition),
    -dotVector(zAxis, cameraPosition),
    1
  ]);
}

function scaleRotationYMatrix(scale, rotationYRadians = DEFAULT_ROTATION_Y_RADIANS) {
  const c = Math.cos(rotationYRadians);
  const s = Math.sin(rotationYRadians);
  return new Float32Array([
    c * scale, 0, -s * scale, 0,
    0, scale, 0, 0,
    s * scale, 0, c * scale, 0,
    0, 0, 0, 1
  ]);
}

function projectPointToNdc(matrix, point) {
  const x = Number(point?.[0] ?? 0);
  const y = Number(point?.[1] ?? 0);
  const z = Number(point?.[2] ?? 0);
  const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  const clipZ = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (!Number.isFinite(clipW) || Math.abs(clipW) < 0.000001) {
    return null;
  }
  return {
    clipX,
    clipY,
    clipZ,
    clipW,
    ndcX: clipX / clipW,
    ndcY: clipY / clipW,
    ndcZ: clipZ / clipW
  };
}

function metersPerPixel(latitude, zoom) {
  const safeLatitude = Math.max(-85, Math.min(85, Number(latitude) || 0));
  return (
    (40075016.686 * Math.cos((safeLatitude * Math.PI) / 180)) /
    Math.pow(2, Number(zoom) + 8)
  );
}

function createCanvas(documentObject) {
  const canvas = documentObject.createElement("canvas");
  canvas.className = RENDERER_SURFACE_CLASS_NAME;
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "1px";
  canvas.style.height = "1px";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "390";
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
}

function projectLatLngForRenderer(map, latitude, longitude) {
  const latLngTuple = [latitude, longitude];
  if (typeof map?.latLngToLayerPoint === "function") {
    const point = map.latLngToLayerPoint(latLngTuple);
    return {
      point,
      projectionSource: "layer_point"
    };
  }

  if (
    typeof map?.latLngToContainerPoint === "function" &&
    typeof map?.containerPointToLayerPoint === "function"
  ) {
    const containerPoint = map.latLngToContainerPoint(latLngTuple);
    return {
      point: map.containerPointToLayerPoint(containerPoint),
      projectionSource: "container_to_layer_point"
    };
  }

  if (typeof map?.latLngToContainerPoint === "function") {
    return {
      point: map.latLngToContainerPoint(latLngTuple),
      projectionSource: "container_point_fallback"
    };
  }

  return {
    point: null,
    projectionSource: "projection_unavailable"
  };
}

function createTrue3DRendererBackend({
  documentObject,
  map
}) {
  const overlayPane =
    map?.getPanes?.()?.overlayPane ?? map?.getContainer?.() ?? null;
  if (!overlayPane || typeof overlayPane.appendChild !== "function") {
    throw Object.assign(new Error("ATLAS_TRUE_3D_OVERLAY_PANE_UNAVAILABLE"), {
      reasonCode: "ATLAS_TRUE_3D_OVERLAY_PANE_UNAVAILABLE"
    });
  }

  const canvas = createCanvas(documentObject);
  overlayPane.appendChild(canvas);
  const gl =
    canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    }) ??
    canvas.getContext("experimental-webgl");
  if (!gl) {
    canvas.remove();
    throw Object.assign(new Error("ATLAS_TRUE_3D_WEBGL_UNAVAILABLE"), {
      reasonCode: "ATLAS_TRUE_3D_WEBGL_UNAVAILABLE"
    });
  }

  const program = createProgram(gl);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const sceneResources = new Map();
  const listeners = [];

  function ensureSceneResource({ cacheKey, sceneData }) {
    const existing = sceneResources.get(cacheKey);
    if (existing) {
      return existing;
    }
    const drawCalls = sceneData.drawCalls.map((drawCall) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, drawCall.positions, gl.STATIC_DRAW);
      return {
        drawCallId: drawCall.drawCallId,
        color: drawCall.color,
        vertexCount: drawCall.vertexCount,
        buffer
      };
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const resource = {
      cacheKey,
      sceneData,
      drawCalls
    };
    sceneResources.set(cacheKey, resource);
    return resource;
  }

  function syncCanvasSize() {
    const size =
      typeof map?.getSize === "function" ? map.getSize() : null;
    const width = Math.max(1, Number(size?.x ?? canvas.clientWidth ?? 1));
    const height = Math.max(1, Number(size?.y ?? canvas.clientHeight ?? 1));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  }

  function buildPerInstanceRenderState(instance, zoom) {
    const assetProfile =
      SUPPORTED_ASSET_RUNTIME_PROFILES[instance.assetId] ??
      SUPPORTED_ASSET_RUNTIME_PROFILES[DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID];
    const heightMeters = Math.max(instance.sceneData.modelBounds.height, 0.001);
    const currentMetersPerPixel = metersPerPixel(instance.latitude, zoom);
    const pixelsPerMeter = 1 / Math.max(currentMetersPerPixel, 0.000001);
    const unitToMeterScale = assetProfile.targetHeightMeters / heightMeters;
    const renderScale = pixelsPerMeter * unitToMeterScale * 0.9;
    const scaledHeight = heightMeters * renderScale;
    return {
      renderScale,
      scaledHeight,
      pixelsPerMeter,
      rotationYRadians: assetProfile.rotationYRadians
    };
  }

  function buildSharedCameraState(instanceStates) {
    const maxScaledHeight = Math.max(
      ...instanceStates.map((entry) => entry.renderState.scaledHeight),
      48
    );
    const cameraPosition = [
      Math.max(36, maxScaledHeight * 0.55),
      Math.max(72, maxScaledHeight * 1.15),
      Math.max(120, maxScaledHeight * 2.2)
    ];
    const target = [0, Math.max(18, maxScaledHeight * 0.42), 0];
    return {
      projectionMode: "perspective",
      fieldOfViewDegrees: VIEW_FOV_DEGREES,
      cameraPosition: deepFreeze(
        cameraPosition.map((value) => Number(value.toFixed(3)))
      ),
      target: deepFreeze(target.map((value) => Number(value.toFixed(3)))),
      viewingAngle: SHARED_CAMERA_PATH,
      renderScale: Number(
        Math.max(
          ...instanceStates.map((entry) => entry.renderState.renderScale),
          0
        ).toFixed(6)
      ),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    };
  }

  function renderInstances(instances) {
    if (!Array.isArray(instances) || instances.length === 0) {
      syncCanvasSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(...CLEAR_COLOR);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      return {
        cameraState: null,
        mapProjectionState: null
      };
    }

    syncCanvasSize();
    const zoom = Number(map?.getZoom?.() ?? 0);
    const instanceStates = instances.map((instance) => {
      const projected = projectLatLngForRenderer(
        map,
        instance.latitude,
        instance.longitude
      );
      const point = projected.point;
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw Object.assign(
          new Error("ATLAS_TRUE_3D_MAP_PROJECTION_UNAVAILABLE"),
          { reasonCode: "ATLAS_TRUE_3D_MAP_PROJECTION_UNAVAILABLE" }
        );
      }
      return {
        ...instance,
        point,
        projectionSource: projected.projectionSource,
        renderState: buildPerInstanceRenderState(instance, zoom)
      };
    });

    const cameraState = buildSharedCameraState(instanceStates);
    const mapCenter = map?.getCenter?.() ?? null;
    const mapProjectionState = deepFreeze({
      projectionSpace: "leaflet_layer_point",
      projectionSource:
        instanceStates[0]?.projectionSource ?? "projection_unavailable",
      zoom,
      mapCenterLatitude: sanitizeNumber(mapCenter?.lat ?? null),
      mapCenterLongitude: sanitizeNumber(mapCenter?.lng ?? null),
      pixelOriginX: sanitizeNumber(map?.getPixelOrigin?.()?.x ?? null),
      pixelOriginY: sanitizeNumber(map?.getPixelOrigin?.()?.y ?? null),
      firstProjectedPixelX: sanitizeNumber(instanceStates[0]?.point?.x ?? null),
      firstProjectedPixelY: sanitizeNumber(instanceStates[0]?.point?.y ?? null),
      secondProjectedPixelX: sanitizeNumber(instanceStates[1]?.point?.x ?? null),
      secondProjectedPixelY: sanitizeNumber(instanceStates[1]?.point?.y ?? null),
      thirdProjectedPixelX: sanitizeNumber(instanceStates[2]?.point?.x ?? null),
      thirdProjectedPixelY: sanitizeNumber(instanceStates[2]?.point?.y ?? null),
      fourthProjectedPixelX: sanitizeNumber(instanceStates[3]?.point?.x ?? null),
      fourthProjectedPixelY: sanitizeNumber(instanceStates[3]?.point?.y ?? null),
      canvasPageLeft: sanitizeNumber(canvas?.getBoundingClientRect?.()?.left ?? null),
      canvasPageTop: sanitizeNumber(canvas?.getBoundingClientRect?.()?.top ?? null),
      canvasWidth: sanitizeNumber(canvas.width),
      canvasHeight: sanitizeNumber(canvas.height),
      overlayPaneTransform:
        sanitizeString(
          overlayPane?.style?.transform ||
            documentObject?.defaultView?.getComputedStyle?.(overlayPane)
              ?.transform ||
            null
        ) ?? null,
      mapPaneTransform:
        sanitizeString(
          map?.getPanes?.()?.mapPane?.style?.transform ||
            documentObject?.defaultView?.getComputedStyle?.(map?.getPanes?.()?.mapPane)
              ?.transform ||
            null
        ) ?? null
    });
    const aspect = canvas.width / canvas.height;
    const projection = perspectiveMatrix(
      (VIEW_FOV_DEGREES * Math.PI) / 180,
      aspect,
      1,
      4000
    );
    const view = lookAtMatrix(cameraState.cameraPosition, cameraState.target, [
      0, 1, 0
    ]);
    const viewProjection = multiplyMat4(projection, view);
    const modelOriginProjection = projectPointToNdc(viewProjection, [0, 0, 0]);
    if (!modelOriginProjection) {
      throw Object.assign(new Error("ATLAS_TRUE_3D_CAMERA_PROJECTION_INVALID"), {
        reasonCode: "ATLAS_TRUE_3D_CAMERA_PROJECTION_INVALID"
      });
    }
    const instanceProjectionDiagnostics = [];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...CLEAR_COLOR);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.viewProjectionLocation, false, viewProjection);
    gl.enableVertexAttribArray(program.positionLocation);

    for (const instanceState of instanceStates) {
      const desiredAnchorNdc = [
        (instanceState.point.x / canvas.width) * 2 - 1,
        1 - (instanceState.point.y / canvas.height) * 2
      ];
      const anchorShiftNdc = [
        desiredAnchorNdc[0] - modelOriginProjection.ndcX,
        desiredAnchorNdc[1] - modelOriginProjection.ndcY
      ];
      const model = scaleRotationYMatrix(
        instanceState.renderState.renderScale,
        instanceState.renderState.rotationYRadians
      );
      gl.uniformMatrix4fv(program.modelLocation, false, model);
      gl.uniform2fv(program.anchorNdcLocation, anchorShiftNdc);
      instanceProjectionDiagnostics.push(
        deepFreeze({
          slotId: instanceState.slotId,
          storedLatitude: sanitizeNumber(instanceState.latitude),
          storedLongitude: sanitizeNumber(instanceState.longitude),
          layerPointX: sanitizeNumber(instanceState.point.x),
          layerPointY: sanitizeNumber(instanceState.point.y),
          desiredAnchorNdcX: sanitizeNumber(desiredAnchorNdc[0]),
          desiredAnchorNdcY: sanitizeNumber(desiredAnchorNdc[1]),
          modelOriginProjectedNdcX: sanitizeNumber(modelOriginProjection.ndcX),
          modelOriginProjectedNdcY: sanitizeNumber(modelOriginProjection.ndcY),
          anchorShiftNdcX: sanitizeNumber(anchorShiftNdc[0]),
          anchorShiftNdcY: sanitizeNumber(anchorShiftNdc[1]),
          finalAnchorNdcX: sanitizeNumber(
            modelOriginProjection.ndcX + anchorShiftNdc[0]
          ),
          finalAnchorNdcY: sanitizeNumber(
            modelOriginProjection.ndcY + anchorShiftNdc[1]
          )
        })
      );
      for (const drawCall of instanceState.resource.drawCalls) {
        gl.bindBuffer(gl.ARRAY_BUFFER, drawCall.buffer);
        gl.vertexAttribPointer(
          program.positionLocation,
          3,
          gl.FLOAT,
          false,
          0,
          0
        );
        gl.uniform4fv(program.colorLocation, drawCall.color);
        gl.drawArrays(gl.TRIANGLES, 0, drawCall.vertexCount);
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return {
      cameraState,
      mapProjectionState: deepFreeze({
        ...mapProjectionState,
        modelOriginProjectedNdcX: sanitizeNumber(modelOriginProjection.ndcX),
        modelOriginProjectedNdcY: sanitizeNumber(modelOriginProjection.ndcY),
        instanceProjectionDiagnostics
      })
    };
  }

  function registerListeners(renderCallback) {
    for (const eventName of LISTENER_EVENT_NAMES) {
      const listener = () => renderCallback();
      map?.on?.(eventName, listener);
      listeners.push({ eventName, listener });
    }
  }

  function removeListeners() {
    for (const entry of listeners.splice(0)) {
      map?.off?.(entry.eventName, entry.listener);
    }
  }

  function destroy() {
    removeListeners();
    for (const resource of sceneResources.values()) {
      for (const drawCall of resource.drawCalls) {
        if (drawCall.buffer) {
          gl.deleteBuffer(drawCall.buffer);
        }
      }
    }
    sceneResources.clear();
    gl.deleteProgram(program.program);
    if (typeof canvas.remove === "function") {
      canvas.remove();
    } else {
      overlayPane.removeChild(canvas);
    }
  }

  return {
    canvas,
    gl,
    ensureSceneResource,
    renderInstances,
    registerListeners,
    removeListeners,
    destroy
  };
}

function resolveApprovedAssetRecord(assetRegistry, assetId, assetVersion = null, slotId = null) {
  const registryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    assetRegistry,
    assetId
  );
  const runtimeProfile = SUPPORTED_ASSET_RUNTIME_PROFILES[registryEntry.assetId];
  if (!runtimeProfile) {
    throw Object.assign(new Error("APPROVED_SHARED_ASSET_UNSUPPORTED"), {
      reasonCode: "APPROVED_SHARED_ASSET_UNSUPPORTED"
    });
  }

  const requestedVersion = sanitizeString(assetVersion);
  const versionOverride =
    requestedVersion != null
      ? VERSIONED_REVIEW_OVERRIDE_PROFILES[
          `${registryEntry.assetId}@${requestedVersion}`
        ] ?? null
      : null;

  return deepFreeze({
    assetId: registryEntry.assetId,
    assetVersion: versionOverride?.assetVersion ?? registryEntry.assetVersion,
    assetReferenceId:
      versionOverride?.assetReferenceId ?? registryEntry.assetReferenceId,
    approvedAssetStatus: registryEntry.status,
    assetSource:
      "developer-only-atlas-asset-registry.mjs + shared_true_webgl_renderer_surface",
    runtimePreviewBindingId: `${registryEntry.assetId}_ACTUAL_GLB_RUNTIME_BINDING`,
    resolvedGlbIdentity:
      versionOverride?.resolvedGlbIdentity ??
      `asset-factory-workspace/production/${registryEntry.assetFamily}/export/${registryEntry.assetId}_LOD_GAMEPLAY.glb`,
    representationMode: TRUE_3D_REPRESENTATION_MODE,
    modelInstanceId:
      slotId != null
        ? `${runtimeProfile.modelInstanceId}_${String(slotId).toUpperCase()}`
        : runtimeProfile.modelInstanceId
  });
}

function parseApprovedGameplayGlbSceneData(arrayBuffer) {
  return parseTreeEucalyptusApprovedGameplayGlbSceneData(arrayBuffer);
}

export function createDeveloperOnlyAtlasSharedApprovedLiveAssetController({
  getGrowGoMap = () => null,
  attachmentStatusProvider = () => null,
  documentObject = globalThis?.document ?? null,
  hostObject = globalThis ?? null,
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  fetchProvider = (...args) => globalThis.fetch(...args)
} = {}) {
  const state = createState();
  const sceneDataCache = new Map();
  let rendererBackend = null;

  function activeAssets() {
    return [
      state.firstAsset,
      state.secondAsset,
      state.thirdAsset,
      state.fourthAsset
    ].filter(
      (asset) => asset.liveAssetPresent === true
    );
  }

  function cloneAsset(asset) {
    return {
      ...asset
    };
  }

  function syncRendererState(
    cameraState = state.cameraState,
    mapProjectionState = state.mapProjectionState
  ) {
    const liveAssets = activeAssets();
    state.rendererSurfaceCount = rendererBackend && liveAssets.length > 0 ? 1 : 0;
    state.rendererCanvasCount = rendererBackend && liveAssets.length > 0 ? 1 : 0;
    state.rendererInstanceCount =
      rendererBackend && liveAssets.length > 0 ? 1 : 0;
    state.sharedSceneCount = rendererBackend && liveAssets.length > 0 ? 1 : 0;
    state.sceneObjectCount = liveAssets.reduce(
      (sum, asset) => sum + Number(asset.sceneObjectCount ?? 0),
      0
    );
    state.modelInstanceCount = liveAssets.length;
    state.ownedListenerCount =
      rendererBackend && liveAssets.length > 0 ? LISTENER_EVENT_NAMES.length : 0;
    state.renderLoopCount = 0;
    state.glContextCreated = !!rendererBackend && liveAssets.length > 0;
    state.true3dRendererReady = !!rendererBackend && liveAssets.length > 0;
    state.cameraState = cameraState ?? null;
    state.mapProjectionState = mapProjectionState ?? null;
  }

  function destroyRendererBackend() {
    if (!rendererBackend) {
      syncRendererState(null, null);
      return;
    }
    rendererBackend.destroy();
    rendererBackend = null;
    syncRendererState(null, null);
  }

  function ensureAttachedLiveMap() {
    const attachmentStatus = attachmentStatusProvider?.() ?? null;
    const liveMap = getGrowGoMap?.() ?? null;
    if (!attachmentStatus || attachmentStatus.attached !== true) {
      throw Object.assign(new Error("ATLAS_NOT_ATTACHED"), {
        reasonCode: "ATLAS_NOT_ATTACHED"
      });
    }
    if (attachmentStatus.exactLiveMapBound !== true) {
      throw Object.assign(new Error("LIVE_MAP_IDENTITY_UNBOUND"), {
        reasonCode: "LIVE_MAP_IDENTITY_UNBOUND"
      });
    }
    if (!liveMap || typeof liveMap.latLngToContainerPoint !== "function") {
      throw Object.assign(new Error("LIVE_MAP_UNAVAILABLE"), {
        reasonCode: "LIVE_MAP_UNAVAILABLE"
      });
    }
    if (!documentObject || typeof documentObject.createElement !== "function") {
      throw Object.assign(new Error("ATLAS_TRUE_3D_DOCUMENT_UNAVAILABLE"), {
        reasonCode: "ATLAS_TRUE_3D_DOCUMENT_UNAVAILABLE"
      });
    }
    const hostname = hostObject?.location?.hostname ?? "";
    if (!isLocalDevelopmentHost(hostname)) {
      throw Object.assign(new Error("ATLAS_TRUE_3D_LOCAL_DEVELOPMENT_ONLY"), {
        reasonCode: "ATLAS_TRUE_3D_LOCAL_DEVELOPMENT_ONLY"
      });
    }
    return liveMap;
  }

  async function resolveSceneData(approvedAssetRecord) {
    const cacheKey = approvedAssetRecord.resolvedGlbIdentity;
    if (sceneDataCache.has(cacheKey)) {
      return sceneDataCache.get(cacheKey);
    }
    const response = await fetchProvider(approvedAssetRecord.resolvedGlbIdentity);
    if (!response || response.ok !== true) {
      throw Object.assign(new Error("APPROVED_ASSET_GLB_FETCH_FAILED"), {
        reasonCode: "APPROVED_ASSET_GLB_FETCH_FAILED"
      });
    }
    const arrayBuffer = await response.arrayBuffer();
    const sceneData = parseApprovedGameplayGlbSceneData(arrayBuffer);
    sceneDataCache.set(cacheKey, sceneData);
    return sceneData;
  }

  function getSlot(slotId) {
    if (slotId === "first") {
      return state.firstAsset;
    }
    if (slotId === "second") {
      return state.secondAsset;
    }
    if (slotId === "third") {
      return state.thirdAsset;
    }
    return state.fourthAsset;
  }

  function requireSupportedSlotId(slotId) {
    if (!isSupportedSlotId(slotId)) {
      throw Object.assign(new Error("APPROVED_SHARED_ASSET_SLOT_INVALID"), {
        reasonCode: "APPROVED_SHARED_ASSET_SLOT_INVALID"
      });
    }
  }

  function buildRenderableInstances(overrides = new Map()) {
    const assets = [
      state.firstAsset,
      state.secondAsset,
      state.thirdAsset,
      state.fourthAsset
    ].map((asset) => overrides.get(asset.slotId) ?? asset);
    return assets
      .filter((asset) => asset.liveAssetPresent === true)
      .map((asset) => {
        const sceneData = sceneDataCache.get(asset.resolvedGlbIdentity);
        if (!sceneData) {
          throw Object.assign(new Error("APPROVED_ASSET_SCENE_DATA_MISSING"), {
            reasonCode: "APPROVED_ASSET_SCENE_DATA_MISSING"
          });
        }
        const resource = rendererBackend.ensureSceneResource({
          cacheKey: asset.resolvedGlbIdentity,
          sceneData
        });
        return {
          slotId: asset.slotId,
          assetId: asset.selectedAssetId,
          latitude: asset.latitude,
          longitude: asset.longitude,
          resource,
          sceneData
        };
      });
  }

  function renderAll(overrides = new Map()) {
    if (!rendererBackend) {
      return null;
    }
    const instances = buildRenderableInstances(overrides);
    if (instances.length === 0) {
      destroyRendererBackend();
      return null;
    }
    const renderOutcome = rendererBackend.renderInstances(instances);
    syncRendererState(
      renderOutcome?.cameraState ?? null,
      renderOutcome?.mapProjectionState ?? null
    );
    return renderOutcome;
  }

  function initializeSharedApprovedLiveAssetRenderer() {
    try {
      ensureAttachedLiveMap();
    } catch (error) {
      return buildResult(
        state,
        "blocked",
        error?.reasonCode ?? "ATLAS_SHARED_RENDERER_INITIALIZATION_BLOCKED"
      );
    }

    const liveAssets = activeAssets();
    if (rendererBackend && liveAssets.length > 0) {
      syncRendererState(state.cameraState, state.mapProjectionState);
      return buildResult(
        state,
        "ready",
        "ATLAS_SHARED_RENDERER_ALREADY_ACTIVE"
      );
    }

    syncRendererState(state.cameraState, state.mapProjectionState);
    return buildResult(
      state,
      "ready",
      "ATLAS_SHARED_RENDERER_DEFERRED_UNTIL_FIRST_MODEL_INSTANCE",
      {
        foundationContract: buildLockedSharedRendererFoundationContract()
      }
    );
  }

  async function placeOrUpdateSlot(
    slotId,
    { assetId, assetVersion, latitude, longitude } = {}
  ) {
    requireSupportedSlotId(slotId);
    const slot = getSlot(slotId);
    state.lastOperation = `${slotId}_place_or_update`;
    const latitudeValue = sanitizeNumber(latitude);
    const longitudeValue = sanitizeNumber(longitude);
    if (latitudeValue == null || longitudeValue == null) {
      state.lastReasonCode = "APPROVED_ASSET_COORDINATE_INVALID";
      state.loaderStatus = "blocked";
      state.loaderReason = "APPROVED_ASSET_COORDINATE_INVALID";
      slot.lastReasonCode = "APPROVED_ASSET_COORDINATE_INVALID";
      return buildResult(state, "blocked", "APPROVED_ASSET_COORDINATE_INVALID");
    }

    let approvedAssetRecord;
    let liveMap;
    try {
      liveMap = ensureAttachedLiveMap();
      approvedAssetRecord = resolveApprovedAssetRecord(
        assetRegistry,
        assetId ?? slot.selectedAssetId,
        assetVersion ?? slot.selectedAssetVersion,
        slotId
      );
    } catch (error) {
      const reasonCode = error?.reasonCode ?? "APPROVED_ASSET_RESOLUTION_FAILED";
      state.lastReasonCode = reasonCode;
      state.loaderStatus = "blocked";
      state.loaderReason = reasonCode;
      slot.lastReasonCode = reasonCode;
      return buildResult(state, "blocked", reasonCode);
    }

    const wasPresent = slot.liveAssetPresent === true;
    try {
      state.loaderStatus = "loading_actual_glb";
      state.loaderReason = null;
      const sceneData = await resolveSceneData(approvedAssetRecord);
      if (!rendererBackend) {
        rendererBackend = createTrue3DRendererBackend({
          documentObject,
          map: liveMap
        });
        rendererBackend.registerListeners(() => {
          if (activeAssets().length === 0) {
            return;
          }
          try {
            renderAll();
          } catch (_error) {
            // remain fail-closed without introducing retries
          }
        });
      }

      const nextSlot = cloneAsset(slot);
      nextSlot.selectedAssetId = approvedAssetRecord.assetId;
      nextSlot.selectedAssetVersion = approvedAssetRecord.assetVersion;
      nextSlot.approvedAssetStatus = approvedAssetRecord.approvedAssetStatus;
      nextSlot.assetReferenceId = approvedAssetRecord.assetReferenceId;
      nextSlot.assetSource = approvedAssetRecord.assetSource;
      nextSlot.runtimePreviewBindingId = approvedAssetRecord.runtimePreviewBindingId;
      nextSlot.resolvedGlbIdentity = approvedAssetRecord.resolvedGlbIdentity;
      nextSlot.modelInstanceId = approvedAssetRecord.modelInstanceId;
      nextSlot.liveAssetPresent = true;
      nextSlot.latitude = latitudeValue;
      nextSlot.longitude = longitudeValue;
      nextSlot.representationMode = approvedAssetRecord.representationMode;
      nextSlot.actualGlbLoaded = true;
      nextSlot.meshCount = sceneData.meshCount;
      nextSlot.materialCount = sceneData.materialCount;
      nextSlot.sceneObjectCount = sceneData.sceneObjectCount;
      nextSlot.lastReasonCode = "ATLAS_TRUE_3D_RENDERED";

      const overrides = new Map([[slotId, nextSlot]]);
      const renderOutcome = renderAll(overrides);
      Object.assign(slot, nextSlot);
      state.loaderStatus = "loaded_actual_glb";
      state.loaderReason = "ACTUAL_GLB_LOADED";
      state.lastReasonCode = "ATLAS_TRUE_3D_RENDERED";
      syncRendererState(
        renderOutcome?.cameraState ?? null,
        renderOutcome?.mapProjectionState ?? null
      );

      return buildResult(
        state,
        wasPresent ? "updated" : "created",
        "ATLAS_TRUE_3D_RENDERED",
        {
          loaderResult: deepFreeze({
            loaderStatus: state.loaderStatus,
            loaderReason: state.loaderReason,
            actualGlbLoaded: slot.actualGlbLoaded,
            meshCount: slot.meshCount,
            materialCount: slot.materialCount
          })
        }
      );
    } catch (error) {
      state.loaderStatus = "failed_closed";
      state.loaderReason =
        error?.reasonCode ?? "APPROVED_ASSET_TRUE_3D_RENDER_FAILED";
      state.lastReasonCode = state.loaderReason;
      slot.lastReasonCode = state.loaderReason;
      if (activeAssets().length === 0) {
        destroyRendererBackend();
      } else {
        try {
          renderAll();
        } catch (_ignored) {
          destroyRendererBackend();
        }
      }
      return buildResult(state, "failed_closed", state.loaderReason);
    }
  }

  function clearSlot(slotId) {
    requireSupportedSlotId(slotId);
    const slot = getSlot(slotId);
    state.lastOperation = `${slotId}_clear`;
    slot.liveAssetPresent = false;
    slot.latitude = null;
    slot.longitude = null;
    slot.actualGlbLoaded = false;
    slot.sceneObjectCount = 0;
    slot.lastReasonCode = "APPROVED_ASSET_REMOVED";
    state.lastReasonCode = "APPROVED_ASSET_REMOVED";
    state.loaderStatus = activeAssets().length > 0 ? "loaded_actual_glb" : "idle";
    state.loaderReason = activeAssets().length > 0 ? "ACTUAL_GLB_LOADED" : null;

    try {
      const remaining = activeAssets().length;
      if (remaining === 0) {
        destroyRendererBackend();
      } else {
        renderAll();
      }
    } catch (_error) {
      destroyRendererBackend();
    }

    return buildResult(state, "removed", "APPROVED_ASSET_REMOVED");
  }

  function clearAll() {
    state.lastOperation = "clear_all";
    clearSlot("first");
    clearSlot("second");
    clearSlot("third");
    clearSlot("fourth");
    state.loaderStatus = "idle";
    state.loaderReason = null;
    state.lastReasonCode = "APPROVED_ASSET_REMOVED";
    return buildResult(state, "removed", "APPROVED_ASSET_REMOVED");
  }

  function getStatus() {
    return buildStatus(state);
  }

  function createApprovedSharedAssetModelInstance({
    slotId,
    assetId,
    assetVersion,
    latitude,
    longitude
  } = {}) {
    return placeOrUpdateSlot(slotId, {
      assetId,
      assetVersion,
      latitude,
      longitude
    });
  }

  function updateApprovedSharedAssetGeographicPosition({
    slotId,
    latitude,
    longitude
  } = {}) {
    return placeOrUpdateSlot(slotId, {
      latitude,
      longitude
    });
  }

  function removeApprovedSharedAssetModelInstance({ slotId } = {}) {
    return clearSlot(slotId);
  }

  function clearApprovedSharedAssetModelInstances() {
    return clearAll();
  }

  function disposeApprovedSharedAssetRendererFoundation() {
    return clearAll();
  }

  return deepFreeze({
    getLockedSharedRendererFoundationContract:
      buildLockedSharedRendererFoundationContract,
    initializeSharedApprovedLiveAssetRenderer,
    createApprovedSharedAssetModelInstance,
    updateApprovedSharedAssetGeographicPosition,
    removeApprovedSharedAssetModelInstance,
    clearApprovedSharedAssetModelInstances,
    disposeApprovedSharedAssetRendererFoundation,
    placeFirstApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("first", {
        assetId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    updateFirstApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("first", {
        assetId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    clearFirstApprovedLiveAsset: () => clearSlot("first"),
    placeSecondApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("second", {
        assetId: DEFAULT_SECOND_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    updateSecondApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("second", {
        assetId: DEFAULT_SECOND_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    clearSecondApprovedLiveAsset: () => clearSlot("second"),
    placeThirdApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("third", {
        assetId: DEFAULT_THIRD_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    updateThirdApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("third", {
        assetId: DEFAULT_THIRD_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    clearThirdApprovedLiveAsset: () => clearSlot("third"),
    placeFourthApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("fourth", {
        assetId: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    updateFourthApprovedLiveAsset: (input = {}) =>
      placeOrUpdateSlot("fourth", {
        assetId: DEFAULT_FOURTH_APPROVED_LIVE_ASSET_ID,
        ...input
      }),
    clearFourthApprovedLiveAsset: () => clearSlot("fourth"),
    clearAllApprovedLiveAssets: clearAll,
    getFirstApprovedLiveAssetStatus: getStatus,
    getSharedApprovedLiveAssetStatus: getStatus
  });
}
