const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_STATUS_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_VERSION =
  "atlas_asset_registry_v1";

const DEFAULT_APPROVED_REGIONS = Object.freeze(["BELLARINE"]);
const DEFAULT_APPROVED_PACKAGES = Object.freeze(["ATLAS_DEVELOPER_PACKAGE"]);

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES = Object.freeze([
  Object.freeze({
    assetId: "TREE_EUCALYPTUS_001",
    assetVersion: "v001",
    assetCategory: "vegetation",
    assetFamily: "COASTAL_NATURE_FAMILY_001",
    assetReferenceId: "TREE_EUCALYPTUS_001@v001",
    approvedRegions: DEFAULT_APPROVED_REGIONS,
    approvedPackages: DEFAULT_APPROVED_PACKAGES,
    approvedRecipeIds: Object.freeze(["TREE_EUCALYPTUS_RECIPE_001"]),
    placementRules: Object.freeze({
      placementClass: "vegetation",
      supportedPlacementKinds: Object.freeze(["vegetation"]),
      footprintRadius: 3.2,
      lightweight: true
    }),
    scaleRules: Object.freeze({
      mode: "seeded_range",
      min: 0.92,
      max: 1.08
    }),
    rotationRules: Object.freeze({
      mode: "seeded_degrees",
      min: 0,
      max: 360
    }),
    lodRules: Object.freeze({
      mode: "fixed",
      value: "gameplay"
    }),
    performanceBudget: Object.freeze({
      maxTriangleCount: 249,
      maxMaterialCount: 5,
      lightweightReferenceOnly: true
    }),
    status: "approved"
  }),
  Object.freeze({
    assetId: "TREE_BOTTLEBRUSH_001",
    assetVersion: "v002",
    assetCategory: "vegetation",
    assetFamily: "COASTAL_NATURE_FAMILY_001",
    assetReferenceId: "TREE_BOTTLEBRUSH_001@v002",
    approvedRegions: DEFAULT_APPROVED_REGIONS,
    approvedPackages: DEFAULT_APPROVED_PACKAGES,
    approvedRecipeIds: Object.freeze(["TREE_BOTTLEBRUSH_RECIPE_001"]),
    placementRules: Object.freeze({
      placementClass: "vegetation",
      supportedPlacementKinds: Object.freeze(["vegetation", "landmark"]),
      footprintRadius: 2.8,
      lightweight: true
    }),
    scaleRules: Object.freeze({
      mode: "seeded_range",
      min: 0.9,
      max: 1.14
    }),
    rotationRules: Object.freeze({
      mode: "seeded_degrees",
      min: 0,
      max: 360
    }),
    lodRules: Object.freeze({
      mode: "fixed",
      value: "gameplay"
    }),
    performanceBudget: Object.freeze({
      maxTriangleCount: 1089,
      maxMaterialCount: 6,
      lightweightReferenceOnly: true
    }),
    status: "approved_current"
  }),
  Object.freeze({
    assetId: "SHRUB_COASTAL_LOW_001",
    assetVersion: "v002",
    assetCategory: "vegetation",
    assetFamily: "COASTAL_SHRUB_FAMILY_001",
    assetReferenceId: "SHRUB_COASTAL_LOW_001@v002",
    approvedRegions: DEFAULT_APPROVED_REGIONS,
    approvedPackages: DEFAULT_APPROVED_PACKAGES,
    approvedRecipeIds: Object.freeze(["SHRUB_COASTAL_LOW_RECIPE_001"]),
    placementRules: Object.freeze({
      placementClass: "vegetation",
      supportedPlacementKinds: Object.freeze(["vegetation"]),
      footprintRadius: 1.5,
      lightweight: true
    }),
    scaleRules: Object.freeze({
      mode: "seeded_range",
      min: 0.88,
      max: 1.05
    }),
    rotationRules: Object.freeze({
      mode: "seeded_degrees",
      min: 0,
      max: 360
    }),
    lodRules: Object.freeze({
      mode: "fixed",
      value: "gameplay"
    }),
    performanceBudget: Object.freeze({
      maxTriangleCount: 341,
      maxMaterialCount: 4,
      lightweightReferenceOnly: true
    }),
    status: "active_development_revision"
  }),
  Object.freeze({
    assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    assetVersion: "1.0.0",
    assetCategory: "building",
    assetFamily: "CIVIC_SPORTS_PAVILION_FAMILY_001",
    assetReferenceId: "BUILDING_CIVIC_SPORTS_PAVILION_001@1.0.0",
    approvedRegions: DEFAULT_APPROVED_REGIONS,
    approvedPackages: DEFAULT_APPROVED_PACKAGES,
    approvedRecipeIds: Object.freeze([
      "BUILDING_CIVIC_SPORTS_PAVILION_001",
      "SPORTS_OVAL_RECIPE_001",
      "RECREATION_AREA_RECIPE_001"
    ]),
    placementRules: Object.freeze({
      placementClass: "building",
      supportedPlacementKinds: Object.freeze(["building", "landmark"]),
      footprintRadius: 14,
      lightweight: true
    }),
    scaleRules: Object.freeze({
      mode: "seeded_range",
      min: 0.99,
      max: 1.01
    }),
    rotationRules: Object.freeze({
      mode: "cardinal_degrees",
      values: Object.freeze([0, 90, 180, 270])
    }),
    lodRules: Object.freeze({
      mode: "fixed",
      value: "gameplay"
    }),
    performanceBudget: Object.freeze({
      maxTriangleCount: 1624,
      maxMaterialCount: 6,
      lightweightReferenceOnly: true
    }),
    status: "approved"
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

function validateStringArray(values, reasonCode) {
  if (!Array.isArray(values) || values.length === 0) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }

  return deepFreeze(values.map((value) => String(value)));
}

function validateEntry(entry = {}) {
  const assetId = sanitizeString(entry.assetId);
  const assetVersion = sanitizeString(entry.assetVersion);
  const assetCategory = sanitizeString(entry.assetCategory);
  const assetFamily = sanitizeString(entry.assetFamily);
  const assetReferenceId = sanitizeString(entry.assetReferenceId);
  const status = sanitizeString(entry.status);

  if (!assetId) {
    throw Object.assign(new Error("MISSING_ASSET_ID"), {
      reasonCode: "MISSING_ASSET_ID"
    });
  }

  if (!assetVersion) {
    throw Object.assign(new Error("MISSING_ASSET_VERSION"), {
      reasonCode: "MISSING_ASSET_VERSION"
    });
  }

  if (!assetCategory) {
    throw Object.assign(new Error("MISSING_ASSET_CATEGORY"), {
      reasonCode: "MISSING_ASSET_CATEGORY"
    });
  }

  if (!assetFamily) {
    throw Object.assign(new Error("MISSING_ASSET_FAMILY"), {
      reasonCode: "MISSING_ASSET_FAMILY"
    });
  }

  if (!assetReferenceId) {
    throw Object.assign(new Error("MISSING_ASSET_REFERENCE_ID"), {
      reasonCode: "MISSING_ASSET_REFERENCE_ID"
    });
  }

  const approvedRegions = validateStringArray(
    entry.approvedRegions,
    "MISSING_APPROVED_REGIONS"
  );
  const approvedPackages = validateStringArray(
    entry.approvedPackages,
    "MISSING_APPROVED_PACKAGES"
  );
  const approvedRecipeIds = validateStringArray(
    entry.approvedRecipeIds,
    "MISSING_APPROVED_RECIPE_IDS"
  );

  if (!entry.placementRules || typeof entry.placementRules !== "object") {
    throw Object.assign(new Error("MISSING_PLACEMENT_RULES"), {
      reasonCode: "MISSING_PLACEMENT_RULES"
    });
  }

  if (!entry.scaleRules || typeof entry.scaleRules !== "object") {
    throw Object.assign(new Error("MISSING_SCALE_RULES"), {
      reasonCode: "MISSING_SCALE_RULES"
    });
  }

  if (!entry.rotationRules || typeof entry.rotationRules !== "object") {
    throw Object.assign(new Error("MISSING_ROTATION_RULES"), {
      reasonCode: "MISSING_ROTATION_RULES"
    });
  }

  if (!entry.lodRules || typeof entry.lodRules !== "object") {
    throw Object.assign(new Error("MISSING_LOD_RULES"), {
      reasonCode: "MISSING_LOD_RULES"
    });
  }

  if (!entry.performanceBudget || typeof entry.performanceBudget !== "object") {
    throw Object.assign(new Error("MISSING_PERFORMANCE_BUDGET"), {
      reasonCode: "MISSING_PERFORMANCE_BUDGET"
    });
  }

  if (!status) {
    throw Object.assign(new Error("MISSING_REGISTRY_STATUS"), {
      reasonCode: "MISSING_REGISTRY_STATUS"
    });
  }

  return deepFreeze({
    assetId,
    assetVersion,
    assetCategory,
    assetFamily,
    assetReferenceId,
    approvedRegions,
    approvedPackages,
    approvedRecipeIds,
    placementRules: deepFreeze({ ...entry.placementRules }),
    scaleRules: deepFreeze({ ...entry.scaleRules }),
    rotationRules: deepFreeze({ ...entry.rotationRules }),
    lodRules: deepFreeze({ ...entry.lodRules }),
    performanceBudget: deepFreeze({ ...entry.performanceBudget }),
    status
  });
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    registryVersion: state.registryVersion,
    registryReady: state.registryReady,
    registeredAssetCount: state.registeredAssetCount,
    lastResolvedAssetId: state.lastResolvedAssetId,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasAssetRegistry({
  registryVersion = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_VERSION,
  entries = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES
} = {}) {
  const sanitizedEntries = [];
  const byAssetId = new Map();

  for (const entry of entries) {
    const sanitized = validateEntry(entry);
    if (byAssetId.has(sanitized.assetId)) {
      throw Object.assign(
        new Error(`DUPLICATE_ASSET_REGISTRY_ENTRY:${sanitized.assetId}`),
        {
          reasonCode: "DUPLICATE_ASSET_REGISTRY_ENTRY",
          assetId: sanitized.assetId
        }
      );
    }
    byAssetId.set(sanitized.assetId, sanitized);
    sanitizedEntries.push(sanitized);
  }

  const state = {
    registryVersion: sanitizeString(registryVersion) ??
      DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_VERSION,
    registryReady: true,
    registeredAssetCount: sanitizedEntries.length,
    lastResolvedAssetId: null,
    lastFailureReason: null
  };

  const internal = {
    entries: deepFreeze([...sanitizedEntries]),
    byAssetId
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAssetRegistry: true,
    __state: state,
    __internal: internal
  });
}

export function resolveDeveloperOnlyAtlasAssetRegistryEntry(registry, assetId) {
  const state = registry?.__state;
  const internal = registry?.__internal;

  if (!registry?.__growgoDeveloperOnlyAtlasAssetRegistry || !state || !internal) {
    throw Object.assign(new Error("ATLAS_ASSET_REGISTRY_UNAVAILABLE"), {
      reasonCode: "ATLAS_ASSET_REGISTRY_UNAVAILABLE"
    });
  }

  const normalizedAssetId = sanitizeString(assetId);
  if (!normalizedAssetId) {
    state.lastFailureReason = "MISSING_ASSET_ID";
    throw Object.assign(new Error("MISSING_ASSET_ID"), {
      reasonCode: "MISSING_ASSET_ID"
    });
  }

  const entry = internal.byAssetId.get(normalizedAssetId) ?? null;
  if (!entry) {
    state.lastFailureReason = "UNKNOWN_ASSET_ID";
    throw Object.assign(new Error("UNKNOWN_ASSET_ID"), {
      reasonCode: "UNKNOWN_ASSET_ID"
    });
  }

  state.lastResolvedAssetId = normalizedAssetId;
  state.lastFailureReason = null;
  return entry;
}

export function getDeveloperOnlyAtlasAssetRegistryStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetRegistry || !registry.__state) {
    return freezeStatus({
      registryVersion: DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_VERSION,
      registryReady: false,
      registeredAssetCount: 0,
      lastResolvedAssetId: null,
      lastFailureReason: "ATLAS_ASSET_REGISTRY_UNAVAILABLE"
    });
  }

  return freezeStatus(registry.__state);
}
