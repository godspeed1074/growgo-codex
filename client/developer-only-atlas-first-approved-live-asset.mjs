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

function buildTreeEucalyptusSpriteSvg() {
  const points =
    treeEucalyptusRuntimePreviewBindingDefinition.meshResult.projectedVertices
      .map((vertex) => {
        const x = (vertex.x * 28 + 2).toFixed(1);
        const y = (vertex.y * 22 + 4).toFixed(1);
        return `${x},${y}`;
      })
      .join(" ");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32">
      <rect x="13.6" y="14" width="4.8" height="12" rx="1.8" fill="#7a4f2f"/>
      <polygon points="${points}" fill="#3f9a57" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="11" cy="11" r="4.5" fill="#6cc884" opacity="0.92"/>
      <circle cx="20" cy="9.5" r="4.2" fill="#4fb36b" opacity="0.92"/>
    </svg>
  `;
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
      "developer-only-atlas-asset-registry.mjs + asset-factory/tree-eucalyptus-runtime-preview-binding.mjs",
    runtimePreviewBindingId:
      treeEucalyptusRuntimePreviewBindingDefinition.glbRuntimeLoadId,
    resolvedGlbIdentity:
      treeEucalyptusRuntimePreviewBindingDefinition.glbReference.glbPath,
    representationMode: "approved_asset_runtime_preview_sprite",
    spriteSvg: buildTreeEucalyptusSpriteSvg()
  });
}

export function createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
  primitiveLayer,
  assetRegistry = createDeveloperOnlyAtlasAssetRegistry()
} = {}) {
  const state = createState();

  function placeOrUpdate({
    assetId = DEFAULT_FIRST_APPROVED_LIVE_ASSET_ID,
    latitude,
    longitude
  } = {}) {
    state.lastOperation = "place_or_update";
    const latitudeValue = sanitizeNumber(latitude);
    const longitudeValue = sanitizeNumber(longitude);
    if (!primitiveLayer || typeof primitiveLayer.upsertAtlasVisualPrimitive !== "function") {
      state.lastReasonCode = "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE";
      return buildResult(state, "blocked", "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE");
    }
    if (latitudeValue == null || longitudeValue == null) {
      state.lastReasonCode = "APPROVED_ASSET_COORDINATE_INVALID";
      return buildResult(state, "blocked", "APPROVED_ASSET_COORDINATE_INVALID");
    }

    let approvedAssetRecord;
    try {
      approvedAssetRecord = resolveApprovedAssetRecord(assetRegistry, assetId);
    } catch (error) {
      state.lastReasonCode =
        error?.reasonCode ?? "FIRST_APPROVED_ASSET_RESOLUTION_FAILED";
      return buildResult(state, "blocked", state.lastReasonCode);
    }

    const primitiveResult = primitiveLayer.upsertAtlasVisualPrimitive({
      primitiveId: DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID,
      primitiveType: "sprite_image",
      latitude: latitudeValue,
      longitude: longitudeValue,
      label: `${approvedAssetRecord.assetId} ${approvedAssetRecord.assetVersion}`,
      spriteSvg: approvedAssetRecord.spriteSvg,
      metadata: {
        atlasApprovedAssetId: approvedAssetRecord.assetId,
        atlasApprovedAssetVersion: approvedAssetRecord.assetVersion,
        atlasApprovedAssetStatus: approvedAssetRecord.approvedAssetStatus,
        atlasApprovedAssetReferenceId: approvedAssetRecord.assetReferenceId,
        atlasApprovedAssetRepresentationMode: approvedAssetRecord.representationMode
      }
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
      primitiveResult.outcome === "created" || primitiveResult.outcome === "updated";
    state.latitude = latitudeValue;
    state.longitude = longitudeValue;
    state.representationMode = approvedAssetRecord.representationMode;
    state.lastReasonCode = primitiveResult.reasonCode ?? "APPROVED_ASSET_PLACED";

    return buildResult(
      state,
      primitiveResult.outcome === "updated" ? "updated" : "created",
      primitiveResult.reasonCode ?? "APPROVED_ASSET_PLACED",
      { primitiveResult }
    );
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
