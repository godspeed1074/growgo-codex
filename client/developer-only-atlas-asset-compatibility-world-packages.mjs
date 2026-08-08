const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_VERSION =
  "atlas_asset_compatibility_world_packages_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGE_RULES =
  Object.freeze([
    Object.freeze({
      packageCategory: "coastal",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001"
      ]),
      supportedPrimaryAssetIds: Object.freeze([
        "TREE_BOTTLEBRUSH_001",
        "SHRUB_COASTAL_LOW_001",
        "TREE_EUCALYPTUS_001"
      ]),
      supportedChildAssetIds: Object.freeze([
        "TREE_BOTTLEBRUSH_001",
        "SHRUB_COASTAL_LOW_001",
        "TREE_EUCALYPTUS_001",
        "CHILD_NATIVE_PLANTING_CLUSTER_001",
        "CHILD_COASTAL_BUFFER_EDGE_001",
        "CHILD_WIND_SHELTER_VEGETATION_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_COASTAL_001"]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      packageReason: "coastal_assets_align_with_native_biome_and_palette",
      status: "approved"
    }),
    Object.freeze({
      packageCategory: "park",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001"
      ]),
      supportedPrimaryAssetIds: Object.freeze([
        "TREE_BOTTLEBRUSH_001",
        "SHRUB_COASTAL_LOW_001",
        "TREE_EUCALYPTUS_001"
      ]),
      supportedChildAssetIds: Object.freeze([
        "TREE_BOTTLEBRUSH_001",
        "SHRUB_COASTAL_LOW_001",
        "TREE_EUCALYPTUS_001",
        "CHILD_NATIVE_PLANTING_CLUSTER_001",
        "CHILD_COASTAL_BUFFER_EDGE_001",
        "CHILD_WIND_SHELTER_VEGETATION_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_COASTAL_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001"
      ]),
      packageReason: "park_package_keeps_green_assets_style_compatible",
      status: "approved"
    }),
    Object.freeze({
      packageCategory: "civic",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_CIVIC_HERITAGE_001"
      ]),
      supportedPrimaryAssetIds: Object.freeze([
        "BUILDING_CIVIC_SPORTS_PAVILION_001"
      ]),
      supportedChildAssetIds: Object.freeze([
        "BUILDING_CIVIC_SPORTS_PAVILION_001",
        "CHILD_FOREGROUND_LANDSCAPE_CLUSTER_001",
        "CHILD_APPROACH_OPEN_SPACE_EDGE_001",
        "CHILD_CIVIC_ENTRY_MARKER_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_WALL_HERITAGE_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_URBAN_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001"
      ]),
      packageReason: "civic_package_preserves_heritage_material_and_palette",
      status: "approved"
    }),
    Object.freeze({
      packageCategory: "residential",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001"
      ]),
      supportedPrimaryAssetIds: Object.freeze(["TREE_EUCALYPTUS_001"]),
      supportedChildAssetIds: Object.freeze([
        "TREE_EUCALYPTUS_001",
        "SHRUB_COASTAL_LOW_001",
        "CHILD_FENCE_PLACEHOLDER_001",
        "CHILD_GARDEN_VEGETATION_CLUSTER_001",
        "CHILD_FRONTAGE_PATH_PLACEHOLDER_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_ROOF_SUBURBAN_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_SUBURBAN_GARDEN_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_SUBURBAN_001"]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001"
      ]),
      packageReason: "residential_package_preserves_suburban_garden_style",
      status: "approved"
    }),
    Object.freeze({
      packageCategory: "commercial",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_COMMERCIAL_URBAN_001"
      ]),
      supportedPrimaryAssetIds: Object.freeze(["TREE_EUCALYPTUS_001"]),
      supportedChildAssetIds: Object.freeze([
        "TREE_EUCALYPTUS_001",
        "SHRUB_COASTAL_LOW_001",
        "CHILD_FRONTAGE_PLANTER_PLACEHOLDER_001",
        "CHILD_ENTRY_MARKER_PLACEHOLDER_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_TRIM_URBAN_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      packageReason: "commercial_package_preserves_urban_frontage_style",
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

function normalizeChildAssetIdentity(childAssetId) {
  const normalized = sanitizeString(childAssetId);
  if (!normalized) {
    return null;
  }
  const separatorIndex = normalized.indexOf(":");
  return separatorIndex === -1 ? normalized : normalized.slice(0, separatorIndex);
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasAssetCompatibilityWorldPackagesVersion:
      state.atlasAssetCompatibilityWorldPackagesVersion,
    registeredWorldPackageRuleCount: state.registeredWorldPackageRuleCount,
    worldPackageId: state.worldPackageId,
    packageValidationStatus: state.packageValidationStatus,
    compatibleAssetCount: state.compatibleAssetCount,
    blockedAssetCount: state.blockedAssetCount,
    packageReason: state.packageReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const packageCategory = sanitizeString(rule.packageCategory);
  if (!packageCategory) {
    throw Object.assign(new Error("MISSING_WORLD_PACKAGE_CATEGORY"), {
      reasonCode: "MISSING_WORLD_PACKAGE_CATEGORY"
    });
  }
  return deepFreeze({
    packageCategory,
    supportedAssetFamilyIds: deepFreeze(
      (rule.supportedAssetFamilyIds ?? []).map(String)
    ),
    supportedPrimaryAssetIds: deepFreeze(
      (rule.supportedPrimaryAssetIds ?? []).map(String)
    ),
    supportedChildAssetIds: deepFreeze(
      (rule.supportedChildAssetIds ?? []).map(String)
    ),
    supportedMaterialFamilyIds: deepFreeze(
      (rule.supportedMaterialFamilyIds ?? []).map(String)
    ),
    supportedPaletteProfileIds: deepFreeze(
      (rule.supportedPaletteProfileIds ?? []).map(String)
    ),
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    packageReason: sanitizeString(rule.packageReason),
    status: sanitizeString(rule.status)
  });
}

function createInitialState({
  version,
  registeredWorldPackageRuleCount
}) {
  return {
    atlasAssetCompatibilityWorldPackagesVersion: version,
    registeredWorldPackageRuleCount,
    worldPackageId: null,
    packageValidationStatus: null,
    compatibleAssetCount: 0,
    blockedAssetCount: 0,
    packageReason: null,
    lastFailureReason: null
  };
}

export function createDeveloperOnlyAtlasAssetCompatibilityWorldPackages({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  const state = createInitialState({
    version,
    registeredWorldPackageRuleCount: normalizedRules.length
  });

  return Object.freeze({
    __growgoDeveloperOnlyAtlasAssetCompatibilityWorldPackages: true,
    __rules: normalizedRules,
    __state: state
  });
}

export function getDeveloperOnlyAtlasAssetCompatibilityWorldPackagesStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetCompatibilityWorldPackages) {
    return freezeStatus(
      createInitialState({
        version: null,
        registeredWorldPackageRuleCount: 0
      })
    );
  }
  return freezeStatus(registry.__state);
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetCompatibilityWorldPackages) {
    throw Object.assign(
      new Error("ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_UNAVAILABLE"),
      { reasonCode: "ATLAS_ASSET_COMPATIBILITY_WORLD_PACKAGES_UNAVAILABLE" }
    );
  }
}

function withUpdatedState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

export function resolveDeveloperOnlyAtlasAssetCompatibilityWorldPackage(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const packageCategory = sanitizeString(input.packageCategory);
  const assetFamilyId = sanitizeString(input.assetFamilyId);
  const selectedAssetId = sanitizeString(input.selectedAssetId);
  const assetVariantId = sanitizeString(input.assetVariantId);
  const materialFamilyId = sanitizeString(input.materialFamilyId);
  const paletteProfileId = sanitizeString(input.paletteProfileId);
  const biomeProfileId = sanitizeString(input.biomeProfileId);
  const settlementIdentityId = sanitizeString(input.settlementIdentityId);
  const atlasAssetPackageId = sanitizeString(input.atlasAssetPackageId);
  const childAssetIds = Array.isArray(input.childAssetIds)
    ? input.childAssetIds.map((value) => sanitizeString(value)).filter(Boolean)
    : [];

  const rule = registry.__rules.find(
    (candidate) => candidate.packageCategory === packageCategory
  );
  if (!rule) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "UNKNOWN_WORLD_PACKAGE_CATEGORY",
      lastFailureReason: "UNKNOWN_WORLD_PACKAGE_CATEGORY"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "UNKNOWN_WORLD_PACKAGE_CATEGORY",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "UNKNOWN_WORLD_PACKAGE_CATEGORY",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const blockedAssetIds = [];
  if (!rule.supportedAssetFamilyIds.includes(assetFamilyId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "ASSET_FAMILY_INCOMPATIBLE",
      lastFailureReason: "ASSET_FAMILY_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "ASSET_FAMILY_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "ASSET_FAMILY_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  if (!rule.supportedPrimaryAssetIds.includes(selectedAssetId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "PRIMARY_ASSET_INCOMPATIBLE",
      lastFailureReason: "PRIMARY_ASSET_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "PRIMARY_ASSET_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 0,
      blockedAssetCount: 1,
      packageReason: "PRIMARY_ASSET_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  if (!rule.supportedMaterialFamilyIds.includes(materialFamilyId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_MATERIAL_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_MATERIAL_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_MATERIAL_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_MATERIAL_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  if (!rule.supportedPaletteProfileIds.includes(paletteProfileId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_PALETTE_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_PALETTE_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_PALETTE_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_PALETTE_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  if (!rule.supportedBiomeProfileIds.includes(biomeProfileId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_BIOME_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_BIOME_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_BIOME_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_BIOME_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }
  if (!rule.supportedSettlementIdentityIds.includes(settlementIdentityId)) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_SETTLEMENT_STYLE_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_SETTLEMENT_STYLE_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_SETTLEMENT_STYLE_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1,
      blockedAssetCount: 1,
      packageReason: "WORLD_PACKAGE_SETTLEMENT_STYLE_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  for (const childAssetId of childAssetIds) {
    const normalizedChildAssetId = normalizeChildAssetIdentity(childAssetId);
    if (!rule.supportedChildAssetIds.includes(normalizedChildAssetId)) {
      blockedAssetIds.push(normalizedChildAssetId);
    }
  }
  if (blockedAssetIds.length > 0) {
    withUpdatedState(registry, {
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1 + childAssetIds.length - blockedAssetIds.length,
      blockedAssetCount: blockedAssetIds.length,
      packageReason: "CHILD_ASSET_INCOMPATIBLE",
      lastFailureReason: "CHILD_ASSET_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "CHILD_ASSET_INCOMPATIBLE",
      worldPackageId: null,
      packageValidationStatus: "blocked",
      compatibleAssetCount: 1 + childAssetIds.length - blockedAssetIds.length,
      blockedAssetCount: blockedAssetIds.length,
      packageReason: "CHILD_ASSET_INCOMPATIBLE",
      blockedAssetIds: deepFreeze(blockedAssetIds),
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const normalizedChildAssetIds = [...childAssetIds].sort();
  const worldPackageId = `ATLAS_WORLD_PACKAGE_${hashString(
    stableSerialize({
      packageCategory,
      atlasAssetPackageId,
      assetFamilyId,
      selectedAssetId,
      assetVariantId,
      materialFamilyId,
      paletteProfileId,
      biomeProfileId,
      settlementIdentityId,
      childAssetIds: normalizedChildAssetIds
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;
  const compatibleAssetCount = 1 + normalizedChildAssetIds.length;

  withUpdatedState(registry, {
    worldPackageId,
    packageValidationStatus: "valid",
    compatibleAssetCount,
    blockedAssetCount: 0,
    packageReason: rule.packageReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    worldPackageId,
    packageValidationStatus: "valid",
    compatibleAssetCount,
    blockedAssetCount: 0,
    packageReason: rule.packageReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
