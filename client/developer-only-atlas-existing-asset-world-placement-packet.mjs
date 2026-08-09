import {
  createDeveloperOnlyAtlasControlledExistingAssetBinding,
  getDeveloperOnlyAtlasControlledExistingAssetBindingStatus,
  DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS
} from "./developer-only-atlas-controlled-existing-asset-binding-contract.mjs";
import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry,
  getDeveloperOnlyAtlasAssetRegistryStatus
} from "./developer-only-atlas-asset-registry.mjs";
import {
  createDeveloperOnlyAtlasMultiAssetPlacementProvider,
  resolveDeveloperOnlyAtlasMultiAssetPlacement,
  getDeveloperOnlyAtlasMultiAssetPlacementStatus
} from "./developer-only-atlas-multi-asset-placement-provider.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_VERSION =
  "atlas_existing_asset_world_placement_packet_v1";

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

function validateCoordinate(coordinate) {
  const latitude = Number(coordinate?.latitude);
  const longitude = Number(coordinate?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error("INVALID_WORLD_PLACEMENT_COORDINATE"), {
      reasonCode: "INVALID_WORLD_PLACEMENT_COORDINATE"
    });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw Object.assign(new Error("INVALID_WORLD_PLACEMENT_COORDINATE"), {
      reasonCode: "INVALID_WORLD_PLACEMENT_COORDINATE"
    });
  }
  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function assertFiniteNumber(value, reasonCode) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return number;
}

function buildWorldPlacementPacketId({
  sourceFeatureId,
  selectedExistingAssetId,
  worldPosition,
  resolvedLodProfile,
  resolvedGlbIdentity
}) {
  return `ATLAS_WORLD_PLACEMENT_PACKET_${hashString(
    stableSerialize({
      sourceFeatureId,
      selectedExistingAssetId,
      worldPosition,
      resolvedLodProfile,
      resolvedGlbIdentity
    })
  )
    .slice(0, 20)
    .toUpperCase()}`;
}

function createState(version, statuses = {}) {
  return {
    atlasExistingAssetWorldPlacementPacketVersion: version,
    registeredAssetCount: statuses.assetRegistry?.registeredAssetCount ?? 0,
    existingAssetBindingVersion:
      statuses.existingAssetBinding?.atlasControlledExistingAssetBindingVersion ??
      null,
    placementProviderVersion:
      statuses.placementProvider?.registryVersion ?? null,
    worldPlacementPacketId: null,
    selectedExistingAssetId: null,
    sourceFeatureId: null,
    latitude: null,
    longitude: null,
    resolvedLodProfile: null,
    resolvedGlbIdentity: null,
    placementTransformStatus: null,
    worldPlacementStatus: null,
    worldPlacementReason: null,
    lastFailureReason: null
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasExistingAssetWorldPlacementPacketVersion:
      state.atlasExistingAssetWorldPlacementPacketVersion,
    registeredAssetCount: state.registeredAssetCount,
    existingAssetBindingVersion: state.existingAssetBindingVersion,
    placementProviderVersion: state.placementProviderVersion,
    worldPlacementPacketId: state.worldPlacementPacketId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    sourceFeatureId: state.sourceFeatureId,
    latitude: state.latitude,
    longitude: state.longitude,
    resolvedLodProfile: state.resolvedLodProfile,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    placementTransformStatus: state.placementTransformStatus,
    worldPlacementStatus: state.worldPlacementStatus,
    worldPlacementReason: state.worldPlacementReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasExistingAssetWorldPlacementPacket) {
    throw Object.assign(
      new Error("ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_UNAVAILABLE"),
      { reasonCode: "ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_UNAVAILABLE" }
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
    worldPlacementPacketId: null,
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    sourceFeatureId: sanitizeString(patch.sourceFeatureId),
    latitude:
      patch.latitude == null || !Number.isFinite(Number(patch.latitude))
        ? null
        : Number(patch.latitude),
    longitude:
      patch.longitude == null || !Number.isFinite(Number(patch.longitude))
        ? null
        : Number(patch.longitude),
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    placementTransformStatus:
      sanitizeString(patch.placementTransformStatus) ?? "blocked",
    worldPlacementStatus: "blocked",
    worldPlacementReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    worldPlacementPacketId: null,
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    sourceFeatureId: sanitizeString(patch.sourceFeatureId),
    latitude:
      patch.latitude == null || !Number.isFinite(Number(patch.latitude))
        ? null
        : Number(patch.latitude),
    longitude:
      patch.longitude == null || !Number.isFinite(Number(patch.longitude))
        ? null
        : Number(patch.longitude),
    worldPosition: null,
    heading: null,
    scale: null,
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    placementTransformStatus:
      sanitizeString(patch.placementTransformStatus) ?? "blocked",
    worldPlacementStatus: "blocked",
    worldPlacementReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasExistingAssetWorldPlacementPacket({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_WORLD_PLACEMENT_PACKET_VERSION,
  atlasAssetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  existingAssetBindingRegistry =
    createDeveloperOnlyAtlasControlledExistingAssetBinding(),
  placementProvider = createDeveloperOnlyAtlasMultiAssetPlacementProvider({
    registry: atlasAssetRegistry
  })
} = {}) {
  const statuses = {
    assetRegistry: getDeveloperOnlyAtlasAssetRegistryStatus(atlasAssetRegistry),
    existingAssetBinding:
      getDeveloperOnlyAtlasControlledExistingAssetBindingStatus(
        existingAssetBindingRegistry
      ),
    placementProvider:
      getDeveloperOnlyAtlasMultiAssetPlacementStatus(placementProvider)
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasExistingAssetWorldPlacementPacket: true,
    __state: createState(version, statuses),
    __internal: {
      atlasAssetRegistry,
      existingAssetBindingRegistry,
      placementProvider,
      existingAssetRecordsById: new Map(
        DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS.map((record) => [
          record.assetId,
          deepFreeze({ ...record })
        ])
      )
    }
  });
}

export function getDeveloperOnlyAtlasExistingAssetWorldPlacementPacketStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasExistingAssetWorldPlacementPacket) {
    return freezeStatus(createState(null));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasExistingAssetWorldPlacementPacket(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const bindingStatus = sanitizeString(input.existingAssetBindingStatus);
  if (bindingStatus !== "bound_existing_asset") {
    return fail(registry, "EXISTING_ASSET_BINDING_NOT_SUCCESSFUL", {
      selectedExistingAssetId: input.selectedExistingAssetId,
      sourceFeatureId: input.sourceFeatureId,
      resolvedLodProfile: input.resolvedLodProfile,
      resolvedGlbIdentity: input.resolvedGlbIdentity
    });
  }

  const selectedExistingAssetId = sanitizeString(input.selectedExistingAssetId);
  const sourceFeatureId = sanitizeString(input.sourceFeatureId);
  if (!selectedExistingAssetId || !sourceFeatureId) {
    return fail(registry, "INVALID_WORLD_PLACEMENT_INPUT", {
      selectedExistingAssetId,
      sourceFeatureId
    });
  }

  const coordinate = (() => {
    try {
      return validateCoordinate(input.coordinate);
    } catch (error) {
      return null;
    }
  })();
  if (!coordinate) {
    return fail(registry, "INVALID_WORLD_PLACEMENT_COORDINATE", {
      selectedExistingAssetId,
      sourceFeatureId
    });
  }

  let registryEntry;
  try {
    registryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
      registry.__internal.atlasAssetRegistry,
      selectedExistingAssetId
    );
  } catch (error) {
    return fail(registry, error.reasonCode ?? "UNKNOWN_ASSET_ID", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
  }

  let placementResult;
  try {
    placementResult = resolveDeveloperOnlyAtlasMultiAssetPlacement(
      registry.__internal.placementProvider,
      {
        assetId: selectedExistingAssetId,
        version: registryEntry.assetVersion,
        coordinate,
        regionId: sanitizeString(input.regionId),
        packageId: sanitizeString(input.packageId),
        recipeId: sanitizeString(input.recipeId),
        selectorSeed: sanitizeString(input.selectorSeed),
        rotationOverride: input.rotationOverride
      }
    );
  } catch (error) {
    return fail(registry, error.reasonCode ?? "INVALID_WORLD_PLACEMENT_TRANSFORM", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      placementTransformStatus: "invalid_transform"
    });
  }

  const resolvedLodProfile = sanitizeString(input.resolvedLodProfile);
  const resolvedGlbIdentity = sanitizeString(input.resolvedGlbIdentity);
  const existingAssetRecord =
    registry.__internal.existingAssetRecordsById.get(selectedExistingAssetId) ?? null;
  if (!existingAssetRecord) {
    return fail(registry, "EXISTING_ASSET_MANIFEST_NOT_FOUND", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      resolvedLodProfile,
      resolvedGlbIdentity
    });
  }

  if (resolvedLodProfile !== existingAssetRecord.resolvedLodProfile) {
    return fail(registry, "BOUND_LOD_IDENTITY_MISMATCH", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      resolvedLodProfile,
      resolvedGlbIdentity,
      placementTransformStatus: "valid"
    });
  }

  if (resolvedGlbIdentity !== existingAssetRecord.resolvedGlbIdentity) {
    return fail(registry, "BOUND_GLB_IDENTITY_MISMATCH", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      resolvedLodProfile,
      placementTransformStatus: "valid"
    });
  }

  let worldPositionX;
  let worldPositionY;
  let scale;
  let heading;
  try {
    worldPositionX = assertFiniteNumber(
      placementResult.position?.x,
      "INVALID_WORLD_PLACEMENT_TRANSFORM"
    );
    worldPositionY = assertFiniteNumber(
      placementResult.position?.y,
      "INVALID_WORLD_PLACEMENT_TRANSFORM"
    );
    scale = assertFiniteNumber(
      placementResult.scale,
      "INVALID_WORLD_PLACEMENT_TRANSFORM"
    );
    heading = assertFiniteNumber(
      placementResult.rotation,
      "INVALID_WORLD_PLACEMENT_TRANSFORM"
    );
  } catch (error) {
    return fail(registry, error.reasonCode ?? "INVALID_WORLD_PLACEMENT_TRANSFORM", {
      selectedExistingAssetId,
      sourceFeatureId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      resolvedLodProfile,
      resolvedGlbIdentity,
      placementTransformStatus: "invalid_transform"
    });
  }

  const worldPosition = deepFreeze({
    x: Number(worldPositionX.toFixed(3)),
    y: Number(worldPositionY.toFixed(3))
  });
  const projectionPath =
    sanitizeString(placementResult.projectionPath) ??
    "deterministic_multi_asset_projection_v1";

  const worldPlacementPacketId = buildWorldPlacementPacketId({
    sourceFeatureId,
    selectedExistingAssetId,
    worldPosition,
    resolvedLodProfile,
    resolvedGlbIdentity
  });

  const result = deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    worldPlacementPacketId,
    selectedExistingAssetId,
    sourceFeatureId,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    worldPosition,
    projectedPlacementData: deepFreeze({
      position: worldPosition,
      projectionPath
    }),
    rotation: Number(heading.toFixed(3)),
    heading: Number(heading.toFixed(3)),
    scale: Number(scale.toFixed(4)),
    resolvedLodProfile,
    resolvedGlbIdentity,
    placementTransformStatus: "valid",
    worldPlacementStatus: "resolved",
    worldPlacementReason:
      "validated atlas placement bound to approved existing asset record and resolved into deterministic world placement packet",
    canonicalSafetyFlags: canonicalSafetyFlags()
  });

  updateState(registry, {
    worldPlacementPacketId: result.worldPlacementPacketId,
    selectedExistingAssetId: result.selectedExistingAssetId,
    sourceFeatureId: result.sourceFeatureId,
    latitude: result.latitude,
    longitude: result.longitude,
    resolvedLodProfile: result.resolvedLodProfile,
    resolvedGlbIdentity: result.resolvedGlbIdentity,
    placementTransformStatus: result.placementTransformStatus,
    worldPlacementStatus: result.worldPlacementStatus,
    worldPlacementReason: result.worldPlacementReason,
    lastFailureReason: null
  });

  return result;
}
