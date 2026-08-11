import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import { treeEucalyptusRuntimePreviewBindingDefinition } from "../asset-factory/tree-eucalyptus-runtime-preview-binding.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FIRST_APPROVED_LIVE_ASSET_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FIRST_APPROVED_LIVE_ASSET_RESULT_001";

export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID = "TREE_EUCALYPTUS_001";
export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION = "v001";
export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID =
  "ATLAS_APPROVED_ASSET_TREE_EUCALYPTUS_001_3D_001";

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

const TRUE_3D_REPRESENTATION_MODE = "atlas_true_3d_glb_model";
const RENDERER_SURFACE_CLASS_NAME = "atlas-approved-asset-true-3d-surface";
const LISTENER_EVENT_NAMES = Object.freeze(["moveend", "zoomend", "resize"]);
const TARGET_TREE_HEIGHT_METERS = 14;
const VIEW_FOV_DEGREES = 32;
const CLEAR_COLOR = Object.freeze([0, 0, 0, 0]);

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

function createState() {
  return {
    selectedAssetId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    selectedAssetVersion: DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION,
    approvedAssetStatus: null,
    assetReferenceId: null,
    assetSource: null,
    runtimePreviewBindingId: null,
    resolvedGlbIdentity: null,
    modelInstanceId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID,
    liveAssetPresent: false,
    latitude: null,
    longitude: null,
    representationMode: null,
    loaderStatus: "idle",
    loaderReason: null,
    actualGlbLoaded: false,
    meshCount: 0,
    materialCount: 0,
    rendererSurfaceCount: 0,
    rendererCanvasCount: 0,
    sceneObjectCount: 0,
    modelInstanceCount: 0,
    ownedListenerCount: 0,
    renderLoopCount: 0,
    glContextCreated: false,
    true3dRendererReady: false,
    rendererTechnologyPath: "webgl-single-scene-fixed-camera",
    cameraState: null,
    lastOperation: null,
    lastReasonCode: null
  };
}

function buildStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    selectedAssetId: state.selectedAssetId,
    selectedAssetVersion: state.selectedAssetVersion,
    approvedAssetStatus: state.approvedAssetStatus,
    assetReferenceId: state.assetReferenceId,
    assetSource: state.assetSource,
    runtimePreviewBindingId: state.runtimePreviewBindingId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    modelInstanceId: state.modelInstanceId,
    liveAssetPresent: state.liveAssetPresent,
    latitude: state.latitude,
    longitude: state.longitude,
    representationMode: state.representationMode,
    loaderStatus: state.loaderStatus,
    loaderReason: state.loaderReason,
    actualGlbLoaded: state.actualGlbLoaded,
    meshCount: state.meshCount,
    materialCount: state.materialCount,
    rendererSurfaceCount: state.rendererSurfaceCount,
    rendererCanvasCount: state.rendererCanvasCount,
    sceneObjectCount: state.sceneObjectCount,
    modelInstanceCount: state.modelInstanceCount,
    ownedListenerCount: state.ownedListenerCount,
    renderLoopCount: state.renderLoopCount,
    glContextCreated: state.glContextCreated,
    true3dRendererReady: state.true3dRendererReady,
    rendererTechnologyPath: state.rendererTechnologyPath,
    cameraState: state.cameraState,
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

function componentByteSize(componentType) {
  switch (componentType) {
    case 5120:
    case 5121:
      return 1;
    case 5122:
    case 5123:
      return 2;
    case 5125:
    case 5126:
      return 4;
    default:
      throw Object.assign(new Error("UNSUPPORTED_GLB_COMPONENT_TYPE"), {
        reasonCode: "UNSUPPORTED_GLB_COMPONENT_TYPE"
      });
  }
}

function typeComponentCount(type) {
  switch (sanitizeString(type)) {
    case "SCALAR":
      return 1;
    case "VEC2":
      return 2;
    case "VEC3":
      return 3;
    case "VEC4":
      return 4;
    default:
      throw Object.assign(new Error("UNSUPPORTED_GLB_ACCESSOR_TYPE"), {
        reasonCode: "UNSUPPORTED_GLB_ACCESSOR_TYPE"
      });
  }
}

function readAccessorValues({ accessor, bufferView, binaryChunk }) {
  const componentSize = componentByteSize(accessor.componentType);
  const componentsPerItem = typeComponentCount(accessor.type);
  const byteStride =
    Number.isFinite(bufferView.byteStride) && bufferView.byteStride > 0
      ? bufferView.byteStride
      : componentSize * componentsPerItem;
  const startOffset =
    (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const view = new DataView(
    binaryChunk.buffer,
    binaryChunk.byteOffset,
    binaryChunk.byteLength
  );
  const values = [];

  for (let itemIndex = 0; itemIndex < accessor.count; itemIndex += 1) {
    const item = [];
    const itemOffset = startOffset + itemIndex * byteStride;
    for (
      let componentIndex = 0;
      componentIndex < componentsPerItem;
      componentIndex += 1
    ) {
      const componentOffset = itemOffset + componentIndex * componentSize;
      switch (accessor.componentType) {
        case 5126:
          item.push(view.getFloat32(componentOffset, true));
          break;
        case 5125:
          item.push(view.getUint32(componentOffset, true));
          break;
        case 5123:
          item.push(view.getUint16(componentOffset, true));
          break;
        case 5121:
          item.push(view.getUint8(componentOffset));
          break;
        case 5122:
          item.push(view.getInt16(componentOffset, true));
          break;
        case 5120:
          item.push(view.getInt8(componentOffset));
          break;
        default:
          throw Object.assign(new Error("UNSUPPORTED_GLB_COMPONENT_TYPE"), {
            reasonCode: "UNSUPPORTED_GLB_COMPONENT_TYPE"
          });
      }
    }
    values.push(item);
  }

  return values;
}

function materialColorForName(materialName) {
  const normalized = sanitizeString(materialName)?.toUpperCase() ?? "";
  if (normalized.includes("TRUNK")) {
    return [0.47, 0.29, 0.16, 1];
  }
  if (normalized.includes("BRANCH")) {
    return [0.42, 0.28, 0.18, 1];
  }
  if (normalized.includes("DARK")) {
    return [0.18, 0.44, 0.24, 0.96];
  }
  if (normalized.includes("MID")) {
    return [0.28, 0.60, 0.36, 0.96];
  }
  if (normalized.includes("LIGHT")) {
    return [0.46, 0.76, 0.50, 0.94];
  }
  return [0.33, 0.63, 0.37, 0.95];
}

function identityMatrix() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
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

function composeNodeMatrix(node) {
  if (Array.isArray(node?.matrix) && node.matrix.length === 16) {
    return new Float32Array(node.matrix.map((value) => Number(value)));
  }

  const translation = Array.isArray(node?.translation)
    ? node.translation
    : [0, 0, 0];
  const scale = Array.isArray(node?.scale) ? node.scale : [1, 1, 1];
  const rotation = Array.isArray(node?.rotation)
    ? node.rotation
    : [0, 0, 0, 1];
  const [x, y, z, w] = rotation.map(Number);
  const [sx, sy, sz] = scale.map(Number);
  const [tx, ty, tz] = translation.map(Number);

  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;

  return new Float32Array([
    (1 - 2 * (yy + zz)) * sx,
    (2 * (xy + wz)) * sx,
    (2 * (xz - wy)) * sx,
    0,
    (2 * (xy - wz)) * sy,
    (1 - 2 * (xx + zz)) * sy,
    (2 * (yz + wx)) * sy,
    0,
    (2 * (xz + wy)) * sz,
    (2 * (yz - wx)) * sz,
    (1 - 2 * (xx + yy)) * sz,
    0,
    tx,
    ty,
    tz,
    1
  ]);
}

function transformPoint(matrix, point) {
  const [x, y, z] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
  ];
}

function readGlbJsonAndBinary(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 28) {
    throw Object.assign(new Error("INVALID_GLB_BINARY"), {
      reasonCode: "INVALID_GLB_BINARY"
    });
  }

  const header = new DataView(arrayBuffer, 0, 12);
  if (
    header.getUint32(0, true) !== 0x46546c67 ||
    header.getUint32(4, true) !== 2 ||
    header.getUint32(8, true) !== arrayBuffer.byteLength
  ) {
    throw Object.assign(new Error("INVALID_GLB_BINARY"), {
      reasonCode: "INVALID_GLB_BINARY"
    });
  }

  const jsonChunkHeader = new DataView(arrayBuffer, 12, 8);
  const jsonChunkLength = jsonChunkHeader.getUint32(0, true);
  const jsonChunkType = jsonChunkHeader.getUint32(4, true);
  if (jsonChunkType !== 0x4e4f534a) {
    throw Object.assign(new Error("INVALID_GLB_JSON_CHUNK"), {
      reasonCode: "INVALID_GLB_JSON_CHUNK"
    });
  }

  const gltf = JSON.parse(
    new TextDecoder("utf-8")
      .decode(new Uint8Array(arrayBuffer, 20, jsonChunkLength))
      .replace(/\0+$/u, "")
  );

  const binaryChunkHeaderOffset = 20 + jsonChunkLength;
  const binaryChunkHeader = new DataView(arrayBuffer, binaryChunkHeaderOffset, 8);
  const binaryChunkLength = binaryChunkHeader.getUint32(0, true);
  const binaryChunkType = binaryChunkHeader.getUint32(4, true);
  if (binaryChunkType !== 0x004e4942) {
    throw Object.assign(new Error("INVALID_GLB_BINARY_CHUNK"), {
      reasonCode: "INVALID_GLB_BINARY_CHUNK"
    });
  }

  return {
    gltf,
    binaryChunk: new Uint8Array(
      arrayBuffer,
      binaryChunkHeaderOffset + 8,
      binaryChunkLength
    )
  };
}

export function parseTreeEucalyptusApprovedGameplayGlbSceneData(arrayBuffer) {
  const { gltf, binaryChunk } = readGlbJsonAndBinary(arrayBuffer);
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const nodes = Array.isArray(gltf.nodes) ? gltf.nodes : [];
  const materials = Array.isArray(gltf.materials) ? gltf.materials : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
  const sceneIndex = Number.isInteger(gltf.scene) ? gltf.scene : 0;
  const rootScene = Array.isArray(gltf.scenes) ? gltf.scenes[sceneIndex] : null;
  const rootNodeIndexes = Array.isArray(rootScene?.nodes) ? rootScene.nodes : [];

  const drawCalls = [];
  const anchorPoints = [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  function updateBounds([x, y, z]) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  function visitNode(nodeIndex, parentMatrix = identityMatrix()) {
    const node = nodes[nodeIndex];
    if (!node || typeof node !== "object") {
      return;
    }

    const worldMatrix = multiplyMat4(parentMatrix, composeNodeMatrix(node));
    if (Number.isInteger(node.mesh)) {
      const mesh = meshes[node.mesh];
      const nodeRole = sanitizeString(node?.extras?.growgo_component_role);
      for (const primitive of Array.isArray(mesh?.primitives) ? mesh.primitives : []) {
        const positionAccessor = accessors[primitive?.attributes?.POSITION];
        const positionBufferView = bufferViews[positionAccessor?.bufferView];
        if (!positionAccessor || !positionBufferView || positionAccessor.type !== "VEC3") {
          continue;
        }

        const localPositions = readAccessorValues({
          accessor: positionAccessor,
          bufferView: positionBufferView,
          binaryChunk
        });

        const transformedPositions = localPositions.map((point) => {
          const transformed = transformPoint(worldMatrix, point);
          updateBounds(transformed);
          return transformed;
        });

        if (nodeRole === "IDENTITY_ANCHOR") {
          anchorPoints.push(...transformedPositions);
        }

        let triangleIndexes = [];
        if (Number.isInteger(primitive.indices)) {
          const indexAccessor = accessors[primitive.indices];
          const indexBufferView = bufferViews[indexAccessor?.bufferView];
          if (indexAccessor && indexBufferView) {
            triangleIndexes = readAccessorValues({
              accessor: indexAccessor,
              bufferView: indexBufferView,
              binaryChunk
            }).map((entry) => entry[0]);
          }
        } else {
          triangleIndexes = transformedPositions.map((_, index) => index);
        }

        if (triangleIndexes.length < 3) {
          continue;
        }

        const expanded = [];
        for (let index = 0; index + 2 < triangleIndexes.length; index += 3) {
          const a = transformedPositions[triangleIndexes[index]];
          const b = transformedPositions[triangleIndexes[index + 1]];
          const c = transformedPositions[triangleIndexes[index + 2]];
          if (!a || !b || !c) {
            continue;
          }
          expanded.push(...a, ...b, ...c);
        }

        if (expanded.length === 0) {
          continue;
        }

        const materialName =
          materials[primitive.material ?? -1]?.name ??
          mesh?.name ??
          "TREE_EUCALYPTUS_001_MATERIAL";

        drawCalls.push({
          materialName,
          color: materialColorForName(materialName),
          positions: Float32Array.from(expanded)
        });
      }
    }

    for (const childIndex of Array.isArray(node.children) ? node.children : []) {
      visitNode(childIndex, worldMatrix);
    }
  }

  for (const rootNodeIndex of rootNodeIndexes) {
    visitNode(rootNodeIndex, identityMatrix());
  }

  if (
    drawCalls.length === 0 ||
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY) ||
    !Number.isFinite(minZ) ||
    !Number.isFinite(maxZ)
  ) {
    throw Object.assign(new Error("GLB_GEOMETRY_UNAVAILABLE"), {
      reasonCode: "GLB_GEOMETRY_UNAVAILABLE"
    });
  }

  const anchorSource =
    anchorPoints.length > 0
      ? anchorPoints
      : [[(minX + maxX) / 2, minY, (minZ + maxZ) / 2]];
  const anchor = anchorSource.reduce(
    (accumulator, point) => {
      accumulator.x += point[0];
      accumulator.y += point[1];
      accumulator.z += point[2];
      return accumulator;
    },
    { x: 0, y: 0, z: 0 }
  );
  anchor.x /= anchorSource.length;
  anchor.y /= anchorSource.length;
  anchor.z /= anchorSource.length;

  const normalizedDrawCalls = drawCalls.map((drawCall, index) => {
    const adjusted = new Float32Array(drawCall.positions.length);
    for (let positionIndex = 0; positionIndex < drawCall.positions.length; positionIndex += 3) {
      adjusted[positionIndex] = drawCall.positions[positionIndex] - anchor.x;
      adjusted[positionIndex + 1] =
        drawCall.positions[positionIndex + 1] - anchor.y;
      adjusted[positionIndex + 2] =
        drawCall.positions[positionIndex + 2] - anchor.z;
    }
    return deepFreeze({
      drawCallId: `TREE_EUCALYPTUS_001_DRAW_CALL_${String(index + 1).padStart(3, "0")}`,
      materialName: drawCall.materialName,
      color: deepFreeze([...drawCall.color]),
      positions: adjusted,
      vertexCount: adjusted.length / 3
    });
  });

  return deepFreeze({
    assetId:
      sanitizeString(rootScene?.extras?.growgo_asset_id) ??
      DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    assetVersion:
      sanitizeString(rootScene?.extras?.growgo_version) ??
      DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION,
    meshCount: normalizedDrawCalls.length,
    materialCount: materials.length,
    sceneObjectCount: drawCalls.length,
    modelBounds: deepFreeze({
      minX: minX - anchor.x,
      maxX: maxX - anchor.x,
      minY: minY - anchor.y,
      maxY: maxY - anchor.y,
      minZ: minZ - anchor.z,
      maxZ: maxZ - anchor.z,
      width: maxX - minX,
      height: maxY - minY,
      depth: maxZ - minZ
    }),
    drawCalls: deepFreeze(normalizedDrawCalls)
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

function scaleRotationYMatrix(scale, rotationYRadians = 0.22) {
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

function createTrue3DRendererBackend({
  documentObject,
  map,
  sceneData
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
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const listeners = [];

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

  function buildCameraState(anchorLatitude) {
    const heightMeters = Math.max(sceneData.modelBounds.height, 0.001);
    const zoom = Number(map?.getZoom?.() ?? 0);
    const currentMetersPerPixel = metersPerPixel(anchorLatitude, zoom);
    const pixelsPerMeter = 1 / Math.max(currentMetersPerPixel, 0.000001);
    const unitToMeterScale = TARGET_TREE_HEIGHT_METERS / heightMeters;
    const renderScale = pixelsPerMeter * unitToMeterScale * 0.9;
    const scaledHeight = heightMeters * renderScale;
    const cameraPosition = [
      Math.max(36, scaledHeight * 0.55),
      Math.max(72, scaledHeight * 1.15),
      Math.max(120, scaledHeight * 2.2)
    ];
    const target = [0, Math.max(18, scaledHeight * 0.42), 0];
    return {
      pixelsPerMeter,
      renderScale,
      cameraPosition,
      target,
      viewingAngle: "fixed_north_up_oblique",
      fieldOfViewDegrees: VIEW_FOV_DEGREES
    };
  }

  function render({ latitude, longitude }) {
    syncCanvasSize();
    const point = map?.latLngToContainerPoint?.([latitude, longitude]);
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw Object.assign(new Error("ATLAS_TRUE_3D_MAP_PROJECTION_UNAVAILABLE"), {
        reasonCode: "ATLAS_TRUE_3D_MAP_PROJECTION_UNAVAILABLE"
      });
    }

    const anchorNdc = [
      (point.x / canvas.width) * 2 - 1,
      1 - (point.y / canvas.height) * 2
    ];

    const cameraState = buildCameraState(latitude);
    const aspect = canvas.width / canvas.height;
    const projection = perspectiveMatrix(
      (VIEW_FOV_DEGREES * Math.PI) / 180,
      aspect,
      1,
      4000
    );
    const view = lookAtMatrix(
      cameraState.cameraPosition,
      cameraState.target,
      [0, 1, 0]
    );
    const viewProjection = multiplyMat4(projection, view);
    const model = scaleRotationYMatrix(cameraState.renderScale, 0.18);
    const modelOriginProjection = projectPointToNdc(viewProjection, [0, 0, 0]);
    if (!modelOriginProjection) {
      throw Object.assign(new Error("ATLAS_TRUE_3D_CAMERA_PROJECTION_INVALID"), {
        reasonCode: "ATLAS_TRUE_3D_CAMERA_PROJECTION_INVALID"
      });
    }
    const anchorShiftNdc = [
      anchorNdc[0] - modelOriginProjection.ndcX,
      anchorNdc[1] - modelOriginProjection.ndcY
    ];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...CLEAR_COLOR);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.viewProjectionLocation, false, viewProjection);
    gl.uniformMatrix4fv(program.modelLocation, false, model);
    gl.uniform2fv(program.anchorNdcLocation, anchorShiftNdc);
    gl.enableVertexAttribArray(program.positionLocation);

    for (const drawCall of drawCalls) {
      gl.bindBuffer(gl.ARRAY_BUFFER, drawCall.buffer);
      gl.vertexAttribPointer(program.positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(program.colorLocation, drawCall.color);
      gl.drawArrays(gl.TRIANGLES, 0, drawCall.vertexCount);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return deepFreeze({
      projectionMode: "perspective",
      fieldOfViewDegrees: VIEW_FOV_DEGREES,
      cameraPosition: deepFreeze(cameraState.cameraPosition.map((value) => Number(value.toFixed(3)))),
      target: deepFreeze(cameraState.target.map((value) => Number(value.toFixed(3)))),
      viewingAngle: cameraState.viewingAngle,
      renderScale: Number(cameraState.renderScale.toFixed(6)),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
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
    for (const drawCall of drawCalls) {
      if (drawCall.buffer) {
        gl.deleteBuffer(drawCall.buffer);
      }
    }
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
    drawCalls,
    registerListeners,
    removeListeners,
    render,
    destroy
  };
}

async function loadTreeEucalyptusSceneData({ fetchProvider, glbPath }) {
  const response = await fetchProvider(glbPath);
  if (!response || response.ok !== true) {
    throw Object.assign(new Error("APPROVED_ASSET_GLB_FETCH_FAILED"), {
      reasonCode: "APPROVED_ASSET_GLB_FETCH_FAILED"
    });
  }
  const buffer = await response.arrayBuffer();
  return parseTreeEucalyptusApprovedGameplayGlbSceneData(buffer);
}

function resolveApprovedAssetRecord(assetRegistry, assetId) {
  const registryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    assetRegistry,
    assetId
  );
  if (registryEntry.assetId !== DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID) {
    throw Object.assign(new Error("FIRST_APPROVED_ASSET_UNSUPPORTED"), {
      reasonCode: "FIRST_APPROVED_ASSET_UNSUPPORTED"
    });
  }
  return deepFreeze({
    assetId: registryEntry.assetId,
    assetVersion: registryEntry.assetVersion,
    assetReferenceId: registryEntry.assetReferenceId,
    approvedAssetStatus: registryEntry.status,
    assetSource:
      "developer-only-atlas-asset-registry.mjs + true_webgl_renderer_surface",
    runtimePreviewBindingId:
      treeEucalyptusRuntimePreviewBindingDefinition.glbRuntimeLoadId,
    resolvedGlbIdentity:
      treeEucalyptusRuntimePreviewBindingDefinition.glbReference.glbPath,
    representationMode: TRUE_3D_REPRESENTATION_MODE
  });
}

export function createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
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

  function updateRendererStateFromBackend(cameraState = state.cameraState) {
    state.rendererSurfaceCount = rendererBackend ? 1 : 0;
    state.rendererCanvasCount = rendererBackend ? 1 : 0;
    state.sceneObjectCount = rendererBackend ? rendererBackend.drawCalls.length : 0;
    state.modelInstanceCount = rendererBackend && state.liveAssetPresent ? 1 : 0;
    state.ownedListenerCount = rendererBackend ? LISTENER_EVENT_NAMES.length : 0;
    state.renderLoopCount = 0;
    state.glContextCreated = !!rendererBackend;
    state.true3dRendererReady = !!rendererBackend;
    state.cameraState = cameraState ?? null;
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
    const sceneData = await loadTreeEucalyptusSceneData({
      fetchProvider,
      glbPath: approvedAssetRecord.resolvedGlbIdentity
    });
    sceneDataCache.set(cacheKey, sceneData);
    return sceneData;
  }

  function destroyRendererBackend() {
    if (!rendererBackend) {
      updateRendererStateFromBackend(null);
      return;
    }
    rendererBackend.destroy();
    rendererBackend = null;
    updateRendererStateFromBackend(null);
  }

  async function placeOrUpdate({
    assetId = DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    latitude,
    longitude
  } = {}) {
    state.lastOperation = "place_or_update";
    const latitudeValue = sanitizeNumber(latitude);
    const longitudeValue = sanitizeNumber(longitude);
    if (latitudeValue == null || longitudeValue == null) {
      state.lastReasonCode = "APPROVED_ASSET_COORDINATE_INVALID";
      state.loaderStatus = "blocked";
      state.loaderReason = "APPROVED_ASSET_COORDINATE_INVALID";
      return buildResult(state, "blocked", "APPROVED_ASSET_COORDINATE_INVALID");
    }

    let approvedAssetRecord;
    let liveMap;
    try {
      liveMap = ensureAttachedLiveMap();
      approvedAssetRecord = resolveApprovedAssetRecord(assetRegistry, assetId);
    } catch (error) {
      const reasonCode = error?.reasonCode ?? "FIRST_APPROVED_ASSET_RESOLUTION_FAILED";
      state.lastReasonCode = reasonCode;
      state.loaderStatus = "blocked";
      state.loaderReason = reasonCode;
      return buildResult(state, "blocked", reasonCode);
    }

    try {
      const wasPresent = state.liveAssetPresent === true;
      state.loaderStatus = "loading_actual_glb";
      state.loaderReason = null;
      const sceneData = await resolveSceneData(approvedAssetRecord);
      if (!rendererBackend) {
        rendererBackend = createTrue3DRendererBackend({
          documentObject,
          map: liveMap,
          sceneData
        });
        rendererBackend.registerListeners(() => {
          if (!state.liveAssetPresent) {
            return;
          }
          try {
            const cameraState = rendererBackend.render({
              latitude: state.latitude,
              longitude: state.longitude
            });
            updateRendererStateFromBackend(cameraState);
          } catch (_error) {
            // remain fail-closed without introducing retries
          }
        });
      }

      const cameraState = rendererBackend.render({
        latitude: latitudeValue,
        longitude: longitudeValue
      });

      state.selectedAssetId = approvedAssetRecord.assetId;
      state.selectedAssetVersion = approvedAssetRecord.assetVersion;
      state.approvedAssetStatus = approvedAssetRecord.approvedAssetStatus;
      state.assetReferenceId = approvedAssetRecord.assetReferenceId;
      state.assetSource = approvedAssetRecord.assetSource;
      state.runtimePreviewBindingId = approvedAssetRecord.runtimePreviewBindingId;
      state.resolvedGlbIdentity = approvedAssetRecord.resolvedGlbIdentity;
      state.modelInstanceId = DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID;
      state.liveAssetPresent = true;
      state.latitude = latitudeValue;
      state.longitude = longitudeValue;
      state.representationMode = approvedAssetRecord.representationMode;
      state.loaderStatus = "loaded_actual_glb";
      state.loaderReason = "ACTUAL_GLB_LOADED";
      state.actualGlbLoaded = true;
      state.meshCount = sceneData.meshCount;
      state.materialCount = sceneData.materialCount;
      updateRendererStateFromBackend(cameraState);
      state.lastReasonCode = rendererBackend ? "ATLAS_TRUE_3D_RENDERED" : "ATLAS_TRUE_3D_READY";

      return buildResult(
        state,
        wasPresent ? "updated" : "created",
        "ATLAS_TRUE_3D_RENDERED",
        {
          loaderResult: deepFreeze({
            loaderStatus: state.loaderStatus,
            loaderReason: state.loaderReason,
            actualGlbLoaded: state.actualGlbLoaded,
            meshCount: state.meshCount,
            materialCount: state.materialCount
          })
        }
      );
    } catch (error) {
      destroyRendererBackend();
      state.liveAssetPresent = false;
      state.loaderStatus = "failed_closed";
      state.loaderReason =
        error?.reasonCode ?? "APPROVED_ASSET_TRUE_3D_RENDER_FAILED";
      state.actualGlbLoaded = false;
      state.lastReasonCode = state.loaderReason;
      return buildResult(state, "failed_closed", state.loaderReason);
    }
  }

  function clear() {
    state.lastOperation = "clear";
    destroyRendererBackend();
    state.liveAssetPresent = false;
    state.lastReasonCode = "APPROVED_ASSET_REMOVED";
    return buildResult(state, "removed", "APPROVED_ASSET_REMOVED");
  }

  function getStatus() {
    return buildStatus(state);
  }

  return deepFreeze({
    placeFirstApprovedLiveAsset: placeOrUpdate,
    updateFirstApprovedLiveAsset: placeOrUpdate,
    clearFirstApprovedLiveAsset: clear,
    getFirstApprovedLiveAssetStatus: getStatus
  });
}
