const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_VERSION =
  "atlas_variant_structural_compatibility_profiles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_COASTAL_TREE_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
      assetVariantEnvelopeId: "ASSET_VARIANT_ENVELOPE_COASTAL_TREE_MEDIUM_001",
      selectedVariantProfileId: "SELECTED_VARIANT_PROFILE_COASTAL_TREE_A_001",
      supportedLotTypes: Object.freeze([
        "rural_block",
        "standalone_lot",
        "green_edge"
      ]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "residential"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_COASTAL_001",
        "STREETSCAPE_PROFILE_RURAL_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium", "large"]),
      variantConstraintReason:
        "coastal_tree_variant_a_fits_medium_scale_open_edge_and_coastal_settlement_context",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_COASTAL_TREE_B_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001",
      assetVariantEnvelopeId: "ASSET_VARIANT_ENVELOPE_COASTAL_TREE_COMPACT_001",
      selectedVariantProfileId: "SELECTED_VARIANT_PROFILE_COASTAL_TREE_B_001",
      supportedLotTypes: Object.freeze(["rural_block", "green_edge"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_COASTAL_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium"]),
      variantConstraintReason:
        "coastal_tree_variant_b_fits_compact_coastal_buffers_and_medium_density",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_HERITAGE_PAVILION_A_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
      assetVariantEnvelopeId: "ASSET_VARIANT_ENVELOPE_HERITAGE_CIVIC_STANDARD_001",
      selectedVariantProfileId:
        "SELECTED_VARIANT_PROFILE_HERITAGE_PAVILION_A_001",
      supportedLotTypes: Object.freeze([
        "civic_forecourt_lot",
        "standalone_lot"
      ]),
      supportedDistrictTypes: Object.freeze(["civic"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_HERITAGE_001",
        "STREETSCAPE_PROFILE_INDUSTRIAL_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium", "large"]),
      variantConstraintReason:
        "heritage_pavilion_variant_a_fits_formal_civic_forecourt_and_heritage_settlement_context",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_HERITAGE_PAVILION_B_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_B_001",
      assetVariantEnvelopeId: "ASSET_VARIANT_ENVELOPE_HERITAGE_CIVIC_COMPACT_001",
      selectedVariantProfileId:
        "SELECTED_VARIANT_PROFILE_HERITAGE_PAVILION_B_001",
      supportedLotTypes: Object.freeze(["civic_forecourt_lot"]),
      supportedDistrictTypes: Object.freeze(["civic"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_HERITAGE_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium"]),
      variantConstraintReason:
        "heritage_pavilion_variant_b_fits_compact_formal_civic_forecourts_only",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_SUBURBAN_PLACEHOLDER_A_001",
      assetVariantId: "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_A_001",
      assetVariantEnvelopeId:
        "ASSET_VARIANT_ENVELOPE_SUBURBAN_RESIDENTIAL_STANDARD_001",
      selectedVariantProfileId:
        "SELECTED_VARIANT_PROFILE_SUBURBAN_RESIDENTIAL_A_001",
      supportedLotTypes: Object.freeze(["standalone_lot", "corner_lot"]),
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_COASTAL_001",
        "STREETSCAPE_PROFILE_RURAL_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium"]),
      variantConstraintReason:
        "suburban_variant_a_fits_standard_lot_residential_and_garden_edge_context",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "VARIANT_STRUCTURAL_RULE_COMMERCIAL_FRONTAGE_A_001",
      assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
      assetVariantEnvelopeId:
        "ASSET_VARIANT_ENVELOPE_COMMERCIAL_FRONTAGE_STANDARD_001",
      selectedVariantProfileId:
        "SELECTED_VARIANT_PROFILE_COMMERCIAL_FRONTAGE_A_001",
      supportedLotTypes: Object.freeze(["standalone_lot", "corner_lot"]),
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use"]),
      supportedStreetscapeProfileIds: Object.freeze([
        "STREETSCAPE_PROFILE_URBAN_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      supportedDensityTiers: Object.freeze(["medium", "large"]),
      variantConstraintReason:
        "commercial_frontage_variant_a_fits_urban_streetwall_and_higher_density_context",
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasVariantStructuralCompatibilityProfilesVersion:
      state.atlasVariantStructuralCompatibilityProfilesVersion,
    registeredVariantCompatibilityRuleCount:
      state.registeredVariantCompatibilityRuleCount,
    assetVariantEnvelopeId: state.assetVariantEnvelopeId,
    structuralCompatibilityStatus: state.structuralCompatibilityStatus,
    selectedVariantProfileId: state.selectedVariantProfileId,
    variantConstraintReason: state.variantConstraintReason,
    variantSelectionSeed: state.variantSelectionSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const assetVariantId = sanitizeString(rule.assetVariantId);
  const assetVariantEnvelopeId = sanitizeString(rule.assetVariantEnvelopeId);
  const selectedVariantProfileId = sanitizeString(rule.selectedVariantProfileId);
  if (!ruleId || !assetVariantId || !assetVariantEnvelopeId || !selectedVariantProfileId) {
    throw Object.assign(
      new Error("INCOMPLETE_VARIANT_STRUCTURAL_COMPATIBILITY_RULE"),
      { reasonCode: "INCOMPLETE_VARIANT_STRUCTURAL_COMPATIBILITY_RULE" }
    );
  }
  return deepFreeze({
    ruleId,
    assetVariantId,
    assetVariantEnvelopeId,
    selectedVariantProfileId,
    supportedLotTypes: deepFreeze((rule.supportedLotTypes ?? []).map(String)),
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    supportedStreetscapeProfileIds: deepFreeze(
      (rule.supportedStreetscapeProfileIds ?? []).map(String)
    ),
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    supportedDensityTiers: deepFreeze(
      (rule.supportedDensityTiers ?? []).map(String)
    ),
    variantConstraintReason: sanitizeString(rule.variantConstraintReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasVariantStructuralCompatibilityProfilesVersion: version,
    registeredVariantCompatibilityRuleCount: rules.length,
    assetVariantEnvelopeId: null,
    structuralCompatibilityStatus: null,
    selectedVariantProfileId: null,
    variantConstraintReason: null,
    variantSelectionSeed: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles) {
    throw Object.assign(
      new Error("ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_UNAVAILABLE"),
      { reasonCode: "ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
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

function fail(registry, reasonCode) {
  updateState(registry, {
    assetVariantEnvelopeId: null,
    structuralCompatibilityStatus: "blocked",
    selectedVariantProfileId: null,
    variantConstraintReason: reasonCode,
    variantSelectionSeed: null,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    assetVariantEnvelopeId: null,
    structuralCompatibilityStatus: "blocked",
    selectedVariantProfileId: null,
    variantConstraintReason: reasonCode,
    variantSelectionSeed: null,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_PROFILES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_VARIANT_STRUCTURAL_COMPATIBILITY_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasVariantStructuralCompatibilityProfilesStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasVariantStructuralCompatibilityProfiles
  ) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasVariantStructuralCompatibilityProfile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const assetVariantId = sanitizeString(input.assetVariantId);
  const lotType = sanitizeString(input.lotType);
  const districtType = sanitizeString(input.districtType);
  const streetscapeProfileId = sanitizeString(input.streetscapeProfileId);
  const settlementIdentityId = sanitizeString(input.settlementIdentityId);
  const densityTier = sanitizeString(input.densityTier);

  const rule = registry.__rules.find(
    (candidate) => candidate.assetVariantId === assetVariantId
  );
  if (!rule) {
    return fail(registry, "VARIANT_STRUCTURAL_RULE_NOT_FOUND");
  }
  if (!rule.supportedLotTypes.includes(lotType)) {
    return fail(registry, "VARIANT_STRUCTURAL_LOT_INCOMPATIBLE");
  }
  if (!rule.supportedDistrictTypes.includes(districtType)) {
    return fail(registry, "VARIANT_STRUCTURAL_DISTRICT_INCOMPATIBLE");
  }
  if (!rule.supportedStreetscapeProfileIds.includes(streetscapeProfileId)) {
    return fail(registry, "VARIANT_STRUCTURAL_STREETSCAPE_INCOMPATIBLE");
  }
  if (!rule.supportedSettlementIdentityIds.includes(settlementIdentityId)) {
    return fail(registry, "VARIANT_STRUCTURAL_SETTLEMENT_INCOMPATIBLE");
  }
  if (!rule.supportedDensityTiers.includes(densityTier)) {
    return fail(registry, "VARIANT_STRUCTURAL_DENSITY_INCOMPATIBLE");
  }

  const variantSelectionSeed = `VARIANT_PROFILE_${hashString(
    stableSerialize({
      assetVariantId,
      lotType,
      districtType,
      streetscapeProfileId,
      settlementIdentityId,
      densityTier
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  updateState(registry, {
    assetVariantEnvelopeId: rule.assetVariantEnvelopeId,
    structuralCompatibilityStatus: "valid",
    selectedVariantProfileId: rule.selectedVariantProfileId,
    variantConstraintReason: rule.variantConstraintReason,
    variantSelectionSeed,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    assetVariantEnvelopeId: rule.assetVariantEnvelopeId,
    structuralCompatibilityStatus: "valid",
    selectedVariantProfileId: rule.selectedVariantProfileId,
    variantConstraintReason: rule.variantConstraintReason,
    variantSelectionSeed,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
