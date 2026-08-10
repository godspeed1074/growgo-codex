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
export const DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID =
  "ATLAS_APPROVED_ASSET_TREE_EUCALYPTUS_001_001";

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
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

function createState() {
  return {
    selectedAssetId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    selectedAssetVersion: DEFAULT_FIRST_APPROVED_LIVE_ASSET_VERSION,
    approvedAssetStatus: null,
    assetReferenceId: null,
    assetSource: null,
    runtimePreviewBindingId: null,
    resolvedGlbIdentity: null,
    primitiveObjectId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID,
    liveAssetPresent: false,
    latitude: null,
    longitude: null,
    representationMode: null,
    loaderStatus: "idle",
    loaderReason: null,
    actualGlbLoaded: false,
    meshCount: 0,
    materialCount: 0,
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
    primitiveObjectId: state.primitiveObjectId,
    liveAssetPresent: state.liveAssetPresent,
    latitude: state.latitude,
    longitude: state.longitude,
    representationMode: state.representationMode,
    loaderStatus: state.loaderStatus,
    loaderReason: state.loaderReason,
    actualGlbLoaded: state.actualGlbLoaded,
    meshCount: state.meshCount,
    materialCount: state.materialCount,
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

function readAccessorValues({
  accessor,
  bufferView,
  binaryChunk
}) {
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
    for (let componentIndex = 0; componentIndex < componentsPerItem; componentIndex += 1) {
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

function hueForMaterialName(materialName) {
  const normalized = sanitizeString(materialName)?.toUpperCase() ?? "";
  if (normalized.includes("TRUNK") || normalized.includes("BRANCH")) {
    return "#7A4F2F";
  }
  if (normalized.includes("DARK")) {
    return "#2E6F3E";
  }
  if (normalized.includes("MID")) {
    return "#4A925B";
  }
  if (normalized.includes("LIGHT")) {
    return "#6FBE7D";
  }
  return "#4E9B5F";
}

function convexHull(points) {
  if (!Array.isArray(points) || points.length < 3) {
    return points ?? [];
  }

  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x
  );

  const cross = (origin, a, b) =>
    (a.x - origin.x) * (b.y - origin.y) -
    (a.y - origin.y) * (b.x - origin.x);

  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export function parseTreeEucalyptusApprovedGameplayGlbProjection(arrayBuffer) {
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

  const chunkHeader = new DataView(arrayBuffer, 12, 8);
  const jsonChunkLength = chunkHeader.getUint32(0, true);
  const jsonChunkType = chunkHeader.getUint32(4, true);
  if (jsonChunkType !== 0x4e4f534a) {
    throw Object.assign(new Error("INVALID_GLB_JSON_CHUNK"), {
      reasonCode: "INVALID_GLB_JSON_CHUNK"
    });
  }

  const jsonText = new TextDecoder("utf-8")
    .decode(new Uint8Array(arrayBuffer, 20, jsonChunkLength))
    .replace(/\0+$/u, "");
  const gltf = JSON.parse(jsonText);

  const binaryChunkHeaderOffset = 20 + jsonChunkLength;
  const binaryChunkHeader = new DataView(arrayBuffer, binaryChunkHeaderOffset, 8);
  const binaryChunkLength = binaryChunkHeader.getUint32(0, true);
  const binaryChunkType = binaryChunkHeader.getUint32(4, true);
  if (binaryChunkType !== 0x004e4942) {
    throw Object.assign(new Error("INVALID_GLB_BINARY_CHUNK"), {
      reasonCode: "INVALID_GLB_BINARY_CHUNK"
    });
  }

  const binaryChunk = new Uint8Array(
    arrayBuffer,
    binaryChunkHeaderOffset + 8,
    binaryChunkLength
  );

  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
  const materials = Array.isArray(gltf.materials) ? gltf.materials : [];

  const projectedMeshes = [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let vertexCount = 0;

  for (const mesh of meshes) {
    for (const primitive of Array.isArray(mesh.primitives) ? mesh.primitives : []) {
      const positionAccessorIndex = primitive?.attributes?.POSITION;
      if (!Number.isInteger(positionAccessorIndex)) {
        continue;
      }
      const accessor = accessors[positionAccessorIndex];
      const bufferView = bufferViews[accessor?.bufferView];
      if (!accessor || !bufferView || accessor.type !== "VEC3") {
        continue;
      }

      const positions = readAccessorValues({
        accessor,
        bufferView,
        binaryChunk
      });

      const projectedPoints = positions.map(([x, y, z]) => {
        const projectedX = x - z * 0.28;
        const projectedY = -y + z * 0.16;
        minX = Math.min(minX, projectedX);
        minY = Math.min(minY, projectedY);
        maxX = Math.max(maxX, projectedX);
        maxY = Math.max(maxY, projectedY);
        return { x: projectedX, y: projectedY };
      });

      vertexCount += positions.length;
      const hull = convexHull(projectedPoints);
      if (hull.length < 3) {
        continue;
      }

      const materialName =
        materials[primitive.material ?? -1]?.name ??
        mesh?.name ??
        "TREE_EUCALYPTUS_001_MATERIAL";
      const averageY =
        hull.reduce((sum, point) => sum + point.y, 0) / hull.length;
      projectedMeshes.push({
        materialName,
        fill: hueForMaterialName(materialName),
        averageY,
        hull
      });
    }
  }

  if (projectedMeshes.length === 0 || !Number.isFinite(minX) || !Number.isFinite(maxX)) {
    throw Object.assign(new Error("GLB_GEOMETRY_UNAVAILABLE"), {
      reasonCode: "GLB_GEOMETRY_UNAVAILABLE"
    });
  }

  const width = Math.max(maxX - minX, 0.001);
  const height = Math.max(maxY - minY, 0.001);
  const projectedPolygons = projectedMeshes
    .sort((a, b) => a.averageY - b.averageY)
    .map((entry, index) => ({
      polygonId: `TREE_EUCALYPTUS_001_PROJECTED_POLYGON_${String(index + 1).padStart(3, "0")}`,
      materialName: entry.materialName,
      fill: entry.fill,
      points: entry.hull.map((point) => ({
        x: ((point.x - minX) / width) * 84 + 6,
        y: ((point.y - minY) / height) * 104 + 6
      }))
    }));

  return deepFreeze({
    meshCount: projectedMeshes.length,
    materialCount: materials.length,
    vertexCount,
    width,
    height,
    projectedPolygons
  });
}

export function buildTreeEucalyptusActualGlbSvg(projection) {
  const polygons = projection.projectedPolygons
    .map(
      (polygon) =>
        `<polygon points="${polygon.points
          .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
          .join(" ")}" fill="${polygon.fill}" stroke="rgba(255,255,255,0.28)" stroke-width="1.1" stroke-linejoin="round" />`
    )
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="128" viewBox="0 0 96 128">
      <rect x="0" y="0" width="96" height="128" fill="transparent"/>
      ${polygons}
      <rect x="40" y="104" width="16" height="10" rx="2" fill="#6c462a" opacity="0.92"/>
    </svg>
  `;
}

async function loadTreeEucalyptusActualGlbProjection({
  fetchProvider,
  glbPath
}) {
  const response = await fetchProvider(glbPath);
  if (!response || response.ok !== true) {
    throw Object.assign(new Error("APPROVED_ASSET_GLB_FETCH_FAILED"), {
      reasonCode: "APPROVED_ASSET_GLB_FETCH_FAILED"
    });
  }
  const buffer = await response.arrayBuffer();
  return parseTreeEucalyptusApprovedGameplayGlbProjection(buffer);
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
      "developer-only-atlas-asset-registry.mjs + actual TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    runtimePreviewBindingId:
      treeEucalyptusRuntimePreviewBindingDefinition.glbRuntimeLoadId,
    resolvedGlbIdentity:
      treeEucalyptusRuntimePreviewBindingDefinition.glbReference.glbPath,
    representationMode: "actual_glb_projected_mesh_overlay"
  });
}

export function createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
  primitiveLayer,
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  fetchProvider = (...args) => globalThis.fetch(...args)
} = {}) {
  const state = createState();
  const loadedProjectionCache = new Map();

  async function resolveActualGlbSprite(approvedAssetRecord) {
    const cacheKey = approvedAssetRecord.resolvedGlbIdentity;
    if (loadedProjectionCache.has(cacheKey)) {
      return loadedProjectionCache.get(cacheKey);
    }

    const projection = await loadTreeEucalyptusActualGlbProjection({
      fetchProvider,
      glbPath: approvedAssetRecord.resolvedGlbIdentity
    });
    const svg = buildTreeEucalyptusActualGlbSvg(projection);
    const resolved = deepFreeze({
      projection,
      svg
    });
    loadedProjectionCache.set(cacheKey, resolved);
    return resolved;
  }

  async function placeOrUpdate({
    assetId = DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    latitude,
    longitude
  } = {}) {
    state.lastOperation = "place_or_update";
    const latitudeValue = sanitizeNumber(latitude);
    const longitudeValue = sanitizeNumber(longitude);
    if (!primitiveLayer || typeof primitiveLayer.upsertAtlasVisualPrimitive !== "function") {
      state.lastReasonCode = "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE";
      state.loaderStatus = "blocked";
      state.loaderReason = "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE";
      return buildResult(state, "blocked", "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE");
    }
    if (latitudeValue == null || longitudeValue == null) {
      state.lastReasonCode = "APPROVED_ASSET_COORDINATE_INVALID";
      state.loaderStatus = "blocked";
      state.loaderReason = "APPROVED_ASSET_COORDINATE_INVALID";
      return buildResult(state, "blocked", "APPROVED_ASSET_COORDINATE_INVALID");
    }

    let approvedAssetRecord;
    try {
      approvedAssetRecord = resolveApprovedAssetRecord(assetRegistry, assetId);
    } catch (error) {
      state.lastReasonCode =
        error?.reasonCode ?? "FIRST_APPROVED_ASSET_RESOLUTION_FAILED";
      state.loaderStatus = "blocked";
      state.loaderReason = state.lastReasonCode;
      return buildResult(state, "blocked", state.lastReasonCode);
    }

    try {
      state.loaderStatus = "loading_actual_glb";
      state.loaderReason = null;
      const actualGlbSprite = await resolveActualGlbSprite(approvedAssetRecord);

      const primitiveResult = primitiveLayer.upsertAtlasVisualPrimitive({
        primitiveId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID,
        primitiveType: "sprite_image",
        latitude: latitudeValue,
        longitude: longitudeValue,
        label: `${approvedAssetRecord.assetId} ${approvedAssetRecord.assetVersion}`,
        spriteSvg: actualGlbSprite.svg,
        metadata: {
          atlasApprovedAssetId: approvedAssetRecord.assetId,
          atlasApprovedAssetVersion: approvedAssetRecord.assetVersion,
          atlasApprovedAssetStatus: approvedAssetRecord.approvedAssetStatus,
          atlasApprovedAssetReferenceId: approvedAssetRecord.assetReferenceId,
          atlasApprovedAssetRepresentationMode:
            approvedAssetRecord.representationMode,
          atlasApprovedAssetLoaderStatus: "loaded_actual_glb"
        },
        iconWidth: 96,
        iconHeight: 132,
        iconAnchorX: 48,
        iconAnchorY: 110
      });

      state.selectedAssetId = approvedAssetRecord.assetId;
      state.selectedAssetVersion = approvedAssetRecord.assetVersion;
      state.approvedAssetStatus = approvedAssetRecord.approvedAssetStatus;
      state.assetReferenceId = approvedAssetRecord.assetReferenceId;
      state.assetSource = approvedAssetRecord.assetSource;
      state.runtimePreviewBindingId = approvedAssetRecord.runtimePreviewBindingId;
      state.resolvedGlbIdentity = approvedAssetRecord.resolvedGlbIdentity;
      state.primitiveObjectId = DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID;
      state.liveAssetPresent =
        primitiveResult.outcome === "created" ||
        primitiveResult.outcome === "updated";
      state.latitude = latitudeValue;
      state.longitude = longitudeValue;
      state.representationMode = approvedAssetRecord.representationMode;
      state.loaderStatus = "loaded_actual_glb";
      state.loaderReason = "ACTUAL_GLB_LOADED";
      state.actualGlbLoaded = true;
      state.meshCount = actualGlbSprite.projection.meshCount;
      state.materialCount = actualGlbSprite.projection.materialCount;
      state.lastReasonCode = primitiveResult.reasonCode ?? "APPROVED_ASSET_PLACED";

      return buildResult(
        state,
        primitiveResult.outcome === "updated" ? "updated" : "created",
        primitiveResult.reasonCode ?? "APPROVED_ASSET_PLACED",
        {
          primitiveResult,
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
      state.liveAssetPresent = false;
      state.loaderStatus = "failed_closed";
      state.loaderReason =
        error?.reasonCode ?? "APPROVED_ASSET_GLB_LOAD_FAILED";
      state.actualGlbLoaded = false;
      state.lastReasonCode = state.loaderReason;
      return buildResult(state, "failed_closed", state.loaderReason);
    }
  }

  function clear() {
    state.lastOperation = "clear";
    if (!primitiveLayer || typeof primitiveLayer.removeAtlasVisualPrimitive !== "function") {
      state.lastReasonCode = "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE";
      return buildResult(state, "blocked", "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE");
    }

    const primitiveResult = primitiveLayer.removeAtlasVisualPrimitive({
      primitiveId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID
    });

    state.liveAssetPresent = false;
    state.lastReasonCode = primitiveResult.reasonCode ?? "APPROVED_ASSET_REMOVED";

    return buildResult(state, primitiveResult.outcome, state.lastReasonCode, {
      primitiveResult
    });
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
