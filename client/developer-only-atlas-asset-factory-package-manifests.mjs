const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_VERSION =
  "atlas_asset_factory_package_manifests_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFEST_RULES =
  Object.freeze([
    Object.freeze({
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_001",
      selectedAssetId: "TREE_BOTTLEBRUSH_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_A_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_001",
      manifestComponentCount: 1,
      manifestValidationStatus: "valid",
      manifestReason:
        "coastal tree manifest preserves asset identity component material attachment and export metadata",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_COMPACT_001",
      selectedAssetId: "TREE_BOTTLEBRUSH_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_B_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      manifestComponentCount: 1,
      manifestValidationStatus: "valid",
      manifestReason:
        "compact coastal tree manifest preserves lightweight component and export requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001",
      selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001",
      manifestComponentCount: 6,
      manifestValidationStatus: "valid",
      manifestReason:
        "heritage civic manifest preserves envelope materials attachment metadata and export validation requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_COMPACT_001",
      selectedAssetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_B_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      manifestComponentCount: 6,
      manifestValidationStatus: "valid",
      manifestReason:
        "compact heritage civic manifest preserves compact envelope and export validation requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_URBAN_COMMERCIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_URBAN_COMMERCIAL_001",
      selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001",
      componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_URBAN_COMMERCIAL_A_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_URBAN_COMMERCIAL_001",
      manifestComponentCount: 5,
      manifestValidationStatus: "valid",
      manifestReason:
        "urban commercial manifest preserves frontage components materials and naming/export requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_RURAL_RESIDENTIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_RURAL_RESIDENTIAL_001",
      selectedAssetId: "BUILDING_GENERIC_PLACEHOLDER_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_SUBURBAN_ENVELOPE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_RURAL_RESIDENTIAL_A_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_RURAL_RESIDENTIAL_001",
      manifestComponentCount: 6,
      manifestValidationStatus: "valid",
      manifestReason:
        "rural residential manifest preserves component material attachment and export requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001",
      selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_A_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001",
      manifestComponentCount: 2,
      manifestValidationStatus: "valid",
      manifestReason:
        "industrial edge manifest preserves streetscape trim fence metadata and export requirements",
      status: "approved"
    }),
    Object.freeze({
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_COMPACT_001",
      selectedAssetId: "INDUSTRIAL_EDGE_PLACEHOLDER_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_B_001",
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      manifestComponentCount: 2,
      manifestValidationStatus: "valid",
      manifestReason:
        "compact industrial edge manifest preserves lightweight streetscape export requirements",
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
    atlasAssetFactoryPackageManifestsVersion:
      state.atlasAssetFactoryPackageManifestsVersion,
    registeredAssetFactoryManifestRuleCount:
      state.registeredAssetFactoryManifestRuleCount,
    assetPackageManifestId: state.assetPackageManifestId,
    exportValidationProfileId: state.exportValidationProfileId,
    manifestComponentCount: state.manifestComponentCount,
    manifestValidationStatus: state.manifestValidationStatus,
    manifestReason: state.manifestReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const assetPackageManifestId = sanitizeString(rule.assetPackageManifestId);
  const exportValidationProfileId = sanitizeString(
    rule.exportValidationProfileId
  );
  const exportContractId = sanitizeString(rule.exportContractId);
  const selectedAssetId = sanitizeString(rule.selectedAssetId);
  const componentRecipeId = sanitizeString(rule.componentRecipeId);
  const materialSlotSetId = sanitizeString(rule.materialSlotSetId);
  const attachmentMetadataProfileId = sanitizeString(
    rule.attachmentMetadataProfileId
  );
  const manifestComponentCount = Number(rule.manifestComponentCount ?? 0);
  if (
    !assetPackageManifestId ||
    !exportValidationProfileId ||
    !exportContractId ||
    !selectedAssetId ||
    !componentRecipeId ||
    !materialSlotSetId ||
    !attachmentMetadataProfileId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_ASSET_FACTORY_PACKAGE_MANIFEST_RULE"),
      { reasonCode: "INCOMPLETE_ASSET_FACTORY_PACKAGE_MANIFEST_RULE" }
    );
  }
  return deepFreeze({
    assetPackageManifestId,
    exportValidationProfileId,
    exportContractId,
    selectedAssetId,
    componentRecipeId,
    materialSlotSetId,
    attachmentMetadataProfileId,
    manifestComponentCount,
    manifestValidationStatus: sanitizeString(rule.manifestValidationStatus),
    manifestReason: sanitizeString(rule.manifestReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasAssetFactoryPackageManifestsVersion: version,
    registeredAssetFactoryManifestRuleCount: rules.length,
    assetPackageManifestId: null,
    exportValidationProfileId: null,
    manifestComponentCount: 0,
    manifestValidationStatus: null,
    manifestReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryPackageManifests) {
    throw Object.assign(
      new Error("ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_UNAVAILABLE"),
      { reasonCode: "ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_UNAVAILABLE" }
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
    assetPackageManifestId: null,
    exportValidationProfileId: null,
    manifestComponentCount: 0,
    manifestValidationStatus: "blocked",
    manifestReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    assetPackageManifestId: null,
    exportValidationProfileId: null,
    manifestComponentCount: 0,
    manifestValidationStatus: "blocked",
    manifestReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasAssetFactoryPackageManifests({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFESTS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_PACKAGE_MANIFEST_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasAssetFactoryPackageManifests: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasAssetFactoryPackageManifestsStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryPackageManifests) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasAssetFactoryPackageManifest(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const exportContractId = sanitizeString(input.exportContractId);
  const selectedAssetId = sanitizeString(input.selectedAssetId);
  const componentRecipeId = sanitizeString(input.componentRecipeId);
  const materialSlotSetId = sanitizeString(input.materialSlotSetId);
  const attachmentMetadataProfileId = sanitizeString(
    input.attachmentMetadataProfileId
  );

  const contractMatches = registry.__rules.filter(
    (candidate) => candidate.exportContractId === exportContractId
  );
  if (contractMatches.length === 0) {
    return fail(registry, "ASSET_FACTORY_MANIFEST_EXPORT_CONTRACT_NOT_FOUND");
  }
  const assetMatches = contractMatches.filter(
    (candidate) => candidate.selectedAssetId === selectedAssetId
  );
  if (assetMatches.length === 0) {
    return fail(registry, "ASSET_FACTORY_MANIFEST_ASSET_ID_INCOMPATIBLE");
  }
  const recipeMatches = assetMatches.filter(
    (candidate) => candidate.componentRecipeId === componentRecipeId
  );
  if (recipeMatches.length === 0) {
    return fail(
      registry,
      "ASSET_FACTORY_MANIFEST_COMPONENT_RECIPE_INCOMPATIBLE"
    );
  }
  const materialMatches = recipeMatches.filter(
    (candidate) => candidate.materialSlotSetId === materialSlotSetId
  );
  if (materialMatches.length === 0) {
    return fail(
      registry,
      "ASSET_FACTORY_MANIFEST_MATERIAL_SLOT_INCOMPATIBLE"
    );
  }
  const rule = materialMatches.find(
    (candidate) =>
      candidate.attachmentMetadataProfileId === attachmentMetadataProfileId
  );
  if (!rule) {
    return fail(
      registry,
      "ASSET_FACTORY_MANIFEST_ATTACHMENT_METADATA_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    assetPackageManifestId: rule.assetPackageManifestId,
    exportValidationProfileId: rule.exportValidationProfileId,
    manifestComponentCount: rule.manifestComponentCount,
    manifestValidationStatus: rule.manifestValidationStatus,
    manifestReason: rule.manifestReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    assetPackageManifestId: rule.assetPackageManifestId,
    exportValidationProfileId: rule.exportValidationProfileId,
    manifestComponentCount: rule.manifestComponentCount,
    manifestValidationStatus: rule.manifestValidationStatus,
    manifestReason: rule.manifestReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
