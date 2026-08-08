const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_VERSION =
  "atlas_asset_biome_settlement_package_profiles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILE_RULES =
  Object.freeze([
    Object.freeze({
      settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_COASTAL_VILLAGE_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_COASTAL_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_COASTAL_001"]),
      compatibleWorldPackageCategories: Object.freeze(["coastal", "park"]),
      packageSelectionReason:
        "coastal_village_uses_coastal_and_park_world_packages",
      status: "approved"
    }),
    Object.freeze({
      settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_RURAL_TOWN_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_RURAL_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_RURAL_TOWN_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_RURAL_001",
        "BIOME_PROFILE_FOREST_001"
      ]),
      compatibleWorldPackageCategories: Object.freeze(["residential", "park"]),
      packageSelectionReason:
        "rural_town_prefers_residential_and_green_edge_packages",
      status: "approved"
    }),
    Object.freeze({
      settlementPackageProfileId:
        "SETTLEMENT_PACKAGE_PROFILE_SUBURBAN_COMMUNITY_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_SUBURBAN_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_SUBURBAN_001",
        "BIOME_PROFILE_COASTAL_001"
      ]),
      compatibleWorldPackageCategories: Object.freeze(["residential", "park"]),
      packageSelectionReason:
        "suburban_community_prefers_residential_and_park_packages",
      status: "approved"
    }),
    Object.freeze({
      settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_HERITAGE_TOWN_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_URBAN_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_URBAN_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      compatibleWorldPackageCategories: Object.freeze(["civic", "park"]),
      packageSelectionReason:
        "heritage_town_prefers_civic_landmark_and_open_space_packages",
      status: "approved"
    }),
    Object.freeze({
      settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_URBAN_DISTRICT_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_URBAN_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      compatibleWorldPackageCategories: Object.freeze(["commercial", "civic"]),
      packageSelectionReason:
        "urban_district_prefers_commercial_and_civic_packages",
      status: "approved"
    }),
    Object.freeze({
      settlementPackageProfileId: "SETTLEMENT_PACKAGE_PROFILE_INDUSTRIAL_AREA_001",
      biomePackageProfileId: "BIOME_PACKAGE_PROFILE_URBAN_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      compatibleWorldPackageCategories: Object.freeze(["commercial"]),
      packageSelectionReason:
        "industrial_area_limits_world_packages_to_commercial_like_groups",
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
    atlasAssetBiomeSettlementPackageProfilesVersion:
      state.atlasAssetBiomeSettlementPackageProfilesVersion,
    registeredPackageProfileRuleCount: state.registeredPackageProfileRuleCount,
    settlementPackageProfileId: state.settlementPackageProfileId,
    biomePackageProfileId: state.biomePackageProfileId,
    resolvedWorldPackageId: state.resolvedWorldPackageId,
    profileCompatibilityStatus: state.profileCompatibilityStatus,
    packageSelectionReason: state.packageSelectionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const settlementPackageProfileId = sanitizeString(
    rule.settlementPackageProfileId
  );
  const biomePackageProfileId = sanitizeString(rule.biomePackageProfileId);
  if (!settlementPackageProfileId || !biomePackageProfileId) {
    throw Object.assign(new Error("MISSING_PACKAGE_PROFILE_ID"), {
      reasonCode: "MISSING_PACKAGE_PROFILE_ID"
    });
  }
  return deepFreeze({
    settlementPackageProfileId,
    biomePackageProfileId,
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    compatibleWorldPackageCategories: deepFreeze(
      (rule.compatibleWorldPackageCategories ?? []).map(String)
    ),
    packageSelectionReason: sanitizeString(rule.packageSelectionReason),
    status: sanitizeString(rule.status)
  });
}

function createInitialState({ version, registeredPackageProfileRuleCount }) {
  return {
    atlasAssetBiomeSettlementPackageProfilesVersion: version,
    registeredPackageProfileRuleCount,
    settlementPackageProfileId: null,
    biomePackageProfileId: null,
    resolvedWorldPackageId: null,
    profileCompatibilityStatus: null,
    packageSelectionReason: null,
    lastFailureReason: null
  };
}

export function createDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles: true,
    __rules: normalizedRules,
    __state: createInitialState({
      version,
      registeredPackageProfileRuleCount: normalizedRules.length
    })
  };
}

export function getDeveloperOnlyAtlasAssetBiomeSettlementPackageProfilesStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles) {
    return freezeStatus(
      createInitialState({
        version: null,
        registeredPackageProfileRuleCount: 0
      })
    );
  }
  return freezeStatus(registry.__state);
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetBiomeSettlementPackageProfiles) {
    throw Object.assign(
      new Error("ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_UNAVAILABLE"),
      { reasonCode: "ATLAS_ASSET_BIOME_SETTLEMENT_PACKAGE_PROFILES_UNAVAILABLE" }
    );
  }
}

function withUpdatedState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

export function resolveDeveloperOnlyAtlasAssetBiomeSettlementPackageProfile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const settlementIdentityId = sanitizeString(input.settlementIdentityId);
  const biomeProfileId = sanitizeString(input.biomeProfileId);
  const worldPackageCategory = sanitizeString(input.worldPackageCategory);
  const worldPackageId = sanitizeString(input.worldPackageId);

  const rule = registry.__rules.find(
    (candidate) =>
      candidate.supportedSettlementIdentityIds.includes(settlementIdentityId) &&
      candidate.supportedBiomeProfileIds.includes(biomeProfileId)
  );

  if (!rule) {
    withUpdatedState(registry, {
      settlementPackageProfileId: null,
      biomePackageProfileId: null,
      resolvedWorldPackageId: null,
      profileCompatibilityStatus: "blocked",
      packageSelectionReason: "PROFILE_RULE_NOT_FOUND",
      lastFailureReason: "PROFILE_RULE_NOT_FOUND"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "PROFILE_RULE_NOT_FOUND",
      settlementPackageProfileId: null,
      biomePackageProfileId: null,
      resolvedWorldPackageId: null,
      profileCompatibilityStatus: "blocked",
      packageSelectionReason: "PROFILE_RULE_NOT_FOUND",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  if (!rule.compatibleWorldPackageCategories.includes(worldPackageCategory)) {
    withUpdatedState(registry, {
      settlementPackageProfileId: rule.settlementPackageProfileId,
      biomePackageProfileId: rule.biomePackageProfileId,
      resolvedWorldPackageId: null,
      profileCompatibilityStatus: "blocked",
      packageSelectionReason: "WORLD_PACKAGE_CATEGORY_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_CATEGORY_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_CATEGORY_INCOMPATIBLE",
      settlementPackageProfileId: rule.settlementPackageProfileId,
      biomePackageProfileId: rule.biomePackageProfileId,
      resolvedWorldPackageId: null,
      profileCompatibilityStatus: "blocked",
      packageSelectionReason: "WORLD_PACKAGE_CATEGORY_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const resolvedWorldPackageId = `ATLAS_PROFILED_WORLD_PACKAGE_${hashString(
    stableSerialize({
      settlementIdentityId,
      biomeProfileId,
      worldPackageCategory,
      worldPackageId
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  withUpdatedState(registry, {
    settlementPackageProfileId: rule.settlementPackageProfileId,
    biomePackageProfileId: rule.biomePackageProfileId,
    resolvedWorldPackageId,
    profileCompatibilityStatus: "valid",
    packageSelectionReason: rule.packageSelectionReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    settlementPackageProfileId: rule.settlementPackageProfileId,
    biomePackageProfileId: rule.biomePackageProfileId,
    resolvedWorldPackageId,
    profileCompatibilityStatus: "valid",
    packageSelectionReason: rule.packageSelectionReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
