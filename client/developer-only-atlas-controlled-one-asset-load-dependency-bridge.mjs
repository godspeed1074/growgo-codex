import {
  DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS
} from "./developer-only-atlas-controlled-existing-asset-binding-contract.mjs";
import {
  createTreeEucalyptusRuntimePreviewBinding,
  treeEucalyptusRuntimePreviewBindingDefinition
} from "../asset-factory/tree-eucalyptus-runtime-preview-binding.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_RESULT_001";

export const CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_LOADER_ID =
  "ATLAS_CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_TREE_EUCALYPTUS_001";

export const DEFAULT_CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_ASSET_ID =
  "TREE_EUCALYPTUS_001";

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

function normalizeManifestIdentity(assetId, version) {
  const cleanAssetId = sanitizeString(assetId)?.replace(/[^A-Za-z0-9]+/g, "_");
  const cleanVersion = sanitizeString(version)?.replace(/[^A-Za-z0-9]+/g, "_");
  if (!cleanAssetId || !cleanVersion) {
    return null;
  }
  return `EXISTING_ASSET_MANIFEST_${cleanAssetId}_${cleanVersion}`;
}

function createState() {
  return {
    oneAssetLiveDrawAssetLoadDependencyStatus: "idle",
    selectedAssetLoaderId: CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_LOADER_ID,
    selectedExistingAssetId: null,
    resolvedGlbIdentity: null,
    assetLoadDependencyReason: null,
    manifestIdentity: null,
    resolvedLodProfile: null,
    assetLoadAttemptCount: 0,
    assetLoadCompletedCount: 0
  };
}

function cloneStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    oneAssetLiveDrawAssetLoadDependencyStatus:
      state.oneAssetLiveDrawAssetLoadDependencyStatus,
    selectedAssetLoaderId: state.selectedAssetLoaderId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    assetLoadDependencyReason: state.assetLoadDependencyReason,
    manifestIdentity: state.manifestIdentity,
    resolvedLodProfile: state.resolvedLodProfile,
    assetLoadAttemptCount: state.assetLoadAttemptCount,
    assetLoadCompletedCount: state.assetLoadCompletedCount,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function toResult(outcome, reasonCode, state, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    outcome,
    reasonCode,
    oneAssetLiveDrawAssetLoadDependencyStatus:
      state.oneAssetLiveDrawAssetLoadDependencyStatus,
    selectedAssetLoaderId: state.selectedAssetLoaderId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    assetLoadDependencyReason: state.assetLoadDependencyReason,
    manifestIdentity: state.manifestIdentity,
    resolvedLodProfile: state.resolvedLodProfile,
    assetLoadAttemptCount: state.assetLoadAttemptCount,
    assetLoadCompletedCount: state.assetLoadCompletedCount,
    canonicalSafetyFlags: canonicalSafetyFlags(),
    ...extra
  });
}

function buildApprovedAssetMap(records) {
  return new Map(
    records.map((record) => [record.assetId, deepFreeze({ ...record })])
  );
}

export function createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge({
  approvedExistingAssetRecords =
    DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS,
  runtimePreviewBindingDefinition = treeEucalyptusRuntimePreviewBindingDefinition
} = {}) {
  const state = createState();
  const approvedAssets = buildApprovedAssetMap(approvedExistingAssetRecords);
  const runtimePreviewBinding = createTreeEucalyptusRuntimePreviewBinding(
    runtimePreviewBindingDefinition
  );

  function getControlledOneAssetLiveDrawAssetLoadDependencyStatus() {
    return cloneStatus(state);
  }

  function loadControlledOneAssetLiveDrawAssetDependency({
    rendererHandoff,
    approvedAssetRecord,
    resolvedAsset
  } = {}) {
    state.assetLoadAttemptCount += 1;

    const selectedExistingAssetId = sanitizeString(
      approvedAssetRecord?.assetId ??
        rendererHandoff?.selectedExistingAssetId ??
        resolvedAsset?.selectedExistingAssetId
    );

    state.selectedExistingAssetId = selectedExistingAssetId;
    state.selectedAssetLoaderId = CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_LOADER_ID;

    if (selectedExistingAssetId !== DEFAULT_CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_ASSET_ID) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "ASSET_MISSING";
      return toResult("blocked", "ASSET_MISSING", state);
    }

    const approvedRecord =
      approvedAssets.get(selectedExistingAssetId) ??
      (approvedAssetRecord && sanitizeString(approvedAssetRecord.assetId) === selectedExistingAssetId
        ? deepFreeze({ ...approvedAssetRecord })
        : null);

    if (!approvedRecord) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "ASSET_MISSING";
      return toResult("blocked", "ASSET_MISSING", state);
    }

    const runtimeAssetId = sanitizeString(runtimePreviewBinding.assetId);
    const runtimeGlbIdentity = sanitizeString(
      runtimePreviewBinding.glbReference?.glbPath
    );
    const runtimeLodKey = sanitizeString(runtimePreviewBinding.glbReference?.lodKey);
    const runtimeManifestReference = sanitizeString(
      runtimePreviewBinding.glbReference?.manifestReference
    );
    const runtimeMetadataReference = sanitizeString(
      runtimePreviewBinding.glbReference?.metadataReference
    );
    const resolvedGlbIdentity = sanitizeString(
      rendererHandoff?.resolvedGlbIdentity ??
        resolvedAsset?.resolvedGlbIdentity ??
        approvedRecord.resolvedGlbIdentity
    );
    const resolvedLodProfile = sanitizeString(
      rendererHandoff?.resolvedLodProfile ??
        resolvedAsset?.resolvedLodProfile ??
        approvedRecord.resolvedLodProfile
    );
    const manifestIdentity = normalizeManifestIdentity(
      runtimeAssetId,
      approvedRecord.manifestVersion
    );

    state.resolvedGlbIdentity = resolvedGlbIdentity;
    state.resolvedLodProfile = resolvedLodProfile;
    state.manifestIdentity = manifestIdentity;

    if (runtimeAssetId !== approvedRecord.assetId) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "ASSET_IDENTITY_MISMATCH";
      return toResult("blocked", "ASSET_IDENTITY_MISMATCH", state);
    }

    if (resolvedGlbIdentity !== approvedRecord.resolvedGlbIdentity) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "GLB_IDENTITY_MISMATCH";
      return toResult("blocked", "GLB_IDENTITY_MISMATCH", state);
    }

    if (runtimeGlbIdentity !== approvedRecord.resolvedGlbIdentity) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "GLB_MISSING";
      return toResult("blocked", "GLB_MISSING", state);
    }

    if (resolvedLodProfile !== approvedRecord.resolvedLodProfile) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "LOD_IDENTITY_MISMATCH";
      return toResult("blocked", "LOD_IDENTITY_MISMATCH", state);
    }

    if (runtimeLodKey !== "LOD_GAMEPLAY") {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "LOD_IDENTITY_MISMATCH";
      return toResult("blocked", "LOD_IDENTITY_MISMATCH", state);
    }

    if (manifestIdentity !== approvedRecord.manifestIdentity) {
      state.oneAssetLiveDrawAssetLoadDependencyStatus = "blocked";
      state.assetLoadDependencyReason = "MANIFEST_IDENTITY_MISMATCH";
      return toResult("blocked", "MANIFEST_IDENTITY_MISMATCH", state);
    }

    state.oneAssetLiveDrawAssetLoadDependencyStatus = "resolved";
    state.assetLoadDependencyReason =
      "CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_RESOLVED";
    state.assetLoadCompletedCount += 1;

    return toResult(
      "resolved",
      "CONTROLLED_ONE_ASSET_LOAD_DEPENDENCY_RESOLVED",
      state,
      {
        assetLoadStatus: "resolved_dependency_bridge",
        selectedExistingAssetId: approvedRecord.assetId,
        resolvedGlbIdentity: approvedRecord.resolvedGlbIdentity,
        resolvedLodProfile: approvedRecord.resolvedLodProfile,
        manifestIdentity: approvedRecord.manifestIdentity,
        glbReference: runtimeGlbIdentity,
        manifestReference: runtimeManifestReference,
        metadataReference: runtimeMetadataReference,
        runtimePreviewBindingState: runtimePreviewBinding.loaderState?.currentState ?? null,
        runtimePreviewFallbackEnabled:
          runtimePreviewBinding.loaderState?.fallbackEnabled === true
      }
    );
  }

  return deepFreeze({
    getControlledOneAssetLiveDrawAssetLoadDependencyStatus,
    loadControlledOneAssetLiveDrawAssetDependency
  });
}
