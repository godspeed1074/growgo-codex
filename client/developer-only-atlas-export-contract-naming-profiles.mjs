const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_VERSION =
  "atlas_export_contract_naming_profiles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILE_RULES =
  Object.freeze([
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_VEGETATION_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_VEGETATION_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_COASTAL_VEGETATION_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
      selectedAssetId: "TREE_BOTTLEBRUSH_001",
      assetVersionPolicy: "asset_id_plus_profile_revision_v1",
      exportContractReason:
        "coastal vegetation export contract preserves native family identity naming and metadata requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId:
        "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_COMPACT_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_VEGETATION_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_VEGETATION_COMPACT_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
      selectedAssetId: "TREE_BOTTLEBRUSH_001",
      assetVersionPolicy: "asset_id_plus_profile_revision_v1",
      exportContractReason:
        "compact coastal vegetation export contract preserves lightweight naming and metadata requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_BUILDINGS_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_BUILDINGS_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
      selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      assetVersionPolicy: "asset_id_family_variant_revision_v1",
      exportContractReason:
        "heritage civic export contract preserves building family naming metadata and version requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_COMPACT_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_BUILDINGS_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_BUILDINGS_COMPACT_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
      selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      assetVersionPolicy: "asset_id_family_variant_revision_v1",
      exportContractReason:
        "compact heritage civic export contract preserves compact building naming metadata and version requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_URBAN_COMMERCIAL_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_BUILDINGS_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_BUILDINGS_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_URBAN_COMMERCIAL_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_URBAN_COMMERCIAL_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
      selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001",
      assetVersionPolicy: "asset_id_family_variant_revision_v1",
      exportContractReason:
        "urban commercial export contract preserves frontage naming and GLB metadata requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_RURAL_RESIDENTIAL_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_BUILDINGS_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_BUILDINGS_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_RURAL_RESIDENTIAL_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_RURAL_RESIDENTIAL_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_RESIDENTIAL_SUBURBAN_001",
      selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001",
      assetVersionPolicy: "asset_id_family_variant_revision_v1",
      exportContractReason:
        "rural residential export contract preserves envelope naming and metadata requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_STREETSCAPE_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_STREETSCAPE_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_INDUSTRIAL_EDGE_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_STREETSCAPE_EDGE_001",
      selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
      assetVersionPolicy: "asset_id_profile_revision_v1",
      exportContractReason:
        "industrial edge export contract preserves streetscape naming metadata and version requirements",
      status: "approved"
    }),
    Object.freeze({
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_COMPACT_001",
      assetNamingProfileId: "ATLAS_ASSET_NAMING_PROFILE_STREETSCAPE_001",
      glbExportProfileId: "ATLAS_GLB_EXPORT_PROFILE_STREETSCAPE_COMPACT_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_STREETSCAPE_EDGE_001",
      selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
      assetVersionPolicy: "asset_id_profile_revision_v1",
      exportContractReason:
        "compact industrial edge export contract preserves lightweight streetscape naming metadata and version requirements",
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
    atlasExportContractNamingProfilesVersion:
      state.atlasExportContractNamingProfilesVersion,
    registeredExportContractRuleCount: state.registeredExportContractRuleCount,
    exportContractId: state.exportContractId,
    assetNamingProfileId: state.assetNamingProfileId,
    glbExportProfileId: state.glbExportProfileId,
    assetVersionPolicy: state.assetVersionPolicy,
    exportContractReason: state.exportContractReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const exportContractId = sanitizeString(rule.exportContractId);
  const assetNamingProfileId = sanitizeString(rule.assetNamingProfileId);
  const glbExportProfileId = sanitizeString(rule.glbExportProfileId);
  const attachmentMetadataProfileId = sanitizeString(
    rule.attachmentMetadataProfileId
  );
  const glbPreparationProfileId = sanitizeString(rule.glbPreparationProfileId);
  const modularBibleFamilyId = sanitizeString(rule.modularBibleFamilyId);
  const selectedAssetId = sanitizeString(rule.selectedAssetId);
  const assetVersionPolicy = sanitizeString(rule.assetVersionPolicy);
  if (
    !exportContractId ||
    !assetNamingProfileId ||
    !glbExportProfileId ||
    !attachmentMetadataProfileId ||
    !glbPreparationProfileId ||
    !modularBibleFamilyId ||
    !selectedAssetId ||
    !assetVersionPolicy
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_EXPORT_CONTRACT_RULE"),
      { reasonCode: "INCOMPLETE_EXPORT_CONTRACT_RULE" }
    );
  }
  return deepFreeze({
    exportContractId,
    assetNamingProfileId,
    glbExportProfileId,
    attachmentMetadataProfileId,
    glbPreparationProfileId,
    modularBibleFamilyId,
    selectedAssetId,
    assetVersionPolicy,
    exportContractReason: sanitizeString(rule.exportContractReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasExportContractNamingProfilesVersion: version,
    registeredExportContractRuleCount: rules.length,
    exportContractId: null,
    assetNamingProfileId: null,
    glbExportProfileId: null,
    assetVersionPolicy: null,
    exportContractReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasExportContractNamingProfiles) {
    throw Object.assign(
      new Error("ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_UNAVAILABLE"),
      { reasonCode: "ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode) {
  updateState(registry, {
    exportContractId: null,
    assetNamingProfileId: null,
    glbExportProfileId: null,
    assetVersionPolicy: null,
    exportContractReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    exportContractId: null,
    assetNamingProfileId: null,
    glbExportProfileId: null,
    assetVersionPolicy: null,
    exportContractReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasExportContractNamingProfiles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_EXPORT_CONTRACT_NAMING_PROFILE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasExportContractNamingProfiles: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasExportContractNamingProfilesStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasExportContractNamingProfiles) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasExportContractNamingProfile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const attachmentMetadataProfileId = sanitizeString(
    input.attachmentMetadataProfileId
  );
  const glbPreparationProfileId = sanitizeString(input.glbPreparationProfileId);
  const modularBibleFamilyId = sanitizeString(input.modularBibleFamilyId);
  const selectedAssetId = sanitizeString(input.selectedAssetId);

  const attachmentMatches = registry.__rules.filter(
    (candidate) =>
      candidate.attachmentMetadataProfileId === attachmentMetadataProfileId
  );
  if (attachmentMatches.length === 0) {
    return fail(registry, "EXPORT_CONTRACT_ATTACHMENT_METADATA_NOT_FOUND");
  }
  const glbPreparationMatches = attachmentMatches.filter(
    (candidate) =>
      candidate.glbPreparationProfileId === glbPreparationProfileId
  );
  if (glbPreparationMatches.length === 0) {
    return fail(registry, "EXPORT_CONTRACT_GLB_PREPARATION_INCOMPATIBLE");
  }
  const familyMatches = glbPreparationMatches.filter(
    (candidate) => candidate.modularBibleFamilyId === modularBibleFamilyId
  );
  if (familyMatches.length === 0) {
    return fail(registry, "EXPORT_CONTRACT_MODULAR_FAMILY_INCOMPATIBLE");
  }
  const rule = familyMatches.find(
    (candidate) => candidate.selectedAssetId === selectedAssetId
  );
  if (!rule) {
    return fail(registry, "EXPORT_CONTRACT_ASSET_ID_INCOMPATIBLE");
  }

  updateState(registry, {
    exportContractId: rule.exportContractId,
    assetNamingProfileId: rule.assetNamingProfileId,
    glbExportProfileId: rule.glbExportProfileId,
    assetVersionPolicy: rule.assetVersionPolicy,
    exportContractReason: rule.exportContractReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    exportContractId: rule.exportContractId,
    assetNamingProfileId: rule.assetNamingProfileId,
    glbExportProfileId: rule.glbExportProfileId,
    assetVersionPolicy: rule.assetVersionPolicy,
    exportContractReason: rule.exportContractReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
