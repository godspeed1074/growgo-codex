const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_VERSION =
  "atlas_population_modular_asset_binding_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "MODULAR_ASSET_BINDING_RULE_COASTAL_VEGETATION_001",
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      compatibleAssetIds: Object.freeze([
        "TREE_BOTTLEBRUSH_001",
        "SHRUB_COASTAL_LOW_001",
        "TREE_EUCALYPTUS_001"
      ]),
      compatibleFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "park"
      ]),
      compatibleMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
      ]),
      compatiblePaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
      ]),
      assetVariantsByAssetId: Object.freeze({
        TREE_BOTTLEBRUSH_001: Object.freeze([
          "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
          "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001"
        ]),
        SHRUB_COASTAL_LOW_001: Object.freeze([
          "VARIANT_SHRUB_COASTAL_LOW_A_001",
          "VARIANT_SHRUB_COASTAL_LOW_B_001",
          "VARIANT_SHRUB_COASTAL_LOW_C_001"
        ]),
        TREE_EUCALYPTUS_001: Object.freeze([
          "VARIANT_TREE_EUCALYPTUS_COASTAL_A_001",
          "VARIANT_TREE_EUCALYPTUS_COASTAL_B_001"
        ])
      }),
      lodProfileIdByAssetId: Object.freeze({
        TREE_BOTTLEBRUSH_001: "LOD_PROFILE_TREE_STANDARD_CLOSE_MEDIUM_DISTANT_001",
        SHRUB_COASTAL_LOW_001: "LOD_PROFILE_SHRUB_LIGHT_CLOSE_MEDIUM_DISTANT_001",
        TREE_EUCALYPTUS_001: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001"
      }),
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_ASSET_BINDING_RULE_SUBURBAN_RESIDENTIAL_001",
      assetFamilyId: "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001",
      compatibleAssetIds: Object.freeze(["TREE_EUCALYPTUS_001"]),
      compatibleFeatureClasses: Object.freeze(["building_footprint"]),
      compatibleMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_ROOF_SUBURBAN_001"
      ]),
      compatiblePaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_SUBURBAN_GARDEN_001"
      ]),
      assetVariantsByAssetId: Object.freeze({
        TREE_EUCALYPTUS_001: Object.freeze([
          "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_A_001",
          "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_B_001"
        ])
      }),
      lodProfileIdByAssetId: Object.freeze({
        TREE_EUCALYPTUS_001: "LOD_PROFILE_RESIDENTIAL_PLACEHOLDER_CLOSE_MEDIUM_DISTANT_001"
      }),
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_ASSET_BINDING_RULE_URBAN_COMMERCIAL_001",
      assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
      compatibleAssetIds: Object.freeze(["TREE_EUCALYPTUS_001"]),
      compatibleFeatureClasses: Object.freeze(["building_footprint"]),
      compatibleMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_TRIM_URBAN_001"
      ]),
      compatiblePaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
      ]),
      assetVariantsByAssetId: Object.freeze({
        TREE_EUCALYPTUS_001: Object.freeze([
          "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
          "VARIANT_COMMERCIAL_URBAN_FRONTAGE_B_001"
        ])
      }),
      lodProfileIdByAssetId: Object.freeze({
        TREE_EUCALYPTUS_001: "LOD_PROFILE_COMMERCIAL_PLACEHOLDER_CLOSE_MEDIUM_DISTANT_001"
      }),
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_ASSET_BINDING_RULE_HERITAGE_CIVIC_001",
      assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
      compatibleAssetIds: Object.freeze([
        "BUILDING_CIVIC_SPORTS_PAVILION_001"
      ]),
      compatibleFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      compatibleMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_WALL_HERITAGE_001"
      ]),
      compatiblePaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
      ]),
      assetVariantsByAssetId: Object.freeze({
        BUILDING_CIVIC_SPORTS_PAVILION_001: Object.freeze([
          "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
          "VARIANT_CIVIC_HERITAGE_PAVILION_B_001"
        ])
      }),
      lodProfileIdByAssetId: Object.freeze({
        BUILDING_CIVIC_SPORTS_PAVILION_001:
          "LOD_PROFILE_CIVIC_BUILDING_CLOSE_MEDIUM_DISTANT_001"
      }),
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_ASSET_BINDING_RULE_INDUSTRIAL_FURNITURE_001",
      assetFamilyId: "ASSET_FAMILY_STREET_FURNITURE_INDUSTRIAL_001",
      compatibleAssetIds: Object.freeze(["SHRUB_COASTAL_LOW_001"]),
      compatibleFeatureClasses: Object.freeze(["civic_site", "roadway"]),
      compatibleMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001"
      ]),
      compatiblePaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_INDUSTRIAL_MUTED_001"
      ]),
      assetVariantsByAssetId: Object.freeze({
        SHRUB_COASTAL_LOW_001: Object.freeze([
          "VARIANT_INDUSTRIAL_STREET_FURNITURE_A_001",
          "VARIANT_INDUSTRIAL_STREET_FURNITURE_B_001"
        ])
      }),
      lodProfileIdByAssetId: Object.freeze({
        SHRUB_COASTAL_LOW_001:
          "LOD_PROFILE_STREET_FURNITURE_CLOSE_MEDIUM_DISTANT_001"
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
    modularAssetBindingVersion: state.modularAssetBindingVersion,
    registeredModularBindingRuleCount: state.registeredModularBindingRuleCount,
    selectedAssetId: state.selectedAssetId,
    assetVariantId: state.assetVariantId,
    variantSelectionReason: state.variantSelectionReason,
    materialAssignmentId: state.materialAssignmentId,
    lodProfileId: state.lodProfileId,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const assetFamilyId = sanitizeString(rule.assetFamilyId);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_MODULAR_BINDING_RULE_ID"), {
      reasonCode: "MISSING_MODULAR_BINDING_RULE_ID"
    });
  }
  if (!assetFamilyId) {
    throw Object.assign(new Error("MISSING_ASSET_FAMILY_ID"), {
      reasonCode: "MISSING_ASSET_FAMILY_ID"
    });
  }
  return deepFreeze({
    ruleId,
    assetFamilyId,
    compatibleAssetIds: deepFreeze((rule.compatibleAssetIds ?? []).map(String)),
    compatibleFeatureClasses: deepFreeze(
      (rule.compatibleFeatureClasses ?? []).map(String)
    ),
    compatibleMaterialFamilyIds: deepFreeze(
      (rule.compatibleMaterialFamilyIds ?? []).map(String)
    ),
    compatiblePaletteProfileIds: deepFreeze(
      (rule.compatiblePaletteProfileIds ?? []).map(String)
    ),
    assetVariantsByAssetId: deepFreeze({
      ...(rule.assetVariantsByAssetId ?? {})
    }),
    lodProfileIdByAssetId: deepFreeze({ ...(rule.lodProfileIdByAssetId ?? {}) }),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    modularAssetBindingVersion: version,
    registeredModularBindingRuleCount: rules.length,
    selectedAssetId: null,
    assetVariantId: null,
    variantSelectionReason: null,
    materialAssignmentId: null,
    lodProfileId: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  assetFamilyId,
  selectedAssetId,
  featureClass,
  materialFamilyId,
  paletteProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.assetFamilyId === assetFamilyId &&
        rule.compatibleAssetIds.includes(selectedAssetId) &&
        rule.compatibleFeatureClasses.includes(featureClass) &&
        rule.compatibleMaterialFamilyIds.includes(materialFamilyId) &&
        rule.compatiblePaletteProfileIds.includes(paletteProfileId)
    ) ?? null
  );
}

function chooseVariant(rule, selectedAssetId, variantSeedSource, neighborIndex) {
  const variants = rule.assetVariantsByAssetId?.[selectedAssetId] ?? [];
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }
  const hash = hashString(variantSeedSource);
  let index = Number.parseInt(hash.slice(0, 8), 16) % variants.length;
  if (variants.length > 1 && Number.isFinite(neighborIndex) && neighborIndex % 2 === 1) {
    index = (index + 1) % variants.length;
  }
  return variants[index];
}

export function createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MODULAR_ASSET_BINDING_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      modularAssetBindingVersion: null,
      registeredModularBindingRuleCount: 0,
      selectedAssetId: null,
      assetVariantId: null,
      variantSelectionReason: null,
      materialAssignmentId: null,
      lodProfileId: null,
      lastFailureReason:
        "ATLAS_POPULATION_MODULAR_ASSET_BINDING_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationModularAssetBinding(
  registry,
  {
    assetFamilyId,
    selectedAssetId,
    featureClass,
    materialFamilyId,
    paletteProfileId,
    selectorSeed,
    deterministicFeatureIdentity,
    coordinate,
    candidateIndex = 0,
    densityTier = null,
    districtType = null,
    lotType = null
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_MODULAR_ASSET_BINDING_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_MODULAR_ASSET_BINDING_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedAssetFamilyId = sanitizeString(assetFamilyId);
  const normalizedSelectedAssetId = sanitizeString(selectedAssetId);
  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedMaterialFamilyId = sanitizeString(materialFamilyId);
  const normalizedPaletteProfileId = sanitizeString(paletteProfileId);

  if (!normalizedAssetFamilyId) {
    registry.__state.lastFailureReason = "MISSING_ASSET_FAMILY_ID";
    throw Object.assign(new Error("MISSING_ASSET_FAMILY_ID"), {
      reasonCode: "MISSING_ASSET_FAMILY_ID"
    });
  }
  if (!normalizedSelectedAssetId) {
    registry.__state.lastFailureReason = "MISSING_SELECTED_ASSET_ID";
    throw Object.assign(new Error("MISSING_SELECTED_ASSET_ID"), {
      reasonCode: "MISSING_SELECTED_ASSET_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedAssetFamilyId,
    normalizedSelectedAssetId,
    normalizedFeatureClass,
    normalizedMaterialFamilyId,
    normalizedPaletteProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason = "INCOMPATIBLE_MODULAR_ASSET_BINDING";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      selectedAssetId: normalizedSelectedAssetId,
      assetVariantId: null,
      variantSelectionReason: "INCOMPATIBLE_MODULAR_ASSET_BINDING",
      materialAssignmentId: null,
      lodProfileId: null,
      reasonCode: "INCOMPATIBLE_MODULAR_ASSET_BINDING"
    });
  }

  const variantSeedSource = stableSerialize({
    assetFamilyId: normalizedAssetFamilyId,
    selectedAssetId: normalizedSelectedAssetId,
    featureClass: normalizedFeatureClass,
    materialFamilyId: normalizedMaterialFamilyId,
    paletteProfileId: normalizedPaletteProfileId,
    selectorSeed: sanitizeString(selectorSeed),
    deterministicFeatureIdentity: sanitizeString(deterministicFeatureIdentity),
    coordinate,
    candidateIndex,
    densityTier: sanitizeString(densityTier),
    districtType: sanitizeString(districtType),
    lotType: sanitizeString(lotType)
  });

  const assetVariantId = chooseVariant(
    rule,
    normalizedSelectedAssetId,
    variantSeedSource,
    Number(candidateIndex)
  );
  const materialAssignmentId = `MATERIAL_ASSIGNMENT_${hashString(
    stableSerialize({
      selectedAssetId: normalizedSelectedAssetId,
      materialFamilyId: normalizedMaterialFamilyId,
      paletteProfileId: normalizedPaletteProfileId
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;
  const lodProfileId =
    rule.lodProfileIdByAssetId?.[normalizedSelectedAssetId] ??
    "LOD_PROFILE_GENERIC_CLOSE_MEDIUM_DISTANT_001";

  registry.__state.selectedAssetId = normalizedSelectedAssetId;
  registry.__state.assetVariantId = assetVariantId;
  registry.__state.variantSelectionReason =
    "DETERMINISTIC_LOCATION_STYLE_COMPATIBLE_SELECTION";
  registry.__state.materialAssignmentId = materialAssignmentId;
  registry.__state.lodProfileId = lodProfileId;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    selectedAssetId: normalizedSelectedAssetId,
    assetVariantId,
    variantSelectionReason:
      "DETERMINISTIC_LOCATION_STYLE_COMPATIBLE_SELECTION",
    materialAssignmentId,
    lodProfileId
  });
}
