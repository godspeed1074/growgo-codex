import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs";
import {
  consumePassiveRendererPayload
} from "../asset-factory/passive-renderer-consumer.mjs";
import {
  treeEucalyptusGlbImportBridgeFoundationDefinition
} from "../asset-factory/tree-eucalyptus-glb-import-bridge-foundation.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_RESULT_001";

export const CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_ID =
  "ATLAS_CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_TREE_EUCALYPTUS_001";

const SUPPORTED_ASSET_ID = "TREE_EUCALYPTUS_001";
const EXPECTED_RENDERER_ID = "GROWGO_CUSTOM_25D_MAP_EXPERIMENT";
const EXPECTED_RENDERER_PROFILE = "custom-2.5d-passive";
const EXPECTED_RENDERER_SUBMIT_AVAILABILITY_STATUS =
  "available_existing_passive_renderer_consumer";
const EXPECTED_COMPONENT_REFERENCES = Object.freeze([
  Object.freeze({
    componentId: "TREE_EUCALYPTUS_001_CANOPY_CLUSTER_001",
    rendererComponentKey: "canopy_cluster",
    rendererComponentCategory: "vegetation_canopy"
  })
]);

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

function toPermanentPayloadId(value, fallback) {
  const sanitized = sanitizeString(value)
    ?.toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (sanitized && /_[0-9]{3,}$/.test(sanitized)) {
    return sanitized;
  }

  return fallback;
}

function createState() {
  return {
    oneAssetLiveDrawRendererSubmitDependencyStatus: "idle",
    rendererSubmitDependencyId: CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_ID,
    rendererSubmitAvailabilityStatus: EXPECTED_RENDERER_SUBMIT_AVAILABILITY_STATUS,
    selectedExistingAssetId: null,
    rendererSubmitReason: null,
    submitAttemptCount: 0,
    submitCompletedCount: 0
  };
}

function cloneStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    oneAssetLiveDrawRendererSubmitDependencyStatus:
      state.oneAssetLiveDrawRendererSubmitDependencyStatus,
    rendererSubmitDependencyId: state.rendererSubmitDependencyId,
    rendererSubmitAvailabilityStatus: state.rendererSubmitAvailabilityStatus,
    selectedExistingAssetId: state.selectedExistingAssetId,
    rendererSubmitReason: state.rendererSubmitReason,
    submitAttemptCount: state.submitAttemptCount,
    submitCompletedCount: state.submitCompletedCount,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function toResult(outcome, reasonCode, state, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    outcome,
    reasonCode,
    oneAssetLiveDrawRendererSubmitDependencyStatus:
      state.oneAssetLiveDrawRendererSubmitDependencyStatus,
    rendererSubmitDependencyId: state.rendererSubmitDependencyId,
    rendererSubmitAvailabilityStatus: state.rendererSubmitAvailabilityStatus,
    selectedExistingAssetId: state.selectedExistingAssetId,
    rendererSubmitReason: state.rendererSubmitReason,
    submitAttemptCount: state.submitAttemptCount,
    submitCompletedCount: state.submitCompletedCount,
    canonicalSafetyFlags: canonicalSafetyFlags(),
    ...extra
  });
}

function buildPassiveRendererPayload({
  rendererHandoff,
  approvedAssetRecord
}) {
  const descriptor = rendererHandoff?.rendererPlacementDescriptor;
  const projectedPlacementData = descriptor?.projectedPlacementData;
  const position = projectedPlacementData?.position;
  const orientation = sanitizeString(
    rendererHandoff?.heading ?? rendererHandoff?.rotation ?? "0"
  );

  return deepFreeze({
    rendererAssetReference: {
      assetId: approvedAssetRecord.assetId,
      manifestId: toPermanentPayloadId(
        approvedAssetRecord.manifestIdentity,
        "TREE_EUCALYPTUS_001_MANIFEST_PAYLOAD_001"
      ),
      recipeId: "TREE_EUCALYPTUS_001_RENDERER_SUBMIT_RECIPE_001",
      rendererCategory: "vegetation",
      rendererLayer: "ground_cover"
    },
    rendererComponentReferences: EXPECTED_COMPONENT_REFERENCES,
    transformData: {
      position: {
        x: Number(position?.x),
        y: Number(position?.y)
      },
      orientation,
      alignmentRule: "atlas_existing_asset_world_projection",
      placementRuleId: "TREE_EUCALYPTUS_001_EXISTING_ASSET_PLACEMENT_001",
      locationId:
        sanitizeString(descriptor?.sourceFeatureId) ??
        sanitizeString(rendererHandoff?.sourceFeatureId) ??
        "TREE_EUCALYPTUS_001_LOCATION_001"
    },
    orientation,
    metadata: {
      adapterProfile: EXPECTED_RENDERER_PROFILE,
      assetMetadata: {
        selectedExistingAssetId: approvedAssetRecord.assetId,
        resolvedGlbIdentity: approvedAssetRecord.resolvedGlbIdentity,
        resolvedLodProfile: approvedAssetRecord.resolvedLodProfile
      },
      manifestMetadata: {
        manifestIdentity: approvedAssetRecord.manifestIdentity
      },
      recipeMetadata: {
        recipeId: "TREE_EUCALYPTUS_001_RENDERER_SUBMIT_RECIPE_001"
      },
      placementMetadata: {
        sourceWorldPlacementPacketId:
          sanitizeString(rendererHandoff?.sourceWorldPlacementPacketId) ?? null,
        sourceFeatureId:
          sanitizeString(descriptor?.sourceFeatureId) ??
          sanitizeString(rendererHandoff?.sourceFeatureId) ??
          null
      }
    }
  });
}

export function createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge({
  rendererConsumerDescriptor =
    createDiscoveredGrowGoCustom25DRendererConsumerDescriptor(),
  passiveRendererConsumer = consumePassiveRendererPayload,
  treeRuntimeImportBridge = treeEucalyptusGlbImportBridgeFoundationDefinition
} = {}) {
  const state = createState();

  function getControlledOneAssetLiveDrawRendererSubmitDependencyStatus() {
    return cloneStatus(state);
  }

  function submitControlledOneAssetLiveDraw({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord
  } = {}) {
    state.submitAttemptCount += 1;
    const selectedExistingAssetId = sanitizeString(
      rendererHandoff?.selectedExistingAssetId ??
        loadedAsset?.selectedExistingAssetId ??
        approvedAssetRecord?.assetId
    );
    state.selectedExistingAssetId = selectedExistingAssetId;

    if (typeof passiveRendererConsumer !== "function") {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason =
        "ONE_ASSET_LIVE_DRAW_RENDERER_SUBMIT_DEPENDENCY_UNAVAILABLE";
      return toResult(
        "blocked",
        "ONE_ASSET_LIVE_DRAW_RENDERER_SUBMIT_DEPENDENCY_UNAVAILABLE",
        state
      );
    }

    if (selectedExistingAssetId !== SUPPORTED_ASSET_ID) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "ASSET_MISSING";
      return toResult("blocked", "ASSET_MISSING", state);
    }

    if (
      sanitizeString(rendererConsumerDescriptor?.rendererId) !== EXPECTED_RENDERER_ID ||
      sanitizeString(rendererConsumerDescriptor?.drawEntryPoint) !==
        "drawCustom25DMapCanvas" ||
      rendererConsumerDescriptor?.passiveHandoffOnly !== true
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "RENDERER_IDENTITY_MISMATCH";
      return toResult("blocked", "RENDERER_IDENTITY_MISMATCH", state);
    }

    if (
      sanitizeString(loadedAsset?.assetLoadStatus) !== "resolved_dependency_bridge" &&
      sanitizeString(loadedAsset?.assetLoadStatus) !== "loaded"
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "ASSET_LOAD_INVALID";
      return toResult("blocked", "ASSET_LOAD_INVALID", state);
    }

    const rendererPlacementDescriptor = rendererHandoff?.rendererPlacementDescriptor;
    if (
      sanitizeString(rendererHandoff?.rendererHandoffStatus) !==
        "ready_for_future_renderer_attachment" &&
      !(
        rendererPlacementDescriptor &&
        sanitizeString(rendererPlacementDescriptor.schemaId) ===
          "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_RENDERER_PLACEMENT_DESCRIPTOR_001"
      )
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "RENDERER_HANDOFF_INVALID";
      return toResult("blocked", "RENDERER_HANDOFF_INVALID", state);
    }

    if (
      sanitizeString(rendererHandoff?.resolvedGlbIdentity) !==
        sanitizeString(approvedAssetRecord?.resolvedGlbIdentity) ||
      sanitizeString(loadedAsset?.resolvedGlbIdentity) !==
        sanitizeString(approvedAssetRecord?.resolvedGlbIdentity)
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "GLB_IDENTITY_MISMATCH";
      return toResult("blocked", "GLB_IDENTITY_MISMATCH", state);
    }

    if (
      sanitizeString(rendererHandoff?.resolvedLodProfile) !==
        sanitizeString(approvedAssetRecord?.resolvedLodProfile) ||
      sanitizeString(loadedAsset?.resolvedLodProfile) !==
        sanitizeString(approvedAssetRecord?.resolvedLodProfile)
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "LOD_IDENTITY_MISMATCH";
      return toResult("blocked", "LOD_IDENTITY_MISMATCH", state);
    }

    if (
      sanitizeString(treeRuntimeImportBridge?.runtimePreviewBinding?.renderPayload?.rendererProfile) !==
        EXPECTED_RENDERER_PROFILE ||
      sanitizeString(treeRuntimeImportBridge?.glbRegistration?.assetId) !==
        SUPPORTED_ASSET_ID
    ) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason = "RENDERER_SUBMIT_DEPENDENCY_INVALID";
      return toResult("blocked", "RENDERER_SUBMIT_DEPENDENCY_INVALID", state);
    }

    const payload = buildPassiveRendererPayload({
      rendererHandoff,
      approvedAssetRecord
    });
    const consumerResult = passiveRendererConsumer(payload);

    if (consumerResult?.ok !== true) {
      state.oneAssetLiveDrawRendererSubmitDependencyStatus = "blocked";
      state.rendererSubmitReason =
        sanitizeString(consumerResult?.errorCode)?.toUpperCase() ??
        "INVALID_WORLD_PLACEMENT_TRANSFORM";
      return toResult("blocked", state.rendererSubmitReason, state);
    }

    state.oneAssetLiveDrawRendererSubmitDependencyStatus = "submitted";
    state.rendererSubmitReason =
      "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_RESOLVED";
    state.submitCompletedCount += 1;

    return toResult(
      "submitted",
      "CONTROLLED_ONE_ASSET_RENDERER_SUBMIT_DEPENDENCY_RESOLVED",
      state,
      {
        rendererSubmitStatus: "submitted",
        renderedAssetCount: 1,
        selectedExistingAssetId: approvedAssetRecord.assetId,
        passiveRendererPayload: consumerResult.acceptedPayload
      }
    );
  }

  return deepFreeze({
    getControlledOneAssetLiveDrawRendererSubmitDependencyStatus,
    submitControlledOneAssetLiveDraw
  });
}
