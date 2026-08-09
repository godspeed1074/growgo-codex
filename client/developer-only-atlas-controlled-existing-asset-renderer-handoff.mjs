import {
  createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket,
  getDeveloperOnlyAtlasExistingAssetWorldPlacementPacketStatus
} from "./developer-only-atlas-existing-asset-world-placement-packet.mjs";
import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs";
import {
  DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS
} from "./developer-only-atlas-controlled-existing-asset-binding-contract.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_RESULT_001";
const RENDERER_PLACEMENT_DESCRIPTOR_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_RENDERER_PLACEMENT_DESCRIPTOR_001";
const READY_STATUS = "ready_for_future_renderer_attachment";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_VERSION =
  "atlas_controlled_existing_asset_renderer_handoff_v1";

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

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function assertFiniteNumber(value, reasonCode) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return number;
}

function buildRendererHandoffPacketId({
  sourceWorldPlacementPacketId,
  selectedExistingAssetId,
  resolvedLodProfile,
  resolvedGlbIdentity
}) {
  return `ATLAS_EXISTING_ASSET_RENDERER_HANDOFF_${hashString(
    stableSerialize({
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity
    })
  )
    .slice(0, 20)
    .toUpperCase()}`;
}

function createState(version, statuses = {}) {
  return {
    atlasControlledExistingAssetRendererHandoffVersion: version,
    worldPlacementPacketVersion:
      statuses.worldPlacementPacket?.atlasExistingAssetWorldPlacementPacketVersion ??
      null,
    rendererHandoffPacketId: null,
    sourceWorldPlacementPacketId: null,
    selectedExistingAssetId: null,
    resolvedGlbIdentity: null,
    resolvedLodProfile: null,
    rendererPlacementDescriptorStatus: null,
    rendererHandoffStatus: null,
    rendererHandoffReason: null,
    lastFailureReason: null
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasControlledExistingAssetRendererHandoffVersion:
      state.atlasControlledExistingAssetRendererHandoffVersion,
    worldPlacementPacketVersion: state.worldPlacementPacketVersion,
    rendererHandoffPacketId: state.rendererHandoffPacketId,
    sourceWorldPlacementPacketId: state.sourceWorldPlacementPacketId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    resolvedLodProfile: state.resolvedLodProfile,
    rendererPlacementDescriptorStatus: state.rendererPlacementDescriptorStatus,
    rendererHandoffStatus: state.rendererHandoffStatus,
    rendererHandoffReason: state.rendererHandoffReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasControlledExistingAssetRendererHandoff) {
    throw Object.assign(
      new Error("ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_UNAVAILABLE"),
      { reasonCode: "ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode, patch = {}) {
  updateState(registry, {
    rendererHandoffPacketId: null,
    sourceWorldPlacementPacketId: sanitizeString(patch.sourceWorldPlacementPacketId),
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    rendererPlacementDescriptorStatus:
      sanitizeString(patch.rendererPlacementDescriptorStatus) ?? "blocked",
    rendererHandoffStatus: "blocked",
    rendererHandoffReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    rendererHandoffPacketId: null,
    sourceWorldPlacementPacketId: sanitizeString(patch.sourceWorldPlacementPacketId),
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    rendererPlacementDescriptorStatus:
      sanitizeString(patch.rendererPlacementDescriptorStatus) ?? "blocked",
    rendererHandoffStatus: "blocked",
    rendererHandoffReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRendererConsumerDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    throw Object.assign(new Error("RENDERER_CONSUMER_UNAVAILABLE"), {
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE"
    });
  }

  if (
    descriptor.schemaId !== "GROWGO_CUSTOM_25D_RENDERER_CONSUMER_DESCRIPTOR_001" ||
    descriptor.rendererId !== "GROWGO_CUSTOM_25D_MAP_EXPERIMENT" ||
    descriptor.drawEntryPoint !== "drawCustom25DMapCanvas" ||
    descriptor.passiveHandoffOnly !== true
  ) {
    throw Object.assign(new Error("RENDERER_IDENTITY_MISMATCH"), {
      reasonCode: "RENDERER_IDENTITY_MISMATCH"
    });
  }

  return deepFreeze({ ...descriptor });
}

export function createDeveloperOnlyAtlasControlledExistingAssetRendererHandoff({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_RENDERER_HANDOFF_VERSION,
  worldPlacementPacketRegistry = createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(),
  rendererConsumerDescriptor =
    createDiscoveredGrowGoCustom25DRendererConsumerDescriptor()
} = {}) {
  const statuses = {
    worldPlacementPacket:
      getDeveloperOnlyAtlasExistingAssetWorldPlacementPacketStatus(
        worldPlacementPacketRegistry
      )
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasControlledExistingAssetRendererHandoff: true,
    __state: createState(version, statuses),
    __internal: {
      worldPlacementPacketRegistry,
      rendererConsumerDescriptor: validateRendererConsumerDescriptor(
        rendererConsumerDescriptor
      ),
      existingAssetRecordsById: new Map(
        DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS.map((record) => [
          record.assetId,
          deepFreeze({ ...record })
        ])
      )
    }
  });
}

export function getDeveloperOnlyAtlasControlledExistingAssetRendererHandoffStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasControlledExistingAssetRendererHandoff) {
    return freezeStatus(createState(null));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasControlledExistingAssetRendererHandoff(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const worldPlacementStatus = sanitizeString(input.worldPlacementStatus);
  if (worldPlacementStatus !== "resolved") {
    return fail(registry, "WORLD_PLACEMENT_PACKET_NOT_SUCCESSFUL", {
      sourceWorldPlacementPacketId: input.sourceWorldPlacementPacketId,
      selectedExistingAssetId: input.selectedExistingAssetId,
      resolvedLodProfile: input.resolvedLodProfile,
      resolvedGlbIdentity: input.resolvedGlbIdentity
    });
  }

  const sourceWorldPlacementPacketId = sanitizeString(input.sourceWorldPlacementPacketId);
  const selectedExistingAssetId = sanitizeString(input.selectedExistingAssetId);
  const sourceFeatureId = sanitizeString(input.sourceFeatureId);
  const resolvedGlbIdentity = sanitizeString(input.resolvedGlbIdentity);
  const resolvedLodProfile = sanitizeString(input.resolvedLodProfile);

  if (
    !sourceWorldPlacementPacketId ||
    !selectedExistingAssetId ||
    !sourceFeatureId ||
    !resolvedGlbIdentity ||
    !resolvedLodProfile
  ) {
    return fail(registry, "INVALID_WORLD_PLACEMENT_PACKET", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity
    });
  }

  const existingAssetRecord =
    registry.__internal.existingAssetRecordsById.get(selectedExistingAssetId) ?? null;
  if (!existingAssetRecord) {
    return fail(registry, "EXISTING_ASSET_MANIFEST_NOT_FOUND", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity
    });
  }

  if (resolvedGlbIdentity !== existingAssetRecord.resolvedGlbIdentity) {
    return fail(registry, "GLB_IDENTITY_MISMATCH", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity,
      rendererPlacementDescriptorStatus: "identity_mismatch"
    });
  }

  if (resolvedLodProfile !== existingAssetRecord.resolvedLodProfile) {
    return fail(registry, "LOD_IDENTITY_MISMATCH", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity,
      rendererPlacementDescriptorStatus: "identity_mismatch"
    });
  }

  let worldPosition;
  let heading;
  let rotation;
  let scale;
  try {
    worldPosition = deepFreeze({
      x: Number(assertFiniteNumber(input.worldPosition?.x, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3)),
      y: Number(assertFiniteNumber(input.worldPosition?.y, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3))
    });
    heading = Number(assertFiniteNumber(input.heading, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3));
    rotation = Number(assertFiniteNumber(input.rotation ?? input.heading, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3));
    scale = Number(assertFiniteNumber(input.scale, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(4));
  } catch (error) {
    return fail(registry, error.reasonCode ?? "INVALID_WORLD_PLACEMENT_TRANSFORM", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity,
      rendererPlacementDescriptorStatus: "invalid_transform"
    });
  }

  const projectedPlacementData = input.projectedPlacementData;
  if (
    !projectedPlacementData ||
    typeof projectedPlacementData !== "object" ||
    sanitizeString(projectedPlacementData.projectionPath) == null
  ) {
    return fail(registry, "RENDERER_INCOMPATIBLE_PLACEMENT_DESCRIPTOR", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity,
      rendererPlacementDescriptorStatus: "invalid_descriptor"
    });
  }

  let rendererConsumerDescriptor;
  try {
    rendererConsumerDescriptor = validateRendererConsumerDescriptor(
      registry.__internal.rendererConsumerDescriptor
    );
  } catch (error) {
    return fail(registry, error.reasonCode ?? "RENDERER_IDENTITY_MISMATCH", {
      sourceWorldPlacementPacketId,
      selectedExistingAssetId,
      resolvedLodProfile,
      resolvedGlbIdentity,
      rendererPlacementDescriptorStatus: "blocked"
    });
  }

  const rendererPlacementDescriptor = deepFreeze({
    schemaId: RENDERER_PLACEMENT_DESCRIPTOR_SCHEMA_ID,
    rendererId: rendererConsumerDescriptor.rendererId,
    sourceWorldPlacementPacketId,
    sourceFeatureId,
    selectedExistingAssetId,
    resolvedGlbIdentity,
    resolvedLodProfile,
    worldPosition,
    projectedPlacementData: deepFreeze({
      position: deepFreeze({
        x: Number(assertFiniteNumber(projectedPlacementData.position?.x, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3)),
        y: Number(assertFiniteNumber(projectedPlacementData.position?.y, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3))
      }),
      projectionPath: sanitizeString(projectedPlacementData.projectionPath)
    }),
    rotation,
    heading,
    scale,
    passiveHandoffOnly: true,
    drawReady: false
  });

  const rendererHandoffPacketId = buildRendererHandoffPacketId({
    sourceWorldPlacementPacketId,
    selectedExistingAssetId,
    resolvedLodProfile,
    resolvedGlbIdentity
  });

  const result = deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "HANDOFF_READY",
    rendererHandoffPacketId,
    sourceWorldPlacementPacketId,
    selectedExistingAssetId,
    resolvedGlbIdentity,
    resolvedLodProfile,
    rendererPlacementDescriptorStatus: "valid",
    rendererHandoffStatus: READY_STATUS,
    rendererHandoffReason:
      "valid existing-asset world placement packet prepared for controlled renderer handoff without GLB loading or draw activation",
    rendererPlacementDescriptor,
    rendererConsumerDescriptor,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });

  updateState(registry, {
    rendererHandoffPacketId: result.rendererHandoffPacketId,
    sourceWorldPlacementPacketId: result.sourceWorldPlacementPacketId,
    selectedExistingAssetId: result.selectedExistingAssetId,
    resolvedGlbIdentity: result.resolvedGlbIdentity,
    resolvedLodProfile: result.resolvedLodProfile,
    rendererPlacementDescriptorStatus: result.rendererPlacementDescriptorStatus,
    rendererHandoffStatus: result.rendererHandoffStatus,
    rendererHandoffReason: result.rendererHandoffReason,
    lastFailureReason: null
  });

  return result;
}
